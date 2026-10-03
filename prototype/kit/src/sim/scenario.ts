/**
 * Scenario scripts: human-written steps with wait conditions ("run until the train arrives, then
 * book the night express"). Compiling a script runs it once and records the input log; tests and
 * golden files keep the log and the final state hash.
 */
import { Sim, type GameDef, type Command, type Scenario, type InputEntry } from './sim.ts';
import type { Instant } from '../time/instant.ts';

export interface WaitCondition {
  /** Run until an event of this type has been processed. */
  untilEvent?: string;
  /** Run until a trace entry of this kind appears. */
  untilTrace?: string;
  /** Run through all events at or before this instant. */
  untilTime?: Instant;
  /** Safety bound on events processed for this wait (default 100 000). */
  maxEvents?: number;
}

export interface ScriptStep<C> {
  wait?: WaitCondition;
  cmd?: C;
  /** The command is expected to be rejected (the step checks it). */
  expectError?: boolean;
  note?: string;
}

export interface Script<C> {
  scenario: string;
  steps: Array<ScriptStep<C>>;
  /** Where to stop after the last step. */
  end?: WaitCondition;
}

function waitFor<S, C extends Command, B>(sim: Sim<S, C, B>, w: WaitCondition): void {
  const max = w.maxEvents ?? 100_000;
  if (w.untilTime !== undefined) { sim.advanceTo(w.untilTime); return; }
  if (w.untilEvent) {
    const want = w.untilEvent;
    for (let i = 0; i < max; i++) {
      const next = sim.queue.peek();
      if (!next) throw new Error(`Script waited for ${want} but the queue ran dry`);
      const type = next.type;
      if (!sim.step()) throw new Error(`Script waited for ${want} but the scenario ended`);
      if (type === want) return;
    }
    throw new Error(`Script waited for ${want} beyond ${max} events`);
  }
  if (w.untilTrace) {
    const want = w.untilTrace;
    const start = sim.trace.length;
    for (let i = 0; i < max; i++) {
      if (sim.trace.slice(start).some((t) => t.kind === want)) return;
      if (!sim.step()) throw new Error(`Script waited for trace ${want} but nothing more happened`);
    }
    throw new Error(`Script waited for trace ${want} beyond ${max} events`);
  }
}

export interface ScriptResult<S, C extends Command, B> {
  sim: Sim<S, C, B>;
  log: Array<InputEntry<C>>;
  hash: string;
}

/** Runs a script from the scenario start and returns the simulation, its input log and final hash. */
export function runScript<S, C extends Command, B>(def: GameDef<S, C, B>, bundle: B, scenario: Scenario, script: Script<C>): ScriptResult<S, C, B> {
  const sim = new Sim(def, bundle, scenario);
  script.steps.forEach((step, i) => {
    if (step.wait) waitFor(sim, step.wait);
    if (step.cmd) {
      const res = sim.command(step.cmd);
      if (step.expectError && res.ok) throw new Error(`Step ${i}: expected the command to be rejected`);
      if (!step.expectError && !res.ok) throw new Error(`Step ${i}: command rejected: ${res.error}`);
    }
  });
  if (script.end) waitFor(sim, script.end);
  return { sim, log: [...sim.log], hash: sim.hash() };
}

/** Replays a log from the scenario start up to `processed` events. */
export function replay<S, C extends Command, B>(def: GameDef<S, C, B>, bundle: B, scenario: Scenario, log: ReadonlyArray<InputEntry<C>>, processed: number): Sim<S, C, B> {
  const sim = new Sim(def, bundle, scenario);
  sim.replayLog(log, processed);
  return sim;
}
