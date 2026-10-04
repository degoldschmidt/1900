// Paris from the Quai Debilly, as from a first-floor balcony: across the Seine the Eiffel Tower in its yellow-brown
// paint with the tricolour at its head, the Grande Roue turning beyond, the gilt dome of the Invalides over the roofs
// of the Gros-Caillou. On our side the bouquinistes' green boxes along the parapet, plane trees, a Guimard entrance to
// the Métropolitain with its red buds, a Morris column of theatre bills, a painter at his easel; taxis and a fiacre
// on the quai, a bateau-mouche and a tug with a péniche on the river.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

export default {
  id: 'PAR',
  greet: 'SOUVENIR de PARIS',
  nation: 'FR',
  flag: 'FR',
  flower: 'lilac',
  flower2: 'violet',
  frame: { band: ['#93bead', '#4f6863'], gold: '#d9b660', ink: '#5a2a5e', leaf: ['#79a35f', '#3b6142'], year: '#6b3350', halo: '#f7ecd6' },
  horizon: 264,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#2a2622', stone: '#e4d7b5', stone2: '#c3b08a', wall: '#ebdfc3', wall2: '#ddc9a1', wall3: '#e6d5bd', roof: '#6e7a8b',
    tower: '#9c6c3f', water: '#6b8f86', ground: '#d6c8a7', walk: '#cfc4ad', iron: '#2d5240', glass: '#3a4757', sash: '#efe6d3',
    gold: '#d8aa3a', box: '#3f6b4d',
  },

  // a spray of lilac: a cone of four-petalled florets in three mauves over heart-shaped leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 18, 214, I.leaf[1], { shape: 'heart' }) + F.leaf(24, 17, 146, I.leaf[0], { shape: 'heart' }) + F.leaf(16, 11, 250, I.leaf[0], { shape: 'heart' });
    s += F.stem('M0 16Q1 6 0 -4', I.leaf[1], 1.4);
    const R = (seed) => { let a = seed; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };
    const r = R(7), cols = ['#9b6fc0', '#b892d6', '#8459a8', '#cbb0e4', '#a77fca'];
    const pts = [];
    for (let i = 0; i < 34; i++) { const t = i / 33, y = 12 - t * 34, half = 11 * Math.sin(Math.PI * (1 - t) * .62) * (1 - t * .35) + 2; pts.push([(r() * 2 - 1) * half, y + (r() - .5) * 3, cols[i % cols.length], r() * 90]); }
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y, c, a] of pts.reverse()) s += F.at(x, y, F.radial(4, 3.4, 3.2, c, { shape: 'round', k: .35 }) + '<circle r=".7" fill="#f4ecc8"/>', a);
    return s;
  },
  // sweet violets: two petals up, two to the sides, a broad lip below; a gold eye
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(18, 14, 205, I.leaf[1], { shape: 'heart' }) + F.leaf(16, 12, 150, I.leaf[0], { shape: 'heart' });
    s += F.at(0, 0, F.petal(11, 9, '#5b3c9e', 'round', { lite: '#8a6cc8' }), -22) + F.at(0, 0, F.petal(11, 9, '#5b3c9e', 'round', { lite: '#8a6cc8' }), 22);
    s += F.at(0, 0, F.petal(9.5, 8, '#6d4cb0', 'round'), -95) + F.at(0, 0, F.petal(9.5, 8, '#6d4cb0', 'round'), 95);
    s += F.at(0, 0, F.petal(11, 11, '#7656bb', 'heart', { vein: '#3a2470' }), 180);
    s += '<circle r="2.2" fill="#f1e7c9"/><circle r="1.1" fill="#e2b23a"/>';
    return s;
  },

  back(P, T) {
    let s = '';
    // the left bank beyond the river: the roofs of the Gros-Caillou, pale with distance
    s += P.far(.8, () => clotilde(P, 150, 258, .9));
    s += P.far(.78, () => P.row(26, 600, 266, { hMin: 12, hMax: 24, wMin: 14, wMax: 26, style: 'paris', seed: 31, walls: ['#d9cfbd', '#cfc3ad', '#e0d6c4'], roofC: '#8a93a2', placard: false, flagSpot: false, lit: 1.5 }));
    s += P.far(.7, () => invalides(P, 252, 262, 1.05));
    s += P.smoke(120, 246, .6) + P.smoke(392, 248, .55);
    // the Grande Roue: its pylons here, the wheel turns over them
    s += P.far(.62, () => roueStand(P, 356, 268, 40));
    s += P.far(.62, () => P.spin(roue(P, 40), { x: 356, y: 212, dur: 150, dir: 1 }));
    // the Eiffel Tower
    // the École Militaire at the far end of the Champ de Mars, framed by the tower's legs
    s += P.far(.72, () => ecole(P, 486, 262, .9));
    s += P.far(.34, () => eiffel(P, 486, 270, 188));
    // the Champ de Mars' chestnuts round the tower's feet
    s += P.far(.42, () => { let d = ''; for (const [x, k] of [[412, .8], [436, .95], [536, .9], [562, .75], [450, .7], [522, .7]]) d += P.tree(x, 268, k, 'round'); return d; });
    // the Quai Branly: its wall, a row of young trees, the river
    s += P.far(.55, () => {
      let d = P.fill(P.rect(20, 264, 562, 10), 'stone2', { w: .5 }) + P.lite(P.rect(20, 264, 562, 2), 'stone2', .3);
      for (let x = 30; x < 580; x += 18) d += P.line(`M${x} 266V274`, 'stone2', .4, { op: .5 });
      for (const x of [40, 74, 108, 144, 178, 300, 330, 412, 556, 580]) d += P.tree(x, 264, .46, 'round');
      d += P.crowd(150, 430, 264, 7, { s: .3, seed: 12 });
      return d;
    });
    s += P.water(274, 314, { seed: 6, shimmer: 8, x0: 160, x1: 560 });
    s += reflect(P, 466, 506, 275, 30, '#9c6c3f', 3) + reflect(P, 60, 440, 275, 12, '#d8ccb4', 8) + reflect(P, 236, 268, 275, 16, '#d8aa3a', 5);
    // on the river: the bateau-mouche, and a tug towing a péniche upstream
    s += P.cross(T.steamer({ s: .62, dir: -1, hull: '#2b3034', house: '#f1ead8', funnel: ['#2a2724', '#c8a24a'], paddle: false, flag: 'FR' }), { y: 304, dir: -1, dur: 64, rest: .3, offset: 12 });
    s += P.cross(convoy(P, 1, .78), { y: 293, dir: 1, dur: 150, rest: .2, offset: 60 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the river-side pavement and its parapet, the bouquinistes' boxes along the top
    s += P.flat(P.rect(20, 320, 562, 9), 'walk') + P.line('M20 329H582', '#8a8070', .7);
    s += P.fill(P.rect(20, 312, 562, 9), 'stone', { w: .6 }) + P.lite(P.rect(20, 312, 562, 2), 'stone', .35) + P.shade(P.rect(20, 318, 562, 3), 'stone', .15);
    for (let x = 34; x < 580; x += 22) s += P.line(`M${x} 314.5V320.5`, 'stone2', .45, { op: .6 });
    s += bouquinistes(P, [[166, 1], [193, 0], [220, 1], [247, 1], [392, 1], [419, 0], [446, 1]], 312);
    // the bouquiniste on his stool, the people who browse
    s += stool(P, 276, 327, .66) + P.person(206, 327, .66, 'boater', { c: '#2f3440' }) + P.person(232, 327, .64, 'lady', { c: '#c9d6e6' });
    s += P.person(406, 327, .65, 'gent', { c: '#2a2c30' }) + P.person(462, 327, .6, 'girl', { c: '#efe3c3' }) + P.person(474, 327, .66, 'lady', { c: '#e8b9b3', parasol: '#f3eee2' });
    s += P.crowd(500, 570, 327, 3, { s: .64, seed: 19 }) + P.crowd(300, 372, 327, 3, { s: .64, seed: 23 });
    for (const x of [336, 512]) s += P.lamp(x, 314, .64, 'single') + P.flagAt(x + 1, 288);
    // plane trees on the left, the quai's road, our pavement
    s += P.tree(40, 329, 2.3, 'plane') + P.tree(146, 329, 1.6, 'plane');
    s += P.paving(329, 354, { vx: 300, seed: 7 });
    s += P.flat(P.rect(20, 355, 562, 26), 'walk') + P.fill(P.rect(20, 353, 562, 3), 'stone2', { w: .5 });
    for (let k = 0; k < 4; k++) s += P.line(`M20 ${361 + k * 4 + k * k}H582`, '#9a8f7a', .4, { op: .45 });
    if (P.L.snow) s += P.flat(P.rect(20, 355, 562, 26), '#f2f5f8', { op: .7 });
    if (P.L.wet) s += P.flat(P.ellipse(220, 366, 40, 2.4), P.L.sky.low, { op: .35, raw: 1 }) + P.flat(P.ellipse(410, 372, 30, 2), P.L.sky.low, { op: .3, raw: 1 });
    // the traffic of the quai: taxis, the autobus, a fiacre; at war, soldiers
    s += P.setStreet(347, 20, 580, .9);
    s += P.cross(taxi(P, 1, .9, '#8a2e26'), { y: 350, dir: 1, dur: 20, rest: .5, offset: 3 });
    s += P.cross(taxi(P, -1, .86, '#26323e'), { y: 343, dir: -1, dur: 24, rest: .55, offset: 13 });
    s += P.cross(autobus(P, -1, .92), { y: 343, dir: -1, dur: 34, rest: .45, offset: 27 });
    s += P.cross(T.fiacre({ s: .76, horses: 1, body: '#262a2c', hood: '#2f2b28', dir: 1 }), { y: 349, dir: 1, dur: 46, rest: .3, offset: 34 });
    s += P.cross(T.cart({ s: .82, load: '#d9c48a', horse: '#8a6a4a', c: '#6a4a32', dir: -1 }), { y: 345, dir: -1, dur: 60, rest: .4, offset: 50 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady'], s: .66, dir: 1, seed: 8 }), { y: 328, dir: 1, dur: 120, offset: 44, z: 'street' });
    return s;
  },

  front(P, T) {
    let s = '';
    s += metro(P, 62, 370, 1.12);
    s += morris(P, 408, 371, 1.05);
    s += P.lamp(236, 368, 1.14, 'single', { h: 80 }) + P.flagAt(238, 300);
    // a sergent de ville, a flower girl, a lady and her little boy, a painter at his easel before the tower
    s += agent(P, 196, 372, 1.14);
    s += P.person(268, 370, 1.06, 'peasant', { c: '#7a5a8a', hat: '#e8dcc6' }) + flowerBasket(P, 274, 360, 1.06);
    s += P.person(356, 368, 1.14, 'lady', { c: '#f1ebdc', parasol: '#e8b9c4', dir: -1 }) + P.person(369, 369, .9, 'child', { c: '#2f4a6e', dir: -1 });
    s += painter(P, 470, 404, 1.02);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.14, dir: -1, seed: 15, dresses: ['#d9c6e6', '#f3eee2'] }), { y: 374, dir: -1, dur: 80, offset: 20, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['boater', 'girl'], s: 1.12, dir: 1, seed: 21 }), { y: 378, dir: 1, dur: 90, offset: 60, z: 'fore' });
    return s;
  },
};

