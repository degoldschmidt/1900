/**
 * Scores keyings of synthetic pages against their ground truth.
 *
 *   P1900_DATA=build/synth/data node tools/synth/score.ts <source_id> <table_ref> [--json out.json]
 *
 * Reads truth.csv, layout.json and crops.csv of the table and every <crop_id>.A.csv, .B.csv
 * (single keyers) and .R.csv (resolved). For each keyed file, the cells the crop requires (or, for a
 * footnote crop, the true footnote lines) are compared with the truth:
 *   wrong     text or marks differ (text compared after whitespace trimming and NFC only)
 *   missing   the keyer gave no line for a required cell
 *   spurious  a line for a cell the crop does not have
 *   abstained sure=x (counted apart: an honest "cannot read" is not an error, but is reported)
 * cell error rate = (wrong + missing + spurious) / required.
 * value error rate counts only wrong cells whose difference changes what the data means: the
 *   separator printed between figures (space, point, raised point, colon, comma) and the italic and
 *   small-capital marks are typography, as is bold outside body cells (emphasis on station names and
 *   train numbers), and so are leader dots after a label (tools/keying/value.ts); bold on a body time (p.m. in many guides), underlining and footnote marks are not. The targets (PLAN.md, Data workstream 5: single keyer ≤ 1.0%, resolved ≤ 0.1%) apply to the
 *   value error rate (decision P-003); the exact rate is reported beside it.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cmpStr, writeTextFile } from '../keying/csv.ts';
import { cellKey, KINDS, marksString, parseLong, parseResolved, type KeyedCell, type Kind } from '../keying/longcsv.ts';
import { rawDir, roots, type Roots } from '../keying/paths.ts';
import { valueOf } from '../keying/value.ts';
import { loadTable } from '../keying/crop-files.ts';
import { expectedKeys, type CellKey } from '../crops/layout.ts';

export const TARGET_SINGLE_PERMILLE = 10;
export const TARGET_RESOLVED_PERMILLE = 1;

export interface Tally { required: number; wrong: number; missing: number; spurious: number; abstained: number; valueWrong: number }

export interface Score {
  total: Tally;
  byKind: Record<Kind, Tally>;
  /** "3→8" style confusions (character level when lengths match, whole strings otherwise), and mark changes. */
  confusions: Array<{ what: string; n: number }>;
  errors: Array<{ key: string; truth: string; keyed: string; why: 'wrong' | 'missing' | 'spurious' }>;
}

const zero = (): Tally => ({ required: 0, wrong: 0, missing: 0, spurious: 0, abstained: 0, valueWrong: 0 });

export const errorPermille = (t: Tally): number => (t.required ? ((t.wrong + t.missing + t.spurious) * 1000) / t.required : 0);
export const valuePermille = (t: Tally): number => (t.required ? ((t.valueWrong + t.missing + t.spurious) * 1000) / t.required : 0);

/** The value function is shared with the keyer diff (tools/keying/value.ts); re-exported for callers. */
export { valueOf };

const show = (c: Pick<KeyedCell, 'text' | 'marks'>) => `${c.text}${c.marks.length ? ` [${marksString(c.marks)}]` : ''}`;

/** Character-level differences of two strings of equal length; whole strings otherwise. */
export function confusionsOf(truth: string, keyed: string): string[] {
  if (truth.length === keyed.length) {
    const out: string[] = [];
    for (let i = 0; i < truth.length; i++) if (truth[i] !== keyed[i]) out.push(`${truth[i]}→${keyed[i]}`);
    return out;
  }
  return [`"${truth}"→"${keyed}"`];
}

/** Scores one keyed file against the truth over the required keys. */
export function scoreCells(truth: readonly KeyedCell[], keyed: readonly KeyedCell[], required: readonly CellKey[]): Score {
  const T = new Map(truth.map((c) => [cellKey(c), c]));
  const K = new Map(keyed.map((c) => [cellKey(c), c]));
  const req = new Set(required.map(cellKey));
  const byKind = Object.fromEntries(KINDS.map((k) => [k, zero()])) as Record<Kind, Tally>;
  const total = zero();
  const conf = new Map<string, number>();
  const errors: Score['errors'] = [];
  const bump = (kind: Kind, f: keyof Tally) => { byKind[kind][f]++; total[f]++; };
  const confuse = (w: string) => conf.set(w, (conf.get(w) ?? 0) + 1);
  for (const k of required) {
    const key = cellKey(k);
    bump(k.kind, 'required');
    const t = T.get(key); const c = K.get(key);
    const truthText = t ? show(t) : '(blank)';
    if (!c) { bump(k.kind, 'missing'); errors.push({ key, truth: truthText, keyed: '(none)', why: 'missing' }); continue; }
    if (c.sure === 'x') { bump(k.kind, 'abstained'); continue; }
    const tt = t?.text ?? ''; const tm = t ? marksString(t.marks) : '';
    if (c.text === tt && marksString(c.marks) === tm) continue;
    bump(k.kind, 'wrong');
    if (valueOf(c, k.kind) !== valueOf(t ?? { text: '', marks: [] }, k.kind)) bump(k.kind, 'valueWrong');
    errors.push({ key, truth: truthText, keyed: show(c), why: 'wrong' });
    if (c.text !== tt) for (const w of confusionsOf(tt, c.text)) confuse(w);
    const km = new Set(c.marks); const tms = new Set(t?.marks ?? []);
    for (const m of tms) if (!km.has(m)) confuse(`-${m}`);
    for (const m of km) if (!tms.has(m)) confuse(`+${m}`);
  }
  for (const [key, c] of K) {
    if (req.has(key)) continue;
    bump(c.kind, 'spurious');
    errors.push({ key, truth: '(not in crop)', keyed: show(c), why: 'spurious' });
  }
  const confusions = [...conf.entries()].map(([what, n]) => ({ what, n })).sort((a, b) => b.n - a.n || cmpStr(a.what, b.what));
  return { total, byKind, confusions, errors };
}

