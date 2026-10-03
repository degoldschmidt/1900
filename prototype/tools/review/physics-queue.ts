/**
 * Physics re-read queue (decision P-E021): the cells behind every V03 issue about a leg or a dwell,
 * as a sample file for a blind re-reading.
 *
 *   node tools/review/physics-queue.ts --label <label> [--data <data root>] [--sources a,b]
 *
 * A lost or extra underline (the night mark) shifts a time by 12 hours, and a misread hour by one or
 * more, so V03 then reports a leg that is too slow, too fast or runs backwards, or a dwell that is too
 * long or negative. In the G2 sample, V03 had flagged a train at 3 km/h whose Tetschen time had lost
 * its underline; the warning was listed but nobody re-read the cell. This tool turns each such issue
 * into the cells to re-read: both stops of a leg (either may be wrong) and the stop of a dwell, each
 * printed line of a stop (an arrival and a departure on two lines are two cells). A cell named by
 * several issues is listed once. Issues without a leg or stop (a first stop without a departure, a
 * missing zone) are not physics and are left to their own checks.
 *
 * Writes
 *   data/review/sample-<label>.csv   location fields only (tools/keying/sample.ts SAMPLE_COLUMNS), never
 *                                    the transcription or the reason, so the re-reading stays blind;
 *   build/review/physics-<label>.md  for the coordinator: which issue put each cell in the queue.
 * Then tools/review/contact-sheet.ts lays the cells out, a reader fills the file, and
 * tools/keying/sample.ts score --label <label> compares the readings by value. Every queued cell is
 * re-read before a source is accepted; a cell whose reading confirms the print keeps its time, with
 * the issue explained in the historian's review.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { cmpStr, writeCsv, writeTextFile } from '../keying/csv.ts';
import { assertSafeId, cropsCsv, layoutJson, roots, type Roots } from '../keying/paths.ts';
import { SAMPLE_COLUMNS } from '../keying/sample.ts';
import { keyBox, loadCropsCsv, loadLayout } from '../crops/layout.ts';
import { parseCellRef, parseCitation } from '../schema/citation.ts';
import { loadDataset, type Dataset } from '../schema/dataset.ts';
import type { Issue } from '../schema/issues.ts';
import { runSuite } from '../validate/suite.ts';

/** A V03 issue about a leg or a dwell, with the stops it names. */
export interface PhysicsIssue { service: string; seqs: number[]; level: Issue['level']; message: string }

/** The V03 issues that name a leg (seq a→b) or a dwell (seq n), in order. */
export function physicsIssues(issues: readonly Issue[]): PhysicsIssue[] {
  const out: PhysicsIssue[] = [];
  for (const i of issues) {
    if (i.check !== 'V03' || i.level === 'info') continue;
    const service = /^service (\S+)$/.exec(i.where)?.[1];
    if (!service) continue;
    const leg = /\(seq (\d+)→(\d+)\)/.exec(i.message);
    const stop = /dwell .*\(seq (\d+)\)/.exec(i.message);
    if (leg) out.push({ service, seqs: [Number(leg[1]), Number(leg[2])], level: i.level, message: i.message });
    else if (stop) out.push({ service, seqs: [Number(stop[1])], level: i.level, message: i.message });
  }
  return out;
}

/** One printed cell to re-read, with every issue that names it. */
export interface PhysicsCell {
  source_id: string; page_seq: number; table_ref: string; crop_id: string; col: number; row: number;
  reasons: string[];
}

