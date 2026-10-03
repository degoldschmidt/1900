/**
 * V09 — zones. Errors:
 *  - a station served by an edition (a stop of its services, or an end of a segment it is a
 *    source for) has no railway zone, or more than one, on some day of the edition's validity
 *    (open-ended: openEndedDays); reported once per station and edition with the first bad day;
 *  - the rows of one zone_id overlap, or disagree on applies_to;
 *  - an offset beyond ±12 hours;
 *  - a city's civil_zone_id is not a civil zone.
 * Warnings: a station with no railway zone row at all; a station_zones row naming a civil zone
 * (station_zones are railway time; civil time comes from the city).
 */
import type { Dataset } from '../schema/dataset.ts';
import { editionRange, groupBy, stopsByService, zoneLookup } from '../schema/derive.ts';
import { isoFromDay } from '#kit/time/calendar.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';

export function v09(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V09', 'error', w, m));
  const W = (w: string, m: string) => out.push(issue('V09', 'warning', w, m));
  const zl = zoneLookup(ds);
  const zones = groupBy(ds.t.zones, (z) => z.zone_id);
  for (const [id, rows] of [...zones].sort((a, b) => cmpStr(a[0], b[0]))) {
    const sorted = [...rows].sort((a, b) => a.from - b.from);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i]!; const b = sorted[i + 1]!;
      if (a.to === null || a.to >= b.from) E(`zones.csv:${b.line}`, `zone ${id} has overlapping rows from ${isoFromDay(b.from)}`);
    }
    if (new Set(rows.map((r) => r.applies_to)).size > 1) E(`zones.csv:${rows[0]!.line}`, `zone ${id} mixes railway and civil rows`);
    for (const r of rows) if (Math.abs(r.offset_seconds) > 43200) E(`zones.csv:${r.line}`, `offset ${r.offset_seconds} s is beyond ±12 h`);
  }
  for (const c of ds.t.cities) {
    const z = zones.get(c.civil_zone_id);
    if (z && z.some((r) => r.applies_to !== 'civil')) E(`cities.csv:${c.line}`, `${c.city_id}: civil_zone_id ${c.civil_zone_id} is not a civil zone`);
  }
  for (const sz of ds.t.station_zones) {
    const z = zones.get(sz.zone_id);
    if (z && z.every((r) => r.applies_to === 'civil')) W(`station_zones.csv:${sz.line}`, `${sz.station_id}: ${sz.zone_id} is a civil zone (station zones give railway time)`);
  }
  const withZone = new Set(ds.t.station_zones.filter((sz) => (zones.get(sz.zone_id) ?? []).some((z) => z.applies_to === 'railway')).map((s) => s.station_id));
  for (const s of ds.t.stations) if (!withZone.has(s.station_id)) W(`stations.csv:${s.line}`, `${s.station_id} has no railway zone row`);

  const sbs = stopsByService(ds);
  const segs = new Map(ds.t.segments.map((s) => [s.segment_id, s]));
  for (const ed of [...ds.t.editions].sort((a, b) => cmpStr(a.edition_id, b.edition_id))) {
    const used = new Set<string>();
    for (const svc of ds.t.services) if (svc.edition_id === ed.edition_id) for (const st of sbs.get(svc.service_id) ?? []) used.add(st.station_id);
    for (const r of ds.t.segment_sources) {
      if (r.edition_id !== ed.edition_id) continue;
      const sg = segs.get(r.segment_id);
      if (sg) { used.add(sg.from_station); used.add(sg.to_station); }
    }
    const [d0, d1] = editionRange(ed, ds.options.openEndedDays);
    for (const st of [...used].sort(cmpStr)) {
      for (let d = d0; d <= d1; d++) {
        const z = zl.railwayOffset(st, d);
        if ('error' in z) { E(`edition ${ed.edition_id}`, `${z.error} (first such day in the edition)`); break; }
      }
    }
  }
  return out;
}
