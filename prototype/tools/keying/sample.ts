/**
 * The historian's blind sample (HISTORIAN_BRIEF.md).
 *
 *   node tools/keying/sample.ts draw --seed 1914 [--label pilot] [--n 360 | --stop-permille 50 --fare-permille 100] [--sources a,b]
 *   node tools/keying/sample.ts score --label pilot [--apply]
 *
 * draw: over every resolved crop under data/raw/ (status.csv says resolved and <crop_id>.R.csv
 * exists; skipped crops, e.g. ones superseded by re-keyed "-v2" crops, are never drawn), takes
 * body cells that carry a printed sign (non-blank, not illegible), stratified by (source_id, table_ref).
 * By default 5% of timetable cells and 10% of fare cells (layout.json table_kind "fares"), at least
 * one per stratum. With --n, exactly n cells in all (or the whole population if it is smaller), split
 * over the strata in proportion to their size (largest remainder, at least one per stratum while n
 * allows); rate_permille then records each stratum's actual rate. The choice is deterministic: cells
 * are ordered by sha256("<seed>|<source>|<table>|<kind>|<col>|<row>") and the first n taken, so the
 * same seed and data give the same sample. Writes
 *   data/review/sample-<label>.csv   what the historian fills in: where to look, never the transcription
 *   build/review/sample-<label>/<sample_id>.png   the cell zoomed from the scan, when the page is on disk
 * (tools/review/contact-sheet.ts puts the cells of a sample on numbered contact sheets, 16 per image.)
 *
 * score: compares the historian's re-reading (reread_text, reread_marks) with the resolved cells by
 * VALUE (tools/keying/value.ts with the source's notation rules, decisions P-005, P-010, P-013): a
 * difference in typography alone (a separator; bold or body-cell italic where the guide gives them
 * no meaning; under P-013 a train's italic is judged on its column's header cell, not on body cells)
 * is listed but is not an error. Rows are read (reread_sure y or n: measured), illegible to the
 * reviewer (x: seen, not measured) or unread (reread_sure blank: not scored and not an error; the
 * report lists them apart and never prints their stored values).
 *
 * For each source the score gives the exact one-sided 95% upper bound on its value error rate: the
 * largest number of wrong cells D among the N cells of its population (collectPopulation, counted at
 * score time) under which finding e or fewer wrong among the n read still has a probability above 5%
 * (hypergeometric, i.e. Clopper–Pearson with the finite-population correction; the bound treats the
 * sample as a simple random one, which the proportional --n draw approximates). A source PASSES (gate
 * G2) when that bound is at most 0.5% (with no error among N = 653 cells that needs 344 read); it
 * fails otherwise, and the report says how many cells would have to be read at the current error
 * count. For a failing source, --apply marks every crop of its tables with errors rekey in
 * data/raw/status.csv (skipped crops are left as they are). The report is printed and written to
 * build/review/sample-<label>.score.md; the exit code is 2 unless every source passes.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmpStr, readCsvFile, writeCsv, writeTextFile } from './csv.ts';
import {
  canonicalMarks, cellKey, isMark, joinDoubledSigns, KINDS, marksString, normText, parseResolved, sameReading, SURE,
  type Kind, type ResolvedCell,
} from './longcsv.ts';
import { assertSafeId, layoutJson, roots, statusCsv, type Roots } from './paths.ts';
import { cropIsResolved, cropIsSkipped, readStatus, updateStatusFile, type StatusRow } from './status.ts';
import { loadTable } from './crop-files.ts';
import { valueRulesFor } from './diff.ts';
import { valueOf, type ValueRules } from './value.ts';
import { keyBox, loadLayout, panelForCrop, type CropRow } from '../crops/layout.ts';
import { findPageImage, loadPage, zoomKey, type PageRaw } from '../crops/make-crops.ts';
import { exampleOverlap } from './sign-examples.ts';

export const SAMPLE_COLUMNS = [
  'sample_id', 'source_id', 'table_ref', 'page_seq', 'crop_id', 'kind', 'col', 'row', 'page_region', 'rate_permille',
  'reread_text', 'reread_marks', 'reread_sure', 'note',
] as const;

/** The G2 target: a source passes when the 95% upper bound on its value error rate is at most 0.5% (5‰). */
export const SAMPLE_MAX_ERROR_PERMILLE = 5;

