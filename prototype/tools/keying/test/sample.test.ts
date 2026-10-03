import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, writeCsv } from '../csv.ts';
import { runDiff } from '../diff.ts';
import { mergeCrop } from '../merge.ts';
import { applyScore, collectPopulation, drawSample, runDraw, SAMPLE_COLUMNS, scoreMarkdown, scoreSample } from '../sample.ts';
import { readStatus } from '../status.ts';
import { FN, GRID, setupTable, SOURCE, truthFootnotes, truthGrid, writeKeyer } from './fixture.ts';
import type { Roots } from '../paths.ts';

async function resolvedTables(): Promise<Roots> {
  const { r, dir } = await setupTable({ table: 'T9' });
  const t10 = await setupTable({ table: 'T10', kind: 'fares', r });
  for (const [d, table] of [[dir, 'T9'], [t10.dir, 'T10']] as const) {
    const grid = GRID.replace('T9', table); const fn = FN.replace('T9', table);
    writeKeyer(d, grid, 'A', truthGrid()); writeKeyer(d, grid, 'B', truthGrid());
    writeKeyer(d, fn, 'A', truthFootnotes()); writeKeyer(d, fn, 'B', truthFootnotes());
    runDiff(r, SOURCE, table);
    expect(mergeCrop(r, SOURCE, table, grid).ok).toBe(true);
    expect(mergeCrop(r, SOURCE, table, fn).ok).toBe(true);
  }
  return r;
}

describe('historian sample', () => {
  it('draws a blind, deterministic, stratified sample: 5% of stop cells, 10% of fares, at least one per table', async () => {
    const r = await resolvedTables();
    const pop = collectPopulation(r);
    expect(pop).toHaveLength(22); // 11 printed body cells per table; blanks and footnotes are not sampled
    const s1 = drawSample(pop, { seed: '1914' });
    expect(s1.map((p) => [p.table_ref, p.rate])).toEqual([['T10', 100], ['T10', 100], ['T9', 50]]);
    expect(drawSample([...pop].reverse(), { seed: '1914' }).map((p) => `${p.table_ref}:${p.cell.col}:${p.cell.row}`))
      .toEqual(s1.map((p) => `${p.table_ref}:${p.cell.col}:${p.cell.row}`));
    const seeds = ['1', '2', '3', '4', '5'].map((seed) => drawSample(pop, { seed }).map((p) => `${p.table_ref}:${p.cell.col}:${p.cell.row}`).join(' '));
    expect(new Set(seeds).size).toBeGreaterThan(1);

    const res = await runDraw(r, 'pilot', { seed: '1914' });
    expect(res.rows).toBe(3);
    const t = parseCsv(readFileSync(join(r.data, 'review', 'sample-pilot.csv'), 'utf8'));
    expect(t.header).toEqual([...SAMPLE_COLUMNS]);
    expect(t.rows[0]).toMatchObject({ sample_id: 'Spilot-0001', source_id: SOURCE, reread_text: '', reread_sure: '' });
    // Blind: nothing in the file carries the transcription.
    const truthTexts = truthGrid().map((c) => c.text).filter((x) => x.length > 2);
    for (const row of t.rows) for (const v of Object.values(row)) expect(truthTexts).not.toContain(v);
    expect(existsSync(join(r.build, 'review', 'sample-pilot', 'Spilot-0001.png'))).toBe(true);
    expect((await runDraw(r, 'pilot', { seed: '1914' })).csv).toBe(res.csv);
  });

  it('scores the re-reading and marks failing tables for re-keying above 0.5%', async () => {
    const r = await resolvedTables();
    await runDraw(r, 'g2', { seed: '7' });
    const path = join(r.data, 'review', 'sample-g2.csv');
    const t = parseCsv(readFileSync(path, 'utf8'));
    const truth = new Map(truthGrid().map((c) => [`${c.col}:${c.row}`, c]));
    const fill = (wrongTable: string | null) => t.rows.map((row) => {
      const c = truth.get(`${row.col}:${row.row}`)!;
      const wrong = row.table_ref === wrongTable;
      return { ...row, reread_text: wrong ? `${c.text}0` : c.text, reread_marks: c.marks.join(';'), reread_sure: 'y' };
    });
    writeFileSync(path, writeCsv(SAMPLE_COLUMNS, fill(null)));
    const ok = scoreSample(r, 'g2');
    expect(ok).toMatchObject({ read: 3, unread: 0, errors: 0 });
    expect(ok.bySource[0]).toMatchObject({ fail: false, permille: 0 });

    writeFileSync(path, writeCsv(SAMPLE_COLUMNS, fill('T10')));
    const bad = scoreSample(r, 'g2');
    expect(bad.errors).toBe(2);
    expect(bad.bySource[0]).toMatchObject({ source_id: SOURCE, fail: true, tables: ['T10'] });
    expect(scoreMarkdown('g2', bad)).toContain('RE-KEY');
    const updates = applyScore(r, bad, 'g2');
    expect(updates.map((u) => u.crop_id)).toEqual(['T10-c0-3-r0-2', 'T10-fn-p1']);
    const st = readStatus(join(r.data, 'raw', 'status.csv'));
    expect(st.find((s) => s.crop_id === 'T10-c0-3-r0-2')!.status).toBe('rekey');
    expect(st.find((s) => s.crop_id === 'T9-c0-3-r0-2')!.status).toBe('resolved');
  });
});
