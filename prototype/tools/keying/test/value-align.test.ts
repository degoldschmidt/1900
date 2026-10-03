import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '../csv.ts';
import { parseResolved, type KeyedCell, type ResolvedCell } from '../longcsv.ts';
import { diffReadings, runDiff } from '../diff.ts';
import { mergeCrop, mergeResolved } from '../merge.ts';
import { buildPacket } from '../resolve-support.ts';
import { labelValue, stripLeaders, valueOf } from '../value.ts';
import { valueOf as scoreValueOf } from '../../synth/score.ts';
import { alignNotes, matchNotes, textDistance } from '../align.ts';
import { expectedKeys } from '../../crops/layout.ts';
import { planCrops } from '../../crops/make-crops.ts';
import { edit, FN, GRID, layout, setupTable, SOURCE, TABLE, truthGrid, writeKeyer } from './fixture.ts';

const k = (kind: KeyedCell['kind'], col: number, row: number, text: string, marks: string[] = [], sure: KeyedCell['sure'] = 'y'): KeyedCell =>
  ({ crop_id: 'X', kind, col, row, text, marks, sure });
const note = (row: number, text: string, marks: string[] = [], sure: KeyedCell['sure'] = 'y') => ({ ...k('footnote', 0, row, text, marks, sure), crop_id: FN });

describe('value', () => {
  it('is the one value function of the diff and the scorer', () => {
    expect(scoreValueOf).toBe(valueOf);
  });

  it('treats leader dots after a label as typography, but not an abbreviation stop', () => {
    const forms = ['aus Dresden-Neustadt .', 'aus Dresden-Neustadt . .', 'aus Dresden-Neustadt …', 'aus Dresden-Neustadt ...', 'aus Dresden-Neustadt…', 'aus Dresden-Neustadt'];
    for (const f of forms) expect(valueOf(k('label', 0, 1, f), 'label')).toBe(valueOf(k('label', 0, 1, 'aus Dresden-Neustadt'), 'label'));
    expect(stripLeaders('62 in Dresden Hbf. .')).toBe('62 in Dresden Hbf.');
    expect(stripLeaders('Wettinerstr.…')).toBe('Wettinerstr.');
    expect(stripLeaders('Hbf.')).toBe('Hbf.');
    expect(valueOf(k('label', 0, 1, 'Dresden Hbf.'), 'label')).not.toBe(valueOf(k('label', 0, 1, 'Dresden Hbf'), 'label'));
    // Only labels: in a body cell a lone … is a printed sign, not a leader.
    expect(valueOf(k('cell', 3, 1, '…'))).not.toBe(valueOf(k('cell', 3, 1, '')));
  });

  it('treats a sign after a station name in the text as the same value as the fn: mark', () => {
    expect(labelValue('62 in Tetschen □. .')).toEqual({ text: '62 in Tetschen', signs: ['□'] });
    expect(valueOf(k('label', 0, 1, 'in Bodenbach □.'), 'label')).toBe(valueOf(k('label', 0, 1, 'in Bodenbach', ['fn:□']), 'label'));
    expect(valueOf(k('label', 0, 1, 'a. Berlin Anh. Bf. ● 315'), 'label')).toBe(valueOf(k('label', 0, 1, 'a. Berlin Anh. Bf. 315', ['fn:●']), 'label'));
    // A different sign, a missing sign, a ditto mark or a reference number are values.
    expect(valueOf(k('label', 0, 1, 'in Bodenbach □'), 'label')).not.toBe(valueOf(k('label', 0, 1, 'in Bodenbach', ['fn:●']), 'label'));
    expect(valueOf(k('label', 0, 1, 'in Bodenbach □'), 'label')).not.toBe(valueOf(k('label', 0, 1, 'in Bodenbach'), 'label'));
    expect(labelValue('〃').text).toBe('〃');
    expect(valueOf(k('footnote', 0, 1, 'Speisewagen Wien - Berlin.', ['c:9']), 'footnote')).toBe(valueOf(k('footnote', 0, 1, 'Speisewagen Wien-Berlin.', ['c:9']), 'footnote'));
    expect(valueOf(k('label', 0, 1, 'a. Prag (F. J. B.)'), 'label')).toBe(valueOf(k('label', 0, 1, 'a. Prag (F.J.B.)'), 'label'));
    expect(valueOf(k('header', 6, 0, 'II. III'), 'header')).toBe(valueOf(k('header', 6, 0, 'II.III'), 'header'));
    expect(valueOf(k('label', 0, 1, 'Wien Staatsb.'), 'label')).not.toBe(valueOf(k('label', 0, 1, 'Wien Staatsb'), 'label'));
    expect(valueOf(k('footnote', 0, 1, 'üb. Dresd. F.'), 'footnote')).not.toBe(valueOf(k('footnote', 0, 1, 'üb. Dresd.-F.'), 'footnote'));
    expect(valueOf(k('label', 0, 1, '3 Dresd. Wettinerstr.'), 'label')).not.toBe(valueOf(k('label', 0, 1, 'Dresd. Wettinerstr.'), 'label'));
  });
});