/** The cells behind the issues, each once, in page order. Stops without a body-cell citation are skipped (listed in `unplaced`). */
export function physicsCells(ds: Dataset, items: readonly PhysicsIssue[], sources?: readonly string[]): { cells: PhysicsCell[]; unplaced: string[] } {
  const stops = new Map(ds.t.stops.map((s) => [`${s.service_id}#${s.seq}`, s]));
  const cells = new Map<string, PhysicsCell>();
  const unplaced: string[] = [];
  for (const it of items) {
    for (const seq of it.seqs) {
      const stop = stops.get(`${it.service}#${seq}`);
      const cite = stop ? parseCitation(stop.src) : null;
      const ref = cite?.cell ? parseCellRef(cite.cell) : null;
      if (!stop || !cite || !ref || ref.kind !== 'cell' || !cite.tableRef || !cite.crop) {
        unplaced.push(`${it.service} seq ${seq}: ${stop ? `no body-cell citation (${stop.src})` : 'no such stop'}`);
        continue;
      }
      if (sources && !sources.includes(cite.source)) continue;
      for (let row = ref.row; row <= ref.row2; row++) {
        const k = `${cite.source}\u0000${cite.tableRef}\u0000${ref.col}\u0000${row}`;
        const c = cells.get(k) ?? { source_id: cite.source, page_seq: cite.pageSeq, table_ref: cite.tableRef, crop_id: cite.crop, col: ref.col, row, reasons: [] };
        const why = `${it.service} (${it.level}): ${it.message}`;
        if (!c.reasons.includes(why)) c.reasons.push(why);
        cells.set(k, c);
      }
    }
  }
  const list = [...cells.values()].sort((a, b) => cmpStr(a.source_id, b.source_id) || a.page_seq - b.page_seq || cmpStr(a.table_ref, b.table_ref) || a.row - b.row || a.col - b.col);
  return { cells: list, unplaced };
}

export interface QueueResult { rows: number; csv: string; report: string; unplaced: string[] }

/** Runs V03 on the canonical data and writes the queue as sample-<label>.csv, with the reasons apart. */
export function runPhysicsQueue(r: Roots, label: string, o: { data?: string; sources?: readonly string[] } = {}): QueueResult {
  assertSafeId('label', label);
  const ds = loadDataset(o.data ?? r.data);
  const items = physicsIssues(runSuite(ds, ['V03']).issues);
  const { cells, unplaced } = physicsCells(ds, items, o.sources);
  const rows = cells.map((c, i) => {
    const layout = loadLayout(layoutJson(r, c.source_id, c.table_ref));
    const cp = cropsCsv(r, c.source_id, c.table_ref);
    const crop = existsSync(cp) ? loadCropsCsv(cp).find((x) => x.crop_id === c.crop_id) : undefined;
    if (!crop) throw new Error(`${c.source_id}/${c.table_ref}: crop ${c.crop_id} (cited by ${c.reasons[0]}) is not in crops.csv`);
    return {
      sample_id: `S${label}-${String(i + 1).padStart(4, '0')}`, source_id: c.source_id, table_ref: c.table_ref, page_seq: String(c.page_seq),
      crop_id: c.crop_id, kind: 'cell', col: String(c.col), row: String(c.row), page_region: keyBox(layout, crop, { kind: 'cell', col: c.col, row: c.row }).join(','),
      rate_permille: '', reread_text: '', reread_marks: '', reread_sure: '', note: '',
    };
  });
  const csv = writeCsv(SAMPLE_COLUMNS, rows);
  writeTextFile(join(r.data, 'review', `sample-${label}.csv`), csv);
  const report = [
    `# Physics re-read queue ${label}`, '',
    `${items.length} V03 issue(s) about a leg or a dwell → ${rows.length} cell(s) to re-read blind (data/review/sample-${label}.csv). For the coordinator only: do not show this file to the reader.`, '',
    '| sample | cell | why |', '|---|---|---|',
    ...cells.map((c, i) => `| ${rows[i]!.sample_id} | ${c.source_id}:p${c.page_seq}:${c.table_ref}:${c.crop_id}:c${c.col}r${c.row} | ${c.reasons.join('<br>')} |`),
    '', ...(unplaced.length ? ['Not placed (no body-cell citation):', '', ...unplaced.map((u) => `- ${u}`), ''] : []),
  ].join('\n');
  writeTextFile(join(r.build, 'review', `physics-${label}.md`), report);
  return { rows: rows.length, csv, report, unplaced };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const label = opt('--label');
  if (!label) {
    console.error('usage: physics-queue.ts --label <label> [--data <data root>] [--sources a,b]');
    process.exit(1);
  }
  try {
    const r = roots();
    const o: { data?: string; sources?: string[] } = {};
    if (opt('--data') !== undefined) o.data = resolve(opt('--data')!);
    if (opt('--sources') !== undefined) o.sources = opt('--sources')!.split(',');
    const res = runPhysicsQueue(r, label, o);
    console.log(`${res.rows} cell(s) → data/review/sample-${label}.csv; reasons in build/review/physics-${label}.md (coordinator only)`);
    for (const u of res.unplaced) console.log(`not placed: ${u}`);
  } catch (e) { console.error((e as Error).message); process.exit(1); }
}
