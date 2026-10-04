// Amsterdam: from a boat under a stone bridge on the Prinsengracht, looking out through the arch. Tall gables lean
// over the far quay, a sack swings from a hoist beam, elms shade the cobbles; the white bascule bridge spans a side
// canal on the left; the Westerkerk lifts its imperial crown over the roofs. A tjalk is moored beyond the arch.

export default {
  id: 'AMS',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(52);
    const Q = 196, WY = 200; // quay top, water line
    const s = 4.4; // px per metre on the far quay
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;

    // ---------- the Westerkerk tower behind the row: clock stage, two octagons, the imperial crown
    const TX = 462, ts = 2.7, top = 7, ty = (m) => top + (85 - m) * ts;
    let tw = '';
    const box = (hw, m0, m1, tone) => k.shape(k.rect(TX - hw * ts, ty(m1), 2 * hw * ts, (m1 - m0) * ts), tone, { w: 1.2 });
    const shade = (x0, hw, m0, m1) => k.shape(k.rect(TX + x0 * ts, ty(m1), hw * ts, (m1 - m0) * ts), 'dark', { w: 0 });
    tw += box(7, 20, 38, 'brick') + shade(3, 4, 20, 38) + k.shape(k.arch(TX - 2.4 * ts, ty(35), 4.8 * ts, 10 * ts), 'glass', { w: .6 });
    tw += box(6, 38, 50, 'vert') + shade(2.4, 3.6, 38, 50);
    tw += `<circle cx="${TX - 1}" cy="${f(ty(44))}" r="${f(3.4 * ts)}" fill="${P}" stroke="${k.ink}" stroke-width="1.1"/><circle cx="${TX - 1}" cy="${f(ty(44))}" r="${f(2.7 * ts)}" fill="none" stroke="${k.ink}" stroke-width=".5"/>` + k.line(`M${TX - 1} ${f(ty(44))}v-6M${TX - 1} ${f(ty(44))}l4.4 2.4`, 1);
    tw += k.shape(k.rect(TX - 6.9 * ts, ty(51.3), 13.8 * ts, 1.3 * ts), 'mid', { w: .9 });
    let bal = '';
    for (let x = TX - 6.4 * ts; x < TX + 6.6 * ts; x += 3.2) bal += `M${f(x)} ${f(ty(51.3))}v-3`;
    tw += k.line(bal + `M${f(TX - 6.9 * ts)} ${f(ty(51.3) - 3)}h${f(13.8 * ts)}`, .7);
    tw += box(4.7, 52.5, 61, 'light') + shade(1.5, 3.2, 52.5, 61);
    tw += k.shape(k.arch(TX - 3.2 * ts, ty(59.6), 2.4 * ts, 6 * ts) + k.arch(TX + .7 * ts, ty(59.6), 2.4 * ts, 6 * ts), 'black', { w: .5 });
    tw += k.line(`M${f(TX - 4.7 * ts)} ${f(ty(61))}V${f(ty(52.5))}M${f(TX + 4.7 * ts)} ${f(ty(61))}V${f(ty(52.5))}`, 1.6);
    tw += k.shape(k.rect(TX - 5.4 * ts, ty(62.2), 10.8 * ts, 1.2 * ts), 'mid', { w: .8 });
    tw += box(3.4, 62.2, 68.2, 'light') + shade(1, 2.4, 62.2, 68.2);
    tw += k.shape(k.arch(TX - 1.5 * ts, ty(67.2), 3 * ts, 4.4 * ts), 'black', { w: .5 });
    // the crown: a jewelled band, hoops closing over it, the orb and cross, a vane
    const cb = ty(68.4), cw = 4.8 * ts;
    tw += k.shape(`M${f(TX - cw)} ${f(cb)}L${f(TX - cw * 1.06)} ${f(cb - 2.6 * ts)}L${f(TX + cw * 1.06)} ${f(cb - 2.6 * ts)}L${f(TX + cw)} ${f(cb)}Z`, 'light', { w: 1.1 });
    tw += k.shape(`M${f(TX - cw * 1.06)} ${f(cb - 2.6 * ts)}C${f(TX - cw * 1.25)} ${f(cb - 8.2 * ts)} ${f(TX - cw * .2)} ${f(cb - 8.8 * ts)} ${f(TX)} ${f(cb - 7.7 * ts)}C${f(TX + cw * .2)} ${f(cb - 8.8 * ts)} ${f(TX + cw * 1.25)} ${f(cb - 8.2 * ts)} ${f(TX + cw * 1.06)} ${f(cb - 2.6 * ts)}Z`, 'dark', { w: 1.2 });
    tw += k.shape(`M${f(TX + cw * .1)} ${f(cb - 7.9 * ts)}C${f(TX + cw * .4)} ${f(cb - 8.6 * ts)} ${f(TX + cw * 1.25)} ${f(cb - 8.2 * ts)} ${f(TX + cw * 1.06)} ${f(cb - 2.6 * ts)}L${f(TX + cw * .55)} ${f(cb - 2.6 * ts)}Z`, 'black', { w: 0 });
    tw += k.line(`M${f(TX - cw * .52)} ${f(cb - 2.6 * ts)}Q${f(TX - cw * .58)} ${f(cb - 7.4 * ts)} ${f(TX)} ${f(cb - 7.7 * ts)}M${f(TX + cw * .52)} ${f(cb - 2.6 * ts)}Q${f(TX + cw * .58)} ${f(cb - 7.4 * ts)} ${f(TX)} ${f(cb - 7.7 * ts)}M${f(TX)} ${f(cb - 2.6 * ts)}V${f(cb - 7.7 * ts)}`, .9, { color: P });
    let jw = '';
    for (let i = -3; i <= 3; i++) jw += `M${f(TX + i * cw * .28)} ${f(cb - 1.3 * ts)}h.1`;
    tw += k.line(jw, 2, { color: P }) + k.line(`M${f(TX - cw)} ${f(cb)}H${f(TX + cw)}`, 1);
    let fleur = '';
    for (let i = -2; i <= 2; i++) fleur += `M${f(TX + i * cw * .42 - 2)} ${f(cb - 2.6 * ts)}l2 -4l2 4Z`;
    tw += k.shape(fleur, 'light', { w: .6 });
    const ob = cb - 7.7 * ts;
    tw += `<circle cx="${TX}" cy="${f(ob - 3)}" r="3.2" fill="url(#mid-${k.uid})" stroke="${k.ink}" stroke-width=".9"/>`;
    tw += k.line(`M${TX} ${f(ob - 6.2)}V${top}M${TX - 3} ${f(ob - 11)}h6`, 1.3) + k.shape(`M${TX} ${top + 1}l8 2l-8 2Z`, 'dark', { w: .5 });
    tw += k.shape(k.poly([[TX - 34, ty(20)], [TX - 26, ty(29)], [TX - 19, ty(29)], [TX - 19, ty(20)]]), 'tiles', { w: .8 }); // the church roof, glimpsed

    // ---------- the row of canal houses across the water, near and tall
    const kinds = ['neck', 'spout', 'bell', 'step', 'cornice', 'neck', 'bell', 'spout', 'cornice', 'neck', 'step', 'bell', 'neck', 'spout'];
    let houses = '', hoist = '', refl = '', smoke = '';
    let x = 226, i = 0;
    while (x < 645) {
      let kind = kinds[i % kinds.length];
      const w = (5.6 + r() * 2.6) * s;
      if (x + w > TX - 22 && x < TX + 20) kind = 'cornice';
      const hm = kind === 'cornice' ? 15.5 + r() * 2 : 14.5 + r() * 5.5, h = hm * s, lean = (r() - .5) * 4;
      const tp = Q - h, gh = (kind === 'cornice' ? 1.6 : 6.5 + r() * 3.5) * s, tone = ['brick', 'light', 'brick', 'vert', 'light', 'brick'][i % 6];
      const L = x, R = x + w, cx = x + w / 2 + lean;
      let d = `M${f(L)} ${f(Q)}L${f(L + lean)} ${f(tp)}`;
      if (kind === 'neck') d += `Q${f(L + lean + w * .05)} ${f(tp - gh * .3)} ${f(cx - w * .25)} ${f(tp - gh * .46)}L${f(cx - w * .25)} ${f(tp - gh * .8)}Q${f(cx)} ${f(tp - gh * 1.08)} ${f(cx + w * .25)} ${f(tp - gh * .8)}L${f(cx + w * .25)} ${f(tp - gh * .46)}Q${f(R + lean - w * .05)} ${f(tp - gh * .3)} ${f(R + lean)} ${f(tp)}`;
      if (kind === 'bell') d += `Q${f(L + lean + w * .06)} ${f(tp - gh * .55)} ${f(cx - w * .2)} ${f(tp - gh * .66)}Q${f(cx - w * .26)} ${f(tp - gh * 1.02)} ${f(cx)} ${f(tp - gh * 1.02)}Q${f(cx + w * .26)} ${f(tp - gh * 1.02)} ${f(cx + w * .2)} ${f(tp - gh * .66)}Q${f(R + lean - w * .06)} ${f(tp - gh * .55)} ${f(R + lean)} ${f(tp)}`;
      if (kind === 'spout') d += `L${f(cx - w * .13)} ${f(tp - gh * .9)}L${f(cx - w * .13)} ${f(tp - gh)}L${f(cx + w * .13)} ${f(tp - gh)}L${f(cx + w * .13)} ${f(tp - gh * .9)}L${f(R + lean)} ${f(tp)}`;
      if (kind === 'step') { for (let j = 1; j <= 3; j++) d += `L${f(L + lean + w * .14 * (j - 1))} ${f(tp - gh * j / 3.6)}L${f(L + lean + w * .14 * j)} ${f(tp - gh * j / 3.6)}`; d += `L${f(L + lean + w * .42)} ${f(tp - gh)}L${f(R + lean - w * .42)} ${f(tp - gh)}`; for (let j = 3; j >= 1; j--) d += `L${f(R + lean - w * .14 * j)} ${f(tp - gh * j / 3.6)}L${f(R + lean - w * .14 * (j - 1))} ${f(tp - gh * j / 3.6)}`; }
      if (kind === 'cornice') d += `L${f(L + lean - 2)} ${f(tp - gh * .45)}L${f(L + lean - 2)} ${f(tp - gh)}L${f(R + lean + 2)} ${f(tp - gh)}L${f(R + lean + 2)} ${f(tp - gh * .45)}L${f(R + lean)} ${f(tp)}`;
      d += `L${f(R)} ${f(Q)}Z`;
      houses += k.shape(d, tone, { w: 1.15 });
      // soot on the lower storey; windows in their grid; the door up its stoop; the cellar
      houses += k.shape(k.rect(L + .6, Q - 4.4 * s, w - 1.2, 4.4 * s), 'mid', { w: 0, op: .85 });
      const cols = w > 30 ? 3 : 2, fl = Math.max(2, Math.round((hm - 4.5) / 3.6));
      houses += k.windows(L + 2.5 + lean * .5, tp + 4, w - 5, h - 4.6 * s - 5, cols, fl, { ww: .52, wh: .64, lit: .32 });
      houses += k.shape(k.rect(cx - lean - 3, Q - 3.4 * s, 6, 3.4 * s), 'black', { w: .6 }) + k.shape(k.rect(cx - lean - 4.5, Q - 3, 9, 3), 'light', { w: .5 });
      houses += k.shape(k.rect(L + 2.5, Q - 3.9 * s, w * .26, 2.2 * s), 'glass', { w: .5 });
      if (kind !== 'cornice') {
        houses += k.shape(k.rect(cx - 2.2, tp - gh * .64, 4.4, 5.5), 'black', { w: .5 }); // the loft door
        hoist += seg(cx, tp - gh * .76, cx + 9, tp - gh * .76) + seg(cx + 8.4, tp - gh * .76, cx + 8.4, tp - gh * .76 + 5 + (i % 3) * 8);
        if (i === 5) houses += k.shape(k.rect(cx + 5.4, tp - gh * .76 + 13, 6, 8), 'dark', { w: .6 }); // a sack on the hoist rope
      } else houses += k.line(seg(L + lean - 2, tp - gh * .45, R + lean + 2, tp - gh * .45), 1.4);
      if (i % 4 === 1) { const chx = L + lean + w * .2; houses += k.shape(k.rect(chx - 2, tp - gh * .5 - 7, 4, 8), 'black', { w: .5 }); smoke += k.smoke(chx, tp - gh * .5 - 8, .9, { seed: i }); }
      // its reflection: broken strokes and a dim band in the canal
      refl += `M${f(L + 1)} ${f(WY + 1)}h${f(w - 2)}v${f(Math.min(38, h * .34))}h${f(-(w - 2))}Z`;
      x = R + .4; i++;
    }
    houses += k.line(hoist, 1);
    // the quay: its wall, elms, people at work
    let quay = k.shape(k.rect(214, Q, 436, WY - Q), 'dark', { w: 1 }) + k.line(`M214 ${Q}H645`, 1.4);
    const elm = (x, sc) => k.line(`M${f(x)} ${Q}v${f(-14 * sc)}`, 2 * sc) + k.shape(`M${f(x - 15 * sc)} ${f(Q - 12 * sc)}C${f(x - 22 * sc)} ${f(Q - 30 * sc)} ${f(x - 5 * sc)} ${f(Q - 44 * sc)} ${f(x + 4 * sc)} ${f(Q - 40 * sc)}C${f(x + 20 * sc)} ${f(Q - 40 * sc)} ${f(x + 20 * sc)} ${f(Q - 18 * sc)} ${f(x + 14 * sc)} ${f(Q - 12 * sc)}Q${f(x)} ${f(Q - 7 * sc)} ${f(x - 15 * sc)} ${f(Q - 12 * sc)}Z`, 'stipple', { w: .8 })
      + k.shape(`M${f(x + 2 * sc)} ${f(Q - 10 * sc)}C${f(x + 16 * sc)} ${f(Q - 12 * sc)} ${f(x + 20 * sc)} ${f(Q - 22 * sc)} ${f(x + 16 * sc)} ${f(Q - 30 * sc)}C${f(x + 14 * sc)} ${f(Q - 18 * sc)} ${f(x + 8 * sc)} ${f(Q - 14 * sc)} ${f(x + 2 * sc)} ${f(Q - 10 * sc)}Z`, 'dark', { w: 0 });
    quay += elm(300, 1.3) + elm(612, 1.25);
    quay += k.figure(340, Q, .85, 'porter') + k.figure(356, Q, .85, 'man') + k.figure(430, Q, .82, 'woman') + k.figure(560, Q, .85, 'porter');
    quay += k.shape(k.rect(366, Q - 8, 20, 4), 'mid', { w: .6 }) + k.shape(k.rect(367, Q - 15, 9, 7) + k.rect(376, Q - 13, 9, 5), 'light', { w: .5 }) + `<circle cx="376" cy="${Q - 3}" r="3.4" fill="${P}" stroke="${k.ink}" stroke-width="1"/>`;

    // ---------- the side canal on the left and the bascule bridge across its mouth
    let side = k.skyline(-5, 220, 172, { seed: 30, style: 'north', hMin: 30, hMax: 56, wMin: 12, wMax: 20, far: true });
    side += k.haze(120, 50, .3);
    const BD = 180; // deck level
    let br = k.shape(k.rect(-5, BD, 225, 5), 'light', { w: 1.1 });
    br += k.shape(`M-5 ${BD + 5}H220V${WY}H194A30 15 0 0 0 134 ${WY}H96A30 15 0 0 0 36 ${WY}H-5Z`, 'vert', { w: 1.1 });
    br += k.shape(k.rect(194, BD + 5, 26, WY - BD - 5) + k.rect(84, BD + 5, 12, WY - BD - 5), 'dark', { w: 0 });
    br += k.shape(`M36 ${WY}A30 15 0 0 1 96 ${WY}ZM134 ${WY}A30 15 0 0 1 194 ${WY}Z`, 'black', { w: .6 });
    let rail = `M-5 ${BD - 7}H220`;
    for (let xx = 0; xx < 220; xx += 5) rail += `M${xx} ${BD}v-7`;
    br += k.line(rail, .7);
    for (const [gx, dir] of [[58, 1], [162, -1]]) { // the two gantries with their balance beams and rods
      br += k.shape(k.rect(gx - 11, BD - 40, 4, 40) + k.rect(gx + 7, BD - 40, 4, 40), 'light', { w: 1 });
      br += k.shape(k.rect(gx - 13, BD - 44, 26, 4.4), 'light', { w: 1 });
      br += k.line(`M${gx - 9} ${BD - 14}L${gx + 9} ${BD - 38}M${gx + 9} ${BD - 14}L${gx - 9} ${BD - 38}`, .8);
      const bx0 = gx - 26 * dir, bx1 = gx + 44 * dir;
      br += k.shape(k.poly([[bx0, BD - 49], [bx1, BD - 45], [bx1, BD - 42.4], [bx0, BD - 46.4]]), 'light', { w: 1 });
      br += k.line(`M${bx1} ${BD - 42.4}V${BD - 1}M${bx0} ${BD - 46.4}V${BD - 30}`, .9);
      br += k.shape(k.rect(bx0 - 4 * dir - (dir < 0 ? 0 : 0), BD - 32, 8 * dir, 9), 'dark', { w: .6 });
    }
    br += k.figure(24, BD, .78, 'man') + k.figure(104, BD, .75, 'woman') + k.figure(194, BD, .78, 'porter');
    br += `<circle cx="128" cy="${BD - 4}" r="4" fill="none" stroke="${k.ink}" stroke-width=".9"/><circle cx="141" cy="${BD - 4}" r="4" fill="none" stroke="${k.ink}" stroke-width=".9"/>` + k.line(`M128 ${BD - 4}l5 -6.5h6.5l1.5 6.5M133 ${BD - 10.5}l-1 -2.5h4`, .9) + k.figure(134, BD - 10, .5, 'man');

    // ---------- the canal: the water, dim reflections, a tjalk moored in front, a rowing boat
    let water = k.water(WY, 240, { seed: 9 });
    water += k.shape(refl, 'horiz', { w: 0, op: .45 });
    water += k.shape(`M-5 ${WY + 1}H220V${WY + 16}H-5Z`, 'horiz', { w: 0, op: .4 });
    water += k.shape(`M${TX - 14} ${WY + 1}h28v18h-28Z`, 'dark', { w: 0, op: .3 });
    let ripple = '';
    for (let j = 0; j < 30; j++) { const yy = WY + 3 + r() * 38, xx = r() * 640; ripple += `M${f(xx)} ${f(yy)}h${f(10 + r() * 34)}`; }
    water += k.line(ripple, .8, { color: P });
    const tjalk = (x0, y0, L) => { // a Dutch sailing barge: round bow, leeboard, a stumpy deckhouse, the mast lowered
      let t = k.shape(`M${f(x0)} ${f(y0 - 18)}H${f(x0 + L * .8)}Q${f(x0 + L)} ${f(y0 - 19)} ${f(x0 + L * 1.02)} ${f(y0 - 10)}Q${f(x0 + L * .98)} ${f(y0)} ${f(x0 + L * .8)} ${f(y0)}H${f(x0 + L * .08)}Q${f(x0 - 4)} ${f(y0 - 4)} ${f(x0)} ${f(y0 - 18)}Z`, 'black', { w: 1.1 });
      t += k.line(`M${f(x0 + 4)} ${f(y0 - 14.5)}H${f(x0 + L * .86)}`, .9, { color: P });
      t += k.shape(`M${f(x0 + L * .64)} ${f(y0 - 16)}q9 2 11 15q-9 -2 -11 -15Z`, 'dark', { w: .7 });
      t += k.shape(k.rect(x0 + L * .05, y0 - 28, L * .2, 10), 'light', { w: .9 }) + k.shape(k.rect(x0 + L * .04, y0 - 30.5, L * .22, 2.6), 'dark', { w: .6 });
      t += k.windows(x0 + L * .07, y0 - 27, L * .16, 7, 2, 1, { lit: .6 });
      t += k.shape(k.rect(x0 + L * .32, y0 - 25, 18, 7) + k.rect(x0 + L * .42, y0 - 24, 15, 6), 'mid', { w: .6 }) + k.shape(`M${f(x0 + L * .55)} ${f(y0 - 18)}a6 6 0 1 1 12 0Z`, 'dark', { w: .6 });
      t += k.line(`M${f(x0 + L * .3)} ${f(y0 - 18)}L${f(x0 + L * 1.12)} ${f(y0 - 50)}`, 2.4) + k.line(`M${f(x0 + L * 1.12)} ${f(y0 - 50)}L${f(x0 + L * 1.01)} ${f(y0 - 18)}M${f(x0 + L * 1.12)} ${f(y0 - 50)}L${f(x0 + L * .2)} ${f(y0 - 18)}`, .6);
      t += k.figure(x0 + L * .88, y0 - 18, .85, 'porter') + k.smoke(x0 + L * .12, y0 - 32, .6, { seed: 3 });
      return t;
    };
    const boat = tjalk(452, 213, 118);
    // under the bridge: the near water in shadow, glittering; the vault overhead, lit from the water at its mouth
    const AX = 320, AY = 214, RX = 318, RY = 244;
    const ell = (t, gx = 0) => [AX + (RX + gx) * Math.cos(t), Math.max(-12, AY - (RY + gx) * Math.sin(t))];
    const ring = (gx) => Array.from({ length: 41 }, (_, i) => ell(Math.PI * (1 - i / 40), gx));
    let vault = k.shape(k.poly([[652, AY + 1], [652, -12], [-12, -12], [-12, AY + 1], ...ring(0)]), 'dark', { w: 0 });
    vault += k.shape(k.poly([[652, AY + 1], [652, -12], [-12, -12], [-12, AY + 1], ...ring(34)]), 'black', { w: 0 });
    let joints = '', glow = '';
    for (let i = 1; i < 16; i++) { const t = Math.PI * i / 16, a = ell(t, 2), b = ell(t, 130); joints += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`; }
    for (const gx of [16, 52, 96]) joints += k.poly(ring(gx), false);
    for (const gx of [6, 11, 22]) { let d = ''; for (let i = 2; i <= 38; i++) { const p = ell(Math.PI * (1 - i / 40), gx + Math.sin(i * 1.7 + gx) * 2.4); d += `${i > 2 ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`; } glow += d; }
    vault += k.line(joints, .7, { color: P }) + k.line(glow, .6, { color: P }) + k.line(k.poly(ring(0), false), 1.4);
    let under = k.shape(`M-5 ${AY}H645V245H-5Z`, 'dark', { w: 0 }) + k.line(`M-5 ${AY}H645`, 1);
    let glint = '';
    for (let j = 0; j < 26; j++) { const yy = AY + 4 + r() * 24, xx = r() * 620; glint += `M${f(xx)} ${f(yy)}h${f(4 + (yy - AY) * .9 + r() * 12)}`; }
    under += k.line(glint, .9, { color: P });
    const rower = k.shape(`M128 226q3 6 13 6h44q8 0 12 -8Z`, 'black', { w: 1 }) + k.line('M131 226.6h64', .8, { color: P }) + k.figure(162, 226, 1, 'porter') + k.line('M144 214L114 236M180 215l28 20', 1.4);

    // nothing glows through the vault: keep only the lights inside the arch's mouth
    for (let i = k.lights.length - 1; i >= 0; i--) { const [lx, ly, lw, lh] = k.lights[i], dx = (lx + lw / 2 - AX) / RX, dy = (ly + lh / 2 - AY) / RY; if (dx * dx + dy * dy > .97) k.lights.splice(i, 1); }
    return side + tw + smoke + houses + br + quay + water + boat + under + rower + vault;
  },
};
