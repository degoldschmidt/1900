/**
 * Zoomed examples of a guide's signs for the keyer brief (decision P-013).
 *
 *   node tools/keying/sign-examples.ts [--source sl-rfrkuf_394077458-19140001] [--per 2] [--out build/brief/signs]
 *
 * Reads every resolved file (<crop_id>.R.csv, of any keying round) under data/raw/<source>/, picks
 * cells whose resolved reading carries one of the signs below (a footnote mark fn:<sign>, a sign in the
 * text, or a type style), and cuts each from its page scan with tools/crops/make-crops.ts zoomKey: the
 * cell with a margin, magnified 4×, outlined in red. Writes <out>/<sign>-<n>.png, <out>/index.md,
 * which names the sign of every image, how to key it, and the cell it was cut from, and <out>/examples.csv
 * (the same cells as data). Scans and their derivatives are not committed (build/ is git-ignored), so the
 * brief says "if present".
 *
 * Keyers and historians read this folder, so it must not reveal a sampled cell (decision P-E021): the
 * index gives no readings, and a cell drawn for any historian sample (data/review/sample-*.csv) is never
 * an example. A sample drawn after the examples were cut may still coincide with one; sample.ts draw
 * warns, and tools/review/contact-sheet.ts refuses to make that sample's sheets until this tool is run
 * again (exampleOverlap below).
 *
 * Where the historian's blind sample (data/review/sample-*.csv) re-read a cell differently, the
 * historian's reading is used (bold, which the historian does not judge, is kept from the resolved
 * cell): a sign the keyers missed then gives an example, and a cell is not shown as an example of one
 * sign while it also carries another that its resolved reading lacks.
 *
 * Positions come from the resolved cells and the table's layout.json only: a cell is located by its
 * absolute (kind, col, row) in the panel that holds it, so crops superseded by a later keying round
 * still give their examples. Illegible cells are never used; resolved readings (agree, A, B, other)
 * are preferred in that order, and examples are spread over tables.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { cmpStr, readCsvFile, writeCsv, writeTextFile } from './csv.ts';
import { canonicalMarks, cellRef, marksString, normText, parseResolved, type ResolvedCell } from './longcsv.ts';
import { assertSafeId, layoutJson, roots, type Roots } from './paths.ts';
import { loadLayout, panelCrop, panelForKey, type Layout } from '../crops/layout.ts';
import { findPageImage, loadPage, zoomKey, type PageRaw } from '../crops/make-crops.ts';

export interface SignSpec {
  /** File-name stem (ASCII). */
  name: string;
  /** What the brief calls it. */
  label: string;
  /** How it is keyed. */
  keyAs: string;
  /** Does a resolved cell show this sign? */
  test: (c: ResolvedCell) => boolean;
}

const fn = (sym: string) => (c: ResolvedCell) => c.marks.includes(`fn:${sym}`);
const inText = (sym: string) => (c: ResolvedCell) => c.kind !== 'label' && c.text.split(/\s+/).includes(sym);
/** A plain time cell without signs (for the type-style examples, so that no other sign distracts). */
const isTime = (c: ResolvedCell) => c.kind === 'cell' && /^\d{1,2}[ .·]\d{2}$/.test(c.text) && !c.marks.some((m) => m.startsWith('fn:'));