/** Confidence of the one-sided upper bound. */
export const SAMPLE_CONFIDENCE = 0.95;

export interface PopulationCell { source_id: string; table_ref: string; crop: CropRow; cell: ResolvedCell; fares: boolean }

/** All resolved body cells with a printed sign, from every table under data/raw/. */
export function collectPopulation(r: Roots, sources?: readonly string[]): PopulationCell[] {
  const raw = join(r.data, 'raw');
  if (!existsSync(raw)) return [];
  const out: PopulationCell[] = [];
  const status = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  for (const source of readdirSync(raw).sort(cmpStr)) {
    if (sources && !sources.includes(source)) continue;
    const sdir = join(raw, source);
    if (source === 'status.csv') continue;
    let tables: string[];
    try { tables = readdirSync(sdir).sort(cmpStr); } catch { continue; }
    for (const table of tables) {
      if (!existsSync(layoutJson(r, source, table)) || !existsSync(join(sdir, table, 'crops.csv'))) continue;
      const t = loadTable(r, source, table);
      const fares = t.layout.table_kind === 'fares';
      for (const crop of t.crops) {
        if (!cropIsResolved(status, source, table, crop.crop_id)) continue;
        const p = join(sdir, table, `${crop.crop_id}.R.csv`);
        if (!existsSync(p)) continue;
        const parsed = parseResolved(readFileSync(p, 'utf8'), { file: p, cropId: crop.crop_id });
        if (parsed.errors.length) throw new Error(`${p}: ${parsed.errors[0]}`);
        for (const cell of parsed.cells) {
          if (cell.kind !== 'cell' || cell.text === '' || cell.sure === 'x' || cell.resolution === 'illegible') continue;
          out.push({ source_id: source, table_ref: table, crop, cell, fares });
        }
      }
    }
  }
  return out;
}

/** The population as drawn: per (source, table) stratum, a cell keyed in two crops counts once. */
function strataOf(pop: readonly PopulationCell[]): Map<string, PopulationCell[]> {
  const strata = new Map<string, PopulationCell[]>();
  const seen = new Set<string>();
  for (const p of pop) {
    const k = `${p.source_id}\u0000${p.table_ref}`;
    const ck = `${k}\u0000${cellKey(p.cell)}`;
    if (seen.has(ck)) continue;
    seen.add(ck);
    const list = strata.get(k) ?? [];
    list.push(p);
    strata.set(k, list);
  }
  return strata;
}

/** Population size N per source: the distinct cells a sample of that source is drawn from. */
export function populationSizes(pop: readonly PopulationCell[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const list of strataOf(pop).values()) out.set(list[0]!.source_id, (out.get(list[0]!.source_id) ?? 0) + list.length);
  return out;
}

const order = (seed: string, p: PopulationCell) =>
  createHash('sha256').update(`${seed}|${p.source_id}|${p.table_ref}|${p.cell.kind}|${p.cell.col}|${p.cell.row}`).digest('hex');

export interface DrawOptions {
  seed: string;
  stopPermille?: number;
  farePermille?: number;
  /** Exactly this many cells in all (replaces the permille rates): see allocate(). */
  n?: number;
}

/**
 * Splits n over strata of the given sizes in proportion to size (largest remainder; ties to the
 * earlier stratum), at least one per non-empty stratum while n allows, never more than a stratum
 * holds. The parts sum to min(n, total size).
 */
export function allocate(sizes: readonly number[], n: number): number[] {
  const N = sizes.reduce((a, b) => a + b, 0);
  const total = Math.min(n, N);
  if (total <= 0) return sizes.map(() => 0);
  const quota = sizes.map((s) => (total * s) / N);
  const out = quota.map((q, i) => Math.min(sizes[i]!, Math.floor(q)));
  if (total >= sizes.filter((s) => s > 0).length) sizes.forEach((s, i) => { if (s > 0 && out[i] === 0) out[i] = 1; });
  let left = total - out.reduce((a, b) => a + b, 0);
  const pick = (ok: (i: number) => boolean, better: (a: number, b: number) => boolean) => {
    let best = -1;
    for (let i = 0; i < sizes.length; i++) if (ok(i) && (best < 0 || better(quota[i]! - out[i]!, quota[best]! - out[best]!))) best = i;
    return best;
  };
  for (; left > 0; left--) out[pick((i) => out[i]! < sizes[i]!, (a, b) => a > b)]!++;
  for (; left < 0; left++) out[pick((i) => out[i]! > 1, (a, b) => a < b)]!--;
  return out;
}

