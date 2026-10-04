// Lisbon from the Tagus: the Praça do Comércio opens on the river, its arcaded wings washed in ochre, the triumphal
// arch of the Rua Augusta in the middle of the north range with Glory crowning Genius and Valour; King José rides his
// bronze horse in the square; the Cais das Colunas steps down into the water between its two columns. Above, the
// Alfama climbs to the Castle of São Jorge, the Sé's twin towers half way, a little tram grinding up the hill; on the
// left the Chiado and the roofless arches of the Carmo. Fragatas under tan sails, a ferry to Cacilhas, gulls.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'LIS',
  greet: 'LEMBRANÇA de LISBOA',
  nation: 'PT',
  flag: 'PT',
  flower: 'bougainvillea',
  flower2: 'jacaranda',
  frame: { band: ['#d8bf5a', '#726939'], gold: '#e9cf78', ink: '#1e3e8a', leaf: ['#6a9a54', '#2f5a3a'], year: '#1e3e8a', halo: '#fbf0d2' },
  horizon: 250,
  clouds: 4,
  wind: -1,
  birds: { c: '#f6f4ec', n: 5, y: 112, s: 1.05, x: .45 },
  pal: {
    key: '#28231f', ochre: '#e9c97e', ochre2: '#d9ad62', lime: '#f1e8d2', stone: '#ebe2cf', stone2: '#bcae90', roof: '#b75d3e',
    hill: '#c9b98e', wall: '#efd9b4', wall2: '#e7c6c0', wall3: '#e9e2c8', water: '#4f8b99', bronze: '#4d6a58', ground: '#ddcda6',
    sail: '#a9643a', glass: '#36475a', sash: '#f0e7d3', iron: '#2a3631', gold: '#d8ad3e',
  },

  // bougainvillea: papery magenta bracts in threes, each with its tiny cream flower, among heart-shaped leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(22, 13, 215, '#3f6e3e', { shape: 'heart', vein: '#7fa866' }) + F.leaf(20, 12, 140, '#4f7e46', { shape: 'heart', vein: '#7fa866' }) + F.leaf(16, 10, 275, '#4f7e46', { shape: 'heart' });
    const bract = (x, y, a, sc) => F.at(x, y, F.radial(3, 11, 11, ['#c8287a', '#d8358a', '#b81e6c'], { shape: 'heart', vein: '#8a1450', lite: '#ef7ab4' }) + '<circle r="1.6" fill="#f6eed2"/><circle cx="2.6" cy="-1" r="1" fill="#f6eed2"/>', a, sc);
    s += bract(-12, -9, 20, .62) + bract(13, 10, -30, .58) + bract(12, -12, 50, .5) + bract(0, 0, 0, 1);
    return s;
  },
  // jacaranda: a spray of lilac-blue bells
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M-12 10Q-2 4 6 -8', I.leaf[1], .9);
    for (let i = 0; i < 7; i++) s += F.at(-10 + i * 2.6, 8 - i * 2.4, F.leaf(5, 1.6, -60, '#5f8a52', { shape: 'lance' }) + F.leaf(5, 1.6, 120, '#4f7a46', { shape: 'lance' }));
    for (const [x, y, a] of [[2, -6, 160], [6, -11, 200], [-3, -10, 130], [9, -4, 230], [4, -15, 180], [-1, -15, 150], [10, -12, 210]]) s += F.at(x, y, F.bell(4.4, 6, '#8a78c8', { lite: '#b9a8e8' }), a);
    return s;
  },

  back(P, T) {
    let s = '';
    // the hills: the Chiado and the Carmo on the left, the Alfama climbing to the castle on the right
    s += P.far(.7, () => chiado(P));
    s += P.far(.62, () => alfama(P));
    // a tram grinding up the hill toward the castle
    s += P.far(.6, () => P.mover(T.tramSide({ c: '#d9a92e', band: '#f0e2b8', s: .3, dir: 1 }), { path: [[386, 182, 1, 0, 0], [390, 180, 1, .05, 1], [436, 154, 1, .5, 1], [440, 152, 1, .54, 0], [440, 152, 1, 1, 0]], dur: 56, offset: 10 }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the north range of the square, the arch in its middle, the side ranges coming toward the river
    s += P.far(.3, () => northRange(P));
    s += P.far(.28, () => arch(P, 330, 258));
    s += P.far(.22, () => sideRange(P, -1) + sideRange(P, 1));
    // the square: its paving, a tram crossing under the arcades, the king on his horse, strollers
    s += P.far(.2, () => P.flat('M0 257H600V302H0Z', 'ground') + P.line('M0 266H600M0 270H600', '#8a8070', .6, { op: .5 }));
    s += P.far(.2, () => fade(P, T.tramSide({ c: '#d9a92e', band: '#f0e2b8', number: '15', s: .42, dir: -1 }), { y: 268, dir: -1, dur: 44, rest: .35, x0: 90, x1: 520, offset: 8 }));
    s += P.far(.18, () => P.crowd(270, 420, 274, 9, { s: .42, seed: 6 }) + P.crowd(60, 180, 276, 6, { s: .44, seed: 9 }));
    s += P.far(.17, () => P.tree(84, 288, .8, 'round') + P.tree(538, 288, .85, 'round') + P.tree(500, 286, .7, 'round'));
    s += P.far(.15, () => joseI(P, 226, 290));
    s += P.far(.12, () => P.crowd(300, 470, 292, 8, { s: .58, seed: 14 }) + P.lamp(282, 296, .6, 'iron', { h: 70 }) + P.lamp(470, 296, .6, 'iron', { h: 70 }));
    s += P.far(.1, () => fade(P, T.fiacre({ s: .5, dir: 1, horses: 2, body: '#2a2622' }), { y: 294, dir: 1, dur: 40, rest: .45, x0: 280, x1: 548, offset: 22 }));
    // the river, the quay's edge, the Cais das Colunas stepping down into the water
    s += P.water(300, 384, { seed: 3, shimmer: 8, x0: 60, x1: 560 });
    s += P.fill('M0 296H600V303H0Z', 'stone2', { w: .6 }) + P.lite('M0 296H600V298H0Z', 'stone2', .3);
    s += reflect(P, 40, 560, 304, 26, '#e9c97e', 8);
    s += cais(P, 150, 300);
    // across the river: fragatas under their tan sails, the ferry for Cacilhas
    s += P.cross(T.steamer({ s: .5, dir: -1, hull: '#2a2c30', house: '#f2ece0', funnel: ['#e8c54a', '#1d1a17'], flag: 'PT' }), { y: 318, dir: -1, dur: 70, rest: .3, offset: 12 });
    s += P.cross(fragata(P, 1, 1.1), { y: 344, dir: 1, dur: 110, offset: 40 });
    s += P.cross(fragata(P, -1, .8), { y: 328, dir: -1, dur: 130, rest: .15, offset: 85 });
    s += P.setStreet(294, 250, 560, .58);
    return portuguese(s);
  },

  front(P, T, st) {
    let s = '';
    // the landing stage in the foreground: varinas with their baskets, a sailor, a gentleman waiting for the ferry
    s += P.fill('M-4 352H210L216 360V404H-4Z', 'stone') + P.shade('M-4 360H216V404H-4Z', 'stone', .15) + P.line('M-4 352H210L216 360', 'stone2', .8);
    s += P.stipple('M-4 352H210L216 360V404H-4Z', 'stone', 40, { box: [0, 352, 216, 30], op: .3 });
    for (const x of [30, 96, 160]) s += P.fill(P.rect(x - 3, 344, 6, 10), '#3a3a38', { w: .5 }) + P.fill(P.rect(x - 4, 343, 8, 2), '#3a3a38', { w: .35 });
    s += P.lamp(200, 356, 1.05, 'single', { h: 76 });
    s += varina(P, 64, 374, 1.15, '#2a3a5a') + varina(P, 84, 376, 1.1, '#6a2a3a', -1);
    s += P.person(124, 374, 1.12, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(150, 376, 1.14, 'gent', { c: '#2a2c34', hat: '#1b1b20', dir: -1 }) + P.person(166, 377, 1.12, 'lady', { c: '#f3eee2', parasol: '#d9b0c8', dir: -1 });
    s += P.wall(186, 362, 10, 14);
    // gulls on the mooring posts in the water
    for (const [x, y] of [[262, 372], [520, 366]]) s += P.fill(P.rect(x - 3, y - 18, 6, 22), '#5a4636', { w: .5 }) + gull(P, x, y - 18);
    return portuguese(s);
  },
};

// ---------- helpers ----------
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>`;
}
function gull(P, x, y) {
  return `<path d="M${x - 4} ${y}q2 -5 6 -4l3 -2l1 2q-1 4 -6 4Z" fill="${P.ink('#f4f2ea')}" stroke="${P.keyC()}" stroke-width=".4"/><path d="M${x + 5} ${y - 6}l2 .6" stroke="${P.ink('#e8a83a')}" stroke-width=".8"/>`;
}

// ---------- the hills ----------
function chiado(P) {
  let s = P.fill('M0 196Q30 140 80 126Q140 118 200 132Q250 146 290 176L300 196Z', 'hill');
  s += P.row(40, 230, 152, { hMin: 10, hMax: 18, wMin: 10, wMax: 16, style: 'south', seed: 34, walls: ['#efd9b4', '#e7c6c0', '#e9e2c8'], roofC: '#b75d3e', placard: false, flagSpot: false });
  s += P.row(4, 296, 182, { hMin: 14, hMax: 28, wMin: 11, wMax: 18, style: 'south', seed: 33, walls: ['#efd9b4', '#e7c6c0', '#e9e2c8', '#f2e6c2'], roofC: '#b75d3e', placard: false, flagSpot: false });
  // the Carmo: the convent church left roofless by the earthquake, its gothic arches against the sky
  s += P.fill(P.rect(104, 134, 46, 16), 'stone') + P.windows(106, 137, 42, 10, 4, 1, { gothic: true, ww: .4 });
  for (let i = 0; i < 4; i++) { const x = 108 + i * 10, arc = `M${x} 134V128Q${x} 118 ${x + 4} 115Q${x + 8} 118 ${x + 8} 128V134`; s += `<path d="${arc}" fill="none" stroke="${P.keyC()}" stroke-width="3"/><path d="${arc}" fill="none" stroke="${P.ink('stone')}" stroke-width="1.8"/>`; }
  s += P.fill(P.rect(148, 122, 9, 28), 'stone', { w: .5 }) + P.fill(P.gothic(150.5, 127, 4, 10), 'glass');
  // São Roque's front and a few cypresses
  s += P.fill(P.rect(40, 140, 30, 22), 'lime', { w: .5 }) + P.fill(P.gable(38, 141, 34, 8), 'lime', { w: .5 }) + P.fill(P.arch(51, 148, 8, 14), 'glass', { w: .35 });
  s += P.tree(186, 154, .6, 'cypress') + P.tree(84, 140, .55, 'cypress') + P.tree(250, 168, .6, 'round') + P.tree(30, 170, .7, 'round') + P.tree(206, 164, .55, 'round');
  return s;
}
function alfama(P) {
  const lf = P.L.leaf;
  let s = P.fill('M290 200Q340 170 390 150Q440 124 476 116Q520 108 560 116L600 126V230H290Z', 'hill');
  s += P.shade('M520 110Q560 114 600 126V230H560Q556 160 520 110Z', 'hill', .15);
  // the castle on its crown: curtain walls, square towers, the Portuguese flag
  s += P.fill('M440 128L446 104H540L548 128Z', 'stone2', { w: .6 }) + P.shade('M520 104H540L548 128H524Z', 'stone2', .2);
  for (const [x, w, t] of [[448, 12, 90], [474, 14, 84], [500, 12, 92], [526, 12, 88]]) {
    s += P.fill(P.rect(x, t, w, 106 - t), 'stone2', { w: .55 });
    for (let k = 0; k < w; k += 4) s += P.flat(P.rect(x + k, t - 3, 2.4, 3), 'stone2');
    s += P.fill(P.rect(x + w / 2 - 1, t + 5, 2, 4), '#3a3430', { k: false });
  }
  for (let x = 446; x < 540; x += 5) s += P.flat(P.rect(x, 101.6, 2.6, 2.6), 'stone2');
  s += P.flag(481, 84, .7, 'PT', { h: 16 });
  // pines and the castle's trees
  const r = P.rng(5);
  for (let i = 0; i < 12; i++) {
    const x = 400 + r() * 190, y = 128 + r() * 24;
    s += `<path d="${P.blob(x, y, 5 + r() * 4, 3.6, 7, i + 8)}" fill="${P.ink(i % 3 ? lf.ever : lf.leaf ?? lf.dark)}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  }
  // the Alfama: houses stepping down the hill, pink, ochre and white
  s += P.row(380, 600, 158, { hMin: 10, hMax: 18, wMin: 9, wMax: 14, style: 'south', seed: 41, walls: ['#efd9b4', '#e7c6c0', '#e9e2c8', '#f2e6c2'], roofC: '#b75d3e', placard: false, flagSpot: false });
  s += P.row(300, 600, 180, { hMin: 12, hMax: 22, wMin: 10, wMax: 16, style: 'south', seed: 42, walls: ['#efd9b4', '#e7c6c0', '#e9e2c8', '#f2e6c2'], roofC: '#b75d3e', placard: false, flagSpot: false });
  // the Sé: two square towers with their battlements, the rose window between
  const sx = 400;
  s += P.fill(P.rect(sx, 154, 34, 26), 'stone') + P.fill(P.arch(sx + 12, 166, 10, 14), '#3a3430', { w: .4 }) + `<circle cx="${sx + 17}" cy="160" r="3" fill="${P.ink('glass')}" stroke="${P.ink('stone2')}" stroke-width=".8"/>`;
  for (const x of [sx - 4, sx + 28]) { s += P.fill(P.rect(x, 138, 10, 42), 'stone', { w: .55 }) + P.fill(P.arch(x + 3, 146, 4, 8), '#3a3430', { w: .3 }); for (let k = 0; k < 10; k += 3.4) s += P.flat(P.rect(x + k, 135, 2, 3), 'stone'); }
  // the street the tram climbs
  s += P.line('M384 180L442 148', '#e9dcc0', 2.4, { op: .9 }) + P.line('M384 180L442 148', '#8a7a64', .5);
  return s;
}

// ---------- the square ----------
/** The north range behind the arch: arcades below, two floors of windows, the tiled roof with its dormers. */
function northRange(P) {
  let s = '';
  for (const [x0, x1] of [[90, 276], [384, 560]]) {
    s += P.fill(P.rect(x0, 190, x1 - x0, 68), 'ochre') + P.fill(P.rect(x0 - 2, 186, x1 - x0 + 4, 5), 'lime', { w: .5 });
    s += P.fill(P.poly([[x0 - 2, 187], [x0 + 6, 176], [x1 - 6, 176], [x1 + 2, 187]]), 'roof', { w: .6 });
    s += P.windows(x0 + 2, 194, x1 - x0 - 4, 34, Math.round((x1 - x0) / 13), 2, { ww: .42, wh: .64 });
    s += P.windows(x0 + 6, 178, x1 - x0 - 12, 9, Math.round((x1 - x0) / 26), 1, { ww: .3, lit: .4 });
    // the arcade
    s += P.fill(P.rect(x0, 232, x1 - x0, 26), 'lime', { w: .5 });
    for (let x = x0 + 3; x < x1 - 8; x += 12.4) s += P.fill(P.arch(x, 236, 8, 22), '#5a4a3c', { w: .35 });
    s += P.flat(P.rect(x0, 232, x1 - x0, 2), 'ochre2');
    if (P.L.snow) s += P.flat(P.poly([[x0 - 2, 187], [x0 + 6, 177], [x1 - 6, 177], [x1 + 2, 187]]), '#f4f7fa', { op: .85 });
  }
  return s;
}
/** The side ranges of the square, coming toward the river, ending in their towers with bell-shaped roofs. */
function sideRange(P, side) {
  const { f } = P;
  // far end (at the north range) to near end (the tower by the river)
  const xf = side < 0 ? 92 : 558, xn = side < 0 ? -10 : 610;
  const q = (u, v) => [xf + (xn - xf) * u, (186 - u * 40) * (1 - v) + (258 + u * 40) * v];
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = P.fill(quad(0, 0, 1, 1), 'ochre') + P.shade(quad(0, 0, 1, 1), 'ochre', .08);
  s += P.fill(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 16], [q(0, 0)[0], q(0, 0)[1] - 9]]), 'roof', { w: .6 });
  s += P.fill(quad(0, .62, 1, 1), 'lime', { w: .5 });
  for (let i = 0; i < 9; i++) {
    const u0 = .04 + i * .105, u1 = u0 + .06;
    s += `<path d="${quad(u0, .7, u1, 1)}" fill="${P.ink('#5a4a3c')}"/>`;
    for (const [v0, v1] of [[.1, .26], [.36, .52]]) { const on = P.wr() < P.L.windows, tone = P.wr(); s += `<path d="${quad(u0 + .005, v0, u1 - .005, v1)}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".6"/>`; }
  }
  // the tower at the near end: a bell-shaped roof and its lantern
  const [tx0, ty0] = q(.86, 0), [tx1] = q(1.02, 0), w = tx1 - tx0, cx = tx0 + w / 2, top = ty0 - 22;
  s += P.fill(P.rect(Math.min(tx0, tx1), top, Math.abs(w), q(.86, 1)[1] - top + 10), 'ochre', { w: .6 }) + P.windows(Math.min(tx0, tx1) + 3, top + 6, Math.abs(w) - 6, 50, 2, 3, { ww: .4 });
  s += P.fill(`M${f(Math.min(tx0, tx1) - 3)} ${f(top)}C${f(Math.min(tx0, tx1) + 2)} ${f(top - 14)} ${f(cx - 6)} ${f(top - 22)} ${f(cx)} ${f(top - 30)}C${f(cx + 6)} ${f(top - 22)} ${f(Math.max(tx0, tx1) - 2)} ${f(top - 14)} ${f(Math.max(tx0, tx1) + 3)} ${f(top)}Z`, 'roof', { w: .6 });
  s += P.fill(P.rect(cx - 3, top - 36, 6, 7), 'lime', { w: .45 }) + P.line(`M${f(cx)} ${f(top - 36)}v-6`, 'gold', 1);
  s += P.wall(...q(.5, .66).map((v, i) => (i ? v - 14 : v - 5)), 10, 13);
  s += P.flagAt(...q(.3, .2));
  return s;
}
/** The arch of the Rua Augusta: its great opening between paired columns, the attic with the arms and the four
 * heroes, and Glory crowning Genius and Valour on the top. */
