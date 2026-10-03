/**
 * data/raw/status.csv: one row per crop and its keying state.
 *
 *   source_id, table_ref, crop_id, status (keyed|diffed|resolved|rekey|skipped), agreement_permille, note
 *
 * keyed     at least one keyer file exists, the pair is not yet diffed (note says what is missing)
 * diffed    A and B diffed with agreement ≥ 950‰; the resolver packet can be built
 * resolved  <crop_id>.R.csv is complete (tools/keying/merge.ts)
 * rekey     agreement < 950‰, a keyer file is malformed, or the historian's sample failed
 * skipped   set by hand (e.g. a crop with nothing on the needed corridor); never changed by the tools
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
