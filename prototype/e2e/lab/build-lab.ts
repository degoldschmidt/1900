/** Builds the kit lab page (debug only, synthetic) into build/lab/lab.html. */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LAB_HTML = join(ROOT, 'build', 'lab', 'lab.html');

export async function buildLab(out = LAB_HTML): Promise<string> {
  const res = await build({
    entryPoints: [join(ROOT, 'e2e', 'lab', 'lab.tsx')],
    bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: false, write: false,
    jsx: 'automatic', jsxImportSource: 'preact', logLevel: 'silent',
    define: { __DEBUG__: 'true', __BUILD_ID__: '"lab"' },
  });
  const js = res.outputFiles[0]!.text.replace(/<\/script/gi, '<\\/script');
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kit lab</title>` +
    `<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:16px;background:#fbfaf7;color:#1d1b17}@media (prefers-color-scheme:dark){body{background:#1b1a17;color:#ebe6da}}</style>` +
    `</head><body><div id="app"></div><script>${js}</script></body></html>\n`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(await buildLab());
