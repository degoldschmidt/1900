/**
 * Table layout descriptions (data/raw/<source_id>/<table_ref>/layout.json) and the crop index
 * (crops.csv). A layout is drawn once per table by a person or an agent looking at the page image.
 *
 * All coordinates are integer pixels in the page image as stored in scans/ (after the optional
 * `deskew_deg` rotation, see below). Boxes are [x, y, w, h], the same order as a IIIF region.
 *
 * {
 *   "layout_version": 1,
 *   "source_id": "ia-bradshawscontinental1914",
 *   "table_ref": "57",
 *   "table_kind": "timetable",            // or "fares" (the historian samples 10% of fare cells) or "other"
 *   "title": "Berlin – Eydtkuhnen – St Petersburg",
 *   "panels": [{                          // one panel per page region holding part of the table
 *     "panel": "p1",
 *     "page_seq": 412,                    // the manifest's page_seq (the image is scans/<source_id>/p412.<ext>)
 *     "deskew_deg": 0.3,                  // optional: rotate the page by this many degrees clockwise first
 *                                         //   (90.3 for a table printed sideways: a quarter turn plus deskew)
 *     "table_bbox":  [x, y, w, h],        // the whole table on this page
 *     "label_bbox":  [x, y, w, h],        // station-name column(s); its x-range is the label column
 *     "header_bbox": [x, y, w, h],        // header band over the train columns; its y-range is the band
 *                                         //   (above row_y[0], or within rows listed in skip_rows)
 *     "col_x": [x0, x1, …, xn],           // n+1 boundaries of the n train columns, left to right
 *     "row_y": [y0, y1, …, ym],           // m+1 boundaries of the m body rows, top to bottom
 *     "first_col": 0, "first_row": 0,     // absolute grid index of this panel's first column / row
 *     "header_y": [y0, …],                // optional: header line boundaries (header_lines + 1 values)
 *     "label_x": [x0, …],                 // optional: label sub-column boundaries (label_cols + 1 values)
 *     "header_lines": 3, "label_cols": 2, // defaults: from header_y / label_x, else 1
 *     "footnote_bbox": [x, y, w, h],      // optional: footnotes printed under this panel
 *     "notes_bbox": [x, y, w, h],         // optional: notes printed inside the train columns (vertical or boxed)
 *     "skip_rows": [3, 4, 5],             // optional: absolute body rows that are not keyed (node-only rule)
 *     "cols_per_crop": 8, "rows_per_crop": 18   // optional overrides of the crop block size
 *   }],
 *   "notes": "free text"
 * }
 *
 * Node-only transcription (PLAN.md, scope choice 1): a row listed in skip_rows keeps its absolute
 * number but is neither shown in the crops nor keyed; crops stitch the kept rows together, with an
 * orange gap where rows were left out, so row numbers jump there. Use it for intermediate halts and
 * for connection blocks (times of other trains printed above or below a table's own line).
 *
 * A table continued on another page, or printed as an upper and a lower half with further trains,
 * gets one panel per part; absolute column numbers continue (first_col), so (col, row) is unique
 * across the table. Labels repeated in a lower half keep their row numbers.
 *
 * Crops are of two kinds. A grid crop holds a block of train columns × body rows (with the label
 * column and header band). A panel with a footnote_bbox also gets one footnote crop,
 * <table_ref>-fn-<panel>, holding only that box: its crops.csv row has empty header_bbox,
 * label_bbox, col_range and row_range, and its keyers key only kind=footnote lines.
 *
 * Some guides print notes inside the train columns rather than under the table: vertical text such as
 * "Schlafwagen Berlin–Karlsbad" or "Nur Sonn- und Festtags", or boxed notes spanning several columns.
 * They are not cells of the grid. A panel with a notes_bbox (usually the whole height of its train
 * columns) gets column-notes crops <table_ref>-cn-<panel>-c<a>-<b>, one per block of columns of its
 * grid crops: the box cut to those columns, its top and bottom halves (overlapping slightly) side by
 * side under a ruler of absolute column numbers. They are keyed like footnote crops (kind=footnote,
 * col 0, one line per note) with a mark c:<n> naming the column a note stands in (KEYER_BRIEF.md).
 */
