/**
 * costs (RULES.md 5.3; H07-1, H07-2): fares, paying across currencies, ride health and the trace
 * an action writes. `costOf` serves both the previews the player sees and the charges the rules
 * make, so they agree whenever the same rows apply.
 */
import { money, convert, type Money, type Currency, type Parity } from '#kit/money/money.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import { toLocal } from '#kit/time/zones.ts';
import type { C07Bundle, Rows } from './data.ts';
import { dv, cmpStr } from './data.ts';
import type { C07State, Cls } from './types.ts';

// ------------------------------------------------------------------ fares

const fareIndex = new WeakMap<C07Bundle, Map<string, { amount: Money; cite: number }>>();
function fares(b: C07Bundle): Map<string, { amount: Money; cite: number }> {
  let m = fareIndex.get(b);
  if (!m) {
    m = new Map();
    for (const f of b.raw.fares) {
      const k = `${f.edition}|${f.from}|${f.to}|${f.cls}`;
      if (!m.has(k) && !f.ret) m.set(k, { amount: money(f.currency as Currency, f.amountMinor), cite: f.cite });
    }
    fareIndex.set(b, m);
  }
  return m;
}

export interface Fare { amount: Money; design: boolean; cite: number | null }

/** Scheduled seconds of a trip between two stations on a service day. */
export function schedSec(b: C07Bundle, trip: number, from: string, to: string, day: number): number {
  const tt = b.tt; const t = tt.trips[trip]!;
  let dep: number | null = null; let arr: number | null = null;
  const fs = tt.st(from); const ts = tt.st(to);
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
    if (dep === null && tt.stopStation[j] === fs) dep = tt.depAt(j, day);
    else if (dep !== null && tt.stopStation[j] === ts) { arr = tt.arrAt(j, day); break; }
  }
  return dep !== null && arr !== null ? arr - dep : 0;
}

/** The fare of one leg in a class (or 'sleeper'), from the trip edition's fare table, else the design fare. */
export function fareOf(b: C07Bundle, trip: number, from: string, to: string, cls: Cls | 'sleeper', day: number): Fare {
  const t = b.tt.trips[trip]!;
  const hit = fares(b).get(`${t.edition}|${from}|${to}|${cls}`);
  if (hit) return { amount: hit.amount, design: false, cite: hit.cite };
  const perHour = dv<Record<string, number>>(b, 'DV-C07-017')[String(cls)]!;
  return { amount: money('GBP', Math.floor((perHour * schedSec(b, trip, from, to, day)) / 3600)), design: true, cite: null };
}

// ------------------------------------------------------------------ money

/** Exchange rate from one currency to another, through the GBP parities. */
export function parityOf(params: Rows, day: number, from: Currency, to: Currency): Parity {
  if (from === to) return { from, to, num: 1, den: 1 };
  const gbp = (c: Currency): { num: number; den: number } => {
    if (c === 'GBP') return { num: 1, den: 1 };
    const p = params.get<{ num: number; den: number }>('fx.parity', `GBP>${c}`, day);
    if (!p) throw new Error(`No parity GBP>${c}`);
    return p;
  };
  const a = gbp(from); const z = gbp(to);
  // to per from = (to per GBP) / (from per GBP)
  return { from, to, num: z.num * a.den, den: z.den * a.num };
}

export function convertTo(m: Money, to: Currency, params: Rows, day: number): Money {
  return convert(m, parityOf(params, day, m.cur, to));
}

export const cashOf = (s: Pick<C07State, 'ledger'>, cur: Currency): number => s.ledger.cash.find((c) => c.cur === cur)?.minor ?? 0;

export function addCash(s: Pick<C07State, 'ledger'>, m: Money): void {
  const c = s.ledger.cash.find((x) => x.cur === m.cur);
  if (c) c.minor += m.minor; else s.ledger.cash.push({ cur: m.cur, minor: m.minor });
  s.ledger.cash = s.ledger.cash.filter((x) => x.minor !== 0).sort((x, y) => cmpStr(x.cur, y.cur));
}

/** Other cash in DV-C07-012 order: listed currencies first, the rest by code. */
export function changeOrder(b: C07Bundle, s: Pick<C07State, 'ledger'>, except: Currency): Currency[] {
  const listed = dv<string[]>(b, 'DV-C07-012');
  const held = s.ledger.cash.filter((c) => c.minor > 0 && c.cur !== except).map((c) => c.cur);
  const rank = (c: string): number => { const i = listed.indexOf(c); return i < 0 ? listed.length : i; };
  return held.sort((x, y) => rank(x) - rank(y) || cmpStr(x, y));
}

