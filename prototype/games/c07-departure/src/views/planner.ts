/**
 * Planner (RULES.md 9): itineraries on the player's own planner view from up to six successive
 * departures, with the fare per class, slack and miss odds per change, the trace each choice
 * writes, health, and citations. The default pick is the earliest arrival whose odds are at most
 * DV-C07-064. Each option carries the ready `book` command and whether it is legal now.
 */
import { itineraries, type Itinerary } from '#kit/timetable/plan.ts';
import type { Money } from '#kit/money/money.ts';
import { dv, stationsOfCity, cityOfStation } from '../rules/data.ts';
import type { Cls, PlannedLeg } from '../rules/types.ts';
import { plannerView as knownPlannerView } from '../rules/knowledge.ts';
import { itineraryForecast, changeSec } from '../rules/forecast.ts';
import { costOf, traceScore, type TraceItem } from '../rules/costs.ts';
import { checkCommand, type C07Command } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { stationClock, money, stationName, cityName, citation, recordLabel, instName, type Clock, type CitationView } from './format.ts';

export interface SourceView { kind: 'guide' | 'porter' | 'board' | 'cable' | 'observed'; edition: string; editionLabel: string; confidence: number; learnedDay: number | null }

export interface LegView {
  tripId: string; trainKey: string; trainNo: string; name: string | null; mode: string; operator: string; operatorName: string;
  from: string; fromName: string; to: string; toName: string; day: number; dep: Clock; arr: Clock;
  classes: Cls[]; sleeper: boolean; source: SourceView; citation: CitationView | null;
}

export interface ClassOption { cls: Cls; fare: string[]; fareMoney: Money[]; designFare: boolean; health: number; legal: boolean; error: string | null; cmd: C07Command }

export interface PlannerOption {
  index: number; dep: Clock; arr: Clock; durationSec: number; trains: number; legs: LegView[];
  changes: Array<{ station: string; stationName: string; slackSec: number; odds: number; through: boolean }>;
  odds: number; minSlackSec: number;
  classes: ClassOption[];
  sleeper: { available: boolean; fare: string[]; cmd: C07Command | null; legal: boolean; error: string | null };
  trace: TraceItem[]; traceScore: number;
  /** The records the journey writes, in words. */
  traceLabels: Array<{ kind: string; label: string; named: boolean; readers: string[] }>;
  isDefault: boolean;
}

export interface PlannerViewModel { from: string[]; fromName: string; to: string; toName: string; earliestStart: Clock | null; options: PlannerOption[]; defaultIndex: number | null; note: string | null }

/** Where a booking would start, and from when (in a city: after reaching the platform; aboard: after the change). */
export function plannerStart(p: PublicState, d: ViewData): { stations: string[]; t: number } {
  const b = d.b;
  if (p.me.where.k === 'city') {
    const t = Math.max(d.now, p.me.busyUntil) + dv<number>(b, 'DV-C07-001') + dv<number>(b, 'DV-C07-002');
    return { stations: stationsOfCity(b, p.me.where.city), t };
  }
  const r = p.me.where.ride;
  return { stations: [r.to], t: r.schedArr + r.shownDelay + (changeSec(b, r.to, r.to) ?? 0) };
}

export function sourceOf(d: ViewData, p: PublicState, trip: number): SourceView {
  const t = d.b.tt.trips[trip]!;
  const e = p.knowledge.kg.learned.find((x) => x.trainKey === t.trainKey && x.edition === t.edition);
  const label = d.b.edition.get(t.edition)?.label ?? t.edition;
  if (e && e.confidence > 0) return { kind: e.source, edition: t.edition, editionLabel: label, confidence: e.confidence, learnedDay: e.learnedDay };
  return { kind: 'guide', edition: t.edition, editionLabel: label, confidence: 1000, learnedDay: null };
}

export function legView(d: ViewData, p: PublicState, l: PlannedLeg): LegView {
  const b = d.b; const trip = b.tt.trip(l.tripId); const t = b.tt.trips[trip]!;
  const classes = ([1, 2, 3] as Cls[]).filter((c) => (t.classMask & (1 << (c - 1))) !== 0);
  let cite: number | null = t.cite;
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) if (b.tt.stationIds[b.tt.stopStation[j]!] === l.from) { cite = b.raw.stops.cite[j] ?? t.cite; break; }
  return {
    tripId: t.id, trainKey: t.trainKey, trainNo: t.trainNo, name: t.name, mode: t.mode, operator: t.operator, operatorName: b.inst.get(t.operator)?.name ?? t.operator,
    from: l.from, fromName: stationName(b, l.from), to: l.to, toName: stationName(b, l.to), day: l.day,
    dep: stationClock(b, l.from, l.dep), arr: stationClock(b, l.to, l.arr), classes, sleeper: t.sleeper, source: sourceOf(d, p, trip), citation: citation(b, cite),
  };
}

function legsOf(d: ViewData, it: Itinerary): PlannedLeg[] {
  const tt = d.b.tt;
  return it.legs.filter((l) => l.kind === 'ride').map((l) => {
    const r = l as Extract<Itinerary['legs'][number], { kind: 'ride' }>;
    const t = tt.trips[r.trip]!;
    return { tripId: t.id, trainKey: t.trainKey, day: r.day, from: tt.stationIds[r.fromStation]!, to: tt.stationIds[r.toStation]!, dep: r.dep, arr: r.arr };
  });
}

