/**
 * End-to-end normalisation of the synthetic tricky table SYN_T9 (fixtures/tricky): two crops on
 * two pages stitched by absolute col/row; label ditto (〃) and a ditto with a dep. suffix; a
 * header ditto across crops; a.m./p.m. markers before the time; a midnight crossing; a
 * pass-through (|) and not-served (—) signs; a "noon" literal; a ditto in a time cell; a
 * customs sign in a label and a request sign in a cell; three clock zones (one with odd
 * seconds); a reviewed footnote mark and a mark with no running meaning; an illegible cell
 * waived by the historian; a cell resolved from keyer B.
 */
import { describe, it, expect } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cloneRawDataset, loadRaw, parseDataset, type RawDataset } from '../../schema/dataset.ts';
import { formatRow, headerOf, specOf } from '../../schema/canonical.ts';
import { writeCsvTable } from '../../schema/csv.ts';
import { inputFromDataset, mergeIntoCanonical, normalizeTable, type NormalizeInput, type NormalizeResult } from '../normalize.ts';

const TRICKY = fileURLToPath(new URL('./fixtures/tricky', import.meta.url));
const WORLD = fileURLToPath(new URL('../../schema/test/fixtures/syn-world', import.meta.url));
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const R1 = 'SYN_SRC_9/SYN_T9/SYN_K1.R.csv';
const R2 = 'SYN_SRC_9/SYN_T9/SYN_K2.R.csv';

let base: RawDataset | null = null;
const tricky = (): RawDataset => { base ??= loadRaw(TRICKY); return cloneRawDataset(base); };

function input(raw: RawDataset, patchNotation?: (n: Record<string, unknown>) => void): NormalizeInput {
  if (patchNotation) {
    const n = JSON.parse(raw.notationTexts.get('notation/SYN_E9.json')!) as Record<string, unknown>;
    patchNotation(n);
    raw.notationTexts.set('notation/SYN_E9.json', JSON.stringify(n));
  }
  const ds = parseDataset(raw);
  const inp = inputFromDataset(ds, 'SYN_E9', 'SYN_T9');
  if ('error' in inp) throw new Error(inp.error);
  return inp;
}
const normalize = (raw: RawDataset, patch?: (n: Record<string, unknown>) => void): NormalizeResult => normalizeTable(input(raw, patch));
const edit = (raw: RawDataset, path: string, from: string, to: string) => {
  const t = raw.rawTexts.get(path)!;
  if (!t.includes(from)) throw new Error(`fixture text not found: ${from}`);
  raw.rawTexts.set(path, t.replace(from, to));
};
const errors = (r: NormalizeResult) => r.issues.filter((i) => i.level === 'error').map((i) => `${i.where}: ${i.message}`);
const csv = (r: NormalizeResult, t: 'services' | 'stops' | 'footnotes') => {
  const s = specOf(t);
  return writeCsvTable(headerOf(s), (r[t] as unknown as Array<Record<string, unknown>>).map((x) => formatRow(s, x)));
};

describe('normaliser: the tricky synthetic table end to end', () => {
  const res = normalize(tricky());
  it('reports no problems', () => {
    expect(res.issues).toEqual([]);
  });
  for (const t of ['services', 'stops', 'footnotes'] as const) {
    it(`writes the expected ${t}.csv rows`, () => {
      expect(csv(res, t)).toBe(readFileSync(join(TRICKY, 'expected', `${t}.csv`), 'utf8'));
    });
  }
  it('infers the midnight crossing and keeps zone-shifted local times in order', () => {
    const c1 = res.stops.filter((s) => s.service_id === 'SYN_E9.SYN_T9.c1');
    expect(c1.map((s) => [s.station_id, s.arr_local, s.arr_dayoff, s.dep_local, s.dep_dayoff])).toEqual([
      ['SYN_A', '', null, '21:30', 0], ['SYN_B', '23:50', 0, '00:05', 1], ['SYN_D', '04:10', 1, '04:10', 1], ['SYN_E', '14:20', 1, '', null],
    ]);
  });
});

