// node test/validate.mjs [--quiet] [--only prefix1,prefix2]
// Regenerates the indexes, loads every data file on its own (a broken file is reported, not fatal to the others),
// runs the validator, prints errors (and warnings unless --quiet). Exits 1 on any error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeIndexes } from '../tools/indexes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
writeIndexes();

const loadErrors = [];
async function load(rel) {
  try { return (await import(pathToFileURL(path.join(ROOT, rel)).href)).default; }
  catch (e) { loadErrors.push(`file:${rel}: cannot load: ${e.message.split('\n')[0]}`); return null; }
}
const D = {};
for (const k of ['nations', 'cities', 'lines', 'services', 'calendar', 'covers', 'people', 'hunters', 'items']) D[k] = (await load(`src/data/${k}.js`)) ?? [];
const dir = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.js') && f !== 'index.js').sort();
D.stories = [];
for (const f of dir('src/data/stories')) { const rows = await load(`src/data/stories/${f}`); if (Array.isArray(rows)) D.stories.push(...rows); else if (rows) loadErrors.push(`file:src/data/stories/${f}: must export an array`); }
D.ops = [];
for (const f of dir('src/data/ops')) { const op = await load(`src/data/ops/${f}`); if (op && !Array.isArray(op)) D.ops.push(op); else if (op) loadErrors.push(`file:src/data/ops/${f}: must export one op object`); }

const { validate } = await import('../src/core/schema.js');
const { errors, warnings, stats } = validate(D);
const keep = (m) => !only || only.some((p) => m.startsWith(p));
const E = [...loadErrors, ...errors].filter(keep), W = warnings.filter(keep);
if (!quiet) for (const w of W) console.log(`warning  ${w}`);
for (const e of E) console.log(`ERROR    ${e}`);
const s = stats;
console.log(`\n${s.cities} cities · ${s.lines} lines · ${s.services} services · ${s.calendar} calendar rows · ${s.covers} covers · ${s.people} people · ${s.hunters} hunters · ${s.items} items · ${s.ops} ops · ${s.stories} storylets`);
console.log(`storylets by place: ${JSON.stringify(s.byAt)} · choices ${s.choices} · words ${s.words} · later ${s.laters} · false intel ${s.falseIntel} · plants ${s.plants} · persistent share ${Math.round((s.persistShare || 0) * 100)}%`);
console.log(`${E.length} errors, ${W.length} warnings${only ? ` (only ${only.join(', ')})` : ''}`);
process.exit(E.length ? 1 : 0);
