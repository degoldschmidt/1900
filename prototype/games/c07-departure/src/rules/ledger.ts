/**
 * ledger (RULES.md 5.7; H07-1): cash per currency, the letter of credit drawable at
 * correspondents in bank hours, lodging charged at check-out, rent, the bill and remittances.
 * Health lives here too (it is the third account the verbs spend).
 */
import { money, type Money } from '#kit/money/money.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle } from './data.ts';
import { dv, localIn, instantIn, jurOfCity, instIn, instOfJur, cmpStr } from './data.ts';
import type { C07State, Slot, Tier } from './types.ts';
import { payCash, convertTo, addCash } from './costs.ts';
import { type C, interrupt } from './diary.ts';
import { type Env, lodgingPrice, slipAuthority, drawYield, correspondentIn } from './verbs.ts';
import { endGame } from './endings.ts';

export const PRIO_LEDGER = { Remittance: 12, RentDue: 18, BillMaturity: 19 } as const;

// ------------------------------------------------------------------ health

/** Changes health (0–1000). Reaching 0 inserts the collapse rest and raises `collapse`. */
export function adjustHealth(s: C07State, ctx: C, delta: number): void {
  const before = s.me.health;
  s.me.health = Math.max(0, Math.min(1000, before + delta));
  if (s.me.health === 0 && before > 0) {
    const sec = dv<number>(ctx.bundle, 'DV-C07-026');
    const slot: Slot = { id: ++s.diary.nextId, verb: 'rest', args: { sec }, venue: 'street', notBefore: null, start: ctx.now, end: ctx.now, seq: -1, state: 'planned', travel: 0, city: '*' };
    const firstPlanned = s.diary.slots.findIndex((x) => x.state === 'planned');
    if (firstPlanned < 0) s.diary.slots.push(slot); else s.diary.slots.splice(firstPlanned, 0, slot);
    interrupt(s, ctx, 'collapse', { slot: slot.id });
  }
}

// ------------------------------------------------------------------ lodging

export function nightsBetween(b: C07Bundle, city: string, since: Instant, until: Instant): number {
  return Math.max(1, localIn(b, city, until).day - localIn(b, city, since).day);
}

/** The authority a hotel reports to in a city (for slips and complaints). */
export function hotelAuthority(s: C07State, e: Env, city: string): string {
  return slipAuthority(s, e, city) ?? instIn(e.b, city, 'police')[0]?.id ?? instOfJur(e.b, jurOfCity(e.b, city), 'police')?.id ?? `VENUE-${city}`;
}

/** Check-out: price × local midnights spanned (at least one). A shortfall is owed and reported. */
export function checkOut(s: C07State, ctx: C): void {
  const l = s.me.lodged;
  if (!l) return;
  s.me.lodged = null;
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const price = lodgingPrice(e, l.city, l.tier);
  if (!price) return;
  const due = money(price.cur, price.minor * nightsBetween(ctx.bundle, l.city, l.since, ctx.now));
  if (payCash(ctx.bundle, s, due, ctx.params, ctx.now, `Lodging (${l.tier})`)) return;
  s.ledger.unpaid.push(due);
  ctx.emit({ kind: 'hotel.complaint', subject: s.legend.id, predicate: 'unpaid', value: { amount: due },
    confidence: 1000, source: hotelAuthority(s, e, l.city), time: ctx.now, authorship: 'world', place: l.city });
  interrupt(s, ctx, 'cannotPay', { what: 'lodging', amount: due });
}

/** lodge, at its start: leave any current lodging, take the room, write the slip where required. */
export function lodgeStart(s: C07State, ctx: C, slot: Slot, city: string): void {
  checkOut(s, ctx);
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const tier = slot.args.tier as Tier;
  let slip: number | null = null;
  const auth = slipAuthority(s, e, city);
  if (auth) {
    slip = ctx.emit({ kind: 'registration.slip', subject: s.legend.id, predicate: 'lodged', value: { city, tier, fromCity: s.me.cameFrom },
      confidence: dv<{ slip: number }>(ctx.bundle, 'DV-C07-028').slip, source: auth, time: ctx.now, authorship: 'world', place: city }).id;
  }
  s.me.lodged = { city, tier, since: ctx.now, slip };
}

