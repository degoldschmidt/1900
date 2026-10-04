// Rome from the Via Sacra: the Colosseum fills the middle, its high north wall in four orders curving away on the
// left, broken off at Valadier's brick buttress, the lower inner ring beyond and the far wall's arcades showing over
// it; on the right the Arch of Constantine with its Dacian captives, the brick cone of the Meta Sudans, and the
// umbrella pines of the Palatine. Santa Francesca Romana's campanile at the left. Carrozzelle, a tram on the road
// round the amphitheatre, priests, red-robed seminarians, swallows.

const D2R = Math.PI / 180;
const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'ROM',
  greet: 'SALUTI da ROMA',
  nation: 'IT',
  flag: 'IT',
  flower: 'laurel',
  flower2: 'acanthus',
  frame: { band: ['#9f5738', '#553528'], gold: '#dcb766', ink: '#2a1a10', leaf: ['#7a9a5a', '#3a5a36'], year: '#6a2a1a', halo: '#f8ead0' },
  horizon: 262,
  clouds: 3,
  wind: 1,
  pal: {
    key: '#2c2520', trav: '#e2cda4', trav2: '#bfa47a', brick: '#b87450', marble: '#ece3cf', giallo: '#d8b558', porph: '#7e3e3a',
    ground: '#d8c59c', basalt: '#77716a', wall: '#ecd6ae', wall2: '#e4bf96', wall3: '#efe1c6', roof: '#b45e3e',
    glass: '#39495b', sash: '#f0e6d1', iron: '#2c3631', gold: '#d6aa3e',
  },

  // a laurel sprig: pairs of dark glossy leaves, small cream flowers and black berries
  flowerArt(F) {
    const I = F.I;
    let s = F.stem('M-16 14Q-2 4 14 -14', '#4a6a3a', 1.3);
    for (const [x, y, a, l] of [[-12, 11, 200, 16], [-12, 11, 300, 14], [-4, 5, 190, 18], [-4, 5, 320, 17], [4, -2, 215, 18], [4, -2, 330, 16], [11, -10, 260, 15], [11, -10, 350, 13]]) s += F.at(x, y, F.leaf(l, 6.4, a - 270, a % 2 ? '#3d6a3a' : '#2f5a32', { shape: 'lance', vein: '#9ab87a' }));
    for (const [x, y] of [[-1, 9], [2, 11], [7, 4]]) s += F.berry(x, y, 2.4, '#2a2238');
    for (const [x, y] of [[-8, -2], [0, -6], [-6, -8]]) s += F.at(x, y, F.radial(4, 3.4, 2.6, '#f2ecc8', { shape: 'round', k: .35 }) + '<circle r=".9" fill="#d9b44a"/>');
    return s;
  },
  // acanthus: a deep-cut leaf and a spike of hooded mauve flowers
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(18, 11, 230, '#5f7f4a', { shape: 'serrate', vein: '#a8c08a' }) + F.leaf(17, 10, 130, '#4f6f40', { shape: 'serrate', vein: '#a8c08a' });
    s += F.spike(20, 4, ['#c9a6c8', '#efe6e6', '#b48ab4'], { n: 9, sw: 1, stemC: '#5f7f4a' });
    return s;
  },

  back(P, T) {
    let s = '';
    // the Esquiline's new palazzi beyond, the Celian's convent and pines on the right
    s += P.far(.7, () => P.row(26, 300, 236, { hMin: 18, hMax: 34, wMin: 16, wMax: 26, style: 'south', seed: 17, walls: ['#ecd6ae', '#e4bf96', '#efe1c6'], roofC: '#b45e3e', placard: false, flagSpot: false }));
    s += P.far(.62, () => celian(P));
    s += P.smoke(150, 214, .6);
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the ground before the amphitheatre, the road and its rails
    s += P.far(.4, () => P.flat('M0 258H600V400H0Z', 'ground') + P.flat('M0 274Q300 270 600 276V290Q300 284 0 288Z', 'basalt', { op: .45 }));
    s += P.far(.3, () => colosseum(P));
    // a tram and a cab on the road round the Colosseum, passing behind the arch
    s += P.far(.25, () => P.cross(T.tramSide({ c: '#4b6e4a', band: '#efe3c0', number: '13', s: .44, dir: 1 }), { y: 286, dir: 1, dur: 52, rest: .3, offset: 6 }));
    s += P.far(.25, () => P.cross(T.fiacre({ s: .4, dir: -1, horses: 1, body: '#2a2622', hood: '#2e2b28' }), { y: 282, dir: -1, dur: 36, rest: .45, offset: 26 }));
    // the Meta Sudans, the Arch of Constantine, the pines of the Palatine
    s += P.far(.28, () => { let d = ''; for (const x of [96, 170, 250, 330]) d += P.lamp(x, 290, .52, 'single', { h: 72 }); return d; });
    s += P.far(.22, () => P.tree(372, 292, 1.05, 'round') + P.tree(440, 294, .9, 'round'));
    s += P.far(.2, () => metaSudans(P, 394, 292));
    s += P.far(.2, () => P.crowd(330, 430, 296, 7, { s: .56, seed: 4, kinds: ['gent', 'lady', 'priest', 'boater', 'lady'] }));
    // Santa Francesca Romana's campanile at the left
    s += P.far(.14, () => P.tree(100, 312, 1.25, 'round') + P.tree(148, 306, 1, 'round'));
    s += P.far(.12, () => campanile(P, 54, 312));
    // the Via Sacra: old paving, a fallen column and a capital, a seat of travertine
    s += P.paving(304, 384, { vx: 300, seed: 9, c: 'ground' });
    s += ruins(P);
    s += P.lamp(132, 334, .9, 'single', { h: 74 }) + P.lamp(420, 324, .78, 'single', { h: 74 });
    s += P.person(232, 330, .98, 'priest', { c: '#1d1d22', legs: '#1d1d22' }) + seminarian(P, 248, 331, .96) + seminarian(P, 262, 332, .94, -1);
    s += P.person(372, 336, 1, 'lady', { c: '#f3eee2', parasol: '#e8c9b0', dir: -1 }) + P.person(386, 337, 1.02, 'boater', { c: '#3d4a3c', dir: -1 }) + P.person(176, 342, 1.04, 'nun', { c: '#1f1f24' });
    s += P.setStreet(350, 120, 520, 1.06);
    s += P.cross(wineCart(P, 1), { y: 354, dir: 1, dur: 60, rest: .3, offset: 14 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady', 'girl'], s: 1.08, dir: -1, seed: 6, dresses: ['#f3eee2', '#e8b9b3'] }), { y: 364, dir: -1, dur: 80, offset: 40 });
    return s;
  },

  front(P, T, st) {
    let s = '';
    // the umbrella pines that frame the view, and a newspaper kiosk
    s += P.far(.18, () => constantine(P, 492, 300));
    s += umbrellaPine(P, 566, 380, 1.25) + umbrellaPine(P, 22, 384, .95);
    s += kiosk(P, 470, 370);
    return s;
  },
};

// ---------- the Colosseum ----------
function colosseum(P) {
  const { f } = P;
  const cx = 224, A = 196;
  const base = (t) => 262 + 14 * Math.cos(t), top = (t) => 152 - 48 * Math.cos(t);
  const Xo = (t) => cx + A * Math.sin(t);
  const q = (t, h, k = 1) => [cx + A * k * Math.sin(t), base(t) - 1.5 * (1 - k) * 20 + (top(t) - base(t)) * h];
  const L = [0, .27, .51, .74, 1]; // the storeys' bounds
  const tL = -86 * D2R, tB = 14 * D2R, tR = 86 * D2R, step = 4.5 * D2R;
  let s = '';
  // the far wall's inner face, seen over the broken south side
  const far = (u, v) => [292 + u * 116, (150 + u * 20) + v * (64 - u * 6)];
  s += P.far(.45, () => {
    let d = P.fill(P.poly([far(0, 0), far(1, 0), far(1, 1), far(0, 1)]), 'trav2');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) { const u = (i + .25) / 10, v = .1 + r * .3; d += P.flat(P.poly([far(u, v), far(u + .05, v), far(u + .05, v + .18), far(u, v + .18)]), '#4a3e34'); }
    return d + P.shade(P.poly([far(0, .85), far(1, .85), far(1, 1), far(0, 1)]), 'trav2', .2);
  });
  // the inner ring on the right, where the outer wall has fallen: brick-patched, two storeys high
  const tI = 30 * D2R, kI = .9;
  let ring = `M${f(q(tI, 0, kI)[0])} ${f(q(tI, 0, kI)[1])}`;
  for (let t = tI; t <= tR + 1e-6; t += step) ring += `L${f(q(t, 0, kI)[0])} ${f(q(t, 0, kI)[1])}`;
  for (let t = tR, i = 0; t >= tI - 1e-6; t -= step, i++) { const [x, y] = q(t, .56 + (i % 3 === 1 ? .04 : 0) - (i % 4 === 2 ? .05 : 0), kI); ring += `L${f(x)} ${f(y)}`; }
  s += P.fill(ring + 'Z', 'trav') + P.shade(ring + 'Z', 'trav', .1);
  for (let t = tI; t < tR - step * .5; t += step) for (const [h0, h1] of [[.04, .24], [.3, .5]]) {
    const a = t + step * .2, b = t + step * .8, m = (a + b) / 2;
    s += P.flat(`M${f(q(a, h0, kI)[0])} ${f(q(a, h0, kI)[1])}L${f(q(a, h1 - .06, kI)[0])} ${f(q(a, h1 - .06, kI)[1])}Q${f(q(m, h1 + .02, kI)[0])} ${f(q(m, h1 + .02, kI)[1])} ${f(q(b, h1 - .06, kI)[0])} ${f(q(b, h1 - .06, kI)[1])}L${f(q(b, h0, kI)[0])} ${f(q(b, h0, kI)[1])}Z`, '#3e342c');
  }
  for (const [t, h] of [[34, .2], [50, .4], [66, .14], [76, .38]]) { const [x, y] = q(t * D2R, h, kI); s += P.flat(P.rect(x - 6, y - 5, 12, 7), 'brick', { op: .85 }); }
  // the outer wall, from the left edge to the break
  let wall = `M${f(Xo(tL))} ${f(base(tL))}`;
  for (let t = tL; t <= tB + 1e-6; t += step) wall += `L${f(Xo(t))} ${f(base(t))}`;
  for (let t = tB; t >= tL - 1e-6; t -= step) wall += `L${f(q(t, 1)[0])} ${f(q(t, 1)[1])}`;
  s += P.fill(wall + 'Z', 'trav');
  s += P.stipple(wall + 'Z', 'trav', 120, { box: [Xo(tL), top(0), Xo(tB) - Xo(tL), base(0) - top(0)], op: .35 });
  // weather: the far left in shade, soot on the lowest storey
  s += P.shade(`M${f(Xo(tL))} ${f(base(tL))}L${f(Xo(-62 * D2R))} ${f(base(-62 * D2R))}L${f(q(-62 * D2R, 1)[0])} ${f(q(-62 * D2R, 1)[1])}L${f(q(tL, 1)[0])} ${f(q(tL, 1)[1])}Z`, 'trav', .16);
  // bay by bay, storey by storey: arches between half-columns, the attic's pilasters and windows
  for (let t = tL, i = 0; t < tB - step * .4; t += step, i++) {
    const a = t + step * .17, b = t + step * .83, m = (a + b) / 2, fore = Math.cos(t);
    for (let k = 0; k < 3; k++) {
      const h0 = L[k] + .02, h1 = L[k + 1] - .035, hs = h1 - (h1 - h0) * .22;
      s += P.flat(`M${f(q(a, h0)[0])} ${f(q(a, h0)[1])}L${f(q(a, hs)[0])} ${f(q(a, hs)[1])}Q${f(q(m, h1 + .02)[0])} ${f(q(m, h1 + .02)[1])} ${f(q(b, hs)[0])} ${f(q(b, hs)[1])}L${f(q(b, h0)[0])} ${f(q(b, h0)[1])}Z`, k ? '#40362e' : '#352c26');
      if (k > 0 && fore > .3) s += P.line(`M${f(q(a, h0)[0])} ${f(q(a, h0)[1])}H${f(q(b, h0)[0])}`, 'trav2', .5);
    }
    if (fore > .25) for (let k = 0; k < 3; k++) { const [x0, y0] = q(t, L[k] + .01), [x1, y1] = q(t, L[k + 1] - .03); s += P.line(`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, 'trav2', 1.6 * fore + .3); }
    // the attic: a window in every other bay, pilasters, the corbels
    if (i % 2) { const [x0, y0] = q(m - step * .12, L[3] + .1), [x1, y1] = q(m + step * .12, L[3] + .16); s += P.flat(P.rect(x0, y0, Math.max(.6, x1 - x0), 4 * fore + 1), '#40362e'); }
    if (fore > .25) { const [x0, y0] = q(t, L[3] + .02), [x1, y1] = q(t, .96); s += P.line(`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, 'trav2', 1.1 * fore + .2); const [cx2, cy2] = q(m, .9); s += P.flat(P.rect(cx2 - 1, cy2, 2, 2.6), '#5a4a3c'); }
  }
  // cornices between the storeys
  for (const h of [L[1], L[2], L[3], 1]) { let d = ''; for (let t = tL; t <= tB + 1e-6; t += step) { const [x, y] = q(t, h); d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`; } s += P.line(d, 'trav2', 1.4) + P.line(d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (m0, x, y) => `${x} ${f(+y + 1.4)}`), '#f2e6c8', .6, { op: .7 }); }
  // the broken end and Valadier's buttress of brick, stepping down to the inner ring, its arcades echoed in brick
  const steps = 7;
  let st = `M${f(q(tB, 0)[0])} ${f(q(tB, 0)[1])}L${f(q(tB, 1)[0])} ${f(q(tB, 1)[1])}`;
  for (let k = 0; k < steps; k++) {
    const t0 = tB + (tI - tB) * k / steps, t1 = tB + (tI - tB) * (k + 1) / steps, h1 = 1 - (1 - .56) * (k + 1) / steps;
    st += `L${f(q(t1, 1 - (1 - .56) * k / steps)[0])} ${f(q(t1, 1 - (1 - .56) * k / steps)[1])}L${f(q(t1, h1)[0])} ${f(q(t1, h1)[1])}`;
  }
  st += `L${f(q(tI, 0)[0])} ${f(q(tI, 0)[1])}Z`;
  s += P.fill(st, 'brick') + P.stipple(st, 'brick', 40, { box: [q(tB, 1)[0], q(tB, 1)[1], q(tI, 0)[0] - q(tB, 1)[0], q(tI, 0)[1] - q(tB, 1)[1]], op: .35 });
  s += P.shade(`M${f(q(tB, 0)[0])} ${f(q(tB, 0)[1])}L${f(q(tB, 1)[0])} ${f(q(tB, 1)[1])}L${f(q(tB + step * .5, 1)[0])} ${f(q(tB + step * .5, 1)[1])}L${f(q(tB + step * .5, 0)[0])} ${f(q(tB + step * .5, 0)[1])}Z`, 'brick', .25);
  for (let t = tB + step * .2; t < tI - step * .3; t += step) for (let k = 0; k < 3; k++) {
    const hTop = 1 - (1 - .56) * ((t - tB) / (tI - tB));
    if (L[k + 1] > hTop) continue;
    const a = t + step * .17, b = t + step * .83, m = (a + b) / 2, h0 = L[k] + .02, h1 = L[k + 1] - .035, hs = h1 - (h1 - h0) * .22;
    s += `<path d="M${f(q(a, h0)[0])} ${f(q(a, h0)[1])}L${f(q(a, hs)[0])} ${f(q(a, hs)[1])}Q${f(q(m, h1 + .02)[0])} ${f(q(m, h1 + .02)[1])} ${f(q(b, hs)[0])} ${f(q(b, hs)[1])}L${f(q(b, h0)[0])} ${f(q(b, h0)[1])}" fill="none" stroke="${P.dark('brick', .3)}" stroke-width=".9"/>`;
  }
  return s;
}
function celian(P) {
  const lf = P.L.leaf;
  let s = '';
  // SS. Giovanni e Paolo's campanile and the convent among pines
  s += P.fill(P.rect(470, 214, 70, 30), 'wall3', { w: .5 }) + P.windows(474, 218, 62, 20, 6, 2, { ww: .4 }) + P.fill(P.poly([[468, 215], [478, 208], [532, 208], [542, 215]]), 'roof', { w: .45 });
  s += P.fill(P.rect(446, 176, 14, 68), 'brick', { w: .55 }) + P.fill(P.poly([[445, 177], [453, 168], [461, 177]]), 'roof', { w: .45 });
  for (let k = 0; k < 4; k++) s += P.fill(P.arch(449, 182 + k * 13, 3.4, 7), '#3a3430', { w: .3 }) + P.fill(P.arch(454, 182 + k * 13, 3.4, 7), '#3a3430', { w: .3 });
  for (const [x, y, k] of [[420, 238, .7], [552, 236, .8], [584, 240, .7]]) s += umbrellaPine(P, x, y, k * .55);
  s += P.flagAt(500, 220) + P.flagAt(460, 190);
  return s;
}
function metaSudans(P, x, by) {
  const { f } = P;
  let s = P.fill(`M${x - 13} ${by}L${x - 7} ${by - 30}Q${x} ${by - 36} ${x + 7} ${by - 30}L${x + 13} ${by}Z`, 'brick') + P.shade(`M${x + 2} ${by - 34}Q${x + 5} ${by - 33} ${x + 7} ${by - 30}L${x + 13} ${by}H${x + 4}Z`, 'brick', .2);
  for (let k = 1; k < 5; k++) s += P.line(`M${f(x - 13 + k * 1.3)} ${by - k * 6}H${f(x + 13 - k * 1.3)}`, '#8a5236', .5, { op: .7 });
  s += P.fill(P.ellipse(x, by, 20, 3), 'trav2', { w: .45 });
  return s;
}
/** The Arch of Constantine: three openings, four columns of giallo antico on each face with the Dacian captives over
 * them, the roundels, the attic with its inscription. (cx, by): its middle at the foot. */
function constantine(P, cx, by) {
  const { f } = P, w = 124, h = 96, x0 = cx - w / 2, ct = by - h + 26;
  let s = P.fill(P.rect(x0, ct, w, by - ct), 'marble') + P.stipple(P.rect(x0, ct, w, by - ct), 'marble', 50, { box: [x0, ct, w, by - ct], op: .3 });
  s += P.shade(P.rect(x0 + w - 12, ct, 12, by - ct), 'marble', .15);
  // the openings
  s += P.fill(P.arch(cx - 15, by - 54, 30, 54), '#3a3028', { w: .6 }) + P.flat(P.arch(cx - 9, by - 40, 18, 40), '#a89a7a', { op: .45 });
  for (const k of [-1, 1]) s += P.fill(P.arch(cx + k * 38 - 9, by - 34, 18, 34), '#3a3028', { w: .5 });
  // the roundels over the side arches, the relief panels
  for (const k of [-1, 1]) { s += `<circle cx="${cx + k * 38}" cy="${by - 46}" r="6.4" fill="${P.ink('#d9cfba')}" stroke="${P.keyC()}" stroke-width=".5"/>`; s += P.fill(P.rect(cx + k * 38 - 10, by - 66, 20, 9), '#d9cfba', { w: .4 }); }
  // the columns of yellow marble on their plinths, the captives standing over them on the attic
  for (const x of [x0 + 8, cx - 24, cx + 24, x0 + w - 8]) {
    s += P.fill(P.rect(x - 3.4, by - 12, 6.8, 12), 'marble', { w: .45 }) + P.fill(P.rect(x - 2.4, ct + 4, 4.8, by - ct - 16), 'giallo', { w: .45 }) + P.shade(P.rect(x + .6, ct + 4, 1.8, by - ct - 16), 'giallo', .2);
    s += P.fill(P.rect(x - 3.6, ct + 1, 7.2, 3.4), 'marble', { w: .35 });
    s += P.fill(`M${x - 3} ${ct - 10}L${x - 2.4} ${ct - 24}Q${x} ${ct - 27} ${x + 2.4} ${ct - 24}L${x + 3} ${ct - 10}Z`, 'porph', { w: .4 }) + `<circle cx="${x}" cy="${ct - 27.6}" r="2" fill="${P.ink('marble')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  }
  // the entablature and the attic with its inscription
  s += P.fill(P.rect(x0 - 2, ct - 4, w + 4, 6), 'marble', { w: .5 });
  s += P.fill(P.rect(x0 + 2, ct - 30, w - 4, 26), 'marble', { w: .5 }) + P.fill(P.rect(x0, ct - 33, w, 3.4), 'trav2', { w: .45 });
  s += P.fill(P.rect(cx - 26, ct - 27, 52, 20), '#e2d8c2', { w: .45 });
  for (let i = 0; i < 4; i++) s += P.line(`M${cx - 21} ${ct - 23 + i * 4.4}h${i === 3 ? 28 : 42}`, '#6a5a44', .9, { op: .8 });
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * 44 - 8, ct - 26, 16, 18), '#d9cfba', { w: .4 });
  return s;
}

