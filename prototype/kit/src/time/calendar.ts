/**
 * Calendars. A DayNumber counts days since 1900-01-01 in the Gregorian calendar (day 0 is a
 * Monday). Russia kept the Julian calendar until 31 January 1918 (Julian), followed by
 * 14 February 1918 (Gregorian); between 1 March 1900 and that date the Julian date is 13 days
 * behind the Gregorian.
 */
export type DayNumber = number;

export interface CivilDate { y: number; m: number; d: number }

/** Julian Day Number of 1900-01-01 (Gregorian). */
const JDN_1900 = 2415021;

const div = (a: number, b: number): number => Math.floor(a / b);

export function jdnFromGregorian(y: number, m: number, d: number): number {
  const a = div(14 - m, 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + div(153 * m2 + 2, 5) + 365 * y2 + div(y2, 4) - div(y2, 100) + div(y2, 400) - 32045;
}

export function jdnFromJulian(y: number, m: number, d: number): number {
  const a = div(14 - m, 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + div(153 * m2 + 2, 5) + 365 * y2 + div(y2, 4) - 32083;
}

export function gregorianFromJdn(jdn: number): CivilDate {
  const a = jdn + 32044;
  const b = div(4 * a + 3, 146097);
  const c = a - div(146097 * b, 4);
  const d = div(4 * c + 3, 1461);
  const e = c - div(1461 * d, 4);
  const m = div(5 * e + 2, 153);
  return { d: e - div(153 * m + 2, 5) + 1, m: m + 3 - 12 * div(m, 10), y: 100 * b + d - 4800 + div(m, 10) };
}

export function julianFromJdn(jdn: number): CivilDate {
  const c = jdn + 32082;
  const d = div(4 * c + 3, 1461);
  const e = c - div(1461 * d, 4);
  const m = div(5 * e + 2, 153);
  return { d: e - div(153 * m + 2, 5) + 1, m: m + 3 - 12 * div(m, 10), y: d - 4800 + div(m, 10) };
}

function checkDate(y: number, m: number, d: number): void {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`Invalid date ${y}-${m}-${d}`);
  }
}

export function dayFromGregorian(y: number, m: number, d: number): DayNumber {
  checkDate(y, m, d);
  const day = jdnFromGregorian(y, m, d) - JDN_1900;
  const back = gregorianFromDay(day);
  if (back.y !== y || back.m !== m || back.d !== d) throw new Error(`No such Gregorian date ${y}-${m}-${d}`);
  return day;
}

export function dayFromJulian(y: number, m: number, d: number): DayNumber {
  checkDate(y, m, d);
  const day = jdnFromJulian(y, m, d) - JDN_1900;
  const back = julianFromDay(day);
  if (back.y !== y || back.m !== m || back.d !== d) throw new Error(`No such Julian date ${y}-${m}-${d}`);
  return day;
}

export const gregorianFromDay = (day: DayNumber): CivilDate => gregorianFromJdn(day + JDN_1900);
export const julianFromDay = (day: DayNumber): CivilDate => julianFromJdn(day + JDN_1900);

/** 0 = Monday … 6 = Sunday. */
export function weekday(day: DayNumber): number {
  return ((day % 7) + 7) % 7;
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

/** "1914-08-01" ⇄ day number (Gregorian ISO dates, as used in the canonical CSVs). */
export function isoFromDay(day: DayNumber): string {
  const { y, m, d } = gregorianFromDay(day);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function dayFromIso(iso: string): DayNumber {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error(`Not an ISO date: "${iso}"`);
  return dayFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** Julian ("Old Style") date written as "J1914-07-19" in the canonical CSVs. */
export function dayFromJulianIso(iso: string): DayNumber {
  const m = /^J(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) throw new Error(`Not a Julian ISO date: "${iso}"`);
  return dayFromJulian(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** Accepts "1914-08-01" (Gregorian) or "J1914-07-19" (Julian). */
export function dayFromAnyIso(s: string): DayNumber {
  return s.trim().startsWith('J') ? dayFromJulianIso(s) : dayFromIso(s);
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'] as const;

const MONTH_LOOKUP: Record<string, number> = (() => {
  const t: Record<string, number> = {};
  MONTHS.forEach((name, i) => {
    t[name.toLowerCase()] = i + 1;
    t[name.slice(0, 3).toLowerCase()] = i + 1;
  });
  t['sept'] = 9; t['june'] = 6; t['july'] = 7;
  return t;
})();

function monthOf(word: string): number {
  const k = word.toLowerCase().replace(/\.$/, '');
  const m = MONTH_LOOKUP[k];
  if (!m) throw new Error(`Unknown month "${word}"`);
  return m;
}

/**
 * Parses a dual-dated phrase as printed in period sources, Julian first:
 * "19 July/1 Aug. 1914", "19/1 Aug. 1914" is not supported (ambiguous); "31 Dec. 1913/13 Jan. 1914" is.
 * Returns both day numbers and checks that they denote the same day.
 */
export function parseDualDate(text: string): { julian: DayNumber; gregorian: DayNumber } {
  const m = /^\s*(\d{1,2})\s+([A-Za-z.]+)\s*(\d{4})?\s*\/\s*(\d{1,2})\s+([A-Za-z.]+)\s*(\d{4})\s*$/.exec(text);
  if (!m) throw new Error(`Not a dual date: "${text}"`);
  const gy = Number(m[6]);
  const jy = m[3] ? Number(m[3]) : gy;
  const julian = dayFromJulian(jy, monthOf(m[2]!), Number(m[1]));
  const gregorian = dayFromGregorian(gy, monthOf(m[5]!), Number(m[4]));
  if (julian !== gregorian) throw new Error(`"${text}" names two different days`);
  return { julian, gregorian };
}
