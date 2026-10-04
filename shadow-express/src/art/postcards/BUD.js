// Budapest from the Buda quay: the Parliament across the Danube, white and Gothic under its red roofs and ribbed dome,
// St Stephen's Basilica over the Pest roofs, the Chain Bridge's pylons and chains striding over the river at the right
// with a stone lion at its bridgehead, Buda Castle's new dome on the hill above; a yellow tram on the embankment, a
// paddle steamer of the Hungarian line, a tug with its grain barge, strollers, a hussar officer under the candelabra.

const RED = '#c8102e', WHITE = '#f4f1e8', GREEN = '#3a7d44';

export default {
  id: 'BUD',
  greet: 'Üdvözlet BUDAPESTRŐL',
  nation: 'AH',
  flag: 'HU',
  flower: 'paprika',
  flower2: 'folk-tulip',
  frame: { band: ['#30884a', '#1e4d31'], gold: '#d9b65e', ink: '#a8282e', leaf: ['#a6c46c', '#557f3c'], year: '#7a2a22', halo: '#f8edc8' },
  horizon: 240,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#2b2722', stone: '#e8e0cc', stone2: '#bdb197', roof: '#94402f', dome: '#bfc0b2', wall: '#ecd9ae', wall2: '#e2c79a',
    wall3: '#e9d2c2', palace: '#e6d7b2', copper: '#71a690', water: '#5e8f96', ground: '#d4c39d', granite: '#aaa08a',
    chain: '#3c403b', glass: '#394757', sash: '#efe6d2', iron: '#2e3a33', gold: '#d6a93a', tram: '#d9a52c', hill: '#7f9a5a',
  },

  // paprika: three glossy pods hanging under a white star of a flower, with their leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(25, 11, 205, I.leaf[1], { shape: 'oval' }) + F.leaf(23, 10, 150, I.leaf[0], { shape: 'oval' }) + F.leaf(18, 8, 255, I.leaf[0], { shape: 'lance' }) + F.leaf(17, 7, 100, I.leaf[1], { shape: 'lance' });
    const pod = (len, w, c, lite) => `<path d="M0 -1C${F.f(-w * .75)} ${F.f(len * .12)} ${F.f(-w * .62)} ${F.f(len * .72)} ${F.f(w * .12)} ${F.f(len)}C${F.f(w * .7)} ${F.f(len * .62)} ${F.f(w * .78)} ${F.f(len * .16)} 0 -1Z" fill="${c}" stroke="${I.key}" stroke-width=".6"/>`
      + `<path d="M${F.f(-w * .3)} ${F.f(len * .18)}Q${F.f(-w * .4)} ${F.f(len * .55)} ${F.f(-w * .05)} ${F.f(len * .85)}" stroke="${lite}" stroke-width="${F.f(w * .16)}" fill="none" opacity=".75" stroke-linecap="round"/>`
      + `<path d="M${F.f(-w * .55)} 0Q0 -3.4 ${F.f(w * .55)} 0Q0 2.6 ${F.f(-w * .55)} 0Z" fill="#4f7d34" stroke="${I.key}" stroke-width=".5"/>`;
    s += F.stem('M0 -4Q-2 -10 2 -15', I.leaf[1], 1.2);
    s += F.at(-6, 1, pod(23, 8.5, '#b81f1b', '#f07a5e'), 28) + F.at(6, 1, pod(25, 9, '#c9271f', '#f58a6a'), -26) + F.at(0, 3, pod(27, 10, '#d8352a', '#ff9c7a'), 2);
    s += F.at(1, -6, F.radial(5, 7.5, 5.4, '#f8f4e8', { shape: 'point', lite: '#ffffff' }) + F.disc(2, '#e6c43c', { dots: '#9a7a2a', n: 5 }), 18, .95);
    return s;
  },
  // the folk tulip of the Kalocsa needle: a red three-lobed bloom over curling leaves, a blue heart
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M0 6Q-1 0 0 -3', I.leaf[1], 1.2);
    s += F.at(0, 4, `<path d="M0 0C-6 -2 -14 0 -16 -8C-11 -6 -6 -6 -2 -3Z" fill="${I.leaf[0]}" stroke="${I.key}" stroke-width=".5"/><path d="M0 0C6 -2 14 0 16 -8C11 -6 6 -6 2 -3Z" fill="${I.leaf[1]}" stroke="${I.key}" stroke-width=".5"/>`);
    s += F.at(0, -2, F.petal(13, 9, '#c4262a', 'round', { lite: '#ee6a5e' }), -34) + F.at(0, -2, F.petal(13, 9, '#c4262a', 'round', { lite: '#ee6a5e' }), 34);
    s += F.at(0, -2, F.petal(16, 9.5, '#d8322c', 'point', { vein: '#8a1a1a', lite: '#f4887a' }));
    s += `<circle cy="-6" r="2.6" fill="#3d5fae" stroke="${I.key}" stroke-width=".5"/><circle cy="-6" r="1" fill="#f4e6b0"/>`;
    return s;
  },

  back(P, T) {
    let s = '';
    // the Pest roofs behind the river front, smoke from a mill
    s += P.far(.7, () => P.row(318, 452, 242, { hMin: 12, hMax: 24, wMin: 12, wMax: 22, style: 'paris', seed: 6, walls: ['#ecd9ae', '#e2c79a', '#e9d2c2'], roofC: '#7a7468', placard: false, flagSpot: false }) + P.row(24, 64, 242, { hMin: 10, hMax: 18, wMin: 12, wMax: 18, style: 'paris', seed: 9, walls: ['#ecd9ae', '#e9d2c2'], roofC: '#7a7468', placard: false, flagSpot: false }));
    s += P.far(.62, () => basilica(P, 366, 228, .9));
    s += P.smoke(342, 214, .55) + P.smoke(440, 220, .5, { dark: true });
    // the Gresham palace and the Academy at the Pest bridgehead
    s += P.far(.5, () => P.facade(400, 242, 40, 30, { c: 'wall2', roof: 'mansard', roofC: '#6f7d74', side: 6, cols: 5, floors: 3, rh: 8, placard: false, flagSpot: false }) + P.facade(440, 242, 26, 24, { c: 'palace', roof: 'flat', side: 5, cols: 3, floors: 2, placard: false, flagSpot: false }));
    // the Parliament, filling the far bank
    s += P.far(.3, () => parliament(P));
    // Castle Hill above the Buda bridgehead, the palace on its crest
    s += P.far(.42, () => castleHill(P));
    // the Danube
    s += P.water(240, 324, { seed: 7, shimmer: 8, x0: 40, x1: 430 });
    s += reflect(P, 56, 352, 242, 34, 'stone', 3) + reflect(P, 188, 222, 242, 46, 'dome', 5) + reflect(P, 120, 166, 242, 24, 'roof', 8) + reflect(P, 240, 286, 242, 24, 'roof', 9);
    s += P.far(.4, () => P.line('M24 240.6H576', '#e9e2cc', .6, { op: .5 }));
    // the landing stage under the Parliament, a little steamer moored at it; trees on the Pest bank
    s += P.far(.3, () => P.fill('M88 247H140V251H88Z', '#4a4038', { w: .4 }) + P.fill('M96 241H124V247H96Z', '#ece2c8', { w: .4 }) + P.fill(P.poly([[94, 241], [110, 236], [126, 241]]), 'roof', { w: .35 }) + P.line('M100 247l-8 -7', '#4a4038', .6) + T.place(T.steamer({ s: .3, dir: 1, hull: '#2a2a2e', house: '#f3eedf', funnel: ['#22201d', '#c8102e'], paddle: true, flag: 'HU' }), 158, 251));
    s += P.far(.45, () => P.tree(34, 240, .62, 'round') + P.tree(48, 240.5, .55, 'round'));
    if (P.L.snow) { const r = P.rng(31); for (let i = 0; i < 26; i++) { const y = 246 + r() * 72, k = (y - 240) / 80, x = 30 + r() * 520, w = (6 + r() * 16) * (.4 + k); s += P.fill(`M${P.f(x)} ${P.f(y)}l${P.f(w * .3)} ${P.f(-1.4 * (.4 + k))}h${P.f(w * .6)}l${P.f(w * .2)} ${P.f(1.6 * (.4 + k))}l${P.f(-w * .4)} ${P.f(1.2 * (.4 + k))}Z`, '#eef3f5', { w: .3 }); } }
    // on the river: the paddle steamer, a tug towing a barge, a skiff; they pass behind the bridge's piers
    s += P.cross(T.steamer({ s: .58, dir: -1, hull: '#23262b', house: '#f3eedf', funnel: ['#22201d', '#c8102e'], paddle: true, flag: 'HU', boot: '#b23a2e' }), { y: 268, dir: -1, dur: 70, rest: .2, x1: 470, offset: 12 });
    s += P.cross(tow(P, { s: .62, dir: 1 }), { y: 290, dir: 1, dur: 118, rest: .15, x1: 480, offset: 60 });
    s += P.cross(T.rowboat({ s: .72, dir: -1, shirt: '#e9e1cf', hull: '#6b4a32' }), { y: 309, dir: -1, dur: 66, rest: .35, offset: 30 });
    return s;
  },

  mid(P, T) {
    let s = '';
    s += chainBridge(P);
    // the quay: its balustrade on the river, the promenade, the road with the tram
    s += quay(P);
    s += P.far(.12, () => P.crowd(52, 200, 328, 8, { s: .62, seed: 14 }) + P.crowd(250, 420, 328, 7, { s: .62, seed: 22 }));
    s += P.far(.1, () => P.lamp(214, 330, .7, 'iron') + P.lamp(406, 330, .7, 'iron'));
    s += P.setStreet(356, 30, 570, .9);
    s += P.cross(T.tramSide({ c: 'tram', band: '#f1e6c6', number: '19', s: .92, dir: -1 }), { y: 354, dir: -1, dur: 40, rest: .45, offset: 14 });
    s += P.cross(T.fiacre({ s: .7, dir: 1, horses: 2, body: '#26302a', hood: '#2a2724' }), { y: 350, dir: 1, dur: 52, rest: .35, offset: 38 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .66, dir: 1, seed: 6 }), { y: 330, dir: 1, dur: 110, offset: 20 });
    s += P.cross(hussarPair(P, { s: .66, dir: -1 }), { y: 331, dir: -1, dur: 120, offset: 80 });
    return s;
  },

  front(P, T) {
    let s = '';
    s += P.paving(362, 380, { c: 'ground', vx: 300, seed: 5 });
    // the advertising column with its little dome, a candelabrum, a bench
    s += column(P, 474, 368, 1);
    s += P.lamp(200, 366, 1.08, 'iron', { h: 70 });
    s += P.fill('M366 366h40v-2.4h-40Z', '#5b4532', { w: .5 }) + P.line('M369 366v6M403 366v6M367 357h38', '#3a2a1e', 1.1);
    s += P.person(376, 364, .92, 'gent', { c: '#3a3530' }) + P.person(394, 364, .9, 'lady', { c: '#e9dccb', hat: '#b84a5a' });
    // a hussar officer and his lady; a girl with a hoop; a gentleman reading the news
    s += hussar(P, 404, 374, 1.12, { dir: -1 }) + P.person(418, 374, 1.08, 'lady', { c: '#c9d6e6', parasol: '#f3e9e9', dir: -1 });
    s += P.person(226, 372, .78, 'girl', { c: '#f2e6e0', hat: '#d06a7a' }) + P.line('M234 364a4.2 4.2 0 1 0 .1 0', '#7a5a3a', .8) + P.person(546, 374, 1.06, 'gent', { c: '#2c3038' });
    s += pram(P, 166, 374, 1.05) + P.person(184, 374, 1.06, 'lady', { c: '#3a3f52', hat: '#f2ece0', dir: -1 });
    // the couple at the left, walking toward the river
    s += P.figure(66, 410, 1.2, 'gent', { arm: 17, c: '#2b2a2e' }) + P.figure(104, 413, 1.18, 'lady', { c: '#f1ece0', flowers: ['#c8102e', '#f4f1e8', '#3a7d44'], sash: '#c8102e' });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady'], s: 1.05, dir: 1, seed: 21, dresses: ['#efe1c8', '#e8b9b3'] }), { y: 380, dir: 1, dur: 76, offset: 18, z: 'fore', x0: 150 });
    s += P.wall(466, 318, 16, 22);
    // the crisis: a knot of readers at the column; at war the flags on the bridge
    if (P.war !== 'peace') s += P.person(452, 370, 1, 'gent', { c: '#3a3f4a', dir: 1 }) + P.person(492, 371, .98, 'worker', { c: '#5a4a3a', dir: -1 }) + P.person(500, 372, .9, 'lady', { c: '#d9c9b8', dir: -1 });
    return s;
  },
};

