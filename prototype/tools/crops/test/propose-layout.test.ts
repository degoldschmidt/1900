import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  checkRows, columnInk, estimateSkew, formatLayout, gapNear, groupPositions, isTimeToken, loadGray, otsu, overlayPng, proposePanel,
  rotatePoint, rowBoundaries, shiftRowsOntoTimes, timeClusters, upsertPanel, ROW_OFFSET_WARN_PX, type ColumnInk, type Gray, type Word,
} from '../propose-layout.ts';
import { validateLayout, type Layout, type Panel } from '../layout.ts';

/**
 * A synthetic timetable page in the style of the Fritzsche Kursbuch (no real scan is committed):
 * a label column, six printed column rules, a long pass-through bar in mid-column (not a rule), one
 * wide gap holding two trains with no rule between them, a two-line header and twelve body rows.
 */
const W = 900; const H = 700;
const RULES = [40, 240, 310, 380, 450, 520, 590, 730];
const TRUE_COLS = [240, 310, 380, 450, 520, 590, 660, 730];
const BAR_X = 485;
const ROW0 = 125; const PITCH = 26; const NROWS = 12;
const STATIONS = ['Dresden', 'Pirna', 'Rathen', 'Schandau', 'Krippen', 'Schöna', 'Bodenbach', 'Aussig', 'Lobositz', 'Raudnitz', 'Kralup', 'Prag'];

/**
 * `labelDy`: the station names are printed this many px above their times (the summer table 126 had
 * about 8: decision P-E021). `underline`: cells whose time is underlined (a 2 px bar 2 px under it).
 */
interface PageOptions { labelDy?: number; underline?: (r: number, c: number) => boolean }