// ---------- the Eiffel Tower ----------
/** The tower in elevation: four legs curving up from the great arch, three platforms, the campanile and the flag. */
function eiffel(P, cx, by, H) {
  const { f } = P;
  const at = (tab, z) => { for (let i = 1; i < tab.length; i++) if (z <= tab[i][0]) { const [z0, a] = tab[i - 1], [z1, b] = tab[i]; return a + (b - a) * (z - z0) / (z1 - z0); } return tab.at(-1)[1]; };
  const OUT = [[0, .212], [.05, .178], [.1, .152], [.19, .118], [.28, .094], [.386, .07], [.5, .054], [.62, .044], [.76, .036], [.92, .028]];
  const IN = [[0, .118], [.08, .094], [.19, .06], [.29, .043], [.386, .028], [.47, .012], [.54, 0]];
  const X = (z, side, inner) => cx + side * (inner ? at(IN, z) : at(OUT, z)) * H, Y = (z) => by - z * H;
  const c = 'tower';
  let s = '';
  // legs: outer and inner edges, from the ground to where they meet above the second platform
  const leg = (side) => {
    const pts = [];
    for (let i = 0; i <= 18; i++) { const z = .54 * i / 18; pts.push([X(z, side, false), Y(z)]); }
    for (let i = 18; i >= 0; i--) { const z = .54 * i / 18; pts.push([X(z, side, true), Y(z)]); }
    return P.poly(pts);
  };
  const shaft = () => { const pts = []; for (let i = 0; i <= 10; i++) { const z = .5 + .43 * i / 10; pts.push([X(z, -1), Y(z)]); } for (let i = 10; i >= 0; i--) { const z = .5 + .43 * i / 10; pts.push([X(z, 1), Y(z)]); } return P.poly(pts); };
  // the great arch between the legs
  const arch = (r0, r1) => `M${f(X(.025, -1, true))} ${f(Y(.025))}C${f(X(.025, -1, true) + H * .02)} ${f(Y(r0))} ${f(cx - H * .05)} ${f(Y(r1))} ${f(cx)} ${f(Y(r1))}C${f(cx + H * .05)} ${f(Y(r1))} ${f(X(.025, 1, true) - H * .02)} ${f(Y(r0))} ${f(X(.025, 1, true))} ${f(Y(.025))}`;
  const archBand = `${arch(.13, .17)}L${f(X(.03, 1, true) - 1.6)} ${f(Y(.03))}C${f(X(.03, 1, true) - H * .022)} ${f(Y(.115))} ${f(cx + H * .05)} ${f(Y(.152))} ${f(cx)} ${f(Y(.152))}C${f(cx - H * .05)} ${f(Y(.152))} ${f(X(.03, -1, true) + H * .022)} ${f(Y(.115))} ${f(X(.03, -1, true) + 1.6)} ${f(Y(.03))}Z`;
  s += P.fill(archBand, c, { w: .6 });
  for (let i = 1; i < 14; i++) { const t = i / 14, a = Math.PI * t, x = cx - Math.cos(a) * (X(.03, 1, true) - cx - 1), y = Y(.03 + Math.sin(a) * .13); s += P.line(`M${f(x)} ${f(y)}l${f(Math.cos(a) * -1.2)} ${f(-2.4)}`, P.light(c, .35), .5, { op: .6 }); }
  // the legs, lit on the left, in shadow on the right
  for (const side of [-1, 1]) {
    const d = leg(side);
    s += P.fill(d, c, { w: .7 });
    if (side > 0) s += P.shade(d, c, .28);
    else s += P.shade(`M${f(X(0, -1, true))} ${f(Y(0))}` + Array.from({ length: 10 }, (_, i) => `L${f((X(.54 * i / 9, -1, true) * 2 + X(.54 * i / 9, -1)) / 3)} ${f(Y(.54 * i / 9))}`).join('') + `L${f(X(.54, -1, true))} ${f(Y(.54))}Z`, c, .14);
    // lattice: zigzags between the edges, and the corner posts
    let z = .012, flipT = 0, lat = `M${f(X(z, side))} ${f(Y(z))}`;
    while (z < .53) { const dz = z < .19 ? .022 : z < .386 ? .028 : .03; z = Math.min(.53, z + dz); flipT ^= 1; lat += `L${f(X(z, side, !!flipT))} ${f(Y(z))}`; }
    s += `<path d="${lat}" fill="none" stroke="${P.light(c, .3)}" stroke-width=".55" opacity=".85"/>`;
    s += P.line(Array.from({ length: 12 }, (_, i) => { const z = .53 * i / 11; return `${i ? 'L' : 'M'}${f((X(z, side) + X(z, side, true)) / 2)} ${f(Y(z))}`; }).join(''), P.dark(c, .35), .45, { op: .7 });
  }
  // the shaft above the second platform
  s += P.fill(shaft(), c, { w: .6 }) + P.shade(`M${f(cx)} ${f(Y(.5))}` + Array.from({ length: 6 }, (_, i) => { const z = .5 + .43 * i / 5; return `L${f(X(z, 1))} ${f(Y(z))}`; }).join('') + `L${f(cx)} ${f(Y(.93))}Z`, c, .26);
  let lat = '';
  for (let z = .54; z < .9; z += .032) lat += `M${f(X(z, -1))} ${f(Y(z))}L${f(X(z + .032, 1))} ${f(Y(z + .032))}M${f(X(z, 1))} ${f(Y(z))}L${f(X(z + .032, -1))} ${f(Y(z + .032))}`;
  s += `<path d="${lat}" fill="none" stroke="${P.light(c, .3)}" stroke-width=".45" opacity=".8"/>`;
  s += P.line(`M${f(cx)} ${f(Y(.36))}V${f(Y(.6))}`, P.light(c, .4), .5, { op: .5 });
  // first platform: its frieze of little arches, the pavilions on it
  const p1 = (z0, z1, hw) => P.rect(cx - hw * H, Y(z1), hw * 2 * H, (z1 - z0) * H);
  for (const k of [-.085, -.03, .03, .085]) s += P.fill(P.rect(cx + k * H - 4, Y(.243), 8, H * .03), 'wall', { w: .4 }) + P.fill(P.dome(cx + k * H, Y(.243), 4.4, 3), 'roof', { w: .35 });
  s += P.fill(p1(.18, .214, .128), c, { w: .65 }) + P.shade(P.rect(cx, Y(.214), .128 * H, .034 * H), c, .22);
  let fr = '';
  for (let x = cx - .128 * H + 1.5; x < cx + .128 * H - 1; x += 3.4) fr += `M${f(x)} ${f(Y(.18))}q1.7 -2.6 3.4 0`;
  s += `<path d="${fr}" fill="none" stroke="${P.dark(c, .4)}" stroke-width=".55"/>` + P.line(`M${f(cx - .128 * H)} ${f(Y(.203))}H${f(cx + .128 * H)}`, P.light(c, .35), .6);
  // second platform and its cabin
  s += P.fill(p1(.378, .398, .074), c, { w: .55 }) + P.fill(p1(.398, .42, .042), 'wall2', { w: .45 }) + P.windows(cx - .04 * H, Y(.418), .08 * H, .016 * H, 6, 1, { ww: .5, wh: .7, plain: true });
  s += P.line(`M${f(cx - .074 * H)} ${f(Y(.386))}H${f(cx + .074 * H)}`, P.light(c, .35), .5);
  // the top: the third platform, its glazed gallery, the campanile, the flag
  s += P.fill(p1(.905, .925, .036), c, { w: .5 }) + P.fill(p1(.925, .948, .03), 'wall2', { w: .45 }) + P.windows(cx - .028 * H, Y(.946), .056 * H, .018 * H, 4, 1, { ww: .5, wh: .7, plain: true });
  s += P.fill(p1(.948, .956, .034), c, { w: .4 }) + P.fill(p1(.956, .982, .016), c, { w: .4 }) + P.fill(P.dome(cx, Y(.982), .017 * H, .016 * H), c, { w: .4 });
  if (P.L.lamps > .05) { s += `<circle cx="${cx}" cy="${f(Y(.97))}" r="2.2" fill="${P.glow('#fff1c0')}"/>`; P.glows.push({ x: cx, y: Y(.97), r: 16, depth: P.depth }); }
  s += P.flag(cx, Y(1.0), .62, 'FR', { h: 22 });
  return s;
}

