/**
 * A guide's notation file, data/canonical/notation/<edition_id>.json: how that edition prints
 * times, symbols and table layout, as stated on the guide's own explanation page (cited in `src`).
 * The normaliser (tools/normalize/normalize.ts) reads keyed cells with it. Keyers transcribe
 * printed signs with tokens (tools/keying/longcsv.ts: ditto 〃, pass |, dash —, dots …), so the
 * symbol lists below name those tokens.
 *
 * {
 *   "edition_id": "BCG1914-06",
 *   "src": "BCG1914-06:p3:-:-:-",            // the guide's notation page
 *   "clock": "12h",                            // "24h": H.MM with hours 0–23; "12h": see meridian
 *   "timeSeparators": [" ", "."],              // between hours and minutes ("8 15", "8.15")
 *   "meridian": {                              // required for 12h clocks, null for 24h
 *     "mode": "markers",                       // "markers": a.m./p.m. cells set the column state;
 *                                              // "pm-type": times with one of `marks` are p.m., others a.m.;
 *                                              // "night-type": times with one of `marks` are night
 *                                              //   (6.00 p.m.–5.59 a.m.), others day (6.00 a.m.–5.59 p.m.)
 *     "marks": [],                             // typographic marks (b|u|i|sc) for pm-type / night-type
 *     "amMarkers": ["a.m.", "mrn"],            // whole-cell texts that switch the column to a.m.
 *     "pmMarkers": ["p.m.", "aft"],            // … to p.m.
 *     "initial": null                          // state at the top of every column: "am" | "pm" | null
 *   },                                         //   (null: a time before any marker is an error)
 *   "literals": {"noon": "12:00", "mdnt": "00:00"},   // whole-cell texts that are times
 *   "ditto": ["〃"],                            // same as the cell above (labels) / to the left (headers)
 *   "dittoInTimes": false,                     // true: a ditto in a time cell repeats the time above it
 *   "passThrough": ["|"],                      // the train passes without stopping (no stop)
 *   "notServed": ["—", "…"],                   // the train does not serve the station (no stop)
 *   "arrMarkers": ["arr.", "arr"],             // label texts (sub-column 1, or a suffix of the name)
 *   "depMarkers": ["dep.", "dep"],             //   marking arrival and departure lines
 *   "singleTime": "dep",                       // a station printed on one line: "dep" (its time is the
 *                                              //   departure; at a column's last stop, the arrival) or
 *                                              //   "both" (arrival and departure)
 *   "unmarkedRunning": "daily",                // DSL for a column with no running-day marks
 *   "symbolFlags": {"†": "customs"},           // signs in label or time cells that set stop flags
 *   "sleeperMarkers": ["Sl."],                 // header texts meaning a sleeping car
 *   "maxLegHours": 20,                         // a leg longer than this is ambiguous (an error)
 *   "headerLines": ["train_no", "classes", "marks"],  // meaning of header line 0, 1, 2 …:
 *                                              //   train_no | classes | name | operator | marks | ignore
 *   "tables": {
 *     "T254": {
 *       "operator": "Prussian State Railways", "mode": "rail", "segments": ["S-BER-EYD"],
 *       "headerLines": [...],                  // optional, overrides the guide-wide headerLines
 *       "trainKeys": {"3": "DE-D1"},           // optional train_key per column (default operator-trainNo)
 *       "columnSegments": {"5": ["S-EYD-WIR"]},  // optional
 *       "columnModes": {}, "columnOperators": {}, // optional
 *       "trainKeyPrefix": "DE",                // optional: train_key = <prefix>-<train no> (default: operator)
 *       "unnumbered": true,                    // optional: the table prints no train numbers; train_key =
 *                                              //   <prefix>-T<table>-c<col> unless trainKeys names one
 *       "upColumns": [10, 11],                 // optional: columns read bottom to top (a table printed both
 *                                              //   ways round one station column)
 *       "altRows": [[14, 26]],                 // optional: rows that are alternative ends (or, read upwards,
 *                                              //   alternative starts) of a column's journey, e.g. two
 *                                              //   terminal stations; a column with times in several rows of
 *                                              //   a group gives one service per row, suffixed .r<row>
 *       "dittoMarkers": {"1": "a."},           // optional: the marker a leading ditto stands for when the
 *                                              //   row above it was not keyed
 *       "labelMarkFlags": {"□": "customs"}     // optional: footnote marks (fn:x) on station labels that
 *                                              //   set stop flags in this table
 *     }
 *   },
 *   // Optional, for guides that print markers before names and notes inside train columns:
 *   "labelMarkers": "prefix",                  // "suffix" (default) or "prefix": "a. Dresden", "in Bodenbach";
 *                                              //   a leading ditto repeats the marker of the row above; in a
 *                                              //   table with upColumns a marker after the name is the
 *                                              //   upward reading's marker
 *   "labelKm": true,                           // a figure before the name is a distance (dropped; "?" digits allowed)
 *   "labelTableRefs": true,                    // figures after the name are connecting-table numbers (dropped)
 *   "cellWords": {"ab": "starts", "Ank.": "ends"},  // whole-cell words: "starts" = a train starts at the next
 *                                              //   time below it, "ends" = the train ends at the time above;
 *                                              //   either splits the column into separate trains
 *   "columnNotes": {                           // notes keyed from column-notes crops (marks c:<col>)
 *     "header": "^(?<no>(?:[DE] ?)?\\d+[a-z]?) (?<cls>[IV][IV. -]*)$",  // a train number and class line
 *     "classes": "^[IV][IV. -]*$",             // a class line alone
 *     "sleeper": ["^Schlaf"],                  // a sleeping car
 *     "info": ["^Speise"],                     // no running-day meaning (dining car, route, other trains…)
 *     "running": ["Sonn"],                     // overrides sleeper, category and info (e.g. "Über X. Nur vom …")
 *     "category": [{"re": "^D-Z", "category": "D-Zug"}]
 *   },
 *   "category": {"prefixes": {"D": "D-Zug"}, "marks": {"i": "Schnellzug"}}  // train category from the
 *                                              //   train number's prefix, else from a mark on its times
 * }
 */
