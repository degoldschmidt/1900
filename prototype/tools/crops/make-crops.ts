/**
 * Composite keying crops.
 *
 *   node tools/crops/make-crops.ts <source_id> <table_ref> [--force] [--dry-run]
 *   node tools/crops/make-crops.ts zoom <source_id> <table_ref> <crop_id> <kind> <col> <row> [--out file.png]
 *
 * Reads data/raw/<source_id>/<table_ref>/layout.json and the page images scans/<source_id>/p<seq>.<ext>.
 * Each crop is one block of train columns × body rows of one panel, stitched with the station-name
 * column on its left and the header band on top (the top-left corner is the label column's own
 * heading). A red ruler shows ABSOLUTE indices: c<n> over each train column, r<n> beside each row,
 * h<n> beside header lines and L<n> over label sub-columns; nothing is drawn over the scan itself.
 * A thin orange gap marks where the parts were stitched together, and where rows listed in the
 * panel's skip_rows (node-only rule) were left out between kept rows.
 *
 * Block size: 4–8 columns × 12–18 kept rows, the largest that can be magnified at least 2× (at most 3×)
 * with the long side ≤ 1500 px (margins included; with them, wide columns may need blocks of 4 or 5).
 * A very high-resolution scan may get less than 2× (warned).
 *
 * Margins (decision P-013): every part shows a strip of the page beyond its box, so a figure printed
 * across a column rule, a label's last letters past the label box, and the edge column of a block are
 * not cut. The strips are MARGIN_X of the panel's median column width left and right (at least
 * MIN_MARGIN_PX) and MARGIN_Y of its median row height above and below the header band and each run of
 * kept rows. They are washed pale, so the keyer sees where the crop's own cells end; the ruler numbers
 * only the crop's own columns and rows. Footnote and column-notes crops get the same pale side strips.
 * crops.csv keeps the unpadded boxes.
 *
 * A layout with crop_round n ≥ 2 (a table re-cut for a new keying round) gives every crop id the
 * suffix -v<n> (tools/crops/layout.ts), so the new keyings never overwrite the earlier round's files.
 *
 * A panel with a footnote_bbox also gets a footnote crop <table_ref>-fn-<panel> (the box alone,
 * magnified up to 3×, under a caption), keyed as kind=footnote lines. A panel with a notes_bbox gets a
 * column-notes crop <table_ref>-cn-<panel> (the box under a ruler of absolute column numbers), keyed
 * the same way with a c:<n> mark per note. Column notes are cut per block of grid columns, and the
 * block's top and bottom halves (overlapping by NOTES_OVERLAP px) are set side by side, so the long
 * sideways notes are magnified about 2×.
 *
 * Output: scans/<source_id>/crops/<table_ref>/<crop_id>.png and data/raw/<source_id>/<table_ref>/crops.csv
 * (crop_id, page_seq, table_ref, x, y, w, h = body block in page pixels, header_bbox, label_bbox,
 * col_range "c0-c7", row_range "r0-r17"). crop_id is <table_ref>-c<a>-<b>-r<c>-<d>.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';
import {
  colRange, cropRoundSuffix, cropRowToCsv, headerLines, isSkippedRow, keptRows, keyBox, labelCols, loadCropsCsv, loadLayout, nCols, panelForCrop, rowRange,
  writeCropsCsv, type Box, type CellKey, type CropRow, type Layout, type Panel,
} from './layout.ts';
import { cropImage, cropsCsv, keyingCsv, layoutJson, roots, scansDir, type Roots } from '../keying/paths.ts';
import { writeTextFile } from '../keying/csv.ts';
import { KINDS, type Kind } from '../keying/longcsv.ts';

export interface CropOptions {
  maxLong?: number;
  minScale?: number;
  maxScale?: number;
  cols?: [number, number];
  rows?: [number, number];
  /** Margins as fractions of the panel's median column width (x) and row height (y); 0 for none. */
  margin?: { x: number; y: number };
}

/** Default margins: 40% of a column width at the sides, 45% of a row height above and below. */
export const MARGIN_X = 0.4;
export const MARGIN_Y = 0.45;
/** The smallest margin in page pixels (when a margin is asked for at all). */
export const MIN_MARGIN_PX = 8;

const DEFAULTS = { maxLong: 1500, minScale: 2, maxScale: 3, cols: [4, 8] as [number, number], rows: [12, 18] as [number, number], margin: { x: MARGIN_X, y: MARGIN_Y } };

/** Page-pixel margins of a panel's crops: [left/right, top/bottom]. */
export interface Margins { x: number; y: number }

