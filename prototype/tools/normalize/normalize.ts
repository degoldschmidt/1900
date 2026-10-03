/**
 * Normaliser: resolved keyed cells of one printed table → canonical services, stops and footnotes.
 *
 *   node tools/normalize/normalize.ts --edition <edition_id> --table <table_ref> [--data <root>] [--check] [--partial]
 *
 * Reads data/raw/<source_id>/<table_ref>/crops.csv and each <crop_id>.R.csv (the resolved long
 * format of tools/keying/longcsv.ts: col/row are absolute grid indices, so crops stitch), the
 * edition's notation file (tools/schema/notation.ts), station_aliases.csv (the edition's family),
 * stations, zones and station_zones (to order times across clock zones), running_rules.csv and
 * waivers.csv. Without --check it replaces that table's rows in data/canonical/services.csv,
 * stops.csv and footnotes.csv. Any error (unknown station label, unreadable time, missing
 * a.m./p.m., ambiguous day offset, unreviewed footnote mark, unresolved cell…) writes nothing and
 * exits 1: the normaliser flags, it never guesses.
 *
 * --partial (pilot work in progress) writes what can be read and lists the rest:
 *  - an illegible or unresolved time cell without a waiver becomes a stop with no time and status
 *    illegible/unresolved (V11 blocks compilation until the historian waives or re-reads it); a
 *    station label whose only unreadable part is the distance figure is read without it;
 *  - an unreviewed running_rules row is applied as proposed and reported (V07 blocks compilation
 *    until it is reviewed);
 *  - a column with any other error is left out and listed (skipped);
 *  - errors that concern the whole table (an unknown station, crops that disagree, a missing
 *    notation entry, an unreadable footnote mark on a label) still write nothing.
 *
 * Reading a table:
 *  - label sub-column 0 is the station as printed (〃 = the station of the row above), mapped by
 *    station_aliases.csv; sub-column 1 (or a suffix of the name) is an arr./dep. marker (notation
 *    arrMarkers/depMarkers); a row with neither is a single line (notation singleTime). With
 *    labelMarkers "prefix" the marker comes before the name ("a. Dresden Hbf.", "in Bodenbach"),
 *    a leading 〃 repeats the marker of the row above (tables.<t>.dittoMarkers when that row was
 *    not keyed), and in a table with upColumns a marker after the name belongs to the upward
 *    reading; labelKm drops a distance figure before the name and labelTableRefs the
 *    connecting-table numbers after it;
 *  - header line i means notation headerLines[i] (train_no, classes, name, operator, marks,
 *    ignore); 〃 in a header cell repeats the cell to its left on the same line;
 *  - a body cell is empty, a pass-through or not-served sign (no stop), an a.m./p.m. marker
 *    (changes the column's state), a literal ("noon"), a ditto (repeats the time above, if the
 *    notation allows), a cellWords word ("ab": a train starts at the next time; "Ank.": the train
 *    ends at the time above; either splits the column into separate trains), or a time "H M"
 *    with optional a.m./p.m. prefix or suffix; signs listed in symbolFlags (in the label or the
 *    cell) set stop flags;
 *  - columns in tables.<t>.upColumns are read bottom to top;
 *  - rows of a tables.<t>.altRows group are alternative ends (read upwards: starts) of the
 *    journey: a train with times in several of them gives one service per row (.r<row>);
 *  - an arr. line followed by a dep. line of the same station make one stop;
 *  - day offsets follow from monotonicity: each time takes the smallest day offset that keeps the
 *    absolute time (local − zone offset) from going backwards; a leg or dwell longer than
 *    maxLegHours is ambiguous and is an error;
 *  - a column's footnote marks (marks header line, and fn:x marks on its header cells) become a
 *    running rule only through a reviewed running_rules.csv row for that edition, table and mark
 *    ("none" = no running-day meaning); several running marks need a row for the combined mark
 *    ("a+b", marks sorted); no marks: notation unmarkedRunning;
 *  - a footnote mark (fn:x) on a time cell is accepted only when running_rules.csv records the
 *    mark, reviewed, as "none" (no effect on running days); otherwise it is an error;
 *  - the resolved file's resolution decides (agree → status agree; A, B or other → resolved); the
 *    keyers' sure flags are not used. A cell resolved "illegible" (or left unresolved) blocks
 *    unless waivers.csv has a waiver citing it; the cell then gives no time and its stop has
 *    status "waived".
 *
 * Column notes (notation columnNotes; footnote rows of column-notes crops carry c:<col> marks):
 *  - a note is a train number with its class line (columnNotes.header: the train number and
 *    classes of a column whose header leaves them out), a class line alone (columnNotes.classes),
 *    a sleeping car (columnNotes.sleeper), a train category (columnNotes.category), a note
 *    without running-day meaning (columnNotes.info), a lone sign (the column carries that mark),
 *    or otherwise (or if it matches columnNotes.running) a running note, which needs a
 *    running_rules.csv row;
 *  - its mark is "<sign>@c<col>[.c<col>…]" ("@c<col>" without a sign, "/2", "/3" for further
 *    notes of the same mark); table footnotes from footnote crops are "<sign>@<panel>";
 *  - a note applies to the columns it is printed in and, if it has a sign, wherever the sign is
 *    printed: on header cells and the first time of a train (on any other time cell only a note
 *    without running-day meaning is accepted). A sign is looked up in the same column, then the
 *    footnotes of the same page, then the notes of the same page, then the whole table. A sign on
 *    a station label needs tables.<t>.labelMarkFlags (a stop flag, or "none");
 *  - the category is the train number's prefix (category.prefixes), else a category note, else a
 *    type style carried by every time of the train (category.marks).
 * Every row's src is source:p<page>:table:crop:cell (cells c<col>r<row>, two-line stops
 * c<col>r<row>-<row2>, headers h<line>c<col>, footnotes f<n>).
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT } from '../make/paths.ts';
import { loadDataset, type Dataset } from '../schema/dataset.ts';
import { STOP_FLAGS, formatRow, headerOf, specOf, type FootnoteRow, type ServiceRow, type StopRow } from '../schema/canonical.ts';
import { citationCovers, formatCitation } from '../schema/citation.ts';
import { cmpStr, writeCsvTable } from '../schema/csv.ts';
import { hmOfSec, zoneLookup, type ZoneLookup } from '../schema/derive.ts';
import { issue, errorsOf, formatIssue, type Issue } from '../schema/issues.ts';
import type { HeaderField, Notation, StopFlag, TableNotation } from '../schema/notation.ts';
import type { CellRow, CropRow } from '../schema/raw-keying.ts';
import type { RunningRuleRow, WaiverRow } from '../schema/canonical.ts';
import { parseRule } from '../schema/running-rule.ts';

export type ServiceOut = Omit<ServiceRow, 'line'>;
export type StopOut = Omit<StopRow, 'line'>;
export type FootnoteOut = Omit<FootnoteRow, 'line'>;

export interface NormalizeInput {
  editionId: string;
  sourceId: string;
  family: string;
  tableRef: string;
  notation: Notation;
  crops: readonly CropRow[];
  /** Resolved cells by crop_id. */
  cells: ReadonlyMap<string, readonly CellRow[]>;
  /** alias_as_printed → station_id, for the edition's family. */
  aliases: ReadonlyMap<string, string>;
  zones: ZoneLookup;
  /** Day on which zone offsets are taken (the edition's valid_from). */
  refDay: number;
  runningRules: readonly RunningRuleRow[];
  waivers: readonly WaiverRow[];
}

