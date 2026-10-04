// Barcelona from the foot of La Rambla: under the plane trees the promenade runs down to the Portal de la Pau, where
// Columbus stands on his iron column over the port, pointing out to sea; ships' masts and funnels beyond, Montjuïc and
// its castle on the right. The flower stalls of the Rambla, a Modernista house with its tribune and whiplash
// balconies, the rented chairs, a tram coming up the Rambla, carriages, strollers, pigeons.

const VP = { x: 300, y: 250 };
const PX = (X, z) => VP.x + X / z, PY = (Y, z) => VP.y + Y / z;
const G = 130; // the ground, in units at z = 1 (19 to the metre)

export default {
  id: 'BAR',
  greet: 'RECUERDO de BARCELONA',
  nation: 'ES',
  flag: 'ES',
  flower: 'orange-blossom',
  flower2: 'geranium',
  frame: { band: ['#c6992f', '#695624'], gold: '#e6c66a', ink: '#5a1a2a', leaf: ['#5f9a4e', '#2f5a36'], year: '#6a2a2a', halo: '#f9edcf' },
  horizon: 250,
  clouds: 3,
  wind: 1,
  birds: { c: '#a9aab2', n: 5, y: 120, s: .95, x: .5 },
  pal: {
    key: '#2a231f', stone: '#e5d3ad', stone2: '#bba37c', wall: '#eed1a2', wall2: '#e0b089', wall3: '#f3e3c3', roof: '#b9603d',
    ground: '#dbc59b', road: '#bfae8d', water: '#2b7c9c', bronze: '#55644d', column: '#6b6e62', mont: '#b6ad78',
    tram: '#3d6a4c', glass: '#37485a', sash: '#efe5cf', iron: '#2d3833', gold: '#d6a93a',
  },

  // orange blossom: waxy white stars with gold anthers among glossy leaves, a bud, a small orange
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 11, 212, '#2f5a36', { shape: 'oval', vein: '#6f9a5a' }) + F.leaf(24, 10, 146, '#3f7046', { shape: 'oval', vein: '#7faa66' }) + F.leaf(20, 9, 262, '#3f7046', { shape: 'oval', vein: '#7faa66' });
    s += F.at(16, 14, `<circle r="5.4" fill="#f0982a" stroke="${I.key}" stroke-width=".55"/><circle cx="-1.6" cy="-1.8" r="1.7" fill="#ffd08a" opacity=".7"/><path d="M0 -5.4l-.6 -1.6" stroke="#2f5a36" stroke-width="1"/>`);
    s += F.at(-15, -11, F.radial(5, 6.5, 4.6, '#fbf8ef', { shape: 'point', k: .45 }) + F.disc(1.6, '#e8c64a'), 20);
    s += F.at(-12, 12, `<ellipse rx="2.6" ry="4.4" fill="#f6f1e2" stroke="${I.key}" stroke-width=".5" transform="rotate(30)"/>`);
    s += F.radial(5, 15, 10, ['#fffdf6', '#f7f2e4'], { rot: 8, shape: 'point', lite: '#ffffff', vein: '#e2dccb' });
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; s += `<path d="M0 0L${(Math.cos(a) * 5).toFixed(1)} ${(Math.sin(a) * 5).toFixed(1)}" stroke="#e8c64a" stroke-width=".7"/><circle cx="${(Math.cos(a) * 5.4).toFixed(1)}" cy="${(Math.sin(a) * 5.4).toFixed(1)}" r=".9" fill="#d89a2a"/>`; }
    s += F.disc(2.2, '#b9c95a');
    return s;
  },
  // geraniums: a ball of scarlet florets over a round, zoned leaf
  flowerArt2(F) {
    const I = F.I;
    let s = F.at(-6, 6, `<circle r="9" fill="#5f9a4e" stroke="${I.key}" stroke-width=".55"/><circle r="6" fill="none" stroke="#3d6a36" stroke-width="1.6" opacity=".7"/><path d="M0 0L0 -9M0 0L7 -5M0 0L-7 -5" stroke="#3d6a36" stroke-width=".5"/>`);
    s += F.stem('M2 12Q2 4 3 -2', I.leaf[1], 1);
    s += F.at(3, -6, F.cluster(7, 9, 2.6, ['#d8322c', '#e84a3a', '#c42420'], { petals: 5, eye: '#f2b6a0', seed: 5 }));
    return s;
  },

  back(P, T) {
    let s = '';
    // Montjuïc and its castle over the port, the sea, the ships along the moles
    s += P.far(.72, () => montjuic(P));
    s += P.water(250, 272, { seed: 11, shimmer: 5, x0: 180, x1: 420 });
    s += P.far(.6, () => shipping(P));
    s += P.far(.5, () => P.cross(golondrina(P), { y: 263, dir: -1, dur: 80, rest: .3, x0: 200, x1: 420, offset: 14 }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the ground: the Rambla's paving, its two carriageways, the kerbs of the promenade
    s += P.paving(262, 384, { vx: VP.x, seed: 8 });
    for (const [a, b] of [[-300, -152], [152, 300]]) s += P.flat(P.poly([[PX(a, 1), PY(G, 1)], [PX(b, 1), PY(G, 1)], [PX(b, 9), PY(G, 9)], [PX(a, 9), PY(G, 9)]]), 'road', { op: .75 });
    for (const X of [-150, 150]) s += P.line(`M${P.f(PX(X, 1))} ${P.f(PY(G, 1))}L${P.f(PX(X, 9))} ${P.f(PY(G, 9))}`, '#8a7a5e', 1.1) + P.line(`M${P.f(PX(X + (X < 0 ? 4 : -4), 1))} ${P.f(PY(G, 1))}L${P.f(PX(X + (X < 0 ? 4 : -4), 9))} ${P.f(PY(G, 9))}`, '#f2e6c8', .6, { op: .7 });
    // tram rails on the carriageways
    for (const X of [-246, -224, 214, 236]) s += P.line(`M${P.f(PX(X, 1))} ${P.f(PY(G, 1))}L${P.f(PX(X, 9))} ${P.f(PY(G, 9))}`, '#77706a', .9, { op: .8 });
    // the Portal de la Pau: the Duana's towers at the right, palms, and the monument
    s += P.far(.42, () => duana(P));
    s += P.far(.4, () => P.tree(232, 268, .85, 'palm') + P.tree(372, 268, .9, 'palm') + P.tree(404, 266, .75, 'palm'));
    s += P.far(.36, () => columbus(P, 306, 268));
    s += P.far(.38, () => P.crowd(220, 290, 270, 6, { s: .3, seed: 4 }) + P.crowd(320, 380, 271, 6, { s: .3, seed: 9 }));
    s += P.far(.4, () => fade(P, T.fiacre({ s: .3, dir: 1, horses: 1, body: '#2a2622' }), { y: 271, dir: 1, dur: 40, rest: .4, x0: 250, x1: 366, offset: 3 }));
    // the houses of the Rambla on both sides, the Modernista house nearest on the left
    s += rambla(P, -1) + rambla(P, 1) + modernista(P);
    // on the pavement by the Modernista house: a lady at the shop window, a porter, a water-carrier's cart
    s += P.person(PX(-262, 1.45), PY(G, 1.45), 1.06 / 1.45, 'lady', { c: '#c9d6e6', dir: -1 }) + P.person(PX(-250, 1.7), PY(G, 1.7), 1.06 / 1.7, 'worker', { c: '#6a5a46', dir: 1 });
    s += P.person(PX(-270, 2.6), PY(G, 2.6), 1.06 / 2.6, 'gent', { c: '#2a2c34', dir: 1 }) + P.person(PX(-262, 2.9), PY(G, 2.9), 1.06 / 2.9, 'lady', { c: '#f3eee2', parasol: '#e8b9c4' });
    // the far plane trees, the lamps between them
    // the palms of the Portal de la Pau where the Rambla ends, then the plane trees of the promenade
    for (const z of [4.6, 3.5]) s += P.far(z * .06, () => P.tree(PX(-150, z), PY(G, z), 4.4 / z, 'palm') + P.tree(PX(150, z), PY(G, z), 4.4 / z, 'palm'));
    s += P.far(.14, () => plane(P, -150, 2.3, st) + plane(P, 150, 2.3, st));
    for (const z of [4.9, 3.8, 2.8]) s += P.far(z * .05, () => P.lamp(PX(-150, z), PY(G, z), 1.25 / z, 'iron', { h: 70 }) + P.lamp(PX(150, z), PY(G, z), 1.25 / z, 'iron', { h: 70 }));
    // the flower stalls along the promenade, the bird sellers' cages, the hired chairs, strollers
    s += stall(P, -112, 3.2, 3) + stall(P, -112, 2.2, 7) + birdCages(P, 108, 2.6);
    s += chairs(P, 118, 1.7);
    s += P.far(.2, () => P.crowd(PX(-60, 3.4), PX(70, 3.4), PY(G, 3.4), 7, { s: 1 / 3.4 * 1.06, seed: 12 }));
    s += P.far(.1, () => P.crowd(PX(-90, 2.4), PX(-10, 2.4), PY(G, 2.4), 4, { s: 1 / 2.4 * 1.06, seed: 15 }) + P.crowd(PX(30, 2.1), PX(100, 2.1), PY(G, 2.1), 3, { s: 1 / 2.1 * 1.06, seed: 16 }));
    // a tram coming up the right-hand carriageway, another going down on the left, a galera, strollers crossing
    s += P.mover(T.tram({ c: '#3d6a4c', band: '#efe0b8', number: '41', s: 1.02, dir: 1 }), { path: [[PX(225, 8), PY(G, 8), .14, 0, 0], [PX(225, 7.4), PY(G, 7.4), .15, .04, 1], [PX(225, 2.2), PY(G, 2.2), .48, .5], [PX(225, 2.2), PY(G, 2.2), .48, .6], [PX(225, 1.05), PY(G, 1.05), 1, .9, 1], [PX(225, .98), PY(G, .98), 1.06, .93, 0], [PX(225, .98), PY(G, .98), 1.06, 1, 0]], dur: 52, offset: 6 });
    s += P.mover(T.tram({ c: '#3d6a4c', band: '#efe0b8', number: '12', s: .9, dir: -1 }), { path: [[PX(-235, 1.1), PY(G, 1.1), .9, 0, 0], [PX(-235, 1.2), PY(G, 1.2), .84, .05, 1], [PX(-235, 7), PY(G, 7), .15, .6, 1], [PX(-235, 7.6), PY(G, 7.6), .14, .64, 0], [PX(-235, 7.6), PY(G, 7.6), .14, 1, 0]], dur: 60, offset: 38 });
    s += P.setStreet(PY(G, 1.6), 150, 450, 1.06 / 1.6);
    s += fade(P, T.walkers({ kinds: ['gent', 'lady'], s: .66, dir: 1, seed: 21, dresses: ['#f3eee2', '#e8c9b0'] }), { y: PY(G, 1.75), dir: 1, dur: 60, offset: 4, x0: PX(-150, 1.75) + 6, x1: PX(150, 1.75) - 6 });
    s += fade(P, T.walkers({ kinds: ['lady', 'girl'], s: .5, dir: -1, seed: 24, dresses: ['#c9d6e6', '#f3eee2'] }), { y: PY(G, 2.3), dir: -1, dur: 52, offset: 28, x0: PX(-150, 2.3) + 6, x1: PX(150, 2.3) - 6 });
    return spanish(s);
  },

  front(P, T, st) {
    let s = '';
    // the nearest plane trees, their crowns closing over the promenade
    s += plane(P, 150, 1.25, st);
    // the flower stall in front, its flower-seller and a lady choosing carnations
    s += stall(P, -104, 1.35, 11);
    s += P.lamp(PX(150, 1.6), PY(G, 1.6), 1.2 / 1.6 * 1.2, 'iron', { h: 70 });
    // the newspaper kiosk on the right
    s += kiosk(P, 470, 352);
    // pigeons on the paving
    const r = P.rng(8);
    for (let i = 0; i < 9; i++) s += pigeon(P, 250 + r() * 120, 352 + r() * 18, r() < .5 ? 1 : -1, .9 + r() * .3);
    s += P.figure(372, 404, .92, 'lady', { c: '#f4ece0', sash: '#b8433a', parasol: '#f7e7dc', flowers: ['#d8322c', '#f2b6a0', '#e8c25a'] }) + P.figure(406, 402, .94, 'gent', { c: '#3a3530', hat: '#e2d39c', arm: 15 });
    return spanish(s);
  },
};

// ---------- the Rambla in perspective ----------
/** One side of the Rambla: a continuous front of houses, balconies at every floor, shops, shutters. side -1 left, 1 right. */
function rambla(P, side) {
  const { f } = P, X = 300 * side, H = 400;
  let s = '';
  const q = (z, h) => [PX(X, z), PY(G - h, z)];
  const quad = (z0, h0, z1, h1) => P.poly([q(z0, h0), q(z1, h0), q(z1, h1), q(z0, h1)]);
  const zs = [.85, 1.6, 2.5, 3.4, 4.4, 5.6, 7.2];
  const walls = side < 0 ? ['#eed1a2', '#e0b089', '#f3e3c3', '#e6c9a6', '#eed1a2', '#e0b089'] : ['#f3e3c3', '#e9c79c', '#eed1a2', '#dfb894', '#f3e3c3', '#e9c79c'];
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i], z1 = zs[i + 1], c = walls[i % walls.length], hh = H - (i % 3) * 22;
    if (side < 0 && i < 2) continue; // the Modernista house stands here
    s += P.far(Math.min(.4, z0 * .07), () => {
      let d = P.fill(quad(z0, 0, z1, hh), c, { w: .6 });
      d += P.fill(quad(z0, hh, z1, hh + 10), 'stone2', { w: .5 });
      // floors of tall shuttered windows with iron balconies, a shop below
      const bays = Math.max(2, Math.round((z1 - z0) / .38));
      for (let r = 0; r < 4; r++) {
        const h0 = 92 + r * 72, h1 = h0 + 50;
        if (h1 > hh - 8) break;
        for (let b = 0; b < bays; b++) {
          const za = z0 + (z1 - z0) * (b + .3) / bays, zb = z0 + (z1 - z0) * (b + .7) / bays;
          const on = P.wr() < P.L.windows, tone = P.wr();
          d += `<path d="${quad(za, h1, zb, h0)}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width="${f(.7 / Math.sqrt(z0))}"/>`;
          if (!on) d += P.flat(quad(za, h1, za + (zb - za) * .28, h0), '#5e8a6a', { op: .9 }) + P.flat(quad(zb - (zb - za) * .28, h1, zb, h0), '#5e8a6a', { op: .9 });
          d += P.line(P.poly([q(za - .04, h0 + 2), q(zb + .04, h0 + 2)], false), '#2c2b2a', 1.4 / Math.sqrt(z0)) + P.line(P.poly([q(za - .04, h0 + 14), q(zb + .04, h0 + 14)], false), '#2c2b2a', .6 / Math.sqrt(z0));
        }
      }
      for (let b = 0; b < bays; b++) {
        const za = z0 + (z1 - z0) * (b + .12) / bays, zb = z0 + (z1 - z0) * (b + .88) / bays, on = P.wr() < P.L.windows * 1.3;
        d += `<path d="${quad(za, 70, zb, 4)}" fill="${on ? P.glow('#ffcf7a') : P.ink('#4a3a2c')}" stroke="${P.keyC()}" stroke-width=".5"${on ? ' opacity=".85"' : ''}/>`;
      }
      // string courses at every floor
      for (const h of [84, 160, 232, 304]) if (h < hh - 10) d += P.fill(quad(z0, h + 4, z1, h), 'stone2', { w: .3 });
      // striped awnings over the first-floor balconies
      if (i % 2 === 0) for (let b = 0; b < bays; b++) {
        const za = z0 + (z1 - z0) * (b + .24) / bays, zb = z0 + (z1 - z0) * (b + .76) / bays, n = 5;
        for (let j = 0; j < n; j++) { const a = za + (zb - za) * j / n, c2 = za + (zb - za) * (j + 1) / n; d += P.flat(P.poly([q(a, 150), q(c2, 150), q(c2 - .02, 128), q(a - .02, 128)]), j % 2 ? '#efe6d0' : (i % 4 ? '#3f7a5a' : '#b8433a')); }
        d += P.line(P.poly([q(za, 150), q(zb, 150), q(zb - .02, 128), q(za - .02, 128)]), null, .35);
      }
      if (i % 2) d += P.fill(quad(z0 + .1, 82, z1 - .1, 70), i % 4 === 1 ? '#a8382e' : '#2f6b4a', { w: .4 });
      if (i === 2 || i === 4) { const [wx, wy] = q(z0 + .3, 120); d += P.wall(wx - 4 / z0, wy, 8 / z0 * 1.4, 11 / z0 * 1.4); }
      if (i === 3) { const [fx, fy] = q(z0 + .2, 210); d += P.flagAt(fx, fy); }
      return d;
    });
  }
  return s;
}
/** The Modernista house nearest on the left: a wavy cornice, a tribune of coloured glass, whiplash balconies. */
function modernista(P) {
  const { f } = P, X = -300;
  const q = (z, h) => [PX(X, z), PY(G - h, z)];
  const quad = (z0, h0, z1, h1) => P.poly([q(z0, h0), q(z1, h0), q(z1, h1), q(z0, h1)]);
  const z0 = .85, z1 = 2.5;
  let s = P.fill(quad(z0, 0, z1, 430), '#ecd3b0', { w: .7 });
  // the ceramic frieze and the wavy crest
  let crest = `M${f(q(z0, 430)[0])} ${f(q(z0, 430)[1])}`;
  for (let i = 1; i <= 12; i++) { const z = z0 + (z1 - z0) * i / 12, [x, y] = q(z, 430 + (i % 2 ? 26 : 8)); crest += `L${f(x)} ${f(y)}`; }
  crest += `L${f(q(z1, 430)[0])} ${f(q(z1, 430)[1])}Z`;
  s += P.fill(crest, '#d9a46a', { w: .6 });
  const r = P.rng(77);
  for (let i = 0; i < 26; i++) { const z = z0 + (z1 - z0) * r(), [x, y] = q(z, 404 + r() * 18); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 / z)}" fill="${P.ink(['#3f8a7a', '#d8a23a', '#c24a3a', '#3a6aa8'][i % 4])}"/>`; }
  s += P.fill(quad(z0, 398, z1, 392), '#3f8a7a', { w: .4 });
  // floors: windows in moulded frames with balconies of whiplash iron
  for (let rr = 0; rr < 4; rr++) {
    const h0 = 104 + rr * 74, h1 = h0 + 52;
    for (const [za, zb] of [[.95, 1.12], [1.62, 1.86], [2.08, 2.32]]) {
      const on = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(za, h1, zb, h0)}" fill="${on ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('#c9a77a')}" stroke-width="${f(1.4 / za)}"/>`;
      let curl = `M${f(q(za - .05, h0 + 4)[0])} ${f(q(za - .05, h0 + 4)[1])}`;
      for (let k = 1; k <= 6; k++) { const z = za - .05 + (zb - za + .1) * k / 6, [x, y] = q(z, h0 + 4 + (k % 2 ? 10 : 2)); curl += `Q${f(x)} ${f(y - 4 / za)} ${f(x)} ${f(y)}`; }
      s += `<path d="${curl}" fill="none" stroke="${P.ink('#2a2724')}" stroke-width="${f(1.1 / Math.sqrt(za))}"/>` + P.line(P.poly([q(za - .05, h0 + 1), q(zb + .05, h0 + 1)], false), '#2a2724', 1.6 / Math.sqrt(za));
    }
  }
  // the tribune: a glazed oriel on the first two floors, its panes coloured
  const tz0 = 1.24, tz1 = 1.5;
  s += P.fill(quad(tz0 - .03, 250, tz1 + .03, 96), '#d9b98c', { w: .7 });
  const pane = ['#6a9ab8', '#d9b04a', '#8a4a6a', '#5a8a5a', '#e8d8a0'];
  for (let rr = 0; rr < 2; rr++) for (let k = 0; k < 3; k++) {
    const za = tz0 + (tz1 - tz0) * k / 3 + .01, zb = tz0 + (tz1 - tz0) * (k + 1) / 3 - .01, h0 = 106 + rr * 74, lit = P.L.windows > .25;
    s += `<path d="${quad(za, h0 + 54, zb, h0)}" fill="${lit ? P.glow(['#ffd88a', '#ffc86a', '#ffe1a0'][k]) : P.ink('glass')}" stroke="${P.ink('#3a2a20')}" stroke-width=".9"/>`;
    for (let u = 0; u < 2; u++) for (let v = 0; v < 4; v++) {
      const a = za + (zb - za) * u / 2, b = za + (zb - za) * (u + 1) / 2, h1 = h0 + 54 - v * 13.5, h2 = h1 - 13.5;
      if (!lit && v === 0) s += P.flat(P.poly([q(a, h1), q(b, h1), q(b, h2), q(a, h2)]), pane[(u + k + rr) % pane.length], { op: .9 });
      else if (!lit && (u + v + k) % 3 === 0) s += P.flat(P.poly([q(a, h1), q(b, h1), q(b, h2), q(a, h2)]), pane[(v + k) % pane.length], { op: .45 });
    }
    s += P.line(P.poly([q((za + zb) / 2, h0 + 54), q((za + zb) / 2, h0)], false), '#3a2a20', .5) + P.line(P.poly([q(za, h0 + 40), q(zb, h0 + 40)], false), '#3a2a20', .5);
  }
  s += P.fill(quad(tz0 - .05, 262, tz1 + .05, 250), '#3f8a7a', { w: .5 });
  // the shop: a curved window and a door under a mosaic fascia
  s += P.fill(quad(z0, 92, z1, 74), '#3a6a5a', { w: .5 });
  for (const [za, zb] of [[.95, 1.35], [1.5, 1.9], [2.05, 2.4]]) s += `<path d="${quad(za, 70, zb, 4)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#3f4a4e')}" stroke="${P.keyC()}" stroke-width=".7"/>` + P.line(P.poly([q(za, 70), q(zb, 70)], false), '#c9a23a', 1.2);
  s += P.shade(quad(z1 - .1, 430, z1, 0), '#ecd3b0', .2);
  const [wx, wy] = q(1.42, 60);
  s += P.wall(wx - 6, wy, 11, 15);
  s += P.flagAt(...q(1.2, 190));
  return s;
}

