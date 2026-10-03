/**
 * Random synthetic timetables for routing tests (SYN_ identifiers; never shipped).
 */
import type { TimetableData, TripRow, RunRule } from '../../src/timetable/types.ts';
import { belowN, chancePermille } from '../../src/rng/draw.ts';

export const BASE_DAY = 5000;

export interface NetOptions { stations?: number; trips?: number; editions?: number; through?: boolean }

export function randomNetwork(seed: number, opts: NetOptions = {}): TimetableData {
  const r = (n: number, ...ids: Array<number | string>) => belowN(n, seed, 'net', ...ids);
  const ch = (pm: number, ...ids: Array<number | string>) => chancePermille(pm, seed, 'net', ...ids);
  const ns = opts.stations ?? 4 + r(7, 'ns');
  const stations = Array.from({ length: ns }, (_, i) => ({ id: `SYN_S${i}`, name: `Station ${i}`, city: `SYN_C${Math.floor(i / 2)}`, country: 'SY', frontier: false, frontierPair: null }));
  const cities = [...new Set(stations.map((s) => s.city))].map((c) => ({ id: c, name: c, country: 'SY', jurisdiction: 'SYN_J', civilZone: 'SYN_Z0' }));
  const zones = [
    { id: 'SYN_Z0', name: 'Zone 0', offsetSec: 0, appliesTo: 'railway' as const, from: 0, to: null },
    { id: 'SYN_Z1', name: 'Zone 1', offsetSec: 7278, appliesTo: 'railway' as const, from: 0, to: null },
  ];
  const stationZones = stations.map((s, i) => ({ station: s.id, zone: i % 3 === 2 ? 'SYN_Z1' : 'SYN_Z0', from: 0, to: null }));
  const nEd = opts.editions ?? 2;
  const editions = Array.from({ length: nEd }, (_, e) => ({ id: `SYN_E${e}`, source: 'SYN_src', family: 'SYN', label: `Edition ${e}`, issueDay: BASE_DAY + e * 3, validFrom: BASE_DAY + e * 3, validTo: e === nEd - 1 ? null : BASE_DAY + (e + 1) * 3 }));
  const nt = opts.trips ?? 6 + r(20, 'nt');
  const trips: TripRow[] = [];
  const st = { station: [] as number[], arr: [] as number[], dep: [] as number[], arrDay: [] as number[], depDay: [] as number[], flags: [] as number[], cite: [] as number[] };
  for (let t = 0; t < nt; t++) {
    const len = 2 + r(Math.min(4, ns - 1), 'len', t);
    const path: number[] = [];
    for (let attempt = 0; path.length < len; attempt++) { const s = r(ns, 'stop', t, path.length, attempt); if (!path.includes(s)) path.push(s); }
    let clock = r(24 * 60, 'start', t) * 60; // seconds since service-day midnight (local, approximating one zone)
    const firstStop = st.station.length;
    path.forEach((s, k) => {
      const arrSec = k === 0 ? -1 : clock;
      if (k > 0) clock += 60 * (1 + r(10, 'dwell', t, k));
      const depSec = k === path.length - 1 ? -1 : clock;
      const toDayPair = (x: number): [number, number] => (x < 0 ? [-1, 0] : [x % 86400, Math.floor(x / 86400)]);
      const [a, ad] = toDayPair(arrSec); const [d, dd] = toDayPair(depSec);
      st.station.push(s); st.arr.push(a); st.dep.push(d); st.arrDay.push(arrSec < 0 ? 0 : ad); st.depDay.push(depSec < 0 ? 0 : dd); st.flags.push(0); st.cite.push(0);
      if (k < path.length - 1) clock += 60 * (20 + r(300, 'run', t, k)) + 7279; // > zone difference, keeps times increasing
    });
    const mask = ch(500, 'daily', t) ? 127 : 1 + r(126, 'mask', t);
    const run: RunRule = { ranges: [[BASE_DAY - 10, BASE_DAY + 20, mask]], also: ch(200, 'also', t) ? [BASE_DAY + r(10, 'alsod', t)] : [], except: ch(200, 'exc', t) ? [BASE_DAY + r(10, 'excd', t)] : [] };
    const ed = r(nEd, 'ed', t);
    const ev = editions[ed]!;
    trips.push({ id: `SYN_T${t}`, trainKey: `SYN_K${r(Math.max(2, Math.floor(nt / 2)), 'key', t)}`, edition: ev.id, trainNo: `${t}`, name: null, operator: 'SYN', mode: 'rail', classMask: 7, sleeper: false, run, truth: [[ev.validFrom, ev.validTo === null ? BASE_DAY + 30 : ev.validTo - 1]], firstStop, nStops: path.length, cite: 0 });
  }
  const transfers = [];
  for (let i = 0; i + 1 < ns; i += 2) transfers.push({ from: `SYN_S${i}`, to: `SYN_S${i + 1}`, minSec: 600 + r(1800, 'walk', i), kind: 'cross-city' as const, basis: 'design' as const }, { from: `SYN_S${i + 1}`, to: `SYN_S${i}`, minSec: 600 + r(1800, 'walk2', i), kind: 'cross-city' as const, basis: 'design' as const });
  const minChange = stations.map((s, i) => ({ station: s.id, minSec: 300 * r(4, 'mc', i), basis: 'design' as const }));
  const throughLinks = [];
  if (opts.through) {
    for (let a = 0; a < nt; a++) for (let b = 0; b < nt; b++) {
      if (a === b || !ch(80, 'thr', a, b)) continue;
      const ta = trips[a]!; const tb = trips[b]!;
      const lastA = st.station[ta.firstStop + ta.nStops - 1]!; const firstB = st.station[tb.firstStop]!;
      if (lastA === firstB) throughLinks.push({ fromTrip: ta.id, toTrip: tb.id, station: `SYN_S${lastA}`, classMask: 7, cite: 0 });
    }
  }
  return { stations, cities, zones, stationZones, editions, trips, stops: st, transfers, minChange, throughLinks, fares: [] };
}
