// The living parts of a postcard, each a small picture of its own: a tram, a fiacre, a steamer, people walking, a
// column of soldiers, clouds, a puff of smoke, swifts, a flag in the wind. They are drawn with the card's kit, so the
// light that falls on the city falls on them too. compose.js sets them moving; the browser moves them with transforms
// alone, so a moving tram costs no repainting.
//
// A sprite is { svg | frames: [svg…], fps, w, h, ax, ay }: its own picture w × h, and the anchor (ax, ay) that rides
// the path (wheels on the rail, feet on the street, a hull on the water). Frames alternate (legs, wings, a flag).

import { FLAGS, f, rng } from './paint.js';
import { mix, shadow, lit } from './color.js';

export const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}">${body}</svg>`;
/** Mirror a drawing made facing right so it faces left. */
export const face = (dir, w, body) => (dir < 0 ? `<g transform="translate(${f(w)} 0) scale(-1 1)">${body}</g>` : body);

let flagN = 0;
export function makeSprites(P) {
  const L = P.L, T = {};
  const one = (w, h, ax, ay, body, o = {}) => ({ svg: doc(w, h, body), w, h, ax, ay, ...o });
  const many = (w, h, ax, ay, bodies, fps, o = {}) => ({ frames: bodies.map((b) => doc(w, h, b)), fps, w, h, ax, ay, ...o });
  /** For a card's own moving parts: one picture, or several frames, w × h with the anchor at (ax, ay). */
  T.one = one; T.many = many;
  /** A horse in profile facing right (two frames of the trot: st 0 or 1); x, y the withers. */
  T.horse = (x, y, s, c, st = 0) => horseAt(P, x, y, s, c, st);
  const lamp = () => L.lamps > .05;
  const glass = (c = '#3d4d5e') => (L.windows > .2 ? P.glow('#ffd88a') : P.ink(c));
  const halo = (x, y, r) => (lamp() ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${P.glow('#ffe2a0')}" opacity="${f(.25 * L.lamps)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .45)}" fill="${P.glow('#fff1c8')}" opacity="${f(.5 * L.lamps)}"/>` : '');
  const wheel = (cx, cy, r, c = '#2b2622', spokes = 8, rim = null) => {
    let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="none" stroke="${P.ink(rim ?? c)}" stroke-width="${f(Math.max(.7, r * .16))}"/>`;
    for (let i = 0; i < spokes; i++) { const a = i * Math.PI / spokes; s += `<path d="M${f(cx - Math.cos(a) * r)} ${f(cy - Math.sin(a) * r)}L${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}" stroke="${P.ink(c)}" stroke-width="${f(Math.max(.35, r * .07))}"/>`; }
    return s + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .18)}" fill="${P.ink(c)}"/>`;
  };
  const text = (x, y, size, t, c = '#1d1a17', o = '') => `<text x="${f(x)}" y="${f(y)}" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="${f(size)}" text-anchor="middle" fill="${P.ink(c)}"${o}>${t}</text>`;

  // ---------- on rails and roads ----------
  /**
   * A tram seen three-quarters from the front, coming down the street toward the viewer (dir -1: its front to the
   * left). o: { c body, band (window band), number, s }
   */
  T.tram = (o = {}) => {
    const s = o.s ?? 1, c = o.c ?? '#b8352e', cream = o.band ?? '#efe2bf', dir = o.dir ?? -1, W = 82 * s, H = 64 * s;
    const S = (n) => n * s, pt = (x, y) => `${f(S(x))} ${f(S(y))}`;
    const poly = (pts) => 'M' + pts.map(([x, y]) => pt(x, y)).join('L') + 'Z';
    let b = '';
    // trolley pole and its wire wheel
    b += `<path d="M${pt(54, 15)}L${pt(76, 1)}" stroke="${P.ink('#2a2a2a')}" stroke-width="${f(S(1))}"/><circle cx="${f(S(76))}" cy="${f(S(1.5))}" r="${f(S(1.4))}" fill="${P.ink('#2a2a2a')}"/>`;
    // the side, receding: roof, clerestory, window band, panel
    b += P.fill(poly([[28, 20], [78, 14], [79, 11], [28, 16]]), mix(cream, '#888888', .2), { w: .5 });
    b += P.fill(poly([[28, 22], [78, 15], [78, 28], [28, 37]]), cream, { w: .55 });
    for (let i = 0; i < 6; i++) {
      const x0 = 30 + i * 8, x1 = x0 + 6, y0 = (x) => 22 - (x - 28) * .14 + 1.4, y1 = (x) => 37 - (x - 28) * .18 - 1.6;
      b += `<path d="${poly([[x0, y0(x0)], [x1, y0(x1)], [x1, y1(x1)], [x0, y1(x0)]])}" fill="${glass()}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>`;
      if (L.windows <= .2 && i % 2 === 0) b += `<circle cx="${f(S(x0 + 3))}" cy="${f(S(y1(x0) - 3.4))}" r="${f(S(1.5))}" fill="${P.ink('#2c2a30')}"/>`;
    }
    b += P.fill(poly([[28, 37], [78, 28], [78, 45], [28, 56]]), c, { w: .6 });
    b += `<path d="M${pt(30, 41)}L${pt(76, 32)}" stroke="${P.ink(cream)}" stroke-width="${f(S(.9))}"/>`;
    b += P.shade(poly([[28, 50], [78, 40], [78, 45], [28, 56]]), c, .3);
    // the front: roof, number box, windscreen, dash, headlamp, fender
    b += P.fill(poly([[1, 22], [29, 22], [28, 16], [3, 16]]), mix(cream, '#888888', .2), { w: .55 });
    b += P.fill(poly([[8, 16], [22, 16], [22, 9], [8, 9]]), '#f3ecd8', { w: .5 });
    b += P.fill(poly([[3, 22], [28, 22], [28, 37], [3, 37]]), cream, { w: .55 });
    for (const x of [4.5, 12.6, 20.7]) b += `<path d="${poly([[x, 23.4], [x + 6.5, 23.4], [x + 6.5, 35.4], [x, 35.4]])}" fill="${glass()}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>`;
    if (L.windows <= .2) b += `<circle cx="${f(S(15.5))}" cy="${f(S(29))}" r="${f(S(2))}" fill="${P.ink('#2c2a30')}"/><path d="M${pt(12.5, 35.4)}q${f(S(3))} ${f(S(-5))} ${f(S(6))} 0Z" fill="${P.ink('#2c2a30')}"/>`;
    b += P.fill(poly([[3, 37], [28, 37], [28, 56], [3, 56]]), c, { w: .6 });
    b += `<path d="${poly([[5.5, 39.5], [25.5, 39.5], [25.5, 53.5], [5.5, 53.5]])}" fill="none" stroke="${P.ink(cream)}" stroke-width="${f(S(.8))}"/>`;
    b += P.fill(poly([[1, 56], [30, 56], [28, 59], [3, 59]]), '#2b2622', { w: .4 });
    b += `<circle cx="${f(S(15.5))}" cy="${f(S(46))}" r="${f(S(2.6))}" fill="${lamp() ? P.glow('#fff2c0') : P.ink('#e9e2c8')}" stroke="${P.keyC()}" stroke-width="${f(.5 * s)}"/>` + halo(S(15.5), S(46), S(9));
    // wheels under the side
    b += `<ellipse cx="${f(S(40))}" cy="${f(S(57))}" rx="${f(S(4.5))}" ry="${f(S(2.6))}" fill="${P.ink('#2b2622')}"/><ellipse cx="${f(S(69))}" cy="${f(S(47.6))}" rx="${f(S(3.6))}" ry="${f(S(2.2))}" fill="${P.ink('#2b2622')}"/>`;
    let num = '';
    if (o.number) { const nx = dir < 0 ? S(15) : W - S(15); num = text(nx, S(15), S(6), o.number, '#1d1a17'); }
    return one(W, H, dir < 0 ? S(15.5) : W - S(15.5), S(58), face(-dir, W, b) + num);
  };
  /** A tram broadside, crossing the picture (dir 1: to the right). o: { c, band, number, s, open (a summer trailer) } */
  T.tramSide = (o = {}) => {
    const s = o.s ?? 1, c = o.c ?? '#b8352e', cream = o.band ?? '#efe2bf', dir = o.dir ?? 1, W = 76 * s, H = 50 * s, S = (n) => f(n * s);
    let b = `<path d="M${S(40)} ${S(14)}L${S(18)} ${S(1)}" stroke="${P.ink('#2a2a2a')}" stroke-width="${S(1)}"/>`;
    b += P.fill(`M${S(4)} ${S(14)}H${S(72)}L${S(70)} ${S(10)}H${S(6)}Z`, mix(cream, '#888888', .2), { w: .5 });
    b += P.fill(`M${S(2)} ${S(14)}H${S(74)}V${S(26)}H${S(2)}Z`, cream, { w: .55 });
    for (let i = 0; i < 8; i++) b += `<rect x="${S(5 + i * 8.4)}" y="${S(15.6)}" width="${S(6.4)}" height="${S(9)}" fill="${glass()}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>` + (L.windows <= .2 && i % 3 === 1 ? `<circle cx="${S(8 + i * 8.4)}" cy="${S(21.6)}" r="${S(1.6)}" fill="${P.ink('#2c2a30')}"/>` : '');
    b += P.fill(`M${S(2)} ${S(26)}H${S(74)}V${S(40)}H${S(2)}Z`, c, { w: .6 }) + P.shade(`M${S(2)} ${S(36)}H${S(74)}V${S(40)}H${S(2)}Z`, c, .3);
    b += `<path d="M${S(4)} ${S(29)}H${S(72)}" stroke="${P.ink(cream)}" stroke-width="${S(.8)}"/>`;
    b += `<ellipse cx="${S(18)}" cy="${S(42)}" rx="${S(5)}" ry="${S(3)}" fill="${P.ink('#2b2622')}"/><ellipse cx="${S(58)}" cy="${S(42)}" rx="${S(5)}" ry="${S(3)}" fill="${P.ink('#2b2622')}"/>`;
    b += `<circle cx="${S(73)}" cy="${S(33)}" r="${S(1.8)}" fill="${lamp() ? P.glow('#fff2c0') : P.ink('#e9e2c8')}"/>` + halo(73 * s, 33 * s, 8 * s);
    const num = o.number ? text(W / 2, 34 * s, 5.5 * s, o.number, '#f3ecd8') : '';
    return one(W, H, W / 2, 44 * s, face(dir, W, b) + num);
  };
  /** A motor omnibus of 1914 (London's B-type): open top with garden seats, stairs behind, boards along the side. */
  T.omnibus = (o = {}) => {
    const s = o.s ?? 1, c = o.c ?? '#b3241e', dir = o.dir ?? 1, W = 66 * s, H = 50 * s, S = (n) => f(n * s);
    let b = '';
    // passengers on top
    const hats = ['#25252a', '#d9c27a', '#3a3a44', '#c75b6a', '#25252a'];
    for (let i = 0; i < 5; i++) b += `<circle cx="${S(12 + i * 8.6)}" cy="${S(8.5)}" r="${S(2)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(9.4 + i * 8.6)} ${S(7.6)}h${S(5.2)}l${S(-1)} ${S(-2.4)}h${S(-3.2)}Z" fill="${P.ink(hats[i])}"/>`;
    // the decency board with its advertisement, the lower saloon, the bonnet
    b += P.fill(`M${S(6)} ${S(10)}H${S(56)}V${S(19)}H${S(6)}Z`, o.ad ?? '#e9d27a', { w: .5 });
    b += text(31 * s, 17 * s, 6.2 * s, o.adText ?? '', '#1d1a17').replace('<text', `<text textLength="${S(42)}" lengthAdjust="spacingAndGlyphs"`);
    b += P.fill(`M${S(4)} ${S(19)}H${S(57)}V${S(37)}H${S(4)}Z`, c, { w: .6 });
    for (let i = 0; i < 4; i++) b += `<rect x="${S(7 + i * 11.6)}" y="${S(21)}" width="${S(9.4)}" height="${S(7)}" fill="${glass()}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>`;
    b += text(30 * s, 34.4 * s, 4.6 * s, o.fleet ?? 'GENERAL', '#e7c35a');
    b += P.shade(`M${S(4)} ${S(34)}H${S(57)}V${S(37)}H${S(4)}Z`, c, .25);
    b += P.fill(`M${S(57)} ${S(24)}H${S(64)}L${S(65)} ${S(37)}H${S(57)}Z`, '#3b4a3e', { w: .55 });
    b += `<circle cx="${S(55)}" cy="${S(15)}" r="${S(2)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(52.6)} ${S(14)}h${S(4.8)}l${S(-.8)} ${S(-2)}h${S(-3.2)}Z" fill="${P.ink('#2a2a30')}"/><path d="M${S(53)} ${S(17)}h${S(4)}v${S(7)}h${S(-4)}Z" fill="${P.ink('#2f3440')}"/>`;
    b += `<path d="M${S(4)} ${S(19)}q${S(-5)} ${S(6)} 0 ${S(18)}" fill="none" stroke="${P.keyC()}" stroke-width="${S(.8)}"/>`;
    b += `<circle cx="${S(64)}" cy="${S(29)}" r="${S(1.6)}" fill="${lamp() ? P.glow('#fff2c0') : P.ink('#d9b45a')}"/>` + halo(64 * s, 29 * s, 8 * s);
    b += wheel(14 * s, 41 * s, 6 * s, '#2b2622', 10, '#1d1a17') + wheel(52 * s, 42 * s, 5 * s, '#2b2622', 10, '#1d1a17');
    return one(W, H, W / 2, 47 * s, face(dir, W, b));
  };
  /**
   * Horse and carriage: a fiacre (a closed or open carriage with its coachman on the box) drawn by one or two horses,
   * in two frames of the trot. o: { body, horse, horses, hood, s, wheelC, cab: hansom }
   */
  T.fiacre = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, n = o.horses ?? 2, W = 96 * s, H = 50 * s, S = (k) => f(k * s);
    const body = o.body ?? '#22262a', horse = o.horse ?? '#7a4a2a', wc = o.wheelC ?? '#c8962e';
    const frame = (st) => {
      let b = '';
      // the carriage
      b += P.fill(`M${S(8)} ${S(20)}Q${S(6)} ${S(34)} ${S(16)} ${S(36)}H${S(40)}Q${S(44)} ${S(30)} ${S(42)} ${S(22)}H${S(30)}L${S(26)} ${S(16)}H${S(12)}Z`, body, { w: .6 });
      b += P.fill(`M${S(10)} ${S(20)}Q${S(4)} ${S(8)} ${S(16)} ${S(6)}Q${S(20)} ${S(12)} ${S(22)} ${S(18)}Z`, o.hood ?? '#2e2b28', { w: .5 });
      b += `<path d="M${S(17)} ${S(24)}H${S(28)}V${S(32)}H${S(17)}Z" fill="${glass('#4b5560')}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>`;
      b += `<path d="M${S(9)} ${S(28)}H${S(41)}" stroke="${P.ink(o.line ?? '#c8962e')}" stroke-width="${S(.6)}"/>`;
      // the coachman on the box
      b += P.fill(`M${S(36)} ${S(22)}L${S(37)} ${S(11)}H${S(43)}L${S(44)} ${S(22)}Z`, '#1f2226', { w: .5 });
      b += `<circle cx="${S(40)}" cy="${S(8.6)}" r="${S(2.3)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(37.4)} ${S(7.4)}h${S(5.2)}M${S(38.2)} ${S(7.4)}v${S(-3.2)}h${S(3.6)}v${S(3.2)}" fill="${P.ink('#1d1a17')}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1)}"/>`;
      b += `<path d="M${S(43)} ${S(14)}L${S(60)} ${S(18)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.5)}"/>`;
      b += `<path d="M${S(42)} ${S(30)}L${S(58)} ${S(26)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1)}"/>`;
      b += wheel(16 * s, 38 * s, 9 * s, '#2b2622', 10, wc) + wheel(38 * s, 40 * s, 7 * s, '#2b2622', 10, wc);
      // the horses, the far one a shade darker
      for (let k = n - 1; k >= 0; k--) b += horseAt(P, (56 + k * 3) * s, (24 - k * 1.5) * s, s, k ? shadow(P.c(horse), .18) : horse, (st + k) % 2);
      if (lamp()) b += `<rect x="${S(43)}" y="${S(18)}" width="${S(2.4)}" height="${S(3)}" fill="${P.glow('#ffe2a0')}"/>` + halo(44 * s, 19.5 * s, 7 * s);
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 47 * s, [frame(0), frame(1)], 5);
  };
  /** A motor car of 1914, an open tourer with brass lamps. */
  T.motorcar = (o = {}) => {
    const s = o.s ?? 1, c = o.c ?? '#2f4a3a', dir = o.dir ?? 1, W = 52 * s, H = 28 * s, S = (k) => f(k * s);
    let b = P.fill(`M${S(4)} ${S(20)}V${S(13)}Q${S(4)} ${S(10)} ${S(9)} ${S(10)}H${S(30)}L${S(34)} ${S(13)}H${S(44)}Q${S(49)} ${S(13)} ${S(49)} ${S(17)}V${S(20)}Z`, c, { w: .6 });
    b += P.fill(`M${S(6)} ${S(10)}Q${S(10)} ${S(2)} ${S(20)} ${S(4)}L${S(22)} ${S(10)}Z`, '#2a2622', { w: .5 });
    b += `<circle cx="${S(26)}" cy="${S(7)}" r="${S(2)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(23.6)} ${S(6)}h${S(4.8)}l${S(-1)} ${S(-2)}h${S(-3)}Z" fill="${P.ink('#5a4a3a')}"/><path d="M${S(30)} ${S(9)}L${S(33)} ${S(13)}" stroke="${P.ink('#2a2a2a')}" stroke-width="${S(.7)}"/>`;
    b += `<path d="M${S(6)} ${S(15)}H${S(46)}" stroke="${P.light(c, .35)}" stroke-width="${S(.6)}"/>`;
    b += `<circle cx="${S(48)}" cy="${S(13)}" r="${S(1.6)}" fill="${lamp() ? P.glow('#fff2c0') : P.ink('#d9b45a')}"/>` + halo(48 * s, 13 * s, 8 * s);
    b += wheel(12 * s, 21 * s, 5 * s, '#2b2622', 10, '#1d1a17') + wheel(41 * s, 21 * s, 5 * s, '#2b2622', 10, '#1d1a17');
    return one(W, H, W / 2, 26 * s, face(dir, W, b));
  };
  /** A cart: a carter's wagon or a market barrow with one horse. o: { load (colour), s } */
  T.cart = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 64 * s, H = 36 * s, S = (k) => f(k * s);
    const frame = (st) => {
      let b = P.fill(`M${S(4)} ${S(16)}H${S(34)}V${S(24)}H${S(4)}Z`, o.c ?? '#7a5a3a', { w: .55 });
      b += P.fill(`M${S(6)} ${S(16)}Q${S(19)} ${S(4)} ${S(32)} ${S(16)}Z`, o.load ?? '#d9c48a', { w: .5 });
      b += `<circle cx="${S(30)}" cy="${S(11)}" r="${S(1.8)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(28)} ${S(12.6)}h${S(4)}v${S(4)}h${S(-4)}Z" fill="${P.ink('#4a4a52')}"/>`;
      b += wheel(14 * s, 26 * s, 6.5 * s, '#3a2a1e', 8, '#3a2a1e');
      b += horseAt(P, 46 * s, 14 * s, s * .85, o.horse ?? '#8a6a4a', st);
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 33 * s, [frame(0), frame(1)], 4);
  };

  // ---------- on the water ----------
  /**
   * A steamer broadside: hull, saloon, funnel (in its company's colours) and a stern flag; smoke from the funnel.
   * o: { hull, house, funnel: [body, top], s, paddle, flag (nation) }
   */
  T.steamer = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 100 * s, H = 52 * s, S = (k) => f(k * s);
    const [fb, ft] = o.funnel ?? ['#e2c15a', '#1d1a17'];
    let b = '';
    b += `<path d="M${S(56)} ${S(6)}V${S(30)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1)}"/>`;
    b += P.fill(`M${S(42)} ${S(30)}L${S(43)} ${S(12)}H${S(51)}L${S(52)} ${S(30)}Z`, fb, { w: .6 }) + P.fill(`M${S(43)} ${S(12)}H${S(51)}V${S(16)}H${S(43)}Z`, ft, { w: .5 });
    b += P.fill(`M${S(18)} ${S(38)}V${S(28)}H${S(78)}V${S(38)}Z`, o.house ?? '#f1ece0', { w: .6 });
    for (let i = 0; i < 9; i++) b += `<rect x="${S(21 + i * 6.3)}" y="${S(30.4)}" width="${S(3.4)}" height="${S(3.4)}" rx="${S(1.7)}" fill="${glass('#4a5868')}"/>`;
    b += P.fill(`M${S(16)} ${S(28)}H${S(80)}V${S(26)}H${S(16)}Z`, '#d8cfbe', { w: .45 });
    b += P.fill(`M${S(2)} ${S(36)}H${S(97)}L${S(90)} ${S(46)}H${S(10)}Q${S(4)} ${S(44)} ${S(2)} ${S(36)}Z`, o.hull ?? '#26292e', { w: .6 });
    b += `<path d="M${S(6)} ${S(43)}H${S(92)}" stroke="${P.ink(o.boot ?? '#a8382e')}" stroke-width="${S(1.6)}"/>`;
    if (o.paddle) b += P.fill(`M${S(36)} ${S(38)}A${S(9)} ${S(9)} 0 0 1 ${S(54)} ${S(38)}Z`, o.house ?? '#f1ece0', { w: .55 }) + `<path d="M${S(38)} ${S(37)}A${S(7)} ${S(7)} 0 0 1 ${S(52)} ${S(37)}" fill="none" stroke="${P.ink('#7a6a52')}" stroke-width="${S(.6)}" stroke-dasharray="${S(1.4)} ${S(1)}"/>`;
    if (lamp()) b += `<circle cx="${S(56)}" cy="${S(7)}" r="${S(1.2)}" fill="${P.glow('#fff2c0')}"/>` + halo(56 * s, 7 * s, 6 * s);
    const flagN = o.flag ?? P.flagNation;
    b += `<path d="M${S(6)} ${S(36)}V${S(22)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.7)}"/><g transform="translate(${S(6)} ${S(22)}) scale(-1 1)">${(FLAGS[flagN] ?? FLAGS.GB)(7 * s, 4.6 * s)}</g>`;
    // the wake
    b += `<path d="M${S(0)} ${S(46)}q${S(-6)} ${S(1)} ${S(-10)} ${S(3)}M${S(92)} ${S(45)}q${S(5)} ${S(2)} ${S(8)} ${S(4)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(1)}" fill="none" opacity=".7"/>`;
    return one(W, H, W / 2, 44 * s, face(dir, W, b), { puffs: [[dir > 0 ? 47 * s : W - 47 * s, 11 * s, s, false, -dir]] });
  };
  /** A tug, small and busy, a big funnel. */
  T.tug = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 50 * s, H = 36 * s, S = (k) => f(k * s);
    let b = P.fill(`M${S(18)} ${S(24)}L${S(19)} ${S(6)}H${S(26)}L${S(27)} ${S(24)}Z`, o.funnel ?? '#1d1a17', { w: .55 }) + P.fill(`M${S(19)} ${S(9)}H${S(26)}V${S(11)}H${S(19)}Z`, o.band ?? '#c8442e', { k: false });
    b += P.fill(`M${S(12)} ${S(26)}V${S(19)}H${S(34)}V${S(26)}Z`, o.house ?? '#e9dfc8', { w: .5 });
    b += `<rect x="${S(28)}" y="${S(20.6)}" width="${S(4)}" height="${S(3)}" fill="${glass()}"/>`;
    b += P.fill(`M${S(2)} ${S(25)}H${S(48)}L${S(43)} ${S(32)}H${S(8)}Q${S(3)} ${S(30)} ${S(2)} ${S(25)}Z`, o.hull ?? '#2b2622', { w: .55 });
    b += `<path d="M${S(4)} ${S(30)}H${S(45)}" stroke="${P.ink('#a8382e')}" stroke-width="${S(1.1)}"/>`;
    return one(W, H, W / 2, 31 * s, face(dir, W, b), { puffs: [[dir > 0 ? 22.5 * s : W - 22.5 * s, 6 * s, s * 1.1, true, -dir]] });
  };
  /** A sailing boat. o: { rig: gaff lateen sprit (a Thames barge), sail colour, hull, s } */
  T.sail = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 48 * s, H = 58 * s, S = (k) => f(k * s), sc = o.sailC ?? '#f1e9d6';
    let b = `<path d="M${S(22)} ${S(46)}V${S(4)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(1)}"/>`;
    if (o.rig === 'lateen') b += P.fill(`M${S(4)} ${S(40)}L${S(40)} ${S(2)}Q${S(36)} ${S(26)} ${S(30)} ${S(42)}Z`, sc, { w: .55 }) + P.shade(`M${S(30)} ${S(42)}Q${S(36)} ${S(26)} ${S(40)} ${S(2)}L${S(34)} ${S(20)}Z`, sc, .15);
    else if (o.rig === 'sprit') b += P.fill(`M${S(23)} ${S(42)}V${S(6)}L${S(40)} ${S(4)}L${S(42)} ${S(40)}Z`, sc, { w: .55 }) + P.fill(`M${S(21)} ${S(40)}V${S(10)}L${S(8)} ${S(38)}Z`, sc, { w: .5 }) + `<path d="M${S(23)} ${S(40)}L${S(40)} ${S(5)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(.6)}"/>`;
    else b += P.fill(`M${S(23)} ${S(42)}V${S(5)}Q${S(34)} ${S(8)} ${S(40)} ${S(14)}L${S(42)} ${S(42)}Z`, sc, { w: .55 }) + P.fill(`M${S(21)} ${S(40)}V${S(8)}L${S(7)} ${S(40)}Z`, sc, { w: .5 }) + P.shade(`M${S(30)} ${S(42)}L${S(32)} ${S(9)}Q${S(36)} ${S(10)} ${S(40)} ${S(14)}L${S(42)} ${S(42)}Z`, sc, .12);
    b += P.fill(`M${S(4)} ${S(44)}H${S(44)}L${S(40)} ${S(50)}H${S(9)}Z`, o.hull ?? '#5a4232', { w: .55 });
    b += `<path d="M${S(6)} ${S(46.5)}H${S(42)}" stroke="${P.ink(o.strake ?? '#e2c15a')}" stroke-width="${S(.7)}"/>`;
    return one(W, H, W / 2, 49 * s, face(dir, W, b));
  };
  /** A gondola, with its gondolier rowing from the stern (two frames of the stroke). */
  T.gondola = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 84 * s, H = 40 * s, S = (k) => f(k * s);
    const frame = (st) => {
      let b = P.fill(`M${S(4)} ${S(30)}Q${S(10)} ${S(34)} ${S(40)} ${S(34)}Q${S(68)} ${S(34)} ${S(78)} ${S(24)}L${S(80)} ${S(16)}L${S(76)} ${S(18)}Q${S(70)} ${S(28)} ${S(40)} ${S(29)}Q${S(14)} ${S(29)} ${S(6)} ${S(24)}Z`, '#151517', { w: .5 });
      b += `<path d="M${S(76)} ${S(18)}h${S(4)}M${S(76.4)} ${S(20)}h${S(3.4)}M${S(76.8)} ${S(22)}h${S(2.8)}" stroke="${P.ink('#c9c2b0')}" stroke-width="${S(.7)}"/>`;
      if (o.felze) b += P.fill(`M${S(34)} ${S(29)}V${S(21)}Q${S(42)} ${S(18)} ${S(50)} ${S(21)}V${S(29)}Z`, '#1d1d22', { w: .45 });
      else b += `<path d="M${S(36)} ${S(28)}h${S(14)}" stroke="${P.ink('#8a2a2a')}" stroke-width="${S(2)}"/>`;
      // the gondolier: striped shirt, boater
      const gx = 14 * s, lean = st ? 1.6 : -1;
      b += `<path d="M${f(gx - 1.6 * s)} ${S(28)}L${f(gx - 1 * s + lean * s * .3)} ${S(18)}H${f(gx + 1.6 * s + lean * s * .3)}L${f(gx + 1.8 * s)} ${S(28)}Z" fill="${P.ink('#1f1f24')}"/>`;
      b += `<path d="M${f(gx - 2.6 * s + lean * s)} ${S(18)}L${f(gx - 2.2 * s + lean * s)} ${S(10)}H${f(gx + 2.2 * s + lean * s)}L${f(gx + 2.6 * s + lean * s)} ${S(18)}Z" fill="${P.ink('#f3efe4')}" stroke="${P.keyC()}" stroke-width="${f(.4 * s)}"/>`;
      for (let k = 0; k < 3; k++) b += `<path d="M${f(gx - 2.4 * s + lean * s)} ${S(12 + k * 2.4)}h${S(4.8)}" stroke="${P.ink('#2b4b9b')}" stroke-width="${S(.7)}"/>`;
      b += `<circle cx="${f(gx + lean * s)}" cy="${S(7.6)}" r="${S(2)}" fill="${P.ink('#d9ad86')}"/><path d="M${f(gx - 3.2 * s + lean * s)} ${S(6.4)}h${S(6.4)}M${f(gx - 2 * s + lean * s)} ${S(6.4)}v${S(-1.6)}h${S(4)}v${S(1.6)}" stroke="${P.ink('#d9c27a')}" stroke-width="${S(.9)}"/>`;
      b += `<path d="M${f(gx + 2 * s + lean * s)} ${S(12)}L${f(gx + (st ? 16 : 10) * s)} ${S(36)}" stroke="${P.ink('#6a4a2a')}" stroke-width="${S(.9)}"/>`;
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 32 * s, [frame(0), frame(1)], 1);
  };
  /** A caïque: long and slender, an ornate prow, oarsmen. */
  T.caique = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 70 * s, H = 26 * s, S = (k) => f(k * s);
    const frame = (st) => {
      let b = '';
      for (let i = 0; i < (o.rowers ?? 3); i++) {
        const x = 20 + i * 12;
        b += `<path d="M${S(x)} ${S(14)}L${S(x + (st ? -7 : 5))} ${S(24)}" stroke="${P.ink('#6a4a2a')}" stroke-width="${S(.8)}"/>`;
        b += `<path d="M${S(x - 2)} ${S(15)}L${S(x - 1.4 + (st ? -1 : 1))} ${S(8)}H${S(x + 1.4 + (st ? -1 : 1))}L${S(x + 2)} ${S(15)}Z" fill="${P.ink(i % 2 ? '#f2eee2' : '#c9d6e6')}"/><circle cx="${S(x + (st ? -1 : 1))}" cy="${S(6.4)}" r="${S(1.7)}" fill="${P.ink('#c98e6a')}"/><path d="M${S(x - 1.6 + (st ? -1 : 1))} ${S(5.2)}h${S(3.2)}v${S(-1.8)}h${S(-3.2)}Z" fill="${P.ink('#b8322c')}"/>`;
      }
      b += P.fill(`M${S(2)} ${S(13)}Q${S(30)} ${S(20)} ${S(62)} ${S(13)}L${S(68)} ${S(8)}L${S(64)} ${S(16)}Q${S(36)} ${S(24)} ${S(8)} ${S(18)}Z`, o.hull ?? '#f0e6cf', { w: .5 });
      b += `<path d="M${S(6)} ${S(15.4)}Q${S(32)} ${S(21)} ${S(62)} ${S(15)}" stroke="${P.ink(o.trim ?? '#c9962e')}" stroke-width="${S(.9)}" fill="none"/>`;
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 19 * s, [frame(0), frame(1)], 1.2);
  };
  /** A rowing boat with one oarsman. */
  T.rowboat = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, W = 36 * s, H = 22 * s, S = (k) => f(k * s);
    const frame = (st) => {
      let b = `<path d="M${S(17)} ${S(12)}L${S(st ? 6 : 26)} ${S(20)}M${S(19)} ${S(12)}L${S(st ? 9 : 30)} ${S(19)}" stroke="${P.ink('#6a4a2a')}" stroke-width="${S(.8)}"/>`;
      b += `<path d="M${S(16)} ${S(15)}L${S(16.6 + (st ? -1 : 1))} ${S(7)}H${S(20 + (st ? -1 : 1))}L${S(20.6)} ${S(15)}Z" fill="${P.ink(o.shirt ?? '#f2eee2')}"/><circle cx="${S(18.4 + (st ? -1 : 1))}" cy="${S(5.2)}" r="${S(1.8)}" fill="${P.ink('#d9ad86')}"/>`;
      b += P.fill(`M${S(3)} ${S(13)}H${S(33)}L${S(29)} ${S(18)}H${S(7)}Z`, o.hull ?? '#7a5a3a', { w: .5 });
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 17 * s, [frame(0), frame(1)], 1);
  };

  // ---------- people ----------
  /**
   * Strollers: one to four people walking together (two frames of the stride). o: { kinds, colours, n, s, seed,
   * dresses, coats } — in the crisis a newsboy may walk with them, at war a soldier on leave.
   */
  T.walkers = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, r = rng(o.seed ?? 3);
    let kinds = o.kinds ?? ['gent', 'lady'];
    if (P.war === 'war' && o.crisis !== false && r() < .5) kinds = kinds.map((k, i) => (i === 0 && k !== 'lady' ? 'soldier' : k));
    const dresses = o.dresses ?? ['#f3eee2', '#e8b9b3', '#c9d6e6', '#efe3c3'], coats = o.coats ?? ['#2f3440', '#4a3a30', '#3d4a3c'];
    const gap = 8 * s, W = (kinds.length - 1) * gap + 20 * s, H = 36 * s;
    const looks = kinds.map((k) => ({ k, c: k === 'lady' || k === 'girl' ? dresses[Math.floor(r() * dresses.length)] : coats[Math.floor(r() * coats.length)], parasol: k === 'lady' && r() < .4 ? dresses[Math.floor(r() * dresses.length)] : null, umbrella: r() < .7 }));
    const frame = (st) => face(dir, W, looks.map((p, i) => P.person(10 * s + i * gap, 34 * s, s * (p.k === 'child' ? 1 : .96 + (i % 2) * .06), p.k, { c: p.c, dir: 1, stride: (st + i) % 2, parasol: p.parasol, umbrella: p.umbrella })).join(''));
    return many(W, H, W / 2, 34 * s, [frame(0), frame(1)], o.fps ?? 3.2);
  };
  /** A column of soldiers marching in step, an officer at their head, a flag carried. o: { n, s, nation, flag } */
  T.column = (o = {}) => {
    const s = o.s ?? 1, dir = o.dir ?? 1, n = o.n ?? 8, gap = 7 * s, W = n * gap + 24 * s, H = 52 * s, nation = o.nation ?? P.nation;
    const frame = (st) => {
      let b = '';
      for (let i = 0; i < n; i++) b += P.person(10 * s + i * gap, 50 * s, s, 'soldier', { dir: 1, stride: st, nation });
      b += P.person(10 * s + n * gap + 4 * s, 50 * s, s * 1.02, 'officer', { dir: 1, stride: st, nation });
      if (o.flag !== false) {
        const fx = 10 * s + (n - 2) * gap;
        b += `<path d="M${f(fx + 2 * s)} ${f(40 * s)}V${f(10 * s)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${f(.9 * s)}"/><g transform="translate(${f(fx + 2 * s)} ${f(10 * s)}) scale(-1 1)">${(FLAGS[o.flag ?? P.flagNation] ?? FLAGS.AH)(12 * s, 8 * s)}</g>`;
      }
      return face(dir, W, b);
    };
    return many(W, H, W / 2, 50 * s, [frame(0), frame(1)], 2.4);
  };

  // ---------- the sky ----------
  /** A cumulus in the card's light: a flat base, a heaped top, the lithographer's shade beneath. */
  T.cloud = (o = {}) => {
    const r = rng(o.seed ?? 1), w = o.w ?? 90, h = o.h ?? w * .42, W = w + 8, H = h + 6;
    const c = L.cloudInk, n = 5 + Math.floor(r() * 3);
    let top = `M4 ${f(H - 4)}`;
    for (let i = 0; i < n; i++) {
      const x0 = 4 + (i / n) * w, x1 = 4 + ((i + 1) / n) * w, mid = 1 - Math.abs(((i + .5) / n) - .5) * 1.5, hy = H - 4 - h * (.45 + .55 * mid) * (.75 + r() * .3);
      top += `C${f(x0)} ${f(hy)} ${f(x1)} ${f(hy)} ${f(x1)} ${f(H - 4 - h * .25 * (i < n - 1 ? 1 : 0))}`;
    }
    top += `L${f(w + 4)} ${f(H - 4)}Z`;
    const base = `M4 ${f(H - 4)}Q${f(W / 2)} ${f(H - 4 - h * .38)} ${f(w + 4)} ${f(H - 4)}Z`;
    const sh = L.fog.near > 0 ? .5 : 1;
    const body = `<path d="${top}" fill="${c.body}"/><path d="${base}" fill="${c.shade}" opacity="${f(.85 * sh)}"/><path d="${top}" fill="none" stroke="${c.shade}" stroke-width=".8" opacity=".55"/>`
      + `<path d="M${f(w * .22)} ${f(H - 4 - h * .62)}q${f(w * .08)} ${f(-h * .25)} ${f(w * .2)} ${f(-h * .1)}" stroke="#ffffff" stroke-width="${f(h * .08)}" fill="none" opacity="${f(L.night > .5 ? .1 : .5)}" stroke-linecap="round"/>`;
    return one(W, H, 0, H, body);
  };
  /** A puff of smoke, soft and round. */
  T.puff = (o = {}) => {
    const r = o.r ?? 7, W = r * 2.4, H = r * 2.4, c = o.dark ? mix(L.sky.low, '#2a2622', .6) : mix(L.sky.low, '#d6d2ca', .55);
    return one(W, H, W / 2, H / 2, `<circle cx="${f(W / 2)}" cy="${f(H / 2)}" r="${f(r)}" fill="${c}" opacity=".75"/><circle cx="${f(W / 2 - r * .3)}" cy="${f(H / 2 - r * .3)}" r="${f(r * .55)}" fill="${lit(c, .25)}" opacity=".6"/>`);
  };
  /** A swift, wings up and down. */
  T.bird = (o = {}) => {
    const s = o.s ?? 1, W = 12 * s, H = 7 * s, c = P.ink(o.c ?? '#2a2a30'), edge = o.c ? ` stroke="${P.ink('#5a5a60')}" stroke-width=".5"` : '';
    return many(W, H, W / 2, H / 2, [`<path d="M0 ${f(2 * s)}Q${f(3 * s)} ${f(4.5 * s)} ${f(6 * s)} ${f(4 * s)}Q${f(9 * s)} ${f(4.5 * s)} ${f(12 * s)} ${f(2 * s)}Q${f(9 * s)} ${f(6 * s)} ${f(6 * s)} ${f(5.4 * s)}Q${f(3 * s)} ${f(6 * s)} 0 ${f(2 * s)}Z" fill="${c}"${edge}/>`,
      `<path d="M0 ${f(5.6 * s)}Q${f(3 * s)} ${f(3 * s)} ${f(6 * s)} ${f(4 * s)}Q${f(9 * s)} ${f(3 * s)} ${f(12 * s)} ${f(5.6 * s)}Q${f(9 * s)} ${f(4.6 * s)} ${f(6 * s)} ${f(5.2 * s)}Q${f(3 * s)} ${f(4.6 * s)} 0 ${f(5.6 * s)}Z" fill="${c}"${edge}/>`], o.c ? 3 : 6);
  };
  /** A flag in the wind, three frames of its wave, hung from its staff at the left. */
  T.flag = (o = {}) => {
    const w = o.w ?? 18, h = o.h ?? 11, nation = o.nation ?? P.flagNation, fl = FLAGS[nation] ?? FLAGS.AH, W = w + 2, H = h + 4;
    const frames = [0, 1, 2].map((k) => {
      const ph = k * 2.1, a = h * .14, wave = (x) => Math.sin(x / w * Math.PI * 1.6 - ph) * a * (x / w);
      let top = 'M0 2', bot = '';
      for (let i = 1; i <= 8; i++) { const x = w * i / 8; top += `L${f(x)} ${f(2 + wave(x))}`; }
      for (let i = 8; i >= 0; i--) { const x = w * i / 8; bot += `L${f(x)} ${f(2 + h + wave(x))}`; }
      const d = top + bot + 'Z', id = `fl${P.uid}${++flagN}`;
      let shade = '';
      for (let i = 0; i < 3; i++) { const x = w * (.18 + i * .3) + Math.sin(ph) * 2; shade += `<rect x="${f(x)}" y="0" width="${f(w * .12)}" height="${H}" fill="#000" opacity="${f(.08 + L.night * .2)}"/>`; }
      return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})"><g transform="translate(0 2)">${fl(w, h)}</g>${shade}<rect width="${W}" height="${H}" fill="${L.night > .3 ? '#0a1028' : '#fff'}" opacity="${f(L.night * .45)}"/></g><path d="${d}" fill="none" stroke="${P.keyC()}" stroke-width=".5"/>`;
    });
    return many(W, H, 0, 2, frames, 3.5);
  };
  /** A sprite drawn standing still into a layer, its anchor at (x, y): a carriage waiting, a boat moored. */
  T.place = (sp, x, y, k = 0) => `<g transform="translate(${f(x - sp.ax)} ${f(y - sp.ay)})">${(sp.frames ?? [sp.svg])[k].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  /** A glint on the water. */
  T.glint = (o = {}) => {
    const w = o.w ?? 18;
    return one(w, 3, w / 2, 1.5, `<path d="M1 1.5Q${f(w / 2)} 0 ${f(w - 1)} 1.5Q${f(w / 2)} 3 1 1.5Z" fill="${o.c ?? '#ffffff'}"/>`);
  };
  return T;
}

/** A horse in profile facing right, trotting (st 0 or 1); x, y: the withers. */
export function horseAt(P, x, y, s, c, st) {
  const S = (k) => f(k * s), X = (k) => f(x + k * s), Y = (k) => f(y + k * s);
  let b = '';
  const leg = (hx, a, back) => `<path d="M${X(hx)} ${Y(8)}L${X(hx + a)} ${Y(15)}L${X(hx + a * .4)} ${Y(21)}" fill="none" stroke="${back ? P.dark(c, .2) : P.ink(c)}" stroke-width="${S(2)}" stroke-linecap="round"/><path d="M${X(hx + a * .4 - 1)} ${Y(21)}h${S(2.4)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1.2)}"/>`;
  const sw = st ? 3 : -2.4;
  b += leg(-11, -sw, true) + leg(5, sw, true);
  b += `<path d="M${X(-16)} ${Y(3)}q${S(-5)} ${S(4)} ${S(-4)} ${S(12)}" fill="none" stroke="${P.ink(shadow(P.c(c), .4))}" stroke-width="${S(2.4)}" stroke-linecap="round"/>`;
  b += P.fill(`M${X(-15)} ${Y(1)}Q${X(-14)} ${Y(-3)} ${X(-6)} ${Y(-2)}H${X(4)}Q${X(9)} ${Y(-3)} ${X(10)} ${Y(1)}Q${X(11)} ${Y(9)} ${X(5)} ${Y(10)}H${X(-10)}Q${X(-16)} ${Y(9)} ${X(-15)} ${Y(1)}Z`, c, { w: .55 });
  b += P.fill(`M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}Q${X(12)} ${Y(-14)} ${X(15)} ${Y(-12)}L${X(19)} ${Y(-5)}Q${X(19)} ${Y(-3)} ${X(17)} ${Y(-3)}L${X(13)} ${Y(-6)}L${X(10)} ${Y(3)}Z`, c, { w: .55 });
  b += `<path d="M${X(9)} ${Y(-10)}L${X(11.4)} ${Y(-15)}L${X(12.4)} ${Y(-11)}" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width="${S(.4)}"/>`;
  b += `<path d="M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}" stroke="${P.ink('#2a1e16')}" stroke-width="${S(1.4)}"/>`;
  b += `<path d="M${X(-6)} ${Y(-2)}V${Y(7)}M${X(-8)} ${Y(2)}H${X(6)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(.7)}"/>`;
  b += leg(-12, sw * .8, false) + leg(4, -sw * .8, false);
  return b;
}