// ------------------------------------------------------------------ credit

export function drawCreditEnd(s: C07State, ctx: C, slot: Slot, city: string): void {
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const bank = correspondentIn(ctx.bundle, s, city)!;
  const amount = Math.floor(Number(slot.args.amount ?? 0));
  if (amount > 0) {
    const take = Math.min(amount, s.ledger.credit.minor);
    s.ledger.credit = money(s.ledger.credit.cur, s.ledger.credit.minor - take);
    const cash = drawYield(e, s, city, take);
    addCash(s, cash);
    s.ledger.entries.push({ at: ctx.now, what: 'Drawn on the letter of credit', amount: money(s.ledger.credit.cur, -take) });
    s.ledger.entries.push({ at: ctx.now, what: 'Cash from the bank', amount: cash });
    ctx.emit({ kind: 'bank.draw', subject: s.legend.id, predicate: 'drew', value: { amount: take, cur: s.ledger.credit.cur }, confidence: 1000, source: bank, time: ctx.now, authorship: 'world', place: city });
  }
  const bill = s.ledger.bill;
  if (slot.args.meetBill && bill && !bill.met && bill.bank === bank) {
    const cost = convertTo(bill.amount, s.ledger.credit.cur, ctx.params, dayOf(ctx.now));
    if (cost.minor <= s.ledger.credit.minor) {
      s.ledger.credit = money(s.ledger.credit.cur, s.ledger.credit.minor - cost.minor);
      bill.met = true;
      s.ledger.entries.push({ at: ctx.now, what: 'Bill met', amount: money(cost.cur, -cost.minor) });
      ctx.emit({ kind: 'bill.met', subject: s.legend.id, predicate: 'met', value: { amount: bill.amount }, confidence: 1000, source: bank, time: ctx.now, authorship: 'world', place: city });
    } else interrupt(s, ctx, 'cannotPay', { what: 'bill' });
  }
}

// ------------------------------------------------------------------ rent, bill, remittances

export function onRentDue(s: C07State, _p: unknown, ctx: C): void {
  const r = s.ledger.rent;
  if (!r) return;
  const due = convertTo(r.amount, s.ledger.credit.cur, ctx.params, dayOf(ctx.now));
  if (s.ledger.credit.minor >= due.minor) {
    s.ledger.credit = money(s.ledger.credit.cur, s.ledger.credit.minor - due.minor);
    s.ledger.entries.push({ at: ctx.now, what: 'Rent', amount: money(due.cur, -due.minor) });
    r.arrearsSince = null;
  } else {
    s.ledger.unpaid.push(r.amount);
    if (r.arrearsSince === null) r.arrearsSince = ctx.now;
    interrupt(s, ctx, 'cannotPay', { what: 'rent', amount: r.amount });
  }
  r.nextDue += r.everySec;
  ctx.schedule(r.nextDue, PRIO_LEDGER.RentDue, 'c07.RentDue', {});
}

/** The domicile bank's closing time on a local day (latest span), or null if it does not open. */
export function bankClose(b: C07Bundle, params: Env['params'], bank: string, day: number): Instant | null {
  const inst = b.inst.get(bank);
  if (!inst?.city) return null;
  if (params.get('bank.closed', inst.jurisdiction, day) !== undefined) return null;
  const spans = params.get<{ days: Array<[number, number, number]> }>('bank.hours', bank, day)?.days ?? [];
  const wd = ((day % 7) + 7) % 7;
  const close = spans.filter(([m]) => (m & (1 << wd)) !== 0).reduce((a, [, , c]) => Math.max(a, c), -1);
  return close < 0 ? null : instantIn(b, inst.city, day, close);
}

