/**
 * V11 — nothing unresolved reaches the canonical tables.
 *
 * Historian waivers live in data/canonical/waivers.csv (waiver_id, src, note, historian,
 * reviewed_on): src cites the one cell waived (source:page:table:crop:cell). A waiver accepts a
 * cell that stays illegible or disputed; the normaliser then emits the stop with status "waived"
 * and the cell's time left empty.
 *
 * Errors:
 *  - a stop whose status is not agree|resolved|waived;
 *  - a waived stop with no waiver whose src lies within the stop's src (same source, page, table
 *    and column, and a row within the stop's rows);
 *  - a resolved cell (raw/<source>/<table>/<crop>.R.csv) with an empty resolution (unresolved) or
 *    resolution "illegible" and no waiver, in a table that already has services in services.csv.
 *    A crop whose raw/status.csv status is skipped (e.g. superseded by a re-keyed "-v2" crop) is
 *    not read: its files stay as the record, and its cells are neither unresolved nor illegible.
 * Warnings: such cells in tables not yet normalised (keying in progress); a waiver that matches
 * no stop and no cell.
 */
import type { Dataset } from '../schema/dataset.ts';
import { citationCovers, formatCitation } from '../schema/citation.ts';
import { cmpStr } from '../schema/csv.ts';
import { issue, type Issue } from '../schema/issues.ts';
import { cropIsSkipped } from '../keying/status.ts';

const REF: Record<string, (col: number, row: number) => string> = {
  cell: (c, r) => `c${c}r${r}`, header: (c, r) => `h${r}c${c}`, label: (c, r) => `l${c}r${r}`, footnote: (_c, r) => `f${r}`,
};

export function v11(ds: Dataset): Issue[] {
  const out: Issue[] = [];
  const used = new Set<string>();
  for (const s of ds.t.stops) {
    const w = `stops.csv:${s.line}`;
    if (s.status !== 'agree' && s.status !== 'resolved' && s.status !== 'waived') {
      out.push(issue('V11', 'error', w, `${s.service_id} seq ${s.seq} has status ${s.status}; only agree, resolved or waived may be compiled`));
    }
    if (s.status === 'waived') {
      const ws = ds.t.waivers.filter((x) => citationCovers(s.src, x.src));
      if (ws.length === 0) out.push(issue('V11', 'error', w, `${s.service_id} seq ${s.seq} is waived but no waiver in waivers.csv cites a cell of ${s.src}`));
      for (const x of ws) used.add(x.waiver_id);
    }
  }
  const sourceOfEdition = new Map(ds.t.editions.map((e) => [e.edition_id, e.source_id]));
  const normalised = new Set(ds.t.services.map((s) => `${sourceOfEdition.get(s.edition_id) ?? ''}/${s.table_ref}`));
  for (const key of [...ds.resolved.keys()].sort(cmpStr)) {
    const [source, table, crop] = key.split('/') as [string, string, string];
    if (cropIsSkipped(ds.status, source, table, crop)) continue;
    const page = (ds.crops.get(`${source}/${table}`) ?? []).find((c) => c.crop_id === crop)?.page_seq;
    for (const c of ds.resolved.get(key)!) {
      if (c.resolution !== '' && c.resolution !== 'illegible') continue;
      const cell = REF[c.kind]!(c.col, c.row);
      const cite = page === undefined ? null : formatCitation({ source, pageSeq: page, tableRef: table, crop, cell });
      const ws = cite === null ? [] : ds.t.waivers.filter((x) => citationCovers(x.src, cite) || citationCovers(cite, x.src));
      for (const x of ws) used.add(x.waiver_id);
      if (ws.length) continue;
      const level = normalised.has(`${source}/${table}`) ? 'error' : 'warning';
      out.push(issue('V11', level, `raw/${key}.R.csv:${c.line}`, `${c.kind} ${cell} is ${c.resolution === '' ? 'unresolved' : 'illegible'} and has no waiver${page === undefined ? ' (crop not in crops.csv)' : ''}`));
    }
  }
  for (const x of ds.t.waivers) if (!used.has(x.waiver_id)) out.push(issue('V11', 'warning', `waivers.csv:${x.line}`, `${x.waiver_id} matches no waived stop and no unresolved cell`));
  return out;
}
