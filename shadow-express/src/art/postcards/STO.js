// Stockholm from Strömkajen, where the white archipelago steamers berth: across the Ström the Royal Palace, square
// and ochre over its quay; Storkyrkan's tower behind it, the German Church's green spire over the tall houses of
// Skeppsbron, and away to the right Riddarholmen's openwork iron spire over the Riksdag on Helgeandsholmen. Steamers
// come and go, a fisherman tends his square net under the palace, gulls wheel over the quay.

const WL = 246; // the far waterline

export default {
  id: 'STO',
  greet: 'HÄLSNING från STOCKHOLM',
  nation: 'SE',
  flag: 'SE',
  flower: 'harebell',
  flower2: 'lingonberry',
  frame: { band: ['#418ad2', '#264e75'], gold: '#dcb95e', ink: '#7a2a1a', leaf: ['#74a05c', '#2f5838'], year: '#7a2a1a', halo: '#f8eed2' },
  horizon: WL,
  clouds: 5,
  wind: -1,
  birds: { c: '#f6f5f0', n: 5, y: 128, s: 1.1 },
  pal: {
    key: '#272a2f', palace: '#d9b886', palace2: '#c4a070', wall: '#ead6ae', wall2: '#c97c55', wall3: '#e3c470', wall4: '#dfe0d6',
    stone: '#d8d1c0', granite: '#a19d93', copper: '#69a491', brick: '#a5543d', roof: '#874a37', tin: '#3e4549',
    water: '#4b8295', ground: '#d0c6ac', glass: '#38485a', sash: '#efe9da', iron: '#2e3538', gold: '#d6aa45', hull: '#f3f0e8',
  },

  // harebells: pale violet bells nodding from hair-fine stems, a tuft of narrow leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 3.6, 205, I.leaf[1], { shape: 'lance' }) + F.leaf(22, 3.4, 160, I.leaf[0], { shape: 'lance' }) + F.leaf(14, 7, 240, I.leaf[0], { shape: 'heart' });
    s += F.stem('M-4 8Q-6 -8 4 -18Q10 -22 13 -16', I.leaf[1], 1) + F.stem('M-4 8Q4 0 14 4Q19 6 19 12', I.leaf[1], .9) + F.stem('M-4 8Q-12 -2 -16 -12', I.leaf[1], .9);
    const bell = (x, y, a, sc) => F.at(x, y, `<path d="M0 0C-5 1.2 -6.4 6 -7 11.4L-5.2 10.2L-3.4 12.6L-1.2 10.8L1.2 12.6L3.4 10.8L5.4 12.4L6.8 11C6.4 6 5 1.2 0 0Z" fill="#8193dc" stroke="${I.key}" stroke-width=".55"/><path d="M-2.4 2.6Q-4.4 6 -4.6 9.4" stroke="#b4c0f0" stroke-width="1.3" fill="none" opacity=".8"/><path d="M0 1V9" stroke="#5c6cb8" stroke-width=".5" opacity=".6"/>`, a, sc);
    s += bell(13, -16, 18, 1.15) + bell(19, 12, -8, 1) + bell(-16, -12, 30, .95);
    s += F.at(4, -18, `<ellipse rx="1.6" ry="2.4" fill="#5b8c4c" stroke="${I.key}" stroke-width=".4"/>`, 40);
    return s;
  },
  // lingonberries: glossy little leaves, a cluster of red berries
  flowerArt2(F) {
    const I = F.I;
    let s = '';
    for (const [a, l] of [[200, 11], [160, 10], [240, 9], [120, 9], [280, 8]]) s += F.leaf(l, 6, a, l > 9.5 ? I.leaf[1] : I.leaf[0], { shape: 'oval' });
    s += F.stem('M0 0Q4 -4 6 -9', I.leaf[1], .8);
    for (const [x, y, r] of [[2, -6, 3.2], [6.4, -8, 3], [5, -3, 3.3], [9, -4, 2.8], [1, -1, 2.9], [8.4, -.2, 2.6]]) s += F.berry(x, y, r, '#c8262e');
    return s;
  },

  back(P, T) {
    let s = '';
    // Norrmalm's shore beyond the bridge: the Opera
    s += P.far(.62, () => opera(P, 470, WL - 4));
    // the tall merchant houses of Skeppsbron, the German Church's spire over them
    s += P.far(.5, () => tyskaKyrkan(P, 70, WL - 30));
    s += P.far(.42, () => skeppsbron(P));
    // Riddarholmen's spire, the Riksdag on Helgeandsholmen, Norrbro and the Strömparterre
    s += P.far(.55, () => riddarholmen(P, 368, WL - 34));
    s += P.far(.4, () => riksdag(P, 352, 456, WL));
    // Storkyrkan's tower behind the palace, and the palace
    s += P.far(.42, () => storkyrkan(P, 196, 176));
    s += P.far(.3, () => palace(P));
    s += P.smoke(148, 164, .55) + P.smoke(330, 176, .5);
    // the Ström, holding their reflections; ice along the shore in winter
    s += P.water(WL, 320, { seed: 7, shimmer: 9, x0: 40, x1: 560 });
    s += reflect(P, 104, 346, WL + 1, 34, '#d9b886', 3) + reflect(P, 30, 104, WL + 1, 26, '#c97c55', 5) + reflect(P, 352, 452, WL + 1, 24, '#dfe0d6', 8) + reflect(P, 466, 574, WL + 1, 20, '#e3d6a8', 11);
    if (P.L.snow) { const r = P.rng(5); for (let i = 0; i < 16; i++) { const x = 30 + r() * 540, y = WL + 4 + r() * 66, w = 10 + r() * 30; s += P.fill(`M${P.f(x)} ${P.f(y)}l${P.f(w)} -1l3 2.6l${P.f(-w - 5)} .8Z`, '#eef3f6', { w: .4 }); } }
    // a fisherman with his square net, under the palace
    s += P.far(.32, () => netBoat(P, 268, WL + 14));
    // the boats on the Ström
    s += P.cross(steamerSE(P, { s: .54, dir: 1, name: '' }), { y: 268, dir: 1, dur: 96, rest: .2, offset: 30 });
    s += P.cross(T.sail({ s: .56, rig: 'gaff', sailC: '#f4efe2', hull: '#f2eee4', dir: -1, strake: '#2a4a7a' }), { y: 280, dir: -1, dur: 130, offset: 70 });
    s += P.cross(steamerSE(P, { s: .76, dir: -1, name: '' }), { y: 302, dir: -1, dur: 70, rest: .35, offset: 5 });
    s += P.cross(T.rowboat({ s: .8, dir: 1, shirt: '#f2efe4', hull: '#8a5a3a' }), { y: 312, dir: 1, dur: 64, offset: 18 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the moored steamer on the right, bound for Norrtälje, her funnel smoking
    s += moored(P, 404, 318);
    // the quay: its granite edge, bollards, the stones of Strömkajen
    s += P.paving(326, 380, { vx: 300, seed: 9 });
    s += P.fill('M14 317H586V327H14Z', 'granite') + P.lite('M14 317H586V319.4H14Z', 'granite', .3) + P.shade('M14 324.6H586V327H14Z', 'granite', .2);
    for (let x = 34; x < 586; x += 31) s += P.line(`M${x} 319.6V324.6`, '#6e6a62', .5, { op: .6 });
    for (const x of [60, 176, 290, 382]) s += P.fill(`M${x - 3} 326v-6q3 -2.4 6 0v6Z`, 'iron', { w: .5 }) + P.lite(`M${x - 2} 325v-5q1 -.6 2 -.6v5.6Z`, 'iron', .3);
    s += P.line('M404 318L382 330', '#5b4532', 2.2) + P.line('M404 316L382 328M408 318L386 330', '#3a2a1e', .5);
    // people along the quay, the lamps
    s += P.far(.08, () => P.crowd(130, 260, 334, 6, { s: .72, seed: 3, ...clothes(P) }) + P.crowd(300, 380, 334, 4, { s: .72, seed: 11, kinds: ['sailor', 'gent', 'lady', 'worker'], ...clothes(P) }));
    s += P.lamp(140, 338, .9, 'single', { h: 64 }) + P.lamp(352, 338, .9, 'single', { h: 64 });
    s += P.wall(146, 304, 9, 12);
    s += P.setStreet(350, 26, 574, .9);
    s += P.cross(T.fiacre({ s: .7, dir: -1, horses: 1, body: '#1f2b33', hood: '#2a2826', wheelC: '#c8a23a' }), { y: 346, dir: -1, dur: 56, rest: .3, offset: 22 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .8, dir: 1, seed: 6, dresses: ['#f3eee2', '#cfe0ec'], ...clothes(P) }), { y: 350, dir: 1, dur: 84, offset: 8 });
    s += P.cross(T.walkers({ kinds: ['sailor', 'worker'], s: .8, dir: -1, seed: 12, coats: ['#1f2a44', '#4a3a30'], ...clothes(P) }), { y: 354, dir: -1, dur: 92, offset: 50 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the lamp at the quay's corner, the lady in white and her girl watching the boats
    s += quayLamp(P, 64, 378, 1.18);
    s += P.figure(112, 412, 1.14, 'lady', { c: frock(P, '#f4f1e8'), sash: '#4f7fc0', flowers: ['#8193dc', '#f4f1e8', '#e8c25a'], parasol: umbrella(P, '#f2efe6'), hair: '#c9a46a' });
    s += P.person(150, 374, 1.25, 'girl', { c: frock(P, '#f2efe6'), hat: '#1f3a6e' }) + sailorCollar(P, 150, 374, 1.25);
    // the fishwife with her herring by the gangway; travellers with their bags
    s += fishStall(P, 214, 370);
    s += P.crowd(268, 340, 349, 4, { s: .92, seed: 27, kinds: ['gent', 'lady', 'boater', 'lady'], ...clothes(P) });
    s += luggage(P, 432, 370) + P.person(452, 370, 1.06, 'gent', { c: '#2e3440', dir: -1 }) + P.person(468, 372, 1.04, 'lady', { c: frock(P, '#e9d6dc'), parasol: umbrella(P, '#f3eee2'), dir: -1 });
    s += P.person(498, 368, 1, 'sailor', { c: '#1f2a44', legs: '#1f2a44', dir: -1 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady', 'child'], s: 1.04, dir: 1, seed: 17, dresses: ['#f3eee2', '#e8b9b3'], ...clothes(P) }), { y: 372, dir: 1, dur: 76, offset: 36, z: 'fore' });
    return s;
  },
};

/** The quay's lamp: a fluted iron post, a crown of scrolls, one big lantern. */
function quayLamp(P, x, by, s) {
  const { f } = P, S = (n) => n * s;
  let d = P.fill(`M${f(x - S(6))} ${f(by)}h${f(S(12))}l${f(S(-2.4))} ${f(S(-12))}h${f(S(-7.2))}Z`, 'iron', { w: .6 });
  d += P.fill(`M${f(x - S(2))} ${f(by - S(12))}L${f(x - S(1.2))} ${f(by - S(96))}H${f(x + S(1.2))}L${f(x + S(2))} ${f(by - S(12))}Z`, 'iron', { w: .5 });
  for (const y of [by - S(40), by - S(80)]) d += P.fill(P.rect(x - S(2.8), y, S(5.6), S(2.4)), 'iron', { w: .4 });
  d += P.line(`M${f(x)} ${f(by - S(92))}q${f(S(-7))} ${f(S(-2))} ${f(S(-7))} ${f(S(-9))}M${f(x)} ${f(by - S(92))}q${f(S(7))} ${f(S(-2))} ${f(S(7))} ${f(S(-9))}`, 'iron', 1.1 * s);
  d += P.lamp(x, by - S(92), s * 1.25, 'single', { h: 12 });
  return d;
}
// ---------- the palace and the old town ----------
function palace(P) {
  const { f } = P;
  let s = '';
  const by = WL - 6, top = 170, x0 = 104, x1 = 290, xn = 342;
  // the north front, running back in shade to the Lion's Ramp
  const nTop = (x) => top + (x - x1) * .1;
  s += P.fill(P.poly([[x1, top - 2], [xn, nTop(xn) - 1], [xn, by + 2], [x1, by]]), 'palace2');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const xa = x1 + 4 + c * 8.2, ya = top + 12 + r * 14 + (xa - x1) * .07, lit = P.wr() < P.L.windows, tone = P.wr();
    s += `<path d="${P.poly([[xa, ya], [xa + 4, ya + .3], [xa + 4, ya + 8.3], [xa, ya + 8]])}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`;
  }
  s += P.fill(P.poly([[x1, top - 2], [xn, nTop(xn) - 1], [xn, nTop(xn) - 5], [x1, top - 7]]), 'palace2', { w: .5 });
  // the east front: two wings come forward, the middle stands back over the terraces of the Logården
  const wings = [[x0, 152], [242, x1]];
  s += P.fill(P.rect(150, top + 4, 94, by - top - 4), 'palace2') + P.windows(154, top + 12, 86, by - top - 26, 9, 4, { ww: .42, wh: .6 });
  s += P.fill(P.rect(148, top - 1, 98, 5), 'palace2', { w: .5 });
  for (const [a, b] of wings) {
    s += P.fill(P.rect(a, top, b - a, by - top + 2), 'palace') + P.stipple(P.rect(a, top, b - a, by - top + 2), 'palace', 30, { box: [a, top, b - a, by - top], op: .3 });
    s += P.shade(P.rect(b - 5, top, 5, by - top + 2), 'palace', .18);
    s += P.fill(P.rect(a, by - 18, b - a, 20), 'palace2', { w: .5 });
    for (let k = 0; k < 5; k++) s += P.line(`M${a + 1} ${by - 15 + k * 3.6}H${b - 1}`, '#a58456', .4, { op: .6 });
    s += P.windows(a + 3, top + 7, b - a - 6, by - top - 30, 5, 4, { ww: .46, wh: .62 });
    // pediments over the state floor's windows, consoles under the cornice
    const gw = (b - a - 6) / 5, rowH = (by - top - 30) / 4;
    for (let c = 0; c < 5; c++) { const wx = a + 3 + c * gw + gw * .27, wy = top + 7 + rowH + rowH * .2; s += P.fill(P.gable(wx - .8, wy - .4, gw * .46 + 1.6, 2.6), 'palace', { w: .35 }); }
    for (let x = a + 2; x < b - 1; x += 3.4) s += P.line(`M${x} ${top - .4}v2`, '#9d7d50', .7);
    s += P.windows(a + 3, by - 17, b - a - 6, 14, 5, 1, { ww: .4, wh: .6, arched: true });
    // the bay in the middle of each wing, with pilasters and a pediment
    const m = (a + b) / 2;
    s += P.fill(P.rect(m - 9, top - 2, 18, by - top - 16), 'palace', { w: .5 }) + P.windows(m - 7, top + 6, 14, by - top - 30, 2, 4, { ww: .5, wh: .62 });
    for (const k of [-1, 1]) s += P.line(`M${m + k * 8} ${top}V${by - 18}`, '#a58456', .7);
    s += P.fill(P.gable(m - 10, top - 1, 20, 6), 'palace', { w: .5 });
    s += P.fill(P.rect(a - 1.5, top - 5, b - a + 3, 5), 'palace', { w: .55 }) + P.lite(P.rect(a - 1.5, top - 5, b - a + 3, 1.2), 'palace', .3);
  }
  // balustrades along the roof
  for (const [a, b, y] of [[x0, x1, top - 5], [148, 246, top - 1]]) { s += P.line(`M${a} ${y - 3}H${b}`, 'palace2', .8); for (let x = a + 2; x < b; x += 3) s += P.line(`M${x} ${y}v-3`, 'palace2', .6); }
  if (P.L.snow) s += P.flat(P.rect(x0 - 1, top - 9, x1 - x0 + 2, 3), '#f4f7fa', { op: .9 }) + P.flat(P.poly([[x1, top - 9], [xn, nTop(xn) - 7], [xn, nTop(xn) - 5], [x1, top - 7]]), '#f4f7fa', { op: .9 });
  // the Logården's terraces in the middle, and the quay wall of Skeppsbron below it all
  const lf = P.L.leaf;
  s += P.fill(P.rect(152, by - 8, 90, 10), 'stone', { w: .5 });
  if (lf.leaf) for (let x = 158; x < 240; x += 11) s += `<path d="${P.blob(x, by - 12, 5.6, 5, 7, x)}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width=".5"/>`;
  else for (let x = 158; x < 240; x += 11) s += P.line(`M${x} ${by - 6}v-10M${x} ${by - 12}l-3 -4M${x} ${by - 11}l3 -4`, '#5b5148', .6);
  s += P.fill(P.rect(30, WL - 6, 330, 6), 'granite', { w: .6 }) + P.lite(P.rect(30, WL - 6, 330, 1.2), 'granite', .3);
  // the Lion's Ramp down from the north front
  s += P.fill(P.poly([[xn - 4, by + 2], [xn + 8, by + 6], [xn + 8, WL], [x1 + 6, WL]]), 'stone', { w: .5 });
  s += P.flag(214, top - 1, .7, 'SE', { h: 26 });
  return s;
}
function storkyrkan(P, cx, by) {
  const { f } = P;
  let s = '';
  const w = 16, t1 = 136;
  s += P.fill(P.rect(cx - w / 2, t1, w, by - t1), 'wall') + P.shade(P.rect(cx + w * .2, t1, w * .3, by - t1), 'wall', .2);
  s += P.fill(P.arch(cx - 3.4, t1 + 6, 6.8, 13), '#3a3430', { w: .4 }) + P.windows(cx - 3, t1 + 24, 6, 10, 1, 1, { ww: .7, wh: .8, arched: true });
  s += P.fill(P.rect(cx - w / 2 - 1.5, t1 - 3, w + 3, 3), 'wall', { w: .45 });
  for (const k of [-1, 1]) s += P.line(`M${cx + k * (w / 2 - .5)} ${t1 - 3}v-7`, 'copper', 1.6) + `<circle cx="${cx + k * (w / 2 - .5)}" cy="${t1 - 11}" r="1" fill="${P.ink('gold')}"/>`;
  // the copper cap: a bell-shaped dome, a lantern, a slender spire with its ball and cross
  s += P.fill(`M${cx - 7} ${t1 - 3}Q${cx - 8} ${t1 - 12} ${cx - 2.4} ${t1 - 15}H${cx + 2.4}Q${cx + 8} ${t1 - 12} ${cx + 7} ${t1 - 3}Z`, 'copper', { w: .5 }) + P.shade(`M${cx + 1} ${t1 - 15}H${cx + 2.4}Q${cx + 8} ${t1 - 12} ${cx + 7} ${t1 - 3}H${cx + 2}Z`, 'copper', .2);
  s += P.fill(P.rect(cx - 2.4, t1 - 21, 4.8, 6), 'copper', { w: .4 }) + P.fill(P.spire(cx, t1 - 21, 4, 12), 'copper', { w: .4 });
  s += P.line(`M${cx} ${t1 - 33}v-6M${cx - 1.6} ${t1 - 37}h3.2`, 'gold', .7) + `<circle cx="${cx}" cy="${t1 - 33}" r="1" fill="${P.ink('gold')}"/>`;
  return s;
}
function tyskaKyrkan(P, cx, by) {
  const { f } = P;
  let s = '';
  const w = 15, t1 = 152;
  s += P.fill(P.rect(cx - w / 2, t1, w, by - t1), 'brick') + P.shade(P.rect(cx + 2, t1, w / 2 - 2, by - t1), 'brick', .2);
  s += P.fill(P.gothic(cx - 3, t1 + 6, 6, 18), '#2e2a2a', { w: .4 }) + P.windows(cx - 2.5, t1 + 32, 5, 10, 1, 1, { ww: .7, wh: .8, gothic: true });
  for (const k of [-1, 1]) s += P.fill(P.spire(cx + k * (w / 2 - 1), t1 + 1, 3.4, 10), 'copper', { w: .4 });
  // the tall green spire, its little lucarnes
  s += P.fill(`M${cx - 6.6} ${t1}L${cx} ${t1 - 58}L${cx + 6.6} ${t1}Z`, 'copper', { w: .6 }) + P.shade(`M${cx} ${t1 - 58}L${cx + 6.6} ${t1}H${cx + 1}Z`, 'copper', .22);
  for (const y of [t1 - 12, t1 - 28]) s += P.fill(P.gable(cx - 2, y, 4, 4), 'copper', { w: .35 });
  s += P.line(`M${cx} ${t1 - 58}v-6M${cx - 1.6} ${t1 - 61}h3.2`, 'gold', .7);
  return s;
}
function skeppsbron(P) {
  const { f } = P;
  // the tall houses along Skeppsbron, gable to gable, receding to the left of the palace
  let s = '';
  const walls = ['wall', 'wall2', 'wall3', 'wall', 'wall4', 'wall2'], roofs = ['roof', 'tin', 'roof', 'tin', 'roof', 'roof'];
  let x = 24;
  const ws = [14, 13, 15, 12, 16, 14];
  for (let i = 0; i < 6; i++) {
    const w = ws[i], h = 50 + (i * 37 % 17), by = WL - 6;
    s += P.facade(x, by, w, h, { c: walls[i], roof: i % 2 ? 'gable' : 'pitch', roofC: roofs[i], side: 3, cols: 2, floors: 5, rh: 10, flagChance: .5 });
    x += w - .5;
  }
  return s;
}
function riddarholmen(P, cx, by) {
  const { f } = P;
  let s = '';
  const w = 16, t1 = 154;
  // the brick tower, its corner turrets, the openwork spire of cast iron
  s += P.fill(P.rect(cx - w / 2, t1, w, by - t1), 'brick') + P.shade(P.rect(cx + 2.4, t1, w / 2 - 2.4, by - t1), 'brick', .2);
  s += P.fill(P.gothic(cx - 2.6, t1 + 6, 5.2, 14), '#2e2a2a', { w: .4 });
  s += P.fill(P.rect(cx - w / 2 - 1, t1 - 2, w + 2, 3), 'brick', { w: .4 });
  for (const k of [-1, 1]) s += P.line(`M${cx + k * (w / 2 - 1)} ${t1 - 1}V${t1 - 12}`, 'iron', 1.2) + P.line(`M${cx + k * (w / 2 - 1)} ${t1 - 12}v-5`, 'iron', .6);
  const top = t1 - 60, hw = 7.4;
  let lat = `M${cx - hw} ${t1 - 1}L${cx} ${top}L${cx + hw} ${t1 - 1}`;
  for (let k = 1; k < 9; k++) { const y = t1 - 1 - (t1 - 1 - top) * k / 9, x = hw * (1 - k / 9); lat += `M${f(cx - x)} ${f(y)}H${f(cx + x)}`; }
  for (let k = 0; k < 8; k++) { const y0 = t1 - 1 - (t1 - 1 - top) * k / 9, y1 = t1 - 1 - (t1 - 1 - top) * (k + 1) / 9, x0 = hw * (1 - k / 9), x1 = hw * (1 - (k + 1) / 9); lat += `M${f(cx - x0)} ${f(y0)}L${f(cx)} ${f(y1)}L${f(cx + x0)} ${f(y0)}M${f(cx - x1)} ${f(y1)}L${f(cx)} ${f(y0)}L${f(cx + x1)} ${f(y1)}`; }
  s += `<path d="${lat}" fill="none" stroke="${P.keyC()}" stroke-width="1.5" stroke-linejoin="round"/><path d="${lat}" fill="none" stroke="${P.ink('iron')}" stroke-width=".8"/>`;
  s += P.line(`M${cx} ${top}v-6M${cx - 1.6} ${top - 3}h3.2`, 'iron', .8);
  return s;
}
function riksdag(P, x0, x1, wl) {
  const { f } = P;
  let s = '';
  const by = wl - 8, top = 196;
  // the Strömparterre's trees at the water, the Riksdag's grey front behind, Norrbro's arches before it
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'wall4') + P.stipple(P.rect(x0, top, x1 - x0, by - top), 'wall4', 30, { box: [x0, top, x1 - x0, by - top], op: .3 });
  s += P.fill(P.rect(x0, by - 14, x1 - x0, 14), 'granite', { w: .5 });
  s += P.windows(x0 + 3, top + 5, x1 - x0 - 6, 24, 12, 2, { ww: .45, wh: .6 });
  const m = (x0 + x1) / 2;
  s += P.fill(P.rect(m - 18, top - 6, 36, by - top - 8), 'wall4', { w: .55 }) + P.columns(m - 15, by - 14, 30, by - top - 10, 6, 'wall4');
  s += P.fill(P.rect(m - 20, top - 9, 40, 4), 'wall4', { w: .5 }) + P.fill(`M${m - 19} ${top - 9}Q${m} ${top - 22} ${m + 19} ${top - 9}Z`, 'copper', { w: .55 });
  s += P.fill(P.poly([[x0 - 2, top + 1], [x0 + 6, top - 7], [x1 - 6, top - 7], [x1 + 2, top + 1]]), 'copper', { w: .5 });
  if (P.L.snow) s += P.flat(P.poly([[x0 - 2, top + 1], [x0 + 6, top - 7], [x1 - 6, top - 7], [x1 + 2, top + 1], [x1, top - 3], [x0, top - 3]]), '#f4f7fa', { op: .85 });
  const lf = P.L.leaf;
  for (const [x, sc] of [[362, .5], [380, .56], [440, .52]]) s += P.tree(x, wl - 2, sc, 'round');
  // Norrbro: low granite arches from the palace to the island and on to Norrmalm
  let br = `M${x0 - 12} ${wl - 8}H${x1 + 40}V${wl + 1}H${x0 - 12}Z`;
  for (let x = x0 - 6; x < x1 + 36; x += 18) br += `M${x} ${wl + 1}V${wl - 2}Q${x + 7} ${wl - 7} ${x + 14} ${wl - 2}V${wl + 1}Z`;
  s += `<path d="${br}" fill="${P.ink('granite')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width=".6"/>` + P.line(`M${x0 - 12} ${wl - 8}H${x1 + 40}`, 'stone', 1);
  for (let x = x0 - 4; x < x1 + 36; x += 6) s += P.line(`M${x} ${wl - 8}v-2.4`, 'iron', .5);
  for (const x of [x0 + 10, x1 + 20]) s += P.lamp(x, wl - 8, .32, 'single', { h: 40 });
  return s;
}
function opera(P, x0, by) {
  const { f } = P;
  let s = P.fill(P.rect(x0, by - 50, 120, 50), 'wall') + P.windows(x0 + 4, by - 44, 112, 38, 14, 3, { ww: .42, wh: .55, arched: true });
  s += P.fill(P.rect(x0 + 30, by - 62, 50, 14), 'wall', { w: .5 }) + P.fill(P.dome(x0 + 55, by - 62, 18, 8), 'copper', { w: .5 });
  s += P.fill(P.poly([[x0 - 2, by - 49], [x0 + 6, by - 56], [x0 + 118, by - 56], [x0 + 124, by - 49]]), 'copper', { w: .5 });
  if (P.L.snow) s += P.flat(P.poly([[x0 - 2, by - 49], [x0 + 6, by - 56], [x0 + 118, by - 56], [x0 + 124, by - 49]]), '#f4f7fa', { op: .85 });
  return s;
}

// ---------- the boats ----------
/** A Stockholm archipelago steamer as a moving part: white, a tall black funnel with a white band, the blue-and-gold flag. */
function steamerSE(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 104 * s, H = 56 * s, S = (k) => f(k * s), L = P.L;
  const glass = () => (L.windows > .2 ? P.glow('#ffd88a') : P.ink('#405060'));
  let b = '';
  b += `<path d="M${S(58)} ${S(4)}V${S(32)}M${S(30)} ${S(10)}V${S(32)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(.9)}"/>`;
  b += P.fill(`M${S(46)} ${S(32)}L${S(47)} ${S(10)}H${S(55)}L${S(56)} ${S(32)}Z`, '#1e1d1f', { w: .5 }) + P.flat(`M${S(46.6)} ${S(18)}H${S(55.4)}V${S(21)}H${S(46.6)}Z`, '#f2efe6') + P.flat(`M${S(46.8)} ${S(21)}H${S(55.2)}V${S(22.4)}H${S(46.8)}Z`, '#2a5aa0');
  b += P.fill(`M${S(16)} ${S(41)}V${S(31)}H${S(82)}V${S(41)}Z`, 'hull', { w: .55 });
  for (let i = 0; i < 10; i++) b += `<rect x="${S(19 + i * 6)}" y="${S(33.4)}" width="${S(3.4)}" height="${S(3.6)}" fill="${glass()}"/>`;
  b += P.fill(`M${S(64)} ${S(31)}V${S(25)}H${S(78)}V${S(31)}Z`, 'hull', { w: .5 }) + `<rect x="${S(66)}" y="${S(26.4)}" width="${S(10)}" height="${S(2.6)}" fill="${glass()}"/>`;
  b += P.fill(`M${S(14)} ${S(31)}H${S(84)}V${S(29.6)}H${S(14)}Z`, '#d8cfbe', { w: .4 });
  b += P.fill(`M${S(2)} ${S(39)}H${S(100)}L${S(93)} ${S(49)}H${S(9)}Q${S(4)} ${S(47)} ${S(2)} ${S(39)}Z`, 'hull', { w: .6 }) + P.shade(`M${S(6)} ${S(46)}H${S(95)}L${S(93)} ${S(49)}H${S(9)}Z`, 'hull', .2);
  b += `<path d="M${S(5)} ${S(41.6)}H${S(98)}" stroke="${P.ink('#1f2a3a')}" stroke-width="${S(1.2)}"/>`;
  if (o.name) b += `<text x="${S(88)}" y="${S(45)}" font-family="Georgia,serif" font-size="${S(3.6)}" text-anchor="middle" fill="${P.ink('#1f2a3a')}">${o.name}</text>`;
  b += `<path d="M${S(4)} ${S(39)}V${S(26)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.6)}"/><g transform="translate(${S(4)} ${S(26)}) scale(-1 1)"><rect width="${S(7)}" height="${S(4.6)}" fill="${P.ink('#1f5fa8')}"/><path d="M${S(2.1)} 0h${S(.8)}v${S(4.6)}h${S(-.8)}ZM0 ${S(1.9)}h${S(7)}v${S(.8)}h${S(-7)}Z" fill="${P.ink('#f4c400')}"/></g>`;
  if (L.lamps > .05) b += `<circle cx="${S(58)}" cy="${S(5)}" r="${S(1.2)}" fill="${P.glow('#fff2c0')}"/>`;
  b += `<path d="M${S(0)} ${S(48)}q${S(-6)} ${S(1)} ${S(-10)} ${S(3)}M${S(96)} ${S(47)}q${S(5)} ${S(2)} ${S(8)} ${S(4)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(1)}" fill="none" opacity=".7"/>`;
  const body = dir < 0 ? `<g transform="translate(${f(W)} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}" height="${f(H)}">${body}</svg>`, w: W, h: H, ax: W / 2, ay: 47 * s, puffs: [[dir > 0 ? 51 * s : W - 51 * s, 10 * s, s, false, -dir]] };
}
/** The steamer at the quay, her bow toward the palace, her stern out of the picture. */
function moored(P, x, wl) {
  const { f } = P;
  let s = '';
  const L = P.L, glass = () => (L.windows > .2 ? P.glow('#ffd88a') : P.ink('#405060'));
  // masts and stays
  s += P.line(`M${x + 44} ${wl - 52}V${wl - 106}M${x + 150} ${wl - 38}V${wl - 96}`, '#4a3a2a', 1.3) + P.line(`M${x + 44} ${wl - 106}L${x + 4} ${wl - 24}M${x + 44} ${wl - 106}L${x + 150} ${wl - 96}M${x + 150} ${wl - 96}L${x + 230} ${wl - 40}M${x + 44} ${wl - 92}h-5`, '#4a3a2a', .45);
  for (const [mx, my] of [[x + 44, wl - 106], [x + 150, wl - 96]]) s += `<circle cx="${mx}" cy="${my - 1}" r="1.2" fill="${P.ink('gold')}"/>`;
  // the funnel: black, a white band with a blue line
  s += P.fill(`M${x + 86} ${wl - 36}L${x + 88} ${wl - 92}H${x + 104}L${x + 106} ${wl - 36}Z`, '#1e1d1f', { w: .7 }) + P.flat(P.rect(x + 87.4, wl - 76, 17.2, 6), '#f2efe6') + P.flat(P.rect(x + 87.4, wl - 70, 17.2, 2.2), '#2a5aa0');
  s += P.lite(P.rect(x + 89, wl - 90, 3, 52), '#1e1d1f', .25);
  s += P.smoke(x + 96, wl - 94, 1.1);
  // the deckhouse, saloon windows, the wheelhouse forward
  s += P.fill(P.rect(x + 22, wl - 38, 200, 16), 'hull', { w: .7 });
  for (let i = 0; i < 18; i++) { const lit = P.wr() < L.windows, tone = P.wr(); s += `<rect x="${x + 27 + i * 10.6}" y="${wl - 34}" width="5.6" height="7" rx="1.2" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`; }
  s += P.fill(P.rect(x + 30, wl - 52, 30, 14), 'hull', { w: .6 }) + `<rect x="${x + 33}" y="${wl - 49}" width="24" height="6" fill="${glass()}" stroke="${P.keyC()}" stroke-width=".4"/>` + P.fill(P.rect(x + 28, wl - 54, 34, 2.6), '#cfc6b4', { w: .4 });
  s += P.fill(P.rect(x + 20, wl - 40, 210, 2.4), '#cfc6b4', { w: .45 });
  for (let k = 0; k < 40; k++) s += P.line(`M${x + 24 + k * 5} ${wl - 38}v-3`, '#7a6a52', .4, { op: .7 });
  // the hull, white over a black boot, her name at the bow
  s += P.fill(`M${x} ${wl - 24}H${x + 260}V${wl}H${x + 12}Q${x + 3} ${wl - 4} ${x} ${wl - 24}Z`, 'hull', { w: .8 }) + P.shade(P.rect(x + 8, wl - 8, 252, 8), 'hull', .18);
  s += P.line(`M${x + 2} ${wl - 21}H${x + 260}`, '#1f2a3a', 1.6) + P.line(`M${x + 6} ${wl - 5}H${x + 260}`, '#2a2a2c', 3);
  s += `<text x="${x + 46}" y="${wl - 11}" font-family="Georgia,'Times New Roman',serif" font-size="7" font-weight="bold" letter-spacing=".6" fill="${P.ink('#1f2a3a')}">NORRTELJE</text>`;
  for (let i = 0; i < 6; i++) s += `<circle cx="${x + 110 + i * 14}" cy="${wl - 13}" r="1.6" fill="${glass()}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  if (L.snow) s += P.flat(P.rect(x + 22, wl - 41, 200, 2), '#f4f7fa', { op: .8 });
  // a flag at the jack staff
  s += P.flag(x + 6, wl - 24, .8, 'SE', { h: 18 });
  return s;
}
function netBoat(P, x, y) {
  const { f } = P;
  // a boat at anchor with the square dip-net hung from its long arm
  let s = P.fill(`M${x - 12} ${y - 4}H${x + 12}L${x + 9} ${y}H${x - 9}Z`, '#7a5a3a', { w: .5 });
  s += P.line(`M${x - 6} ${y - 4}L${x + 18} ${y - 26}`, '#5b4532', 1) + P.line(`M${x + 18} ${y - 26}L${x + 22} ${y - 6}M${x + 18} ${y - 26}L${x + 30} ${y - 10}`, '#4a3a2a', .4);
  s += `<path d="M${x + 16} ${y - 6}L${x + 34} ${y - 10}L${x + 34} ${y - 2}L${x + 16} ${y + 2}Z" fill="none" stroke="${P.ink('#4a3a2a')}" stroke-width=".4" stroke-dasharray="1 1"/>`;
  s += P.person(x - 4, y - 3, .45, 'worker', { c: '#4a4a52' });
  return s;
}

// ---------- the quay ----------
function fishStall(P, x, by) {
  const { f } = P;
  let s = '';
  // a trestle with a basket of silver herring, the fishwife in her kerchief and apron
  s += P.fill(`M${x - 22} ${by - 18}h40v3h-40Z`, '#7a5a3a', { w: .6 }) + P.line(`M${x - 19} ${by - 15}L${x - 21} ${by}M${x + 15} ${by - 15}L${x + 17} ${by}`, '#5b4532', 1.4);
  s += P.fill(`M${x - 18} ${by - 18}q8 -10 22 -1Z`, '#b38a52', { w: .55 });
  const r = P.rng(4);
  for (let i = 0; i < 14; i++) { const fx = x - 15 + r() * 16, fy = by - 21 - r() * 4; s += `<path d="M${f(fx)} ${f(fy)}q2.4 -1.4 5 0q-2.4 1.4 -5 0Zl-1.2 -1v2Z" fill="${P.ink(i % 2 ? '#c9d0d4' : '#aeb8be')}" stroke="${P.keyC()}" stroke-width=".3"/>`; }
  s += P.fill(`M${x + 8} ${by - 18}h9l-1 -6h-7Z`, '#9a7a4a', { w: .5 });
  s += P.person(x + 24, by, 1.2, 'peasant', { c: '#4a5a6e', hat: '#c8463a' }) + P.flat(`M${x + 21.4} ${by - 18}h5.2l1 17h-7.2Z`, '#efe9dc', { op: .9 });
  s += P.person(x - 34, by + 2, 1.16, 'worker', { c: '#5a4a3a', dir: 1 });
  return s;
}
function sailorCollar(P, x, y, s) {
  const { f } = P, top = y - 25 * s;
  return `<path d="M${f(x - 2.6 * s)} ${f(top + 7.4 * s)}h${f(5.2 * s)}l${f(-1 * s)} ${f(3 * s)}h${f(-3.2 * s)}Z" fill="${P.ink('#1f3a6e')}"/><path d="M${f(x - 2 * s)} ${f(top + 8.4 * s)}h${f(4 * s)}" stroke="${P.ink('#f2efe6')}" stroke-width="${f(.4 * s)}"/>`;
}
function luggage(P, x, by) {
  let s = P.fill(`M${x - 10} ${by}v-9h16v9Z`, '#6a4a2e', { w: .6 }) + P.line(`M${x - 10} ${by - 5}h16M${x - 4} ${by - 9}v-2h4v2`, '#3a2a1e', .7);
  s += P.fill(`M${x - 6} ${by - 9}v-6h11v6Z`, '#8a3a2e', { w: .5 }) + P.fill(`M${x + 8} ${by}v-7q4 -3 8 0v7Z`, '#4a5a4a', { w: .5 });
  return s;
}
/** A reflection: broken strokes of a building's colour under it, thinning and breaking up with distance. */
function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`;
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
