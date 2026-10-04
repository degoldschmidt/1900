// Vienna, after the card that set the style: St Stephen's under its roof of glazed tiles, the Secession's dome of gilt
// laurel, a red tram coming down the street toward us, the Ring's trees and candelabra, strollers, a fiacre waiting.

const T1 = '#3f7a4a', T2 = '#d9b44a', T3 = '#efe6cf', T4 = '#2a2d2a';

export default {
  id: 'VIE',
  greet: 'GRUSS aus WIEN',
  nation: 'AH',
  flag: 'AH',
  flower: 'poppy',
  flower2: 'marguerite',
  frame: { band: ['#41a19b', '#1b5b60'], gold: '#d8b45c', ink: '#1d4a3a', leaf: ['#6f9c55', '#2f5a36'], year: '#7a5a22', halo: '#f7ebc4' },
  horizon: 292,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#2c2924', wall: '#efe3c4', wall2: '#e9cf8e', wall3: '#e8d2bc', stone: '#e6d9bb', stone2: '#cbbd9c',
    roof: '#b4553f', copper: '#5e9a80', glass: '#3a4a5c', sash: '#f2ead8', ground: '#e6d6b0', iron: '#2c4a3d',
    tram: '#b8352e', gold: '#d4a73a', white: '#f4f0e6',
  },

  // a corner poppy, coral and crumpled, with a bud and feathery leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(30, 10, 205, I.leaf[1], { shape: 'serrate' }) + F.leaf(26, 9, 150, I.leaf[0], { shape: 'serrate' }) + F.leaf(20, 7, 250, I.leaf[0], { shape: 'serrate' });
    s += F.stem('M3 5Q16 10 19 26', I.leaf[1], 1.3) + F.at(19.5, 28, `<ellipse rx="3.6" ry="5.4" fill="#c4473e" stroke="${I.key}" stroke-width=".55"/><path d="M-2 -4Q0 -6 2 -4" stroke="#6f9c55" stroke-width="1.2" fill="none"/>`, 165);
    s += F.radial(2, 16, 21, '#c54a40', { rot: 50, shape: 'round', vein: '#8a2a24' }) + F.radial(2, 16, 21, '#e0685b', { rot: 140, shape: 'round', lite: '#f4a596', vein: '#a8382e' });
    s += F.disc(4.6, '#2b2620', { dots: '#6a5a3a', n: 8 }) + '<circle r="1.8" fill="#7d8c4c"/>';
    return s;
  },
  // marguerites for the foot of the frame
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(16, 5, 210, I.leaf[1], { shape: 'serrate' }) + F.leaf(14, 5, 140, I.leaf[0]);
    s += F.radial(16, 12, 4.2, ['#f8f3e4', '#efe7d2'], { shape: 'strap', k: .4 }) + F.disc(3.8, '#e2ad34', { dots: '#b8862a', n: 9, lite: '#f6d27a' });
    return s;
  },

  back(P) {
    let s = '';
    // the city beyond: baroque roofs between the cathedral and the Secession, a copper dome, a chimney smoking
    s += P.far(.62, () => P.row(276, 404, 300, { hMin: 46, hMax: 74, wMin: 15, wMax: 26, style: 'east', seed: 11, walls: ['#efe3c4', '#e9cf8e', '#e8d2bc'], roofC: '#b4553f' }));
    s += P.far(.55, () => {
      const cx = 334, by = 236;
      let d = P.fill(P.rect(cx - 15, by - 22, 30, 24), 'wall2') + P.windows(cx - 12, by - 20, 24, 16, 4, 1, { arched: true, ww: .45 });
      d += P.fill(P.dome(cx, by - 22, 17, 24), 'copper') + P.shade(`M${cx + 4} ${by - 22}C${cx + 6} ${by - 40} ${cx + 12} ${by - 44} ${cx + 17} ${by - 22}Z`, 'copper', .25);
      d += P.fill(P.rect(cx - 3.5, by - 58, 7, 12), 'wall2') + P.fill(P.onion(cx, by - 58, 9, 12), 'copper') + P.line(`M${cx} ${by - 70}v-7`, '#d4a73a', 1);
      return d;
    });
    s += P.smoke(296, 238, .7) + P.smoke(388, 232, .6);
    return s;
  },

  mid(P, T) {
    const { f } = P;
    let s = '';
    // ----- St Stephen's -----
    s += P.far(.18, () => cathedral(P));
    // ----- the palais between, with the black-and-gold on its roof -----
    s += P.far(.3, () => {
      let d = P.facade(296, 306, 52, 92, { c: 'wall2', roof: 'mansard', roofC: 'roof', side: 8, floors: 4, cols: 4, rh: 16, shop: ['#2f6b4a', '#efe6d0'] });
      d += P.facade(346, 306, 50, 82, { c: 'wall', roof: 'mansard', roofC: 'roof', side: 7, floors: 4, cols: 4, rh: 14, balconies: true });
      d += P.flag(372, 206, 1.1, 'AH');
      d += P.smoke(318, 190, .8);
      return d;
    });
    // ----- the Secession -----
    s += P.far(.12, () => secession(P));
    // ----- the street: paving, the tram's rails running down toward us -----
    s += P.paving(296, 380, { vx: 318, seed: 4 });
    for (const [a, b] of [[-3.6, -14], [3.6, 14]]) s += P.line(`M${f(316 + a)} 299L${f(140 + b)} 378`, '#7a746a', 1.3) + P.line(`M${f(316 + a + .6)} 299.4L${f(140 + b + 1.6)} 378.4`, '#efe8d8', .5, { op: .7 });
    // trees along the Ring, their crowns over the cathedral's feet
    s += P.far(.25, () => P.tree(240, 312, .9, 'round') + P.tree(212, 318, 1.08, 'round'));
    s += P.far(.15, () => P.tree(176, 328, 1.35, 'round') + P.tree(386, 318, 1, 'round'));
    // the crowd in the middle distance, under the lamps
    s += P.far(.3, () => P.crowd(226, 300, 312, 9, { s: .5, seed: 3 }) + P.crowd(316, 400, 316, 9, { s: .55, seed: 8 }));
    s += P.far(.2, () => P.lamp(232, 314, .48, 'globe') + P.lamp(206, 322, .62, 'globe'));
    s += P.far(.1, () => P.crowd(392, 470, 326, 7, { s: .66, seed: 21 }) + P.crowd(470, 566, 330, 6, { s: .7, seed: 5 }));
    s += P.lamp(166, 338, .82, 'globe');
    // the house on the left, its face running away down the street
    s += leftHouse(P);
    // where the tram, the carriages and the walkers pass; at war, the soldiers
    s += P.setStreet(344, 200, 574, .82);
    s += P.mover(T.tram({ number: '18', s: 1.05 }), { path: [[316, 299, .3, 0, 0], [313, 300.6, .32, .03, 1], [262, 323, .6, .3], [262, 323, .6, .44], [192, 354, .94, .72], [150, 372.6, 1.12, .86, 1], [142, 376, 1.16, .875, 0], [142, 376, 1.16, 1, 0]], dur: 46, offset: 9 });
    s += P.cross(T.fiacre({ s: .62, dir: -1, horses: 2 }), { y: 334, dir: -1, s: 1, dur: 64, rest: .3, x0: 200, offset: 30 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: .82, dir: 1, seed: 4 }), { y: 341, dir: 1, dur: 96, offset: 12, x0: 190 });
    s += P.cross(T.walkers({ kinds: ['lady', 'girl'], s: .86, dir: -1, seed: 9, dresses: ['#e8b9b3', '#f3eee2'] }), { y: 350, dir: -1, dur: 88, offset: 50, x0: 200 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady', 'gent'], s: .6, dir: 1, seed: 14 }), { y: 322, dir: 1, dur: 120, offset: 70, x0: 240, x1: 400 });
    s += P.cross(T.motorcar({ s: .4, c: '#4a2a2a' }), { y: 305, dir: -1, dur: 26, rest: .55, x0: 280, x1: 400, offset: 4 });
    return s;
  },

  front(P, T) {
    let s = '';
    // the candelabrum on the left
    s += candelabrum(P, 118, 380, 1);
    // the couple walking away from us, she under her parasol
    s += couple(P, 60, 404);
    // the fiacre waiting on the right
    s += T.place(T.fiacre({ s: 1.3, dir: -1, horses: 2, body: '#1f2427', hood: '#2b2724' }), 506, 374);
    s += P.wall(40, 298, 14, 19) + P.flagAt(84, 168);
    return s;
  },
};

