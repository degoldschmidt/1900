/**
 * C07 mechanics preview (dist/c07-departure.preview.html), map first (Decision P-012), on the
 * invented world:
 *  - the whole tutorial through the map, from file:// on a phone and as a published fragment under
 *    the artifact page rules on a desktop: coach marks, tap a city, book, set off, the journey and
 *    its cards, arrival, a choice in town, the second journey with its change, delivered; the
 *    questionnaire and the map replay; no console errors, no policy violations;
 *  - Copy save code and Paste a save code restore the same state hash (?test=1 hooks);
 *  - a save code made in Node replays in Chromium to the same hash (RULES.md T7, browser half);
 *  - a browser that refuses storage still plays; a kept game resumes;
 *  - screenshots of the map, the city sheet, a journey with an event card, the pocket and the
 *    replay at 1280×800 and 390×844, light and dark, into test-results/c07-screens/ (git-ignored),
 *    each checked for horizontal page scroll.
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

const card = (page: Page) => page.locator('.card');

/** Answers the cards as they come (the primary button, or one named) until one of `until` is met. */
async function cards(page: Page, until: RegExp, pick: Record<string, RegExp> = {}): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    await expect(card(page)).toBeVisible({ timeout: 30_000 });
    const title = (await card(page).locator('.card-h').innerText()).trim();
    seen.push(title);
    const want = Object.entries(pick).find(([t]) => title.startsWith(t))?.[1];
    if (want) await card(page).getByRole('button', { name: want }).click();
    else await page.click('#card-primary');
    if (until.test(title)) return seen;
  }
  throw new Error(`no card ${until} among ${seen.join(', ')}`);
}

/** Taps a town on the map. */
const tapCity = (page: Page, id: string) => page.locator(`#city-${id}`).click();

async function playTutorial(page: Page, animated: boolean): Promise<void> {
  await page.click('#start-preview-tutorial');
  // Three coach marks: you, your goal, your city.
  await expect(page.locator('.coach')).toContainText('This is you');
  await page.click('#coach-next');
  await expect(page.locator('.coach')).toContainText('This is your goal');
  await page.click('#coach-next');
  await expect(page.locator('.coach')).toContainText('Tap your city');
  await page.click('#coach-next');
  // The city sheet: departures in plain words.
  await expect(page.locator('#sheet-h')).toHaveText('Aubrevaux');
  await expect(page.locator('.dep').first()).toContainText('12.20 to Corlaine');
  await expect(page.locator('#sheet')).not.toContainText('‰');
  await page.click('#sheet-close');
  await expect(page.locator('#goal-line')).toHaveText('Take the letter to Corlaine by Tuesday 19.00 — pays £5');
  // Tap the goal on the map, book the first journey, set off.
  await tapCity(page, 'SYN_C_COR');
  await expect(page.locator('#sheet-h')).toHaveText('Corlaine');
  await page.click('#book-0');
  await expect(page.locator('.ticket')).toContainText('12.20 to Corlaine');
  await expect(page.locator('#countdown')).toContainText('Your train leaves in');
  await page.click('#set-off');
  // Animated, the token runs along the line with the clock under a strip; reduced, it jumps.
  if (animated) await expect(page.locator('.strip')).toContainText('Corlaine');
  // The journey ends in an arrival card; step out into Corlaine.
  expect(await cards(page, /^Arrived in Corlaine/)).toContain('Arrived in Corlaine');
  await expect(page.locator('#sheet-h')).toHaveText('Corlaine');
  // In town: meet the contact.
  await page.click('#do-meet');
  await cards(page, /^Letter handed over/);
  await expect(page.locator('.pip-done')).toHaveCount(1);
  // On to Port-Ancel: the goal line opens its sheet; the journey changes at Aubrevaux overnight.
  await page.click('#goal-line');
  await expect(page.locator('#sheet-h')).toHaveText('Port-Ancel');
  await expect(page.locator('.dep').first().locator('.dep-meta')).toContainText('Aubrevaux, across town');
  await page.click('#book-0');
  await page.click('#set-off');
  const seen = await cards(page, /^Arrived in Port-Ancel/, { 'Change at': /Wait at the station|Carry on/ });
  expect(seen.some((t) => t.startsWith('Change at Aubrevaux'))).toBe(true);
  await page.click('#do-meet');
  await cards(page, /^Delivered/);
  // Questionnaire, then the replay.
  await expect(page.locator('#quiz-h')).toHaveText('Delivered');
  await page.check('#q4-5');
  await page.fill('#q5-text', 'The night train was the right call.');
  await page.click('#q-submit');
  await expect(page.locator('#replay-h')).toHaveText('Delivered');
  await expect(page.locator('.replay .rec').first()).toBeVisible();
  await expect(page.locator('.replay-route').first()).toBeVisible();
  await expect(page.locator('#final-code-field')).not.toBeEmpty();
}

