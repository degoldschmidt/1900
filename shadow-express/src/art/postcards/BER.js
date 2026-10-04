// Berlin from the Pariser Platz at the head of Unter den Linden: the Brandenburg Gate square on, its Quadriga driving
// toward us, the Tiergarten's green through the passages; the Reichstag's glass dome and the Victory Column over the
// trees on the right; the Hotel Adlon running away on the left. A motor omnibus, Droschken and a taxi cross the
// square; a Guard sentry stands by his striped box; strollers under the candelabra, a Litfaß column with its bills,
// an officer of the Guard and his lady walking toward the gate.

const GB = 302, SC = 6.8, CX = 300, Q = 1.25; // the gate's foot, px a metre, its axis

export default {
  id: 'BER',
  greet: 'GRUSS aus BERLIN',
  nation: 'DE',
  flag: 'DE',
  flower: 'cornflower',
  flower2: 'chamomile',
  frame: { band: ['#394960', '#222e3c'], gold: '#d4b25e', ink: '#1f2f5a', leaf: ['#7a9c62', '#38583c'], year: '#5a2a2a', halo: '#f5ebcf' },
  horizon: GB,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#28262b', stone: '#e1d2b0', stone2: '#bba987', wall: '#ece1c8', wall2: '#dcc8a2', wall3: '#e7d6bd',
    roof: '#5d6772', copper: '#5b8b77', glass: '#37465a', sash: '#efe8d8', ground: '#dbcfb2', road: '#bcb5a5',
    iron: '#2b3836', gold: '#d2a542', prussian: '#24375f', column: '#e9dfc6',
  },

  // a cornflower: ragged blue funnels round a violet heart, a scaly bud, grey-green leaves like blades
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(30, 5, 205, I.leaf[1], { shape: 'lance' }) + F.leaf(26, 4.4, 150, I.leaf[0], { shape: 'lance' }) + F.leaf(20, 4, 250, I.leaf[0], { shape: 'lance' });
    s += F.stem('M2 6Q14 11 18 25', I.leaf[1], 1.1);
    s += F.at(18.5, 27, `<path d="M-3.6 1Q-4 -6 0 -7.4Q4 -6 3.6 1Q0 3 -3.6 1Z" fill="#8aa47a" stroke="${I.key}" stroke-width=".5"/><path d="M-2.6 -1.6l1.3 1.3 1.3-1.3 1.3 1.3 1.3-1.3M-2.4 -4l1.2 1.2 1.2-1.2 1.2 1.2 1.2-1.2" stroke="#4f6a48" stroke-width=".45" fill="none"/><path d="M-2.2 -6.6Q0 -10.4 2.2 -6.6" fill="#4a72d0" stroke="${I.key}" stroke-width=".45"/>`, 160);
    s += F.radial(9, 16, 8.4, ['#3d6cd2', '#3462c4', '#4777da'], { shape: 'frill', lite: '#86a6ee' });
    s += F.radial(8, 8, 4.4, '#2c3f9e', { rot: 22, shape: 'frill' });
    s += F.disc(3.4, '#3a2768', { dots: '#9c8ad4', n: 7 });
    return s;
  },
  // chamomile: small white daisies with domed yellow hearts on threadlike leaves
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(17, 5, 215, I.leaf[1], { shape: 'serrate' }) + F.leaf(15, 4.6, 140, I.leaf[0], { shape: 'serrate' });
    s += F.stem('M0 2Q6 -6 12 -9', I.leaf[1], .9);
    s += F.at(12, -10, F.radial(11, 6, 2.4, '#f7f5ec', { shape: 'strap', k: .35 }) + F.disc(2.6, '#efc22e', { dots: '#c39320', n: 6, lite: '#fbe485' }), 20);
    s += F.radial(13, 9.5, 3.2, ['#faf7ee', '#f0ecdf'], { shape: 'strap', k: .4 }) + `<ellipse cy="-.6" rx="4.4" ry="4" fill="#efc12c" stroke="${I.key}" stroke-width=".5"/><ellipse cx="-1.2" cy="-2" rx="1.8" ry="1.3" fill="#fbe48a" opacity=".8"/>`;
    return s;
  },

  back(P, T) {
    let s = '';
    // the Reichstag's glass dome and the Victory Column on the Königsplatz, over the trees on the right
    s += P.far(.66, () => reichstag(P, 497, 246) + victoryColumn(P, 452, 250));
    // the Tiergarten beyond the gate
    s += P.far(.6, () => woods(P, 30, 574, GB - 4, 7));
    s += P.far(.56, () => P.tree(118, GB - 2, 3.1, 'round') + P.tree(188, GB - 4, 2.6, 'round') + P.tree(420, GB - 4, 1.9, 'round'));
    s += P.far(.45, () => { let d = ''; for (const [x, sc] of [[214, .9], [258, .8], [342, .82], [388, .92]]) d += P.tree(x, GB - 2, sc, 'round'); return d; });
    // the road out through the gate toward Charlottenburg
    s += P.flat(P.poly([[290, GB - 12], [310, GB - 12], [348, GB + 2], [252, GB + 2]]), 'road', { op: .9 });
    s += P.smoke(120, 196, .7) + P.smoke(560, 200, .6);
    // carriages and riders beyond the gate, glimpsed between its columns
    s += P.cross(T.fiacre({ s: .34, horses: 2, dir: 1, body: '#2a2f38' }), { y: GB - 4, dir: 1, dur: 46, rest: .35, x0: 170, x1: 430, offset: 14 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .42, dir: -1, seed: 31, ...clothes(P) }), { y: GB - 3, dir: -1, dur: 70, x0: 180, x1: 420, offset: 40 });
    return s;
  },

  mid(P, T) {
    const { f } = P;
    let s = '';
    // the Pariser Platz, paved, the asphalt where the traffic crosses
    s += P.paving(GB - 2, 380, { vx: CX, seed: 6 });
    s += P.flat(P.rect(20, 330, 560, 26), 'road') + P.shade(P.rect(20, 330, 560, 3), 'road', .25);
    for (let x = 30; x < 580; x += 44) s += P.line(`M${x} 344h18`, '#e9e3d2', .7, { op: .35 });
    s += P.line('M20 330H580', 'stone2', 1.3) + P.line('M20 356H580', 'stone2', 1.6) + P.lite(P.rect(20, 356, 560, 2), 'ground', .3);
    if (P.L.wet) s += P.flat(P.rect(20, 331, 560, 24), P.L.sky.low, { op: .25, raw: 1 });
    // the gate
    s += P.far(.28, () => gate(P));
    s += P.far(.26, () => sentryBox(P, 431, GB + 1) + guard(P, 441, GB + 1.6, .52, { rifle: true }));
    // the gardens of the square either side of the way through
    s += P.far(.2, () => garden(P, 192, 316, 80, 3) + garden(P, 408, 316, 80, 9) + P.tree(162, 316, .62, 'round') + P.tree(222, 315, .58, 'round') + P.tree(378, 315, .58, 'round') + P.tree(438, 316, .62, 'round'));
    // strollers in the square and candelabra along it
    s += P.far(.22, () => P.crowd(140, 252, 311, 7, { s: .5, seed: 13, ...clothes(P) }) + P.crowd(348, 460, 311, 7, { s: .5, seed: 17, ...clothes(P) }));
    s += P.far(.2, () => candelabra(P, 146, 326, .56) + candelabra(P, 454, 326, .56));
    s += P.far(.14, () => P.crowd(104, 286, 326, 8, { s: .62, seed: 23, ...clothes(P) }) + P.crowd(316, 524, 326, 9, { s: .62, seed: 29, ...clothes(P) }));
    // the houses that close the square: the Adlon running away on the left, the north side on the right
    s += adlon(P);
    s += northSide(P);
    // the street: the omnibus, Droschken and a taxi; at war, the Guards
    s += P.setStreet(351, 90, 574, .92);
    s += P.cross(T.omnibus({ s: .8, dir: 1, c: '#2c5640', adText: 'ODOL', fleet: 'A.B.O.A.G.', ad: '#e8d48a' }), { y: 352, dir: 1, dur: 40, rest: .3, x0: 60, offset: 6 });
    s += P.cross(T.fiacre({ s: .62, dir: -1, horses: 1, body: '#262c36', hood: '#2a2826', wheelC: '#c2962e' }), { y: 340, dir: -1, dur: 58, rest: .2, x0: 80, offset: 30 });
    s += P.cross(T.motorcar({ s: .56, dir: 1, c: '#6a2a2a' }), { y: 346, dir: 1, dur: 20, rest: .62, x0: 70, offset: 25 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady', 'girl'], s: .58, dir: 1, seed: 5, ...clothes(P) }), { y: 327, dir: 1, dur: 110, x0: 100, offset: 50 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the Litfaß column on the right with its bills; a Schutzmann; a child with her hoop
    s += litfass(P, 494, 372, 1);
    if (P.war !== 'peace') s += P.crowd(462, 530, 368, 4, { s: .96, seed: 41, kinds: ['gent', 'worker', 'lady', 'boater'], ...clothes(P) });
    s += guard(P, 446, 368, 1.04, { police: true });
    s += P.person(408, 366, .8, 'child', { c: '#f1ece0', dir: 1 }) + hoop(P, 416, 366, .8);
    s += P.person(372, 364, .98, 'lady', { c: frock(P, '#d8c9e4'), parasol: umbrella(P, '#f4ead8'), dir: -1 }) + P.person(360, 364, 1, 'gent', { c: '#3b3f48', dir: -1 });
    // the candelabrum and the couple walking toward the gate
    s += candelabra(P, 150, 374, 1.12);
    s += officer(P, 66, 406, 1.2) + P.figure(106, 408, 1.18, 'lady', { c: frock(P, '#f3efe6'), sash: '#5d7fc4', flowers: ['#3d6cd2', '#f3efe6', '#3d6cd2'], parasol: umbrella(P, '#f6efe2') });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1, dir: -1, seed: 8, dresses: ['#e3ecf4', '#f3eee2'], ...clothes(P) }), { y: 368, dir: -1, dur: 80, offset: 24, x0: 140, z: 'fore' });
    return s;
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

