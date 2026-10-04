// Odessa from the grain harbour: the Boulevard Steps climbing the wooded escarpment between their parapets, the Duc
// de Richelieu in his toga at the top between the two crescent buildings, the Vorontsov colonnade and the City Duma
// along the cliff, the funicular's two cars passing on their loop beside the steps, acacias in flower in June; a
// tram and grain carts on the harbour street, a barque and a Black Sea steamer moored, boats and gulls on the water.

// the steps: their foot on the harbour street and their head at the boulevard
const SB = { y: 300, l: 252, r: 348 }, ST = { y: 168, l: 283, r: 317 };
// the funicular's track, beside them
const FB = { x: 226, y: 300 }, FT = { x: 266, y: 168 };

export default {
  id: 'ODE',
  greet: "SOUVENIR d'ODESSA",
  nation: 'RU',
  flag: 'RU',
  flower: 'acacia',
  flower2: 'sunflower',
  frame: { band: ['#c2a170', '#675a44'], gold: '#e0c070', ink: '#1f3a5a', leaf: ['#7aa056', '#3a6236'], year: '#5a3a1e', halo: '#f8eed4' },
  horizon: 200,
  clouds: 4,
  wind: -1,
  birds: { c: '#f4f3ee', n: 5, y: 112, s: 1.1 },
  pal: {
    key: '#2b2620', ochre: '#e8c27e', ochre2: '#dcae6c', trim: '#f4eedf', steps: '#bdbaa6', steps2: '#9a9784', bronze: '#6f8a6a',
    granite: '#a29a8c', cliff: '#b4a684', water: '#4e7e99', quay: '#c2b598', setts: '#a49882', roof: '#7b8b88', roof2: '#a4583e',
    hull: '#2b2b30', glass: '#374659', sash: '#efe6d3', iron: '#2d3833', gold: '#d8ac3c', tram: '#c9a63a',
  },

  // white acacia: hanging racemes of pea-flowers among feathery leaves
  flowerArt(F) {
    const I = F.I;
    let s = '';
    for (const [a, l] of [[200, 30], [150, 28], [250, 24], [100, 22]]) {
      s += F.at(0, 0, F.stem(`M0 0L0 ${-l}`, I.leaf[1], .9), a);
      for (let k = 1; k < 7; k++) for (const sd of [-1, 1]) s += F.at(0, 0, F.at(0, -l * k / 7, F.leaf(5.5, 3.4, sd * 70, k % 2 ? I.leaf[0] : I.leaf[1], { shape: 'oval', k: .4 })), a);
    }
    const raceme = (x, y, a, n) => { let r = F.stem(`M0 0Q2 ${n * 2} 0 ${n * 3.6}`, '#9aa86a', .8); for (let k = 0; k < n; k++) r += F.at(k % 2 ? 1.6 : -1.6, k * 3.4 + 2, `<path d="M0 0C-2.6 .6 -3 3.6 0 4C3 3.6 2.6 .6 0 0Z" fill="${k > n - 3 ? '#e8efd8' : '#fbf8f0'}" stroke="${I.key}" stroke-width=".4"/>`, k % 2 ? 20 : -20); return F.at(x, y, r, a); };
    s += raceme(-4, -2, 20, 6) + raceme(4, -3, -14, 7) + raceme(0, 0, 2, 5);
    return s;
  },
  // a sunflower, its gold rays round a dark seed-head
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 11, 210, I.leaf[1], { shape: 'heart' }) + F.leaf(14, 10, 150, I.leaf[0], { shape: 'heart' });
    s += F.radial(16, 11, 3.6, '#f2c230', { shape: 'point', rot: 11 }) + F.radial(16, 9, 3.2, '#e8a820', { shape: 'point' });
    s += F.disc(5.6, '#5a3a1e', { dots: '#8a6a2e', n: 12 }) + `<circle r="2.6" fill="#3a2414"/>`;
    return s;
  },

  back(P) {
    let s = '';
    // the city along the cliff top: roofs, a cathedral's dome, the City Duma, the Vorontsov colonnade
    s += P.far(.66, () => P.row(24, 600, 182, { hMin: 16, hMax: 32, wMin: 18, wMax: 30, style: 'paris', seed: 9, walls: ['#e8c27e', '#efe1c0', '#dcae6c', '#e6d2c0'], roofC: '#7b8b88', placard: false, flagSpot: false }));
    s += P.far(.6, () => P.fill(P.rect(110, 136, 26, 34), 'trim') + P.fill(P.dome(123, 136, 14, 14), '#6a9a7a') + P.fill(P.rect(120, 112, 6, 7), 'trim', { w: .4 }) + P.fill(P.onion(123, 112, 8, 9), '#d8ac3c', { w: .4 }) + P.line('M123 103v-5M120.6 100.6h4.8', 'gold', .7) + P.fill(P.rect(104, 150, 38, 22), 'trim', { w: .5 }));
    s += P.far(.5, () => duma(P, 30, 186) + colonnade(P, 448, 184));
    s += P.smoke(160, 160, .5) + P.smoke(560, 172, .55);
    return s;
  },

  mid(P, T) {
    const { f } = P;
    let s = '';
    // the escarpment, its gardens of acacia either side of the steps
    s += P.far(.32, () => cliff(P));
    s += P.far(.28, () => crescents(P) + duke(P, 300, 166));
    s += P.far(.22, () => acacias(P));
    s += P.far(.2, () => stairs(P) + funicular(P));
    // the funicular's two cars, passing on the loop halfway
    const along = (t, dx) => [f(FB.x + (FT.x - FB.x) * t + dx * (1 - Math.abs(t - .5) * 2)), f(FB.y + (FT.y - FB.y) * t), f(1 - t * .48)];
    const pathOf = (rev) => { const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([...along(rev ? 1 - t : t, rev ? -3.2 : 3.2), .1 + t * .45]); } return [[...along(rev ? 1 : 0, 0), 0], ...pts, [...along(rev ? 0 : 1, 0), 1]]; };
    s += P.mover(funCar(P, { s: .95, n: 1 }), { path: pathOf(false), dur: 60, offset: 0 });
    s += P.mover(funCar(P, { s: .95, n: 2 }), { path: pathOf(true), dur: 60, offset: 0 });
    // the harbour street: warehouses, the stairs' foot, the tram and the grain carts
    s += P.far(.12, () => harbourStreet(P));
    // the quay's edge is where the newsboy cries the news and, at war, the soldiers march down to the transports
    s += P.setStreet(320, 30, 570, .9);
    s += P.cross(T.tramSide({ c: 'tram', band: '#f2e8cc', number: '17', s: .8, dir: 1 }), { y: 318, dir: 1, dur: 40, rest: .4, offset: 10 });
    s += P.cross(T.cart({ s: .66, dir: -1, load: '#d8c49a', horse: '#6a4a32', c: '#6b5038' }), { y: 316, dir: -1, dur: 56, rest: .3, offset: 36 });
    s += P.cross(T.walkers({ kinds: ['sailor', 'lady', 'gent'], s: .62, dir: -1, seed: 6 }), { y: 312, dir: -1, dur: 90, offset: 20 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the quay's edge, the harbour water, the barque at the left and a steamer at the right
    s += P.water(322, 380, { seed: 14, shimmer: 7, x0: 140, x1: 440 });
    s += P.fill('M24 318H580V324H24Z', 'quay') + P.lite('M24 318H580V319.6H24Z', 'quay', .3);
    for (let x = 60; x < 580; x += 58) s += P.fill(P.rect(x - 2, 314, 4, 5), '#3a3a38', { w: .4 });
    s += barque(P);
    s += steamer(P);
    s += P.cross(T.rowboat({ s: .9, dir: 1, shirt: '#f2efe6', hull: '#5a4a3a' }), { y: 350, dir: 1, dur: 50, rest: .3, offset: 8, z: 'fore', x0: 140, x1: 460 });
    s += P.cross(T.sail({ s: .74, rig: 'lateen', sailC: '#f0e6cc', hull: '#3a4a5a', dir: -1 }), { y: 340, dir: -1, dur: 80, rest: .4, offset: 40, z: 'fore', x0: 140, x1: 470 });
    s += P.cross(T.tug({ s: .62, dir: -1, house: '#ece4cc', band: '#21468b' }), { y: 366, dir: -1, dur: 46, rest: .5, offset: 24, z: 'fore', x0: 140, x1: 470 });
    return s;
  },
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;

// ---------- the cliff top ----------
function duma(P, x0, by) {
  // the City Duma, the old Exchange, at the boulevard's end: a portico of columns between two wings, a low dome over it
  let s = P.fill(P.rect(x0, by - 34, 76, 34), 'trim') + P.shade(P.rect(x0 + 64, by - 34, 12, 34), 'trim', .15);
  s += P.windows(x0 + 2, by - 30, 18, 24, 2, 2, { arched: true, ww: .45 }) + P.windows(x0 + 56, by - 30, 18, 24, 2, 2, { arched: true, ww: .45 });
  s += P.flat(P.rect(x0 + 22, by - 30, 32, 28), '#5a5450', { op: .45 }) + P.columns(x0 + 24, by - 2, 28, 28, 6, 'trim');
  s += P.fill(P.rect(x0 - 1, by - 37, 78, 4), 'trim', { w: .45 }) + P.fill(P.dome(x0 + 38, by - 37, 11, 9), '#6a9a7a', { w: .5 }) + P.line(`M${x0 + 38} ${by - 49}v-4`, 'gold', .6);
  return s;
}
function colonnade(P, x0, by) {
  // the Vorontsov palace's colonnade, a white half-ring on the edge of the cliff
  let s = P.fill(P.rect(x0, by - 6, 104, 6), 'trim', { w: .5 }) + P.flat(P.rect(x0 + 2, by - 24, 100, 18), '#5a5a58', { op: .55 });
  for (let x = x0 + 4; x < x0 + 102; x += 7) s += P.fill(P.rect(x, by - 24, 3.2, 18), 'trim', { w: .4 });
  s += P.fill(P.rect(x0 - 2, by - 29, 108, 5), 'trim', { w: .5 }) + P.fill(P.rect(x0 + 70, by - 48, 46, 20), 'ochre', { w: .5 }) + P.windows(x0 + 72, by - 46, 42, 14, 4, 1, { ww: .45 });
  return s;
}
function crescents(P) {
  let s = '';
  // the two crescent buildings that embrace the head of the steps: yellow, pilastered, their centres porticoed
  for (const [x0, x1, k] of [[186, 286, -1], [314, 414, 1]]) {
    const top = 120, by = 170;
    s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'ochre') + P.shade(P.rect(k < 0 ? x0 : x1 - 14, top, 14, by - top), 'ochre', .2);
    s += P.windows(x0 + 4, top + 6, x1 - x0 - 8, 38, Math.round((x1 - x0) / 9), 2, { ww: .42, wh: .64 });
    const pc = (x0 + x1) / 2 + k * 6;
    s += P.fill(P.rect(pc - 15, top - 4, 30, by - top + 4), 'ochre') + P.columns(pc - 11, by - 4, 22, 34, 4, 'trim') + P.fill(P.gable(pc - 17, top - 3, 34, 9), 'trim', { w: .5 });
    for (let x = x0 + 9; x < x1 - 4; x += 9) s += P.line(`M${x} ${top + 2}V${by - 2}`, 'ochre2', .5, { op: .7 });
    s += P.fill(P.rect(x0 - 1, top - 2, x1 - x0 + 2, 3), 'trim', { w: .45 }) + P.fill(P.poly([[x0 - 1, top - 2], [x0 + 4, top - 8], [x1 - 4, top - 8], [x1 + 1, top - 2]]), 'roof');
    if (P.L.snow) s += P.flat(P.poly([[x0 - 1, top - 2], [x0 + 4, top - 8], [x1 - 4, top - 8], [x1 + 1, top - 2]]), '#f2f5f8', { op: .8 });
    s += P.wall(x0 + (k < 0 ? 20 : 70), by - 26, 12, 16) + P.flagAt(pc + k * 30, top + 14);
  }
  s += P.flag(236, 116, .7) + P.flag(364, 116, .7);
  return s;
}
/** The Duc de Richelieu in his toga on the granite pedestal, his right hand stretched out toward the harbour. */
function duke(P, cx, by) {
  let s = '';
  s += P.fill(P.rect(cx - 9, by - 6, 18, 6), 'granite', { w: .5 }) + P.fill(P.rect(cx - 6.5, by - 30, 13, 24), 'granite') + P.shade(P.rect(cx + 2, by - 30, 4.5, 24), 'granite', .2) + P.fill(P.rect(cx - 8, by - 32, 16, 3), 'granite', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * 4.6 - 1.4, by - 25, 2.8, 10), '#6a7a6a', { w: .3 });
  // the figure, bronze gone green: the toga's folds, the laurel crown, the outstretched arm
  const b = 'bronze', y = by - 32;
  s += P.fill(`M${cx - 4.6} ${y}L${cx - 5.4} ${y - 14}Q${cx - 5} ${y - 22} ${cx - 2} ${y - 23}H${cx + 2.4}Q${cx + 5} ${y - 22} ${cx + 4.6} ${y - 14}L${cx + 4.4} ${y}Z`, b);
  s += P.lite(`M${cx - 4.2} ${y - 1}L${cx - 4.8} ${y - 14}Q${cx - 4.4} ${y - 20} ${cx - 2.4} ${y - 21}L${cx - 2.6} ${y - 1}Z`, b, .25);
  s += P.line(`M${cx - 2} ${y - 20}Q${cx + 1} ${y - 12} ${cx + 3.6} ${y - 4}M${cx - 3.4} ${y - 8}L${cx - 1} ${y - 1}`, '#4a5e48', .5);
  s += P.fill(`M${cx - 3} ${y - 20}L${cx - 11} ${y - 16.4}L${cx - 11.4} ${y - 18}L${cx - 3.6} ${y - 22.4}Z`, b, { w: .45 });
  s += P.fill(`M${cx + 4} ${y - 20}Q${cx + 7} ${y - 14} ${cx + 5.6} ${y - 8}L${cx + 4.2} ${y - 8.4}Q${cx + 5} ${y - 14} ${cx + 2.6} ${y - 18}Z`, b, { w: .4 });
  s += `<circle cx="${cx}" cy="${y - 25.8}" r="2.7" fill="${P.ink(b)}" stroke="${P.keyC()}" stroke-width=".5"/>` + P.line(`M${cx - 2.6} ${y - 27}q2.6 -2 5.2 0`, '#a8b878', .7);
  return s;
}

