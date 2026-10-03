/**
 * Itineraries for planners: Pareto-optimal journeys by (arrival, number of trains), found by a
 * round-based connection scan (round k = journeys using at most k trains). Slack is the time to
 * spare at each change beyond the minimum change time.
 */
import type { Timetable } from './model.ts';
import { connections, type GraphView } from './expand.ts';
import type { Leg } from './csa.ts';
import type { Instant } from '../time/instant.ts';

export interface Itinerary {
  legs: Leg[];
  dep: Instant;
  arr: Instant;
  trains: number;
  /** Slack (seconds) at each change between consecutive rides, after the minimum change time. */
  slack: number[];
}

export interface PlanOptions { horizonSec: number; maxTrains?: number }

export function itineraries(tt: Timetable, view: GraphView, from: readonly number[], t: Instant, to: readonly number[], opts: PlanOptions): Itinerary[] {
  const K = opts.maxTrains ?? 4;
  const ns = tt.stationIds.length;
  const c = connections(tt, view, t, t + opts.horizonSec);
  const arr: Float64Array[] = []; const ready: Float64Array[] = []; const viaConn: Int32Array[] = []; const viaFoot: Int32Array[] = [];
  for (let k = 0; k <= K; k++) {
    arr.push(new Float64Array(ns).fill(Infinity)); ready.push(new Float64Array(ns).fill(Infinity));
    viaConn.push(new Int32Array(ns).fill(-1)); viaFoot.push(new Int32Array(ns).fill(-1));
  }
  const relax = (k: number, s: number, at: number) => {
    for (const fp of tt.footpaths[s]!) {
      const w = at + fp.sec;
      if (w < arr[k]![fp.to]!) { arr[k]![fp.to] = w; viaFoot[k]![fp.to] = s; viaConn[k]![fp.to] = -1; }
      if (w < ready[k]![fp.to]!) ready[k]![fp.to] = w;
    }
  };
  // Seeding every round keeps arr and ready non-increasing in k, so a strictly better round-k
  // arrival uses exactly k trains and reconstruction can step down one round per ride.
  for (let k = 0; k <= K; k++) {
    for (const s of from) { arr[k]![s] = t; ready[k]![s] = t; }
    for (const s of from) relax(k, s, t);
  }
  // Monotone in k: a journey with fewer trains is also allowed with more.
  const roundOf = new Int32Array(c.nInst).fill(K + 1);
  const enter: Int32Array[] = [];
  for (let k = 0; k <= K; k++) enter.push(new Int32Array(c.nInst).fill(-1));
  for (let i = 0; i < c.n; i++) {
    const inst = c.inst[i]!; const fs = c.fromSt[i]!; const dep = c.dep[i]!;
    for (let k = 1; k <= K; k++) {
      if (k < roundOf[inst]! && ready[k - 1]![fs]! <= dep) { roundOf[inst] = k; enter[k]![inst] = i; break; }
    }
    const k0 = roundOf[inst]!;
    if (k0 > K) continue;
    const to = c.toSt[i]!; const a = c.arr[i]!;
    for (let k = k0; k <= K; k++) {
      if (enter[k]![inst]! < 0) enter[k]![inst] = enter[k0]![inst]!;
      if (a < arr[k]![to]!) { arr[k]![to] = a; viaConn[k]![to] = i; viaFoot[k]![to] = -1; relax(k, to, a); }
      const r = a + tt.minChange[to]!;
      if (r < ready[k]![to]!) ready[k]![to] = r;
    }
  }
  const out: Itinerary[] = [];
  let bestSoFar = Infinity;
  // Round 0 covers a destination reachable on foot alone.
  for (let k = 0; k <= K; k++) {
    let target = -1; let best = Infinity;
    for (const s of to) if (arr[k]![s]! < best) { best = arr[k]![s]!; target = s; }
    if (target < 0 || !(best < bestSoFar)) continue;
    bestSoFar = best;
    const legs: Leg[] = [];
    let s = target; let kk = k;
    for (let guard = 0; guard < 1000; guard++) {
      const foot = viaFoot[kk]![s]!; const conn = viaConn[kk]![s]!;
      if (foot >= 0) {
        const sec = tt.footpaths[foot]!.find((f) => f.to === s)!.sec;
        legs.push({ kind: 'walk', fromStation: foot, toStation: s, dep: arr[kk]![s]! - sec, arr: arr[kk]![s]! });
        s = foot; continue;
      }
      if (conn < 0) break;
      const inst = c.inst[conn]!; const e = enter[kk]![inst]!;
      legs.push({ kind: 'ride', trip: c.trip[conn]!, inst, day: c.day[conn]!, fromStation: c.fromSt[e]!, toStation: s, fromStop: c.fromStop[e]!, toStop: c.toStop[conn]!, dep: c.dep[e]!, arr: c.arr[conn]! });
      s = c.fromSt[e]!; kk = Math.max(0, kk - 1);
    }
    legs.reverse();
    const rides = legs.filter((l) => l.kind === 'ride');
    const slack: number[] = [];
    for (let i = 1; i < legs.length; i++) {
      const prev = legs[i - 1]!; const next = legs[i]!;
      if (prev.kind === 'ride' && next.kind === 'ride') slack.push(next.dep - prev.arr - tt.minChange[prev.toStation]!);
      else if (prev.kind === 'walk' && next.kind === 'ride') slack.push(next.dep - prev.arr);
    }
    out.push({ legs, dep: legs[0]?.dep ?? t, arr: best, trains: rides.length, slack });
  }
  return out;
}
