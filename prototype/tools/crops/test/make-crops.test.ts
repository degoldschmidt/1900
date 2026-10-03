import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { expectedKeys, keyBox, keyInCrop, parseCropsCsv, parseLayout, validateLayout, writeCropsCsv, type Layout } from '../layout.ts';
import { loadPage, makeCrops, marginRects, panelMargins, planCrops, renderZoom, RULER, splitEven, zoomKey } from '../make-crops.ts';
import { roots, type Roots } from '../../keying/paths.ts';

const COL_X = Array.from({ length: 13 }, (_, i) => 230 + 60 * i);
const ROW_Y = Array.from({ length: 21 }, (_, j) => 100 + 25 * j);

const LAYOUT: Layout = {
  layout_version: 1,
  source_id: 'ia-testbook',
  table_ref: 'T57',
  table_kind: 'timetable',
  panels: [{
    panel: 'p1', page_seq: 3,
    table_bbox: [20, 40, 930, 560],
    label_bbox: [20, 100, 200, 500],
    header_bbox: [230, 40, 720, 55],
    col_x: COL_X, row_y: ROW_Y,
    first_col: 0, first_row: 0,
    header_y: [40, 58, 76, 95],
    label_x: [20, 160, 220],
    footnote_bbox: [20, 610, 930, 40],
  }],
};

