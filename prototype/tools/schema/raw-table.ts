/** A CSV file as read from disk, before typing: header, records keyed by column, problems. */
import { existsSync, readFileSync } from 'node:fs';
import { CsvError, readCsvTable } from './csv.ts';

export interface RawTable {
  /** File name for messages, e.g. "stops.csv". */
  file: string;
  missing: boolean;
  header: string[];
  rows: Array<{ line: number; values: Record<string, string> }>;
  problems: Array<{ line: number; message: string }>;
}

export function rawFromText(file: string, text: string): RawTable {
  try {
    const t = readCsvTable(text);
    return { file, missing: false, header: t.header, rows: t.rows, problems: t.problems };
  } catch (e) {
    if (e instanceof CsvError) return { file, missing: false, header: [], rows: [], problems: [{ line: e.line, message: `malformed CSV: ${e.message}` }] };
    throw e;
  }
}

export function readRawTable(path: string, file: string): RawTable {
  if (!existsSync(path)) return { file, missing: true, header: [], rows: [], problems: [] };
  return rawFromText(file, readFileSync(path, 'utf8'));
}

/** A deep copy, for tests that seed errors into a loaded fixture. */
export function cloneRaw(t: RawTable): RawTable {
  return { ...t, header: [...t.header], rows: t.rows.map((r) => ({ line: r.line, values: { ...r.values } })), problems: [...t.problems] };
}