/** What changing `y` minor units of Y yields in X, after the change spread. */
const yieldOf = (y: number, from: Currency, to: Currency, params: Rows, day: number, spread: number): number =>
  Math.floor((convert(money(from, y), parityOf(params, day, from, to)).minor * (1000 - spread)) / 1000);

export interface Payment { debits: Money[]; short: boolean }

/** Plans paying `amount` from cash (RULES 5.3): cash in its currency first, then other cash by change. */
export function planPayment(b: C07Bundle, s: Pick<C07State, 'ledger'>, amount: Money, params: Rows, day: number): Payment {
  const spread = dv<{ spread: number }>(b, 'DV-C07-011').spread;
  const debits: Money[] = [];
  let need = amount.minor;
  const own = Math.min(cashOf(s, amount.cur), need);
  if (own > 0) { debits.push(money(amount.cur, own)); need -= own; }
  for (const cur of changeOrder(b, s, amount.cur)) {
    if (need <= 0) break;
    const have = cashOf(s, cur);
    const whole = yieldOf(have, cur, amount.cur, params, day, spread);
    if (whole <= need) { if (have > 0) debits.push(money(cur, have)); need -= whole; continue; }
    // Smallest y with yield(y) ≥ need.
    let y = convert(money(amount.cur, Math.ceil((need * 1000) / (1000 - spread))), parityOf(params, day, amount.cur, cur)).minor;
    y = Math.min(Math.max(y, 0), have);
    while (y < have && yieldOf(y, cur, amount.cur, params, day, spread) < need) y++;
    while (y > 0 && yieldOf(y - 1, cur, amount.cur, params, day, spread) >= need) y--;
    debits.push(money(cur, y));
    need = 0;
  }
  return { debits, short: need > 0 };
}

/** Pays from cash if possible; returns false (and changes nothing) when cash falls short. */
export function payCash(b: C07Bundle, s: C07State, amount: Money, params: Rows, now: Instant, what: string): boolean {
  if (amount.minor <= 0) return true;
  const plan = planPayment(b, s, amount, params, dayOf(now));
  if (plan.short) return false;
  for (const d of plan.debits) {
    addCash(s, money(d.cur, -d.minor));
    s.ledger.entries.push({ at: now, what, amount: money(d.cur, -d.minor) });
  }
  return true;
}

// ------------------------------------------------------------------ health

/** Seconds of [t0, t1) falling at night (DV-C07-068, local at the given offset; `from` after `to`). */
export function nightSeconds(t0: Instant, t1: Instant, offset: number, night: { from: number; to: number }): number {
  let n = 0;
  for (let t = t0; t < t1;) {
    const { sec } = toLocal(t, offset);
    const isNight = sec >= night.from || sec < night.to;
    const boundary = sec < night.to ? night.to - sec : sec < night.from ? night.from - sec : 86400 - sec;
    const step = Math.min(boundary, t1 - t);
    if (isNight) n += step;
    t += step;
  }
  return n;
}

/** Health spent riding [t0, t1) in a class or berth (‰, a negative change). */
export function rideHealth(b: C07Bundle, cls: Cls, berth: boolean, t0: Instant, t1: Instant, offset: number): number {
  const rates = dv<Record<string, number>>(b, 'DV-C07-023');
  const perHour = berth ? rates.sleeper! : rates[String(cls)]!;
  const night = nightSeconds(t0, t1, offset, dv<{ from: number; to: number }>(b, 'DV-C07-068'));
  const day = t1 - t0 - night;
  return -(Math.floor((perHour * day) / 3600) + Math.floor((perHour * 2 * night) / 3600));
}

export type RestPlace = 'lodged' | 'berth' | 'seat1' | 'seat2' | 'seat3' | 'waitingRoom';

export function restGain(b: C07Bundle, place: RestPlace, sec: number): number {
  return Math.floor((dv<Record<string, number>>(b, 'DV-C07-024')[place]! * sec) / 3600);
}

// ------------------------------------------------------------------ trace

export interface Reach { reader: string; minSec: number; maxSec: number }
export interface TraceItem { kind: string; source: string; named: boolean; confidence: number; reach: Reach[] }

/** Σ confidence / 100 over named items that someone can read. */
export function traceScore(items: readonly TraceItem[]): number {
  return Math.floor(items.filter((i) => i.named && i.reach.length > 0).reduce((a, i) => a + i.confidence, 0) / 100);
}

export interface Cost { money: Money[]; sec: number; health: number; trace: TraceItem[]; designFare: boolean }

export const sumMoney = (list: readonly Money[]): Money[] => {
  const out: Money[] = [];
  for (const m of list) {
    const c = out.find((x) => x.cur === m.cur);
    if (c) c.minor += m.minor; else out.push({ cur: m.cur, minor: m.minor });
  }
  return out.sort((x, y) => cmpStr(x.cur, y.cur));
};

