/**
 * T7 and T13 on the preview world: each golden script still produces its logged commands; the log
 * replays straight and from every monthly snapshot to the golden hash (the changeover scenario
 * crosses into May); the save code round-trips; the metrics equal the stored ones.
 * Golden values change only through `npm run golden:update -- c07 --preview --reason "…"`.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { Sim, type InputEntry } from '../../../kit/src/sim/sim.ts';
import type { Script } from '../../../kit/src/sim/scenario.ts';
import { decodeSave } from '../../../kit/src/sim/savecode.ts';
import { saveCodeOf } from '../../../kit/src/devtools/model.ts';
import type { GameBundle } from '../../../kit/src/data/bundle.ts';
import { checkGolden, type GoldenRecord } from '../../../tools/make/golden.ts';
import { analyzeSave } from '../../../tools/playtest/analyze.ts';
import { loadRawBundle } from '../../../tools/make/game-module.ts';
import { module } from '../src/game.ts';
import type { C07Command } from '../src/commands.ts';
import { bundle, raw, HERE } from './helpers.ts';

const DIR = join(HERE, '..', 'scenarios');
const scripts = readdirSync(join(DIR, 'scripts')).filter((f) => f.endsWith('.script.json')).sort();

describe('golden runs on the preview world', () => {
  it('there are golden scripts for both preview scenarios', () => {
    const scenarios = new Set(scripts.map((f) => (JSON.parse(readFileSync(join(DIR, 'scripts', f), 'utf8')) as Script<C07Command>).scenario));
    expect([...scenarios].sort()).toEqual(['preview-changeover', 'preview-tutorial']);
  });

  for (const file of scripts) {
    const name = basename(file, '.script.json');
    it(`${name}: script, straight replay, every snapshot, save code and metrics match the golden record`, () => {
      const script = JSON.parse(readFileSync(join(DIR, 'scripts', file), 'utf8')) as Script<C07Command>;
      const log = JSON.parse(readFileSync(join(DIR, 'logs', `${name}.input.json`), 'utf8')) as Array<InputEntry<C07Command>>;
      const golden = JSON.parse(readFileSync(join(DIR, 'golden', `${name}.golden.json`), 'utf8')) as GoldenRecord;
      expect(golden.dataHash).toBe(raw().meta.dataHash);
      expect(checkGolden(module, bundle(), script, log, golden)).toEqual([]);
      const sim = new Sim(module.game, bundle(), module.scenario(bundle(), golden.scenario, golden.seed));
      sim.replayLog(log, golden.processed);
      if (golden.scenario === 'preview-changeover') expect(sim.snapshots.length).toBeGreaterThan(1);
      const code = saveCodeOf(sim, 'test', golden.dataHash);
      const save = decodeSave<C07Command>(code);
      const back = new Sim(module.game, bundle(), module.scenario(bundle(), save.scenario, save.seed));
      back.replayLog(save.log, save.processed);
      expect(back.hash()).toBe(golden.hash);
      const a = analyzeSave(save, module as never, raw() as unknown as GameBundle);
      expect(a.ok).toBe(true);
      for (const [k, v] of Object.entries(golden.metrics ?? {})) expect(a.metrics[k], k).toEqual(v);
    });
  }

  it('the tools load the preview world with --preview', () => {
    const b = loadRawBundle('c07-departure', { preview: true });
    expect(b.meta.synthetic).toBe(true);
    expect(b.meta.dataHash).toBe(raw().meta.dataHash);
  });
});