/** Deterministic stratified draw. */
export function drawSample(pop: readonly PopulationCell[], o: DrawOptions): Array<PopulationCell & { rate: number }> {
  if (o.n !== undefined && (o.stopPermille !== undefined || o.farePermille !== undefined)) throw new Error('--n replaces --stop-permille and --fare-permille; give one or the other');
  if (o.n !== undefined && (!Number.isInteger(o.n) || o.n < 1)) throw new Error(`--n must be a positive whole number, not ${o.n}`);
  const strata = strataOf(pop);
  const keys = [...strata.keys()].sort(cmpStr);
  const alloc = o.n !== undefined ? allocate(keys.map((k) => strata.get(k)!.length), o.n) : null;
  const out: Array<PopulationCell & { rate: number }> = [];
  for (const [i, k] of keys.entries()) {
    const list = strata.get(k)!;
    let n: number; let rate: number;
    if (alloc) { n = alloc[i]!; rate = Math.round((n * 1000) / list.length); }
    else { rate = list[0]!.fares ? (o.farePermille ?? 100) : (o.stopPermille ?? 50); n = Math.max(1, Math.ceil((list.length * rate) / 1000)); }
    const ranked = list.map((p) => ({ p, h: order(o.seed, p) })).sort((a, b) => cmpStr(a.h, b.h)).slice(0, n);
    for (const { p } of ranked.sort((a, b) => a.p.crop.page_seq - b.p.crop.page_seq || a.p.cell.row - b.p.cell.row || a.p.cell.col - b.p.cell.col)) out.push({ ...p, rate });
  }
  return out;
}

/**
 * Draws a sample and writes its file and zooms. `examples` lists the drawn cells that are also sign
 * examples in build/brief/signs/ (sign-examples.ts): the brief names those cells with their signs, so
 * the examples must be cut again (they then skip sampled cells) before a historian reads this sample.
 */
export async function runDraw(r: Roots, label: string, o: DrawOptions & { sources?: readonly string[] }): Promise<{ rows: number; csv: string; examples: Array<{ sample_id: string; image: string }> }> {
  assertSafeId('label', label);
  const picked = drawSample(collectPopulation(r, o.sources), o);
  const pages = new Map<string, PageRaw | null>();
  const rows: Array<Record<string, string>> = [];
  let i = 0;
  for (const p of picked) {
    const sampleId = `S${label}-${String(++i).padStart(4, '0')}`;
    const layout = loadLayout(layoutJson(r, p.source_id, p.table_ref));
    const b = keyBox(layout, p.crop, p.cell);
    rows.push({
      sample_id: sampleId, source_id: p.source_id, table_ref: p.table_ref, page_seq: String(p.crop.page_seq), crop_id: p.crop.crop_id,
      kind: p.cell.kind, col: String(p.cell.col), row: String(p.cell.row), page_region: b.join(','), rate_permille: String(p.rate),
      reread_text: '', reread_marks: '', reread_sure: '', note: '',
    });
    const panel = panelForCrop(layout, p.crop);
    const pk = `${p.source_id}:${panel.page_seq}:${panel.deskew_deg ?? 0}`;
    if (!pages.has(pk)) {
      let page: PageRaw | null = null;
      try { page = await loadPage(findPageImage(r, p.source_id, panel.page_seq), panel.deskew_deg ?? 0); } catch { page = null; }
      pages.set(pk, page);
    }
    const page = pages.get(pk);
    if (page) writeTextFile(join(r.build, 'review', `sample-${label}`, `${sampleId}.png`), await zoomKey(page, layout, p.crop, p.cell));
  }
  const csv = writeCsv(SAMPLE_COLUMNS, rows);
  writeTextFile(join(r.data, 'review', `sample-${label}.csv`), csv);
  return { rows: rows.length, csv, examples: exampleOverlap(r, rows) };
}

// ---------------------------------------------------------------- the bound

let LOG_FACT = new Float64Array([0, 0]);

/** ln k! for k = 0 … n (cached, grown on demand). */
function logFactorials(n: number): Float64Array {
  if (LOG_FACT.length > n) return LOG_FACT;
  const lf = new Float64Array(Math.max(n + 1, 2 * LOG_FACT.length));
  lf.set(LOG_FACT);
  for (let k = LOG_FACT.length; k < lf.length; k++) lf[k] = lf[k - 1]! + Math.log(k);
  LOG_FACT = lf;
  return lf;
}