// ---------- St Stephen's ----------
function cathedral(P) {
  const { f } = P;
  let s = '';
  // the nave's wall, buttresses and tall windows
  s += P.fill(P.rect(126, 210, 132, 96), 'stone') + P.stipple(P.rect(126, 210, 132, 96), 'stone', 70, { box: [126, 210, 132, 96], op: .35 });
  for (let i = 0; i < 6; i++) {
    const x = 132 + i * 21;
    s += P.fill(P.gothic(x + 4, 232, 10, 52), 'glass') + P.line(`M${x + 9} 238V284M${x + 4} 258H${x + 14}`, 'stone2', .6) + `<circle cx="${x + 9}" cy="241" r="2.2" fill="none" stroke="${P.ink('stone2')}" stroke-width=".6"/>`;
    s += P.fill(P.rect(x - 2, 214, 4, 92), 'stone2', { w: .5 });
    s += pinnacle(P, x, 214, 6, 20);
  }
  // gables over the windows, along the eaves
  for (let i = 0; i < 6; i++) { const x = 136 + i * 21; s += P.fill(P.gable(x - 3, 216, 18, 16), 'stone', { w: .55 }) + P.shade(P.gable(x + 6, 216, 9, 16), 'stone', .15) + P.line(`M${x + 6} 210l0 -4`, 'stone2', .7); }
  // the great roof: chevrons of glazed tile
  const roof = [[122, 212], [150, 146], [240, 146], [262, 212]];
  s += chevronRoof(P, roof);
  // the two Heathen Towers at the west front
  for (const [x, w, top] of [[112, 18, 124], [136, 14, 132]]) {
    s += P.fill(P.rect(x, top + 30, w, 306 - top - 30), 'stone') + P.shade(P.rect(x + w * .65, top + 30, w * .35, 306 - top - 30), 'stone', .2);
    s += P.fill(P.gothic(x + w * .3, top + 40, w * .4, 18), 'glass') + P.fill(P.gothic(x + w * .3, top + 66, w * .4, 22), 'glass');
    s += P.fill(P.rect(x - 1.5, top + 26, w + 3, 4), 'stone2', { w: .5 });
    s += P.fill(P.spire(x + w / 2, top + 27, w * .9, 34), 'stone2') + P.shade(`M${x + w / 2} ${top - 7}L${x + w * .95} ${top + 27}H${x + w / 2}Z`, 'stone2', .2);
    s += crockets(P, x + w / 2, top - 7, x + w * .05, top + 27) + crockets(P, x + w / 2, top - 7, x + w * .95, top + 27);
  }
  // the south tower, the Steffl: stages narrowing into the spire
  s += steffl(P, 272, 306, 58);
  return s;
}

