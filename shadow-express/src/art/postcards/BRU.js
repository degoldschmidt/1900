// Bruxelles, the Grand-Place on a market morning, looking south: the Hôtel de Ville across the square, its arcade, its
// rows of statues and its steep roof, the tower soaring to St Michael in gilt; on the right the guild houses run
// toward us, the Renard, the Cornet with its gable like a ship's stern, the Louve, the Sac, the Brouette and the Roi
// d'Espagne under its dome and its golden Fame; on the left the long front of the Ducs de Brabant. The flower market
// under its white umbrellas, a lace-maker at her pillow, a milk cart drawn by dogs, a fiacre, pigeons.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);

// the camera: standing in the north of the square, looking south. X right, Y up, Z away (metres from the eye).
const VX = 215, VY = 298, FL = 223, EYE = 3.5, HALL = 100, WEST = 47, EAST = -23;
const p3 = (X, Y, Z) => [VX + FL * X / Z, VY - FL * (Y - EYE) / Z];

export default {
  id: 'BRU',
  greet: 'SOUVENIR de BRUXELLES',
  nation: 'BE',
  flag: 'BE',
  flower: 'yellow-iris',
  flower2: 'forget-me-not',
  frame: { band: ['#81373e', '#46252b'], gold: '#d8b45e', ink: '#2a1a10', leaf: ['#7a9e5a', '#355734'], year: '#5a2a24', halo: '#f6ead0' },
  horizon: 296,
  clouds: 4,
  wind: 1,
  birds: { c: '#a4a6ae', n: 6, y: 150, s: 1 },
  pal: {
    key: '#2a2420', hall: '#cbbd9a', hall2: '#a6967a', guild: '#978672', guild2: '#7c705e', guild3: '#ab9776', slate: '#535a66', gilt: '#dcae3c',
    sett: '#bcae94', brab: '#a99a7c', glass: '#323d4a', sash: '#ece2cc', iron: '#2c302c', gold: '#d6a83a',
  },

  // a yellow flag iris: three falls hanging, veined in brown, three narrow standards upright, sword leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(34, 7, 196, I.leaf[1], { shape: 'lance' }) + F.leaf(32, 6, 164, I.leaf[0], { shape: 'lance' }) + F.leaf(24, 5, 222, I.leaf[0], { shape: 'lance' });
    s += F.stem('M0 22Q1 12 0 2', I.leaf[1], 1.5);
    for (const a of [-24, 24]) s += F.at(0, -1, F.petal(15, 6.4, '#eab62a', 'point', { lite: '#f8da6a' }), a);
    s += F.at(0, -1, F.petal(16, 6, '#f2c632', 'point', { lite: '#fae27a' }), 0);
    for (const a of [124, 236]) s += F.at(0, 1, F.petal(18, 11, '#f2c632', 'round', { vein: '#7a4a12', lite: '#fae27a' }), a);
    s += F.at(0, 2, F.petal(19, 12, '#f6cc38', 'round', { vein: '#7a4a12', lite: '#fae27a' }), 180);
    s += '<path d="M-2 6l2 3l2 -3M-1.4 9.4l1.4 2.2l1.4 -2.2" stroke="#7a4a12" stroke-width=".7" fill="none"/><circle cy="1" r="2" fill="#d8a020" stroke="#3a2e1e" stroke-width=".4"/>';
    return s;
  },
  // forget-me-nots
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 6, 200, I.leaf[1], { shape: 'oval' }) + F.leaf(14, 5, 158, I.leaf[0], { shape: 'oval' });
    for (const [x, y, k] of [[-6, 4, .72], [7, 3, .68], [1, -4, .95]]) s += F.at(x, y, F.radial(5, 6, 6.2, '#7aa2dc', { shape: 'round', lite: '#b2cdf0', k: .4 }) + F.disc(1.7, '#f4d65e', { k: .3 }), 0, k);
    return s;
  },

  back(P, T) {
    let s = '';
    // roofs and a church beyond, glimpsed past the corners
    s += P.far(.8, () => P.row(300, 340, 290, { hMin: 14, hMax: 22, wMin: 8, wMax: 12, style: 'north', seed: 9, walls: ['#cbbfaa', '#bfb09a'], roofC: '#7a6a62', placard: false, flagSpot: false, lit: 1.4 }));
    s += P.smoke(150, 222, .6) + P.smoke(330, 240, .5);
    // the Hôtel de Ville and its tower
    s += P.far(.42, () => hotelDeVille(P));
    // the long front of the Ducs de Brabant on the left, receding
    s += P.far(.32, () => brabant(P));
    // the guild houses on the right, the far ones first
    s += P.far(.3, () => guilds(P));
    // the square: setts in perspective
    s += P.paving(300, 382, { c: 'sett', vx: VX, seed: 21 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the flower market under its umbrellas, the far stalls first
    s += market(P, [[-12, 70], [-2, 72], [8, 68], [18, 74], [28, 70], [-16, 56], [-6, 58], [4, 54], [14, 57], [24, 55], [34, 58]]);
    s += P.crowd(70, 380, p3(0, 0, 62)[1], 12, { s: .3, seed: 7, kinds: ['lady', 'gent', 'peasant', 'lady', 'boater'] });
    s += market(P, [[-14, 42], [-4, 40], [6, 44], [16, 41], [27, 43], [-9, 30], [3, 31], [20, 29], [31, 31]]);
    s += P.crowd(50, 470, p3(0, 0, 36)[1], 12, { s: .46, seed: 13, kinds: ['peasant', 'lady', 'gent', 'girl', 'priest', 'boater'] });
    for (const [X, Z] of [[-16, 28], [34, 24]]) { const [x, y] = p3(X, 0, Z); s += P.lamp(x, y, FL * 4.6 / Z / 62, 'iron'); }
    s += P.flagAt(...p3(WEST - .3, 9, 46)) + P.flagAt(...p3(EAST + .3, 9, 40));
    // the dog-cart with the milk, a fiacre, the people crossing the square
    s += P.setStreet(352, 40, 560, .92);
    s += P.cross(dogcart(P, 1, .9), { y: 352, dir: 1, dur: 52, rest: .3, offset: 6 });
    s += P.cross(T.fiacre({ s: .62, horses: 1, body: '#2a2622', hood: '#3a2a22', dir: -1 }), { y: 336, dir: -1, dur: 60, rest: .35, offset: 30, x0: 60, x1: 520 });
    s += P.cross(T.walkers({ kinds: ['priest', 'gent'], s: .62, dir: 1, seed: 3 }), { y: 330, dir: 1, dur: 90, offset: 50, x0: 60, x1: 520 });
    return s;
  },

  front(P, T) {
    let s = '';
    // a big umbrella over a flower stall on the left, a lace-maker with her pillow on the right
    s += market(P, [[-12, 17], [9, 15.5]]);
    s += stall(P, 100, 382, 1.55, '#f4efe2');
    s += lacemaker(P, 470, 372, 1.2);
    s += P.wall(...p3(WEST - .2, 1.2, 33), 12, 16);
    s += P.person(206, 372, 1.14, 'lady', { c: '#ece4d2', parasol: '#e8c0c8', dir: 1 }) + P.person(222, 373, 1.12, 'gent', { c: '#2a2c32' });
    s += P.person(392, 372, 1.12, 'peasant', { c: '#5a4a3a', hat: '#f4f2ea', dir: -1 }) + flowers(P, 380, 372, 1.1);
    s += P.cross(T.walkers({ kinds: ['lady', 'girl'], s: 1.12, dir: -1, seed: 5, dresses: ['#f2ecd8', '#e8b9b3'] }), { y: 378, dir: -1, dur: 76, offset: 22, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady'], s: 1.1, dir: 1, seed: 19 }), { y: 380, dir: 1, dur: 88, offset: 60, z: 'fore' });
    return s;
  },
};

// ---------- gothic helpers ----------
function pinnacle(P, x, by, w, h, c = 'hall2') {
  return P.fill(P.spire(x, by, w, h), c, { w: .35 }) + P.line(`M${P.f(x)} ${P.f(by - h)}v-1.8`, c, .45);
}
function crockets(P, x0, y0, x1, y1, n = 7) {
  let d = '';
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, out = x1 < x0 ? -1 : 1; d += `M${P.f(x)} ${P.f(y)}q${P.f(out * 2.2)} -.5 ${P.f(out * 1.9)} -2.4`; }
  return `<path d="${d}" fill="none" stroke="${P.keyC()}" stroke-width="1.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${P.ink('hall')}" stroke-width=".6" stroke-linecap="round"/>`;
}

// ---------- the Hôtel de Ville ----------
function hotelDeVille(P) {
  const f = P.f, T = (X, Y) => p3(X, Y, HALL), k = FL / HALL;
  const X0 = -19, X1 = 39, TX = 9.5; // the front, the tower's axis
  let s = '';
  const R = (x0, y0, x1, y1) => { const [a, b] = T(x0, y1), [c, d] = T(x1, y0); return P.rect(a, b, c - a, d - b); };
  // the roof: steep slate, rows of dormers
  s += P.fill(P.poly([T(X0 - .5, 20), T(X0 + 6, 34), T(X1 - 6, 34), T(X1 + .5, 20)]), 'slate') + P.shade(P.poly([T(TX + 10, 34), T(X1 - 6, 34), T(X1 + .5, 20), T(TX + 12, 20)]), 'slate', .2);
  for (const [y, n] of [[23, 13], [28, 9]]) for (let i = 0; i < n; i++) { const x = X0 + 4 + i * (X1 - X0 - 8) / (n - 1); if (Math.abs(x - TX) < 6) continue; const [a, b] = T(x - .9, y + 2.6); s += P.fill(P.gable(a, b + 2.6 * k, 1.8 * k, 1.6 * k), 'slate', { w: .3 }) + `<rect x="${f(a + .4 * k)}" y="${f(b)}" width="${f(1 * k)}" height="${f(1.6 * k)}" fill="${P.ink('glass')}"/>`; }
  // the walls: two floors of cross windows over the arcade, statues in their niches between
  s += P.fill(R(X0, 0, X1, 20), 'hall') + P.stipple(R(X0, 0, X1, 20), 'hall', 90, { box: [T(X0, 20)[0], T(X0, 20)[1], (X1 - X0) * k, 20 * k], op: .3 });
  for (let i = 0; i < 17; i++) {
    const x = X0 + 1.4 + i * (X1 - X0 - 2.8) / 16;
    s += P.fill(P.gothic(T(x - 1.2, 0)[0], T(0, 5.2)[1], 2.4 * k, 5.2 * k), '#3a3430', { w: .3 });
    if (i % 2 === 0 && Math.abs(x - TX) > 4) for (const fy of [7, 13.2]) {
      const lit = P.wr() < P.L.windows, tone = P.wr(), [wx, wy] = T(x - 1.1, fy + 4.6);
      s += `<rect x="${f(wx)}" y="${f(wy)}" width="${f(2.2 * k)}" height="${f(4.6 * k)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".4"/>`;
      s += P.line(`M${f(wx + 1.1 * k)} ${f(wy)}v${f(4.6 * k)}M${f(wx)} ${f(wy + 1.6 * k)}h${f(2.2 * k)}`, 'sash', .35);
    }
    if (i % 2 === 1) for (const fy of [7.6, 13.8]) { const [nx, ny] = T(x, fy); s += P.fill(P.gothic(nx - .5 * k, ny - 3.6 * k, 1 * k, 3.6 * k), 'hall2', { w: .25 }) + P.flat(P.rect(nx - .25 * k, ny - 3 * k, .5 * k, 2.6 * k), '#7a6a52'); }
  }
  for (const y of [6.2, 12.4, 18.4]) s += P.fill(R(X0, y - .25, X1, y + .25), 'hall2', { w: .3 });
  // the parapet, its crenels and the turrets along it
  let cren = '';
  for (let x = X0; x < X1; x += 1.2) { const [a, b] = T(x, 21); cren += `M${f(a)} ${f(b)}h${f(.6 * k)}`; }
  s += P.fill(R(X0 - .3, 19.6, X1 + .3, 20.6), 'hall2', { w: .4 }) + P.line(cren, 'hall2', 1.6);
  for (const x of [X0, X0 + 9, X1 - 9, X1]) { const [a, b] = T(x - .8, 26); s += P.fill(P.rect(a, b, 1.6 * k, 6 * k), 'hall', { w: .35 }) + pinnacle(P, a + .8 * k, b + .2, 2.2 * k, 5 * k, 'slate'); }
  // the tower: square stages through the roof, the octagon in three stages, the pierced spire, St Michael
  s += tower(P, T, TX, k);
  return s;
}
function tower(P, T, TX, k) {
  const f = P.f;
  let s = '';
  const stage = (y0, y1, hw, o = {}) => {
    const [a, b] = T(TX - hw, y1), w = 2 * hw * k, h = (y1 - y0) * k;
    let d = P.fill(P.rect(a, b, w, h), 'hall') + P.shade(P.rect(a + w * .62, b, w * .38, h), 'hall', .2) + P.stipple(P.rect(a, b, w, h), 'hall', 18, { box: [a, b, w, h], op: .3 });
    const nw = o.lights ?? 2, ww = w * (nw > 1 ? .22 : .34);
    for (let i = 0; i < nw; i++) d += P.fill(P.gothic(a + w / 2 - (nw * ww + (nw - 1) * 2) / 2 + i * (ww + 2), b + h * .14, ww, h * .72), 'glass', { w: .3 }) + P.line(`M${f(a + w / 2 - (nw * ww + (nw - 1) * 2) / 2 + i * (ww + 2) + ww / 2)} ${f(b + h * .3)}V${f(b + h * .84)}`, 'hall2', .4);
    d += P.fill(P.rect(a - 1, b - 1.4, w + 2, 2), 'hall2', { w: .35 });
    if (o.pins) for (const x of [a, a + w]) d += pinnacle(P, x, b + .4, Math.max(2.4, w * .14), o.pins);
    return d;
  };
  s += stage(0, 20, 5.2, { lights: 1 });
  const [pa, pb] = T(TX - 1.8, 5);
  s += P.fill(P.gothic(pa, pb, 3.6 * k, 5 * k), '#2e2a26', { w: .4 });
  s += stage(20, 33, 4.8, { lights: 2, pins: 10 }) + stage(33, 44, 4.2, { lights: 2, pins: 9 });
  s += stage(44, 54, 3.4, { lights: 2, pins: 8 }) + stage(54, 63, 2.8, { lights: 1, pins: 7 }) + stage(63, 70, 2.2, { lights: 1, pins: 6 });
  // the spire, pierced and crocketed
  const [l, by] = T(TX - 2.1, 70), [r] = T(TX + 2.1, 70), [cx, tip] = T(TX, 88);
  s += P.fill(`M${f(l)} ${f(by)}L${f(cx)} ${f(tip)}L${f(r)} ${f(by)}Z`, 'hall') + P.shade(`M${f(cx)} ${f(tip)}L${f(r)} ${f(by)}H${f(cx + .5)}Z`, 'hall', .22);
  for (let i = 1; i < 6; i++) { const y = by - (by - tip) * i / 6, hw = (r - l) / 2 * (1 - i / 6); s += P.line(`M${f(cx - hw)} ${f(y)}H${f(cx + hw)}`, 'hall2', .45); if (i < 5) s += `<circle cx="${f(cx)}" cy="${f(y + 2)}" r="${f(Math.max(.6, hw * .25))}" fill="${P.ink('glass')}"/>`; }
  s += crockets(P, cx, tip, l, by, 8) + crockets(P, cx, tip, r, by, 8);
  // St Michael and the dragon, in gilt, on the very tip
  const [mx, my] = T(TX, 88.4), m = k * .8;
  s += P.fill(`M${f(mx - 1.6 * m)} ${f(my)}L${f(mx - 1.1 * m)} ${f(my - 4.4 * m)}H${f(mx + 1.1 * m)}L${f(mx + 1.6 * m)} ${f(my)}Z`, 'gilt', { w: .35 }) + `<circle cx="${f(mx)}" cy="${f(my - 5.4 * m)}" r="${f(1 * m)}" fill="${P.ink('gilt')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  s += P.line(`M${f(mx - 2.6 * m)} ${f(my - 6 * m)}L${f(mx + 1.4 * m)} ${f(my - 2 * m)}M${f(mx + .8 * m)} ${f(my - 4 * m)}l${f(2.4 * m)} ${f(-2.6 * m)}l${f(.6 * m)} ${f(1.8 * m)}Z`, 'gilt', .7);
  s += P.flag(T(TX + 4.6, 44)[0], T(TX + 4.6, 44)[1], .62, 'BE', { h: 18 });
  return s;
}

// ---------- the square's fronts in perspective ----------
const poly3 = (P, pts) => P.poly(pts.map(([X, Y, Z]) => p3(X, Y, Z)));
/** The Maison des Ducs de Brabant: a long palace front of pilasters under one balustrade, a pediment at its middle. */
function brabant(P) {
  const f = P.f, X = EAST, z0 = 26, z1 = 92, H = 19;
  const at = (z, y) => p3(X, y, z);
  let s = P.fill(poly3(P, [[X, 0, z0], [X, 0, z1], [X, H, z1], [X, H, z0]]), 'brab') + P.shade(poly3(P, [[X, 0, z0], [X, 0, z1], [X, H, z1], [X, H, z0]]), 'brab', .12);
  for (let z = z0 + 2; z < z1 - 1; z += 4) {
    const zz = z + 2, near = FL / z;
    s += P.line(P.poly([at(z, 0), at(z, H)], false), 'gilt', Math.max(.4, near * .25), { op: .8 });
    // a gilt bust on each pilaster over the ground floor, an urn on the balustrade above
    { const [bx, by] = at(z, 7.4); s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(Math.max(.6, near * .28))}" fill="${P.ink('gilt')}" stroke="${P.keyC()}" stroke-width=".3"/>`; }
    { const [ux, uy] = at(z, H + 1.2); s += P.fill(`M${f(ux - near * .3)} ${f(uy)}q${f(-near * .2)} ${f(-near * .8)} ${f(near * .3)} ${f(-near * 1.2)}q${f(near * .5)} ${f(near * .4)} ${f(near * .3)} ${f(near * 1.2)}Z`, 'brab', { w: .3 }); }
    for (const [y0, y1] of [[3.2, 6.6], [8.4, 11.8], [13.6, 16.4]]) {
      const lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${poly3(P, [[X, y0, zz - .9], [X, y0, zz + .9], [X, y1, zz + .9], [X, y1, zz - .9]])}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width="${f(Math.max(.3, near * .06))}"/>`;
    }
  }
  s += P.fill(poly3(P, [[X, H, z0 - .5], [X, H, z1], [X, H + 1.2, z1], [X, H + 1.2, z0 - .5]]), 'brab', { w: .4 });
  // the central pediment with its gilt
  const zm = (z0 + z1) / 2 - 6;
  s += P.fill(poly3(P, [[X, H + 1.2, zm - 8], [X, H + 6, zm], [X, H + 1.2, zm + 8]]), 'brab', { w: .5 }) + P.fill(poly3(P, [[X, H + 2, zm - 3], [X, H + 4, zm], [X, H + 2, zm + 3]]), 'gilt', { w: .3 });
  s += P.fill(poly3(P, [[X - .1, H + 1.2, z0], [X - .1, H + 1.2, z1], [X - 4, H + 8, z1], [X - 4, H + 8, z0]]), 'slate', { w: .5 });
  for (let z = z0 + 4; z < z1; z += 7) s += P.fill(poly3(P, [[X - .5, H + 2, z - .8], [X - .5, H + 2, z + .8], [X - .5, H + 4, z]]), 'slate', { w: .3 });
  return s;
}
/** The guild houses of the west side, nearest last: each a stone front with its pilasters and gilded baroque gable. */
function guilds(P) {
  const list = [
    // [near edge z, width, height to the gable, gable height, kind, ink, name]
    [91, 8, 15, 7, 'scroll', 'guild3'], [83, 8, 15, 8, 'stern', 'guild'], [74, 9, 16, 8, 'louve', 'guild2'], [66, 8, 16, 7, 'scroll', 'guild'],
    [57, 9, 17, 7, 'scroll', 'guild3'], [39, 18, 18, 6, 'roi', 'guild'], [24, 9, 16, 7, 'stern', 'guild2', true],
  ];
  return list.map(([z, w, h, g, kind, c, shop]) => guild(P, z, w, h, g, kind, c, shop)).join('');
}
function guild(P, z0, w, h, g, kind, c, shop = false) {
  const f = P.f, X = WEST, z1 = z0 + w;
  const at = (u, v) => p3(X, v, z1 - u); // u from the front's left (south) edge
  const near = FL / z0;
  const curve = (a, b, d, n = 4) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, q = 1 - t; return [q * q * a[0] + 2 * q * t * b[0] + t * t * d[0], q * q * a[1] + 2 * q * t * b[1] + t * t * d[1]]; });
  let L;
  if (kind === 'stern') L = [[0, h], ...curve([0, h], [-.2, h + g * .7], [w * .3, h + g * .95]), [w * .5, h + g * 1.05]];
  else if (kind === 'louve') L = [[0, h], [w * .12, h], ...curve([w * .12, h], [w * .2, h + g * .3], [w * .24, h + g * .5]), [w * .3, h + g * .55], ...curve([w * .3, h + g * .55], [w * .36, h + g * .8], [w * .42, h + g * .9]), [w * .5, h + g]];
  else if (kind === 'roi') L = [[0, h], [0, h + 1.4], [w * .5, h + 1.4]];
  else L = [[0, h], [w * .1, h], ...curve([w * .1, h], [w * .22, h + g * .1], [w * .22, h + g * .45]), [w * .3, h + g * .5], ...curve([w * .3, h + g * .5], [w * .34, h + g * .75], [w * .4, h + g * .82]), [w * .42, h + g], [w * .5, h + g * 1.04]];
  const right = L.slice(0, -1).reverse().map(([u, v]) => [w - u, v]);
  const out = [[0, 0], ...L, ...right, [w, 0]];
  let s = P.fill(P.poly(out.map(([u, v]) => at(u, v))), c, { w: .6 });
  s += P.stipple(P.poly(out.map(([u, v]) => at(u, v))), c, 30, { box: [at(w, h + g)[0], at(w, h + g)[1], near * w + 4, near * (h + g)], op: .3 });
  // each floor: a gilt balustrade along its foot, pilasters with gilt capitals, tall windows of small panes in
  // light frames, a little pediment over each; the ground floor's arches below
  const floors = 3, fh = (h - 4) / floors, cols = w > 9 ? 4 : 3, lw = (k) => Math.max(.3, near * k);
  const quad = (u0, v0, u1, v1) => P.poly([at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]);
  for (let r = 0; r < floors; r++) {
    const v0 = 4 + r * fh;
    s += P.fill(quad(0, v0 - .25, w, v0 + .35), P.light(c, .25), { w: .3 });
    let bal = '';
    for (let u = .3; u < w; u += .5) { const [a, b] = at(u, v0 + .35), [, d2] = at(u, v0 + 1.1); bal += `M${f(a)} ${f(b)}V${f(d2)}`; }
    s += `<path d="${bal}" stroke="${P.ink('gilt')}" stroke-width="${f(lw(.07))}"/>` + P.line(P.poly([at(0, v0 + 1.1), at(w, v0 + 1.1)], false), 'gilt', lw(.1));
    for (let q = 0; q < cols; q++) {
      const u0 = w * (q + .24) / cols, u1 = w * (q + .76) / cols, wy0 = v0 + fh * .2, wy1 = v0 + fh * .8, lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(u0 - .12, wy0 - .12, u1 + .12, wy1 + .12)}" fill="${P.ink(P.light(c, .45))}"/>`;
      s += `<path d="${quad(u0, wy0, u1, wy1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width="${f(lw(.05))}"/>`;
      if (!lit && near > 3.5) s += P.line(P.poly([at((u0 + u1) / 2, wy0), at((u0 + u1) / 2, wy1)], false), 'sash', lw(.04)) + P.line(P.poly([at(u0, wy0 + (wy1 - wy0) * .35), at(u1, wy0 + (wy1 - wy0) * .35)], false), 'sash', lw(.04));
      s += P.fill(P.poly([at(u0 - .2, wy1 + .2), at((u0 + u1) / 2, wy1 + .75), at(u1 + .2, wy1 + .2)]), 'gilt', { w: .25 });
    }
    for (let q = 0; q <= cols; q++) {
      const u = w * q / cols;
      s += P.fill(quad(u - .18, v0 + .35, u + .18, v0 + fh - .3), P.light(c, .18), { w: .25 }) + P.fill(quad(u - .3, v0 + fh - .55, u + .3, v0 + fh - .2), 'gilt', { w: .2 });
    }
  }
  for (let q = 0; q < cols; q++) s += P.fill(P.poly([at(w * (q + .15) / cols, 0), at(w * (q + .85) / cols, 0), at(w * (q + .85) / cols, 3.2), at(w * (q + .5) / cols, 3.8), at(w * (q + .15) / cols, 3.2)]), P.L.windows > .2 ? '#6a5236' : '#3a3430', { w: .3 });
  // a café's awning across the ground floor, its sign
  if (shop) {
    const st = 5;
    for (let q = 0; q < st; q++) s += P.flat(P.poly([at(w * q / st, 3.6), at(w * (q + 1) / st, 3.6), p3(X - 1.2, 2.8, z1 - w * (q + 1) / st), p3(X - 1.2, 2.8, z1 - w * q / st)]), q % 2 ? '#f2ead6' : '#8a2a2e');
  }
  // the gable's gilt: its edge, an oculus, the figure on its top
  s += P.line(P.poly(out.slice(1, -1).filter(([, v]) => v >= h).map(([u, v]) => at(u, v)), false), 'gilt', Math.max(.5, near * .14));
  if (kind !== 'roi') {
    const [ox, oy] = at(w / 2, h + g * .45);
    s += `<circle cx="${f(ox)}" cy="${f(oy)}" r="${f(near * .7)}" fill="${P.ink('glass')}" stroke="${P.ink('gilt')}" stroke-width="${f(Math.max(.4, near * .12))}"/>`;
    const [tx, ty] = at(w / 2, h + g * (kind === 'stern' ? 1.05 : 1.04));
    s += P.fill(`M${f(tx - near * .6)} ${f(ty)}L${f(tx - near * .3)} ${f(ty - near * 1.8)}H${f(tx + near * .3)}L${f(tx + near * .6)} ${f(ty)}Z`, 'gilt', { w: .3 }) + `<circle cx="${f(tx)}" cy="${f(ty - near * 2.2)}" r="${f(near * .4)}" fill="${P.ink('gilt')}"/>`;
    if (kind === 'louve') s += P.line(`M${f(tx - near * 1.2)} ${f(ty - near * 1.4)}l${f(near * 1.2)} ${f(near * .5)}l${f(near * 1.2)} ${f(-near * .5)}`, 'gilt', Math.max(.6, near * .3));
  } else {
    // the Roi d'Espagne: a balustrade, the octagonal drum and dome, Fame in gold blowing her trumpet
    let bal = '';
    for (let u = .5; u < w; u += .9) { const [a, b] = at(u, h), [, d] = at(u, h + 1.3); bal += `M${f(a)} ${f(b)}V${f(d)}`; }
    s += P.line(bal, c, Math.max(.5, near * .2));
    const dm = (u, v) => p3(X - 4, v, z1 - u);
    const [d0x, d0y] = dm(w / 2 - 2.6, h + 1.4), [d1x] = dm(w / 2 + 2.6, h + 1.4), [, dty] = dm(w / 2, h + 6);
    s += P.fill(P.rect(Math.min(d0x, d1x), dty, Math.abs(d1x - d0x), d0y - dty), c, { w: .5 }) + P.windows(Math.min(d0x, d1x) + 1, dty + 1, Math.abs(d1x - d0x) - 2, d0y - dty - 2, 3, 1, { arched: true, ww: .5 });
    const [cx, cy] = dm(w / 2, h + 6), rw = Math.abs(d1x - d0x) * .56;
    s += P.fill(P.dome(cx, cy, rw, rw * .9), 'slate', { w: .5 }) + P.line(`M${f(cx)} ${f(cy - rw * 1.2)}v${f(-near * 1.4)}`, 'gilt', 1);
    const fy = cy - rw * 1.2 - near * 1.4;
    s += P.fill(`M${f(cx - near * .7)} ${f(fy)}L${f(cx - near * .3)} ${f(fy - near * 2.4)}H${f(cx + near * .3)}L${f(cx + near * .7)} ${f(fy)}Z`, 'gilt', { w: .35 }) + `<circle cx="${f(cx)}" cy="${f(fy - near * 2.8)}" r="${f(near * .45)}" fill="${P.ink('gilt')}"/>` + P.line(`M${f(cx + near * .2)} ${f(fy - near * 2.6)}l${f(near * 1.8)} ${f(-near * .9)}`, 'gilt', Math.max(.6, near * .22)) + P.line(`M${f(cx - near * .3)} ${f(fy - near * 2)}l${f(-near * 1.4)} ${f(-near * 1)}`, 'gilt', Math.max(.5, near * .3));
  }
  if (P.L.snow) s += P.line(P.poly(out.slice(1, -1).filter(([, v]) => v >= h).map(([u, v]) => at(u, v)), false), '#f4f7fa', Math.max(1, near * .25));
  return s;
}