/** The Grande Roue of 1900: its rims, its spokes, its cars; it turns (a sprite for P.spin). */
function roue(P, r) {
  const W = r * 2 + 10, c = W / 2, f = P.f;
  let b = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${P.ink('#5c4a3e')}" stroke-width="1.7"/><circle cx="${c}" cy="${c}" r="${f(r * .9)}" fill="none" stroke="${P.ink('#5c4a3e')}" stroke-width=".9"/>`;
  let sp = '', lat = '';
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    if (i % 2 === 0) sp += `M${f(c + ca * 2.5)} ${f(c + sa * 2.5)}L${f(c + ca * r * .9)} ${f(c + sa * r * .9)}`;
    lat += `M${f(c + ca * r * .9)} ${f(c + sa * r * .9)}L${f(c + Math.cos(a + .08) * r)} ${f(c + Math.sin(a + .08) * r)}`;
  }
  b += `<path d="${sp}" stroke="${P.ink('#6e5a4c')}" stroke-width=".4" fill="none"/><path d="${lat}" stroke="${P.ink('#5c4a3e')}" stroke-width=".5" fill="none"/>`;
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; b += `<rect x="${f(c + Math.cos(a) * (r + 2.2) - 1.6)}" y="${f(c + Math.sin(a) * (r + 2.2) - 1.3)}" width="3.2" height="2.6" rx=".8" fill="${P.ink(i % 2 ? '#7a3a2e' : '#e8dcc0')}" stroke="${P.keyC()}" stroke-width=".3"/>`; }
  b += `<circle cx="${c}" cy="${c}" r="2.6" fill="${P.ink('#4a3a30')}"/>`;
  return { svg: doc(W, W, b), w: W, h: W, ax: c, ay: c };
}
/** The pylons that carry the wheel's axle. */
function roueStand(P, cx, by, r) {
  const f = P.f, hy = by - 56;
  let d = '';
  for (const k of [-1, 1]) {
    d += P.line(`M${f(cx + k * r * .62)} ${by}L${f(cx + k * 3)} ${f(hy)}M${f(cx + k * r * .42)} ${by}L${f(cx + k * 2)} ${f(hy + 4)}`, '#5c4a3e', 1.2);
    for (let i = 1; i < 8; i++) { const t = i / 8; d += P.line(`M${f(cx + k * (r * .62 * (1 - t) + 3 * t))} ${f(by - (by - hy) * t)}L${f(cx + k * (r * .42 * (1 - t + .1) + 2 * t))} ${f(by - (by - hy) * (t + .07))}`, '#5c4a3e', .4); }
  }
  return d;
}

