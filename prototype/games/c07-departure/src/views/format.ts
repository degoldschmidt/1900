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

export interface CitationView { title: string; page: string; table: string | null; edition: string | null; text: string }
export function citation(b: C07Bundle, i: number | null | undefined): CitationView | null {
  if (i === null || i === undefined) return null;
  const c = b.raw.citations[i];
  if (!c) return null;
  const text = `${c.sourceTitle}, page ${c.printedPage}${c.tableRef ? `, table ${c.tableRef}` : ''}`;
  return { title: c.sourceTitle, page: c.printedPage, table: c.tableRef, edition: c.edition, text };
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

/** What kind of offer a commission is, in words (offers have no names of their own). */
export const offerName = (kind: string): string => (kind === 'chain' ? 'the commission' : kind === 'errand' ? 'an errand' : kind === 'away' ? 'an away offer' : kind);

const GHOST_TEXT: Record<string, string> = {
  withdrawn: 'is withdrawn: it no longer runs', retimed: 'now runs at another time', notThatDay: 'does not run on that day', suspended: 'is suspended', ok: 'runs',
};
const PAY_WHAT: Record<string, string> = { fare: 'the fare', lodging: 'the room', rent: 'the rent', bill: 'the bill' };

const trainNoOf = (b: C07Bundle, key: unknown): string => {
  const i = typeof key === 'string' ? b.tt.tripsByKey.get(key)?.[0] : undefined;
  return i === undefined ? 'train' : b.tt.trips[i]!.trainNo;
};
const placeName = (b: C07Bundle, id: unknown): string => (typeof id !== 'string' ? '' : b.station.get(id)?.name ?? b.city.get(id)?.name ?? id);

/** One sentence for an interrupt, from its public reference (the diary's notes and the arrival). */
export function interruptText(b: C07Bundle, kind: string, ref: unknown, city: string): string {
  const r = (ref ?? {}) as Record<string, unknown>;
  const num = (k: string): number => (typeof r[k] === 'number' ? r[k] as number : 0);
  switch (kind) {
    case 'arrival': return `Arrived at ${placeName(b, r.station)}, ${num('delaySec') > 0 ? `${fmtDuration(num('delaySec'))} late` : 'on time'}.`;
    case 'missed': return `Missed the ${trainNoOf(b, r.trainKey)} at ${placeName(b, r.station)}: ${fmtDuration(num('delaySec'))} late against ${fmtDuration(Math.max(0, num('slackSec')))} of slack.`;
    case 'ghost': {
      const truth = typeof r.truthDep === 'number' && r.status === 'retimed' ? ` (it leaves at ${clock(b, city, r.truthDep).time})` : '';
      return `The ${trainNoOf(b, r.trainKey)} from ${placeName(b, r.station)} ${GHOST_TEXT[String(r.status)] ?? 'is not as the guide said'}${truth}. The booking is void.`;
    }
    case 'verbFailed': return `${verbLabel(String(r.verb ?? ''))} could not happen${r.reason ? `: ${String(r.reason)}` : ''}.`;
    case 'news': return `New items in the ${placeName(b, r.city) || 'local'} papers.`;
    case 'offer': return `${num('n') === 1 ? 'A letter' : `${num('n')} letters`} with offers at the ${placeName(b, r.city)} post office.`;
    case 'lapsed': return r.failed ? `Stage ${num('stage') + 1} of the commission was not done in time; the commission has failed.` : `An offer lapsed${r.rival === true ? '; a rival delivered it' : r.rival === false ? '; nobody took it' : ''}.`;
    case 'cable': return `Telegram answered: the ${trainNoOf(b, r.trainKey)} ${r.runs ? 'runs' : 'does not run'} that day.`;
    case 'remittance': return r.purpose === 'remit' ? (r.met ? 'The remittance met the bill.' : 'The remittance came, but did not meet the bill.') : 'Funds wired from home have reached your letter of credit.';
    case 'noticed': return `You notice a man watching${r.station ? ` at ${placeName(b, r.station)}` : r.city ? ` in ${placeName(b, r.city)}` : ''}.`;
    case 'refused': return `Refused at ${placeName(b, r.station)}: your papers do not pass.`;
    case 'suspended': return 'A service you rely on is suspended.';
    case 'papers': return 'The frontier asks for new papers.';
    case 'cannotPay': return `Not enough money for ${PAY_WHAT[String(r.what)] ?? verbLabel(String(r.what ?? 'that'))}.`;
    case 'collapse': return 'You collapse from exhaustion and lose a day.';
    case 'ending': return 'The scenario is over.';
    default: return interruptLabel(kind);
  }
}

// ---------------------------------------------------------------- plain words (Decision P-012)

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** A span of time in words for the map screens: "45 min", "3 h 45", "1 day 4 h". */
export function span(sec: number): string {
  const m = Math.max(0, Math.round(sec / 60));
  // Non-breaking spaces keep "3 h 45" on one line.
  if (m < 60) return `${m}\u00a0min`;
  const h = Math.floor(m / 60); const r = m % 60;
  if (h < 24) return r ? `${h}\u00a0h\u00a0${pad2(r)}` : `${h}\u00a0h`;
  const d = Math.floor(h / 24); const hr = h % 24;
  return `${d}\u00a0${d === 1 ? 'day' : 'days'}${hr ? ` ${hr}\u00a0h` : ''}`;
}

const SMALL = ['nothing', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** 0–999 in words. */
export function numberWords(n: number): string {
  if (n < 20) return SMALL[n]!;
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${SMALL[n % 10]}` : ''}`;
  const h = Math.floor(n / 100); const r = n % 100;
  return `${SMALL[h]} hundred${r ? ` and ${numberWords(r)}` : ''}`;
}

/** Sterling (in farthings) in words, to the nearest shilling: "about two pounds eight", "about fifteen shillings". */
export function poundsWords(farthings: number): string {
  const shillings = Math.max(0, Math.round(farthings / 48));
  const l = Math.floor(shillings / 20); const s = shillings % 20;
  if (l === 0) return s === 0 ? 'less than a shilling' : `about ${numberWords(s)} shilling${s === 1 ? '' : 's'}`;
  if (l >= 20 || s === 0) return `about ${numberWords(l)} pound${l === 1 ? '' : 's'}`;
  return `about ${numberWords(l)} pound${l === 1 ? '' : 's'} ${numberWords(s)}`;
}

/** How a kind of train keeps time, in words (from its delay category, never odds). */
export function reliabilityWord(category: 'express' | 'ordinary' | 'boat'): string {
  return category === 'express' ? 'usually on time' : category === 'ordinary' ? 'sometimes late' : 'late in rough weather';
}

/** A change, in words, from the planner's miss odds (‰) and its scheduled slack. */
export function changeWord(odds: number, slackSec: number): string {
  if (slackSec >= 6 * 3600) return 'a long wait';
  if (odds === 0 && slackSec >= 3600) return 'easy change';
  if (odds <= 50) return 'comfortable change';
  if (odds <= 150) return 'tight change';
  return 'very tight change';
}

const CLASS_WORD: Record<number, string> = { 1: '1st class', 2: '2nd class', 3: '3rd class' };
export const classWord = (cls: number): string => CLASS_WORD[cls] ?? `class ${cls}`;
