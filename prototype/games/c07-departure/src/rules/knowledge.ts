/**
 * knowledge (RULES.md 5.5; H07-3): owned guide editions, learned trains, ghost connections, and
 * the views planners and the hunter route on.
 *
 * Editions: the known graph keeps every owned edition (the shelf). For each family the edition in
 * force on a service day is the newest owned one whose printed validity has begun that day (a
 * player holding both keeps reading the winter guide for April days); with none begun, the newest
 * owned. Learned trains (porter, board, cable, observation) override the guide.
 */
import { knownView, learn as kitLearn, addEdition, ghostCheck, type KnownGraph, type GhostResult, type KnowledgeSource } from '#kit/timetable/knowledge.ts';
import type { GraphView } from '#kit/timetable/expand.ts';
import { canonicalJson } from '#kit/sim/canonical.ts';
import { hash64 } from '#kit/sim/hash.ts';
import { dayOf, instantOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, Rows } from './data.ts';
import { dv, stationsOfCity } from './data.ts';
import type { C07State } from './types.ts';
import type { C } from './diary.ts';
import { interrupt } from './diary.ts';
import { delayAtStop } from './travel.ts';

// ------------------------------------------------------------------ suspensions

interface Suspension { scope: 'all' | 'segments' | 'trainKeys'; ids: string[]; admin?: string }

/** Suspension rows in force; with `announced`, only those whose announcing calendar event has fired. */
export function suspendedFn(b: C07Bundle, params: Rows, announced: readonly string[] | null): ((trip: number, day: number) => boolean) | undefined {
  const rows = params.rowsFor('service.suspension');
  if (rows.length === 0) return undefined;
  const effects = new Set<string>();
  if (announced) for (const ev of b.raw.calendar) if (announced.includes(ev.id)) for (const e of ev.effects) effects.add(e);
  return (trip, day) => {
    const t = b.tt.trips[trip]!;
    for (const r of rows) {
      if (!(r.from <= day && (r.to === null || day < r.to))) continue;
      if (announced && !effects.has(r.id)) continue;
      const v = r.value as Suspension;
      if (v.scope === 'all' && (!v.admin || v.admin === t.operator)) return true;
      if (v.scope === 'trainKeys' && v.ids.includes(t.trainKey)) return true;
      if (v.scope === 'segments' && v.ids.some((id) => t.trainKey.includes(id))) return true;
    }
    return false;
  };
}

// ------------------------------------------------------------------ views

/** The owned edition of a family in force on a service day. */
export function activeEdition(b: C07Bundle, kg: KnownGraph, family: string, day: number): string | null {
  const owned = kg.editions.map((id) => b.edition.get(id)!).filter((e) => e && e.family === family);
  if (owned.length === 0) return null;
  const newest = (list: typeof owned) => list.reduce((a, e) => (e.issueDay > a.issueDay || (e.issueDay === a.issueDay && e.id > a.id) ? e : a));
  const begun = owned.filter((e) => e.validFrom <= day);
  return newest(begun.length ? begun : owned).id;
}

/**
 * A routing view over a known graph: the kit view (owned editions, learned trains, K3 exclusion)
 * narrowed to the edition in force per family and day, one version per train, minus suspensions.
 */
export function viewOf(b: C07Bundle, kg: KnownGraph, suspended: ((trip: number, day: number) => boolean) | undefined, keyExtra: string): GraphView {
  const tt = b.tt;
  const base = knownView(tt, kg);
  const learned = new Map(kg.learned.map((e) => [`${e.trainKey}\u0000${e.edition}`, e.confidence] as const));
  const learnedKey = new Set(kg.learned.filter((e) => e.confidence > 0).map((e) => e.trainKey));
  const memo = new Map<string, number>();
  const candidate = (trip: number, day: number): boolean => {
    if (!base.uses(trip, day)) return false;
    const t = tt.trips[trip]!;
    const conf = learned.get(`${t.trainKey}\u0000${t.edition}`);
    if (conf !== undefined && conf > 0) return true;
    if (learnedKey.has(t.trainKey)) return false;
    return activeEdition(b, kg, b.edition.get(t.edition)!.family, day) === t.edition;
  };
  const chosen = (key: string, day: number): number => {
    const mk = `${key}|${day}`;
    const hit = memo.get(mk);
    if (hit !== undefined) return hit;
    let best = -1;
    for (const i of tt.tripsByKey.get(key) ?? []) {
      if (!candidate(i, day)) continue;
      if (best < 0) { best = i; continue; }
      const a = tt.trips[i]!; const z = tt.trips[best]!;
      const la = (learned.get(`${a.trainKey}\u0000${a.edition}`) ?? 0) > 0; const lz = (learned.get(`${z.trainKey}\u0000${z.edition}`) ?? 0) > 0;
      const ia = b.edition.get(a.edition)!.issueDay; const iz = b.edition.get(z.edition)!.issueDay;
      if ((la && !lz) || (la === lz && (ia > iz || (ia === iz && a.id < z.id)))) best = i;
    }
    memo.set(mk, best);
    return best;
  };
  return {
    key: `c07:${hash64(canonicalJson(kg))}|${keyExtra}`,
    uses: (trip, day) => chosen(tt.trips[trip]!.trainKey, day) === trip && !(suspended?.(trip, day) ?? false),
  };
}

