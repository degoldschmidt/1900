/**
 * hunt (RULES.md 5.8; H07-5): one hunting service subscribed to the legend's named records. Records
 * reach it only by lag and cooperation rows (kit `arrival`). A delivered record with a place gives a
 * fix; particles move only on the service's own view (its editions, minus what DV-C07-031 excludes,
 * minus suspensions); cordons are placed only where watchers can physically be in time: a local
 * police office warned by wire, or watchers riding the hunter-view earliest journey from a base on
 * a real train whose shared delay they suffer too.
 *
 * Never read here: the player's itinerary, trips outside the hunter view, realised delays other
 * than the watchers' own train.
 */
import { seedBelief, propagate, observe, resample, mass } from '#kit/hunter/belief.ts';
import { connections } from '#kit/timetable/expand.ts';
import { earliestArrival, journey } from '#kit/timetable/csa.ts';
import { newKnownGraph, setExclusion } from '#kit/timetable/knowledge.ts';
import type { Mode } from '#kit/timetable/types.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, Rows } from './data.ts';
import { dv, stationsOfCity, cityOfPlace, localIn, instantIn, cmpStr } from './data.ts';
import type { C07State, Cls, HuntState, Cordon } from './types.ts';
import { type C, interrupt } from './diary.ts';
import { hunterView, scheduleEditions } from './knowledge.ts';
import { delayAt, stopOf, actualArr, actualDep } from './travel.ts';
import { endGame } from './endings.ts';

export const PRIO_HUNT = { Cordon: 5, Arrest: 6, Tick: 11 } as const;
export const SUBSCRIBED_KINDS = ['registration.slip', 'frontier.passport', 'hotel.complaint'];

interface Particles { n: number; stay: number; maxRides: number; fanout: number; missWatched: number }

const stationIdx = (b: C07Bundle, city: string): number[] => stationsOfCity(b, city).sort(cmpStr).map((s) => b.tt.st(s));

/** Cities the service may watch and arrest in: those of its jurisdiction (DV-C07-034), frontier towns included. */
export function jurisdictionCities(b: C07Bundle, service: string): string[] {
  const jur = b.inst.get(service)?.jurisdiction;
  return b.raw.cities.filter((c) => c.jurisdiction === jur && stationsOfCity(b, c.id).length > 0).map((c) => c.id).sort(cmpStr);
}

export function initHunt(ctx: C, service: string, legend: string, start: Instant, end: Instant): HuntState {
  const b = ctx.bundle;
  const kg = newKnownGraph(`hunter:${service}`, []);
  scheduleEditions(ctx, start, end, kg);
  const known = ctx.params.get<{ modes: Mode[]; operators: string[] }>('hunt.known', service, dayOf(start));
  if (known) {
    const modes = [...new Set(b.raw.trips.map((t) => t.mode))].filter((m) => !known.modes.includes(m));
    const operators = [...new Set(b.raw.trips.map((t) => t.operator))].filter((o) => !known.operators.includes(o));
    setExclusion(kg, { modes, operators });
  }
  ctx.subscribe(service, { kinds: SUBSCRIBED_KINDS, subjects: [legend] });
  return { service, subject: legend, kg, belief: null, file: [], lastFix: null, tickSeq: null, cordons: [], nextCordon: 1, delivered: [], fixes: [] };
}

export function onDelivered(s: C07State, p: { rec: number; reader: string }, ctx: C): void {
  const h = s.hunt;
  if (p.reader !== h.service) return;
  h.file.push(p.rec);
  h.delivered.push({ rec: p.rec, at: ctx.now });
  const r = ctx.records.get(p.rec)!;
  ctx.trace('hunt.delivered', { rec: p.rec, kind: r.kind, written: r.time });
  if (!r.place || (h.lastFix && r.time <= h.lastFix.t)) return;
  fix(s, ctx, p.rec, r.time, cityOfPlace(ctx.bundle, r.place), [p.rec]);
}

function particles(b: C07Bundle): Particles { return dv<Particles>(b, 'DV-C07-032'); }

