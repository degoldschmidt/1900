/**
 * V08 — fares. Errors:
 *  - amount_minor is not a positive integer (minor units: GBP farthings, 1d = 4; FRF/BEF/CHF
 *    centimes; DEM pfennig; NLG cents; AUK heller; RUB kopecks);
 *  - for the same edition, from, to, scope, single/return and currency, a 1st-class fare below
 *    the 2nd, or a 2nd below the 3rd;
 *  - a return below the single for the same edition, from, to, scope, class and currency;
 *  - the currency differs from the from-station's country currency (fares are sold where the
 *    journey starts; country → currency in tools/schema/canonical.ts COUNTRY_CURRENCY).
 * Warnings: a station whose country has no known currency; a return fare with no validity_days.
 */
import type { Dataset } from '../schema/dataset.ts';
import { COUNTRY_CURRENCY } from '../schema/canonical.ts';
import { groupBy } from '../schema/derive.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';

export function v08(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V08', 'error', w, m));
  const W = (w: string, m: string) => out.push(issue('V08', 'warning', w, m));
  const stations = new Map(ds.t.stations.map((s) => [s.station_id, s]));
  for (const f of ds.t.fares) {
    const w = `fares.csv:${f.line}`;
    if (!Number.isInteger(f.amount_minor) || f.amount_minor <= 0) E(w, `amount_minor ${f.amount_minor} must be a positive integer`);
    if (f.single_return === 'r' && f.validity_days === null) W(w, 'return fare without validity_days');
    const st = stations.get(f.from_station_id);
    if (!st) continue;
    const want = COUNTRY_CURRENCY[st.country];
    if (want === undefined) W(w, `no currency known for country ${st.country} of ${st.station_id}`);
    else if (want !== f.currency) E(w, `${f.currency} fare from ${st.station_id} (${st.country}); fares sold there are in ${want}`);
  }
  const key = (f: { edition_id: string; from_station_id: string; to_station_id: string; scope: string; currency: string }) =>
    [f.edition_id, f.from_station_id, f.to_station_id, f.scope, f.currency].join(' ');
  for (const [k, list] of [...groupBy(ds.t.fares, (f) => `${key(f)} ${f.single_return}`)].sort((a, b) => cmpStr(a[0], b[0]))) {
    const by = new Map(list.map((f) => [f.class, f]));
    for (const [hi, lo] of [['1', '2'], ['2', '3'], ['1', '3']] as const) {
      const a = by.get(hi); const b = by.get(lo);
      if (a && b && a.amount_minor < b.amount_minor) E(`fares.csv:${a.line}`, `${k}: class ${hi} (${a.amount_minor}) is cheaper than class ${lo} (${b.amount_minor})`);
    }
  }
  for (const [k, list] of [...groupBy(ds.t.fares, (f) => `${key(f)} ${f.class}`)].sort((a, b) => cmpStr(a[0], b[0]))) {
    const s = list.find((f) => f.single_return === 's'); const r = list.find((f) => f.single_return === 'r');
    if (s && r && r.amount_minor < s.amount_minor) E(`fares.csv:${r.line}`, `${k}: return (${r.amount_minor}) is cheaper than single (${s.amount_minor})`);
  }
  return out;
}
