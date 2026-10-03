/**
 * DepartureBoard (RULES.md 9): the departures the player knows of from a station, each with its
 * source (guide edition, porter, board, cable), confidence, date learned and citation, and the
 * delays the player has learned. Never the truth on the ground.
 */
import { dayOf } from '#kit/time/instant.ts';
import { cityOfStation, stationsOfCity, dv } from '../rules/data.ts';
import { plannerView } from '../rules/knowledge.ts';
import type { PublicState, ViewData } from './public.ts';
import { stationClock, stationName, cityName, citation, type Clock, type CitationView } from './format.ts';
import { sourceOf, type SourceView } from './planner.ts';

export interface BoardRow {
  tripId: string; trainKey: string; trainNo: string; name: string | null; mode: string; day: number; dep: Clock;
  terminus: string; terminusName: string; calls: Array<{ station: string; name: string; arr: Clock }>;
  classes: number[]; sleeper: boolean; source: SourceView; citation: CitationView | null;
  learnedDelaySec: number | null;
}

export interface BoardViewModel { station: string; stationName: string; city: string; cityName: string; from: Clock; until: Clock; rows: BoardRow[]; otherStations: string[] }

export function boardView(p: PublicState, d: ViewData, station: string, horizonSec?: number): BoardViewModel {
  const b = d.b; const tt = b.tt;
  const st = tt.st(station);
  const until = d.now + (horizonSec ?? dv<{ board: number }>(b, 'DV-C07-070').board);
  const view = plannerView(b, d.params, p);
  const rows: BoardRow[] = [];
  tt.trips.forEach((t, i) => {
    for (let day = dayOf(d.now) - 3; day <= dayOf(until); day++) {
      if (!view.uses(i, day)) continue;
      for (let j = t.firstStop; j < t.firstStop + t.nStops - 1; j++) {
        if (tt.stopStation[j] !== st || tt.stopDep[j]! < 0) continue;
        const dep = tt.depAt(j, day)!;
        if (dep < d.now || dep > until) continue;
        const calls: BoardRow['calls'] = [];
        for (let k = j + 1; k < t.firstStop + t.nStops; k++) {
          const sid = tt.stationIds[tt.stopStation[k]!]!;
          calls.push({ station: sid, name: stationName(b, sid), arr: stationClock(b, sid, tt.arrAt(k, day)!) });
        }
        const last = calls[calls.length - 1]!;
        const delay = p.knowledge.delays.find((x) => x.trainKey === t.trainKey && x.day === day && x.station === station);
        rows.push({
          tripId: t.id, trainKey: t.trainKey, trainNo: t.trainNo, name: t.name, mode: t.mode, day, dep: stationClock(b, station, dep),
          terminus: last.station, terminusName: last.name, calls, classes: [1, 2, 3].filter((c) => (t.classMask & (1 << (c - 1))) !== 0), sleeper: t.sleeper,
          source: sourceOf(d, p, i), citation: citation(b, b.raw.stops.cite[j] ?? t.cite), learnedDelaySec: delay ? delay.delaySec : null,
        });
      }
    }
  });
  rows.sort((x, y) => x.dep.t - y.dep.t || (x.trainKey < y.trainKey ? -1 : 1));
  const city = cityOfStation(b, station);
  return {
    station, stationName: stationName(b, station), city, cityName: cityName(b, city), from: stationClock(b, station, d.now), until: stationClock(b, station, until),
    rows, otherStations: stationsOfCity(b, city).filter((x) => x !== station),
  };
}
