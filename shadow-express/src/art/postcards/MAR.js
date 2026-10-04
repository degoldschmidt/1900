// Marseille from the Quai du Port: across the Vieux-Port the houses of the Rive Neuve climb toward the rock of La
// Garde, where Notre-Dame de la Garde stands striped in white and green under her gilded Virgin; at the harbour mouth
// the transporter bridge of 1905 strides from Fort Saint-Nicolas to Fort Saint-Jean, its gondola crossing under the
// girder, the Château d'If out at sea beyond. Lateen-rigged pointus and the little steam ferry cross the port; on the
// quay the fish market, a newspaper kiosk, the candelabra, gulls overhead.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'MAR',
  greet: 'SOUVENIR de MARSEILLE',
  nation: 'FR',
  flag: 'FR',
  flower: 'lavender',
  flower2: 'mimosa',
  frame: { band: ['#2fa8c6', '#1d5d6f'], gold: '#dcb862', ink: '#8a2a1a', leaf: ['#86a274', '#3e5f4a'], year: '#8a3a22', halo: '#f8edd2' },
  horizon: 236,
  clouds: 3,
  wind: -1, // the mistral, from the north-west
  birds: { c: '#f7f5ee', n: 5, y: 118, s: 1.05 },
  pal: {
    key: '#2b2520', stone: '#ece0c2', stone2: '#c8b48c', green: '#7d9a7c', rock: '#e2d3ae', rock2: '#b9a77f',
    wall: '#f1dbb2', wall2: '#e8bf98', wall3: '#efe6cf', roof: '#c26a43', water: '#2e85a6', far: '#a9b9bf',
    quay: '#d8c9a6', ground: '#e4d2a9', bridge: '#3d434b', glass: '#3a4858', sash: '#f2eadb', iron: '#27352f', gold: '#d9ad3c',
  },

  // a sprig of lavender: grey-green blades and four spikes of purple florets fanned from the stem
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(28, 4.2, 206, '#6f8f73', { shape: 'lance', vein: '#9db79a' }) + F.leaf(26, 4, 156, '#87a487', { shape: 'lance', vein: '#b8cdb2' }) + F.leaf(22, 3.6, 238, '#87a487', { shape: 'lance', vein: '#b8cdb2' }) + F.leaf(20, 3.4, 128, '#6f8f73', { shape: 'lance' });
    for (const [a, l, x] of [[-36, 19, -2], [-13, 25, 0], [11, 23, 1], [33, 17, 2]]) s += F.at(x, 9, F.spike(l, 4.4, ['#7556ad', '#9479c9', '#6a4a9e', '#8a6cc0'], { n: 11, sw: .9, stemC: '#5d7d62' }), a);
    s += F.at(0, 9, '<circle r="2.2" fill="#5d7d62"/>');
    return s;
  },
  // mimosa: yellow pompoms on a feathery leaf
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M-14 10Q-2 2 12 -12', I.leaf[1], 1);
    for (let i = 0; i < 9; i++) { const x = -12 + i * 2.8, y = 8.5 - i * 2.4; s += F.at(x, y, F.leaf(6, 1.8, -64, '#7f9e6c', { shape: 'lance', vein: '#9fbb88' }) + F.leaf(6, 1.8, 112, '#6a8a5c', { shape: 'lance', vein: '#9fbb88' })); }
    for (const [x, y, r, sd] of [[-5, -7, 3.6, 3], [3, -11, 3.2, 5], [9, -3, 3, 7], [-10, -1, 2.8, 9], [1, -2, 3.8, 11], [8, -14, 2.4, 13]]) s += F.at(x, y, F.cluster(r, 10, 1.15, ['#f3c91c', '#ffdd4f', '#e3ac10'], { seed: sd }));
    return s;
  },

  back(P, T) {
    let s = '';
    // the far coast, bare limestone, and the islands of Frioul with the Château d'If out at sea
    s += P.far(.86, () => P.fill('M10 214Q40 196 70 200Q96 186 128 196Q150 190 176 200L200 206Q230 200 260 212L290 236H10Z', 'far', { w: .5 }) + islands(P));
    // the sea and the port
    s += P.water(236, 342, { seed: 7, shimmer: 8, x0: 60, x1: 560 });
    // the rock of La Garde, its houses, and the basilica on the summit
    s += P.far(.5, () => P.row(18, 150, 236, { hMin: 10, hMax: 18, wMin: 9, wMax: 14, style: 'south', seed: 21, walls: ['#ead6b0', '#e2c4a2', '#efe4cc'], placard: false, flagSpot: false }));
    s += P.far(.42, () => garde(P));
    // the Pharo on its point, beyond Fort Saint-Nicolas
    s += P.far(.6, () => P.fill(P.rect(352, 218, 30, 16), 'wall3') + P.fill(P.poly([[350, 219], [358, 211], [376, 211], [384, 219]]), 'roof') + P.windows(354, 221, 26, 11, 5, 2, { ww: .45 }));
    // a steamer standing out to sea, seen through the harbour mouth
    s += P.far(.55, () => P.cross(T.steamer({ s: .34, dir: 1, hull: '#2a2c30', house: '#f2ede2', funnel: ['#2a2c30', '#c2442e'] }), { y: 250, dir: 1, dur: 96, rest: .35, x0: 340, x1: 560, offset: 18 }));
    // the transporter bridge's gondola, hung from the girder (drawn over it in the next layer)
    s += P.far(.3, () => P.mover(gondola(P), { path: [[402, 255, 1, 0], [402, 255, 1, .12], [512, 255, 1, .46], [512, 255, 1, .62], [402, 255, 1, .96], [402, 255, 1, 1]], dur: 84, offset: 12 }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the Rive Neuve: tall quay houses under the rock, the far quay and its forest of masts
    s += P.far(.34, () => P.row(14, 324, 264, { hMin: 26, hMax: 46, wMin: 12, wMax: 19, style: 'south', seed: 9, walls: ['#f1dbb2', '#e8bf98', '#efe6cf', '#e6cfa8'] }));
    s += P.far(.33, () => { let d = ''; for (let x = 16; x < 322; x += 7) d += P.flat(P.rect(x, 255, 4, 7), '#4a3a30'); return d; });
    s += P.far(.32, () => P.fill('M14 262H392V268H14Z', 'quay', { w: .5 }) + P.flagAt(52, 232) + P.flagAt(168, 228) + P.flagAt(262, 234));
    s += reflect(P, 30, 320, 268, 30, '#e8cfa6', 4) + reflect(P, 160, 250, 268, 22, '#ece0c2', 6);
    s += P.far(.3, () => mooredFleet(P));
    // Fort Saint-Nicolas at the left of the mouth, Fort Saint-Jean and King René's tower at the right
    s += P.far(.3, () => fortNicolas(P) + fortJean(P));
    // the transporter bridge
    s += P.far(.28, () => transporter(P));
    // a tartane at her mooring in mid-port, a man in a rowing boat beside her
    s += P.far(.15, () => tartane(P, 262, 296, .8));
    // lamps along the far quay
    s += P.far(.3, () => { let d = ''; for (const x of [44, 118, 196, 274]) d += P.lamp(x, 264, .34, 'single'); return d; });
    // across the port: pointus under their lateen sails, a rowing boat, the little steam ferry
    s += P.cross(T.sail({ s: .74, rig: 'lateen', sailC: '#f3ead4', hull: '#2f6f8e', strake: '#d04a32', dir: 1 }), { y: 286, dir: 1, dur: 118, offset: 20 });
    s += P.cross(T.sail({ s: .92, rig: 'lateen', sailC: '#efe2c6', hull: '#c9452f', strake: '#f1e6cf', dir: -1 }), { y: 310, dir: -1, dur: 96, rest: .2, offset: 64 });
    s += P.cross(T.rowboat({ s: .72, hull: '#3b6f5a', shirt: '#e9e4d6', dir: 1 }), { y: 276, dir: 1, dur: 150, offset: 90 });
    s += P.mover(ferry(P, -1), { path: [[566, 310, 1, 0, 0], [548, 306, .96, .04, 1], [348, 281, .64, .58, 1], [330, 279, .6, .64, 0], [330, 279, .6, 1, 0]], dur: 70, offset: 30 });
    // the near quay: coping, bollards, paving
    s += P.fill('M14 322H586V331H14Z', 'quay', { w: .8 }) + P.lite('M14 322H586V324.5H14Z', 'quay', .35) + P.shade('M14 328.5H586V331H14Z', 'quay', .22);
    for (let x = 40; x < 586; x += 31) s += P.line(`M${x} 324.5V328.5`, '#8a7e66', .5, { op: .6 });
    s += P.paving(331, 380, { vx: 300, seed: 6 });
    for (const x of [158, 300, 420]) s += bollard(P, x, 331);
    s += P.line('M158 326Q150 330 140 326', '#6a5034', .8) + anchor(P, 346, 344, .9);
    // the fish market under its umbrella, the newspaper kiosk where the bills go up, a plane tree, the candelabra
    s += fishStall(P, 214, 354, st.season);
    s += kiosk(P, 392, 356);
    s += P.tree(552, 352, 2.2, 'plane');
    s += P.lamp(124, 362, 1.05, 'iron', { h: 72 }) + P.lamp(450, 350, .9, 'iron', { h: 66 });
    // people of the quay
    s += P.person(318, 348, .92, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(330, 349, .9, 'worker', { c: '#6a5a46', legs: '#4a4038', dir: -1 });
    s += P.person(424, 344, .86, 'lady', { c: '#f3eee2', parasol: '#e8b9c4', dir: -1 }) + P.person(434, 344, .88, 'boater', { c: '#3d4a3c', dir: -1 });
    s += P.person(268, 362, 1.02, 'newsboy', { c: '#5a4a3a' }) + P.person(158, 362, 1.04, 'priest', { c: '#1d1d22', legs: '#1d1d22' });
    // strollers on the quay; at war the soldiers march here
    s += P.setStreet(370, 80, 480, 1.04);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.06, dir: 1, seed: 5, dresses: ['#f3eee2', '#c9d6e6'] }), { y: 376, dir: 1, dur: 74, offset: 8 });
    s += P.cross(T.walkers({ kinds: ['sailor', 'boater', 'lady'], s: 1, dir: -1, seed: 15, coats: ['#1f2a44', '#3d4a3c'] }), { y: 368, dir: -1, dur: 88, offset: 46 });
    return s;
  },

  front(P, T, st) {
    let s = '';
    // a pointu moored stern-to at the near quay, its yard and furled sail rising across the port
    s += pointu(P, 82, 319, 1.25);
    // a couple come to watch the gondola cross
    s += P.figure(492, 402, 1.02, 'gent', { c: '#2c2f38', hat: '#d8c896', arm: 16 }) + P.figure(530, 405, 1.0, 'lady', { c: '#eef0f2', sash: '#4a7aa0', parasol: '#f4e6d8', flowers: ['#7a5aa8', '#a88ad0', '#e8c25a'] });
    return s;
  },
};

