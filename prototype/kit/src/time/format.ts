/** Display formatting only (never used by rules). */
import { gregorianFromDay, julianFromDay, weekday, MONTHS_SHORT, type DayNumber } from './calendar.ts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const pad = (n: number): string => String(n).padStart(2, '0');

/** Seconds after midnight → "14.05" (24-hour, period railway style uses a point) or "2.05 p.m.". */
export function fmtClock(sec: number, style: '24h' | '12h' = '24h'): string {
  const total = Math.floor(sec / 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  if (style === '24h') return `${pad(h)}.${pad(m)}`;
  if (h === 0 && m === 0) return 'midnight';
  if (h === 12 && m === 0) return 'noon';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}.${pad(m)} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

export function fmtDate(day: DayNumber, mode: 'greg' | 'jul' | 'dual' = 'greg', withWeekday = true): string {
  const g = gregorianFromDay(day);
  const wd = withWeekday ? `${DAYS[weekday(day)]} ` : '';
  if (mode === 'greg') return `${wd}${g.d} ${MONTHS_SHORT[g.m - 1]} ${g.y}`;
  const j = julianFromDay(day);
  if (mode === 'jul') return `${wd}${j.d} ${MONTHS_SHORT[j.m - 1]} ${j.y} O.S.`;
  // Dual dating as printed in period sources: Julian/Gregorian.
  if (j.y === g.y && j.m === g.m) return `${wd}${j.d}/${g.d} ${MONTHS_SHORT[g.m - 1]} ${g.y}`;
  if (j.y === g.y) return `${wd}${j.d} ${MONTHS_SHORT[j.m - 1]}/${g.d} ${MONTHS_SHORT[g.m - 1]} ${g.y}`;
  return `${wd}${j.d} ${MONTHS_SHORT[j.m - 1]} ${j.y}/${g.d} ${MONTHS_SHORT[g.m - 1]} ${g.y}`;
}

export function fmtDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h < 48) return r ? `${h} h ${r} min` : `${h} h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}