function propagateTo(s: C07State, ctx: C, t: Instant): void {
  const h = s.hunt; const P = particles(ctx.bundle);
  if (!h.belief) return;
  propagate(h.belief, t, ctx.bundle.tt, hunterView(ctx.bundle, ctx.params, h.kg), ctx.seed, { stayPermille: P.stay, maxRides: P.maxRides, fanout: P.fanout });
}

export function fix(s: C07State, ctx: C, rec: number, t: Instant, city: string, cause: number[]): void {
  const h = s.hunt; const b = ctx.bundle;
  h.lastFix = { rec, t, city, cause: [...cause] };
  h.fixes.push({ rec, t, city, at: ctx.now });
  h.belief = seedBelief(h.service, h.subject, stationIdx(b, city), t, particles(b).n);
  propagateTo(s, ctx, ctx.now);
  ctx.trace('hunt.fix', { rec, t, city });
  decide(s, ctx, cause);
  if (h.tickSeq !== null) ctx.cancel(h.tickSeq);
  h.tickSeq = null;
  const next = ctx.now + dv<number>(b, 'DV-C07-033');
  if (next <= s.endsAt) h.tickSeq = ctx.schedule(next, PRIO_HUNT.Tick, 'c07.HuntTick', {});
}

export function onHuntTick(s: C07State, _p: unknown, ctx: C): void {
  const h = s.hunt;
  h.tickSeq = null;
  if (!h.belief || !h.lastFix) return;
  propagateTo(s, ctx, ctx.now);
  resample(h.belief, ctx.seed);
  ctx.trace('hunt.tick', { masses: massesOf(s, ctx.bundle) });
  decide(s, ctx, h.lastFix.cause);
  const next = ctx.now + dv<number>(ctx.bundle, 'DV-C07-033');
  if (next <= s.endsAt) h.tickSeq = ctx.schedule(next, PRIO_HUNT.Tick, 'c07.HuntTick', {});
}

/** Belief mass (‰) per city of the jurisdiction (for traces and tests). */
export function massesOf(s: C07State, b: C07Bundle): Record<string, number> {
  const out: Record<string, number> = {};
  if (!s.hunt.belief) return out;
  for (const c of b.raw.cities.map((x) => x.id).sort(cmpStr)) { const st = stationIdx(b, c); if (st.length) out[c] = mass(s.hunt.belief, st); }
  return out;
}

/** The next instant ≥ t a police office is open (its office-hours row, else DV-C07-060). */
export function policeOpen(b: C07Bundle, params: Rows, inst: string, t: Instant): Instant {
  const row = b.inst.get(inst)!;
  const city = row.city!;
  const fallback = dv<{ open: number; close: number }>(b, 'DV-C07-060');
  const { day, sec } = localIn(b, city, t);
  for (let d = day; d <= day + 7; d++) {
    const spans = params.get<{ days: Array<[number, number, number]> }>('police.officeHours', inst, d)?.days ?? [[127, fallback.open, fallback.close]];
    const wd = ((d % 7) + 7) % 7;
    for (const [mask, open, close] of [...spans].sort((x, y) => x[1] - y[1])) {
      if ((mask & (1 << wd)) === 0) continue;
      const from = d === day ? Math.max(sec, open) : open;
      if (from < close) return instantIn(b, city, d, from);
    }
  }
  return Infinity;
}

/** A local police office in the city with a cooperation row to the service. */
export function localOffice(b: C07Bundle, params: Rows, service: string, city: string): string | null {
  const offices = b.raw.institutions.filter((i) => i.city === city && i.kind === 'police' && i.id !== service).map((i) => i.id).sort(cmpStr);
  for (const o of offices) if (params.rowsFor('coop.edge').some((r) => r.key === `${o}>${service}`)) return o;
  return null;
}

export interface WatcherRoute { at: number; base: string | null; trainKey: string | null; trips: Array<{ trip: string; day: number }> }

