// Composes a city vignette: paper, the sky for the hour and weather, the city's own layer, night wash and lit windows,
// weather overlays, foxing and grain. Returns a complete SVG string (640×240) ready to rasterise once and cache.

import { makeKit, rng, INK, PAPER, SEPIA, WASH } from './kit.js';

export const W = 640, H = 240;
const f = (n) => Math.round(n * 10) / 10;

/** dawn day dusk night, from the local hour. */
export function phase(hour) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'dusk' : 'night';
}

function sky(k, ph, weather, seed) {
  const r = rng(seed);
  let s = '';
  // engraved sky: horizontal lines whose spacing grows toward the horizon; denser at night
  const top = { day: 1.6, dawn: 1.2, dusk: 1.1, night: .55 }[ph];
  let y = 2;
  while (y < 190) {
    const t = y / 190, gap = top * (1.4 + t * t * (ph === 'night' ? 4 : 9));
    const x0 = ph === 'night' ? -2 : r() * 40 - 30, x1 = ph === 'night' ? 642 : 640 - r() * 60;
    if (ph === 'night' || t < .55 || r() < .5) s += `<path d="M${f(x0)} ${f(y)}H${f(x1)}" stroke="${INK}" stroke-width="${f(ph === 'night' ? .75 - t * .25 : .55 - t * .25)}" opacity="${ph === 'night' ? .9 : .8}"/>`;
    y += gap + 1.2;
  }
  if (ph === 'night') {
    for (let i = 0; i < 40; i++) { const x = r() * 640, yy = r() * 120, z = .6 + r() * 1.2; s += `<path d="M${f(x - z)} ${f(yy)}h${f(2 * z)}M${f(x)} ${f(yy - z)}v${f(2 * z)}" stroke="${PAPER}" stroke-width="${f(z * .6)}"/>`; }
    const mx = 470 + r() * 110, my = 32 + r() * 22;
    s += `<circle cx="${f(mx)}" cy="${f(my)}" r="13" fill="${PAPER}" stroke="${INK}" stroke-width=".8"/><path d="M${f(mx + 2)} ${f(my - 13)}a13 13 0 0 1 0 26a10 13 0 0 0 0 -26Z" fill="url(#dark-${k.uid})"/>`;
  }
  if (ph === 'dawn' || ph === 'dusk') {
    const sx = ph === 'dawn' ? 70 + r() * 90 : 470 + r() * 90, sy = 118;
    s += `<circle cx="${f(sx)}" cy="${sy}" r="22" fill="${PAPER}" stroke="${INK}" stroke-width=".9"/>`;
    for (let a = 190; a <= 350; a += 9) { const q = a * Math.PI / 180; s += `<path d="M${f(sx + Math.cos(q) * 28)} ${f(sy + Math.sin(q) * 28)}L${f(sx + Math.cos(q) * (50 + r() * 30))} ${f(sy + Math.sin(q) * (50 + r() * 30))}" stroke="${INK}" stroke-width=".5" opacity=".7"/>`; }
  }
  if (ph === 'day' && weather !== 'storm') {
    const sx = 80 + r() * 480;
    s += `<circle cx="${f(sx)}" cy="34" r="12" fill="${PAPER}" stroke="${INK}" stroke-width=".7"/>`;
    for (let a = 0; a < 360; a += 20) { const q = a * Math.PI / 180; s += `<path d="M${f(sx + Math.cos(q) * 16)} ${f(34 + Math.sin(q) * 16)}l${f(Math.cos(q) * 6)} ${f(Math.sin(q) * 6)}" stroke="${INK}" stroke-width=".6"/>`; }
  }
  const clouds = weather === 'cloud' || weather === 'rain' || weather === 'storm' ? 5 : ph === 'night' ? 1 : 2;
  for (let i = 0; i < clouds; i++) {
    const cx = r() * 620, cy = 26 + r() * 70, w = 60 + r() * 90, h = 14 + r() * 12;
    // a cumulus: paper billows outlined in ink, hatched only along the shaded underside
    const n = 4 + Math.floor(r() * 3);
    let d = `M${f(cx - w / 2)} ${f(cy)}`;
    for (let i = 0; i < n; i++) { const bw = w / n, bh = h * (.6 + r() * .7) * (1 - Math.abs(i - (n - 1) / 2) / n); d += `a${f(bw / 2)} ${f(bh)} 0 0 1 ${f(bw)} 0`; }
    d += `q${f(-w / 2)} ${f(h * .35)} ${f(-w)} 0Z`;
    const under = `M${f(cx - w * .45)} ${f(cy - 1)}q${f(w * .45)} ${f(h * .45)} ${f(w * .9)} 0q${f(-w * .45)} ${f(-h * .25)} ${f(-w * .9)} 0Z`;
    s += `<path d="${d}" fill="${weather === 'storm' || ph === 'night' ? `url(#dark-${k.uid})` : PAPER}" stroke="${INK}" stroke-width=".7"/><path d="${under}" fill="url(#mid-${k.uid})"/>`;
  }
  return s;
}

function weatherOver(weather, seed) {
  const r = rng(seed + 17);
  let s = '';
  if (weather === 'rain' || weather === 'storm') for (let i = 0; i < 160; i++) { const x = r() * 660 - 10, y = r() * 240; s += `<path d="M${f(x)} ${f(y)}l-4 11" stroke="${INK}" stroke-width=".5" opacity=".55"/>`; }
  if (weather === 'smoke') for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(r() * 640)}" cy="${f(60 + r() * 120)}" rx="${f(80 + r() * 90)}" ry="${f(10 + r() * 12)}" fill="${SEPIA}" opacity=".18"/>`;
  if (weather === 'fog') for (let i = 0; i < 5; i++) s += `<rect x="-10" y="${f(110 + i * 22 + r() * 8)}" width="660" height="${f(10 + r() * 8)}" fill="${PAPER}" opacity=".55"/>`;
  return s;
}

