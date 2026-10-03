/**
 * V05 — the network works as printed. Uses the search in net.ts (not the kit router).
 *
 * 1. Through links (through_links.csv): on every day the first service runs (its printed rule,
 *    over the edition's validity), the second service must run on a day that lets it leave the
 *    link station at or after the first one arrives, within maxThroughWaitHours (12). Error otherwise.
 * 2. Frontier pairs (stations.csv frontier_pair_id): for each edition whose services serve both
 *    stations of a pair, on every day of the edition's validity (open-ended editions: the first
 *    openEndedDays days), a traveller at either station must be able to leave it that day (local
 *    railway time) and reach the other no later than frontierHours (6) after the end of that day,
 *    using that edition's services, transfers (after a train), minimum changes and through links.
 *    The short horizon keeps a roundabout journey (out and back on the next day's trains) from
 *    passing for a crossing. Error for each direction that fails on any day (dates listed).
 * 3. Reach: for each edition, on each of its first reachSampleDays (7) valid days, starting at
 *    00:00 at the origin city (validation.json originCity, else the city named "London"), every
 *    city at either end of a segment that has a truth edition that day must be reached within
 *    reachHours (72), on the truth network of that day (each service runs where its truth ranges
 *    and printed rule both say so, whatever its edition). A city missed on every sampled day is an
 *    error; on some days, a warning. Editions whose days give the origin no truth service are
 *    skipped (info).
 */
import type { Dataset } from '../schema/dataset.ts';
import type { ServiceRow } from '../schema/canonical.ts';
import { editionRange, inRanges, stopsByService, truthRanges, zoneLookup, type Range } from '../schema/derive.ts';
import { compileRuleText, runsOn } from '../schema/running-rule.ts';
import { isoFromDay } from '#kit/time/calendar.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';
import type { RunRule } from '#kit/timetable/types.ts';
import { buildNet, earliestArrival } from './net.ts';

const MAX_TRIP_DAYS = 3;

const listDays = (days: number[]): string => {
  const shown = days.slice(0, 5).map(isoFromDay).join(', ');
  return days.length > 5 ? `${shown} and ${days.length - 5} more` : shown;
};

