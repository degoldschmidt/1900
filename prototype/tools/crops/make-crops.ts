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
 * A thin orange gap marks where the parts were stitched together.
 *
 * Block size: 6–8 columns × 12–18 rows, the largest that can be magnified at least 2× (at most 3×)
 * with the long side ≤ 1500 px. A very high-resolution scan may get less than 2× (warned).
 *
 * A panel with a footnote_bbox also gets a footnote crop <table_ref>-fn-<panel> (the box alone,
 * magnified up to 3×, under a caption), keyed as kind=footnote lines.
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
  colRange, cropRowToCsv, headerLines, keyBox, labelCols, loadCropsCsv, loadLayout, nCols, nRows, panelForCrop, rowRange,
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
}

const DEFAULTS = { maxLong: 1500, minScale: 2, maxScale: 3, cols: [6, 8] as [number, number], rows: [12, 18] as [number, number] };

/** Fixed ruler and gap sizes in output pixels. */
export const RULER = { left: 52, top: 26, gap: 6 } as const;

export interface Rect { x: number; y: number; w: number; h: number }

export interface Geometry {
  scale: number;
  width: number;
  height: number;
  /** Page boxes of the four parts. */
  page: { corner: Box; header: Box; label: Box; body: Box };
  /** Output rectangles of the four parts. */
  out: { corner: Rect; header: Rect; label: Rect; body: Rect };
}

export interface PlannedCrop extends CropRow {
  panel: string;
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

function pageBoxes(p: Panel, cols: [number, number], rows: [number, number]) {
  const ci0 = cols[0] - p.first_col; const ci1 = cols[1] - p.first_col;
  const ri0 = rows[0] - p.first_row; const ri1 = rows[1] - p.first_row;
  const bx = p.col_x[ci0]!; const by = p.row_y[ri0]!;
  const body: Box = [bx, by, p.col_x[ci1 + 1]! - bx, p.row_y[ri1 + 1]! - by];
  const hb = p.header_bbox; const lb = p.label_bbox;
  return {
    body,
    header: [body[0], hb[1], body[2], hb[3]] as Box,
    label: [lb[0], body[1], lb[2], body[3]] as Box,
    corner: [lb[0], hb[1], lb[2], hb[3]] as Box,
  };
}

/** The scale that fits the composite in maxLong, capped at maxScale (floored to 1/100). */
export function fitScale(labelW: number, bodyW: number, headerH: number, bodyH: number, o: { maxLong: number; maxScale: number }): number {
  const sw = (o.maxLong - RULER.left - RULER.gap) / (labelW + bodyW);
  const sh = (o.maxLong - RULER.top - RULER.gap) / (headerH + bodyH);
  return Math.floor(Math.min(o.maxScale, sw, sh) * 100) / 100;
}

export function geometry(p: Panel, cols: [number, number], rows: [number, number], scale: number): Geometry {
  const b = pageBoxes(p, cols, rows);
  const s = scale;
  const Lw = Math.round(b.label[2] * s); const Bw = Math.round(b.body[2] * s);
  const Hh = Math.round(b.header[3] * s); const Bh = Math.round(b.body[3] * s);
  const x0 = RULER.left; const x1 = x0 + Lw + RULER.gap;
  const y0 = RULER.top; const y1 = y0 + Hh + RULER.gap;
  return {
    scale: s,
    width: x1 + Bw,
    height: y1 + Bh,
    page: b,
    out: {
      corner: { x: x0, y: y0, w: Lw, h: Hh },
      header: { x: x1, y: y0, w: Bw, h: Hh },
      label: { x: x0, y: y1, w: Lw, h: Bh },
      body: { x: x1, y: y1, w: Bw, h: Bh },
    },
  };
}

/** Plans the crops of one layout (pure: no image access). */
export function planCrops(layout: Layout, opts: CropOptions = {}): PlannedCrop[] {
  const o = { ...DEFAULTS, ...opts };
  const out: PlannedCrop[] = [];
  for (const p of layout.panels) {
    const n = nCols(p); const m = nRows(p);
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
        const b = pageBoxes(p, [cc[0] + p.first_col, cc[1] + p.first_col], [rr[0] + p.first_row, rr[1] + p.first_row]);
        minS = Math.min(minS, fitScale(b.label[2], b.body[2], b.header[3], b.body[3], o));
      }
      if (!best || minS > best.minS + 1e-9) best = { cb, rb, minS };
      if (minS >= o.minScale) { best = { cb, rb, minS }; break; }
    }
    const { cb, rb } = best!;
    for (const rr of rb) for (const cc of cb) {
      const cols: [number, number] = [cc[0] + p.first_col, cc[1] + p.first_col];
      const rows: [number, number] = [rr[0] + p.first_row, rr[1] + p.first_row];
      const b = pageBoxes(p, cols, rows);
      const s = fitScale(b.label[2], b.body[2], b.header[3], b.body[3], o);
      const warnings: string[] = [];
      if (s < o.minScale) warnings.push(`magnification ${s}× is below ${o.minScale}× (the scan is large or the block cannot shrink further)`);
      if (s <= 0) throw new Error(`panel ${p.panel}: crop cannot fit in ${o.maxLong} px`);
      out.push({
        crop_id: `${layout.table_ref}-c${cols[0]}-${cols[1]}-r${rows[0]}-${rows[1]}`,
        page_seq: p.page_seq, table_ref: layout.table_ref,
        body: b.body, header: b.header, label: b.label, cols, rows,
        panel: p.panel, geometry: geometry(p, cols, rows, s), warnings, footnotes: false,
      });
    }
    if (p.footnote_bbox) out.push(planFootnoteCrop(layout, p, o));
  }
  return out;
}

