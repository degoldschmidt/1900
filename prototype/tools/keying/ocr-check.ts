/**
 * Post-check of keyings against the page OCR (decision P-013): did the keyer see the image?
 *
 *   node tools/keying/ocr-check.ts <source_id> [table_ref …] [--min 3] [--out build/reports/ocr-check-<source_id>.md]
 *
 * In the pilot, image reads sometimes failed part-way through an agent's run. A keyer who did not see
 * its crop can still write a well-formed file, and two keyers can then disagree everywhere or, worse,
 * agree on nothing printed. This check compares each keyer's header train numbers, column by column,
 * with the ALTO OCR tokens the library supplies for that region of the page, and flags crops where a
 * keyer's numbers mostly do not appear in the OCR. It is a SIGNAL ONLY: OCR is never a value, never
 * corrects a cell and never decides a dispute. A flagged crop is re-keyed (or its keyer asked whether
 * the image loaded), not "fixed".
 *
 * What is compared (each keyer's file separately, <crop_id>.A.csv and .B.csv, every keying round):
 * - basis "header": the header cells of the guide's train-number line (notation headerLines, or the
 *   table's own headerLines) that contain digits, e.g. "D 53" → 53;
 * - basis "times": tables that print no train numbers in their header (headerLines without train_no)
 *   use the body time cells instead (e.g. "10 22" → 1022);
 * - a keyed number is "judged" when the OCR has at least one token with digits in the cell's region
 *   (its box widened by a quarter of its size), and "found" when one of those tokens has the same
 *   digits, or (for 3 or more digits) contains them;
 * - a keyer's rate is found / judged over the crop.
 * A keyer is "low" on a crop when at least --min (default 3) numbers are judged and fewer than half are
 * found. Real print often defeats the OCR, and then both keyers are low together: that is weak OCR,
 * reported but not flagged. A low keyer is flagged when the OCR is shown to be readable there: its
 * partner on the same crop finds at least half of its numbers (30 points more), or the other crops of
 * the page find at least 60% while the two keyers do not corroborate each other (flagsOf). Pages whose
 * pooled rate is under 25% are reported as "weak".
 *
 * ALTO coordinates are of the page as the library stored the OCR, which on some SLUB pages is the
 * image turned a quarter (width and height swapped). The words are mapped into the layout's frame
 * (the page image turned by the panel's deskew_deg): for swapped ALTO both quarter turns are tried and
 * the one under which the most keyed numbers on the page are found is used (all keyers pooled, so one
 * keyer cannot choose it).
 *
 * Only SLUB sources have ALTO here; other libraries are reported as having no OCR.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { cmpStr, writeTextFile } from './csv.ts';
import { cellRef, parseLong, type KeyedCell } from './longcsv.ts';
import { assertSafeId, httpCacheDir, layoutJson, roots, type Roots } from './paths.ts';
import { keyBox, loadLayout, panelCrop, panelForKey, type Box, type Layout } from '../crops/layout.ts';
import { rotatePoint } from '../crops/propose-layout.ts';
import { findPageImage } from '../crops/make-crops.ts';
import { parseSourceId } from '../discover/catalogue.ts';
import { createHttp } from '../discover/http.ts';
import * as sl from '../discover/slub.ts';

export interface OcrWord { text: string; box: Box }
export interface Size { width: number; height: number }

/** Digits of a reading ("D 53" → "53", "10 22" → "1022"); "" when it has none or an unreadable digit. */
export function digitsOf(text: string): string {
  if (/\?/.test(text)) return '';
  return text.replace(/\D+/g, '');
}