/** A 1000×700 page: grid lines, and a black block filling cell c7 r12 (with a 6 px inset). */
async function pageImage(): Promise<Buffer> {
  const lines = [
    ...COL_X.map((x) => `<line x1="${x}" y1="40" x2="${x}" y2="600" stroke="#888" stroke-width="1"/>`),
    ...ROW_Y.map((y) => `<line x1="20" y1="${y}" x2="950" y2="${y}" stroke="#ccc" stroke-width="1"/>`),
  ].join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="#fff"/>${lines}
    <rect x="${COL_X[7]! + 6}" y="${ROW_Y[12]! + 6}" width="48" height="13" fill="#000"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function grey(data: Buffer, width: number, channels: number, x: number, y: number): number {
  return data[(Math.round(y) * width + Math.round(x)) * channels]!;
}

let r: Roots;

beforeAll(async () => {
  r = roots({ root: mkdtempSync(join(tmpdir(), 'p1900-crops-')) });
  mkdirSync(join(r.scans, 'ia-testbook'), { recursive: true });
  writeFileSync(join(r.scans, 'ia-testbook', 'p3.png'), await pageImage());
  mkdirSync(join(r.data, 'raw', 'ia-testbook', 'T57'), { recursive: true });
  writeFileSync(join(r.data, 'raw', 'ia-testbook', 'T57', 'layout.json'), JSON.stringify(LAYOUT, null, 2));
});

describe('layout', () => {
  it('accepts the test layout and rejects broken ones', () => {
    expect(validateLayout(LAYOUT, new Map([[3, { width: 1000, height: 700 }]]))).toEqual([]);
    const bad = structuredClone(LAYOUT) as unknown as { panels: Array<Record<string, unknown>> };
    bad.panels[0]!.col_x = [300, 290];
    bad.panels[0]!.header_bbox = [230, 40, 720, 90];
    const errs = validateLayout(bad);
    expect(errs.some((e) => e.includes('col_x'))).toBe(true);
    expect(validateLayout({ ...LAYOUT, panels: [LAYOUT.panels[0]!, { ...LAYOUT.panels[0]!, panel: 'p2' }] })).toEqual(['panels p1 and p2 cover the same absolute cells']);
    expect(validateLayout(LAYOUT, new Map([[3, { width: 900, height: 700 }]])).length).toBeGreaterThan(0);
    expect(() => parseLayout('{"layout_version":2}')).toThrow(/invalid layout/);
  });

  it('splits blocks evenly', () => {
    expect(splitEven(12, 8)).toEqual([[0, 5], [6, 11]]);
    expect(splitEven(20, 18)).toEqual([[0, 9], [10, 19]]);
    expect(splitEven(17, 6)).toEqual([[0, 5], [6, 11], [12, 16]]);
    expect(splitEven(5, 8)).toEqual([[0, 4]]);
  });
});

describe('planCrops', () => {
  it('cuts 6–8 columns × 12–18 rows where the grid allows, magnified 2–3× within 1500 px', () => {
    const all = planCrops(LAYOUT);
    expect(all.map((c) => c.crop_id)).toEqual(['T57-c0-5-r0-9', 'T57-c6-11-r0-9', 'T57-c0-5-r10-19', 'T57-c6-11-r10-19', 'T57-fn-p1']);
    const crops = all.filter((c) => !c.footnotes);
    for (const c of crops) {
      expect(c.geometry.scale).toBeGreaterThanOrEqual(2);
      expect(c.geometry.scale).toBeLessThanOrEqual(3);
      expect(Math.max(c.geometry.width, c.geometry.height)).toBeLessThanOrEqual(1500);
      expect(c.warnings).toEqual([]);
    }
    const c = crops[1]!;
    expect(c.body).toEqual([590, 100, 360, 250]);
    expect(c.header).toEqual([590, 40, 360, 55]);
    expect(c.label).toEqual([20, 100, 200, 250]);
  });

  it('shrinks blocks when a wide scan would fall below 2×', () => {
    const wide = structuredClone(LAYOUT);
    const p = wide.panels[0]!;
    p.col_x = Array.from({ length: 9 }, (_, i) => 230 + 160 * i);
    p.header_bbox = [230, 40, 1280, 55];
    p.table_bbox = [20, 40, 1500, 560];
    const crops = planCrops(wide).filter((c) => !c.footnotes);
    // 8 columns of 160 px plus a 200 px label column cannot reach 2× in 1500 px, nor can two blocks of 4;
    // the blocks with the highest magnification are chosen and the shortfall is reported.
    expect(crops.map((c) => c.cols)).toEqual([[0, 3], [4, 7], [0, 3], [4, 7]]);
    // (4 × 160 + 200 px plus a 25 px margin each side of label and body: 1442 / 940 px.)
    expect(crops[0]!.geometry.scale).toBe(1.53);
    expect(crops[0]!.warnings[0]).toMatch(/below 2×/);
  });

  it('enumerates the keys a keyer must produce', () => {
    const crop = planCrops(LAYOUT)[0]!;
    const keys = expectedKeys(LAYOUT, crop);
    // 3 header lines × 6 columns + 10 rows × (2 label sub-columns + 6 cells)
    expect(keys).toHaveLength(18 + 80);
    expect(keyInCrop(LAYOUT, crop, { kind: 'cell', col: 6, row: 0 })).toBe(false);
    expect(keyInCrop(LAYOUT, crop, { kind: 'header', col: 2, row: 2 })).toBe(true);
    expect(keyInCrop(LAYOUT, crop, { kind: 'header', col: 2, row: 3 })).toBe(false);
    expect(keyBox(LAYOUT, crop, { kind: 'header', col: 1, row: 1 })).toEqual([290, 58, 60, 18]);
    expect(keyBox(LAYOUT, crop, { kind: 'label', col: 1, row: 4 })).toEqual([160, 200, 60, 25]);
    expect(keyInCrop(LAYOUT, crop, { kind: 'footnote', col: 0, row: 0 })).toBe(false);
  });

  it('gives the footnote box a crop of its own, keyed only as footnote lines', () => {
    const fn = planCrops(LAYOUT).find((c) => c.footnotes)!;
    expect(fn.crop_id).toBe('T57-fn-p1');
    expect(fn.body).toEqual([20, 610, 930, 40]);
    expect(expectedKeys(LAYOUT, fn)).toEqual([]);
    expect(keyInCrop(LAYOUT, fn, { kind: 'footnote', col: 0, row: 3 })).toBe(true);
    expect(keyInCrop(LAYOUT, fn, { kind: 'cell', col: 0, row: 0 })).toBe(false);
    expect(Math.max(fn.geometry.width, fn.geometry.height)).toBeLessThanOrEqual(1500);
  });
});

describe('makeCrops', () => {
  it('writes crop PNGs and crops.csv, with every cell where the geometry says', async () => {
    const res = await makeCrops(r, 'ia-testbook', 'T57');
    expect(res.crops).toHaveLength(5);
    const index = readFileSync(join(r.data, 'raw', 'ia-testbook', 'T57', 'crops.csv'), 'utf8');
    expect(index.split('\n')[0]).toBe('crop_id,page_seq,table_ref,x,y,w,h,header_bbox,label_bbox,col_range,row_range');
    expect(index.split('\n')[4]).toBe('T57-c6-11-r10-19,3,T57,590,350,360,250,"590,40,360,55","20,350,200,250",c6-c11,r10-r19');
    expect(index.split('\n')[5]).toBe('T57-fn-p1,3,T57,20,610,930,40,,,,');
    const parsed = parseCropsCsv(index);
    expect(parsed.map((c) => c.crop_id)).toEqual(res.crops.map((c) => c.crop_id));
    expect(parsed[4]!.footnotes).toBe(true);
    expect(existsSync(join(r.scans, 'ia-testbook', 'crops', 'T57', 'T57-fn-p1.png'))).toBe(true);

    const crop = res.crops[3]!;
    const file = join(r.scans, 'ia-testbook', 'crops', 'T57', `${crop.crop_id}.png`);
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    const g = crop.geometry;
    expect([info.width, info.height]).toEqual([g.width, g.height]);
    const at = (px: number, py: number) => grey(data, info.width, info.channels, g.out.body.x + (px - g.page.body[0]) * g.scale, g.out.body.y + (py - g.page.body[1]) * g.scale);
    expect(at(COL_X[7]! + 30, ROW_Y[12]! + 12)).toBeLessThan(60); // the black block in c7 r12
    expect(at(COL_X[8]! + 30, ROW_Y[12]! + 12)).toBeGreaterThan(200); // c8 r12 is empty
    // The ruler area is white apart from red text: a pixel in the top-left corner is untouched.
    expect(grey(data, info.width, info.channels, 2, 2)).toBe(255);
    expect(RULER.left).toBeGreaterThan(0);
  });

  it('refuses a re-plan that would orphan existing keyings unless forced', async () => {
    const other = roots({ root: mkdtempSync(join(tmpdir(), 'p1900-crops2-')) });
    mkdirSync(join(other.scans, 'ia-testbook'), { recursive: true });
    writeFileSync(join(other.scans, 'ia-testbook', 'p3.png'), await pageImage());
    const dir = join(other.data, 'raw', 'ia-testbook', 'T57');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'layout.json'), JSON.stringify(LAYOUT));
    await makeCrops(other, 'ia-testbook', 'T57');
    writeFileSync(join(dir, 'T57-c0-5-r0-9.A.csv'), 'crop_id,kind,col,row,text_as_printed,marks,sure\n');
    const changed = structuredClone(LAYOUT);
    changed.panels[0]!.cols_per_crop = 4;
    writeFileSync(join(dir, 'layout.json'), JSON.stringify(changed));
    await expect(makeCrops(other, 'ia-testbook', 'T57')).rejects.toThrow(/drops crops that already have keyings \(T57-c0-5-r0-9\)/);
    // Redrawing a keyed crop under its own id is refused too; a new keying round gets new ids.
    writeFileSync(join(dir, 'layout.json'), JSON.stringify(LAYOUT));
    await expect(makeCrops(other, 'ia-testbook', 'T57')).rejects.toThrow(/T57-c0-5-r0-9 are already keyed/);
    writeFileSync(join(dir, 'layout.json'), JSON.stringify({ ...LAYOUT, crop_round: 2 }));
    const round2 = await makeCrops(other, 'ia-testbook', 'T57');
    expect(round2.crops[0]!.crop_id).toBe('T57-c0-5-r0-9-v2');
    expect(round2.superseded).toEqual(['T57-c0-5-r0-9']);
    expect(existsSync(join(dir, 'T57-c0-5-r0-9.A.csv'))).toBe(true);
    expect(existsSync(join(other.scans, 'ia-testbook', 'crops', 'T57', 'T57-c0-5-r0-9.png'))).toBe(true);
    // Within the new round the orphan check applies again.
    writeFileSync(join(dir, 'T57-c0-5-r0-9-v2.A.csv'), 'crop_id,kind,col,row,text_as_printed,marks,sure\n');
    writeFileSync(join(dir, 'layout.json'), JSON.stringify({ ...LAYOUT, crop_round: 2, panels: [{ ...LAYOUT.panels[0]!, cols_per_crop: 4 }] }));
    await expect(makeCrops(other, 'ia-testbook', 'T57')).rejects.toThrow(/drops crops that already have keyings \(T57-c0-5-r0-9-v2\)/);
    writeFileSync(join(dir, 'layout.json'), JSON.stringify(changed));
    const forced = await makeCrops(other, 'ia-testbook', 'T57', { force: true });
    expect(forced.crops[0]!.crop_id).toBe('T57-c0-3-r0-9');
    expect(existsSync(join(other.scans, 'ia-testbook', 'crops', 'T57', 'T57-c0-3-r0-9.png'))).toBe(true);
  });
});

