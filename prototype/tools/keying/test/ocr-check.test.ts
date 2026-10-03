import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { roots } from '../paths.ts';
import { writeLong, type KeyedCell } from '../longcsv.ts';
import type { Box, Layout } from '../../crops/layout.ts';
import { rotatePoint } from '../../crops/propose-layout.ts';
import { parseAlto } from '../../discover/slub.ts';
import {
  altoBoxToLayout, altoTurns, digitsOf, flagsOf, keyerAgreement, ocrCheckMarkdown, probe, runOcrCheck, type OcrSource, type OcrWord,
} from '../ocr-check.ts';

const COL_X = Array.from({ length: 13 }, (_, i) => 230 + 60 * i);
const ROW_Y = Array.from({ length: 21 }, (_, j) => 100 + 25 * j);
const SOURCE = 'sl-testbook';
const TABLE = 'T57';

const LAYOUT: Layout = {
  layout_version: 1, source_id: SOURCE, table_ref: TABLE, table_kind: 'timetable',
  panels: [{
    panel: 'p1', page_seq: 3, table_bbox: [20, 40, 930, 560], label_bbox: [20, 100, 200, 500], header_bbox: [230, 40, 720, 55],
    col_x: COL_X, row_y: ROW_Y, first_col: 0, first_row: 0, header_y: [40, 58, 76, 95], label_x: [20, 160, 220],
  }],
};

const ALTO = parseAlto(readFileSync(join(import.meta.dirname, 'fixtures', 'ocr-p3.alto.xml'), 'utf8'));
const WORDS: OcrWord[] = ALTO.words.map((w) => ({ text: w.text, box: [w.x, w.y, w.w, w.h] as Box }));

const header = (crop: string, nums: string[], first: number): KeyedCell[] =>
  nums.map((t, i) => ({ crop_id: crop, kind: 'header', col: first + i, row: 0, text: t, marks: [], sure: 'y' }));

/** A temporary data/ with the T57 layout and the keyer files given. */
function setup(files: Record<string, KeyedCell[]>) {
  const r = roots({ root: mkdtempSync(join(tmpdir(), 'p1900-ocr-')) });
  const dir = join(r.data, 'raw', SOURCE, TABLE);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'layout.json'), JSON.stringify(LAYOUT));
  for (const [name, cells] of Object.entries(files)) writeFileSync(join(dir, name), writeLong(cells));
  return r;
}

const ocrOf = (words: OcrWord[], size = { width: 1000, height: 700 }): OcrSource => ({
  alto: async () => ({ size, words }),
  imageSize: async () => ({ width: 1000, height: 700 }),
});

const LEFT = 'T57-c0-5-r0-9'; const RIGHT = 'T57-c6-11-r0-9';
const FILES = {
  // Keyer A read the left block; keyer B wrote numbers that are not printed there (as if it never saw the image).
  [`${LEFT}.A.csv`]: header(LEFT, ['281', 'D 53', '295', '57', '311', '412'], 0),
  [`${LEFT}.B.csv`]: header(LEFT, ['118', '640', '77', '932', '305', '26'], 0),
  // Both keyers agree on the right block, and the OCR reads something else there: weak OCR, not a blind keyer.
  [`${RIGHT}.A.csv`]: header(RIGHT, ['301', '302', '303', '304', '305', '306'], 6),
  [`${RIGHT}.B.csv`]: header(RIGHT, ['301', '302', '303', '304', '305', '306'], 6),
};

describe('ocr-check: pieces', () => {
  it('takes the digits of a reading, and none from an unreadable one', () => {
    expect(digitsOf('D 53')).toBe('53');
    expect(digitsOf('10 22')).toBe('1022');
    expect(digitsOf('1? 22')).toBe('');
    expect(digitsOf('|')).toBe('');
  });

  it('finds a keyed number among the tokens of its region, joining a time split into hour and minutes', () => {
    const cell: KeyedCell = { crop_id: LEFT, kind: 'cell', col: 2, row: 3, text: '10 22', marks: [], sure: 'y' };
    const region: Box = [COL_X[2]! - 15, ROW_Y[3]! - 6, 90, 37];
    expect(probe({ cell, digits: '1022', region }, WORDS)).toBe(true);
    expect(probe({ cell, digits: '1023', region }, WORDS)).toBe(false);
    expect(probe({ cell, digits: '1022', region: [600, 500, 20, 20] }, WORDS)).toBeNull(); // no OCR digits there
  });

  it('maps ALTO stored a quarter turn round back onto the page, and onto a deskewed page', () => {
    expect(altoTurns({ width: 1000, height: 700 }, { width: 1000, height: 700 })).toEqual([0]);
    expect(altoTurns({ width: 700, height: 1000 }, { width: 1000, height: 700 })).toEqual([90, 270]);
    expect(altoTurns({ width: 500, height: 500 }, { width: 1000, height: 700 })).toEqual([]);
    const b: Box = [242, 44, 32, 12];
    const [x0, y0] = rotatePoint(b[0], b[1], 90, 1000, 700); const [x1, y1] = rotatePoint(b[0] + b[2], b[1] + b[3], 90, 1000, 700);
    const turned: Box = [Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)];
    expect(altoBoxToLayout(turned, { width: 700, height: 1000 }, { width: 1000, height: 700 }, 90, 0)).toEqual(b);
    // A layout turned by 90° (a table printed sideways) sees the upright ALTO turned the same way.
    const onTurnedPage = altoBoxToLayout(b, { width: 1000, height: 700 }, { width: 1000, height: 700 }, 0, 90);
    expect(onTurnedPage).toEqual(turned.map(Math.round));
  });

  it('flags a low keyer only on evidence that the OCR is readable there', () => {
    const k = (who: 'A' | 'B', found: number, judged: number) => ({ who, found, judged, missing: [] });
    expect(flagsOf([k('A', 6, 6), k('B', 0, 6)], 3)).toEqual(['B']); // the partner reads the OCR
    expect(flagsOf([k('A', 1, 6), k('B', 1, 6)], 3)).toEqual([]); // both low: weak OCR
    expect(flagsOf([k('A', 1, 6), k('B', 0, 6)], 3, { found: 30, judged: 40 }, 0.1)).toEqual(['A', 'B']); // page reads well, keyers disagree
    expect(flagsOf([k('A', 1, 6), k('B', 1, 6)], 3, { found: 30, judged: 40 }, 1)).toEqual([]); // ... but they corroborate each other
    expect(flagsOf([k('A', 6, 6), k('B', 0, 2)], 3)).toEqual([]); // too few judged
  });

  it('measures how far the two keyers corroborate each other', () => {
    const p = (col: number, digits: string) => ({ cell: { crop_id: 'X', kind: 'header' as const, col, row: 0, text: digits, marks: [], sure: 'y' as const }, digits, region: [0, 0, 1, 1] as Box });
    expect(keyerAgreement([p(0, '1'), p(1, '2')], [p(0, '1'), p(1, '3')])).toBe(0.5);
    expect(keyerAgreement([], [])).toBe(0);
  });
});