export interface NormalizeOptions {
  /** Write what can be read (see the file comment); default false. */
  partial?: boolean;
}

export interface NormalizeResult {
  services: ServiceOut[];
  stops: StopOut[];
  footnotes: FootnoteOut[];
  issues: Issue[];
  /** Columns left out because of errors (partial mode lists them; strict mode writes nothing anyway). */
  skipped: Array<{ col: number; error: string }>;
  /** Errors that concern the whole table: nothing may be written. */
  tableErrors: number;
}

type CellStatus = 'agree' | 'resolved' | 'waived' | 'illegible' | 'unresolved';
const STATUS_RANK: Record<CellStatus, number> = { agree: 0, resolved: 1, waived: 2, unresolved: 3, illegible: 4 };
const PENDING = (s: CellStatus): boolean => s === 'illegible' || s === 'unresolved';

interface Cell {
  kind: CellRow['kind'];
  col: number;
  row: number;
  /** Text as printed; empty when the cell is waived. */
  text: string;
  marks: string[];
  status: CellStatus;
  crop: string;
  page: number;
}

type Line = 'arr' | 'dep' | 'single';
interface Label { row: number; station: string; down: Line; up: Line; flags: Set<StopFlag> }

interface TimeEvent {
  row: number;
  station: string;
  line: Line;
  /** Seconds after local midnight, or null for a waived or unreadable cell. */
  sec: number | null;
  raw: string;
  status: CellStatus;
  flags: Set<StopFlag>;
  cell: Cell;
}

interface StopDraft {
  station: string;
  arr: TimeEvent | null;
  dep: TimeEvent | null;
  rows: number[];
}

type NoteKind = 'header' | 'classes' | 'sleeper' | 'category' | 'info' | 'mark' | 'running';
interface Note {
  /** The mark this note is recorded under (footnotes.csv, running_rules.csv). */
  id: string;
  /** Its sign (the fn:<sign> mark), "?" when the sign could not be read, or null. */
  sym: string | null;
  text: string;
  /** The text without its leading sign. */
  body: string;
  /** Columns it is printed in (column notes); empty for a table footnote. */
  cols: number[];
  kind: NoteKind;
  trainNo?: string;
  classes?: string;
  category?: string;
  cell: Cell;
}

const sanitizeId = (s: string): string => s.replace(/[^A-Za-z0-9_.-]+/g, '-');

function cellRef(c: { kind: string; col: number; row: number }): string {
  switch (c.kind) {
    case 'cell': return `c${c.col}r${c.row}`;
    case 'header': return `h${c.row}c${c.col}`;
    case 'label': return `l${c.col}r${c.row}`;
    default: return `f${c.row}`;
  }
}

/** A station label split into its parts (labelMarkers "prefix"). */
export interface LabelParts {
  name: string;
  /** Marker before the name as printed, the ditto sign, or null. */
  pre: string | null;
  /** Marker after the name (tables read both ways), the ditto sign, or null. */
  post: string | null;
  /** The distance figure before the name has unreadable digits ("?"). */
  kmIllegible: boolean;
}

/**
 * Splits a label printed as "[km] [marker] name [table numbers] [marker]", e.g.
 * "198 i.Berlin Anh.Bf.312" → name "Berlin Anh.Bf.", pre "i.". Leader dots (…) are dropped.
 */
export function parseLabelText(text: string, n: Notation, twoWay: boolean): LabelParts {
  let t = text.split(/\s+/).filter((x) => x !== '' && x !== '…').join(' ');
  let kmIllegible = false;
  if (n.labelKm) {
    const m = /^([\d?]+)\s+(?=\S)/.exec(t);
    if (m) { kmIllegible = m[1]!.includes('?'); t = t.slice(m[0].length); }
  }
  const markers = [...n.arrMarkers, ...n.depMarkers].sort((a, b) => b.length - a.length || cmpStr(a, b));
  let pre: string | null = null;
  for (const d of n.ditto) if (t.startsWith(`${d} `)) { pre = d; t = t.slice(d.length + 1); break; }
  if (pre === null) {
    for (const m of markers) {
      const spaced = t.startsWith(`${m} `);
      const tight = m.endsWith('.') && t.length > m.length && t.startsWith(m) && /\p{L}/u.test(t[m.length]!);
      if (spaced || tight) { pre = m; t = t.slice(m.length).trimStart(); break; }
    }
  }
  let post: string | null = null;
  if (twoWay) {
    const m = /^(.*\S)\s+(\S+)$/.exec(t);
    if (m && (markers.includes(m[2]!) || n.ditto.includes(m[2]!))) { post = m[2]!; t = m[1]!; }
  }
  if (n.labelTableRefs) {
    const re = /(?:\s+|(?<=\.))[\d?]+[a-z]?(?:[.,]\s?[\d?]+[a-z]?)*[.,]?$/u;
    for (;;) {
      const m = re.exec(t);
      if (!m || m.index === 0) break;
      t = t.slice(0, m.index).trimEnd();
    }
  }
  return { name: t.trim(), pre, post, kmIllegible };
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

/**
 * Reads a class line such as "I-IV", "II.-IV", "I.-III.", "II. III", "(I. II)": the classes named
 * (ranges included). Fourth class is read but dropped, since services.classes holds 1–3.
 * Returns null if anything else is printed.
 */
export function parseClasses(text: string): Set<'1' | '2' | '3'> | null {
  const t = text.replace(/[()]/g, ' ').trim();
  const re = /(IV|I{1,3})\.?\s*(?:-\s*(IV|I{1,3})\.?)?/gy;
  const out = new Set<'1' | '2' | '3'>();
  let pos = 0;
  const s = t.replace(/\s+/g, ' ');
  while (pos < s.length) {
    if (s[pos] === ' ' || s[pos] === ',' || s[pos] === '/') { pos++; continue; }
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m || m[0] === '') return null;
    const a = ROMAN[m[1]!]!; const b = m[2] ? ROMAN[m[2]]! : a;
    if (b < a) return null;
    for (let k = a; k <= b; k++) if (k <= 3) out.add(String(k) as '1' | '2' | '3');
    pos = re.lastIndex;
  }
  return out.size || /IV/.test(s) ? out : null;
}

