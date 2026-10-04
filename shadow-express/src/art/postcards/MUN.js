// Munich: Marienplatz. The New Town Hall fills the square's north side, Gothic to its pinnacles, its tower climbing
// past the Glockenspiel (whose knights ride and coopers dance at eleven, noon and five) to the Münchner Kindl; the
// Frauenkirche's two green domes rise over its roof; the golden Virgin stands on her column. A blue-and-white tram,
// a Hofbräu dray with its barrels, a man in loden and a chamois-beard hat.

const GB = 318; // the Town Hall's foot

export default {
  id: 'MUN',
  greet: 'GRUSS aus MÜNCHEN',
  nation: 'DE',
  flag: 'DE',
  flower: 'hops',
  flower2: 'gentian',
  frame: { band: ['#78a8d9', '#425d79'], gold: '#d8b65e', ink: '#1f3a6e', leaf: ['#7ea85c', '#355c38'], year: '#1f3a6e', halo: '#f6ecd2' },
  horizon: GB,
  clouds: 4,
  wind: 1,
  pal: {
    key: '#2a2726', stone: '#d4c9b3', stone2: '#b2a58b', slate: '#535d68', brick: '#a65a40', copper: '#61a089',
    wall: '#eedfbe', wall2: '#e5ce9f', wall3: '#d8decd', wall4: '#efd5c3', marble: '#e7e1d3', shaft: '#9b5b4d',
    ground: '#d6cbb1', glass: '#38475b', sash: '#efe8d8', iron: '#2c3634', gold: '#d8a83a', loden: '#4f6a46',
  },

  // hops: pale green cones of papery scales hanging from a twining bine, three-lobed leaves
  flowerArt(F) {
    const I = F.I;
    const vine = (a, l, c) => F.at(0, 0, F.leaf(l, l * .55, -38, c, { shape: 'serrate' }) + F.leaf(l * 1.1, l * .6, 0, c, { shape: 'serrate' }) + F.leaf(l, l * .55, 38, c, { shape: 'serrate' }), a);
    let s = vine(205, 20, I.leaf[1]) + vine(140, 16, I.leaf[0]);
    s += F.stem('M-16 -10Q-6 -16 0 -6Q5 2 3 10', I.leaf[1], 1) + `<path d="M-16 -10q-5 -1 -5 3q3 2 5 -1" fill="none" stroke="${I.leaf[1]}" stroke-width=".8"/>`;
    const cone = (x, y, a, sc) => {
      let c = `<path d="M0 -1V2.4" stroke="${I.leaf[1]}" stroke-width=".9"/>`;
      for (let row = 0; row < 5; row++) {
        const yy = 3.6 + row * 3, w = row === 4 ? 2.2 : 4.6 - Math.abs(row - 1.6) * .7;
        for (const k of row % 2 ? [-.5, .5] : [-1, 0, 1]) c += `<path d="M${(k * w * .9 - 2.4).toFixed(1)} ${yy}Q${(k * w * .9).toFixed(1)} ${yy + 4.4} ${(k * w * .9 + 2.4).toFixed(1)} ${yy}Q${(k * w * .9).toFixed(1)} ${yy + 1.4} ${(k * w * .9 - 2.4).toFixed(1)} ${yy}Z" fill="${(row + k) % 2 ? '#cfe39a' : '#bcd682'}" stroke="${I.key}" stroke-width=".4"/>`;
      }
      return F.at(x, y, c, a, sc);
    };
    s += cone(3, 8, -6, 1.2) + cone(-8, 2, 16, .95);
    return s;
  },
  // gentians: trumpets of the deepest blue, spotted within
  flowerArt2(F) {
    const I = F.I;
    let s = F.leaf(12, 5, 215, I.leaf[1], { shape: 'oval' }) + F.leaf(12, 5, 145, I.leaf[0], { shape: 'oval' });
    s += F.at(-4, 2, F.cup(9, 15, '#2340b8', { inner: '#3a5ad8', flame: '#162a80' }), -16) + F.at(5, 2, F.cup(8, 13, '#2a48c4', { inner: '#4664e0' }), 18);
    s += `<path d="M-6 -10l1 -2l1 2M4 -8l1 -2l1 2" stroke="#9ab0ff" stroke-width=".6" fill="none"/>`;
    return s;
  },

  back(P) {
    let s = '';
    // the Frauenkirche's towers over the roofs, their green Italian helms
    s += P.far(.55, () => frauenkirche(P, 120, 214));
    s += P.smoke(110, 214, .55) + P.smoke(566, 200, .55);
    return s;
  },

  mid(P, T, st) {
    let s = '';
    // the square
    s += P.paving(GB - 2, 380, { vx: 300, seed: 17 });
    // the west side of the square, lower, gabled
    s += P.far(.3, () => westSide(P));
    // the New Town Hall and its tower
    s += P.far(.2, () => rathaus(P, st));
    // the Mariensäule
    s += P.far(.12, () => mariensaeule(P, 238, 344));
    // people about the square, lamps
    s += P.far(.16, () => P.crowd(60, 200, 326, 8, { s: .6, seed: 4, ...clothes(P) }) + P.crowd(290, 540, 326, 10, { s: .6, seed: 6, ...clothes(P) }));
    s += P.far(.1, () => P.lamp(150, 340, .74, 'iron', { h: 70 }) + P.lamp(470, 336, .7, 'iron', { h: 70 }));
    // the tram, the dray, walkers; at war, the soldiers
    s += P.setStreet(356, 26, 574, .9);
    s += P.cross(T.tramSide({ s: .92, c: '#2f5a9a', band: '#efe9d8', number: '6', dir: -1 }), { y: 344, dir: -1, dur: 34, rest: .4, offset: 2 });
    s += P.cross(dray(P, { s: .8, dir: 1 }), { y: 356, dir: 1, dur: 64, rest: .25, offset: 30 });
    s += P.cross(T.walkers({ kinds: ['gent', 'lady', 'girl'], s: .76, dir: 1, seed: 21, dresses: ['#f3eee2', '#c9d6e6'], ...clothes(P) }), { y: 334, dir: 1, dur: 100, offset: 50 });
    s += P.cross(T.walkers({ kinds: ['boater', 'lady'], s: .78, dir: -1, seed: 27, ...clothes(P) }), { y: 338, dir: -1, dur: 90, offset: 12 });
    s += P.cross(cyclist(P, { s: .9, dir: 1, coat: P.L.season === 'winter' ? '#2e3036' : '#cfc6b0', hat: P.L.season === 'winter' ? '#2a2a2e' : '#e3cf8a' }), { y: 349, dir: 1, dur: 24, rest: .55, offset: 40 });
    return s;
  },

  front(P, T) {
    let s = '';
    // a flower woman with the season's flowers, a man in loden with a chamois beard, a Dienstmann, a lady
    s += flowerStall(P, 92, 374);
    s += tracht(P, 160, 374, 1.18);
    s += dienstmann(P, 420, 372, 1.1);
    s += P.person(452, 372, 1.08, 'lady', { c: frock(P, '#e6eef4'), parasol: umbrella(P, '#f4ecd8'), dir: -1 }) + P.person(466, 373, .86, 'child', { c: '#c84a3a', dir: -1 });
    s += alpineFigure(P, 528, 412, 1.12);
    s += P.cross(T.walkers({ kinds: ['gent', 'lady'], s: 1.04, dir: -1, seed: 31, dresses: ['#f3eee2', '#e8c9cf'], ...clothes(P) }), { y: 376, dir: -1, dur: 80, offset: 40, z: 'fore', x0: 120 });
    return s;
  },
};

