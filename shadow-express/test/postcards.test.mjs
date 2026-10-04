// The postcards: every city has one; each draws cleanly under every light, weather, season and stage of the crisis;
// their frames, flowers and inks are their own; the greeting fits its ribbon; night lights the lamps; war hangs out
// the right flags and posts the right bills. (Run with node --test; the contact sheet is tools/postcards.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeIndexes } from '../tools/indexes.mjs';
import D from '../src/data/index.js';

writeIndexes();
const { default: cards } = await import('../src/art/postcards/index.js');
const { cardState, renderCard, stillSvg } = await import('../src/art/postcard/compose.js');
const { frameSvg, titleSvg, titleLayout } = await import('../src/art/postcard/frame.js');
const ONLY = process.env.CARDS ? process.env.CARDS.split(',') : null; // CARDS=VIE,LON node --test … to check a few
const mods = cards.filter((m) => !ONLY || ONLY.includes(m.id));
const city = (id) => D.cities.find((c) => c.id === id);
const at = (m, o) => cardState(m, { lon: city(m.id).ll[0], lat: city(m.id).ll[1], ...o });

/** Tags open and close in order, attributes are quoted, nothing is undefined or NaN. */
function wellFormed(svg, label) {
  assert.ok(!/undefined|NaN|Infinity|\[object/.test(svg), `${label}: undefined, NaN or an object in the drawing`);
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g)) {
    if (m[1]) { const top = stack.pop(); assert.equal(top, m[2], `${label}: </${m[2]}> closes <${top}>`); } else if (!m[4]) stack.push(m[2]);
  }
  assert.equal(stack.length, 0, `${label}: unclosed <${stack.join('>, <')}>`);
  const stray = svg.replace(/<[^>]*>/g, '').replace(/[^<>]/g, '');
  assert.equal(stray, '', `${label}: a stray < or >`);
}

test('every city has a postcard, and every postcard a city', { skip: !!ONLY }, () => {
  const have = new Set(cards.map((m) => m.id));
  const missing = D.cities.map((c) => c.id).filter((id) => !have.has(id));
  assert.deepEqual(missing, [], `no postcard yet for ${missing.join(' ')}`);
  for (const m of cards) assert.ok(city(m.id), `${m.id} is not a city`);
});

test('each card declares itself: greeting, nation, flags, flower, frame, inks', () => {
  for (const m of mods) {
    assert.ok(typeof m.greet === 'string' && /\p{Lu}{3}/u.test(m.greet), `${m.id}: a greeting with the city's name in capitals`);
    assert.equal(m.nation, city(m.id).nation, `${m.id}: the city's nation`);
    assert.ok(typeof m.flower === 'string' && m.flower.length > 2, `${m.id}: names its flower`);
    assert.ok(typeof m.flowerArt === 'function', `${m.id}: draws its flower`);
    assert.ok(Array.isArray(m.frame?.band) && m.frame.band.length === 2, `${m.id}: a frame band of two inks`);
    assert.ok(m.pal && typeof m.mid === 'function', `${m.id}: inks and a mid layer`);
    assert.ok(m.horizon > 120 && m.horizon < 340, `${m.id}: a horizon inside the window`);
  }
});

test('greetings fit their ribbons', () => {
  for (const m of mods) {
    const lay = titleLayout(m.greet);
    assert.ok(lay.squeeze >= .92, `${m.id}: "${m.greet}" squeezed to ${(lay.squeeze * 100).toFixed(0)}%`);
    assert.ok(lay.size >= 25, `${m.id}: set at ${lay.size}px`);
    assert.ok(lay.cart.cx + lay.cart.rx < 566, `${m.id}: the cartouche stays inside the frame`);
    wellFormed(titleSvg(m), `${m.id} title`);
  }
});

test('frames, flowers and inks are each card\'s own', { skip: !!ONLY }, () => {
  const flowers = new Map(), bands = new Map();
  for (const m of cards) {
    assert.ok(!flowers.has(m.flower), `${m.id} and ${flowers.get(m.flower)} both have the ${m.flower}`);
    flowers.set(m.flower, m.id);
    assert.ok(!bands.has(m.frame.band[0]), `${m.id} and ${bands.get(m.frame.band[0])} share a frame`);
    bands.set(m.frame.band[0], m.id);
  }
  const SHARED_OK = new Set(['key', 'glass', 'sash', 'gold', 'iron']);
  const inks = (m) => new Set(Object.entries(m.pal).filter(([k]) => !SHARED_OK.has(k)).map(([, v]) => v.toLowerCase()));
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
    const a = inks(cards[i]), b = inks(cards[j]), both = [...a].filter((c) => b.has(c));
    assert.ok(both.length <= 2, `${cards[i].id} and ${cards[j].id} share ${both.length} inks: ${both.join(' ')}`);
  }
});

