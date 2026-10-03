/**
 * Elementary connections (one hop between consecutive timed stops of a running trip) for a graph
 * view over a time window, as sorted parallel typed arrays. Per (view, service day) results are
 * memoised. A view is either the truth on the ground or what an agent knows.
 */
import type { Timetable } from './model.ts';
import type { DayNumber } from '../time/calendar.ts';
import type { Instant } from '../time/instant.ts';
import { dayOf } from '../time/instant.ts';

export interface GraphView {
  /** Cache key: changes whenever the set of usable trips changes. */
  key: string;
  /** Which trips this view can use on a service day. */
  uses(trip: number, day: DayNumber): boolean;
}

/** Longest a trip may run past its service day (days). */
export const MAX_TRIP_DAYS = 3;

export function truthView(tt: Timetable, suspended?: (trip: number, day: DayNumber) => boolean): GraphView {
  return { key: suspended ? 'truth+susp' : 'truth', uses: (trip, day) => tt.truthRuns(trip, day) && !(suspended?.(trip, day) ?? false) };
}

export interface Connections {
  n: number;
  dep: Float64Array;
  arr: Float64Array;
  trip: Int32Array;
  /** Absolute stop index of the departure stop; the arrival stop is the next timed stop. */
  fromStop: Int32Array;
  toStop: Int32Array;
  fromSt: Int32Array;
  toSt: Int32Array;
  day: Int32Array;
  /** Trip instance (one trip on one service day), dense ids 0..nInst-1. */
  inst: Int32Array;
  nInst: number;
  instTrip: Int32Array;
  instDay: Int32Array;
}

interface Conn { dep: number; arr: number; trip: number; fromStop: number; toStop: number; fromSt: number; toSt: number; day: number }

const dayCache = new WeakMap<Timetable, Map<string, Conn[]>>();

function connectionsForDay(tt: Timetable, view: GraphView, day: DayNumber): Conn[] {
  let m = dayCache.get(tt);
  if (!m) { m = new Map(); dayCache.set(tt, m); }
  const k = `${view.key}|${day}`;
  const hit = m.get(k);
  if (hit) return hit;
  const out: Conn[] = [];
  tt.trips.forEach((t, ti) => {
    if (!view.uses(ti, day)) return;
    let prev = -1;
    for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
      const hasTime = tt.stopDep[j]! >= 0 || tt.stopArr[j]! >= 0;
      if (!hasTime) continue;
      if (prev >= 0 && tt.stopDep[prev]! >= 0) {
        const dep = tt.depAt(prev, day)!;
        const arr = tt.arrAt(j, day)!;
        out.push({ dep, arr, trip: ti, fromStop: prev, toStop: j, fromSt: tt.stopStation[prev]!, toSt: tt.stopStation[j]!, day });
      }
      prev = j;
    }
  });
  if (m.size > 2000) m.clear();
  m.set(k, out);
  return out;
}

/** Connections departing in [t0, t1], sorted by (dep, arr, trip, stop). */
export function connections(tt: Timetable, view: GraphView, t0: Instant, t1: Instant): Connections {
  const all: Conn[] = [];
  for (let d = dayOf(t0) - MAX_TRIP_DAYS; d <= dayOf(t1); d++) {
    for (const c of connectionsForDay(tt, view, d)) if (c.dep >= t0 && c.dep <= t1) all.push(c);
  }
  all.sort((a, b) => a.dep - b.dep || a.arr - b.arr || a.trip - b.trip || a.fromStop - b.fromStop || a.day - b.day);
  const n = all.length;
  const instOf = new Map<string, number>();
  const instTrip: number[] = []; const instDay: number[] = [];
  const r: Connections = {
    n, dep: new Float64Array(n), arr: new Float64Array(n), trip: new Int32Array(n), fromStop: new Int32Array(n),
    toStop: new Int32Array(n), fromSt: new Int32Array(n), toSt: new Int32Array(n), day: new Int32Array(n),
    inst: new Int32Array(n), nInst: 0, instTrip: new Int32Array(0), instDay: new Int32Array(0),
  };
  all.forEach((c, i) => {
    r.dep[i] = c.dep; r.arr[i] = c.arr; r.trip[i] = c.trip; r.fromStop[i] = c.fromStop; r.toStop[i] = c.toStop;
    r.fromSt[i] = c.fromSt; r.toSt[i] = c.toSt; r.day[i] = c.day;
    const key = `${c.trip}:${c.day}`;
    let id = instOf.get(key);
    if (id === undefined) { id = instTrip.length; instOf.set(key, id); instTrip.push(c.trip); instDay.push(c.day); }
    r.inst[i] = id;
  });
  r.nInst = instTrip.length;
  r.instTrip = Int32Array.from(instTrip);
  r.instDay = Int32Array.from(instDay);
  return r;
}

/** Clears memoised connections (tests). */
export function clearConnectionCache(tt: Timetable): void { dayCache.delete(tt); }
