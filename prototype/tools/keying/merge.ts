/**
 * Final resolved file.
 *
 *   node tools/keying/merge.ts <source_id> <table_ref> [crop_id …] [--force]
 *
 * The resolver (RESOLVER_BRIEF.md) writes <crop_id>.R.csv with rows for the disputed cells only.
 * This tool re-diffs A and B, copies every agreed cell with resolution=agree, merges the resolver's
 * decisions and rewrites <crop_id>.R.csv complete (every cell of the crop, sorted). It is idempotent:
 * running it on a merged file gives the same file. Notes (footnote and column-notes crops) are keyed
 * by A's rows: diff.ts matches B's notes to A's by content and numbers notes only B gave after A's
 * last, so the merged notes follow keyer A's order. Cells disputed only in typography need a
 * decision like any other dispute.
 *
 * Checks (any failure leaves the files untouched and reports the problems):
 * - every disputed cell has a decision A | B | other | illegible (agree is not a decision);
 * - A / B: the chosen keyer read the cell; text and marks, if given, equal that reading (blank = copy);
 * - other: sure is y or n (an unreadable cell is "illegible", whose sure is x);
 * - rows for agreed cells, if present, say agree and match the agreed reading;
 * - no row outside the crop; every cell the crop requires is present.
 * A crop at status rekey is refused unless --force. On success status.csv says resolved.
 */
import { existsSync } from 'node:fs';
import { writeTextFile } from './csv.ts';
import { cellKey, marksString, sameReading, writeResolved, type KeyedCell, type ResolvedCell } from './longcsv.ts';
import { keyingCsv, roots, statusCsv, type Roots } from './paths.ts';
import { findStatus, readStatus, updateStatusFile, type StatusRow } from './status.ts';
import { cropOf, loadTable, outsideCrop, readKeyer, readResolvedFile } from './crop-files.ts';
import { diffReadings, valueRulesFor } from './diff.ts';
import { DEFAULT_RULES, type ValueRules } from './value.ts';
import { expectedKeys, type CellKey } from '../crops/layout.ts';

export interface MergeResult { cells: ResolvedCell[]; errors: string[]; counts: Record<string, number> }

/** Pure merge of A, B and the resolver's rows over the crop's expected keys. */
export function mergeResolved(a: readonly KeyedCell[], b: readonly KeyedCell[], resolver: readonly ResolvedCell[], expected: readonly CellKey[], cropId: string, rules: ValueRules = DEFAULT_RULES): MergeResult {
  const d = diffReadings(a, b, expected, rules);
  const A = new Map(a.map((c) => [cellKey(c), c]));
  // B as compared: notes re-numbered to A's rows (align.ts), so resolver rows use A's numbering.
  const B = new Map(d.b.map((c) => [cellKey(c), c]));
  const R = new Map(resolver.map((c) => [cellKey(c), c]));
  const disputed = new Map(d.disagreements.map((x) => [cellKey(x), x]));
  const errors: string[] = [];
  const out: ResolvedCell[] = [];
  const counts: Record<string, number> = { agree: 0, A: 0, B: 0, other: 0, illegible: 0 };

  for (const k of d.agreedKeys) {
    const ca = A.get(k)!; const cb = B.get(k)!;
    const sure = ca.sure === 'n' || cb.sure === 'n' ? 'n' : 'y';
    const rr = R.get(k);
    if (rr && (rr.resolution !== 'agree' || !sameReading(rr, ca))) errors.push(`${k}: A and B agree on "${ca.text}"${ca.marks.length ? ` [${marksString(ca.marks)}]` : ''}; the resolver row says ${rr.resolution || '(blank)'} "${rr.text}"`);
    out.push({ ...ca, crop_id: cropId, sure, resolution: 'agree', note: rr?.note ?? '' });
    counts.agree!++;
  }
  for (const [k, dis] of disputed) {
    const rr = R.get(k);
    if (!rr || rr.resolution === '') { errors.push(`${k}: disputed (${dis.reason}) but no resolution`); continue; }
    if (rr.resolution === 'agree') { errors.push(`${k}: disputed (${dis.reason}); "agree" is not a decision (use A, B, other or illegible)`); continue; }
    const base = { crop_id: cropId, kind: dis.kind, col: dis.col, row: dis.row, note: rr.note };
    if (rr.resolution === 'A' || rr.resolution === 'B') {
      const chosen = rr.resolution === 'A' ? dis.a : dis.b;
      if (!chosen) { errors.push(`${k}: resolution ${rr.resolution} but keyer ${rr.resolution} has no reading for this cell`); continue; }
      const blank = rr.text === '' && rr.marks.length === 0;
      if (!blank && !sameReading(rr, chosen)) { errors.push(`${k}: resolution ${rr.resolution} but the row's text/marks "${rr.text}" [${marksString(rr.marks)}] differ from ${rr.resolution}'s "${chosen.text}" [${marksString(chosen.marks)}] (use other)`); continue; }
      if (chosen.sure === 'x') { errors.push(`${k}: resolution ${rr.resolution} picks a reading its keyer marked illegible (use other or illegible)`); continue; }
      out.push({ ...base, text: chosen.text, marks: chosen.marks, sure: rr.sure === 'n' ? 'n' : chosen.sure, resolution: rr.resolution });
    } else if (rr.resolution === 'other') {
      if (rr.sure === 'x') { errors.push(`${k}: resolution other with sure=x (an unreadable cell is "illegible")`); continue; }
      out.push({ ...base, text: rr.text, marks: rr.marks, sure: rr.sure, resolution: 'other' });
    } else {
      out.push({ ...base, text: rr.text, marks: rr.marks, sure: 'x', resolution: 'illegible' });
    }
    counts[rr.resolution]!++;
  }
  const known = new Set([...d.agreedKeys, ...disputed.keys()]);
  for (const k of R.keys()) if (!known.has(k)) errors.push(`${k}: resolver row for a cell neither keyer nor the crop has`);
  for (const e of expected) if (!out.some((c) => cellKey(c) === cellKey(e)) && !errors.some((x) => x.startsWith(`${cellKey(e)}:`))) errors.push(`${cellKey(e)}: missing from the merged file`);
  return { cells: out, errors, counts };
}