function page(o: PageOptions = {}): { svg: string; words: Word[] } {
  const parts: string[] = [`<rect width="${W}" height="${H}" fill="#f4ead8"/>`];
  const words: Word[] = [];
  for (const x of RULES) parts.push(`<rect x="${x - 1}" y="60" width="2" height="580" fill="#333"/>`);
  parts.push(`<rect x="40" y="119" width="690" height="2" fill="#333"/>`);
  parts.push(`<rect x="${BAR_X - 2}" y="200" width="4" height="400" fill="#333"/>`);
  // Header: train numbers and classes over each true column.
  for (let c = 0; c < TRUE_COLS.length - 1; c++) {
    const cx = (TRUE_COLS[c]! + TRUE_COLS[c + 1]!) / 2;
    parts.push(`<rect x="${cx - 16}" y="72" width="32" height="14" fill="#333"/>`, `<rect x="${cx - 18}" y="97" width="36" height="12" fill="#333"/>`);
  }
  parts.push(`<rect x="60" y="72" width="150" height="14" fill="#333"/>`, `<rect x="60" y="97" width="150" height="12" fill="#333"/>`);
  for (let r = 0; r < NROWS; r++) {
    const y = ROW0 + 6 + r * PITCH;
    const ly = y - (o.labelDy ?? 0);
    parts.push(`<rect x="50" y="${ly}" width="${60 + 8 * STATIONS[r]!.length}" height="14" fill="#333"/>`);
    words.push({ text: STATIONS[r]!, x: 50, y: ly, w: 60 + 8 * STATIONS[r]!.length, h: 14 });
    for (let c = 0; c < TRUE_COLS.length - 1; c++) {
      if (c === 3 && r >= 3) continue; // the pass-through bar runs here
      const cx = (TRUE_COLS[c]! + TRUE_COLS[c + 1]!) / 2;
      parts.push(`<rect x="${cx - 18}" y="${y}" width="36" height="14" fill="#333"/>`);
      if (o.underline?.(r, c)) parts.push(`<rect x="${cx - 18}" y="${y + 16}" width="36" height="2" fill="#333"/>`);
      words.push({ text: `${(r % 11) + 1}${String(10 + 3 * c).padStart(2, '0')}`, x: cx - 18, y, w: 36, h: 14 });
    }
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join('')}</svg>`, words };
}

let img: Gray; let words: Word[]; let pngPath: string; let png: Buffer;

beforeAll(async () => {
  const p = page();
  words = p.words;
  png = await sharp(Buffer.from(p.svg)).png().toBuffer();
  pngPath = join(mkdtempSync(join(tmpdir(), 'p1900-propose-')), 'p3.png');
  writeFileSync(pngPath, png);
  img = await loadGray(pngPath);
});

const near = (a: readonly number[], b: readonly number[], tol: number) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]!) <= tol);

describe('propose-layout helpers', () => {
  it('recognises time-shaped tokens and groups positions', () => {
    for (const t of ['8 15', '815', '1022', '12.05', '•1225', '6:40']) expect(isTimeToken(t)).toBe(true);
    for (const t of ['Dresden', '320.)', 'I-IV', '1', 'D 52']) expect(isTimeToken(t)).toBe(false);
    expect(groupPositions([10, 11, 13, 40, 41], 4)).toEqual([12, 41]);
  });

  it('puts row boundaries at midpoints, or on a rule between two rows', () => {
    expect(rowBoundaries([[10, 24], [36, 50], [62, 76]], [], [0, 100])).toEqual([4, 30, 56, 82]);
    expect(rowBoundaries([[10, 24], [36, 50]], [27], [0, 100])).toEqual([4, 27, 56]);
  });

  it('clusters time tokens by x', () => {
    const cs = timeClusters(words, [590, 120, 140, 520]);
    expect(cs.map((c) => c.x)).toEqual([625, 695]);
  });

  it('rotates points the way sharp turns a page', () => {
    const [x, y] = rotatePoint(0, 0, 90, 100, 50);
    expect([Math.round(x), Math.abs(Math.round(y))]).toEqual([50, 0]);
  });
});

describe('proposePanel', () => {
  it('finds the label column, the columns (bar merged, unruled pair split), the rows and the header band', () => {
    const { panel, notes, warnings } = proposePanel(img, words, { pageSeq: 3, region: [30, 55, 720, 590], body: [122, 640], headerLines: 2 });
    expect(warnings).toEqual([]);
    expect(notes.some((n) => /row lines follow the gaps between the lines of times .*sit on them/.test(n))).toBe(true);
    if (!near(panel.col_x, TRUE_COLS, 6)) throw new Error(`col_x ${panel.col_x.join(',')}; notes: ${notes.join(' | ')}`);
    expect(near(panel.col_x, TRUE_COLS, 6)).toBe(true);
    expect(panel.col_x).toHaveLength(8);
    expect(near([panel.label_bbox[0], panel.label_bbox[0] + panel.label_bbox[2]], [40, 240], 3)).toBe(true);
    expect(panel.row_y).toHaveLength(NROWS + 1);
    for (let r = 0; r < NROWS; r++) {
      const mid = ROW0 + 6 + r * PITCH + 7;
      expect(panel.row_y[r]!).toBeLessThan(mid);
      expect(panel.row_y[r + 1]!).toBeGreaterThan(mid);
    }
    expect(panel.header_y).toHaveLength(3);
    expect(panel.header_bbox[1]).toBeLessThanOrEqual(72);
    expect(panel.header_bbox[1] + panel.header_bbox[3]).toBe(panel.row_y[0]);
    expect(notes.some((n) => /pass-through bar/.test(n))).toBe(true);
    expect(notes.some((n) => /split by 2 time-token clusters/.test(n))).toBe(true);
    const l: Layout = { layout_version: 1, source_id: 'sl-test', table_ref: 'T1', panels: [panel] };
    expect(validateLayout(l, new Map([[3, { width: W, height: H }]]))).toEqual([]);
  });

  it('marks rows whose label matches none of --keep as skip_rows, and works without ALTO', () => {
    const { panel } = proposePanel(img, words, { pageSeq: 3, region: [30, 55, 720, 590], body: [122, 640], keep: ['Dresden', 'Bodenbach|Tetschen', 'Prag'], firstRow: 10 });
    expect(panel.first_row).toBe(10);
    expect(panel.skip_rows).toEqual([11, 12, 13, 14, 15, 17, 18, 19, 20]);
    const bare = proposePanel(img, null, { pageSeq: 3, region: [30, 55, 720, 590], body: [122, 640] });
    expect(bare.panel.row_y).toHaveLength(NROWS + 1);
    // Without ALTO the unruled pair stays one wide column, and is reported.
    expect(bare.panel.col_x).toHaveLength(7);
    expect(bare.notes.some((n) => /median width/.test(n))).toBe(true);
  });

  it('estimates the skew of a turned page', async () => {
    const turned = await sharp(png).rotate(1, { background: '#ffffff' }).png().toBuffer();
    const p = join(mkdtempSync(join(tmpdir(), 'p1900-skew-')), 'p.png');
    writeFileSync(p, turned);
    const g = await loadGray(p);
    const thr = Math.min(150, otsu(g, [30, 55, 740, 600]));
    expect(estimateSkew(g, thr, [30, 120, 740, 520])).toBeCloseTo(-1, 0);
    expect(Math.abs(estimateSkew(img, Math.min(150, otsu(img, [30, 55, 720, 590])), [30, 120, 720, 520]))).toBeLessThan(0.1);
  });
});

/** A one-column ink profile: lines of `ink` px at [y0, y1) ranges, 0 elsewhere (y from 0). */
function inkOf(len: number, lines: Array<[number, number]>, ink = 30, floor = 0): number[] {
  const out = new Array<number>(len).fill(floor);
  for (const [a, b] of lines) for (let y = a; y < b; y++) out[y] = ink;
  return out;
}

describe('rows on the line of times (P-E021)', () => {
  // Times 14 px tall every 26 px from y 10; the gap between two lines is 12 px, centred 6 px below a time.
  const times = (n: number, under = false): Array<[number, number]> => Array.from({ length: n }, (_, i) => {
    const y = 10 + 26 * i;
    return [y, under ? y + 18 : y + 14] as [number, number];
  });

  it('finds the gap between two lines of times in each column, and takes the median over the columns', () => {
    const ink: ColumnInk = { y0: 0, cols: [inkOf(200, times(7)), inkOf(200, times(7)), inkOf(200, times(7))] };
    // Between the first two lines: the time ends at 24, the next starts at 36, so the gap is 24–35.
    expect(gapNear(ink, 30, 15)).toEqual({ y: 30, cols: 3 });
    // A row line placed 8 px too high still finds its gap (the window reaches both lines).
    expect(gapNear(ink, 22, 15.6)?.y).toBe(30);
    // A blank page, or one column only, gives no gap.
    expect(gapNear({ y0: 0, cols: [inkOf(200, [])] }, 30, 15)).toBeNull();
    expect(gapNear({ y0: 0, cols: [inkOf(200, times(7))] }, 30, 15)).toBeNull();
  });

  it('never takes the hairline between a time and its own underline for the gap between lines', () => {
    // Time 10–24, underline 26–28 (2 px under it), next time from 36: the gap between lines is 28–35.
    const col = inkOf(200, times(7).flatMap(([a, b]) => [[a, b], [b + 2, b + 4]] as Array<[number, number]>));
    const g = gapNear({ y0: 0, cols: [col, col] }, 26, 15.6);
    expect(g?.y).toBe(32);
  });

  it('is not misled by a pass-through bar or a sideways note in one column', () => {
    const bar = inkOf(200, [], 30, 4); // a bar: a little ink on every scanline, no gap
    const note = inkOf(200, [[0, 200]], 25); // a sideways note filling the column
    const ink: ColumnInk = { y0: 0, cols: [inkOf(200, times(7)), bar, note, inkOf(200, times(7)), inkOf(200, times(7))] };
    expect(gapNear(ink, 31, 15)).toEqual({ y: 30, cols: 3 });
  });

  it('moves label-column row lines onto the gaps, keeps lines on rules, and interpolates where no gap is measured', () => {
    // Gaps at 30, 56, 82, 108, 134 …; the label column's lines sit 8 px higher. Row line 3 (y 100) lies
    // on a horizontal rule and stays; below the sixth line of times (ending at 154) the paper is blank
    // down to the eighth, so row lines 5 and 6 find no gap and move like their neighbours.
    const lines = times(8).filter((_, i) => i !== 6);
    const ink: ColumnInk = { y0: 0, cols: [inkOf(240, lines), inkOf(240, lines), inkOf(240, lines)] };
    const label = [22, 48, 74, 100, 126, 152, 178];
    const sh = shiftRowsOntoTimes(label, ink, 26, [100]);
    expect(sh.rowY).toEqual([30, 56, 82, 100, 134, 160, 186]);
    expect(sh.offsets).toEqual([8, 8, 8, null, 8, null, null]);
    expect(sh.measured).toBe(4);
    expect(sh.offset).toBe(8);
  });

  const under = (r: number, c: number) => (r + c) % 3 === 0;

  it('proposes rows on the times when the station names sit 8 px above them, with ALTO words and without', async () => {
    const off = page({ labelDy: 8, underline: under });
    const offImg = await loadGray(await (async () => {
      const f = join(mkdtempSync(join(tmpdir(), 'p1900-offset-')), 'p4.png');
      writeFileSync(f, await sharp(Buffer.from(off.svg)).png().toBuffer());
      return f;
    })());
    for (const ws of [off.words, null]) {
      const { panel, warnings } = proposePanel(offImg, ws, { pageSeq: 4, region: [30, 55, 720, 590], body: [122, 640], headerLines: 2, keep: ['Dresden', 'Bodenbach', 'Prag'] });
      expect(panel.row_y).toHaveLength(NROWS + 1);
      for (let r = 0; r < NROWS; r++) {
        const top = ROW0 + 6 + r * PITCH; // the time; its underline (if any) ends 18 px lower
        expect(panel.row_y[r]!).toBeLessThanOrEqual(top - 2);
        expect(panel.row_y[r + 1]!).toBeGreaterThanOrEqual(top + 18 + 2);
      }
      expect(warnings.some((w) => /sit 8 px above them/.test(w))).toBe(true);
      // --keep still reads each label in its own row.
      if (ws) expect(panel.skip_rows).toEqual([1, 2, 3, 4, 5, 7, 8, 9, 10]);
    }
    // The rows the label column alone gives would cut every time (and its underline) in two.
    const labelRows = rowBoundaries(Array.from({ length: NROWS }, (_, r) => [ROW0 - 2 + r * PITCH, ROW0 + 12 + r * PITCH] as [number, number]), [], [122, 640]);
    expect(labelRows[1]! - (ROW0 + 6)).toBeLessThan(14);
  });

  it('checkRows flags row lines off the times and passes rows on them', async () => {
    const off = page({ labelDy: 8, underline: under });
    const f = join(mkdtempSync(join(tmpdir(), 'p1900-check-')), 'p5.png');
    writeFileSync(f, await sharp(Buffer.from(off.svg)).png().toBuffer());
    const offImg = await loadGray(f);
    const { panel } = proposePanel(offImg, off.words, { pageSeq: 5, region: [30, 55, 720, 590], body: [122, 640], headerLines: 2 });
    const good = checkRows(offImg, panel);
    expect(good.problems).toEqual([]);
    expect(good.worst).toBeLessThanOrEqual(ROW_OFFSET_WARN_PX);
    expect(good.measured).toBeGreaterThan(8);
    // The same grid moved 8 px up (as the label column would put it): every inner row line is flagged.
    const high: Panel = { ...panel, row_y: panel.row_y.map((y, k) => (k === 0 ? y : y - 8)) };
    const bad = checkRows(offImg, high);
    expect(bad.offset).toBeLessThanOrEqual(-6);
    expect(bad.problems.filter((p) => /px above the gap between the lines of times/.test(p)).length).toBeGreaterThanOrEqual(NROWS - 2);
    // A missing row line (two rows merged) is flagged too.
    const merged: Panel = { ...panel, row_y: panel.row_y.filter((_, k) => k !== 5) };
    expect(checkRows(offImg, merged).problems.some((p) => /a row line is missing/.test(p))).toBe(true);
  });
});

describe('overlay and layout files', () => {
  it('draws the grid over the page, and a zoomed part', async () => {
    const { panel } = proposePanel(img, words, { pageSeq: 3, region: [30, 55, 720, 590], body: [122, 640], keep: ['Dresden', 'Prag'] });
    const full = await sharp(await overlayPng(pngPath, panel)).metadata();
    expect([full.width, full.height]).toEqual([W, H]);
    const zoom = await sharp(await overlayPng(pngPath, panel, [200, 100, 300, 100])).metadata();
    expect([zoom.width, zoom.height]).toEqual([900, 300]);
  });

  it('replaces panels by name and writes one number list per line', () => {
    const base: Layout = { layout_version: 1, source_id: 's', table_ref: 't', panels: [] };
    const p = { panel: 'p1', page_seq: 1, table_bbox: [0, 0, 10, 10], label_bbox: [0, 2, 2, 8], header_bbox: [2, 0, 8, 2], col_x: [2, 6, 10], row_y: [2, 6, 10], first_col: 0, first_row: 0 } as Layout['panels'][number];
    const l = upsertPanel(upsertPanel(base, p), { ...p, col_x: [2, 7, 10] });
    expect(l.panels).toHaveLength(1);
    expect(formatLayout(l)).toContain('"col_x": [2, 7, 10]');
  });
});
