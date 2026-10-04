// Zurich from the Rathausbrücke, where the vegetable market stands: up the Limmat between its quays to the lake and
// the snow wall of the Alps. The Grossmünster's twin towers rise over the Limmatquai on the left, a blue tram coming
// down it; on the right the Fraumünster's green needle and St Peter's great clock. A paddle steamer crosses the lake,
// swans keep to the river, market women sell the season's vegetables under their umbrellas.

const HZ = 206, VX = 300; // the lake's far shore; the river's vanishing point

export default {
  id: 'ZUR',
  greet: 'GRUSS aus ZÜRICH',
  nation: 'CH',
  flag: 'CH',
  flower: 'edelweiss',
  flower2: 'alpine-rose',
  frame: { band: ['#a8af64', '#5a613e'], gold: '#dab85e', ink: '#2a3a1a', leaf: ['#88a862', '#3c5a36'], year: '#5a2a1a', halo: '#f7ecd0' },
  horizon: HZ,
  clouds: 3,
  wind: -1,
  birds: { c: '#f5f4ee', n: 3, y: 120, s: .9 },
  pal: {
    key: '#28272a', stone: '#d8cfb7', stone2: '#b5aa8f', slate: '#4f5661', copper: '#5ea58f', wall: '#ede2c4', wall2: '#e3c99e',
    wall3: '#dee3cf', wall4: '#efd7c6', roof: '#aa533d', water: '#4a8993', lake: '#6aa3c1', rock: '#7c8ba0', ground: '#d5c9ac',
    glass: '#37465a', sash: '#efe8d8', iron: '#2c3533', gold: '#d6a93e', hill: '#6e9a5a',
  },

  // edelweiss: woolly white stars of pointed bracts round a knot of little yellow heads, grey felted leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 6, 200, '#8fa284', { shape: 'lance', vein: '#c8d2bc' }) + F.leaf(22, 5.4, 150, '#a2b496', { shape: 'lance', vein: '#d8e0cc' }) + F.leaf(18, 5, 250, '#8fa284', { shape: 'lance', vein: '#c8d2bc' });
    s += F.radial(9, 17, 7, ['#f6f5ee', '#eceae0'], { shape: 'point', lite: '#ffffff' });
    s += F.radial(9, 13, 4, '#dcdcd2', { rot: 20, shape: 'point' }).replace(/fill="#dcdcd2"/g, 'fill="#e6e6dc" opacity=".8"');
    for (const [x, y] of [[0, 0], [-3.6, -2.4], [3.4, -2.6], [-3.4, 2.8], [3.6, 2.6], [0, -4.4], [0, 4.4]]) s += `<circle cx="${x}" cy="${y}" r="2.1" fill="#ece0a6" stroke="${I.key}" stroke-width=".4"/><circle cx="${x - .5}" cy="${y - .5}" r=".7" fill="#f8f2cc"/>`;
    return s;
  },
  // alpine roses: a cluster of small rose-red funnels over dark glossy leaves
  flowerArt2(F) {
    const I = F.I;
    let s = '';
    for (const [a, l] of [[200, 12], [160, 12], [240, 10], [120, 10]]) s += F.leaf(l, 5, a, l > 11 ? '#2f5634' : '#3f6a40', { shape: 'oval' });
    for (const [x, y, a] of [[-4, -6, -20], [3, -8, 10], [8, -3, 40], [-8, -1, -50], [1, -2, 0]]) s += F.at(x, y, F.cup(5.4, 7, '#d8405a', { inner: '#b02a46' }), a);
    return s;
  },

  back(P, T) {
    let s = '';
    // the Alps over the lake, the hills of its shores, the lake with its paddle steamer
    s += P.far(.92, () => alps(P));
    s += P.far(.8, () => shores(P));
    s += P.far(.7, () => P.flat(P.rect(20, HZ, 560, 30), 'lake') + P.lite(P.rect(20, HZ, 560, 3), 'lake', .25) + P.line(`M20 ${HZ}H580`, null, .5));
    s += P.cross(lakeSteamer(P, { s: .42, dir: 1 }), { y: HZ + 20, dir: 1, dur: 120, offset: 16, x0: 150, x1: 450 });
    s += P.cross(T.sail({ s: .3, rig: 'gaff', sailC: '#f4efe2', hull: '#f2eee4', dir: -1 }), { y: HZ + 14, dir: -1, dur: 160, offset: 80, x0: 160, x1: 440 });
    // the river from the lake down to us, and its swans
    s += P.water(HZ + 26, 380, { seed: 13, shimmer: 8, x0: 160, x1: 440 });
    s += reflect(P, 200, 260, HZ + 36, 40, '#d8cfb7', 3) + reflect(P, 360, 420, HZ + 36, 46, '#5ea58f', 6);
    if (P.L.snow) { const r = P.rng(9); for (let i = 0; i < 10; i++) { const x = 200 + r() * 200, y = HZ + 6 + r() * 20, w = 8 + r() * 16; s += P.fill(`M${P.f(x)} ${P.f(y)}l${P.f(w)} -.6l2 1.6l${P.f(-w - 3)} .6Z`, '#eef3f6', { w: .3 }); } }
    s += P.cross(swan(P, { s: 1.1, dir: 1 }), { y: 334, dir: 1, dur: 120, offset: 30, x0: 180, x1: 430 });
    s += P.cross(swan(P, { s: .9, dir: 1 }), { y: 328, dir: 1, dur: 128, offset: 46, x0: 180, x1: 430 });
    s += P.cross(T.rowboat({ s: .66, dir: -1, shirt: '#f2efe4', hull: '#3a5a7a' }), { y: 296, dir: -1, dur: 70, offset: 10, x0: 220, x1: 400 });
    return s;
  },

  mid(P, T) {
    let s = '';
    // the Quaibrücke and the Münsterbrücke across the river
    s += P.far(.6, () => quaiBridge(P));
    // the Bauschänzli, the old bastion in the river, under its chestnuts
    s += P.far(.5, () => P.fill('M330 243L336 238H384L392 243Z', 'stone2', { w: .4 }) + P.tree(342, 241, .5, 'round') + P.tree(360, 240, .56, 'round') + P.tree(378, 241, .5, 'round'));
    s += P.far(.45, () => muensterBridge(P));
    // the right bank: St Peter's great clock, the Fraumünster's needle, the Meisen, the houses of the Schipfe
    s += P.far(.42, () => stPeter(P, 470, 214));
    s += P.far(.36, () => fraumuenster(P, 398, 246));
    s += rightBank(P);
    // the left bank: the Grossmünster's towers over the Wasserkirche and the houses of the Limmatquai
    s += P.far(.36, () => grossmuenster(P, 176, 226));
    s += leftBank(P);
    // the tram coming down the Limmatquai toward us, walkers on the quays
    s += P.mover(T.tram({ number: '4', s: 1.02, c: '#2f5a9a', band: '#f0ead8', dir: -1 }), { path: [[214, 247, .26, 0, 0], [210, 249.6, .28, .04, 1], [150, 290, .56, .36], [150, 290, .56, .46], [86, 334, .9, .72], [56, 356, 1.06, .84, 1], [48, 362, 1.1, .86, 0], [48, 362, 1.1, 1, 0]], dur: 44, offset: 6 });
    s += P.far(.2, () => P.crowd(150, 200, 286, 4, { s: .5, seed: 2, ...clothes(P) }) + P.crowd(410, 460, 288, 4, { s: .5, seed: 5, ...clothes(P) }));
    return s;
  },

  front(P, T) {
    let s = '';
    // the bridge's parapet, the vegetable market's stalls at either end, people at the rail looking at the swans
    s += P.fill('M14 346H586V354H14Z', 'stone') + P.lite('M14 346H586V348H14Z', 'stone', .3) + P.shade('M14 352H586V354H14Z', 'stone', .2);
    for (let x = 22; x < 586; x += 9) s += P.line(`M${x} 348V352`, 'stone2', .8);
    s += P.paving(354, 384, { vx: 300, seed: 31 });
    s += marketStall(P, 96, 372, 1, 3) + marketStall(P, 506, 372, 1, 7);
    s += P.lamp(184, 352, 1, 'single', { h: 70 }) + P.lamp(416, 352, 1, 'single', { h: 70 });
    s += P.person(236, 366, 1.08, 'lady', { c: frock(P, '#f2ede2'), parasol: umbrella(P, '#e8c8cc'), dir: 1 }) + P.person(278, 358.6, 1, 'boater', { c: '#3a4636', dir: -1 });
    s += P.person(318, 358.6, 1.02, 'gent', { c: '#2e323c', dir: -1 }) + P.person(360, 368, .86, 'child', { c: '#c8342e' }) + P.person(376, 366, 1.1, 'lady', { c: frock(P, '#e4e8f0'), dir: -1 });
    s += P.wall(424, 330, 10, 13);
    s += P.setStreet(368, 26, 574, 1);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.02, dir: 1, seed: 9, dresses: ['#f3eee2', '#dce6cf'], ...clothes(P) }), { y: 372, dir: 1, dur: 84, offset: 20, z: 'fore' });
    s += P.cross(T.walkers({ kinds: ['peasant', 'girl'], s: 1, dir: -1, seed: 14, dresses: ['#6a4a8a', '#e8d4c0'], ...clothes(P) }), { y: 376, dir: -1, dur: 96, offset: 60, z: 'fore' });
    return s;
  },
};

