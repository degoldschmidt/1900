import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { formatTime, generateTable, truthCells } from '../table.ts';
import { degrade, renderPage, synthRoots } from '../render-page.ts';
import { confusionsOf, errorPermille, scoreCells, scoreTable, valuePermille, valueOf } from '../score.ts';
import { roots } from '../../keying/paths.ts';
import { parseLong, writeLong, type KeyedCell } from '../../keying/longcsv.ts';
import { validateLayout, expectedKeys, loadCropsCsv } from '../../crops/layout.ts';
import { loadPage, makeCrops } from '../../crops/make-crops.ts';
import { runDiff } from '../../keying/diff.ts';
import { mergeCrop } from '../../keying/merge.ts';
import { writeReview } from '../../review/side-by-side.ts';

describe('synthetic tables', () => {
  it('are deterministic per seed and use only SYN_ station names', () => {
    const a = generateTable({ seed: 42, stations: 8, trains: 7 });
    expect(generateTable({ seed: 42, stations: 8, trains: 7 })).toEqual(a);
    expect(generateTable({ seed: 43, stations: 8, trains: 7 })).not.toEqual(a);
    const labels = a.rows.map((r) => r.label[0].text).filter((t) => t !== '〃');
    expect(labels.every((t) => t.startsWith('SYN_'))).toBe(true);
    expect(a.header).toHaveLength(3);
    expect(a.rows.every((r) => r.cells.length === 7)).toBe(true);
    const cells = truthCells(a);
    expect(cells).toHaveLength(3 * 7 + a.rows.length * (2 + 7) + a.footnotes.length);
    // Every footnote mark used in the table has its footnote.
    const used = new Set(cells.flatMap((c) => c.marks).filter((m) => m.startsWith('fn:') ));
    expect([...used].sort()).toEqual(a.footnotes.map((f) => `fn:${f.symbol}`).sort());
  });

  it('print 12-hour times with the conventions of each style', () => {
    expect(formatTime(0, ' ')).toEqual({ text: '12 00', pm: false });
    expect(formatTime(12 * 60 + 5, '.')).toEqual({ text: '12.05', pm: true });
    expect(formatTime(23 * 60 + 59 + 1440, ' ')).toEqual({ text: '11 59', pm: true });
    const bold = generateTable({ seed: 5, style: 'bold-pm', stations: 10, trains: 12, timeSep: ' ' });
    const times = bold.rows.flatMap((r) => r.cells).filter((c) => /^\d{1,2} \d\d$/.test(c.text));
    expect(times.some((c) => c.marks.includes('b'))).toBe(true);
    expect(times.some((c) => !c.marks.includes('b'))).toBe(true);
    const words = generateTable({ seed: 5, style: 'mrn-aft', stations: 10, trains: 12 });
    expect(words.header[2]!.every((h) => h.text === 'mrn' || h.text === 'aft')).toBe(true);
    expect(words.rows.flatMap((r) => r.cells).every((c) => !c.marks.includes('b'))).toBe(true);
    const signs = new Set(bold.rows.flatMap((r) => r.cells.map((c) => c.text)).filter((t) => !/\d/.test(t)));
    expect([...signs].every((t) => ['', '|', '—'].includes(t))).toBe(true);
  });
});

describe('degrade', () => {
  it('moves page points exactly as its point map says', async () => {
    const W = 600; const H = 400; const x = 520; const y = 60;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#000"/></svg>`;
    const d = await degrade(await sharp(Buffer.from(svg)).png().toBuffer(), { level: 2, seed: 11 });
    expect(d.angle).not.toBe(0);
    const [px, py] = d.map(x, y);
    const { data, info } = await sharp(d.png).raw().toBuffer({ resolveWithObject: true });
    let sx = 0; let sy = 0; let n = 0;
    for (let yy = Math.floor(py) - 15; yy <= py + 15; yy++) for (let xx = Math.floor(px) - 15; xx <= px + 15; xx++) {
      if (data[(yy * info.width + xx) * info.channels]! < 110) { sx += xx; sy += yy; n++; }
    }
    expect(n).toBeGreaterThan(20);
    expect(Math.abs(sx / n - px)).toBeLessThan(1.5);
    expect(Math.abs(sy / n - py)).toBeLessThan(1.5);
  });
});

