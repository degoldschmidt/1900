// Cöln from a wine terrace on the Rhine below the Hohenzollern Bridge, looking upstream: the bridge of 1911 broadside
// across the river on its three bowstring spans, a train crossing in its smoke; the cathedral, dark with a century of
// soot, lifting its twin spires behind the bridge's western towers over the arched hall of the Hauptbahnhof; Groß St.
// Martin and the Altstadt beyond. A white paddle steamer comes down the river toward us, a tug tows barges, a ferry
// boat crosses; on the terrace, a vine overhead, Kölsch on the tables and the Köbes in his blue apron.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

export default {
  id: 'COL',
  greet: 'GRUSS aus CÖLN',
  nation: 'DE',
  flag: 'DE',
  flower: 'grapevine',
  flower2: 'rose',
  frame: { band: ['#638137', '#374a28'], gold: '#d8b65e', ink: '#7a1f2a', leaf: ['#7aa356', '#33572c'], year: '#6e2a22', halo: '#f6ecd0' },
  horizon: 254,
  clouds: 4,
  wind: -1,
  pal: {
    key: '#272423', dom: '#817b6e', dom2: '#5f5a51', slate: '#4d5560', steel: '#5d7466', sand: '#ddd0b2', wall: '#e4d6bb', wall2: '#d3b58e',
    wall3: '#c99a82', roof: '#76504a', water: '#5f8288', ground: '#cdbf9e', glass: '#384656', sash: '#ece3cf', iron: '#2c3a33', gold: '#d2a640',
  },

  // a vine leaf with its tendril and a bunch of blue grapes
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(30, 30, 160, I.leaf[1], { shape: 'serrate' }) + F.leaf(26, 26, 230, I.leaf[0], { shape: 'serrate' }) + F.leaf(18, 18, 110, I.leaf[0], { shape: 'serrate' });
    s += F.stem('M-4 -8Q-12 -18 -6 -22Q0 -24 -2 -18', I.leaf[1], .9);
    const bunch = [[0, -2], [-5, 0], [5, 0], [-8, 5], [-2, 5], [4, 5], [9, 5], [-5, 10], [1, 10], [7, 10], [-2, 15], [4, 15], [1, 20]];
    for (const [x, y] of bunch) s += F.berry(x + 2, y - 2, 3.6, y > 12 ? '#4a3a7a' : y > 6 ? '#5a4a8e' : '#6a5aa0');
    s += F.stem('M2 -8Q3 -12 6 -14', '#6a4a2a', 1.2);
    return s;
  },
  // a red rose, its petals furled round a dark heart
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 9, 210, I.leaf[1], { shape: 'serrate' }) + F.leaf(15, 8, 145, I.leaf[0], { shape: 'serrate' });
    s += F.radial(5, 11, 12, '#b82a34', { shape: 'round', lite: '#d8545a' }) + F.radial(5, 7.4, 8, '#c8363e', { rot: 36, shape: 'round' });
    s += '<path d="M-3.4 0.6C-3.4 -3.6 3.4 -3.6 3.4 0.6C3.4 3 -1 3 -1 0.6C-1 -1 1.4 -1 1.4 0.4" fill="#a21f2a" stroke="#3a2e1e" stroke-width=".5"/>';
    return s;
  },

  back(P, T) {
    let s = '';
    // the Siebengebirge far up the river, blue
    s += P.far(.92, () => P.fill('M120 252C150 238 170 236 196 244C214 232 236 230 252 242C270 236 290 240 312 250L320 254H110Z', '#8a9cb0', { w: .3 }));
    // the Altstadt and Deutz beyond the bridge, and Groß St. Martin
    s += P.far(.8, () => P.row(240, 470, 254, { hMin: 10, hMax: 18, wMin: 8, wMax: 14, style: 'north', seed: 13, walls: ['#d8ccb6', '#cdb9a0', '#ddd2bf'], roofC: '#8a6e66', placard: false, flagSpot: false, lit: 1.4 }));
    s += P.far(.8, () => P.row(26, 150, 254, { hMin: 8, hMax: 14, wMin: 8, wMax: 14, style: 'north', seed: 21, walls: ['#d8ccb6', '#cdb9a0'], roofC: '#8a6e66', placard: false, flagSpot: false, lit: 1.4 }));
    s += P.far(.74, () => grossStMartin(P, 300, 248, .95));
    s += P.far(.85, () => P.fill(P.rect(150, 251, 120, 2.4), '#5a5048', { w: .3 }));
    s += P.smoke(110, 240, .6, { dark: true }) + P.smoke(232, 244, .5);
    // the cathedral
    s += P.far(.36, () => dom(P));
    // the Hauptbahnhof's great arched hall before its west towers
    s += P.far(.3, () => bahnhof(P, 478, 256));
    // the river up to the bridge
    s += P.water(250, 380, { seed: 12, shimmer: 9, x0: 60, x1: 470 });
    s += reflect(P, 340, 520, 252, 26, '#6b665c', 4) + reflect(P, 430, 480, 252, 50, '#6b665c', 6);
    // the train on the bridge, behind its trusses
    s += P.cross(train(P, 1, .78), { y: 244, dir: 1, dur: 38, rest: .45, offset: 6, x0: 30, x1: 470 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the banks running up to the bridge: Deutz on the left, the Cöln quays on the right
    s += P.fill('M14 262L40 254H60L48 268L14 278Z', 'sand', { w: .5 }) + P.far(.3, () => P.row(14, 52, 262, { hMin: 18, hMax: 26, wMin: 12, wMax: 16, seed: 5, roofC: 'roof', placard: false }));
    s += quay(P);
    s += bridge(P, 40, 462, 244);
    // a ferry boat crossing, a tug with barges going up under the bridge, the steamer coming down to us
    s += landingStage(P, 470, 304);
    s += P.cross(T.rowboat({ s: .7, dir: 1, hull: '#6a4a32', shirt: '#e8e2d2' }), { y: 288, dir: 1, dur: 70, rest: .3, offset: 24, x0: 60, x1: 470 });
    s += P.cross(T.sail({ s: .62, rig: 'gaff', sailC: '#9a6a3a', hull: '#3a3028', strake: '#d8b45a', dir: -1 }), { y: 276, dir: -1, dur: 130, rest: .25, offset: 80, x0: 70, x1: 450 });
    s += P.mover(tow(P, -1, 1), { path: [[520, 310, 1, 0, 0], [500, 306, .96, .04, 1], [300, 268, .42, .8, 1], [288, 265, .38, .86, 0], [288, 265, .38, 1, 0]], dur: 110, offset: 70 });
    s += P.mover(steamerAhead(P, 1), { path: [[318, 262, .26, 0, 0], [316, 264, .28, .05, 1], [270, 292, .58, .5], [214, 330, 1.02, .88, 1], [206, 338, 1.1, .92, 0], [206, 338, 1.1, 1, 0]], dur: 64, offset: 10 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the terrace: its balustrade over the river, tables, the people at their Kölsch
    s += P.fill(P.rect(14, 334, 572, 10), 'sand', { w: .6 }) + P.lite(P.rect(14, 334, 572, 2), 'sand', .35);
    let bal = '';
    for (let x = 22; x < 586; x += 8) bal += P.fill(`M${x} 344q-2.4 5 0 10h4q2.4 -5 0 -10Z`, 'sand', { w: .4 });
    s += bal + P.fill(P.rect(14, 354, 572, 4), 'sand', { w: .5 });
    s += P.paving(358, 380, { vx: 300, seed: 6 });
    for (const x of [150, 420]) s += P.fill(P.rect(x - 6, 322, 12, 14), 'sand', { w: .55 }) + P.fill(P.rect(x - 7.5, 320, 15, 3), 'sand', { w: .45 }) + P.lamp(x, 321, .8, 'globe', { h: 40 }) + P.flagAt(x + 1, 296);
    s += P.wall(242, 337, 12, 15);
    s += P.setStreet(372, 40, 560, 1.05);
    s += table(P, 236, 370, 1.1) + table(P, 486, 372, 1.12);
    s += P.person(214, 370, 1.12, 'gent', { c: '#3a3d48', dir: 1 }) + P.person(258, 371, 1.1, 'lady', { c: '#ece2c8', dir: -1 }) + P.person(464, 372, 1.12, 'boater', { c: '#2f3a30', dir: 1 }) + P.person(508, 373, 1.1, 'lady', { c: '#d9c6e6', dir: -1 });
    s += koebes(P, 380, 372, 1.14);
    // the vine on its pergola over the left of the terrace
    s += pergola(P);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.1, dir: 1, seed: 3 }), { y: 378, dir: 1, dur: 76, offset: 30, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['lady', 'girl', 'boater'], s: 1.08, dir: -1, seed: 17 }), { y: 380, dir: -1, dur: 92, offset: 4, z: 'fore' });
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

// ---------- the cathedral ----------
/** A pinnacle: a little spire with its finial. */
function pinnacle(P, x, by, w, h, c = 'dom') {
  return P.fill(P.spire(x, by, w, h), c, { w: .4 }) + P.line(`M${P.f(x)} ${P.f(by - h)}v-2`, c, .5);
}
/** Crockets: the little leaves that climb a Gothic edge, from (x0, y0) at the top to (x1, y1). */
function crockets(P, x0, y0, x1, y1, n = 7) {
  let d = '';
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, out = x1 < x0 ? -1 : 1; d += `M${P.f(x)} ${P.f(y)}q${P.f(out * 2.6)} -.6 ${P.f(out * 2.2)} -2.8`; }
  return `<path d="${d}" fill="none" stroke="${P.keyC()}" stroke-width="1.3" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${P.ink('dom')}" stroke-width=".7" stroke-linecap="round"/>`;
}
/** One of the west towers: square stages of tall tracery, an octagon, the pierced spire with its finial. */
function westTower(P, cx, base, tip, w) {
  const { f } = P;
  let s = '';
  const oct = tip + (base - tip) * .5, spireB = tip + (base - tip) * .34;
  // the square stages
  s += P.fill(P.rect(cx - w / 2, oct, w, base - oct), 'dom') + P.shade(P.rect(cx + w * .12, oct, w * .38, base - oct), 'dom', .22);
  s += P.stipple(P.rect(cx - w / 2, oct, w, base - oct), 'dom', 40, { box: [cx - w / 2, oct, w, base - oct], op: .4 });
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * w / 2 - (k > 0 ? 4 : 0), oct - 4, 4, base - oct + 4), 'dom2', { w: .45 }) + pinnacle(P, cx + k * (w / 2 - 2), oct - 3.6, 4.6, 16);
  const stH = (base - oct) / 2;
  for (let k = 0; k < 2; k++) {
    const y0 = oct + k * stH;
    for (const dx of [-.22, .22]) {
      const gx = cx + dx * w - w * .1;
      s += P.fill(P.gothic(gx, y0 + 6, w * .2, stH - 10), 'glass', { w: .4 }) + P.line(`M${f(gx + w * .1)} ${f(y0 + 6 + w * .14)}V${f(y0 + stH - 4)}`, 'dom2', .5);
    }
    s += P.fill(P.gable(cx - w * .36, y0 + 6, w * .72, 10), 'dom', { w: .4 });
    s += P.line(`M${f(cx - w / 2)} ${f(y0)}h${f(w)}`, 'dom2', 1.1);
  }
  // the octagon, with its gables and pinnacles
  const ow = w * .78;
  s += P.fill(P.rect(cx - ow / 2, spireB, ow, oct - spireB), 'dom') + P.shade(P.rect(cx + ow * .14, spireB, ow * .36, oct - spireB), 'dom', .22);
  for (const dx of [-.22, .22]) s += P.fill(P.gothic(cx + dx * ow - ow * .1, spireB + 5, ow * .2, oct - spireB - 9), 'glass', { w: .35 });
  for (const k of [-1, 0, 1]) s += P.fill(P.gable(cx + k * ow * .33 - ow * .16, spireB + 2, ow * .32, 9), 'dom', { w: .35 });
  for (const k of [-1, 1]) s += pinnacle(P, cx + k * ow / 2, spireB + 3, 3.4, 13);
  // the spire, pierced, crocketed, its great finial
  const sw = ow * .5;
  s += P.fill(`M${f(cx - sw)} ${f(spireB)}L${f(cx)} ${f(tip + 6)}L${f(cx + sw)} ${f(spireB)}Z`, 'dom') + P.shade(`M${f(cx)} ${f(tip + 6)}L${f(cx + sw)} ${f(spireB)}H${f(cx + 1.5)}Z`, 'dom', .22);
  for (let k = 1; k < 8; k++) {
    const y = spireB - (spireB - tip - 6) * k / 8, hw = sw * (1 - k / 8);
    s += P.line(`M${f(cx - hw)} ${f(y)}H${f(cx + hw)}`, 'dom2', .5);
    if (k < 6) s += `<circle cx="${f(cx - hw * .45)}" cy="${f(y + 3)}" r="${f(Math.max(.7, hw * .16))}" fill="${P.ink('glass')}"/><circle cx="${f(cx + hw * .45)}" cy="${f(y + 3)}" r="${f(Math.max(.7, hw * .16))}" fill="${P.ink('glass')}"/>`;
  }
  s += crockets(P, cx, tip + 6, cx - sw, spireB, 10) + crockets(P, cx, tip + 6, cx + sw, spireB, 10);
  s += P.fill(`M${f(cx - 3.6)} ${f(tip + 6)}q${f(-1)} -3 ${f(1.4)} -3.6q${f(-1.8)} -1.6 ${f(2.2)} -3.4q${f(4)} 1.8 ${f(2.2)} 3.4q${f(2.4)} .6 ${f(1.4)} 3.6Z`, 'dom2', { w: .4 });
  return s;
}
/** The cathedral from the north: the choir and its buttresses toward the river, the long roof, the twin west towers. */
function dom(P) {
  const { f } = P;
  let s = '';
  // the long roof of slate over the nave and choir, the transept's gable, the crossing's slender spire
  s += P.fill('M328 214L346 176H452L462 214Z', 'slate') + P.shade('M410 176H452L462 214H420Z', 'slate', .2);
  for (let x = 352; x < 452; x += 6) s += P.line(`M${x} 178L${x + 4} 213`, P.light('slate', .15), .4, { op: .6 });
  s += P.fill('M336 214V196L346 186H360L362 214Z', 'dom', { w: .5 });
  s += P.fill(P.rect(320, 214, 146, 40), 'dom') + P.stipple(P.rect(320, 214, 146, 40), 'dom', 60, { box: [320, 214, 146, 40], op: .4 });
  for (let i = 0; i < 9; i++) {
    const x = 324 + i * 15.5;
    s += P.fill(P.gothic(x + 3, 220, 8, 30), 'glass', { w: .4 }) + P.line(`M${x + 7} 226V249`, 'dom2', .45);
    s += P.fill(P.rect(x - 2, 210, 4, 44), 'dom2', { w: .45 }) + pinnacle(P, x, 211, 5, 15);
    s += P.line(`M${x} 222L${x + 9} 210`, 'dom2', 1.2);
  }
  // the north transept: its gable with the rose, pinnacled
  s += P.fill(P.rect(386, 186, 34, 68), 'dom') + P.shade(P.rect(408, 186, 12, 68), 'dom', .2);
  s += P.fill(P.gable(384, 188, 38, 30), 'dom', { w: .6 }) + `<circle cx="403" cy="174" r="5.4" fill="${P.ink('glass')}" stroke="${P.ink('dom2')}" stroke-width=".8"/>`;
  s += P.fill(P.gothic(395, 196, 16, 46), 'glass', { w: .5 }) + P.line('M403 206V242M396 220H410', 'dom2', .6);
  for (const x of [386, 420]) s += pinnacle(P, x, 190, 6, 22);
  s += P.line('M403 158v-6', 'dom2', 1);
  // the crossing's ridge turret
  s += P.fill(P.rect(399.5, 164, 5, 14), 'dom2', { w: .35 }) + P.fill(P.spire(402, 165, 6, 38), 'slate', { w: .4 }) + P.line('M402 127v-5', 'gold', .8) + `<circle cx="402" cy="121" r="1.3" fill="${P.ink('gold')}"/>`;
  // the choir's chapels and flying buttresses at the east end
  for (let i = 0; i < 4; i++) {
    const x = 314 + i * 9;
    s += P.line(`M${x} 232Q${x + 6} 214 ${x + 18} 212`, 'dom', 2.4) + P.line(`M${x} 232Q${x + 6} 214 ${x + 18} 212`, 'dom2', .6);
    s += pinnacle(P, x, 234, 5, 18);
  }
  // the west towers, the far one a little behind
  s += westTower(P, 500, 254, 92, 34);
  s += westTower(P, 458, 258, 86, 36);
  // the west front between them, glimpsed
  s += P.fill(P.rect(472, 196, 12, 58), 'dom2', { w: .4 });
  return s;
}

