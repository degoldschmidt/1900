// The frame every card shares, in the manner of a Viennese picture postcard of 1914: cream card stock gone a little
// foxed, a painted band with gold edges and whiplash vines around a rounded window, the city's flower in the corners,
// a ribbon with the greeting, and the year in a cartouche. Only the band's colours, the flowers and the words change
// from city to city.
//
// The frame is printed, not lit: it looks the same at noon and at midnight. The greeting itself is set live in the
// page (Federant, a Jugendstil face) over the ribbon; the ribbon's length comes from the face's own widths, measured
// once, so the words always fit.

import { f, rng } from './paint.js';
import { mix, shadow, lit } from './color.js';

/** Federant's advance widths at 100 px (measured in the browser). Lower case is set as small capitals. */
const ADV = { A: 67, B: 65, C: 58, D: 68, E: 56, F: 51, G: 65, H: 71, I: 30, J: 29, K: 68, L: 53, M: 102, N: 69, O: 67, P: 57, Q: 67, R: 66, S: 49, T: 54, U: 70, V: 67, W: 96, X: 61, Y: 68, Z: 57, a: 55, b: 56, c: 46, d: 58, e: 52, f: 31, g: 56, h: 58, i: 30, j: 29, k: 55, l: 29, m: 91, n: 61, o: 55, p: 59, q: 56, r: 47, s: 38, t: 32, u: 60, v: 58, w: 87, x: 51, y: 59, z: 41, ' ': 23, '.': 22, ',': 22, "'": 20, '’': 22, '-': 34, 0: 57, 1: 34, 2: 54, 3: 53, 4: 50, 5: 51, 6: 53, 7: 46, 8: 54, 9: 53, Ä: 67, Ö: 67, Ü: 70, Ç: 58, É: 56, È: 56, Ø: 67, Ő: 72, Ă: 72, Ș: 56, Å: 67, Æ: 95, À: 67, Â: 67, Î: 30, Ô: 67, Û: 70, Ł: 61, Ś: 56, Ź: 61, Ż: 61, Ń: 72, å: 55, ä: 55, ö: 55, ü: 60, ç: 46, é: 52, è: 52, ø: 57, ő: 50, ă: 44, ș: 39, à: 55, â: 55, î: 30, ô: 55, û: 60, ł: 28, ś: 39, ź: 44, ż: 44, ń: 50 };
export const FONT = "Federant, 'Cormorant SC', Georgia, 'Times New Roman', serif";
const adv = (s, size) => [...s].reduce((a, ch) => a + (ADV[ch] ?? 62), 0) * size / 100;

// the ribbon's place: it starts under the top-left flower and may run as far as the cartouche allows
const RIB = { x0: 46, y: 56, h: 44, padL: 22, padR: 14, maxX1: 470, tail: 24, cartRx: 33, cartRy: 21 };

/**
 * Where the words of a greeting go. Words in capitals are set large; the small words between ("aus", "de", "from")
 * at six tenths. The size comes down until the line fits the ribbon.
 */
