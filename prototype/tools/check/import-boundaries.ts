/**
 * Import rules:
 *  - no game imports another game;
 *  - games/<g>/src/ui/ imports only views/, ui/, #kit/ui, #kit/data, #kit/time/format and preact;
 *  - forecasts and indicators (files whose name contains "forecast" or "indicator") never import
 *    the record store, delivery, readers or the hunter; they work from ownTrail copies and public rows;
 *  - the kit never imports a game.
 */
import { readFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { ROOT, GAMES } from '../make/paths.ts';
import { listFiles } from './source-files.ts';

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

export function importsOf(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) out.push((m[1] ?? m[2] ?? m[3])!);
  return out;
}

function resolveSpec(file: string, spec: string): string {
  if (spec.startsWith('#kit/')) return 'kit/src/' + spec.slice(5);
  if (spec.startsWith('.')) return normalize(join(dirname(file), spec));
  return spec; // package
}

const UI_ALLOWED_KIT = ['kit/src/ui/', 'kit/src/data/', 'kit/src/time/format'];
const FORECAST_BANNED = ['kit/src/records/store', 'kit/src/records/delivery', 'kit/src/records/readers', 'kit/src/hunter/'];

export function checkFile(file: string, src: string): string[] {
  const problems: string[] = [];
  const game = GAMES.find((g) => file.startsWith(`games/${g}/`));
  const isUi = /\/src\/ui\//.test(file);
  const isForecast = /(forecast|indicator)[^/]*\.tsx?$/.test(file);
  for (const spec of importsOf(src)) {
    const target = resolveSpec(file, spec);
    if (file.startsWith('kit/') && target.startsWith('games/')) problems.push(`${file}: the kit imports a game (${spec})`);
    if (game) {
      const other = GAMES.find((g) => g !== game && target.startsWith(`games/${g}/`));
      if (other) problems.push(`${file}: imports another game (${spec})`);
    }
    if (isUi && game) {
      const ok = target === 'preact' || target.startsWith('preact/') ||
        target.startsWith(`games/${game}/src/views/`) || target.startsWith(`games/${game}/src/ui/`) ||
        UI_ALLOWED_KIT.some((p) => target.startsWith(p)) || target.endsWith('.css');
      if (!ok) problems.push(`${file}: UI may import only views/, ui/ and display helpers (${spec})`);
    }
    if (isForecast && FORECAST_BANNED.some((p) => target.startsWith(p))) {
      problems.push(`${file}: a forecast or indicator may not reach hunters or faction stores (${spec})`);
    }
  }
  return problems;
}

export function importBoundaries(): string[] {
  const files = [...listFiles('kit/src', ['.ts', '.tsx']), ...listFiles('games', ['.ts', '.tsx'])];
  return files.flatMap((f) => checkFile(f, readFileSync(join(ROOT, f), 'utf8')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = importBoundaries();
  for (const x of p) console.error(x);
  if (p.length) process.exit(1);
  console.log('import-boundaries: ok');
}
