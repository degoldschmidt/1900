/**
 * The normaliser on small real excerpts of Fritzsches Kursbuch, Sommer-Ausgabe 1914
 * (sl-rfrkuf_394077458-19140001; resolved cells copied from data/raw/…/<table>/<crop>.R.csv):
 * markers printed before station names, distance figures and connecting-table numbers in labels,
 * a ditto standing for the marker above, underlined minutes as night times, italic figures and
 * D/E prefixes as the train category, column notes (train number and classes part-way down a
 * column, sleeping cars, running notes, notes without running-day meaning), table 123 read both
 * ways, "ab"/"Ank." in time cells, alternative ends (Bodenbach/Tetschen, the Prague branches of
 * table 126), a braced time keyed in one column only, and a print inconsistency that is flagged,
 * not corrected. The notation below is a trimmed copy of data/canonical/notation/FKB1914-SO.json.
 */
import { describe, it, expect } from 'vitest';
import type { CellRow, CropRow } from '../../schema/raw-keying.ts';
import type { RunningRuleRow } from '../../schema/canonical.ts';
import type { Notation, TableNotation } from '../../schema/notation.ts';
import { normalizeTable, parseClasses, parseLabelText, type NormalizeInput, type NormalizeResult } from '../normalize.ts';

const SRC = 'sl-rfrkuf_394077458-19140001';

const NOTATION: Notation = {
  edition_id: 'FKB1914-SO', src: `${SRC}:p9:-:-:-`, clock: '12h', timeSeparators: [' ', '.'],
  meridian: { mode: 'night-type', marks: ['u'], amMarkers: [], pmMarkers: [], initial: null },
  literals: {}, ditto: ['〃'], dittoInTimes: false, passThrough: ['|'], notServed: ['—', '…'],
  arrMarkers: ['in', 'i.', 'i', 'an'], depMarkers: ['a.', 'aus', 'ab', 'us'], singleTime: 'dep', unmarkedRunning: 'daily',
  symbolFlags: { '×': 'request', '(e)': 'dep_only', '(a)': 'arr_only' }, sleeperMarkers: [], maxLegHours: 20,
  headerLines: ['train_no', 'classes'], tables: {}, valueMarks: ['u', 'i'],
  labelMarkers: 'prefix', labelKm: true, labelTableRefs: true, cellWords: { ab: 'starts', 'Ank.': 'ends' },
  columnNotes: {
    header: '^(?<no>(?:[DEL] ?)?\\d+[a-z]?) (?<cls>(?:IV|I{1,3})[IV. -]*)$',
    classes: '^\\(?(?:IV|I{1,3})[IV. ,-]*\\)?(?: ?(?:[*:]|ab|Ab))?$',
    sleeper: ['^Schlaf'], info: ['Speise', '^[Üü]b(?:er|\\.)', 'Zoll'],
    running: ['\\b[Nn]ur\\b(?! ?(?:IV|I{1,3})\\b)', '[Vv]erk(?:ehrt|\\.)', 'Sonn'],
    category: [{ re: '^D[- ]?Z(?:ug|\\.)', category: 'D-Zug' }],
  },
  category: { prefixes: { D: 'D-Zug', E: 'Eilzug', L: 'Luxuszug' }, marks: { i: 'Schnellzug' } },
};

const ALIASES: Record<string, string> = {
  'Dresden Hbf.': 'DRE-HBF', 'Dresd. Hbf.': 'DRE-HBF', 'Dresden-Neustadt': 'DRE-NEU', 'Dresden Wettinerstr.': 'DRE-WET',
  'Berlin Anh.Bf.': 'BER-ANH', 'Berlin Anh. Bf.': 'BER-ANH', 'Bodenbach': 'BODENBACH', 'Bodenb.': 'BODENBACH',
  'Bodenbach K.K.St.B.': 'BODENBACH', 'Tetschen': 'TETSCHEN', 'Tetschen N.W.B.': 'TETSCHEN', 'Tetsch. N.W.B.': 'TETSCHEN',
  'Prag Stbhf.': 'PRG-STB', 'Prag (F.J.B.)': 'PRG-FJB', 'Prag F. J. B.': 'PRG-FJB', 'Prag Ö. N. W. B.': 'PRG-NWB',
  'Wien F.J.B.': 'WIE-FJB', 'Wien N W. Bf': 'WIE-NWB', 'Wien N. W. Bf.': 'WIE-NWB', 'Wien Nordb.': 'WIE-NB', 'Wien Staatsb': 'WIE-STB',
};

