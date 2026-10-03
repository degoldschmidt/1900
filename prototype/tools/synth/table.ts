/**
 * Synthetic period-style timetables with known ground truth, for calibrating keyers.
 *
 * Every station name starts with SYN_ so a synthetic value can never pass as history (the release
 * check rejects SYN_ in game bundles). The conventions exercised:
 * - 12-hour times, "8 05" or "8.05", with the period shown either typographically (p.m. times in
 *   heavy type, style "bold-pm") or in words (style "mrn-aft": the header's third line gives the
 *   period of a column's first time, and a later change is printed as "aft"/"mrn" before the time);
 * - arrival and departure lines for larger stations, the second line's name printed as a ditto mark;
 * - "|" for a train passing without stopping, "—" for a station the train does not serve;
 * - footnote reference marks (* † ‡ § a b) after times, with the footnotes under the table;
 * - ditto marks in the classes line; bold express numbers and bold larger stations.
 * Ground truth uses the keying tokens (ditto 〃, pass |, dash —) and marks (b, fn:<symbol>).
 */
import type { KeyedCell } from '../keying/longcsv.ts';

export type Style = 'bold-pm' | 'mrn-aft';

export interface SynthOptions {
  seed: number;
  stations?: number;
  trains?: number;
  style?: Style;
  timeSep?: ' ' | '.';
  tableRef?: string;
}

export interface Printed { text: string; marks: string[] }

export interface SynthTable {
  table_ref: string;
  title: string;
  style: Style;
  timeSep: ' ' | '.';
  /** header[line][col] */
  header: Printed[][];
  /** rows[r] = { label: [name, arr/dep], cells[col] } */
  rows: Array<{ label: [Printed, Printed]; cells: Printed[] }>;
  footnotes: Array<{ symbol: string; text: string }>;
}