function checkCounts(N: number, n: number, e: number): void {
  if (![N, n, e].every((v) => Number.isInteger(v) && v >= 0) || e > n || n > N) throw new Error(`need whole numbers 0 ≤ errors (${e}) ≤ read (${n}) ≤ population (${N})`);
}

/**
 * P(X ≤ e) for X hypergeometric: e or fewer wrong cells among n drawn without replacement from N
 * cells of which D are wrong.
 */
export function hypergeometricCdf(e: number, N: number, D: number, n: number): number {
  checkCounts(N, n, Math.min(e, n));
  if (!Number.isInteger(D) || D < 0 || D > N) throw new Error(`wrong cells D=${D} must lie in 0…${N}`);
  const lf = logFactorials(N);
  const lnC = (a: number, b: number) => lf[a]! - lf[b]! - lf[a - b]!;
  const all = lnC(N, n);
  let p = 0;
  for (let k = Math.max(0, n - (N - D)); k <= Math.min(e, D, n); k++) p += Math.exp(lnC(D, k) + lnC(N - D, n - k) - all);
  return Math.min(1, p);
}

/**
 * The exact one-sided upper confidence bound (default 95%) on the number of wrong cells among N,
 * given e wrong among n read: the largest D under which reading e or fewer wrong cells still has a
 * probability above 1 − confidence. This is Clopper–Pearson with the finite-population
 * (hypergeometric) correction; with every cell read (n = N) it is e itself.
 */
export function upperBoundErrors(N: number, n: number, e: number, confidence = SAMPLE_CONFIDENCE): number {
  checkCounts(N, n, e);
  const alpha = 1 - confidence;
  let D = e;
  while (D < N && hypergeometricCdf(e, N, D + 1, n) > alpha) D++;
  return D;
}

/** The bound as a rate (wrong cells / N). */
export function upperBoundRate(N: number, n: number, e: number, confidence = SAMPLE_CONFIDENCE): number {
  return N === 0 ? 0 : upperBoundErrors(N, n, e, confidence) / N;
}

/** True when the bound is at most maxPermille ‰ of N (integer arithmetic: no rounding at the line). */
export function boundPasses(N: number, n: number, e: number, maxPermille = SAMPLE_MAX_ERROR_PERMILLE, confidence = SAMPLE_CONFIDENCE): boolean {
  return upperBoundErrors(N, n, e, confidence) * 1000 <= maxPermille * N;
}

/**
 * The fewest cells to read, with e wrong among them, for the bound to pass (at most maxPermille ‰);
 * null when even reading all N cells would not (e itself is above the line).
 */
export function cellsNeeded(N: number, e: number, maxPermille = SAMPLE_MAX_ERROR_PERMILLE, confidence = SAMPLE_CONFIDENCE): number | null {
  if (e > N || !boundPasses(N, N, e, maxPermille, confidence)) return null;
  let lo = e; let hi = N;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (boundPasses(N, mid, e, maxPermille, confidence)) hi = mid; else lo = mid + 1;
  }
  return lo;
}

// ---------------------------------------------------------------- score

export interface SourceScore {
  source_id: string;
  /** N: the source's population at score time (resolved body cells with a printed sign). */
  population: number;
  /** n: rows read (reread_sure y or n). */
  read: number;
  /** e: value errors among them. */
  errors: number;
  permille: number;
  /** The 95% upper bound on wrong cells in the population, and as a rate. */
  boundErrors: number;
  bound: number;
  /** The bound is at most 0.5%. */
  pass: boolean;
  /** Not passing: --apply sends this source's tables with errors back for re-keying. */
  fail: boolean;
  /** Rows to read in all, with no further error, for the bound to pass; null when none would. */
  needed: number | null;
  tables: string[];
  /** The type styles that are value on body and header cells under the source's notation rules. */
  valueMarks: { cell: string[]; header: string[] };
}

export interface SampleRowRef { sample_id: string; source_id: string; table_ref: string; note: string }
export interface Comparison { sample_id: string; source_id: string; table_ref: string; expected: string; reread: string }