describe('normaliser: the synthetic world', () => {
  it('reproduces the canonical rows of SYN_E1 table SYN_T1 byte for byte', () => {
    const ds = parseDataset(loadRaw(WORLD));
    const inp = inputFromDataset(ds, 'SYN_E1', 'SYN_T1');
    if ('error' in inp) throw new Error(inp.error);
    const res = normalizeTable(inp);
    expect(res.issues).toEqual([]);
    const out = mergeIntoCanonical(ds, 'SYN_E1', 'SYN_T1', res);
    for (const t of ['services', 'stops', 'footnotes'] as const) expect(out[t], t).toBe(readFileSync(join(WORLD, 'canonical', `${t}.csv`), 'utf8'));
  });
});

describe('normaliser: flags instead of guessing', () => {
  it('an ambiguous day offset (a leg longer than maxLegHours)', () => {
    const raw = tricky();
    edit(raw, R2, 'SYN_K2,cell,3,6,11 40,', 'SYN_K2,cell,3,6,a.m. 11 40,');
    expect(errors(normalize(raw))).toEqual([
      'SYN_E9 SYN_T9 c3r6: ambiguous day offset: 21.3 h after SYN_D 1 20 (row 5), more than maxLegHours 20 (a misread time, a missing a.m./p.m. marker, or a day the table does not show)',
    ]);
  });
  it('a 12-hour time with no a.m./p.m. marker above it', () => {
    const raw = tricky();
    edit(raw, R1, 'SYN_K1,cell,0,0,a.m. 8 0,', 'SYN_K1,cell,0,0,8 0,');
    expect(errors(normalize(raw))).toEqual(['c0r0: "8 0"', 'c0r1: "10 30"', 'c0r2: "10 45"'].map((x) => `SYN_E9 SYN_T9 ${x}: no a.m./p.m. marker above it in this column`));
  });
  it('an unknown station label and an unreadable time', () => {
    const raw = tricky();
    for (const p of [R1, R2]) edit(raw, p, 'label,0,1,Beeton,', 'label,0,1,Beetown,');
    edit(raw, R1, 'SYN_K1,cell,0,4,3 40,', 'SYN_K1,cell,0,4,3 4O,');
    const e = errors(normalize(raw));
    expect(e).toContain('SYN_E9 SYN_T9 l0r1: station "Beetown" is not in station_aliases.csv for family SYN_F9');
    expect(e).toContain('SYN_E9 SYN_T9 c0r4: cannot read "3 4O" as a time');
  });
  it('crops that disagree on a shared cell', () => {
    const raw = tricky();
    edit(raw, R2, 'SYN_K2,label,0,6,Eestadt,', 'SYN_K2,label,0,6,Eestad,');
    expect(errors(normalize(raw))).toEqual(['SYN_E9 SYN_T9 l0r6: crops SYN_K1 and SYN_K2 disagree on l0r6: "Eestadt" vs "Eestad"']);
  });
  it('footnote marks without a reviewed interpretation', () => {
    let raw = tricky();
    raw.tables.running_rules.rows[0]!.values.reviewed_by = '';
    expect(errors(normalize(raw))).toEqual(['SYN_E9 SYN_T9 c1: running_rules.csv row for mark a is not reviewed (reviewed_by is empty)']);
    raw = tricky();
    edit(raw, R1, 'SYN_K1,header,1,3,a,', 'SYN_K1,header,1,3,a b,');
    expect(errors(normalize(raw))).toEqual(['SYN_E9 SYN_T9 c1: footnote mark b has no running_rules.csv row for SYN_E9 SYN_T9; a historian must interpret it']);
  });
  it('several running marks need a combined interpretation', () => {
    const raw = tricky();
    edit(raw, R1, 'SYN_K1,header,1,3,a,', 'SYN_K1,header,1,3,a c,');
    raw.tables.running_rules.rows.push({ line: 4, values: { edition_id: 'SYN_E9', table_ref: 'SYN_T9', mark: 'c', rule_dsl: 'from:1914-06-01;daily', interpreted_by: 'k', reviewed_by: 'h' } });
    expect(errors(normalize(raw))).toEqual(['SYN_E9 SYN_T9 c1: marks a, c all affect running days; add a reviewed running_rules.csv row for mark a+c']);
    raw.tables.running_rules.rows.push({ line: 5, values: { edition_id: 'SYN_E9', table_ref: 'SYN_T9', mark: 'a+c', rule_dsl: 'dow:Mo,We,Fr;from:1914-06-01', interpreted_by: 'k', reviewed_by: 'h' } });
    const res = normalize(raw);
    expect(errors(res)).toEqual([]);
    expect(res.services.find((s) => s.service_id === 'SYN_E9.SYN_T9.c1')!.running_rule).toBe('dow:Mo,We,Fr;from:1914-06-01');
  });
  it('an illegible cell without a historian waiver', () => {
    const raw = tricky();
    raw.tables.waivers.rows = [];
    expect(errors(normalize(raw))).toEqual(['SYN_E9 SYN_T9 c3r2: cell c3r2 (SYN_K2) is illegible and has no waiver']);
  });
  it('a footnote mark on a single time cell, unless reviewed as having no running meaning', () => {
    let raw = tricky();
    edit(raw, R1, 'SYN_K1,cell,0,4,3 40,,', 'SYN_K1,cell,0,4,3 40,fn:a,');
    expect(errors(normalize(raw))).toEqual([
      'SYN_E9 SYN_T9 c0r4: footnote mark a on a time cell: a stop cannot carry its own running days; if the note does not change this stop, record a reviewed running_rules.csv row for a with rule_dsl "none", otherwise ask the historian how to transcribe it',
    ]);
    raw = tricky();
    edit(raw, R1, 'SYN_K1,cell,0,4,3 40,,', 'SYN_K1,cell,0,4,3 40,fn:‡,');
    expect(errors(normalize(raw))).toEqual([]);
  });
  it('a ditto in a time cell when the guide does not define one', () => {
    expect(errors(normalize(tricky(), (n) => { n.dittoInTimes = false; }))).toEqual(['SYN_E9 SYN_T9 c1r5: ditto in a time cell, which this guide\'s notation does not define']);
  });
  it('a table missing from the notation file', () => {
    expect(errors(normalize(tricky(), (n) => { n.tables = {}; }))).toEqual(['SYN_E9 SYN_T9: notation for SYN_E9 has no tables.SYN_T9 entry (operator, mode, segments)']);
  });
});

