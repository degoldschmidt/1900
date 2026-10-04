// Sarajevo, looking up the Miljacka along the Appel Quay: the little green tram coming down the quay toward us, the
// Latin Bridge's four arches and its round "eyes" across the river, the corner where the Archduke was shot on 28 June
// (black crape at its windows), the striped Vijećnica closing the view, minarets over the roofs, Trebević above the
// Bistrik bank; Bosniaks in fezzes, veiled women, a gendarme, pigeons on the paving.

// the quay in perspective: X across (metres, right of the eye), Y up, Z away from us
const VX = 318, VY = 244, FL = 230, EYE = 2.6;
const pr = (X, Y, Z) => [VX + FL * X / Z, VY + FL * (EYE - Y) / Z];
const QX = -12, PX = 3, SX = 31; // the house fronts, the parapet, the far (south) bank
const BZ = 38, HUMP = 1; // the Latin Bridge and the rise of its deck

export default {
  id: 'SAR',
  greet: 'GRUSS aus SARAJEVO',
  nation: 'AH',
  flag: 'AH',
  flower: 'pomegranate',
  flower2: 'damask-rose',
  frame: { band: ['#653456', '#382337'], gold: '#d6b25c', ink: '#1f3a3a', leaf: ['#86a85e', '#3f6a3a'], year: '#5a2440', halo: '#f6ead0' },
  horizon: 244,
  clouds: 3,
  wind: -1,
  birds: { c: '#8f96a3', n: 4, y: 150, s: 1 },
  pal: {
    key: '#2a2523', wall: '#eedfc0', wall2: '#e6c89a', wall3: '#ead2cc', wall4: '#d8dcc6', stone: '#d9cfb9', stone2: '#b2a68c',
    roof: '#8c4a35', roof2: '#6b5a4b', ochre: '#dca65c', brick: '#b5583f', water: '#7b9f8e', gravel: '#bcb19a',
    ground: '#d3c5a4', hill: '#76935a', forest: '#4e6e45', glass: '#3a4655', sash: '#efe5d0', iron: '#2e3935', gold: '#d4a73a', tram: '#2f6a4f',
  },

  // a pomegranate split to show its seeds, its scarlet flower beside it
  flowerArt(F) {
    const I = F.I, f = F.f;
    let s = F.leaf(22, 8, 215, I.leaf[1], { shape: 'lance' }) + F.leaf(21, 7, 148, I.leaf[0], { shape: 'lance' }) + F.leaf(17, 6, 262, I.leaf[0], { shape: 'lance' }) + F.leaf(16, 6, 92, I.leaf[1], { shape: 'lance' });
    // the blossom, a waxy cup with crumpled petals
    s += F.at(-12, 9, F.radial(5, 7, 6.4, '#e0402e', { shape: 'frill' }) + `<path d="M-3 4L-4 -1Q0 -3 4 -1L3 4Z" fill="#c8402a" stroke="${I.key}" stroke-width=".5"/>` + F.disc(1.6, '#f2c84a'), 200, .9);
    // the fruit, its crown, the split
    s += `<circle cx="2" cy="1" r="12.5" fill="#b8302a" stroke="${I.key}" stroke-width=".65"/><path d="M-6 -4Q-2 -10 6 -8" stroke="#e8705a" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>`;
    s += `<path d="M-1 -10.5L-2.6 -16L0 -13.4L2 -17.4L4 -13.4L6.6 -16L5 -10.5Z" fill="#a02c26" stroke="${I.key}" stroke-width=".5"/>`;
    s += `<path d="M1 0Q7 -5 13 1Q8 9 1 7Q-1 3 1 0Z" fill="#f4dcc4" stroke="${I.key}" stroke-width=".5"/>`;
    for (const [x, y] of [[4, 1], [7, 0], [10, 2], [5, 4], [8, 4], [3, 5.5], [6.4, 6.4], [9.6, -1.5]]) s += `<circle cx="${f(x)}" cy="${f(y)}" r="1.25" fill="#d23a4a" stroke="#8a1a28" stroke-width=".3"/>`;
    return s;
  },
  // a damask rose, loose and pink, with its buds
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(15, 7, 215, I.leaf[1], { shape: 'serrate' }) + F.leaf(14, 6, 140, I.leaf[0], { shape: 'serrate' });
    s += F.radial(5, 10, 10, '#d9748e', { shape: 'heart', lite: '#f2a8b8' }) + F.radial(5, 6.6, 7, '#e88ea4', { rot: 36, shape: 'heart' });
    s += `<path d="M-2 0a2 2 0 1 1 3 1.4a3 3 0 1 1 -4.6 -2.4" fill="none" stroke="#b84a66" stroke-width=".7"/>` + F.disc(1.1, '#e8c25a');
    return s;
  },

  back(P) {
    let s = '';
    // the hills that close the valley: Vratnik's houses on the left, the Yellow Bastion, Trebević's forests on the right
    s += P.far(.82, () => P.fill('M24 200C80 186 150 196 220 208C260 214 300 206 340 210C380 214 420 206 470 198L580 186V260H24Z', '#8fa4a0') + P.line('M24 200C80 186 150 196 220 208', '#7f948f', .6));
    s += P.far(.62, () => hills(P));
    // the old town on the far bank, minarets among the roofs; the Emperor's Mosque on the Bistrik bank
    s += P.far(.5, () => oldTown(P));
    s += P.far(.42, () => vijecnica(P));
    s += P.far(.45, () => southBank(P));
    s += P.smoke(214, 214, .5) + P.smoke(452, 222, .45);
    return s;
  },

  mid(P, T) {
    const { f } = P;
    let s = '';
    // the river in its stone channel: the water low over gravel, the far wall
    s += river(P);
    // the Latin Bridge
    s += P.far(.2, () => latinBridge(P));
    // the quay: paving running away to the Vijećnica, the tram's rails
    s += quay(P);
    // the houses along the quay, the corner of Franz Joseph Street with Schiller's shop
    s += P.far(.08, () => quayHouses(P));
    // the parapet and its young trees and lamps
    s += parapet(P);
    // people on the quay, in perspective, the far ones first
    const folk = (pts) => fezCrowd(P, pts.sort((m, n) => n[1] - m[1]).map(([X, Z]) => { const [x, y] = pr(X, 0, Z); return [x, y, 13.4 / Z]; }));
    s += P.far(.25, () => folk([[-10.4, 62], [-9.6, 60], [-3.4, 66], [-.6, 54], [1.6, 57], [-6.4, 50], [-10.6, 46]]));
    s += P.far(.12, () => folk([[-10.6, 31], [-9.7, 30], [-4.2, 34], [.2, 27], [2, 32], [-1.2, 23], [-10.4, 21], [1.4, 18]]));
    { const [gx, gy] = pr(-10.8, 0, 24); s += gendarme(P, gx, gy, 13.4 / 24); }
    // the kafana's tables in front of the near shop: men in fezzes over their coffee
    for (const [X, Z] of [[-9.6, 10.5], [-9.4, 13.4]]) {
      const [x, y] = pr(X, 0, Z), k = 13.4 / Z;
      s += P.fill(`M${f(x - 6 * k)} ${f(y - 9 * k)}h${f(12 * k)}v${f(-1.4 * k)}h${f(-12 * k)}Z`, '#efe6d0', { w: .4 }) + P.line(`M${f(x)} ${f(y - 9 * k)}V${f(y)}M${f(x - 4 * k)} ${f(y)}h${f(8 * k)}`, '#3a2a1e', Math.max(.6, k * .8));
      s += `<circle cx="${f(x - 2 * k)}" cy="${f(y - 11 * k)}" r="${f(1 * k)}" fill="${P.ink('#f2efe6')}"/>`;
      s += fezMan(P, x - 8 * k, y, k * .92, { c: '#3a3530', dir: 1 }) + fezMan(P, x + 8 * k, y, k * .92, { c: '#4a4038', dir: -1, sash: '#2f5a4a' });
    }
    // at the parapet: a gendarme, a man in a fez, a lady looking at the river
    { const at = (X, Z) => [...pr(X, 0, Z), 13.4 / Z]; const [ax, ay, ak] = at(1.4, 11.4), [bx, by, bk] = at(.6, 10.6), [cx, cy, ck] = at(2.2, 12.6);
      s += gendarme(P, cx, cy, ck) + fezMan(P, ax, ay, ak, { c: '#3a4a3a', dir: 1, sash: '#b8322c' }) + P.person(bx, by, bk * .97, 'lady', { c: '#ebd9c8', parasol: '#e6c7d0', dir: 1 }); }
    // at war, a picket of infantry at the corner
    if (P.war === 'war') for (const [X, Z] of [[-2.4, 36], [-1.6, 36.6], [-.8, 35.6], [-2, 30]]) { const [x, y] = pr(X, 0, Z); s += P.person(x, y, 13.4 / Z, X === -2 ? 'officer' : 'soldier', { dir: -1 }); }
    // the tram, coming down the quay toward us
    const tr = (Z, k) => { const [x, y] = pr(-7.6, 0, Z); return [f(x), f(y), k]; };
    s += P.mover(T.tram({ c: 'tram', band: '#f1e7c9', number: '3', s: 1.05 }), { path: [[...tr(150, .1), 0, 0], [...tr(120, .13), .04, 1], [...tr(44, .35), .3], [...tr(44, .35), .42], [...tr(22, .7), .62], [...tr(13.4, 1.15), .78, 1], [...tr(12, 1.28), .8, 0], [...tr(12, 1.28), 1, 0]], dur: 50, offset: 6 });
    // a horse cart and townsfolk over the Latin Bridge, behind its parapet (drawn in front)
    const [bx0, by0] = pr(PX - .5, 0, BZ), [bx1, by1] = pr(SX + .5, 0, BZ), [, bym] = pr(0, HUMP, BZ);
    s += P.mover(T.cart({ s: .36, dir: 1, load: '#c9b27a', horse: '#6a4a32' }), { path: [[bx0, by0, 1, 0, 0], [bx0 + 6, by0 - 1, 1, .04, 1], [(bx0 + bx1) / 2, bym, 1, .5], [bx1 - 6, by1 - 1, 1, .9, 1], [bx1, by1, 1, .94, 0], [bx1, by1, 1, 1, 0]], dur: 60, offset: 20 });
    s += P.mover(fezWalkers(P, { s: .4, dir: -1, kinds: ['fez', 'zar'] }), { path: [[bx1, by1 + 1, 1, 0, 0], [bx1 - 6, by1, 1, .04, 1], [(bx0 + bx1) / 2, bym + 1, 1, .5], [bx0 + 6, by0, 1, .9, 1], [bx0, by0 + 1, 1, .94, 0], [bx0, by0, 1, 1, 0]], dur: 90, offset: 50 });
    // the bridge's roadway is where the newsboy crosses in the tension, and the soldiers march at war
    s += P.setStreet(f(bym + 2.5), bx0, bx1, .36);
    // strollers along the house fronts, coming toward us and walking away
    const walk = (X, zs, k0) => zs.map((Z, i) => { const [x, y] = pr(X, 0, Z); return [f(x), f(y), f(13.4 / Z / k0 * .96), i / (zs.length - 1), i === 0 || i === zs.length - 1 ? 0 : 1]; });
    const toward = walk(-9.9, [96, 90, 40, 20, 12, 8.4, 7.6], 1), away = walk(-8.4, [6.2, 6.8, 9, 14, 30, 70, 78], 1);
    s += P.mover(fezWalkers(P, { s: 1, dir: -1, kinds: ['fez', 'zar'] }), { path: toward, dur: 70, offset: 10 });
    s += P.mover(T.walkers({ kinds: ['officer', 'lady'], s: 1, dir: 1, seed: 5, dresses: ['#e9dfe8', '#f2ece0'] }), { path: away, dur: 74, offset: 44 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the bridge's parapet, so the cart passes behind it
    s += P.far(.2, () => bridgeParapet(P));
    // a vendor's handcart by the parapet: watermelons in summer, roast chestnuts in autumn and winter, lilac in spring
    s += stall(P, ...pr(.4, 0, 8.2), 230 / 8.2);
    // pigeons on the paving
    s += pigeons(P, [[120, 352], [132, 356], [146, 351], [170, 358], [186, 353], [224, 360], [256, 355], [104, 360]]);
    // the lamp on the corner of the quay
    s += P.lamp(70, 372, 1.15, 'bracket', { h: 78 });
    // a Bosniak gentleman and his wife walk up the quay; a gendarme at the parapet; a simit boy
    s += bosniak(P, 214, 404, 1.12) + zarWoman(P, 250, 404, 1.06);
    return s;
  },
};

/** Black crape for the Archduke in the weeks after 28 June, until the war takes the flags out. */
const mourning = (P) => P.war !== 'war' && (P.st?.day ?? 0) < 30;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
const quad = (P, pts) => P.poly(pts.map(([X, Y, Z]) => pr(X, Y, Z)));

// ---------- the far valley ----------
function hills(P) {
  const { f } = P;
  let s = '';
  // Vratnik on the left, Trebević on the right, a low shoulder between where the river comes down
  const left = 'M24 150C60 146 120 160 170 178C220 196 260 212 300 224L300 262H24Z';
  const right = 'M330 224C370 196 420 160 470 140C510 126 550 120 580 122V262H330Z';
  s += P.fill(left, 'hill') + P.stipple(left, 'hill', 70, { box: [24, 146, 280, 116], op: .4 });
  s += P.fill(right, 'forest') + P.stipple(right, 'forest', 80, { box: [330, 120, 250, 140], op: .45 });
  s += P.lite('M340 222C380 196 430 164 476 146C452 170 420 196 380 226Z', 'forest', .18, { op: .7 });
  if (P.L.snow) s += P.flat(left, '#eef2f5', { op: .55 }) + P.flat(right, '#eef2f5', { op: .5 });
  // the Yellow Bastion on its knoll
  s += P.fill('M120 166L150 160L176 168V178H120Z', 'ochre', { w: .5 }) + P.shade('M164 165L176 168V178H164Z', 'ochre', .2);
  for (let x = 122; x < 176; x += 6) s += P.flat(P.rect(x, 164 - (x < 150 ? (x - 120) * .2 : (176 - x) * .3), 3, 2), 'ochre');
  // houses climbing Vratnik: white walls, steep dark roofs, cypresses and poplars between
  const r = P.rng(17);
  for (let i = 0; i < 34; i++) {
    const x = 34 + r() * 250, top = 150 + (x - 24) * .26 + 6, y = top + 6 + r() * (250 - top - 10), w = 6 + r() * 6, h = 4 + r() * 3;
    if (y > 254) continue;
    s += P.fill(P.rect(x, y - h, w, h), r() < .7 ? '#f2ede0' : 'wall2', { w: .35 }) + P.fill(P.poly([[x - 1.5, y - h], [x + w / 2, y - h - h * .9], [x + w + 1.5, y - h]]), r() < .6 ? 'roof2' : 'roof', { w: .35 });
    if (P.L.windows > .2 && r() < P.L.windows) s += `<rect x="${f(x + w * .3)}" y="${f(y - h * .7)}" width="1.6" height="1.6" fill="${P.glow('#ffd88a')}"/>`; else r();
  }
  for (let i = 0; i < 14; i++) { const x = 40 + r() * 250, y = 170 + (x - 24) * .22 + r() * 50; if (y < 252) s += P.tree(x, y, .32 + r() * .1, r() < .6 ? 'cypress' : 'poplar'); }
  // little minarets on the hillside
  for (const [x, y, h] of [[96, 196, 22], [182, 214, 18], [62, 226, 20]]) s += minaret(P, x, y, h, 2.4);
  return s;
}
/** A minaret: a slender shaft, its balcony, a pointed cap with its crescent; base at (x, by). */
function minaret(P, x, by, h, w) {
  const { f } = P;
  let s = P.fill(P.rect(x - w / 2, by - h, w, h), '#f3eee2', { w: .4 }) + P.shade(P.rect(x + w * .1, by - h, w * .4, h), '#f3eee2', .15);
  s += P.fill(P.rect(x - w * .85, by - h * .72, w * 1.7, w * .45), '#e0d8c6', { w: .35 });
  s += P.fill(P.spire(x, by - h, w * 1.05, h * .3), 'roof2', { w: .4 }) + P.line(`M${f(x)} ${f(by - h * 1.3)}v${f(-w * .8)}`, 'gold', .5);
  return s;
}
function oldTown(P) {
  const { f } = P;
  let s = '';
  // roofs of the čaršija behind the quay houses, the great minaret of the Begova mosque among them
  const r = P.rng(5);
  for (let x = 196; x < 300; x += 8 + r() * 6) { const y = 226 + r() * 10, w = 9 + r() * 7, h = 6 + r() * 4; s += P.fill(P.rect(x, y - h, w, h), r() < .5 ? '#f2ede0' : 'wall4', { w: .35 }) + P.fill(P.poly([[x - 2, y - h], [x + w / 2, y - h - 6], [x + w + 2, y - h]]), 'roof', { w: .35 }); }
  s += P.fill(P.dome(258, 228, 12, 10), '#8c8f8a') + P.fill(P.rect(250, 228, 16, 6), '#efe8d8', { w: .4 }) + P.line('M258 213v-4', 'gold', .6);
  s += minaret(P, 236, 236, 92, 4.6);
  s += minaret(P, 284, 232, 54, 3.4);
  return s;
}
/** The Vijećnica: the town hall of 1896, striped ochre and red, Moorish arches, crenellations and corner kiosks. */
function vijecnica(P) {
  const { f } = P;
  const x0 = 270, x1 = 358, by = 250, top = 206;
  let s = '';
  // the glass dome over its hall, behind
  s += P.fill(P.rect(305, top - 12, 18, 12), 'ochre') + P.fill(P.dome(314, top - 12, 10, 9), '#7f9a98') + P.line('M314 182v-4', 'gold', .6);
  // the body, banded in its two colours
  const body = P.rect(x0, top, x1 - x0, by - top);
  s += P.fill(body, 'ochre');
  let stripes = '';
  for (let y = top + 2; y < by; y += 4) stripes += `M${x0} ${f(y)}h${x1 - x0}v1.8h${-(x1 - x0)}Z`;
  s += P.flat(stripes, 'brick', { op: .85 }) + P.shade(P.rect(x1 - 18, top, 18, by - top), 'ochre', .15);
  // the projecting centre with its great horseshoe portal; windows in pairs under horseshoe arches
  s += P.fill(P.rect(302, top - 6, 24, by - top + 6), 'ochre') + P.flat(`M302 ${top - 2}h24v1.8h-24ZM302 ${top + 6}h24v1.8h-24Z`, 'brick');
  const horse = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w * .55)}A${f(w * .55)} ${f(w * .55)} 0 1 1 ${f(x + w)} ${f(y + w * .55)}V${f(y + h)}Z`;
  s += P.fill(horse(307, 222, 14, 28), '#5a3a2e') + P.line(`M305.6 ${by}V229A8.4 8.4 0 1 1 322.4 229V${by}`, '#f2e4c4', 1.1);
  for (let k = 0; k < 3; k++) s += P.fill(P.rect(304 - k * 2, by - 2 + k * 1.4, 20 + k * 4, 1.6), 'stone', { w: .3 });
  for (const [y, h] of [[212, 10], [229, 12]]) for (let x = x0 + 4; x < x1 - 4; x += 9) {
    if (x > 298 && x < 328) continue;
    const u = P.wr(), tone = P.wr(), on = u < P.L.windows;
    s += `<path d="${horse(x, y, 5.4, h)}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('#f2e4c4')}" stroke-width=".5"/>`;
  }
  // crenellations and the corner kiosks with their little domes
  let cren = '';
  for (let x = x0; x < x1; x += 4) cren += `M${x} ${top}v-2.6h2.2v2.6Z`;
  s += P.fill(cren, 'ochre', { w: .3 });
  for (const x of [x0 - 2, x1 - 8, 299, 323]) s += P.fill(P.rect(x, top - 12, 8, 12), 'ochre', { w: .45 }) + P.flat(`M${x} ${top - 8}h8v1.6h-8Z`, 'brick') + P.fill(P.dome(x + 4, top - 12, 4.4, 5), '#7f9a98', { w: .4 }) + P.line(`M${x + 4} ${top - 18}v-3`, 'gold', .5);
  s += P.fill(P.rect(x0 - 3, by - 2, x1 - x0 + 6, 2), 'stone2', { w: .3 });
  // the flag over the portal: in mourning these weeks, the black and gold at war
  s += !mourning(P) ? P.flag(314, top - 18, .7, 'AH', { h: 14 }) : P.line(`M314 ${top - 18}v-14`, '#5a4a3a', .9) + P.fill(`M314 ${top - 31}q5 1 9 0v11q-4 1 -9 0Z`, '#1d1c20', { w: .3 });
  return s;
}
function southBank(P) {
  const { f } = P;
  let s = '';
  // houses of the Bistrik bank receding along the river, poplars between them
  const r = P.rng(23);
  const walls = ['wall', 'wall3', 'wall4', 'wall2'];
  let Z = 210;
  while (Z > 46) {
    const len = 9 + r() * 7, h = 8 + r() * 6, z0 = Z, z1 = Z - len * (Z / 120);
    const [ax, ay] = pr(SX + 9, 0, z0), [bx, by] = pr(SX + 9, 0, z1), [, at] = pr(SX + 9, h, z0), [, bt] = pr(SX + 9, h, z1);
    s += P.fill(P.poly([[ax, ay], [ax, at], [bx, bt], [bx, by]]), walls[Math.floor(r() * 4)], { w: .4 });
    const ra = (ay - at) * .34, rb = (by - bt) * .34, roofD = P.poly([[ax + 1, at], [ax + (bx - ax) * .16, at - ra], [bx - (bx - ax) * .16, bt - rb], [bx - 1, bt]]);
    s += P.fill(roofD, r() < .6 ? 'roof' : 'roof2', { w: .4 }) + (P.L.snow ? P.flat(roofD, '#f2f5f8', { op: .8 }) : '');
    const n = Math.max(1, Math.round(len / 4));
    for (let i = 0; i < n; i++) for (const v of [.3, .62]) {
      const t = (i + .3) / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, yt = at + (bt - at) * t, ww = Math.max(.8, (bx - ax) / n * .4), wy = y + (yt - y) * (1 - v), wh = (y - yt) * .2;
      const u = P.wr(), tone = P.wr(), on = u < P.L.windows;
      s += `<path d="${P.rect(x, wy - wh, ww, wh)}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}"/>`;
    }
    if (r() < .5) { const [tx, ty] = pr(SX + 4, 0, z1 + 2); s += P.tree(tx, ty, Math.min(1, 30 / z1), 'poplar'); }
    Z = z1 - 1;
  }
  // the Emperor's Mosque: its lead dome and its minaret over the roofs
  const [mx, my] = pr(SX + 14, 0, 128);
  s += P.fill(P.rect(mx - 12, my - 22, 26, 22), '#efe8d6', { w: .5 }) + P.fill(P.dome(mx + 1, my - 22, 11, 11), '#8a8e8c') + P.line(`M${f(mx + 1)} ${f(my - 36)}v-4`, 'gold', .6);
  s += minaret(P, mx + 18, my, 78, 4);
  return s;
}

// ---------- the river and the Latin Bridge ----------
function river(P) {
  const { f } = P;
  let s = '';
  // the water, low in July over its stony bed; the far wall of the channel
  const W = -4.4;
  s += P.fill(P.poly([pr(PX, W, 12), pr(PX, W, 140), pr(SX, W, 140), [600, pr(SX, W, 12)[1]], [600, 420], [pr(PX, W, 12)[0], 420]]), 'water', { k: false });
  s += P.shade(P.poly([pr(PX, W, BZ), pr(PX, W, 140), pr(SX, W, 140), pr(SX, W, BZ)]), 'water', .3);
  // the sky in the water, in streaks, and the bridge's arches mirrored under it
  for (let k = 0; k < 7; k++) { const Z = 14 + k * 3.4, [x0, y0] = pr(PX + 5 + (k % 3), W, Z), [x1] = pr(SX - 2 - (k % 2) * 3, W, Z); s += P.line(`M${f(x0)} ${f(y0)}H${f(x1)}`, '#a8c8c8', 1.2 + k * .2, { op: .35 }); }
  const r = P.rng(3);
  for (let i = 0; i < 30; i++) { const Z = 13 + r() * 25, X = PX + 3 + r() * (SX - PX - 6), [x, y] = pr(X, W, Z); s += P.line(`M${f(x)} ${f(y)}h${f(6 + 260 / Z)}`, '#5f8576', .7, { op: .6 }); }
  // gravel bars under the near wall
  s += P.fill(P.poly([pr(PX, W, 9), pr(PX, W, BZ), pr(PX + 3, W, BZ), pr(PX + 7, W, 20), pr(PX + 6, W, 9)]), 'gravel', { w: .4 }) + P.stipple(P.poly([pr(PX, W, 9), pr(PX, W, BZ), pr(PX + 3, W, BZ), pr(PX + 7, W, 20), pr(PX + 6, W, 9)]), 'gravel', 50, { box: [330, 280, 160, 100], op: .6 });
  // the far wall, its coping, the Bistrik quay above
  s += P.fill(P.poly([pr(SX, W, BZ), pr(SX, 0, BZ), pr(SX, 0, 20), pr(SX, W, 20)]), 'stone2') + P.stipple(P.poly([pr(SX, W, BZ), pr(SX, 0, BZ), pr(SX, 0, 20), pr(SX, W, 20)]), 'stone2', 30, { box: [500, 250, 100, 60], op: .4 });
  for (let k = 1; k < 4; k++) s += P.line(P.poly([pr(SX, W * k / 4, BZ), pr(SX, W * k / 4, 20)], false), '#8a7f68', .5, { op: .6 });
  s += P.fill(P.poly([pr(SX, 0, BZ), pr(SX, .4, BZ), pr(SX, .4, 20), pr(SX, 0, 20)]), 'stone', { w: .4 });
  // stones breaking the shallow water
  for (const [X, Z, k] of [[14, 16, 1], [19, 22, .8], [24, 14, 1.1], [11, 28, .7], [26, 30, .7]]) { const [x, y] = pr(X, W, Z), r = 200 / Z * k; s += P.fill(`M${f(x - r)} ${f(y)}q${f(r * .3)} ${f(-r * .7)} ${f(r)} ${f(-r * .6)}q${f(r * .8)} ${f(r * .1)} ${f(r)} ${f(r * .6)}Z`, 'gravel', { w: .4 }) + P.line(`M${f(x - r * 1.4)} ${f(y + 1)}h${f(r * 2.8)}`, '#e8f0ee', .6, { op: .7 }); }
  // a man fishing from the gravel
  const [gx, gy] = pr(PX + 4.2, W, 22);
  s += fezMan(P, gx, gy, .55, { c: '#5a4a3a', legs: '#3a3530' }) + P.line(`M${f(gx + 2)} ${f(gy - 10)}l14 -8`, '#5a4a3a', .5) + P.line(`M${f(gx + 16)} ${f(gy - 18)}v14`, '#c9c2b0', .3, { op: .7 });
  if (P.L.snow) s += P.flat(P.poly([pr(PX, W, 9), pr(PX, W, BZ), pr(PX + 3, W, BZ), pr(PX + 7, W, 20), pr(PX + 6, W, 9)]), '#f0f3f6', { op: .8 });
  return s;
}
function latinBridge(P) {
  const { f } = P;
  // its four arches between three piers; the deck humped toward the middle; an "eye" pierced over each pier
  const W = -4.4, piers = [PX, 9.6, 17.4, 25, SX], hump = (X) => HUMP * Math.sin(Math.PI * (X - PX) / (SX - PX));
  const deckTop = (X) => pr(X, hump(X) + .3, BZ), spring = W + 1.6;
  let outline = `M${P.poly([pr(PX - 1, W, BZ), pr(PX - 1, .3, BZ)], false).slice(1)}`;
  for (let X = PX; X <= SX + .01; X += 1) outline += `L${f(deckTop(X)[0])} ${f(deckTop(X)[1])}`;
  outline += `L${f(pr(SX + 1, .3, BZ)[0])} ${f(pr(SX + 1, .3, BZ)[1])}L${f(pr(SX + 1, W, BZ)[0])} ${f(pr(SX + 1, W, BZ)[1])}Z`;
  let holes = '';
  for (let i = 0; i < piers.length - 1; i++) {
    const a = piers[i] + (i ? .9 : 0), b = piers[i + 1] - (i < 3 ? .9 : 0), [ax, ay] = pr(a, spring, BZ), [bx] = pr(b, spring, BZ), crown = hump((a + b) / 2) - .9 - (i === 1 || i === 2 ? 0 : .6);
    const [, cy] = pr(0, crown, BZ), [, wy] = pr(0, W, BZ), rx = (bx - ax) / 2;
    holes += `M${f(ax)} ${f(wy)}V${f(ay)}A${f(rx)} ${f(ay - cy)} 0 0 1 ${f(bx)} ${f(ay)}V${f(wy)}Z`;
  }
  for (const X of piers.slice(1, -1)) { const [ex, ey] = pr(X, hump(X) - .9, BZ), er = FL * .62 / BZ; holes += P.circle(ex, ey, er); }
  let s = `<path d="${outline}${holes}" fill="${P.ink('stone')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width="${f(1 * (1 - P.depth * .45))}"/>`;
  s += P.stipple(outline, 'stone', 90, { box: [330, 230, 190, 60], op: .35 });
  // through the arches, the shadowed undersides; the voussoirs round each arch and eye
  s += `<path d="${holes}" fill="none" stroke="${P.dark('stone', .35)}" stroke-width="1.6"/>`;
  for (const X of piers.slice(1, -1)) { const [px, py] = pr(X, W, BZ), [, sy] = pr(X, spring + .3, BZ), pw = FL * 1.1 / BZ; s += P.fill(`M${f(px - pw)} ${f(py)}V${f(sy)}L${f(px)} ${f(sy - 3)}L${f(px + pw)} ${f(sy)}V${f(py)}Z`, 'stone2', { w: .45 }); }
  // the cornice under the parapet
  let cor = '';
  for (let X = PX - 1; X <= SX + 1.01; X += 1) { const [x, y] = pr(X, hump(Math.min(SX, Math.max(PX, X))) + .05, BZ); cor += `${cor ? 'L' : 'M'}${f(x)} ${f(y)}`; }
  s += P.line(cor, 'stone2', 1.6) + P.line(cor, null, .4, { op: .6 });
  // its reflection in the shallow water
  const [, wy] = pr(0, W, BZ);
  s += P.flat(P.poly([[pr(PX, 0, BZ)[0], wy + 1], [pr(SX, 0, BZ)[0], wy + 1], [pr(SX, 0, BZ)[0] + 8, wy + 14], [pr(PX, 0, BZ)[0] + 4, wy + 14]]), 'stone', { op: .18 });
  return s;
}
function bridgeParapet(P) {
  const { f } = P;
  const hump = (X) => HUMP * Math.sin(Math.PI * (X - PX) / (SX - PX));
  let top = '', bot = '';
  for (let X = PX - 1; X <= SX + 1.01; X += 1) { const k = Math.min(SX, Math.max(PX, X)), [x, y] = pr(X, hump(k) + 1.1, BZ), [, yb] = pr(X, hump(k) + .3, BZ); top += `${top ? 'L' : 'M'}${f(x)} ${f(y)}`; bot = `L${f(x)} ${f(yb)}` + bot; }
  return P.fill(top + bot + 'Z', 'stone') + P.lite(top + bot + 'Z', 'stone', .1, { op: .5 }) + P.line(top, 'stone2', .8);
}

