// Athens from the Plaka's edge below the Acropolis: the rock with its walls, the Parthenon in honey-coloured marble
// (its north colonnade still broken, as the Venetian powder left it), the Erechtheion beside it, the Propylaea and
// Athena Nike at the west end; the white and ochre houses of the Plaka climbing the slope among cypresses, palms and
// a little Byzantine church; a landau on the road, evzones swinging by in their fustanellas, swallows.

export default {
  id: 'ATH',
  greet: "SOUVENIR d'ATHÈNES",
  nation: 'GR',
  flag: 'GR',
  flower: 'olive',
  flower2: 'anemone',
  frame: { band: ['#7881d9', '#424a79'], gold: '#dcbc66', ink: '#1a2f5a', leaf: ['#9ab07a', '#4e6a44'], year: '#2a3a6a', halo: '#f8f0dc' },
  horizon: 236,
  clouds: 3,
  wind: 1,
  pal: {
    key: '#2a2520', marble: '#ecd8aa', marble2: '#c8ae7a', rock: '#c9b58d', rock2: '#a8926a', wall: '#f1eadb', wall2: '#ebd0a0',
    wall3: '#eac8bc', roof: '#b75b3b', hill: '#aca27f', far: '#9ea8b0', ground: '#dac7a0', olive: '#7f8c5c',
    glass: '#37465b', sash: '#efe6d3', iron: '#2a3431', gold: '#d6aa3a',
  },

  // an olive spray: grey-green willowy leaves, silver beneath, a cluster of black and green olives
  flowerArt(F) {
    const I = F.I;
    let s = F.stem('M-20 12Q-4 3 6 -4Q12 -8 19 -15', '#5a4a34', 1.8);
    for (const [x, y, a, c] of [[-16, 10, 200, '#7f9a6a'], [-12, 7, 130, '#a9ba96'], [-6, 4, 222, '#8aa274'], [-2, 2, 112, '#b6c6a2'], [4, -2, 236, '#7f9a6a'], [8, -5, 122, '#a9ba96'], [12, -9, 214, '#8aa274'], [15, -12, 140, '#b6c6a2'], [18, -14, 60, '#8aa274'], [-9, 5, 62, '#8aa274'], [1, 0, 300, '#a9ba96'], [10, -7, 318, '#7f9a6a']]) s += F.at(x, y, F.leaf(17, 5.6, a, c, { shape: 'lance', vein: '#eef0e2' }));
    s += F.stem('M-3 3Q-2 8 0 11', '#5a4a34', .8);
    for (const [x, y, c, r] of [[-3, 11, '#2a2a34', 3.2], [2.6, 12.4, '#3a3a2e', 3.4], [-6.4, 14.6, '#6f7f3a', 3], [0, 16.6, '#2a2a34', 3.1], [4.6, 17, '#7f8c42', 2.8]]) s += F.berry(x, y, r, c);
    return s;
  },
  // an anemone: scarlet cupped petals, a black boss ringed with dark stamens
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(14, 8, 200, I.leaf[1], { shape: 'serrate' }) + F.leaf(13, 7, 150, I.leaf[0], { shape: 'serrate' });
    s += F.radial(6, 11, 10, '#d8283a', { shape: 'round', lite: '#f27080' }) + F.disc(4, '#1d1a24', { dots: '#3a3a5a', n: 10 }) + `<circle r="1.6" fill="#4a4a6a"/>`;
    return s;
  },

  back(P) {
    let s = '';
    // the far mountains, Philopappos's hill with its monument, the Acropolis rock
    s += P.far(.85, () => P.fill('M24 214C80 200 140 206 200 212C260 216 320 206 380 200C440 194 520 204 580 210V240H24Z', 'far'));
    s += P.far(.62, () => P.fill('M24 236C40 214 70 196 104 192C130 190 150 204 170 222L180 236Z', 'hill') + P.fill(P.rect(92, 178, 12, 14), 'marble2', { w: .45 }) + P.flat(P.rect(94.6, 181, 2, 9), '#5a4a3a', { op: .6 }) + P.flat(P.rect(99.4, 181, 2, 9), '#5a4a3a', { op: .6 }));
    s += P.far(.4, () => `<g transform="translate(348 266) scale(1.17) translate(-364 -266)">${acropolis(P)}</g>`);
    s += P.flag(466, 165, .9, 'GR', { h: 26 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the Plaka climbing the slope under the rock
    s += P.far(.22, () => plaka(P));
    // the road below: its wall, palms and pepper trees, the café's tables
    s += road(P);
    s += P.setStreet(350, 30, 570, .95);
    s += P.cross(landau(P, { s: .92, dir: -1 }), { y: 352, dir: -1, dur: 42, rest: .35, offset: 6 });
    s += P.cross(evzones(P, { s: .95, dir: 1, n: 2 }), { y: 346, dir: 1, dur: 58, rest: .3, offset: 30 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .8, dir: -1, seed: 3, dresses: ['#f2ece0', '#e8d6e2'] }), { y: 338, dir: -1, dur: 88, offset: 50 });
    s += P.cross(T.cart({ s: .74, dir: 1, load: '#7f8c5c', horse: '#8a8478', c: '#7a5a3a' }), { y: 342, dir: 1, dur: 70, rest: .4, offset: 70 });
    return s;
  },

  front(P, T) {
    let s = '';
    s += P.paving(360, 380, { c: 'ground', vx: 300, seed: 4 });
    // a palm and an olive at the left, a lamp; a priest and a flower seller; an evzone sentry at his box
    s += P.tree(52, 372, 2.6, 'palm') + olive(P, 132, 370, 1.3);
    s += P.lamp(196, 372, 1.05, 'single', { h: 70 });
    s += sentryBox(P, 520, 372) + evzone(P, 498, 372, 1.15, { dir: 1 });
    s += P.person(232, 374, 1.12, 'priest', { c: '#1f1d22', dir: 1 }) + P.person(412, 374, 1.1, 'lady', { c: '#f2ede2', parasol: '#d9c0e8', dir: -1 }) + P.person(428, 374, 1.1, 'boater', { c: '#3a3f4a', dir: -1 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady', 'child'], s: 1.05, dir: 1, seed: 17, dresses: ['#f4efe4', '#e6eef4'] }), { y: 380, dir: 1, dur: 74, offset: 22, z: 'fore' });
    s += P.wall(456, 334, 13, 18);
    return s;
  },
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
const flip = (P, dir, w, b) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${b}</g>` : b);

// ---------- the Acropolis ----------
function acropolis(P) {
  const { f } = P;
  let s = '';
  // the rock: its cliffs streaked and fissured, the walls of Cimon and Themistocles crowning it
  const rock = 'M140 266C156 252 168 236 178 222L186 206L196 198L204 184L212 178L262 176L420 174L520 180L546 194L556 210C566 228 576 248 588 266Z';
  s += P.fill(rock, 'rock') + P.stipple(rock, 'rock', 150, { box: [140, 174, 448, 92], op: .45 });
  // the cliffs: buttresses of rock lit on their faces, deep fissures between, the screes at their feet
  const r = P.rng(5);
  let lit = '', fis = '';
  for (let x = 196; x < 556; x += 10 + r() * 12) {
    const y0 = 200 + r() * 6, h = 22 + r() * 24, w = 4 + r() * 6;
    lit += `M${f(x)} ${f(y0)}l${f(w)} ${f(2)}l${f(-1)} ${f(h)}l${f(-w + 2)} ${f(-2)}Z`;
    fis += `M${f(x - 1)} ${f(y0 + 1)}q${f(-1 + r() * 2)} ${f(h * .5)} ${f(r() * 2)} ${f(h)}`;
  }
  s += P.lite(lit, 'rock', .22, { op: .8 }) + P.line(fis, 'rock2', 1.1, { op: .75 });
  s += P.shade('M440 180L520 180L546 194L556 210C566 228 576 248 588 266H480C474 236 462 206 440 180Z', 'rock', .14);
  s += P.flat('M150 266C200 252 300 248 400 250C480 252 540 256 588 266Z', 'hill', { op: .5 });
  // the walls along the crest, built in big blocks, the column drums from the old temple set in the north wall
  const wall = 'M200 196L214 176H530L548 196L540 200H208Z';
  s += P.fill(wall, 'rock2') + P.lite('M214 176H530L532 179H214Z', 'rock2', .3);
  let blocks = '';
  for (let y = 181; y < 199; y += 4.4) blocks += `M210 ${f(y)}H542`;
  for (let x = 216; x < 540; x += 11) blocks += `M${x + ((x / 11) % 2) * 5} 181v18`;
  s += P.line(blocks, '#8a7656', .45, { op: .55 });
  for (let x = 300; x < 380; x += 9) s += `<circle cx="${x}" cy="186" r="3.2" fill="${P.ink('marble2')}" stroke="${P.ink('#8a7656')}" stroke-width=".5"/>`;
  if (P.L.snow) s += P.flat(rock, '#f0f3f6', { op: .45 });
  // the Parthenon, the Erechtheion, the Propylaea and Athena Nike
  s += parthenon(P, 238, 176);
  s += erechtheion(P, 432, 176);
  s += propylaea(P, 486, 178);
  return s;
}
/** Doric columns: a fluted shaft tapering to its capital; the near ones lit, the far in the shade of the colonnade. */
function doric(P, x, by, h, w, c = 'marble') {
  const { f } = P;
  let s = P.fill(`M${f(x - w / 2)} ${f(by)}L${f(x - w * .4)} ${f(by - h + w * .5)}H${f(x + w * .4)}L${f(x + w / 2)} ${f(by)}Z`, c, { w: .45 });
  s += P.shade(`M${f(x + w * .12)} ${f(by)}L${f(x + w * .1)} ${f(by - h + w * .5)}H${f(x + w * .4)}L${f(x + w / 2)} ${f(by)}Z`, c, .18);
  if (w > 3) s += P.line(`M${f(x - w * .15)} ${f(by - 1)}V${f(by - h + w * .6)}`, 'marble2', .35, { op: .7 });
  s += P.fill(`M${f(x - w * .62)} ${f(by - h + w * .5)}Q${f(x)} ${f(by - h + w * .9)} ${f(x + w * .62)} ${f(by - h + w * .5)}V${f(by - h)}H${f(x - w * .62)}Z`, c, { w: .35 });
  return s;
}
function parthenon(P, x0, by) {
  const { f } = P;
  let s = '';
  // seen from the north-east: the east front of eight columns, the north flank running away to the right
  const ew = 70, ch = 40, cw = 6.4, fx = x0 + ew;           // the east front from x0 to fx
  const n = 17, fl = 120, sx = (i) => fx + fl * (1 - Math.pow(1 - i / (n - 1), 1.18)); // the flank's columns, crowding with distance
  const stylo = (x) => by - (x - fx) * .025;
  // the steps
  s += P.fill(P.poly([[x0 - 4, by + 4], [fx + 2, by + 4], [fx + fl + 4, stylo(fx + fl) + 3], [fx + fl + 4, stylo(fx + fl) - 1], [fx, by - 1], [x0 - 4, by - 1]]), 'marble2', { w: .5 });
  s += P.line(`M${x0 - 4} ${f(by + 1.4)}H${fx}L${fx + fl + 4} ${f(stylo(fx + fl) + 1)}`, 'marble', .7);
  // through the gap: the far colonnade in shadow, broken too, and the west end's wall still standing
  for (let i = 2; i < n - 1; i++) {
    if (i > 5 && i < 9) continue;
    const x = sx(i) + 4, k = (1 - (i / (n - 1)) * .16) * .9;
    s += P.fill(P.rect(x - cw * k * .4, stylo(x) - 2 - ch * k * (i > 9 && i < 12 ? .5 : .96), cw * k * .8, ch * k * (i > 9 && i < 12 ? .5 : .96)), 'marble2', { w: .35 }) + P.shade(P.rect(x, stylo(x) - 2 - ch * k * .96, cw * k * .4, ch * k * .96), 'marble2', .25, { op: i > 9 && i < 12 ? 0 : 1 });
  }
  s += P.fill(P.poly([[sx(11), stylo(sx(11)) - 2], [sx(15), stylo(sx(15)) - 2], [sx(15), stylo(sx(15)) - ch * .8], [sx(11), stylo(sx(11)) - ch * .62]]), 'marble2') + P.shade(P.poly([[sx(11), stylo(sx(11)) - 2], [sx(15), stylo(sx(15)) - 2], [sx(15), stylo(sx(15)) - ch * .8], [sx(11), stylo(sx(11)) - ch * .62]]), 'marble2', .2);
  s += P.line(P.poly([[sx(11), stylo(sx(11)) - 12], [sx(15), stylo(sx(15)) - 12], [sx(11), stylo(sx(11)) - 22], [sx(15), stylo(sx(15)) - 22]], false), '#9a8458', .4, { op: .6 });
  // the north colonnade: standing at each end, a great gap in the middle where the powder magazine blew it out in 1687
  const standing = (i) => i < 4 || i > 11 || i === 7;
  for (let i = n - 1; i >= 1; i--) {
    const x = sx(i), k = 1 - (i / (n - 1)) * .16;
    if (standing(i)) s += doric(P, x, stylo(x), ch * k, cw * k * .92);
    else if (i % 3 === 0) s += doric(P, x, stylo(x), ch * k * (.18 + (i % 2) * .12), cw * k * .92);
  }
  // the flank's entablature over the standing columns at each end, broken off in between
  const ent = (xa, xb) => { const ya = stylo(xa) - ch + 1, yb = stylo(xb) - ch * .86 + 1; return P.fill(P.poly([[xa, ya], [xb, yb], [xb, yb - 8], [xa, ya - 9]]), 'marble') + P.line(P.poly([[xa, ya - 4.4], [xb, yb - 4]], false), 'marble2', .6) + triglyphs(P, xa, ya - 4.4, xb, yb - 4); };
  s += ent(fx, sx(3) + 3) + ent(sx(12) - 3, sx(16) + 2);
  // the east front: eight columns, the architrave and frieze, the low pediment, its corner fallen
  for (let i = 0; i < 8; i++) s += doric(P, x0 + 4 + i * (ew - 8) / 7, by - 1, ch, cw);
  s += P.fill(P.rect(x0 - 1, by - ch - 9, ew + 2, 9), 'marble') + P.shade(P.rect(x0 - 1, by - ch - 4.6, ew + 2, 4.6), 'marble', .1) + triglyphs(P, x0, by - ch - 4.6, fx, by - ch - 4.6);
  s += P.fill(P.poly([[x0 - 3, by - ch - 9], [x0 + ew / 2, by - ch - 21], [fx + 3, by - ch - 9]]), 'marble') + P.fill(P.poly([[x0 + 4, by - ch - 10.4], [x0 + ew / 2, by - ch - 18.6], [fx - 4, by - ch - 10.4]]), 'marble2', { w: .4 });
  s += P.flat(P.poly([[fx - 14, by - ch - 13], [fx + 3, by - ch - 9.4], [fx - 6, by - ch - 9.4]]), '#9ab8d8', { op: .0 });
  s += P.lite(P.rect(x0, by - ch - 9, ew, 1.6), 'marble', .3);
  // a few figures among the ruins for scale
  s += P.person(fx + 24, by - 1, .26, 'gent', { c: '#2f3440' }) + P.person(fx + 30, by - 1.4, .25, 'lady', { c: '#f2ece0' });
  return s;
}
function triglyphs(P, xa, ya, xb, yb) {
  const { f } = P, n = Math.max(3, Math.round((xb - xa) / 4.4));
  let d = '';
  for (let i = 0; i <= n; i++) { const t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t; d += `M${f(x)} ${f(y)}v-4`; }
  return P.line(d, '#8a7656', .8, { op: .7 });
}
function erechtheion(P, x0, by) {
  // the north porch: six slender Ionic columns on its lower ground, the temple's wall behind
  let s = P.fill(P.rect(x0 - 6, by - 30, 40, 26), 'marble') + P.shade(P.rect(x0 + 24, by - 30, 10, 26), 'marble', .16);
  s += P.fill(P.rect(x0 - 2, by - 26, 30, 4), 'marble', { w: .4 }) + P.fill(P.poly([[x0 - 4, by - 26], [x0 + 13, by - 33], [x0 + 30, by - 26]]), 'marble', { w: .4 });
  for (let i = 0; i < 6; i++) { const x = x0 + i * 5.4; s += P.fill(P.rect(x - 1.2, by - 22, 2.4, 22), 'marble', { w: .35 }) + `<circle cx="${P.f(x - 1.2)}" cy="${by - 21.4}" r=".9" fill="none" stroke="${P.ink('marble2')}" stroke-width=".4"/><circle cx="${P.f(x + 1.2)}" cy="${by - 21.4}" r=".9" fill="none" stroke="${P.ink('marble2')}" stroke-width=".4"/>`; }
  s += P.flat(P.rect(x0 - 1, by - 21, 29, 19), '#4a4036', { op: .35 });
  return s;
}
function propylaea(P, x0, by) {
  const { f } = P;
  // the gate building's Doric front, its wings; Athena Nike's little temple on the bastion beyond
  let s = P.fill(P.rect(x0, by - 26, 44, 24), 'marble2') + P.shade(P.rect(x0 + 30, by - 26, 14, 24), 'marble2', .16);
  for (let i = 0; i < 6; i++) s += doric(P, x0 + 4 + i * 7.2, by - 2, 22, 4.4);
  s += P.fill(P.rect(x0 - 1, by - 30, 46, 6), 'marble', { w: .45 }) + triglyphs(P, x0, by - 26, x0 + 44, by - 26);
  s += P.fill(P.rect(x0 + 50, by + 8, 22, 12), 'rock2', { w: .45 }) + P.fill(P.rect(x0 + 52, by - 6, 18, 14), 'marble', { w: .4 });
  for (let i = 0; i < 4; i++) s += P.fill(P.rect(x0 + 53.6 + i * 4.6, by - 4, 1.8, 12), 'marble', { w: .3 });
  s += P.fill(P.poly([[x0 + 51, by - 6], [x0 + 61, by - 11], [x0 + 71, by - 6]]), 'marble', { w: .4 });
  return s;
}

// ---------- the Plaka ----------
function plaka(P) {
  const { f } = P;
  let s = '';
  const r = P.rng(31);
  const walls = ['wall', 'wall', 'wall2', 'wall3'];
  // rows of little houses stepping down the slope, flat roofs and tiled ones, cypresses between
  const rows = [[254, 9, 12], [268, 10, 14], [283, 12, 16], [299, 13, 18], [316, 14, 22]];
  rows.forEach(([by, hMin, hVar], ri) => {
    let x = 26 + r() * 10;
    while (x < 580) {
      const w = 16 + r() * 18 + ri * 2, h = hMin + r() * hVar, flat = r() < .4;
      s += P.fill(P.rect(x, by - h, w, h), walls[Math.floor(r() * walls.length)], { w: .45 }) + P.shade(P.rect(x + w * .78, by - h, w * .22, h), 'wall', .12);
      if (flat) s += P.fill(P.rect(x - 1, by - h - 2, w + 2, 2.4), 'wall', { w: .35 });
      else s += P.fill(P.poly([[x - 2, by - h], [x + 3, by - h - h * .35], [x + w - 3, by - h - h * .35], [x + w + 2, by - h]]), 'roof', { w: .45 }) + P.line(`M${f(x + 1)} ${f(by - h - h * .17)}H${f(x + w - 1)}`, '#8a3a24', .4, { op: .6 });
      if (P.L.snow && !flat) s += P.flat(P.poly([[x - 2, by - h], [x + 3, by - h - h * .35], [x + w - 3, by - h - h * .35], [x + w + 2, by - h]]), '#f2f5f8', { op: .8 });
      const cols = Math.max(1, Math.round(w / 10));
      s += P.windows(x + 2, by - h + 3, w - 4, h - 7, cols, Math.max(1, Math.round(h / 12)), { ww: .4, wh: .55, glass: '#4a6a7a' });
      if (r() < .35) { const sh = r() < .5 ? '#4f7a5a' : '#3f6a9a', gw = (w - 4) / cols; for (let c = 0; c < cols; c++) { const wx = x + 2 + c * gw + gw * .3, wy = by - h + 3 + (h - 7) * .2; s += P.flat(P.rect(wx - gw * .14, wy, gw * .12, (h - 7) * .3), sh) + P.flat(P.rect(wx + gw * .42, wy, gw * .12, (h - 7) * .3), sh); } }
      if (ri > 2 && r() < .4) s += P.fill(P.rect(x + w * .4, by - 7, w * .2, 7), '#5a4a3a', { w: .35 });
      if (ri > 1 && r() < .3) s += P.flat(P.rect(x + 1, by - h * .5, w - 2, 1.2), '#4a6a7a', { op: .7 });
      x += w + (r() < .25 ? 6 + r() * 10 : -1);
    }
    // trees among the houses of each row
    for (let i = 0; i < 4; i++) { const tx = 40 + r() * 520, k = .45 + ri * .12; s += P.tree(tx, by - 1, k, r() < .55 ? 'cypress' : r() < .5 ? 'palm' : 'round'); }
  });
  // a Byzantine church: brick and stone, its tiled drum and dome
  const cx = 360, by = 297;
  s += P.fill(P.rect(cx - 20, by - 22, 40, 22), 'wall2') + P.shade(P.rect(cx + 10, by - 22, 10, 22), 'wall2', .15);
  let br = '';
  for (let y = by - 20; y < by; y += 4) br += `M${cx - 20} ${y}h40`;
  s += P.line(br, '#b7653f', .7, { op: .6 }) + P.fill(P.poly([[cx - 22, by - 22], [cx, by - 30], [cx + 22, by - 22]]), 'roof', { w: .45 });
  s += P.fill(P.rect(cx - 7, by - 40, 14, 12), 'wall2') + P.windows(cx - 6, by - 38, 12, 8, 3, 1, { arched: true, ww: .5, plain: true }) + P.fill(P.dome(cx, by - 40, 8, 8), 'roof') + P.line(`M${cx} ${by - 51}v-6M${cx - 2} ${by - 55}h4`, 'gold', .7);
  s += P.fill(P.arch(cx - 4, by - 12, 8, 12), '#4a3a2c');
  return s;
}
function road(P) {
  const { f } = P;
  let s = '';
  // a low wall along the road, a café's awning and tables, pepper trees
  s += P.fill('M24 318H580V326H24Z', 'wall', { w: .5 }) + P.lite('M24 318H580V319.6H24Z', 'wall', .2);
  s += P.fill('M24 326H580V362H24Z', 'ground', { k: false }) + P.flat('M24 326H580V329H24Z', '#a89870', { op: .4 });
  let ruts = '';
  for (let i = 0; i < 9; i++) ruts += `M${24 + i * 64} ${340 + (i % 3) * 6}q20 -2 40 0`;
  s += P.line(ruts, '#b8a47c', .7, { op: .6 });
  if (P.L.wet) s += P.flat('M90 344h70v2h-70ZM300 350h90v2h-90Z', P.L.sky.low, { op: .5, raw: 1 });
  if (P.L.snow) s += P.flat('M24 326H580V362H24Z', '#eef2f6', { op: .55 });
  // the kafeneion's tables under its awning at the right
  for (let i = 0; i < 7; i++) s += P.flat(P.poly([[500 + i * 11, 300], [511 + i * 11, 300], [513 + i * 11, 307], [502 + i * 11, 307]]), i % 2 ? '#f2ece0' : '#2b5fa8');
  s += P.line('M500 300h77l2 7h-77Z', null, .5) + P.line('M502 307V326M576 307V326', '#5b4532', 1.2);
  for (const x of [512, 548]) s += P.fill(`M${x - 7} 318h14v-1.6h-14Z`, '#efe6d0', { w: .35 }) + P.line(`M${x} 318v8`, '#3a2a1e', .8);
  s += P.person(504, 326, .8, 'gent', { c: '#2f3440', dir: 1 }) + P.person(522, 326, .78, 'gent', { c: '#e6dccb', dir: -1 }) + P.person(558, 326, .8, 'worker', { c: '#f2efe6', dir: -1 });
  s += P.crowd(60, 200, 330, 6, { s: .74, seed: 12, kinds: ['gent', 'lady', 'priest', 'boater', 'lady'] });
  s += P.tree(250, 322, 1.1, 'round') + P.tree(440, 322, 1.2, 'round');
  s += P.lamp(300, 330, .8, 'single', { h: 64 }) + P.lamp(470, 330, .8, 'single', { h: 64 });
  return s;
}
function olive(P, x, y, s) {
  const { f } = P, lf = P.L.leaf, c = lf.ever ?? '#6a7a50';
  // an old olive: a twisted trunk, a loose silvery crown that keeps its leaves all year
  let d = P.fill(`M${f(x - 4 * s)} ${f(y)}Q${f(x - 1 * s)} ${f(y - 10 * s)} ${f(x - 5 * s)} ${f(y - 20 * s)}L${f(x - 1 * s)} ${f(y - 22 * s)}Q${f(x + 3 * s)} ${f(y - 12 * s)} ${f(x + 4 * s)} ${f(y)}Z`, '#6a5844', { w: .5 });
  for (const [dx, dy, rx] of [[-10, -30, 13], [6, -34, 14], [-2, -42, 12], [14, -26, 9]]) {
    d += `<path d="${P.blob(x + dx * s, y + dy * s, rx * s, rx * .6 * s, 9, Math.round(x + dx))}" fill="${P.ink('olive')}" stroke="${P.keyC()}" stroke-width=".55"/>`;
    d += `<path d="${P.blob(x + dx * s - 2, y + dy * s - 2, rx * .5 * s, rx * .3 * s, 6, Math.round(x - dx))}" fill="${P.ink('#b8c4a4')}" opacity=".7"/>`;
  }
  void c;
  return d;
}

// ---------- people and carriages ----------
/** An evzone: the white fustanella's many pleats, the dark embroidered vest, the red fez with its long tassel, tsarouchia. */
function evzone(P, x, y, s, o = {}) {
  const { f } = P, dir = o.dir ?? 1, st = o.stride ?? null, D = (k) => f(k * s * dir);
  let d = '';
  // legs in white stockings, black garters, the shoes with their pompoms
  const legs = st === null ? [[-1.4, 0], [1.4, 0]] : st ? [[-3, 0], [3, 0]] : [[-1, 0], [1, 0]];
  for (const [lx] of legs) {
    d += P.fill(`M${f(x + lx * s - 1 * s)} ${f(y)}L${f(x + lx * s * .4 - .9 * s)} ${f(y - 12 * s)}H${f(x + lx * s * .4 + .9 * s)}L${f(x + lx * s + 1 * s)} ${f(y)}Z`, '#f4f1e8', { w: .35 });
    d += P.line(`M${f(x + lx * s * .7 - 1 * s)} ${f(y - 7 * s)}h${f(2 * s)}`, '#1d1a17', .7 * s) + `<circle cx="${f(x + lx * s + 1.4 * s * dir)}" cy="${f(y - .6 * s)}" r="${f(1 * s)}" fill="${P.ink('#1d1a17')}"/>`;
  }
  // the fustanella, flaring to the knee
  d += P.fill(`M${f(x - 2.6 * s)} ${f(y - 19 * s)}L${f(x - 5.6 * s)} ${f(y - 11 * s)}Q${f(x)} ${f(y - 9.6 * s)} ${f(x + 5.6 * s)} ${f(y - 11 * s)}L${f(x + 2.6 * s)} ${f(y - 19 * s)}Z`, '#f6f3ea', { w: .45 });
  d += P.line(`M${f(x - 1.6 * s)} ${f(y - 18 * s)}L${f(x - 3.6 * s)} ${f(y - 11 * s)}M${f(x)} ${f(y - 18 * s)}V${f(y - 10.6 * s)}M${f(x + 1.6 * s)} ${f(y - 18 * s)}L${f(x + 3.6 * s)} ${f(y - 11 * s)}`, '#c8c2b0', .4 * s);
  // the shirt's full sleeves, the dark vest with its gold, the sash
  d += P.fill(`M${f(x - 2.8 * s)} ${f(y - 19 * s)}L${f(x - 2.6 * s)} ${f(y - 26.4 * s)}Q${f(x)} ${f(y - 27.4 * s)} ${f(x + 2.6 * s)} ${f(y - 26.4 * s)}L${f(x + 2.8 * s)} ${f(y - 19 * s)}Z`, '#f4f1e8', { w: .4 });
  d += P.fill(`M${f(x - 2.2 * s)} ${f(y - 19.6 * s)}L${f(x - 2 * s)} ${f(y - 26 * s)}H${f(x + 2 * s)}L${f(x + 2.2 * s)} ${f(y - 19.6 * s)}Z`, '#1f2a5a', { w: .35 }) + P.line(`M${f(x - 1.4 * s)} ${f(y - 25 * s)}v${f(5 * s)}M${f(x + 1.4 * s)} ${f(y - 25 * s)}v${f(5 * s)}`, '#d6aa3a', .4 * s);
  d += P.line(`M${f(x - 2.6 * s)} ${f(y - 19.4 * s)}h${f(5.2 * s)}`, '#c8302a', 1 * s);
  // head, the red farion and its long black tassel falling to the shoulder
  d += `<circle cx="${f(x)}" cy="${f(y - 28.4 * s)}" r="${f(2 * s)}" fill="${P.ink('#d9ae88')}" stroke="${P.keyC()}" stroke-width=".45"/>`;
  d += P.fill(`M${f(x - 2.4 * s)} ${f(y - 29 * s)}Q${f(x - 2 * s)} ${f(y - 33.4 * s)} ${f(x + .4 * s)} ${f(y - 33 * s)}Q${f(x + 2.6 * s)} ${f(y - 32.4 * s)} ${f(x + 2.4 * s)} ${f(y - 29 * s)}Z`, '#b8242a', { w: .3 });
  d += P.line(`M${f(x)} ${f(y - 32.8 * s)}q${D(-3.4)} ${f(.6 * s)} ${D(-3.8)} ${f(6.6 * s)}`, '#141414', .9 * s);
  for (const k of [-1, 1]) d += P.fill(`M${f(x + k * 2.6 * s)} ${f(y - 26 * s)}q${f(k * 2 * s)} ${f(2 * s)} ${f(k * 1.2 * s)} ${f(6 * s)}l${f(-k * 1.2 * s)} ${f(-.2 * s)}Z`, '#f4f1e8', { w: .3 });
  // the rifle at the shoulder
  d += P.line(`M${f(x + 2.4 * s * dir)} ${f(y - 18 * s)}l${D(1.4)} ${f(-14 * s)}`, '#3b2c1e', 1 * s);
  return d;
}
function evzones(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, n = o.n ?? 2, gap = 9 * s, W = (n - 1) * gap + 22 * s, H = 38 * s;
  const frame = (st) => flip(P, dir, W, Array.from({ length: n }, (_, i) => evzone(P, 10 * s + i * gap, 36 * s, s, { dir: 1, stride: (st + i) % 2 })).join(''));
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 * s };
}
function sentryBox(P, x, by) {
  // the sentry box: striped in blue and white, its little pitched roof
  let s = P.fill(P.rect(x, by - 36, 16, 36), '#f2efe6') + P.shade(P.rect(x + 11, by - 36, 5, 36), '#f2efe6', .15);
  for (let k = 0; k < 4; k++) s += P.flat(P.rect(x, by - 34 + k * 9, 16, 4), '#2b5fa8');
  s += P.fill(P.rect(x + 3, by - 28, 10, 28), '#3a3430', { w: .4 }) + P.fill(P.poly([[x - 2, by - 36], [x + 8, by - 44], [x + 18, by - 36]]), '#2b5fa8', { w: .45 });
  return s;
}
/** A hired landau: an open body, its hood folded, two greys, the driver in his cap. */
function landau(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 104 * s, H = 50 * s, S = (k) => f(k * s);
  const wheel = (cx, cy, r) => { let w = `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(r)}" fill="none" stroke="${P.ink('#2b2622')}" stroke-width="${S(1.2)}"/>`; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; w += `<path d="M${S(cx - Math.cos(a) * r)} ${S(cy - Math.sin(a) * r)}L${S(cx + Math.cos(a) * r)} ${S(cy + Math.sin(a) * r)}" stroke="${P.ink('#d6aa3a')}" stroke-width="${S(.55)}"/>`; } return w; };
  const frame = (st) => {
    let b = wheel(18, 40, 9);
    b += P.fill(`M${S(8)} ${S(26)}Q${S(6)} ${S(37)} ${S(16)} ${S(37)}H${S(34)}Q${S(40)} ${S(36)} ${S(42)} ${S(30)}L${S(46)} ${S(24)}H${S(34)}Q${S(30)} ${S(28)} ${S(24)} ${S(28)}L${S(22)} ${S(22)}H${S(10)}Z`, '#2b3a5a', { w: .55 });
    b += P.fill(`M${S(6)} ${S(24)}Q${S(2)} ${S(16)} ${S(10)} ${S(13)}Q${S(14)} ${S(16)} ${S(14)} ${S(23)}Z`, '#26242a', { w: .5 });
    b += P.fill(`M${S(15)} ${S(24)}L${S(16)} ${S(15)}H${S(21)}L${S(22)} ${S(24)}Z`, '#f2ece0', { w: .4 }) + `<circle cx="${S(18.6)}" cy="${S(12.8)}" r="${S(2)}" fill="${P.ink('#e8c4a0')}"/><path d="M${S(13.8)} ${S(11.8)}q${S(5)} ${S(-5)} ${S(10)} 0Z" fill="${P.ink('#f0e4c8')}" stroke="${P.keyC()}" stroke-width="${S(.3)}"/>`;
    b += P.fill(`M${S(36)} ${S(24)}L${S(37)} ${S(12)}H${S(43)}L${S(44)} ${S(24)}Z`, '#3a3a44', { w: .45 }) + `<circle cx="${S(40)}" cy="${S(9.6)}" r="${S(2.2)}" fill="${P.ink('#d9ae88')}"/><path d="M${S(37.6)} ${S(8.6)}q${S(2.4)} ${S(-3)} ${S(4.8)} 0h${S(1.4)}Z" fill="${P.ink('#2a2a30')}"/>`;
    b += `<path d="M${S(43)} ${S(15)}L${S(62)} ${S(19)}M${S(44)} ${S(30)}L${S(62)} ${S(27)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.6)}"/>`;
    b += wheel(40, 41, 7);
    b += horseAt(P, 70 * s, 25.5 * s, s, '#b8b4ac', (st + 1) % 2) + horseAt(P, 66 * s, 27 * s, s, '#d8d4cc', st);
    return flip(P, dir, W, b);
  };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 5, w: W, h: H, ax: W / 2, ay: 48 * s };
}
/** A horse in profile facing right, trotting (st 0 or 1); x, y: the withers. After sprites.js. */
function horseAt(P, x, y, s, c, st) {
  const f = P.f, S = (k) => f(k * s), X = (k) => f(x + k * s), Y = (k) => f(y + k * s);
  let b = '';
  const leg = (hx, a, back) => `<path d="M${X(hx)} ${Y(8)}L${X(hx + a)} ${Y(15)}L${X(hx + a * .4)} ${Y(21)}" fill="none" stroke="${back ? P.dark(c, .2) : P.ink(c)}" stroke-width="${S(2)}" stroke-linecap="round"/><path d="M${X(hx + a * .4 - 1)} ${Y(21)}h${S(2.4)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1.2)}"/>`;
  const sw = st ? 3 : -2.4;
  b += leg(-11, -sw, true) + leg(5, sw, true);
  b += `<path d="M${X(-16)} ${Y(3)}q${S(-5)} ${S(4)} ${S(-4)} ${S(12)}" fill="none" stroke="${P.dark(c, .4)}" stroke-width="${S(2.4)}" stroke-linecap="round"/>`;
  b += P.fill(`M${X(-15)} ${Y(1)}Q${X(-14)} ${Y(-3)} ${X(-6)} ${Y(-2)}H${X(4)}Q${X(9)} ${Y(-3)} ${X(10)} ${Y(1)}Q${X(11)} ${Y(9)} ${X(5)} ${Y(10)}H${X(-10)}Q${X(-16)} ${Y(9)} ${X(-15)} ${Y(1)}Z`, c, { w: .55 });
  b += P.fill(`M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}Q${X(12)} ${Y(-14)} ${X(15)} ${Y(-12)}L${X(19)} ${Y(-5)}Q${X(19)} ${Y(-3)} ${X(17)} ${Y(-3)}L${X(13)} ${Y(-6)}L${X(10)} ${Y(3)}Z`, c, { w: .55 });
  b += `<path d="M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}" stroke="${P.dark(c, .4)}" stroke-width="${S(1.4)}"/>`;
  b += `<path d="M${X(-6)} ${Y(-2)}V${Y(7)}M${X(-8)} ${Y(2)}H${X(6)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(.7)}"/>`;
  b += leg(-12, sw * .8, false) + leg(4, -sw * .8, false);
  return b;
}
