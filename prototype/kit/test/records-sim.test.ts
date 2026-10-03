import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { RecordStore } from '../src/records/store.ts';
import { readersOf, canRead } from '../src/records/readers.ts';
import { arrival, delivered, ownTrail, appendRecord, subscribe } from '../src/records/delivery.ts';
import { ParamLayer } from '../src/params/layer.ts';
import { Sim } from '../src/sim/sim.ts';
import { runScript, replay } from '../src/sim/scenario.ts';
import { encodeSave, decodeSave } from '../src/sim/savecode.ts';
import { canonicalJson } from '../src/sim/canonical.ts';
import { instantOf, NEVER } from '../src/time/instant.ts';
import { toyGame, toyRows, toyScenario, D0, type ToyCmd } from './fixtures/toy-game.ts';
import type { NewRecord } from '../src/records/tuple.ts';

const params = new ParamLayer(toyRows());
const reg = (time: number, n = 0): NewRecord => ({ kind: 'SYN.registration', subject: 'SYN_courier', predicate: 'lodged-at', value: `SYN_T${n}`, confidence: 900, source: 'SYN_police', time, authorship: 'world' });

describe('record store', () => {
  it('is append-only with consecutive ids and indices', () => {
    const st = new RecordStore();
    const a = st.append(reg(10));
    const b = st.append({ ...reg(20), sigs: ['kw:SYN_alpha'] });
    expect([a.id, b.id]).toEqual([1, 2]);
    expect(st.bySubject('SYN_courier')).toHaveLength(2);
    expect(st.bySig('kw:SYN_alpha')[0]!.id).toBe(2);
    expect(() => { (a as { value: unknown }).value = 'x'; }).toThrow(); // frozen in debug
    expect(() => st.append({ ...reg(1), confidence: 1001 })).toThrow();
    const back = RecordStore.fromJSON(JSON.parse(JSON.stringify(st.toJSON())));
    expect(back.toJSON()).toEqual(st.toJSON());
  });
});

describe('readers are derived at query time', () => {
  it('opens old records to a retroactive edge without changing the record', () => {
    const st = new RecordStore();
    const r = st.append(reg(instantOf(D0, 0)));
    const before = canonicalJson(r);
    expect(readersOf(r, D0 + 1, params, 1)).toEqual(['SYN_police']);
    expect(canRead('SYN_hunter', r, D0 + 4, params, 1)).toBe(true); // coop-1 open D0+3..D0+9, retro
    expect(canRead('SYN_hunter', r, D0 + 10, params, 1)).toBe(false); // edge closed
    expect(canonicalJson(r)).toBe(before);
  });
  it('keeps non-retroactive edges closed to older records', () => {
    const st = new RecordStore();
    const old = st.append({ ...reg(instantOf(D0, 0)), kind: 'SYN.sighting', source: 'SYN_gossip' });
    const fresh = st.append({ ...reg(instantOf(D0 + 2, 0)), kind: 'SYN.sighting', source: 'SYN_gossip' });
    expect(canRead('SYN_hunter', old, D0 + 2, params, 1)).toBe(false);
    expect(canRead('SYN_hunter', fresh, D0 + 2, params, 1)).toBe(true);
  });
});

describe('arrival and the backfill rule', () => {
  it('delivers at max(emit + source lag, edge open) + edge lag', () => {
    const st = new RecordStore();
    const r = st.append(reg(instantOf(D0, 0)));
    const atSource = arrival(r, 'SYN_police', params, 3);
    expect(atSource - r.time).toBeGreaterThanOrEqual(3600);
    expect(atSource - r.time).toBeLessThanOrEqual(36000);
    const viaEdge = arrival(r, 'SYN_hunter', params, 3);
    const open = instantOf(D0 + 3, 0);
    expect(viaEdge - open).toBeGreaterThanOrEqual(1800);
    expect(viaEdge - open).toBeLessThanOrEqual(7200);
    expect(arrival(st.append(reg(instantOf(D0 + 9, 1))), 'SYN_hunter', params, 3)).toBe(NEVER); // after the edge closed
  });
  it('drops destroyed archive records for everyone after the destruction date', () => {
    const st = new RecordStore();
    let lost = 0; let kept = 0;
    for (let i = 0; i < 200; i++) {
      const r = st.append({ ...reg(instantOf(D0 + 2, i * 60)), kind: 'SYN.sighting', source: 'SYN_gossip' });
      if (readersOf(r, D0 + 8, params, 11).length === 0) lost++; else kept++;
    }
    expect(lost).toBeGreaterThan(60);
    expect(kept).toBeGreaterThan(60);
  });
});