function arch(P, cx, by) {
  const { f } = P;
  const w = 108, x0 = cx - w / 2, ct = by - 84;
  let s = P.fill(P.rect(x0, ct, w, by - ct), 'stone') + P.stipple(P.rect(x0, ct, w, by - ct), 'stone', 50, { box: [x0, ct, w, by - ct], op: .3 });
  s += P.shade(P.rect(x0 + w - 12, ct, 12, by - ct), 'stone', .15);
  // the great opening, the street beyond lit far off
  s += P.fill(P.arch(cx - 16, by - 62, 32, 62), '#4a3e34', { w: .6 }) + P.flat(P.arch(cx - 9, by - 40, 18, 40), '#c9b48a', { op: .5 });
  s += P.fill(P.rect(cx - 3, by - 66, 6, 6), 'stone2', { w: .4 });
  // the six columns on their plinths, with niches between
  for (const x of [x0 + 8, x0 + 20, cx - 24, cx + 24, x0 + w - 20, x0 + w - 8]) s += P.fill(P.rect(x - 3, ct + 6, 6, by - ct - 18), 'stone', { w: .45 }) + P.shade(P.rect(x + 1, ct + 6, 2, by - ct - 18), 'stone', .2) + P.fill(P.rect(x - 4, by - 12, 8, 12), 'stone2', { w: .4 }) + P.fill(P.rect(x - 4, ct + 3, 8, 4), 'stone2', { w: .35 });
  for (const x of [x0 + 14, x0 + w - 14]) s += P.fill(P.arch(x - 3, ct + 30, 6, 16), '#5a4e40', { w: .35 });
  // the entablature and the attic: the royal arms between the four heroes
  s += P.fill(P.rect(x0 - 3, ct - 8, w + 6, 8), 'stone2', { w: .55 });
  s += P.fill(P.rect(x0 + 6, ct - 30, w - 12, 22), 'stone', { w: .55 }) + P.fill(P.rect(x0 + 4, ct - 33, w - 8, 3.4), 'stone2', { w: .45 });
  s += P.fill(`M${cx - 9} ${ct - 10}V${ct - 26}H${cx + 9}V${ct - 10}Q${cx} ${ct - 5} ${cx - 9} ${ct - 10}Z`, 'stone2', { w: .45 }) + P.fill(`M${cx - 5} ${ct - 14}V${ct - 23}H${cx + 5}V${ct - 14}Q${cx} ${ct - 10} ${cx - 5} ${ct - 14}Z`, '#ece4d0', { w: .35 });
  s += P.fill(`M${cx - 6} ${ct - 26}l1 -4h10l1 4Z`, 'gold', { w: .35 });
  for (const x of [x0 + 12, x0 + 30, x0 + w - 30, x0 + w - 12]) s += hero(P, x, ct - 33);
  // the crowning group on its pedestal
  s += P.fill(P.rect(cx - 16, ct - 46, 32, 13), 'stone', { w: .5 }) + P.fill(P.rect(cx - 18, ct - 48, 36, 2.6), 'stone2', { w: .4 });
  s += P.fill(`M${cx - 3} ${ct - 48}L${cx - 2.4} ${ct - 66}Q${cx} ${ct - 69} ${cx + 2.4} ${ct - 66}L${cx + 3} ${ct - 48}Z`, 'stone', { w: .45 }) + `<circle cx="${cx}" cy="${ct - 70}" r="2" fill="${P.ink('stone')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  s += P.line(`M${cx - 2} ${ct - 64}l-9 -4M${cx + 2} ${ct - 64}l9 -4`, 'stone', 1.6) + `<circle cx="${cx - 11}" cy="${ct - 69}" r="2.4" fill="none" stroke="${P.ink('gold')}" stroke-width="1"/><circle cx="${cx + 11}" cy="${ct - 69}" r="2.4" fill="none" stroke="${P.ink('gold')}" stroke-width="1"/>`;
  for (const k of [-1, 1]) s += P.fill(`M${cx + k * 13} ${ct - 48}l${k * 1} -12q${-k * 2} -3 ${-k * 4} 0l${-k * 1} 12Z`, 'stone', { w: .4 }) + `<circle cx="${cx + k * 11}" cy="${ct - 62}" r="1.7" fill="${P.ink('stone')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  return s;
}
function hero(P, x, by) {
  return P.fill(`M${x - 2.6} ${by}L${x - 2} ${by - 11}Q${x} ${by - 13} ${x + 2} ${by - 11}L${x + 2.6} ${by}Z`, 'stone', { w: .4 }) + `<circle cx="${x}" cy="${by - 13.6}" r="1.6" fill="${P.ink('stone')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
}
/** King José I on his horse, trampling serpents, on the tall pedestal with its groups at the sides. */
function joseI(P, x, by) {
  const { f } = P;
  let s = P.fill(P.rect(x - 22, by - 8, 44, 8), 'stone2', { w: .5 }) + P.fill(P.rect(x - 17, by - 40, 34, 32), 'stone', { w: .6 }) + P.shade(P.rect(x + 7, by - 40, 10, 32), 'stone', .18);
  s += P.fill(P.rect(x - 10, by - 32, 20, 12), 'bronze', { w: .4 }) + P.fill(P.rect(x - 19, by - 43, 38, 4), 'stone2', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(`M${x + k * 17} ${by - 8}l${k * 8} 0l${-k * 2} -14q${-k * 4} -6 ${-k * 6} 0Z`, 'bronze', { w: .4 });
  // the horse, rearing a little, the king in his plumed helmet
  const hy = by - 43;
  s += P.fill(`M${x - 12} ${hy}L${x - 11} ${hy - 9}Q${x - 10} ${hy - 15} ${x - 2} ${hy - 15}H${x + 6}L${x + 12} ${hy - 22}Q${x + 15} ${hy - 25} ${x + 17} ${hy - 22}L${x + 18} ${hy - 17}L${x + 14} ${hy - 16}L${x + 10} ${hy - 10}L${x + 9} ${hy}H${x + 6}L${x + 5} ${hy - 7}H${x - 6}L${x - 8} ${hy}Z`, 'bronze');
  s += P.line(`M${x - 11} ${hy - 12}q-5 3 -5 10`, 'bronze', 1.4);
  s += P.fill(`M${x - 3} ${hy - 15}L${x - 2} ${hy - 26}Q${x} ${hy - 28} ${x + 2} ${hy - 26}L${x + 3} ${hy - 15}Z`, 'bronze', { w: .45 }) + `<circle cx="${x}" cy="${hy - 29}" r="2.2" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  s += P.line(`M${x} ${hy - 31}q2 -3 0 -5`, 'bronze', 1) + P.line(`M${x + 2} ${hy - 22}l6 -3`, 'bronze', 1.2);
  s += P.lite(`M${x - 9} ${hy - 9}Q${x - 6} ${hy - 13} ${x - 1} ${hy - 13}H${x + 2}L${x} ${hy - 11}Z`, 'bronze', .35);
  return s;
}
/** The Cais das Colunas: marble steps going down into the river between two columns. */
function cais(P, cx, by) {
  const { f } = P;
  let s = '';
  for (let i = 0; i < 6; i++) s += P.fill(P.rect(cx - 50 + i * 2, by + i * 3, 100 - i * 4, 3.2), i % 2 ? 'stone' : 'stone2', { w: .35 });
  for (const x of [cx - 40, cx + 40]) {
    s += P.fill(P.rect(x - 6, by - 12, 12, 12), 'stone2', { w: .5 }) + P.fill(`M${x - 4} ${by - 12}L${x - 3.4} ${by - 76}H${x + 3.4}L${x + 4} ${by - 12}Z`, 'stone') + P.shade(`M${x + 1} ${by - 12}L${x + 1} ${by - 76}H${x + 3.4}L${x + 4} ${by - 12}Z`, 'stone', .2);
    s += P.fill(P.rect(x - 6, by - 82, 12, 6), 'stone2', { w: .45 }) + P.fill(`M${x - 5} ${by - 82}Q${x} ${by - 88} ${x + 5} ${by - 82}Z`, 'stone', { w: .4 });
  }
  return s;
}