// ---------- the far view ----------
function alps(P) {
  const { f } = P, r = P.rng(23);
  // the snow wall: Glärnisch, Tödi and their neighbours. A ridge of peaks and cols; the snow lies above a line that
  // wanders with the slope (lower in winter); the flanks away from the light in shade.
  const peaks = [[96, 196], [128, 178], [150, 186], [178, 160], [196, 170], [222, 150], [246, 164], [268, 140], [290, 156], [312, 146], [336, 166], [356, 134], [380, 152], [404, 146], [430, 170], [452, 160], [480, 178], [512, 168], [546, 186], [600, 192]];
  const ridge = [];
  for (let i = 0; i < peaks.length; i++) {
    ridge.push(peaks[i]);
    const nx = peaks[i + 1];
    if (nx) { const mx = (peaks[i][0] + nx[0]) / 2 + (r() - .5) * 6, my = Math.max(peaks[i][1], nx[1]) + 6 + r() * 8; ridge.push([mx - 4, my - 2 - r() * 3], [mx, my], [mx + 4, my - 1 - r() * 3]); }
  }
  const yA = P.L.snow ? 190 : 174;
  const snowAt = (x, y) => Math.min(Math.max(y, yA + Math.sin(x * .21) * 4 + Math.sin(x * .07) * 5), y + 26);
  let rock = `M84 ${HZ}`;
  for (const [x, y] of ridge) rock += `L${f(x)} ${f(y)}`;
  rock += `L606 ${HZ}Z`;
  let s = P.fill(rock, 'rock', { w: .6 });
  // shade on the right flank of every peak
  let shade = '';
  for (let i = 1; i < ridge.length - 1; i++) { const [x, y] = ridge[i], [nx, ny] = ridge[i + 1]; if (ny > y) shade += `M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}L${f(nx - 3)} ${HZ}L${f(x + 2)} ${HZ}Z`; }
  s += P.flat(shade, P.dark(P.pal.rock, .22), { raw: 1, op: .75 });
  // the snow: ridge forward, the snow line back, jagged
  let snow = 'M' + ridge.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
  for (let i = ridge.length - 1; i >= 0; i--) { const [x, y] = ridge[i]; snow += `L${f(x + (r() - .5) * 2)} ${f(snowAt(x, y) + (r() - .5) * 3)}`; }
  s += `<path d="${snow}Z" fill="${P.ink('#f5f6f8')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  let sshade = '';
  for (let i = 1; i < ridge.length - 1; i++) { const [x, y] = ridge[i], [nx, ny] = ridge[i + 1]; if (ny > y && snowAt(x, y) > y + 2) sshade += `M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}L${f(nx)} ${f(Math.max(ny, snowAt(nx, ny) - 2))}L${f(x + 2)} ${f(snowAt(x, y) - 1)}Z`; }
  s += P.flat(sshade, P.dark('#f5f6f8', .16), { raw: 1, op: .8 });
  // the haze lying along their feet
  s += P.flat(`M84 ${HZ}V${HZ - 16}H606V${HZ}Z`, P.L.sky.low, { raw: 1, op: .5 });
  return s;
}
function shores(P) {
  const { f } = P, lf = P.L.leaf;
  // the hills along the lake, wooded, villages and a church tower on the far shore
  let s = P.fill(`M80 ${HZ}Q140 ${HZ - 22} 210 ${HZ - 14}Q280 ${HZ - 8} 340 ${HZ - 12}Q420 ${HZ - 24} 520 ${HZ - 10}L600 ${HZ}Z`, lf.grass);
  for (let x = 110; x < 520; x += 14) { const y = HZ - 6 - Math.sin(x / 40) * 4; s += lf.leaf ? `<path d="${P.blob(x, y, 7, 4, 6, x)}" fill="${P.ink(lf.dark)}" opacity=".8"/>` : P.line(`M${x} ${y + 3}v-5`, '#7a6e64', .6); }
  for (const x of [190, 236, 300, 352, 410]) s += P.fill(P.rect(x, HZ - 6, 5, 5), 'wall', { w: .3 }) + P.fill(P.gable(x - .5, HZ - 6, 6, 3), 'roof', { w: .3 });
  s += P.fill(P.rect(268, HZ - 14, 3, 12), 'wall', { w: .3 }) + P.fill(P.spire(269.5, HZ - 14, 3.6, 7), 'slate', { w: .3 });
  return s;
}

// ---------- the bridges ----------
function quaiBridge(P) {
  const y = HZ + 26;
  // the Quaibrücke, iron on stone piers, where the river leaves the lake
  let s = P.fill(`M150 ${y - 3}H460V${y + 1}H150Z`, 'stone2', { w: .5 });
  for (let x = 160; x < 460; x += 30) s += P.fill(P.rect(x, y + 1, 4, 4), 'stone2', { w: .3 });
  s += P.line(`M150 ${y - 5}H460`, 'iron', .6) + P.line(`M150 ${y - 3}H460`, 'iron', .4);
  for (const x of [200, 300, 400]) s += P.lamp(x, y - 3, .22, 'single', { h: 40 });
  return s;
}
function muensterBridge(P) {
  const { f } = P, y = 250;
  // the Münsterbrücke: two stone arches from the Wasserkirche to the Fraumünster
  let d = `M200 ${y - 10}H404V${y + 8}H200Z`;
  for (const [a, b] of [[218, 296], [306, 386]]) d += `M${a} ${y + 8}V${y + 2}Q${(a + b) / 2} ${y - 8} ${b} ${y + 2}V${y + 8}Z`;
  let s = `<path d="${d}" fill="${P.ink('stone')}" fill-rule="evenodd" stroke="${P.keyC()}" stroke-width=".6"/>`;
  s += P.line(`M200 ${y - 10}H404`, 'stone2', 1.2) + P.fill(P.rect(296, y - 4, 10, 12), 'stone2', { w: .4 });
  for (let x = 204; x < 402; x += 5) s += P.line(`M${x} ${y - 10}v-2.4`, 'stone2', .6);
  s += P.far(.4, () => P.crowd(220, 380, y - 10, 7, { s: .3, seed: 17, crisis: false, ...clothes(P) }));
  return s;
}

// ---------- the right bank ----------
function stPeter(P, cx, by) {
  const { f } = P;
  let s = '';
  // the tower with the greatest clock face in Europe, its slender spire
  const w = 26, t1 = 104;
  s += P.fill(P.rect(cx - w / 2, t1, w, by - t1), 'wall') + P.shade(P.rect(cx + 6, t1, 7, by - t1), 'wall', .2);
  s += P.windows(cx - 4, by - 40, 8, 26, 1, 2, { ww: .6, wh: .6, arched: true });
  s += P.fill(P.rect(cx - w / 2 - 1, t1 - 3, w + 2, 3), 'wall', { w: .45 });
  s += P.clock(cx, t1 + 16, 11, { tz: 0, face: '#2a2622', rim: '#d6a93e', hands: '#e8c65a' });
  s += P.fill(`M${cx - 10} ${t1 - 3}L${cx - 7} ${t1 - 12}H${cx + 7}L${cx + 10} ${t1 - 3}Z`, 'slate', { w: .5 });
  s += P.fill(`M${cx - 6} ${t1 - 12}L${cx} ${t1 - 42}L${cx + 6} ${t1 - 12}Z`, 'slate', { w: .5 }) + P.shade(`M${cx} ${t1 - 42}L${cx + 6} ${t1 - 12}H${cx + 1}Z`, 'slate', .25);
  s += P.line(`M${cx} ${t1 - 42}v-6`, 'gold', .8) + `<circle cx="${cx}" cy="${t1 - 44}" r="1.1" fill="${P.ink('gold')}"/>`;
  if (P.L.snow) s += P.flat(`M${cx - 6} ${t1 - 12}L${cx} ${t1 - 42}L${cx - 1} ${t1 - 30}L${cx - 4} ${t1 - 12}Z`, '#f4f7fa', { op: .8 });
  return s;
}
function fraumuenster(P, cx, by) {
  const { f } = P;
  let s = '';
  // the church's long roof running back, the square tower and its green needle
  s += P.fill(P.poly([[cx - 40, by - 30], [cx - 30, by - 46], [cx + 2, by - 46], [cx + 6, by - 30]]), 'slate') + P.fill(P.rect(cx - 40, by - 30, 46, 30), 'stone') + P.windows(cx - 37, by - 26, 40, 20, 5, 1, { ww: .45, wh: .8, gothic: true, lit: .6 });
  const w = 16, t1 = 168;
  s += P.fill(P.rect(cx - w / 2, t1, w, by - t1), 'stone') + P.shade(P.rect(cx + 3, t1, 5, by - t1), 'stone', .2) + P.fill(P.gothic(cx - 2.6, t1 + 8, 5.2, 14), '#2e2c2c', { w: .35 });
  s += P.clock(cx, t1 + 30, 4.4, { tz: 0, face: '#f0ead8', rim: '#d6a93e' });
  s += P.fill(P.rect(cx - w / 2 - 1, t1 - 3, w + 2, 3), 'stone', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(P.gable(cx + k * 4 - 4, t1 - 2, 8, 6), 'copper', { w: .35 });
  s += P.fill(`M${cx - 7} ${t1 - 2}L${cx} ${t1 - 72}L${cx + 7} ${t1 - 2}Z`, 'copper', { w: .55 }) + P.shade(`M${cx} ${t1 - 72}L${cx + 7} ${t1 - 2}H${cx + 1}Z`, 'copper', .22) + P.lite(`M${cx - 5} ${t1 - 4}L${cx - .4} ${t1 - 66}L${cx - 2} ${t1 - 4}Z`, 'copper', .25, { op: .7 });
  s += P.line(`M${cx} ${t1 - 72}v-6M${cx - 1.6} ${t1 - 75}h3.2`, 'gold', .7);
  if (P.L.snow) s += P.flat(`M${cx - 7} ${t1 - 2}L${cx} ${t1 - 72}L${cx - 2} ${t1 - 50}L${cx - 5} ${t1 - 2}Z`, '#f4f7fa', { op: .7 });
  return s;
}
function sideFront(o) {
  const k = o.k ?? 1.3, g = (u) => u * (1 + k) / (1 + k * u);
  return (u, v) => { const t = g(u), top = o.t0 + (o.t1 - o.t0) * t, bot = o.b0 + (o.b1 - o.b0) * t; return [o.x0 + (o.x1 - o.x0) * t, top + (bot - top) * v]; };
}
/** A row of house fronts running back along a quay: q maps (u along it, v down it); each house its own colour and roof. */
function quayRow(P, q, houses, o = {}) {
  const { f } = P, side = o.side ?? 1;
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  const shutter = ['#4f7a52', '#5a6a72', '#7a4a3a'];
  let s = '';
  for (const [i, [u0, u1, c, roofH, floors]] of houses.entries()) {
    const lift = (1 - floors / 5) * .3, W = u1 - u0;
    s += P.fill(quad(u0, lift, u1, 1), c) + P.shade(quad(u1 - W * .1, lift, u1, 1), c, .12);
    // the roof, steep, a dormer in it
    const [ax, ay] = q(u0, lift), [bx, by] = q(u1, lift);
    s += P.fill(P.poly([[ax, ay], [bx, by], [bx + side * 1.5, by - roofH * .55], [ax + side * 2, ay - roofH]]), 'roof', { w: .55 });
    if (P.L.snow) s += P.flat(P.poly([[ax, ay - 1], [bx, by - 1], [bx + side * 1.5, by - roofH * .55], [ax + side * 2, ay - roofH]]), '#f4f7fa', { op: .85 });
    const [mx, my] = q(u0 + W * .45, lift);
    s += P.fill(P.rect(mx - 2.4, my - roofH * .62, 4.8, roofH * .4), 'wall', { w: .4 }) + P.fill(P.gable(mx - 3, my - roofH * .62, 6, 3), 'roof', { w: .3 });
    s += P.fill(quad(u0, lift - .012, u1, lift + .012), 'stone2', { w: .35 });
    // floors of windows with shutters, string courses between them
    const cols = W > .15 ? 3 : 2, top = lift + .05, bot = .76, fh = (bot - top) / floors;
    for (let r = 0; r < floors; r++) {
      const v0 = top + r * fh + fh * .18, v1 = v0 + fh * .56;
      if (r) s += P.line(`M${f(q(u0, top + r * fh)[0])} ${f(q(u0, top + r * fh)[1])}L${f(q(u1, top + r * fh)[0])} ${f(q(u1, top + r * fh)[1])}`, 'stone2', .5, { op: .7 });
      for (let k = 0; k < cols; k++) {
        const a = u0 + W * (.12 + k * (.76 / cols)) + W * .04, b = a + W * (.76 / cols) * .5, lit = P.wr() < P.L.windows, tone = P.wr(), sw = (b - a) * .32;
        s += `<path d="${quad(a, v0, b, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".55"/>`;
        if (!lit) s += P.flat(quad(a - sw, v0, a, v1), shutter[(i + k) % 3]) + P.flat(quad(b, v0, b + sw, v1), shutter[(i + k) % 3]);
      }
    }
    // an oriel on some houses, carried over two floors
    if (i % 3 === 1 && floors > 3) s += P.fill(quad(u0 + W * .32, top + fh * .9, u0 + W * .68, top + fh * 2.9), c, { w: .5 }) + P.shade(quad(u0 + W * .6, top + fh * .9, u0 + W * .68, top + fh * 2.9), c, .2) + `<path d="${quad(u0 + W * .38, top + fh * 1.2, u0 + W * .6, top + fh * 1.8)}" fill="${P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`;
    // the ground floor: an arcade or a shop under its awning
    if (i % 2) for (let k = 0; k < 3; k++) { const a = u0 + W * (.08 + k * .3), b = a + W * .24; s += `<path d="${quad(a, .8, b, 1)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#4a3e34')}" stroke="${P.keyC()}" stroke-width=".5"/>`; }
    else {
      s += `<path d="${quad(u0 + W * .08, .82, u1 - W * .08, .98)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#4a3a2c')}" stroke="${P.keyC()}" stroke-width=".5"/>`;
      const n = 5;
      for (let k = 0; k < n; k++) { const a = u0 + W * .05 + (W * .9) * k / n, b = u0 + W * .05 + (W * .9) * (k + 1) / n; s += P.flat(P.poly([q(a, .77), q(b, .77), [q(b, .82)[0] + side * 3, q(b, .82)[1]], [q(a, .82)[0] + side * 3, q(a, .82)[1]]]), k % 2 ? '#f0e8d6' : (i % 4 ? '#3f6a4a' : '#a8342e')); }
    }
  }
  return s;
}
function rightBank(P) {
  const { f } = P;
  // the fronts along the west bank from our end (u 0, off the right edge) to the Meisen by the Fraumünster (u 1)
  const q = sideFront({ x0: 612, x1: 372, t0: 70, t1: 214, b0: 352, b1: 250, k: 1.1 });
  let s = quayRow(P, q, [[0, .22, 'wall2', 22, 5], [.22, .4, 'wall3', 18, 4], [.4, .56, 'wall4', 16, 5], [.56, .7, 'wall', 12, 4], [.7, .82, 'wall2', 10, 4], [.82, 1, 'wall3', 8, 3]], { side: -1 });
  // the quay wall along the water
  s += P.fill(P.poly([q(0, 1), q(1, 1), [q(1, 1)[0] - 4, q(1, 1)[1] + 3], [q(0, 1)[0] - 120, q(0, 1)[1] + 30]]), 'stone2', { w: .5 });
  s += P.wall(f(q(.3, .78)[0]), f(q(.3, .78)[1]), 8, 11) + P.flagAt(f(q(.12, .3)[0]), f(q(.12, .3)[1])) + P.flagAt(f(q(.48, .3)[0]), f(q(.48, .3)[1]));
  return s;
}

