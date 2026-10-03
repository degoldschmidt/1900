import { describe, it, expect } from 'vitest';
import { addRow, errs, find, removeRows, run, warns, world } from './world.ts';

describe('V09 zones', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V09')).toEqual([]);
  });
  it('flags a served station without a railway zone on edition days', () => {
    const raw = world();
    find(raw, 'station_zones', (r) => r.station_id === 'SYN_SPB').from = '1914-06-01';
    const e = errs(run(raw, 'V09'));
    expect(e).toEqual(['edition SYN_E1: station SYN_SPB has no railway zone on 1914-05-01 (first such day in the edition)']);
  });
  it('flags overlapping zone rows, mixed kinds, wild offsets and a railway zone used as civil', () => {
    const raw = world();
    addRow(raw, 'zones', { zone_id: 'SYN_Z_SPB', name: 'dup', offset_seconds: '7200', applies_to: 'civil', from: '1914-01-01', to: '', src: 'SYN_SRC_H:p5:-:-:-' });
    find(raw, 'zones', (r) => r.zone_id === 'SYN_Z_MEZ_CIV').offset_seconds = '50000';
    find(raw, 'cities', (r) => r.city_id === 'SYN_C_BER').civil_zone_id = 'SYN_Z_MEZ';
    const e = errs(run(raw, 'V09')).join('\n');
    expect(e).toMatch(/zone SYN_Z_SPB has overlapping rows from 1914-01-01/);
    expect(e).toMatch(/zone SYN_Z_SPB mixes railway and civil rows/);
    expect(e).toMatch(/offset 50000 s is beyond ±12 h/);
    expect(e).toMatch(/SYN_C_BER: civil_zone_id SYN_Z_MEZ is not a civil zone/);
    expect(e).toMatch(/station SYN_SPB has 2 railway zones|zone SYN_Z_SPB has no single offset/);
  });
  it('warns about stations without railway zones and station zones naming civil zones', () => {
    const raw = world();
    find(raw, 'station_zones', (r) => r.station_id === 'SYN_LON').zone_id = 'SYN_Z_GMT_CIV';
    const w = warns(run(raw, 'V09')).join('\n');
    expect(w).toMatch(/SYN_LON: SYN_Z_GMT_CIV is a civil zone/);
    expect(w).toMatch(/SYN_LON has no railway zone row/);
  });
});

describe('V10 every page double-keyed', () => {
  it('passes the synthetic world (one table skipped with a reason)', () => {
    expect(run(world(), 'V10')).toEqual([]);
  });
  it('flags a missing keying, and accepts a skip with a reason', () => {
    const raw = world();
    raw.rawFiles = raw.rawFiles.filter((f) => f !== 'SYN_SRC_S/SYN_T2/SYN_CR3.B.csv');
    expect(errs(run(raw, 'V10'))).toEqual([
      'pages.csv:4: SYN_SRC_S p11 table SYN_T2 crop SYN_CR3: keying B missing (raw/SYN_SRC_S/SYN_T2/SYN_CR3.B.csv) and no skip reason',
    ]);
    raw.rawTexts.set('status.csv', `${raw.rawTexts.get('status.csv')!}SYN_SRC_S,SYN_T2,SYN_CR3,skip-single,,SYN test: one keyer only\n`);
    expect(errs(run(raw, 'V10'))).toEqual([]);
  });
  it('flags a table page with no crops and a skip without a reason', () => {
    const raw = world();
    raw.rawTexts.delete('SYN_SRC_S/SYN_T3U/crops.csv');
    raw.rawTexts.set('status.csv', raw.rawTexts.get('status.csv')!.replace(',skip,,SYN cross-check guide: rows entered from a single reading for the test', ',skip,,'));
    const e = errs(run(raw, 'V10')).join('\n');
    expect(e).toMatch(/SYN_SRC_S p15 table SYN_T3U: no crops in raw\/SYN_SRC_S\/SYN_T3U\/crops.csv and no skip reason/);
    expect(e).toMatch(/raw\/status.csv:10: SYN_SRC_K SYN_K7 \*: a skip needs a reason in note/);
  });
  it('does not report a skipped crop (e.g. superseded by a -v2 re-key) as unkeyed or below the re-key line', () => {
    const raw = world();
    raw.rawTexts.set('SYN_SRC_S/SYN_T2/crops.csv', `${raw.rawTexts.get('SYN_SRC_S/SYN_T2/crops.csv')!.trimEnd()}\nSYN_CR3-old,11,SYN_T2,0,0,1000,800,,,c0-c1,r0-r5\n`);
    raw.rawTexts.set('status.csv', `${raw.rawTexts.get('status.csv')!}SYN_SRC_S,SYN_T2,SYN_CR3-old,resolved,700,\n`);
    const before = run(raw, 'V10');
    expect(errs(before).join('\n')).toMatch(/crop SYN_CR3-old: keying A and B missing/);
    expect(warns(before).join('\n')).toMatch(/SYN_CR3-old: agreement 700‰ is below 950‰/);
    raw.rawTexts.set('status.csv', raw.rawTexts.get('status.csv')!.replace('SYN_CR3-old,resolved,700,', 'SYN_CR3-old,skipped,700,superseded by -v2 crops'));
    expect(run(raw, 'V10')).toEqual([]);
  });
  it('warns about low agreement and table pages without table_refs; ignores out-of-scope sources', () => {
    const raw = world();
    raw.rawTexts.set('status.csv', raw.rawTexts.get('status.csv')!.replace('SYN_CR1,resolved,972', 'SYN_CR1,resolved,940'));
    find(raw, 'pages', (r) => r.source_id === 'SYN_SRC_S' && r.page_seq === '12').table_refs = '';
    removeRows(raw, 'segment_sources', (r) => r.edition_id === 'SYN_E2');
    raw.rawFiles = raw.rawFiles.filter((f) => !f.startsWith('SYN_SRC_W/'));
    const issues = run(raw, 'V10');
    expect(errs(issues)).toEqual([]);
    const w = warns(issues).join('\n');
    expect(w).toMatch(/SYN_CR1: agreement 940‰ is below 950‰; re-key the crop/);
    expect(w).toMatch(/SYN_SRC_S p12 is a table page but lists no table_refs/);
  });
});