function chevronRoof(P, pts) {
  const { f } = P, id = `${P.uid}rf${P._st++}`, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - 12, x1 = Math.max(...xs) + 12, y0 = Math.min(...ys), y1 = Math.max(...ys);
  const step = 4.6, per = 12, cols = [T1, T3, T2, T3, T1, T4, T3, T2];
  let g = P.flat(P.poly(pts), T3);
  for (let y = y0 - step, i = 0; y < y1 + step; y += step, i++) {
    let d = `M${f(x0)} ${f(y + step * 2.2)}V${f(y)}`;
    for (let x = x0; x < x1; x += per) d += `L${f(x + per / 2)} ${f(y - step * 1.1)}L${f(x + per)} ${f(y)}`;
    d += `V${f(y + step * 2.2)}Z`;
    g += P.flat(d, cols[i % cols.length]);
  }
  // the roof darkens toward its far end and along the ridge
  g += P.flat(P.poly([[200, 146], [240, 146], [262, 212], [218, 212]]), '#1a1c22', { op: .14, raw: 1 });
  g += P.flat(P.rect(x0, y0, x1 - x0, 5), '#1a1c22', { op: .2, raw: 1 });
  return `<clipPath id="${id}"><path d="${P.poly(pts)}"/></clipPath><g clip-path="url(#${id})">${g}</g>` + P.line(P.poly(pts), null, 1.1) + P.line(`M150 146H240`, 'stone2', 2);
}

