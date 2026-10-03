/**
 * Builds each game into one self-contained HTML file (inline CSS, data and JS) that opens from
 * file:// and runs under the artifact page rules (inline scripts; fonts from Google Fonts only).
 *
 *   node tools/make/bundle-game.ts [c07|c01|c04|all]        # release, debug and any preview pages
 *   node tools/make/bundle-game.ts c07 --preview             # the mechanics-preview pages only
 *
 * Writes dist/<game>.html (release), dist/<game>.debug.html (inspector, ?test=1 hooks) and
 * dist/<game>.artifact.html (release as a page fragment for publishing).
 *
 * A game with an invented preview world (games/<game>/preview/world.bundle.json; C07 only, Decision
 * P-006) also gets dist/<game>.preview.html and dist/<game>.preview.artifact.html: the world inlined,
 * built with `__PREVIEW__` so `loadFromDom` accepts its synthetic data, minified, without the
 * inspector but with the `?test=1` hooks. Release pages still refuse synthetic data.
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

export type BuildKind = 'release' | 'debug' | 'preview';

/** The invented preview world of a game, when it has one. */
export function previewWorldPath(game: GameId): string | null {
  const p = join(ROOT, 'games', game, 'preview', 'world.bundle.json');
  return existsSync(p) ? p : null;
}

async function compileScript(game: GameId, kind: BuildKind, buildId: string): Promise<{ js: string; css: string }> {
  const debug = kind === 'debug';
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
    define: { __DEBUG__: debug ? 'true' : 'false', __PREVIEW__: kind === 'preview' ? 'true' : 'false', __BUILD_ID__: JSON.stringify(buildId) },
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
  // The publisher supplies its own doctype, head and body; page metadata (charset, viewport,
  // build id) stays out, so the fragment starts with the title, the font link and the style.
  const keep = head.split('\n').filter((l) => !/^\s*<meta /.test(l)).join('\n').trim();
  return `${keep}\n${body.trim()}\n`;
}

const buildIdOf = (data: string, tag = ''): string => `${gitHash()}-${createHash('sha256').update(data).digest('hex').slice(0, 8)}${tag}`;

export async function bundleGame(game: GameId): Promise<string[]> {
  const template = readFileSync(join(ROOT, 'games', game, 'index.html'), 'utf8');
  const data = loadDataJson(game);
  const buildId = buildIdOf(data);
  const out: string[] = [];
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  for (const kind of ['release', 'debug'] as const) {
    const { js, css } = await compileScript(game, kind, buildId);
    const html = fillTemplate(template, { css, data, js, buildId });
    const name = kind === 'debug' ? `${game}.debug.html` : `${game}.html`;
    writeFileSync(join(ROOT, 'dist', name), html);
    out.push(name);
    if (kind === 'release') {
      writeFileSync(join(ROOT, 'dist', `${game}.artifact.html`), toFragment(html));
      out.push(`${game}.artifact.html`);
    }
  }
  return out;
}

/** The mechanics-preview pages of a game with an invented world; [] for a game without one. */
export async function bundlePreview(game: GameId): Promise<string[]> {
  const world = previewWorldPath(game);
  if (!world) return [];
  const template = readFileSync(join(ROOT, 'games', game, 'index.html'), 'utf8');
  // Re-serialised compactly: the page carries the same data in fewer bytes.
  const data = JSON.stringify(JSON.parse(readFileSync(world, 'utf8')));
  if ((JSON.parse(data) as { meta?: { synthetic?: boolean } }).meta?.synthetic !== true) throw new Error(`${world} is not marked synthetic`);
  const buildId = buildIdOf(data, '-preview');
  const { js, css } = await compileScript(game, 'preview', buildId);
  const html = fillTemplate(template, { css, data, js, buildId });
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  writeFileSync(join(ROOT, 'dist', `${game}.preview.html`), html);
  writeFileSync(join(ROOT, 'dist', `${game}.preview.artifact.html`), toFragment(html));
  return [`${game}.preview.html`, `${game}.preview.artifact.html`];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview');
  const games = resolveGames(args);
  for (const g of games) {
    const files = [...(previewOnly ? [] : await bundleGame(g)), ...await bundlePreview(g)];
    if (previewOnly && files.length === 0) throw new Error(`${g} has no preview world (games/${g}/preview/world.bundle.json)`);
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
