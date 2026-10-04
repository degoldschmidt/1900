// Prague from the Franz Embankment: across the Vltava and the white line of the Old Town weir, Charles Bridge runs
// away to Malá Strana with its saints black against the light; the Old Town Bridge Tower stands near on the right;
// over the red roofs and St Nicholas's green dome the Castle's long front and St Vitus with its new west spires;
// Petřín's lookout tower on its green hill. Swans, a timber raft and a skiff on the river, a tram on the embankment.

const WL = 252; // the far waterline

export default {
  id: 'PRG',
  greet: 'POZDRAV z PRAHY',
  nation: 'AH',
  flag: 'AH',
  flower: 'linden',
  flower2: 'rosehip',
  frame: { band: ['#8d6b49', '#4c3f31'], gold: '#d9b862', ink: '#7a1f1a', leaf: ['#82a65e', '#3a5c36'], year: '#7a1f1a', halo: '#f7ead0' },
  horizon: WL,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#2a2624', stone: '#ccb994', stone2: '#a69477', statue: '#3b3633', tower: '#8b7f72', slate: '#4b505a',
    roof: '#b6523b', castle: '#e9ddc2', vitus: '#a29d93', copper: '#5e9b86', wall: '#e8d2a6', wall2: '#dbbf8b', wall3: '#ecd9c8',
    water: '#4e7d86', ground: '#d3c6a8', glass: '#3a4659', sash: '#efe7d6', iron: '#2d3734', gold: '#d5a841', granite: '#9c968a',
  },

  // linden: a cluster of creamy little flowers hanging under its pale wing of a bract, heart-shaped leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(30, 22, 205, I.leaf[1], { shape: 'heart' }) + F.leaf(24, 18, 150, I.leaf[0], { shape: 'heart' });
    s += F.at(0, 0, `<path d="M0 0C3 -6 9 -16 8 -26C12 -18 10 -6 2 2Z" fill="#cfe0a0" stroke="${I.key}" stroke-width=".55"/><path d="M1 -1C5 -9 8 -17 8.6 -24" stroke="#a8c070" stroke-width=".6" fill="none"/>`, 40);
    s += F.stem('M0 0Q-2 6 2 10', I.leaf[1], .8);
    for (const [x, y] of [[2, 10], [-4, 13], [7, 14], [0, 18], [-6, 19], [6, 20], [1, 24]]) s += F.stem(`M2 9L${x} ${y}`, '#9ab060', .5) + F.at(x, y, F.radial(5, 3.6, 3, '#f4ecb8', { shape: 'round', k: .35 }) + `<circle r="1.1" fill="#d8b23a"/>`, x * 20);
    return s;
  },
  // rosehips: glossy red hips with dark crowns, small toothed leaves
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(12, 6, 210, I.leaf[1], { shape: 'serrate' }) + F.leaf(11, 5.4, 150, I.leaf[0], { shape: 'serrate' }) + F.leaf(10, 5, 260, I.leaf[0], { shape: 'serrate' });
    s += F.stem('M0 0Q4 -6 10 -8M0 0Q-2 -7 -6 -10', I.leaf[1], .8);
    for (const [x, y, a] of [[10, -8, 30], [-6, -10, -20], [3, -3, 10]]) s += F.at(x, y, `<ellipse cy="-4" rx="3.4" ry="4.6" fill="#c8362a" stroke="${I.key}" stroke-width=".5"/><ellipse cx="-1.2" cy="-5.6" rx="1" ry="1.6" fill="#f08a6a" opacity=".8"/><path d="M-1.6 -8.6l1.6 1.4l1.6 -1.4M0 -8.4v-1.6" stroke="#3a2a1a" stroke-width=".6" fill="none"/>`, a);
    return s;
  },

  back(P, T) {
    let s = '';
    // Petřín, its lookout tower and the Hunger Wall; the Castle and St Vitus; Malá Strana's roofs and St Nicholas
    s += P.far(.7, () => hill(P));
    s += P.far(.62, () => castle(P));
    s += P.far(.5, () => malaStrana(P));
    s += P.smoke(150, 214, .5) + P.smoke(312, 210, .55);
    // the river and the white line of the weir
    s += P.water(WL, 330, { seed: 5, shimmer: 9, x0: 40, x1: 560 });
    s += reflect(P, 130, 330, WL + 1, 26, '#b6523b', 4) + reflect(P, 470, 540, WL + 1, 50, '#8b7f72', 7);
    s += weir(P);
    if (P.L.snow) { const r = P.rng(6); for (let i = 0; i < 12; i++) { const x = 30 + r() * 540, y = WL + 30 + r() * 44, w = 10 + r() * 28; s += P.fill(`M${P.f(x)} ${P.f(y)}l${P.f(w)} -1l3 2.4l${P.f(-w - 5)} .8Z`, '#eef3f6', { w: .4 }); } }
    // a raft of timber coming down, a skiff, the swans
    s += P.cross(raft(P, { s: .74, dir: 1 }), { y: 296, dir: 1, dur: 160, offset: 20 });
    s += P.cross(T.rowboat({ s: .8, dir: -1, shirt: '#f2efe4', hull: '#4a6a5a' }), { y: 312, dir: -1, dur: 74, offset: 50 });
    s += P.cross(swan(P, { s: 1, dir: -1 }), { y: 322, dir: -1, dur: 130, offset: 10, x0: 60, x1: 470 });
    s += P.cross(swan(P, { s: .86, dir: -1 }), { y: 318, dir: -1, dur: 136, offset: 22, x0: 60, x1: 480 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // Charles Bridge, its arches cut through, the saints on its parapets; the Old Town Bridge Tower at our end
    s += bridge(P);
    s += P.far(.3, () => stFrancis(P, 556, WL - 4));
    s += P.far(.22, () => P.fill(P.rect(478, 236, 50, 34), 'stone2') + P.shade(P.rect(512, 236, 16, 34), 'stone2', .2) + bridgeTower(P, 506, 237));
    // a carriage on the bridge, coming over from Malá Strana
    s += P.mover(T.fiacre({ s: .8, dir: 1, horses: 1, body: '#262a2e', hood: '#2b2826' }), { path: [[150, 229.2, .34, 0, 0], [160, 229.4, .36, .04, 1], [440, 234.6, .74, .7, 1], [456, 235, .78, .76, 0], [456, 235, .78, 1, 0]], dur: 52, offset: 6 });
    // the embankment's parapet, its lamps, the street with the tram
    s += P.fill('M14 330H586V340H14Z', 'granite') + P.lite('M14 330H586V332.4H14Z', 'granite', .3) + P.shade('M14 337.6H586V340H14Z', 'granite', .2);
    for (let x = 30; x < 586; x += 34) s += P.line(`M${x} 332.4V337.6`, '#6e6a62', .5, { op: .6 });
    s += P.paving(340, 380, { vx: 300, seed: 21 });
    s += P.line('M14 358H586', '#6d6a66', 1.1) + P.line('M14 366H586', '#6d6a66', 1.1);
    for (const x of [176, 364]) s += P.lamp(x, 332, .86, 'single', { h: 66 });
    s += P.far(.06, () => P.crowd(200, 300, 344, 4, { s: .76, seed: 8, ...clothes(P) }) + P.crowd(380, 470, 344, 3, { s: .76, seed: 2, ...clothes(P) }));
    s += P.wall(184, 318, 9, 12);
    s += P.setStreet(364, 26, 574, .92);
    s += P.cross(T.tramSide({ s: .94, c: '#9b3030', band: '#efe3c0', number: '17', dir: -1 }), { y: 366, dir: -1, dur: 32, rest: .45, offset: 4 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .8, dir: 1, seed: 3, dresses: ['#f3eee2', '#dfe6c8'], ...clothes(P) }), { y: 348, dir: 1, dur: 92, offset: 30 });
    return s;
  },

  front(P, T) {
    let s = '';
    // a linden on the embankment, a Prague policeman, a lady and her girl feeding the swans
    s += P.tree(60, 352, 2.3, 'round');
    s += P.person(108, 372, 1.12, 'lady', { c: frock(P, '#f1ece2'), parasol: umbrella(P, '#d9e2c8'), dir: -1 }) + P.person(124, 374, .9, 'girl', { c: frock(P, '#e8c6c4'), dir: -1 });
    s += P.person(448, 372, 1.1, 'gent', { c: '#30364a', legs: '#30364a', hat: '#30364a' }) + `<path d="M447 342.6v-3.6" stroke="${P.ink('gold')}" stroke-width="1"/>`;
    s += P.figure(456, 410, 1.08, 'gent', { c: frock(P, '#d9cfb8'), legs: frock(P, '#cfc4ac'), hat: frock(P, '#d8c07a'), arm: 18 }) + P.figure(490, 412, 1.06, 'lady', { c: frock(P, '#e8eef0'), sash: '#c8362a', flowers: ['#f4ecb8', '#c8362a', '#f4ecb8'], parasol: umbrella(P, '#f6f0e2') });
    s += P.cross(T.walkers({ kinds: ['lady', 'gent', 'child'], s: 1.04, dir: -1, seed: 25, dresses: ['#f3eee2', '#e8b9b3'], ...clothes(P) }), { y: 376, dir: -1, dur: 84, offset: 44, z: 'fore' });
    return s;
  },
};