// ---------- the left bank ----------
function grossmuenster(P, x0, by) {
  const { f } = P;
  let s = '';
  // the twin towers: square Romanesque stages, then octagons with their round-arched belfries and domed caps
  for (const cx of [x0, x0 + 36]) {
    s += P.fill(P.rect(cx - 12, 128, 24, by - 128), 'stone') + P.shade(P.rect(cx + 4, 128, 8, by - 128), 'stone', .2) + P.stipple(P.rect(cx - 12, 128, 24, by - 128), 'stone', 26, { box: [cx - 12, 128, 24, by - 128], op: .3 });
    s += P.fill(P.arch(cx - 6, 150, 5, 14), '#2e2c2c', { w: .35 }) + P.fill(P.arch(cx + 1, 150, 5, 14), '#2e2c2c', { w: .35 }) + P.fill(P.arch(cx - 3, 182, 6, 16), '#2e2c2c', { w: .35 });
    s += P.fill(P.rect(cx - 13, 126, 26, 3), 'stone2', { w: .45 });
    // the octagon
    s += P.fill(P.poly([[cx - 10, 126], [cx - 10, 108], [cx - 6, 104], [cx + 6, 104], [cx + 10, 108], [cx + 10, 126]]), 'stone') + P.shade(P.poly([[cx + 4, 104], [cx + 6, 104], [cx + 10, 108], [cx + 10, 126], [cx + 4, 126]]), 'stone', .2);
    s += P.fill(P.arch(cx - 2.6, 110, 5.2, 12), '#2e2c2c', { w: .35 }) + P.line(`M${cx - 6} 104V126M${cx + 6} 104V126`, 'stone2', .6);
    s += P.fill(P.rect(cx - 11, 102, 22, 2.6), 'stone2', { w: .4 });
    // the cap: a dome of grey slate and its lantern
    s += P.fill(`M${cx - 9} 102Q${cx - 9} 90 ${cx} 87Q${cx + 9} 90 ${cx + 9} 102Z`, 'slate', { w: .5 }) + P.lite(`M${cx - 7} 100Q${cx - 7} 92 ${cx - 2} 89.6Q${cx - 4} 94 ${cx - 4} 100Z`, 'slate', .3);
    s += P.fill(P.rect(cx - 1.4, 82, 2.8, 5), 'slate', { w: .3 }) + P.line(`M${cx} 82v-4`, 'gold', .6) + `<circle cx="${cx}" cy="77" r=".9" fill="${P.ink('gold')}"/>`;
    if (P.L.snow) s += P.flat(`M${cx - 9} 101Q${cx - 9} 90 ${cx} 87Q${cx + 9} 90 ${cx + 9} 101Q${cx} 96 ${cx - 9} 101Z`, '#f4f7fa', { op: .8 });
  }
  // the minster's roof between and behind, the Wasserkirche at the water with its ridge turret
  s += P.fill(P.poly([[x0 - 12, 196], [x0 + 6, 170], [x0 + 30, 170], [x0 + 48, 196]]), 'roof', { w: .5 });
  s += P.fill(P.rect(x0 + 22, 214, 48, 30), 'stone') + P.windows(x0 + 25, 218, 42, 20, 4, 1, { ww: .45, wh: .8, gothic: true, lit: .6 }) + P.fill(P.poly([[x0 + 20, 215], [x0 + 28, 204], [x0 + 64, 204], [x0 + 72, 215]]), 'roof', { w: .5 });
  s += P.fill(P.rect(x0 + 44, 196, 4, 8), 'stone', { w: .3 }) + P.fill(P.spire(x0 + 46, 196, 5, 10), 'slate', { w: .3 });
  return s;
}
function leftBank(P) {
  const { f } = P;
  // the Limmatquai's fronts from our end (u 0, off the left edge) to the Wasserkirche (u 1)
  const q = sideFront({ x0: -14, x1: 214, t0: 96, t1: 216, b0: 356, b1: 248, k: 1.1 });
  let s = quayRow(P, q, [[0, .2, 'wall4', 24, 5], [.2, .38, 'wall', 20, 4], [.38, .52, 'wall2', 16, 5], [.52, .66, 'wall3', 14, 4], [.66, .8, 'wall', 11, 4], [.8, 1, 'wall4', 8, 3]]);
  // the quay's street, its tram rails, the quay wall to the water
  s += P.fill(P.poly([q(0, 1), q(1, 1), [236, 252], [150, 356]]), 'ground');
  for (const k of [0, 1]) s += P.line(`M${f(208 + k * 4)} ${251}L${f(62 + k * 26)} ${356}`, '#6d6a66', 1);
  s += P.fill(P.poly([[236, 252], [150, 356], [158, 356], [240, 252]]), 'stone2', { w: .5 });
  s += P.wall(f(q(.36, .8)[0]), f(q(.36, .8)[1]), 8, 11) + P.flagAt(f(q(.16, .3)[0]), f(q(.16, .3)[1])) + P.flagAt(f(q(.56, .32)[0]), f(q(.56, .32)[1]));
  for (const [u, sc] of [[.42, .7], [.74, .5]]) { const [x, y] = q(u, 1); s += P.far(.3 - u * .2, () => P.lamp(x + 10 * sc, y + 2, sc, 'single', { h: 64 })); }
  return s;
}

