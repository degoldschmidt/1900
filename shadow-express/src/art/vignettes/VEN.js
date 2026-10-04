// Venice: from a gondola in the basin of St Mark, its iron prow rising at the left, looking at the Molo:
// the Library, the rebuilt Campanile (1912), the two columns of the Piazzetta and the Doge's Palace arcades.

export default {
  id: 'VEN',
  draw(k) {
    const f = k.f, r = k.rng(17);
    const molo = 186;

    // ---------- the domes of San Marco behind the palace ----------
    let back = '';
    for (const [cx, w] of [[374, 26], [412, 30], [448, 24]]) { // tall Byzantine domes, each with its little lantern
      const b = 98, h = w * .8;
      back += k.shape(k.rect(cx - w / 2, b - 4, w, 8), 'light', { w: .7, far: true });
      back += k.shape(`M${f(cx - w / 2)} ${b - 4}C${f(cx - w / 2)} ${f(b - 4 - h * 1.25)} ${f(cx + w / 2)} ${f(b - 4 - h * 1.25)} ${f(cx + w / 2)} ${b - 4}Z`, 'light', { w: .8, far: true });
      back += k.shape(`M${f(cx + w * .12)} ${f(b - 4 - h * .93)}C${f(cx + w * .4)} ${f(b - 4 - h * .8)} ${f(cx + w / 2)} ${f(b - 4 - h * .4)} ${f(cx + w / 2)} ${b - 4}H${f(cx + w * .2)}Z`, 'mid', { w: 0, far: true });
      back += k.shape(k.rect(cx - 2, f(b - 4 - h * .94 - 5), 4, 5), 'light', { w: .5, far: true }) + k.shape(k.onion(cx, f(b - 4 - h * .94 - 5), 6, 7), 'mid', { w: .5, far: true }) + k.line(`M${cx} ${f(b - 4 - h * .94 - 12)}v-4`, .5, { far: true });
    }
    back += k.haze(150, 34, .3);

    // ---------- the Library, on the left ----------
    const library = (() => {
      const x0 = -6, x1 = 186, top = 128;
      let s = k.shape(k.rect(x0, top, x1 - x0, molo - top), 'light');
      s += k.shape(k.rect(x1 - 12, top, 12, molo - top), 'dark', { w: .6 });
      // ground arcade
      for (let x = x0 + 6; x < x1 - 14; x += 24) s += k.shape(k.arch(x + 3, 160, 14, molo - 160), 'black', { w: .6 }) + k.shape(k.rect(x - 2, 158, 4, molo - 158), 'vert', { w: .4 });
      s += k.line(`M${x0} 156H${x1}`, 1.2) + k.line(`M${x0} 159H${x1}`, .5);
      // piano nobile: arched windows between columns
      s += k.windows(x0 + 4, 134, x1 - x0 - 18, 20, 8, 1, { arched: true, ww: .5, wh: .9, lit: .5 });
      for (let x = x0 + 4; x < x1 - 14; x += 21.5) s += k.shape(k.rect(x - 1.4, 132, 2.8, 23), 'vert', { w: .35 });
      // the frieze, balustrade and statues on the roofline
      s += k.shape(k.rect(x0, top - 8, x1 - x0 + 2, 8), 'mid', { w: .8 });
      for (let x = x0 + 8; x < x1; x += 21.5) s += k.figure(x, top - 8, .5, 'priest');
      s += k.shape(k.rect(x1 - 6, top - 22, 5, 14), 'light', { w: .5 }) + k.shape(k.spire(x1 - 3.5, top - 22, 6, 10), 'dark', { w: .5 });
      s += k.shape(k.rect(x0, molo - 6, x1 - x0, 6), 'dark', { w: .5 });
      return s;
    })();

    // ---------- the Campanile ----------
    const campanile = (() => {
      const cx = 220, w = 28, base = molo, shaft = 74;
      let s = k.shape(k.rect(cx - w / 2, shaft, w, base - shaft), 'brick', { w: 1.2 });
      s += k.shape(k.rect(cx + w / 2 - 9, shaft, 9, base - shaft), 'dark', { w: .6 });
      for (const dx of [-9, -3, 3]) s += k.line(`M${cx + dx} ${shaft + 4}V${base - 34}`, .6);
      s += k.line(`M${cx - w / 2 + 2} ${shaft + 4}H${cx + w / 2 - 2}`, .6);
      // the loggia of the bells
      s += k.shape(k.rect(cx - w / 2 - 2, shaft - 3, w + 4, 4), 'light', { w: .8 });
      s += k.shape(k.rect(cx - w / 2, shaft - 20, w, 17), 'light', { w: 1 });
      for (let i = 0; i < 4; i++) s += k.shape(k.arch(cx - w / 2 + 2 + i * 6.6, shaft - 18, 4.4, 14), 'black', { w: .4 });
      s += k.shape(k.rect(cx - w / 2 - 2, shaft - 23, w + 4, 3), 'light', { w: .8 });
      // the attic with its lion, then the green pyramid and the angel
      s += k.shape(k.rect(cx - w / 2 + 1, shaft - 38, w - 2, 15), 'light', { w: 1 }) + k.shape(k.rect(cx + w / 2 - 7, shaft - 38, 6, 15), 'mid', { w: 0 });
      s += k.shape(`M${cx - 6} ${shaft - 27}q3 -6 8 -4l3 -3l1 4q-2 4 -7 4Z`, 'dark', { w: .4 });
      s += k.shape(k.poly([[cx - w / 2, shaft - 38], [cx, 6], [cx + w / 2, shaft - 38]]), 'mid', { w: 1.1 });
      s += k.shape(k.poly([[cx + 1.5, 9], [cx + w / 2, shaft - 38], [cx + 3, shaft - 38]]), 'dark', { w: 0 });
      s += k.line(`M${cx} 6v-3`, .8) + k.shape(`M${cx - 3} 3l3 -2l3 2l-3 -1Z`, 'ink', { w: .5 });
      return s;
    })();

    // ---------- the two columns of the Piazzetta ----------
    const column = (x, top, saint) => {
      let s = k.shape(k.rect(x - 4, molo - 8, 8, 8), 'mid', { w: .6 });
      s += k.shape(k.rect(x - 2.6, top, 5.2, molo - 8 - top), 'vert', { w: .8 }) + k.shape(k.rect(x + .6, top, 2, molo - 8 - top), 'dark', { w: 0 });
      s += k.shape(k.poly([[x - 4.5, top], [x - 3, top - 4], [x + 3, top - 4], [x + 4.5, top]]), 'light', { w: .6 });
      if (saint === 'lion') s += k.shape(`M${x - 7} ${top - 4}l1 -5q4 -3 9 -2l2 -4l2 2l-1 3l3 1l-2 5Z`, 'black', { w: .5 }) + k.shape(`M${x - 2} ${top - 10}l-5 -6l7 3Z`, 'dark', { w: .4 });
      else s += k.figure(x, top - 4, .55, 'man') + k.line(`M${x + 2} ${top - 4}l1 -15`, .6) + k.shape(`M${x - 5} ${top - 4}h10l-2 -2h-6Z`, 'dark', { w: .4 });
      return s;
    };
    const columns = column(276, 102, 'lion') + column(330, 104, 'saint');

    // ---------- the Doge's Palace ----------
    const palace = (() => {
      const x0 = 352, x1 = 646, top = 98, ar = 160, lg = 134;
      let s = k.shape(k.rect(x0, top, x1 - x0, molo - top), 'light');
      // the diamond lattice of the upper wall
      let lat = '';
      for (let x = x0 - 40; x < x1; x += 9) lat += `M${x} ${lg}l36 -36M${x + 36} ${lg}l-36 -36`;
      s += `<path d="${lat}" stroke="${k.ink}" stroke-width=".35" opacity=".7" clip-path="url(#ven-wall-${k.uid})"/>`;
      s += `<clipPath id="ven-wall-${k.uid}"><rect x="${x0}" y="${top}" width="${x1 - x0}" height="${lg - top}"/></clipPath>`;
      // the great windows and the central balcony
      for (const x of [372, 410, 448, 540, 578, 616]) s += k.shape(k.gothic(x, 106, 12, 20), 'glass', { w: .7 }) + k.shape(k.rect(x - 2, 126, 16, 2), 'light', { w: .4 });
      s += k.shape(k.gothic(490, 102, 18, 28), 'glass', { w: .8 }) + k.shape(k.rect(484, 130, 30, 3), 'mid', { w: .5 }) + k.shape(k.spire(499, 104, 26, 12), 'dark', { w: .6 });
      for (const x of [372, 410, 448, 540, 578, 616]) if (r() < .5) k.lights.push([x + 2, 112, 8, 12]);
      // the crenellation of little spikes
      let cren = `M${x0} ${top}`;
      for (let x = x0; x < x1; x += 7) cren += `l1.5 -4l2 2.4l2 -2.4l1.5 4`;
      s += k.shape(cren + 'Z', 'light', { w: .6 });
      // the loggia: slender pointed arches crowned with quatrefoils
      s += k.shape(k.rect(x0, lg, x1 - x0, ar - lg), 'black', { w: .8 });
      for (let x = x0 + 2; x < x1 - 6; x += 12) {
        s += k.shape(`M${x} ${ar}V${lg + 10}h2.5q3.5 -7 7 0h2.5V${ar}h-2.5V${lg + 12}q-3.5 -5 -7 0V${ar}Z`, 'light', { w: .5 });
        s += `<circle cx="${x + 12}" cy="${lg + 4.5}" r="3" fill="${k.paper}" stroke="${k.ink}" stroke-width=".5"/>`;
      }
      s += k.shape(k.rect(x0, lg, x1 - x0, 2.4), 'light', { w: .6 }) + k.shape(k.rect(x0, ar - 6, x1 - x0, 6), 'mid', { w: .6 });
      // the ground arcade: stout columns and pointed arches, deep in shadow
      s += k.shape(k.rect(x0, ar, x1 - x0, molo - ar), 'black', { w: 1 });
      for (let x = x0; x < x1; x += 24) s += k.shape(`M${x} ${molo}V${ar + 8}h4q8 -10 16 0h4V${molo}h-4V${ar + 12}q-8 -8 -16 0V${molo}Z`, 'vert', { w: .6 });
      s += k.shape(k.rect(x0, ar, x1 - x0, 4), 'light', { w: .7 });
      return s;
    })();

    // ---------- the Molo, its people and lamps ----------
    let quay = k.shape(k.rect(-6, molo, 652, 6), 'vert', { w: .9 }) + k.line(`M-6 ${molo + 6}H646`, 1.2);
    for (const x of [96, 248, 362, 540]) { quay += k.lamp(x, molo, .7); k.lights.push([x - 1.6, molo - 20, 3.2, 3]); }
    quay += k.figure(120, molo, .7, 'man') + k.figure(128, molo, .7, 'woman') + k.figure(300, molo, .7, 'man') + k.figure(420, molo, .7, 'soldier') + k.figure(470, molo, .7, 'woman');

    // ---------- the basin ----------
    let water = k.water(molo + 6, 240, { seed: 12 });
    water += k.reflect(`<g>${campanile}${palace}</g>`, molo + 6, .2);
    water += k.shape(k.rect(-5, molo + 6, 650, 4), 'horiz', { w: 0 });
    // gondolas moored along the Molo, poles beside them
    let moored = '';
    for (const x of [150, 196, 240, 384, 430, 476, 522]) moored += k.boat(x, molo + 16, .75, 'gondola', x % 2 ? -1 : 1) + k.line(`M${x + 14} ${molo + 18}V${molo + 2}`, .8);
    moored += k.boat(318, 214, 1.1, 'sail', -1);
    // striped mooring poles in the right foreground
    const pole = (x, top) => {
      let s = k.shape(k.rect(x - 3, top, 6, 246 - top), 'paper', { w: 1 });
      for (let y = top + 4; y < 240; y += 9) s += k.shape(`M${x - 3} ${y}l6 -4v4l-6 4Z`, 'black', { w: 0 });
      return s + k.shape(k.poly([[x - 4, top], [x, top - 6], [x + 4, top]]), 'black', { w: .6 });
    };
    const poles = pole(574, 146) + pole(596, 138) + pole(614, 150) + k.boat(560, 232, 1.4, 'gondola', 1);

    // ---------- our own gondola: the black prow and its iron ferro, lower left ----------
    const ferro = (() => {
      let s = k.shape('M-6 246V206Q54 210 100 182L108 188Q80 214 56 246Z', 'black', { w: .9 });
      s += k.line('M-6 216Q52 218 98 188', .8, { color: k.paper }) + k.line('M-6 230Q40 230 70 214', .5, { color: k.paper });
      // the iron: a curved neck, six teeth facing forward, one behind, and the broad rounded blade on top
      s += k.shape('M100 184Q112 176 108 162L113 160Q118 178 106 190Z', 'ink', { w: .6 });
      s += k.shape('M107 164L106 124Q118 112 132 118Q124 120 120 126L113 128L114 164Z', 'ink', { w: .7 });
      for (let i = 0; i < 6; i++) s += k.shape(`M113 ${131 + i * 5.4}h14l2 1.4l-2 1.4h-14Z`, 'ink', { w: 0 });
      s += k.shape('M107 146h-8l-1.6 1.4l1.6 1.4h8Z', 'ink', { w: 0 });
      return s;
    })();
    // a vaporetto puffing across, the soot of the modern city on the old
    const vap = (() => {
      const x = 462, y = 214;
      let s = k.shape(`M${x - 30} ${y - 6}h58l-5 6h-50Z`, 'black', { w: .7 }) + k.shape(k.rect(x - 22, y - 13, 38, 7), 'light', { w: .6 });
      s += k.windows(x - 21, y - 12, 36, 5, 7, 1, { lit: .6 }) + k.shape(k.rect(x - 25, y - 15, 44, 2.4), 'dark', { w: .5 });
      s += k.shape(k.rect(x + 2, y - 30, 3.4, 15), 'black', { w: .5 }) + k.smoke(x + 3.7, y - 31, .8, { seed: 4 });
      return s;
    })();

    return back + library + campanile + columns + palace + quay + water + moored + vap + poles + ferro;
  },
};
