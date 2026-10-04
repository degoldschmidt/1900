// Amsterdam from a bridge on the Prinsengracht, looking along the canal: gabled houses lean over the quays on either
// hand, step gables, neck gables, bell gables, each with its hoist beam; elms on the west quay, and over them the
// Westerkerk's tower with the imperial crown, its clock keeping Amsterdam time; a humpbacked bridge in the middle
// distance and its reflection; beyond the roofs a mill turns on the old bastion. A tjalk comes down the canal toward
// us, cyclists cross the bridge and ride the quay, a street organ plays on ours.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

// the camera: one-point perspective down the canal. X right, Y up from the quays, Z away from us (metres).
const VX = 268, VY = 248, FL = 290, EYE = 4.5, WATER = -1.6, FRONT = 23.5, EDGE = 12.5;
const p3 = (X, Y, Z) => [VX + FL * X / Z, VY - FL * (Y - EYE) / Z];
const BRZ = 38; // the humpbacked bridge's near face

export default {
  id: 'AMS',
  greet: 'GROETEN uit AMSTERDAM',
  nation: 'NL',
  flag: 'NL',
  flower: 'tulip',
  flower2: 'daffodil',
  frame: { band: ['#c66b2f', '#693f24'], gold: '#dab45a', ink: '#1f3a6e', leaf: ['#78a15a', '#365c38'], year: '#2a3e6a', halo: '#f7ecd4' },
  horizon: 250,
  clouds: 5,
  wind: 1,
  pal: {
    key: '#2a2522', brick: '#8f4b3b', brick2: '#7a3f33', brick3: '#a2604a', dark: '#4b3b35', paint: '#bdb6a8', cream: '#e4d6b8', ochre: '#c9a066',
    stone: '#e0d4b8', stone2: '#b9a98a', cobble: '#b5a690', water: '#5d7a6e', glass: '#2f3a44', sash: '#f2ece0', iron: '#28332f', gold: '#d9a93c',
  },

  // a red tulip, two pointed petals forward and one behind, flamed in yellow, on its leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(28, 10, 200, I.leaf[1], { shape: 'lance' }) + F.leaf(26, 9, 155, I.leaf[0], { shape: 'lance' }) + F.leaf(18, 7, 235, I.leaf[0], { shape: 'lance' });
    s += F.stem('M0 18Q1 8 0 2', I.leaf[1], 1.6);
    s += F.at(0, 4, F.cup(22, 24, '#d8362e', { inner: '#a8222a', flame: '#f2c84a' }), 0);
    s += F.at(-4, -12, F.petal(14, 8, '#e4483a', 'point', { lite: '#f28a6a' }), -14) + F.at(4, -12, F.petal(14, 8, '#c82e2a', 'point'), 14);
    return s;
  },
  // a daffodil: six pale petals, the deep yellow trumpet
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(18, 4, 205, I.leaf[1], { shape: 'lance' }) + F.leaf(16, 4, 160, I.leaf[0], { shape: 'lance' });
    s += F.radial(6, 11, 6.4, '#f6e6a0', { shape: 'point', lite: '#fff6cc', k: .45 });
    s += '<circle r="5" fill="#f0a830" stroke="#3a2e1e" stroke-width=".5"/><circle r="3.2" fill="#e08a20"/><circle r="1.4" fill="#c8701a"/>';
    return s;
  },

  back(P, T) {
    let s = '';
    // the end of the canal: low roofs at the Singelgracht, the mill on its bastion turning over the roofs
    s += P.far(.85, () => P.row(200, 330, 252, { hMin: 6, hMax: 12, wMin: 6, wMax: 10, style: 'north', seed: 3, walls: ['#c9b8a4', '#b8a08c', '#d6cab6'], roofC: '#7a5a50', placard: false, flagSpot: false, lit: 1.4 }));
    s += P.far(.75, () => mill(P, 292, 252, .56));
    s += P.far(.75, () => P.spin(sails(P, 21), { x: 292, y: 222.5, dur: 16, dir: -1 }));
    // the Westerkerk
    s += P.far(.55, () => westertoren(P, 214, 232, 124));
    // the water, then the far quays and houses beyond the bridge
    s += P.flat(P.rect(14, 246, 572, 140), 'water') + P.lite(P.rect(14, 246, 572, 8), 'water', .25, { op: .7 });
    s += canalLines(P);
    s += P.far(.45, () => quay(P, -1, 46, 400) + quay(P, 1, 46, 400));
    s += P.far(.4, () => rowOf(P, -1, 46, 260, 11) + rowOf(P, 1, 46, 260, 23));
    s += P.far(.3, () => trees(P, -1, [50, 62, 76, 92, 110, 132, 160]) + trees(P, 1, [118, 150]));
    s += P.far(.3, () => P.crowd(214, 240, p3(-16, 0, 70)[1], 3, { s: .2, seed: 5 }) + P.crowd(320, 340, p3(16, 0, 80)[1], 3, { s: .18, seed: 9 }));
    // reflections in the canal, and the glints that move on it
    s += reflections(P);
    shimmer(P);
    // the humpbacked bridge: deck, far rail, the people crossing it, then its face (in mid)
    s += bridgeDeck(P);
    s += P.mover(cyclist(P, 1, .4, 1), { path: hump(1, 42, .4, .4), dur: 30, offset: 4 });
    s += P.mover(T.walkers({ kinds: ['lady', 'gent'], s: .4, dir: -1, seed: 4 }), { path: hump(-1, 43.5, 1, .2), dur: 44, offset: 20 });
    s += P.mover(cyclist(P, -1, .4, 2), { path: hump(-1, 41, 1, .5), dur: 34, offset: 26 });
    // the tjalk coming down the canal, out of the bridge's arch toward us
    s += P.mover(tjalk(P, 1), { path: [[268, 293, .26, 0, 0], [268, 294, .27, .04, 1], [282, 322, .52, .45], [300, 352, .86, .8, 1], [306, 362, .98, .9, 0], [306, 362, .98, 1, 0]], dur: 70, offset: 8 });
    return s;
  },

  mid(P, T) {
    let s = '';
    s += bridgeFace(P);
    // the near quays and houses, either side of us
    s += quay(P, -1, 18, 46) + quay(P, 1, 18, 46);
    s += rowOf(P, -1, 22, 46, 5) + rowOf(P, 1, 17, 46, 17);
    s += trees(P, -1, [26, 36]);
    // lamps on the quays, a moored barge on the right, people on the cobbles
    for (const [X, Z] of [[-13.4, 30], [13.4, 26]]) { const [x, y] = p3(X, 0, Z); s += P.lamp(x, y, 290 * 4 / Z / 62, 'single'); }
    s += moored(P);
    s += P.crowd(412, 452, p3(17, 0, 30)[1], 3, { s: .62, seed: 14 }) + P.crowd(60, 120, p3(-17, 0, 34)[1], 3, { s: .56, seed: 2 });
    s += quayLife(P);
    // cyclists riding away up the right quay
    s += P.mover(cyclist(P, -1, .74, 3), { path: [[560, p3(17, 0, 20)[1], 1, 0, 0], [548, p3(17, 0, 20.6)[1], .98, .05, 1], [p3(17, 0, 36)[0], p3(17, 0, 36)[1], .56, .8, 1], [p3(17, 0, 38)[0], p3(17, 0, 38)[1], .53, .85, 0], [p3(17, 0, 38)[0], p3(17, 0, 38)[1], .53, 1, 0]], dur: 26, offset: 11 });
    s += P.flagAt(p3(FRONT, 9, 22)[0] - 6, p3(FRONT, 9, 22)[1]) + P.flagAt(p3(-FRONT, 8, 40)[0] + 4, p3(-FRONT, 8, 40)[1]);
    return s;
  },

  front(P, T) {
    let s = '';
    // our bridge: its iron railing across the foot of the picture, a lamp, the organ, the people
    s += P.fill('M14 352H590V380H14Z', 'cobble', { k: false }) + P.paving(354, 382, { c: 'cobble', vx: 300, seed: 5 });
    let rail = '';
    for (let x = 18; x < 590; x += 9) rail += `M${x} 352V330`;
    s += P.fill('M14 352H590V356H14Z', 'stone2', { w: .6 }) + P.line(rail, 'iron', 1) + P.line('M14 331H590M14 336H590', 'iron', 1.4);
    let curls = '';
    for (let x = 22.5; x < 586; x += 18) curls += `M${x} 346q4.5 -9 9 0`;
    s += P.line(curls, 'iron', .7);
    s += P.lamp(470, 354, 1.2, 'single', { h: 76 }) + P.flagAt(472, 296);
    s += P.wall(p3(FRONT, 0, 19)[0] - 18, p3(FRONT, 3, 19)[1], 13, 17);
    s += P.setStreet(368, 40, 560, 1.05);
    s += organ(P, 150, 370, 1.2);
    s += P.spin(flywheel(P, 1.2), { x: 150 + 21 * 1.2, y: 370 - 22 * 1.2, dur: 1.6, dir: 1, z: 'fore' });
    s += P.person(196, 370, 1.14, 'worker', { c: '#3a3634', hat: '#2a2826', dir: -1 }) + P.person(104, 371, .86, 'child', { c: '#c8463a' }) + P.person(92, 372, 1.08, 'girl', { c: '#f2ead6' });
    s += P.person(372, 368, 1.12, 'gent', { c: '#2c3038', dir: -1 }) + P.person(386, 369, 1.1, 'lady', { c: '#e8e0cc', parasol: '#c9d6e6', dir: -1 });
    s += P.person(520, 372, 1.14, 'peasant', { c: '#2a3446', hat: '#f4f2ea' });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.12, dir: 1, seed: 12 }), { y: 374, dir: 1, dur: 80, offset: 50, z: 'fore' });
    s += P.cross(cyclist(P, -1, 1.08, 4), { y: 378, dir: -1, dur: 24, rest: .55, offset: 2, z: 'fore' });
    return s;
  },
};