export interface ScoreResult {
  read: number;
  /** Seen but illegible to the reviewer (reread_sure x): not measured. */
  illegible: number;
  /** Blank re-reading: not scored and not an error. */
  unread: number;
  errors: number;
  typography: number;
  bySource: SourceScore[];
  /** Value errors. */
  mismatches: Comparison[];
  /** Readings that differ from the resolved cell in typography only: not errors. */
  typographyOnly: Comparison[];
  unreadRows: SampleRowRef[];
  illegibleRows: SampleRowRef[];
}

/** A re-reading from a sample row: null when blank (unread). Malformed fields are pushed to `problems`. */
function rereadOf(row: Record<string, string>, where: string, problems: string[]): { text: string; marks: string[]; sure: string } | null {
  const sure = (row.reread_sure ?? '').trim();
  const text = normText(row.reread_text ?? '');
  const raw = (row.reread_marks ?? '').split(';').map((m) => m.trim()).filter(Boolean);
  if (sure === '') {
    if (text !== '' || raw.length) problems.push(`${where}: a re-reading without reread_sure (y, n or x)`);
    return null;
  }
  if (!(SURE as readonly string[]).includes(sure)) problems.push(`${where}: reread_sure "${sure}" is not y, n or x`);
  for (const m of raw) if (!isMark(m)) problems.push(`${where}: unknown mark "${m}" in reread_marks (b|u|i|sc|fn:<sign>)`);
  return { text, marks: canonicalMarks(joinDoubledSigns(raw)), sure };
}

export function scoreSample(r: Roots, label: string): ScoreResult {
  assertSafeId('label', label);
  const path = join(r.data, 'review', `sample-${label}.csv`);
  const t = readCsvFile(path, SAMPLE_COLUMNS);
  const cache = new Map<string, Map<string, ResolvedCell>>();
  const resolvedFor = (source: string, table: string, crop: string) => {
    const k = `${source}/${table}/${crop}`;
    let m = cache.get(k);
    if (!m) {
      const p = join(r.data, 'raw', assertSafeId('source_id', source), assertSafeId('table_ref', table), `${assertSafeId('crop_id', crop)}.R.csv`);
      const parsed = parseResolved(readFileSync(p, 'utf8'), { file: p });
      m = new Map(parsed.cells.map((c) => [cellKey(c), c]));
      cache.set(k, m);
    }
    return m;
  };
  const rulesCache = new Map<string, ValueRules>();
  const rulesFor = (source: string) => {
    let v = rulesCache.get(source);
    if (!v) { v = valueRulesFor(r, source); rulesCache.set(source, v); }
    return v;
  };
  const res: ScoreResult = { read: 0, illegible: 0, unread: 0, errors: 0, typography: 0, bySource: [], mismatches: [], typographyOnly: [], unreadRows: [], illegibleRows: [] };
  const per = new Map<string, { read: number; errors: number; tables: Set<string> }>();
  const problems: string[] = [];
  const shown = (c: { text: string; marks: readonly string[] }) => `${c.text} [${marksString(c.marks)}]`;
  t.rows.forEach((row, i) => {
    const where = `${path} row ${i + 2}`;
    const source = row.source_id!; const table = row.table_ref!;
    const ref: SampleRowRef = { sample_id: row.sample_id!, source_id: source, table_ref: table, note: row.note ?? '' };
    const s = per.get(source) ?? { read: 0, errors: 0, tables: new Set<string>() };
    per.set(source, s);
    const reread = rereadOf(row, where, problems);
    if (!reread) { res.unread++; res.unreadRows.push(ref); return; }
    if (reread.sure === 'x') { res.illegible++; res.illegibleRows.push(ref); return; }
    const kind = row.kind as Kind;
    if (!(KINDS as readonly string[]).includes(kind)) { problems.push(`${where}: kind "${row.kind}" is not one of ${KINDS.join('|')}`); return; }
    s.read++; res.read++;
    const cell = resolvedFor(source, table, row.crop_id!).get(`${row.kind}:${row.col}:${row.row}`);
    const rules = rulesFor(source);
    const cmp: Comparison = { sample_id: row.sample_id!, source_id: source, table_ref: table, expected: cell ? shown(cell) : '(cell missing)', reread: shown(reread) };
    if (!cell || valueOf(cell, kind, rules) !== valueOf(reread, kind, rules)) {
      s.errors++; res.errors++; s.tables.add(table);
      res.mismatches.push(cmp);
    } else if (!sameReading(cell, reread)) {
      res.typography++;
      res.typographyOnly.push(cmp);
    }
  });
  if (problems.length) throw new Error(`${path}: ${problems.length} malformed re-reading(s); fix them and score again:\n  ${problems.join('\n  ')}`);
  const sizes = populationSizes(collectPopulation(r, [...per.keys()]));
  for (const source of [...per.keys()].sort(cmpStr)) {
    const s = per.get(source)!;
    const N = sizes.get(source) ?? 0;
    if (s.read > N) throw new Error(`${source}: ${s.read} cells read but the population now holds only ${N}; the data changed since the draw`);
    const boundErrors = upperBoundErrors(N, s.read, s.errors);
    const pass = boundPasses(N, s.read, s.errors);
    const rules = rulesFor(source);
    res.bySource.push({
      source_id: source, population: N, read: s.read, errors: s.errors,
      permille: s.read ? Math.floor((s.errors * 1000) / s.read) : 0,
      boundErrors, bound: N ? boundErrors / N : 0, pass, fail: !pass,
      needed: cellsNeeded(N, s.errors), tables: [...s.tables].sort(cmpStr),
      valueMarks: { cell: [...rules.cellStyleMarks].sort(cmpStr), header: [...rules.headerStyleMarks].sort(cmpStr) },
    });
  }
  return res;
}