/** The signs of Fritzsches Kursbuch (p. 5 and the pilot's findings), in the brief's order. */
export const FKB_SIGNS: readonly SignSpec[] = [
  { name: 'excl', label: '! before a time', keyAs: 'fn:!', test: fn('!') },
  { name: 'square', label: '□ small hollow square', keyAs: 'fn:□', test: fn('□') },
  { name: 'half-disc', label: '◗ half-disc', keyAs: 'fn:◗', test: fn('◗') },
  { name: 'disc', label: '● large disc', keyAs: 'fn:●', test: fn('●') },
  { name: 'dot', label: '• small dot', keyAs: 'fn:•', test: fn('•') },
  { name: 'filled-square', label: '■ filled square', keyAs: 'fn:■', test: fn('■') },
  { name: 'small-ring', label: '° small open ring (no taller than the raised minutes)', keyAs: 'fn:°', test: fn('°') },
  { name: 'large-ring', label: '○ large open ring (about as tall as the hour figures)', keyAs: 'fn:○', test: fn('○') },
  { name: 'doubled-small-ring', label: '°° two small rings together or stacked', keyAs: 'fn:°°', test: fn('°°') },
  { name: 'doubled-large-ring', label: '○○ two large rings together or stacked', keyAs: 'fn:○○', test: fn('○○') },
  { name: 'doubled-square', label: '□□ two squares together or stacked', keyAs: 'fn:□□', test: fn('□□') },
  { name: 'colon', label: ': two stacked filled dots', keyAs: 'fn::', test: fn(':') },
  { name: 'section', label: '§ section sign', keyAs: 'fn:§', test: fn('§') },
  { name: 'dagger', label: '† dagger', keyAs: 'fn:†', test: fn('†') },
  { name: 'maltese', label: '✠ cross', keyAs: 'fn:✠', test: fn('✠') },
  { name: 'request', label: '× request stop (p. 5, item 1)', keyAs: 'in the text: × 8 15', test: inText('×') },
  { name: 'pick-up', label: '(e) stops only to pick up (item 2)', keyAs: 'in the text: 8 15 (e)', test: inText('(e)') },
  { name: 'set-down', label: '(a) stops only to set down (item 3)', keyAs: 'in the text: 8 15 (a)', test: inText('(a)') },
  { name: 'italic', label: 'italic time (an express column: the minutes slant, the hour often looks upright)', keyAs: 'i once on the column\'s train-number header cell, not on the time', test: (c) => isTime(c) && c.marks.includes('i') },
  { name: 'upright', label: 'upright (roman) time, for comparison with the italic ones', keyAs: 'no style mark', test: (c) => isTime(c) && !c.marks.some((m) => ['i', 'b', 'u'].includes(m)) },
  { name: 'underlined', label: 'underlined minutes (night time)', keyAs: 'u', test: (c) => isTime(c) && c.marks.includes('u') },
];

export interface Example { sign: SignSpec; table: string; cropId: string; cell: ResolvedCell }

const RES_ORDER: Record<string, number> = { agree: 0, A: 1, B: 1, other: 2 };

/** The historian's re-readings of a source's sampled cells, by "<table>/<crop>/<kind>:<col>:<row>". */
export function historianReadings(r: Roots, source: string): Map<string, { text: string; marks: string[] }> {
  const out = new Map<string, { text: string; marks: string[] }>();
  const dir = join(r.data, 'review');
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => /^sample-.*\.csv$/.test(x)).sort(cmpStr)) {
    for (const row of readCsvFile(join(dir, f)).rows) {
      if (row.source_id !== source || !(row.reread_sure ?? '').trim()) continue;
      out.set(`${row.table_ref}/${row.crop_id}/${row.kind}:${row.col}:${row.row}`, { text: normText(row.reread_text ?? ''), marks: canonicalMarks(row.reread_marks ?? '') });
    }
  }
  return out;
}

/** Where a cell sits in its table, whichever crop keyed it: "<table>/<kind>:<col>:<row>". */
export const tableCellKey = (table: string, c: { kind: string; col: number | string; row: number | string }): string => `${table}/${c.kind}:${c.col}:${c.row}`;

/** The cells of a source drawn for any historian sample (data/review/sample-*.csv), filled in or not. */
export function sampledCells(r: Roots, source: string): Set<string> {
  const out = new Set<string>();
  const dir = join(r.data, 'review');
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => /^sample-.*\.csv$/.test(x)).sort(cmpStr)) {
    for (const row of readCsvFile(join(dir, f)).rows) if (row.source_id === source) out.add(tableCellKey(row.table_ref ?? '', { kind: row.kind ?? '', col: row.col ?? '', row: row.row ?? '' }));
  }
  return out;
}

export const EXAMPLE_COLUMNS = ['image', 'sign', 'source_id', 'table_ref', 'page_seq', 'crop_id', 'kind', 'col', 'row'] as const;

