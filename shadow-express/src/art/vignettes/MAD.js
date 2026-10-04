// Madrid: noon in the Plaza de la Independencia, from the Retiro gate. The Puerta de Alcalá stands square to us, right of
// centre: five openings, black under the hard sun, the attic and its crown of arms and trophies, its shadow thrown across
// the dust. Far off on the left the Royal Palace rides its ridge above the roofs, the Guadarrama behind. A water-seller,
// the Guardia Civil in tricorns, a mule cart with its tilt, a lady with her fan.

export default {
  id: 'MAD',
  draw(k) {
    const f = k.f, r = k.rng(83);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    const horse = (x, y, s, dir = 1, tone = 'dark', mule = false) => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, f(1.25 * s)) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, f(1.3 * s)) + k.shape(body, tone, { w: .6 })
        + (mule ? k.line(`M${Q(10.2, -23)}L${Q(8.6, -28.5)}M${Q(10.8, -22.8)}L${Q(11.4, -28.4)}`, f(1.2 * s)) : '');
    };

    // ---- far: the Guadarrama, the ridge and the Royal Palace on it, the roofs falling toward us
    let s = k.mountains(140, { h: 30, seed: 6, snow: false });
    s += k.shape('M-5 150Q60 136 140 138Q220 140 300 152L330 168H-5Z', 'stipple', { far: true, w: .6 });
    // the palace: long and square, a balustrade with statues, its central frontispiece with the clock and the bells
    let pa = k.shape(k.rect(26, 112, 190, 30), 'light', { far: true, w: .8 }) + k.shape(k.rect(26, 136, 190, 8), 'mid', { far: true, w: .5 });
    for (let x = 30; x < 214; x += 6) pa += k.line(`M${x} 114v22`, .5, { far: true });
    pa += k.windows(28, 116, 186, 18, 26, 2, { far: true, lit: .5, ww: .35 });
    pa += k.shape(k.rect(26, 108, 190, 4), 'mid', { far: true, w: .5 });
    let stat = '';
    for (let x = 30; x < 214; x += 8) stat += `M${x} 108v-4`;
    pa += k.line(stat, 1, { far: true });
    pa += k.shape(k.rect(104, 98, 34, 14), 'light', { far: true, w: .7 }) + k.shape(k.gable(102, 98, 38, 8), 'mid', { far: true }) + k.shape(k.rect(114, 86, 14, 12), 'light', { far: true, w: .6 }) + k.shape(k.dome(121, 86, 7, 6), 'mid', { far: true });
    pa += `<circle cx="121" cy="104" r="3" fill="${k.paper}" stroke="${k.sepia}" stroke-width=".6"/>`;
    for (const x of [26, 196]) pa += k.shape(k.rect(x, 104, 20, 40), 'vert', { far: true, w: .7 });
    s += pa + k.shape('M-5 144H230L250 158H-5Z', 'stipple', { far: true, w: 0 });
    // the city falling toward the plaza: roofs, domes and a few towers in the heat haze
    s += k.skyline(-5, 330, 186, { seed: 84, hMin: 14, hMax: 34, wMin: 14, wMax: 28, style: 'south', lit: .4 });
    s += k.shape(k.rect(236, 140, 20, 34), 'light', { far: true }) + k.shape(k.dome(246, 140, 12, 12), 'mid', { far: true }) + k.shape(k.spire(246, 125, 3, 10), 'mid', { far: true });
    s += k.haze(150, 40, .3);

    // ---- the Calle de Alcalá's palaces on the left, nearer, sun on their fronts
    let ca = '';
    for (const [x, w, h] of [[-6, 54, 64], [48, 46, 54], [94, 50, 60], [144, 40, 46]]) {
      ca += k.building(x, 200, w, h, { roof: 'flat', tone: 'paper', lit: .45, floors: 4 }) + k.shape(k.rect(x, 200 - h, w, 3), 'black', { w: 0 });
      ca += k.shape(k.rect(x, 186, w, 14), 'dark', { w: .6 }) + k.line(`M${P(x - 2, 200 - h + 3)}h${f(w + 4)}`, 1.4);
      for (let i = 1; i < 4; i++) ca += k.line(`M${P(x + 3, 200 - h + i * (h - 14) / 4 + 5)}h${f(w - 6)}`, .9);
    }
    for (const [x, y] of [[30, 136], [118, 140], [166, 154]]) ca += k.shape(k.rect(x - 2, y - 8, 4, 9), 'black', { w: .5 }) + k.smoke(x, y - 8, 1, { seed: x });
    ca += k.tree(196, 202, 1.5, 'round') + k.tree(226, 202, 1.3, 'round') + k.tree(258, 200, 1.1, 'round');
    s += ca;
    hide([[-5, 130, 340, 200]]);

    // ---- the Puerta de Alcalá
    const L = 314, R = 610, B = 202, C = 120, cx = (L + R) / 2, W = R - L;
    let g = k.shape(k.rect(L, C, W, B - C), 'paper', { w: 1.5 });
    g += k.shape(k.rect(L, B - 10, W, 10), 'mid', { w: .9 }); // plinth
    // five openings: rectangular at the ends, three round arches; columns between them
    const bays = [[.035, .16, 'rect'], [.21, .35, 'arch'], [.415, .585, 'arch'], [.65, .79, 'arch'], [.84, .965, 'rect']];
    for (const [a, b, kind] of bays) {
      const x0 = L + W * a, x1 = L + W * b, w = x1 - x0, big = kind === 'arch' && a > .4;
      if (kind === 'rect') g += k.shape(k.rect(x0, B - 44, w, 44), 'black', { w: 1 }) + k.shape(k.rect(x0 - 3, B - 50, w + 6, 6), 'mid', { w: .7 });
      else {
        const h = big ? 64 : 54;
        g += k.shape(k.arch(x0, B - h, w, h), 'black', { w: 1.1 });
        g += k.line(`M${P(x0 - 3, B - h + w / 2)}h${f(w + 6)}`, .8);
        // the keystone and the voussoirs
        g += k.shape(k.rect(x0 + w / 2 - 3, B - h - 3, 6, 8), 'light', { w: .7 });
        for (let i = 1; i < 6; i++) { const q = Math.PI * i / 6; g += k.line(`M${P(x0 + w / 2 - Math.cos(q) * w / 2, B - h + w / 2 - Math.sin(q) * w / 2)}l${f(-Math.cos(q) * 4)} ${f(-Math.sin(q) * 4)}`, .7); }
      }
    }
    // columns, with their Ionic capitals, on the piers between the openings
    for (const t of [.003, .185, .385, .615, .815, .997]) {
      const x = L + W * t;
      for (const dx of [-7, 3]) {
        g += k.shape(k.rect(x + dx, C + 4, 5, B - C - 14), 'paper', { w: .9 }) + k.shape(k.rect(x + dx + 3, C + 4, 2, B - C - 14), 'black', { w: 0 }) + k.shape(k.rect(x + dx + 5, C + 4, 2, B - C - 14), 'mid', { w: 0 });
        g += k.line(`M${P(x + dx - 1.4, C + 7)}q-1.6 -2 0 -3h7.8q1.6 1 0 3`, .8);
      }
    }
    // entablature and cornice
    g += k.shape(k.rect(L - 4, C - 10, W + 8, 10), 'light', { w: 1.1 }) + k.shape(k.rect(L - 7, C - 14, W + 14, 4), 'dark', { w: 1 }) + k.shape(k.rect(L, C, W, 4), 'black', { w: 0 });
    // the attic over the three arches, the crown of arms over the middle, trophies at the corners
    const a0 = L + W * .2, a1 = L + W * .8;
    g += k.shape(k.rect(a0, C - 40, a1 - a0, 26), 'paper', { w: 1.3 }) + k.shape(k.rect(a0 - 3, C - 43, a1 - a0 + 6, 3.4), 'dark', { w: .9 }) + k.shape(k.rect(a0, C - 39.6, a1 - a0, 3), 'black', { w: 0 });
    g += k.shape(k.rect(cx - 30, C - 34, 60, 15), 'paper', { w: .7 });
    g += k.shape(`M${P(cx - 44, C - 43)}L${P(cx - 40, C - 58)}Q${P(cx, C - 82)} ${P(cx + 40, C - 58)}L${P(cx + 44, C - 43)}Z`, 'paper', { w: 1.3 }) + k.shape(`M${P(cx + 20, C - 43)}L${P(cx + 22, C - 66)}Q${P(cx + 34, C - 62)} ${P(cx + 40, C - 58)}L${P(cx + 44, C - 43)}Z`, 'mid', { w: 0 });
    g += k.shape(`M${P(cx - 9, C - 47)}q0 -14 9 -18q9 4 9 18q-9 4 -18 0Z`, 'mid', { w: .9 }) + k.shape(k.onion(cx, C - 64, 10, 9), 'dark', { w: .7 }) + k.line(`M${P(cx, C - 73)}v-5`, 1);
    // the reclining figures beside the arms
    g += k.shape(`M${P(cx - 34, C - 50)}q6 -8 14 -9q4 -6 8 -2q-2 6 -8 10q-6 3 -14 1Z`, 'dark', { w: .7 }) + k.shape(`M${P(cx + 34, C - 50)}q-6 -8 -14 -9q-4 -6 -8 -2q2 6 8 10q6 3 14 1Z`, 'dark', { w: .7 });
    for (const x of [a0 + 6, a1 - 6, L + 8, R - 8]) {
      const y = x === L + 8 || x === R - 8 ? C - 14 : C - 43;
      g += k.shape(`M${P(x - 6, y)}q0 -8 3 -12q-2 -4 3 -6q5 2 3 6q3 4 3 12Z`, 'dark', { w: .8 }) + k.line(`M${P(x - 5, y - 13)}l10 -4M${P(x + 5, y - 13)}l-10 -4`, .9);
    }
    // shade: the right return of the gate and the attic, deep in the noon glare
    g += k.shape(k.rect(R - 14, C, 14, B - C), 'dark', { w: .5 }) + k.shape(k.rect(a1 - 10, C - 40, 10, 26), 'dark', { w: .4 });

    // ---- the plaza: hard light, the gate's shadow thrown across the dust, the Retiro's railing and trees on the right
    let gr = k.shape(k.rect(-5, 200, 650, 45), 'paper', { w: 0 }) + k.line('M-5 200H645', 1.3);
    let dust = '';
    for (let i = 0; i < 50; i++) { const y = 204 + r() * 34, x = r() * 640; dust += `M${P(x, y)}h${f(3 + r() * 12 * (y - 198) / 20)}`; }
    gr += k.line(dust, .5);
    gr += k.shape(`M${P(L + 30, B)}H${f(R + 10)}L${P(R + 60, B + 18)}H${f(L + 60)}Z`, 'black', { w: 0, op: .78 });
    for (const [a, b] of [[.21, .35], [.415, .585], [.65, .79]]) gr += k.shape(`M${P(L + W * a + 34, B + 6)}h${f(W * (b - a))}l3 4h${f(-W * (b - a))}Z`, 'paper', { w: 0, op: .55 });
    s += gr + g;
    // the Retiro: railing on its stone kerb, a chestnut's dark mass at the right edge
    let rt = k.shape(k.rect(-5, 214, 140, 4), 'light', { w: .8 });
    let rail = '';
    for (let x = -4; x < 136; x += 4) rail += `M${x} 214v-12`;
    rt += k.line(rail, .7) + k.line('M-5 203H136', 1);
    rt += k.line('M612 240V170', 4) + k.shape('M560 150a40 34 0 1 1 90 6q-10 26 -46 22q-40 0 -44 -28Z', 'dark', { w: .9 }) + k.shape('M566 146a32 26 0 1 1 64 2q-12 16 -34 14q-26 -2 -30 -16Z', 'stipple', { w: 0 });
    s += rt;

    // ---- life: a water-seller with his jar, two Guardia Civil in tricorns, a mule cart under its tilt, a lady and her fan
    let lf = '';
    lf += k.figure(96, 236, 1.6, 'porter') + k.shape('M104 206q6 -2 8 3q1 6 -4 7q-6 0 -6 -6Z', 'mid', { w: .8 });
    for (const x of [218, 232]) lf += k.figure(x, 228, 1.4, 'soldier') + k.shape(`M${P(x - 4.6, 228 - 30.4)}q4.6 -4 9.2 0q-4.6 2 -9.2 0Z`, 'ink', { w: 0 });
    lf += k.figure(470, 238, 1.6, 'woman') + k.line('M476 212l6 -3', 1.4) + k.shape('M480 206q4 -2 6 3l-6 1Z', 'mid', { w: .5 });
    lf += k.figure(500, 236, 1.55, 'man') + k.figure(290, 214, 1.1, 'priest');
    // the cart: two wheels, a hooped canvas tilt, the mule ahead, the carter walking
    const tx = 340, ty = 232;
    lf += k.shape(`M${P(tx - 30, ty - 14)}h50v-5h-50Z`, 'dark', { w: .8 }) + k.shape(`M${P(tx - 32, ty - 19)}C${P(tx - 32, ty - 44)} ${P(tx + 22, ty - 44)} ${P(tx + 22, ty - 19)}Z`, 'light', { w: 1.1 }) + k.shape(`M${P(tx + 8, ty - 19)}C${P(tx + 10, ty - 36)} ${P(tx + 16, ty - 38)} ${P(tx + 22, ty - 32)}L${P(tx + 22, ty - 19)}Z`, 'dark', { w: 0 });
    let hoops = '';
    for (const d of [-20, -6, 8]) hoops += `M${P(tx + d, ty - 19)}q0 -14 2 -17`;
    lf += k.line(hoops, .6) + `<circle cx="${tx - 6}" cy="${ty - 9}" r="9" fill="none" stroke="${k.ink}" stroke-width="1.6"/>` + k.line(`M${P(tx - 15, ty - 9)}h18M${P(tx - 6, ty - 18)}v18`, .6);
    lf += k.line(`M${P(tx + 20, ty - 14)}L${P(tx + 42, ty - 12)}`, 1.1) + horse(tx + 52, ty, 1.35, 1, 'dark', true) + k.figure(tx + 76, ty + 2, 1.45, 'man');
    // shadows to the right
    let sh = '';
    for (const [x, y, sc] of [[96, 236, 1.6], [218, 228, 1.4], [232, 228, 1.4], [470, 238, 1.6], [500, 236, 1.55], [416, 234, 1.45], [334, 232, 2]]) sh += `M${P(x, y)}l${f(18 * sc)} 2l-2 1.6l${f(-17 * sc)} -1.8Z`;
    lf += k.shape(sh, 'black', { w: 0, op: .7 });
    lf += k.lamp(150, 216, 1.3) + k.lamp(560, 222, 1.3);
    s += lf;
    return s;
  },
};