/** One resolved row: [kind, col, row, text, marks, resolution]. */
type R = [CellRow['kind'], number, number, string, string?, string?];

function input(table: string, tn: Partial<TableNotation>, crops: Record<string, { page: number; rows: R[] }>, rules: Array<[string, string, string?]> = []): NormalizeInput {
  const cropRows: CropRow[] = Object.entries(crops).map(([id, c], i) => ({ crop_id: id, page_seq: c.page, table_ref: table, col_range: '', row_range: '', line: i + 2 }));
  const cells = new Map<string, CellRow[]>();
  for (const [id, c] of Object.entries(crops)) {
    cells.set(id, c.rows.map(([kind, col, row, text, marks, res], i) => ({
      crop_id: id, kind, col, row, text_as_printed: text, marks: marks ? marks.split(';') : [], sure: 'y', resolution: (res ?? 'agree') as CellRow['resolution'], note: '', line: i + 2,
    })));
  }
  const runningRules: RunningRuleRow[] = rules.map(([mark, dsl, reviewed], i) => ({ edition_id: 'FKB1914-SO', table_ref: table, mark, rule_dsl: dsl, interpreted_by: 'test', reviewed_by: reviewed ?? 'historian', line: i + 2 }));
  return {
    editionId: 'FKB1914-SO', sourceId: SRC, family: 'FKB', tableRef: table,
    notation: { ...NOTATION, tables: { [table]: { operator: 'OP', mode: 'rail', segments: ['S'], ...tn } } },
    crops: cropRows, cells, aliases: new Map(Object.entries(ALIASES)),
    zones: { railwayOffset: () => ({ offset: 3600, zone: 'MEZ' }), zoneOffset: () => 3600 },
    refDay: 5233, runningRules, waivers: [],
  };
}

const errs = (r: NormalizeResult) => r.issues.filter((i) => i.level === 'error').map((i) => `${i.where}: ${i.message}`);
const warns = (r: NormalizeResult) => r.issues.filter((i) => i.level === 'warning').map((i) => `${i.where}: ${i.message}`);
const stops = (r: NormalizeResult, id: string) => r.stops.filter((s) => s.service_id === `FKB1914-SO.${id}`)
  .map((s) => `${s.station_id} ${s.arr_local}${s.arr_dayoff ? `+${s.arr_dayoff}` : ''}/${s.dep_local}${s.dep_dayoff ? `+${s.dep_dayoff}` : ''}${s.flags.length ? ` [${s.flags.join(';')}]` : ''}${s.status === 'agree' || s.status === 'resolved' ? '' : ` (${s.status})`}`);
const svc = (r: NormalizeResult, id: string) => r.services.find((s) => s.service_id === `FKB1914-SO.${id}`);