// ---------- the hills over the river ----------
function hill(P) {
  const { f } = P, lf = P.L.leaf;
  // Petřín on the left, the castle's hill running away to the right: grass (snow in winter), woods, orchards
  let s = P.fill(`M10 ${WL}V150Q40 130 78 140Q120 150 150 178Q220 186 330 180Q420 184 470 196L600 210V${WL}Z`, lf.grass);
  for (let i = 0; i < 30; i++) {
    const r = P.rng(i + 3), x = 18 + i * 16, y = 160 + r() * 28 + Math.max(0, (x - 140) * .05) + (x < 150 ? (150 - x) * -.1 : 0);
    if (x > 470) continue;
    if (lf.leaf) {
      s += `<path d="${P.blob(x, y, 8 + r() * 3, 5.6, 7, i)}" fill="${P.ink(i % 3 ? lf.dark : lf.leaf)}" opacity=".88"/>`;
      if (lf.bloom && x < 140) for (let k = 0; k < 4; k++) s += `<circle cx="${f(x - 5 + r() * 10)}" cy="${f(y - 3 + r() * 5)}" r="1.1" fill="${P.ink(lf.bloom)}"/>`;
    } else s += P.line(`M${f(x)} ${f(y + 4)}v-7M${f(x)} ${f(y)}l-3 -3M${f(x)} ${f(y - 1)}l3 -3.6`, '#7a6e64', .7, { op: .8 });
  }
  // the Hunger Wall, crenellated, down the hill
  s += P.line('M42 140L118 214', 'stone2', 2.2) + P.line('M44 139L118 212', 'stone', .8, { dash: '2 1.6' });
  // the lookout tower: an iron lattice, its gallery, the little lantern
  const cx = 64, by = 140, top = 98;
  let lat = `M${cx - 6} ${by}L${cx - 1.6} ${top}M${cx + 6} ${by}L${cx + 1.6} ${top}`;
  for (let k = 1; k < 7; k++) { const y = by - (by - top) * k / 7, w = 6 - 4.4 * k / 7; lat += `M${f(cx - w)} ${f(y)}H${f(cx + w)}M${f(cx - w)} ${f(y)}L${f(cx + w * .9)} ${f(y + (by - top) / 7)}`; }
  s += `<path d="${lat}" fill="none" stroke="${P.keyC()}" stroke-width="1.3"/><path d="${lat}" fill="none" stroke="${P.ink('#7a5a3e')}" stroke-width=".6"/>`;
  s += P.fill(P.rect(cx - 4, top - 3, 8, 3), '#7a5a3e', { w: .4 }) + P.fill(P.rect(cx - 1.6, top - 9, 3.2, 6), '#7a5a3e', { w: .35 }) + P.fill(P.spire(cx, top - 9, 4, 4), 'slate', { w: .3 });
  s += P.flag(cx, top - 13, .5, 'AH', { h: 10 });
  return s;
}
function castle(P) {
  const { f } = P;
  let s = '';
  // St Vitus behind the castle: the twin west spires, the long roof and flying buttresses, the great tower's cap
  const cv = 'vitus';
  for (const x of [222, 238]) {
    s += P.fill(P.rect(x - 5, 128, 10, 54), cv) + P.shade(P.rect(x + 1.6, 128, 3.4, 54), cv, .2) + P.fill(P.gothic(x - 2, 136, 4, 12), '#2e2c2c', { w: .3 });
    s += P.fill(`M${x - 5} 128L${x} 92L${x + 5} 128Z`, cv, { w: .5 }) + P.shade(`M${x} 92L${x + 5} 128H${x + .6}Z`, cv, .22);
    for (let k = 1; k < 6; k++) { const y = 128 - k * 6, w = 5 * (1 - k / 6.4); s += P.line(`M${f(x - w)} ${y}l-1.2 -1.4M${f(x + w)} ${y}l1.2 -1.4`, cv, .8); }
    s += P.fill(P.spire(x - 6, 129, 2.4, 9), cv, { w: .3 }) + P.fill(P.spire(x + 6, 129, 2.4, 9), cv, { w: .3 });
  }
  s += P.fill(P.poly([[244, 160], [252, 140], [318, 140], [328, 160]]), 'slate') + P.lite(P.poly([[252, 140], [318, 140], [319, 143], [251, 143]]), 'slate', .3);
  s += P.fill(P.rect(244, 158, 86, 26), cv) + P.windows(248, 160, 78, 18, 7, 1, { ww: .4, wh: .85, gothic: true, lit: .4 });
  for (let x = 304; x < 334; x += 9) s += P.fill(P.spire(x, 160, 3, 12), cv, { w: .3 }) + `<path d="M${x - 6} 166q3 -7 6 -6" fill="none" stroke="${P.ink(cv)}" stroke-width="1.2"/>`;
  for (let x = 248; x < 330; x += 8) s += P.fill(P.spire(x, 158, 2.4, 8), cv, { w: .3 });
  // the great south tower: its Gothic shaft, the gallery, the baroque cap and lantern
  const tx = 282;
  s += P.fill(P.rect(tx - 9, 112, 18, 72), cv) + P.shade(P.rect(tx + 3, 112, 6, 72), cv, .2) + P.fill(P.gothic(tx - 4, 128, 8, 26), '#2e2c2c', { w: .4 }) + P.line(`M${tx} 132V154`, cv, .5);
  s += P.fill(P.rect(tx - 6, 116, 12, 8), 'gold', { w: .4 }) + P.clock(tx, 120, 3.6, { tz: 0, face: '#e8c45a', rim: '#a37a24' });
  s += P.fill(P.rect(tx - 11, 109, 22, 3), cv, { w: .4 });
  s += P.fill(`M${tx - 10} 109Q${tx - 11} 101 ${tx - 4} 98Q${tx - 6} 94 ${tx - 2} 92H${tx + 2}Q${tx + 6} 94 ${tx + 4} 98Q${tx + 11} 101 ${tx + 10} 109Z`, 'copper', { w: .5 }) + P.shade(`M${tx + 1} 92H${tx + 2}Q${tx + 6} 94 ${tx + 4} 98Q${tx + 11} 101 ${tx + 10} 109H${tx + 3}Z`, 'copper', .2);
  s += P.fill(`M${tx - 2.6} 92Q${tx} 84 ${tx + 2.6} 92Z`, 'copper', { w: .4 }) + P.line(`M${tx} 86v-5`, 'gold', .7);
  // the Castle's long front on the brow of the hill
  s += P.fill(P.rect(120, 166, 136, 22), 'castle') + P.windows(122, 168, 132, 18, 22, 3, { ww: .42, wh: .55, lit: .8 });
  s += P.fill(P.poly([[118, 167], [124, 160], [252, 160], [258, 167]]), 'slate', { w: .5 });
  s += P.fill(P.rect(330, 170, 70, 18), 'castle') + P.windows(332, 172, 66, 14, 10, 2, { ww: .42, wh: .55, lit: .8 }) + P.fill(P.poly([[328, 171], [333, 165], [397, 165], [402, 171]]), 'slate', { w: .5 });
  if (P.L.snow) s += P.flat(P.poly([[118, 167], [124, 160], [252, 160], [258, 167]]), '#f4f7fa', { op: .85 }) + P.flat(P.poly([[244, 160], [252, 140], [318, 140], [328, 160]]), '#f4f7fa', { op: .7 });
  s += P.flag(188, 160, .6, 'AH', { h: 16 });
  return s;
}
function malaStrana(P) {
  const { f } = P;
  let s = '';
  // the roofs of Malá Strana below the castle, St Nicholas's green dome and its belfry
  s += P.row(100, 470, WL - 2, { hMin: 16, hMax: 34, wMin: 14, wMax: 24, style: 'east', seed: 9, walls: ['#e8d2a6', '#dbbf8b', '#ecd9c8', '#e3c7b4'], roofC: '#b6523b', flagSpot: false, placard: false });
  const cx = 186;
  s += P.fill(P.rect(cx - 16, 196, 32, 26), 'wall3') + P.windows(cx - 14, 200, 28, 18, 4, 1, { ww: .4, arched: true, lit: .5 });
  s += P.fill(P.rect(cx - 12, 182, 24, 14), 'wall3', { w: .5 }) + P.windows(cx - 10, 185, 20, 8, 4, 1, { ww: .4, lit: .5 });
  s += P.fill(P.dome(cx, 182, 14, 15), 'copper') + P.shade(`M${cx + 3} 182C${cx + 5} 166 ${cx + 10} 163 ${cx + 14} 182Z`, 'copper', .2);
  s += P.fill(P.rect(cx - 2.6, 159, 5.2, 8), 'copper', { w: .4 }) + P.fill(P.onion(cx, 159, 6, 6), 'copper', { w: .4 }) + P.line(`M${cx} 153v-4`, 'gold', .7);
  const bx = 212;
  s += P.fill(P.rect(bx - 5, 168, 10, 54), 'wall3') + P.shade(P.rect(bx + 1.6, 168, 3.4, 54), 'wall3', .2) + P.windows(bx - 3, 172, 6, 20, 1, 2, { ww: .6, arched: true, lit: .5 });
  s += P.fill(P.dome(bx, 168, 6, 7), 'copper', { w: .45 }) + P.fill(P.onion(bx, 160, 5, 7), 'copper', { w: .4 }) + P.line(`M${bx} 153v-4`, 'gold', .6);
  // the Malá Strana bridge towers at the far end of the bridge
  s += P.fill(P.rect(110, 196, 14, 44), 'tower') + P.fill(P.spire(117, 196, 16, 20), 'slate', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(P.spire(117 + k * 6.6, 197, 3, 8), 'slate', { w: .3 });
  s += P.fill(P.rect(96, 214, 12, 26), 'tower') + P.fill(P.gable(95, 214, 14, 8), 'slate', { w: .4 });
  return s;
}
function weir(P) {
  const { f } = P;
  // the Old Town weir: a long diagonal sill just awash, the water tumbling white over it
  let s = P.flat('M136 266L540 310L540 312.4L136 267.6Z', 'stone2', { op: .55 });
  const r = P.rng(11);
  let foam = '';
  for (let i = 0; i < 70; i++) { const t = r(), x = 138 + t * 400, y = 267.4 + t * 44 + r() * 2.6; foam += `M${f(x)} ${f(y)}q${f(2 + r() * 3)} ${f(.6 + r())} ${f(5 + r() * 6)} ${f(.2)}`; }
  s += `<path d="${foam}" fill="none" stroke="${P.light('#ffffff', 0)}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
  return s;
}

// ---------- the bridge and its tower ----------
function bridge(P) {
  const { f } = P;
  // the deck from Malá Strana (u 0, far, left) to our end (u 1, near, under the tower)
  const at = (u) => ({ x: 124 + 364 * u, top: 228 + 8 * u, deck: 6 + 8 * u, water: WL + 3 + 14 * u });
  const N = 24;
  let d = `M${f(at(0).x)} ${f(at(0).top)}`;
  for (let i = 1; i <= N; i++) { const p = at(i / N); d += `L${f(p.x)} ${f(p.top)}`; }
  d += `L${f(at(1).x)} ${f(at(1).water + 4)}L${f(at(0).x)} ${f(at(0).water)}Z`;
  const piers = [0, .08, .16, .25, .34, .44, .55, .66, .78, .9, 1];
  let holes = '';
  for (let i = 0; i < piers.length - 1; i++) {
    const a = at(piers[i]), b = at(piers[i + 1]), pw = 5 + 7 * piers[i + 1];
    const ax = a.x + pw * .5, bx = b.x - pw * .5, m = at((piers[i] + piers[i + 1]) / 2), cy = m.top + m.deck;
    holes += `M${f(ax)} ${f(a.water)}V${f(cy + (a.water - cy) * .45)}Q${f((ax + bx) / 2)} ${f(cy - 1)} ${f(bx)} ${f(cy + (b.water - cy) * .45)}V${f(b.water)}Z`;
  }
  let s = `<path d="${d}${holes}" fill="${P.ink('stone')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width=".8"/>`;
  s += P.stipple(d, 'stone', 70, { box: [120, 230, 370, 40], op: .3 });
  s += `<path d="${holes}" fill="none" stroke="${P.dark('stone', .35)}" stroke-width="1.4"/>`;
  // the cutwaters of the piers, pointed into the stream, capped below the springing of the arches
  for (const u of piers.slice(1, -1)) {
    const p = at(u), pw = 5 + 7 * u, sp = p.top + p.deck + (p.water - p.top - p.deck) * .5;
    s += P.fill(`M${f(p.x - pw / 2 - 1)} ${f(p.water + 1)}V${f(sp)}L${f(p.x)} ${f(sp - 4 - 3 * u)}L${f(p.x + pw / 2 + 1)} ${f(sp)}V${f(p.water + 1)}Z`, 'stone2', { w: .45 }) + P.shade(P.rect(p.x, sp, pw / 2 + 1, p.water - sp + 1), 'stone2', .2);
  }
  // the parapet and the saints along it, black against the light; lamps between
  let rail = `M${f(at(0).x)} ${f(at(0).top - 3)}`;
  for (let i = 1; i <= N; i++) { const p = at(i / N); rail += `L${f(p.x)} ${f(p.top - 3 - 2 * i / N)}`; }
  for (let i = N; i >= 0; i--) { const p = at(i / N); rail += `L${f(p.x)} ${f(p.top + 1)}`; }
  s += P.fill(rail + 'Z', 'stone', { w: .6 }) + P.lite(rail + 'Z', 'stone', .2, { op: .4 });
  const statues = [.04, .1, .15, .21, .27, .33, .39, .46, .53, .6, .67, .74, .81, .88, .95];
  for (const [i, u] of statues.entries()) {
    const p = at(u), k = .7 + u * .75, y = p.top - 3 - 2 * u;
    s += P.fill(P.rect(p.x - 2 * k, y - 4 * k, 4 * k, 4 * k), 'stone2', { w: .35 });
    s += saint(P, p.x, y - 4 * k, k, i);
  }
  for (const u of [.3, .5, .72, .92]) { const p = at(u); s += P.far(.3 - u * .2, () => P.lamp(p.x + 6, p.top - 3, .3 + u * .25, 'single', { h: 44 })); }
  // people strolling over it
  s += P.far(.3, () => P.crowd(200, 300, 232.4, 6, { s: .34, seed: 41, crisis: false, ...clothes(P) }) + P.crowd(330, 430, 234.6, 5, { s: .42, seed: 43, crisis: false, ...clothes(P) }));
  if (P.L.snow) s += P.flat(rail + 'Z', '#f4f7fa', { op: .6 });
  return s;
}
/** A baroque saint in silhouette: a robed figure, often with a cross or a child, sometimes a group. */
function saint(P, x, by, k, i) {
  const { f } = P, X = (u) => f(x + u * k), Y = (v) => f(by - v * k);
  let s = P.fill(`M${X(-2.6)} ${Y(0)}Q${X(-3.4)} ${Y(7)} ${X(-1.6)} ${Y(11)}Q${X(0)} ${Y(12.6)} ${X(1.6)} ${Y(11)}Q${X(3.4)} ${Y(7)} ${X(2.6)} ${Y(0)}Z`, 'statue', { w: .3 });
  s += `<circle cx="${X(0)}" cy="${Y(13.4)}" r="${f(1.6 * k)}" fill="${P.ink('statue')}"/>`;
  if (i % 3 === 0) s += P.line(`M${X(2.4)} ${Y(4)}V${Y(16)}M${X(1)} ${Y(13.6)}h${f(2.8 * k)}`, 'statue', .8 * k);
  else if (i % 3 === 1) s += P.fill(`M${X(1.4)} ${Y(9)}q${f(3 * k)} ${f(-1 * k)} ${f(3 * k)} ${f(3 * k)}q${f(-2 * k)} ${f(1 * k)} ${f(-3 * k)} ${f(-1 * k)}Z`, 'statue', { w: .25 });
  else s += P.fill(`M${X(-2.4)} ${Y(8)}q${f(-3 * k)} ${f(2 * k)} ${f(-2 * k)} ${f(5 * k)}`, 'statue', { w: .25 });
  if (i === 7) s += `<circle cx="${X(0)}" cy="${Y(14)}" r="${f(2.6 * k)}" fill="none" stroke="${P.ink('gold')}" stroke-width="${f(.6 * k)}"/>`; // Nepomuk's ring of stars
  return s;
}
function bridgeTower(P, cx, by) {
  const { f } = P;
  let s = '';
  const w = 38, side = 12, top = 164;
  // the shaft: its face toward the river lit, its side running back
  s += P.fill(P.poly([[cx - w / 2 - side, by - 6], [cx - w / 2 - side, top + 4], [cx - w / 2, top], [cx - w / 2, by]]), 'tower') + P.shade(P.poly([[cx - w / 2 - side, by - 6], [cx - w / 2 - side, top + 4], [cx - w / 2, top], [cx - w / 2, by]]), 'tower', .18);
  s += P.fill(P.rect(cx - w / 2, top, w, by - top), 'tower') + P.stipple(P.rect(cx - w / 2, top, w, by - top), 'tower', 40, { box: [cx - w / 2, top, w, by - top], op: .35 });
  s += P.fill(P.gothic(cx - w / 2 - side + 2, by - 28, side - 3, 22), '#2a2624', { w: .5 });
  // the decorated stage: coats of arms, statues in niches, tracery
  s += P.fill(P.rect(cx - w / 2 + 3, top + 34, w - 6, 26), 'stone2', { w: .5 });
  for (let k = 0; k < 5; k++) s += P.fill(P.gothic(cx - w / 2 + 4.6 + k * 6.2, top + 37, 4.4, 10), '#5a5048', { w: .3 }) + P.flat(P.rect(cx - w / 2 + 5.8 + k * 6.2, top + 41, 2, 5), 'stone');
  for (let k = 0; k < 4; k++) s += P.fill(`M${cx - 12 + k * 8} ${top + 51}h5v3.6q-2.5 2.6 -5 0Z`, k % 2 ? '#c8a23a' : '#d9d2c2', { w: .35 });
  s += P.windows(cx - 8, top + 10, 16, 18, 2, 1, { ww: .5, wh: .8, gothic: true });
  s += P.fill(P.rect(cx - w / 2 - 1, top + 30, w + 2, 2.4), 'stone2', { w: .35 });
  // the great arch the bridge runs into
  s += P.fill(P.gothic(cx - 9, by - 30, 18, 30), '#2a2624', { w: .6 });
  // the gallery of tracery under the roof
  s += P.fill(P.rect(cx - w / 2 - 2, top - 4, w + 4, 5), 'stone2', { w: .5 });
  for (let x = cx - w / 2; x < cx + w / 2; x += 4.2) s += P.line(`M${f(x)} ${top - 4}v4`, '#5a5048', .5);
  // the roof: a tall slated pyramid with four corner turrets, its gilt points
  s += P.fill(`M${cx - w / 2 - side - 1} ${top}L${cx - 6} ${top - 64}L${cx + w / 2 + 1} ${top - 4}Z`, 'slate') + P.shade(`M${cx - 6} ${top - 64}L${cx + w / 2 + 1} ${top - 4}L${cx + 4} ${top - 2}Z`, 'slate', .22);
  for (let k = 1; k < 5; k++) s += P.line(`M${f(cx - 6 - (w / 2 + side - 5) * k / 5)} ${f(top - 64 + 64 * k / 5)}H${f(cx - 6 + (w / 2 + 7) * k / 5)}`, '#6a707a', .5, { op: .7 });
  s += P.fill(P.gable(cx - 8, top - 26, 8, 8), 'slate', { w: .35 }) + P.fill(P.rect(cx - 6, top - 26, 4, 4), '#2a2624', { w: .25 });
  for (const [x, y, h] of [[cx - w / 2 - side + 1, top + 1, 26], [cx + w / 2 - 1, top - 3, 30], [cx - w / 2 + 1, top - 2, 24]]) s += P.fill(P.rect(x - 2.6, y - 6, 5.2, 7), 'tower', { w: .4 }) + P.fill(P.spire(x, y - 6, 6, h), 'slate', { w: .45 }) + `<circle cx="${x}" cy="${y - 6 - h}" r=".9" fill="${P.ink('gold')}"/>`;
  s += P.line(`M${cx - 6} ${top - 64}v-7`, 'gold', .8) + `<circle cx="${cx - 6}" cy="${top - 72}" r="1.2" fill="${P.ink('gold')}"/>`;
  if (P.L.snow) s += P.flat(`M${cx - w / 2 - side - 1} ${top}L${cx - 6} ${top - 64}L${cx - 4} ${top - 60}L${cx - w / 2 - side + 3} ${top}Z`, '#f4f7fa', { op: .85 });
  s += P.wall(cx - w / 2 + 4, by - 26, 8, 11);
  return s;
}
function stFrancis(P, cx, by) {
  // the Knights of the Cross church beside the tower: its green dome and lantern
  let s = P.fill(P.rect(cx - 26, by - 44, 52, 44), 'wall2') + P.windows(cx - 22, by - 40, 44, 34, 4, 2, { ww: .4, arched: true });
  s += P.fill(P.rect(cx - 14, by - 54, 28, 10), 'wall2', { w: .5 }) + P.fill(P.dome(cx, by - 54, 16, 18), 'copper') + P.shade(`M${cx + 4} ${by - 54}C${cx + 6} ${by - 74} ${cx + 12} ${by - 76} ${cx + 16} ${by - 54}Z`, 'copper', .2);
  s += P.fill(P.rect(cx - 3, by - 84, 6, 9), 'wall2', { w: .4 }) + P.fill(P.dome(cx, by - 84, 4, 4), 'copper', { w: .4 }) + P.line(`M${cx} ${by - 89}v-5M${cx - 2} ${by - 92}h4`, 'gold', .7);
  return s;
}

// ---------- on the water ----------
const svgDoc = (P, w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.f(w)} ${P.f(h)}" width="${P.f(w)}" height="${P.f(h)}">${body}</svg>`;
const facing = (P, dir, w, body) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${body}</g>` : body);
/** A swan gliding, its neck curved. */
function swan(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 26 * s, H = 22 * s, S = (k) => f(k * s);
  let b = `<path d="M${S(2)} ${S(19)}H${S(22)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(.8)}" opacity=".5"/>`;
  b += P.fill(`M${S(3)} ${S(16)}Q${S(1)} ${S(9)} ${S(6)} ${S(10)}Q${S(10)} ${S(6)} ${S(14)} ${S(11)}Q${S(18)} ${S(13)} ${S(19)} ${S(16)}Q${S(12)} ${S(19)} ${S(3)} ${S(16)}Z`, '#f8f6f0', { w: .5 });
  b += P.shade(`M${S(5)} ${S(16)}Q${S(11)} ${S(18)} ${S(18)} ${S(16)}Q${S(12)} ${S(14.6)} ${S(5)} ${S(16)}Z`, '#f8f6f0', .14);
  b += `<path d="M${S(17)} ${S(14)}Q${S(20)} ${S(9)} ${S(18.4)} ${S(5)}Q${S(18)} ${S(2.6)} ${S(20)} ${S(2.4)}" fill="none" stroke="${P.keyC()}" stroke-width="${S(2.4)}" stroke-linecap="round"/><path d="M${S(17)} ${S(14)}Q${S(20)} ${S(9)} ${S(18.4)} ${S(5)}Q${S(18)} ${S(2.6)} ${S(20)} ${S(2.4)}" fill="none" stroke="${P.ink('#f8f6f0')}" stroke-width="${S(1.6)}" stroke-linecap="round"/>`;
  b += `<path d="M${S(20)} ${S(1.8)}l${S(3)} ${S(1.4)}l${S(-3)} ${S(.6)}Z" fill="${P.ink('#e0782e')}"/><circle cx="${S(19.6)}" cy="${S(2.2)}" r="${S(.6)}" fill="${P.ink('#1d1a17')}"/>`;
  return { svg: svgDoc(P, W, H, facing(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 17 * s };
}
/** A timber raft from the Šumava forests: logs lashed in sections, raftsmen at the long steering oars. */
function raft(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 120 * s, H = 30 * s, S = (k) => f(k * s);
  const frame = (st) => {
    let b = P.fill(`M${S(8)} ${S(20)}H${S(114)}L${S(110)} ${S(25)}H${S(12)}Z`, '#8a6a46', { w: .55 });
    for (let x = 12; x < 112; x += 3.4) b += P.line(`M${S(x)} ${S(20.6)}V${S(24.4)}`, '#5b4532', .4);
    for (const x of [38, 76]) b += P.line(`M${S(x)} ${S(20)}V${S(25)}`, '#3a2a1e', .8);
    b += P.fill(`M${S(50)} ${S(20)}V${S(15)}H${S(62)}V${S(20)}Z`, '#a8865a', { w: .4 });
    for (const [x, a] of [[16, st ? -10 : -6], [104, st ? 10 : 6]]) b += P.person(x * s, 20 * s, .52 * s, 'worker', { c: '#d8ccb4', hat: '#4a3a2e', stride: st }) + `<path d="M${S(x)} ${S(13)}L${S(x + a)} ${S(26)}" stroke="${P.ink('#5b4532')}" stroke-width="${S(.9)}"/>`;
    return facing(P, dir, W, b);
  };
  return { frames: [svgDoc(P, W, H, frame(0)), svgDoc(P, W, H, frame(1))], fps: .8, w: W, h: H, ax: W / 2, ay: 23 * s };
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
