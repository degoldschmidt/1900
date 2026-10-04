// Vlissingen from the Boulevard, looking along the sea front toward the harbour mouth: Michiel de Ruyter in bronze on
// his pedestal, the Gevangentoren's round brick and its tall slate hat, the Oranjemolen turning on the dyke, the light
// on the pier head; the Westerschelde wide and grey-green, Flanders a line on the far side. The night boat of the
// Zeeland company stands out for Folkestone, brown-sailed hoogaarsen beat in from the fishing, gulls; on the sands the
// bathing huts, on the Boulevard summer visitors in white and Zeeland women in their lace caps and gold.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

export default {
  id: 'FLU',
  greet: 'GROETEN uit VLISSINGEN',
  nation: 'NL',
  flag: 'NL',
  flower: 'sea-thrift',
  flower2: 'sea-lavender',
  frame: { band: ['#809eb3', '#465866'], gold: '#d6b462', ink: '#7a3a1a', leaf: ['#7f9f6a', '#3d5a44'], year: '#6e3a1e', halo: '#f6ecd4' },
  horizon: 234,
  clouds: 5,
  wind: -1,
  birds: { c: '#f5f4ee', n: 6, y: 128, s: 1.2 },
  pal: {
    key: '#29272a', brick: '#a2563e', brick2: '#8a4836', slate: '#4f5866', stone: '#d8ccb0', stone2: '#b4a688', bronze: '#3f5248', wall: '#e8dcc2',
    wall2: '#d9b68e', wall3: '#c9cdbf', roof: '#8c4636', sand: '#e2d2a6', water: '#6b8f8a', ground: '#cdbfa2', glass: '#37444f', sash: '#ede5d1', iron: '#2b3a3c', gold: '#d5a83e',
  },

  // sea-thrift: a round head of pink florets on a bare stalk, a tuft of grassy leaves
  flowerArt(F) {
    const I = F.I;
    let s = '';
    for (const a of [200, 215, 160, 145, 230, 128]) s += F.leaf(24, 3.6, a, a % 2 ? I.leaf[0] : I.leaf[1], { shape: 'lance' });
    s += F.stem('M-2 12Q-6 0 -8 -10', I.leaf[1], 1.1) + F.stem('M2 12Q6 2 9 -4', I.leaf[1], 1.1);
    const head = (x, y, r, n) => F.at(x, y, `<circle r="${r}" fill="#e7a2b8" stroke="${I.key}" stroke-width=".5"/>` + F.cluster(r * .85, n, r * .26, ['#d8708e', '#f2b8ca', '#e48aa4', '#c85a7a'], { petals: 5, seed: n }), 0);
    s += head(-8, -14, 8.6, 18) + head(9.5, -6, 6.6, 12);
    s += F.at(-8, -5, '<path d="M-4 0Q0 3 4 0L2 2Q0 3 -2 2Z" fill="#c8b48a" stroke="#3a2e1e" stroke-width=".4"/>', 0);
    return s;
  },
  // sea-lavender: branching sprays of violet florets over a rosette of leaves
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 8, 210, I.leaf[1], { shape: 'oval' }) + F.leaf(15, 7, 150, I.leaf[0], { shape: 'oval' }) + F.leaf(12, 6, 180, I.leaf[1], { shape: 'oval' });
    s += F.stem('M0 4Q-3 -6 -11 -13', I.leaf[1], 1.1) + F.stem('M0 4Q3 -7 11 -14', I.leaf[1], 1.1) + F.stem('M0 4Q0 -9 0 -19', I.leaf[1], 1.1) + F.stem('M-1 -4Q-6 -10 -5 -18', I.leaf[1], .8) + F.stem('M1 -5Q6 -10 6 -19', I.leaf[1], .8);
    for (const [x, y, r] of [[-11, -13, 4.2], [-7, -8, 3.4], [11, -14, 4.2], [7, -9, 3.4], [0, -19, 4.4], [0, -12, 3.6], [-5, -18, 3.4], [6, -19, 3.4], [-3, -3, 2.8], [3, -3, 2.8]]) s += F.cluster(r, 7, 1.6, ['#9a7ac8', '#b8a0dc', '#7a5aa8', '#d0c0ea'], { seed: Math.round(x * 7 + y * 3 + 50) });
    return s;
  },

  back(P, T) {
    let s = '';
    // Flanders across the estuary: a low line, the church at Breskens, a few trees
    s += P.far(.94, () => P.fill('M26 234L60 230H240L300 232L320 234Z', '#8fa298', { w: .3 }) + P.fill(P.rect(132, 222, 3, 9), '#8a8f94', { w: .2 }) + P.fill(P.spire(133.5, 223, 4, 8), '#8a8f94', { w: .2 }));
    s += P.water(234, 312, { seed: 21, shimmer: 11, x0: 280, x1: 560 });
    // the harbour's pier head and its light; the town along the dyke, the mill, the prison tower
    s += P.far(.7, () => pier(P, 300, 362, 250));
    s += P.far(.62, () => town(P));
    s += P.far(.5, () => molen(P, 252, 262, .9));
    s += P.far(.5, () => P.spin(sails(P, 30), { x: 252, y: 218.8, dur: 14, dir: -1 }));
    s += P.far(.4, () => gevangentoren(P, 192, 282, 1));
    s += P.far(.45, () => P.tree(232, 276, .62, 'round') + P.tree(284, 266, .5, 'round'));
    // boats: the steamer for Folkestone far out, hoogaarsen coming in
    s += P.far(.5, () => P.cross(mailboat(P, 1, .62), { y: 247, dir: 1, dur: 150, rest: .3, offset: 30, x0: 300 }));
    s += P.far(.6, () => P.cross(fullRigger(P, -1, .62), { y: 240, dir: -1, dur: 240, rest: .15, offset: 100, x0: 300 }));
    s += P.far(.55, () => P.cross(T.steamer({ s: .36, dir: -1, hull: '#3a2f2a', house: '#e8dcc4', funnel: ['#2a2622', '#c8463a'], flag: 'BE' }), { y: 242, dir: -1, dur: 130, rest: .4, offset: 10, x0: 300 }));
    s += P.cross(T.sail({ s: .52, rig: 'gaff', sailC: '#8a4a2c', hull: '#2b2a28', strake: '#d8b45a', dir: -1 }), { y: 258, dir: -1, dur: 120, rest: .2, offset: 12, x1: 590 });
    s += P.cross(T.sail({ s: .7, rig: 'sprit', sailC: '#9a5432', hull: '#3a2f26', strake: '#2f6a4a', dir: -1 }), { y: 272, dir: -1, dur: 96, rest: .3, offset: 60, x1: 590 });
    s += P.cross(T.rowboat({ s: .7, dir: 1, hull: '#4a5a6a', shirt: '#2a3a5a' }), { y: 290, dir: 1, dur: 80, rest: .4, offset: 5, x0: 290 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the sands below the Boulevard: the tide's edge, the bathing huts, bathers
    s += P.fill('M300 292Q420 288 590 290V330H300Z', 'sand', { k: false }) + P.lite('M300 292Q420 288 590 290V294Q420 292 300 296Z', 'sand', .4);
    s += P.line('M300 293Q420 289 590 291', '#f4f2ea', 1.4, { op: .8 });
    if (P.L.snow) s += P.flat('M300 292Q420 288 590 290V330H300Z', '#eef2f4', { op: .7 });
    // the bathing season: huts, chairs and bathers in summer, fewer in spring and autumn, none in winter
    const season = P.st?.season ?? 'summer', all = [[330, 312, '#c8463a'], [356, 314, '#2f5a8a'], [382, 312, '#c8463a'], [436, 306, '#d8a83a'], [460, 312, '#2f5a8a'], [500, 308, '#c8463a'], [532, 313, '#3a7a5a']];
    if (season === 'winter') s += P.crowd(420, 520, 304, 2, { s: .42, seed: 3, kinds: ['gent', 'worker'] });
    else {
      s += huts(P, season === 'summer' ? all : all.filter((_, i) => i % 2 === 0));
      if (season === 'summer') s += strandstoel(P, 418, 318, .9) + strandstoel(P, 476, 322, 1) + strandstoel(P, 560, 320, .95);
      s += P.crowd(400, 560, 302, season === 'summer' ? 6 : 3, { s: .42, seed: 8, kinds: season === 'summer' ? ['girl', 'child', 'lady', 'boater', 'child'] : ['gent', 'lady'] });
      if (season === 'summer') s += P.cross(machine(P, 1, .8), { y: 298, dir: 1, dur: 140, rest: .2, offset: 30, x0: 300, x1: 600 });
    }
    s += P.cross(T.walkers({ kinds: ['child', 'girl'], s: .5, dir: -1, seed: 2 }), { y: 304, dir: -1, dur: 90, offset: 50, x0: 300, x1: 600 });
    // the town's own sea wall on the left, curving off toward the harbour
    s += P.fill('M14 330L14 300Q120 288 300 262H312Q150 300 120 330Z', 'stone2', { w: .6 }) + P.shade('M14 318Q120 300 280 266H300Q140 304 110 330H14Z', 'stone2', .2);
    return s;
  },

  front(P, T) {
    let s = '';
    // the Boulevard: its railing along the sea wall, the brick paving, lamps and benches
    s += P.fill('M14 326H590V334H14Z', 'stone', { w: .6 }) + P.lite('M14 326H590V328H14Z', 'stone', .35);
    s += P.paving(334, 380, { c: 'ground', vx: 300, seed: 14 });
    let rail = '';
    for (let x = 130; x < 590; x += 13) rail += `M${x} 326V313`;
    s += P.line(rail, 'iron', 1.1) + P.line('M128 314H590M128 320H590', 'iron', 1);
    for (const x of [236, 412]) s += P.lamp(x, 330, 1.1, 'single', { h: 72 }) + P.flagAt(x + 1, 276);
    s += bench(P, 300, 344) + bench(P, 470, 344);
    s += P.flag(520, 330, 1.5, 'NL', { h: 52 });
    s += border(P, 130, 590, 334);
    s += P.tree(34, 334, 2.2, 'round');
    // Michiel de Ruyter, looking out to sea from his pedestal
    s += ruyter(P, 102, 352, 1);
    s += P.wall(84, 300, 14, 18);
    // people on the Boulevard: Zeeland women, a fisherman, summer visitors
    s += P.setStreet(356, 30, 570, 1.05);
    s += zeeuwse(P, 190, 362, 1.16, '#1f1f24') + zeeuwse(P, 204, 364, .94, '#2a3a5a');
    s += P.person(286, 344, 1.04, 'gent', { c: '#2a2c34' }) + P.person(312, 344, 1.04, 'lady', { c: '#e8e0ce', dir: -1 });
    s += P.crowd(130, 270, 341, 5, { s: .96, seed: 27, kinds: ['lady', 'boater', 'girl', 'gent', 'lady'] }) + P.crowd(330, 440, 341, 4, { s: .96, seed: 31, kinds: ['lady', 'gent', 'child', 'lady'] });
    s += P.person(458, 344, 1.04, 'boater', { c: '#f0ebdd', legs: '#efe8d6' }) + P.person(484, 344, 1.04, 'lady', { c: '#c9d6e6', dir: -1 });
    s += P.person(372, 366, 1.18, 'sailor', { c: '#22304a', legs: '#22304a' }) + P.person(538, 368, 1.16, 'lady', { c: '#f4efe4', parasol: '#e8b9c4', dir: -1 }) + P.person(552, 370, .86, 'child', { c: '#c8463a', dir: -1 });
    s += P.cross(T.walkers({ kinds: ['lady', 'gent'], s: 1.12, dir: 1, seed: 22, dresses: ['#f3eee2', '#e8d4e0'] }), { y: 370, dir: 1, dur: 84, offset: 18, z: 'fore' });
    s += P.cross(T.fiacre({ s: .9, horses: 1, body: '#2a2a2e', hood: '#8a6a46', dir: -1, horse: '#8a5a3a' }), { y: 350, dir: -1, dur: 56, rest: .4, offset: 40 });
    return s;
  },
};

// ---------- the town ----------
/** The sea front of the old town curving away to the harbour: tall brick and plastered houses, gables. */
function town(P) {
  let s = '';
  const fronts = [[14, 300, 34, 92], [46, 296, 30, 84], [74, 292, 30, 76], [102, 288, 26, 70], [126, 284, 24, 62], [148, 281, 22, 56], [168, 278, 20, 50], [212, 272, 18, 40], [228, 270, 16, 34], [262, 266, 14, 28], [276, 264, 14, 24], [290, 262, 12, 20]];
  for (const [i, [x, by, w, h]] of fronts.entries()) {
    const c = ['wall', 'brick', 'wall2', 'wall3', 'brick2', 'wall'][i % 6];
    s += P.facade(x, by, w + .6, h, { c, roof: i % 3 === 1 ? 'gable' : 'pitch', roofC: 'roof', side: w * .16, shop: i === 1 ? ['#2f5a8a', '#f2ead6'] : i === 3 ? ['#c8463a', '#f2ead6'] : null, flagChance: .8 });
  }
  return s;
}
/** The pier head at the harbour mouth: a stone mole, the light on its iron tower. */
function pier(P, x0, x1, y) {
  const f = P.f;
  let d = P.fill(`M${x0} ${y}H${x1}V${y + 4}H${x0}Z`, 'stone2', { w: .4 });
  const lx = x1 - 10;
  d += P.line(`M${lx - 5} ${y}L${lx - 2} ${y - 26}M${lx + 5} ${y}L${lx + 2} ${y - 26}M${lx - 4} ${y - 8}H${lx + 4}M${lx - 3} ${y - 17}H${lx + 3}`, '#e8e2d2', 1.1);
  d += P.fill(P.rect(lx - 3.4, y - 33, 6.8, 7), '#c8463a', { w: .4 }) + P.fill(P.dome(lx, y - 33, 3.6, 3), '#2a2a2a', { w: .3 });
  const on = P.L.lamps > .05;
  d += `<rect x="${f(lx - 2.4)}" y="${f(y - 31.6)}" width="4.8" height="3.6" fill="${on ? P.glow('#fff1b0') : P.ink('#e8e2d2')}"/>`;
  if (on) P.glows.push({ x: lx, y: y - 30, r: 22, depth: P.depth });
  d += P.fill(P.rect(x0 + 6, y - 6, 18, 6), 'wall', { w: .35 }) + P.fill(P.gable(x0 + 5, y - 6, 20, 5), 'roof', { w: .3 });
  return d;
}
/** The Oranjemolen: a round brick tower mill with its stage; the sails turn on their own. */
function molen(P, cx, by, s) {
  const f = P.f;
  let d = P.fill(`M${f(cx - 15 * s)} ${by}L${f(cx - 10 * s)} ${f(by - 44 * s)}H${f(cx + 10 * s)}L${f(cx + 15 * s)} ${by}Z`, 'brick') + P.shade(`M${f(cx + 3 * s)} ${by}L${f(cx + 3 * s)} ${f(by - 44 * s)}H${f(cx + 10 * s)}L${f(cx + 15 * s)} ${by}Z`, 'brick', .25);
  d += P.fill(P.arch(cx - 3 * s, by - 12 * s, 6 * s, 12 * s), '#3a2f2a', { w: .3 }) + P.fill(P.rect(cx - 2 * s, by - 32 * s, 4 * s, 5 * s), 'glass', { w: .3 });
  // the stage round the tower, its rail
  d += P.fill(P.rect(cx - 19 * s, by - 24 * s, 38 * s, 2 * s), '#5a4a3a', { w: .4 }) + P.line(`M${f(cx - 19 * s)} ${f(by - 28 * s)}H${f(cx + 19 * s)}M${f(cx - 18 * s)} ${f(by - 24 * s)}V${f(by - 28 * s)}M${f(cx + 18 * s)} ${f(by - 24 * s)}V${f(by - 28 * s)}`, '#5a4a3a', .6);
  // the cap, thatched and dark, the windshaft's head
  d += P.fill(`M${f(cx - 12 * s)} ${f(by - 44 * s)}Q${f(cx - 11 * s)} ${f(by - 54 * s)} ${f(cx)} ${f(by - 55 * s)}Q${f(cx + 11 * s)} ${f(by - 54 * s)} ${f(cx + 12 * s)} ${f(by - 44 * s)}Z`, '#4a3e34', { w: .5 });
  d += `<circle cx="${cx}" cy="${f(by - 48 * s)}" r="${f(2.6 * s)}" fill="${P.ink('#3a3028')}"/>`;
  if (P.L.snow) d += P.flat(`M${f(cx - 11 * s)} ${f(by - 47 * s)}Q${f(cx)} ${f(by - 56 * s)} ${f(cx + 11 * s)} ${f(by - 47 * s)}Z`, '#f4f7fa', { op: .85 });
  return d;
}
/** The mill's four sails, lattice and canvas, for P.spin about the windshaft. */
function sails(P, r) {
  const W = r * 2 + 4, c = W / 2, f = P.f;
  let b = '';
  for (let i = 0; i < 4; i++) {
    const a = i * 90 + 18;
    let g = `<path d="M0 -2V${f(-r)}" stroke="${P.ink('#4a3a2c')}" stroke-width="1.2"/>`;
    g += `<path d="M1 ${f(-r * .22)}V${f(-r)}H${f(r * .24)}V${f(-r * .22)}Z" fill="${P.ink('#f0e8d4')}" stroke="${P.ink('#4a3a2c')}" stroke-width=".5"/>`;
    for (let k = 1; k < 7; k++) g += `<path d="M1 ${f(-r * (.22 + k * .11))}H${f(r * .24)}" stroke="${P.ink('#7a6a52')}" stroke-width=".35"/>`;
    g += `<path d="M${f(r * .12)} ${f(-r * .22)}V${f(-r)}" stroke="${P.ink('#7a6a52')}" stroke-width=".3"/>`;
    b += `<g transform="translate(${f(c)} ${f(c)}) rotate(${a})">${g}</g>`;
  }
  b += `<circle cx="${f(c)}" cy="${f(c)}" r="2" fill="${P.ink('#3a3028')}"/>`;
  return { svg: doc(f(W), f(W), b), w: W, h: W, ax: c, ay: c };
}
/** The Gevangentoren: a squat round tower of brick under a tall slate cone, a stair turret, a little dormer. */
function gevangentoren(P, cx, by, s) {
  const f = P.f, r = 24 * s, top = by - 70 * s;
  let d = P.fill(`M${f(cx - r)} ${by}V${f(top)}H${f(cx + r)}V${by}Z`, 'brick') + P.shade(P.rect(cx + r * .3, top, r * .7, by - top), 'brick', .25) + P.lite(P.rect(cx - r * .8, top, r * .3, by - top), 'brick', .12);
  d += P.stipple(P.rect(cx - r, top, 2 * r, by - top), 'brick', 50, { box: [cx - r, top, 2 * r, by - top], op: .35 });
  for (let k = 1; k < 5; k++) d += P.line(`M${f(cx - r)} ${f(top + k * 14 * s)}Q${cx} ${f(top + k * 14 * s + 3 * s)} ${f(cx + r)} ${f(top + k * 14 * s)}`, 'brick2', .5, { op: .6 });
  d += P.windows(cx - r * .7, top + 10 * s, r * 1.4, 44 * s, 3, 3, { arched: true, ww: .35, wh: .55, lit: .8 });
  d += P.fill(P.arch(cx - 5 * s, by - 16 * s, 10 * s, 16 * s), '#3a2a22', { w: .4 });
  // the stone band, the corbelled parapet and the cone
  d += P.fill(P.rect(cx - r - 2 * s, top - 4 * s, 2 * r + 4 * s, 5 * s), 'stone', { w: .45 });
  d += P.fill(`M${f(cx - r - 1 * s)} ${f(top - 4 * s)}L${cx} ${f(top - 74 * s)}L${f(cx + r + 1 * s)} ${f(top - 4 * s)}Z`, 'slate', { w: .6 }) + P.shade(`M${cx} ${f(top - 74 * s)}L${f(cx + r + 1 * s)} ${f(top - 4 * s)}H${f(cx + 4 * s)}Z`, 'slate', .25);
  for (let k = 1; k < 6; k++) d += P.line(`M${f(cx - (r + 1) * (1 - k / 7))} ${f(top - 4 * s - 70 * s * k / 7)}H${f(cx + (r + 1) * (1 - k / 7))}`, P.light('slate', .2), .4, { op: .6 });
  d += P.fill(P.rect(cx - 9 * s, top - 22 * s, 7 * s, 9 * s), 'stone', { w: .35 }) + P.fill(P.gable(cx - 10 * s, top - 22 * s, 9 * s, 5 * s), 'slate', { w: .3 }) + P.fill(P.rect(cx - 7.4 * s, top - 20 * s, 3.8 * s, 5 * s), 'glass', { w: .2 });
  // the stair turret on the landward side
  d += P.fill(P.rect(cx + r - 4 * s, top - 14 * s, 9 * s, by - top + 14 * s), 'brick', { w: .45 }) + P.fill(P.spire(cx + r + .5 * s, top - 14 * s, 11 * s, 22 * s), 'slate', { w: .4 });
  d += P.line(`M${cx} ${f(top - 74 * s)}v${f(-6 * s)}`, 'gold', .9) + `<circle cx="${cx}" cy="${f(top - 80 * s)}" r="${f(1.2 * s)}" fill="${P.ink('gold')}"/>`;
  if (P.L.snow) d += P.flat(`M${f(cx - r * .9)} ${f(top - 8 * s)}L${cx} ${f(top - 70 * s)}L${f(cx - 4 * s)} ${f(top - 8 * s)}Z`, '#f4f7fa', { op: .8 });
  return d;
}

// ---------- the sea ----------
/** A mail steamer of the Zeeland company: black hull, white houses, two buff funnels with black tops. */
function mailboat(P, dir, s) {
  const W = 150 * s, H = 64 * s, S = (k) => P.f(k * s), f = P.f, lit = P.L.windows > .2;
  let b = P.line(`M${S(36)} ${S(40)}L${S(33)} ${S(4)}M${S(122)} ${S(40)}L${S(119)} ${S(8)}`, '#4a3a2e', .9 * s) + P.line(`M${S(33)} ${S(6)}L${S(119)} ${S(10)}`, '#4a4a4a', .3 * s, { op: .6 });
  for (const fx of [62, 86]) b += P.fill(`M${S(fx)} ${S(40)}L${S(fx + 3)} ${S(14)}H${S(fx + 15)}L${S(fx + 13)} ${S(40)}Z`, '#dcb468', { w: .5 }) + P.fill(`M${S(fx + 2.6)} ${S(18)}L${S(fx + 3)} ${S(14)}H${S(fx + 15)}L${S(fx + 14.6)} ${S(18)}Z`, '#232222', { w: .35 });
  b += P.fill(`M${S(30)} ${S(46)}V${S(36)}H${S(124)}V${S(46)}Z`, '#f2ede2', { w: .5 }) + P.fill(`M${S(46)} ${S(37)}V${S(31)}H${S(108)}V${S(37)}Z`, '#f2ede2', { w: .45 });
  for (let i = 0; i < 14; i++) b += `<rect x="${S(33 + i * 6.4)}" y="${S(39.4)}" width="${S(3)}" height="${S(2.8)}" fill="${lit ? P.glow('#ffd88a') : P.ink('#3e4a58')}"/>`;
  for (let i = 0; i < 5; i++) b += P.fill(`M${S(50 + i * 12)} ${S(31)}q${S(4)} ${S(-3)} ${S(8)} 0Z`, '#f6f2ea', { w: .3 });
  b += P.fill(`M${S(4)} ${S(46)}H${S(140)}Q${S(146)} ${S(44)} ${S(148)} ${S(42)}L${S(140)} ${S(58)}H${S(16)}Q${S(7)} ${S(56)} ${S(4)} ${S(46)}Z`, '#26272a', { w: .6 });
  b += P.line(`M${S(8)} ${S(48)}H${S(141)}`, '#efe8d8', .8 * s) + P.fill(`M${S(10)} ${S(55)}H${S(141)}L${S(140)} ${S(58)}H${S(16)}Z`, '#a8382e', { w: .3 });
  for (let i = 0; i < 16; i++) b += `<circle cx="${S(18 + i * 7.6)}" cy="${S(51.6)}" r="${S(.9)}" fill="${lit && i % 3 ? P.glow('#ffd88a') : P.ink('#5a6470')}"/>`;
  b += P.line(`M${S(6)} ${S(46)}V${S(34)}`, '#3a2a1e', .6 * s) + `<g transform="translate(${S(6)} ${S(34)}) scale(-1 1)"><rect width="${S(9)}" height="${S(2)}" fill="${P.ink('#c8102e')}"/><rect y="${S(2)}" width="${S(9)}" height="${S(2)}" fill="${P.ink('#f4f1e8')}"/><rect y="${S(4)}" width="${S(9)}" height="${S(2)}" fill="${P.ink('#21468b')}"/></g>`;
  if (P.L.lamps > .05) b += `<circle cx="${S(33)}" cy="${S(7)}" r="${S(1.4)}" fill="${P.glow('#fff2c0')}"/><circle cx="${S(119)}" cy="${S(11)}" r="${S(1.4)}" fill="${P.glow('#fff2c0')}"/>`;
  b += P.line(`M${S(140)} ${S(58)}q${S(6)} ${S(1)} ${S(10)} ${S(3)}M${S(4)} ${S(56)}q${S(-6)} ${S(2)} ${S(-6)} ${S(4)}`, '#f4f4f0', .8 * s, { op: .7 });
  const fun = (fx) => (dir > 0 ? (fx + 9) * s : W - (fx + 9) * s);
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 57 * s, puffs: [[fun(62), 13 * s, 1.1 * s, true, -dir], [fun(86), 13 * s, 1.1 * s, true, -dir]] };
}