describe('zoomKey', () => {
  it('cuts one cell with a margin, magnified 4×, centred on the cell', async () => {
    const page = await loadPage(join(r.scans, 'ia-testbook', 'p3.png'));
    const crop = planCrops(LAYOUT)[3]!;
    const png = await zoomKey(page, LAYOUT, crop, { kind: 'cell', col: 7, row: 12 });
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    // 60×25 cell, margins max(8, 35%) = 21 px and 9 px → 102×43 page px → 408×172 at 4×.
    expect([info.width, info.height]).toEqual([408, 172]);
    expect(grey(data, info.width, info.channels, info.width / 2, info.height / 2)).toBeLessThan(60);
    const foot = await zoomKey(page, LAYOUT, crop, { kind: 'footnote', col: 0, row: 0 });
    expect((await sharp(foot).metadata()).width).toBeLessThanOrEqual(1500);
  });
});

describe('deskew', () => {
  it('rotates the page before cutting when a panel gives deskew_deg', async () => {
    const straight = await loadPage(join(r.scans, 'ia-testbook', 'p3.png'));
    const turned = await loadPage(join(r.scans, 'ia-testbook', 'p3.png'), 1.5);
    expect(turned.width).toBeGreaterThan(straight.width);
    expect(turned.height).toBeGreaterThan(straight.height);
    expect(validateLayout({ ...LAYOUT, panels: [{ ...LAYOUT.panels[0]!, deskew_deg: 12 }] })).toEqual(['panel 0 (p1): deskew_deg must be within ±10 of 0, 90, 180 or 270 (a table printed sideways is turned a quarter turn first)']);
    expect(validateLayout({ ...LAYOUT, panels: [{ ...LAYOUT.panels[0]!, deskew_deg: 91.3 }] })).toEqual([]);
    expect(validateLayout({ ...LAYOUT, panels: [{ ...LAYOUT.panels[0]!, deskew_deg: 45 }] })).toHaveLength(1);
    const quarter = await loadPage(join(r.scans, 'ia-testbook', 'p3.png'), 90);
    expect([quarter.width, quarter.height]).toEqual([straight.height, straight.width]);
  });
});

