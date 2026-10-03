import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv, writeCsv } from '../csv.ts';
import {
  allocate, applyScore, boundPasses, cellsNeeded, collectPopulation, drawSample, hypergeometricCdf, populationSizes, runDraw,
  SAMPLE_COLUMNS, scoreMarkdown, scoreSample, upperBoundErrors, upperBoundRate,
} from '../sample.ts';
import { readStatus, updateStatusFile } from '../status.ts';
import { resolvedTables, SOURCE, truthGrid } from './fixture.ts';
import type { Roots } from '../paths.ts';

/** The sample file of `label` with each row passed through `f` (the truth of its cell given). */
function rewriteSample(r: Roots, label: string, f: (row: Record<string, string>, truth: ReturnType<typeof truthGrid>[number]) => Record<string, string>): void {
  const path = join(r.data, 'review', `sample-${label}.csv`);
  const t = parseCsv(readFileSync(path, 'utf8'));
  const truth = new Map(truthGrid().map((c) => [`${c.col}:${c.row}`, c]));
  writeFileSync(path, writeCsv(SAMPLE_COLUMNS, t.rows.map((row) => f(row, truth.get(`${row.col}:${row.row}`)!))));
}

const readAsTruth = (row: Record<string, string>, c: ReturnType<typeof truthGrid>[number]) => ({ ...row, reread_text: c.text, reread_marks: c.marks.join(';'), reread_sure: 'y' });

