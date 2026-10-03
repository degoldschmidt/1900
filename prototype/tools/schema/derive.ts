/**
 * Derived views of a dataset shared by the validators and the compiler: indexes, edition windows,
 * zone offsets, absolute stop times and truth ranges.
 */
import type { Dataset } from './dataset.ts';
import type { EditionCsvRow, ServiceRow, StopRow } from './canonical.ts';
import { cmpStr } from './csv.ts';
import { isoFromDay } from '#kit/time/calendar.ts';

export type Range = [number, number];

export function indexBy<T>(rows: readonly T[], key: (r: T) => string): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) m.set(key(r), r);
  return m;
}

export function groupBy<T>(rows: readonly T[], key: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const l = m.get(k);
    if (l) l.push(r); else m.set(k, [r]);
  }
  return m;
}

/** Stops of every service, sorted by seq. */
export function stopsByService(ds: Dataset): Map<string, StopRow[]> {
  const m = groupBy(ds.t.stops, (s) => s.service_id);
  for (const l of m.values()) l.sort((a, b) => a.seq - b.seq);
  return m;
}

/** "HH:MM" → seconds after midnight. */
export function secOfHm(hm: string): number {
  return Number(hm.slice(0, 2)) * 3600 + Number(hm.slice(3, 5)) * 60;
}

/** "HH:MM" from seconds after midnight (0 ≤ sec < 86400). */
export function hmOfSec(sec: number): string {
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** The inclusive day range an edition is checked over (open-ended: capped at capDays). */
export function editionRange(e: EditionCsvRow, capDays: number): Range {
  return [e.valid_from, e.valid_to ?? e.valid_from + capDays - 1];
}

export function intersectRanges(a: readonly Range[], b: readonly Range[]): Range[] {
  const out: Range[] = [];
  for (const [a0, a1] of a) for (const [b0, b1] of b) {
    const x = Math.max(a0, b0); const y = Math.min(a1, b1);
    if (x <= y) out.push([x, y]);
  }
  return mergeRanges(out);
}

export function mergeRanges(list: readonly Range[]): Range[] {
  const s = list.map((r) => [r[0], r[1]] as Range).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: Range[] = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

export const inRanges = (rs: readonly Range[], d: number): boolean => rs.some(([a, b]) => d >= a && d <= b);

export interface ZoneLookup {
  /** Offset of a station's railway zone on a day, or a reason it has none (or more than one). */
  railwayOffset(station: string, day: number): { offset: number; zone: string } | { error: string };
  /** Offset of a zone on a day. */
  zoneOffset(zone: string, day: number): number | null;
}

const covers = (from: number, to: number | null, d: number): boolean => d >= from && (to === null || d <= to);

export function zoneLookup(ds: Dataset): ZoneLookup {
  const zones = groupBy(ds.t.zones, (z) => z.zone_id);
  const st = groupBy(ds.t.station_zones, (s) => s.station_id);
  const zoneOffset = (zone: string, day: number): number | null => {
    const rows = (zones.get(zone) ?? []).filter((z) => covers(z.from, z.to, day));
    return rows.length === 1 ? rows[0]!.offset_seconds : null;
  };
  return {
    zoneOffset,
    railwayOffset(station, day) {
      const rows = (st.get(station) ?? []).filter((s) => covers(s.from, s.to, day) &&
        (zones.get(s.zone_id) ?? []).some((z) => z.applies_to === 'railway' && covers(z.from, z.to, day)));
      if (rows.length === 0) return { error: `station ${station} has no railway zone on ${isoFromDay(day)}` };
      if (rows.length > 1) return { error: `station ${station} has ${rows.length} railway zones on ${isoFromDay(day)}` };
      const zone = rows[0]!.zone_id;
      const off = zoneOffset(zone, day);
      if (off === null) return { error: `zone ${zone} has no single offset on ${isoFromDay(day)}` };
      return { offset: off, zone };
    },
  };
}

export interface AbsStop {
  stop: StopRow;
  /** Seconds since 00:00 GMT of the service day (local time − zone offset + 86400 × day offset). */
  arr: number | null;
  dep: number | null;
}

/**
 * Absolute times of a service's stops for a service day (zones looked up on the day each time
 * falls). Returns the problems instead when a zone is missing.
 */
export function absStops(stops: readonly StopRow[], zl: ZoneLookup, serviceDay: number): { stops: AbsStop[]; errors: string[] } {
  const errors: string[] = [];
  const out: AbsStop[] = [];
  for (const s of stops) {
    const one = (hm: string, off: number | null): number | null => {
      if (!hm) return null;
      const day = serviceDay + (off ?? 0);
      const z = zl.railwayOffset(s.station_id, day);
      if ('error' in z) { errors.push(z.error); return null; }
      return (off ?? 0) * 86400 + secOfHm(hm) - z.offset;
    };
    out.push({ stop: s, arr: one(s.arr_local, s.arr_dayoff), dep: one(s.dep_local, s.dep_dayoff) });
  }
  return { stops: out, errors };
}

/**
 * Days on which a service is the truth on the ground: inside its edition's validity and, for
 * every segment it serves, inside a rank-1 segment_sources row naming its edition. (A trip
 * serving several segments is truth on the intersection.)
 */
export function truthRanges(ds: Dataset, svc: ServiceRow, capDays: number): Range[] {
  const ed = ds.t.editions.find((e) => e.edition_id === svc.edition_id);
  if (!ed) return [];
  let acc: Range[] = [editionRange(ed, capDays)];
  for (const seg of [...svc.segment_ids].sort(cmpStr)) {
    const rows = ds.t.segment_sources.filter((r) => r.segment_id === seg && r.edition_id === svc.edition_id && r.rank === 1);
    acc = intersectRanges(acc, rows.map((r) => [r.date_from, r.date_to] as Range));
    if (acc.length === 0) break;
  }
  return acc;
}

/** Haversine distance in km (tools only; not used in simulation code). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad; const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
