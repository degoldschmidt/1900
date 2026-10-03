/**
 * travel (RULES.md 5.4; H07-2, H07-4): booking, boarding, the shared per-train delay,
 * connections, the frontier hall and the sealed leg.
 *
 * The delay is one keyed draw per (train, service day), so every passenger of a train shares it,
 * the hunter's watchers included. It grows linearly along the run; no train leaves early.
 */
import { pickCdf, cdfOf, belowN } from '#kit/rng/draw.ts';
import { money } from '#kit/money/money.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, Rows } from './data.ts';
import { dv, cityOfStation, stationsOfCity, localIn, instantIn, cityOffset } from './data.ts';
import type { C07State, Cls, PlannedLeg, Booking, Ride } from './types.ts';
import { categoryOf, delayCdf, itineraryForecast, changeSec, throughLinked } from './forecast.ts';
import { fareOf, payCash, rideHealth } from './costs.ts';
import { type C, interrupt, reflow, computeFlow, openStay, closeStay } from './diary.ts';
import type { Env } from './verbs.ts';
import { plannerView, checkGhost, learnGhost } from './knowledge.ts';
import { detect } from './hunt.ts';
import { checkOut, adjustHealth } from './ledger.ts';
import { revealNews } from './world.ts';

export const PRIO = { RideArrive: 2, FrontierHall: 3, AtStation: 7, Board: 8 } as const;
const CUSTOMS = 1; const PASSPORT = 2;

// ------------------------------------------------------------------ delays

/** The train's whole-run delay on a service day (RULES 5.4 delayOf). */
export function delayOf(b: C07Bundle, params: Rows, seed: number, trip: number, day: number): number {
  const t = b.tt.trips[trip]!;
  const row = delayCdf(params, categoryOf(t), day);
  const i = pickCdf(cdfOf(row.w), seed, 'delay', t.trainKey, day);
  const lo = row.edges[i]!; const hi = row.edges[i + 1]!;
  return lo + (hi > lo ? belowN(hi - lo, seed, 'delay-in', t.trainKey, day) : 0);
}

/** Delay at absolute stop j: floor(delay × (sched(j) − sched(first)) / (sched(last) − sched(first))). */
export function delayAt(b: C07Bundle, params: Rows, seed: number, trip: number, day: number, j: number): number {
  const tt = b.tt; const t = tt.trips[trip]!;
  const first = tt.depAt(t.firstStop, day)!;
  const last = tt.arrAt(t.firstStop + t.nStops - 1, day)!;
  const at = j === t.firstStop ? first : tt.arrAt(j, day)!;
  if (last <= first) return 0;
  return Math.floor((delayOf(b, params, seed, trip, day) * (at - first)) / (last - first));
}

export function stopOf(b: C07Bundle, trip: number, station: string, after = -1): number | null {
  const tt = b.tt; const t = tt.trips[trip]!; const st = tt.st(station);
  for (let j = Math.max(t.firstStop, after + 1); j < t.firstStop + t.nStops; j++) if (tt.stopStation[j] === st) return j;
  return null;
}

export function delayAtStop(b: C07Bundle, params: Rows, seed: number, trip: number, day: number, station: string): number {
  const j = stopOf(b, trip, station);
  return j === null ? 0 : delayAt(b, params, seed, trip, day, j);
}

export function actualDep(b: C07Bundle, params: Rows, seed: number, trip: number, day: number, j: number): Instant {
  const t = b.tt.trips[trip]!;
  return b.tt.depAt(j, day)! + (j === t.firstStop ? 0 : delayAt(b, params, seed, trip, day, j));
}

export function actualArr(b: C07Bundle, params: Rows, seed: number, trip: number, day: number, j: number): Instant {
  return b.tt.arrAt(j, day)! + delayAt(b, params, seed, trip, day, j);
}

// ------------------------------------------------------------------ booking

export interface BookCmd { type: 'book'; legs: Array<{ tripId: string; day: number; from: string; to: string }>; cls: Cls; sleeper: boolean; dropSlots?: boolean }

export interface BookCheck { error: string | null; legs: PlannedLeg[]; drop: number[]; odds: number; minSlackSec: number; changes: Array<{ station: string; slackSec: number; odds: number }> }

const publicCache = new WeakMap<object, Rows>();
/** The public view of a parameter layer (cached per layer). */
export function publicOf(params: Rows & { publicView?: () => Rows }): Rows {
  if (!params.publicView) return params;
  let p = publicCache.get(params);
  if (!p) { p = params.publicView(); publicCache.set(params, p); }
  return p;
}