/** Groß St. Martin: the crossing tower with four corner turrets over the Altstadt. */
function grossStMartin(P, cx, by, s) {
  const f = P.f;
  let d = P.fill(P.rect(cx - 30 * s, by - 18 * s, 60 * s, 18 * s), 'wall2', { w: .4 }) + P.fill(P.poly([[cx - 32 * s, by - 18 * s], [cx - 20 * s, by - 28 * s], [cx + 20 * s, by - 28 * s], [cx + 32 * s, by - 18 * s]]), 'slate', { w: .4 });
  d += P.fill(P.rect(cx - 11 * s, by - 62 * s, 22 * s, 44 * s), 'wall2', { w: .45 }) + P.shade(P.rect(cx + 4 * s, by - 62 * s, 7 * s, 44 * s), 'wall2', .2);
  for (let k = 0; k < 3; k++) d += P.windows(cx - 9 * s, by - 58 * s + k * 12 * s, 18 * s, 9 * s, 3, 1, { arched: true, ww: .45, lit: .3 });
  for (const k of [-1, 1]) d += P.fill(P.rect(cx + k * 11 * s - 2.6 * s, by - 70 * s, 5.2 * s, 26 * s), 'wall2', { w: .35 }) + P.fill(P.spire(cx + k * 11 * s, by - 70 * s, 6.4 * s, 12 * s), 'slate', { w: .3 });
  d += P.fill(P.spire(cx, by - 62 * s, 24 * s, 26 * s), 'slate', { w: .45 }) + P.line(`M${cx} ${f(by - 88 * s)}v${f(-5 * s)}`, 'gold', .8);
  return d;
}