describe('value-aware diff', () => {
  const exp = expectedKeys(layout(), planCrops(layout())[0]!);

  it('classifies same-value readings as typography, sends them to the resolver and counts them concordant', () => {
    const a = edit(truthGrid(), { 'label:0:0': { text: 'SYN_Altenhagen . .' }, 'cell:0:0': { text: '8.15' } });
    const b = edit(truthGrid(), {
      'header:1:0': { marks: [] }, // bold on a train number: emphasis
      'label:0:0': { text: 'SYN_Altenhagen …' },
      'label:0:1': { text: 'SYN_Neubrück †' }, 'cell:2:1': { marks: ['fn:†', 'i'] },
      'cell:1:2': { marks: [] }, // bold on a body time: p.m., a value
    });
    const a2 = edit(a, { 'label:0:1': { marks: ['fn:†'] } });
    const d = diffReadings(a2, b, exp);
    expect(d.disagreements.map((x) => `${x.kind}:${x.col}:${x.row}:${x.reason}`)).toEqual([
      'header:1:0:typography', 'label:0:0:typography', 'label:0:1:typography', 'cell:0:0:typography', 'cell:2:1:typography', 'cell:1:2:marks',
    ]);
    expect(d.typography).toBe(5);
    expect(d.permille).toBe(Math.floor((22 * 1000) / 23));
    // The resolver still decides the exact print.
    const m = mergeResolved(a2, b, [], exp, GRID);
    expect(m.errors.filter((e) => e.includes('(typography) but no resolution'))).toHaveLength(5);
  });
});