/** Maps a box from ALTO coordinates into the layout frame: undo the ALTO's quarter turn, then turn by deskew_deg. */
export function altoBoxToLayout(b: Box, alto: Size, image: Size, altoTurn: 0 | 90 | 270, deskewDeg: number): Box {
  const corners: Array<[number, number]> = [[b[0], b[1]], [b[0] + b[2], b[1]], [b[0], b[1] + b[3]], [b[0] + b[2], b[1] + b[3]]];
  const pts = corners.map(([x, y]): [number, number] => {
    // The ALTO page is the image turned clockwise by altoTurn; turning it back by -altoTurn gives image pixels.
    const [ix, iy] = altoTurn ? rotatePoint(x, y, -altoTurn, alto.width, alto.height) : [x, y];
    return deskewDeg ? rotatePoint(ix, iy, deskewDeg, image.width, image.height) : [ix, iy];
  });
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs); const y0 = Math.min(...ys);
  return [Math.round(x0), Math.round(y0), Math.round(Math.max(...xs) - x0), Math.round(Math.max(...ys) - y0)];
}

/** The ALTO turns to try: none when its size matches the image, both quarter turns when it is swapped, none usable otherwise. */
export function altoTurns(alto: Size, image: Size): Array<0 | 90 | 270> {
  const near = (a: number, b: number) => Math.abs(a - b) <= 4;
  if (!alto.width || !alto.height) return [0];
  if (near(alto.width, image.width) && near(alto.height, image.height)) return [0];
  if (near(alto.width, image.height) && near(alto.height, image.width)) return [90, 270];
  return [];
}

const centre = (b: Box): [number, number] => [b[0] + b[2] / 2, b[1] + b[3] / 2];
const inside = (p: [number, number], b: Box) => p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] && p[1] <= b[1] + b[3];

/** A keyed cell's region on the page: its box widened by a quarter of its width and height. */
export function regionOf(b: Box): Box {
  const mx = Math.round(b[2] / 4); const my = Math.round(b[3] / 4);
  return [b[0] - mx, b[1] - my, b[2] + 2 * mx, b[3] + 2 * my];
}

export interface Probe { cell: KeyedCell; digits: string; region: Box }

/**
 * Is the keyed number among the OCR tokens of its region? null when the OCR shows no digits there.
 * OCR often splits a time into its hour and its raised minutes ("10", "22"), so two or three tokens
 * next to each other (left to right) are also joined.
 */
export function probe(p: Probe, words: readonly OcrWord[]): boolean | null {
  const near = words.filter((w) => inside(centre(w.box), p.region))
    .sort((a, b) => a.box[0] - b.box[0] || a.box[1] - b.box[1])
    .map((w) => digitsOf(w.text)).filter(Boolean);
  if (near.length === 0) return null;
  const cands = new Set<string>();
  for (let i = 0; i < near.length; i++) {
    let joined = '';
    for (let j = i; j < Math.min(near.length, i + 3); j++) { joined += near[j]!; cands.add(joined); }
  }
  return [...cands].some((d) => d === p.digits || (p.digits.length >= 3 && d.includes(p.digits)));
}

export interface KeyerScore { who: 'A' | 'B'; judged: number; found: number; missing: string[] }
export interface CropCheck {
  table: string; crop_id: string; page_seq: number; basis: 'header' | 'times';
  keyers: KeyerScore[];
  flagged: Array<'A' | 'B'>;
  /** Both keyers low but neither flagged: the OCR is weak here (no evidence either way). */
  weak: boolean;
}
export interface PageOcr { page_seq: number; status: 'ok' | 'weak' | 'unusable' | 'no-ocr'; turn: 0 | 90 | 270 | null; pooled: string; note: string }

export interface CropInput { table: string; crop_id: string; page_seq: number; basis: 'header' | 'times'; probes: Record<'A' | 'B', Probe[]> }

export function scoreKeyer(who: 'A' | 'B', probes: readonly Probe[], words: readonly OcrWord[]): KeyerScore {
  let judged = 0; let found = 0; const missing: string[] = [];
  for (const p of probes) {
    const r = probe(p, words);
    if (r === null) continue;
    judged++;
    if (r) found++; else missing.push(`${cellRef(p.cell)} "${p.cell.text}"`);
  }
  return { who, judged, found, missing };
}

