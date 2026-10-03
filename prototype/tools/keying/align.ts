/**
 * Alignment of the notes two keyers gave for a footnote or column-notes crop.
 *
 * A note's row is only its position in the keyer's list, and two keyers often list the same notes in
 * a different order (column notes especially: left part, right part, top to bottom is read
 * differently around boxed notes). So notes are matched by content, not by row: by the column marks
 * (`c:<n>`) and by the similarity of the normalised text. Each of B's notes that matches one of A's
 * takes A's row; B's unmatched notes get new rows after A's last, in B's order. Diffing then compares
 * matched notes cell by cell, and an unmatched note becomes missing-A or missing-B. The merged file
 * therefore follows keyer A's order, with notes only B gave at the end.
 */
import type { KeyedCell } from './longcsv.ts';

/** Text for matching: compatibility-normalised, lower case, letters and digits only. */
export function matchText(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

/** Levenshtein distance over code points. */
export function editDistance(x: string, y: string): number {
  const a = [...x]; const b = [...y];
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length]!;
}

/** Edit distance of the match texts divided by the longer length: 0 identical, 1 nothing shared. */
export function textDistance(x: string, y: string): number {
  const a = matchText(x); const b = matchText(y);
  const n = Math.max([...a].length, [...b].length);
  return n === 0 ? 0 : editDistance(a, b) / n;
}

const columnsOf = (c: KeyedCell) => c.marks.filter((m) => m.startsWith('c:')).sort();

/**
 * The largest text distance accepted for a pair, by how their column marks relate, and the cost
 * added to the distance. Same columns tolerate a misread word; other columns need near-identical text.
 */
function pairRule(a: KeyedCell, b: KeyedCell): { limit: number; penalty: number } {
  const ca = columnsOf(a); const cb = columnsOf(b);
  if (ca.join(';') === cb.join(';')) return { limit: 0.5, penalty: 0 };
  if (ca.length === 0 || cb.length === 0) return { limit: 0.35, penalty: 0.1 };
  if (ca.some((c) => cb.includes(c))) return { limit: 0.4, penalty: 0.1 };
  return { limit: 0.25, penalty: 0.2 };
}

export interface NotePair { a: KeyedCell; b: KeyedCell; distance: number }

/** Matches A's and B's notes one to one, cheapest pairs first (ties: nearest rows, then A's order). */
export function matchNotes(a: readonly KeyedCell[], b: readonly KeyedCell[]): NotePair[] {
  const cand: Array<{ i: number; j: number; cost: number; distance: number }> = [];
  a.forEach((x, i) => b.forEach((y, j) => {
    const { limit, penalty } = pairRule(x, y);
    const distance = textDistance(x.text, y.text);
    if (distance <= limit) cand.push({ i, j, cost: distance + penalty, distance });
  }));
  cand.sort((p, q) => p.cost - q.cost
    || Math.abs(a[p.i]!.row - b[p.j]!.row) - Math.abs(a[q.i]!.row - b[q.j]!.row)
    || a[p.i]!.row - a[q.i]!.row || b[p.j]!.row - b[q.j]!.row);
  const usedA = new Set<number>(); const usedB = new Set<number>();
  const pairs: NotePair[] = [];
  for (const p of cand) {
    if (usedA.has(p.i) || usedB.has(p.j)) continue;
    usedA.add(p.i); usedB.add(p.j);
    pairs.push({ a: a[p.i]!, b: b[p.j]!, distance: p.distance });
  }
  return pairs.sort((p, q) => p.a.row - q.a.row);
}

/**
 * Returns B's cells with its footnote lines re-numbered to match A's (see the module comment).
 * Other kinds pass through unchanged. Re-aligning an aligned B gives the same rows.
 */
export function alignNotes(a: readonly KeyedCell[], b: readonly KeyedCell[]): KeyedCell[] {
  const an = a.filter((c) => c.kind === 'footnote').sort((x, y) => x.row - y.row);
  const bn = b.filter((c) => c.kind === 'footnote').sort((x, y) => x.row - y.row);
  if (bn.length === 0) return [...b];
  const pairs = matchNotes(an, bn);
  const rowOf = new Map<KeyedCell, number>(pairs.map((p) => [p.b, p.a.row]));
  let next = an.length ? Math.max(...an.map((c) => c.row)) + 1 : 0;
  const notes = bn.map((c) => ({ ...c, row: rowOf.get(c) ?? next++ }));
  return [...b.filter((c) => c.kind !== 'footnote'), ...notes];
}
