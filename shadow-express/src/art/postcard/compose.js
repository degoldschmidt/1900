// A postcard at a moment: the city's module drawn under the light of that hour, weather and season, dressed for the
// crisis, and split into what is still (four pictures: sky, the far city, the city, the foreground) and what moves
// (clouds, traffic, people, smoke, flags, glints, swifts; rain and fog; the glow of the lamps).
//
// Nothing here touches the page: the result is strings and numbers, so the same cards render in Node for the tests
// and the contact sheet. src/ui/postcard.js puts them on the page.

import { makePaint, WIN, CW, CH, f, rng } from './paint.js';
import { makeSprites } from './sprites.js';
import { lightAt, sunStep, summerAt } from './light.js';
import { mix, lit } from './color.js';

export const seedOf = (id) => [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 9973;
const doc = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
export const Z = ['sky', 'back', 'street', 'fore'];

/**
 * What decides a card's look at a moment, with the key it is cached under. t: campaign minutes; lon, lat: the city;
 * weather: clear cloud rain storm fog smoke heat; season: summer (follows the campaign) spring autumn winter;
 * war: peace tension war (the city's nation, at t).
 */
export function cardState(mod, { t = 720, lon = 15, lat = 48, weather = 'clear', season = 'summer', progress = null, war = 'peace' } = {}) {
  const sun = sunStep(t, lon, lat);
  const pq = season === 'summer' ? Math.round((progress ?? summerAt(t)) * 5) / 5 : 0;
  return { id: mod.id, t, lat, sun, weather, season, progress: pq, war, day: Math.floor(t / 1440), key: `${mod.id}|${sun.key}|${weather}|${season}|${pq}|${war}` };
}

/** Draw a card. Returns { key, L, layers: { sky back mid front } (SVG strings), sprites (records), fx, glows }. */
export function renderCard(mod, st) {
  const L = lightAt({ t: st.t, lat: st.lat ?? 48, weather: st.weather, season: st.season, progress: st.progress, sun: st.sun });
  const seed = seedOf(mod.id);
  const P = makePaint({ pal: mod.pal, L, seed, uid: mod.id.toLowerCase(), war: st.war, nation: mod.nation, flag: mod.flag, bills: mod.bills });
  P.st = st;
  const T = makeSprites(P);
  const layer = (name, fn) => { P.layer = name; P.depth = 0; return fn ? fn.call(mod, P, T, st) ?? '' : ''; };
  const sky = skyLayer(P, mod);
  const back = layer('back', mod.back), mid = layer('mid', mod.mid), front = layer('front', mod.front);
  const sprites = living(P, T, mod, st);
  const glows = L.lamps > .05 ? P.glows.map((g) => ({ x: g.x, y: g.y, r: g.r, o: f(Math.min(1, L.lamps) * (1 - (g.depth ?? 0) * .5)) })) : [];
  const stats = { placards: P._placards, windowFlags: P._wflags, flags: P.sprites.filter((g) => g.kind === 'flag').map((g) => g.nation), movers: P.sprites.filter((g) => g.kind === 'mover').length, lamps: P.glows.length, street: !!P.street };
  return { key: st.key, t: st.t, L, layers: { sky: doc(sky), back: doc(back), mid: doc(mid), front: doc(front) }, sprites, fx: fxOf(L, mod), glows, stats };
}

// ---------- the sky ----------
function skyLayer(P, mod) {
  const L = P.L, hz = mod.horizon ?? 250, u = P.uid, r = rng(seedOf(mod.id) + 17);
  let defs = `<linearGradient id="${u}sk" gradientUnits="userSpaceOnUse" x1="0" y1="${WIN.y}" x2="0" y2="${hz}"><stop offset="0" stop-color="${L.sky.top}"/><stop offset=".55" stop-color="${L.sky.mid}"/><stop offset="1" stop-color="${L.sky.low}"/></linearGradient>`;
  let s = `<rect width="${CW}" height="${CH}" fill="${L.sky.low}"/><rect width="${CW}" height="${f(hz)}" fill="url(#${u}sk)"/>`;
  // stars, then the moon
  if (L.stars > .02) for (let i = 0; i < 70; i++) { const x = WIN.x + r() * WIN.w, y = WIN.y + r() * (hz - WIN.y - 50), q = r(); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.35 + q * .8)}" fill="#fff6dc" opacity="${f(L.stars * (.35 + q * .65))}"/>`; }
  if (L.moon.show) {
    const mx = WIN.x + WIN.w * (.62 + r() * .2), my = WIN.y + 46 + r() * 30, mr = 9, a = L.moon.age, lf = (1 - Math.cos(a * Math.PI * 2)) / 2;
    defs += `<radialGradient id="${u}mg"><stop offset="0" stop-color="#fff4d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff4d0" stop-opacity="0"/></radialGradient>`;
    if (lf > .04) {
      // the lit part: one half of the disc and the terminator, an ellipse whose width follows the phase
      const k = Math.abs(Math.cos(a * Math.PI * 2)), waxing = a < .5, thin = lf < .5, top = `${f(mx)} ${f(my - mr)}`, bot = `${f(mx)} ${f(my + mr)}`;
      const d = waxing ? `M${top}A${mr} ${mr} 0 0 1 ${bot}A${f(mr * k)} ${mr} 0 0 ${thin ? 0 : 1} ${top}Z` : `M${top}A${mr} ${mr} 0 0 0 ${bot}A${f(mr * k)} ${mr} 0 0 ${thin ? 1 : 0} ${top}Z`;
      s += `<circle cx="${f(mx)}" cy="${f(my)}" r="${mr * 3.2}" fill="url(#${u}mg)" opacity="${f(lf)}"/><circle cx="${f(mx)}" cy="${f(my)}" r="${mr}" fill="#f7efd0" opacity=".08"/><path d="${d}" fill="#f7efd0"/>`;
      if (lf > .8) s += `<circle cx="${f(mx - 2.5)}" cy="${f(my + 1.5)}" r="2" fill="#e2d6b0"/><circle cx="${f(mx + 3)}" cy="${f(my - 2.4)}" r="1.4" fill="#e2d6b0"/>`;
    }
  }
  // the sun, low and gold or high and white
  if (L.sun.show) {
    const sx = WIN.x + L.sun.x * WIN.w, sy = Math.max(WIN.y + 34, hz - 8 - Math.max(0, L.sun.elev) / 60 * (hz - 70));
    defs += `<radialGradient id="${u}sg"><stop offset="0" stop-color="${L.sun.color}" stop-opacity=".85"/><stop offset=".3" stop-color="${L.sun.color}" stop-opacity=".35"/><stop offset="1" stop-color="${L.sun.color}" stop-opacity="0"/></radialGradient>`;
    s += `<circle cx="${f(sx)}" cy="${f(sy)}" r="${L.sun.elev < 8 ? 70 : 46}" fill="url(#${u}sg)"/><circle cx="${f(sx)}" cy="${f(sy)}" r="${L.sun.elev < 8 ? 12 : 9}" fill="${lit(L.sun.color, .4)}"/>`;
  }
  // a haze lying along the horizon
  defs += `<linearGradient id="${u}hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.sky.low}" stop-opacity="0"/><stop offset="1" stop-color="${L.sky.low}" stop-opacity=".8"/></linearGradient>`;
  s += `<rect x="0" y="${f(hz - 46)}" width="${CW}" height="46" fill="url(#${u}hz)"/>`;
  // high streaks of cloud when the sky is not clear; a lid of grey when it rains
  if (L.cloud >= 1.2 || L.weather === 'smoke') for (let i = 0; i < 6; i++) { const y = hz - 30 - r() * 110, x = WIN.x - 40 + r() * WIN.w, w = 90 + r() * 160; s += `<path d="M${f(x)} ${f(y)}q${f(w / 2)} ${f(-6 - r() * 6)} ${f(w)} 0q${f(-w / 2)} ${f(4)} ${f(-w)} 0Z" fill="${L.cloudInk[i % 2 ? 'shade' : 'body']}" opacity="${f(.35 + r() * .3)}"/>`; }
  if (L.rain) { defs += `<linearGradient id="${u}lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.cloudInk.shade}" stop-opacity=".9"/><stop offset="1" stop-color="${L.cloudInk.shade}" stop-opacity="0"/></linearGradient>`; s += `<rect width="${CW}" height="${f(hz * .7)}" fill="url(#${u}lid)"/>`; }
  return `<defs>${defs}</defs>${s}`;
}

