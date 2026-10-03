/**
 * What a game exports from games/<game>/src/game.ts for the Node tools (golden hashes, playtest
 * analysis) and for its own page. The kit only defines the shape; every game fills it in itself.
 */
import type { GameDef, Command, Scenario, Sim } from './sim.ts';
import type { GameBundle } from '../data/bundle.ts';

export type Metric = number | string | boolean | null;

export interface GameModule<S, C extends Command, B> {
  game: GameDef<S, C, B>;
  /** Scenario ids in menu order. */
  scenarioIds: readonly string[];
  /** Turns the inlined data bundle into the game's typed bundle. */
  bundleFrom(raw: GameBundle): B;
  /** Builds a scenario; `seed` replaces the scenario's default seed (save codes record it). */
  scenario(bundle: B, id: string, seed?: number): Scenario;
  /**
   * Hypothesis metrics read from a replayed game, keyed by metric id (e.g. "H07-1.verbsPerStay").
   * `answers` are the end-of-scenario questionnaire answers the save code carries.
   */
  metrics?(sim: Sim<S, C, B>, answers: Readonly<Record<string, string | number>>): Record<string, Metric>;
}
