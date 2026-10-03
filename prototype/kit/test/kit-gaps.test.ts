/** Kit additions requested by the game specifications (C07 and C01 kit gaps). */
import { describe, it, expect } from 'vitest';
import { RecordStore } from '../src/records/store.ts';
import { readersOf } from '../src/records/readers.ts';
import { arrival, arrivalVia } from '../src/records/delivery.ts';
import { ParamLayer } from '../src/params/layer.ts';
import type { ParamRow } from '../src/params/types.ts';
import { Sim, type GameDef } from '../src/sim/sim.ts';
import { instantOf, NEVER } from '../src/time/instant.ts';
import { toyGame, toyRows, toyScenario, D0, type ToyCmd, type ToyBundle, type ToyState } from './fixtures/toy-game.ts';
import type { NewRecord } from '../src/records/tuple.ts';

const base = { tier: 0 as const, dateBasis: 'design' as const, valueBasis: 'design' as const, public: false, keyKind: 'pair' as const };
const rec = (kind: string, n: number): NewRecord => ({ kind, subject: 'SYN_x', predicate: 'p', value: n, confidence: 800, source: 'SYN_src', time: instantOf(D0, n * 60), authorship: 'world' });

describe('cooperation edges with kind filters and a pass share', () => {
  const rows: ParamRow[] = [
    { ...base, id: 'only-slips', param: 'coop.edge', key: 'SYN_src>SYN_a', from: D0, to: null, value: { lagSec: [60, 60], retro: false, kinds: ['SYN.slip'] }, dv: 'DV-SYN-1' },
    { ...base, id: 'half', param: 'coop.edge', key: 'SYN_src>SYN_b', from: D0, to: null, value: { lagSec: [0, 0], retro: false, permille: 500 }, dv: 'DV-SYN-2' },
    { ...base, id: 'slow', param: 'coop.edge', key: 'SYN_src>SYN_c', from: D0, to: null, value: { lagSec: [3600, 3600], retro: false }, dv: 'DV-SYN-3' },
    { ...base, id: 'fast-late', param: 'coop.edge', key: 'SYN_src>SYN_c', from: D0 + 1, to: null, value: { lagSec: [60, 60], retro: true }, dv: 'DV-SYN-4' },
  ];
  const params = new ParamLayer(rows);

  it('passes only the listed kinds', () => {
    const st = new RecordStore();
    const slip = st.append(rec('SYN.slip', 1));
    const other = st.append(rec('SYN.letter', 2));
    expect(readersOf(slip, D0, params, 1)).toContain('SYN_a');
    expect(readersOf(other, D0, params, 1)).not.toContain('SYN_a');
    expect(arrival(other, 'SYN_a', params, 1)).toBe(NEVER);
  });

  it('passes a keyed share of records, the same for the reader view and for arrival', () => {
    const st = new RecordStore();
    let passed = 0;
    for (let n = 0; n < 400; n++) {
      const r = st.append(rec('SYN.slip', n));
      const reads = readersOf(r, D0 + 1, params, 9).includes('SYN_b');
      expect(arrival(r, 'SYN_b', params, 9) !== NEVER).toBe(reads);
      if (reads) passed++;
    }
    expect(passed).toBeGreaterThan(150);
    expect(passed).toBeLessThan(250);
  });

  it('names the row that delivered first', () => {
    const st = new RecordStore();
    const r = st.append(rec('SYN.slip', 5));
    expect(arrivalVia(r, 'SYN_c', params, 1)).toEqual({ at: r.time + 3600, via: 'slow' });
    // The retroactive edge from the next day is later than the slow edge for this record.
    const late = st.append({ ...rec('SYN.slip', 0), time: instantOf(D0, 86_000) });
    expect(arrivalVia(late, 'SYN_c', params, 1)).toEqual({ at: instantOf(D0 + 1, 0) + 60, via: 'fast-late' });
    expect(arrivalVia(r, 'SYN_src', params, 1)).toEqual({ at: r.time, via: null });
  });
});

describe('handlers reach the bundle, also after a restore', () => {
  type S = { seen: number[] };
  const game: GameDef<S, ToyCmd, { magic: number }> = {
    id: 'SYN_bundle', paramRows: () => [],
    init(ctx) { ctx.schedule(ctx.now + 40 * 86_400, 5, 'tick', null); return { seen: [] }; },
    handlers: { tick(state, _p, ctx) { state.seen.push(ctx.bundle.magic); if (state.seen.length < 3) ctx.schedule(ctx.now + 40 * 86_400, 5, 'tick', null); } },
    validate: () => null, apply: () => {},
  };
  it('reads the bundle in handlers of a live and a restored game', () => {
    const scenario = { ...toyScenario(), end: instantOf(D0 + 200, 0) };
    const sim = new Sim(game, { magic: 42 }, scenario);
    sim.step();
    const snap = sim.snapshots.at(-1)!;
    const back = Sim.restore(game, { magic: 42 }, scenario, snap);
    while (back.step());
    expect(back.state.seen.every((v) => v === 42)).toBe(true);
    expect(back.state.seen.length).toBe(3);
  });
});

