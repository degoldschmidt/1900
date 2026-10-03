/**
 * Loads a game's module and compiled data bundle for the Node tools. A game exists for the tools
 * once games/<game>/src/game.ts exports `module` (see kit/src/sim/module.ts).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, GAMES, type GameId } from './paths.ts';
import { decodeBundle, type GameBundle } from '../../kit/src/data/bundle.ts';
import type { GameModule } from '../../kit/src/sim/module.ts';
import type { Command } from '../../kit/src/sim/sim.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModule = GameModule<any, Command, any>;

export function gameIdOf(name: string): GameId {
  const g = (GAMES as readonly string[]).find((x) => x === name);
  if (!g) throw new Error(`Unknown game "${name}"`);
  return g as GameId;
}

export async function loadGameModule(game: GameId): Promise<AnyModule> {
  const file = join(ROOT, 'games', game, 'src', 'game.ts');
  if (!existsSync(file)) throw new Error(`${game} has no rules yet (games/${game}/src/game.ts is missing). Rules are written after the game's data freeze.`);
  const mod = await import(pathToFileURL(file).href) as { module?: AnyModule };
  if (!mod.module) throw new Error(`games/${game}/src/game.ts does not export "module"`);
  return mod.module;
}

export function loadRawBundle(game: GameId): GameBundle {
  const file = join(ROOT, 'build', 'data', `${game}.bundle.json`);
  if (!existsSync(file)) throw new Error(`No compiled data for ${game}: run npm run data:compile first`);
  return decodeBundle(readFileSync(file, 'utf8'));
}