describe('V11 nothing unresolved', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V11')).toEqual([]);
  });
  it('flags stops that are not agree, resolved or waived', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T2.c0' && r.seq === '3').status = 'illegible';
    expect(errs(run(raw, 'V11'))).toEqual(['stops.csv:12: SYN_E1.SYN_T2.c0 seq 3 has status illegible; only agree, resolved or waived may be compiled']);
  });
  it('requires a historian waiver for a waived stop', () => {
    const raw = world();
    find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T2.c0' && r.seq === '3').status = 'waived';
    expect(errs(run(raw, 'V11'))).toEqual(['stops.csv:12: SYN_E1.SYN_T2.c0 seq 3 is waived but no waiver in waivers.csv cites a cell of SYN_SRC_S:p11:SYN_T2:SYN_CR3:c0r3-4']);
    addRow(raw, 'waivers', { waiver_id: 'SYN_W1', src: 'SYN_SRC_S:p11:SYN_T2:SYN_CR3:c0r4', note: 'SYN: blot over the minutes; 6 20 confirmed by the Kursbuch', historian: 'SYN historian', reviewed_on: '1914-01-01' });
    expect(run(raw, 'V11')).toEqual([]);
  });
  it('flags illegible or unresolved keyed cells in normalised tables, and only warns elsewhere', () => {
    const raw = world();
    const path = 'SYN_SRC_S/SYN_T1/SYN_CR1.R.csv';
    raw.rawTexts.set(path, raw.rawTexts.get(path)!.replace('p.m. 3 5,,n,B,keyer A read 3 3', 'p.m. 3 5,,x,illegible,').replace('SYN_CR1,header,1,1,1.2,,y,agree,', 'SYN_CR1,header,1,1,1.2,,y,,'));
    raw.rawTexts.set('SYN_SRC_S/SYN_T9/crops.csv', 'crop_id,page_seq,table_ref\nSYN_CR9,10,SYN_T9\n');
    raw.rawTexts.set('SYN_SRC_S/SYN_T9/SYN_CR9.R.csv', 'crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\nSYN_CR9,cell,0,0,9 0,,x,illegible,\n');
    const issues = run(raw, 'V11');
    expect(errs(issues)).toEqual([
      'raw/SYN_SRC_S/SYN_T1/SYN_CR1.R.csv:5: header h1c1 is unresolved and has no waiver',
      'raw/SYN_SRC_S/SYN_T1/SYN_CR1.R.csv:21: cell c1r3 is illegible and has no waiver',
    ]);
    expect(warns(issues)).toEqual(['raw/SYN_SRC_S/SYN_T9/SYN_CR9.R.csv:2: cell c0r0 is illegible and has no waiver']);
    addRow(raw, 'waivers', { waiver_id: 'SYN_W2', src: 'SYN_SRC_S:p10:SYN_T1:SYN_CR1:c1r3', note: 'SYN: accepted', historian: 'SYN historian', reviewed_on: '1914-01-01' });
    expect(errs(run(raw, 'V11'))).toEqual(['raw/SYN_SRC_S/SYN_T1/SYN_CR1.R.csv:5: header h1c1 is unresolved and has no waiver']);
  });
  it('ignores the resolved file of a skipped crop (superseded crops stay on disk as the record)', () => {
    const raw = world();
    const old = 'SYN_SRC_S/SYN_T1/SYN_CR1-old.R.csv';
    raw.rawTexts.set(old, 'crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note\nSYN_CR1-old,cell,0,0,9 0,,x,illegible,\nSYN_CR1-old,cell,1,0,9 5,,y,,\n');
    raw.rawTexts.set('status.csv', `${raw.rawTexts.get('status.csv')!}SYN_SRC_S,SYN_T1,SYN_CR1-old,resolved,900,\n`);
    expect(errs(run(raw, 'V11'))).toEqual([
      'raw/SYN_SRC_S/SYN_T1/SYN_CR1-old.R.csv:2: cell c0r0 is illegible and has no waiver (crop not in crops.csv)',
      'raw/SYN_SRC_S/SYN_T1/SYN_CR1-old.R.csv:3: cell c1r0 is unresolved and has no waiver (crop not in crops.csv)',
    ]);
    raw.rawTexts.set('status.csv', raw.rawTexts.get('status.csv')!.replace('SYN_CR1-old,resolved,900,', 'SYN_CR1-old,skipped,900,superseded by -v2 crops'));
    expect(run(raw, 'V11')).toEqual([]);
  });
  it('warns about a waiver that matches nothing', () => {
    const raw = world();
    addRow(raw, 'waivers', { waiver_id: 'SYN_W3', src: 'SYN_SRC_S:p10:SYN_T1:SYN_CR1:c7r7', note: 'n', historian: 'h', reviewed_on: '1914-01-01' });
    expect(warns(run(raw, 'V11'))).toEqual(['waivers.csv:2: SYN_W3 matches no waived stop and no unresolved cell']);
  });
});