// ---------- the Brandenburg Gate ----------
function gate(P) {
  const { f } = P, s = SC, X = (m) => CX + m * s;
  const yB = GB - 3.2, yCap = yB - 14.2 * s, yCol = yCap - 5, yArc = yCol - 1.3 * s, yFrz = yArc - 1.25 * s, yCor = yFrz - .8 * s, yAtt = yCor - 2.1 * s;
  const cols = [-14.8, -9.25, -3.7, 3.7, 9.25, 14.8].map(X), r0 = .9 * s, r1 = .74 * s;
  const xW0 = X(-20.7), xW1 = X(20.7);
  let d = '';
  // the gatehouses, lower, each a little Doric temple front
  for (const [x0, x1] of [[X(-34.3), xW0], [xW1, X(34.3)]]) d += gatehouse(P, x0, x1, yB);
  // the passages: their ceilings and inner walls run back to the far colonnade; through them, the trees
  const VX = CX, VY = GB - 10, K = .88, far = (x, y) => [VX + (x - VX) * K, VY + (y - VY) * K];
  for (let i = 0; i < 5; i++) {
    const xa = cols[i] + r0 * .95, xb = cols[i + 1] - r0 * .95, [fa, ft] = far(xa, yCol), [fb] = far(xb, yCol), [, fbot] = far(xa, yB);
    d += P.shade(P.poly([[xa, yCol], [xb, yCol], [fb, ft], [fa, ft]]), 'stone', .48);
    for (let k = 1; k < 4; k++) { const t = k / 4; d += P.line(`M${f(lerp(xa, fa, t))} ${f(lerp(yCol, ft, t))}H${f(lerp(xb, fb, t))}`, 'stone2', .4, { op: .5 }); }
    const mid = (xa + xb) / 2;
    if (mid <= VX + 1) d += P.shade(P.poly([[xa, yCol], [fa, ft], [fa, fbot], [xa, yB]]), 'stone', .34);
    if (mid >= VX - 1) d += P.shade(P.poly([[xb, yCol], [fb, ft], [fb, fbot], [xb, yB]]), 'stone', .34);
    // the far columns framing the light at the passage's end
    d += P.fill(P.rect(fa - 1.6, ft, 3.2, fbot - ft), 'stone2', { w: .35 }) + P.fill(P.rect(fb - 1.6, ft, 3.2, fbot - ft), 'stone2', { w: .35 });
    d += P.line(`M${f(fa)} ${f(ft + 1)}H${f(fb)}`, null, .5);
  }
  // the end walls, with their panels
  for (const [x0, x1] of [[xW0, cols[0] - r0], [cols[5] + r0, xW1]]) {
    d += P.fill(P.rect(x0, yCol, x1 - x0, yB - yCol), 'stone') + P.stipple(P.rect(x0, yCol, x1 - x0, yB - yCol), 'stone', 26, { box: [x0, yCol, x1 - x0, yB - yCol], op: .3 });
    d += P.shade(P.rect(x0 + 5, yCol + 16, x1 - x0 - 10, 40), 'stone', .16) + P.line(P.rect(x0 + 5, yCol + 16, x1 - x0 - 10, 40), 'stone2', .6);
    for (let k = 0; k < 3; k++) d += P.line(`M${f(x0 + 9 + k * 6)} ${f(yCol + 52)}q1.4 -8 .6 -18q1 -2 2 0q-.6 10 .8 18`, 'stone2', .7);
    d += P.fill(P.rect(x0 + 5, yB - 34, x1 - x0 - 10, 24), 'stone', { w: .5 }) + P.shade(P.arch(x0 + 9, yB - 32, x1 - x0 - 18, 22), 'stone', .3);
  }
  // the stylobate
  d += P.fill(P.rect(xW0 - 4, yB, xW1 - xW0 + 8, GB - yB + 1), 'stone2', { w: .6 }) + P.lite(P.rect(xW0 - 4, yB, xW1 - xW0 + 8, 1), 'stone2', .3);
  // the twelve columns we see six of: fluted, the shadow side to the right, Doric capitals
  for (const cx of cols) {
    const shaft = `M${f(cx - r0)} ${f(yB)}L${f(cx - r1)} ${f(yCap)}H${f(cx + r1)}L${f(cx + r0)} ${f(yB)}Z`;
    d += P.fill(shaft, 'stone', { w: .7 });
    d += P.shade(`M${f(cx + r0 * .3)} ${f(yB)}L${f(cx + r1 * .3)} ${f(yCap)}H${f(cx + r1)}L${f(cx + r0)} ${f(yB)}Z`, 'stone', .22);
    d += P.lite(`M${f(cx - r0 * .7)} ${f(yB)}L${f(cx - r1 * .7)} ${f(yCap)}H${f(cx - r1 * .35)}L${f(cx - r0 * .35)} ${f(yB)}Z`, 'stone', .3, { op: .7 });
    for (const k of [-.55, -.1, .35, .75]) d += P.line(`M${f(cx + k * r0)} ${f(yB - 1)}L${f(cx + k * r1)} ${f(yCap + 1)}`, 'stone2', .45, { op: .6 });
    d += P.fill(`M${f(cx - r1)} ${f(yCap)}Q${f(cx - r1 - 2.4)} ${f(yCap - 1.6)} ${f(cx - r1 - 2.6)} ${f(yCol + 1.6)}H${f(cx + r1 + 2.6)}Q${f(cx + r1 + 2.4)} ${f(yCap - 1.6)} ${f(cx + r1)} ${f(yCap)}Z`, 'stone', { w: .5 });
    d += P.fill(P.rect(cx - r1 - 3, yCol, 2 * r1 + 6, 1.8), 'stone', { w: .45 });
  }
  // the entablature: architrave, triglyphs and metopes, cornice
  const e0 = xW0 - 2, e1 = xW1 + 2;
  d += P.fill(P.rect(e0, yArc, e1 - e0, yCol - yArc), 'stone') + P.shade(P.rect(e0, yCol - 1.6, e1 - e0, 1.6), 'stone', .2);
  d += P.fill(P.rect(e0, yFrz, e1 - e0, yArc - yFrz), 'stone') + P.lite(P.rect(e0, yFrz, e1 - e0, 1.2), 'stone', .3);
  const n = 30, tw = (e1 - e0) / n;
  for (let i = 0; i <= n; i++) {
    const x = e0 + i * tw - 2;
    d += P.fill(P.rect(x, yFrz + .4, 4, yArc - yFrz - .8), 'stone2', { w: .35 }) + P.line(`M${f(x + 1.3)} ${f(yFrz + 1)}v${f(yArc - yFrz - 2)}M${f(x + 2.7)} ${f(yFrz + 1)}v${f(yArc - yFrz - 2)}`, '#7e7058', .35, { op: .6 });
    if (i < n) d += P.line(`M${f(x + 6.4)} ${f(yArc - 1.4)}q1.4 -3.6 2.6 -1.6q1.2 -2.6 2 .2`, 'stone2', .55, { op: .8 });
  }
  d += P.fill(P.rect(e0 - 4, yCor, e1 - e0 + 8, yFrz - yCor), 'stone', { w: .7 }) + P.lite(P.rect(e0 - 4, yCor, e1 - e0 + 8, 1.4), 'stone', .35) + P.shade(P.rect(e0 - 4, yFrz - 1.2, e1 - e0 + 8, 1.2), 'stone', .3);
  // the attic: plain to the sides, the relief of the procession of Peace in the middle, the stepped plinth
  const a0 = xW0 + 2, a1 = xW1 - 2;
  d += P.fill(P.rect(a0, yAtt, a1 - a0, yCor - yAtt), 'stone') + P.stipple(P.rect(a0, yAtt, a1 - a0, yCor - yAtt), 'stone', 40, { box: [a0, yAtt, a1 - a0, yCor - yAtt], op: .28 });
  d += P.shade(P.rect(a1 - 12, yAtt, 12, yCor - yAtt), 'stone', .14);
  const r0x = X(-11.5), r1x = X(11.5);
  d += P.shade(P.rect(r0x, yAtt + 2.4, r1x - r0x, yCor - yAtt - 4.4), 'stone', .22) + P.line(P.rect(r0x, yAtt + 2.4, r1x - r0x, yCor - yAtt - 4.4), 'stone2', .5);
  // the procession of Peace in relief: walkers, riders, and her chariot drawn by horses in the middle
  const R = P.rng(77), rb = yCor - 2.6, rh = yCor - yAtt - 6;
  for (let x = r0x + 3; x < r1x - 3;) {
    if (Math.abs(x - CX) < 9) { d += P.flat(`M${f(CX - 8)} ${f(rb)}l2 ${f(-rh * .5)}h9l1.6 ${f(-rh * .3)}l1.6 ${f(rh * .3)}l-1.4 ${f(rh * .5)}Z`, 'stone') + `<circle cx="${f(CX - 4)}" cy="${f(rb - 1.6)}" r="1.8" fill="none" stroke="${P.ink('stone2')}" stroke-width=".5"/>`; x = CX + 10; continue; }
    if (R() < .3) { d += P.flat(`M${f(x)} ${f(rb)}l.6 ${f(-rh * .45)}l5 -.6l1.4 ${f(-rh * .3)}l.8 .4l-.6 ${f(rh * .3)}l.4 ${f(rh * .62)}h-1l-.8 ${f(-rh * .4)}h-3.4l-.6 ${f(rh * .4)}Z`, 'stone'); x += 9; }
    else { const h = rh * (.75 + R() * .25); d += P.flat(`M${f(x)} ${f(rb)}l.5 ${f(-h + 1.6)}q1 -1.8 2 0l.5 ${f(h - 1.6)}Z`, 'stone') + `<circle cx="${f(x + 1.5)}" cy="${f(rb - h)}" r=".9" fill="${P.ink('stone')}"/>`; x += 3.2 + R() * 2.4; }
  }
  const p0 = X(-9), p1 = X(9), yP0 = yAtt - 1.5 * s, yP1 = yP0 - 1.1 * s;
  d += P.fill(P.rect(p0, yP0, p1 - p0, yAtt - yP0), 'stone') + P.shade(P.rect(p1 - 8, yP0, 8, yAtt - yP0), 'stone', .14);
  d += P.fill(P.rect(X(-6.4), yP1, X(6.4) - X(-6.4), yP0 - yP1), 'stone') + P.lite(P.rect(X(-6.4), yP1, X(6.4) - X(-6.4), 1.2), 'stone', .3);
  if (P.L.snow) for (const [x0, x1, y] of [[e0 - 4, e1 + 4, yCor], [a0, a1, yAtt], [p0, p1, yP0], [X(-6.4), X(6.4), yP1]]) d += P.flat(P.rect(x0, y - 1.6, x1 - x0, 2), '#f4f7fa', { op: .92 });
  d += quadriga(P, CX, yP1);
  return d;
}

