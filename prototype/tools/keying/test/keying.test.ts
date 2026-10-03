import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalMarks, cellRef, normText, parseLong, parseResolved, writeLong, writeResolved, type ResolvedCell } from '../longcsv.ts';
import { parseCsv, parseCsvRecords, writeCsv } from '../csv.ts';
import { diffReadings, runDiff } from '../diff.ts';
import { mergeCrop, mergeResolved } from '../merge.ts';
import { buildPacket } from '../resolve-support.ts';
import { readStatus, upsertStatus } from '../status.ts';
import { expectedKeys } from '../../crops/layout.ts';
import { edit, FN, GRID, layout, setupTable, SOURCE, TABLE, truthFootnotes, truthGrid, writeKeyer } from './fixture.ts';
import { planCrops } from '../../crops/make-crops.ts';

const statusOf = (r: { data: string }, crop: string) => readStatus(join(r.data, 'raw', 'status.csv')).find((s) => s.crop_id === crop);

describe('csv', () => {
  it('round-trips quotes, commas, newlines and empty fields', () => {
    const rows = [{ a: 'x,y', b: 'he said "hi"', c: '' }, { a: ' lead', b: 'two\nlines', c: '〃' }];
    const text = writeCsv(['a', 'b', 'c'], rows);
    expect(parseCsv(text).rows).toEqual(rows);
    expect(parseCsvRecords('﻿a,b\r\n1,2\r\n\r\n').map((r) => r.fields)).toEqual([['a', 'b'], ['1', '2']]);
    expect(() => parseCsv('a,b\n1,2,3\n')).toThrow(/3 fields, header has 2/);
    expect(() => parseCsv('a\n"open\n')).toThrow(/unterminated/);
  });
});

