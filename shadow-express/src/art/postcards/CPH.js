// Kjøbenhavn from the south quay of Nyhavn: across the canal the old houses of the sunny side in their ochre, rust,
// blue and white, gable-dormers and hoist beams over the cellar shops; schooners and a galease moored along their quay,
// the Dannebrog at every stern; at the canal's end the trees of Kongens Nytorv and, beyond the roofs, the Børsen's
// spire of four dragons' tails twisted together. Cyclists on the far quay, a rowboat on the canal, a beer dray, gulls;
// on our side sailors, a fishwife from Gammel Strand, the bollards and a lamp.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const flip = (dir, w, body) => (dir < 0 ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body);
const QUAY = 258; // the far quay's edge

export default {
  id: 'CPH',
  greet: 'HILSEN fra KJØBENHAVN',
  nation: 'DK',
  flag: 'DK',
  flower: 'marguerite',
  flower2: 'red-clover',
  frame: { band: ['#c63e2f', '#692824'], gold: '#dab65e', ink: '#1f3a5a', leaf: ['#79a35c', '#335a36'], year: '#2a3a5a', halo: '#f7ecd2' },
  horizon: 252,
  clouds: 4,
  wind: 1,
  birds: { c: '#f6f5f0', n: 6, y: 104, s: 1.15 },
  pal: {
    key: '#28252a', ochre: '#e0b54c', rust: '#c05c3c', blue: '#5a7aa6', sky: '#9fbcd2', moss: '#7a9e72', chalk: '#eee6d4', rose: '#dc9c86',
    tile: '#a8503a', slate: '#4e5866', copper: '#5a9a84', quay: '#bfb196', hull: '#2b2d30', water: '#4f7a86', glass: '#334250', sash: '#f3ede0', iron: '#283436', gold: '#d7a83c',
  },

  // a marguerite: a ring of long white rays round a golden eye, a jagged leaf
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(24, 9, 212, I.leaf[1], { shape: 'serrate' }) + F.leaf(22, 8, 150, I.leaf[0], { shape: 'serrate' }) + F.leaf(16, 6, 250, I.leaf[0], { shape: 'serrate' });
    s += F.radial(18, 16, 4.8, ['#fbf8ee', '#f2ecdc'], { shape: 'strap', k: .4 }) + F.radial(18, 12, 3.6, '#ffffff', { rot: 10, shape: 'strap', k: .3 });
    s += F.disc(5.4, '#e8b030', { dots: '#b8801c', n: 12, lite: '#f8d870' });
    return s;
  },
  // red clover: a round head of pink-crimson florets over its three leaflets with their pale chevrons
  flowerArt2(F) {
    const I = F.I;
    let s = '';
    for (const a of [210, 150, 180]) s += F.at(0, 6, F.leaf(10, 9, 0, I.leaf[a === 180 ? 1 : 0], { shape: 'oval', vein: '#c8d8b0' }), a);
    s += F.cluster(7, 22, 2, ['#c8406a', '#e0708e', '#b02a5a', '#f09ab0'], { seed: 5 }) + '<path d="M-6 4Q0 8 6 4" fill="none" stroke="#3a6a3a" stroke-width="1.4"/>';
    return s;
  },

  back(P, T) {
    let s = '';
    // beyond the roofs: the Børsen's dragon spire, Kongens Nytorv's trees at the canal's end
    s += P.far(.66, () => borsen(P, 72, 212, 1.15));
    s += P.far(.6, () => P.tree(42, 252, .9, 'round') + P.tree(70, 254, 1, 'round') + P.tree(100, 252, .85, 'round'));
    s += P.smoke(236, 150, .6) + P.smoke(452, 148, .7);
    // the houses of the sunny side
    s += P.far(.3, () => houses(P));
    // their quay: cobbles, a dray, bollards; then the canal
    s += P.fill(P.rect(14, 250, 572, 8), 'quay', { w: .5 });
    for (let x = 30; x < 590; x += 46) s += P.fill(P.rect(x, 252.5, 3, 5), '#2a2a2c', { w: .3 });
    s += P.crowd(120, 560, 251, 12, { s: .5, seed: 9, kinds: ['sailor', 'gent', 'lady', 'worker', 'boater', 'lady', 'sailor'] });
    s += P.cross(cyclist(P, 1, .5, 1), { y: 251, dir: 1, dur: 30, rest: .4, offset: 3, x0: 110 });
    s += P.cross(cyclist(P, -1, .5, 2), { y: 252, dir: -1, dur: 36, rest: .35, offset: 19, x0: 110 });
    s += P.cross(dray(P, -1, .56), { y: 252, dir: -1, dur: 70, rest: .3, offset: 40, x0: 110 });
    s += P.fill(P.rect(14, QUAY, 572, 4), 'quay', { w: .5 }) + P.shade(P.rect(14, QUAY + 2.5, 572, 1.5), 'quay', .3);
    s += P.water(QUAY + 4, 340, { seed: 8, shimmer: 9, x0: 60, x1: 540 });
    s += reflect(P, 110, 560, QUAY + 5, 26, '#e0b54c', 3) + reflect(P, 150, 520, QUAY + 6, 22, '#c05c3c', 7) + reflect(P, 200, 560, QUAY + 8, 18, '#5a7aa6', 11);
    return s;
  },

  mid(P, T) {
    let s = '';
    // the ships moored along the far quay, their hulls mirrored in the canal
    s += reflect(P, 96, 270, 290, 22, '#2f4a3a', 13) + reflect(P, 340, 500, 286, 20, '#2b2d30', 17);
    s += ship(P, 590, 280, 1.15, { masts: 1, hull: '#5a3a2a', band: '#e8e0cc', square: false });
    s += ship(P, 418, 284, 1.3, { masts: 2, hull: '#2b2d30', band: '#e8e0cc', square: true, name: 'ANNA' });
    s += ship(P, 178, 288, 1.4, { masts: 3, hull: '#2f4a3a', band: '#d8b45a', square: false, name: 'KAREN' });
    // a rowboat on the canal, a little steam launch
    s += P.cross(T.rowboat({ s: .95, dir: -1, hull: '#e8e0cc', shirt: '#2a3a5a' }), { y: 318, dir: -1, dur: 64, rest: .3, offset: 12 });
    s += P.cross(launch(P, 1, .8), { y: 300, dir: 1, dur: 44, rest: .5, offset: 30 });
    return s;
  },

  front(P, T) {
    let s = '';
    // our quay: its granite edge, cobbles, bollards, a lamp, a rowboat moored below
    s += P.fill(P.rect(14, 338, 572, 6), 'quay', { w: .6 }) + P.lite(P.rect(14, 338, 572, 1.6), 'quay', .3);
    s += P.paving(344, 382, { c: 'quay', vx: 300, seed: 3 });
    for (const x of [134, 330, 506]) s += bollard(P, x, 346);
    s += P.lamp(250, 350, 1.16, 'bracket', { h: 72 }) + P.flagAt(252, 290);
    s += hut(P, 70, 352);
    s += P.setStreet(364, 30, 570, 1.08);
    // sailors and a fishwife, a lady and her girl, a boy with a toy boat
    s += P.person(160, 366, 1.14, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(176, 367, 1.14, 'sailor', { c: '#e8e4da', legs: '#1f2a44', dir: -1 });
    s += fishwife(P, 416, 368, 1.16);
    s += P.person(452, 368, 1.14, 'lady', { c: '#f2ecdc', parasol: '#d84a3a', dir: -1 }) + P.person(466, 369, .9, 'girl', { c: '#9fbcd2', dir: -1 });
    s += P.person(228, 366, .9, 'child', { c: '#c8463a' });
    s += quayStuff(P);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.12, dir: 1, seed: 7 }), { y: 374, dir: 1, dur: 80, offset: 30, z: 'fore' });
    s += P.cross(cyclist(P, -1, 1.1, 3), { y: 378, dir: -1, dur: 26, rest: .55, offset: 8, z: 'fore' });
    return s;
  },
};