/** The Hauptbahnhof's train shed: a great arch of iron and glass. */
function bahnhof(P, x, by) {
  const f = P.f;
  let d = P.fill(`M${x} ${by}V${by - 24}Q${x + 50} ${by - 66} ${x + 100} ${by - 24}V${by}Z`, '#8a9298', { w: .6 });
  for (let i = 1; i < 10; i++) d += P.line(`M${x + i * 10} ${f(by - 24 - Math.sin(i / 10 * Math.PI) * 40)}V${by - 2}`, '#5a6268', .5, { op: .7 });
  for (let k = 1; k < 4; k++) d += P.line(`M${x} ${by - 24 + k * 6}Q${x + 50} ${by - 66 + k * 6} ${x + 100} ${by - 24 + k * 6}`, P.light('#8a9298', .3), .5, { op: .8 });
  d += P.fill(P.rect(x - 8, by - 28, 14, 28), 'wall2', { w: .45 }) + P.fill(P.spire(x - 1, by - 28, 16, 12), 'slate', { w: .4 }) + P.windows(x - 6, by - 24, 10, 20, 1, 2, { arched: true });
  return d;
}

// ---------- the bridge ----------
/** The Hohenzollern Bridge broadside: deck girders on three piers, three bowstring arches, portal towers, the Kaisers. */
function bridge(P, x0, x1, deck) {
  const f = P.f, span = (x1 - x0) / 3;
  let s = '';
  // piers in the water
  for (let i = 0; i <= 3; i++) {
    const x = x0 + i * span;
    s += P.fill(P.rect(x - 7, deck + 6, 14, 254 - deck), 'sand', { w: .55 }) + P.shade(P.rect(x + 2, deck + 6, 5, 254 - deck), 'sand', .25) + P.fill(P.poly([[x - 8, 262], [x, 258], [x + 8, 262]]), 'sand', { w: .4 });
  }
  // the far truss, then the deck, then the near truss
  const truss = (dy, c, w) => {
    let t = '';
    for (let i = 0; i < 3; i++) {
      const a = x0 + i * span + 4, b = a + span - 8, top = deck - 38 + dy;
      const arc = (u) => [a + (b - a) * u, deck + dy - (deck + dy - top) * Math.sin(Math.PI * u) * (1 - .15 * Math.pow(2 * u - 1, 2))];
      let up = '', web = '';
      for (let k = 0; k <= 20; k++) { const [x, y] = arc(k / 20); up += `${k ? 'L' : 'M'}${f(x)} ${f(y)}`; }
      for (let k = 1; k < 12; k++) { const [x, y] = arc(k / 12), [x2, y2] = arc((k + .5) / 12); web += `M${f(x)} ${f(deck + dy)}L${f(x)} ${f(y)}M${f(x)} ${f(deck + dy)}L${f(x2)} ${f(y2)}`; }
      t += `<path d="${up}" fill="none" stroke="${P.keyC()}" stroke-width="${f(w + 1.2)}" stroke-linecap="round"/><path d="${up}" fill="none" stroke="${P.ink(c)}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
      t += `<path d="${web}" fill="none" stroke="${P.ink(c)}" stroke-width="${f(w * .32)}"/>`;
    }
    return t;
  };
  s += truss(-5, P.dark('steel', .2), 2.6);
  s += P.fill(P.rect(x0 - 4, deck, x1 - x0 + 8, 7), 'steel', { w: .6 }) + P.lite(P.rect(x0 - 4, deck, x1 - x0 + 8, 1.4), 'steel', .25);
  for (let x = x0; x < x1; x += 9) s += P.line(`M${x} ${deck + 1.5}v5`, P.dark('steel', .3), .4, { op: .7 });
  s += truss(0, 'steel', 3.2);
  // the portal towers at each end, with their pointed roofs; the Kaisers on horseback
  for (const [x, k] of [[x0, -1], [x1, 1]]) {
    for (const dx of [-10, 8]) {
      const tx = x + dx * (k > 0 ? 1 : -1) + k * 6;
      s += P.fill(P.rect(tx - 7, deck - 46, 14, 54), 'sand', { w: .55 }) + P.shade(P.rect(tx + 2, deck - 46, 5, 54), 'sand', .2);
      s += P.fill(P.arch(tx - 3, deck - 40, 6, 12), 'glass', { w: .3 }) + P.fill(P.rect(tx - 8, deck - 48, 16, 3), 'sand', { w: .4 }) + P.fill(P.spire(tx, deck - 48, 15, 20), 'slate', { w: .45 });
      s += P.line(`M${tx} ${deck - 68}v-4`, 'gold', .8);
    }
    s += rider(P, x + k * 26, deck - 2, .9);
  }
  s += P.flag(x1 + 13, deck - 72, .7, 'DE', { h: 16 });
  // lamps along the deck at the piers
  for (let i = 1; i < 3; i++) s += P.lamp(x0 + i * span, deck + 1, .42, 'single', { h: 34 });
  return s;
}
function rider(P, x, by, s) {
  const f = P.f, c = '#4c6a5a';
  let d = P.fill(P.rect(x - 7 * s, by - 8 * s, 14 * s, 8 * s), 'sand', { w: .4 });
  d += P.fill(`M${f(x - 6 * s)} ${f(by - 8 * s)}l${f(1 * s)} ${f(-6 * s)}h${f(8 * s)}l${f(2 * s)} ${f(-3 * s)}l${f(1.6 * s)} ${f(2 * s)}l${f(-1.6 * s)} ${f(3 * s)}l${f(-1 * s)} ${f(4 * s)}Z`, c, { w: .4 });
  d += P.fill(`M${f(x - 1.4 * s)} ${f(by - 14 * s)}v${f(-6 * s)}h${f(2.8 * s)}v${f(6 * s)}Z`, c, { w: .35 }) + `<circle cx="${f(x)}" cy="${f(by - 21 * s)}" r="${f(1.4 * s)}" fill="${P.ink(c)}"/>`;
  return d;
}

/** The Cöln quays on the right, running up to the bridge: their wall, warehouses and houses, barges moored. */
function quay(P) {
  let s = P.fill('M462 254L590 286V300L462 262Z', 'sand', { w: .5 }) + P.shade('M462 258L590 292V300L462 262Z', 'sand', .25);
  // houses along the quay, larger as they come toward us
  const fronts = [[470, 254, 16, 26], [486, 258, 18, 32], [504, 262, 20, 38], [524, 267, 24, 46], [548, 273, 28, 54]];
  for (const [x, by, w, h] of fronts) s += P.facade(x, by, w, h, { c: ['wall', 'wall2', 'wall3'][Math.round(x) % 3], roof: x % 2 ? 'gable' : 'pitch', roofC: 'roof', side: w * .2, flagChance: .9, chance: .8 });
  s += P.far(.2, () => P.fill('M488 276h34l-4 6h-28Z', '#3a3028', { w: .5 }) + P.fill('M492 276v-4h8v4Z', '#c8b48a', { w: .3 }));
  return s;
}

// ---------- what moves ----------
/** A Prussian express: the black engine with its red wheels, the tender, green coaches, lit at night. */
function train(P, dir, s) {
  const W = 236 * s, H = 30 * s, S = (k) => P.f(k * s), f = P.f, lit = P.L.windows > .2;
  let b = '';
  // coaches
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 38;
    b += P.fill(`M${S(x)} ${S(26)}V${S(12)}Q${S(x)} ${S(9)} ${S(x + 4)} ${S(9)}H${S(x + 32)}Q${S(x + 36)} ${S(9)} ${S(x + 36)} ${S(12)}V${S(26)}Z`, '#3f5a46', { w: .5 });
    b += P.fill(`M${S(x + 1)} ${S(10.5)}Q${S(x + 18)} ${S(5.5)} ${S(x + 35)} ${S(10.5)}Z`, '#4a4a4a', { w: .35 });
    for (let k = 0; k < 6; k++) b += `<rect x="${S(x + 3 + k * 5.4)}" y="${S(13)}" width="${S(3.6)}" height="${S(5)}" fill="${lit && (i + k) % 3 ? P.glow('#ffd88a') : P.ink('#3a4656')}"/>`;
    b += P.line(`M${S(x + 1)} ${S(21)}H${S(x + 35)}`, '#d8b45a', .5 * s);
    b += `<circle cx="${S(x + 8)}" cy="${S(27)}" r="${S(2.4)}" fill="${P.ink('#2a2622')}"/><circle cx="${S(x + 28)}" cy="${S(27)}" r="${S(2.4)}" fill="${P.ink('#2a2622')}"/>`;
  }
  // tender and engine
  const e = 194;
  b += P.fill(`M${S(e)} ${S(26)}V${S(14)}H${S(e + 12)}V${S(26)}Z`, '#232426', { w: .5 });
  b += P.fill(`M${S(e + 13)} ${S(24)}V${S(9)}H${S(e + 22)}V${S(24)}Z`, '#232426', { w: .5 }) + P.fill(`M${S(e + 12)} ${S(9.5)}H${S(e + 23)}V${S(7.5)}H${S(e + 12)}Z`, '#232426', { w: .4 });
  b += `<rect x="${S(e + 15)}" y="${S(11)}" width="${S(4)}" height="${S(4)}" fill="${lit ? P.glow('#ffb35a') : P.ink('#3a4656')}"/>`;
  b += P.fill(`M${S(e + 22)} ${S(22)}V${S(13)}H${S(e + 40)}Q${S(e + 42)} ${S(13)} ${S(e + 42)} ${S(17.5)}Q${S(e + 42)} ${S(22)} ${S(e + 40)} ${S(22)}Z`, '#232426', { w: .5 });
  b += P.fill(`M${S(e + 35)} ${S(13)}V${S(6)}H${S(e + 39)}V${S(13)}Z`, '#232426', { w: .4 }) + P.fill(`M${S(e + 27)} ${S(13)}Q${S(e + 29)} ${S(9)} ${S(e + 31)} ${S(13)}Z`, '#232426', { w: .4 });
  b += P.line(`M${S(e + 23)} ${S(15)}H${S(e + 41)}`, '#c8a24a', .5 * s);
  for (const wx of [e + 26, e + 32, e + 38]) b += `<circle cx="${S(wx)}" cy="${S(25)}" r="${S(2.8)}" fill="${P.ink('#a8322a')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  b += P.fill(`M${S(e + 40)} ${S(24)}l${S(4)} ${S(2.4)}h${S(-5)}Z`, '#232426', { w: .3 });
  if (P.L.lamps > .05) b += `<circle cx="${S(e + 41)}" cy="${S(18)}" r="${S(1.4)}" fill="${P.glow('#fff2c0')}"/>`;
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 28 * s, puffs: [[dir > 0 ? (e + 37) * s : W - (e + 37) * s, 5 * s, 1.1 * s, false, -dir]] };
}

/** A Rhine paddle steamer coming straight down the river at us: the bow, the paddle boxes, the funnel, awnings. */
function steamerAhead(P, s) {
  const W = 84 * s, H = 74 * s, S = (k) => P.f(k * s), f = P.f, lit = P.L.windows > .2;
  let b = '';
  // the mast with its flag, the funnel black with a white band
  b += P.line(`M${S(42)} ${S(30)}V${S(4)}`, '#4a3a2a', .9 * s) + `<rect x="${S(42.5)}" y="${S(4)}" width="${S(9)}" height="${S(6)}" fill="${P.ink('#f4f1e8')}"/><rect x="${S(42.5)}" y="${S(6)}" width="${S(9)}" height="${S(2)}" fill="${P.ink('#2a2a2a')}"/><rect x="${S(42.5)}" y="${S(8)}" width="${S(9)}" height="${S(2)}" fill="${P.ink('#c8102e')}"/>`;
  b += P.fill(`M${S(35)} ${S(36)}V${S(14)}Q${S(42)} ${S(11)} ${S(49)} ${S(14)}V${S(36)}Z`, '#232222', { w: .55 }) + P.flat(`M${S(35)} ${S(19)}Q${S(42)} ${S(16)} ${S(49)} ${S(19)}V${S(22)}Q${S(42)} ${S(19)} ${S(35)} ${S(22)}Z`, '#f2eee4');
  // the upper deck under its awning, the wheelhouse
  b += P.fill(`M${S(14)} ${S(40)}V${S(32)}Q${S(42)} ${S(26)} ${S(70)} ${S(32)}V${S(40)}Z`, '#c84a3a', { w: .5 });
  for (let i = 0; i < 6; i++) b += P.line(`M${S(17 + i * 10)} ${S(31 - Math.sin((i + .5) / 6 * Math.PI) * 3)}V${S(40)}`, '#f4efe2', 1.6 * s);
  b += P.fill(`M${S(32)} ${S(36)}V${S(28)}H${S(52)}V${S(36)}Z`, '#f4efe2', { w: .45 }) + `<rect x="${S(35)}" y="${S(30)}" width="${S(14)}" height="${S(3.4)}" fill="${lit ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  // the saloon deck, its windows, the paddle boxes either side
  b += P.fill(`M${S(10)} ${S(52)}V${S(40)}H${S(74)}V${S(52)}Z`, '#f4efe2', { w: .55 });
  for (let i = 0; i < 8; i++) b += `<rect x="${S(13 + i * 7.6)}" y="${S(43)}" width="${S(4.6)}" height="${S(5)}" fill="${lit ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  for (const k of [-1, 1]) {
    const cx = 42 + k * 35;
    b += P.fill(`M${S(cx - 8)} ${S(60)}V${S(48)}Q${S(cx)} ${S(40)} ${S(cx + 8)} ${S(48)}V${S(60)}Z`, '#f4efe2', { w: .5 }) + P.line(`M${S(cx - 5)} ${S(50)}h${S(10)}`, '#c8a24a', .7 * s);
  }
  // the hull, white, narrowing to the bow; her bow wave
  b += P.fill(`M${S(14)} ${S(52)}H${S(70)}L${S(64)} ${S(66)}Q${S(42)} ${S(72)} ${S(20)} ${S(66)}Z`, '#f2ede2', { w: .6 }) + P.shade(`M${S(42)} ${S(52)}H${S(70)}L${S(64)} ${S(66)}Q${S(52)} ${S(70)} ${S(42)} ${S(70.5)}Z`, '#f2ede2', .14);
  b += P.line(`M${S(42)} ${S(53)}V${S(70)}`, '#b8b0a0', .6 * s) + P.line(`M${S(17)} ${S(57)}H${S(67)}`, '#2a3a5a', .8 * s);
  b += `<path d="M${S(6)} ${S(70)}Q${S(24)} ${S(74)} ${S(42)} ${S(72)}Q${S(60)} ${S(74)} ${S(78)} ${S(70)}" fill="none" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(1.4)}" opacity=".75"/>`;
  if (P.L.lamps > .05) b += `<circle cx="${S(42)}" cy="${S(26)}" r="${S(1.6)}" fill="${P.glow('#fff2c0')}"/>`;
  return { svg: doc(f(W), f(H), b), w: W, h: H, ax: W / 2, ay: 69 * s, puffs: [[42 * s, 12 * s, 1.1 * s, true, -1]] };
}