// ---------- the canal in perspective ----------
const poly3 = (P, pts) => P.poly(pts.map(([X, Y, Z]) => p3(X, Y, Z)));
/** A quay from Z0 to Z1 on one side (k -1 left, 1 right): the cobbles, the edge stones, the wall down to the water. */
function quay(P, k, z0, z1) {
  let s = P.fill(poly3(P, [[k * EDGE, 0, z0], [k * EDGE, 0, z1], [k * FRONT, 0, z1], [k * FRONT, 0, z0]]), 'cobble', { w: .5 });
  for (let z = z0 + 3; z < z1; z += z < 60 ? 3 : 8) s += P.line(P.poly([p3(k * EDGE, 0, z), p3(k * FRONT, 0, z)], false), P.dark('cobble', .15), .4, { op: .6 });
  s += P.fill(poly3(P, [[k * EDGE, 0, z0], [k * EDGE, 0, z1], [k * EDGE, WATER, z1], [k * EDGE, WATER, z0]]), 'brick2', { w: .5 });
  s += P.fill(poly3(P, [[k * EDGE, 0, z0], [k * EDGE, 0, z1], [k * (EDGE + .5), .1, z1], [k * (EDGE + .5), .1, z0]]), 'stone', { w: .3 });
  if (P.L.snow) s += P.flat(poly3(P, [[k * EDGE, 0, z0], [k * EDGE, 0, z1], [k * FRONT, 0, z1], [k * FRONT, 0, z0]]), '#f2f5f8', { op: .8 });
  if (P.L.wet) s += P.flat(poly3(P, [[k * 15, 0, z0 + 2], [k * 15, 0, z1 - 2], [k * 17, 0, z1 - 2], [k * 17, 0, z0 + 2]]), P.L.sky.low, { op: .3, raw: 1 });
  return s;
}
function canalLines(P) {
  let d = '';
  for (let z = 16; z < 200; z *= 1.18) { const a = p3(-EDGE, WATER, z), b = p3(EDGE, WATER, z); d += `M${P.f(a[0] + 20)} ${P.f(a[1])}H${P.f(b[0] - 20)}`; }
  return `<path d="${d}" stroke="${P.dark('water', .25)}" stroke-width=".7" stroke-dasharray="14 9 4 11" opacity=".55"/>`;
}
/** The houses' reflections: broken strokes of brick and white under each row. */
function reflections(P) {
  const r = P.rng(61);
  let d = '', w = '';
  for (const k of [-1, 1]) for (let z = 40; z < 220; z *= 1.08) {
    const [x, y] = p3(k * EDGE, WATER, z), len = 290 * 6 / z;
    for (let i = 0; i < 3; i++) { const yy = y + 2 + i * 290 * 1.6 / z, xx = x - k * (4 + r() * len * .6); const seg = `M${P.f(xx)} ${P.f(yy)}h${P.f(-k * (2 + r() * len * .5))}`; if (i % 2) w += seg; else d += seg; }
  }
  return `<path d="${d}" stroke="${P.ink('brick', .4)}" stroke-width="1.4" opacity=".45" stroke-linecap="round"/><path d="${w}" stroke="${P.ink('cream', .4)}" stroke-width="1" opacity=".4" stroke-linecap="round"/>`;
}
function shimmer(P) {
  const r = P.rng(33), L = P.L;
  for (let i = 0; i < 9; i++) {
    const z = 15 + r() * 40, X = (r() * 2 - 1) * 8, [x, y] = p3(X, WATER, z);
    P.sprites.push({ kind: 'shimmer', x, y, w: (8 + r() * 14) * 30 / z, z: 'back', c: L.night > .5 ? P.glow('#ffd98a') : P.light('water', .55), seed: i });
  }
}

