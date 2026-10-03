/**
 * Diff of two independent keyings.
 *
 *   node tools/keying/diff.ts <source_id> <table_ref> [crop_id …] [--force]
 *
 * For every crop in crops.csv (or those named) with both <crop_id>.A.csv and .B.csv, aligns the two
 * readings by (kind, col, row) and compares text_as_printed and marks. Notes (kind footnote, in
 * footnote and column-notes crops) are first matched by content (tools/keying/align.ts), since
 * their row is only a position in each keyer's list. A cell agrees when both keyers read the same
 * text and marks and neither marked it illegible (sure=x). Cells the crop requires but a keyer left
 * out, and notes only one keyer gave, are disagreements.
 *
 * Readings that differ only in typography (tools/keying/value.ts: separators, italic, bold off the
 * body, leader dots, a sign after a station name keyed in the text rather than as fn:) get reason
 * `typography`. They go to the resolver, who decides the exact print, but like `doubtful` cells
 * they count as concordant in the agreement figure.
 *
 * Writes <crop_id>.diff.csv (the disagreements) and updates data/raw/status.csv with the agreement
 * in per mille of all compared cells: below 950‰ the crop is marked rekey, otherwise diffed.
 * A malformed keyer file (bad columns, unknown marks, duplicate or out-of-crop cells) marks the crop
 * rekey without diffing. Crops already resolved or skipped are left alone unless --force.
 */
import { existsSync } from 'node:fs';
import { writeCsv, writeTextFile } from './csv.ts';
import { cellKey, marksString, sameReading, sortCells, type KeyedCell, type Kind } from './longcsv.ts';
import { diffCsv, roots, statusCsv, type Roots } from './paths.ts';
import { findStatus, readStatus, REKEY_BELOW_PERMILLE, updateStatusFile, type StatusRow } from './status.ts';
import { cropOf, loadTable, outsideCrop, readKeyer } from './crop-files.ts';
import { expectedKeys, type CellKey } from '../crops/layout.ts';
import { alignNotes } from './align.ts';
import { valueParts, rulesFromNotation, DEFAULT_RULES, type ValueRules } from './value.ts';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Reason = 'text' | 'marks' | 'text+marks' | 'typography' | 'missing-A' | 'missing-B' | 'illegible' | 'doubtful';
export const REASONS: readonly Reason[] = ['text', 'marks', 'text+marks', 'typography', 'missing-A', 'missing-B', 'illegible', 'doubtful'];

export interface Disagreement {
  kind: Kind;
  col: number;
  row: number;
  reason: Reason;
  a: KeyedCell | null;
  b: KeyedCell | null;
}

export interface DiffResult {
  total: number;
  /** Cells both keyers read the same way with no doubt. */
  agreed: number;
  /** Cells both read the same way but at least one marked sure=n; they go to the resolver. */
  doubtful: number;
  /** Cells whose readings differ only in typography (same value); they go to the resolver. */
  typography: number;
  /** Keyer concordance: (agreed + doubtful + typography + identical abstentions) per mille of all cells. */
  permille: number;
  disagreements: Disagreement[];
  agreedKeys: string[];
  /** B's cells as compared: its notes re-numbered to match A's (align.ts); other cells unchanged. */
  b: KeyedCell[];
}

export const DIFF_COLUMNS = ['crop_id', 'kind', 'col', 'row', 'reason', 'a_text', 'a_marks', 'a_sure', 'b_text', 'b_marks', 'b_sure'] as const;

/** Compares two readings over expected ∪ A ∪ B, after matching B's notes to A's by content. */
/**
 * Value rules for a source: from the notation file in data/canonical/notation/ whose `src` cites this
 * source (decision P-010: `valueMarks` for body cells; P-013: `category.marks` on header cells), or
 * the default rules when the guide has none yet.
 */
export function valueRulesFor(r: Roots, source: string): ValueRules {
  const dir = join(r.data, 'canonical', 'notation');
  if (!existsSync(dir)) return DEFAULT_RULES;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    try {
      const n = JSON.parse(readFileSync(join(dir, f), 'utf8')) as { src?: string; valueMarks?: string[]; category?: { marks?: Record<string, string> } };
      if (typeof n.src === 'string' && n.src.startsWith(`${source}:`)) return rulesFromNotation(n);
    } catch { /* an unreadable notation file is reported by the validators */ }
  }
  return DEFAULT_RULES;
}

