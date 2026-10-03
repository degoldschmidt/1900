/**
 * A small earliest-arrival search (connection scan) used by V05. It is independent of the kit's
 * router on purpose: the validators check the data, not the router.
 *
 * Model: a trip instance is one service on one service day. Consecutive timed stops give a
 * connection (departure, else arrival, at the first stop → arrival, else departure, at the next).
 * Boarding needs the traveller ready at the station: at the origin from t0, elsewhere from the
 * arrival plus the station's minimum change (min_change.csv, default 0) or plus a transfer's
 * minutes (transfers.csv, directional). A through link (through_links.csv) lets a traveller
 * arriving on the first service stay aboard into the second at the link's station, on the next
 * instance of the second service departing there within 24 hours. arr_only stops cannot be
 * boarded and dep_only stops cannot be alighted at.
 */
import type { Dataset } from '../schema/dataset.ts';
import type { ServiceRow, StopRow } from '../schema/canonical.ts';
import { absStops, groupBy, type ZoneLookup } from '../schema/derive.ts';
import { cmpStr } from '../schema/csv.ts';

export interface Conn {
  dep: number; arr: number; inst: number; fromIdx: number; toIdx: number;
  from: string; to: string; board: boolean; alight: boolean;
}

export interface InstStop { station: string; arr: number | null; dep: number | null }

export interface Net {
  conns: Conn[];
  instService: string[];
  instDay: number[];
  instStops: InstStop[][];
  instByService: Map<string, number[]>;
  footpaths: Map<string, Array<{ to: string; sec: number }>>;
  minChange: Map<string, number>;
  through: Map<string, Array<{ to: string; station: string }>>;
}

/** Builds a network from (service, service day) picks. Instances whose zones are missing are skipped. */
export function buildNet(ds: Dataset, zl: ZoneLookup, sbs: Map<string, StopRow[]>, picks: ReadonlyArray<{ svc: ServiceRow; day: number }>): Net {
  const conns: Conn[] = [];
  const instService: string[] = [];
  const instDay: number[] = [];
  const instStops: InstStop[][] = [];
  const instByService = new Map<string, number[]>();
  for (const { svc, day } of picks) {
    const stops = sbs.get(svc.service_id) ?? [];
    const abs = absStops(stops, zl, day);
    if (abs.errors.length) continue;
    const inst = instService.length;
    instService.push(svc.service_id);
    instDay.push(day);
    const base = day * 86400;
    const ist: InstStop[] = abs.stops.map((a) => ({ station: a.stop.station_id, arr: a.arr === null ? null : base + a.arr, dep: a.dep === null ? null : base + a.dep }));
    instStops.push(ist);
    (instByService.get(svc.service_id) ?? instByService.set(svc.service_id, []).get(svc.service_id)!).push(inst);
    let prev = -1;
    for (let j = 0; j < ist.length; j++) {
      const s = ist[j]!;
      if (s.arr === null && s.dep === null) continue;
      if (prev >= 0) {
        const p = ist[prev]!;
        const dep = (p.dep ?? p.arr)!; const arr = (s.arr ?? s.dep)!;
        conns.push({
          dep, arr, inst, fromIdx: prev, toIdx: j, from: p.station, to: s.station,
          board: !stops[prev]!.flags.includes('arr_only'), alight: !stops[j]!.flags.includes('dep_only'),
        });
      }
      prev = j;
    }
  }
  conns.sort((a, b) => a.dep - b.dep || a.inst - b.inst || a.fromIdx - b.fromIdx);
  const footpaths = new Map<string, Array<{ to: string; sec: number }>>();
  for (const f of ds.t.transfers) {
    if (f.from_station_id === f.to_station_id) continue;
    (footpaths.get(f.from_station_id) ?? footpaths.set(f.from_station_id, []).get(f.from_station_id)!).push({ to: f.to_station_id, sec: f.min_minutes * 60 });
  }
  const minChange = new Map(ds.t.min_change.map((m) => [m.station_id, m.min_minutes * 60]));
  const through = new Map<string, Array<{ to: string; station: string }>>();
  for (const [from, links] of groupBy(ds.t.through_links, (l) => l.from_service_id)) {
    through.set(from, links.map((l) => ({ to: l.to_service_id, station: l.station_id })).sort((a, b) => cmpStr(a.to, b.to) || cmpStr(a.station, b.station)));
  }
  return { conns, instService, instDay, instStops, instByService, footpaths, minChange, through };
}

export interface SearchOptions {
  /** Only connections departing before this instant are scanned. */
  until: number;
  /** Boarding at an origin station is allowed only for departures before this instant. */
  originDepBefore?: number;
}

/** Earliest arrival (instant) at every reached station, leaving any origin station at or after t0. */
export function earliestArrival(net: Net, origins: readonly string[], t0: number, opts: SearchOptions): Map<string, number> {
  const arrival = new Map<string, number>();
  const ready = new Map<string, number>();
  const originSet = new Set(origins);
  for (const o of origins) { arrival.set(o, t0); ready.set(o, t0); }
  const onboard = new Map<number, number>();
  const improve = (st: string, a: number, r: number) => {
    if (a < (arrival.get(st) ?? Infinity)) arrival.set(st, a);
    if (r < (ready.get(st) ?? Infinity)) ready.set(st, r);
  };
  // Binary search for the first connection departing at or after t0.
  let lo = 0; let hi = net.conns.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (net.conns[mid]!.dep < t0) lo = mid + 1; else hi = mid; }
  for (let k = lo; k < net.conns.length; k++) {
    const c = net.conns[k]!;
    if (c.dep >= opts.until) break;
    const from = onboard.get(c.inst);
    let aboard = from !== undefined && from <= c.fromIdx;
    if (!aboard && c.board) {
      const r = ready.get(c.from);
      const originOk = !originSet.has(c.from) || opts.originDepBefore === undefined || c.dep < opts.originDepBefore;
      if (r !== undefined && r <= c.dep && originOk) {
        aboard = true;
        onboard.set(c.inst, Math.min(from ?? Infinity, c.fromIdx));
      }
    }
    if (!aboard || !c.alight) continue;
    const a = c.arr;
    improve(c.to, a, a + (net.minChange.get(c.to) ?? 0));
    for (const f of net.footpaths.get(c.to) ?? []) improve(f.to, a + f.sec, a + f.sec);
    for (const l of net.through.get(net.instService[c.inst]!) ?? []) {
      if (l.station !== c.to) continue;
      let best: { inst: number; idx: number; dep: number } | null = null;
      for (const i of net.instByService.get(l.to) ?? []) {
        const idx = net.instStops[i]!.findIndex((s) => s.station === l.station);
        const d = idx >= 0 ? net.instStops[i]![idx]!.dep : null;
        if (d === null || d === undefined || d < a || d - a > 86400) continue;
        if (!best || d < best.dep) best = { inst: i, idx, dep: d };
      }
      if (best) onboard.set(best.inst, Math.min(onboard.get(best.inst) ?? Infinity, best.idx));
    }
  }
  return arrival;
}