/** The test layout keeping only rows r0–r2, r9 and r15–r16 (node-only rule), with column notes over all columns. */
const SKIPPING: Layout = {
  ...LAYOUT,
  panels: [{ ...LAYOUT.panels[0]!, skip_rows: [3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 17, 18, 19], notes_bbox: [230, 40, 720, 560] }],
};

describe('skip_rows (node-only rule)', () => {
  it('validates skip_rows, and lets the header band lie within skipped rows', () => {
    expect(validateLayout(SKIPPING)).toEqual([]);
    const bad = (skip: number[]) => validateLayout({ ...LAYOUT, panels: [{ ...LAYOUT.panels[0]!, skip_rows: skip }] });
    expect(bad([3, 3])).toEqual(['panel 0 (p1): skip_rows lists a row twice']);
    expect(bad([25])[0]).toMatch(/outside the panel's rows r0-r19/);
    expect(bad(Array.from({ length: 20 }, (_, i) => i))).toEqual(['panel 0 (p1): skip_rows leaves no row to key']);
    // A header band printed over rows r5–r6, both skipped, is accepted; over a kept row it is not.
    const mid = (skip: number[]) => validateLayout({ ...LAYOUT, panels: [{ ...LAYOUT.panels[0]!, header_bbox: [230, 226, 720, 48], header_y: undefined, skip_rows: skip }] });
    expect(mid([5, 6])).toEqual([]);
    expect(mid([5])[0]).toMatch(/header_bbox overlaps body row r6/);
  });

  it('plans crops over kept rows only, stacking their runs with a gap', () => {
    const crops = planCrops(SKIPPING).filter((c) => !c.footnotes);
    expect(crops.map((c) => c.crop_id)).toEqual(['T57-c0-5-r0-16', 'T57-c6-11-r0-16']);
    const g = crops[0]!.geometry;
    expect(g.runs.map((u) => u.rows)).toEqual([[0, 2], [9, 9], [15, 16]]);
    // Runs are drawn one gap apart, each as tall as its rows.
    expect(g.runs[1]!.outY).toBe(g.runs[0]!.outY + g.runs[0]!.outH + RULER.gap);
    // Each run shows its three rows of 25 px and an 11 px margin above and below.
    expect(g.margin).toEqual({ x: 24, y: 11 });
    expect(g.runs[0]!.outH).toBe(Math.round((75 + 2 * 11) * g.scale));
    const keys = expectedKeys(SKIPPING, crops[0]!);
    expect(keys.filter((k) => k.kind === 'cell').map((k) => k.row).filter((v, i, a) => a.indexOf(v) === i)).toEqual([0, 1, 2, 9, 15, 16]);
    expect(keyInCrop(SKIPPING, crops[0]!, { kind: 'cell', col: 0, row: 5 })).toBe(false);
  });

  it('renders the stitched runs with the right rows in place', async () => {
    const other = roots({ root: mkdtempSync(join(tmpdir(), 'p1900-crops3-')) });
    mkdirSync(join(other.scans, 'ia-testbook'), { recursive: true });
    writeFileSync(join(other.scans, 'ia-testbook', 'p3.png'), await pageImage());
    const lay = { ...SKIPPING, panels: [{ ...SKIPPING.panels[0]!, skip_rows: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 17, 18, 19] }] };
    mkdirSync(join(other.data, 'raw', 'ia-testbook', 'T57'), { recursive: true });
    writeFileSync(join(other.data, 'raw', 'ia-testbook', 'T57', 'layout.json'), JSON.stringify(lay));
    const res = await makeCrops(other, 'ia-testbook', 'T57');
    const crop = res.crops.find((c) => c.crop_id === 'T57-c6-11-r0-16')!;
    const { data, info } = await sharp(join(other.scans, 'ia-testbook', 'crops', 'T57', `${crop.crop_id}.png`)).raw().toBuffer({ resolveWithObject: true });
    const run = crop.geometry.runs.find((u) => u.rows[0] === 12)!;
    const g = crop.geometry;
    // The black block of c7 r12 lies in the run of r12, at its own place.
    expect(grey(data, info.width, info.channels, g.out.body.x + (COL_X[7]! + 30 - g.page.body[0]) * g.scale, run.outY + (ROW_Y[12]! + 12 - run.pageY) * g.scale)).toBeLessThan(60);
  });
});