describe('V12 Tier-0 citations, basis and public dependencies', () => {
  it('passes the synthetic world', () => {
    expect(run(world(), 'V12')).toEqual([]);
  });
  it('flags uncited Tier-0 rows and design dates in Tier 0', () => {
    const raw = world();
    find(raw, 'calendar', (r) => r.event_id === 'SYN_EV1').src = '';
    const p = find(raw, 'params', (r) => r.row_id === 'SYN_P002');
    p.src = ''; p.date_basis = 'design'; p.dv_id = 'DV-002';
    const e = errs(run(raw, 'V12')).join('\n');
    expect(e).toMatch(/SYN_EV1: Tier-0 calendar rows must be cited/);
    expect(e).toMatch(/SYN_P002: Tier-0 rows must be cited/);
    expect(e).toMatch(/SYN_P002: a Tier-0 row's date must be historical/);
  });
  it('flags a public event whose effect is not public', () => {
    const raw = world();
    find(raw, 'calendar', (r) => r.event_id === 'SYN_EV2').kind = 'order';
    expect(errs(run(raw, 'V12'))).toEqual(['calendar.csv:3: public event SYN_EV2 has the non-public effect SYN_P003 (mark the event kind "secret-…" or make the row public)']);
  });
  it('flags a public row whose value refers to a non-public row', () => {
    const raw = world();
    find(raw, 'params', (r) => r.row_id === 'SYN_P001').value_json = '{"until": {"$row": "SYN_P003"}}';
    expect(errs(run(raw, 'V12'))).toEqual(['params.csv:2: public row SYN_P001 depends on non-public row SYN_P003']);
  });
  it('warns when an effect does not start on its event day', () => {
    const raw = world();
    find(raw, 'params', (r) => r.row_id === 'SYN_P002').from = '1914-08-02';
    expect(warns(run(raw, 'V12'))).toEqual(['calendar.csv:2: SYN_EV1 (1914-08-01): effect SYN_P002 starts on 1914-08-02']);
  });
  it('flags missing basis fields (seeded at parse time)', () => {
    const raw = world();
    find(raw, 'params', (r) => r.row_id === 'SYN_P005').value_basis = '';
    expect(errs(run(raw, 'V01')).join('\n')).toMatch(/params.csv:6: value_basis is required/);
  });
});