// ---------- what moves ----------
/**
 * Keyframes for a path of [x, y, s, t, opacity, easing] points (card px; t 0..1 through the cycle, spaced by distance
 * when left out), relative to the sprite's box at its largest. Returns { box, origin, keys }.
 */
export function track(sp, path) {
  const smax = Math.max(...path.map((p) => p[2] ?? 1)), [x0, y0] = path[0];
  const box = [x0 - sp.ax * smax, y0 - sp.ay * smax, sp.w * smax, sp.h * smax];
  let ts = path.map((p) => p[3]);
  if (ts.some((t) => t == null)) {
    const d = [0];
    for (let i = 1; i < path.length; i++) d.push(d[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    ts = ts.map((t, i) => t ?? (d.at(-1) ? d[i] / d.at(-1) : i / (path.length - 1)));
  }
  const keys = path.map((p, i) => [f(ts[i] * 100), f((p[0] - x0) / box[2] * 100), f((p[1] - y0) / box[3] * 100), f((p[2] ?? 1) / smax), p[4] ?? 1, p[5] ?? null]);
  return { box, origin: [f(sp.ax / sp.w * 100), f(sp.ay / sp.h * 100)], keys };
}
const pics = (sp) => sp.frames ?? [sp.svg];

function living(P, T, mod, st) {
  const L = P.L, out = [], r = rng(seedOf(mod.id) * 3 + st.day), hz = mod.horizon ?? 250;
  const wind = mod.wind ?? (seedOf(mod.id) % 2 ? 1 : -1);
  const add = (z, kind, sp, path, o = {}) => {
    const tr = path ? track(sp, path) : { box: [o.x - sp.ax, o.y - sp.ay, sp.w, sp.h], origin: [f(sp.ax / sp.w * 100), f(sp.ay / sp.h * 100)], keys: null };
    const rec = { z, kind, ...tr, frames: pics(sp), fps: sp.fps ?? 0, dur: o.dur ?? 30, offset: f(o.offset ?? 0), bob: o.bob ?? null };
    out.push(rec);
    return rec;
  };
  // clouds drift across with the wind; fewer when clear, more when it is grey, none in fog
  const nC = L.fog.near > 0 ? 0 : Math.round((mod.clouds ?? 3) * Math.min(1.6, L.cloud) * (.8 + r() * .4));
  for (let i = 0; i < nC; i++) {
    const w = 60 + r() * 80, y = WIN.y + 10 + r() * Math.max(30, hz - WIN.y - 100) * .8, dur = 240 + r() * 200;
    const sp = T.cloud({ w, seed: st.day * 31 + i * 7 + seedOf(mod.id) });
    const a = wind > 0 ? -w - 20 : CW + 20, b = wind > 0 ? CW + 20 : -w - 20;
    add('sky', 'cloud', sp, [[a, y + sp.h, 1, 0], [b, y + sp.h, 1, 1]], { dur, offset: dur * ((i + r() * .5) / Math.max(1, nC)) });
  }
  // swifts by day in summer (gulls over a port, if the card says so); never in rain or fog
  const birds = mod.birds ?? {};
  if (L.elev > 2 && !L.rain && L.fog.near === 0 && (st.season === 'summer' || st.season === 'spring' || birds.c)) {
    const cx = WIN.x + WIN.w * (birds.x ?? (.3 + r() * .4)), cy = birds.y ?? WIN.y + 50 + r() * 50;
    for (let i = 0; i < (birds.n ?? 3); i++) {
      const rx = 70 + r() * 60, ry = 18 + r() * 14, dur = (birds.c ? 18 : 12) + r() * 8, sp = T.bird({ s: (.7 + r() * .3) * (birds.s ?? 1), c: birds.c }), pts = [];
      for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2 * (i % 2 ? 1 : -1); pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry + Math.sin(a * 3) * 4, 1, k / 8]); }
      add('sky', 'bird', sp, pts, { dur, offset: dur * i / 3 });
    }
  }
  // the city's own living parts
  for (const g of P.sprites) {
    if (g.kind === 'mover') {
      const rec = add(g.z, 'mover', g.sprite, g.path, { dur: g.dur, offset: g.offset ?? 0, bob: g.bob });
      if (g.sprite.puffs && L.fog.near === 0) rec.children = g.sprite.puffs.flatMap(([x, y, s, dark, drift]) => [0, 1, 2].map((k) => puffRec(T, x, y, s, dark, drift ?? wind, k, g.sprite)));
    } else if (g.kind === 'smoke') {
      for (let k = 0; k < 3; k++) out.push(puffRec(T, g.x, g.y, g.s, g.dark, wind, k, null, g.z));
    } else if (g.kind === 'flag') {
      const sp = T.flag({ w: g.w, h: g.h, nation: g.nation });
      add(g.z, 'flag', sp, null, { x: g.x, y: g.y });
    } else if (g.kind === 'spin') {
      const rec = add(g.z, 'spin', g.sprite, null, { x: g.x, y: g.y, dur: g.dur, offset: g.offset });
      rec.spin = g.dir;
    } else if (g.kind === 'hands') {
      out.push({ z: g.z, kind: 'hands', box: [g.x - g.r, g.y - g.r, g.r * 2, g.r * 2], origin: [50, 50], frames: [], fps: 0, dur: 1, offset: 0, keys: null, tz: g.tz, c: g.c });
    } else if (g.kind === 'shimmer') {
      const sp = T.glint({ w: g.w, c: g.c }), dur = 3 + (g.seed % 4) * .9;
      add(g.z, 'glint', sp, [[g.x, g.y, 1, 0, 0], [g.x + 3, g.y, 1, .35, .9], [g.x + 7, g.y, 1, .7, 0], [g.x + 7, g.y, 1, 1, 0]], { dur, offset: (g.seed * 1.37) % dur });
    }
  }
  // the crisis in the street: a newsboy crying the news, then soldiers marching
  const S = P.street;
  if (S && st.war === 'tension') {
    const sp = T.walkers({ kinds: ['newsboy'], s: S.s, dir: -wind, crisis: false });
    add('street', 'mover', sp, [[wind > 0 ? S.x1 + 30 : S.x0 - 30, S.y, 1, 0], [wind > 0 ? S.x0 - 30 : S.x1 + 30, S.y, 1, .8], [wind > 0 ? S.x0 - 30 : S.x1 + 30, S.y, 1, 1]], { dur: 50, offset: 7 }).role = 'newsboy';
  }
  if (S && st.war === 'war') {
    const sp = T.column({ s: S.s * .95, dir: wind, n: 7 });
    const a = wind > 0 ? S.x0 - sp.w : S.x1 + sp.w, b = wind > 0 ? S.x1 + sp.w : S.x0 - sp.w;
    add('street', 'mover', sp, [[a, S.y, 1, 0], [b, S.y, 1, .72], [b, S.y, 1, 1]], { dur: 64, offset: 20 }).role = 'column';
  }
  return out;
}

