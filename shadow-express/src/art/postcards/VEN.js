// Venice from the Bacino: the Doge's Palace on the right, its pink-and-white lozenge wall riding over the loggia's
// quatrefoils and the ground arcade; the two columns of the Piazzetta with St Mark's lion and St Theodore, the clock
// tower at the far end; the Campanile, rebuilt in 1912 where the old one fell, its golden angel turning to the wind;
// the Libreria and the Zecca, the Giardinetti, and across the mouth of the Grand Canal the Salute and the Dogana's
// golden ball. Gondolas glide and wait at their striped poles, a vaporetto puffs past, pigeons wheel over the Molo.

const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export default {
  id: 'VEN',
  greet: 'SALUTI da VENEZIA',
  nation: 'IT',
  flag: 'IT',
  flower: 'lily',
  flower2: 'water-lily',
  frame: { band: ['#952323', '#501b1e'], gold: '#e2bf68', ink: '#1f3a3a', leaf: ['#78a05a', '#35603e'], year: '#6a1f22', halo: '#fbf0d6' },
  horizon: 252,
  clouds: 3,
  wind: -1,
  birds: { c: '#9fa2ac', n: 6, y: 128, s: .9, x: .42 },
  pal: {
    key: '#2a2422', istria: '#efe9da', istria2: '#c3b89e', pink: '#e7b4a6', brick: '#b0654a', copper: '#6fa58e', wall: '#efdcbc',
    wall2: '#e8c8b0', wall3: '#f1e6d0', roof: '#b0573c', water: '#3f8f8f', lagoon: '#6aa6a2', ground: '#ddd2bc', bronze: '#56604c',
    glass: '#384858', sash: '#f1e8d4', iron: '#2a3430', gold: '#dbb042',
  },

  // a Madonna lily: six white pointed petals curling back, golden anthers on long filaments
  flowerArt(F) {
    const I = F.I;
    let s = F.leaf(26, 6, 210, '#3f6e46', { shape: 'lance', vein: '#8ab478' }) + F.leaf(24, 5.4, 150, '#4f7e50', { shape: 'lance', vein: '#8ab478' }) + F.leaf(20, 5, 250, '#4f7e50', { shape: 'lance' });
    s += F.at(-14, 12, '<ellipse rx="2.6" ry="6" fill="#f3efe2" stroke="' + I.key + '" stroke-width=".5" transform="rotate(-30)"/>');
    s += F.radial(3, 18, 8.6, '#f2eee2', { rot: 0, shape: 'point', vein: '#d8d2bc' }) + F.radial(3, 17, 8, '#fbf9f2', { rot: 60, shape: 'point', lite: '#ffffff', vein: '#e2dccb' });
    for (let i = 0; i < 6; i++) { const a = (i * 60 + 30) * Math.PI / 180, x = Math.cos(a) * 8, y = Math.sin(a) * 8; s += `<path d="M0 0L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#c9c27a" stroke-width=".6"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.6" ry=".8" fill="#e0a52a" transform="rotate(${(i * 60 + 30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    s += F.disc(2, '#c8d48a');
    return s;
  },
  // a water-lily: pale pink cup on a round split pad
  flowerArt2(F) {
    const I = F.I;
    let s = F.at(0, 5, `<path d="M0 0L13 -3A13 7 0 1 1 13 3Z" fill="#4f8a50" stroke="${I.key}" stroke-width=".55"/><path d="M0 0L-10 -3M0 0L-8 4M0 0L4 6" stroke="#2f6a3a" stroke-width=".5"/>`, 180);
    s += F.at(0, 1, F.radial(8, 10, 5, ['#f4d8e0', '#fbeef2'], { rot: 22, shape: 'point', vein: '#e2a8b8' }), 0, 1) + F.radial(6, 7, 4.6, '#fdf5f7', { rot: 0, shape: 'point' }) + F.disc(2.2, '#e8c23a', { dots: '#c8962a', n: 6 });
    return s;
  },

  back(P, T) {
    let s = '';
    // the lagoon, the Salute and the Dogana across the Grand Canal
    s += P.water(250, 384, { seed: 5, shimmer: 8, x0: 40, x1: 560, c: 'water' });
    s += P.far(.7, () => P.fill('M0 250H36Q60 246 90 248H200V252H0Z', 'lagoon', { w: .4 }));
    s += P.far(.55, () => salute(P, 84, 252) + dogana(P, 152, 252));
    s += P.far(.5, () => P.cross(T.sail({ s: .5, rig: 'lateen', sailC: '#d98a3a', hull: '#2a2a2a', strake: '#c8402e', dir: 1 }), { y: 262, dir: 1, dur: 120, rest: .3, x0: 30, x1: 230, offset: 30 }));
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the Giardinetti, the Zecca and the Libreria, the Campanile over them
    s += P.far(.4, () => P.tree(176, 254, .9, 'round') + P.tree(196, 256, .78, 'round') + P.tree(160, 256, .7, 'poplar'));
    s += P.far(.35, () => campanile(P, 312, 252));
    s += P.far(.36, () => zecca(P) + libreria(P));
    s += P.far(.38, () => orologio(P, 330, 244));
    s += P.far(.45, () => { let d = ''; for (const [x, r] of [[374, 13], [410, 15], [444, 12]]) d += P.fill(P.dome(x, 160, r, r * .9), '#9aa2a0') + P.shade(`M${x + 2} ${160 - r * .9}C${x + r * .6} ${160 - r * .85} ${x + r} ${160 - r * .5} ${x + r} 160H${x + 3}Z`, '#9aa2a0', .2) + P.fill(P.onion(x, 160 - r * .86, 6, 8), 'gold', { w: .4 }) + P.line(`M${x} ${160 - r * .86 - 8}v-5M${x - 2} ${160 - r * .86 - 11}h4`, 'gold', .8); return d; });
    // the two columns of the Piazzetta
    s += P.far(.3, () => column(P, 296, 262, 'theodore') + column(P, 334, 262, 'lion'));
    // the Doge's Palace
    s += P.far(.22, () => palace(P));
    // the Molo's edge, its lamps, strollers and pigeons
    s += P.fill('M0 258H600V266H0Z', 'istria', { w: .6 }) + P.shade('M0 263H600V266H0Z', 'istria', .2);
    s += P.far(.2, () => { let d = ''; for (const x of [238, 360, 452, 540]) d += P.lamp(x, 259, .46, 'iron', { h: 70 }); return d; });
    s += P.far(.2, () => P.crowd(224, 330, 259, 7, { s: .46, seed: 5, kinds: ['gent', 'lady', 'boater', 'lady', 'priest'] }) + P.crowd(360, 560, 260, 12, { s: .48, seed: 8 }));
    s += P.setStreet(258, 210, 574, .48);
    s += fade(P, T.walkers({ kinds: ['gent', 'lady'], s: .48, dir: -1, seed: 3 }), { y: 259, dir: -1, dur: 70, offset: 5, x0: 214, x1: 580 });
    // the striped mooring poles and the gondolas waiting at them
    s += moored(P);
    s += pontoon(P, 470, 286);
    // on the Bacino: gondolas gliding, one with its cabin; the vaporetto for the Lido
    s += P.mover(vaporetto(P, -1), { path: [[610, 280, 1, 0], [420, 280, 1, .3], [420, 280, 1, .42], [-60, 282, 1, .9], [-60, 282, 1, 1]], dur: 80, offset: 10 });
    // (in the cold months the gondolas carry their black felze, the cabin, against the wind)
    const cold = st.season === 'winter' || st.season === 'autumn';
    s += P.cross(T.gondola({ s: .8, dir: 1, felze: cold }), { y: 300, dir: 1, dur: 84, offset: 20 });
    s += P.cross(T.gondola({ s: 1.05, dir: -1, felze: true }), { y: 322, dir: -1, dur: 96, rest: .15, offset: 50 });
    s += P.cross(T.gondola({ s: 1.25, dir: 1, felze: cold }), { y: 350, dir: 1, dur: 110, rest: .2, offset: 75 });
    // a bragozzo from Chioggia under her painted sails
    s += fade(P, bragozzo(P, -1, .78), { y: 292, dir: -1, dur: 140, rest: .2, offset: 100, x0: 300, x1: 600 });
    return s;
  },

  front(P, T, st) {
    let s = '';
    // a gondola waiting in the foreground, its ferro raised, and a pair of poles striped in a family's colours
    s += T.place(T.gondola({ s: 2.05, dir: 1, felze: st.season === 'winter' }), 118, 362);
    for (const [x, c] of [[226, '#c8402e'], [244, '#c8402e']]) s += palo(P, x, 300, 392, c, 1.5);
    // another waiting at a pair of blue-and-white poles on the right
    s += T.place(T.gondola({ s: 1.45, dir: -1, felze: st.season !== 'summer' }), 438, 352);
    for (const x of [372, 386]) s += palo(P, x, 300, 392, '#2f5f9a', 1.2);
    return s;
  },
};

// ---------- across the water ----------
function salute(P, cx, by) {
  const { f } = P;
  let s = '';
  // behind: the lesser dome and the two slender campanili
  for (const x of [cx + 40, cx + 64]) s += P.fill(P.rect(x - 3.4, by - 92, 6.8, 52), 'istria', { w: .45 }) + P.fill(P.arch(x - 1.6, by - 88, 3.2, 6), '#4a4038', { w: .3 }) + P.fill(P.onion(x, by - 91.5, 7, 9), 'istria2', { w: .4 }) + P.line(`M${x} ${by - 100}v-4`, '#8a7a5a', .7);
  s += P.fill(P.rect(cx + 42, by - 62, 20, 12), 'istria', { w: .45 }) + P.fill(P.dome(cx + 52, by - 62, 12, 13), 'istria2', { w: .5 }) + P.fill(P.rect(cx + 50, by - 82, 4, 7), 'istria', { w: .35 });
  // the octagon: its front a triumphal arch between paired columns, statues on the cornice, steps to the water
  for (let i = 0; i < 3; i++) s += P.fill(P.rect(cx - 30 + i * 3, by - 3 + i * -2.4, 60 - i * 6, 3), 'istria2', { w: .35 });
  s += P.fill(P.rect(cx - 44, by - 46, 88, 40), 'istria') + P.shade(P.rect(cx + 22, by - 46, 22, 40), 'istria', .16);
  s += P.fill(P.rect(cx - 13, by - 54, 26, 48), 'istria', { w: .5 }) + P.fill(P.arch(cx - 7, by - 36, 14, 30), '#4a4038', { w: .4 }) + P.fill(P.gable(cx - 15, by - 53, 30, 9), 'istria', { w: .45 });
  for (const x of [cx - 38, cx - 30, cx - 20, cx + 20, cx + 30, cx + 38]) s += P.fill(P.rect(x - 1.3, by - 44, 2.6, 36), 'istria', { w: .3 });
  for (const x of [cx - 34, cx - 25, cx + 25, cx + 34, cx]) s += P.fill(`M${x - 1.4} ${by - (x === cx ? 62 : 46)}l.4 -6q1 -1.6 2 0l.4 6Z`, 'istria', { w: .3 });
  // the drum ringed by the great volutes, statues riding on them
  s += P.fill(P.rect(cx - 30, by - 76, 60, 30), 'istria', { w: .55 }) + P.shade(P.rect(cx + 12, by - 76, 18, 30), 'istria', .14) + P.windows(cx - 26, by - 72, 52, 20, 6, 1, { arched: true, ww: .42 });
  for (const k of [-1, 1]) for (const [dx, sc] of [[34, 1], [22, .8]]) {
    const x = cx + k * dx;
    s += `<path d="M${f(x)} ${f(by - 46)}c${f(k * 8 * sc)} ${f(-2 * sc)} ${f(k * 9 * sc)} ${f(-12 * sc)} ${f(k * 2 * sc)} ${f(-16 * sc)}c${f(-k * 4 * sc)} ${f(-2 * sc)} ${f(-k * 7 * sc)} ${f(2 * sc)} ${f(-k * 4 * sc)} ${f(5 * sc)}c${f(k * 2 * sc)} ${f(2 * sc)} ${f(k * 4 * sc)} 0 ${f(k * 3 * sc)} ${f(-2 * sc)}" fill="${P.ink('istria')}" stroke="${P.keyC()}" stroke-width=".7"/>`;
    s += `<circle cx="${f(x + k * 2 * sc)}" cy="${f(by - 64 * sc - (1 - sc) * 30)}" r="${f(1.8 * sc)}" fill="${P.ink('istria')}" stroke="${P.keyC()}" stroke-width=".35"/>`;
  }
  s += P.fill(P.rect(cx - 32, by - 78, 64, 3), 'istria2', { w: .4 });
  // the great dome, ribbed, its lantern and the Virgin on the top
  s += P.fill(P.dome(cx, by - 78, 30, 30), '#cfc9bb') + P.shade(`M${cx + 6} ${by - 107}C${cx + 22} ${by - 104} ${cx + 30} ${by - 94} ${cx + 30} ${by - 78}H${cx + 10}Z`, '#cfc9bb', .2);
  for (const k of [-.7, -.35, 0, .35, .7]) s += P.line(`M${f(cx + k * 30)} ${by - 78}Q${f(cx + k * 22)} ${by - 104} ${cx} ${by - 108}`, '#9a907a', .5);
  s += P.fill(P.rect(cx - 6, by - 120, 12, 12), 'istria', { w: .45 }) + P.fill(P.arch(cx - 2, by - 118, 4, 8), '#4a4038', { w: .25 }) + P.fill(P.dome(cx, by - 119.5, 6.4, 6), '#cfc9bb', { w: .4 });
  s += P.fill(`M${cx - 1.2} ${by - 125}l.3 -7q.9 -1.4 1.8 0l.3 7Z`, 'istria', { w: .3 }) + `<circle cx="${cx}" cy="${by - 133}" r="1" fill="${P.ink('istria')}"/>`;
  return s;
}
function dogana(P, x, by) {
  let s = P.fill(P.rect(x - 22, by - 16, 46, 16), 'istria', { w: .5 }) + P.windows(x - 20, by - 13, 42, 10, 6, 1, { arched: true, ww: .4 });
  s += P.fill(P.rect(x + 10, by - 30, 12, 14), 'istria', { w: .45 }) + `<circle cx="${x + 16}" cy="${by - 34}" r="4" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".5"/>` + P.line(`M${x + 16} ${by - 38}l3 -6`, 'gold', 1);
  return s;
}

// ---------- the Piazzetta ----------
/** The Campanile, rebuilt as it was: brick shaft with pilaster strips, the white belfry, the attic with St Mark's
 * lions, the green spire and the golden angel. (cx, by): the axis at its foot. */
function campanile(P, cx, by) {
  const { f } = P, w = 22;
  let s = '';
  const sh = by - 84;
  s += P.fill(P.rect(cx - w / 2, sh, w, by - sh), 'brick') + P.shade(P.rect(cx + 4, sh, 7, by - sh), 'brick', .2);
  s += P.stipple(P.rect(cx - w / 2, sh, w, by - sh), 'brick', 40, { box: [cx - w / 2, sh, w, by - sh], op: .3 });
  for (const k of [-.8, -.25, .25, .8]) s += P.line(`M${f(cx + k * w / 2)} ${sh + 2}V${by}`, '#c98a6a', .7, { op: .8 });
  // the belfry: white stone, four arches a face, and the bells
  const bt = sh - 18;
  s += P.fill(P.rect(cx - w / 2 - 1, sh - 2, w + 2, 3), 'istria', { w: .45 });
  s += P.fill(P.rect(cx - w / 2, bt, w, 16), 'istria') + P.shade(P.rect(cx + 4, bt, 7, 16), 'istria', .18);
  for (let i = 0; i < 4; i++) s += P.fill(P.arch(cx - w / 2 + 1.6 + i * 5, bt + 2, 3.4, 12), '#3a3430', { w: .3 });
  s += `<circle cx="${cx - 3}" cy="${bt + 8}" r="1.4" fill="${P.ink('gold')}"/><circle cx="${cx + 3}" cy="${bt + 8}" r="1.4" fill="${P.ink('gold')}"/>`;
  s += P.fill(P.rect(cx - w / 2 - 1.5, bt - 2.6, w + 3, 3), 'istria', { w: .45 });
  // the attic with the lion and the figures of Venice
  const at = bt - 20;
  s += P.fill(P.rect(cx - w / 2 + 1, at, w - 2, 18), 'brick') + P.shade(P.rect(cx + 4, at, 6, 18), 'brick', .2);
  s += P.fill(P.rect(cx - 6, at + 4, 12, 9), 'istria', { w: .35 }) + P.fill(`M${cx - 4} ${at + 11}q2 -5 6 -4l2 -2q1 3 -1 5Z`, 'gold', { w: .25 });
  // the spire: a green pyramid, four little gables at its foot, the angel on the tip
  s += P.fill(P.rect(cx - w / 2, at - 2, w, 3), 'istria', { w: .45 });
  const tip = at - 36;
  s += P.fill(`M${cx - w / 2 + 1} ${at - 2}L${cx} ${tip}L${cx + w / 2 - 1} ${at - 2}Z`, 'copper') + P.shade(`M${cx} ${tip}L${cx + w / 2 - 1} ${at - 2}H${cx + 1}Z`, 'copper', .22);
  for (const k of [-1, 1]) s += P.fill(P.gable(cx + k * 6 - 3, at - 2, 6, 6), 'copper', { w: .35 });
  s += P.fill(P.rect(cx - 1.6, tip - 2, 3.2, 3), 'gold', { w: .3 });
  s += P.fill(`M${cx - 1.4} ${tip - 2}L${cx - 1} ${tip - 9}Q${cx} ${tip - 10.4} ${cx + 1} ${tip - 9}L${cx + 1.4} ${tip - 2}Z`, 'gold', { w: .35 }) + P.fill(`M${cx + .8} ${tip - 8}l5 -2.4l-4.4 4Z`, 'gold', { w: .3 }) + `<circle cx="${cx}" cy="${tip - 11}" r="1.1" fill="${P.ink('gold')}"/>`;
  return s;
}
/** The clock tower at the far end of the Piazzetta: its blue and gold dial, the Moors on the roof. */
function orologio(P, cx, by) {
  const { f } = P;
  let s = P.fill(P.rect(cx - 9, by - 34, 18, 34), 'istria') + P.fill(P.rect(cx - 6, by - 10, 12, 10), '#4a4038', { w: .35 });
  s += P.fill(P.rect(cx - 7, by - 31, 14, 14), '#2f4f8a', { w: .4 }) + P.clock(cx, by - 24, 5, { tz: 0, face: '#2f4f8a', rim: '#dbb042', hands: '#e8c24a' });
  s += P.fill(P.rect(cx - 9, by - 40, 18, 6), 'istria', { w: .4 }) + P.flat(P.rect(cx - 3, by - 39, 6, 4), 'gold');
  for (const k of [-1, 1]) s += `<circle cx="${cx + k * 3}" cy="${by - 44}" r="1.2" fill="${P.ink('#3a3430')}"/>`;
  return s;
}
function zecca(P) {
  let s = P.fill(P.rect(204, 214, 34, 46), 'istria') + P.shade(P.rect(230, 214, 8, 46), 'istria', .15);
  for (let y = 222; y < 258; y += 4) s += P.line(`M204 ${y}H238`, 'istria2', .4, { op: .7 });
  s += P.windows(206, 218, 30, 38, 3, 3, { ww: .4 }) + P.fill(P.rect(202, 210, 38, 5), 'istria2', { w: .45 });
  s += P.flagAt(206, 226);
  return s;
}
/** The Libreria: its long front on the Piazzetta, Doric arcade below, Ionic above, the balustrade and its statues. */
function libreria(P) {
  const { f } = P;
  const q = (u, v) => [236 + u * 64, (206 + u * 14) * (1 - v) + (260 - u * 6) * v];
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  let s = P.fill(quad(0, 0, 1, 1), 'istria');
  for (let i = 0; i < 9; i++) {
    const u0 = .03 + i * .107, u1 = u0 + .07;
    s += `<path d="${quad(u0, .62, u1, 1)}" fill="${P.ink('#4a4038')}"/>`;
    const on = P.wr() < P.L.windows;
    s += `<path d="${quad(u0 + .005, .22, u1 - .005, .5)}" fill="${on ? P.glow('#ffd88a') : P.ink('glass')}" stroke="${P.ink('sash')}" stroke-width=".5"/>`;
  }
  s += P.fill(quad(-.01, .54, 1.01, .6), 'istria2', { w: .4 }) + P.fill(quad(-.01, .04, 1.01, .12), 'istria2', { w: .4 });
  for (let i = 0; i <= 9; i++) { const [x, y] = q(i / 9, 0); s += P.fill(`M${f(x - 1.2)} ${f(y)}L${f(x - .8)} ${f(y - 6)}Q${f(x)} ${f(y - 7.4)} ${f(x + .8)} ${f(y - 6)}L${f(x + 1.2)} ${f(y)}Z`, 'istria', { w: .3 }); }
  s += P.flagAt(...q(.4, .3));
  return s;
}
/** A column of the Piazzetta: granite shaft, Byzantine capital, St Mark's winged lion or St Theodore on his crocodile. */
function column(P, x, by, who) {
  const { f } = P;
  let s = P.fill(P.rect(x - 6, by - 8, 12, 8), 'istria2', { w: .45 }) + P.fill(`M${x - 3.2} ${by - 8}L${x - 2.6} ${by - 64}H${x + 2.6}L${x + 3.2} ${by - 8}Z`, '#b8b2a6') + P.shade(`M${x + .6} ${by - 8}L${x + .6} ${by - 64}H${x + 2.6}L${x + 3.2} ${by - 8}Z`, '#b8b2a6', .25);
  s += P.fill(`M${x - 3} ${by - 64}L${x - 5} ${by - 70}H${x + 5}L${x + 3} ${by - 64}Z`, 'istria', { w: .4 }) + P.fill(P.rect(x - 5.4, by - 72, 10.8, 2.4), 'istria', { w: .35 });
  if (who === 'lion') {
    s += P.fill(`M${x - 6} ${by - 72}L${x - 6} ${by - 77}Q${x - 2} ${by - 80} ${x + 4} ${by - 78}L${x + 7} ${by - 82}Q${x + 9} ${by - 80} ${x + 7} ${by - 76}L${x + 6} ${by - 72}Z`, 'bronze');
    s += P.fill(`M${x - 3} ${by - 78}Q${x - 6} ${by - 88} ${x - 10} ${by - 90}Q${x - 4} ${by - 86} ${x - 1} ${by - 79}Z`, 'bronze', { w: .4 }) + P.fill(`M${x} ${by - 78}Q${x - 1} ${by - 88} ${x - 4} ${by - 92}Q${x + 2} ${by - 88} ${x + 2} ${by - 79}Z`, 'bronze', { w: .4 });
  } else {
    s += P.fill(`M${x - 7} ${by - 72}Q${x} ${by - 75} ${x + 8} ${by - 72}L${x + 6} ${by - 74}Q${x} ${by - 76} ${x - 6} ${by - 74}Z`, '#8a9a6a', { w: .35 });
    s += P.fill(`M${x - 2} ${by - 74}L${x - 1.6} ${by - 85}Q${x} ${by - 87} ${x + 1.6} ${by - 85}L${x + 2} ${by - 74}Z`, 'istria', { w: .4 }) + `<circle cx="${x}" cy="${by - 88}" r="1.6" fill="${P.ink('istria')}" stroke="${P.keyC()}" stroke-width=".35"/>` + P.line(`M${x + 2} ${by - 84}l2 -8`, 'istria2', .7);
  }
  return s;
}

// ---------- the Doge's Palace ----------
function palace(P) {
  const { f } = P;
  // u along the south front from the Piazzetta corner (0) to past the frame (1); v from the cresting (0) to the Molo (1)
  const q = (u, v) => [342 + u * 268, (152 - u * 26) * (1 - v) + (258 + u * 8) * v];
  const quad = (u0, v0, u1, v1) => P.poly([q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1)]);
  const V = { wall: .07, loggia: .57, tracery: .66, arcade: .79 };
  let s = '';
  // the great wall: rose marble with its white lozenges
  const wallD = quad(0, V.wall, 1, V.loggia), id = `${P.uid}lz${P._st++}`;
  s += P.fill(wallD, 'pink');
  let lz = '';
  for (let k = -14; k < 34; k++) { const [x0, y0] = q(k / 22, V.wall), [x1, y1] = q((k + 7) / 22, V.loggia); lz += `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}M${f(x1)} ${f(y0)}L${f(x0)} ${f(y1)}`; }
  s += `<clipPath id="${id}"><path d="${wallD}"/></clipPath><path d="${lz}" stroke="${P.ink('istria')}" stroke-width=".9" opacity=".85" clip-path="url(#${id})"/>`;
  // its windows, the balcony window of 1404 in the middle with its canopy and Justice
  for (const [u, big] of [[.07, 0], [.2, 0], [.33, 0], [.47, 1], [.6, 0], [.73, 0], [.86, 0]]) {
    const w = big ? .07 : .045, v0 = big ? .2 : .22, v1 = big ? .5 : .44, on = P.wr() < P.L.windows;
    const [x0, y0] = q(u - w / 2, v1), [x1] = q(u + w / 2, v1), [, yt] = q(u, v0);
    s += `<path d="${P.gothic(x0, yt, x1 - x0, y0 - yt)}" fill="${on ? P.glow('#ffd88a') : P.ink('glass')}" stroke="${P.ink('istria')}" stroke-width="1.4"/>`;
    if (big) { s += P.fill(P.rect(x0 - 3, y0, x1 - x0 + 6, 3), 'istria', { w: .4 }) + P.fill(P.gothic(x0 - 3, yt - 16, x1 - x0 + 6, 14), 'istria', { w: .45 }) + P.fill(`M${f((x0 + x1) / 2 - 1.6)} ${f(yt - 16)}l.4 -7h2.4l.4 7Z`, 'istria', { w: .3 }); }
  }
  for (const u of [.135, .8]) { const [x, y] = q(u, .16); s += `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="${P.ink('glass')}" stroke="${P.ink('istria')}" stroke-width="1.1"/>`; }
  // the cresting of little white merlons
  s += P.fill(quad(0, V.wall - .015, 1, V.wall + .005), 'istria', { w: .45 });
  for (let i = 0; i < 40; i++) { const u = i / 40 + .012, [x, y] = q(u, V.wall - .015), [, y2] = q(u, -.01); s += P.fill(`M${f(x - 2)} ${f(y)}V${f((y + y2) / 2)}L${f(x)} ${f(y2)}L${f(x + 2)} ${f((y + y2) / 2)}V${f(y)}Z`, 'istria', { w: .3 }); }
  // the loggia: a row of quatrefoils over thirty-odd pointed arches
  s += P.fill(quad(0, V.loggia, 1, V.arcade), 'istria');
  for (let i = 0; i < 34; i++) {
    const u0 = i / 34 + .004, u1 = (i + 1) / 34 - .004, um = (u0 + u1) / 2;
    const [x0, y0] = q(u0, V.arcade - .01), [x1] = q(u1, V.arcade - .01), [, yt] = q(um, V.tracery + .01);
    s += P.flat(P.gothic(x0, yt, x1 - x0, y0 - yt), '#3e3530');
    if (i % 1 === 0) { const [cx, cy] = q(u1 + .002, V.loggia + .045); s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Math.max(1.4, (x1 - x0) * .32))}" fill="${P.ink('#3e3530')}"/>`; }
  }
  s += P.fill(quad(-.005, V.loggia - .006, 1, V.loggia + .006), 'istria2', { w: .35 }) + P.fill(quad(-.005, V.arcade - .012, 1, V.arcade), 'istria2', { w: .35 });
  // the ground arcade: squat columns under broad pointed arches
  s += P.fill(quad(0, V.arcade, 1, 1), 'istria');
  for (let i = 0; i < 17; i++) {
    const u0 = i / 17 + .008, u1 = (i + 1) / 17 - .008, um = (u0 + u1) / 2;
    const [x0, y0] = q(u0, 1), [x1] = q(u1, 1), [, yt] = q(um, V.arcade + .03);
    s += P.flat(P.gothic(x0, yt, x1 - x0, y0 - yt), '#3a322c');
  }
  s += P.shade(quad(0, .92, 1, 1), 'istria', .1);
  // the corner toward the Piazzetta: its twisted column of rope moulding
  s += P.line(P.poly([q(0, -.01), q(0, 1)], false), 'istria2', 1.6) + P.line(P.poly([q(.003, .02), q(.003, .98)], false), '#a89c84', .6, { dash: '2 2' });
  // flags from the loggia at war; the palace's own on the Piazzetta corner
  if (P.war === 'war') for (const u of [.25, .5, .75]) s += P.flagAt(...q(u, V.loggia + .02));
  return s;
}