function steffl(P, cx, base, tip) {
  const { f } = P;
  let s = '';
  const tracery = (x, y, w, h) => P.fill(P.gothic(x, y, w, h), 'glass') + P.line(`M${f(x + w / 2)} ${f(y + w * .7)}V${f(y + h - 1)}`, 'stone2', .55) + `<circle cx="${f(x + w / 2)}" cy="${f(y + w * .55)}" r="${f(w * .22)}" fill="none" stroke="${P.ink('stone2')}" stroke-width=".55"/>`;
  const stage = (y0, y1, w, o = {}) => {
    const h = y0 - y1;
    let d = P.fill(P.rect(cx - w / 2, y1, w, h), 'stone') + P.shade(P.rect(cx + w * .16, y1, w * .34, h), 'stone', .2);
    d += P.stipple(P.rect(cx - w / 2, y1, w, h), 'stone', 34, { box: [cx - w / 2, y1, w, h], op: .3 });
    // stepped buttresses at the corners
    for (const k of [-1, 1]) d += P.fill(P.rect(cx + k * w / 2 - (k > 0 ? 4 : 0), y1 + 4, 4, h - 4), 'stone2', { w: .45 });
    const nw = o.lights ?? 1, ww = w * (nw > 1 ? .2 : .3);
    for (let i = 0; i < nw; i++) d += tracery(cx - (nw * ww + (nw - 1) * 3) / 2 + i * (ww + 3), y1 + h * .14, ww, h * .7);
    d += P.fill(P.rect(cx - w / 2 - 2, y1 - 2, w + 4, 3.4), 'stone2', { w: .5 });
    // a crown of gables and pinnacles on the stage
    if (o.gables) for (let k = 0; k < o.gables; k++) { const gw = w / o.gables, gx = cx - w / 2 + k * gw; d += P.fill(P.gable(gx + 1, y1 - 1, gw - 2, gw * .9), 'stone', { w: .5 }) + P.shade(P.gable(gx + gw / 2, y1 - 1, (gw - 2) / 2, gw * .9), 'stone', .15) + `<circle cx="${f(gx + gw / 2)}" cy="${f(y1 - gw * .35)}" r="${f(gw * .14)}" fill="none" stroke="${P.ink('stone2')}" stroke-width=".5"/>` + P.line(`M${f(gx + gw / 2)} ${f(y1 - gw * .9 - 1)}v-3`, 'stone2', .6); }
    for (const k of [-1, 1]) d += pinnacle(P, cx + k * (w / 2 + 1), y1 + 1, Math.max(3.4, w * .12), o.pin ?? 16);
    return d;
  };
  s += stage(base, 244, 42, { lights: 2, gables: 3, pin: 20 });
  s += stage(244, 194, 34, { lights: 2, gables: 3, pin: 18 });
  s += stage(194, 150, 27, { lights: 1, gables: 2, pin: 16 });
  // the spire: pierced with tracery, its edges set with crockets, a gallery of little gables at its foot
  const sw = 12, sb = 152;
  s += P.fill(`M${cx - sw} ${sb}L${cx} ${tip}L${cx + sw} ${sb}Z`, 'stone') + P.shade(`M${cx} ${tip}L${cx + sw} ${sb}H${cx + 2}Z`, 'stone', .22);
  for (let k = 1; k < 9; k++) {
    const y = sb - (sb - tip) * k / 9, hw = sw * (1 - k / 9);
    s += P.line(`M${f(cx - hw)} ${f(y)}H${f(cx + hw)}`, 'stone2', .55);
    if (k < 7) s += `<circle cx="${f(cx - hw * .45)}" cy="${f(y + (sb - tip) / 18)}" r="${f(Math.max(.8, hw * .16))}" fill="${P.ink('glass')}"/><circle cx="${f(cx + hw * .45)}" cy="${f(y + (sb - tip) / 18)}" r="${f(Math.max(.8, hw * .16))}" fill="${P.ink('glass')}"/>`;
  }
  s += P.line(`M${cx} ${tip + 4}V${sb}`, 'stone2', .5, { op: .7 });
  s += crockets(P, cx, tip, cx - sw, sb, 11) + crockets(P, cx, tip, cx + sw, sb, 11);
  for (const k of [-1, 0, 1]) s += P.fill(P.gable(cx + k * 8 - 4, sb + 2, 8, 9), 'stone', { w: .45 });
  s += `<circle cx="${cx}" cy="${tip - 2}" r="1.6" fill="${P.ink('#d4a73a')}"/>` + P.line(`M${cx} ${tip - 3}v-6M${cx - 2.6} ${tip - 6.4}h5.2`, '#3a3226', .9);
  return s;
}

