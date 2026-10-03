/** A small table on a generated page, with crops, for the keying tests. */
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { roots, type Roots } from '../paths.ts';
import { writeLong, type KeyedCell } from '../longcsv.ts';
import { runDiff } from '../diff.ts';
import { mergeCrop } from '../merge.ts';
import type { Layout } from '../../crops/layout.ts';
import { makeCrops } from '../../crops/make-crops.ts';

export const SOURCE = 'ia-fixturebook';
export const TABLE = 'T9';
export const GRID = 'T9-c0-3-r0-2';
export const FN = 'T9-fn-p1';

export function layout(table = TABLE, kind: Layout['table_kind'] = 'timetable'): Layout {
  return {
    layout_version: 1, source_id: SOURCE, table_ref: table, table_kind: kind, title: 'SYN_A – SYN_B',
    panels: [{
      panel: 'p1', page_seq: 2,
      table_bbox: [20, 50, 420, 125], label_bbox: [20, 100, 170, 75], header_bbox: [200, 50, 240, 50],
      col_x: [200, 260, 320, 380, 440], row_y: [100, 125, 150, 175], first_col: 0, first_row: 0,
      header_y: [50, 75, 100], footnote_bbox: [20, 190, 420, 30],
    }],
  };
}

const c = (kind: KeyedCell['kind'], col: number, row: number, text: string, marks: string[] = [], crop = GRID): KeyedCell => ({ crop_id: crop, kind, col, row, text, marks, sure: 'y' });

/** The truth of the grid crop: 2 header lines × 4 columns, 3 labels, 12 cells. */
export function truthGrid(): KeyedCell[] {
  return [
    c('header', 0, 0, '12'), c('header', 1, 0, 'D 40', ['b']), c('header', 2, 0, '14'), c('header', 3, 0, '16'),
    c('header', 0, 1, '1 2 3'), c('header', 1, 1, '1 2'), c('header', 2, 1, '〃'), c('header', 3, 1, '1 2 3'),
    c('label', 0, 0, 'SYN_Altenhagen'), c('label', 0, 1, 'SYN_Neubrück'), c('label', 0, 2, 'SYN_Oberfeld'),
    c('cell', 0, 0, '8 15'), c('cell', 1, 0, '9 40', ['b']), c('cell', 2, 0, '—'), c('cell', 3, 0, '11 05'),
    c('cell', 0, 1, '8 32'), c('cell', 1, 1, '|'), c('cell', 2, 1, '10 12', ['fn:†']), c('cell', 3, 1, '11 21'),
    c('cell', 0, 2, '8 50'), c('cell', 1, 2, '10 11', ['b']), c('cell', 2, 2, '10 30'), c('cell', 3, 2, ''),
  ];
}

export function truthFootnotes(): KeyedCell[] {
  return [c('footnote', 0, 0, '† Runs on SYN weekdays only.', ['fn:†'], FN)];
}

export async function setupTable(o: { table?: string; kind?: Layout['table_kind']; r?: Roots } = {}): Promise<{ r: Roots; dir: string }> {
  const r = o.r ?? roots({ root: mkdtempSync(join(tmpdir(), 'p1900-keying-')) });
  const table = o.table ?? TABLE;
  mkdirSync(join(r.scans, SOURCE), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="250"><rect width="500" height="250" fill="#fff"/>
    ${[200, 260, 320, 380, 440].map((x) => `<line x1="${x}" y1="50" x2="${x}" y2="175" stroke="#444"/>`).join('')}
    <text x="215" y="140" font-size="14" font-family="Liberation Serif">8 32</text></svg>`;
  writeFileSync(join(r.scans, SOURCE, 'p2.png'), await sharp(Buffer.from(svg)).png().toBuffer());
  const dir = join(r.data, 'raw', SOURCE, table);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'layout.json'), JSON.stringify(layout(table, o.kind ?? 'timetable')));
  await makeCrops(r, SOURCE, table);
  return { r, dir };
}

/** Tables T9 (timetable) and T10 (fares), both keyed from the truth by A and B and resolved: 11 printed body cells each. */
export async function resolvedTables(): Promise<Roots> {
  const { r, dir } = await setupTable({ table: 'T9' });
  const t10 = await setupTable({ table: 'T10', kind: 'fares', r });
  for (const [d, table] of [[dir, 'T9'], [t10.dir, 'T10']] as const) {
    const grid = GRID.replace('T9', table); const fn = FN.replace('T9', table);
    writeKeyer(d, grid, 'A', truthGrid()); writeKeyer(d, grid, 'B', truthGrid());
    writeKeyer(d, fn, 'A', truthFootnotes()); writeKeyer(d, fn, 'B', truthFootnotes());
    runDiff(r, SOURCE, table);
    for (const crop of [grid, fn]) if (!mergeCrop(r, SOURCE, table, crop).ok) throw new Error(`fixture: ${crop} did not resolve`);
  }
  return r;
}

export function writeKeyer(dir: string, crop: string, who: 'A' | 'B' | 'R', cells: KeyedCell[] | string): void {
  writeFileSync(join(dir, `${crop}.${who}.csv`), typeof cells === 'string' ? cells : writeLong(cells.map((x) => ({ ...x, crop_id: crop }))));
}

/** Copies truth with edits: replace text/marks/sure of given keys, or drop them (null). */
export function edit(cells: KeyedCell[], changes: Record<string, Partial<KeyedCell> | null>): KeyedCell[] {
  const out: KeyedCell[] = [];
  for (const x of cells) {
    const k = `${x.kind}:${x.col}:${x.row}`;
    if (!(k in changes)) { out.push(x); continue; }
    const ch = changes[k];
    if (ch) out.push({ ...x, ...ch });
  }
  return out;
}