describe('normaliser: other clock conventions', () => {
  /** Rewrites every time cell of the tricky table through `f` (text, marks) and normalises. */
  function retime(patch: (n: Record<string, unknown>) => void, cells: Record<string, [string, string]>): NormalizeResult {
    const raw = tricky();
    for (const p of [R1, R2]) {
      const lines = raw.rawTexts.get(p)!.split('\n').map((ln) => {
        const m = /^(SYN_K\d),cell,(\d),(\d),([^,]*),([^,]*),(.*)$/.exec(ln);
        if (!m) return ln;
        const v = cells[`c${m[2]}r${m[3]}`];
        return v ? `${m[1]},cell,${m[2]},${m[3]},${v[0]},${v[1]},${m[6]}` : ln;
      });
      raw.rawTexts.set(p, lines.join('\n'));
    }
    return normalize(raw, patch);
  }
  const c0 = (r: NormalizeResult) => r.stops.filter((s) => s.service_id === 'SYN_E9.SYN_T9.c0').map((s) => `${s.arr_local}/${s.dep_local}`);

  it('reads a 24-hour guide', () => {
    const r = retime((n) => { n.clock = '24h'; n.meridian = null; }, {
      c0r0: ['8.00', ''], c0r1: ['10.30', ''], c0r2: ['10.45', ''], c0r3: ['13.15', ''], c0r4: ['15.40', ''], c0r5: ['16.00', ''],
      c1r0: ['21.30', ''], c1r1: ['23.50', ''], c1r2: ['0.05', ''], c1r4: ['4.10', ''], c1r6: ['14.20', ''],
      c2r1: ['14.00', ''], c2r2: ['14.10', ''], c2r3: ['‡ 16.55', ''], c2r4: ['18.30', ''], c2r5: ['18.40', ''],
      c3r0: ['6.00', ''], c3r1: ['8.15', ''], c3r4: ['13.05', ''], c3r5: ['13.20', ''], c3r6: ['23.40', ''],
    });
    expect(errors(r)).toEqual([]);
    expect(c0(r)).toEqual(['/08:00', '10:30/10:45', '/13:15', '15:40/16:00']);
    expect(csv(r, 'stops').split('\n').filter((l) => /SYN_T9\.c[123]/.test(l)).map((l) => l.split(',').slice(3, 7).join(',')))
      .toEqual(csv(normalize(tricky()), 'stops').split('\n').filter((l) => /SYN_T9\.c[123]/.test(l)).map((l) => l.split(',').slice(3, 7).join(',')));
  });
  it('reads heavy type as p.m. ("pm-type")', () => {
    const r = retime((n) => { n.meridian = { mode: 'pm-type', marks: ['b'], amMarkers: [], pmMarkers: [], initial: null }; }, {
      c0r0: ['8 0', ''], c0r3: ['1 15', 'b'], c0r4: ['3 40', 'b'], c0r5: ['4 0', 'b'],
      c1r0: ['9 30', 'b'], c1r1: ['11 50', 'b'], c1r2: ['12 5', ''], c1r6: ['2 20', 'b'],
      c2r1: ['2 0', 'b'], c2r2: ['2 10', 'b'], c2r3: ['‡ 4 55', 'b'], c2r4: ['6 30', 'b'], c2r5: ['6 40', 'b'],
      c3r0: ['6 0', ''], c3r4: ['1 5', 'b'], c3r5: ['1 20', 'b'], c3r6: ['11 40', 'b'],
    });
    expect(errors(r)).toEqual([]);
    expect(c0(r)).toEqual(['/08:00', '10:30/10:45', '/13:15', '15:40/16:00']);
  });
  it('reads underlined night times ("night-type": 6.00 p.m.–5.59 a.m.)', () => {
    const r = retime((n) => { n.meridian = { mode: 'night-type', marks: ['u'], amMarkers: [], pmMarkers: [], initial: null }; }, {
      c0r0: ['8 0', ''], c0r3: ['1 15', ''], c1r0: ['9 30', 'u'], c1r1: ['11 50', 'u'], c1r2: ['12 5', 'u'], c1r4: ['4 10', 'u'], c1r6: ['2 20', ''],
      c2r1: ['2 0', ''], c3r0: ['6 0', ''], c3r4: ['1 5', ''], c3r6: ['11 40', 'u'],
    });
    expect(errors(r)).toEqual([]);
    expect(r.stops.filter((s) => s.service_id === 'SYN_E9.SYN_T9.c1').map((s) => `${s.arr_local}/${s.dep_local}`))
      .toEqual(['/21:30', '23:50/00:05', '04:10/04:10', '14:20/']);
  });
});