describe('long format', () => {
  it('parses, validates and canonicalises a keyer file', () => {
    const text = 'crop_id,kind,col,row,text_as_printed,marks,sure\n' +
      'X,cell,3,12,"  8   15 ",fn:†;b,y\n' +
      'X,cell,3,12,9 00,,y\n' +
      'X,lable,0,1,a,,y\n' +
      'X,cell,1,1,5 05,bold,y\n' +
      'X,cell,2,1,5",,y\n' +
      'X,cell,0,2,,,maybe\n' +
      'Y,cell,4,1,,,y\n';
    const { cells, errors } = parseLong(text, { file: 'X.A.csv', cropId: 'X' });
    expect(cells[0]).toMatchObject({ text: '8 15', marks: ['b', 'fn:†'] });
    expect(errors.some((e) => e.includes('duplicate cell:3:12'))).toBe(true);
    expect(errors.some((e) => e.includes('kind "lable"'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown mark "bold"'))).toBe(true);
    expect(errors.some((e) => e.includes('sure "maybe"'))).toBe(true);
    expect(errors.some((e) => e.includes('crop_id "Y"'))).toBe(true);
    expect(errors.some((e) => e.includes('ASCII quote'))).toBe(true);
    expect(canonicalMarks('fn:b;u;fn:a;b;u')).toEqual(['b', 'u', 'fn:a', 'fn:b']);
    // A column note names its column with c:<n> (column-notes crops).
    const note = parseLong('crop_id,kind,col,row,text_as_printed,marks,sure\nN,footnote,0,0,Schlafwagen Berlin-Karlsbad,c:12;c:11,y\nN,footnote,0,1,x,c:a,y\n', { cropId: 'N' });
    expect(note.cells[0]!.marks).toEqual(['c:11', 'c:12']);
    expect(note.errors).toHaveLength(1);
    expect(note.errors[0]).toMatch(/unknown mark "c:a" .*c:<column> on a column note/);
    expect(normText(' 1  2 ')).toBe('1 2');
    expect(cellRef({ kind: 'header', col: 3, row: 1 })).toBe('h1c3');
    expect(cellRef({ kind: 'label', col: 0, row: 7 })).toBe('l0r7');
    const back = parseLong(writeLong(truthGrid()));
    expect(back.errors).toEqual([]);
    expect(back.cells).toEqual(truthGrid().sort((a, b) => ['header', 'label', 'cell', 'footnote'].indexOf(a.kind) - ['header', 'label', 'cell', 'footnote'].indexOf(b.kind) || a.row - b.row || a.col - b.col));
  });
});

describe('diff', () => {
  it('aligns by (kind, col, row) and classifies disagreements', () => {
    const a = truthGrid();
    const b = edit(truthGrid(), {
      'cell:1:0': { text: '9 46' },
      'cell:2:1': { marks: [] },
      'label:0:2': null,
      'cell:3:2': { text: '12 01', marks: ['b'] },
      'cell:0:1': { sure: 'x', text: '8 3?' },
    });
    const d = diffReadings(a, b, expectedKeys(layout(), planCrops(layout())[0]!));
    expect(d.total).toBe(23);
    expect(d.agreed).toBe(18);
    expect(d.permille).toBe(782);
    expect(d.disagreements.map((x) => `${x.kind}:${x.col}:${x.row}:${x.reason}`)).toEqual([
      'label:0:2:missing-B', 'cell:1:0:text', 'cell:0:1:illegible', 'cell:2:1:marks', 'cell:3:2:text+marks',
    ]);
  });

  it('sends identical but doubted readings to the resolver without lowering agreement', () => {
    const a = edit(truthGrid(), { 'cell:1:0': { sure: 'n' } });
    const b = truthGrid();
    const exp = expectedKeys(layout(), planCrops(layout())[0]!);
    const d = diffReadings(a, b, exp);
    expect(d.doubtful).toBe(1);
    expect(d.agreed).toBe(d.total - 1);
    expect(d.permille).toBe(1000);
    expect(d.disagreements.map((x) => `${x.kind}:${x.col}:${x.row}:${x.reason}`)).toEqual(['cell:1:0:doubtful']);
    // The merge then needs a decision for it; choosing the shared reading is allowed.
    const shared = a.find((c) => c.kind === 'cell' && c.col === 1 && c.row === 0)!;
    const missing = mergeResolved(a, b, [], exp, 'X');
    expect(missing.errors.join('\n')).toMatch(/disputed \(doubtful\) but no resolution/);
    const ok = mergeResolved(a, b, [{ ...shared, crop_id: 'X', sure: 'y', resolution: 'A', note: 'zoom shows it' }], exp, 'X');
    expect(ok.errors).toEqual([]);
    expect(ok.counts.A).toBe(1);
  });

  it('writes the diff list and status, marking crops under 950‰ for re-keying', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, GRID, 'A', truthGrid());
    writeKeyer(dir, GRID, 'B', edit(truthGrid(), { 'cell:1:0': { text: '9 46' }, 'cell:2:1': { marks: [] } }));
    writeKeyer(dir, FN, 'A', truthFootnotes());
    const out = runDiff(r, SOURCE, TABLE);
    expect(out.map((o) => o.status.status)).toEqual(['rekey', 'keyed']);
    expect(statusOf(r, GRID)).toMatchObject({ status: 'rekey', agreement_permille: '913' });
    expect(statusOf(r, FN)).toMatchObject({ status: 'keyed', note: 'waiting for B' });
    const diff = parseCsv(readFileSync(join(dir, `${GRID}.diff.csv`), 'utf8')).rows;
    expect(diff.map((x) => [x.kind, x.col, x.row, x.reason, x.a_text, x.b_text])).toEqual([
      ['cell', '1', '0', 'text', '9 40', '9 46'], ['cell', '2', '1', 'marks', '10 12', '10 12'],
    ]);

    writeKeyer(dir, GRID, 'B', edit(truthGrid(), { 'cell:1:0': { text: '9 46' } }));
    writeKeyer(dir, FN, 'B', truthFootnotes());
    runDiff(r, SOURCE, TABLE);
    expect(statusOf(r, GRID)).toMatchObject({ status: 'diffed', agreement_permille: '956' });
    expect(statusOf(r, FN)).toMatchObject({ status: 'diffed', agreement_permille: '1000' });
  });

  it('sends a malformed keyer file back for re-keying without diffing', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, GRID, 'A', truthGrid());
    writeKeyer(dir, GRID, 'B', [...truthGrid(), { crop_id: GRID, kind: 'cell', col: 9, row: 0, text: '1 00', marks: [], sure: 'y' }]);
    const [o] = runDiff(r, SOURCE, TABLE, { crops: [GRID] });
    expect(o!.status.status).toBe('rekey');
    expect(o!.problems[0]).toMatch(/B: cell:9:0 is outside T9-c0-3-r0-2/);
    expect(existsSync(join(dir, `${GRID}.diff.csv`))).toBe(false);
  });
});