describe('labels as Fritzsche prints them', () => {
  const p = (t: string, twoWay = false) => parseLabelText(t, NOTATION, twoWay);
  it('reads the marker before the name, with or without a space, and drops distances, table numbers and leaders', () => {
    expect(p('a. Dresden Hbf.')).toEqual({ name: 'Dresden Hbf.', pre: 'a.', post: null, kmIllegible: false });
    expect(p('198 i.Berlin Anh.Bf.312')).toEqual({ name: 'Berlin Anh.Bf.', pre: 'i.', post: null, kmIllegible: false });
    expect(p('aus Dresden-Neustadt …')).toEqual({ name: 'Dresden-Neustadt', pre: 'aus', post: null, kmIllegible: false });
    expect(p('62 in Tetschen …').name).toBe('Tetschen');
    expect(p('180 i.Prag Stbhf. 122,123').name).toBe('Prag Stbhf.');
    expect(p('540 i.Bodenb. 121.145.147').name).toBe('Bodenb.');
    expect(p('a. Tetschen N.W.B. 121 147').name).toBe('Tetschen N.W.B.');
    expect(p('528 Wien Nordb. …')).toEqual({ name: 'Wien Nordb.', pre: null, post: null, kmIllegible: false });
  });
  it('a leading ditto repeats the marker above; an unreadable distance is noticed', () => {
    expect(p('198 〃 Dresden Hbf.')).toEqual({ name: 'Dresden Hbf.', pre: '〃', post: null, kmIllegible: false });
    expect(p('4?? i. Wien N W. Bf')).toEqual({ name: 'Wien N W. Bf', pre: 'i.', post: null, kmIllegible: true });
  });
  it('in a table read both ways the marker after the name is the upward one (table 123)', () => {
    expect(p('a. Dresd. Hbf. 23 i.', true)).toEqual({ name: 'Dresd. Hbf.', pre: 'a.', post: 'i.', kmIllegible: false });
    expect(p('〃 Bodenb. 118 〃', true)).toEqual({ name: 'Bodenb.', pre: '〃', post: '〃', kmIllegible: false });
    expect(p('a. Prag (F.J.B.) 1 718', true)).toEqual({ name: 'Prag (F.J.B.)', pre: 'a.', post: null, kmIllegible: false });
    expect(p('850 i. Wien F.J.B. 150 a.', true)).toEqual({ name: 'Wien F.J.B.', pre: 'i.', post: 'a.', kmIllegible: false });
  });
  it('class lines, with ranges and fourth class dropped', () => {
    const c = (t: string) => { const s = parseClasses(t); return s ? [...s].sort().join(';') : null; };
    expect(c('I-IV')).toBe('1;2;3');
    expect(c('II.-IV')).toBe('2;3');
    expect(c('I.-III.')).toBe('1;2;3');
    expect(c('II. III')).toBe('2;3');
    expect(c('II.III.')).toBe('2;3');
    expect(c('(I. II)')).toBe('1;2');
    expect(c('I III')).toBe('1;3');
    expect(c('IV.')).toBe('');
    expect(c('I-I?')).toBeNull();
  });
});