/** The École Militaire: its long front and the square dome over the pediment. */
function ecole(P, cx, by, s) {
  const f = P.f;
  let d = P.fill(P.rect(cx - 46 * s, by - 14 * s, 92 * s, 14 * s), 'wall', { w: .35 }) + P.windows(cx - 44 * s, by - 12 * s, 88 * s, 10 * s, 14, 1, { ww: .4, lit: .5 });
  d += P.fill(P.rect(cx - 12 * s, by - 22 * s, 24 * s, 22 * s), 'wall', { w: .4 }) + P.fill(P.gable(cx - 13 * s, by - 22 * s, 26 * s, 6 * s), 'wall', { w: .35 });
  d += P.fill(P.dome(cx, by - 26 * s, 9 * s, 9 * s), 'roof', { w: .4 }) + P.line(`M${cx} ${f(by - 38 * s)}v${f(-4 * s)}`, 'roof', .8);
  return d;
}

/** Sainte-Clotilde's two spires over the roofs. */
function clotilde(P, cx, by, s) {
  let d = P.fill(P.rect(cx - 16 * s, by - 26 * s, 32 * s, 26 * s), 'wall', { w: .4 }) + P.fill(P.gable(cx - 9 * s, by - 26 * s, 18 * s, 10 * s), 'wall', { w: .4 });
  for (const k of [-1, 1]) {
    const x = cx + k * 12 * s;
    d += P.fill(P.rect(x - 4 * s, by - 46 * s, 8 * s, 46 * s), 'wall', { w: .4 }) + P.fill(P.spire(x, by - 46 * s, 8.4 * s, 26 * s), '#8a93a2', { w: .35 });
    d += P.fill(P.gothic(x - 1.6 * s, by - 42 * s, 3.2 * s, 9 * s), 'glass', { w: .2 });
  }
  return d;
}

/** The dome of the Invalides over its drum of columns, gilded ribs, the lantern and its spire. */
function invalides(P, cx, by, s) {
  const f = P.f;
  let d = P.fill(P.rect(cx - 30 * s, by - 20 * s, 60 * s, 20 * s), 'wall', { w: .5 }) + P.windows(cx - 28 * s, by - 18 * s, 56 * s, 14 * s, 8, 1, { arched: true, ww: .4, lit: .4 });
  d += P.fill(P.rect(cx - 13 * s, by - 34 * s, 26 * s, 15 * s), 'wall', { w: .5 }) + P.shade(P.rect(cx + 6 * s, by - 34 * s, 7 * s, 15 * s), 'wall', .2);
  for (let i = 0; i < 7; i++) d += P.line(`M${f(cx - 11 * s + i * 3.7 * s)} ${f(by - 33 * s)}v${f(13 * s)}`, 'stone2', .6);
  d += P.fill(P.rect(cx - 14.5 * s, by - 36 * s, 29 * s, 2.6 * s), 'stone2', { w: .4 });
  d += P.fill(P.dome(cx, by - 36 * s, 12.5 * s, 13 * s), 'gold', { w: .6 }) + P.shade(`M${f(cx + 3 * s)} ${f(by - 36 * s)}C${f(cx + 6 * s)} ${f(by - 50 * s)} ${f(cx + 10 * s)} ${f(by - 50 * s)} ${f(cx + 12.5 * s)} ${f(by - 36 * s)}Z`, 'gold', .25);
  for (const k of [-.6, -.25, .1, .45]) d += P.line(`M${f(cx + k * 12.5 * s)} ${f(by - 36 * s)}Q${f(cx + k * 9 * s)} ${f(by - 47 * s)} ${f(cx)} ${f(by - 53 * s)}`, '#8a6a22', .4, { op: .7 });
  d += P.fill(P.rect(cx - 2.4 * s, by - 59 * s, 4.8 * s, 6 * s), 'gold', { w: .4 }) + P.fill(P.spire(cx, by - 59 * s, 3.6 * s, 11 * s), 'gold', { w: .35 });
  return d;
}

/** Broken strokes of colour under something, its reflection in the river. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.4) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 3 + r() * 12 * (1 - k * .6); if (r() < .75 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.5" opacity=".5" stroke-linecap="round"/>`;
}

// ---------- on the river ----------
/** A tug with a péniche in tow: black hulls, a red band, the bargee's cabin with its geraniums. */
function convoy(P, dir, s) {
  const W = 132 * s, H = 30 * s, S = (k) => P.f(k * s), f = P.f;
  let b = '';
  // the tug
  b += P.fill(`M${S(98)} ${S(22)}L${S(99)} ${S(8)}H${S(105)}L${S(106)} ${S(22)}Z`, '#2a2622', { w: .5 }) + P.flat(`M${S(99)} ${S(10)}H${S(105)}V${S(12)}H${S(99)}Z`, '#c8a24a');
  b += P.fill(`M${S(92)} ${S(24)}V${S(17)}H${S(112)}V${S(24)}Z`, '#e7dcc4', { w: .45 }) + `<rect x="${S(107)}" y="${S(18.4)}" width="${S(3.4)}" height="${S(2.6)}" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3a4656')}"/>`;
  b += P.fill(`M${S(86)} ${S(23)}H${S(128)}L${S(124)} ${S(29)}H${S(90)}Q${S(87)} ${S(27)} ${S(86)} ${S(23)}Z`, '#2b2725', { w: .5 }) + P.line(`M${S(88)} ${S(26.5)}H${S(125)}`, '#a8382e', .8 * s);
  // the tow line, the péniche
  b += P.line(`M${S(87)} ${S(23)}Q${S(80)} ${S(25)} ${S(70)} ${S(23)}`, '#4a3a2a', .5 * s);
  b += P.fill(`M${S(4)} ${S(21)}H${S(72)}L${S(70)} ${S(28)}H${S(7)}Q${S(4)} ${S(26)} ${S(4)} ${S(21)}Z`, '#26292c', { w: .5 }) + P.line(`M${S(6)} ${S(23)}H${S(70)}`, '#e8dcc0', .7 * s) + P.line(`M${S(6)} ${S(25)}H${S(70)}`, '#b0402e', .6 * s);
  b += P.fill(`M${S(14)} ${S(21)}V${S(18)}H${S(62)}V${S(21)}Z`, '#8a6a46', { w: .4 });
  b += P.fill(`M${S(6)} ${S(21)}V${S(13)}H${S(17)}V${S(21)}Z`, '#e2d2b0', { w: .45 }) + P.fill(`M${S(5)} ${S(13.5)}L${S(11.5)} ${S(10)}L${S(18)} ${S(13.5)}Z`, '#7a3a2a', { w: .4 }) + `<rect x="${S(8)}" y="${S(15)}" width="${S(3)}" height="${S(2.6)}" fill="${P.L.windows > .2 ? P.glow('#ffc96b') : P.ink('#3a4656')}"/>`;
  b += `<circle cx="${S(13.5)}" cy="${S(13)}" r="${S(1)}" fill="${P.ink('#c8463a')}"/><circle cx="${S(15)}" cy="${S(12.8)}" r="${S(.9)}" fill="${P.ink('#d8565a')}"/>`;
  b += P.line(`M${S(3)} ${S(17)}L${S(7)} ${S(21)}`, '#4a3a2a', .8 * s);
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 27 * s, puffs: [[dir > 0 ? 102 * s : W - 102 * s, 8 * s, s * .9, true, -dir]] };
}

