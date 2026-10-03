/**
 * Keyed draws. There is no sequential random stream: every draw is a pure function of
 * (seed, purpose, ...ids), so lazy and eager evaluation agree and replay never depends on the
 * order in which draws happen.
 */
import { mixKey, type KeyPart } from './hash.ts';

const TWO32 = 4294967296;

export function u32(seed: number, purpose: string, ...ids: KeyPart[]): number {
  return mixKey(seed, purpose, ...ids);
}

/** Uniform integer in [0, n). Exact multiply-shift (no modulo bias beyond 2^-32). */
export function belowN(n: number, seed: number, purpose: string, ...ids: KeyPart[]): number {
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`belowN needs a positive integer, got ${n}`);
  const u = mixKey(seed, purpose, ...ids);
  if (n <= 0x200000) return Math.floor((u * n) / TWO32);
  return Number((BigInt(u) * BigInt(n)) >> 32n);
}

/** True with probability permille/1000. */
export function chancePermille(permille: number, seed: number, purpose: string, ...ids: KeyPart[]): boolean {
  if (permille <= 0) return false;
  if (permille >= 1000) return true;
  return belowN(1000, seed, purpose, ...ids) < permille;
}

/**
 * Picks an index from an integer CDF (cumulative weights, strictly increasing, last = total).
 * Example: weights [3, 5, 2] → cdf [3, 8, 10].
 */
export function pickCdf(cdf: readonly number[], seed: number, purpose: string, ...ids: KeyPart[]): number {
  const total = cdf[cdf.length - 1];
  if (total === undefined || total <= 0) throw new Error('pickCdf needs a non-empty CDF with a positive total');
  const r = belowN(total, seed, purpose, ...ids);
  let lo = 0; let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (r < cdf[mid]!) hi = mid; else lo = mid + 1;
  }
  return lo;
}

export function cdfOf(weights: readonly number[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const w of weights) {
    if (!Number.isInteger(w) || w < 0) throw new Error(`Weights must be non-negative integers, got ${w}`);
    acc += w;
    out.push(acc);
  }
  return out;
}

/** A drawer bound to one seed: draw(purpose, ...ids). */
export interface Drawer {
  readonly seed: number;
  u32(purpose: string, ...ids: KeyPart[]): number;
  below(n: number, purpose: string, ...ids: KeyPart[]): number;
  chance(permille: number, purpose: string, ...ids: KeyPart[]): boolean;
  pick(cdf: readonly number[], purpose: string, ...ids: KeyPart[]): number;
}

export function drawer(seed: number): Drawer {
  return {
    seed,
    u32: (p, ...ids) => u32(seed, p, ...ids),
    below: (n, p, ...ids) => belowN(n, seed, p, ...ids),
    chance: (pm, p, ...ids) => chancePermille(pm, seed, p, ...ids),
    pick: (cdf, p, ...ids) => pickCdf(cdf, seed, p, ...ids),
  };
}
