/**
 * RFC 4180 CSV reading and writing for the canonical data files.
 *
 * Reading:
 *  - records end with CRLF, LF or a lone CR; a final line break is optional;
 *  - a field that starts with a double quote is quoted: it may contain commas, quotes (doubled)
 *    and line breaks, and its closing quote must be followed by a comma, a line break or the end;
 *  - a double quote inside an unquoted field, an unterminated quoted field, or text after a
 *    closing quote is an error (with the line number), never silently repaired;
 *  - a leading UTF-8 byte-order mark is ignored.
 * Writing: fields containing a comma, a double quote, CR or LF, or leading or trailing spaces,
 * are quoted (quotes doubled); every record ends with "\n" (LF; the repository stores text files
 * with LF line ends).
 */

export class CsvError extends Error {
  readonly line: number;
  constructor(message: string, line: number) {
    super(`line ${line}: ${message}`);
    this.name = 'CsvError';
    this.line = line;
  }
}

export interface CsvRecord {
  /** 1-based line on which the record starts. */
  line: number;
  fields: string[];
}

/** Parses CSV text into records (the header, if any, is the first record). */
export function parseCsv(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const n = text.length;
  let line = 1;
  if (i >= n) return records;
  let fields: string[] = [];
  let recordLine = line;
  for (;;) {
    // Read one field starting at i.
    let field = '';
    if (text[i] === '"') {
      const startLine = line;
      i++;
      for (;;) {
        if (i >= n) throw new CsvError('unterminated quoted field', startLine);
        const c = text[i]!;
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          i++;
          break;
        }
        if (c === '\r') {
          if (text[i + 1] === '\n') { field += '\r\n'; i += 2; } else { field += '\r'; i++; }
          line++;
          continue;
        }
        if (c === '\n') line++;
        field += c;
        i++;
      }
      if (i < n && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
        throw new CsvError(`unexpected text after a closing quote: ${JSON.stringify(text.slice(i, i + 10))}`, line);
      }
    } else {
      const start = i;
      while (i < n) {
        const c = text[i]!;
        if (c === ',' || c === '\n' || c === '\r') break;
        if (c === '"') throw new CsvError('double quote inside an unquoted field (quote the whole field and double the quote)', line);
        i++;
      }
      field = text.slice(start, i);
    }
    fields.push(field);
    if (i >= n) { records.push({ line: recordLine, fields }); break; }
    const c = text[i]!;
    if (c === ',') { i++; if (i >= n) { fields.push(''); records.push({ line: recordLine, fields }); break; } continue; }
    // Line break: end of record.
    i += c === '\r' && text[i + 1] === '\n' ? 2 : 1;
    line++;
    records.push({ line: recordLine, fields });
    fields = [];
    recordLine = line;
    if (i >= n) break;
  }
  return records;
}

const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;

export function formatField(v: string): string {
  return NEEDS_QUOTES.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Writes records; every record ends with "\n". */
export function formatCsv(rows: readonly (readonly string[])[]): string {
  let out = '';
  for (const r of rows) out += r.map(formatField).join(',') + '\n';
  return out;
}

export interface CsvTable {
  header: string[];
  rows: Array<{ line: number; values: Record<string, string> }>;
  /** Problems found while reading (field-count mismatches, duplicate header names). */
  problems: Array<{ line: number; message: string }>;
}

const isBlank = (r: CsvRecord): boolean => r.fields.length === 1 && r.fields[0] === '';

/**
 * Reads a CSV with a header row into objects keyed by column name. Blank lines are skipped.
 * Records with the wrong number of fields are reported and skipped. Throws CsvError on
 * malformed quoting.
 */
export function readCsvTable(text: string): CsvTable {
  const recs = parseCsv(text).filter((r) => !isBlank(r));
  const problems: CsvTable['problems'] = [];
  const first = recs[0];
  if (!first) return { header: [], rows: [], problems };
  const header = first.fields.map((h) => h.trim());
  const seen = new Set<string>();
  for (const h of header) {
    if (seen.has(h)) problems.push({ line: first.line, message: `duplicate column "${h}"` });
    seen.add(h);
  }
  const rows: CsvTable['rows'] = [];
  for (const r of recs.slice(1)) {
    if (r.fields.length !== header.length) {
      problems.push({ line: r.line, message: `${r.fields.length} fields, header has ${header.length}` });
      continue;
    }
    const values: Record<string, string> = {};
    header.forEach((h, k) => { values[h] = r.fields[k]!; });
    rows.push({ line: r.line, values });
  }
  return { header, rows, problems };
}

/** Writes objects under a header (missing values are written empty). */
export function writeCsvTable(header: readonly string[], rows: ReadonlyArray<Readonly<Record<string, string>>>): string {
  return formatCsv([header, ...rows.map((r) => header.map((h) => r[h] ?? ''))]);
}

/** Code-unit string comparison (locale-independent), for deterministic sorting. */
export function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