/** A tug towing two Rhine barges upstream, seen from astern as they go away from us. */
function tow(P, dir, s) {
  const W = 120 * s, H = 50 * s, S = (k) => P.f(k * s), f = P.f;
  let b = '';
  // the tug ahead (smaller, farther), its funnel smoking
  b += P.fill(`M${S(88)} ${S(26)}V${S(14)}H${S(94)}V${S(26)}Z`, '#232222', { w: .4 }) + P.flat(`M${S(88)} ${S(16)}H${S(94)}V${S(18)}H${S(88)}Z`, '#c8a24a');
  b += P.fill(`M${S(82)} ${S(30)}V${S(24)}H${S(100)}V${S(30)}Z`, '#e8dcc4', { w: .4 }) + P.fill(`M${S(78)} ${S(30)}H${S(104)}L${S(100)} ${S(34)}H${S(82)}Z`, '#2b2725', { w: .45 });
  b += P.line(`M${S(84)} ${S(31)}Q${S(70)} ${S(34)} ${S(62)} ${S(34)}`, '#4a3a2a', .5 * s);
  // the barges, the nearer one bigger: black hulls, a deckhouse aft, the helmsman, a flag
  const barge = (x, y, k) => {
    let g = P.fill(`M${S(x)} ${S(y)}H${S(x + 46 * k)}L${S(x + 42 * k)} ${S(y + 8 * k)}H${S(x + 4 * k)}Z`, '#2c2a28', { w: .5 }) + P.line(`M${S(x + 2 * k)} ${S(y + 2 * k)}H${S(x + 44 * k)}`, '#c8b48a', .6 * s);
    g += P.fill(`M${S(x + 4 * k)} ${S(y)}V${S(y - 4 * k)}H${S(x + 30 * k)}V${S(y)}Z`, '#7a5a3a', { w: .4 });
    g += P.fill(`M${S(x + 32 * k)} ${S(y)}V${S(y - 9 * k)}H${S(x + 42 * k)}V${S(y)}Z`, '#e2d2b0', { w: .4 }) + P.fill(`M${S(x + 31 * k)} ${S(y - 9 * k)}L${S(x + 37 * k)} ${S(y - 12 * k)}L${S(x + 43 * k)} ${S(y - 9 * k)}Z`, '#5a3a2a', { w: .35 });
    g += `<rect x="${S(x + 35 * k)}" y="${S(y - 7 * k)}" width="${S(3 * k)}" height="${S(2.6 * k)}" fill="${P.L.windows > .2 ? P.glow('#ffc96b') : P.ink('#3a4656')}"/>`;
    g += P.line(`M${S(x + 44 * k)} ${S(y)}V${S(y - 14 * k)}`, '#4a3a2a', .5 * s) + `<rect x="${S(x + 44 * k)}" y="${S(y - 14 * k)}" width="${S(5 * k)}" height="${S(3.4 * k)}" fill="${P.ink('#2b5a9a')}"/>`;
    return g;
  };
  b += barge(44, 30, .8) + barge(2, 38, 1);
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 46 * s, puffs: [[dir > 0 ? 91 * s : W - 91 * s, 14 * s, .7 * s, true, 1]] };
}

