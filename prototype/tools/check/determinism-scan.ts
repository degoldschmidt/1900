/**
 * Bans APIs that would make a simulation depend on the machine, the clock or the engine's
 * floating-point library. Applies to the kit (except devtools and ui) and to every game's rules,
 * game.ts, commands.ts and events.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../make/paths.ts';
import { listFiles, stripCommentsAndStrings } from './source-files.ts';

export const BANNED: Array<[RegExp, string]> = [
  [/\bMath\.random\b/, 'Math.random (use keyed draws from #kit/rng)'],
  [/\bDate\s*\.\s*now\b|\bnew\s+Date\b|(^|[^.\w])Date\s*\(/, 'Date (game time is an integer Instant)'],
  [/\bperformance\s*\.\s*now\b/, 'performance.now'],
  [/\bIntl\s*\./, 'Intl (locale-dependent)'],
  [/\.localeCompare\s*\(/, 'localeCompare (locale-dependent)'],
  [/\bfor\s*\(\s*(const|let|var)\s+[\w$]+\s+in\b/, 'for…in (use explicit sorted keys)'],
  [/\bMath\.(exp|expm1|log|log1p|log2|log10|pow|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|cbrt|hypot)\b/, 'transcendental Math function (not exactly specified across engines)'],
  [/\*\*/, 'exponent operator ** (same as Math.pow)'],
];

export function scanSource(src: string): string[] {
  const code = stripCommentsAndStrings(src);
  const hits: string[] = [];
  code.split('\n').forEach((line, i) => {
    for (const [re, why] of BANNED) if (re.test(line)) hits.push(`line ${i + 1}: ${why}`);
  });
  return hits;
}

export function scanTargets(): string[] {
  const kit = listFiles('kit/src', ['.ts', '.tsx']).filter((f) => !f.startsWith('kit/src/devtools/') && !f.startsWith('kit/src/ui/'));
  const games = listFiles('games', ['.ts', '.tsx']).filter((f) =>
    /\/src\/rules\//.test(f) || /\/src\/(game|commands|events)\.ts$/.test(f));
  return [...kit, ...games];
}

export function determinismScan(): string[] {
  const problems: string[] = [];
  for (const f of scanTargets()) {
    for (const h of scanSource(readFileSync(join(ROOT, f), 'utf8'))) problems.push(`${f} ${h}`);
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = determinismScan();
  for (const x of p) console.error(x);
  if (p.length) process.exit(1);
  console.log(`determinism-scan: ok (${scanTargets().length} files)`);
}
