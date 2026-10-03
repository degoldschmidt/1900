import { describe, it, expect } from 'vitest';
import { dayFromIso } from '#kit/time/calendar.ts';
import { parseDataset } from '../../schema/dataset.ts';
import { stopsByService, zoneLookup } from '../../schema/derive.ts';
import { buildNet, earliestArrival } from '../net.ts';
import { v06 } from '../v06-diff.ts';
import { addRow, errs, find, parse, removeRows, run, warns, world } from './world.ts';

describe('net.ts earliest-arrival search', () => {
  const ds = parse(world());
  const zl = zoneLookup(ds);
  const sbs = stopsByService(ds);
  const day = dayFromIso('1914-06-01'); // a Monday
  const svc = (id: string) => ds.t.services.find((s) => s.service_id === id)!;
  const pick = (ids: string[], days: number[]) => ids.flatMap((id) => days.map((d) => ({ svc: svc(id), day: d })));

  it('chains trains with minimum change and finds the earliest arrival', () => {
    const net = buildNet(ds, zl, sbs, pick(['SYN_E1.SYN_T1.c0', 'SYN_E1.SYN_T1.c1', 'SYN_E1.SYN_T2.c0'], [day, day + 1]));
    const arr = earliestArrival(net, ['SYN_LON'], day * 86400, { until: (day + 3) * 86400 });
    expect(arr.get('SYN_OST')).toBe(day * 86400 + 15 * 3600 + 5 * 60);
    expect(arr.get('SYN_WIR')).toBe((day + 1) * 86400 + 19 * 3600 + 35 * 60 - 7278);
  });
  it('respects minimum change times (a 20-minute change at Dover misses a 15-minute connection)', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.station_id === 'SYN_DOV').arr_local = '11:00';
    const d2 = parseDataset(raw);
    const net = buildNet(d2, zoneLookup(d2), stopsByService(d2), [
      { svc: d2.t.services.find((s) => s.service_id === 'SYN_E1.SYN_T1.c0')!, day },
      { svc: d2.t.services.find((s) => s.service_id === 'SYN_E1.SYN_T1.c1')!, day },
    ]);
    expect(earliestArrival(net, ['SYN_LON'], day * 86400, { until: (day + 1) * 86400 }).has('SYN_OST')).toBe(false);
  });
  it('lets a through carriage continue without a change and walks transfers', () => {
    const net = buildNet(ds, zl, sbs, pick(['SYN_E1.SYN_T2.c1', 'SYN_E1.SYN_T3.c1'], [day, day + 1]));
    const arr = earliestArrival(net, ['SYN_OST'], day * 86400, { until: (day + 3) * 86400 });
    expect(arr.get('SYN_SPB')).toBe((day + 2) * 86400 + 6 * 3600 + 10 * 60 - 7278);
    // From Eydtkuhnen by train the next stop is Wirballen; the frontier-change transfer also reaches it.
    expect(arr.get('SYN_EYD')).toBeDefined();
  });
  it('limits boarding at the origin to departures before originDepBefore', () => {
    const net = buildNet(ds, zl, sbs, pick(['SYN_E1.SYN_T1.c0'], [day, day + 1]));
    const t0 = day * 86400 + 10 * 3600;
    expect(earliestArrival(net, ['SYN_LON'], t0, { until: t0 + 2 * 86400, originDepBefore: (day + 1) * 86400 }).has('SYN_DOV')).toBe(false);
    expect(earliestArrival(net, ['SYN_LON'], t0, { until: t0 + 2 * 86400 }).get('SYN_DOV')).toBe((day + 1) * 86400 + 10 * 3600 + 45 * 60);
  });
});

describe('V05 network', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V05').filter((i) => i.level !== 'info')).toEqual([]);
  });
  it('flags a through link that has no onward train', () => {
    const raw = world();
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T3.c1').running_rule = 'dow:We';
    expect(errs(run(raw, 'V05')).join('\n')).toMatch(/SYN_E1.SYN_T2.c1 → SYN_E1.SYN_T3.c1 at SYN_WIR has no onward train within 12 h on 43 day\(s\): 1914-05-04, /);
  });
  it('flags a frontier pair not connected in one direction on some days', () => {
    const raw = world();
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T2U.c0').running_rule = 'except-dow:Su';
    const e = errs(run(raw, 'V05'));
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/edition SYN_E1: frontier SYN_WIR → SYN_EYD not connected on 22 of 153 day\(s\): 1914-05-03, 1914-05-10/);
  });
  it('flags a city never reached from the origin within 72 h (error) or missed on some days (warning)', () => {
    let raw = world();
    removeRows(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T3.c0' || r.service_id === 'SYN_E1.SYN_T3.c1');
    // E1 and E3 share their first valid days, so both report the gap.
    expect(errs(run(raw, 'V05'))).toEqual(['SYN_E1', 'SYN_E3'].map((e) => `edition ${e}: SYN_C_SPB not reached from SYN_C_LON within 72 h when leaving on 1914-05-01, 1914-05-02, 1914-05-03, 1914-05-04, 1914-05-05 and 2 more`));
    raw = world();
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T3.c0').running_rule = 'dow:Mo,Tu,We';
    const issues = run(raw, 'V05');
    expect(errs(issues)).toEqual([]);
    expect(warns(issues).join('\n')).toMatch(/SYN_C_SPB not reached from SYN_C_LON within 72 h when leaving on/);
  });
  it('warns when the origin city is unknown', () => {
    const raw = world();
    raw.validationText = '{"originCity": "SYN_C_NOWHERE"}';
    expect(warns(run(raw, 'V05'))).toEqual(['validation.json: origin city SYN_C_NOWHERE not found in cities.csv; reach not checked']);
  });
});