/** Validates a booking against the planner view (pure); `pub` are the public rows for the odds. */
export function checkBook(s: C07State, e: Env, pub: Rows, cmd: BookCmd): BookCheck {
  const fail = (error: string): BookCheck => ({ error, legs: [], drop: [], odds: 0, minSlackSec: 0, changes: [] });
  const b = e.b; const tt = b.tt;
  if (!Array.isArray(cmd.legs) || cmd.legs.length < 1 || cmd.legs.length > 4) return fail('A booking has one to four legs');
  if (![1, 2, 3].includes(cmd.cls)) return fail('Choose class 1, 2 or 3');
  if (typeof cmd.sleeper !== 'boolean') return fail('Say whether a berth is wanted');
  const view = plannerView(b, e.params, s);
  const legs: PlannedLeg[] = [];
  for (const [i, l] of cmd.legs.entries()) {
    const ti = tt.tripIndex.get(l.tripId);
    if (ti === undefined) return fail(`Leg ${i + 1}: no such train`);
    if (!Number.isSafeInteger(l.day) || !view.uses(ti, l.day)) return fail(`Leg ${i + 1}: not a train you know of on that day`);
    const t = tt.trips[ti]!;
    if (!tt.stationIndex.has(l.from) || !tt.stationIndex.has(l.to)) return fail(`Leg ${i + 1}: unknown station`);
    const a = stopOf(b, ti, l.from);
    if (a === null || tt.stopDep[a]! < 0) return fail(`Leg ${i + 1}: the train does not leave from there`);
    const z = stopOf(b, ti, l.to, a);
    if (z === null) return fail(`Leg ${i + 1}: the train does not call there afterwards`);
    if ((t.classMask & (1 << (cmd.cls - 1))) === 0) return fail(`Leg ${i + 1}: no class ${cmd.cls} on this train`);
    legs.push({ tripId: t.id, trainKey: t.trainKey, day: l.day, from: l.from, to: l.to, dep: tt.depAt(a, l.day)!, arr: tt.arrAt(z, l.day)! });
  }
  if (cmd.sleeper && !legs.some((l) => tt.trips[tt.trip(l.tripId)]!.sleeper)) return fail('No sleeping car on these trains');
  for (let i = 0; i + 1 < legs.length; i++) {
    const p = legs[i]!; const n = legs[i + 1]!;
    const ch = changeSec(b, p.to, n.from);
    if (ch === null) return fail(`Leg ${i + 2} does not leave from where leg ${i + 1} arrives`);
    const through = p.to === n.from && throughLinked(b, tt.trip(p.tripId), tt.trip(n.tripId), p.to);
    if (!through && n.dep - p.arr < ch) return fail(`The change at leg ${i + 2} is shorter than the minimum change`);
    if (through && n.dep < p.arr) return fail(`Leg ${i + 2} leaves before leg ${i + 1} arrives`);
  }
  const first = legs[0]!;
  const margin = dv<number>(b, 'DV-C07-001'); const toStation = dv<number>(b, 'DV-C07-002');
  if (s.me.where.k === 'city') {
    if (!stationsOfCity(b, s.me.where.city).includes(first.from)) return fail('The first train leaves from another city');
    if (first.dep < e.now + toStation + margin) return fail('Too late to reach the platform for that train');
    if (s.me.busyUntil > first.dep - toStation - margin) return fail('You are still busy when you would have to leave');
  } else {
    const r = s.me.where.ride;
    const ch = changeSec(b, r.to, first.from);
    if (ch === null) return fail('The first train does not leave from where this ride arrives');
    if (first.dep < r.schedArr + ch) return fail('The first train leaves before you could change into it');
  }
  // Planned slots must end by the new leave time, or be dropped.
  const trial = { ...s, diary: { ...s.diary, booking: { id: -1, legs, cls: cmd.cls, sleeper: cmd.sleeper, madeAt: e.now, minSlackSec: 0, missOdds: 0, atStationSeq: null, next: 0 } } };
  const flow = computeFlow(trial, e);
  const late = flow.slots.filter((f) => !f.ok && f.reason === 'Ends after the leave time').map((f) => f.id);
  if (late.length && !cmd.dropSlots) return fail('Planned acts end after the leave time (drop them or book later)');
  const fc = itineraryForecast(b, pub, legs.map((l) => ({ trip: tt.trip(l.tripId), day: l.day, from: l.from, to: l.to })));
  return { error: null, legs, drop: late, odds: fc.odds, minSlackSec: fc.minSlackSec, changes: fc.changes };
}