const suspKeys = new WeakMap<object, string>();
/** Part of a view's cache key: the suspension rows in this layer (connections are memoised by key). */
function suspKey(params: Rows): string {
  let k = suspKeys.get(params);
  if (k === undefined) { k = hash64(canonicalJson(params.rowsFor('service.suspension'))); suspKeys.set(params, k); }
  return k;
}

/** The player's planner view (RULES 5.5): minus suspensions whose announcement has fired. */
export function plannerView(b: C07Bundle, params: Rows, s: Pick<C07State, 'knowledge' | 'world'>): GraphView {
  return viewOf(b, s.knowledge.kg, suspendedFn(b, params, s.world.fired), `p${s.world.fired.join(',')}|${suspKey(params)}`);
}

/** The hunter's view (RULES 5.8): its own editions and exclusion, minus every suspension in force. */
export function hunterView(b: C07Bundle, params: Rows, kg: KnownGraph): GraphView {
  return viewOf(b, kg, suspendedFn(b, params, null), `h|${suspKey(params)}`);
}

/** The trip the player believes in for a train on a service day (or null). */
export function believedTrip(b: C07Bundle, params: Rows, s: Pick<C07State, 'knowledge' | 'world'>, trainKey: string, day: number): number | null {
  const v = plannerView(b, params, s);
  for (const i of b.tt.tripsByKey.get(trainKey) ?? []) if (v.uses(i, day)) return i;
  return null;
}

/** The truth trip of a train on a service day, if it runs. */
export function truthTrip(b: C07Bundle, trainKey: string, day: number): number | null {
  for (const i of b.tt.tripsByKey.get(trainKey) ?? []) if (b.tt.truthRuns(i, day)) return i;
  return null;
}

// ------------------------------------------------------------------ learning

const learnedDayOf = (now: Instant): number => dayOf(now);

/** RULES 5.5 learning: a train that runs on the ground → its truth edition at the source's confidence; else 0 on the believed edition. */
export function learnTrain(b: C07Bundle, kg: KnownGraph, trainKey: string, day: number, believed: number | null, source: KnowledgeSource, conf: number, now: Instant): 'runs' | 'not' {
  const truth = truthTrip(b, trainKey, day);
  if (truth !== null) {
    kitLearn(kg, { trainKey, edition: b.tt.trips[truth]!.edition, source, learnedDay: learnedDayOf(now), confidence: conf });
    if (believed !== null && b.tt.trips[believed]!.edition !== b.tt.trips[truth]!.edition) {
      kitLearn(kg, { trainKey, edition: b.tt.trips[believed]!.edition, source, learnedDay: learnedDayOf(now), confidence: 0 });
    }
    return 'runs';
  }
  if (believed !== null) kitLearn(kg, { trainKey, edition: b.tt.trips[believed]!.edition, source, learnedDay: learnedDayOf(now), confidence: 0 });
  return 'not';
}

/** A ghost met in person: confidence 0 on the believed edition (source "observed"), and the truth if it runs. */
export function learnGhost(s: C07State, b: C07Bundle, believed: number, day: number, res: GhostResult, now: Instant): void {
  const t = b.tt.trips[believed]!;
  kitLearn(s.knowledge.kg, { trainKey: t.trainKey, edition: t.edition, source: 'observed', learnedDay: learnedDayOf(now), confidence: 0 });
  if (res.truthTrip !== null && res.status === 'retimed') {
    const tr = b.tt.trips[res.truthTrip]!;
    if (tr.edition !== t.edition) kitLearn(s.knowledge.kg, { trainKey: tr.trainKey, edition: tr.edition, source: 'observed', learnedDay: learnedDayOf(now), confidence: 1000 });
  }
  void day;
}

/** Compares a believed departure with the truth on the ground (only at the moments RULES 5.5 lists). */
export function checkGhost(b: C07Bundle, params: Rows, trip: number, station: string, day: number): GhostResult {
  return ghostCheck(b.tt, trip, b.tt.st(station), day, suspendedFn(b, params, null));
}

// ------------------------------------------------------------------ guides

export function buyGuide(s: C07State, b: C07Bundle, edition: string, city: string, now: Instant): void {
  addEdition(s.knowledge.kg, edition);
  s.knowledge.shelf.push({ edition, at: now, city });
  void b;
}

/** EditionIssued: the hunting service holds an edition DV-C07-030 days after issue. */
export function onEditionIssued(s: C07State, p: { edition: string }, ctx: C): void {
  addEdition(s.hunt.kg, p.edition);
  ctx.trace('edition', p);
}

