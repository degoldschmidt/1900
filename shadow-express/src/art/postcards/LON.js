// London from the Albert Embankment: the Houses of Parliament across the Thames, the Clock Tower keeping the game's
// time, Westminster Bridge with an omnibus on it, steamers, a sailing barge and a tug on the river, plane trees and
// the dolphin lamps along the wall, gulls overhead.

export default {
  id: 'LON',
  greet: 'GREETINGS from LONDON',
  nation: 'GB',
  flag: 'GB',
  flower: 'tudor-rose',
  flower2: 'bluebell',
  frame: { band: ['#4a64a0', '#1b2a58'], gold: '#d9b45a', ink: '#8a1d24', leaf: ['#6f9c55', '#2f5a36'], year: '#7a2a24', halo: '#f6ead0' },
  horizon: 262,
  clouds: 5,
  wind: -1,
  birds: { c: '#f6f5ef', n: 4, y: 120, s: 1.1 },
  pal: {
    key: '#2a2724', stone: '#dcc38c', stone2: '#b99c66', wall: '#d5c9b2', wall2: '#c4513e', slate: '#56606e', water: '#5e8290',
    bridge: '#5f8a70', granite: '#a8a296', ground: '#cdc3ab', iron: '#26332e', glass: '#3a4656', sash: '#ece4d0', gold: '#d4a73a',
  },

  // a Tudor rose: five red petals over five white, gold at the heart, green barbs between
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(24, 10, 215, I.leaf[1], { shape: 'oval' }) + F.leaf(22, 9, 145, I.leaf[0], { shape: 'oval' }) + F.leaf(18, 8, 260, I.leaf[0], { shape: 'serrate' });
    s += F.radial(5, 8, 3.4, I.leaf[1], { rot: 36, shape: 'point' }).replace(/<g transform="rotate\(([-\d.]+)\)">/g, (m, a) => `<g transform="rotate(${a}) translate(0 -13)">`);
    s += F.radial(5, 15, 15, '#c0262c', { shape: 'notch', lite: '#e0545a' });
    s += F.radial(5, 9.5, 9, '#f6f1e6', { rot: 36, shape: 'notch' });
    s += F.disc(3.6, '#e2b23a', { dots: '#a8781e', n: 7 });
    return s;
  },
  // bluebells nodding on a bent stem
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(22, 4, 200, I.leaf[1], { shape: 'lance' }) + F.leaf(20, 4, 165, I.leaf[0], { shape: 'lance' });
    s += F.stem('M0 4Q2 -12 12 -16', I.leaf[1], 1.1);
    for (const [x, y, a] of [[3, -5, 20], [6, -11, 35], [10, -15, 60], [13, -16, 85]]) s += F.at(x, y, F.bell(5.6, 7, '#5a6fc4', { lite: '#8a9ce0' }), a);
    return s;
  },

  back(P, T) {
    let s = '';
    // the town beyond the river, smoky and blue
    s += P.far(.72, () => P.row(26, 600, 252, { hMin: 10, hMax: 26, wMin: 14, wMax: 30, style: 'north', seed: 5, walls: ['#c9bfae', '#b9ae9c', '#d3c7b3'], roofC: '#6a707a', placard: false, flagSpot: false }));
    s += P.smoke(70, 236, .9, { dark: true }) + P.smoke(512, 230, 1, { dark: true }) + P.smoke(292, 238, .7);
    // the Abbey's two west towers behind
    s += P.far(.56, () => { let d = ''; for (const x of [168, 190]) d += P.fill(P.rect(x, 172, 14, 70), 'stone') + P.shade(P.rect(x + 9, 172, 5, 70), 'stone', .2) + P.fill(P.rect(x - 1, 168, 16, 5), 'stone2', { w: .4 }) + pinnacles(P, x, 168, 14, 4, 8) + P.fill(P.gothic(x + 4, 186, 6, 18), 'glass'); return d; });
    // New Scotland Yard, banded red and white, beyond the bridge
    s += P.far(.42, () => {
      let d = P.fill(P.rect(424, 208, 84, 48), 'wall2');
      for (let k = 0; k < 8; k++) d += P.flat(P.rect(424, 212 + k * 6, 84, 2), '#efe6d4');
      d += P.windows(428, 212, 76, 40, 9, 4, { ww: .4 });
      for (const x of [424, 508]) d += P.fill(P.rect(x - 5, 202, 10, 56), 'wall2') + P.fill(P.spire(x, 203, 12, 14), 'slate');
      d += P.fill(P.poly([[420, 209], [428, 196], [504, 196], [512, 209]]), 'slate');
      return d;
    });
    // the Houses of Parliament: the Victoria Tower, the long river front, the central spire
    s += P.far(.28, () => parliament(P));
    // the Clock Tower
    s += P.far(.18, () => clockTower(P, 380, 262, 86));
    // the river, holding their reflections
    s += P.water(262, 342, { seed: 4, shimmer: 9, x0: 40, x1: 560 });
    s += reflect(P, 110, 400, 264, 22, '#c9b27a', 5) + reflect(P, 368, 394, 264, 58, '#c9b27a', 9) + reflect(P, 110, 150, 264, 44, '#c9b27a', 8);
    // boats on the water, behind the bridge's piers
    s += P.cross(T.steamer({ s: .62, dir: -1, hull: '#262a30', house: '#f1ece0', funnel: ['#c8492e', '#1d1a17'], paddle: false }), { y: 304, dir: -1, dur: 74, rest: .25, offset: 20 });
    s += P.cross(T.sail({ s: .72, rig: 'sprit', sailC: '#a8553a', hull: '#3a2a20', dir: 1 }), { y: 286, dir: 1, dur: 150, offset: 60 });
    s += P.cross(T.tug({ s: .6, dir: 1 }), { y: 324, dir: 1, dur: 58, rest: .4, offset: 5 });
    return s;
  },

  mid(P, T) {
    let s = bridge(P);
    // the bridge's deck is the street: an omnibus goes over to Westminster, a hansom comes back
    s += P.mover(T.omnibus({ s: 1.02, dir: -1, adText: 'PEARS SOAP' }), { path: [[618, 284, 1, 0], [402, 252.5, .5, .62, 1], [398, 251.8, .49, .64, 0], [398, 251.8, .49, 1, 0]], dur: 36, offset: 4 });
    s += P.mover(T.fiacre({ s: .9, dir: 1, horses: 1, body: '#1d2a22', hood: '#262420' }), { path: [[398, 251.5, .5, 0, 0], [404, 252.6, .52, .04, 1], [618, 285, 1, .7], [618, 285, 1, 1]], dur: 44, offset: 26 });
    return s;
  },

  front(P, T) {
    let s = '';
    // a plane tree leaning over the wall
    s += P.tree(44, 346, 2.4, 'plane');
    // the Embankment wall, its lamps, the promenade
    s += P.fill('M14 330H586V348H14Z', 'granite') + P.lite('M14 330H586V333H14Z', 'granite', .3) + P.shade('M14 343H586V348H14Z', 'granite', .2);
    for (let x = 30; x < 586; x += 36) s += P.line(`M${x} 333V343`, '#7a766c', .5, { op: .6 });
    s += P.paving(348, 384, { c: 'ground', vx: 300, seed: 3 });
    for (const x of [128, 300, 470]) s += dolphinLamp(P, x, 332, .95);
    s += P.wall(186, 334.5, 9, 12) + P.wall(398, 334.5, 9, 12);
    // a bench and the people who stroll here
    s += P.fill('M196 366h44v-2h-44Z', '#5b4532', { w: .5 }) + P.line('M200 366v6M236 366v6M198 358h40', '#3a2a1e', 1);
    s += P.crowd(206, 236, 366, 2, { s: .78, seed: 3, kinds: ['gent', 'lady'] });
    s += P.person(520, 376, 1.1, 'gent', { c: '#2a2c34', hat: '#1b1b20' }) + bobby(P, 548, 378, 1.12);
    s += P.person(88, 362, 1, 'lady', { c: '#c9d6e6', parasol: '#f2e2e6', dir: 1 }) + P.person(98, 362, .98, 'boater', { c: '#3d4a3c', dir: -1 }) + P.person(352, 360, .9, 'child', { c: '#b9322c' }) + P.person(364, 362, 1, 'lady', { c: '#efe3c3', dir: -1 });
    s += P.person(436, 362, .96, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(270, 364, 1, 'newsboy', { c: '#5a4a3a' });
    s += P.setStreet(376, 26, 574, 1.05);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.05, dir: 1, seed: 7 }), { y: 378, dir: 1, dur: 72, offset: 10, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['lady', 'child'], s: 1.08, dir: -1, seed: 12, dresses: ['#c9d6e6', '#f3eee2'] }), { y: 382, dir: -1, dur: 84, offset: 44, z: 'fore' });
    return s;
  },
};

