/**
 * The historian's blind sample (HISTORIAN_BRIEF.md).
 *
 *   node tools/keying/sample.ts draw --seed 1914 [--label pilot] [--stop-permille 50] [--fare-permille 100] [--sources a,b]
 *   node tools/keying/sample.ts score --label pilot [--apply]
 *
 * draw: over every resolved crop under data/raw/ (status.csv says resolved and <crop_id>.R.csv
 * exists; skipped crops, e.g. ones superseded by re-keyed "-v2" crops, are never drawn), takes
 * body cells that carry a printed sign (non-blank, not illegible), stratified by (source_id, table_ref): 5% of timetable
 * cells and 10% of fare cells (layout.json table_kind "fares"), at least one per stratum. The choice
 * is deterministic: cells are ordered by sha256("<seed>|<source>|<table>|<kind>|<col>|<row>") and the
 * first n taken, so the same seed and data give the same sample. Writes
 *   data/review/sample-<label>.csv   what the historian fills in: where to look, never the transcription
 *   build/review/sample-<label>/<sample_id>.png   the cell zoomed from the scan, when the page is on disk
 *
 * score: compares the historian's re-reading (reread_text, reread_marks) with the resolved cells.
 * A source whose error rate exceeds 0.5% (5‰) fails: its tables with at least one error are listed
 * for re-keying; --apply marks all their crops rekey in data/raw/status.csv (skipped crops are left
 * as they are). The report is printed
 * and written to build/review/sample-<label>.score.md.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmpStr, readCsvFile, writeCsv, writeTextFile } from './csv.ts';
import { canonicalMarks, cellKey, marksString, normText, parseResolved, type ResolvedCell } from './longcsv.ts';
import { assertSafeId, layoutJson, roots, statusCsv, type Roots } from './paths.ts';
import { cropIsResolved, cropIsSkipped, readStatus, updateStatusFile, type StatusRow } from './status.ts';
import { loadTable } from './crop-files.ts';
import { keyBox, loadLayout, panelForCrop, type CropRow } from '../crops/layout.ts';
import { findPageImage, loadPage, zoomKey, type PageRaw } from '../crops/make-crops.ts';

export const SAMPLE_COLUMNS = [
  'sample_id', 'source_id', 'table_ref', 'page_seq', 'crop_id', 'kind', 'col', 'row', 'page_region', 'rate_permille',
  'reread_text', 'reread_marks', 'reread_sure', 'note',
] as const;

/** Re-key threshold for the historian's sample: 0.5%. */
export const SAMPLE_MAX_ERROR_PERMILLE = 5;

export interface PopulationCell { source_id: string; table_ref: string; crop: CropRow; cell: ResolvedCell; fares: boolean }

/** All resolved body cells with a printed sign, from every table under data/raw/. */
export function collectPopulation(r: Roots, sources?: readonly string[]): PopulationCell[] {
  const raw = join(r.data, 'raw');
  if (!existsSync(raw)) return [];
  const out: PopulationCell[] = [];
  const status = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  for (const source of readdirSync(raw).sort(cmpStr)) {
    if (sources && !sources.includes(source)) continue;
    const sdir = join(raw, source);
    if (source === 'status.csv') continue;
    let tables: string[];
    try { tables = readdirSync(sdir).sort(cmpStr); } catch { continue; }
    for (const table of tables) {
      if (!existsSync(layoutJson(r, source, table)) || !existsSync(join(sdir, table, 'crops.csv'))) continue;
      const t = loadTable(r, source, table);
      const fares = t.layout.table_kind === 'fares';
      for (const crop of t.crops) {
        if (!cropIsResolved(status, source, table, crop.crop_id)) continue;
        const p = join(sdir, table, `${crop.crop_id}.R.csv`);
        if (!existsSync(p)) continue;
        const parsed = parseResolved(readFileSync(p, 'utf8'), { file: p, cropId: crop.crop_id });
        if (parsed.errors.length) throw new Error(`${p}: ${parsed.errors[0]}`);
        for (const cell of parsed.cells) {
          if (cell.kind !== 'cell' || cell.text === '' || cell.sure === 'x' || cell.resolution === 'illegible') continue;
          out.push({ source_id: source, table_ref: table, crop, cell, fares });
        }
      }
    }
  }
  return out;
}

const order = (seed: string, p: PopulationCell) =>
  createHash('sha256').update(`${seed}|${p.source_id}|${p.table_ref}|${p.cell.kind}|${p.cell.col}|${p.cell.row}`).digest('hex');

