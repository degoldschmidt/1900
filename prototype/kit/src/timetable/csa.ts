/**
 * Connection Scan earliest-arrival routing with footpaths (intra-city station changes),
 * per-station minimum change times and through links (staying seated as a carriage runs on
 * as another train). Starting points need no change time; changing trains does.
 */
import type { Timetable } from './model.ts';
import type { Connections } from './expand.ts';
import type { Instant } from '../time/instant.ts';

export interface Start { station: number; t: Instant }

export interface EAResult {
  /** Earliest physical arrival per station (Infinity if unreachable). */
  arr: Float64Array;
  /** Earliest time one can board a train at each station (arrival + change, walk arrival, or start). */
  ready: Float64Array;
  /** Last connection used to reach each station by train (-1 if none). */
  viaConn: Int32Array;
  /** Station walked from to reach each station (-1 if none). */
  viaFoot: Int32Array;
  /** For each trip instance: the connection where it was boarded (-1 if never). */
  enter: Int32Array;
}

export interface CsaOptions {
  /** Stop scanning connections departing after this instant. */
  until?: Instant;
  /** Stop once this station's arrival can no longer improve. */
  target?: number;
}

function relaxFoot(tt: Timetable, res: EAResult, from: number, t: number): void {
  for (const fp of tt.footpaths[from]!) {
    const at = t + fp.sec;
    if (at < res.arr[fp.to]!) { res.arr[fp.to] = at; res.viaFoot[fp.to] = from; res.viaConn[fp.to] = -1; }
    if (at < res.ready[fp.to]!) res.ready[fp.to] = at;
  }
}

export function earliestArrival(tt: Timetable, c: Connections, starts: readonly Start[], opts: CsaOptions = {}): EAResult {
  const ns = tt.stationIds.length;
  const res: EAResult = {
    arr: new Float64Array(ns).fill(Infinity),
    ready: new Float64Array(ns).fill(Infinity),
    viaConn: new Int32Array(ns).fill(-1),
    viaFoot: new Int32Array(ns).fill(-1),
    enter: new Int32Array(c.nInst).fill(-1),
  };
  for (const s of starts) {
    if (s.t < res.arr[s.station]!) { res.arr[s.station] = s.t; res.ready[s.station] = s.t; res.viaConn[s.station] = -1; res.viaFoot[s.station] = -1; }
  }
  for (const s of starts) relaxFoot(tt, res, s.station, s.t);
  // Arrival of each boarded trip instance at stations (for through links).
  const tripArr = new Map<number, Map<number, number>>();
  const until = opts.until ?? Infinity;
  for (let i = 0; i < c.n; i++) {
    const dep = c.dep[i]!;
    if (dep > until) break;
    if (opts.target !== undefined && dep >= res.arr[opts.target]!) break;
    const inst = c.inst[i]!;
    let onBoard = res.enter[inst]! >= 0;
    if (!onBoard && res.ready[c.fromSt[i]!]! <= dep) {
      res.enter[inst] = i; onBoard = true;
    }
    if (!onBoard) {
      const links = tt.throughInto.get(c.trip[i]!);
      if (links) {
        for (const l of links) {
          if (l.station !== c.fromSt[i]) continue;
          for (const [otherInst, arrivals] of tripArr) {
            if (c.instTrip[otherInst] !== l.fromTrip) continue;
            const a = arrivals.get(l.station);
            if (a !== undefined && a <= dep) { res.enter[inst] = i; onBoard = true; break; }
          }
          if (onBoard) break;
        }
      }
    }
    if (!onBoard) continue;
    const to = c.toSt[i]!; const arr = c.arr[i]!;
    if (tt.throughInto.size > 0) {
      let m = tripArr.get(inst);
      if (!m) { m = new Map(); tripArr.set(inst, m); }
      if (!m.has(to)) m.set(to, arr);
    }
    if (arr < res.arr[to]!) {
      res.arr[to] = arr; res.viaConn[to] = i; res.viaFoot[to] = -1;
      relaxFoot(tt, res, to, arr);
    }
    const ready = arr + tt.minChange[to]!;
    if (ready < res.ready[to]!) res.ready[to] = ready;
  }
  return res;
}

export type Leg =
  | { kind: 'ride'; trip: number; inst: number; day: number; fromStation: number; toStation: number; fromStop: number; toStop: number; dep: Instant; arr: Instant }
  | { kind: 'walk'; fromStation: number; toStation: number; dep: Instant; arr: Instant };

/** Reconstructs the legs of the earliest journey to `target`, or null if unreachable. */
export function journey(tt: Timetable, c: Connections, res: EAResult, target: number): Leg[] | null {
  if (!Number.isFinite(res.arr[target]!)) return null;
  const legs: Leg[] = [];
  let s = target;
  for (let guard = 0; guard < 10_000; guard++) {
    const foot = res.viaFoot[s]!; const conn = res.viaConn[s]!;
    if (foot >= 0) {
      const sec = tt.footpaths[foot]!.find((f) => f.to === s)!.sec;
      legs.push({ kind: 'walk', fromStation: foot, toStation: s, dep: res.arr[s]! - sec, arr: res.arr[s]! });
      s = foot;
      continue;
    }
    if (conn < 0) break;
    const inst = c.inst[conn]!;
    const enter = res.enter[inst]!;
    legs.push({
      kind: 'ride', trip: c.trip[conn]!, inst, day: c.day[conn]!, fromStation: c.fromSt[enter]!, toStation: s,
      fromStop: c.fromStop[enter]!, toStop: c.toStop[conn]!, dep: c.dep[enter]!, arr: c.arr[conn]!,
    });
    s = c.fromSt[enter]!;
  }
  return legs.reverse();
}