// ---------- reflections ----------
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`;
}

// ---------- the sea ----------
function islands(P) {
  let s = P.fill('M392 236Q400 229 414 230Q424 226 436 233L442 236Z', 'far', { w: .45 }) + P.fill('M478 236Q486 228 500 229Q512 226 524 236Z', 'far', { w: .45 });
  // the Château d'If: a square keep with round towers on its rock
  s += P.fill('M448 236Q452 230 462 230Q470 229 474 236Z', 'rock2', { w: .45 });
  s += P.fill(P.rect(454, 224, 14, 7), 'stone', { w: .4 }) + P.fill(P.rect(457, 220, 8, 5), 'stone', { w: .4 });
  for (const x of [453, 469]) s += P.fill(P.rect(x - 2, 222, 4, 9), 'stone', { w: .35 });
  return s;
}

// ---------- the rock of La Garde and Notre-Dame ----------
function garde(P) {
  const { f } = P, lf = P.L.leaf;
  let s = '';
  const hill = 'M10 226C40 208 76 196 104 188C122 183 134 180 144 178L152 171H262L272 177C292 186 306 198 320 212C334 226 346 244 356 264H10Z';
  s += P.fill(hill, 'rock');
  s += P.shade('M262 171L272 177C292 186 306 198 320 212C334 226 346 244 356 264H318C312 238 294 206 276 186Z', 'rock', .18);
  s += P.stipple(hill, 'rock', 100, { box: [10, 171, 346, 93], op: .35 });
  // limestone ledges and the dark seams between them
  const r = P.rng(31);
  let ledge = '', seam = '';
  for (let i = 0; i < 26; i++) { const x = 30 + r() * 300, y = 186 + r() * 54; ledge += `M${f(x)} ${f(y)}q${f(4 + r() * 6)} ${f(-1 - r() * 2)} ${f(10 + r() * 8)} ${f(r() * 2)}`; seam += `M${f(x + 2)} ${f(y + 2)}l${f(-1 + r() * 2)} ${f(3 + r() * 5)}`; }
  s += `<path d="${ledge}" fill="none" stroke="${P.light('rock', .45)}" stroke-width="1.2" stroke-linecap="round"/><path d="${seam}" fill="none" stroke="${P.dark('rock2', .2)}" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`;
  // Aleppo pines and garrigue on the slopes, and a few white bastides among them
  const pine = lf.ever, scrub = lf.leaf ?? lf.ever;
  for (let i = 0; i < 18; i++) {
    const x = 24 + r() * 310, y = 192 + r() * 42;
    if (x > 136 && x < 284 && y < 204) continue;
    s += `<path d="${P.blob(x, y, 2.6 + r() * 3, 1.8 + r() * 1.4, 7, 40 + i)}" fill="${P.ink(i % 3 ? pine : scrub)}" stroke="${P.keyC()}" stroke-width=".35"/>`;
    if (i % 5 === 2) s += P.fill(P.rect(x + 6, y - 4, 7, 5), 'wall3', { w: .35 }) + P.fill(P.poly([[x + 5.5, y - 4], [x + 9.5, y - 6.5], [x + 13.5, y - 4]]), 'roof', { w: .3 });
  }
  // the road climbing to the sanctuary
  s += P.line('M300 232Q270 222 252 214Q236 208 262 198Q282 190 268 182', '#efe4c8', 1.6, { op: .8 });
  // the basilica, drawn at its own size and set on the summit
  const k = .82, ox = 228, oy = 91;
  s += `<g transform="translate(${f(ox * (1 - k))} ${f(oy * (1 - k))}) scale(${k})">${basilica(P)}</g>`;
  return s;
}
function basilica(P) {
  const { f } = P;
  let s = '';
  const win = () => (P.wr() < P.L.windows * .8 ? P.glow('#ffd88a') : P.ink('glass'));
  // the old fort's ramparts round the summit: a battered wall with buttresses, the drawbridge
  s += P.fill('M136 194L146 170H256L268 194Z', 'stone2') + P.shade('M234 170H256L268 194H240Z', 'stone2', .22);
  for (let x = 156; x < 252; x += 14) s += P.line(`M${x} 172L${x - 3} 193`, '#9c8a66', .7, { op: .8 });
  s += P.line('M144 177H259', '#9c8a66', .6, { op: .8 });
  for (let x = 150; x < 254; x += 8) s += P.flat(P.rect(x, 166.5, 4.4, 3.5), 'stone2');
  s += P.fill(P.arch(196, 180, 9, 14), '#3a3430', { w: .4 });
  // the crypt storey, a terrace of arches
  s += P.fill(P.rect(150, 156, 96, 14), 'stone') + P.shade(P.rect(232, 156, 14, 14), 'stone', .18);
  for (let x = 156; x < 240; x += 8) s += `<path d="${P.arch(x, 159, 4, 9)}" fill="${win()}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  s += P.fill(P.rect(148, 154.5, 100, 2.4), 'stone2', { w: .4 });
  // the upper church: the apse, the striped nave, the transept and the dome on its drum
  s += P.fill(P.arch(140, 134, 16, 22), 'stone', { w: .7 }) + stripes(P, 'M140 156V142A8 8 0 0 1 156 142V156Z', 140, 134, 16, 22);
  s += P.fill(P.dome(148, 135, 8, 7), 'stone2', { w: .5 });
  s += P.fill(P.rect(152, 130, 66, 26), 'stone') + stripes(P, P.rect(152, 130, 66, 26), 152, 130, 66, 26);
  s += P.shade(P.rect(204, 130, 14, 26), 'stone', .14);
  for (const x of [157, 165, 199, 207]) s += `<path d="${P.arch(x, 137, 4.4, 12)}" fill="${win()}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  s += P.fill(P.poly([[150, 131], [156, 124], [214, 124], [220, 131]]), 'stone2', { w: .6 });
  s += P.fill(P.rect(172, 120, 24, 36), 'stone') + stripes(P, P.rect(172, 120, 24, 36), 172, 120, 24, 36) + P.fill(P.gable(171, 121, 26, 8), 'stone2', { w: .55 });
  s += `<circle cx="184" cy="133" r="5" fill="${P.ink('glass')}" stroke="${P.ink('stone2')}" stroke-width="1.2"/>` + P.line('M184 128V138M179 133H189', 'stone2', .6);
  for (const x of [176, 189]) s += P.fill(P.arch(x, 142, 3.4, 9), 'glass', { w: .3 });
  // the drum and the dome, ribbed, a gilded lantern
  s += P.fill(P.rect(175, 104, 18, 10), 'stone') + stripes(P, P.rect(175, 104, 18, 10), 175, 104, 18, 10) + P.fill(P.rect(173.5, 112, 21, 2.4), 'stone2', { w: .4 });
  for (const x of [177.5, 182.5, 187.5]) s += P.fill(P.arch(x, 106, 3, 6), 'glass', { w: .3 });
  s += P.fill(P.dome(184, 104.5, 10, 12), 'stone') + P.shade('M184 92.5C189 93 193 97 194 104.5H186Z', 'stone', .18);
  s += P.line('M178.5 104C178.5 97 181 94 184 93M189.5 104C189.5 97 187 94 184 93M184 93V104', 'green', .8);
  s += P.fill(P.rect(182, 87, 4, 6), 'stone', { w: .4 }) + P.fill(P.dome(184, 87.5, 2.6, 2.6), 'gold', { w: .35 }) + P.line('M184 84.5V81M182.6 82.4H185.4', 'gold', .7);
  // the bell tower, striped, its belfry arcade, the drum, and the gilded Virgin holding the Child
  const tx = 218, tw = 20, cx = tx + tw / 2;
  s += P.fill(P.rect(tx, 128, tw, 42), 'stone') + stripes(P, P.rect(tx, 128, tw, 42), tx, 128, tw, 42) + P.shade(P.rect(tx + 14, 128, 6, 42), 'stone', .18);
  s += P.fill(P.arch(cx - 3, 140, 6, 16), 'glass', { w: .4 });
  s += P.fill(P.rect(tx - 1.5, 126, tw + 3, 2.6), 'stone2', { w: .45 });
  s += P.fill(P.rect(tx + 1, 112, tw - 2, 14), 'stone') + P.shade(P.rect(tx + 13, 112, 6, 14), 'stone', .2);
  for (const x of [tx + 3.4, tx + 10.4]) s += P.fill(P.arch(x, 114, 4.6, 11), '#3a3430', { w: .35 });
  s += P.fill(P.rect(tx - 1, 110, tw + 2, 2.6), 'stone2', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * 9 - 1.5, 106, 3, 4.4), 'stone2', { w: .35 }) + P.fill(P.dome(cx + k * 9, 106.4, 1.9, 2), 'gold', { w: .3 });
  s += P.fill(P.rect(cx - 5, 103, 10, 7.5), 'stone', { w: .5 }) + P.line(`M${cx - 2.5} 104V110M${cx} 104V110M${cx + 2.5} 104V110`, 'stone2', .5);
  s += P.fill(P.rect(cx - 6, 101.5, 12, 2), 'stone2', { w: .4 });
  s += virgin(P, cx, 101.5);
  return s;
}
/** Bands of green Golfolina stone across a white face. */
function stripes(P, clip, x, y, w, h) {
  const id = `${P.uid}sp${P._st++}`;
  let d = '';
  for (let yy = y + 2; yy < y + h; yy += 4.2) d += `M${P.f(x - 1)} ${P.f(yy)}h${P.f(w + 2)}v1.5h${P.f(-w - 2)}Z`;
  return `<clipPath id="${id}"><path d="${clip}"/></clipPath><path d="${d}" fill="${P.ink('green')}" opacity=".75" clip-path="url(#${id})"/>`;
}
/** The Bonne Mère: the gilded Virgin with the Child on her arm, her crown catching the sun. */
function virgin(P, x, by) {
  const { f } = P;
  let s = P.fill(`M${f(x - 3.4)} ${f(by)}L${f(x - 2.2)} ${f(by - 9)}Q${f(x - 2.4)} ${f(by - 12)} ${f(x)} ${f(by - 12.4)}Q${f(x + 2.4)} ${f(by - 12)} ${f(x + 2.2)} ${f(by - 9)}L${f(x + 3.4)} ${f(by)}Z`, 'gold', { w: .45 });
  s += P.shade(`M${f(x + .6)} ${f(by - 12)}Q${f(x + 2.4)} ${f(by - 11.6)} ${f(x + 2.2)} ${f(by - 9)}L${f(x + 3.4)} ${f(by)}H${f(x + 1)}Z`, 'gold', .25);
  s += `<circle cx="${f(x - 1.6)}" cy="${f(by - 8.4)}" r="1.5" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  s += `<circle cx="${f(x)}" cy="${f(by - 13.6)}" r="1.4" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  s += P.line(`M${f(x - 1.3)} ${f(by - 15.4)}l.6 -1.2l.7 .9l.7 -.9l.6 1.2`, 'gold', .5) + P.lite(`M${f(x - 2)} ${f(by - 2)}L${f(x - 1.2)} ${f(by - 9)}H${f(x - .4)}L${f(x - .8)} ${f(by - 2)}Z`, 'gold', .45);
  return s;
}

// ---------- the port ----------
function mooredFleet(P) {
  const { f } = P, r = P.rng(12);
  let s = '';
  const hulls = ['#2f6f8e', '#c9452f', '#f1ece0', '#3b6f5a', '#2b2b30', '#e2b23a'];
  for (let i = 0; i < 17; i++) {
    const x = 30 + i * 17.6 + r() * 6, h = 34 + r() * 22, w = 12 + r() * 6, hc = hulls[Math.floor(r() * hulls.length)];
    if (x > 300) break;
    s += P.line(`M${f(x)} 267V${f(267 - h)}`, '#5a4a3a', .7);
    const yd = 267 - h * (.55 + r() * .3), ya = yd + 10 + r() * 6;
    s += P.line(`M${f(x - 7 - r() * 3)} ${f(ya)}L${f(x + 9 + r() * 4)} ${f(yd - 6)}`, '#5a4a3a', .8) + P.line(`M${f(x - 5)} ${f(ya - 1)}L${f(x + 7)} ${f(yd - 4)}`, '#efe6d2', 1.4, { op: .9 });
    s += P.line(`M${f(x)} ${f(267 - h)}L${f(x + w * .6)} 266M${f(x)} ${f(267 - h)}L${f(x - w * .6)} 266`, '#6a5a4a', .3, { op: .7 });
    s += P.fill(`M${f(x - w / 2)} 266Q${f(x)} 271 ${f(x + w / 2)} 266L${f(x + w / 2 + 2)} 263H${f(x - w / 2 - 2)}Z`, hc, { w: .45 });
  }
  return s;
}
function fortNicolas(P) {
  let s = P.fill('M316 266L320 240L336 236L352 240L368 234L390 238L394 266Z', 'stone') + P.shade('M368 234L390 238L394 266H372Z', 'stone', .2);
  s += P.stipple('M316 266L320 240L336 236L352 240L368 234L390 238L394 266Z', 'stone', 40, { box: [316, 234, 78, 32], op: .3 });
  s += P.line('M320 244L336 240L352 244L368 238L390 242', 'stone2', .7) + P.fill(P.rect(334, 228, 6, 9), 'stone', { w: .45 }) + P.fill(P.dome(337, 228.5, 3.6, 3), 'stone2', { w: .4 });
  for (const x of [326, 346, 360, 380]) s += P.flat(P.rect(x, 250, 3, 2), '#3a3430');
  return s;
}
function fortJean(P) {
  let s = P.fill('M520 266L522 242H600V266Z', 'stone') + P.stipple('M520 266L522 242H600V266Z', 'stone', 30, { box: [520, 242, 60, 24], op: .3 });
  // King René's tower: square, machicolated, a turret at its corner
  s += P.fill(P.rect(542, 190, 26, 54), 'stone') + P.shade(P.rect(560, 190, 8, 54), 'stone', .2) + P.stipple(P.rect(542, 190, 26, 54), 'stone', 26, { box: [542, 190, 26, 54], op: .3 });
  s += P.fill(P.rect(540, 184, 30, 7), 'stone2', { w: .5 });
  for (let x = 541; x < 569; x += 4) s += P.flat(P.rect(x, 191, 2, 2.4), '#3a3430');
  for (let x = 541; x < 569; x += 6) s += P.fill(P.rect(x, 180, 3.4, 4.4), 'stone2', { w: .35 });
  s += P.fill(P.rect(549, 204, 3, 6), 'glass', { w: .3 }) + P.fill(P.rect(557, 222, 3, 6), 'glass', { w: .3 });
  s += P.flag(555, 180, .9, 'FR', { h: 22 });
  return s;
}
/** The transporter bridge: two lattice pylons, the girder hung by its fans of stays, the backstays to the forts. */
function transporter(P) {
  const { f } = P;
  const xl = 386, xr = 528, top = 96, base = 264, gy = 150, gb = 160;
  let s = '';
  const c = 'bridge', k = P.keyC(), ink = P.ink(c);
  // backstays and stays first, fine as threads
  let stays = `M${xl} ${top + 2}L330 ${base - 2}M${xl} ${top + 2}L344 ${base - 2}M${xr} ${top + 2}L584 ${base - 10}M${xr} ${top + 2}L596 ${base - 26}`;
  for (const t of [.12, .24, .36, .48]) { const a = xl + (xr - xl) * t, b = xr - (xr - xl) * t; stays += `M${xl} ${top + 3}L${f(a)} ${gy}M${xr} ${top + 3}L${f(b)} ${gy}`; }
  stays += `M${xl} ${top + 3}L${xl - 14} ${gy}M${xr} ${top + 3}L${xr + 14} ${gy}`;
  s += `<path d="${stays}" fill="none" stroke="${ink}" stroke-width=".55" opacity=".85"/>`;
  // the pylons: tapering lattice towers
  for (const x of [xl, xr]) {
    const wb = 9, wt = 3;
    const L = (y) => x - (wt + (wb - wt) * (y - top) / (base - top)), R = (y) => x + (wt + (wb - wt) * (y - top) / (base - top));
    let lat = `M${f(L(top))} ${top}L${f(L(base))} ${base}M${f(R(top))} ${top}L${f(R(base))} ${base}`;
    for (let y = top + 4, i = 0; y < base - 2; y += 9, i++) { const y2 = Math.min(base, y + 9); lat += `M${f(L(y))} ${f(y)}L${f(R(y2))} ${f(y2)}M${f(R(y))} ${f(y)}L${f(L(y2))} ${f(y2)}M${f(L(y))} ${f(y)}H${f(R(y))}`; }
    s += `<path d="${lat}" fill="none" stroke="${k}" stroke-width="1.5" opacity=".55"/><path d="${lat}" fill="none" stroke="${ink}" stroke-width=".8"/>`;
    s += P.fill(P.rect(x - 4.5, top - 4, 9, 5), c, { w: .5 }) + P.line(`M${x} ${top - 4}v-5`, c, .8);
    s += P.fill(P.rect(x - 11, base - 4, 22, 5), 'stone2', { w: .5 });
    if (P.war === 'war') s += P.flag(x, top - 8, .7, 'FR', { h: 14 });
  }
  // the girder: chords and a lattice of diagonals
  const x0 = xl - 18, x1 = xr + 18;
  let g = `M${x0} ${gy}H${x1}M${x0} ${gb}H${x1}`;
  for (let x = x0, i = 0; x < x1; x += 6, i++) g += `M${f(x)} ${i % 2 ? gy : gb}L${f(x + 6)} ${i % 2 ? gb : gy}`;
  s += P.flat(P.rect(x0, gy, x1 - x0, gb - gy), c, { op: .18 });
  s += `<path d="${g}" fill="none" stroke="${k}" stroke-width="1.6" opacity=".5"/><path d="${g}" fill="none" stroke="${ink}" stroke-width=".85"/>`;
  s += P.fill(P.rect(x0, gy - 1.6, x1 - x0, 2.2), c, { w: .4 }) + P.fill(P.rect(x0, gb - .6, x1 - x0, 2), c, { w: .4 });
  return s;
}
/** The gondola: a deck with its little pavilion, hung by a fan of cables from the carriage that runs under the girder. */
function gondola(P) {
  const W = 34, H = 98, { f } = P;
  let b = '';
  b += P.fill(P.rect(11, 0, 12, 5), 'bridge', { w: .4 });
  let cab = '';
  for (const [a, z] of [[12, 1], [14.5, 8], [19.5, 26], [22, 33], [16, 12], [18, 22]]) cab += `M${a} 4L${z} 86`;
  b += `<path d="${cab}" stroke="${P.ink('bridge')}" stroke-width=".55" fill="none"/>`;
  b += P.fill('M0 86H34V89H0Z', 'bridge', { w: .45 });
  b += P.fill(P.rect(11, 77, 12, 9), '#efe6d2', { w: .45 }) + P.fill('M9 77.4L17 73L25 77.4Z', '#b8432e', { w: .4 });
  const lit = P.L.windows > .2;
  for (const x of [12.5, 17.5]) b += `<rect x="${x}" y="79" width="4" height="4" fill="${lit ? P.glow('#ffd88a') : P.ink('glass')}"/>`;
  // passengers and a cart on the deck
  for (const [x, c] of [[3, '#2f3440'], [6, '#f3eee2'], [27, '#4a3a30'], [30.5, '#c9d6e6']]) b += `<path d="M${x - 1} 86V81H${x + 1}V86Z" fill="${P.ink(c)}"/><circle cx="${x}" cy="80" r="1" fill="${P.ink('#e8c4a0')}"/>`;
  b += P.line('M0 84H34', 'bridge', .4) + P.fill('M0 89L2 93H32L34 89Z', '#5a5048', { w: .4 });
  if (P.L.lamps > .05) b += `<circle cx="17" cy="91" r="1.4" fill="${P.glow('#fff0c0')}"/><circle cx="17" cy="91" r="4" fill="${P.glow('#ffe2a0')}" opacity=".35"/>`;
  return { svg: doc(W, H, b), w: W, h: H, ax: W / 2, ay: 93 };
}
/** The Vieux-Port's steam ferry (1880): a small open boat under an awning, a tall black funnel amidships. */
function ferry(P, dir = 1) {
  const W = 52, H = 34, S = (n) => P.f(n);
  let b = P.fill('M2 25H50L46 31H7Q3 30 2 25Z', '#2b2b30', { w: .5 }) + P.line('M4 28H48', '#c9452f', .9);
  b += P.fill('M8 25V18H44V25Z', '#efe6d2', { w: .45 });
  for (let i = 0; i < 6; i++) b += `<rect x="${S(10 + i * 5.6)}" y="19.4" width="3.2" height="3.2" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3e4c5c')}"/>`;
  b += P.fill('M6 18.4H46L44 15.6H8Z', '#c9452f', { w: .4 }) + P.line('M7 16.5H45', '#f1e6cf', .5, { dash: '2 2' });
  b += P.fill('M24 15.6L24.6 3H28.4L29 15.6Z', '#1d1a17', { w: .45 }) + P.fill('M24.5 5.5H28.6V7.3H24.5Z', '#d9ad3c', { k: false });
  for (const [x, c] of [[13, '#2f3440'], [18, '#f3eee2'], [35, '#c9d6e6'], [40, '#4a3a30']]) b += `<circle cx="${x}" cy="16.6" r="1.3" fill="${P.ink('#e8c4a0')}"/><path d="M${x - 2} 15.6h4l-.6 -1.4h-2.8Z" fill="${P.ink(c === '#f3eee2' ? '#d9c27a' : '#25252a')}"/>`;
  const body = dir < 0 ? `<g transform="translate(${W} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: doc(W, H, body), w: W, h: H, ax: W / 2, ay: 30, puffs: [[26.7, 3, .6, true, 1]] };
}

// ---------- the quay ----------
/** A pointu moored at the quay: a white double-ender with a tall stem post, its yard and furled sail. */
function pointu(P, x, wl, s) {
  const { f } = P, S = (n) => f(n * s), X = (n) => f(x + n * s), Y = (n) => f(wl + n * s);
  let d = '';
  // the mast, the long yard across it, the furled sail along the yard, the stays
  d += P.line(`M${X(4)} ${Y(-6)}L${X(6)} ${Y(-150)}`, '#5a4432', 2.2 * s);
  d += P.line(`M${X(-34)} ${Y(-58)}L${X(52)} ${Y(-168)}`, '#5a4432', 1.6 * s);
  d += `<path d="M${X(-30)} ${Y(-60)}Q${X(8)} ${Y(-100)} ${X(48)} ${Y(-166)}L${X(52)} ${Y(-164)}Q${X(14)} ${Y(-104)} ${X(-24)} ${Y(-62)}Z" fill="${P.ink('#f1e6cf')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  for (let i = 1; i < 7; i++) { const t = i / 7; d += P.line(`M${X(-30 + 78 * t)} ${Y(-60 - 106 * t)}l${S(3)} ${S(2.4)}`, '#a8946a', .7); }
  d += P.line(`M${X(6)} ${Y(-150)}L${X(-40)} ${Y(-6)}M${X(6)} ${Y(-150)}L${X(46)} ${Y(-8)}M${X(52)} ${Y(-168)}L${X(40)} ${Y(-6)}`, '#4a3a2c', .5, { op: .8 });
  // the hull: white with a blue sheer strake, the stem rising in a long post
  d += P.fill(`M${X(-40)} ${Y(-10)}Q${X(-46)} ${Y(-22)} ${X(-48)} ${Y(-30)}L${X(-44)} ${Y(-30)}Q${X(-40)} ${Y(-18)} ${X(-32)} ${Y(-14)}H${X(38)}Q${X(44)} ${Y(-16)} ${X(48)} ${Y(-22)}L${X(50)} ${Y(-14)}Q${X(46)} ${Y(-2)} ${X(36)} ${Y(2)}H${X(-30)}Q${X(-38)} ${Y(0)} ${X(-40)} ${Y(-10)}Z`, '#f2ede2');
  d += P.shade(`M${X(-36)} ${Y(-2)}Q${X(0)} ${Y(4)} ${X(36)} ${Y(2)}Q${X(44)} ${Y(-2)} ${X(48)} ${Y(-12)}Q${X(10)} ${Y(-4)} ${X(-36)} ${Y(-2)}Z`, '#f2ede2', .25);
  d += P.line(`M${X(-40)} ${Y(-12)}Q${X(0)} ${Y(-11)} ${X(47)} ${Y(-16)}`, '#2f6f8e', 2.2 * s) + P.line(`M${X(-38)} ${Y(-7)}Q${X(0)} ${Y(-6)} ${X(44)} ${Y(-9)}`, '#c9452f', 1 * s);
  d += `<circle cx="${X(-30)}" cy="${Y(-9)}" r="${S(1.6)}" fill="${P.ink('#2b2b30')}"/>`;
  // a coil of net on the thwart, the mooring line to a ring
  d += P.fill(P.ellipse(x + 18 * s, wl - 15 * s, 9 * s, 3 * s), '#8a6a44', { w: .4 }) + P.line(`M${X(-12)} ${Y(-14)}q${S(4)} ${S(-3)} ${S(8)} 0q${S(4)} ${S(3)} ${S(8)} 0`, '#6a5034', .6);
  d += P.line(`M${X(44)} ${Y(-18)}Q${X(56)} ${Y(-10)} ${X(66)} ${Y(4)}`, '#6a5034', .8);
  return d;
}
function bollard(P, x, y) {
  return P.fill(`M${x - 3} ${y + 1}V${y - 5}Q${x - 3} ${y - 8} ${x} ${y - 8}Q${x + 3} ${y - 8} ${x + 3} ${y - 5}V${y + 1}Z`, '#3a3a38', { w: .5 }) + P.fill(P.rect(x - 4, y - 6, 8, 1.6), '#3a3a38', { w: .35 });
}
/** The fishwives' stall: trestles of crates under a broad umbrella, baskets, the poissonnières and their customers. */
function fishStall(P, x, by, season) {
  const { f } = P;
  let s = '';
  // the umbrella
  const ux = x + 4, uy = by - 46;
  s += P.line(`M${ux} ${uy}V${by - 8}`, '#5a4432', 1.4);
  let can = `M${ux - 40} ${uy + 10}Q${ux - 30} ${uy - 10} ${ux} ${uy - 13}Q${ux + 30} ${uy - 10} ${ux + 40} ${uy + 10}`;
  for (let i = 0; i < 8; i++) can += `Q${f(ux + 40 - i * 10 - 5)} ${uy + 6} ${f(ux + 40 - (i + 1) * 10)} ${uy + 10}`;
  s += P.fill(can + 'Z', '#efe4cc');
  for (let i = 0; i < 8; i += 2) s += P.flat(`M${ux} ${uy - 13}L${f(ux - 40 + i * 10)} ${uy + 10}Q${f(ux - 35 + i * 10)} ${uy + 6} ${f(ux - 30 + i * 10)} ${uy + 10}Z`, '#c9452f', { op: .9 });
  s += P.shade(`M${ux} ${uy - 13}Q${ux + 30} ${uy - 10} ${ux + 40} ${uy + 10}Q${ux + 30} ${uy + 6} ${ux + 20} ${uy + 10}Z`, '#efe4cc', .15);
  // the trestle and crates of fish: sardines silver, red mullet, a basket of sea urchins
  s += P.fill(P.rect(x - 28, by - 15, 64, 4), '#8a6a44', { w: .55 }) + P.line(`M${x - 24} ${by - 11}L${x - 26} ${by}M${x + 32} ${by - 11}L${x + 34} ${by}`, '#5a4432', 1.2);
  const r = P.rng(5);
  for (const [cx, c] of [[x - 18, '#b9c6cc'], [x - 2, '#d0574a'], [x + 14, '#b9c6cc'], [x + 28, '#5a3a4a']]) {
    s += P.fill(P.rect(cx - 7, by - 20, 14, 5), '#c8a676', { w: .45 });
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${f(cx - 5 + i * 2.5 + r())}" cy="${f(by - 20.5 - r())}" rx="2" ry=".9" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".25"/>`;
  }
  // baskets on the ground
  s += P.fill(P.ellipse(x - 40, by - 4, 7, 4), '#b08850', { w: .5 }) + P.fill(P.ellipse(x + 46, by - 3, 6, 3.4), '#b08850', { w: .5 });
  // in winter a brazier, in summer a pail of flowers
  if (season === 'winter') s += P.fill(`M${x + 54} ${by}l2 -8h8l2 8Z`, '#3a3430', { w: .5 }) + `<circle cx="${x + 60}" cy="${by - 9}" r="2.6" fill="${P.glow('#ffb35a')}"/>`;
  else s += P.fill(`M${x + 54} ${by}l1 -7h7l1 7Z`, '#7a8a96', { w: .5 }) + P.flat(P.blob(x + 58.5, by - 9, 5, 3, 7, 3), P.L.leaf.leaf ?? '#6a8a5a') + `<circle cx="${x + 56}" cy="${by - 10}" r="1.4" fill="${P.ink('#e8c23a')}"/><circle cx="${x + 60}" cy="${by - 11}" r="1.4" fill="${P.ink('#c8506a')}"/>`;
  // the fishwives behind their crates, a customer, a boy
  s += P.person(x - 14, by - 13, .95, 'lady', { c: '#3a3a44', top: '#efe6d2', hat: '#c9452f' }) + P.person(x + 18, by - 13, .92, 'lady', { c: '#5a4a6a', top: '#e8d8b8', hat: '#efe6d2' });
  s += P.person(x - 34, by + 2, 1.02, 'lady', { c: '#c9d6e6', parasol: '#f3eee2', dir: 1 }) + P.person(x + 40, by + 3, .8, 'child', { c: '#2f6f8e' });
  return s;
}
/** A newspaper kiosk: an octagon of panels under a little dome, the papers pegged up in front. */
function kiosk(P, x, by) {
  const { f } = P;
  let s = P.fill(P.rect(x - 14, by - 34, 28, 34), '#3f6a4a') + P.shade(P.rect(x + 6, by - 34, 8, 34), '#3f6a4a', .25);
  s += P.fill(P.rect(x - 9, by - 28, 18, 14), '#efe6d2', { w: .4 });
  for (let i = 0; i < 3; i++) s += P.line(`M${x - 7} ${by - 25 + i * 4}h14`, '#4a4440', .6, { op: .7 });
  s += P.fill(P.rect(x - 16, by - 37, 32, 4), '#3f6a4a', { w: .5 }) + P.fill(P.dome(x, by - 37, 13, 9), '#3f6a4a') + P.line(`M${x} ${by - 49}v-5`, '#d9ad3c', 1);
  s += P.flat(P.rect(x - 15, by - 40, 30, 2), '#d9ad3c');
  s += P.wall(x - 13, by - 31, 7, 10) + P.wall(x + 6, by - 31, 7, 10);
  return s;
}

