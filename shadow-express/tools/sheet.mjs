// Contact sheet: renders vignettes (and portraits, glyphs) to a PNG so the art can be judged by eye.
//   node tools/sheet.mjs [LON,PAR,…] [--hours 12,6,19,23] [--weather clear] [--out path.png] [--portraits] [--glyphs] [--scale 1]
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
const cities = (args.find((a) => /^[A-Z]{3}(,[A-Z]{3})*$/.test(a)) || '').split(',').filter(Boolean);
const hours = opt('--hours', '12,6,19,23').split(',').map(Number);
const weather = opt('--weather', 'clear');
const scale = Number(opt('--scale', '1'));
const out = path.resolve(opt('--out', path.join(ROOT, 'build/sheet.png')));
const mode = args.includes('--portraits') ? 'portraits' : args.includes('--glyphs') ? 'glyphs' : 'vignettes';

writeIndexes();
const entry = `
import vignettes from './src/art/vignettes/index.js';
import { renderScene } from './src/art/frame.js';
${mode === 'portraits' ? "import { portrait } from './src/art/portraits.js'; import people from './src/data/people.js'; import hunters from './src/data/hunters.js';" : ''}
${mode === 'glyphs' ? "import glyphs from './src/art/glyphs.js';" : ''}
window.render = () => {
  const out = [];
  const t0 = performance.now();
  ${mode === 'vignettes' ? `
  const want = ${JSON.stringify(cities)};
  const list = vignettes.filter((v) => !want.length || want.includes(v.id));
  for (const v of list) for (const h of ${JSON.stringify(hours)}) {
    let svg; try { svg = renderScene(v, { hour: h, weather: ${JSON.stringify(weather)}, uid: v.id + h, seed: [...v.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 997 }); } catch (e) { svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 240"><text x="20" y="120" font-size="20">' + v.id + ': ' + e.message + '</text></svg>'; }
    out.push({ label: v.id + ' · ' + String(h).padStart(2, '0') + '.00 · ' + (svg.length / 1024).toFixed(0) + ' KB', svg, w: 640, h: 240 });
  }` : ''}
  ${mode === 'portraits' ? `for (const p of [...people, ...hunters]) out.push({ label: p.id, svg: portrait(p.portrait, 'p' + p.id), w: 120, h: 150 });` : ''}
  ${mode === 'glyphs' ? `for (const [id, g] of Object.entries(glyphs)) out.push({ label: id, svg: g('g' + id), w: 64, h: 64 });` : ''}
  document.body.innerHTML = out.map((o) => '<figure style="margin:6px;display:inline-block;vertical-align:top"><div style="width:' + o.w * ${scale} + 'px">' + o.svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ') + '</div><figcaption style="font:11px monospace">' + o.label + '</figcaption></figure>').join('');
  return { n: out.length, ms: performance.now() - t0 };
};`;
const res = await esbuild.build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'js' }, bundle: true, format: 'iife', write: false, logLevel: 'error' });
const browser = await chromium.launch();
const cols = mode === 'vignettes' ? Math.min(hours.length, 2) : mode === 'portraits' ? 6 : 10;
const cellW = (mode === 'vignettes' ? 640 : mode === 'portraits' ? 120 : 64) * scale + 14;
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
