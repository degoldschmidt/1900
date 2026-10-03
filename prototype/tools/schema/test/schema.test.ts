import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { dayFromIso } from '#kit/time/calendar.ts';
import { TABLE_SPECS, formatRow, headerOf, parseRows, parseValue, specOf, type ColSpec } from '../canonical.ts';
import { citationCovers, formatCitation, isDvId, parseCellRef, parseCitation } from '../citation.ts';
import { parseDesignValues } from '../design-values.ts';
import { parseNotation } from '../notation.ts';
import { rawFromText } from '../raw-table.ts';
import { loadDataset } from '../dataset.ts';
import { absStops, stopsByService, truthRanges, zoneLookup } from '../derive.ts';

export const WORLD = fileURLToPath(new URL('./fixtures/syn-world', import.meta.url));
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

describe('canonical value parsing', () => {
  const col = (c: Partial<ColSpec> & Pick<ColSpec, 'type'>): ColSpec => ({ name: 'x', ...c });
  it('parses each column type', () => {
    expect(parseValue(col({ type: 'int' }), ' 42 ')).toEqual({ ok: true, value: 42 });
    expect(parseValue(col({ type: 'num' }), '-0.1441')).toEqual({ ok: true, value: -0.1441 });
    expect(parseValue(col({ type: 'date' }), '1914-08-01')).toEqual({ ok: true, value: dayFromIso('1914-08-01') });
    expect(parseValue(col({ type: 'date' }), 'J1914-07-19')).toEqual({ ok: true, value: dayFromIso('1914-08-01') });
    expect(parseValue(col({ type: 'yn' }), 'y')).toEqual({ ok: true, value: true });
    expect(parseValue(col({ type: 'list' }), 'a; b;;c')).toEqual({ ok: true, value: ['a', 'b', 'c'] });
    expect(parseValue(col({ type: 'enumlist', values: ['1', '2'] }), '1;2')).toEqual({ ok: true, value: ['1', '2'] });
    expect(parseValue(col({ type: 'time' }), '23:59')).toEqual({ ok: true, value: '23:59' });
    expect(parseValue(col({ type: 'json' }), '{"a":[1]}')).toEqual({ ok: true, value: { a: [1] } });
    expect(parseValue(col({ type: 'int' }), '')).toEqual({ ok: true, value: null });
  });
  it('rejects bad values with a message', () => {
    const bad: Array<[ColSpec, string]> = [
      [col({ type: 'int' }), '1.5'], [col({ type: 'int', min: 1 }), '0'], [col({ type: 'date' }), '1914-02-30'],
      [col({ type: 'date', cal: 'greg' }), 'J1914-07-19'], [col({ type: 'date', cal: 'jul' }), '1914-07-19'],
      [col({ type: 'yn' }), 'yes'], [col({ type: 'enum', values: ['a'] }), 'b'], [col({ type: 'enumlist', values: ['1'] }), '1;1'],
      [col({ type: 'time' }), '24:00'], [col({ type: 'time' }), '9:00'], [col({ type: 'json' }), '{'], [col({ type: 'text', req: true }), ' '],
    ];
    for (const [c, v] of bad) expect(parseValue(c, v).ok, `${c.type} ${v}`).toBe(false);
  });
  it('leaves required citations to V02', () => {
    expect(parseValue(col({ type: 'cite', req: true }), '')).toEqual({ ok: true, value: '' });
  });
  it('formats typed rows back to CSV text', () => {
    const spec = specOf('stops');
    const raw = { service_id: 'S', seq: '2', station_id: 'X', arr_local: '10:45', dep_local: '', arr_dayoff: '0', dep_dayoff: '', raw_arr: '10 45', raw_dep: '', flags: 'customs;passport', status: 'agree', src: 'A:p1:-:-:-' };
    const parsed = parseRows(spec, rawFromText('stops.csv', `${headerOf(spec).join(',')}\n${headerOf(spec).map((h) => (raw as Record<string, string>)[h]).join(',')}\n`));
    expect(parsed.issues).toEqual([]);
    expect(formatRow(spec, parsed.rows[0]!)).toEqual(raw);
  });
  it('rejects a wrong header and skips rows with bad values', () => {
    const spec = specOf('min_change');
    const bad = parseRows(spec, rawFromText('min_change.csv', 'station_id,minutes\nA,1\n'));
    expect(bad.issues[0]!.message).toMatch(/header must be exactly/);
    const rows = parseRows(spec, rawFromText('min_change.csv', 'station_id,min_minutes,basis,src_or_dv\nA,x,design,DV-001\nB,5,design,DV-001\n'));
    expect(rows.rows.map((r) => r.station_id)).toEqual(['B']);
    expect(rows.issues).toHaveLength(1);
  });
  it('has a header file for every table in data/canonical', () => {
    for (const s of TABLE_SPECS) {
      const first = readFileSync(join(ROOT, 'data', 'canonical', s.file), 'utf8').split('\n')[0];
      expect(first, s.file).toBe(headerOf(s).join(','));
    }
  });
});