// ---------- the river ----------
/** A reflection: broken strokes of a building's colour under it, thinning with distance. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`;
}

/** A tug towing a grain barge, the line between them sagging. */
function tow(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 130 * s, H = 36 * s, S = (k) => f(k * s);
  let b = '';
  // the barge, long and low, a deckhouse aft, hatches
  b += P.fill(`M${S(2)} ${S(24)}H${S(74)}L${S(70)} ${S(31)}H${S(6)}Z`, '#3a3029', { w: .5 }) + P.fill(`M${S(4)} ${S(24)}H${S(72)}V${S(21)}H${S(4)}Z`, '#6b5a44', { w: .4 });
  for (let i = 0; i < 5; i++) b += P.fill(P.rect((14 + i * 10) * s, 18.6 * s, 7 * s, 2.6 * s), '#8a7656', { w: .3 });
  b += P.fill(`M${S(4)} ${S(21)}V${S(14)}H${S(12)}V${S(21)}Z`, '#e8dcc0', { w: .4 }) + `<rect x="${S(6)}" y="${S(16)}" width="${S(3)}" height="${S(2.4)}" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3d4d5e')}"/>`;
  b += `<path d="M${S(9)} ${S(14)}V${S(4)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(.6)}"/>` + `<g transform="translate(${S(9)} ${S(4)})">${hu(P, 4 * s, 2.6 * s)}</g>`;
  // the tow line
  b += `<path d="M${S(74)} ${S(23)}Q${S(84)} ${S(27)} ${S(96)} ${S(22)}" fill="none" stroke="${P.ink('#3a3026')}" stroke-width="${S(.5)}"/>`;
  // the tug
  b += P.fill(`M${S(110)} ${S(24)}L${S(111)} ${S(7)}H${S(117)}L${S(118)} ${S(24)}Z`, '#1d1a17', { w: .5 }) + P.flat(P.rect(111 * s, 10 * s, 6 * s, 2 * s), RED) + P.flat(P.rect(111 * s, 12 * s, 6 * s, 1.4 * s), WHITE) + P.flat(P.rect(111 * s, 13.4 * s, 6 * s, 1.4 * s), GREEN);
  b += P.fill(`M${S(102)} ${S(25)}V${S(18)}H${S(124)}V${S(25)}Z`, '#ebe2cc', { w: .45 }) + `<rect x="${S(118)}" y="${S(19.6)}" width="${S(3.6)}" height="${S(2.8)}" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3d4d5e')}"/>`;
  b += P.fill(`M${S(94)} ${S(24)}H${S(130)}L${S(125)} ${S(31)}H${S(99)}Q${S(95)} ${S(29)} ${S(94)} ${S(24)}Z`, '#2a2622', { w: .5 }) + `<path d="M${S(96)} ${S(29)}H${S(126)}" stroke="${P.ink('#a8382e')}" stroke-width="${S(1)}"/>`;
  b += `<path d="M${S(130)} ${S(31)}q${S(4)} ${S(1)} ${S(6)} ${S(3)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(.8)}" fill="none" opacity=".6"/>`;
  const body = dir < 0 ? `<g transform="translate(${f(W)} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: svg(W, H, body), w: W, h: H, ax: W / 2, ay: 30 * s, puffs: [[dir > 0 ? 114 * s : W - 114 * s, 7 * s, s, true, -dir]] };
}
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
const hu = (P, w, h) => [RED, WHITE, GREEN].map((c, i) => `<rect y="${P.f(h * i / 3)}" width="${P.f(w)}" height="${P.f(h / 3 + .2)}" fill="${P.ink(c)}"/>`).join('');

// ---------- the Parliament ----------
function pinnacle(P, x, by, w, h, c = 'stone2') {
  return P.fill(P.spire(x, by, w, h), c, { w: .4 }) + P.line(`M${P.f(x)} ${P.f(by - h)}v-2`, c, .45);
}
function parliament(P) {
  const cx = 204, wl = 240, base = 229;
  let s = '';
  // the twin towers of the square front, behind
  for (const k of [-1, 1]) { const tx = cx + k * 34; s += P.fill(P.rect(tx - 3.4, 132, 6.8, 60), 'stone') + P.shade(P.rect(tx + 1, 132, 2.4, 60), 'stone', .2) + P.fill(P.spire(tx, 133, 9, 28), 'roof') + P.line(`M${tx} 105v-5`, 'gold', .8); for (const j of [-1, 1]) s += pinnacle(P, tx + j * 3.8, 134, 2.6, 8); }
  s += dome(P, cx, 190);
  // the river front, block by block, mirrored about the dome
  const blocks = [
    { x0: 56, x1: 80, top: 184, rh: 26, kind: 'end' },
    { x0: 80, x1: 122, top: 196, rh: 13, kind: 'wing' },
    { x0: 122, x1: 162, top: 182, rh: 22, kind: 'hall' },
    { x0: 162, x1: 182, top: 194, rh: 10, kind: 'link' },
  ];
  const all = [...blocks, ...blocks.map((b) => ({ ...b, x0: 2 * cx - b.x1, x1: 2 * cx - b.x0, right: true })).reverse()];
  const order = [all[1], all[3], all[4], all[6], all[0], all[7], all[2], all[5]]; // low blocks first, the pavilions over them
  for (const b of order) s += block(P, b, base);
  // the centre under the dome: three tall windows, a gable, pinnacles
  s += P.fill(P.rect(cx - 22, 186, 44, base - 186), 'stone') + P.stipple(P.rect(cx - 22, 186, 44, base - 186), 'stone', 26, { box: [cx - 22, 186, 44, base - 186], op: .3 });
  for (const k of [-1, 0, 1]) s += P.windows(cx + k * 12 - 4, 192, 8, 30, 1, 1, { gothic: true, ww: .8, wh: .95 });
  s += P.fill(P.gable(cx - 16, 187, 32, 16), 'stone', { w: .6 }) + `<circle cx="${cx}" cy="179" r="3.4" fill="${P.ink('glass')}" stroke="${P.ink('stone2')}" stroke-width=".6"/>`;
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * 22 - 2.5, 180, 5, base - 180), 'stone2', { w: .45 }) + pinnacle(P, cx + k * 22, 181, 4, 14);
  s += pinnacle(P, cx, 172, 3, 9);
  // the arcaded terrace on the water, steps down to the river at the centre
  s += P.fill(P.rect(50, base, 316, wl - base), 'stone2', { w: .6 }) + P.lite(P.rect(50, base, 316, 1.6), 'stone2', .3);
  for (let x = 54; x < 362; x += 6.5) if (Math.abs(x - cx) > 12) s += P.flat(P.arch(x, base + 3, 3.6, 7), '#3a3a3e');
  for (let k = 0; k < 4; k++) s += P.fill(P.rect(cx - 10 - k * 2, base + 2 + k * 2.4, 20 + k * 4, 2.4), 'stone', { w: .35 });
  // the flag on its staff over the river front
  s += P.flag(cx - 34, 106, .8, 'HU', { h: 10 });
  return s;
}
function block(P, b, base) {
  const { f } = P, w = b.x1 - b.x0, h = base - b.top;
  let s = '';
  // the roof first: steep, red-brown, tiles in courses, a cresting along the ridge
  const rp = b.kind === 'end' ? P.poly([[b.x0 - 1, b.top], [b.x0 + w / 2, b.top - b.rh], [b.x1 + 1, b.top]]) : P.poly([[b.x0 - 1, b.top], [b.x0 + 4, b.top - b.rh], [b.x1 - 4, b.top - b.rh], [b.x1 + 1, b.top]]);
  s += P.fill(rp, 'roof') + P.shade(b.kind === 'end' ? P.poly([[b.x0 + w / 2, b.top - b.rh], [b.x1 + 1, b.top], [b.x0 + w / 2, b.top]]) : P.poly([[b.x1 - 4, b.top - b.rh], [b.x1 + 1, b.top], [b.x1 - 8, b.top]]), 'roof', .25);
  for (let y = b.top - 3; y > b.top - b.rh + 1; y -= 3) { const t = (b.top - y) / b.rh, a = b.kind === 'end' ? b.x0 + w / 2 * t : b.x0 + 4 * t, c = b.kind === 'end' ? b.x1 - w / 2 * t : b.x1 - 4 * t; s += P.line(`M${f(a + .5)} ${f(y)}H${f(c - .5)}`, '#6a2a20', .4, { op: .55 }); }
  if (P.L.snow) s += P.flat(rp, '#f2f5f8', { op: .78 }) + P.shade(b.kind === 'end' ? P.poly([[b.x0 + w / 2, b.top - b.rh], [b.x1 + 1, b.top], [b.x0 + w / 2, b.top]]) : P.poly([[b.x1 - 4, b.top - b.rh], [b.x1 + 1, b.top], [b.x1 - 8, b.top]]), '#f2f5f8', .2, { op: .6 });
  if (b.kind !== 'end') s += P.line(`M${f(b.x0 + 4)} ${f(b.top - b.rh - .8)}H${f(b.x1 - 4)}`, 'gold', .7, { op: .8 });
  if (b.kind === 'wing' || b.kind === 'hall') for (let x = b.x0 + 9; x < b.x1 - 6; x += 12) s += P.fill(P.gable(x - 2.5, b.top - 3, 5, 6), 'stone', { w: .35 }) + P.flat(P.rect(x - 1, b.top - 4.6, 2, 2.4), 'glass');
  // the wall, its windows in two storeys over the ground floor
  s += P.fill(P.rect(b.x0, b.top, w, h), 'stone') + P.stipple(P.rect(b.x0, b.top, w, h), 'stone', Math.round(w * .7), { box: [b.x0, b.top, w, h], op: .3 });
  if (b.kind === 'end' || b.kind === 'hall') s += P.shade(P.rect(b.x1 - w * .22, b.top, w * .22, h), 'stone', .16);
  const rows = b.kind === 'hall' ? [[b.top + 5, 22], [base - 13, 9]] : b.kind === 'end' ? [[b.top + 6, 14], [b.top + 24, 12], [base - 12, 8]] : [[b.top + 4, 12], [base - 15, 10]];
  const cols = Math.max(1, Math.round(w / 8));
  for (const [y, wh] of rows) s += P.windows(b.x0 + 2, y, w - 4, wh, cols, 1, { gothic: true, ww: .5, wh: .92 });
  // buttresses and the pinnacles that crown them
  const n = b.kind === 'hall' ? 4 : b.kind === 'end' ? 2 : Math.max(2, Math.round(w / 10));
  for (let i = 0; i <= n; i++) { const x = b.x0 + w * i / n; s += P.line(`M${f(x)} ${b.top}V${base}`, 'stone2', .7) + pinnacle(P, x, b.top + .5, 2.6, b.kind === 'link' ? 6 : 8); }
  s += P.fill(P.rect(b.x0 - 1, b.top - 1, w + 2, 2.2), 'stone2', { w: .35 });
  // turrets at the corners of the pavilions
  if (b.kind === 'end' || b.kind === 'hall') for (const x of [b.x0, b.x1]) {
    const tw = 5, th = b.kind === 'end' ? 30 : 34, tt = b.top - (b.kind === 'end' ? 6 : 10);
    s += P.fill(P.rect(x - tw / 2, tt, tw, base - tt), 'stone', { w: .45 }) + P.shade(P.rect(x + tw * .1, tt, tw * .4, base - tt), 'stone', .2) + P.fill(P.spire(x, tt + .5, tw + 1.6, th - 10), 'roof', { w: .45 }) + P.line(`M${x} ${f(tt - th + 10)}v-3`, 'gold', .6);
  }
  if (b.kind === 'hall') s += P.fill(P.gable(b.x0 + 6, b.top + 1, w - 12, 13), 'stone', { w: .5 }) + `<circle cx="${f(b.x0 + w / 2)}" cy="${f(b.top - 5)}" r="2.6" fill="${P.ink('glass')}" stroke="${P.ink('stone2')}" stroke-width=".5"/>` + pinnacle(P, b.x0 + w / 2, b.top - 11.5, 3, 7);
  return s;
}
function dome(P, cx, base) {
  const { f } = P, w = 21, dt = 152, dh = 36;
  let s = '';
  // the drum: sixteen faces, a tall pointed window in each, a gablet over it and pinnacles between
  s += P.fill(P.rect(cx - w, dt, 2 * w, base - dt), 'stone') + P.shade(P.rect(cx + w * .35, dt, w * .65, base - dt), 'stone', .18);
  const xs = [];
  for (let i = -4; i <= 4; i++) xs.push(cx + w * Math.sin(i * Math.PI / 8));
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1], ww = (b - a) * .52;
    if (ww > 1.2) s += P.windows((a + b) / 2 - ww / 2 - .1, dt + 7, ww + .2, base - dt - 14, 1, 1, { gothic: true, ww: 1, wh: 1, plain: true });
    if (b - a > 2) s += P.fill(P.gable(a + .3, dt + 1, b - a - .6, 6), 'stone', { w: .35 });
  }
  for (const x of xs) s += P.line(`M${f(x)} ${dt}V${base}`, 'stone2', .6) + pinnacle(P, x, dt + 1, 2.2, 7);
  // the dome: pointed, ribbed, lead-grey, the ribs set with crockets
  const prof = `M${cx - w} ${dt}C${cx - w} ${dt - dh * .55} ${f(cx - w * .42)} ${dt - dh * .86} ${cx} ${dt - dh}C${f(cx + w * .42)} ${dt - dh * .86} ${cx + w} ${dt - dh * .55} ${cx + w} ${dt}Z`;
  s += P.fill(prof, 'dome') + P.shade(`M${cx} ${dt - dh}C${f(cx + w * .42)} ${dt - dh * .86} ${cx + w} ${dt - dh * .55} ${cx + w} ${dt}H${f(cx + w * .3)}C${f(cx + w * .3)} ${dt - dh * .5} ${f(cx + w * .12)} ${dt - dh * .8} ${cx} ${dt - dh}Z`, 'dome', .25);
  s += P.lite(`M${cx - w + 3} ${dt}C${cx - w + 3} ${dt - dh * .5} ${f(cx - w * .4)} ${dt - dh * .8} ${cx - 2} ${dt - dh + 2}C${f(cx - w * .5)} ${dt - dh * .7} ${cx - w * .78} ${dt - dh * .4} ${cx - w * .72} ${dt}Z`, 'dome', .2);
  for (const k of [-.66, -.33, 0, .33, .66]) s += P.line(`M${f(cx + k * w)} ${dt}Q${f(cx + k * w * .95)} ${f(dt - dh * .7)} ${cx} ${dt - dh}`, 'stone', 1.1) + P.line(`M${f(cx + k * w)} ${dt}Q${f(cx + k * w * .95)} ${f(dt - dh * .7)} ${cx} ${dt - dh}`, 'stone2', .4);
  for (let i = 1; i < 6; i++) { const t = i / 6; for (const k of [-1, 1]) { const x = cx + k * w * (1 - t * t * .9), y = dt - dh * Math.sin(t * Math.PI / 2) * .98; s += P.line(`M${f(x)} ${f(y)}l${f(k * 2)} -1.4`, 'stone2', .8); } }
  if (P.L.snow) s += P.flat(`M${cx - w * .8} ${dt - 8}C${cx - w * .7} ${dt - dh * .7} ${f(cx - w * .3)} ${dt - dh * .92} ${cx} ${dt - dh}C${f(cx + w * .3)} ${dt - dh * .92} ${cx + w * .7} ${dt - dh * .7} ${cx + w * .8} ${dt - 8}Q${cx} ${dt - dh * .6} ${cx - w * .8} ${dt - 8}Z`, '#f2f5f8', { op: .75 });
  // little dormers in the dome, the lantern and the needle
  for (const k of [-.4, .4]) s += P.fill(P.gable(cx + k * w - 2, dt - 10, 4, 5), 'stone', { w: .3 });
  s += P.fill(P.rect(cx - 5, dt - dh - 13, 10, 14), 'stone') + P.windows(cx - 4, dt - dh - 11, 8, 9, 2, 1, { gothic: true, ww: .6, wh: .9, plain: true });
  for (const k of [-1, 1]) s += pinnacle(P, cx + k * 5, dt - dh - 12, 2.6, 7);
  s += P.fill(P.spire(cx, dt - dh - 12.5, 9, 22), 'dome', { w: .5 }) + P.line(`M${cx} ${dt - dh - 34}v-4`, 'gold', .9) + `<circle cx="${cx}" cy="${dt - dh - 38.5}" r="1.2" fill="${P.ink('gold')}"/>`;
  return s;
}
function basilica(P, cx, by, k) {
  const { f } = P, S = (n) => n * k;
  let s = '';
  for (const j of [-1, 1]) { const tx = cx + j * S(17); s += P.fill(P.rect(tx - S(4.5), by - S(42), S(9), S(42)), 'palace') + P.fill(P.dome(tx, by - S(42), S(4.6), S(6)), 'copper') + P.line(`M${f(tx)} ${f(by - S(50))}v${f(-S(4))}`, 'gold', .6); }
  s += P.fill(P.rect(cx - S(13), by - S(30), S(26), S(30)), 'palace') + P.fill(P.rect(cx - S(9), by - S(44), S(18), S(14)), 'palace') + P.windows(cx - S(8), by - S(42), S(16), S(10), 4, 1, { arched: true, ww: .5, plain: true });
  s += P.fill(P.dome(cx, by - S(44), S(10), S(12)), 'copper') + P.shade(`M${f(cx + S(3))} ${f(by - S(44))}C${f(cx + S(5))} ${f(by - S(58))} ${f(cx + S(9))} ${f(by - S(54))} ${f(cx + S(10))} ${f(by - S(44))}Z`, 'copper', .25);
  s += P.fill(P.rect(cx - S(2), by - S(62), S(4), S(5)), 'palace', { w: .4 }) + P.line(`M${f(cx)} ${f(by - S(62))}v${f(-S(5))}M${f(cx - S(1.6))} ${f(by - S(65))}h${f(S(3.2))}`, 'gold', .6);
  return s;
}

// ---------- Castle Hill and the palace ----------
function castleHill(P) {
  const { f } = P;
  let s = '';
  // the hill, wooded, its terraces walled
  const hill = 'M424 272C440 246 452 214 470 196C486 186 508 184 532 184L590 182V300H424Z';
  s += P.fill(hill, 'hill') + P.stipple(hill, 'hill', 60, { box: [424, 182, 166, 118], op: .4 });
  const lf = P.L.leaf;
  if (P.L.snow) s += P.flat(hill, '#eef2f5', { op: .7 });
  for (const [x, y, rx] of [[446, 250, 9], [462, 228, 8], [478, 214, 9], [500, 232, 11], [530, 226, 10], [556, 236, 12], [488, 252, 10], [522, 258, 12], [560, 262, 12]]) {
    if (!lf.leaf) { let br = ''; for (const a of [-60, -90, -120, -35, -145]) { const q = a * Math.PI / 180; br += `M${x} ${y + rx * .6}l${f(Math.cos(q) * rx)} ${f(Math.sin(q) * rx)}`; } s += P.line(br, '#5b4a3c', .7); continue; }
    s += `<path d="${P.blob(x, y, rx, rx * .8, 8, x)}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width=".5"/>` + `<path d="${P.blob(x - rx * .2, y - rx * .25, rx * .45, rx * .35, 6, x + 1)}" fill="${P.ink(lf.light)}" opacity=".8"/>`;
    if (lf.bloom && x % 3 < 1) s += `<circle cx="${x - 2}" cy="${y - 2}" r="1.4" fill="${P.ink(lf.bloom)}"/>`;
  }
  s += P.fill('M432 262L470 240H590V246H472L436 268Z', 'granite', { w: .5 });
  // the Várkert bazaar at the foot: arcades on the water
  s += P.fill(P.rect(452, 270, 140, 14), 'palace') + P.fill(P.rect(450, 268, 144, 3), 'stone2', { w: .4 });
  for (let x = 456; x < 590; x += 8) s += P.windows(x, 273, 5, 9, 1, 1, { arched: true, ww: .9, wh: .95, plain: true });
  // the palace on the crest: long wings, the river front's columns, the dome over them
  const by = 192;
  s += P.facade(462, by, 40, 28, { c: 'palace', roof: 'mansard', roofC: '#66766f', side: 4, cols: 5, floors: 3, rh: 7, placard: false, flagSpot: false });
  s += P.facade(538, by, 52, 28, { c: 'palace', roof: 'mansard', roofC: '#66766f', side: 4, cols: 6, floors: 3, rh: 7, placard: false, flagSpot: false });
  s += P.fill(P.rect(502, by - 34, 36, 34), 'palace') + P.shade(P.rect(530, by - 34, 8, 34), 'palace', .15);
  s += P.columns(506, by - 3, 28, 24, 6, 'palace') + P.fill(P.rect(501, by - 37, 38, 4), 'stone2', { w: .45 });
  // the drum, ringed with columns, and the copper dome with its lantern and crown
  const cx = 520;
  s += P.fill(P.rect(cx - 12, by - 52, 24, 16), 'palace') + P.windows(cx - 11, by - 50, 22, 12, 4, 1, { arched: true, ww: .45, plain: true });
  for (let i = 0; i <= 4; i++) s += P.line(`M${f(cx - 12 + i * 6)} ${by - 52}V${by - 37}`, 'stone2', .7);
  s += P.fill(P.dome(cx, by - 52, 13, 20), 'copper') + P.shade(`M${cx + 4} ${by - 52}C${cx + 6} ${by - 70} ${cx + 11} ${by - 72} ${cx + 13} ${by - 52}Z`, 'copper', .25);
  for (const k of [-.5, 0, .5]) s += P.line(`M${f(cx + k * 13)} ${by - 52}Q${f(cx + k * 10)} ${by - 68} ${cx} ${by - 78}`, 'copper', .5);
  s += P.fill(P.rect(cx - 2.6, by - 86, 5.2, 9), 'palace', { w: .4 }) + P.fill(P.dome(cx, by - 86, 3.4, 4), 'copper', { w: .4 }) + P.line(`M${cx} ${by - 91}v-5M${cx - 1.6} ${by - 94}h3.2`, 'gold', .8);
  s += P.flag(552, by - 36, .7, 'HU', { h: 14 });
  return s;
}

