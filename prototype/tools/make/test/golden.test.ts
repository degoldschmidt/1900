import { describe, it, expect } from 'vitest';
import { runGolden, checkGolden } from '../golden.ts';
import { toyModule } from '../../../kit/test/fixtures/toy-module.ts';
import { toyRows, D0, type ToyCmd } from '../../../kit/test/fixtures/toy-game.ts';
import { instantOf } from '../../../kit/src/time/instant.ts';
import type { Script } from '../../../kit/src/sim/scenario.ts';

const bundle = { rows: toyRows() };
const script: Script<ToyCmd> = {
  scenario: 'toy-1',
  steps: [
    { cmd: { type: 'subscribe', reader: 'SYN_hunter' } },
    { cmd: { type: 'move', to: 'SYN_B', hours: 5 } },
    { wait: { untilEvent: 'arrive' } },
    { wait: { untilTime: instantOf(D0 + 5, 0) }, cmd: { type: 'move', to: 'SYN_D', hours: 40 } },
  ],
  end: { untilTime: instantOf(D0 + 13, 0) },
};

describe('golden runs', () => {
  it('a fresh golden record checks clean, including replay from every monthly snapshot', () => {
    const { log, golden } = runGolden(toyModule, bundle, 'SYN-data-1', 'toy-walk', script, 'first record');
    expect(golden.commands).toBe(3);
    expect(log.map((e) => e.cmd.type)).toEqual(['subscribe', 'move', 'move']);
    expect(checkGolden(toyModule, bundle, script, log, golden)).toEqual([]);
  });

  it('a changed rule or script shows up as a hash or log difference', () => {
    const { log, golden } = runGolden(toyModule, bundle, 'SYN-data-1', 'toy-walk', script, 'first record');
    const tampered = { ...golden, hash: '0000000000000000' };
    expect(checkGolden(toyModule, bundle, script, log, tampered).join('\n')).toMatch(/differs from golden/);
    const longer: Script<ToyCmd> = { ...script, steps: [...script.steps, { wait: { untilEvent: 'arrive' }, cmd: { type: 'move', to: 'SYN_A', hours: 2 } }] };
    expect(checkGolden(toyModule, bundle, longer, log, golden).join('\n')).toMatch(/different input log/);
    const broken: Script<ToyCmd> = { ...script, steps: [...script.steps, { cmd: { type: 'move', to: 'SYN_A', hours: 2 } }] };
    expect(checkGolden(toyModule, bundle, broken, log, golden).join('\n')).toMatch(/no longer runs.*Already travelling/);
  });
});