// ---------- the quai ----------
/** The bouquinistes' boxes on the parapet: dark green, some shut, some open on prints and old books. */
function bouquinistes(P, boxes, y) {
  const f = P.f, R = P.rng(17);
  let d = '';
  for (const [x, open] of boxes) {
    const w = 25, h = 7;
    d += P.fill(P.rect(x, y - h, w, h), 'box', { w: .6 }) + P.shade(P.rect(x, y - 2.4, w, 2.4), 'box', .25);
    if (open) {
      // the lid raised and leaning back, prints pinned inside it; books in the box
      d += P.fill(`M${x} ${y - h}L${x + 2} ${y - h - 11}H${x + w + 2}L${x + w} ${y - h}Z`, 'box', { w: .55 });
      for (let i = 0; i < 4; i++) d += P.fill(P.rect(x + 2.6 + i * 5.8, y - h - 9.4, 4.4, 5.6), ['#e8dcc0', '#c96a4a', '#e2c26a', '#9ab0c8'][(i + x) % 4], { w: .3 });
      for (let i = 0; i < 9; i++) d += P.flat(P.rect(x + 1.4 + i * 2.6, y - h - 1.8 - R() * 1.4, 2, 2.8), ['#7a3a2a', '#c8b48a', '#3a4a6a', '#8a6a3a', '#5a2a3a'][Math.floor(R() * 5)]);
    } else {
      d += P.fill(`M${x - .6} ${y - h}L${x + 2} ${y - h - 2.4}H${x + w - 2}L${x + w + .6} ${y - h}Z`, 'box', { w: .5 }) + P.lite(P.rect(x + 2, y - h - 2.2, w - 4, .9), 'box', .3);
    }
    if (P.L.snow) d += P.flat(P.rect(x + 1, y - h - (open ? 12 : 3), w, 1.6), '#f4f7fa', { op: .9 });
  }
  return d;
}

/** A Guimard entrance to the Métropolitain: the green balustrade, two stems curling over, the red buds, the sign. */
function metro(P, x, by, s) {
  const f = P.f, S = (k) => f(k * s), c = 'iron';
  let d = '';
  // the stair's balustrade, seen from the side: a run of cast panels with their shields
  const bw = 96 * s, bh = 18 * s, bt = by - bh;
  d += P.fill(P.rect(x, bt, bw, bh), c, { w: .7 });
  for (let i = 0; i < 6; i++) {
    const px = x + 3 * s + i * 15.4 * s;
    d += `<path d="M${f(px)} ${f(bt + 3 * s)}h${S(13)}v${S(9)}q${S(-6.5)} ${S(6)} ${S(-13)} 0Z" fill="${P.light(c, .25)}" stroke="${P.dark(c, .3)}" stroke-width=".5"/>`;
    d += `<path d="M${f(px + 6.5 * s)} ${f(bt + 5 * s)}c${S(-4)} ${S(3)} ${S(-2)} ${S(7)} 0 ${S(9)}c${S(2)} ${S(-2)} ${S(4)} ${S(-6)} 0 ${S(-9)}Z" fill="${P.ink('#d8aa3a')}" opacity=".8"/>`;
  }
  d += P.fill(P.rect(x - 1, bt - 2.4 * s, bw + 2, 2.6 * s), c, { w: .5 });
  // the two lamp standards, swelling like stems, curling over at the top
  const stem = (sx, k) => {
    const top = by - 104 * s;
    let e = P.fill(`M${f(sx - 3 * s)} ${by}C${f(sx - 2 * s)} ${f(by - 30 * s)} ${f(sx - 1.4 * s)} ${f(by - 70 * s)} ${f(sx - 1.6 * s)} ${f(top + 12 * s)}C${f(sx - 1.8 * s)} ${f(top)} ${f(sx + k * 8 * s)} ${f(top - 6 * s)} ${f(sx + k * 14 * s)} ${f(top + 2 * s)}L${f(sx + k * 13 * s)} ${f(top + 4 * s)}C${f(sx + k * 8 * s)} ${f(top - 2 * s)} ${f(sx + 1.6 * s)} ${f(top + 2 * s)} ${f(sx + 1.6 * s)} ${f(top + 12 * s)}C${f(sx + 1.4 * s)} ${f(by - 70 * s)} ${f(sx + 2 * s)} ${f(by - 30 * s)} ${f(sx + 3 * s)} ${by}Z`, c, { w: .6 });
    e += P.lite(`M${f(sx - 2.4 * s)} ${by}C${f(sx - 1.6 * s)} ${f(by - 30 * s)} ${f(sx - 1 * s)} ${f(by - 70 * s)} ${f(sx - 1.1 * s)} ${f(top + 14 * s)}L${f(sx - .2 * s)} ${f(top + 14 * s)}C${f(sx - .2 * s)} ${f(by - 70 * s)} ${f(sx)} ${f(by - 30 * s)} ${f(sx)} ${by}Z`, c, .3, { op: .7 });
    // the bud, hanging from the curl
    const bx = sx + k * 13.5 * s, byy = top + 4 * s, on = P.L.lamps > .05;
    const bud = `M${f(bx - 3.4 * s)} ${f(byy + 2 * s)}C${f(bx - 4 * s)} ${f(byy + 9 * s)} ${f(bx - 1 * s)} ${f(byy + 12 * s)} ${f(bx)} ${f(byy + 12.5 * s)}C${f(bx + 1 * s)} ${f(byy + 12 * s)} ${f(bx + 4 * s)} ${f(byy + 9 * s)} ${f(bx + 3.4 * s)} ${f(byy + 2 * s)}Z`;
    e += on ? `<path d="${bud}" fill="${P.glow('#ff9a4a')}" stroke="${P.keyC()}" stroke-width=".55"/>` : P.fill(bud, '#c8462e', { w: .55 });
    e += on ? `<path d="M${f(bx - 1.6 * s)} ${f(byy + 4 * s)}q${S(1.6)} ${S(7)} ${S(3.2)} 0Z" fill="${P.glow('#ffe0a0')}"/>` : P.line(`M${f(bx - 1.6 * s)} ${f(byy + 4.4 * s)}q${S(.4)} ${S(4)} ${S(1.4)} ${S(5.6)}`, '#f2a080', .7);
    e += P.fill(P.rect(bx - 2.6 * s, byy + .5 * s, 5.2 * s, 2.2 * s), c, { w: .4 });
    P.glows.push({ x: bx, y: byy + 8 * s, r: 26 * s, depth: P.depth });
    return e;
  };
  const sx0 = x + 6 * s, sx1 = x + bw - 6 * s;
  d += stem(sx0, 1) + stem(sx1, -1);
  // the sign between the stems: METROPOLITAIN in green on cream, in its iron frame
  const sy = by - 86 * s, sw = sx1 - sx0 - 10 * s;
  d += P.fill(P.rect(sx0 + 5 * s, sy, sw, 9 * s), c, { w: .55 }) + P.fill(P.rect(sx0 + 6.4 * s, sy + 1.4 * s, sw - 2.8 * s, 6.2 * s), '#ece0b8', { w: .3 });
  d += `<text x="${f(sx0 + 5 * s + sw / 2)}" y="${f(sy + 6.4 * s)}" font-family="Georgia,'Times New Roman',serif" font-size="${S(5.4)}" text-anchor="middle" fill="${P.ink('#2d5240')}" textLength="${f(sw - 7 * s)}" lengthAdjust="spacingAndGlyphs" font-weight="bold">METROPOLITAIN</text>`;
  d += P.line(`M${f(sx0 + 1.6 * s)} ${f(sy + 4.5 * s)}h${S(3.4)}M${f(sx1 - 1.6 * s)} ${f(sy + 4.5 * s)}h${S(-3.4)}`, c, 1.4 * s);
  return d;
}

