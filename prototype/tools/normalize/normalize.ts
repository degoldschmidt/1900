/**
 * Normaliser: resolved keyed cells of one printed table → canonical services, stops and footnotes.
 *
 *   node tools/normalize/normalize.ts --edition <edition_id> --table <table_ref> [--data <root>] [--check]
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
 * Reading a table:
 *  - label sub-column 0 is the station as printed (〃 = the station of the row above), mapped by
 *    station_aliases.csv; sub-column 1 (or a suffix of the name) is an arr./dep. marker (notation
 *    arrMarkers/depMarkers); a row with neither is a single line (notation singleTime);
 *  - header line i means notation headerLines[i] (train_no, classes, name, operator, marks,
 *    ignore); 〃 in a header cell repeats the cell to its left on the same line;
 *  - a body cell is empty, a pass-through or not-served sign (no stop), an a.m./p.m. marker
 *    (changes the column's state), a literal ("noon"), a ditto (repeats the time above, if the
 *    notation allows), or a time "H M" with optional a.m./p.m. prefix or suffix; signs listed in
 *    symbolFlags (in the label or the cell) set stop flags;
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
import type { HeaderField, Notation, StopFlag } from '../schema/notation.ts';
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

export interface NormalizeResult {
  services: ServiceOut[];
  stops: StopOut[];
  footnotes: FootnoteOut[];
  issues: Issue[];
}

type CellStatus = 'agree' | 'resolved' | 'waived' | 'illegible' | 'unresolved';
const STATUS_RANK: Record<CellStatus, number> = { agree: 0, resolved: 1, waived: 2, unresolved: 3, illegible: 4 };

interface Cell {
  kind: CellRow['kind'];
  col: number;
  row: number;
  /** Text as printed; empty when the cell is illegible. */
  text: string;
  marks: string[];
  status: CellStatus;
  crop: string;
  page: number;
}

interface Label { row: number; station: string; line: 'arr' | 'dep' | 'single'; flags: Set<StopFlag> }

interface TimeEvent {
  row: number;
  station: string;
  line: 'arr' | 'dep' | 'single';
  /** Seconds after local midnight, or null for a waived cell. */
  sec: number | null;
  raw: string;
  status: CellStatus;
  flags: Set<StopFlag>;
}