// ---------- the New Town Hall ----------
function rathaus(P, st) {
  const { f } = P;
  let s = '';
  const x0 = 196, x1 = 600, top = 252, by = GB, tx = 380;
  // the roof: steep and slated, with dormers and pinnacles along the eaves
  s += P.fill(P.poly([[x0 - 2, top], [x0 + 14, top - 32], [x1, top - 32], [x1 + 2, top]]), 'slate') + P.lite(P.poly([[x0 + 14, top - 32], [x1, top - 32], [x1, top - 30], [x0 + 13, top - 30]]), 'slate', .3);
  for (let x = x0 + 18; x < x1; x += 26) s += P.fill(P.rect(x, top - 20, 7, 10), 'stone', { w: .45 }) + P.fill(P.gable(x - 1, top - 20, 9, 7), 'slate', { w: .4 }) + P.windows(x + 1.4, top - 18, 4, 7, 1, 1, { ww: .9, wh: .9, lit: .6 });
  if (P.L.snow) s += P.flat(P.poly([[x0 - 2, top - 4], [x0 + 14, top - 34], [x1, top - 34], [x1 + 2, top - 4], [x1, top - 10], [x0 + 6, top - 10]]), '#f4f7fa', { op: .85 });
  // the front: the arcade of shops below, three floors of Gothic windows, oriels and pinnacled buttresses
  s += P.fill(P.rect(x0, top, x1 - x0, by - top), 'stone') + P.stipple(P.rect(x0, top, x1 - x0, by - top), 'stone', 90, { box: [x0, top, x1 - x0, by - top], op: .3 });
  for (let x = x0 + 3; x < x1 - 6; x += 13) s += P.fill(P.gothic(x + 1, by - 20, 10, 20), '#4a3e34', { w: .45 }) + (P.L.windows > .2 ? P.flat(P.gothic(x + 2.4, by - 17, 7.2, 16), P.glow('#ffcf7a'), { raw: 1, op: .8 }) : '');
  s += P.fill(P.rect(x0, by - 24, x1 - x0, 4), 'stone2', { w: .4 });
  s += P.windows(x0 + 3, top + 6, x1 - x0 - 6, by - top - 34, 31, 3, { ww: .44, wh: .66, gothic: true });
  for (let x = x0; x < x1; x += 26) {
    s += P.fill(P.rect(x - 1.6, top - 2, 3.2, by - top - 22), 'stone2', { w: .4 });
    s += P.fill(P.spire(x, top - 1, 4, 13), 'stone2', { w: .35 }) + P.line(`M${x} ${top - 14}v-2`, 'stone2', .5);
  }
  // oriels on corbels, with little roofs of their own
  for (const ox of [244, 304, 470, 532]) {
    s += P.fill(`M${ox - 9} ${top + 4}H${ox + 9}V${top + 34}L${ox + 5} ${top + 40}H${ox - 5}L${ox - 9} ${top + 34}Z`, 'stone', { w: .6 }) + P.shade(P.rect(ox + 4, top + 4, 5, 30), 'stone', .2);
    s += P.windows(ox - 7, top + 8, 14, 24, 2, 2, { ww: .62, wh: .7, gothic: true });
    s += P.fill(`M${ox - 11} ${top + 4}L${ox} ${top - 30}L${ox + 11} ${top + 4}Z`, 'stone', { w: .6 }) + P.shade(`M${ox} ${top - 30}L${ox + 11} ${top + 4}H${ox + 4}Z`, 'stone', .18);
    s += P.fill(P.gothic(ox - 3, top - 14, 6, 14), 'glass', { w: .4 }) + `<circle cx="${ox}" cy="${top - 19}" r="2.2" fill="none" stroke="${P.ink('stone2')}" stroke-width=".7"/>`;
    for (const k of [-1, 1]) s += P.fill(P.spire(ox + k * 11, top + 5, 3, 12), 'stone2', { w: .35 });
    s += P.line(`M${ox} ${top - 30}v-5`, 'stone2', .8);
    if (P.L.snow) s += P.flat(`M${ox - 11} ${top + 2}L${ox} ${top - 31}L${ox + 11} ${top + 2}L${ox} ${top - 27}Z`, '#f4f7fa', { op: .8 });
  }
  // statues of the Wittelsbachs in niches along the first floor; flower boxes under the windows in season
  for (let x = x0 + 14; x < x1; x += 26) s += P.fill(P.gothic(x - 2.6, by - 44, 5.2, 14), 'stone2', { w: .35 }) + P.flat(`M${x - 1} ${by - 32}v-7q1 -1.6 2 0v7Z`, 'stone');
  const lf = P.L.leaf;
  if (lf.leaf) for (let x = x0 + 7; x < x1; x += 13) s += P.flat(P.rect(x, top + 30, 8, 2), lf.dark) + `<circle cx="${x + 2}" cy="${top + 29.6}" r="1.1" fill="${P.ink(P.L.season === 'autumn' ? '#c8732a' : '#cc3333')}"/><circle cx="${x + 6}" cy="${top + 29.6}" r="1.1" fill="${P.ink(P.L.season === 'spring' ? '#e8a8c0' : '#cc3333')}"/>`;
  // the tower
  s += tower(P, tx, st);
  s += P.wall(212, by - 46, 9, 12) + P.flagAt(f(260), f(top + 14)) + P.flagAt(f(520), f(top + 14));
  return s;
}
function tower(P, cx, st) {
  const { f } = P;
  let s = '';
  const w = 36, base = GB, t1 = 160;
  s += P.fill(P.rect(cx - w / 2, t1, w, base - t1), 'stone') + P.shade(P.rect(cx + w / 2 - 9, t1, 9, base - t1), 'stone', .2) + P.stipple(P.rect(cx - w / 2, t1, w, base - t1), 'stone', 40, { box: [cx - w / 2, t1, w, base - t1], op: .3 });
  // the great door and the balcony over it
  s += P.fill(P.gothic(cx - 8, base - 34, 16, 34), '#3e342c', { w: .6 }) + P.fill(P.rect(cx - 13, base - 40, 26, 4), 'stone2', { w: .45 });
  s += P.windows(cx - 10, base - 66, 20, 14, 2, 1, { ww: .55, wh: .8, gothic: true });
  // the Glockenspiel: a double oriel, knights above, coopers below
  const gy = 230, gw = 28;
  s += P.fill(`M${cx - gw / 2} ${gy - 30}H${cx + gw / 2}V${gy + 4}L${cx + gw / 2 - 5} ${gy + 12}H${cx - gw / 2 + 5}L${cx - gw / 2} ${gy + 4}Z`, 'stone', { w: .7 });
  for (const [y0, y1] of [[gy - 26, gy - 13], [gy - 10, gy + 2]]) {
    s += P.fill(P.rect(cx - gw / 2 + 2, y0, gw - 4, y1 - y0), '#2e2a2c', { w: .5 });
    s += P.flat(P.rect(cx - gw / 2 + 2, y1 - 2, gw - 4, 2), 'stone2');
  }
  for (const k of [-1, 0, 1]) s += P.line(`M${cx + k * (gw / 2 - 2)} ${gy - 26}V${gy + 2}`, 'stone2', 1.1);
  s += P.fill(`M${cx - gw / 2 - 2} ${gy - 30}L${cx} ${gy - 36}L${cx + gw / 2 + 2} ${gy - 30}Z`, 'slate', { w: .5 });
  // its figures: at eleven, noon and five they turn; otherwise they stand
  const hour = ((((st?.t ?? 720) / 60) % 24) + 24) % 24, playing = (hour >= 11 && hour < 13) || (hour >= 17 && hour < 18);
  const knights = [['#2f5a9a', '#f2efe6'], ['#b8322c', '#f2efe6']], coopers = ['#c8342e', '#2e5a3a', '#c8342e'];
  if (playing) {
    for (const [i, cl] of knights.entries()) P.mover(rider(P, { c: cl[0], c2: cl[1], dir: i ? -1 : 1, s: .5 }), { path: i ? [[cx + 9, gy - 13, 1, 0, 0], [cx + 7, gy - 13, 1, .08, 1], [cx - 7, gy - 13, 1, .42, 1], [cx - 9, gy - 13, 1, .5, 0], [cx - 9, gy - 13, 1, 1, 0]] : [[cx - 9, gy - 13, 1, 0, 0], [cx - 7, gy - 13, 1, .08, 1], [cx + 7, gy - 13, 1, .42, 1], [cx + 9, gy - 13, 1, .5, 0], [cx + 9, gy - 13, 1, 1, 0]], dur: 9, offset: i * 4.5 });
    for (let i = 0; i < 3; i++) P.mover(cooper(P, { c: coopers[i], s: .44 }), { path: [[cx - 10, gy + 2, 1, 0, 0], [cx - 8, gy + 2, 1, .1, 1], [cx + 8, gy + 2, 1, .9, 1], [cx + 10, gy + 2, 1, 1, 0]], dur: 7.5, offset: i * 2.5 });
  } else {
    for (const [i, cl] of knights.entries()) s += T_place(rider(P, { c: cl[0], c2: cl[1], dir: i ? -1 : 1, s: .5 }), cx + (i ? 6 : -6), gy - 13);
    for (let i = 0; i < 3; i++) s += T_place(cooper(P, { c: coopers[i], s: .44 }), cx - 8 + i * 8, gy + 2);
  }
  // the clock, the gallery with its corner turrets, the octagon, the open crown and the Kindl
  s += P.clock(cx, 178, 8.6, { tz: 0, face: '#f2ecd8', rim: '#d8a83a' });
  s += P.fill(P.rect(cx - w / 2 - 3, t1 - 4, w + 6, 5), 'stone2', { w: .55 });
  for (let x = cx - w / 2 - 2; x <= cx + w / 2 + 2; x += 3.4) s += P.line(`M${f(x)} ${t1 - 4}v-4`, 'stone2', .6);
  s += P.line(`M${cx - w / 2 - 3} ${t1 - 8}H${cx + w / 2 + 3}`, 'stone2', 1);
  for (const k of [-1, 1]) s += P.fill(P.rect(cx + k * (w / 2 - 1) - 3, t1 - 18, 6, 12), 'stone', { w: .45 }) + P.fill(P.spire(cx + k * (w / 2 - 1), t1 - 18, 7, 16), 'slate', { w: .45 }) + `<circle cx="${cx + k * (w / 2 - 1)}" cy="${t1 - 35}" r=".9" fill="${P.ink('gold')}"/>`;
  s += P.fill(P.rect(cx - 11, t1 - 34, 22, 26), 'stone') + P.shade(P.rect(cx + 4, t1 - 34, 7, 26), 'stone', .2);
  s += P.fill(P.gothic(cx - 7, t1 - 30, 5, 16), '#2e2a2c', { w: .35 }) + P.fill(P.gothic(cx + 1.6, t1 - 30, 5, 16), '#2e2a2c', { w: .35 });
  s += P.fill(P.rect(cx - 13, t1 - 37, 26, 3), 'stone2', { w: .45 });
  // the openwork crown: ribs rising to a little platform
  s += P.line(`M${cx - 11} ${t1 - 37}Q${cx - 8} ${t1 - 52} ${cx - 2} ${t1 - 58}M${cx + 11} ${t1 - 37}Q${cx + 8} ${t1 - 52} ${cx + 2} ${t1 - 58}M${cx} ${t1 - 37}V${t1 - 58}`, 'stone2', 1.8);
  s += P.line(`M${cx - 11} ${t1 - 37}Q${cx - 8} ${t1 - 52} ${cx - 2} ${t1 - 58}M${cx + 11} ${t1 - 37}Q${cx + 8} ${t1 - 52} ${cx + 2} ${t1 - 58}`, null, .5);
  for (const k of [-1, 1]) s += P.fill(P.spire(cx + k * 12, t1 - 36, 3.4, 10), 'stone2', { w: .35 });
  s += P.fill(P.rect(cx - 3.4, t1 - 61, 6.8, 3), 'stone2', { w: .4 });
  // the Münchner Kindl: the little monk in black and gold, his hand raised
  s += P.fill(`M${cx - 2.2} ${t1 - 61}L${cx - 1.6} ${t1 - 68}H${cx + 1.6}L${cx + 2.2} ${t1 - 61}Z`, '#26242a', { w: .35 }) + `<path d="M${cx - 1.6} ${t1 - 64}h3.2" stroke="${P.ink('gold')}" stroke-width=".6"/><circle cx="${cx}" cy="${t1 - 69.4}" r="1.4" fill="${P.ink('#e2bf9c')}" stroke="${P.keyC()}" stroke-width=".3"/>` + P.line(`M${cx + 1.4} ${t1 - 66}l1.6 -2.6`, '#26242a', .7);
  if (P.L.snow) s += P.flat(P.rect(cx - w / 2 - 3, t1 - 9, w + 6, 1.6), '#f4f7fa');
  s += bavarian(P, cx - w / 2 - 6, t1 - 6);
  return s;
}
/** The Bavarian flag of white and blue lozenges on its staff, lifting in the wind. */
function bavarian(P, x, y) {
  const { f } = P, id = `${P.uid}bv${P._st++}`, w = 16, h = 10, top = y - 22;
  const wave = `M${x} ${top}C${x - 5} ${top - 1.6} ${x - 10} ${top + 1.6} ${x - w} ${top + .8}V${top + h + .8}C${x - 10} ${top + h + 1.6} ${x - 5} ${top + h - 1.6} ${x} ${top + h}Z`;
  let lz = `<rect x="${x - w - 1}" y="${top - 2}" width="${w + 2}" height="${h + 4}" fill="${P.ink('#f4f2ec')}"/>`;
  for (let i = -3; i < 6; i++) for (let j = -1; j < 4; j++) if ((i + j) % 2 === 0) lz += `<path d="M${f(x - w + i * 3.6)} ${f(top + j * 3.4 + 1.7)}l1.8 -1.7l1.8 1.7l-1.8 1.7Z" fill="${P.ink('#3b78c4')}"/>`;
  return P.line(`M${x} ${y}V${top - 1}`, '#5a4a3a', 1) + `<circle cx="${x}" cy="${top - 1.6}" r="1" fill="${P.ink('gold')}"/>` + `<clipPath id="${id}"><path d="${wave}"/></clipPath><g clip-path="url(#${id})">${lz}</g><path d="${wave}" fill="none" stroke="${P.keyC()}" stroke-width=".5"/>`;
}
/** Draw a sprite standing still where its anchor falls. */
function T_place(sp, x, y) { return `<g transform="translate(${Math.round((x - sp.ax) * 10) / 10} ${Math.round((y - sp.ay) * 10) / 10})">${(sp.frames ?? [sp.svg])[0].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`; }
const svgDoc = (P, w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.f(w)} ${P.f(h)}" width="${P.f(w)}" height="${P.f(h)}">${body}</svg>`;
const facing = (P, dir, w, body) => (dir < 0 ? `<g transform="translate(${P.f(w)} 0) scale(-1 1)">${body}</g>` : body);
/** A knight of the Glockenspiel, lance couched, on his caparisoned horse. */
function rider(P, o) {
  const { f } = P, s = o.s ?? 1, W = 20 * s, H = 16 * s, S = (k) => f(k * s);
  let b = P.fill(`M${S(3)} ${S(9)}Q${S(3)} ${S(6)} ${S(7)} ${S(6)}H${S(14)}L${S(17)} ${S(3)}L${S(18.6)} ${S(5)}L${S(16)} ${S(8)}Q${S(16)} ${S(11)} ${S(14)} ${S(11)}H${S(5)}Q${S(3)} ${S(11)} ${S(3)} ${S(9)}Z`, o.c2, { w: .3 });
  b += P.flat(`M${S(4)} ${S(9)}H${S(15)}V${S(11)}H${S(4)}Z`, o.c);
  b += P.line(`M${S(5)} ${S(11)}V${S(15)}M${S(13)} ${S(11)}V${S(15)}`, '#3a3030', .8 * s);
  b += P.fill(`M${S(8)} ${S(6.4)}V${S(1.6)}H${S(11)}V${S(6.4)}Z`, '#b9bec4', { w: .3 }) + `<circle cx="${S(9.5)}" cy="${S(1.4)}" r="${S(1.3)}" fill="${P.ink('#9aa0a6')}"/>`;
  b += P.line(`M${S(6)} ${S(4.6)}L${S(19.6)} ${S(2.6)}`, '#8a6a3a', .7 * s);
  return { svg: svgDoc(P, W, H, facing(P, o.dir ?? 1, W, b)), w: W, h: H, ax: W / 2, ay: 15 * s };
}
/** A cooper in red jacket and white stockings, his hoop held high. */
function cooper(P, o) {
  const { f } = P, s = o.s ?? 1, W = 10 * s, H = 16 * s, S = (k) => f(k * s);
  let b = P.line(`M${S(4)} ${S(15)}V${S(10)}M${S(6)} ${S(15)}V${S(10)}`, '#f2efe6', 1.1 * s) + P.fill(`M${S(3)} ${S(10.4)}V${S(5)}H${S(7)}V${S(10.4)}Z`, o.c, { w: .3 });
  b += `<circle cx="${S(5)}" cy="${S(3.6)}" r="${S(1.3)}" fill="${P.ink('#e2bf9c')}"/><path d="M${S(3.6)} ${S(2.6)}h${S(2.8)}" stroke="${P.ink('#2a2a2a')}" stroke-width="${S(.9)}"/>`;
  b += `<ellipse cx="${S(5)}" cy="${S(1)}" rx="${S(3.6)}" ry="${S(.9)}" fill="none" stroke="${P.ink('#c8a23a')}" stroke-width="${S(.6)}"/>`;
  return { svg: svgDoc(P, W, H, b), w: W, h: H, ax: W / 2, ay: 15 * s };
}

