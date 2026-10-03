/**
 * The simulation harness. One EventQueue per game is the only scheduler. Time advances only by
 * processing events; player commands are applied between events and logged with `k`, the number
 * of events processed before them, which fixes the interleaving exactly for replay.
 *
 * A game supplies a GameDef: init (builds state and schedules the first events), handlers (one
 * per event type), and validate/apply for commands. State must be plain JSON data.
 */
import { EventQueue, type QueueJSON } from '../queue/queue.ts';
import { RecordStore, type StoreJSON, type SubscriptionFilter } from '../records/store.ts';
import type { RecordTuple, NewRecord } from '../records/tuple.ts';
import { appendRecord, subscribe as subscribeReader, DELIVERED_EVENT } from '../records/delivery.ts';
import { ParamLayer } from '../params/layer.ts';
import type { ParamRow } from '../params/types.ts';
import { drawer, type Drawer } from '../rng/draw.ts';
import type { KeyPart } from '../rng/hash.ts';
import type { Instant } from '../time/instant.ts';
import { dayOf, instantOf } from '../time/instant.ts';
import { gregorianFromDay } from '../time/calendar.ts';
import { canonicalJson } from './canonical.ts';
import { hash64 } from './hash.ts';

export const PARAM_CHANGED = 'kit.ParamChanged';
export const WAKE = 'kit.Wake';
export const PRIO_PARAMS = 1;

export interface Command { type: string }

export interface Scenario<Setup = unknown> {
  id: string;
  game: string;
  title: string;
  start: Instant;
  /** Last instant the scenario may run to. */
  end: Instant;
  seed: number;
  setup: Setup;
  /** Rows replacing or adding to the bundle's parameter rows (tests force delays this way). */
  paramOverrides?: ParamRow[];
}

export interface Ctx<S> {
  readonly now: Instant;
  readonly seed: number;
  readonly state: S;
  readonly params: ParamLayer;
  readonly records: RecordStore;
  readonly rng: Drawer;
  schedule(at: Instant, prio: number, type: string, payload?: unknown): number;
  cancel(seq: number): boolean;
  isPending(seq: number): boolean;
  /** Appends a record and schedules eager deliveries to subscribed readers. */
  emit(r: NewRecord): RecordTuple;
  subscribe(reader: string, filter: SubscriptionFilter): void;
  draw(purpose: string, ...ids: KeyPart[]): number;
  below(n: number, purpose: string, ...ids: KeyPart[]): number;
  chance(permille: number, purpose: string, ...ids: KeyPart[]): boolean;
  /** Index drawn from a cumulative integer table (see rng/draw.ts `pickCdf`). */
  pick(cdf: readonly number[], purpose: string, ...ids: KeyPart[]): number;
  /** Test and analysis trace; not part of state. */
  trace(kind: string, data?: unknown): void;
}

export type Handler<S> = (state: S, payload: any, ctx: Ctx<S>) => void;

export interface GameDef<S, C extends Command, B = unknown> {
  id: string;
  /** Builds the initial state and schedules the first events. */
  init(ctx: Ctx<undefined>, bundle: B, scenario: Scenario): S;
  /** The parameter rows the game uses (from its bundle). */
  paramRows(bundle: B): readonly ParamRow[];
  handlers: Record<string, Handler<S>>;
  /** Returns an error message for an invalid command, or null. */
  validate(state: S, cmd: C, ctx: Ctx<S>): string | null;
  apply(state: S, cmd: C, ctx: Ctx<S>): void;
}

export interface InputEntry<C> { k: number; cmd: C }

export interface TraceEntry { k: number; at: Instant; kind: string; data: unknown }

export interface SimSnapshot {
  processed: number;
  now: Instant;
  monthKey: number;
  /** Canonical JSON of {state, queue, records}. */
  data: string;
}

export type CommandResult = { ok: true } | { ok: false; error: string };

const monthKeyOf = (t: Instant): number => { const g = gregorianFromDay(dayOf(t)); return g.y * 12 + (g.m - 1); };

export class Sim<S, C extends Command, B = unknown> {
  readonly def: GameDef<S, C, B>;
  readonly bundle: B;
  readonly scenario: Scenario;
  readonly seed: number;
  readonly params: ParamLayer;
  state!: S;
  queue = new EventQueue();
  records = new RecordStore();
  now: Instant;
  processed = 0;
  readonly log: Array<InputEntry<C>> = [];
  readonly trace: TraceEntry[] = [];
  readonly snapshots: SimSnapshot[] = [];
  private lastMonth: number;
  private readonly rng: Drawer;

  constructor(def: GameDef<S, C, B>, bundle: B, scenario: Scenario, opts: { restore?: SimSnapshot } = {}) {
    this.def = def;
    this.bundle = bundle;
    this.scenario = scenario;
    this.seed = scenario.seed >>> 0;
    this.rng = drawer(this.seed);
    const base = new ParamLayer(def.paramRows(bundle));
    this.params = scenario.paramOverrides?.length ? base.withOverrides(scenario.paramOverrides) : base;
    if (opts.restore) {
      const snap = opts.restore;
      const d = JSON.parse(snap.data) as { state: S; queue: QueueJSON; records: StoreJSON };
      this.state = d.state;
      this.queue = EventQueue.fromJSON(d.queue);
      this.records = RecordStore.fromJSON(d.records);
      this.now = snap.now;
      this.processed = snap.processed;
      this.lastMonth = snap.monthKey;
      return;
    }
    this.now = scenario.start;
    this.lastMonth = monthKeyOf(scenario.start);
    const ctx = this.makeCtx(undefined);
    this.state = def.init(ctx, bundle, scenario);
    // Parameter boundaries inside the scenario window become events games may react to.
    for (const day of this.params.boundaries(dayOf(scenario.start) + 1, dayOf(scenario.end))) {
      this.queue.push(instantOf(day, 0), PRIO_PARAMS, PARAM_CHANGED, { day, ...this.params.changesOn(day) });
    }
    this.snapshots.push(this.snapshot());
  }

