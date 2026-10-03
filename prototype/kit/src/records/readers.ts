/**
 * Who can read a record, derived at query time (never stored on the record):
 *  - its source institution;
 *  - any institution with an open cooperation edge from the source on that day
 *    (param "coop.edge", key "SOURCE>READER", value CoopEdge). Edges with `retro: true` also open
 *    records written before the edge opened (the August 1914 fusion opens old files). An edge may
 *    pass only some record kinds (`kinds`) and only a keyed share of records (`permille`, drawn
 *    once per record, reader and row: "liaison-pass");
 *  - subject to archive survival: from the day a "archive.survival" row (key = source) applies,
 *    only a keyed `permille` share of that source's records still exist for anyone.
 */
import type { RecordTuple } from './tuple.ts';
import type { ParamLayer } from '../params/layer.ts';
import type { ParamRow } from '../params/types.ts';
import type { DayNumber } from '../time/calendar.ts';
import { dayOf, instantOf } from '../time/instant.ts';
import { chancePermille } from '../rng/draw.ts';

export interface CoopEdge {
  /** Delay along the edge, seconds: [min, max]. */
  lagSec: [number, number];
  /** Does the edge open records written before it opened? */
  retro: boolean;
  /** Record kinds the edge passes; all kinds when absent. */
  kinds?: string[];
  /** Share of records the edge passes, per mille (keyed per record, reader and row); all when absent. */
  permille?: number;
}

/** Whether a cooperation row passes this record to this reader at all (kind filter and keyed share). */
export function edgePasses(rec: RecordTuple, reader: string, row: ParamRow, seed: number): boolean {
  const edge = row.value as CoopEdge;
  if (edge.kinds && !edge.kinds.includes(rec.kind)) return false;
  if (edge.permille !== undefined && !chancePermille(edge.permille, seed, 'liaison-pass', rec.id, reader, row.id)) return false;
  return true;
}

export interface Survival { permille: number }

export const COOP = 'coop.edge';
export const SURVIVAL = 'archive.survival';

/** Rows of cooperation edges from `source`, grouped by reader, sorted by from. */
export function coopRowsFrom(params: ParamLayer, source: string): Map<string, ParamRow[]> {
  const out = new Map<string, ParamRow[]>();
  for (const r of params.rowsFor(COOP)) {
    const [from, to] = r.key.split('>');
    if (from !== source || !to) continue;
    (out.get(to) ?? out.set(to, []).get(to)!).push(r);
  }
  for (const list of out.values()) list.sort((a, b) => a.from - b.from || (a.id < b.id ? -1 : 1));
  return out;
}

/** Whether a record still exists on `day`, given archive destruction rows for its source. */
export function survives(rec: RecordTuple, day: DayNumber, params: ParamLayer, seed: number): boolean {
  const row = params.row(SURVIVAL, rec.source, day);
  if (!row) return true;
  if (rec.time >= instantOf(row.from, 0)) return true; // written after the destruction date
  const v = row.value as Survival;
  return chancePermille(v.permille, seed, 'survival', rec.id, rec.source, row.id);
}

/** Institutions that can read `rec` on `day` (sorted). */
export function readersOf(rec: RecordTuple, day: DayNumber, params: ParamLayer, seed: number): string[] {
  if (!survives(rec, day, params, seed)) return [];
  const out = new Set<string>();
  if (day >= dayOf(rec.time)) out.add(rec.source);
  for (const [reader, rows] of coopRowsFrom(params, rec.source)) {
    for (const r of rows) {
      const open = r.from <= day && (r.to === null || day < r.to);
      if (!open) continue;
      const edge = r.value as CoopEdge;
      if (!edgePasses(rec, reader, r, seed)) continue;
      if (edge.retro || dayOf(rec.time) >= r.from) { out.add(reader); break; }
    }
  }
  return [...out].sort();
}

export function canRead(reader: string, rec: RecordTuple, day: DayNumber, params: ParamLayer, seed: number): boolean {
  return readersOf(rec, day, params, seed).includes(reader);
}