const pct = (x: number, digits = 2) => `${(x * 100).toFixed(digits)}%`;

export function scoreMarkdown(label: string, s: ScoreResult): string {
  const line = (SAMPLE_MAX_ERROR_PERMILLE / 10).toFixed(1);
  const L = [
    `# Historian sample ${label}: score`, '',
    `Read ${s.read} (measured), value errors ${s.errors}, typography only ${s.typography} (not errors); seen but illegible to the reviewer ${s.illegible} (not measured); unread ${s.unread} (blank: not scored, not errors).`, '',
    'Compared by value, with each source\'s notation rules (P-005, P-010, P-013): a type style counts only where the guide gives it a meaning. A train\'s category (italic in Fritzsches Kursbuch) is judged on its column\'s header cell, so italic on a body cell is typography there; footnote signs always count.', '',
    ...s.bySource.map((b) => `- ${b.source_id}: type styles that are value on body cells: ${b.valueMarks.cell.join(', ') || 'none'}; on header cells: ${b.valueMarks.header.join(', ') || 'none'}.`), '',
    `**Rule (G2):** a source passes when the exact one-sided ${Math.round(SAMPLE_CONFIDENCE * 100)}% upper bound on its value error rate, with the finite-population (hypergeometric) correction over its N sampleable cells, is at most ${line}%.`, '',
    `| source | population N | read n | value errors e | observed | ${Math.round(SAMPLE_CONFIDENCE * 100)}% upper bound | verdict | to pass | tables with errors |`,
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const b of s.bySource) {
    const toPass = b.pass ? '—'
      : b.needed === null ? `cannot: ${b.errors} wrong exceeds ${line}% of ${b.population} even if every cell is read`
      : `read ≥ ${b.needed} (${b.needed - b.read} more) with no further error`;
    L.push(`| ${b.source_id} | ${b.population} | ${b.read} | ${b.errors} | ${b.read ? pct(b.errors / b.read) : '—'} | ${pct(b.bound, 3)} (≤ ${b.boundErrors} of ${b.population}) | ${b.pass ? 'PASS' : 'FAIL'} | ${toPass} | ${b.tables.join(', ')} |`);
  }
  const all = s.bySource.length > 0 && s.bySource.every((b) => b.pass);
  L.push('', `**Verdict: ${all ? 'PASS' : 'FAIL'}**${all ? '' : ` (${s.bySource.filter((b) => !b.pass).map((b) => b.errors ? `${b.source_id}: ${b.errors} value error(s); re-key tables ${b.tables.join(', ')} after classifying them` : `${b.source_id}: no error, but the bound is above ${line}%`).join('; ')})`}`);
  if (s.mismatches.length) {
    L.push('', '## Value errors', '');
    for (const m of s.mismatches) L.push(`- ${m.sample_id} (${m.source_id} ${m.table_ref}): resolved \`${m.expected}\`, historian \`${m.reread}\``);
  }
  if (s.typographyOnly.length) {
    L.push('', '## Typography only (same value; not errors)', '');
    for (const m of s.typographyOnly) L.push(`- ${m.sample_id} (${m.source_id} ${m.table_ref}): resolved \`${m.expected}\`, historian \`${m.reread}\``);
  }
  const list = (title: string, rows: readonly SampleRowRef[]) => {
    if (!rows.length) return;
    L.push('', `## ${title}`, '');
    const by = new Map<string, SampleRowRef[]>();
    for (const x of rows) { const k = `${x.source_id} ${x.table_ref}`; by.set(k, [...(by.get(k) ?? []), x]); }
    for (const k of [...by.keys()].sort(cmpStr)) {
      const xs = by.get(k)!; const notes = [...new Set(xs.map((x) => x.note).filter(Boolean))];
      L.push(`- ${k} (${xs.length}): ${xs.map((x) => x.sample_id).join(', ')}${notes.length ? `. Notes: ${notes.join('; ')}` : ''}`);
    }
  };
  // Never the stored values of these rows: they may still be read blind.
  list(`Unread (${s.unread}): blank re-reading, not scored and not errors`, s.unreadRows);
  list(`Seen but illegible to the reviewer (${s.illegible}): reread_sure x, not measured`, s.illegibleRows);
  return L.join('\n') + '\n';
}