import { readFileSync } from 'node:fs';
import type { Kind } from '../keying/longcsv.ts';
import { parseCsv, writeCsv } from '../keying/csv.ts';

export type Box = [number, number, number, number];

export interface Panel {
  panel: string;
  page_seq: number;
  deskew_deg?: number;
  table_bbox: Box;
  label_bbox: Box;
  header_bbox: Box;
  col_x: number[];
  row_y: number[];
  first_col: number;
  first_row: number;
  header_y?: number[];
  label_x?: number[];
  header_lines?: number;
  label_cols?: number;
  footnote_bbox?: Box;
  notes_bbox?: Box;
  skip_rows?: number[];
  cols_per_crop?: number;
  rows_per_crop?: number;
}

export interface Layout {
  layout_version: 1;
  source_id: string;
  table_ref: string;
  table_kind?: 'timetable' | 'fares' | 'other';
  title?: string;
  panels: Panel[];
  notes?: string;
}

export const CROP_COLUMNS = ['crop_id', 'page_seq', 'table_ref', 'x', 'y', 'w', 'h', 'header_bbox', 'label_bbox', 'col_range', 'row_range'] as const;

/**
 * One line of crops.csv. Ranges are absolute and inclusive. A footnote crop (footnotes: true) has
 * body = the footnote box, empty ranges ([0, -1]) and zero-size header/label boxes.
 */
export interface CropRow {
  crop_id: string;
  page_seq: number;
  table_ref: string;
  body: Box;
  header: Box;
  label: Box;
  cols: [number, number];
  rows: [number, number];
  footnotes: boolean;
}

export const EMPTY_RANGE: [number, number] = [0, -1];
const NO_BOX: Box = [0, 0, 0, 0];

export const boxStr = (b: Box): string => b.join(',');

/** True if box a lies within box b. */
export const boxInside = (a: Box, b: Box): boolean => a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];

/** A footnote-type crop cut from the panel's notes_bbox (column notes) rather than its footnote_bbox. */
export function isNotesCrop(p: Panel, crop: Pick<CropRow, 'footnotes' | 'body'>): boolean {
  if (!crop.footnotes || !p.notes_bbox) return false;
  if (p.footnote_bbox && boxStr(p.footnote_bbox) === boxStr(crop.body)) return false;
  return boxInside(crop.body, p.notes_bbox);
}

export function parseBox(s: string, what = 'box'): Box {
  const p = s.split(',').map((v) => Number(v.trim()));
  if (p.length !== 4 || p.some((v) => !Number.isInteger(v))) throw new Error(`${what}: "${s}" is not x,y,w,h`);
  return p as Box;
}

/** [0, 7] → "c0-c7". */
export function rangeStr(prefix: 'c' | 'r', r: [number, number]): string {
  return `${prefix}${r[0]}-${prefix}${r[1]}`;
}

/** "c0-c7" (or "c0-7") → [0, 7]. */
export function parseRange(s: string, prefix: 'c' | 'r'): [number, number] {
  const m = new RegExp(`^${prefix}(\\d+)-${prefix}?(\\d+)$`).exec(s.trim());
  if (!m) throw new Error(`range "${s}" is not ${prefix}<a>-${prefix}<b>`);
  const a = Number(m[1]); const b = Number(m[2]);
  if (b < a) throw new Error(`range "${s}" ends before it starts`);
  return [a, b];
}