interface StopDraft {
  station: string;
  arr: TimeEvent | null;
  dep: TimeEvent | null;
  rows: number[];
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

export function normalizeTable(inp: NormalizeInput): NormalizeResult {
  const issues: Issue[] = [];
  const where = `${inp.editionId} ${inp.tableRef}`;
  const E = (w: string, m: string) => issues.push(issue('normalize', 'error', `${where} ${w}`.trim(), m));
  const Wn = (w: string, m: string) => issues.push(issue('normalize', 'warning', `${where} ${w}`.trim(), m));
  const n = inp.notation;
  const tn = n.tables[inp.tableRef];
  if (!tn) {
    E('', `notation for ${inp.editionId} has no tables.${inp.tableRef} entry (operator, mode, segments)`);
    return { services: [], stops: [], footnotes: [], issues };
  }
  const cite = (crop: string, page: number, cell: string) => formatCitation({ source: inp.sourceId, pageSeq: page, tableRef: inp.tableRef, crop, cell });

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
      if (status === 'unresolved' || status === 'illegible') {
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
    if (c.status === 'illegible' || c.status === 'unresolved') {
      E(cellRef(c), `${what} ${cellRef(c)} (${c.crop}) is ${c.status} and has no waiver`);
      return true;
    }
    return false;
  };

  // 2. Labels → stations and line types.
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
  for (const row of labelRows) {
    const name = grid.get(`label:0:${row}`);
    const sub = grid.get(`label:1:${row}`);
    if (!name) { E(`l0r${row}`, `row ${row} has no station label`); continue; }
    if (name.status === 'waived' || blocked(name, 'label')) { if (name.status === 'waived') E(`l0r${row}`, 'a station label cannot be waived; it must be read'); continue; }
    const flags = new Set<StopFlag>();
    let text = takeSymbols(name.text, flags);
    let line: Label['line'] = 'single';
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
    let station: string | null;
    if (n.ditto.includes(text)) {
      station = prevStation;
      if (!station) { E(`l0r${row}`, 'ditto label with no station above'); continue; }
    } else {
      station = inp.aliases.get(text) ?? null;
      if (!station) { E(`l0r${row}`, `station "${text}" is not in station_aliases.csv for family ${inp.family}`); continue; }
    }
    prevStation = station;
    labels.set(row, { row, station, line, flags });
  }

  // 3. Header information per train column.
  const lines: HeaderField[] = tn.headerLines ?? n.headerLines;
  const trainCols = [...new Set(cells.filter((c) => c.kind === 'cell' || c.kind === 'header').map((c) => c.col))].sort((a, b) => a - b);
  const headerText = new Map<string, { text: string; cell: Cell }>();
  const headerRows = [...new Set(cells.filter((c) => c.kind === 'header').map((c) => c.row))].sort((a, b) => a - b);
  for (const hr of headerRows) {
    if (lines[hr] === undefined) E(`h${hr}`, `header line ${hr} has no meaning in the notation's headerLines`);
    let left: string | null = null;
    for (const col of trainCols) {
      const c = grid.get(`header:${col}:${hr}`);
      if (!c) { left = null; continue; }
      if (blocked(c, 'header cell')) { left = null; continue; }
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

  // 4. Footnotes.
  const footnotes = new Map<string, FootnoteOut>();
  for (const c of footCells.sort((a, b) => cmpStr(a.crop, b.crop) || a.row - b.row)) {
    if (blocked(c, 'footnote')) continue;
    const mark = c.marks.find((m) => m.startsWith('fn:'))?.slice(3);
    if (!mark) { E(`${c.crop} f${c.row}`, `footnote "${c.text}" carries no fn:<mark>`); continue; }
    const prev = footnotes.get(mark);
    if (prev) { if (prev.text_as_printed !== c.text) E(`${c.crop} f${c.row}`, `footnote ${mark} printed twice with different text`); continue; }
    footnotes.set(mark, { edition_id: inp.editionId, table_ref: inp.tableRef, mark, text_as_printed: c.text, src: cite(c.crop, c.page, cellRef(c)) });
  }

  // 5. Columns → services and stops.
  const sepClass = n.timeSeparators.map((s) => s.replace(/[\\\]^-]/g, '\\$&')).join('');
  const timeRe = new RegExp(`^(\\d{1,2})[${sepClass}](\\d{1,2})$`);
  const meridianMarkers = (s: string): 'am' | 'pm' | null => (n.meridian?.amMarkers.includes(s) ? 'am' : n.meridian?.pmMarkers.includes(s) ? 'pm' : null);
  const services: ServiceOut[] = [];
  const stopsOut: StopOut[] = [];
  const runRules = new Map(inp.runningRules.filter((r) => r.edition_id === inp.editionId && r.table_ref === inp.tableRef).map((r) => [r.mark, r]));

  for (const col of trainCols) {
    const cw = `c${col}`;
    const errorsBefore = errorsOf(issues).length;
    // Times down the column.
    let state: 'am' | 'pm' | null = n.meridian?.initial ?? null;
    let lastSec: number | null = null;
    const events: TimeEvent[] = [];
    const bodyRows = [...new Set(cells.filter((c) => c.kind === 'cell' && c.col === col).map((c) => c.row))].sort((a, b) => a - b);
    for (const row of bodyRows) {
      const c = grid.get(`cell:${col}:${row}`)!;
      const label = labels.get(row);
      if (c.status === 'waived') {
        if (label) events.push({ row, station: label.station, line: label.line, sec: null, raw: '', status: 'waived', flags: new Set(label.flags) });
        continue;
      }
      if (blocked(c, 'cell')) continue;
      for (const fm of c.marks.filter((m) => m.startsWith('fn:')).map((m) => m.slice(3))) {
        const rr = runRules.get(fm);
        if (!rr || !rr.reviewed_by || rr.rule_dsl !== 'none') {
          E(cellRef(c), `footnote mark ${fm} on a time cell: a stop cannot carry its own running days; if the note does not change this stop, record a reviewed running_rules.csv row for ${fm} with rule_dsl "none", otherwise ask the historian how to transcribe it`);
        }
      }
      const flags = new Set<StopFlag>(label?.flags ?? []);
      let text = takeSymbols(c.text, flags);
      if (text === '' || n.passThrough.includes(text) || n.notServed.includes(text)) continue;
      const only = meridianMarkers(text);
      if (only) { state = only; continue; }
      if (!label) { E(cellRef(c), `"${c.text}" in a row with no station label`); continue; }
      // a.m./p.m. written before or after the time.
      const pre = /^(\S+)\s+(.*)$/.exec(text);
      if (pre && meridianMarkers(pre[1]!)) { state = meridianMarkers(pre[1]!); text = pre[2]!; }
      const post = /^(.*)\s+(\S+)$/.exec(text);
      if (post && meridianMarkers(post[2]!)) { state = meridianMarkers(post[2]!); text = post[1]!; }
      let sec: number | null = null;
      if (n.ditto.includes(text)) {
        if (!n.dittoInTimes) { E(cellRef(c), 'ditto in a time cell, which this guide\'s notation does not define'); continue; }
        if (lastSec === null) { E(cellRef(c), 'ditto with no time above it'); continue; }
        sec = lastSec;
      } else if (n.literals[text] !== undefined) {
        const lit = n.literals[text]!;
        sec = Number(lit.slice(0, 2)) * 3600 + Number(lit.slice(3, 5)) * 60;
      } else {
        const m = timeRe.exec(text);
        if (!m) { E(cellRef(c), `cannot read "${c.text}" as a time`); continue; }
        const h = Number(m[1]); const min = Number(m[2]);
        if (min > 59) { E(cellRef(c), `minutes out of range in "${c.text}"`); continue; }
        let hour: number;
        if (n.clock === '24h') {
          if (h > 23) { E(cellRef(c), `hour out of range in "${c.text}"`); continue; }
          hour = h;
        } else {
          if (h < 1 || h > 12) { E(cellRef(c), `12-hour time out of range in "${c.text}"`); continue; }
          const mer = n.meridian!;
          const typed = c.marks.some((x) => mer.marks.includes(x));
          if (mer.mode === 'night-type') {
            // Night (marked): 6.00 p.m.–5.59 a.m.; day (unmarked): 6.00 a.m.–5.59 p.m.
            hour = typed ? (h >= 6 && h <= 11 ? h + 12 : h === 12 ? 0 : h) : (h >= 6 && h <= 11 ? h : h === 12 ? 12 : h + 12);
          } else {
            const mr = mer.mode === 'pm-type' ? (typed ? 'pm' : 'am') : state;
            if (mr === null) { E(cellRef(c), `"${c.text}": no a.m./p.m. marker above it in this column`); continue; }
            hour = mr === 'am' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
          }
        }
        sec = hour * 3600 + min * 60;
      }
      lastSec = sec;
      events.push({ row, station: label.station, line: label.line, sec, raw: c.text, status: c.status, flags });
    }

    // Pair arr./dep. lines into stops.
    const drafts: StopDraft[] = [];
    for (const e of events) {
      const last = drafts[drafts.length - 1];
      if (e.line === 'dep' && last && last.station === e.station && last.arr && !last.dep && last.rows[last.rows.length - 1] === e.row - 1) {
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
    if (drafts.length === 0) { Wn(cw, 'column has no times; no service written'); continue; }
    if (drafts.length < 2) { E(cw, 'column has fewer than two stops'); continue; }

    // Day offsets by monotonicity.
    let prevAbs: number | null = null;
    let prevWhat = '';
    const offs = new Map<TimeEvent, number>();
    for (const d of drafts) {
      const z = inp.zones.railwayOffset(d.station, inp.refDay);
      if ('error' in z) { E(cw, z.error); break; }
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
    if (errorsOf(issues).length > errorsBefore) continue;

    // Header fields, running rule.
    const tno = field(col, 'train_no');
    const cls = field(col, 'classes');
    const name = field(col, 'name');
    const opH = field(col, 'operator');
    const marksH = field(col, 'marks');
    const key = String(col);
    const operator = opH?.text || tn.columnOperators?.[key] || tn.operator;
    const trainNo = tno?.text ?? '';
    let trainKey = tn.trainKeys?.[key] ?? '';
    if (!trainKey) {
      if (!trainNo) { E(cw, 'no train number printed and no trainKeys entry in the notation'); continue; }
      trainKey = `${operator}-${trainNo.replace(/[\s.]+/g, '')}`;
    }
    const classes = new Set<'1' | '2' | '3'>();
    let sleeper = false;
    const headerCells = headerRows.map((hr) => headerText.get(`${col}:${hr}`)).filter((x): x is { text: string; cell: Cell } => !!x);
    for (const h of headerCells) for (const sm of n.sleeperMarkers) if (h.text.split(/\s+/).includes(sm)) sleeper = true;
    if (cls) {
      for (const tok of cls.text.split(/[\s.,;/]+/).filter(Boolean)) {
        const v = ({ 1: '1', 2: '2', 3: '3', I: '1', II: '2', III: '3' } as Record<string, '1' | '2' | '3'>)[tok];
        if (v) classes.add(v);
        else if (!n.sleeperMarkers.includes(tok) && !n.sleeperMarkers.includes(`${tok}.`)) Wn(cellRef(cls.cell), `class token "${tok}" not understood`);
      }
    }
    const marks = new Set<string>();
    if (marksH) for (const tok of marksH.text.split(/[\s,;]+/).map((x) => x.replace(/[).]+$/, '')).filter(Boolean)) marks.add(tok);
    for (const h of headerCells) for (const m of h.cell.marks) if (m.startsWith('fn:')) marks.add(m.slice(3));
    const markList = [...marks].sort(cmpStr);
    const running: string[] = [];
    let ruleOk = true;
    for (const m of markList) {
      const rr = runRules.get(m);
      if (!rr) { E(cw, `footnote mark ${m} has no running_rules.csv row for ${inp.editionId} ${inp.tableRef}; a historian must interpret it`); ruleOk = false; continue; }
      if (!rr.reviewed_by) { E(cw, `running_rules.csv row for mark ${m} is not reviewed (reviewed_by is empty)`); ruleOk = false; continue; }
      if (rr.rule_dsl !== 'none') running.push(m);
    }
    if (!ruleOk) continue;
    let rule = n.unmarkedRunning;
    if (running.length === 1) rule = runRules.get(running[0]!)!.rule_dsl;
    else if (running.length > 1) {
      const combo = runRules.get(running.join('+'));
      if (!combo || !combo.reviewed_by || combo.rule_dsl === 'none') { E(cw, `marks ${running.join(', ')} all affect running days; add a reviewed running_rules.csv row for mark ${running.join('+')}`); continue; }
      rule = combo.rule_dsl;
    }
    const p = parseRule(rule);
    if (!p.ok) { E(cw, `running rule "${rule}": ${p.error}`); continue; }

    const serviceId = sanitizeId(`${inp.editionId}.${inp.tableRef}.c${col}`);
    const srcCell = tno?.cell ?? headerCells[0]?.cell ?? null;
    const firstEvent = drafts[0]!.dep ?? drafts[0]!.arr!;
    services.push({
      service_id: serviceId, edition_id: inp.editionId, table_ref: inp.tableRef, train_key: trainKey, train_no_as_printed: trainNo,
      name: name?.text ?? '', operator, mode: tn.columnModes?.[key] ?? tn.mode, classes: (['1', '2', '3'] as const).filter((x) => classes.has(x)),
      sleeper, running_as_printed: markList.join(';'), running_rule: rule, segment_ids: tn.columnSegments?.[key] ?? tn.segments,
      src: srcCell ? cite(srcCell.crop, srcCell.page, cellRef(srcCell)) : cite(grid.get(`cell:${col}:${firstEvent.row}`)!.crop, grid.get(`cell:${col}:${firstEvent.row}`)!.page, `c${col}r${firstEvent.row}`),
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
  return {
    services: services.sort((a, b) => cmpStr(a.service_id, b.service_id)),
    stops: stopsOut.sort((a, b) => cmpStr(a.service_id, b.service_id) || a.seq - b.seq),
    footnotes: [...footnotes.values()].sort((a, b) => cmpStr(a.mark, b.mark)),
    issues,
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
    console.error('usage: node tools/normalize/normalize.ts --edition <edition_id> --table <table_ref> [--data <root>] [--check]');
    process.exit(2);
  }
  const ds = loadDataset(data);
  const inp = inputFromDataset(ds, edition, table);
  if ('error' in inp) { console.error(`normalize: ${inp.error}`); process.exit(1); }
  const res = normalizeTable(inp);
  for (const i of res.issues) (i.level === 'error' ? console.error : console.log)(formatIssue(i));
  if (errorsOf(res.issues).length) { console.error(`normalize: ${errorsOf(res.issues).length} error(s); nothing written`); process.exit(1); }
  console.log(`normalize ${edition} ${table}: ${res.services.length} services, ${res.stops.length} stops, ${res.footnotes.length} footnotes`);
  if (!args.includes('--check')) {
    const out = mergeIntoCanonical(ds, edition, table, res);
    for (const t of ['services', 'stops', 'footnotes'] as const) writeFileSync(join(data, 'canonical', `${t}.csv`), out[t]);
    console.log('written to canonical/services.csv, stops.csv, footnotes.csv; run tools/validate/run.ts next');
  }
}
