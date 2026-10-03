import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../make/paths.ts';

export const WARN_BYTES = 1_200_000;
export const FAIL_BYTES = 2_000_000;

export interface SizeReport { file: string; bytes: number; level: 'ok' | 'warn' | 'fail' }

export function sizeBudget(distDir = join(ROOT, 'dist')): SizeReport[] {
  if (!existsSync(distDir)) return [];
  return readdirSync(distDir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => {
      const bytes = statSync(join(distDir, f)).size;
      const level = bytes > FAIL_BYTES ? 'fail' : bytes > WARN_BYTES ? 'warn' : 'ok';
      return { file: f, bytes, level } as SizeReport;
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rep = sizeBudget();
  for (const r of rep) console.log(`${r.level.padEnd(4)} ${r.file} ${r.bytes} bytes`);
  if (rep.some((r) => r.level === 'fail')) process.exit(1);
}