export const headerLines = (p: Panel): number => p.header_lines ?? (p.header_y ? p.header_y.length - 1 : 1);
export const labelCols = (p: Panel): number => p.label_cols ?? (p.label_x ? p.label_x.length - 1 : 1);
export const nCols = (p: Panel): number => p.col_x.length - 1;
export const nRows = (p: Panel): number => p.row_y.length - 1;
export const colRange = (p: Panel): [number, number] => [p.first_col, p.first_col + nCols(p) - 1];
export const rowRange = (p: Panel): [number, number] => [p.first_row, p.first_row + nRows(p) - 1];
/** True if absolute row `row` of the panel is left out (skip_rows). */
export const isSkippedRow = (p: Panel, row: number): boolean => !!p.skip_rows && p.skip_rows.includes(row);
/** The panel's keyed body rows (absolute), top to bottom. */
export function keptRows(p: Panel): number[] {
  const out: number[] = [];
  for (let r = p.first_row; r < p.first_row + nRows(p); r++) if (!isSkippedRow(p, r)) out.push(r);
  return out;
}

function isBox(v: unknown): v is Box {
  return Array.isArray(v) && v.length === 4 && v.every((n) => Number.isInteger(n)) && (v[2] as number) > 0 && (v[3] as number) > 0;
}

function increasing(a: unknown): a is number[] {
  return Array.isArray(a) && a.length >= 2 && a.every((n) => Number.isInteger(n)) && a.every((n, i) => i === 0 || n > (a[i - 1] as number));
}

