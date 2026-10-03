/**
 * forecast (RULES.md 5.9; H07-2, H07-5): what the player can know in advance. Pure, and fed only
 * with public rows (`params.publicView()`), the timetable, the player's own known graph and own
 * trail copies. It never reads the record store, delivery, readers or the hunter (the import check
 * enforces this), and makes no keyed draws: ranges only.
 */
import type { TripRow } from '#kit/timetable/types.ts';
import type { RecordTuple } from '#kit/records/tuple.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import type { C07Bundle, Rows } from './data.ts';
import { localIn } from './data.ts';

export type Category = 'express' | 'ordinary' | 'boat';
export interface DelayCdf { edges: number[]; w: number[] }

/** RULES 5.4: boats, then sleeper or named trains as expresses, the rest ordinary. */
export function categoryOf(t: TripRow): Category {
  return t.mode !== 'rail' ? 'boat' : t.sleeper || t.name ? 'express' : 'ordinary';
}

export function delayCdf(params: Rows, category: Category, day: number): DelayCdf {
  const v = params.get<DelayCdf>('c07.delay', category, day);
  if (!v) throw new Error(`No c07.delay row for ${category} on day ${day}`);
  return v;
}

/**
 * Odds (‰) that a train arriving with scheduled slack `s` misses the onward train, when the change
 * stop lies `e` seconds into a run of `E` seconds (delay grows linearly along the run). The onward
 * train is taken to leave on time (conservative).
 */
export function missPermille(cdf: DelayCdf, s: number, e: number, E: number): number {
  if (s < 0) return 1000;
  if (e <= 0 || E <= 0) return 0;
  const dMin = Math.ceil(((s + 1) * E) / e);
  let p = 0;
  for (let i = 0; i < cdf.w.length; i++) {
    const lo = cdf.edges[i]!; const hi = cdf.edges[i + 1]!; const w = cdf.w[i]!;
    if (hi > lo) p += Math.floor((w * Math.max(0, hi - Math.max(dMin, lo))) / (hi - lo));
    else if (lo >= dMin) p += w;
  }
  return Math.min(1000, p);
}

/** Itinerary odds: 1000 − Π(1000 − pᵢ) / 1000^(n−1), floored at each step. */
export function combineOdds(ps: readonly number[]): number {
  let q = 1000;
  for (const p of ps) q = Math.floor((q * (1000 - p)) / 1000);
  return 1000 - q;
}

export interface ForecastLeg { trip: number; day: number; from: string; to: string }

/** Scheduled instants of a trip's first departure, its stop at `station`, and its last arrival. */
export function runPosition(b: C07Bundle, trip: number, day: number, station: string): { first: Instant; at: Instant; last: Instant } | null {
  const tt = b.tt; const t = tt.trips[trip]!;
  const st = tt.st(station);
  const first = tt.depAt(t.firstStop, day)!;
  const last = tt.arrAt(t.firstStop + t.nStops - 1, day)!;
  for (let j = t.firstStop + 1; j < t.firstStop + t.nStops; j++) if (tt.stopStation[j] === st) return { first, at: tt.arrAt(j, day)!, last };
  return null;
}

export function boardTime(b: C07Bundle, trip: number, day: number, station: string): Instant | null {
  const tt = b.tt; const t = tt.trips[trip]!; const st = tt.st(station);
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) if (tt.stopStation[j] === st && tt.stopDep[j]! >= 0) return tt.depAt(j, day);
  return null;
}

export function alightTime(b: C07Bundle, trip: number, day: number, station: string, after: string): Instant | null {
  const tt = b.tt; const t = tt.trips[trip]!; const st = tt.st(station); const from = tt.st(after);
  let seen = false;
  for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
    if (!seen && tt.stopStation[j] === from && tt.stopDep[j]! >= 0) { seen = true; continue; }
    if (seen && tt.stopStation[j] === st) return tt.arrAt(j, day);
  }
  return null;
}

/** Minimum change between arriving at `a` and leaving from `b` (same station or a transfer row). */
export function changeSec(b: C07Bundle, a: string, c: string): number | null {
  const tt = b.tt;
  if (a === c) return tt.minChange[tt.st(a)]!;
  const f = b.raw.transfers.find((x) => x.from === a && x.to === c);
  return f ? f.minSec : null;
}

export function throughLinked(b: C07Bundle, fromTrip: number, toTrip: number, station: string): boolean {
  const links = b.tt.throughInto.get(toTrip);
  return !!links?.some((l) => l.fromTrip === fromTrip && l.station === b.tt.st(station));
}

export interface ChangeOdds { station: string; slackSec: number; odds: number; through: boolean }