function gatehouse(P, x0, x1, yB) {
  const { f } = P, w = x1 - x0, top = yB - 11.5 * SC, left = x0 < CX;
  let d = P.fill(P.rect(x0, top, w, yB - top), 'stone') + P.stipple(P.rect(x0, top, w, yB - top), 'stone', 30, { box: [x0, top, w, yB - top], op: .3 });
  d += P.fill(P.rect(x0 - 1.5, top - 4, w + 3, 4), 'stone', { w: .55 }) + P.lite(P.rect(x0 - 1.5, top - 4, w + 3, 1), 'stone', .3);
  // the portico: four Doric columns and a pediment, the door in the shade behind
  const pw = w * .62, px = left ? x0 + w * .22 : x1 - w * .22 - pw, ph = (yB - top) * .82, pt = yB - ph;
  d += P.shade(P.rect(px, pt, pw, ph), 'stone', .36) + P.fill(P.arch(px + pw / 2 - 5, yB - 20, 10, 20), '#4a4238', { w: .5 });
  for (let k = 0; k < 4; k++) { const cx = px + 3 + k * (pw - 6) / 3; d += P.fill(`M${f(cx - 2.3)} ${f(yB)}L${f(cx - 1.9)} ${f(pt + 3)}H${f(cx + 1.9)}L${f(cx + 2.3)} ${f(yB)}Z`, 'stone', { w: .5 }) + P.shade(P.rect(cx + .6, pt + 3, 1.5, yB - pt - 3), 'stone', .2) + P.fill(P.rect(cx - 3, pt + 1.6, 6, 1.6), 'stone', { w: .35 }); }
  d += P.fill(P.rect(px - 2, pt - 4, pw + 4, 5.6), 'stone', { w: .5 });
  d += P.fill(P.gable(px - 3, pt - 4, pw + 6, 11), 'stone', { w: .6 }) + P.shade(P.gable(px + pw / 2, pt - 4, pw / 2 + 3, 11), 'stone', .14) + P.line(P.gable(px + 3, pt - 6, pw - 6, 6.5), 'stone2', .45);
  if (P.L.snow) d += P.flat(`M${f(px - 3)} ${f(pt - 4)}L${f(px + pw / 2)} ${f(pt - 15)}L${f(px + pw + 3)} ${f(pt - 4)}l-2 .4L${f(px + pw / 2)} ${f(pt - 13)}L${f(px - 1)} ${f(pt - 3.6)}Z`, '#f4f7fa');
  // a window either side of the portico
  const wx = left ? x0 + 4 : x1 - w * .2 + 2;
  d += P.windows(wx, top + 10, w * .14, (yB - top) * .55, 1, 2, { ww: .7, wh: .7, lit: .7 });
  return d;
}