function median(v: number[]): number {
  if (v.length === 0) return 0;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

/** The margins of a panel's crops in page pixels, from its median column width (at most one row height) and kept-row height. */
export function panelMargins(p: Panel, m: { x: number; y: number } = DEFAULTS.margin): Margins {
  const widths = p.col_x.slice(1).map((x, i) => x - p.col_x[i]!);
  const heights = keptRows(p).map((r) => p.row_y[r - p.first_row + 1]! - p.row_y[r - p.first_row]!);
  const px = (f: number, base: number) => (f > 0 ? Math.max(MIN_MARGIN_PX, Math.round(f * base)) : 0);
  // The side margin is for a few characters, so it never exceeds a row height (the type size), however wide the columns.
  return { x: Math.min(px(m.x, median(widths)), Math.max(MIN_MARGIN_PX, median(heights))), y: px(m.y, median(heights)) };
}

/** Fixed ruler and gap sizes in output pixels. */
export const RULER = { left: 52, top: 26, gap: 6 } as const;

export interface Rect { x: number; y: number; w: number; h: number }

/** A run of consecutive kept rows: its page y-range (margins included) and where it is drawn (output y). */
export interface RowRun { rows: [number, number]; pageY: number; pageH: number; outY: number; outH: number }

export interface Geometry {
  scale: number;
  /** Column-notes crops: the page boxes and output rectangles of their side-by-side parts. */
  tiles?: Array<{ box: Box; rect: Rect }>;
  /** Column-notes crops: the block's absolute columns (the ruler names only these). */
  noteCols?: [number, number];
  /** The page-pixel margins around each part (washed pale in the image). */
  margin: Margins;
  width: number;
  height: number;
  /** Page boxes of the four parts, margins included (label and body span every row of the block, kept or not). */
  page: { corner: Box; header: Box; label: Box; body: Box };
  /** Output rectangles of the four parts. */
  out: { corner: Rect; header: Rect; label: Rect; body: Rect };
  /** The kept-row runs stacked in the label and body parts, top to bottom (one run without skip_rows). */
  runs: RowRun[];
}

export interface PlannedCrop extends CropRow {
  panel: string;
  /** A column-notes crop (notes_bbox): drawn under a column ruler. */
  colNotes?: boolean;
  geometry: Geometry;
  warnings: string[];
}

/** Splits n items into the fewest blocks of at most `per`, as evenly as possible. */
export function splitEven(n: number, per: number): Array<[number, number]> {
  const blocks = Math.max(1, Math.ceil(n / per));
  const base = Math.floor(n / blocks); const extra = n % blocks;
  const out: Array<[number, number]> = [];
  let start = 0;
  for (let i = 0; i < blocks; i++) {
    const len = base + (i < extra ? 1 : 0);
    out.push([start, start + len - 1]);
    start += len;
  }
  return out;
}

/** The crop's boxes without margins (as written to crops.csv). */
function gridBoxes(p: Panel, cols: [number, number], rows: [number, number]) {
  const ci0 = cols[0] - p.first_col; const ci1 = cols[1] - p.first_col;
  const ri0 = rows[0] - p.first_row; const ri1 = rows[1] - p.first_row;
  const bx = p.col_x[ci0]!; const by = p.row_y[ri0]!;
  const body: Box = [bx, by, p.col_x[ci1 + 1]! - bx, p.row_y[ri1 + 1]! - by];
  const hb = p.header_bbox; const lb = p.label_bbox;
  return {
    body,
    header: [body[0], hb[1], body[2], hb[3]] as Box,
    label: [lb[0], body[1], lb[2], body[3]] as Box,
  };
}

/**
 * The page boxes of the four parts with margins: widened by m.x at the sides and by m.y above and
 * below (label and body are drawn run by run, each run with its own m.y above and below).
 */
function pageBoxes(p: Panel, cols: [number, number], rows: [number, number], m: Margins) {
  const g = gridBoxes(p, cols, rows);
  const hb = p.header_bbox; const lb = p.label_bbox;
  const wide = (b: Box): Box => [b[0] - m.x, b[1], b[2] + 2 * m.x, b[3]];
  const tall = (b: Box): Box => [b[0], b[1] - m.y, b[2], b[3] + 2 * m.y];
  return {
    body: tall(wide(g.body)),
    header: tall(wide(g.header)),
    label: tall(wide(g.label)),
    corner: tall(wide([lb[0], hb[1], lb[2], hb[3]])),
  };
}

/** The scale that fits the composite in maxLong, capped at maxScale (floored to 1/100). `gapsH` is fixed output height (row-run gaps). */
export function fitScale(labelW: number, bodyW: number, headerH: number, bodyH: number, o: { maxLong: number; maxScale: number }, gapsH = 0): number {
  const sw = (o.maxLong - RULER.left - RULER.gap) / (labelW + bodyW);
  const sh = (o.maxLong - RULER.top - RULER.gap - gapsH) / (headerH + bodyH);
  return Math.floor(Math.min(o.maxScale, sw, sh) * 100) / 100;
}

/** Runs of consecutive kept rows within the absolute range `rows` (page y-ranges, widened by `marginY` above and below). */
export function rowRuns(p: Panel, rows: [number, number], marginY = 0): Array<{ rows: [number, number]; pageY: number; pageH: number }> {
  const out: Array<{ rows: [number, number]; pageY: number; pageH: number }> = [];
  for (let r = rows[0]; r <= rows[1]; r++) {
    if (isSkippedRow(p, r)) continue;
    const last = out[out.length - 1];
    if (last && last.rows[1] === r - 1) last.rows[1] = r;
    else out.push({ rows: [r, r], pageY: 0, pageH: 0 });
  }
  for (const run of out) {
    const y0 = p.row_y[run.rows[0] - p.first_row]!; const y1 = p.row_y[run.rows[1] - p.first_row + 1]!;
    run.pageY = y0 - marginY; run.pageH = y1 - y0 + 2 * marginY;
  }
  return out;
}

/** Page height of the kept rows (margins included) and the output height of the gaps between their runs. */
function keptHeight(p: Panel, rows: [number, number], marginY: number): { pageH: number; gapsH: number } {
  const runs = rowRuns(p, rows, marginY);
  return { pageH: runs.reduce((a, r) => a + r.pageH, 0), gapsH: Math.max(0, runs.length - 1) * RULER.gap };
}

export function geometry(p: Panel, cols: [number, number], rows: [number, number], scale: number, m: Margins = { x: 0, y: 0 }): Geometry {
  const b = pageBoxes(p, cols, rows, m);
  const s = scale;
  const Lw = Math.round(b.label[2] * s); const Bw = Math.round(b.body[2] * s);
  const Hh = Math.round(b.header[3] * s);
  const x0 = RULER.left; const x1 = x0 + Lw + RULER.gap;
  const y0 = RULER.top; const y1 = y0 + Hh + RULER.gap;
  const runs: RowRun[] = [];
  let y = y1;
  for (const r of rowRuns(p, rows, m.y)) {
    if (runs.length) y += RULER.gap;
    const outH = Math.max(1, Math.round(r.pageH * s));
    runs.push({ ...r, outY: y, outH });
    y += outH;
  }
  const Bh = y - y1;
  return {
    scale: s,
    margin: m,
    width: x1 + Bw,
    height: y1 + Bh,
    page: b,
    out: {
      corner: { x: x0, y: y0, w: Lw, h: Hh },
      header: { x: x1, y: y0, w: Bw, h: Hh },
      label: { x: x0, y: y1, w: Lw, h: Bh },
      body: { x: x1, y: y1, w: Bw, h: Bh },
    },
    runs,
  };
}

/** Plans the crops of one layout (pure: no image access). */
export function planCrops(layout: Layout, opts: CropOptions = {}): PlannedCrop[] {
  const o = { ...DEFAULTS, ...opts };
  const out: PlannedCrop[] = [];
  const suffix = cropRoundSuffix(layout);
  for (const p of layout.panels) {
    const n = nCols(p); const kept = keptRows(p); const m = kept.length;
    const mg = panelMargins(p, o.margin);
    /** Kept-row block [i, j] (indices into `kept`) → absolute row range. */
    const absRows = (rr: [number, number]): [number, number] => [kept[rr[0]]!, kept[rr[1]]!];
    const colChoices = p.cols_per_crop ? [p.cols_per_crop] : range(o.cols[1], o.cols[0]);
    const rowChoices = p.rows_per_crop ? [p.rows_per_crop] : range(o.rows[1], o.rows[0]);
    const combos: Array<[number, number]> = [];
    for (const c of colChoices) for (const r of rowChoices) combos.push([c, r]);
    combos.sort((a, b) => b[0] * b[1] - a[0] * a[1] || b[0] - a[0]);
    let best: { cb: Array<[number, number]>; rb: Array<[number, number]>; minS: number } | null = null;
    for (const [c, r] of combos) {
      const cb = splitEven(n, c); const rb = splitEven(m, r);
      let minS = Infinity;
      for (const rr of rb) for (const cc of cb) {
        const ar = absRows(rr);
        const b = pageBoxes(p, [cc[0] + p.first_col, cc[1] + p.first_col], ar, mg);
        const kh = keptHeight(p, ar, mg.y);
        minS = Math.min(minS, fitScale(b.label[2], b.body[2], b.header[3], kh.pageH, o, kh.gapsH));
      }
      if (!best || minS > best.minS + 1e-9) best = { cb, rb, minS };
      if (minS >= o.minScale) { best = { cb, rb, minS }; break; }
    }
    const { cb, rb } = best!;
    for (const rr of rb) for (const cc of cb) {
      const cols: [number, number] = [cc[0] + p.first_col, cc[1] + p.first_col];
      const rows = absRows(rr);
      const b = pageBoxes(p, cols, rows, mg);
      const g = gridBoxes(p, cols, rows);
      const kh = keptHeight(p, rows, mg.y);
      const s = fitScale(b.label[2], b.body[2], b.header[3], kh.pageH, o, kh.gapsH);
      const warnings: string[] = [];
      if (s < o.minScale) warnings.push(`magnification ${s}× is below ${o.minScale}× (the scan is large or the block cannot shrink further)`);
      if (s <= 0) throw new Error(`panel ${p.panel}: crop cannot fit in ${o.maxLong} px`);
      out.push({
        crop_id: `${layout.table_ref}-c${cols[0]}-${cols[1]}-r${rows[0]}-${rows[1]}${suffix}`,
        page_seq: p.page_seq, table_ref: layout.table_ref,
        body: g.body, header: g.header, label: g.label, cols, rows,
        panel: p.panel, geometry: geometry(p, cols, rows, s, mg), warnings, footnotes: false,
      });
    }
    if (p.footnote_bbox) out.push(planFootnoteCrop(layout, p, o, mg));
    if (p.notes_bbox) for (const cc of cb) {
      const nc = planNotesCrop(layout, p, [cc[0] + p.first_col, cc[1] + p.first_col], o, mg);
      if (nc) out.push(nc);
    }
  }
  return out;
}

const ZERO: Rect = { x: 0, y: 0, w: 0, h: 0 };
const NO_BOX: Box = [0, 0, 0, 0];

/** The footnote box of a panel as its own crop (with margins all round), under a one-line caption. */
function planFootnoteCrop(layout: Layout, p: Panel, o: { maxLong: number; maxScale: number }, mg: Margins): PlannedCrop {
  const fb = p.footnote_bbox!;
  const pb: Box = [fb[0] - mg.x, fb[1] - mg.y, fb[2] + 2 * mg.x, fb[3] + 2 * mg.y];
  const s = Math.floor(Math.min(o.maxScale, o.maxLong / pb[2], (o.maxLong - RULER.top) / pb[3]) * 100) / 100;
  const w = Math.round(pb[2] * s); const h = Math.round(pb[3] * s);
  return {
    crop_id: `${layout.table_ref}-fn-${p.panel}${cropRoundSuffix(layout)}`, page_seq: p.page_seq, table_ref: layout.table_ref,
    body: fb, header: NO_BOX, label: NO_BOX, cols: [0, -1], rows: [0, -1], footnotes: true, panel: p.panel, warnings: [],
    geometry: {
      scale: s, margin: mg, width: Math.max(w, 420), height: RULER.top + h,
      page: { corner: NO_BOX, header: NO_BOX, label: NO_BOX, body: pb },
      out: { corner: ZERO, header: ZERO, label: ZERO, body: { x: 0, y: RULER.top, w, h } },
      runs: [],
    },
  };
}

/** Overlap (page px) of the top and bottom halves of a column-notes crop. */
export const NOTES_OVERLAP = 30;

/** A column-notes crop for one block of columns: the notes box cut to those columns (with side margins), halves side by side. */
function planNotesCrop(layout: Layout, p: Panel, cols: [number, number], o: { maxLong: number; maxScale: number }, mg: Margins): PlannedCrop | null {
  const nb = p.notes_bbox!;
  const x0 = Math.max(nb[0], p.col_x[cols[0] - p.first_col]!); const x1 = Math.min(nb[0] + nb[2], p.col_x[cols[1] - p.first_col + 1]!);
  if (x1 - x0 < 4) return null;
  const half = Math.ceil(nb[3] / 2);
  const px0 = x0 - mg.x; const w = x1 - x0 + 2 * mg.x;
  const top: Box = [px0, nb[1], w, Math.min(nb[3], half + NOTES_OVERLAP)];
  const bottom: Box = [px0, nb[1] + half - NOTES_OVERLAP, w, nb[3] - half + NOTES_OVERLAP];
  const gap = 4 * RULER.gap;
  const s = Math.floor(Math.min(o.maxScale, (o.maxLong - gap) / (2 * w), (o.maxLong - RULER.top) / Math.max(top[3], bottom[3])) * 100) / 100;
  const W = Math.round(w * s);
  const tiles = [top, bottom].map((box, i) => ({ box, rect: { x: i * (W + gap), y: RULER.top, w: W, h: Math.round(box[3] * s) } }));
  const body: Box = [x0, nb[1], x1 - x0, nb[3]];
  return {
    crop_id: `${layout.table_ref}-cn-${p.panel}-c${cols[0]}-${cols[1]}${cropRoundSuffix(layout)}`, page_seq: p.page_seq, table_ref: layout.table_ref,
    body, header: NO_BOX, label: NO_BOX, cols: [0, -1], rows: [0, -1], footnotes: true, colNotes: true, panel: p.panel,
    warnings: s < 1.5 ? [`column notes magnified only ${s}×`] : [],
    geometry: {
      scale: s, margin: { x: mg.x, y: 0 }, noteCols: cols, width: 2 * W + gap, height: RULER.top + Math.max(...tiles.map((t) => t.rect.h)),
      page: { corner: NO_BOX, header: NO_BOX, label: NO_BOX, body: [px0, nb[1], w, nb[3]] }, out: { corner: ZERO, header: ZERO, label: ZERO, body: ZERO }, runs: [], tiles,
    },
  };
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let v = from; v >= to; v--) out.push(v);
  return out;
}