/** A pinnacle: a little spire with its finial. */
function pinnacle(P, x, by, w, h) {
  return P.fill(P.spire(x, by, w, h), 'stone2', { w: .45 }) + P.line(`M${P.f(x)} ${P.f(by - h)}v-2.4`, 'stone2', .5);
}
/** Crockets: the little leaves that climb a Gothic edge, from (x0, y0) at the top to (x1, y1). */
function crockets(P, x0, y0, x1, y1, n = 7) {
  let d = '';
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, out = x1 < x0 ? -1 : 1; d += `M${P.f(x)} ${P.f(y)}q${P.f(out * 3)} -.6 ${P.f(out * 2.6)} -3.2`; }
  return `<path d="${d}" fill="none" stroke="${P.keyC()}" stroke-width="1.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${P.ink('stone')}" stroke-width=".8" stroke-linecap="round"/>`;
}

// ---------- the Secession ----------
function secession(P) {
  const { f } = P;
  let s = '';
  const x0 = 398, x1 = 552, top = 162, by = 318;
  // the dome of gilt laurel, behind the pylons
  const cx = 475, cy = 160, r = 40;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.ink('#b8892a')}" stroke="${P.keyC()}" stroke-width="1"/>`;
  const rr = P.rng(41);
  for (let i = 0; i < 150; i++) {
    const a = rr() * Math.PI * 2, q = Math.sqrt(rr()) * (r - 3), x = cx + Math.cos(a) * q, y = cy + Math.sin(a) * q * .95;
    if (y > top + 2) continue;
    const lit = (x - cx) * -.6 + (cy - y) > 0;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.4" ry="1.6" transform="rotate(${f(rr() * 180)} ${f(x)} ${f(y)})" fill="${P.ink(lit ? '#f0cf6a' : rr() < .5 ? '#d4a73a' : '#9c7424')}"/>`;
  }
  s += `<path d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${P.keyC()}" stroke-width="1"/>`;
  // the block, white, its right side in shade
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'white') + P.shade(P.rect(x1 - 18, top, 18, by - top), 'white', .14);
  // pylons at the corners, rising past the cornice
  for (const px of [x0, x1 - 30]) {
    s += P.fill(P.rect(px, top - 22, 30, 60), 'white') + P.shade(P.rect(px + 22, top - 22, 8, 60), 'white', .15);
    for (let k = 0; k < 3; k++) s += P.flat(P.rect(px + 7 + k * 6, top - 16, 3, 9), '#c9a23a');
  }
  // the gold frieze, the motto, the portal with its laurel
  s += P.flat(P.rect(x0 + 30, top + 26, x1 - x0 - 60, 3), '#c9a23a') + P.flat(P.rect(x0 + 30, top + 31, x1 - x0 - 60, 1), '#c9a23a');
  s += `<g font-family="Georgia,'Times New Roman',serif" font-size="5.6" text-anchor="middle" fill="${P.ink('#a87e22')}" letter-spacing=".4"><text x="${cx}" y="${top + 42}">DER ZEIT IHRE KUNST</text><text x="${cx}" y="${top + 50}">DER KUNST IHRE FREIHEIT</text></g>`;
  s += P.fill(P.rect(cx - 25, top + 56, 50, by - top - 74), 'white', { w: .7 }) + P.shade(P.rect(cx - 25, top + 56, 6, by - top - 74), 'white', .25);
  for (const k of [-1, 1]) {
    s += P.flat(P.rect(cx + k * 30 - 3, top + 56, 6, by - top - 74), '#d4a73a');
    for (let j = 0; j < 7; j++) s += `<circle cx="${f(cx + k * 30)}" cy="${f(top + 62 + j * 9)}" r="2.2" fill="${P.ink('#f0cf6a')}" stroke="${P.ink('#9c7424')}" stroke-width=".4"/>`;
  }
  s += P.fill(`M${cx - 14} ${by - 18}V${top + 82}Q${cx} ${top + 70} ${cx + 14} ${top + 82}V${by - 18}Z`, '#2e5a4a') + P.line(`M${cx} ${by - 18}V${top + 76}`, '#d4a73a', 1);
  for (let j = 0; j < 5; j++) s += P.line(`M${cx - 12} ${top + 88 + j * 9}h24`, '#d4a73a', .6, { op: .8 });
  s += `<path d="M${cx - 22} ${top + 60}q22 -12 44 0" fill="none" stroke="${P.ink('#d4a73a')}" stroke-width="2.4"/>`;
  // the steps
  for (let k = 0; k < 4; k++) s += P.fill(P.rect(cx - 30 - k * 6, by - 18 + k * 4.5, 60 + k * 12, 4.5), 'stone', { w: .45 });
  // bay trees in tubs, clipped round
  for (const [x, sc] of [[422, 1], [528, 1], [566, 1.1]]) s += bayTree(P, x, by - 2, sc);
  return s;
}
function bayTree(P, x, by, s) {
  const { f } = P;
  let d = P.fill(`M${f(x - 7 * s)} ${f(by)}l${f(1.5 * s)} ${f(-11 * s)}h${f(11 * s)}l${f(1.5 * s)} ${f(11 * s)}Z`, '#d9cfbe') + P.line(`M${f(x - 6.5 * s)} ${f(by - 8 * s)}h${f(13 * s)}`, '#8a7a5a', .6);
  d += P.line(`M${f(x)} ${f(by - 11 * s)}v${f(-12 * s)}`, '#5b4532', 1.4 * s);
  const cy = by - 34 * s;
  const lf = P.L.leaf, leaf = lf.leaf ?? lf.ever, light = lf.leaf ? lf.light : P.light(lf.ever, .2);
  d += `<circle cx="${f(x)}" cy="${f(cy)}" r="${f(13 * s)}" fill="${P.ink(lf.leaf ? lf.dark : lf.ever)}" stroke="${P.keyC()}" stroke-width=".8"/>`;
  const r = P.rng(Math.round(x));
  for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, q = Math.sqrt(r()) * 11 * s; d += `<circle cx="${f(x + Math.cos(a) * q)}" cy="${f(cy + Math.sin(a) * q)}" r="${f(1.8 * s)}" fill="${P.ink(Math.cos(a) < 0 && Math.sin(a) < .3 ? light : leaf)}"/>`; }
  return d;
}