  private makeCtx<T>(state: T): Ctx<T> {
    const sim = this;
    return {
      get now() { return sim.now; },
      seed: this.seed,
      state,
      params: this.params,
      records: this.records,
      rng: this.rng,
      schedule: (at, prio, type, payload = null) => {
        if (at < sim.now) throw new Error(`Cannot schedule ${type} in the past (${at} < ${sim.now})`);
        return sim.queue.push(at, prio, type, payload);
      },
      cancel: (seq) => sim.queue.cancel(seq),
      isPending: (seq) => sim.queue.isPending(seq),
      emit: (r) => appendRecord(sim.records, r, sim.params, sim.seed, { now: sim.now, schedule: (at, p, t, pl) => sim.queue.push(at, p, t, pl) }),
      subscribe: (reader, filter) => { subscribeReader(sim.records, reader, filter, sim.params, sim.seed, { now: sim.now, schedule: (at, p, t, pl) => sim.queue.push(at, p, t, pl) }); },
      draw: (p, ...ids) => sim.rng.u32(p, ...ids),
      below: (n, p, ...ids) => sim.rng.below(n, p, ...ids),
      chance: (pm, p, ...ids) => sim.rng.chance(pm, p, ...ids),
      pick: (cdf, p, ...ids) => sim.rng.pick(cdf, p, ...ids),
      trace: (kind, data = null) => { sim.trace.push({ k: sim.processed, at: sim.now, kind, data }); },
    };
  }

  /** Validates and applies a player command between events, and logs it. */
  command(cmd: C): CommandResult {
    const ctx = this.makeCtx(this.state);
    const err = this.def.validate(this.state, cmd, ctx);
    if (err !== null) return { ok: false, error: err };
    this.def.apply(this.state, cmd, ctx);
    this.log.push({ k: this.processed, cmd: JSON.parse(JSON.stringify(cmd)) as C });
    return { ok: true };
  }

  nextAt(): Instant | undefined { return this.queue.peek()?.at; }

  /** Processes one event. Returns false when the queue is empty or the scenario has ended. */
  step(): boolean {
    const ev = this.queue.peek();
    if (!ev || ev.at > this.scenario.end) return false;
    const month = monthKeyOf(ev.at);
    if (month > this.lastMonth) {
      this.lastMonth = month;
      this.snapshots.push(this.snapshot());
    }
    this.queue.pop();
    this.now = ev.at;
    const handler = this.def.handlers[ev.type];
    if (handler) handler(this.state, ev.payload, this.makeCtx(this.state));
    else if (!ev.type.startsWith('kit.')) throw new Error(`No handler for event ${ev.type}`);
    this.processed++;
    return true;
  }

  /** Processes events until `pred` holds after an event, the queue runs dry, or `maxEvents` pass. */
  advanceUntil(pred: (s: S, sim: this) => boolean, maxEvents = 1_000_000): 'met' | 'idle' | 'limit' {
    for (let i = 0; i < maxEvents; i++) {
      if (!this.step()) return 'idle';
      if (pred(this.state, this)) return 'met';
    }
    return 'limit';
  }

  /** Processes every event at or before `t` (time itself only moves with events). */
  advanceTo(t: Instant): void {
    for (let ev = this.queue.peek(); ev && ev.at <= t && ev.at <= this.scenario.end; ev = this.queue.peek()) this.step();
  }

  hash(): string {
    return hash64(canonicalJson({ state: this.state, queue: this.queue.toJSON(), records: this.records.toJSON(), now: this.now, processed: this.processed }));
  }

  snapshot(): SimSnapshot {
    return {
      processed: this.processed,
      now: this.now,
      monthKey: this.lastMonth,
      data: canonicalJson({ state: this.state, queue: this.queue.toJSON(), records: this.records.toJSON() }),
    };
  }

  /** Rebuilds a simulation from a snapshot; replay the rest of the log with `replayLog`. */
  static restore<S, C extends Command, B>(def: GameDef<S, C, B>, bundle: B, scenario: Scenario, snap: SimSnapshot): Sim<S, C, B> {
    return new Sim(def, bundle, scenario, { restore: snap });
  }

  /** Applies logged commands at their recorded positions, then runs to `processed` events. */
  replayLog(log: ReadonlyArray<InputEntry<C>>, finalProcessed: number): void {
    for (const entry of log) {
      if (entry.k < this.processed) continue;
      while (this.processed < entry.k) if (!this.step()) throw new Error(`Replay ran out of events before k=${entry.k}`);
      const res = this.command(entry.cmd);
      if (!res.ok) throw new Error(`Replayed command rejected at k=${entry.k}: ${res.error}`);
    }
    while (this.processed < finalProcessed) if (!this.step()) throw new Error(`Replay ran out of events before ${finalProcessed}`);
  }
}

export { DELIVERED_EVENT };
