// Hamburg from the Steinwerder quay, across the Elbe to St. Pauli: the Landungsbrücken of 1909 with their green domes
// and the water-gauge tower, the domed hall of the new Elbe tunnel, Bismarck in granite on the Stintfang, the Michel's
// copper spire over the roofs with its great clock keeping the hour, the Kaispeicher and the cranes of the Kaiserkai.
// A three-funnelled liner of the Hamburg-Amerika Linie goes down to the sea; harbour ferries, a tug, gulls; on our
// quay a portal crane, bales and barrels, a carter, sailors, emigrants with their bundles.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

export default {
  id: 'HAM',
  greet: 'GRUSS aus HAMBURG',
  nation: 'DE',
  flag: 'DE',
  flower: 'heather',
  flower2: 'forget-me-not',
  frame: { band: ['#306d88', '#1e4050'], gold: '#d4b05a', ink: '#8a1d24', leaf: ['#6e9a5a', '#2e5538'], year: '#7a2a26', halo: '#f5ebd2' },
  horizon: 258,
  clouds: 5,
  wind: 1,
  birds: { c: '#f4f3ee', n: 5, y: 112, s: 1.15 },
  pal: {
    key: '#28262a', brick: '#9b4b37', sand: '#dccdb0', sand2: '#b7a585', tuff: '#a39a8a', copper: '#4e9b87', wall: '#e1d3b9', wall2: '#c99b78',
    wall3: '#d6c0a1', roof: '#7d4838', water: '#56777d', ground: '#c7bb9f', glass: '#36434f', sash: '#ece2cc', iron: '#2a3940', gold: '#d6a845',
  },

  // a sprig of heather: tiny bells of pink-mauve along arching stems, needle leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(24, 5, 212, I.leaf[1], { shape: 'lance' }) + F.leaf(22, 5, 150, I.leaf[0], { shape: 'lance' }) + F.leaf(18, 4, 250, I.leaf[1], { shape: 'lance' });
    const sprig = (a, len, n, c, lite) => {
      let g = F.stem(`M0 6Q${(len * .15).toFixed(1)} ${(-len * .5).toFixed(1)} 0 ${(-len).toFixed(1)}`, I.leaf[1], 1.1);
      for (let i = 0; i < n; i++) { const t = (i + 1) / (n + 1), y = 6 - t * (len + 6), x = len * .15 * Math.sin(t * Math.PI) * .9; g += F.at(x + (i % 2 ? 2.4 : -2.4), y, F.bell(4.2 * (1.1 - t * .4), 5 * (1.1 - t * .4), i % 3 ? c : lite, { k: .4 }), i % 2 ? 120 : 240); }
      return F.at(0, 0, g, a);
    };
    s += sprig(-28, 26, 8, '#b85a9a', '#d88ac0') + sprig(18, 28, 9, '#a64a8c', '#cf7fb6') + sprig(-4, 32, 10, '#c66aa8', '#e2a0cc');
    return s;
  },
  // forget-me-nots: five round sky-blue petals, a yellow eye
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 6, 205, I.leaf[1], { shape: 'oval' }) + F.leaf(14, 6, 150, I.leaf[0], { shape: 'oval' });
    for (const [x, y, k] of [[-7, 3, .7], [7, 4, .65], [0, -2, 1]]) s += F.at(x, y, F.radial(5, 6, 6.4, '#6f9ad8', { shape: 'round', lite: '#a8c6ee', k: .4 }) + F.disc(1.8, '#f2d25a', { k: .3 }), 0, k);
    return s;
  },

  back(P, T) {
    let s = '';
    // the town on the Geest: roofs and church towers in the haze
    s += P.far(.8, () => P.row(26, 600, 232, { hMin: 14, hMax: 30, wMin: 12, wMax: 22, style: 'north', seed: 44, walls: ['#cfc2ad', '#c9a991', '#d8cbb6'], roofC: '#8a6a5e', placard: false, flagSpot: false, lit: 1.4 }));
    s += P.far(.78, () => P.fill(P.rect(84, 196, 6, 36), 'brick') + P.fill(P.spire(87, 197, 9, 26), 'copper') + P.fill(P.rect(214, 204, 5, 28), 'brick') + P.fill(P.spire(216.5, 205, 7, 20), 'copper'));
    s += P.smoke(150, 222, .7, { dark: true }) + P.smoke(560, 214, .8, { dark: true });
    // the Michel
    s += P.far(.5, () => michel(P, 444, 242, 157));
    // the Stintfang: trees, the Seewarte, Bismarck in granite
    s += P.far(.55, () => {
      let d = P.fill('M300 246C316 218 352 206 392 212C420 216 440 226 460 246Z', P.L.leaf.dark ?? '#6a6a52', { w: .5 });
      for (const [x, y, k] of [[318, 236, .5], [342, 226, .55], [404, 226, .5], [432, 236, .45], [452, 244, .4]]) d += P.tree(x, y, k, 'round');
      d += bismarck(P, 372, 222, .9);
      return d;
    });
    // St. Pauli along the Hafenstraße, tall and narrow
    s += P.far(.42, () => P.row(26, 128, 252, { hMin: 40, hMax: 58, wMin: 16, wMax: 24, style: 'north', seed: 7, walls: ['#d7c6aa', '#c4957a', '#e0d0b6', '#b9a088'], roofC: '#6f4436' }));
    // the Kaispeicher with its time-ball tower, the cranes of the Kaiserkai
    s += P.far(.48, () => kaispeicher(P, 470, 252));
    s += P.far(.45, () => P.row(458, 600, 254, { hMin: 18, hMax: 30, wMin: 20, wMax: 30, style: 'north', seed: 15, walls: ['#b7735a', '#a9664e', '#c28268'], roofC: '#5a3a30', placard: false }));
    // the Elbe tunnel's domed hall and the Landungsbrücken
    s += P.far(.36, () => tunnelHall(P, 142, 256) + landing(P, 176, 382, 258));
    // the river
    s += P.water(258, 380, { seed: 3, shimmer: 10, x0: 40, x1: 560 });
    s += reflect(P, 176, 382, 260, 22, '#a39a8a', 4) + reflect(P, 132, 172, 260, 16, '#4e9b87', 7) + reflect(P, 26, 128, 260, 18, '#c9b49a', 9) + reflect(P, 432, 456, 260, 30, '#4e9b87', 11);
    // the pontoons before the Landungsbrücken, with their bridges up to the quay
    s += P.far(.32, () => pontoons(P, 150, 410, 262));
    // ships: the liner going down to the sea, ferries crossing, a tug
    s += P.far(.25, () => P.cross(liner(P, -1, 1), { y: 300, dir: -1, dur: 170, rest: .3, offset: 40 }));
    s += P.cross(ferry(P, 1, .62), { y: 278, dir: 1, dur: 60, rest: .35, offset: 5 });
    s += P.cross(T.tug({ s: .72, dir: -1, funnel: '#2a2622', band: '#c8442e', house: '#e8dcc4' }), { y: 318, dir: -1, dur: 44, rest: .5, offset: 20 });
    s += P.cross(ferry(P, -1, .8), { y: 336, dir: -1, dur: 52, rest: .4, offset: 33 });
    s += P.cross(ewer(P, 1, .9), { y: 344, dir: 1, dur: 120, rest: .2, offset: 70 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // our quay: its granite edge, the cobbles
    s += P.fill(P.rect(20, 348, 562, 6), 'tuff', { w: .6 }) + P.lite(P.rect(20, 348, 562, 1.6), 'tuff', .3);
    for (let x = 28; x < 580; x += 26) s += P.line(`M${x} 349.5V354`, '#5a5650', .4, { op: .6 });
    s += P.paving(354, 380, { vx: 320, seed: 9 });
    // the portal crane on the left, its jib out over the water, a sling of bales hanging
    s += crane(P, 70, 354, 1);
    // bales, barrels and a crate stacked on the quay
    s += cargo(P, 128, 356);
    s += P.setStreet(368, 40, 560, 1);
    s += P.cross(T.cart({ s: 1.05, load: '#c8b48a', horse: '#6a4a32', c: '#5a4a3a' }), { y: 366, dir: 1, dur: 46, rest: .45, offset: 14 });
    return s;
  },

  front(P, T) {
    let s = '';
    // bollards with their hawsers, a lamp
    for (const x of [212, 372, 492]) s += bollard(P, x, 352, 1.1);
    s += P.lamp(470, 360, 1.08, 'bracket', { h: 70 }) + P.flagAt(473, 300) + P.lamp(176, 356, .96, 'single', { h: 66 });
    // emigrants with their bundles and a trunk, a sailor, a lady and gentleman, a fishwife
    s += emigrants(P, 236, 370);
    s += P.person(342, 368, 1.12, 'sailor', { c: '#1f2a44', legs: '#1f2a44', dir: -1 }) + P.person(356, 370, 1.12, 'lady', { c: '#e9e2d0', parasol: '#c9d6e6', dir: -1 });
    s += fishwife(P, 520, 372, 1.14);
    s += P.figure(410, 410, .92, 'gent', { c: '#2c3346', arm: 15 }) + P.figure(442, 413, .9, 'lady', { c: '#ece6d6', sash: '#6f9ad8', parasol: '#f2e8ec', flowers: ['#6f9ad8', '#f2ead6', '#c8463a'] });
    s += P.cross(T.walkers({ kinds: ['worker', 'worker'], s: 1.12, dir: -1, seed: 31, coats: ['#3a3d44', '#4a4038'] }), { y: 376, dir: -1, dur: 70, offset: 36, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady', 'child'], s: 1.1, dir: 1, seed: 6 }), { y: 378, dir: 1, dur: 84, offset: 8, z: 'fore' });
    return s;
  },
};

/** Broken strokes of colour under something, its reflection in the river. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.5) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 3 + r() * 13 * (1 - k * .6); if (r() < .75 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.5" opacity=".5" stroke-linecap="round"/>`;
}

// ---------- St. Michaelis ----------
/** The Michel: the brick tower with its great clock, a stone stage, the copper tambour, cupola, lantern and spire. */
function michel(P, cx, by, H) {
  const { f } = P, Y = (k) => by - k * H;
  let s = '';
  // the church's copper roof behind the tower
  s += P.fill(P.poly([[cx - 58, Y(.1)], [cx - 34, Y(.25)], [cx + 38, Y(.25)], [cx + 62, Y(.1)]]), 'copper', { w: .5 }) + P.shade(P.poly([[cx + 14, Y(.25)], [cx + 38, Y(.25)], [cx + 62, Y(.1)], [cx + 22, Y(.1)]]), 'copper', .25);
  for (let i = 1; i < 6; i++) s += P.line(`M${f(cx - 58 + i * 20)} ${f(Y(.1))}L${f(cx - 34 + i * 12)} ${f(Y(.25))}`, P.dark('copper', .2), .4, { op: .7 });
  // the brick shaft with sandstone corners and a tall window
  const w = .17 * H, top = Y(.5);
  s += P.fill(P.rect(cx - w / 2, top, w, by - top), 'brick') + P.shade(P.rect(cx + w * .18, top, w * .32, by - top), 'brick', .22);
  s += P.stipple(P.rect(cx - w / 2, top, w, by - top), 'brick', 46, { box: [cx - w / 2, top, w, by - top], op: .35 });
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * w / 2 - (k > 0 ? 3.4 : 0), top, 3.4, by - top), 'sand', { w: .4 });
  s += P.fill(P.arch(cx - 4.5, Y(.34), 9, .15 * H), 'glass', { w: .5 }) + P.line(`M${cx} ${f(Y(.33))}V${f(Y(.2))}`, 'sand2', .5);
  for (const y of [Y(.19), Y(.36)]) s += P.fill(P.rect(cx - w / 2 - 1.5, y, w + 3, 2.4), 'sand', { w: .4 });
  // the great clock, keeping Hamburg's time
  s += P.fill(P.rect(cx - w / 2 + 3, Y(.495), w - 6, .11 * H), 'sand', { w: .4 });
  s += P.clock(cx, Y(.44), .046 * H, { tz: 0, face: '#2b2a28', rim: '#d6a845', hands: '#e8c25a' }) + goldTicks(P, cx, Y(.44), .046 * H);
  // the stone stage over it, round-arched, with its balustrade
  const sw = .15 * H, st = Y(.57);
  s += P.fill(P.rect(cx - w / 2 - 2, top - 2.6, w + 4, 3), 'sand2', { w: .45 });
  s += P.fill(P.rect(cx - sw / 2, st, sw, top - 2.6 - st), 'sand') + P.shade(P.rect(cx + sw * .2, st, sw * .3, top - 2.6 - st), 'sand', .2);
  for (const k of [-.25, .25]) s += P.fill(P.arch(cx + k * sw - 2.4, st + 2.4, 4.8, top - st - 6.6), '#2b2a2c', { w: .3 });
  s += P.fill(P.rect(cx - sw / 2 - 1.8, st - 2.4, sw + 3.6, 2.6), 'sand2', { w: .4 });
  for (let i = 0; i <= 7; i++) s += P.line(`M${f(cx - sw / 2 - 1 + i * (sw + 2) / 7)} ${f(st - 2.4)}v-3`, 'sand', .9);
  s += P.line(`M${f(cx - sw / 2 - 1.8)} ${f(st - 5.6)}h${f(sw + 3.6)}`, 'sand', 1);
  // the copper tambour: tall arched openings between white columns
  const tw = .13 * H, tt = Y(.665);
  s += P.fill(P.rect(cx - tw / 2, tt, tw, st - 5.6 - tt), 'copper') + P.shade(P.rect(cx + tw * .2, tt, tw * .3, st - 5.6 - tt), 'copper', .25);
  for (const k of [-.27, 0, .27]) s += P.fill(P.arch(cx + k * tw - 1.8, tt + 3, 3.6, st - tt - 11), '#243034', { w: .3 });
  for (const k of [-.5, -.135, .135, .5]) s += P.line(`M${f(cx + k * tw)} ${f(tt + 1)}V${f(st - 6)}`, 'sand', 1.1);
  // the bell cupola, the colonnaded lantern, the little cupola, the spire
  s += P.fill(`M${f(cx - tw * .62)} ${f(tt)}C${f(cx - tw * .64)} ${f(Y(.71))} ${f(cx - tw * .24)} ${f(Y(.72))} ${f(cx - tw * .25)} ${f(Y(.745))}H${f(cx + tw * .25)}C${f(cx + tw * .24)} ${f(Y(.72))} ${f(cx + tw * .64)} ${f(Y(.71))} ${f(cx + tw * .62)} ${f(tt)}Z`, 'copper', { w: .55 });
  s += P.shade(`M${f(cx + tw * .12)} ${f(tt)}C${f(cx + tw * .22)} ${f(Y(.71))} ${f(cx + tw * .16)} ${f(Y(.73))} ${f(cx + tw * .25)} ${f(Y(.745))}C${f(cx + tw * .24)} ${f(Y(.72))} ${f(cx + tw * .64)} ${f(Y(.71))} ${f(cx + tw * .62)} ${f(tt)}Z`, 'copper', .25);
  s += P.fill(P.rect(cx - tw * .68, tt - 1.2, tw * 1.36, 2.4), 'copper', { w: .4 });
  const lw = .075 * H, lb = Y(.745), lt = Y(.815);
  s += P.fill(P.rect(cx - lw / 2, lt, lw, lb - lt), '#263032', { w: .4 });
  for (let i = 0; i < 5; i++) s += P.fill(P.rect(cx - lw / 2 + i * (lw - 1.8) / 4, lt, 1.8, lb - lt), 'sand', { w: .25 });
  s += P.fill(P.rect(cx - lw / 2 - 1.6, lt - 2.2, lw + 3.2, 2.6), 'copper', { w: .4 });
  s += P.fill(P.dome(cx, lt - 2.2, lw * .46, .035 * H), 'copper', { w: .45 });
  s += P.fill(`M${f(cx - 2.6)} ${f(Y(.85))}Q${f(cx - 4)} ${f(Y(.875))} ${f(cx - 1.4)} ${f(Y(.9))}L${f(cx)} ${f(Y(.975))}L${f(cx + 1.4)} ${f(Y(.9))}Q${f(cx + 4)} ${f(Y(.875))} ${f(cx + 2.6)} ${f(Y(.85))}Z`, 'copper', { w: .45 });
  s += `<circle cx="${cx}" cy="${f(Y(.978))}" r="1.6" fill="${P.ink('gold')}"/>` + P.line(`M${cx} ${f(Y(.985))}v-4.6M${cx - 2.2} ${f(Y(.998))}h4.4`, 'gold', .8);
  return s;
}

/** Gold hour marks over a dark dial (the kit's own marks are dark and vanish on it). */
function goldTicks(P, x, y, r) {
  let d = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d += `M${P.f(x + Math.sin(a) * r * .7)} ${P.f(y - Math.cos(a) * r * .7)}L${P.f(x + Math.sin(a) * r * .88)} ${P.f(y - Math.cos(a) * r * .88)}`; }
  return `<path d="${d}" stroke="${P.ink('#e2b84a')}" stroke-width="${P.f(Math.max(.5, r * .1))}" stroke-linecap="round"/>`;
}