// ---------- the quay ----------
function quay(P) {
  const { f } = P;
  let s = '';
  // the paving from the house fronts to the parapet, running away toward the Vijećnica
  const area = P.poly([pr(QX, 0, 4), pr(QX, 0, 160), pr(PX, 0, 160), pr(PX, 0, 4)]);
  s += P.fill(area, 'ground', { k: false });
  let j = '';
  for (let X = QX; X <= PX; X += 1.5) j += P.poly([pr(X, 0, 5), pr(X, 0, 120)], false);
  for (let Z = 5; Z < 120; Z *= 1.16) j += P.poly([pr(QX, 0, Z), pr(PX, 0, Z)], false);
  s += P.line(j, '#a8997c', .45, { op: .55 });
  // the kerb between the pavement and the road, and the tram's narrow-gauge rails
  s += P.line(P.poly([pr(QX + 3, 0, 4.5), pr(QX + 3, 0, 160)], false), '#8e826a', 1);
  for (const X of [-8.1, -7.1]) s += P.line(P.poly([pr(X, 0, 5), pr(X, 0, 160)], false), '#6d6a66', 1.1) + P.line(P.poly([pr(X + .06, 0, 5), pr(X + .06, 0, 160)], false), '#efe8d8', .4, { op: .6 });
  if (P.L.wet) { const r = P.rng(8); for (let i = 0; i < 7; i++) { const [x, y] = pr(QX + 4 + r() * 12, 0, 6 + r() * 30); s += P.flat(P.ellipse(x, y, 10 + 90 / (y - 240), 1.6), P.L.sky.low, { op: .5, raw: 1 }); } }
  if (P.L.snow) s += P.flat(area, '#f2f5f8', { op: .7 });
  // the poles carrying the tram's wire
  for (const Z of [9, 16, 28, 50]) { const [x, y] = pr(QX + 3.2, 0, Z), [, t] = pr(QX + 3.2, 7, Z); s += P.line(`M${f(x)} ${f(y)}V${f(t)}`, 'iron', Math.max(.6, 14 / Z)); }
  s += P.line(P.poly([pr(-7.6, 6.2, 8), pr(-7.6, 6.2, 160)], false), '#3a3a38', .5, { op: .55 });
  return s;
}
function quayHouses(P) {
  const { f } = P;
  let s = '';
  // the far houses toward the Vijećnica
  for (const [z0, z1, h, c] of [[66, 50, 11, 'wall4'], [50, 42, 13, 'wall2']]) s += house(P, z0, z1, h, c, { floors: 3, shop: false });
  // the corner of Franz Joseph Street: Schiller's shop on the ground floor, crape at the windows in July
  s += house(P, 38, 27, 11, 'wall', { floors: 2, shop: ['#7a2a2a', '#efe2c4'], corner: true, mourning: mourning(P) });
  s += house(P, 27, 15.5, 15, 'wall3', { floors: 3, shop: ['#2f5a4a', '#efe2c4'] });
  s += house(P, 15.5, 4, 17, 'wall2', { floors: 4, shop: ['#7a5a2a', '#f2e6cc'] });
  return s;
}
/** One house front on the quay, between depths z0 (far) and z1 (near), h metres high. */
function house(P, z0, z1, h, c, o = {}) {
  const { f } = P;
  const q = (Y, Z) => pr(QX, Y, Z);
  let s = P.fill(P.poly([q(0, z0), q(h, z0), q(h, z1), q(0, z1)]), c);
  s += P.shade(P.poly([q(0, z0), q(h, z0), q(h, z0 - (z0 - z1) * .06), q(0, z0 - (z0 - z1) * .06)]), c, .18);
  // the eaves and the roof seen from below
  s += P.fill(P.poly([q(h, z0), q(h + .7, z0), q(h + .7, z1), q(h, z1)]), 'roof2', { w: .5 });
  if (o.corner) s += P.fill(P.poly([q(h + .7, z0), q(h + 3.4, z0 + 1), q(h + 3.4, z0 + 3), q(h + .7, z0 + 4)]), 'roof', { w: .45 });
  // cornices between the floors
  const fh = (h - 4.4) / o.floors;
  for (let k = 0; k <= o.floors; k++) { const Y = 4.4 + k * fh - .3; s += P.fill(P.poly([q(Y, z0), q(Y + .3, z0), q(Y + .3, z1), q(Y, z1)]), c, { w: .35 }); }
  // windows: tall, with pediments over the first floor's
  const n = Math.max(2, Math.round((z0 - z1) / 2.6));
  for (let k = 0; k < o.floors; k++) for (let i = 0; i < n; i++) {
    const za = z0 - (z0 - z1) * (i + .3) / n, zb = z0 - (z0 - z1) * (i + .7) / n, Y0 = 4.4 + k * fh + fh * .22, Y1 = 4.4 + k * fh + fh * .82;
    const u = P.wr(), tone = P.wr(), on = u < P.L.windows;
    s += `<path d="${P.poly([q(Y0, za), q(Y1, za), q(Y1, zb), q(Y0, zb)])}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width="${f(Math.max(.35, 6 / za))}"/>`;
    if (k === 0) s += P.fill(P.poly([q(Y1 + .15, za + .2), q(Y1 + .7, (za + zb) / 2), q(Y1 + .15, zb - .2)]), c, { w: .35 });
    if (o.mourning && k === 0 && i % 2 === 0) s += P.flat(P.poly([q(Y1 + .1, za), q(Y1 + .1, zb), q(Y1 - 1.6, zb + .1), q(Y1 - .4, (za + zb) / 2), q(Y1 - 1.6, za - .1)]), '#1d1c20', { op: .9 });
  }
  // the shop: its window and door, an awning in stripes
  if (o.shop) {
    const [a, b] = o.shop;
    s += P.fill(P.poly([q(0, z0 - .3), q(3.4, z0 - .3), q(3.4, z1 + .3), q(0, z1 + .3)]), '#5a4434', { w: .4 });
    s += P.fill(P.poly([q(2.9, z0 - .5), q(3.4, z0 - .5), q(3.4, z1 + .5), q(2.9, z1 + .5)]), '#efe2c0', { w: .3 });
    const panes = Math.max(2, Math.round((z0 - z1) / 3.4));
    for (let i = 0; i < panes; i++) {
      const za = z0 - .6 - (z0 - z1 - 1.2) * i / panes, zb = z0 - .6 - (z0 - z1 - 1.2) * (i + .78) / panes, door = i === Math.floor(panes / 2);
      s += `<path d="${P.poly([q(door ? 0 : .6, za), q(2.5, za), q(2.5, zb), q(door ? 0 : .6, zb)])}" fill="${P.L.windows > .2 ? P.glow(door ? '#ffc86a' : '#ffd88a') : P.ink(door ? '#3a2e26' : '#7f9098')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
      if (!door && P.L.windows <= .2) s += P.flat(P.poly([q(.7, za - .2), q(1.3, za - .2), q(1.3, zb + .2), q(.7, zb + .2)]), '#d9c49a', { op: .8 });
    }
    const m = Math.max(3, Math.round((z0 - z1) / 1.2));
    for (let i = 0; i < m; i++) { const za = z0 - (z0 - z1) * i / m, zb = z0 - (z0 - z1) * (i + 1) / m; s += P.flat(P.poly([pr(QX, 3.9, za), pr(QX, 3.9, zb), pr(QX + 1.6, 3.1, zb), pr(QX + 1.6, 3.1, za)]), i % 2 ? a : b); }
    s += P.line(P.poly([pr(QX, 3.9, z0), pr(QX, 3.9, z1), pr(QX + 1.6, 3.1, z1), pr(QX + 1.6, 3.1, z0)]), null, .5);
  }
  // the crisis on its walls, a flag from a window at war
  const [wx, wy] = q(3.6, z1 + (z0 - z1) * .2), [wx2] = q(3.6, z1 + (z0 - z1) * .45);
  if (z0 - z1 > 8) s += P.wall(Math.min(wx, wx2), wy - Math.abs(wx - wx2) * 1.2, Math.abs(wx - wx2) * .8, Math.abs(wx - wx2) * 1.1);
  const [fx, fy] = q(4.4 + fh * .9, (z0 + z1) / 2);
  s += P.flagAt(fx, fy);
  if (o.mourning) { const [bx, by] = q(h - .6, z0 - .8), [, bt] = q(h + 2.6, z0 - .8); s += P.line(`M${f(bx)} ${f(by)}V${f(bt)}`, '#5a4a3a', .8) + P.fill(`M${f(bx)} ${f(bt)}q4 1 7 0v${f((by - bt) * 1.3)}q-3 1 -7 0Z`, '#1d1c20', { w: .3 }); }
  return s;
}
function parapet(P) {
  const { f } = P;
  let s = '';
  // the iron railing on its stone kerb along the river
  s += P.fill(P.poly([pr(PX, 0, 4.2), pr(PX, .35, 4.2), pr(PX, .35, BZ), pr(PX, 0, BZ)]), 'stone', { w: .45 });
  let rail = '';
  for (let Z = 4.6; Z < BZ; Z *= 1.07) rail += P.poly([pr(PX, .35, Z), pr(PX, 1.1, Z)], false);
  s += P.line(rail, 'iron', .6) + P.line(P.poly([pr(PX, 1.1, 4.2), pr(PX, 1.1, BZ)], false), 'iron', 1.3) + P.line(P.poly([pr(PX, .75, 4.2), pr(PX, .75, BZ)], false), 'iron', .6);
  // young trees and lamps along the parapet
  for (const Z of [28, 17]) { const [x, y] = pr(PX - 1.2, 0, Z), k = 7 / Z; s += P.fill(P.rect(x - 9 * k, y - 4 * k, 18 * k, 1.6 * k), '#5b4532', { w: .4 }) + P.line(`M${f(x - 8 * k)} ${f(y - 2.4 * k)}v${f(2.4 * k)}M${f(x + 8 * k)} ${f(y - 2.4 * k)}v${f(2.4 * k)}M${f(x - 9 * k)} ${f(y - 8 * k)}h${f(18 * k)}`, '#3a2a1e', Math.max(.5, k)); }
  for (const Z of [36, 24, 14.5]) { const [x, y] = pr(PX - .2, 0, Z); s += P.far(Math.min(.3, 2.4 / Z), () => P.lamp(x, y, 9.5 / Z, 'single', { h: 70 })); }
  return s;
}

// ---------- people ----------
/** A man in a fez: a red felt cone with its black tassel, over a coat (the kit's figure under it). */
function fezMan(P, x, y, s, o = {}) {
  const { f } = P, top = y - 30 * s, dir = o.dir ?? 1;
  let d = P.person(x, y, s, 'sailor', { c: o.c ?? '#3a3a40', legs: o.legs ?? '#2c2c30', dir, stride: o.stride });
  d += P.fill(`M${f(x - 2.5 * s)} ${f(top + 3.4 * s)}L${f(x - 1.9 * s)} ${f(top - .8 * s)}H${f(x + 1.9 * s)}L${f(x + 2.5 * s)} ${f(top + 3.4 * s)}Z`, o.fez ?? '#b22a2a', { w: .35 });
  d += P.line(`M${f(x)} ${f(top - .6 * s)}q${f(-1.8 * s * dir)} ${f(.4 * s)} ${f(-2.2 * s * dir)} ${f(2.6 * s)}`, '#1d1a17', .5 * s);
  if (o.sash) d += P.line(`M${f(x - 2.8 * s)} ${f(y - 13 * s)}h${f(5.6 * s)}`, o.sash, 1.1 * s);
  return d;
}
/** A woman in the black zar, veiled, the hem of bright dimije showing. */
function zarFigure(P, x, y, s, o = {}) {
  const { f } = P;
  let d = P.person(x, y, s, 'nun', { c: '#1f1d24', dir: o.dir ?? 1, stride: o.stride });
  d += P.flat(`M${f(x - 4.6 * s)} ${f(y - .2 * s)}h${f(9.2 * s)}v${f(-1.6 * s)}h${f(-9.2 * s)}Z`, o.dimije ?? '#c9567a');
  return d;
}
function fezCrowd(P, pts) {
  let s = '';
  const r = P.rng(Math.round(pts[0][0]));
  for (const [x, y, k] of pts) {
    const u = r();
    s += u < .55 ? fezMan(P, x, y, k, { c: ['#3a3a40', '#4a3a2e', '#2f3a4a', '#5a5048'][Math.floor(r() * 4)], dir: r() < .5 ? 1 : -1 }) : u < .75 ? zarFigure(P, x, y, k, { dir: r() < .5 ? 1 : -1 }) : P.person(x, y, k, u < .88 ? 'lady' : 'gent', { c: u < .88 ? '#e9dcc8' : '#2f3440', dir: r() < .5 ? 1 : -1, parasol: u < .82 ? '#e6c7d0' : null });
  }
  return s;
}
/** Walkers in fezzes and veils, two frames of the stride. */
function fezWalkers(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, kinds = o.kinds ?? ['fez', 'zar'], gap = 8 * s, W = (kinds.length - 1) * gap + 20 * s, H = 38 * s;
  const coats = ['#3a3a40', '#4a3a2e', '#2f3a4a'];
  const frame = (st) => {
    const b = kinds.map((k, i) => (k === 'zar' ? zarFigure(P, 10 * s + i * gap, 36 * s, s * .96, { dir: 1, stride: (st + i) % 2 }) : fezMan(P, 10 * s + i * gap, 36 * s, s, { c: coats[i % 3], dir: 1, stride: (st + i) % 2 }))).join('');
    return dir < 0 ? `<g transform="translate(${f(W)} 0) scale(-1 1)">${b}</g>` : b;
  };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 * s };
}
/** A gendarme of the Bosnian corps: dark green, his helmet's black cock-feathers, a rifle slung. */
function gendarme(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  let d = P.person(x, y, s, 'sailor', { c: '#3c4a3a', legs: '#2f3a30' });
  d += P.fill(`M${f(x - 2.8 * s)} ${f(top + 3.2 * s)}Q${f(x)} ${f(top - 2.4 * s)} ${f(x + 2.8 * s)} ${f(top + 3.2 * s)}Z`, '#2a3328', { w: .35 });
  d += P.fill(`M${f(x + .6 * s)} ${f(top)}q${f(3 * s)} ${f(-3.4 * s)} ${f(5.6 * s)} ${f(-1.6 * s)}q${f(-2.6 * s)} ${f(.4 * s)} ${f(-4 * s)} ${f(3.4 * s)}Z`, '#141416', { w: .2 });
  d += P.line(`M${f(x - 2.4 * s)} ${f(y - 22 * s)}l${f(4 * s)} ${f(10 * s)}`, '#d8d0b8', .5 * s) + P.line(`M${f(x + 2.2 * s)} ${f(y - 16 * s)}l${f(1.6 * s)} ${f(-14 * s)}`, '#3b2c1e', 1 * s);
  return d;
}
/** A Bosniak gentleman seen from behind, walking up the quay: a dark coat, his fez. */
function bosniak(P, x, by, s) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(by - k * s), key = P.keyC(), w = f(.8);
  const path = (d, c) => `<path d="${d}" fill="${P.ink(c)}" stroke="${key}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const coat = '#3a3530', legs = '#2e2c30', skin = '#d9b08c';
  let out = '';
  out += path(`M${X(-6)} ${Y(42)}L${X(-10)} ${Y(1)}H${X(-5)}L${X(-.5)} ${Y(30)}Z`, legs) + path(`M${X(.5)} ${Y(30)}L${X(5)} ${Y(1)}H${X(10)}L${X(6)} ${Y(42)}Z`, '#26242a');
  out += path(`M${X(-12)} ${Y(1)}Q${X(-8)} ${Y(-2)} ${X(-4.5)} ${Y(1)}Z`, '#141416') + path(`M${X(4.5)} ${Y(1)}Q${X(8)} ${Y(-2)} ${X(11.5)} ${Y(1)}Z`, '#141416');
  out += path(`M${X(-12)} ${Y(36)}L${X(-11)} ${Y(56)}Q${X(-12)} ${Y(74)} ${X(-13)} ${Y(82)}Q${X(0)} ${Y(88)} ${X(13)} ${Y(82)}Q${X(12)} ${Y(74)} ${X(11)} ${Y(56)}L${X(12)} ${Y(36)}Q${X(0)} ${Y(33)} ${X(-12)} ${Y(36)}Z`, coat);
  out += P.lite(`M${X(-12)} ${Y(80)}Q${X(-6)} ${Y(85)} ${X(-1)} ${Y(85)}L${X(-4)} ${Y(40)}H${X(-11)}Z`, coat, .1);
  out += `<path d="M${X(0)} ${Y(84)}V${Y(36)}" stroke="${P.dark(coat, .3)}" stroke-width="${f(.8 * s)}"/>`;
  out += path(`M${X(-13)} ${Y(82)}Q${X(-17)} ${Y(66)} ${X(-15)} ${Y(50)}L${X(-11)} ${Y(51)}Q${X(-12)} ${Y(66)} ${X(-10)} ${Y(78)}Z`, coat) + path(`M${X(13)} ${Y(82)}Q${X(17)} ${Y(68)} ${X(15)} ${Y(52)}L${X(11)} ${Y(53)}Q${X(12)} ${Y(66)} ${X(10)} ${Y(78)}Z`, coat);
  out += path(`M${X(-15.6)} ${Y(51.5)}q${f(1.6 * s)} ${f(-2.6 * s)} ${f(3.4 * s)} ${f(-.6 * s)}`, skin) + path(`M${X(11.6)} ${Y(53)}q${f(1.6 * s)} ${f(-2.6 * s)} ${f(3.4 * s)} ${f(-.6 * s)}`, skin);
  // a string of prayer beads hanging from the right hand
  out += `<path d="M${X(13.5)} ${Y(50)}q${f(1 * s)} ${f(-6 * s)} ${f(-1 * s)} ${f(-9 * s)}" fill="none" stroke="${P.ink('#7a4a2a')}" stroke-width="${f(1.1 * s)}" stroke-dasharray="${f(.9 * s)} ${f(.5 * s)}"/>`;
  out += path(`M${X(-5)} ${Y(84)}Q${X(0)} ${Y(87)} ${X(5)} ${Y(84)}V${Y(88)}H${X(-5)}Z`, '#f2efe6');
  out += path(`M${X(-4.6)} ${Y(87.5)}Q${X(-5.4)} ${Y(96)} ${X(0)} ${Y(97)}Q${X(5.4)} ${Y(96)} ${X(4.6)} ${Y(87.5)}Z`, '#3a2a20');
  // the fez, its tassel swinging
  out += path(`M${X(-6.4)} ${Y(95.5)}L${X(-5.2)} ${Y(107)}Q${X(0)} ${Y(108.4)} ${X(5.2)} ${Y(107)}L${X(6.4)} ${Y(95.5)}Q${X(0)} ${Y(94)} ${X(-6.4)} ${Y(95.5)}Z`, '#b22a2a');
  out += P.shade(`M${X(2)} ${Y(95)}L${X(2.6)} ${Y(107.4)}Q${X(4)} ${Y(107.3)} ${X(5.2)} ${Y(107)}L${X(6.4)} ${Y(95.5)}Z`, '#b22a2a', .2);
  out += `<path d="M${X(0)} ${Y(107.6)}Q${X(-6)} ${Y(106)} ${X(-7)} ${Y(99)}" fill="none" stroke="${P.ink('#1d1a17')}" stroke-width="${f(1.4 * s)}"/>`;
  return out;
}
/** A woman in the black zar seen from behind: the cloak from head to calf, dimije and yellow slippers below. */
function zarWoman(P, x, by, s) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(by - k * s), key = P.keyC(), w = f(.8);
  const path = (d, c) => `<path d="${d}" fill="${P.ink(c)}" stroke="${key}" stroke-width="${w}" stroke-linejoin="round"/>`;
  let out = '';
  out += path(`M${X(-9)} ${Y(1)}Q${X(-10)} ${Y(10)} ${X(-7)} ${Y(18)}H${X(7)}Q${X(10)} ${Y(10)} ${X(9)} ${Y(1)}Z`, '#c9567a');
  out += P.shade(`M${X(1)} ${Y(1)}V${Y(18)}H${X(7)}Q${X(10)} ${Y(10)} ${X(9)} ${Y(1)}Z`, '#c9567a', .2);
  out += path(`M${X(-9)} ${Y(1)}Q${X(-6)} ${Y(-2)} ${X(-2)} ${Y(1)}Z`, '#e2b83a') + path(`M${X(2)} ${Y(1)}Q${X(6)} ${Y(-2)} ${X(9)} ${Y(1)}Z`, '#e2b83a');
  out += path(`M${X(-13)} ${Y(16)}Q${X(-15)} ${Y(50)} ${X(-11)} ${Y(78)}Q${X(-9)} ${Y(92)} ${X(-5)} ${Y(97)}Q${X(0)} ${Y(101)} ${X(5)} ${Y(97)}Q${X(9)} ${Y(92)} ${X(11)} ${Y(78)}Q${X(15)} ${Y(50)} ${X(13)} ${Y(16)}Q${X(0)} ${Y(13)} ${X(-13)} ${Y(16)}Z`, '#1f1d24');
  out += P.lite(`M${X(-11)} ${Y(74)}Q${X(-7)} ${Y(92)} ${X(-2)} ${Y(97)}Q${X(-4)} ${Y(80)} ${X(-5)} ${Y(30)}Q${X(-9)} ${Y(40)} ${X(-11)} ${Y(74)}Z`, '#1f1d24', .12);
  for (const k of [-6, 0, 6]) out += `<path d="M${X(k * .5)} ${Y(86)}Q${X(k)} ${Y(50)} ${X(k * 1.4)} ${Y(18)}" stroke="${P.light('#1f1d24', .15)}" stroke-width="${f(.6 * s)}" fill="none"/>`;
  return out;
}
/** A vendor's handcart and the vendor in his fez; what he sells follows the season. x, y: the near wheel; k: px a metre. */
function stall(P, x, y, k) {
  const { f } = P, S = (m) => m * k, season = P.L.season, winter = season === 'winter' || season === 'autumn';
  let s = '';
  // the cart: a box on two wheels, its shafts resting on the paving
  s += P.line(`M${f(x + S(.2))} ${f(y - S(.55))}L${f(x - S(.9))} ${f(y - S(.05))}`, '#5b4532', S(.06));
  s += P.fill(P.rect(x, y - S(.95), S(1.5), S(.45)), '#7a5a3a') + P.shade(P.rect(x + S(1.1), y - S(.95), S(.4), S(.45)), '#7a5a3a', .2);
  for (const wx of [x + S(.35)]) s += `<circle cx="${f(wx)}" cy="${f(y - S(.32))}" r="${f(S(.3))}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(S(.05))}"/><path d="M${f(wx - S(.3))} ${f(y - S(.32))}h${f(S(.6))}M${f(wx)} ${f(y - S(.62))}v${f(S(.6))}" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(S(.03))}"/>`;
  if (winter) {
    // a brazier, its chestnuts and its smoke
    s += P.fill(P.rect(x + S(.4), y - S(1.25), S(.7), S(.3)), '#3a3634') + P.flat(P.rect(x + S(.45), y - S(1.3), S(.6), S(.08)), P.L.lamps > .05 ? '#ff9a4a' : '#c8582e');
    for (let i = 0; i < 7; i++) s += `<circle cx="${f(x + S(.5 + (i % 4) * .14))}" cy="${f(y - S(1.33 + Math.floor(i / 4) * .06))}" r="${f(S(.05))}" fill="${P.ink('#6a3a22')}"/>`;
    s += P.smoke(x + S(.75), y - S(1.4), .35);
    if (P.L.lamps > .05) P.glows.push({ x: x + S(.75), y: y - S(1.3), r: S(.9), depth: 0 });
  } else if (season === 'spring') {
    for (let i = 0; i < 9; i++) s += `<circle cx="${f(x + S(.15 + (i % 5) * .3))}" cy="${f(y - S(1.05 + Math.floor(i / 5) * .14))}" r="${f(S(.12))}" fill="${P.ink(i % 2 ? '#b892c8' : '#d8b6e0')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  } else {
    // a heap of watermelons, one cut to show its red heart
    const r = P.rng(4);
    for (let i = 0; i < 8; i++) { const cx = x + S(.2 + (i % 4) * .36 + (i > 3 ? .18 : 0)), cy = y - S(1.08 + (i > 3 ? .2 : 0)); s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(S(.2))}" ry="${f(S(.15))}" fill="${P.ink(r() < .5 ? '#3f6e34' : '#4c7d3a')}" stroke="${P.keyC()}" stroke-width=".4"/><path d="M${f(cx - S(.12))} ${f(cy - S(.06))}q${f(S(.12))} ${f(-S(.06))} ${f(S(.24))} 0" stroke="${P.ink('#8ab060')}" stroke-width=".5" fill="none"/>`; }
    s += P.fill(`M${f(x + S(1.2))} ${f(y - S(1.02))}a${f(S(.22))} ${f(S(.2))} 0 0 1 ${f(S(.44))} 0Z`, '#d8404a', { w: .4 }) + P.line(`M${f(x + S(1.2))} ${f(y - S(1.02))}h${f(S(.44))}`, '#3f6e34', S(.04));
  }
  // the vendor, in his fez and sash, at his cart
  s += fezMan(P, x + S(1.9), y + S(.05), S(1.75) / 30, { c: '#e8e0cc', legs: '#3a3a40', dir: -1, sash: '#b8322c' });
  return s;
}
/** Pigeons pecking on the paving. */
function pigeons(P, pts) {
  const { f } = P;
  let s = '';
  pts.forEach(([x, y], i) => {
    const d = i % 2 ? 1 : -1, c = i % 3 ? '#8f96a3' : '#a6a39a';
    s += P.fill(`M${f(x - 3 * d)} ${f(y)}q${f(3 * d)} -3.4 ${f(6 * d)} -1.4l${f(1.6 * d)} ${i % 2 ? .4 : -1.4}l${f(-1 * d)} 1.4q${f(-3 * d)} 1.6 ${f(-6.6 * d)} 0Z`, c, { w: .35 });
    s += `<circle cx="${f(x + 3.6 * d)}" cy="${f(y - (i % 2 ? 1.6 : 3))}" r="1.1" fill="${P.ink('#7a8090')}"/>` + P.line(`M${f(x)} ${f(y)}v1.4`, '#c9665a', .4);
  });
  return s;
}