export function plannerView(p: PublicState, d: ViewData, to: string): PlannerViewModel {
  const b = d.b; const tt = b.tt; const s = asRules(p);
  const start = plannerStart(p, d);
  const fromName = cityName(b, cityOfStation(b, start.stations[0]!));
  const empty = (note: string): PlannerViewModel => ({ from: start.stations, fromName, to, toName: cityName(b, to), earliestStart: null, options: [], defaultIndex: null, note });
  if (p.ending) return empty('The game has ended');
  const targets = stationsOfCity(b, to);
  if (targets.length === 0) return empty('No station there');
  if (start.stations.some((x) => cityOfStation(b, x) === to)) return empty('You are already there');
  const view = knownPlannerView(b, d.params, p);
  const fromIdx = start.stations.map((x) => tt.st(x)); const toIdx = targets.map((x) => tt.st(x));
  const want = dv<number>(b, 'DV-C07-063');
  const seen = new Set<string>(); const found: PlannedLeg[][] = []; const deps = new Set<number>();
  let t0 = start.t;
  for (let round = 0; round < want * 3 && deps.size < want; round++) {
    const its = itineraries(tt, view, fromIdx, t0, toIdx, { horizonSec: dv<{ planner: number }>(b, 'DV-C07-070').planner, maxTrains: 4 }).filter((it) => it.trains > 0);
    if (its.length === 0) break;
    let minDep = Infinity;
    for (const it of its) {
      const legs = legsOf(d, it);
      const key = legs.map((l) => `${l.tripId}@${l.day}:${l.from}>${l.to}`).join('|');
      minDep = Math.min(minDep, legs[0]!.dep);
      if (seen.has(key) || legs.length > 4) continue;
      seen.add(key); found.push(legs); deps.add(legs[0]!.dep);
    }
    t0 = minDep + 60;
  }
  found.sort((x, y) => x[0]!.dep - y[0]!.dep || x[x.length - 1]!.arr - y[y.length - 1]!.arr || x.length - y.length);
  const kept = found.filter((legs) => [...deps].sort((a, c) => a - c).slice(0, want).includes(legs[0]!.dep));
  const options: PlannerOption[] = kept.map((legs, index) => {
    const fc = itineraryForecast(b, d.params, legs.map((l) => ({ trip: tt.trip(l.tripId), day: l.day, from: l.from, to: l.to })));
    const allowed = ([1, 2, 3] as Cls[]).filter((c) => legs.every((l) => (tt.trips[tt.trip(l.tripId)]!.classMask & (1 << (c - 1))) !== 0));
    const cmdLegs = legs.map((l) => ({ tripId: l.tripId, day: l.day, from: l.from, to: l.to }));
    const e = { b, params: d.params, now: d.now };
    const classes: ClassOption[] = allowed.map((cls) => {
      const cost = costOf({ type: 'book', legs, cls, sleeper: false }, s, e);
      const cmd: C07Command = { type: 'book', legs: cmdLegs, cls, sleeper: false };
      const error = checkCommand(s, b, d.params, d.params, d.now, null, cmd);
      return { cls, fare: cost.money.map((m) => money(b, m)), fareMoney: cost.money, designFare: cost.designFare, health: cost.health, legal: error === null, error, cmd };
    });
    const hasBerth = legs.some((l) => tt.trips[tt.trip(l.tripId)]!.sleeper);
    const berthCls = allowed[0] ?? 1;
    const berth = hasBerth ? costOf({ type: 'book', legs, cls: berthCls, sleeper: true }, s, e) : null;
    const berthCmd: C07Command | null = hasBerth ? { type: 'book', legs: cmdLegs, cls: berthCls, sleeper: true } : null;
    const berthErr = berthCmd ? checkCommand(s, b, d.params, d.params, d.now, null, berthCmd) : 'No sleeping car';
    const trace = costOf({ type: 'book', legs, cls: allowed.includes(2) ? 2 : berthCls, sleeper: false }, s, e).trace;
    return {
      index, dep: stationClock(b, legs[0]!.from, legs[0]!.dep), arr: stationClock(b, legs[legs.length - 1]!.to, legs[legs.length - 1]!.arr),
      durationSec: legs[legs.length - 1]!.arr - legs[0]!.dep, trains: legs.length, legs: legs.map((l) => legView(d, p, l)),
      changes: fc.changes.map((c) => ({ ...c, stationName: stationName(b, c.station) })), odds: fc.odds, minSlackSec: fc.minSlackSec,
      classes, sleeper: { available: hasBerth, fare: berth ? berth.money.map((m) => money(b, m)) : [], cmd: berthCmd, legal: berthErr === null, error: berthErr },
      trace, traceScore: traceScore(trace), traceLabels: trace.map((t) => ({ kind: t.kind, label: recordLabel(t.kind), named: t.named, readers: t.reach.map((r) => instName(b, r.reader)) })), isDefault: false,
    };
  });
  const limit = dv<number>(b, 'DV-C07-064');
  let def: number | null = null;
  for (const o of options) if (o.odds <= limit && o.classes.some((c) => c.legal) && (def === null || o.arr.t < options[def]!.arr.t)) def = o.index;
  if (def !== null) options[def]!.isDefault = true;
  return { from: start.stations, fromName, to, toName: cityName(b, to), earliestStart: stationClock(b, start.stations[0]!, start.t), options, defaultIndex: def, note: options.length ? null : 'No connection you know of within two days' };
}