describe('citations', () => {
  it('parses and formats citation strings', () => {
    const c = parseCitation('BCG1914-06:p412:T254:T254-a:c3r12');
    expect(c).toEqual({ source: 'BCG1914-06', pageSeq: 412, tableRef: 'T254', crop: 'T254-a', cell: 'c3r12' });
    expect(formatCitation(c!)).toBe('BCG1914-06:p412:T254:T254-a:c3r12');
    expect(parseCitation('SRC:p3:-:-:-')).toEqual({ source: 'SRC', pageSeq: 3, tableRef: null, crop: null, cell: null });
    for (const bad of ['SRC:3:-:-:-', 'SRC:p0:-:-:-', 'SRC:p3:-:-', 'DV-001', 'S RC:p3:-:-:-', 'SRC:p3:a:b:c:d']) expect(parseCitation(bad), bad).toBeNull();
  });
  it('recognises design-value ids', () => {
    expect(isDvId('DV-001')).toBe(true);
    expect(isDvId('DV-1')).toBe(false);
    expect(isDvId('dv-001')).toBe(false);
  });
  it('parses cell references and range coverage', () => {
    expect(parseCellRef('c3r12-13')).toEqual({ kind: 'cell', col: 3, row: 12, row2: 13 });
    expect(parseCellRef('h0c3')).toEqual({ kind: 'header', col: 3, row: 0, row2: 0 });
    expect(parseCellRef('c3r13-12')).toBeNull();
    expect(citationCovers('S:p1:T:K1:c3r12-13', 'S:p1:T:K1:c3r13')).toBe(true);
    expect(citationCovers('S:p1:T:K1:c3r12-13', 'S:p1:T:K2:c3r12')).toBe(true);
    expect(citationCovers('S:p1:T:K1:c3r12-13', 'S:p1:T:K1:c4r12')).toBe(false);
    expect(citationCovers('S:p1:T:K1:c3r12-13', 'S:p2:T:K1:c3r12')).toBe(false);
  });
});

describe('design-value register', () => {
  it('parses DV sections, JSON values and continuation lines, ignoring code fences', () => {
    const md = [
      '# Register', '', '```', '## DV-999 — example in a fence', '- value: 1', '```', '',
      '## DV-001 — Pier change', '- value: 20', '- unit: minutes', '- rationale: chosen', '  for the test.', '- used-by: transfers.csv', '',
      '## DV-002 – Hours', '- value: {"open": "09:00"}', '- unit: hh:mm', '- rationale: r',
    ].join('\n');
    const r = parseDesignValues(md);
    expect(r.issues).toEqual([]);
    expect(r.values.map((v) => [v.id, v.name, v.value, v.unit, v.rationale])).toEqual([
      ['DV-001', 'Pier change', 20, 'minutes', 'chosen for the test.'],
      ['DV-002', 'Hours', { open: '09:00' }, 'hh:mm', 'r'],
    ]);
  });
  it('reports missing fields, duplicates and malformed headings', () => {
    const r = parseDesignValues('## DV-001 — A\n- value: 1\n\n## DV-001 — B\n- value: 2\n- unit: u\n- rationale: r\n\n## DV-7 bad\n');
    const msgs = r.issues.map((i) => i.message).join('\n');
    expect(msgs).toMatch(/DV-001 has no unit/);
    expect(msgs).toMatch(/defined twice/);
    expect(msgs).toMatch(/malformed design-value heading/);
  });
  it('the repository register parses', () => {
    const r = parseDesignValues(readFileSync(join(ROOT, 'data', 'design', 'DESIGN_VALUES.md'), 'utf8'));
    expect(r.issues.filter((i) => i.level === 'error')).toEqual([]);
  });
});