/** Foxing, grain and a darkened edge: the look of an old print. */
function paperOver(uid, seed) {
  const r = rng(seed + 31);
  let s = `<rect width="${W}" height="${H}" fill="url(#edge-${uid})"/>`;
  for (let i = 0; i < 7; i++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(2 + r() * 9)}" fill="${SEPIA}" opacity="${f(.06 + r() * .1)}"/>`;
  s += `<rect width="${W}" height="${H}" filter="url(#grain-${uid})" opacity=".3"/>`;
  return s;
}

/**
 * The whole scene for a city module ({ id, draw(kit, opts) }) at an hour and weather.
 * weather: clear cloud rain storm smoke fog.
 */
export function renderScene(city, { hour = 12, weather = 'clear', uid = 'v', seed = 1 } = {}) {
  const k = makeKit({ uid, seed });
  const ph = phase(hour);
  const layer = city.draw(k, { hour, phase: ph, weather, night: ph === 'night' });
  let lights = '';
  if (ph === 'night' || ph === 'dusk') {
    const glow = ph === 'night' ? .95 : .55;
    for (const [x, y, w, h] of k.lights) lights += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f4d58d" opacity="${glow}"/>`;
  }
  const wash = ph === 'night' ? `<rect width="${W}" height="${H}" fill="${WASH}" opacity=".5" style="mix-blend-mode:multiply"/>`
    : ph === 'dusk' || ph === 'dawn' ? `<rect width="${W}" height="${H}" fill="${SEPIA}" opacity=".22" style="mix-blend-mode:multiply"/>` : '';
  const defs = k.defs()
    + `<radialGradient id="edge-${uid}" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="${SEPIA}" stop-opacity="0"/><stop offset="100%" stop-color="${SEPIA}" stop-opacity=".62"/></radialGradient>`
    + `<filter id="grain-${uid}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="${seed}"/><feColorMatrix values="0 0 0 0 .17  0 0 0 0 .11  0 0 0 0 .07  0 0 0 -2.2 1.25"/></filter>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs}</defs>`
    + `<rect width="${W}" height="${H}" fill="${PAPER}"/>${sky(k, ph, weather, seed)}`
    + `<g filter="url(#rough-${uid})">${layer}</g>${wash}${lights}${weatherOver(weather, seed)}${paperOver(uid, seed)}</svg>`;
}