/** Validates a parsed layout; returns a list of problems (empty when valid). */
export function validateLayout(l: unknown, imageSizes?: Map<number, { width: number; height: number }>): string[] {
  const errs: string[] = [];
  const L = l as Partial<Layout>;
  if (!L || typeof L !== 'object') return ['layout is not an object'];
  if (L.layout_version !== 1) errs.push('layout_version must be 1');
  if (typeof L.source_id !== 'string' || !L.source_id) errs.push('source_id missing');
  if (typeof L.table_ref !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._~-]*$/.test(L.table_ref)) errs.push('table_ref missing or not filename-safe');
  if (L.table_kind !== undefined && !['timetable', 'fares', 'other'].includes(L.table_kind)) errs.push('table_kind must be timetable|fares|other');
  if (!Array.isArray(L.panels) || L.panels.length === 0) { errs.push('panels must be a non-empty array'); return errs; }
  const names = new Set<string>();
  L.panels.forEach((p, i) => {
    const w = `panel ${i} (${p?.panel ?? '?'})`;
    if (typeof p.panel !== 'string' || !p.panel) errs.push(`${w}: panel name missing`);
    else if (names.has(p.panel)) errs.push(`${w}: duplicate panel name`);
    else names.add(p.panel);
    if (!Number.isInteger(p.page_seq) || p.page_seq < 1) errs.push(`${w}: page_seq must be a positive integer`);
    for (const k of ['table_bbox', 'label_bbox', 'header_bbox'] as const) if (!isBox(p[k])) errs.push(`${w}: ${k} must be [x,y,w,h] integers with w,h > 0`);
    if (p.footnote_bbox !== undefined && !isBox(p.footnote_bbox)) errs.push(`${w}: footnote_bbox must be [x,y,w,h]`);
    if (p.notes_bbox !== undefined && !isBox(p.notes_bbox)) errs.push(`${w}: notes_bbox must be [x,y,w,h]`);
    if (p.notes_bbox && p.footnote_bbox && boxStr(p.notes_bbox) === boxStr(p.footnote_bbox)) errs.push(`${w}: notes_bbox and footnote_bbox must differ`);
    if (!increasing(p.col_x)) errs.push(`${w}: col_x must be at least 2 strictly increasing integers`);
    if (!increasing(p.row_y)) errs.push(`${w}: row_y must be at least 2 strictly increasing integers`);
    if (!Number.isInteger(p.first_col) || p.first_col < 0) errs.push(`${w}: first_col must be a non-negative integer`);
    if (!Number.isInteger(p.first_row) || p.first_row < 0) errs.push(`${w}: first_row must be a non-negative integer`);
    if (p.header_y !== undefined && !increasing(p.header_y)) errs.push(`${w}: header_y must be strictly increasing integers`);
    if (p.label_x !== undefined && !increasing(p.label_x)) errs.push(`${w}: label_x must be strictly increasing integers`);
    if (p.header_y && p.header_lines !== undefined && p.header_lines !== p.header_y.length - 1) errs.push(`${w}: header_lines disagrees with header_y`);
    if (p.label_x && p.label_cols !== undefined && p.label_cols !== p.label_x.length - 1) errs.push(`${w}: label_cols disagrees with label_x`);
    if (p.deskew_deg !== undefined && (typeof p.deskew_deg !== 'number' || !Number.isFinite(p.deskew_deg) || Math.abs(p.deskew_deg - 90 * Math.round(p.deskew_deg / 90)) > 10 || Math.abs(p.deskew_deg) > 280)) {
      errs.push(`${w}: deskew_deg must be within ±10 of 0, 90, 180 or 270 (a table printed sideways is turned a quarter turn first)`);
    }
    if (p.skip_rows !== undefined) {
      const sr = p.skip_rows as unknown;
      if (!Array.isArray(sr) || !sr.every((n) => Number.isInteger(n))) errs.push(`${w}: skip_rows must be a list of integers`);
      else if (new Set(sr).size !== sr.length) errs.push(`${w}: skip_rows lists a row twice`);
      else if (Array.isArray(p.row_y) && Number.isInteger(p.first_row)) {
        const last = p.first_row + p.row_y.length - 2;
        const out = (sr as number[]).filter((r) => r < p.first_row || r > last);
        if (out.length) errs.push(`${w}: skip_rows ${out.join(', ')} outside the panel's rows r${p.first_row}-r${last}`);
        else if (sr.length >= p.row_y.length - 1) errs.push(`${w}: skip_rows leaves no row to key`);
      }
    }
    for (const k of ['cols_per_crop', 'rows_per_crop'] as const) {
      const v = p[k];
      if (v !== undefined && (!Number.isInteger(v) || v < 1)) errs.push(`${w}: ${k} must be a positive integer`);
    }
    if (errs.length) return;
    const lb = p.label_bbox; const hb = p.header_bbox;
    const colStart = p.col_x[0]!; const colEnd = p.col_x[p.col_x.length - 1]!;
    if (lb[0] < colEnd - 2 && lb[0] + lb[2] > colStart + 2) errs.push(`${w}: label_bbox overlaps the train columns`);
    // The header band lies above the first body row, or inside rows left out by skip_rows (a table whose
    // own first stop is printed above its header band, among connection blocks).
    for (let i = 0; i < p.row_y.length - 1; i++) {
      if (isSkippedRow(p, p.first_row + i)) continue;
      if (p.row_y[i]! < hb[1] + hb[3] - 2 && p.row_y[i + 1]! > hb[1] + 2) { errs.push(`${w}: header_bbox overlaps body row r${p.first_row + i}; it must lie above the first row or within skipped rows`); break; }
    }
    if (p.header_y && (p.header_y[0]! < hb[1] - 2 || p.header_y[p.header_y.length - 1]! > hb[1] + hb[3] + 2)) errs.push(`${w}: header_y lies outside header_bbox`);
    if (p.label_x && (p.label_x[0]! < lb[0] - 2 || p.label_x[p.label_x.length - 1]! > lb[0] + lb[2] + 2)) errs.push(`${w}: label_x lies outside label_bbox`);
    const size = imageSizes?.get(p.page_seq);
    if (size) {
      const boxes: Box[] = [p.table_bbox, p.label_bbox, p.header_bbox, ...(p.footnote_bbox ? [p.footnote_bbox] : []), ...(p.notes_bbox ? [p.notes_bbox] : [])];
      for (const b of boxes) if (b[0] < 0 || b[1] < 0 || b[0] + b[2] > size.width || b[1] + b[3] > size.height) errs.push(`${w}: box ${boxStr(b)} outside the ${size.width}×${size.height} page`);
      if (p.col_x[p.col_x.length - 1]! > size.width || p.row_y[p.row_y.length - 1]! > size.height) errs.push(`${w}: grid extends outside the page`);
    }
  });
  if (errs.length) return errs;
  // Absolute cell ranges of panels must not overlap.
  const ps = L.panels as Panel[];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i]!; const b = ps[j]!;
    const [ac0, ac1] = colRange(a); const [bc0, bc1] = colRange(b);
    const [ar0, ar1] = rowRange(a); const [br0, br1] = rowRange(b);
    if (ac0 <= bc1 && bc0 <= ac1 && ar0 <= br1 && br0 <= ar1) errs.push(`panels ${a.panel} and ${b.panel} cover the same absolute cells`);
  }
  return errs;
}