// ---------- the escarpment, the steps and the funicular ----------
function cliff(P) {
  let s = '';
  const d = 'M24 168H580V306H24Z';
  s += P.fill(d, 'cliff', { k: false }) + P.stipple(d, 'cliff', 140, { box: [24, 168, 556, 138], op: .4 });
  s += P.line('M24 168.6H580', null, .8);
  // the retaining walls and terraces of the gardens
  for (const [x0, x1, y] of [[40, 230, 224], [370, 570, 230], [60, 220, 270], [380, 560, 268]]) s += P.fill(P.rect(x0, y, x1 - x0, 4), 'granite', { w: .45 });
  if (P.L.snow) s += P.flat(d, '#eef2f5', { op: .6 });
  return s;
}
function acacias(P) {
  const { f } = P, lf = P.L.leaf, st = P.st ?? {}, r = P.rng(12);
  // white acacia in flower in June and early July, then green, gold in autumn, bare in winter
  const bloom = P.L.season === 'spring' || (P.L.season === 'summer' && (st.progress ?? 0) < .3);
  let s = '';
  // the gardens' paths zigzagging down the slope
  s += P.line('M40 196L200 214L60 240L196 262L52 288', '#e2d4ae', 2.2, { op: .8 }) + P.line('M576 196L400 212L560 238L396 262L566 290', '#e2d4ae', 2.2, { op: .8 });
  for (let row = 0; row < 5; row++) {
    const y = 196 + row * 24, t = (y - ST.y) / (SB.y - ST.y), sl = ST.l + (SB.l - ST.l) * t - 30, sr = ST.r + (SB.r - ST.r) * t + 6;
    for (let x = 34 + r() * 24 + (row % 2) * 14; x < 576; x += 30 + r() * 18) {
      if (x > sl - 8 && x < sr + 10) continue;
      const w = 13 + r() * 6 + row * 1.6, yy = y + (r() - .5) * 8, lean = (r() - .5) * 4;
      // a crooked trunk forking into the crown
      s += P.line(`M${f(x)} ${f(yy + w * .55)}q${f(lean)} ${f(-w * .4)} ${f(lean * .6)} ${f(-w * .8)}M${f(x + lean * .5)} ${f(yy + w * .1)}l${f(-w * .3)} ${f(-w * .35)}M${f(x + lean * .5)} ${f(yy + w * .1)}l${f(w * .32)} ${f(-w * .38)}`, '#5b4532', 1.3);
      if (!lf.leaf) continue;
      // an open crown of three or four feathery masses
      const cy = yy - w * .4;
      for (const [dx, dy, k] of [[-.42, .05, .5], [.38, .02, .52], [0, -.3, .6], [r() < .5 ? -.15 : .2, .18, .4]]) {
        const bx = x + dx * w + lean * .5, by = cy + dy * w, rr = w * k;
        s += `<path d="${P.blob(bx, by, rr, rr * .72, 8, Math.round(bx * 7 + by))}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width=".5"/>` + `<path d="${P.blob(bx + rr * .12, by + rr * .22, rr * .7, rr * .38, 6, Math.round(bx + by))}" fill="${P.ink(lf.dark)}" opacity=".6"/>` + `<path d="${P.blob(bx - rr * .25, by - rr * .25, rr * .36, rr * .22, 5, Math.round(bx))}" fill="${P.ink(lf.light)}" opacity=".85"/>`;
      }
      if (bloom) for (let k = 0; k < 7; k++) { const bx = x - w * .6 + r() * w * 1.2, by = cy - w * .3 + r() * w * .5; s += `<path d="M${f(bx - 1.3)} ${f(by)}q1.3 4.4 2.6 0q-1.3 1.4 -2.6 0Z" fill="${P.ink('#fbf9f2')}" stroke="${P.ink('#c9c4b0')}" stroke-width=".3"/>`; }
    }
  }
  return s;
}
function stairs(P) {
  const { f } = P;
  let s = '';
  const at = (t, side) => (side < 0 ? ST.l + (SB.l - ST.l) * t : ST.r + (SB.r - ST.r) * t);
  const yAt = (t) => ST.y + (SB.y - ST.y) * t;
  // the side walls, the flight, its risers crowding together as they climb away; the ten landings
  const body = P.poly([[ST.l, ST.y], [ST.r, ST.y], [SB.r, SB.y], [SB.l, SB.y]]);
  s += P.fill(body, 'steps') + P.stipple(body, 'steps', 50, { box: [SB.l, ST.y, SB.r - SB.l, SB.y - ST.y], op: .3 });
  let risers = '', shades = '';
  const n = 64;
  for (let i = 1; i < n; i++) {
    const t = Math.pow(i / n, 1.25), y = yAt(t), l = at(t, -1), r = at(t, 1);
    risers += `M${f(l)} ${f(y)}H${f(r)}`;
    if (i % 6 === 0) shades += `M${f(l)} ${f(y)}H${f(r)}`;
  }
  s += P.line(risers, 'steps2', .5, { op: .85 }) + P.line(shades, 'steps2', 1.6, { op: .7 });
  if (P.L.snow) s += P.flat(body, '#f2f5f8', { op: .6 });
  // people climbing the steps
  const r = P.rng(22);
  for (let i = 0; i < 9; i++) { const t = .15 + r() * .8, y = yAt(t), x = at(t, -1) + (at(t, 1) - at(t, -1)) * (.2 + r() * .6), k = .3 + t * .45; s += P.person(x, y, k, ['gent', 'lady', 'sailor', 'lady', 'boater'][i % 5], { c: ['#2f3440', '#f2ece0', '#1f2a44', '#e8b9b3', '#3d4a3c'][i % 5], dir: r() < .5 ? 1 : -1 }); }
  // the parapets: granite walls stepping down beside the flight, lamps on their piers
  for (const side of [-1, 1]) {
    const d = P.poly([[at(0, side), ST.y - 3], [at(0, side) + side * 4, ST.y - 3], [at(1, side) + side * 9, SB.y - 6], [at(1, side) + side * 9, SB.y + 2], [at(1, side), SB.y + 2]]);
    s += P.fill(d, 'granite') + P.shade(d, 'granite', side < 0 ? .05 : .2);
    for (const t of [.25, .55, .9]) s += P.far(.3 - t * .2, () => P.lamp(at(t, side) + side * 4, yAt(t) - 3, .3 + t * .4, 'single', { h: 50 }));
  }
  return s;
}
function funicular(P) {
  const { f } = P;
  let s = '';
  // the track on its stone embankment, sleepers across, two rails parting into the passing loop halfway
  const pt = (t, dx) => [FB.x + (FT.x - FB.x) * t + dx, FB.y + (FT.y - FB.y) * t];
  const half = (t) => (1 - t * .48) * 7;
  s += P.fill(P.poly([[...pt(1, -half(1))], [...pt(1, half(1))], [...pt(0, half(0))], [...pt(0, -half(0))]]), 'granite', { w: .45 }) + P.shade(P.poly([[...pt(1, half(1) * .3)], [...pt(1, half(1))], [...pt(0, half(0))], [...pt(0, half(0) * .3)]]), 'granite', .15);
  let sl = '';
  for (let t = .02; t < 1; t += .028) { const w = half(t) * .8, [x, y] = pt(t, 0); sl += `M${f(x - w)} ${f(y)}h${f(w * 2)}`; }
  s += P.line(sl, '#6a5a4a', .7, { op: .8 });
  const loop = (t) => (t > .3 && t < .7 ? 1 : Math.max(0, 1 - Math.abs(t - .5) * 5));
  for (const side of [-1, 1]) for (const g of [-1, 1]) {
    let d = '';
    for (let k = 0; k <= 24; k++) { const t = k / 24, w = (1 - t * .48), [x, y] = pt(t, side * 3.2 * loop(t) * w + g * 1.5 * w); d += `${k ? 'L' : 'M'}${f(x)} ${f(y)}`; }
    s += P.line(d, '#3a3a38', .6);
  }
  s += P.fill(P.rect(FT.x - 12, FT.y - 14, 24, 14), 'trim') + P.fill(P.gable(FT.x - 13, FT.y - 13, 26, 7), 'roof2', { w: .45 }) + P.windows(FT.x - 10, FT.y - 11, 20, 8, 3, 1, { arched: true, ww: .5 });
  s += P.fill(P.rect(FB.x - 22, FB.y - 22, 44, 22), 'trim') + P.fill(P.poly([[FB.x - 24, FB.y - 22], [FB.x, FB.y - 32], [FB.x + 24, FB.y - 22]]), 'roof2', { w: .5 }) + P.fill(P.arch(FB.x - 7, FB.y - 18, 14, 18), '#3a3430') + P.windows(FB.x - 20, FB.y - 18, 10, 10, 1, 1, { arched: true, ww: .6 }) + P.windows(FB.x + 10, FB.y - 18, 10, 10, 1, 1, { arched: true, ww: .6 });
  return s;
}
/** A funicular car seen from below as it climbs away: a varnished box, its windows, the number, a lamp at night. */
function funCar(P, o = {}) {
  const f = P.f, s = o.s ?? 1, W = 20 * s, H = 24 * s, S = (k) => f(k * s);
  let b = P.fill(`M${S(2)} ${S(22)}V${S(6)}Q${S(10)} ${S(1)} ${S(18)} ${S(6)}V${S(22)}Z`, '#8a4a2e', { w: .5 }) + P.lite(`M${S(3)} ${S(21)}V${S(7)}H${S(5)}V${S(21)}Z`, '#8a4a2e', .2);
  b += P.fill(`M${S(2)} ${S(6)}Q${S(10)} ${S(1)} ${S(18)} ${S(6)}L${S(18)} ${S(4.6)}Q${S(10)} ${S(-.4)} ${S(2)} ${S(4.6)}Z`, '#3a3430', { w: .4 });
  const lit = P.L.windows > .2;
  for (const x of [4, 11]) b += `<rect x="${S(x)}" y="${S(8)}" width="${S(5)}" height="${S(6)}" fill="${lit ? P.glow('#ffd88a') : P.ink('glass')}" stroke="${P.ink('#f2e6cc')}" stroke-width="${S(.5)}"/>`;
  b += P.fill(P.rect(4 * s, 15.6 * s, 12 * s, 3.6 * s), '#f2e6cc', { w: .3 }) + `<text x="${S(10)}" y="${S(18.6)}" font-family="Georgia,serif" font-size="${S(3.2)}" text-anchor="middle" fill="${P.ink('#3a2a1e')}">${o.n ?? 1}</text>`;
  b += P.fill(P.rect(1 * s, 21 * s, 18 * s, 2.4 * s), '#2a2622', { w: .4 });
  if (P.L.lamps > .05) b += `<circle cx="${S(10)}" cy="${S(4)}" r="${S(1.4)}" fill="${P.glow('#fff2c0')}"/><circle cx="${S(10)}" cy="${S(4)}" r="${S(5)}" fill="${P.glow('#ffe2a0')}" opacity="${f(.3 * P.L.lamps)}"/>`;
  return { svg: svg(W, H, b), w: W, h: H, ax: W / 2, ay: 22 * s };
}

