/**
 * A hunter's belief about where a subject is: weighted particles over (station, time), moved
 * only along trains the hunter knows (its own KnownGraph view), reweighted by delivered records,
 * and resampled with keyed draws. Weights are integers. Used by the C07 and C01 prototypes.
 */
import type { Timetable } from '../timetable/model.ts';
import { connections, type GraphView } from '../timetable/expand.ts';
import type { Instant } from '../time/instant.ts';
import { belowN, chancePermille } from '../rng/draw.ts';

export interface Particle { s: number; t: Instant; w: number }

export interface Belief {
  subject: string;
  hunter: string;
  /** Propagation step counter (part of every draw key). */
  step: number;
  particles: Particle[];
}

export const UNIT = 1000;

export function seedBelief(hunter: string, subject: string, stations: readonly number[], t: Instant, n: number): Belief {
  const particles: Particle[] = [];
  for (let i = 0; i < n; i++) particles.push({ s: stations[i % stations.length]!, t, w: UNIT });
  return { subject, hunter, step: 0, particles };
}

export interface PropagateOptions {
  /** Chance (‰) that a particle stays put at each opportunity. */
  stayPermille: number;
  /** Maximum train rides per particle per propagation. */
  maxRides: number;
  /** How many next departures from a station a particle chooses among. */
  fanout: number;
}

export interface RideTrace { particle: number; trip: number; day: number; from: number; to: number }

/** Moves every particle forward to `toT` along the view's trains. Returns the rides taken (for tests and autopsies). */
export function propagate(b: Belief, toT: Instant, tt: Timetable, view: GraphView, seed: number, opts: PropagateOptions): RideTrace[] {
  const rides: RideTrace[] = [];
  const minT = Math.min(...b.particles.map((p) => p.t));
  if (!(minT < toT)) { b.step++; return rides; }
  const c = connections(tt, view, minT, toT);
  // Departures per station, in connection order.
  const byStation = new Map<number, number[]>();
  for (let i = 0; i < c.n; i++) (byStation.get(c.fromSt[i]!) ?? byStation.set(c.fromSt[i]!, []).get(c.fromSt[i]!)!).push(i);
  b.particles.forEach((p, pi) => {
    for (let hop = 0; hop < opts.maxRides; hop++) {
      if (chancePermille(opts.stayPermille, seed, 'hunt-stay', b.hunter, b.subject, b.step, pi, hop)) break;
      const deps = (byStation.get(p.s) ?? []).filter((i) => c.dep[i]! > p.t).slice(0, opts.fanout);
      if (deps.length === 0) break;
      const first = deps[belowN(deps.length, seed, 'hunt-dep', b.hunter, b.subject, b.step, pi, hop)]!;
      // Ride the same trip instance to a later stop that arrives by toT.
      const inst = c.inst[first]!;
      // The rest of this trip instance's hops, in order, as far as they arrive by toT.
      const reachable: number[] = [];
      for (let i = first; i < c.n; i++) {
        if (c.inst[i] !== inst) continue;
        if (c.arr[i]! > toT) break;
        reachable.push(i);
      }
      if (reachable.length === 0) break;
      const alight = reachable[belowN(reachable.length, seed, 'hunt-alight', b.hunter, b.subject, b.step, pi, hop)]!;
      rides.push({ particle: pi, trip: c.trip[alight]!, day: c.day[alight]!, from: p.s, to: c.toSt[alight]! });
      p.s = c.toSt[alight]!;
      p.t = c.arr[alight]!;
    }
    if (p.t < toT) p.t = toT;
  });
  b.step++;
  return rides;
}

/**
 * Reweights by an observation: particles at one of `stations` get `hitPermille`, others
 * `missPermille` (integer). If every weight vanishes, all particles are reseeded at the
 * observation.
 */
export function observe(b: Belief, stations: readonly number[], t: Instant, hitPermille: number, missPermille: number): void {
  const at = new Set(stations);
  let total = 0;
  for (const p of b.particles) {
    p.w = Math.floor((p.w * (at.has(p.s) ? hitPermille : missPermille)) / 1000);
    total += p.w;
  }
  if (total === 0) {
    b.particles.forEach((p, i) => { p.s = stations[i % stations.length]!; p.t = Math.max(p.t, t); p.w = UNIT; });
  }
}

/** Systematic resampling with a keyed offset; weights reset to UNIT. */
export function resample(b: Belief, seed: number): void {
  const n = b.particles.length;
  const total = b.particles.reduce((a, p) => a + p.w, 0);
  if (total === 0 || n === 0) return;
  const stepW = total / n;
  let u = (belowN(1_000_000, seed, 'hunt-resample', b.hunter, b.subject, b.step) / 1_000_000) * stepW;
  const out: Particle[] = [];
  let acc = 0; let j = 0;
  for (let i = 0; i < n; i++) {
    const target = u + i * stepW;
    while (j < n - 1 && acc + b.particles[j]!.w <= target) { acc += b.particles[j]!.w; j++; }
    const src = b.particles[j]!;
    out.push({ s: src.s, t: src.t, w: UNIT });
  }
  b.particles = out;
}

/** Share of belief (‰) on the given stations. */
export function mass(b: Belief, stations: readonly number[]): number {
  const at = new Set(stations);
  let total = 0; let inside = 0;
  for (const p of b.particles) { total += p.w; if (at.has(p.s)) inside += p.w; }
  return total === 0 ? 0 : Math.floor((inside * 1000) / total);
}