// ---------------------------------------------------------------- images

export interface PageRaw { data: Buffer; width: number; height: number; channels: 1 | 2 | 3 | 4 }

/** Decodes a page image (optionally deskewed) to raw pixels once, for repeated extraction. */
export async function loadPage(input: string | Buffer, deskewDeg = 0): Promise<PageRaw> {
  let img = sharp(input);
  if (deskewDeg) img = img.rotate(deskewDeg, { background: '#ffffff' });
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 };
}

const WHITE = { r: 255, g: 255, b: 255 };

/** Cuts `box` from the page, scales it by s into an outW×outH RGB buffer, padding with white outside the page. */
export async function cutScaled(page: PageRaw, box: Box, s: number, outW: number, outH: number): Promise<{ data: Buffer; width: number; height: number }> {
  const x0 = Math.max(0, box[0]); const y0 = Math.max(0, box[1]);
  const x1 = Math.min(page.width, box[0] + box[2]); const y1 = Math.min(page.height, box[1] + box[3]);
  const blank = () => sharp({ create: { width: outW, height: outH, channels: 3, background: WHITE } }).raw().toBuffer();
  if (x1 <= x0 || y1 <= y0) return { data: await blank(), width: outW, height: outH };
  const left = Math.min(outW - 1, Math.round((x0 - box[0]) * s)); const top = Math.min(outH - 1, Math.round((y0 - box[1]) * s));
  const w = Math.max(1, Math.min(outW - left, Math.round((x1 - x0) * s)));
  const h = Math.max(1, Math.min(outH - top, Math.round((y1 - y0) * s)));
  const data = await sharp(page.data, { raw: { width: page.width, height: page.height, channels: page.channels } })
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .resize(w, h, { fit: 'fill', kernel: 'lanczos3' })
    .removeAlpha().toColourspace('srgb')
    .extend({ left, top, right: outW - left - w, bottom: outH - top - h, background: WHITE })
    .raw().toBuffer();
  return { data, width: outW, height: outH };
}