export function v05(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const o = ds.options;
  const zl = zoneLookup(ds);
  const sbs = stopsByService(ds);
  const eds = new Map(ds.t.editions.map((e) => [e.edition_id, e]));
  const rules = new Map<string, RunRule | null>();
  const printed = (svc: ServiceRow): RunRule | null => {
    if (!rules.has(svc.service_id)) {
      const ed = eds.get(svc.edition_id);
      let r: RunRule | null = null;
      // Compiled a few days beyond the validity so a train that starts just before (or ends just
      // after) the first (last) valid day still counts for the crossings and links inside it.
      const win = ed ? editionRange(ed, o.openEndedDays) : null;
      try { if (win) r = compileRuleText(svc.running_rule, [win[0] - MAX_TRIP_DAYS, win[1] + MAX_TRIP_DAYS]); } catch { r = null; } // V07 reports bad rules
      rules.set(svc.service_id, r);
    }
    return rules.get(svc.service_id)!;
  };
  const services = [...ds.t.services].sort((a, b) => cmpStr(a.service_id, b.service_id));
  const svcById = new Map(services.map((s) => [s.service_id, s]));

  // 1. Through links.
  for (const l of ds.t.through_links) {
    const a = svcById.get(l.from_service_id); const b = svcById.get(l.to_service_id);
    const ed = eds.get(l.edition_id);
    const ra = a && printed(a); const rb = b && printed(b);
    if (!a || !b || !ed || !ra || !rb) continue;
    const [d0, d1] = editionRange(ed, o.openEndedDays);
    const picks: Array<{ svc: ServiceRow; day: number }> = [];
    for (let d = d0 - MAX_TRIP_DAYS; d <= d1 + MAX_TRIP_DAYS; d++) {
      if (runsOn(ra, d)) picks.push({ svc: a, day: d });
      if (runsOn(rb, d)) picks.push({ svc: b, day: d });
    }
    const net = buildNet(ds, zl, sbs, picks);
    const fails: number[] = [];
    for (const ia of net.instByService.get(a.service_id) ?? []) {
      const day = net.instDay[ia]!;
      if (day < d0 || day > d1) continue;
      const sa = net.instStops[ia]!.find((s) => s.station === l.station_id);
      const arr = sa ? (sa.arr ?? sa.dep) : null;
      if (arr === null || arr === undefined) { fails.push(day); continue; }
      const ok = (net.instByService.get(b.service_id) ?? []).some((ib) => {
        const sb = net.instStops[ib]!.find((s) => s.station === l.station_id);
        const dep = sb ? (sb.dep ?? sb.arr) : null;
        return dep !== null && dep !== undefined && dep >= arr && dep - arr <= o.maxThroughWaitHours * 3600;
      });
      if (!ok) fails.push(day);
    }
    if (fails.length) {
      out.push(issue('V05', 'error', `through_links.csv:${l.line}`,
        `${a.service_id} → ${b.service_id} at ${l.station_id} has no onward train within ${o.maxThroughWaitHours} h on ${fails.length} day(s): ${listDays(fails)}`));
    }
  }

  // 2. Frontier pairs, per edition.
  const stations = new Map(ds.t.stations.map((s) => [s.station_id, s]));
  for (const ed of [...ds.t.editions].sort((a, b) => cmpStr(a.edition_id, b.edition_id))) {
    const own = services.filter((s) => s.edition_id === ed.edition_id);
    const served = new Set(own.flatMap((s) => (sbs.get(s.service_id) ?? []).map((x) => x.station_id)));
    const pairs = [...served].filter((id) => {
      const p = stations.get(id)?.frontier_pair_id;
      return p && served.has(p);
    }).sort(cmpStr);
    if (pairs.length === 0) continue;
    const [d0, d1] = editionRange(ed, o.openEndedDays);
    const picks: Array<{ svc: ServiceRow; day: number }> = [];
    for (const svc of own) {
      const r = printed(svc);
      if (!r) continue;
      for (let d = d0 - MAX_TRIP_DAYS; d <= d1 + 1; d++) if (runsOn(r, d)) picks.push({ svc, day: d });
    }
    const net = buildNet(ds, zl, sbs, picks);
    for (const a of pairs) {
      const b = stations.get(a)!.frontier_pair_id;
      const fails: number[] = [];
      for (let d = d0; d <= d1; d++) {
        const z = zl.railwayOffset(a, d);
        if ('error' in z) { fails.push(d); continue; }
        const t0 = d * 86400 - z.offset;
        const until = t0 + 86400 + o.frontierHours * 3600;
        const t = earliestArrival(net, [a], t0, { until, originDepBefore: t0 + 86400 }).get(b);
        if (t === undefined || t > until) fails.push(d);
      }
      if (fails.length) {
        out.push(issue('V05', 'error', `edition ${ed.edition_id}`, `frontier ${a} → ${b} not connected on ${fails.length} of ${d1 - d0 + 1} day(s): ${listDays(fails)}`));
      }
    }
  }

  // 3. Reach from the origin city on the truth network.
  const originCity = o.originCity ?? ds.t.cities.find((c) => c.name === 'London')?.city_id ?? null;
  if (originCity === null || !ds.t.cities.some((c) => c.city_id === originCity)) {
    if (ds.t.services.length > 0) out.push(issue('V05', 'warning', 'validation.json', `origin city ${originCity ?? '"London"'} not found in cities.csv; reach not checked`));
    return out;
  }
  const cityOf = new Map(ds.t.stations.map((s) => [s.station_id, s.city_id]));
  const originStations = ds.t.stations.filter((s) => s.city_id === originCity).map((s) => s.station_id).sort(cmpStr);
  const truth = new Map<string, Range[]>(services.map((s) => [s.service_id, truthRanges(ds, s, o.openEndedDays)]));
  const segs = new Map(ds.t.segments.map((s) => [s.segment_id, s]));
  const span = Math.ceil(o.reachHours / 24) + 1;
  for (const ed of [...ds.t.editions].sort((a, b) => cmpStr(a.edition_id, b.edition_id))) {
    const [d0, d1] = editionRange(ed, o.openEndedDays);
    const sample: number[] = [];
    for (let d = d0; d <= Math.min(d1, d0 + o.reachSampleDays - 1); d++) sample.push(d);
    const missed = new Map<string, number[]>();
    let checked = 0;
    for (const D of sample) {
      const covered = new Set<string>();
      for (const r of ds.t.segment_sources) {
        if (r.rank !== 1 || D < r.date_from || D > r.date_to) continue;
        const sg = segs.get(r.segment_id);
        if (!sg) continue;
        for (const st of [sg.from_station, sg.to_station]) { const c = cityOf.get(st); if (c) covered.add(c); }
      }
      if (!covered.has(originCity)) continue;
      const picks: Array<{ svc: ServiceRow; day: number }> = [];
      for (const svc of services) {
        const r = printed(svc); const tr = truth.get(svc.service_id) ?? [];
        if (!r || tr.length === 0) continue;
        for (let d = D - MAX_TRIP_DAYS; d <= D + span; d++) if (inRanges(tr, d) && runsOn(r, d)) picks.push({ svc, day: d });
      }
      const z = zl.railwayOffset(originStations[0]!, D);
      if ('error' in z) continue;
      checked++;
      const t0 = D * 86400 - z.offset;
      const until = t0 + o.reachHours * 3600;
      const arr = earliestArrival(buildNet(ds, zl, sbs, picks), originStations, t0, { until });
      const reachedCities = new Set([...arr].filter(([, t]) => t <= until).map(([st]) => cityOf.get(st)));
      for (const c of [...covered].sort(cmpStr)) {
        if (!reachedCities.has(c)) (missed.get(c) ?? missed.set(c, []).get(c)!).push(D);
      }
    }
    if (checked === 0) {
      out.push(issue('V05', 'info', `edition ${ed.edition_id}`, `reach not checked: no truth segment reaches ${originCity} on the sampled days`));
      continue;
    }
    for (const [c, days] of [...missed].sort((a, b) => cmpStr(a[0], b[0]))) {
      const level = days.length >= checked ? 'error' : 'warning';
      out.push(issue('V05', level, `edition ${ed.edition_id}`, `${c} not reached from ${originCity} within ${o.reachHours} h when leaving on ${listDays(days)}`));
    }
  }
  return out;
}