/** A plane tree on the promenade's kerb at depth z: a dappled trunk, boughs, a high crown in the season's leaves. */
function plane(P, X, z, st) {
  const { f } = P, lf = P.L.leaf, k = 1 / z;
  const x = PX(X, z), by = PY(G, z), r = P.rng(Math.round(x * 7 + z * 13));
  let s = '';
  const tw = 8 * k, th = 150 * k, top = by - th, lean = (X < 0 ? 1 : -1) * (z > 2 ? -1 : 1);
  // the trunk: grey-green bark peeling to cream
  s += P.fill(`M${f(x - tw)} ${f(by)}Q${f(x - tw * .7)} ${f(by - th * .5)} ${f(x - tw * .55 + lean * 4 * k)} ${f(top)}H${f(x + tw * .55 + lean * 4 * k)}Q${f(x + tw * .7)} ${f(by - th * .5)} ${f(x + tw)} ${f(by)}Z`, '#8d8a72', { w: .7 * Math.sqrt(k) });
  for (let i = 0; i < 7; i++) s += `<ellipse cx="${f(x + (r() - .5) * tw)}" cy="${f(by - r() * th)}" rx="${f(tw * .32)}" ry="${f(tw * .6)}" fill="${P.ink(i % 2 ? '#dcd5b2' : '#a7a882')}" opacity=".9"/>`;
  // boughs, forking up and out over the promenade
  const bx = x + lean * 4 * k, bough = (a, l) => { const q = a * Math.PI / 180; return `M${f(bx)} ${f(top + 6 * k)}q${f(Math.cos(q) * l * .4 * k)} ${f(Math.sin(q) * l * .2 * k)} ${f(Math.cos(q) * l * k)} ${f(Math.sin(q) * l * k)}`; };
  const boughs = [bough(-55, 80), bough(-125, 80), bough(-90 + lean * 14, 110), bough(-30, 70), bough(-150, 70), bough(-72, 120), bough(-108, 120)].join('');
  s += `<path d="${boughs}" fill="none" stroke="${P.keyC()}" stroke-width="${f(5.4 * k + 1)}" stroke-linecap="round"/><path d="${boughs}" fill="none" stroke="${P.ink('#8d8a72')}" stroke-width="${f(5.4 * k)}" stroke-linecap="round"/>`;
  if (!lf.leaf) { // winter: bare twigs and the hanging seed balls
    let t = '';
    for (let i = 0; i < 22; i++) { const a = -175 + r() * 170, q = a * Math.PI / 180, l = (70 + r() * 80) * k, x0 = bx + Math.cos(q) * l * .55, y0 = top + Math.sin(q) * l * .55; t += `M${f(x0)} ${f(y0)}l${f(Math.cos(q + (r() - .5)) * l * .55)} ${f(Math.sin(q + (r() - .5)) * l * .55)}`; }
    s += P.line(t, '#6a6450', 1.2 * k + .3);
    for (let i = 0; i < 9; i++) s += `<circle cx="${f(bx + (r() - .5) * 150 * k)}" cy="${f(top - r() * 120 * k)}" r="${f(2.2 * k + .4)}" fill="${P.ink('#7a6440')}"/>`;
    return s;
  }
  // the crown: masses of leaves, darker beneath, sunlit dabs above
  const cx = bx + lean * 10 * k, cy = top - 74 * k, rx = 104 * k, ry = 80 * k;
  for (const [dx, dy, sx, sy] of [[-.5, .25, .55, .55], [.5, .2, .55, .55], [-.15, -.3, .6, .55], [.3, -.25, .55, .55], [0, .1, .75, .6], [-.35, .55, .5, .4], [.35, .55, .5, .4]]) s += `<path d="${P.blob(cx + dx * rx, cy + dy * ry, rx * sx, ry * sy, 11, Math.round(cx + dx * 50 + dy * 9))}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width="${f(.7 * Math.sqrt(k))}"/>`;
  s += `<path d="${P.blob(cx, cy + ry * .58, rx * .78, ry * .3, 9, Math.round(cx) + 3)}" fill="${P.ink(lf.dark)}" opacity=".75"/>`;
  for (let i = 0; i < 14; i++) s += `<path d="${P.blob(cx - rx * .7 + r() * rx * 1.4, cy - ry * .65 + r() * ry * .9, rx * .16, ry * .12, 6, i + Math.round(cx))}" fill="${P.ink(i % 3 ? lf.light : lf.leaf)}" opacity=".9"/>`;
  for (let i = 0; i < 10; i++) s += `<path d="${P.blob(cx - rx * .7 + r() * rx * 1.4, cy + r() * ry * .5, rx * .12, ry * .08, 6, i + 40 + Math.round(cx))}" fill="${P.ink(lf.dark)}" opacity=".7"/>`;
  if (lf.bloom) for (let i = 0; i < 8; i++) s += `<circle cx="${f(cx - rx * .6 + r() * rx * 1.2)}" cy="${f(cy - ry * .4 + r() * ry * .8)}" r="${f(2 * k + .5)}" fill="${P.ink('#d9e8a0')}"/>`;
  return s;
}