/** A Morris column: green drum and dome, theatre bills round it; the crisis pastes its own over them. */
function morris(P, x, by, s) {
  const f = P.f, S = (k) => f(k * s), c = 'iron', r = 12.5 * s, top = by - 76 * s;
  let d = P.fill(P.rect(x - r - 1.5 * s, by - 7 * s, 2 * r + 3 * s, 7 * s), c, { w: .6 }) + P.lite(P.rect(x - r - 1.5 * s, by - 7 * s, 2 * r + 3 * s, 1.4 * s), c, .3);
  d += P.fill(P.rect(x - r, top + 12 * s, 2 * r, by - 7 * s - top - 12 * s), '#ece2c8', { w: .6 });
  // the bills: a play, an opera, a café-concert, a soap; their type in lines
  const bills = [[x - r + .6, top + 13.5 * s, 11 * s, 22 * s, '#d8b44a', '#2a2622', 'OPÉRA'], [x + .8, top + 13.5 * s, r - 1.4, 14 * s, '#c8463a', '#f6ecd0', 'BAL'], [x + .8, top + 28.5 * s, r - 1.4, 12 * s, '#efe6d2', '#2f3a5a', ''], [x - r + .6, top + 36.5 * s, 13.4 * s, 13 * s, '#3d6a9a', '#f6ecd0', 'CIRQUE'], [x + 3 * s, top + 41.5 * s, r - 3.6 * s, 19 * s, '#e8a24a', '#2a2622', ''], [x - r + .6, top + 50.5 * s, 13.4 * s, 13 * s, '#efe6d2', '#8a2a2a', 'SAVON']];
  for (const [bx, byy, w, h, bg, fg, t] of bills) {
    d += P.fill(P.rect(bx, byy, w, h), bg, { w: .35 });
    if (t) d += `<text x="${f(bx + w / 2)}" y="${f(byy + 4.4 * s)}" font-family="Georgia,serif" font-weight="bold" font-size="${S(3.8)}" text-anchor="middle" fill="${P.ink(fg)}" textLength="${f(w * .8)}" lengthAdjust="spacingAndGlyphs">${t}</text>`;
    for (let i = 0; i < Math.floor(h / (3.6 * s)) - 1; i++) d += P.line(`M${f(bx + 1.4)} ${f(byy + (t ? 7.6 : 3) * s + i * 3 * s)}h${f(w * (i % 3 === 2 ? .45 : .75))}`, fg, .55 * s, { op: .75 });
  }
  d += P.shade(P.rect(x + r * .4, top + 12 * s, r * .6, by - 7 * s - top - 12 * s), '#ece2c8', .3, { op: .5 });
  d += P.wall(x - r + 2, top + 22 * s, 2 * r - 6, 28 * s);
  // the cornice, the dome of fish-scale zinc, the finial
  d += P.fill(P.rect(x - r - 2.4 * s, top + 8 * s, 2 * r + 4.8 * s, 4.6 * s), c, { w: .55 }) + P.line(`M${f(x - r - 1.6 * s)} ${f(top + 10.2 * s)}h${f(2 * r + 3.2 * s)}`, '#c8a24a', .6);
  d += P.fill(P.dome(x, top + 8 * s, r * .96, 9 * s), c, { w: .55 }) + P.shade(`M${f(x + r * .25)} ${f(top + 8 * s)}C${f(x + r * .45)} ${f(top - 2 * s)} ${f(x + r * .85)} ${f(top)} ${f(x + r * .96)} ${f(top + 8 * s)}Z`, c, .3);
  for (const yy of [top + 5.4 * s, top + 2.4 * s]) d += P.line(`M${f(x - r * .72)} ${f(yy)}Q${f(x)} ${f(yy - 1.6 * s)} ${f(x + r * .72)} ${f(yy)}`, P.light(c, .25), .5, { dash: '1.4 1' });
  d += P.line(`M${x} ${f(top - 3 * s)}v${S(-6)}`, c, 1.2 * s) + `<circle cx="${x}" cy="${f(top - 9.6 * s)}" r="${S(1.5)}" fill="${P.ink('#c8a24a')}"/>`;
  if (P.L.snow) d += P.flat(P.dome(x, top + 7 * s, r * .92, 8 * s), '#f4f7fa', { op: .85 });
  return d;
}

/** A sergent de ville: dark blue cape and kepi. */
function agent(P, x, by, s) {
  const f = P.f;
  let d = P.person(x, by, s, 'gent', { c: '#1f2a44', legs: '#1f2a44', hat: '#1f2a44' });
  d += `<path d="M${f(x - 4.4 * s)} ${f(by - 12 * s)}L${f(x - 2.8 * s)} ${f(by - 24 * s)}H${f(x + 2.8 * s)}L${f(x + 4.4 * s)} ${f(by - 12 * s)}Z" fill="${P.ink('#1c2640')}" stroke="${P.keyC()}" stroke-width=".55"/>`;
  d += `<path d="M${f(x - 2.4 * s)} ${f(by - 26.6 * s)}v${f(-3.2 * s)}h${f(4.8 * s)}v${f(3.2 * s)}h${f(1.4 * s)}Z" fill="${P.ink('#1c2640')}" stroke="${P.keyC()}" stroke-width=".5"/><path d="M${f(x - 2.4 * s)} ${f(by - 28 * s)}h${f(4.8 * s)}" stroke="${P.ink('#c8a24a')}" stroke-width=".5"/>`;
  return d;
}