import { MODES, STOP_FLAGS } from './canonical.ts';
import { parseRule } from './running-rule.ts';
import { issue, type Issue } from './issues.ts';

export type HeaderField = 'train_no' | 'classes' | 'name' | 'operator' | 'marks' | 'ignore';
export const HEADER_FIELDS: readonly HeaderField[] = ['train_no', 'classes', 'name', 'operator', 'marks', 'ignore'];
export type Mode = (typeof MODES)[number];
export type StopFlag = (typeof STOP_FLAGS)[number];

export interface Meridian {
  mode: 'markers' | 'pm-type' | 'night-type';
  marks: string[];
  amMarkers: string[];
  pmMarkers: string[];
  initial: 'am' | 'pm' | null;
}

export interface TableNotation {
  operator: string;
  mode: Mode;
  segments: string[];
  headerLines?: HeaderField[];
  trainKeys?: Record<string, string>;
  columnSegments?: Record<string, string[]>;
  columnModes?: Record<string, Mode>;
  columnOperators?: Record<string, string>;
  trainKeyPrefix?: string;
  unnumbered?: boolean;
  upColumns?: number[];
  altRows?: number[][];
  dittoMarkers?: Record<string, string>;
  labelMarkFlags?: Record<string, StopFlag | 'none'>;
}

export interface ColumnNotesNotation {
  /** Regex with named groups `no` and `cls`: a train number and its class line printed part-way down a column. */
  header?: string;
  /** Regex: a class line alone. */
  classes?: string;
  /** Regexes: notes naming a sleeping car. */
  sleeper: string[];
  /** Regexes: notes without running-day meaning. */
  info: string[];
  /** Regexes: a note matching one of these is a running note even if it also matches sleeper, category or info. */
  running: string[];
  /** Train category named by a note. */
  category: Array<{ re: string; category: string }>;
}

export interface CategoryNotation {
  /** Train-number prefix (before a space or the digits) → category. */
  prefixes: Record<string, string>;
  /** Typographic mark on a column's times → category (used when no prefix applies). */
  marks: Record<string, string>;
}

