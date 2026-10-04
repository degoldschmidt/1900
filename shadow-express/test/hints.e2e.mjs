// Browser checks for the ledger's tab strip and the hints, at a phone (390×844) and a desktop (1440×900) size.
//   node test/hints.e2e.mjs [--page file.html] [--shots dir] [--only phone,desktop,phone-silenced,desktop-silenced,strips]
//   (DEBUG=1 prints the time each scenario took)
// Builds its own page (build/hints.html) unless given one, boots it from file:// with d3 served locally, and plays the
// opening of a campaign through the real ledger and cards. It does not depend on the HUD: the game is driven through
// window.__shadow. If the page wires the hints itself (window.__shadow.hints), that instance is tested; if not, the
// module is bundled and wired here the way main.js should: check() after every ledger render and once a second.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const { chromium } = require('playwright');
const esbuild = require('esbuild');
const args = process.argv.slice(2);
const pageArg = args.indexOf('--page');
const page = pageArg >= 0 ? path.resolve(args[pageArg + 1]) : path.join(ROOT, 'build/hints.html');
const shots = path.resolve(args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(ROOT, 'build/shots-hints'));
if (pageArg < 0) execFileSync(process.execPath, [path.join(ROOT, 'build.mjs'), '--out', page], { stdio: 'inherit' });
const D3 = fs.readFileSync(process.env.D3_PATH || '/tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/game/d3-7.8.5/package/dist/d3.min.js', 'utf8');
fs.mkdirSync(shots, { recursive: true });
for (const f of fs.readdirSync(shots)) if (f.endsWith('-failure.png')) fs.unlinkSync(path.join(shots, f)); // those of an earlier run
const wrapped = page.replace(/\.html$/, '') + '.e2e.html'; // next to the page it wraps, so parallel runs do not collide
fs.writeFileSync(wrapped, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${fs.readFileSync(page, 'utf8')}</body></html>`);
const hintsBundle = esbuild.buildSync({ entryPoints: [path.join(ROOT, 'src/ui/hints.js')], bundle: true, format: 'iife', globalName: 'ShadowHints', write: false, logLevel: 'error' }).outputFiles[0].text;

const TABS = ['City', 'Trains', 'Orders', 'People', 'Case', 'Covers', 'Dossier', 'You'];
const KEYS = ['city', 'board', 'orders', 'people', 'case', 'covers', 'dossier', 'you'];
const GAP = 3000, TOL = 80;
const browser = await chromium.launch();
const fails = [];

/** Run a scenario; an exception is a failure, and what failed before it is kept. */
async function guard(s, f) {
  const t0 = Date.now();
  try { await f(); }
  catch (e) { s.errors.push(`${e.message.split('\n')[0]} (at ${e.stack.split('\n').find((l) => l.includes('hints.e2e')) ?? '?'})`); await s.shot('failure').catch(() => {}); }
  if (process.env.DEBUG) console.log(`${s.name}: ${Math.round((Date.now() - t0) / 1000)} s`);
}

// ---------- a page to play on ----------
async function boot(name, vp, touch) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
  await ctx.addInitScript(() => { // what the hint cards do on the page: when each opens and closes, and how many are up at once
    window.__hintLog = []; window.__hintMax = 0;
    new MutationObserver((ms) => {
      for (const m of ms) {
        for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList?.contains('hint')) window.__hintLog.push({ ev: 'open', id: n.dataset.hint, t: performance.now() });
        for (const n of m.removedNodes) if (n.nodeType === 1 && n.classList?.contains('hint')) { const G = window.__shadow?.G, S = G?.S; window.__hintLog.push({ ev: 'close', id: n.dataset.hint, t: performance.now(), why: S && { t: S.t, busy: S.busyUntil - S.t, queue: S.queue.length, routine: !!S.routine, booked: !!S.booked, journey: !!S.journey, tab: window.__shadow.ledger.state.tab, open: window.__shadow.ledger.isOpen() } }); }
      }
      window.__hintMax = Math.max(window.__hintMax, document.querySelectorAll('.hint').length);
    }).observe(document, { childList: true, subtree: true });
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (u.includes('cdnjs.cloudflare.com/ajax/libs/d3')) return r.fulfill({ body: D3, contentType: 'application/javascript' });
    if (/^(file|data|blob):/.test(u)) return r.continue();
    return r.abort();
  });
  await p.goto('file://' + wrapped);
  await p.waitForTimeout(600);
  const wired = await p.evaluate(() => !!window.__shadow?.hints);
  if (!wired) {
    await p.addScriptTag({ content: hintsBundle });
    await p.evaluate(() => {
      const sh = window.__shadow;
      window.__saves = 0;
      const hints = ShadowHints.makeHints(document.getElementById('app'), {
        game: () => sh.G, openTab: (k) => sh.ledger.show(k), pause: () => {}, save: () => { window.__saves++; },
        busy: () => !!document.querySelector('.veil:not([hidden]), .title'),
      });
      const render = sh.ledger.render;
      sh.ledger.render = (G) => { render(G); hints.check(); }; // after every refresh
      setInterval(() => hints.check(), 1000);                  // and about once a second
      sh.hints = hints;
    });
  }
  const shot = (k) => p.screenshot({ path: path.join(shots, `${name}-${k}.png`) });
  const check = (ok, msg) => { if (!ok) errors.push(msg); return ok; };
  return { ctx, p, errors, shot, check, wired, name, vp };
}

/** Answer the card on top, if there is one: the first open choice, then Continue. Hints must not be up under a card. */
async function answer(s) {
  const { p } = s;
  const b = p.locator('.veil:not([hidden]) .choice:not([disabled])').first();
  if (!(await b.isVisible({ timeout: 200 }).catch(() => false))) return false;
  if (await p.locator('.hint').count()) { await p.waitForTimeout(700); s.check((await p.locator('.hint').count()) === 0, `a hint stays up under a card (${await p.evaluate(() => document.querySelector('.hint')?.dataset.hint)})`); }
  try {
    await b.click({ timeout: 1500 });
    await p.waitForTimeout(150);
    const c = p.locator('#cardCont');
    if (await c.isVisible().catch(() => false)) await c.click({ timeout: 1500 });
    return true;
  } catch { return false; }
}
/** Play on, answering cards, until the page says yes. */
async function until(s, fn, ms = 20000, arg) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await s.p.evaluate(fn, arg)) return true;
    await answer(s);
    await s.p.waitForTimeout(100);
  }
  return false;
}
/** Wait for a hint to open, playing on meanwhile. */
const waitHint = (s, id, ms = 15000) => until(s, (i) => document.querySelector('.hint')?.dataset.hint === i, ms, id);
const waitNoHint = (s, ms = 20000) => until(s, () => !document.querySelector('.hint'), ms);
const idle = (s, ms = 25000) => until(s, () => { const S = window.__shadow.G.S; return !!S.city && !S.journey && !S.booked && !S.routine && S.t >= S.busyUntil && !S.queue.length; }, ms);
/** One watch of the day in the city: work the legend, or keep to the rooms by night. */
async function spend(s) {
  const work = s.p.locator('[data-activity="work"]');
  await ((await work.isEnabled().catch(() => false)) ? work : s.p.locator('[data-activity="rest"]')).click();
}
/** Live in the city, a watch at a time, until it has been `minutes` since arriving; then the hint should come. */
async function spendUntilHint(s, id, minutes) {
  for (let i = 0; i < 12; i++) {
    await tab(s, 'city');
    await idle(s, 20000);
    const since = await s.p.evaluate(() => { const S = window.__shadow.G.S; return S.t - S.cityArrived; });
    if (since >= minutes) return waitHint(s, id, 9000);
    await spend(s);
  }
  return false;
}
const tab = (s, key) => s.p.locator(`.ledger .tab[data-tab="${key}"]`).click();
const seen = (s) => s.p.evaluate(() => ({ ...(window.__shadow.G.S.hints?.seen ?? {}) }));
const opens = (s) => s.p.evaluate(() => window.__hintLog.filter((e) => e.ev === 'open').map((e) => e.id));
const bodyText = (s) => s.p.evaluate(() => document.querySelector('.ledger .body').textContent);

// ---------- the tab strip: all eight in view, in two rows at most ----------
async function checkTabs(s, label) {
  const { p, check, vp } = s;
  const r = await p.evaluate(() => {
    const lg = document.querySelector('.ledger'), lr = lg.getBoundingClientRect(), strip = lg.querySelector('.tabs');
    const tabs = [...lg.querySelectorAll('.tab')];
    const box = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
    return { open: lg.dataset.open, lr: box(lg), vw: innerWidth, vh: innerHeight, sw: strip.scrollWidth, cw: strip.clientWidth,
      labels: tabs.map((t) => t.textContent.trim()), keys: tabs.map((t) => t.dataset.tab), boxes: tabs.map(box),
      reachable: tabs.map((t) => { const b = t.getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return e === t || t.contains(e); }) };
  });
  check(r.open === 'true', `${label}: the ledger is open`);
  check(JSON.stringify(r.labels) === JSON.stringify(TABS), `${label}: tabs read ${r.labels.join(' ')}`);
  check(JSON.stringify(r.keys) === JSON.stringify(KEYS), `${label}: the internal keys are unchanged (${r.keys.join(' ')})`);
  r.boxes.forEach((b, i) => {
    check(b.l >= 0 && b.r <= r.vw && b.t >= 0 && b.b <= r.vh, `${label}: tab ${TABS[i]} lies inside the viewport (${Math.round(b.l)}..${Math.round(b.r)} of ${r.vw}, ${Math.round(b.t)}..${Math.round(b.b)} of ${r.vh})`);
    check(b.l >= r.lr.l - 1 && b.r <= r.lr.r + 1 && b.t >= r.lr.t - 1, `${label}: tab ${TABS[i]} lies inside the ledger`);
    check(b.r - b.l >= 40 && b.b - b.t >= 28, `${label}: tab ${TABS[i]} is big enough to touch (${Math.round(b.r - b.l)}×${Math.round(b.b - b.t)})`);
    check(r.reachable[i], `${label}: tab ${TABS[i]} is not covered by anything`);
  });
  check(r.sw <= r.cw + 1, `${label}: the strip does not scroll sideways (${r.sw} in ${r.cw})`);
  const rows = new Set(r.boxes.map((b) => Math.round(b.t / 8))).size;
  check(rows <= 2, `${label}: at most two rows (${rows})`);
  return r;
}
/** Each tab opens when pressed, the active one looks different, and the red dot shows on Orders when an order is open. */
async function checkTabsWork(s, label, orderOpen) {
  const { p, check } = s;
  for (let i = 0; i < KEYS.length; i++) {
    await tab(s, KEYS[i]);
    await p.waitForTimeout(60);
    const on = await p.evaluate(() => [...document.querySelectorAll('.ledger .tab')].map((t) => t.getAttribute('aria-selected')));
    check(on.filter((x) => x === 'true').length === 1 && on[i] === 'true', `${label}: pressing ${TABS[i]} selects it (${on.join(',')})`);
  }
  const look = await p.evaluate(() => { const t = [...document.querySelectorAll('.ledger .tab')]; const on = t.find((x) => x.getAttribute('aria-selected') === 'true'); const off = t.find((x) => x !== on); const c = (e) => getComputedStyle(e).backgroundColor; return { on: c(on), off: c(off), dot: !!document.querySelector('.ledger .tab[data-tab="orders"] .dot'), dotColour: document.querySelector('.ledger .tab .dot') ? getComputedStyle(document.querySelector('.ledger .tab .dot')).backgroundColor : null }; });
  check(look.on !== look.off, `${label}: the active tab looks different from the others (${look.on} / ${look.off})`);
  if (orderOpen !== undefined) check(look.dot === orderOpen, `${label}: the red dot on Orders is ${orderOpen ? 'shown' : 'hidden'}`);
  if (look.dot) check(/^rgb\(1[34]\d, \d+, \d+\)$/.test(look.dotColour), `${label}: the dot is red (${look.dotColour})`);
  await tab(s, 'city');
}

// ---------- a hint card: where it is and what it says ----------
async function checkCard(s, id, label) {
  const { p, vp, check } = s;
  await p.waitForTimeout(450); // the card slides in
  const r = await p.evaluate(() => {
    const h = document.querySelector('.hint'), lg = document.querySelector('.ledger');
    const box = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
    const xs = [], ys = [];
    for (let i = 1; i < 10; i++) { xs.push(Math.round(innerWidth * i / 10)); ys.push(Math.round(innerHeight * i / 10)); }
    const x = h.querySelector('.card-x'), xb = x ? box(x) : null;
    const hb = h.getBoundingClientRect();
    const L = Math.min(hb.left, xb ? xb.l : Infinity), T = Math.min(hb.top, xb ? xb.t : Infinity), R = Math.max(hb.right, xb ? xb.r : -Infinity), B = Math.max(hb.bottom, xb ? xb.b : -Infinity);
    const pts = xs.flatMap((x) => ys.map((y) => [x, y]));
    const outside = pts.filter(([x, y]) => x < L - 2 || x > R + 2 || y < T - 2 || y > B + 2);
    const topWith = outside.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className || e.tagName) : null; });
    h.style.visibility = 'hidden';
    const topWithout = outside.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className || e.tagName) : null; });
    h.style.visibility = '';
    // every button on the screen that is not the ledger's, a card's or the globe's callout: the card must keep off them
    const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
    const union = (e) => { let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity; for (const n of [e, ...e.querySelectorAll('*')]) { if (!vis(n)) continue; const q = n.getBoundingClientRect(); if (!q.width || !q.height) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); } return { l, t, r, b }; };
    const furniture = [...document.querySelectorAll('#app button, #app [role=button]')].filter((e) => !e.closest('.hint, .ledger, .veil, .title, .callout, .toasts') && vis(e)).map((e) => ({ name: (e.className || e.getAttribute('aria-label') || e.tagName).toString(), ...union(e) }));
    return { id: h.dataset.hint, box: box(h), x: xb && { ...xb, label: x.getAttribute('aria-label'), reachable: (() => { const e = document.elementFromPoint((xb.l + xb.r) / 2, (xb.t + xb.b) / 2); return e === x || x.contains(e); })() },
      lg: box(lg), open: lg.dataset.open === 'true', vw: innerWidth, vh: innerHeight, parent: h.parentElement.id, pos: getComputedStyle(h).position,
      kick: h.querySelector('.kick').textContent, text: h.querySelector('p').textContent, buttons: [...h.querySelectorAll('.hint-actions button')].map((b) => b.textContent),
      tabs: [...document.querySelectorAll('.ledger .tab')].map(box), furniture, blocked: outside.filter((_, i) => topWith[i] !== topWithout[i]).length, globe: topWithout.filter((x) => x === 'globe').length, n: document.querySelectorAll('.hint').length };
  });
  const b = r.box;
  check(r.id === id, `${label}: ${id} is up (got ${r.id})`);
  check(r.n === 1, `${label}: one hint at a time (${r.n})`);
  check(/^Instructions to Agents Abroad · §[1-8]$/.test(r.kick), `${label}: the kicker reads "${r.kick}"`);
  check(JSON.stringify(r.buttons) === JSON.stringify(['No more hints', 'Understood']), `${label}: buttons ${r.buttons.join(' / ')}`);
  check(!!r.x && r.x.label === 'Close', `${label}: a Close button in the corner (${r.x?.label})`);
  if (r.x) {
    check(r.x.r - r.x.l >= 30 && r.x.b - r.x.t >= 30, `${label}: the Close button is big enough to touch (${Math.round(r.x.r - r.x.l)}×${Math.round(r.x.b - r.x.t)})`);
    check(r.x.l >= 0 && r.x.r <= r.vw && r.x.t >= 0 && r.x.b <= r.vh, `${label}: the Close button lies inside the screen (${Math.round(r.x.l)}..${Math.round(r.x.r)} of ${r.vw})`);
    check(r.x.reachable, `${label}: nothing covers the Close button`);
    check(r.x.r > b.r - 30 && r.x.t < b.t + 30, `${label}: the Close button sits on the top right corner`);
  }
  for (const f of r.furniture) check(f.r <= b.l + 2 || f.l >= b.r - 2 || f.b <= b.t + 2 || f.t >= b.b - 2, `${label}: the card covers the HUD's ${f.name} (${Math.round(f.l)}..${Math.round(f.r)} × ${Math.round(f.t)}..${Math.round(f.b)} against the card's ${Math.round(b.l)}..${Math.round(b.r)} × ${Math.round(b.t)}..${Math.round(b.b)})`);
  const words = r.text.trim().split(/\s+/).length;
  check(words <= 45 && words >= 20, `${label}: ${words} words`);
  check(r.parent === 'app' && r.pos === 'absolute', `${label}: a plain card in #app, not an overlay (${r.parent}, ${r.pos})`);
  check(b.l >= 8 && b.r <= r.vw - 8 && b.t >= 0 && b.b <= r.vh, `${label}: inside the screen (${Math.round(b.l)}..${Math.round(b.r)}, ${Math.round(b.t)}..${Math.round(b.b)} of ${r.vw}×${r.vh})`);
  check(b.w <= 421, `${label}: at most about 420 wide (${Math.round(b.w)})`);
  if (r.vw < 480) check(Math.abs(b.l - 16) <= 1.5 && Math.abs(r.vw - 16 - b.r) <= 1.5, `${label}: full width less 16 px gutters (${Math.round(b.l)}, ${Math.round(r.vw - b.r)})`);
  check(b.w * b.h <= .3 * r.vw * r.vh, `${label}: a small card (${Math.round(100 * b.w * b.h / (r.vw * r.vh))}% of the screen)`);
  check(b.b <= r.vh - 60, `${label}: above the corner buttons (bottom edge ${Math.round(r.vh - b.b)} px from the foot)`);
  if (r.open) {
    const clear = r.vw >= 900 ? b.r <= r.lg.l + 1 : b.b <= r.lg.t + 1;
    check(clear, `${label}: clear of the ledger`);
  }
  r.tabs.forEach((t, i) => check(b.r <= t.l || b.l >= t.r || b.b <= t.t || b.t >= t.b || !r.open, `${label}: does not cover the ${TABS[i]} tab`));
  check(r.blocked === 0, `${label}: it takes pointer events only inside its own box (${r.blocked} points outside it are intercepted)`);
  if (r.vh >= 700 || r.vw >= 900) check(r.globe >= 1, `${label}: the globe is still there to touch (${r.globe} sample points)`); // on a short phone with the ledger open, the HUD and the sheet leave a thin band of it
  await s.shot(`hint-${id}`);
  return r;
}
/** The card follows the ledger: beside or above it when it is open, above the HUD's corner furniture when it is shut. */
async function followsLedger(s, id) {
  const { p } = s;
  await checkCard(s, id, `${s.name} ledger open`);
  await p.evaluate(() => window.__shadow.ledger.setOpen(false));
  await p.waitForTimeout(700);
  await checkCard(s, id, `${s.name} ledger shut`);
  await s.shot('hint-ledger-shut');
  await p.evaluate(() => window.__shadow.ledger.setOpen(true));
  await p.waitForTimeout(700);
  await checkCard(s, id, `${s.name} ledger open again`);
}
async function noOverflow(s, label) {
  const o = await s.p.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, app: document.getElementById('app').scrollWidth - innerWidth }));
  s.check(o.doc <= 1 && o.app <= 1, `${label}: horizontal overflow (${o.doc}, ${o.app})`);
}