/** The Köln-Düsseldorfer's landing stage: a pontoon with its ticket house and flag, a white steamer alongside. */
function landingStage(P, x, wl) {
  const f = P.f;
  let d = P.line(`M${x + 70} ${wl - 22}L${x + 116} ${wl - 6}`, '#4a3a2c', 2) + P.line(`M${x + 70} ${wl - 25}L${x + 116} ${wl - 9}`, '#8a8070', .6);
  // the steamer alongside, white with her black funnel
  d += P.fill(`M${x - 4} ${wl - 4}H${x + 64}L${x + 60} ${wl + 2}H${x}Z`, '#f2ede2', { w: .5 }) + P.fill(`M${x + 6} ${wl - 4}V${wl - 10}H${x + 56}V${wl - 4}Z`, '#f2ede2', { w: .45 });
  for (let i = 0; i < 8; i++) d += `<rect x="${x + 8 + i * 6}" y="${wl - 8.6}" width="3" height="3" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('glass')}"/>`;
  d += P.fill(`M${x + 26} ${wl - 10}V${wl - 22}H${x + 31}V${wl - 10}Z`, '#232222', { w: .4 }) + P.flat(P.rect(x + 26, wl - 19, 5, 2), '#f2eee4');
  d += P.fill(`M${x + 16} ${wl - 10}V${wl - 13}H${x + 46}V${wl - 10}Z`, '#c84a3a', { w: .35 });
  // the pontoon and its little house
  d += P.fill(`M${x + 60} ${wl + 2}H${x + 112}V${wl - 2}H${x + 60}Z`, '#4a4038', { w: .5 }) + P.fill(P.rect(x + 74, wl - 12, 24, 10), '#e8dcc4', { w: .45 }) + P.fill(P.poly([[x + 72, wl - 12], [x + 86, wl - 18], [x + 100, wl - 12]]), 'roof', { w: .4 });
  d += `<rect x="${x + 78}" y="${wl - 10}" width="5" height="4" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('glass')}"/><rect x="${x + 88}" y="${wl - 10}" width="5" height="4" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('glass')}"/>`;
  d += P.flag(x + 108, wl - 2, .7, 'DE', { h: 22 });
  return d;
}

