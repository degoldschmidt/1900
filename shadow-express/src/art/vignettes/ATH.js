// Athens: up from the olive groves of the plain to the Acropolis rock, the Parthenon on top, broken in the middle
// as the powder blast of 1687 left it. Fallen drums, a goatherd and his goats below; Lycabettus far off.

export default {
  id: 'ATH',
  draw(k) {
    const f = k.f, r = k.rng(41);
    const plainY = 194;

    // ---------- far: Hymettus, Lycabettus, the low white town, the Olympieion ----------
    let far = k.mountains(plainY - 10, { seed: 14, h: 24, snow: false });
    far += k.shape(`M556 ${plainY - 4}C572 160 588 130 598 112C606 128 622 160 645 ${plainY - 4}Z`, 'light', { far: true, w: .6 }); // Lycabettus
    far += k.shape(k.rect(595, 106, 6, 6), 'paper', { far: true, w: .5 }) + k.shape(k.gable(594, 106, 8, 4), 'mid', { far: true, w: .4 });
    far += k.skyline(500, 645, plainY - 2, { seed: 5, style: 'south', hMin: 6, hMax: 14, wMin: 10, wMax: 20, chimneys: false });
    for (let i = 0; i < 6; i++) far += k.shape(k.rect(560 + i * 6, plainY - 36, 2.6, 32), 'vert', { far: true, w: .4 });
    far += k.shape(k.rect(558, plainY - 39, 36, 3), 'light', { far: true, w: .4 });
    far += k.skyline(-5, 130, plainY - 2, { seed: 8, style: 'south', hMin: 5, hMax: 12, wMin: 10, wMax: 18, chimneys: false });
    far += k.haze(plainY - 24, 24, .35);

    // ---------- the rock ----------
    const X0 = 118, X1 = 548;
    const top = (x) => 110 - Math.sin((x - X0) / (X1 - X0) * Math.PI) * 6;
    const foot = (x) => 148 + Math.sin(x * .09) * 5 + Math.sin(x * .023) * 7;
    const rock = (() => {
      const out = [[70, 204], [90, 186], [104, 160], [112, 134], [X0, top(X0)]];
      for (let x = X0 + 20; x < X1; x += 20) out.push([x, top(x) + (r() - .5) * 2]);
      out.push([X1, top(X1)], [556, 132], [566, 158], [582, 182], [604, 204]);
      let s = k.shape(k.poly(out), 'stipple', { w: 1.2 });
      // the sheer cliff band below the walls: lit on the west, in shadow to the east
      const cliff = [];
      for (let x = X0; x <= X1; x += 12) cliff.push([x, top(x) + 6]);
      for (let x = X1; x >= X0; x -= 12) cliff.push([x, foot(x)]);
      s += k.shape(k.poly(cliff), 'vert', { w: .8 });
      s += k.shape(k.poly([[420, top(420) + 6], [X1, top(X1) + 6], [556, 134], [560, foot(560)], [420, foot(420)]]), 'dark', { w: 0 });
      for (let i = 0; i < 9; i++) { const x = 500 + r() * 80, y = 150 + r() * 46; s += k.shape(`M${f(x - 7)} ${f(y)}q4 -7 9 -6q6 1 6 6Z`, 'dark', { w: .4 }); }
      for (let x = X0 + 8; x < X1 - 6; x += 8 + r() * 10) s += k.line(`M${f(x)} ${f(top(x) + 8)}l${f((r() - .5) * 4)} ${f(12 + r() * 22)}`, .6);
      for (let i = 0; i < 8; i++) { const x = X0 + 10 + r() * (X1 - X0 - 20); s += k.line(`M${f(x)} ${f(foot(x) - 3)}q8 -3 ${f(14 + r() * 10)} 1`, .7); }
      // the walls along the crown, in courses, the Nike bastion jutting west
      const wall = [];
      for (let x = X0; x <= X1; x += 12) wall.push([x, top(x) - 1]);
      for (let x = X1; x >= X0; x -= 12) wall.push([x, top(x) + 7]);
      s += k.shape(k.poly(wall), 'horiz', { w: .9 });
      s += k.shape(k.rect(104, top(X0) - 2, 20, 26), 'horiz', { w: .8 }) + k.shape(k.rect(104, top(X0) + 12, 20, 12), 'dark', { w: 0 });
      for (let i = 0; i < 16; i++) { const x = 80 + r() * 500, y = 166 + r() * 30; s += k.shape(`M${f(x - 5)} ${f(y)}a5 4 0 1 1 10 0Z`, 'dark', { w: .4 }); }
      return s;
    })();

    // ---------- temples ----------
    const columns = (x0, x1, by, h, n, o = {}) => {
      let s = '';
      const gap = (x1 - x0) / n, cw = gap * (o.cw ?? .55);
      for (let i = 0; i < n; i++) {
        const cx = x0 + gap * (i + .5), ch = o.height ? o.height(i, h) : h;
        if (ch <= 0) continue;
        s += k.shape(k.rect(cx - cw / 2, by - ch, cw, ch), 'paper', { w: o.w ?? .6, far: o.far }) + k.shape(k.rect(cx + cw * .1, by - ch, cw * .4, ch), 'mid', { w: 0, far: o.far });
        if (ch < h) s += k.shape(k.poly([[cx - cw / 2, by - ch], [cx - cw * .1, by - ch - 2], [cx + cw / 2, by - ch + 1]]), 'paper', { w: .5, far: o.far });
      }
      return s;
    };
    const temple = (x, by, w, h, n, ped, o = {}) => k.shape(k.rect(x + 1, by - h, w - 2, h), 'black', { w: 0 }) + columns(x, x + w, by, h, n, o)
      + k.shape(k.rect(x - 1, by - h - 5, w + 2, 5), 'light', { w: .7 }) + (ped ? k.shape(k.gable(x - 1, by - h - 5, w + 2, ped), 'light', { w: .7 }) : '')
      + k.shape(k.rect(x - 2, by, w + 4, 2.5), 'light', { w: .6 });
    const propylaea = temple(106, top(X0) - 2, 16, 10, 4, 4, { w: .45 }) // the little temple of Nike on its bastion
      + k.shape(k.rect(132, top(140) - 24, 22, 24), 'light', { w: .8 }) + k.shape(k.rect(146, top(140) - 24, 8, 24), 'dark', { w: 0 })
      + temple(156, top(170) - 2, 40, 21, 6, 8) + k.shape(k.rect(198, top(204) - 20, 18, 20), 'mid', { w: .8 });
    const erech = temple(236, top(250) - 2, 30, 13, 6, 0, { w: .45 }) + k.shape(k.rect(268, top(274) - 15, 18, 13), 'light', { w: .6 })
      + k.shape(k.rect(232, top(236) - 9, 6, 7), 'dark', { w: .5 });

    // the Parthenon: the west front with its pediment, the long north flank broken in the middle
    const parthenon = (() => {
      const x0 = 300, xf = 352, x1 = 470, by = top(380) - 4, h = 42, ent = 9;
      let s = k.shape(k.rect(x0, by, x1 - x0, 8), 'light', { w: .9 }) + k.line(`M${x0} ${f(by + 2.7)}H${x1}M${x0} ${f(by + 5.4)}H${x1}`, .5);
      // what is left standing of the south colonnade, seen through the gap
      s += columns(xf + 48, xf + 74, by, h - 6, 3, { cw: .4, w: .4, far: true, height: (i, hh) => hh * [.8, 1, .6][i] });
      // deep shade behind the standing columns
      s += k.shape(k.rect(x0 + 3, by - h + 2, xf - x0 + (x1 - xf) * 5 / 13, h - 2), 'black', { w: 0 }) + k.shape(k.rect(xf + (x1 - xf) * 8 / 13, by - h + 2, (x1 - xf) * 5 / 13 - 2, h - 2), 'black', { w: 0 });
      // west front: eight columns, entablature with triglyphs, the pediment
      s += columns(x0, xf, by, h, 8, { cw: .62, w: .8 });
      s += k.shape(k.rect(x0 - 2, by - h - ent, xf - x0 + 4, ent), 'light', { w: 1.1 }) + k.line(`M${x0 - 2} ${f(by - h - ent / 2)}h${xf - x0 + 4}`, .5);
      for (let x = x0 + 1; x < xf; x += 4.4) s += k.line(`M${f(x)} ${f(by - h - ent / 2)}v${f(ent / 2)}`, .7);
      s += k.shape(k.poly([[x0 - 4, by - h - ent], [(x0 + xf) / 2, by - h - ent - 17], [xf + 4, by - h - ent]]), 'light', { w: 1.2 });
      s += k.shape(k.poly([[x0 + 4, by - h - ent - 1.5], [(x0 + xf) / 2, by - h - ent - 14], [xf - 4, by - h - ent - 1.5]]), 'mid', { w: .5 });
      // the north flank, the middle columns broken off and the entablature gone above them
      const stump = (i, hh) => (i >= 5 && i <= 7 ? hh * [.55, .22, .6][i - 5] : hh);
      s += columns(xf, x1, by, h - 1, 13, { cw: .52, w: .7, height: stump });
      const g = (x1 - xf) / 13, ea = xf + g * 5.1, eb = xf + g * 7.9;
      s += k.shape(k.poly([[xf, by - h - ent + 1], [ea, by - h - ent + 1], [ea + 4, by - h - ent + 5], [ea, by - h + 1], [xf, by - h + 1]]), 'mid', { w: 1 });
      s += k.shape(k.poly([[eb, by - h - ent + 1], [x1 + 2, by - h - ent + 1], [x1 + 2, by - h + 1], [eb, by - h + 1], [eb - 4, by - h - ent + 6]]), 'mid', { w: 1 });
      s += k.shape(k.poly([[x1 - 12, by - h - ent + 1], [x1 - 2, by - h - ent - 7], [x1 + 4, by - h - ent + 1]]), 'mid', { w: .7 });
      for (const x of [404, 414, 424, 432]) s += k.shape(`M${x} ${f(by)}a3.4 2.4 0 1 1 6.8 0Z`, 'light', { w: .5 });
      return s;
    })();

    // ---------- the foreground: dry ground, olives, antiquities, goats ----------
    let ground = k.shape(`M-5 ${plainY + 6}Q160 ${plainY - 6} 320 ${plainY + 2}T645 ${plainY}V245H-5Z`, 'paper', { w: 1.1 });
    ground += k.shape(`M-5 ${plainY + 6}Q160 ${plainY - 6} 320 ${plainY + 2}T645 ${plainY}V${plainY + 10}Q480 ${plainY + 14} 320 ${plainY + 10}T-5 ${plainY + 14}Z`, 'stipple', { w: 0 });
    ground += k.shape(`M-5 226Q120 214 260 222T645 220V245H-5Z`, 'stipple', { w: .9 });
    for (let i = 0; i < 26; i++) { const x = r() * 640, y = plainY + 12 + r() * 30; ground += k.line(`M${f(x)} ${f(y)}q2 -3 ${f(4 + r() * 5)} -5M${f(x + 2)} ${f(y)}l1 -6`, .55); }
    // a dry-stone wall across the field
    let wall = k.shape(`M300 214Q440 206 645 210V218Q440 214 300 222Z`, 'light', { w: .9 });
    for (let x = 304; x < 640; x += 7 + r() * 5) wall += k.line(`M${f(x)} ${f(214 - (x - 300) * .012)}v6`, .6);
    const olive = (x, y, s) => {
      const S = (n) => f(n * s);
      let o = k.shape(`M${f(x - 4 * s)} ${f(y)}q${S(3)} ${S(-10)} ${S(-2)} ${S(-20)}q${S(-3)} ${S(-8)} ${S(-10)} ${S(-12)}l${S(3)} ${S(-1)}q${S(8)} ${S(4)} ${S(11)} ${S(10)}q${S(2)} ${S(-10)} ${S(10)} ${S(-16)}l${S(2)} ${S(2)}q${S(-7)} ${S(8)} ${S(-6)} ${S(18)}q${S(2)} ${S(10)} ${S(5)} ${S(20)}Z`, 'black', { w: .6 });
      for (const [dx, dy, rw, rh] of [[-18, -36, 14, 8], [4, -44, 16, 9], [-4, -31, 18, 7], [18, -33, 12, 7], [-26, -27, 10, 6], [10, -26, 9, 5]]) {
        o += k.shape(`M${f(x + (dx - rw) * s)} ${f(y + dy * s)}q${S(rw * .3)} ${S(-rh * 1.3)} ${S(rw)} ${S(-rh)}q${S(rw * .5)} ${S(-rh * .6)} ${S(rw)} ${S(rh * .2)}q${S(rw * .3)} ${S(rh * .9)} ${S(-rw * .4)} ${S(rh * .9)}q${S(-rw * .6)} ${S(rh * .3)} ${S(-rw * 1.6)} ${S(-rh * .1)}Z`, 'dark', { w: .6 });
        o += k.shape(`M${f(x + (dx - rw * .9) * s)} ${f(y + (dy - .2) * s)}q${S(rw * .3)} ${S(-rh * 1.1)} ${S(rw * .9)} ${S(-rh * .85)}q${S(rw * .4)} ${S(-rh * .4)} ${S(rw * .7)} 0q${S(-rw * .5)} ${S(rh * .2)} ${S(-rw * 1.6)} ${S(rh * .85)}Z`, 'stipple', { w: 0 });
      }
      return o;
    };
    const drum = (x, y, s) => k.shape(k.rect(x, y - 10 * s, 24 * s, 10 * s), 'paper', { w: .8 }) + k.shape(k.rect(x, y - 4 * s, 24 * s, 4 * s), 'mid', { w: 0 })
      + k.shape(`M${f(x + 24 * s)} ${f(y - 10 * s)}a${f(3.2 * s)} ${f(5 * s)} 0 1 1 0 ${f(10 * s)}a${f(3.2 * s)} ${f(5 * s)} 0 1 1 0 ${f(-10 * s)}Z`, 'light', { w: .8 })
      + k.line(`M${f(x)} ${f(y - 7.5 * s)}h${f(24 * s)}M${f(x)} ${f(y - 5.5 * s)}h${f(24 * s)}`, .4) + k.shape(k.rect(x - 2, y - 1, 30 * s, 2.4), 'black', { w: 0 });
    const capital = (x, y, s) => k.shape(k.rect(x - 9 * s, y - 7 * s, 18 * s, 7 * s), 'paper', { w: .8 }) + k.shape(k.rect(x - 12 * s, y - 10 * s, 24 * s, 3 * s), 'light', { w: .8 })
      + `<circle cx="${f(x - 9 * s)}" cy="${f(y - 5 * s)}" r="${f(3.6 * s)}" fill="${k.paper}" stroke="${k.ink}" stroke-width=".8"/><circle cx="${f(x + 9 * s)}" cy="${f(y - 5 * s)}" r="${f(3.6 * s)}" fill="url(#dark-${k.uid})" stroke="${k.ink}" stroke-width=".8"/>`
      + k.line(`M${f(x - 9 * s)} ${f(y - 5 * s)}m-1.6 0a1.6 1.6 0 1 0 1.6 -1.6`, .6) + k.shape(k.rect(x - 13 * s, y - 1, 26 * s, 2.4), 'black', { w: 0 });
    const goat = (x, y, s, dir = 1) => {
      const S = (n) => f(n * s), D = (n) => f(n * s * dir);
      return k.shape(`M${f(x)} ${f(y - 7 * s)}q${D(6)} ${S(-2)} ${D(11)} 0l${D(2)} ${S(-3)}l${D(1)} ${S(-3)}l${D(3)} ${S(1)}l${D(1)} ${S(3)}l${D(-2)} ${S(1)}q${D(-1)} ${S(4)} ${D(-4)} ${S(4)}h${D(-9)}q${D(-3)} ${S(-1)} ${D(-1)} ${S(-6)}Z`, 'black', { w: .5 })
        + k.line(`M${f(x + 1.5 * s * dir)} ${f(y - 3 * s)}v${S(3)}M${f(x + 4 * s * dir)} ${f(y - 3 * s)}v${S(3)}M${f(x + 9 * s * dir)} ${f(y - 3 * s)}v${S(3)}M${f(x + 11.5 * s * dir)} ${f(y - 3 * s)}v${S(3)}`, .8 * s)
        + k.line(`M${f(x + 14 * s * dir)} ${f(y - 12 * s)}q${D(-2)} ${S(-4)} ${D(-6)} ${S(-3)}M${f(x)} ${f(y - 6 * s)}l${D(-2)} ${S(2)}`, .7 * s);
    };
    let fore = wall + olive(64, 236, 2.3) + olive(250, 214, 1) + olive(214, 208, .7) + k.tree(16, 240, 1.7, 'cypress') + k.tree(126, 226, 1.4, 'cypress');
    fore += drum(150, 234, 1.4) + capital(214, 238, 1.3);
    fore += k.shape(k.rect(276, 204, 10, 32), 'paper', { w: .9 }) + k.shape(k.rect(281, 204, 5, 32), 'mid', { w: 0 }) + k.shape(k.poly([[275, 205], [279, 199], [282, 203], [287, 198], [287, 206]]), 'light', { w: .7 });
    fore += k.shape(k.rect(270, 234, 22, 3), 'black', { w: 0 });
    fore += k.figure(440, 232, 1.3, 'man') + k.line('M446 232l5 -34', 1.2) + goat(458, 236, 1.3) + goat(486, 230, 1.15, -1) + goat(404, 238, 1.35, -1) + goat(510, 238, 1.25) + goat(540, 226, 1, -1);
    fore += k.smoke(626, 186, .5, { seed: 2 });

    return far + rock + propylaea + erech + parthenon + ground + fore;
  },
};