/** A painter seen from behind in his smock and soft hat, at his easel; on the canvas, the tower. */
function painter(P, x, by, s) {
  const f = P.f, S = (k) => f(k * s), X = (k) => f(x + k * s), Y = (k) => f(by - k * s);
  let d = '';
  // the easel's back leg, the figure, then the canvas and the front legs
  d += P.line(`M${X(34)} ${Y(0)}L${X(30)} ${Y(92)}`, '#6a4a2a', 1.4 * s);
  d += P.figure(x, by, s, 'gent', { c: '#c2ced6', legs: '#3a3a40', hat: '#2e2a26', arm: 24 });
  // a soft wide-brimmed hat over the bowler
  d += `<path d="M${X(-11)} ${Y(97.5)}Q${X(0)} ${Y(94)} ${X(11)} ${Y(97.5)}Q${X(8)} ${Y(100)} ${X(6)} ${Y(100)}Q${X(5)} ${Y(109)} ${X(0)} ${Y(109)}Q${X(-5)} ${Y(109)} ${X(-6)} ${Y(100)}Q${X(-8)} ${Y(100)} ${X(-11)} ${Y(97.5)}Z" fill="${P.ink('#3a3430')}" stroke="${P.keyC()}" stroke-width=".7"/>`;
  // the palette on his left arm
  d += `<ellipse cx="${X(-17)}" cy="${Y(52)}" rx="${S(7)}" ry="${S(3)}" fill="${P.ink('#c8a46a')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  for (const [k, c] of [[-21, '#c8463a'], [-18, '#3d6a9a'], [-15, '#e2c24a'], [-12.5, '#f2efe6']]) d += `<circle cx="${X(k)}" cy="${Y(52.6)}" r="${S(1.1)}" fill="${P.ink(c)}"/>`;
  // the canvas: a little tower against a blue sky, in its frame
  const cx0 = x + 16 * s, cy0 = by - 96 * s, cw = 26 * s, ch = 32 * s;
  d += P.fill(P.rect(cx0 - 1.2 * s, cy0 - 1.2 * s, cw + 2.4 * s, ch + 2.4 * s), '#8a6a3a', { w: .6 }) + P.flat(P.rect(cx0, cy0, cw, ch * .62), '#8fb6d6') + P.flat(P.rect(cx0, cy0 + ch * .62, cw, ch * .38), '#a9b98a');
  d += P.flat(P.rect(cx0, cy0 + ch * .58, cw, ch * .06), '#d8cdb0') + P.flat(`M${f(cx0 + cw * .3)} ${f(cy0 + ch * .2)}q${S(3)} ${S(-1)} ${S(5)} ${S(-3)}q${S(2)} ${S(2)} ${S(5)} ${S(3)}Z`, '#f4f2ea', { op: .9 });
  d += P.flat(`M${f(cx0 + cw * .62)} ${f(cy0 + ch * .1)}L${f(cx0 + cw * .54)} ${f(cy0 + ch * .64)}H${f(cx0 + cw * .7)}Z`, '#9c6c3f');
  d += P.line(`M${f(cx0 + cw * .56)} ${f(cy0 + ch * .5)}h${f(cw * .12)}M${f(cx0 + cw * .58)} ${f(cy0 + ch * .36)}h${f(cw * .08)}`, '#6a4a2a', .5);
  d += P.line(`M${X(14)} ${Y(0)}L${X(20)} ${Y(66)}M${X(44)} ${Y(0)}L${X(38)} ${Y(66)}M${X(14)} ${Y(64)}H${X(44)}`, '#7a5a34', 1.3 * s);
  // the brush hand raised to the canvas
  d += P.line(`M${X(18)} ${Y(60)}l${S(4)} ${S(14)}`, '#4a3a2a', .9 * s);
  return d;
}

/** The bouquiniste on his folding stool, in his cap and a long grey coat, reading. */
function stool(P, x, by, s) {
  const f = P.f, S = (k) => f(k * s);
  let d = P.line(`M${f(x - 4 * s)} ${by}L${f(x + 3 * s)} ${f(by - 9 * s)}M${f(x + 4 * s)} ${by}L${f(x - 3 * s)} ${f(by - 9 * s)}`, '#5a4632', .9 * s);
  d += P.fill(`M${f(x - 4 * s)} ${f(by - 9 * s)}h${S(8)}v${S(-1.4)}h${S(-8)}Z`, '#7a5a3a', { w: .4 });
  // seated: the coat over the knees, legs down, the paper held up
  d += P.fill(`M${f(x - 3 * s)} ${f(by - 10 * s)}L${f(x - 3.2 * s)} ${f(by - 22 * s)}Q${f(x)} ${f(by - 24 * s)} ${f(x + 3.2 * s)} ${f(by - 22 * s)}L${f(x + 7 * s)} ${f(by - 10 * s)}Z`, '#6a6460', { w: .5 });
  d += P.line(`M${f(x + 6 * s)} ${f(by - 10 * s)}V${f(by - 1 * s)}`, '#3a3634', 1.6 * s);
  d += `<circle cx="${f(x)}" cy="${f(by - 26 * s)}" r="${S(2.4)}" fill="${P.ink('#e2c19c')}" stroke="${P.keyC()}" stroke-width=".45"/><path d="M${f(x - 2.6 * s)} ${f(by - 27 * s)}q${S(2.6)} ${S(-3.4)} ${S(5.2)} 0h${S(1.6)}Z" fill="${P.ink('#3a3430')}"/>`;
  d += P.fill(`M${f(x + 3 * s)} ${f(by - 22 * s)}h${S(5)}v${S(6)}h${S(-5)}Z`, '#efe8d6', { w: .4 });
  return d;
}

/** A flower girl's basket of roses and violets on her arm. */
function flowerBasket(P, x, y, s) {
  const f = P.f;
  let d = P.fill(`M${f(x - 4 * s)} ${f(y)}h${f(9 * s)}l${f(-1.4 * s)} ${f(4 * s)}h${f(-6.2 * s)}Z`, '#b08a52', { w: .45 }) + P.line(`M${f(x - 3.4 * s)} ${f(y)}q${f(4 * s)} ${f(-7 * s)} ${f(8 * s)} 0`, '#8a6a3a', .6);
  const R = P.rng(Math.round(x));
  for (let i = 0; i < 7; i++) d += `<circle cx="${f(x - 3 * s + R() * 7 * s)}" cy="${f(y - .4 * s - R() * 2 * s)}" r="${f(1.1 * s)}" fill="${P.ink(['#d8576a', '#7a5ab0', '#f2ead6', '#e88a9a'][i % 4])}"/>`;
  return d;
}

/** A Renault taxi of the G7, the bonnet like a coal-scuttle, the driver in the open, the fare under the hood. */
function taxi(P, dir, s, c) {
  const W = 56 * s, H = 34 * s, S = (k) => P.f(k * s), f = P.f;
  const lampOn = P.L.lamps > .05;
  let b = '';
  // the landaulet body behind, its hood folded half down
  b += P.fill(`M${S(4)} ${S(26)}V${S(14)}Q${S(4)} ${S(11)} ${S(8)} ${S(11)}H${S(28)}V${S(26)}Z`, c, { w: .55 });
  b += P.fill(`M${S(6)} ${S(12)}Q${S(7)} ${S(3)} ${S(18)} ${S(3)}H${S(28)}V${S(12)}Z`, '#1f1d1c', { w: .5 });
  b += `<path d="M${S(17)} ${S(5)}H${S(26)}V${S(11)}H${S(17)}Z" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#4a5868')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  b += P.line(`M${S(8)} ${S(19)}H${S(27)}`, P.light(c, .35), .5 * s) + P.shade(`M${S(4)} ${S(22)}H${S(28)}V${S(26)}H${S(4)}Z`, c, .25);
  // the driver on the open seat, in his cap and coat
  b += P.fill(`M${S(30)} ${S(20)}L${S(31)} ${S(10)}H${S(36)}L${S(36.5)} ${S(20)}Z`, '#2a2c30', { w: .45 });
  b += `<circle cx="${S(33.4)}" cy="${S(7.6)}" r="${S(2)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(31.2)} ${S(6.8)}q${S(2.2)} ${S(-2.8)} ${S(4.4)} 0h${S(1.2)}Z" fill="${P.ink('#2a2622')}"/>`;
  b += P.fill(`M${S(28)} ${S(26)}V${S(17)}H${S(38)}V${S(26)}Z`, c, { w: .5 });
  // the coal-scuttle bonnet, the radiator behind it, the lamps
  b += P.fill(`M${S(38)} ${S(26)}V${S(16)}Q${S(48)} ${S(15)} ${S(52)} ${S(22)}V${S(26)}Z`, '#2a2826', { w: .55 }) + P.lite(`M${S(39)} ${S(17)}Q${S(46)} ${S(16)} ${S(49)} ${S(19)}`, '#2a2826', .3);
  b += P.line(`M${S(37.6)} ${S(16)}V${S(25)}`, '#b8963e', 1.2 * s);
  b += `<circle cx="${S(50)}" cy="${S(19.4)}" r="${S(1.6)}" fill="${lampOn ? P.glow('#fff2c0') : P.ink('#d9b45a')}"/>`;
  if (lampOn) b += `<circle cx="${S(51)}" cy="${S(19.4)}" r="${S(6)}" fill="${P.glow('#ffe2a0')}" opacity="${f(.3 * P.L.lamps)}"/>`;
  // the flag of the meter, and wheels
  b += P.fill(`M${S(36)} ${S(13)}h${S(3)}v${S(2)}h${S(-3)}Z`, '#c8463a', { w: .3 });
  for (const wx of [12, 44]) b += `<circle cx="${S(wx)}" cy="${S(28)}" r="${S(5.2)}" fill="${P.ink('#2b2622')}"/><circle cx="${S(wx)}" cy="${S(28)}" r="${S(3.2)}" fill="${P.ink('#b8963e')}"/><circle cx="${S(wx)}" cy="${S(28)}" r="${S(1.1)}" fill="${P.ink('#2b2622')}"/>`;
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 33 * s };
}

