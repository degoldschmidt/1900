/**
 * verbs (RULES.md 5.2; H07-1): one declaration per verb, read by the rules, by the previews and by
 * the forecast: venue, hours rule, duration, money, health and the records written (and when).
 * The VerbStart / VerbEnd handlers apply them. No draws in this module.
 */
import type { Ctx } from '#kit/sim/sim.ts';
import { money, type Money, type Currency } from '#kit/money/money.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, Rows } from './data.ts';
import { dv, jurOfCity, instIn, instOfJur, stationsOfCity, cmpStr } from './data.ts';
import type { C07State, Venue, Slot, VerbArgs, Tier } from './types.ts';
import { convertTo, restGain, payCash, type RestPlace } from './costs.ts';
import { type C, interrupt, reflow, leaveAt, nextWindow } from './diary.ts';
import { lodgeStart, drawCreditEnd, adjustHealth } from './ledger.ts';
import { collectMail, meetEnd } from './commissions.ts';
import { buyGuide, askPorter, checkBoard } from './knowledge.ts';

export type VerbName = 'drawCredit' | 'posteRestante' | 'meet' | 'cable' | 'buyGuide' | 'askPorter' | 'checkBoard' | 'lodge' | 'wait' | 'rest';
export const VERBS: readonly VerbName[] = ['drawCredit', 'posteRestante', 'meet', 'cable', 'buyGuide', 'askPorter', 'checkBoard', 'lodge', 'wait', 'rest'];
export const TIERS: readonly Tier[] = ['modest', 'middle', 'first'];

export interface Env { b: C07Bundle; params: Rows; now: Instant }
export type HoursRule = 'within' | 'start' | 'window' | 'none';
export type Span = [number, number, number];

export interface RecordSpec { kind: string; source: string; named: boolean; confidence: number; when: 'start' | 'end' }

const isAboard = (s: C07State): boolean => s.me.where.k === 'aboard';
export const cityNow = (s: C07State): string | null => (s.me.where.k === 'city' ? s.me.where.city : null);

/** The player's correspondent bank in a city, or null. */
export function correspondentIn(b: C07Bundle, s: C07State, city: string): string | null {
  return instIn(b, city, 'bank').map((i) => i.id).find((id) => s.ledger.correspondents.includes(id)) ?? null;
}

export const postIn = (b: C07Bundle, city: string): string | null => instIn(b, city, 'post')[0]?.id ?? null;
export const telegraphIn = (b: C07Bundle, city: string): string | null => instIn(b, city, 'telegraph')[0]?.id ?? null;
export const hasLodging = (params: Rows, city: string, day: number): boolean => params.get('lodging.price', `${city}|modest`, day) !== undefined;

/** The station a station verb happens at: the one named, the one the player stands at, or the city's first. */
export function stationFor(b: C07Bundle, s: C07State, city: string, args: VerbArgs): string | null {
  const list = stationsOfCity(b, city).sort(cmpStr);
  if (typeof args.station === 'string') return list.includes(args.station) ? args.station : null;
  if (s.me.where.k === 'city' && s.me.where.station && list.includes(s.me.where.station)) return s.me.where.station;
  return list[0] ?? null;
}

/** Venue a verb happens at (null: it cannot happen here). `at` is the venue the player will be at before it. */
export function venueOf(verb: VerbName, args: VerbArgs, s: C07State, e: Env, at: Venue): Venue | null {
  if (isAboard(s)) {
    if (verb === 'rest' || (verb === 'cable' && args.mode === 'draft')) return 'train';
    return null;
  }
  const city = cityNow(s)!;
  switch (verb) {
    case 'drawCredit': return correspondentIn(e.b, s, city) ? 'bank' : null;
    case 'posteRestante': return postIn(e.b, city) ? 'post' : null;
    case 'meet': return e.b.gameCities.includes(city) ? 'meeting' : null;
    case 'cable': return args.mode === 'draft' ? at : telegraphIn(e.b, city) ? 'telegraph' : null;
    case 'buyGuide': case 'askPorter': case 'checkBoard': return stationFor(e.b, s, city, args) ? 'station' : null;
    case 'lodge': return hasLodging(e.params, city, dayOf(e.now)) ? 'hotel' : null;
    case 'wait': return at;
    case 'rest': return s.me.lodged?.city === city ? 'hotel' : stationsOfCity(e.b, city).length ? 'station' : null;
  }
}