export function applyBook(s: C07State, ctx: C, cmd: BookCmd): void {
  const e: Env = { b: ctx.bundle, params: ctx.params, now: ctx.now };
  const chk = checkBook(s, e, publicOf(ctx.params), cmd);
  if (chk.error) throw new Error(chk.error);
  const old = s.diary.booking;
  if (old?.atStationSeq !== null && old?.atStationSeq !== undefined) ctx.cancel(old.atStationSeq);
  s.diary.slots = s.diary.slots.filter((x) => !chk.drop.includes(x.id));
  const id = ++s.diary.nextBooking;
  const bk: Booking = { id, legs: chk.legs, cls: cmd.cls, sleeper: cmd.sleeper, madeAt: ctx.now, minSlackSec: chk.minSlackSec, missOdds: chk.odds, atStationSeq: null, next: 0 };
  s.diary.booking = bk;
  if (s.me.where.k === 'city') bk.atStationSeq = ctx.schedule(chk.legs[0]!.dep - dv<number>(ctx.bundle, 'DV-C07-001'), PRIO.AtStation, 'c07.AtStation', { booking: id });
  s.stats.bookings.push({ id, at: ctx.now, legs: chk.legs.length, minSlackSec: chk.minSlackSec, oddsShown: chk.odds, verified: s.diary.verifiedInStay });
  if (cmd.sleeper) {
    const tt = ctx.bundle.tt;
    for (const l of chk.legs) {
      const t = tt.trips[tt.trip(l.tripId)]!;
      if (!t.sleeper) continue;
      ctx.emit({ kind: 'berth.reservation', subject: s.legend.id, predicate: 'reserved', value: { trainKey: l.trainKey, day: l.day, from: l.from, to: l.to },
        confidence: dv<{ sleeper: number }>(ctx.bundle, 'DV-C07-028').sleeper, source: t.operator, time: ctx.now, authorship: 'world', place: l.from });
    }
  }
  ctx.trace('book', { id, legs: chk.legs.map((l) => l.tripId), odds: chk.odds, minSlackSec: chk.minSlackSec });
  reflow(s, ctx);
}

export function cancelBooking(s: C07State, ctx: C): void {
  const bk = s.diary.booking;
  if (!bk) return;
  if (bk.atStationSeq !== null) ctx.cancel(bk.atStationSeq);
  s.diary.booking = null;
  reflow(s, ctx);
}

// ------------------------------------------------------------------ at the station, boarding

function voidBooking(s: C07State): void { s.diary.booking = null; }

const finalCity = (b: C07Bundle, bk: Booking): string => cityOfStation(b, bk.legs[bk.legs.length - 1]!.to);

/** A ghost met in person (RULES 5.4): stats, interrupt and learning. */
function meetGhost(s: C07State, ctx: C, bk: Booking, leg: PlannedLeg, believed: number, res: ReturnType<typeof checkGhost>): void {
  const t = ctx.bundle.tt.trips[believed]!;
  s.stats.ghosts.push({ at: ctx.now, trainKey: leg.trainKey, edition: t.edition, status: res.status, toCity: finalCity(ctx.bundle, bk) });
  learnGhost(s, ctx.bundle, believed, leg.day, res, ctx.now);
  interrupt(s, ctx, 'ghost', { trainKey: leg.trainKey, day: leg.day, station: leg.from, status: res.status, truthDep: res.truthDep });
}

/** Checks leg `i` against the ground. Returns the truth trip to board, or null after voiding the booking. */
function confirmLeg(s: C07State, ctx: C, bk: Booking, i: number): number | null {
  const b = ctx.bundle; const tt = b.tt;
  const leg = bk.legs[i]!;
  const believed = tt.trip(leg.tripId);
  const res = checkGhost(b, ctx.params, believed, leg.from, leg.day);
  let truth = res.truthTrip;
  let status = res.status;
  if (truth !== null && (status === 'ok' || status === 'retimed')) {
    const a = stopOf(b, truth, leg.from);
    if (a === null || stopOf(b, truth, leg.to, a) === null) status = 'withdrawn';
  }
  if (status === 'ok') return truth;
  if (status === 'retimed' && truth !== null && res.truthDep !== null && res.truthDep >= ctx.now) {
    // Retimed later (or still ahead): the booking takes the truth time.
    meetGhost(s, ctx, bk, leg, believed, { ...res, status: 'retimed' });
    const a = stopOf(b, truth, leg.from)!; const z = stopOf(b, truth, leg.to, a)!;
    bk.legs[i] = { ...leg, tripId: tt.trips[truth]!.id, dep: tt.depAt(a, leg.day)!, arr: tt.arrAt(z, leg.day)! };
    return truth;
  }
  meetGhost(s, ctx, bk, leg, believed, { ...res, status });
  truth = null;
  voidBooking(s);
  return truth;
}

