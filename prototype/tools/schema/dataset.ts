/**
 * Loads a data root (normally prototype/data) into typed tables:
 *
 *   <root>/canonical/*.csv                 the canonical tables (canonical.ts)
 *   <root>/canonical/notation/*.json       notation files (notation.ts), named by editions.notation_file
 *   <root>/canonical/validation.json       optional validator options (ValidationOptions)
 *   <root>/design/DESIGN_VALUES.md         the design-value register (design-values.ts)
 *   <root>/raw/…                           keying files (raw-keying.ts)
 *
 * Loading is split in two so tests can seed errors: loadRaw() reads files as text records,
 * parseDataset() types them.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TABLE_SPECS, emptyTables, parseRows, type TableName, type Tables } from './canonical.ts';
import { parseDesignValues, type DesignValue } from './design-values.ts';
import { parseNotation, type Notation } from './notation.ts';
import { rawFromText, readRawTable, cloneRaw, type RawTable } from './raw-table.ts';
import { CELL_COLUMNS, CROP_COLUMNS, STATUS_COLUMNS, parseKeyingRows, type CellRow, type CropRow, type StatusRow } from './raw-keying.ts';
import { issue, type Issue } from './issues.ts';
import { cmpStr } from './csv.ts';

export interface ValidationOptions {
  /** City id from which V05 checks reachability; null: the city named "London". */
  originCity: string | null;
  /** V05: every covered city must be reachable from the origin within this many hours. */
  reachHours: number;
  /** V05: how many consecutive start days (from each edition's first valid day) the reach check samples. */
  reachSampleDays: number;
  /** V05: a frontier pair is connected on day D if the other side is reached by this many hours after the end of D. */
  frontierHours: number;
  /** V05: longest wait between the two trains of a through link. */
  maxThroughWaitHours: number;
  /** Open-ended editions (no valid_to) are checked this many days from valid_from. */
  openEndedDays: number;
}

export const DEFAULT_OPTIONS: ValidationOptions = {
  originCity: null, reachHours: 72, reachSampleDays: 7, frontierHours: 6, maxThroughWaitHours: 12, openEndedDays: 366,
};

export interface RawDataset {
  /** The data root (for messages and V10 file checks). */
  dir: string;
  tables: Record<TableName, RawTable>;
  designText: string | null;
  /** Notation files by path relative to canonical/ (e.g. "notation/SYN_E1.json"). */
  notationTexts: Map<string, string>;
  validationText: string | null;
  /** Every file under raw/, relative to raw/, '/'-separated, sorted. */
  rawFiles: string[];
  /** status.csv, <source>/<table>/crops.csv and <source>/<table>/<crop>.R.csv contents. */
  rawTexts: Map<string, string>;
}

export interface Dataset {
  dir: string;
  raw: RawDataset;
  t: Tables;
  designValues: DesignValue[];
  /** Notation by edition_id. */
  notations: Map<string, Notation>;
  options: ValidationOptions;
  status: StatusRow[];
  /** crops.csv rows by "<source_id>/<table_ref>". */
  crops: Map<string, CropRow[]>;
  /** Resolved cells by "<source_id>/<table_ref>/<crop_id>". */
  resolved: Map<string, CellRow[]>;
  /** Problems found while parsing (V01 tables, V02 design values, V07 notation, V10 keying files). */
  issues: Issue[];
}

function walk(dir: string, rel = ''): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort(cmpStr)) {
    if (name === 'scans' || name.startsWith('.')) continue;
    const p = join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    if (statSync(p).isDirectory()) out.push(...walk(p, r));
    else out.push(r);
  }
  return out;
}

export function loadRaw(root: string): RawDataset {
  const canon = join(root, 'canonical');
  const tables = {} as Record<TableName, RawTable>;
  for (const s of TABLE_SPECS) tables[s.name] = readRawTable(join(canon, s.file), s.file);
  const dvPath = join(root, 'design', 'DESIGN_VALUES.md');
  const notationTexts = new Map<string, string>();
  for (const f of walk(join(canon, 'notation'), 'notation')) if (f.endsWith('.json')) notationTexts.set(f, readFileSync(join(canon, f), 'utf8'));
  const vPath = join(canon, 'validation.json');
  const rawDir = join(root, 'raw');
  const rawFiles = walk(rawDir);
  const rawTexts = new Map<string, string>();
  for (const f of rawFiles) {
    if (f === 'status.csv' || /^[^/]+\/[^/]+\/crops\.csv$/.test(f) || /^[^/]+\/[^/]+\/[^/]+\.R\.csv$/.test(f)) {
      rawTexts.set(f, readFileSync(join(rawDir, f), 'utf8'));
    }
  }
  return {
    dir: root, tables, designText: existsSync(dvPath) ? readFileSync(dvPath, 'utf8') : null, notationTexts,
    validationText: existsSync(vPath) ? readFileSync(vPath, 'utf8') : null, rawFiles, rawTexts,
  };
}