// ---------- the Via Sacra ----------
function campanile(P, x, by) {
  const { f } = P, w = 26;
  let s = P.fill(P.rect(x - w / 2, by - 210, w, 210), 'brick') + P.shade(P.rect(x + w / 2 - 7, by - 210, 7, 210), 'brick', .2);
  for (let k = 0; k < 5; k++) {
    const y = by - 60 - k * 30;
    s += P.fill(P.rect(x - w / 2 - 1.5, y + 22, w + 3, 2.6), 'marble', { w: .4 });
    for (const dx of [-7, 0, 7]) s += P.fill(P.arch(x + dx - 2.6, y + 2, 5.2, 16), '#352c26', { w: .35 }) + P.line(`M${x + dx} ${y + 8}v10`, 'marble', .6);
    for (const dx of [-8, 8]) s += `<circle cx="${x + dx}" cy="${y - 4}" r="1.6" fill="${P.ink(k % 2 ? '#4a8a6a' : '#c9a23a')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  }
  s += P.fill(P.poly([[x - w / 2 - 2, by - 209], [x, by - 222], [x + w / 2 + 2, by - 209]]), 'roof', { w: .6 });
  const on = P.wr() < P.L.windows * .8;
  s += `<path d="${P.rect(x - 3, by - 44, 6, 10)}" fill="${on ? P.glow('#ffd88a') : P.ink('glass')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  s += P.wall(x - 7, by - 30, 12, 16) + P.flagAt(x - w / 2, by - 120);
  return s;
}
function ruins(P) {
  const { f } = P;
  let s = '';
  // a fallen column drum, a Corinthian capital on its side, a block of travertine where tourists rest
  s += P.fill('M60 356L64 340H136L132 356Z', 'trav', { w: .7 }) + P.shade('M60 356L62 348H134L132 356Z', 'trav', .2);
  s += P.fill(P.ellipse(64, 348, 4, 8), 'trav2', { w: .5 });
  for (let k = 0; k < 5; k++) s += P.line(`M${70 + k * 13} 341L${68 + k * 13} 355`, 'trav2', .6);
  s += P.fill('M482 340Q478 326 490 322H510Q520 326 516 340Z', 'marble', { w: .6 }) + P.line('M486 330q6 -6 10 0q6 -6 10 0', '#a89c84', .7) + P.shade('M500 322H510Q520 326 516 340H504Z', 'marble', .2);
  s += P.fill(P.rect(280, 344, 34, 12), 'trav', { w: .6 }) + P.shade(P.rect(304, 344, 10, 12), 'trav', .2);
  s += P.person(290, 344, .94, 'boater', { c: '#4a3a30' }) + P.person(304, 345, .92, 'lady', { c: '#c9d6e6' });
  // weeds and a fig among the stones
  const lf = P.L.leaf;
  for (const [x, y] of [[138, 354], [470, 342], [252, 360]]) s += `<path d="${P.blob(x, y - 3, 6, 3.4, 7, x)}" fill="${P.ink(lf.leaf ?? lf.dark)}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  return s;
}
/** A seminarian of the German college, in the scarlet soutane the Romans call the boiled lobsters. */
function seminarian(P, x, by, s, dir = 1) {
  return P.person(x, by, s, 'priest', { c: '#b8302c', legs: '#b8302c', dir });
}
/** An umbrella pine: a tall bare trunk leaning a little, the crown spread flat like a parasol. */
function umbrellaPine(P, x, by, s) {
  const { f } = P, lf = P.L.leaf, k = s;
  const lean = x > 300 ? -1 : 1, tx = x + lean * 22 * k, ty = by - 150 * k;
  let d = P.fill(`M${f(x - 4 * k)} ${f(by)}Q${f(x + lean * 6 * k)} ${f(by - 80 * k)} ${f(tx - 2.4 * k)} ${f(ty)}H${f(tx + 2.4 * k)}Q${f(x + lean * 10 * k)} ${f(by - 80 * k)} ${f(x + 4 * k)} ${f(by)}Z`, '#7a5a44', { w: .7 });
  d += P.line(`M${f(tx)} ${f(ty)}l${f(-30 * k)} ${f(-10 * k)}M${f(tx)} ${f(ty)}l${f(26 * k)} ${f(-12 * k)}M${f(tx)} ${f(ty)}l${f(-8 * k)} ${f(-16 * k)}`, '#6a4a34', 2.4 * k);
  const ever = lf.ever, cy = ty - 22 * k;
  d += `<path d="M${f(tx - 66 * k)} ${f(cy + 10 * k)}Q${f(tx - 70 * k)} ${f(cy - 14 * k)} ${f(tx - 30 * k)} ${f(cy - 22 * k)}Q${f(tx)} ${f(cy - 30 * k)} ${f(tx + 34 * k)} ${f(cy - 22 * k)}Q${f(tx + 72 * k)} ${f(cy - 14 * k)} ${f(tx + 66 * k)} ${f(cy + 10 * k)}Q${f(tx + 30 * k)} ${f(cy + 4 * k)} ${f(tx)} ${f(cy + 12 * k)}Q${f(tx - 30 * k)} ${f(cy + 4 * k)} ${f(tx - 66 * k)} ${f(cy + 10 * k)}Z" fill="${P.ink(ever)}" stroke="${P.keyC()}" stroke-width="${f(.8)}"/>`;
  d += `<path d="M${f(tx - 60 * k)} ${f(cy + 8 * k)}Q${f(tx)} ${f(cy - 2 * k)} ${f(tx + 60 * k)} ${f(cy + 8 * k)}Q${f(tx + 30 * k)} ${f(cy + 4 * k)} ${f(tx)} ${f(cy + 11 * k)}Q${f(tx - 30 * k)} ${f(cy + 4 * k)} ${f(tx - 60 * k)} ${f(cy + 8 * k)}Z" fill="${P.dark(ever, .3)}" opacity=".85"/>`;
  const r = P.rng(Math.round(x * 3));
  for (let i = 0; i < 10; i++) d += `<path d="${P.blob(tx - 46 * k + r() * 92 * k, cy - 16 * k + r() * 12 * k, 9 * k, 4 * k, 6, i + Math.round(x))}" fill="${P.light(ever, .25)}" opacity=".85"/>`;
  return d;
}
function kiosk(P, x, by) {
  let s = P.fill(P.rect(x - 13, by - 32, 26, 32), '#5a3a2a') + P.shade(P.rect(x + 5, by - 32, 8, 32), '#5a3a2a', .25);
  s += P.fill(P.rect(x - 9, by - 27, 18, 13), '#efe6d2', { w: .4 });
  for (let i = 0; i < 3; i++) s += P.line(`M${x - 7} ${by - 24 + i * 3.6}h14`, '#4a4440', .6, { op: .7 });
  s += P.fill(P.poly([[x - 17, by - 32], [x, by - 44], [x + 17, by - 32]]), '#4b6e4a') + P.line(`M${x} ${by - 44}v-5`, '#d6aa3e', 1);
  s += P.wall(x - 12, by - 30, 7, 10) + P.wall(x + 5, by - 30, 7, 10);
  return s;
}
/** A carretto a vino from the Castelli: barrels slung on a long two-wheeled cart, the carter dozing under the little
 * folding hood at its side, the horse in a harness of brass and red tassels (two frames of the walk). */
function wineCart(P, dir = 1) {
  const W = 92, H = 46, { f } = P;
  const frame = (st) => {
    let b = '';
    // the cart's bed and its barrels
    b += P.fill('M4 26H56V31H4Z', '#8a2a24', { w: .5 }) + P.line('M6 28.5H54', '#d6aa3e', .7);
    for (const [x, r] of [[14, 6], [27, 6.4], [40, 6]]) b += P.fill(P.ellipse(x, 20, r, 5.6), '#9a6a3e', { w: .5 }) + P.line(`M${x - r + 1.6} 17H${x + r - 1.6}M${x - r + 1.6} 23H${x + r - 1.6}`, '#3a2a1e', .7);
    // the hood over the carter's seat, a triangle of leather on its frame
    b += P.fill('M46 26L52 6L62 26Z', '#3a3a34', { w: .5 }) + P.shade('M52 6L62 26H55Z', '#3a3a34', .25);
    b += P.person(54, 26, .7, 'worker', { c: '#6a4a3a', legs: '#3a3a40', dir: 1 });
    // the great wheel
    b += `<circle cx="30" cy="34" r="10" fill="none" stroke="${P.ink('#c8402e')}" stroke-width="1.6"/>`;
    for (let i = 0; i < 7; i++) { const a = i * Math.PI / 7 + st * .22; b += `<path d="M${f(30 - Math.cos(a) * 10)} ${f(34 - Math.sin(a) * 10)}L${f(30 + Math.cos(a) * 10)} ${f(34 + Math.sin(a) * 10)}" stroke="${P.ink('#c8402e')}" stroke-width=".7"/>`; }
    b += `<circle cx="30" cy="34" r="1.8" fill="${P.ink('#3a2a1e')}"/>`;
    b += P.line('M56 28L72 24', '#5a4432', 1.3);
    // the horse, brown, red tassels on its harness
    const m = st ? 2.4 : -2.4;
    b += P.line(`M70 30l${m} 12M80 30l${-m} 12M68 30l${-m} 11M82 30l${m} 11`, '#5a3e2a', 2.2);
    b += P.fill('M66 22Q66 17 73 17H81Q86 17 86 22Q86 30 81 31H71Q66 30 66 22Z', '#6a4a30', { w: .55 });
    b += P.fill('M81 19L87 9Q88 6 91 8L92 14Q92 16 90 16L87 15L85 22Z', '#6a4a30', { w: .5 }) + P.line('M88 8l-.6 -3.4', '#6a4a30', 1);
    b += P.fill('M71 17H80V20H71Z', '#c8402e', { w: .3 }) + `<circle cx="86" cy="9" r="1.6" fill="${P.ink('#c8402e')}"/><circle cx="75" cy="15" r="1.4" fill="${P.ink('#d6aa3e')}"/>`;
    b += P.line('M66 20q-4 4 -3 9', '#3a2a1e', 1.6);
    return dir < 0 ? `<g transform="translate(${W} 0) scale(-1 1)">${b}</g>` : b;
  };
  return { frames: [doc(W, H, frame(0)), doc(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 43 };
}