/** Three puffs make a plume: each rises, swells and thins, a third of the way behind the last. */
function puffRec(T, x, y, s, dark, wind, k, parent = null, z = 'street') {
  const sp = T.puff({ r: 6 * s, dark }), dur = 7.5;
  const path = [[x, y, .35, 0, 0], [x + wind * 3 * s, y - 6 * s, .55, .12, .85], [x + wind * 22 * s, y - 40 * s, 1.4, 1, 0]];
  const tr = track(sp, path);
  const rec = { z: parent ? null : z, kind: 'puff', ...tr, frames: pics(sp), fps: 0, dur, offset: f(k * dur / 3), bob: null };
  // riding a mover: its box in percentages of the mover's own picture, which scales with it
  if (parent) rec.inBox = tr.box.map((v, i) => f(v / (i % 2 ? parent.h : parent.w) * 100));
  return rec;
}

/** The weather over the whole window, for the page to draw as veils. */
function fxOf(L, mod) {
  return {
    rain: L.rain ? { amount: L.rain, color: L.night > .5 ? '#9fb0c8' : '#e8eef4' } : null,
    snow: L.snow && L.rain ? true : false,
    fog: L.fog.near > 0 ? { color: L.fog.color, amount: L.fog.far } : null,
    storm: !!L.storm,
    heat: !!L.heat,
    horizon: mod.horizon ?? 250,
  };
}