export function normalizeTable(inp: NormalizeInput, opts: NormalizeOptions = {}): NormalizeResult {
  const partial = opts.partial === true;
  const issues: Issue[] = [];
  const skipped: Array<{ col: number; error: string }> = [];
  const where = `${inp.editionId} ${inp.tableRef}`;
  const E = (w: string, m: string) => issues.push(issue('normalize', 'error', `${where} ${w}`.trim(), m));
  const Wn = (w: string, m: string) => issues.push(issue('normalize', 'warning', `${where} ${w}`.trim(), m));
  const n = inp.notation;
  const tn = n.tables[inp.tableRef];
  const empty = (): NormalizeResult => ({ services: [], stops: [], footnotes: [], issues, skipped, tableErrors: errorsOf(issues).length });
  if (!tn) {
    E('', `notation for ${inp.editionId} has no tables.${inp.tableRef} entry (operator, mode, segments)`);
    return empty();
  }
  const tbl: TableNotation = tn;
  const cite = (crop: string, page: number, cell: string) => formatCitation({ source: inp.sourceId, pageSeq: page, tableRef: inp.tableRef, crop, cell });
  const fnMarks = (marks: readonly string[]) => marks.filter((m) => m.startsWith('fn:')).map((m) => m.slice(3));

  // 1. Stitch the crops: one cell per (kind, col, row); footnotes per crop.
  const cropPage = new Map(inp.crops.filter((c) => c.table_ref === inp.tableRef).map((c) => [c.crop_id, c.page_seq]));
  const grid = new Map<string, Cell>();
  const footCells: Cell[] = [];
  for (const cropId of [...inp.cells.keys()].sort(cmpStr)) {
    const page = cropPage.get(cropId);
    if (page === undefined) { E(cropId, `crop ${cropId} is not listed for table ${inp.tableRef} in crops.csv`); continue; }
    for (const r of inp.cells.get(cropId)!) {
      if (r.crop_id !== cropId) { E(cropId, `cell ${cellRef(r)} names crop ${r.crop_id}`); continue; }
      let status: CellStatus = r.resolution === 'agree' ? 'agree' : r.resolution === '' ? 'unresolved' : r.resolution === 'illegible' ? 'illegible' : 'resolved';
      let text = r.text_as_printed;
      if (PENDING(status)) {
        const c = cite(cropId, page, cellRef(r));
        if (inp.waivers.some((w) => citationCovers(w.src, c) || citationCovers(c, w.src))) { status = 'waived'; text = ''; }
      }
      const cell: Cell = { kind: r.kind, col: r.col, row: r.row, text, marks: r.marks, status, crop: cropId, page };
      if (r.kind === 'footnote') { footCells.push(cell); continue; }
      const k = `${r.kind}:${r.col}:${r.row}`;
      const prev = grid.get(k);
      if (!prev) grid.set(k, cell);
      else if (prev.text !== cell.text || prev.marks.join(';') !== cell.marks.join(';')) {
        E(cellRef(r), `crops ${prev.crop} and ${cropId} disagree on ${cellRef(r)}: "${prev.text}" vs "${cell.text}"`);
      }
    }
  }
  const cells = [...grid.values()];
  const blocked = (c: Cell, what: string): boolean => {
    if (PENDING(c.status)) {
      E(cellRef(c), `${what} ${cellRef(c)} (${c.crop}) is ${c.status} and has no waiver`);
      return true;
    }
    return false;
  };
  const upCols = new Set(tn.upColumns ?? []);
  const twoWay = upCols.size > 0;
  const cn = n.columnNotes ?? null;

  // 2. Column notes and table footnotes (guides with columnNotes).
  const notes: Note[] = [];
  const footnotes = new Map<string, FootnoteOut>();
  const sortedFoot = footCells.sort((a, b) => cmpStr(a.crop, b.crop) || a.row - b.row);
  if (cn) {
    const rx = (s: string) => new RegExp(s, 'u');
    const header = cn.header ? rx(cn.header) : null;
    const classesRe = cn.classes ? rx(cn.classes) : null;
    const sleeperRe = cn.sleeper.map(rx); const infoRe = cn.info.map(rx); const runningRe = cn.running.map(rx);
    const catRe = cn.category.map((c) => ({ re: rx(c.re), category: c.category }));
    const ids = new Map<string, number>();
    for (const c of sortedFoot) {
      if (c.text === '' && c.status !== 'waived' && !PENDING(c.status)) continue;
      if (c.status === 'waived') continue;
      if (PENDING(c.status)) {
        if (!partial) { blocked(c, 'note'); continue; }
        Wn(`${c.crop} f${c.row}`, `pending: note "${c.text}" is ${c.status} (no waiver); read as far as it goes`);
      }
      const cols = c.marks.filter((m) => /^c:\d+$/.test(m)).map((m) => Number(m.slice(2))).sort((a, b) => a - b);
      let sym = fnMarks(c.marks)[0] ?? null;
      let body = c.text.trim();
      if (sym !== null && body.startsWith(sym)) body = body.slice(sym.length).trim();
      else if (sym === '?' && body.startsWith('?')) body = body.slice(1).trim();
      let kind: NoteKind = 'running';
      const note: Partial<Note> = {};
      if (sym === null && /^[^\p{L}\p{N}\s]$/u.test(body)) { sym = body; body = ''; kind = 'mark'; }
      else if (body === '' && sym !== null) kind = 'mark';
      else {
        const h = header?.exec(body);
        if (h?.groups?.no) { kind = 'header'; note.trainNo = h.groups.no; note.classes = h.groups.cls ?? ''; }
        else if (classesRe?.test(body)) { kind = 'classes'; note.classes = body; }
        else if (runningRe.some((r) => r.test(body))) kind = 'running';
        else if (sleeperRe.some((r) => r.test(body))) kind = 'sleeper';
        else {
          const cat = catRe.find((x) => x.re.test(body));
          if (cat) { kind = 'category'; note.category = cat.category; }
          else if (infoRe.some((r) => r.test(body))) kind = 'info';
        }
      }
      const panel = /-(?:cn|fn)-(p\d+)/.exec(c.crop)?.[1] ?? c.crop;
      const base = cols.length ? `${sym ?? ''}@${cols.map((x) => `c${x}`).join('.')}` : `${sym ?? '?'}@${panel}`;
      const k = (ids.get(base) ?? 0) + 1;
      ids.set(base, k);
      const id = k === 1 ? base : `${base}/${k}`;
      notes.push({ id, sym, text: c.text, body, cols, kind, cell: c, ...note });
      if (kind !== 'header' && kind !== 'classes' && kind !== 'mark') {
        footnotes.set(id, { edition_id: inp.editionId, table_ref: inp.tableRef, mark: id, text_as_printed: c.text, src: cite(c.crop, c.page, cellRef(c)) });
      }
    }
  } else {
    for (const c of sortedFoot) {
      if (blocked(c, 'footnote')) continue;
      const mark = c.marks.find((m) => m.startsWith('fn:'))?.slice(3);
      if (!mark) { E(`${c.crop} f${c.row}`, `footnote "${c.text}" carries no fn:<mark>`); continue; }
      const prev = footnotes.get(mark);
      if (prev) { if (prev.text_as_printed !== c.text) E(`${c.crop} f${c.row}`, `footnote ${mark} printed twice with different text`); continue; }
      footnotes.set(mark, { edition_id: inp.editionId, table_ref: inp.tableRef, mark, text_as_printed: c.text, src: cite(c.crop, c.page, cellRef(c)) });
    }
  }
  /** The note a sign printed at (col, page) refers to; see the file comment for the search order. */
  const noteForMark = (sym: string, col: number | null, page: number, self?: Note): Note | { error: string } => {
    const cand = notes.filter((x) => x.sym === sym && x !== self && x.kind !== 'mark');
    const steps: Note[][] = [
      col === null ? [] : cand.filter((x) => x.cols.includes(col)),
      cand.filter((x) => x.cols.length === 0 && x.cell.page === page),
      cand.filter((x) => x.cols.length > 0 && x.cell.page === page),
      cand,
    ];
    for (const s of steps) {
      if (s.length === 0) continue;
      if (new Set(s.map((x) => x.body)).size > 1) return { error: `sign ${sym} is ambiguous here: ${s.map((x) => `"${x.text}" (${x.id})`).join(', ')}` };
      return s[0]!;
    }
    return { error: `sign ${sym} is explained by no note or footnote of this table that was keyed` };
  };

  // 3. Labels → stations and line types.
  const symbols = Object.keys(n.symbolFlags).sort(cmpStr);
  const takeSymbols = (text: string, flags: Set<StopFlag>): string => {
    let t = text;
    for (const s of symbols) if (t.includes(s)) { flags.add(n.symbolFlags[s]!); t = t.split(s).join(' '); }
    return t.replace(/\s+/g, ' ').trim();
  };
  const lineOf = (s: string): 'arr' | 'dep' | null => (n.arrMarkers.includes(s) ? 'arr' : n.depMarkers.includes(s) ? 'dep' : null);
  const labelRows = [...new Set(cells.filter((c) => c.kind === 'label').map((c) => c.row))].sort((a, b) => a - b);
  const labels = new Map<number, Label>();
  let prevStation: string | null = null;
  const prevMarker = new Map<number, { pre: string | null; post: string | null }>();
  for (const row of labelRows) {
    const name = grid.get(`label:0:${row}`);
    const sub = grid.get(`label:1:${row}`);
    if (!name) { E(`l0r${row}`, `row ${row} has no station label`); continue; }
    if (name.status === 'waived') { E(`l0r${row}`, 'a station label cannot be waived; it must be read'); continue; }
    const flags = new Set<StopFlag>();
    let text = takeSymbols(name.text, flags);
    let down: Line = 'single'; let up: Line = 'single';
    if (n.labelMarkers === 'prefix') {
      const p = parseLabelText(text, n, twoWay);
      if (PENDING(name.status)) {
        if (!partial || !p.kmIllegible || p.name.includes('?')) { blocked(name, 'label'); continue; }
        Wn(`l0r${row}`, `pending: label "${name.text}" (${name.crop}) is ${name.status}; only its distance figure is unreadable, so the station is read without it`);
      }
      const side = (m: string | null, which: 'pre' | 'post'): Line | null => {
        if (m === null) return 'single';
        if (!n.ditto.includes(m)) return lineOf(m);
        const fixed = which === 'pre' ? tn.dittoMarkers?.[String(row)] : undefined;
        const above = prevMarker.get(row - 1)?.[which] ?? fixed ?? null;
        if (above === null || n.ditto.includes(above)) { E(`l0r${row}`, `"${name.text}": the ditto repeats the marker of row ${row - 1}, which is not keyed (add tables.${inp.tableRef}.dittoMarkers)`); return null; }
        return lineOf(above);
      };
      const d = side(p.pre, 'pre'); const u = twoWay ? side(p.post, 'post') : d;
      if (d === null || u === null) continue;
      const resolvedPre = p.pre !== null && n.ditto.includes(p.pre) ? (prevMarker.get(row - 1)?.pre ?? tn.dittoMarkers?.[String(row)] ?? null) : p.pre;
      const resolvedPost = p.post !== null && n.ditto.includes(p.post) ? (prevMarker.get(row - 1)?.post ?? null) : p.post;
      prevMarker.set(row, { pre: resolvedPre, post: resolvedPost });
      down = d; up = u; text = p.name;
    } else {
      if (blocked(name, 'label')) continue;
      let line: Line = 'single';
      if (sub && sub.text) {
        if (blocked(sub, 'label')) continue;
        const l = lineOf(takeSymbols(sub.text, flags));
        if (!l) { E(`l1r${row}`, `"${sub.text}" is not an arr./dep. marker of this guide`); continue; }
        line = l;
      } else {
        const m = /^(.*?)\s+(\S+)$/.exec(text);
        const l = m ? lineOf(m[2]!) : null;
        if (m && l) { line = l; text = m[1]!; }
      }
      down = line; up = line;
    }
    let station: string | null;
    if (n.ditto.includes(text)) {
      station = prevStation;
      if (!station) { E(`l0r${row}`, 'ditto label with no station above'); continue; }
    } else {
      station = inp.aliases.get(text) ?? null;
      if (!station) { E(`l0r${row}`, `station "${text}" is not in station_aliases.csv for family ${inp.family}`); continue; }
    }
    if (cn) {
      for (const m of fnMarks(name.marks)) {
        const f = tn.labelMarkFlags?.[m];
        if (f === 'none') continue;
        if (f) { flags.add(f); continue; }
        const note = noteForMark(m, null, name.page);
        if ('error' in note) { E(`l0r${row}`, `mark ${m} on "${name.text}": ${note.error}`); continue; }
        if (note.kind === 'running') E(`l0r${row}`, `mark ${m} on "${name.text}" refers to "${note.text}", which is neither a stop flag (tables.${inp.tableRef}.labelMarkFlags) nor a note without running-day meaning`);
      }
    }
    prevStation = station;
    labels.set(row, { row, station, down, up, flags });
  }
  const tableErrors = errorsOf(issues).length;

  // 4. Header information per train column.
  const lines: HeaderField[] = tn.headerLines ?? n.headerLines;
  const trainCols = [...new Set(cells.filter((c) => c.kind === 'cell' || c.kind === 'header').map((c) => c.col))].sort((a, b) => a - b);
  const headerText = new Map<string, { text: string; cell: Cell }>();
  const headerPending = new Map<number, Cell[]>();
  const headerRows = [...new Set(cells.filter((c) => c.kind === 'header').map((c) => c.row))].sort((a, b) => a - b);
  for (const hr of headerRows) {
    if (lines[hr] === undefined) E(`h${hr}`, `header line ${hr} has no meaning in the notation's headerLines`);
    let left: string | null = null;
    for (const col of trainCols) {
      const c = grid.get(`header:${col}:${hr}`);
      if (!c) { left = null; continue; }
      if (PENDING(c.status)) {
        if (partial) { headerPending.set(col, [...(headerPending.get(col) ?? []), c]); left = null; continue; }
        blocked(c, 'header cell'); left = null; continue;
      }
      let text = c.text;
      if (n.ditto.includes(text)) {
        if (left === null) { E(cellRef(c), 'ditto in a header cell with nothing to its left'); continue; }
        text = left;
      }
      headerText.set(`${col}:${hr}`, { text, cell: c });
      left = text;
    }
  }
  const field = (col: number, f: HeaderField): { text: string; cell: Cell } | null => {
    const i = lines.indexOf(f);
    return i < 0 ? null : headerText.get(`${col}:${i}`) ?? null;
  };

  // 5. Columns → services and stops.
  const sepClass = n.timeSeparators.map((s) => s.replace(/[\\\]^-]/g, '\\$&')).join('');
  const timeRe = new RegExp(`^(\\d{1,2})[${sepClass}](\\d{1,2})$`);
  const meridianMarkers = (s: string): 'am' | 'pm' | null => (n.meridian?.amMarkers.includes(s) ? 'am' : n.meridian?.pmMarkers.includes(s) ? 'pm' : null);
  const services: ServiceOut[] = [];
  const stopsOut: StopOut[] = [];
  const runRules = new Map(inp.runningRules.filter((r) => r.edition_id === inp.editionId && r.table_ref === inp.tableRef).map((r) => [r.mark, r]));
  const ruleNone = (mark: string): boolean => { const rr = runRules.get(mark); return !!rr && !!rr.reviewed_by && rr.rule_dsl === 'none'; };

  for (const col of trainCols) {
    const cw = `c${col}`;
    const up = upCols.has(col);
    let colError: string | null = null;
    const CE = (w: string, m: string) => { E(w, m); colError ??= `${w}: ${m}`; };
    const CW = (w: string, m: string) => Wn(w, m);
    for (const h of headerPending.get(col) ?? []) {
      const f = lines[h.row];
      if (f === 'train_no') CE(cellRef(h), `train number ${cellRef(h)} (${h.crop}) "${h.text}" is ${h.status} (no waiver); the train cannot be identified`);
      else CW(cellRef(h), `pending: header ${cellRef(h)} (${h.crop}) "${h.text}" is ${h.status} (no waiver); its ${f ?? 'line'} is left out`);
    }

    // Notes applying to this column (printed in it, or by a sign on its header).
    const colNotes: Note[] = [];
    const addNote = (x: Note) => {
      if (x.kind === 'mark') {
        if (x.sym === '?') return;
        const r = noteForMark(x.sym!, col, x.cell.page, x);
        if ('error' in r) { CE(cw, `sign ${x.sym} printed in the column: ${r.error}`); return; }
        if (!colNotes.includes(r)) colNotes.push(r);
        return;
      }
      if (!colNotes.includes(x)) colNotes.push(x);
    };
    if (cn) {
      for (const x of notes) {
        if (!x.cols.includes(col)) continue;
        addNote(x);
      }
      for (const hr of headerRows) {
        const h = grid.get(`header:${col}:${hr}`);
        if (!h) continue;
        for (const m of fnMarks(h.marks)) {
          if (m === '?') { if (!PENDING(h.status)) CE(cellRef(h), 'unidentified sign (fn:?) on a header cell'); continue; }
          const r = noteForMark(m, col, h.page);
          if ('error' in r) { CE(cellRef(h), r.error); continue; }
          addNote(r);
        }
      }
    }

    // Times down (or up) the column, split into trains by cellWords.
    let state: 'am' | 'pm' | null = n.meridian?.initial ?? null;
    let lastSec: number | null = null;
    const segments: TimeEvent[][] = [[]];
    const cellMarkNotes = new Map<TimeEvent, Note[]>();
    const bodyRows = [...new Set(cells.filter((c) => c.kind === 'cell' && c.col === col).map((c) => c.row))].sort((a, b) => (up ? b - a : a - b));
    const cur = () => segments[segments.length - 1]!;
    const split = () => { if (cur().length) segments.push([]); };
    for (const row of bodyRows) {
      const c = grid.get(`cell:${col}:${row}`)!;
      const label = labels.get(row);
      const line = label ? (up ? label.up : label.down) : 'single';
      if (c.status === 'waived') {
        if (label) cur().push({ row, station: label.station, line, sec: null, raw: '', status: 'waived', flags: new Set(label.flags), cell: c });
        continue;
      }
      if (PENDING(c.status)) {
        if (!partial) { blocked(c, 'cell'); colError ??= 'blocked cell'; continue; }
        if (c.text === '' && !label) continue;
        if (!label) { CE(cellRef(c), `${c.status} cell "${c.text}" in a row with no station label`); continue; }
        CW(cellRef(c), `pending: ${c.text ? `"${c.text}"` : 'cell'} (${c.crop}) is ${c.status} (no waiver); stop written without this time`);
        cur().push({ row, station: label.station, line, sec: null, raw: c.text, status: c.status, flags: new Set(label.flags), cell: c });
        continue;
      }
      const flags = new Set<StopFlag>(label?.flags ?? []);
      let text = takeSymbols(c.text, flags);
      if (cn && /^[^\p{L}\p{N}\s]$/u.test(text) && notes.some((x) => x.sym === text)) {
        CW(cellRef(c), `sign ${text} alone in a time cell (no time); the column's notes carry its meaning`);
        continue;
      }
      if (text === '' || n.passThrough.includes(text) || n.notServed.includes(text)) continue;
      const word = n.cellWords?.[text];
      if (word) { split(); continue; }
      const only = meridianMarkers(text);
      if (only) { state = only; continue; }
      if (!label) { CE(cellRef(c), `"${c.text}" in a row with no station label`); continue; }
      // a.m./p.m. written before or after the time.
      const pre = /^(\S+)\s+(.*)$/.exec(text);
      if (pre && meridianMarkers(pre[1]!)) { state = meridianMarkers(pre[1]!); text = pre[2]!; }
      const post = /^(.*)\s+(\S+)$/.exec(text);
      if (post && meridianMarkers(post[2]!)) { state = meridianMarkers(post[2]!); text = post[1]!; }
      let sec: number | null = null;
      if (n.ditto.includes(text)) {
        if (!n.dittoInTimes) { CE(cellRef(c), 'ditto in a time cell, which this guide\'s notation does not define'); continue; }
        if (lastSec === null) { CE(cellRef(c), 'ditto with no time above it'); continue; }
        sec = lastSec;
      } else if (n.literals[text] !== undefined) {
        const lit = n.literals[text]!;
        sec = Number(lit.slice(0, 2)) * 3600 + Number(lit.slice(3, 5)) * 60;
      } else {
        const m = timeRe.exec(text);
        if (!m) { CE(cellRef(c), `cannot read "${c.text}" as a time`); continue; }
        const h = Number(m[1]); const min = Number(m[2]);
        if (min > 59) { CE(cellRef(c), `minutes out of range in "${c.text}"`); continue; }
        let hour: number;
        if (n.clock === '24h') {
          if (h > 23) { CE(cellRef(c), `hour out of range in "${c.text}"`); continue; }
          hour = h;
        } else {
          if (h < 1 || h > 12) { CE(cellRef(c), `12-hour time out of range in "${c.text}"`); continue; }
          const mer = n.meridian!;
          const typed = c.marks.some((x) => mer.marks.includes(x));
          if (mer.mode === 'night-type') {
            // Night (marked): 6.00 p.m.–5.59 a.m.; day (unmarked): 6.00 a.m.–5.59 p.m.
            hour = typed ? (h >= 6 && h <= 11 ? h + 12 : h === 12 ? 0 : h) : (h >= 6 && h <= 11 ? h : h === 12 ? 12 : h + 12);
          } else {
            const mr = mer.mode === 'pm-type' ? (typed ? 'pm' : 'am') : state;
            if (mr === null) { CE(cellRef(c), `"${c.text}": no a.m./p.m. marker above it in this column`); continue; }
            hour = mr === 'am' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
          }
        }
        sec = hour * 3600 + min * 60;
      }
      lastSec = sec;
      const ev: TimeEvent = { row, station: label.station, line, sec, raw: c.text, status: c.status, flags, cell: c };
      cur().push(ev);
    }
    // Footnote marks on time cells.
    for (const seg of segments) {
      seg.forEach((ev, i) => {
        for (const fm of fnMarks(ev.cell.marks)) {
          if (cn) {
            if (fm === '?') { if (!PENDING(ev.status)) CE(cellRef(ev.cell), `unidentified sign (fn:?) on "${ev.raw}"`); continue; }
            const r = noteForMark(fm, col, ev.cell.page);
            if ('error' in r) { CE(cellRef(ev.cell), `${r.error} (on "${ev.raw}")`); continue; }
            if (r.kind === 'category' || r.kind === 'sleeper') addNote(r);
            if (r.kind !== 'running') continue;
            if (i === 0 || ruleNone(r.id)) { cellMarkNotes.set(ev, [...(cellMarkNotes.get(ev) ?? []), r]); continue; }
            const rr = runRules.get(r.id);
            if (partial && rr && rr.rule_dsl === 'none') {
              CW(cellRef(ev.cell), `pending: sign ${fm} on "${ev.raw}" (${r.id}) is accepted as having no running-day meaning by an unreviewed running_rules.csv row`);
              cellMarkNotes.set(ev, [...(cellMarkNotes.get(ev) ?? []), r]);
              continue;
            }
            CE(cellRef(ev.cell), `sign ${fm} on "${ev.raw}" refers to "${r.text}" (${r.id}): a stop cannot carry its own running days; if the note does not change this stop, record a reviewed running_rules.csv row for ${r.id} with rule_dsl "none", otherwise ask the historian how to transcribe it`);
            continue;
          }
          if (!ruleNone(fm)) {
            CE(cellRef(ev.cell), `footnote mark ${fm} on a time cell: a stop cannot carry its own running days; if the note does not change this stop, record a reviewed running_rules.csv row for ${fm} with rule_dsl "none", otherwise ask the historian how to transcribe it`);
          }
        }
      });
    }
    if (colError !== null) { skipped.push({ col, error: colError }); continue; }

    // Header fields shared by the column's trains.
    const tno = field(col, 'train_no');
    const cls = field(col, 'classes');
    const name = field(col, 'name');
    const opH = field(col, 'operator');
    const marksH = field(col, 'marks');
    const key = String(col);
    const operator = opH?.text || tn.columnOperators?.[key] || tn.operator;
    const headerCells = headerRows.map((hr) => headerText.get(`${col}:${hr}`)).filter((x): x is { text: string; cell: Cell } => !!x);

    const trains = segments.filter((s) => s.length > 0);
    if (trains.length === 0) { CW(cw, 'column has no times; no service written'); continue; }
    if (trains.length > 1) CW(cw, `the column holds ${trains.length} trains (split at ${Object.keys(n.cellWords ?? {}).join('/')}); only the first carries the header's number`);
    trains.forEach((segEvents, segIdx) => {
      const segSuffix = segIdx === 0 && segments[0]!.length > 0 ? '' : `.s${segments.indexOf(segEvents) + 1}`;
      // Alternative ends (or starts): one variant per alternative row present.
      let variants: Array<{ events: TimeEvent[]; suffix: string }> = [{ events: segEvents, suffix: '' }];
      for (const g of tn.altRows ?? []) {
        const present = g.filter((r) => segEvents.some((e) => e.row === r));
        if (present.length < 2) continue;
        variants = variants.flatMap((v) => present.map((r) => ({ events: v.events.filter((e) => !g.includes(e.row) || e.row === r), suffix: `${v.suffix}.r${r}` })));
      }
      for (const v of variants) emitTrain(v.events, `${segSuffix}${v.suffix}`, segIdx);
    });

    function emitTrain(events: TimeEvent[], suffix: string, segIdx: number): void {
      const tw = `${cw}${suffix}`;
      const step = up ? -1 : 1;
      // Pair arr./dep. lines into stops.
      const drafts: StopDraft[] = [];
      for (const e of events) {
        const last = drafts[drafts.length - 1];
        if (e.line === 'dep' && last && last.station === e.station && last.arr && !last.dep && last.rows[last.rows.length - 1] === e.row - step) {
          last.dep = e; last.rows.push(e.row);
          continue;
        }
        if (e.line === 'arr') drafts.push({ station: e.station, arr: e, dep: null, rows: [e.row] });
        else if (e.line === 'dep') drafts.push({ station: e.station, arr: null, dep: e, rows: [e.row] });
        else if (n.singleTime === 'both') drafts.push({ station: e.station, arr: e, dep: e, rows: [e.row] });
        else drafts.push({ station: e.station, arr: null, dep: e, rows: [e.row] });
      }
      const lastDraft = drafts[drafts.length - 1];
      if (n.singleTime === 'dep' && lastDraft && lastDraft.dep && !lastDraft.arr && lastDraft.dep.line === 'single' && drafts.length > 1) {
        lastDraft.arr = lastDraft.dep; lastDraft.dep = null;
      }
      if (drafts.length < 2) {
        CW(tw, `train has ${drafts.length} keyed stop (${drafts.map((d) => d.station).join(', ')}): it meets no other keyed station, so no service is written`);
        return;
      }
      const before = errorsOf(issues).length;
      // Day offsets by monotonicity.
      let prevAbs: number | null = null;
      let prevWhat = '';
      const offs = new Map<TimeEvent, number>();
      for (const d of drafts) {
        const z = inp.zones.railwayOffset(d.station, inp.refDay);
        if ('error' in z) { E(tw, z.error); break; }
        for (const e of [d.arr, d.dep]) {
          if (!e || e.sec === null || offs.has(e)) continue;
          const base = e.sec - z.offset;
          let day = 0;
          if (prevAbs !== null) {
            while (base + day * 86400 < prevAbs) day++;
            const gap = base + day * 86400 - prevAbs;
            if (gap > n.maxLegHours * 3600) {
              E(`c${col}r${e.row}`, `ambiguous day offset: ${(gap / 3600).toFixed(1)} h after ${prevWhat}, more than maxLegHours ${n.maxLegHours} (a misread time, a missing a.m./p.m. marker, or a day the table does not show)`);
            }
          }
          offs.set(e, day);
          prevAbs = base + day * 86400;
          prevWhat = `${d.station} ${e.raw} (row ${e.row})`;
        }
      }
      if (errorsOf(issues).length > before) { skipped.push({ col, error: `${tw}: ${errorsOf(issues)[errorsOf(issues).length - 1]!.message}` }); return; }

      // Train number, classes, sleeper, category, running rule.
      const numberNotes = colNotes.filter((x) => x.kind === 'header');
      let trainNo = segIdx === 0 ? tno?.text ?? '' : '';
      if (segIdx === 0 && trainNo === '' && numberNotes.length === 1) trainNo = numberNotes[0]!.trainNo!;
      else if (segIdx === 0 && trainNo === '' && numberNotes.length > 1) CW(tw, `several train numbers are printed in the column (${numberNotes.map((x) => x.trainNo).join(', ')}); none is taken`);
      else if (segIdx === 0 && numberNotes.some((x) => x.trainNo!.replace(/\s+/g, '') !== trainNo.replace(/\s+/g, ''))) {
        const other = numberNotes.map((x) => x.trainNo).join(', ');
        E(tw, `train ${trainNo} continues as ${other} part-way down the column; the row where ${other} takes over is not keyed, so the times cannot be shared between the two trains`);
        skipped.push({ col, error: `${tw}: train ${trainNo} continues as ${other} at an unkeyed row` });
        return;
      }
      let trainKey = tbl.trainKeys?.[key] ?? '';
      const prefix = tbl.trainKeyPrefix ?? operator;
      if (!trainKey) {
        if (trainNo) trainKey = `${prefix}-${trainNo.replace(/[\s.]+/g, '')}`;
        else if (tbl.unnumbered || segIdx > 0) trainKey = `${prefix}-T${inp.tableRef}-c${col}${segIdx > 0 ? `.s${segIdx + 1}` : ''}`;
        else { E(tw, 'no train number printed and no trainKeys entry in the notation'); skipped.push({ col, error: `${tw}: no train number` }); return; }
      } else if (segIdx > 0) trainKey = `${trainKey}.s${segIdx + 1}`;
      const classes = new Set<'1' | '2' | '3'>();
      let sleeper = false;
      for (const h of headerCells) for (const sm of n.sleeperMarkers) if (h.text.split(/\s+/).includes(sm)) sleeper = true;
      if (cls && cls.text) {
        if (cn) {
          const p = parseClasses(cls.text);
          if (p) for (const x of p) classes.add(x); else CW(cellRef(cls.cell), `class line "${cls.text}" not understood`);
        } else {
          for (const tok of cls.text.split(/[\s.,;/]+/).filter(Boolean)) {
            const v = ({ 1: '1', 2: '2', 3: '3', I: '1', II: '2', III: '3' } as Record<string, '1' | '2' | '3'>)[tok];
            if (v) classes.add(v);
            else if (!n.sleeperMarkers.includes(tok) && !n.sleeperMarkers.includes(`${tok}.`)) Wn(cellRef(cls.cell), `class token "${tok}" not understood`);
          }
        }
      } else if (cn) {
        const fromNotes = segIdx === 0 && trainNo && numberNotes.length === 1 && !tno?.text ? [numberNotes[0]!.classes ?? ''] : colNotes.filter((x) => x.kind === 'classes').map((x) => x.classes ?? '');
        if (fromNotes.length > 1) CW(tw, `class lines printed part-way down the column: ${fromNotes.join(' | ')}; classes are their union`);
        for (const t of fromNotes) {
          const p = parseClasses(t.replace(/\s*(?:[*:]|ab|Ab)$/u, ''));
          if (p) for (const x of p) classes.add(x); else CW(tw, `class line "${t}" not understood`);
        }
      }
      if (colNotes.some((x) => x.kind === 'sleeper')) sleeper = true;
      // Category: number prefix, else a note, else a type style on every time.
      let category = '';
      if (n.category) {
        const pm = /^([A-Z])\s?\d/.exec(trainNo);
        const cats = [...new Set(colNotes.filter((x) => x.kind === 'category').map((x) => x.category!))];
        if (pm && n.category.prefixes[pm[1]!]) category = n.category.prefixes[pm[1]!]!;
        else if (cats.length === 1) category = cats[0]!;
        else {
          const timed = events.filter((e) => e.sec !== null);
          for (const [mk, cat] of Object.entries(n.category.marks).sort((a, b) => cmpStr(a[0], b[0]))) {
            const k = timed.filter((e) => e.cell.marks.includes(mk)).length;
            if (k === timed.length && k > 0) { category = cat; break; }
            if (k > 0) CW(tw, `${mk} (${cat}) on ${k} of ${timed.length} times; category left empty`);
          }
        }
      }
      // Running marks.
      const marks = new Set<string>();
      if (marksH) for (const tok of marksH.text.split(/[\s,;]+/).map((x) => x.replace(/[).]+$/, '')).filter(Boolean)) marks.add(tok);
      if (cn) {
        for (const x of colNotes) if (x.kind === 'running') marks.add(x.id);
        // Signs on the first time apply to the train; on later times only "none" notes are accepted
        // (above), and they are listed too, so V07 sees an unreviewed one.
        for (const e of events) for (const x of cellMarkNotes.get(e) ?? []) marks.add(x.id);
      } else {
        for (const h of headerCells) for (const m of h.cell.marks) if (m.startsWith('fn:')) marks.add(m.slice(3));
      }
      const markList = [...marks].sort(cmpStr);
      const running: string[] = [];
      let ruleOk = true;
      for (const m of markList) {
        const rr = runRules.get(m);
        if (!rr) { E(tw, `footnote mark ${m} has no running_rules.csv row for ${inp.editionId} ${inp.tableRef}; a historian must interpret it${footnotes.get(m) ? ` ("${footnotes.get(m)!.text_as_printed}")` : ''}`); ruleOk = false; continue; }
        if (!rr.reviewed_by) {
          if (!partial) { E(tw, `running_rules.csv row for mark ${m} is not reviewed (reviewed_by is empty)`); ruleOk = false; continue; }
          Wn(tw, `pending: running_rules.csv row for mark ${m} is not reviewed; applied as proposed ("${rr.rule_dsl}")`);
        }
        if (rr.rule_dsl !== 'none') running.push(m);
      }
      if (!ruleOk) { skipped.push({ col, error: `${tw}: running marks without a usable running_rules row` }); return; }
      let rule = n.unmarkedRunning;
      if (running.length === 1) rule = runRules.get(running[0]!)!.rule_dsl;
      else if (running.length > 1) {
        const combo = runRules.get(running.join('+'));
        const comboOk = combo && combo.rule_dsl !== 'none' && (combo.reviewed_by || partial);
        if (!comboOk) { E(tw, `marks ${running.join(', ')} all affect running days; add a reviewed running_rules.csv row for mark ${running.join('+')}`); skipped.push({ col, error: `${tw}: combined running marks` }); return; }
        if (!combo.reviewed_by) Wn(tw, `pending: running_rules.csv row for mark ${running.join('+')} is not reviewed; applied as proposed ("${combo.rule_dsl}")`);
        rule = combo.rule_dsl;
      }
      const p = parseRule(rule);
      if (!p.ok) { E(tw, `running rule "${rule}": ${p.error}`); skipped.push({ col, error: `${tw}: bad running rule` }); return; }

      const serviceId = sanitizeId(`${inp.editionId}.${inp.tableRef}.c${col}${suffix}`);
      const srcCell = (segIdx === 0 ? tno?.cell ?? headerCells[0]?.cell : null) ?? null;
      const firstEvent = drafts[0]!.dep ?? drafts[0]!.arr!;
      services.push({
        service_id: serviceId, edition_id: inp.editionId, table_ref: inp.tableRef, train_key: trainKey, train_no_as_printed: trainNo,
        name: name?.text ?? '', operator, mode: tbl.columnModes?.[key] ?? tbl.mode, classes: (['1', '2', '3'] as const).filter((x) => classes.has(x)),
        sleeper, running_as_printed: markList.join(';'), running_rule: rule, segment_ids: tbl.columnSegments?.[key] ?? tbl.segments,
        src: srcCell ? cite(srcCell.crop, srcCell.page, cellRef(srcCell)) : cite(firstEvent.cell.crop, firstEvent.cell.page, `c${col}r${firstEvent.row}`),
        category,
      });
      drafts.forEach((d, i) => {
        const flags = new Set<StopFlag>([...(d.arr?.flags ?? []), ...(d.dep?.flags ?? [])]);
        const used = [d.arr, d.dep].filter((e): e is TimeEvent => !!e);
        const status = used.reduce<CellStatus>((acc, e) => (STATUS_RANK[e.status] > STATUS_RANK[acc] ? e.status : acc), 'agree');
        const rows = [...new Set(d.rows)].sort((a, b) => a - b);
        const firstCell = grid.get(`cell:${col}:${rows[0]!}`)!;
        const cellPart = rows.length > 1 ? `c${col}r${rows[0]}-${rows[rows.length - 1]}` : `c${col}r${rows[0]}`;
        const t = (e: TimeEvent | null) => (e && e.sec !== null ? hmOfSec(e.sec) : '');
        const o = (e: TimeEvent | null) => (e && e.sec !== null ? offs.get(e) ?? 0 : null);
        stopsOut.push({
          service_id: serviceId, seq: i + 1, station_id: d.station, arr_local: t(d.arr), dep_local: t(d.dep),
          arr_dayoff: o(d.arr), dep_dayoff: o(d.dep), raw_arr: d.arr?.raw ?? '', raw_dep: d.dep?.raw ?? '',
          flags: STOP_FLAGS.filter((f) => flags.has(f)), status, src: cite(firstCell.crop, firstCell.page, cellPart),
        });
      });
    }
  }
  return {
    services: services.sort((a, b) => cmpStr(a.service_id, b.service_id)),
    stops: stopsOut.sort((a, b) => cmpStr(a.service_id, b.service_id) || a.seq - b.seq),
    footnotes: [...footnotes.values()].sort((a, b) => cmpStr(a.mark, b.mark)),
    issues,
    skipped,
    tableErrors,
  };
}