/** The red of the rulers and zoom outlines. */
export const RED = '#b00020';

function svgText(x: number, y: number, s: string, size: number, anchor: 'start' | 'middle' | 'end' = 'middle'): string {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-size="${size}" fill="${RED}" text-anchor="${anchor}" dominant-baseline="central">${s}</text>`;
}

/** The ruler overlay (absolute indices) as SVG. */
export function rulerSvg(p: Panel, crop: Pick<CropRow, 'cols' | 'rows'>, g: Geometry): string {
  const s = g.scale; const parts: string[] = [];
  const tick = (x1: number, y1: number, x2: number, y2: number) => parts.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${RED}" stroke-width="1"/>`);
  const ob = g.out.body; const pb = g.page.body;
  // Column indices over the header band.
  for (let c = crop.cols[0]; c <= crop.cols[1]; c++) {
    const i = c - p.first_col;
    const xa = ob.x + (p.col_x[i]! - pb[0]) * s; const xb = ob.x + (p.col_x[i + 1]! - pb[0]) * s;
    const size = Math.max(9, Math.min(14, (xb - xa) * 0.35));
    parts.push(svgText((xa + xb) / 2, RULER.top / 2, `c${c}`, size));
    tick(xa, RULER.top - 7, xa, RULER.top - 1);
    if (c === crop.cols[1]) tick(xb, RULER.top - 7, xb, RULER.top - 1);
  }
  // Row indices left of the label column (kept rows only; numbers jump across a run gap).
  for (const run of g.runs) {
    for (let r = run.rows[0]; r <= run.rows[1]; r++) {
      const i = r - p.first_row;
      const ya = run.outY + (p.row_y[i]! - run.pageY) * s; const yb = run.outY + (p.row_y[i + 1]! - run.pageY) * s;
      const size = Math.max(8, Math.min(14, (yb - ya) * 0.6));
      parts.push(svgText(RULER.left - 6, (ya + yb) / 2, `r${r}`, size, 'end'));
      tick(RULER.left - 4, ya, RULER.left - 1, ya);
      if (r === run.rows[1]) tick(RULER.left - 4, yb, RULER.left - 1, yb);
    }
  }
  // Header lines.
  const oh = g.out.header; const hb = g.page.header;
  if (p.header_y) {
    for (let h = 0; h < p.header_y.length - 1; h++) {
      const ya = oh.y + (p.header_y[h]! - hb[1]) * s; const yb = oh.y + (p.header_y[h + 1]! - hb[1]) * s;
      parts.push(svgText(RULER.left - 6, (ya + yb) / 2, `h${h}`, Math.max(8, Math.min(13, (yb - ya) * 0.6)), 'end'));
    }
  } else {
    parts.push(svgText(RULER.left - 6, oh.y + oh.h / 2, headerLines(p) === 1 ? 'h0' : `h0-${headerLines(p) - 1}`, 11, 'end'));
  }
  // Label sub-columns.
  const ol = g.out.label; const lb = g.page.label;
  if (p.label_x) {
    for (let k = 0; k < p.label_x.length - 1; k++) {
      const xa = ol.x + (p.label_x[k]! - lb[0]) * s; const xb = ol.x + (p.label_x[k + 1]! - lb[0]) * s;
      parts.push(svgText((xa + xb) / 2, RULER.top / 2, `L${k}`, 12));
    }
  } else {
    parts.push(svgText(ol.x + ol.w / 2, RULER.top / 2, labelCols(p) === 1 ? 'L0' : `L0-${labelCols(p) - 1}`, 12));
  }
  // Stitch gaps.
  const gap = (x: number, y: number, w: number, h: number) => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f0a030" opacity="0.8"/>`);
  gap(g.out.label.x + g.out.label.w, RULER.top, RULER.gap, g.height - RULER.top);
  gap(RULER.left, g.out.header.y + g.out.header.h, g.width - RULER.left, RULER.gap);
  for (let k = 1; k < g.runs.length; k++) gap(RULER.left, g.runs[k]!.outY - RULER.gap, g.width - RULER.left, RULER.gap);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}">${marginWash(g).join('')}${parts.join('')}</svg>`;
}

