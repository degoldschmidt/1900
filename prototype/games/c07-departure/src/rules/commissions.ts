/**
 * commissions (RULES.md 5.6; H07-1, H07-2): the scenario's chain, daily errands and away offers
 * arriving by poste restante, exclusive by travel time; lapsed offers report a rival's outcome.
 */
import { money, type Money } from '#kit/money/money.ts';
import { cdfOf } from '#kit/rng/draw.ts';
import { truthView } from '#kit/timetable/expand.ts';
import { ProfileCache } from '#kit/timetable/profiles.ts';
import type { Instant } from '#kit/time/instant.ts';
import type { C07Bundle } from './data.ts';
import { dv, localIn, instantIn, stationsOfCity, cmpStr } from './data.ts';
import type { C07State, Offer, Slot } from './types.ts';
import { type C, interrupt } from './diary.ts';
import { convertTo, addCash } from './costs.ts';
import { localCurrency } from './verbs.ts';
import { checkEndings } from './endings.ts';

export const PRIO_COMM = { OfferBatch: 14, OfferLapse: 16, StageDeadline: 17 } as const;

const caches = new WeakMap<C07Bundle, ProfileCache>();
function profiles(b: C07Bundle): ProfileCache {
  let p = caches.get(b);
  if (!p) { p = new ProfileCache(b.tt, { horizonSec: dv<{ awayEa: number }>(b, 'DV-C07-070').awayEa }); caches.set(b, p); }
  return p;
}

/** Earliest arrival on the ground from a city to another, leaving no earlier than t (Infinity beyond DV-C07-070). */
export function eaTruth(b: C07Bundle, from: string, t: Instant, to: string): number {
  if (from === to) return t;
  const view = truthView(b.tt);
  const targets = stationsOfCity(b, to).map((s) => b.tt.st(s));
  let best = Infinity;
  for (const o of stationsOfCity(b, from)) best = Math.min(best, profiles(b).earliestAny(view, b.tt.st(o), t, targets));
  return best;
}

/** The first undone stage of a held offer (earliest close), or null. */
export function nextHeldStage(s: C07State): { offer: Offer; index: number } | null {
  let best: { offer: Offer; index: number } | null = null;
  for (const o of s.commissions.offers) {
    if (o.status !== 'held') continue;
    const i = o.stages.findIndex((st) => st.done === null);
    if (i < 0) continue;
    if (!best || o.stages[i]!.close < best.offer.stages[best.index]!.close) best = { offer: o, index: i };
  }
  return best;
}

function batchCity(s: C07State, b: C07Bundle): string | null {
  if (s.me.where.k === 'city') return b.gameCities.includes(s.me.where.city) ? s.me.where.city : null;
  const n = nextHeldStage(s);
  return n ? n.offer.stages[n.index]!.city : null;
}

export function scheduleNextBatch(s: C07State, ctx: C, city: string | null): void {
  const at = dv<number>(ctx.bundle, 'DV-C07-047');
  const base = city ?? s.me.cameFrom ?? ctx.bundle.gameCities[0]!;
  const day = localIn(ctx.bundle, base, ctx.now).day;
  let next = instantIn(ctx.bundle, base, day, at);
  if (next <= ctx.now) next = instantIn(ctx.bundle, base, day + 1, at);
  if (next <= s.endsAt) ctx.schedule(next, PRIO_COMM.OfferBatch, 'c07.OfferBatch', {});
}

const pickBetween = (ctx: C, range: { min: Money; max: Money }, purpose: string, ...ids: Array<string | number>): number =>
  range.min.minor + ctx.below(range.max.minor - range.min.minor + 1, purpose, ...ids);

export function onOfferBatch(s: C07State, _p: unknown, ctx: C): void {
  const b = ctx.bundle;
  const city = batchCity(s, b);
  if (city) {
    const day = localIn(b, city, ctx.now).day;
    const at = dv<number>(b, 'DV-C07-047');
    const n = ctx.pick(cdfOf(dv<number[]>(b, 'DV-C07-045')), 'errand-n', city, day);
    for (let i = 0; i < n; i++) {
      const eo = dv<{ after: number; step: number; steps: number }>(b, 'DV-C07-065');
      const open = instantIn(b, city, day, at + eo.after + eo.step * ctx.below(eo.steps, 'errand-open', city, day, i));
      const close = open + dv<number>(b, 'DV-C07-046');
      const gbp = pickBetween(ctx, dv<{ min: Money; max: Money }>(b, 'DV-C07-048'), 'errand-pay', city, day, i);
      const pay = convertTo(money('GBP', gbp), localCurrency({ b, params: ctx.params, now: ctx.now }, city), ctx.params, day);
      addOffer(s, ctx, { id: `E-${city}-${day}-${i}`, kind: 'errand', pay, revealed: false, rival: null, status: 'open', stages: [{ city, open, close, done: null }], post: city, arrivedAt: ctx.now });
    }
    if (ctx.chance(dv<number>(b, 'DV-C07-049'), 'away', city, day)) {
      const others = b.gameCities.filter((c) => c !== city).sort(cmpStr);
      const dest = others[ctx.below(others.length, 'away-dest', city, day)]!;
      const open = eaTruth(b, city, ctx.now + dv<number>(b, 'DV-C07-066'), dest);
      const close = open + dv<number>(b, 'DV-C07-050');
      const meet = dv<Record<string, number>>(b, 'DV-C07-005').meet!;
      const held = nextHeldStage(s);
      const feasible = Number.isFinite(open) && close <= s.endsAt;
      const exclusive = !held || eaTruth(b, dest, open + meet, held.offer.stages[held.index]!.city) > held.offer.stages[held.index]!.close;
      if (feasible && exclusive) {
        const pay = money('GBP', pickBetween(ctx, dv<{ min: Money; max: Money }>(b, 'DV-C07-061'), 'away-pay', city, day));
        addOffer(s, ctx, { id: `A-${city}-${day}`, kind: 'away', pay, revealed: false, rival: null, status: 'open', stages: [{ city: dest, open, close, done: null }], post: city, arrivedAt: ctx.now });
      }
    }
  }
  scheduleNextBatch(s, ctx, city);
}