describe('scenario prologues', () => {
  const bundle: ToyBundle = { rows: toyRows() };
  const prologueOf = () => {
    const pre = new Sim(toyGame, bundle, toyScenario());
    pre.command({ type: 'subscribe', reader: 'SYN_hunter' });
    pre.command({ type: 'move', to: 'SYN_C', hours: 9 });
    pre.advanceTo(instantOf(D0 + 4, 0));
    return { log: pre.log.map((e) => ({ k: e.k, cmd: e.cmd })), processed: pre.processed, hash: pre.hash() };
  };

  it('replays the prologue at construction, outside the player log', () => {
    const p = prologueOf();
    const scenario = { ...toyScenario(), prologue: { log: p.log, processed: p.processed } };
    const sim = new Sim<ToyState, ToyCmd, ToyBundle>(toyGame, bundle, scenario);
    expect(sim.hash()).toBe(p.hash);
    expect(sim.log).toEqual([]);
    expect(sim.snapshots).toHaveLength(1);
    expect(sim.snapshots[0]!.processed).toBe(p.processed);
  });

  it('a player log after the prologue replays from the start and from every snapshot', () => {
    const p = prologueOf();
    const scenario = { ...toyScenario(), prologue: { log: p.log, processed: p.processed } };
    const sim = new Sim<ToyState, ToyCmd, ToyBundle>(toyGame, bundle, scenario);
    sim.command({ type: 'move', to: 'SYN_B', hours: 30 });
    sim.advanceTo(instantOf(D0 + 13, 0));
    const fresh = new Sim<ToyState, ToyCmd, ToyBundle>(toyGame, bundle, scenario);
    fresh.replayLog(sim.log, sim.processed);
    expect(fresh.hash()).toBe(sim.hash());
    for (const snap of sim.snapshots) {
      const back = Sim.restore(toyGame, bundle, scenario, snap);
      back.replayLog(sim.log, sim.processed);
      expect(back.hash()).toBe(sim.hash());
    }
  });
});

describe('worst-case exposure for indicators', async () => {
  const { earliestPossibleArrival, possibleReaders } = await import('../src/records/exposure.ts');
  const { delivered } = await import('../src/records/delivery.ts');
  it('is never later or narrower than the truth on the same rows', () => {
    const params = new ParamLayer(toyRows());
    const st = new RecordStore();
    for (let n = 0; n < 300; n++) {
      const r = st.append({ kind: n % 2 ? 'SYN.registration' : 'SYN.sighting', subject: 'SYN_courier', predicate: 'p', value: n, confidence: 900, source: n % 2 ? 'SYN_police' : 'SYN_gossip', time: instantOf(D0, 0) + n * 3_000, authorship: 'world' });
      for (const reader of ['SYN_police', 'SYN_gossip', 'SYN_hunter']) {
        for (const seed of [1, 2, 3]) expect(earliestPossibleArrival(r, reader, params)).toBeLessThanOrEqual(arrival(r, reader, params, seed));
      }
    }
    const t = instantOf(D0 + 9, 0);
    for (const seed of [1, 2, 3]) {
      for (const r of delivered(st, 'SYN_hunter', t, params, seed)) expect(possibleReaders(r, t, params)).toContain('SYN_hunter');
    }
  });

  it('works on the public view, which hides non-public rows', () => {
    const rows = toyRows().map((r) => (r.id === 'coop-2' ? { ...r, public: true } : r));
    const pub = new ParamLayer(rows).publicView();
    const r = { kind: 'SYN.sighting', source: 'SYN_gossip', time: instantOf(D0 + 2, 0) };
    expect(possibleReaders(r, instantOf(D0 + 3, 0), pub)).toEqual(['SYN_gossip', 'SYN_hunter']);
    const slip = { kind: 'SYN.registration', source: 'SYN_police', time: instantOf(D0 + 4, 0) };
    expect(possibleReaders(slip, instantOf(D0 + 5, 0), pub)).toEqual(['SYN_police']); // coop-1 is not public
  });
});