/** Bismarck as Roland, in granite on the Stintfang, his sword before him. */
function bismarck(P, x, by, s) {
  const f = P.f, c = '#b8b2a6';
  let d = P.fill(`M${f(x - 9 * s)} ${by}L${f(x - 7 * s)} ${f(by - 18 * s)}H${f(x + 7 * s)}L${f(x + 9 * s)} ${by}Z`, c, { w: .5 }) + P.shade(P.rect(x + 2 * s, by - 18 * s, 5 * s, 18 * s), c, .2);
  d += P.fill(P.rect(x - 8 * s, by - 20 * s, 16 * s, 2.4 * s), c, { w: .4 });
  d += P.fill(`M${f(x - 4.4 * s)} ${f(by - 20 * s)}L${f(x - 3.6 * s)} ${f(by - 38 * s)}Q${f(x)} ${f(by - 41 * s)} ${f(x + 3.6 * s)} ${f(by - 38 * s)}L${f(x + 4.4 * s)} ${f(by - 20 * s)}Z`, c, { w: .5 });
  d += `<circle cx="${x}" cy="${f(by - 42.5 * s)}" r="${f(2.6 * s)}" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  d += P.line(`M${x} ${f(by - 21 * s)}V${f(by - 36 * s)}M${f(x - 2.4 * s)} ${f(by - 33 * s)}h${f(4.8 * s)}`, P.dark(c, .3), .8 * s);
  return d;
}

/** The Kaispeicher A on the Kehrwiederspitze, its tower with the time ball; two jib cranes on the quay. */
function kaispeicher(P, x, by) {
  const f = P.f;
  let d = P.fill(P.rect(x, by - 34, 64, 34), 'wall2') + P.shade(P.rect(x + 52, by - 34, 12, 34), 'wall2', .2) + P.windows(x + 2, by - 32, 50, 30, 8, 4, { arched: true, ww: .45, lit: .6 });
  d += P.fill(P.poly([[x - 1, by - 34], [x + 6, by - 42], [x + 58, by - 42], [x + 65, by - 34]]), 'roof', { w: .5 });
  d += P.fill(P.rect(x + 22, by - 70, 14, 36), 'wall2') + P.shade(P.rect(x + 31, by - 70, 5, 36), 'wall2', .2) + P.fill(P.arch(x + 26, by - 64, 6, 12), 'glass', { w: .3 });
  d += P.fill(P.dome(x + 29, by - 70, 8, 7), 'copper', { w: .45 }) + P.line(`M${x + 29} ${by - 79}v-9`, '#3a3a3a', .9) + `<circle cx="${x + 29}" cy="${by - 85}" r="2.6" fill="${P.ink('#2a2a2a')}"/>`;
  for (const cx of [x + 80, x + 118]) {
    d += P.line(`M${cx - 6} ${by - 4}L${cx - 2} ${by - 28}M${cx + 6} ${by - 4}L${cx + 2} ${by - 28}`, 'iron', 1.1) + P.fill(P.rect(cx - 5, by - 34, 10, 7), 'iron', { w: .4 });
    d += P.line(`M${cx} ${by - 34}L${cx - 26} ${by - 56}`, 'iron', 1.4) + P.line(`M${cx + 4} ${by - 33}L${cx - 26} ${by - 56}M${cx - 26} ${by - 56}V${by - 36}`, 'iron', .5);
    d += P.fill(P.rect(cx - 28.5, by - 36, 5, 4), '#8a6a46', { w: .3 });
  }
  return d;
}

/** The domed entrance hall of the Elbe tunnel (1911): a square block under a great copper dome. */
function tunnelHall(P, cx, by) {
  const f = P.f;
  let d = P.fill(P.rect(cx - 20, by - 24, 40, 24), 'tuff') + P.shade(P.rect(cx + 10, by - 24, 10, 24), 'tuff', .2);
  d += P.windows(cx - 18, by - 22, 36, 20, 4, 2, { arched: true, ww: .45, lit: .7 });
  d += P.fill(P.rect(cx - 22, by - 27, 44, 3.4), 'sand2', { w: .45 });
  d += P.fill(P.dome(cx, by - 27, 17, 16), 'copper', { w: .6 }) + P.shade(`M${cx + 4} ${by - 27}C${cx + 6} ${by - 44} ${cx + 14} ${by - 46} ${cx + 17} ${by - 27}Z`, 'copper', .25);
  for (const k of [-10, -4, 2, 8]) d += P.line(`M${cx + k} ${by - 28}Q${cx + k * .7} ${by - 40} ${cx} ${by - 47}`, P.light('copper', .3), .5, { op: .7 });
  d += P.fill(P.rect(cx - 2.6, by - 52, 5.2, 6), 'copper', { w: .4 }) + P.fill(P.dome(cx, by - 52, 3.2, 3), 'copper', { w: .35 });
  return d;
}

/** The Landungsbrücken: a long hall of tuff stone, green cupolas along its roof, the water-gauge tower at its east end. */
function landing(P, x0, x1, by) {
  const f = P.f;
  let d = '';
  const top = by - 26;
  d += P.fill(P.rect(x0, top, x1 - x0, 26), 'tuff') + P.stipple(P.rect(x0, top, x1 - x0, 26), 'tuff', 50, { box: [x0, top, x1 - x0, 26], op: .3 });
  d += P.windows(x0 + 2, top + 3, x1 - x0 - 4, 20, 22, 2, { arched: true, ww: .5, lit: .8 });
  d += P.fill(P.rect(x0 - 2, top - 3, x1 - x0 + 4, 3.6), 'sand2', { w: .45 });
  d += P.fill(P.poly([[x0, top - 3], [x0 + 6, top - 10], [x1 - 6, top - 10], [x1, top - 3]]), 'copper', { w: .5 });
  // cupolas along the roof
  for (let i = 0; i < 6; i++) {
    const cx = x0 + 22 + i * (x1 - x0 - 44) / 5;
    d += P.fill(P.rect(cx - 6, top - 18, 12, 9), 'tuff', { w: .4 }) + P.fill(P.arch(cx - 2, top - 16, 4, 6), 'glass', { w: .25 });
    d += P.fill(P.dome(cx, top - 18, 7.4, 8), 'copper', { w: .5 }) + P.line(`M${cx} ${top - 29}v-4`, 'copper', .9);
  }
  // the water-gauge tower with its clock and the gauge in the wall
  const tx = x1 - 22, tt = by - 78;
  d += P.fill(P.rect(tx - 9, tt, 18, by - tt), 'tuff') + P.shade(P.rect(tx + 4, tt, 5, by - tt), 'tuff', .2);
  d += P.fill(P.rect(tx - 2, tt + 26, 4, 38), '#2f3a40', { w: .3 });
  for (let k = 0; k < 8; k++) d += P.line(`M${tx - 2} ${tt + 28 + k * 4.4}h${k % 2 ? 2 : 4}`, '#e8e2d2', .5);
  d += P.clock(tx, tt + 12, 5.2, { tz: 0, face: '#f2ecda', rim: '#d6a845' });
  d += P.fill(P.rect(tx - 10.5, tt - 3, 21, 3.4), 'sand2', { w: .4 }) + P.fill(P.onion(tx, tt - 3, 18, 16), 'copper', { w: .5 }) + P.line(`M${tx} ${tt - 19}v-6`, 'gold', .9);
  // the west tower, smaller
  d += P.fill(P.rect(x0 + 2, by - 50, 13, 50), 'tuff', { w: .5 }) + P.fill(P.onion(x0 + 8.5, by - 50, 14, 12), 'copper', { w: .45 }) + P.fill(P.arch(x0 + 6, by - 44, 5, 9), 'glass', { w: .25 });
  d += P.flag(tx, tt - 25, .8, 'DE', { h: 18 });
  return d;
}

/** The pontoons: low floating stages with their shelters, the bridges that ride up and down with the tide. */
function pontoons(P, x0, x1, y) {
  const f = P.f;
  let d = P.fill(P.rect(x0, y - 3, x1 - x0, 5), '#4a4038', { w: .5 }) + P.lite(P.rect(x0, y - 3, x1 - x0, 1.2), '#4a4038', .3);
  for (let x = x0 + 18; x < x1 - 10; x += 52) {
    d += P.fill(P.rect(x, y - 10, 30, 7), '#d8ccb2', { w: .4 }) + P.fill(P.poly([[x - 2, y - 10], [x + 2, y - 14], [x + 28, y - 14], [x + 32, y - 10]]), 'copper', { w: .4 });
    d += P.windows(x + 1, y - 9.4, 28, 6, 5, 1, { ww: .5, wh: .7, lit: .8 });
    d += P.line(`M${x + 34} ${y - 3}L${x + 46} ${y - 12}`, '#3a3430', 1.6) + P.line(`M${x + 34} ${y - 5}L${x + 46} ${y - 14}`, '#8a8070', .5);
  }
  d += P.crowd(x0 + 4, x1 - 6, y - 3, 12, { s: .34, seed: 4 });
  for (let x = x0 + 40; x < x1; x += 104) d += P.lamp(x, y - 3, .34, 'single', { h: 40 });
  return d;
}

// ---------- the liner and the harbour craft ----------
/** A three-funnelled liner of the Hamburg-Amerika Linie: black hull, white decks, buff funnels, the eagle on her bow. */
function liner(P, dir, s) {
  const W = 300 * s, H = 96 * s, S = (k) => P.f(k * s), f = P.f;
  const lit = P.L.windows > .2;
  let b = '';
  // masts and the wireless aerial between them
  b += P.line(`M${S(58)} ${S(60)}L${S(54)} ${S(4)}M${S(244)} ${S(58)}L${S(240)} ${S(6)}`, '#4a3a2e', 1.1 * s) + P.line(`M${S(54)} ${S(6)}L${S(240)} ${S(8)}`, '#4a4a4a', .35 * s, { op: .7 });
  // the funnels, raked, buff, with smoke
  for (const fx of [104, 146, 188]) b += P.fill(`M${S(fx)} ${S(52)}L${S(fx + 4)} ${S(12)}H${S(fx + 21)}L${S(fx + 18)} ${S(52)}Z`, '#d9b46c', { w: .6 }) + P.shade(`M${S(fx + 13)} ${S(52)}L${S(fx + 16)} ${S(12)}H${S(fx + 21)}L${S(fx + 18)} ${S(52)}Z`, '#d9b46c', .2) + P.fill(`M${S(fx + 3.6)} ${S(16)}L${S(fx + 4)} ${S(12)}H${S(fx + 21)}L${S(fx + 20.6)} ${S(16)}Z`, '#2a2622', { w: .4 });
  // the white superstructure, deck on deck, rows of windows, the boats
  b += P.fill(`M${S(64)} ${S(66)}V${S(50)}H${S(232)}V${S(66)}Z`, '#f2ede2', { w: .6 }) + P.fill(`M${S(84)} ${S(52)}V${S(42)}H${S(214)}V${S(52)}Z`, '#f2ede2', { w: .55 }) + P.fill(`M${S(70)} ${S(44)}V${S(36)}H${S(90)}V${S(44)}Z`, '#f2ede2', { w: .5 });
  for (let i = 0; i < 26; i++) b += `<rect x="${S(68 + i * 6.3)}" y="${S(55)}" width="${S(3.4)}" height="${S(3)}" fill="${lit && (i * 7) % 5 < 3 ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  for (let i = 0; i < 18; i++) b += `<rect x="${S(88 + i * 6.8)}" y="${S(45.4)}" width="${S(3.2)}" height="${S(2.6)}" fill="${lit && (i * 5) % 4 < 2 ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  for (let i = 0; i < 9; i++) b += P.fill(`M${S(92 + i * 13.6)} ${S(42)}q${S(5)} ${S(-3.6)} ${S(10)} 0Z`, '#f6f2ea', { w: .35 }) + P.line(`M${S(92 + i * 13.6)} ${S(42)}h${S(10)}`, '#c8463a', .5 * s);
  b += P.shade(`M${S(64)} ${S(62)}H${S(232)}V${S(66)}H${S(64)}Z`, '#f2ede2', .15);
  // the hull: long and black, a white line, the red boot-topping at the water, rows of portholes
  b += P.fill(`M${S(4)} ${S(62)}Q${S(3)} ${S(60)} ${S(10)} ${S(60)}H${S(286)}Q${S(296)} ${S(56)} ${S(298)} ${S(54)}L${S(288)} ${S(90)}H${S(26)}Q${S(10)} ${S(86)} ${S(4)} ${S(62)}Z`, '#232427', { w: .7 });
  b += P.line(`M${S(8)} ${S(63)}H${S(288)}Q${S(293)} ${S(60)} ${S(295)} ${S(58)}`, '#efe8d8', 1 * s);
  b += P.fill(`M${S(14)} ${S(86)}H${S(289)}L${S(288)} ${S(90)}H${S(26)}Q${S(18)} ${S(89)} ${S(14)} ${S(86)}Z`, '#a8382e', { w: .4 });
  for (let row = 0; row < 2; row++) for (let i = 0; i < 34; i++) { const x = 30 + i * 7.6 + row * 3.4; b += `<circle cx="${S(x)}" cy="${S(70 + row * 7)}" r="${S(1.2)}" fill="${lit && (i + row * 3) % 4 === 0 ? P.glow('#ffd88a') : P.ink('#55606c')}"/>`; }
  // the eagle on her bow, the ensign at her stern, her name
  b += `<path d="M${S(290)} ${S(60)}l${S(-6)} ${S(-3)}l${S(2)} ${S(4)}l${S(-5)} ${S(1)}l${S(5)} ${S(2)}l${S(-2)} ${S(4)}Z" fill="${P.ink('#c8a24a')}"/>`;
  b += P.line(`M${S(8)} ${S(60)}V${S(46)}`, '#3a2a1e', .8 * s) + `<g transform="translate(${S(8)} ${S(46)}) scale(-1 1)"><rect width="${S(12)}" height="${S(8)}" fill="${P.ink('#f4f1e8')}"/><rect y="${S(2.7)}" width="${S(12)}" height="${S(2.7)}" fill="${P.ink('#1a1a1a')}"/><rect y="${S(5.4)}" width="${S(12)}" height="${S(2.6)}" fill="${P.ink('#c8102e')}"/></g>`;
  b += P.line(`M${S(4)} ${S(91)}q${S(-8)} ${S(1)} ${S(-12)} ${S(3)}`, '#f4f4f0', .8 * s, { op: .7 });
  const fun = (fx) => (dir > 0 ? (fx + 12) * s : W - (fx + 12) * s);
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 89 * s, puffs: [[fun(104), 10 * s, 1.5 * s, true, -dir], [fun(146), 10 * s, 1.5 * s, true, -dir], [fun(188), 10 * s, 1.5 * s, true, -dir]] };
}

