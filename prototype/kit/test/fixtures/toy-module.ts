/** The toy game wrapped as a GameModule, for tool tests (synthetic; SYN_ identifiers). */
import type { GameModule } from '../../src/sim/module.ts';
import { toyGame, toyRows, toyScenario, type ToyState, type ToyCmd, type ToyBundle } from './toy-game.ts';
import type { GameBundle } from '../../src/data/bundle.ts';

export const toyRaw: GameBundle = { meta: { game: 'toy', status: 'awaiting-data', synthetic: true, dataHash: 'SYN-data-1' }, rows: toyRows() };

export const toyModule: GameModule<ToyState, ToyCmd, ToyBundle> = {
  game: toyGame,
  scenarioIds: ['toy-1'],
  bundleFrom: (raw) => ({ rows: (raw as unknown as ToyBundle).rows }),
  scenario: (_b, id, seed) => {
    if (id !== 'toy-1') throw new Error(`No scenario ${id}`);
    return toyScenario(seed ?? 7);
  },
  metrics: (sim) => ({ 'SYN-1.moves': sim.state.moves, 'SYN-1.deliveries': sim.state.delivered.length }),
};