/** A flower stall on the promenade at depth z: a green stand of tiers of pails under an awning, the flower-seller. */
function stall(P, X, z, seed) {
  const { f } = P, k = 1 / z, x = PX(X, z), by = PY(G, z), r = P.rng(seed);
  const W = 64 * k, H = 52 * k;
  let s = P.fill(P.rect(x - W / 2, by - H * .55, W, H * .55), '#3f6a4a', { w: .6 }) + P.shade(P.rect(x + W * .3, by - H * .55, W * .2, H * .55), '#3f6a4a', .25);
  s += P.line(`M${f(x - W / 2 + 2 * k)} ${f(by - H * .55)}V${f(by - H * 1.25)}M${f(x + W / 2 - 2 * k)} ${f(by - H * .55)}V${f(by - H * 1.25)}`, '#2f4a3a', 1.6 * k + .3);
  // the awning, striped
  const ay = by - H * 1.25, n = 6;
  for (let i = 0; i < n; i++) s += P.flat(P.poly([[x - W / 2 - 4 * k + i * (W + 8 * k) / n, ay], [x - W / 2 - 4 * k + (i + 1) * (W + 8 * k) / n, ay], [x - W / 2 - 4 * k + (i + 1) * (W + 8 * k) / n + 2 * k, ay + 9 * k], [x - W / 2 - 4 * k + i * (W + 8 * k) / n + 2 * k, ay + 9 * k]]), i % 2 ? '#f3ead6' : '#b8433a');
  s += P.line(P.poly([[x - W / 2 - 4 * k, ay], [x + W / 2 + 4 * k, ay], [x + W / 2 + 6 * k, ay + 9 * k], [x - W / 2 - 2 * k, ay + 9 * k]]), null, .5);
  // the tiers of pails, heaped with flowers of the season
  const season = P.L.season, cols = season === 'winter' ? ['#d8322c', '#efe8da', '#3a6a3a'] : season === 'autumn' ? ['#d9822a', '#b8433a', '#e8c25a', '#8a3a5a'] : ['#d8322c', '#f2a6b6', '#e8c25a', '#f3eee2', '#8a5ab0', '#e85a6a'];
  for (let t = 0; t < 3; t++) {
    const ty = by - H * (.55 + t * .2), tw = W * (1 - t * .18);
    s += P.fill(P.rect(x - tw / 2, ty - 2 * k, tw, 2.4 * k), '#2f4a3a', { w: .3 });
    for (let i = 0; i < 7 - t * 2; i++) {
      const fx = x - tw / 2 + tw * (i + .5) / (7 - t * 2), fy = ty - 6 * k;
      s += `<path d="${P.blob(fx, fy, 4.4 * k, 3.6 * k, 6, seed * 9 + i + t * 7)}" fill="${P.ink(P.L.leaf.leaf ?? P.L.leaf.ever)}"/>`;
      for (let j = 0; j < 4; j++) s += `<circle cx="${f(fx - 3 * k + r() * 6 * k)}" cy="${f(fy - 3 * k + r() * 4 * k)}" r="${f(1.5 * k + .25)}" fill="${P.ink(cols[Math.floor(r() * cols.length)])}"/>`;
    }
  }
  // the flower-seller beside her stall
  s += P.person(x + W / 2 + 7 * k, by, 1.06 * k, 'lady', { c: '#2f2a30', top: '#e9dcc4', hat: '#3a3a44', dir: -1 });
  return s;
}
function birdCages(P, X, z) {
  const { f } = P, k = 1 / z, x = PX(X, z), by = PY(G, z);
  let s = P.fill(P.rect(x - 22 * k, by - 22 * k, 44 * k, 22 * k), '#7a5a3a', { w: .5 });
  for (const [dx, dy] of [[-14, -30], [0, -34], [14, -30], [-7, -46], [7, -46]]) {
    const cx = x + dx * k, cy = by + dy * k;
    s += P.fill(P.dome(cx, cy + 6 * k, 6 * k, 8 * k), '#efe6d2', { w: .4, op: .5 });
    let bars = '';
    for (let i = -2; i <= 2; i++) bars += `M${f(cx + i * 2.4 * k)} ${f(cy + 6 * k)}V${f(cy - 4 * k + Math.abs(i) * 1.2 * k)}`;
    s += P.line(bars, '#c9a23a', .5) + `<circle cx="${f(cx)}" cy="${f(cy + 2 * k)}" r="${f(1.5 * k + .3)}" fill="${P.ink('#f2d23a')}"/>`;
  }
  s += P.person(x - 30 * k, by, 1.06 * k, 'worker', { c: '#4a4a52', legs: '#3a3a40', dir: 1 });
  return s;
}
/** The hired iron chairs along the promenade. */
function chairs(P, X, z) {
  const { f } = P;
  let s = '';
  for (let i = 0; i < 5; i++) {
    const zz = z + i * .45, k = 1 / zz, x = PX(X, zz), by = PY(G, zz);
    s += P.line(`M${f(x - 4 * k)} ${f(by)}V${f(by - 10 * k)}H${f(x + 4 * k)}V${f(by)}M${f(x + 4 * k)} ${f(by - 10 * k)}V${f(by - 20 * k)}`, '#2d3833', 1.3 * k + .3);
    if (i === 1) s += P.person(x, by - 2 * k, 1.06 * k, 'gent', { c: '#3a3530' });
    if (i === 3) s += P.person(x, by - 2 * k, 1.06 * k, 'lady', { c: '#e8c9b0', parasol: '#f3eee2' });
  }
  return s;
}
function kiosk(P, x, by) {
  let s = P.fill(P.rect(x - 15, by - 40, 30, 40), '#6a3a2a') + P.shade(P.rect(x + 6, by - 40, 9, 40), '#6a3a2a', .25);
  s += P.fill(P.rect(x - 10, by - 33, 20, 16), '#efe6d2', { w: .4 });
  for (let i = 0; i < 4; i++) s += P.line(`M${x - 8} ${by - 30 + i * 3.6}h16`, '#4a4440', .6, { op: .7 });
  s += P.fill(P.poly([[x - 19, by - 40], [x, by - 54], [x + 19, by - 40]]), '#3d6a4c') + P.line(`M${x} ${by - 54}v-6`, '#d6a93a', 1.1);
  s += P.flat(P.rect(x - 18, by - 43, 36, 3), '#d6a93a');
  s += P.wall(x - 14, by - 36, 8, 11) + P.wall(x + 6, by - 36, 8, 11);
  return s;
}
function pigeon(P, x, y, dir, s) {
  const { f } = P;
  return `<path d="M${f(x - 3 * s * dir)} ${f(y - 1.5 * s)}q${f(2 * s * dir)} ${f(-2.4 * s)} ${f(5 * s * dir)} ${f(-1 * s)}l${f(1.4 * s * dir)} ${f(-1.4 * s)}l${f(.4 * s * dir)} ${f(1.6 * s)}q${f(-1 * s * dir)} ${f(2.6 * s)} ${f(-4 * s * dir)} ${f(2.4 * s)}Z" fill="${P.ink('#8a8c96')}" stroke="${P.keyC()}" stroke-width=".35"/><path d="M${f(x)} ${f(y)}v${f(-1 * s)}" stroke="${P.ink('#c8604a')}" stroke-width=".5"/>`;
}

