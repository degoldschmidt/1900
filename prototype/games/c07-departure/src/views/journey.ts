/**
 * The journey on the map (Decision P-012): where the player's token stands at a display time while
 * the clock runs, and one line for the strip under the map. Aboard, the token moves along the
 * train's calls on its timetable, stretched by the delay shown so far; past the timetabled arrival
 * of a late train it waits short of the station until the train is in. Public state only.
 */
import type { Instant } from '#kit/time/instant.ts';
import { cityOfStation } from '../rules/data.ts';
import type { PublicState, ViewData } from './public.ts';
import { stationClock, cityName, span, clock as clockAt, type Clock } from './format.ts';
import { cityPoint, stationPoint, callsBetween, segmentLine } from './map.ts';

type Pt = [number, number];

export interface JourneyViewModel {
  phase: 'town' | 'waiting' | 'change' | 'aboard';
  token: { x: number; y: number };
  /** The strip's line: "Aboard the Corvenian Mail to Corlaine". */
  line: string;
  /** "due 14.20 · running 25 min late". */
  sub: string | null;
  /** The span the clock is crossing now, for pacing the animation. */
  phaseEnd: Instant | null;
}

function along(pts: readonly Pt[], f: number): Pt {
  if (pts.length < 2) return pts[0] ?? [0, 0];
  const lens: number[] = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]); lens.push(l); total += l; }
  let left = Math.max(0, Math.min(1, f)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]! || i === lens.length - 1) {
      const k = lens[i]! ? Math.min(1, left / lens[i]!) : 0;
      return [pts[i]![0] + (pts[i + 1]![0] - pts[i]![0]) * k, pts[i]![1] + (pts[i + 1]![1] - pts[i]![1]) * k];
    }
    left -= lens[i]!;
  }
  return pts[pts.length - 1]!;
}

function trainWord(d: ViewData, tripId: string): string {
  const t = d.b.tt.trips[d.b.tt.trip(tripId)]!;
  if (t.mode !== 'rail') return t.name ? `the ${t.name}` : 'the steamer';
  return t.name ? `the ${t.name}` : `train ${t.trainNo}`;
}

export function journeyView(p: PublicState, d: ViewData, t: Instant = d.now): JourneyViewModel {
  const b = d.b; const tt = b.tt;
  const where = p.me.where;
  if (where.k === 'aboard') {
    const r = where.ride;
    const js = callsBetween(b, r.tripId, r.from, r.to);
    const dep0 = tt.depAt(js[0]!, r.day)!;
    const D = Math.max(1, r.schedArr - dep0);
    const expected = dep0 + D + r.shownDelay;
    const ts = dep0 + Math.floor(((Math.min(t, expected) - dep0) * D) / (D + r.shownDelay));
    let pos: Pt = stationPoint(b, r.from);
    for (let k = 0; k + 1 < js.length; k++) {
      const a = js[k]!; const z = js[k + 1]!;
      const leave = tt.stopDep[a]! >= 0 ? tt.depAt(a, r.day)! : tt.arrAt(a, r.day)!;
      const reach = tt.arrAt(z, r.day)!;
      const line = segmentLine(b, tt.stationIds[tt.stopStation[a]!]!, tt.stationIds[tt.stopStation[z]!]!);
      if (ts < leave) { pos = line[0]!; break; }
      const last = k + 2 === js.length;
      if (ts <= reach || last) {
        let f = reach > leave ? (ts - leave) / (reach - leave) : 1;
        if (last && t >= expected) f = 0.96;
        pos = along(line, Math.min(f, last ? 0.96 : 1));
        break;
      }
      pos = line[line.length - 1]!;
    }
    const toCity = cityOfStation(b, r.to);
    const due = stationClock(b, r.to, r.schedArr).time;
    const late = r.shownDelay > 0 ? ` · running ${span(r.shownDelay)} late` : t > r.schedArr + 60 ? ' · running late' : '';
    return { phase: 'aboard', token: { x: pos[0], y: pos[1] }, line: `Aboard ${trainWord(d, r.tripId)} to ${cityName(b, toCity)}`, sub: `due ${due}${late}`, phaseEnd: expected };
  }
  const here = cityPoint(b, where.city);
  const bk = p.diary.booking;
  if (bk && bk.next < bk.legs.length) {
    const leg = bk.legs[bk.next]!;
    const change = bk.next > 0;
    const dep = stationClock(b, leg.from, leg.dep).time;
    const to = cityName(b, cityOfStation(b, leg.to));
    return {
      phase: change ? 'change' : 'waiting', token: { x: here[0], y: here[1] },
      line: change ? `Change at ${cityName(b, where.city)}` : `Waiting for the ${dep} to ${to}`,
      sub: `${trainWord(d, leg.tripId)} to ${to} leaves ${dep}${leg.dep > t ? `, in ${span(leg.dep - t)}` : ''}${where.station && where.station !== leg.from ? ` from ${b.station.get(leg.from)?.name ?? ''}` : ''}`,
      phaseEnd: leg.dep,
    };
  }
  return { phase: 'town', token: { x: here[0], y: here[1] }, line: cityName(b, where.city), sub: null, phaseEnd: null };
}

/** The clock shown in the top bar at a display time (local time where the player is, or is going). */
export function displayClock(p: PublicState, d: ViewData, t: Instant = d.now): Clock {
  const city = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(d.b, p.me.where.ride.to);
  return clockAt(d.b, city, t);
}