describe('historian sample', () => {
  it('draws a blind, deterministic, stratified sample: 5% of stop cells, 10% of fares, at least one per table', async () => {
    const r = await resolvedTables();
    const pop = collectPopulation(r);
    expect(pop).toHaveLength(22); // 11 printed body cells per table; blanks and footnotes are not sampled
    expect(populationSizes(pop)).toEqual(new Map([[SOURCE, 22]]));
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

  it('draws only from resolved crops: a skipped (superseded) or not-yet-resolved crop is never sampled', async () => {
    const r = await resolvedTables();
    const status = join(r.data, 'raw', 'status.csv');
    const crops = (pop: ReturnType<typeof collectPopulation>) => [...new Set(pop.map((p) => p.crop.crop_id))].sort();
    expect(crops(collectPopulation(r))).toEqual(['T10-c0-3-r0-2', 'T9-c0-3-r0-2']);
    const set = (crop: string, table: string, st: 'skipped' | 'diffed' | 'resolved') =>
      updateStatusFile(status, [{ source_id: SOURCE, table_ref: table, crop_id: crop, status: st, agreement_permille: '', note: st === 'skipped' ? 'superseded by -v2 crops (test)' : '' }]);
    set('T10-c0-3-r0-2', 'T10', 'skipped');
    expect(crops(collectPopulation(r))).toEqual(['T9-c0-3-r0-2']);
    set('T10-c0-3-r0-2', 'T10', 'diffed'); // an R.csv exists, but the crop is not resolved
    expect(crops(collectPopulation(r))).toEqual(['T9-c0-3-r0-2']);
    set('T10-c0-3-r0-2', 'T10', 'resolved');
    expect(crops(collectPopulation(r))).toEqual(['T10-c0-3-r0-2', 'T9-c0-3-r0-2']);
  });

  it('--n draws exactly n cells, split over the tables in proportion to their size, at least one each', async () => {
    const r = await resolvedTables();
    const pop = collectPopulation(r);
    const five = drawSample(pop, { seed: '1914', n: 5 });
    // 11 + 11 cells: quotas 2.5 each, the odd cell to the first stratum (T10 sorts before T9).
    expect(five.map((p) => [p.table_ref, p.rate])).toEqual([['T10', 273], ['T10', 273], ['T10', 273], ['T9', 182], ['T9', 182]]);
    expect(drawSample(pop, { seed: '1914', n: 5 })).toEqual(five);
    // The same seed orders cells the same way, so a larger n extends a smaller one within each table.
    const key = (p: (typeof five)[number]) => `${p.table_ref}:${p.cell.col}:${p.cell.row}`;
    const nine = new Set(drawSample(pop, { seed: '1914', n: 9 }).map(key));
    for (const p of five) expect(nine.has(key(p))).toBe(true);
    expect(drawSample(pop, { seed: '1914', n: 1 }).map((p) => p.table_ref)).toEqual(['T10']);
    expect(drawSample(pop, { seed: '1914', n: 500 })).toHaveLength(22); // capped at the population
    expect(() => drawSample(pop, { seed: '1', n: 5, stopPermille: 50 })).toThrow(/--n replaces/);
    expect(() => drawSample(pop, { seed: '1', n: 0 })).toThrow(/positive whole number/);
    expect(() => drawSample(pop, { seed: '1', n: 2.5 })).toThrow(/positive whole number/);
    const res = await runDraw(r, 'big', { seed: '3', n: 7 });
    expect(res.rows).toBe(7);
    const t = parseCsv(readFileSync(join(r.data, 'review', 'sample-big.csv'), 'utf8'));
    expect(t.rows.map((x) => x.table_ref)).toEqual(['T10', 'T10', 'T10', 'T10', 'T9', 'T9', 'T9']);
  });

  it('allocates in proportion (largest remainder), at least one per stratum while n allows, never above a stratum', () => {
    // The G2 draw: --n 360 over the six pilot tables (112, 12, 123, 126, 13, 23 with 114, 91, 73, 128, 90, 157 cells).
    expect(allocate([114, 91, 73, 128, 90, 157], 360)).toEqual([63, 50, 40, 71, 50, 86]);
    expect(allocate([1000, 1, 1], 3)).toEqual([1, 1, 1]);
    expect(allocate([5, 5], 1)).toEqual([1, 0]);
    expect(allocate([3, 4], 100)).toEqual([3, 4]);
    expect(allocate([0, 6], 3)).toEqual([0, 3]);
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 300 }), { minLength: 1, maxLength: 8 }), fc.integer({ min: 1, max: 1500 }), (sizes, n) => {
      const a = allocate(sizes, n);
      const total = sizes.reduce((x, y) => x + y, 0);
      expect(a.reduce((x, y) => x + y, 0)).toBe(Math.min(n, total));
      a.forEach((k, i) => {
        expect(k).toBeLessThanOrEqual(sizes[i]!);
        if (sizes[i]! > 0 && n >= sizes.filter((s) => s > 0).length) expect(k).toBeGreaterThanOrEqual(1);
      });
    }));
  });

  it('scores by the 95% upper bound and marks tables with errors for re-keying when the source fails', async () => {
    const r = await resolvedTables();
    await runDraw(r, 'g2', { seed: '7' });
    rewriteSample(r, 'g2', readAsTruth);
    const ok = scoreSample(r, 'g2');
    expect(ok).toMatchObject({ read: 3, unread: 0, illegible: 0, errors: 0, typography: 0 });
    // No error in 3 of 22 cells: the bound is far above 0.5%, so the source does not pass yet.
    expect(ok.bySource[0]).toMatchObject({ source_id: SOURCE, population: 22, read: 3, errors: 0, permille: 0, boundErrors: 13, pass: false, fail: true, needed: 21, tables: [] });
    expect(scoreMarkdown('g2', ok)).toContain('read ≥ 21 (18 more) with no further error');
    expect(applyScore(r, ok, 'g2')).toEqual([]); // nothing to re-key without an error

    rewriteSample(r, 'g2', (row, c) => ({ ...readAsTruth(row, c), reread_text: row.table_ref === 'T10' ? `${c.text}0` : c.text }));
    const bad = scoreSample(r, 'g2');
    expect(bad.errors).toBe(2);
    expect(bad.bySource[0]).toMatchObject({ source_id: SOURCE, fail: true, tables: ['T10'] });
    expect(scoreMarkdown('g2', bad)).toContain('**Verdict: FAIL** (ia-fixturebook: 2 value error(s); re-key tables T10');
    const updates = applyScore(r, bad, 'g2');
    expect(updates.map((u) => u.crop_id)).toEqual(['T10-c0-3-r0-2', 'T10-fn-p1']);
    const st = readStatus(join(r.data, 'raw', 'status.csv'));
    expect(st.find((s) => s.crop_id === 'T10-c0-3-r0-2')!.status).toBe('rekey');
    expect(st.find((s) => s.crop_id === 'T9-c0-3-r0-2')!.status).toBe('resolved');
    // A skipped crop of a failing table stays skipped.
    updateStatusFile(join(r.data, 'raw', 'status.csv'), [{ source_id: SOURCE, table_ref: 'T10', crop_id: 'T10-fn-p1', status: 'skipped', agreement_permille: '', note: 'superseded (test)' }]);
    expect(applyScore(r, bad, 'g2').map((u) => u.crop_id)).toEqual(['T10-c0-3-r0-2']);
    expect(readStatus(join(r.data, 'raw', 'status.csv')).find((s) => s.crop_id === 'T10-fn-p1')!.status).toBe('skipped');
  });

  it('passes when the bound is at most 0.5%; blank rows are unread (not errors) and sure=x rows are not measured', async () => {
    const r = await resolvedTables();
    await runDraw(r, 'all', { seed: '11', n: 22 });
    rewriteSample(r, 'all', readAsTruth);
    const census = scoreSample(r, 'all');
    expect(census.bySource[0]).toMatchObject({ population: 22, read: 22, errors: 0, boundErrors: 0, bound: 0, pass: true, fail: false, needed: 21 });
    const md = scoreMarkdown('all', census);
    expect(md).toContain('**Verdict: PASS**');
    expect(md).toContain('| ia-fixturebook | 22 | 22 | 0 | 0.00% | 0.000% (≤ 0 of 22) | PASS | — |  |');

    // One cell left blank (image not loaded): 21 of 22 read still passes; two blank do not.
    const blank = (ids: string[]) => (row: Record<string, string>, c: ReturnType<typeof truthGrid>[number]) =>
      (ids.includes(row.sample_id!) ? { ...row, reread_text: '', reread_marks: '', reread_sure: '', note: 'image not loaded' } : readAsTruth(row, c));
    rewriteSample(r, 'all', blank(['Sall-0004']));
    expect(scoreSample(r, 'all').bySource[0]).toMatchObject({ read: 21, errors: 0, pass: true });
    rewriteSample(r, 'all', blank(['Sall-0004', 'Sall-0017']));
    const two = scoreSample(r, 'all');
    expect(two).toMatchObject({ read: 20, unread: 2, errors: 0 });
    expect(two.unreadRows.map((x) => x.sample_id)).toEqual(['Sall-0004', 'Sall-0017']);
    expect(two.bySource[0]).toMatchObject({ boundErrors: 1, pass: false, needed: 21 });
    // The report lists unread rows apart and never shows what was stored for them.
    const twoMd = scoreMarkdown('all', two);
    expect(twoMd).toMatch(/## Unread \(2\): blank re-reading, not scored and not errors/);
    const values = truthGrid().map((c) => c.text).filter((x) => x.length > 2);
    for (const line of twoMd.split('\n').filter((l) => /Sall-0004|Sall-0017/.test(l))) for (const v of values) expect(line).not.toContain(v);

    // sure=x: seen but illegible to the reviewer, so not measured either.
    rewriteSample(r, 'all', (row, c) => (row.sample_id === 'Sall-0009' ? { ...row, reread_text: '', reread_marks: '', reread_sure: 'x', note: 'too faint' } : readAsTruth(row, c)));
    const x = scoreSample(r, 'all');
    expect(x).toMatchObject({ read: 21, illegible: 1, unread: 0, errors: 0 });
    expect(scoreMarkdown('all', x)).toContain('## Seen but illegible to the reviewer (1): reread_sure x, not measured');
  });

  it('compares by value under the source\'s notation rules: typography is listed but is not an error', async () => {
    const r = await resolvedTables();
    await runDraw(r, 'v', { seed: '11', n: 22 });
    const fill = () => rewriteSample(r, 'v', (row, c) => {
      const base = readAsTruth(row, c);
      if (row.table_ref !== 'T9') return base;
      if (row.col === '1' && row.row === '0') return { ...base, reread_marks: '' }; // resolved `9 40` [b]: bold left out
      if (row.col === '0' && row.row === '1') return { ...base, reread_marks: 'i' }; // `8 32` read as italic
      if (row.col === '3' && row.row === '0') return { ...base, reread_text: '11.05' }; // another separator
      if (row.col === '2' && row.row === '1') return { ...base, reread_marks: '' }; // `10 12` [fn:†]: the sign left out
      return base;
    });
    fill();
    // Default rules (no notation file): bold on a body cell is value (p.m.); italic and separators are not.
    const def = scoreSample(r, 'v');
    expect(def.mismatches.map((m) => [m.expected, m.reread])).toEqual([['9 40 [b]', '9 40 []'], ['10 12 [fn:†]', '10 12 []']]);
    expect(def.typographyOnly.map((m) => [m.expected, m.reread])).toEqual([['11 05 []', '11.05 []'], ['8 32 []', '8 32 [i]']]);
    expect(def.bySource[0]!.valueMarks).toEqual({ cell: ['b', 'u'], header: ['u'] });

    // A guide whose notation gives meaning to underlining only, with the category read from italic on the header (P-010, P-013).
    mkdirSync(join(r.data, 'canonical', 'notation'), { recursive: true });
    writeFileSync(join(r.data, 'canonical', 'notation', 'FIX.json'), JSON.stringify({ src: `${SOURCE}:p2:-:-:-`, valueMarks: ['u'], category: { marks: { i: 'Schnellzug' } } }));
    const fkb = scoreSample(r, 'v');
    expect(fkb.mismatches.map((m) => [m.expected, m.reread])).toEqual([['10 12 [fn:†]', '10 12 []']]);
    expect(fkb.typographyOnly).toHaveLength(3);
    expect(fkb.bySource[0]!.valueMarks).toEqual({ cell: ['u'], header: ['i', 'u'] });
    expect(scoreMarkdown('v', fkb)).toContain('type styles that are value on body cells: u; on header cells: i, u');
  });

  it('refuses malformed re-readings instead of scoring them', async () => {
    const r = await resolvedTables();
    await runDraw(r, 'm', { seed: '2', n: 4 });
    const one = (patch: Record<string, string>) => rewriteSample(r, 'm', (row, c) => (row.sample_id === 'Sm-0001' ? { ...readAsTruth(row, c), ...patch } : readAsTruth(row, c)));
    one({ reread_sure: '' });
    expect(() => scoreSample(r, 'm')).toThrow(/a re-reading without reread_sure/);
    one({ reread_sure: 'maybe' });
    expect(() => scoreSample(r, 'm')).toThrow(/reread_sure "maybe" is not y, n or x/);
    one({ reread_marks: 'italic' });
    expect(() => scoreSample(r, 'm')).toThrow(/unknown mark "italic"/);
  });
});