describe('resolver packet and merge', () => {
  it('builds zooms and a template for the disputed cells, then merges decisions idempotently', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, GRID, 'A', truthGrid());
    writeKeyer(dir, GRID, 'B', edit(truthGrid(), { 'cell:0:1': { text: '8 52' } }));
    runDiff(r, SOURCE, TABLE, { crops: [GRID] });
    const p = (await buildPacket(r, SOURCE, TABLE, GRID))!;
    expect(p.items.map((i) => [i.ref, i.reason, i.a?.text, i.b?.text])).toEqual([['c0r1', 'text', '8 32', '8 52']]);
    const pdir = join(r.build, 'resolve', SOURCE, TABLE, GRID);
    expect(readdirSync(pdir).sort()).toEqual(['R.template.csv', 'packet.json', 'packet.md', 'zoom-cell-c0-r1.png']);
    expect(readFileSync(join(pdir, 'packet.md'), 'utf8')).toContain('- A: `8 32`');
    const template = readFileSync(join(pdir, 'R.template.csv'), 'utf8');
    expect(template).toBe('crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\nT9-c0-3-r0-2,cell,0,1,,,,,\n');

    // Merging before the resolver has answered fails and writes nothing.
    const early = mergeCrop(r, SOURCE, TABLE, GRID);
    expect(early.ok).toBe(false);
    expect(early.errors).toEqual(['cell:0:1: disputed (text) but no resolution']);

    writeKeyer(dir, GRID, 'R', 'crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\nT9-c0-3-r0-2,cell,0,1,,,y,A,"3 vs 5: the bowl is closed"\n');
    const res = mergeCrop(r, SOURCE, TABLE, GRID);
    expect(res.errors).toEqual([]);
    const merged = readFileSync(join(dir, `${GRID}.R.csv`), 'utf8');
    const cells = parseResolved(merged).cells;
    expect(cells).toHaveLength(23);
    expect(cells.find((c) => c.kind === 'cell' && c.col === 0 && c.row === 1)).toMatchObject({ text: '8 32', resolution: 'A', note: '3 vs 5: the bowl is closed' });
    expect(cells.filter((c) => c.resolution === 'agree')).toHaveLength(22);
    expect(statusOf(r, GRID)).toMatchObject({ status: 'resolved', agreement_permille: '956' });
    // Idempotent.
    expect(mergeCrop(r, SOURCE, TABLE, GRID).ok).toBe(true);
    expect(readFileSync(join(dir, `${GRID}.R.csv`), 'utf8')).toBe(merged);
  });

  it('checks the resolver decisions', () => {
    const exp = expectedKeys(layout(), planCrops(layout())[0]!);
    const a = truthGrid();
    const b = edit(truthGrid(), { 'cell:0:1': { text: '8 52' }, 'cell:1:1': { text: '1' }, 'cell:2:2': null, 'cell:3:0': { sure: 'x', text: '' } });
    const rr = (k: string, p: Partial<ResolvedCell>): ResolvedCell => {
      const [kind, col, row] = k.split(':');
      return { crop_id: GRID, kind: kind as ResolvedCell['kind'], col: Number(col), row: Number(row), text: '', marks: [], sure: 'y', resolution: '', note: '', ...p };
    };
    const bad = mergeResolved(a, b, [
      rr('cell:0:1', { resolution: 'A', text: '8 33' }),
      rr('cell:1:1', { resolution: 'agree', text: '|' }),
      rr('cell:2:2', { resolution: 'B' }),
      rr('cell:3:0', { resolution: 'other', text: '11 05', sure: 'x' }),
      rr('cell:0:0', { resolution: 'B', text: '8 15' }),
    ], exp, GRID);
    expect([...bad.errors].sort()).toEqual([
      'cell:0:0: A and B agree on "8 15"; the resolver row says B "8 15"',
      'cell:0:1: resolution A but the row\'s text/marks "8 33" [] differ from A\'s "8 32" [] (use other)',
      'cell:1:1: disputed (text); "agree" is not a decision (use A, B, other or illegible)',
      'cell:2:2: resolution B but keyer B has no reading for this cell',
      'cell:3:0: resolution other with sure=x (an unreadable cell is "illegible")',
    ].sort());
    const good = mergeResolved(a, b, [
      rr('cell:0:1', { resolution: 'A' }),
      rr('cell:1:1', { resolution: 'other', text: '|', note: 'both misread' }),
      rr('cell:2:2', { resolution: 'A' }),
      rr('cell:3:0', { resolution: 'illegible', text: '11 0?', note: 'blot' }),
    ], exp, GRID);
    expect(good.errors).toEqual([]);
    expect(good.counts).toEqual({ agree: 19, A: 2, B: 0, other: 1, illegible: 1 });
    expect(good.cells.find((c) => c.col === 3 && c.row === 0 && c.kind === 'cell')).toMatchObject({ sure: 'x', resolution: 'illegible', text: '11 0?' });
    expect(writeResolved(good.cells).split('\n')[0]).toBe('crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note');
  });

  it('merges a crop with no disagreements without a resolver file', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, FN, 'A', truthFootnotes());
    writeKeyer(dir, FN, 'B', truthFootnotes());
    runDiff(r, SOURCE, TABLE, { crops: [FN] });
    expect(await buildPacket(r, SOURCE, TABLE, FN)).toBeNull();
    const res = mergeCrop(r, SOURCE, TABLE, FN);
    expect(res.ok).toBe(true);
    expect(parseResolved(readFileSync(join(dir, `${FN}.R.csv`), 'utf8')).cells.map((c) => [c.kind, c.text, c.resolution])).toEqual([['footnote', '† Runs on SYN weekdays only.', 'agree']]);
  });

  it('refuses to merge a crop marked for re-keying', async () => {
    const { r, dir } = await setupTable();
    writeKeyer(dir, GRID, 'A', truthGrid());
    writeKeyer(dir, GRID, 'B', edit(truthGrid(), { 'cell:0:0': { text: '1' }, 'cell:0:1': { text: '1' }, 'cell:0:2': { text: '1' } }));
    runDiff(r, SOURCE, TABLE, { crops: [GRID] });
    expect(mergeCrop(r, SOURCE, TABLE, GRID).errors[0]).toMatch(/status is rekey/);
  });
});

