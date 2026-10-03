import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/** Absolute path of the prototype/ folder. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const GAMES = ['c07-departure', 'c01-masters', 'c04-legends'] as const;
export type GameId = (typeof GAMES)[number];
export const SHORT: Record<string, GameId> = { c07: 'c07-departure', c01: 'c01-masters', c04: 'c04-legends' };

export function resolveGames(args: string[]): GameId[] {
  const named = args.filter((a) => !a.startsWith('--'));
  if (named.length === 0 || named.includes('all')) return [...GAMES];
  return named.map((a) => {
    const g = SHORT[a] ?? (GAMES as readonly string[]).find((x) => x === a);
    if (!g) throw new Error(`Unknown game "${a}". Use one of: ${Object.keys(SHORT).join(', ')}, all.`);
    return g as GameId;
  });
}
