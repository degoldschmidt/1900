import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { parseCsv, writeCsv } from '../../keying/csv.ts';
import { parseResolved } from '../../keying/longcsv.ts';
import { runDraw, SAMPLE_COLUMNS } from '../../keying/sample.ts';
import { resolvedTables } from '../../keying/test/fixture.ts';
import type { Roots } from '../../keying/paths.ts';
import { chooseGrid, fitTile, keyText, runContactSheets, SHEET_COLUMNS, SHEET_DEFAULTS } from '../contact-sheet.ts';

/** The fixture's two resolved tables with a sample of all 22 cells (label cs); one row already carries a re-reading. */
async function sampled(): Promise<{ r: Roots; ids: string[] }> {
  const r = await resolvedTables();
  await runDraw(r, 'cs', { seed: '5', n: 22 });
  const path = join(r.data, 'review', 'sample-cs.csv');
  const t = parseCsv(readFileSync(path, 'utf8'));
  writeFileSync(path, writeCsv(SAMPLE_COLUMNS, t.rows.map((row, i) => (i === 2 ? { ...row, reread_text: 'REREAD 98 76', reread_marks: 'u', reread_sure: 'y', note: 'seen: 98 76' } : row))));
  return { r, ids: t.rows.map((row) => row.sample_id!) };
}

const sheetsCsv = (dir: string) => parseCsv(readFileSync(join(dir, 'sheets.csv'), 'utf8'));
const sheetFiles = (dir: string) => readdirSync(dir).filter((f) => /^sheet-\d+\.png$/.test(f)).sort();