describe('notes alignment', () => {
  // Keyer B lists the same column notes in another order, misreads one letter, splits nothing,
  // misses A's last note and adds one A did not see. Two notes have the same text in two columns.
  const A = [
    note(0, '• Über Schreckenstein-Tetschen.', ['c:3', 'fn:•']),
    note(1, 'üb. Dresd. F. Cossebaude', ['c:8']),
    note(2, 'üb. Dresd. F. Cossebaude', ['c:12']),
    note(3, '361 II-IV', ['c:13']),
    note(4, 'Speisewagen Karlsbad-Berlin.', ['c:9']),
    note(5, 'Zug 314 nimmt Reisende nach Badebeul nicht auf.', ['c:12']),
    note(6, 'Nur v. 4./7. bis 31./8.', ['c:12']),
  ];
  const B = [
    note(0, 'Speisewagen Karlsbad-Berlin.', ['c:9']),
    note(1, 'üb. Dresd.-F. Cossebaude', ['c:12']),
    note(2, '• Über Schreckenstein- Tetschen.', ['c:3', 'fn:•']),
    note(3, 'üb. Dresd.-F. Cossebaude', ['c:8']),
    note(4, 'Zug 314 nimmt Reisende nach Radebeul nicht auf.', ['c:12']),
    note(5, '361 II-IV', ['c:13']),
    note(6, 's. a. 234', ['c:0']),
  ];

  it('matches notes by column and text, not by row', () => {
    expect(textDistance('üb. Dresd. F. Cossebaude', 'üb. Dresd.-F. Cossebaude')).toBe(0);
    const pairs = matchNotes(A, B).map((p) => [p.a.row, p.b.row]);
    expect(pairs).toEqual([[0, 2], [1, 3], [2, 1], [3, 5], [4, 0], [5, 4]]);
    const b2 = alignNotes(A, B);
    expect(b2.map((c) => [c.row, c.text])).toEqual([
      [4, 'Speisewagen Karlsbad-Berlin.'], [2, 'üb. Dresd.-F. Cossebaude'], [0, '• Über Schreckenstein- Tetschen.'],
      [1, 'üb. Dresd.-F. Cossebaude'], [5, 'Zug 314 nimmt Reisende nach Radebeul nicht auf.'], [3, '361 II-IV'], [7, 's. a. 234'],
    ]);
    // Aligning an aligned B changes nothing.
    const byRow = (cs: KeyedCell[]) => [...cs].sort((x, y) => x.row - y.row);
    expect(byRow(alignNotes(A, b2))).toEqual(byRow(b2));
  });

  it('diffs matched notes cell by cell; unmatched notes are missing-A / missing-B', () => {
    const d = diffReadings(A, B);
    expect(d.disagreements.map((x) => `${x.row}:${x.reason}:${x.a?.text ?? '-'}|${x.b?.text ?? '-'}`)).toEqual([
      '0:typography:• Über Schreckenstein-Tetschen.|• Über Schreckenstein- Tetschen.',
      '1:text:üb. Dresd. F. Cossebaude|üb. Dresd.-F. Cossebaude',
      '2:text:üb. Dresd. F. Cossebaude|üb. Dresd.-F. Cossebaude',
      '5:text:Zug 314 nimmt Reisende nach Badebeul nicht auf.|Zug 314 nimmt Reisende nach Radebeul nicht auf.',
      '6:missing-B:Nur v. 4./7. bis 31./8.|-',
      '7:missing-A:-|s. a. 234',
    ]);
    expect(d.total).toBe(8);
    expect(d.permille).toBe(375); // 361 II-IV and Speisewagen agree; the hyphen spacing is typography
    expect(d.agreedKeys).toEqual(['footnote:0:3', 'footnote:0:4']);
  });

  it('builds the packet, merges in keyer A\'s order with B-only notes after, idempotently', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, FN, 'A', A);
    writeKeyer(dir, FN, 'B', B);
    const [o] = runDiff(r, SOURCE, TABLE, { crops: [FN] });
    expect(o!.status).toMatchObject({ status: 'rekey', agreement_permille: '375' });
    const diff = parseCsv(readFileSync(join(dir, `${FN}.diff.csv`), 'utf8')).rows;
    expect(diff.map((x) => `${x.row}:${x.reason}`)).toEqual(['0:typography', '1:text', '2:text', '5:text', '6:missing-B', '7:missing-A']);
    const p = (await buildPacket(r, SOURCE, TABLE, FN))!;
    expect(p.items.map((i) => `${i.ref}:${i.reason}`)).toEqual(['f0:typography', 'f1:text', 'f2:text', 'f5:text', 'f6:missing-B', 'f7:missing-A']);
    const rr = (row: number, resolution: ResolvedCell['resolution'], note = ''): string => `${FN},footnote,0,${row},,,y,${resolution},${note}`;
    writeKeyer(dir, FN, 'R', ['crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note',
      rr(0, 'A'), rr(1, 'B', 'hyphen printed'), rr(2, 'B'), rr(5, 'B'), rr(6, 'A'), rr(7, 'B'), ''].join('\n'));
    const res = mergeCrop(r, SOURCE, TABLE, FN, { force: true });
    expect(res.errors).toEqual([]);
    const merged = readFileSync(join(dir, `${FN}.R.csv`), 'utf8');
    expect(parseResolved(merged).cells.map((c) => [c.row, c.text, c.resolution])).toEqual([
      [0, '• Über Schreckenstein-Tetschen.', 'A'],
      [1, 'üb. Dresd.-F. Cossebaude', 'B'],
      [2, 'üb. Dresd.-F. Cossebaude', 'B'],
      [3, '361 II-IV', 'agree'],
      [4, 'Speisewagen Karlsbad-Berlin.', 'agree'],
      [5, 'Zug 314 nimmt Reisende nach Radebeul nicht auf.', 'B'],
      [6, 'Nur v. 4./7. bis 31./8.', 'A'],
      [7, 's. a. 234', 'B'],
    ]);
    expect(parseResolved(merged).cells.find((c) => c.row === 2)!.marks).toEqual(['c:12']);
    expect(mergeCrop(r, SOURCE, TABLE, FN, { force: true }).ok).toBe(true);
    expect(readFileSync(join(dir, `${FN}.R.csv`), 'utf8')).toBe(merged);
  });
});

