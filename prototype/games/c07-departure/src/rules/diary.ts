/**
 * diary (RULES.md 5.1; H07-1, H07-6): the booked departure, the slots, opening hours and
 * re-planning. `computeFlow` is pure (the views and validation call it); `reflow` applies it and
 * schedules each planned slot's VerbStart.
 */
import type { Ctx } from '#kit/sim/sim.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle } from './data.ts';
import { dv, localIn, instantIn } from './data.ts';
import type { C07State, Slot, Venue, InterruptKind } from './types.ts';
import { type Env, type VerbName, venueOf, durOf, hoursRule, hoursOf } from './verbs.ts';

export type C = Ctx<C07State, C07Bundle>;
export const PRIO_VERB_START = 9;
export const VERB_START = 'c07.VerbStart';

export function interrupt(s: C07State, ctx: { now: Instant; trace(kind: string, data?: unknown): void }, kind: InterruptKind, ref: unknown = null): void {
  s.diary.interrupts.push({ at: ctx.now, kind, ref });
  ctx.trace(kind, ref);
}

/** When the player must leave the venues for the station (+∞ without a booking, or aboard). */
export function leaveAt(s: C07State, b: C07Bundle): Instant {
  const bk = s.diary.booking;
  if (!bk || s.me.where.k !== 'city') return Infinity;
  const leg = bk.legs[bk.next];
  if (!leg) return Infinity;
  return leg.dep - dv<number>(b, 'DV-C07-001') - dv<number>(b, 'DV-C07-002');
}

/** The end of the sealed-leg budget aboard: scheduled arrival minus the remaining hall dwell. */
export function sealedEnd(s: C07State): Instant {
  if (s.me.where.k !== 'aboard') return Infinity;
  const r = s.me.where.ride;
  return r.schedArr - r.hallDwell;
}

/** First feasible start ≥ t for a slot, within the 7-day horizon, or null. */
export function nextWindow(s: C07State, e: Env, verb: VerbName, args: Slot['args'], city: string, t: Instant, dur: number): Instant | null {
  const rule = hoursRule(verb, args);
  if (rule === 'none') return t;
  if (rule === 'window') {
    const o = s.commissions.offers.find((x) => x.id === args.offer);
    const st = o?.stages[Number(args.stage)];
    if (!st) return null;
    const start = Math.max(t, st.open);
    return start + dur <= st.close ? start : null;
  }
  const horizon = dv<number>(e.b, 'DV-C07-062');
  const { day: d0, sec: s0 } = localIn(e.b, city, t);
  for (let d = d0; d <= d0 + horizon; d++) {
    const spans = hoursOf(verb, args, s, { ...e, now: instantIn(e.b, city, d, 43200) }, city, d);
    if (spans === null) return t;
    const wd = ((d % 7) + 7) % 7;
    const today = spans.filter(([mask]) => (mask & (1 << wd)) !== 0).sort((x, y) => x[1] - y[1]);
    for (const [, open, close] of today) {
      const from = d === d0 ? Math.max(s0, open) : open;
      const ok = rule === 'within' ? from + dur <= close : from < close;
      if (ok) return instantIn(e.b, city, d, from);
    }
  }
  return null;
}

/** Travel between venues within a city (RULES 5.1). */
export function travelSec(b: C07Bundle, from: Venue, to: Venue): number {
  if (from === to || from === 'train' || to === 'train') return 0;
  return from === 'station' || to === 'station' ? dv<number>(b, 'DV-C07-002') : dv<number>(b, 'DV-C07-003');
}

export interface FlowSlot { id: number; venue: Venue; travel: number; start: Instant; end: Instant; ok: boolean; reason: string | null }
export interface Flow { slots: FlowSlot[]; t: Instant; leaveAt: Instant; slack: number }

