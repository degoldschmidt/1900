/** Test helpers for C07 on the invented preview world (SYN_ ids; never shipped). */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sim, type Scenario } from '../../../kit/src/sim/sim.ts';
import type { ParamRow } from '../../../kit/src/params/types.ts';
import type { ReadyBundle, GameBundle } from '../../../kit/src/data/bundle.ts';
import { dayFromIso } from '../../../kit/src/time/calendar.ts';
import { module } from '../src/game.ts';
import type { C07Bundle } from '../src/rules/data.ts';
import { instantIn } from '../src/rules/data.ts';
import type { C07Command } from '../src/commands.ts';
import { viewInputs, advance, type C07Sim } from '../src/session.ts';
import { plannerView } from '../src/views/planner.ts';
import { belowN } from '../../../kit/src/rng/draw.ts';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const WORLD_JSON = join(HERE, '..', 'preview', 'world.bundle.json');

let rawCache: ReadyBundle | null = null;
let bundleCache: C07Bundle | null = null;
export function raw(): ReadyBundle { return rawCache ??= JSON.parse(readFileSync(WORLD_JSON, 'utf8')) as ReadyBundle; }
export function bundle(): C07Bundle { return bundleCache ??= module.bundleFrom(raw() as unknown as GameBundle); }

export function scenario(id: string, opts: { seed?: number; overrides?: ParamRow[] } = {}): Scenario {
  const sc = module.scenario(bundle(), id, opts.seed);
  return opts.overrides ? { ...sc, paramOverrides: opts.overrides } : sc;
}

export function newSim(id: string, opts: { seed?: number; overrides?: ParamRow[] } = {}): C07Sim {
  return new Sim(module.game, bundle(), scenario(id, opts));
}

/** Overrides every c07.delay row with one CDF (tests force delays only this way). */
export function forceDelays(edges: number[], w: number[]): ParamRow[] {
  return raw().params.filter((r) => r.param === 'c07.delay').map((r) => ({ ...r, value: { edges, w } }));
}

export const at = (city: string, date: string, time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return instantIn(bundle(), city, dayFromIso(date), h! * 3600 + m! * 60);
};

export function cmd(sim: C07Sim, c: C07Command): void {
  const r = sim.command(c);
  if (!r.ok) throw new Error(`${c.type} rejected: ${r.error}`);
}

export function next(sim: C07Sim): string | null {
  advance(sim);
  return sim.state.diary.interrupts.at(-1)?.kind ?? null;
}

/** Runs until an interrupt of one of the kinds (or the end); returns the kind met. */
export function until(sim: C07Sim, kinds: string[], max = 50): string | null {
  for (let i = 0; i < max; i++) {
    const before = sim.state.diary.interrupts.length;
    const r = advance(sim);
    const fresh = sim.state.diary.interrupts.slice(before).map((x) => x.kind);
    const hit = fresh.find((k) => kinds.includes(k));
    if (hit) return hit;
    const k = sim.state.diary.interrupts.at(-1)?.kind ?? null;
    if (sim.state.ending || r !== 'met') return k;
  }
  return null;
}

/** The planner's options to a city now. */
export function plan(sim: C07Sim, to: string) {
  const { p, d } = viewInputs(sim);
  return plannerView(p, d, to);
}

export const trips = (sim: C07Sim): string[] => sim.trace.filter((t) => t.kind === 'board').map((t) => (t.data as { trainKey: string }).trainKey);
export { viewInputs, advance };

/** A keyed random walk: lodge now and then, book a random known itinerary, advance; until the end. */
export function randomWalk(sim: C07Sim, seed: number, steps = 14): void {
  const b = sim.bundle;
  for (let i = 0; i < steps && !sim.state.ending; i++) {
    if (sim.state.me.where.k === 'city' && !sim.state.diary.booking) {
      if (belowN(3, seed, 'walk-lodge', i) === 0) sim.command({ type: 'planVerb', verb: 'lodge', args: { tier: 'modest' } });
      const here = sim.state.me.where.city;
      const dests = b.gameCities.filter((c) => c !== here);
      const to = dests[belowN(dests.length, seed, 'walk-to', i)]!;
      const pl = plan(sim, to);
      const opts = pl.options.filter((o) => o.classes.some((c) => c.legal));
      if (opts.length) {
        const o = opts[belowN(opts.length, seed, 'walk-pick', i)]!;
        const legal = o.classes.filter((c) => c.legal);
        sim.command(legal[belowN(legal.length, seed, 'walk-cls', i)]!.cmd);
      }
    }
    if (advance(sim) !== 'met') break;
  }
}
