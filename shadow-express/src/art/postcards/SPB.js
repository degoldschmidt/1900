// St Petersburg from the Strelka of Vasilyevsky Island, under a Rostral Column: across the broad Neva the Winter
// Palace, painted the dark red it wore in 1914 and crowded with statues along its roof, the Hermitage beside it, the
// Admiralty's golden needle and St Isaac's gilded dome. A Neva steamer, a barge of birch logs and a ferryman's skiff
// on the river; droshkies under their painted dugas on the granite. White nights come from the true sun.

const WL = 236; // the far bank's waterline

export default {
  id: 'SPB',
  greet: 'SOUVENIR de ST.-PÉTERSBOURG',
  nation: 'RU',
  flag: 'RU',
  flower: 'lily-of-the-valley',
  flower2: 'chamomile',
  frame: { band: ['#22775e', '#17453b'], gold: '#d9b55a', ink: '#7a1f1a', leaf: ['#6f9e5a', '#2c5534'], year: '#7a1f1a', halo: '#f8ecd0' },
  horizon: WL,
  clouds: 4,
  wind: 1,
  birds: { c: '#f4f3ee', n: 4, y: 132, s: 1 },
  pal: {
    key: '#29262a', palace: '#9a3d30', palace2: '#bd6450', hermitage: '#e2cd9b', admiralty: '#e6c766', trim: '#f0eadb',
    granite: '#a8958a', granite2: '#8d7b72', rostral: '#8c3b31', bronze: '#86683a', roof: '#4e675c', water: '#587c90',
    ground: '#cec1aa', glass: '#384658', sash: '#f0e9d8', iron: '#2a3332', gold: '#d8a838', isaac: '#c9c2b4',
  },

  // lily of the valley: two broad leaves sheathing an arched stem of white bells
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(34, 13, 196, I.leaf[1], { shape: 'oval' }) + F.leaf(30, 12, 150, I.leaf[0], { shape: 'oval' });
    s += F.stem('M2 10Q0 -10 10 -18Q18 -22 22 -14', I.leaf[1], 1.1);
    const bell = (x, y, a, sc) => F.at(x, y, `<path d="M0 0C-4.4 .6 -5 4.6 -5.2 7.6Q-4.4 6.6 -3.2 8.2Q-1.6 7 0 8.4Q1.6 7 3.2 8.2Q4.4 6.6 5.2 7.6C5 4.6 4.4 .6 0 0Z" fill="#fbfaf3" stroke="${I.key}" stroke-width=".55"/><path d="M-2.2 2Q-3.2 4 -3.2 6" stroke="#ffffff" stroke-width="1.1" fill="none"/><path d="M0 -1.6V0" stroke="${I.leaf[1]}" stroke-width=".8"/>`, a, sc);
    for (const [x, y, a, sc] of [[3, -12, -10, .9], [8.6, -17.4, 0, 1], [14.4, -19.6, 6, 1.05], [20, -17, 14, 1.1], [22.6, -12, 20, .8]]) s += bell(x, y, a, sc);
    s += F.at(-1, -6, `<ellipse rx="1.8" ry="2.6" fill="#eef3e2" stroke="${I.key}" stroke-width=".45"/>`, -20);
    return s;
  },
  // chamomile at the foot: small daisies with domed yellow hearts
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 5, 210, I.leaf[1], { shape: 'serrate' }) + F.leaf(14, 4.6, 145, I.leaf[0], { shape: 'serrate' });
    s += F.stem('M0 2Q-5 -6 -11 -8', I.leaf[1], .9) + F.at(-11, -9, F.radial(11, 6, 2.4, '#f8f6ee', { shape: 'strap', k: .35 }) + F.disc(2.6, '#ecc02c', { dots: '#be8f1e', n: 6 }), -20);
    s += F.radial(12, 9, 3.2, ['#fbf9f1', '#efebdd'], { shape: 'strap', k: .4 }) + `<ellipse cy="-.6" rx="4.2" ry="3.8" fill="#ecbf2a" stroke="${I.key}" stroke-width=".5"/><ellipse cx="-1.1" cy="-1.8" rx="1.7" ry="1.2" fill="#fae38a" opacity=".8"/>`;
    return s;
  },

  back(P, T) {
    let s = '';
    // St Isaac's gilded dome over the roofs, the Admiralty's needle, the Hermitage, the Winter Palace
    s += P.far(.66, () => isaac(P, 512, WL - 30));
    s += P.far(.55, () => P.row(452, 600, WL - 2, { hMin: 18, hMax: 26, wMin: 22, wMax: 34, style: 'south', seed: 21, walls: ['#e6d8b6', '#d9c6a0', '#e8dcc4'], roofC: '#4e675c', placard: false }));
    s += P.far(.5, () => admiralty(P, 360, 454, WL - 2));
    s += P.far(.5, () => hermitage(P, 26, 140, WL - 2));
    s += P.far(.42, () => winterPalace(P, 138, 356, WL - 2));
    s += P.far(.4, () => P.fill(`M20 ${WL - 4}H590V${WL + 1}H20Z`, 'granite', { w: .5 }) + P.lite(`M20 ${WL - 4}H590V${WL - 3}H20Z`, 'granite', .3));
    s += P.smoke(88, 196, .55) + P.smoke(470, 204, .5);
    // the Neva, wide and grey-blue, holding the palace's red
    s += P.water(WL + 1, 322, { seed: 3, shimmer: 10, x0: 40, x1: 560 });
    s += reflect(P, 138, 356, WL + 2, 40, '#9a3d30', 4) + reflect(P, 30, 138, WL + 2, 28, '#e2cd9b', 6) + reflect(P, 360, 454, WL + 2, 30, '#e6c766', 9) + reflect(P, 400, 412, WL + 2, 60, '#d8a838', 2);
    if (P.L.snow) { const r = P.rng(8); for (let i = 0; i < 22; i++) { const x = 30 + r() * 540, y = WL + 6 + r() * 76, w = 12 + r() * 36; s += P.fill(`M${P.f(x)} ${P.f(y)}l${P.f(w)} -1.2l4 3l${P.f(-w - 6)} 1Z`, '#eef2f5', { w: .4 }); } }
    // on the river: a steamer of the Finland company, a barge of birch logs, the ferryman's skiff, a yacht
    s += P.cross(T.steamer({ s: .6, dir: 1, hull: '#f0ece2', house: '#f4f0e6', funnel: ['#26282c', '#1b1b1d'], boot: '#9a3d30', flag: 'RU' }), { y: 268, dir: 1, dur: 84, rest: .25, offset: 12 });
    s += P.cross(barge(P, { s: .8, dir: -1 }), { y: 290, dir: -1, dur: 190, offset: 40 });
    s += P.cross(T.sail({ s: .52, rig: 'gaff', sailC: '#f3eee2', hull: '#2a3a4a', strake: '#d8a838', dir: -1 }), { y: 256, dir: -1, dur: 150, offset: 100 });
    s += P.cross(skiff(P, { s: .9, dir: 1 }), { y: 309, dir: 1, dur: 70, rest: .2, offset: 8 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the Strelka: its granite parapet, the descent to the water between the great granite spheres
    s += P.paving(330, 380, { vx: 300, seed: 12, c: 'ground' });
    const gap = [262, 338];
    for (const [a, b] of [[14, gap[0]], [gap[1], 590]]) s += P.fill(`M${a} 318H${b}V331H${a}Z`, 'granite') + P.lite(`M${a} 318H${b}V320.6H${a}Z`, 'granite', .3) + P.shade(`M${a} 328.4H${b}V331H${a}Z`, 'granite', .22);
    s += P.fill(`M${gap[0]} 324H${gap[1]}L${gap[1] - 8} 318H${gap[0] + 8}Z`, 'granite2', { w: .5 });
    for (let k = 0; k < 4; k++) s += P.line(`M${gap[0] + 4 + k * 1.6} ${330 - k * 2.4}H${gap[1] - 4 - k * 1.6}`, '#6e5e56', .5, { op: .6 });
    for (const x of gap) s += sphere(P, x, 331);
    for (let x = 30; x < 586; x += 32) if (x < gap[0] - 14 || x > gap[1] + 14) s += P.line(`M${x} 320.6V328.4`, '#7a6a62', .5, { op: .55 });
    // lamps along the parapet
    for (const x of [196, 404]) s += P.lamp(x, 319, .72, 'single', { h: 66 });
    // strollers along the parapet, looking over the river
    s += P.far(.06, () => P.crowd(140, 250, 336, 6, { s: .74, seed: 14, kinds: ['officer', 'lady', 'gent', 'lady', 'sailor'], ...clothes(P) }) + P.crowd(350, 470, 336, 6, { s: .74, seed: 19, kinds: ['gent', 'lady', 'officer', 'girl'], ...clothes(P) }));
    s += P.wall(206, 302, 9, 12);
    s += P.setStreet(352, 120, 574, .88);
    s += P.cross(droshky(P, { s: .82, dir: -1, fare: 'officer' }), { y: 352, dir: -1, dur: 46, rest: .3, x0: 120, offset: 14 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .86, dir: 1, seed: 9, dresses: ['#f3eee2', '#d9e2ee'], ...clothes(P) }), { y: 346, dir: 1, dur: 90, offset: 30, x0: 120 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the Rostral Column on the left, the droshky waiting on the right, a gorodovoy and passers-by
    s += rostral(P, 92, 372);
    s += T.place(droshky(P, { s: 1.32, dir: -1, fare: null }), 506, 378);
    s += gorodovoy(P, 430, 372, 1.08);
    s += P.person(362, 370, 1.04, 'lady', { c: frock(P, '#f2eee4'), parasol: umbrella(P, '#e6c8cc'), dir: 1 }) + officerRU(P, 378, 371, 1.06);
    s += P.person(166, 368, .96, 'peasant', { c: '#b84a3a', hat: '#e9e1c8' }) + P.person(180, 370, .9, 'child', { c: '#e8dcc2' });
    s += nurse(P, 232, 372, 1.08) + pram(P, 216, 372, 1.08);
    s += P.cross(T.walkers({ kinds: ['sailor', 'sailor'], s: 1.02, dir: -1, seed: 21, coats: ['#1d2840', '#1d2840'], ...clothes(P) }), { y: 374, dir: -1, dur: 70, offset: 50, z: 'fore', x0: 140 });
    return s;
  },
};

// ---------- the far bank ----------
function winterPalace(P, x0, x1, by) {
  const { f } = P;
  let s = '';
  const top = 194, w = x1 - x0;
  s += P.fill(P.rect(x0, top, w, by - top), 'palace') + P.stipple(P.rect(x0, top, w, by - top), 'palace', 50, { box: [x0, top, w, by - top], op: .25 });
  // the ground floor and the two floors above, bound by columns in pairs
  s += P.line(`M${x0} ${by - 13}H${x1}`, 'palace2', 1.1) + P.windows(x0 + 2, by - 12, w - 4, 11, 30, 1, { ww: .44, wh: .7, arched: true });
  s += P.windows(x0 + 2, top + 4, w - 4, by - top - 18, 30, 2, { ww: .4, wh: .58, lit: 1.1 });
  for (let i = 0; i <= 30; i++) { const x = x0 + 2 + i * (w - 4) / 30; s += P.line(`M${f(x)} ${top + 2}V${by - 13}`, 'palace2', .9); }
  // the projecting bays: the middle and the ends, a step taller
  for (const [a, b] of [[x0 - 2, x0 + 22], [x0 + w / 2 - 18, x0 + w / 2 + 18], [x1 - 22, x1 + 2]]) {
    s += P.fill(P.rect(a, top - 4, b - a, by - top + 4), 'palace') + P.windows(a + 2, top, b - a - 4, by - top - 16, 4, 2, { ww: .42, wh: .58 }) + P.windows(a + 2, by - 12, b - a - 4, 11, 4, 1, { ww: .44, wh: .7, arched: true });
    for (let k = 0; k <= 4; k++) s += P.line(`M${f(a + 2 + k * (b - a - 4) / 4)} ${top - 2}V${by - 13}`, 'palace2', 1);
    s += P.fill(P.rect(a - 1, top - 7, b - a + 2, 3), 'palace2', { w: .4 });
  }
  s += P.fill(P.rect(x0 - 1, top - 3, w + 2, 3), 'palace2', { w: .45 });
  s += P.shade(P.rect(x1 - 6, top - 4, 8, by - top + 4), 'palace', .2);
  // the statues and vases along the roof
  for (let x = x0 + 1; x < x1; x += 4.4) {
    const y = (x > x0 + w / 2 - 18 && x < x0 + w / 2 + 18) || x < x0 + 22 || x > x1 - 22 ? top - 7 : top - 3;
    s += (Math.round(x) % 3 === 0 ? P.fill(`M${f(x - .9)} ${y}h1.8l-.3 -2.2q.8 -.8 0 -1.6h-1.2q-.8 .8 0 1.6Z`, 'bronze', { w: .3 }) : P.fill(`M${f(x - .7)} ${y}v-3.6q.7 -1.4 1.4 0v3.6Z`, 'bronze', { w: .3 }) + `<circle cx="${f(x)}" cy="${y - 4.4}" r=".8" fill="${P.ink('bronze')}"/>`);
  }
  if (P.L.snow) s += P.flat(P.rect(x0 - 2, top - 8, w + 4, 2), '#f4f7fa', { op: .9 });
  // a flag over the middle bay
  s += P.flag(x0 + w / 2, top - 7, .7, 'RU', { h: 22 });
  return s;
}
function hermitage(P, x0, x1, by) {
  let s = P.facade(x0, by, 44, 34, { c: 'hermitage', roof: 'flat', side: 4, cols: 5, floors: 3, flagSpot: false });
  s += P.facade(x0 + 44, by, 40, 38, { c: 'trim', roof: 'flat', side: 3, cols: 5, floors: 3, flagSpot: false });
  s += P.facade(x0 + 84, by, x1 - x0 - 84, 36, { c: 'hermitage', roof: 'flat', side: 3, cols: 4, floors: 3 });
  s += P.columns(x0 + 50, by - 6, 28, 26, 6, 'trim');
  return s;
}
function admiralty(P, x0, x1, by) {
  const { f } = P;
  let s = '';
  const cx = (x0 + x1) / 2 + 2;
  // the tower: a yellow cube with its arch, a colonnade, the lantern, the golden needle with its little ship
  s += P.fill(P.rect(cx - 13, 166, 26, by - 166), 'admiralty') + P.fill(P.arch(cx - 5, 186, 10, 20), '#5a4a38', { w: .4 });
  s += P.fill(P.rect(cx - 14, 162, 28, 4), 'trim', { w: .45 });
  s += P.fill(P.rect(cx - 10, 146, 20, 16), 'admiralty', { w: .5 }) + P.columns(cx - 9, 162, 18, 15, 7, 'trim');
  s += P.fill(P.rect(cx - 11, 144, 22, 3), 'trim', { w: .4 });
  for (let x = cx - 9; x <= cx + 9; x += 4.5) s += P.fill(`M${f(x - .6)} 144v-3q.6 -1.2 1.2 0v3Z`, 'trim', { w: .25 });
  s += P.fill(`M${cx - 6} 144Q${cx - 6.6} 136 ${cx - 2} 134H${cx + 2}Q${cx + 6.6} 136 ${cx + 6} 144Z`, 'gold', { w: .45 });
  s += P.fill(P.rect(cx - 2.2, 126, 4.4, 8), 'gold', { w: .4 });
  s += P.fill(`M${cx - 2} 126L${cx} 90L${cx + 2} 126Z`, 'gold', { w: .5 }) + P.lite(`M${cx - 1.6} 126L${cx} 92L${cx - .2} 126Z`, 'gold', .4);
  s += `<circle cx="${cx}" cy="89.6" r=".9" fill="${P.ink('gold')}"/>` + P.fill(`M${cx - 3.4} 87.4h6.8l-1.2 1.6h-4.4Z`, 'gold', { w: .3 }) + P.line(`M${cx} 87.4v-4.2M${cx - 1.6} 85.6l1.6 -2.4l1.6 2.4`, 'gold', .5);
  // the Neva pavilion: yellow, white columns, a pediment
  s += P.fill(P.rect(x0, by - 30, x1 - x0, 30), 'admiralty') + P.windows(x0 + 3, by - 26, x1 - x0 - 6, 24, 12, 2, { ww: .42, wh: .6 });
  s += P.columns(x0 + 28, by - 2, 34, 26, 6, 'trim') + P.fill(P.gable(x0 + 24, by - 30, 42, 9), 'trim', { w: .5 });
  s += P.fill(P.poly([[x0 - 1, by - 29], [x0 + 4, by - 34], [x1 - 4, by - 34], [x1 + 1, by - 29]]), 'roof', { w: .45 });
  if (P.L.snow) s += P.flat(P.poly([[x0 - 1, by - 31], [x0 + 4, by - 35], [x1 - 4, by - 35], [x1 + 1, by - 31]]), '#f4f7fa', { op: .9 });
  return s;
}
function isaac(P, cx, by) {
  const { f } = P;
  let s = '';
  // the drum ringed with granite columns, the gilded dome, the lantern; a belfry at either corner
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * 27 - 4, by - 30, 8, 22), 'isaac', { w: .45 }) + P.fill(P.dome(cx + k * 27, by - 30, 4.4, 6), 'gold', { w: .4 }) + P.line(`M${cx + k * 27} ${by - 36}v-4`, 'gold', .6);
  s += P.fill(P.rect(cx - 30, by - 10, 60, 12), 'isaac', { w: .5 });
  s += P.fill(P.rect(cx - 20, by - 40, 40, 30), 'isaac', { w: .55 }) + P.shade(P.rect(cx + 8, by - 40, 12, 30), 'isaac', .2);
  for (let k = 0; k <= 10; k++) s += P.line(`M${f(cx - 19 + k * 3.8)} ${by - 38}V${by - 11}`, '#8e8678', .9);
  s += P.fill(P.rect(cx - 22, by - 44, 44, 4), 'isaac', { w: .45 });
  s += P.fill(`M${cx - 19} ${by - 44}C${cx - 19} ${by - 68} ${cx + 19} ${by - 68} ${cx + 19} ${by - 44}Z`, 'gold', { w: .6 });
  s += P.lite(`M${cx - 15} ${by - 46}C${cx - 15} ${by - 60} ${cx - 6} ${by - 64} ${cx - 2} ${by - 62}C${cx - 8} ${by - 58} ${cx - 10} ${by - 52} ${cx - 10} ${by - 46}Z`, 'gold', .4);
  for (const k of [-.6, -.25, .1, .45]) s += P.line(`M${f(cx + k * 19)} ${by - 44}Q${f(cx + k * 15)} ${by - 60} ${cx} ${by - 62}`, '#a37a24', .5, { op: .7 });
  s += P.fill(P.rect(cx - 3.4, by - 72, 6.8, 9), 'isaac', { w: .4 }) + P.fill(P.dome(cx, by - 72, 3.6, 4), 'gold', { w: .4 }) + P.line(`M${cx} ${by - 77}v-6M${cx - 1.8} ${by - 81}h3.6`, 'gold', .7);
  return s;
}

