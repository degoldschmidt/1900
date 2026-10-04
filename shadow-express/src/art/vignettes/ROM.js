// Rome: from the Oppian slope among the ruins, above the road. The Colosseum fills the right of centre, its oval wall
// curving away in three orders of arches and the attic; toward the left the outer ring is broken off in a jagged stair
// down to the brick buttress, and the lower inner ring stands beyond it. Far off, framed by a brick ruin and an umbrella
// pine, St Peter's dome rides over the roofs. Goats and their goatherd, a painter at his easel, a friar; hard sun.

export default {
  id: 'ROM',
  draw(k) {
    const f = k.f, r = k.rng(101);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const D2R = Math.PI / 180;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    const horse = (x, y, s, dir = 1, tone = 'dark') => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, f(1.25 * s)) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, f(1.3 * s)) + k.shape(body, tone, { w: .6 });
    };
    const goat = (x, y, s2, dir = 1, tone = 'dark') => {
      const Q = (a, b) => `${f(x + a * s2 * dir)} ${f(y + b * s2)}`;
      return k.line(`M${Q(-5, -5)}L${Q(-5.4, 0)}M${Q(-3, -5)}L${Q(-2.6, 0)}M${Q(3, -5)}L${Q(3.2, 0)}M${Q(5, -5)}L${Q(5.6, 0)}`, f(1.1 * s2))
        + k.shape(`M${Q(-7, -6)}Q${Q(-7, -10)} ${Q(-3, -10)}L${Q(4, -10)}L${Q(6, -13)}L${Q(9, -12.4)}L${Q(9.6, -9.6)}L${Q(7, -8.8)}L${Q(6, -6)}Q${Q(0, -4)} ${Q(-7, -6)}Z`, tone, { w: .5 })
        + k.line(`M${Q(6.4, -12.6)}q-1 -3 -3.4 -4M${Q(8.6, -9.4)}l.2 2.4M${Q(-7, -8.4)}l-1.6 -2`, f(.8 * s2));
    };

    // ---- far: the city's roofs and campanili, St Peter's dome with its two small cupolas
    let s = k.shape('M-5 160Q60 148 120 152T260 156V180H-5Z', 'stipple', { far: true, w: .6 });
    s += k.skyline(-5, 230, 180, { seed: 102, hMin: 8, hMax: 22, wMin: 12, wMax: 22, style: 'south', lit: .35 });
    const sp = 146, sb = 152;
    let pe = k.shape(k.rect(sp - 34, sb, 68, 14), 'light', { far: true, w: .7 }) + k.shape(k.gable(sp - 12, sb, 24, 6), 'mid', { far: true });
    pe += k.shape(k.rect(sp - 18, sb - 12, 36, 12), 'light', { far: true, w: .8 });
    for (let x = sp - 16; x < sp + 17; x += 4) pe += k.line(`M${x} ${sb - 11}v10`, .5, { far: true });
    pe += k.shape(`M${P(sp - 18, sb - 12)}C${P(sp - 18, sb - 34)} ${P(sp - 4, sb - 38)} ${P(sp, sb - 39)}C${P(sp + 4, sb - 38)} ${P(sp + 18, sb - 34)} ${P(sp + 18, sb - 12)}Z`, 'light', { far: true, w: 1 });
    pe += k.line(`M${P(sp - 9, sb - 12)}Q${P(sp - 9, sb - 30)} ${P(sp - 1, sb - 38)}M${P(sp + 7, sb - 12)}Q${P(sp + 8, sb - 30)} ${P(sp + 1, sb - 38)}`, .5, { far: true });
    pe += k.shape(`M${P(sp + 4, sb - 12)}C${P(sp + 8, sb - 26)} ${P(sp + 6, sb - 34)} ${P(sp, sb - 39)}C${P(sp + 4, sb - 38)} ${P(sp + 18, sb - 34)} ${P(sp + 18, sb - 12)}Z`, 'mid', { far: true, w: 0 });
    pe += k.shape(k.rect(sp - 3, sb - 46, 6, 7), 'light', { far: true, w: .6 }) + k.shape(k.spire(sp, sb - 46, 5, 5), 'mid', { far: true }) + k.line(`M${P(sp, sb - 51)}v-4M${P(sp - 1.6, sb - 53.4)}h3.2`, .6, { far: true });
    for (const x of [sp - 28, sp + 28]) pe += k.shape(k.dome(x, sb, 6, 6), 'mid', { far: true }) + k.line(`M${P(x, sb - 8)}v-3`, .5, { far: true });
    s += pe + k.haze(140, 44, .3);
    hide([[176, 0, 645, 240], [-5, 120, 100, 240]]);

    // ---- the Colosseum: an elliptical wall seen from without, the bays foreshortened as it curves away
    const cx = 382, A = 222, th0 = -72, th1 = 85.5, dth = 4.5;
    const X = (t) => cx + A * Math.sin(t * D2R);
    const YB = (t) => 196 + 14 * Math.cos(t * D2R);         // the base, nearest in the middle
    const YT = (t) => 40 - 30 * Math.cos(t * D2R);           // the attic's top, highest where nearest
    const Y = (t, h) => YB(t) + (YT(t) - YB(t)) * h;         // h: 0 at the base, 1 at the top
    const tone = (t) => (t < -4 ? 'light' : t < 34 ? 'mid' : 'dark');
    // how many of the four storeys still stand in each bay: the outer ring is broken toward the left
    const stand = (t) => (t >= -16 ? 4 : t >= -21 ? 3.4 : t >= -26 ? 2.7 : t >= -31 ? 2 : t >= -35 ? 1.2 : 0);
    const lv = [0, .22, .47, .71, 1];
    const hAt = (n) => (n >= 4 ? 1 : lv[Math.floor(n)] + (lv[Math.ceil(n)] - lv[Math.floor(n)]) * (n - Math.floor(n)));

    // the inner ring, lower and darker, standing where the outer ring has fallen
    const Ai = A * .84, Xi = (t) => cx + Ai * Math.sin(t * D2R), YBi = (t) => 190 + 6 * Math.cos(t * D2R), YTi = (t) => 86 - 14 * Math.cos(t * D2R);
    let inner = '';
    for (let t = -76; t < -12; t += dth) {
      const xa = Xi(t), xb = Xi(t + dth), top = YTi(t) + (r() * 12) + (t < -50 ? (-50 - t) * .9 : 0);
      inner += k.shape(k.poly([[xa, YBi(t)], [xa, top], [xb, top + (r() * 6 - 3)], [xb, YBi(t + dth)]]), 'mid', { w: .9 });
      const w = xb - xa;
      for (const [h0, h1] of [[0, .45], [.52, .9]]) {
        const yb = YBi(t) + (top - YBi(t)) * h0, yt = YBi(t) + (top - YBi(t)) * h1;
        if (yt > top - 1) inner += k.shape(k.arch(xa + w * .18, yt, w * .64, yb - yt), 'black', { w: .6 });
      }
    }
    s += inner;

    // the outer wall, bay by bay, storey by storey
    let c = '';
    for (let t = th0; t < th1; t += dth) {
      const tm = t + dth / 2, n = stand(tm);
      if (n <= 0) continue;
      const xa = X(t), xb = X(Math.min(t + dth, 89.9)), w = xb - xa, hTop = hAt(n);
      c += k.shape(k.poly([[xa, YB(t)], [xa, Y(t, hTop)], [xb, Y(t + dth, hTop)], [xb, YB(t + dth)]]), tone(tm), { w: .9 });
      for (let sIdx = 0; sIdx < Math.min(3, Math.ceil(n)); sIdx++) {
        const h0 = lv[sIdx], h1 = Math.min(lv[sIdx + 1], hTop);
        if (h1 - h0 < .08) continue;
        const yb = Y(tm, h0), yt = Y(tm, h0 + (lv[sIdx + 1] - h0) * .78);
        // the arch, black inside; a half-column on its left pier
        if (Y(tm, h1) < yt + 2) c += k.shape(k.arch(xa + w * .2, yt, w * .6, yb - yt), 'black', { w: .7 });
        c += k.shape(k.rect(xa - w * .05, Y(tm, h1), w * .12, yb - Y(tm, h1)), tm < 34 ? 'vert' : 'dark', { w: .6 });
        if (h1 >= lv[sIdx + 1] - .001) c += k.line(`M${P(xa, Y(t, lv[sIdx + 1]))}L${P(xb, Y(t + dth, lv[sIdx + 1]))}`, 1.4) + k.line(`M${P(xa, Y(t, lv[sIdx + 1] - .035))}L${P(xb, Y(t + dth, lv[sIdx + 1] - .035))}`, .7);
      }
      if (n >= 4) { // the attic: pilasters, square windows in every other bay, the corbels near the top, the cornice
        const ya = Y(tm, .71), yt = Y(tm, 1);
        c += k.shape(k.rect(xa - w * .04, yt, w * .1, ya - yt), tm < 34 ? 'vert' : 'dark', { w: .5 });
        if (Math.round((t - th0) / dth) % 2) c += k.shape(k.rect(xa + w * .38, Y(tm, .8), w * .24, Y(tm, .74) - Y(tm, .8)), 'black', { w: .5 });
        c += k.shape(k.rect(xa + w * .3, Y(tm, .93), w * .1, 2.4), 'ink', { w: 0 }) + k.shape(k.rect(xa + w * .7, Y(tm, .93), w * .1, 2.4), 'ink', { w: 0 });
        c += k.line(`M${P(xa, Y(t, 1))}L${P(xb, Y(t + dth, 1))}`, 1.8);
      }
    }
    // the far end where the wall turns away from us, edge-on
    c += k.line(`M${P(X(89.9), YB(89.9))}L${P(X(89.9), YT(89.9))}`, 1.6);
    // the broken end: weathered stair of masonry and the sloping brick buttress that holds it
    const tb = -35, xbE = X(tb);
    c += k.shape(k.poly([[xbE - 18, YB(tb) + 2], [xbE, Y(tb, .3)], [X(-31), Y(-31, .47)], [X(-31), YB(-31)]]), 'brick', { w: 1.1 });
    let rag = '';
    for (const [t, h] of [[-31, .47], [-26, .62], [-21, .82], [-16, .99]]) rag += `M${P(X(t), Y(t, h))}l${f(-2 - r() * 3)} ${f(-3 - r() * 3)}l${f(3 + r() * 2)} -2`;
    c += k.line(rag, 1.2);
    for (const [x, y] of [[X(-26), Y(-26, .62)], [X(-21), Y(-21, .82)], [X(-31), Y(-31, .47)]]) c += k.shape(`M${P(x - 4, y + 2)}q2 -6 5 -3q3 -4 5 1q-4 3 -10 2Z`, 'stipple', { w: .5 });
    // soot and weather on the lowest storey
    c += k.shape(`M${P(X(-31), YB(-31))}` + [...Array(25)].map((_, i) => { const t = Math.min(-31 + i * 5, 89.9); return `L${P(X(t), Y(t, .06))}`; }).join('') + `L${P(X(89.9), YB(89.9))}Z`, 'black', { w: 0, op: .35 });
    s += c;

    // ---- the road at its foot: a cab trotting past, a few walkers
    let rd = k.shape('M-5 206Q300 198 645 206V218Q300 210 -5 220Z', 'paper', { w: .9 });
    rd += horse(262, 214, .7, 1, 'dark') + k.shape('M226 206q2 -8 10 -8h10l3 -4h2l-2 6q-2 6 -8 6Z', 'black', { w: .6 }) + `<circle cx="232" cy="210" r="4.4" fill="none" stroke="${k.ink}" stroke-width="1"/>`;
    rd += k.figure(330, 212, .8, 'man') + k.figure(340, 213, .8, 'woman') + k.figure(560, 212, .8, 'soldier');
    s += rd;

    // ---- the Oppian slope: a brick ruin of the baths on the left, umbrella pines, tufa and scrub
    const pine = (x, y, h, w, lean) => k.line(`M${P(x, y)}q${f(lean * .4)} ${f(-h * .5)} ${f(lean)} ${f(-h)}`, 3.2)
      + k.shape(`M${P(x + lean - w / 2, y - h)}q${f(w * .1)} ${f(-w * .2)} ${f(w * .35)} ${f(-w * .22)}q${f(w * .15)} ${f(-w * .1)} ${f(w * .3)} 0q${f(w * .2)} ${f(-w * .02)} ${f(w * .35)} ${f(w * .22)}q${f(-w * .4)} ${f(w * .12)} ${f(-w)} 0Z`, 'dark', { w: .9 })
      + k.shape(`M${P(x + lean - w * .42, y - h - 3)}q${f(w * .1)} ${f(-w * .16)} ${f(w * .33)} ${f(-w * .18)}q${f(w * .15)} ${f(-w * .08)} ${f(w * .28)} 0q${f(-w * .2)} ${f(w * .12)} ${f(-w * .61)} ${f(w * .18)}Z`, 'stipple', { w: 0 });
    let fg = k.shape('M-5 214Q160 206 330 218T645 222V245H-5Z', 'paper', { w: 1.1 });
    let tuft = '';
    for (let i = 0; i < 52; i++) { const y = 220 + r() * 20, x = r() * 640; tuft += `M${P(x, y)}l1.4 -4l1.2 4l1.6 -3.4l.8 3.4`; }
    fg += k.line(tuft, .6) + k.shape('M-5 226Q200 218 420 228T645 232V236Q420 232 200 224T-5 238Z', 'stipple', { w: 0, op: .6 });
    // the ruin: a wall of thin Roman brick with a great relieving arch, scrub on its broken top
    fg += k.shape('M-5 240V132L10 128L18 138L30 126L46 134L58 124L70 140L84 150L90 240Z', 'brick', { w: 1.3 }) + k.shape('M70 140L84 150L90 240H66Z', 'dark', { w: .5 });
    fg += k.shape(k.arch(14, 168, 42, 72), 'black', { w: 1.1 }) + k.line('M10 168h50M12 165h46', 1);
    for (const [x, y] of [[16, 130], [40, 128], [62, 130]]) fg += k.shape(`M${P(x - 6, y + 2)}q2 -7 6 -4q4 -5 6 1q-5 4 -12 3Z`, 'stipple', { w: .5 });
    // an osteria under the far pine: tiled roof, a vine pergola, its door and window lit at night
    fg += k.shape(k.rect(588, 198, 60, 26), 'light', { w: 1 }) + k.shape(k.rect(630, 198, 18, 26), 'dark', { w: .5 }) + k.shape(k.poly([[584, 198], [594, 188], [650, 188], [650, 198]]), 'tiles', { w: .9 });
    fg += k.windows(592, 204, 34, 16, 2, 1, { lit: 1, ww: .5, wh: .9 }) + k.line('M560 224V204M574 224V204M558 204H590', 1) + k.shape('M556 204q8 -6 16 -2q10 -5 18 2Z', 'stipple', { w: .5 });
    fg += pine(104, 238, 166, 120, 16) + pine(622, 222, 136, 80, -10);
    s += fg;
    hide([[-5, 0, 645, 120]]);

    // ---- life on the slope: goats and their goatherd, a painter under his parasol at the easel, a friar, travellers
    let lf = goat(160, 232, 1.5, 1, 'light') + goat(188, 236, 1.6, -1, 'dark') + goat(214, 230, 1.4, 1, 'mid') + goat(140, 238, 1.7, 1, 'dark');
    lf += k.figure(246, 236, 1.6, 'man') + k.line('M252 236l6 -38', 1.4) + k.shape('M240 208q6 -4 12 0l2 10h-16Z', 'dark', { w: .5 });
    const ex = 470, ey = 238;
    lf += k.line(`M${P(ex - 30, ey)}V${f(ey - 50)}`, 1) + k.shape(`M${P(ex - 54, ey - 46)}q24 -18 48 0q-24 -6 -48 0Z`, 'light', { w: .9 });
    lf += k.figure(ex - 22, ey, 1.6, 'man') + k.line(`M${P(ex - 6, ey)}L${P(ex, ey - 32)}L${P(ex + 6, ey)}M${P(ex, ey - 32)}L${P(ex + 1.6, ey)}`, 1) + k.shape(k.rect(ex - 8, ey - 34, 16, 13), 'light', { w: .9 }) + k.line(`M${P(ex - 6, ey - 26)}q4 -4 8 -1q2 -3 4 0`, .6);
    lf += k.figure(368, 236, 1.55, 'priest') + k.figure(560, 238, 1.6, 'woman') + k.figure(578, 236, 1.55, 'man');
    let sh = '';
    for (const [x, y, sc] of [[246, 236, 1.6], [368, 236, 1.55], [448, 238, 1.6], [560, 238, 1.6], [578, 236, 1.55], [160, 232, .8], [188, 236, .8], [214, 230, .7]]) sh += `M${P(x, y)}l${f(18 * sc)} 2l-2 1.6l${f(-17 * sc)} -1.8Z`;
    lf += k.shape(sh, 'black', { w: 0, op: .7 });
    s += lf;
    return s;
  },
};
