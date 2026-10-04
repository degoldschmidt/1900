// Bucharest on the Calea Victoriei: the Romanian Athenaeum behind its little garden, its Ionic portico and the great
// ribbed dome, the new Athénée Palace hotel at the left, a palace with balconies at the right; birje bowling along the
// Calea behind black trotters, their Lipovan drivers in long velvet coats and sashes; strollers, an officer, a flower
// girl, pigeons on the pavement.

export default {
  id: 'BUC',
  greet: 'SALUTĂRI din BUCUREȘTI',
  nation: 'RO',
  flag: 'RO',
  flower: 'peony',
  flower2: 'linden',
  frame: { band: ['#c48d92', '#685055'], gold: '#d8b45e', ink: '#1f2f5a', leaf: ['#6f9a52', '#2f5a36'], year: '#3a2f5a', halo: '#f8eedc' },
  horizon: 300,
  clouds: 4,
  wind: 1,
  birds: { c: '#8b90a0', n: 4, y: 150, s: .95 },
  pal: {
    key: '#2a2526', marble: '#f1ead8', marble2: '#d4c7a8', dome: '#64717d', rib: '#97a5b0', hotel: '#f3eee2', hotel2: '#e0d6c0',
    wall: '#ead6b2', wall2: '#e3c6c0', roof: '#5c6670', mansard: '#4e5a63', ground: '#cfc2a2', setts: '#a89c84',
    garden: '#6f8f4e', glass: '#36435a', sash: '#efe6d6', iron: '#283330', gold: '#d6a83a',
  },

  // a peony, blown and frilled, its buds and cut leaves
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 11, 210, I.leaf[1], { shape: 'serrate' }) + F.leaf(24, 10, 150, I.leaf[0], { shape: 'serrate' }) + F.leaf(19, 8, 262, I.leaf[0], { shape: 'lance' });
    s += F.at(-15, 13, `<circle r="4.4" fill="#d24a6e" stroke="${I.key}" stroke-width=".5"/><path d="M-3 2Q0 6 3 2" stroke="#6f9a52" stroke-width="1.2" fill="none"/>`);
    s += F.radial(7, 17, 15, '#e07a96', { shape: 'frill', lite: '#f6b4c6' }) + F.radial(7, 12, 11, '#ec92aa', { rot: 25, shape: 'frill' });
    s += F.radial(6, 7.5, 7, '#f4b0c2', { rot: 10, shape: 'frill' }) + F.disc(2.6, '#f2d26a', { dots: '#c8963a', n: 6 });
    return s;
  },
  // linden: a spray of pale flowers hanging from their leafy bract, a heart-shaped leaf
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(18, 15, 210, I.leaf[1], { shape: 'heart' }) + F.leaf(15, 12, 140, I.leaf[0], { shape: 'heart' });
    s += F.at(2, -4, `<path d="M0 0C4 -2 10 -6 12 -14C8 -12 3 -8 0 0Z" fill="#c8d89a" stroke="${I.key}" stroke-width=".5"/>`);
    s += F.stem('M2 -2Q0 4 -3 8', '#9aa86a', .8);
    for (const [x, y] of [[-3, 8], [-6, 11], [0, 11], [-3, 13]]) s += F.at(x, y, F.radial(5, 3.2, 2.6, '#f2ecb8', { shape: 'round', k: .35 }) + F.disc(.9, '#d8b84a'));
    return s;
  },

  back(P) {
    let s = '';
    // the town beyond: roofs and a church's domes behind the Athenaeum
    s += P.far(.7, () => P.row(196, 452, 262, { hMin: 18, hMax: 34, wMin: 16, wMax: 28, style: 'paris', seed: 4, walls: ['#ead6b2', '#e3c6c0', '#f3eee2'], roofC: '#5c6670', placard: false, flagSpot: false }));
    s += P.far(.62, () => P.fill(P.rect(436, 216, 18, 30), 'wall') + P.fill(P.onion(445, 216, 14, 16), 'dome') + P.line('M445 200v-6M442 197h6', 'gold', .7));
    s += P.smoke(220, 226, .5);
    return s;
  },

  mid(P, T) {
    let s = '';
    // the garden behind its railing: lindens, beds of flowers, the gravel walk to the steps
    s += P.fill('M196 300H462V314H196Z', 'garden', { k: false });
    s += P.far(.3, () => P.tree(206, 300, 1.7, 'round') + P.tree(232, 304, 1.25, 'round') + P.tree(456, 300, 1.7, 'round') + P.tree(430, 304, 1.25, 'round'));
    // the Athenaeum
    s += P.far(.2, () => athenaeum(P, 330));
    s += P.fill('M196 312H462V316H196Z', 'marble2', { w: .45 });
    s += flowerBeds(P);
    let rail = '';
    for (let x = 198; x < 462; x += 3.2) if (x < 268 || x > 392) rail += `M${P.f(x)} 314v-7`;
    s += P.line(rail, 'iron', .6) + P.line('M196 307.4H268M392 307.4H462', 'iron', 1);
    // the Athénée Palace at the left, a palace of balconies at the right
    s += hotel(P);
    s += palace(P);
    // the far pavement with its candelabra, the strollers on it
    s += P.paving(316, 330, { c: 'ground', vx: 330, seed: 8 });
    s += P.far(.15, () => P.crowd(40, 200, 324, 6, { s: .72, seed: 12 }) + P.crowd(250, 290, 324, 2, { s: .72, seed: 3 }) + P.crowd(376, 560, 324, 6, { s: .72, seed: 31 }));
    s += P.lamp(236, 326, .9, 'iron', { h: 74 }) + P.lamp(428, 326, .9, 'iron', { h: 74 });
    // the Calea: smooth setts, the birje's lanes
    s += P.fill('M24 330H580V362H24Z', 'setts', { k: false });
    let setts = '';
    for (let row = 0; row < 6; row++) { const y = 333 + row * 5 + row * row * .2; for (let x = 20 + (row % 2) * 6; x < 584; x += 12 + row) setts += `M${x} ${P.f(y)}q${3 + row * .4} -1.6 ${7 + row * .7} 0`; }
    s += P.line(setts, '#8c806a', .5, { op: .6 }) + P.flat('M24 330H580V333H24Z', '#7c7260', { op: .5 });
    if (P.L.wet) s += P.flat('M60 346h80v2h-80ZM300 352h120v2h-120ZM470 340h60v2h-60Z', P.L.sky.low, { op: .5, raw: 1 });
    if (P.L.snow) s += P.flat('M24 330H580V362H24Z', '#eef2f6', { op: .6 });
    s += P.setStreet(350, 30, 570, .95);
    s += P.cross(birja(P, { s: .82, dir: -1, seed: 1 }), { y: 341, dir: -1, dur: 30, rest: .3, offset: 4 });
    s += P.cross(birja(P, { s: .96, dir: 1, seed: 2, fare: 'lady' }), { y: 356, dir: 1, dur: 34, rest: .35, offset: 20 });
    s += P.cross(T.motorcar({ s: .8, c: '#5a2a2e' }), { y: 352, dir: -1, dur: 22, rest: .7, offset: 11 });
    s += P.cross(T.walkers({ kinds: ['officer', 'lady'], s: .74, dir: 1, seed: 8, dresses: ['#f2ece0', '#e9c6d0'] }), { y: 326, dir: 1, dur: 100, offset: 30 });
    return s;
  },

  front(P, T) {
    let s = '';
    s += P.paving(362, 380, { c: 'ground', vx: 330, seed: 6 });
    s += P.fill('M24 362H580V364.6H24Z', 'marble2', { w: .45 });
    // pigeons on the kerb
    s += pigeons(P, [[262, 368], [276, 370], [290, 366], [318, 369], [336, 367], [350, 370]]);
    // a flower girl with her basket, a gentleman buying; the lady at the right with her parasol
    s += flowerGirl(P, 140, 376, 1.12) + P.person(160, 376, 1.12, 'gent', { c: '#2c3038', dir: -1 });
    s += P.person(372, 376, 1.1, 'lady', { c: '#f4f0e6', parasol: '#e6a8b8', dir: -1 }) + P.person(388, 376, 1.1, 'boater', { c: '#3a4050', dir: -1 }) + P.person(402, 376, .7, 'child', { c: '#f2efe6', dir: -1 });
    s += P.lamp(90, 378, 1.12, 'globe', { h: 76 }) + P.lamp(560, 378, 1.1, 'globe', { h: 76 });
    // a birjă waiting at the kerb, its driver on the box; a lady walking toward the Athenaeum
    s += T.place(birja(P, { s: 1.3, dir: -1, seed: 3 }), 488, 372, 1);
    s += P.figure(222, 414, 1.1, 'lady', { c: '#e9e2f0', hat: '#efe0c6', flowers: ['#21468b', '#f4c400', '#c8102e'], sash: '#21468b' });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady', 'girl'], s: 1.05, dir: -1, seed: 14, dresses: ['#f2ece0', '#d8e0ee'] }), { y: 380, dir: -1, dur: 70, offset: 26, z: 'fore' });
    return s;
  },
};

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(w * 10) / 10} ${Math.round(h * 10) / 10}" width="${Math.round(w * 10) / 10}" height="${Math.round(h * 10) / 10}">${body}</svg>`;
const flip = (P, dir, w, b) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${b}</g>` : b);

// ---------- the Athenaeum ----------
function athenaeum(P, cx) {
  const { f } = P;
  let s = '';
  const by = 296, rw = 86;  // the rotunda's half width
  // the rotunda behind the portico: pilasters, round-arched windows, an attic
  s += P.fill(P.rect(cx - rw, 206, rw * 2, by - 206), 'marble') + P.shade(P.rect(cx + rw - 26, 206, 26, by - 206), 'marble', .16) + P.stipple(P.rect(cx - rw, 206, rw * 2, by - 206), 'marble', 50, { box: [cx - rw, 206, rw * 2, 90], op: .25 });
  for (const k of [-1, 1]) {
    for (const dx of [62, 80]) s += P.fill(P.rect(cx + k * dx - 2.5, 214, 5, by - 214), 'marble2', { w: .4 });
    s += P.windows(cx + k * 71 - 5, 226, 10, 50, 1, 2, { arched: true, ww: .75, wh: .8 });
    s += P.fill(P.arch(cx + k * 71 - 4, 280, 8, 14), 'glass', { w: .4 });
  }
  s += P.fill(P.rect(cx - rw - 2, 204, rw * 2 + 4, 4), 'marble2', { w: .45 }) + P.fill(P.rect(cx - rw + 2, 196, rw * 2 - 4, 8), 'marble', { w: .45 });
  let bal = '';
  for (let x = cx - rw + 5; x < cx + rw - 3; x += 3.4) bal += `M${f(x)} 203.5v-5.6`;
  s += P.line(bal, 'marble2', 1);
  // the drum with its oculi, then the great dome: ribbed, slate, a ring of lucarnes, the lantern
  s += P.fill(P.rect(cx - 66, 176, 132, 22), 'marble') + P.shade(P.rect(cx + 40, 176, 26, 22), 'marble', .16);
  for (let i = -5; i <= 5; i++) { const x = cx + i * 12; s += P.line(`M${x} 176V198`, 'marble2', .8); if (i < 5) s += `<circle cx="${x + 6}" cy="187" r="3.4" fill="${P.ink('glass')}" stroke="${P.ink('marble2')}" stroke-width=".6"/>`; }
  s += P.fill(P.rect(cx - 68, 174, 136, 3), 'marble2', { w: .45 });
  const dw = 62, dt = 174, dh = 68;
  const prof = `M${cx - dw} ${dt}C${cx - dw} ${dt - dh * .72} ${f(cx - dw * .42)} ${dt - dh * .96} ${cx} ${dt - dh}C${f(cx + dw * .42)} ${dt - dh * .96} ${cx + dw} ${dt - dh * .72} ${cx + dw} ${dt}Z`;
  s += P.fill(prof, 'dome') + P.shade(`M${cx} ${dt - dh}C${f(cx + dw * .5)} ${dt - dh} ${cx + dw} ${dt - dh * .7} ${cx + dw} ${dt}H${cx + 20}C${cx + 20} ${dt - dh * .6} ${cx + 12} ${dt - dh * .95} ${cx} ${dt - dh}Z`, 'dome', .25);
  s += P.lite(`M${cx - dw + 8} ${dt - 2}C${cx - dw + 8} ${dt - dh * .6} ${f(cx - dw * .5)} ${dt - dh * .9} ${cx - 8} ${dt - dh + 2}C${f(cx - dw * .55)} ${dt - dh * .8} ${cx - dw * .8} ${dt - dh * .5} ${cx - dw * .7} ${dt - 2}Z`, 'dome', .25, { op: .8 });
  if (P.L.snow) s += P.flat(`M${cx - dw * .9} ${dt - 20}C${cx - dw * .8} ${dt - dh * .8} ${f(cx - dw * .4)} ${dt - dh} ${cx} ${dt - dh}C${f(cx + dw * .4)} ${dt - dh} ${cx + dw * .8} ${dt - dh * .8} ${cx + dw * .9} ${dt - 20}Q${cx} ${dt - dh * .5} ${cx - dw * .9} ${dt - 20}Z`, '#f2f5f8', { op: .8 });
  for (const k of [-.84, -.56, -.28, 0, .28, .56, .84]) s += P.line(`M${f(cx + k * dw)} ${dt}C${f(cx + k * dw * 1.02)} ${f(dt - dh * .6)} ${f(cx + k * dw * .6)} ${f(dt - dh * .95)} ${cx} ${dt - dh}`, 'rib', 1.3) + P.line(`M${f(cx + k * dw)} ${dt}C${f(cx + k * dw * 1.02)} ${f(dt - dh * .6)} ${f(cx + k * dw * .6)} ${f(dt - dh * .95)} ${cx} ${dt - dh}`, 'gold', .35, { op: .7 });
  // the gilt band and the lucarnes round the dome's foot
  s += P.line(`M${cx - dw + 3} ${dt - 10}Q${cx} ${dt - 16} ${cx + dw - 3} ${dt - 10}`, 'gold', 1.4);
  // little dormers with their pediments round the dome's foot
  for (const k of [-.66, -.33, 0, .33, .66]) { const x = cx + k * dw * .92, y = dt - 20 - (1 - Math.abs(k)) * 4, w = 5.4 * (1 - Math.abs(k) * .35); s += P.fill(`M${f(x - w / 2)} ${f(y + 5)}V${f(y)}L${f(x)} ${f(y - 3)}L${f(x + w / 2)} ${f(y)}V${f(y + 5)}Z`, 'marble', { w: .45 }) + P.flat(P.arch(x - w * .24, y + .4, w * .48, 4.4), 'glass'); }
  s += P.fill(P.rect(cx - 8, dt - dh - 14, 16, 14), 'marble') + P.windows(cx - 7, dt - dh - 12, 14, 10, 3, 1, { arched: true, ww: .5, plain: true });
  s += P.fill(P.dome(cx, dt - dh - 14, 9, 7), 'dome') + P.fill(P.rect(cx - 9, dt - dh - 15.5, 18, 2.4), 'marble2', { w: .4 });
  s += P.line(`M${cx} ${dt - dh - 24}v-9`, 'gold', 1.1) + `<circle cx="${cx}" cy="${dt - dh - 34}" r="1.8" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  // the portico: steps, six Ionic columns, the frieze with its name, the pediment
  const px0 = cx - 60, px1 = cx + 60;
  s += P.fill(P.rect(px0 + 6, 232, 108, by - 232), 'marble2') + P.shade(P.rect(px0 + 6, 232, 108, by - 232), 'marble2', .2);
  for (const k of [-1, 0, 1]) s += P.fill(P.arch(cx + k * 30 - 7, 254, 14, by - 254), '#4a3e36') + P.fill(P.arch(cx + k * 30 - 6, 238, 12, 12), 'glass', { w: .35 });
  for (let i = 0; i < 6; i++) {
    const x = px0 + 8 + i * 20.8;
    s += P.fill(P.rect(x - 3.4, 236, 6.8, by - 240), 'marble', { w: .55 }) + P.shade(P.rect(x + 1, 236, 2.4, by - 240), 'marble', .2);
    for (const dx of [-1.6, 0, 1.6]) s += P.line(`M${f(x + dx)} 238V${by - 6}`, 'marble2', .35, { op: .8 });
    s += P.fill(P.rect(x - 4.6, by - 5, 9.2, 3), 'marble', { w: .4 }) + P.fill(P.rect(x - 5, 233, 10, 3), 'marble', { w: .4 });
    s += `<circle cx="${f(x - 4.4)}" cy="235" r="1.6" fill="none" stroke="${P.ink('marble2')}" stroke-width=".7"/><circle cx="${f(x + 4.4)}" cy="235" r="1.6" fill="none" stroke="${P.ink('marble2')}" stroke-width=".7"/>`;
  }
  s += P.fill(P.rect(px0 - 2, 222, 124, 11), 'marble') + P.line(`M${px0 - 2} 226.4H${px1 + 2}`, 'marble2', .5);
  s += `<text x="${cx}" y="231.4" font-family="Georgia,'Times New Roman',serif" font-size="5.4" letter-spacing=".9" text-anchor="middle" fill="${P.ink('#8a7a5a')}">ATHENEUL ROMÂN</text>`;
  s += P.fill(P.poly([[px0 - 4, 222], [cx, 200], [px1 + 4, 222]]), 'marble') + P.fill(P.poly([[px0 + 6, 220], [cx, 205], [px1 - 6, 220]]), 'marble2', { w: .4 }) + P.shade(P.poly([[cx, 205], [px1 - 6, 220], [cx, 220]]), 'marble2', .1);
  s += `<circle cx="${cx}" cy="214" r="3.6" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".4"/>` + P.line(`M${cx - 6} 215q6 -5 12 0`, 'gold', .8);
  for (const x of [px0 - 4, cx, px1 + 4]) s += P.fill(P.rect(x - 2.4, x === cx ? 194 : 216, 4.8, 6), 'marble', { w: .35 });
  for (let k = 0; k < 6; k++) s += P.fill(P.rect(px0 - k * 3, by + k * 3, 120 + k * 6, 3), 'marble', { w: .35 });
  return s;
}
function flowerBeds(P) {
  const lf = P.L.leaf, r = P.rng(8);
  if (!lf.leaf) return '';
  let s = '';
  const blooms = P.L.season === 'autumn' ? ['#d8843a', '#c85a2a', '#e8b84a'] : ['#d8304a', '#f2f0e6', '#e86a8a', '#f2c84a'];
  for (const [x0, x1] of [[200, 262], [398, 458]]) {
    s += P.fill(`M${x0} 312q${(x1 - x0) / 2} -9 ${x1 - x0} 0Z`, lf.dark, { w: .5 });
    for (let i = 0; i < 16; i++) { const x = x0 + 4 + r() * (x1 - x0 - 8), y = 309 - r() * 5 * Math.sin((x - x0) / (x1 - x0) * Math.PI); s += `<circle cx="${P.f(x)}" cy="${P.f(y)}" r="1.4" fill="${P.ink(blooms[i % blooms.length])}"/>`; }
  }
  return s;
}

