import { describe, it, expect } from 'vitest';
import { Sim } from '../src/sim/sim.ts';
import { decodeSave } from '../src/sim/savecode.ts';
import { instantOf } from '../src/time/instant.ts';
import {
  overview, queueRows, knownReaders, recordRows, paramsInForce, traceRows, checkReplay, saveCodeOf, GROUND_TRUTH,
} from '../src/devtools/model.ts';
import { testHooks } from '../src/devtools/test-hooks.ts';
import { toyGame, toyRows, toyScenario, D0, type ToyCmd, type ToyBundle } from './fixtures/toy-game.ts';

const bundle: ToyBundle = { rows: toyRows() };

function played(): Sim<ReturnType<typeof toyGame.init>, ToyCmd, ToyBundle> {
  const sim = new Sim(toyGame, bundle, toyScenario());
  sim.command({ type: 'subscribe', reader: 'SYN_hunter' });
  sim.command({ type: 'move', to: 'SYN_B', hours: 5 });
  sim.advanceTo(instantOf(D0 + 4, 0));
  sim.command({ type: 'move', to: 'SYN_C', hours: 30 });
  sim.advanceTo(instantOf(D0 + 9, 12 * 3600));
  return sim;
}

describe('inspector model', () => {
  it('summarises the simulation without changing it', () => {
    const sim = played();
    const before = sim.hash();
    const o = overview(sim);
    expect(o.game).toBe('toy');
    expect(o.processed).toBe(sim.processed);
    expect(o.records).toBe(sim.records.size);
    queueRows(sim); recordRows(sim, 'SYN_hunter'); paramsInForce(sim); traceRows(sim); knownReaders(sim);
    expect(sim.hash()).toBe(before);
  });

  it('lists pending events in the order they will run', () => {
    const sim = played();
    const rows = queueRows(sim);
    expect(rows.map((r) => r.seq)).toEqual(sim.queue.pending().map((e) => e.seq));
    expect(rows[0]!.type).toBe(sim.queue.peek()!.type);
  });

  it('shows a reader only what has reached it, and ground truth shows everything', () => {
    const sim = played();
    const all = recordRows(sim, GROUND_TRUTH);
    const hunter = recordRows(sim, 'SYN_hunter');
    expect(all.length).toBe(sim.records.size);
    expect(hunter.length).toBeLessThanOrEqual(all.length);
    expect(hunter.every((r) => r.arrives !== undefined)).toBe(true);
    expect(knownReaders(sim)).toEqual(['SYN_gossip', 'SYN_hunter', 'SYN_police']);
  });

  it('shows the parameter row in force today for each key', () => {
    const sim = played();
    const p = paramsInForce(sim);
    // coop-1 runs D0+3..D0+9 and the simulation stands on D0+9, so it has closed.
    expect(p.map((r) => r.id)).not.toContain('coop-1');
    expect(p.map((r) => r.id)).toContain('surv');
    expect(paramsInForce(sim, 'records.lag').map((r) => r.id).sort()).toEqual(['lag-gossip', 'lag-reg']);
  });

  it('replay checks agree from the start and from each snapshot', () => {
    const sim = played();
    const expected = sim.hash();
    expect(checkReplay(toyGame, bundle, sim.scenario, sim.log, sim.processed, expected).ok).toBe(true);
    for (const snap of sim.snapshots) {
      const c = checkReplay(toyGame, bundle, sim.scenario, sim.log, sim.processed, expected, snap);
      expect(c.ok, c.from).toBe(true);
    }
  });

  it('a wrong expected hash is reported as a mismatch, and a bad log as an error', () => {
    const sim = played();
    expect(checkReplay(toyGame, bundle, sim.scenario, sim.log, sim.processed, 'x').ok).toBe(false);
    const bad = checkReplay(toyGame, bundle, sim.scenario, [{ k: 0, cmd: { type: 'move', to: 'nowhere', hours: 1 } }], sim.processed, 'x');
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/rejected/);
  });

  it('the save code carries the whole log', () => {
    const sim = played();
    const save = decodeSave(saveCodeOf(sim, 'b1', 'd1'));
    expect(save.game).toBe('toy');
    expect(save.log).toEqual(sim.log);
    expect(save.processed).toBe(sim.processed);
  });
});

describe('test hooks', () => {
  it('replaying a save code gives the live hash', () => {
    const sim = played();
    const hooks = testHooks({
      getSim: () => sim,
      create: (id, seed) => { expect(id).toBe('toy-1'); return new Sim(toyGame, bundle, toyScenario(seed)); },
      buildId: 'b', dataHash: 'd',
    });
    const res = hooks.replay(hooks.save());
    expect(res).toEqual({ hash: sim.hash(), processed: sim.processed });
    const n = hooks.step(3);
    expect(n).toBe(3);
    expect(hooks.processed()).toBe(res.processed + 3);
  });
});
