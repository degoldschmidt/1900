/**
 * Glue for the page (main.tsx) and the Node tools: builds the views' inputs from a running
 * simulation. Not a view and not a rule: it reaches the record store only to copy the player's own
 * trail (kit `ownTrail`, a copy with no store handle) and hands the views the public rows only.
 */
import type { Sim } from '#kit/sim/sim.ts';
import { ownTrail } from '#kit/records/delivery.ts';
import type { C07State } from './rules/types.ts';
import type { C07Bundle } from './rules/data.ts';
import type { C07Command } from './commands.ts';
import { publicState, type PublicState, type ViewData } from './views/public.ts';

export type C07Sim = Sim<C07State, C07Command, C07Bundle>;

/** The public state and view data of a simulation now. */
export function viewInputs(sim: C07Sim): { p: PublicState; d: ViewData } {
  const legend = sim.state.legend.id;
  return {
    p: publicState(sim.state),
    d: { b: sim.bundle, params: sim.params.publicView(), trail: ownTrail(sim.records, [legend, `anon:${legend}`]), now: sim.now },
  };
}

/** Advance (RULES 5.1): run until the next interrupt or the ending. */
export function advance(sim: C07Sim, maxEvents = 200_000): 'met' | 'idle' | 'limit' {
  const cursor = sim.state.diary.interrupts.length;
  return sim.advanceUntil((s) => s.diary.interrupts.length > cursor || s.ending !== null, maxEvents);
}
