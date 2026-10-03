/** Display helpers for the views: local clocks per city and money in each currency's period style. */
import { fmtClock, fmtDate, fmtDuration } from '#kit/time/format.ts';
import { format as fmtMoneyKit, type Money } from '#kit/money/money.ts';
import type { Instant } from '#kit/time/instant.ts';
import type { C07Bundle } from '../rules/data.ts';
import { localIn } from '../rules/data.ts';

export interface Clock { t: Instant; date: string; time: string; text: string }

/** A local civil time in a city: "Mon 27 Apr 1914", "14.05". */
export function clock(b: C07Bundle, city: string, t: Instant): Clock {
  const { day, sec } = localIn(b, city, t);
  const date = fmtDate(day, b.city.get(city)?.country === 'RU' ? 'dual' : 'greg');
  const time = fmtClock(sec);
  return { t, date, time, text: `${date} ${time}` };
}

/** A station's printed (railway) time. */
export function stationClock(b: C07Bundle, station: string, t: Instant): Clock {
  const off = b.tt.zones.stationOffset(station, Math.floor(t / 86400));
  const local = t + off; const day = Math.floor(local / 86400); const sec = local - day * 86400;
  const date = fmtDate(day, 'greg'); const time = fmtClock(sec);
  return { t, date, time, text: `${date} ${time}` };
}

export const money = (b: C07Bundle, m: Money): string => fmtMoneyKit(m, b.units[m.cur]);

/** Opening spans of one weekday as text ("09.00–12.00, 14.00–16.00", "day and night", "closed"). */
export function hoursText(spans: ReadonlyArray<readonly [number, number, number]> | null | undefined, weekday: number): string {
  if (spans === null || spans === undefined) return 'always';
  const list = spans.filter(([m]) => (m & (1 << weekday)) !== 0).map(([, o, c]) => [o, c] as const).sort((x, y) => x[0] - y[0]);
  if (list.length === 0) return 'closed';
  if (list.length === 1 && list[0]![0] === 0 && list[0]![1] === 86400) return 'day and night';
  return list.map(([o, c]) => `${fmtClock(o)}–${fmtClock(c === 86400 ? 0 : c)}`).join(', ');
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** A week of opening spans as text, one line per run of equal days ("Mon–Fri 09.00–12.00, 14.00–16.00"). */
export function weekText(spans: ReadonlyArray<readonly [number, number, number]>): string[] {
  const days = WEEKDAYS.map((_, wd) => hoursText(spans, wd));
  const out: string[] = [];
  for (let i = 0; i < 7;) {
    let j = i;
    while (j + 1 < 7 && days[j + 1] === days[i]) j++;
    out.push(`${WEEKDAYS[i]}${j > i ? `–${WEEKDAYS[j]}` : ''} ${days[i]}`);
    i = j + 1;
  }
  return out;
}
export const duration = (sec: number): string => fmtDuration(sec);
export const stationName = (b: C07Bundle, id: string): string => b.station.get(id)?.name ?? id;
export const cityName = (b: C07Bundle, id: string): string => b.city.get(id)?.name ?? id;
export const instName = (b: C07Bundle, id: string): string => b.inst.get(id)?.name ?? id;

export interface CitationView { title: string; page: string; table: string | null; edition: string | null }
export function citation(b: C07Bundle, i: number | null | undefined): CitationView | null {
  if (i === null || i === undefined) return null;
  const c = b.raw.citations[i];
  return c ? { title: c.sourceTitle, page: c.printedPage, table: c.tableRef, edition: c.edition } : null;
}

const VERB_LABEL: Record<string, string> = {
  drawCredit: 'Draw on the letter of credit', posteRestante: 'Collect poste restante', meet: 'Meeting', cable: 'Telegram',
  buyGuide: 'Buy a guide', askPorter: 'Ask a porter', checkBoard: 'Read the departure board', lodge: 'Take a room', wait: 'Wait', rest: 'Rest',
};
export const verbLabel = (verb: string): string => VERB_LABEL[verb] ?? verb;

const RECORD_LABEL: Record<string, string> = {
  'registration.slip': 'Hotel registration slip', 'frontier.passport': 'Passport entry at the frontier', 'frontier.customs': 'Customs inspection',
  'ticket.sale': 'Ticket sale', 'berth.reservation': 'Sleeping-berth reservation', 'bank.draw': 'Draft on the letter of credit', 'bill.met': 'Bill met',
  'post.collect': 'Poste restante collected', 'meet.witness': 'Seen at a meeting', 'cable.copy': 'Telegram copy', 'hotel.complaint': 'Hotel complaint (unpaid)',
  'bill.protest': 'Protest of the bill',
};
export const recordLabel = (kind: string): string => RECORD_LABEL[kind] ?? kind;

const INTERRUPT_LABEL: Record<string, string> = {
  arrival: 'Arrived', ghost: 'The train is not as the guide said', missed: 'Connection missed', verbFailed: 'An act could not happen', news: 'Newspaper',
  offer: 'Letters collected', lapsed: 'A commission lapsed', cable: 'Telegram answered', remittance: 'Remittance', noticed: 'You notice a watcher',
  refused: 'Refused at the frontier', suspended: 'Service suspended', papers: 'Frontier papers changed', cannotPay: 'Not enough money', collapse: 'Collapsed from exhaustion',
  ending: 'The end',
};
export const interruptLabel = (kind: string): string => INTERRUPT_LABEL[kind] ?? kind;
