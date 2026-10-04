// Constantinople from the Salacak shore at Scutari, across the Bosphorus at sunset's side: the Sultan Ahmed mosque's
// six minarets and cascade of domes, Hagia Sophia's great flat dome on its buttresses, the cypresses and kiosks of the
// Seraglio Point, the mouth of the Golden Horn, Galata climbing to its tower; Leander's Tower on its rock in the
// stream. A Şirket-i Hayriye paddle ferry, caïques, a lateen boat, gulls; on the near quay a coffee-house under a
// vine, men in fezzes at their narghiles, a simit seller, a porter, ladies in çarşaf.

export default {
  id: 'IST',
  greet: 'SOUVENIR de CONSTANTINOPLE',
  nation: 'OT',
  flag: 'OT',
  flower: 'judas-tree',
  flower2: 'ottoman-tulip',
  frame: { band: ['#287171', '#1a4245'], gold: '#dbb862', ink: '#8a1a1a', leaf: ['#8aae62', '#3c6a3e'], year: '#7a1e1e', halo: '#f8eccc' },
  horizon: 236,
  clouds: 3,
  wind: 1,
  birds: { c: '#f6f5f0', n: 5, y: 132, s: 1.05 },
  pal: {
    key: '#2a2421', stone: '#ebdfc4', stone2: '#c4b292', lead: '#8e9895', lead2: '#6d7876', hagia: '#dca684', hagia2: '#bf7c5c',
    brick: '#a9573c', wood: '#8f6446', wall: '#efe1c6', wall2: '#e2b28a', wall3: '#d8c6b6', water: '#3d7d93', ground: '#cebd9a',
    cypress: '#2f5238', glass: '#35435a', sash: '#efe6d1', iron: '#2c3632', gold: '#d8aa36',
  },

  // the Judas tree: magenta pea-flowers crowded on a bare dark branch, a round leaf or two
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(16, 15, 215, I.leaf[1], { shape: 'heart' }) + F.leaf(14, 13, 140, I.leaf[0], { shape: 'heart' });
    s += F.stem('M-18 12Q-6 4 2 0Q10 -4 18 -12', '#4a3328', 2.4) + F.stem('M0 1Q-2 -8 -8 -14', '#4a3328', 1.4) + F.stem('M6 -3Q10 4 16 6', '#4a3328', 1.2);
    const pea = (x, y, a, c) => F.at(x, y, `<path d="M0 0C-3 -1 -4 -5 -1 -7C2 -6 3 -3 0 0Z" fill="${c}" stroke="${I.key}" stroke-width=".4"/><path d="M0 0C2 -1 4 -3 3 -5" stroke="${c}" stroke-width="1.4" fill="none"/>`, a);
    const cols = ['#c8337a', '#d8509a', '#b0286a', '#e070a8'];
    const pts = [[-14, 9], [-10, 6], [-6, 4], [-3, 2], [1, 0], [5, -2], [9, -5], [13, -8], [17, -11], [-2, -4], [-5, -9], [-7, -13], [8, 1], [12, 4], [15, 6], [-12, 12], [3, 3], [-9, 2]];
    pts.forEach(([x, y], i) => { s += pea(x, y, i * 47 % 360, cols[i % 4]); });
    return s;
  },
  // the Ottoman tulip: long, narrow, needle-pointed petals, as on the Iznik tiles
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M0 12Q1 2 0 -4', I.leaf[1], 1.2) + F.at(0, 8, F.leaf(18, 4, -38, I.leaf[0], { shape: 'lance' }) + F.leaf(16, 4, 30, I.leaf[1], { shape: 'lance' }));
    for (const [a, c] of [[-16, '#b8202a'], [16, '#b8202a'], [0, '#d8303a']]) s += F.at(0, -2, `<path d="M0 0C-4 -6 -3 -14 0 -20C3 -14 4 -6 0 0Z" fill="${c}" stroke="${I.key}" stroke-width=".5"/><path d="M0 -2V-17" stroke="#f4b0a0" stroke-width=".6" opacity=".7"/>`, a);
    return s;
  },

  back(P, T) {
    let s = '';
    // the European shore: Stamboul's hills, the Seraglio Point, the Golden Horn's mouth, Galata and Pera, drawn large
    s += P.far(.78, () => P.fill('M24 236C50 206 110 190 170 190C240 190 290 194 330 210L360 236Z', '#b6b29a') + P.fill('M386 236C410 206 450 176 500 168C540 162 566 170 580 178V236Z', '#b8b09a'));
    s += P.far(.7, () => big(P, 486, 236, 1.28, () => galata(P)));
    s += P.flag(497, 166, .6, 'OT', { h: 13 });
    s += P.far(.62, () => big(P, 356, 236, 1.25, () => P.fill(P.rect(330, 200, 18, 12), 'stone') + leadDome(P, 339, 200, 10, 10) + minaret(P, 324, 212, 26, 2.2, 1) + minaret(P, 354, 212, 26, 2.2, 1)));
    s += P.far(.55, () => big(P, 330, 236, 1.22, () => `<g transform="translate(14 0)">${seraglio(P)}</g>`));
    s += P.far(.5, () => big(P, 122, 232, 1.36, () => blueMosque(P, 122, 228)));
    s += P.far(.46, () => big(P, 252, 234, 1.36, () => hagiaSophia(P, 250, 230)));
    // the strait
    s += P.water(236, 330, { seed: 21, shimmer: 9, x0: 40, x1: 540 });
    s += P.far(.5, () => P.line('M24 236.6H580', '#e8e2d0', .6, { op: .5 }));
    s += reflect(P, 60, 300, 238, 22, 'stone', 3) + reflect(P, 430, 560, 238, 18, 'wall', 7);
    // boats behind Leander's Tower: a steamer down the strait, a caïque
    s += P.cross(T.steamer({ s: .5, dir: -1, hull: '#26292e', house: '#f2ece0', funnel: ['#c8102e', '#1d1a17'], paddle: false, flag: 'OT' }), { y: 256, dir: -1, dur: 120, rest: .15, offset: 30 });
    s += P.cross(T.caique({ s: .7, dir: 1, rowers: 3, hull: '#f2e8d2' }), { y: 272, dir: 1, dur: 64, rest: .3, offset: 12 });
    s += P.cross(T.sail({ s: .5, rig: 'lateen', sailC: '#e8d8b8', hull: '#4a3a2a', dir: -1 }), { y: 262, dir: -1, dur: 140, rest: .1, offset: 90 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // Leander's Tower on its rock
    s += P.far(.32, () => big(P, 400, 294, 1.3, () => maidensTower(P, 400, 294)));
    s += P.flag(374, 254, .6, 'OT', { h: 14 });
    if (P.L.lamps > .05) P.glows.push({ x: 417, y: 206, r: 20, depth: .3 });
    // in front of it: the paddle ferry from Scutari, a lateen boat, another caïque
    s += P.cross(ferry(P, { s: .8, dir: -1 }), { y: 304, dir: -1, dur: 70, rest: .25, offset: 4 });
    s += P.cross(T.sail({ s: .66, rig: 'lateen', sailC: '#f1e4c6', hull: '#5a3a2a', dir: 1 }), { y: 296, dir: 1, dur: 110, rest: .2, offset: 50 });
    s += P.cross(T.caique({ s: .9, dir: -1, rowers: 2, hull: '#efe4cc', trim: '#c8302a' }), { y: 318, dir: -1, dur: 48, rest: .4, offset: 26 });
    // the near quay at Salacak: its parapet, the coffee-house under its vine, cypresses, the people
    s += quay(P);
    s += P.setStreet(352, 30, 470, .95);
    s += P.cross(fezWalkers(P, { s: .9, dir: 1, kinds: ['fez', 'carsaf', 'fez'] }), { y: 350, dir: 1, dur: 84, offset: 18, x0: 30, x1: 470 });
    s += P.cross(hamal(P, { s: .95, dir: -1 }), { y: 356, dir: -1, dur: 96, rest: .2, offset: 60, x0: 30, x1: 470 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the coffee-house at the right, its smokers at their narghiles
    s += coffeeHouse(P);
    // the plane tree and cypresses at the left, a fountain, gulls on the parapet
    s += P.tree(50, 372, 2.5, 'plane');
    s += P.tree(118, 340, 1.6, 'cypress') + P.tree(134, 342, 1.3, 'cypress');
    s += fountain(P, 186, 372);
    s += gull(P, 236, 334, 1) + gull(P, 252, 333, -1) + gull(P, 316, 334, 1);
    // a simit seller, ladies in çarşaf, a gentleman of Pera
    s += simitci(P, 360, 374, 1.12) + carsaf(P, 290, 376, 1.1, { c: '#2a2630' }) + carsaf(P, 306, 376, 1.04, { c: '#6a4a6a' }) + P.person(232, 376, 1.12, 'gent', { c: '#2c3038', dir: 1 });
    s += P.wall(214, 340, 12, 16);
    return s;
  },
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
/** Draw something larger about its foot (x, y): the far shore brought nearer, as a lithographer would. */
const big = (P, x, y, k, fn) => `<g transform="translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})">${fn()}</g>`;
const flip = (P, dir, w, b) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${b}</g>` : b);
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) { const k = (y - y0) / h; for (let x = x0; x < x1;) { const w = 4 + r() * 14 * (1 - k * .6); if (r() < .7 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 6 * (1 + k * 2); } }
  return `<path d="${d}" stroke="${P.ink(c, .4)}" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>`;
}

// ---------- mosques ----------
/** A minaret: a slender fluted shaft, n balconies, the tall lead cone and its crescent finial; base at (x, by). */
function minaret(P, x, by, h, w, n = 1) {
  const { f } = P;
  let s = P.fill(`M${f(x - w / 2)} ${f(by)}L${f(x - w * .42)} ${f(by - h)}H${f(x + w * .42)}L${f(x + w / 2)} ${f(by)}Z`, 'stone', { w: .4 }) + P.shade(`M${f(x + w * .1)} ${f(by)}L${f(x + w * .08)} ${f(by - h)}H${f(x + w * .42)}L${f(x + w / 2)} ${f(by)}Z`, 'stone', .16);
  for (let i = 0; i < n; i++) { const y = by - h * (.62 + i * .14); s += P.fill(P.rect(x - w * .85, y, w * 1.7, Math.max(1, w * .45)), 'stone', { w: .35 }); }
  s += P.fill(P.spire(x, by - h, w * 1.02, h * .26), 'lead', { w: .35 }) + P.line(`M${f(x)} ${f(by - h * 1.26)}v${f(-w * .9)}`, 'gold', Math.max(.4, w * .2));
  return s;
}
function leadDome(P, cx, by, r, h, o = {}) {
  const { f } = P;
  let s = '';
  if (o.drum) { s += P.fill(P.rect(cx - r * .96, by - o.drum, r * 1.92, o.drum), 'stone') + P.windows(cx - r * .9, by - o.drum + 1, r * 1.8, o.drum - 2, Math.max(2, Math.round(r / 3)), 1, { arched: true, ww: .5, wh: .8, plain: true }); by -= o.drum; }
  s += P.fill(P.dome(cx, by, r, h), 'lead') + P.shade(`M${f(cx + r * .2)} ${f(by)}C${f(cx + r * .3)} ${f(by - h * 1.2)} ${f(cx + r)} ${f(by - h * .9)} ${f(cx + r)} ${f(by)}Z`, 'lead', .22) + P.lite(`M${f(cx - r * .8)} ${f(by - 1)}C${f(cx - r * .8)} ${f(by - h * .9)} ${f(cx - r * .3)} ${f(by - h * 1.05)} ${f(cx - r * .1)} ${f(by - h * .98)}C${f(cx - r * .5)} ${f(by - h * .8)} ${f(cx - r * .6)} ${f(by - h * .4)} ${f(cx - r * .55)} ${f(by - 1)}Z`, 'lead', .2);
  if (o.alem !== false) s += P.line(`M${f(cx)} ${f(by - h)}v${f(-Math.max(2, r * .35))}`, 'gold', Math.max(.4, r * .06));
  if (P.L.snow) s += P.flat(`M${f(cx - r * .85)} ${f(by - h * .4)}C${f(cx - r * .7)} ${f(by - h * 1.1)} ${f(cx + r * .7)} ${f(by - h * 1.1)} ${f(cx + r * .85)} ${f(by - h * .4)}Q${f(cx)} ${f(by - h * .7)} ${f(cx - r * .85)} ${f(by - h * .4)}Z`, '#f2f5f8', { op: .75 });
  return s;
}
/** The mosque of Sultan Ahmed: its courtyard, the cascade of domes and half-domes, the six minarets. */
function blueMosque(P, cx, by) {
  let s = '';
  // two far minarets at the courtyard's corners, then the prayer hall's walls with their two tiers of windows
  s += minaret(P, cx - 54, by - 2, 66, 3.2, 2) + minaret(P, cx + 54, by - 2, 66, 3.2, 2);
  s += P.fill(P.rect(cx - 46, by - 24, 92, 24), 'stone') + P.windows(cx - 44, by - 21, 88, 17, 11, 2, { arched: true, ww: .42, wh: .7, plain: true });
  s += P.shade(P.rect(cx + 26, by - 24, 20, 24), 'stone', .12) + P.fill(P.rect(cx - 47, by - 26, 94, 2.6), 'stone2', { w: .35 });
  // the cascade: little domes at the corners, the exedrae, the four half-domes, the weight-towers, the great dome
  for (const dx of [-40, 40]) s += leadDome(P, cx + dx, by - 26, 5.4, 4.4, { alem: false });
  for (const dx of [-30, 30]) s += leadDome(P, cx + dx, by - 26, 8, 5.6, { alem: false });
  s += P.fill(P.rect(cx - 30, by - 34, 60, 8), 'stone') + P.windows(cx - 28, by - 33, 56, 6, 8, 1, { arched: true, ww: .45, plain: true });
  for (const dx of [-20, 20]) s += leadDome(P, cx + dx, by - 34, 12, 8, { alem: false });
  for (const dx of [-24, 24]) s += P.fill(P.rect(cx + dx - 3, by - 46, 6, 12), 'stone', { w: .35 }) + leadDome(P, cx + dx, by - 46, 3.6, 4.4);
  s += leadDome(P, cx, by - 38, 19, 15, { drum: 7 });
  s += leadDome(P, cx, by - 30, 12, 7, { alem: false });
  // the four minarets at the corners of the prayer hall, three balconies each
  s += minaret(P, cx - 44, by - 2, 82, 3.6, 3) + minaret(P, cx + 44, by - 2, 82, 3.6, 3);
  return s;
}
/** Hagia Sophia: its ochre walls and buttresses, the low great dome on its ring of windows, four minarets. */
function hagiaSophia(P, cx, by) {
  const { f } = P;
  let s = '';
  // the minarets behind
  s += minaret(P, cx - 40, by - 4, 58, 3.4, 1) + minaret(P, cx + 42, by - 4, 52, 2.6, 1);
  // the body, banded in the Fossatis' stripes, its great buttresses
  s += P.fill(P.rect(cx - 46, by - 26, 92, 26), 'hagia') + P.stipple(P.rect(cx - 46, by - 26, 92, 26), 'hagia', 40, { box: [cx - 46, by - 26, 92, 26], op: .35 });
  let st = '';
  for (let y = by - 24; y < by; y += 4) st += `M${cx - 46} ${y}h92v1.2h-92Z`;
  s += P.flat(st, 'hagia2', { op: .5 }) + P.windows(cx - 40, by - 22, 80, 16, 8, 2, { arched: true, ww: .4, wh: .7, plain: true });
  for (const dx of [-46, -30, 24, 38]) s += P.fill(`M${cx + dx} ${by}V${by - 36}H${cx + dx + 8}L${cx + dx + 10} ${by}Z`, 'hagia', { w: .5 }) + P.shade(`M${cx + dx + 5} ${by}V${by - 36}H${cx + dx + 8}L${cx + dx + 10} ${by}Z`, 'hagia', .2);
  // the semi-domes, the tympanum walls, the great buttress-towers, the ring of forty windows, the dome wide and low
  s += leadDome(P, cx - 26, by - 26, 14, 9, { alem: false }) + leadDome(P, cx + 26, by - 26, 14, 9, { alem: false });
  s += P.fill(P.rect(cx - 22, by - 36, 44, 10), 'hagia') + P.windows(cx - 20, by - 35, 40, 8, 7, 1, { arched: true, ww: .45, plain: true });
  for (const dx of [-27, 21]) s += P.fill(`M${cx + dx} ${by - 26}V${by - 43}H${cx + dx + 6}V${by - 26}Z`, 'hagia', { w: .45 }) + P.shade(`M${cx + dx + 3.6} ${by - 26}V${by - 43}H${cx + dx + 6}V${by - 26}Z`, 'hagia', .2) + P.fill(P.rect(cx + dx - .6, by - 44.4, 7.2, 1.8), 'hagia2', { w: .3 });
  s += P.fill(P.rect(cx - 24, by - 41, 48, 5), 'hagia') + P.shade(P.rect(cx + 12, by - 41, 12, 5), 'hagia', .15);
  let w = '';
  for (let x = cx - 23; x < cx + 22; x += 2.6) w += P.arch(x, by - 40.4, 1.4, 4);
  s += P.flat(w, 'glass');
  s += leadDome(P, cx, by - 41, 27, 12);
  // the brick minaret and the slender one, nearer
  s += P.fill(P.rect(cx + 50, by - 54, 4.2, 54), 'brick', { w: .4 }) + P.fill(P.rect(cx + 48.6, by - 38, 7, 1.6), 'stone', { w: .3 }) + P.fill(P.spire(cx + 52.1, by - 54, 4.4, 14), 'lead', { w: .35 }) + P.line(`M${f(cx + 52.1)} ${by - 68}v-3`, 'gold', .5);
  s += minaret(P, cx - 52, by - 2, 62, 3.6, 2);
  return s;
}
function seraglio(P) {
  const { f } = P;
  let s = '';
  // the point: the sea walls, cypresses and planes over the palace's kiosks, the Tower of Justice
  s += P.fill('M270 236L280 222L320 214L372 218L392 236Z', '#9aa47e');
  const lf = P.L.leaf, r = P.rng(9);
  for (let i = 0; i < 16; i++) { const x = 276 + r() * 110, y = 226 - r() * 8; s += r() < .55 ? P.tree(x, y + 8, .38 + r() * .15, 'cypress') : lf.leaf ? `<path d="${P.blob(x, y, 7, 5, 7, i)}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width=".4"/>` : P.line(`M${f(x)} ${f(y + 5)}l-3 -7M${f(x)} ${f(y + 5)}l3 -8`, '#5b4a3c', .6); }
  for (const [x, w] of [[292, 22], [330, 26], [362, 18]]) s += P.fill(P.rect(x, 220, w, 9), 'wall', { w: .4 }) + P.fill(P.poly([[x - 4, 220], [x + 2, 214], [x + w - 2, 214], [x + w + 4, 220]]), 'lead2', { w: .4 }) + P.windows(x + 2, 222, w - 4, 5, Math.round(w / 5), 1, { ww: .5, plain: true });
  s += P.fill(P.rect(316, 188, 8, 32), 'stone') + P.fill(P.rect(314.6, 186, 10.8, 3), 'stone', { w: .35 }) + P.windows(317, 191, 6, 10, 1, 2, { arched: true, ww: .6, plain: true }) + P.fill(P.spire(320, 186, 10, 18), 'lead', { w: .4 }) + P.line('M320 168v-3', 'gold', .5);
  s += P.fill('M268 236L282 228H392L398 236Z', 'stone2', { w: .4 });
  for (let x = 284; x < 392; x += 9) s += P.fill(P.rect(x, 225.6, 5, 2.4), 'stone2', { w: .25 });
  return s;
}
function galata(P) {
  const { f } = P;
  let s = '';
  // Galata and Pera: houses climbing the hill in tiers, the Tower over them, the quays of Karaköy below
  const r = P.rng(13);
  const walls = ['wall', 'wall2', 'wall3', 'wood'];
  for (let row = 0; row < 5; row++) for (let x = 404 + row * 6; x < 584; x += 9 + r() * 8) {
    const y = 234 - row * 9 - (x - 400) * .12 * (row / 4), w = 8 + r() * 8, h = 7 + r() * 6;
    if (y - h < 186 + (x - 400) * -.02) continue;
    s += P.fill(P.rect(x, y - h, w, h), walls[Math.floor(r() * 4)], { w: .3 }) + P.fill(P.poly([[x - 1, y - h], [x + w / 2, y - h - 3], [x + w + 1, y - h]]), r() < .7 ? 'brick' : 'lead2', { w: .3 });
    const u = P.wr(), t = P.wr();
    s += `<rect x="${f(x + w * .3)}" y="${f(y - h * .7)}" width="${f(w * .2)}" height="${f(h * .3)}" fill="${u < P.L.windows ? P.glow(t < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}"/>`;
  }
  // the Galata Tower: its round stone shaft, the gallery under the low cap it has worn since the storm of 1875
  const tx = 474, tb = 214;
  s += P.fill(`M${tx - 8} ${tb}L${tx - 7} ${tb - 46}H${tx + 7}L${tx + 8} ${tb}Z`, 'stone2') + P.shade(`M${tx + 2} ${tb}L${tx + 2} ${tb - 46}H${tx + 7}L${tx + 8} ${tb}Z`, 'stone2', .22);
  for (const y of [tb - 34, tb - 22, tb - 10]) s += P.fill(P.arch(tx - 1.6, y, 3.2, 5), 'glass', { w: .3 });
  s += P.fill(P.rect(tx - 9.4, tb - 50, 18.8, 4), 'stone', { w: .4 }) + P.fill(P.rect(tx - 7.6, tb - 58, 15.2, 8), 'stone2', { w: .4 }) + P.windows(tx - 7, tb - 57, 14, 6, 4, 1, { arched: true, ww: .55, plain: true });
  s += P.fill(`M${tx - 9} ${tb - 58}L${tx} ${tb - 66}L${tx + 9} ${tb - 58}Z`, 'lead', { w: .4 }) + P.line(`M${tx} ${tb - 66}v-4`, '#5a4a3a', .6);
  // the Nusretiye mosque on the Tophane shore
  s += P.fill(P.rect(540, 222, 18, 12), 'stone', { w: .35 }) + leadDome(P, 549, 222, 8, 8) + minaret(P, 536, 234, 28, 1.8, 1) + minaret(P, 562, 234, 28, 1.8, 1);
  return s;
}

// ---------- the strait ----------
function maidensTower(P, cx, by) {
  const { f } = P;
  let s = '';
  // the rock and its little quay, the lodge, the tower with its lead cap and lantern
  s += P.fill(`M${cx - 34} ${by}Q${cx - 30} ${by - 8} ${cx - 18} ${by - 9}H${cx + 22}Q${cx + 32} ${by - 8} ${cx + 36} ${by}Z`, '#9a9488') + P.shade(`M${cx + 10} ${by - 9}H${cx + 22}Q${cx + 32} ${by - 8} ${cx + 36} ${by}H${cx + 12}Z`, '#9a9488', .2);
  s += P.fill(P.rect(cx - 26, by - 12, 52, 4), 'stone2', { w: .45 });
  s += P.fill(P.rect(cx - 22, by - 26, 34, 14), 'stone') + P.windows(cx - 20, by - 24, 30, 9, 4, 1, { arched: true, ww: .45 }) + P.fill(P.poly([[cx - 24, by - 26], [cx - 18, by - 32], [cx + 8, by - 32], [cx + 14, by - 26]]), 'lead2', { w: .45 });
  s += P.fill(P.rect(cx + 6, by - 62, 14, 50), 'stone') + P.shade(P.rect(cx + 15, by - 62, 5, 50), 'stone', .18) + P.windows(cx + 8, by - 58, 10, 36, 1, 3, { arched: true, ww: .5, wh: .6 });
  s += P.fill(P.rect(cx + 4.6, by - 64, 16.8, 3), 'stone2', { w: .4 }) + P.fill(P.rect(cx + 8, by - 72, 10, 8), 'stone', { w: .4 }) + P.windows(cx + 9, by - 71, 8, 6, 2, 1, { arched: true, ww: .6, plain: true });
  s += P.fill(`M${cx + 7} ${by - 72}Q${cx + 13} ${by - 76} ${cx + 13} ${by - 90}Q${cx + 13} ${by - 76} ${cx + 19} ${by - 72}Z`, 'lead', { w: .45 }) + P.line(`M${cx + 13} ${by - 90}v-5`, 'gold', .7);
  if (P.L.lamps > .05) s += `<circle cx="${cx + 13}" cy="${by - 68}" r="2.4" fill="${P.glow('#ffe7a0')}"/>`;
  s += P.line(`M${cx - 36} ${by + 1}h74`, '#e8eef0', .8, { op: .6 });
  return s;
}
/** A Şirket-i Hayriye paddle ferry: black hull, white saloons, the awning deck crowded with fezzes, the tall funnel. */
function ferry(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 112 * s, H = 48 * s, S = (k) => f(k * s);
  let b = '';
  b += P.fill(`M${S(56)} ${S(30)}L${S(57)} ${S(4)}H${S(63)}L${S(64)} ${S(30)}Z`, '#1d1a17', { w: .5 }) + P.flat(P.rect(57.2 * s, 9 * s, 5.6 * s, 2.4 * s), '#c8102e');
  b += P.fill(`M${S(14)} ${S(32)}V${S(22)}H${S(98)}V${S(32)}Z`, '#f2ece0', { w: .55 });
  for (let i = 0; i < 12; i++) b += `<rect x="${S(17 + i * 6.8)}" y="${S(24.4)}" width="${S(3.6)}" height="${S(4)}" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#4a5868')}"/>`;
  b += P.fill(`M${S(12)} ${S(22)}H${S(100)}V${S(19.6)}H${S(12)}Z`, '#d8cfbe', { w: .4 });
  // the awning on its posts, passengers in fezzes along the rail
  b += P.fill(`M${S(16)} ${S(12)}H${S(96)}L${S(98)} ${S(14.4)}H${S(14)}Z`, '#efe6d2', { w: .45 });
  for (let x = 18; x < 96; x += 8) b += `<path d="M${S(x)} ${S(14)}V${S(19.6)}" stroke="${P.ink('#5a4a3a')}" stroke-width="${S(.5)}"/>`;
  for (let i = 0; i < 10; i++) { const x = 21 + i * 7.6; b += `<circle cx="${S(x)}" cy="${S(16.2)}" r="${S(1.3)}" fill="${P.ink('#e2bf9c')}"/><rect x="${S(x - 1.2)}" y="${S(13.6)}" width="${S(2.4)}" height="${S(1.8)}" fill="${P.ink(i % 3 ? '#b22a2a' : '#2a2630')}"/>`; }
  // the hull and the paddle box with its fan of rays and number
  b += P.fill(`M${S(2)} ${S(32)}H${S(110)}L${S(102)} ${S(41)}H${S(10)}Q${S(4)} ${S(39)} ${S(2)} ${S(32)}Z`, '#26242a', { w: .6 }) + `<path d="M${S(6)} ${S(35)}H${S(106)}" stroke="${P.ink('#d8aa36')}" stroke-width="${S(.7)}"/>`;
  b += P.fill(`M${S(46)} ${S(36)}A${S(12)} ${S(12)} 0 0 1 ${S(70)} ${S(36)}Z`, '#f2ece0', { w: .55 });
  for (let a = 0; a < 7; a++) { const q = Math.PI * (a + .5) / 7; b += `<path d="M${S(58)} ${S(36)}L${S(58 - Math.cos(q) * 10)} ${S(36 - Math.sin(q) * 10)}" stroke="${P.ink('#b8a888')}" stroke-width="${S(.5)}"/>`; }
  b += `<text x="${S(58)}" y="${S(34.4)}" font-family="Georgia,serif" font-size="${S(4)}" font-weight="bold" text-anchor="middle" fill="${P.ink('#8a1a1a')}">64</text>`;
  // the stern flag
  b += `<path d="M${S(6)} ${S(32)}V${S(17)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.7)}"/><g transform="translate(${S(6)} ${S(17)}) scale(-1 1)"><rect width="${S(8)}" height="${S(5.4)}" fill="${P.ink('#c8102e')}"/><circle cx="${S(3.4)}" cy="${S(2.7)}" r="${S(1.4)}" fill="${P.ink('#ffffff')}"/><circle cx="${S(3.8)}" cy="${S(2.7)}" r="${S(1.1)}" fill="${P.ink('#c8102e')}"/></g>`;
  b += `<path d="M${S(110)} ${S(40)}q${S(5)} ${S(1)} ${S(9)} ${S(4)}M${S(2)} ${S(40)}q${S(-5)} ${S(1)} ${S(-8)} ${S(3)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(.9)}" fill="none" opacity=".7"/>`;
  if (P.L.lamps > .05) b += `<circle cx="${S(60)}" cy="${S(6)}" r="${S(1.2)}" fill="${P.glow('#fff2c0')}"/>`;
  return { svg: svg(W, H, flip(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 39 * s, puffs: [[dir > 0 ? 60 * s : W - 60 * s, 4 * s, s * 1.1, true, -dir]] };
}

// ---------- the Scutari shore ----------
function quay(P) {
  let s = '';
  s += P.fill('M24 326H580V334H24Z', 'stone2') + P.lite('M24 326H580V328H24Z', 'stone2', .3);
  for (let x = 40; x < 580; x += 32) s += P.line(`M${x} 328v6`, '#8a7a5a', .5, { op: .6 });
  s += P.paving(334, 382, { c: 'ground', vx: 300, seed: 9 });
  // boats drawn up at the landing steps
  s += P.fill('M150 328h40l-4 5h-32Z', '#7a5a3a', { w: .45 }) + P.fill('M196 329h30l-3 4h-24Z', '#3a5a6a', { w: .45 });
  s += P.crowd(60, 220, 344, 6, { s: .8, seed: 5, kinds: ['gent', 'worker', 'lady', 'boater'] });
  s += fezCrowd(P, [[96, 346, .82], [120, 345, .8], [240, 346, .82], [262, 345, .8], [420, 344, .8]]);
  s += P.lamp(146, 350, .9, 'bracket', { h: 70 }) + P.lamp(424, 350, .9, 'single', { h: 66 });
  return s;
}
function coffeeHouse(P) {
  const { f } = P, lf = P.L.leaf;
  let s = '';
  // the wooden kahvehane: its open front, the vine on the trellis, stools and low tables, the smokers
  s += P.fill('M470 300H580V350H470Z', 'wood') + P.shade('M560 300H580V350H560Z', 'wood', .2);
  s += P.fill(P.poly([[464, 300], [474, 286], [586, 286], [586, 300]]), 'brick');
  s += P.fill('M478 310H546V346H478Z', '#3a2a22') + (P.L.windows > .2 ? `<path d="M480 312H544V344H480Z" fill="${P.glow('#ffcf7a')}" opacity=".85"/>` : '');
  for (const x of [452, 500, 548]) s += P.line(`M${x} 372V300`, '#5b4532', 2.2);
  s += P.line('M446 300H580', '#5b4532', 1.8);
  if (lf.leaf) { const r = P.rng(3); for (let i = 0; i < 30; i++) { const x = 446 + r() * 134, y = 296 + r() * 10; s += `<path d="${P.blob(x, y, 5, 4, 6, i)}" fill="${P.ink(r() < .5 ? lf.leaf : lf.dark)}" stroke="${P.keyC()}" stroke-width=".35"/>`; } }
  else s += P.line('M448 298q20 -4 40 0t40 0t40 0', '#6a5a4a', .9);
  // the smokers: low stools, narghiles with their coiled hoses, a tray of coffee
  s += smoker(P, 470, 372, 1.08, 1) + smoker(P, 528, 372, 1.08, -1) + narghile(P, 498, 372, 1.08);
  s += P.fill('M454 366h12v-2h-12Z', '#7a5a3a', { w: .4 }) + `<circle cx="458" cy="362.6" r="1.4" fill="${P.ink('#f2efe6')}"/><circle cx="462" cy="362.6" r="1.4" fill="${P.ink('#f2efe6')}"/>`;
  s += P.lamp(560, 372, 1, 'bracket', { h: 70 });
  return s;
}
function smoker(P, x, y, s, dir) {
  const { f } = P;
  // sitting on a low stool: knees up, the fez, the mouthpiece of the hose at his lips
  let d = P.fill(`M${f(x - 5 * s)} ${f(y)}h${f(10 * s)}v${f(-6 * s)}h${f(-10 * s)}Z`, '#7a5a3a', { w: .4 });
  d += P.fill(`M${f(x - 3 * s)} ${f(y - 6 * s)}L${f(x - 3.4 * s)} ${f(y - 19 * s)}Q${f(x)} ${f(y - 21 * s)} ${f(x + 3.4 * s)} ${f(y - 19 * s)}L${f(x + 3 * s)} ${f(y - 6 * s)}Z`, '#3a4050', { w: .45 });
  d += P.fill(`M${f(x)} ${f(y - 8 * s)}l${f(8 * s * dir)} ${f(-1 * s)}l${f(1 * s * dir)} ${f(8 * s)}h${f(-2.2 * s * dir)}l${f(-.6 * s * dir)} ${f(-5.6 * s)}l${f(-6 * s * dir)} ${f(1 * s)}Z`, '#2c2c34', { w: .4 });
  d += `<circle cx="${f(x)}" cy="${f(y - 22.6 * s)}" r="${f(2.4 * s)}" fill="${P.ink('#d9ae88')}" stroke="${P.keyC()}" stroke-width=".5"/>`;
  d += P.fill(`M${f(x - 2.5 * s)} ${f(y - 23.4 * s)}L${f(x - 1.9 * s)} ${f(y - 27.6 * s)}H${f(x + 1.9 * s)}L${f(x + 2.5 * s)} ${f(y - 23.4 * s)}Z`, '#b22a2a', { w: .35 }) + P.line(`M${f(x)} ${f(y - 27.4 * s)}q${f(-1.8 * s * dir)} ${f(.4 * s)} ${f(-2.2 * s * dir)} ${f(2.6 * s)}`, '#1d1a17', .5 * s);
  d += P.line(`M${f(x + 2 * s * dir)} ${f(y - 21.4 * s)}q${f(8 * s * dir)} ${f(4 * s)} ${f(14 * s * dir)} ${f(3 * s)}`, '#7a4a3a', .7 * s);
  return d;
}
function narghile(P, x, y, s) {
  const { f } = P;
  let d = P.fill(`M${f(x - 4 * s)} ${f(y)}Q${f(x - 5 * s)} ${f(y - 6 * s)} ${f(x)} ${f(y - 7 * s)}Q${f(x + 5 * s)} ${f(y - 6 * s)} ${f(x + 4 * s)} ${f(y)}Z`, '#5a8aa0', { w: .45 }) + P.lite(`M${f(x - 3 * s)} ${f(y - 1 * s)}Q${f(x - 3.6 * s)} ${f(y - 5 * s)} ${f(x - 1 * s)} ${f(y - 6 * s)}Z`, '#5a8aa0', .3);
  d += P.fill(P.rect(x - .8 * s, y - 15 * s, 1.6 * s, 8 * s), '#c9a23a', { w: .35 }) + P.fill(`M${f(x - 2.6 * s)} ${f(y - 15 * s)}h${f(5.2 * s)}l${f(-1 * s)} ${f(-2.4 * s)}h${f(-3.2 * s)}Z`, '#8a5a3a', { w: .35 });
  if (P.L.lamps > .05) d += `<circle cx="${f(x)}" cy="${f(y - 17.6 * s)}" r="${f(1 * s)}" fill="${P.glow('#ff9a4a')}"/>`;
  return d;
}
function fountain(P, x, by) {
  const { f } = P;
  // a marble street fountain: its basin, the carved niche with the tap, the broad eaves
  let s = P.fill(P.rect(x - 16, by - 34, 32, 34), 'stone') + P.shade(P.rect(x + 8, by - 34, 8, 34), 'stone', .15) + P.stipple(P.rect(x - 16, by - 34, 32, 34), 'stone', 16, { box: [x - 16, by - 34, 32, 34], op: .3 });
  s += P.fill(`M${f(x - 7)} ${by - 10}V${by - 24}Q${f(x)} ${by - 32} ${f(x + 7)} ${by - 24}V${by - 10}Z`, 'stone2', { w: .45 }) + P.line(`M${f(x)} ${by - 18}v4`, '#c9a23a', 1);
  s += P.fill(P.rect(x - 12, by - 8, 24, 8), 'stone2', { w: .45 }) + P.fill(P.poly([[x - 22, by - 34], [x - 18, by - 40], [x + 18, by - 40], [x + 22, by - 34]]), 'lead2', { w: .5 });
  s += P.line(`M${x - 12} ${by - 28}h6M${x + 6} ${by - 28}h6`, '#a8946a', .6);
  return s;
}
function gull(P, x, y, d) {
  const { f } = P;
  return P.fill(`M${f(x - 4 * d)} ${y}q${f(2 * d)} -4 ${f(7 * d)} -3l${f(2 * d)} -1l${f(-1 * d)} 2q${f(-3 * d)} 3 ${f(-8 * d)} 2Z`, '#f4f3ee', { w: .4 }) + P.flat(`M${f(x - 4 * d)} ${y - .4}l${f(-2 * d)} -1v1.6Z`, '#3a3a3a') + P.line(`M${f(x + 1 * d)} ${y}v2`, '#d8a040', .5);
}

// ---------- people ----------
function fezMan(P, x, y, s, o = {}) {
  const { f } = P, top = y - 30 * s, dir = o.dir ?? 1;
  let d = P.person(x, y, s, 'sailor', { c: o.c ?? '#3a3a40', legs: o.legs ?? '#2c2c30', dir, stride: o.stride });
  d += P.fill(`M${f(x - 2.5 * s)} ${f(top + 3.4 * s)}L${f(x - 1.9 * s)} ${f(top - .8 * s)}H${f(x + 1.9 * s)}L${f(x + 2.5 * s)} ${f(top + 3.4 * s)}Z`, '#b22a2a', { w: .35 });
  d += P.line(`M${f(x)} ${f(top - .6 * s)}q${f(-1.8 * s * dir)} ${f(.4 * s)} ${f(-2.2 * s * dir)} ${f(2.6 * s)}`, '#1d1a17', .5 * s);
  return d;
}
function fezCrowd(P, pts) {
  let s = '';
  const r = P.rng(Math.round(pts[0][0]));
  for (const [x, y, k] of pts) { const u = r(); s += u < .6 ? fezMan(P, x, y, k, { c: ['#3a3a40', '#4a3a2e', '#2f3a4a', '#e8e0cc'][Math.floor(r() * 4)], dir: r() < .5 ? 1 : -1 }) : carsafSmall(P, x, y, k, r() < .5 ? 1 : -1); }
  return s;
}
function carsafSmall(P, x, y, s, dir, c = '#2a2630', o = {}) {
  return P.person(x, y, s, 'nun', { c, dir, stride: o.stride });
}
/** A lady in a çarşaf, its cape over the head, a veil, a parasol. */
function carsaf(P, x, y, s, o = {}) {
  const { f } = P;
  let d = P.person(x, y, s, 'nun', { c: o.c ?? '#2a2630', dir: 1 });
  d += P.flat(`M${f(x - 1.6 * s)} ${f(y - 26.6 * s)}h${f(3.2 * s)}v${f(2.4 * s)}h${f(-3.2 * s)}Z`, '#f0ece4', { op: .6 });
  d += P.line(`M${f(x + 3 * s)} ${f(y - 14 * s)}V${f(y - 33 * s)}`, '#4a3a30', .7 * s) + P.fill(`M${f(x - 4 * s)} ${f(y - 30 * s)}Q${f(x + 3 * s)} ${f(y - 38 * s)} ${f(x + 10 * s)} ${f(y - 30 * s)}Z`, o.parasol ?? '#e8d0a8', { w: .4 });
  return d;
}
function fezWalkers(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, kinds = o.kinds ?? ['fez', 'carsaf'], gap = 8 * s, W = (kinds.length - 1) * gap + 20 * s, H = 38 * s;
  const coats = ['#3a3a40', '#4a3a2e', '#2f3a4a'];
  const frame = (st) => flip(P, dir, W, kinds.map((k, i) => (k === 'carsaf' ? carsafSmall(P, 10 * s + i * gap, 36 * s, s * .96, 1, '#3a2a40', { stride: (st + i) % 2 }) : fezMan(P, 10 * s + i * gap, 36 * s, s, { c: coats[i % 3], dir: 1, stride: (st + i) % 2 }))).join(''));
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 * s };
}
/** A hamal: a porter bent under a load roped to the saddle on his back. */
function hamal(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 26 * s, H = 44 * s, S = (k) => f(k * s);
  const frame = (st) => {
    let b = fezMan(P, 12 * s, 42 * s, s, { c: '#6a5a44', legs: '#4a4038', dir: 1, stride: st });
    b += P.fill(`M${S(2)} ${S(26)}L${S(4)} ${S(6)}H${S(16)}L${S(14)} ${S(26)}Z`, '#a8885a', { w: .5 }) + P.line(`M${S(3)} ${S(12)}H${S(15)}M${S(3)} ${S(19)}H${S(14.6)}`, '#5a4030', .6) + P.fill(P.rect(5 * s, 1 * s, 10 * s, 6 * s), '#7a5a3a', { w: .45 });
    return flip(P, -dir, W, b);
  };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 2.4, w: W, h: H, ax: W / 2, ay: 42 * s };
}
/** A simit seller with his tray of sesame rings on his head. */
function simitci(P, x, y, s) {
  const { f } = P;
  let d = fezMan(P, x, y, s, { c: '#e8e0cc', legs: '#3a3a40', dir: -1 });
  d += P.fill(`M${f(x - 9 * s)} ${f(y - 32.6 * s)}h${f(18 * s)}l${f(-1 * s)} ${f(1.6 * s)}h${f(-16 * s)}Z`, '#8a6a46', { w: .4 });
  for (let i = 0; i < 5; i++) d += `<ellipse cx="${f(x - 6.4 * s + i * 3.2 * s)}" cy="${f(y - 33.6 * s)}" rx="${f(1.8 * s)}" ry="${f(1 * s)}" fill="none" stroke="${P.ink('#b8783a')}" stroke-width="${f(.9 * s)}"/>`;
  return d;
}
