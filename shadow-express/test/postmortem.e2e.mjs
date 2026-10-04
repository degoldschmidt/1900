// Browser checks of the end card's "Their file on you" and of the Copy run report button.
//   node test/postmortem.e2e.mjs [--page file.html] [--shots dir]
// It builds its own page (build/postmortem.html unless --page is given; the shared dev page is never touched), plays
// two campaigns in Node, loads each into the page and ends it, then looks at the card on a phone and on a desktop:
// the file is there and agrees with the engine, nothing overflows, the console is quiet, the copy button works with a
// working clipboard, with none, with one that refuses, and inside a sandboxed frame where downloads and
// clipboard-read are blocked. Screenshots go to build/shots-pm/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import D from '../src/data/index.js';
import { newGame, makeGame } from '../src/core/game.js';
import { endGame } from '../src/core/sim.js';
import { postmortem } from '../src/core/postmortem.js';
import { reportText } from '../src/core/report.js';
import { play } from './bots/bots.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const pageArg = args.indexOf('--page');
const page = pageArg >= 0 ? path.resolve(args[pageArg + 1]) : path.join(ROOT, 'build/postmortem.html');
const shots = path.resolve(args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(ROOT, 'build/shots-pm'));
if (pageArg < 0) execFileSync(process.execPath, [path.join(ROOT, 'build.mjs'), '--out', page], { stdio: 'inherit' });
// the local copy of d3 served in place of the CDN: the path constant of test/e2e.mjs itself, so the two never drift apart
const D3_PATH = process.env.D3_PATH || /D3_PATH \|\| '([^']+)'/.exec(fs.readFileSync(path.join(ROOT, 'test/e2e.mjs'), 'utf8'))?.[1];
if (!D3_PATH || !fs.existsSync(D3_PATH)) { console.error('no local d3: set D3_PATH to a copy of d3 7.8.5 (d3.min.js)'); process.exit(1); }
const D3 = fs.readFileSync(D3_PATH, 'utf8');
fs.mkdirSync(shots, { recursive: true });
const wrapped = page.replace(/\.html$/, '') + '.e2e.html';
fs.writeFileSync(wrapped, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${fs.readFileSync(page, 'utf8')}</body></html>`);
const framed = page.replace(/\.html$/, '') + '.frame.html'; // the same page inside a sandbox that allows scripts and nothing else
fs.writeFileSync(framed, `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><iframe id="game" sandbox="allow-scripts" src="${path.basename(wrapped)}" style="border:0;width:100vw;height:100vh"></iframe></body></html>`);

// ---------- two campaigns, played to their ends in Node, and what the engine says of each ----------
const SCENES = [
  { name: 'recalled', policy: 'careless', seed: 39595, sex: 'm', why: 'recalled' },
  { name: 'home', policy: 'competent', seed: 15838, sex: 'f', why: 'home' },
];
for (const s of SCENES) {
  const G = makeGame(D, newGame(D, { seed: s.seed, sex: s.sex }));
  play(G, s.policy);
  s.state = JSON.parse(JSON.stringify(G.S));
  s.state.ended = null; s.state.queue = []; // the page ends it itself
  const H = makeGame(D, JSON.parse(JSON.stringify(s.state)));
  endGame(H, s.why);
  s.pm = postmortem(H);
  s.report = reportText(H);
}

const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log(`  FAIL ${msg}`); } };
const browser = await chromium.launch();
const route = (p) => p.route('**/*', (r) => {
  const u = r.request().url();
  if (u.includes('cdnjs.cloudflare.com/ajax/libs/d3')) return r.fulfill({ body: D3, contentType: 'application/javascript' });
  if (/^(file|data|blob|about):/.test(u)) return r.continue();
  return r.abort();
});
/** Start the scene's campaign in the page (or frame), put the played history into it, and end it. */
const stage = (target, s) => target.evaluate(({ s }) => {
  const sh = window.__shadow;
  sh.start(s.sex, s.seed);
  const G = sh.G;
  Object.assign(G.S, s.state);
  G.S.ended = null; G.S.queue.length = 0;
  sh.A.endGame(G, s.why);
  sh.refresh();
  return G.S.ended.why;
}, { s: { name: s.name, sex: s.sex, seed: s.seed, why: s.why, state: s.state } });

for (const [vpName, vp, touch] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  p.on('download', () => errors.push('a download was started'));
  await route(p);
  for (const s of SCENES) {
    console.log(`${vpName} · ${s.name}`);
    await p.goto('file://' + wrapped);
    await p.waitForTimeout(500);
    check((await stage(p, s)) === s.why, `${vpName}/${s.name}: the page ended with ${s.why}`);
    await p.locator('.veil:not([hidden]) details.pm[open]').waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    const shot = (k) => p.screenshot({ path: path.join(shots, `pm-${vpName}-${s.name}-${k}.png`) });
    const pmBox = p.locator('.veil:not([hidden]) details.pm');
    check(await pmBox.isVisible(), `${vpName}/${s.name}: Their file on you is visible`);
    check((await p.locator('.veil:not([hidden]) details.pm > summary').innerText()).trim() === 'Their file on you', `${vpName}/${s.name}: the summary reads "Their file on you"`);
    check((await p.locator('.pm-lead').innerText()).trim() === s.pm.headline, `${vpName}/${s.name}: the headline is the engine's`);
    const seen = s.pm.covers.filter((c) => c.status !== 'clean');
    check((await p.locator('.pm-cover').count()) === seen.length, `${vpName}/${s.name}: ${seen.length} names are shown`);
    check((await p.locator('.pm-cover .pm-name').allInnerTexts()).join('|') === seen.map((c) => c.name).join('|'), `${vpName}/${s.name}: the names are those of the engine, in its order`);
    const bec = s.pm.covers.filter((c) => ['posted', 'burned', 'suspect'].includes(c.status)).reduce((a, c) => a + c.because.length, 0);
    check((await p.locator('.pm-cover .pm-list li').count()) === bec, `${vpName}/${s.name}: ${bec} reasons are shown`);
    check(await p.locator('[data-copy-report]').isVisible() || await p.locator('[data-copy-report]').count() === 1, `${vpName}/${s.name}: the copy button is on the card`);
    // layout
    await shot('1-top');
    const box = await p.evaluate(() => {
      const c = document.querySelector('.veil:not([hidden]) .card');
      return { page: document.documentElement.scrollWidth - window.innerWidth, card: c.scrollWidth - c.clientWidth, scrolls: c.scrollHeight > c.clientHeight, wide: [...c.querySelectorAll('.pm *')].filter((e) => e.getBoundingClientRect().right > c.getBoundingClientRect().right + 1).length };
    });
    check(box.page <= 1, `${vpName}/${s.name}: no horizontal overflow of the page (${box.page})`);
    check(box.card <= 1, `${vpName}/${s.name}: none inside the card (${box.card})`);
    check(box.wide === 0, `${vpName}/${s.name}: nothing in the file pokes out of the card (${box.wide})`);
    check(box.scrolls, `${vpName}/${s.name}: the card scrolls`);
    await p.evaluate(() => { const c = document.querySelector('.veil:not([hidden]) .card'); c.scrollTop = c.scrollHeight; });
    await p.waitForTimeout(150);
    await shot('2-bottom');
    // the collapsible: it can be shut and opened again
    await p.locator('.pm > summary').click();
    check(!(await p.locator('.pm-lead').isVisible()), `${vpName}/${s.name}: the file collapses`);
    await p.locator('.pm > summary').click();
    check(await p.locator('.pm-lead').isVisible(), `${vpName}/${s.name}: and opens again`);

    // ---- the button, with a clipboard that works
    await p.evaluate(() => { window.__copied = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__copied = t; } } }); });
    await p.locator('[data-copy-report]').click();
    await p.waitForTimeout(150);
    check((await p.evaluate(() => window.__copied)) === s.report, `${vpName}/${s.name}: the clipboard holds the engine's report`);
    check(!(await p.locator('.pm-veil').count()), `${vpName}/${s.name}: no dialog when the clipboard works`);
    check(/copied/i.test(await p.locator('[data-copy-report] span').innerText()), `${vpName}/${s.name}: the button says it was copied`);

    // ---- no clipboard at all, then one that refuses: the report appears, selected, in a dialog
    for (const [how, setup] of [['none', () => Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => undefined })],
      ['refusing', () => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } })]]) {
      await p.evaluate(setup);
      await p.locator('[data-copy-report]').click();
      const ta = p.locator('.pm-veil textarea.pm-text');
      await ta.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      check(await ta.isVisible(), `${vpName}/${s.name}/${how}: the textarea is shown`);
      const st = await p.evaluate(() => { const t = document.querySelector('.pm-veil textarea'); return t ? { v: t.value, a: t.selectionStart, b: t.selectionEnd, focus: document.activeElement === t, note: document.querySelector('.pm-note').textContent } : null; });
      check(st?.v === s.report, `${vpName}/${s.name}/${how}: it holds the report`);
      check(st && st.a === 0 && st.b === st.v.length, `${vpName}/${s.name}/${how}: all of it is selected`);
      check(st?.focus, `${vpName}/${s.name}/${how}: and focused`);
      check(/Copied|press and hold/i.test(st?.note ?? ''), `${vpName}/${s.name}/${how}: the caption says what to do: "${st?.note}"`);
      if (how === 'none') await p.screenshot({ path: path.join(shots, `pm-${vpName}-${s.name}-3-dialog.png`) });
      const dbox = await p.evaluate(() => { const d = document.querySelector('.pm-dialog').getBoundingClientRect(); return { l: d.left, r: d.right, t: d.top, b: d.bottom, w: window.innerWidth, h: window.innerHeight }; });
      check(dbox.l >= 0 && dbox.r <= dbox.w + 1 && dbox.t >= 0 && dbox.b <= dbox.h + 1, `${vpName}/${s.name}/${how}: the dialog fits the screen`);
      await p.keyboard.press('Escape');
      check(!(await p.locator('.pm-veil').count()), `${vpName}/${s.name}/${how}: Escape closes it`);
      check(await p.evaluate(() => document.activeElement?.hasAttribute('data-copy-report')), `${vpName}/${s.name}/${how}: and the focus goes back to the button`);
      check(await p.locator('.veil:not([hidden]) details.pm').isVisible(), `${vpName}/${s.name}/${how}: the end card is still there`);
    }
    if (vpName === 'desktop' && s.name === 'recalled') {
      // a clipboard that never answers: after a moment the dialog comes all the same, and Tab does not leave it
      await p.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(() => {}) } }));
      await p.locator('[data-copy-report]').click();
      await p.locator('.pm-veil textarea').waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
      check(await p.locator('.pm-veil textarea').isVisible(), `${vpName}/${s.name}: a clipboard that never answers still brings the dialog`);
      for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
      check(await p.evaluate(() => !!document.activeElement?.closest('.pm-veil')), `${vpName}/${s.name}: Tab stays in the dialog`);
      for (let i = 0; i < 6; i++) await p.keyboard.press('Shift+Tab');
      check(await p.evaluate(() => !!document.activeElement?.closest('.pm-veil')), `${vpName}/${s.name}: and so does Shift+Tab`);
      await p.keyboard.press('Escape');
    }
    // ---- copying by the old way fails too: the caption tells the reader to press and hold
    await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => undefined }); document.execCommand = () => false; });
    await p.locator('[data-copy-report]').click();
    await p.locator('.pm-veil textarea').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    check(/press and hold/i.test(await p.locator('.pm-note').innerText().catch(() => '')), `${vpName}/${s.name}: with no way to copy, the caption says press and hold`);
    check(/press and hold/i.test(await p.locator('[data-copy-report] span').innerText()), `${vpName}/${s.name}: and so does the button`);
    await p.locator('[data-copy-close]').click();
    check(!(await p.locator('.pm-veil').count()), `${vpName}/${s.name}: Close closes it`);
  }
  console.log(`${vpName}: ${errors.length ? errors.join(' | ') : 'no errors'}`);
  fails.push(...errors);
  await ctx.close();
}

