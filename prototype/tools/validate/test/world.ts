/**
 * Test helpers: the shared synthetic world (tools/schema/test/fixtures/syn-world) loaded once as
 * raw records, cloned per test so each test can seed its own errors.
 */
import { fileURLToPath } from 'node:url';
import { cloneRawDataset, loadRaw, parseDataset, type Dataset, type RawDataset } from '../../schema/dataset.ts';
import type { TableName } from '../../schema/canonical.ts';
import type { Issue, Level } from '../../schema/issues.ts';
import { runCheck } from '../suite.ts';

export const WORLD = fileURLToPath(new URL('../../schema/test/fixtures/syn-world', import.meta.url));

let cache: RawDataset | null = null;
export function world(): RawDataset {
  cache ??= loadRaw(WORLD);
  return cloneRawDataset(cache);
}

export type Rec = Record<string, string>;

/** The raw records of a table (mutable). */
export function recs(raw: RawDataset, table: TableName): Rec[] {
  return raw.tables[table].rows.map((r) => r.values);
}

export function find(raw: RawDataset, table: TableName, pred: (r: Rec) => boolean): Rec {
  const r = recs(raw, table).find(pred);
  if (!r) throw new Error(`no matching row in ${table}`);
  return r;
}

export function addRow(raw: RawDataset, table: TableName, values: Rec): void {
  const t = raw.tables[table];
  const full: Rec = {};
  for (const h of t.header) full[h] = values[h] ?? '';
  const line = (t.rows[t.rows.length - 1]?.line ?? 1) + 1;
  t.rows.push({ line, values: full });
}

export function removeRows(raw: RawDataset, table: TableName, pred: (r: Rec) => boolean): void {
  const t = raw.tables[table];
  t.rows = t.rows.filter((r) => !pred(r.values));
}

export const parse = (raw: RawDataset): Dataset => parseDataset(raw);

export function run(raw: RawDataset, check: string): Issue[] {
  return runCheck(parseDataset(raw), check);
}

export const only = (issues: readonly Issue[], level: Level): string[] => issues.filter((i) => i.level === level).map((i) => `${i.where}: ${i.message}`);
export const errs = (issues: readonly Issue[]): string[] => only(issues, 'error');
export const warns = (issues: readonly Issue[]): string[] => only(issues, 'warning');