/** When the bill falls due: the bank's close on maturity + grace (the next opening day if closed). */
export function billDueAt(b: C07Bundle, params: Env['params'], bank: string, maturityDay: number): Instant {
  const grace = dv<number>(b, 'DV-C07-053');
  for (let d = maturityDay + grace; d <= maturityDay + grace + 2 * dv<number>(b, 'DV-C07-062'); d++) {
    const c = bankClose(b, params, bank, d);
    if (c !== null) return c;
  }
  throw new Error(`Bank ${bank} never opens after day ${maturityDay}`);
}

export function onBillMaturity(s: C07State, _p: unknown, ctx: C): void {
  const bill = s.ledger.bill;
  if (!bill || bill.met || bill.protested) return;
  const inst = ctx.bundle.inst.get(bill.bank)!;
  const mor = ctx.params.get<{ deferDays: number }>('bill.moratorium', inst.jurisdiction, dayOf(ctx.now));
  if (mor && mor.deferDays > 0) {
    bill.maturity = billDueAt(ctx.bundle, ctx.params, bill.bank, localIn(ctx.bundle, inst.city!, ctx.now).day + mor.deferDays);
    ctx.schedule(bill.maturity, PRIO_LEDGER.BillMaturity, 'c07.BillMaturity', {});
    return;
  }
  bill.protested = true;
  const court = instIn(ctx.bundle, inst.city!, 'court')[0]?.id ?? instOfJur(ctx.bundle, inst.jurisdiction, 'court')?.id ?? bill.bank;
  const rec = ctx.emit({ kind: 'bill.protest', subject: s.legend.id, predicate: 'protested', value: { amount: bill.amount }, confidence: 1000, source: court, time: ctx.now, authorship: 'world', place: inst.city! });
  s.world.news.push({ id: `protest:${rec.id}`, city: inst.city!, at: ctx.now });
  endGame(s, ctx, 'ruined', { event: 'bill.protest', recs: [rec.id], cordon: null });
}

export function onRemittance(s: C07State, p: { slot: number; purpose: 'funds' | 'remit' }, ctx: C): void {
  const cfg = dv<{ amount: Money; cap: Money }>(ctx.bundle, 'DV-C07-010');
  const room = cfg.cap.minor - s.ledger.remitted.minor;
  if (p.purpose === 'funds') {
    const amt = Math.max(0, Math.min(cfg.amount.minor, room));
    if (amt > 0) {
      s.ledger.credit = money(s.ledger.credit.cur, s.ledger.credit.minor + amt);
      s.ledger.remitted = money(s.ledger.remitted.cur, s.ledger.remitted.minor + amt);
      s.ledger.entries.push({ at: ctx.now, what: 'Remittance received', amount: money(s.ledger.credit.cur, amt) });
    }
    interrupt(s, ctx, 'remittance', { purpose: 'funds', amount: money(s.ledger.credit.cur, amt) });
    return;
  }
  const bill = s.ledger.bill;
  const need = bill ? convertTo(bill.amount, cfg.cap.cur, ctx.params, dayOf(ctx.now)).minor : 0;
  const ok = !!bill && !bill.met && !bill.protested && ctx.now <= bill.maturity && need <= room;
  if (ok) {
    bill.met = true;
    s.ledger.remitted = money(s.ledger.remitted.cur, s.ledger.remitted.minor + need);
    s.ledger.entries.push({ at: ctx.now, what: 'Bill met by remittance', amount: money(cfg.cap.cur, 0) });
  }
  interrupt(s, ctx, 'remittance', { purpose: 'remit', met: ok });
}

/** Sorted, merged cash (setup). */
export function normaliseCash(list: Money[]): Money[] {
  const out: Money[] = [];
  for (const m of list) { const c = out.find((x) => x.cur === m.cur); if (c) c.minor += m.minor; else out.push({ ...m }); }
  return out.filter((m) => m.minor !== 0).sort((x, y) => cmpStr(x.cur, y.cur));
}
