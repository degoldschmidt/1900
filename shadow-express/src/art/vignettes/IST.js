// Constantinople: from the Galata hillside, the Genoese tower on the left, looking down across the Golden Horn
// to Stamboul, where Hagia Sophia sits on its hill among minarets. Caiques and a ferry on the water.

export default {
  id: 'IST',
  draw(k) {
    const f = k.f, r = k.rng(31);
    const shoreY = 176;

    // a minaret with two balconies and a long pencil cap
    const minaret = (cx, by, w, h, o = {}) => {
      const far = o.far, sw = far ? .5 : .7;
      let s = k.shape(k.rect(cx - w / 2, by - h, w, h), 'vert', { far, w: sw });
      s += k.shape(k.rect(cx + w * .05, by - h, w * .45, h), 'dark', { far, w: 0 });
      for (const t of [.42, .68]) s += k.shape(k.rect(cx - w * .95, by - h * t - 2, w * 1.9, 2.4), 'dark', { far, w: sw * .8 });
      s += k.shape(k.spire(cx, by - h, w * 1.15, h * .24), 'dark', { far, w: sw });
      return s + k.line(`M${f(cx)} ${f(by - h * 1.24)}v-3`, far ? .5 : .7, { far });
    };
    // a ribbed dome, lit on the left, with its crescent finial
    const dome = (cx, by, rw, rh, o = {}) => {
      const far = o.far;
      let s = k.shape(k.dome(cx, by, rw, rh), 'light', { far, w: o.w });
      s += k.shape(`M${f(cx + rw * .25)} ${f(by - rh * .98)}C${f(cx + rw * .8)} ${f(by - rh * .9)} ${f(cx + rw)} ${f(by - rh * .5)} ${f(cx + rw)} ${f(by)}H${f(cx + rw * .35)}C${f(cx + rw * .45)} ${f(by - rh * .5)} ${f(cx + rw * .4)} ${f(by - rh * .8)} ${f(cx + rw * .25)} ${f(by - rh * .98)}Z`, 'dark', { far, w: 0 });
      for (let i = 1; i < 8; i++) { const t = i / 8 - .5; s += k.line(`M${f(cx + t * rw * 2)} ${f(by)}Q${f(cx + t * rw * 1.5)} ${f(by - rh * .85)} ${f(cx)} ${f(by - rh)}`, far ? .35 : .45, { far }); }
      return s + k.line(`M${f(cx)} ${f(by - rh)}v-6`, far ? .5 : .8, { far }) + k.shape(`M${f(cx - 2)} ${f(by - rh - 8)}a2.2 2.2 0 1 0 4 0a1.6 1.8 0 1 1 -4 0Z`, 'ink', { far, w: 0 });
    };

    // ---------- far: Stamboul's hill and its skyline ----------
    let far = k.shape(`M210 ${shoreY}C260 156 330 150 400 152S560 150 645 158V${shoreY}Z`, 'light', { far: true, w: .5 });
    far += k.skyline(232, 645, shoreY - 2, { seed: 27, style: 'orient', hMin: 8, hMax: 20, wMin: 9, wMax: 18 });
    // the Süleymaniye, far up the Horn
    far += k.shape(k.rect(272, 150, 64, 22), 'light', { far: true, w: .5 }) + dome(304, 150, 20, 15, { far: true })
      + k.shape(k.dome(281, 152, 9, 6), 'mid', { far: true, w: .5 }) + k.shape(k.dome(327, 152, 9, 6), 'mid', { far: true, w: .5 });
    for (const x of [266, 276, 332, 342]) far += minaret(x, 172, 2.6, x === 276 || x === 332 ? 50 : 42, { far: true });
    // the Sultan Ahmed beyond, on the edge, only a hint
    far += k.shape(k.rect(590, 142, 60, 30), 'light', { far: true, w: .5 }) + dome(626, 142, 22, 16, { far: true }) + minaret(598, 172, 3, 72, { far: true }) + minaret(611, 172, 3, 64, { far: true });
    far += k.haze(148, 28, .4);

    // ---------- Hagia Sophia ----------
    const hs = (() => {
      const cx = 486, by = 172;
      // the low mass of aisles and outbuildings
      let s = k.shape(k.rect(418, 140, 136, by - 140), 'light');
      s += k.shape(k.rect(528, 140, 26, by - 140), 'dark', { w: .6 });
      s += k.windows(424, 146, 100, 12, 10, 1, { arched: true, ww: .35, wh: .8, lit: .2 });
      s += k.shape(k.rect(418, by - 8, 136, 8), 'mid', { w: .6 });
      // the great buttresses either side of the dome
      for (const [x, tone] of [[436, 'vert'], [518, 'dark']]) s += k.shape(k.poly([[x, by - 8], [x, 104], [x + 3, 99], [x + 15, 99], [x + 18, 104], [x + 18, by - 8]]), tone, { w: .9 });
      // the cascade of half-domes, west and east
      s += k.shape(k.rect(426, 124, 120, 16), 'light', { w: .8 }) + k.shape(k.rect(520, 124, 26, 16), 'dark', { w: 0 });
      s += k.shape(k.dome(430, 140, 12, 9), 'mid', { w: .7 }) + k.shape(k.dome(452, 124, 22, 13), 'light', { w: .9 });
      s += k.shape(k.dome(542, 140, 12, 9), 'dark', { w: .7 }) + k.shape(k.dome(520, 124, 22, 13), 'mid', { w: .9 });
      // the drum with its ring of forty windows
      s += k.shape(k.rect(cx - 40, 99, 80, 10), 'light', { w: .9 }) + k.shape(k.rect(cx + 18, 99, 22, 10), 'dark', { w: 0 });
      s += k.windows(cx - 38, 100, 76, 8, 14, 1, { arched: true, ww: .5, wh: .8, lit: .3 });
      s += dome(cx, 100, 44, 30, { w: 1.3 });
      // the four minarets at the corners, the western pair stouter
      s += minaret(408, by, 6, 126) + minaret(422, by, 4.4, 114) + minaret(554, by, 4.4, 116) + minaret(568, by, 5.6, 128);
      return s;
    })();

    // ---------- the Golden Horn ----------
    let water = k.water(shoreY, 240, { seed: 8 });
    water += k.reflect(`<g>${hs}</g>`, shoreY, .22);
    water += k.shape(k.rect(-5, shoreY, 650, 4), 'horiz', { w: 0 });
    const caique = (x, y, s, dir = 1, rowers = 2) => {
      const D = (n) => f(n * s * dir), S = (n) => f(n * s);
      let o = k.shape(`M${f(x - 30 * s * dir)} ${f(y - 9 * s)}q${D(6)} ${S(9)} ${D(26)} ${S(9)}h${D(14)}q${D(16)} 0 ${D(22)} ${S(-12)}l${D(-4)} ${S(1)}q${D(-8)} ${S(6)} ${D(-20)} ${S(6)}h${D(-26)}q${D(-8)} 0 ${D(-11)} ${S(-4)}Z`, 'black', { w: .6 });
      o += k.line(`M${f(x - 22 * s * dir)} ${f(y - 4 * s)}h${D(40)}`, .5 * s, { color: k.paper });
      for (let i = 0; i < rowers; i++) {
        const rx = x + (i * 12 - 6) * s * dir;
        o += k.shape(`M${f(rx - 2.4 * s)} ${f(y - 4 * s)}l${S(1)} ${S(-7)}h${S(3)}l${S(1)} ${S(7)}Z`, 'dark', { w: .4 });
        o += `<circle cx="${f(rx)}" cy="${f(y - 12.6 * s)}" r="${S(1.8)}" fill="${k.ink}"/>` + k.shape(k.rect(rx - 1.5 * s, y - 16.6 * s, 3 * s, 2.6 * s), 'ink', { w: 0 });
        o += k.line(`M${f(rx + 3 * s * dir)} ${f(y - 9 * s)}l${D(9)} ${S(10)}`, .7 * s);
      }
      return o + k.shape(`M${f(x + 14 * s * dir)} ${f(y - 4 * s)}q${S(2)} ${S(-7)} ${D(6)} ${S(-7)}q${D(4)} 0 ${D(5)} ${S(7)}Z`, 'mid', { w: .4 });
    };
    const boats = k.boat(376, 196, .9, 'steamer', -1) + caique(548, 200, .7, -1, 1) + caique(452, 214, 1, 1, 2) + caique(588, 230, 1.3, -1, 2);
    let ripples = '';
    for (let i = 0; i < 5; i++) ripples += k.line(`M${f(330 + r() * 280)} ${f(shoreY + 8 + i * 9)}h${f(20 + r() * 40)}`, .6);

    // ---------- Galata: the hillside, its houses and the tower ----------
    const hill = k.shape(`M-5 150C40 146 100 150 140 156S200 170 222 190L262 214L300 222L318 245H-5Z`, 'dark');
    const house = (x, by, w, h, o = {}) => { // an Ottoman house, the upper storey jutting out on brackets
      const up = h * .5, jut = 4, tone = o.tone ?? 'light';
      let s = k.shape(k.rect(x, by - h + up, w, h - up), tone === 'light' ? 'mid' : 'dark', { w: .8 });
      s += k.shape(k.rect(x - jut, by - h, w + jut, up), tone, { w: .8 });
      s += k.shape(k.rect(x + w - 4, by - h, 4, h), 'black', { w: 0 });
      s += k.line(`M${f(x - jut)} ${f(by - h + up)}l${jut} 4`, .7);
      s += k.windows(x - jut + 2, by - h + 2, w + jut - 8, up - 4, Math.max(1, Math.round(w / 9)), 1, { ww: .55, wh: .7, lit: .45 });
      s += k.shape(k.poly([[x - jut - 4, by - h], [x + w * .35, by - h - 7], [x + w + 3, by - h]]), 'tiles', { w: .7 });
      if (o.door) s += k.shape(k.arch(x + w * .3, by - 10, 5, 10), 'black', { w: .4 });
      return s;
    };
    const stone = (x, by, w, h) => k.shape(k.rect(x, by - h, w, h), 'light', { w: .8 }) + k.shape(k.rect(x + w - 6, by - h, 6, h), 'dark', { w: 0 })
      + k.windows(x + 2, by - h + 4, w - 9, h - 12, Math.round(w / 9), 2, { arched: true, ww: .45, wh: .6 }) + k.line(`M${x - 2} ${by - h}h${w + 4}`, 1.4)
      + k.shape(k.rect(x, by - 7, w, 7), 'dark', { w: .5 });
    let town = '';
    // the crest, behind the tower
    for (const [x, by, w, h] of [[-4, 152, 22, 24], [18, 150, 20, 30], [40, 152, 18, 22], [150, 162, 20, 24], [172, 168, 22, 22]]) town += house(x, by, w, h);
    town += k.smoke(30, 116, .7, { seed: 3 }) + k.tree(66, 156, 1.1, 'cypress') + k.tree(196, 172, 1, 'cypress');
    const tower = (() => {
      const cx = 112, by = 168;
      let s = k.shape(`M${cx - 18} ${by}L${cx - 16} 62H${cx + 16}L${cx + 18} ${by}Z`, 'vert', { w: 1.3 });
      s += k.shape(`M${cx + 6} ${by}L${cx + 6} 62H${cx + 16}L${cx + 18} ${by}Z`, 'dark', { w: .6 });
      for (let y = 70; y < by - 6; y += 9) s += k.line(`M${cx - 17} ${y}h23`, .35);
      for (const y of [78, 104, 130]) s += k.shape(k.arch(cx - 7, y, 4, 9), 'black', { w: .4 }) + k.shape(k.arch(cx + 9, y + 6, 3, 8), 'black', { w: .4 });
      // the corbelled gallery
      s += k.shape(k.rect(cx - 22, 54, 44, 8), 'light', { w: 1 });
      let corb = `M${cx - 21} 62`;
      for (let i = 0; i < 8; i++) corb += `q2.6 5 5.25 0`;
      s += k.shape(corb + 'Z', 'dark', { w: .6 });
      for (let x = cx - 21; x <= cx + 21; x += 3.5) s += k.line(`M${f(x)} 47V54`, .6);
      s += k.line(`M${cx - 22} 47H${cx + 22}`, 1);
      // the top storey of arched windows
      s += k.shape(k.rect(cx - 15, 32, 30, 15), 'light', { w: .9 }) + k.shape(k.rect(cx + 6, 32, 9, 15), 'dark', { w: 0 });
      s += k.windows(cx - 14, 33, 28, 13, 5, 1, { arched: true, ww: .5, wh: .8, lit: .6 });
      // the cone
      s += k.shape(`M${cx - 20} 33L${cx} 1L${cx + 20} 33Q${cx} 37 ${cx - 20} 33Z`, 'mid', { w: 1.3 });
      s += k.shape(`M${cx + 3} 3.5L${cx + 20} 33Q${cx + 12} 35.5 ${cx + 5} 35.8Z`, 'black', { w: 0 });
      return s;
    })();
    // the slope below, tumbling down to the quays
    let front = '';
    for (const [x, by, w, h, o] of [[-6, 188, 26, 30, {}], [22, 184, 22, 34, { stone: 1 }], [48, 190, 24, 26, {}], [76, 188, 28, 32, { stone: 1 }], [108, 192, 24, 26, { door: 1 }],
      [136, 194, 26, 28, {}], [166, 200, 22, 28, { tone: 'mid' }], [192, 208, 24, 28, {}], [220, 216, 24, 26, { stone: 1 }]]) front += o.stone ? stone(x, by, w, h) : house(x, by, w, h, o);
    front += k.haze(186, 14, .35);
    for (const [x, by, w, h, o] of [[-8, 230, 30, 34, { tone: 'mid' }], [24, 228, 28, 30, {}], [56, 234, 30, 34, { stone: 1 }], [90, 230, 28, 30, { tone: 'mid', door: 1 }], [122, 236, 30, 30, {}],
      [156, 238, 28, 28, { stone: 1 }], [188, 242, 26, 26, { tone: 'mid' }], [218, 244, 26, 24, {}], [246, 246, 26, 22, { tone: 'mid' }], [274, 248, 24, 16, {}]]) front += o.stone ? stone(x, by, w, h) : house(x, by, w, h, o);
    front += k.tree(146, 200, 1.2, 'cypress') + k.tree(14, 196, 1.3, 'cypress');
    // the quay where the hill meets the water, a moored caique, a porter and a veiled woman
    front += k.shape(k.poly([[262, 214], [312, 214], [326, 240], [270, 240]]), 'vert', { w: .9 }) + k.line('M262 214H312', 1.4);
    front += caique(318, 236, .8, 1, 1) + k.figure(282, 214, .9, 'porter') + k.figure(296, 214, .85, 'nun') + k.lamp(270, 214, .8);
    front += k.smoke(196, 176, .7, { seed: 9 });

    return far + hs + water + ripples + boats + hill + town + tower + front;
  },
};