describe('score', () => {
  const t = (kind: KeyedCell['kind'], col: number, row: number, text: string, marks: string[] = [], sure: KeyedCell['sure'] = 'y'): KeyedCell =>
    ({ crop_id: 'GT', kind, col, row, text, marks, sure });

  it('counts wrong, missing, spurious and abstained cells and summarises confusions', () => {
    const truth = [t('cell', 0, 0, '3 15'), t('cell', 1, 0, '8 40', ['b']), t('cell', 2, 0, '|'), t('cell', 3, 0, '10 05'), t('label', 0, 0, 'SYN_Au')];
    const keyed = [t('cell', 0, 0, '8 15'), t('cell', 1, 0, '8 40'), t('cell', 3, 0, '10 0?', [], 'x'), t('label', 0, 0, 'SYN_Au'), t('cell', 9, 0, '1 00')];
    const s = scoreCells(truth, keyed, truth);
    expect(s.total).toEqual({ required: 5, wrong: 2, missing: 1, spurious: 1, abstained: 1, valueWrong: 2 });
    expect(errorPermille(s.total)).toBe(800);
    expect(s.byKind.label).toEqual({ required: 1, wrong: 0, missing: 0, spurious: 0, abstained: 0, valueWrong: 0 });
    expect(s.confusions).toEqual([{ what: '-b', n: 1 }, { what: '3→8', n: 1 }]);
    expect(confusionsOf('1 05', '10 5')).toEqual([' →0', '0→ ']);
    expect(confusionsOf('12 30', '12 38')).toEqual(['0→8']);
    expect(confusionsOf('1 5', '1 05')).toEqual(['"1 5"→"1 05"']);
  });

  it('separates typographic slips from errors that change the value', () => {
    const truth = [t('cell', 0, 0, '2 30', ['b']), t('cell', 1, 0, '5·55'), t('label', 1, 0, 'dep.', ['i']), t('cell', 2, 0, '9.03', ['fn:‡']), t('header', 0, 0, '108')];
    const keyed = [t('cell', 0, 0, '2·30', ['b']), t('cell', 1, 0, '5.55'), t('label', 1, 0, 'dep.'), t('cell', 2, 0, '9.03', ['fn:§']), t('header', 0, 0, '106')];
    const s = scoreCells(truth, keyed, truth);
    expect(s.total.wrong).toBe(5);
    expect(s.total.valueWrong).toBe(2); // the footnote symbol and the train number
    expect(valuePermille(s.total)).toBe(400);
    expect(valueOf(t('cell', 0, 0, '12 . 45', ['sc', 'b']))).toBe(valueOf(t('cell', 0, 0, '12:45', ['b'])));
    expect(valueOf(t('cell', 0, 0, '12 45'))).not.toBe(valueOf(t('cell', 0, 0, '12 45', ['b'])));
  });
});

describe('calibration end to end (Chromium)', () => {
  it('renders a page, crops it, keys, diffs, merges, scores and reviews it', async () => {
    const r = synthRoots(roots({ root: mkdtempSync(join(tmpdir(), 'p1900-synth-')) }));
    const res = await renderPage({ seed: 3, stations: 6, trains: 7, style: 'bold-pm', roots: r, degradeLevel: 1 });
    expect(res.layout.panels[0]!.deskew_deg).toBe(-res.angle);
    const straight = await loadPage(res.pagePath, res.layout.panels[0]!.deskew_deg);
    expect(validateLayout(res.layout, new Map([[1, { width: straight.width, height: straight.height }]]))).toEqual([]);
    expect(res.layout.source_id).toBe('SYN_calib-3');
    const truth = parseLong(readFileSync(res.truthPath, 'utf8')).cells;
    expect(truth.length).toBe(truthCells(res.table).length);

    const made = await makeCrops(r, 'SYN_calib-3', 'SYN1');
    const grid = made.crops.filter((c) => !c.footnotes);
    expect(grid.length).toBeGreaterThanOrEqual(1);
    for (const c of made.crops) expect(Math.max(c.geometry.width, c.geometry.height)).toBeLessThanOrEqual(1500);

    // Keyer A reads perfectly; keyer B misreads one time (3↔8 style) on the first crop.
    const dir = join(r.data, 'raw', 'SYN_calib-3', 'SYN1');
    const crops = loadCropsCsv(join(dir, 'crops.csv'));
    const byKey = new Map(truth.map((c) => [`${c.kind}:${c.col}:${c.row}`, c]));
    let misread = '';
    for (const crop of crops) {
      const keys = crop.footnotes ? truth.filter((c) => c.kind === 'footnote') : expectedKeys(res.layout, crop);
      const a = keys.map((k) => ({ ...byKey.get(`${k.kind}:${k.col}:${k.row}`)!, crop_id: crop.crop_id }));
      const b = a.map((c) => {
        if (misread || crop.footnotes || c.kind !== 'cell' || !/\d/.test(c.text)) return c;
        misread = `${c.kind}:${c.col}:${c.row}`;
        return { ...c, text: c.text.replace(/\d$/, (d) => (d === '8' ? '3' : '8')) };
      });
      writeFileSync(join(dir, `${crop.crop_id}.A.csv`), writeLong(a));
      writeFileSync(join(dir, `${crop.crop_id}.B.csv`), writeLong(b));
    }
    expect(misread).not.toBe('');
    const diffs = runDiff(r, 'SYN_calib-3', 'SYN1');
    const disputed = diffs.find((d) => d.diff && d.diff.disagreements.length)!;
    expect(disputed.diff!.disagreements).toHaveLength(1);
    writeFileSync(join(dir, `${disputed.crop_id}.R.csv`), `crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\n${disputed.crop_id},${misread.replaceAll(':', ',')},,,y,A,\n`);
    for (const crop of crops) expect(mergeCrop(r, 'SYN_calib-3', 'SYN1', crop.crop_id).errors).toEqual([]);

    const s = scoreTable(r, 'SYN_calib-3', 'SYN1');
    expect(s.single.wrong).toBe(1);
    expect(s.resolved.wrong + s.resolved.missing + s.resolved.spurious).toBe(0);
    expect(s.resolvedMet).toBe(true);
    expect(s.confusions).toHaveLength(1);

    const html = readFileSync(writeReview(r, 'SYN_calib-3', 'SYN1'), 'utf8');
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('class="resolved"');
    expect(existsSync(join(r.build, 'review', 'SYN_calib-3-SYN1.html'))).toBe(true);
  });
});
