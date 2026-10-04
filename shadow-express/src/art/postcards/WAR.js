// Warsaw: Castle Square from the head of Krakowskie Przedmieście. Sigismund's Column stands over its fountain, the
// king with his cross and sabre; the Royal Castle runs away on the right under its clock tower and baroque helm; the
// tall Old Town houses close the square. An electric tram crosses toward the Nowy Zjazd and the bridge, droshkies wait
// and trot, pigeons strut round the column's foot.

const HZ = 302; // the square's far side

export default {
  id: 'WAR',
  greet: 'POZDROWIENIA z WARSZAWY',
  nation: 'RU',
  flag: 'RU',
  flower: 'chestnut-blossom',
  flower2: 'cornflower',
  frame: { band: ['#846ca7', '#483f60'], gold: '#dab65e', ink: '#5a1a2a', leaf: ['#78a05e', '#355a3a'], year: '#5a1a2a', halo: '#f7ebd2' },
  horizon: HZ,
  clouds: 4,
  wind: -1,
  birds: { c: '#9ea3ad', n: 5, y: 150, s: .9 },
  pal: {
    key: '#2a2528', castle: '#d6a48a', castle2: '#bb8670', wall: '#ebd9b6', wall2: '#d8b577', wall3: '#c7cebf', wall4: '#e3c3ae',
    roof: '#a24b35', helm: '#486456', shaft: '#8e7672', stone: '#dfd5c1', bronze: '#6b5838', ground: '#cdc0a3',
    glass: '#39465a', sash: '#efe8d8', iron: '#2b3534', gold: '#d6a63e', tram: '#b5322d', cream: '#efe0b8',
  },

  // horse-chestnut blossom: a candle of white florets flecked pink and yellow, leaning out over a hand of leaves
  flowerArt(F) {
    const I = F.I;
    let s = '';
    for (const [a, l] of [[140, 22], [175, 26], [210, 25], [244, 21], [108, 18]]) s += F.leaf(l, 9, a, a === 175 || a === 244 ? I.leaf[1] : I.leaf[0], { shape: 'serrate' });
    let c = F.stem('M0 0V-17', I.leaf[1], 1.1);
    for (let row = 0; row < 7; row++) {
      const t = row / 6, y = -3 - t * 15, w = 7.6 * (1 - t * .78), n = row < 4 ? 3 : row < 6 ? 2 : 1;
      for (let k = 0; k < n; k++) { const x = n === 1 ? 0 : -w + (2 * w) * k / (n - 1); c += F.at(x, y + (k % 2) * 1.2, F.radial(5, 3.4, 2.8, (row + k) % 4 ? '#fbf8ef' : '#f4e8d2', { shape: 'round', k: .35 }) + `<circle r=".85" fill="${(row + k) % 3 ? '#e8b83a' : '#d8566a'}"/>`, row * 37 + k * 50); }
    }
    s += F.at(2, -3, c, 62);
    return s;
  },
  // a cornflower at the foot
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(18, 3.6, 205, I.leaf[1], { shape: 'lance' }) + F.leaf(16, 3.4, 150, I.leaf[0], { shape: 'lance' });
    s += F.radial(8, 10, 5.4, ['#3d6cd2', '#3462c4'], { shape: 'frill', lite: '#86a6ee' }) + F.radial(7, 5, 3, '#2c3f9e', { rot: 22, shape: 'frill' }) + F.disc(2.2, '#3a2768', { dots: '#9c8ad4', n: 5 });
    return s;
  },

  back(P) {
    let s = '';
    // the Old Town beyond the square: tall narrow houses, steep roofs, smoking chimneys
    s += P.far(.5, () => oldTown(P));
    s += P.smoke(150, 168, .6) + P.smoke(252, 176, .55);
    // chestnuts on the slope beyond the castle's far corner
    s += P.far(.45, () => P.tree(300, HZ + 2, .74, 'round') + P.tree(330, HZ, .66, 'round'));
    return s;
  },

  mid(P, T) {
    let s = '';
    // the square, its setts running away to the Old Town
    s += P.paving(HZ - 2, 380, { vx: 250, seed: 14 });
    // the Royal Castle on the right, its west front running away from us
    s += P.far(.22, () => castle(P));
    // pigeons and people round the column's foot, the column over its fountain
    s += P.far(.2, () => P.crowd(84, 170, 314, 6, { s: .54, seed: 31, ...clothes(P) }) + P.crowd(262, 320, 312, 4, { s: .52, seed: 33, ...clothes(P) }));
    s += P.far(.1, () => column(P, 214, 336));
    s += pigeons(P, 160, 268, 344, 26, 4);
    // lamps along the square
    s += P.far(.18, () => P.lamp(118, 322, .62, 'iron', { h: 72 }) + P.lamp(318, 318, .6, 'iron', { h: 72 }));
    // a horse-chestnut before the house on the left, whose front runs away to the Old Town
    s += P.far(.08, () => P.tree(98, 338, 2.1, 'round'));
    s += leftHouse(P);
    // the tram crossing for the Nowy Zjazd, droshkies, walkers; at war, the columns
    s += P.setStreet(352, 120, 574, .9);
    s += P.cross(T.tramSide({ s: .9, c: '#b5322d', band: '#efe0b8', number: '2', dir: 1 }), { y: 346, dir: 1, dur: 34, rest: .45, x0: 90, offset: 3 });
    s += P.cross(T.fiacre({ s: .7, dir: -1, horses: 1, body: '#23262a', hood: '#2b2826', wheelC: '#2b2826' }), { y: 356, dir: -1, dur: 50, rest: .25, x0: 100, offset: 26 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady', 'girl'], s: .72, dir: 1, seed: 7, dresses: ['#f3eee2', '#e9c6c0'], ...clothes(P) }), { y: 331, dir: 1, dur: 96, x0: 110, offset: 40 });
    s += P.cross(T.walkers({ kinds: ['peasant', 'worker'], s: .7, dir: -1, seed: 15, dresses: ['#b84a3a'], coats: ['#5a4a3a'], ...clothes(P) }), { y: 327, dir: -1, dur: 110, x0: 110, offset: 70 });
    s += P.mover(T.cart({ s: .9, dir: 1, load: P.L.season === 'autumn' ? '#d08a3a' : P.L.season === 'winter' ? '#9a8a6a' : '#b8c87a', horse: '#6a4a2e' }), { path: [[96, 362, .9, 0, 0], [112, 358, .88, .05, 1], [170, 326, .5, .62, 1], [178, 321, .46, .7, 0], [178, 321, .46, 1, 0]], dur: 40, offset: 18 });
    return s;
  },

  front(P, T) {
    let s = '';
    // a droshky waiting on the left, its driver on the box; a gorodovoy; a Jewish merchant and a porter; a lady
    s += T.place(T.fiacre({ s: 1.24, dir: 1, horses: 1, body: '#202428', hood: '#272422', wheelC: '#3a2e26', horse: '#5a3a26' }), 150, 378);
    s += P.person(222, 372, 1.1, 'gent', { c: '#1f1f22', legs: '#1f1f22', hat: '#1f1f22' }) + beard(P, 222, 372, 1.1);
    s += P.person(240, 374, 1.12, 'worker', { c: '#6a5a46', hat: '#3a3a3e', dir: -1 }) + P.fill('M232 349h-8v9h8Z', '#8a6a42', { w: .5 });
    s += gorodovoy(P, 470, 372, 1.08);
    s += P.person(408, 370, 1.06, 'lady', { c: frock(P, '#ece4f2'), parasol: umbrella(P, '#f4ecdc'), dir: -1 }) + P.person(422, 371, 1.04, 'gent', { c: '#3b3f48', dir: -1, hat: '#d9c27a' });
    s += P.cross(T.walkers({ kinds: ['lady', 'child'], s: 1.04, dir: 1, seed: 19, dresses: ['#f3eee2', '#d8c9e4'], ...clothes(P) }), { y: 374, dir: 1, dur: 80, offset: 12, z: 'fore', x0: 200 });
    return s;
  },
};

// ---------- the Royal Castle ----------
function sideFront(o) {
  const k = o.k ?? 1.3, g = (u) => u * (1 + k) / (1 + k * u);
  return (u, v) => { const t = g(u), top = o.t0 + (o.t1 - o.t0) * t, bot = o.b0 + (o.b1 - o.b0) * t; return [o.x0 + (o.x1 - o.x0) * t, top + (bot - top) * v]; };
}
function castle(P) {
  const { f } = P;
  // the west front from its south corner (near, off the right edge) to the Grodzka tower (far, at x 312)
  const q = sideFront({ x0: 600, x1: 318, t0: 166, t1: 240, b0: 346, b1: HZ, k: .9 });
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = '';
  // the roof over it all
  s += P.fill(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 14], [q(0, 0)[0], q(0, 0)[1] - 34]]), 'roof') + P.shade(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 4], [q(0, 0)[0], q(0, 0)[1] - 9]]), 'roof', .25);
  for (const u of [.12, .3, .62, .8]) { const [x, y] = q(u, 0); s += P.fill(`M${f(x - 3)} ${f(y - 2)}v-6l3 -3l3 3v6Z`, 'castle', { w: .4 }); }
  if (P.L.snow) s += P.flat(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 14], [q(0, 0)[0], q(0, 0)[1] - 34]]), '#f4f7fa', { op: .85 });
  s += P.fill(quad(0, 0, 1, 1), 'castle') + P.stipple(quad(0, 0, 1, 1), 'castle', 60, { box: [318, 160, 282, 190], op: .2 });
  s += P.fill(quad(0, .82, 1, 1), 'castle2', { w: .5 });
  // three floors of windows, their sashes white
  for (const [v0, v1] of [[.1, .3], [.4, .6], [.68, .8]]) for (let c = 0; c < 14; c++) {
    const u0 = .03 + c * .07, u1 = u0 + .034;
    if (u0 > .4 && u0 < .5) continue;
    const lit = P.wr() < P.L.windows, tone = P.wr();
    s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".7"/>`;
    s += P.fill(P.poly([q(u0 - .006, v0 - .02), q(u1 + .006, v0 - .02), q(u1 + .006, v0 - .05), q(u0 - .006, v0 - .05)]), 'castle2', { w: .35 });
  }
  s += P.fill(P.poly([q(0, -.01), q(1, -.01), q(1, .02), q(0, .02)]), 'castle2', { w: .45 });
  // the Grodzka tower at the far corner, the clock tower over the gate
  s += P.far(.32, () => grodzka(P, 318, HZ));
  const [tx, ty] = q(.45, 0);
  s += clockTower(P, tx, ty + 2, q(.45, 1)[1]);
  s += P.flagAt(f(q(.2, .1)[0]), f(q(.2, .1)[1])) + P.wall(f(q(.66, .7)[0]), f(q(.66, .7)[1]), 8, 11);
  return s;
}
function clockTower(P, cx, by, foot) {
  const { f } = P;
  let s = '';
  const w = 30, side = 9, t1 = by - 74;
  // the shaft from the ground: a lit face toward us, its west side running back, quoins at the corners
  s += P.fill(P.poly([[cx - w / 2, foot], [cx - w / 2, t1], [cx + w / 2, t1], [cx + w / 2, foot]]), 'castle') + P.shade(P.poly([[cx - w / 2 - side, foot - 3], [cx - w / 2 - side, t1 + 3], [cx - w / 2, t1], [cx - w / 2, foot]]), 'castle', .2);
  s += P.line(`M${cx - w / 2 - side} ${t1 + 3}V${foot - 3}`, null, .7);
  for (let y = t1 + 4; y < foot - 4; y += 7) for (const x of [cx - w / 2, cx + w / 2 - 4]) s += P.flat(P.rect(x, y, 4, 3.6), 'castle2', { op: .8 });
  // the gate through it, a balcony over, windows up the shaft and string courses between the stages
  s += P.fill(P.arch(cx - 8, foot - 28, 16, 28), '#3e3530', { w: .6 }) + P.fill(P.rect(cx - 11, foot - 32, 22, 3), 'castle2', { w: .45 });
  s += P.windows(cx - 8, foot - 62, 16, 26, 1, 2, { ww: .55, wh: .66, arched: true });
  s += P.windows(cx - 8, by - 34, 16, 26, 1, 2, { ww: .5, wh: .62, arched: true });
  for (const y of [foot - 34, by - 6]) s += P.fill(P.rect(cx - w / 2 - 1.5, y, w + 3, 2.6), 'castle2', { w: .4 });
  s += P.fill(P.rect(cx - w / 2 - 2, by - 40, w + 4, 3), 'castle2', { w: .45 });
  // the clock, below the galleried stage
  s += P.fill(P.rect(cx - 12, t1 + 4, 24, 24), 'castle2', { w: .5 }) + P.clock(cx, t1 + 16, 9.4, { tz: 24, face: '#f2ecd8', rim: '#d6a63e' });
  s += P.fill(P.rect(cx - w / 2 - 3, t1 - 3, w + 6, 4), 'castle2', { w: .5 });
  for (let x = cx - w / 2 - 2; x <= cx + w / 2 + 2; x += 3) s += P.line(`M${x} ${t1 - 3}v-4`, 'castle2', .6);
  s += P.line(`M${cx - w / 2 - 3} ${t1 - 7}H${cx + w / 2 + 3}`, 'castle2', .9);
  // the baroque helm: a bell, a lantern, a smaller bell, the spire and its cross
  const hb = t1 - 7;
  s += P.fill(`M${cx - 14} ${hb}Q${cx - 16} ${hb - 10} ${cx - 6} ${hb - 16}Q${cx - 3} ${hb - 18} ${cx - 3} ${hb - 21}H${cx + 3}Q${cx + 3} ${hb - 18} ${cx + 6} ${hb - 16}Q${cx + 16} ${hb - 10} ${cx + 14} ${hb}Z`, 'helm') + P.shade(`M${cx + 2} ${hb - 21}H${cx + 3}Q${cx + 3} ${hb - 18} ${cx + 6} ${hb - 16}Q${cx + 16} ${hb - 10} ${cx + 14} ${hb}H${cx + 6}Z`, 'helm', .25);
  s += P.fill(P.rect(cx - 4, hb - 29, 8, 8), 'helm', { w: .5 }) + P.fill(P.arch(cx - 1.6, hb - 28, 3.2, 6), '#22262a', { w: .3 });
  s += P.fill(`M${cx - 5} ${hb - 29}Q${cx - 6} ${hb - 34} ${cx} ${hb - 37}Q${cx + 6} ${hb - 34} ${cx + 5} ${hb - 29}Z`, 'helm', { w: .45 });
  s += P.fill(`M${cx - 1.6} ${hb - 37}L${cx} ${hb - 56}L${cx + 1.6} ${hb - 37}Z`, 'helm', { w: .4 }) + `<circle cx="${cx}" cy="${hb - 49}" r="1.4" fill="${P.ink('gold')}"/>` + P.line(`M${cx} ${hb - 56}v-6M${cx - 2} ${hb - 60}h4`, 'gold', .8);
  if (P.L.snow) s += P.flat(`M${cx - 14} ${hb}Q${cx - 16} ${hb - 10} ${cx - 6} ${hb - 16}Q${cx} ${hb - 12} ${cx + 6} ${hb - 16}Q${cx + 16} ${hb - 10} ${cx + 14} ${hb}Q${cx} ${hb - 6} ${cx - 14} ${hb}Z`, '#f4f7fa', { op: .8 });
  return s;
}
function grodzka(P, cx, by) {
  let s = P.fill(P.rect(cx - 9, by - 78, 18, 78), 'castle') + P.shade(P.rect(cx + 3, by - 78, 6, 78), 'castle', .2);
  s += P.windows(cx - 6, by - 72, 12, 56, 2, 4, { ww: .5, wh: .55 });
  s += P.fill(P.rect(cx - 10.5, by - 81, 21, 3), 'castle2', { w: .4 });
  s += P.fill(`M${cx - 10} ${by - 81}Q${cx - 10} ${by - 92} ${cx} ${by - 96}Q${cx + 10} ${by - 92} ${cx + 10} ${by - 81}Z`, 'helm', { w: .5 }) + P.fill(P.spire(cx, by - 95, 3, 12), 'helm', { w: .4 });
  return s;
}

// ---------- Sigismund's Column ----------
function column(P, cx, by) {
  const { f } = P;
  let s = '';
  // the fountain's basin and its railing
  s += P.fill(`M${cx - 40} ${by - 6}Q${cx} ${by + 4} ${cx + 40} ${by - 6}L${cx + 36} ${by - 12}Q${cx} ${by - 4} ${cx - 36} ${by - 12}Z`, 'stone', { w: .6 });
  s += P.flat(`M${cx - 35} ${by - 11}Q${cx} ${by - 4} ${cx + 35} ${by - 11}Q${cx} ${by - 9} ${cx - 35} ${by - 11}Z`, 'glass', { op: .7 });
  s += `<path d="M${cx - 38} ${by - 12}Q${cx} ${by - 2} ${cx + 38} ${by - 12}" fill="none" stroke="${P.ink('iron')}" stroke-width=".8" stroke-dasharray="1 2"/>`;
  // the stepped base, the tall pedestal with its tablets
  s += P.fill(P.rect(cx - 18, by - 16, 36, 7), 'stone', { w: .6 }) + P.fill(P.rect(cx - 14, by - 22, 28, 6), 'stone', { w: .55 });
  s += P.fill(P.rect(cx - 10, by - 58, 20, 36), 'stone') + P.shade(P.rect(cx + 4, by - 58, 6, 36), 'stone', .2) + P.stipple(P.rect(cx - 10, by - 58, 20, 36), 'stone', 20, { box: [cx - 10, by - 58, 20, 36], op: .3 });
  s += P.fill(P.rect(cx - 6.4, by - 52, 12.8, 22), 'bronze', { w: .4 }) + P.line(`M${cx - 4.4} ${by - 47}h8.8M${cx - 4.4} ${by - 43}h8.8M${cx - 4.4} ${by - 39}h6`, 'gold', .5, { op: .7 });
  s += P.fill(P.rect(cx - 12, by - 62, 24, 4), 'stone', { w: .5 }) + P.fill(P.rect(cx - 9, by - 66, 18, 4), 'stone', { w: .45 });
  // tritons at the corners spouting into the basin
  if (!P.L.snow) for (const k of [-1, 1]) s += P.fill(`M${cx + k * 15} ${by - 16}q${k * 4} -2 ${k * 4} -7q${k * -2} -1 ${k * -3} 2Z`, 'bronze', { w: .4 }) + `<path d="M${cx + k * 19} ${by - 22}q${k * 6} -2 ${k * 9} 8" fill="none" stroke="${P.light('#cfe2ec', .3)}" stroke-width="1" opacity=".8"/>`;
  // the shaft of granite, the Corinthian capital
  const yb = by - 66, yt = 172, r0 = 6.8, r1 = 5.6;
  s += P.fill(`M${cx - r0} ${yb}L${cx - r1} ${yt}H${cx + r1}L${cx + r0} ${yb}Z`, 'shaft') + P.shade(`M${cx + 1.4} ${yb}L${cx + 1.2} ${yt}H${cx + r1}L${cx + r0} ${yb}Z`, 'shaft', .22) + P.lite(`M${cx - 5} ${yb}L${cx - 4} ${yt}H${cx - 2.4}L${cx - 3} ${yb}Z`, 'shaft', .25, { op: .7 });
  s += P.fill(P.rect(cx - 7.4, yb - 2, 14.8, 3), 'bronze', { w: .45 });
  s += P.fill(`M${cx - r1} ${yt}L${cx - 8.6} ${yt - 11}H${cx + 8.6}L${cx + r1} ${yt}Z`, 'bronze', { w: .5 });
  for (const [dx, dy] of [[-6, -3], [-2, -4], [2, -4], [6, -3], [-7, -8], [0, -8], [7, -8]]) s += `<path d="M${cx + dx} ${yt + dy}q-1.4 -2.6 0 -4q1.4 1.4 0 4Z" fill="${P.light('bronze', .3)}"/>`;
  s += P.fill(P.rect(cx - 10, yt - 14, 20, 3), 'bronze', { w: .45 });
  // King Sigismund in armour and cloak, the cross raised in his right hand, the sabre in his left
  const sb = yt - 14;
  let k = P.fill('M-4.4 0L-3.4 -14Q0 -17 3.4 -14L5.6 0Z', 'bronze', { w: .5 }) + P.lite('M-3.6 -1L-2.8 -13L-1 -14L-1.4 -1Z', 'bronze', .3);
  k += P.fill('M2 -15Q8 -8 7.4 0H4Z', 'bronze', { w: .45 }) + P.fill('M-4 -15Q-7 -8 -6.4 0H-3.6Z', 'bronze', { w: .4 });
  k += P.line('M-3 -6.4H3.6', '#4a3a24', .5);
  k += `<circle cy="-18.6" r="2.3" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".45"/>` + P.fill('M-2.2 -20l.6 -2.4l1 1.2l.6 -1.6l.6 1.6l1 -1.2l.6 2.4Z', 'gold', { w: .3 });
  k += P.line('M-3 -13L-6.4 -19', 'bronze', 1.5);
  k += P.line('M-7 -15V-36M-10.6 -30.6h7.2', 'bronze', 1.7) + P.line('M-7 -16V-35M-10.2 -30.6h6.4', 'gold', .55, { op: .85 });
  k += P.line('M3.6 -12L6 -4', 'bronze', 1.3) + P.line('M6 -5L9.6 1', '#c9ccd0', .9);
  s += `<g transform="translate(${cx} ${sb}) scale(1.5)">${k}</g>`;
  if (P.L.snow) s += P.flat(P.rect(cx - 10, yt - 15.4, 20, 1.6), '#f4f7fa') + P.flat(P.rect(cx - 12, by - 63, 24, 1.6), '#f4f7fa');
  return s;
}
function pigeons(P, x0, x1, y, n, seed) {
  const { f } = P, r = P.rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), yy = y + r() * 10, k = r() < .5 ? 1 : -1, c = r() < .2 ? '#e9e6e0' : r() < .5 ? '#7e848e' : '#9aa0a8';
    s += `<path d="M${f(x - k * 2.6)} ${f(yy)}q${f(k * 1.4)} -2.6 ${f(k * 4)} -2.2q${f(k * 1)} -1.6 ${f(k * 2.2)} -.6l${f(k * .8)} .4l${f(k * -1)} .4q${f(k * -.2)} 2.4 ${f(k * -3)} 2.4Z" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  }
  return s;
}