// ---------- the Bacino ----------
/** A palo: a mooring pole in a family's stripes, its cap. */
function palo(P, x, y0, y1, c, w = 1) {
  const { f } = P;
  let s = P.fill(P.rect(x - 2 * w, y0, 4 * w, y1 - y0), '#efe6d2', { w: .5 });
  for (let y = y0 + 4; y < y1 - 4; y += 9 * w) s += P.flat(`M${f(x - 2 * w)} ${f(y)}h${f(4 * w)}v${f(4 * w)}h${f(-4 * w)}Z`, c);
  s += P.fill(`M${f(x - 2.6 * w)} ${y0}h${f(5.2 * w)}l${f(-1 * w)} ${f(-3 * w)}h${f(-3.2 * w)}Z`, '#2a2a2a', { w: .35 });
  return s;
}
function moored(P) {
  let s = '';
  // gondolas waiting at the Molo, their poles in pairs
  for (const [x, c] of [[372, '#2f5f9a'], [408, '#2f5f9a'], [520, '#c8402e'], [548, '#c8402e']]) s += palo(P, x, 248, 284, c, .55);
  return s;
}
/** The landing stage of the vaporetti: a pontoon, its little booth where the bills are posted, a lamp. */
function pontoon(P, x, wl) {
  let s = P.fill(P.rect(x - 34, wl - 6, 68, 7), '#5a4a3a', { w: .55 }) + P.fill(P.rect(x - 32, wl - 8, 64, 2.4), '#8a7a62', { w: .4 });
  s += P.fill(P.rect(x - 12, wl - 24, 24, 16), '#efe6d2', { w: .5 }) + P.fill(P.poly([[x - 15, wl - 24], [x, wl - 31], [x + 15, wl - 24]]), '#2f6a4a', { w: .5 });
  s += P.fill(P.rect(x - 9, wl - 21, 6, 6), 'glass', { w: .3 }) + P.wall(x + 2, wl - 22, 8, 11);
  s += P.lamp(x - 26, wl - 8, .5, 'single', { h: 64 });
  s += P.person(x + 22, wl - 8, .62, 'sailor', { c: '#1f2a44', legs: '#1f2a44' }) + P.person(x - 18, wl - 8, .6, 'lady', { c: '#f3eee2', parasol: '#e8c9b0' });
  return s;
}
/** A vaporetto of the ACNIL: black hull, a white saloon under its awning, the tall thin funnel. */
function vaporetto(P, dir = -1) {
  const W = 64, H = 40;
  let b = P.fill('M2 30H62L57 37H8Q3 35 2 30Z', '#232326', { w: .55 }) + P.line('M4 33H60', '#c8402e', 1);
  b += P.fill('M10 30V22H54V30Z', '#f1ece0', { w: .45 });
  for (let i = 0; i < 7; i++) b += `<rect x="${12 + i * 6}" y="23.6" width="3.4" height="3.6" fill="${P.L.windows > .2 ? P.glow('#ffd88a') : P.ink('#3e4c5c')}"/>`;
  b += P.fill('M8 22.4H56L54 19H10Z', '#e8dcc0', { w: .4 }) + P.line('M10 20.6H54', '#2f6a4a', .8, { dash: '3 2' });
  b += P.fill('M29 19L29.6 2H33.4L34 19Z', '#1d1a17', { w: .45 }) + P.fill('M29.4 6H33.6V8H29.4Z', '#efe6d2', { k: false });
  for (const [x, c] of [[14, '#2f3440'], [20, '#f3eee2'], [44, '#c9d6e6'], [50, '#4a3a30']]) b += `<circle cx="${x}" cy="17.4" r="1.4" fill="${P.ink('#e8c4a0')}"/><path d="M${x - 2} 16.4h4l-.6 -1.4h-2.8Z" fill="${P.ink(c === '#f3eee2' ? '#d9c27a' : '#25252a')}"/>`;
  b += `<path d="M58 30V16" stroke="${P.ink('#3a2a1e')}" stroke-width=".6"/>`;
  if (P.L.lamps > .05) b += `<circle cx="58" cy="16" r="1.4" fill="${P.glow('#fff0c0')}"/><circle cx="58" cy="16" r="4" fill="${P.glow('#ffe2a0')}" opacity=".35"/>`;
  const body = dir < 0 ? `<g transform="translate(${W} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: doc(W, H, body), w: W, h: H, ax: W / 2, ay: 35, puffs: [[dir < 0 ? W - 31.5 : 31.5, 2, .55, true, 1]] };
}
/** A bragozzo of Chioggia: a stout hull with eyes at the bow, two lug sails painted ochre and red with the family's sign. */
function bragozzo(P, dir = 1, s = 1) {
  const W = 62 * s, H = 64 * s, S = (n) => P.f(n * s);
  let b = `<path d="M${S(22)} ${S(54)}V${S(6)}M${S(44)} ${S(54)}V${S(18)}" stroke="${P.ink('#4a3a2a')}" stroke-width="${S(1.1)}"/>`;
  b += P.fill(`M${S(10)} ${S(12)}L${S(34)} ${S(6)}L${S(36)} ${S(48)}H${S(8)}Z`, '#e3a13a', { w: .55 }) + `<circle cx="${S(22)}" cy="${S(24)}" r="${S(6)}" fill="${P.ink('#b8302c')}"/><path d="M${S(22)} ${S(17)}V${S(31)}M${S(15)} ${S(24)}H${S(29)}" stroke="${P.ink('#e3a13a')}" stroke-width="${S(1.2)}"/>`;
  b += P.fill(`M${S(36)} ${S(20)}L${S(52)} ${S(16)}L${S(54)} ${S(48)}H${S(38)}Z`, '#b8302c', { w: .55 }) + `<path d="M${S(38)} ${S(34)}L${S(53)} ${S(32)}" stroke="${P.ink('#e3a13a')}" stroke-width="${S(2.2)}"/>`;
  b += P.fill(`M${S(3)} ${S(50)}H${S(59)}L${S(55)} ${S(58)}H${S(9)}Q${S(4)} ${S(56)} ${S(3)} ${S(50)}Z`, '#2a2a2c', { w: .55 }) + `<path d="M${S(5)} ${S(53)}H${S(57)}" stroke="${P.ink('#2f6a8a')}" stroke-width="${S(1.4)}"/><circle cx="${S(54)}" cy="${S(53)}" r="${S(1.6)}" fill="${P.ink('#f2ede2')}"/><circle cx="${S(54)}" cy="${S(53)}" r="${S(.7)}" fill="${P.ink('#1a1a1a')}"/>`;
  b += P.person(28 * s, 50 * s, .6 * s, 'worker', { c: '#e9e4d6', legs: '#3a3a44' });
  const body = dir < 0 ? `<g transform="translate(${P.f(W)} 0) scale(-1 1)">${b}</g>` : b;
  return { svg: doc(P.f(W), P.f(H), body), w: W, h: H, ax: W / 2, ay: 57 * s };
}

/** Cross between x0 and x1 on y, fading in and out where there is nothing to hide behind. */
function fade(P, sp, { y, dir = 1, dur = 40, rest = 0, offset = 0, x0, x1 }) {
  const a = dir > 0 ? x0 : x1, b = dir > 0 ? x1 : x0, e = 10 * dir, run = 1 - rest;
  return P.mover(sp, { path: [[a, y, 1, 0, 0], [a + e, y, 1, .04 * run, 1], [b - e, y, 1, .96 * run, 1], [b, y, 1, run, 0], [b, y, 1, 1, 0]], dur, offset });
}