// ---------- the port ----------
function montjuic(P) {
  let s = P.fill('M392 252C410 232 432 214 456 204C478 196 500 192 524 194C548 196 566 204 590 214V252Z', 'mont');
  s += P.shade('M524 194C548 196 566 204 590 214V252H540C540 230 534 210 524 194Z', 'mont', .15) + P.stipple('M392 252C410 232 432 214 456 204C478 196 500 192 524 194C548 196 566 204 590 214V252Z', 'mont', 50, { box: [392, 192, 200, 60], op: .3 });
  // the castle: low bastioned walls, the keep, a flag
  s += P.fill('M486 200L492 190H536L542 200Z', 'stone2', { w: .5 }) + P.fill(P.rect(506, 182, 12, 9), 'stone2', { w: .45 });
  for (let x = 494; x < 536; x += 5) s += P.flat(P.rect(x, 188.6, 2.6, 1.6), 'stone2');
  s += P.flag(512, 182, .55, 'ES', { h: 14 });
  const lf = P.L.leaf, r = P.rng(4);
  for (let i = 0; i < 12; i++) s += `<path d="${P.blob(410 + r() * 160, 214 + r() * 30, 4 + r() * 4, 2.6, 7, i + 3)}" fill="${P.ink(i % 2 ? lf.ever : lf.leaf ?? lf.ever)}"/>`;
  return s;
}
function shipping(P) {
  const { f } = P;
  let s = '';
  // a steamer at the mole, masts of sailing ships along the Moll de la Fusta
  s += P.fill('M332 262H404L398 268H338Z', '#2a2c30', { w: .45 }) + P.fill(P.rect(346, 255, 44, 7), '#f1ece0', { w: .4 }) + P.fill('M362 255L363 241H370L371 255Z', '#1d1a17', { w: .4 }) + P.flat(P.rect(362.6, 243, 7.6, 2.4), '#c2442e');
  s += P.line('M352 255V232M384 255V234', '#4a3a2c', .7) + P.smoke(366.5, 241, .5, { dark: true });
  for (const [x, h] of [[168, 52], [188, 60], [204, 46], [256, 58], [272, 64], [430, 48], [446, 56]]) {
    s += P.line(`M${x} 264V${264 - h}M${x - 9} ${264 - h * .7}H${x + 9}M${x - 7} ${264 - h * .45}H${x + 7}M${x} ${264 - h}L${x + 18} 262`, '#4a3a2c', .7);
    s += P.fill(`M${x - 13} 262H${x + 13}L${x + 10} 266H${x - 10}Z`, '#3a3430', { w: .4 });
  }
  return s;
}
function golondrina(P) {
  const W = 46, H = 22, doc = (b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${b}</svg>`;
  let b = P.fill('M2 15H44L40 20H6Z', '#f2ede2', { w: .5 }) + P.line('M4 17.5H42', '#2b7c9c', .9);
  b += P.fill('M10 15V9H36V15Z', '#f2ede2', { w: .4 }) + P.fill('M8 9.4H38L36 6.6H10Z', '#2b7c9c', { w: .4 });
  b += P.fill('M21 6.6L21.4 1H24.6L25 6.6Z', '#e2b23a', { w: .35 });
  for (let i = 0; i < 5; i++) b += `<rect x="${12 + i * 5}" y="10.6" width="2.6" height="2.6" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3e4c5c')}"/>`;
  return { svg: doc(b), w: W, h: H, ax: W / 2, ay: 19, puffs: [[23, 1, .4, false, 1]] };
}

// ---------- the Portal de la Pau ----------
function duana(P) {
  let s = '';
  // the Duana Nova: a long front of arched windows between towers crowned with winged figures
  s += P.fill(P.rect(392, 222, 96, 46), 'stone') + P.shade(P.rect(470, 222, 18, 46), 'stone', .18);
  s += P.windows(396, 230, 74, 34, 7, 2, { arched: true, ww: .45 });
  s += P.fill(P.rect(390, 218, 100, 5), 'stone2', { w: .5 });
  for (const x of [392, 440, 476]) {
    s += P.fill(P.rect(x, 204, 14, 18), 'stone', { w: .55 }) + P.fill(P.dome(x + 7, 204.5, 7.5, 8), '#5f7a8a', { w: .5 });
    s += P.fill(`M${x + 7} 194l-5 -3l3 4l-4 1l6 0l6 0l-4 -1l3 -4Z`, 'bronze', { w: .35 });
  }
  return s;
}
/** The Columbus monument: stepped base with its lions, the pedestal of reliefs, the iron column, the crown, the
 * navigator pointing out to sea. by: its foot. */
function columbus(P, x, by) {
  const { f } = P;
  let s = '';
  // steps and the lions on their plinths
  s += P.fill(P.rect(x - 34, by - 4, 68, 4), 'stone2', { w: .5 }) + P.fill(P.rect(x - 30, by - 8, 60, 4), 'stone', { w: .5 });
  for (const k of [-1, 1]) {
    s += P.fill(P.rect(x + k * 24 - 5, by - 14, 10, 6), 'stone', { w: .45 });
    s += P.fill(`M${f(x + k * 24 - 5)} ${f(by - 14)}q2 -5 6 -4l2 -3q3 0 2 4l1 3Z`, 'bronze', { w: .4 });
  }
  // the octagonal base with its bronze reliefs and the allegories at its corners
  s += P.fill(P.rect(x - 19, by - 34, 38, 26), 'stone') + P.shade(P.rect(x + 7, by - 34, 12, 26), 'stone', .18);
  s += P.stipple(P.rect(x - 19, by - 34, 38, 26), 'stone', 22, { box: [x - 19, by - 34, 38, 26], op: .3 });
  s += P.fill(P.rect(x - 12, by - 29, 24, 13), 'bronze', { w: .4 }) + P.line(`M${x - 9} ${by - 22}q3 -3 6 0t6 0t6 0`, '#8a9a6a', .6);
  for (const k of [-1, 1]) s += P.fill(`M${f(x + k * 19)} ${f(by - 34)}l${f(k * 3)} 2v-9l${f(-k * 3)} -2Z`, 'bronze', { w: .35 }) + `<circle cx="${f(x + k * 20.5)}" cy="${f(by - 44)}" r="2" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  s += P.fill(P.rect(x - 21, by - 37, 42, 3.4), 'stone2', { w: .5 });
  // the pedestal with prows and shields
  s += P.fill(P.rect(x - 13, by - 58, 26, 21), 'stone') + P.shade(P.rect(x + 5, by - 58, 8, 21), 'stone', .2);
  s += P.fill(P.rect(x - 15, by - 61, 30, 3.4), 'stone2', { w: .45 });
  for (const k of [-1, 0, 1]) s += P.fill(`M${f(x + k * 8 - 3)} ${f(by - 52)}h6v6l-3 3l-3 -3Z`, k ? 'bronze' : 'gold', { w: .35 });
  // the column: iron, fluted, banded, rising to its capital
  const c0 = by - 61, c1 = by - 146;
  s += P.fill(`M${x - 4.4} ${c0}L${x - 3.4} ${c1}H${x + 3.4}L${x + 4.4} ${c0}Z`, 'column') + P.shade(`M${x + 1} ${c0}L${x + 1} ${c1}H${x + 3.4}L${x + 4.4} ${c0}Z`, 'column', .25);
  s += P.line(`M${x - 1.6} ${c0 - 2}L${x - 1.2} ${c1 + 2}M${x + 1.4} ${c0 - 2}L${x + 1.1} ${c1 + 2}`, '#8a8e80', .4, { op: .8 });
  s += P.fill(P.rect(x - 7, c0 - 10, 14, 10), 'column', { w: .45 });
  for (const yy of [c0 - 4, c0 - 12, c0 - 30]) s += P.fill(P.rect(x - 5, yy, 10, 2), 'gold', { w: .3 });
  // the capital and the crown of shields under a hemisphere of the world
  s += P.fill(`M${x - 4} ${c1}C${x - 9} ${c1 - 3} ${x - 9} ${c1 - 7} ${x - 8} ${c1 - 9}H${x + 8}C${x + 9} ${c1 - 7} ${x + 9} ${c1 - 3} ${x + 4} ${c1}Z`, 'column', { w: .5 });
  for (const k of [-6, -2, 2, 6]) s += P.line(`M${x + k * .5} ${c1}Q${x + k} ${c1 - 5} ${x + k * 1.3} ${c1 - 8}`, 'gold', .6);
  s += P.fill(P.rect(x - 8, c1 - 12, 16, 3.4), 'gold', { w: .45 });
  s += P.fill(`M${x - 6} ${c1 - 12}A6 5 0 0 1 ${x + 6} ${c1 - 12}Z`, 'gold', { w: .45 }) + P.line(`M${x - 5} ${c1 - 14}Q${x} ${c1 - 13} ${x + 5} ${c1 - 14}`, '#9a7424', .5);
  // the navigator: cloaked, his right arm thrown out toward the sea
  const ty = c1 - 16;
  s += P.fill(`M${x - 3.6} ${ty}L${x - 2.4} ${ty - 11}Q${x} ${ty - 13} ${x + 2.4} ${ty - 11}L${x + 3.6} ${ty}Z`, 'bronze', { w: .45 });
  s += P.shade(`M${x + .6} ${ty - 12}Q${x + 2.4} ${ty - 11.6} ${x + 2.4} ${ty - 11}L${x + 3.6} ${ty}H${x + 1}Z`, 'bronze', .25);
  s += P.line(`M${x - 1.6} ${ty - 10}L${x - 9} ${ty - 14.5}`, 'bronze', 1.6) + `<circle cx="${f(x - 9.4)}" cy="${f(ty - 14.8)}" r=".9" fill="${P.ink('bronze')}"/>`;
  s += `<circle cx="${x}" cy="${f(ty - 14)}" r="1.9" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  return s;
}

/** Spain stayed neutral; were its walls ever to call up the reserves, the kit's French heading would read in Spanish. */
function spanish(s) { return s.replace(/>MOBILISATION</g, '>MOVILIZACIÓN<'); }

/** Cross between x0 and x1 on y, fading in and out where there is nothing to hide behind. */
function fade(P, sp, { y, dir = 1, dur = 40, rest = 0, offset = 0, x0, x1 }) {
  const a = dir > 0 ? x0 : x1, b = dir > 0 ? x1 : x0, e = 10 * dir, run = 1 - rest;
  return P.mover(sp, { path: [[a, y, 1, 0, 0], [a + e, y, 1, .04 * run, 1], [b - e, y, 1, .96 * run, 1], [b, y, 1, run, 0], [b, y, 1, 1, 0]], dur, offset });
}