// ---------- inside a sandbox: scripts only, no downloads, no clipboard permission, no storage ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('download', () => errors.push('a download was started'));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await route(p);
  await p.goto('file://' + framed);
  await p.waitForTimeout(900);
  const f = p.frames().find((x) => x !== p.mainFrame());
  const s = SCENES[0];
  console.log('sandboxed frame');
  if (!f) check(false, 'sandbox: the game frame loaded');
  else {
    check((await stage(f, s).catch((e) => `error: ${e.message}`)) === s.why, 'sandbox: the campaign ends inside the frame');
    await f.locator('details.pm[open]').waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    check(await f.locator('details.pm').isVisible(), 'sandbox: the file on you is visible');
    await f.locator('[data-copy-report]').click();
    const ta = f.locator('.pm-veil textarea.pm-text');
    await ta.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    const how = await f.evaluate(() => ({ clip: typeof navigator.clipboard, note: document.querySelector('.pm-note')?.textContent ?? null, v: document.querySelector('.pm-veil textarea')?.value ?? null }));
    console.log(`  clipboard in the frame: ${how.clip}; caption: ${how.note}`);
    // a frame that may not write to the clipboard gets the dialog; one that may, copies without a word
    check(how.v === null || how.v === s.report, 'sandbox: the dialog, if shown, holds the report');
    check(how.v !== null || /copied/i.test(await f.locator('[data-copy-report] span').innerText()), 'sandbox: either the dialog or the "copied" line appears');
    await p.screenshot({ path: path.join(shots, 'pm-phone-sandbox-dialog.png') });
  }
  console.log(`sandbox: ${errors.length ? errors.join(' | ') : 'no errors'}`);
  fails.push(...errors);
  await ctx.close();
}
await browser.close();
console.log(fails.length ? `\n${fails.length} failure(s)` : '\nall post-mortem checks passed');
process.exit(fails.length ? 1 : 0);
