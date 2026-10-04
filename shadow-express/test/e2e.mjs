// Browser checks: boots from file:// with d3 served locally, plays a little, screenshots desktop and phone.
//   node test/e2e.mjs [--release] [--page file.html] [--shots dir]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const pageArg = args.indexOf('--page');
const page = pageArg >= 0 ? path.resolve(args[pageArg + 1]) : path.join(ROOT, args.includes('--release') ? 'index.html' : 'build/dev.html');
const shots = path.resolve(args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(ROOT, 'build/shots'));
const D3 = fs.readFileSync(process.env.D3_PATH || '/tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/game/d3-7.8.5/package/dist/d3.min.js', 'utf8');
fs.mkdirSync(shots, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${fs.readFileSync(page, 'utf8')}</body></html>`;
const wrapped = page.replace(/\.html$/, '') + '.e2e.html'; // next to the page it wraps, so parallel runs do not collide
fs.writeFileSync(wrapped, html);

const browser = await chromium.launch();
async function answer(p) { // click the first open choice on a visible card, then Continue if a result shows
  try {
    const b = p.locator('.veil:not([hidden]) .choice:not([disabled])').first();
    if (!(await b.isVisible({ timeout: 300 }).catch(() => false))) return false;
    await b.click({ timeout: 1500 });
    await p.waitForTimeout(150);
    const c = p.locator('#cardCont');
    if (await c.isVisible().catch(() => false)) await c.click({ timeout: 1500 });
    return true;
  } catch { return false; }
}
const fails = [];
for (const [name, vp, touch] of [['desktop', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (u.includes('cdnjs.cloudflare.com/ajax/libs/d3')) return r.fulfill({ body: D3, contentType: 'application/javascript' });
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    return r.abort();
  });
  await p.goto('file://' + wrapped);
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(shots, `${name}-0-title.png`) });
  await p.evaluate(() => window.__shadow.start('f', 7));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(shots, `${name}-1-start.png`) });
  // answer cards until none, then open the board and book the first train
  for (let i = 0; i < 8; i++) { if (!(await answer(p))) break; await p.waitForTimeout(200); }
  await p.screenshot({ path: path.join(shots, `${name}-2-city.png`) });
  await p.evaluate(() => { window.__shadow.ledger.show('board'); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(shots, `${name}-3-board.png`) });
  const fare = p.locator('.fare:not([disabled])').first();
  if (await fare.isVisible().catch(() => false)) { await fare.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(200); }
  await p.evaluate(() => window.__shadow.setSpeed(8));
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(250);
    if (await p.locator('.veil:not([hidden]) .choice').first().isVisible().catch(() => false)) { if (i % 5 === 0) await p.screenshot({ path: path.join(shots, `${name}-4-card-${i}.png`) }); await answer(p); }
    const S = await p.evaluate(() => ({ city: window.__shadow.G.S.city, j: !!window.__shadow.G.S.journey, b: !!window.__shadow.G.S.booked }));
    if (i === 8) await p.screenshot({ path: path.join(shots, `${name}-5-journey.png`) });
    if (S.city && !S.j && !S.b && i > 10) break;
  }
  await p.screenshot({ path: path.join(shots, `${name}-6-arrived.png`) });
  for (const tab of ['people', 'covers', 'dossier', 'orders', 'case']) { await p.evaluate((t) => window.__shadow.ledger.show(t), tab); await p.waitForTimeout(250); await p.screenshot({ path: path.join(shots, `${name}-7-${tab}.png`) }); }
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push('horizontal overflow');
  console.log(`${name}: ${errors.length ? errors.join(' | ') : 'no errors'}`);
  fails.push(...errors);
  await ctx.close();
}
// the creator, by real clicks: every step renders, choices stick, points cannot go negative, the hero reaches the game
for (const [name, vp, touch] of [['desktop', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (u.includes('cdnjs.cloudflare.com/ajax/libs/d3')) return r.fulfill({ body: D3, contentType: 'application/javascript' });
    if (/^(file|data|blob):/.test(u)) return r.continue();
    return r.abort();
  });
  await p.goto('file://' + wrapped);
  await p.waitForTimeout(600);
  const click = async (sel) => { await p.locator(sel).first().click({ timeout: 2000 }); await p.waitForTimeout(120); };
  const shot = async (k) => { await p.screenshot({ path: path.join(shots, `cr-${name}-${k}.png`) }); };
  const overflow = async (k) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) errors.push(`horizontal overflow on ${k}`); };
  await click('[data-new]');
  await p.locator('[data-f="first"]').fill('Hester');
  await p.locator('[data-f="first"]').dispatchEvent('change');
  await click('[data-sex="f"]');
  await click('[data-age="old"]');
  await shot('1-who'); await overflow('who');
  await click('[data-nav="1"]');
  await click('[data-bg="cleric"]');
  await click('[data-friend="novak"]');
  await shot('2-bg'); await overflow('bg');
  await click('[data-nav="1"]');
  for (let i = 0; i < 12; i++) { const b = p.locator('[data-inc="tradecraft"]:not([disabled])'); if (!(await b.count())) break; await b.first().click(); await p.waitForTimeout(60); }
  await shot('3-skills'); await overflow('skills');
  await click('[data-nav="1"]');
  await click('[data-trait="forgettable"]');
  await click('[data-trait="drink"]');
  await shot('4-char'); await overflow('char');
  await click('[data-nav="1"]');
  await click('[data-kit="skeleton-keys"]');
  await shot('5-kit'); await overflow('kit');
  await click('[data-nav="1"]');
  await shot('6-file'); await overflow('file');
  const left = await p.locator('.cr-go').isDisabled();
  if (left) errors.push('Accept disabled with a legal hero');
  await click('[data-go]');
  await p.waitForTimeout(900);
  const hero = await p.evaluate(() => window.__shadow.G?.S?.hero ?? null);
  if (!hero) errors.push('no game after the creator');
  else {
    if (hero.first !== 'Hester' || hero.sex !== 'f' || hero.background !== 'cleric' || hero.friend !== 'novak') errors.push(`hero lost choices: ${JSON.stringify({ f: hero.first, s: hero.sex, b: hero.background, fr: hero.friend })}`);
    if (!hero.traits.includes('forgettable') || !hero.traits.includes('drink') || !hero.kit.includes('skeleton-keys')) errors.push('traits or kit lost');
    if ((hero.skills.tradecraft ?? 0) < 1) errors.push('skill points did not stick');
  }
  await shot('7-city');
  console.log(`creator ${name}: ${errors.length ? errors.join(' | ') : 'no errors'}`);
  fails.push(...errors);
  await ctx.close();
}
// boots when storage throws; asks no other hosts
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await ctx.addInitScript(() => { for (const k of ['getItem', 'setItem', 'removeItem']) Storage.prototype[k] = () => { throw new Error('storage blocked'); }; });
  const p = await ctx.newPage();
  const errors = [], hosts = new Set();
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (/^https?:/.test(u)) hosts.add(new URL(u).host);
    if (u.includes('cdnjs.cloudflare.com/ajax/libs/d3')) return r.fulfill({ body: D3, contentType: 'application/javascript' });
    if (/^(file|data|blob):/.test(u)) return r.continue();
    return r.abort();
  });
  await p.goto('file://' + wrapped);
  await p.waitForTimeout(800);
  const titled = await p.locator('.title .card').isVisible().catch(() => false);
  await p.evaluate(() => window.__shadow.start('m', 5));
  await p.waitForTimeout(500);
  const bad = [...hosts].filter((h) => !['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(h));
  const ok = titled && !errors.length && !bad.length;
  console.log(`storage blocked: ${ok ? 'boots, no errors' : `title ${titled} · ${errors.join(' | ')}`}${bad.length ? ` · other hosts: ${bad.join(', ')}` : ''}`);
  if (!ok) fails.push('storage or hosts');
  await ctx.close();
}
await browser.close();
process.exit(fails.length ? 1 : 0);