export function onAtStation(s: C07State, p: { booking: number }, ctx: C): void {
  const bk = s.diary.booking;
  if (!bk || bk.id !== p.booking || s.me.where.k !== 'city') return;
  bk.atStationSeq = null;
  const leg = bk.legs[bk.next]!;
  s.me.where = { k: 'city', city: s.me.where.city, venue: 'station', station: leg.from };
  detect(s, ctx, cityOfStation(ctx.bundle, leg.from), { frontierNamed: false, cls: bk.cls, station: leg.from });
  if (s.ending) return;
  const truth = confirmLeg(s, ctx, bk, bk.next);
  if (truth === null) { reflow(s, ctx); return; }
  const j = stopOf(ctx.bundle, truth, leg.from)!;
  ctx.schedule(Math.max(ctx.now, actualDep(ctx.bundle, ctx.params, ctx.seed, truth, leg.day, j)), PRIO.Board, 'c07.Board', { booking: bk.id, leg: bk.next, trip: truth });
}

/** Whether a held ticket (after a miss) covers this leg; consumes the leg if so. */
function ticketCovers(s: C07State, b: C07Bundle, leg: PlannedLeg, cls: Cls, now: Instant): boolean {
  s.diary.tickets = s.diary.tickets.filter((t) => t.until >= now);
  const from = cityOfStation(b, leg.from); const to = cityOfStation(b, leg.to);
  const t = s.diary.tickets.find((x) => x.fromCity === from && x.toCities.includes(to) && x.cls === cls);
  if (!t) return false;
  t.fromCity = to;
  return true;
}

export function onBoard(s: C07State, p: { booking: number; leg: number; trip: number }, ctx: C): void {
  const bk = s.diary.booking;
  if (!bk || bk.id !== p.booking || bk.next !== p.leg) return;
  const b = ctx.bundle; const tt = b.tt;
  const leg = bk.legs[p.leg]!;
  const trip = p.trip;
  const t = tt.trips[trip]!;
  const station = leg.from;
  const city = cityOfStation(b, station);
  // Fare (and berth) in the fare's currency, unless a ticket from a missed connection covers it.
  if (!ticketCovers(s, b, leg, bk.cls, ctx.now)) {
    const fares = [fareOf(b, trip, leg.from, leg.to, bk.cls, leg.day)];
    if (bk.sleeper && t.sleeper) fares.push(fareOf(b, trip, leg.from, leg.to, 'sleeper', leg.day));
    const total = fares.reduce((acc, f) => (acc.cur === f.amount.cur ? money(acc.cur, acc.minor + f.amount.minor) : acc), money(fares[0]!.amount.cur, 0));
    const others = fares.filter((f) => f.amount.cur !== total.cur);
    const what = `Fare ${t.trainNo} ${b.station.get(leg.from)?.name ?? leg.from}–${b.station.get(leg.to)?.name ?? leg.to}`;
    const ok = payCash(b, s, total, ctx.params, ctx.now, what) && others.every((f) => payCash(b, s, f.amount, ctx.params, ctx.now, 'Berth'));
    if (!ok) {
      interrupt(s, ctx, 'cannotPay', { what: 'fare', trainKey: leg.trainKey });
      voidBooking(s);
      if (!s.diary.inStay) openStay(s, ctx.now, city, station);
      reflow(s, ctx);
      return;
    }
  }
  checkOut(s, ctx);
  closeStay(s, b, ctx.now);
  const cls = dv<{ ticket: Record<string, number> }>(b, 'DV-C07-028').ticket[String(bk.cls)]!;
  ctx.emit({ kind: 'ticket.sale', subject: `anon:${s.legend.id}`, predicate: 'travelled', value: { mode: t.mode, from: leg.from, dir: leg.to },
    confidence: cls, source: t.operator, time: ctx.now, authorship: 'world', place: leg.from });
  const a = stopOf(b, trip, leg.from)!; const z = stopOf(b, trip, leg.to, a)!;
  const ride: Ride = {
    booking: bk.id, leg: p.leg, tripId: t.id, trainKey: t.trainKey, day: leg.day, from: leg.from, to: leg.to, cls: bk.cls,
    sleeper: bk.sleeper && t.sleeper, delaySec: delayAt(b, ctx.params, ctx.seed, trip, leg.day, z), shownDelay: 0, arriveSeq: -1,
    boardedAt: ctx.now, schedArr: tt.arrAt(z, leg.day)!, hallDwell: 0, halls: [],
  };
  scheduleRide(s, ctx, ride, trip, a, z);
  s.me.where = { k: 'aboard', ride };
  s.me.busyUntil = Math.max(s.me.busyUntil, ctx.now);
  s.world.seenUntil = ctx.now;
  bk.next = p.leg + 1;
  ctx.trace('board', { trainKey: t.trainKey, day: leg.day, from: leg.from, to: leg.to });
  reflow(s, ctx);
}