describe('notation files', () => {
  it('accepts the fixture notation and rejects bad ones', () => {
    const text = readFileSync(join(WORLD, 'canonical', 'notation', 'SYN_E1.json'), 'utf8');
    expect(parseNotation(text, 'n.json').issues).toEqual([]);
    const j = JSON.parse(text) as Record<string, unknown>;
    const bad = (patch: Record<string, unknown>) => parseNotation(JSON.stringify({ ...j, ...patch }), 'n.json').issues.map((i) => i.message).join('\n');
    expect(bad({ clock: '25h' })).toMatch(/clock/);
    expect(bad({ meridian: null })).toMatch(/needs a meridian/);
    expect(bad({ singleTime: 'arr' })).toMatch(/singleTime/);
    expect(bad({ unmarkedRunning: 'weekly' })).toMatch(/unmarkedRunning/);
    expect(bad({ symbolFlags: { '§': 'smoking' } })).toMatch(/not a stop flag/);
    expect(bad({ headerLines: ['train_no', 'colour'] })).toMatch(/headerLines/);
    expect(bad({ tables: { T: { operator: 'X', mode: 'tram', segments: [] } } })).toMatch(/mode/);
    expect(parseNotation('{', 'n.json').notation).toBeNull();
  });
});

describe('dataset loading and derived views', () => {
  const ds = loadDataset(WORLD);
  it('loads the synthetic world without problems', () => {
    expect(ds.issues).toEqual([]);
    expect(ds.t.services).toHaveLength(15);
    expect(ds.t.stops).toHaveLength(36);
    expect(ds.notations.get('SYN_E1')?.clock).toBe('12h');
    expect(ds.designValues.map((v) => v.id)).toEqual(['DV-001', 'DV-002', 'DV-003']);
    expect(ds.crops.get('SYN_SRC_S/SYN_T1')?.[0]?.page_seq).toBe(10);
    expect(ds.resolved.get('SYN_SRC_S/SYN_T1/SYN_CR1')).toHaveLength(20);
    expect(ds.options.originCity).toBe('SYN_C_LON');
  });
  it('makes stop times absolute with odd-second zone offsets', () => {
    const zl = zoneLookup(ds);
    const day = dayFromIso('1914-06-01');
    const stops = stopsByService(ds).get('SYN_E1.SYN_T2.c0')!;
    const abs = absStops(stops, zl, day);
    expect(abs.errors).toEqual([]);
    // Ostend 16:00 GMT; Wirballen 19:35 Petersburg time (+7278 s) next day.
    expect(abs.stops[0]!.dep).toBe(16 * 3600);
    expect(abs.stops[3]!.arr).toBe(86400 + 19 * 3600 + 35 * 60 - 7278);
  });
  it('computes truth ranges as the intersection over the segments of a trip', () => {
    const svc = ds.t.services.find((s) => s.service_id === 'SYN_E1.SYN_T2.c0')!;
    expect(truthRanges(ds, svc, 366)).toEqual([[dayFromIso('1914-05-01'), dayFromIso('1914-09-30')]]);
    const cross = ds.t.services.find((s) => s.service_id === 'SYN_E3.SYN_K7.c0')!;
    expect(truthRanges(ds, cross, 366)).toEqual([]);
  });
});
