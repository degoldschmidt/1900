/**
 * Exact earliest-arrival answers memoised per (graph view, origin, absolute hour bucket).
 * EA(origin, t) is piecewise constant between "critical" start times (a departure from the
 * origin, or from a station within walking distance minus the walk), so one CSA run per critical
 * time answers every t in the bucket exactly. Targets reachable on foot are added as t + walk.
 */
import type { Timetable } from './model.ts';
import { connections, type GraphView } from './expand.ts';
import { earliestArrival } from './csa.ts';
import type { Instant } from '../time/instant.ts';
import { hourBucket, SECONDS_PER_HOUR } from '../time/instant.ts';

interface Entry { results: Map<number, Float64Array> }

export class ProfileCache {
  private readonly tt: Timetable;
  private readonly horizonSec: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, Entry>();
  hits = 0;
  misses = 0;

  constructor(tt: Timetable, opts: { horizonSec: number; maxEntries?: number }) {
    this.tt = tt;
    this.horizonSec = opts.horizonSec;
    this.maxEntries = opts.maxEntries ?? 4000;
  }

  /** Smallest critical start time ≥ t for this origin (within the horizon), or null. */
  private nextCritical(view: GraphView, origin: number, t: Instant): number | null {
    const walks = new Map<number, number>([[origin, 0]]);
    for (const fp of this.tt.footpaths[origin]!) walks.set(fp.to, fp.sec);
    const maxWalk = Math.max(...walks.values());
    const c = connections(this.tt, view, t, t + this.horizonSec + maxWalk);
    let best: number | null = null;
    for (let i = 0; i < c.n; i++) {
      const w = walks.get(c.fromSt[i]!);
      if (w === undefined) continue;
      const crit = c.dep[i]! - w;
      if (crit >= t && (best === null || crit < best)) best = crit;
    }
    return best;
  }

  private eaFrom(view: GraphView, origin: number, start: Instant): Float64Array {
    const key = `${view.key}|${origin}|${hourBucket(start)}`;
    let entry = this.entries.get(key);
    if (entry) { this.entries.delete(key); this.entries.set(key, entry); } // LRU touch
    else {
      entry = { results: new Map() };
      this.entries.set(key, entry);
      if (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
    }
    const hit = entry.results.get(start);
    if (hit) { this.hits++; return hit; }
    this.misses++;
    const c = connections(this.tt, view, start, start + this.horizonSec);
    const arr = earliestArrival(this.tt, c, [{ station: origin, t: start }]).arr;
    entry.results.set(start, arr);
    return arr;
  }

  /** Earliest arrival at `target` leaving `origin` no earlier than `t` (Infinity if none within the horizon). */
  earliest(view: GraphView, origin: number, t: Instant, target: number): number {
    if (target === origin) return t;
    const walk = this.tt.footpaths[origin]!.find((f) => f.to === target)?.sec;
    const viaWalk = walk === undefined ? Infinity : t + walk;
    const crit = this.nextCritical(view, origin, t);
    if (crit === null || crit > t + this.horizonSec) return viaWalk;
    const arr = this.eaFrom(view, origin, crit)[target]!;
    return Math.min(viaWalk, arr);
  }

  /** Earliest arrival at any station of `targets`. */
  earliestAny(view: GraphView, origin: number, t: Instant, targets: readonly number[]): number {
    let best = Infinity;
    for (const s of targets) best = Math.min(best, this.earliest(view, origin, t, s));
    return best;
  }

  get size(): number { return this.entries.size; }
}

export { SECONDS_PER_HOUR };