export function titleLayout(greet) {
  // an elided article ("d'ODESSA") is set small and runs on into the name without a space
  const words = greet.trim().split(/\s+/).flatMap((t) => {
    const m = t.match(/^(\p{Ll}+['’])(\p{Lu}.*)$/u);
    return m ? [{ t: m[1], big: false }, { t: m[2], big: true, join: true }] : [{ t, big: t === t.toUpperCase() && /\p{Lu}/u.test(t) }];
  });
  const gap = (w, i, size) => (i && !w.join ? adv(' ', size) * .9 : 0);
  const width = (size) => words.reduce((a, w, i) => a + adv(w.t, w.big ? size : size * .58) + gap(w, i, size), 0);
  const room = RIB.maxX1 - RIB.x0 - RIB.padL - RIB.padR;
  let size = 34;
  while (size > 24 && width(size) > room) size -= .5;
  const w = Math.min(room, width(size)), squeeze = width(size) > room ? room / width(size) : 1;
  let x = RIB.x0 + RIB.padL;
  const parts = words.map((wd, i) => {
    x += gap(wd, i, size) * squeeze;
    const fs = wd.big ? size : size * .58, len = adv(wd.t, fs) * squeeze, p = { t: wd.t, x, size: fs, len, big: wd.big };
    x += len;
    return p;
  });
  const x1 = RIB.x0 + RIB.padL + w + RIB.padR;
  return { parts, size, width: w, squeeze, baseline: RIB.y + size * .72 / 2, ribbon: { x0: RIB.x0, x1, y0: RIB.y - RIB.h / 2, y1: RIB.y + RIB.h / 2 }, cart: { cx: x1 + RIB.tail + RIB.cartRx + 4, cy: RIB.y - 2, rx: RIB.cartRx, ry: RIB.cartRy } };
}

/** The window the scene shows through: a rounded window with a rise at the foot for the ornament. */
export const WINDOW = 'M26 70Q26 26 70 26H500Q574 26 574 100V326Q574 374 526 374H354C338 374 328 360 300 360C272 360 262 374 246 374H74Q26 374 26 326Z';
const OUTER = 'M23 11H577Q589 11 589 23V377Q589 389 577 389H23Q11 389 11 377V23Q11 11 23 11Z';

/** Inks of a frame with defaults: { paper, band: [light, dark], gold, key, ink (the greeting), leaf: [light, dark], ribbon } */
export function frameInks(fr = {}) {
  const band = fr.band ?? ['#3f9d98', '#1d5f63'];
  return { paper: fr.paper ?? '#f1e5c6', band, gold: fr.gold ?? '#d6b25a', key: fr.key ?? '#3a2e1e', ink: fr.ink ?? '#1d4d3c', halo: fr.halo ?? '#f6e7b8', leaf: fr.leaf ?? ['#6d9a52', '#34603a'], ribbon: fr.ribbon ?? '#f5ecd4', year: fr.year ?? '#7a5a22' };
}

/**
 * The flower kit, for a city's flower: shapes around the origin in printed inks, outlined in the frame's key.
 * Each returns an SVG string. Angles in degrees, 0 pointing up, clockwise.
 */
export function flowerKit(I) {
  const F = { I, f };
  const K = (w = .6) => `stroke="${I.key}" stroke-width="${w}" stroke-linejoin="round"`;
  const rot = (a, body) => `<g transform="rotate(${f(a)})">${body}</g>`;
  F.rot = rot;
  F.at = (x, y, body, a = 0, s = 1) => `<g transform="translate(${f(x)} ${f(y)})${a ? ` rotate(${f(a)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}">${body}</g>`;
  /** One petal pointing up from the origin. shape: round point notch frill strap heart */
  F.petal = (len, wid, c, shape = 'round', o = {}) => {
    const l = len, w = wid / 2, b = o.base ?? .12;
    let d;
    if (shape === 'point') d = `M0 0C${f(-w * 1.3)} ${f(-l * .3)} ${f(-w * .8)} ${f(-l * .8)} 0 ${f(-l)}C${f(w * .8)} ${f(-l * .8)} ${f(w * 1.3)} ${f(-l * .3)} 0 0Z`;
    else if (shape === 'notch' || shape === 'heart') d = `M0 0C${f(-w * 1.4)} ${f(-l * .3)} ${f(-w * 1.3)} ${f(-l * 1.05)} ${f(-w * .4)} ${f(-l)}Q0 ${f(-l * (shape === 'heart' ? .82 : .9))} ${f(w * .4)} ${f(-l)}C${f(w * 1.3)} ${f(-l * 1.05)} ${f(w * 1.4)} ${f(-l * .3)} 0 0Z`;
    else if (shape === 'frill') { d = `M0 0C${f(-w * 1.2)} ${f(-l * .3)} ${f(-w * 1.2)} ${f(-l * .75)} ${f(-w)} ${f(-l * .85)}`; for (let i = 0; i <= 4; i++) { const x = -w + i * w / 2; d += `L${f(x + w * .25)} ${f(-l - (i % 2 ? .0 : l * .08))}L${f(x + w * .5)} ${f(-l * .9)}`; } d += `C${f(w * 1.2)} ${f(-l * .75)} ${f(w * 1.2)} ${f(-l * .3)} 0 0Z`; }
    else if (shape === 'strap') d = `M${f(-w * .5)} ${f(-l * b)}C${f(-w)} ${f(-l * .5)} ${f(-w)} ${f(-l * .9)} 0 ${f(-l)}C${f(w)} ${f(-l * .9)} ${f(w)} ${f(-l * .5)} ${f(w * .5)} ${f(-l * b)}Z`;
    else d = `M0 0C${f(-w * 1.5)} ${f(-l * .25)} ${f(-w * 1.25)} ${f(-l)} 0 ${f(-l)}C${f(w * 1.25)} ${f(-l)} ${f(w * 1.5)} ${f(-l * .25)} 0 0Z`;
    let s = `<path d="${d}" fill="${c}" ${K(o.k ?? .55)}/>`;
    if (o.vein) s += `<path d="M0 ${f(-l * .15)}V${f(-l * .8)}" stroke="${o.vein}" stroke-width="${f(Math.max(.4, w * .12))}" opacity=".6"/>`;
    if (o.lite) s += `<path d="M${f(-w * .3)} ${f(-l * .3)}C${f(-w * .6)} ${f(-l * .6)} ${f(-w * .3)} ${f(-l * .85)} 0 ${f(-l * .9)}" stroke="${o.lite}" stroke-width="${f(Math.max(.6, w * .25))}" fill="none" opacity=".7" stroke-linecap="round"/>`;
    return s;
  };
  /** n petals around the origin. o: { rot (degrees), shape, vein, lite } */
  F.radial = (n, len, wid, c, o = {}) => { let s = ''; for (let i = 0; i < n; i++) s += rot((o.rot ?? 0) + i * 360 / n, F.petal(len, wid, Array.isArray(c) ? c[i % c.length] : c, o.shape, o)); return s; };
  /** A disc: a centre with a ring of dots. */
  F.disc = (r, c, o = {}) => {
    let s = `<circle r="${f(r)}" fill="${c}" ${K(o.k ?? .5)}/>`;
    if (o.dots) { const n = o.n ?? 10; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; s += `<circle cx="${f(Math.cos(a) * r * .62)}" cy="${f(Math.sin(a) * r * .62)}" r="${f(r * .14)}" fill="${o.dots}"/>`; } }
    if (o.lite) s += `<circle cx="${f(-r * .3)}" cy="${f(-r * .3)}" r="${f(r * .35)}" fill="${o.lite}" opacity=".6"/>`;
    return s;
  };
  /** A leaf from the origin along angle a. o: { shape: lance oval heart serrate palm, vein (colour) } */
  F.leaf = (len, wid, a, c, o = {}) => {
    const l = len, w = wid / 2;
    let d;
    if (o.shape === 'serrate') { d = 'M0 0'; for (let i = 1; i <= 6; i++) d += `L${f(-w * Math.sin(i / 7 * Math.PI) * 1.1)} ${f(-l * (i - .5) / 7)}L${f(-w * Math.sin(i / 7 * Math.PI) * .8)} ${f(-l * i / 7)}`; d += `L0 ${f(-l)}`; for (let i = 6; i >= 1; i--) d += `L${f(w * Math.sin(i / 7 * Math.PI) * .8)} ${f(-l * i / 7)}L${f(w * Math.sin(i / 7 * Math.PI) * 1.1)} ${f(-l * (i - .5) / 7)}`; d += 'Z'; }
    else if (o.shape === 'heart') d = `M0 ${f(-l * .12)}C${f(-w * 1.8)} ${f(l * .1)} ${f(-w * 1.4)} ${f(-l * .8)} 0 ${f(-l)}C${f(w * 1.4)} ${f(-l * .8)} ${f(w * 1.8)} ${f(l * .1)} 0 ${f(-l * .12)}Z`;
    else if (o.shape === 'oval') d = `M0 0C${f(-w * 1.4)} ${f(-l * .2)} ${f(-w * 1.3)} ${f(-l * .85)} 0 ${f(-l)}C${f(w * 1.3)} ${f(-l * .85)} ${f(w * 1.4)} ${f(-l * .2)} 0 0Z`;
    else d = `M0 0C${f(-w * 1.2)} ${f(-l * .3)} ${f(-w * .9)} ${f(-l * .7)} 0 ${f(-l)}C${f(w * .5)} ${f(-l * .7)} ${f(w * 1.2)} ${f(-l * .35)} 0 0Z`;
    return rot(a, `<path d="${d}" fill="${c}" ${K(o.k ?? .55)}/><path d="M0 ${f(-l * .05)}Q${f(w * .15)} ${f(-l * .5)} 0 ${f(-l * .92)}" stroke="${o.vein ?? I.gold}" stroke-width="${f(Math.max(.45, w * .14))}" fill="none" opacity=".85"/>`);
  };
  /** A stem along a path d, in a green with a gold hairline. */
  F.stem = (d, c = I.leaf[1], w = 1.6) => `<path d="${d}" fill="none" stroke="${I.key}" stroke-width="${f(w + 1)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  /** A bell hanging from the origin, mouth down. */
  F.bell = (w, h, c, o = {}) => `<path d="M0 0C${f(-w * .5)} ${f(h * .1)} ${f(-w * .55)} ${f(h * .6)} ${f(-w * .6)} ${f(h * .9)}Q${f(-w * .4)} ${f(h)} ${f(-w * .25)} ${f(h * .9)}Q0 ${f(h * 1.04)} ${f(w * .25)} ${f(h * .9)}Q${f(w * .4)} ${f(h)} ${f(w * .6)} ${f(h * .9)}C${f(w * .55)} ${f(h * .6)} ${f(w * .5)} ${f(h * .1)} 0 0Z" fill="${c}" ${K(o.k ?? .5)}/>${o.lite ? `<path d="M${f(-w * .2)} ${f(h * .2)}Q${f(-w * .35)} ${f(h * .5)} ${f(-w * .35)} ${f(h * .8)}" stroke="${o.lite}" stroke-width="${f(w * .14)}" fill="none" opacity=".7"/>` : ''}`;
  /** Florets along a spike from (0,0) up to length len, smaller toward the tip. */
  F.spike = (len, size, c, o = {}) => {
    let s = o.stem !== false ? F.stem(`M0 0V${f(-len)}`, o.stemC ?? I.leaf[1], o.sw ?? 1) : '';
    const n = o.n ?? 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), y = -len * (.12 + t * .88), r = size * (1 - t * .55), side = i % 2 ? 1 : -1;
      s += `<ellipse cx="${f(side * r * .55)}" cy="${f(y)}" rx="${f(r * .62)}" ry="${f(r * .5)}" fill="${Array.isArray(c) ? c[i % c.length] : c}" ${K(.4)}/>`;
    }
    return s;
  };
  /** A loose ball of tiny florets (an umbel, a pompom, a cluster). */
  F.cluster = (r, n, size, c, o = {}) => {
    const R = rng(o.seed ?? 7);
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, q = Math.sqrt(R()) * r, x = Math.cos(a) * q, y = Math.sin(a) * q * (o.flat ?? 1);
      s += o.petals ? F.at(x, y, F.radial(o.petals, size, size * .7, Array.isArray(c) ? c[i % c.length] : c, { k: .35 }) + `<circle r="${f(size * .3)}" fill="${o.eye ?? I.gold}"/>`, R() * 70)
        : `<circle cx="${f(x)}" cy="${f(y)}" r="${f(size)}" fill="${Array.isArray(c) ? c[i % c.length] : c}" ${K(.4)}/>`;
    }
    return s;
  };
  F.berry = (x, y, r, c, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" ${K(o.k ?? .5)}/><circle cx="${f(x - r * .35)}" cy="${f(y - r * .35)}" r="${f(r * .3)}" fill="#ffffff" opacity=".55"/>`;
  /** A cup of petals seen from the side (a tulip, a crocus), opening upward from the origin. */
  F.cup = (w, h, c, o = {}) => {
    const c2 = o.inner ?? shadow(c, .2);
    return `<path d="M0 0C${f(-w * .6)} ${f(-h * .05)} ${f(-w * .62)} ${f(-h * .7)} ${f(-w * .45)} ${f(-h)}Q${f(-w * .2)} ${f(-h * .78)} 0 ${f(-h * .95)}Q${f(w * .2)} ${f(-h * .78)} ${f(w * .45)} ${f(-h)}C${f(w * .62)} ${f(-h * .7)} ${f(w * .6)} ${f(-h * .05)} 0 0Z" fill="${c}" ${K(.6)}/>`
      + `<path d="M0 ${f(-h * .05)}C${f(-w * .25)} ${f(-h * .3)} ${f(-w * .2)} ${f(-h * .75)} 0 ${f(-h * .95)}C${f(w * .2)} ${f(-h * .75)} ${f(w * .25)} ${f(-h * .3)} 0 ${f(-h * .05)}Z" fill="${c2}" ${K(.45)}/>`
      + (o.flame ? `<path d="M${f(-w * .32)} ${f(-h * .3)}Q${f(-w * .3)} ${f(-h * .7)} ${f(-w * .42)} ${f(-h * .92)}M${f(w * .32)} ${f(-h * .3)}Q${f(w * .3)} ${f(-h * .7)} ${f(w * .42)} ${f(-h * .92)}" stroke="${o.flame}" stroke-width="${f(w * .1)}" fill="none"/>` : '');
  };
  return F;
}

/** The frame as one SVG (600 × 400) with the window clear: card, band, vines, flowers, ribbon and cartouche. */
export function frameSvg(mod) {
  const I = frameInks(mod.frame), F = flowerKit(I), lay = titleLayout(mod.greet), uid = `fr${mod.id.toLowerCase()}`;
  const R = rng([...mod.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 3) % 9973);
  let defs = `<linearGradient id="${uid}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${I.band[0]}"/><stop offset=".55" stop-color="${mix(I.band[0], I.band[1], .55)}"/><stop offset="1" stop-color="${I.band[1]}"/></linearGradient>`;
  defs += `<radialGradient id="${uid}p" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="${lit(I.paper, .3)}"/><stop offset=".7" stop-color="${I.paper}"/><stop offset="1" stop-color="${shadow(I.paper, .12)}"/></radialGradient>`;
  defs += `<linearGradient id="${uid}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lit(I.ribbon, .35)}"/><stop offset=".6" stop-color="${I.ribbon}"/><stop offset="1" stop-color="${shadow(I.ribbon, .1)}"/></linearGradient>`;
  let s = '';
  // card stock, foxed a little at the edges
  s += `<path d="M0 0H600V400H0Z${WINDOW}" fill="url(#${uid}p)" fill-rule="evenodd"/>`;
  for (let i = 0; i < 26; i++) {
    const edge = R() < .7, x = edge ? (R() < .5 ? 3 + R() * 9 : 588 - R() * 9) : 3 + R() * 594, y = edge ? 3 + R() * 394 : (R() < .5 ? 3 + R() * 8 : 389 + R() * 8);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.6 + R() * 2.6)}" fill="#a87a3a" opacity="${f(.05 + R() * .12)}"/>`;
  }
  s += `<rect x="5.5" y="5.5" width="589" height="389" rx="5" fill="none" stroke="${I.gold}" stroke-width="1.1"/><rect x="8" y="8" width="584" height="384" rx="4" fill="none" stroke="${shadow(I.gold, .2)}" stroke-width=".45" opacity=".8"/>`;
  // the band
  s += `<path d="${OUTER}${WINDOW}" fill="url(#${uid}b)" fill-rule="evenodd"/>`;
  for (let i = 0; i < 18; i++) { // painted streaks along the band
    const side = i % 4, t = R(), len = 40 + R() * 90;
    const d = side === 0 ? `M${f(30 + t * 500)} ${f(14 + R() * 9)}h${f(len)}` : side === 1 ? `M${f(30 + t * 500)} ${f(377 + R() * 9)}h${f(len)}` : side === 2 ? `M${f(14 + R() * 9)} ${f(40 + t * 280)}v${f(len)}` : `M${f(577 + R() * 9)} ${f(40 + t * 280)}v${f(len)}`;
    s += `<path d="${d}" stroke="${R() < .5 ? lit(I.band[0], .25) : shadow(I.band[1], .2)}" stroke-width="${f(.8 + R() * 1.4)}" opacity="${f(.25 + R() * .3)}" stroke-linecap="round"/>`;
  }
  s += `<path d="${OUTER}" fill="none" stroke="${I.key}" stroke-width="2.2" opacity=".55"/><path d="${OUTER}" fill="none" stroke="${I.gold}" stroke-width="1.3"/>`;
  s += `<path d="${WINDOW}" fill="none" stroke="${I.key}" stroke-width="4.2"/><path d="${WINDOW}" fill="none" stroke="${I.gold}" stroke-width="2.6"/><path d="${WINDOW}" fill="none" stroke="${lit(I.gold, .45)}" stroke-width=".7" transform="translate(-.5 -.5)"/>`;
  // whiplash vines: gold lines that sweep along the band from the corners and curl
  const vine = (d, w = 1.6) => `<path d="${d}" fill="none" stroke="${I.key}" stroke-width="${f(w + 1.1)}" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="${I.gold}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  s += vine('M18 84C13 150 24 196 17 250C13 282 20 300 28 306C33 310 36 302 31 298');
  s += vine('M582 92C588 160 576 214 584 268C588 300 580 318 572 322C567 325 564 318 569 314');
  s += vine('M110 383C150 392 196 376 238 384C256 388 268 386 276 378', 1.3) + vine('M490 383C450 392 404 376 362 384C344 388 332 386 324 378', 1.3);
  s += vine('M520 16C470 22 440 12 404 18C392 20 386 26 392 30', 1.2);
  // long leaves sweeping from the top corners along the band
  const leafAt = (x, y, len, wid, a, c) => F.at(x, y, F.leaf(len, wid, 0, c, { shape: 'lance' }), a);
  s += leafAt(22, 56, 64, 9, 172, I.leaf[1]) + leafAt(30, 50, 52, 8, 150, I.leaf[0]) + leafAt(50, 26, 46, 7, 112, I.leaf[0]);
  s += leafAt(578, 56, 64, 9, 188, I.leaf[1]) + leafAt(570, 50, 52, 8, 210, I.leaf[0]) + leafAt(548, 24, 52, 8, 252, I.leaf[1]) + leafAt(540, 20, 40, 6, 270, I.leaf[0]);
  // the ornament at the foot: an interlace of gold loops
  s += knot(I, 300, 377);
  // the flowers: the city's at the top corners, its companion (or itself, smaller) at the feet
  const big = mod.flowerArt ? mod.flowerArt(F, { size: 1 }) : F.radial(5, 12, 10, '#d9534a') + F.disc(4, I.gold);
  const small = mod.flowerArt2 ? mod.flowerArt2(F, { size: 1 }) : big;
  const bs = mod.flowerScale ?? 1;
  s += F.at(34, 40, big, -18, 1.25 * bs) + F.at(566, 40, big, 18, 1.25 * bs) + F.at(574, 66, small, 30, .55 * bs);
  s += F.at(36, 362, small, -8, .8 * bs) + F.at(64, 380, small, 14, .6 * bs) + F.at(22, 330, small, -30, .55 * bs);
  s += F.at(564, 362, small, 8, .8 * bs) + F.at(536, 380, small, -14, .6 * bs) + F.at(578, 330, small, 30, .55 * bs);
  // the ribbon and its tail, then the cartouche
  s += ribbon(I, lay, uid);
  s += cartouche(I, lay.cart);
  // the corner flower over the ribbon's tucked end, as on the model
  s += F.at(34, 40, big, -18, 1.25 * bs);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400"><defs>${defs}</defs>${s}</svg>`;
}

function ribbon(I, lay, uid) {
  const { x0, x1, y0, y1 } = lay.ribbon, W = x1 - x0, ym = (y0 + y1) / 2;
  const top = `M${f(x0)} ${f(y0 + 3)}C${f(x0 + W * .3)} ${f(y0 - 3)} ${f(x0 + W * .65)} ${f(y0 + 5)} ${f(x1)} ${f(y0)}`;
  const end = `C${f(x1 + 9)} ${f(y0 + 4)} ${f(x1 + 9)} ${f(y1 - 6)} ${f(x1 + 2)} ${f(y1)}`;
  const bot = `C${f(x0 + W * .65)} ${f(y1 + 6)} ${f(x0 + W * .3)} ${f(y1 - 2)} ${f(x0)} ${f(y1 + 3)}`;
  const body = `${top}${end}${bot}Z`;
  let s = '';
  // the tucked left end, folded behind
  s += `<path d="M${f(x0 + 4)} ${f(y0 + 8)}L${f(x0 - 14)} ${f(y0 + 2)}L${f(x0 - 6)} ${f(ym + 2)}L${f(x0 - 16)} ${f(y1 + 6)}L${f(x0 + 4)} ${f(y1 + 1)}Z" fill="${shadow(I.ribbon, .18)}" stroke="${I.key}" stroke-width=".6"/>`;
  // the right end, folded back behind and cut in a swallowtail
  s += `<path d="M${f(x1 - 6)} ${f(y0 + 7)}L${f(x1 + 18)} ${f(y0 + 3)}L${f(x1 + 10)} ${f(ym + 1)}L${f(x1 + 20)} ${f(y1 + 6)}L${f(x1 - 6)} ${f(y1 - 1)}Z" fill="${shadow(I.ribbon, .18)}" stroke="${I.key}" stroke-width=".6"/>`;
  s += `<path d="M${f(x1 - 2)} ${f(y1 - 1)}L${f(x1 + 4)} ${f(y1 + 4)}L${f(x1 + 2)} ${f(y1 - 2)}Z" fill="${shadow(I.ribbon, .35)}"/>`;
  s += `<path d="${body}" fill="${I.key}" opacity=".25" transform="translate(1.5 2.5)"/>`;
  s += `<path d="${body}" fill="url(#${uid}r)" stroke="${I.key}" stroke-width="1"/>`;
  s += `<path d="${top}" fill="none" stroke="${I.gold}" stroke-width="1.5" transform="translate(0 2.4)"/>`;
  s += `<path d="M${f(x1 - 1)} ${f(y1 - 2.4)}C${f(x0 + W * .65)} ${f(y1 + 3.6)} ${f(x0 + W * .3)} ${f(y1 - 4.4)} ${f(x0 + 1)} ${f(y1 + .6)}" fill="none" stroke="${I.gold}" stroke-width="1.5"/>`;
  return s;
}

function cartouche(I, c) {
  const { cx, cy, rx, ry } = c;
  let s = '';
  // little gold leaves either side
  for (const k of [-1, 1]) s += `<path d="M${f(cx + k * (rx - 2))} ${f(cy)}q${f(k * 10)} ${f(-9)} ${f(k * 18)} ${f(-2)}q${f(-k * 8)} ${f(1)} ${f(-k * 18)} ${f(2)}Z" fill="${I.gold}" stroke="${I.key}" stroke-width=".55"/><path d="M${f(cx + k * (rx - 2))} ${f(cy + 1)}q${f(k * 9)} ${f(8)} ${f(k * 15)} ${f(3)}q${f(-k * 7)} ${f(-1)} ${f(-k * 15)} ${f(-3)}Z" fill="${shadow(I.gold, .15)}" stroke="${I.key}" stroke-width=".5"/>`;
  s += `<ellipse cx="${f(cx + 1.2)}" cy="${f(cy + 2)}" rx="${f(rx)}" ry="${f(ry)}" fill="${I.key}" opacity=".25"/>`;
  s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${lit(I.ribbon, .2)}" stroke="${I.key}" stroke-width="1"/>`;
  s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx - 1.6)}" ry="${f(ry - 1.6)}" fill="none" stroke="${I.gold}" stroke-width="2"/><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx - 4.4)}" ry="${f(ry - 4.4)}" fill="none" stroke="${I.gold}" stroke-width=".6"/>`;
  return s;
}

/** An interlace of gold loops at the foot of the window. */
function knot(I, x, y) {
  const d = `M${x - 34} ${y + 2}C${x - 22} ${y - 14} ${x - 6} ${y - 14} ${x} ${y - 2}C${x + 6} ${y - 14} ${x + 22} ${y - 14} ${x + 34} ${y + 2}`
    + `M${x - 20} ${y + 6}C${x - 16} ${y - 8} ${x - 4} ${y - 10} ${x} ${y - 16}C${x + 4} ${y - 10} ${x + 16} ${y - 8} ${x + 20} ${y + 6}`
    + `M${x - 10} ${y + 8}C${x - 12} ${y - 2} ${x - 4} ${y - 4} ${x} ${y + 4}C${x + 4} ${y - 4} ${x + 12} ${y - 2} ${x + 10} ${y + 8}`;
  return `<path d="${d}" fill="none" stroke="${I.key}" stroke-width="3.6" stroke-linecap="round" opacity=".7"/><path d="${d}" fill="none" stroke="${I.gold}" stroke-width="2.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${lit(I.gold, .5)}" stroke-width=".6" stroke-linecap="round" transform="translate(-.4 -.5)"/><circle cx="${x}" cy="${y - 2}" r="2.6" fill="${I.gold}" stroke="${I.key}" stroke-width=".6"/>`;
}

/**
 * The greeting and the year as live SVG text over the frame (600 × 400). Each word is held to its measured length,
 * so if Federant has not loaded the fallback face still fits the ribbon.
 */
export function titleSvg(mod, o = {}) {
  const I = frameInks(mod.frame), lay = titleLayout(mod.greet), esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const by = f(lay.baseline);
  const word = (p, pass) => `<text x="${f(p.x)}" y="${by}" font-size="${f(p.size)}" textLength="${f(p.len)}" lengthAdjust="spacingAndGlyphs"${pass === 0 ? ` fill="none" stroke="${I.halo}" stroke-width="${f(p.big ? 4.2 : 3)}" stroke-linejoin="round"` : ` fill="${I.ink}" stroke="${I.ink}" stroke-width="${f(p.big ? .9 : .5)}" stroke-linejoin="round"`}>${esc(p.t)}</text>`;
  const year = (pass) => `<text x="${f(lay.cart.cx)}" y="${f(lay.cart.cy + 7.4)}" font-size="21" text-anchor="middle" textLength="46" lengthAdjust="spacingAndGlyphs"${pass === 0 ? ` fill="none" stroke="${lit(I.ribbon, .3)}" stroke-width="2.4"` : ` fill="${I.year}" stroke="${I.year}" stroke-width=".4"`}>1914</text>`;
  const body = [0, 1].map((k) => lay.parts.map((p) => word(p, k)).join('') + year(k)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"${o.cls ? ` class="${o.cls}"` : ''} aria-hidden="true"><g font-family="${FONT}">${body}</g></svg>`;
}