describe('column notes', () => {
  it('cuts one notes crop per block of grid columns, halves side by side, keyed as footnote lines', () => {
    const all = planCrops(SKIPPING);
    const notes = all.filter((c) => c.crop_id.includes('-cn-'));
    expect(notes.map((c) => c.crop_id)).toEqual(['T57-cn-p1-c0-5', 'T57-cn-p1-c6-11']);
    const n = notes[1]!;
    expect(n.footnotes).toBe(true);
    expect(n.body).toEqual([590, 40, 360, 560]);
    // The block's columns plus a 24 px margin at each side; the crop's own box (crops.csv) has none.
    expect(n.geometry.tiles!.map((t) => t.box)).toEqual([[566, 40, 408, 310], [566, 290, 408, 310]]);
    expect(n.geometry.noteCols).toEqual([6, 11]);
    expect(Math.max(n.geometry.width, n.geometry.height)).toBeLessThanOrEqual(1500);
    expect(expectedKeys(SKIPPING, n)).toEqual([]);
    expect(keyInCrop(SKIPPING, n, { kind: 'footnote', col: 0, row: 4 })).toBe(true);
    expect(keyBox(SKIPPING, n, { kind: 'footnote', col: 0, row: 0 })).toEqual(n.body);
    // The ordinary footnote crop still finds its own box.
    const fn = all.find((c) => c.crop_id === 'T57-fn-p1')!;
    expect(keyBox(SKIPPING, fn, { kind: 'footnote', col: 0, row: 0 })).toEqual([20, 610, 930, 40]);
    // The round trip through crops.csv keeps it a footnote-type crop of the same panel.
    const back = parseCropsCsv(writeCropsCsv(all)).find((c) => c.crop_id === n.crop_id)!;
    expect(back.footnotes).toBe(true);
    expect(keyBox(SKIPPING, back, { kind: 'footnote', col: 0, row: 0 })).toEqual(n.body);
  });
});