/** A Schneider autobus of the Compagnie Générale des Omnibus: green and cream, the platform behind, a board on top. */
function autobus(P, dir, s) {
  const W = 78 * s, H = 44 * s, S = (k) => P.f(k * s), f = P.f;
  const lit = P.L.windows > .2;
  let b = '';
  // the saloon
  b += P.fill(`M${S(10)} ${S(36)}V${S(12)}Q${S(10)} ${S(8)} ${S(14)} ${S(8)}H${S(56)}Q${S(60)} ${S(8)} ${S(60)} ${S(12)}V${S(36)}Z`, '#2f5a46', { w: .6 });
  b += P.fill(`M${S(10)} ${S(13)}H${S(60)}V${S(24)}H${S(10)}Z`, '#ece0c0', { w: .45 });
  for (let i = 0; i < 6; i++) b += `<rect x="${S(12 + i * 8)}" y="${S(14.4)}" width="${S(6.4)}" height="${S(8)}" fill="${lit ? P.glow('#ffd88a') : P.ink('#46566a')}" stroke="${P.keyC()}" stroke-width=".35"/>` + (lit || i % 2 ? '' : `<circle cx="${S(15.2 + i * 8)}" cy="${S(19.6)}" r="${S(1.6)}" fill="${P.ink('#2c2a30')}"/>`);
  b += P.shade(`M${S(10)} ${S(32)}H${S(60)}V${S(36)}H${S(10)}Z`, '#2f5a46', .25) + P.line(`M${S(12)} ${S(27)}H${S(58)}`, '#d8b45a', .5 * s);
  // the destination board on the roof
  b += P.fill(`M${S(16)} ${S(8)}V${S(4)}H${S(54)}V${S(8)}Z`, '#efe4c6', { w: .4 });
  b += `<text x="${S(35)}" y="${S(7.2)}" font-family="Georgia,serif" font-size="${S(3.4)}" font-weight="bold" text-anchor="middle" fill="${P.ink('#2f3a5a')}" textLength="${S(34)}" lengthAdjust="spacingAndGlyphs">MADELEINE - BASTILLE</text>`;
  // the rear platform, its rail and the conductor
  b += P.fill(`M${S(2)} ${S(36)}V${S(31)}H${S(10)}V${S(36)}Z`, '#2f5a46', { w: .45 }) + P.line(`M${S(3)} ${S(31)}V${S(14)}H${S(10)}`, '#2a2622', .7 * s);
  b += P.fill(`M${S(4.4)} ${S(31)}L${S(5)} ${S(20)}H${S(9)}L${S(9.4)} ${S(31)}Z`, '#2a3346', { w: .4 }) + `<circle cx="${S(7)}" cy="${S(17.6)}" r="${S(1.9)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(5)} ${S(16.6)}h${S(4)}v${S(-1.6)}h${S(-4)}Z" fill="${P.ink('#2a3346')}"/>`;
  // the bonnet and the driver under the canopy
  b += P.fill(`M${S(60)} ${S(36)}V${S(22)}H${S(72)}Q${S(75)} ${S(24)} ${S(75)} ${S(28)}V${S(36)}Z`, '#2f5a46', { w: .55 }) + P.line(`M${S(64)} ${S(26)}h${S(8)}M${S(64)} ${S(29)}h${S(8)}`, '#1f3a2e', .5 * s);
  b += P.fill(`M${S(60)} ${S(10)}H${S(68)}V${S(12)}H${S(60)}Z`, '#2a2622', { w: .35 }) + P.line(`M${S(67)} ${S(12)}V${S(22)}`, '#2a2622', .6 * s);
  b += `<circle cx="${S(64)}" cy="${S(15)}" r="${S(1.9)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(62)} ${S(14)}h${S(4)}v${S(-1.4)}h${S(-4)}Z" fill="${P.ink('#2a3346')}"/>` + P.fill(`M${S(61.6)} ${S(22)}L${S(62)} ${S(17)}H${S(66)}L${S(66.4)} ${S(22)}Z`, '#2a3346', { w: .35 });
  b += `<circle cx="${S(74)}" cy="${S(26)}" r="${S(1.5)}" fill="${P.L.lamps > .05 ? P.glow('#fff2c0') : P.ink('#d9b45a')}"/>`;
  b += P.fill(`M${S(4)} ${S(36)}H${S(76)}V${S(37.6)}H${S(4)}Z`, '#2a2622', { w: .3 });
  for (const wx of [18, 64]) b += `<circle cx="${S(wx)}" cy="${S(38)}" r="${S(5.4)}" fill="${P.ink('#2b2622')}"/><circle cx="${S(wx)}" cy="${S(38)}" r="${S(3.4)}" fill="${P.ink('#a8382e')}"/><circle cx="${S(wx)}" cy="${S(38)}" r="${S(1.2)}" fill="${P.ink('#2b2622')}"/>`;
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 43 * s };
}
