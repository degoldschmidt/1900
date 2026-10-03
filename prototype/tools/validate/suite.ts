/**
 * The validator suite V01–V12 and its Markdown report. Parse problems found while loading the
 * dataset are reported under the check that owns them (V01 tables, V02 design values, V07
 * notation files, V10/V11 keying files).
 */
import type { Dataset } from '../schema/dataset.ts';
import { errorsOf, sortIssues, type Issue, type Level } from '../schema/issues.ts';
import { v01 } from './v01-schema.ts';
import { v02 } from './v02-citations.ts';
import { v03 } from './v03-times.ts';
import { v04 } from './v04-same-train.ts';
import { v05 } from './v05-network.ts';
import { v06, type DiffReport } from './v06-diff.ts';
import { v07 } from './v07-rules.ts';
import { v08 } from './v08-fares.ts';
import { v09 } from './v09-zones.ts';
import { v10 } from './v10-keyed.ts';
import { v11 } from './v11-resolved.ts';
import { v12 } from './v12-basis.ts';

export const CHECKS: ReadonlyArray<{ id: string; title: string; run: (ds: Dataset) => Issue[] }> = [
  { id: 'V01', title: 'Schema, types, enums, unique and foreign keys', run: v01 },
  { id: 'V02', title: 'Citations and design values', run: v02 },
  { id: 'V03', title: 'Monotone times, dwells and speeds', run: v03 },
  { id: 'V04', title: 'The same train agrees across tables', run: v04 },
  { id: 'V05', title: 'Through links, frontier pairs and reach', run: v05 },
  { id: 'V06', title: 'Cross-edition diff (informational)', run: (ds) => v06(ds).issues },
  { id: 'V07', title: 'Running rules, edition validity and dates', run: v07 },
  { id: 'V08', title: 'Fares', run: v08 },
  { id: 'V09', title: 'Zones', run: v09 },
  { id: 'V10', title: 'Every page double-keyed', run: v10 },
  { id: 'V11', title: 'No unresolved cells', run: v11 },
  { id: 'V12', title: 'Tier-0 citations, basis fields and public dependencies', run: v12 },
];

export interface SuiteResult {
  issues: Issue[];
  reports: DiffReport[];
}

/** Runs the whole suite (or the named checks) and returns sorted issues plus V06's diff reports. */
export function runSuite(ds: Dataset, only?: readonly string[]): SuiteResult {
  const want = (id: string) => !only || only.includes(id);
  const issues: Issue[] = ds.issues.filter((i) => want(i.check));
  let reports: DiffReport[] = [];
  for (const c of CHECKS) {
    if (!want(c.id)) continue;
    if (c.id === 'V06') { const r = v06(ds); issues.push(...r.issues); reports = r.reports; continue; }
    issues.push(...c.run(ds));
  }
  return { issues: sortIssues(issues), reports };
}

/** Runs one check (including its share of the loading problems). */
export function runCheck(ds: Dataset, id: string): Issue[] {
  return runSuite(ds, [id]).issues;
}

const count = (l: readonly Issue[], level: Level) => l.filter((i) => i.level === level).length;
const esc = (s: string) => s.replace(/\|/g, '\\|');

/** The validation report (build/reports/validation.md). Deterministic: no timestamps. */
export function renderReport(res: SuiteResult, dataDir: string): string {
  const errors = errorsOf(res.issues).length;
  const lines = [
    '# Data validation report',
    '',
    `Data: \`${dataDir}\` — ${errors === 0 ? '**passed**' : `**failed** with ${errors} error(s)`}.`,
    '',
    '| Check | Title | Errors | Warnings | Info |',
    '|---|---|---|---|---|',
    ...CHECKS.map((c) => {
      const l = res.issues.filter((i) => i.check === c.id);
      return `| ${c.id} | ${c.title} | ${count(l, 'error')} | ${count(l, 'warning')} | ${count(l, 'info')} |`;
    }),
    '',
  ];
  for (const c of CHECKS) {
    const l = res.issues.filter((i) => i.check === c.id);
    if (l.length === 0) continue;
    lines.push(`## ${c.id} ${c.title}`, '');
    for (const i of l) lines.push(`- **${i.level}** \`${esc(i.where)}\`: ${i.message}`);
    lines.push('');
  }
  if (res.reports.length) {
    lines.push('## Cross-edition diffs', '');
    for (const r of res.reports) lines.push(`- [${r.file}](${r.file})`);
    lines.push('');
  }
  return lines.join('\n');
}
