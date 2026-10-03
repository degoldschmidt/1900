/**
 * V01–V04 against the synthetic world, plus seeded errors. File overlays in fixtures/seeded/
 * replace one table: malformed-stops.csv (unterminated quote), dv-in-stops.csv (a design value
 * as a stop citation), backwards-stops.csv (Berlin printed on the wrong day).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rawFromText } from '../../schema/raw-table.ts';
import type { RawDataset } from '../../schema/dataset.ts';
import type { TableName } from '../../schema/canonical.ts';
import { compareStops } from '../v04-same-train.ts';
import { addRow, errs, find, removeRows, run, warns, world } from './world.ts';

const SEEDED = fileURLToPath(new URL('./fixtures/seeded/', import.meta.url));
function overlay(raw: RawDataset, table: TableName, file: string): RawDataset {
  raw.tables[table] = rawFromText(`${table}.csv`, readFileSync(SEEDED + file, 'utf8'));
  return raw;
}

describe('V01 schema and keys', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V01')).toEqual([]);
  });
  it('flags malformed CSV (seeded file)', () => {
    expect(errs(run(overlay(world(), 'stops', 'malformed-stops.csv'), 'V01')).join('\n')).toMatch(/malformed CSV: line 2: unterminated quoted field/);
  });
  it('flags a missing file and a wrong header', () => {
    const raw = world();
    raw.tables.fares = { file: 'fares.csv', missing: true, header: [], rows: [], problems: [] };
    raw.tables.transfers.header = raw.tables.transfers.header.slice(1);
    const e = errs(run(raw, 'V01')).join('\n');
    expect(e).toMatch(/fares.csv: file is missing/);
    expect(e).toMatch(/transfers.csv:1: header must be exactly/);
  });
  it('flags bad types and enums', () => {
    const raw = world();
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T1.c0').mode = 'tram';
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c1' && r.seq === '2').arr_local = '3:05';
    find(raw, 'calendar', (r) => r.event_id === 'SYN_EV1').date_jul = '1914-07-19';
    const e = errs(run(raw, 'V01')).join('\n');
    expect(e).toMatch(/mode "tram" is not one of rail\|steamer\|ferry/);
    expect(e).toMatch(/arr_local "3:05" is not a 24-hour time/);
    expect(e).toMatch(/date_jul "1914-07-19" must be a Julian date/);
  });
  it('flags duplicate keys and missing foreign keys (including list items)', () => {
    const raw = world();
    addRow(raw, 'min_change', { station_id: 'SYN_DOV', min_minutes: '25', basis: 'design', src_or_dv: 'DV-001' });
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '2').station_id = 'SYN_NOWHERE';
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T1.c1').segment_ids = 'SYN_S_DO;SYN_S_XX';
    const e = errs(run(raw, 'V01')).join('\n');
    expect(e).toMatch(/min_change.csv:5: duplicate key \(station_id\) = \(SYN_DOV\), first at line 2/);
    expect(e).toMatch(/station_id "SYN_NOWHERE" not found in stations.csv/);
    expect(e).toMatch(/segment_ids "SYN_S_XX" not found in segments.csv/);
  });
  it('flags row-level inconsistencies', () => {
    const raw = world();
    find(raw, 'stations', (r) => r.station_id === 'SYN_WIR').frontier_pair_id = 'SYN_BER';
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '2').arr_dayoff = '';
    removeRows(raw, 'stops', (r) => r.service_id === 'SYN_E3.SYN_K7.c0' && r.seq === '2');
    const ev = find(raw, 'calendar', (r) => r.event_id === 'SYN_EV2'); ev.date_greg = ''; ev.date_jul = '';
    find(raw, 'through_links', () => true).station_id = 'SYN_BER';
    find(raw, 'editions', (r) => r.edition_id === 'SYN_E3').valid_to = '1914-04-01';
    const e = errs(run(raw, 'V01')).join('\n');
    expect(e).toMatch(/frontier pair SYN_EYD→SYN_WIR is not reciprocal/);
    expect(e).toMatch(/arr_local without arr_dayoff/);
    expect(e).toMatch(/SYN_E3.SYN_K7.c0 has fewer than two stops/);
    expect(e).toMatch(/an event needs date_greg or date_jul/);
    expect(e).toMatch(/SYN_E1.SYN_T3.c1 does not stop at SYN_BER/);
    expect(e).toMatch(/editions.csv:4: valid_from..valid_to: start is after end/);
  });
});

describe('V02 citations and design values', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V02').filter((i) => i.level !== 'info')).toEqual([]);
  });
  it('bans design values in stops (seeded file) and in the other timetable tables', () => {
    expect(errs(run(overlay(world(), 'stops', 'dv-in-stops.csv'), 'V02')).join('\n')).toMatch(/stops.csv:3: design values are banned in stops.csv \(DV-001\)/);
    const raw = world();
    find(raw, 'fares', (r) => r.class === 'boat').src = 'DV-002';
    find(raw, 'zones', (r) => r.zone_id === 'SYN_Z_SPB').src = 'DV-002';
    find(raw, 'stations', (r) => r.station_id === 'SYN_SPB').src = 'DV-002';
    const e = errs(run(raw, 'V02')).join('\n');
    expect(e).toMatch(/design values are banned in fares.csv/);
    expect(e).toMatch(/design values are banned in zones.csv/);
    expect(e).toMatch(/stations.csv:8: src must be a citation; design values go in src_or_dv or dv_id/);
  });
  it('flags missing, malformed and dangling citations', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '1').src = '';
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '2').src = 'SYN_SRC_S p10';
    find(raw, 'footnotes', (r) => r.mark === 'a').src = 'SYN_SRC_S:p99:SYN_T2:-:-';
    find(raw, 'footnotes', (r) => r.mark === 'b').src = 'SYN_NOSUCH:p1:-:-:-';
    find(raw, 'footnotes', (r) => r.mark === 'x').src = 'SYN_SRC_W:p20:SYN_T9:-:-';
    const issues = run(raw, 'V02');
    const e = errs(issues).join('\n');
    expect(e).toMatch(/stops.csv:2: no src citation/);
    expect(e).toMatch(/src "SYN_SRC_S p10" is not a citation/);
    expect(e).toMatch(/names page SYN_SRC_S p99, not in pages.csv/);
    expect(e).toMatch(/names source SYN_NOSUCH, not in sources.csv/);
    expect(warns(issues).join('\n')).toMatch(/names table SYN_T9, but pages.csv lists SYN_T1/);
  });
  it('checks src_or_dv against basis and design values against the register', () => {
    const raw = world();
    find(raw, 'min_change', (r) => r.station_id === 'SYN_DOV').src_or_dv = 'SYN_SRC_S:p10:SYN_T1:-:-';
    find(raw, 'min_change', (r) => r.station_id === 'SYN_WIR').src_or_dv = 'DV-003';
    find(raw, 'min_change', (r) => r.station_id === 'SYN_BER').src_or_dv = 'DV-077';
    const e = errs(run(raw, 'V02')).join('\n');
    expect(e).toMatch(/basis is design but src_or_dv is not a design-value id/);
    expect(e).toMatch(/basis is historical but src_or_dv is a design value \(DV-003\)/);
    expect(e).toMatch(/src_or_dv DV-077 is not defined in DESIGN_VALUES.md/);
  });
  it('requires dv_id for design-basis params and src for historical ones', () => {
    const raw = world();
    find(raw, 'params', (r) => r.row_id === 'SYN_P004').dv_id = '';
    find(raw, 'params', (r) => r.row_id === 'SYN_P001').src = '';
    const e = errs(run(raw, 'V02')).join('\n');
    expect(e).toMatch(/SYN_P004: a design value basis needs a dv_id/);
    expect(e).toMatch(/SYN_P001: a historical date basis needs a src citation/);
  });
  it('requires running-rule interpretations to name recorded footnote marks', () => {
    const raw = world();
    find(raw, 'running_rules', (r) => r.mark === 'a').mark = 'a+z';
    expect(errs(run(raw, 'V02')).join('\n')).toMatch(/mark "z" of SYN_E1 table SYN_T2 is not in footnotes.csv/);
  });
  it('reports unused design values as info and broken register entries as errors', () => {
    const raw = world();
    raw.designText = `${raw.designText!}\n## DV-004 — unused\n- value: 1\n- unit: u\n- rationale: r\n\n## DV-005 — incomplete\n- value: 2\n`;
    const issues = run(raw, 'V02');
    expect(issues.filter((i) => i.level === 'info').map((i) => i.message)).toContain('DV-004 is not used by any row');
    expect(errs(issues).join('\n')).toMatch(/DV-005 has no unit/);
  });
});

describe('V03 times and speeds', () => {
  it('passes the synthetic world with no warnings', () => {
    expect(run(world(), 'V03').filter((i) => i.level !== 'info')).toEqual([]);
  });
  it('flags time running backwards (seeded file)', () => {
    expect(errs(run(overlay(world(), 'stops', 'backwards-stops.csv'), 'V03')).join('\n'))
      .toMatch(/service SYN_E1.SYN_T2.c0: time goes backwards SYN_OST→SYN_BER/);
  });
  it('flags negative dwell, impossible speed and a first departure off day 0', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T2.c1' && r.station_id === 'SYN_BER').dep_local = '04:40';
    const ost = find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T2U.c0' && r.station_id === 'SYN_OST');
    ost.arr_local = '22:30'; ost.arr_dayoff = '0';
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T3.c0' && r.seq === '1').dep_dayoff = '1';
    const e = errs(run(raw, 'V03')).join('\n');
    expect(e).toMatch(/negative dwell at SYN_BER/);
    expect(e).toMatch(/impossible speed .* SYN_BER→SYN_OST/);
    expect(e).toMatch(/first departure \(SYN_WIR\) must be on day offset 0, not 1/);
  });
  it('warns about speeds outside the mode bounds, long dwells and unchecked services', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.station_id === 'SYN_DOV').arr_local = '23:00';
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c1' && r.station_id === 'SYN_OST').arr_local = '13:30';
    removeRows(raw, 'station_zones', (r) => r.station_id === 'SYN_SPB');
    const w = warns(run(raw, 'V03')).join('\n');
    expect(w).toMatch(/speed 7\.\d km\/h SYN_LON→SYN_DOV .* outside rail bounds 8–110/);
    expect(w).toMatch(/speed 50\.\d km\/h SYN_DOV→SYN_OST .* outside steamer bounds 5–40/);
    expect(w).toMatch(/SYN_E1.SYN_T3.c0: not checked: station SYN_SPB has no railway zone on 1914-05-02/);
  });
});

describe('V04 the same train across tables', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V04')).toEqual([]);
  });
  it('flags a disagreement between two tables of one edition as an error', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T3.c1' && r.station_id === 'SYN_WIR').arr_local = '14:50';
    expect(errs(run(raw, 'V04'))).toEqual([
      'train SYN-NORD: SYN_E1.SYN_T2.c1 (SYN_E1 SYN_T2) and SYN_E1.SYN_T3.c1 (SYN_E1 SYN_T3) disagree at SYN_WIR arr: 14:55 vs 14:50',
    ]);
  });
  it('reports a difference against another source family as a warning only', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E3.SYN_K7.c0' && r.station_id === 'SYN_EYD').arr_local = '17:58';
    const issues = run(raw, 'V04');
    expect(errs(issues)).toEqual([]);
    expect(warns(issues)).toEqual(['train SYN-KPEV-D1: SYN_E1.SYN_T2.c0 (SYN_E1 SYN_T2) and SYN_E3.SYN_K7.c0 (SYN_E3 SYN_K7) disagree at SYN_EYD arr: 17:55 vs 17:58']);
  });
  it('compares day-offset differences between shared stations', () => {
    const stop = (station_id: string, dep: string, off: number) => ({
      service_id: 'X', seq: 1, station_id, arr_local: '', dep_local: dep, arr_dayoff: null, dep_dayoff: off,
      raw_arr: '', raw_dep: '', flags: [], status: 'agree' as const, src: '', line: 2,
    });
    const r = compareStops([stop('A', '23:00', 0), stop('B', '01:00', 1)], [stop('A', '23:00', 0), stop('B', '01:00', 0)]);
    expect(r.diffs).toEqual([]);
    expect(r.dayDiffs).toEqual(['A→B: 1 day(s) against 0']);
  });
});