/** Base duration before the low-health penalty. */
export function baseDur(verb: VerbName, args: VerbArgs, s: C07State, b: C07Bundle): number {
  const d = dv<Record<string, number>>(b, 'DV-C07-005');
  switch (verb) {
    case 'drawCredit': return d.draw!;
    case 'posteRestante': return d.post!;
    case 'meet': return d.meet!;
    case 'cable': return args.mode === 'draft' ? d.compose! : s.knowledge.drafts > 0 ? d.handIn! : d.compose! + d.handIn!;
    case 'buyGuide': return d.guide!;
    case 'askPorter': return d.porter!;
    case 'checkBoard': return d.board!;
    case 'lodge': return d.lodge!;
    case 'wait': case 'rest': return Math.max(0, Math.floor(Number(args.sec ?? 0)));
  }
}

export function durOf(verb: VerbName, args: VerbArgs, s: C07State, b: C07Bundle): number {
  const low = dv<{ threshold: number; penalty: number }>(b, 'DV-C07-025');
  return Math.floor((baseDur(verb, args, s, b) * (1000 + (s.me.health < low.threshold ? low.penalty : 0))) / 1000);
}

export function hoursRule(verb: VerbName, args: VerbArgs): HoursRule {
  switch (verb) {
    case 'drawCredit': case 'posteRestante': return 'within';
    case 'meet': return 'window';
    case 'cable': return args.mode === 'send' ? 'start' : 'none';
    case 'buyGuide': case 'askPorter': return 'start';
    default: return 'none';
  }
}

/** Opening spans of the venue on a local day, as [mask, open, close] rows (null: always open). */
export function hoursOf(verb: VerbName, args: VerbArgs, s: C07State, e: Env, city: string, day: number): Span[] | null {
  const spans = (param: string, inst: string | null): Span[] => (inst ? e.params.get<{ days: Span[] }>(param, inst, day)?.days ?? [] : []);
  switch (verb) {
    case 'drawCredit': {
      const jur = jurOfCity(e.b, city);
      if (e.params.get('bank.closed', jur, day) !== undefined || e.params.get<{ closed?: boolean }>('bank.moratorium', jur, day)?.closed) return [];
      return spans('bank.hours', correspondentIn(e.b, s, city));
    }
    case 'posteRestante': return spans('post.hours', postIn(e.b, city));
    case 'cable': return args.mode === 'send' ? spans('telegraph.hours', telegraphIn(e.b, city)) : null;
    case 'buyGuide': case 'askPorter': { const h = dv<{ open: number; close: number }>(e.b, 'DV-C07-008'); return [[127, h.open, h.close]]; }
    default: return null;
  }
}

/** Destination jurisdiction of a cable. */
export function cableTo(s: C07State, e: Env, args: VerbArgs): string {
  if (args.purpose === 'enquire' && typeof args.trainKey === 'string') {
    const idx = e.b.tt.tripsByKey.get(args.trainKey)?.[0];
    const op = idx === undefined ? undefined : e.b.inst.get(e.b.tt.trips[idx]!.operator);
    if (op) return op.jurisdiction;
  }
  return s.legend.home;
}

export function cableCost(s: C07State, e: Env, city: string, args: VerbArgs): Money | null {
  const from = jurOfCity(e.b, city);
  const t = e.params.get<{ perWordMinor: number; cur: string; minWords: number }>('telegraph.tariff', `${from}>${cableTo(s, e, args)}`, dayOf(e.now));
  if (!t) return null;
  return money(t.cur as Currency, t.perWordMinor * Math.max(Math.floor(Number(args.words ?? 0)), t.minWords));
}