// ---------- the house on the left, in perspective ----------
function leftHouse(P) {
  const { f } = P;
  // the face runs from x 22 (near, its top above the window) to x 106 (far)
  const q = (u, v) => [22 + u * 84, (14 + u * 62) * (1 - v) + (346 - u * 40) * v];
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = P.fill(quad(0, 0, 1, 1), 'wall');
  s += P.shade(quad(.86, 0, 1, 1), 'wall', .14);
  const floors = 6, cols = 3;
  for (let r = 0; r < floors; r++) {
    const v0 = .06 + r * .125, v1 = v0 + .085;
    // string course and balconies
    s += P.fill(quad(0, v0 - .025, 1, v0 - .012), 'wall3', { w: .4 });
    for (let c = 0; c < cols; c++) {
      const u0 = .08 + c * .3, u1 = u0 + .15;
      const lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".8"/>`;
      s += P.fill(P.poly([q(u0 - .02, v0 - .004), q((u0 + u1) / 2, v0 - .03), q(u1 + .02, v0 - .004)]), 'wall3', { w: .45 });
      if (r % 2 === 1) s += P.line(`M${q(u0 - .03, v1)[0]} ${f(q(u0 - .03, v1)[1])}L${q(u1 + .03, v1)[0]} ${f(q(u1 + .03, v1)[1])}`, '#2c2b2a', 1.4) + P.line(`M${q(u0 - .03, v1 - .02)[0]} ${f(q(u0 - .03, v1 - .02)[1])}L${q(u1 + .03, v1 - .02)[0]} ${f(q(u1 + .03, v1 - .02)[1])}`, '#2c2b2a', .6);
    }
  }
  // a striped awning over the shop
  const n = 7;
  for (let i = 0; i < n; i++) s += P.flat(P.poly([q(i / n, .8), q((i + 1) / n, .8), [q((i + 1) / n, .86)[0] + 6, q((i + 1) / n, .86)[1]], [q(i / n, .86)[0] + 6, q(i / n, .86)[1]]]), i % 2 ? '#efe6d0' : '#2f6b4a');
  s += P.line(P.poly([q(0, .8), q(1, .8), [q(1, .86)[0] + 6, q(1, .86)[1]], [q(0, .86)[0] + 6, q(0, .86)[1]]]), null, .6);
  s += `<path d="${quad(.04, .87, .96, .98)}" fill="${P.L.windows > .2 ? P.glow('#ffcf7a') : P.ink('#4a3a2c')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  return s;
}

// ---------- the candelabrum ----------
function candelabrum(P, x, by, s) {
  const { f } = P, c = 'iron';
  let d = P.fill(`M${f(x - 7 * s)} ${by}h${f(14 * s)}l-3 -10h${f(-8 * s)}Z`, c, { w: .7 });
  d += P.fill(`M${f(x - 2.6 * s)} ${by - 10}L${f(x - 1.6 * s)} 140H${f(x + 1.6 * s)}L${f(x + 2.6 * s)} ${by - 10}Z`, c, { w: .6 });
  for (const y of [by - 40, 220, 176]) d += P.fill(P.rect(x - 3.4 * s, y, 6.8 * s, 3), c, { w: .5 });
  // two arms, scrolled, each with its globe; a third globe on top
  d += P.line(`M${x} 156q-16 -2 -20 8M${x} 156q16 -2 20 8`, c, 2.2) + P.line(`M${x} 164q-10 0 -13 6M${x} 164q10 0 13 6`, c, 1.1);
  const globe = (gx, gy, r) => {
    const on = P.L.lamps > .05;
    P.glows.push({ x: gx, y: gy, r: 30, depth: 0 });
    return P.fill(P.rect(gx - 2.6, gy + r - 1, 5.2, 5), c, { w: .5 }) + `<circle cx="${gx}" cy="${gy}" r="${r}" fill="${on ? P.glow('#fff0c0') : P.ink('#f1efe6')}" stroke="${P.keyC()}" stroke-width=".7"/>` + (on ? '' : `<path d="M${gx - r * .5} ${gy - r * .2}a${r * .55} ${r * .55} 0 0 1 ${r * .5} ${-r * .45}" stroke="${P.ink('#ffffff')}" stroke-width="1.4" fill="none"/>`);
  };
  d += globe(x - 20, 166, 6.4) + globe(x + 20, 166, 6.4);
  d += P.line(`M${x} 140V126`, c, 1.6) + globe(x, 120, 7);
  return d;
}

// ---------- the couple ----------
function couple(P, x, by) {
  return P.figure(x, by, 1.22, 'gent', { arm: 17 }) + P.figure(x + 40, by + 3, 1.2, 'lady', { flowers: ['#d8576a', '#f08ea0', '#d8576a'] });
}
