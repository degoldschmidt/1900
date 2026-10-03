/**
 * V02 — citations and design values.
 *
 * Errors:
 *  - a row of a cited table has no src (params: no src for a historical basis, no dv_id for a
 *    design basis); src_or_dv does not match its basis (historical → citation, design → DV id);
 *  - a citation is malformed, or its source or page is not in sources.csv / pages.csv;
 *  - a design-value id is not defined in data/design/DESIGN_VALUES.md (or is malformed there);
 *  - a design value appears in services, stops, fares, calendar or zones (banned there), or in
 *    any other src column (design values go in src_or_dv or dv_id only);
 *  - a running_rules row interprets a mark that footnotes.csv does not record.
 * Warnings: a citation names a table the page does not list; a params dv_id with two historical
 * bases. Info: a design value no row uses.
 *
 * Exempt (no citation column): sources, pages, editions, segments and segment_sources (they
 * describe the sources themselves), cities (their facts are their jurisdiction's and stations'),
 * running_rules (interpretations; cited through footnotes.csv).
 */
import type { Dataset } from '../schema/dataset.ts';
import { isDvId, parseCitation } from '../schema/citation.ts';
import { issue, type Issue } from '../schema/issues.ts';

/** Tables in which design values are banned outright. */
export const DV_BANNED = ['services', 'stops', 'fares', 'calendar', 'zones'] as const;

export function v02(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V02', 'error', w, m));
  const W = (w: string, m: string) => out.push(issue('V02', 'warning', w, m));
  const pages = new Map(ds.t.pages.map((p) => [`${p.source_id}:${p.page_seq}`, p]));
  const sources = new Set(ds.t.sources.map((s) => s.source_id));
  const dvs = new Set(ds.designValues.map((d) => d.id));
  const usedDv = new Set<string>();

  const checkCite = (w: string, col: string, v: string): void => {
    const c = parseCitation(v);
    if (!c) { E(w, `${col} "${v}" is not a citation <source>:p<page>:<table|->:<crop|->:<cell|->`); return; }
    if (!sources.has(c.source)) { E(w, `${col} names source ${c.source}, not in sources.csv`); return; }
    const p = pages.get(`${c.source}:${c.pageSeq}`);
    if (!p) { E(w, `${col} names page ${c.source} p${c.pageSeq}, not in pages.csv`); return; }
    if (c.tableRef !== null && p.table_refs.length > 0 && !p.table_refs.includes(c.tableRef)) {
      W(w, `${col} names table ${c.tableRef}, but pages.csv lists ${p.table_refs.join(';')} for ${c.source} p${c.pageSeq}`);
    }
  };
  const checkDv = (w: string, col: string, v: string): void => {
    if (!isDvId(v)) { E(w, `${col} "${v}" is not a design-value id DV-###`); return; }
    usedDv.add(v);
    if (!dvs.has(v)) E(w, `${col} ${v} is not defined in DESIGN_VALUES.md`);
  };
  /** A src column: a citation only. */
  const src = (table: string, line: number, v: string, col = 'src'): void => {
    const w = `${table}.csv:${line}`;
    if (v === '') { E(w, `no ${col} citation`); return; }
    if (isDvId(v)) {
      usedDv.add(v);
      if ((DV_BANNED as readonly string[]).includes(table)) E(w, `design values are banned in ${table}.csv (${v}); only transcribed, cited values belong here`);
      else E(w, `${col} must be a citation; design values go in src_or_dv or dv_id (${v})`);
      return;
    }
    checkCite(w, col, v);
  };
  /** A src_or_dv column, consistent with its basis. */
  const srcOrDv = (table: string, line: number, v: string, basis: string): void => {
    const w = `${table}.csv:${line}`;
    if (v === '') { E(w, 'no src_or_dv'); return; }
    if (isDvId(v)) {
      if (basis !== 'design') E(w, `basis is ${basis} but src_or_dv is a design value (${v})`);
      checkDv(w, 'src_or_dv', v);
    } else {
      if (basis === 'design') E(w, `basis is design but src_or_dv is not a design-value id ("${v}")`);
      checkCite(w, 'src_or_dv', v);
    }
  };

  const t = ds.t;
  for (const r of t.jurisdictions) src('jurisdictions', r.line, r.src);
  for (const r of t.stations) src('stations', r.line, r.src);
  for (const r of t.station_aliases) src('station_aliases', r.line, r.src);
  for (const r of t.zones) src('zones', r.line, r.src);
  for (const r of t.station_zones) src('station_zones', r.line, r.src);
  for (const r of t.services) src('services', r.line, r.src);
  for (const r of t.stops) src('stops', r.line, r.src);
  for (const r of t.footnotes) src('footnotes', r.line, r.src);
  for (const r of t.through_links) src('through_links', r.line, r.src);
  for (const r of t.fares) src('fares', r.line, r.src);
  for (const r of t.calendar) src('calendar', r.line, r.src);
  for (const r of t.waivers) src('waivers', r.line, r.src);
  for (const r of t.transfers) srcOrDv('transfers', r.line, r.src_or_dv, r.basis);
  for (const r of t.min_change) srcOrDv('min_change', r.line, r.src_or_dv, r.basis);
  for (const r of t.institutions) srcOrDv('institutions', r.line, r.src_or_dv, r.basis);
  for (const r of t.params) {
    const w = `params.csv:${r.line}`;
    const anyHist = r.date_basis === 'historical' || r.value_basis === 'historical';
    const anyDesign = r.date_basis === 'design' || r.value_basis === 'design';
    if (r.src !== '') src('params', r.line, r.src);
    else if (anyHist) E(w, `${r.row_id}: a historical ${r.date_basis === 'historical' ? 'date' : 'value'} basis needs a src citation`);
    if (r.dv_id !== '') {
      checkDv(w, 'dv_id', r.dv_id);
      if (!anyDesign) W(w, `${r.row_id}: dv_id ${r.dv_id} given but both bases are historical`);
    } else if (anyDesign) E(w, `${r.row_id}: a design ${r.value_basis === 'design' ? 'value' : 'date'} basis needs a dv_id`);
  }
  const notes = new Set(t.footnotes.map((f) => `${f.edition_id}\u0000${f.table_ref}\u0000${f.mark}`));
  for (const r of t.running_rules) {
    for (const m of r.mark.split('+')) {
      if (!notes.has(`${r.edition_id}\u0000${r.table_ref}\u0000${m}`)) {
        E(`running_rules.csv:${r.line}`, `mark "${m}" of ${r.edition_id} table ${r.table_ref} is not in footnotes.csv`);
      }
    }
  }
  for (const d of ds.designValues) if (!usedDv.has(d.id)) out.push(issue('V02', 'info', `DESIGN_VALUES.md:${d.line}`, `${d.id} is not used by any row`));
  return out;
}
