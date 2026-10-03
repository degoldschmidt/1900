/**
 * data/raw/status.csv: one row per crop and its keying state.
 *
 *   source_id, table_ref, crop_id, status (keyed|diffed|resolved|rekey|skipped), agreement_permille, note
 *
 * keyed     at least one keyer file exists, the pair is not yet diffed (note says what is missing)
 * diffed    A and B diffed with agreement ≥ 950‰; the resolver packet can be built
 * resolved  <crop_id>.R.csv is complete (tools/keying/merge.ts)
 * rekey     agreement < 950‰, a keyer file is malformed, or the historian's sample failed
 * skipped   set by hand (e.g. a crop with nothing on the needed corridor, or one superseded by a
 *           re-keyed "-v2" crop); never changed by the tools. Its files stay on disk as the record,
 *           but nothing downstream reads them: the normaliser and the historian's sample take only
 *           resolved crops, the review page and V10/V11 leave skipped crops out.
 */
import { cmpStr, readCsvFileOr, writeCsv, writeTextFile } from './csv.ts';

export const STATUS_COLUMNS = ['source_id', 'table_ref', 'crop_id', 'status', 'agreement_permille', 'note'] as const;
export const STATUSES = ['keyed', 'diffed', 'resolved', 'rekey', 'skipped'] as const;
export type CropStatus = (typeof STATUSES)[number];

export interface StatusRow {
  source_id: string;
  table_ref: string;
  crop_id: string;
  status: CropStatus;
  agreement_permille: string;
  note: string;
}

/** Agreement below this (per mille) sends a crop back for re-keying. */
export const REKEY_BELOW_PERMILLE = 950;

const key = (r: Pick<StatusRow, 'source_id' | 'table_ref' | 'crop_id'>) => `${r.source_id}\u0000${r.table_ref}\u0000${r.crop_id}`;

export function readStatus(path: string): StatusRow[] {
  return readCsvFileOr(path, STATUS_COLUMNS).rows.map((r, i) => {
    const st = (r.status ?? '').trim();
    if (!(STATUSES as readonly string[]).includes(st)) throw new Error(`${path} row ${i + 2}: status "${st}" is not one of ${STATUSES.join('|')}`);
    return {
      source_id: r.source_id ?? '', table_ref: r.table_ref ?? '', crop_id: r.crop_id ?? '', status: st as CropStatus,
      agreement_permille: r.agreement_permille ?? '', note: r.note ?? '',
    };
  });
}

export function findStatus(rows: readonly StatusRow[], source: string, table: string, crop: string): StatusRow | undefined {
  return rows.find((r) => r.source_id === source && r.table_ref === table && r.crop_id === crop);
}

type StatusLike = { source_id: string; table_ref: string; crop_id: string; status: string };

/**
 * The status row that governs one crop: its own row, else the table's crop_id "*" row (a whole
 * table skipped by hand); of several rows for the same key the last wins. Works on both this
 * module's rows and the validator's (tools/schema).
 */
export function cropStatusRow<T extends StatusLike>(rows: readonly T[], source: string, table: string, crop: string): T | undefined {
  const mine = rows.filter((r) => r.source_id === source && r.table_ref === table).reverse();
  return mine.find((r) => r.crop_id === crop) ?? mine.find((r) => r.crop_id === '*');
}

/** "skipped" (or a hand-written "skip…"): the crop is set aside, e.g. superseded by a re-keyed crop; no tool reads it. */
export const isSkipStatus = (status: string): boolean => status.startsWith('skip');

/** Only a crop whose governing status is exactly "resolved" feeds the normaliser and the historian's sample. */
export function cropIsResolved(rows: readonly StatusLike[], source: string, table: string, crop: string): boolean {
  return cropStatusRow(rows, source, table, crop)?.status === 'resolved';
}

export function cropIsSkipped(rows: readonly StatusLike[], source: string, table: string, crop: string): boolean {
  const s = cropStatusRow(rows, source, table, crop);
  return s !== undefined && isSkipStatus(s.status);
}

/** Inserts or replaces rows by (source_id, table_ref, crop_id); returns rows in a stable order. */
export function upsertStatus(rows: readonly StatusRow[], updates: readonly StatusRow[]): StatusRow[] {
  const m = new Map(rows.map((r) => [key(r), r]));
  for (const u of updates) m.set(key(u), u);
  return [...m.values()].sort((a, b) => cmpStr(a.source_id, b.source_id) || cmpStr(a.table_ref, b.table_ref) || cmpStr(a.crop_id, b.crop_id));
}

export function writeStatus(path: string, rows: readonly StatusRow[]): void {
  writeTextFile(path, writeCsv(STATUS_COLUMNS, upsertStatus([], rows).map((r) => ({ ...r }))));
}

/** Reads, applies updates and writes status.csv in one step. */
export function updateStatusFile(path: string, updates: readonly StatusRow[]): StatusRow[] {
  const rows = upsertStatus(readStatus(path), updates);
  writeStatus(path, rows);
  return rows;
}
