/**
 * The goal line (Decision P-012): one sentence for the commission's next stage, its deadline and
 * pay, with a progress marker (stages done, time left). Plain words only.
 */
import { weekday } from '#kit/time/calendar.ts';
import type { Instant } from '#kit/time/instant.ts';
import { localIn } from '../rules/data.ts';
import type { PublicState, ViewData } from './public.ts';
import { clock, money, cityName, span, type Clock } from './format.ts';

export interface GoalViewModel {
  status: 'open' | 'done' | 'failed' | 'none';
  /** "Take the letter to Corlaine by Tuesday 19.00 — pays £5". */
  text: string;
  city: string | null; cityName: string | null;
  opens: Clock | null; closes: Clock | null;
  /** "Tue 19.00", for the pin on the map. */
  deadlineShort: string | null;
  pay: string | null;
  done: number; total: number;
  /** "11 h left". */
  left: string | null;
  /** The contact is in the player's own city. */
  here: boolean;
  /** The window is open now. */
  openNow: boolean;
}

const DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "Tuesday 19.00" / "Tue 19.00" in a city's local time. */
export function dayTime(d: ViewData, city: string, t: Instant, short = false): string {
  const { day } = localIn(d.b, city, t);
  return `${(short ? DAY_SHORT : DAY)[weekday(day)]} ${clock(d.b, city, t).time}`;
}

export function goalView(p: PublicState, d: ViewData): GoalViewModel {
  const b = d.b;
  const chain = p.commissions.offers.filter((o) => o.kind === 'chain');
  const o = chain.find((x) => x.status === 'held') ?? chain[0];
  const none: GoalViewModel = { status: 'none', text: 'No commission held.', city: null, cityName: null, opens: null, closes: null, deadlineShort: null, pay: null, done: 0, total: 0, left: null, here: false, openNow: false };
  if (!o) return none;
  const total = o.stages.length; const done = o.stages.filter((s) => s.done !== null).length;
  const pay = money(b, o.pay);
  if (o.status === 'done') return { ...none, status: 'done', text: `Delivered: all ${total} meetings kept, ${pay} paid.`, pay, done, total };
  if (o.status === 'failed' || o.status === 'lapsed') return { ...none, status: 'failed', text: 'The commission has failed: a meeting was missed.', pay, done, total };
  const i = o.stages.findIndex((s) => s.done === null);
  const st = o.stages[i]!;
  const here = p.me.where.k === 'city' && p.me.where.city === st.city;
  const name = cityName(b, st.city);
  const by = dayTime(d, st.city, st.close);
  const verb = i === 0 ? 'Take the letter' : 'Take the letter on';
  const text = here ? `Meet your contact here in ${name} by ${by} — pays ${pay}` : `${verb} to ${name} by ${by} — pays ${pay}`;
  const left = st.close - d.now;
  return {
    status: 'open', text, city: st.city, cityName: name, opens: clock(b, st.city, st.open), closes: clock(b, st.city, st.close),
    deadlineShort: dayTime(d, st.city, st.close, true), pay, done, total, left: left > 0 ? `${span(left)} left` : 'time is up', here,
    openNow: d.now >= st.open && d.now < st.close,
  };
}