/**
 * One still picture of a card (for the album and the contact sheet): the layers with everything that moves stopped
 * where it starts. frame: the frame's SVG (frame.js), drawn over it. The greeting is left to the page.
 */
export function stillSvg(rc, frame = '') {
  const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const spr = (z) => rc.sprites.filter((s) => s.z === z).map((s) => {
    if (s.kind === 'hands') { // the hands at the card's own minute
      const [x, y, w] = s.box, cx = x + w / 2, cy = y + w / 2, r = w / 2, m = (((rc.t + s.tz) % 720) + 720) % 720;
      const hand = (deg, len, wd) => { const a = deg * Math.PI / 180; return `<path d="M${f(cx)} ${f(cy)}L${f(cx + Math.sin(a) * r * len)} ${f(cy - Math.cos(a) * r * len)}" stroke="${s.c}" stroke-width="${f(Math.max(.6, r * wd))}" stroke-linecap="round"/>`; };
      return hand(m / 2, .55, .16) + hand((m % 60) * 6, .8, .1);
    }
    if (s.kind === 'cloud' || s.kind === 'mover' || s.kind === 'flag' || s.kind === 'bird' || s.kind === 'spin') {
      const k = s.keys?.[0], [x, y, w, h] = s.box, op = k ? k[4] : 1;
      if (op === 0) return '';
      const sc = k ? +k[3] : 1, ox = x + w * s.origin[0] / 100, oy = y + h * s.origin[1] / 100;
      return `<g transform="translate(${f(ox)} ${f(oy)}) scale(${sc}) translate(${f(-w * s.origin[0] / 100)} ${f(-h * s.origin[1] / 100)})"><svg width="${f(w)}" height="${f(h)}" viewBox="${s.frames[0].match(/viewBox="([^"]+)"/)[1]}">${inner(s.frames[0])}</svg></g>`;
    }
    return '';
  }).join('');
  return doc(inner(rc.layers.sky) + spr('sky') + inner(rc.layers.back) + spr('back') + inner(rc.layers.mid) + spr('street') + inner(rc.layers.front) + spr('fore') + (frame ? inner(frame) : ''));
}
