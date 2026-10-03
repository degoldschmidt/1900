import { determinismScan } from './determinism-scan.ts';
import { importBoundaries } from './import-boundaries.ts';
import { ignoreTraps } from './ignore-traps.ts';

const checks: Array<[string, () => string[]]> = [
  ['determinism-scan', determinismScan],
  ['import-boundaries', importBoundaries],
  ['ignore-traps', ignoreTraps],
];
let failed = false;
for (const [name, fn] of checks) {
  const problems = fn();
  if (problems.length) { failed = true; console.error(`${name}: ${problems.length} problem(s)`); for (const p of problems) console.error(`  ${p}`); }
  else console.log(`${name}: ok`);
}
if (failed) process.exit(1);
