// Contact sheet for the postcards: mounts living cards in Chromium across hours, weathers, seasons and the crisis,
// and screenshots them, so each city can be judged by eye against the model card.
//   node tools/postcards.mjs [VIE,LON,…] [--set day|weather|war|season|all|custom] [--cells "12:clear:peace,20.5:rain:war"]
//                            [--width 420] [--still] [--wait 1500] [--out build/postcards.png] [--cols 3]
//                            [--shots 2 --every 2000] (several frames, to see the parts move)
// A cell is hour:weather:war[:season[:day]] (day = days after 28 June). Uses esbuild and Playwright from
// ../prototype/node_modules; Federant comes from Google Fonts through the proxy when there is one.
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
writeIndexes();
const { default: cards } = await import(path.join(ROOT, 'src/art/postcards/index.js'));
const { default: D } = await import(path.join(ROOT, 'src/data/index.js'));
const want = (args.find((a) => /^[A-Z]{3}(,[A-Z]{3})*$/.test(a)) || '').split(',').filter(Boolean);
const ids = cards.map((c) => c.id).filter((id) => !want.length || want.includes(id));
const SETS = {
  day: ['5:clear:peace', '12:clear:peace', '20.5:clear:peace', '23:clear:peace'],
  weather: ['15:rain:peace', '9:fog:peace', '21:storm:peace', '14:heat:peace', '13:cloud:peace', '17:smoke:peace'],
  war: ['12:clear:tension:summer:30', '12:clear:war:summer:36', '21.5:rain:war:summer:36'],
  season: ['12:clear:peace:spring', '12:clear:peace:summer:36', '12:clear:peace:autumn', '12:cloud:peace:winter', '16:rain:peace:winter'],
};
SETS.all = [...SETS.day, ...SETS.weather, ...SETS.war, ...SETS.season];
const set = opt('--set', 'day');
const cellSpecs = (opt('--cells', null)?.split(',') ?? SETS[set] ?? SETS.day).map((c) => { const [h, weather = 'clear', war = 'peace', season = 'summer', day = '4'] = c.split(':'); return { h: +h, weather, war, season, day: +day }; });
const width = Number(opt('--width', '420'));
const cols = Number(opt('--cols', String(Math.min(cellSpecs.length, 3))));
const out = path.resolve(opt('--out', path.join(ROOT, 'build/postcards.png')));
const cells = [];
for (const id of ids) {
  const c = D.cities.find((x) => x.id === id);
  for (const k of cellSpecs) cells.push({ id, label: `${id} · ${String(Math.floor(k.h)).padStart(2, '0')}.${String(Math.round((k.h % 1) * 60)).padStart(2, '0')} · ${k.weather} · ${k.war} · ${k.season} · day ${k.day}`, input: { t: k.day * 1440 + k.h * 60, lon: c.ll[0], lat: c.ll[1], weather: k.weather, war: k.war, season: k.season } });
}

const entry = `
import { postcard } from './src/ui/postcard.js';
window.render = async (cells, still, width) => {
  const g = document.getElementById('g');
  const ready = [];
  for (const c of cells) {
    const fig = document.createElement('figure');
    fig.innerHTML = '<figcaption>' + c.label + '</figcaption>';
    const h = postcard(c.id, c.input, { still, width });
    fig.prepend(h.el); g.append(fig); ready.push(h.ready);
  }
  const t0 = performance.now();
  await Promise.all(ready);
  try { await document.fonts.ready; } catch {}
  return performance.now() - t0;
};`;
const res = await esbuild.build({ stdin: { contents: entry, resolveDir: ROOT, loader: 'js' }, bundle: true, format: 'iife', write: false, logLevel: 'error' });
const css = fs.readFileSync(path.join(ROOT, 'src/ui/postcard.css'), 'utf8');
const proxy = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
const browser = await chromium.launch(proxy);
const page = await browser.newPage({ viewport: { width: cols * (width + 16) + 24, height: 600 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Federant&display=swap"><style>${css}
body{margin:10px;background:#d9cdb3;font:11px monospace} #g{display:grid;grid-template-columns:repeat(${cols},${width}px);gap:14px 16px} figure{margin:0} figcaption{margin-top:4px;color:#3a3020}</style></head><body><div id="g"></div></body></html>`);
await page.addScriptTag({ content: res.outputFiles[0].text });
const ms = await page.evaluate(([c, s, w]) => window.render(c, s, w), [cells, args.includes('--still'), width]);
await page.waitForTimeout(Number(opt('--wait', '1500')));
fs.mkdirSync(path.dirname(out), { recursive: true });
// --shots n --every ms: a few frames apart, to see the parts move
const shots = Number(opt('--shots', '1'));
for (let i = 0; i < shots; i++) {
  if (i) await page.waitForTimeout(Number(opt('--every', '2000')));
  await page.screenshot({ path: shots > 1 ? out.replace(/\.png$/, `-${i + 1}.png`) : out, fullPage: true });
}
await browser.close();
console.log(`${cells.length} cards ready in ${ms.toFixed(0)} ms → ${path.relative(process.cwd(), out)}${errors.length ? `\nerrors:\n${[...new Set(errors)].join('\n')}` : ''}`);
