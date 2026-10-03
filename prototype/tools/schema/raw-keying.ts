/**
 * Specs for the keying files written by the acquisition tools under data/raw/ (see
 * tools/keying/longcsv.ts). Only the columns listed here are read; other columns are ignored.
 *
 *   data/raw/status.csv                                  one row per crop (or table) and its state
 *   data/raw/<source_id>/<table_ref>/crops.csv           crops of one printed table
 *   data/raw/<source_id>/<table_ref>/<crop_id>.A.csv     keyer A, .B.csv keyer B, .R.csv resolved
 */
import type { ColSpec, RowOf } from './canonical.ts';
import { parseValue } from './canonical.ts';
import type { RawTable } from './raw-table.ts';
import { issue, type Issue } from './issues.ts';

const CROPS = [
  { name: 'crop_id', type: 'text', req: true },
  { name: 'page_seq', type: 'int', req: true, min: 1 },
  { name: 'table_ref', type: 'text', req: true },
  { name: 'col_range', type: 'text' },
  { name: 'row_range', type: 'text' },
] as const satisfies readonly ColSpec[];

const CELLS = [
  { name: 'crop_id', type: 'text', req: true },
  { name: 'kind', type: 'enum', req: true, values: ['header', 'label', 'cell', 'footnote'] },
  { name: 'col', type: 'int', req: true, min: 0 },
  { name: 'row', type: 'int', req: true, min: 0 },
  { name: 'text_as_printed', type: 'text' },
  { name: 'marks', type: 'list' },
  { name: 'sure', type: 'enum', req: true, values: ['y', 'n', 'x'] },
  { name: 'resolution', type: 'enum', values: ['agree', 'A', 'B', 'other', 'illegible'] },
  { name: 'note', type: 'text' },
] as const satisfies readonly ColSpec[];

const STATUS = [
  { name: 'source_id', type: 'text', req: true },
  { name: 'table_ref', type: 'text', req: true },
  { name: 'crop_id', type: 'text', req: true },
  { name: 'status', type: 'text', req: true },
  { name: 'agreement_permille', type: 'int', min: 0 },
  { name: 'note', type: 'text' },
] as const satisfies readonly ColSpec[];

export type CropRow = RowOf<typeof CROPS>;
export type CellRow = RowOf<typeof CELLS>;
export type StatusRow = RowOf<typeof STATUS>;

export const CROP_COLUMNS = CROPS;
export const CELL_COLUMNS = CELLS;
export const STATUS_COLUMNS = STATUS;

/** Parses a keying file: required columns must be present; optional ones may be absent (read as empty); extra columns are ignored. */
export function parseKeyingRows<T>(cols: readonly ColSpec[], raw: RawTable, check: string): { rows: T[]; issues: Issue[] } {
  const issues: Issue[] = [];
  const rows: T[] = [];
  if (raw.missing) return { rows, issues };
  for (const p of raw.problems) issues.push(issue(check, 'error', `${raw.file}:${p.line}`, p.message));
  const missingCols = cols.filter((c) => c.req && !raw.header.includes(c.name)).map((c) => c.name);
  if (missingCols.length) {
    issues.push(issue(check, 'error', `${raw.file}:1`, `missing column(s): ${missingCols.join(', ')}`));
    return { rows, issues };
  }
  for (const r of raw.rows) {
    const row: Record<string, unknown> = { line: r.line };
    let ok = true;
    for (const c of cols) {
      const res = parseValue(c, r.values[c.name] ?? '');
      if (res.ok) row[c.name] = res.value;
      else { ok = false; issues.push(issue(check, 'error', `${raw.file}:${r.line}`, res.message)); }
    }
    if (ok) rows.push(row as T);
  }
  return { rows, issues };
}

/** "c0-c7" → [0, 7]; "r3-r17" → [3, 17]; null if malformed or empty. */
export function parseRange(s: string, prefix: 'c' | 'r'): [number, number] | null {
  const m = new RegExp(`^${prefix}(\\d+)-${prefix}?(\\d+)$`).exec(s.trim());
  if (!m) return null;
  const a = Number(m[1]); const b = Number(m[2]);
  return a <= b ? [a, b] : null;
}