test.describe('c07 preview: the tutorial through the map', () => {
  test('from file:// on a phone, with the journey animated', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const { errors, hosts, violations } = await open(page, 'file');
    await playTutorial(page, true);
    for (const h of hosts) expect(['fonts.googleapis.com', 'fonts.gstatic.com']).toContain(h);
    // The questionnaire answers travel in the save code; bookings carry where they were chosen.
    const code = await page.locator('#final-code-field').inputValue();
    const save = JSON.parse(Buffer.from(code, 'base64url').toString('utf8')) as { answers?: Record<string, unknown>; log: Array<{ cmd: { type: string; ui?: { source?: string; sinceArrivalMs?: number } } }> };
    expect(save.answers).toEqual({ q4: 5, q5: 'The night train was the right call.' });
    const books = save.log.filter((e) => e.cmd.type === 'book');
    expect(books.map((b) => b.cmd.ui?.source)).toEqual(['default', 'default']);
    for (const b of books) expect(typeof b.cmd.ui?.sinceArrivalMs).toBe('number');
    expect(errors).toEqual([]);
    expect(await violations()).toEqual([]);
  });

  test('as a published fragment under the artifact page rules, on a desktop', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { errors, violations } = await open(page, 'artifact');
    await expect(page.locator('.banner')).toHaveText('Mechanics preview: an invented railway, not history');
    await playTutorial(page, false);
    expect(errors).toEqual([]);
    expect(await violations()).toEqual([]);
  });
});

test.describe('c07 preview: save codes', () => {
  test('copy and paste a save code restores the same state hash', async ({ page, context }) => {
    await grantClipboard(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { errors } = await open(page, 'file');
    await page.click('#start-preview-tutorial');
    await page.click('#coach-skip');
    await tapCity(page, 'SYN_C_COR');
    await page.click('#book-0');
    await page.click('#set-off');
    await cards(page, /^Arrived/);
    await page.click('#do-meet');
    await cards(page, /^Letter handed over/);
    const before = await hashIn(page);
    await page.click('#open-pocket');
    await page.click('#save-code-copy');
    await expect(page.locator('.copy-msg')).not.toBeEmpty();
    const code = await page.locator('#save-code').inputValue();
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => null));
    if (clip !== null && /Copied/.test(await page.locator('.copy-msg').innerText())) expect(clip).toBe(code);
    await page.click('#to-start');
    await page.fill('#paste-code', code);
    await page.click('#paste-restore');
    await expect(page.locator('#goal-line')).toContainText('Port-Ancel');
    expect(await hashIn(page)).toBe(before);
    // The browser kept it too: a reload offers Resume, which restores the same game.
    await page.reload();
    await page.click('#resume');
    expect(await hashIn(page)).toBe(before);
    expect(errors).toEqual([]);
  });

  test('a save code made in Node replays in the browser to the same hash (T7)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { errors } = await open(page, 'file');
    for (const name of ['booked', 'corlaine', 'portAncel'] as const) {
      const n = node.codes[name];
      expect(await replayIn(page, n.code)).toEqual({ hash: n.hash, processed: n.processed });
    }
    // And through the page itself: paste the Node code, play on along the map, and Node agrees.
    const n = node.codes.corlaine;
    await page.fill('#paste-code', n.code);
    await page.click('#paste-restore');
    expect(await hashIn(page)).toBe(n.hash);
    await page.click('#set-off');
    await cards(page, /^Arrived in Port-Ancel/, { 'Change at': /Take a room/ });
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
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { errors } = await open(page, 'file');
    await expect(page.locator('#resume')).toHaveCount(0);
    await page.click('#start-preview-tutorial');
    await page.click('#coach-skip');
    await page.click('#open-here');
    await page.click('#book-0');
    await page.click('#set-off');
    await cards(page, /^Arrived in Corlaine/);
    await page.click('#open-pocket');
    await expect(page.locator('#pk-save-h + .sec-note')).toContainText('would not keep it');
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
    test(`screenshots of the map screens at ${vp.w}×${vp.h}, ${scheme}`, async ({ page }) => {
      test.setTimeout(120_000);
      mkdirSync(SHOTS, { recursive: true });
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      const { errors } = await open(page, 'file');
      const shot = async (name: string): Promise<void> => {
        await page.screenshot({ path: join(SHOTS, `${name}-${vp.w}x${vp.h}-${scheme}.png`) });
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw, `${name}: no horizontal page scroll`).toBeLessThanOrEqual(vp.w);
      };
      await shot('start');
      await page.click('#start-preview-tutorial');
      await shot('coach');
      await page.click('#coach-skip');
      await shot('map');
      await page.click('#open-here');
      await expect(page.locator('#sheet-h')).toHaveText('Aubrevaux');
      await shot('city-sheet');
      await tapCity(page, 'SYN_C_PAN');
      await expect(page.locator('#sheet-h')).toHaveText('Port-Ancel');
      await shot('journeys-to');
      await page.click('#sheet-close');
      await page.click('#open-pocket');
      await expect(page.locator('#pocket-h')).toBeVisible();
      await shot('pocket');
      await page.click('#close-pocket');
      // A booked state from Node; set off, and the change at Aubrevaux stops the clock with a card.
      await page.click('#open-pocket'); await page.click('#to-start');
      await page.fill('#paste-code', node.codes.corlaine.code);
      await page.click('#paste-restore');
      await page.click('#open-here');
      await expect(page.locator('.ticket')).toBeVisible();
      await shot('booked');
      await page.click('#set-off');
      await expect(card(page)).toBeVisible();
      await expect(card(page).locator('.card-h')).toHaveText('Change at Aubrevaux');
      await shot('journey-card');
      await cards(page, /^Arrived in Port-Ancel/);
      await page.click('#do-meet');
      await cards(page, /^Delivered/);
      await expect(page.locator('#q-submit')).toBeVisible();
      await shot('questions');
      await page.check('#q4-4');
      await page.click('#q-submit');
      await expect(page.locator('.replay')).toBeVisible();
      await shot('replay');
      expect(errors).toEqual([]);
    });
  }
}
