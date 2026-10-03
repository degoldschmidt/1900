/**
 * V12 — the world calendar and the parameter layer are cited and labelled. Errors:
 *  - a calendar row (every calendar row is Tier 0) or a Tier-0 params row without a src citation;
 *  - a Tier-0 params row whose date_basis is design (Tier-0 dates are historical facts);
 *  - a params row without both date_basis and value_basis, or an institution without basis;
 *  - a public row depending on a non-public one. "Depends" means:
 *      (a) a public calendar event lists a non-public params row in its effects (the event's date
 *          would reveal the hidden change); every calendar event is public unless its kind starts
 *          with "secret" (e.g. "secret-decree");
 *      (b) a public params row whose value_json contains {"$row": "<row_id>"} naming a non-public row.
 * Warnings: an effect whose params row does not start on the event's day (effects are rows whose
 * `from` coincides with the event).
 */
import type { Dataset } from '../schema/dataset.ts';
import { isoFromDay } from '#kit/time/calendar.ts';
import { issue, type Issue } from '../schema/issues.ts';

export const isSecretKind = (kind: string): boolean => kind.startsWith('secret');

/** Row ids named by {"$row": id} anywhere inside a JSON value. */
export function rowRefs(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap(rowRefs);
  if (typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>;
    const own = typeof o.$row === 'string' ? [o.$row] : [];
    return [...own, ...Object.keys(o).sort().flatMap((k) => (k === '$row' ? [] : rowRefs(o[k])))];
  }
  return [];
}

export function v12(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V12', 'error', w, m));
  const params = new Map(ds.t.params.map((p) => [p.row_id, p]));
  for (const c of ds.t.calendar) {
    const w = `calendar.csv:${c.line}`;
    if (!c.src) E(w, `${c.event_id}: Tier-0 calendar rows must be cited`);
    const day = c.date_greg ?? c.date_jul;
    for (const id of c.effects) {
      const p = params.get(id);
      if (!p) continue;
      if (!isSecretKind(c.kind) && !p.public) E(w, `public event ${c.event_id} has the non-public effect ${id} (mark the event kind "secret-…" or make the row public)`);
      if (day !== null && p.from !== day) out.push(issue('V12', 'warning', w, `${c.event_id} (${isoFromDay(day)}): effect ${id} starts on ${isoFromDay(p.from)}`));
    }
  }
  for (const p of ds.t.params) {
    const w = `params.csv:${p.line}`;
    if (!p.date_basis || !p.value_basis) E(w, `${p.row_id}: both date_basis and value_basis are required`);
    if (p.tier === '0') {
      if (!p.src) E(w, `${p.row_id}: Tier-0 rows must be cited (src)`);
      if (p.date_basis === 'design') E(w, `${p.row_id}: a Tier-0 row's date must be historical`);
    }
    if (p.public) {
      for (const ref of rowRefs(p.value_json)) {
        const q = params.get(ref);
        if (!q) E(w, `${p.row_id}: value_json names unknown row ${ref}`);
        else if (!q.public) E(w, `public row ${p.row_id} depends on non-public row ${ref}`);
      }
    }
  }
  for (const i of ds.t.institutions) if (!i.basis) E(`institutions.csv:${i.line}`, `${i.inst_id}: basis is required`);
  return out;
}