// ---------- the river ----------
/** A fragata of the Tagus: a broad black barge with a painted bow, one great tanned sail and a jib. */
function fragata(P, dir = 1, s = 1) {
  const W = 70 * s, H = 74 * s, S = (n) => P.f(n * s);
  let b = '';
  b += `<path d="M${S(30)} ${S(62)}V${S(6)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(1.4)}"/>`;
  b += P.fill(`M${S(31)} ${S(8)}L${S(60)} ${S(14)}L${S(66)} ${S(58)}H${S(32)}Z`, 'sail', { w: .6 }) + P.shade(`M${S(48)} ${S(11)}L${S(60)} ${S(14)}L${S(66)} ${S(58)}H${S(52)}Z`, 'sail', .18);
  b += `<path d="M${S(31)} ${S(8)}L${S(60)} ${S(14)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(1)}"/>`;
  for (const y of [24, 36, 48]) b += `<path d="M${S(32)} ${S(y)}L${S(62 + (y - 14) * .1)} ${S(y + 3)}" stroke="${P.ink('#8a4a28')}" stroke-width="${S(.5)}" opacity=".6"/>`;
  b += P.fill(`M${S(29)} ${S(10)}L${S(8)} ${S(58)}H${S(28)}Z`, '#d9a46a', { w: .55 });
  b += P.fill(`M${S(2)} ${S(58)}H${S(68)}L${S(64)} ${S(68)}H${S(10)}Q${S(4)} ${S(66)} ${S(2)} ${S(58)}Z`, '#232326', { w: .6 });
  b += `<path d="M${S(4)} ${S(61)}H${S(66)}" stroke="${P.ink('#e8c54a')}" stroke-width="${S(1.2)}"/><path d="M${S(52)} ${S(63)}h${S(10)}" stroke="${P.ink('#c8402e')}" stroke-width="${S(2)}"/>`;
  b += P.person(18 * s, 58 * s, .7 * s, 'worker', { c: '#e9e4d6', legs: '#3a3a44' });
  const body = dir < 0 ? `<g transform="translate(${P.f(W)} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: doc(P.f(W), P.f(H), body), w: W, h: H, ax: W / 2, ay: 66 * s };
}
/** A varina: a fishwife barefoot under the flat basket on her head. */
function varina(P, x, by, s, c, dir = 1) {
  const { f } = P;
  let d = P.person(x, by, s, 'peasant', { c, top: '#efe6d2', hat: '#2a2a30', dir });
  d += P.fill(P.ellipse(x, by - 31.5 * s, 7 * s, 1.8 * s), '#b08850', { w: .45 }) + P.fill(`M${f(x - 6 * s)} ${f(by - 32 * s)}q${f(6 * s)} ${f(-3 * s)} ${f(12 * s)} 0Z`, '#c4ccd2', { w: .35 });
  d += P.line(`M${f(x - 2 * s * dir)} ${f(by - 22 * s)}l${f(-2 * s * dir)} ${f(-8 * s)}`, '#e8c4a0', 1 * s);
  return d;
}

/** Portugal's walls, should they ever call up the reserves, in Portuguese rather than the kit's French. */
function portuguese(s) { return s.replace(/>MOBILISATION</g, '>MOBILIZAÇÃO<'); }

/** Cross between x0 and x1 on y, fading in and out where there is nothing to hide behind. */
function fade(P, sp, { y, dir = 1, dur = 40, rest = 0, offset = 0, x0, x1 }) {
  const a = dir > 0 ? x0 : x1, b = dir > 0 ? x1 : x0, e = 10 * dir, run = 1 - rest;
  return P.mover(sp, { path: [[a, y, 1, 0, 0], [a + e, y, 1, .04 * run, 1], [b - e, y, 1, .96 * run, 1], [b, y, 1, run, 0], [b, y, 1, 1, 0]], dur, offset });
}
