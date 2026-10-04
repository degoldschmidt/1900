// Living postcards on the page. A card is four still pictures (sky, far city, city, foreground) rasterised once per
// light and cached, the frame (once per city), the greeting as live text, and between the pictures the parts that
// move: each a small image moved by CSS transforms alone, so the browser composites them without repainting.
//
// Every loop is locked to the page clock: a card mounted again (a new arrival card, the City tab redrawn) picks up
// each tram and cloud where it was. When the light changes the new card fades in over the old. Under reduced motion,
// and for the album's stills, nothing moves: each part rests where it would be at that moment.

import { cardState, renderCard, stillSvg } from '../art/postcard/compose.js';
import { frameSvg, titleSvg } from '../art/postcard/frame.js';
import cards from '../art/postcards/index.js';
import { rasterise } from './art.js';

const MODS = new Map(cards.map((m) => [m.id, m]));
export const hasPostcard = (id) => MODS.has(id);
export const postcardIds = () => [...MODS.keys()];

// ---------- caches ----------
const scenes = new Map(); // state key|scale → Promise<{ rc, urls }>
const framesC = new Map(); // id|scale → Promise<url>
const stills = new Map(); // key|w → Promise<url>
function lru(map, key, make, max, drop) {
  if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; }
  const v = make();
  map.set(key, v);
  while (map.size > max) { const [k, old] = map.entries().next().value; map.delete(k); old.then(drop, () => {}); }
  return v;
}
// a picture dropped from the cache may still be on its way into a card that asked for it: free it a minute later
const revoke = (u) => { if (typeof u === 'string' && u.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(u), 60000); };
/** A raster scale for a card shown w CSS pixels wide: sharp enough, never more than needed. */
const scaleFor = (w) => { const d = (w || 600) * (window.devicePixelRatio || 1) / 600; return d <= 1 ? 1 : d <= 1.25 ? 1.25 : d <= 1.5 ? 1.5 : 1.75; };

function scene(mod, st, scale) {
  return lru(scenes, `${st.key}|${scale}`, async () => {
    const rc = renderCard(mod, st);
    const urls = {};
    for (const k of ['sky', 'back', 'mid', 'front']) urls[k] = await rasterise(rc.layers[k], 600, 400, scale);
    return { rc, urls };
  }, 6, (v) => Object.values(v.urls).forEach(revoke));
}
const frameUrl = (mod, scale) => lru(framesC, `${mod.id}|${scale}`, () => rasterise(frameSvg(mod), 600, 400, scale), 8, revoke);

/** The state of a card from the game: the city's place, the day's weather, the city's nation at peace or war. */
export function postcardInput(G, cityId, t, weather) {
  const c = G.I.city.get(cityId);
  return { t, lon: c.ll[0], lat: c.ll[1], weather, war: G.W.state(c.nation, t) };
}

