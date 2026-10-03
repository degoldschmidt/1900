/**
 * The long-format keying CSV: one line per transcribed cell.
 *
 *   crop_id, kind (header|label|cell|footnote), col, row, text_as_printed, marks, sure (y|n|x)
 *
 * Keys are (kind, col, row); col and row are ABSOLUTE indices in the printed table grid:
 *   - cell:     col = train column, row = body row;
 *   - header:   col = train column, row = header line (0 = top line of the header band);
 *   - label:    col = label sub-column (0 = station name, 1 = arr./dep., …), row = body row;
 *   - footnote: col = 0, row = order of appearance in the crop (0-based).
 *
 * marks is a semicolon list of b (bold/heavy), u (underlined), i (italic), sc (small capitals) and
 * fn:<symbol> (a footnote reference mark attached to the cell, e.g. fn:* fn:† fn:a).
 * The resolved file (.R.csv) adds resolution (agree|A|B|other|illegible) and note.
 */
import { cmpStr, parseCsv, writeCsv, type CsvRow } from './csv.ts';

export const KINDS = ['header', 'label', 'cell', 'footnote'] as const;
export type Kind = (typeof KINDS)[number];
export const SURE = ['y', 'n', 'x'] as const;
export type Sure = (typeof SURE)[number];
export const RESOLUTIONS = ['agree', 'A', 'B', 'other', 'illegible'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const LONG_COLUMNS = ['crop_id', 'kind', 'col', 'row', 'text_as_printed', 'marks', 'sure'] as const;
export const RESOLVED_COLUMNS = [...LONG_COLUMNS, 'resolution', 'note'] as const;

export interface KeyedCell {
  crop_id: string;
  kind: Kind;
  col: number;
  row: number;
  /** Text as printed, whitespace-trimmed with internal runs collapsed to one space (NFC). */
  text: string;
  /** Canonical marks (see canonicalMarks). */
  marks: string[];
  sure: Sure;
}

export interface ResolvedCell extends KeyedCell {
  resolution: Resolution | '';
  note: string;
}

/** Transcription tokens used for printed signs (see tools/keying/KEYER_BRIEF.md). */
export const TOKENS = {
  ditto: '〃',
  pass: '|',
  dash: '—',
  dots: '…',
} as const;

const TYPO_ORDER = ['b', 'u', 'i', 'sc'];

export function cellKey(c: { kind: string; col: number; row: number }): string {
  return `${c.kind}:${c.col}:${c.row}`;
}

/** Compact reference used in citations (`source:page:table:crop:cell`): c3r12, h0c3 (line 0, column 3), l0r12, f2. */
export function cellRef(c: { kind: Kind; col: number; row: number }): string {
  switch (c.kind) {
    case 'cell': return `c${c.col}r${c.row}`;
    case 'header': return `h${c.row}c${c.col}`;
    case 'label': return `l${c.col}r${c.row}`;
    case 'footnote': return `f${c.row}`;
  }
}

/** Trims, collapses internal whitespace and applies NFC; no other normalisation. */
export function normText(s: string): string {
  return s.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function isMark(m: string): boolean {
  return TYPO_ORDER.includes(m) || /^fn:[^\s;]+$/.test(m);
}

/** Parses a marks field into a canonical list: unique, typographic marks first (b,u,i,sc), then fn:* sorted. */
export function canonicalMarks(s: string | readonly string[]): string[] {
  const list = (typeof s === 'string' ? s.split(';') : [...s]).map((m) => m.trim()).filter(Boolean);
  const uniq = [...new Set(list)];
  const typo = TYPO_ORDER.filter((m) => uniq.includes(m));
  const fn = uniq.filter((m) => !TYPO_ORDER.includes(m)).sort(cmpStr);
  return [...typo, ...fn];
}

export function marksString(marks: readonly string[]): string {
  return marks.join(';');
}

export function sortCells<T extends { kind: Kind; col: number; row: number }>(cells: T[]): T[] {
  const ko = (k: Kind) => KINDS.indexOf(k);
  return cells.sort((a, b) => ko(a.kind) - ko(b.kind) || a.row - b.row || a.col - b.col);
}

export interface ParseResult<T> {
  cells: T[];
  errors: string[];
}

function parseInt10(v: string | undefined): number | null {
  if (v === undefined || !/^\d+$/.test(v.trim())) return null;
  return Number(v.trim());
}

function parseCommon(r: CsvRow, where: string, errors: string[]): KeyedCell | null {
  const kind = (r.kind ?? '').trim();
  const sure = (r.sure ?? '').trim();
  const col = parseInt10(r.col);
  const row = parseInt10(r.row);
  let ok = true;
  if (!(KINDS as readonly string[]).includes(kind)) { errors.push(`${where}: kind "${kind}" is not one of ${KINDS.join('|')}`); ok = false; }
  if (!(SURE as readonly string[]).includes(sure)) { errors.push(`${where}: sure "${sure}" is not one of y|n|x`); ok = false; }
  if (col === null) { errors.push(`${where}: col "${r.col ?? ''}" is not a non-negative integer`); ok = false; }
  if (row === null) { errors.push(`${where}: row "${r.row ?? ''}" is not a non-negative integer`); ok = false; }
  const rawMarks = (r.marks ?? '').split(';').map((m) => m.trim()).filter(Boolean);
  for (const m of rawMarks) if (!isMark(m)) { errors.push(`${where}: unknown mark "${m}" (use b|u|i|sc|fn:<symbol>)`); ok = false; }
  const text = normText(r.text_as_printed ?? '');
  if (/["]/.test(text) && kind !== 'footnote') errors.push(`${where}: ASCII quote in text; key printed ditto marks as ${TOKENS.ditto}`);
  if (!ok) return null;
  return { crop_id: (r.crop_id ?? '').trim(), kind: kind as Kind, col: col!, row: row!, text, marks: canonicalMarks(rawMarks), sure: sure as Sure };
}

/** Parses a keyer file (.A.csv / .B.csv / ground truth). Duplicate keys and crop_id mismatches are errors. */
export function parseLong(text: string, opts: { file?: string; cropId?: string } = {}): ParseResult<KeyedCell> {
  const file = opts.file ?? 'input';
  const errors: string[] = [];
  let table;
  try { table = parseCsv(text, { file, required: LONG_COLUMNS }); } catch (e) { return { cells: [], errors: [(e as Error).message] }; }
  const cells: KeyedCell[] = [];
  const seen = new Map<string, number>();
  table.rows.forEach((r, i) => {
    const where = `${file} row ${i + 2}`;
    const c = parseCommon(r, where, errors);
    if (!c) return;
    if (opts.cropId !== undefined && c.crop_id !== opts.cropId) errors.push(`${where}: crop_id "${c.crop_id}" but file is for "${opts.cropId}"`);
    const k = cellKey(c);
    if (seen.has(k)) errors.push(`${where}: duplicate ${k} (first at row ${seen.get(k)})`);
    else seen.set(k, i + 2);
    cells.push(c);
  });
  return { cells, errors };
}

export function parseResolved(text: string, opts: { file?: string; cropId?: string } = {}): ParseResult<ResolvedCell> {
  const file = opts.file ?? 'input';
  const errors: string[] = [];
  let table;
  try { table = parseCsv(text, { file, required: [...LONG_COLUMNS, 'resolution'] }); } catch (e) { return { cells: [], errors: [(e as Error).message] }; }
  const cells: ResolvedCell[] = [];
  const seen = new Set<string>();
  table.rows.forEach((r, i) => {
    const where = `${file} row ${i + 2}`;
    const c = parseCommon(r, where, errors);
    if (!c) return;
    const res = (r.resolution ?? '').trim();
    if (res !== '' && !(RESOLUTIONS as readonly string[]).includes(res)) { errors.push(`${where}: resolution "${res}" is not one of ${RESOLUTIONS.join('|')}`); return; }
    if (opts.cropId !== undefined && c.crop_id !== opts.cropId) errors.push(`${where}: crop_id "${c.crop_id}" but file is for "${opts.cropId}"`);
    const k = cellKey(c);
    if (seen.has(k)) errors.push(`${where}: duplicate ${k}`);
    seen.add(k);
    cells.push({ ...c, resolution: res as Resolution | '', note: (r.note ?? '').trim() });
  });
  return { cells, errors };
}

function toRow(c: KeyedCell): CsvRow {
  return { crop_id: c.crop_id, kind: c.kind, col: String(c.col), row: String(c.row), text_as_printed: c.text, marks: marksString(c.marks), sure: c.sure };
}

export function writeLong(cells: readonly KeyedCell[]): string {
  return writeCsv(LONG_COLUMNS, sortCells([...cells]).map(toRow));
}

export function writeResolved(cells: readonly ResolvedCell[]): string {
  return writeCsv(RESOLVED_COLUMNS, sortCells([...cells]).map((c) => ({ ...toRow(c), resolution: c.resolution, note: c.note })));
}

/** True when two readings agree: same text and same canonical marks. */
export function sameReading(a: Pick<KeyedCell, 'text' | 'marks'>, b: Pick<KeyedCell, 'text' | 'marks'>): boolean {
  return a.text === b.text && marksString(a.marks) === marksString(b.marks);
}