describe('table 12 (Dresden–Röderau–Berlin), pp. 54–55', () => {
  const labels: R[] = [
    ['label', 0, 0, 'a. Dresden Hbf.'], ['label', 0, 2, '4 i. Dresden-Neustadt', '', 'A'], ['label', 0, 3, 'a. Dresden-Neustadt'],
    ['label', 0, 40, '198 i.Berlin Anh.Bf.312', '', 'A'],
  ];
  const down = input('12', { trainKeyPrefix: 'DE' }, {
    '12-c0-5-r0-40': { page: 58, rows: [...labels,
      ['header', 0, 0, '281', '', 'B'], ['header', 0, 1, 'I-IV', '', 'B'], ['header', 2, 0, 'D 51', '', 'B'], ['header', 2, 1, 'I-III', '', 'B'],
      ['header', 4, 0, ''], ['header', 4, 1, ''], ['header', 5, 0, '295', '', 'B'], ['header', 5, 1, 'II-IV', '', 'B'],
      ['cell', 0, 0, '2 42', 'u', 'A'], ['cell', 0, 2, '2 50', 'u', 'A'], ['cell', 0, 3, '2 54', 'u', 'A'], ['cell', 0, 40, '7 25', '', 'A'],
      ['cell', 2, 0, '7 20', 'i', 'B'], ['cell', 2, 2, '7 26', 'i', 'B'], ['cell', 2, 3, '7 28', 'i', 'B'], ['cell', 2, 40, '10 21', 'i', 'A'],
      ['cell', 4, 0, ''], ['cell', 4, 40, '11 18', '', 'A'],
      ['cell', 5, 0, '8 28'], ['cell', 5, 2, '8 36'], ['cell', 5, 3, '8 39'], ['cell', 5, 40, '11 30', 'i', 'A'],
    ] },
    '12-cn-p1-c0-5': { page: 58, rows: [
      ['footnote', 0, 0, 'Schlafwagen Karlsbad-Berlin.', 'c:0'], ['footnote', 0, 1, '293 II-IV', 'c:4'],
      ['footnote', 0, 2, '• Verkehrt erst ab 29./5.', 'c:5;fn:•'],
      ['footnote', 0, 4, 'Speisewagen Tetschen-Berlin.', 'c:2', 'A'],
    ] },
  }, [['•@c5', 'from:1914-05-29;daily']]);
  const res = normalizeTable(down);
  it('reads it without errors', () => expect(errs(res)).toEqual([]));
  it('underlined minutes are night times, unmarked ones day times', () => {
    expect(stops(res, '12.c0')).toEqual(['DRE-HBF /02:42', 'DRE-NEU 02:50/02:54', 'BER-ANH 07:25/']);
  });
  it('the category comes from the D prefix (or italic on every time); classes and sleeper from header and notes', () => {
    expect(svc(res, '12.c2')).toMatchObject({ train_key: 'DE-D51', train_no_as_printed: 'D 51', category: 'D-Zug', classes: ['1', '2', '3'], sleeper: false });
    expect(svc(res, '12.c0')).toMatchObject({ train_key: 'DE-281', category: '', classes: ['1', '2', '3'], sleeper: true });
  });
  it('a running note printed in a column needs (and gets) its running_rules row', () => {
    expect(svc(res, '12.c5')).toMatchObject({ running_as_printed: '•@c5', running_rule: 'from:1914-05-29;daily', category: '' });
    expect(warns(res)).toContain('FKB1914-SO 12 c5: i (Schnellzug) on 1 of 4 times; category left empty');
    expect(res.footnotes.map((f) => f.mark).sort()).toEqual(['@c0', '@c2', '•@c5']);
  });
  it('a column whose train continues under another number at an unkeyed row is flagged, not merged (13 c5: 329, then 323)', () => {
    const cells = new Map<string, readonly CellRow[]>(down.cells);
    const withE7: NormalizeInput = { ...down, cells };
    cells.set('12-cn-p1-c0-5', [...down.cells.get('12-cn-p1-c0-5')!, { crop_id: '12-cn-p1-c0-5', kind: 'footnote', col: 0, row: 9, text_as_printed: 'E 7 I.-III', marks: ['c:5'], sure: 'y', resolution: 'A', note: '', line: 99 }]);
    const r = normalizeTable(withE7, { partial: true });
    expect(errs(r)).toEqual(['FKB1914-SO 12 c5: train 295 continues as E 7 part-way down the column; the row where E 7 takes over is not keyed, so the times cannot be shared between the two trains']);
    expect(svc(r, '12.c5')).toBeUndefined();
    expect(r.skipped.map((s) => s.col)).toEqual([5]);
  });
  it('a train meeting one keyed station only is not written', () => {
    expect(svc(res, '12.c4')).toBeUndefined();
    expect(warns(res)).toContain('FKB1914-SO 12 c4: train has 1 keyed stop (BER-ANH): it meets no other keyed station, so no service is written');
  });
  it('without its running_rules row the column is flagged (strict) or left out (partial)', () => {
    const bare = { ...down, runningRules: [] };
    expect(errs(normalizeTable(bare))).toEqual(['FKB1914-SO 12 c5: footnote mark •@c5 has no running_rules.csv row for FKB1914-SO 12; a historian must interpret it ("• Verkehrt erst ab 29./5.")']);
    const p = normalizeTable(bare, { partial: true });
    expect(p.skipped.map((s) => s.col)).toEqual([5]);
    expect(p.tableErrors).toBe(0);
  });
  it('an unreviewed proposal is applied only in partial mode', () => {
    const pending = { ...down, runningRules: down.runningRules.map((r) => ({ ...r, reviewed_by: '' })) };
    expect(errs(normalizeTable(pending))).toEqual(['FKB1914-SO 12 c5: running_rules.csv row for mark •@c5 is not reviewed (reviewed_by is empty)']);
    const p = normalizeTable(pending, { partial: true });
    expect(svc(p, '12.c5')?.running_rule).toBe('from:1914-05-29;daily');
    expect(warns(p)).toContain('FKB1914-SO 12 c5: pending: running_rules.csv row for mark •@c5 is not reviewed; applied as proposed ("from:1914-05-29;daily")');
  });

  it('upwards: midnight crossing and a ditto standing for the marker above', () => {
    const up = normalizeTable(input('12', { trainKeyPrefix: 'DE' }, {
      '12-c18-23-r48-88': { page: 59, rows: [
        ['label', 0, 48, 'a. Berlin Anh. Bf. 315'], ['label', 0, 85, '189 in Dresden-Neustadt', '', 'A'], ['label', 0, 86, 'aus Dresden-Neustadt …', '', 'B'],
        ['label', 0, 87, '191 i. Dresden Wettinerstr.', '', 'A'], ['label', 0, 88, '198 〃 Dresden Hbf.', '', 'A'],
        ['header', 21, 0, '286', '', 'B'], ['header', 21, 1, 'I-IV', '', 'B'],
        ['cell', 21, 48, '7 25', 'u', 'A'], ['cell', 21, 85, '12 06', 'u', 'A'], ['cell', 21, 86, '12 08', 'u', 'A'], ['cell', 21, 87, '12 11', 'u', 'A'], ['cell', 21, 88, '12 16', 'u', 'A'],
      ] },
    }));
    expect(errs(up)).toEqual([]);
    expect(stops(up, '12.c21')).toEqual(['BER-ANH /19:25', 'DRE-NEU 00:06+1/00:08+1', 'DRE-WET 00:11+1/', 'DRE-HBF 00:16+1/']);
  });
});

