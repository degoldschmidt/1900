/**
 * When a record reaches a reader. One function, `arrival`, is the rule; eager delivery events for
 * subscribed readers are scheduled at exactly that time, and the lazy view `delivered` uses the
 * same function, so the two always agree.
 *
 *   source lag:   param "records.lag", key "<kind>@<source>" (or "<kind>", or "<source>"), value
 *                 {minSec, maxSec}; the draw is keyed ("lag", record, source).
 *   via an edge:  arrival = max(emit + sourceLag, edgeOpen) + edgeLag, provided it arrives before
 *                 the edge closes; the edge lag is keyed ("liaison", record, reader, row).
 * This is the backfill rule: a record written before a retroactive edge opens arrives at
 * open + edge lag. Parameters are static data known at the start, so the arrival computed when a
 * record is written is final.
 */
import type { RecordTuple, NewRecord } from './tuple.ts';
import type { RecordStore, Subscription } from './store.ts';
import { matches } from './store.ts';
import type { ParamLayer } from '../params/layer.ts';
import type { Instant } from '../time/instant.ts';
import { NEVER, dayOf, instantOf } from '../time/instant.ts';
import { belowN } from '../rng/draw.ts';
import { coopRowsFrom, survives, type CoopEdge } from './readers.ts';

export const LAG = 'records.lag';
export const DELIVERED_EVENT = 'kit.RecordDelivered';
export const PRIO_INSTITUTION = 10;

export interface LagRange { minSec: number; maxSec: number }

function drawIn(range: readonly [number, number] | LagRange, seed: number, purpose: string, ...ids: Array<number | string>): number {
  const [lo, hi] = Array.isArray(range) ? range : [(range as LagRange).minSec, (range as LagRange).maxSec];
  if (hi < lo) throw new Error(`Bad lag range ${lo}..${hi}`);
  return lo + (hi === lo ? 0 : belowN(hi - lo + 1, seed, purpose, ...ids));
}

/** Time for a record to reach its own source institution's ledger. */
export function sourceLag(rec: RecordTuple, params: ParamLayer, seed: number): number {
  const day = dayOf(rec.time);
  const v = params.get<LagRange>(LAG, `${rec.kind}@${rec.source}`, day) ??
    params.get<LagRange>(LAG, rec.kind, day) ?? params.get<LagRange>(LAG, rec.source, day);
  return v ? drawIn(v, seed, 'lag', rec.id, rec.source) : 0;
}

/** The instant `reader` can first read `rec`, or NEVER. */
export function arrival(rec: RecordTuple, reader: string, params: ParamLayer, seed: number): Instant {
  const atSource = rec.time + sourceLag(rec, params, seed);
  if (reader === rec.source) return survives(rec, dayOf(atSource), params, seed) ? atSource : NEVER;
  const rows = coopRowsFrom(params, rec.source).get(reader) ?? [];
  let best = NEVER;
  for (const row of rows) {
    const edge = row.value as CoopEdge;
    const open = instantOf(row.from, 0);
    const close = row.to === null ? NEVER : instantOf(row.to, 0);
    if (rec.time >= close) continue;
    if (!edge.retro && rec.time < open) continue;
    const t = Math.max(atSource, open) + drawIn(edge.lagSec, seed, 'liaison', rec.id, reader, row.id);
    if (t >= close) continue;
    if (!survives(rec, dayOf(t), params, seed)) continue;
    if (t < best) best = t;
  }
  return best;
}

/** Lazy view: everything `reader` holds by time `t`, in record order. */
export function delivered(store: RecordStore, reader: string, t: Instant, params: ParamLayer, seed: number, filter?: (r: RecordTuple) => boolean): RecordTuple[] {
  return store.all().filter((r) => (!filter || filter(r)) && arrival(r, reader, params, seed) <= t);
}

export interface Scheduler {
  readonly now: Instant;
  schedule(at: Instant, prio: number, type: string, payload: unknown): number;
}

function scheduleFor(sub: Subscription, rec: RecordTuple, params: ParamLayer, seed: number, sched: Scheduler): void {
  if (!matches(sub.filter, rec) || sub.scheduled.includes(rec.id)) return;
  const t = arrival(rec, sub.reader, params, seed);
  if (t === NEVER) return;
  sub.scheduled.push(rec.id);
  sched.schedule(Math.max(t, sched.now, sub.from), PRIO_INSTITUTION, DELIVERED_EVENT, { rec: rec.id, reader: sub.reader });
}

/** Appends a record and schedules its delivery to every matching subscribed reader. */
export function appendRecord(store: RecordStore, r: NewRecord, params: ParamLayer, seed: number, sched: Scheduler): RecordTuple {
  const rec = store.append(r);
  for (const sub of store.subscriptions) scheduleFor(sub, rec, params, seed, sched);
  return rec;
}

/**
 * Subscribes a reader from now on. Records it could already read are handed over now (a file
 * passed on); later arrivals are scheduled at their arrival times.
 */
export function subscribe(store: RecordStore, reader: string, filter: Subscription['filter'], params: ParamLayer, seed: number, sched: Scheduler): Subscription {
  const sub = store.subscribe(reader, filter, sched.now);
  for (const rec of store.all()) scheduleFor(sub, rec, params, seed, sched);
  return sub;
}

/** A copy of the records about, or asserted by, the given entities. It holds no handle to the store. */
export interface OwnTrail { readonly records: readonly RecordTuple[] }

export function ownTrail(store: RecordStore, entityIds: readonly string[]): OwnTrail {
  const ids = new Set(entityIds);
  const records = store.all()
    .filter((r) => ids.has(r.subject) || (r.author !== undefined && ids.has(r.author)))
    .map((r) => JSON.parse(JSON.stringify(r)) as RecordTuple);
  return { records };
}