/** Share of the numbers keyed by either keyer that both keyed the same (by cell). */
export function keyerAgreement(a: readonly Probe[], b: readonly Probe[]): number {
  const key = (p: Probe) => `${p.cell.kind}:${p.cell.col}:${p.cell.row}`;
  const B = new Map(b.map((p) => [key(p), p.digits]));
  const all = new Set([...a.map(key), ...b.map(key)]);
  if (all.size === 0) return 0;
  return a.filter((p) => B.get(key(p)) === p.digits).length / all.size;
}

/** Minimum pooled rate (per mille) for a page's OCR to count as readable ("ok" rather than "weak"). */
export const USABLE_PERMILLE = 250;
/** A keyer is "low" on a crop when fewer than half its judged numbers are found. */
export const isLow = (s: KeyerScore, min: number): boolean => s.judged >= min && 2 * s.found < s.judged;
const rate = (s: { found: number; judged: number }) => (s.judged ? s.found / s.judged : 0);

/**
 * Which keyers of a crop to flag. Real print often defeats the OCR, and then both keyers score low
 * together; that is weak OCR, not a blind keyer. So a low keyer is flagged only when the OCR is shown
 * to be readable where it should have matched:
 * - its partner, keying the same crop, finds at least half of its own numbers (and at least 2) and
 *   30 points more than the low keyer; or
 * - the other crops of the same page, pooled, find at least 60%, and the two keyers do not corroborate
 *   each other (fewer than half of their numbers are the same): two keyers who independently key the
 *   same numbers both saw the print, whatever the OCR says. Both keyers of a crop may then be flagged.
 */
export function flagsOf(scores: readonly KeyerScore[], min: number, othersOnPage: { found: number; judged: number } = { found: 0, judged: 0 }, keyersAgree = 0): Array<'A' | 'B'> {
  const pageGood = othersOnPage.judged >= min && rate(othersOnPage) >= 0.6 && keyersAgree < 0.5;
  return scores.filter((s) => {
    if (!isLow(s, min)) return false;
    const partner = scores.find((x) => x.who !== s.who);
    const partnerGood = !!partner && partner.found >= 2 && 2 * partner.found >= partner.judged && rate(partner) - rate(s) >= 0.3;
    return partnerGood || pageGood;
  }).map((s) => s.who);
}

/**
 * Checks the crops of one page against its OCR words given in ALTO coordinates. Chooses the ALTO turn
 * (pooled over all keyers), decides whether the OCR is usable, and scores and flags each crop.
 */
export function checkPage(crops: readonly CropInput[], altoWords: readonly OcrWord[], alto: Size, image: Size, deskewDeg: number, min = 3): { page: PageOcr; crops: CropCheck[] } {
  const seq = crops[0]?.page_seq ?? 0;
  const turns = altoTurns(alto, image);
  if (turns.length === 0) {
    return { page: { page_seq: seq, status: 'unusable', turn: null, pooled: '', note: `ALTO ${alto.width}×${alto.height} does not fit the ${image.width}×${image.height} image` }, crops: [] };
  }
  let best: { turn: 0 | 90 | 270; words: OcrWord[]; judged: number; found: number } | null = null;
  for (const turn of turns) {
    const words = altoWords.map((w) => ({ text: w.text, box: altoBoxToLayout(w.box, alto, image, turn, deskewDeg) }));
    let judged = 0; let found = 0;
    for (const c of crops) for (const who of ['A', 'B'] as const) { const s = scoreKeyer(who, c.probes[who], words); judged += s.judged; found += s.found; }
    if (!best || found > best.found || (found === best.found && judged > best.judged)) best = { turn, words, judged, found };
  }
  const b = best!;
  const pooledPermille = b.judged ? Math.floor((b.found * 1000) / b.judged) : 0;
  const usable = b.judged >= min && pooledPermille >= USABLE_PERMILLE;
  const page: PageOcr = {
    page_seq: seq, status: usable ? 'ok' : 'weak', turn: b.turn, pooled: `${b.found}/${b.judged}`,
    note: usable ? '' : b.judged < min ? 'few keyed numbers lie where the OCR has digits' : `only ${pooledPermille}‰ of all keyed numbers on the page are in the OCR`,
  };
  const scored = crops.map((c) => ({ c, keyers: (['A', 'B'] as const).map((who) => scoreKeyer(who, c.probes[who], b.words)) }));
  const out = scored.map(({ c, keyers }) => {
    const others = scored.filter((x) => x.c !== c).flatMap((x) => x.keyers);
    const pooled = { found: others.reduce((a, k) => a + k.found, 0), judged: others.reduce((a, k) => a + k.judged, 0) };
    const flagged = flagsOf(keyers, min, pooled, keyerAgreement(c.probes.A, c.probes.B));
    const weak = !flagged.length && keyers.every((k) => isLow(k, min));
    return { table: c.table, crop_id: c.crop_id, page_seq: c.page_seq, basis: c.basis, keyers, flagged, weak };
  });
  return { page, crops: out };
}