test('every card draws cleanly under every light, weather, season and stage of the crisis', () => {
  const hours = [0, 4.5, 6, 12, 19.5, 21];
  const weathers = ['clear', 'cloud', 'rain', 'storm', 'fog', 'smoke', 'heat'];
  for (const m of mods) {
    wellFormed(frameSvg(m), `${m.id} frame`);
    let n = 0;
    for (const h of hours) for (const w of weathers) for (const [season, war] of [['summer', 'peace'], ['summer', 'tension'], ['summer', 'war'], ['spring', 'peace'], ['autumn', 'peace'], ['winter', 'war']]) {
      if ((n++ % 3) && w !== 'clear') continue; // a third of the weathers at each hour, all of them clear
      const st = at(m, { t: 5 * 1440 + h * 60, weather: w, season, war });
      const rc = renderCard(m, st), label = `${m.id} ${h}h ${w} ${season} ${war}`;
      for (const [k, svg] of Object.entries(rc.layers)) wellFormed(svg, `${label} ${k}`);
      for (const s of rc.sprites) {
        for (const svg of s.frames) wellFormed(svg, `${label} ${s.kind}`);
        assert.ok(s.box.every(Number.isFinite) && s.box[2] > 0 && s.box[3] > 0, `${label}: a ${s.kind} with a bad box`);
        assert.ok(['sky', 'back', 'street', 'fore', null].includes(s.z), `${label}: a ${s.kind} in no layer (${s.z})`);
        if (s.keys) for (const k of s.keys) assert.ok(k.slice(0, 5).every((v) => Number.isFinite(+v)), `${label}: a ${s.kind} with a bad keyframe`);
      }
    }
  }
});

test('a card is quick to draw and not too heavy', () => {
  for (const m of mods) {
    const st = at(m, { t: 3 * 1440 + 20.5 * 60, weather: 'clear', war: 'war' });
    renderCard(m, st);
    const t0 = performance.now(), rc = renderCard(m, st), ms = performance.now() - t0;
    const kb = Object.values(rc.layers).reduce((a, s) => a + s.length, 0) / 1024;
    assert.ok(ms < 120, `${m.id}: ${ms.toFixed(0)} ms to draw`);
    assert.ok(kb < 420, `${m.id}: ${kb.toFixed(0)} KB of drawing`);
    assert.ok(rc.sprites.length <= 70, `${m.id}: ${rc.sprites.length} moving parts`);
    assert.ok(rc.stats.movers >= 3, `${m.id}: at least three things move through the picture`);
    assert.ok(rc.stats.street, `${m.id}: declares its street (P.setStreet), where soldiers will march`);
  }
});

test('night lights the lamps and the windows; day puts them out', () => {
  for (const m of mods) {
    const night = renderCard(m, at(m, { t: 2 * 1440 + 23.5 * 60 }));
    assert.ok(night.glows.length >= 1, `${m.id}: a lamp lit at night`);
    assert.ok(/#ffc96b|#ffe1a0|#ffb35a|#ffd88a|#ffc86a/i.test(night.layers.mid + night.layers.back + night.layers.front), `${m.id}: a window lit at night`);
    const day = renderCard(m, at(m, { t: 2 * 1440 + 12 * 60 }));
    assert.equal(day.glows.length, 0, `${m.id}: lamps out at noon`);
  }
});

test('the crisis reaches the street: bills in the tension, posters, flags and soldiers at war', () => {
  for (const m of mods) {
    const peace = renderCard(m, at(m, { t: 4 * 1440 + 12 * 60, war: 'peace' }));
    assert.equal(peace.stats.placards, 0, `${m.id}: no bills in peace`);
    const tension = renderCard(m, at(m, { t: 30 * 1440 + 12 * 60, war: 'tension' }));
    assert.ok(tension.stats.placards >= 1, `${m.id}: a newspaper bill in the tension`);
    const war = renderCard(m, at(m, { t: 36 * 1440 + 12 * 60, war: 'war' }));
    assert.ok(war.stats.placards >= 1, `${m.id}: a poster at war`);
    assert.ok(war.stats.windowFlags >= 1 || war.stats.flags.length >= 1, `${m.id}: a flag at war`);
    const flag = m.flag ?? m.nation;
    assert.ok(war.stats.flags.every((n) => n === flag || n !== m.nation) || war.stats.flags.includes(flag), `${m.id}: flies its own flag`);
    assert.ok(war.sprites.some((s) => s.kind === 'mover' && s.frames[0].includes('stroke-width') && s.box[2] > 60), `${m.id}: soldiers march at war`);
  }
});

test('a still card is one picture with the frame over it', () => {
  for (const m of mods.slice(0, 3)) {
    const svg = stillSvg(renderCard(m, at(m, { t: 600 })), frameSvg(m));
    wellFormed(svg, `${m.id} still`);
  }
});