// ---------- the Chain Bridge ----------
function chainBridge(P) {
  const { f } = P;
  // the far (Pest) pylon and the near (Buda) one, each seen on two faces: its long upstream side, then the face with
  // the arch the road runs through; the deck between them rising toward us
  const far = { x0: 385, side: 14, face: 7, top: 205, base: 246, deck: 237 }, near = { x0: 446, side: 40, face: 20, top: 186, base: 302, deck: 266 };
  const fx = far.x0 + far.side + far.face, nx = near.x0;
  const deckAt = (x) => far.deck + (near.deck - far.deck) * (x - fx) / (nx - fx);
  const top = (x) => deckAt(x) - 3 - Math.max(0, x - fx) * .05, bot = (x) => deckAt(x) + 2 + Math.max(0, x - fx) * .05;
  let s = '';
  // the far side span and the Pest abutment
  s += P.far(.4, () => P.fill(`M362 ${far.deck - 2}H${far.x0}V${far.deck + 4}H362Z`, 'stone2', { w: .4 }) + P.fill(P.rect(358, far.deck - 5, 8, 9), 'granite', { w: .4 }));
  // the main span's deck: a lattice parapet between rails
  const deck = (xa, xb) => {
    let lat = '';
    for (let x = xa; x < xb - 2; x += 2.6 + Math.max(0, x - fx) * .05) lat += `M${f(x)} ${f(top(x) + 1)}L${f(x + 2.6)} ${f(bot(x) - 1)}M${f(x + 2.6)} ${f(top(x) + 1)}L${f(x)} ${f(bot(x) - 1)}`;
    return P.fill(`M${xa} ${f(top(xa))}L${xb} ${f(top(xb))}L${xb} ${f(bot(xb) + 3)}L${xa} ${f(bot(xa) + 1)}Z`, 'chain', { w: .5 }) + P.line(lat, '#8b9088', .42, { op: .8 })
      + P.line(`M${xa} ${f(top(xa))}L${xb} ${f(top(xb))}`, '#5b625a', 1.3) + P.line(`M${xa} ${f(bot(xa))}L${xb} ${f(bot(xb))}`, '#5b625a', 1);
  };
  s += deck(fx, nx + 2);
  // the main span's chains, the downstream one behind, sagging almost to the deck; hangers down to the parapet
  const chain = (dx, dy, w, op) => {
    const ax = fx - 2 + dx, ay = far.top + 5 + dy, bx = nx + 1 + dx, by = near.top + 6 + dy, tm = .42, mx = ax + (bx - ax) * .36, my = top(mx) - 2 + dy * .5;
    const cx = (mx - (1 - tm) ** 2 * ax - tm * tm * bx) / (2 * tm * (1 - tm)), cy = (my - (1 - tm) ** 2 * ay - tm * tm * by) / (2 * tm * (1 - tm));
    const d = `M${f(ax)} ${f(ay)}Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}`;
    let h = '';
    for (let t = .05; t < .97; t += .045) { const x = (1 - t) ** 2 * ax + 2 * t * (1 - t) * cx + t * t * bx, y = (1 - t) ** 2 * ay + 2 * t * (1 - t) * cy + t * t * by; if (top(x) - y > 1.5) h += `M${f(x)} ${f(y)}V${f(top(x))}`; }
    let pins = '';
    for (let t = .08; t < 1; t += .085) { const x = (1 - t) ** 2 * ax + 2 * t * (1 - t) * cx + t * t * bx, y = (1 - t) ** 2 * ay + 2 * t * (1 - t) * cy + t * t * by; pins += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(w * .32)}" fill="${P.ink('#9aa198')}"/>`; }
    return P.line(h, 'chain', .45, { op }) + P.line(d, null, w + 1.3, { op }) + P.line(d, 'chain', w, { op }) + P.line(d, '#8d948c', w * .25, { op: op * .9 }) + (op > .9 ? pins : '');
  };
  s += chain(-3, 2, 2, .7);
  s += P.far(.36, () => pylon(P, far));
  s += chain(0, 0, 3.2, 1);
  // the near pylon, a triumphal arch of dressed stone on its cutwater
  s += pylon(P, near);
  // the side span: the road out of the arch to the Buda abutment, the chains swooping down to their anchorage
  const ne = near.x0 + near.side + near.face, sd = (x) => near.deck + 2 + (x - ne) * .3;
  let lat = '';
  for (let x = ne; x < 600; x += 3.6) lat += `M${f(x)} ${f(sd(x) - 5)}L${f(x + 3.6)} ${f(sd(x + 3.6) + 1)}M${f(x + 3.6)} ${f(sd(x + 3.6) - 5)}L${f(x)} ${f(sd(x) + 1)}`;
  s += P.fill(`M${ne} ${f(sd(ne) - 6)}L600 ${f(sd(600) - 6)}V${f(sd(600) + 4)}L${ne} ${f(sd(ne) + 4)}Z`, 'chain', { w: .5 }) + P.line(lat, '#8b9088', .45, { op: .8 }) + P.line(`M${ne} ${f(sd(ne) - 6)}L600 ${f(sd(600) - 6)}`, '#5b625a', 1.4);
  const side = (dy, w) => { const d = `M${ne - 1} ${near.top + 6 + dy}Q548 ${near.deck - 22 + dy} 604 ${near.deck + 14 + dy}`; return P.line(d, null, w + 1.3) + P.line(d, 'chain', w) + P.line(d, '#8d948c', w * .25); };
  s += side(3, 2) + side(0, 3.4);
  let rods = '';
  for (let x = ne + 6; x < 590; x += 7) { const t = (x - ne + 1) / (605 - ne), y = (1 - t) ** 2 * (near.top + 6) + 2 * t * (1 - t) * (near.deck - 22) + t * t * (near.deck + 14); if (sd(x) - 6 - y > 2) rods += `M${f(x)} ${f(y)}V${f(sd(x) - 6)}`; }
  s += P.line(rods, 'chain', .5);
  // the Buda abutment and its lion
  s += P.fill('M504 292H600V322H500Z', 'granite') + P.lite('M504 292H600V294.5H504Z', 'granite', .25) + P.stipple('M504 292H600V322H500Z', 'granite', 30, { box: [500, 292, 100, 30], op: .35 });
  for (let y = 298; y < 320; y += 6) s += P.line(`M502 ${y}H600`, '#7a7466', .4, { op: .6 });
  s += P.fill(P.rect(504, 274, 70, 18), 'stone2', { w: .6 }) + P.lite(P.rect(504, 274, 70, 2.4), 'stone2', .3) + P.fill(P.rect(501, 272, 76, 3), 'stone', { w: .5 });
  s += P.flat(P.rect(512, 279, 54, 9), 'stone2', { op: .5 }) + P.line('M512 279h54v9h-54Z', '#8a7f68', .5, { op: .7 });
  s += lion(P, 540, 272, 1.18, -1);
  // people and a cab on the deck, small with distance, behind the parapet
  for (const [x, k, kind, c] of [[416, .3, 'gent', '#2f3440'], [424, .32, 'lady', '#f2ece0'], [436, .36, 'boater', '#3d4a3c'], [441, .36, 'lady', '#e8b9b3']]) s += P.far(.25, () => P.person(x, top(x) + 1, k, kind, { c, dir: x % 2 ? 1 : -1 }));
  if (P.war === 'war') s += P.flag(458, 189, .8, 'HU', { h: 16 }) + P.flag(484, 187, .8, 'HU', { h: 16 });
  // lamps along the deck
  for (const [x, k] of [[412, .3], [430, .38]]) s += P.far(.3, () => P.lamp(x, top(x) + 1, k, 'single', { h: 40 }));
  return s;
}
function pylon(P, p) {
  const { f } = P, u = p.side / 40, xs = p.x0, xm = p.x0 + p.side, xe = xm + p.face, tl = p.top + 3.5 * u, dk = p.deck + 6 * u;
  const yAt = (x) => tl + (p.top - tl) * (x - xs) / (xm - xs); // the side face's top, falling away from us
  let s = '';
  // the pier in the river, its cutwater pointing upstream
  s += P.fill(`M${f(xs - 9 * u)} ${f(p.base)}L${f(xs - 2 * u)} ${f(dk - 1)}H${f(xe + 2 * u)}V${f(p.base)}Z`, 'granite') + P.shade(`M${f(xm)} ${f(dk - 1)}H${f(xe + 2 * u)}V${f(p.base)}H${f(xm)}Z`, 'granite', .22);
  s += P.lite(`M${f(xs - 9 * u)} ${f(p.base)}L${f(xs - 2 * u)} ${f(dk - 1)}H${f(xs + 2 * u)}L${f(xs - 4 * u)} ${f(p.base)}Z`, 'granite', .2);
  // the long side: dressed stone in courses, a pilaster at each end, a sunk panel between
  const sideD = `M${f(xs)} ${f(dk)}V${f(tl)}L${f(xm)} ${f(p.top)}V${f(dk + 1.5 * u)}Z`;
  s += P.fill(sideD, 'stone') + P.stipple(sideD, 'stone', Math.round(46 * u), { box: [xs, p.top, p.side, dk - p.top], op: .3 });
  for (let y = 9 * u; y < dk - p.top - 2; y += 5.4 * u) s += P.line(`M${f(xs + 1)} ${f(yAt(xs) + y)}L${f(xm - 1)} ${f(p.top + y + 1.5 * u * (y / (dk - p.top)))}`, 'stone2', .45 * Math.max(.6, u), { op: .7 });
  for (const x of [xs + 1.5 * u, xm - 6.5 * u]) s += P.fill(`M${f(x)} ${f(yAt(x) + 7 * u)}H${f(x + 5 * u)}V${f(dk)}H${f(x)}Z`, 'stone2', { w: .4 });
  s += P.shade(`M${f(xs + 10 * u)} ${f(yAt(xs + 10 * u) + 16 * u)}L${f(xm - 10 * u)} ${f(yAt(xm - 10 * u) + 16 * u)}V${f(dk - 12 * u)}H${f(xs + 10 * u)}Z`, 'stone', .1);
  // the arch face, foreshortened, the road running out through it
  const faceD = `M${f(xm)} ${f(dk + 1.5 * u)}V${f(p.top)}H${f(xe)}V${f(dk + 2 * u)}Z`;
  const ax0 = xm + p.face * .2, ax1 = xe - p.face * .16, ay = p.top + 30 * u, ab = p.deck + 2 * u, rx = (ax1 - ax0) / 2;
  const hole = `M${f(ax0)} ${f(ab)}V${f(ay + 7 * u)}A${f(rx)} ${f(7 * u)} 0 0 1 ${f(ax1)} ${f(ay + 7 * u)}V${f(ab)}Z`;
  s += P.fill(faceD, 'stone') + P.lite(faceD, 'stone', .12, { op: .6 });
  s += P.fill(hole, '#4a4a4c', { w: .5 }) + P.flat(`M${f(ax0 + rx * .9)} ${f(ab)}V${f(ay + 9 * u)}A${f(rx * .5)} ${f(5 * u)} 0 0 1 ${f(ax1)} ${f(ay + 8 * u)}V${f(ab)}Z`, '#b9c4c4', { op: .55 }) + P.flat(`M${f(ax0)} ${f(ab)}L${f(ax0 + rx)} ${f(ab - 4 * u)}H${f(ax1)}V${f(ab)}Z`, 'ground', { op: .8 });
  for (let y = 9 * u; y < dk - p.top - 2; y += 5.4 * u) if (p.top + y < ay) s += P.line(`M${f(xm + 1)} ${f(p.top + y)}H${f(xe - 1)}`, 'stone2', .45 * Math.max(.6, u), { op: .7 });
  s += P.line(`M${f(ax0 - 1.5 * u)} ${f(ab)}V${f(ay + 7 * u)}A${f(rx + 1.5 * u)} ${f(8.5 * u)} 0 0 1 ${f(ax1 + 1.5 * u)} ${f(ay + 7 * u)}V${f(ab)}`, 'stone2', 1.2 * Math.max(.5, u));
  // cornice and attic over both faces; the chain saddles; the arms over the arch
  s += P.fill(`M${f(xs - 1.5 * u)} ${f(tl + 7 * u)}L${f(xm)} ${f(p.top + 7 * u)}H${f(xe + 1.5 * u)}V${f(p.top + 10.5 * u)}H${f(xm)}L${f(xs - 1.5 * u)} ${f(tl + 10.5 * u)}Z`, 'stone2', { w: .5 });
  s += P.fill(`M${f(xs + 1)} ${f(tl + 7 * u)}V${f(tl - 1 * u)}L${f(xm)} ${f(p.top - 1 * u)}H${f(xe - 1)}V${f(p.top + 7 * u)}H${f(xm)}Z`, 'stone', { w: .5 }) + P.shade(P.rect(xm, p.top - 1 * u, p.face - 1, 8 * u), 'stone', .12);
  if (u > .6) {
    const sx = (ax0 + ax1) / 2, sy = p.top + 13.5 * u, sw = 5.4 * u, sh = 7 * u;
    s += `<path d="M${f(sx - sw / 2)} ${f(sy)}h${f(sw)}v${f(sh * .55)}q0 ${f(sh * .45)} ${f(-sw / 2)} ${f(sh * .45)}q${f(-sw / 2)} 0 ${f(-sw / 2)} ${f(-sh * .45)}Z" fill="${P.ink('#b8352e')}" stroke="${P.keyC()}" stroke-width=".45"/><path d="M${f(sx - sw / 2)} ${f(sy + sh * .3)}h${f(sw / 2)}M${f(sx - sw / 2)} ${f(sy + sh * .55)}h${f(sw / 2)}" stroke="${P.ink('#f2ead6')}" stroke-width="${f(.7 * u)}"/><path d="M${f(sx + sw * .25)} ${f(sy + 1)}v${f(sh * .7)}M${f(sx + sw * .05)} ${f(sy + 2.4 * u)}h${f(sw * .4)}" stroke="${P.ink('#f2ead6')}" stroke-width="${f(.7 * u)}"/>`;
    s += P.flat(`M${f(sx - sw * .7)} ${f(sy - .5)}q${f(sw * .7)} ${f(-2.6 * u)} ${f(sw * 1.4)} 0`, '#e2c15a', { op: .9 }) + P.line(`M${f(sx - sw * .5)} ${f(sy - 1.4 * u)}h${f(sw)}`, 'gold', .9 * u);
  }
  return s;
}
/** A lion couchant on its plinth, head raised, as at the Chain Bridge's ends; dir -1 faces left. */
function lion(P, x, by, s, dir) {
  const { f } = P, m = dir < 0 ? 1 : -1, X = (k) => f(x + k * s * m), Y = (k) => f(by - k * s);
  const pt = (str) => str.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (q, a, b) => `${X(+a)} ${Y(+b)}`);
  let d = '';
  // the tail hung over the plinth's end, the body long and low, the haunch drawn up
  d += P.line(pt('M23 4 Q28 3 28 -2'), 'stone2', 1.5 * s) + P.fill(pt('M27.4 -1 Q30.4 -4 28.2 -7.4 Q25.8 -4 27.4 -1 Z'), 'stone2', { w: .4 });
  d += P.fill(pt('M-13 0 L-14 7 Q-13 12 -6 12.5 Q6 13.4 14 11.6 Q22 10.6 24 5 Q25 1 22 0 Z'), 'stone');
  d += P.fill(pt('M8 0.5 Q7 9 14 11.6 Q21 11.2 22.5 5.5 Q22 1 17 0.5 Z'), 'stone', { w: .45 }) + P.shade(pt('M-12 0 Q0 3.6 22 0 Z'), 'stone', .22);
  d += P.lite(pt('M-4 11.6 Q4 13 12 11.4 Q4 12 -4 11.6 Z'), 'stone', .3);
  // the forepaws stretched out before it
  d += P.fill(pt('M-11 0 L-28 0 Q-30 1.6 -28 3.2 L-11 3.2 Z'), 'stone', { w: .45 }) + P.fill(pt('M-10 3.2 L-25.5 3.2 Q-27.5 4.8 -25.5 6.4 L-11 6.4 Z'), 'stone', { w: .45 });
  // the mane, heavy and curled over the shoulders, the head raised and looking out over the river
  d += P.fill(pt('M-3 1.5 Q0 12 -3 19 Q-6 25.5 -13.5 26 Q-21 25.6 -23.5 20.5 Q-26 14 -22 8 Q-18 1.5 -11 1.2 Z'), 'stone2');
  for (const [a, b] of [[-6, 7], [-5, 12], [-7, 18], [-11, 22.5], [-16, 23], [-19, 9], [-14, 5], [-9, 9], [-11, 15]]) d += P.line(pt(`M${a} ${b} Q${a - 1.8} ${b + .4} ${a - 1.4} ${b + 2.6}`), 'stone', .75 * s);
  d += P.fill(pt('M-16.5 21.5 Q-21 22.6 -24.6 20.6 Q-28.4 18.4 -28.8 15.6 Q-28.4 13 -25 13 Q-21 13.2 -17.6 14.6 Z'), 'stone', { w: .5 });
  d += P.fill(pt('M-29.2 16.6 Q-28.4 14.4 -27 15.2 Q-27.6 17 -29.2 16.6 Z'), '#5a5248', { w: .3 }) + P.line(pt('M-28.6 14.6 Q-26.6 15.2 -24.2 13.8'), null, .55) + `<circle cx="${X(-22.4)}" cy="${Y(18.6)}" r="${f(.7 * s)}" fill="${P.keyC()}"/>` + P.line(pt('M-24.6 20.2 Q-22.4 21.2 -19.6 20.2'), 'stone2', .7);
  d += P.lite(pt('M-8 23.6 Q-13 25.4 -18 23.8 Q-13 23.4 -10 21.6 Z'), 'stone2', .3);
  return d;
}

