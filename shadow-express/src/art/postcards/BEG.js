// Belgrade from the Sava quay below Savamala, looking down the river to the confluence: the Cathedral's tall tower
// over the roofs of the slope, the ridge running out to Kalemegdan's walls and bastions above the two rivers, the Great
// War Island and the plain beyond, Zemun's tower across the Sava in Austria-Hungary. A Serbian paddle steamer, a tug
// with barges, an ox cart on the quay, peasants in white linen and šajkača caps. At war the Austro-Hungarian monitors
// come up the river, and smoke stands over the town.

export default {
  id: 'BEG',
  greet: 'POZDRAV iz BEOGRADA',
  nation: 'RS',
  flag: 'RS',
  flower: 'plum-blossom',
  flower2: 'basil',
  frame: { band: ['#1d3a7c', '#14264a'], gold: '#d8b65e', ink: '#8a1a1a', leaf: ['#82a85c', '#3e6a3a'], year: '#7a1e1e', halo: '#f7ecce' },
  horizon: 236,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#29241f', wall: '#f0e3c2', wall2: '#e8c690', wall3: '#e6d0c6', wall4: '#dfe0cc', stone: '#cdbf9c', stone2: '#a99a76',
    brick: '#a8644a', roof: '#a5523a', roof2: '#7a6a5a', church: '#efe2bf', copper: '#6d9f8a', water: '#6f9aa0', ground: '#cbbb98',
    hill: '#7c9a52', island: '#5d7d4a', glass: '#384658', sash: '#efe6d4', iron: '#2b3631', gold: '#d6aa3c',
  },

  // a sprig of plum blossom with two ripe plums in their bloom
  flowerArt(F) {
    const I = F.I;
    let s = F.stem('M-16 14Q-4 4 4 -2Q10 -8 18 -10', '#5a3a2a', 2.2) + F.stem('M2 0Q2 8 8 14', '#5a3a2a', 1.4);
    s += F.leaf(18, 8, 200, I.leaf[1], { shape: 'oval' }) + F.leaf(16, 7, 120, I.leaf[0], { shape: 'oval' });
    const plum = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${r * .9}" ry="${r}" fill="#4a3a7a" stroke="${I.key}" stroke-width=".55"/><path d="M${x} ${y - r}Q${x - r * .2} ${y} ${x} ${y + r}" stroke="#2e2450" stroke-width=".6" fill="none"/><ellipse cx="${x - r * .35}" cy="${y - r * .3}" rx="${r * .3}" ry="${r * .45}" fill="#9a8ec8" opacity=".55"/>`;
    s += plum(7, 17, 5.6) + plum(-1, 19, 5);
    const bloom = (x, y, k, a) => F.at(x, y, F.radial(5, 8, 7.5, '#fbf6f2', { shape: 'round', lite: '#ffffff' }) + F.radial(5, 4, 3, '#f2c6d0', { rot: 36, shape: 'round' }) + F.disc(1.8, '#e8b84a', { dots: '#b0703a', n: 6 }), a, k);
    s += bloom(-8, -4, 1, 10) + bloom(10, -8, .8, -20) + bloom(-15, 9, .7, 30);
    s += `<circle cx="18" cy="-12" r="2.2" fill="#f4d6dc" stroke="${I.key}" stroke-width=".5"/>`;
    return s;
  },
  // basil: paired leaves up a stem, a spike of small white flowers
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M0 10V-14', I.leaf[1], 1.2);
    for (const [y, l] of [[6, 11], [-1, 9], [-7, 7]]) s += F.at(0, y, F.leaf(l, l * .7, -62, I.leaf[0], { shape: 'oval' }) + F.leaf(l, l * .7, 62, I.leaf[1], { shape: 'oval' }));
    s += F.at(0, -12, F.spike(9, 2.4, ['#f6f2ea', '#ece2f0'], { stem: false, n: 7 }));
    return s;
  },

  back(P, T) {
    let s = '';
    // the plain beyond the Danube, the Great War Island, Zemun across the Sava with its millennium tower
    s += P.far(.85, () => P.fill('M24 230H580V238H24Z', '#a8b8a6', { w: .3 }));
    s += P.far(.72, () => island(P));
    s += P.far(.7, () => zemun(P));
    // the ridge of the town running out to Kalemegdan over the confluence
    s += P.far(.45, () => ridge(P));
    s += P.far(.34, () => kalemegdan(P));
    // the rivers
    s += P.water(236, 312, { seed: 12, shimmer: 8, x0: 40, x1: 420 });
    s += P.far(.5, () => P.line('M24 236.6H360', '#e2e6dc', .6, { op: .5 }));
    s += reflect(P, 250, 380, 238, 26, 'stone', 4) + reflect(P, 30, 130, 238, 14, '#c9c2a8', 6);
    // war: the monitors come up the river, the town smokes
    if (P.war === 'war') {
      s += P.cross(monitor(P, { s: .62, dir: 1 }), { y: 268, dir: 1, dur: 150, rest: .1, x1: 470, offset: 20 });
      for (const [x, y, k] of [[296, 190, 1.5], [352, 170, 1.2], [430, 196, 1.6], [500, 186, 1.3], [548, 210, 1.1]]) s += P.smoke(x, y, k, { dark: true });
      // the guns' smoke over the river from the Zemun bank
      s += P.smoke(84, 226, .9) + P.smoke(128, 230, .7);
    } else s += P.cross(T.steamer({ s: .62, dir: 1, hull: '#f1ece0', house: '#f6f2e8', funnel: ['#c8102e', '#1d1a17'], paddle: true, flag: 'RS', boot: '#21468b' }), { y: 266, dir: 1, dur: 92, rest: .2, x1: 470, offset: 30 });
    s += P.cross(barges(P, { s: .6, dir: -1 }), { y: 286, dir: -1, dur: 130, rest: .1, x1: 470, offset: 70 });
    s += P.cross(T.rowboat({ s: .66, dir: 1, shirt: '#f2ede0', hull: '#5a4232' }), { y: 302, dir: 1, dur: 60, rest: .4, x1: 400, offset: 10 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the slope of the town down to the quay, the Cathedral above it
    s += P.far(.22, () => slope(P));
    s += P.far(.18, () => cathedral(P, 470, 214));
    // the quay: its stone edge on the river, a landing stage, the warehouses of the port
    s += quay(P);
    s += P.far(.1, () => P.crowd(60, 220, 318, 7, { s: .66, seed: 9, kinds: ['peasant', 'gent', 'worker', 'peasant', 'lady'], dresses: ['#f2ede0', '#e9c9b8', '#c9d6e6'] }));
    s += P.setStreet(350, 30, 570, .95);
    s += P.cross(oxCart(P, { s: .9, dir: 1 }), { y: 352, dir: 1, dur: 88, rest: .25, offset: 16 });
    s += P.cross(T.fiacre({ s: .74, dir: -1, horses: 2, body: '#2a2622', hood: '#3a2a22' }), { y: 344, dir: -1, dur: 46, rest: .45, offset: 58 });
    s += P.cross(peasantWalkers(P, { s: .82, dir: -1 }), { y: 336, dir: -1, dur: 92, offset: 40 });
    return s;
  },

  front(P, T) {
    let s = '';
    s += P.paving(358, 380, { c: 'ground', vx: 300, seed: 7 });
    // the kafana on the corner: its vine-hung pergola, its tables, a man with his coffee
    s += kafana(P);
    // a peasant woman with her basket, an officer, a family come to see the boats
    s += peasantMan(P, 212, 370, 1.08, { dir: 1 }) + P.person(228, 370, 1.04, 'peasant', { c: '#f2ede0', hat: '#c8302a', dir: -1 }) + basket(P, 236, 358);
    s += P.person(372, 368, 1.02, 'peasant', { c: '#e8dccb', hat: '#2f4a7a', dir: 1 }) + peasantMan(P, 388, 368, 1.06, { dir: -1 });
    s += P.person(160, 374, 1.08, 'officer', { dir: 1 }) + P.person(176, 374, 1.04, 'lady', { c: '#e9dcc8', parasol: '#d8576a', dir: -1 });
    s += P.lamp(118, 372, 1.05, 'single', { h: 72 });
    // a tall linden on the quay, its crown over the corner
    s += P.fill('M38 372L42 214H50L56 372Z', '#5b4532', { w: .6 }) + P.shade('M47 214H50L56 372H50Z', '#5b4532', .25) + P.line('M45 250q-10 -8 -14 -22M49 236q10 -6 14 -18', '#5b4532', 2.2);
    s += P.tree(47, 236, 2.3, 'round');
    s += P.figure(66, 410, 1.18, 'gent', { arm: 16, c: '#3a3530', hat: '#2a2622' });
    s += P.cross(peasantWalkers(P, { s: 1.06, dir: 1, kinds: ['man', 'woman', 'woman'] }), { y: 380, dir: 1, dur: 80, offset: 8, z: 'fore' });
    s += P.wall(520, 300, 14, 19);
    return s;
  },
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
const flip = (P, dir, w, b) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${b}</g>` : b);

/** A reflection: broken strokes of a colour under something on the water. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .74 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.5" opacity=".45" stroke-linecap="round"/>`;
}

// ---------- the far side ----------
function island(P) {
  const lf = P.L.leaf;
  let s = '';
  // the Great War Island, low and wooded, in the mouth of the Sava
  s += P.fill('M150 236C170 226 200 222 236 224C260 225 274 230 282 236Z', 'island');
  if (lf.leaf) for (let x = 156; x < 278; x += 7) s += `<path d="${P.blob(x, 228 - Math.sin((x - 150) / 132 * Math.PI) * 4, 5, 4, 6, x)}" fill="${P.ink(lf.leaf)}" opacity=".9"/>`;
  else s += P.line('M156 230h120', '#6a5a4a', .8, { op: .7 });
  return s;
}
function zemun(P) {
  const { f } = P;
  let s = '';
  // Zemun on its loess hill across the water: roofs, a church tower, the round tower of 1896 on the Gardoš
  s += P.fill('M24 236C40 222 70 214 100 216C120 218 132 228 140 236Z', '#a3ae8a');
  const r = P.rng(11);
  for (let x = 30; x < 134; x += 6 + r() * 5) { const y = 232 - r() * 6, w = 5 + r() * 5, h = 3 + r() * 3; s += P.fill(P.rect(x, y - h, w, h), r() < .6 ? 'wall' : 'wall4', { w: .3 }) + P.fill(P.poly([[x - 1, y - h], [x + w / 2, y - h - 3], [x + w + 1, y - h]]), 'roof', { w: .3 }); }
  s += P.fill(P.rect(72, 204, 6, 14), 'stone', { w: .4 }) + P.fill(P.spire(75, 204, 7, 8), 'roof2', { w: .4 }) + P.flat(P.rect(73.5, 208, 3, 2), 'glass');
  s += P.fill(P.rect(104, 200, 5, 20), 'wall', { w: .4 }) + P.fill(P.spire(106.5, 200, 7, 10), 'copper', { w: .4 }) + P.line('M106.5 190v-3', 'gold', .5);
  return s;
}
function ridge(P) {
  const { f } = P;
  let s = '';
  // the ridge from the right edge down toward the bluff; houses climbing it in tiers, red-roofed
  const hill = 'M380 240C400 200 430 170 470 160C520 152 556 150 580 150V300H380Z';
  s += P.fill(hill, 'hill') + P.stipple(hill, 'hill', 70, { box: [250, 150, 330, 150], op: .4 });
  if (P.L.snow) s += P.flat(hill, '#eef2f5', { op: .7 });
  const r = P.rng(7);
  const walls = ['wall', 'wall2', 'wall3', 'wall4'];
  for (let i = 0; i < 34; i++) {
    const x = 420 + r() * 160, top = 176 - (x - 420) * .12, y = top + 12 + r() * (232 - top), w = 8 + r() * 10, h = 6 + r() * 6;
    s += P.fill(P.rect(x, y - h, w, h), walls[Math.floor(r() * 4)], { w: .35 }) + P.fill(P.poly([[x - 1.5, y - h], [x + 2, y - h - 4], [x + w - 2, y - h - 4], [x + w + 1.5, y - h]]), r() < .8 ? 'roof' : 'roof2', { w: .35 });
    const u = P.wr(), t = P.wr();
    s += `<rect x="${f(x + w * .25)}" y="${f(y - h * .7)}" width="${f(w * .18)}" height="${f(h * .35)}" fill="${u < P.L.windows ? P.glow(t < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}"/>`;
  }
  const lf = P.L.leaf;
  for (let i = 0; i < 9; i++) { const x = 430 + r() * 140, y = 190 - (x - 420) * .1 + r() * 40; s += lf.leaf ? `<path d="${P.blob(x, y, 6, 5, 7, i + 3)}" fill="${P.ink(r() < .5 ? lf.leaf : lf.dark)}" stroke="${P.keyC()}" stroke-width=".4"/>` : P.line(`M${f(x)} ${f(y + 4)}l-3 -6M${f(x)} ${f(y + 4)}l3 -7M${f(x)} ${f(y + 4)}v-8`, '#5b4a3c', .6); }
  // the domed Bajrakli mosque and a church among the houses
  s += P.fill(P.rect(520, 176, 14, 10), 'wall4', { w: .4 }) + P.fill(P.dome(527, 176, 6, 6), '#8a8e8c', { w: .4 }) + P.fill(P.rect(536, 156, 3.4, 26), '#f3eee2', { w: .35 }) + P.fill(P.spire(537.7, 156, 4, 9), 'roof2', { w: .35 });
  s += P.smoke(560, 168, .5);
  return s;
}
function kalemegdan(P) {
  const { f } = P, lf = P.L.leaf;
  let s = '';
  // the bluff over the confluence, grassed and wooded, the walls along its crest
  const bluff = 'M218 238C232 230 248 214 264 202C280 190 300 182 322 180L434 176V240H218Z';
  s += P.fill(bluff, 'hill') + P.stipple(bluff, 'hill', 60, { box: [218, 176, 216, 64], op: .45 });
  if (P.L.snow) s += P.flat(bluff, '#eef2f5', { op: .65 });
  // the park's trees behind the ramparts
  for (const [x, y, r] of [[300, 176, 8], [318, 170, 10], [338, 166, 9], [372, 164, 11], [392, 166, 9], [412, 164, 10], [430, 160, 9]]) s += lf.leaf ? `<path d="${P.blob(x, y, r, r * .8, 8, x)}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width=".5"/><path d="${P.blob(x - 2, y - 3, r * .5, r * .35, 6, x + 1)}" fill="${P.ink(lf.light)}" opacity=".8"/>` : P.line(`M${x} ${y + 8}l-4 -10M${x} ${y + 8}l5 -11M${x} ${y + 8}v-12`, '#5b4a3c', .7);
  // the Clock Tower over the gate, its baroque cap; the Despot's tower with its battlements
  const cx = 352;
  s += P.fill(P.rect(cx - 7, 140, 14, 44), 'stone') + P.shade(P.rect(cx + 2.6, 140, 4.4, 44), 'stone', .22) + P.fill(P.rect(cx - 8, 138, 16, 3), 'stone2', { w: .4 });
  s += P.clock(cx, 150, 4.2, { tz: 0, face: '#f3eedc', rim: '#5a4a3a' });
  s += P.fill(P.arch(cx - 2.5, 160, 5, 9), '#3a3530') + P.fill(`M${cx - 8} 138Q${cx - 8} 128 ${cx} 124Q${cx + 8} 128 ${cx + 8} 138Z`, 'copper') + P.fill(P.rect(cx - 2, 118, 4, 6), 'stone', { w: .35 }) + P.fill(P.onion(cx, 118, 5, 8), 'copper', { w: .35 }) + P.line(`M${cx} 110v-4`, 'gold', .6);
  s += P.fill(P.rect(400, 152, 16, 30), 'stone') + P.shade(P.rect(410, 152, 6, 30), 'stone', .22);
  for (let x = 400; x < 416; x += 4) s += P.fill(P.rect(x, 148, 2.6, 4), 'stone', { w: .3 });
  s += P.fill(P.rect(405, 160, 3, 6), '#3a3530', { w: .3 });
  // the ramparts: a long crenellated wall stepping up the crest, its bastions thrust out toward the river
  const top = (x) => (x < 300 ? 204 - (x - 262) * .47 : 186 - (x - 300) * .03);
  let wall = `M256 ${f(top(256) + 16)}`;
  for (let x = 256; x <= 436; x += 4) wall += `L${x} ${f(top(x))}`;
  wall += `L436 ${f(top(436) + 14)}Z`;
  s += P.fill(wall, 'stone') + P.stipple(wall, 'stone', 50, { box: [256, 180, 180, 40], op: .35 });
  let cren = '';
  for (let x = 258; x < 434; x += 5) cren += `M${x} ${f(top(x))}v-2.6h2.6v2.6`;
  s += P.fill(cren + 'Z', 'stone', { w: .3 });
  let courses = '';
  for (let k = 4; k < 14; k += 3.4) courses += P.poly([[256, top(256) + k], [300, top(300) + k], [436, top(436) + k]], false);
  s += P.line(courses, 'stone2', .45, { op: .6 });
  // bastions seen from below: two walls meeting at the salient, its parapet rising to the point, a sentry box on it
  for (const [x, w, d] of [[268, 28, 26], [316, 32, 30], [374, 36, 30]]) {
    const yt = top(x + w / 2) + 1, sx = x + w * .46, peak = yt - 4, foot = yt + d;
    const L = P.poly([[x, yt], [sx, peak], [sx, foot], [x, yt + 14]]), R = P.poly([[sx, peak], [x + w, yt], [x + w, yt + 14], [sx, foot]]);
    s += P.fill(L, 'stone') + P.fill(R, 'stone') + P.shade(R, 'stone', .24) + P.stipple(L, 'stone', 14, { box: [x, peak, w, d + 4], op: .35 });
    let c = '';
    for (let k = 3; k < d; k += 3.6) c += P.poly([[x, yt + Math.min(14, k * .5)], [sx, peak + k], [x + w, yt + Math.min(14, k * .5)]], false);
    s += `<clipPath id="${P.uid}b${x}"><path d="${L}${R}"/></clipPath><g clip-path="url(#${P.uid}b${x})">${P.line(c, 'stone2', .45, { op: .55 })}</g>`;
    s += P.fill(P.poly([[x - 1, yt - 1.6], [sx, peak - 1.6], [x + w + 1, yt - 1.6], [x + w + 1, yt + 1], [sx, peak + 1], [x - 1, yt + 1]]), 'stone2', { w: .35 });
    s += P.fill(P.rect(sx - 2.4, peak - 8, 4.8, 7), 'stone', { w: .35 }) + P.fill(P.dome(sx, peak - 8, 2.8, 3), 'roof2', { w: .35 }) + P.flat(P.rect(sx - .8, peak - 6, 1.6, 2.4), '#3a3530');
  }
  // the lower town's wall at the water, the Nebojša tower where the rivers meet
  s += P.fill('M226 230H300V240H220Z', 'stone2', { w: .45 }) + P.line('M224 234H300', 'stone', .5, { op: .6 });
  s += P.fill(P.rect(226, 214, 14, 24), 'stone') + P.shade(P.rect(235, 214, 5, 24), 'stone', .22) + P.fill(P.poly([[225, 214], [233, 205], [241, 214]]), 'roof2', { w: .4 }) + P.fill(P.rect(231, 222, 3, 5), '#3a3530', { w: .3 });
  // a path zigzagging up the slope
  s += P.line('M300 236L330 222L296 212L330 200', '#d9cba6', 1.2, { op: .8 });
  // the flag on the great bastion
  s += P.flag(393, 186, .95, 'RS', { h: 26 });
  return s;
}

// ---------- the town's slope and the Cathedral ----------
function slope(P) {
  const { f } = P;
  let s = '';
  // the near slope: houses stepping down to the port, poplars, a stair
  const r = P.rng(19);
  const walls = ['wall', 'wall2', 'wall3', 'wall4'];
  for (const [x0, by, n] of [[396, 248, 6], [380, 270, 7], [360, 292, 8]]) {
    let x = x0;
    for (let i = 0; i < n && x < 590; i++) {
      const w = 22 + r() * 16, h = 18 + r() * 14;
      s += P.facade(x, by, w, h, { c: walls[Math.floor(r() * 4)], roof: r() < .7 ? 'pitch' : 'flat', roofC: 'roof', side: w * .16, cols: Math.max(2, Math.round(w / 9)), floors: Math.max(1, Math.round(h / 12)), placard: by > 280, flagSpot: by > 260 });
      x += w + (r() < .3 ? 6 : 0);
    }
  }
  for (const [x, y, k] of [[378, 270, .9], [392, 292, 1.1], [552, 248, .8]]) s += P.tree(x, y, k, 'poplar');
  return s;
}
function cathedral(P, cx, by) {
  const { f } = P;
  let s = '';
  // the nave behind, its roof, a row of tall windows
  s += P.fill(P.rect(cx + 8, by - 34, 70, 34), 'church') + P.shade(P.rect(cx + 64, by - 34, 14, 34), 'church', .15);
  s += P.fill(P.poly([[cx + 6, by - 34], [cx + 12, by - 46], [cx + 74, by - 46], [cx + 80, by - 34]]), 'roof2');
  if (P.L.snow) s += P.flat(P.poly([[cx + 6, by - 34], [cx + 12, by - 46], [cx + 74, by - 46], [cx + 80, by - 34]]), '#f2f5f8', { op: .8 });
  s += P.windows(cx + 12, by - 30, 50, 22, 4, 1, { arched: true, ww: .4, wh: .85 });
  for (let i = 0; i < 5; i++) s += P.line(`M${cx + 10 + i * 13} ${by - 34}V${by}`, '#d8c89c', .8);
  // the west tower: three stages, pilasters, the clock, the belfry, the tall gilded spire
  const w = 22, x0 = cx - w / 2;
  s += P.fill(P.rect(x0, by - 66, w, 66), 'church') + P.shade(P.rect(x0 + w * .7, by - 66, w * .3, 66), 'church', .16) + P.stipple(P.rect(x0, by - 66, w, 66), 'church', 30, { box: [x0, by - 66, w, 66], op: .3 });
  for (const k of [0, w - 3]) s += P.fill(P.rect(x0 + k, by - 66, 3, 66), '#e2d2aa', { w: .35 });
  s += P.fill(P.rect(x0 + 6, by - 22, 10, 22), '#5a4a3a', { w: .5 }) + P.fill(P.gable(x0 + 3, by - 22, 16, 7), 'church', { w: .45 });
  s += P.windows(x0 + 6, by - 52, 10, 18, 1, 1, { arched: true, ww: .7, wh: .9 });
  s += P.fill(P.rect(x0 - 2, by - 68, w + 4, 3), '#e2d2aa', { w: .45 });
  // the clock stage
  s += P.fill(P.rect(x0 + 2, by - 90, w - 4, 22), 'church') + P.shade(P.rect(x0 + w * .68, by - 90, w * .3 - 2, 22), 'church', .16);
  s += P.clock(cx, by - 79, 6.2, { tz: 0, face: '#f4efdc', rim: '#c9a23a' });
  s += P.fill(P.rect(x0, by - 92, w, 3), '#e2d2aa', { w: .45 });
  // the belfry with its round-arched openings, then the spire
  s += P.fill(P.rect(x0 + 4, by - 108, w - 8, 16), 'church') + P.fill(P.arch(cx - 3.5, by - 106, 7, 12), '#3a3530');
  s += P.fill(P.rect(x0 + 3, by - 110, w - 6, 3), '#e2d2aa', { w: .4 });
  s += P.fill(`M${cx - 7} ${by - 110}Q${cx - 6} ${by - 118} ${cx - 3} ${by - 121}L${cx} ${by - 150}L${cx + 3} ${by - 121}Q${cx + 6} ${by - 118} ${cx + 7} ${by - 110}Z`, 'copper') + P.shade(`M${cx} ${by - 150}L${cx + 3} ${by - 121}Q${cx + 6} ${by - 118} ${cx + 7} ${by - 110}H${cx + 1}Z`, 'copper', .25);
  s += `<circle cx="${cx}" cy="${by - 120}" r="2.4" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".4"/>` + P.line(`M${cx} ${by - 150}v-9M${cx - 2.6} ${by - 155}h5.2`, 'gold', 1);
  return s;
}

// ---------- the quay ----------
function quay(P) {
  const { f } = P;
  let s = '';
  // the landing stage on its pontoon, a gangway to the quay; the stone quay edge with its mooring rings
  s += P.fill('M60 304H178V312H60Z', '#3e352e', { w: .5 }) + P.fill('M70 290H150V304H70Z', '#ece2c8', { w: .5 }) + P.windows(74, 292, 70, 9, 6, 1, { ww: .5 });
  s += P.fill(P.poly([[66, 290], [110, 280], [156, 290]]), 'roof', { w: .45 }) + P.line('M110 280v-8', '#5a4a3a', .8) + `<g transform="translate(110 272)">${''}</g>`;
  s += P.flag(110, 281, .55, 'RS', { h: 12 });
  s += P.fill('M24 314H580V322H24Z', 'stone2') + P.lite('M24 314H580V316H24Z', 'stone2', .3);
  for (let x = 40; x < 580; x += 30) s += P.line(`M${x} 316v6`, '#7a6e58', .5, { op: .6 });
  s += P.line('M150 304L176 314', '#4a3a2c', 1.4) + P.line('M154 302L180 313', '#4a3a2c', .6);
  // the cobbles of the quay road
  s += P.paving(322, 360, { c: 'ground', vx: 300, seed: 3 });
  // the warehouses of the port along the right, a crane, sacks of grain and barrels on the quay
  s += P.facade(430, 318, 70, 30, { c: 'wall4', roof: 'pitch', roofC: 'roof2', side: 10, cols: 6, floors: 2, shop: ['#7a3a2a', '#efe2c4'], placard: true, flagSpot: true });
  s += P.facade(500, 318, 80, 38, { c: 'wall2', roof: 'pitch', roofC: 'roof', side: 12, cols: 6, floors: 2, placard: true, flagSpot: true });
  // an iron quay crane: its post, the latticed jib, a sack swinging on the hook
  s += P.fill('M405 318h10v-4h-10Z', 'iron', { w: .4 }) + P.line('M410 314V276', 'iron', 2.2);
  let jib = 'M410 302L378 260M410 294L380 258';
  for (let k = 1; k < 6; k++) { const t = k / 6; jib += `M${P.f(410 - 32 * t)} ${P.f(302 - 42 * t)}L${P.f(410 - 30 * (t + .08))} ${P.f(294 - 36 * (t + .08))}`; }
  s += P.line(jib, 'iron', .8) + P.line('M410 276L379 259', 'iron', .6) + P.line('M379 259V284', '#3a3a38', .5) + P.fill('M374 284h10l-1.6 7h-6.8Z', '#d6c49a', { w: .4 });
  for (const [x, y] of [[300, 320], [308, 320], [304, 314], [330, 321], [338, 321]]) s += P.fill(`M${x - 4} ${y}q0 -6 4 -6q4 0 4 6Z`, '#d9c79a', { w: .4 });
  for (const x of [350, 360]) s += P.fill(P.rect(x - 4, 312, 8, 9), '#7a5a3a', { w: .45 }) + P.line(`M${x - 4} 315h8M${x - 4} 318h8`, '#4a3a2a', .5);
  return s;
}

// ---------- people ----------
/** A Serbian peasant: white linen, a dark vest and sash, the šajkača cap, opanci. */
function peasantMan(P, x, y, s, o = {}) {
  const { f } = P, top = y - 30 * s, dir = o.dir ?? 1;
  let d = P.person(x, y, s, 'sailor', { c: '#f1ece0', legs: '#ece5d4', dir, stride: o.stride });
  d += P.fill(`M${f(x - 2.8 * s)} ${f(y - 12 * s)}L${f(x - 2.5 * s)} ${f(top + 7.4 * s)}H${f(x + 2.5 * s)}L${f(x + 2.8 * s)} ${f(y - 12 * s)}Z`, '#3a3230', { w: .3 }) + P.line(`M${f(x - 3 * s)} ${f(y - 12.6 * s)}h${f(6 * s)}`, '#b8322c', 1.2 * s);
  d += P.fill(`M${f(x - 2.8 * s)} ${f(top + 3.4 * s)}l${f(.5 * s)} ${f(-3.2 * s)}h${f(4.6 * s)}l${f(.5 * s)} ${f(3.2 * s)}Z`, '#4a443a', { w: .3 }) + P.line(`M${f(x - 1.6 * s)} ${f(top + .4 * s)}h${f(3.2 * s)}`, '#2a2622', .5 * s);
  d += P.line(`M${f(x + 2.4 * s * dir)} ${f(y - 15 * s)}l${f(1.6 * s * dir)} ${f(15 * s)}`, '#6a4a2a', .8 * s);
  return d;
}
function peasantWalkers(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, kinds = o.kinds ?? ['man', 'woman'], gap = 8.4 * s, W = (kinds.length - 1) * gap + 22 * s, H = 38 * s;
  const frame = (st) => flip(P, dir, W, kinds.map((k, i) => (k === 'man' ? peasantMan(P, 10 * s + i * gap, 36 * s, s, { dir: 1, stride: (st + i) % 2 }) : P.person(10 * s + i * gap, 36 * s, s * .96, 'peasant', { c: i % 2 ? '#f2ede0' : '#e8dccb', hat: i % 2 ? '#c8302a' : '#2f4a7a', dir: 1, stride: (st + i) % 2 }))).join(''));
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 * s };
}
/** An ox cart: two pale long-horned oxen under the yoke, a wagon of hay or melons, the driver walking beside with his goad. */
function oxCart(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 112 * s, H = 46 * s, S = (k) => f(k * s);
  const ox = (x, y, st, far) => {
    const c = far ? '#b9b2a2' : '#d9d3c4';
    let b = '';
    const leg = (lx, a, back) => `<path d="M${S(x + lx)} ${S(y + 6)}l${S(a)} ${S(9.5)}" stroke="${P.ink(back ? (far ? '#958f80' : '#aea898') : c)}" stroke-width="${S(2.8)}" stroke-linecap="round"/><path d="M${S(x + lx + a - 1.3)} ${S(y + 15.6)}h${S(2.8)}" stroke="${P.ink('#2a2622')}" stroke-width="${S(1.3)}"/>`;
    const sw = st ? 1.6 : -1.2;
    b += leg(-11, -sw, true) + leg(8, sw, true);
    b += `<path d="M${S(x - 16)} ${S(y - 1)}q${S(-3)} ${S(5)} ${S(-2)} ${S(11)}" fill="none" stroke="${P.ink(c)}" stroke-width="${S(.9)}"/><path d="M${S(x - 18.6)} ${S(y + 9)}l${S(.6)} ${S(2.4)}l${S(.8)} ${S(-2.2)}Z" fill="${P.ink('#5a5048')}"/>`;
    b += P.fill(`M${S(x - 16)} ${S(y + 1)}Q${S(x - 16)} ${S(y - 4)} ${S(x - 10)} ${S(y - 5)}L${S(x + 2)} ${S(y - 6)}Q${S(x + 7)} ${S(y - 9.5)} ${S(x + 10)} ${S(y - 6)}Q${S(x + 14)} ${S(y - 4)} ${S(x + 15)} ${S(y + 1)}Q${S(x + 14)} ${S(y + 9)} ${S(x + 8)} ${S(y + 10)}L${S(x - 10)} ${S(y + 10)}Q${S(x - 16)} ${S(y + 9)} ${S(x - 16)} ${S(y + 1)}Z`, c, { w: .5 });
    b += P.shade(`M${S(x - 14)} ${S(y + 7)}Q${S(x)} ${S(y + 11)} ${S(x + 10)} ${S(y + 8)}L${S(x + 8)} ${S(y + 10)}H${S(x - 10)}Z`, c, .18);
    b += P.fill(`M${S(x + 10)} ${S(y + 4)}Q${S(x + 13)} ${S(y + 13)} ${S(x + 16)} ${S(y + 5)}Z`, c, { w: .4 });
    b += P.fill(`M${S(x + 12)} ${S(y - 5)}L${S(x + 19)} ${S(y - 1.5)}Q${S(x + 23.5)} ${S(y + .5)} ${S(x + 22.5)} ${S(y + 5)}L${S(x + 19.5)} ${S(y + 6.2)}Q${S(x + 16)} ${S(y + 4)} ${S(x + 13.6)} ${S(y + 3)}Z`, c, { w: .5 }) + P.fill(`M${S(x + 21)} ${S(y + 1)}Q${S(x + 23.6)} ${S(y + 2)} ${S(x + 22.5)} ${S(y + 5)}L${S(x + 20)} ${S(y + 5.8)}Z`, '#6a625a', { w: .3 });
    b += `<circle cx="${S(x + 17.4)}" cy="${S(y)}" r="${S(.6)}" fill="${P.keyC()}"/>`;
    b += `<path d="M${S(x + 15.5)} ${S(y - 3)}q${S(-3.6)} ${S(-1.6)} ${S(-4.4)} ${S(-5.4)}q${S(-.2)} ${S(-1.6)} ${S(1.4)} ${S(-2.4)}M${S(x + 16.5)} ${S(y - 3)}q${S(4.4)} ${S(-1.4)} ${S(5)} ${S(-5.4)}q${S(.1)} ${S(-1.6)} ${S(-1.6)} ${S(-2.4)}" fill="none" stroke="${P.ink('#f1e8cc')}" stroke-width="${S(1.2)}" stroke-linecap="round"/>`;
    b += leg(-13, sw * .8, false) + leg(6, -sw * .8, false);
    return b;
  };
  const frame = (st) => {
    let b = '';
    // the wagon: a long box on spoked wheels, its load heaped
    b += P.fill(`M${S(2)} ${S(24)}H${S(40)}L${S(38)} ${S(31)}H${S(4)}Z`, '#8a6a46', { w: .5 });
    b += P.fill(`M${S(4)} ${S(24)}Q${S(10)} ${S(10)} ${S(21)} ${S(9)}Q${S(33)} ${S(10)} ${S(38)} ${S(24)}Z`, '#d6c06c', { w: .5 }) + P.line(`M${S(10)} ${S(20)}q${S(10)} ${S(-6)} ${S(22)} 0M${S(8)} ${S(16)}q${S(12)} ${S(-6)} ${S(24)} ${S(1)}`, '#b09a4a', .5);
    for (const wx of [10, 32]) b += `<circle cx="${S(wx)}" cy="${S(34)}" r="${S(6)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1.2)}"/><path d="M${S(wx - 6)} ${S(34)}h${S(12)}M${S(wx)} ${S(28)}v${S(12)}M${S(wx - 4.2)} ${S(29.8)}l${S(8.4)} ${S(8.4)}M${S(wx + 4.2)} ${S(29.8)}l${S(-8.4)} ${S(8.4)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.6)}"/>`;
    b += P.line(`M${S(40)} ${S(27)}L${S(62)} ${S(24)}`, '#5b4532', 1.4 * s);
    // the oxen, the far one first, under the yoke
    b += `<g transform="translate(${S(66)} ${S(41)}) scale(1.2) translate(${S(-66)} ${S(-41)})">${ox(64, 24, st, true) + ox(60, 26.5, (st + 1) % 2, false)}</g>` + P.line(`M${S(77)} ${S(17)}l${S(1)} ${S(9)}`, '#5b4532', 1.8 * s);
    // the driver walking at the oxen's heads with his goad
    b += peasantMan(P, 100 * s, 41 * s, s * .96, { dir: -1, stride: st }) + P.line(`M${S(97)} ${S(26)}L${S(84)} ${S(12)}`, '#6a4a2a', .8 * s);
    return flip(P, dir, W, b);
  };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 2.4, w: W, h: H, ax: W / 2, ay: 41 * s };
}
function basket(P, x, y) { return P.fill(`M${x - 5} ${y}h10l-1.4 6h-7.2Z`, '#a8844a', { w: .45 }) + P.line(`M${x - 4} ${y}q4 -6 8 0`, '#7a5a2a', .7) + `<circle cx="${x - 2}" cy="${y - .6}" r="1.4" fill="${P.ink('#4a3a7a')}"/><circle cx="${x + 1.4}" cy="${y - .8}" r="1.4" fill="${P.ink('#5a4a8a')}"/>`; }
/** The kafana's arbour on the right of the quay: a trellis on posts, heavy with vine leaves and grapes, tables under it. */
function kafana(P) {
  const { f } = P, lf = P.L.leaf, r = P.rng(5);
  let s = '';
  // its sign board over the arbour
  s += P.fill('M478 304H548V313H478Z', '#efe2c4', { w: .5 }) + `<text x="513" y="311.2" font-family="Georgia,'Times New Roman',serif" font-size="7" font-weight="bold" text-anchor="middle" letter-spacing="1" fill="${P.ink('#8a1a1a')}">КАФАНА</text>`;
  // posts and the trellis
  for (const x of [450, 494, 538, 576]) s += P.fill(P.rect(x - 1.4, 318, 2.8, 50), '#5b4532', { w: .4 });
  s += P.line('M444 318H580M444 321H580', '#5b4532', 1.4);
  let lat = '';
  for (let x = 446; x < 580; x += 8) lat += `M${x} 314l6 8`;
  s += P.line(lat, '#6b5442', .6);
  // the vine: a deep fringe of leaves along the trellis, bunches of grapes hanging under it
  if (lf.leaf) {
    for (let i = 0; i < 46; i++) { const x = 444 + r() * 136, y = 314 + r() * 10; s += `<path d="${P.blob(x, y, 4.4, 3.6, 6, i + 2)}" fill="${P.ink(r() < .55 ? lf.leaf : lf.dark)}" stroke="${P.keyC()}" stroke-width=".35"/>`; }
    for (let i = 0; i < 8; i++) { const x = 452 + r() * 120, y = 322 + r() * 8; s += `<path d="${P.blob(x, y, 3.6, 2.8, 6, i + 40)}" fill="${P.ink(lf.light)}" opacity=".9"/>`; }
    if (P.L.season !== 'spring') for (let i = 0; i < 7; i++) { const x = 458 + i * 18 + r() * 6, y = 326; for (let k = 0; k < 5; k++) s += `<circle cx="${f(x + (k % 2) * 1.6 - .8)}" cy="${f(y + k * 1.4)}" r="1.1" fill="${P.ink(P.L.season === 'autumn' ? '#3a2850' : '#5a3a6a')}"/>`; }
  } else s += P.line('M446 316q14 -4 28 0t28 0t28 0t28 0t24 0', '#6a5a4a', .9);
  // the tables, the guests: a peasant, a gentleman, an officer, the waiter in his apron
  for (const x of [470, 520]) s += P.fill(`M${x - 10} 352h20v-2h-20Z`, '#efe6d0', { w: .4 }) + P.line(`M${x} 352v12M${x - 6} 364h12`, '#3a2a1e', 1) + `<circle cx="${x - 4}" cy="349" r="1.2" fill="${P.ink('#f2efe6')}"/><path d="M${x + 3} 350v-3h2v3Z" fill="${P.ink('#c8b07a')}"/>`;
  s += peasantMan(P, 458, 364, 1, { dir: 1 }) + P.person(484, 364, 1, 'gent', { c: '#3a3f4a', dir: -1 }) + P.person(532, 366, 1.02, 'officer', { dir: -1 }) + P.person(508, 366, 1, 'worker', { c: '#f2efe6', dir: 1 });
  s += P.lamp(560, 368, 1, 'bracket', { h: 64 });
  return s;
}
/** A barge train: a tug towing two grain barges, Danube fashion. */
function barges(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 170 * s, H = 34 * s, S = (k) => f(k * s);
  let b = '';
  for (const bx of [0, 56]) {
    b += P.fill(`M${S(bx + 2)} ${S(22)}H${S(bx + 50)}L${S(bx + 47)} ${S(29)}H${S(bx + 5)}Z`, '#3a3029', { w: .5 }) + P.fill(`M${S(bx + 4)} ${S(22)}H${S(bx + 48)}V${S(19)}H${S(bx + 4)}Z`, '#6b5a44', { w: .4 });
    b += P.fill(`M${S(bx + 4)} ${S(19)}V${S(13)}H${S(bx + 11)}V${S(19)}Z`, '#e8dcc0', { w: .4 }) + `<path d="M${S(bx + 50)} ${S(21)}L${S(bx + 58)} ${S(21)}" stroke="${P.ink('#3a3026')}" stroke-width="${S(.5)}"/>`;
  }
  b += `<path d="M${S(106)} ${S(21)}Q${S(118)} ${S(25)} ${S(132)} ${S(20)}" fill="none" stroke="${P.ink('#3a3026')}" stroke-width="${S(.5)}"/>`;
  b += P.fill(`M${S(146)} ${S(22)}L${S(147)} ${S(5)}H${S(153)}L${S(154)} ${S(22)}Z`, '#1d1a17', { w: .5 }) + P.flat(P.rect(147 * s, 8 * s, 6 * s, 2 * s), '#c8102e');
  b += P.fill(`M${S(138)} ${S(23)}V${S(16)}H${S(160)}V${S(23)}Z`, '#ebe2cc', { w: .45 }) + P.fill(`M${S(130)} ${S(22)}H${S(168)}L${S(163)} ${S(29)}H${S(135)}Q${S(131)} ${S(27)} ${S(130)} ${S(22)}Z`, '#2a2622', { w: .5 });
  return { svg: svg(W, H, flip(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 28 * s, puffs: [[dir > 0 ? 150 * s : W - 150 * s, 5 * s, s, true, -dir]] };
}
/** An Austro-Hungarian river monitor: a low grey hull, the gun turret forward, one funnel, the war ensign. */
function monitor(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 110 * s, H = 40 * s, S = (k) => f(k * s);
  let b = '';
  b += `<path d="M${S(12)} ${S(28)}V${S(6)}" stroke="${P.ink('#3a3a38')}" stroke-width="${S(.8)}"/>`;
  b += `<g transform="translate(${S(12)} ${S(6)})">${[['#c8102e', 0], ['#f4f1e8', 1], ['#c8102e', 2]].map(([c, i]) => `<rect y="${f(i * 2.4 * s)}" width="${S(10)}" height="${f(2.5 * s)}" fill="${P.ink(c)}"/>`).join('')}<rect x="${S(3.6)}" y="${S(2)}" width="${S(2.8)}" height="${S(3.4)}" fill="${P.ink('#c8102e')}" stroke="${P.ink('#f4f1e8')}" stroke-width="${S(.4)}"/></g>`;
  b += P.fill(`M${S(50)} ${S(28)}L${S(51)} ${S(12)}H${S(58)}L${S(59)} ${S(28)}Z`, '#5a6066', { w: .5 }) + P.fill(P.rect(51 * s, 12 * s, 7 * s, 2 * s), '#2a2a2c', { k: false });
  b += P.fill(`M${S(30)} ${S(30)}V${S(22)}H${S(72)}V${S(30)}Z`, '#7a8288', { w: .5 }) + P.fill(`M${S(40)} ${S(22)}V${S(17)}H${S(48)}V${S(22)}Z`, '#7a8288', { w: .4 });
  b += P.fill(`M${S(78)} ${S(29)}Q${S(78)} ${S(20)} ${S(86)} ${S(20)}Q${S(94)} ${S(20)} ${S(94)} ${S(29)}Z`, '#6e767c', { w: .5 }) + P.line(`M${S(92)} ${S(24)}H${S(106)}M${S(92)} ${S(26.4)}H${S(105)}`, '#3a3e42', 1.1 * s);
  b += P.fill(`M${S(4)} ${S(29)}H${S(108)}L${S(102)} ${S(35)}H${S(10)}Q${S(5)} ${S(33)} ${S(4)} ${S(29)}Z`, '#5f676c', { w: .55 }) + `<path d="M${S(8)} ${S(33)}H${S(103)}" stroke="${P.ink('#3a3e42')}" stroke-width="${S(.8)}"/>`;
  b += `<path d="M${S(108)} ${S(34)}q${S(5)} ${S(1)} ${S(9)} ${S(4)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(.9)}" fill="none" opacity=".7"/>`;
  return { svg: svg(W, H, flip(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 33 * s, puffs: [[dir > 0 ? 54.5 * s : W - 54.5 * s, 11 * s, s * 1.1, true, -dir]] };
}