export function lodgingPrice(e: Env, city: string, tier: Tier): Money | null {
  const r = e.params.get<{ minMinor: number; maxMinor: number; cur: string }>('lodging.price', `${city}|${tier}`, dayOf(e.now));
  if (!r) return null;
  const point = dv<number>(e.b, 'DV-C07-059');
  return money(r.cur as Currency, r.minMinor + Math.floor(((r.maxMinor - r.minMinor) * point) / 1000));
}

export function guidePrice(e: Env, edition: string, city: string): Money | null {
  const r = e.params.get<{ minor: number; cur: string }>('guide.price', `${edition}@${jurOfCity(e.b, city)}`, dayOf(e.now));
  return r ? money(r.cur as Currency, r.minor) : null;
}

/** Money a verb costs (at start or end), in the currency charged. Lodging is charged at check-out (shown per night). */
export function verbMoney(verb: VerbName, args: VerbArgs, s: C07State, e: Env, city: string | null): Money[] {
  if (city === null) return [];
  switch (verb) {
    case 'drawCredit': {
      const amt = Math.floor(Number(args.amount ?? 0));
      const comm = dv<{ commission: number }>(e.b, 'DV-C07-011').commission;
      return [money(s.ledger.credit.cur, Math.floor((amt * comm) / 1000))];
    }
    case 'posteRestante': { const f = e.params.get<{ minor: number; cur: string }>('post.restanteFee', jurOfCity(e.b, city), dayOf(e.now)); return f ? [money(f.cur as Currency, f.minor)] : []; }
    case 'cable': { if (args.mode !== 'send') return []; const c = cableCost(s, e, city, args); return c ? [c] : []; }
    case 'buyGuide': { const p = typeof args.edition === 'string' ? guidePrice(e, args.edition, city) : null; return p ? [p] : []; }
    case 'askPorter': { const p = e.params.get<{ minor: number; cur: string }>('porter.tip', jurOfCity(e.b, city), dayOf(e.now)); return p ? [money(p.cur as Currency, p.minor)] : []; }
    case 'lodge': { const p = lodgingPrice(e, city, args.tier as Tier); return p ? [p] : []; }
    default: return [];
  }
}

/** Where a rest happens, for its gain. */
export function restPlace(s: C07State, venue: Venue): RestPlace {
  if (venue === 'hotel') return 'lodged';
  if (venue === 'train' && s.me.where.k === 'aboard') {
    const r = s.me.where.ride;
    return r.sleeper ? 'berth' : r.cls === 1 ? 'seat1' : r.cls === 2 ? 'seat2' : 'seat3';
  }
  return 'waitingRoom';
}

export function verbHealth(verb: VerbName, args: VerbArgs, s: C07State, b: C07Bundle, venue: Venue): number {
  return verb === 'rest' ? restGain(b, restPlace(s, venue), baseDur('rest', args, s, b)) : 0;
}

/** The registration authority for lodging in a city, if the regime requires a slip from this legend. */
export function slipAuthority(s: C07State, e: Env, city: string): string | null {
  const jur = jurOfCity(e.b, city);
  const r = e.params.get<{ hotelSlip: boolean; appliesTo: 'all' | 'aliens'; authority: string; byCity?: Record<string, string> }>('registration.regime', jur, dayOf(e.now));
  if (!r || !r.hotelSlip) return null;
  if (r.appliesTo === 'aliens' && s.legend.nationality === jur) return null;
  return r.byCity?.[city] ?? r.authority;
}

