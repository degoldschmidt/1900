/**
 * Golden runs. A scenario script (games/<g>/scenarios/scripts/<name>.script.json) is run once to
 * produce its input log (scenarios/logs/<name>.input.json) and golden record
 * (scenarios/golden/<name>.golden.json). Tests then check that
 *   - the script still produces exactly the logged commands at the logged positions,
 *   - a straight replay of the log reaches the golden hash,
 *   - restoring any monthly snapshot and replaying the rest reaches the same hash.
 */
import { runScript, type Script } from '../../kit/src/sim/scenario.ts';
import { Sim, type Command, type InputEntry } from '../../kit/src/sim/sim.ts';
import type { GameModule } from '../../kit/src/sim/module.ts';
import { canonicalJson } from '../../kit/src/sim/canonical.ts';
import { hash64 } from '../../kit/src/sim/hash.ts';

export interface GoldenRecord {
  script: string;
  scenario: string;
  seed: number;
  dataHash: string;
  processed: number;
  commands: number;
  logHash: string;
  hash: string;
  /** Why the golden value last changed (required by golden:update). */
  reason: string;
}

export interface GoldenRun<C extends Command> { log: Array<InputEntry<C>>; golden: GoldenRecord }

export function runGolden<S, C extends Command, B>(
  mod: GameModule<S, C, B>, bundle: B, dataHash: string, name: string, script: Script<C>, reason: string,
): GoldenRun<C> {
  const scenario = mod.scenario(bundle, script.scenario);
  const res = runScript(mod.game, bundle, scenario, script);
  return {
    log: res.log,
    golden: {
      script: name, scenario: scenario.id, seed: scenario.seed, dataHash, processed: res.sim.processed,
      commands: res.log.length, logHash: hash64(canonicalJson(res.log)), hash: res.hash, reason,
    },
  };
}

/** Problems found when re-checking a golden record; empty when everything matches. */
export function checkGolden<S, C extends Command, B>(
  mod: GameModule<S, C, B>, bundle: B, script: Script<C>, log: ReadonlyArray<InputEntry<C>>, golden: GoldenRecord,
): string[] {
  const problems: string[] = [];
  const scenario = mod.scenario(bundle, golden.scenario, golden.seed);
  try {
    const fresh = runScript(mod.game, bundle, scenario, script);
    if (hash64(canonicalJson(fresh.log)) !== golden.logHash) problems.push(`${golden.script}: the script now produces a different input log`);
    if (fresh.hash !== golden.hash) problems.push(`${golden.script}: script run hash ${fresh.hash} differs from golden ${golden.hash}`);
  } catch (err) {
    problems.push(`${golden.script}: the script no longer runs (${err instanceof Error ? err.message : String(err)})`);
  }
  const straight = new Sim(mod.game, bundle, scenario);
  straight.replayLog(log, golden.processed);
  if (straight.hash() !== golden.hash) problems.push(`${golden.script}: straight replay hash ${straight.hash()} differs from golden ${golden.hash}`);
  for (const snap of straight.snapshots) {
    const re = Sim.restore(mod.game, bundle, scenario, snap);
    re.replayLog(log, golden.processed);
    if (re.hash() !== golden.hash) problems.push(`${golden.script}: replay from snapshot k=${snap.processed} differs from golden`);
  }
  return problems;
}
