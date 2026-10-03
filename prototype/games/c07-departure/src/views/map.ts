/**
 * The map (Decision P-012): the home screen's geometry and what lies on it now. The static layer
 * comes from the data's map; the player's token, the goal pin, the cities a single train reaches
 * from here, the booked route, night and the police attention the player knows of (own trail and
 * what the player has noticed, never the hunt) come from the public state.
 */
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, MapLayer } from '../rules/data.ts';
import { cityOfStation, cityOfPlace, localIn, stationsOfCity } from '../rules/data.ts';
import { plannerView as knownView } from '../rules/knowledge.ts';
import { trailReach } from '../rules/forecast.ts';
import type { PublicState, ViewData } from './public.ts';
import { cityName } from './format.ts';
import { goalView } from './goal.ts';

type Pt = [number, number];

export interface MapGeometry {
  width: number; height: number;
  land: string;
  water: Array<{ id: string; name: string; d: string }>;
  countries: Array<{ id: string; name: string; d: string; label: Pt }>;
  borders: string[];
  labels: MapLayer['labels'];
  segments: Array<{ key: string; a: string; b: string; mode: 'rail' | 'steamer'; d: string }>;
  /** Bounds of every city, for fitting the whole map. */
  bounds: [number, number, number, number];
}

export interface MapCity {
  id: string; name: string; x: number; y: number; label: MapLayer['cities'][number]['label'];
  /** A town of the game (bank, post, hotels) or a frontier halt. */
  kind: 'town' | 'halt';
  here: boolean; goal: boolean;
  /** One train from here reaches it within a day. */
  direct: boolean;
  /** Police attention the player knows of: 0 none, 1 a record they could hold, 2 several or a frontier register, 3 a watcher seen. */
  attention: 0 | 1 | 2 | 3;
}

export interface MapViewModel {
  geo: MapGeometry;
  cities: MapCity[];
  me: { x: number; y: number; city: string | null };
  goal: { city: string; x: number; y: number; label: string } | null;
  /** The booked journey still ahead, as one path. */
  route: string | null;
  night: boolean;
  /** Bounds to frame on a small screen: here, the goal and the places one train reaches. */
  focus: [number, number, number, number];
}

const fmt = (n: number): string => String(Math.round(n * 10) / 10);
export const pathOf = (pts: readonly Pt[], close = false): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join('') + (close ? 'Z' : '');

export const segKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

const geoCache = new WeakMap<object, MapGeometry>();
/** The static map geometry of a bundle (cached per bundle). */
export function mapGeometry(b: C07Bundle): MapGeometry {
  const m = b.map;
  if (!m) throw new Error('This data carries no map');
  let g = geoCache.get(m);
  if (g) return g;
  const xs = m.cities.map((c) => c.x); const ys = m.cities.map((c) => c.y);
  g = {
    width: m.width, height: m.height, land: pathOf(m.land, true),
    water: m.water.map((w) => ({ id: w.id, name: w.name, d: pathOf(w.poly, true) })),
    countries: m.countries.map((c) => ({ id: c.id, name: c.name, d: pathOf(c.poly, true), label: c.label })),
    borders: m.borders.map((x) => pathOf(x.line)),
    labels: m.labels,
    segments: m.segments.map((s) => ({ key: segKey(s.a, s.b), a: s.a, b: s.b, mode: s.mode, d: pathOf(s.line) })),
    bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
  };
  geoCache.set(m, g);
  return g;
}

/** The polyline from station a to station b along one map segment (reversed when needed), or a straight cab ride. */
export function segmentLine(b: C07Bundle, a: string, z: string): Pt[] {
  const m = b.map!;
  const s = m.segments.find((x) => (x.a === a && x.b === z) || (x.a === z && x.b === a));
  if (s) return s.a === a ? s.line : [...s.line].reverse();
  const p = (id: string): Pt => { const st = m.stations.find((x) => x.id === id); return st ? [st.x, st.y] : cityPoint(b, cityOfStation(b, id)); };
  return [p(a), p(z)];
}

export function cityPoint(b: C07Bundle, city: string): Pt {
  const c = b.map?.cities.find((x) => x.id === city);
  return c ? [c.x, c.y] : [0, 0];
}

export function stationPoint(b: C07Bundle, station: string): Pt {
  const s = b.map?.stations.find((x) => x.id === station);
  return s ? [s.x, s.y] : cityPoint(b, cityOfStation(b, station));
}

/** The stations a trip calls at from `from` to `to`, in order (inclusive). */
export function callsBetween(b: C07Bundle, tripId: string, from: string, to: string): number[] {
  const tt = b.tt; const i = tt.trip(tripId); const t = tt.trips[i]!;
  const out: number[] = [];
  let on = false;
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
    const st = tt.stationIds[tt.stopStation[j]!]!;
    if (!on && st === from && tt.stopDep[j]! >= 0) on = true;
    if (on) out.push(j);
    if (on && st === to && out.length > 1) break;
  }
  return out;
}