/** The records a verb writes (RULES 5.2), with when. */
export function verbRecords(verb: VerbName, args: VerbArgs, s: C07State, e: Env, city: string | null): RecordSpec[] {
  if (city === null) return [];
  const conf = dv<{ slip: number; witness: number }>(e.b, 'DV-C07-028');
  switch (verb) {
    case 'drawCredit': {
      const bank = correspondentIn(e.b, s, city);
      if (!bank) return [];
      const out: RecordSpec[] = [{ kind: 'bank.draw', source: bank, named: true, confidence: 1000, when: 'end' }];
      if (args.meetBill && s.ledger.bill && s.ledger.bill.bank === bank) out.push({ kind: 'bill.met', source: bank, named: true, confidence: 1000, when: 'end' });
      return out;
    }
    case 'posteRestante': { const p = postIn(e.b, city); return p ? [{ kind: 'post.collect', source: p, named: true, confidence: 1000, when: 'end' }] : []; }
    case 'meet': return [{ kind: 'meet.witness', source: `VENUE-${city}`, named: true, confidence: conf.witness, when: 'end' }];
    case 'cable': {
      if (args.mode !== 'send') return [];
      const adm = instOfJur(e.b, jurOfCity(e.b, city), 'telegraph');
      return adm ? [{ kind: 'cable.copy', source: adm.id, named: true, confidence: 1000, when: 'start' }] : [];
    }
    case 'lodge': { const a = slipAuthority(s, e, city); return a ? [{ kind: 'registration.slip', source: a, named: true, confidence: conf.slip, when: 'start' }] : []; }
    default: return [];
  }
}

/** Argument checks (venue and hours are checked by the diary). Returns an error or null. */
export function checkArgs(verb: VerbName, args: VerbArgs, s: C07State, e: Env, city: string | null): string | null {
  switch (verb) {
    case 'drawCredit': {
      const amt = Number(args.amount ?? 0);
      if (!Number.isSafeInteger(amt) || amt < 0 || (amt === 0 && !args.meetBill)) return 'Give an amount to draw';
      if (amt > s.ledger.credit.minor) return 'More than the credit left';
      if (args.meetBill) {
        const bill = s.ledger.bill;
        if (!bill || bill.met) return 'No bill to meet';
        if (city !== null && bill.bank !== correspondentIn(e.b, s, city)) return 'The bill is domiciled at another bank';
      }
      return null;
    }
    case 'meet': {
      const o = s.commissions.offers.find((x) => x.id === args.offer);
      if (!o) return 'No such commission';
      if (o.status !== 'held') return 'The commission is not held';
      const st = o.stages[Number(args.stage)];
      if (!st) return 'No such stage';
      if (st.done !== null) return 'Stage already done';
      if (Number(args.stage) > 0 && o.stages[Number(args.stage) - 1]!.done === null) return 'An earlier stage is not done';
      if (city !== null && st.city !== city) return 'The meeting is in another city';
      return null;
    }
    case 'cable': {
      if (args.mode !== 'draft' && args.mode !== 'send') return 'A cable is drafted or sent';
      if (!['enquire', 'funds', 'remit'].includes(String(args.purpose))) return 'Unknown cable purpose';
      const w = Number(args.words);
      if (!Number.isSafeInteger(w) || w < 1 || w > 200) return 'Words must be 1–200';
      if (args.purpose === 'enquire' && (typeof args.trainKey !== 'string' || !e.b.tt.tripsByKey.has(args.trainKey))) return 'Name the train to enquire about';
      if (args.purpose === 'enquire' && args.day !== undefined && !Number.isSafeInteger(args.day)) return 'Bad day';
      if (args.purpose === 'remit' && (!s.ledger.bill || s.ledger.bill.met)) return 'No bill to remit for';
      if (args.mode === 'send' && city !== null) {
        if (e.params.get('telegraph.private.suspended', `${jurOfCity(e.b, city)}>${cableTo(s, e, args)}`, dayOf(e.now))) return 'Private telegrams to there are suspended';
        if (!cableCost(s, e, city, args)) return 'No tariff to there';
      }
      return null;
    }
    case 'buyGuide': {
      const ed = e.b.edition.get(String(args.edition));
      if (!ed) return 'No such guide';
      if (city === null || !guidePrice(e, ed.id, city)) return 'Not sold here';
      if (dayOf(e.now) < ed.issueDay + dv<number>(e.b, 'DV-C07-013')) return 'Not on sale yet';
      if (s.knowledge.kg.editions.includes(ed.id)) return 'Already on the shelf';
      return null;
    }
    case 'askPorter': {
      const keys = args.trainKeys;
      if (!Array.isArray(keys) || keys.length < 1 || keys.length > 3 || keys.some((k) => typeof k !== 'string' || !e.b.tt.tripsByKey.has(k))) return 'Ask about one to three trains';
      return null;
    }
    case 'lodge': return TIERS.includes(args.tier as Tier) ? null : 'Choose modest, middle or first';
    case 'wait': case 'rest': {
      const sec = Number(args.sec);
      return Number.isSafeInteger(sec) && sec > 0 && sec <= 7 * 86400 ? null : 'Give a duration';
    }
    default: return null;
  }
}