// ---------- the Old Town and the near house ----------
function oldTown(P) {
  const { f } = P;
  let s = '';
  const walls = ['wall2', 'wall', 'wall4', 'wall3', 'wall2', 'wall', 'wall4', 'wall3'];
  const ws = [24, 20, 26, 18, 22, 24, 20, 26, 22];
  let x = 70;
  for (let i = 0; x < 330; i++) {
    const w = ws[i % ws.length], h = 70 + ((i * 29) % 23), by = HZ;
    s += P.facade(x, by, w, h, { c: walls[i % walls.length], roof: i % 3 === 1 ? 'gable' : 'pitch', roofC: 'roof', rh: 18, side: 3, cols: 3, floors: 5, shop: i % 2 ? ['#7a2a34', '#efe4cc'] : null, flagChance: .6 });
    // dormers in the steep roofs, chimneys
    s += P.fill(P.rect(x + w * .4, by - h - 13, 5, 6), 'wall', { w: .4 }) + P.fill(P.rect(x + w * .75, by - h - 20, 3.4, 9), 'roof', { w: .4 });
    if (i === 3 || i === 7) s += P.fill(P.rect(x + 1, by - 26, w - 2, 6), '#24382c', { w: .4 }) + `<text x="${f(x + w / 2)}" y="${by - 21.6}" font-family="Georgia,'Times New Roman',serif" font-size="4" font-weight="bold" text-anchor="middle" fill="${P.ink('#e2c26a')}" textLength="${f(w - 5)}" lengthAdjust="spacingAndGlyphs">${i === 3 ? 'ЧАЙ · HERBATA' : 'ХЛѢБЪ · CHLEB'}</text>`;
    x += w - .5;
  }
  return s;
}
function leftHouse(P) {
  const { f } = P;
  const q = sideFront({ x0: 12, x1: 74, t0: -20, t1: 190, b0: 382, b1: HZ + 4, k: 1 });
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = P.fill(quad(0, 0, 1, 1), 'wall3') + P.shade(quad(.86, 0, 1, 1), 'wall3', .14);
  for (let r = 0; r < 5; r++) {
    const v0 = .07 + r * .13, v1 = v0 + .085;
    s += P.fill(quad(0, v0 - .022, 1, v0 - .012), 'wall', { w: .4 });
    for (let c = 0; c < 3; c++) {
      const u0 = .08 + c * .3, u1 = u0 + .15, lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".8"/>`;
      s += P.fill(P.poly([q(u0 - .02, v0 - .004), q((u0 + u1) / 2, v0 - .03), q(u1 + .02, v0 - .004)]), 'wall', { w: .4 });
    }
  }
  // a shop with its bilingual sign and an awning
  s += `<path d="${quad(.02, .76, .98, .8)}" fill="${P.ink('#2f4a3a')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  const n = 6;
  for (let i = 0; i < n; i++) s += P.flat(P.poly([q(i / n, .81), q((i + 1) / n, .81), [q((i + 1) / n, .86)[0] + 5, q((i + 1) / n, .86)[1]], [q(i / n, .86)[0] + 5, q(i / n, .86)[1]]]), i % 2 ? '#efe6d0' : '#8a2a3a');
  s += `<path d="${quad(.04, .87, .96, .98)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#4a3a2c')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  s += P.wall(f(q(.55, .6)[0]), f(q(.55, .6)[1]), 7, 10) + P.flagAt(f(q(.4, .2)[0]), f(q(.4, .2)[1]));
  return s;
}

// ---------- people ----------
function gorodovoy(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  let d = P.person(x, y, s, 'gent', { c: '#eeebe2', legs: '#1d1f26', hat: '#1d1f26' });
  d += P.line(`M${f(x - 2.6 * s)} ${f(y - 13 * s)}L${f(x - 4.4 * s)} ${f(y - 2 * s)}`, '#5a5a62', 1.1 * s) + `<path d="M${f(x - 2.8 * s)} ${f(y - 14 * s)}h${f(5.6 * s)}" stroke="${P.ink('#2a2622')}" stroke-width="${f(.9 * s)}"/>`;
  d += `<path d="M${f(x - 3.2 * s)} ${f(top + 2.8 * s)}h${f(6.4 * s)}v${f(-2 * s)}h${f(-6.4 * s)}Z" fill="${P.ink('#1d1f26')}"/>`;
  return d;
}
function beard(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  return `<path d="M${f(x - 1.8 * s)} ${f(top + 5 * s)}q${f(1.8 * s)} ${f(4.4 * s)} ${f(3.6 * s)} 0Z" fill="${P.ink('#3a2e26')}"/><path d="M${f(x - 3.6 * s)} ${f(top + 2.6 * s)}h${f(7.2 * s)}M${f(x - 2.4 * s)} ${f(top + 2.6 * s)}v${f(-2.2 * s)}h${f(4.8 * s)}v${f(2.2 * s)}" stroke="${P.ink('#1d1d20')}" stroke-width="${f(1 * s)}" fill="${P.ink('#1d1d20')}"/>`;
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