/** Miss odds per change of an itinerary, and the combined odds, on public delay rows. */
export function itineraryForecast(b: C07Bundle, params: Rows, legs: readonly ForecastLeg[]): { changes: ChangeOdds[]; odds: number; minSlackSec: number } {
  const changes: ChangeOdds[] = [];
  for (let i = 0; i + 1 < legs.length; i++) {
    const inc = legs[i]!; const out = legs[i + 1]!;
    const arr = alightTime(b, inc.trip, inc.day, inc.to, inc.from)!;
    const dep = boardTime(b, out.trip, out.day, out.from)!;
    const through = inc.to === out.from && throughLinked(b, inc.trip, out.trip, inc.to);
    const slack = dep - arr - (changeSec(b, inc.to, out.from) ?? 0);
    let odds = 0;
    if (!through) {
      const pos = runPosition(b, inc.trip, inc.day, inc.to)!;
      odds = missPermille(delayCdf(params, categoryOf(b.tt.trips[inc.trip]!), inc.day), slack, pos.at - pos.first, pos.last - pos.first);
    }
    changes.push({ station: inc.to, slackSec: slack, odds, through });
  }
  return { changes, odds: combineOdds(changes.map((c) => c.odds)), minSlackSec: changes.length ? Math.min(...changes.map((c) => c.slackSec)) : 0 };
}

// ------------------------------------------------------------------ trace reach (ranges, no draws)

interface Lag { minSec: number; maxSec: number }
interface Edge { lagSec: [number, number]; retro: boolean; kinds?: string[] }
export interface Reach { reader: string; minSec: number; maxSec: number }

function lagOf(params: Rows, kind: string, source: string, day: number): Lag {
  return params.get<Lag>('records.lag', `${kind}@${source}`, day) ?? params.get<Lag>('records.lag', kind, day) ??
    params.get<Lag>('records.lag', source, day) ?? { minSec: 0, maxSec: 0 };
}

/** The next instant ≥ t at which the institution's public office hours are open (t when it has none). */
export function nextOpen(b: C07Bundle, params: Rows, inst: string, t: Instant): Instant {
  const row = b.inst.get(inst);
  const city = row?.city ?? null;
  if (!city) return t;
  for (const param of ['police.officeHours', 'bank.hours', 'post.hours', 'telegraph.hours']) {
    const v = params.get<{ days: Array<[number, number, number]> }>(param, inst, dayOf(t));
    if (!v) continue;
    const { day, sec } = localIn(b, city, t);
    for (let d = day; d <= day + 7; d++) {
      const wd = ((d % 7) + 7) % 7;
      const spans = v.days.filter(([mask]) => (mask & (1 << wd)) !== 0).sort((x, y) => x[1] - y[1]);
      for (const [, open, close] of spans) {
        const from = d === day ? Math.max(sec, open) : open;
        if (from < close) return t + (d - day) * 86400 + (from - sec);
      }
    }
    return t;
  }
  return t;
}

/**
 * Who could read a record of `kind` written at `time` by `source`, and when (seconds after
 * writing): the source after its lag, and every public cooperation edge from it that passes the kind.
 */
export function reachOf(b: C07Bundle, params: Rows, kind: string, source: string, time: Instant): Reach[] {
  const day = dayOf(time);
  const lag = lagOf(params, kind, source, day);
  const out: Reach[] = [{ reader: source, minSec: lag.minSec, maxSec: lag.maxSec }];
  for (const row of params.rowsFor('coop.edge')) {
    const [from, reader] = row.key.split('>');
    if (from !== source || !reader) continue;
    const e = row.value as Edge;
    if (e.kinds && !e.kinds.includes(kind)) continue;
    const open = row.from * 86400; const close = row.to === null ? Infinity : row.to * 86400;
    if (time >= close || (!e.retro && time < open)) continue;
    const lo = Math.max(time + lag.minSec, open) + e.lagSec[0];
    const hi = nextOpen(b, params, reader, Math.max(time + lag.maxSec, open) + e.lagSec[1]);
    if (lo >= close) continue;
    const prev = out.find((r) => r.reader === reader);
    if (prev) { prev.minSec = Math.min(prev.minSec, lo - time); prev.maxSec = Math.min(prev.maxSec, hi - time); }
    else out.push({ reader, minSec: lo - time, maxSec: hi - time });
  }
  return out.sort((x, y) => (x.reader < y.reader ? -1 : x.reader > y.reader ? 1 : 0));
}

/** Readers and arrival ranges of each record of the player's own trail (a copy, never the store). */
export function trailReach(b: C07Bundle, params: Rows, trail: readonly RecordTuple[]): Array<{ rec: number; reach: Reach[] }> {
  return trail.map((r) => ({ rec: r.id, reach: r.source.startsWith('VENUE-') ? [] : reachOf(b, params, r.kind, r.source, r.time) }));
}
