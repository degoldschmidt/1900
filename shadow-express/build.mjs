// Builds index.html (the published page) from game.html and land.json.
//   node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const page = readFileSync(dir + 'game.html', 'utf8');
const land = readFileSync(dir + 'land.json', 'utf8');
if (!page.includes('/*LAND*/null')) throw new Error('game.html has no /*LAND*/null placeholder');
const lo = readFileSync(dir + 'land-lo.json', 'utf8');
const out = page.replace('/*LAND*/null', land).replace('/*LANDLO*/null', lo);
writeFileSync(dir + 'index.html', out);
console.log(`index.html: ${(out.length / 1024).toFixed(0)} KB`);