// ---------- Westminster ----------
/** A reflection: broken strokes of a building's colour under it, thinning and breaking up with distance. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`;
}
function pinnacles(P, x, y, w, n, h) {
  let d = '';
  for (let i = 0; i <= n; i++) { const px = x + w * i / n; d += P.fill(P.spire(px, y + .5, 2.6, h), 'stone2', { w: .35 }); }
  return d;
}
function parliament(P) {
  const { f } = P;
  let s = '';
  // the long front: bays between turrets, two storeys of tall windows, a parapet of pinnacles
  const x0 = 150, x1 = 366, top = 214, by = 262;
  s += P.fill(P.poly([[x0, top - 4], [x0 + 6, top - 12], [x1 - 6, top - 12], [x1, top - 4]]), 'slate');
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'stone') + P.stipple(P.rect(x0, top, x1 - x0, by - top), 'stone', 90, { box: [x0, top, x1 - x0, by - top], op: .3 });
  for (let x = x0 + 4; x < x1 - 6; x += 12) {
    for (const [y, h] of [[top + 6, 13], [top + 24, 13]]) s += `<path d="${P.gothic(x + 2, y, 5.4, h)}" fill="${P.ink('glass')}"/>`;
    s += P.line(`M${x} ${top}V${by - 6}`, 'stone2', .7);
  }
  for (let x = x0; x <= x1; x += 24) s += P.fill(P.rect(x - 2.5, top - 10, 5, by - top + 10), 'stone2', { w: .45 }) + P.fill(P.spire(x, top - 9.5, 5, 12), 'stone2', { w: .4 });
  s += pinnacles(P, x0, top, x1 - x0, 36, 5);
  // the terrace on the river
  s += P.fill(P.rect(x0 - 40, by - 6, x1 - x0 + 46, 6), 'stone2', { w: .5 });
  // the central spire
  s += P.fill(P.rect(224, top - 34, 14, 24), 'stone') + P.fill(P.spire(231, top - 33, 16, 40), 'stone2') + P.line(`M231 ${top - 73}v-6`, 'gold', 1);
  s += P.fill(P.gothic(228, top - 30, 6, 16), 'glass');
  // the Victoria Tower, with its flag
  const vx = 110, vw = 40, vt = 108;
  s += P.fill(P.rect(vx, vt, vw, by - vt), 'stone') + P.shade(P.rect(vx + vw * .66, vt, vw * .34, by - vt), 'stone', .2) + P.stipple(P.rect(vx, vt, vw, by - vt), 'stone', 50, { box: [vx, vt, vw, by - vt], op: .3 });
  for (let k = 0; k < 4; k++) s += P.fill(P.gothic(vx + 9, vt + 14 + k * 30, 8, 22), 'glass') + P.fill(P.gothic(vx + 23, vt + 14 + k * 30, 8, 22), 'glass');
  s += P.fill(P.arch(vx + 12, by - 30, 16, 30), '#2a2a2e');
  for (const x of [vx, vx + vw - 7]) s += P.fill(P.rect(x, vt - 10, 7, by - vt + 10), 'stone2', { w: .5 }) + P.fill(P.spire(x + 3.5, vt - 9.5, 8, 16), 'stone2');
  s += pinnacles(P, vx + 7, vt, vw - 14, 5, 6);
  s += P.flag(vx + vw / 2, vt, 1.15, 'GB', { h: 24 });
  return s;
}
function clockTower(P, cx, base, tip) {
  const { f } = P;
  let s = '';
  const w = 28, clockY = 160, cs = 140, bel = 120; // the clock stage from cs to cs + 38, the belfry from bel to cs
  // the shaft, panelled
  s += P.fill(P.rect(cx - w / 2, cs + 36, w, base - cs - 36), 'stone') + P.shade(P.rect(cx + w * .2, cs + 36, w * .3, base - cs - 36), 'stone', .2);
  s += P.stipple(P.rect(cx - w / 2, cs + 36, w, base - cs - 36), 'stone', 40, { box: [cx - w / 2, cs + 36, w, base - cs - 36], op: .3 });
  for (const k of [-.3, 0, .3]) s += P.line(`M${f(cx + k * w)} ${cs + 40}V${base - 4}`, 'stone2', .6);
  for (let y = cs + 48; y < base - 10; y += 14) s += P.fill(P.gothic(cx - 2.5, y, 5, 9), 'glass');
  // the clock stage, a little wider, gilded round the face
  s += P.fill(P.rect(cx - w / 2 - 2, cs, w + 4, 38), 'stone') + P.shade(P.rect(cx + w * .25, cs, w * .3, 38), 'stone', .2);
  s += P.fill(P.rect(cx - 13, cs + 6, 26, 26), 'gold', { w: .5 });
  s += P.clock(cx, clockY - 1, 10.4, { tz: -60, face: '#f3eedc', rim: '#2a2622' });
  for (const k of [-1, 1]) s += P.fill(P.spire(cx + k * (w / 2 + 1), cs + 1, 4, 10), 'stone2', { w: .4 });
  // the belfry and its gallery
  s += P.fill(P.rect(cx - w / 2 + 1, bel, w - 2, cs - bel), 'stone') + P.fill(P.rect(cx - w / 2 - 1, cs - 2, w + 2, 3), 'stone2', { w: .4 });
  for (let k = 0; k < 4; k++) s += P.fill(P.gothic(cx - 11 + k * 6, bel + 3, 4, 13), '#2a2a30');
  // the roof: steep, slate, ribbed in gold, with lucarnes and corner pinnacles
  s += P.fill(`M${cx - 15} ${bel}L${cx} ${tip}L${cx + 15} ${bel}Z`, 'slate') + P.shade(`M${cx} ${tip}L${cx + 15} ${bel}H${cx + 2}Z`, 'slate', .25);
  s += P.line(`M${cx - 7} ${bel}L${cx} ${tip}M${cx + 7} ${bel}L${cx} ${tip}`, 'gold', .8);
  s += P.fill(P.gable(cx - 6, bel - 8, 12, 6), 'stone2', { w: .35 });
  for (const k of [-1, 1]) s += P.fill(P.spire(cx + k * 14, bel, 5, 18), 'gold', { w: .4 });
  s += P.line(`M${cx} ${tip}v-6M${cx - 2} ${tip - 3.5}h4`, 'gold', 1.1);
  return s;
}
function bridge(P) {
  const { f } = P;
  // the deck from the Clock Tower's foot (far, u 0) to the near bank (u 1): perspective grows toward us
  const at = (u) => ({ x: 396 + 214 * u, top: 249 + 34 * u, deck: 7 + 11 * u, water: 262 + 62 * u });
  const N = 24, top = [], under = [];
  for (let i = 0; i <= N; i++) { const p = at(i / N); top.push([p.x, p.top]); under.push([p.x, p.top + p.deck]); }
  // the piers and arches, cut through so the river shows behind
  let d = `M${f(at(0).x)} ${f(at(0).top + at(0).deck)}`;
  for (const p of under.slice(1)) d += `L${f(p[0])} ${f(p[1])}`;
  d += `L${f(at(1).x)} ${f(at(1).water + 8)}L${f(at(0).x)} ${f(at(0).water + 1)}Z`;
  const piers = [0, .13, .28, .45, .65, .88];
  let holes = '';
  for (let i = 0; i < piers.length - 1; i++) {
    const a = at(piers[i]), b = at(piers[i + 1]), pw = 3 + 6 * piers[i + 1];
    const ax = a.x + pw * .5, bx = b.x - pw * .5, ay = a.water, by = b.water, cy = Math.min(at((piers[i] + piers[i + 1]) / 2).top + at((piers[i] + piers[i + 1]) / 2).deck + 2, (ay + by) / 2);
    holes += `M${f(ax)} ${f(ay)}C${f(ax)} ${f(cy - 2)} ${f(bx)} ${f(cy - 2)} ${f(bx)} ${f(by)}Z`;
  }
  let s = `<path d="${d}${holes}" fill="${P.ink('bridge')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width=".8"/>`;
  s += `<path d="${holes}" fill="none" stroke="${P.dark('bridge', .3)}" stroke-width="1.4"/>`;
  // granite piers standing in the water
  for (const u of piers.slice(1, -1)) { const p = at(u), pw = 3 + 6 * u; s += P.fill(P.rect(p.x - pw / 2, p.top + p.deck - 2, pw, p.water - p.top - p.deck + 4), 'granite', { w: .5 }); }
  // the deck's edge and parapet, with lamps along it
  let rail = `M${f(top[0][0])} ${f(top[0][1])}`;
  for (const p of top.slice(1)) rail += `L${f(p[0])} ${f(p[1])}`;
  for (let i = N; i >= 0; i--) rail += `L${f(under[i][0])} ${f(under[i][1] - (at(i / N).deck * .55))}`;
  s += P.fill(rail + 'Z', 'bridge') + P.lite(rail + 'Z', 'bridge', .15, { op: .5 });
  for (let i = 0; i <= 16; i++) { const p = at(i / 16); s += P.line(`M${f(p.x)} ${f(p.top + 1)}v${f(p.deck * .4)}`, '#2f4a3c', .5, { op: .7 }); }
  for (const u of [.12, .36, .62, .92]) { const p = at(u); s += P.far(.2 - u * .2, () => P.lamp(p.x, p.top + 1, .45 + u * .55, 'iron', { c: '#2b3a32', h: 46 })); }
  return s;
}
function dolphinLamp(P, x, by, s) {
  const { f } = P;
  let d = '';
  // two dolphins twined about the foot of the column
  for (const k of [-1, 1]) d += `<path d="M${f(x)} ${f(by - 2)}q${f(k * 7 * s)} ${f(-2 * s)} ${f(k * 6 * s)} ${f(-9 * s)}q${f(-k * 1 * s)} ${f(-4 * s)} ${f(-k * 4 * s)} ${f(-3 * s)}q${f(k * 3 * s)} ${f(2 * s)} ${f(k * 1 * s)} ${f(6 * s)}" fill="${P.ink('iron')}" stroke="${P.keyC()}" stroke-width=".5"/>`;
  d += P.fill(P.rect(x - 2.4 * s, by - 16 * s, 4.8 * s, 3 * s), 'iron', { w: .4 });
  d += P.fill(`M${f(x - 1.6 * s)} ${f(by - 14 * s)}L${f(x - 1.1 * s)} ${f(by - 50 * s)}H${f(x + 1.1 * s)}L${f(x + 1.6 * s)} ${f(by - 14 * s)}Z`, 'iron', { w: .5 });
  d += P.lamp(x, by - 46 * s, s * .9, 'globe', { h: 10 });
  return d;
}
function bobby(P, x, by, s) {
  const { f } = P;
  let d = P.person(x, by, s, 'gent', { c: '#1c2236', legs: '#1c2236', hat: '#1c2236' });
  // the helmet, tall and rounded, over the bowler the kit gave him
  d += `<path d="M${f(x - 2.8 * s)} ${f(by - 27 * s)}q${f(2.8 * s)} ${f(-7 * s)} ${f(5.6 * s)} 0Z" fill="${P.ink('#1c2236')}" stroke="${P.keyC()}" stroke-width=".5"/><circle cx="${f(x)}" cy="${f(by - 29 * s)}" r="${f(.8 * s)}" fill="${P.ink('#d9c27a')}"/>`;
  return d;
}
