/**
 * Side-by-side review page.
 *
 *   node tools/review/side-by-side.ts <source_id> <table_ref>
 *
 * Writes build/review/<source_id>-<table_ref>.html: for every crop, the crop image (embedded as a
 * data URI) beside a grid of its cells, read from <crop_id>.R.csv, or from .A.csv while the crop is
 * not yet resolved. Cells settled by the resolver (A, B or other) are tinted amber, doubtful cells
 * (sure=n) orange and illegible ones (sure=x) red; hovering shows both keyers' readings and the
 * resolver's note. Crops whose status.csv status is skipped (e.g. superseded by re-keyed "-v2"
 * crops) are left out; their files stay on disk as the record. One self-contained file for the
 * owner and the historian; nothing is fetched.
 */
import { existsSync, readFileSync } from 'node:fs';
import { writeTextFile } from '../keying/csv.ts';
import { cellKey, marksString, type KeyedCell, type ResolvedCell } from '../keying/longcsv.ts';
import { cropImage, reviewHtml, roots, statusCsv, type Roots } from '../keying/paths.ts';
import { cropIsSkipped, cropStatusRow, readStatus } from '../keying/status.ts';
import { loadTable, readKeyer, readResolvedFile } from '../keying/crop-files.ts';
import { headerLines, labelCols, panelForCrop, type CropRow, type Layout } from '../crops/layout.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Shown = Pick<ResolvedCell, 'text' | 'marks' | 'sure'> & { resolution?: ResolvedCell['resolution']; note?: string };

function cellHtml(c: Shown | undefined, a: KeyedCell | undefined, b: KeyedCell | undefined): string {
  if (!c) return '<td class="none" title="no reading">∅</td>';
  let body = esc(c.text);
  for (const m of c.marks) {
    if (m === 'b') body = `<b>${body}</b>`;
    else if (m === 'i') body = `<i>${body}</i>`;
    else if (m === 'u') body = `<u>${body}</u>`;
    else if (m === 'sc') body = `<span class="sc">${body}</span>`;
  }
  const fns = c.marks.filter((m) => m.startsWith('fn:')).map((m) => m.slice(3)).join('');
  if (fns) body += `<sup>${esc(fns)}</sup>`;
  const cls: string[] = [];
  if (c.resolution && c.resolution !== 'agree') cls.push('resolved');
  if (c.sure === 'n') cls.push('doubt');
  if (c.sure === 'x' || c.resolution === 'illegible') cls.push('illegible');
  const tip: string[] = [];
  const read = (who: string, k: KeyedCell | undefined) => tip.push(`${who}: ${k ? `${k.text === '' ? '(blank)' : k.text}${k.marks.length ? ` [${marksString(k.marks)}]` : ''}${k.sure !== 'y' ? ` sure=${k.sure}` : ''}` : '—'}`);
  if (a || b) { read('A', a); read('B', b); }
  if (c.resolution) tip.push(`resolution: ${c.resolution}`);
  if (c.note) tip.push(`note: ${c.note}`);
  return `<td${cls.length ? ` class="${cls.join(' ')}"` : ''}${tip.length ? ` title="${esc(tip.join('\n'))}"` : ''}>${body || '&nbsp;'}</td>`;
}

export interface CropView {
  crop: CropRow;
  imageDataUri: string | null;
  source: 'R' | 'A' | 'none';
  cells: Map<string, Shown>;
  a: Map<string, KeyedCell>;
  b: Map<string, KeyedCell>;
  status: string;
}

export function gridHtml(layout: Layout, v: CropView): string {
  const { crop } = v;
  const get = (kind: string, col: number, row: number) => {
    const k = cellKey({ kind, col, row });
    return cellHtml(v.cells.get(k), v.a.get(k), v.b.get(k));
  };
  if (crop.footnotes) {
    const rows = [...new Set([...v.cells.keys(), ...v.a.keys(), ...v.b.keys()])].filter((k) => k.startsWith('footnote:'))
      .map((k) => Number(k.split(':')[2])).sort((x, y) => x - y);
    if (rows.length === 0) return '<p class="muted">no footnote lines keyed</p>';
    return `<table class="grid"><tbody>${rows.map((n) => `<tr><th>f${n}</th>${get('footnote', 0, n)}</tr>`).join('')}</tbody></table>`;
  }
  const p = panelForCrop(layout, crop);
  const cols: number[] = []; for (let c = crop.cols[0]; c <= crop.cols[1]; c++) cols.push(c);
  const L = labelCols(p);
  const head = `<tr><th></th>${Array.from({ length: L }, (_, s) => `<th>L${s}</th>`).join('')}${cols.map((c) => `<th>c${c}</th>`).join('')}</tr>`;
  const hrows: string[] = [];
  for (let h = 0; h < headerLines(p); h++) hrows.push(`<tr class="hdr"><th>h${h}</th>${'<td class="blank"></td>'.repeat(L)}${cols.map((c) => get('header', c, h)).join('')}</tr>`);
  const brows: string[] = [];
  for (let r = crop.rows[0]; r <= crop.rows[1]; r++) {
    brows.push(`<tr><th>r${r}</th>${Array.from({ length: L }, (_, s) => get('label', s, r)).join('')}${cols.map((c) => get('cell', c, r)).join('')}</tr>`);
  }
  return `<table class="grid"><thead>${head}</thead><tbody>${hrows.join('')}${brows.join('')}</tbody></table>`;
}

