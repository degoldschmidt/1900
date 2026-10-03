/**
 * The typed C07 bundle: the compiled (or preview) ReadyBundle, its columnar timetable, design
 * values and lookups. Static data only; handlers reach it through `ctx.bundle`, never through a
 * module-level reference (a restored game never runs init).
 */
import type { ReadyBundle, GameBundle, DesignValueRow } from '#kit/data/bundle.ts';
import type { InstitutionRow, ParamRow } from '#kit/params/types.ts';
import type { CityRow, StationRow, EditionRow } from '#kit/timetable/types.ts';
import { Timetable } from '#kit/timetable/model.ts';
import { isReady } from '#kit/data/bundle.ts';
import type { Instant } from '#kit/time/instant.ts';
import { toLocal, toInstant } from '#kit/time/zones.ts';

/** The parameter rows the rules read: the full layer, or the public view (same lookups). */
export interface Rows {
  get<T>(param: string, key: string, day: number): T | undefined;
  row(param: string, key: string, day: number): ParamRow | undefined;
  rowsFor(param: string): readonly ParamRow[];
}

/**
 * The preview world's map (Decision P-012): an invented geography in a fixed coordinate space
 * (x right, y down), drawn to agree with the timetable. Presentation only: the rules never read it.
 */
export interface MapLayer {
  width: number; height: number;
  /** The land outline; everything outside it is sea. */
  land: Array<[number, number]>;
  /** Inland water drawn over the land. */
  water: Array<{ id: string; name: string; poly: Array<[number, number]> }>;
  countries: Array<{ id: string; name: string; label: [number, number]; poly: Array<[number, number]> }>;
  borders: Array<{ a: string; b: string; line: Array<[number, number]> }>;
  labels: Array<{ text: string; at: [number, number]; rotate: number; kind: 'sea' | 'lake' }>;
  cities: Array<{ id: string; x: number; y: number; label: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' }>;
  stations: Array<{ id: string; x: number; y: number }>;
  /** One polyline per pair of consecutive stops in the timetable (rail, or a steamer's water route). */
  segments: Array<{ a: string; b: string; mode: 'rail' | 'steamer'; line: Array<[number, number]> }>;
}

export interface C07Bundle {
  raw: ReadyBundle;
  /** The map layer, when the data carries one (the preview world does). */
  map: MapLayer | null;
  tt: Timetable;
  dv: ReadonlyMap<string, unknown>;
  city: ReadonlyMap<string, CityRow>;
  station: ReadonlyMap<string, StationRow>;
  edition: ReadonlyMap<string, EditionRow>;
  inst: ReadonlyMap<string, InstitutionRow>;
  /** Cities that have venues beyond a station (the scope cities). */
  gameCities: readonly string[];
  /** Display unit per currency code (synthetic currencies). */
  units: Readonly<Record<string, string>>;
}

export function dvOf<T>(dv: ReadonlyMap<string, unknown>, id: string): T {
  if (!dv.has(id)) throw new Error(`Design value ${id} is missing from the bundle`);
  return dv.get(id) as T;
}

export function makeBundle(raw: GameBundle): C07Bundle {
  if (!isReady(raw)) throw new Error('C07 needs a ready data bundle');
  const r = raw as ReadyBundle;
  const dv = new Map<string, unknown>(r.designValues.map((v: DesignValueRow) => [v.id, v.value] as const));
  const minChange = (dvOf<{ minChange: number }>(dv, 'DV-C07-022')).minChange;
  const tt = new Timetable(r, { defaultMinChangeSec: minChange });
  const game = r.cities.filter((c) => r.institutions.some((i) => i.city === c.id && i.kind === 'post')).map((c) => c.id).sort();
  const units = (dv.get('DV-SYN-008') as Record<string, string> | undefined) ?? {};
  return {
    raw: r, tt, dv, map: ((raw as { map?: MapLayer }).map ?? null),
    city: new Map(r.cities.map((c) => [c.id, c] as const)),
    station: new Map(r.stations.map((s) => [s.id, s] as const)),
    edition: new Map(r.editions.map((e) => [e.id, e] as const)),
    inst: new Map(r.institutions.map((i) => [i.id, i] as const)),
    gameCities: game,
    units,
  };
}

export const dv = <T>(b: C07Bundle, id: string): T => dvOf<T>(b.dv, id);

export function cityOfStation(b: C07Bundle, station: string): string {
  const s = b.station.get(station);
  if (!s) throw new Error(`Unknown station ${station}`);
  return s.city;
}

/** City of a record place (a station or a city id). */
export function cityOfPlace(b: C07Bundle, place: string): string {
  return b.station.get(place)?.city ?? place;
}

export function stationsOfCity(b: C07Bundle, city: string): string[] {
  return b.raw.stations.filter((s) => s.city === city).map((s) => s.id);
}

export function jurOfCity(b: C07Bundle, city: string): string {
  const c = b.city.get(city);
  if (!c) throw new Error(`Unknown city ${city}`);
  return c.jurisdiction;
}

/** Civil offset of a city on a day (seconds east of Greenwich). */
export function cityOffset(b: C07Bundle, city: string, day: number): number {
  const c = b.city.get(city);
  if (!c) throw new Error(`Unknown city ${city}`);
  return b.tt.zones.offset(c.civilZone, day);
}

/** Local civil (day, seconds) in a city. */
export function localIn(b: C07Bundle, city: string, t: Instant): { day: number; sec: number } {
  const approx = toLocal(t, cityOffset(b, city, Math.floor(t / 86400)));
  return toLocal(t, cityOffset(b, city, approx.day));
}

/** Instant of local civil (day, sec) in a city. */
export function instantIn(b: C07Bundle, city: string, day: number, sec: number): Instant {
  return toInstant(day, sec, cityOffset(b, city, day));
}

/** Institutions of a kind in a city, sorted by id. */
export function instIn(b: C07Bundle, city: string, kind: InstitutionRow['kind']): InstitutionRow[] {
  return b.raw.institutions.filter((i) => i.city === city && i.kind === kind).sort((x, y) => (x.id < y.id ? -1 : 1));
}

/** A jurisdiction-wide institution of a kind (city null), or null. */
export function instOfJur(b: C07Bundle, jur: string, kind: InstitutionRow['kind']): InstitutionRow | null {
  return b.raw.institutions.find((i) => i.city === null && i.jurisdiction === jur && i.kind === kind) ?? null;
}

export const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