// ------------------------------------------------------------------ costOf: one function for previews and charges

import type { PlannedLeg, Venue, VerbArgs } from './types.ts';
import { reachOf } from './forecast.ts';
import { cityOfStation, cityOffset } from './data.ts';
import { type Env, type VerbName, verbMoney, verbHealth, verbRecords, durOf, venueOf, cityNow } from './verbs.ts';

export type CostAction =
  | { type: 'book'; legs: readonly PlannedLeg[]; cls: Cls; sleeper: boolean }
  | { type: 'planVerb'; verb: VerbName; args: VerbArgs };

const CUSTOMS_OR_PASSPORT = 3;

/** Records a ride writes: the anonymous ticket, a berth, and what each frontier hall on the way writes. */
function rideTrace(b: C07Bundle, params: Rows, s: Pick<C07State, 'legend'>, legs: readonly PlannedLeg[], cls: Cls, sleeper: boolean): TraceItem[] {
  const tt = b.tt;
  const conf = dv<{ ticket: Record<string, number>; sleeper: number; customs: number }>(b, 'DV-C07-028');
  const out: TraceItem[] = [];
  for (const l of legs) {
    const trip = tt.trip(l.tripId); const t = tt.trips[trip]!;
    out.push({ kind: 'ticket.sale', source: t.operator, named: false, confidence: conf.ticket[String(cls)]!, reach: reachOf(b, params, 'ticket.sale', t.operator, l.dep) });
    if (sleeper && t.sleeper) out.push({ kind: 'berth.reservation', source: t.operator, named: true, confidence: conf.sleeper, reach: reachOf(b, params, 'berth.reservation', t.operator, l.dep) });
    let a = -1;
    for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
      const st = tt.stationIds[tt.stopStation[j]!]!;
      if (a < 0) { if (st === l.from) a = j; continue; }
      if ((tt.stopFlags[j]! & CUSTOMS_OR_PASSPORT) !== 0) {
        const prev = tt.stationIds[tt.stopStation[j - 1]!]!;
        const at = tt.arrAt(j, l.day)!;
        const papers = params.get<{ recordsName: boolean; inspector: string; customs: string }>('frontier.papers', `${prev}>${st}`, dayOf(at));
        if (papers?.recordsName) out.push({ kind: 'frontier.passport', source: papers.inspector, named: true, confidence: 1000, reach: reachOf(b, params, 'frontier.passport', papers.inspector, at) });
        if (papers) out.push({ kind: 'frontier.customs', source: papers.customs, named: false, confidence: conf.customs, reach: reachOf(b, params, 'frontier.customs', papers.customs, at) });
      }
      if (st === l.to) break;
    }
  }
  void s;
  return out;
}

/**
 * The cost vector of an action (RULES 5.3): money in the currencies charged, seconds, health and
 * the trace it writes with forecast reach. Previews call it with the public rows; the same rows
 * give the same answer as the charge.
 */
export function costOf(action: CostAction, s: C07State, e: Env): Cost {
  const b = e.b;
  if (action.type === 'book') {
    const tt = b.tt;
    const money: Money[] = []; let health = 0; let design = false;
    for (const l of action.legs) {
      const trip = tt.trip(l.tripId); const t = tt.trips[trip]!;
      const f = fareOf(b, trip, l.from, l.to, action.cls, l.day); money.push(f.amount); design ||= f.design;
      if (action.sleeper && t.sleeper) { const sf = fareOf(b, trip, l.from, l.to, 'sleeper', l.day); money.push(sf.amount); design ||= sf.design; }
      const off = cityOffset(b, cityOfStation(b, l.from), dayOf(l.dep));
      health += rideHealth(b, action.cls, action.sleeper && t.sleeper, l.dep, l.arr, off);
    }
    const first = action.legs[0]!; const last = action.legs[action.legs.length - 1]!;
    return { money: sumMoney(money), sec: last.arr - first.dep, health, trace: rideTrace(b, e.params, s, action.legs, action.cls, action.sleeper), designFare: design };
  }
  const city = cityNow(s);
  const at: Venue = s.me.where.k === 'city' ? s.me.where.venue : 'train';
  const venue = venueOf(action.verb, action.args, s, e, at) ?? at;
  const trace = verbRecords(action.verb, action.args, s, e, city).map((r) => ({
    kind: r.kind, source: r.source, named: r.named, confidence: r.confidence,
    reach: r.source.startsWith('VENUE-') ? [] : reachOf(b, e.params, r.kind, r.source, e.now),
  }));
  return { money: sumMoney(verbMoney(action.verb, action.args, s, e, city)), sec: durOf(action.verb, action.args, s, b), health: verbHealth(action.verb, action.args, s, b, venue), trace, designFare: false };
}