/** The Quadriga from the front: four horses abreast rearing toward us, Victoria with her wings spread and the standard. */
function quadriga(P, cx, by) {
  const { f } = P, C = 'copper', dk = '#3b5f50';
  let d = '';
  // the chariot's rounded front between the middle pair, a wheel either side
  d += P.fill('M-8.4 0Q-10 -12.6 0 -13.6Q10 -12.6 8.4 0Z', C, { w: .55 }) + P.shade('M2 -13Q9 -12 8.4 0H4Z', C, .2) + P.line('M-6 -6.6Q0 -9 6 -6.6', dk, .5, { op: .8 });
  for (const k of [-1, 1]) d += `<ellipse cx="${k * 9.6}" cy="-5" rx="1.7" ry="5.2" fill="${P.dark(C, .3)}" stroke="${P.keyC()}" stroke-width=".45"/>`;
  // Victoria: her wings, her robe, a laurel crown, the standard with the oak wreath, the Iron Cross and the eagle
  for (const k of [-1, 1]) {
    d += P.fill(`M${k * 1.6} -22Q${k * 7} -31 ${k * 13} -36.4Q${k * 12.6} -29 ${k * 9.8} -22.4Q${k * 8} -18.6 ${k * 3} -17Z`, C, { w: .5 });
    d += P.line(`M${k * 4} -21.4l${k * 6.4} -6.6M${k * 4} -19.4l${k * 6.6} -4M${k * 4.4} -17.8l${k * 5} -1.4`, dk, .45, { op: .8 });
  }
  d += P.fill('M-3.6 -11L-2.7 -24.4Q0 -26.4 2.7 -24.4L3.6 -11Z', C, { w: .5 }) + P.lite('M-3 -12L-2.3 -23.4L-.7 -24L-.9 -12Z', C, .3);
  d += P.line('M-3 -16.4Q0 -15 3 -16.4M-2.6 -20Q0 -19 2.6 -20', dk, .4, { op: .7 });
  d += `<circle cy="-27.8" r="2.05" fill="${P.ink(C)}" stroke="${P.keyC()}" stroke-width=".45"/>` + P.line('M-2 -28.8Q0 -30.6 2 -28.8', dk, .6);
  d += P.line('M-2.4 -23L-6.4 -27.6', C, 1.5) + P.line('M2.4 -23L5 -19.6', C, 1.3);
  const sx = -7.2;
  d += P.line(`M${sx} -9V-46`, dk, .9);
  d += `<circle cx="${sx}" cy="-39.6" r="3.3" fill="none" stroke="${P.ink(C)}" stroke-width="1.3"/><path d="M${sx - 1.9} -39.6h3.8M${sx} -41.5v3.8" stroke="${P.ink('#26282a')}" stroke-width="1.4"/>`;
  d += P.fill(`M${sx} -44.6l-3.8 -2.8l1.5 -.2l-.6 -1.8l2.9 1.5l2.9 -1.5l-.6 1.8l1.5 .2Z`, C, { w: .4 });
  // the horses: the middle pair face us, the outer pair turn their heads away, a foreleg of each pawing the air
  for (const [x, t] of [[-16.4, -1], [-5.6, -.25], [5.6, .25], [16.4, 1]]) {
    d += P.line(`M${x - 1.7} -7L${x - 2 + t * .5} 0`, C, 1.5) + P.line(`M${x - 2.5 + t * .5} -.2h1.7`, '#22201e', .9);
    d += P.line(`M${x + 1.7} -7Q${x + 3.8 + t} -5.6 ${x + 2.8 + t} -2.6`, C, 1.5);
    d += P.fill(P.ellipse(x, -9.4, 4.2, 4), C, { w: .5 }) + P.lite(P.ellipse(x - 1.3, -10.4, 1.7, 2), C, .25);
    if (Math.abs(t) > .5) {
      // in profile: the neck arched, the head reaching out and down, the mane along the crest
      const k = Math.sign(t), X = (u) => x + k * u;
      d += P.fill(`M${X(-2.8)} -11.2Q${X(-3)} -19 ${X(1)} -24.2L${X(3.6)} -24.4Q${X(6.4)} -22 ${X(9.2)} -18.4Q${X(9.6)} -16.8 ${X(8.6)} -16.4Q${X(6.6)} -16.8 ${X(5)} -17.6Q${X(4.6)} -14 ${X(3.4)} -11Z`, C, { w: .5 });
      d += P.shade(`M${X(5)} -17.6Q${X(6.6)} -16.8 ${X(8.6)} -16.4Q${X(9.6)} -16.8 ${X(9.2)} -18.4L${X(6.2)} -19Z`, C, .25);
      d += P.line(`M${X(1)} -24Q${X(-2.6)} -19 ${X(-2.2)} -12.4`, dk, 1.2, { op: .9 }) + P.fill(`M${X(1.4)} -24.2l${k * -.6} -2.8l${k * 1.8} 2Z`, C, { w: .35 });
      d += `<circle cx="${X(4.2)}" cy="-21.6" r=".5" fill="${P.ink('#1e2420')}"/>` + P.line(`M${X(4.6)} -20.4L${X(8)} -17.6`, dk, .45, { op: .8 });
    } else {
      const hx = x + t * 2.4;
      d += P.fill(`M${x - 2.9} -10.6Q${x - 3.2} -17.6 ${hx - 1.8} -21.6L${hx + 2.1} -21.6Q${x + 3.2} -17.6 ${x + 2.9} -10.6Z`, C, { w: .5 });
      d += P.line(`M${hx + t * .4} -22.4Q${x + t * 1.6} -17 ${x + t * .6} -12.6`, dk, 1.1, { op: .9 });
      d += P.fill(`M${hx - 2.1} -22.6Q${hx - 2.5 + t} -17 ${hx - 1.3 + t * 1.6} -13.2H${hx + 1.3 + t * 1.6}Q${hx + 2.5 + t} -17 ${hx + 2.1} -22.6Q${hx} -24 ${hx - 2.1} -22.6Z`, C, { w: .5 });
      d += P.shade(`M${hx - 1.4 + t * 1.6} -15.6H${hx + 1.4 + t * 1.6}L${hx + 1.3 + t * 1.6} -13.2H${hx - 1.3 + t * 1.6}Z`, C, .3) + P.lite(`M${hx - 1.2} -22Q${hx - 1.4 + t} -18 ${hx - .6 + t} -16.4`, C, .3);
      d += P.fill(`M${hx - 1.8} -22.4l-.6 -2.8l1.4 1.6ZM${hx + 1.8} -22.4l.6 -2.8l-1.4 1.6Z`, C, { w: .35 });
    }
  }
  if (P.L.snow) d += P.flat('M-20 -13.4h40v1.4h-40Z', '#f4f7fa', { op: .7 });
  return `<g transform="translate(${f(cx)} ${f(by)}) scale(${Q})">${d}</g>`;
}