describe('the exact upper bound (hypergeometric, one-sided 95%)', () => {
  it('G2 on 653 cells: 0 errors in 344 read pass (≤ 3 wrong, 0.46%), 343 do not (≤ 4, 0.61%)', () => {
    expect(upperBoundErrors(653, 344, 0)).toBe(3);
    expect(upperBoundRate(653, 344, 0)).toBeLessThanOrEqual(0.005);
    expect(boundPasses(653, 344, 0)).toBe(true);
    expect(upperBoundErrors(653, 343, 0)).toBe(4);
    expect(boundPasses(653, 343, 0)).toBe(false);
    expect(cellsNeeded(653, 0)).toBe(344);
    // One or two errors need far more; four can never pass, since 4/653 is above 0.5% even in a census.
    expect(cellsNeeded(653, 1)).toBe(491);
    expect(cellsNeeded(653, 2)).toBe(589);
    expect(cellsNeeded(653, 4)).toBeNull();
    // The G2 draw of 360 leaves 16 cells for unreadable ones.
    expect(boundPasses(653, 360, 0)).toBe(true);
  });

  it('a 20% sample (133 of 653, no error) bounds the rate near 2%: 1.99% exact, 2.23% without the finite-population correction', () => {
    expect(upperBoundErrors(653, 133, 0)).toBe(13);
    expect(upperBoundRate(653, 133, 0)).toBeCloseTo(13 / 653, 10);
    expect(upperBoundRate(653, 133, 0)).toBeGreaterThan(0.019);
    // In a very large population the bound tends to the binomial (Clopper–Pearson) one, 1 − 0.05^(1/133).
    const binomial = 1 - Math.pow(0.05, 1 / 133);
    expect(binomial).toBeCloseTo(0.0223, 4);
    expect(upperBoundRate(1_000_000, 133, 0)).toBeCloseTo(binomial, 4);
    // The pilot re-check: 0 errors in 56 read.
    expect(upperBoundErrors(653, 56, 0)).toBe(32);
  });

  it('matches hand-computed small cases and the limits', () => {
    // N=10, n=5, e=0: P(no error | D) = C(10−D, 5)/C(10, 5) = .5, .222, .083, .024 for D = 1…4.
    expect(hypergeometricCdf(0, 10, 3, 5)).toBeCloseTo(21 / 252, 12);
    expect(hypergeometricCdf(0, 10, 4, 5)).toBeCloseTo(6 / 252, 12);
    expect(upperBoundErrors(10, 5, 0)).toBe(3);
    // e=1: P(X ≤ 1 | D) = (C(10−D,5) + D·C(10−D,4))/252 = .262, .103, .024 for D = 4, 5, 6.
    expect(hypergeometricCdf(1, 10, 5, 5)).toBeCloseTo(26 / 252, 12);
    expect(upperBoundErrors(10, 5, 1)).toBe(5);
    // Every cell read: the count is known exactly. Nothing read: nothing is known.
    expect(upperBoundErrors(653, 653, 2)).toBe(2);
    expect(upperBoundErrors(653, 0, 0)).toBe(653);
    expect(hypergeometricCdf(7, 653, 40, 7)).toBeCloseTo(1, 10);
    expect(cellsNeeded(22, 0)).toBe(21);
    expect(() => upperBoundErrors(10, 5, 6)).toThrow(/0 ≤ errors/);
    expect(() => upperBoundErrors(10, 11, 0)).toThrow(/0 ≤ errors/);
  });
});