export const isVerb = (v: unknown): v is VerbName => typeof v === 'string' && (VERBS as readonly string[]).includes(v);

/** Converts a credit draw (GBP) into local cash less the commission. */
export function drawYield(e: Env, s: C07State, city: string, amount: number): Money {
  const comm = dv<{ commission: number }>(e.b, 'DV-C07-011').commission;
  const gross = convertTo(money(s.ledger.credit.cur, amount), localCurrency(e, city), e.params, dayOf(e.now));
  return money(gross.cur, Math.floor((gross.minor * (1000 - comm)) / 1000));
}

/** A city's currency (from its lodging rows, else its jurisdiction's telegraph tariff). */
export function localCurrency(e: Env, city: string): Currency {
  const day = dayOf(e.now);
  const l = e.params.get<{ cur: string }>('lodging.price', `${city}|modest`, day);
  if (l) return l.cur as Currency;
  const jur = jurOfCity(e.b, city);
  for (const r of e.params.rowsFor('telegraph.tariff')) if (r.key.startsWith(`${jur}>`)) return (r.value as { cur: string }).cur as Currency;
  for (const r of e.params.rowsFor('porter.tip')) if (r.key === jur) return (r.value as { cur: string }).cur as Currency;
  throw new Error(`No currency for ${city}`);
}

// ------------------------------------------------------------------ VerbStart / VerbEnd

export const PRIO_VERB_END = 4;

function failSlot(s: C07State, ctx: C, slot: Slot, reason: string): void {
  slot.state = 'failed';
  interrupt(s, ctx, 'verbFailed', { slot: slot.id, verb: slot.verb, reason });
  reflow(s, ctx);
}

/** VerbStart: recheck place, hours and closures; pay what is paid at the counter; write start records. */
export function onVerbStart(s: C07State, p: { slot: number }, ctx: C): void {
  const slot = s.diary.slots.find((x) => x.id === p.slot);
  if (!slot || slot.state !== 'planned') return;
  slot.seq = -1;
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const verb = slot.verb as VerbName;
  const aboard = isAboard(s);
  const city = cityNow(s);
  if (slot.city !== '*' && (aboard ? slot.city !== 'aboard' : slot.city !== city)) { failSlot(s, ctx, slot, 'You are no longer there'); return; }
  const at = s.me.where.k === 'city' ? s.me.where.venue : 'train';
  const venue = venueOf(verb, slot.args, s, e, at);
  if (venue === null) { failSlot(s, ctx, slot, 'No such place here'); return; }
  const dur = durOf(verb, slot.args, s, ctx.bundle);
  if (city !== null) {
    const start = nextWindow(s, e, verb, slot.args, city, ctx.now, dur);
    if (start === null) { failSlot(s, ctx, slot, 'Closed'); return; }
    if (start > ctx.now) { reflow(s, ctx); return; }
  }
  if (ctx.now + dur > leaveAt(s, ctx.bundle)) { failSlot(s, ctx, slot, 'It would end after the leave time'); return; }
  const charges = verb === 'lodge' || verb === 'posteRestante' || verb === 'drawCredit' ? [] : verbMoney(verb, slot.args, s, e, city);
  for (const m of charges) {
    if (!payCash(ctx.bundle, s, m, ctx.params, ctx.now, verb)) { interrupt(s, ctx, 'cannotPay', { what: verb, amount: m }); failSlot(s, ctx, slot, 'Not enough cash'); return; }
  }
  if (verb === 'cable' && slot.args.mode === 'send') {
    if (s.knowledge.drafts > 0) { s.knowledge.drafts--; slot.args = { ...slot.args, usedDraft: true }; }
    const spec = verbRecords(verb, slot.args, s, e, city)[0];
    if (spec) ctx.emit({ kind: 'cable.copy', subject: s.legend.id, predicate: 'sent', value: { toJur: cableTo(s, e, slot.args), purpose: slot.args.purpose, words: slot.args.words },
      confidence: spec.confidence, source: spec.source, time: ctx.now, authorship: 'world', place: city! });
  }
  if (verb === 'lodge' && city !== null) lodgeStart(s, ctx, slot, city);
  slot.state = 'running';
  slot.start = ctx.now;
  slot.end = ctx.now + dur;
  slot.venue = venue;
  s.me.busyUntil = slot.end;
  if (s.me.where.k === 'city') {
    const station = venue === 'station' ? stationFor(ctx.bundle, s, s.me.where.city, slot.args) : s.me.where.station;
    s.me.where = { k: 'city', city: s.me.where.city, venue, station };
  }
  ctx.schedule(slot.end, PRIO_VERB_END, 'c07.VerbEnd', { slot: slot.id });
  ctx.trace('verbStart', { slot: slot.id, verb });
}

