/**
 * Cross-engine determinism and the debug tooling, on synthetic data:
 *  - the kit digest (routing, itineraries, hunter, draws, money, calendars) is identical in Node and Chromium;
 *  - a save code made in Node replays in the browser to the same state hash, and vice versa;
 *  - the inspector opens, and its replay check from snapshots reports a match.
 */
import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { buildLab, LAB_HTML } from './lab/build-lab.ts';
import { collectConsoleErrors, ARTIFACT_CSP } from './helpers.ts';
import { readFileSync } from 'node:fs';

(globalThis as unknown as { __DEBUG__: boolean }).__DEBUG__ = true;

const labUrl = (q = '') => pathToFileURL(LAB_HTML).href + q;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => { await buildLab(); });

test('the kit digest is identical in Node and in Chromium', async ({ page }) => {
  const { kitDigest } = await import('./lab/digest.ts');
  const node = kitDigest();
  await page.goto(labUrl());
  const browser = await page.evaluate(() => (window as unknown as { __lab: { kitDigest(): Record<string, string> } }).__lab.kitDigest());
  expect(browser).toEqual(node);
});

test('a save code replays to the same hash in Node and in the browser', async ({ page }) => {
  const { Sim } = await import('../kit/src/sim/sim.ts');
  const { saveCodeOf } = await import('../kit/src/devtools/model.ts');
  const { decodeSave } = await import('../kit/src/sim/savecode.ts');
  const { toyModule, toyRaw } = await import('../kit/test/fixtures/toy-module.ts');
  const { instantOf } = await import('../kit/src/time/instant.ts');
  const { D0 } = await import('../kit/test/fixtures/toy-game.ts');
  const bundle = toyModule.bundleFrom(toyRaw);
  const sim = new Sim(toyModule.game, bundle, toyModule.scenario(bundle, 'toy-1', 9));
  sim.command({ type: 'subscribe', reader: 'SYN_hunter' });
  sim.command({ type: 'move', to: 'SYN_D', hours: 7 });
  sim.advanceTo(instantOf(D0 + 5, 0));
  sim.command({ type: 'move', to: 'SYN_B', hours: 26 });
  sim.advanceTo(instantOf(D0 + 12, 0));
  const code = saveCodeOf(sim, 'lab', toyRaw.meta.dataHash);

  await page.goto(labUrl('?test=1'));
  type Hooks = { replay(c: string): { hash: string; processed: number }; save(): string; hash(): string; step(n: number): number };
  const res = await page.evaluate((c) => (window as unknown as { __test: Hooks }).__test.replay(c), code);
  expect(res).toEqual({ hash: sim.hash(), processed: sim.processed });

  // And the other way: play in the browser, replay in Node.
  await page.getByRole('button', { name: 'Subscribe hunter' }).click();
  await page.getByRole('button', { name: 'Move to B' }).click();
  await page.getByRole('button', { name: 'Run 25 events' }).click();
  const browserCode = await page.evaluate(() => (window as unknown as { __test: Hooks }).__test.save());
  const browserHash = await page.evaluate(() => (window as unknown as { __test: Hooks }).__test.hash());
  const save = decodeSave<import('../kit/test/fixtures/toy-game.ts').ToyCmd>(browserCode);
  const again = new Sim(toyModule.game, bundle, toyModule.scenario(bundle, save.scenario, save.seed));
  again.replayLog(save.log, save.processed);
  expect(again.hash()).toBe(browserHash);
});

test('test hooks are absent without ?test=1', async ({ page }) => {
  await page.goto(labUrl());
  expect(await page.evaluate(() => '__test' in window)).toBe(false);
});

test('the inspector opens, shows the views and its replay check matches', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto(labUrl());
  await page.getByRole('button', { name: 'Subscribe hunter' }).click();
  await page.getByRole('button', { name: 'Move to B' }).click();
  await page.getByRole('button', { name: 'Run 25 events' }).click();
  await page.keyboard.press('Backquote');
  const panel = page.getByRole('dialog', { name: 'Simulation inspector' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Hash and check replay' }).click();
  await expect(panel.locator('li.ok').first()).toBeVisible();
  await expect(panel.locator('li.bad')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Queue' }).click();
  await expect(panel.locator('tbody tr').first()).toBeVisible();
  await panel.getByRole('button', { name: 'Records' }).click();
  await panel.locator('select').selectOption('SYN_hunter');
  await expect(panel.locator('th', { hasText: 'arrives' })).toBeVisible();
  await panel.getByRole('button', { name: 'Step', exact: true }).click();
  await panel.getByRole('button', { name: 'Save' }).click();
  await expect(panel.locator('textarea')).not.toBeEmpty();
  await panel.getByRole('button', { name: 'Close inspector' }).click();
  await expect(panel).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press('Backquote');
  await expect(panel).toBeVisible();
  expect(errors).toEqual([]);
});

test('the lab and inspector run under the artifact page rules', async ({ page }) => {
  const html = readFileSync(LAB_HTML, 'utf8');
  await page.addInitScript(() => {
    (window as unknown as { __v: string[] }).__v = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __v: string[] }).__v.push(e.violatedDirective));
  });
  await page.route('https://artifact.test/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', headers: { 'content-security-policy': ARTIFACT_CSP }, body: html }));
  await page.goto('https://artifact.test/lab.html');
  await page.keyboard.press('Backquote');
  await expect(page.getByRole('dialog', { name: 'Simulation inspector' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __v: string[] }).__v)).toEqual([]);
});