function addOffer(s: C07State, ctx: C, o: Offer): void {
  if (s.commissions.offers.some((x) => x.id === o.id)) return;
  s.commissions.offers.push(o);
  const last = o.stages[o.stages.length - 1]!.close;
  if (last >= ctx.now) ctx.schedule(last, PRIO_COMM.OfferLapse, 'c07.OfferLapse', { offer: o.id });
}

/** Setup offers (the scenario's chain) are held from the start. */
export function setupOffer(s: C07State, ctx: C, o: Offer): void {
  s.commissions.offers.push(o);
  o.stages.forEach((st, i) => { if (st.close >= ctx.now) ctx.schedule(st.close, PRIO_COMM.StageDeadline, 'c07.StageDeadline', { offer: o.id, stage: i }); });
}

/** posteRestante: reveals the letters held at this city's post office. */
export function collectMail(s: C07State, ctx: C, city: string): number {
  let n = 0;
  for (const o of s.commissions.offers) if (!o.revealed && o.post === city && o.arrivedAt <= ctx.now) { o.revealed = true; n++; }
  if (n > 0) interrupt(s, ctx, 'offer', { city, n });
  return n;
}

export function checkAccept(s: C07State, b: C07Bundle, now: Instant, offerId: string): string | null {
  const o = s.commissions.offers.find((x) => x.id === offerId);
  if (!o) return 'No such offer';
  if (!o.revealed) return 'You have not collected that letter';
  if (o.status !== 'open') return 'The offer is no longer open';
  if (s.commissions.offers.filter((x) => x.status === 'held').length >= dv<number>(b, 'DV-C07-044')) return 'You already hold as many commissions as you can';
  if (o.stages[0]!.close <= now) return 'Its first meeting has closed';
  return null;
}

export function applyAccept(s: C07State, ctx: C, offerId: string): void {
  const o = s.commissions.offers.find((x) => x.id === offerId)!;
  o.status = 'held';
  o.stages.forEach((st, i) => { if (st.close >= ctx.now) ctx.schedule(st.close, PRIO_COMM.StageDeadline, 'c07.StageDeadline', { offer: o.id, stage: i }); });
  ctx.trace('accept', { offer: o.id });
}

/** meet, at its end: the stage is done; the last stage pays (credit for chain and away, cash for errands). */
export function meetEnd(s: C07State, ctx: C, slot: Slot): void {
  const o = s.commissions.offers.find((x) => x.id === slot.args.offer);
  if (!o || o.status !== 'held') return;
  const st = o.stages[Number(slot.args.stage)];
  if (!st || st.done !== null || ctx.now > st.close) return;
  st.done = ctx.now;
  ctx.emit({ kind: 'meet.witness', subject: s.legend.id, predicate: 'met', value: { city: st.city }, confidence: dv<{ witness: number }>(ctx.bundle, 'DV-C07-028').witness,
    source: `VENUE-${st.city}`, time: ctx.now, authorship: 'world', place: st.city });
  ctx.trace('stage', { offer: o.id, stage: Number(slot.args.stage) });
  if (o.stages.every((x) => x.done !== null)) {
    o.status = 'done';
    if (o.kind === 'errand') addCash(s, o.pay);
    else {
      const pay = convertTo(o.pay, s.ledger.credit.cur, ctx.params, Math.floor(ctx.now / 86400));
      s.ledger.credit = money(s.ledger.credit.cur, s.ledger.credit.minor + pay.minor);
    }
    s.ledger.entries.push({ at: ctx.now, what: `Commission ${o.id} paid`, amount: o.pay });
  }
  checkEndings(s, ctx);
}

export function onStageDeadline(s: C07State, p: { offer: string; stage: number }, ctx: C): void {
  const o = s.commissions.offers.find((x) => x.id === p.offer);
  if (!o || o.status !== 'held' || o.stages[p.stage]!.done !== null) return;
  o.status = 'failed';
  interrupt(s, ctx, 'lapsed', { offer: o.id, failed: true, stage: p.stage });
  checkEndings(s, ctx);
}

export function onOfferLapse(s: C07State, p: { offer: string }, ctx: C): void {
  const o = s.commissions.offers.find((x) => x.id === p.offer);
  if (!o || o.status !== 'open') return;
  o.status = 'lapsed';
  o.rival = ctx.chance(dv<number>(ctx.bundle, 'DV-C07-051'), 'rival', o.id);
  if (o.revealed) interrupt(s, ctx, 'lapsed', { offer: o.id, rival: o.rival });
  else ctx.trace('lapsedUnseen', { offer: o.id, rival: o.rival });
}