export interface MergeOutcome { crop_id: string; ok: boolean; errors: string[]; status: StatusRow | null }

export function mergeCrop(r: Roots, source: string, table: string, cropId: string, o: { force?: boolean } = {}): MergeOutcome {
  const t = loadTable(r, source, table);
  const crop = cropOf(t, cropId);
  const st = existsSync(statusCsv(r)) ? findStatus(readStatus(statusCsv(r)), source, table, cropId) : undefined;
  if (st?.status === 'rekey' && !o.force) return { crop_id: cropId, ok: false, errors: [`status is rekey (${st.note}); re-key first or --force`], status: null };
  if (st?.status === 'skipped') return { crop_id: cropId, ok: false, errors: ['status is skipped'], status: null };
  const A = readKeyer(r, source, table, cropId, 'A');
  const B = readKeyer(r, source, table, cropId, 'B');
  if (!A || !B) return { crop_id: cropId, ok: false, errors: [`missing ${!A ? 'A' : 'B'} keying`], status: null };
  const R = readResolvedFile(r, source, table, cropId);
  const pre = [...A.errors, ...B.errors, ...(R?.errors ?? []), ...outsideCrop(A.cells, t.layout, crop), ...outsideCrop(B.cells, t.layout, crop), ...outsideCrop(R?.cells ?? [], t.layout, crop)];
  if (pre.length) return { crop_id: cropId, ok: false, errors: pre, status: null };
  const m = mergeResolved(A.cells, B.cells, R?.cells ?? [], expectedKeys(t.layout, crop), cropId, valueRulesFor(r, source));
  if (m.errors.length) return { crop_id: cropId, ok: false, errors: m.errors, status: null };
  writeTextFile(keyingCsv(r, source, table, cropId, 'R'), writeResolved(m.cells));
  const note = (['A', 'B', 'other', 'illegible'] as const).filter((k) => m.counts[k]).map((k) => `${k} ${m.counts[k]}`).join(', ');
  const agreePermille = st?.agreement_permille ?? String(diffReadings(A.cells, B.cells, expectedKeys(t.layout, crop), valueRulesFor(r, source)).permille);
  const status: StatusRow = {
    source_id: source, table_ref: table, crop_id: cropId, status: 'resolved', agreement_permille: agreePermille,
    note: `${m.cells.length} cells; ${note || 'all agreed'}${m.counts.illegible ? ' — illegible cells block compilation unless waived' : ''}`,
  };
  updateStatusFile(statusCsv(r), [status]);
  return { crop_id: cropId, ok: true, errors: [], status };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [source, table, ...ids] = args.filter((a) => !a.startsWith('--'));
  if (!source || !table) { console.error('usage: merge.ts <source_id> <table_ref> [crop_id …] [--force]'); process.exit(1); }
  try {
    const r = roots();
    const crops = ids.length ? ids : loadTable(r, source, table).crops.map((c) => c.crop_id);
    let failed = 0;
    for (const id of crops) {
      const res = mergeCrop(r, source, table, id, { force: args.includes('--force') });
      if (res.ok) console.log(`${id}  resolved  ${res.status!.note}`);
      else { failed++; console.log(`${id}  NOT merged`); for (const e of res.errors.slice(0, 30)) console.log(`    ${e}`); }
    }
    process.exit(failed ? 1 : 0);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