export interface DrawOptions { seed: string; stopPermille?: number; farePermille?: number }

/** Deterministic stratified draw. */
export function drawSample(pop: readonly PopulationCell[], o: DrawOptions): Array<PopulationCell & { rate: number }> {
  const strata = new Map<string, PopulationCell[]>();
  for (const p of pop) {
    const k = `${p.source_id}\u0000${p.table_ref}`;
    const list = strata.get(k) ?? [];
    // A cell keyed in two crops would appear twice; keep the first.
    if (!list.some((q) => cellKey(q.cell) === cellKey(p.cell))) list.push(p);
    strata.set(k, list);
  }
  const out: Array<PopulationCell & { rate: number }> = [];
  for (const k of [...strata.keys()].sort(cmpStr)) {
    const list = strata.get(k)!;
    const rate = list[0]!.fares ? (o.farePermille ?? 100) : (o.stopPermille ?? 50);
    const n = Math.max(1, Math.ceil((list.length * rate) / 1000));
    const ranked = list.map((p) => ({ p, h: order(o.seed, p) })).sort((a, b) => cmpStr(a.h, b.h)).slice(0, n);
    for (const { p } of ranked.sort((a, b) => a.p.crop.page_seq - b.p.crop.page_seq || a.p.cell.row - b.p.cell.row || a.p.cell.col - b.p.cell.col)) out.push({ ...p, rate });
  }
  return out;
}

export async function runDraw(r: Roots, label: string, o: DrawOptions & { sources?: readonly string[] }): Promise<{ rows: number; csv: string }> {
  assertSafeId('label', label);
  const picked = drawSample(collectPopulation(r, o.sources), o);
  const pages = new Map<string, PageRaw | null>();
  const rows: Array<Record<string, string>> = [];
  let i = 0;
  for (const p of picked) {
    const sampleId = `S${label}-${String(++i).padStart(4, '0')}`;
    const layout = loadLayout(layoutJson(r, p.source_id, p.table_ref));
    const b = keyBox(layout, p.crop, p.cell);
    rows.push({
      sample_id: sampleId, source_id: p.source_id, table_ref: p.table_ref, page_seq: String(p.crop.page_seq), crop_id: p.crop.crop_id,
      kind: p.cell.kind, col: String(p.cell.col), row: String(p.cell.row), page_region: b.join(','), rate_permille: String(p.rate),
      reread_text: '', reread_marks: '', reread_sure: '', note: '',
    });
    const panel = panelForCrop(layout, p.crop);
    const pk = `${p.source_id}:${panel.page_seq}:${panel.deskew_deg ?? 0}`;
    if (!pages.has(pk)) {
      let page: PageRaw | null = null;
      try { page = await loadPage(findPageImage(r, p.source_id, panel.page_seq), panel.deskew_deg ?? 0); } catch { page = null; }
      pages.set(pk, page);
    }
    const page = pages.get(pk);
    if (page) writeTextFile(join(r.build, 'review', `sample-${label}`, `${sampleId}.png`), await zoomKey(page, layout, p.crop, p.cell));
  }
  const csv = writeCsv(SAMPLE_COLUMNS, rows);
  writeTextFile(join(r.data, 'review', `sample-${label}.csv`), csv);
  return { rows: rows.length, csv };
}

export interface ScoreResult {
  read: number; unread: number; errors: number;
  bySource: Array<{ source_id: string; read: number; errors: number; permille: number; fail: boolean; tables: string[] }>;
  mismatches: Array<{ sample_id: string; source_id: string; table_ref: string; expected: string; reread: string }>;
}