// ---------- the Königsplatz, over the trees ----------
function reichstag(P, cx, by) {
  const { f } = P;
  let d = '';
  const w = 84, top = by - 34;
  d += P.fill(P.rect(cx - w / 2, top, w, by - top), 'wall2') + P.windows(cx - w / 2 + 3, top + 6, w - 6, 18, 12, 2, { ww: .4, lit: .5 });
  d += P.fill(P.rect(cx - w / 2 - 1, top - 3, w + 2, 3), 'wall2', { w: .4 });
  // the portico on the west front, seen aslant
  d += P.fill(P.gable(cx - 16, top - 2, 30, 8), 'wall2', { w: .45 }) + P.columns(cx - 14, top + 22, 26, 22, 6, 'wall2');
  // corner towers
  for (const x of [cx - w / 2 - 2, cx + w / 2 - 8]) d += P.fill(P.rect(x, top - 14, 10, by - top + 14), 'wall2', { w: .5 }) + P.fill(P.rect(x - 1, top - 16, 12, 3), 'wall2', { w: .4 }) + P.windows(x + 2, top - 10, 6, 10, 1, 1, { ww: .6, lit: .3 }) + P.fill(P.dome(x + 5, top - 16, 4, 3), 'copper', { w: .4 });
  // the dome of glass and iron, square on its drum, the lantern and the crown
  d += P.fill(P.rect(cx - 15, top - 12, 30, 12), 'wall2', { w: .5 }) + P.windows(cx - 13, top - 10, 26, 8, 5, 1, { ww: .5, arched: true, lit: .3 });
  const dt = top - 36;
  d += P.fill(`M${cx - 15} ${top - 12}C${cx - 15} ${dt + 6} ${cx - 6} ${dt} ${cx} ${dt}C${cx + 6} ${dt} ${cx + 15} ${dt + 6} ${cx + 15} ${top - 12}Z`, 'glass', { w: .6 });
  for (const k of [-.66, -.33, 0, .33, .66]) d += P.line(`M${f(cx + k * 15)} ${top - 12}Q${f(cx + k * 13)} ${f(dt + 8)} ${cx} ${dt}`, '#7e8a90', .5);
  for (const t of [.35, .7]) d += P.line(`M${f(cx - 15 * (1 - t * .5))} ${f(top - 12 - (top - 12 - dt) * t)}H${f(cx + 15 * (1 - t * .5))}`, '#7e8a90', .45);
  d += P.lite(`M${cx - 13} ${top - 13}C${cx - 13} ${dt + 8} ${cx - 6} ${dt + 2} ${cx - 2} ${dt + 1}L${cx - 6} ${top - 13}Z`, 'glass', .25, { op: .5 });
  d += P.fill(P.rect(cx - 3, dt - 7, 6, 7), 'wall2', { w: .4 }) + P.fill(P.dome(cx, dt - 7, 3.4, 3), 'copper', { w: .4 }) + P.line(`M${cx} ${dt - 11}v-4`, 'gold', .8);
  return d;
}
function victoryColumn(P, cx, by) {
  const { f } = P;
  let d = '';
  const top = by - 92;
  d += P.fill(`M${cx - 3.4} ${by}L${cx - 2.8} ${top}H${cx + 2.8}L${cx + 3.4} ${by}Z`, 'stone', { w: .5 }) + P.shade(P.rect(cx + .8, top, 2.4, by - top), 'stone', .2);
  // three drums parted by rings of gilded cannon, the capital, the gilt Victoria with her wreath raised
  for (const y of [by - 30, by - 50, by - 70]) d += P.fill(P.rect(cx - 4, y - 2, 8, 4), 'gold', { w: .4 }) + P.line(`M${cx - 3} ${y - 4}v8M${cx} ${y - 4}v8M${cx + 3} ${y - 4}v8`, '#a07a24', .6);
  d += P.fill(P.rect(cx - 4.6, top - 2, 9.2, 2.6), 'stone', { w: .4 }) + P.fill(P.rect(cx - 2.4, top - 6, 4.8, 4), 'stone', { w: .4 });
  d += P.fill(`M${cx - 1.4} ${top - 6}L${cx - 1} ${top - 15}Q${cx} ${top - 16.4} ${cx + 1} ${top - 15}L${cx + 1.6} ${top - 6}Z`, 'gold', { w: .4 });
  d += P.fill(`M${cx - .6} ${top - 13}q-4 -4 -6 -3q2 3 5.6 4.4ZM${cx + .6} ${top - 13}q4 -4 6 -3q-2 3 -5.6 4.4Z`, 'gold', { w: .35 });
  d += `<circle cx="${cx}" cy="${f(top - 17)}" r="1.1" fill="${P.ink('gold')}"/>` + P.line(`M${cx + .8} ${top - 15}l2.2 -5`, 'gold', .7) + `<circle cx="${cx + 3.3}" cy="${f(top - 21)}" r="1.3" fill="none" stroke="${P.ink('gold')}" stroke-width=".6"/>`;
  return d;
}
/** A band of park trees: crowns in the season's leaves, or bare twigs in winter. tall(x) lifts the canopy here and there. */
function woods(P, x0, x1, by, seed, tall = () => 1) {
  const { f } = P, lf = P.L.leaf, r = P.rng(seed);
  let d = '';
  if (!lf.leaf) { // winter: a grey lacework of twigs
    let m = `M${x0} ${by}`;
    for (let x = x0; x <= x1 + 20; x += 18) m += `Q${f(x + 9)} ${f(by - (58 + r() * 22) * tall(x + 9))} ${f(x + 18)} ${f(by - (40 + r() * 14) * tall(x + 18))}`;
    d += P.flat(m + `V${by}Z`, '#8a7f74', { op: .55 });
    for (let x = x0; x < x1; x += 7 + r() * 6) { const h = (40 + r() * 24) * tall(x); d += P.line(`M${f(x)} ${by}q${f(r() * 6 - 3)} ${f(-h * .6)} ${f(r() * 8 - 4)} ${f(-h)}`, '#5b5148', .6, { op: .7 }); }
    return d;
  }
  let m = `M${x0} ${by}`;
  for (let x = x0; x <= x1 + 20; x += 20) m += `Q${f(x + 10)} ${f(by - (74 + r() * 26) * tall(x + 10))} ${f(x + 20)} ${f(by - (52 + r() * 18) * tall(x + 20))}`;
  d += P.fill(m + `V${by}Z`, lf.dark, { w: .6 });
  for (let i = 0; i < 34; i++) { const x = x0 + r() * (x1 - x0), y = by - (30 + r() * 40) * tall(x); d += `<path d="${P.blob(x, y, 9 + r() * 7, 6 + r() * 4, 7, seed + i)}" fill="${P.ink(i % 3 ? lf.leaf : lf.light)}" opacity=".85"/>`; }
  if (lf.bloom) for (let i = 0; i < 30; i++) { const x = x0 + r() * (x1 - x0), y = by - (34 + r() * 44) * tall(x); d += `<circle cx="${f(x)}" cy="${f(y)}" r="1.3" fill="${P.ink(lf.bloom)}"/>`; }
  return d;
}