/** Opacity of the white wash over the margins: the print stays readable but visibly outside the crop. */
export const WASH_OPACITY = 0.5;

/** The four strips of `r` within `l`, `t`, `rt`, `b` output pixels of its edges. */
function frame(r: Rect, l: number, t: number, rt: number, b: number): Rect[] {
  const out: Rect[] = [];
  if (t > 0) out.push({ x: r.x, y: r.y, w: r.w, h: Math.min(t, r.h) });
  if (b > 0) out.push({ x: r.x, y: r.y + r.h - Math.min(b, r.h), w: r.w, h: Math.min(b, r.h) });
  if (l > 0) out.push({ x: r.x, y: r.y + t, w: Math.min(l, r.w), h: Math.max(0, r.h - t - b) });
  if (rt > 0) out.push({ x: r.x + r.w - Math.min(rt, r.w), y: r.y + t, w: Math.min(rt, r.w), h: Math.max(0, r.h - t - b) });
  return out.filter((x) => x.w > 0 && x.h > 0);
}

/** The margin strips of a crop (output rectangles), washed pale in the image. */
export function marginRects(g: Geometry): Rect[] {
  const mx = g.margin.x * g.scale; const my = g.margin.y * g.scale;
  if (mx <= 0 && my <= 0) return [];
  if (g.tiles) return g.tiles.flatMap((t) => frame(t.rect, mx, 0, mx, 0));
  if (g.runs.length === 0) return frame(g.out.body, mx, my, mx, my);
  const out = [...frame(g.out.corner, mx, my, mx, my), ...frame(g.out.header, mx, my, mx, my)];
  for (const run of g.runs) for (const part of ['label', 'body'] as const) {
    out.push(...frame({ x: g.out[part].x, y: run.outY, w: g.out[part].w, h: run.outH }, mx, my, mx, my));
  }
  return out;
}

