/**
 * C07 mechanics preview (dist/c07-departure.preview.html), on the invented world:
 *  - a whole tutorial from file:// on a phone and as a published fragment under the artifact page
 *    rules on a desktop: start, plan and book, advance, arrive, take an act, reach the end, answer
 *    the questionnaire, read the autopsy; no console errors, no policy violations;
 *  - Copy save code and Paste a save code restore the same state hash (?test=1 hooks);
 *  - a save code made in Node replays in Chromium to the same hash (RULES.md T7, browser half);
 *  - a browser that refuses storage still plays; a kept game resumes;
 *  - screenshots of every main screen at 1280×800 and 390×844, light and dark, into
 *    test-results/c07-screens/ (git-ignored), each checked for horizontal page scroll.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, distUrl, stubFonts, collectConsoleErrors, ARTIFACT_CSP } from './helpers.ts';

const PREVIEW = 'c07-departure.preview.html';
const FRAGMENT = 'c07-departure.preview.artifact.html';
const SHOTS = join(ROOT, 'test-results', 'c07-screens');

interface NodeCodes { dataHash: string; codes: Record<'booked' | 'corlaine' | 'portAncel', { code: string; hash: string; processed: number }> }
let node: NodeCodes;

test.beforeAll(() => {
  if (!existsSync(join(ROOT, 'dist', PREVIEW)) || !existsSync(join(ROOT, 'dist', FRAGMENT))) {
    execFileSync(process.execPath, ['tools/make/bundle-game.ts', 'c07', '--preview'], { cwd: ROOT, stdio: 'pipe' });
  }
  node = JSON.parse(execFileSync(process.execPath, ['e2e/c07/node-save.ts'], { cwd: ROOT }).toString()) as NodeCodes;
});

type Hooks = { hash(): string; processed(): number; replay(code: string): { hash: string; processed: number }; save(): string };
const hashIn = (page: Page): Promise<string> => page.evaluate(() => (window as unknown as { __test: Hooks }).__test.hash());
const saveIn = (page: Page): Promise<string> => page.evaluate(() => (window as unknown as { __test: Hooks }).__test.save());
const replayIn = (page: Page, code: string): Promise<{ hash: string; processed: number }> =>
  page.evaluate((c) => (window as unknown as { __test: Hooks }).__test.replay(c), code);

/** The published fragment inside a skeleton like the publisher's, served with the artifact page rules. */
function artifactPage(): string {
  const fragment = readFileSync(join(ROOT, 'dist', FRAGMENT), 'utf8');
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>*{box-sizing:border-box}body{margin:0}</style></head><body>' + fragment + '</body></html>';
}

async function open(page: Page, mode: 'file' | 'artifact', query = '?test=1'): Promise<{ errors: string[]; hosts: string[]; violations: () => Promise<string[]> }> {
  const errors = collectConsoleErrors(page);
  await page.addInitScript(() => {
    (window as unknown as { __violations: string[] }).__violations = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __violations: string[] }).__violations.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  const hosts = await stubFonts(page);
  if (mode === 'artifact') {
    const body = artifactPage();
    await page.route('https://artifact.test/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', headers: { 'content-security-policy': ARTIFACT_CSP }, body }));
    await page.goto(`https://artifact.test/c07.html${query}`);
  } else {
    await page.goto(distUrl(PREVIEW) + query);
  }
  await expect(page.locator('h1')).toHaveText('The Departure');
  return { errors, hosts, violations: () => page.evaluate(() => (window as unknown as { __violations: string[] }).__violations) };
}

const isWide = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 960;
async function toDiary(page: Page): Promise<void> { if (!isWide(page)) await page.click('#tab-diary'); }
async function advance(page: Page, expectStop?: RegExp): Promise<void> {
  await toDiary(page);
  await page.click('#advance');
  const sheet = page.getByRole('dialog', { name: 'Before the next stop' });
  await expect(sheet).toBeVisible();
  if (expectStop) await expect(sheet.locator('li.stop')).toContainText(expectStop);
  await page.click('#advance-go');
  await expect(sheet).toBeHidden();
}
async function bookSuggested(page: Page, to: RegExp): Promise<void> {
  await page.click('#tab-plan');
  await expect(page.locator('#plan-to option:checked')).toHaveText(to);
  const opt = page.locator('.opt-default');
  await expect(opt).toHaveCount(1);
  await opt.locator('.btn-fare:not([disabled])').first().click();
}
async function addAct(page: Page, label: RegExp): Promise<void> {
  await page.click('#tab-town');
  const act = page.locator('li.act', { has: page.locator('.act-label', { hasText: label }) }).first();
  await act.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('.flash')).toContainText('Entered in the diary');
}