/** Earliest physical arrival of watchers from the bases, on the hunter view, with their train's delay (RULES 5.8). */
export function watcherArrival(b: C07Bundle, params: Rows, seed: number, h: HuntState, now: Instant, city: string): WatcherRoute {
  const bases = params.get<{ cities: string[] }>('hunt.bases', h.service, dayOf(now))?.cities ?? [];
  const dispatch = dv<number>(b, 'DV-C07-039'); const horizon = dv<number>(b, 'DV-C07-041');
  const post = dv<{ post: number }>(b, 'DV-C07-040').post;
  let best: WatcherRoute = { at: Infinity, base: null, trainKey: null, trips: [] };
  const view = hunterView(b, params, h.kg);
  const targets = stationIdx(b, city);
  for (const base of [...bases].sort(cmpStr)) {
    const t0 = now + dispatch;
    if (base === city) { if (t0 + post < best.at) best = { at: t0 + post, base, trainKey: null, trips: [] }; continue; }
    const c = connections(b.tt, view, t0, now + horizon);
    const res = earliestArrival(b.tt, c, stationIdx(b, base).map((st) => ({ station: st, t: t0 })));
    for (const target of targets) {
      if (!Number.isFinite(res.arr[target]!)) continue;
      const legs = journey(b.tt, c, res, target);
      if (!legs) continue;
      const rides = legs.filter((l) => l.kind === 'ride');
      const last = rides[rides.length - 1];
      if (!last || last.kind !== 'ride') continue;
      let at = last.arr + delayAt(b, params, seed, last.trip, last.day, last.toStop);
      for (const l of legs.slice(legs.indexOf(last) + 1)) at += l.arr - l.dep; // a walk after the last ride
      at += post;
      if (at < best.at) best = { at, base, trainKey: b.tt.trips[last.trip]!.trainKey, trips: rides.map((r) => ({ trip: b.tt.trips[(r as { trip: number }).trip]!.id, day: (r as { day: number }).day })) };
    }
  }
  return best;
}

export function decide(s: C07State, ctx: C, cause: number[]): void {
  const h = s.hunt; const b = ctx.bundle;
  if (!h.belief) return;
  const threshold = dv<number>(b, 'DV-C07-035');
  const lim = dv<{ max: number; dur: number }>(b, 'DV-C07-036');
  const horizon = dv<number>(b, 'DV-C07-041');
  const cities = jurisdictionCities(b, h.service)
    .map((c) => ({ c, m: mass(h.belief!, stationIdx(b, c)) }))
    .sort((x, y) => y.m - x.m || cmpStr(x.c, y.c));
  for (const { c: city, m } of cities) {
    const active = h.cordons.filter((x) => x.to > ctx.now);
    if (m < threshold || active.length >= lim.max) break;
    if (active.some((x) => x.city === city)) continue;
    const office = localOffice(b, ctx.params, h.service, city);
    const tLocal = office ? policeOpen(b, ctx.params, office, ctx.now + dv<number>(b, 'DV-C07-037')) : Infinity;
    const route = watcherArrival(b, ctx.params, ctx.seed, h, ctx.now, city);
    const from = Math.min(tLocal, route.at);
    if (!Number.isFinite(from) || from > ctx.now + horizon) continue;
    const via = tLocal <= route.at ? 'local' : 'train';
    const cordon: Cordon = { id: h.nextCordon++, city, from, to: from + lim.dur, via, base: via === 'train' ? route.base : null, trainKey: via === 'train' ? route.trainKey : null, cause: [...cause], sighted: false };
    h.cordons.push(cordon);
    ctx.schedule(from, PRIO_HUNT.Cordon, 'c07.CordonStart', { cordon: cordon.id });
    ctx.schedule(cordon.to, PRIO_HUNT.Cordon, 'c07.CordonEnd', { cordon: cordon.id });
    ctx.trace('hunt.cordon', { id: cordon.id, city, from, earliest: from, local: Number.isFinite(tLocal) ? tLocal : null, train: Number.isFinite(route.at) ? route.at : null, via, base: route.base, trips: route.trips, mass: m, decidedAt: ctx.now });
  }
}

export function onCordonStart(s: C07State, p: { cordon: number }, ctx: C): void {
  ctx.trace('hunt.cordonStart', p);
  void s;
}

