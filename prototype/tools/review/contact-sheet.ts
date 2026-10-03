/**
 * Contact sheets: many sampled cells on one image, for a blind re-reading with few image requests
 * (PLAN.md addendum of 3 Oct 2026, 18:01 UTC; tools/keying/HISTORIAN_BRIEF.md, "Contact sheets").
 *
 *   node tools/review/contact-sheet.ts --sample <label> [--per-sheet 16] [--filter-tables 12,13,23] [--out <dir>] [--plain] [--context 1]
 *
 * Reads data/review/sample-<label>.csv (tools/keying/sample.ts draw) and lays its cells out as
 * numbered tiles, up to 16 per sheet (4×4). A tile is the cell cut from its page scan at page_region
 * (the panel's deskew applied, as for the crops), with context around it, magnified 2× to 4×
 * (make-crops.ts renderZoom, the code of the resolver and sample zooms): the cell is at full contrast
 * with red ticks outside the image at its four edges, the context is washed pale (except a strip round
 * the cell, where an underline may sit below the row line or a sign across a column rule: make-crops.ts
 * WASH_CLEAR), and nothing is drawn on the print (an outline would sit where an underline is printed). A band over the image carries a
 * large tile number, running through the run's sheets, and the cell's key (table · c<col> · r<row>).
 * A tile NEVER carries a transcription: only the location fields of a sample row are read (never
 * reread_*, note or any keying file), so neither the resolved reading nor an earlier re-reading can
 * reach a sheet.
 *
 * Sheets stay at or under 1500 px on the long side (8-bit palette PNG, under 1 MB for a full sheet of
 * 300 dpi scans). When some cell cannot be shown at 2× or more in
 * a 4×4 grid (with less context if need be), the whole run uses a grid with fewer tiles (3×5, 3×4,
 * 3×3 …, never a lopsided one such as 2×8), so every tile stays legible; a cell that cannot be shown
 * at 2× even alone is an error.
 *
 * Output, by default in build/review/sample-<label>/ (with --filter-tables in its sub-folder
 * tables-<t>-<t>…, so the runs of two reviewers split by table do not overwrite each other; --out
 * names another folder):
 *   sheet-01.png, sheet-02.png, …   the sheets (earlier sheet-NN.png and sheets.csv there are removed)
 *   sheets.csv   sheet, tile, file, sample_id, source_id, table_ref, page_seq, kind, col, row, scale:
 *                the sample row each numbered tile shows, and its magnification
 *
 * --plain leaves the print untouched (no wash; the ticks still mark the cell) and --context k shows k
 * times the usual context: for adjudicating a disagreement, where the rows and columns around a cell
 * (a rule above it, a sign beside it) matter as much as the cell.
 *
 * Tiles are built from a list of TileItem, so a resolver packet can later become a second input.
 *
 * A sample whose cells include a current sign example (build/brief/signs/examples.csv) is refused: the
 * brief shows that cell named with its sign, so the reading would not be blind (P-E021). Cutting the
 * examples again (tools/keying/sign-examples.ts) skips every sampled cell.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import type { OverlayOptions } from 'sharp';
import { readCsvFile, writeCsv, writeTextFile, type CsvRow } from '../keying/csv.ts';
import { KINDS, type Kind } from '../keying/longcsv.ts';
import { assertSafeId, cropsCsv, layoutJson, roots, type Roots } from '../keying/paths.ts';
import { SAMPLE_COLUMNS } from '../keying/sample.ts';
import { exampleOverlap } from '../keying/sign-examples.ts';
import { boxStr, keyBox, loadCropsCsv, loadLayout, panelForCrop, panelForKey, parseBox, type Box, type CropRow, type Layout } from '../crops/layout.ts';
import { findPageImage, loadPage, RED, renderZoom } from '../crops/make-crops.ts';

/** One cell to show on a tile: where it is, never what it says. */
export interface TileItem {
  /** The sample row the tile stands for. */
  sample_id: string;
  source_id: string;
  table_ref: string;
  page_seq: number;
  crop_id: string;
  kind: Kind;
  col: number;
  row: number;
  /** The cell's box in the page image as the layout reads it (after the panel's deskew): x, y, w, h. */
  region: Box;
}