// ---------- scenario 1: the opening, hint by hint ----------
async function opening(name, vp, touch) {
  const s = await boot(name, vp, touch);
  await guard(s, () => openingPlay(s, name));
  return s;
}
async function openingPlay(s, name) {
  const { p, check } = s;
  await p.evaluate(() => window.__shadow.start('f', 7));
  // a card is up: no hint under it, however long it waits
  await p.waitForTimeout(1500);
  check((await p.locator('.veil:not([hidden])').count()) === 1, 'the first newspaper is up');
  check((await p.locator('.hint').count()) === 0, 'no hint under the first newspaper');
  await answer(s);
  await idle(s, 8000);
  await checkTabs(s, `${name} tabs`);
  await s.shot('tabs-city');
  await checkTabsWork(s, `${name} tabs`, false);
  // the first minutes are not talked over: nothing is due yet
  await p.waitForTimeout(2500);
  check((await p.locator('.hint').count()) === 0, 'a quiet start says nothing');
  await noOverflow(s, 'the start');

  // meeting the handler: the first person met. Acting before the hint is read makes it give way, and it is not counted as read
  await p.locator('[data-seek="ashby"]').click();
  await p.waitForTimeout(300);
  check((await p.locator('.hint').count()) === 0, 'no hint while the handler talks');
  check(await waitHint(s, 'people', 12000), 'a hint on people follows the first meeting');
  await p.locator('[data-activity="work"]').click();
  await p.waitForTimeout(500);
  check((await p.locator('.hint').count()) === 0, 'a hint gives way when the player acts');
  check((await seen(s)).people === undefined, 'a hint closed by an act within a second is not marked read');

  // the telegram arrives under the working day; the hint that follows is the order's
  check(await waitHint(s, 'orders', 40000), 'the order brings its hint, once the telegram is read');
  await checkCard(s, 'orders', `${name} orders`);
  check((await p.evaluate(() => document.querySelector('.ledger .tab[data-tab="orders"] .dot') !== null)), 'the red dot shows on Orders');
  await p.locator('.hint .hint-tab[data-tab="board"]').click(); // the link in the words opens the tab and counts as understood
  await p.waitForTimeout(250);
  check((await p.locator('.hint').count()) === 0, 'following the link closes the hint');
  check(await p.evaluate(() => window.__shadow.ledger.state.tab === 'board'), 'the link opened Trains');
  check((await seen(s)).orders > 0, 'orders is marked read, with the campaign minute');
  check(/Plan a route to/.test(await bodyText(s)), 'Trains offers "Plan a route to…", as the hint says');

  // the departures, the first time they are open
  check(await waitHint(s, 'trains', 9000), 'the departures bring their hint');
  await checkCard(s, 'trains', `${name} trains`);
  check(await p.evaluate(() => document.querySelectorAll('.dep .chip').length > 0 && /keeps time|often late|rarely on time/.test(document.querySelector('.dep .svc').textContent)), 'departures show labels and a punctuality line, as the hint says');
  await p.locator('.hint .hint-ok').click();
  await p.waitForTimeout(100);
  check((await p.locator('.hint').count()) === 0, '"Understood" closes the hint');

  // spare papers, before the first journey
  check(await waitHint(s, 'papers', 9000), 'a spare set of papers brings its hint before the first journey');
  await checkCard(s, 'papers', `${name} papers`);
  await p.locator('.hint .hint-tab[data-tab="covers"]').click();
  await p.waitForTimeout(250);
  check(/Leave here/.test(await bodyText(s)), 'Covers offers "Leave here", as the hint says');
  check(await p.locator('[data-stash]').first().isEnabled(), 'the spare papers can be left');
  await p.locator('[data-stash]').first().click();
  await p.waitForTimeout(250);
  check(/with the Bureau in London/.test(await bodyText(s)), 'left in London they are "with the Bureau in London"');

  // the person met comes round again: it was never read the first time
  check(await waitHint(s, 'people', 9000), 'the people hint comes back, for it was not read the first time');
  await checkCard(s, 'people', `${name} people`);
  await p.locator('.hint .hint-ok').click();
  await tab(s, 'people');
  check((await p.evaluate(() => document.querySelector('.ledger .body').innerHTML)).includes('class="trust"'), 'People shows trust as dots, as the hint says');
  await noOverflow(s, 'before the journey');

  // a journey by the book: pick Paris from the list, the second-class fare for the whole route
  await tab(s, 'board');
  await p.selectOption('select[data-plan]', 'PAR');
  await p.waitForTimeout(200);
  await p.locator('.fare[data-trip="0"]:not([disabled])').first().click();
  await p.waitForTimeout(200);
  check(await p.evaluate(() => !!window.__shadow.G.S.booked), 'a train is booked');
  check((await p.locator('.hint').count()) === 0, 'no hint with a train booked');
  await p.evaluate(() => window.__shadow.setSpeed(8));
  const landed = await until(s, () => { const S = window.__shadow.G.S; return !!S.city && !S.journey && !S.booked && S.stats.journeys >= 1; }, 60000);
  check(landed, 'the journey ends in a city');
  await p.evaluate(() => window.__shadow.setSpeed(1));
  await noOverflow(s, 'after the journey');

  // the first arrival
  check(await waitHint(s, 'arrival', 20000), 'arriving brings its hint');
  await checkCard(s, 'arrival', `${name} arrival`);
  await checkTabs(s, `${name} tabs with a hint up`);
  await tab(s, 'city');
  const cb = await bodyText(s);
  check(/Lodgings/.test(cb) && /your legend here/.test(cb), 'City shows Lodgings and "your legend here", as the hint says');
  await tab(s, 'covers');
  check(/Send for them by the bag/.test(await bodyText(s)), 'abroad, Covers offers "Send for them by the bag", as the hint says');
  await tab(s, 'city');
  await p.locator('.hint .hint-ok').click();

  // time spent in the city, a watch of the day at a time: the traces, then the days
  check(await spendUntilHint(s, 'traces', 3 * 60), 'a few hours in the city bring the hint on the traces left');
  await checkCard(s, 'traces', `${name} traces`);
  await p.locator('.hint .hint-tab[data-tab="dossier"]').click();
  await p.waitForTimeout(250);
  const ds = await p.evaluate(() => [...document.querySelectorAll('.ledger .subtabs button')].map((b) => b.textContent));
  check(JSON.stringify(ds) === JSON.stringify(['Known', 'Suspected', 'They know']), `the Dossier has Known, Suspected and They know (${ds.join(', ')})`);
  check(await spendUntilHint(s, 'days', 12 * 60), 'half a day in the city brings the hint on the days');
  await checkCard(s, 'days', `${name} days`);
  await tab(s, 'city');
  const cd = await bodyText(s);
  check(/Let the days pass/.test(cd) && /Keep to your rooms|Sleep/.test(cd), 'City offers "Let the days pass" and "Keep to your rooms" (by night "Sleep"), as the hint says');
  await p.locator('.hint .card-x').click(); // the corner X closes it like "Understood"
  await p.waitForTimeout(100);
  check((await p.locator('.hint').count()) === 0, 'the Close button closes the hint');
  check((await seen(s)).days > 0, 'and marks it read');

  // the departures again, after a frontier
  await tab(s, 'board');
  check(await waitHint(s, 'frontier', 9000), 'the departures, after a frontier, bring the hint on controls');
  await checkCard(s, 'frontier', `${name} frontier`);
  await p.locator('.hint .hint-ok').click();

  // and that is all: nothing returns
  await p.waitForTimeout(GAP + 2500);
  check((await p.locator('.hint').count()) === 0, 'nothing more is due, and nothing returns');
  const log = await p.evaluate(() => window.__hintLog);
  const order = log.filter((e) => e.ev === 'open').map((e) => e.id);
  check(JSON.stringify(order) === JSON.stringify(['people', 'orders', 'trains', 'papers', 'people', 'arrival', 'traces', 'days', 'frontier']), `the hints came in this order: ${order.join(', ')}${process.env.DEBUG ? ' ' + JSON.stringify(log.filter((e) => e.ev === 'close')) : ''}`);
  for (const id of new Set(order)) check(order.filter((x) => x === id).length === (id === 'people' ? 2 : 1), `'${id}' came ${order.filter((x) => x === id).length} times`);
  check((await p.evaluate(() => window.__hintMax)) === 1, 'never more than one card');
  // at least three seconds between one closing and the next opening
  log.forEach((e, i) => { if (e.ev !== 'open') return; const prev = log.slice(0, i).reverse().find((x) => x.ev === 'close'); if (prev) check(e.t - prev.t >= GAP - TOL, `${e.id} opened ${Math.round(e.t - prev.t)} ms after ${prev.id} closed`); });
  const sv = await seen(s);
  check(Object.keys(sv).sort().join() === ['orders', 'trains', 'papers', 'arrival', 'traces', 'days', 'frontier', 'people'].sort().join(), `all eight are marked read: ${Object.keys(sv).join(', ')}`);
  check(await p.evaluate(() => window.__shadow.G.S.hints.off === false), 'hints are still on');
  if (!s.wired) check((await p.evaluate(() => window.__saves)) >= 8, 'every change was saved');
  await checkTabsWork(s, `${name} tabs with an order`, true);
  // a routine running: the card stays away, and it can be stopped, as the hint on the days says
  await idle(s, 20000);
  await tab(s, 'city');
  await p.locator('[data-pass="1"]').click();
  await p.waitForTimeout(300);
  check(/Stop the routine/.test(await bodyText(s)), 'City offers "Stop the routine" while the days pass');
  await p.locator('[data-do="stop"]').click();
  await p.waitForTimeout(200);
  check(!/Stop the routine/.test(await bodyText(s)), 'and it stops');
  await noOverflow(s, 'the end');
  await s.shot('end');
}