// ---------- the houses ----------
const KINDS = ['step', 'neck', 'bell', 'spout', 'cornice', 'neck', 'bell', 'step'];
const WALLS = ['brick', 'brick2', 'dark', 'brick3', 'paint', 'brick', 'cream', 'brick2', 'ochre', 'dark'];
/** The outline of a front in its own plane (u across, v up): the walls, then the gable of its kind. */
function outline(kind, w, h, g) {
  const m = w / 2;
  const curve = (a, b, c, n = 5) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; });
  let L;
  if (kind === 'step') {
    const n = 4, top = w * .13;
    L = [[0, h]];
    for (let i = 0; i < n; i++) { const u = i * (m - top) / n, v = h + (i + 1) * g / n; L.push([u, v - g / n], [u, v], [u + (m - top) / n * .999, v]); }
    L.push([m - top, h + g + .4]);
  } else if (kind === 'neck') {
    L = [[0, h], [w * .1, h], ...curve([w * .1, h], [w * .24, h], [w * .25, h + g * .45]), [w * .25, h + g * .9], [w * .2, h + g * .9]];
  } else if (kind === 'bell') {
    L = [[0, h], ...curve([0, h], [w * .3, h + g * .1], [w * .26, h + g * .55]), ...curve([w * .26, h + g * .55], [w * .22, h + g * .85], [w * .36, h + g * .9]), [w * .36, h + g * .95]];
  } else if (kind === 'spout') {
    L = [[0, h], [w * .3, h + g * .82], [w * .34, h + g * .82], [w * .34, h + g]];
  } else {
    L = [[0, h], [-.3, h], [-.3, h + .5], [0, h + .5], [0, h + g * .35]];
  }
  const right = L.slice().reverse().map(([u, v]) => [w - u, v]);
  const peak = kind === 'neck' ? [[m, h + g * 1.12]] : kind === 'bell' ? [[m - w * .08, h + g * 1.04], [m, h + g * 1.1], [m + w * .08, h + g * 1.04]] : [];
  return [[0, 0], ...L, ...peak, ...right, [w, 0]];
}
/** One house front on side k at depth z0 (its near edge), w wide, h to the cornice, gable g. */
function house(P, k, z0, w, h, g, kind, c, i) {
  const f = P.f, X = k * FRONT;
  const at = (u, v) => p3(X, v, z0 + u);
  const quad = (u0, v0, u1, v1) => P.poly([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]);
  const out = outline(kind, w, h, g);
  let s = P.fill(P.poly(out.map(([u, v]) => at(u, v))), c, { w: .6 });
  if (k < 0) s += P.shade(P.poly(out.map(([u, v]) => at(u, v))), c, .1);
  const near = 290 / z0; // px per metre at the front
  // a white stone band at the cornice, the stoop and door, the windows floor by floor
  s += P.fill(quad(0, h - .3, w, h + .2), 'stone', { w: .35 });
  const floors = Math.max(3, Math.round((h - 3) / 3.1)), cols = w > 6.5 ? 3 : 2, fh = (h - 3.4) / floors;
  for (let r = 0; r < floors; r++) for (let q = 0; q < cols; q++) {
    const u0 = w * (q + .22) / cols, u1 = w * (q + .78) / cols, v0 = 3.4 + r * fh + fh * .18, v1 = v0 + fh * .66;
    const lit = P.wr() < P.L.windows, tone = P.wr();
    s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width="${f(Math.max(.4, near * .05))}"/>`;
    if (!lit && near > 8) s += P.line(P.poly([at((u0 + u1) / 2, v0), at((u0 + u1) / 2, v1)], false), 'sash', Math.max(.4, near * .04)) + P.line(P.poly([at(u0, (v0 + v1) / 2), at(u1, (v0 + v1) / 2)], false), 'sash', Math.max(.4, near * .04));
    if (r === floors - 1 && i % 3 === 0 && near > 6) s += P.fill(quad(u0 - .1, v0 - .35, u1 + .1, v0), '#6a8a4a', { w: .3 });
  }
  // the door up its steps, and a shop window on some
  s += P.fill(quad(w * .1, 0, w * .32, 2.8), '#2f3a2f', { w: .4 }) + P.fill(quad(w * .06, 0, w * .36, .5), 'stone', { w: .3 });
  s += `<path d="${quad(w * .45, .9, w * .88, 2.9)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`;
  // the gable's own window and the hoist beam over it
  const gv = h + g * .35;
  s += P.fill(quad(w * .4, gv, w * .6, gv + g * .35), kind === 'cornice' ? 'glass' : '#3a4a3a', { w: .3 });
  const beamV = kind === 'cornice' ? h + g * .3 : h + g * .82, [bx, by] = at(w / 2, beamV), [ex, ey] = p3(X - k * 1.1, beamV, z0 + w / 2);
  s += P.line(`M${f(bx)} ${f(by)}L${f(ex)} ${f(ey)}`, '#3a2a1e', Math.max(.6, near * .12));
  if (kind === 'cornice') s += P.fill(quad(-.2, h + g * .28, w + .2, h + g * .4), 'stone', { w: .35 });
  // snow on the steps of the gable
  if (P.L.snow && kind !== 'cornice') s += P.line(P.poly(out.slice(1, -1).filter(([, v]) => v >= h).map(([u, v]) => at(u, v)), false), '#f4f7fa', Math.max(1, near * .18));
  return s;
}
/** A row of houses on side k from depth z0 to z1. */
function rowOf(P, k, z0, z1, seed) {
  const r = P.rng(seed), list = [];
  let z = z0, i = seed;
  while (z < z1) { const w = 5.6 + r() * 2.6; list.push([z, w, 12 + r() * 5, 3.4 + r() * 2.6, KINDS[i % KINDS.length], WALLS[(i * 3 + 1) % WALLS.length], i]); z += w; i++; }
  // the far ones first, so the nearer cover them
  return list.reverse().map(([z, w, h, g, kind, c, n]) => house(P, k, z, w, h, g, kind, c, n)).join('');
}
/** Elms along a quay at the given depths. */
function trees(P, k, zs) {
  let s = '';
  for (const z of zs.slice().sort((a, b) => b - a)) { const [x, y] = p3(k * 17, 0, z); s += P.tree(x, y, 94 / z, 'round', { trunk: '#4a3c30' }); }
  return s;
}

// ---------- the humpbacked bridge ----------
const deckY = (X) => 1.1 + 1.4 * Math.max(0, 1 - (X / EDGE) ** 2);
function bridgeDeck(P) {
  const z1 = BRZ + 8;
  let top = [], back = [];
  for (let i = 0; i <= 16; i++) { const X = -EDGE - 1 + (2 * EDGE + 2) * i / 16; top.push([X, deckY(X) - .9, BRZ]); back.push([X, deckY(X) - .9, z1]); }
  let s = P.fill(poly3(P, [...top, ...back.reverse()]), 'cobble', { w: .5 });
  // the far railing
  let rail = '';
  for (let i = 0; i <= 24; i++) { const X = -EDGE + 2 * EDGE * i / 24, [x, y] = p3(X, deckY(X) - .9, z1), [, y2] = p3(X, deckY(X) + .1, z1); rail += `M${P.f(x)} ${P.f(y)}V${P.f(y2)}`; }
  s += P.line(rail, 'iron', .5) + P.line(P.poly(Array.from({ length: 13 }, (_, i) => { const X = -EDGE + 2 * EDGE * i / 12; return p3(X, deckY(X) + .1, z1); }), false), 'iron', .8);
  return s;
}
/** A path over the hump at depth z, from one end of the bridge to the other, then a rest out of sight. */
function hump(dir, z, sc, rest) {
  const pts = [], n = 12;
  for (let i = 0; i <= n; i++) { const X = (dir > 0 ? -1 : 1) * (EDGE + 5) * (1 - 2 * i / n), [x, y] = p3(X, deckY(X) - .9, z); pts.push([x, y, sc, (1 - rest) * i / n]); }
  if (rest) pts.push([pts.at(-1)[0], pts.at(-1)[1], sc, 1]);
  return pts;
}
/** The bridge's face toward us: brick, a stone arch with its keystone, cut through so the water shows; the near rail. */
function bridgeFace(P) {
  const f = P.f, z = BRZ;
  const topPts = [];
  for (let i = 0; i <= 16; i++) { const X = -EDGE - 1.5 + (2 * EDGE + 3) * i / 16; topPts.push(p3(X, deckY(X) - .9, z)); }
  let d = `M${f(p3(-EDGE - 1.5, WATER - .2, z)[0])} ${f(p3(-EDGE - 1.5, WATER - .2, z)[1])}`;
  for (const [x, y] of topPts) d += `L${f(x)} ${f(y)}`;
  d += `L${f(p3(EDGE + 1.5, WATER - .2, z)[0])} ${f(p3(EDGE + 1.5, WATER - .2, z)[1])}Z`;
  // the arch: half an ellipse from the water up to its crown
  const arch = (sx, cy, rx, ry) => { let a = ''; for (let i = 0; i <= 18; i++) { const t = Math.PI * i / 18, [x, y] = p3(sx - Math.cos(t) * rx, WATER + Math.sin(t) * ry - .05, z); a += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`; } return a + 'Z'; };
  const main = arch(0, WATER, 5.6, 2.5), side = arch(-9.2, WATER, 2, 1.3) + arch(9.2, WATER, 2, 1.3);
  let s = `<path d="${d}${main}${side}" fill="${P.ink('brick')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width=".7"/>`;
  s += P.stipple(d, 'brick', 50, { box: [p3(-EDGE - 1.5, 0, z)[0], p3(0, 3, z)[1], 200, 40], op: .3 });
  // stone voussoirs round the main arch, the keystone, the string course
  let v = '';
  for (let i = 1; i < 18; i += 2) { const t = Math.PI * i / 18, [x1, y1] = p3(-Math.cos(t) * 5.6, WATER + Math.sin(t) * 2.5, z), [x2, y2] = p3(-Math.cos(t) * 6.3, WATER + Math.sin(t) * 3.1, z); v += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`; }
  s += P.line(v, 'stone', 2) + P.line(main, 'stone2', .8);
  s += P.fill(poly3(P, [[-.4, WATER + 2.45, z], [.4, WATER + 2.45, z], [.5, WATER + 3.2, z], [-.5, WATER + 3.2, z]]), 'stone', { w: .4 });
  s += P.line(P.poly(topPts, false), 'stone', 1.6);
  // the reflection of the arch: a dark oval in the water below it
  const [ax, ay] = p3(0, WATER, z);
  s += `<ellipse cx="${f(ax)}" cy="${f(ay + 3)}" rx="${f(290 * 5.2 / z)}" ry="${f(290 * 1.6 / z)}" fill="${P.dark('water', .35)}" opacity=".45"/>`;
  // the near railing over the deck: iron, with a lamp at each end
  let rail = '';
  for (let i = 0; i <= 28; i++) { const X = -EDGE + 2 * EDGE * i / 28, [x, y] = p3(X, deckY(X) - .9, z), [, y2] = p3(X, deckY(X) + .2, z); rail += `M${f(x)} ${f(y)}V${f(y2)}`; }
  s += P.line(rail, 'iron', .7) + P.line(P.poly(Array.from({ length: 15 }, (_, i) => { const X = -EDGE + 2 * EDGE * i / 14; return p3(X, deckY(X) + .2, z); }), false), 'iron', 1.1);
  for (const X of [-EDGE, EDGE]) { const [x, y] = p3(X, deckY(X) - .9, z); s += P.lamp(x, y, .72, 'single', { h: 44 }); }
  return s;
}

/** Life on the near right quay: bollards along the edge, a greengrocer's handcart, bicycles against a wall, people. */
function quayLife(P) {
  const f = P.f;
  let d = '';
  for (const z of [20, 23.5, 27.5, 32]) { const [x, y] = p3(EDGE + .6, 0, z), k = 290 / z; d += P.fill(`M${f(x - .14 * k)} ${f(y)}V${f(y - .5 * k)}Q${f(x)} ${f(y - .66 * k)} ${f(x + .14 * k)} ${f(y - .5 * k)}V${f(y)}Z`, '#2c2c2e', { w: .35 }); }
  // the handcart, heaped with cabbages and carrots
  const [cx, cy] = p3(18.5, 0, 22.5), k = 290 / 22.5;
  d += `<circle cx="${f(cx - .5 * k)}" cy="${f(cy - .45 * k)}" r="${f(.45 * k)}" fill="none" stroke="${P.ink('#4a3424')}" stroke-width="${f(.07 * k)}"/>`;
  d += P.fill(P.rect(cx - 1.4 * k, cy - 1.1 * k, 2.2 * k, .5 * k), '#8a6a46', { w: .4 }) + P.line(`M${f(cx + .8 * k)} ${f(cy - .9 * k)}l${f(.9 * k)} ${f(-.3 * k)}`, '#5a4232', .08 * k);
  const R = P.rng(12);
  for (let i = 0; i < 9; i++) d += `<circle cx="${f(cx - 1.2 * k + R() * 1.9 * k)}" cy="${f(cy - 1.2 * k - R() * .3 * k)}" r="${f(.17 * k)}" fill="${P.ink(['#7aa04a', '#e0802a', '#5a8a3a', '#c8463a'][i % 4])}"/>`;
  d += P.person(cx + 2 * k, cy, k * .055, 'worker', { c: '#4a5a6a', hat: '#2a2826', dir: -1 }) + P.person(cx - 2.4 * k, cy + .3 * k, k * .055, 'lady', { c: '#2a3446', dir: 1 });
  // bicycles leaning on a house front
  for (const z of [26, 27.4]) { const [bx, by] = p3(FRONT - .3, 0, z), q = 290 / z; d += `<circle cx="${f(bx - .4 * q)}" cy="${f(by - .35 * q)}" r="${f(.33 * q)}" fill="none" stroke="${P.ink('#1f1f22')}" stroke-width=".6"/><circle cx="${f(bx + .1 * q)}" cy="${f(by - .4 * q)}" r="${f(.33 * q)}" fill="none" stroke="${P.ink('#1f1f22')}" stroke-width=".6"/>` + P.line(`M${f(bx - .4 * q)} ${f(by - .35 * q)}L${f(bx - .15 * q)} ${f(by - .8 * q)}L${f(bx + .1 * q)} ${f(by - .4 * q)}`, '#1f1f22', .6); }
  return d;
}

/** A barge moored along the right quay, its mast lowered along the deck, a cabin aft. */
function moored(P) {
  const x0 = 9.4, x1 = 12.2, za = 24, zb = 35, dk = WATER + 1.1;
  let s = P.fill(poly3(P, [[x0, WATER, za], [x0, WATER, zb], [x0, dk, zb], [x0, dk, za]]), '#2f2a26', { w: .5 });
  s += P.fill(poly3(P, [[x0, dk, za], [x0, dk, zb], [x1, dk, zb], [x1, dk, za]]), '#7a5a3a', { w: .4 });
  s += P.line(P.poly([p3(x0, dk - .3, za), p3(x0, dk - .3, zb)], false), '#2f6a4a', 1.2);
  s += P.fill(poly3(P, [[x0 + .3, dk, za + .4], [x0 + .3, dk, za + 3], [x0 + .3, dk + 1.2, za + 3], [x0 + .3, dk + 1.2, za + .4]]), '#e2d2b0', { w: .4 });
  s += P.fill(poly3(P, [[x0 + .3, dk + 1.2, za + .2], [x0 + .3, dk + 1.2, za + 3.2], [x1, dk + 1.6, za + 3.2], [x1, dk + 1.6, za + .2]]), '#6a3a2a', { w: .35 });
  s += P.line(P.poly([p3(10.6, dk + .5, za + 3.5), p3(10.6, dk + .5, zb + 1)], false), '#4a3424', 1.6) + P.line(P.poly([p3(10.6, dk + .8, za + 4), p3(10.6, dk + .8, zb - 1)], false), '#8a4e30', 2.4);
  return s;
}

// ---------- the landmarks ----------
/** The Westertoren: brick base, stone stages with their clock, the open lantern, the blue imperial crown on top. */
function westertoren(P, cx, by, H) {
  const f = P.f, Y = (k) => by - k * H;
  let s = '';
  // the church's roof beside it
  s += P.fill(P.poly([[cx + 6, Y(.02)], [cx + 6, Y(.2)], [cx + 40, Y(.2)], [cx + 48, Y(.02)]]), 'dark', { w: .5 });
  const w = .19 * H;
  s += P.fill(P.rect(cx - w / 2, Y(.45), w, H * .45), 'brick') + P.shade(P.rect(cx + w * .15, Y(.45), w * .35, H * .45), 'brick', .22);
  s += P.fill(P.arch(cx - w * .2, Y(.4), w * .4, H * .14), 'glass', { w: .4 });
  for (const v of [.2, .45]) s += P.fill(P.rect(cx - w / 2 - 1, Y(v) - 1.2, w + 2, 2.4), 'stone', { w: .35 });
  // the stone stage with the clock (Amsterdam time, twenty minutes behind Berlin's)
  const w2 = w * .86;
  s += P.fill(P.rect(cx - w2 / 2, Y(.6), w2, H * .15), 'stone') + P.shade(P.rect(cx + w2 * .15, Y(.6), w2 * .35, H * .15), 'stone', .2);
  s += P.clock(cx, Y(.525), w2 * .3, { tz: -40, face: '#2a3a5a', rim: '#d9a93c', hands: '#e8c25a' }) + goldTicks(P, cx, Y(.525), w2 * .3);
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * w2 / 2 - (k > 0 ? 2 : 0), Y(.6), 2, H * .15), 'stone2', { w: .3 });
  // the octagonal stages narrowing, columns and arches
  const st = (v0, v1, ww) => P.fill(P.rect(cx - ww / 2, Y(v1), ww, (v1 - v0) * H), 'stone') + P.shade(P.rect(cx + ww * .15, Y(v1), ww * .35, (v1 - v0) * H), 'stone', .2) + P.fill(P.arch(cx - ww * .22, Y(v1) + 2, ww * .44, (v1 - v0) * H - 3), '#2a2a2e', { w: .3 }) + P.fill(P.rect(cx - ww / 2 - 1, Y(v1) - 1.4, ww + 2, 1.8), 'stone2', { w: .3 });
  s += st(.6, .7, w * .72) + st(.7, .78, w * .58) + st(.78, .84, w * .44);
  // the crown: blue and gold, a red lining, on its short spire
  const cy = Y(.9);
  s += P.fill(P.rect(cx - w * .14, Y(.86), w * .28, H * .02), 'stone2', { w: .3 });
  s += P.fill(`M${f(cx - w * .22)} ${f(Y(.86))}Q${f(cx - w * .26)} ${f(cy)} ${f(cx - w * .12)} ${f(Y(.93))}H${f(cx + w * .12)}Q${f(cx + w * .26)} ${f(cy)} ${f(cx + w * .22)} ${f(Y(.86))}Z`, '#3a5a9a', { w: .45 });
  s += P.line(`M${f(cx - w * .2)} ${f(Y(.875))}H${f(cx + w * .2)}M${cx} ${f(Y(.86))}V${f(Y(.93))}`, 'gold', 1) + `<circle cx="${cx}" cy="${f(Y(.94))}" r="1.6" fill="${P.ink('#c8463a')}"/>`;
  s += P.line(`M${cx} ${f(Y(.94))}V${f(Y(1.0))}`, 'gold', .9) + P.fill(`M${cx} ${f(Y(1.0))}l4 1.4l-4 1.4Z`, 'gold', { w: .3 });
  return s;
}
/** Gold hour marks over a dark dial (the kit's own marks are dark and vanish on it). */
function goldTicks(P, x, y, r) {
  let d = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d += `M${P.f(x + Math.sin(a) * r * .7)} ${P.f(y - Math.cos(a) * r * .7)}L${P.f(x + Math.sin(a) * r * .88)} ${P.f(y - Math.cos(a) * r * .88)}`; }
  return `<path d="${d}" stroke="${P.ink('#e2b84a')}" stroke-width="${P.f(Math.max(.5, r * .1))}" stroke-linecap="round"/>`;
}

/** A tall stage mill on the old bastion, seen over the roofs. */
function mill(P, cx, by, s) {
  const f = P.f;
  let d = P.fill(`M${f(cx - 14 * s)} ${by}L${f(cx - 9 * s)} ${f(by - 56 * s)}H${f(cx + 9 * s)}L${f(cx + 14 * s)} ${by}Z`, '#5a4a3e', { w: .5 }) + P.shade(`M${f(cx + 3 * s)} ${by}L${f(cx + 3 * s)} ${f(by - 56 * s)}H${f(cx + 9 * s)}L${f(cx + 14 * s)} ${by}Z`, '#5a4a3e', .25);
  for (let k = 1; k < 6; k++) d += P.line(`M${f(cx - 14 * s + k * 1 * s)} ${f(by - k * 9 * s)}H${f(cx + 14 * s - k * 1 * s)}`, '#3a3028', .4, { op: .6 });
  d += P.fill(P.rect(cx - 20 * s, by - 26 * s, 40 * s, 2.4 * s), '#4a3a2c', { w: .35 });
  d += P.fill(`M${f(cx - 11 * s)} ${f(by - 56 * s)}Q${cx} ${f(by - 68 * s)} ${f(cx + 11 * s)} ${f(by - 56 * s)}Z`, '#3a3028', { w: .45 });
  return d;
}
function sails(P, r) {
  const W = r * 2 + 4, c = W / 2, f = P.f;
  let b = '';
  for (let i = 0; i < 4; i++) {
    let g = `<path d="M0 -2V${f(-r)}" stroke="${P.ink('#3a2a1e')}" stroke-width="1.1"/><path d="M1 ${f(-r * .22)}V${f(-r)}H${f(r * .24)}V${f(-r * .22)}Z" fill="${P.ink('#e8dcc4')}" stroke="${P.ink('#3a2a1e')}" stroke-width=".45"/>`;
    for (let k = 1; k < 7; k++) g += `<path d="M1 ${f(-r * (.22 + k * .11))}H${f(r * .24)}" stroke="${P.ink('#6a5a46')}" stroke-width=".3"/>`;
    b += `<g transform="translate(${f(c)} ${f(c)}) rotate(${i * 90 + 30})">${g}</g>`;
  }
  return { svg: doc(f(W), f(W), b + `<circle cx="${f(c)}" cy="${f(c)}" r="1.8" fill="${P.ink('#2a2420')}"/>`), w: W, h: W, ax: c, ay: c };
}

// ---------- what moves ----------
/** A cyclist on a black roadster: two frames of the pedals. kind 1–4 dresses them differently. */
function cyclist(P, dir, s, kind = 1) {
  const W = 34 * s, H = 34 * s, S = (k) => P.f(k * s), f = P.f;
  const coat = ['#2f3440', '#2a3a5a', '#f0ebdd', '#4a3a30'][kind - 1], lady = kind === 2 || kind === 4, hat = kind === 3 ? 'boater' : lady ? 'picture' : 'cap';
  const frame = (st) => {
    let b = '';
    const wheel = (cx) => `<circle cx="${S(cx)}" cy="${S(27)}" r="${S(6)}" fill="none" stroke="${P.ink('#1f1f22')}" stroke-width="${S(1.1)}"/><path d="M${S(cx - 6)} ${S(27)}H${S(cx + 6)}M${S(cx)} ${S(21)}V${S(33)}" stroke="${P.ink('#8a8a8a')}" stroke-width="${S(.3)}"/>`;
    b += wheel(8) + wheel(26);
    b += P.line(`M${S(8)} ${S(27)}L${S(14)} ${S(18)}H${S(23)}L${S(26)} ${S(27)}M${S(14)} ${S(18)}L${S(17)} ${S(27)}L${S(23)} ${S(18)}M${S(23)} ${S(18)}L${S(24)} ${S(14)}`, '#1f1f22', .9 * s);
    // legs on the pedals
    const k = st ? 1 : -1;
    b += P.line(`M${S(15)} ${S(15)}L${S(18 + k * 2)} ${S(21)}L${S(17 + k * 3)} ${S(27 - k * 2)}`, lady ? coat : '#2a2a30', 2 * s);
    if (lady) b += P.fill(`M${S(12)} ${S(11)}L${S(10)} ${S(22)}Q${S(15)} ${S(24)} ${S(20)} ${S(21)}L${S(17)} ${S(11)}Z`, coat, { w: .4 });
    // body leaning to the bars, the head and hat
    b += P.fill(`M${S(13)} ${S(16)}L${S(15)} ${S(7)}H${S(19)}L${S(22)} ${S(14)}L${S(19)} ${S(16)}Z`, coat, { w: .45 }) + P.line(`M${S(19)} ${S(9)}L${S(24)} ${S(14)}`, coat, 1.4 * s);
    b += `<circle cx="${S(17.6)}" cy="${S(4.6)}" r="${S(2.3)}" fill="${P.ink('#e8c4a0')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
    if (hat === 'boater') b += `<path d="M${S(14.4)} ${S(3)}h${S(6.4)}M${S(15.6)} ${S(3)}v${S(-1.8)}h${S(4)}v${S(1.8)}" stroke="${P.ink('#c9b071')}" stroke-width="${S(.9)}" fill="none"/>`;
    else if (hat === 'picture') b += `<path d="M${S(12.6)} ${S(3.6)}q${S(5)} ${S(-5)} ${S(10)} 0Z" fill="${P.ink(kind === 2 ? '#c8463a' : '#e8dcc0')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
    else b += `<path d="M${S(15.4)} ${S(3.4)}q${S(2.2)} ${S(-3)} ${S(4.4)} 0h${S(1.4)}Z" fill="${P.ink('#2a2826')}"/>`;
    return flip(dir, f(W), b);
  };
  return { frames: [frame(0), frame(1)].map((b) => doc(f(W), f(H), b)), fps: 3, w: W, h: H, ax: W / 2, ay: 33 * s };
}
/** A tjalk coming at us bow-on: the round bluff bow, leeboards out, the mast lowered for the bridges, a load of casks. */
function tjalk(P, s) {
  const W = 72 * s, H = 56 * s, S = (k) => P.f(k * s), f = P.f;
  let b = '';
  // the lowered mast and furled brown sail, angled back over the stern
  b += P.fill(`M${S(34)} ${S(26)}L${S(30)} ${S(4)}H${S(38)}L${S(38)} ${S(26)}Z`, '#8a4e30', { w: .45 }) + P.line(`M${S(36)} ${S(30)}L${S(33)} ${S(2)}`, '#4a3424', 1.2 * s);
  // the skipper at the tiller, the cabin
  b += P.fill(`M${S(26)} ${S(30)}V${S(22)}H${S(46)}V${S(30)}Z`, '#e2d2b0', { w: .45 }) + `<rect x="${S(30)}" y="${S(24)}" width="${S(4)}" height="${S(3)}" fill="${P.L.windows > .2 ? P.glow('#ffc96b') : P.ink('glass')}"/><rect x="${S(38)}" y="${S(24)}" width="${S(4)}" height="${S(3)}" fill="${P.L.windows > .2 ? P.glow('#ffc96b') : P.ink('glass')}"/>`;
  b += `<circle cx="${S(44)}" cy="${S(17)}" r="${S(2.4)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(41.6)} ${S(16)}q${S(2.4)} ${S(-3)} ${S(4.8)} 0Z" fill="${P.ink('#2a2826')}"/>` + P.fill(`M${S(41.6)} ${S(22)}L${S(42)} ${S(19)}H${S(46)}L${S(46.4)} ${S(22)}Z`, '#2a3a5a', { w: .35 });
  // the cargo of casks amidships
  for (const [x, y] of [[20, 34], [28, 33], [36, 33], [44, 33], [52, 34], [24, 30], [48, 30]]) b += P.fill(P.ellipse(x * s, y * s, 4 * s, 3.2 * s), '#8a6438', { w: .4 }) + P.line(`M${S(x - 4)} ${S(y)}h${S(8)}`, '#4a3424', .5);
  // the hull: wide bluff bow, the gunwale, the leeboards
  b += P.fill(`M${S(8)} ${S(36)}Q${S(36)} ${S(30)} ${S(64)} ${S(36)}Q${S(62)} ${S(50)} ${S(36)} ${S(52)}Q${S(10)} ${S(50)} ${S(8)} ${S(36)}Z`, '#2f2a26', { w: .6 });
  b += P.line(`M${S(9)} ${S(37)}Q${S(36)} ${S(31.6)} ${S(63)} ${S(37)}`, '#2f6a4a', 1.4 * s) + P.line(`M${S(14)} ${S(43)}Q${S(36)} ${S(40)} ${S(58)} ${S(43)}`, '#d8b45a', .7 * s);
  for (const k of [-1, 1]) b += P.fill(`M${S(36 + k * 27)} ${S(36)}l${S(k * 5)} ${S(4)}l${S(k * -1)} ${S(12)}l${S(k * -4)} ${S(-2)}Z`, '#5a3e2a', { w: .45 });
  b += `<path d="M${S(2)} ${S(52)}Q${S(36)} ${S(57)} ${S(70)} ${S(52)}" fill="none" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(1.2)}" opacity=".7"/>`;
  return { svg: doc(f(W), f(H), b), w: W, h: H, ax: W / 2, ay: 51 * s };
}

// ---------- our bridge ----------
/** A street organ on its cart: the painted front with its pipes and figures, the big wheel the grinder turns. */
function organ(P, x, by, s) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(by - k * s);
  let d = '';
  d += `<circle cx="${X(-14)}" cy="${Y(6)}" r="${f(6 * s)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(1.4 * s)}"/><circle cx="${X(14)}" cy="${Y(6)}" r="${f(6 * s)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(1.4 * s)}"/>`;
  d += P.fill(`M${X(-20)} ${Y(10)}H${X(20)}V${Y(40)}H${X(-20)}Z`, '#7a2a2a', { w: .6 });
  // the façade: an arch of gilt, pipes, two little figures, painted panels
  d += P.fill(`M${X(-18)} ${Y(40)}Q${X(-18)} ${Y(54)} ${X(0)} ${Y(56)}Q${X(18)} ${Y(54)} ${X(18)} ${Y(40)}Z`, '#d8a83a', { w: .55 });
  d += P.fill(`M${X(-14)} ${Y(40)}Q${X(-14)} ${Y(50)} ${X(0)} ${Y(52)}Q${X(14)} ${Y(50)} ${X(14)} ${Y(40)}Z`, '#2f5a8a', { w: .4 });
  for (let i = 0; i < 9; i++) { const px = -11 + i * 2.75, ph = 6 + (4 - Math.abs(i - 4)) * 1.4; d += P.fill(`M${X(px)} ${Y(30)}V${Y(30 + ph)}h${f(1.8 * s)}V${Y(30)}Z`, '#e8c86a', { w: .3 }); }
  for (const k of [-1, 1]) d += P.fill(`M${X(k * 16 - 1.6)} ${Y(20)}v${f(-10 * s)}h${f(3.2 * s)}v${f(10 * s)}Z`, k > 0 ? '#c8463a' : '#2f6a4a', { w: .3 }) + `<circle cx="${X(k * 16)}" cy="${Y(31.6)}" r="${f(1.6 * s)}" fill="${P.ink('#e8c4a0')}"/>`;
  d += P.fill(`M${X(-12)} ${Y(14)}H${X(12)}V${Y(26)}H${X(-12)}Z`, '#efe2c0', { w: .4 }) + P.line(`M${X(-10)} ${Y(20)}q${f(5 * s)} ${f(-5 * s)} ${f(10 * s)} 0t${f(10 * s)} 0`, '#c8463a', .8 * s);
  d += P.line(`M${X(-9)} ${Y(42.5)}q${f(4.5 * s)} ${f(-3 * s)} ${f(9 * s)} 0t${f(9 * s)} 0`, '#7a2a2a', .9 * s) + `<circle cx="${X(0)}" cy="${Y(46)}" r="${f(2 * s)}" fill="${P.ink('#f2ead6')}" stroke="${P.ink('#7a2a2a')}" stroke-width=".5"/>`;
  // the grinder beside it
  d += P.person(x + 30 * s, by, s, 'worker', { c: '#3a4a3a', hat: '#2a2826', dir: -1 });
  return d;
}
function flywheel(P, s) {
  const r = 7 * s, W = r * 2 + 2, c = W / 2, f = P.f;
  let b = `<circle cx="${f(c)}" cy="${f(c)}" r="${f(r)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(1.2 * s)}"/>`;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; b += `<path d="M${f(c)} ${f(c)}L${f(c + Math.cos(a) * r)} ${f(c + Math.sin(a) * r)}" stroke="${P.ink('#5a4632')}" stroke-width="${f(.6 * s)}"/>`; }
  b += `<path d="M${f(c)} ${f(c)}L${f(c + r * .9)} ${f(c)}" stroke="${P.ink('#d8a83a')}" stroke-width="${f(1.2 * s)}"/><circle cx="${f(c)}" cy="${f(c)}" r="${f(1.4 * s)}" fill="${P.ink('#d8a83a')}"/>`;
  return { svg: doc(f(W), f(W), b), w: W, h: W, ax: c, ay: c };
}