describe('V06 cross-edition diff', () => {
  it('lists added, withdrawn, retimed and re-dayed trains', () => {
    const r = v06(parse(world()));
    expect(r.issues.map((i) => i.message)).toEqual(['6 added, 1 withdrawn, 2 retimed, 1 running days changed (diff-SYN_E2-SYN_E1.md)']);
    expect(r.reports).toHaveLength(1);
    const text = r.reports[0]!.text;
    expect(text).toContain('## Withdrawn (1)\n\n- SYN-SECR-14 (SYN_T1U)');
    expect(text).toContain('- SYN-SECR-11: SYN_DOV arr 10:50→10:45');
    expect(text).toContain('- SYN-BSM-21: `except-dow:Su` → `daily`');
    expect(text).toContain('- SYN-NORD (SYN_T2, SYN_T3)');
  });
  it('is only informational', () => {
    expect(run(world(), 'V06').every((i) => i.level === 'info')).toBe(true);
  });
});

describe('V07 rules, validity and dates', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V07')).toEqual([]);
  });
  it('flags unparseable rules and rules with no day in the edition', () => {
    const raw = world();
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T1.c0').running_rule = 'weekdays';
    find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T1.c1').running_rule = 'dates:1915-01-01..1915-01-31';
    find(raw, 'running_rules', (r) => r.mark === 'b').rule_dsl = 'dow:Tu,Xx';
    find(raw, 'running_rules', (r) => r.mark === 'x').reviewed_by = '';
    const issues = run(raw, 'V07');
    const e = errs(issues).join('\n');
    expect(e).toMatch(/SYN_E1.SYN_T1.c0: running_rule "weekdays": unknown clause/);
    expect(e).toMatch(/SYN_E1.SYN_T1.c1: running_rule .* gives no running day in SYN_E1 \(1914-05-01..1914-09-30\)/);
    expect(e).toMatch(/rule_dsl "dow:Tu,Xx": unknown weekday "Xx"/);
    expect(warns(issues).join('\n')).toMatch(/mark x: not reviewed/);
  });
  it('flags overlapping editions in a family and two truth editions for a segment', () => {
    const raw = world();
    find(raw, 'editions', (r) => r.edition_id === 'SYN_E2').valid_to = '1914-05-10';
    addRow(raw, 'segment_sources', { segment_id: 'SYN_S_OB', edition_id: 'SYN_E3', date_from: '1914-09-01', date_to: '1914-12-31', rank: '1' });
    const issues = run(raw, 'V07');
    const e = errs(issues).join('\n');
    expect(e).toMatch(/family SYN_F1: SYN_E2 \(to 1914-05-10\) overlaps SYN_E1 \(from 1914-05-01\)/);
    expect(e).toMatch(/segment SYN_S_OB has two truth editions \(SYN_E1, SYN_E3\) from 1914-09-01/);
    expect(warns(issues).join('\n')).toMatch(/SYN_S_OB SYN_E3: 1914-09-01..1914-12-31 reaches outside the edition's validity/);
  });
  it('flags Gregorian and Julian dates that disagree, and broken notation files', () => {
    const raw = world();
    find(raw, 'calendar', (r) => r.event_id === 'SYN_EV1').date_jul = 'J1914-07-18';
    raw.notationTexts.set('notation/SYN_E1.json', '{"edition_id": "SYN_E1"}');
    const e = errs(run(raw, 'V07')).join('\n');
    expect(e).toMatch(/SYN_EV1: date_greg 1914-08-01 and date_jul \(= 1914-07-31 Gregorian\) are different days/);
    expect(e).toMatch(/canonical\/notation\/SYN_E1.json: src must be a non-empty string/);
  });
});

describe('V08 fares', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V08')).toEqual([]);
  });
  it('flags non-positive amounts, class order, return below single and the wrong currency', () => {
    const raw = world();
    find(raw, 'fares', (r) => r.class === 'boat').amount_minor = '0';
    find(raw, 'fares', (r) => r.from_station_id === 'SYN_OST' && r.class === '2').amount_minor = '9900';
    find(raw, 'fares', (r) => r.edition_id === 'SYN_E1' && r.from_station_id === 'SYN_LON' && r.to_station_id === 'SYN_DOV' && r.single_return === 'r').amount_minor = '600';
    find(raw, 'fares', (r) => r.from_station_id === 'SYN_BER' && r.class === '1').currency = 'RUB';
    const e = errs(run(raw, 'V08')).join('\n');
    expect(e).toMatch(/amount_minor 0 must be a positive integer/);
    expect(e).toMatch(/SYN_E1 SYN_OST SYN_BER table BEF s: class 1 \(9850\) is cheaper than class 2 \(9900\)/);
    expect(e).toMatch(/SYN_E1 SYN_LON SYN_DOV table GBP 1: return \(600\) is cheaper than single \(672\)/);
    expect(e).toMatch(/RUB fare from SYN_BER \(DE\); fares sold there are in DEM/);
  });
  it('warns about returns without validity and unknown countries', () => {
    const raw = world();
    find(raw, 'fares', (r) => r.single_return === 'r').validity_days = '';
    find(raw, 'stations', (r) => r.station_id === 'SYN_OST').country = 'XX';
    const w = warns(run(raw, 'V08')).join('\n');
    expect(w).toMatch(/return fare without validity_days/);
    expect(w).toMatch(/no currency known for country XX/);
  });
});
