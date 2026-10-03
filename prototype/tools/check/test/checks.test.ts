import { describe, it, expect } from 'vitest';
import { scanSource } from '../determinism-scan.ts';
import { checkFile, importsOf } from '../import-boundaries.ts';
import { stripCommentsAndStrings } from '../source-files.ts';
import { noSynthetic } from '../no-synthetic.ts';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('determinism scan', () => {
  it('flags each banned API', () => {
    const cases = [
      'const r = Math.random();',
      'const t = Date.now();',
      'const d = new Date(0);',
      'const x = Date(1);',
      'const p = performance.now();',
      'const f = new Intl.NumberFormat();',
      "a.localeCompare(b);",
      'for (const k in obj) {}',
      'const e = Math.exp(1);',
      'const q = Math.pow(2, 3);',
      'const s = 2 ** 3;',
    ];
    for (const c of cases) expect(scanSource(c), c).not.toEqual([]);
  });
  it('allows exact arithmetic, identifiers containing Date, and banned words in comments or strings', () => {
    const ok = [
      'const m = Math.floor(a / b) + Math.min(1, 2) + Math.sqrt(4) + Math.imul(3, 5);',
      'const updateDate = 3; obj.lastDate = 4;',
      '// Math.random() is banned here',
      "const s = 'Date.now() and Math.exp';",
      'for (const k of Object.keys(obj).sort()) {}',
      'const x = a * b;',
    ];
    for (const c of ok) expect(scanSource(c), c).toEqual([]);
  });
});

describe('comment and string stripping', () => {
  it('keeps code and quotes but drops contents', () => {
    expect(stripCommentsAndStrings('a /* b */ "c" // d\ne')).toBe('a  "" \ne');
  });
});

describe('import boundaries', () => {
  it('reads import specifiers', () => {
    expect(importsOf("import { a } from './x.ts';\nimport './y.css';\nexport { b } from '#kit/c.ts';")).toEqual(['./x.ts', './y.css', '#kit/c.ts']);
  });
  it('rejects one game importing another', () => {
    expect(checkFile('games/c07-departure/src/game.ts', "import x from '../../c01-masters/src/game.ts';")).not.toEqual([]);
  });
  it('limits UI imports to views and display helpers', () => {
    expect(checkFile('games/c07-departure/src/ui/Board.tsx', "import { hunt } from '../rules/hunt.ts';")).not.toEqual([]);
    expect(checkFile('games/c07-departure/src/ui/Board.tsx', "import { boardView } from '../views/board.ts';\nimport { h } from 'preact';")).toEqual([]);
  });
  it('keeps forecasts away from stores and hunters', () => {
    expect(checkFile('games/c07-departure/src/rules/forecast.ts', "import { RecordStore } from '#kit/records/store.ts';")).not.toEqual([]);
    expect(checkFile('games/c07-departure/src/rules/forecast.ts', "import type { RecordTuple } from '#kit/records/tuple.ts';")).toEqual([]);
    expect(checkFile('games/c07-departure/src/views/board.ts', "import { mass } from '#kit/hunter/belief.ts';")).not.toEqual([]);
    expect(checkFile('games/c07-departure/src/views/autopsy.ts', "import type { RecordTuple } from '#kit/records/delivery.ts';")).toEqual([]);
  });
  it('keeps the kit independent of games', () => {
    expect(checkFile('kit/src/sim/sim.ts', "import x from '../../../games/c07-departure/src/game.ts';")).not.toEqual([]);
  });
});

describe('no-synthetic', () => {
  const page = (meta: object, extra = ''): string => `<script type="application/json" id="game-data">${JSON.stringify({ meta, x: extra })}</script>`;
  it('refuses synthetic data in release pages and accepts it only in debug and preview pages', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nosyn-'));
    writeFileSync(join(dir, 'g.html'), page({ synthetic: false }));
    writeFileSync(join(dir, 'g.debug.html'), page({ synthetic: true }, 'SYN_A'));
    writeFileSync(join(dir, 'g.preview.html'), page({ synthetic: true }, 'SYN_A'));
    writeFileSync(join(dir, 'g.preview.artifact.html'), page({ synthetic: true }, 'SYN_A'));
    expect(noSynthetic(dir)).toEqual([]);
    writeFileSync(join(dir, 'h.html'), page({ synthetic: true }, 'SYN_A'));
    writeFileSync(join(dir, 'h.preview.html'), page({ synthetic: false }));
    expect(noSynthetic(dir)).toEqual([
      'h.html: meta.synthetic is not false',
      'h.html: contains a synthetic identifier (SYN_)',
      'h.preview.html: a preview page must carry data marked synthetic',
    ]);
  });
});