/** Lays out the planned slots in order from now (pure). */
export function computeFlow(s: C07State, e: Env, slots: readonly Slot[] = s.diary.slots): Flow {
  const leave = leaveAt(s, e.b);
  const sealed = sealedEnd(s);
  let t = Math.max(e.now, s.me.busyUntil);
  let at: Venue = s.me.where.k === 'city' ? s.me.where.venue : 'train';
  const city = s.me.where.k === 'city' ? s.me.where.city : null;
  const out: FlowSlot[] = [];
  for (const slot of slots) {
    if (slot.state !== 'planned') continue;
    const verb = slot.verb as VerbName;
    const venue = venueOf(verb, slot.args, s, e, at);
    const fail = (reason: string): void => { out.push({ id: slot.id, venue: venue ?? at, travel: 0, start: t, end: t, ok: false, reason }); };
    if (venue === null) { fail(s.me.where.k === 'aboard' ? 'Only rest and drafting a cable are possible aboard' : 'No such place here'); continue; }
    if (slot.city !== '*' && city === null && slot.city !== 'aboard') { fail('Planned in a city'); continue; }
    if (slot.city !== '*' && city !== null && slot.city !== city) { fail('Planned in another city'); continue; }
    const travel = travelSec(e.b, at, venue);
    let ready = t + travel;
    if (slot.notBefore !== null) ready = Math.max(ready, slot.notBefore);
    const dur = durOf(verb, slot.args, s, e.b);
    const start = city === null ? ready : nextWindow(s, e, verb, slot.args, city, ready, dur);
    if (start === null) { fail('Closed for the next seven days'); continue; }
    if (start > e.now + dv<number>(e.b, 'DV-C07-062') * 86400) { fail('More than seven days ahead'); continue; }
    const end = start + dur;
    if (end > leave) { out.push({ id: slot.id, venue, travel, start, end, ok: false, reason: 'Ends after the leave time' }); continue; }
    if (end > sealed) { out.push({ id: slot.id, venue, travel, start, end, ok: false, reason: 'Longer than the rest of the ride' }); continue; }
    out.push({ id: slot.id, venue, travel, start, end, ok: true, reason: null });
    t = end; at = venue;
  }
  return { slots: out, t, leaveAt: leave, slack: leave === Infinity ? Infinity : leave - t };
}

/** Applies the flow: times, venues and VerbStart events; slots that no longer fit fail with an interrupt. */
export function reflow(s: C07State, ctx: C): void {
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const f = computeFlow(s, e);
  for (const fs of f.slots) {
    const slot = s.diary.slots.find((x) => x.id === fs.id)!;
    if (slot.seq >= 0) ctx.cancel(slot.seq);
    slot.seq = -1;
    if (!fs.ok) {
      slot.state = 'failed';
      interrupt(s, ctx, 'verbFailed', { slot: slot.id, verb: slot.verb, reason: fs.reason });
      continue;
    }
    slot.venue = fs.venue; slot.travel = fs.travel; slot.start = fs.start; slot.end = fs.end;
    slot.seq = ctx.schedule(fs.start, PRIO_VERB_START, VERB_START, { slot: slot.id });
  }
}

/** Opens a stay in a city at a station (RULES 5.1: a ride ended other than at a made connection). */
export function openStay(s: C07State, now: Instant, city: string, station: string | null): void {
  s.me.where = { k: 'city', city, venue: 'station', station };
  s.diary.stayFrom = now;
  s.diary.inStay = true;
  s.diary.verifiedInStay = false;
}

/** Closes the stay at boarding: counts verbs and waiting, then clears finished slots. */
export function closeStay(s: C07State, b: C07Bundle, now: Instant): void {
  s.diary.verifiedInStay = false;
  if (s.me.where.k !== 'city' || !s.diary.inStay) return;
  s.diary.inStay = false;
  const from = s.diary.stayFrom;
  const done = s.diary.slots.filter((x) => x.state === 'done' && x.start >= from);
  const verbs = done.filter((x) => x.verb !== 'wait').length;
  const busy = done.filter((x) => x.verb !== 'wait').reduce((a, x) => a + (x.end - x.start) + x.travel, 0);
  const margin = dv<number>(b, 'DV-C07-001') + dv<number>(b, 'DV-C07-002');
  const waitSec = Math.max(0, now - from - busy - margin);
  s.stats.stays.push({ city: s.me.where.city, from, to: now, verbs, waitSec });
  s.me.cameFrom = s.me.where.city;
  s.diary.slots = s.diary.slots.filter((x) => x.state === 'planned' || x.state === 'running');
}

/** Today's local day in the player's city (or UTC day aboard). */
export function localDay(s: C07State, b: C07Bundle, now: Instant): number {
  return s.me.where.k === 'city' ? localIn(b, s.me.where.city, now).day : dayOf(now);
}
