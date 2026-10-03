/**
 * V04 — the same train printed in several places.
 *
 * Within one edition, services with the same train_key (one printed train shown in several
 * tables) must agree exactly at every station both print: arrival with arrival and departure with
 * departure where both tables print them, and the same day-offset difference between any two
 * shared stations. Disagreements are errors (one table was misread, or the guide contradicts
 * itself and the historian must resolve it).
 *
 * Across source families (e.g. Bradshaw's Continental against the Reichs-Kursbuch), services with
 * the same train_key in editions whose validity overlaps are compared the same way and every
 * difference is a warning: the truth comes from segment_sources.csv, the other guide only
 * cross-checks.
 */
import type { Dataset } from '../schema/dataset.ts';
import type { ServiceRow, StopRow } from '../schema/canonical.ts';
import { groupBy, stopsByService } from '../schema/derive.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue, type Level } from '../schema/issues.ts';

interface Cmp { station: string; field: 'arr' | 'dep'; a: string; b: string }

/** Differences between two printings of a train at the stations both print once. */
export function compareStops(sa: readonly StopRow[], sb: readonly StopRow[]): { diffs: Cmp[]; dayDiffs: string[]; shared: number } {
  const once = (l: readonly StopRow[]) => {
    const g = groupBy(l, (s) => s.station_id);
    return new Map([...g].filter(([, v]) => v.length === 1).map(([k, v]) => [k, v[0]!]));
  };
  const A = once(sa); const B = once(sb);
  const shared = [...A.keys()].filter((k) => B.has(k)).sort(cmpStr);
  const diffs: Cmp[] = [];
  for (const st of shared) {
    const x = A.get(st)!; const y = B.get(st)!;
    if (x.arr_local && y.arr_local && x.arr_local !== y.arr_local) diffs.push({ station: st, field: 'arr', a: x.arr_local, b: y.arr_local });
    if (x.dep_local && y.dep_local && x.dep_local !== y.dep_local) diffs.push({ station: st, field: 'dep', a: x.dep_local, b: y.dep_local });
  }
  // Day offsets are relative to each service's own first stop, so compare differences.
  const dayOf = (s: StopRow) => s.dep_dayoff ?? s.arr_dayoff ?? 0;
  const dayDiffs: string[] = [];
  const s0 = shared[0];
  if (s0 !== undefined) {
    for (const st of shared.slice(1)) {
      const da = dayOf(A.get(st)!) - dayOf(A.get(s0)!); const db = dayOf(B.get(st)!) - dayOf(B.get(s0)!);
      if (da !== db) dayDiffs.push(`${s0}→${st}: ${da} day(s) against ${db}`);
    }
  }
  return { diffs, dayDiffs, shared: shared.length };
}

export function v04(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const sbs = stopsByService(ds);
  const eds = new Map(ds.t.editions.map((e) => [e.edition_id, e]));
  const report = (level: Level, a: ServiceRow, b: ServiceRow) => {
    const r = compareStops(sbs.get(a.service_id) ?? [], sbs.get(b.service_id) ?? []);
    const w = `train ${a.train_key}`;
    const what = `${a.service_id} (${a.edition_id} ${a.table_ref}) and ${b.service_id} (${b.edition_id} ${b.table_ref})`;
    for (const d of r.diffs) out.push(issue('V04', level, w, `${what} disagree at ${d.station} ${d.field}: ${d.a} vs ${d.b}`));
    for (const d of r.dayDiffs) out.push(issue('V04', level, w, `${what} disagree on day offsets ${d}`));
  };
  const byKey = groupBy(ds.t.services, (s) => s.train_key);
  for (const key of [...byKey.keys()].sort(cmpStr)) {
    const list = [...byKey.get(key)!].sort((a, b) => cmpStr(a.service_id, b.service_id));
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!; const b = list[j]!;
        if (a.edition_id === b.edition_id) {
          if (a.table_ref === b.table_ref) out.push(issue('V04', 'warning', `train ${key}`, `${a.service_id} and ${b.service_id} are the same train twice in table ${a.table_ref}`));
          report('error', a, b);
          continue;
        }
        const ea = eds.get(a.edition_id); const eb = eds.get(b.edition_id);
        if (!ea || !eb || ea.family === eb.family) continue;
        const overlap = ea.valid_from <= (eb.valid_to ?? Infinity) && eb.valid_from <= (ea.valid_to ?? Infinity);
        if (overlap) report('warning', a, b);
      }
    }
  }
  return out;
}