/** Marks every crop of each failing source's tables with errors rekey (a skipped crop stays skipped). */
export function applyScore(r: Roots, s: ScoreResult, label: string): StatusRow[] {
  const updates: StatusRow[] = [];
  const status = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  for (const b of s.bySource.filter((x) => x.fail)) {
    for (const table of b.tables) {
      for (const crop of loadTable(r, b.source_id, table).crops) {
        if (cropIsSkipped(status, b.source_id, table, crop.crop_id)) continue;
        updates.push({ source_id: b.source_id, table_ref: table, crop_id: crop.crop_id, status: 'rekey', agreement_permille: '', note: `historian sample ${label}: ${b.errors} value error(s) in ${b.read} read, ${Math.round(SAMPLE_CONFIDENCE * 100)}% bound ${pct(b.bound, 3)} in ${b.source_id}` });
      }
    }
  }
  if (updates.length) updateStatusFile(statusCsv(r), updates);
  return updates;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const r = roots();
  const main = async () => {
    if (args[0] === 'draw') {
      const seed = opt('--seed');
      if (!seed) throw new Error('draw needs --seed');
      const label = opt('--label') ?? `s${seed}`;
      const o: DrawOptions & { sources?: readonly string[] } = { seed };
      if (opt('--stop-permille') !== undefined) o.stopPermille = Number(opt('--stop-permille'));
      if (opt('--fare-permille') !== undefined) o.farePermille = Number(opt('--fare-permille'));
      if (opt('--n') !== undefined) o.n = Number(opt('--n'));
      if (opt('--sources') !== undefined) o.sources = opt('--sources')!.split(',');
      const res = await runDraw(r, label, o);
      console.log(`${res.rows} cell(s) → ${join(r.data, 'review', `sample-${label}.csv`)} (zooms in ${join(r.build, 'review', `sample-${label}`)}/)`);
      if (o.n !== undefined && res.rows < o.n) console.log(`note: the population holds only ${res.rows} cell(s); all were drawn`);
      if (res.examples.length) {
        console.log(`warning: ${res.examples.length} drawn cell(s) are sign examples in build/brief/signs/ (${res.examples.map((e) => `${e.sample_id} = ${e.image}`).join(', ')}).`);
        console.log('Run node tools/keying/sign-examples.ts again before a historian reads this sample: it skips sampled cells. contact-sheet.ts refuses the sample until then.');
      }
    } else if (args[0] === 'score') {
      const label = opt('--label');
      if (!label) throw new Error('score needs --label');
      const s = scoreSample(r, label);
      const md = scoreMarkdown(label, s);
      writeTextFile(join(r.build, 'review', `sample-${label}.score.md`), md);
      process.stdout.write(md);
      if (args.includes('--apply')) console.log(`${applyScore(r, s, label).length} crop(s) marked rekey`);
      if (s.bySource.some((b) => b.fail)) process.exit(2);
    } else throw new Error('usage: sample.ts draw --seed N [--label L] [--n COUNT | --stop-permille P --fare-permille P] [--sources a,b] | sample.ts score --label L [--apply]');
  };
  main().catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
