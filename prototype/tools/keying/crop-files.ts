/** Loading a table's layout, crop index and keying files, shared by diff, merge, resolve-support, sample and review. */
import { existsSync, readFileSync } from 'node:fs';
import { cropsCsv, keyingCsv, layoutJson, type Roots } from './paths.ts';
import { cellKey, parseLong, parseResolved, type KeyedCell, type ResolvedCell, type ParseResult } from './longcsv.ts';
import { keyInCrop, loadCropsCsv, loadLayout, type CropRow, type Layout } from '../crops/layout.ts';

export interface TableFiles { layout: Layout; crops: CropRow[] }

export function loadTable(r: Roots, source: string, table: string): TableFiles {
  const lp = layoutJson(r, source, table);
  const cp = cropsCsv(r, source, table);
  if (!existsSync(lp)) throw new Error(`no layout ${lp}`);
  if (!existsSync(cp)) throw new Error(`no crop index ${cp} (run tools/crops/make-crops.ts)`);
  return { layout: loadLayout(lp), crops: loadCropsCsv(cp) };
}

export function cropOf(t: TableFiles, cropId: string): CropRow {
  const c = t.crops.find((x) => x.crop_id === cropId);
  if (!c) throw new Error(`crop ${cropId} is not in crops.csv of ${t.layout.table_ref}`);
  return c;
}

/** Reads <crop>.A.csv or .B.csv; null when the file does not exist. */
export function readKeyer(r: Roots, source: string, table: string, crop: string, who: 'A' | 'B'): ParseResult<KeyedCell> | null {
  const p = keyingCsv(r, source, table, crop, who);
  if (!existsSync(p)) return null;
  return parseLong(readFileSync(p, 'utf8'), { file: p, cropId: crop });
}

export function readResolvedFile(r: Roots, source: string, table: string, crop: string): ParseResult<ResolvedCell> | null {
  const p = keyingCsv(r, source, table, crop, 'R');
  if (!existsSync(p)) return null;
  return parseResolved(readFileSync(p, 'utf8'), { file: p, cropId: crop });
}

/** Keys that do not belong to the crop's grid (wrong absolute col/row numbers). */
export function outsideCrop(cells: readonly KeyedCell[], layout: Layout, crop: CropRow): string[] {
  return cells.filter((c) => !keyInCrop(layout, crop, c)).map((c) => `${cellKey(c)} is outside ${crop.crop_id} (cols ${crop.cols[0]}–${crop.cols[1]}, rows ${crop.rows[0]}–${crop.rows[1]})`);
}