function reflect(P, x0, x1, y0, h, c, seed) {
  const r = P.rng(seed);
  let d = '';
  for (let y = y0 + 1; y < y0 + h; y += 2.6) {
    const k = (y - y0) / h;
    for (let x = x0; x < x1;) { const w = 3 + r() * 12 * (1 - k * .6); if (r() < .6 - k * .4) d += `M${P.f(x + (r() - .5) * 3)} ${P.f(y)}h${P.f(w)}`; x += w + 2 + r() * 8 * (1 + k * 2); }
  }
  return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="1.5" opacity=".5" stroke-linecap="round"/>`;
}

// ---------- the houses ----------
const FRONTS = [
  // [width, storeys, wall, roof kind, gable-dormer]
  [30, 4, 'chalk', 'tile', 1], [26, 3, 'ochre', 'tile', 0], [32, 4, 'rust', 'slate', 1], [24, 3, 'sky', 'tile', 1], [28, 4, 'ochre', 'tile', 0], [34, 5, 'chalk', 'slate', 1],
  [26, 3, 'rose', 'tile', 1], [30, 4, 'blue', 'tile', 0], [24, 3, 'ochre', 'tile', 1], [28, 4, 'moss', 'slate', 1], [32, 4, 'rust', 'tile', 0], [26, 3, 'chalk', 'tile', 1], [30, 4, 'ochre', 'slate', 1],
];
/** The row of the sunny side: plastered fronts, cellar shops down their steps, gable-dormers with hoist beams. */
function houses(P) {
  const f = P.f;
  let s = '', x = 118;
  for (const [i, [w, n, c, roofC, dormer]] of FRONTS.entries()) {
    const fh = 13, h = n * fh + 8, top = 250 - h, rh = 22 + (i % 3) * 4;
    // the roof: steep tiles or slate, a chimney, sometimes a row of little dormers
    s += P.fill(P.poly([[x - 1.5, top + .5], [x + 4, top - rh], [x + w - 4, top - rh], [x + w + 1.5, top + .5]]), roofC, { w: .55 }) + P.shade(P.poly([[x + w * .55, top - rh], [x + w - 4, top - rh], [x + w + 1.5, top + .5], [x + w * .6, top + .5]]), roofC, .15);
    s += P.fill(P.rect(x + w * .7, top - rh - 6, 4, 8), 'rust', { w: .4 });
    if (P.L.snow) s += P.flat(P.poly([[x - 1, top - 2], [x + 4, top - rh], [x + w - 4, top - rh], [x + w + 1, top - 2]]), '#f4f7fa', { op: .85 });
    // the front
    s += P.fill(P.rect(x, top, w, h), c) + P.shade(P.rect(x + w - 3, top, 3, h), c, .18);
    s += P.fill(P.rect(x - .8, top - 1.6, w + 1.6, 2.4), 'chalk', { w: .4 });
    const cols = w > 28 ? 3 : 2;
    s += P.windows(x + 2, top + 4, w - 4, h - 14, cols, n, { ww: .5, wh: .66 });
    // window boxes in the season
    if (P.L.leaf.leaf && i % 2 === 0) for (let q = 0; q < cols; q++) s += P.fill(P.rect(x + 2 + (w - 4) * (q + .25) / cols, top + 4 + (h - 14) * (1 - .2 / n) - 1, (w - 4) * .5 / cols, 1.6), P.L.leaf.leaf, { w: .25 }) + `<circle cx="${f(x + 2 + (w - 4) * (q + .5) / cols)}" cy="${f(top + 4 + (h - 14) * (1 - .2 / n) - 1.6)}" r="1" fill="${P.ink(P.st?.season === 'autumn' ? '#d88a3a' : '#d8303a')}"/>`;
    // the cellar shop: steps down, a striped awning on some
    s += P.fill(P.rect(x + 3, 244, w - 6, 6), '#3a3430', { w: .4 }) + `<rect x="${f(x + 5)}" y="245" width="${f(w - 10)}" height="4" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('glass')}"/>`;
    if (i % 3 === 1) { for (let k = 0; k < 5; k++) s += P.flat(P.poly([[x + 2 + k * (w - 4) / 5, 238], [x + 2 + (k + 1) * (w - 4) / 5, 238], [x + 3 + (k + 1) * (w - 4) / 5, 243], [x + 3 + k * (w - 4) / 5, 243]]), k % 2 ? '#f2ead6' : '#c8463a'); s += P.line(`M${x + 2} 238h${w - 4}l1 5h${-(w - 4)}Z`, null, .4); }
    // the gable-dormer with its hoist door and beam
    if (dormer) {
      const dw = w * .42, dx = x + (w - dw) / 2, dt = top - rh * .78;
      s += P.fill(`M${f(dx)} ${f(top)}V${f(dt + 4)}Q${f(dx)} ${f(dt)} ${f(dx + dw * .3)} ${f(dt - 1)}L${f(dx + dw / 2)} ${f(dt - 6)}L${f(dx + dw * .7)} ${f(dt - 1)}Q${f(dx + dw)} ${f(dt)} ${f(dx + dw)} ${f(dt + 4)}V${f(top)}Z`, c, { w: .5 });
      s += P.fill(P.rect(dx + dw * .32, dt + 3, dw * .36, top - dt - 4), '#4a3a2c', { w: .35 }) + P.line(`M${f(dx + dw / 2)} ${f(dt + 1)}h-5`, '#3a2a1e', 1.2);
    } else s += P.windows(x + 6, top - rh * .7, w - 12, rh * .45, 2, 1, { ww: .4, lit: .5 });
    if (i === 3 || i === 9) s += P.flag(x + w / 2, top - rh - 2, .8, 'DK', { h: 20 });
    if (i % 4 === 2) s += P.flagAt(x + w * .5, top + 20);
    if (i === 6) s += P.wall(x + 6, 226, 12, 14);
    x += w;
  }
  return s;
}