/** Gathers the inputs for one edition's table from a loaded dataset. */
export function inputFromDataset(ds: Dataset, editionId: string, tableRef: string): NormalizeInput | { error: string } {
  const ed = ds.t.editions.find((e) => e.edition_id === editionId);
  if (!ed) return { error: `edition ${editionId} not in editions.csv` };
  const notation = ds.notations.get(editionId);
  if (!notation) return { error: `edition ${editionId} has no usable notation file (editions.csv notation_file)` };
  const key = `${ed.source_id}/${tableRef}`;
  const crops = ds.crops.get(key);
  if (!crops) return { error: `no crops for raw/${key}/crops.csv` };
  const cells = new Map<string, CellRow[]>();
  for (const c of crops) {
    const rows = ds.resolved.get(`${key}/${c.crop_id}`);
    if (!rows) return { error: `crop ${c.crop_id} has no resolved file raw/${key}/${c.crop_id}.R.csv` };
    cells.set(c.crop_id, rows);
  }
  return {
    editionId, sourceId: ed.source_id, family: ed.family, tableRef, notation, crops, cells,
    aliases: new Map(ds.t.station_aliases.filter((a) => a.family === ed.family).map((a) => [a.alias_as_printed, a.station_id])),
    zones: zoneLookup(ds), refDay: ed.valid_from, runningRules: ds.t.running_rules, waivers: ds.t.waivers,
  };
}