describe('table 13 c11 (D195): a departure printed before the arrival is flagged, not corrected', () => {
  const inp = input('13', { trainKeyPrefix: 'DE' }, {
    '13-c7-13-r0-36': { page: 60, rows: [
      ['label', 0, 2, '4 i.Dresden-Neustadt', '', 'other'], ['label', 0, 3, 'a. Dresden-Neustadt …', '', 'B'], ['label', 0, 36, '180 i.BerlinAnh-Bf.312', '', 'other'],
      ['header', 11, 0, 'D195', '', 'B'], ['header', 11, 1, 'I.-III', '', 'B'],
      ['cell', 11, 2, '10 29', 'u;i'], ['cell', 11, 3, '10 11', 'u;i'], ['cell', 11, 36, '12 50', 'u;i'],
    ] },
  });
  inp.aliases = new Map([...inp.aliases, ['BerlinAnh-Bf.', 'BER-ANH']]);
  it('strict: an error; partial: the column is left out and listed', () => {
    expect(errs(normalizeTable(inp))).toEqual(['FKB1914-SO 13 c11r3: ambiguous day offset: 23.7 h after DRE-NEU 10 29 (row 2), more than maxLegHours 20 (a misread time, a missing a.m./p.m. marker, or a day the table does not show)']);
    const p = normalizeTable(inp, { partial: true });
    expect(p.services).toEqual([]);
    expect(p.skipped.map((s) => s.col)).toEqual([11]);
  });
});

