import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const GAMES = [
  { id: 'c07-departure', title: 'The Departure' },
  { id: 'c01-masters', title: 'Several Masters' },
  { id: 'c04-legends', title: 'The Legend Portfolio' },
] as const;

export const distUrl = (file: string): string => pathToFileURL(join(ROOT, 'dist', file)).href;

/**
 * Approximation of the artifact page rules: inline scripts and styles; external scripts only from
 * the listed CDNs; stylesheets only from Google Fonts; no network connections from scripts.
 */
export const ARTIFACT_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.tailwindcss.com https://code.jquery.com",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  'img-src data: blob:',
  "connect-src 'none'",
].join('; ');

/** Serves Google Fonts requests locally (empty CSS) so tests never depend on the network, and records every request host. */
export async function stubFonts(page: Page): Promise<string[]> {
  const hosts: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http')) hosts.push(u.host); });
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ status: 404, body: '' }));
  return hosts;
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
