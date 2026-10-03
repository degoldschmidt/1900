/**
 * Runs the data validators V01–V12 and writes build/reports/validation.md (plus V06's
 * build/reports/diff-<e1>-<e2>.md). Exits 1 if any check reports an error.
 *
 *   node tools/validate/run.ts [--data <data root>] [--reports <dir>] [--only V03,V05]
 *
 * Defaults: --data prototype/data, --reports prototype/build/reports.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT } from '../make/paths.ts';
import { loadDataset } from '../schema/dataset.ts';
import { errorsOf, formatIssue } from '../schema/issues.ts';
import { renderReport, runSuite, type SuiteResult } from './suite.ts';

export interface RunOptions { data: string; reports: string; only?: string[] }

export function validateAndReport(o: RunOptions): SuiteResult {
  const ds = loadDataset(o.data);
  const res = runSuite(ds, o.only);
  mkdirSync(o.reports, { recursive: true });
  writeFileSync(join(o.reports, 'validation.md'), renderReport(res, o.data));
  for (const r of res.reports) writeFileSync(join(o.reports, r.file), r.text);
  return res;
}

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const data = resolve(argValue(args, '--data') ?? join(ROOT, 'data'));
  const reports = resolve(argValue(args, '--reports') ?? join(ROOT, 'build', 'reports'));
  const only = argValue(args, '--only')?.split(',').map((s) => s.trim()).filter(Boolean);
  const res = validateAndReport(only ? { data, reports, only } : { data, reports });
  const errors = errorsOf(res.issues);
  for (const e of errors.slice(0, 50)) console.error(formatIssue(e));
  if (errors.length > 50) console.error(`… and ${errors.length - 50} more errors`);
  const warnings = res.issues.filter((i) => i.level === 'warning').length;
  console.log(`validation: ${errors.length} error(s), ${warnings} warning(s); report ${join(reports, 'validation.md')}`);
  if (errors.length) process.exit(1);
}