export function parseLayout(text: string, file = 'layout.json'): Layout {
  let l: unknown;
  try { l = JSON.parse(text); } catch (e) { throw new Error(`${file}: ${(e as Error).message}`); }
  const errs = validateLayout(l);
  if (errs.length) throw new Error(`${file}: invalid layout:\n  ${errs.join('\n  ')}`);
  return l as Layout;
}

export function loadLayout(path: string): Layout {
  return parseLayout(readFileSync(path, 'utf8'), path);
}

// ---------------------------------------------------------------- crop index

export function cropRowToCsv(c: CropRow): Record<string, string> {
  return {
    crop_id: c.crop_id, page_seq: String(c.page_seq), table_ref: c.table_ref,
    x: String(c.body[0]), y: String(c.body[1]), w: String(c.body[2]), h: String(c.body[3]),
    header_bbox: c.footnotes ? '' : boxStr(c.header), label_bbox: c.footnotes ? '' : boxStr(c.label),
    col_range: c.footnotes ? '' : rangeStr('c', c.cols), row_range: c.footnotes ? '' : rangeStr('r', c.rows),
  };
}

export function writeCropsCsv(rows: readonly CropRow[]): string {
  return writeCsv(CROP_COLUMNS, rows.map(cropRowToCsv));
}

export function parseCropsCsv(text: string, file = 'crops.csv'): CropRow[] {
  const t = parseCsv(text, { file, required: CROP_COLUMNS });
  return t.rows.map((r, i) => {
    const where = `${file} row ${i + 2}`;
    const num = (k: string) => { const v = Number(r[k]); if (!Number.isInteger(v)) throw new Error(`${where}: ${k} is not an integer`); return v; };
    const body: Box = [num('x'), num('y'), num('w'), num('h')];
    if (!r.col_range && !r.row_range) {
      return { crop_id: r.crop_id!, page_seq: num('page_seq'), table_ref: r.table_ref!, body, header: NO_BOX, label: NO_BOX, cols: EMPTY_RANGE, rows: EMPTY_RANGE, footnotes: true };
    }
    return {
      crop_id: r.crop_id!, page_seq: num('page_seq'), table_ref: r.table_ref!, body,
      header: parseBox(r.header_bbox!, `${where} header_bbox`), label: parseBox(r.label_bbox!, `${where} label_bbox`),
      cols: parseRange(r.col_range!, 'c'), rows: parseRange(r.row_range!, 'r'), footnotes: false,
    };
  });
}

export function loadCropsCsv(path: string): CropRow[] {
  return parseCropsCsv(readFileSync(path, 'utf8'), path);
}

/** The panel a crop was cut from (same page; ranges inside the panel's, or its footnote box). */
export function panelForCrop(layout: Layout, crop: Pick<CropRow, 'page_seq' | 'cols' | 'rows' | 'crop_id' | 'footnotes' | 'body'>): Panel {
  const p = layout.panels.find((p) => {
    if (p.page_seq !== crop.page_seq) return false;
    if (crop.footnotes) return (!!p.footnote_bbox && boxStr(p.footnote_bbox) === boxStr(crop.body)) || (!!p.notes_bbox && boxInside(crop.body, p.notes_bbox));
    const [c0, c1] = colRange(p); const [r0, r1] = rowRange(p);
    return crop.cols[0] >= c0 && crop.cols[1] <= c1 && crop.rows[0] >= r0 && crop.rows[1] <= r1;
  });
  if (!p) throw new Error(`crop ${crop.crop_id}: no panel of ${layout.table_ref} on page ${crop.page_seq} covers its ranges`);
  return p;
}

