/**
 * Hooks for end-to-end tests, installed only in debug builds opened with `?test=1`. They let a
 * Playwright test replay a save code inside the browser and compare the state hash with the one
 * computed in Node, which proves the simulation is deterministic across engines.
 */
import type { Sim, Command } from '../sim/sim.ts';
import { decodeSave } from '../sim/savecode.ts';
import { saveCodeOf, type AnySim } from './model.ts';

export interface TestHooks {
  hash(): string;
  processed(): number;
  now(): number;
  /** Processes up to n events; returns how many ran. */
  step(n: number): number;
  /** Rebuilds the game from a save code in this page and returns its hash. */
  replay(code: string): { hash: string; processed: number };
  /** The save code of the live game. */
  save(): string;
}

export interface TestHost<S, C extends Command, B> {
  getSim(): Sim<S, C, B>;
  /** Builds a fresh simulation for a scenario id and seed (as a save code records them). */
  create(scenarioId: string, seed: number): Sim<S, C, B>;
  buildId: string;
  dataHash: string;
}

export function testHooks<S, C extends Command, B>(host: TestHost<S, C, B>): TestHooks {
  return {
    hash: () => host.getSim().hash(),
    processed: () => host.getSim().processed,
    now: () => host.getSim().now,
    step: (n) => { const sim = host.getSim(); let i = 0; while (i < n && sim.step()) i++; return i; },
    replay: (code) => {
      const save = decodeSave<C>(code);
      const sim = host.getSim();
      if (save.game !== sim.def.id) throw new Error(`Save code is for ${save.game}, not ${sim.def.id}`);
      const fresh = host.create(save.scenario, save.seed);
      fresh.replayLog(save.log, save.processed);
      return { hash: fresh.hash(), processed: fresh.processed };
    },
    save: () => saveCodeOf(host.getSim() as AnySim, host.buildId, host.dataHash),
  };
}

/** Installs the hooks on `window.__test` when the page URL carries `test=1`. */
export function installTestHooks<S, C extends Command, B>(host: TestHost<S, C, B>, win: Window = window): boolean {
  let enabled = false;
  try { enabled = new URL(win.location.href).searchParams.get('test') === '1'; } catch { enabled = false; }
  if (!enabled) return false;
  (win as unknown as { __test: TestHooks }).__test = testHooks(host);
  return true;
}