export const SHEET_COLUMNS = ['sheet', 'tile', 'file', 'sample_id', 'source_id', 'table_ref', 'page_seq', 'kind', 'col', 'row', 'scale'] as const;

export interface SheetOptions {
  /** Long side of a sheet, px. */
  maxLong: number;
  /** Least magnification of a tile (output px per page px). */
  minScale: number;
  maxScale: number;
  /** Most tiles per sheet. */
  perSheet: number;
  /** `wash` (default: the context pale, for blind readers) or `plain` (the print untouched, for adjudicating a disagreement). */
  mark: 'wash' | 'plain';
  /** Multiplies the context round each cell (CONTEXT): 2 shows about twice as much of the neighbouring rows and columns. */
  context: number;
}

export const SHEET_DEFAULTS: SheetOptions = { maxLong: 1500, minScale: 2, maxScale: 4, perSheet: 16, mark: 'wash', context: 1 };

/** Fixed sizes in output px: sheet padding, gap between tiles, label band, tick frame round the image, least tile width (for the band). */
export const TILE = { pad: 10, gap: 12, band: 46, frame: 12, minWidth: 220 } as const;

/**
 * Context round the cell, in fractions of its width (x) and height (y) on each side, at least minPx
 * page px. Spare height in the tile shows more of the rows above and below, up to yMax of a row.
 */
export const CONTEXT = { x: 0.35, y: 0.35, yMax: 1, minPx: 8 } as const;

const FONT = 'DejaVu Sans, Liberation Sans, sans-serif';
const NUMBER_PX = 34;

export interface TileFit {
  /** Context margins in page px. */
  mx: number; my: number;
  s: number;
  /** Size of the tile's image, px. */
  W: number; H: number;
}

const floor2 = (v: number) => Math.floor(v * 100) / 100;

/**
 * Margins and magnification that show a w×h cell (page px) in an areaW×areaH image area: the default
 * context if the cell then still gets minScale, less context if that is what it takes, null if even
 * the least context leaves it below minScale.
 */
export function fitTile(w: number, h: number, areaW: number, areaH: number, o: Pick<SheetOptions, 'minScale' | 'maxScale'> & { context?: number } = SHEET_DEFAULTS): TileFit | null {
  if (areaW <= 0 || areaH <= 0) return null;
  const k = o.context ?? 1;
  const scale = (mx: number, my: number) => floor2(Math.min(o.maxScale, areaW / (w + 2 * mx), areaH / (h + 2 * my)));
  let mx = Math.max(CONTEXT.minPx, Math.round(k * CONTEXT.x * w));
  let my = Math.max(CONTEXT.minPx, Math.round(k * CONTEXT.y * h));
  let s = scale(mx, my);
  if (s < o.minScale) {
    mx = Math.max(CONTEXT.minPx, Math.min(mx, Math.floor((areaW / o.minScale - w) / 2)));
    my = Math.max(CONTEXT.minPx, Math.min(my, Math.floor((areaH / o.minScale - h) / 2)));
    s = scale(mx, my);
    if (s < o.minScale) return null;
  }
  my = Math.max(my, Math.min(Math.round(k * CONTEXT.yMax * h), Math.floor((areaH / s - h) / 2)));
  return { mx, my, s, W: Math.max(1, Math.round((w + 2 * mx) * s)), H: Math.max(1, Math.round((h + 2 * my) * s)) };
}

export interface Grid { cols: number; rows: number; tileW: number; tileH: number; areaW: number; areaH: number }

function gridOf(cols: number, rows: number, maxLong: number): Grid {
  const tileW = Math.floor((maxLong - 2 * TILE.pad - (cols - 1) * TILE.gap) / cols);
  const tileH = Math.floor((maxLong - 2 * TILE.pad - (rows - 1) * TILE.gap) / rows);
  return { cols, rows, tileW, tileH, areaW: tileW - 2 * TILE.frame, areaH: tileH - TILE.band - 2 * TILE.frame };
}

