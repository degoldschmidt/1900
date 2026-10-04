// Warsaw: Castle Square after rain, at street level. Sigismund's Column towers near on the left, the king with his cross;
// across the square the Royal Castle with its clock tower and tall baroque helm. An electric tram under its wire,
// a droshky with the Russian duga, porters and a gendarme on wet cobbles; Old Town tenements smoking on the left.

export default {
  id: 'WAR',
  draw(k) {
    const f = k.f, r = k.rng(23);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const horse = (x, y, s, dir = 1, tone = 'dark') => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, f(1.25 * s)) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, f(1.3 * s)) + k.shape(body, tone, { w: .6 });
    };
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    // cobbles as one path: rows of small arcs, larger toward the eye
    const cobbles = (y0, y1, seed) => {
      const q = k.rng(seed);
      let d = '';
      for (let y = y0 + 3, row = 0; y < y1; row++) { const sz = 4 + (y - y0) * .16; for (let x = (row % 2) * sz * .6 - 8; x < 648; x += sz * 1.25) d += `M${P(x, y)}q${f(sz * .5)} ${f(-sz * .32 - q() * .6)} ${f(sz)} 0`; y += sz * .55; }
      return k.line(d, .55);
    };

    // ---- far: the roofs of Praga beyond the Vistula, in smoke
    let s = k.skyline(240, 645, 150, { seed: 8, hMin: 6, hMax: 14, wMin: 12, wMax: 22, style: 'east', lit: .2, chimneys: false }) + k.haze(126, 26, .4);

    // ---- the Royal Castle across the square
    const cy = 196, cTop = 140;
    let c = k.shape(k.poly([[244, cTop], [256, cTop - 20], [628, cTop - 20], [645, cTop]]), 'dark', { w: 1 }); // hipped roof
    for (let x = 274; x < 600; x += 32) c += k.shape(k.rect(x, cTop - 15, 7, 9), 'light', { w: .6 }) + k.shape(k.gable(x - 1, cTop - 15, 9, 5), 'dark', { w: .5 });
    c += k.shape(k.rect(244, cTop, 401, cy - cTop), 'light', { w: 1.1 }) + k.shape(k.rect(244, cy - 15, 401, 15), 'mid', { w: .7 }); // soot-dark ground storey
    c += k.windows(248, cTop + 5, 160, 34, 9, 2, { lit: .4 }) + k.windows(474, cTop + 5, 124, 34, 7, 2, { lit: .4 });
    c += k.shape(k.rect(244, cTop - 2, 401, 3), 'dark', { w: .6 }) + k.line(`M244 ${cTop + 22}H645`, .6);
    // a lower corner tower at the far end, with a small cap
    c += k.shape(k.rect(600, cTop - 34, 26, cy - cTop + 34), 'light', { w: 1 }) + k.shape(k.rect(616, cTop - 34, 10, cy - cTop + 34), 'dark', { w: .5 })
      + k.windows(602, cTop - 30, 14, 60, 1, 4, { lit: .4 }) + k.shape(k.dome(613, cTop - 34, 14, 10), 'dark', { w: .9 }) + k.shape(k.spire(613, cTop - 47, 4, 12), 'dark', { w: .6 });
    // the clock tower: square shaft, clock stage, balustrade, then the helm: bell, lantern, bulb and needle
    const tx = 424, tw = 36, tc = tx + tw / 2, tt = 92;
    c += k.shape(k.rect(tx - 6, cTop - 4, tw + 12, cy - cTop + 4), 'light', { w: 1.1 }) + k.shape(k.rect(tx + tw - 2, cTop - 4, 8, cy - cTop + 4), 'dark', { w: .6 });
    c += k.shape(k.arch(tc - 7, cy - 26, 14, 26), 'black', { w: .8 }) + k.windows(tx - 3, cTop + 2, tw + 6, 30, 2, 2, { lit: .5 });
    c += k.shape(k.rect(tx, tt, tw, cTop - tt), 'vert', { w: 1.2 }) + k.shape(k.rect(tx + tw * .7, tt, tw * .3, cTop - tt), 'dark', { w: .5 });
    c += k.shape(k.arch(tx + 6, 124, 9, 14), 'black', { w: .5 }) + k.shape(k.arch(tx + 20, 124, 9, 14), 'black', { w: .5 });
    c += `<circle cx="${f(tc - 1)}" cy="${tt + 15}" r="10" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.3"/><circle cx="${f(tc - 1)}" cy="${tt + 15}" r="7.6" fill="none" stroke="${k.ink}" stroke-width=".5"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c += k.line(`M${P(tc - 1 + Math.cos(a) * 6.2, tt + 15 + Math.sin(a) * 6.2)}l${f(Math.cos(a) * 1.4)} ${f(Math.sin(a) * 1.4)}`, .6); }
    c += k.line(`M${P(tc - 1, tt + 15)}l0 -5.6M${P(tc - 1, tt + 15)}l4 2`, 1);
    c += k.shape(k.rect(tx - 3, tt - 4, tw + 6, 4), 'dark', { w: .8 });
    let bal = '';
    for (let x = tx - 1; x < tx + tw + 2; x += 4) bal += `M${P(x, tt - 4)}v-5`;
    c += k.line(bal, .7) + k.line(`M${P(tx - 3, tt - 9)}h${f(tw + 6)}`, .9);
    const hb = tt - 9;
    const bell = `M${P(tx + 1, hb)}C${P(tx + 1, hb - 13)} ${P(tc - 9, hb - 15)} ${P(tc - 6, hb - 21)}L${P(tc + 6, hb - 21)}C${P(tc + 9, hb - 15)} ${P(tx + tw - 1, hb - 13)} ${P(tx + tw - 1, hb)}Z`;
    c += k.shape(bell, 'mid', { w: 1.2 }) + k.shape(`M${P(tc + 3, hb)}C${P(tc + 6, hb - 11)} ${P(tc + 5, hb - 17)} ${P(tc + 4, hb - 21)}L${P(tc + 6, hb - 21)}C${P(tc + 9, hb - 15)} ${P(tx + tw - 1, hb - 13)} ${P(tx + tw - 1, hb)}Z`, 'dark', { w: .4 });
    c += k.shape(k.rect(tc - 6, hb - 34, 12, 13), 'light', { w: 1 }) + k.shape(k.arch(tc - 3, hb - 32, 5, 10), 'black', { w: .4 }) + k.shape(k.rect(tc + 3, hb - 34, 3, 13), 'dark', { w: .4 });
    c += k.shape(k.onion(tc, hb - 34, 14, 12), 'mid', { w: 1 }) + k.shape(k.spire(tc, hb - 45, 4.6, 24), 'dark', { w: .8 });
    c += `<circle cx="${f(tc)}" cy="${hb - 45}" r="1.8" fill="${k.ink}"/>`;
    s += c;
    hide([[150, 120, 244, 200], [466, 170, 570, 210]]);

    // ---- Old Town tenements on the left, tall and narrow, smoking
    let ot = '';
    const houses = [[-6, 30, 82, 'gable'], [22, 24, 70, 'pitch'], [44, 28, 90, 'gable'], [70, 26, 76, 'pitch'], [94, 30, 86, 'gable'], [122, 24, 70, 'pitch'], [144, 34, 64, 'pitch']];
    for (const [x, w, h, roof] of houses) ot += k.building(x, 198, w, h, { roof, tone: r() < .5 ? 'mid' : 'light', lit: .4, rh: roof === 'gable' ? 26 : 16 });
    ot += k.shape(k.rect(-5, 184, 184, 14), 'dark', { w: .6 });
    for (const [x, y] of [[14, 106], [80, 112], [134, 120]]) ot += k.shape(k.rect(x, y, 4, 10), 'black', { w: .5 }) + k.smoke(x + 2, y, 1.1, { seed: x });
    s += ot;

    // ---- the square: wet cobbles darkened by rain, puddles holding the pale sky and the dark of what stands over them
    let g = k.shape(k.rect(-5, 198, 650, 47), 'glass', { w: 0, far: true }) + k.line('M-5 198H645', 1.4) + cobbles(198, 242, 5);
    g += k.shape(k.rect(-5, 198, 650, 4), 'dark', { w: 0 });
    // puddles: the pale sky in them, cut by the reflections of the column, the lamps and the passers-by
    const pud = [[112, 236, 140, 14], [262, 221, 90, 9], [386, 230, 130, 12], [544, 219, 84, 8]];
    let pd = '';
    for (const [x, y, w, h] of pud) pd += `M${P(x, y)}q${f(w / 2)} ${-h} ${f(w)} 0q${f(-w / 2)} ${h} ${f(-w)} 0Z`;
    let rf = k.shape(k.rect(-5, 214, 650, 5), 'mid', { w: 0 });
    for (const [x0, x1] of [[181, 199], [168, 212]]) rf += k.shape(k.rect(x0, 222, x1 - x0, 20), x1 - x0 > 20 ? 'dark' : 'black', { w: 0 });
    for (const x of [126, 276, 446, 236]) rf += k.line(`M${x} 216v24`, 1.4);
    for (const x of [300, 316, 372, 388, 452, 588, 612]) rf += k.line(`M${x} 214v26`, 3.2, { op: .7 });
    g += k.shape(pd, 'paper', { w: 0 }) + `<clipPath id="pud-${k.uid}"><path d="${pd}"/></clipPath><g clip-path="url(#pud-${k.uid})">${rf}</g>` + k.shape(pd, 'none', { w: .8 });
    g += k.line('M-5 208Q320 204 645 208M-5 211.5Q320 207.5 645 211.5', .9); // tram rails
    s += g;

    // ---- an electric tram under its wire, its trolley pole up
    const mx = 518, my = 208;
    let tr = k.line(`M-5 150Q320 157 645 150`, .5) + k.line(`M${P(mx + 8, my - 30)}L${P(mx + 40, 153.2)}`, .9);
    tr += k.shape(k.rect(mx - 40, my - 31, 88, 4), 'dark', { w: .8 }) + k.shape(k.rect(mx - 26, my - 35, 60, 4), 'mid', { w: .6 });
    tr += k.shape(k.rect(mx - 38, my - 27, 84, 23), 'mid', { w: 1.1 }) + k.shape(k.rect(mx - 38, my - 12, 84, 8), 'black', { w: .6 });
    tr += k.windows(mx - 27, my - 25, 62, 12, 6, 1, { ww: .72, wh: .8, lit: .9 });
    tr += k.shape(k.rect(mx - 38, my - 27, 9, 23), 'dark', { w: .6 }) + k.shape(k.rect(mx + 37, my - 27, 9, 23), 'dark', { w: .6 });
    tr += `<circle cx="${mx - 18}" cy="${my - 2.4}" r="3.6" fill="${k.ink}"/><circle cx="${mx + 26}" cy="${my - 2.4}" r="3.6" fill="${k.ink}"/>`;
    tr += k.figure(mx + 42, my - 4, .9, 'man') + k.line(`M${P(mx - 30, my + 1)}v14M${P(mx + 30, my + 1)}v14`, 6, { op: .25 });
    s += tr;
    for (const x of [236, 620]) s += k.line(`M${x} 206V146`, 1.2) + k.line(`M${x - 4} 150h8`, .8);

    // ---- Sigismund's Column: steps, railing, tall pedestal, granite shaft, Corinthian capital, the king with cross and sword
    const kx = 190, kb = 228;
    let col = k.shape(k.rect(kx - 40, kb - 7, 80, 7), 'mid', { w: 1.1 }) + k.shape(k.rect(kx - 31, kb - 14, 62, 7), 'light', { w: 1.1 });
    col += k.shape(k.rect(kx - 26, kb - 21, 52, 7), 'dark', { w: 1 });
    col += k.shape(k.rect(kx - 21, 160, 42, kb - 21 - 160), 'vert', { w: 1.3 }) + k.shape(k.rect(kx + 9, 160, 12, kb - 21 - 160), 'dark', { w: .6 });
    col += k.shape(k.rect(kx - 14, 172, 20, 24), 'light', { w: .7 }) + k.shape(k.rect(kx - 25, 154, 50, 6), 'dark', { w: 1 });
    let rail = '';
    for (let x = kx - 46; x <= kx + 46; x += 5) rail += `M${P(x, kb + 1)}v-11`;
    col += k.line(rail, .7) + k.line(`M${P(kx - 46, kb - 8)}h92M${P(kx - 46, kb - 4)}h92`, .9);
    col += k.shape(k.rect(kx - 11, 147, 22, 7), 'mid', { w: 1 });
    col += k.shape(k.poly([[kx - 7.6, 147], [kx - 6.4, 52], [kx + 6.4, 52], [kx + 7.6, 147]]), 'vert', { w: 1.4 })
      + k.shape(k.poly([[kx + 2.2, 147], [kx + 2, 52], [kx + 6.4, 52], [kx + 7.6, 147]]), 'dark', { w: .5 });
    col += k.shape(`M${P(kx - 7, 52)}q-5 -5 -7 -12h28q-2 7 -7 12Z`, 'dark', { w: 1.1 }) + k.line(`M${P(kx - 9, 46)}q-3 -2 -4 -5M${P(kx + 9, 46)}q3 -2 4 -5M${P(kx, 50)}v-9`, .7);
    col += k.shape(k.rect(kx - 15, 37, 30, 4), 'mid', { w: 1 });
    // the king: armoured, a mantle falling to the right, crowned; the great cross raised high, the sword lowered
    col += k.shape(`M${P(kx - 6.5, 37)}l1.4 -15q.4 -5 5.1 -5.6q4.7 .6 5.1 5.6l1.4 15Z`, 'dark', { w: .9 });
    col += k.shape(`M${P(kx + 2, 18)}q6 2 6.6 19h-4q-.6 -12 -2.6 -16Z`, 'black', { w: .5 });
    col += `<circle cx="${f(kx)}" cy="13.6" r="3.2" fill="${k.ink}"/>` + k.line(`M${P(kx - 2.8, 10.6)}l.8 -2.6.9 1.5.9 -2.2.9 2.2.9 -1.5.8 2.6`, .8);
    col += k.line(`M${P(kx - 4, 22)}l-5 -7M${P(kx - 9, 32)}V-2M${P(kx - 13.5, 5)}h9`, 1.6) + k.line(`M${P(kx + 4, 26)}l5 10`, 1.3);
    s += col;

    // ---- the droshky: a cabman in his long coat, one horse under the wooden duga
    const dx = 62, dy = 238, ds = 1.5, D = (a, b) => P(dx + a * ds, dy + b * ds);
    let dr = k.figure(dx + 7 * ds, dy - 12 * ds, ds, 'man');
    dr += k.shape(`M${D(-15, -9)}q0 -10 10 -10h14l5 -6h3.4l-3 9q-2 7 -10 7h-19Z`, 'black', { w: .9 });
    for (const [a, rr] of [[-8, 8.5], [17, 6.5]]) {
      dr += `<circle cx="${f(dx + a * ds)}" cy="${f(dy - rr * ds)}" r="${f(rr * ds)}" fill="none" stroke="${k.ink}" stroke-width="1.7"/>`;
      let sp = '';
      for (let i = 0; i < 4; i++) { const q = i * Math.PI / 4; sp += `M${D(a - Math.cos(q) * rr, -rr - Math.sin(q) * rr)}L${D(a + Math.cos(q) * rr, -rr + Math.sin(q) * rr)}`; }
      dr += k.line(sp, .6);
    }
    dr += k.line(`M${D(22, -12)}L${D(45, -13)}`, 1.3) + horse(dx + 47 * ds, dy, ds * 1.05, 1, 'black');
    dr += k.line(`M${D(43, -11)}Q${D(41, -28)} ${D(46, -31)}`, 3) + k.line(`M${D(43.2, -12)}Q${D(41.4, -27.4)} ${D(45.8, -30.2)}`, .9, { color: k.paper });
    s += dr;

    // ---- people: a gendarme, porters, women in shawls, a priest; gas lamps; their reflections in the wet
    let refl = '';
    for (const [x, y, sc, kind] of [[300, 218, 1.15, 'soldier'], [316, 220, 1.2, 'porter'], [372, 234, 1.45, 'woman'], [388, 236, 1.5, 'man'],
      [588, 238, 1.55, 'porter'], [612, 234, 1.4, 'woman'], [256, 212, .9, 'priest'], [452, 214, 1, 'woman']]) {
      refl += k.line(`M${P(x, y + 1.5)}v${f(9 * sc)}`, f(2.2 * sc), { op: .4 });
      s += k.figure(x, y, sc, kind);
    }
    for (const x of [126, 276, 446]) { s += k.lamp(x, 216, 1.2); refl += k.line(`M${P(x, 218)}v12`, 1.3, { op: .45 }); }
    return s + refl;
  },
};
