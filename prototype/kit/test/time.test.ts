import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { dayFromGregorian, dayFromJulian, gregorianFromDay, julianFromDay, weekday, isoFromDay, dayFromIso, dayFromAnyIso, parseDualDate } from '../src/time/calendar.ts';
import { instantOf, dayOf, secOfDay, hm } from '../src/time/instant.ts';
import { ZoneTable, toInstant, toLocal } from '../src/time/zones.ts';
import { fmtClock, fmtDate, fmtDuration } from '../src/time/format.ts';

describe('calendars', () => {
  it('anchors day 0 at Monday 1 January 1900', () => {
    expect(dayFromGregorian(1900, 1, 1)).toBe(0);
    expect(weekday(0)).toBe(0);
  });
  it('converts Julian and Gregorian dates', () => {
    expect(dayFromJulian(1900, 3, 1)).toBe(dayFromGregorian(1900, 3, 14));
    expect(dayFromJulian(1900, 2, 29)).toBe(dayFromGregorian(1900, 3, 13)); // 1900 is a Julian leap year only
    const aug1 = dayFromGregorian(1914, 8, 1);
    expect(dayFromJulian(1914, 7, 19)).toBe(aug1);
    expect(weekday(aug1)).toBe(5); // Saturday
    expect(dayFromJulian(1918, 1, 31) + 1).toBe(dayFromGregorian(1918, 2, 14)); // the Soviet switch
    expect(isoFromDay(dayFromJulian(1918, 2, 1))).toBe('1918-02-14');
  });
  it('rejects impossible dates', () => {
    expect(() => dayFromGregorian(1914, 2, 29)).toThrow();
    expect(() => dayFromGregorian(1900, 2, 29)).toThrow();
    expect(dayFromJulian(1900, 2, 29)).toBeTypeOf('number');
  });
  it('round-trips every day from 1890 to 1930', () => {
    const lo = dayFromGregorian(1890, 1, 1); const hi = dayFromGregorian(1930, 12, 31);
    fc.assert(fc.property(fc.integer({ min: lo, max: hi }), (d) => {
      const g = gregorianFromDay(d); const j = julianFromDay(d);
      return dayFromGregorian(g.y, g.m, g.d) === d && dayFromJulian(j.y, j.m, j.d) === d && dayFromIso(isoFromDay(d)) === d;
    }));
  });
  it('parses ISO and dual dates as printed', () => {
    expect(dayFromAnyIso('J1914-07-19')).toBe(dayFromAnyIso('1914-08-01'));
    expect(parseDualDate('19 July/1 Aug. 1914').gregorian).toBe(dayFromGregorian(1914, 8, 1));
    expect(parseDualDate('31 Dec. 1913/13 Jan. 1914').julian).toBe(dayFromGregorian(1914, 1, 13));
    expect(() => parseDualDate('19 July/2 Aug. 1914')).toThrow();
  });
});

describe('instants and zones', () => {
  it('splits instants into days and seconds', () => {
    const t = instantOf(5000, hm(14, 5));
    expect(dayOf(t)).toBe(5000);
    expect(secOfDay(t)).toBe(hm(14, 5));
    expect(dayOf(-1)).toBe(-1);
  });
  it('converts local railway time with odd-second offsets', () => {
    const zones = new ZoneTable(
      [{ id: 'SYN_PET', name: 'Petersburg', offsetSec: 7278, appliesTo: 'railway', from: 0, to: null }],
      [{ station: 'SYN_S', zone: 'SYN_PET', from: 0, to: null }],
    );
    const off = zones.stationOffset('SYN_S', 5000);
    const t = toInstant(5000, hm(0, 30), off);
    expect(t).toBe(instantOf(5000, 1800 - 7278));
    expect(toLocal(t, off)).toEqual({ day: 5000, sec: 1800 });
    expect(() => zones.stationOffset('SYN_X', 5000)).toThrow();
  });
});

describe('display formatting', () => {
  it('formats clocks, dates and durations', () => {
    expect(fmtClock(hm(14, 5))).toBe('14.05');
    expect(fmtClock(hm(14, 5), '12h')).toBe('2.05 p.m.');
    expect(fmtClock(0, '12h')).toBe('midnight');
    const aug1 = dayFromGregorian(1914, 8, 1);
    expect(fmtDate(aug1)).toBe('Sat 1 Aug 1914');
    expect(fmtDate(aug1, 'dual', false)).toBe('19 July/1 Aug 1914');
    expect(fmtDate(aug1, 'jul', false)).toBe('19 July 1914 O.S.');
    expect(fmtDuration(95 * 60)).toBe('1 h 35 min');
    expect(fmtDuration(50 * 3600)).toBe('2 d 2 h');
  });
});