// ---------- the Strelka ----------
function sphere(P, x, by) {
  const { f } = P;
  let s = P.fill(P.rect(x - 7, by - 16, 14, 16), 'granite') + P.shade(P.rect(x + 3, by - 16, 4, 16), 'granite', .2) + P.fill(P.rect(x - 8.5, by - 18, 17, 3), 'granite', { w: .5 });
  s += `<circle cx="${x}" cy="${by - 27}" r="9" fill="${P.ink('granite')}" stroke="${P.keyC()}" stroke-width=".8"/>` + P.shade(`M${x + 9} ${by - 27}A9 9 0 0 1 ${x - 6} ${by - 20.4}A10 10 0 0 0 ${x + 9} ${by - 27}Z`, 'granite', .3) + `<circle cx="${x - 3}" cy="${by - 30.4}" r="2.6" fill="${P.light('granite', .35)}" opacity=".8"/>`;
  if (P.L.snow) s += P.flat(`M${x - 8} ${by - 30}A9 9 0 0 1 ${x + 8} ${by - 30}Q${x} ${by - 33} ${x - 8} ${by - 30}Z`, '#f4f7fa');
  return s;
}
function rostral(P, cx, by) {
  const { f } = P;
  let s = '';
  // the granite pedestal and a river god seated against it
  s += P.fill(P.rect(cx - 30, by - 12, 60, 12), 'granite') + P.fill(P.rect(cx - 25, by - 52, 50, 40), 'granite') + P.shade(P.rect(cx + 14, by - 52, 11, 40), 'granite', .2);
  s += P.stipple(P.rect(cx - 25, by - 52, 50, 40), 'granite', 30, { box: [cx - 25, by - 52, 50, 40], op: .3 });
  s += P.fill(P.rect(cx - 28, by - 56, 56, 4), 'granite', { w: .5 }) + P.fill(P.rect(cx - 20, by - 66, 40, 10), 'granite', { w: .5 });
  s += P.fill(`M${cx - 18} ${by - 12}q-2 -14 2 -22q2 -10 7 -12q4 -1 5 4q0 6 -3 9q5 2 7 9l1 12Z`, '#e7dfcc', { w: .6 });
  s += `<circle cx="${cx - 7}" cy="${by - 48}" r="3.4" fill="${P.ink('#e7dfcc')}" stroke="${P.keyC()}" stroke-width=".55"/>` + P.line(`M${cx - 22} ${by - 30}L${cx - 4} ${by - 64}`, '#e7dfcc', 2.2) + P.shade(`M${cx - 4} ${by - 34}q4 2 7 9l1 12h-6Z`, '#e7dfcc', .2);
  // the shaft, red, with its bronze prows in pairs
  const yb = by - 66, yt = 120, r0 = 11, r1 = 9.4;
  s += P.fill(`M${cx - r0} ${yb}L${cx - r1} ${yt}H${cx + r1}L${cx + r0} ${yb}Z`, 'rostral') + P.shade(`M${cx + 3} ${yb}L${cx + 2.6} ${yt}H${cx + r1}L${cx + r0} ${yb}Z`, 'rostral', .22) + P.lite(`M${cx - 8} ${yb}L${cx - 7} ${yt}H${cx - 4.4}L${cx - 5} ${yb}Z`, 'rostral', .2, { op: .6 });
  for (const [i, y] of [140, 178, 216, 254].entries()) {
    // a ship's prow to either side: the stem curling up, the ram's beak at the waterline, a figurehead
    for (const k of [-1, 1]) {
      const x = cx + k * 9.4, X = (u) => x + k * u;
      s += P.fill(`M${X(0)} ${y - 7}L${X(13)} ${y - 6}Q${X(18)} ${y - 7} ${X(19.6)} ${y - 12}L${X(18)} ${y - 12.4}Q${X(17)} ${y - 6} ${X(15.6)} ${y - 2.4}L${X(23)} ${y + .6}L${X(15)} ${y + 3.4}Q${X(7)} ${y + 7} ${X(0)} ${y + 7}Z`, 'bronze', { w: .6 });
      s += P.lite(`M${X(0)} ${y - 6.4}L${X(13)} ${y - 5.4}Q${X(15)} ${y - 5.4} ${X(16)} ${y - 4}L${X(0)} ${y - 3}Z`, 'bronze', .35, { op: .85 }) + P.shade(`M${X(0)} ${y + 3}L${X(15)} ${y + 2.6}Q${X(7)} ${y + 7} ${X(0)} ${y + 7}Z`, 'bronze', .25);
      s += P.line(`M${X(2)} ${y - 1}H${X(14)}`, '#5a4424', .5, { op: .7 });
      s += i % 2 ? `<circle cx="${X(19)}" cy="${y - 13.4}" r="1.7" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".4"/>` : P.fill(`M${X(18.4)} ${y - 12}q${k * 3.4} -1 ${k * 3} -4.4q${k * -1.6} 1.2 ${k * -3.2} 2.6Z`, 'bronze', { w: .4 });
    }
    // and one coming straight at us: its stem, the beak below, a head on top
    s += P.fill(`M${cx - 3.2} ${y - 9}H${cx + 3.2}L${cx + 2.4} ${y + 4}L${cx} ${y + 8}L${cx - 2.4} ${y + 4}Z`, 'bronze', { w: .5 }) + P.shade(`M${cx} ${y - 9}H${cx + 3.2}L${cx + 2.4} ${y + 4}L${cx} ${y + 8}Z`, 'bronze', .25);
    s += `<circle cx="${cx}" cy="${y - 10.4}" r="2" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".45"/>` + P.line(`M${cx - 2.6} ${y - 3}h5.2`, '#5a4424', .5);
  }
  // the Doric capital, the platform, the tripod and its bowl
  s += P.fill(`M${cx - r1} ${yt}Q${cx - r1 - 3} ${yt - 3} ${cx - 13} ${yt - 6}H${cx + 13}Q${cx + r1 + 3} ${yt - 3} ${cx + r1} ${yt}Z`, 'granite', { w: .55 }) + P.fill(P.rect(cx - 14, yt - 9, 28, 3), 'granite', { w: .5 });
  s += P.line(`M${cx - 8} ${yt - 9}L${cx - 4} ${yt - 20}M${cx + 8} ${yt - 9}L${cx + 4} ${yt - 20}M${cx} ${yt - 9}V${yt - 20}`, 'bronze', 1.4);
  s += P.fill(`M${cx - 9} ${yt - 21}Q${cx} ${yt - 14} ${cx + 9} ${yt - 21}Z`, 'bronze', { w: .5 }) + P.fill(P.ellipse(cx, yt - 21, 9, 1.8), 'bronze', { w: .45 });
  if (P.L.snow) s += P.flat(P.rect(cx - 14, yt - 10.4, 28, 1.8), '#f4f7fa') + P.flat(P.rect(cx - 28, by - 57, 56, 2), '#f4f7fa');
  return s;
}

