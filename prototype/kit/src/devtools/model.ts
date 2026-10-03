/**
 * What the debug inspector shows, computed from a simulation without touching it. Pure functions,
 * so they are tested in Node; the panel in inspector.tsx only renders their output.
 * Debug builds only: release bundles never reach this module.
 */
import { Sim, type GameDef, type Command, type Scenario, type SimSnapshot, type InputEntry } from '../sim/sim.ts';
import { delivered, arrival } from '../records/delivery.ts';
import { COOP } from '../records/readers.ts';
import type { RecordTuple } from '../records/tuple.ts';
import type { ParamRow } from '../params/types.ts';
import { dayOf, secOfDay, NEVER, type Instant } from '../time/instant.ts';
import { fmtDate, fmtClock } from '../time/format.ts';
import { encodeSave, type SaveCode } from '../sim/savecode.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySim = Sim<any, any, any>;

export const GROUND_TRUTH = '(ground truth)';

export function fmtInstant(t: Instant): string {
  if (t === NEVER) return 'never';
  return `${fmtDate(dayOf(t), 'greg')} ${fmtClock(secOfDay(t))}`;
}

export interface Overview {
  game: string;
  scenario: string;
  now: string;
  processed: number;
  pending: number;
  records: number;
  commands: number;
  snapshots: number;
  next: string;
}

export function overview(sim: AnySim): Overview {
  const next = sim.queue.peek();
  return {
    game: sim.def.id,
    scenario: sim.scenario.id,
    now: fmtInstant(sim.now),
    processed: sim.processed,
    pending: sim.queue.size,
    records: sim.records.size,
    commands: sim.log.length,
    snapshots: sim.snapshots.length,
    next: next ? `${next.type} at ${fmtInstant(next.at)}` : 'nothing scheduled',
  };
}

export interface QueueRow { seq: number; at: string; prio: number; type: string; payload: string }

/** Pending events in the order they will run. */
export function queueRows(sim: AnySim, limit = 200): QueueRow[] {
  return sim.queue.pending().slice(0, limit).map((e) => ({
    seq: e.seq, at: fmtInstant(e.at), prio: e.prio, type: e.type, payload: JSON.stringify(e.payload),
  }));
}

/** Every institution that could hold records: sources, subscribed readers and cooperation-edge ends. */
export function knownReaders(sim: AnySim): string[] {
  const out = new Set<string>();
  for (const r of sim.records.all()) out.add(r.source);
  for (const s of sim.records.subscriptions) out.add(s.reader);
  for (const row of sim.params.rowsFor(COOP)) {
    const [a, b] = row.key.split('>');
    if (a) out.add(a);
    if (b) out.add(b);
  }
  return [...out].sort();
}

export interface RecordRow {
  id: number;
  time: string;
  kind: string;
  subject: string;
  predicate: string;
  value: string;
  confidence: number;
  source: string;
  authorship: string;
  /** For a chosen reader: when it can first read the record. */
  arrives?: string;
}

function recordRow(r: RecordTuple): RecordRow {
  return {
    id: r.id, time: fmtInstant(r.time), kind: r.kind, subject: r.subject, predicate: r.predicate,
    value: JSON.stringify(r.value), confidence: r.confidence, source: r.source, authorship: r.authorship,
  };
}

/**
 * The whole store, or the view one reader holds now (computed by the same `arrival` rule the
 * game uses). `filter` matches any field, case-sensitively.
 */
export function recordRows(sim: AnySim, reader: string = GROUND_TRUTH, filter = '', limit = 500): RecordRow[] {
  const base = reader === GROUND_TRUTH
    ? sim.records.all()
    : delivered(sim.records, reader, sim.now, sim.params, sim.seed);
  const rows = base.map((r) => {
    const row = recordRow(r);
    if (reader !== GROUND_TRUTH) row.arrives = fmtInstant(arrival(r, reader, sim.params, sim.seed));
    return row;
  });
  const f = filter.trim();
  const hit = f ? rows.filter((r) => Object.values(r).some((v) => String(v).includes(f))) : rows;
  return hit.slice(-limit);
}

export interface ParamView {
  id: string;
  param: string;
  key: string;
  value: string;
  from: string;
  to: string;
  basis: string;
  ref: string;
  public: boolean;
}

/** Parameter rows in force today, sorted by (param, key). */
export function paramsInForce(sim: AnySim, filter = ''): ParamView[] {
  const day = dayOf(sim.now);
  const seen = new Set<string>();
  const out: ParamView[] = [];
  const rows = [...sim.params.rows].sort((a, b) => (a.param < b.param ? -1 : a.param > b.param ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  for (const r of rows) {
    const k = `${r.param}\u0000${r.key}`;
    if (seen.has(k)) continue;
    const row = sim.params.row(r.param, r.key, day);
    if (!row) continue;
    seen.add(k);
    out.push(paramView(row));
  }
  const f = filter.trim();
  return f ? out.filter((p) => Object.values(p).some((v) => String(v).includes(f))) : out;
}

function paramView(r: ParamRow): ParamView {
  return {
    id: r.id, param: r.param, key: r.key, value: JSON.stringify(r.value),
    from: fmtDate(r.from, 'greg', false), to: r.to === null ? '—' : fmtDate(r.to, 'greg', false),
    basis: `date ${r.dateBasis}, value ${r.valueBasis}`,
    ref: r.dv ?? (r.cite !== undefined ? `cite #${r.cite}` : ''),
    public: r.public,
  };
}

export interface TraceRow { k: number; at: string; kind: string; data: string }

export function traceRows(sim: AnySim, limit = 200): TraceRow[] {
  return sim.trace.slice(-limit).map((t) => ({ k: t.k, at: fmtInstant(t.at), kind: t.kind, data: JSON.stringify(t.data) }));
}

export interface ReplayCheck { from: string; processed: number; expected: string; got: string; ok: boolean; error?: string }

/**
 * Rebuilds the simulation from a snapshot (or from the start when `snap` is undefined), replays
 * the logged commands and compares the hash with the live one. A mismatch means some state lives
 * outside the queue, the store or the state object, or a rule reads something it should not.
 */
export function checkReplay<S, C extends Command, B>(
  def: GameDef<S, C, B>, bundle: B, scenario: Scenario,
  log: ReadonlyArray<InputEntry<C>>, processed: number, expected: string, snap?: SimSnapshot,
): ReplayCheck {
  const from = snap ? `snapshot at k=${snap.processed} (${fmtInstant(snap.now)})` : 'scenario start';
  try {
    const sim = snap ? Sim.restore(def, bundle, scenario, snap) : new Sim(def, bundle, scenario);
    sim.replayLog(log, processed);
    const got = sim.hash();
    return { from, processed, expected, got, ok: got === expected };
  } catch (err) {
    return { from, processed, expected, got: '', ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** The save code for the simulation as it stands. */
export function saveCodeOf(sim: AnySim, buildId: string, dataHash: string): string {
  const save: SaveCode = {
    v: 1, game: sim.def.id, buildId, dataHash, scenario: sim.scenario.id, seed: sim.seed,
    processed: sim.processed, log: sim.log.map((e: InputEntry<Command>) => ({ k: e.k, cmd: e.cmd })),
  };
  return encodeSave(save);
}