describe('eager delivery equals lazy delivery', () => {
  it('for random records and subscription times', () => {
    fc.assert(fc.property(
      fc.array(fc.tuple(fc.integer({ min: 0, max: 12 * 86400 }), fc.boolean()), { minLength: 1, maxLength: 25 }),
      fc.integer({ min: 0, max: 5 * 86400 }),
      fc.integer({ min: 1, max: 1000 }),
      (recs, subAt, seed) => {
        const st = new RecordStore();
        const events: Array<{ at: number; rec: number }> = [];
        let now = instantOf(D0, 0);
        const sched = { get now() { return now; }, schedule: (at: number, _p: number, _t: string, pl: unknown) => { events.push({ at, rec: (pl as { rec: number }).rec }); return 0; } };
        const sorted = [...recs].sort((a, b) => a[0] - b[0]);
        let subscribed = false;
        for (const [dt, gossip] of sorted) {
          const t = instantOf(D0, 0) + dt;
          if (!subscribed && t >= instantOf(D0, 0) + subAt) { now = instantOf(D0, 0) + subAt; subscribe(st, 'SYN_hunter', {}, params, seed, sched); subscribed = true; }
          now = t;
          appendRecord(st, gossip ? { ...reg(t), kind: 'SYN.sighting', source: 'SYN_gossip' } : reg(t), params, seed, sched);
        }
        if (!subscribed) { now = instantOf(D0, 0) + subAt; subscribe(st, 'SYN_hunter', {}, params, seed, sched); }
        const subTime = instantOf(D0, 0) + subAt;
        for (const probe of [subTime, subTime + 86400, instantOf(D0 + 4, 0), instantOf(D0 + 13, 0)]) {
          if (probe < subTime) continue;
          const eager = events.filter((e) => e.at <= probe).map((e) => e.rec).sort((a, b) => a - b);
          const lazy = delivered(st, 'SYN_hunter', probe, params, seed).map((r) => r.id);
          // Records appended after `probe` cannot have been delivered by then in either view.
          if (JSON.stringify(eager) !== JSON.stringify(lazy)) return false;
        }
        return true;
      }), { numRuns: 150 });
  });
});

describe('own trail', () => {
  it('copies the player’s records and holds no store handle', () => {
    const st = new RecordStore();
    st.append(reg(1));
    st.append({ ...reg(2), subject: 'SYN_other' });
    st.append({ ...reg(3), subject: 'SYN_other', authorship: 'claim', author: 'SYN_courier' });
    const trail = ownTrail(st, ['SYN_courier']);
    expect(trail.records.map((r) => r.id)).toEqual([1, 3]);
    expect(Object.keys(trail)).toEqual(['records']);
    (trail.records[0] as { value: unknown }).value = 'changed';
    expect(st.get(1)!.value).toBe('SYN_T0');
  });
});

describe('simulation harness', () => {
  const scenario = toyScenario();
  const bundle = { rows: toyRows() };
  const script = {
    scenario: 'toy-1',
    steps: [
      { cmd: { type: 'subscribe', reader: 'SYN_hunter' } as ToyCmd },
      { cmd: { type: 'move', to: 'SYN_B', hours: 5 } as ToyCmd },
      { cmd: { type: 'move', to: 'SYN_C', hours: 2 } as ToyCmd, expectError: true },
      { wait: { untilEvent: 'arrive' } },
      { cmd: { type: 'move', to: 'SYN_C', hours: 30 } as ToyCmd },
      { wait: { untilTime: instantOf(D0 + 1, 0) } },
      { cmd: { type: 'cancel' } as ToyCmd },
      { cmd: { type: 'move', to: 'SYN_D', hours: 12 } as ToyCmd },
      { wait: { untilTrace: 'arrived' } },
      { cmd: { type: 'move', to: 'SYN_A', hours: 3 } as ToyCmd },
    ],
    end: { untilTime: instantOf(D0 + 12, 0) },
  };

  it('runs a script, logs commands with k, and schedules parameter changes', () => {
    const { sim, log } = runScript(toyGame, bundle, scenario, script);
    expect(log.map((e) => e.cmd.type)).toEqual(['subscribe', 'move', 'move', 'cancel', 'move', 'move']);
    expect(log[0]!.k).toBe(0);
    expect(sim.state.moves).toBe(3);
    expect(sim.state.at).toBe('SYN_A');
    expect(sim.state.paramChanges).toEqual([D0 + 1, D0 + 3, D0 + 8, D0 + 9]);
    expect(sim.state.delivered.length).toBeGreaterThan(0);
    expect(sim.snapshots.length).toBeGreaterThanOrEqual(1);
  });

  it('replays to the same hash, from the start and from a snapshot', () => {
    const { sim, log, hash } = runScript(toyGame, bundle, scenario, script);
    const again = replay(toyGame, bundle, scenario, log, sim.processed);
    expect(again.hash()).toBe(hash);
    // Restore from a mid-run snapshot taken by hand, then finish.
    const mid = new Sim(toyGame, bundle, scenario);
    mid.replayLog(log.filter((e) => e.k <= 20), 20);
    const snap = mid.snapshot();
    const restored = Sim.restore(toyGame, bundle, scenario, snap);
    restored.replayLog(log, sim.processed);
    expect(restored.hash()).toBe(hash);
  });

  it('round-trips a save code', () => {
    const { sim, log, hash } = runScript(toyGame, bundle, scenario, script);
    const code = encodeSave({ v: 1, game: 'toy', buildId: 'b', dataHash: 'd', scenario: scenario.id, seed: scenario.seed, processed: sim.processed, log, answers: { q1: 'Lumière ✓' } });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = decodeSave<ToyCmd>(code);
    expect(back.answers).toEqual({ q1: 'Lumière ✓' });
    expect(replay(toyGame, bundle, scenario, back.log, back.processed).hash()).toBe(hash);
  });

  it('differs when the seed differs', () => {
    const a = runScript(toyGame, bundle, scenario, script).hash;
    const b = runScript(toyGame, bundle, toyScenario(8), script).hash;
    expect(a).not.toBe(b);
  });

  it('refuses to schedule in the past and unknown event types', () => {
    const sim = new Sim(toyGame, bundle, scenario);
    expect(() => sim.queue.push(0, 0, 'mystery', null) && sim.advanceTo(instantOf(D0 + 13, 0))).toThrow(/No handler/);
  });
});
