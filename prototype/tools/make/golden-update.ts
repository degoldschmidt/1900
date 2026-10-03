/**
 * Re-runs every scenario script of a game and rewrites its input logs and golden records.
 * Golden values change only through this command, with a reason that is written into each
 * record and appended to scenarios/golden/CHANGES.md.
 *
 *   npm run golden:update -- c07 --reason "delay draw now keyed per train and day"
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ROOT, resolveGames } from './paths.ts';
import { loadGameModule, loadRawBundle } from './game-module.ts';
import { runGolden, type GoldenRecord } from './golden.ts';
import type { Script } from '../../kit/src/sim/scenario.ts';
import type { Command } from '../../kit/src/sim/sim.ts';

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const reason = argValue(args, '--reason');
  if (!reason || reason.trim().length < 8) throw new Error('Give a reason: --reason "what changed and why" (at least 8 characters)');
  const games = resolveGames(args.filter((a, i) => a !== '--reason' && args[i - 1] !== '--reason'));
  for (const game of games) {
    const dir = join(ROOT, 'games', game, 'scenarios');
    const scripts = existsSync(join(dir, 'scripts')) ? readdirSync(join(dir, 'scripts')).filter((f) => f.endsWith('.script.json')).sort() : [];
    if (scripts.length === 0) { console.log(`${game}: no scenario scripts`); continue; }
    const mod = await loadGameModule(game);
    const raw = loadRawBundle(game);
    const bundle = mod.bundleFrom(raw);
    mkdirSync(join(dir, 'logs'), { recursive: true });
    mkdirSync(join(dir, 'golden'), { recursive: true });
    const changed: string[] = [];
    for (const file of scripts) {
      const name = basename(file, '.script.json');
      const script = JSON.parse(readFileSync(join(dir, 'scripts', file), 'utf8')) as Script<Command>;
      const { log, golden } = runGolden(mod, bundle, raw.meta.dataHash, name, script, reason);
      const goldenPath = join(dir, 'golden', `${name}.golden.json`);
      const old = existsSync(goldenPath) ? (JSON.parse(readFileSync(goldenPath, 'utf8')) as GoldenRecord) : null;
      writeFileSync(join(dir, 'logs', `${name}.input.json`), JSON.stringify(log, null, 1) + '\n');
      writeFileSync(goldenPath, JSON.stringify(golden, null, 2) + '\n');
      if (!old || old.hash !== golden.hash || old.logHash !== golden.logHash) changed.push(`${name}: ${old?.hash ?? 'new'} → ${golden.hash}`);
      console.log(`${game}/${name}: ${golden.processed} events, ${golden.commands} commands, hash ${golden.hash}`);
    }
    if (changed.length) {
      appendFileSync(join(dir, 'golden', 'CHANGES.md'), `\n## ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC\n\n${reason.trim()}\n\n${changed.map((c) => `- ${c}`).join('\n')}\n`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