// ---------- the quay ----------
function quay(P) {
  const { f } = P;
  let s = '';
  // the river wall and its balustrade
  s += P.fill('M24 318H580V330H24Z', 'granite') + P.lite('M24 318H580V320H24Z', 'granite', .3);
  for (let x = 30; x < 580; x += 26) s += P.line(`M${x} 320V330`, '#7a7466', .5, { op: .6 });
  let bal = '';
  for (let x = 28; x < 578; x += 4.4) bal += `M${f(x)} 316.5v-6.5`;
  s += P.line(bal, 'stone2', 1.6) + P.line(bal, 'stone', .8);
  s += P.fill('M24 307H580V310H24Z', 'stone2', { w: .45 }) + P.lite('M24 307H580V308H24Z', 'stone2', .35);
  for (let x = 40; x < 580; x += 66) s += P.fill(P.rect(x - 3, 305, 6, 13), 'stone2', { w: .45 });
  // the promenade and the road, its tram rails along the river
  s += P.paving(330, 364, { c: 'ground', vx: 300, seed: 2 });
  s += P.line('M24 346H580M24 350H580', '#6d6a66', .9) + P.line('M24 346.4H580M24 350.4H580', '#efe8d8', .4, { op: .6 });
  s += P.line('M24 334H580', '#9a8e74', .8, { op: .7 });
  // the overhead wire for the trolley
  s += P.line('M24 296H580', '#3a3a38', .5, { op: .5 });
  return s;
}

