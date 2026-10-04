// Builds the single-page game: bundles src/ui/main.js (and everything it imports, data and art included) with esbuild,
// splices the bundle and src/ui/style.css into template.html.
//   node build.mjs            → build/dev.html (for testing)
//   node build.mjs --release  → index.html (the published page)
//   node build.mjs --out f    → write the page to f instead (parallel work uses its own file)
// Guards: no '</script' or '<!--' in the bundle, no hosts outside the allowlist, page ≤ 1.5 MB.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeIndexes } from './tools/indexes.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(ROOT, '../prototype/package.json'));
const esbuild = require('esbuild');
const release = process.argv.includes('--release');
const ALLOWED = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'www.w3.org'];
const LIMIT = 1.5 * 1024 * 1024;

writeIndexes();
const res = await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/ui/main.js')], bundle: true, format: 'iife', target: 'es2020',
  minify: release, legalComments: 'none', write: false, logLevel: 'error', loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': '"production"' },
});
const js = res.outputFiles[0].text;
// style.css first, then every other stylesheet in src/ui in name order (hud.css, hints.css, …)
const cssFiles = ['style.css', ...fs.readdirSync(path.join(ROOT, 'src/ui')).filter((f) => f.endsWith('.css') && f !== 'style.css').sort()];
const css = cssFiles.map((f) => fs.readFileSync(path.join(ROOT, 'src/ui', f), 'utf8')).join('\n');
const fail = (m) => { console.error(`build failed: ${m}`); process.exit(1); };
if (/<\/script/i.test(js)) fail('the bundle contains "</script"');
if (js.includes('<!--')) fail('the bundle contains "<!--"');
if (/<\/style/i.test(css)) fail('the stylesheet contains "</style"');
const tpl = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8');
for (const m of ['/*STYLE*/', '/*SCRIPT*/']) if (!tpl.includes(m)) fail(`template.html has no ${m}`);
// replacer functions, never strings: '$&' and '$$' in a minified bundle would be read as patterns
const page = tpl.replace('/*STYLE*/', () => css).replace('/*SCRIPT*/', () => js);
const hosts = new Set([...page.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase()));
const bad = [...hosts].filter((h) => !ALLOWED.includes(h));
if (bad.length) fail(`hosts outside the allowlist: ${bad.join(', ')}`);
if (page.length > LIMIT) { if (release) fail(`page is ${(page.length / 1024).toFixed(0)} KB, over ${LIMIT / 1024} KB`); else console.warn(`note: the dev page is ${(page.length / 1024).toFixed(0)} KB unminified; the limit applies to --release`); }
const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : release ? path.join(ROOT, 'index.html') : path.join(ROOT, 'build/dev.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`${path.relative(ROOT, out)}: ${(page.length / 1024).toFixed(0)} KB (script ${(js.length / 1024).toFixed(0)} KB, style ${(css.length / 1024).toFixed(0)} KB)`);