// ---------------------------------------------------------------- files

/** The header line holding train numbers for a table, from the guide's notation; null when it prints none. */
export function trainNoLine(r: Roots, source: string, table: string): number | null {
  const dir = join(r.data, 'canonical', 'notation');
  if (!existsSync(dir)) return 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort(cmpStr)) {
    try {
      const n = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { src?: string; headerLines?: string[]; tables?: Record<string, { headerLines?: string[] }> };
      if (typeof n.src !== 'string' || !n.src.startsWith(`${source}:`)) continue;
      const lines = n.tables?.[table]?.headerLines ?? n.headerLines ?? ['train_no'];
      const i = lines.indexOf('train_no');
      return i < 0 ? null : i;
    } catch { /* reported by the validators */ }
  }
  return 0; // no notation yet: assume the top header line holds the numbers
}

/** Keyer files of a table, every keying round: crop id → which keyers. */
export function keyerFiles(r: Roots, source: string, table: string): Map<string, Array<'A' | 'B'>> {
  const dir = join(r.data, 'raw', source, table);
  const out = new Map<string, Array<'A' | 'B'>>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).sort(cmpStr)) {
    const m = /^(.+)\.(A|B)\.csv$/.exec(f);
    if (!m) continue;
    out.set(m[1]!, [...(out.get(m[1]!) ?? []), m[2] as 'A' | 'B']);
  }
  return out;
}

/** The probes of one keyer's file: header numbers on the train-number line, or (none printed) body times. */
export function probesOf(layout: Layout, cells: readonly KeyedCell[], trainLine: number | null): { basis: 'header' | 'times'; probes: Probe[]; page: number | null } {
  const basis: 'header' | 'times' = trainLine === null ? 'times' : 'header';
  const probes: Probe[] = [];
  let page: number | null = null;
  for (const c of cells) {
    if (basis === 'header' ? c.kind !== 'header' || c.row !== trainLine : c.kind !== 'cell') continue;
    if (c.sure === 'x') continue;
    const digits = digitsOf(c.text);
    if (basis === 'times' ? digits.length < 3 : digits.length < 1) continue;
    const p = panelForKey(layout, c);
    if (!p) continue;
    page ??= p.page_seq;
    if (p.page_seq !== page) continue;
    probes.push({ cell: c, digits, region: regionOf(keyBox(layout, panelCrop(layout, p), c)) });
  }
  return { basis, probes, page };
}

export interface OcrSource {
  /** ALTO words of a page (ALTO coordinates) and the ALTO page size, or null when there is none. */
  alto(seq: number): Promise<{ size: Size; words: OcrWord[] } | null>;
  /** Size of the page image as stored in scans/. */
  imageSize(seq: number): Promise<Size>;
}