describe('margins and keying rounds (P-013)', () => {
  it('widens every part by a margin, washed pale, without changing the crop boxes or ids', () => {
    const p = LAYOUT.panels[0]!;
    // 40% of the 60 px columns (at most one 25 px row height); 45% of the 25 px rows.
    expect(panelMargins(p)).toEqual({ x: 24, y: 11 });
    expect(panelMargins(p, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    const c = planCrops(LAYOUT)[1]!;
    expect(c.crop_id).toBe('T57-c6-11-r0-9');
    expect(c.body).toEqual([590, 100, 360, 250]);
    const g = c.geometry;
    expect(g.page.body).toEqual([590 - 24, 100 - 11, 360 + 48, 250 + 22]);
    expect(g.page.label).toEqual([20 - 24, 100 - 11, 200 + 48, 250 + 22]);
    expect(g.page.header).toEqual([590 - 24, 40 - 11, 360 + 48, 55 + 22]);
    expect(Math.max(g.width, g.height)).toBeLessThanOrEqual(1500);
    expect(g.scale).toBeGreaterThanOrEqual(2);
    // The wash covers the strips: the body's right strip is margin.x × scale wide.
    const right = marginRects(g).filter((r) => r.x + r.w === g.out.body.x + g.out.body.w && r.w < g.out.body.w);
    expect(right.some((r) => Math.abs(r.w - 24 * g.scale) < 1e-6)).toBe(true);
    const plain = planCrops(LAYOUT, { margin: { x: 0, y: 0 } })[1]!;
    expect(marginRects(plain.geometry)).toEqual([]);
    expect(plain.geometry.page.body).toEqual(plain.body);
  });

  it('shows a figure printed across the last column rule, washed', async () => {
    const other = roots({ root: mkdtempSync(join(tmpdir(), 'p1900-crops4-')) });
    mkdirSync(join(other.scans, 'ia-testbook'), { recursive: true });
    // A black block straddling the right rule of c11 (the block's last column).
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="#fff"/><rect x="${COL_X[12]! - 6}" y="${ROW_Y[3]! + 6}" width="16" height="13" fill="#000"/></svg>`;
    writeFileSync(join(other.scans, 'ia-testbook', 'p3.png'), await sharp(Buffer.from(svg)).png().toBuffer());
    mkdirSync(join(other.data, 'raw', 'ia-testbook', 'T57'), { recursive: true });
    writeFileSync(join(other.data, 'raw', 'ia-testbook', 'T57', 'layout.json'), JSON.stringify(LAYOUT));
    const res = await makeCrops(other, 'ia-testbook', 'T57');
    const crop = res.crops.find((c) => c.crop_id === 'T57-c6-11-r0-9')!;
    const g = crop.geometry;
    const { data, info } = await sharp(join(other.scans, 'ia-testbook', 'crops', 'T57', `${crop.crop_id}.png`)).raw().toBuffer({ resolveWithObject: true });
    const at = (px: number, py: number) => grey(data, info.width, info.channels, g.out.body.x + (px - g.page.body[0]) * g.scale, g.out.body.y + (py - g.page.body[1]) * g.scale);
    expect(at(COL_X[12]! - 3, ROW_Y[3]! + 12)).toBeLessThan(60); // inside the crop: full black
    const beyond = at(COL_X[12]! + 6, ROW_Y[3]! + 12); // past the rule, in the margin: washed grey
    expect(beyond).toBeGreaterThan(90);
    expect(beyond).toBeLessThan(170);
  });

  it('a washed zoom keeps an underline just below the cell and a sign across its column rule at full contrast, and washes the context beyond (P-E021)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'p1900-wash-'));
    // The cell's box is [50, 30, 60, 20]: an underline 2–4 px below its bottom edge, a mark 12–14 px below it,
    // a sign straddling its left edge (x 44–52), and a mark well left of it (x 32–34).
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#fff"/>
      <rect x="60" y="52" width="40" height="2" fill="#000"/><rect x="60" y="62" width="40" height="2" fill="#000"/>
      <rect x="44" y="34" width="8" height="10" fill="#000"/><rect x="32" y="34" width="2" height="10" fill="#000"/></svg>`;
    writeFileSync(join(dir, 'p1.png'), await sharp(Buffer.from(svg)).png().toBuffer());
    const page = await loadPage(join(dir, 'p1.png'), 0);
    const png = await renderZoom(page, [30, 10, 100, 60], [50, 30, 60, 20], 2, 'wash');
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const at = (px: number, py: number) => grey(data, info.width, info.channels, (px - 30) * 2, (py - 10) * 2);
    expect(at(80, 53)).toBeLessThan(60); // the underline: full black
    expect(at(46, 39)).toBeLessThan(60); // the sign across the left edge: full black
    for (const beyond of [at(80, 63), at(33, 39)]) { // past the clear strips: washed grey
      expect(beyond).toBeGreaterThan(90);
      expect(beyond).toBeLessThan(170);
    }
  });

  it('gives a re-cut table new crop ids (crop_round), so the earlier round\'s keyings are kept', async () => {
    expect(validateLayout({ ...LAYOUT, crop_round: 0 })).toEqual(['crop_round must be a positive integer']);
    const ids = planCrops({ ...LAYOUT, crop_round: 2 }).map((c) => c.crop_id);
    expect(ids).toEqual(['T57-c0-5-r0-9-v2', 'T57-c6-11-r0-9-v2', 'T57-c0-5-r10-19-v2', 'T57-c6-11-r10-19-v2', 'T57-fn-p1-v2']);
    expect(planCrops({ ...SKIPPING, crop_round: 3 }).filter((c) => c.crop_id.includes('-cn-')).map((c) => c.crop_id)).toEqual(['T57-cn-p1-c0-5-v3', 'T57-cn-p1-c6-11-v3']);
    expect(planCrops({ ...LAYOUT, crop_round: 1 })[0]!.crop_id).toBe('T57-c0-5-r0-9');
  });
});
