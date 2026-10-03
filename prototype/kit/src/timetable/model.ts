/**
 * Columnar timetable model built from bundle data. Stations, trips and stops become integer
 * indices and typed arrays; times stay as printed (local railway time + day offset) and are
 * converted to Instants per service day with the station's zone offset on that day.
 */
import type { TimetableData, TripRow, RunRule } from './types.ts';
import { ZoneTable, toInstant } from '../time/zones.ts';
import type { DayNumber } from '../time/calendar.ts';
import { weekday } from '../time/calendar.ts';
import type { Instant } from '../time/instant.ts';

export interface TimetableOptions {
  /** Minimum change time where the data gives none (a design value, in seconds). */
  defaultMinChangeSec: number;
}

export interface Footpath { to: number; sec: number }

export function runsOn(run: RunRule, day: DayNumber): boolean {
  if (run.except.includes(day)) return false;
  if (run.also.includes(day)) return true;
  const bit = 1 << weekday(day);
  for (const [from, to, mask] of run.ranges) if (day >= from && day <= to && (mask & bit) !== 0) return true;
  return false;
}

export class Timetable {
  readonly data: TimetableData;
  readonly zones: ZoneTable;
  readonly stationIds: string[];
  readonly stationIndex = new Map<string, number>();
  readonly cityOfStation: string[];
  readonly stationsOfCity = new Map<string, number[]>();
  readonly trips: readonly TripRow[];
  readonly tripIndex = new Map<string, number>();
  readonly tripsByKey = new Map<string, number[]>();
  readonly stopStation: Int32Array;
  readonly stopArr: Int32Array;
  readonly stopDep: Int32Array;
  readonly stopArrDay: Int32Array;
  readonly stopDepDay: Int32Array;
  readonly stopFlags: Int32Array;
  readonly minChange: Int32Array;
  readonly footpaths: Footpath[][];
  /** For a trip B: the trips A that run through into B, and where. */
  readonly throughInto = new Map<number, Array<{ fromTrip: number; station: number }>>();

  constructor(data: TimetableData, opts: TimetableOptions) {
    this.data = data;
    this.zones = new ZoneTable(data.zones, data.stationZones);
    this.stationIds = data.stations.map((s) => s.id);
    this.stationIds.forEach((id, i) => this.stationIndex.set(id, i));
    this.cityOfStation = data.stations.map((s) => s.city);
    this.cityOfStation.forEach((c, i) => (this.stationsOfCity.get(c) ?? this.stationsOfCity.set(c, []).get(c)!).push(i));
    this.trips = data.trips;
    data.trips.forEach((t, i) => {
      this.tripIndex.set(t.id, i);
      (this.tripsByKey.get(t.trainKey) ?? this.tripsByKey.set(t.trainKey, []).get(t.trainKey)!).push(i);
    });
    const s = data.stops;
    this.stopStation = Int32Array.from(s.station);
    this.stopArr = Int32Array.from(s.arr);
    this.stopDep = Int32Array.from(s.dep);
    this.stopArrDay = Int32Array.from(s.arrDay);
    this.stopDepDay = Int32Array.from(s.depDay);
    this.stopFlags = Int32Array.from(s.flags);
    this.minChange = new Int32Array(this.stationIds.length).fill(opts.defaultMinChangeSec);
    for (const m of data.minChange) this.minChange[this.st(m.station)] = m.minSec;
    this.footpaths = this.stationIds.map(() => [] as Footpath[]);
    for (const f of data.transfers) {
      const a = this.st(f.from); const b = this.st(f.to);
      if (a !== b) this.footpaths[a]!.push({ to: b, sec: f.minSec });
    }
    for (const fp of this.footpaths) fp.sort((x, y) => x.to - y.to);
    for (const l of data.throughLinks) {
      const to = this.tripIndex.get(l.toTrip); const from = this.tripIndex.get(l.fromTrip);
      if (to === undefined || from === undefined) throw new Error(`Through link names an unknown trip ${l.fromTrip}→${l.toTrip}`);
      (this.throughInto.get(to) ?? this.throughInto.set(to, []).get(to)!).push({ fromTrip: from, station: this.st(l.station) });
    }
  }

  st(id: string): number {
    const i = this.stationIndex.get(id);
    if (i === undefined) throw new Error(`Unknown station ${id}`);
    return i;
  }

  trip(id: string): number {
    const i = this.tripIndex.get(id);
    if (i === undefined) throw new Error(`Unknown trip ${id}`);
    return i;
  }

  /** Does the printed rule say this trip runs on this service day? */
  printedRuns(trip: number, day: DayNumber): boolean {
    return runsOn(this.trips[trip]!.run, day);
  }

  /** Is this trip the truth on the ground on this service day (truth edition, and running)? */
  truthRuns(trip: number, day: DayNumber): boolean {
    const t = this.trips[trip]!;
    return t.truth.some(([a, b]) => day >= a && day <= b) && runsOn(t.run, day);
  }

  /** Departure instant of stop k (absolute stop index) for a service day, or null. */
  depAt(stop: number, serviceDay: DayNumber): Instant | null {
    const sec = this.stopDep[stop]!;
    if (sec < 0) return null;
    const d = serviceDay + this.stopDepDay[stop]!;
    return toInstant(d, sec, this.zones.stationOffset(this.stationIds[this.stopStation[stop]!]!, d));
  }

  /** Arrival instant of stop k for a service day (falls back to departure), or null. */
  arrAt(stop: number, serviceDay: DayNumber): Instant | null {
    const sec = this.stopArr[stop]!;
    if (sec < 0) return this.depAt(stop, serviceDay);
    const d = serviceDay + this.stopArrDay[stop]!;
    return toInstant(d, sec, this.zones.stationOffset(this.stationIds[this.stopStation[stop]!]!, d));
  }
}