describe('per-guide value rules (P-010)', async () => {
  const { valueOf, rulesFromNotation, DEFAULT_RULES } = await import('../value.ts');
  it('lets a guide decide which type styles carry meaning on body cells', () => {
    const fritzsche = rulesFromNotation({ valueMarks: ['u', 'i'] });
    const bold = { text: '7 26', marks: ['b'] }; const plain = { text: '7 26', marks: [] as string[] };
    const italic = { text: '7 26', marks: ['i'] };
    expect(valueOf(bold, 'cell', DEFAULT_RULES)).not.toBe(valueOf(plain, 'cell', DEFAULT_RULES));
    expect(valueOf(bold, 'cell', fritzsche)).toBe(valueOf(plain, 'cell', fritzsche));
    expect(valueOf(italic, 'cell', DEFAULT_RULES)).toBe(valueOf(plain, 'cell', DEFAULT_RULES));
    expect(valueOf(italic, 'cell', fritzsche)).not.toBe(valueOf(plain, 'cell', fritzsche));
    expect(rulesFromNotation(null)).toBe(DEFAULT_RULES);
  });
});

describe('train category on the header; signs (P-013)', async () => {
  const { valueOf, sameValue, rulesFromNotation, isSignWord, canonicalSign } = await import('../value.ts');
  const { parseLong } = await import('../longcsv.ts');
  const fritzsche = rulesFromNotation({ valueMarks: ['u'], category: { marks: { i: 'Schnellzug' } } });
  const r = (text: string, marks: string[] = []) => ({ text, marks });

  it('makes italic typography on body cells and value on header cells when the guide reads the category from it', () => {
    expect(valueOf(r('7 26', ['i']), 'cell', fritzsche)).toBe(valueOf(r('7 26'), 'cell', fritzsche));
    expect(valueOf(r('7 26', ['u', 'i']), 'cell', fritzsche)).not.toBe(valueOf(r('7 26'), 'cell', fritzsche));
    expect(valueOf(r('D 53', ['i']), 'header', fritzsche)).not.toBe(valueOf(r('D 53'), 'header', fritzsche));
    // Bold on a train number stays typography; a guide without category marks keeps italic typography on headers.
    expect(valueOf(r('D 53', ['b', 'i']), 'header', fritzsche)).toBe(valueOf(r('D 53', ['i']), 'header', fritzsche));
    const plainGuide = rulesFromNotation({ valueMarks: ['u'] });
    expect(valueOf(r('D 53', ['i']), 'header', plainGuide)).toBe(valueOf(r('D 53'), 'header', plainGuide));
    // An empty header cell of a headerless table can carry the column's italic.
    expect(valueOf(r('', ['i']), 'header', fritzsche)).not.toBe(valueOf(r(''), 'header', fritzsche));
  });

  it('reads a doubled sign the same whether written as one token, two marks or with a space', () => {
    const parse = (marks: string) => parseLong(`crop_id,kind,col,row,text_as_printed,marks,sure\nX,cell,1,1,8 15,${marks},y\n`).cells[0]!.marks;
    expect(parse('fn:°;fn:°')).toEqual(['fn:°°']);
    expect(parse('fn:°°')).toEqual(['fn:°°']);
    expect(parse('u;fn:□;fn:□')).toEqual(['u', 'fn:□□']);
    expect(parse('fn:°;fn:○')).toEqual(['fn:°', 'fn:○']);
    expect(sameValue(r('°°'), r('° °'), 'cell', fritzsche)).toBe(true);
    expect(isSignWord('°°')).toBe(true);
    expect(isSignWord('°○')).toBe(false);
    expect(valueOf(r('in Bodenbach °°'), 'label')).toBe(valueOf(r('in Bodenbach', ['fn:°°']), 'label'));
    expect(valueOf(r('in Bodenbach °°'), 'label')).not.toBe(valueOf(r('in Bodenbach', ['fn:°']), 'label'));
  });

  it('treats look-alike characters of one sign as the same sign, and the small and large rings as different', () => {
    expect(canonicalSign('º˚◯☐')).toBe('°°○□');
    expect(sameValue(r('8 15', ['fn:º']), r('8 15', ['fn:°']), 'cell', fritzsche)).toBe(true);
    expect(sameValue(r('8 15', ['fn:°']), r('8 15', ['fn:○']), 'cell', fritzsche)).toBe(false);
    expect(sameValue(r('8 15', ['fn:!']), r('8 15'), 'cell', fritzsche)).toBe(false);
  });
});