// ---------- the market on the bridge ----------
function marketStall(P, x, by, s, seed) {
  const { f } = P, season = P.L.season, r = P.rng(seed);
  // a trestle under a striped umbrella, baskets of the season's vegetables, the market woman
  let d = P.line(`M${x} ${by - 4}V${by - 46}`, '#5b4532', 1.2);
  d += P.fill(`M${x - 26} ${by - 40}Q${x} ${by - 58} ${x + 26} ${by - 40}Z`, '#f2ece0', { w: .6 });
  for (const k of [-18, -6, 6, 18]) d += P.flat(`M${x} ${by - 52}L${x + k} ${by - 41}L${x + k + 6} ${by - 41}Z`, '#b8402e');
  d += P.line(`M${x - 26} ${by - 40}Q${x} ${by - 58} ${x + 26} ${by - 40}`, null, .6);
  d += P.fill(`M${x - 22} ${by - 16}h44v3h-44Z`, '#7a5a3a', { w: .5 }) + P.line(`M${x - 19} ${by - 13}V${by}M${x + 19} ${by - 13}V${by}`, '#5b4532', 1.3);
  const produce = season === 'spring' ? ['#e8eedc', '#d8445a', '#7ab44e'] : season === 'autumn' ? ['#e07a2a', '#c8342e', '#d8b23a'] : season === 'winter' ? ['#8aa66a', '#c8a878', '#9a7a5a'] : ['#c8262e', '#7ab44e', '#e8c33a'];
  for (const bx of [x - 14, x, x + 14]) {
    d += P.fill(`M${bx - 6} ${by - 16}l1 -5h10l1 5Z`, '#b38a52', { w: .4 });
    for (let i = 0; i < 6; i++) d += `<circle cx="${f(bx - 4 + r() * 8)}" cy="${f(by - 22 - r() * 3)}" r="${f(1.6 + r() * .8)}" fill="${P.ink(produce[i % 3])}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  }
  d += P.fill(`M${x - 30} ${by}l2 -9h10l2 9Z`, '#9a7a4a', { w: .45 }) + `<circle cx="${x - 23}" cy="${by - 10}" r="3" fill="${P.ink(season === 'autumn' ? '#e07a2a' : '#8ab65a')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  d += P.person(x + 30, by + 1, 1.12 * s, 'peasant', { c: seed % 2 ? '#3a4a6a' : '#5a3a4a', hat: '#e8e2d0' }) + P.flat(`M${x + 27.4} ${by - 16}h5.2l1 16h-7.2Z`, '#f0ece0', { op: .9 });
  return d;
}

// ---------- boats and swans ----------
const svgDoc = (P, w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.f(w)} ${P.f(h)}" width="${P.f(w)}" height="${P.f(h)}">${body}</svg>`;
const facing = (P, dir, w, body) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${body}</g>` : body);
/** A paddle steamer of the lake: white, a long saloon, the paddle box with its fan, the tall funnel, the Swiss flag astern. */
function lakeSteamer(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 120 * s, H = 52 * s, S = (k) => f(k * s), L = P.L;
  const glass = () => (L.windows > .2 ? P.glow('#ffd88a') : P.ink('#405060'));
  let b = '';
  b += `<path d="M${S(70)} ${S(4)}V${S(30)}M${S(34)} ${S(12)}V${S(30)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(.9)}"/>`;
  b += P.fill(`M${S(54)} ${S(30)}L${S(55)} ${S(8)}H${S(62)}L${S(63)} ${S(30)}Z`, '#e8d9a8', { w: .5 }) + P.flat(`M${S(55)} ${S(8)}H${S(62)}V${S(12)}H${S(55)}Z`, '#1e1d1f');
  b += P.fill(`M${S(14)} ${S(38)}V${S(29)}H${S(104)}V${S(38)}Z`, '#f4f1ea', { w: .55 });
  for (let i = 0; i < 13; i++) b += `<rect x="${S(17 + i * 6.6)}" y="${S(31)}" width="${S(4)}" height="${S(4.2)}" rx="${S(1)}" fill="${glass()}"/>`;
  b += P.fill(`M${S(12)} ${S(29)}H${S(106)}V${S(27)}H${S(12)}Z`, '#d8cfbe', { w: .4 });
  b += P.fill(`M${S(10)} ${S(27)}H${S(30)}V${S(23)}H${S(10)}Z`, '#e8e2d4', { w: .35 });
  b += P.fill(`M${S(2)} ${S(37)}H${S(116)}L${S(110)} ${S(46)}H${S(8)}Q${S(3)} ${S(44)} ${S(2)} ${S(37)}Z`, '#f6f4ee', { w: .6 }) + `<path d="M${S(5)} ${S(43)}H${S(112)}" stroke="${P.ink('#2a3a5a')}" stroke-width="${S(1.4)}"/>`;
  // the paddle box: a half-round with its fan of slots
  b += P.fill(`M${S(46)} ${S(40)}A${S(12)} ${S(12)} 0 0 1 ${S(70)} ${S(40)}Z`, '#f4f1ea', { w: .55 });
  for (let k = 0; k < 7; k++) { const a = Math.PI * (k + .5) / 7; b += `<path d="M${S(58)} ${S(40)}L${f((58 - Math.cos(a) * 10) * s)} ${f((40 - Math.sin(a) * 10) * s)}" stroke="${P.ink('#b8a46a')}" stroke-width="${S(.7)}"/>`; }
  b += `<path d="M${S(110)} ${S(37)}V${S(24)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.6)}"/><g transform="translate(${S(110)} ${S(24)})"><rect width="${S(6)}" height="${S(6)}" fill="${P.ink('#d4202a')}"/><path d="M${S(2.4)} ${S(1.2)}h${S(1.2)}v${S(1.2)}h${S(1.2)}v${S(1.2)}h${S(-1.2)}v${S(1.2)}h${S(-1.2)}v${S(-1.2)}h${S(-1.2)}v${S(-1.2)}h${S(1.2)}Z" fill="${P.ink('#ffffff')}"/></g>`;
  if (L.lamps > .05) b += `<circle cx="${S(70)}" cy="${S(5)}" r="${S(1.4)}" fill="${P.glow('#fff2c0')}"/>`;
  b += `<path d="M${S(0)} ${S(46)}q${S(-8)} ${S(1)} ${S(-12)} ${S(3)}M${S(112)} ${S(45)}q${S(5)} ${S(2)} ${S(8)} ${S(4)}" stroke="${P.light('#ffffff', 0)}" stroke-width="${S(1.2)}" fill="none" opacity=".7"/>`;
  return { svg: svgDoc(P, W, H, facing(P, dir, W, b)), w: W, h: H, ax: W / 2, ay: 44 * s, puffs: [[dir > 0 ? 58.5 * s : W - 58.5 * s, 8 * s, s * 1.2, false, -dir]] };
}
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
