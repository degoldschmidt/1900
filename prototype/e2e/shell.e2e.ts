import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAMES, ROOT, distUrl, stubFonts, collectConsoleErrors, ARTIFACT_CSP } from './helpers.ts';

for (const game of GAMES) {
  test.describe(game.id, () => {
    test('opens from file:// with no console errors and only font requests', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const hosts = await stubFonts(page);
      await page.goto(distUrl(`${game.id}.html`));
      await expect(page.locator('h1')).toHaveText(game.title);
      expect(errors).toEqual([]);
      for (const h of hosts) expect(['fonts.googleapis.com', 'fonts.gstatic.com']).toContain(h);
    });

    test('runs under the artifact page rules without policy violations', async ({ page }) => {
      const html = readFileSync(join(ROOT, 'dist', `${game.id}.html`), 'utf8');
      await page.addInitScript(() => {
        (window as unknown as { __violations: string[] }).__violations = [];
        document.addEventListener('securitypolicyviolation', (e) => {
          (window as unknown as { __violations: string[] }).__violations.push(`${e.violatedDirective} ${e.blockedURI}`);
        });
      });
      await stubFonts(page);
      await page.route('https://artifact.test/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', headers: { 'content-security-policy': ARTIFACT_CSP }, body: html }));
      await page.goto(`https://artifact.test/${game.id}.html`);
      await expect(page.locator('h1')).toHaveText(game.title);
      const violations = await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
      expect(violations).toEqual([]);
    });

    test('still renders when browser storage is denied', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage denied'); } });
      });
      await stubFonts(page);
      await page.goto(distUrl(`${game.id}.html`));
      await expect(page.locator('h1')).toHaveText(game.title);
    });

    test('debug build loads too', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await stubFonts(page);
      await page.goto(distUrl(`${game.id}.debug.html`));
      await expect(page.locator('h1')).toHaveText(game.title);
      expect(errors).toEqual([]);
    });
  });
}