/** The Børsen's tower beyond the roofs: four dragons' tails twisted into a spire, three crowns at its tip. */
function borsen(P, cx, by, s) {
  const f = P.f;
  // the long gabled roof of the Exchange
  let d = P.fill(P.poly([[cx - 44, by + 36], [cx - 34, by + 20], [cx + 34, by + 20], [cx + 44, by + 36]]), 'copper', { w: .5 });
  for (const k of [-28, -14, 14, 28]) d += P.fill(P.poly([[cx + k - 5.5, by + 30], [cx + k - 5.5, by + 22], [cx + k, by + 14], [cx + k + 5.5, by + 22], [cx + k + 5.5, by + 30]]), 'rust', { w: .4 }) + P.fill(P.rect(cx + k - 1.4, by + 20, 2.8, 4), 'glass', { w: .2 });
  // the square base of the spire and its little dome
  d += P.fill(P.rect(cx - 7 * s, by + 2, 14 * s, 20), 'copper', { w: .5 }) + P.shade(P.rect(cx + 2 * s, by + 2, 5 * s, 20), 'copper', .25) + P.fill(P.arch(cx - 2.4 * s, by + 8, 4.8 * s, 9), 'glass', { w: .3 });
  // four dragons, heads down at the corners, their tails twisted up into the spire
  const H = 66 * s;
  for (const k of [-1, 1]) d += P.fill(`M${f(cx + k * 3)} ${f(by + 1)}c${f(k * 4)} -3 ${f(k * 8)} -1 ${f(k * 9)} 3l${f(-k * 3)} 1l${f(-k * 1)} -2Z`, 'copper', { w: .4 }) + `<circle cx="${f(cx + k * 10.4)}" cy="${f(by + 3.4)}" r=".8" fill="${P.ink('gold')}"/>`;
  d += P.fill(`M${f(cx - 6 * s)} ${f(by + 2)}L${cx} ${f(by - H)}L${f(cx + 6 * s)} ${f(by + 2)}Z`, 'copper', { w: .55 });
  let band = '';
  for (let i = 0; i < 14; i++) { const t = i / 14, t2 = (i + .5) / 14, y = by + 2 - t * (H + 2), y2 = by + 2 - t2 * (H + 2), w = (1 - t) * 6 * s, w2 = (1 - t2) * 6 * s; band += `M${f(cx - w)} ${f(y)}L${f(cx + w2)} ${f(y2)}L${f(cx + w2 * .6)} ${f(y2 + 1.4)}L${f(cx - w * .7)} ${f(y + 1.2)}Z`; }
  d += `<path d="${band}" fill="${P.dark('copper', .3)}"/>` + `<path d="${band}" fill="none" stroke="${P.light('copper', .3)}" stroke-width=".4" opacity=".8"/>`;
  for (const k of [.78, .86, .93]) d += P.fill(`M${f(cx - 2.2 * s)} ${f(by - H * k)}l${f(.6 * s)} ${f(-2.2 * s)}l${f(.8 * s)} ${f(1.2 * s)}l${f(.8 * s)} ${f(-1.6 * s)}l${f(.8 * s)} ${f(1.6 * s)}l${f(.8 * s)} ${f(-1.2 * s)}l${f(.6 * s)} ${f(2.2 * s)}Z`, 'gold', { w: .3 });
  d += P.line(`M${cx} ${f(by - H)}v-6`, 'gold', .9) + `<circle cx="${cx}" cy="${f(by - H - 6)}" r="1" fill="${P.ink('gold')}"/>`;
  return d;
}