// ---------- the Frauenkirche and the square's west side ----------
function frauenkirche(P, x0, by) {
  const { f } = P;
  let s = '';
  // the great roof of the nave behind, then the two towers, square and brick, under their green Italian helms
  s += P.fill(P.poly([[x0 - 4, 204], [x0 + 18, 168], [x0 + 46, 204]]), '#9a4a36', { w: .5 }) + P.shade(P.poly([[x0 + 18, 168], [x0 + 46, 204], [x0 + 30, 204]]), '#9a4a36', .2);
  for (const cx of [x0, x0 + 38]) {
    s += P.fill(P.rect(cx - 10, 152, 20, by - 152), 'brick') + P.shade(P.rect(cx + 3, 152, 7, by - 152), 'brick', .2);
    s += P.fill(P.gothic(cx - 2.6, 160, 5.2, 16), '#3a2a26', { w: .35 }) + P.fill(P.gothic(cx - 2.4, 186, 4.8, 12), '#3a2a26', { w: .35 });
    for (let y = 168; y < by; y += 14) s += P.line(`M${cx - 10} ${y}H${cx + 10}`, '#8a4632', .5, { op: .6 });
    s += P.fill(P.poly([[cx - 10, 152], [cx - 8, 146], [cx + 8, 146], [cx + 10, 152]]), 'brick', { w: .45 });
    s += P.fill(`M${cx - 8.4} 146C${cx - 12} 139 ${cx - 11} 131 ${cx - 4.6} 126Q${cx - 1.6} 124.4 ${cx - 1.8} 121H${cx + 1.8}Q${cx + 1.6} 124.4 ${cx + 4.6} 126C${cx + 11} 131 ${cx + 12} 139 ${cx + 8.4} 146Z`, 'copper') + P.shade(`M${cx + 1.4} 121H${cx + 1.8}Q${cx + 1.6} 124.4 ${cx + 4.6} 126C${cx + 11} 131 ${cx + 12} 139 ${cx + 8.4} 146H${cx + 3}Z`, 'copper', .22);
    s += P.lite(`M${cx - 7} 142C${cx - 8.6} 136 ${cx - 7} 131 ${cx - 4} 128.6C${cx - 4.6} 133 ${cx - 5.4} 137 ${cx - 4.6} 142Z`, 'copper', .3, { op: .8 });
    s += P.fill(P.rect(cx - 1.8, 115, 3.6, 6), 'copper', { w: .35 }) + P.fill(P.onion(cx, 115, 4, 4.6), 'copper', { w: .35 }) + P.line(`M${cx} 110.4v-4M${cx - 1.3} 108.4h2.6`, 'gold', .6);
    if (P.L.snow) s += P.flat(`M${cx - 8.4} 146C${cx - 12} 139 ${cx - 11} 131 ${cx - 4.6} 126Q${cx} 129 ${cx + 4.6} 126C${cx + 11} 131 ${cx + 12} 139 ${cx + 8.4} 146Q${cx} 139 ${cx - 8.4} 146Z`, '#f4f7fa', { op: .7 });
  }
  return s;
}
function westSide(P) {
  let s = '';
  const walls = ['wall', 'wall3', 'wall2', 'wall4'];
  const spec = [[20, 40, 96], [60, 34, 84], [94, 38, 100], [132, 30, 88], [162, 36, 92]];
  for (const [i, [x, w, h]] of spec.entries()) s += P.facade(x, GB, w, h, { c: walls[i % 4], roof: i % 2 ? 'gable' : 'pitch', roofC: '#a8503a', rh: 20, side: 4, cols: 3, floors: 5, shop: i % 2 ? null : ['#2f5a9a', '#f2efe6'], flagChance: .7 });
  return s;
}
function mariensaeule(P, cx, by) {
  const { f } = P;
  let s = '';
  // the balustrade round the foot, the marble pedestal, the four putti fighting war, plague, hunger and heresy
  s += P.fill(P.rect(cx - 30, by - 10, 60, 10), 'marble', { w: .55 });
  for (let x = cx - 28; x <= cx + 28; x += 4) s += P.line(`M${x} ${by - 10}v-6`, 'marble', 1.2);
  s += P.line(`M${cx - 30} ${by - 16}H${cx + 30}`, 'marble', 1.4);
  s += P.fill(P.rect(cx - 13, by - 40, 26, 30), 'marble') + P.shade(P.rect(cx + 6, by - 40, 7, 30), 'marble', .2) + P.fill(P.rect(cx - 15, by - 43, 30, 3), 'marble', { w: .45 });
  for (const k of [-1, 1]) s += P.fill(`M${cx + k * 20} ${by - 10}v-10q${k * -2} -4 ${k * -5} -2q${k * -1} 3 ${k * 1} 6v6Z`, '#5a5040', { w: .4 }) + `<circle cx="${cx + k * 21}" cy="${by - 23}" r="2.2" fill="${P.ink('#5a5040')}"/>`;
  // the shaft of red marble, the capital, the golden Virgin on her crescent
  const yb = by - 43, yt = 200;
  s += P.fill(`M${cx - 5.4} ${yb}L${cx - 4.4} ${yt}H${cx + 4.4}L${cx + 5.4} ${yb}Z`, 'shaft') + P.shade(`M${cx + 1.2} ${yb}L${cx + 1} ${yt}H${cx + 4.4}L${cx + 5.4} ${yb}Z`, 'shaft', .22) + P.lite(`M${cx - 4} ${yb}L${cx - 3.2} ${yt}H${cx - 2}L${cx - 2.6} ${yb}Z`, 'shaft', .25, { op: .7 });
  s += P.fill(`M${cx - 4.4} ${yt}L${cx - 7.4} ${yt - 8}H${cx + 7.4}L${cx + 4.4} ${yt}Z`, 'marble', { w: .45 }) + P.fill(P.rect(cx - 8.4, yt - 10.4, 16.8, 2.6), 'marble', { w: .4 });
  const v = yt - 10.4;
  s += P.fill(`M${cx - 6} ${v}Q${cx} ${v - 3} ${cx + 6} ${v}Q${cx} ${v - 1.4} ${cx - 6} ${v}Z`, 'gold', { w: .35 });
  s += P.fill(`M${cx - 3.6} ${v - 1}L${cx - 2.4} ${v - 14}Q${cx} ${v - 16} ${cx + 2.4} ${v - 14}L${cx + 3.8} ${v - 1}Z`, 'gold', { w: .45 }) + P.lite(`M${cx - 2.8} ${v - 2}L${cx - 1.8} ${v - 13}L${cx - .4} ${v - 13.6}L${cx - .6} ${v - 2}Z`, 'gold', .4);
  s += `<circle cx="${cx}" cy="${v - 16.6}" r="2" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".4"/>` + P.fill(`M${cx - 1.8} ${v - 18}l.5 -2l.9 1l.4 -1.4l.4 1.4l.9 -1l.5 2Z`, 'gold', { w: .25 });
  s += `<circle cx="${cx + 3}" cy="${v - 10}" r="1.4" fill="${P.ink('gold')}" stroke="${P.keyC()}" stroke-width=".3"/>` + P.line(`M${cx - 2.6} ${v - 11}L${cx - 4.6} ${v - 18}`, 'gold', .8);
  if (P.L.snow) s += P.flat(P.rect(cx - 15, by - 44.4, 30, 1.6), '#f4f7fa');
  return s;
}