const ZERO: Rect = { x: 0, y: 0, w: 0, h: 0 };
const NO_BOX: Box = [0, 0, 0, 0];

/** The footnote box of a panel as its own crop, under a one-line caption. */
function planFootnoteCrop(layout: Layout, p: Panel, o: { maxLong: number; maxScale: number }): PlannedCrop {
  const fb = p.footnote_bbox!;
  const s = Math.floor(Math.min(o.maxScale, o.maxLong / fb[2], (o.maxLong - RULER.top) / fb[3]) * 100) / 100;
  const w = Math.round(fb[2] * s); const h = Math.round(fb[3] * s);
  return {
    crop_id: `${layout.table_ref}-fn-${p.panel}`, page_seq: p.page_seq, table_ref: layout.table_ref,
    body: fb, header: NO_BOX, label: NO_BOX, cols: [0, -1], rows: [0, -1], footnotes: true, panel: p.panel, warnings: [],
    geometry: {
      scale: s, width: Math.max(w, 420), height: RULER.top + h,
      page: { corner: NO_BOX, header: NO_BOX, label: NO_BOX, body: fb },
      out: { corner: ZERO, header: ZERO, label: ZERO, body: { x: 0, y: RULER.top, w, h } },
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

const RED = '#b00020';

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
  // Row indices left of the label column.
  for (let r = crop.rows[0]; r <= crop.rows[1]; r++) {
    const i = r - p.first_row;
    const ya = ob.y + (p.row_y[i]! - pb[1]) * s; const yb = ob.y + (p.row_y[i + 1]! - pb[1]) * s;
    const size = Math.max(8, Math.min(14, (yb - ya) * 0.6));
    parts.push(svgText(RULER.left - 6, (ya + yb) / 2, `r${r}`, size, 'end'));
    tick(RULER.left - 4, ya, RULER.left - 1, ya);
    if (r === crop.rows[1]) tick(RULER.left - 4, yb, RULER.left - 1, yb);
  }
  // Header lines.
  const oh = g.out.header; const hb = p.header_bbox;
  if (p.header_y) {
    for (let h = 0; h < p.header_y.length - 1; h++) {
      const ya = oh.y + (p.header_y[h]! - hb[1]) * s; const yb = oh.y + (p.header_y[h + 1]! - hb[1]) * s;
      parts.push(svgText(RULER.left - 6, (ya + yb) / 2, `h${h}`, Math.max(8, Math.min(13, (yb - ya) * 0.6)), 'end'));
    }
  } else {
    parts.push(svgText(RULER.left - 6, oh.y + oh.h / 2, headerLines(p) === 1 ? 'h0' : `h0-${headerLines(p) - 1}`, 11, 'end'));
  }
  // Label sub-columns.
  const ol = g.out.label; const lb = p.label_bbox;
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}">${parts.join('')}</svg>`;
}

function footnoteCaptionSvg(g: Geometry): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}" height="${g.height}">${svgText(6, RULER.top / 2, 'footnotes: key each line as kind=footnote, col 0, row 0, 1, 2 … top to bottom', 12, 'start')}</svg>`;
}