/** VerbEnd: the verb's effects and end records (RULES 5.2). */
export function onVerbEnd(s: C07State, p: { slot: number }, ctx: C): void {
  const slot = s.diary.slots.find((x) => x.id === p.slot);
  if (!slot || slot.state !== 'running') return;
  slot.state = 'done';
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const city = cityNow(s);
  const verb = slot.verb as VerbName;
  switch (verb) {
    case 'drawCredit': if (city) drawCreditEnd(s, ctx, slot, city); break;
    case 'posteRestante': {
      if (!city) break;
      for (const m of verbMoney(verb, slot.args, s, e, city)) payCash(ctx.bundle, s, m, ctx.params, ctx.now, 'Poste restante');
      const n = collectMail(s, ctx, city);
      const post = postIn(ctx.bundle, city)!;
      ctx.emit({ kind: 'post.collect', subject: s.legend.id, predicate: 'collected', value: { n }, confidence: 1000, source: post, time: ctx.now, authorship: 'world', place: city });
      break;
    }
    case 'meet': meetEnd(s, ctx, slot); break;
    case 'cable': {
      if (slot.args.mode === 'draft') { s.knowledge.drafts++; break; }
      if (slot.args.purpose === 'enquire') {
        const day = typeof slot.args.day === 'number' ? slot.args.day : dayOf(ctx.now);
        ctx.schedule(ctx.now + dv<number>(ctx.bundle, 'DV-C07-009'), 12, 'c07.CableReply', { slot: slot.id, trainKey: slot.args.trainKey, day });
        s.diary.verifiedInStay = true;
      } else {
        ctx.schedule(ctx.now + dv<{ lagSec: number }>(ctx.bundle, 'DV-C07-010').lagSec, 12, 'c07.Remittance', { slot: slot.id, purpose: slot.args.purpose });
      }
      break;
    }
    case 'buyGuide': if (city) { buyGuide(s, ctx.bundle, String(slot.args.edition), city, ctx.now); s.diary.verifiedInStay = true; } break;
    case 'askPorter': {
      if (!city) break;
      const station = stationFor(ctx.bundle, s, city, slot.args)!;
      const answers = askPorter(s, ctx.bundle, ctx.params, station, slot.args.trainKeys as string[], ctx.now);
      s.diary.verifiedInStay = true;
      ctx.trace('porter', answers);
      break;
    }
    case 'checkBoard': {
      if (!city) break;
      const station = stationFor(ctx.bundle, s, city, slot.args)!;
      checkBoard(s, ctx.bundle, ctx.params, ctx.seed, station, ctx.now);
      s.diary.verifiedInStay = true;
      break;
    }
    case 'rest': adjustHealth(s, ctx, verbHealth('rest', slot.args, s, ctx.bundle, slot.venue)); break;
    default: break;
  }
  ctx.trace('verbEnd', { slot: slot.id, verb });
  reflow(s, ctx);
}