/** The SLUB ALTO (through the HTTP cache) and the scans on disk. */
export function slubOcr(r: Roots, source: string): OcrSource | null {
  const { library, libraryId } = parseSourceId(source);
  if (library !== 'slub') return null;
  const http = createHttp({ cacheDir: httpCacheDir(r) });
  return {
    async alto(seq) {
      const a = sl.parseAlto((await http.get(sl.altoUrl(libraryId, seq), { accept: 'application/xml' })).text());
      return { size: { width: a.width, height: a.height }, words: a.words.map((w) => ({ text: w.text, box: [w.x, w.y, w.w, w.h] as Box })) };
    },
    async imageSize(seq) {
      const m = await sharp(findPageImage(r, source, seq)).metadata();
      return { width: m.width ?? 0, height: m.height ?? 0 };
    },
  };
}

export interface OcrCheckResult { source: string; pages: PageOcr[]; crops: CropCheck[]; skipped: string[] }

export async function runOcrCheck(r: Roots, source: string, o: { tables?: readonly string[]; min?: number; ocr?: OcrSource | null } = {}): Promise<OcrCheckResult> {
  const ocr = o.ocr === undefined ? slubOcr(r, source) : o.ocr;
  const res: OcrCheckResult = { source, pages: [], crops: [], skipped: [] };
  if (!ocr) { res.skipped.push(`${source}: no OCR for this library`); return res; }
  const dir = join(r.data, 'raw', assertSafeId('source_id', source));
  const tables = o.tables?.length ? [...o.tables] : existsSync(dir) ? readdirSync(dir).filter((t) => existsSync(layoutJson(r, source, t))).sort(cmpStr) : [];
  // Group crop inputs by page (and deskew: one page may be read in two frames).
  const byPage = new Map<string, { seq: number; deskew: number; crops: CropInput[] }>();
  for (const table of tables) {
    const layout = loadLayout(layoutJson(r, source, table));
    const line = trainNoLine(r, source, table);
    for (const [cropId, who] of keyerFiles(r, source, table)) {
      if (who.length < 2) { res.skipped.push(`${table}/${cropId}: only keyer ${who.join('')}`); continue; }
      const parsed = (['A', 'B'] as const).map((w) => parseLong(readFileSync(join(dir, table, `${cropId}.${w}.csv`), 'utf8'), { cropId }));
      const pa = probesOf(layout, parsed[0]!.cells, line); const pb = probesOf(layout, parsed[1]!.cells, line);
      const seq = pa.page ?? pb.page;
      if (seq === null) continue; // a footnote or column-notes crop, or nothing to compare
      const panel = layout.panels.find((p) => p.page_seq === seq)!;
      const k = `${seq}:${panel.deskew_deg ?? 0}`;
      const g = byPage.get(k) ?? { seq, deskew: panel.deskew_deg ?? 0, crops: [] };
      g.crops.push({ table, crop_id: cropId, page_seq: seq, basis: pa.basis, probes: { A: pa.probes, B: pb.probes } });
      byPage.set(k, g);
    }
  }
  for (const g of [...byPage.values()].sort((a, b) => a.seq - b.seq || a.deskew - b.deskew)) {
    let alto: Awaited<ReturnType<OcrSource['alto']>>;
    try { alto = await ocr.alto(g.seq); } catch (e) { res.pages.push({ page_seq: g.seq, status: 'no-ocr', turn: null, pooled: '', note: (e as Error).message }); continue; }
    if (!alto) { res.pages.push({ page_seq: g.seq, status: 'no-ocr', turn: null, pooled: '', note: 'no ALTO for this page' }); continue; }
    const checked = checkPage(g.crops, alto.words, alto.size, await ocr.imageSize(g.seq), g.deskew, o.min ?? 3);
    res.pages.push(checked.page);
    res.crops.push(...checked.crops);
  }
  return res;
}

