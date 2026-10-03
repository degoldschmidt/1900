// Campaign time: whole minutes from Sunday 28 June 1914, 00.00 CET (day 0).
// Data files write 'MM-DD hh.mm' for moments and 'hh.mm' for clock times.

export const DAY = 1440;
const OFFSET = { '06': -28, '07': 2, '08': 33 }; // day index = day of month + offset (28 June = 0, 1 July = 3, 1 Aug = 34)

/** 'MM-DD hh.mm' → minutes from the start of the campaign. */
export function T(s) {
  const m = /^(\d\d)-(\d\d) (\d\d)\.(\d\d)$/.exec(s);
  if (!m) throw new Error(`time "${s}" is not 'MM-DD hh.mm'`);
  const off = OFFSET[m[1]];
  if (off === undefined) throw new Error(`time "${s}" lies outside June to August 1914`);
  const hh = Number(m[3]), mm = Number(m[4]);
  if (hh > 23 || mm > 59) throw new Error(`time "${s}" has no such hour`);
  return (Number(m[2]) + off) * DAY + hh * 60 + mm;
}

/** 'hh.mm' → minutes after midnight. */
export function clock(s) {
  const m = /^(\d\d)\.(\d\d)$/.exec(s);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error(`clock "${s}" is not 'hh.mm'`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export const isTime = (s) => { try { T(s); return true; } catch { return false; } };
export const isClock = (s) => { try { clock(s); return true; } catch { return false; } };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30];

/** Calendar parts of a moment. */
export function dateOf(t) {
  t = Math.floor(t);
  const d = Math.floor(t / DAY), m = ((t % DAY) + DAY) % DAY;
  let day = 28 + d, month = 5;
  while (day > MDAYS[month]) { day -= MDAYS[month]; month++; }
  return { d, dow: ((d % 7) + 7) % 7, day, month, monthName: MONTHS[month], dayName: DAYS[((d % 7) + 7) % 7], hh: Math.floor(m / 60), mm: m % 60 };
}
const pad = (n) => String(n).padStart(2, '0');
export const hm = (t) => { const x = dateOf(t); return `${pad(x.hh)}.${pad(x.mm)}`; };
export const dayShort = (t) => { const x = dateOf(t); return `${x.dayName.slice(0, 3)} ${x.day} ${x.monthName.slice(0, 3)}`; };
export const when = (t) => `${dayShort(t)} ${hm(t)}`;
export const longDate = (t) => { const x = dateOf(t); return `${x.dayName} ${x.day} ${x.monthName} 1914`; };
export const span = (min) => { min = Math.max(0, Math.round(min)); const d = Math.floor(min / DAY), h = Math.floor((min % DAY) / 60), m = min % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${pad(m)}m` : `${m}m`; };