describe('status', () => {
  it('upserts in a stable order', () => {
    const row = (crop: string, status: 'keyed' | 'diffed') => ({ source_id: 's', table_ref: 't', crop_id: crop, status, agreement_permille: '', note: '' });
    const rows = upsertStatus([row('b', 'keyed'), row('a', 'keyed')], [row('b', 'diffed'), row('c', 'keyed')]);
    expect(rows.map((r) => `${r.crop_id}:${r.status}`)).toEqual(['a:keyed', 'b:diffed', 'c:keyed']);
  });
});

describe('briefs', () => {
  const blocks = (file: string, header: string) => {
    const md = readFileSync(join(import.meta.dirname, '..', file), 'utf8');
    return [...md.matchAll(/```\n([^`]*?)```/g)].map((m) => m[1]!).filter((b) => b.startsWith(header));
  };

  it('keyer and resolver worked examples parse, cover their crop and merge cleanly', () => {
    const kb = blocks('KEYER_BRIEF.md', 'crop_id,kind,col,row,text_as_printed,marks,sure\n');
    const grid = kb.find((b) => b.includes('T57-c4-5-r10-13')); const fn = kb.find((b) => b.includes('T57-fn-p1'));
    const a = parseLong(grid!, { cropId: 'T57-c4-5-r10-13' });
    expect(a.errors).toEqual([]);
    const lay = { ...layout('T57'), panels: [{ ...layout('T57').panels[0]!, col_x: [200, 260, 320, 380, 440, 500, 560], row_y: Array.from({ length: 15 }, (_, i) => 100 + 25 * i), header_y: [50, 75, 100], label_x: [20, 120, 190], footnote_bbox: [20, 480, 520, 30] as [number, number, number, number], table_bbox: [20, 50, 540, 450] as [number, number, number, number], label_bbox: [20, 100, 170, 350] as [number, number, number, number], header_bbox: [200, 50, 360, 50] as [number, number, number, number] }] };
    const crop = { crop_id: 'T57-c4-5-r10-13', page_seq: 2, table_ref: 'T57', body: [440, 350, 120, 100] as [number, number, number, number], header: [440, 50, 120, 50] as [number, number, number, number], label: [20, 350, 170, 100] as [number, number, number, number], cols: [4, 5] as [number, number], rows: [10, 13] as [number, number], footnotes: false };
    const exp = expectedKeys(lay, crop);
    expect(exp).toHaveLength(20);
    expect(a.cells).toHaveLength(20);
    expect(diffReadings(a.cells, a.cells, exp).permille).toBe(1000); // the same abstention by both keyers is concordance
    expect(diffReadings(a.cells, a.cells, exp).disagreements.map((x) => x.reason).sort()).toEqual(['doubtful', 'illegible']); // the doubted bold cell and the abstention still go to the resolver
    expect(parseLong(fn!, { cropId: 'T57-fn-p1' }).errors).toEqual([]);

    const resolved = blocks('RESOLVER_BRIEF.md', 'crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\n').find((b) => b.includes('T57-'));
    const r = parseResolved(resolved!, { cropId: 'T57-c4-5-r10-13' });
    expect(r.errors).toEqual([]);
    const b = edit(a.cells, { 'cell:5:11': { text: '9 28', sure: 'y' }, 'cell:4:12': { marks: [], sure: 'y' }, 'header:5:1': { text: '1 2' } });
    const m = mergeResolved(a.cells, b, r.cells, exp, 'T57-c4-5-r10-13');
    expect(m.errors).toEqual([]);
    expect(m.counts).toEqual({ agree: 17, A: 2, B: 1, other: 0, illegible: 0 });
    expect(m.cells.find((c) => c.kind === 'cell' && c.col === 5 && c.row === 11)).toMatchObject({ text: '9 28', resolution: 'B' });
  });
});