/** The examples file the briefs point to (build/brief/signs/examples.csv). */
export const signExamplesCsv = (r: Roots): string => join(r.build, 'brief', 'signs', 'examples.csv');

/**
 * Sample rows whose cell is also a sign example in build/brief/signs/ (none when that folder has no
 * examples.csv): a reader of the brief has seen that cell named with its sign, so it is not blind.
 */
export function exampleOverlap(r: Roots, rows: ReadonlyArray<{ sample_id?: string; source_id?: string; table_ref?: string; kind?: string; col?: string; row?: string }>): Array<{ sample_id: string; image: string }> {
  const path = signExamplesCsv(r);
  if (!existsSync(path)) return [];
  const images = new Map<string, string>();
  for (const e of readCsvFile(path).rows) images.set(`${e.source_id}|${tableCellKey(e.table_ref ?? '', { kind: e.kind ?? '', col: e.col ?? '', row: e.row ?? '' })}`, e.image ?? '');
  const out: Array<{ sample_id: string; image: string }> = [];
  for (const row of rows) {
    const image = images.get(`${row.source_id}|${tableCellKey(row.table_ref ?? '', { kind: row.kind ?? '', col: row.col ?? '', row: row.row ?? '' })}`);
    if (image !== undefined) out.push({ sample_id: row.sample_id ?? '', image });
  }
  return out;
}

/** All resolved grid cells of a source, by table (with the historian's re-reading where there is one). */
export function resolvedCells(r: Roots, source: string): Array<{ table: string; cropId: string; cell: ResolvedCell }> {
  const dir = join(r.data, 'raw', source);
  if (!existsSync(dir)) return [];
  const reread = historianReadings(r, source);
  const out: Array<{ table: string; cropId: string; cell: ResolvedCell }> = [];
  for (const table of readdirSync(dir).sort(cmpStr)) {
    const tdir = join(dir, table);
    let files: string[];
    try { files = readdirSync(tdir).filter((f) => f.endsWith('.R.csv')).sort(cmpStr); } catch { continue; }
    for (const f of files) {
      const cropId = f.slice(0, -'.R.csv'.length);
      const p = parseResolved(readFileSync(join(tdir, f), 'utf8'), { file: f, cropId });
      for (const cell of p.cells) {
        if (cell.kind === 'footnote') continue;
        const h = reread.get(`${table}/${cropId}/${cell.kind}:${cell.col}:${cell.row}`);
        const fixed = h ? { ...cell, text: h.text, marks: canonicalMarks([...h.marks, ...(cell.marks.includes('b') ? ['b'] : [])]) } : cell;
        out.push({ table, cropId, cell: fixed });
      }
    }
  }
  return out;
}

/** Picks up to `per` examples of each sign: readable cells, best resolution first, spread over tables. */
export function pickExamples(cells: ReturnType<typeof resolvedCells>, signs: readonly SignSpec[], per: number): Example[] {
  const out: Example[] = [];
  for (const sign of signs) {
    const cands = cells
      .filter((x) => x.cell.sure !== 'x' && x.cell.resolution !== 'illegible' && x.cell.resolution !== '' && sign.test(x.cell))
      .sort((a, b) => (RES_ORDER[a.cell.resolution] ?? 3) - (RES_ORDER[b.cell.resolution] ?? 3) || (a.cell.sure === 'y' ? 0 : 1) - (b.cell.sure === 'y' ? 0 : 1)
        || cmpStr(a.table, b.table) || cmpStr(a.cropId, b.cropId) || cmpStr(a.cell.kind, b.cell.kind) || a.cell.col - b.cell.col || a.cell.row - b.cell.row);
    const chosen: typeof cands = [];
    // First one per table, then the rest in order.
    for (const c of cands) if (chosen.length < per && !chosen.some((x) => x.table === c.table)) chosen.push(c);
    for (const c of cands) if (chosen.length < per && !chosen.includes(c)) chosen.push(c);
    for (const c of chosen) out.push({ sign, table: c.table, cropId: c.cropId, cell: c.cell });
  }
  return out;
}