/** A harbour ferry of the HADAG: a little steamer, a tall black funnel with a white band, an awning aft. */
function ferry(P, dir, s) {
  const W = 70 * s, H = 40 * s, S = (k) => P.f(k * s), f = P.f, lit = P.L.windows > .2;
  let b = P.fill(`M${S(31)} ${S(26)}L${S(32)} ${S(4)}H${S(39)}L${S(40)} ${S(26)}Z`, '#232222', { w: .5 }) + P.flat(`M${S(32)} ${S(8)}H${S(39)}V${S(11)}H${S(32)}Z`, '#f2eee4');
  b += P.fill(`M${S(10)} ${S(30)}V${S(21)}H${S(58)}V${S(30)}Z`, '#ece4d0', { w: .5 });
  for (let i = 0; i < 6; i++) b += `<rect x="${S(13 + i * 7.4)}" y="${S(23)}" width="${S(4.6)}" height="${S(4)}" fill="${lit ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  b += P.fill(`M${S(8)} ${S(21)}H${S(28)}V${S(18)}H${S(8)}Z`, '#c8463a', { w: .35 }) + P.line(`M${S(9)} ${S(21)}V${S(18)}M${S(27)} ${S(21)}V${S(18)}`, '#3a2a1e', .5);
  for (const [hx, hc] of [[12, '#2a2a30'], [17, '#d9c27a'], [22, '#c75b6a']]) b += `<circle cx="${S(hx)}" cy="${S(19.4)}" r="${S(1.5)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(hx - 1.8)} ${S(18.6)}h${S(3.6)}l${S(-.6)} ${S(-1.4)}h${S(-2.4)}Z" fill="${P.ink(hc)}"/>`;
  b += P.fill(`M${S(2)} ${S(29)}H${S(68)}L${S(63)} ${S(36)}H${S(7)}Q${S(3)} ${S(34)} ${S(2)} ${S(29)}Z`, '#26292c', { w: .55 }) + P.line(`M${S(4)} ${S(32.5)}H${S(65)}`, '#f2eee4', .8 * s);
  b += P.line(`M${S(4)} ${S(29)}V${S(17)}`, '#3a2a1e', .5 * s) + `<g transform="translate(${S(4)} ${S(17)}) scale(-1 1)"><rect width="${S(7)}" height="${S(4.6)}" fill="${P.ink('#c8102e')}"/><rect x="${S(2.4)}" y="${S(1.2)}" width="${S(2.2)}" height="${S(2.2)}" fill="${P.ink('#f4f1e8')}"/></g>`;
  b += P.line(`M${S(0)} ${S(36)}q${S(-5)} ${S(1)} ${S(-8)} ${S(3)}`, '#f4f4f0', .7 * s, { op: .6 });
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 34 * s, puffs: [[dir > 0 ? 35.5 * s : W - 35.5 * s, 5 * s, .9 * s, true, -dir]] };
}

/** An Ewer: the Elbe's barge under a brown spritsail, low and broad, leeboards. */
function ewer(P, dir, s) {
  const W = 60 * s, H = 62 * s, S = (k) => P.f(k * s), f = P.f;
  let b = P.line(`M${S(30)} ${S(52)}V${S(4)}`, '#4a3a2a', 1.1 * s);
  b += P.fill(`M${S(31)} ${S(48)}V${S(6)}L${S(52)} ${S(10)}L${S(54)} ${S(46)}Z`, '#9a5a36', { w: .55 }) + P.shade(`M${S(42)} ${S(47)}L${S(43)} ${S(8)}L${S(52)} ${S(10)}L${S(54)} ${S(46)}Z`, '#9a5a36', .2);
  b += P.line(`M${S(31)} ${S(46)}L${S(52)} ${S(10)}`, '#4a3a2a', .6 * s);
  b += P.fill(`M${S(29)} ${S(46)}V${S(14)}L${S(12)} ${S(46)}Z`, '#b06a40', { w: .5 });
  b += P.fill(`M${S(4)} ${S(50)}H${S(56)}L${S(52)} ${S(57)}H${S(9)}Q${S(4)} ${S(55)} ${S(4)} ${S(50)}Z`, '#3a2f26', { w: .55 }) + P.line(`M${S(6)} ${S(52)}H${S(54)}`, '#2f6a4a', .9 * s);
  b += P.fill(`M${S(20)} ${S(51)}l${S(-3)} ${S(9)}h${S(5)}l${S(2)} ${S(-9)}Z`, '#5a4232', { w: .4 });
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 56 * s };
}

// ---------- the quay ----------
/** A portal crane on its rails: the lattice legs, the cab, the jib out over the water, a sling of bales. */
function crane(P, x, by, s) {
  const f = P.f, c = 'iron';
  let d = '';
  // the portal astride the rails
  d += P.fill(`M${f(x - 22)} ${by}L${f(x - 12)} ${by - 60}H${f(x + 12)}L${f(x + 22)} ${by}H${f(x + 15)}L${f(x + 6)} ${by - 50}H${f(x - 6)}L${f(x - 15)} ${by}Z`, c, { w: .7 });
  let lat = '';
  for (let i = 0; i < 6; i++) { const t = i / 6, t2 = (i + 1) / 6; lat += `M${f(x - 22 + 10 * t)} ${f(by - 60 * t)}L${f(x - 15 + 9 * t2)} ${f(by - 50 * t2)}M${f(x + 22 - 10 * t)} ${f(by - 60 * t)}L${f(x + 15 - 9 * t2)} ${f(by - 50 * t2)}`; }
  d += `<path d="${lat}" stroke="${P.light(c, .35)}" stroke-width=".6" fill="none"/>`;
  // the turntable and the cab
  d += P.fill(P.rect(x - 14, by - 64, 28, 5), c, { w: .5 });
  d += P.fill(P.rect(x - 12, by - 86, 22, 22), '#5a6a6e', { w: .6 }) + P.shade(P.rect(x + 3, by - 86, 7, 22), '#5a6a6e', .25);
  d += P.fill(P.poly([[x - 14, by - 86], [x - 8, by - 92], [x + 10, by - 92], [x + 12, by - 86]]), c, { w: .5 });
  d += `<rect x="${f(x - 9)}" y="${f(by - 82)}" width="6" height="6" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('glass')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  d += P.fill(P.rect(x - 22, by - 80, 10, 12), '#3a3a3a', { w: .5 });
  // the jib: a lattice boom from the cab up and out over the water
  const jx = x + 150, jy = by - 214;
  d += `<path d="M${f(x + 4)} ${by - 72}L${f(jx)} ${f(jy)}L${f(jx - 2)} ${f(jy + 6)}L${f(x + 10)} ${by - 66}Z" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  let jl = '';
  for (let i = 0; i < 18; i++) { const t = i / 18, t2 = (i + 1) / 18; jl += `M${f(x + 4 + (jx - x - 4) * t)} ${f(by - 72 + (jy - by + 72) * t)}L${f(x + 10 + (jx - 2 - x - 10) * t2)} ${f(by - 66 + (jy + 6 - by + 66) * t2)}`; }
  d += `<path d="${jl}" stroke="${P.light(c, .35)}" stroke-width=".5" fill="none"/>`;
  d += P.line(`M${f(x - 4)} ${by - 92}L${f(x - 2)} ${by - 112}L${f(jx - 1)} ${f(jy + 1)}M${f(x - 2)} ${by - 112}L${f(x - 18)} ${by - 80}`, c, .7);
  // the fall and a sling of bales
  const hy = by - 120;
  d += P.line(`M${f(jx - 1)} ${f(jy + 4)}V${f(hy)}`, '#2a2a2a', .6) + P.line(`M${f(jx - 1)} ${f(hy)}l-6 6M${f(jx - 1)} ${f(hy)}l6 6`, '#2a2a2a', .5);
  d += P.fill(P.rect(jx - 9, hy + 6, 16, 9), '#c8b48a', { w: .5 }) + P.line(`M${f(jx - 9)} ${f(hy + 10.5)}h16M${f(jx - 1)} ${f(hy + 6)}v9`, '#8a6a46', .5);
  return d;
}

function cargo(P, x, by) {
  let d = '';
  for (const [dx, dy, w, h, c] of [[0, 0, 22, 12, '#c8b48a'], [20, 0, 22, 12, '#bca878'], [8, -11, 22, 12, '#d2bf94'], [44, 0, 18, 15, '#8a6a46']]) d += P.fill(P.rect(x + dx, by + dy - h, w, h), c, { w: .55 }) + P.line(`M${x + dx} ${by + dy - h / 2}h${w}M${x + dx + w / 2} ${by + dy - h}v${h}`, P.dark(c, .3), .45);
  for (const [dx, k] of [[66, 0], [76, 1]]) d += P.fill(`M${x + dx} ${by}q-2 -6 0 -12h9q2 6 0 12Z`, k ? '#7a5636' : '#6a4a2e', { w: .5 }) + P.line(`M${x + dx} ${by - 3}h9M${x + dx} ${by - 9}h9`, '#3a2a1e', .6);
  d += P.wall(x + 46, by - 14, 13, 11);
  return d;
}

function bollard(P, x, by, s) {
  const f = P.f;
  return P.fill(`M${f(x - 4 * s)} ${by}V${f(by - 7 * s)}Q${f(x - 4 * s)} ${f(by - 10 * s)} ${x} ${f(by - 10 * s)}Q${f(x + 4 * s)} ${f(by - 10 * s)} ${f(x + 4 * s)} ${f(by - 7 * s)}V${by}Z`, '#2c2c2e', { w: .6 }) + P.fill(P.rect(x - 5.4 * s, by - 9 * s, 10.8 * s, 2 * s), '#2c2c2e', { w: .4 });
}

/** A family of emigrants with their bundles and a corded trunk, bound for New York. */
function emigrants(P, x, by) {
  let d = P.fill(P.rect(x + 18, by - 9, 16, 9), '#6a4a2e', { w: .55 }) + P.line(`M${x + 18} ${by - 5}h16M${x + 24} ${by - 9}v9M${x + 30} ${by - 9}v9`, '#3a2a1e', .5);
  d += P.person(x, by, 1.12, 'peasant', { c: '#5a4a6a', hat: '#c8463a' }) + P.person(x + 10, by, .8, 'child', { c: '#7a5a3a' }) + P.person(x + 42, by, 1.14, 'worker', { c: '#3a3a3a', hat: '#2a2a2a' });
  d += `<circle cx="${x + 4}" cy="${by - 22}" r="5" fill="${P.ink('#d8c8a0')}" stroke="${P.keyC()}" stroke-width=".5"/><path d="M${x + 1} ${by - 26}l3 -2l3 2" stroke="${P.ink('#8a6a46')}" stroke-width=".8" fill="none"/>`;
  return d;
}

/** A Finkenwerder fishwife with her basket on her hip. */
function fishwife(P, x, by, s) {
  let d = P.person(x, by, s, 'peasant', { c: '#2a3a5a', hat: '#e8e0cc', dir: -1 });
  d += P.fill(`M${P.f(x - 9 * s)} ${P.f(by - 15 * s)}h${P.f(8 * s)}l-1 ${P.f(6 * s)}h${P.f(-6 * s)}Z`, '#a88452', { w: .45 });
  for (let i = 0; i < 3; i++) d += `<ellipse cx="${P.f(x - 7 * s + i * 2.4 * s)}" cy="${P.f(by - 15.6 * s)}" rx="${P.f(1.6 * s)}" ry="${P.f(.8 * s)}" fill="${P.ink('#c8ccd0')}"/>`;
  return d;
}
