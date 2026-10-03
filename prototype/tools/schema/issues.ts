/**
 * Problems found by the schema parsers, validators, normaliser and compiler.
 *
 *  - error:   the data is wrong or unproven; blocks compilation (validate/run.ts exits 1);
 *  - warning: suspicious but possible (e.g. an unusually slow leg); listed for review;
 *  - info:    informational (e.g. cross-edition differences).
 */
import { cmpStr } from './csv.ts';

export type Level = 'error' | 'warning' | 'info';

export interface Issue {
  /** Check id ("V01" … "V12", "schema", "normalize", "compile"). */
  check: string;
  level: Level;
  /** Where: "stops.csv:12", "service SYN_E1.SYN_T1.c1", "edition SYN_E1", … */
  where: string;
  message: string;
}

export const issue = (check: string, level: Level, where: string, message: string): Issue => ({ check, level, where, message });

const LEVEL_ORDER: Record<Level, number> = { error: 0, warning: 1, info: 2 };

/** Sorts by check, level, place and message, so reports are byte-stable. */
export function sortIssues(list: Issue[]): Issue[] {
  return list.sort((a, b) => cmpStr(a.check, b.check) || LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
    cmpWhere(a.where, b.where) || cmpStr(a.message, b.message));
}

/** Compares "file.csv:12" places numerically by line, otherwise as strings. */
function cmpWhere(a: string, b: string): number {
  const ma = /^(.*):(\d+)$/.exec(a); const mb = /^(.*):(\d+)$/.exec(b);
  if (ma && mb && ma[1] === mb[1]) return Number(ma[2]) - Number(mb[2]);
  return cmpStr(a, b);
}

export const errorsOf = (list: readonly Issue[]): Issue[] => list.filter((i) => i.level === 'error');

export function formatIssue(i: Issue): string {
  return `${i.check} ${i.level} ${i.where}: ${i.message}`;
}
