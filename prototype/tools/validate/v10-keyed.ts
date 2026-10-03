/**
 * V10 — every timetable page in scope is double-keyed.
 *
 * In scope: every pages.csv row with content=table whose source has an edition named in
 * segment_sources.csv (truth or cross-check for a covered segment). For each table_ref the page
 * lists, data/raw/<source_id>/<table_ref>/crops.csv must list the crops on that page, and each
 * crop needs both keyings, <crop_id>.A.csv and <crop_id>.B.csv, unless data/raw/status.csv has a
 * row for it (source_id, table_ref, crop_id) whose status starts with "skip" and whose note gives
 * the reason. A whole table (or a page with no crops yet) may be skipped with crop_id "*".
 *
 * Errors: a missing keying or crops list without a skip reason; a skip row without a note.
 * Warnings: an in-scope table page that lists no table_refs; a crop with agreement_permille
 * below 950 whose status is not "rekeyed" (the plan re-keys any crop below 95% agreement).
 */
import type { Dataset } from '../schema/dataset.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';

export function v10(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const E = (w: string, m: string) => out.push(issue('V10', 'error', w, m));
  const W = (w: string, m: string) => out.push(issue('V10', 'warning', w, m));
  const files = new Set(ds.raw.rawFiles);
  const covered = new Set(ds.t.segment_sources.map((r) => r.edition_id));
  const sourcesInScope = new Set(ds.t.editions.filter((e) => covered.has(e.edition_id)).map((e) => e.source_id));
  const skip = (source: string, table: string, crop: string) => ds.status.find((s) =>
    s.source_id === source && s.table_ref === table && (s.crop_id === crop || s.crop_id === '*') && s.status.startsWith('skip'));
  for (const s of ds.status) {
    if (s.status.startsWith('skip') && !s.note) E(`raw/status.csv:${s.line}`, `${s.source_id} ${s.table_ref} ${s.crop_id}: a skip needs a reason in note`);
    if (s.agreement_permille !== null && s.agreement_permille < 950 && s.status !== 'rekeyed' && !s.status.startsWith('skip')) {
      W(`raw/status.csv:${s.line}`, `${s.source_id} ${s.table_ref} ${s.crop_id}: agreement ${s.agreement_permille}‰ is below 950‰; re-key the crop`);
    }
  }
  const pages = [...ds.t.pages].sort((a, b) => cmpStr(a.source_id, b.source_id) || a.page_seq - b.page_seq);
  for (const p of pages) {
    if (p.content !== 'table' || !sourcesInScope.has(p.source_id)) continue;
    const w = `pages.csv:${p.line}`;
    if (p.table_refs.length === 0) { W(w, `${p.source_id} p${p.page_seq} is a table page but lists no table_refs`); continue; }
    for (const table of p.table_refs) {
      const crops = (ds.crops.get(`${p.source_id}/${table}`) ?? []).filter((c) => c.page_seq === p.page_seq).sort((a, b) => cmpStr(a.crop_id, b.crop_id));
      if (crops.length === 0) {
        if (!skip(p.source_id, table, '*')) E(w, `${p.source_id} p${p.page_seq} table ${table}: no crops in raw/${p.source_id}/${table}/crops.csv and no skip reason in raw/status.csv`);
        continue;
      }
      for (const c of crops) {
        const base = `${p.source_id}/${table}/${c.crop_id}`;
        const missing = ['A', 'B'].filter((k) => !files.has(`${base}.${k}.csv`));
        if (missing.length && !skip(p.source_id, table, c.crop_id)) {
          E(w, `${p.source_id} p${p.page_seq} table ${table} crop ${c.crop_id}: keying ${missing.join(' and ')} missing (raw/${base}.${missing[0]}.csv) and no skip reason`);
        }
      }
    }
  }
  return out;
}