// ---------- the harbour ----------
function harbourStreet(P) {
  let s = '';
  // warehouses and the customs house either side of the steps' foot, the street's setts
  s += P.facade(24, 304, 70, 40, { c: 'ochre2', roof: 'flat', side: 8, cols: 6, floors: 2, shop: ['#2f4a6a', '#efe2c4'] });
  s += P.facade(94, 304, 64, 32, { c: '#e6d2c0', roof: 'pitch', roofC: 'roof', side: 6, cols: 5, floors: 2 });
  s += P.facade(160, 304, 40, 26, { c: 'ochre', roof: 'flat', side: 5, cols: 3, floors: 2, shop: ['#7a3a2a', '#efe2c4'] });
  s += P.facade(372, 304, 60, 30, { c: '#e6d2c0', roof: 'pitch', roofC: 'roof', side: 6, cols: 5, floors: 2, shop: ['#2f5a4a', '#efe2c4'] });
  s += P.facade(432, 304, 84, 44, { c: 'ochre', roof: 'mansard', roofC: 'roof', side: 8, cols: 7, floors: 3, rh: 10 });
  s += P.facade(516, 304, 64, 36, { c: 'ochre2', roof: 'flat', side: 6, cols: 5, floors: 2, shop: ['#7a5a2a', '#f2e6cc'] });
  s += P.fill('M24 304H580V318H24Z', 'setts', { k: false }) + P.line('M24 304.5H580', '#7a7060', .8);
  let st = '';
  for (let x = 26; x < 580; x += 9) st += `M${x} 306q3 -1 6 0M${x + 4} 310q3 -1 6 0M${x} 314q3 -1 6 0`;
  s += P.line(st, '#8c806a', .45, { op: .6 }) + P.line('M24 312H580M24 314.6H580', '#6d6a66', .7, { op: .7 });
  if (P.L.snow) s += P.flat('M24 304H580V318H24Z', '#eef2f6', { op: .6 });
  // sacks of grain piled at the warehouse doors, porters, idlers at the steps' foot
  for (const [x, n] of [[60, 5], [470, 6]]) for (let i = 0; i < n; i++) s += P.fill(`M${x + i * 6 - 3} 316q0 -6 3 -6q3 0 3 6Z`, '#d6c49a', { w: .35 });
  s += P.crowd(206, 250, 316, 4, { s: .62, seed: 4, kinds: ['gent', 'lady', 'sailor', 'worker'] }) + P.crowd(352, 400, 316, 4, { s: .62, seed: 9, kinds: ['sailor', 'lady', 'gent', 'worker'] });
  s += P.lamp(240, 316, .6, 'single') + P.lamp(360, 316, .6, 'single');
  return s;
}
function barque(P) {
  let s = '';
  // a grain barque at the quay: black hull, three masts, yards across, sails furled
  s += P.fill('M24 330H156L148 352H40Q28 350 24 340Z', 'hull') + P.line('M26 336H152', '#c9b27a', 1) + P.fill('M24 326H158V331H24Z', '#6b5040', { w: .45 });
  for (const [x, top] of [[52, 92], [96, 84], [138, 104]]) {
    s += P.line(`M${x} 328V${top}`, '#4a3a2a', 2.2) + P.line(`M${x} ${top}v-6`, '#4a3a2a', 1);
    for (const [y, w] of [[top + 18, 22], [top + 40, 26], [top + 62, 28], [top + 84, 24]]) if (y < 318) s += P.line(`M${x - w} ${y}H${x + w}`, '#4a3a2a', 1.2) + P.fill(`M${x - w + 2} ${y}h${w * 2 - 4}v2q-${w - 2} 2 -${w * 2 - 4} 0Z`, '#ece4d0', { w: .3 });
  }
  s += P.line('M24 316L52 96M52 96L96 88M96 88L138 108M138 108L158 330M156 330L176 300', '#5a4a3a', .45, { op: .8 });
  s += `<path d="M138 98h9v6h-9Z" fill="${P.ink('#f4f1e8')}"/><path d="M138 100h9v2h-9Z" fill="${P.ink('#1f4fa0')}"/><path d="M138 102h9v2h-9Z" fill="${P.ink('#d4202a')}"/>`;
  return s;
}
function steamer(P) {
  let s = '';
  // a Black Sea steamer of the Russian line moored at the right: its bow, the bridge, the funnel with its band
  s += P.line('M560 330V170M560 190L520 330', '#4a3a2a', 1.4);
  s += P.fill('M498 296L506 238H520L526 296Z', '#1d1a17') + P.flat(P.rect(507, 252, 15, 8), '#f4efe2') + P.flat(P.rect(508, 254, 13, 4), '#21468b');
  s += P.fill('M440 300V286H600V300Z', 'trim', { w: .5 }) + P.windows(446, 288, 150, 9, 10, 1, { ww: .3 });
  s += P.fill('M462 286V276H560V286Z', 'trim', { w: .45 }) + P.windows(466, 277, 90, 8, 6, 1, { ww: .4 });
  s += P.fill('M420 300H600V350H452Q430 340 420 300Z', 'hull') + P.line('M426 312H600', '#c9b27a', 1) + P.line('M444 344H600', '#a8382e', 2.2);
  for (let x = 470; x < 600; x += 12) s += `<circle cx="${x}" cy="320" r="1.6" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#8a9aa8')}"/>`;
  s += P.smoke(512, 236, 1);
  s += P.line('M430 304L424 330', '#3a3a38', .8);
  return s;
}
