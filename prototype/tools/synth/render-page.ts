/**
 * Synthetic calibration pages.
 *
 *   node tools/synth/render-page.ts --seed 7 [--stations 9] [--trains 10] [--style bold-pm|mrn-aft]
 *        [--degrade 0|1|2] [--dsf 1.5] [--source SYN_calib-7] [--table SYN1]
 *
 * Generates a ground-truth timetable (tools/synth/table.ts), lays it out as a period-style page in
 * HTML/CSS, renders it to PNG with Playwright's Chromium (CHROMIUM_PATH or /opt/pw-browsers/chromium;
 * never `playwright install`), measures the grid in the browser, then degrades the image with sharp
 * (grey ink on off-white paper, blur, a slight rotation, speckle noise, JPEG artefacts). The layout
 * straightens the page again with deskew_deg, as a layout author would for a skewed scan.
 *
 * Output goes to a separate synthetic tree, never to data/ or scans/:
 *   build/synth/scans/<source>/p1.png                       the degraded page
 *   build/synth/data/raw/<source>/<table>/layout.json       the grid, transformed like the image
 *   build/synth/data/raw/<source>/<table>/truth.csv         ground truth in long format (crop_id GT)
 *   build/synth/data/raw/<source>/<table>/page.html         the source HTML
 * Then, with P1900_DATA=build/synth/data P1900_SCANS=build/synth/scans, the crop, diff, merge and
 * review tools run on it unchanged, and tools/synth/score.ts scores the keyings.
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { writeTextFile } from '../keying/csv.ts';
import { writeLong } from '../keying/longcsv.ts';
import { layoutJson, rawDir, roots, scansDir, type Roots } from '../keying/paths.ts';
import { validateLayout, type Box, type Layout, type Panel } from '../crops/layout.ts';
import { loadPage } from '../crops/make-crops.ts';
import { generateTable, rng, truthCells, type Printed, type SynthOptions, type SynthTable } from './table.ts';

export const CHROMIUM = () => process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** How a printed sign looks on the page (the ground truth keeps the keying tokens). */
function shown(p: Printed): string {
  let body: string;
  if (p.text === '〃') body = '<span class="ditto">”</span>';
  else if (/^(aft|mrn) /.test(p.text)) body = `<span class="per">${p.text.slice(0, 3)}</span> ${esc(p.text.slice(4))}`;
  else body = esc(p.text);
  for (const m of p.marks) {
    if (m === 'b') body = `<b>${body}</b>`;
    else if (m === 'i') body = `<i>${body}</i>`;
    else if (m === 'u') body = `<u>${body}</u>`;
    else if (m === 'sc') body = `<span class="sc">${body}</span>`;
  }
  const fns = p.marks.filter((m) => m.startsWith('fn:')).map((m) => m.slice(3));
  return body + (fns.length ? `<sup>${esc(fns.join(''))}</sup>` : '');
}