async function playTutorial(page: Page): Promise<void> {
  await page.click('#start-preview-tutorial');
  await expect(page.locator('.ticket-none')).toBeVisible();
  // Plan and book: the planner suggests the next meeting's town and the earliest safe train.
  await bookSuggested(page, /Corlaine/);
  await toDiary(page);
  const ticket = page.getByRole('region', { name: 'Booked departure' });
  await expect(ticket).toContainText('Corlaine');
  await expect(ticket.locator('#slack')).not.toHaveText('—');
  // Advance lists what will pass first, then arrives.
  await advance(page, /Arrival at Corlaine/);
  await expect(page.locator('.arr-place')).toHaveText('Corlaine');
  // An act: the first meeting, entered from the town page.
  await addAct(page, /^Meeting for the commission \(stage 1/);
  await toDiary(page);
  await expect(page.locator('.entry', { hasText: 'Meeting' })).toBeVisible();
  // On to Port-Ancel overnight, the second meeting, the end.
  await bookSuggested(page, /Port-Ancel/);
  await advance(page, /Arrival at Port-Ancel/);
  await expect(page.locator('.arr-place')).toContainText('Port-Ancel');
  await addAct(page, /^Meeting for the commission \(stage 2/);
  for (let i = 0; i < 6 && (await page.locator('#q-submit').count()) === 0; i++) {
    if (await page.locator('#to-questions').count()) { await page.click('#to-questions'); break; }
    await advance(page);
  }
  // Questionnaire, then the autopsy.
  await expect(page.locator('.quiz h2')).toHaveText('Delivered');
  await page.check('#q4-5');
  await page.fill('#q5-text', 'The night train was the right call.');
  await page.click('#q-submit');
  await expect(page.locator('.autopsy h2')).toHaveText('Autopsy');
  await expect(page.locator('#final-code-field')).not.toBeEmpty();
}

test.describe('c07 preview: a whole tutorial', () => {
  test('from file:// on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { errors, hosts, violations } = await open(page, 'file');
    await playTutorial(page);
    for (const h of hosts) expect(['fonts.googleapis.com', 'fonts.gstatic.com']).toContain(h);
    // The questionnaire answers travel in the save code.
    const code = await page.locator('#final-code-field').inputValue();
    const save = JSON.parse(Buffer.from(code, 'base64url').toString('utf8')) as { answers?: Record<string, unknown>; log: Array<{ cmd: { type: string; ui?: { source?: string; sinceArrivalMs?: number } } }> };
    expect(save.answers).toEqual({ q4: 5, q5: 'The night train was the right call.' });
    const books = save.log.filter((e) => e.cmd.type === 'book');
    expect(books.length).toBe(2);
    for (const b of books) { expect(b.cmd.ui?.source).toBe('default'); expect(typeof b.cmd.ui?.sinceArrivalMs).toBe('number'); }
    expect(errors).toEqual([]);
    expect(await violations()).toEqual([]);
  });

  test('as a published fragment under the artifact page rules, on a desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { errors, violations } = await open(page, 'artifact');
    await expect(page.locator('.banner')).toHaveText('Mechanics preview: an invented railway, not history');
    await playTutorial(page);
    expect(errors).toEqual([]);
    expect(await violations()).toEqual([]);
  });
});

test.describe('c07 preview: save codes', () => {
  test('copy and paste a save code restores the same state hash', async ({ page, context }) => {
    await grantClipboard(context);
    await page.setViewportSize({ width: 390, height: 844 });
    const { errors } = await open(page, 'file');
    await page.click('#start-preview-tutorial');
    await bookSuggested(page, /Corlaine/);
    await advance(page);
    await addAct(page, /^Meeting/);
    const before = await hashIn(page);
    await page.click('#tab-pocket');
    await page.click('#pocket-save');
    await page.click('#save-code-copy');
    await expect(page.locator('.copy-msg')).not.toBeEmpty();
    const code = await page.locator('#save-code').inputValue();
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    if (clip !== null && /Copied/.test(await page.locator('.copy-msg').innerText())) expect(clip).toBe(code);
    await page.click('#to-start');
    await page.fill('#paste-code', code);
    await page.click('#paste-restore');
    await expect(page.locator('.diary')).toBeVisible();
    expect(await hashIn(page)).toBe(before);
    // The browser kept it too: a reload offers Resume, which restores the same game.
    await page.reload();
    await page.click('#resume');
    expect(await hashIn(page)).toBe(before);
    expect(errors).toEqual([]);
  });

  test('a save code made in Node replays in the browser to the same hash (T7)', async ({ page }) => {
    const { errors } = await open(page, 'file');
    for (const name of ['booked', 'corlaine', 'portAncel'] as const) {
      const n = node.codes[name];
      expect(await replayIn(page, n.code)).toEqual({ hash: n.hash, processed: n.processed });
    }
    // And through the page itself: paste the Node code, play on, and Node agrees with the result.
    const n = node.codes.corlaine;
    await page.fill('#paste-code', n.code);
    await page.click('#paste-restore');
    expect(await hashIn(page)).toBe(n.hash);
    await advance(page);
    const browserCode = await saveIn(page);
    const replay = execFileSync(process.execPath, ['--input-type=module', '-e', REPLAY_IN_NODE, browserCode], { cwd: ROOT }).toString().trim();
    expect(replay).toBe(await hashIn(page));
    expect(errors).toEqual([]);
  });

  test('test hooks stay out of the page without ?test=1, and the inspector is never there', async ({ page }) => {
    await open(page, 'file', '');
    expect(await page.evaluate(() => '__test' in window)).toBe(false);
    await page.keyboard.press('Backquote');
    await expect(page.locator('#kit-inspector')).toHaveCount(0);
  });

  test('a browser that refuses storage still plays', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage denied'); } });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    const { errors } = await open(page, 'file');
    await expect(page.locator('#resume')).toHaveCount(0);
    await page.click('#start-preview-tutorial');
    await bookSuggested(page, /Corlaine/);
    await advance(page);
    await expect(page.locator('.arr-place')).toHaveText('Corlaine');
    await page.click('#tab-pocket');
    await page.click('#pocket-save');
    await expect(page.locator('.save .sec-note').first()).toContainText('would not keep it');
    await expect(page.locator('#save-code')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });

  test('a bad save code is refused in words', async ({ page }) => {
    const { errors } = await open(page, 'file');
    await page.fill('#paste-code', 'not a code!');
    await page.click('#paste-restore');
    await expect(page.locator('.paste .refusal')).toContainText('not a save code');
    expect(errors).toEqual([]);
  });
});