const washRect = (r: Rect) => `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="#ffffff" opacity="${WASH_OPACITY}"/>`;

function marginWash(g: Geometry): string[] {
  return marginRects(g).map(washRect);
}

function footnoteCaptionSvg(g: Geometry): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}">${marginWash(g).join('')}${svgText(6, RULER.top / 2, 'footnotes: key each line as kind=footnote, col 0, row 0, 1, 2 … top to bottom', 12, 'start')}</svg>`;
}

/** Column ruler over each part of a column-notes crop (c<n> over each train column), and the gap between the parts. */
export function notesRulerSvg(p: Panel, g: Geometry): string {
  const s = g.scale; const parts: string[] = [...marginWash(g)];
  const [c0, c1] = g.noteCols ?? [p.first_col, p.first_col + p.col_x.length - 2];
  for (const [k, t] of (g.tiles ?? []).entries()) {
    for (let i = c0 - p.first_col; i <= c1 - p.first_col; i++) {
      const xa = t.rect.x + (p.col_x[i]! - t.box[0]) * s; const xb = t.rect.x + (p.col_x[i + 1]! - t.box[0]) * s;
      if (xb <= t.rect.x + 1 || xa >= t.rect.x + t.rect.w - 1) continue;
      const ca = Math.max(xa, t.rect.x); const cb = Math.min(xb, t.rect.x + t.rect.w);
      parts.push(svgText((ca + cb) / 2, RULER.top / 2, `c${p.first_col + i}`, Math.max(9, Math.min(13, (cb - ca) * 0.35))));
      parts.push(`<line x1="${ca.toFixed(1)}" y1="${RULER.top - 7}" x2="${ca.toFixed(1)}" y2="${RULER.top - 1}" stroke="${RED}" stroke-width="1"/>`);
    }
    if (k > 0) parts.push(`<rect x="${t.rect.x - 4 * RULER.gap}" y="0" width="${4 * RULER.gap}" height="${g.height}" fill="#f0a030" opacity="0.8"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}">${parts.join('')}</svg>`;
}

/** Renders one planned crop to PNG. */
export async function renderCrop(page: PageRaw, p: Panel, crop: PlannedCrop): Promise<Buffer> {
  const g = crop.geometry;
  const layers: OverlayOptions[] = [];
  const parts: Array<{ box: Box; rect: Rect }> = [];
  for (const part of ['corner', 'header'] as const) parts.push({ box: g.page[part], rect: g.out[part] });
  if (g.tiles) parts.push(...g.tiles);
  else if (crop.footnotes) parts.push({ box: g.page.body, rect: g.out.body });
  else {
    for (const run of g.runs) {
      for (const part of ['label', 'body'] as const) {
        const pb = g.page[part];
        parts.push({ box: [pb[0], run.pageY, pb[2], run.pageH], rect: { x: g.out[part].x, y: run.outY, w: g.out[part].w, h: run.outH } });
      }
    }
  }
  for (const { box, rect } of parts) {
    if (rect.w <= 0 || rect.h <= 0) continue;
    const img = await cutScaled(page, box, g.scale, rect.w, rect.h);
    layers.push({ input: img.data, raw: { width: img.width, height: img.height, channels: 3 }, left: rect.x, top: rect.y });
  }
  layers.push({ input: Buffer.from(crop.colNotes ? notesRulerSvg(p, g) : crop.footnotes ? footnoteCaptionSvg(g) : rulerSvg(p, crop, g)), left: 0, top: 0 });
  return sharp({ create: { width: g.width, height: g.height, channels: 3, background: WHITE } })
    .composite(layers).png({ compressionLevel: 9 }).toBuffer();
}

/**
 * A single keyed item cut from the page with a margin, magnified (default 4×, long side ≤ 1500 px),
 * with the item's own box outlined in translucent red. For resolvers.
 */
export async function zoomKey(page: PageRaw, layout: Layout, crop: CropRow, key: CellKey, o: { scale?: number; margin?: number; maxLong?: number } = {}): Promise<Buffer> {
  const box = keyBox(layout, crop, key);
  const marginF = o.margin ?? (key.kind === 'footnote' ? 0.05 : 0.35);
  const mx = Math.max(8, Math.round(box[2] * marginF)); const my = Math.max(8, Math.round(box[3] * marginF));
  const padded: Box = [box[0] - mx, box[1] - my, box[2] + 2 * mx, box[3] + 2 * my];
  const s = Math.min(o.scale ?? 4, (o.maxLong ?? 1500) / Math.max(padded[2], padded[3]));
  return renderZoom(page, padded, box, s, 'outline');
}

/**
 * How a zoom marks its item: `outline` draws a translucent red box on the item's edges (resolver
 * zooms); `wash` washes the context around the item pale (WASH_OPACITY, as the margins of crops) and
 * draws nothing on the print, since an outline sits where an underline would be (contact sheets);
 * `plain` changes nothing in the image (the item is marked outside it, e.g. by a sheet's ticks).
 */
export type ZoomMark = 'outline' | 'wash' | 'plain';

/**
 * In a `wash` zoom, a strip round the item's box stays at full contrast (above and below: fractions of
 * the box height; at the sides: of its width): an underline often sits a little below the row line and
 * a sign before or after a time across a column rule, and the wash hid both from the G2 historians
 * (decision P-E021).
 */
export const WASH_CLEAR = { above: 0.15, below: 0.4, side: 0.25 } as const;

/**
 * Cuts `padded` (a page box holding the item's `box`) from the page, magnified s× to
 * round(w·s) × round(h·s), and marks the item. Shared by zoomKey and the contact sheets.
 */
export async function renderZoom(page: PageRaw, padded: Box, box: Box, s: number, mark: ZoomMark = 'outline'): Promise<Buffer> {
  const W = Math.max(1, Math.round(padded[2] * s)); const H = Math.max(1, Math.round(padded[3] * s));
  const img = await cutScaled(page, padded, s, W, H);
  const rx = (box[0] - padded[0]) * s; const ry = (box[1] - padded[1]) * s;
  const bw = box[2] * s; const bh = box[3] * s;
  const above = Math.min(ry, bh * WASH_CLEAR.above); const below = Math.min(H - ry - bh, bh * WASH_CLEAR.below);
  const left = Math.min(rx, bw * WASH_CLEAR.side); const right = Math.min(W - rx - bw, bw * WASH_CLEAR.side);
  const shapes = mark === 'outline'
    ? `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="none" stroke="${RED}" stroke-width="2" opacity="0.55"/>`
    : mark === 'wash' ? frame({ x: 0, y: 0, w: W, h: H }, rx - left, ry - above, W - rx - bw - right, H - ry - bh - below).map(washRect).join('') : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`;
  return sharp(img.data, { raw: { width: W, height: H, channels: 3 } })
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer();
}

// ---------------------------------------------------------------- files

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'jp2', 'gif'];

/** scans/<source_id>/p<seq>.<ext>, whichever extension exists. */
export function findPageImage(r: Roots, source: string, seq: number): string {
  const dir = scansDir(r, source);
  if (existsSync(dir)) {
    const names = new Set(readdirSync(dir));
    for (const e of IMAGE_EXTS) if (names.has(`p${seq}.${e}`)) return join(dir, `p${seq}.${e}`);
  }
  throw new Error(`no page image p${seq}.<ext> in ${dir} (run tools/fetch/fetch-pages.ts first)`);
}

export interface MakeCropsResult {
  crops: PlannedCrop[]; written: string[]; warnings: string[];
  /** Keyed crops of an earlier keying round left out of the new crops.csv (crop_round). */
  superseded: string[];
}

/** Plans and renders every crop of a table and writes crops.csv. */
export async function makeCrops(r: Roots, source: string, table: string, o: CropOptions & { force?: boolean; dryRun?: boolean } = {}): Promise<MakeCropsResult> {
  const layout = loadLayout(layoutJson(r, source, table));
  if (layout.source_id !== source || layout.table_ref !== table) throw new Error(`layout.json names ${layout.source_id}/${layout.table_ref}, expected ${source}/${table}`);
  const crops = planCrops(layout, o);
  const warnings = crops.flatMap((c) => c.warnings.map((w) => `${c.crop_id}: ${w}`));
  // Refuse to orphan existing keyings when the crop plan changes.
  const indexPath = cropsCsv(r, source, table);
  const superseded: string[] = [];
  if (existsSync(indexPath) && !o.force) {
    const newIds = new Set(crops.map((c) => c.crop_id));
    const suffix = cropRoundSuffix(layout);
    const dropped = loadCropsCsv(indexPath).filter((c) => !newIds.has(c.crop_id))
      .filter((c) => (['A', 'B', 'R'] as const).some((w) => existsSync(keyingCsv(r, source, table, c.crop_id, w))));
    // Crops of an earlier keying round (a layout with a higher crop_round) are superseded on purpose;
    // their keying files stay on disk.
    const orphaned = dropped.filter((c) => !suffix || c.crop_id.endsWith(suffix));
    superseded.push(...dropped.filter((c) => !orphaned.includes(c)).map((c) => c.crop_id));
    if (orphaned.length) throw new Error(`the new crop plan drops crops that already have keyings (${orphaned.map((c) => c.crop_id).join(', ')}); pass --force to re-plan anyway`);
  }
  // Refuse to redraw the image of a crop that is already keyed: the keyings must stay tied to the image the
  // keyers saw. A table re-cut for a new keying round sets crop_round in layout.json (new ids).
  if (!o.force && !o.dryRun) {
    const keyed = crops.filter((c) => existsSync(cropImage(r, source, table, c.crop_id))
      && (['A', 'B', 'R'] as const).some((w) => existsSync(keyingCsv(r, source, table, c.crop_id, w))));
    if (keyed.length) throw new Error(`crops ${keyed.map((c) => c.crop_id).join(', ')} are already keyed; redrawing them would change the images their keyers saw. Set "crop_round" in layout.json to cut new crops for a new keying round, or pass --force`);
  }
  const written: string[] = [];
  if (!o.dryRun) {
    const pages = new Map<string, PageRaw>();
    for (const c of crops) {
      const p = layout.panels.find((x) => x.panel === c.panel)!;
      const k = `${p.page_seq}:${p.deskew_deg ?? 0}`;
      let page = pages.get(k);
      if (!page) { page = await loadPage(findPageImage(r, source, p.page_seq), p.deskew_deg ?? 0); pages.set(k, page); }
      const out = cropImage(r, source, table, c.crop_id);
      writeTextFile(out, await renderCrop(page, p, c));
      written.push(out);
    }
    writeTextFile(indexPath, writeCropsCsv(crops));
    written.push(indexPath);
  }
  return { crops, written, warnings, superseded };
}

export async function zoomFromFiles(r: Roots, source: string, table: string, cropId: string, key: CellKey, o: { scale?: number } = {}): Promise<Buffer> {
  const layout = loadLayout(layoutJson(r, source, table));
  const crop = loadCropsCsv(cropsCsv(r, source, table)).find((c) => c.crop_id === cropId);
  if (!crop) throw new Error(`crop ${cropId} is not in crops.csv`);
  const p = panelForCrop(layout, crop);
  const page = await loadPage(findPageImage(r, source, p.page_seq), p.deskew_deg ?? 0);
  return zoomKey(page, layout, crop, key, o);
}

export { colRange, rowRange, cropRowToCsv };

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (f: string) => args.includes(f);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--out'));
  const r = roots();
  try {
    if (pos[0] === 'zoom') {
      const [, source, table, crop, kind, col, row] = pos;
      if (!source || !table || !crop || !kind || col === undefined || row === undefined || !(KINDS as readonly string[]).includes(kind)) {
        throw new Error('usage: make-crops.ts zoom <source_id> <table_ref> <crop_id> <header|label|cell|footnote> <col> <row> [--out file.png]');
      }
      const png = await zoomFromFiles(r, source, table, crop, { kind: kind as Kind, col: Number(col), row: Number(row) });
      const out = opt('--out') ?? join(r.build, 'zoom', `${source}-${crop}-${kind}-c${col}-r${row}.png`);
      writeTextFile(out, png);
      console.log(out);
    } else {
      const [source, table] = pos;
      if (!source || !table) throw new Error('usage: make-crops.ts <source_id> <table_ref> [--force] [--dry-run]');
      const res = await makeCrops(r, source, table, { force: flag('--force'), dryRun: flag('--dry-run') });
      for (const c of res.crops) console.log(`${c.crop_id}  page ${c.page_seq}  ${c.geometry.width}×${c.geometry.height}  ×${c.geometry.scale}`);
      for (const w of res.warnings) console.warn(`warning: ${w}`);
      if (res.superseded.length) console.log(`${res.superseded.length} keyed crop(s) of an earlier round left out of crops.csv (their keyings stay on disk): ${res.superseded.join(', ')}`);
      console.log(`${res.crops.length} crop(s)${flag('--dry-run') ? ' planned (dry run)' : ` written; index ${cropsCsv(r, source, table)}`}`);
    }
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