/** mulberry32: a small deterministic PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T,>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)]!,
    chance: (p: number) => next() < p,
  };
}

const DE_PRE = ['Alt', 'Neu', 'Ober', 'Nieder', 'Gross', 'Klein', 'Bad ', 'Sankt ', 'Mark', 'Hoch', 'Unter', 'Wester', 'Oster', 'Schön', 'Königs', 'Lüne'];
const DE_ROOT = ['brück', 'hagen', 'feld', 'dorf', 'burg', 'stadt', 'au', 'heim', 'berg', 'furt', 'walde', 'kirchen', 'münde', 'rode', 'hausen', 'thal'];
const FR = ['Pont-l’Évêque', 'Montrésor', 'Sainte-Gemme', 'Villers-la-Forêt', 'Mont-sur-Meuse', 'Châtel-Guyon', 'Bourg-les-Bains', 'Neufchâteau', 'Écouché', 'Saint-Aubin'];

export function stationNames(n: number, r: ReturnType<typeof rng>): string[] {
  const out = new Set<string>();
  const de = () => {
    const pre = r.pick(DE_PRE); const root = r.pick(DE_ROOT);
    return pre.endsWith(' ') ? pre + root[0]!.toUpperCase() + root.slice(1) : pre + root;
  };
  while (out.size < n) out.add(`SYN_${r.chance(0.25) ? r.pick(FR) : de()}`);
  return [...out];
}

export function formatTime(min: number, sep: ' ' | '.'): { text: string; pm: boolean } {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60); const mm = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { text: `${h12}${sep}${String(mm).padStart(2, '0')}`, pm: h >= 12 };
}

const FN_TEXT: Record<string, string> = {
  '*': 'Stops to set down only.',
  '†': 'Runs on SYN weekdays only.',
  '‡': 'Sleeping-car to SYN_Endstadt; supplement payable.',
  '§': 'Change carriages.',
  a: 'Arrives 5 minutes earlier on Sundays.',
  b: 'Customs examination of luggage.',
};

export function generateTable(o: SynthOptions): SynthTable {
  const r = rng(o.seed);
  const nSt = o.stations ?? 9;
  const nTr = o.trains ?? 10;
  const style = o.style ?? (r.chance(0.5) ? 'bold-pm' : 'mrn-aft');
  const sep = o.timeSep ?? (r.chance(0.5) ? ' ' : '.');
  const names = stationNames(nSt, r);
  const major = names.map((_, i) => i > 0 && i < nSt - 1 && r.chance(0.3));
  // Body rows: one per station, two (arr./dep.) for larger stations.
  type RowDef = { st: number; line: 'arr' | 'dep' | 'one' };
  const defs: RowDef[] = [];
  names.forEach((_, i) => {
    if (major[i]) { defs.push({ st: i, line: 'arr' }); defs.push({ st: i, line: 'dep' }); }
    else defs.push({ st: i, line: 'one' });
  });
  const label = (d: RowDef, k: number): [Printed, Printed] => {
    const first = d.st === 0; const last = d.st === nSt - 1;
    const name: Printed = d.line === 'dep' && k > 0 ? { text: '〃', marks: [] } : { text: names[d.st]!, marks: major[d.st] || first || last ? ['b'] : [] };
    const ad = d.line === 'arr' || last ? 'arr.' : d.line === 'dep' || first ? 'dep.' : '';
    return [name, { text: ad, marks: ad ? ['i'] : [] }]; // the page prints arr./dep. in italic
  };
  const rows = defs.map((d, k) => ({ label: label(d, k), cells: [] as Printed[] }));
  const header: Printed[][] = [[], [], []];
  const used = new Set<string>();
  const numbers = new Set<number>();

  for (let c = 0; c < nTr; c++) {
    const express = r.chance(0.35);
    const s = r.chance(0.7) ? 0 : r.int(0, Math.max(0, nSt - 3));
    const e = r.chance(0.7) ? nSt - 1 : r.int(Math.min(nSt - 1, s + 2), nSt - 1);
    const outside: Printed = r.chance(0.5) ? { text: '—', marks: [] } : { text: '', marks: [] };
    // Times at each station: arrival and departure minutes.
    let t = r.int(0, 1439);
    const arr: number[] = []; const dep: number[] = [];
    for (let i = 0; i < nSt; i++) {
      if (i < s || i > e) { arr.push(NaN); dep.push(NaN); continue; }
      if (i > s) t += r.int(express ? 9 : 6, express ? 34 : 28);
      arr.push(t);
      if (major[i] && i !== e) t += r.int(3, 12); else if (i !== e && i !== s) t += r.int(0, 2);
      dep.push(t);
    }
    const stops = (i: number) => i === s || i === e || !express || major[i];
    let lastPm: boolean | null = null;
    const time = (min: number): Printed => {
      const f = formatTime(min, sep);
      const marks: string[] = [];
      let text = f.text;
      if (style === 'bold-pm' && f.pm) marks.push('b');
      if (style === 'mrn-aft' && lastPm !== null && f.pm !== lastPm) text = `${f.pm ? 'aft' : 'mrn'} ${text}`;
      if (lastPm === null && style === 'mrn-aft') header[2]![c] = { text: f.pm ? 'aft' : 'mrn', marks: [] };
      lastPm = f.pm;
      if (r.chance(0.06)) { const sym = r.pick(Object.keys(FN_TEXT)); marks.push(`fn:${sym}`); used.add(sym); }
      return { text, marks };
    };
    defs.forEach((d, k) => {
      const i = d.st;
      let cell: Printed;
      if (i < s || i > e) cell = outside;
      else if (!stops(i)) cell = { text: '|', marks: [] };
      else if (d.line === 'arr') cell = i === s ? { text: '', marks: [] } : time(arr[i]!);
      else if (d.line === 'dep') cell = i === e ? { text: '', marks: [] } : time(dep[i]!);
      else cell = time(i === e ? arr[i]! : dep[i]!);
      rows[k]!.cells[c] = cell;
    });
    let num = r.int(1, 399);
    while (numbers.has(num)) num = r.int(1, 399);
    numbers.add(num);
    header[0]![c] = express ? { text: r.pick([`D ${num}`, `${num}`]), marks: ['b'] } : { text: r.pick([`${num}`, `${num}a`]), marks: [] };
    const classes = express ? r.pick(['1 2', '1 2 3', '1·2']) : r.pick(['1 2 3', '2 3', '1 2 3']);
    const prev = header[1]![c - 1];
    header[1]![c] = c > 0 && prev && prev.text !== '〃' && r.chance(0.2) ? { text: '〃', marks: [] } : { text: classes, marks: [] };
    if (style === 'bold-pm' && express && r.chance(0.3)) header[2]![c] = { text: 'Lux.', marks: ['i'] };
  }
  for (let c = 0; c < nTr; c++) header[2]![c] ??= { text: '', marks: [] };
  const footnotes = Object.keys(FN_TEXT).filter((k) => used.has(k)).map((k) => ({ symbol: k, text: FN_TEXT[k]! }));
  const a = names[0]!.slice(4); const b = names[nSt - 1]!.slice(4);
  return {
    table_ref: o.tableRef ?? 'SYN1',
    title: `SYN_${a.toUpperCase()} and SYN_${b.toUpperCase()}.`,
    style, timeSep: sep, header, rows, footnotes,
  };
}

/** The ground truth in long format (crop_id "GT"). */
export function truthCells(t: SynthTable): KeyedCell[] {
  const out: KeyedCell[] = [];
  const push = (kind: KeyedCell['kind'], col: number, row: number, p: Printed) => out.push({ crop_id: 'GT', kind, col, row, text: p.text, marks: p.marks, sure: 'y' });
  t.header.forEach((line, h) => line.forEach((p, c) => push('header', c, h, p)));
  t.rows.forEach((row, r) => {
    push('label', 0, r, row.label[0]); push('label', 1, r, row.label[1]);
    row.cells.forEach((p, c) => push('cell', c, r, p));
  });
  t.footnotes.forEach((f, i) => push('footnote', 0, i, { text: `${f.symbol} ${f.text}`, marks: [`fn:${f.symbol}`] }));
  return out;
}
