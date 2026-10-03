import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../make/paths.ts';

/** Extracts the inlined game-data JSON from a built page. */
export function extractData(html: string): string | null {
  const m = html.match(/<script type="application\/json" id="game-data">([\s\S]*?)<\/script>/);
  return m ? (m[1] ?? null) : null;
}

/**
 * Release builds must not carry synthetic fixtures or SYN_ identifiers. Exempt: debug builds
 * (*.debug.html) and mechanics-preview pages (*.preview.html, *.preview.artifact.html), which run
 * on an invented world by design (Decision P-006) and must say so: their data has to be marked
 * synthetic.
 */
export function noSynthetic(distDir = join(ROOT, 'dist')): string[] {
  const problems: string[] = [];
  if (!existsSync(distDir)) return problems;
  for (const f of readdirSync(distDir).sort()) {
    if (!f.endsWith('.html') || f.includes('.debug.')) continue;
    if (f.includes('.preview.')) {
      const data = extractData(readFileSync(join(distDir, f), 'utf8'));
      const meta = data === null ? undefined : (JSON.parse(data) as { meta?: { synthetic?: boolean } }).meta;
      if (meta?.synthetic !== true) problems.push(`${f}: a preview page must carry data marked synthetic`);
      continue;
    }
    const data = extractData(readFileSync(join(distDir, f), 'utf8'));
    if (data === null) { problems.push(`${f}: no game-data block`); continue; }
    const meta = (JSON.parse(data) as { meta?: { synthetic?: boolean } }).meta;
    if (!meta || meta.synthetic !== false) problems.push(`${f}: meta.synthetic is not false`);
    if (data.includes('SYN_')) problems.push(`${f}: contains a synthetic identifier (SYN_)`);
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = noSynthetic();
  for (const x of p) console.error(x);
  if (p.length) process.exit(1);
  console.log('no-synthetic: ok');
}