const REPLAY_IN_NODE = `
globalThis.__DEBUG__ = true; globalThis.__BUILD_ID__ = 'node'; globalThis.__PREVIEW__ = true;
const { readFileSync } = await import('node:fs');
const { Sim } = await import('./kit/src/sim/sim.ts');
const { decodeSave } = await import('./kit/src/sim/savecode.ts');
const { module } = await import('./games/c07-departure/src/game.ts');
const bundle = module.bundleFrom(JSON.parse(readFileSync('games/c07-departure/preview/world.bundle.json', 'utf8')));
const save = decodeSave(process.argv[1]);
const sim = new Sim(module.game, bundle, module.scenario(bundle, save.scenario, save.seed));
sim.replayLog(save.log, save.processed);
console.log(sim.hash());
`;

async function grantClipboard(context: BrowserContext): Promise<void> {
  try { await context.grantPermissions(['clipboard-read', 'clipboard-write']); } catch { /* not grantable here; the page falls back to selecting the field */ }
}

const VIEWPORTS = [
  { w: 1280, h: 800 },
  { w: 390, h: 844 },
] as const;

for (const vp of VIEWPORTS) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`screenshots of every main screen at ${vp.w}×${vp.h}, ${scheme}`, async ({ page }) => {
      test.setTimeout(120_000);
      mkdirSync(SHOTS, { recursive: true });
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      const { errors } = await open(page, 'file');
      const wide = vp.w >= 960;
      const shot = async (name: string): Promise<void> => {
        await page.screenshot({ path: join(SHOTS, `${name}-${vp.w}x${vp.h}-${scheme}.png`) });
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw, `${name}: no horizontal page scroll`).toBeLessThanOrEqual(vp.w);
      };
      await shot('start');
      // The booked state: the ticket pinned, slack showing.
      await page.fill('#paste-code', node.codes.booked.code);
      await page.click('#paste-restore');
      await expect(page.locator('#slack')).toBeVisible();
      if (!wide) await shot('diary');
      for (const [tab, name] of [['plan', 'planner'], ['board', 'board'], ['town', 'town']] as const) {
        await page.click(`#tab-${tab}`);
        await shot(name);
      }
      await page.click('#tab-town');
      // A citation opens on tap.
      const dagger = page.locator('.venues .dagger').first();
      await dagger.click();
      await expect(page.locator('.venues .cite.open .cite-pop').first()).toBeVisible();
      await shot('citation');
      await dagger.click();
      for (const s of ['pocket', 'letters', 'purse', 'shelf', 'trail', 'news', 'save', 'about'] as const) {
        await page.click('#tab-pocket');
        if (s !== 'pocket') await page.click(`#pocket-${s}`);
        await shot(s);
      }
      if (wide) await shot('diary');
      await toDiary(page);
      await page.click('#advance');
      await shot('advance');
      await page.click('#advance-go');
      await expect(page.locator('.arr-place')).toBeVisible();
      await shot('arrival');
      // The night journey booked from Corlaine: the ticket, then aboard.
      await page.click('#tab-pocket'); await page.click('#pocket-save'); await page.click('#to-start');
      await page.fill('#paste-code', node.codes.corlaine.code);
      await page.click('#paste-restore');
      await toDiary(page);
      await shot('diary-evening');
      // The end: questionnaire and autopsy.
      await page.click('#tab-pocket'); await page.click('#pocket-save'); await page.click('#to-start');
      await page.fill('#paste-code', node.codes.portAncel.code);
      await page.click('#paste-restore');
      await advance(page);
      await expect(page.locator('#q-submit')).toBeVisible();
      await shot('questions');
      await page.check('#q4-4');
      await page.click('#q-submit');
      await expect(page.locator('.autopsy')).toBeVisible();
      await shot('autopsy');
      expect(errors).toEqual([]);
    });
  }
}
