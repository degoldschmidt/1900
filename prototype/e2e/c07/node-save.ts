/**
 * Plays the C07 preview tutorial in Node and prints save codes with their state hashes, for the
 * browser half of RULES.md T7 (a save code made in Node replays in Chromium to the same hash) and
 * for the screenshot states. Run: node e2e/c07/node-save.ts
 *
 * Output (JSON): { dataHash, codes: { [name]: { code, hash, processed } } }
 */
const g = globalThis as { __DEBUG__?: boolean; __BUILD_ID__?: string; __PREVIEW__?: boolean };
g.__DEBUG__ = true; g.__BUILD_ID__ = 'node'; g.__PREVIEW__ = true;

const { readFileSync } = await import('node:fs');
const { join, dirname } = await import('node:path');
const { fileURLToPath } = await import('node:url');
const { Sim } = await import('../../kit/src/sim/sim.ts');
const { encodeSave } = await import('../../kit/src/sim/savecode.ts');
const { module } = await import('../../games/c07-departure/src/game.ts');
const { viewInputs, advance } = await import('../../games/c07-departure/src/session.ts');
const V = await import('../../games/c07-departure/src/views/index.ts');
import type { GameBundle } from '../../kit/src/data/bundle.ts';
import type { C07Command } from '../../games/c07-departure/src/commands.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const raw = JSON.parse(readFileSync(join(ROOT, 'games', 'c07-departure', 'preview', 'world.bundle.json'), 'utf8')) as GameBundle;
const bundle = module.bundleFrom(raw);
const sim = new Sim(module.game, bundle, module.scenario(bundle, 'preview-tutorial'));

const ok = (c: C07Command): void => { const r = sim.command(c); if (!r.ok) throw new Error(`${c.type}: ${r.error}`); };
const bookDefault = (to: string, sinceArrivalMs: number): void => {
  const { p, d } = viewInputs(sim);
  const pl = V.plannerView(p, d, to);
  const o = pl.options[pl.defaultIndex!]!;
  const c = o.classes.find((x) => x.legal)!.cmd;
  ok({ ...c, ui: { sinceArrivalMs, source: 'default' } } as C07Command);
};
const act = (re: RegExp): void => {
  const { p, d } = viewInputs(sim);
  const a = V.actionsView(p, d).find((x) => re.test(x.label) && x.legal);
  if (!a) throw new Error(`no legal act ${re}`);
  ok(a.cmd);
};
const codes: Record<string, { code: string; hash: string; processed: number }> = {};
const keep = (name: string): void => {
  const code = encodeSave({ v: 1, game: module.game.id, buildId: 'node', dataHash: raw.meta.dataHash, scenario: sim.scenario.id, seed: sim.seed, processed: sim.processed, log: sim.log.map((e) => ({ k: e.k, cmd: e.cmd })) });
  codes[name] = { code, hash: sim.hash(), processed: sim.processed };
};

// Booked: a draw planned, the D 15 to Corlaine booked; nothing has happened yet.
act(/^Draw £2/);
bookDefault('SYN_C_COR', 41000);
keep('booked');
// Arrived in Corlaine, the meeting planned, the night journey to Port-Ancel booked.
advance(sim);
act(/^Meeting/);
bookDefault('SYN_C_PAN', 73000);
ok({ type: 'endSession' });
keep('corlaine');
// In Port-Ancel with the last meeting planned: one Advance ends the scenario.
for (let i = 0; i < 10 && !(sim.state.me.where.k === 'city' && sim.state.me.where.city === 'SYN_C_PAN'); i++) advance(sim);
act(/^Meeting/);
keep('portAncel');

console.log(JSON.stringify({ dataHash: raw.meta.dataHash, codes }));
