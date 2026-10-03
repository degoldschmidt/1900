import { describe, it, expect } from 'vitest';
import { ParamLayer } from '../src/params/layer.ts';
import type { ParamRow, WorldEventRow } from '../src/params/types.ts';
import { worldEventInstant, calendarWindow } from '../src/params/worldcal.ts';
import { lsd, money, convert, format, add, sub, times, compare } from '../src/money/money.ts';
import { instantOf } from '../src/time/instant.ts';

const row = (id: string, key: string, from: number, to: number | null, value: unknown, pub = true): ParamRow =>
  ({ id, param: 'SYN.p', keyKind: 'global', key, from, to, tier: 0, value, dateBasis: 'design', valueBasis: 'design', public: pub, dv: 'DV-SYN' });

describe('dated parameter layer', () => {
  const layer = new ParamLayer([row('a', 'k', 0, null, 1), row('b', 'k', 10, 20, 2), row('c', 'k', 15, null, 3, false), row('d', 'other', 5, 6, 9)]);
  it('picks the latest row in force', () => {
    expect(layer.get('SYN.p', 'k', 5)).toBe(1);
    expect(layer.get('SYN.p', 'k', 12)).toBe(2);
    expect(layer.get('SYN.p', 'k', 16)).toBe(3);
    expect(layer.get('SYN.p', 'k', 25)).toBe(3);
    expect(layer.get('SYN.p', 'other', 6)).toBeUndefined();
  });
  it('lists boundaries and changes', () => {
    expect(layer.boundaries(0, 30)).toEqual([0, 5, 6, 10, 15, 20]);
    expect(layer.changesOn(20)).toEqual({ started: [], ended: ['b'] });
  });
  it('applies overrides by id and appends new rows', () => {
    const o = layer.withOverrides([row('b', 'k', 10, 20, 99), row('e', 'new', 0, null, 7)]);
    expect(o.get('SYN.p', 'k', 12)).toBe(99);
    expect(o.get('SYN.p', 'new', 1)).toBe(7);
    expect(layer.get('SYN.p', 'k', 12)).toBe(2);
  });
  it('hides non-public rows from the public view', () => {
    const pub = layer.publicView();
    expect(pub.get('SYN.p', 'k', 16)).toBe(2);
  });
  it('refuses duplicate ids', () => {
    expect(() => new ParamLayer([row('a', 'k', 0, null, 1), row('a', 'j', 0, null, 1)])).toThrow();
  });
});

describe('world calendar', () => {
  const ev = (id: string, day: number, timeLocal: number | null, zone: string | null): WorldEventRow =>
    ({ id, day, timeLocal, zone, jurisdiction: null, kind: 'SYN', title: id, effects: [], cite: 0 });
  it('places events at local times and sorts a window', () => {
    expect(worldEventInstant(ev('x', 100, 3600, 'Z'), () => 3600)).toBe(instantOf(100, 0));
    expect(worldEventInstant(ev('y', 100, null, null), () => 3600)).toBe(instantOf(100, 0));
    const w = calendarWindow([ev('b', 5, 10, null), ev('a', 5, 10, null), ev('c', 4, null, null), ev('z', 9, 0, null)], 4, 5);
    expect(w.map((e) => e.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('money', () => {
  it('formats pounds, shillings and pence', () => {
    expect(format(lsd(2, 3, 6))).toBe('£2 3s. 6d.');
    expect(format(lsd(0, 0, 6, 2))).toBe('6½d.');
    expect(format(lsd(0, 12))).toBe('12s.');
    expect(format(lsd(1))).toBe('£1');
    expect(format(money('DEM', 2043))).toBe('20.43 M.');
    expect(format(money('NLG', 1205))).toBe('fl. 12.05');
    expect(format(money('FRF', -150))).toBe('−1.50 fr.');
  });
  it('converts with exact rational parities and half-up rounding', () => {
    const gbpDem = { from: 'GBP' as const, to: 'DEM' as const, num: 2043, den: 960 };
    expect(convert(lsd(1), gbpDem)).toEqual(money('DEM', 2043));
    expect(convert(lsd(0, 1), gbpDem)).toEqual(money('DEM', 102)); // 102.15 pfennig
    expect(convert(money('GBP', 47), { from: 'GBP', to: 'DEM', num: 1, den: 2 })).toEqual(money('DEM', 24)); // 23.5 → 24
    expect(() => convert(money('FRF', 1), gbpDem)).toThrow();
  });
  it('adds and compares within one currency only', () => {
    expect(add(lsd(1), lsd(0, 10))).toEqual(lsd(1, 10));
    expect(sub(lsd(1), lsd(0, 10)).minor).toBe(480);
    expect(times(lsd(0, 1), 3)).toEqual(lsd(0, 3));
    expect(compare(lsd(1), lsd(0, 19, 11))).toBeGreaterThan(0);
    expect(() => add(lsd(1), money('DEM', 1))).toThrow();
  });
});