export function addTally(a: Tally, b: Tally): Tally {
  return { required: a.required + b.required, wrong: a.wrong + b.wrong, missing: a.missing + b.missing, spurious: a.spurious + b.spurious, abstained: a.abstained + b.abstained, valueWrong: a.valueWrong + b.valueWrong };
}

export interface TableScore {
  files: Array<{ file: string; who: 'A' | 'B' | 'R'; score: Score }>;
  single: Tally;
  resolved: Tally;
  singleMet: boolean | null;
  resolvedMet: boolean | null;
  confusions: Array<{ what: string; n: number }>;
}

export function scoreTable(r: Roots, source: string, table: string): TableScore {
  const dir = rawDir(r, source, table);
  const truthFile = join(dir, 'truth.csv');
  if (!existsSync(truthFile)) throw new Error(`no ground truth ${truthFile} (only synthetic pages can be scored)`);
  const truth = parseLong(readFileSync(truthFile, 'utf8'), { file: truthFile });
  if (truth.errors.length) throw new Error(truth.errors.join('\n'));
  const t = loadTable(r, source, table);
  const files: TableScore['files'] = [];
  for (const name of readdirSync(dir).sort(cmpStr)) {
    const m = /^(.+)\.(A|B|R)\.csv$/.exec(name);
    if (!m) continue;
    const crop = t.crops.find((c) => c.crop_id === m[1]);
    if (!crop) continue;
    const text = readFileSync(join(dir, name), 'utf8');
    const parsed = m[2] === 'R' ? parseResolved(text, { file: name }) : parseLong(text, { file: name });
    const required: CellKey[] = crop.footnotes ? truth.cells.filter((c) => c.kind === 'footnote') : expectedKeys(t.layout, crop);
    files.push({ file: name, who: m[2] as 'A' | 'B' | 'R', score: scoreCells(truth.cells, parsed.cells, required) });
  }
  let single = zero(); let resolved = zero();
  const conf = new Map<string, number>();
  for (const f of files) {
    if (f.who === 'R') resolved = addTally(resolved, f.score.total); else single = addTally(single, f.score.total);
    if (f.who !== 'R') for (const c of f.score.confusions) conf.set(c.what, (conf.get(c.what) ?? 0) + c.n);
  }
  return {
    files, single, resolved,
    singleMet: single.required ? valuePermille(single) <= TARGET_SINGLE_PERMILLE : null,
    resolvedMet: resolved.required ? valuePermille(resolved) <= TARGET_RESOLVED_PERMILLE : null,
    confusions: [...conf.entries()].map(([what, n]) => ({ what, n })).sort((a, b) => b.n - a.n || cmpStr(a.what, b.what)),
  };
}

const pct = (t: Tally) => `${(errorPermille(t) / 10).toFixed(2)}%`;
const vpct = (t: Tally) => `${(valuePermille(t) / 10).toFixed(2)}%`;

export function reportText(s: TableScore): string {
  const L: string[] = [];
  for (const f of s.files) {
    const k = f.score.byKind;
    L.push(`${f.file.padEnd(34)} value ${vpct(f.score.total).padStart(7)}  exact ${pct(f.score.total).padStart(7)}  (wrong ${f.score.total.wrong}, of which value ${f.score.total.valueWrong}; missing ${f.score.total.missing}, spurious ${f.score.total.spurious}, abstained ${f.score.total.abstained} of ${f.score.total.required})  ` +
      KINDS.filter((x) => k[x].required).map((x) => `${x} ${pct(k[x])}`).join(', '));
  }
  L.push('');
  if (s.singleMet !== null) L.push(`single keyer: value ${vpct(s.single)} (exact ${pct(s.single)}) over ${s.single.required} cells, ${s.single.abstained} abstained — target ≤ 1.0%: ${s.singleMet ? 'MET' : 'NOT MET'}`);
  if (s.resolvedMet !== null) L.push(`resolved:     value ${vpct(s.resolved)} (exact ${pct(s.resolved)}) over ${s.resolved.required} cells, ${s.resolved.abstained} illegible — target ≤ 0.1%: ${s.resolvedMet ? 'MET' : 'NOT MET'}`);
  if (s.confusions.length) L.push(`confusions (single keyers): ${s.confusions.slice(0, 15).map((c) => `${c.what} ×${c.n}`).join(', ')}`);
  return L.join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [source, table] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--json');
  if (!source || !table) { console.error('usage: score.ts <source_id> <table_ref> [--json out.json]'); process.exit(1); }
  try {
    const s = scoreTable(roots(), source, table);
    process.stdout.write(reportText(s));
    const j = args.indexOf('--json');
    if (j >= 0 && args[j + 1]) writeTextFile(args[j + 1]!, JSON.stringify(s, null, 1) + '\n');
    process.exit(s.singleMet === false || s.resolvedMet === false ? 2 : 0);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