/** Replaces one edition table's rows in services, stops and footnotes; returns the new CSV texts. */
export function mergeIntoCanonical(ds: Dataset, editionId: string, tableRef: string, res: NormalizeResult): Record<'services' | 'stops' | 'footnotes', string> {
  const raw = ds.raw.tables;
  const oldIds = new Set(raw.services.rows.filter((r) => r.values.edition_id === editionId && r.values.table_ref === tableRef).map((r) => r.values.service_id ?? ''));
  const spec = { services: specOf('services'), stops: specOf('stops'), footnotes: specOf('footnotes') };
  const services = [
    ...raw.services.rows.filter((r) => !oldIds.has(r.values.service_id ?? '')).map((r) => r.values),
    ...res.services.map((s) => formatRow(spec.services, s)),
  ].sort((a, b) => cmpStr(a.service_id ?? '', b.service_id ?? ''));
  const stops = [
    ...raw.stops.rows.filter((r) => !oldIds.has(r.values.service_id ?? '')).map((r) => r.values),
    ...res.stops.map((s) => formatRow(spec.stops, s)),
  ].sort((a, b) => cmpStr(a.service_id ?? '', b.service_id ?? '') || Number(a.seq) - Number(b.seq));
  const fkey = (r: Record<string, string>) => `${r.edition_id}\u0000${r.table_ref}\u0000${r.mark}`;
  const footnotes = [
    ...raw.footnotes.rows.filter((r) => !(r.values.edition_id === editionId && r.values.table_ref === tableRef)).map((r) => r.values),
    ...res.footnotes.map((f) => formatRow(spec.footnotes, f)),
  ].sort((a, b) => cmpStr(fkey(a), fkey(b)));
  return {
    services: writeCsvTable(headerOf(spec.services), services),
    stops: writeCsvTable(headerOf(spec.stops), stops),
    footnotes: writeCsvTable(headerOf(spec.footnotes), footnotes),
  };
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const data = resolve(argValue(args, '--data') ?? join(ROOT, 'data'));
  const edition = argValue(args, '--edition'); const table = argValue(args, '--table');
  if (!edition || !table) {
    console.error('usage: node tools/normalize/normalize.ts --edition <edition_id> --table <table_ref> [--data <root>] [--check] [--partial]');
    process.exit(2);
  }
  const partial = args.includes('--partial');
  const ds = loadDataset(data);
  const inp = inputFromDataset(ds, edition, table);
  if ('error' in inp) { console.error(`normalize: ${inp.error}`); process.exit(1); }
  const res = normalizeTable(inp, { partial });
  for (const i of res.issues) (i.level === 'error' ? console.error : console.log)(formatIssue(i));
  const nErr = errorsOf(res.issues).length;
  if (nErr && (!partial || res.tableErrors)) { console.error(`normalize: ${nErr} error(s)${partial ? ` (${res.tableErrors} concern the whole table)` : ''}; nothing written`); process.exit(1); }
  const cols = [...new Set(res.skipped.map((s) => s.col))];
  console.log(`normalize ${edition} ${table}: ${res.services.length} services, ${res.stops.length} stops, ${res.footnotes.length} footnotes${partial ? `; ${cols.length} column(s) skipped (${cols.map((c) => `c${c}`).join(', ') || 'none'})` : ''}`);
  if (!args.includes('--check')) {
    const out = mergeIntoCanonical(ds, edition, table, res);
    for (const t of ['services', 'stops', 'footnotes'] as const) writeFileSync(join(data, 'canonical', `${t}.csv`), out[t]);
    console.log('written to canonical/services.csv, stops.csv, footnotes.csv; run tools/validate/run.ts next');
  }
}