export function cloneRawDataset(r: RawDataset): RawDataset {
  const tables = {} as Record<TableName, RawTable>;
  for (const s of TABLE_SPECS) tables[s.name] = cloneRaw(r.tables[s.name]);
  return { ...r, tables, notationTexts: new Map(r.notationTexts), rawFiles: [...r.rawFiles], rawTexts: new Map(r.rawTexts) };
}

function parseOptions(text: string | null, issues: Issue[]): ValidationOptions {
  const o: ValidationOptions = { ...DEFAULT_OPTIONS };
  if (text === null) return o;
  let j: unknown;
  try { j = JSON.parse(text); } catch (e) { issues.push(issue('V05', 'error', 'validation.json', `not valid JSON: ${(e as Error).message}`)); return o; }
  if (typeof j !== 'object' || j === null) return o;
  const v = j as Record<string, unknown>;
  if (typeof v.originCity === 'string') o.originCity = v.originCity;
  for (const k of ['reachHours', 'reachSampleDays', 'frontierHours', 'maxThroughWaitHours', 'openEndedDays'] as const) {
    const x = v[k];
    if (x === undefined) continue;
    if (typeof x === 'number' && Number.isInteger(x) && x > 0) o[k] = x;
    else issues.push(issue('V05', 'error', 'validation.json', `${k} must be a positive integer`));
  }
  return o;
}

export function parseDataset(raw: RawDataset): Dataset {
  const issues: Issue[] = [];
  const t = emptyTables();
  for (const s of TABLE_SPECS) {
    const res = parseRows(s, raw.tables[s.name]);
    (t as unknown as Record<string, unknown[]>)[s.name] = res.rows;
    issues.push(...res.issues);
  }
  let designValues: DesignValue[] = [];
  if (raw.designText === null) issues.push(issue('V02', 'error', 'design/DESIGN_VALUES.md', 'the design-value register is missing'));
  else {
    const dv = parseDesignValues(raw.designText);
    designValues = dv.values;
    issues.push(...dv.issues);
  }
  const notations = new Map<string, Notation>();
  const used = new Set<string>();
  for (const e of t.editions) {
    if (!e.notation_file) continue;
    used.add(e.notation_file);
    const text = raw.notationTexts.get(e.notation_file);
    if (text === undefined) { issues.push(issue('V07', 'error', `editions.csv:${e.line}`, `notation file canonical/${e.notation_file} not found`)); continue; }
    const p = parseNotation(text, `canonical/${e.notation_file}`);
    issues.push(...p.issues);
    if (p.notation) {
      if (p.notation.edition_id !== e.edition_id) issues.push(issue('V07', 'error', `canonical/${e.notation_file}`, `edition_id "${p.notation.edition_id}" but editions.csv names it for ${e.edition_id}`));
      else notations.set(e.edition_id, p.notation);
    }
  }
  for (const f of [...raw.notationTexts.keys()].sort(cmpStr)) if (!used.has(f)) issues.push(issue('V07', 'warning', `canonical/${f}`, 'notation file not named by any edition'));
  const options = parseOptions(raw.validationText, issues);

  let status: StatusRow[] = [];
  const statusText = raw.rawTexts.get('status.csv');
  if (statusText !== undefined) {
    const r = parseKeyingRows<StatusRow>(STATUS_COLUMNS, rawFromText('raw/status.csv', statusText), 'V10');
    status = r.rows; issues.push(...r.issues);
  }
  const crops = new Map<string, CropRow[]>();
  const resolved = new Map<string, CellRow[]>();
  for (const [path, text] of [...raw.rawTexts.entries()].sort((a, b) => cmpStr(a[0], b[0]))) {
    const parts = path.split('/');
    if (parts.length !== 3) continue;
    const key = `${parts[0]}/${parts[1]}`;
    if (parts[2] === 'crops.csv') {
      const r = parseKeyingRows<CropRow>(CROP_COLUMNS, rawFromText(`raw/${path}`, text), 'V10');
      crops.set(key, r.rows); issues.push(...r.issues);
    } else if (parts[2]!.endsWith('.R.csv')) {
      const r = parseKeyingRows<CellRow>(CELL_COLUMNS, rawFromText(`raw/${path}`, text), 'V11');
      resolved.set(`${key}/${parts[2]!.slice(0, -'.R.csv'.length)}`, r.rows); issues.push(...r.issues);
    }
  }
  return { dir: raw.dir, raw, t, designValues, notations, options, status, crops, resolved, issues };
}

export const loadDataset = (root: string): Dataset => parseDataset(loadRaw(root));
