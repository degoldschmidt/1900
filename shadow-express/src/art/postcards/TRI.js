// Trieste from the Molo Bersaglieri: the Piazza Grande opens on the sea, the Municipio at its head under the clock
// tower where the two Moors strike the bell, the Palazzo del Governo glittering with gold mosaic on the left, the
// Lloyd's palace on the right, San Giusto on its hill behind. The Molo San Carlo runs out into the harbour with a
// Lloyd steamer at its side; the Rive stretch north past the Canal Grande, the Karst rises over the town with the
// Opicina tram on its slope, and far along the coast Miramare stands white on its point. Steamers, a trabaccolo
// under painted sails, gulls; a naval officer in white on the quay.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'TRI',
  greet: 'SALUTI da TRIESTE',
  nation: 'AH',
  flag: 'AH',
  flower: 'wisteria',
  flower2: 'iris',
  frame: { band: ['#9793be', '#51536b'], gold: '#dfbe6c', ink: '#1f3a2a', leaf: ['#7aa05e', '#3a5e40'], year: '#3a3a6a', halo: '#f7efd8' },
  horizon: 250,
  clouds: 4,
  wind: -1, // the bora, off the Karst
  birds: { c: '#f5f4ee', n: 5, y: 116, s: 1, x: .5 },
  pal: {
    key: '#2a2524', stone: '#ebe1c9', stone2: '#c0b190', wall: '#ecdbbd', wall2: '#e3cfae', wall3: '#f0e8d6', roof: '#a85a42',
    karst: '#b4b28a', karst2: '#8f9070', sea: '#3c7fa4', quay: '#d6cbb0', ground: '#ddd0b0', mosaic: '#d7b04a',
    glass: '#374757', sash: '#efe7d4', iron: '#28332f', gold: '#d5ab40',
  },

  // wisteria: two drooping racemes of lilac flowers under pinnate leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.stem('M-18 -8Q-4 -14 16 -10', I.leaf[1], 1.2);
    for (let i = 0; i < 5; i++) { const x = -14 + i * 6.5; s += F.at(x, -11 - (i % 2), F.leaf(9, 3.4, -30, '#5f8a4e', { shape: 'oval', vein: '#9ab87a' }) + F.leaf(9, 3.4, 30, '#4f7a46', { shape: 'oval', vein: '#9ab87a' })); }
    s += F.at(-6, -9, F.spike(26, 4.6, ['#9b86c8', '#b3a0dc', '#8a74b8', '#c8b8e8'], { n: 11, stem: false }), 180);
    s += F.at(7, -9, F.spike(21, 4, ['#a893d0', '#c2b2e2', '#9580c0'], { n: 9, stem: false }), 172);
    return s;
  },
  // an iris: three violet falls with gold beards, three standards above
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(20, 4, 200, '#5f8a5e', { shape: 'lance' }) + F.leaf(18, 3.6, 165, '#4f7a50', { shape: 'lance' });
    s += F.radial(3, 13, 9, '#5a3fa0', { rot: 60, shape: 'round', vein: '#e8c23a', lite: '#8a6ac8' });
    s += F.radial(3, 11, 6.4, '#7a5ac0', { rot: 0, shape: 'point', lite: '#a88ae0' }) + F.disc(1.6, '#e8c23a');
    return s;
  },

  back(P, T) {
    let s = '';
    // the Karst over the town, the road and tramway to Opicina climbing it, the coast running to Miramare
    s += P.far(.78, () => karst(P));
    s += P.far(.7, () => P.mover(opicina(P), { path: [[300, 204, 1, 0, 0], [306, 201, 1, .04, 1], [384, 166, 1, .48, 1], [390, 163, 1, .52, 0], [390, 163, 1, 1, 0]], dur: 70, offset: 20 }));
    s += P.water(250, 384, { seed: 12, shimmer: 8, x0: 60, x1: 560, c: 'sea' });
    s += P.far(.7, () => `<g transform="translate(-29 -125) scale(1.5)">${miramare(P, 58, 250)}</g>`);
    // San Giusto on its hill: the cathedral's square campanile, the castle's bastion
    s += P.far(.6, () => sanGiusto(P));
    // the town climbing behind the Rive
    s += P.far(.55, () => P.row(110, 600, 232, { hMin: 16, hMax: 28, wMin: 14, wMax: 22, style: 'south', seed: 23, walls: ['#eedfc0', '#e3cfae', '#f0e8d6', '#e8d6c0'], roofC: '#a85a42', placard: false, flagSpot: false }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the Rive north of the square: the Canal Grande with Sant'Antonio at its head, the Greek church, Carciotti's dome
    s += P.far(.42, () => rive(P));
    // the Piazza Grande: the Municipio and its tower, the Governo's mosaics, the Lloyd, the fountain and the column
    s += P.far(.36, () => municipio(P, 404, 252));
    s += P.far(.32, () => governo(P) + lloyd(P));
    s += P.far(.32, () => fountain(P, 400, 254) + P.crowd(352, 452, 256, 9, { s: .4, seed: 5 }));
    // the waterfront: the quay's edge, its lamps, a tram along the Rive
    s += P.far(.3, () => P.fill('M100 255H600V260H100Z', 'quay', { w: .5 }) + (() => { let d = ''; for (const x of [140, 220, 300, 470, 560]) d += P.lamp(x, 256, .4, 'single', { h: 66 }); return d; })());
    s += P.far(.3, () => fade(P, T.tramSide({ c: '#c9b04a', band: '#efe6c8', number: '2', s: .34, dir: -1 }), { y: 254, dir: -1, dur: 46, rest: .35, x0: 118, x1: 600, offset: 8 }));
    s += reflect(P, 110, 560, 262, 24, '#e3d6b8', 7);
    // the Molo San Carlo running out into the harbour, a Lloyd steamer lying at it
    s += P.far(.22, () => moloSanCarlo(P));
    // ships in the harbour: a Lloyd steamer standing out, a trabaccolo under painted sails, a rowing boat
    s += P.cross(T.steamer({ s: .72, dir: -1, hull: '#1f2124', house: '#f4efe4', funnel: ['#d9b04a', '#1d1a17'], flag: 'AH' }), { y: 298, dir: -1, dur: 92, rest: .3, offset: 18 });
    s += P.cross(trabaccolo(P, 1, .85), { y: 286, dir: 1, dur: 120, offset: 60 });
    s += P.cross(T.rowboat({ s: .7, hull: '#4a6a7a', dir: -1 }), { y: 312, dir: -1, dur: 120, offset: 90 });
    // the near quay: its stones, bollards, the advertising column, people taking the air
    s += P.fill('M-4 328H604V404H-4Z', 'quay') + P.lite('M-4 328H604V331H-4Z', 'quay', .35) + P.shade('M-4 331H604V335H-4Z', 'quay', .18);
    s += P.paving(335, 384, { c: 'ground', vx: 300, seed: 14 });
    for (const x of [64, 230, 420, 548]) s += bollard(P, x, 336);
    s += litfass(P, 470, 360);
    s += P.lamp(240, 360, 1.02, 'iron', { h: 74 });
    s += P.person(196, 352, 1, 'gent', { c: '#2c2f38', dir: -1 }) + P.person(208, 353, .98, 'lady', { c: '#c9d6e6', parasol: '#efe0e8' });
    s += P.person(300, 350, .96, 'worker', { c: '#5a5048', legs: '#3a3632', dir: 1 }) + P.person(384, 352, .96, 'sailor', { c: '#1f2a44', legs: '#1f2a44' });
    s += navalOfficer(P, 520, 364, 1.08) + P.person(536, 366, 1.04, 'lady', { c: '#f3eee2', parasol: '#d8c8e8', dir: -1 });
    // a bench facing the harbour, a reader with his paper; ratings of the Navy on a run ashore
    s += P.fill('M332 350h40v-2.4h-40Z', '#5b4532', { w: .5 }) + P.line('M335 350v6M369 350v6M334 342h38', '#3a2a1e', 1.1);
    s += P.person(344, 350, .96, 'gent', { c: '#4a4a52' }) + P.fill('M348 334h7v6h-7Z', '#f2efe6', { w: .3 }) + P.person(360, 350, .94, 'lady', { c: '#e8c9b0' });
    s += P.person(410, 358, 1.02, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(422, 359, 1, 'sailor', { c: '#1f2a44', legs: '#1f2a44', dir: -1 });
    s += P.setStreet(368, 80, 470, 1.04);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.06, dir: 1, seed: 8, dresses: ['#f3eee2', '#d8c8e8'] }), { y: 374, dir: 1, dur: 72, offset: 12 });
    s += P.cross(T.walkers({ kinds: ['lady', 'girl', 'gent'], s: 1.02, dir: -1, seed: 13 }), { y: 360, dir: -1, dur: 86, offset: 50 });
    return triestine(s);
  },

  front(P, T, st) {
    let s = '';
    // the gentleman with Il Piccolo, the bora tugging at his hat; a lady at his arm; a mooring ring and coiled rope
    s += P.figure(70, 404, 1.02, 'gent', { c: '#3a3d46', hat: '#22242a', arm: 16 }) + P.figure(106, 406, 1, 'lady', { c: '#ece6f2', sash: '#6a5aa0', parasol: '#f2eaf4', flowers: ['#8a74b8', '#c2b2e2', '#e8c25a'] });
    s += P.fill(P.ellipse(300, 372, 12, 4), '#8a7454', { w: .5 }) + P.line('M290 372q10 -4 20 0M292 374q8 -3 16 0', '#5a4632', .6);
    return triestine(s);
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
function bollard(P, x, y) {
  return P.fill(`M${x - 3} ${y + 1}V${y - 5}Q${x - 3} ${y - 8} ${x} ${y - 8}Q${x + 3} ${y - 8} ${x + 3} ${y - 5}V${y + 1}Z`, '#3a3a38', { w: .5 }) + P.fill(P.rect(x - 4, y - 6, 8, 1.6), '#3a3a38', { w: .35 });
}

// ---------- the hills and the coast ----------
function karst(P) {
  const lf = P.L.leaf, r = P.rng(9), autumn = P.L.season === 'autumn';
  const hill = 'M0 214Q60 176 120 168Q200 156 280 150Q360 140 440 146Q520 150 600 160V252H0Z';
  let s = P.fill(hill, 'karst');
  s += P.shade('M440 146Q520 150 600 160V252H520Q500 190 440 146Z', 'karst', .12) + P.stipple(hill, 'karst', 90, { box: [0, 140, 600, 112], op: .35 });
  // grey limestone breaking through the scrub
  let rock = '';
  for (let i = 0; i < 16; i++) { const x = 20 + r() * 560, y = 160 + r() * 30; rock += `M${P.f(x)} ${P.f(y)}h${P.f(4 + r() * 8)}`; }
  s += P.line(rock, '#d9d6c4', 1.4, { op: .8 });
  // woods of oak and sumac in bands along the slopes: green in summer, red in autumn, grey in winter
  const woods = lf.leaf ?? '#9a9284', bare = !lf.leaf;
  for (let band = 0; band < 3; band++) for (let i = 0; i < 17; i++) {
    const x = 6 + i * 36 + r() * 22, y = 166 + band * 15 + r() * 8 + Math.max(0, (120 - x) * .3);
    const c = autumn && r() < .45 ? '#b8402a' : r() < .3 ? (lf.dark ?? '#7a7266') : woods;
    s += `<path d="${P.blob(x, y, 11 + r() * 9, 2.8 + r() * 1.6, 9, band * 20 + i + 5)}" fill="${P.ink(c)}"${bare ? ' opacity=".55"' : ` stroke="${P.keyC()}" stroke-width=".3" opacity=".95"`}/>`;
  }
  for (let i = 0; i < 8; i++) { const x = 40 + r() * 520, y = 172 + r() * 34; s += P.tree(x, y, .32, 'cypress'); }
  // villas and a church on the slopes above the town
  for (const [x, y, w, h] of [[150, 190, 16, 9], [214, 178, 14, 8], [330, 182, 18, 10], [452, 176, 15, 9], [520, 186, 16, 9], [270, 196, 14, 8]]) {
    s += P.fill(P.rect(x, y - h, w, h), 'wall3', { w: .4 }) + P.fill(P.poly([[x - 1, y - h], [x + w / 2, y - h - 4], [x + w + 1, y - h]]), 'roof', { w: .35 }) + P.windows(x + 1, y - h + 2, w - 2, h - 4, Math.round(w / 5), 1, { ww: .4, plain: true });
  }
  s += P.fill(P.rect(392, 172, 16, 10), 'wall3', { w: .4 }) + P.fill(P.rect(406, 160, 5, 22), 'wall3', { w: .4 }) + P.fill(P.poly([[405, 160], [408.5, 154], [412, 160]]), 'roof', { w: .3 });
  // the road to Opicina in its hairpins, the tramway's straight climb
  s += P.line('M300 206L392 162', '#e9e0c6', 1.8, { op: .9 }) + P.line('M300 206L392 162', '#7a7262', .4);
  s += P.line('M240 214Q300 196 268 186Q240 176 300 170Q340 166 330 158', '#e2d8bc', 1, { op: .7 });
  return s;
}
function miramare(P, x, by) {
  const lf = P.L.leaf;
  // the point, its park dark with ilex and pine, the white castle with its crenellated tower
  let s = P.fill(`M${x - 40} ${by}Q${x - 30} ${by - 10} ${x - 6} ${by - 12}L${x + 30} ${by - 10}Q${x + 50} ${by - 6} ${x + 60} ${by}Z`, 'karst2', { w: .45 });
  s += `<path d="${P.blob(x - 16, by - 14, 16, 5, 8, 4)}" fill="${P.ink(lf.ever)}"/>`;
  s += P.fill(P.rect(x - 2, by - 22, 22, 11), 'wall3', { w: .4 }) + P.fill(P.rect(x + 14, by - 30, 7, 19), 'wall3', { w: .4 });
  for (let k = 0; k < 7; k += 2.4) s += P.flat(P.rect(x + 14 + k, by - 32, 1.4, 2), 'wall3');
  s += P.windows(x, by - 20, 14, 6, 4, 1, { ww: .4 });
  return s;
}
function sanGiusto(P) {
  let s = P.fill('M440 214Q480 192 520 190Q560 192 600 206V240H440Z', 'karst2', { w: .4 });
  s += P.fill(P.rect(470, 178, 14, 30), 'stone2', { w: .5 }) + P.fill(P.poly([[468, 179], [477, 172], [486, 179]]), 'roof', { w: .4 }) + P.fill(P.arch(474.5, 182, 5, 8), '#3a3430', { w: .3 });
  s += P.fill(P.rect(484, 192, 30, 16), 'stone', { w: .5 }) + `<circle cx="499" cy="198" r="3" fill="${P.ink('glass')}" stroke="${P.ink('stone2')}" stroke-width=".7"/>`;
  s += P.fill('M524 194L528 184H572L578 194Z', 'stone2', { w: .5 });
  for (let x = 528; x < 572; x += 5) s += P.flat(P.rect(x, 181.4, 2.6, 2.6), 'stone2');
  s += P.flag(552, 184, .55, 'AH', { h: 14 });
  return s;
}
/** The Opicina tramway's car, small on the hill. */
function opicina(P) {
  const W = 20, H = 14;
  let b = P.fill('M2 10V4H18V10Z', '#c9b04a', { w: .4 }) + P.fill('M1 4.4H19L18 2.4H2Z', '#efe6c8', { w: .35 });
  for (let i = 0; i < 4; i++) b += `<rect x="${3.4 + i * 3.6}" y="5" width="2.2" height="2.4" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3e4c5c')}"/>`;
  b += `<path d="M10 2.4L6 0" stroke="${P.ink('#2a2a2a')}" stroke-width=".4"/><circle cx="5" cy="11" r="1.4" fill="${P.ink('#2b2622')}"/><circle cx="15" cy="11" r="1.4" fill="${P.ink('#2b2622')}"/>`;
  return { svg: doc(W, H, b), w: W, h: H, ax: W / 2, ay: 12 };
}

// ---------- the Rive ----------
function rive(P) {
  const { f } = P;
  let s = '';
  // the old port's warehouses at the far left, then palaces along the water
  s += P.row(100, 160, 256, { hMin: 18, hMax: 24, wMin: 18, wMax: 26, style: 'south', seed: 31, walls: ['#e3cfae', '#d8c4a4'], roofC: '#a85a42', placard: false });
  // Sant'Antonio Taumaturgo at the head of the Canal Grande: its Ionic portico and dome
  s += P.fill(P.rect(158, 222, 30, 26), 'stone') + P.columns(160, 248, 26, 22, 6, 'stone') + P.fill(P.gable(156, 223, 34, 8), 'stone', { w: .5 }) + P.fill(P.dome(173, 214, 10, 9), '#8a9a9a', { w: .5 }) + P.fill(P.rect(170, 214, 6, 9), 'stone', { w: .4 });
  s += P.flat('M156 248H192V256H156Z', 'sea', { op: .9 });
  // San Nicolò dei Greci with its two little towers; the Palazzo Carciotti with its green dome
  s += P.facade(194, 256, 34, 36, { c: 'wall3', roof: 'flat', side: 6, floors: 3, cols: 3 });
  for (const x of [196, 222]) s += P.fill(P.rect(x, 210, 8, 12), 'wall3', { w: .45 }) + P.fill(P.onion(x + 4, 210.5, 9, 9), '#6a9a8a', { w: .4 });
  s += P.facade(230, 256, 62, 40, { c: 'wall', roof: 'flat', side: 8, floors: 3, cols: 7 }) + P.columns(250, 236, 22, 18, 6, 'stone') + P.fill(P.dome(261, 214, 12, 10), '#7aa08e', { w: .5 }) + P.fill(P.rect(258, 205, 6, 6), 'wall', { w: .35 });
  s += P.facade(292, 256, 40, 44, { c: 'wall2', roof: 'flat', side: 6, floors: 4, cols: 4 });
  return s;
}
function governo(P) {
  const { f } = P;
  // the Palazzo del Governo (1905): a tall block faced in cream, its upper storey and attic set with gold mosaic
  let s = P.fill(P.rect(318, 190, 58, 66), 'wall3') + P.shade(P.rect(366, 190, 10, 66), 'wall3', .15);
  s += P.windows(320, 202, 46, 32, 5, 2, { ww: .42 });
  s += P.fill(P.rect(320, 236, 46, 20), 'stone', { w: .5 });
  for (let x = 323; x < 366; x += 9) s += P.fill(P.arch(x, 240, 6, 16), '#4a4038', { w: .3 });
  s += P.fill(P.rect(316, 180, 62, 12), 'mosaic', { w: .55 });
  const r = P.rng(3);
  for (let i = 0; i < 40; i++) s += `<rect x="${f(317 + r() * 58)}" y="${f(181 + r() * 9)}" width="1.6" height="1.6" fill="${P.ink(i % 3 ? '#f2d878' : '#3a6aa8')}"/>`;
  s += P.fill(P.rect(314, 177, 66, 3.4), 'stone2', { w: .45 }) + P.fill(P.rect(338, 168, 18, 10), 'mosaic', { w: .45 }) + P.fill(P.dome(347, 168.5, 9, 7), '#5a7a8a', { w: .45 });
  s += P.flag(347, 160, .6, 'AH', { h: 14 }) + P.flagAt(322, 214);
  return s;
}
function lloyd(P) {
  // the Lloyd's palace (1883): rusticated below, a piano nobile of pedimented windows, statues along its cornice
  let s = P.fill(P.rect(440, 192, 74, 64), 'wall') + P.shade(P.rect(504, 192, 10, 64), 'wall', .15);
  s += P.fill(P.rect(440, 232, 74, 24), 'stone2', { w: .5 });
  for (let x = 444; x < 510; x += 10) s += P.fill(P.arch(x, 236, 6, 18), '#4a4038', { w: .3 });
  s += P.windows(442, 198, 62, 30, 6, 2, { ww: .45 });
  s += P.fill(P.rect(438, 188, 78, 5), 'stone2', { w: .5 });
  for (let x = 444; x < 514; x += 10) s += P.fill(`M${x - 1.4} 188l.4 -6q1 -1.6 2 0l.4 6Z`, 'stone', { w: .3 });
  s += P.flagAt(480, 210) + P.wall(446, 238, 9, 12);
  return s;
}
/** The Municipio (1875): its long front with the loggia, the clock tower in the middle where the Moors strike the bell. */
function municipio(P, cx, by) {
  const { f } = P;
  let s = P.fill(P.rect(cx - 52, by - 50, 104, 50), 'wall3') + P.shade(P.rect(cx + 40, by - 50, 12, 50), 'wall3', .14);
  s += P.windows(cx - 50, by - 46, 100, 24, 10, 2, { ww: .42, arched: true });
  s += P.fill(P.rect(cx - 52, by - 18, 104, 18), 'stone', { w: .5 });
  for (let x = cx - 48; x < cx + 46; x += 8) s += P.fill(P.arch(x, by - 15, 5, 15), '#4a4038', { w: .3 });
  s += P.fill(P.rect(cx - 54, by - 53, 108, 4), 'stone2', { w: .45 });
  // the tower: the clock, the bell under its cupola, the two Moors either side
  s += P.fill(P.rect(cx - 9, by - 96, 18, 44), 'wall3', { w: .55 }) + P.shade(P.rect(cx + 4, by - 96, 5, 44), 'wall3', .18);
  s += P.clock(cx, by - 80, 6.4, { tz: 0, face: '#f3eedc', rim: '#c9a23a' });
  s += P.fill(P.rect(cx - 10, by - 99, 20, 3.4), 'stone2', { w: .4 });
  s += P.fill(`M${cx - 7} ${by - 99}V${by - 106}Q${cx} ${by - 114} ${cx + 7} ${by - 106}V${by - 99}Z`, 'stone', { w: .45 }) + P.fill(P.dome(cx, by - 99.5, 4, 5), 'gold', { w: .35 });
  for (const k of [-1, 1]) s += P.fill(`M${cx + k * 6 - 1.6} ${by - 99}l.4 -7q1.2 -1.6 2.4 0l.4 7Z`, '#3a3634', { w: .3 }) + `<circle cx="${cx + k * 6}" cy="${by - 107.6}" r="1.3" fill="${P.ink('#3a3634')}"/>`;
  s += P.line(`M${cx} ${by - 113}v-4`, 'gold', .8);
  return s;
}
function fountain(P, x, by) {
  // the fountain of the four continents, and Charles VI on his column
  let s = P.fill(P.ellipse(x, by, 14, 2.6), 'stone2', { w: .4 }) + P.fill(`M${x - 8} ${by - 1}Q${x - 6} ${by - 9} ${x} ${by - 12}Q${x + 6} ${by - 9} ${x + 8} ${by - 1}Z`, 'stone', { w: .4 }) + P.fill(P.rect(x - 1, by - 17, 2, 5), 'stone', { w: .3 });
  s += P.fill(P.rect(x - 52, by - 4, 6, 4), 'stone2', { w: .35 }) + P.fill(P.rect(x - 50.5, by - 26, 3, 22), 'stone', { w: .35 }) + `<circle cx="${x - 49}" cy="${by - 28}" r="1.4" fill="${P.ink('stone')}"/>`;
  return s;
}
function moloSanCarlo(P) {
  const { f } = P;
  // the pier comes from the Rive toward us and to the left
  const top = [[286, 256], [306, 256], [214, 304], [176, 304]];
  let s = P.fill(P.poly(top), 'quay', { w: .6 }) + P.fill(P.poly([[176, 304], [214, 304], [214, 309], [176, 309]]), 'stone2', { w: .5 }) + P.shade('M306 256L214 304V309L306 260Z', 'quay', .3);
  for (let i = 1; i < 8; i++) { const t = i / 8, x = 296 - 101 * t, y = 256 + 48 * t; s += P.lamp(x + 8 * t, y, .32 + t * .4, 'single', { h: 66 }); }
  s += P.crowd(200, 280, 290, 6, { s: .5, seed: 22 });
  s += P.line('M210 304L192 310', '#efe8d8', 1, { op: .6 });
  return s;
}
/** A trabaccolo of the Adriatic: two masts, lug sails painted ochre and red with a sun. */
function trabaccolo(P, dir = 1, s = 1) {
  const W = 64 * s, H = 62 * s, S = (n) => P.f(n * s);
  let b = `<path d="M${S(24)} ${S(52)}V${S(6)}M${S(42)} ${S(52)}V${S(14)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(1.1)}"/>`;
  b += P.fill(`M${S(14)} ${S(10)}L${S(34)} ${S(6)}L${S(36)} ${S(46)}H${S(12)}Z`, '#e0a03a', { w: .55 }) + `<circle cx="${S(24)}" cy="${S(24)}" r="${S(5)}" fill="${P.ink('#c8402e')}"/><path d="M${S(14)} ${S(36)}L${S(36)} ${S(34)}" stroke="${P.ink('#c8402e')}" stroke-width="${S(2)}"/>`;
  b += P.fill(`M${S(36)} ${S(16)}L${S(52)} ${S(13)}L${S(54)} ${S(46)}H${S(38)}Z`, '#c8402e', { w: .55 }) + `<path d="M${S(40)} ${S(28)}h${S(12)}" stroke="${P.ink('#e0a03a')}" stroke-width="${S(1.6)}"/>`;
  b += P.fill(`M${S(4)} ${S(48)}H${S(60)}L${S(56)} ${S(56)}H${S(10)}Q${S(5)} ${S(54)} ${S(4)} ${S(48)}Z`, '#3a4a5a', { w: .55 }) + `<path d="M${S(6)} ${S(51)}H${S(58)}" stroke="${P.ink('#e8c54a')}" stroke-width="${S(1)}"/><circle cx="${S(54)}" cy="${S(51)}" r="${S(1.4)}" fill="${P.ink('#f2ede2')}"/>`;
  const body = dir < 0 ? `<g transform="translate(${P.f(W)} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: doc(P.f(W), P.f(H), body), w: W, h: H, ax: W / 2, ay: 55 * s };
}

// ---------- the quay ----------
/** An advertising column, where the bills go up. */
function litfass(P, x, by) {
  let s = P.fill(P.rect(x - 9, by - 46, 18, 46), '#4f6a5a') + P.shade(P.rect(x + 3, by - 46, 6, 46), '#4f6a5a', .25);
  s += P.fill(P.rect(x - 7, by - 40, 14, 30), '#e9dfc8', { w: .4 });
  for (let i = 0; i < 5; i++) s += P.line(`M${x - 5} ${by - 36 + i * 5}h10`, '#5a5048', .6, { op: .6 });
  s += P.fill(P.rect(x - 11, by - 49, 22, 4), '#4f6a5a', { w: .45 }) + P.fill(P.dome(x, by - 49, 9, 6), '#4f6a5a', { w: .45 }) + P.line(`M${x} ${by - 57}v-4`, '#d5ab40', 1);
  s += P.wall(x - 7, by - 40, 7, 10) + P.wall(x, by - 26, 7, 10);
  return s;
}
/** An officer of the k.u.k. Kriegsmarine in summer whites, his peaked cap and sword. */
function navalOfficer(P, x, by, s) {
  const { f } = P;
  let d = P.person(x, by, s, 'gent', { c: '#f4f2ea', legs: '#f4f2ea', hat: '#1d1d22' });
  d += P.fill(`M${f(x - 3 * s)} ${f(by - 28.2 * s)}h${f(6 * s)}v${f(-1.6 * s)}q${f(-3 * s)} ${f(-1.4 * s)} ${f(-6 * s)} 0Z`, '#1d1d22', { w: .3 }) + P.line(`M${f(x - 3 * s)} ${f(by - 27.8 * s)}h${f(7.4 * s)}`, '#1d1d22', .8 * s);
  d += P.line(`M${f(x - 2 * s)} ${f(by - 13 * s)}l${f(-3 * s)} ${f(9 * s)}`, '#c9a23a', .9 * s) + P.line(`M${f(x - 2.4 * s)} ${f(by - 22 * s)}h${f(4.8 * s)}`, '#c9a23a', .5 * s);
  return d;
}

/** Trieste read its news in Italian: every other bill is Il Piccolo's extra, and the Emperor's manifesto went up in
 * both tongues. */
function triestine(s) {
  let n = 0, m = 0;
  return s.replace(/>EXTRAAUSGABE</g, (x) => (n++ % 2 ? x : '>EDIZIONE STRAORDINARIA<')).replace(/>AN MEINE VÖLKER</g, (x) => (m++ % 2 ? x : '>AI MIEI POPOLI<'));
}

/** Cross between x0 and x1 on y, fading in and out where there is nothing to hide behind. */
function fade(P, sp, { y, dir = 1, dur = 40, rest = 0, offset = 0, x0, x1 }) {
  const a = dir > 0 ? x0 : x1, b = dir > 0 ? x1 : x0, e = 10 * dir, run = 1 - rest;
  return P.mover(sp, { path: [[a, y, 1, 0, 0], [a + e, y, 1, .04 * run, 1], [b - e, y, 1, .96 * run, 1], [b, y, 1, run, 0], [b, y, 1, 1, 0]], dur, offset });
}
