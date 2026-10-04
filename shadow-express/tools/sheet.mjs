// Contact sheet: renders the portraits or the map glyphs to a PNG so the engravings can be judged by eye.
// (The cities are postcards: their sheet is tools/postcards.mjs.)
//   node tools/sheet.mjs --portraits | --glyphs [--out path.png] [--scale 1]
// Uses esbuild and Playwright from ../prototype/node_modules and the Chromium at /opt/pw-browsers.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeIndexes } from './indexes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const esbuild = require('esbuild');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const scale = Number(opt('--scale', '1'));
const out = path.resolve(opt('--out', path.join(ROOT, 'build/sheet.png')));
const mode = args.includes('--glyphs') ? 'glyphs' : 'portraits';
if (!args.includes('--portraits') && !args.includes('--glyphs')) console.log('portraits (pass --glyphs for the map glyphs; the cities are drawn by tools/postcards.mjs)');

writeIndexes();
const entry = `
${mode === 'portraits' ? "import { portrait } from './src/art/portraits.js'; import people from './src/data/people.js'; import hunters from './src/data/hunters.js';" : ''}
${mode === 'glyphs' ? "import glyphs from './src/art/glyphs.js';" : ''}
window.render = () => {
  const out = [];
  const t0 = performance.now();
  ${mode === 'portraits' ? `for (const p of [...people, ...hunters]) out.push({ label: p.id, svg: portrait(p.portrait, 'p' + p.id), w: 120, h: 150 });` : ''}
  ${mode === 'glyphs' ? `for (const [id, g] of Object.entries(glyphs)) out.push({ label: id, svg: g('g' + id), w: 64, h: 64 });` : ''}
  document.body.innerHTML = out.map((o) => '<figure style="margin:6px;display:inline-block;vertical-align:top"><div style="width:' + o.w * ${scale} + 'px">' + o.svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ') + '</div><figcaption style="font:11px monospace">' + o.label + '</figcaption></figure>').join('');
  return { n: out.length, ms: performance.now() - t0 };
};`;
const res = await esbuild.build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'js' }, bundle: true, format: 'iife', write: false, logLevel: 'error' });
const browser = await chromium.launch();
const cols = mode === 'portraits' ? 6 : 10;
const cellW = (mode === 'portraits' ? 120 : 64) * scale + 14;
const page = await browser.newPage({ viewport: { width: cols * cellW + 20, height: 400 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setContent('<!doctype html><body style="margin:6px;background:#d9cdb3"></body>');
await page.addScriptTag({ content: res.outputFiles[0].text });
const info = await page.evaluate(() => window.render());
await page.waitForTimeout(300);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`${info.n} drawings in ${info.ms.toFixed(0)} ms → ${out}${errors.length ? `\nerrors:\n${errors.join('\n')}` : ''}`);