// ---------- the terrace ----------
function table(P, x, by, s) {
  const f = P.f;
  let d = P.line(`M${x} ${by}V${f(by - 10 * s)}M${f(x - 4 * s)} ${by}H${f(x + 4 * s)}`, '#3a3430', 1 * s);
  d += P.fill(`M${f(x - 9 * s)} ${f(by - 10 * s)}h${f(18 * s)}l${f(-1 * s)} ${f(2.6 * s)}h${f(-16 * s)}Z`, '#f2ede0', { w: .5 });
  for (const k of [-5, -1, 3, 6]) d += P.fill(P.rect(x + k * s, by - 14 * s, 1.6 * s, 4 * s), '#e8c86a', { w: .3 });
  return d;
}
/** The Köbes: blue knitted jacket, long blue apron, a tray of Kölsch held high. */
function koebes(P, x, by, s) {
  const f = P.f;
  let d = P.person(x, by, s, 'worker', { c: '#2f4a7a', legs: '#2f4a7a', hat: '#2f4a7a', dir: -1 });
  d += P.fill(`M${f(x - 3 * s)} ${f(by - 12 * s)}h${f(6 * s)}v${f(11 * s)}h${f(-6 * s)}Z`, '#3a5a8a', { w: .4 });
  d += P.line(`M${f(x + 2 * s)} ${f(by - 18 * s)}l${f(4 * s)} ${f(-8 * s)}`, '#2f4a7a', 1.4 * s) + P.fill(`M${f(x + 1 * s)} ${f(by - 27 * s)}h${f(11 * s)}v${f(1.4 * s)}h${f(-11 * s)}Z`, '#8a6a46', { w: .35 });
  for (let i = 0; i < 4; i++) d += P.fill(P.rect(x + (2 + i * 2.6) * s, by - 31 * s, 1.6 * s, 4 * s), '#e8c86a', { w: .25 });
  return d;
}
/** The pergola at the left: its post and beam, the vine hanging, bunches of grapes as the summer goes. */
function pergola(P) {
  const f = P.f, lf = P.L.leaf;
  let s = P.fill('M30 380V150H40V380Z', '#6a5038', { w: .7 }) + P.shade('M36 380V150H40V380Z', '#6a5038', .25);
  s += P.fill('M14 146H128V154H14Z', '#6a5038', { w: .6 }) + P.fill('M80 154V380H86V154Z', '#6a5038', { w: .6 });
  s += P.line('M34 360C26 300 46 260 34 200C28 170 40 160 36 150', '#5a4030', 2.4) + P.line('M84 360C78 300 92 250 82 190C78 170 86 160 84 154', '#5a4030', 2);
  if (!lf.leaf) return s + P.line('M20 150C40 168 70 160 100 170M60 152C70 172 96 178 120 168', '#5a4030', 1.2);
  const R = P.rng(77);
  const leafAt = (x, y, r, a, c) => `<path d="M${f(x)} ${f(y)}c${f(-r)} ${f(-r * .3)} ${f(-r * 1.1)} ${f(-r * 1.2)} ${f(-r * .3)} ${f(-r * 1.4)}c${f(r * .2)} ${f(r * .4)} ${f(r * .5)} ${f(r * .2)} ${f(r * .6)} ${f(-r * .1)}c${f(r * .2)} ${f(r * .4)} ${f(r * .6)} ${f(r * .5)} ${f(r * .9)} ${f(r * .3)}c${f(r * .2)} ${f(r * .7)} ${f(-r * .3)} ${f(r * 1.2)} ${f(-r * 1.2)} ${f(r * 1.2)}Z" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".5"/>`;
  let g = '';
  const spots = [];
  for (let i = 0; i < 34; i++) spots.push([14 + R() * 120, 148 + R() * 16 + (R() < .5 ? R() * 50 : 0)]);
  for (let i = 0; i < 26; i++) spots.push([24 + R() * 22, 160 + R() * 150]);
  for (let i = 0; i < 16; i++) spots.push([74 + R() * 22, 170 + R() * 110]);
  for (const [x, y] of spots) { const t = R(); g += leafAt(x, y, 5 + R() * 3, R() * 360, t < .45 ? lf.leaf : t < .75 ? lf.dark : lf.light); }
  const ripe = P.st?.season === 'autumn' || (P.st?.progress ?? 0) > .5;
  for (const [x, y] of [[52, 166], [104, 170], [44, 230], [92, 214]]) for (let k = 0; k < 7; k++) g += `<circle cx="${f(x + (k % 3) * 2.4 - (k > 5 ? -2.4 : 0))}" cy="${f(y + Math.floor(k / 3) * 2.4)}" r="1.5" fill="${P.ink(ripe ? '#4a3a7a' : '#8aa85a')}" stroke="${P.keyC()}" stroke-width=".25"/>`;
  return s + g;
}