// ---------- the Calea's buildings ----------
function hotel(P) {
  const { f } = P;
  let s = '';
  // the Athénée Palace: white, six storeys, a rounded corner under a little dome, a mansard with oval dormers
  const x0 = 24, x1 = 182, by = 318, top = 132;
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'hotel') + P.stipple(P.rect(x0, top, x1 - x0, by - top), 'hotel', 40, { box: [x0, top, x1 - x0, by - top], op: .2 });
  s += P.fill(P.rect(x0, by - 22, x1 - x0, 22), 'hotel2');
  for (let x = x0 + 4; x < x1 - 8; x += 16) s += P.fill(P.arch(x, by - 20, 11, 20), '#3e3a36') + (P.L.windows > .2 ? `<path d="${P.arch(x + 1, by - 19, 9, 18)}" fill="${P.glow('#ffcf7a')}" opacity=".85"/>` : '');
  s += P.windows(x0 + 2, top + 8, x1 - x0 - 30, by - top - 34, 9, 5, { ww: .45, wh: .62 });
  for (let k = 1; k < 5; k += 2) { const y = top + 8 + (by - top - 34) * k / 5 + 2; s += P.line(`M${x0 + 3} ${f(y)}H${x1 - 30}`, 'iron', .9) + P.line(`M${x0 + 3} ${f(y - 2.6)}H${x1 - 30}`, 'iron', .4); }
  for (let k = 0; k <= 5; k++) s += P.line(`M${x0} ${f(top + 6 + (by - top - 28) * k / 5)}H${x1 - 22}`, 'hotel2', .6);
  // the rounded corner and its dome
  s += P.fill(P.rect(x1 - 30, top - 8, 30, by - top + 8), 'hotel') + P.shade(P.rect(x1 - 10, top - 8, 10, by - top + 8), 'hotel', .16);
  s += P.windows(x1 - 28, top, 26, by - top - 26, 2, 6, { ww: .45, wh: .6 });
  s += P.fill(P.dome(x1 - 15, top - 8, 16, 16), 'mansard') + P.fill(P.rect(x1 - 17.5, top - 32, 5, 8), 'hotel', { w: .4 }) + P.line(`M${x1 - 15} ${top - 32}v-6`, 'gold', .7);
  // the mansard and its dormers
  s += P.fill(P.poly([[x0 - 2, top], [x0 + 4, top - 18], [x1 - 30, top - 18], [x1 - 30, top]]), 'mansard');
  if (P.L.snow) s += P.flat(P.poly([[x0 - 2, top], [x0 + 4, top - 18], [x1 - 30, top - 18], [x1 - 30, top]]), '#f2f5f8', { op: .8 });
  for (let x = x0 + 12; x < x1 - 34; x += 18) s += `<ellipse cx="${x}" cy="${top - 9}" rx="4" ry="5" fill="${P.ink('hotel')}" stroke="${P.keyC()}" stroke-width=".5"/>` + P.windows(x - 2.4, top - 12, 4.8, 6, 1, 1, { ww: .9, wh: .9, plain: true });
  s += P.fill(P.rect(x0 - 2, top - 2, x1 - x0 - 26, 3), 'hotel2', { w: .45 });
  s += P.flag(x1 - 15, top - 38, .7, 'RO', { h: 12 });
  s += P.wall(x0 + 30, by - 44, 14, 19) + P.flagAt(x0 + 64, top + 40);
  return s;
}
function palace(P) {
  const { f } = P;
  let s = '';
  // a boyar's palace in the French taste: a rusticated ground floor, balconies on consoles, a mansard
  const x0 = 470, x1 = 580, by = 318, top = 196;
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'wall') + P.shade(P.rect(x0, top, 10, by - top), 'wall', .18);
  for (let y = by - 30; y < by; y += 5) s += P.line(`M${x0} ${y}H${x1}`, '#c9b48e', .5);
  s += P.windows(x0 + 12, top + 10, x1 - x0 - 12, 70, 5, 3, { ww: .44, wh: .66, arched: true });
  for (const y of [top + 36, top + 60]) s += P.fill(P.rect(x0 + 14, y, x1 - x0 - 12, 2.4), 'iron', { w: .3 }) + P.line(`M${x0 + 14} ${y - 4}H${x1}`, 'iron', .5);
  s += P.fill(P.arch(x0 + 50, by - 26, 18, 26), '#4a3a2c') + P.fill(P.poly([[x0 - 2, top], [x0 + 6, top - 20], [x1 + 2, top - 20], [x1 + 2, top]]), 'roof');
  if (P.L.snow) s += P.flat(P.poly([[x0 - 2, top], [x0 + 6, top - 20], [x1 + 2, top - 20], [x1 + 2, top]]), '#f2f5f8', { op: .8 });
  s += P.windows(x0 + 14, top - 15, x1 - x0 - 14, 10, 4, 1, { ww: .4, lit: .5 });
  s += P.fill(P.rect(x0 - 2, top - 2, x1 - x0 + 4, 3), 'wall2', { w: .45 });
  s += P.wall(x0 + 20, by - 46, 14, 19) + P.flagAt(x0 + 74, top + 30);
  return s;
}

