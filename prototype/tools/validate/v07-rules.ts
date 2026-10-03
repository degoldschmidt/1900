/**
 * V07 — running rules, edition validity and dates.
 *
 * Errors:
 *  - a services.running_rule or running_rules.rule_dsl does not parse (rule_dsl may also be
 *    "none": a mark without running-day meaning);
 *  - a service's rule, compiled over its edition's validity (open-ended: openEndedDays), gives
 *    no running day;
 *  - two editions of one family have overlapping validity (each family's editions must follow
 *    one another: "a transcribed issue holds until the next transcribed issue");
 *  - a calendar row's date_greg and date_jul name different days (Julian = Gregorian − 13 days
 *    between March 1900 and February 1918);
 *  - two rank-1 segment_sources rows give one segment two truth editions on one day;
 *  - notation files that do not parse (reported while loading).
 *  - a service whose running marks (running_as_printed) have a running_rules row that is not
 *    reviewed: the normaliser's --partial mode applies such proposals, so the service may not be
 *    compiled until the historian reviews them.
 * Warnings: a running_rules row not yet reviewed (the normaliser will not use it); a
 * segment_sources range reaching outside its edition's validity.
 */
import type { Dataset } from '../schema/dataset.ts';
import { editionRange, groupBy } from '../schema/derive.ts';
import { compileRule, parseRule, runningDays } from '../schema/running-rule.ts';
import { isoFromDay } from '#kit/time/calendar.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';

export function v07(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V07', 'error', w, m));
  const W = (w: string, m: string) => out.push(issue('V07', 'warning', w, m));
  const eds = new Map(ds.t.editions.map((e) => [e.edition_id, e]));
  for (const s of ds.t.services) {
    const w = `services.csv:${s.line}`;
    const p = parseRule(s.running_rule);
    if (!p.ok) { E(w, `${s.service_id}: running_rule "${s.running_rule}": ${p.error}`); continue; }
    const ed = eds.get(s.edition_id);
    if (!ed) continue;
    const [d0, d1] = editionRange(ed, ds.options.openEndedDays);
    if (runningDays(compileRule(p.rule, [d0, d1]), d0, d1).length === 0) {
      E(w, `${s.service_id}: running_rule "${s.running_rule}" gives no running day in ${ed.edition_id} (${isoFromDay(d0)}..${isoFromDay(d1)})`);
    }
  }
  const rr = new Map(ds.t.running_rules.map((r) => [`${r.edition_id}\u0000${r.table_ref}\u0000${r.mark}`, r]));
  for (const s of ds.t.services) {
    const marks = s.running_as_printed.split(';').map((m) => m.trim()).filter(Boolean);
    const keys = [...marks, ...(marks.length > 1 ? [marks.join('+')] : [])];
    const pending = keys.filter((m) => { const r = rr.get(`${s.edition_id}\u0000${s.table_ref}\u0000${m}`); return r !== undefined && !r.reviewed_by; });
    if (pending.length) E(`services.csv:${s.line}`, `${s.service_id}: running rule "${s.running_rule}" rests on running_rules rows not yet reviewed (${pending.join(', ')}); it cannot be compiled until a historian reviews them`);
  }
  for (const r of ds.t.running_rules) {
    const w = `running_rules.csv:${r.line}`;
    if (r.rule_dsl !== 'none') {
      const p = parseRule(r.rule_dsl);
      if (!p.ok) E(w, `rule_dsl "${r.rule_dsl}": ${p.error}`);
    }
    if (!r.reviewed_by) W(w, `${r.edition_id} ${r.table_ref} mark ${r.mark}: not reviewed (reviewed_by is empty), so the normaliser will not use it`);
  }
  for (const [fam, list] of groupBy(ds.t.editions, (e) => e.family)) {
    const sorted = [...list].sort((a, b) => a.valid_from - b.valid_from || cmpStr(a.edition_id, b.edition_id));
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i]!; const b = sorted[i + 1]!;
      if (a.valid_to === null || a.valid_to >= b.valid_from) {
        E(`editions.csv:${b.line}`, `family ${fam}: ${a.edition_id} (to ${a.valid_to === null ? 'open' : isoFromDay(a.valid_to)}) overlaps ${b.edition_id} (from ${isoFromDay(b.valid_from)})`);
      }
    }
  }
  for (const c of ds.t.calendar) {
    if (c.date_greg !== null && c.date_jul !== null && c.date_greg !== c.date_jul) {
      E(`calendar.csv:${c.line}`, `${c.event_id}: date_greg ${isoFromDay(c.date_greg)} and date_jul (= ${isoFromDay(c.date_jul)} Gregorian) are different days`);
    }
  }
  for (const [seg, rows] of groupBy(ds.t.segment_sources.filter((r) => r.rank === 1), (r) => r.segment_id)) {
    const sorted = [...rows].sort((a, b) => a.date_from - b.date_from || cmpStr(a.edition_id, b.edition_id));
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i]!; const b = sorted[i + 1]!;
      if (b.date_from <= a.date_to) E(`segment_sources.csv:${b.line}`, `segment ${seg} has two truth editions (${a.edition_id}, ${b.edition_id}) from ${isoFromDay(b.date_from)}`);
    }
  }
  for (const r of ds.t.segment_sources) {
    const ed = eds.get(r.edition_id);
    if (!ed) continue;
    if (r.date_from < ed.valid_from || (ed.valid_to !== null && r.date_to > ed.valid_to)) {
      W(`segment_sources.csv:${r.line}`, `${r.segment_id} ${r.edition_id}: ${isoFromDay(r.date_from)}..${isoFromDay(r.date_to)} reaches outside the edition's validity (truth is clipped to it)`);
    }
  }
  return out;
}
