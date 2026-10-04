// Munich: up a narrow old-town lane to the Frauenkirche. The two massive brick towers with their green bulbous caps
// close the end of the street, high above the gabled houses; a brewer's dray with barrels comes across the cobbles.

export default {
  id: 'MUN',
  draw(k) {
    const f = k.f, r = k.rng(17);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    // one-point perspective: every street line runs to (VX, VY). Façades are given in near-plane units (z = 1) and a depth z.
    const VX = 322, VY = 178, XL = -5, XR = 645, GY = 240;
    const pt = (side, z, yn) => [VX + ((side < 0 ? XL : XR) - VX) / z, VY + (yn - VY) / z];
    const quad = (side, z1, z2, y1, y2) => k.poly([pt(side, z1, y1), pt(side, z2, y1), pt(side, z2, y2), pt(side, z1, y2)]);
    const horse = (x, y, s, dir = 1, tone = 'dark') => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, f(1.25 * s)) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, f(1.3 * s)) + k.shape(body, tone, { w: .6 });
    };

    // ---- the Frauenkirche, frontal, centred at the end of the lane
    let ch = '';
    const tower = (x, w) => {
      const base = 194, oct = 86, capB = 62, cx = x + w / 2;
      // the square brick shaft: lancets, string courses, shade on the right
      let t = k.shape(k.rect(x, oct, w, base - oct), 'brick', { w: 1.4 }) + k.shape(k.rect(x + w * .7, oct, w * .3, base - oct), 'dark', { w: .6 });
      for (const yy of [100, 130]) t += k.shape(k.gothic(x + w * .2, yy, w * .14, 22), 'black', { w: .5 }) + k.shape(k.gothic(x + w * .44, yy, w * .14, 22), 'black', { w: .5 });
      t += k.line(`M${P(x, oct + 6)}h${f(w)}M${P(x, oct + 8)}h${f(w)}M${P(x, 156)}h${f(w)}`, .8);
      // the octagonal belfry: three faces seen, the right one turned from the light
      const ow = w * .86, a1 = cx - ow / 2, a2 = cx - ow * .21, a3 = cx + ow * .21, a4 = cx + ow / 2;
      t += k.shape(k.rect(a1, capB, ow, oct - capB), 'vert', { w: 1.2 }) + k.shape(k.rect(a3, capB, a4 - a3, oct - capB), 'dark', { w: .5 });
      t += k.line(`M${P(a2, capB)}V${f(oct)}M${P(a3, capB)}V${f(oct)}`, .7);
      t += k.shape(k.gothic(cx - ow * .1, capB + 4, ow * .2, oct - capB - 6), 'black', { w: .5 }) + k.shape(k.gothic(a1 + ow * .07, capB + 6, ow * .13, oct - capB - 9), 'black', { w: .5 });
      // the cap: a copper helmet swelling from the octagon and drawn in to a lantern, a little bulb, ball and cross
      const cw = ow * 1.02, Lw = ow * .1;
      const up = `M${P(cx - cw / 2, capB)}C${P(cx - cw * .58, capB - 12)} ${P(cx - cw * .5, capB - 23)} ${P(cx - cw * .24, capB - 28)}C${P(cx - cw * .1, capB - 31)} ${P(cx - Lw, capB - 32)} ${P(cx - Lw, capB - 35)}`
        + `L${P(cx + Lw, capB - 35)}C${P(cx + Lw, capB - 32)} ${P(cx + cw * .1, capB - 31)} ${P(cx + cw * .24, capB - 28)}C${P(cx + cw * .5, capB - 23)} ${P(cx + cw * .58, capB - 12)} ${P(cx + cw / 2, capB)}Z`;
      t += k.shape(up, 'mid', { w: 1.4 });
      t += k.shape(`M${P(cx + cw * .12, capB)}C${P(cx + cw * .3, capB - 12)} ${P(cx + cw * .26, capB - 22)} ${P(cx + cw * .12, capB - 29)}C${P(cx + cw * .2, capB - 28)} ${P(cx + cw * .5, capB - 23)} ${P(cx + cw * .58, capB - 12)}Q${P(cx + cw * .55, capB - 4)} ${P(cx + cw / 2, capB)}Z`, 'dark', { w: .4 });
      t += k.line(`M${P(cx - cw * .26, capB - 1)}C${P(cx - cw * .34, capB - 12)} ${P(cx - cw * .28, capB - 22)} ${P(cx - cw * .12, capB - 29)}M${P(cx - cw * .5, capB - 3)}h${f(cw)}`, .6);
      t += k.shape(k.rect(cx - Lw - 1, capB - 44, 2 * Lw + 2, 9), 'light', { w: .9 }) + k.shape(k.rect(cx - 1.4, capB - 42.5, 2.8, 6), 'black', { w: 0 });
      t += k.shape(k.onion(cx, capB - 44, 2 * Lw + 5, 9), 'mid', { w: .9 }) + k.line(`M${P(cx, capB - 53)}v-8M${P(cx - 2.6, capB - 58)}h5.2`, 1.1);
      t += `<circle cx="${f(cx)}" cy="${f(capB - 54)}" r="1.5" fill="${k.ink}"/>`;
      return t;
    };
    // the nave's steep gable between the towers, the portal below
    ch += k.shape(k.poly([[305, 194], [305, 124], [322, 96], [339, 124], [339, 194]]), 'brick', { w: 1.1 }) + k.shape(k.gothic(313, 134, 18, 40), 'black', { w: .7 });
    ch += tower(257, 50) + tower(337, 50);
    // smoke and haze over the far roofs; the houses of the Frauenplatz, frontal, closing the lane
    let fa = k.haze(150, 34, .3);
    const far = [[236, 22, 24, 'gable'], [258, 30, 28, 'pitch'], [288, 32, 24, 'pitch'], [320, 28, 30, 'gable'], [348, 30, 26, 'pitch'], [378, 40, 24, 'gable']];
    for (const [x, w, h, roof] of far) fa += k.building(x, 194, w, h, { roof, tone: x > 322 ? 'light' : 'mid', lit: .45 });
    fa += k.shape(k.rect(232, 186, 190, 8), 'dark', { w: .6 });

    // ---- the lane: cobbles running to the church, kerbs, the shade of the left-hand houses
    const zEnd = 4.4, far1 = (xn) => P(VX + (xn - VX) / zEnd, VY + (GY - VY) / zEnd);
    const [lx, ly] = pt(-1, zEnd, GY), [rx, ry] = pt(1, zEnd, GY);
    let st = k.shape(k.poly([[XL, GY], [lx, ly], [rx, ry], [XR, GY]]), 'paper', { w: .8 });
    for (let z = 1.04; z < zEnd; z *= 1.07) { const [ax, ay] = pt(-1, z, GY), [bx] = pt(1, z, GY); st += k.line(`M${P(ax, ay)}H${f(bx)}`, f(.35 + .5 / z)); }
    for (const xn of [-160, 40, 220, 400, 600, 800]) st += k.line(`M${P(xn, GY)}L${far1(xn)}`, .4);
    st += k.shape(`M${P(XL, GY)}L${P(lx, ly)}L${far1(150)}L${P(150, GY)}Z`, 'mid', { w: 0, op: .55 });
    for (const xn of [40, 600]) st += k.line(`M${P(xn, GY)}L${far1(xn)}`, 1);

    // ---- the two rows of houses down the lane
    const row = (side, houses) => {
      let o = '', z = 1;
      const lit = side > 0, wall = lit ? 'light' : 'mid', ground = lit ? 'dark' : 'black';
      for (const [dz, top, gable] of houses) {
        const z2 = z + dz;
        o += k.shape(quad(side, z, z2, top, GY), wall, { w: 1 });
        o += k.shape(quad(side, z, z2, GY - 52, GY), ground, { w: .8 }); // the soot-dark ground floor
        const dm = z + dz * .55;
        o += k.shape(quad(side, dm - dz * .12, dm + dz * .12, GY - 44, GY), 'ink', { w: 0 });
        // windows: a perspective grid; each lit pane is remembered (as its inner box) for the night
        const floors = Math.max(2, Math.round((GY - 56 - top) / 46));
        for (let c = 0; c < 3; c++) for (let fl = 0; fl < floors; fl++) {
          const za = z + dz * (.18 + c * .28), zb = za + dz * .13, yt = GY - 94 - fl * 46, yb = yt + 26;
          if (yt < top + 6) continue;
          o += k.shape(quad(side, za, zb, yt, yb), 'glass', { w: .5 });
          const [ax, ay1] = pt(side, za, yt), [bx, by1] = pt(side, zb, yt), [, ay2] = pt(side, za, yb), [, by2] = pt(side, zb, yb);
          const top2 = Math.max(ay1, by1), bot2 = Math.min(ay2, by2);
          if (k.rand() < .45 && bot2 > top2) k.lights.push([f(Math.min(ax, bx)), f(top2), f(Math.abs(bx - ax)), f(bot2 - top2)]);
        }
        o += k.shape(quad(side, z, z2, top - 6, top), 'dark', { w: .7 }); // cornice
        if (gable) {
          const [ax, ay] = pt(side, z, top - 6), [bx, by] = pt(side, z2, top - 6), [mx, my] = pt(side, (z + z2) / 2, top - 6 - gable);
          o += k.shape(k.poly([[ax, ay], [mx, my], [bx, by]]), lit ? 'vert' : 'dark', { w: 1 });
          const [wx, wy] = pt(side, (z + z2) / 2, top - 6 - gable * .45);
          o += `<circle cx="${f(wx)}" cy="${f(wy)}" r="${f(6 / z)}" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width=".5"/>`;
        } else {
          o += k.shape(quad(side, z, z2, top - 34, top - 6), 'tiles', { w: .8 });
          const [cx, cy] = pt(side, z + dz * .5, top - 34);
          o += k.shape(k.rect(cx - 3 / z, cy - 16 / z, 6 / z, 16 / z), 'black', { w: .5 });
          if (k.rand() < .7) o += k.smoke(cx, cy - 16 / z, 1.2 / Math.sqrt(z), { seed: Math.round(cx) });
        }
        z = z2;
      }
      return o;
    };
    const rows = row(1, [[.42, -70, 0], [.5, -20, 60], [.45, 10, 0], [.55, -40, 0], [.6, 0, 50], [.7, -30, 0]])
      + row(-1, [[.5, -50, 0], [.45, -10, 70], [.6, -60, 0], [.55, -20, 0], [.7, 0, 60]]);
    let s = ch + fa + st + rows;

    // ---- life: a dray with barrels, a soldier, a woman with her basket, a priest; a gas lamp on the lit side
    const dx = 196, dy = 226, ds = 1.25, D = (a, b) => P(dx + a * ds, dy + b * ds);
    let dray = '';
    for (const [a, rr] of [[-26, 8], [6, 8]]) {
      dray += `<circle cx="${f(dx + a * ds)}" cy="${f(dy - rr * ds)}" r="${f(rr * ds)}" fill="none" stroke="${k.ink}" stroke-width="1.5"/>`;
      for (let i = 0; i < 4; i++) { const q = i * Math.PI / 4; dray += k.line(`M${D(a - Math.cos(q) * rr, -rr - Math.sin(q) * rr)}L${D(a + Math.cos(q) * rr, -rr + Math.sin(q) * rr)}`, .6); }
    }
    dray += k.shape(`M${D(-38, -16)}h56l2 -4h-60Z`, 'dark', { w: .8 }) + k.line(`M${D(-38, -20)}v-10M${D(18, -20)}v-10`, 1);
    // barrels lying end-on in a pyramid, hooped
    for (const [a, b] of [[-31, 0], [-19, 0], [-7, 0], [5, 0], [-25, -11], [-13, -11], [-1, -11], [-19, -22], [-7, -22]]) {
      const bx = dx + a * ds, by = dy + (-26 + b) * ds, br = 5.8 * ds;
      dray += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="url(#mid-${k.uid})" stroke="${k.ink}" stroke-width="1"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(br * .62)}" fill="none" stroke="${k.ink}" stroke-width=".6"/><circle cx="${f(bx - br * .1)}" cy="${f(by - br * .1)}" r="${f(br * .18)}" fill="${k.ink}"/>`;
    }
    dray += k.figure(dx + 24 * ds, dy - 18 * ds, ds, 'man') + k.line(`M${D(20, -14)}L${D(36, -10)}`, 1.1);
    dray += horse(dx + 50 * ds, dy, ds * 1.2) + horse(dx + 56 * ds, dy - 2, ds * 1.2, 1, 'black');
    s += dray;
    for (const [x, y, sc, kind] of [[78, 236, 1.3, 'woman'], [92, 238, 1.35, 'man'], [452, 214, .8, 'soldier'], [470, 214, .8, 'soldier'], [560, 232, 1.2, 'priest'], [366, 204, .55, 'man'], [282, 202, .5, 'woman']]) {
      s += k.shape(`M${P(x - 2, y)}l${f(12 * sc)} 1.4l-2 1.2l${f(-10 * sc)} -1Z`, 'dark', { w: 0 }) + k.figure(x, y, sc, kind);
    }
    s += k.lamp(520, 230, 1.5);
    return s;
  },
};