/**
 * The grid of a run, among near-square ones (columns and rows differ by at most 2: 4×4, then 3×5 or
 * 5×3, 3×4 or 4×3, 3×3 …): the most tiles per sheet (at most perSheet, and no more than there are
 * cells) at which every cell is shown at minScale or more; among those, the largest least
 * magnification, then the squarest grid.
 */
export function chooseGrid(sizes: ReadonlyArray<readonly [number, number]>, o: SheetOptions): { grid: Grid; fits: TileFit[] } {
  let best: { grid: Grid; fits: TileFit[]; count: number; minS: number } | null = null;
  for (let cols = 1; cols <= o.perSheet; cols++) {
    for (let rows = Math.max(1, cols - 2); rows <= cols + 2 && cols * rows <= o.perSheet; rows++) {
      const grid = gridOf(cols, rows, o.maxLong);
      if (grid.tileW < TILE.minWidth) continue;
      const fits: TileFit[] = [];
      for (const [w, h] of sizes) { const f = fitTile(w, h, grid.areaW, grid.areaH, o); if (!f) break; fits.push(f); }
      if (fits.length < sizes.length) continue;
      const count = Math.min(cols * rows, sizes.length);
      const minS = fits.reduce((m, f) => Math.min(m, f.s), Infinity);
      const squarer = () => Math.abs(cols - rows) < Math.abs(best!.grid.cols - best!.grid.rows);
      if (!best || count > best.count || (count === best.count && (minS > best.minS || (minS === best.minS && squarer())))) best = { grid, fits, count, minS };
    }
  }
  if (!best) throw new Error(`a cell cannot be shown at ${o.minScale}× within ${o.maxLong} px, even alone on a sheet`);
  return { grid: best.grid, fits: best.fits };
}