// ---------- scenario 2: "No more hints" ----------
async function silenced(name, vp, touch) {
  const s = await boot(`${name}-silenced`, vp, touch);
  await guard(s, () => silencedPlay(s));
  return s;
}
async function silencedPlay(s) {
  const { p, check } = s;
  await p.evaluate(() => window.__shadow.start('m', 11));
  await p.waitForTimeout(500);
  await answer(s);
  await idle(s, 8000);
  await p.locator('[data-seek="ashby"]').click();
  check(await waitHint(s, 'people', 12000), 'a hint comes after the first meeting');
  await followsLedger(s, 'people');
  await p.locator('.hint .hint-off').click();
  await p.waitForTimeout(200);
  check((await p.locator('.hint').count()) === 0, '"No more hints" closes the hint');
  check(await p.evaluate(() => window.__shadow.G.S.hints.off === true && window.__shadow.hints.enabled() === false), 'and switches them off in the campaign');
  check((await seen(s)).people > 0, 'the hint it closed is marked read');
  // work through the telegram, book, travel, arrive: not a word
  await p.locator('[data-activity="work"]').click();
  await idle(s, 30000);
  check(await p.evaluate(() => window.__shadow.G.S.ops['op-cable'].status === 'active'), 'the order is open');
  await p.waitForTimeout(GAP + 2500);
  check((await p.locator('.hint').count()) === 0, 'no hint for the order once they are off');
  await tab(s, 'board');
  await p.waitForTimeout(GAP + 2500);
  check((await p.locator('.hint').count()) === 0, 'no hint for the departures once they are off');
  await p.selectOption('select[data-plan]', 'PAR');
  await p.locator('.fare[data-trip="0"]:not([disabled])').first().click();
  await p.evaluate(() => window.__shadow.setSpeed(8));
  check(await until(s, () => { const S = window.__shadow.G.S; return !!S.city && !S.journey && !S.booked && S.stats.journeys >= 1; }, 60000), 'the journey ends in a city');
  await p.evaluate(() => window.__shadow.setSpeed(1));
  await idle(s, 15000);
  await p.waitForTimeout(GAP + 2500);
  check((await p.locator('.hint').count()) === 0, 'no hint on arrival once they are off');
  check((await opens(s)).length === 1, `only the one hint was ever shown (${(await opens(s)).join(', ')})`);
  // switched on again from outside (the About page's job): what is due comes back, what was read does not
  await p.evaluate(() => window.__shadow.hints.setEnabled(true));
  check(await waitHint(s, 'arrival', 8000), 'switching them on again brings back what is due');
  check((await opens(s)).filter((x) => x === 'people').length === 1, 'and not what was read');
  // reset forgets everything
  await p.evaluate(() => window.__shadow.hints.reset());
  await p.waitForTimeout(150);
  check((await p.locator('.hint').count()) === 0 && await p.evaluate(() => JSON.stringify(window.__shadow.G.S.hints) === '{"off":false,"seen":{}}'), 'reset closes the card and forgets what was read');
  check(await waitHint(s, 'arrival', 8000), 'and the hint comes round again');
  // and a save made before hints existed
  await p.evaluate(() => { delete window.__shadow.G.S.hints; });
  await p.locator('.hint .hint-ok').click();
  await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__shadow.G.S.hints?.seen?.arrival > 0), 'a save without a hints record gets one when a hint is read');
  await noOverflow(s, 'silenced');
}