/** Renders one planned crop to PNG. */
export async function renderCrop(page: PageRaw, p: Panel, crop: PlannedCrop): Promise<Buffer> {
  const g = crop.geometry;
  const layers: OverlayOptions[] = [];
  for (const part of ['corner', 'header', 'label', 'body'] as const) {
    const r = g.out[part];
    if (r.w <= 0 || r.h <= 0) continue;
    const img = await cutScaled(page, g.page[part], g.scale, r.w, r.h);
    layers.push({ input: img.data, raw: { width: img.width, height: img.height, channels: 3 }, left: r.x, top: r.y });
  }
  layers.push({ input: Buffer.from(crop.footnotes ? footnoteCaptionSvg(g) : rulerSvg(p, crop, g)), left: 0, top: 0 });
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
  const W = Math.max(1, Math.round(padded[2] * s)); const H = Math.max(1, Math.round(padded[3] * s));
  const img = await cutScaled(page, padded, s, W, H);
  const rx = mx * s; const ry = my * s;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${(box[2] * s).toFixed(1)}" height="${(box[3] * s).toFixed(1)}" fill="none" stroke="${RED}" stroke-width="2" opacity="0.55"/></svg>`;
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

export interface MakeCropsResult { crops: PlannedCrop[]; written: string[]; warnings: string[] }

/** Plans and renders every crop of a table and writes crops.csv. */
export async function makeCrops(r: Roots, source: string, table: string, o: CropOptions & { force?: boolean; dryRun?: boolean } = {}): Promise<MakeCropsResult> {
  const layout = loadLayout(layoutJson(r, source, table));
  if (layout.source_id !== source || layout.table_ref !== table) throw new Error(`layout.json names ${layout.source_id}/${layout.table_ref}, expected ${source}/${table}`);
  const crops = planCrops(layout, o);
  const warnings = crops.flatMap((c) => c.warnings.map((w) => `${c.crop_id}: ${w}`));
  // Refuse to orphan existing keyings when the crop plan changes.
  const indexPath = cropsCsv(r, source, table);
  if (existsSync(indexPath) && !o.force) {
    const newIds = new Set(crops.map((c) => c.crop_id));
    const orphaned = loadCropsCsv(indexPath).filter((c) => !newIds.has(c.crop_id))
      .filter((c) => (['A', 'B', 'R'] as const).some((w) => existsSync(keyingCsv(r, source, table, c.crop_id, w))));
    if (orphaned.length) throw new Error(`the new crop plan drops crops that already have keyings (${orphaned.map((c) => c.crop_id).join(', ')}); pass --force to re-plan anyway`);
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
  return { crops, written, warnings };
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
      console.log(`${res.crops.length} crop(s)${flag('--dry-run') ? ' planned (dry run)' : ` written; index ${cropsCsv(r, source, table)}`}`);
    }
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