// ---------- motion ----------
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let mounts = 0;
/** Where a keyframed part is at phase p (0..1): its transform and opacity. */
function poseAt(keys, p) {
  const P = p * 100;
  let i = 0;
  while (i < keys.length - 1 && +keys[i + 1][0] <= P) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], span = +b[0] - +a[0], t = span > 0 ? Math.min(1, Math.max(0, (P - a[0]) / span)) : 0;
  const L = (k) => +a[k] + (+b[k] - +a[k]) * t;
  return { tf: `translate(${L(1).toFixed(2)}%,${L(2).toFixed(2)}%) scale(${L(3).toFixed(3)})`, op: L(4) };
}
function keyframes(name, keys) {
  return `@keyframes ${name}{${keys.map(([p, x, y, s, o, e]) => `${p}%{transform:translate(${x}%,${y}%) scale(${s});opacity:${o}${e ? `;animation-timing-function:${e}` : ''}}`).join('')}}`;
}
const imgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** A clock's hands at a campaign minute (in the city's own time). */
function setHands(el, t) {
  const m = (((t + +el.dataset.tz) % 720) + 720) % 720;
  el.children[0].style.transform = `rotate(${(m / 2).toFixed(1)}deg)`;
  el.children[1].style.transform = `rotate(${((m % 60) * 6).toFixed(1)}deg)`;
}
/** One moving part as elements, with its keyframes added to css. */
function part(rec, uid, n, css, now, still) {
  const el = document.createElement('div');
  if (rec.kind === 'hands') {
    el.className = 'pc-hands';
    el.dataset.tz = rec.tz;
    el.style.cssText = `left:${rec.box[0] / 6}%;top:${rec.box[1] / 4}%;width:${rec.box[2] / 6}%;height:${rec.box[3] / 4}%;--hc:${rec.c}`;
    el.innerHTML = '<i class="h"></i><i class="m"></i>';
    return el;
  }
  el.className = 'pc-s';
  const [x, y, w, h] = rec.inBox ?? [rec.box[0] / 6, rec.box[1] / 4, rec.box[2] / 6, rec.box[3] / 4];
  el.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%;transform-origin:${rec.origin[0]}% ${rec.origin[1]}%`;
  const phase = (((now + +rec.offset) % rec.dur) + rec.dur) % rec.dur;
  if (!still && (rec.spin || rec.keys)) { el.dataset.d = rec.dur; el.dataset.o = rec.offset; }
  if (rec.spin) {
    const deg = (phase / rec.dur) * 360 * rec.spin;
    el.style.transform = `rotate(${deg.toFixed(1)}deg)`;
    if (!still) el.style.animation = `pcspin ${rec.dur}s linear ${(-phase).toFixed(2)}s infinite${rec.spin < 0 ? ' reverse' : ''}`;
  } else if (rec.keys) {
    const pose = poseAt(rec.keys, phase / rec.dur);
    el.style.transform = pose.tf; el.style.opacity = pose.op.toFixed(2);
    if (!still) {
      const name = `pk${uid}_${n}`;
      css.push(keyframes(name, rec.keys));
      el.style.animation = `${name} ${rec.dur}s linear ${(-phase).toFixed(2)}s infinite`;
    }
  }
  let inner = el;
  if (rec.bob && !still) { inner = document.createElement('div'); inner.className = 'pc-b'; inner.dataset.d = rec.bob; inner.dataset.o = 0; inner.style.animation = `pcbob ${rec.bob}s ease-in-out ${(-(now % rec.bob)).toFixed(2)}s infinite alternate`; el.append(inner); }
  const nf = rec.frames.length, cycle = nf / (rec.fps || 1);
  rec.frames.forEach((svg, k) => {
    const img = document.createElement('img');
    img.alt = ''; img.decoding = 'async'; img.src = imgUrl(svg);
    if (nf > 1) {
      const fp = (now % cycle + cycle - k / rec.fps) % cycle;
      img.style.opacity = still ? (k ? '0' : '1') : (fp < 1 / rec.fps ? '1' : '0');
      if (!still) { img.style.animation = `pcf${nf} ${cycle.toFixed(3)}s step-end ${(-fp).toFixed(3)}s infinite`; img.dataset.d = cycle; img.dataset.o = (cycle - k / rec.fps).toFixed(4); }
    }
    inner.append(img);
  });
  for (const [j, c] of (rec.children ?? []).entries()) inner.append(part(c, uid, `${n}c${j}`, css, now, still));
  return el;
}

function weather(fx, glows, still) {
  const box = document.createElement('div');
  box.className = 'pc-fx';
  let h = '';
  if (fx.rain) h += `<i class="pc-rain${fx.snow ? ' snow' : ''}" style="opacity:${Math.min(1, .55 + fx.rain * .3)}"></i><i class="pc-rain far${fx.snow ? ' snow' : ''}"></i>`;
  if (fx.fog) h += `<i class="pc-fog" style="--fc:${fx.fog.color};opacity:${(.5 + fx.fog.amount * .6).toFixed(2)}"></i><i class="pc-fog two" style="--fc:${fx.fog.color};opacity:${(.4 + fx.fog.amount * .5).toFixed(2)}"></i>`;
  if (fx.storm) h += '<i class="pc-flash"></i>';
  if (fx.heat) h += '<i class="pc-heat"></i>';
  for (const g of glows) h += `<i class="pc-glow" style="left:${((g.x - g.r) / 6).toFixed(2)}%;top:${((g.y - g.r) / 4).toFixed(2)}%;width:${(g.r / 3).toFixed(2)}%;height:${(g.r / 2).toFixed(2)}%;opacity:${g.o};animation-duration:${(2.2 + (g.x * 7 % 13) / 6).toFixed(2)}s;animation-delay:-${(g.y % 3).toFixed(2)}s"></i>`;
  box.innerHTML = h;
  if (still) box.classList.add('still');
  return box;
}

/** A scene element for a rendered card: the four pictures and the parts that move between them. */
function sceneEl(sc, still, uid) {
  const el = document.createElement('div');
  el.className = 'pc-scene';
  const now = performance.now() / 1000, css = [];
  const at = { sky: 'sky', back: 'back', mid: 'street', front: 'fore' };
  sc.rc.sprites.forEach((r, i) => { r._n = i; });
  for (const layer of ['sky', 'back', 'mid', 'front']) {
    const img = document.createElement('img');
    img.className = 'pc-l'; img.alt = ''; img.src = sc.urls[layer] ?? '';
    el.append(img);
    const z = document.createElement('div');
    z.className = 'pc-z';
    for (const r of sc.rc.sprites) if (r.z === at[layer]) z.append(part(r, uid, r._n, css, now, still));
    if (z.childElementCount) el.append(z);
  }
  el.append(weather(sc.rc.fx, sc.rc.glows, still));
  if (css.length) { const s = document.createElement('style'); s.textContent = css.join(''); el.prepend(s); }
  return el;
}

/**
 * Mount a living postcard. input: { t, lon, lat, weather, season, war } (see postcardInput). o: { still (no motion),
 * width (CSS px the card will show at, for the raster scale) }. Returns { el, ready, update(input), destroy() }.
 */
export function postcard(id, input, o = {}) {
  const mod = MODS.get(id);
  const el = document.createElement('div');
  el.className = 'pc';
  if (!mod) return { el, ready: Promise.resolve(), update() {}, destroy() {} };
  const uid = `${++mounts}`;
  const still = () => !!o.still || reduced();
  el.innerHTML = `<div class="pc-scenes"></div><img class="pc-frame" alt=""><div class="pc-title">${titleSvg(mod)}</div>`;
  el.setAttribute('role', 'img');
  const scenesEl = el.firstChild, frameImg = el.children[1];
  let scale = scaleFor(o.width), cur = null, want = null, busy = false, dead = false, lastAt = 0, timer = null, lastInp = null;
  frameUrl(mod, scale).then((u) => { if (u && !dead) frameImg.src = u; });
  async function show(inp) {
    want = cardState(mod, inp); lastInp = inp;
    el.querySelectorAll('.pc-hands').forEach((h) => setHands(h, want.t));
    if (busy || dead || (cur && cur.key === want.key)) return;
    // while the days fly past, the light changes at most every two seconds
    const wait = lastAt + 2000 - performance.now();
    if (cur && wait > 0) { if (!timer) timer = setTimeout(() => { timer = null; if (!dead) show(lastInp); }, wait); return; }
    busy = true;
    try {
      const st = want, sc = await scene(mod, st, scale);
      if (dead) return;
      const next = sceneEl(sc, still(), `${uid}x${Math.round(performance.now())}`);
      const old = [...scenesEl.children];
      if (old.length && !still()) { next.classList.add('pc-in'); scenesEl.append(next); next.addEventListener('animationend', () => old.forEach((x) => x.remove()), { once: true }); setTimeout(() => old.forEach((x) => x.remove()), 2500); }
      else { old.forEach((x) => x.remove()); scenesEl.append(next); }
      cur = st; lastAt = performance.now();
      el.setAttribute('aria-label', `Postcard: ${mod.greet}`);
      el.querySelectorAll('.pc-hands').forEach((h) => setHands(h, st.t));
    } finally { busy = false; }
    if (!dead && want.key !== cur?.key) show(lastInp); // the light moved on while this one was drawn
  }
  const ready = show(input);
  return {
    el, ready, mod,
    update(inp) { return show(inp); },
    /** Put every part back in step with the page clock: after the card was hidden, or taken out and put back. */
    relock() {
      const now = performance.now() / 1000;
      for (const x of el.querySelectorAll('[data-d]')) { const d = +x.dataset.d, ph = (((now + +x.dataset.o) % d) + d) % d; x.style.animationDelay = `${(-ph).toFixed(3)}s`; }
    },
    destroy() { dead = true; clearTimeout(timer); el.remove(); },
  };
}

// stills are drawn one at a time when the page is idle, so a full album does not stall the game
const jobs = [];
let pumping = false;
function later(fn) { return new Promise((res) => { jobs.push([fn, res]); pump(); }); }
function pump() {
  if (pumping || !jobs.length) return;
  pumping = true;
  const idle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 30);
  idle(async () => { const [fn, res] = jobs.shift(); try { res(await fn()); } catch { res(null); } pumping = false; pump(); });
}

/**
 * Draw a card ahead of time (the destination of a journey, as it will be when the train gets in), so the arrival card
 * shows at once. width: the CSS pixels it will show at. Once per state; the work waits for an idle moment.
 */
const fetched = new Set();
export function prefetchPostcard(id, input, width) {
  const mod = MODS.get(id);
  if (!mod) return;
  const st = cardState(mod, input), scale = scaleFor(width), k = `${st.key}|${scale}`;
  if (fetched.has(k)) return;
  fetched.add(k);
  if (fetched.size > 40) fetched.delete(fetched.values().next().value);
  later(() => Promise.all([scene(mod, st, scale), frameUrl(mod, scale)]));
}

/** A still card as one picture (for the album): the scene with everything at rest, the frame; the greeting over it. */
export function postcardStill(id, input, width = 300) {
  const mod = MODS.get(id);
  const el = document.createElement('div');
  el.className = 'pc pc-still';
  if (!mod) return el;
  el.innerHTML = `<img class="pc-l" alt=""><div class="pc-title">${titleSvg(mod)}</div>`;
  const st = cardState(mod, input), scale = scaleFor(width);
  lru(stills, `${st.key}|${scale}`, () => later(() => rasterise(stillSvg(renderCard(mod, st), frameSvg(mod)), 600, 400, scale)), 40, revoke)
    .then((u) => { if (u) el.firstChild.src = u; });
  return el;
}