// ---------- the ships ----------
/** A schooner or galease moored broadside, bow to the left: hull, bowsprit, masts with furled sails, rigging, flags. */
function ship(P, x, wl, s, o) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(wl - k * s), L = 120;
  let d = '';
  const mx = o.masts === 3 ? [-34, 4, 38] : o.masts === 2 ? [-24, 22] : [6];
  const mh = (i) => (o.masts === 1 ? 108 : 132 - i * 6);
  // standing rigging first, behind: shrouds to the rails, stays to the bowsprit
  let rig = '';
  for (const [i, m] of mx.entries()) {
    const top = mh(i);
    for (const k of [-7, -3, 3, 7]) rig += `M${X(m)} ${Y(top * .78)}L${X(m + k)} ${Y(11)}`;
    for (let r = 1; r < 8; r++) { const y = 11 + (top * .78 - 11) * r / 8, w = 7 * (1 - r / 8); rig += `M${X(m - w)} ${Y(y)}H${X(m + w)}`; }
  }
  rig += `M${X(mx[0])} ${Y(mh(0) * .95)}L${X(-L / 2 - 34)} ${Y(18)}M${X(mx[0])} ${Y(mh(0) * .8)}L${X(-L / 2 - 22)} ${Y(16)}`;
  if (mx.length > 1) for (let i = 1; i < mx.length; i++) rig += `M${X(mx[i])} ${Y(mh(i) * .95)}L${X(mx[i - 1])} ${Y(mh(i - 1) * .6)}`;
  rig += `M${X(mx.at(-1))} ${Y(mh(mx.length - 1) * .9)}L${X(L / 2)} ${Y(13)}`;
  d += `<path d="${rig}" stroke="${P.ink('#3a3430')}" stroke-width="${f(.45 * s)}" fill="none" opacity=".85"/>`;
  // masts and topmasts, yards and furled sails
  for (const [i, m] of mx.entries()) {
    const top = mh(i);
    d += P.fill(`M${X(m - 1.4)} ${Y(10)}L${X(m - .9)} ${Y(top * .78)}H${X(m + .9)}L${X(m + 1.4)} ${Y(10)}Z`, '#8a6a46', { w: .4 }) + P.line(`M${X(m)} ${Y(top * .78)}V${Y(top)}`, '#8a6a46', 1.1 * s);
    d += P.fill(P.rect(x + (m - 2) * s, wl - top * .78 * s - 2 * s, 4 * s, 3 * s), '#3a2a1e', { w: .3 });
    if (o.square && i === 0) for (const [y, w] of [[.62, 26], [.8, 20], [.93, 14]]) d += P.line(`M${X(m - w / 2)} ${Y(top * y)}H${X(m + w / 2)}`, '#5a4632', 1 * s) + P.fill(`M${X(m - w / 2)} ${Y(top * y)}Q${X(m)} ${Y(top * y - 3.4)} ${X(m + w / 2)} ${Y(top * y)}Z`, '#ece4d0', { w: .35 });
    // the gaff and boom with the mainsail furled along it
    if (!(o.square && i === 0)) d += P.line(`M${X(m)} ${Y(top * .7)}L${X(m + 30)} ${Y(top * .78)}M${X(m)} ${Y(22)}L${X(m + 34)} ${Y(20)}`, '#5a4632', 1 * s) + P.fill(`M${X(m + 1)} ${Y(23)}Q${X(m + 17)} ${Y(27)} ${X(m + 34)} ${Y(21.5)}L${X(m + 34)} ${Y(19.5)}Q${X(m + 17)} ${Y(23)} ${X(m + 1)} ${Y(20)}Z`, '#ece4d0', { w: .4 });
    if (i === mx.length - 1 && mx.length > 1) d += P.flag(x + m * s, wl - top * s, .45 * s, 'DK', { h: 6 });
  }
  // the hull: black or green, a coloured band, the name on the counter; the bowsprit
  d += P.line(`M${X(-L / 2 + 4)} ${Y(14)}L${X(-L / 2 - 36)} ${Y(19)}`, '#6a4a2e', 2 * s);
  d += P.fill(`M${X(-L / 2)} ${Y(16)}Q${X(-L / 2 - 6)} ${Y(15)} ${X(-L / 2 - 9)} ${Y(18)}Q${X(-L / 2 - 4)} ${Y(6)} ${X(-L / 2 + 4)} ${Y(-1)}H${X(L / 2 - 8)}Q${X(L / 2 + 4)} ${Y(4)} ${X(L / 2 + 5)} ${Y(16)}Z`, o.hull, { w: .65 });
  d += P.fill(`M${X(-L / 2 - 8.6)} ${Y(17.6)}l${f(-3 * s)} ${f(-2.4 * s)}l${f(2 * s)} ${f(-2.4 * s)}Z`, '#d8b45a', { w: .35 });
  for (let i = 0; i < 9; i++) d += `<circle cx="${X(-L / 2 + 14 + i * 10)}" cy="${Y(9)}" r="${f(.9 * s)}" fill="${P.L.windows > .2 && i % 3 === 0 ? P.glow('#ffd88a') : P.ink('#8a8070')}"/>`;
  d += P.line(`M${X(-L / 2 - 5)} ${Y(13.5)}H${X(L / 2 + 3.5)}`, o.band, 1.6 * s) + P.lite(`M${X(-L / 2)} ${Y(16)}H${X(L / 2 + 5)}V${Y(15)}H${X(-L / 2)}Z`, o.hull, .3);
  // the ship's boat on its davits aft
  d += P.fill(`M${X(L / 2 - 26)} ${Y(23)}q${f(6 * s)} ${f(3 * s)} ${f(12 * s)} 0l${f(-1 * s)} ${f(3 * s)}h${f(-10 * s)}Z`, '#e8e0cc', { w: .35 }) + P.line(`M${X(L / 2 - 25)} ${Y(23)}V${Y(27)}h${f(11 * s)}V${Y(23)}`, '#3a2a1e', .5);
  if (o.name) d += `<text x="${X(L / 2 - 14)}" y="${Y(6)}" font-family="Georgia,serif" font-size="${f(3.8 * s)}" font-weight="bold" fill="${P.ink('#e8dcc0')}" text-anchor="middle">${o.name}</text>`;
  // deck clutter: a deckhouse, the wheel, a sailor
  d += P.fill(P.rect(x + (L / 2 - 30) * s, wl - 19 * s, 14 * s, 5 * s), '#e8dcc4', { w: .4 }) + P.person(x + (L / 2 - 8) * s, wl - 14 * s, .5 * s, 'sailor', { c: '#1f2a44' });
  // the stern staff with the Dannebrog
  d += P.flag(x + (L / 2 + 3) * s, wl - 14 * s, .7 * s, 'DK', { h: 14 });
  if (P.L.lamps > .05) { const lx = x + (L / 2 + 1) * s, ly = wl - 18 * s; d += `<circle cx="${f(lx)}" cy="${f(ly)}" r="${f(1.4 * s)}" fill="${P.glow('#ffe2a0')}"/>`; P.glows.push({ x: lx, y: ly, r: 14, depth: P.depth }); }
  return d;
}

