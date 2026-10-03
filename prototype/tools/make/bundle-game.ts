/**
 * Builds each game into one self-contained HTML file (inline CSS, data and JS) that opens from
 * file:// and runs under the artifact page rules (inline scripts; fonts from Google Fonts only).
 *
 *   node tools/make/bundle-game.ts [c07|c01|c04|all]
 *
 * Writes dist/<game>.html (release), dist/<game>.debug.html (inspector, ?test=1 hooks) and
 * dist/<game>.artifact.html (release as a page fragment for publishing).
 */
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ROOT, resolveGames, type GameId } from './paths.ts';
import { sizeBudget } from '../check/size-budget.ts';
import { noSynthetic } from '../check/no-synthetic.ts';

interface Manifest { game: string; status: string; freezeTag?: string }

function gitHash(): string {
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim(); }
  catch { return 'nogit'; }
}

/** The compiled bundle if one exists, otherwise a placeholder that says the game awaits data. */
export function loadDataJson(game: GameId): string {
  const compiled = join(ROOT, 'build', 'data', `${game}.bundle.json`);
  if (existsSync(compiled)) return readFileSync(compiled, 'utf8');
  const manifest = JSON.parse(readFileSync(join(ROOT, 'games', game, 'data-manifest.json'), 'utf8')) as Manifest;
  const meta: Record<string, unknown> = { game, status: 'awaiting-data', synthetic: false, dataHash: 'none' };
  if (manifest.freezeTag) meta.freezeTag = manifest.freezeTag;
  return JSON.stringify({ meta });
}

export const escapeForScript = (s: string): string => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
export const escapeJson = (s: string): string => s.replace(/</g, '\\u003c');
export const escapeForStyle = (s: string): string => s.replace(/<\/style/gi, '<\\/style');

async function compileScript(game: GameId, debug: boolean, buildId: string): Promise<{ js: string; css: string }> {
  const res = await build({
    entryPoints: [join(ROOT, 'games', game, 'src', 'main.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    minify: !debug,
    sourcemap: false,
    jsx: 'automatic',
    jsxImportSource: 'preact',
    define: { __DEBUG__: debug ? 'true' : 'false', __BUILD_ID__: JSON.stringify(buildId) },
    write: false,
    outdir: join(ROOT, 'build', 'tmp', game),
    legalComments: 'none',
    charset: 'utf8',
    logLevel: 'silent',
  });
  let js = ''; let css = '';
  for (const f of res.outputFiles) {
    if (f.path.endsWith('.js')) js += f.text;
    else if (f.path.endsWith('.css')) css += f.text;
  }
  return { js, css };
}

export function fillTemplate(template: string, parts: { css: string; data: string; js: string; buildId: string }): string {
  // Function replacers so `$` sequences in the code are never treated as replacement patterns.
  return template
    .replace('<!--BUILD_ID-->', () => parts.buildId)
    .replace('<!--STYLE-->', () => escapeForStyle(parts.css))
    .replace('<!--DATA-->', () => escapeJson(parts.data))
    .replace('<!--SCRIPT-->', () => escapeForScript(parts.js));
}

/** Page fragment for publishing as an artifact: the title, font link and style first, then the body content. */
export function toFragment(html: string): string {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
  const keep = head.split('\n').filter((l) => !/<meta (charset|name="viewport")/.test(l)).join('\n').trim();
  return `${keep}\n${body.trim()}\n`;
}

export async function bundleGame(game: GameId): Promise<string[]> {
  const template = readFileSync(join(ROOT, 'games', game, 'index.html'), 'utf8');
  const data = loadDataJson(game);
  const dataHash = createHash('sha256').update(data).digest('hex').slice(0, 8);
  const buildId = `${gitHash()}-${dataHash}`;
  const out: string[] = [];
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  for (const debug of [false, true]) {
    const { js, css } = await compileScript(game, debug, buildId);
    const html = fillTemplate(template, { css, data, js, buildId });
    const name = debug ? `${game}.debug.html` : `${game}.html`;
    writeFileSync(join(ROOT, 'dist', name), html);
    out.push(name);
    if (!debug) {
      writeFileSync(join(ROOT, 'dist', `${game}.artifact.html`), toFragment(html));
      out.push(`${game}.artifact.html`);
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const games = resolveGames(process.argv.slice(2));
  for (const g of games) {
    const files = await bundleGame(g);
    console.log(`built ${g}: ${files.join(', ')}`);
  }
  let failed = false;
  for (const r of sizeBudget()) {
    if (r.level !== 'ok') console.log(`size ${r.level}: ${r.file} ${r.bytes} bytes`);
    if (r.level === 'fail') failed = true;
  }
  for (const p of noSynthetic()) { console.error(`no-synthetic: ${p}`); failed = true; }
  if (failed) process.exit(1);
}