function scheduleRide(s: C07State, ctx: C, ride: Ride, trip: number, a: number, z: number): void {
  const b = ctx.bundle; const tt = b.tt;
  for (const h of ride.halls) ctx.cancel(h.seq);
  if (ride.arriveSeq >= 0) ctx.cancel(ride.arriveSeq);
  ride.halls = []; ride.hallDwell = 0;
  for (let j = a + 1; j < z; j++) {
    if ((tt.stopFlags[j]! & (CUSTOMS | PASSPORT)) === 0) continue;
    const at = actualArr(b, ctx.params, ctx.seed, trip, ride.day, j);
    if (at < ctx.now) continue;
    ride.halls.push({ stop: j, seq: ctx.schedule(at, PRIO.FrontierHall, 'c07.FrontierHall', { station: tt.stationIds[tt.stopStation[j]!]!, stop: j }) });
    if (tt.stopDep[j]! >= 0) ride.hallDwell += tt.depAt(j, ride.day)! - tt.arrAt(j, ride.day)!;
  }
  ride.arriveSeq = ctx.schedule(Math.max(ctx.now, actualArr(b, ctx.params, ctx.seed, trip, ride.day, z)), PRIO.RideArrive, 'c07.RideArrive', { booking: ride.booking, leg: ride.leg });
  void s;
}

// ------------------------------------------------------------------ halls

/** The frontier hall at stop j of the ride's trip. Returns false if the player was refused. */
function hall(s: C07State, ctx: C, ride: Ride, j: number): boolean {
  const b = ctx.bundle; const tt = b.tt;
  const trip = tt.trip(ride.tripId);
  const station = tt.stationIds[tt.stopStation[j]!]!;
  let prev = j - 1;
  while (prev >= tt.trips[trip]!.firstStop && tt.stopDep[prev]! < 0 && tt.stopArr[prev]! < 0) prev--;
  const prevStation = tt.stationIds[tt.stopStation[prev]!]!;
  const edge = `${prevStation}>${station}`;
  const day = dayOf(ctx.now);
  const papers = ctx.params.get<{ passport: boolean; visa: string | null; recordsName: boolean; inspector: string; customs: string }>('frontier.papers', edge, day);
  ride.shownDelay = delayAt(b, ctx.params, ctx.seed, trip, ride.day, j);
  if (tt.stopDep[j]! >= 0) ride.hallDwell = Math.max(0, ride.hallDwell - (tt.depAt(j, ride.day)! - tt.arrAt(j, ride.day)!));
  ride.halls = ride.halls.filter((h) => h.stop !== j);
  if (papers) {
    const missing = (papers.passport && !s.legend.papers.passport) || (papers.visa !== null && !s.legend.papers.visas.includes(papers.visa));
    if (missing) {
      endRideHere(s, ctx, ride, station);
      interrupt(s, ctx, 'refused', { station, edge });
      return false;
    }
  }
  let named = false;
  if (papers?.recordsName) {
    named = true;
    ctx.emit({ kind: 'frontier.passport', subject: s.legend.id, predicate: 'crossed', value: { station, dir: edge, trainKey: ride.trainKey, day: ride.day },
      confidence: 1000, source: papers.inspector, time: ctx.now, authorship: 'world', place: station });
  }
  if (papers) {
    ctx.emit({ kind: 'frontier.customs', subject: `anon:${s.legend.id}`, predicate: 'inspected', value: { station },
      confidence: dv<{ customs: number }>(b, 'DV-C07-028').customs, source: papers.customs, time: ctx.now, authorship: 'world', place: station });
  }
  detect(s, ctx, cityOfStation(b, station), { frontierNamed: named, cls: ride.cls, station });
  return true;
}

