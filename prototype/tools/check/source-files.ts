import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from '../make/paths.ts';

const SKIP = new Set(['node_modules', 'dist', 'build', 'scans', 'test-results', 'playwright-report', 'coverage', '.git']);

/** Recursively lists files under `dir` (relative to prototype/), skipping generated and vendored folders. */
export function listFiles(dir: string, exts?: string[]): string[] {
  const out: string[] = [];
  const walk = (abs: string) => {
    for (const name of readdirSync(abs).sort()) {
      if (SKIP.has(name)) continue;
      const p = join(abs, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (!exts || exts.some((e) => name.endsWith(e))) out.push(relative(ROOT, p));
    }
  };
  walk(join(ROOT, dir));
  return out;
}

/** Removes // and /* *\/ comments and string/template literal contents so scans only see code. */
export function stripCommentsAndStrings(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i]!; const n = src[i + 1];
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; out += q; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; if (src[i] === '\n' && q !== '`') break; i++; }
      out += q; i++; continue;
    }
    out += c; i++;
  }
  return out;
}