export function pageHtml(t: SynthTable): string {
  const nH = t.header.length;
  const head = t.header.map((line, h) => `<tr class="hl">${h === 0 ? `<th class="corner" colspan="2" rowspan="${nH}">STATIONS.</th>` : ''}${line.map((p) => `<th class="c">${shown(p)}</th>`).join('')}</tr>`).join('\n');
  const body = t.rows.map((row) => `<tr><td class="lab">${shown(row.label[0])}</td><td class="ad">${shown(row.label[1])}</td>${row.cells.map((p) => `<td class="c">${shown(p)}</td>`).join('')}</tr>`).join('\n');
  const fns = t.footnotes.map((f) => `<div>${esc(f.symbol)} ${esc(f.text)}</div>`).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; background: #fff; }
  body { font-family: 'Liberation Serif', 'FreeSerif', 'DejaVu Serif', serif; color: #111; }
  .page { display: inline-block; padding: 18px 22px 22px; }
  h1 { font-size: 13px; text-align: center; letter-spacing: 0.06em; margin: 0 0 6px; }
  table { border-collapse: collapse; font-size: 12px; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; }
  th, td { padding: 0 4px; height: 17px; white-space: nowrap; line-height: 17px; }
  th { font-weight: normal; font-size: 11px; }
  th.corner { font-size: 10px; letter-spacing: 0.08em; border-bottom: 1px solid #111; }
  thead tr:last-child th { border-bottom: 1px solid #111; }
  td.lab { text-align: left; min-width: 120px; }
  td.ad { font-style: italic; font-size: 10px; min-width: 22px; }
  .c { text-align: right; min-width: 38px; border-left: 1px solid #333; }
  .ditto { font-size: 13px; }
  .per { font-size: 9px; }
  .sc { font-variant: small-caps; }
  sup { font-size: 8px; line-height: 0; }
  .fn { font-size: 10px; margin-top: 6px; line-height: 13px; }
</style></head><body><div class="page"><h1>${esc(t.title)}</h1><table><thead>
${head}
</thead><tbody>
${body}
</tbody></table>${t.footnotes.length ? `<div class="fn">${fns}</div>` : ''}</div></body></html>`;
}

type Rect = [number, number, number, number]; // left, top, right, bottom (CSS px, page-relative)

interface Measured { size: [number, number]; table: Rect; header: Rect[]; body: Rect[]; cols: Rect[]; lab: Rect; ad: Rect; fn: Rect | null }

async function renderHtml(html: string, dsf: number): Promise<{ png: Buffer; m: Measured }> {
  const browser = await chromium.launch({ executablePath: CHROMIUM(), headless: true });
  try {
    const ctx = await browser.newContext({ deviceScaleFactor: dsf, viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const pg = document.querySelector('.page')!.getBoundingClientRect();
      const R = (el: Element): [number, number, number, number] => { const r = el.getBoundingClientRect(); return [r.left - pg.left, r.top - pg.top, r.right - pg.left, r.bottom - pg.top]; };
      const brows = [...document.querySelectorAll('tbody tr')];
      const first = brows[0]!;
      const fn = document.querySelector('.fn');
      return {
        size: [pg.width, pg.height] as [number, number],
        table: R(document.querySelector('table')!),
        header: [...document.querySelectorAll('thead tr')].map(R),
        body: brows.map(R),
        cols: [...first.querySelectorAll('td.c')].map(R),
        lab: R(first.querySelector('td.lab')!),
        ad: R(first.querySelector('td.ad')!),
        fn: fn ? R(fn) : null,
      };
    });
    const png = await page.locator('.page').screenshot({ type: 'png' });
    return { png, m };
  } finally {
    await browser.close();
  }
}

export interface DegradeOptions { level: 0 | 1 | 2; seed: number }

/** Degrades a page; returns the image and the point transform it applied. */
export async function degrade(png: Buffer, o: DegradeOptions): Promise<{ png: Buffer; map: (x: number, y: number) => [number, number]; angle: number }> {
  const meta = await sharp(png).metadata();
  const W = meta.width!; const H = meta.height!;
  if (o.level === 0) return { png: await sharp(png).flatten({ background: '#ffffff' }).greyscale().png().toBuffer(), map: (x, y) => [x, y], angle: 0 };
  const r = rng(o.seed ^ 0x5eed);
  const heavy = o.level === 2;
  const sigma = (heavy ? 0.7 : 0.4) + r.next() * (heavy ? 0.5 : 0.35);
  // Rounded so that a layout can undo it exactly with deskew_deg = -angle.
  const angle = Math.round((r.next() * 2 - 1) * (heavy ? 60 : 30)) / 100 || 0.05;
  const quality = heavy ? r.int(30, 45) : r.int(50, 70);
  const paper = 246;
  // Each step goes through raw pixels so sharp cannot reorder the operations.
  const toned = await sharp(png).flatten({ background: '#ffffff' }).greyscale().linear(0.8, 46).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const raw1 = { width: toned.info.width, height: toned.info.height, channels: 1 as const };
  const blurred = await sharp(toned.data, { raw: raw1 }).blur(sigma).extractChannel(0).raw().toBuffer();
  const rotated = await sharp(blurred, { raw: raw1 })
    .rotate(angle, { background: { r: paper, g: paper, b: paper } }).raw().toBuffer({ resolveWithObject: true });
  const W2 = rotated.info.width; const H2 = rotated.info.height; const ch = rotated.info.channels;
  const grey = Buffer.alloc(W2 * H2);
  for (let i = 0; i < W2 * H2; i++) grey[i] = rotated.data[i * ch]!;
  // Speckle: mostly faint paper grain, a few dark specks.
  const specks = heavy ? 0.0015 : 0.0006;
  for (let i = 0; i < grey.length; i++) {
    const n = r.next();
    let v = grey[i]! - Math.floor(n * n * n * (heavy ? 70 : 40));
    if (r.next() < specks) v = Math.min(v, 80 + r.int(0, 60));
    grey[i] = Math.max(0, Math.min(255, v));
  }
  const jpeg = await sharp(grey, { raw: { width: W2, height: H2, channels: 1 } }).jpeg({ quality }).toBuffer();
  const out = await sharp(jpeg).greyscale().png().toBuffer();
  const th = (angle * Math.PI) / 180; const cos = Math.cos(th); const sin = Math.sin(th);
  const map = (x: number, y: number): [number, number] => {
    const dx = x - W / 2; const dy = y - H / 2;
    return [W2 / 2 + dx * cos - dy * sin, H2 / 2 + dx * sin + dy * cos];
  };
  return { png: out, map, angle };
}

/** Builds the layout from browser measurements (CSS px) through scale and the degradation's transform. */
export function buildLayout(t: SynthTable, m: Measured, dsf: number, map: (x: number, y: number) => [number, number], sourceId: string, pageSeq: number, deskewDeg = 0): Layout {
  const S = (v: number) => v * dsf;
  const midY = S((m.table[1] + m.table[3]) / 2);
  const midX = S((m.table[0] + m.table[2]) / 2);
  const X = (x: number, atY = midY) => Math.round(map(S(x), atY)[0]);
  const Y = (y: number, atX = midX) => Math.round(map(atX, S(y))[1]);
  const box = (l: number, t2: number, r: number, b: number): Box => {
    const pts = [map(S(l), S(t2)), map(S(r), S(t2)), map(S(l), S(b)), map(S(r), S(b))];
    const x0 = Math.floor(Math.min(...pts.map((p) => p[0]))); const y0 = Math.floor(Math.min(...pts.map((p) => p[1])));
    const x1 = Math.ceil(Math.max(...pts.map((p) => p[0]))); const y1 = Math.ceil(Math.max(...pts.map((p) => p[1])));
    return [x0, y0, x1 - x0, y1 - y0];
  };
  const colX = [...m.cols.map((c) => c[0]), m.cols[m.cols.length - 1]![2]];
  const rowY = [...m.body.map((r) => r[1]), m.body[m.body.length - 1]![3]];
  const headY = [...m.header.map((r) => r[1]), m.header[m.header.length - 1]![3]];
  const labX = [m.lab[0], m.ad[0], m.ad[2]];
  const labMidY = S((rowY[0]! + rowY[rowY.length - 1]!) / 2);
  const headMidX = S((colX[0]! + colX[colX.length - 1]!) / 2);
  const panel: Panel = {
    panel: 'p1', page_seq: pageSeq,
    ...(deskewDeg ? { deskew_deg: deskewDeg } : {}),
    table_bbox: box(m.table[0], m.table[1], m.table[2], m.table[3]),
    label_bbox: box(labX[0]!, rowY[0]!, labX[2]!, rowY[rowY.length - 1]!),
    header_bbox: box(colX[0]!, headY[0]!, colX[colX.length - 1]!, headY[headY.length - 1]!),
    col_x: colX.map((x) => X(x)),
    row_y: rowY.map((y) => Y(y)),
    first_col: 0, first_row: 0,
    header_y: headY.map((y) => Y(y, headMidX)),
    label_x: labX.map((x) => X(x, labMidY)),
    ...(m.fn ? { footnote_bbox: box(m.fn[0], m.fn[1], m.fn[2], m.fn[3]) } : {}),
  };
  // Rotated boxes grow by a few pixels: keep the label column left of the first train column and
  // the header band above the first body row, as a hand-drawn layout would.
  const lb = panel.label_bbox;
  if (lb[0] + lb[2] > panel.col_x[0]!) panel.label_bbox = [lb[0], lb[1], panel.col_x[0]! - lb[0], lb[3]];
  const lx = panel.label_x!;
  if (lx[lx.length - 1]! > panel.col_x[0]!) lx[lx.length - 1] = panel.col_x[0]!;
  const hb = panel.header_bbox;
  if (hb[1] + hb[3] > panel.row_y[0]!) panel.header_bbox = [hb[0], hb[1], hb[2], panel.row_y[0]! - hb[1]];
  const hy = panel.header_y!;
  if (hy[hy.length - 1]! > panel.row_y[0]!) hy[hy.length - 1] = panel.row_y[0]!;
  return { layout_version: 1, source_id: sourceId, table_ref: t.table_ref, table_kind: 'timetable', title: t.title, panels: [panel], notes: 'synthetic calibration page (tools/synth/render-page.ts)' };
}

export interface RenderOptions extends SynthOptions {
  sourceId?: string;
  pageSeq?: number;
  dsf?: number;
  degradeLevel?: 0 | 1 | 2;
  roots?: Roots;
}

export interface RenderResult { table: SynthTable; layout: Layout; pagePath: string; truthPath: string; layoutPath: string; angle: number }

/** The synthetic tree's roots: build/synth/{data,scans}. */
export function synthRoots(base: Roots = roots()): Roots {
  return roots({ root: base.root, data: join(base.build, 'synth', 'data'), scans: join(base.build, 'synth', 'scans'), build: base.build });
}

export async function renderPage(o: RenderOptions): Promise<RenderResult> {
  const r = o.roots ?? synthRoots();
  const sourceId = o.sourceId ?? `SYN_calib-${o.seed}`;
  if (!sourceId.startsWith('SYN_')) throw new Error('synthetic source ids must start with SYN_');
  const seq = o.pageSeq ?? 1;
  const dsf = o.dsf ?? 1.5;
  const t = generateTable(o);
  const html = pageHtml(t);
  const { png, m } = await renderHtml(html, dsf);
  const d = await degrade(png, { level: o.degradeLevel ?? 1, seed: o.seed });
  // As a layout author would, straighten the skewed page (deskew_deg) and draw the grid on the
  // straightened image: rotating back by -angle maps every original point p to p + offset.
  const shot = await sharp(png).metadata();
  let map = (x: number, y: number): [number, number] => [x, y];
  let size = await sharp(d.png).metadata().then((m2) => ({ width: m2.width!, height: m2.height! }));
  if (d.angle !== 0) {
    const straight = await loadPage(d.png, -d.angle);
    const ox = (straight.width - shot.width!) / 2; const oy = (straight.height - shot.height!) / 2;
    map = (x, y) => [x + ox, y + oy];
    size = { width: straight.width, height: straight.height };
  }
  const layout = buildLayout(t, m, dsf, map, sourceId, seq, d.angle ? -d.angle : 0);
  const problems = validateLayout(layout, new Map([[seq, size]]));
  if (problems.length) throw new Error(`synthetic layout invalid:\n  ${problems.join('\n  ')}`);
  const pagePath = join(scansDir(r, sourceId), `p${seq}.png`);
  writeTextFile(pagePath, d.png);
  const layoutPath = layoutJson(r, sourceId, t.table_ref);
  writeTextFile(layoutPath, JSON.stringify(layout, null, 1) + '\n');
  const truthPath = join(rawDir(r, sourceId, t.table_ref), 'truth.csv');
  writeTextFile(truthPath, writeLong(truthCells(t)));
  writeTextFile(join(rawDir(r, sourceId, t.table_ref), 'page.html'), html);
  return { table: t, layout, pagePath, truthPath, layoutPath, angle: d.angle };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const num = (f: string) => (opt(f) !== undefined ? Number(opt(f)) : undefined);
  const seed = num('--seed') ?? 1;
  const style = opt('--style') as SynthOptions['style'] | undefined;
  renderPage({
    seed,
    ...(num('--stations') !== undefined ? { stations: num('--stations')! } : {}),
    ...(num('--trains') !== undefined ? { trains: num('--trains')! } : {}),
    ...(style ? { style } : {}),
    ...(num('--dsf') !== undefined ? { dsf: num('--dsf')! } : {}),
    ...(num('--degrade') !== undefined ? { degradeLevel: num('--degrade') as 0 | 1 | 2 } : {}),
    ...(opt('--source') ? { sourceId: opt('--source')! } : {}),
    ...(opt('--table') ? { tableRef: opt('--table')! } : {}),
  }).then((res) => {
    console.log(`page    ${res.pagePath}`);
    console.log(`layout  ${res.layoutPath}`);
    console.log(`truth   ${res.truthPath}`);
    console.log(`next: P1900_DATA=build/synth/data P1900_SCANS=build/synth/scans node tools/crops/make-crops.ts ${res.layout.source_id} ${res.layout.table_ref}`);
  }, (e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