export function ocrCheckMarkdown(res: OcrCheckResult): string {
  const L = [`# OCR check: ${res.source}`, '', 'Keyed header train numbers (or, in tables without numbers, body times) compared with the page\'s ALTO OCR in the same place. A signal that a keyer may not have seen the image, never a value.', ''];
  L.push('## Pages', '', '| page | OCR | ALTO turn | found / judged (all keyers) | note |', '|---|---|---|---|---|');
  for (const p of res.pages) L.push(`| ${p.page_seq} | ${p.status} | ${p.turn ?? ''} | ${p.pooled} | ${p.note} |`);
  const flagged = res.crops.filter((c) => c.flagged.length);
  const weak = res.crops.filter((c) => c.weak);
  L.push('', `## Flagged crops (${flagged.length})`, '');
  if (!flagged.length) L.push('None.');
  for (const c of flagged) {
    for (const who of c.flagged) {
      const s = c.keyers.find((k) => k.who === who)!; const other = c.keyers.find((k) => k.who !== who)!;
      L.push(`- **${c.table} ${c.crop_id}, keyer ${who}** (${c.basis}): ${s.found} of ${s.judged} found in the OCR (keyer ${other.who}: ${other.found} of ${other.judged}). Not found: ${s.missing.slice(0, 8).join(', ')}${s.missing.length > 8 ? ' …' : ''}`);
    }
  }
  L.push('', `## Weak OCR, not flagged (${weak.length})`, '', 'Both keyers are low and nothing shows the OCR is readable there: no evidence either way.', '');
  for (const c of weak) L.push(`- ${c.table} ${c.crop_id} (${c.basis}): ${c.keyers.map((k) => `${k.who} ${k.found}/${k.judged}`).join(', ')}`);
  L.push('', '## All crops', '', '| table | crop | page | basis | A found/judged | B found/judged | flag |', '|---|---|---|---|---|---|---|');
  for (const c of res.crops) {
    const s = (w: 'A' | 'B') => { const k = c.keyers.find((x) => x.who === w)!; return `${k.found}/${k.judged}`; };
    L.push(`| ${c.table} | ${c.crop_id} | ${c.page_seq} | ${c.basis} | ${s('A')} | ${s('B')} | ${c.flagged.join('+') || (c.weak ? 'weak OCR' : '')} |`);
  }
  if (res.skipped.length) L.push('', '## Not checked', '', ...res.skipped.map((x) => `- ${x}`));
  return L.join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--min', '--out'].includes(args[i - 1]!)));
  const [source, ...tables] = pos;
  if (!source) { console.error('usage: ocr-check.ts <source_id> [table_ref …] [--min 3] [--out file.md]'); process.exit(1); }
  const r = roots();
  runOcrCheck(r, source, { tables, min: Number(opt('--min') ?? 3) })
    .then((res) => {
      const md = ocrCheckMarkdown(res);
      const out = opt('--out') ?? join(r.build, 'reports', `ocr-check-${source}.md`);
      writeTextFile(out, md);
      const flagged = res.crops.filter((c) => c.flagged.length);
      console.log(`${res.crops.length} crop(s) checked on ${res.pages.length} page(s); ${res.pages.filter((p) => p.status !== 'ok').length} page(s) with weak or no OCR; ${flagged.length} crop(s) flagged, ${res.crops.filter((c) => c.weak).length} with weak OCR → ${out}`);
      for (const c of flagged) console.log(`  FLAG ${c.table} ${c.crop_id} keyer ${c.flagged.join('+')} (${c.keyers.map((k) => `${k.who} ${k.found}/${k.judged}`).join(', ')})`);
      for (const p of res.pages.filter((x) => x.status !== 'ok')) console.log(`  page ${p.page_seq}: ${p.status} (${p.note})`);
    })
    .catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