// ---------- the birjă and the people ----------
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
  b += P.lite(`M${X(-12)} ${Y(-1)}Q${X(-4)} ${Y(-2.4)} ${X(6)} ${Y(-1)}Q${X(-4)} ${Y(0)} ${X(-12)} ${Y(1)}Z`, c, .3);
  b += `<path d="M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}" stroke="${P.ink('#141210')}" stroke-width="${S(1.4)}"/>`;
  b += `<path d="M${X(-6)} ${Y(-2)}V${Y(7)}M${X(-8)} ${Y(2)}H${X(6)}" stroke="${P.ink('#8a1a1a')}" stroke-width="${S(.8)}"/>`;
  b += leg(-12, sw * .8, false) + leg(4, -sw * .8, false);
  return b;
}
/**
 * A birjă: a light open victoria behind two black trotters, its hood folded back, a fare in the seat; on the box the
 * Lipovan driver in his long dark-blue velvet coat, a bright sash at the waist, a round velvet cap.
 */
function birja(P, o = {}) {
  const f = P.f, s = o.s ?? 1, dir = o.dir ?? 1, W = 112 * s, H = 52 * s, S = (k) => f(k * s);
  const wheel = (cx, cy, r) => { let w = `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(r)}" fill="none" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1.3)}"/>`; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; w += `<path d="M${S(cx - Math.cos(a) * r)} ${S(cy - Math.sin(a) * r)}L${S(cx + Math.cos(a) * r)} ${S(cy + Math.sin(a) * r)}" stroke="${P.ink('#b8322c')}" stroke-width="${S(.6)}"/>`; } return w + `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(1.4)}" fill="${P.ink('#d6a83a')}"/>`; };
  const fare = o.fare === 'lady';
  const frame = (st) => {
    let b = '';
    b += wheel(17, 40, 9.5);
    // the body: a low swept shell, the folded hood behind the fare
    b += P.fill(`M${S(8)} ${S(28)}Q${S(6)} ${S(38)} ${S(16)} ${S(38)}H${S(32)}Q${S(38)} ${S(38)} ${S(42)} ${S(32)}L${S(46)} ${S(26)}H${S(34)}Q${S(30)} ${S(30)} ${S(24)} ${S(30)}L${S(22)} ${S(24)}H${S(10)}Z`, '#1d1c22', { w: .55 });
    b += `<path d="M${S(9)} ${S(33)}H${S(40)}" stroke="${P.ink('#b8322c')}" stroke-width="${S(.7)}"/>`;
    b += P.fill(`M${S(6)} ${S(26)}Q${S(2)} ${S(18)} ${S(10)} ${S(15)}Q${S(14)} ${S(18)} ${S(14)} ${S(25)}Z`, '#26242a', { w: .5 }) + `<path d="M${S(7)} ${S(22)}Q${S(9)} ${S(18)} ${S(12)} ${S(17)}" stroke="${P.ink('#4a4650')}" stroke-width="${S(.5)}" fill="none"/>`;
    // the fare
    if (fare) b += P.fill(`M${S(15)} ${S(26)}L${S(16)} ${S(17)}H${S(21)}L${S(23)} ${S(26)}Z`, '#f2ece0', { w: .4 }) + `<circle cx="${S(18.6)}" cy="${S(14.6)}" r="${S(2.1)}" fill="${P.ink('#e8c4a0')}"/><path d="M${S(13.6)} ${S(13.6)}q${S(5)} ${S(-5)} ${S(10)} 0Z" fill="${P.ink('#e8b9c8')}" stroke="${P.keyC()}" stroke-width="${S(.3)}"/><circle cx="${S(20)}" cy="${S(11.6)}" r="${S(1)}" fill="${P.ink('#c8506a')}"/>`;
    else b += P.fill(`M${S(15)} ${S(26)}L${S(16)} ${S(17)}H${S(21)}L${S(22)} ${S(26)}Z`, '#2f3440', { w: .4 }) + `<circle cx="${S(18.5)}" cy="${S(14.6)}" r="${S(2.1)}" fill="${P.ink('#e8c4a0')}"/><path d="M${S(15.6)} ${S(13.2)}h${S(6)}M${S(16.6)} ${S(13.2)}v${S(-2.6)}h${S(4)}v${S(2.6)}" fill="${P.ink('#1d1a17')}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(1)}"/>`;
    // the box and the driver: a long velvet coat to the boot, a yellow sash, the round cap
    b += P.fill(`M${S(34)} ${S(27)}H${S(46)}V${S(24)}H${S(34)}Z`, '#1d1c22', { w: .4 });
    b += P.fill(`M${S(36)} ${S(30)}L${S(37)} ${S(12)}Q${S(40)} ${S(10)} ${S(43)} ${S(12)}L${S(45)} ${S(30)}Z`, '#1f2a5c', { w: .5 }) + P.lite(`M${S(37)} ${S(13)}L${S(36.4)} ${S(29)}H${S(38.4)}L${S(38.6)} ${S(13)}Z`, '#1f2a5c', .2);
    b += `<path d="M${S(36.6)} ${S(20)}H${S(44.4)}" stroke="${P.ink('#e2b83a')}" stroke-width="${S(1.4)}"/>`;
    b += `<circle cx="${S(40.2)}" cy="${S(8.8)}" r="${S(2.4)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(39)} ${S(10.6)}q${S(1.2)} ${S(2.4)} ${S(2.6)} 0" fill="${P.ink('#7a5a3a')}"/>`;
    b += P.fill(`M${S(37.4)} ${S(7.6)}Q${S(37.6)} ${S(4.2)} ${S(40.2)} ${S(4)}Q${S(43)} ${S(4.2)} ${S(43)} ${S(7.6)}Z`, '#1f2a5c', { w: .35 });
    b += `<path d="M${S(43)} ${S(16)}L${S(76)} ${S(19)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.5)}"/><path d="M${S(41)} ${S(14)}q${S(12)} ${S(-14)} ${S(26)} ${S(-10)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.4)}" fill="none"/>`;
    b += `<path d="M${S(44)} ${S(30)}L${S(70)} ${S(27)}" stroke="${P.ink('#2a1e16')}" stroke-width="${S(1)}"/>`;
    b += wheel(40, 41, 7.5);
    // the pair of black trotters
    b += horseAt(P, 76 * s, 25.5 * s, s, '#2c2826', (st + 1) % 2) + horseAt(P, 71 * s, 27 * s, s, '#1d1a19', st);
    if (P.L.lamps > .05) b += `<rect x="${S(45)}" y="${S(22)}" width="${S(2.2)}" height="${S(3)}" fill="${P.glow('#ffe2a0')}"/><circle cx="${S(46)}" cy="${S(23.5)}" r="${S(6)}" fill="${P.glow('#ffe2a0')}" opacity="${f(.3 * P.L.lamps)}"/>`;
    return flip(P, dir, W, b);
  };
  return { frames: [svg(W, H, frame(0)), svg(W, H, frame(1))], fps: 6, w: W, h: H, ax: W / 2, ay: 49 * s };
}
/** A flower girl: a bright skirt and kerchief, her flat basket heaped with roses and carnations. */
function flowerGirl(P, x, y, s) {
  const { f } = P;
  let d = P.person(x, y, s, 'peasant', { c: '#c8402e', hat: '#f4c400', dir: 1, top: '#f2ece0' });
  d += P.fill(`M${f(x + 1 * s)} ${f(y - 16 * s)}q${f(6 * s)} ${f(1 * s)} ${f(10 * s)} 0l${f(-1 * s)} ${f(3 * s)}h${f(-8 * s)}Z`, '#b08a4a', { w: .4 });
  for (let i = 0; i < 6; i++) d += `<circle cx="${f(x + (2.4 + i * 1.5) * s)}" cy="${f(y - (16.6 + (i % 2) * .8) * s)}" r="${f(1.1 * s)}" fill="${P.ink(['#d8304a', '#f2f0e6', '#e86a8a'][i % 3])}"/>`;
  d += P.flat(`M${f(x - 5.4 * s)} ${f(y - 4 * s)}h${f(10.8 * s)}v${f(1.4 * s)}h${f(-10.8 * s)}Z`, '#21468b');
  return d;
}
function pigeons(P, pts) {
  const { f } = P;
  let s = '';
  pts.forEach(([x, y], i) => {
    const d = i % 2 ? 1 : -1, c = i % 3 ? '#8b90a0' : '#a8a49a';
    s += P.fill(`M${f(x - 3 * d)} ${f(y)}q${f(3 * d)} -3.4 ${f(6 * d)} -1.4l${f(1.6 * d)} ${i % 2 ? .4 : -1.4}l${f(-1 * d)} 1.4q${f(-3 * d)} 1.6 ${f(-6.6 * d)} 0Z`, c, { w: .35 });
    s += `<circle cx="${f(x + 3.6 * d)}" cy="${f(y - (i % 2 ? 1.6 : 3))}" r="1.1" fill="${P.ink('#727888')}"/>` + P.line(`M${f(x)} ${f(y)}v1.4`, '#c9665a', .4);
  });
  return s;
}