export interface SignExamplesResult { written: string[]; missing: string[]; index: string }

export async function makeSignExamples(r: Roots, source: string, o: { per?: number; out?: string; signs?: readonly SignSpec[] } = {}): Promise<SignExamplesResult> {
  const per = o.per ?? 2;
  const outDir = o.out ?? join(r.build, 'brief', 'signs');
  const signs = o.signs ?? FKB_SIGNS;
  const sampled = sampledCells(r, source);
  const examples = pickExamples(resolvedCells(r, source).filter((x) => !sampled.has(tableCellKey(x.table, x.cell))), signs, per);
  const layouts = new Map<string, Layout>();
  const pages = new Map<string, PageRaw>();
  const written: string[] = [];
  const rows: string[] = [];
  const csvRows: Array<Record<string, string>> = [];
  const count = new Map<string, number>();
  for (const ex of examples) {
    let layout = layouts.get(ex.table);
    if (!layout) { layout = loadLayout(layoutJson(r, source, ex.table)); layouts.set(ex.table, layout); }
    const panel = panelForKey(layout, ex.cell);
    if (!panel) continue;
    const pk = `${panel.page_seq}:${panel.deskew_deg ?? 0}`;
    let page = pages.get(pk);
    if (!page) { page = await loadPage(findPageImage(r, source, panel.page_seq), panel.deskew_deg ?? 0); pages.set(pk, page); }
    const n = (count.get(ex.sign.name) ?? 0) + 1;
    count.set(ex.sign.name, n);
    const file = join(outDir, `${ex.sign.name}-${n}.png`);
    writeTextFile(file, await zoomKey(page, layout, panelCrop(layout, panel), ex.cell, { scale: 4 }));
    written.push(file);
    rows.push(`| \`${ex.sign.name}-${n}.png\` | ${ex.sign.label} | \`${ex.sign.keyAs}\` | ${source}:p${panel.page_seq}:${ex.table}:${ex.cropId}:${cellRef(ex.cell)} |`);
    csvRows.push({ image: `${ex.sign.name}-${n}.png`, sign: ex.sign.name, source_id: source, table_ref: ex.table, page_seq: String(panel.page_seq), crop_id: ex.cropId, kind: ex.cell.kind, col: String(ex.cell.col), row: String(ex.cell.row) });
  }
  const missing = signs.filter((s) => !count.has(s.name)).map((s) => s.name);
  const index = [
    '# Sign examples for the keyer brief',
    '',
    `Cut by \`node tools/keying/sign-examples.ts --source ${source}\` from the resolved pilot cells (${relative(r.root, outDir) || outDir}). Each image is one cell from the page scan, magnified 4×; the red outline is the cell's box, not print. Read the sign from the image: this index gives no readings, and no cell drawn for a historian's sample is used here.`,
    '',
    '| image | sign | key as | cell |',
    '|---|---|---|---|',
    ...rows,
    '',
    missing.length ? `No example in the resolved cells for: ${missing.join(', ')} (the doubled signs of the pilot were all in column notes).` : '',
    '',
  ].join('\n');
  writeTextFile(join(outDir, 'index.md'), index);
  writeTextFile(join(outDir, 'examples.csv'), writeCsv(EXAMPLE_COLUMNS, csvRows));
  return { written, missing, index };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const r = roots();
  const source = opt('--source') ?? 'sl-rfrkuf_394077458-19140001';
  if (!existsSync(join(r.data, 'raw', assertSafeId('source_id', source)))) { console.error(`no data/raw/${source}`); process.exit(1); }
  const out = opt('--out') ? resolve(opt('--out')!) : join(r.build, 'brief', 'signs');
  makeSignExamples(r, source, { per: Number(opt('--per') ?? 2), out })
    .then((res) => {
      console.log(`${res.written.length} example(s) → ${out}/ (index.md lists them)`);
      if (res.missing.length) console.log(`no example for: ${res.missing.join(', ')}`);
    })
    .catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