export interface CellKey { kind: Kind; col: number; row: number }

/** Every (kind, col, row) a keyer must produce for a crop, footnotes excepted (their count varies). */
export function expectedKeys(layout: Layout, crop: CropRow): CellKey[] {
  if (crop.footnotes) return [];
  const p = panelForCrop(layout, crop);
  const out: CellKey[] = [];
  for (let h = 0; h < headerLines(p); h++) for (let c = crop.cols[0]; c <= crop.cols[1]; c++) out.push({ kind: 'header', col: c, row: h });
  for (let r = crop.rows[0]; r <= crop.rows[1]; r++) {
    if (isSkippedRow(p, r)) continue;
    for (let s = 0; s < labelCols(p); s++) out.push({ kind: 'label', col: s, row: r });
    for (let c = crop.cols[0]; c <= crop.cols[1]; c++) out.push({ kind: 'cell', col: c, row: r });
  }
  return out;
}

/** True if the key belongs to the crop: grid crops hold header, label and cell keys; footnote crops only footnotes. */
export function keyInCrop(layout: Layout, crop: CropRow, k: CellKey): boolean {
  if (crop.footnotes) return k.kind === 'footnote' && k.col === 0;
  if (k.kind === 'footnote') return false;
  const p = panelForCrop(layout, crop);
  const inCols = k.col >= crop.cols[0] && k.col <= crop.cols[1];
  const inRows = k.row >= crop.rows[0] && k.row <= crop.rows[1] && !isSkippedRow(p, k.row);
  switch (k.kind) {
    case 'cell': return inCols && inRows;
    case 'header': return inCols && k.row < headerLines(p);
    case 'label': return inRows && k.col < labelCols(p);
  }
}

/** The page-pixel box of one keyed item (no margin). */
export function keyBox(layout: Layout, crop: CropRow, k: CellKey): Box {
  const p = panelForCrop(layout, crop);
  const ci = k.col - p.first_col; const ri = k.row - p.first_row;
  const colSpan = (): [number, number] => [p.col_x[ci]!, p.col_x[ci + 1]!];
  const rowSpan = (): [number, number] => [p.row_y[ri]!, p.row_y[ri + 1]!];
  const box = (x: [number, number], y: [number, number]): Box => [x[0], y[0], x[1] - x[0], y[1] - y[0]];
  switch (k.kind) {
    case 'cell':
      if (ci < 0 || ci >= nCols(p) || ri < 0 || ri >= nRows(p)) throw new Error(`cell c${k.col} r${k.row} is outside panel ${p.panel}`);
      return box(colSpan(), rowSpan());
    case 'header': {
      if (ci < 0 || ci >= nCols(p)) throw new Error(`header column ${k.col} is outside panel ${p.panel}`);
      const hb = p.header_bbox;
      const y: [number, number] = p.header_y && k.row < p.header_y.length - 1 ? [p.header_y[k.row]!, p.header_y[k.row + 1]!] : [hb[1], hb[1] + hb[3]];
      return box(colSpan(), y);
    }
    case 'label': {
      if (ri < 0 || ri >= nRows(p)) throw new Error(`label row ${k.row} is outside panel ${p.panel}`);
      const lb = p.label_bbox;
      const x: [number, number] = p.label_x && k.col < p.label_x.length - 1 ? [p.label_x[k.col]!, p.label_x[k.col + 1]!] : [lb[0], lb[0] + lb[2]];
      return box(x, rowSpan());
    }
    case 'footnote':
      if (crop.footnotes && isNotesCrop(p, crop)) return crop.body;
      if (!p.footnote_bbox) throw new Error(`panel ${p.panel} has no footnote_bbox`);
      return p.footnote_bbox;
  }
}