// ---------- the market ----------
/** What the flower-women sell in this season: tulips and daffodils, roses and pinks, chrysanthemums, evergreens. */
const BLOOMS = {
  spring: ['#f2d24a', '#e8403a', '#f4f0e6', '#f0b8c8', '#f6e27a', '#c8302e'],
  summer: ['#d8303a', '#f08aa0', '#f4f0e6', '#c86ab0', '#e88a3a', '#8a5ad0'],
  autumn: ['#c8702a', '#e0a83a', '#a84a2a', '#f2e2b0', '#d88a3a', '#8a3a2a'],
  winter: ['#3c5a40', '#4a6a44', '#c8302e', '#3c5a40', '#f2efe6', '#2f4a36'],
};
const bloom = (P) => BLOOMS[P.st?.season ?? 'summer'] ?? BLOOMS.summer;
/** An umbrella stall at (X, Z): the white canvas, the pole, a trestle with buckets of flowers. */
function umbrella(P, x, by, s, c = '#f4efe2') {
  const f = P.f, R = P.rng(Math.round(x * 7 + by));
  let d = P.fill(P.rect(x - 9 * s, by - 7 * s, 18 * s, 2 * s), '#7a5a3a', { w: .4 }) + P.line(`M${f(x - 8 * s)} ${by}v${f(-5 * s)}M${f(x + 8 * s)} ${by}v${f(-5 * s)}`, '#5a4232', .8 * s);
  for (let i = 0; i < 7; i++) { const bx = x - 7.4 * s + i * 2.5 * s; d += P.fill(P.rect(bx - 1 * s, by - 10 * s, 2 * s, 3 * s), '#8a8a8a', { w: .2 }); for (let k = 0; k < 3; k++) d += `<circle cx="${f(bx + (R() - .5) * 2.4 * s)}" cy="${f(by - 10.6 * s - R() * 2 * s)}" r="${f(1.1 * s)}" fill="${P.ink(bloom(P)[Math.floor(R() * 6)])}"/>`; }
  d += P.line(`M${x} ${by}V${f(by - 24 * s)}`, '#4a3a2a', .9 * s);
  if (P.st?.season === 'winter') return d + P.fill(`M${f(x - 2 * s)} ${f(by - 12 * s)}Q${x} ${f(by - 26 * s)} ${f(x + 2 * s)} ${f(by - 12 * s)}Z`, c, { w: .4 });
  d += P.fill(`M${f(x - 15 * s)} ${f(by - 19 * s)}Q${x} ${f(by - 31 * s)} ${f(x + 15 * s)} ${f(by - 19 * s)}q${f(-3.7 * s)} ${f(2 * s)} ${f(-7.5 * s)} 0q${f(-3.8 * s)} ${f(2 * s)} ${f(-7.5 * s)} 0q${f(-3.8 * s)} ${f(2 * s)} ${f(-7.5 * s)} 0q${f(-3.7 * s)} ${f(2 * s)} ${f(-7.5 * s)} 0Z`, c, { w: .5 });
  d += P.shade(`M${x} ${f(by - 25 * s)}Q${f(x + 10 * s)} ${f(by - 24 * s)} ${f(x + 15 * s)} ${f(by - 19 * s)}q${f(-3.7 * s)} ${f(2 * s)} ${f(-7.5 * s)} 0Z`, c, .12);
  if (P.L.snow) d += P.flat(`M${f(x - 13 * s)} ${f(by - 21 * s)}Q${x} ${f(by - 31 * s)} ${f(x + 13 * s)} ${f(by - 21 * s)}Z`, '#f4f7fa', { op: .9 });
  return d;
}
function market(P, spots) {
  let s = '';
  const winter = P.st?.season === 'winter';
  for (const [i, [X, Z]] of spots.slice().sort((a, b) => b[1] - a[1]).entries()) { if (winter && i % 2) continue; const [x, y] = p3(X, 0, Z); s += umbrella(P, x, y, FL * 3.4 / Z / 30, (X + Z) % 3 ? '#f4efe2' : '#efe2c4'); }
  return s;
}
function stall(P, x, by, s, c) {
  return umbrella(P, x, by, s, c) + P.person(x - 20 * s, by, s * .92, 'peasant', { c: '#3a4a6a', hat: '#f4f2ea' }) + P.person(x + 18 * s, by + 1, s * .9, 'lady', { c: '#e8dcc8', dir: -1 });
}
function flowers(P, x, by, s) {
  const f = P.f, R = P.rng(88);
  let d = P.fill(P.rect(x - 7 * s, by - 6 * s, 6 * s, 6 * s), '#8a8a8a', { w: .35 }) + P.fill(P.rect(x - 14 * s, by - 5 * s, 6 * s, 5 * s), '#8a8a8a', { w: .35 });
  for (let i = 0; i < 12; i++) d += `<circle cx="${f(x - 14 * s + R() * 13 * s)}" cy="${f(by - 6 * s - R() * 3.4 * s)}" r="${f(1.3 * s)}" fill="${P.ink(bloom(P)[i % 6])}"/>`;
  return d;
}
/** A lace-maker on her stool, the pillow with its bobbins on her knees, collars of lace on a board beside her. */
function lacemaker(P, x, by, s) {
  const f = P.f, S = (k) => f(k * s);
  let d = P.fill(P.rect(x + 8 * s, by - 26 * s, 26 * s, 18 * s), '#2a3a4a', { w: .5 }) + P.line(`M${f(x + 10 * s)} ${by}L${f(x + 12 * s)} ${f(by - 8 * s)}M${f(x + 32 * s)} ${by}L${f(x + 30 * s)} ${f(by - 8 * s)}`, '#4a3a2a', .9 * s);
  for (const [u, v, w, h] of [[10, 24, 10, 7], [22, 24, 10, 7], [12, 15, 18, 5]]) { d += P.fill(P.rect(x + u * s, by - v * s, w * s, h * s), '#f6f2e6', { w: .3 }); for (let i = 0; i < 4; i++) d += `<circle cx="${f(x + (u + 1.6 + i * (w - 2) / 3.4) * s)}" cy="${f(by - (v - h + 1.4) * s)}" r="${f(.8 * s)}" fill="none" stroke="${P.ink('#c8bca0')}" stroke-width=".4"/>`; }
  d += P.line(`M${f(x - 5 * s)} ${by}l${S(2)} ${S(-8)}M${f(x + 4 * s)} ${by}l${S(-2)} ${S(-8)}`, '#4a3a2a', .9 * s) + P.fill(P.rect(x - 5 * s, by - 9 * s, 9 * s, 1.4 * s), '#6a4a2e', { w: .3 });
  d += P.fill(`M${f(x - 5 * s)} ${f(by - 9 * s)}L${f(x - 4 * s)} ${f(by - 21 * s)}Q${x} ${f(by - 23 * s)} ${f(x + 4 * s)} ${f(by - 21 * s)}L${f(x + 7 * s)} ${f(by - 9 * s)}Z`, '#2a2a30', { w: .5 });
  d += P.fill(`M${f(x - 4 * s)} ${f(by - 12 * s)}h${S(10)}l${S(1)} ${S(-3)}h${S(-11)}Z`, '#e8dcc0', { w: .35 }) + P.fill(P.ellipse(x + 2 * s, by - 15 * s, 6 * s, 2.6 * s), '#5a7a4a', { w: .4 });
  for (let i = 0; i < 6; i++) d += P.line(`M${f(x - 2 * s + i * 1.6 * s)} ${f(by - 15 * s)}l${f(.2 * s)} ${S(3)}`, '#c8a46a', .5);
  d += `<circle cx="${x}" cy="${f(by - 25.6 * s)}" r="${S(2.6)}" fill="${P.ink('#e2bf9c')}" stroke="${P.keyC()}" stroke-width=".45"/><path d="M${f(x - 3 * s)} ${f(by - 25 * s)}q${S(3)} ${S(-6)} ${S(6)} 0Z" fill="${P.ink('#f4f2ea')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  return d;
}

// ---------- what moves ----------
/** The milk cart: brass cans on a little cart, two dogs in harness, the milk-woman walking beside in her clogs. */
function dogcart(P, dir, s) {
  const W = 66 * s, H = 34 * s, S = (k) => P.f(k * s), f = P.f;
  const dog = (x, y, c, st, back) => {
    const a = st ? 2 : -1.6;
    let g = P.line(`M${S(x - 6)} ${S(y + 2)}l${S(-a)} ${S(7)}M${S(x + 5)} ${S(y + 2)}l${S(a)} ${S(7)}`, back ? P.dark(c, .2) : c, 1.4 * s);
    g += P.fill(`M${S(x - 8)} ${S(y + 3)}Q${S(x - 8)} ${S(y - 2)} ${S(x - 3)} ${S(y - 2)}H${S(x + 5)}L${S(x + 8)} ${S(y - 6)}L${S(x + 11)} ${S(y - 4)}L${S(x + 9)} ${S(y)}Q${S(x + 7)} ${S(y + 4)} ${S(x + 3)} ${S(y + 4)}H${S(x - 6)}Z`, c, { w: .45 });
    g += P.line(`M${S(x - 8)} ${S(y)}q${S(-3)} ${S(-2)} ${S(-3)} ${S(-5)}`, c, 1 * s) + P.line(`M${S(x - 3)} ${S(y - 2)}V${S(y + 4)}`, '#5a3a22', .8 * s);
    return g;
  };
  const frame = (st) => {
    let b = '';
    // the cart: its box, three cans of brass, the big wheel
    b += P.fill(`M${S(4)} ${S(24)}V${S(15)}H${S(26)}V${S(24)}Z`, '#3d6a4a', { w: .5 });
    for (const [cx, k] of [[9, 0], [16, 1], [22, 0]]) b += P.fill(`M${S(cx - 3)} ${S(15)}V${S(7)}Q${S(cx)} ${S(5)} ${S(cx + 3)} ${S(7)}V${S(15)}Z`, '#d8a83a', { w: .4 }) + P.lite(`M${S(cx - 2)} ${S(14)}V${S(8)}h${S(1.2)}V${S(14)}Z`, '#d8a83a', .5) + P.fill(P.rect(cx * s - 1.6 * s, 3.6 * s, 3.2 * s, 2 * s), '#d8a83a', { w: .3 });
    b += `<circle cx="${S(15)}" cy="${S(26)}" r="${S(6)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1.1)}"/>` + P.line(`M${S(9)} ${S(26)}h${S(12)}M${S(15)} ${S(20)}v${S(12)}`, '#5a4632', .45 * s);
    b += P.line(`M${S(26)} ${S(20)}L${S(40)} ${S(24)}`, '#3a2a1e', .8 * s);
    b += dog(52, 26, '#8a6a46', (st + 1) % 2, true) + dog(46, 27.5, '#a07a50', st, false);
    // the milk-woman alongside, white cap, blue apron, a can in her hand
    b += P.person(32 * s, 33 * s, s * 1.02, 'peasant', { c: '#3a4a6a', hat: '#f4f2ea', stride: st, dir: 1 });
    return flip(dir, f(W), b);
  };
  return { frames: [frame(0), frame(1)].map((b) => doc(f(W), f(H), b)), fps: 3, w: W, h: H, ax: W / 2, ay: 33 * s };
}