export function onCordonEnd(s: C07State, p: { cordon: number }, ctx: C): void {
  const h = s.hunt;
  const c = h.cordons.find((x) => x.id === p.cordon);
  if (!c || c.sighted || !h.belief) return;
  observe(h.belief, stationIdx(ctx.bundle, c.city), ctx.now, particles(ctx.bundle).missWatched, 1000);
  resample(h.belief, ctx.seed);
  ctx.trace('hunt.cordonEnd', { cordon: c.id, sighted: false });
}

/** Detection at a player passage (AtStation, RideArrive, FrontierHall) in a city with a cordon in force. */
export function detect(s: C07State, ctx: C, city: string, o: { frontierNamed: boolean; cls: Cls; station: string }): void {
  const h = s.hunt; const b = ctx.bundle;
  const cordon = h.cordons.find((x) => x.city === city && x.from <= ctx.now && ctx.now < x.to);
  if (!cordon) return;
  s.passages++;
  const d = dv<{ station: number; classMod: Record<string, number>; frontier: number }>(b, 'DV-C07-042');
  const p = o.frontierNamed ? d.frontier : d.station + (d.classMod[String(o.cls)] ?? 0);
  const noticed = ctx.chance(dv<number>(b, 'DV-C07-043'), 'notice', cordon.id, s.passages);
  if (ctx.chance(p, 'cordon-detect', cordon.id, s.passages)) {
    cordon.sighted = true;
    const rec = ctx.emit({ kind: 'watch.sighting', subject: `watch:${s.legend.id}`, predicate: 'seen', value: { station: o.station },
      confidence: dv<{ sighting: number }>(b, 'DV-C07-028').sighting, source: h.service, time: ctx.now, authorship: 'world', place: o.station });
    s.stats.detections.push({ at: ctx.now, cordon: cordon.id, noticed });
    ctx.trace('hunt.detect', { cordon: cordon.id, rec: rec.id, station: o.station });
    const cause = [...cordon.cause, rec.id];
    if (jurisdictionCities(b, h.service).includes(city)) ctx.schedule(ctx.now + dv<{ arrest: number }>(b, 'DV-C07-040').arrest, PRIO_HUNT.Arrest, 'c07.ArrestAttempt', { cordon: cordon.id, rec: rec.id });
    fix(s, ctx, rec.id, ctx.now, city, cause);
  }
  if (noticed) interrupt(s, ctx, 'noticed', { city, station: o.station });
}

/** Is the player in the city now (a train still standing at one of its stations counts)? */
export function playerIn(s: C07State, b: C07Bundle, params: Rows, seed: number, now: Instant, city: string): boolean {
  if (s.me.where.k === 'city') return s.me.where.city === city;
  const r = s.me.where.ride;
  const trip = b.tt.trip(r.tripId);
  const a = stopOf(b, trip, r.from)!;
  const t = b.tt.trips[trip]!;
  for (let j = a; j < t.firstStop + t.nStops; j++) {
    if (b.tt.stationIds[b.tt.stopStation[j]!] === r.to && j > a) break;
    if (cityOfPlace(b, b.tt.stationIds[b.tt.stopStation[j]!]!) !== city || b.tt.stopDep[j]! < 0) continue;
    const arr = j === a ? r.boardedAt : actualArr(b, params, seed, trip, r.day, j);
    const dep = actualDep(b, params, seed, trip, r.day, j);
    if (arr <= now && now <= dep) return true;
  }
  return false;
}

export function onArrestAttempt(s: C07State, p: { cordon: number; rec: number }, ctx: C): void {
  const c = s.hunt.cordons.find((x) => x.id === p.cordon);
  if (!c) return;
  if (!playerIn(s, ctx.bundle, ctx.params, ctx.seed, ctx.now, c.city)) { ctx.trace('hunt.arrestMissed', p); return; }
  endGame(s, ctx, 'captured', { event: 'arrest', recs: [...new Set([...c.cause, p.rec])], cordon: c.id });
}
