import { describe, it, expect } from 'vitest';
import { dayFromIso, weekday } from '#kit/time/calendar.ts';
import { compileRule, compileRuleText, parseRule, ruleKey, runningDays, runsOn } from '../running-rule.ts';

const d = dayFromIso;
const W: [number, number] = [d('1914-05-01'), d('1914-09-30')];
const days = (text: string, win: [number, number] = W) => runningDays(compileRuleText(text, win), win[0], win[1]);

describe('running-rule DSL: parsing', () => {
  it('accepts every clause', () => {
    for (const ok of ['daily', 'dow:Mo,We,Fr', 'except-dow:Su', 'from:1914-06-01;to:1914-06-30;daily', 'dates:1914-06-01..1914-06-07',
      'also:1914-08-03', 'daily;except:1914-12-25', 'dow:Sa;dates:1914-06-01..1914-06-30;dates:1914-08-01..1914-08-31',
      'also:1914-08-03,1914-08-04', 'daily;from:J1914-07-19', ' daily ; except-dow:Sa ; except-dow:Su ']) {
      expect(parseRule(ok).ok, ok).toBe(true);
    }
  });
  it('rejects malformed rules with a reason', () => {
    const bad: Array<[string, RegExp]> = [
      ['', /empty/], ['weekly', /unknown clause/], ['dow:Mon', /unknown weekday/], ['daily;dow:Mo', /daily and dow/],
      ['dow:Mo;dow:Tu', /dow given twice/], ['from:1914-13-01;daily', /Invalid date|No such/], ['dates:1914-06-30..1914-06-01', /ends before/],
      ['dates:1914-06-01', /not a range/], ['from:1914-07-01', /names no running days/], ['from:1914-07-01;to:1914-06-01;daily', /from is after to/],
      ['none', /not a running rule/], ['daily;daily', /twice/], ['also:', /no value/],
    ];
    for (const [text, re] of bad) {
      const p = parseRule(text);
      expect(p.ok, text).toBe(false);
      if (!p.ok) expect(p.error, text).toMatch(re);
    }
  });
});

describe('running-rule DSL: compilation to RunRule', () => {
  it('daily covers the window as one range with mask 127', () => {
    expect(compileRuleText('daily', W)).toEqual({ ranges: [[W[0], W[1], 127]], also: [], except: [] });
  });
  it('dow and except-dow set the weekday mask (bit 0 = Monday)', () => {
    expect(compileRuleText('dow:Mo,Th', W).ranges).toEqual([[W[0], W[1], 0b0001001]]);
    expect(compileRuleText('except-dow:Su', W).ranges).toEqual([[W[0], W[1], 0b0111111]]);
    expect(compileRuleText('dow:Mo,Su;except-dow:Su', W).ranges).toEqual([[W[0], W[1], 1]]);
    for (const day of days('dow:Mo,Th')) expect([0, 3]).toContain(weekday(day));
  });
  it('from/to clip the window; dates give the only ranges', () => {
    expect(compileRuleText('daily;from:1914-06-01;to:1914-06-30', W).ranges).toEqual([[d('1914-06-01'), d('1914-06-30'), 127]]);
    expect(compileRuleText('dates:1914-04-01..1914-05-10;dates:1914-09-25..1914-10-31', W).ranges)
      .toEqual([[W[0], d('1914-05-10'), 127], [d('1914-09-25'), W[1], 127]]);
    expect(compileRuleText('dates:1914-06-01..1914-06-10;dates:1914-06-11..1914-06-20', W).ranges).toEqual([[d('1914-06-01'), d('1914-06-20'), 127]]);
  });
  it('also and except are absolute days inside the window, kept minimal', () => {
    const r = compileRuleText('dow:Sa;also:1914-08-03;also:1914-08-08;except:1914-08-15;except:1914-08-16;also:1914-12-01', W);
    expect(r.also).toEqual([d('1914-08-03')]); // 8 Aug is a Saturday (already covered); 1 Dec is outside
    expect(r.except).toEqual([d('1914-08-15')]); // 16 Aug is a Sunday (not covered anyway)
    expect(runsOn(r, d('1914-08-03'))).toBe(true);
    expect(runsOn(r, d('1914-08-15'))).toBe(false);
    expect(runsOn(r, d('1914-08-22'))).toBe(true);
  });
  it('also is not clipped by from/to, and an also-only rule runs on those days alone', () => {
    expect(days('daily;to:1914-07-31;also:1914-08-03')).toContain(d('1914-08-03'));
    expect(days('also:1914-08-03,1914-08-04')).toEqual([d('1914-08-03'), d('1914-08-04')]);
    expect(days('also:1914-08-03;except:1914-08-03')).toEqual([]);
  });
  it('converts Julian dates (19 July 1914 O.S. = Saturday 1 August 1914 N.S.)', () => {
    expect(days('also:J1914-07-19')).toEqual([d('1914-08-01')]);
    expect(weekday(d('1914-08-01'))).toBe(5);
  });
  it('compiles the printed rule over the bundle window, not the edition validity', () => {
    // An edition valid May–September; a player still holding it in October believes it runs.
    const bundleWindow: [number, number] = [d('1914-04-20'), d('1914-10-31')];
    const printed = compileRuleText('daily', bundleWindow);
    expect(runsOn(printed, d('1914-10-15'))).toBe(true);
    expect(runsOn(printed, d('1914-11-01'))).toBe(false);
    // Over the edition validity (truth), the same rule stops at valid_to.
    expect(runsOn(compileRuleText('daily', W), d('1914-10-15'))).toBe(false);
  });
  it('gives no ranges for an empty mask or an empty window', () => {
    expect(compileRuleText('dow:Su;except-dow:Su', W).ranges).toEqual([]);
    expect(compileRuleText('daily;from:1914-10-01', W).ranges).toEqual([]);
  });
  it('compares rules by meaning, not spelling', () => {
    const k = (s: string) => { const p = parseRule(s); if (!p.ok) throw new Error(p.error); return ruleKey(p.rule); };
    expect(k('daily;except-dow:Su')).toBe(k('except-dow:Su'));
    expect(k('dow:Mo,Th')).toBe(k('dow:Th,Mo'));
    expect(k('daily')).not.toBe(k('except-dow:Su'));
    const p = parseRule('dow:Mo'); if (p.ok) expect(compileRule(p.rule, W).ranges[0]![2]).toBe(1);
  });
});
