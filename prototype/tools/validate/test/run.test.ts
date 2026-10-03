import { describe, it, expect } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateAndReport } from '../run.ts';
import { WORLD } from './world.ts';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const tmp = () => mkdtempSync(join(tmpdir(), 'syn-validate-'));

describe('validate/run.ts', () => {
  it('writes validation.md and the diff reports, deterministically', () => {
    const out = tmp();
    const res = validateAndReport({ data: WORLD, reports: out });
    expect(res.issues.filter((i) => i.level === 'error')).toEqual([]);
    const md = readFileSync(join(out, 'validation.md'), 'utf8');
    expect(md).toContain('**passed**');
    expect(md).toContain('| V05 | Through links, frontier pairs and reach | 0 | 0 | 0 |');
    expect(existsSync(join(out, 'diff-SYN_E2-SYN_E1.md'))).toBe(true);
    validateAndReport({ data: WORLD, reports: out });
    expect(readFileSync(join(out, 'validation.md'), 'utf8')).toBe(md);
  });
  it('exits 0 on valid data and 1 on any error', () => {
    const out = tmp();
    const ok = spawnSync(process.execPath, ['tools/validate/run.ts', '--data', WORLD, '--reports', out], { cwd: ROOT, encoding: 'utf8' });
    expect(ok.status, ok.stderr).toBe(0);
    expect(ok.stdout).toMatch(/validation: 0 error\(s\)/);
    const bad = join(tmp(), 'data');
    cpSync(WORLD, bad, { recursive: true });
    const p = join(bad, 'canonical', 'stops.csv');
    writeFileSync(p, readFileSync(p, 'utf8').replace('SYN_E1.SYN_T2.c0,2,SYN_BER,08:15,08:40,1,1', 'SYN_E1.SYN_T2.c0,2,SYN_BER,08:15,08:40,0,0'));
    const fail = spawnSync(process.execPath, ['tools/validate/run.ts', '--data', bad, '--reports', out], { cwd: ROOT, encoding: 'utf8' });
    expect(fail.status).toBe(1);
    expect(fail.stderr).toMatch(/V03 error service SYN_E1.SYN_T2.c0: time goes backwards/);
    expect(readFileSync(join(out, 'validation.md'), 'utf8')).toContain('**failed**');
  });
  it('runs on the repository data folder and writes its report', () => {
    const out = tmp();
    const res = validateAndReport({ data: join(ROOT, 'data'), reports: out });
    expect(Array.isArray(res.issues)).toBe(true);
    expect(readFileSync(join(out, 'validation.md'), 'utf8')).toMatch(/^# Data validation report/);
  });
});
