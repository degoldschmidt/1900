// Frame times under a 4× CPU throttle: idle, and dragging at high zoom. Budgets: median ≤ 33 ms idle, ≤ 50 ms dragging.
//   node test/perf.mjs [--release] [--page file.html]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const { chromium } = require('playwright');
const D3 = fs.readFileSync(process.env.D3_PATH || '/tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/game/d3-7.8.5/package/dist/d3.min.js', 'utf8');
const pageArg = process.argv.indexOf('--page');
const page = pageArg > 0 ? path.resolve(process.argv[pageArg + 1]) : path.join(ROOT, process.argv.includes('--release') ? 'index.html' : 'build/dev.html');
const wrapped = page.replace(/\.html$/, '') + '.perf.html';
fs.writeFileSync(wrapped, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${fs.readFileSync(page, 'utf8')}</body></html>`);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.route('**/*', (r) => { const u = r.request().url(); if (u.includes('cdnjs')) return r.fulfill({ body: D3, contentType: 'application/javascript' }); if (/^(file|blob|data):/.test(u)) return r.continue(); return r.abort(); });
await p.goto('file://' + wrapped);
await p.waitForTimeout(500);
await p.evaluate(() => window.__shadow.start('m', 3));
await p.evaluate(() => { for (let i = 0; i < 10; i++) { const b = document.querySelector('.veil:not([hidden]) .choice:not([disabled])'); if (!b) break; b.click(); document.querySelector('#cardCont')?.click(); } });
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const sample = (ms) => p.evaluate((ms) => new Promise((res) => { const t = []; let last = performance.now(); const end = last + ms; function f(now) { t.push(now - last); last = now; if (now < end) requestAnimationFrame(f); else res(t); } requestAnimationFrame(f); }), ms);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const idle = await sample(3000);
await p.evaluate(() => { const g = window.__shadow.globe; g.view.follow = false; g.view.zoom = g.view.tZoom = 14; });
await p.waitForTimeout(800);
const dragP = sample(3000);
const box = await p.locator('#globe').boundingBox();
for (let i = 0; i < 30; i++) {
  await p.mouse.move(box.x + 120 + (i % 10) * 12, box.y + 200);
  if (i === 0) await p.mouse.down();
  await p.waitForTimeout(80);
}
await p.mouse.up();
const drag = await dragP;
const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * .9)]; };
const st = await p.evaluate(() => window.__shadow.globe.stats);
await p.evaluate(() => { const g = window.__shadow.globe; g.invalidate(); });
await p.waitForTimeout(1500);
const st2 = await p.evaluate(() => window.__shadow.globe.stats);
console.log(`idle median ${med(idle).toFixed(1)} ms, p90 ${p90(idle).toFixed(0)} (${idle.length} frames) · drag at 14× median ${med(drag).toFixed(1)} ms, p90 ${p90(drag).toFixed(0)} (${drag.length} frames) · base renders ${st.bases}, last full ${st2.base.toFixed(0)} ms`);
await browser.close();
process.exit(med(idle) <= 33 && med(drag) <= 50 ? 0 : 1);