/** The key drawn on a tile: the table, then column and row as the crops' rulers name them. */
export function keyText(it: Pick<TileItem, 'table_ref' | 'kind' | 'col' | 'row'>): string {
  const at = it.kind === 'cell' ? `c${it.col} · r${it.row}` : it.kind === 'header' ? `c${it.col} · h${it.row}` : it.kind === 'label' ? `L${it.col} · r${it.row}` : `note ${it.row}`;
  return `table ${it.table_ref} · ${at}`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One tile's frame, band, number, key and edge ticks (SVG), for a tile box at (x, y) and its image at (ix, iy). */
function tileSvg(x: number, y: number, w: number, h: number, number: string, key: string, ix: number, iy: number, it: TileItem, f: TileFit): string {
  const numW = Math.ceil(number.length * 0.7 * NUMBER_PX);
  const keyX = x + 10 + numW + 12;
  const keyPx = Math.max(11, Math.min(20, Math.floor((x + w - 8 - keyX) / (0.68 * key.length))));
  const cx0 = ix + f.mx * f.s; const cx1 = cx0 + it.region[2] * f.s;
  const cy0 = iy + f.my * f.s; const cy1 = cy0 + it.region[3] * f.s;
  const L = TILE.frame - 4;
  const line = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${RED}" stroke-width="3"/>`;
  const ticks = [
    line(cx0, iy - 2 - L, cx0, iy - 2), line(cx1, iy - 2 - L, cx1, iy - 2),
    line(cx0, iy + f.H + 2, cx0, iy + f.H + 2 + L), line(cx1, iy + f.H + 2, cx1, iy + f.H + 2 + L),
    line(ix - 2 - L, cy0, ix - 2, cy0), line(ix - 2 - L, cy1, ix - 2, cy1),
    line(ix + f.W + 2, cy0, ix + f.W + 2 + L, cy0), line(ix + f.W + 2, cy1, ix + f.W + 2 + L, cy1),
  ];
  return `<rect x="${x}" y="${y}" width="${w}" height="${TILE.band}" fill="#eeeeee"/>`
    + `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" fill="none" stroke="#8a8a8a" stroke-width="1"/>`
    + `<text x="${x + 10}" y="${y + TILE.band / 2}" font-family="${FONT}" font-size="${NUMBER_PX}" font-weight="bold" fill="${RED}" dominant-baseline="central">${esc(number)}</text>`
    + `<text x="${keyX}" y="${y + TILE.band / 2}" font-family="${FONT}" font-size="${keyPx}" font-weight="bold" fill="#222222" dominant-baseline="central">${esc(key)}</text>`
    + ticks.join('');
}

/** The cells of a sample file, in file order: only where to look, never a reading. */
export function itemsFromSample(r: Roots, label: string, tables?: readonly string[]): TileItem[] {
  const path = join(r.data, 'review', `sample-${assertSafeId('label', label)}.csv`);
  const t = readCsvFile(path, SAMPLE_COLUMNS);
  if (tables) {
    const have = new Set(t.rows.map((x) => x.table_ref));
    const missing = tables.filter((x) => !have.has(x));
    if (missing.length) throw new Error(`${path} has no rows for table(s) ${missing.join(', ')}`);
  }
  const whole = (v: string | undefined, what: string, where: string) => {
    if (!/^\d+$/.test((v ?? '').trim())) throw new Error(`${where}: ${what} "${v ?? ''}" is not a whole number`);
    return Number(v);
  };
  return t.rows.flatMap((rec, i): TileItem[] => {
    if (tables && !tables.includes(rec.table_ref!)) return [];
    const where = `${path} row ${i + 2}`;
    const kind = (rec.kind ?? '').trim();
    if (!(KINDS as readonly string[]).includes(kind)) throw new Error(`${where}: kind "${kind}" is not one of ${KINDS.join('|')}`);
    return [{
      sample_id: rec.sample_id!, source_id: assertSafeId('source_id', rec.source_id!), table_ref: assertSafeId('table_ref', rec.table_ref!),
      page_seq: whole(rec.page_seq, 'page_seq', where), crop_id: rec.crop_id!, kind: kind as Kind,
      col: whole(rec.col, 'col', where), row: whole(rec.row, 'row', where), region: parseBox(rec.page_region!, `${where} page_region`),
    }];
  });
}

export interface ContactSheetResult {
  dir: string;
  grid: { cols: number; rows: number; perSheet: number };
  sheets: Array<{ file: string; width: number; height: number; tiles: number }>;
  /** The rows of sheets.csv. */
  rows: CsvRow[];
  /** Every text drawn on the sheets: the tile numbers and keys. */
  texts: string[];
  scale: { min: number; max: number };
  warnings: string[];
}

/** Renders the items as numbered tiles on sheets in `dir`, with sheets.csv. */
export async function buildContactSheets(r: Roots, items: readonly TileItem[], dir: string, opts: Partial<SheetOptions> = {}): Promise<ContactSheetResult> {
  const o: SheetOptions = { ...SHEET_DEFAULTS, ...opts };
  if (!Number.isInteger(o.perSheet) || o.perSheet < 1) throw new Error(`--per-sheet must be a positive whole number, not ${o.perSheet}`);
  if (!(o.context > 0)) throw new Error(`--context must be a positive number, not ${o.context}`);
  if (items.length === 0) throw new Error('no cells to put on contact sheets');
  const { grid, fits } = chooseGrid(items.map((it) => [it.region[2], it.region[3]] as const), o);

  // Each cell's page and deskew from its table's layout (by its crop, or by its key if the crop is gone).
  const tables = new Map<string, { layout: Layout; crops: CropRow[] }>();
  const groups = new Map<string, { source: string; page_seq: number; deskew: number; idx: number[] }>();
  const warnings: string[] = [];
  items.forEach((it, i) => {
    const tk = `${it.source_id}/${it.table_ref}`;
    let t = tables.get(tk);
    if (!t) {
      const cp = cropsCsv(r, it.source_id, it.table_ref);
      t = { layout: loadLayout(layoutJson(r, it.source_id, it.table_ref)), crops: existsSync(cp) ? loadCropsCsv(cp) : [] };
      tables.set(tk, t);
    }
    const crop = t.crops.find((c) => c.crop_id === it.crop_id);
    const panel = crop ? panelForCrop(t.layout, crop) : panelForKey(t.layout, it);
    if (!panel || panel.page_seq !== it.page_seq) throw new Error(`${it.sample_id}: no panel of table ${it.table_ref} on page ${it.page_seq} holds ${keyText(it)}`);
    if (crop) {
      const b = keyBox(t.layout, crop, it);
      if (boxStr(b) !== boxStr(it.region)) warnings.push(`${it.sample_id}: page_region ${boxStr(it.region)} differs from the layout's box ${boxStr(b)}; the tile shows page_region`);
    }
    const deskew = panel.deskew_deg ?? 0;
    const gk = `${it.source_id}\u0000${it.page_seq}\u0000${deskew}`;
    const g = groups.get(gk) ?? { source: it.source_id, page_seq: it.page_seq, deskew, idx: [] };
    g.idx.push(i);
    groups.set(gk, g);
  });

  // The tiles' images, page by page (each page decoded once).
  const images: Buffer[] = [];
  for (const g of groups.values()) {
    const page = await loadPage(findPageImage(r, g.source, g.page_seq), g.deskew);
    for (const i of g.idx) {
      const it = items[i]!; const f = fits[i]!; const b = it.region;
      if (b[0] < 0 || b[1] < 0 || b[0] + b[2] > page.width || b[1] + b[3] > page.height) {
        throw new Error(`${it.sample_id}: page_region ${boxStr(b)} lies outside page ${g.page_seq} (${page.width}×${page.height} after a ${g.deskew}° deskew)`);
      }
      images[i] = await renderZoom(page, [b[0] - f.mx, b[1] - f.my, b[2] + 2 * f.mx, b[3] + 2 * f.my], b, f.s, o.mark);
    }
  }

  if (existsSync(dir)) for (const f of readdirSync(dir)) if (/^sheet-\d+\.png$/.test(f) || f === 'sheets.csv') rmSync(join(dir, f));
  const per = grid.cols * grid.rows;
  const boxW = Math.min(grid.tileW, Math.max(TILE.minWidth, ...fits.map((f) => f.W + 2 * TILE.frame)));
  const boxH = Math.min(grid.tileH, TILE.band + 2 * TILE.frame + Math.max(...fits.map((f) => f.H)));
  const rows: CsvRow[] = []; const texts: string[] = [];
  const sheets: ContactSheetResult['sheets'] = [];
  for (let first = 0; first < items.length; first += per) {
    const sheet = String(sheets.length + 1).padStart(2, '0');
    const file = `sheet-${sheet}.png`;
    const n = Math.min(per, items.length - first);
    const usedCols = Math.min(grid.cols, n); const usedRows = Math.ceil(n / grid.cols);
    const width = 2 * TILE.pad + usedCols * boxW + (usedCols - 1) * TILE.gap;
    const height = 2 * TILE.pad + usedRows * boxH + (usedRows - 1) * TILE.gap;
    const layers: OverlayOptions[] = []; const svg: string[] = [];
    for (let k = 0; k < n; k++) {
      const i = first + k; const it = items[i]!; const f = fits[i]!;
      const x = TILE.pad + (k % grid.cols) * (boxW + TILE.gap); const y = TILE.pad + Math.floor(k / grid.cols) * (boxH + TILE.gap);
      const ix = x + TILE.frame + Math.floor((boxW - 2 * TILE.frame - f.W) / 2);
      const iy = y + TILE.band + TILE.frame + Math.floor((boxH - TILE.band - 2 * TILE.frame - f.H) / 2);
      layers.push({ input: images[i]!, left: ix, top: iy });
      const number = String(i + 1); const key = keyText(it);
      texts.push(number, key);
      svg.push(tileSvg(x, y, boxW, boxH, number, key, ix, iy, it, f));
      rows.push({
        sheet, tile: number, file, sample_id: it.sample_id, source_id: it.source_id, table_ref: it.table_ref, page_seq: String(it.page_seq),
        kind: it.kind, col: String(it.col), row: String(it.row), scale: f.s.toFixed(2),
      });
    }
    layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg.join('')}</svg>`), left: 0, top: 0 });
    // An 8-bit palette keeps a full sheet near 0.8 MB instead of 2.6 MB, with no visible loss in the print.
    const png = await sharp({ create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .composite(layers).png({ palette: true, colors: 256, compressionLevel: 9 }).toBuffer();
    writeTextFile(join(dir, file), png);
    sheets.push({ file, width, height, tiles: n });
  }
  writeTextFile(join(dir, 'sheets.csv'), writeCsv(SHEET_COLUMNS, rows));
  const scales = fits.map((f) => f.s);
  return {
    dir, grid: { cols: grid.cols, rows: grid.rows, perSheet: per }, sheets, rows, texts,
    scale: { min: Math.min(...scales), max: Math.max(...scales) }, warnings,
  };
}

/** The default output folder of a sample's sheets (a sub-folder per table filter). */
export function sheetsDir(r: Roots, label: string, tables?: readonly string[]): string {
  const base = join(r.build, 'review', `sample-${assertSafeId('label', label)}`);
  return tables && tables.length ? join(base, `tables-${tables.map((t) => assertSafeId('table_ref', t)).join('-')}`) : base;
}

export async function runContactSheets(r: Roots, label: string, o: Partial<SheetOptions> & { tables?: readonly string[]; out?: string } = {}): Promise<ContactSheetResult> {
  const { tables, out, ...sheet } = o;
  const items = itemsFromSample(r, label, tables);
  const seen = exampleOverlap(r, items.map((it) => ({ sample_id: it.sample_id, source_id: it.source_id, table_ref: it.table_ref, kind: it.kind, col: String(it.col), row: String(it.row) })));
  if (seen.length) {
    throw new Error(`${seen.length} cell(s) of sample ${label} are sign examples in build/brief/signs/, which a historian reads (${seen.map((e) => `${e.sample_id} = ${e.image}`).join(', ')}): `
      + 'run node tools/keying/sign-examples.ts again first (it skips sampled cells)');
  }
  return buildContactSheets(r, items, out ? resolve(r.root, out) : sheetsDir(r, label, tables), sheet);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const label = opt('--sample');
  if (!label) {
    console.error('usage: contact-sheet.ts --sample <label> [--per-sheet 16] [--filter-tables 12,13,23] [--out <dir>] [--plain] [--context 1]');
    process.exit(1);
  }
  const o: Partial<SheetOptions> & { tables?: string[]; out?: string } = {};
  if (opt('--per-sheet') !== undefined) o.perSheet = Number(opt('--per-sheet'));
  if (opt('--filter-tables') !== undefined) o.tables = opt('--filter-tables')!.split(',').map((t) => t.trim()).filter(Boolean);
  if (opt('--out') !== undefined) o.out = opt('--out')!;
  if (args.includes('--plain')) o.mark = 'plain';
  if (opt('--context') !== undefined) o.context = Number(opt('--context'));
  runContactSheets(roots(), label, o).then((res) => {
    for (const w of res.warnings) console.warn(`warning: ${w}`);
    const big = res.sheets.reduce((a, s) => (s.width * s.height > a.width * a.height ? s : a));
    console.log(`${res.rows.length} tile(s) on ${res.sheets.length} sheet(s), grid ${res.grid.cols}×${res.grid.rows} (up to ${res.grid.perSheet} per sheet, largest ${big.width}×${big.height} px), magnified ${res.scale.min}–${res.scale.max}×`);
    console.log(`→ ${res.dir}/sheet-NN.png; sheets.csv maps (sheet, tile) to sample_id`);
  }).catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