describe('contact sheets', () => {
  it('puts every sampled cell on a numbered tile, 16 per sheet (4×4), and maps (sheet, tile) to sample_id', async () => {
    const { r, ids } = await sampled();
    const res = await runContactSheets(r, 'cs');
    expect(res.dir).toBe(join(r.build, 'review', 'sample-cs'));
    expect(res.grid).toEqual({ cols: 4, rows: 4, perSheet: 16 });
    expect(res.sheets.map((s) => [s.file, s.tiles])).toEqual([['sheet-01.png', 16], ['sheet-02.png', 6]]);
    expect(sheetFiles(res.dir)).toEqual(['sheet-01.png', 'sheet-02.png']);
    const t = sheetsCsv(res.dir);
    expect(t.header).toEqual([...SHEET_COLUMNS]);
    expect(t.rows.map((x) => [x.sheet, x.tile, x.file, x.sample_id])).toEqual(ids.map((id, i) => {
      const sheet = i < 16 ? '01' : '02';
      return [sheet, String(i + 1), `sheet-${sheet}.png`, id];
    }));
    expect(t.rows[0]).toMatchObject({ table_ref: 'T10', kind: 'cell', page_seq: '2' });
    // Tile texts: the running number and the key, nothing else.
    expect(res.texts.slice(0, 2)).toEqual(['1', keyText({ table_ref: 'T10', kind: 'cell', col: Number(t.rows[0]!.col), row: Number(t.rows[0]!.row) })]);
    expect(res.texts[1]).toMatch(/^table T10 · c\d · r\d$/);
    for (const s of res.sheets) {
      const m = await sharp(join(res.dir, s.file)).metadata();
      expect([m.width, m.height]).toEqual([s.width, s.height]);
      expect(Math.max(m.width!, m.height!)).toBeLessThanOrEqual(1500);
    }
    expect(res.scale.min).toBeGreaterThanOrEqual(2);
    expect(res.scale.max).toBeLessThanOrEqual(4);
    expect(t.rows.every((x) => Number(x.scale) >= 2)).toBe(true);

    // Fewer per sheet on request; a new run replaces the folder's sheets, and the draw's zooms stay.
    const six = await runContactSheets(r, 'cs', { perSheet: 6 });
    expect(six.grid.perSheet).toBe(6);
    expect(six.sheets.map((s) => s.tiles)).toEqual([6, 6, 6, 4]);
    expect(sheetFiles(six.dir)).toEqual(['sheet-01.png', 'sheet-02.png', 'sheet-03.png', 'sheet-04.png']);
    await runContactSheets(r, 'cs');
    expect(sheetFiles(res.dir)).toEqual(['sheet-01.png', 'sheet-02.png']);
    expect(existsSync(join(res.dir, `${ids[0]}.png`))).toBe(true);
  });

  it('--filter-tables puts one reviewer\'s tables in a folder of their own', async () => {
    const { r, ids } = await sampled();
    const res = await runContactSheets(r, 'cs', { tables: ['T9'] });
    expect(res.dir).toBe(join(r.build, 'review', 'sample-cs', 'tables-T9'));
    const t = sheetsCsv(res.dir);
    expect(t.rows).toHaveLength(11);
    expect(new Set(t.rows.map((x) => x.table_ref))).toEqual(new Set(['T9']));
    expect(t.rows.map((x) => x.tile)).toEqual(Array.from({ length: 11 }, (_, i) => String(i + 1)));
    expect(t.rows.map((x) => x.sample_id)).toEqual(ids.slice(11));
    expect(res.sheets).toHaveLength(1);
    await expect(runContactSheets(r, 'cs', { tables: ['T9', 'T99'] })).rejects.toThrow(/no rows for table\(s\) T99/);
  });

  it('falls back to fewer tiles per sheet rather than show a cell below the least magnification, and keeps the long side', async () => {
    const { r } = await sampled();
    // On a 1000 px sheet a 4×4 tile cannot show a 60 px cell at 3×; 3 columns × 4 rows can.
    const res = await runContactSheets(r, 'cs', { maxLong: 1000, minScale: 3, out: 'build/review/small' });
    expect(res.dir).toBe(join(r.root, 'build', 'review', 'small'));
    expect(res.grid).toEqual({ cols: 3, rows: 4, perSheet: 12 });
    expect(res.sheets.map((s) => s.tiles)).toEqual([12, 10]);
    expect(res.scale.min).toBeGreaterThanOrEqual(3);
    for (const s of res.sheets) {
      const m = await sharp(join(res.dir, s.file)).metadata();
      expect(Math.max(m.width!, m.height!)).toBeLessThanOrEqual(1000);
    }
    await expect(runContactSheets(r, 'cs', { maxLong: 100 })).rejects.toThrow(/cannot be shown at 2× within 100 px/);
    // One wide cell among 20 on the default 1500 px sheet: 4 columns would show it below 2×, so 3 × 5.
    const cells = (wide: readonly [number, number]) => [...Array.from({ length: 19 }, () => [60, 25] as const), wide];
    expect(chooseGrid(cells([170, 30]), SHEET_DEFAULTS).grid).toMatchObject({ cols: 3, rows: 5 });
    expect(chooseGrid(cells([136, 26]), SHEET_DEFAULTS).grid).toMatchObject({ cols: 4, rows: 4 });
    // A run smaller than a sheet gets the biggest tiles that hold it on one sheet.
    expect(chooseGrid([[60, 25], [60, 25]], SHEET_DEFAULTS).fits.map((f) => f.s)).toEqual([4, 4]);
    // The fit itself: less context before less magnification, and never below 2×.
    expect(fitTile(60, 25, 337, 291)).toMatchObject({ mx: 21, my: 25, s: 3.3, W: 337 });
    expect(fitTile(136, 26, 337, 291)).toMatchObject({ mx: 16, s: 2 });
    expect(fitTile(200, 26, 337, 291)).toBeNull();
  });

  it('never carries the transcription: no resolved value or earlier re-reading in sheets.csv or on a tile', async () => {
    const { r } = await sampled();
    const res = await runContactSheets(r, 'cs');
    const values = new Set<string>();
    for (const table of ['T9', 'T10']) {
      const dir = join(r.data, 'raw', 'ia-fixturebook', table);
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.R.csv'))) {
        for (const c of parseResolved(readFileSync(join(dir, f), 'utf8')).cells) if (c.text.length > 2) values.add(c.text);
      }
    }
    expect(values.size).toBeGreaterThan(10);
    for (const v of [...values, 'REREAD 98 76', '98 76']) {
      for (const row of sheetsCsv(res.dir).rows) for (const field of Object.values(row)) expect(field).not.toContain(v);
      for (const text of res.texts) expect(text).not.toContain(v);
    }
    expect(readFileSync(join(res.dir, 'sheets.csv'), 'utf8')).not.toMatch(/reread|REREAD|seen/);
  });
});
