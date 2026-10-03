/**
 * Minimal RFC 4180 CSV reading and writing shared by the acquisition and keying tools
 * (tools/discover, fetch, crops, keying, synth, review).
 *
 * - Fields are separated by commas; a field containing a comma, quote, CR, LF or leading/trailing
 *   space is written in double quotes with inner quotes doubled.
 * - Output always uses LF line endings and ends with a newline, so files diff cleanly.
 * - Input may use CRLF or LF, may start with a UTF-8 BOM, and may have blank lines (skipped).
 *   A quote in the middle of an unquoted field is kept literally (lenient, as many writers do).
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export type CsvRow = Record<string, string>;

export interface CsvTable {
  header: string[];
  rows: CsvRow[];
}

export class CsvError extends Error {
  override name = 'CsvError';
}

/** Parses CSV text into records (arrays of fields). Blank lines are skipped. */
export function parseCsvRecords(text: string): Array<{ line: number; fields: string[] }> {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const out: Array<{ line: number; fields: string[] }> = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let quotedField = false;
  let line = 1;
  let recordLine = 1;
  const endField = () => { fields.push(field); field = ''; quotedField = false; };
  const endRecord = () => {
    endField();
    const blank = fields.length === 1 && fields[0] === '';
    if (!blank) out.push({ line: recordLine, fields });
    fields = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else {
        if (c === '\n') line++;
        field += c;
      }
      continue;
    }
    if (c === '"' && field.length === 0 && !quotedField) {
      inQuotes = true; quotedField = true;
    } else if (c === '"' && quotedField) {
      throw new CsvError(`line ${line}: text after a closing quote`);
    } else if (c === ',') endField();
    else if (c === '\r') { /* handled with the following \n; a lone CR is dropped */ }
    else if (c === '\n') { endRecord(); line++; recordLine = line; }
    else {
      if (quotedField) throw new CsvError(`line ${line}: text after a closing quote`);
      field += c;
    }
  }
  if (inQuotes) throw new CsvError(`line ${recordLine}: unterminated quoted field`);
  if (field.length > 0 || fields.length > 0 || quotedField) endRecord();
  return out;
}

/**
 * Parses CSV with a header row into objects keyed by column name.
 * Throws when a required column is missing or a record has the wrong number of fields.
 */
export function parseCsv(text: string, opts: { required?: readonly string[]; file?: string } = {}): CsvTable {
  const where = opts.file ? `${opts.file}: ` : '';
  const recs = parseCsvRecords(text);
  if (recs.length === 0) {
    if (opts.required && opts.required.length) throw new CsvError(`${where}empty file (no header row)`);
    return { header: [], rows: [] };
  }
  const header = recs[0]!.fields.map((h) => h.trim());
  const seen = new Set<string>();
  for (const h of header) {
    if (seen.has(h)) throw new CsvError(`${where}duplicate column "${h}"`);
    seen.add(h);
  }
  for (const r of opts.required ?? []) if (!seen.has(r)) throw new CsvError(`${where}missing column "${r}"`);
  const rows: CsvRow[] = [];
  for (const rec of recs.slice(1)) {
    if (rec.fields.length !== header.length) {
      throw new CsvError(`${where}line ${rec.line}: ${rec.fields.length} fields, header has ${header.length}`);
    }
    const row: CsvRow = {};
    header.forEach((h, i) => { row[h] = rec.fields[i]!; });
    rows.push(row);
  }
  return { header, rows };
}

function quote(v: string): string {
  if (v === '') return '';
  if (/[",\r\n]/.test(v) || /^\s|\s$/.test(v)) return `"${v.replaceAll('"', '""')}"`;
  return v;
}

/** Writes rows under `header`; missing fields become empty strings, unknown fields are an error. */
export function writeCsv(header: readonly string[], rows: readonly CsvRow[]): string {
  const known = new Set(header);
  const lines = [header.map(quote).join(',')];
  for (const r of rows) {
    for (const k of Object.keys(r)) if (!known.has(k)) throw new CsvError(`writeCsv: unknown column "${k}"`);
    lines.push(header.map((h) => quote(r[h] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

export function readCsvFile(path: string, required?: readonly string[]): CsvTable {
  return parseCsv(readFileSync(path, 'utf8'), { file: path, ...(required ? { required } : {}) });
}

/** Reads a CSV file if it exists; otherwise returns an empty table with the given header. */
export function readCsvFileOr(path: string, header: readonly string[]): CsvTable {
  if (!existsSync(path)) return { header: [...header], rows: [] };
  return readCsvFile(path, header);
}

/** Writes a text file atomically (temp file + rename), creating parent folders. */
export function writeTextFile(path: string, text: string | Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

export function writeCsvFile(path: string, header: readonly string[], rows: readonly CsvRow[]): void {
  writeTextFile(path, writeCsv(header, rows));
}

/** Byte-wise string comparison (locale-independent) for deterministic sorts. */
export function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Compares numeric-looking strings numerically, others byte-wise. */
export function cmpNumStr(a: string, b: string): number {
  const na = Number(a); const nb = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return cmpStr(a, b);
}