// ---------- scenario 3: the strip alone, at other widths ----------
async function strips() {
  for (const [name, vp, touch] of [['narrow', { width: 320, height: 640 }, true], ['tablet', { width: 768, height: 1024 }, true], ['laptop', { width: 1024, height: 700 }, false]]) {
    const s = await boot(name, vp, touch);
    await guard(s, async () => {
      await s.p.evaluate(() => window.__shadow.start('f', 7));
      await s.p.waitForTimeout(400);
      await answer(s);
      await s.p.waitForTimeout(300);
      await s.p.evaluate(() => window.__shadow.ledger.show('city'));
      await s.p.waitForTimeout(600);
      await checkTabs(s, `${name} tabs`);
      await s.shot('tabs');
      await noOverflow(s, name);
      { // a hint at these sizes too
        await idle(s, 8000);
        await s.p.locator('[data-seek="ashby"]').click();
        s.check(await waitHint(s, 'people', 12000), `${name}: a hint comes after the first meeting`);
        await followsLedger(s, 'people');
        await noOverflow(s, `${name} with a card`);
      }
    });
    report(s);
    await s.ctx.close();
  }
}

function report(s) {
  console.log(`${s.name}${s.wired ? ' (hints wired in the page)' : ''}: ${s.errors.length ? s.errors.join(' | ') : 'no errors'}`);
  fails.push(...s.errors.map((e) => `${s.name}: ${e}`));
}
async function run(f, ...a) {
  const s = await f(...a);
  report(s);
  await s.ctx.close();
}

const PHONE = { width: 390, height: 844 }, DESKTOP = { width: 1440, height: 900 };
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null; // e.g. --only desktop,strips
const scenarios = [
  ['phone', () => run(opening, 'phone', PHONE, true)],
  ['desktop', () => run(opening, 'desktop', DESKTOP, false)],
  ['phone-silenced', () => run(silenced, 'phone', PHONE, true)],
  ['desktop-silenced', () => run(silenced, 'desktop', DESKTOP, false)],
  ['strips', () => strips()],
];
await Promise.all(scenarios.filter(([n]) => !only || only.includes(n)).map(([, f]) => f())); // independent pages, played side by side
await browser.close();
console.log(fails.length ? `\n${fails.length} failures` : '\nall good');
process.exit(fails.length ? 1 : 0);