export interface Notation {
  edition_id: string;
  src: string;
  clock: '24h' | '12h';
  timeSeparators: string[];
  meridian: Meridian | null;
  literals: Record<string, string>;
  ditto: string[];
  dittoInTimes: boolean;
  passThrough: string[];
  notServed: string[];
  arrMarkers: string[];
  depMarkers: string[];
  singleTime: 'dep' | 'both';
  unmarkedRunning: string;
  symbolFlags: Record<string, StopFlag>;
  sleeperMarkers: string[];
  maxLegHours: number;
  headerLines: HeaderField[];
  tables: Record<string, TableNotation>;
  /** Type styles (b, i, u, sc) that carry meaning in this guide's tables (decision P-010); absent = default rules. */
  valueMarks?: string[];
  labelMarkers?: 'suffix' | 'prefix';
  labelKm?: boolean;
  labelTableRefs?: boolean;
  cellWords?: Record<string, 'starts' | 'ends'>;
  columnNotes?: ColumnNotesNotation;
  category?: CategoryNotation;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isStrRec = (v: unknown): v is Record<string, string> => isObj(v) && Object.values(v).every((x) => typeof x === 'string');
const isIntArr = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => Number.isInteger(x) && (x as number) >= 0);

/** Parses and checks a notation file; returns null (with issues) if it is unusable. */
export function parseNotation(text: string, file: string): { notation: Notation | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const bad = (msg: string) => issues.push(issue('V07', 'error', file, msg));
  let j: unknown;
  try { j = JSON.parse(text); } catch (e) { bad(`not valid JSON: ${(e as Error).message}`); return { notation: null, issues }; }
  if (!isObj(j)) { bad('must be a JSON object'); return { notation: null, issues }; }
  const str = (k: string): string => { const v = j[k]; if (typeof v !== 'string' || v === '') { bad(`${k} must be a non-empty string`); return ''; } return v; };
  const arr = (k: string, def?: string[]): string[] => { const v = j[k] ?? def; if (!isStrArr(v)) { bad(`${k} must be a list of strings`); return []; } return v; };
  const rec = (k: string): Record<string, string> => { const v = j[k] ?? {}; if (!isStrRec(v)) { bad(`${k} must be an object of strings`); return {}; } return v; };
  const edition_id = str('edition_id');
  const src = str('src');
  const clock = j.clock;
  if (clock !== '24h' && clock !== '12h') bad('clock must be "24h" or "12h"');
  let meridian: Meridian | null = null;
  if (clock === '12h') {
    const m = j.meridian;
    if (!isObj(m)) bad('a 12h clock needs a meridian object');
    else {
      const mode = m.mode;
      if (mode !== 'markers' && mode !== 'pm-type' && mode !== 'night-type') bad('meridian.mode must be markers|pm-type|night-type');
      const marks = m.marks ?? []; const am = m.amMarkers ?? []; const pm = m.pmMarkers ?? [];
      if (!isStrArr(marks) || !isStrArr(am) || !isStrArr(pm)) bad('meridian.marks, amMarkers and pmMarkers must be lists of strings');
      const initial = m.initial ?? null;
      if (initial !== null && initial !== 'am' && initial !== 'pm') bad('meridian.initial must be "am", "pm" or null');
      if ((mode === 'pm-type' || mode === 'night-type') && isStrArr(marks) && marks.length === 0) bad(`meridian.mode ${String(mode)} needs marks`);
      if (mode === 'markers' && isStrArr(am) && isStrArr(pm) && am.length + pm.length === 0) bad('meridian.mode markers needs amMarkers and pmMarkers');
      meridian = {
        mode: mode as Meridian['mode'], marks: isStrArr(marks) ? marks : [], amMarkers: isStrArr(am) ? am : [],
        pmMarkers: isStrArr(pm) ? pm : [], initial: initial as Meridian['initial'],
      };
    }
  } else if (j.meridian !== undefined && j.meridian !== null) bad('a 24h clock takes no meridian (set it to null)');
  const literals = rec('literals');
  for (const [k, v] of Object.entries(literals)) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) bad(`literal "${k}" must map to HH:MM, not "${v}"`);
  const singleTime = j.singleTime;
  if (singleTime !== 'dep' && singleTime !== 'both') bad('singleTime must be "dep" or "both"');
  const unmarkedRunning = str('unmarkedRunning');
  if (unmarkedRunning) { const p = parseRule(unmarkedRunning); if (!p.ok) bad(`unmarkedRunning: ${p.error}`); }
  const symbolFlags = rec('symbolFlags');
  for (const [k, v] of Object.entries(symbolFlags)) if (!(STOP_FLAGS as readonly string[]).includes(v)) bad(`symbolFlags "${k}" → "${v}" is not a stop flag (${STOP_FLAGS.join('|')})`);
  const maxLegHours = j.maxLegHours;
  if (typeof maxLegHours !== 'number' || !(maxLegHours > 0 && maxLegHours < 24)) bad('maxLegHours must be a number between 0 and 24');
  const headerLines = arr('headerLines') as HeaderField[];
  for (const h of headerLines) if (!HEADER_FIELDS.includes(h)) bad(`headerLines item "${h}" is not one of ${HEADER_FIELDS.join('|')}`);
  const tables: Record<string, TableNotation> = {};
  if (!isObj(j.tables)) bad('tables must be an object keyed by table_ref');
  else {
    for (const ref of Object.keys(j.tables).sort()) {
      const tv = j.tables[ref];
      const where = `tables.${ref}`;
      if (!isObj(tv)) { bad(`${where} must be an object`); continue; }
      if (typeof tv.operator !== 'string' || tv.operator === '') bad(`${where}.operator must be a non-empty string`);
      if (!(MODES as readonly unknown[]).includes(tv.mode)) bad(`${where}.mode must be one of ${MODES.join('|')}`);
      if (!isStrArr(tv.segments) || tv.segments.length === 0) bad(`${where}.segments must be a non-empty list`);
      const tn: TableNotation = { operator: String(tv.operator ?? ''), mode: tv.mode as Mode, segments: isStrArr(tv.segments) ? tv.segments : [] };
      if (tv.headerLines !== undefined) {
        if (!isStrArr(tv.headerLines) || tv.headerLines.some((h) => !HEADER_FIELDS.includes(h as HeaderField))) bad(`${where}.headerLines is invalid`);
        else tn.headerLines = tv.headerLines as HeaderField[];
      }
      if (tv.trainKeys !== undefined) { if (!isStrRec(tv.trainKeys)) bad(`${where}.trainKeys must map columns to strings`); else tn.trainKeys = tv.trainKeys; }
      if (tv.columnOperators !== undefined) { if (!isStrRec(tv.columnOperators)) bad(`${where}.columnOperators must map columns to strings`); else tn.columnOperators = tv.columnOperators; }
      if (tv.columnModes !== undefined) {
        if (!isStrRec(tv.columnModes) || Object.values(tv.columnModes).some((m) => !(MODES as readonly string[]).includes(m))) bad(`${where}.columnModes is invalid`);
        else tn.columnModes = tv.columnModes as Record<string, Mode>;
      }
      if (tv.columnSegments !== undefined) {
        const cs = tv.columnSegments;
        if (!isObj(cs) || Object.values(cs).some((v) => !isStrArr(v))) bad(`${where}.columnSegments must map columns to lists`);
        else tn.columnSegments = cs as Record<string, string[]>;
      }
      if (tv.trainKeyPrefix !== undefined) { if (typeof tv.trainKeyPrefix !== 'string' || tv.trainKeyPrefix === '') bad(`${where}.trainKeyPrefix must be a non-empty string`); else tn.trainKeyPrefix = tv.trainKeyPrefix; }
      if (tv.unnumbered !== undefined) { if (typeof tv.unnumbered !== 'boolean') bad(`${where}.unnumbered must be true or false`); else tn.unnumbered = tv.unnumbered; }
      if (tv.upColumns !== undefined) { if (!isIntArr(tv.upColumns)) bad(`${where}.upColumns must be a list of column numbers`); else tn.upColumns = tv.upColumns; }
      if (tv.altRows !== undefined) {
        const ar = tv.altRows;
        if (!Array.isArray(ar) || ar.some((g) => !isIntArr(g) || g.length < 2)) bad(`${where}.altRows must be a list of row groups (two or more rows each)`);
        else if (new Set(ar.flat()).size !== ar.flat().length) bad(`${where}.altRows names a row twice`);
        else tn.altRows = ar as number[][];
      }
      if (tv.dittoMarkers !== undefined) { if (!isStrRec(tv.dittoMarkers)) bad(`${where}.dittoMarkers must map rows to markers`); else tn.dittoMarkers = tv.dittoMarkers; }
      if (tv.labelMarkFlags !== undefined) {
        const lf = tv.labelMarkFlags;
        if (!isStrRec(lf) || Object.values(lf).some((f) => f !== 'none' && !(STOP_FLAGS as readonly string[]).includes(f))) bad(`${where}.labelMarkFlags must map marks to stop flags (${STOP_FLAGS.join('|')}) or "none"`);
        else tn.labelMarkFlags = lf as Record<string, StopFlag | 'none'>;
      }
      tables[ref] = tn;
    }
  }
  const notation: Notation = {
    edition_id, src, clock: clock === '12h' ? '12h' : '24h', timeSeparators: arr('timeSeparators', [' ', '.']), meridian, literals,
    ditto: arr('ditto', ['〃']), dittoInTimes: j.dittoInTimes === true, passThrough: arr('passThrough', ['|']),
    notServed: arr('notServed', ['—', '…']), arrMarkers: arr('arrMarkers'), depMarkers: arr('depMarkers'),
    singleTime: singleTime === 'both' ? 'both' : 'dep', unmarkedRunning, symbolFlags: symbolFlags as Record<string, StopFlag>,
    sleeperMarkers: arr('sleeperMarkers', []), maxLegHours: typeof maxLegHours === 'number' ? maxLegHours : 20, headerLines, tables,
  };
  if (j.labelMarkers !== undefined) {
    if (j.labelMarkers !== 'suffix' && j.labelMarkers !== 'prefix') bad('labelMarkers must be "suffix" or "prefix"');
    else notation.labelMarkers = j.labelMarkers;
  }
  for (const k of ['labelKm', 'labelTableRefs'] as const) {
    if (j[k] === undefined) continue;
    if (typeof j[k] !== 'boolean') bad(`${k} must be true or false`);
    else notation[k] = j[k];
  }
  if (j.cellWords !== undefined) {
    const cw = rec('cellWords');
    if (Object.values(cw).some((v) => v !== 'starts' && v !== 'ends')) bad('cellWords values must be "starts" or "ends"');
    else notation.cellWords = cw as Record<string, 'starts' | 'ends'>;
  }
  if (j.columnNotes !== undefined) {
    const cn = j.columnNotes;
    if (!isObj(cn)) bad('columnNotes must be an object');
    else {
      const re = (what: string, v: unknown): string | undefined => {
        if (v === undefined) return undefined;
        if (typeof v !== 'string') { bad(`columnNotes.${what} must be a regular expression string`); return undefined; }
        try { new RegExp(v, 'u'); } catch (e) { bad(`columnNotes.${what}: ${(e as Error).message}`); return undefined; }
        return v;
      };
      const res = (what: string, v: unknown): string[] => {
        if (v === undefined) return [];
        if (!isStrArr(v)) { bad(`columnNotes.${what} must be a list of regular expressions`); return []; }
        return v.filter((x, i) => re(`${what}[${i}]`, x) !== undefined);
      };
      const cats: Array<{ re: string; category: string }> = [];
      if (cn.category !== undefined) {
        if (!Array.isArray(cn.category)) bad('columnNotes.category must be a list of {re, category}');
        else cn.category.forEach((c, i) => {
          if (!isObj(c) || typeof c.category !== 'string' || c.category === '') { bad(`columnNotes.category[${i}] needs re and category`); return; }
          const r = re(`category[${i}].re`, c.re);
          if (r !== undefined) cats.push({ re: r, category: c.category });
        });
      }
      const h = re('header', cn.header);
      if (h !== undefined && !/\(\?<no>/.test(h)) bad('columnNotes.header needs a named group (?<no>…)');
      const cl = re('classes', cn.classes);
      notation.columnNotes = { sleeper: res('sleeper', cn.sleeper), info: res('info', cn.info), running: res('running', cn.running), category: cats };
      if (h !== undefined) notation.columnNotes.header = h;
      if (cl !== undefined) notation.columnNotes.classes = cl;
    }
  }
  if (j.category !== undefined) {
    const c = j.category;
    if (!isObj(c)) bad('category must be an object {prefixes, marks}');
    else {
      const pre = c.prefixes ?? {}; const mk = c.marks ?? {};
      if (!isStrRec(pre) || !isStrRec(mk)) bad('category.prefixes and category.marks must map strings to categories');
      else notation.category = { prefixes: pre, marks: mk };
    }
  }
  if (j.valueMarks !== undefined) {
    const vm = arr('valueMarks');
    const badMark = vm.find((m) => !['b', 'i', 'u', 'sc'].includes(m));
    if (badMark !== undefined) bad(`valueMarks may list only b, i, u, sc (found "${badMark}")`);
    else notation.valueMarks = vm;
  }
  return { notation: issues.length ? null : notation, issues };
}