describe('table 23 (Dresden–Bodenbach/Tetschen), p. 70: alternative ends and the customs sign', () => {
  const res = normalizeTable(input('23', { trainKeyPrefix: 'DE', altRows: [[14, 26]], labelMarkFlags: { '□': 'customs' } }, {
    '23-c0-6-r0-26': { page: 74, rows: [
      ['label', 0, 0, 'us Dresden Hbf. 4', '', 'A'], ['label', 0, 14, 'in Bodenbach …', 'fn:□', 'other'], ['label', 0, 26, '2 in Tetschen …', 'fn:□', 'other'],
      ['header', 2, 0, '433'], ['header', 2, 1, 'I.-III.'], ['header', 4, 0, '435', 'fn:◗', 'A'], ['header', 4, 1, 'I.-IV'],
      ['cell', 2, 0, '3 40', 'u'], ['cell', 2, 14, '5 22', 'u'], ['cell', 2, 26, '5 21', 'u'],
      ['cell', 4, 0, '6 00', 'b'], ['cell', 4, 14, '7 58', 'b'], ['cell', 4, 26, ''],
    ] },
    '23-cn-p1-c0-6': { page: 74, rows: [
      ['footnote', 0, 0, '◗ Sonn- u. Fest- tags nur I.-III. Kl.', 'c:2;fn:◗', 'A'], ['footnote', 0, 1, '□ In Bodenbach und Tetschen Zollabfertigung.', 'c:4;c:5;fn:□'],
    ] },
  }, [['◗@c2', 'none']]));
  it('reads it without errors', () => expect(errs(res)).toEqual([]));
  it('Bodenbach and Tetschen are two ends of one column, each with its customs flag', () => {
    expect(stops(res, '23.c2.r14')).toEqual(['DRE-HBF /03:40', 'BODENBACH 05:22/ [customs]']);
    expect(stops(res, '23.c2.r26')).toEqual(['DRE-HBF /03:40', 'TETSCHEN 05:21/ [customs]']);
    expect(stops(res, '23.c4')).toEqual(['DRE-HBF /06:00', 'BODENBACH 07:58/ [customs]']);
  });
  it('a sign on a header refers to the note printed with that sign on the same page', () => {
    expect(svc(res, '23.c4')?.running_as_printed).toBe('◗@c2');
    expect(svc(res, '23.c2.r14')?.running_as_printed).toBe('◗@c2');
    expect(res.footnotes.map((f) => f.mark)).toEqual(['□@c4.c5', '◗@c2']);
  });
});

describe('table 112 (Bodenbach–Prag–Wien), p. 178: a braced time keyed in one column stays there', () => {
  const res = normalizeTable(input('112', { trainKeyPrefix: 'AT', unnumbered: true, altRows: [[53, 54]], headerLines: ['classes'] }, {
    '112-c0-7-r0-54': { page: 182, rows: [
      ['label', 0, 0, 'a. Bodenbach K.K.St.B.', 'b', 'other'], ['label', 0, 47, '180 i.Prag Stbhf. 122,123', 'b', 'A'],
      ['label', 0, 53, '528 Wien Nordb. …', 'b', 'other'], ['label', 0, 54, '540 Wien Staatsb', 'b', 'other'],
      ['header', 4, 0, '(I. II)', '', 'A'], ['header', 5, 0, 'I-III'],
      ['cell', 4, 0, '5 45', 'b;u'], ['cell', 4, 47, '10 19', 'b'], ['cell', 4, 53, '6 28', 'u;i', 'A'], ['cell', 4, 54, '10 00', 'u', 'A'],
      ['cell', 5, 0, '8 47', 'i'], ['cell', 5, 47, '11 05', 'i'], ['cell', 5, 53, ''], ['cell', 5, 54, ''],
    ] },
  }));
  it('the column with the Vienna times gives one service per Vienna station; the other column ends at Prague', () => {
    expect(errs(res)).toEqual([]);
    expect(res.services.map((s) => s.service_id.slice(11))).toEqual(['112.c4.r53', '112.c4.r54', '112.c5']);
    expect(stops(res, '112.c4.r53')).toEqual(['BODENBACH /05:45', 'PRG-STB 10:19/', 'WIE-NB 18:28/']);
    expect(stops(res, '112.c4.r54')).toEqual(['BODENBACH /05:45', 'PRG-STB 10:19/', 'WIE-STB 22:00/']);
    expect(stops(res, '112.c5')).toEqual(['BODENBACH /08:47', 'PRG-STB 11:05/']);
    expect(svc(res, '112.c5')).toMatchObject({ train_key: 'AT-T112-c5', category: 'Schnellzug', classes: ['1', '2', '3'] });
    expect(svc(res, '112.c4.r53')).toMatchObject({ train_key: 'AT-T112-c4', classes: ['1', '2'] });
  });
});