// ---------- people ----------
function gorodovoy(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  // the town policeman in his white summer tunic, black cap, the sabre at his side
  let d = P.person(x, y, s, 'gent', { c: '#eeebe2', legs: '#1d1f26', hat: '#1d1f26' });
  d += P.line(`M${f(x - 2.6 * s)} ${f(y - 13 * s)}L${f(x - 4.4 * s)} ${f(y - 2 * s)}`, '#5a5a62', 1.1 * s) + `<path d="M${f(x - 2.8 * s)} ${f(y - 14 * s)}h${f(5.6 * s)}" stroke="${P.ink('#2a2622')}" stroke-width="${f(.9 * s)}"/>`;
  d += `<path d="M${f(x - 3.2 * s)} ${f(top + 2.8 * s)}h${f(6.4 * s)}v${f(-2 * s)}h${f(-6.4 * s)}Z" fill="${P.ink('#1d1f26')}"/><path d="M${f(x - 2.4 * s)} ${f(top + 6.6 * s)}h${f(2 * s)}" stroke="${P.ink('#2a2622')}" stroke-width="${f(.8 * s)}"/>`;
  return d;
}
/** A wet-nurse in the Russian manner: red sarafan, white sleeves, the kokoshnik with its pearls and ribbons. */
function nurse(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  let d = P.person(x, y, s, 'peasant', { c: '#c43a32', top: '#f4f0e6', hat: '#c43a32', dir: -1 });
  d += `<path d="M${f(x - 3.6 * s)} ${f(top + 3 * s)}Q${f(x)} ${f(top - 3.6 * s)} ${f(x + 3.6 * s)} ${f(top + 3 * s)}Z" fill="${P.ink('#c43a32')}" stroke="${P.keyC()}" stroke-width=".45"/><path d="M${f(x - 2.6 * s)} ${f(top + 1.6 * s)}Q${f(x)} ${f(top - 1.8 * s)} ${f(x + 2.6 * s)} ${f(top + 1.6 * s)}" fill="none" stroke="${P.ink('#f4ecd0')}" stroke-width="${f(.6 * s)}" stroke-dasharray="${f(.5 * s)} ${f(.5 * s)}"/>`;
  d += P.line(`M${f(x + 2 * s)} ${f(top + 4 * s)}l${f(1.4 * s)} ${f(9 * s)}M${f(x + 2.6 * s)} ${f(top + 4 * s)}l${f(2.4 * s)} ${f(8 * s)}`, '#3a6ab0', .6 * s);
  return d;
}
/** A wicker perambulator with its hood up. */
function pram(P, x, y, s) {
  const { f } = P, S = (k) => f(k * s);
  let d = `<circle cx="${f(x - 4 * s)}" cy="${f(y - 2.4 * s)}" r="${S(2.4)}" fill="none" stroke="${P.ink('#2a2622')}" stroke-width="${S(.7)}"/><circle cx="${f(x + 4 * s)}" cy="${f(y - 2.4 * s)}" r="${S(2.4)}" fill="none" stroke="${P.ink('#2a2622')}" stroke-width="${S(.7)}"/>`;
  d += P.fill(`M${f(x - 7 * s)} ${f(y - 11 * s)}H${f(x + 6 * s)}Q${f(x + 6 * s)} ${f(y - 5 * s)} ${f(x)} ${f(y - 5 * s)}H${f(x - 5 * s)}Q${f(x - 7 * s)} ${f(y - 6 * s)} ${f(x - 7 * s)} ${f(y - 11 * s)}Z`, '#d8c49a', { w: .5 });
  d += P.fill(`M${f(x - 7 * s)} ${f(y - 11 * s)}Q${f(x - 7 * s)} ${f(y - 18 * s)} ${f(x)} ${f(y - 17 * s)}L${f(x - 1 * s)} ${f(y - 11 * s)}Z`, '#2e3a4a', { w: .5 });
  d += P.line(`M${f(x + 6 * s)} ${f(y - 11 * s)}L${f(x + 11 * s)} ${f(y - 16 * s)}`, '#2a2622', .8 * s);
  return d;
}
function officerRU(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  // an officer in the white summer tunic and peaked cap, gold on his shoulders
  let d = P.person(x, y, s, 'gent', { c: '#f2efe6', legs: '#2a3040', hat: '#f2efe6', dir: -1 });
  d += `<path d="M${f(x - 3.4 * s)} ${f(top + 2.4 * s)}q${f(3.4 * s)} ${f(-2.6 * s)} ${f(6.8 * s)} 0v${f(1 * s)}h${f(-6.8 * s)}Z" fill="${P.ink('#f2efe6')}" stroke="${P.keyC()}" stroke-width=".4"/><path d="M${f(x - 3.2 * s)} ${f(top + 3.2 * s)}h${f(6.4 * s)}" stroke="${P.ink('#c23a2a')}" stroke-width="${f(.7 * s)}"/><path d="M${f(x - 3.4 * s)} ${f(top + 7.6 * s)}h${f(1.8 * s)}M${f(x + 1.6 * s)} ${f(top + 7.6 * s)}h${f(1.8 * s)}" stroke="${P.ink('gold')}" stroke-width="${f(.9 * s)}"/>`;
  return d;
}

