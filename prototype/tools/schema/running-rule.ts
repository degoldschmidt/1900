/**
 * The running-rule DSL (services.running_rule, running_rules.rule_dsl) and its compilation to the
 * kit's RunRule.
 *
 * A rule is a list of clauses separated by semicolons:
 *
 *   daily                     every weekday (the default base when only except-dow or dates is given)
 *   dow:Mo,We,Fr              only these weekdays (Mo Tu We Th Fr Sa Su); at most one dow, never with daily
 *   except-dow:Su             remove weekdays from the base (may repeat)
 *   from:1914-05-01           first day the rule applies (at most once)
 *   to:1914-09-30             last day the rule applies (at most once)
 *   dates:1914-06-01..1914-09-30   a date range in which the weekday base applies (may repeat; the
 *                             ranges are unioned; when any is given, days outside them do not run)
 *   also:1914-08-03           an extra running day (may repeat; a comma list is allowed)
 *   except:1914-12-25         a day it does not run (may repeat; a comma list is allowed)
 *
 * Dates may be Gregorian "1914-08-01" or Julian "J1914-07-19". A rule must name some running days:
 * daily, dow, except-dow, dates or also. `none` is reserved for running_rules.csv rows whose mark
 * does not affect running days (e.g. a dining-car mark) and is not a rule.
 *
 * Compilation over a window [w0, w1] (inclusive day numbers):
 *   mask   = dow set | 127 (daily, or default) minus except-dow weekdays
 *   lo, hi = max(w0, from), min(w1, to)
 *   ranges = each merged dates range clipped to [lo, hi], or [lo, hi] when no dates are given,
 *            each with the mask (empty ranges and a zero mask give no range)
 *   also   = also days inside [w0, w1] that the ranges do not already cover
 *   except = except days inside [w0, w1] that the ranges or also would otherwise cover
 * also and except days are absolute dates: from/to do not clip them, only the window does.
 *
 * Which window (see tools/compile/compile-bundles.ts):
 *  - the printed rule a player reads in the guide (TripRow.run) is compiled over the bundle window,
 *    because a guide in the player's hand keeps "running" after its edition is superseded;
 *  - the truth (TripRow.truth) is a separate list of day ranges inside the edition's validity
 *    (valid_from..valid_to) where the edition is the truth edition for every segment of the trip;
 *  - so the trip runs on the ground on day d iff d is in truth and run(d), which equals the rule
 *    compiled over the edition validity, restricted to the truth ranges.
 * Validators (V07) compile over the edition validity, capping an open-ended edition at 366 days.
 */
import type { RunRule } from '#kit/timetable/types.ts';
import { dayFromAnyIso, weekday } from '#kit/time/calendar.ts';

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
export const DAILY_MASK = 127;

export interface RuleAst {
  daily: boolean;
  /** Weekday mask from dow (bit 0 = Monday), or null. */
  dow: number | null;
  exceptDow: number;
  from: number | null;
  to: number | null;
  dates: Array<[number, number]>;
  also: number[];
  except: number[];
}

export type RuleParse = { ok: true; rule: RuleAst } | { ok: false; error: string };

function parseDays(list: string): number[] {
  return list.split(',').map((s) => s.trim()).filter(Boolean).map((s) => dayFromAnyIso(s));
}

function parseDow(list: string): number {
  let mask = 0;
  for (const raw of list.split(',')) {
    const w = raw.trim();
    const i = (WEEKDAYS as readonly string[]).indexOf(w);
    if (i < 0) throw new Error(`unknown weekday "${w}" (use ${WEEKDAYS.join(',')})`);
    mask |= 1 << i;
  }
  return mask;
}