function chargeRide(s: C07State, ctx: C, ride: Ride): void {
  const b = ctx.bundle;
  const off = cityOffset(b, cityOfStation(b, ride.from), dayOf(ride.boardedAt));
  adjustHealth(s, ctx, rideHealth(b, ride.cls, ride.sleeper, ride.boardedAt, ctx.now, off));
  ride.boardedAt = ctx.now;
}

/** The ride ends at a station other than planned (refused at a hall): a stay opens there. */
function endRideHere(s: C07State, ctx: C, ride: Ride, station: string): void {
  for (const h of ride.halls) ctx.cancel(h.seq);
  if (ride.arriveSeq >= 0) ctx.cancel(ride.arriveSeq);
  chargeRide(s, ctx, ride);
  if (s.diary.booking?.id === ride.booking) voidBooking(s);
  openStay(s, ctx.now, cityOfStation(ctx.bundle, station), station);
  revealNews(s, ctx);
  reflow(s, ctx);
}

export function onFrontierHall(s: C07State, p: { station: string; stop: number }, ctx: C): void {
  if (s.me.where.k !== 'aboard') return;
  const ride = s.me.where.ride;
  if (!ride.halls.some((h) => h.stop === p.stop)) return;
  hall(s, ctx, ride, p.stop);
}

// ------------------------------------------------------------------ arrival and connections

export function onRideArrive(s: C07State, p: { booking: number; leg: number }, ctx: C): void {
  if (s.me.where.k !== 'aboard') return;
  const ride = s.me.where.ride;
  if (ride.booking !== p.booking || ride.leg !== p.leg) return;
  const b = ctx.bundle; const tt = b.tt;
  const trip = tt.trip(ride.tripId);
  const z = stopOf(b, trip, ride.to, stopOf(b, trip, ride.from)!)!;
  chargeRide(s, ctx, ride);
  ride.shownDelay = ride.delaySec;
  if (s.ending) return;
  if ((tt.stopFlags[z]! & (CUSTOMS | PASSPORT)) !== 0 && !hall(s, ctx, ride, z)) return;
  if (s.ending) return;
  const station = ride.to;
  const city = cityOfStation(b, station);
  s.me.where = { k: 'city', city, venue: 'station', station };
  revealNews(s, ctx);
  detect(s, ctx, city, { frontierNamed: false, cls: ride.cls, station });
  if (s.ending) return;
  const bk = s.diary.booking;
  let nextIdx = -1;
  if (bk && bk.id === ride.booking && bk.next < bk.legs.length) nextIdx = bk.next;
  else if (bk && bk.id !== ride.booking && bk.next === 0) nextIdx = 0;
  if (!bk || nextIdx < 0) {
    if (bk && bk.id === ride.booking) voidBooking(s);
    openStay(s, ctx.now, city, station);
    interrupt(s, ctx, 'arrival', { station, delaySec: ride.delaySec, trainKey: ride.trainKey });
    reflow(s, ctx);
    return;
  }
  const next = bk.legs[nextIdx]!;
  if (changeSec(b, station, next.from) === null) { voidBooking(s); openStay(s, ctx.now, city, station); interrupt(s, ctx, 'arrival', { station, delaySec: ride.delaySec }); reflow(s, ctx); return; }
  const truth = confirmLeg(s, ctx, bk, nextIdx);
  if (truth === null) { openStay(s, ctx.now, city, station); reflow(s, ctx); return; }
  const leg = bk.legs[nextIdx]!;
  const j = stopOf(b, truth, leg.from)!;
  const depNext = actualDep(b, ctx.params, ctx.seed, truth, leg.day, j);
  const through = station === leg.from && throughLinked(b, trip, truth, station);
  const ready = ctx.now + (changeSec(b, station, leg.from) ?? 0);
  if (through || ready <= depNext) {
    bk.next = nextIdx;
    s.me.where = { k: 'city', city, venue: 'station', station: leg.from };
    ctx.schedule(Math.max(ctx.now, depNext), PRIO.Board, 'c07.Board', { booking: bk.id, leg: nextIdx, trip: truth });
    ctx.trace('connection', { station, slack: depNext - ready, through });
    return;
  }
  // Missed: the scheduled slack was smaller than the delay.
  const prevArrSched = ride.schedArr;
  const slackSec = leg.dep - prevArrSched - (changeSec(b, station, leg.from) ?? 0);
  s.stats.misses.push({ booking: bk.id, at: ctx.now, station, slackSec, delaySec: ride.delaySec, oddsShown: bk.missOdds, toCity: finalCity(b, bk) });
  const days = dv<{ days: number }>(b, 'DV-C07-016').days;
  const local = localIn(b, city, ctx.now);
  s.diary.tickets.push({ fromCity: city, toCities: bk.legs.slice(nextIdx).map((l) => cityOfStation(b, l.to)), cls: bk.cls, until: instantIn(b, city, local.day + days + 1, 0) - 1 });
  interrupt(s, ctx, 'missed', { station, trainKey: leg.trainKey, slackSec, delaySec: ride.delaySec });
  voidBooking(s);
  openStay(s, ctx.now, city, station);
  reflow(s, ctx);
}

