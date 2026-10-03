/**
 * V01 — schema: headers, types and enums (reported while parsing, see tools/schema/canonical.ts),
 * unique keys, foreign keys, and row-level consistency:
 *  - from ≤ to on every dated row; segment ends differ; fares go somewhere;
 *  - a time and its day offset are given together;
 *  - frontier stations name a frontier pair that names them back;
 *  - every service has at least two stops;
 *  - a calendar event has a Gregorian or Julian date;
 *  - a through link joins two services of its edition at a station both serve.
 * All V01 findings are errors.
 */
import { TABLE_SPECS, type TableName } from '../schema/canonical.ts';
import type { Dataset } from '../schema/dataset.ts';
import { stopsByService } from '../schema/derive.ts';
import { issue, type Issue } from '../schema/issues.ts';

const E = (where: string, msg: string): Issue => issue('V01', 'error', where, msg);

export function v01(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const raw = ds.raw.tables;
  // Unique keys and foreign keys work on the raw records, so a row with a bad value elsewhere
  // does not cause a cascade of missing-reference errors.
  const values = new Map<string, Set<string>>();
  const columnValues = (table: string, col: string): Set<string> => {
    const k = `${table}.${col}`;
    let s = values.get(k);
    if (!s) {
      s = new Set((raw[table as TableName]?.rows ?? []).map((r) => (r.values[col] ?? '').trim()).filter((v) => v !== ''));
      values.set(k, s);
    }
    return s;
  };
  for (const spec of TABLE_SPECS) {
    const rt = raw[spec.name];
    if (rt.missing || rt.header.join(',') !== spec.columns.map((c) => c.name).join(',')) continue;
    const seen = new Map<string, number>();
    for (const r of rt.rows) {
      const key = spec.key.map((k) => (r.values[k] ?? '').trim()).join('\u0000');
      const prev = seen.get(key);
      if (prev !== undefined) out.push(E(`${spec.file}:${r.line}`, `duplicate key (${spec.key.join(', ')}) = (${key.split('\u0000').join(', ')}), first at line ${prev}`));
      else seen.set(key, r.line);
      for (const c of spec.columns) {
        if (!c.ref) continue;
        const v = (r.values[c.name] ?? '').trim();
        if (v === '') continue;
        const [tt, tc] = c.ref.split('.') as [string, string];
        const items = c.type === 'list' || c.type === 'enumlist' ? v.split(';').map((x) => x.trim()).filter(Boolean) : [v];
        for (const it of items) {
          if (!columnValues(tt, tc).has(it)) out.push(E(`${spec.file}:${r.line}`, `${c.name} "${it}" not found in ${tt}.csv (${tc})`));
        }
      }
    }
  }

  const t = ds.t;
  const order = (file: string, line: number, a: number | null, b: number | null, what: string) => {
    if (a !== null && b !== null && a > b) out.push(E(`${file}:${line}`, `${what}: start is after end`));
  };
  for (const r of t.editions) order('editions.csv', r.line, r.valid_from, r.valid_to, 'valid_from..valid_to');
  for (const r of t.segment_sources) order('segment_sources.csv', r.line, r.date_from, r.date_to, 'date_from..date_to');
  for (const r of t.jurisdictions) order('jurisdictions.csv', r.line, r.from, r.to, 'from..to');
  for (const r of t.zones) order('zones.csv', r.line, r.from, r.to, 'from..to');
  for (const r of t.station_zones) order('station_zones.csv', r.line, r.from, r.to, 'from..to');
  for (const r of t.params) order('params.csv', r.line, r.from, r.to, 'from..to');
  for (const r of t.institutions) order('institutions.csv', r.line, r.from, r.to, 'from..to');
  for (const r of t.segments) if (r.from_station === r.to_station) out.push(E(`segments.csv:${r.line}`, 'a segment must join two different stations'));
  for (const r of t.fares) if (r.from_station_id === r.to_station_id) out.push(E(`fares.csv:${r.line}`, 'a fare must join two different stations'));
  for (const r of t.calendar) if (r.date_greg === null && r.date_jul === null) out.push(E(`calendar.csv:${r.line}`, 'an event needs date_greg or date_jul'));

  const stations = new Map(t.stations.map((s) => [s.station_id, s]));
  for (const s of t.stations) {
    if (s.is_frontier && !s.frontier_pair_id) out.push(E(`stations.csv:${s.line}`, `${s.station_id} is a frontier station without frontier_pair_id`));
    if (!s.is_frontier && s.frontier_pair_id) out.push(E(`stations.csv:${s.line}`, `${s.station_id} has a frontier_pair_id but is_frontier is n`));
    if (s.frontier_pair_id) {
      const p = stations.get(s.frontier_pair_id);
      if (p && p.frontier_pair_id !== s.station_id) out.push(E(`stations.csv:${s.line}`, `frontier pair ${s.station_id}→${s.frontier_pair_id} is not reciprocal`));
      if (p && p.country === s.country) out.push(E(`stations.csv:${s.line}`, `frontier pair ${s.station_id}/${p.station_id} lies in one country (${s.country})`));
    }
  }

  for (const s of t.stops) {
    const w = `stops.csv:${s.line}`;
    if (s.arr_local !== '' && s.arr_dayoff === null) out.push(E(w, 'arr_local without arr_dayoff'));
    if (s.arr_local === '' && s.arr_dayoff !== null) out.push(E(w, 'arr_dayoff without arr_local'));
    if (s.dep_local !== '' && s.dep_dayoff === null) out.push(E(w, 'dep_local without dep_dayoff'));
    if (s.dep_local === '' && s.dep_dayoff !== null) out.push(E(w, 'dep_dayoff without dep_local'));
    if (s.arr_local === '' && s.dep_local === '' && s.status !== 'waived' && s.status !== 'illegible') out.push(E(w, 'a stop needs an arrival or a departure time'));
  }
  const sbs = stopsByService(ds);
  for (const svc of t.services) {
    if ((sbs.get(svc.service_id) ?? []).length < 2) out.push(E(`services.csv:${svc.line}`, `${svc.service_id} has fewer than two stops`));
  }
  const svcById = new Map(t.services.map((s) => [s.service_id, s]));
  for (const l of t.through_links) {
    const w = `through_links.csv:${l.line}`;
    for (const id of [l.from_service_id, l.to_service_id]) {
      const svc = svcById.get(id);
      if (!svc) continue;
      if (svc.edition_id !== l.edition_id) out.push(E(w, `${id} belongs to edition ${svc.edition_id}, not ${l.edition_id}`));
      if (!(sbs.get(id) ?? []).some((s) => s.station_id === l.station_id)) out.push(E(w, `${id} does not stop at ${l.station_id}`));
    }
    if (l.from_service_id === l.to_service_id) out.push(E(w, 'a through link joins two different services'));
  }
  return out;
}