// ---------- the square ----------
function garden(P, cx, cy, w, seed) {
  const { f } = P, lf = P.L.leaf, h = 9;
  let d = P.fill(P.ellipse(cx, cy, w / 2, h), lf.grass ?? '#8cae60', { w: .6 }) + P.shade(P.ellipse(cx, cy + 3, w / 2 - 4, h - 4), lf.grass ?? '#8cae60', .12, { op: .7 });
  // beds of geraniums in summer, a fountain in its basin in the middle
  if (lf.leaf) { const r = P.rng(seed); for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, q = .55 + r() * .3; d += `<circle cx="${f(cx + Math.cos(a) * w / 2 * q)}" cy="${f(cy + Math.sin(a) * h * q)}" r="1.4" fill="${P.ink(P.L.season === 'autumn' ? '#d08a2a' : '#c8343a')}"/>`; } }
  d += P.fill(P.ellipse(cx, cy, 9, 3), 'stone', { w: .5 }) + P.flat(P.ellipse(cx, cy, 7, 2), 'glass', { op: .8 });
  if (!P.L.snow) d += `<path d="M${cx} ${cy}q-.6 -7 0 -12q.6 5 0 12" fill="${P.light('#cfe2ec', .3)}" opacity=".8"/>` + P.line(`M${cx - 4} ${cy - 1}q4 -7 8 0`, '#e4eef2', .5, { op: .6 });
  // a low iron railing round it
  d += `<path d="${P.ellipse(cx, cy + 1, w / 2 + 2, h + 1.5)}" fill="none" stroke="${P.ink('iron')}" stroke-width=".7" stroke-dasharray="1 1.6"/>`;
  return d;
}
function candelabra(P, x, by, s) {
  const { f } = P, c = 'iron', S = (n) => n * s;
  let d = P.fill(`M${f(x - S(5))} ${f(by)}h${f(S(10))}l${f(S(-2))} ${f(S(-9))}h${f(S(-6))}Z`, c, { w: .6 });
  d += P.fill(`M${f(x - S(1.8))} ${f(by - S(9))}L${f(x - S(1.1))} ${f(by - S(80))}H${f(x + S(1.1))}L${f(x + S(1.8))} ${f(by - S(9))}Z`, c, { w: .5 });
  for (const y of [by - S(30), by - S(62)]) d += P.fill(P.rect(x - S(2.6), y, S(5.2), S(2.4)), c, { w: .4 });
  d += P.lamp(x, by, s, 'iron', { c: P.pal.iron, h: 84 });
  return d;
}