/** alight: leave the train at an earlier timed stop; later legs are void and nothing is refunded. */
export function checkAlight(s: C07State, b: C07Bundle, station: string): string | null {
  if (s.me.where.k !== 'aboard') return 'Not aboard';
  const r = s.me.where.ride;
  const trip = b.tt.tripIndex.get(r.tripId)!;
  const a = stopOf(b, trip, r.from)!; const z = stopOf(b, trip, r.to, a)!;
  const j = b.tt.stationIndex.has(station) ? stopOf(b, trip, station, a) : null;
  if (j === null || j >= z) return 'The train does not stop there before your destination';
  if (b.tt.stopArr[j]! < 0 && b.tt.stopDep[j]! < 0) return 'Not a timed stop';
  return null;
}

export function applyAlight(s: C07State, ctx: C, station: string): void {
  if (s.me.where.k !== 'aboard') return;
  const r = s.me.where.ride;
  const b = ctx.bundle;
  const trip = b.tt.trip(r.tripId);
  const a = stopOf(b, trip, r.from)!; const z = stopOf(b, trip, station, a)!;
  if (actualArr(b, ctx.params, ctx.seed, trip, r.day, z) < ctx.now) throw new Error('That stop is already passed');
  r.to = station;
  r.delaySec = delayAt(b, ctx.params, ctx.seed, trip, r.day, z);
  r.schedArr = b.tt.arrAt(z, r.day)!;
  scheduleRide(s, ctx, r, trip, a, z);
  if (s.diary.booking?.id === r.booking) {
    if (s.diary.booking.atStationSeq !== null) ctx.cancel(s.diary.booking.atStationSeq);
    voidBooking(s);
  }
  reflow(s, ctx);
}

/** Whether an alighting stop is already behind the train (for validation). */
export function alightPassed(s: C07State, b: C07Bundle, params: Rows, seed: number | null, now: Instant, station: string): boolean {
  if (s.me.where.k !== 'aboard') return true;
  const r = s.me.where.ride;
  const trip = b.tt.trip(r.tripId);
  const a = stopOf(b, trip, r.from)!; const j = stopOf(b, trip, station, a);
  if (j === null) return true;
  // Without the seed (the player's side) only the timetable and the delay shown so far are known.
  const at = seed === null ? b.tt.arrAt(j, r.day)! + r.shownDelay : actualArr(b, params, seed, trip, r.day, j);
  return at < now;
}

/** H07-4: does a ride's scheduled run cover 02:00 local at its boarding station? */
export function coversTwoAm(b: C07Bundle, ride: Ride): boolean {
  const tt = b.tt; const trip = tt.trip(ride.tripId);
  const a = stopOf(b, trip, ride.from)!;
  const dep = tt.depAt(a, ride.day)!;
  const off = cityOffset(b, cityOfStation(b, ride.from), dayOf(dep));
  const local = dep + off;
  const d0 = Math.floor(local / 86400);
  for (let d = d0; d <= d0 + 3; d++) {
    const two = d * 86400 + 7200 - off;
    if (two >= dep && two <= ride.schedArr) return true;
  }
  return false;
}

export type { PlannedLeg };