/** A tartane at her mooring: two masts, the big lateen yard lowered and furled, a rowing boat alongside. */
function tartane(P, x, wl, s) {
  const { f } = P, X = (n) => f(x + n * s), Y = (n) => f(wl + n * s);
  let d = P.line(`M${X(-6)} ${Y(-4)}L${X(-5)} ${Y(-64)}M${X(16)} ${Y(-4)}L${X(17)} ${Y(-40)}`, '#5a4432', 1.4 * s);
  d += P.line(`M${X(-34)} ${Y(-26)}L${X(22)} ${Y(-70)}`, '#5a4432', 1.1 * s) + P.line(`M${X(-30)} ${Y(-28)}L${X(18)} ${Y(-66)}`, '#efe6d2', 2.4 * s, { op: .95 });
  d += P.line(`M${X(-5)} ${Y(-64)}L${X(-36)} ${Y(-4)}M${X(-5)} ${Y(-64)}L${X(30)} ${Y(-4)}M${X(17)} ${Y(-40)}L${X(36)} ${Y(-4)}`, '#4a3a2c', .4, { op: .8 });
  d += P.fill(`M${X(-36)} ${Y(-8)}Q${X(-38)} ${Y(-14)} ${X(-40)} ${Y(-16)}H${X(38)}Q${X(36)} ${Y(-8)} ${X(30)} ${Y(0)}H${X(-30)}Q${X(-35)} ${Y(-2)} ${X(-36)} ${Y(-8)}Z`, '#3a5a6e');
  d += P.line(`M${X(-38)} ${Y(-13)}H${X(37)}`, '#e2b23a', 1.2 * s) + P.shade(`M${X(-32)} ${Y(-2)}H${X(30)}L${X(33)} ${Y(-6)}H${X(-35)}Z`, '#3a5a6e', .3);
  d += P.fill(`M${X(32)} ${Y(4)}H${X(52)}L${X(49)} ${Y(8)}H${X(35)}Z`, '#8a5a3a', { w: .4 }) + P.person(x + 42 * s, wl + 4 * s, .55 * s, 'worker', { c: '#e9e4d6', legs: '#3a3a44' });
  d += reflect(P, x - 36 * s, x + 36 * s, wl + 1, 10, '#3a5a6e', 21);
  return d;
}
function anchor(P, x, y, s) {
  const { f } = P;
  return P.line(`M${x} ${f(y - 14 * s)}V${f(y)}M${f(x - 8 * s)} ${f(y - 5 * s)}Q${f(x - 7 * s)} ${f(y + 1 * s)} ${x} ${f(y + 1 * s)}Q${f(x + 7 * s)} ${f(y + 1 * s)} ${f(x + 8 * s)} ${f(y - 5 * s)}M${f(x - 4 * s)} ${f(y - 11 * s)}H${f(x + 4 * s)}`, '#2a2a2c', 1.8 * s) + `<circle cx="${x}" cy="${f(y - 15.5 * s)}" r="${f(1.6 * s)}" fill="none" stroke="${P.ink('#2a2a2c')}" stroke-width="${f(1 * s)}"/>`;
}