// ---------- the houses round the square ----------
function sideFront(o) {
  const k = o.k ?? 1.3, g = (u) => u * (1 + k) / (1 + k * u);
  const q = (u, v) => { const t = g(u), top = o.t0 + (o.t1 - o.t0) * t, bot = o.b0 + (o.b1 - o.b0) * t; return [o.x0 + (o.x1 - o.x0) * t, top + (bot - top) * v]; };
  return q;
}
function adlon(P) {
  const { f } = P;
  // the front runs from x 14 (near, its top behind the title) to x 92 (far), where the next palace takes over
  const q = sideFront({ x0: 12, x1: 96, t0: -24, t1: 178, b0: 378, b1: 300, k: 1.1 });
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = '';
  // the palace beyond it, lower, toward the gate
  const q2 = sideFront({ x0: 96, x1: 118, t0: 196, t1: 222, b0: 300, b1: 296, k: .4 });
  s += P.fill(P.poly([q2(0, 0), q2(1, 0), q2(1, 1), q2(0, 1)]), 'wall2') + P.shade(P.poly([q2(.8, 0), q2(1, 0), q2(1, 1), q2(.8, 1)]), 'wall2', .14);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const u0 = .1 + c * .3, v0 = .1 + r * .2, lit = P.wr() < P.L.windows, tone = P.wr(); s += `<path d="${P.poly([q2(u0, v0), q2(u0 + .14, v0), q2(u0 + .14, v0 + .1), q2(u0, v0 + .1)])}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`; }
  s += P.fill(P.poly([q2(0, 0), q2(1, 0), [q2(1, 0)[0], q2(1, 0)[1] - 6], [q2(0, 0)[0], q2(0, 0)[1] - 9]]), 'roof', { w: .5 });
  // the hotel: its mansard, five floors, a balcony, the sign, the café's awnings on the square
  s += P.fill(quad(0, 0, 1, 1), 'wall') + P.stipple(quad(0, 0, 1, 1), 'wall', 50, { box: [12, 0, 90, 380], op: .2 });
  s += P.shade(quad(.9, 0, 1, 1), 'wall', .14);
  s += P.fill(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0] + 2, q(1, 0)[1] - 10], [q(0, 0)[0] + 4, q(0, 0)[1] - 30]]), 'roof');
  const floors = [.08, .23, .37, .5, .63], cols = 6;
  for (const [ri, v0] of floors.entries()) {
    s += P.fill(quad(0, v0 - .022, 1, v0 - .012), 'wall3', { w: .4 });
    for (let c = 0; c < cols; c++) {
      const u0 = .06 + c * .16, u1 = u0 + .085, v1 = v0 + (ri === 1 ? .1 : .085), lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".8"/>`;
      s += P.fill(P.poly([q(u0 - .015, v0 - .004), q((u0 + u1) / 2, v0 - .026), q(u1 + .015, v0 - .004)]), 'wall3', { w: .4 });
      if (ri === 1) s += P.line(`M${f(q(u0 - .02, v1)[0])} ${f(q(u0 - .02, v1)[1])}L${f(q(u1 + .02, v1)[0])} ${f(q(u1 + .02, v1)[1])}`, '#2c2b2a', 1.3);
    }
  }
  // awnings over the café's windows on the ground floor
  for (let c = 0; c < 5; c++) {
    const u0 = .04 + c * .19, u1 = u0 + .15;
    s += `<path d="${quad(u0, .78, u1, .95)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#4a3a2c')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
    for (let i = 0; i < 4; i++) { const a = u0 + (u1 - u0) * i / 4, b = u0 + (u1 - u0) * (i + 1) / 4; s += P.flat(P.poly([q(a, .74), q(b, .74), [q(b, .79)[0] + 4, q(b, .79)[1]], [q(a, .79)[0] + 4, q(a, .79)[1]]]), i % 2 ? '#efe8d6' : '#a8342e'); }
    s += P.line(P.poly([q(u0, .74), q(u1, .74), [q(u1, .79)[0] + 4, q(u1, .79)[1]], [q(u0, .79)[0] + 4, q(u0, .79)[1]]]), null, .5);
  }
  if (P.L.snow) s += P.flat(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0] + 2, q(1, 0)[1] - 4], [q(0, 0)[0] + 4, q(0, 0)[1] - 12]]), '#f4f7fa', { op: .9 });
  // flags and bills, in the crisis
  s += P.wall(f(q(.7, .7)[0]), f(q(.7, .7)[1]), 7, 10) + P.flagAt(f(q(.3, .2)[0]), f(q(.3, .2)[1])) + P.flagAt(f(q(.62, .34)[0]), f(q(.62, .34)[1]));
  return s;
}
function northSide(P) {
  const { f } = P;
  // the corner of the north side, lower, its front running back to the gatehouse
  const q = sideFront({ x0: 600, x1: 526, t0: 150, t1: 222, b0: 372, b1: 300, k: .9 });
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = P.fill(quad(0, 0, 1, 1), 'wall3') + P.shade(quad(0, 0, 1, 1), 'wall3', .1, { op: .6 });
  s += P.fill(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 8], [q(0, 0)[0], q(0, 0)[1] - 16]]), 'roof');
  for (const v0 of [.1, .3, .5]) for (let c = 0; c < 4; c++) {
    const u0 = .1 + c * .22, u1 = u0 + .1, lit = P.wr() < P.L.windows, tone = P.wr();
    s += `<path d="${quad(u0, v0, u1, v0 + .1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".7"/>`;
  }
  s += P.fill(quad(0, .72, 1, .76), 'wall2', { w: .4 });
  if (P.L.snow) s += P.flat(P.poly([q(0, 0), q(1, 0), [q(1, 0)[0], q(1, 0)[1] - 4], [q(0, 0)[0], q(0, 0)[1] - 8]]), '#f4f7fa', { op: .9 });
  s += P.flagAt(f(q(.42, .3)[0]), f(q(.42, .3)[1])) + P.wall(f(q(.3, .8)[0]), f(q(.3, .8)[1]), 8, 11);
  return s;
}