// ---------- the dray and the people ----------
function horse(P, x, y, s, c, st) {
  const { f } = P, S = (k) => f(k * s), X = (k) => f(x + k * s), Y = (k) => f(y + k * s);
  const leg = (hx, a, back) => `<path d="M${X(hx)} ${Y(8)}L${X(hx + a)} ${Y(15)}L${X(hx + a * .4)} ${Y(21)}" fill="none" stroke="${back ? P.dark(c, .2) : P.ink(c)}" stroke-width="${S(2.6)}" stroke-linecap="round"/><path d="M${X(hx + a * .4 - 1.6)} ${Y(21)}h${S(3.4)}" stroke="${P.ink('#e9e2d2')}" stroke-width="${S(1.8)}"/>`;
  const sw = st ? 2.2 : -1.8;
  let b = leg(-11, -sw, true) + leg(5, sw, true);
  b += `<path d="M${X(-16)} ${Y(3)}q${S(-5)} ${S(4)} ${S(-4)} ${S(12)}" fill="none" stroke="${P.dark(c, .4)}" stroke-width="${S(2.6)}" stroke-linecap="round"/>`;
  b += P.fill(`M${X(-16)} ${Y(1)}Q${X(-15)} ${Y(-4)} ${X(-6)} ${Y(-3)}H${X(4)}Q${X(10)} ${Y(-4)} ${X(11)} ${Y(1)}Q${X(12)} ${Y(10)} ${X(5)} ${Y(11)}H${X(-10)}Q${X(-17)} ${Y(10)} ${X(-16)} ${Y(1)}Z`, c, { w: .55 });
  b += P.fill(`M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}Q${X(12)} ${Y(-14)} ${X(15)} ${Y(-12)}L${X(19)} ${Y(-5)}Q${X(19)} ${Y(-3)} ${X(17)} ${Y(-3)}L${X(13)} ${Y(-6)}L${X(10)} ${Y(3)}Z`, c, { w: .55 });
  b += `<path d="M${X(9)} ${Y(-10)}L${X(11.4)} ${Y(-15)}L${X(12.4)} ${Y(-11)}" fill="${P.ink(c)}" stroke="${P.keyC()}" stroke-width="${S(.4)}"/><path d="M${X(5)} ${Y(-1)}L${X(10)} ${Y(-11)}" stroke="${P.ink('#2a1e16')}" stroke-width="${S(1.4)}"/>`;
  b += `<path d="M${X(4)} ${Y(-2)}Q${X(8)} ${Y(2)} ${X(9)} ${Y(-4)}" fill="none" stroke="${P.ink('#2a2622')}" stroke-width="${S(2.2)}"/><circle cx="${X(7)}" cy="${Y(-1)}" r="${S(.8)}" fill="${P.ink('gold')}"/>`;
  b += leg(-12, sw * .8, false) + leg(4, -sw * .8, false);
  return b;
}
/** A brewery dray: a heavy wagon stacked with barrels, two big horses, the drayman in his leather apron. */
function dray(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 112 * s, H = 52 * s, S = (k) => f(k * s);
  const frame = (st) => {
    let b = '';
    // the barrels, stacked on their sides
    const barrel = (x, y, r) => `<ellipse cx="${S(x)}" cy="${S(y)}" rx="${S(r * 1.25)}" ry="${S(r)}" fill="${P.ink('#9a6a3e')}" stroke="${P.keyC()}" stroke-width=".5"/><path d="M${S(x - r * .7)} ${S(y - r * .92)}v${S(r * 1.84)}M${S(x + r * .7)} ${S(y - r * .92)}v${S(r * 1.84)}" stroke="${P.ink('#3a3a3e')}" stroke-width="${S(.8)}"/><ellipse cx="${S(x)}" cy="${S(y)}" rx="${S(r * .4)}" ry="${S(r * .45)}" fill="${P.ink('#c49a62')}"/>`;
    for (const [x, y] of [[12, 30], [24, 30], [36, 30], [48, 30], [18, 21], [30, 21], [42, 21], [24, 12.4], [36, 12.4]]) b += barrel(x, y, 5);
    b += P.fill(`M${S(4)} ${S(35)}H${S(58)}V${S(41)}H${S(4)}Z`, '#3a5a8a', { w: .55 });
    b += `<text x="${S(31)}" y="${S(39.8)}" font-family="Georgia,'Times New Roman',serif" font-size="${S(4.2)}" font-weight="bold" text-anchor="middle" fill="${P.ink('#f2efe6')}" textLength="${S(44)}" lengthAdjust="spacingAndGlyphs">HOFBRÄUHAUS</text>`;
    // the drayman on the box, green hat and leather apron
    b += P.fill(`M${S(55)} ${S(34)}L${S(56)} ${S(20)}H${S(63)}L${S(64)} ${S(34)}Z`, '#6a4a2e', { w: .5 }) + `<circle cx="${S(59.5)}" cy="${S(17.2)}" r="${S(2.6)}" fill="${P.ink('#e2a888')}"/><path d="M${S(56)} ${S(15.6)}h${S(7)}M${S(57)} ${S(15.6)}q${S(2.5)} ${S(-4)} ${S(5)} 0Z" fill="${P.ink('loden')}" stroke="${P.ink('loden')}" stroke-width="${S(1)}"/>`;
    b += `<path d="M${S(62)} ${S(24)}L${S(80)} ${S(22)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(.5)}"/>`;
    // wheels
    for (const [cx, cy, r] of [[14, 43, 8], [48, 44, 7]]) {
      b += `<circle cx="${S(cx)}" cy="${S(cy)}" r="${S(r)}" fill="none" stroke="${P.ink('#3a2a1e')}" stroke-width="${S(1.4)}"/>`;
      for (let i = 0; i < 5; i++) { const a = i * Math.PI / 5 + st * .3; b += `<path d="M${f((cx - Math.cos(a) * r) * s)} ${f((cy - Math.sin(a) * r) * s)}L${f((cx + Math.cos(a) * r) * s)} ${f((cy + Math.sin(a) * r) * s)}" stroke="${P.ink('#c8342e')}" stroke-width="${S(.7)}"/>`; }
    }
    // the two horses, heavy and shining, the far one darker
    b += horse(P, 88 * s, 26 * s, s * 1.02, '#5a3a24', (st + 1) % 2) + horse(P, 84 * s, 28 * s, s * 1.06, '#7a4e2e', st);
    return facing(P, dir, W, b);
  };
  return { frames: [svgDoc(P, W, H, frame(0)), svgDoc(P, W, H, frame(1))], fps: 3, w: W, h: H, ax: W / 2, ay: 50 * s };
}
/** A gentleman on his bicycle, pedalling (two frames). */
function cyclist(P, o = {}) {
  const { f } = P, s = o.s ?? 1, dir = o.dir ?? 1, W = 30 * s, H = 34 * s, S = (k) => f(k * s);
  const frame = (st) => {
    const wheel = (cx) => `<circle cx="${S(cx)}" cy="${S(28)}" r="${S(5.4)}" fill="none" stroke="${P.ink('#2a2622')}" stroke-width="${S(.9)}"/><circle cx="${S(cx)}" cy="${S(28)}" r="${S(.8)}" fill="${P.ink('#2a2622')}"/>`;
    let b = wheel(6) + wheel(24);
    b += `<path d="M${S(6)} ${S(28)}L${S(13)} ${S(20)}H${S(21)}L${S(24)} ${S(28)}M${S(13)} ${S(20)}L${S(15)} ${S(28)}L${S(21)} ${S(20)}M${S(21)} ${S(20)}L${S(22)} ${S(16)}h${S(2)}" fill="none" stroke="${P.ink('#3a3a40')}" stroke-width="${S(.9)}"/>`;
    const k = st ? 1 : -1;
    b += `<path d="M${S(13)} ${S(17)}L${S(15 + k * 2)} ${S(23)}L${S(15 + k * 3)} ${S(28 + k * -1)}" fill="none" stroke="${P.ink('#3a3a40')}" stroke-width="${S(1.5)}" stroke-linecap="round"/><path d="M${S(13)} ${S(17)}L${S(15 - k * 2)} ${S(23)}L${S(15 - k * 3)} ${S(28 - k * -1)}" fill="none" stroke="${P.dark('#3a3a40', .2)}" stroke-width="${S(1.5)}" stroke-linecap="round"/>`;
    b += P.fill(`M${S(11)} ${S(18)}L${S(14)} ${S(8)}H${S(18)}L${S(17)} ${S(18)}Z`, o.coat ?? '#cfc6b0', { w: .45 }) + P.line(`M${S(17)} ${S(10)}L${S(22)} ${S(16)}`, o.coat ?? '#cfc6b0', 1.3 * s);
    b += `<circle cx="${S(16.6)}" cy="${S(5.6)}" r="${S(2.2)}" fill="${P.ink('#e2bf9c')}" stroke="${P.keyC()}" stroke-width=".35"/><path d="M${S(13.4)} ${S(4.2)}h${S(6.4)}M${S(14.6)} ${S(4.2)}v${S(-1.8)}h${S(4)}v${S(1.8)}" fill="${P.ink(o.hat ?? '#e3cf8a')}" stroke="${P.ink(o.hat ?? '#e3cf8a')}" stroke-width="${S(.9)}"/>`;
    return dir < 0 ? `<g transform="translate(${f(W)} 0) scale(-1 1)">${b}</g>` : b;
  };
  return { frames: [svgDoc(P, W, H, frame(0)), svgDoc(P, W, H, frame(1))], fps: 4, w: W, h: H, ax: W / 2, ay: 33.4 * s };
}
function flowerStall(P, x, by) {
  const { f } = P, season = P.L.season, lf = P.L.leaf;
  let s = P.fill(`M${x - 26} ${by - 16}h44l-3 16h-38Z`, '#7a5a3a', { w: .6 }) + P.fill(`M${x - 28} ${by - 18}h48v3h-48Z`, '#8a6a46', { w: .5 });
  // the season's flowers in her baskets: lilac and tulips, roses, asters and dahlias, fir and holly
  const cols = season === 'spring' ? ['#b48ad8', '#f2d2e8', '#e8c33a', '#d84a5a'] : season === 'autumn' ? ['#8a5ad0', '#e07a2a', '#c8342e', '#f0c040'] : season === 'winter' ? ['#2f5a3a', '#3f6a4a', '#c8262e', '#2f5a3a'] : ['#d8344a', '#f4c8d0', '#f2efe6', '#e8a030'];
  const r = P.rng(12);
  for (const bx of [x - 18, x - 4, x + 10]) {
    s += P.fill(`M${bx - 6} ${by - 18}q6 3 12 0l-1.4 -6h-9.2Z`, '#b38a52', { w: .45 });
    for (let i = 0; i < 9; i++) s += `<circle cx="${f(bx - 5 + r() * 10)}" cy="${f(by - 25 - r() * 6)}" r="${f(1.6 + r())}" fill="${P.ink(cols[i % 4])}" stroke="${P.keyC()}" stroke-width=".3"/>`;
    if (lf.leaf || season === 'winter') s += P.line(`M${bx - 3} ${by - 24}l-2 -4M${bx + 3} ${by - 25}l2 -4`, season === 'winter' ? '#2f5a3a' : lf.dark, 1);
  }
  s += P.person(x + 28, by, 1.16, 'peasant', { c: '#3a4a6a', hat: '#e8e2d0' }) + P.flat(`M${x + 25.4} ${by - 17}h5.2l1 16h-7.2Z`, '#f0ece0', { op: .9 });
  return s;
}
function tracht(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  // grey-green loden, the hat with its chamois beard
  let d = P.person(x, y, s, 'gent', { c: 'loden', legs: '#4a3a2a', hat: 'loden', dir: -1 });
  d += P.line(`M${f(x - 1.6 * s)} ${f(y - 13 * s)}V${f(y - 2 * s)}M${f(x + 1.6 * s)} ${f(y - 13 * s)}V${f(y - 2 * s)}`, '#efe6d2', .7 * s);
  d += `<path d="M${f(x - 3.6 * s)} ${f(top + 2.8 * s)}h${f(7.2 * s)}M${f(x - 2.4 * s)} ${f(top + 2.8 * s)}l${f(.6 * s)} ${f(-3 * s)}h${f(3.6 * s)}l${f(.6 * s)} ${f(3 * s)}" fill="${P.ink('loden')}" stroke="${P.ink('loden')}" stroke-width="${f(1 * s)}"/>`;
  d += `<path d="M${f(x + 1.6 * s)} ${f(top + .4 * s)}q${f(2 * s)} ${f(-3 * s)} ${f(.6 * s)} ${f(-5 * s)}q${f(-.6 * s)} ${f(2 * s)} ${f(-1.4 * s)} ${f(4.8 * s)}Z" fill="${P.ink('#d8cfc0')}" stroke="${P.keyC()}" stroke-width=".3"/>`;
  return d;
}
/** A big figure from behind in a loden coat, his green hat with its cord and chamois beard. */
function alpineFigure(P, x, by, s) {
  const { f } = P, X = (k) => f(x + k * s), Y = (k) => f(by - k * s);
  let d = P.figure(x, by, s, 'gent', { c: '#56704c', legs: '#4a4034', hat: '#4f6a46', arm: 16 });
  d += `<path d="M${X(-10)} ${Y(96.6)}Q${X(0)} ${Y(94.4)} ${X(10)} ${Y(96.6)}Q${X(10.4)} ${Y(98.6)} ${X(6.2)} ${Y(98.6)}L${X(5)} ${Y(108.4)}Q${X(0)} ${Y(110.6)} ${X(-5)} ${Y(108.4)}L${X(-6.2)} ${Y(98.6)}Q${X(-10.4)} ${Y(98.6)} ${X(-10)} ${Y(96.6)}Z" fill="${P.ink('#4f6a46')}" stroke="${P.keyC()}" stroke-width=".8"/>`;
  d += `<path d="M${X(-6)} ${Y(100)}Q${X(0)} ${Y(98.6)} ${X(6)} ${Y(100)}" stroke="${P.ink('#2a2622')}" stroke-width="${f(1.2 * s)}" fill="none"/>`;
  d += `<path d="M${X(3)} ${Y(104)}q${f(2 * s)} ${f(-8 * s)} ${f(7 * s)} ${f(-11 * s)}q${f(-1 * s)} ${f(5 * s)} ${f(-3 * s)} ${f(9 * s)}q${f(-2 * s)} ${f(2 * s)} ${f(-4 * s)} ${f(2 * s)}Z" fill="${P.ink('#d6cbb6')}" stroke="${P.keyC()}" stroke-width=".5"/><path d="M${X(4)} ${Y(106)}q${f(2 * s)} ${f(-6 * s)} ${f(5 * s)} ${f(-9 * s)}" stroke="${P.ink('#8a7a62')}" stroke-width=".5" fill="none"/>`;
  return d;
}
function dienstmann(P, x, y, s) {
  const { f } = P, top = y - 30 * s;
  // the public porter: blue jacket, red cap with its number, a coil of rope
  let d = P.person(x, y, s, 'worker', { c: '#2f4a7a', hat: '#c8342e' });
  d += `<path d="M${f(x - 2.4 * s)} ${f(top + 2.4 * s)}h${f(4.8 * s)}v${f(-2 * s)}h${f(-4.8 * s)}Z" fill="${P.ink('#c8342e')}"/><circle cx="${f(x + 3 * s)}" cy="${f(y - 12 * s)}" r="${f(2.2 * s)}" fill="none" stroke="${P.ink('#a8865a')}" stroke-width="${f(.8 * s)}"/>`;
  return d;
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