// ---------- the moving parts ----------
const svgDoc = (P, w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.f(w)} ${P.f(h)}" width="${P.f(w)}" height="${P.f(h)}">${body}</svg>`;
const facing = (P, dir, w, body) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${body}</g>` : body);
/** A horse in profile facing right, trotting (st 0 or 1); x, y: the withers. */
function horse(P, x, y, s, c, st) {
  const { f } = P, S = (k) => f(k * s), X = (k) => f(x + k * s), Y = (k) => f(y + k * s);
  const leg = (hx, a, back) => `<path d="M${X(hx)} ${Y(8)}L${X(hx + a)} ${Y(15)}L${X(hx + a * .4)} ${Y(21)}" fill="none" stroke="${back ? P.dark(c, .2) : P.ink(c)}" stroke-width="${S(2)}" stroke-linecap="round"/><path d="M${X(hx + a * .4 - 1)} ${Y(21)}h${S(2.4)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1.2)}"/>`;
  const sw = st ? 3 : -2.4;
  let b = leg(-11, -sw, true) + leg(5, sw, true);
  b += `<path d="M${X(-16)} ${Y(3)}q${S(-5)} ${S(4)} ${S(-4)} ${S(12)}" fill="none" stroke="${P.dark(c, .4)}" stroke-width="${S(2.4)}" stroke-linecap="round"/>`;
  b += P.fill(`M${X(-15)} ${Y(1)}Q${X(-14)} ${Y(-3)} ${X(-6)} ${Y(-2)}H${X(4)}Q${X(9)} ${Y(-3)} ${X(10)} ${Y(1)}Q${X(11)} ${Y(9)} ${X(5)} ${Y(10)}H${X(-10)}Q${X(-16)} ${Y(9)} ${X(-15)} ${Y(1)}Z`, c, { w: .55 });
  b += P.fill(`M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}Q${X(12)} ${Y(-14)} ${X(15)} ${Y(-12)}L${X(19)} ${Y(-5)}Q${X(19)} ${Y(-3)} ${X(17)} ${Y(-3)}L${X(13)} ${Y(-6)}L${X(10)} ${Y(3)}Z`, c, { w: .55 });
  b += `<path d="M${X(9)} ${Y(-10)}L${X(11.4)} ${Y(-15)}L${X(12.4)} ${Y(-11)}" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width="${S(.4)}"/><path d="M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}" stroke="${P.ink('#2a1e16')}" stroke-width="${S(1.4)}"/>`;
  b += leg(-12, sw * .8, false) + leg(4, -sw * .8, false);
  return b;
}
/** A Petersburg droshky: a light open cab, its horse under the painted duga, the izvozchik in his padded blue kaftan. */
function droshky(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 84 * s, H = 56 * s, S = (k) => f(k * s);
  const frame = (st) => {
    let b = '';
    // the fare on the seat behind, under the folded hood
    b += P.fill(`M${S(6)} ${S(36)}Q${S(2)} ${S(24)} ${S(10)} ${S(20)}L${S(16)} ${S(34)}Z`, '#1f1d1c', { w: .5 });
    if (o.fare === 'officer') b += `<path d="M${S(13)} ${S(34)}L${S(13.6)} ${S(22)}H${S(19.4)}L${S(20)} ${S(34)}Z" fill="${P.ink('#f2efe6')}" stroke="${P.keyC()}" stroke-width=".4"/><circle cx="${S(16.6)}" cy="${S(19.6)}" r="${S(2.3)}" fill="${P.ink('#e8c4a0')}"/><path d="M${S(13.6)} ${S(18.4)}q${S(3)} ${S(-2.6)} ${S(6)} 0v${S(.8)}h${S(-6)}Z" fill="${P.ink('#f2efe6')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
    else if (o.fare === 'lady') b += `<path d="M${S(12)} ${S(34)}L${S(14)} ${S(23)}H${S(19)}L${S(21)} ${S(34)}Z" fill="${P.ink('#e9d6dc')}" stroke="${P.keyC()}" stroke-width=".4"/><circle cx="${S(16.6)}" cy="${S(20.4)}" r="${S(2.2)}" fill="${P.ink('#e8c4a0')}"/><path d="M${S(11)} ${S(19.6)}q${S(5.6)} ${S(-5)} ${S(11)} 0Z" fill="${P.ink('#d9a7a0')}"/>`;
    // the low body, its seat, the driver's box
    b += P.fill(`M${S(8)} ${S(34)}H${S(46)}Q${S(48)} ${S(40)} ${S(42)} ${S(41)}H${S(12)}Q${S(7)} ${S(40)} ${S(8)} ${S(34)}Z`, '#232628', { w: .55 });
    b += `<path d="M${S(10)} ${S(37)}H${S(44)}" stroke="${P.ink('#a8343a')}" stroke-width="${S(.6)}"/>`;
    // the izvozchik: padded blue kaftan, a sash, a beard, the low top hat
    b += P.fill(`M${S(29)} ${S(35)}Q${S(27)} ${S(24)} ${S(31)} ${S(17)}H${S(39)}Q${S(42)} ${S(24)} ${S(41)} ${S(35)}Z`, '#253555', { w: .55 });
    b += `<path d="M${S(29.6)} ${S(28)}H${S(40.6)}" stroke="${P.ink('#c23a2a')}" stroke-width="${S(1.4)}"/>`;
    b += `<circle cx="${S(35.6)}" cy="${S(14)}" r="${S(2.6)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(34)} ${S(15)}q${S(2.4)} ${S(4)} ${S(4.4)} 0Z" fill="${P.ink('#6a4a2a')}"/><path d="M${S(32)} ${S(11.6)}h${S(7.4)}M${S(33)} ${S(11.6)}l${S(.4)} ${S(-4.4)}h${S(4.8)}l${S(.4)} ${S(4.4)}" fill="${P.ink('#1d1d20')}" stroke="${P.ink('#1d1d20')}" stroke-width="${S(1)}"/>`;
    b += `<path d="M${S(40)} ${S(22)}L${S(62)} ${S(16)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.5)}"/>`;
    // the shafts, the wheels
    b += `<path d="M${S(42)} ${S(36)}L${S(66)} ${S(28)}" stroke="${P.ink('#5b4532')}" stroke-width="${S(1.2)}"/>`;
    for (const [cx, cy, r] of [[17, 42, 9], [44, 45, 6]]) {
      b += `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(r)}" fill="none" stroke="${P.ink('#2a2622')}" stroke-width="${S(1.2)}"/>`;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6 + st * .26; b += `<path d="M${f((cx - Math.cos(a) * r) * s)} ${f((cy - Math.sin(a) * r) * s)}L${f((cx + Math.cos(a) * r) * s)} ${f((cy + Math.sin(a) * r) * s)}" stroke="${P.ink('#a8343a')}" stroke-width="${S(.5)}"/>`; }
    }
    // the horse, and the duga arched over its withers, painted
    b += horse(P, 66 * s, 30 * s, s * .92, '#4a3426', st);
    b += `<path d="M${S(62)} ${S(31)}Q${S(64)} ${S(11)} ${S(70)} ${S(13)}Q${S(73)} ${S(20)} ${S(70)} ${S(31)}" fill="none" stroke="${P.keyC()}" stroke-width="${S(3)}"/><path d="M${S(62)} ${S(31)}Q${S(64)} ${S(11)} ${S(70)} ${S(13)}Q${S(73)} ${S(20)} ${S(70)} ${S(31)}" fill="none" stroke="${P.ink('#b8392e')}" stroke-width="${S(1.8)}"/><circle cx="${S(67.6)}" cy="${S(13.6)}" r="${S(1.2)}" fill="${P.ink('gold')}"/>`;
    if (P.L.lamps > .05) b += `<rect x="${S(43)}" y="${S(30)}" width="${S(2.4)}" height="${S(3)}" fill="${P.glow('#ffe2a0')}"/>`;
    return facing(P, dir, W, b);
  };
  return { frames: [svgDoc(P, W, H, frame(0)), svgDoc(P, W, H, frame(1))], fps: 5, w: W, h: H, ax: W / 2, ay: 50 * s };
}
/** A Neva barge heaped with birch logs, a hut at the stern, two men at the long sweeps. */
function barge(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 110 * s, H = 34 * s, S = (k) => f(k * s);
  let b = P.fill(`M${S(4)} ${S(22)}H${S(106)}L${S(100)} ${S(30)}H${S(10)}Z`, '#6a4a30', { w: .55 }) + P.line(`M${S(6)} ${S(25)}H${S(104)}`, '#4a3220', .5);
  for (let i = 0; i < 7; i++) { const x = 14 + i * 11; b += P.fill(`M${S(x)} ${S(22)}V${S(12)}H${S(x + 10)}V${S(22)}Z`, '#d8cdb6', { w: .4 }); for (let k = 0; k < 3; k++) b += `<circle cx="${S(x + 2.4 + k * 2.6)}" cy="${S(15 + (k % 2) * 3)}" r="${S(1)}" fill="${P.ink('#8a7a5a')}"/>`; }
  b += P.fill(`M${S(92)} ${S(22)}V${S(13)}H${S(104)}V${S(22)}Z`, '#7a5a3a', { w: .5 }) + P.fill(P.gable(91 * s, 13 * s, 14 * s, 5 * s), '#5a4030', { w: .45 });
  for (const x of [10, 86]) b += P.person(x * s, 22 * s, .5 * s, 'worker', { c: '#c8b8a0', hat: '#5a4a3a' }) + `<path d="M${S(x)} ${S(14)}L${S(x + (x < 50 ? -14 : 16))} ${S(31)}" stroke="${P.ink('#5b4532')}" stroke-width="${S(.8)}"/>`;
  return { svg: svgDoc(P, W, H, facing(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 27 * s };
}
/** The ferryman's skiff: he rows standing, his fare under a parasol. */
function skiff(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 46 * s, H = 30 * s, S = (k) => f(k * s);
  const frame = (st) => {
    let b = `<path d="M${S(30)} ${S(12)}L${S(st ? 22 : 38)} ${S(26)}" stroke="${P.ink('#6a4a2a')}" stroke-width="${S(.8)}"/>`;
    b += P.person(30 * s, 22 * s, .62 * s, 'worker', { c: '#d9cbb0', hat: '#4a4a52', stride: st });
    b += P.person(14 * s, 22 * s, .56 * s, 'lady', { c: frock(P, '#f2eee4'), parasol: umbrella(P, '#e8b9b3') });
    b += P.fill(`M${S(3)} ${S(20)}H${S(43)}L${S(38)} ${S(26)}H${S(8)}Z`, '#5a6a5a', { w: .5 }) + `<path d="M${S(6)} ${S(22)}H${S(40)}" stroke="${P.ink('#e8dcc0')}" stroke-width="${S(.6)}"/>`;
    return facing(P, dir, W, b);
  };
  return { frames: [svgDoc(P, W, H, frame(0)), svgDoc(P, W, H, frame(1))], fps: 1, w: W, h: H, ax: W / 2, ay: 24 * s };
}
/** A reflection: broken strokes of a building's colour under it, thinning and breaking up with distance. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`;
}

// ---------- what people wear ----------
/** Clothes for the season, for the kit's crowds and walkers: winter coats, autumn browns; summer keeps its whites. */
function clothes(P) {
  if (P.L.season === 'winter') return { dresses: ['#4a3e4e', '#3c4658', '#5a3a3a', '#4a4a3c'], coats: ['#26262c', '#3a2e2a', '#2a3036'] };
  if (P.L.season === 'autumn') return { dresses: ['#8a6448', '#5e5470', '#a8784a', '#e9dcc0', '#6a7a5a'], coats: ['#3a3430', '#4a3a30', '#3d4a3c'] };
  return {};
}
/** A lady's parasol, a black umbrella in the rain, nothing in winter. */
function umbrella(P, c) { return P.L.rain ? '#2a2a2e' : P.L.season === 'winter' ? false : c; }
/** A summer frock darkened to a winter coat. */
function frock(P, c) {
  if (P.L.season !== 'winter') return c;
  const n = parseInt(c.slice(1), 16), k = .42;
  return '#' + [(n >> 16) * k + 30, ((n >> 8) & 255) * k + 28, (n & 255) * k + 38].map((v) => Math.round(Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
