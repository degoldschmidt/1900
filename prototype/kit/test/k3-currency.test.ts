/** Kit gap K3 (known graphs excluding modes and operators) and synthetic currencies. */
import { describe, it, expect } from 'vitest';
import { Timetable } from '../src/timetable/model.ts';
import { connections } from '../src/timetable/expand.ts';
import { newKnownGraph, knownView, learn, setExclusion, excludedTrip } from '../src/timetable/knowledge.ts';
import { money, format, convert, minorPerUnit, isSynthetic } from '../src/money/money.ts';
import { instantOf } from '../src/time/instant.ts';
import { randomNetwork, BASE_DAY } from './fixtures/synthetic-network.ts';

describe('K3: a known graph excludes modes and operators', () => {
  const data = randomNetwork(31, { trips: 12, editions: 1 });
  data.trips.forEach((t, i) => { if (i % 3 === 0) t.operator = 'SYN_private'; if (i % 4 === 1) t.mode = 'steamer'; });
  const tt = new Timetable(data, { defaultMinChangeSec: 600 });
  const day = BASE_DAY + 2;

  it('drops excluded trips from the view, even when learned, and keys the view by the exclusion', () => {
    const kg = newKnownGraph('SYN_hunter', ['SYN_E0']);
    const plain = knownView(tt, kg);
    setExclusion(kg, { modes: ['steamer'], operators: ['SYN_private'] });
    const v = knownView(tt, kg);
    expect(v.key).not.toBe(plain.key);
    expect(v.key).toContain('x:steamer;SYN_private');
    tt.trips.forEach((t, i) => {
      const out = t.operator === 'SYN_private' || t.mode === 'steamer';
      expect(excludedTrip(tt, kg, i)).toBe(out);
      if (out) expect(v.uses(i, day)).toBe(false);
      else expect(v.uses(i, day)).toBe(plain.uses(i, day));
    });
    const k = tt.trips.findIndex((t) => t.operator === 'SYN_private');
    learn(kg, { trainKey: tt.trips[k]!.trainKey, edition: tt.trips[k]!.edition, source: 'porter', learnedDay: day, confidence: 900 });
    expect(knownView(tt, kg).uses(k, day)).toBe(false);
  });

  it('connections over an excluding view never contain an excluded trip', () => {
    const kg = newKnownGraph('SYN_hunter2', ['SYN_E0']);
    setExclusion(kg, { operators: ['SYN_private'] });
    const c = connections(tt, knownView(tt, kg), instantOf(BASE_DAY, 0), instantOf(BASE_DAY + 5, 0));
    for (let i = 0; i < c.n; i++) expect(tt.trips[c.trip[i]!]!.operator).not.toBe('SYN_private');
  });

  it('an empty exclusion removes the field', () => {
    const kg = newKnownGraph('SYN_x', ['SYN_E0']);
    setExclusion(kg, { modes: ['ferry'] });
    expect(kg.exclude).toEqual({ modes: ['ferry'] });
    setExclusion(kg, {});
    expect('exclude' in kg).toBe(false);
  });
});

describe('synthetic currencies', () => {
  it('count 100 minor units and format with their code or a display unit', () => {
    const m = money('SYN_THL', 1234);
    expect(isSynthetic(m.cur)).toBe(true);
    expect(minorPerUnit('SYN_THL')).toBe(100);
    expect(minorPerUnit('GBP')).toBe(960);
    expect(format(m)).toBe('12.34 THL');
    expect(format(m, 'th.')).toBe('12.34 th.');
    expect(format(money('FRF', 250))).toBe('2.50 fr.');
  });
  it('convert at exact parities', () => {
    expect(convert(money('GBP', 960), { from: 'GBP', to: 'SYN_CVN', num: 21, den: 8 })).toEqual({ cur: 'SYN_CVN', minor: 2520 });
  });
});
