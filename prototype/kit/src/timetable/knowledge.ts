/**
 * What an agent knows of the network. A KnownGraph (plain data, kept in game state) lists the
 * guide editions it owns and individual trains it has learned of (from a porter, a station board,
 * a cable) or found missing. Planners and hunters route on their own view, never on the truth;
 * the simulation executes the truth and reports ghost connections when they differ.
 */
import type { Timetable } from './model.ts';
import type { GraphView } from './expand.ts';
import type { DayNumber } from '../time/calendar.ts';
import type { Instant } from '../time/instant.ts';

export type KnowledgeSource = 'guide' | 'porter' | 'board' | 'cable' | 'observed';

export interface LearnedEdge {
  trainKey: string;
  /** Which edition's version of the train the agent believes in. */
  edition: string;
  source: KnowledgeSource;
  learnedDay: DayNumber;
  /** 0–1000; 0 means "known not to run" (overrides the guide). */
  confidence: number;
}

export interface KnownGraph {
  id: string;
  version: number;
  editions: string[];
  learned: LearnedEdge[];
}

export function newKnownGraph(id: string, editions: string[]): KnownGraph {
  return { id, version: 0, editions: [...editions].sort(), learned: [] };
}

export function addEdition(kg: KnownGraph, edition: string): void {
  if (!kg.editions.includes(edition)) { kg.editions.push(edition); kg.editions.sort(); kg.version++; }
}

export function learn(kg: KnownGraph, edge: LearnedEdge): void {
  const i = kg.learned.findIndex((e) => e.trainKey === edge.trainKey && e.edition === edge.edition);
  if (i >= 0) kg.learned[i] = edge; else kg.learned.push(edge);
  kg.learned.sort((a, b) => (a.trainKey < b.trainKey ? -1 : a.trainKey > b.trainKey ? 1 : a.edition < b.edition ? -1 : a.edition > b.edition ? 1 : 0));
  kg.version++;
}

/** Trips usable in the agent's view: printed in an owned edition or learned, minus those known not to run. */
export function knownView(tt: Timetable, kg: KnownGraph): GraphView {
  const learned = new Map(kg.learned.map((e) => [`${e.trainKey}\u0000${e.edition}`, e.confidence] as const));
  const editions = new Set(kg.editions);
  return {
    key: `kg:${kg.id}@${kg.version}`,
    uses: (trip, day) => {
      const t = tt.trips[trip]!;
      const conf = learned.get(`${t.trainKey}\u0000${t.edition}`);
      if (conf === 0) return false;
      if (!editions.has(t.edition) && conf === undefined) return false;
      return tt.printedRuns(trip, day);
    },
  };
}

export type GhostStatus = 'ok' | 'withdrawn' | 'retimed' | 'notThatDay' | 'suspended';

export interface GhostResult { status: GhostStatus; truthTrip: number | null; truthDep: Instant | null }

function stopAt(tt: Timetable, trip: number, station: number): number | null {
  const t = tt.trips[trip]!;
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) if (tt.stopStation[j] === station && tt.stopDep[j]! >= 0) return j;
  return null;
}

/**
 * Compares a planned departure (a trip the agent believes in, boarding at `station` on service
 * day `day`) with the truth on the ground.
 */
export function ghostCheck(tt: Timetable, plannedTrip: number, station: number, day: DayNumber, suspended?: (trip: number, day: DayNumber) => boolean): GhostResult {
  const key = tt.trips[plannedTrip]!.trainKey;
  const truth = (tt.tripsByKey.get(key) ?? []).filter((i) => tt.trips[i]!.truth.some(([a, b]) => day >= a && day <= b));
  const cand = truth[0];
  if (cand === undefined) return { status: 'withdrawn', truthTrip: null, truthDep: null };
  if (!tt.truthRuns(cand, day)) return { status: 'notThatDay', truthTrip: cand, truthDep: null };
  const truthStop = stopAt(tt, cand, station);
  if (truthStop === null) return { status: 'withdrawn', truthTrip: cand, truthDep: null };
  const truthDep = tt.depAt(truthStop, day);
  if (suspended?.(cand, day)) return { status: 'suspended', truthTrip: cand, truthDep };
  const plannedStop = stopAt(tt, plannedTrip, station);
  const plannedDep = plannedStop === null ? null : tt.depAt(plannedStop, day);
  if (plannedDep !== truthDep) return { status: 'retimed', truthTrip: cand, truthDep };
  return { status: 'ok', truthTrip: cand, truthDep };
}