/** A full-rigged ship standing up the Scheldt for Antwerp, all plain sail set. */
function fullRigger(P, dir, s) {
  const W = 120 * s, H = 118 * s, S = (k) => P.f(k * s), f = P.f;
  let b = '';
  // stays and the jibs
  b += P.line(`M${S(28)} ${S(10)}L${S(110)} ${S(86)}M${S(28)} ${S(30)}L${S(116)} ${S(88)}`, '#5a4a3a', .4 * s);
  for (const [y0, y1] of [[34, 84], [46, 86]]) b += P.fill(`M${S(30 + (y0 - 30) * .9)} ${S(y0)}L${S(106 + (y1 - 84) * 2)} ${S(y1)}L${S(84)} ${S(y1)}Z`, '#f2ecdc', { w: .4 });
  // the masts, square sails stacked on each, the spanker aft
  for (const [mx, top, k] of [[30, 6, 1], [60, 2, 1.06], [88, 12, .9]]) {
    b += P.line(`M${S(mx)} ${S(96)}V${S(top)}`, '#5a4632', 1.1 * s);
    for (let i = 0; i < 5; i++) {
      const y0 = top + 6 + i * 15 * k, hh = 13 * k, w0 = (13 - i * .4) * k * (i === 4 ? 1.2 : 1), w1 = w0 * 1.12;
      b += P.fill(`M${S(mx - w0)} ${S(y0)}H${S(mx + w0)}Q${S(mx + w1 + 1)} ${S(y0 + hh / 2)} ${S(mx + w1)} ${S(y0 + hh)}H${S(mx - w1)}Q${S(mx - w1 + 1.6)} ${S(y0 + hh / 2)} ${S(mx - w0)} ${S(y0)}Z`, i % 2 ? '#efe8d6' : '#f6f1e4', { w: .4 });
      b += P.shade(`M${S(mx + w0 * .3)} ${S(y0)}H${S(mx + w0)}Q${S(mx + w1 + 1)} ${S(y0 + hh / 2)} ${S(mx + w1)} ${S(y0 + hh)}H${S(mx + w1 * .3)}Z`, '#f2ecdc', .12);
    }
  }
  b += P.fill(`M${S(88)} ${S(50)}L${S(104)} ${S(58)}L${S(104)} ${S(86)}L${S(88)} ${S(86)}Z`, '#efe8d6', { w: .4 }).replace('88)} ${S(50', '88)} ${S(50');
  // the hull: black, a white band of painted ports, the bowsprit
  b += P.line(`M${S(6)} ${S(88)}L${S(28)} ${S(92)}`, '#5a4632', 1.4 * s);
  b += P.fill(`M${S(8)} ${S(90)}Q${S(4)} ${S(88)} ${S(2)} ${S(86)}L${S(14)} ${S(102)}H${S(108)}Q${S(116)} ${S(98)} ${S(118)} ${S(90)}Z`, '#26272a', { w: .55 });
  b += P.line(`M${S(10)} ${S(94)}H${S(114)}`, '#efe8d8', 1.2 * s) + P.line(`M${S(16)} ${S(101)}H${S(106)}`, '#a8382e', .8 * s);
  b += P.line(`M${S(118)} ${S(88)}V${S(78)}`, '#3a2a1e', .5 * s) + `<rect x="${S(118)}" y="${S(78)}" width="${S(6)}" height="${S(4)}" fill="${P.ink('#21468b')}"/>`;
  return { svg: doc(f(W), f(H), flip(-dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 101 * s };
}

// ---------- the sands ----------
/** Bathing huts on their wheels, striped canvas roofs, numbered. */
function huts(P, list) {
  const f = P.f;
  let d = '';
  for (const [x, by, c] of list) {
    d += P.fill(P.rect(x - 8, by - 15, 16, 12), '#f2ece0', { w: .5 }) + P.shade(P.rect(x + 3, by - 15, 5, 12), '#f2ece0', .14);
    for (let k = 0; k < 3; k++) d += P.flat(P.rect(x - 7.4 + k * 5.6, by - 15, 2.4, 12), c, { op: .9 });
    d += P.fill(`M${x - 10} ${by - 15}Q${x} ${by - 23} ${x + 10} ${by - 15}Z`, c, { w: .5 }) + P.fill(P.rect(x - 2.4, by - 12, 4.8, 9), '#3a3430', { w: .3 });
    d += `<circle cx="${x - 5}" cy="${by - 1.6}" r="2.2" fill="none" stroke="${P.ink('#4a3a2c')}" stroke-width=".8"/><circle cx="${x + 5}" cy="${by - 1.6}" r="2.2" fill="none" stroke="${P.ink('#4a3a2c')}" stroke-width=".8"/>`;
    if (P.L.snow) d += P.flat(`M${x - 10} ${by - 16}Q${x} ${by - 23} ${x + 10} ${by - 16}Z`, '#f4f7fa', { op: .9 });
  }
  return d;
}
/** A bathing machine drawn down to the water by its old white horse. */
function machine(P, dir, s) {
  const W = 52 * s, H = 32 * s, S = (k) => P.f(k * s), f = P.f;
  const frame = (st) => {
    let b = P.fill(`M${S(4)} ${S(24)}V${S(10)}H${S(22)}V${S(24)}Z`, '#f2ece0', { w: .5 });
    for (let k = 0; k < 3; k++) b += P.flat(`M${S(5 + k * 6)} ${S(10)}h${S(2.6)}v${S(14)}h${S(-2.6)}Z`, '#2f5a8a', { op: .9 });
    b += P.fill(`M${S(2)} ${S(10)}Q${S(13)} ${S(2)} ${S(24)} ${S(10)}Z`, '#2f5a8a', { w: .5 });
    b += `<circle cx="${S(8)}" cy="${S(26)}" r="${S(3.4)}" fill="none" stroke="${P.ink('#4a3a2c')}" stroke-width="${S(.9)}"/><circle cx="${S(19)}" cy="${S(26)}" r="${S(3.4)}" fill="none" stroke="${P.ink('#4a3a2c')}" stroke-width="${S(.9)}"/>`;
    b += P.line(`M${S(22)} ${S(20)}L${S(32)} ${S(19)}`, '#4a3a2c', .8 * s);
    const sw = st ? 2.4 : -2;
    b += P.line(`M${S(34)} ${S(20)}l${S(-sw)} ${S(9)}M${S(44)} ${S(20)}l${S(sw)} ${S(9)}`, '#d8d2c4', 1.8 * s);
    b += P.fill(`M${S(31)} ${S(21)}Q${S(30)} ${S(15)} ${S(36)} ${S(15)}H${S(44)}Q${S(48)} ${S(15)} ${S(48)} ${S(19)}L${S(51)} ${S(10)}L${S(53)} ${S(12)}L${S(49)} ${S(22)}Q${S(40)} ${S(24)} ${S(31)} ${S(21)}Z`, '#e2dccd', { w: .5 });
    b += P.fill(P.rect(36 * s, 8 * s, 3.4 * s, 7 * s), '#2a3a5a', { w: .35 }) + `<circle cx="${S(37.7)}" cy="${S(6)}" r="${S(1.6)}" fill="${P.ink('#e2bf9c')}"/>`;
    return flip(dir, f(W), b);
  };
  return { frames: [frame(0), frame(1)].map((b) => doc(f(W), f(H), b)), fps: 2, w: W, h: H, ax: W / 2, ay: 29 * s };
}

// ---------- the Boulevard ----------
/** Michiel de Ruyter in bronze on his granite pedestal, the railing round its foot. */
function ruyter(P, x, by, s) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(by - k * s), S = (k) => f(k * s);
  let d = '';
  // steps and pedestal
  d += P.fill(`M${X(-30)} ${Y(0)}V${Y(8)}H${X(30)}V${Y(0)}Z`, 'stone2', { w: .6 }) + P.fill(`M${X(-24)} ${Y(8)}V${Y(16)}H${X(24)}V${Y(8)}Z`, 'stone', { w: .6 });
  d += P.fill(`M${X(-17)} ${Y(16)}V${Y(26)}H${X(17)}V${Y(16)}Z`, 'stone2', { w: .55 });
  d += P.fill(`M${X(-13)} ${Y(26)}V${Y(118)}H${X(13)}V${Y(26)}Z`, 'stone') + P.shade(`M${X(5)} ${Y(26)}V${Y(118)}H${X(13)}V${Y(26)}Z`, 'stone', .2);
  d += P.stipple(P.rect(x - 13 * s, by - 118 * s, 26 * s, 92 * s), 'stone', 40, { box: [x - 13 * s, by - 118 * s, 26 * s, 92 * s], op: .3 });
  d += P.fill(P.rect(x - 9 * s, by - 96 * s, 18 * s, 22 * s), 'stone2', { w: .4 }) + P.line(`M${X(-6)} ${Y(90)}h${S(12)}M${X(-6)} ${Y(85)}h${S(12)}M${X(-4)} ${Y(80)}h${S(8)}`, 'bronze', .9 * s);
  d += P.fill(`M${X(-16)} ${Y(118)}V${Y(126)}H${X(16)}V${Y(118)}Z`, 'stone2', { w: .55 }) + P.fill(`M${X(-12)} ${Y(126)}V${Y(130)}H${X(12)}V${Y(126)}Z`, 'stone', { w: .45 });
  // the admiral: cloak, sash, his baton toward the sea, the broad hat
  const c = 'bronze';
  d += P.fill(`M${X(-6)} ${Y(130)}L${X(-7)} ${Y(158)}Q${X(0)} ${Y(162)} ${X(6)} ${Y(158)}L${X(6)} ${Y(130)}Z`, c, { w: .55 });
  d += P.fill(`M${X(-9)} ${Y(130)}Q${X(-12)} ${Y(146)} ${X(-7)} ${Y(162)}L${X(-3)} ${Y(160)}Q${X(-7)} ${Y(146)} ${X(-4)} ${Y(130)}Z`, c, { w: .5 }) + P.lite(`M${X(-8)} ${Y(132)}Q${X(-10)} ${Y(146)} ${X(-6)} ${Y(160)}L${X(-5)} ${Y(158)}Q${X(-8)} ${Y(146)} ${X(-6)} ${Y(132)}Z`, c, .3);
  d += P.line(`M${X(-5)} ${Y(156)}L${X(5)} ${Y(140)}`, '#8a7a4a', 1.4 * s);
  d += P.fill(`M${X(5)} ${Y(158)}L${X(16)} ${Y(162)}L${X(16)} ${Y(159)}L${X(6)} ${Y(154)}Z`, c, { w: .45 }) + P.line(`M${X(15)} ${Y(161)}L${X(22)} ${Y(163)}`, c, 1.4 * s);
  d += `<circle cx="${X(0)}" cy="${Y(166)}" r="${f(3.6 * s)}" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".55"/>`;
  d += P.fill(`M${X(-7)} ${Y(168)}Q${X(0)} ${Y(166)} ${X(7)} ${Y(168)}Q${X(5)} ${Y(170)} ${X(3)} ${Y(170)}Q${X(1)} ${Y(174)} ${X(-3)} ${Y(170)}Q${X(-5)} ${Y(170)} ${X(-7)} ${Y(168)}Z`, c, { w: .5 });
  // the railing round the foot
  let r = '';
  for (let k = -30; k <= 30; k += 6) r += `M${X(k)} ${Y(0)}V${Y(10)}`;
  d += P.line(r, 'iron', .9) + P.line(`M${X(-31)} ${Y(9)}H${X(31)}`, 'iron', 1);
  return d;
}
/** A hooded wicker beach chair, striped canvas in the hood. */
function strandstoel(P, x, by, s) {
  const f = P.f;
  let d = P.fill(`M${f(x - 8 * s)} ${by}V${f(by - 14 * s)}Q${f(x - 8 * s)} ${f(by - 24 * s)} ${x} ${f(by - 24 * s)}Q${f(x + 8 * s)} ${f(by - 24 * s)} ${f(x + 8 * s)} ${f(by - 14 * s)}V${by}Z`, '#c8a466', { w: .55 });
  d += P.fill(`M${f(x - 5.6 * s)} ${f(by - 5 * s)}V${f(by - 14 * s)}Q${f(x - 5.6 * s)} ${f(by - 20 * s)} ${x} ${f(by - 20 * s)}Q${f(x + 5.6 * s)} ${f(by - 20 * s)} ${f(x + 5.6 * s)} ${f(by - 14 * s)}V${f(by - 5 * s)}Z`, '#e8dcc0', { w: .4 });
  for (let k = -1; k <= 1; k++) d += P.flat(P.rect(x + k * 3.6 * s - 1 * s, by - 19 * s, 2 * s, 14 * s), '#2f5a8a', { op: .85 });
  for (let k = 1; k < 4; k++) d += P.line(`M${f(x - 8 * s)} ${f(by - k * 4 * s)}h${f(16 * s)}`, '#9a7a46', .4, { op: .7 });
  if (P.L.snow) d += P.flat(`M${f(x - 8 * s)} ${f(by - 18 * s)}Q${x} ${f(by - 27 * s)} ${f(x + 8 * s)} ${f(by - 18 * s)}Z`, '#f4f7fa', { op: .9 });
  return d;
}
/** A border of flowers along the Boulevard's railing: geraniums in summer, bare earth in winter. */
function border(P, x0, x1, y) {
  const f = P.f, lf = P.L.leaf, R = P.rng(41);
  let d = P.flat(P.rect(x0, y - 3, x1 - x0, 3), '#6a5a44');
  if (!lf.leaf) return d + P.flat(P.rect(x0, y - 3.4, x1 - x0, 1.4), '#f2f5f8', { op: P.L.snow ? .9 : 0 });
  let g = '';
  for (let x = x0 + 2; x < x1; x += 5) g += `<circle cx="${f(x + R() * 2)}" cy="${f(y - 4 - R() * 2)}" r="${f(2.2 + R())}" fill="${P.ink(R() < .5 ? lf.leaf : lf.dark)}"/>`;
  const bloom = P.st?.season === 'autumn' ? ['#d88a3a', '#c8583a'] : P.st?.season === 'spring' ? ['#f2d25a', '#e8a0c0', '#f4f0e6'] : ['#d8303a', '#e85a6a', '#f4f0e6'];
  for (let x = x0 + 4; x < x1; x += 7) g += `<circle cx="${f(x + R() * 3)}" cy="${f(y - 6 - R() * 2)}" r="1.3" fill="${P.ink(bloom[Math.floor(R() * bloom.length)])}"/>`;
  return d + g;
}
function bench(P, x, by) {
  return P.fill(`M${x - 14} ${by - 6}h28v-2h-28Z`, '#3d5a4a', { w: .45 }) + P.fill(`M${x - 14} ${by - 12}h28v-3h-28Z`, '#3d5a4a', { w: .45 }) + P.line(`M${x - 12} ${by}v-12M${x + 12} ${by}v-12`, 'iron', 1.1);
}
/** A Zeeland woman: black dress and shawl, the white lace cap, gold spirals at her temples, a coral necklace. */
function zeeuwse(P, x, by, s, c) {
  const f = P.f;
  let d = P.person(x, by, s, 'lady', { c, top: '#2a2a30', hat: '#f4f2ea', dir: 1 });
  d += P.fill(`M${f(x - 3 * s)} ${f(by - 22 * s)}l${f(3 * s)} ${f(4 * s)}l${f(3 * s)} ${f(-4 * s)}Z`, '#6a7a9a', { w: .3 });
  const hy = by - 30 * s + 2.8 * s;
  d += `<path d="M${f(x - 3.6 * s)} ${f(hy + 2.4 * s)}q${f(-.4 * s)} ${f(-4.4 * s)} ${f(3.6 * s)} ${f(-4.6 * s)}q${f(4 * s)} ${f(.2 * s)} ${f(3.6 * s)} ${f(4.6 * s)}Z" fill="${P.ink('#f8f6f0')}" stroke="${P.keyC()}" stroke-width=".45"/>`;
  d += `<circle cx="${f(x - 3.2 * s)}" cy="${f(hy + 1.6 * s)}" r="${f(.9 * s)}" fill="${P.ink('#e2b23a')}"/><circle cx="${f(x + 3.2 * s)}" cy="${f(hy + 1.6 * s)}" r="${f(.9 * s)}" fill="${P.ink('#e2b23a')}"/>`;
  d += P.line(`M${f(x - 1.6 * s)} ${f(hy + 5 * s)}q${f(1.6 * s)} ${f(1.4 * s)} ${f(3.2 * s)} 0`, '#c8463a', .8 * s);
  return d;
}