describe('table 123 (Prag–Gmünd–Wien), p. 185: printed both ways round the station column', () => {
  const labels: R[] = [
    ['label', 0, 0, 'a. Dresd. Hbf. 23 i.', 'b', 'A'], ['label', 0, 1, '〃 Bodenb. 118 〃', 'b', 'A'],
    ['label', 0, 3, 'a. Prag (F.J.B.) 1 718', 'b', 'A'], ['label', 0, 5, '850 i. Wien F.J.B. 150 a.', 'b', 'A'],
  ];
  const res = normalizeTable(input('123', { trainKeyPrefix: 'AT', unnumbered: true, upColumns: [10, 11], headerLines: ['classes'] }, {
    '123-c0-4-r0-5': { page: 189, rows: [...labels, ['header', 3, 0, 'I.-III'],
      ['cell', 3, 0, '2 30', 'u;i', 'A'], ['cell', 3, 1, '4 05', 'u;i', 'A'], ['cell', 3, 3, '6 50', 'i'], ['cell', 3, 5, '12 50', 'i'],
    ] },
    '123-c10-14-r0-5': { page: 189, rows: [...labels, ['header', 11, 0, 'I.-III'],
      ['cell', 11, 0, '1 10', 'i'], ['cell', 11, 1, '11 37', '', 'B'], ['cell', 11, 3, '6 45', '', 'B'], ['cell', 11, 5, '8 30', 'u', 'B'],
    ] },
    '123-cn-p2-c10-14': { page: 189, rows: [['footnote', 0, 0, 'D-Zug Wien- Prag-Berlin', 'c:11']] },
  }));
  it('reads the left half downwards and the right half upwards, each with its own markers', () => {
    expect(errs(res)).toEqual([]);
    expect(stops(res, '123.c3')).toEqual(['DRE-HBF /02:30', 'BODENBACH /04:05', 'PRG-FJB /06:50', 'WIE-FJB 12:50/']);
    expect(stops(res, '123.c11')).toEqual(['WIE-FJB /20:30', 'PRG-FJB /06:45+1', 'BODENBACH 11:37+1/', 'DRE-HBF 13:10+1/']);
    expect(svc(res, '123.c3')?.category).toBe('Schnellzug');
    expect(svc(res, '123.c11')?.category).toBe('D-Zug');
  });
});