// ---------- what moves ----------
function cyclist(P, dir, s, kind = 1) {
  const W = 34 * s, H = 34 * s, S = (k) => P.f(k * s), f = P.f;
  const coat = ['#2f3440', '#c8463a', '#e8e4da'][kind - 1], lady = kind === 2;
  const frame = (st) => {
    let b = '';
    const wheel = (cx) => `<circle cx="${S(cx)}" cy="${S(27)}" r="${S(6)}" fill="none" stroke="${P.ink('#1f1f22')}" stroke-width="${S(1.1)}"/><path d="M${S(cx - 6)} ${S(27)}H${S(cx + 6)}M${S(cx)} ${S(21)}V${S(33)}" stroke="${P.ink('#8a8a8a')}" stroke-width="${S(.3)}"/>`;
    b += wheel(8) + wheel(26);
    b += P.line(`M${S(8)} ${S(27)}L${S(14)} ${S(18)}H${S(23)}L${S(26)} ${S(27)}M${S(14)} ${S(18)}L${S(17)} ${S(27)}L${S(23)} ${S(18)}M${S(23)} ${S(18)}L${S(24)} ${S(14)}`, '#1f1f22', .9 * s);
    const k = st ? 1 : -1;
    b += P.line(`M${S(15)} ${S(15)}L${S(18 + k * 2)} ${S(21)}L${S(17 + k * 3)} ${S(27 - k * 2)}`, lady ? coat : '#2a2a30', 2 * s);
    if (lady) b += P.fill(`M${S(12)} ${S(11)}L${S(10)} ${S(22)}Q${S(15)} ${S(24)} ${S(20)} ${S(21)}L${S(17)} ${S(11)}Z`, '#f2ecdc', { w: .4 });
    b += P.fill(`M${S(13)} ${S(16)}L${S(15)} ${S(7)}H${S(19)}L${S(22)} ${S(14)}L${S(19)} ${S(16)}Z`, coat, { w: .45 }) + P.line(`M${S(19)} ${S(9)}L${S(24)} ${S(14)}`, coat, 1.4 * s);
    b += `<circle cx="${S(17.6)}" cy="${S(4.6)}" r="${S(2.3)}" fill="${P.ink('#e8c4a0')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
    b += kind === 3 ? `<path d="M${S(14.4)} ${S(3)}h${S(6.4)}M${S(15.6)} ${S(3)}v${S(-1.8)}h${S(4)}v${S(1.8)}" stroke="${P.ink('#c9b071')}" stroke-width="${S(.9)}" fill="none"/>` : lady ? `<path d="M${S(12.6)} ${S(3.6)}q${S(5)} ${S(-5)} ${S(10)} 0Z" fill="${P.ink('#f2ecdc')}" stroke="${P.keyC()}" stroke-width=".4"/>` : `<path d="M${S(15.4)} ${S(3.4)}q${S(2.2)} ${S(-3)} ${S(4.4)} 0h${S(1.4)}Z" fill="${P.ink('#2a2826')}"/>`;
    return flip(dir, f(W), b);
  };
  return { frames: [frame(0), frame(1)].map((b) => doc(f(W), f(H), b)), fps: 3, w: W, h: H, ax: W / 2, ay: 33 * s };
}
/** A brewery dray: barrels on a long wagon, two heavy horses, the drayman up on the box. */
function dray(P, dir, s) {
  const W = 90 * s, H = 40 * s, S = (k) => P.f(k * s), f = P.f;
  const leg = (x, a, c) => P.line(`M${S(x)} ${S(24)}l${S(a)} ${S(12)}`, c, 2.4 * s);
  const frame = (st) => {
    let b = P.fill(`M${S(4)} ${S(30)}V${S(25)}H${S(44)}V${S(30)}Z`, '#5a6a3a', { w: .5 });
    for (const [x, y] of [[8, 19], [17, 19], [26, 19], [35, 19], [12.5, 12], [21.5, 12], [30.5, 12]]) b += P.fill(P.ellipse(x * s, y * s, 4.4 * s, 3.6 * s), '#8a6438', { w: .4 }) + P.line(`M${S(x - 4.4)} ${S(y)}h${S(8.8)}`, '#4a3424', .5);
    b += P.fill(P.rect(40 * s, 13 * s, 5 * s, 8 * s), '#2a2c34', { w: .35 }) + `<circle cx="${S(42.5)}" cy="${S(10.4)}" r="${S(2)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(40.4)} ${S(9.4)}h${S(4.2)}v${S(-2)}h${S(-4.2)}Z" fill="${P.ink('#2a2622')}"/>`;
    for (const wx of [10, 38]) b += `<circle cx="${S(wx)}" cy="${S(33)}" r="${S(5)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1.2)}"/>`;
    const a = st ? 3 : -2.4;
    for (const [hx, c] of [[66, '#5a3a24'], [60, '#7a4e30']]) {
      b += leg(hx - 10, -a, c) + leg(hx + 6, a, c);
      b += P.fill(`M${S(hx - 14)} ${S(24)}Q${S(hx - 15)} ${S(15)} ${S(hx - 6)} ${S(15)}H${S(hx + 6)}L${S(hx + 12)} ${S(6)}L${S(hx + 17)} ${S(9)}L${S(hx + 12)} ${S(18)}Q${S(hx + 10)} ${S(25)} ${S(hx + 2)} ${S(25)}Z`, c, { w: .5 });
      b += P.line(`M${S(hx - 12)} ${S(25)}l${S(-1)} ${S(11)}M${S(hx + 4)} ${S(25)}l${S(1)} ${S(11)}`, c, 2.6 * s) + P.line(`M${S(hx - 12)} ${S(35)}h${S(3)}M${S(hx + 4)} ${S(35)}h${S(3)}`, '#e8e2d2', 1.6 * s);
    }
    b += P.line(`M${S(44)} ${S(20)}L${S(52)} ${S(18)}`, '#3a2a1e', .8 * s);
    return flip(dir, f(W), b);
  };
  return { frames: [frame(0), frame(1)].map((b) => doc(f(W), f(H), b)), fps: 3, w: W, h: H, ax: W / 2, ay: 37 * s };
}
/** A little steam launch, its brass funnel and awning, a pennant. */
function launch(P, dir, s) {
  const W = 50 * s, H = 30 * s, S = (k) => P.f(k * s), f = P.f;
  let b = P.fill(`M${S(22)} ${S(20)}V${S(7)}H${S(26)}V${S(20)}Z`, '#d8a83a', { w: .45 }) + P.flat(`M${S(22)} ${S(7)}H${S(26)}V${S(9)}H${S(22)}Z`, '#2a2622');
  b += P.fill(`M${S(8)} ${S(14)}H${S(20)}V${S(12)}H${S(8)}Z`, '#f2ead6', { w: .35 }) + P.line(`M${S(9)} ${S(14)}V${S(21)}M${S(19)} ${S(14)}V${S(21)}`, '#3a2a1e', .5 * s);
  b += `<circle cx="${S(12)}" cy="${S(17.4)}" r="${S(1.6)}" fill="${P.ink('#e2bf9c')}"/><circle cx="${S(16)}" cy="${S(17.4)}" r="${S(1.6)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(10.2)} ${S(16.4)}h${S(3.6)}M${S(14.2)} ${S(16.4)}h${S(3.6)}" stroke="${P.ink('#c9b071')}" stroke-width="${S(.9)}"/>`;
  b += P.fill(`M${S(2)} ${S(21)}H${S(48)}L${S(44)} ${S(27)}H${S(8)}Q${S(3)} ${S(25)} ${S(2)} ${S(21)}Z`, '#f2ede0', { w: .5 }) + P.line(`M${S(4)} ${S(23)}H${S(46)}`, '#2f5a8a', .8 * s);
  b += P.line(`M${S(4)} ${S(21)}V${S(11)}`, '#3a2a1e', .5 * s) + `<path d="M${S(4)} ${S(11)}l${S(-6)} ${S(1.6)}l${S(6)} ${S(1.6)}Z" fill="${P.ink('#c8102e')}"/>`;
  return { svg: doc(f(W), f(H), flip(dir, f(W), b)), w: W, h: H, ax: W / 2, ay: 26 * s, puffs: [[dir > 0 ? 24 * s : W - 24 * s, 6 * s, .6 * s, false, -dir]] };
}

// ---------- our quay ----------
/** Barrels and a crate, a coil of rope, an old anchor, a fisherman mending his net on the cobbles. */
function quayStuff(P) {
  let d = '';
  for (const [x, by] of [[118, 356], [128, 357], [123, 347]]) d += P.fill(`M${x - 4.6} ${by}q-1.6 -5.4 0 -10.8h9.2q1.6 5.4 0 10.8Z`, '#8a6438', { w: .5 }) + P.line(`M${x - 4.8} ${by - 2.6}h9.6M${x - 4.8} ${by - 8.2}h9.6`, '#3a2a1e', .6);
  d += P.fill(P.rect(134, 346, 16, 11), '#a88452', { w: .5 }) + P.line('M134 351.5h16M142 346v11', '#6a4a2e', .5);
  d += `<ellipse cx="212" cy="358" rx="9" ry="3" fill="none" stroke="${P.ink('#b8a070')}" stroke-width="2"/><ellipse cx="212" cy="357" rx="5" ry="1.6" fill="none" stroke="${P.ink('#a08860')}" stroke-width="1.4"/>`;
  d += P.line('M548 360V340M540 344h16M540 344q8 22 16 0', '#3a3634', 2.2);
  d += P.fill('M374 362l-6 -10h22l-4 10Z', '#6a7a5a', { w: .4 });
  let net = '';
  for (let k = 0; k < 6; k++) net += `M${360 + k * 4} 362q2 -6 4 0`;
  d += P.line(net, '#5a6a5a', .5) + P.person(394, 362, 1.06, 'worker', { c: '#3a4a5a', hat: '#2a2826', dir: -1 });
  return d;
}
/** The harbour master's hut: tarred boards, a window, a door, bills pasted on its end in the crisis. */
function hut(P, x, by) {
  let d = P.fill(P.rect(x, by - 34, 40, 34), '#3a3430', { w: .6 }) + P.shade(P.rect(x + 30, by - 34, 10, 34), '#3a3430', .2);
  for (let k = 1; k < 8; k++) d += P.line(`M${x} ${by - k * 4.4}h40`, '#2a2624', .4, { op: .7 });
  d += P.fill(P.poly([[x - 3, by - 33], [x + 20, by - 46], [x + 43, by - 33]]), 'tile', { w: .55 });
  if (P.L.snow) d += P.flat(P.poly([[x - 2, by - 34], [x + 20, by - 46], [x + 42, by - 34]]), '#f4f7fa', { op: .9 });
  d += P.fill(P.rect(x + 4, by - 26, 10, 26), '#5a3a2a', { w: .4 }) + `<rect x="${x + 20}" y="${by - 26}" width="12" height="10" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".8"/>`;
  d += P.line(`M${x + 26} ${by - 26}v10M${x + 20} ${by - 21}h12`, 'sash', .5) + P.wall(x + 21, by - 13, 11, 12);
  d += P.fill(P.rect(x + 1, by - 40, 18, 5), 'chalk', { w: .35 }) + `<text x="${x + 10}" y="${by - 36.4}" font-family="Georgia,serif" font-size="3.4" font-weight="bold" text-anchor="middle" fill="${P.ink('#1f3a5a')}">HAVNEN</text>`;
  return d;
}
function bollard(P, x, by) {
  return P.fill(`M${x - 4} ${by}V${by - 7}Q${x - 4} ${by - 10} ${x} ${by - 10}Q${x + 4} ${by - 10} ${x + 4} ${by - 7}V${by}Z`, '#2c2c2e', { w: .6 }) + P.fill(P.rect(x - 5.4, by - 9, 10.8, 2), '#2c2c2e', { w: .4 });
}
/** A fishwife from Gammel Strand: striped skirt, shawl, the white kerchief, her basket of herring. */
function fishwife(P, x, by, s) {
  const f = P.f;
  let d = P.person(x, by, s, 'peasant', { c: '#8a3a2e', top: '#2a3a5a', hat: '#f4f2ea', dir: -1 });
  for (let k = 0; k < 3; k++) d += P.line(`M${f(x - 4.6 * s)} ${f(by - (3 + k * 4) * s)}h${f(9.2 * s)}`, '#e8dcc0', .6 * s);
  d += P.fill(`M${f(x + 3 * s)} ${f(by - 14 * s)}h${f(9 * s)}l${f(-1.2 * s)} ${f(6 * s)}h${f(-6.6 * s)}Z`, '#a88452', { w: .45 });
  for (let i = 0; i < 4; i++) d += `<ellipse cx="${f(x + (4.6 + i * 2) * s)}" cy="${f(by - 14.6 * s)}" rx="${f(1.5 * s)}" ry="${f(.7 * s)}" fill="${P.ink('#c8ccd4')}"/>`;
  return d;
}