export function parseRule(text: string): RuleParse {
  const rule: RuleAst = { daily: false, dow: null, exceptDow: 0, from: null, to: null, dates: [], also: [], except: [] };
  const clauses = text.split(';').map((c) => c.trim()).filter(Boolean);
  if (clauses.length === 0) return { ok: false, error: 'empty running rule' };
  try {
    for (const c of clauses) {
      if (c === 'daily') {
        if (rule.daily) throw new Error('daily given twice');
        rule.daily = true;
        continue;
      }
      if (c === 'none') throw new Error('"none" is not a running rule (it marks a footnote without running-day meaning)');
      const k = c.indexOf(':');
      if (k < 0) throw new Error(`unknown clause "${c}"`);
      const key = c.slice(0, k).trim();
      const val = c.slice(k + 1).trim();
      if (val === '') throw new Error(`clause "${key}" has no value`);
      switch (key) {
        case 'dow':
          if (rule.dow !== null) throw new Error('dow given twice');
          rule.dow = parseDow(val);
          break;
        case 'except-dow':
          rule.exceptDow |= parseDow(val);
          break;
        case 'from':
          if (rule.from !== null) throw new Error('from given twice');
          rule.from = dayFromAnyIso(val);
          break;
        case 'to':
          if (rule.to !== null) throw new Error('to given twice');
          rule.to = dayFromAnyIso(val);
          break;
        case 'dates': {
          const m = /^(\S+)\.\.(\S+)$/.exec(val);
          if (!m) throw new Error(`dates "${val}" is not a range a..b`);
          const a = dayFromAnyIso(m[1]!); const b = dayFromAnyIso(m[2]!);
          if (a > b) throw new Error(`dates "${val}" ends before it starts`);
          rule.dates.push([a, b]);
          break;
        }
        case 'also': rule.also.push(...parseDays(val)); break;
        case 'except': rule.except.push(...parseDays(val)); break;
        default: throw new Error(`unknown clause "${key}"`);
      }
    }
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (rule.daily && rule.dow !== null) return { ok: false, error: 'daily and dow cannot both be given' };
  if (rule.from !== null && rule.to !== null && rule.from > rule.to) return { ok: false, error: 'from is after to' };
  if (!rule.daily && rule.dow === null && rule.exceptDow === 0 && rule.dates.length === 0 && rule.also.length === 0) {
    return { ok: false, error: 'the rule names no running days (give daily, dow, except-dow, dates or also)' };
  }
  return { ok: true, rule };
}

/** The weekday mask of the rule's ranges; 0 when it runs only on `also` days. */
export function ruleMask(rule: RuleAst): number {
  const hasBase = rule.daily || rule.dow !== null || rule.exceptDow !== 0 || rule.dates.length > 0;
  if (!hasBase) return 0;
  const base = rule.dow ?? DAILY_MASK;
  return base & ~rule.exceptDow & DAILY_MASK;
}

function mergeRanges(list: Array<[number, number]>): Array<[number, number]> {
  const s = [...list].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: Array<[number, number]> = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

const uniqSorted = (xs: number[]): number[] => [...new Set(xs)].sort((a, b) => a - b);

function inRanges(ranges: ReadonlyArray<readonly [number, number, number]>, day: number): boolean {
  const bit = 1 << weekday(day);
  return ranges.some(([a, b, m]) => day >= a && day <= b && (m & bit) !== 0);
}

/** Compiles a parsed rule over the inclusive window [w0, w1] (see the module comment). */
export function compileRule(rule: RuleAst, window: readonly [number, number]): RunRule {
  const [w0, w1] = window;
  const mask = ruleMask(rule);
  const lo = Math.max(w0, rule.from ?? w0);
  const hi = Math.min(w1, rule.to ?? w1);
  const ranges: Array<[number, number, number]> = [];
  if (mask !== 0) {
    const spans = rule.dates.length > 0 ? mergeRanges(rule.dates) : [[lo, hi] as [number, number]];
    for (const [a, b] of spans) {
      const x = Math.max(a, lo); const y = Math.min(b, hi);
      if (x <= y) ranges.push([x, y, mask]);
    }
  }
  const inWin = (d: number) => d >= w0 && d <= w1;
  const exceptAll = new Set(rule.except.filter(inWin));
  const also = uniqSorted(rule.also.filter((d) => inWin(d) && !inRanges(ranges, d) && !exceptAll.has(d)));
  const except = uniqSorted([...exceptAll].filter((d) => inRanges(ranges, d)));
  return { ranges, also, except };
}

/** Parses and compiles; throws with the parse error. */
export function compileRuleText(text: string, window: readonly [number, number]): RunRule {
  const p = parseRule(text);
  if (!p.ok) throw new Error(`running rule "${text}": ${p.error}`);
  return compileRule(p.rule, window);
}

/** Same semantics as the kit's runsOn (kit/src/timetable/model.ts). */
export function runsOn(run: RunRule, day: number): boolean {
  if (run.except.includes(day)) return false;
  if (run.also.includes(day)) return true;
  return inRanges(run.ranges, day);
}

/** All running days of a compiled rule inside [d0, d1]. */
export function runningDays(run: RunRule, d0: number, d1: number): number[] {
  const out: number[] = [];
  for (let d = d0; d <= d1; d++) if (runsOn(run, d)) out.push(d);
  return out;
}

/** A canonical text for comparing two rules (V06): weekday mask, bounds and date lists. */
export function ruleKey(rule: RuleAst): string {
  const days = (xs: number[]) => uniqSorted(xs).join(',');
  return [
    `mask:${ruleMask(rule)}`,
    `from:${rule.from ?? ''}`,
    `to:${rule.to ?? ''}`,
    `dates:${mergeRanges(rule.dates).map(([a, b]) => `${a}..${b}`).join(',')}`,
    `also:${days(rule.also)}`,
    `except:${days(rule.except)}`,
  ].join(';');
}
