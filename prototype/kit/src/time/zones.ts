/**
 * Clock zones. Each country kept its own railway (and civil) time, recorded as dated rows with
 * offsets in seconds east of Greenwich (Petersburg railway time, Amsterdam time and Paris time
 * had odd-second offsets). Timetable times are local to the station's railway zone.
 */
import type { ZoneRow, StationZoneRow } from '../timetable/types.ts';
import type { DayNumber } from './calendar.ts';
import type { Instant } from './instant.ts';
import { instantOf, dayOf, SECONDS_PER_DAY } from './instant.ts';

const validOn = (from: number, to: number | null, day: number): boolean => from <= day && (to === null || day < to);

export class ZoneTable {
  private readonly zones = new Map<string, ZoneRow[]>();
  private readonly stations = new Map<string, StationZoneRow[]>();

  constructor(zones: readonly ZoneRow[], stationZones: readonly StationZoneRow[]) {
    for (const z of zones) (this.zones.get(z.id) ?? this.zones.set(z.id, []).get(z.id)!).push(z);
    for (const s of stationZones) (this.stations.get(s.station) ?? this.stations.set(s.station, []).get(s.station)!).push(s);
  }

  /** Offset (seconds east of Greenwich) of a zone on a day. */
  offset(zoneId: string, day: DayNumber): number {
    const rows = this.zones.get(zoneId);
    const r = rows?.find((z) => validOn(z.from, z.to, day));
    if (!r) throw new Error(`No offset for zone ${zoneId} on day ${day}`);
    return r.offsetSec;
  }

  /** The railway zone of a station on a day. */
  zoneOfStation(station: string, day: DayNumber): string {
    const rows = this.stations.get(station);
    const r = rows?.find((s) => validOn(s.from, s.to, day));
    if (!r) throw new Error(`No zone for station ${station} on day ${day}`);
    return r.zone;
  }

  stationOffset(station: string, day: DayNumber): number {
    return this.offset(this.zoneOfStation(station, day), day);
  }
}

/** Local wall-clock (day, seconds after midnight) in a zone → Instant. */
export const toInstant = (localDay: DayNumber, localSec: number, offsetSec: number): Instant =>
  instantOf(localDay, localSec) - offsetSec;

/** Instant → local wall clock in a zone with the given offset. */
export function toLocal(i: Instant, offsetSec: number): { day: DayNumber; sec: number } {
  const local = i + offsetSec;
  const day = dayOf(local);
  return { day, sec: local - day * SECONDS_PER_DAY };
}