export function diffReadings(a: readonly KeyedCell[], bRaw: readonly KeyedCell[], expected: readonly CellKey[] = [], rules: ValueRules = DEFAULT_RULES): DiffResult {
  const b = alignNotes(a, bRaw);
  const A = new Map(a.map((c) => [cellKey(c), c]));
  const B = new Map(b.map((c) => [cellKey(c), c]));
  const keys = new Map<string, CellKey>();
  for (const k of [...expected, ...a, ...b]) keys.set(cellKey(k), { kind: k.kind, col: k.col, row: k.row });
  const dis: Disagreement[] = [];
  const agreedKeys: string[] = [];
  let doubtful = 0;
  let typography = 0;
  let bothIllegible = 0;
  for (const [k, ck] of keys) {
    const ca = A.get(k) ?? null; const cb = B.get(k) ?? null;
    let reason: Reason | null = null;
    if (!ca) reason = 'missing-A';
    else if (!cb) reason = 'missing-B';
    else if (ca.sure === 'x' || cb.sure === 'x') {
      reason = 'illegible';
      // Both keyers abstaining on the same reading is concordance, not divergence.
      if (ca.sure === 'x' && cb.sure === 'x' && sameReading(ca, cb)) bothIllegible++;
    }
    else if (!sameReading(ca, cb)) {
      // Classified by value: a difference in typography alone is not a difference in text or marks.
      const va = valueParts(ca, ck.kind, rules); const vb = valueParts(cb, ck.kind, rules);
      const t = va.text !== vb.text; const m = va.marks !== vb.marks;
      reason = t && m ? 'text+marks' : t ? 'text' : m ? 'marks' : 'typography';
      if (reason === 'typography') typography++;
    } else if (ca.sure === 'n' || cb.sure === 'n') {
      // Same reading, but a keyer doubted it. Two keyers can share a misreading (calibration round 1
      // found every residual error was shared), so doubted cells go to the resolver's zoom too.
      reason = 'doubtful';
      doubtful++;
    }
    if (reason) dis.push({ ...ck, reason, a: ca, b: cb });
    else agreedKeys.push(k);
  }
  const total = keys.size;
  // Agreement measures concordance between keyers: a doubted but identical reading counts as agreed,
  // and so do readings with the same value in different typography, and the same abstention by both.
  const concordant = agreedKeys.length + doubtful + typography + bothIllegible;
  return { total, agreed: agreedKeys.length, doubtful, typography, permille: total ? Math.floor((concordant * 1000) / total) : 0, disagreements: sortCells(dis), agreedKeys, b };
}

export function writeDiff(cropId: string, d: DiffResult): string {
  return writeCsv(DIFF_COLUMNS, d.disagreements.map((x) => ({
    crop_id: cropId, kind: x.kind, col: String(x.col), row: String(x.row), reason: x.reason,
    a_text: x.a?.text ?? '', a_marks: x.a ? marksString(x.a.marks) : '', a_sure: x.a?.sure ?? '',
    b_text: x.b?.text ?? '', b_marks: x.b ? marksString(x.b.marks) : '', b_sure: x.b?.sure ?? '',
  })));
}

export interface CropDiffOutcome { crop_id: string; status: StatusRow; diff: DiffResult | null; problems: string[] }

/** Diffs one crop's A and B files and returns the new status row (does not write status.csv). */
export function diffCrop(r: Roots, source: string, table: string, cropId: string): CropDiffOutcome {
  const t = loadTable(r, source, table);
  const crop = cropOf(t, cropId);
  const base = { source_id: source, table_ref: table, crop_id: cropId };
  const A = readKeyer(r, source, table, cropId, 'A');
  const B = readKeyer(r, source, table, cropId, 'B');
  if (!A || !B) {
    const missing = [!A ? 'A' : '', !B ? 'B' : ''].filter(Boolean).join(' and ');
    return { crop_id: cropId, diff: null, problems: [], status: { ...base, status: 'keyed', agreement_permille: '', note: `waiting for ${missing}` } };
  }
  const problems = [
    ...A.errors.map((e) => `A: ${e}`), ...outsideCrop(A.cells, t.layout, crop).map((e) => `A: ${e}`),
    ...B.errors.map((e) => `B: ${e}`), ...outsideCrop(B.cells, t.layout, crop).map((e) => `B: ${e}`),
  ];
  if (problems.length) {
    const who = [...new Set(problems.map((p) => p[0]))].join('+');
    return { crop_id: cropId, diff: null, problems, status: { ...base, status: 'rekey', agreement_permille: '', note: `malformed keyer file (${who}): ${problems.length} problem(s); first: ${problems[0]!.slice(0, 160)}` } };
  }
  const d = diffReadings(A.cells, B.cells, expectedKeys(t.layout, crop), valueRulesFor(r, source));
  writeTextFile(diffCsv(r, source, table, cropId), writeDiff(cropId, d));
  const rekey = d.permille < REKEY_BELOW_PERMILLE;
  const note = `${d.disagreements.length - d.doubtful - d.typography} of ${d.total} cells disagree, ${d.typography} in typography only, ${d.doubtful} doubted${rekey ? ` (below ${REKEY_BELOW_PERMILLE}‰: re-key)` : ''}`;
  return { crop_id: cropId, diff: d, problems, status: { ...base, status: rekey ? 'rekey' : 'diffed', agreement_permille: String(d.permille), note } };
}

/** Diffs the named crops (default: all in crops.csv) and updates status.csv. */
export function runDiff(r: Roots, source: string, table: string, o: { crops?: readonly string[]; force?: boolean } = {}): CropDiffOutcome[] {
  const t = loadTable(r, source, table);
  const ids = o.crops && o.crops.length ? o.crops : t.crops.map((c) => c.crop_id);
  const current = existsSync(statusCsv(r)) ? readStatus(statusCsv(r)) : [];
  const out: CropDiffOutcome[] = [];
  for (const id of ids) {
    const st = findStatus(current, source, table, id);
    if (!o.force && st && (st.status === 'resolved' || st.status === 'skipped')) continue;
    out.push(diffCrop(r, source, table, id));
  }
  updateStatusFile(statusCsv(r), out.map((o) => o.status));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const pos = args.filter((a) => !a.startsWith('--'));
  const [source, table, ...crops] = pos;
  if (!source || !table) { console.error('usage: diff.ts <source_id> <table_ref> [crop_id …] [--force]'); process.exit(1); }
  try {
    const res = runDiff(roots(), source, table, { crops, force: args.includes('--force') });
    for (const o of res) {
      console.log(`${o.crop_id}  ${o.status.status}  ${o.status.agreement_permille ? `${o.status.agreement_permille}‰` : ''}  ${o.status.note}`);
      for (const p of o.problems.slice(0, 20)) console.log(`    ${p}`);
    }
    if (res.length === 0) console.log('nothing to diff (all crops resolved or skipped; --force to redo)');
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
