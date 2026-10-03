import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeSave, collectCodes, report } from '../analyze.ts';
import { toyModule, toyRaw } from '../../../kit/test/fixtures/toy-module.ts';
import { Sim } from '../../../kit/src/sim/sim.ts';
import { decodeSave } from '../../../kit/src/sim/savecode.ts';
import { saveCodeOf } from '../../../kit/src/devtools/model.ts';
import { instantOf } from '../../../kit/src/time/instant.ts';
import { toyScenario, toyRows, D0 } from '../../../kit/test/fixtures/toy-game.ts';

function playedCode(answers?: Record<string, string | number>): string {
  const sim = new Sim(toyModule.game, { rows: toyRows() }, toyScenario(11));
  sim.command({ type: 'subscribe', reader: 'SYN_hunter' });
  sim.command({ type: 'move', to: 'SYN_C', hours: 3 });
  sim.advanceTo(instantOf(D0 + 6, 0));
  sim.command({ type: 'move', to: 'SYN_B', hours: 3 });
  sim.advanceTo(instantOf(D0 + 7, 0));
  const save = decodeSave(saveCodeOf(sim, 'b1', 'SYN-data-1'));
  if (answers) save.answers = answers;
  return Buffer.from(JSON.stringify(save)).toString('base64url');
}

describe('playtest analysis', () => {
  it('replays a save code and reads generic and game metrics', () => {
    const a = analyzeSave(decodeSave(playedCode({ fair: 4 })), toyModule, toyRaw);
    expect(a.ok).toBe(true);
    expect(a.metrics.commands).toBe(3);
    expect(a.metrics.commandTypes).toBe('move:2 subscribe:1');
    expect(a.metrics['SYN-1.moves']).toBe(2);
    expect(a.metrics.simDays).toBe(6);
    expect(a.answers).toEqual({ fair: 4 });
    expect(a.metrics['SYN-1.fair']).toBe(4);
  });

  it('refuses a save made on other data', () => {
    const save = decodeSave(playedCode());
    save.dataHash = 'other';
    const a = analyzeSave(save, toyModule, toyRaw);
    expect(a.ok).toBe(false);
    expect(a.problem).toMatch(/made on data other/);
  });

  it('reads codes from arguments, files and folders, and writes a table', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pt-'));
    const code = playedCode();
    writeFileSync(join(dir, 'a.txt'), `# player 1\n${code}\n`);
    writeFileSync(join(dir, 'b.txt'), `${code}\n${code}\n`);
    expect(collectCodes([dir])).toHaveLength(3);
    expect(collectCodes([code])).toEqual([code]);
    const rows = [analyzeSave(decodeSave(code), toyModule, toyRaw)];
    const { markdown, csv } = report(rows);
    expect(markdown).toMatch(/1 save code\(s\); 1 replayed/);
    expect(csv.split('\n')[0]).toMatch(/^#,game,scenario,build,status,events,commands/);
  });
});