const CSS = `
:root { --bg: #fbfaf7; --fg: #1d1d1b; --muted: #6b6a66; --line: #d8d5cc; --amber: #fde9b0; --orange: #fbd0a5; --red: #f6b3b0; --card: #ffffff; }
@media (prefers-color-scheme: dark) { :root { --bg: #1a1a18; --fg: #ecebe6; --muted: #a09f99; --line: #3a3934; --amber: #5c4a14; --orange: #6b3d14; --red: #6e2421; --card: #23231f; } }
* { box-sizing: border-box; }
body { margin: 0; padding: 16px; background: var(--bg); color: var(--fg); font: 14px/1.4 system-ui, sans-serif; }
h1 { font-size: 20px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 0 0 8px; }
.muted { color: var(--muted); }
.legend span { display: inline-block; padding: 1px 8px; margin-right: 6px; border-radius: 3px; border: 1px solid var(--line); }
section.crop { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 12px; margin: 16px 0; }
.pair { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.pair > div { flex: 1 1 420px; min-width: 0; overflow-x: auto; }
.pair img { max-width: 100%; height: auto; border: 1px solid var(--line); }
table.grid { border-collapse: collapse; font: 13px/1.3 'Liberation Serif', Georgia, serif; }
table.grid th { font: 11px system-ui, sans-serif; color: var(--muted); padding: 2px 4px; text-align: left; }
table.grid td { border: 1px solid var(--line); padding: 2px 6px; white-space: nowrap; text-align: right; min-width: 3em; }
table.grid tr td:nth-child(2) { text-align: left; }
td.resolved { background: var(--amber); } td.doubt { background: var(--orange); } td.illegible { background: var(--red); }
td.none { color: var(--red); text-align: center; } td.blank { border: none; }
.sc { font-variant: small-caps; }
`;

export function pageHtml(source: string, table: string, layout: Layout, views: readonly CropView[]): string {
  const counts = { resolved: 0, doubt: 0, illegible: 0 };
  for (const v of views) for (const c of v.cells.values()) {
    if (c.resolution && c.resolution !== 'agree' && c.resolution !== 'illegible') counts.resolved++;
    if (c.sure === 'n') counts.doubt++;
    if (c.sure === 'x' || c.resolution === 'illegible') counts.illegible++;
  }
  const sections = views.map((v) => `<section class="crop" id="${esc(v.crop.crop_id)}">
<h2>${esc(v.crop.crop_id)} <span class="muted">page_seq ${v.crop.page_seq} · ${v.crop.footnotes ? 'footnotes' : `cols c${v.crop.cols[0]}–c${v.crop.cols[1]}, rows r${v.crop.rows[0]}–r${v.crop.rows[1]}`} · ${esc(v.status)} · cells from ${v.source === 'R' ? 'resolved file' : v.source === 'A' ? 'keyer A only (not resolved)' : 'no keying yet'}</span></h2>
<div class="pair"><div>${v.imageDataUri ? `<img alt="crop ${esc(v.crop.crop_id)}" src="${v.imageDataUri}">` : '<p class="muted">crop image not on disk (scans/ is not committed)</p>'}</div>
<div>${gridHtml(layout, v)}</div></div></section>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review ${esc(source)} ${esc(table)}</title><style>${CSS}</style></head><body>
<h1>${esc(layout.title ?? `Table ${table}`)}</h1>
<p class="muted">${esc(source)} · table ${esc(table)} · ${views.length} crop(s) · ${counts.resolved} resolved disagreement(s), ${counts.doubt} doubtful, ${counts.illegible} illegible</p>
<p class="legend"><span style="background:var(--amber)">resolved disagreement</span><span style="background:var(--orange)">sure = n</span><span style="background:var(--red)">illegible / sure = x</span> Hover a cell for both readings.</p>
${sections}
</body></html>
`;
}

export function buildViews(r: Roots, source: string, table: string): { layout: Layout; views: CropView[] } {
  const t = loadTable(r, source, table);
  const status = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  const views = t.crops.filter((crop) => !cropIsSkipped(status, source, table, crop.crop_id)).map((crop): CropView => {
    const img = cropImage(r, source, table, crop.crop_id);
    const A = readKeyer(r, source, table, crop.crop_id, 'A');
    const B = readKeyer(r, source, table, crop.crop_id, 'B');
    const R = readResolvedFile(r, source, table, crop.crop_id);
    const cells = new Map<string, Shown>();
    let src: CropView['source'] = 'none';
    if (R && R.cells.length) { for (const c of R.cells) cells.set(cellKey(c), c); src = 'R'; }
    else if (A) { for (const c of A.cells) cells.set(cellKey(c), c); src = 'A'; }
    const st = cropStatusRow(status, source, table, crop.crop_id);
    return {
      crop, source: src, cells,
      imageDataUri: existsSync(img) ? `data:image/png;base64,${readFileSync(img).toString('base64')}` : null,
      a: new Map((A?.cells ?? []).map((c) => [cellKey(c), c])),
      b: new Map((B?.cells ?? []).map((c) => [cellKey(c), c])),
      status: st ? `${st.status}${st.agreement_permille ? ` ${st.agreement_permille}‰` : ''}` : 'no status',
    };
  });
  return { layout: t.layout, views };
}

export function writeReview(r: Roots, source: string, table: string): string {
  const { layout, views } = buildViews(r, source, table);
  const out = reviewHtml(r, source, table);
  writeTextFile(out, pageHtml(source, table, layout, views));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [source, table] = process.argv.slice(2);
  if (!source || !table) { console.error('usage: side-by-side.ts <source_id> <table_ref>'); process.exit(1); }
  try { console.log(writeReview(roots(), source, table)); } catch (e) { console.error((e as Error).message); process.exit(1); }
}