describe('table 126 (Tetschen–Wien Nordwestbahn), pp. 188–189: "ab", "Ank." and the Prague branches', () => {
  const tn = { trainKeyPrefix: 'AT', unnumbered: true, altRows: [[29, 31, 43], [50, 62, 64]], dittoMarkers: { 1: 'a.' }, headerLines: ['classes' as const] };
  const inp = input('126', tn, {
    '126-c1-8-r1-29': { page: 192, rows: [
      ['label', 0, 1, '〃 Dresden Hbf. 23', 'b', 'A'], ['label', 0, 2, 'a. Tetschen N.W.B. 121 147', 'b', 'A'], ['label', 0, 29, 'in Prag F. J. B. 122', 'b', 'A'],
      ['cell', 4, 1, '—'], ['cell', 4, 2, '6 05'], ['cell', 4, 29, '9 51', 'i'],
      ['cell', 6, 1, '7 10', 'i'], ['cell', 6, 2, '8 44'], ['cell', 6, 29, '12 40'],
    ] },
    '126-c0-7-r31-43': { page: 192, rows: [
      ['label', 0, 31, 'in Prag Ö. N. W. B.', 'b', 'A'], ['label', 0, 43, '4?? i. Wien N W. Bf', 'b', 'illegible'],
      ['cell', 4, 31, 'ab'], ['cell', 4, 43, '3 00', 'i'], ['cell', 6, 31, '1 57'], ['cell', 6, 43, '10 30', 'u'],
    ] },
    '126-c20-27-r50-92': { page: 193, rows: [
      ['label', 0, 50, 'aus Wien N. W. Bf.', 'b', 'other'], ['label', 0, 62, 'a. Prag Ö. N. W. B.', 'b', 'A'], ['label', 0, 64, 'a. Prag F. J. B. 122', 'b', 'A'],
      ['label', 0, 91, '4?7 i.Tetsch. N.W.B. 121 147', 'b', 'illegible'], ['label', 0, 92, 'in Dresd. Hbf. 23', 'b', 'other'],
      ['header', 24, 0, 'I.-III'], ['header', 26, 0, 'I-III'],
      ['cell', 24, 50, '8 48', 'u'], ['cell', 24, 62, '6 17'], ['cell', 24, 64, '7 50'], ['cell', 24, 91, '11 40'], ['cell', 24, 92, '1 48', '', 'B'],
      ['cell', 26, 50, '6 24', '', 'B'], ['cell', 26, 62, '—'], ['cell', 26, 64, 'Ank.'], ['cell', 26, 91, ''], ['cell', 26, 92, ''],
    ] },
  });
  it('strict mode refuses the labels whose distance figure is illegible', () => {
    expect(errs(normalizeTable(inp))).toEqual(expect.arrayContaining([
      'FKB1914-SO 126 l0r43: label l0r43 (126-c0-7-r31-43) is illegible and has no waiver',
      'FKB1914-SO 126 l0r91: label l0r91 (126-c20-27-r50-92) is illegible and has no waiver',
    ]));
  });
  const res = normalizeTable(inp, { partial: true });
  it('partial mode reads the station names without the distances', () => {
    expect(errs(res)).toEqual([]);
    expect(warns(res)).toContain('FKB1914-SO 126 l0r43: pending: label "4?? i. Wien N W. Bf" (126-c0-7-r31-43) is illegible; only its distance figure is unreadable, so the station is read without it');
  });
  it('"ab" starts a new train: the part before it ends at Prague, the part after meets one keyed station only', () => {
    expect(res.services.filter((s) => s.service_id.includes('.c4')).map((s) => s.service_id.slice(11))).toEqual(['126.c4']);
    expect(stops(res, '126.c4')).toEqual(['TETSCHEN /06:05', 'PRG-FJB 09:51/']);
    expect(warns(res)).toContain('FKB1914-SO 126 c4.s2: train has 1 keyed stop (WIE-NWB): it meets no other keyed station, so no service is written');
  });
  it('the two Prague stations and Vienna are alternative ends, not consecutive stops; the row-1 ditto stands for "a."', () => {
    expect(stops(res, '126.c6.r29')).toEqual(['DRE-HBF /07:10', 'TETSCHEN /08:44', 'PRG-FJB 12:40/']);
    expect(stops(res, '126.c6.r31')).toEqual(['DRE-HBF /07:10', 'TETSCHEN /08:44', 'PRG-NWB 13:57/']);
    expect(stops(res, '126.c6.r43')).toEqual(['DRE-HBF /07:10', 'TETSCHEN /08:44', 'WIE-NWB 22:30/']);
  });
  it('upwards, Vienna and the two Prague stations are alternative starts; "Ank." ends a train', () => {
    expect(stops(res, '126.c24.r50')).toEqual(['WIE-NWB /20:48', 'TETSCHEN 11:40+1/', 'DRE-HBF 13:48+1/']);
    expect(stops(res, '126.c24.r64')).toEqual(['PRG-FJB /07:50', 'TETSCHEN 11:40/', 'DRE-HBF 13:48/']);
    expect(res.services.some((s) => s.service_id.includes('.c26'))).toBe(false);
  });
});