export function scoreSample(r: Roots, label: string): ScoreResult {
  assertSafeId('label', label);
  const t = readCsvFile(join(r.data, 'review', `sample-${label}.csv`), SAMPLE_COLUMNS);
  const cache = new Map<string, Map<string, ResolvedCell>>();
  const resolvedFor = (source: string, table: string, crop: string) => {
    const k = `${source}/${table}/${crop}`;
    let m = cache.get(k);
    if (!m) {
      const p = join(r.data, 'raw', source, table, `${crop}.R.csv`);
      const parsed = parseResolved(readFileSync(p, 'utf8'), { file: p });
      m = new Map(parsed.cells.map((c) => [cellKey(c), c]));
      cache.set(k, m);
    }
    return m;
  };
  const res: ScoreResult = { read: 0, unread: 0, errors: 0, bySource: [], mismatches: [] };
  const per = new Map<string, { read: number; errors: number; tables: Set<string> }>();
  for (const row of t.rows) {
    if (!(row.reread_sure ?? '').trim()) { res.unread++; continue; }
    const cell = resolvedFor(row.source_id!, row.table_ref!, row.crop_id!).get(`${row.kind}:${row.col}:${row.row}`);
    const s = per.get(row.source_id!) ?? { read: 0, errors: 0, tables: new Set<string>() };
    s.read++; res.read++;
    const text = normText(row.reread_text ?? ''); const marks = marksString(canonicalMarks(row.reread_marks ?? ''));
    if (!cell || cell.text !== text || marksString(cell.marks) !== marks) {
      s.errors++; res.errors++; s.tables.add(row.table_ref!);
      res.mismatches.push({ sample_id: row.sample_id!, source_id: row.source_id!, table_ref: row.table_ref!, expected: cell ? `${cell.text} [${marksString(cell.marks)}]` : '(cell missing)', reread: `${text} [${marks}]` });
    }
    per.set(row.source_id!, s);
  }
  for (const source of [...per.keys()].sort(cmpStr)) {
    const s = per.get(source)!;
    const permille = Math.floor((s.errors * 1000) / s.read);
    res.bySource.push({ source_id: source, read: s.read, errors: s.errors, permille, fail: s.errors * 1000 > SAMPLE_MAX_ERROR_PERMILLE * s.read, tables: [...s.tables].sort(cmpStr) });
  }
  return res;
}

export function scoreMarkdown(label: string, s: ScoreResult): string {
  const L = [`# Historian sample ${label}: score`, '', `Read ${s.read}, not yet read ${s.unread}, errors ${s.errors}. Threshold: re-key above ${SAMPLE_MAX_ERROR_PERMILLE}‰ (0.5%) per source.`, ''];
  L.push('| source | read | errors | ‰ | verdict | tables with errors |', '|---|---|---|---|---|---|');
  for (const b of s.bySource) L.push(`| ${b.source_id} | ${b.read} | ${b.errors} | ${b.permille} | ${b.fail ? 'RE-KEY' : 'pass'} | ${b.tables.join(', ')} |`);
  if (s.mismatches.length) {
    L.push('', '## Mismatches', '');
    for (const m of s.mismatches) L.push(`- ${m.sample_id} (${m.source_id} ${m.table_ref}): resolved \`${m.expected}\`, historian \`${m.reread}\``);
  }
  return L.join('\n') + '\n';
}

/** Marks every crop of each failing table rekey (a skipped crop stays skipped). */
export function applyScore(r: Roots, s: ScoreResult, label: string): StatusRow[] {
  const updates: StatusRow[] = [];
  const status = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  for (const b of s.bySource.filter((x) => x.fail)) {
    for (const table of b.tables) {
      for (const crop of loadTable(r, b.source_id, table).crops) {
        if (cropIsSkipped(status, b.source_id, table, crop.crop_id)) continue;
        updates.push({ source_id: b.source_id, table_ref: table, crop_id: crop.crop_id, status: 'rekey', agreement_permille: '', note: `historian sample ${label}: ${b.permille}‰ errors in ${b.source_id}` });
      }
    }
  }
  if (updates.length) updateStatusFile(statusCsv(r), updates);
  return updates;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const r = roots();
  const main = async () => {
    if (args[0] === 'draw') {
      const seed = opt('--seed');
      if (!seed) throw new Error('draw needs --seed');
      const label = opt('--label') ?? `s${seed}`;
      const res = await runDraw(r, label, {
        seed, ...(opt('--stop-permille') ? { stopPermille: Number(opt('--stop-permille')) } : {}),
        ...(opt('--fare-permille') ? { farePermille: Number(opt('--fare-permille')) } : {}),
        ...(opt('--sources') ? { sources: opt('--sources')!.split(',') } : {}),
      });
      console.log(`${res.rows} cell(s) → ${join(r.data, 'review', `sample-${label}.csv`)} (zooms in ${join(r.build, 'review', `sample-${label}`)}/)`);
    } else if (args[0] === 'score') {
      const label = opt('--label');
      if (!label) throw new Error('score needs --label');
      const s = scoreSample(r, label);
      const md = scoreMarkdown(label, s);
      writeTextFile(join(r.build, 'review', `sample-${label}.score.md`), md);
      process.stdout.write(md);
      if (args.includes('--apply')) console.log(`${applyScore(r, s, label).length} crop(s) marked rekey`);
      if (s.bySource.some((b) => b.fail)) process.exit(2);
    } else throw new Error('usage: sample.ts draw --seed N [--label L] … | sample.ts score --label L [--apply]');
  };
  main().catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
