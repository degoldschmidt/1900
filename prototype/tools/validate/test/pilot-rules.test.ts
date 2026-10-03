/**
 * Validator rules added for the D2 pilot (Fritzsche 1914): V03 leaves a first stop whose cell is
 * waived or not yet read to V11; V04 does not report a column split at alternative ends
 * (<column>.r<row>) as "the same train twice"; V07 blocks a service whose running rule rests on
 * an unreviewed running_rules row (the normaliser's --partial mode applies such proposals).
 */
import { describe, it, expect } from 'vitest';
import { addRow, errs, find, run, warns, world } from './world.ts';

describe('V03: a first stop without its time because its cell is not read', () => {
  it('is an error when the stop is read, and left to V11 when it is illegible or waived', () => {
    let raw = world();
    const first = find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '1');
    first.dep_local = ''; first.dep_dayoff = '';
    expect(errs(run(raw, 'V03'))).toContain('service SYN_E1.SYN_T1.c0: first stop SYN_LON has no departure');
    raw = world();
    const f2 = find(raw, 'stops', (r) => r.service_id === 'SYN_E1.SYN_T1.c0' && r.seq === '1');
    f2.dep_local = ''; f2.dep_dayoff = ''; f2.status = 'illegible';
    expect(errs(run(raw, 'V03'))).toEqual([]);
  });
});

describe('V04: alternative ends of one printed column', () => {
  it('are compared but not reported as the same train twice', () => {
    const raw = world();
    const base = find(raw, 'services', (r) => r.service_id === 'SYN_E1.SYN_T1.c0');
    for (const id of ['SYN_E1.SYN_T1.c9.r3', 'SYN_E1.SYN_T1.c9.r4']) {
      addRow(raw, 'services', { ...base, service_id: id, train_key: 'SYN-ALT-9' });
      addRow(raw, 'stops', { service_id: id, seq: '1', station_id: 'SYN_LON', dep_local: '09:00', dep_dayoff: '0', status: 'agree', src: 'SYN_SRC_S:p10:SYN_T1:SYN_CR1:c0r0' });
      addRow(raw, 'stops', { service_id: id, seq: '2', station_id: 'SYN_DOV', arr_local: id.endsWith('r3') ? '10:45' : '10:50', arr_dayoff: '0', status: 'agree', src: 'SYN_SRC_S:p10:SYN_T1:SYN_CR1:c0r1' });
    }
    const issues = run(raw, 'V04');
    expect(warns(issues)).toEqual([]);
    expect(errs(issues)).toEqual(['train SYN-ALT-9: SYN_E1.SYN_T1.c9.r3 (SYN_E1 SYN_T1) and SYN_E1.SYN_T1.c9.r4 (SYN_E1 SYN_T1) disagree at SYN_DOV arr: 10:45 vs 10:50']);
  });
});

describe('V07: a service resting on an unreviewed running rule', () => {
  it('is an error (the row itself stays a warning)', () => {
    const raw = world();
    find(raw, 'running_rules', (r) => r.mark === 'a').reviewed_by = '';
    const issues = run(raw, 'V07');
    expect(errs(issues).join('\n')).toMatch(/SYN_E1.SYN_T2.c1: running rule "dow:Mo,Th" rests on running_rules rows not yet reviewed \(a\); it cannot be compiled until a historian reviews them/);
    expect(warns(issues).join('\n')).toMatch(/mark a: not reviewed/);
  });
});
