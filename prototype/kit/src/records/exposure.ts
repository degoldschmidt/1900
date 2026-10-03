/**
 * Worst-case exposure for player-side forecasts and indicators: who could read a record and the
 * earliest it could reach them, from the given parameter rows alone (normally the public view).
 * No keyed draws are made, so nothing hidden (whether a record survived or passed an edge, the
 * drawn lags) can leak into what the player sees. Never later or narrower than the truth when
 * given the same rows: every edge is assumed to pass and every lag takes its minimum.
 *
 * Deliberately independent of the store, delivery and readers modules, which forecasts may not
 * import (tools/check/import-boundaries.ts).
 */
import type { ParamRow } from '../params/types.ts';
import { NEVER, dayOf, instantOf, type Instant } from '../time/instant.ts';

export interface RowSource {
  get<T>(param: string, key: string, day: number): T | undefined;
  rowsFor(param: string): readonly ParamRow[];
}

export interface ExposedRecord { kind: string; source: string; time: Instant }

interface Edge { lagSec: [number, number]; retro: boolean; kinds?: string[] }
interface Lag { minSec: number; maxSec: number }

const COOP = 'coop.edge';
const LAG = 'records.lag';

function edgesFrom(params: RowSource, source: string): Array<{ reader: string; row: ParamRow }> {
  const out: Array<{ reader: string; row: ParamRow }> = [];
  for (const row of params.rowsFor(COOP)) {
    const [from, to] = row.key.split('>');
    if (from === source && to) out.push({ reader: to, row });
  }
  return out;
}

function minSourceLag(rec: ExposedRecord, params: RowSource): number {
  const day = dayOf(rec.time);
  const v = params.get<Lag>(LAG, `${rec.kind}@${rec.source}`, day) ?? params.get<Lag>(LAG, rec.kind, day) ?? params.get<Lag>(LAG, rec.source, day);
  return v ? v.minSec : 0;
}

/** Earliest instant `reader` could hold the record, or NEVER if no row allows it. */
export function earliestPossibleArrival(rec: ExposedRecord, reader: string, params: RowSource): Instant {
  const atSource = rec.time + minSourceLag(rec, params);
  if (reader === rec.source) return atSource;
  let best = NEVER;
  for (const { reader: r, row } of edgesFrom(params, rec.source)) {
    if (r !== reader) continue;
    const e = row.value as Edge;
    if (e.kinds && !e.kinds.includes(rec.kind)) continue;
    const open = instantOf(row.from, 0);
    const close = row.to === null ? NEVER : instantOf(row.to, 0);
    if (rec.time >= close || (!e.retro && rec.time < open)) continue;
    const t = Math.max(atSource, open) + e.lagSec[0];
    if (t < close && t < best) best = t;
  }
  return best;
}

/** Everyone who could hold the record by `t` (sorted). */
export function possibleReaders(rec: ExposedRecord, t: Instant, params: RowSource): string[] {
  const out = new Set<string>();
  if (earliestPossibleArrival(rec, rec.source, params) <= t) out.add(rec.source);
  for (const { reader } of edgesFrom(params, rec.source)) if (earliestPossibleArrival(rec, reader, params) <= t) out.add(reader);
  return [...out].sort();
}
