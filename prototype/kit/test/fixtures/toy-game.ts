/**
 * A synthetic toy game for kit tests (SYN_ identifiers; never compiled into a release).
 * A courier walks between SYN_ towns; each arrival writes a registration record read by a
 * police institution with a lag; the player can order moves and subscribe a hunter.
 */
import type { GameDef, Scenario, Command } from '../../src/sim/sim.ts';
import type { ParamRow } from '../../src/params/types.ts';
import { DELIVERED_EVENT } from '../../src/records/delivery.ts';
import { instantOf } from '../../src/time/instant.ts';

export interface ToyState {
  at: string;
  moves: number;
  delivered: Array<{ rec: number; reader: string; at: number }>;
  paramChanges: number[];
  pending: number | null;
}

export type ToyCmd =
  | { type: 'move'; to: string; hours: number }
  | { type: 'cancel' }
  | { type: 'subscribe'; reader: string };

export interface ToyBundle { rows: ParamRow[] }

export const TOWNS = ['SYN_A', 'SYN_B', 'SYN_C', 'SYN_D'];

export const toyGame: GameDef<ToyState, ToyCmd, ToyBundle> = {
  id: 'toy',
  paramRows: (b) => b.rows,
  init(ctx, _bundle, scenario) {
    ctx.schedule(scenario.start + 3600, 30, 'tick', { n: 0 });
    return { at: 'SYN_A', moves: 0, delivered: [], paramChanges: [], pending: null };
  },
  handlers: {
    tick(state, p: { n: number }, ctx) {
      if (p.n < 50) ctx.schedule(ctx.now + 6 * 3600, 30, 'tick', { n: p.n + 1 });
      if (ctx.chance(300, 'wander', p.n)) {
        const to = TOWNS[ctx.below(TOWNS.length, 'wander-to', p.n)]!;
        ctx.emit({ kind: 'SYN.sighting', subject: 'SYN_courier', predicate: 'seen-at', value: to, confidence: 500, source: 'SYN_gossip', time: ctx.now, authorship: 'world', place: to });
      }
    },
    arrive(state, p: { to: string }, ctx) {
      state.at = p.to;
      state.moves++;
      state.pending = null;
      ctx.emit({ kind: 'SYN.registration', subject: 'SYN_courier', predicate: 'lodged-at', value: p.to, confidence: 900, source: 'SYN_police', time: ctx.now, authorship: 'world', place: p.to });
      ctx.trace('arrived', p.to);
    },
    [DELIVERED_EVENT](state, p: { rec: number; reader: string }, ctx) {
      state.delivered.push({ rec: p.rec, reader: p.reader, at: ctx.now });
    },
    'kit.ParamChanged'(state, p: { day: number }) {
      state.paramChanges.push(p.day);
    },
  },
  validate(state, cmd) {
    if (cmd.type === 'move') {
      if (!TOWNS.includes(cmd.to)) return `No town ${cmd.to}`;
      if (state.pending !== null) return 'Already travelling';
      if (cmd.hours < 1) return 'A journey takes at least an hour';
    }
    if (cmd.type === 'cancel' && state.pending === null) return 'Nothing to cancel';
    return null;
  },
  apply(state, cmd, ctx) {
    if (cmd.type === 'move') state.pending = ctx.schedule(ctx.now + cmd.hours * 3600, 20, 'arrive', { to: cmd.to });
    if (cmd.type === 'cancel' && state.pending !== null) { ctx.cancel(state.pending); state.pending = null; }
    if (cmd.type === 'subscribe') ctx.subscribe(cmd.reader, { kinds: ['SYN.registration', 'SYN.sighting'] });
  },
};

const day = (n: number) => n;
export const D0 = 5_000; // a synthetic day number

export function toyRows(): ParamRow[] {
  const base = { tier: 0 as const, dateBasis: 'design' as const, valueBasis: 'design' as const, public: false };
  return [
    { ...base, id: 'lag-reg', param: 'records.lag', keyKind: 'global', key: 'SYN.registration@SYN_police', from: day(0), to: null, value: { minSec: 3600, maxSec: 36000 }, dv: 'DV-SYN-1' },
    { ...base, id: 'lag-gossip', param: 'records.lag', keyKind: 'global', key: 'SYN.sighting', from: day(0), to: null, value: { minSec: 0, maxSec: 7200 }, dv: 'DV-SYN-2' },
    { ...base, id: 'coop-1', param: 'coop.edge', keyKind: 'pair', key: 'SYN_police>SYN_hunter', from: D0 + 3, to: D0 + 9, value: { lagSec: [1800, 7200], retro: true }, dv: 'DV-SYN-3' },
    { ...base, id: 'coop-2', param: 'coop.edge', keyKind: 'pair', key: 'SYN_gossip>SYN_hunter', from: D0 + 1, to: null, value: { lagSec: [600, 600], retro: false }, dv: 'DV-SYN-4' },
    { ...base, id: 'surv', param: 'archive.survival', keyKind: 'institution', key: 'SYN_gossip', from: D0 + 8, to: null, value: { permille: 500 }, dv: 'DV-SYN-5' },
  ];
}

export function toyScenario(seed = 7): Scenario {
  return { id: 'toy-1', game: 'toy', title: 'Toy', start: instantOf(D0, 8 * 3600), end: instantOf(D0 + 14, 0), seed, setup: {} };
}

export type { Command };
