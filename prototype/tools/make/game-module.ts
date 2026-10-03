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

// Kit code reads the build-time flags esbuild defines for the pages; the Node tools run the
// simulation as a debug build would (records frozen, synthetic data allowed).
const g = globalThis as { __DEBUG__?: boolean; __BUILD_ID__?: string; __PREVIEW__?: boolean };
g.__DEBUG__ ??= true;
g.__PREVIEW__ ??= false;
g.__BUILD_ID__ ??= 'node';

/** A game's mechanics-preview bundle (invented data; C07 only so far), when it has one. */
export function previewBundlePath(game: GameId): string {
  return join(ROOT, 'games', game, 'preview', 'world.bundle.json');
}

/** `--preview` on the command line: use the game's preview world instead of the compiled data. */
export const wantsPreview = (args: readonly string[]): boolean => args.includes('--preview');

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

export function loadRawBundle(game: GameId, opts: { preview?: boolean } = {}): GameBundle {
  if (opts.preview) {
    const file = previewBundlePath(game);
    if (!existsSync(file)) throw new Error(`${game} has no preview world (games/${game}/preview/world.bundle.json)`);
    return decodeBundle(readFileSync(file, 'utf8'));
  }
  const file = join(ROOT, 'build', 'data', `${game}.bundle.json`);
  if (!existsSync(file)) throw new Error(`No compiled data for ${game}: run npm run data:compile first (or pass --preview for a preview world)`);
  return decodeBundle(readFileSync(file, 'utf8'));
}
