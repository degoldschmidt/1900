/**
 * Playtest analysis without telemetry: every number comes from replaying a player's save code.
 * The save code holds the scenario, seed, input log and questionnaire answers; replaying it
 * rebuilds the exact game, and the game module's `metrics` reads the hypothesis measures from it.
 *
 *   npm run playtest:analyze -- <save code | file with codes | folder of .txt files> [--out report]
 *
 * Writes a Markdown report (and a CSV beside it with --out). A save made on other data than the
 * current bundle is reported and skipped, since its replay would not be the game that was played.
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { decodeSave, type SaveCode } from '../../kit/src/sim/savecode.ts';
import { Sim, type Command } from '../../kit/src/sim/sim.ts';
import type { Metric } from '../../kit/src/sim/module.ts';
import type { GameBundle } from '../../kit/src/data/bundle.ts';
import { gameIdOf, loadGameModule, loadRawBundle, type AnyModule } from '../make/game-module.ts';

export interface Analysis {
  game: string;
  scenario: string;
  buildId: string;
  ok: boolean;
  problem?: string;
  metrics: Record<string, Metric>;
  answers: Record<string, string | number>;
}

/** Replays one save and reads generic and game-specific metrics. */
export function analyzeSave(save: SaveCode<Command>, mod: AnyModule, raw: GameBundle): Analysis {
  const base = { game: save.game, scenario: save.scenario, buildId: save.buildId, answers: save.answers ?? {} };
  if (save.dataHash !== raw.meta.dataHash) {
    return { ...base, ok: false, problem: `made on data ${save.dataHash}, current data is ${raw.meta.dataHash}`, metrics: {} };
  }
  try {
    const bundle = mod.bundleFrom(raw);
    const sim = new Sim(mod.game, bundle, mod.scenario(bundle, save.scenario, save.seed));
    sim.replayLog(save.log, save.processed);
    const byType = new Map<string, number>();
    for (const e of save.log) byType.set(e.cmd.type, (byType.get(e.cmd.type) ?? 0) + 1);
    const metrics: Record<string, Metric> = {
      events: sim.processed,
      commands: save.log.length,
      commandTypes: [...byType].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([t, n]) => `${t}:${n}`).join(' '),
      simDays: Math.floor((sim.now - sim.scenario.start) / 86_400),
      finished: sim.queue.peek() === undefined || sim.queue.peek()!.at > sim.scenario.end,
      hash: sim.hash(),
      ...(mod.metrics ? mod.metrics(sim, save.answers ?? {}) : {}),
    };
    return { ...base, ok: true, metrics };
  } catch (err) {
    return { ...base, ok: false, problem: err instanceof Error ? err.message : String(err), metrics: {} };
  }
}

/** Save codes from arguments: literal codes, files with one code per line, or folders of .txt files. */
export function collectCodes(args: string[]): string[] {
  const out: string[] = [];
  for (const a of args) {
    if (existsSync(a) && statSync(a).isDirectory()) {
      for (const f of readdirSync(a).filter((x) => x.endsWith('.txt')).sort()) out.push(...collectCodes([join(a, f)]));
    } else if (existsSync(a)) {
      out.push(...readFileSync(a, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
    } else {
      out.push(a.trim());
    }
  }
  return out;
}

const cell = (v: unknown): string => (v === undefined || v === null ? '' : String(v)).replace(/\|/g, '\\|');

export function report(rows: Analysis[]): { markdown: string; csv: string } {
  const metricKeys = [...new Set(rows.flatMap((r) => Object.keys(r.metrics)))];
  const answerKeys = [...new Set(rows.flatMap((r) => Object.keys(r.answers)))].sort();
  const head = ['#', 'game', 'scenario', 'build', 'status', ...metricKeys, ...answerKeys.map((k) => `answer:${k}`)];
  const lines = rows.map((r, i) => [String(i + 1), r.game, r.scenario, r.buildId, r.ok ? 'ok' : `skipped: ${r.problem}`,
    ...metricKeys.map((k) => cell(r.metrics[k])), ...answerKeys.map((k) => cell(r.answers[k]))]);
  const markdown = `# Playtest analysis\n\n${rows.length} save code(s); ${rows.filter((r) => r.ok).length} replayed.\n\n` +
    `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n` + lines.map((l) => `| ${l.join(' | ')} |`).join('\n') + '\n';
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = [head, ...lines].map((l) => l.map((c) => q(c.replace(/\\\|/g, '|'))).join(',')).join('\n') + '\n';
  return { markdown, csv };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const inputs = args.filter((_, i) => i !== outIdx && (outIdx < 0 || i !== outIdx + 1));
  const codes = collectCodes(inputs);
  if (codes.length === 0) throw new Error('Give at least one save code, a file of codes, or a folder of .txt files');
  const cache = new Map<string, { mod: AnyModule; raw: GameBundle }>();
  const rows: Analysis[] = [];
  for (const code of codes) {
    let save: SaveCode<Command>;
    try { save = decodeSave(code); } catch (err) {
      rows.push({ game: '?', scenario: '?', buildId: '?', ok: false, problem: `unreadable save code (${err instanceof Error ? err.message : err})`, metrics: {}, answers: {} });
      continue;
    }
    let entry = cache.get(save.game);
    if (!entry) {
      const g = gameIdOf(save.game);
      entry = { mod: await loadGameModule(g), raw: loadRawBundle(g) };
      cache.set(save.game, entry);
    }
    rows.push(analyzeSave(save, entry.mod, entry.raw));
  }
  const { markdown, csv } = report(rows);
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out.endsWith('.md') ? out : `${out}.md`, markdown);
    writeFileSync(out.replace(/\.md$/, '') + '.csv', csv);
  }
  console.log(markdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
}