/** A leg's path on the map: the segments between its calls. */
export function legLine(b: C07Bundle, tripId: string, from: string, to: string): Pt[] {
  const tt = b.tt;
  const js = callsBetween(b, tripId, from, to);
  const pts: Pt[] = [];
  for (let k = 0; k + 1 < js.length; k++) {
    const line = segmentLine(b, tt.stationIds[tt.stopStation[js[k]!]!]!, tt.stationIds[tt.stopStation[js[k + 1]!]!]!);
    pts.push(...(k === 0 ? line : line.slice(1)));
  }
  return pts.length ? pts : [stationPoint(b, from), stationPoint(b, to)];
}

/** Cities one known train from here reaches within a day (the map's emphasis). */
export function directCities(p: PublicState, d: ViewData): Set<string> {
  const out = new Set<string>();
  if (p.me.where.k !== 'city' || p.ending) return out;
  const b = d.b; const tt = b.tt; const here = p.me.where.city;
  const view = knownView(b, d.params, p);
  const st = new Set(stationsOfCity(b, here).map((x) => tt.st(x)));
  const until = d.now + 86400;
  tt.trips.forEach((t, i) => {
    for (let day = dayOf(d.now) - 2; day <= dayOf(until); day++) {
      if (!view.uses(i, day)) continue;
      for (let j = t.firstStop; j < t.firstStop + t.nStops - 1; j++) {
        if (!st.has(tt.stopStation[j]!) || tt.stopDep[j]! < 0) continue;
        const dep = tt.depAt(j, day)!;
        if (dep < d.now || dep > until) continue;
        for (let k = j + 1; k < t.firstStop + t.nStops; k++) {
          const c = cityOfStation(b, tt.stationIds[tt.stopStation[k]!]!);
          if (c !== here) out.add(c);
        }
      }
    }
  });
  return out;
}

/** Police attention the player knows of, per city: from the own trail and the watchers noticed. */
export function attentionByCity(p: PublicState, d: ViewData): Map<string, 0 | 1 | 2 | 3> {
  const b = d.b; const out = new Map<string, 0 | 1 | 2 | 3>();
  const recs = d.trail.records;
  const reach = trailReach(b, d.params, recs);
  const count = new Map<string, number>();
  recs.forEach((r, i) => {
    if (!r.place || r.subject.startsWith('anon:') || r.subject.startsWith('watch:')) return;
    const police = reach[i]!.reach.some((x) => b.inst.get(x.reader)?.kind === 'police' && r.time + x.minSec <= d.now);
    if (!police) return;
    const city = cityOfPlace(b, r.place);
    count.set(city, (count.get(city) ?? 0) + (r.kind === 'frontier.passport' ? 2 : 1));
  });
  for (const [city, n] of count) out.set(city, n >= 2 ? 2 : 1);
  for (const it of p.diary.interrupts) {
    if (it.kind !== 'noticed') continue;
    const ref = (it.ref ?? {}) as { city?: string; station?: string };
    const city = ref.city ?? (ref.station ? cityOfStation(b, ref.station) : null);
    if (city) out.set(city, 3);
  }
  return out;
}

/** Whether it is night where the player is (the map dims). */
export function isNight(p: PublicState, d: ViewData, t: Instant = d.now): boolean {
  const city = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(d.b, p.me.where.ride.to);
  const h = Math.floor(localIn(d.b, city, t).sec / 3600);
  return h < 6 || h >= 20;
}

export function mapView(p: PublicState, d: ViewData, t: Instant = d.now): MapViewModel {
  const b = d.b; const m = b.map!;
  const geo = mapGeometry(b);
  const goal = goalView(p, d);
  const direct = directCities(p, d);
  const att = attentionByCity(p, d);
  const here = p.me.where.k === 'city' ? p.me.where.city : null;
  const cities: MapCity[] = m.cities.map((c) => ({
    id: c.id, name: cityName(b, c.id), x: c.x, y: c.y, label: c.label,
    kind: b.gameCities.includes(c.id) ? 'town' : 'halt',
    here: c.id === here, goal: goal.city === c.id, direct: direct.has(c.id), attention: att.get(c.id) ?? 0,
  }));
  const me = p.me.where.k === 'city' ? { city: here, ...xy(cityPoint(b, here!)) } : { city: null, ...xy(stationPoint(b, p.me.where.ride.from)) };
  const bk = p.diary.booking;
  let route: string | null = null;
  if (bk && bk.next < bk.legs.length) {
    const pts: Pt[] = [];
    for (const l of bk.legs.slice(bk.next)) pts.push(...legLine(b, l.tripId, l.from, l.to));
    route = pathOf(pts);
  } else if (p.me.where.k === 'aboard') {
    const r = p.me.where.ride; route = pathOf(legLine(b, r.tripId, r.from, r.to));
  }
  const gp = goal.city ? cityPoint(b, goal.city) : null;
  const focusPts: Pt[] = [[me.x, me.y]];
  if (gp) focusPts.push(gp);
  for (const c of cities) if (c.direct && c.kind === 'town') focusPts.push([c.x, c.y]);
  const fx = focusPts.map((q) => q[0]); const fy = focusPts.map((q) => q[1]);
  return {
    geo, cities, me,
    goal: goal.city && gp ? { city: goal.city, x: gp[0], y: gp[1], label: goal.deadlineShort ?? '' } : null,
    route, night: isNight(p, d, t),
    focus: [Math.min(...fx), Math.min(...fy), Math.max(...fx), Math.max(...fy)],
  };
}

const xy = (q: Pt): { x: number; y: number } => ({ x: q[0], y: q[1] });
