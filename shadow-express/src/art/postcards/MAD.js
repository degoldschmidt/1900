// Madrid at the Cibeles: from the Paseo del Prado the goddess rides her lion-drawn chariot in the middle of the
// crossing; on the left the Banco de España turns its corner under a clock, and beyond it the Calle de Alcalá climbs
// west to the Metrópolis (1911) and its dome with the Phoenix; on the right the street climbs east to the Puerta de
// Alcalá and the Retiro's trees. Trams cross on Alcalá, a mule cart under its tilt and a hired simón wait on the
// Prado; a water-seller, the Guardia Civil in their tricorns, ladies with fans.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'MAD',
  greet: 'RECUERDO de MADRID',
  nation: 'ES',
  flag: 'ES',
  flower: 'carnation',
  flower2: 'jasmine',
  frame: { band: ['#b95b77', '#623748'], gold: '#e2bd68', ink: '#2a1a10', leaf: ['#6f9a58', '#355a3a'], year: '#6a2436', halo: '#faeccf' },
  horizon: 252,
  clouds: 2,
  wind: 1,
  pal: {
    key: '#2b2420', stone: '#ebdfc5', stone2: '#c2ad86', granite: '#a9a69a', wall: '#f0d4a8', wall2: '#e3c294', wall3: '#efe6d3',
    roof: '#9a5a44', slate: '#3e4653', marble: '#e6e1d6', ground: '#e0cca2', road: '#c8b48e', water: '#5c9fb3', bronze: '#4f5a48',
    glass: '#384a5c', sash: '#efe6d2', iron: '#2b3530', gold: '#d9b04a',
  },

  // a carnation: frilled crimson petals in a cup, its green calyx and grey-green blades
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(28, 3.6, 214, '#7a9a86', { shape: 'lance', vein: '#a9c2b0' }) + F.leaf(26, 3.4, 150, '#5f8270', { shape: 'lance', vein: '#a9c2b0' }) + F.leaf(22, 3, 248, '#7a9a86', { shape: 'lance' });
    s += F.stem('M2 22Q1 12 0 6', '#5f8270', 1.4) + F.at(0, 8, '<path d="M-5 0L-3 8H3L5 0Z" fill="#6f9a7a" stroke="' + I.key + '" stroke-width=".5"/>');
    s += F.radial(8, 16, 9, ['#c8202c', '#b0182a'], { rot: 10, shape: 'frill', vein: '#8a1020' });
    s += F.radial(7, 11, 7.6, ['#e03a40', '#d42a36'], { rot: 30, shape: 'frill', lite: '#f27a7a' });
    s += F.radial(5, 6, 5, '#ec5a5a', { rot: 5, shape: 'frill' }) + '<circle r="1.6" fill="#a8142a"/>';
    return s;
  },
  // jasmine: little white stars on a twining stem
  flowerArt2(F) {
    const I = F.I;
    let s = F.stem('M-14 10Q-4 6 2 -2T14 -12', I.leaf[1], .9);
    for (const [x, y, a] of [[-10, 7, 200], [-3, 3, 150], [5, -5, 230], [10, -9, 140]]) s += F.at(x, y, F.leaf(8, 3.4, 0, '#4f7a46', { shape: 'oval', vein: '#8aaa70' }), a);
    for (const [x, y, sc] of [[-6, -4, 1], [4, -12, .9], [10, 2, .85], [-12, -10, .75]]) s += F.at(x, y, F.radial(5, 6.4, 3.4, '#fdfbf4', { shape: 'point', k: .4 }) + '<circle r="1.1" fill="#e8d47a"/>', 18, sc);
    s += F.at(2, 6, '<ellipse rx="1.3" ry="3" fill="#f2d6de" stroke="' + I.key + '" stroke-width=".4"/>', 30);
    return s;
  },

  back(P, T) {
    let s = '';
    // the roofs of the city falling away west, the Retiro's trees beyond the gate in the east
    s += P.far(.72, () => P.row(26, 260, 246, { hMin: 14, hMax: 30, wMin: 14, wMax: 24, style: 'south', seed: 13, walls: ['#ead2ac', '#e2c8a4', '#efe2cc'], roofC: '#a8644c', placard: false, flagSpot: false }));
    s += P.far(.62, () => retiro(P));
    // the Calle de Alcalá: the ground, the street climbing either way from the crossing, its rails
    s += P.flat('M0 246H600V400H0Z', 'ground');
    s += P.far(.4, () => P.flat('M0 252L210 246L290 270H330L470 246L600 250V292H0Z', 'road') + P.line('M0 258L250 262M0 266L250 272M600 258L380 262M600 266L380 272', '#7a7066', .7, { op: .7 }));
    // the Metrópolis at the fork, its dome and the Phoenix, and the Puerta de Alcalá up the hill
    s += P.far(.48, () => metropolis(P, 212, 246));
    s += P.far(.5, () => puerta(P, 470, 247));
    // the gardens of the Buenavista palace across the crossing, the Palacio de Linares beyond on the right
    s += P.far(.36, () => P.tree(250, 262, .9, 'round') + P.tree(232, 266, 1, 'round') + P.tree(352, 262, .85, 'round') + P.tree(270, 258, .7, 'poplar'));
    s += P.far(.4, () => linares(P));
    // trams crossing the square on Alcalá, a carriage, behind the fountain
    s += P.far(.32, () => P.cross(T.tramSide({ c: '#b8862e', band: '#efe0b8', number: '9', s: .5, dir: 1 }), { y: 272, dir: 1, dur: 46, rest: .3, x0: 150, offset: 4 }));
    s += P.far(.34, () => P.cross(T.tramSide({ c: '#b8862e', band: '#efe0b8', number: '22', s: .46, dir: -1 }), { y: 266, dir: -1, dur: 50, rest: .35, x0: 150, offset: 30 }));
    s += P.far(.34, () => P.cross(T.fiacre({ s: .42, dir: 1, horses: 2, body: '#22262a' }), { y: 280, dir: 1, dur: 38, rest: .45, x0: 150, offset: 18 }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the Banco de España, turning its corner under a clock
    s += P.far(.2, () => banco(P));
    // the plaza's near side and the Paseo del Prado
    s += P.paving(296, 384, { vx: 300, seed: 5 });
    s += P.flat(P.ellipse(300, 318, 132, 16), 'road', { op: .6 });
    // the fountain
    s += P.far(.12, () => cibeles(P, 300, 318, 1.12));
    // lamps round the fountain, the crowd at its rail
    s += P.far(.1, () => P.lamp(176, 322, .72, 'iron', { h: 70 }) + P.lamp(424, 322, .72, 'iron', { h: 70 }));
    s += P.far(.08, () => P.crowd(196, 236, 330, 3, { s: .8, seed: 3 }) + P.crowd(366, 414, 331, 4, { s: .8, seed: 7 }));
    // the Paseo: a water-seller, the Guardia Civil, ladies with fans
    s += aguador(P, 120, 342, 1.05) + guardia(P, 432, 334, 1) + guardia(P, 444, 335, 1, -1);
    s += mantilla(P, 92, 350, 1.06, '#2a2226') + P.person(80, 352, 1.08, 'gent', { c: '#3a3530', dir: 1 });
    s += P.person(330, 340, 1, 'girl', { c: '#f2c8d4' }) + P.person(344, 341, 1.04, 'lady', { c: '#f3eee2', parasol: '#e8b9c4', dir: -1 });
    s += P.setStreet(360, 120, 470, 1.1);
    s += P.cross(muleCart(P, 1), { y: 352, dir: 1, dur: 64, rest: .25, offset: 10 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.1, dir: -1, seed: 4, dresses: ['#f3eee2', '#e8c9b0'] }), { y: 368, dir: -1, dur: 70, offset: 30 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady', 'child'], s: 1.02, dir: 1, seed: 11 }), { y: 342, dir: 1, dur: 84, offset: 55, x1: 470 });
    return spanish(s);
  },

  front(P, T, st) {
    let s = '';
    // the chestnut trees of the Prado, a lamp, a simón waiting for a fare
    s += P.tree(560, 372, 2.1, 'round') + P.tree(40, 368, 1.8, 'round');
    s += P.lamp(150, 378, 1.15, 'single', { h: 78 });
    s += kiosk(P, 222, 356) + barquillero(P, 252, 364, 1.06);
    s += T.place(T.fiacre({ s: 1.12, dir: -1, horses: 1, body: '#2a2e32', hood: '#262420', horse: '#5a4030' }), 492, 376);
    return spanish(s);
  },
};

// ---------- the far side ----------
function retiro(P) {
  const lf = P.L.leaf, r = P.rng(6);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const x = 380 + i * 15 + r() * 8, y = 240 - r() * 10, rx = 9 + r() * 7;
    if (!lf.leaf) { s += P.line(`M${x} ${y + 6}v-14M${x} ${y - 2}l-5 -6M${x} ${y - 4}l5 -7`, '#6a5a4a', .8); continue; }
    s += `<path d="${P.blob(x, y - rx * .6, rx, rx * .8, 8, i + 20)}" fill="${P.ink(i % 3 ? lf.leaf : lf.dark)}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  }
  return s;
}
/** The Metrópolis: the rotunda at the fork, its colonnade and attic statues, the slate dome ribbed in gold, the
 * Phoenix on the lantern. cx: the rotunda's axis; by: its foot. */
function metropolis(P, cx, by) {
  const { f } = P;
  let s = '';
  const R = 22, top = by - 84;
  // the wings either side, receding
  s += P.fill(`M${cx - R} ${by}V${top + 4}L${cx - R - 46} ${top + 12}V${by}Z`, 'stone') + P.windows(cx - R - 44, top + 16, 42, by - top - 22, 5, 4, { ww: .4 });
  s += P.fill(`M${cx + R} ${by}V${top + 4}L${cx + R + 22} ${top + 10}V${by}Z`, 'stone') + P.shade(`M${cx + R} ${by}V${top + 4}L${cx + R + 22} ${top + 10}V${by}Z`, 'stone', .2) + P.windows(cx + R + 2, top + 14, 18, by - top - 20, 2, 4, { ww: .4 });
  // the rotunda: rusticated base, two storeys behind paired columns, the cornice
  s += P.fill(P.rect(cx - R, top, 2 * R, by - top), 'stone') + P.shade(P.rect(cx + R * .4, top, R * .6, by - top), 'stone', .18);
  s += P.stipple(P.rect(cx - R, top, 2 * R, by - top), 'stone', 30, { box: [cx - R, top, 2 * R, by - top], op: .3 });
  for (let y = by - 4; y > by - 20; y -= 4) s += P.line(`M${cx - R} ${y}H${cx + R}`, 'stone2', .4, { op: .8 });
  s += P.windows(cx - R + 3, by - 19, 2 * R - 6, 15, 4, 1, { arched: true, ww: .5 });
  s += P.windows(cx - R + 3, top + 14, 2 * R - 6, 46, 4, 3, { ww: .42 });
  for (const k of [-.92, -.36, .36, .92]) { const x = cx + k * R; s += P.fill(P.rect(x - 1.6, top + 10, 3.2, 52), 'stone', { w: .4 }) + P.line(`M${f(x)} ${top + 12}V${top + 60}`, 'stone2', .4); }
  s += P.fill(P.rect(cx - R - 2, top + 6, 2 * R + 4, 4), 'stone2', { w: .5 }) + P.fill(P.rect(cx - R - 3, top, 2 * R + 6, 4), 'stone', { w: .55 });
  // the attic and its statues, the drum
  s += P.fill(P.rect(cx - R + 2, top - 10, 2 * R - 4, 10), 'stone', { w: .5 });
  for (const k of [-.8, -.27, .27, .8]) { const x = cx + k * R; s += P.fill(P.rect(x - 2, top - 13, 4, 3), 'stone2', { w: .3 }) + P.fill(`M${f(x - 1.4)} ${top - 13}L${f(x - 1)} ${top - 20}Q${f(x)} ${top - 22} ${f(x + 1)} ${top - 20}L${f(x + 1.4)} ${top - 13}Z`, 'marble', { w: .35 }); }
  // the dome: slate, ribbed and garlanded in gold
  const dt = top - 44;
  s += P.fill(`M${cx - R + 3} ${top - 10}C${cx - R + 3} ${dt + 6} ${cx - 8} ${dt} ${cx} ${dt}C${cx + 8} ${dt} ${cx + R - 3} ${dt + 6} ${cx + R - 3} ${top - 10}Z`, 'slate');
  s += P.shade(`M${cx + 4} ${dt + .5}C${cx + 12} ${dt + 2} ${cx + R - 3} ${dt + 8} ${cx + R - 3} ${top - 10}H${cx + 8}Z`, 'slate', .25);
  for (const k of [-.66, -.22, .22, .66]) s += P.line(`M${f(cx + k * (R - 3))} ${top - 10}Q${f(cx + k * (R - 3) * .9)} ${dt + 14} ${f(cx + k * 4)} ${dt + 1}`, 'gold', .9);
  s += P.line(`M${cx - R + 6} ${top - 22}Q${cx} ${top - 26} ${cx + R - 6} ${top - 22}`, 'gold', 1.1) + P.line(`M${cx - R + 4} ${top - 14}Q${cx} ${top - 17} ${cx + R - 4} ${top - 14}`, 'gold', .8);
  for (const k of [-.5, 0, .5]) s += `<circle cx="${f(cx + k * 14)}" cy="${top - 30}" r="1.5" fill="${P.ink('gold')}"/>`;
  // the lantern and the Phoenix with its rider, wings raised
  s += P.fill(P.rect(cx - 4, dt - 6, 8, 7), 'gold', { w: .45 }) + P.fill(P.rect(cx - 5, dt - 8, 10, 2.4), 'gold', { w: .4 });
  const py = dt - 8;
  s += P.fill(`M${cx - 2} ${py}L${cx - 1.4} ${py - 7}H${cx + 1.4}L${cx + 2} ${py}Z`, 'bronze', { w: .4 });
  s += P.fill(`M${cx - 1} ${py - 6}Q${cx - 8} ${py - 10} ${cx - 10} ${py - 16}Q${cx - 5} ${py - 12} ${cx - 1} ${py - 9}Z`, 'gold', { w: .4 }) + P.fill(`M${cx + 1} ${py - 6}Q${cx + 8} ${py - 10} ${cx + 10} ${py - 16}Q${cx + 5} ${py - 12} ${cx + 1} ${py - 9}Z`, 'gold', { w: .4 });
  s += `<circle cx="${cx}" cy="${py - 9}" r="1.5" fill="${P.ink('bronze')}" stroke="${P.keyC()}" stroke-width=".3"/>` + P.line(`M${cx} ${py - 10}l1.6 -4`, 'bronze', .8);
  return s;
}
/** The Puerta de Alcalá: five openings, Ionic columns on its western face, the attic with the royal arms and trophies. */
function puerta(P, cx, by) {
  const { f } = P, w = 92, h = 32, x0 = cx - w / 2;
  let s = P.fill(P.rect(x0, by - h, w, h), 'stone') + P.fill(P.rect(x0, by - 6, w, 6), 'granite', { w: .5 });
  s += P.stipple(P.rect(x0, by - h, w, h), 'stone', 30, { box: [x0, by - h, w, h], op: .3 });
  // the openings: three arches in the middle, square-headed at the ends
  for (const [x, ww, arch] of [[x0 + 5, 9, false], [cx - 25, 12, true], [cx - 6, 12, true], [cx + 13, 12, true], [x0 + w - 14, 9, false]]) s += P.fill(arch ? P.arch(x, by - 24, ww, 24) : P.rect(x, by - 19, ww, 19), '#3a3430', { w: .4 });
  for (const x of [x0 + 2, x0 + 17, cx - 29, cx - 10, cx + 9, cx + 28, x0 + w - 17, x0 + w - 2]) s += P.fill(P.rect(x - 1.1, by - h + 3, 2.2, h - 9), 'stone', { w: .35 });
  s += P.fill(P.rect(x0 - 2, by - h - 3, w + 4, 4), 'stone2', { w: .45 });
  // the attic, the arms with their supporters, trophies over the ends
  s += P.fill(P.rect(cx - 22, by - h - 12, 44, 9), 'stone', { w: .45 }) + P.fill(P.rect(cx - 23, by - h - 13.5, 46, 2), 'stone2', { w: .35 });
  s += P.fill(`M${cx - 5} ${by - h - 13}V${by - h - 22}Q${cx} ${by - h - 25} ${cx + 5} ${by - h - 22}V${by - h - 13}Z`, 'stone', { w: .4 }) + `<circle cx="${cx}" cy="${f(by - h - 18)}" r="2.2" fill="${P.ink('gold')}"/>`;
  for (const k of [-1, 1]) s += P.fill(`M${f(cx + k * 6)} ${by - h - 13}q${f(k * 4)} -6 ${f(k * 8)} -5l${f(-k * 1)} 5Z`, 'stone', { w: .35 }) + P.fill(`M${f(cx + k * 40)} ${by - h - 3}l${f(-k * 3)} -8l${f(k * 3)} -3l${f(k * 3)} 3l${f(-k * 1)} 8Z`, 'stone', { w: .35 });
  s += P.shade(P.rect(x0 + w - 10, by - h, 10, h), 'stone', .15);
  return s;
}
function linares(P) {
  let s = P.facade(366, 266, 58, 34, { c: 'wall3', roof: 'flat', side: 10, floors: 2, cols: 6, placard: false });
  for (const x of [362, 418]) s += P.fill(P.rect(x, 222, 10, 44), 'wall3', { w: .5 }) + P.fill(P.poly([[x - 1, 223], [x + 5, 214], [x + 11, 223]]), 'slate', { w: .45 });
  return s;
}

// ---------- the Banco de España ----------
function banco(P) {
  const { f } = P;
  let s = '';
  // the long front on the Prado, receding to the rounded corner at the crossing
  const q = (u, v) => [22 + u * 132, (160 + u * 40) * (1 - v) + (336 - u * 34) * v];
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  s += P.fill(quad(0, 0, 1, 1), 'stone');
  s += P.stipple(quad(0, 0, 1, 1), 'stone', 70, { box: [22, 160, 132, 176], op: .3 });
  s += P.fill(quad(0, .72, 1, 1), 'granite', { w: .6 });
  for (let k = 1; k < 5; k++) s += P.line(P.poly([q(0, .72 + k * .056), q(1, .72 + k * .056)], false), '#7f7c72', .45, { op: .7 });
  // two storeys of tall windows between pilasters, pediments over the first
  for (let i = 0; i < 5; i++) {
    const u0 = .06 + i * .19, u1 = u0 + .1;
    for (const [v0, v1] of [[.26, .48], [.56, .68]]) {
      const lit = P.wr() < P.L.windows, tone = P.wr();
      s += `<path d="${quad(u0, v0, u1, v1)}" fill="${lit ? P.glow(tone < .5 ? '#ffd88a' : '#ffc86a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".7"/>`;
    }
    s += P.fill(P.poly([q(u0 - .015, .26), q((u0 + u1) / 2, .2), q(u1 + .015, .26)]), 'stone2', { w: .4 });
    s += P.fill(quad(u0 - .045, .14, u0 - .025, .72), 'stone2', { w: .35 });
    const g = P.wr() < P.L.windows * .9;
    s += `<path d="${quad(u0, .79, u1, .97)}" fill="${g ? P.glow('#ffd88a') : P.ink('#3a3430')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  }
  // the cornice and the balustrade with its urns
  s += P.fill(quad(-.02, 0, 1.02, .06), 'stone2', { w: .6 }) + P.fill(quad(-.02, -.08, 1.02, 0), 'stone', { w: .5 });
  for (let i = 0; i <= 10; i++) { const [x, y] = q(i / 10, -.08); s += P.fill(`M${f(x - 2)} ${f(y)}q0 -4 2 -6q2 2 2 6Z`, 'stone2', { w: .35 }); }
  s += P.shade(quad(.9, -.05, 1, 1), 'stone', .12);
  s += P.wall(...q(.36, .74).map((v, i) => i ? v : v - 6), 10, 13);
  // the rounded corner at the crossing: columns, the great door, the clock in its aedicule
  const cx = 167, top = 196, by = 302;
  s += P.fill(`M154 ${top}V${by}H180V${top}Z`, 'stone') + P.shade(`M171 ${top}V${by}H180V${top}Z`, 'stone', .2);
  s += P.fill(`M154 ${by - 30}V${by}H180V${by - 30}Z`, 'granite', { w: .5 }) + P.fill(P.arch(161, by - 24, 12, 24), '#3a3430', { w: .45 });
  for (const x of [156, 164, 170, 178]) s += P.fill(P.rect(x - 1.1, top + 14, 2.2, by - top - 46), 'stone', { w: .35 });
  s += P.windows(158, top + 18, 18, 52, 1, 2, { ww: .5, arched: true });
  s += P.fill(P.rect(152, top - 4, 30, 5), 'stone2', { w: .5 });
  s += P.fill(`M156 ${top - 4}V${top - 20}Q${cx} ${top - 30} 178 ${top - 20}V${top - 4}Z`, 'stone', { w: .55 }) + P.clock(cx, top - 13, 6, { tz: -60, face: '#f3eedc', rim: '#c9a23a' });
  for (const k of [-1, 1]) s += P.fill(`M${cx + k * 14} ${top - 4}l${-k * 2} -9q${k * 2} -3 ${k * 4} 0l${-k * 1} 9Z`, 'marble', { w: .35 });
  s += P.flag(cx, top - 28, .55, 'ES', { h: 12 });
  return s;
}

// ---------- the fountain ----------
/** The Cibeles, drawn about its basin's centre at (0, 0) and set in the square at (cx, by) at scale k. */
function cibeles(P, cx, by, k) {
  return `<g transform="translate(${cx} ${by}) scale(${k})">${cibelesBody(P)}</g>`;
}
function cibelesBody(P) {
  const { f } = P;
  let s = '';
  // the basin, its moulded rim and the water in it
  s += P.fill(P.ellipse(0, 0, 92, 14), 'marble', { w: .8 }) + P.shade('M-92 0A92 14 0 0 0 92 0V5A92 14 0 0 1 -92 5Z', 'marble', .15);
  s += P.fill('M-92 0A92 14 0 0 0 92 0V5A92 14 0 0 1 -92 5Z', 'marble', { w: .6 });
  s += P.fill(P.ellipse(0, -1.5, 85, 10.5), 'water', { w: .5 }) + P.lite(P.ellipse(-26, -4, 36, 3), 'water', .4, { op: .7 });
  // the jets: from the rim toward the rock
  for (const [x, d] of [[-70, 1], [70, -1], [-44, 1], [44, -1]]) s += P.line(`M${x} -2q${d * 8} -18 ${d * 18} -6`, '#eef6f8', 1.2, { op: .85 });
  // the rock, its ledges, the cascade spilling down the front
  const rock = 'M-60 -4Q-58 -18 -44 -24L-30 -30Q-8 -36 16 -34Q38 -32 50 -22Q60 -14 62 -4Z';
  s += P.fill(rock, '#bdb198') + P.shade('M16 -34Q38 -32 50 -22Q60 -14 62 -4H26Q30 -20 16 -34Z', '#bdb198', .2);
  s += P.line('M-46 -16q10 -4 22 -2M-12 -26q12 -2 24 0M20 -18q10 -2 22 2', '#8f856e', .6);
  s += P.flat('M-6 -6Q-4 -16 2 -24Q4 -14 6 -6Z', '#d9eef4', { op: .8 });
  // the two lions, pulling to the left
  s += lion(P, -54, -28, 1.06) + lion(P, -40, -31, 1);
  // the traces from the lions to the car
  s += P.line('M-40 -46L-14 -50', '#a89c84', 1.4);
  // the car: a carved chariot on its great wheel
  s += P.fill('M-16 -78H26Q32 -62 22 -40H-10Q-20 -60 -16 -78Z', 'marble') + P.shade('M10 -78H26Q32 -62 22 -40H10Z', 'marble', .16);
  s += P.line('M-14 -66q20 6 38 0M-12 -56q18 5 34 0', '#a89c84', .6) + P.fill('M-18 -80H28L26 -76H-16Z', 'marble', { w: .5 });
  s += `<circle cx="4" cy="-38" r="14" fill="${P.ink('marble')}" stroke="${P.keyC()}" stroke-width=".8"/><circle cx="4" cy="-38" r="10.5" fill="none" stroke="${P.ink('#a89c84')}" stroke-width=".6"/><circle cx="4" cy="-38" r="3" fill="${P.ink('#a89c84')}"/>`;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; s += P.line(`M${f(4 - Math.cos(a) * 10.5)} ${f(-38 - Math.sin(a) * 10.5)}L${f(4 + Math.cos(a) * 10.5)} ${f(-38 + Math.sin(a) * 10.5)}`, '#a89c84', .7); }
  // the goddess enthroned: robes falling over her knees, the towered crown, sceptre and key
  s += P.fill('M-6 -78Q-10 -86 -4 -92L0 -104Q6 -110 12 -104L14 -92Q22 -88 22 -78Z', 'marble');
  s += P.fill('M-8 -78Q-12 -70 -10 -64H18Q22 -70 22 -78Z', 'marble', { w: .6 }) + P.line('M-6 -74q10 3 26 -1M-4 -68q10 2 22 0', '#a89c84', .5);
  s += P.shade('M8 -106Q12 -104 14 -92Q22 -88 22 -78H10Z', 'marble', .18);
  s += `<circle cx="6" cy="-110" r="4.6" fill="${P.ink('marble')}" stroke="${P.keyC()}" stroke-width=".6"/>`;
  s += P.fill('M1.6 -113v-5h2v1.8h1.6v-1.8h1.6v1.8h1.6v-1.8h2v5Z', 'marble', { w: .45 });
  s += P.line('M18 -96V-124', '#9c907a', 1.2) + `<circle cx="18" cy="-125" r="1.5" fill="${P.ink('#9c907a')}"/>`;
  s += P.line('M-2 -98L-10 -92', 'marble', 2.2) + P.line('M-11 -91l-3 2.4M-12.6 -90.6l-1.6 -1.6', '#9c907a', 1);
  return s;
}
/** A marble lion in profile facing left, striding against the traces, its mane heavy. (x, y): the top of its shoulder. */
function lion(P, x, y, k) {
  const { f } = P, X = (n) => f(x + n * k), Y = (n) => f(y + n * k);
  let s = '';
  // far legs, the body, the near legs, the tail with its tuft
  s += P.fill(`M${X(6)} ${Y(8)}L${X(2)} ${Y(20)}H${X(6)}L${X(10)} ${Y(9)}ZM${X(27)} ${Y(8)}L${X(31)} ${Y(20)}H${X(35)}L${X(32)} ${Y(8)}Z`, '#cfc6b2', { w: .45 });
  s += P.fill(`M${X(4)} ${Y(0)}Q${X(18)} ${Y(-3)} ${X(31)} ${Y(1)}Q${X(38)} ${Y(3)} ${X(36)} ${Y(11)}Q${X(26)} ${Y(14)} ${X(16)} ${Y(12)}Q${X(8)} ${Y(13)} ${X(4)} ${Y(9)}Z`, 'marble');
  s += P.shade(`M${X(8)} ${Y(11)}Q${X(20)} ${Y(14)} ${X(35)} ${Y(10)}Q${X(26)} ${Y(13.5)} ${X(16)} ${Y(12.5)}Z`, 'marble', .22);
  s += P.fill(`M${X(10)} ${Y(9)}L${X(10)} ${Y(20)}H${X(14)}L${X(15)} ${Y(10)}ZM${X(25)} ${Y(9)}L${X(24)} ${Y(20)}H${X(28)}L${X(30)} ${Y(9)}Z`, 'marble', { w: .45 });
  s += P.line(`M${X(36)} ${Y(4)}q${f(6 * k)} ${f(1 * k)} ${f(6 * k)} ${f(-8 * k)}`, 'marble', 1.3 * k) + `<circle cx="${X(42)}" cy="${Y(-4.6)}" r="${f(1.6 * k)}" fill="${P.ink('#cfc6b2')}"/>`;
  // the mane: shaggy locks falling over the shoulders and chest
  let mane = `M${X(12)} ${Y(-1)}`;
  const pts = [[10, -8], [6, -12], [1, -13], [-3, -10], [-5, -5], [-5, 1], [-3, 7], [1, 11], [6, 10], [9, 5]];
  for (const [px, py] of pts) mane += `L${X(px + (px > 2 ? 1.6 : -1.6))} ${Y(py + (py > 0 ? 1.4 : -1.4))}L${X(px)} ${Y(py)}`;
  s += P.fill(mane + 'Z', '#d6ccb4');
  for (const [a, b] of [[2, -8], [0, -2], [3, 4], [6, -4]]) s += P.line(`M${X(a)} ${Y(b)}q${f(2 * k)} ${f(2 * k)} ${f(4 * k)} ${f(1.4 * k)}`, '#a89c84', .5);
  // the head, the open jaw roaring
  s += P.fill(`M${X(0)} ${Y(-9)}L${X(-7)} ${Y(-8)}Q${X(-11)} ${Y(-7)} ${X(-11)} ${Y(-4)}L${X(-7)} ${Y(-3)}L${X(-10)} ${Y(-1)}Q${X(-8)} ${Y(2)} ${X(-3)} ${Y(1)}Q${X(1)} ${Y(-2)} ${X(0)} ${Y(-9)}Z`, 'marble', { w: .5 });
  s += `<circle cx="${X(-4)}" cy="${Y(-6.4)}" r="${f(.8 * k)}" fill="${P.ink('#5a5040')}"/>` + P.line(`M${X(-2)} ${Y(-9.6)}l${f(1 * k)} ${f(-1.6 * k)}`, 'marble', 1);
  return s;
}

// ---------- people of the Prado ----------
/** A water-seller: a corduroy jacket and a cap, the great clay jar on his shoulder, a cup in his hand. */
function aguador(P, x, by, s) {
  const { f } = P;
  let d = P.person(x, by, s, 'worker', { c: '#6a5a46', legs: '#4a4038', dir: 1 });
  d += P.fill(`M${f(x + 1 * s)} ${f(by - 25 * s)}q${f(5 * s)} ${f(-1 * s)} ${f(6 * s)} ${f(4 * s)}q${f(1 * s)} ${f(6 * s)} ${f(-4 * s)} ${f(7 * s)}q${f(-5 * s)} 0 ${f(-5 * s)} ${f(-6 * s)}Z`, '#c46a3e', { w: .5 });
  d += P.line(`M${f(x + 3 * s)} ${f(by - 25.5 * s)}v${f(-2 * s)}`, '#c46a3e', 1.4 * s);
  return d;
}
/** A guardia civil: dark coat with yellow belts, the black patent tricorn. dir: which way he faces. */
function guardia(P, x, by, s, dir = 1) {
  const { f } = P;
  let d = P.person(x, by, s, 'gent', { c: '#2c3a33', legs: '#2c3a33', hat: '#151515', dir });
  d += P.line(`M${f(x - 2.6 * s)} ${f(by - 22 * s)}L${f(x + 2.6 * s)} ${f(by - 15 * s)}`, '#d9b04a', .8 * s);
  d += `<path d="M${f(x - 4 * s)} ${f(by - 28.6 * s)}q${f(4 * s)} ${f(-4.6 * s)} ${f(8 * s)} 0q${f(-4 * s)} ${f(-1.4 * s)} ${f(-8 * s)} 0Z" fill="${P.ink('#151515')}" stroke="${P.keyC()}" stroke-width=".4"/>`;
  d += P.line(`M${f(x + 2 * s * dir)} ${f(by - 16 * s)}l${f(1.6 * s * dir)} ${f(-12 * s)}`, '#3b2c1e', .9 * s);
  return d;
}
/** A lady in a black mantilla over a high comb, her fan open. */
function mantilla(P, x, by, s, c) {
  const { f } = P;
  let d = P.person(x, by, s, 'lady', { c, top: c, hat: c });
  d += `<path d="M${f(x - 3.4 * s)} ${f(by - 20 * s)}Q${f(x - 4 * s)} ${f(by - 30 * s)} ${f(x)} ${f(by - 33.4 * s)}Q${f(x + 4 * s)} ${f(by - 30 * s)} ${f(x + 3.4 * s)} ${f(by - 20 * s)}Z" fill="${P.ink('#1a1618')}" opacity=".85"/>`;
  d += `<path d="M${f(x + 3 * s)} ${f(by - 18 * s)}l${f(5 * s)} ${f(-3 * s)}a${f(5 * s)} ${f(5 * s)} 0 0 1 ${f(-1 * s)} ${f(6 * s)}Z" fill="${P.ink('#c8202c')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  return d;
}
/** A mule cart under its hooped canvas tilt, the carter walking at the mule's head (two frames of the walk). */
function muleCart(P, dir = 1) {
  const W = 74, H = 40, { f } = P;
  const frame = (st) => {
    let b = '';
    b += P.fill('M6 14Q6 2 24 2Q42 2 42 14Z', '#e8dcc0', { w: .55 }) + P.shade('M30 3Q42 4 42 14H32Z', '#e8dcc0', .2);
    for (const x of [12, 24, 36]) b += P.line(`M${x} ${x === 24 ? 2.4 : 4}V14`, '#b8a888', .5);
    b += P.fill('M4 14H44V22H4Z', '#7a5a3a', { w: .55 });
    b += `<circle cx="22" cy="27" r="9" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="1.6"/>`;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6 + st * .25; b += `<path d="M${f(22 - Math.cos(a) * 9)} ${f(27 - Math.sin(a) * 9)}L${f(22 + Math.cos(a) * 9)} ${f(27 + Math.sin(a) * 9)}" stroke="${P.ink('#3a2a1e')}" stroke-width=".7"/>`; }
    b += P.line('M42 20L56 18', '#5a4432', 1.2);
    // the mule: long ears, a grey-brown coat
    const m = st ? 2 : -2;
    b += P.line(`M54 26l${m} 10M64 26l${-m} 10M52 26l${-m} 9M66 26l${m} 9`, '#6a5a4c', 2);
    b += P.fill('M50 18Q50 14 56 14H64Q68 14 68 18Q68 26 64 27H54Q50 26 50 18Z', '#7a6a5a', { w: .55 });
    b += P.fill('M64 16L70 8Q71 6 73 8L74 13Q74 15 72 15L69 14L67 19Z', '#7a6a5a', { w: .5 }) + P.line('M70 8l-1 -6M71.4 8l1 -6', '#7a6a5a', 1.2);
    b += P.fill('M55 14H63V17H55Z', '#b8433a', { w: .3 });
    // the carter in his sash and broad hat
    const cxp = 46 + (st ? 1 : 0);
    b += P.person(cxp, 37, .95, 'worker', { c: '#e8e0cc', legs: '#3a3a40', dir: 1, stride: st });
    b += P.line(`M${cxp - 3} 20.6H${cxp + 3}`, '#b8433a', 1.6);
    return dir < 0 ? `<g transform="translate(${W} 0) scale(-1 1)">${b}</g>` : b;
  };
  return { frames: [doc(W, H, frame(0)), doc(W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 36 };
}

/** Spain stayed neutral; were its walls ever to call up the reserves, the kit's French heading would read in Spanish. */
function spanish(s) { return s.replace(/>MOBILISATION</g, '>MOVILIZACIÓN<'); }
/** A newspaper kiosk of iron and glass under its little zinc dome, papers pegged along its sides. */
function kiosk(P, x, by) {
  let s = P.fill(P.rect(x - 13, by - 34, 26, 34), '#4a3a5a') + P.shade(P.rect(x + 5, by - 34, 8, 34), '#4a3a5a', .25);
  s += P.fill(P.rect(x - 9, by - 29, 18, 14), '#efe6d2', { w: .4 });
  for (let i = 0; i < 3; i++) s += P.line(`M${x - 7} ${by - 26 + i * 3.6}h14`, '#4a4440', .6, { op: .7 });
  s += P.fill(P.rect(x - 15, by - 37, 30, 3.4), '#4a3a5a', { w: .45 }) + P.fill(P.onion(x, by - 37, 22, 12), '#7a8a96', { w: .5 }) + P.line(`M${x} ${by - 49}v-4`, '#d9b04a', 1);
  s += P.wall(x - 12, by - 31, 7, 10) + P.wall(x + 5, by - 31, 7, 10);
  return s;
}
/** A barquillero: the wafer-seller with his tall red drum on its strap, the lottery wheel on its lid. */
function barquillero(P, x, by, s) {
  const { f } = P;
  let d = P.person(x, by, s, 'worker', { c: '#e8e0cc', legs: '#3a3a40', dir: -1 });
  d += P.fill(P.rect(x + 3 * s, by - 20 * s, 8 * s, 16 * s), '#b8302c', { w: .5 }) + P.fill(P.ellipse(x + 7 * s, by - 20 * s, 4 * s, 1.4 * s), '#d9b04a', { w: .35 });
  d += P.line(`M${f(x + 7 * s)} ${f(by - 21 * s)}v${f(-2.4 * s)}`, '#d9b04a', .8);
  return d;
}
