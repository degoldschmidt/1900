// Zurich: from the Polytechnikum terrace, high above the old town. Below, the steep roofs of the Niederdorf smoke;
// the Grossmünster's twin towers with their domed caps rise from them against the lake; the Limmat leaves the lake on
// the right under the Fraumünster's needle and St Peter's great clock; the snow wall of the Alps closes the horizon.
// A lime tree frames the left; on the balustrade, a telescope, a governess, a student.

export default {
  id: 'ZUR',
  draw(k) {
    const f = k.f;
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    const blob = (cx, cy, rx, ry, n = 9) => {
      let d = '';
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, rr = Math.max(rx, ry) * 2.8 / n; d += i ? `A${f(rr)} ${f(rr)} 0 0 1 ${P(x, y)}` : `M${P(x, y)}`; }
      return d + 'Z';
    };
    // a mountain range: peaks, a ragged snowfield on each, the flank away from the light in shade
    const range = (y, h, seed, x0 = -10) => {
      const q = k.rng(seed);
      let d = `M-5 ${y}`, snow = '', shade = '', x = x0;
      while (x < 650) {
        const w = 40 + q() * 60, hh = h * (.5 + q() * .6), px = x + w * (.38 + q() * .24), py = y - hh, ex = x + w, ey = y - q() * h * .22;
        d += `L${P(px, py)}L${P(ex, ey)}`;
        const t = .34 + q() * .14, sy = py + (y - py) * t, lx = px - (px - x) * t, rx = px + (ex - px) * Math.min(1, (sy - py) / Math.max(1, ey - py));
        snow += `M${P(px, py)}L${P(rx, sy)}L${P(px + (rx - px) * .55, sy - 4)}L${P(px + 1, sy + 3)}L${P(px - (px - lx) * .5, sy - 3)}L${P(lx, sy)}Z`;
        shade += `M${P(px, py)}L${P(ex, ey)}L${P(ex - (ex - px) * .2, y)}L${P(px + (ex - px) * .15, y)}Z`;
        x = ex;
      }
      return { d: d + `L645 ${y}Z`, snow, shade };
    };
    // a town house seen from above: wall with windows, and a roof whose slope away from the light is dark
    const house = (x, by, w, h, gable, wallTone) => {
      let o = k.shape(k.rect(x, by - h, w, h), wallTone, { w: .9 }) + k.windows(x + 2, by - h + 3, w - 4, h - 5, Math.max(1, Math.round(w / 9)), Math.max(1, Math.round(h / 11)), { lit: .35 });
      if (gable) {
        const rh = w * .48, d = w * .3;
        o += k.shape(k.poly([[x + w / 2, by - h - rh], [x + w / 2 + d, by - h - rh - d * .3], [x + w + d, by - h - d * .3], [x + w, by - h]]), 'dark', { w: .9 });
        o += k.shape(k.poly([[x - 1, by - h], [x + w / 2, by - h - rh], [x + w + 1, by - h]]), wallTone === 'light' ? 'vert' : 'mid', { w: 1 });
        o += k.shape(k.rect(x + w / 2 - 2, by - h - rh * .5, 4, 5), 'glass', { w: .4 });
      } else {
        const rh = Math.min(16, w * .34);
        o += k.shape(k.poly([[x - 2, by - h], [x + w * .12, by - h - rh], [x + w * .88, by - h - rh], [x + w + 2, by - h]]), 'tiles', { w: 1 });
        o += k.shape(k.poly([[x + w * .7, by - h - rh], [x + w * .88, by - h - rh], [x + w + 2, by - h], [x + w * .8, by - h]]), 'dark', { w: .4 });
        o += k.shape(k.rect(x + w * .3, by - h - rh * .62, 6, 6), 'light', { w: .6 }) + k.shape(k.gable(x + w * .3 - 1, by - h - rh * .62, 8, 4), 'dark', { w: .5 });
      }
      return o;
    };

    // ---- the Alps and the Pre-Alps
    let s = '';
    const A = range(142, 78, 4);
    s += k.shape(A.d, 'light', { far: true, w: .8 }) + k.shape(A.shade, 'dark', { far: true, w: 0 }) + k.shape(A.snow, 'paper', { far: true, w: .6 });
    const B = range(146, 26, 9, -30);
    s += k.shape(B.d, 'stipple', { far: true, w: .7 }) + k.shape(B.shade, 'mid', { far: true, w: 0 });
    s += k.haze(118, 26, .2);
    // ---- the lake, its shores, a paddle steamer and a sail
    s += k.water(144, 168, { far: true, seed: 3 });
    s += k.shape('M645 140Q560 142 500 152L470 168H645Z', 'stipple', { far: true, w: .6 });
    s += k.boat(372, 160, .6, 'steamer', 1) + k.boat(176, 163, .5, 'sail', 1);

    // ---- the far bank of the Limmat: houses along the quay, the Fraumünster's needle, St Peter's clock
    let fb = '';
    fb += k.shape(k.rect(458, 104, 14, 80), 'vert', { w: .9 }) + k.shape(k.rect(467, 104, 5, 80), 'dark', { w: .4 }) + k.shape(k.spire(465, 104, 15, 62), 'mid', { w: .9 }) + k.line('M465 42v-6M463 39h4', .8);
    fb += k.shape(k.rect(560, 98, 20, 90), 'light', { w: 1 }) + k.shape(k.rect(573, 98, 7, 90), 'dark', { w: .4 }) + k.shape(k.spire(570, 98, 21, 46), 'dark', { w: .9 });
    fb += `<circle cx="569" cy="110" r="7.4" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.1"/>` + k.line('M569 110v-5M569 110l3.4 1.8', .8);
    for (const [x, w, h, gb, tone] of [[436, 24, 16, 1, 'light'], [458, 28, 14, 0, 'mid'], [484, 22, 18, 1, 'light'], [504, 32, 15, 0, 'light'], [534, 24, 19, 1, 'mid'], [582, 28, 15, 0, 'light'], [608, 40, 18, 1, 'light']]) fb += house(x, 190, w, h, gb, tone);
    fb += k.shape(k.rect(432, 186, 214, 5), 'dark', { w: .6 });
    s += fb;
    // the river leaving the lake, under the terrace
    s += k.shape('M318 168L400 168Q414 182 436 191L645 196V245H360Q346 196 318 168Z', 'water', { w: 1 });
    for (let i = 0; i < 9; i++) s += k.line(`M${P(346 + i * 20, 178 + i * 4)}h${f(14 + i * 3)}`, f(.6 + i * .05));
    s += k.boat(520, 222, .9, 'barge', -1);

    // ---- the Grossmünster: the twin towers with their domed caps, the nave roof running left
    const gm = (x, w) => {
      let t = k.shape(k.rect(x, 84, w, 120), 'vert', { w: 1.3 }) + k.shape(k.rect(x + w * .66, 84, w * .34, 120), 'dark', { w: .6 });
      t += k.shape(k.arch(x + w * .18, 126, w * .24, 18), 'black', { w: .5 }) + k.shape(k.arch(x + w * .52, 126, w * .24, 18), 'black', { w: .5 });
      t += `<circle cx="${f(x + w * .45)}" cy="100" r="${f(w * .25)}" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.1"/>` + k.line(`M${P(x + w * .45, 100)}v${f(-w * .17)}M${P(x + w * .45, 100)}l${f(w * .12)} ${f(w * .06)}`, .8);
      t += k.shape(k.rect(x - 1.5, 81, w + 3, 4), 'dark', { w: .8 });
      const o1 = x + w * .08, o2 = x + w * .92, om = (o1 + o2) / 2, ow = o2 - o1;
      t += k.shape(k.rect(o1, 52, ow, 29), 'vert', { w: 1.2 }) + k.shape(k.rect(om + ow * .2, 52, ow * .3, 29), 'dark', { w: .4 });
      t += k.line(`M${P(om - ow * .2, 52)}V81M${P(om + ow * .2, 52)}V81`, .6);
      t += k.shape(k.gothic(om - 2.8, 56, 5.6, 21), 'black', { w: .4 }) + k.shape(k.gothic(o1 + 1.4, 57, 3.2, 19), 'black', { w: .4 });
      t += k.shape(k.rect(o1 - 1.6, 49, ow + 3.2, 3.6), 'dark', { w: .8 });
      t += k.shape(`M${P(o1, 49)}C${P(o1, 36)} ${P(om - 3, 31)} ${P(om, 29)}C${P(om + 3, 31)} ${P(o2, 36)} ${P(o2, 49)}Z`, 'mid', { w: 1.2 });
      t += k.shape(`M${P(om + 2, 49)}C${P(om + 4, 40)} ${P(om + 2, 33)} ${P(om, 29)}C${P(om + 3, 31)} ${P(o2, 36)} ${P(o2, 49)}Z`, 'dark', { w: .4 });
      t += k.shape(k.rect(om - 2.2, 21, 4.4, 8), 'light', { w: .6 }) + k.shape(k.dome(om, 21, 3.2, 3.2), 'dark', { w: .5 }) + `<circle cx="${f(om)}" cy="15.4" r="1.5" fill="${k.ink}"/>` + k.line(`M${P(om, 14)}v-5`, .9);
      return t;
    };
    let g = k.shape(k.poly([[118, 196], [136, 146], [224, 146], [228, 196]]), 'tiles', { w: 1.2 }) + k.shape(k.poly([[184, 196], [198, 146], [224, 146], [228, 196]]), 'dark', { w: .5 });
    g += gm(222, 32) + gm(272, 32) + k.shape(k.rect(254, 128, 18, 76), 'light', { w: 1 }) + k.shape(k.gable(252, 128, 22, 18), 'mid', { w: .8 });
    s += g;

    // ---- the Niederdorf below the terrace, roofs stepping down toward us, chimneys smoking
    let ro = '';
    const q = k.rng(61);
    for (const [by, x0, x1, hm, sc] of [[184, 60, 130, 11, .9], [196, -10, 318, 13, 1.15], [212, -10, 340, 16, 1.4]]) {
      for (let x = x0 + q() * 8; x < x1;) {
        const w = (24 + q() * 20) * sc, h = hm * (.8 + q() * .5), gb = q() < .45;
        ro += house(x, by, w, h, gb, q() < .5 ? 'light' : 'mid');
        if (q() < .4) { const cx = x + w * (.25 + q() * .5), cy = by - h - (gb ? w * .4 : 12); ro += k.shape(k.rect(cx - 2, cy - 7, 4, 8), 'black', { w: .5 }); if (cx < 196 || cx > 316) ro += k.smoke(cx, cy - 7, .45 + sc * .2, { seed: Math.round(cx) }); }
        x += w + (gb ? w * .3 : -1);
      }
      ro += k.shape(k.rect(x0 - 5, by - 4, x1 - x0 + 30, 4), 'dark', { w: 0, op: .6 });
    }
    s += ro + k.haze(186, 26, .2);

    // ---- the terrace: a stone balustrade, gravel, the lime tree
    let tr = k.shape(k.rect(-5, 206, 650, 40), 'paper', { w: 0 });
    tr += k.shape(k.rect(-5, 208, 650, 6), 'light', { w: 1.2 }) + k.line('M-5 214H645', .9);
    let bal = '';
    for (let x = 4; x < 645; x += 9) bal += `M${P(x - 2.4, 214)}q-1.6 4 0 7q-1.6 3 0 6h4.8q1.6 -3 0 -6q1.6 -3 0 -7Z`;
    tr += k.shape(bal, 'vert', { w: .7 }) + k.shape(k.rect(-5, 227, 650, 5), 'mid', { w: .9 });
    for (const x of [150, 420]) tr += k.shape(k.rect(x - 8, 200, 16, 32), 'light', { w: 1 }) + k.shape(k.rect(x + 2, 200, 6, 32), 'dark', { w: .5 }) + k.shape(`M${P(x - 6, 200)}q0 -9 6 -10q6 1 6 10Z`, 'mid', { w: .8 });
    tr += k.shape(k.rect(-5, 232, 650, 13), 'horiz', { w: 0 }) + k.line('M-5 232H645', .8);
    // telescope on its tripod, a gentleman at the eyepiece
    tr += k.line('M488 238l8 -26M504 238l-8 -26M496 238v-26', 1.1) + k.shape('M484 204l24 -9l2 4l-24 9Z', 'black', { w: .6 }) + k.figure(478, 238, 1.5, 'man');
    // a governess with a parasol, a student, a porter, a nun come to look
    tr += k.figure(212, 238, 1.55, 'woman') + k.shape('M200 196q12 -10 24 0Z', 'light', { w: .8 }) + k.line('M212 196v14', .8);
    tr += k.figure(250, 238, 1.5, 'man') + k.figure(596, 238, 1.45, 'nun') + k.figure(338, 238, 1.3, 'porter');
    // the lime tree framing the left, shaded on its right
    tr += k.shape('M24 240C30 204 28 176 36 140L44 140C40 176 44 210 40 240Z', 'dark', { w: .9 }) + k.line('M38 164q20 -10 30 -30M34 182q-14 -12 -24 -10', 2.4);
    tr += k.shape(blob(48, 84, 58, 48, 13), 'dark', { w: .9 }) + k.shape(blob(40, 76, 48, 40, 12), 'stipple', { w: 0 }) + k.shape(blob(92, 136, 26, 20), 'dark', { w: .8 }) + k.shape(blob(86, 132, 20, 15), 'stipple', { w: 0 });
    s += tr;
    hide([[-5, 30, 120, 160]]);
    return s;
  },
};