describe('ocr-check over keyer files', () => {
  it('flags the keyer whose header numbers are not in the OCR when its partner\'s are', async () => {
    const r = setup(FILES);
    const res = await runOcrCheck(r, SOURCE, { ocr: ocrOf(WORDS) });
    expect(res.pages).toEqual([{ page_seq: 3, status: 'ok', turn: 0, pooled: '6/24', note: '' }]);
    const left = res.crops.find((c) => c.crop_id === LEFT)!;
    expect(left.basis).toBe('header');
    expect(left.keyers.map((k) => `${k.who} ${k.found}/${k.judged}`)).toEqual(['A 6/6', 'B 0/6']);
    expect(left.flagged).toEqual(['B']);
    const right = res.crops.find((c) => c.crop_id === RIGHT)!;
    expect(right.flagged).toEqual([]);
    expect(right.weak).toBe(true);
    const md = ocrCheckMarkdown(res);
    expect(md).toContain(`**${TABLE} ${LEFT}, keyer B** (header): 0 of 6 found in the OCR (keyer A: 6 of 6)`);
    expect(md).toContain(`| ${TABLE} | ${RIGHT} | 3 | header | 0/6 | 0/6 | weak OCR |`);
  });

  it('reads ALTO stored turned a quarter round the same way', async () => {
    const r = setup(FILES);
    const turned = WORDS.map((w) => {
      const [x0, y0] = rotatePoint(w.box[0], w.box[1], 270, 1000, 700); const [x1, y1] = rotatePoint(w.box[0] + w.box[2], w.box[1] + w.box[3], 270, 1000, 700);
      return { text: w.text, box: [Math.round(Math.min(x0, x1)), Math.round(Math.min(y0, y1)), Math.round(Math.abs(x1 - x0)), Math.round(Math.abs(y1 - y0))] as Box };
    });
    const res = await runOcrCheck(r, SOURCE, { ocr: ocrOf(turned, { width: 700, height: 1000 }) });
    expect(res.pages[0]!.turn).toBe(270);
    expect(res.crops.find((c) => c.crop_id === LEFT)!.flagged).toEqual(['B']);
  });

  it('uses body times in a table without train numbers, skips crops keyed once, and needs OCR', async () => {
    const r = setup({ ...FILES, 'T57-c0-5-r10-19.A.csv': header('T57-c0-5-r10-19', ['1'], 0) });
    const res = await runOcrCheck(r, SOURCE, { ocr: ocrOf(WORDS) });
    expect(res.skipped).toEqual(['T57/T57-c0-5-r10-19: only keyer A']);
    const none = await runOcrCheck(r, SOURCE, { ocr: null });
    expect(none.skipped).toEqual([`${SOURCE}: no OCR for this library`]);
    // A notation without train numbers in the header: the times are compared instead.
    const cells: KeyedCell[] = [{ crop_id: LEFT, kind: 'cell', col: 2, row: 3, text: '10 22', marks: [], sure: 'y' }];
    const r2 = setup({ [`${LEFT}.A.csv`]: cells, [`${LEFT}.B.csv`]: cells });
    mkdirSync(join(r2.data, 'canonical', 'notation'), { recursive: true });
    writeFileSync(join(r2.data, 'canonical', 'notation', 'X.json'), JSON.stringify({ src: `${SOURCE}:p1:-:-:-`, headerLines: ['classes'] }));
    const t = await runOcrCheck(r2, SOURCE, { ocr: ocrOf(WORDS) });
    expect(t.crops[0]!.basis).toBe('times');
    expect(t.crops[0]!.keyers.map((k) => `${k.found}/${k.judged}`)).toEqual(['1/1', '1/1']);
  });
});
