/**
 * V03 — physics of each service. Times are made absolute (local time − railway-zone offset +
 * 86400 × day offset) on the edition's first valid day, then walked in stop order
 * (arrival, then departure, at each stop).
 *
 * Errors:
 *  - time goes backwards between consecutive stops, or a dwell is negative (departure before arrival);
 *  - the first stop has no departure, or its departure is not on day offset 0;
 *  - a leg is impossibly fast: above twice the mode's upper bound, or zero time over more than 1 km.
 * Warnings:
 *  - a leg's speed (great-circle distance / scheduled time) is outside the mode's bounds:
 *    rail 8–110 km/h, steamer and ferry 5–40 km/h (great-circle distance understates the route,
 *    so slow legs are only suspicious);
 *  - a dwell over 6 hours; zero running time between two different stations;
 *  - the last stop has no arrival; a station has no railway zone (V09 reports it as an error).
 * Info: a leg whose stations lack coordinates (speed not checked).
 */
import type { Dataset } from '../schema/dataset.ts';
import { absStops, distanceKm, stopsByService, zoneLookup } from '../schema/derive.ts';
import { issue, type Issue } from '../schema/issues.ts';

export const SPEED_BOUNDS: Record<string, [number, number]> = { rail: [8, 110], steamer: [5, 40], ferry: [5, 40] };

export function v03(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const zl = zoneLookup(ds);
  const sbs = stopsByService(ds);
  const eds = new Map(ds.t.editions.map((e) => [e.edition_id, e]));
  const stations = new Map(ds.t.stations.map((s) => [s.station_id, s]));
  for (const svc of ds.t.services) {
    const ed = eds.get(svc.edition_id);
    const stops = sbs.get(svc.service_id) ?? [];
    if (!ed || stops.length === 0) continue;
    const w = `service ${svc.service_id}`;
    const E = (m: string) => out.push(issue('V03', 'error', w, m));
    const W = (m: string) => out.push(issue('V03', 'warning', w, m));
    const first = stops[0]!;
    if (first.dep_local === '') E(`first stop ${first.station_id} has no departure`);
    else if (first.dep_dayoff !== 0) E(`first departure (${first.station_id}) must be on day offset 0, not ${first.dep_dayoff}`);
    const last = stops[stops.length - 1]!;
    if (last.arr_local === '') W(`last stop ${last.station_id} has no arrival`);
    const abs = absStops(stops, zl, ed.valid_from);
    if (abs.errors.length) { W(`not checked: ${[...new Set(abs.errors)].join('; ')}`); continue; }
    const [lo, hi] = SPEED_BOUNDS[svc.mode] ?? [8, 110];
    let prev: { t: number; station: string; seq: number } | null = null;
    for (const a of abs.stops) {
      const s = a.stop;
      if (a.arr !== null && a.dep !== null) {
        if (a.dep < a.arr) E(`negative dwell at ${s.station_id} (seq ${s.seq}): arrives ${s.arr_local}+${s.arr_dayoff}, departs ${s.dep_local}+${s.dep_dayoff}`);
        else if (a.dep - a.arr > 6 * 3600) W(`dwell of ${Math.round((a.dep - a.arr) / 60)} min at ${s.station_id} (seq ${s.seq})`);
      }
      const tIn = a.arr ?? a.dep; const tOut = a.dep ?? a.arr;
      if (tIn === null || tOut === null) continue;
      if (prev) {
        const dt = tIn - prev.t;
        const from = stations.get(prev.station); const to = stations.get(s.station_id);
        const leg = `${prev.station}→${s.station_id} (seq ${prev.seq}→${s.seq})`;
        if (dt < 0) E(`time goes backwards ${leg}: ${Math.round(-dt / 60)} min earlier (check day offsets and zones)`);
        else if (from && to && from.lat !== null && from.lon !== null && to.lat !== null && to.lon !== null) {
          const km = distanceKm(from.lat, from.lon, to.lat, to.lon);
          if (dt === 0) {
            if (km > 1) E(`zero running time over ${km.toFixed(1)} km ${leg}`);
            else W(`zero running time ${leg}`);
          } else {
            const v = km / (dt / 3600);
            if (v > 2 * hi) E(`impossible speed ${v.toFixed(1)} km/h ${leg} (${svc.mode} bound ${lo}–${hi})`);
            else if (v > hi || v < lo) W(`speed ${v.toFixed(1)} km/h ${leg} outside ${svc.mode} bounds ${lo}–${hi}`);
          }
        } else {
          if (dt === 0 && prev.station !== s.station_id) W(`zero running time ${leg}`);
          out.push(issue('V03', 'info', w, `speed not checked ${leg}: coordinates missing`));
        }
      }
      prev = { t: tOut, station: s.station_id, seq: s.seq };
    }
  }
  return out;
}