describe('normalize.ts command line', () => {
  it('writes the canonical files, refuses on errors, and --check writes nothing', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'syn-normalize-')), 'data');
    cpSync(TRICKY, dir, { recursive: true });
    for (const t of ['services', 'stops', 'footnotes']) writeFileSync(join(dir, 'canonical', `${t}.csv`), `${headerOf(specOf(t as 'stops')).join(',')}\n`);
    const cli = (...a: string[]) => spawnSync(process.execPath, ['tools/normalize/normalize.ts', '--edition', 'SYN_E9', '--table', 'SYN_T9', '--data', dir, ...a], { cwd: ROOT, encoding: 'utf8' });
    const check = cli('--check');
    expect(check.status, check.stderr).toBe(0);
    expect(readFileSync(join(dir, 'canonical', 'stops.csv'), 'utf8').split('\n').length).toBe(2);
    expect(cli().status).toBe(0);
    for (const t of ['services', 'stops', 'footnotes']) {
      expect(readFileSync(join(dir, 'canonical', `${t}.csv`), 'utf8')).toBe(readFileSync(join(TRICKY, 'expected', `${t}.csv`), 'utf8'));
    }
    expect(cli().status).toBe(0); // idempotent: replaces its own rows
    expect(readFileSync(join(dir, 'canonical', 'stops.csv'), 'utf8')).toBe(readFileSync(join(TRICKY, 'expected', 'stops.csv'), 'utf8'));
    writeFileSync(join(dir, 'canonical', 'waivers.csv'), 'waiver_id,src,note,historian,reviewed_on\n');
    const before = readFileSync(join(dir, 'canonical', 'stops.csv'), 'utf8');
    const bad = cli();
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/is illegible and has no waiver/);
    expect(readFileSync(join(dir, 'canonical', 'stops.csv'), 'utf8')).toBe(before);
  });
});
