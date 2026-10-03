/**
 * The repository's Python .gitignore template ignores lib/, build/, env/, var/, downloads/, *.log,
 * *.spec and *.manifest at any depth. Fails if any intended source file under prototype/ would be
 * ignored by git.
 */
import { execFileSync } from 'node:child_process';
import { ROOT } from '../make/paths.ts';
import { listFiles } from './source-files.ts';

export function ignoreTraps(): string[] {
  const files = listFiles('.', undefined).filter((f) => !f.startsWith('data/raw/') || !f.includes('/scans/'));
  if (files.length === 0) return [];
  try {
    const out = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], { cwd: ROOT, input: files.join('\n') }).toString();
    return out.split('\n').filter(Boolean).map((f) => `${f}: ignored by .gitignore (rename it)`);
  } catch (e) {
    // git check-ignore exits 1 when nothing matches.
    const err = e as { status?: number; stdout?: Buffer };
    if (err.status === 1) return [];
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = ignoreTraps();
  for (const x of p) console.error(x);
  if (p.length) process.exit(1);
  console.log('ignore-traps: ok');
}