export function scheduleEditions(ctx: C, start: Instant, end: Instant, hunterKg: KnownGraph): void {
  const lag = dv<number>(ctx.bundle, 'DV-C07-030');
  for (const e of ctx.bundle.raw.editions) {
    const at = instantOf(e.issueDay + lag, 0);
    if (at <= start) { addEdition(hunterKg, e.id); continue; }
    if (at <= end) ctx.schedule(at, 13, 'c07.EditionIssued', { edition: e.id });
  }
}

// ------------------------------------------------------------------ porter, board, cable

/** Departures of a trip at any station of a set, on service days around `now`, within [now, until]. */
function callsAt(b: C07Bundle, trip: number, station: number, now: Instant, until: Instant): Array<{ day: number; dep: Instant }> {
  const tt = b.tt; const t = tt.trips[trip]!;
  const out: Array<{ day: number; dep: Instant }> = [];
  for (let d = dayOf(now) - 3; d <= dayOf(until) + 1; d++) {
    for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
      if (tt.stopStation[j] !== station || tt.stopDep[j]! < 0) continue;
      const dep = tt.depAt(j, d)!;
      if (dep >= now && dep <= until) out.push({ day: d, dep });
    }
  }
  return out.sort((x, y) => x.dep - y.dep);
}

export interface PorterAnswer { trainKey: string; day: number | null; status: string; dep: Instant | null }

/** askPorter: the next day each train calls here within the porter's horizon, checked against the ground. */
export function askPorter(s: C07State, b: C07Bundle, params: Rows, station: string, keys: readonly string[], now: Instant): PorterAnswer[] {
  const until = now + dv<number>(b, 'DV-C07-006');
  const conf = dv<{ porter: number }>(b, 'DV-C07-015').porter;
  const st = b.tt.st(station);
  const view = plannerView(b, params, s);
  const out: PorterAnswer[] = [];
  for (const key of keys) {
    let believed: { trip: number; day: number; dep: Instant } | null = null;
    for (const i of b.tt.tripsByKey.get(key) ?? []) {
      for (const c of callsAt(b, i, st, now, until)) if (view.uses(i, c.day) && (!believed || c.dep < believed.dep)) believed = { trip: i, ...c };
    }
    if (believed) {
      const g = checkGhost(b, params, believed.trip, station, believed.day);
      learnTrain(b, s.knowledge.kg, key, believed.day, believed.trip, 'porter', conf, now);
      out.push({ trainKey: key, day: believed.day, status: g.status, dep: g.truthDep });
      continue;
    }
    // Not in the player's view here: the porter still knows the trains of his own station.
    let truth: { trip: number; day: number; dep: Instant } | null = null;
    for (const i of b.tt.tripsByKey.get(key) ?? []) for (const c of callsAt(b, i, st, now, until)) if (b.tt.truthRuns(i, c.day) && (!truth || c.dep < truth.dep)) truth = { trip: i, ...c };
    if (truth) { learnTrain(b, s.knowledge.kg, key, truth.day, null, 'porter', conf, now); out.push({ trainKey: key, day: truth.day, status: 'ok', dep: truth.dep }); }
    else out.push({ trainKey: key, day: null, status: 'notHere', dep: null });
  }
  return out;
}

/** checkBoard: the true departures from this station within the board horizon, and announced delays within the hour. */
export function checkBoard(s: C07State, b: C07Bundle, params: Rows, seed: number, station: string, now: Instant): number {
  const until = now + dv<number>(b, 'DV-C07-007');
  const st = b.tt.st(station);
  let n = 0;
  b.tt.trips.forEach((t, i) => {
    for (const c of callsAt(b, i, st, now, until)) {
      if (!b.tt.truthRuns(i, c.day)) continue;
      const susp = suspendedFn(b, params, null);
      if (susp?.(i, c.day)) continue;
      kitLearn(s.knowledge.kg, { trainKey: t.trainKey, edition: t.edition, source: 'board', learnedDay: dayOf(now), confidence: 1000 });
      n++;
      if (c.dep <= now + dv<number>(b, 'DV-C07-067')) {
        const d = delayAtStop(b, params, seed, i, c.day, station);
        s.knowledge.delays = s.knowledge.delays.filter((x) => !(x.trainKey === t.trainKey && x.day === c.day && x.station === station));
        s.knowledge.delays.push({ trainKey: t.trainKey, day: c.day, station, delaySec: d, at: now });
      }
    }
  });
  return n;
}

/** CableReply for an enquiry: learn whether the train runs that day, at the cable's confidence. */
export function onCableReply(s: C07State, p: { slot: number; trainKey: string; day: number }, ctx: C): void {
  const conf = dv<{ cable: number }>(ctx.bundle, 'DV-C07-015').cable;
  const believed = believedTrip(ctx.bundle, ctx.params, s, p.trainKey, p.day);
  const res = learnTrain(ctx.bundle, s.knowledge.kg, p.trainKey, p.day, believed, 'cable', conf, ctx.now);
  interrupt(s, ctx, 'cable', { trainKey: p.trainKey, day: p.day, runs: res === 'runs' });
}