// ---------- people ----------
/** A hussar officer: frogged dark blue attila, red breeches, a shako with its plume, his sabre. */
function hussar(P, x, y, s, o = {}) {
  const { f } = P, dir = o.dir ?? 1, top = y - 30 * s;
  let d = P.person(x, y, s, 'sailor', { c: '#202c55', legs: '#a8262c', dir, stride: o.stride });
  for (let k = 0; k < 4; k++) d += P.line(`M${f(x - 2.2 * s)} ${f(top + 9 * s + k * 1.7 * s)}h${f(4.4 * s)}`, '#e2c15a', .45 * s);
  if (o.stride == null) d += P.flat(`M${f(x - 2.3 * s)} ${f(y)}l${f(.4 * s)} ${f(-5 * s)}h${f(3.8 * s)}l${f(.4 * s)} ${f(5 * s)}Z`, '#1a1a1c');
  d += P.fill(`M${f(x - 2.4 * s)} ${f(top + 3.4 * s)}L${f(x - 2 * s)} ${f(top - 2.6 * s)}H${f(x + 2 * s)}L${f(x + 2.4 * s)} ${f(top + 3.4 * s)}Z`, '#1d2346', { w: .4 }) + P.line(`M${f(x - 2.1 * s)} ${f(top - 1.6 * s)}h${f(4.2 * s)}`, '#e2c15a', .5 * s);
  d += P.line(`M${f(x + 1.2 * s * dir)} ${f(top - 2.4 * s)}l${f(.6 * s * dir)} ${f(-3 * s)}`, '#f4f1e8', 1.1 * s);
  d += P.line(`M${f(x - 2 * s * dir)} ${f(y - 14 * s)}q${f(-3 * s * dir)} ${f(6 * s)} ${f(-5 * s * dir)} ${f(12 * s)}`, '#c9c2b0', .8 * s);
  // the fur-trimmed pelisse slung from the left shoulder
  d += P.fill(`M${f(x - 2.8 * s * dir)} ${f(top + 7 * s)}q${f(-2.6 * s * dir)} ${f(4 * s)} ${f(-1.6 * s * dir)} ${f(9 * s)}l${f(2 * s * dir)} ${f(-.4 * s)}Z`, '#2a3a6a', { w: .3 });
  return d;
}
/** A hussar officer and a lady walking, as a two-frame sprite. */
function hussarPair(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 30 * s, H = 38 * s;
  const frame = (st) => { const b = hussar(P, 10 * s, 36 * s, s, { dir: 1, stride: st }) + P.person(20 * s, 36 * s, s * .98, 'lady', { c: '#f0e6d6', dir: 1, stride: (st + 1) % 2, parasol: '#d8576a' }); return dir < 0 ? `<g transform="translate(${f(W)} 0) scale(-1 1)">${b}</g>` : b; };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 * s };
}
/** A perambulator: a deep black body on four spoked wheels, its hood up, a long handle. */
function pram(P, x, y, s) {
  const { f } = P, S = (k) => k * s;
  let d = '';
  for (const wx of [x - S(5), x + S(4)]) d += `<circle cx="${f(wx)}" cy="${f(y - S(2.6))}" r="${f(S(2.6))}" fill="none" stroke="${P.ink('#1d1a17')}" stroke-width="${f(S(.6))}"/><path d="M${f(wx - S(2.6))} ${f(y - S(2.6))}h${f(S(5.2))}M${f(wx)} ${f(y - S(5.2))}v${f(S(5.2))}" stroke="${P.ink('#1d1a17')}" stroke-width="${f(S(.3))}"/>`;
  d += P.fill(`M${f(x - S(8))} ${f(y - S(11))}H${f(x + S(7))}Q${f(x + S(7))} ${f(y - S(5))} ${f(x)} ${f(y - S(5))}Q${f(x - S(7))} ${f(y - S(5))} ${f(x - S(8))} ${f(y - S(11))}Z`, '#26242a', { w: .5 });
  d += P.fill(`M${f(x - S(8))} ${f(y - S(11))}Q${f(x - S(8))} ${f(y - S(18))} ${f(x - S(1))} ${f(y - S(18))}L${f(x - S(1))} ${f(y - S(11))}Z`, '#3a3640', { w: .45 }) + P.line(`M${f(x - S(7))} ${f(y - S(13))}q${f(S(3))} ${f(-S(4))} ${f(S(6))} ${f(-S(4))}`, '#5a5660', .4);
  d += P.line(`M${f(x + S(6))} ${f(y - S(10))}L${f(x + S(12))} ${f(y - S(17))}h${f(S(1.6))}`, '#3a2a1e', .8 * s) + P.fill(P.rect(x - S(4), y - S(12.6), S(6), S(2)), '#f4f0e6', { w: .3 });
  return d;
}
/** A Budapest advertising column, its little dome on top. */
function column(P, x, by, s) {
  const { f } = P, S = (k) => k * s;
  let d = P.fill(P.rect(x - S(11), by - S(4), S(22), S(4)), 'granite', { w: .5 });
  d += P.fill(P.rect(x - S(9), by - S(56), S(18), S(52)), '#dccfb2') + P.shade(P.rect(x + S(3), by - S(56), S(6), S(52)), '#dccfb2', .2);
  // its posters: a play, a café's band, the spa
  d += P.fill(P.rect(x - S(8), by - S(50), S(9), S(14)), '#e9c66a', { w: .35 }) + P.fill(P.rect(x + S(1.5), by - S(52), S(6), S(18)), '#c9d6c0', { w: .35 }) + P.fill(P.rect(x - S(7), by - S(32), S(13), S(10)), '#d98a7a', { w: .35 });
  for (let i = 0; i < 3; i++) d += P.line(`M${f(x - S(6.5))} ${f(by - S(46) + i * S(3))}h${f(S(6))}`, '#3a3530', .5, { op: .7 });
  d += P.fill(P.rect(x - S(10.5), by - S(60), S(21), S(4)), 'iron', { w: .5 }) + P.fill(P.dome(x, by - S(60), S(9), S(9)), 'copper') + P.line(`M${f(x)} ${f(by - S(72))}v${f(-S(4))}`, 'gold', .8);
  return d;
}