// ---------- people and things ----------
/** A man in Prussian blue under a spiked helmet: a sentry of the Guard, or a Schutzmann. */
function guard(P, x, y, s, o = {}) {
  const { f } = P, top = y - 30 * s, hy = top + 2.8 * s;
  let d = P.person(x, y, s, 'gent', { c: o.police ? '#26365a' : 'prussian', legs: '#1c1f2a', hat: '#1b1b1f' });
  d += P.line(`M${f(x)} ${f(hy - 2)}v${f(-2.8 * s)}`, 'gold', .9 * s) + `<path d="M${f(x - 2.6 * s)} ${f(hy + .4 * s)}h${f(5.2 * s)}" stroke="${P.ink('gold')}" stroke-width="${f(.5 * s)}"/>`;
  if (o.rifle) d += P.line(`M${f(x + 2.4 * s)} ${f(y - 2 * s)}L${f(x + 3 * s)} ${f(top - 4 * s)}`, '#3b2c1e', 1.1 * s);
  if (o.police) d += `<circle cx="${f(x)}" cy="${f(y - 21 * s)}" r="${f(.6 * s)}" fill="${P.ink('gold')}"/><circle cx="${f(x)}" cy="${f(y - 18 * s)}" r="${f(.6 * s)}" fill="${P.ink('gold')}"/>`;
  return d;
}
function sentryBox(P, x, by) {
  const { f } = P, w = 8, h = 19;
  let d = P.fill(P.rect(x - w / 2, by - h, w, h), '#f2efe6', { w: .5 });
  const id = `${P.uid}sb${P._st++}`;
  let stripes = '';
  for (let k = -3; k < 8; k++) stripes += `<path d="M${f(x - w / 2)} ${f(by - h + k * 4)}l${w} -4v2.2l${-w} 4Z" fill="${P.ink('#1d1d20')}"/>`;
  d += `<clipPath id="${id}"><path d="${P.rect(x - w / 2, by - h, w, h)}"/></clipPath><g clip-path="url(#${id})">${stripes}</g>`;
  d += P.fill(P.rect(x - w / 2 + 1.6, by - h + 4, w - 3.2, h - 5), '#3a3430', { w: .4 }) + P.fill(P.gable(x - w / 2 - 1.2, by - h, w + 2.4, 5), '#2a2a2c', { w: .45 });
  return d;
}
function officer(P, x, by, s) {
  const { f } = P, X = (k) => f(x + k * s), Y = (k) => f(by - k * s);
  let d = P.figure(x, by, s, 'gent', { c: '#24375f', legs: '#20253a', hat: '#1b1b1f', arm: 19 });
  // the sabre at his hip, steel over the cane; a red stripe down the trousers; silver on the shoulders
  d += `<path d="M${X(-13)} ${Y(46)}L${X(-19)} ${Y(4)}" stroke="${P.ink('#9aa2a8')}" stroke-width="${f(2 * s)}" stroke-linecap="round"/><path d="M${X(-13)} ${Y(46)}L${X(-19)} ${Y(4)}" stroke="${P.keyC()}" stroke-width=".4" fill="none"/>`;
  d += `<path d="M${X(-4.6)} ${Y(40)}L${X(-7.6)} ${Y(3)}M${X(4.4)} ${Y(30)}L${X(7.6)} ${Y(3)}" stroke="${P.ink('#b3302c')}" stroke-width="${f(.9 * s)}"/>`;
  d += `<path d="M${X(-12)} ${Y(83)}q4 -1.6 7 0M${X(12)} ${Y(83)}q-4 -1.6 -7 0" stroke="${P.ink('#d8dade')}" stroke-width="${f(1.8 * s)}" fill="none"/>`;
  // the spiked helmet over the hat: its neck-guard, the dome, the spike
  d += `<path d="M${X(-9.4)} ${Y(96.4)}Q${X(0)} ${Y(94)} ${X(9.4)} ${Y(96.4)}L${X(7)} ${Y(99.4)}Q${X(7.4)} ${Y(109.6)} ${X(0)} ${Y(110)}Q${X(-7.4)} ${Y(109.6)} ${X(-7)} ${Y(99.4)}Z" fill="${P.ink('#1b1b1f')}" stroke="${P.keyC()}" stroke-width=".8"/>`;
  d += `<path d="M${X(-4)} ${Y(106)}q4 -2.4 8 0" stroke="${P.light('#1b1b1f', .35)}" stroke-width="${f(.9 * s)}" fill="none"/><path d="M${X(-1.6)} ${Y(109.6)}h${f(3.2 * s)}l${f(-.6 * s)} ${f(-1.6 * s)}h${f(-2 * s)}Z" fill="${P.ink('gold')}"/><path d="M${X(0)} ${Y(111)}V${Y(118)}" stroke="${P.ink('gold')}" stroke-width="${f(1.3 * s)}" stroke-linecap="round"/>`;
  return d;
}
function hoop(P, x, y, s) {
  const { f } = P;
  return `<ellipse cx="${f(x + 6 * s)}" cy="${f(y - 6 * s)}" rx="${f(4.4 * s)}" ry="${f(6 * s)}" fill="none" stroke="${P.ink('#8a6a3a')}" stroke-width="${f(1 * s)}"/>` + P.line(`M${f(x + 1 * s)} ${f(y - 14 * s)}L${f(x + 6 * s)} ${f(y - 9 * s)}`, '#5a4a3a', .8 * s);
}
/** The Litfaß column: a drum pasted round with bills, a fluted cap and a finial. */
function litfass(P, x, by, s) {
  const { f } = P, r = 14 * s, top = by - 8 - 96 * s, paper = 'column';
  let d = P.fill(P.rect(x - r - 2.5, by - 8, 2 * r + 5, 8), 'iron', { w: .6 }) + P.lite(P.rect(x - r - 2.5, by - 8, 2 * r + 5, 1.4), 'iron', .25);
  d += P.fill(P.rect(x - r, top, 2 * r, by - 8 - top), paper);
  // the bills: wrapped round the drum, narrower toward its edges
  const bills = [
    [top + 6, 30, [['#c2382c', 'ODOL', '#f6efe0'], ['#e8c43c', 'MAGGI', '#7a2a1a'], ['#2d4f8a', 'SEKT', '#f2e6c4']]],
    [top + 40, 26, [['#f0e8d0', 'KONZERT', '#2a2622'], ['#3a6a44', 'PERSIL', '#f4ecd4'], ['#d9a23a', 'ZOO', '#2a2622']]],
    [top + 70, 18, [['#e8dcc0', 'THEATER', '#8a2a24'], ['#9a2f40', 'WINTERGARTEN', '#f4ead2'], ['#efe2c6', 'APOLLO', '#24375f']]],
  ];
  for (const [y, h, row] of bills) {
    const xs = [x - r, x - r * .5, x + r * .4, x + r];
    row.forEach(([c, t, ink], i) => {
      const x0 = xs[i] + .6, x1 = xs[i + 1] - .6, w = x1 - x0;
      d += P.fill(P.rect(x0, y, w, h), c, { w: .4 });
      d += `<text x="${f((x0 + x1) / 2)}" y="${f(y + h * .42)}" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="${f(Math.min(6.4, h * .3) * s)}" text-anchor="middle" fill="${P.ink(ink)}" textLength="${f(w * .8)}" lengthAdjust="spacingAndGlyphs">${t}</text>`;
      d += P.line(`M${f(x0 + w * .15)} ${f(y + h * .62)}h${f(w * .7)}M${f(x0 + w * .15)} ${f(y + h * .78)}h${f(w * .5)}`, ink, .5, { op: .6 });
    });
  }
  // the drum's roundness: a lit band, the turning side in shade
  d += P.lite(P.rect(x - r * .7, top, r * .35, by - 8 - top), paper, .3, { op: .35 }) + P.shade(P.rect(x + r * .45, top, r * .55, by - 8 - top), paper, .3, { op: .55 });
  d += P.line(P.rect(x - r, top, 2 * r, by - 8 - top), null, .8);
  // the cap: a ring, a fluted dome, a finial
  d += P.fill(P.rect(x - r - 3, top - 5, 2 * r + 6, 5), 'iron', { w: .6 }) + P.lite(P.rect(x - r - 3, top - 5, 2 * r + 6, 1.2), 'iron', .3);
  d += P.fill(`M${f(x - r - 1)} ${f(top - 5)}Q${f(x - r)} ${f(top - 20 * s)} ${f(x)} ${f(top - 24 * s)}Q${f(x + r)} ${f(top - 20 * s)} ${f(x + r + 1)} ${f(top - 5)}Z`, 'iron', { w: .6 });
  for (const k of [-.6, -.25, .1, .45]) d += P.line(`M${f(x + k * r)} ${f(top - 5)}Q${f(x + k * r * .8)} ${f(top - 16 * s)} ${f(x)} ${f(top - 24 * s)}`, P.light(P.pal.iron, .3), .5, { op: .6 });
  d += P.line(`M${f(x)} ${f(top - 24 * s)}v${f(-6 * s)}`, 'iron', 1.4 * s) + `<circle cx="${f(x)}" cy="${f(top - 31 * s)}" r="${f(1.8 * s)}" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".5"/>`;
  if (P.L.snow) d += P.flat(`M${f(x - r - 1)} ${f(top - 5)}Q${f(x - r)} ${f(top - 20 * s)} ${f(x)} ${f(top - 24 * s)}Q${f(x + r)} ${f(top - 20 * s)} ${f(x + r + 1)} ${f(top - 5)}Q${f(x)} ${f(top - 14 * s)} ${f(x - r - 1)} ${f(top - 5)}Z`, '#f4f7fa', { op: .9 });
  // where the crisis pastes its bill or its poster
  d += P.wall(x - 9, top + 34, 13, 18);
  return d;
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
