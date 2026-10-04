// Copenhagen: from the deck of a barque moored at the mouth of Nyhavn. Her shrouds and ratlines web the left of the
// view; over her rail, across the harbour, the long Exchange with its rows of gables lifts the spire of four twisted
// dragons' tails. A sailor coils a rope by the capstan; schooners lie along the quay; a fishwife rows past.

export default {
  id: 'CPH',
  draw(k) {
    const f = k.f, P = k.paper;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const WY = 172, RY = 190; // the far water line, the top of our rail

    // ---------- far: Christianshavn's roofs, soot
    let far = k.skyline(-5, 300, WY - 1, { seed: 27, style: 'north', hMin: 18, hMax: 34, wMin: 10, wMax: 17 });
    far += k.haze(120, 52, .32);
    far += k.shape(k.rect(214, 104, 4, 30), 'dark', { far: true, w: .4 }) + k.smoke(216, 102, 1.2, { seed: 4 });
    const nFar = k.lights.length;

    // ---------- the Exchange: a long front of brick under a steep copper roof, a row of gabled dormers, the dragon spire
    const B0 = 262, B1 = 652, BB = WY + 1, EW = 34, RT = 30;
    let ex = k.shape(k.rect(B0, BB - EW, B1 - B0, EW), 'brick', { w: 1.2 });
    ex += k.shape(k.poly([[B0 - 2, BB - EW], [B0 + 10, BB - EW - RT], [B1 - 10, BB - EW - RT], [B1 + 2, BB - EW]]), 'dark', { w: 1.2 });
    ex += k.windows(B0 + 4, BB - EW + 4, B1 - B0 - 8, EW - 9, 24, 2, { ww: .42, wh: .62, lit: .3 });
    ex += k.line(`M${B0} ${BB - EW / 2}H${B1}M${B0} ${BB - EW}H${B1}`, 1);
    let gab = '', gw = '';
    for (let x = B0 + 14; x < B1 - 20; x += 22.5) {
      const w = 13, y = BB - EW - 4, h = 17;
      gab += `M${f(x)} ${f(y)}V${f(y - h * .45)}Q${f(x)} ${f(y - h * .6)} ${f(x + 2.5)} ${f(y - h * .62)}L${f(x + 3)} ${f(y - h * .8)}Q${f(x + w / 2)} ${f(y - h * 1.06)} ${f(x + w - 3)} ${f(y - h * .8)}L${f(x + w - 2.5)} ${f(y - h * .62)}Q${f(x + w)} ${f(y - h * .6)} ${f(x + w)} ${f(y - h * .45)}V${f(y)}Z`;
      gw += k.rect(x + 4, y - h * .5, w - 8, h * .38);
      if (k.rand() < .25) k.lights.push([f(x + 4), f(y - h * .5), w - 8, f(h * .38)]);
    }
    ex += k.shape(gab, 'light', { w: .9 }) + k.shape(gw, 'glass', { w: .5 });
    let fin = '';
    for (let x = B0 + 20.5; x < B1 - 14; x += 22.5) fin += `M${f(x)} ${f(BB - EW - 21)}v-4`;
    ex += k.line(fin, 1);
    // the spire: a square base, the four dragons with heads outward, their tails twisted up, three crowns, the vane
    const SX = 452, sb = BB - EW - RT + 4, stip = 12;
    let sp = k.shape(k.rect(SX - 9, sb - 16, 18, 20), 'vert', { w: 1.1 }) + k.shape(k.rect(SX + 2, sb - 16, 7, 20), 'dark', { w: 0 });
    sp += k.shape(k.rect(SX - 11, sb - 18, 22, 3), 'dark', { w: .9 });
    const dbase = sb - 18, H = dbase - stip, W0 = 10.5;
    const wAt = (t) => W0 * Math.pow(1 - t, 1.08) + .6;
    const edge = (sg, n = 30) => Array.from({ length: n + 1 }, (_, i) => [SX + sg * wAt(i / n), dbase - H * i / n]);
    sp += k.shape(k.poly([...edge(-1), ...edge(1).reverse()]), 'light', { w: 1.3 });
    sp += k.shape(k.poly([...edge(1).map(([x, y]) => [SX + (x - SX) * .3, y]), ...edge(1).reverse()]), 'dark', { w: 0, op: .55 }); // the shaded flank
    // the twist: the dragons' tails wound round each other, two dark ribbons crossing the spire's face
    for (const [t0, t1, wd] of [[0, .36, 3.2], [.36, .66, 2.3], [.66, .97, 1.4]]) {
      let d = '';
      for (let j = 0; j < 2; j++) {
        let open = false;
        for (let i = 0; i <= 64; i++) {
          const t = t0 + (t1 - t0) * i / 64, a = t * Math.PI * 9 + j * Math.PI;
          if (Math.cos(a) > -.05) { d += `${open ? 'L' : 'M'}${f(SX + Math.sin(a) * wAt(t))} ${f(dbase - H * t)}`; open = true; } else open = false;
        }
      }
      sp += k.line(d, wd);
    }
    // four dragons' heads thrust out at the foot, jaws agape: two in profile, one to the front
    for (const sg of [-1, 1]) {
      const x0 = SX + sg * (wAt(0) - 3), y0 = dbase - 2;
      const X = (n) => f(x0 + sg * n);
      sp += k.shape(`M${X(0)} ${f(y0 - 5)}Q${X(8)} ${f(y0 - 9)} ${X(14)} ${f(y0 - 6.5)}L${X(21)} ${f(y0 - 5)}L${X(22)} ${f(y0 - 2.6)}L${X(15)} ${f(y0 - 2)}L${X(20)} ${f(y0 + 1.4)}L${X(12)} ${f(y0 + 2.2)}Q${X(6)} ${f(y0 + 3.6)} ${X(0)} ${f(y0 + 2)}Z`, 'black', { w: .7 });
      sp += k.line(`M${X(10)} ${f(y0 - 8.4)}l${f(sg * -1.4)} -3.4M${X(6)} ${f(y0 - 7.6)}l${f(sg * -1.6)} -3`, .9) + `<circle cx="${X(14.5)}" cy="${f(y0 - 4.6)}" r=".9" fill="${P}"/>`;
    }
    sp += k.shape(`M${f(SX - 5)} ${f(dbase + 1)}q5 -8 10 0l-1.6 4.4h-6.8Z`, 'black', { w: .6 });
    // three crowns stacked high on the twist
    for (const t of [.56, .67, .77]) { const yy = dbase - H * t, w = wAt(t) + 2.6; sp += k.shape(`M${f(SX - w)} ${f(yy + 2)}h${f(2 * w)}l.8 -3.6l-1.8 1.4l-1.4 -2.2l-1.4 2.2l-1.4 -2.2l-1.4 2.2l-1.4 -2.2l-1.4 2.2l-1.4 -2.2l-1.4 2.2l-1.8 -1.4Z`, 'paper', { w: .8 }); }
    sp += k.line(`M${SX} ${f(stip)}v-8`, 1.2) + `<circle cx="${SX}" cy="${f(stip - 9)}" r="1.6" fill="${k.ink}"/>` + k.shape(`M${SX} ${f(stip - 6)}l7 1.6l-7 1.6Z`, 'dark', { w: .5 });
    ex += sp;
    // the great end gable, stepped and scrolled
    ex += k.shape(`M${B0 + 2} ${BB - EW}V${BB - EW - 14}h4v-8h4v-8h4v-8h6v-8h4v8h6v8h4v8h4v8h4V${BB - EW}Z`, 'brick', { w: 1.1 });
    ex += k.line(`M${B0 + 14} ${BB - EW - 34}v-8`, 1) + k.shape(k.rect(B0 + 10, BB - EW - 22, 14, 10), 'glass', { w: .5 });

    // ---------- the harbour water, a schooner along the quay, a fishwife rowing past
    let water = k.water(WY, RY + 4, { seed: 12 });
    water += k.shape(`M${B0} ${WY + 1}h${B1 - B0}v10h${B0 - B1}Z`, 'horiz', { w: 0, op: .4 });
    water += k.shape(`M${SX - 6} ${WY + 1}h12l-4 16h-4Z`, 'dark', { w: 0, op: .4 });
    const schooner = (x, y, L) => {
      let o = k.shape(`M${x} ${y - 8}H${x + L}l-6 8H${x + 8}Z`, 'black', { w: .8 }) + k.line(`M${x + 2} ${y - 6}H${x + L - 3}`, .6, { color: P });
      for (const [mx, mh] of [[x + L * .35, 92], [x + L * .7, 84]]) o += k.line(`M${mx} ${y - 8}V${y - mh}`, 1.6) + k.line(`M${mx} ${y - mh + 4}L${x - 30} ${y - 9}M${mx} ${y - mh + 4}L${mx + 30} ${y - 8}M${mx - 3} ${y - 30}h${L * .3}`, .5);
      return o + k.line(`M${x} ${y - 8}L${x - 30} ${y - 14}`, 1.4);
    };
    water += schooner(150, WY + 6, 90) + schooner(20, WY + 3, 70);
    water += k.shape('M300 188h44l-4 5h-36Z', 'dark', { w: .7 }) + k.figure(322, 188, .7, 'woman') + k.shape('M314 172h16l-2 3h-12Z', 'mid', { w: .5 }) + k.line('M310 182L292 194M334 182l14 12', .9);

    // ---------- our own ship: the rail and bulwark, the deck, the shrouds and ratlines going up to the mast
    let deck = k.shape(`M-5 ${RY}H645V245H-5Z`, 'paper', { w: 0 });
    deck += k.shape(`M-5 ${RY + 4}H645V${RY + 17}H-5Z`, 'dark', { w: 0 }); // the inside of the bulwark, in shadow
    deck += k.shape(`M-5 ${RY + 17}H645V245H-5Z`, 'horiz', { w: 0, op: .55 }); // the deck, scrubbed planks
    let planks = '';
    for (let i = 0; i < 12; i++) { const y0 = RY + 19 + i * i * .2 + i * 2; planks += `M-5 ${f(y0)}H645`; }
    for (let x = -20; x < 660; x += 46) planks += `M${x} ${RY + 19}l${f(-6 - (x - 320) * .03)} 34`;
    deck += k.line(planks, .6) + k.line(`M-5 ${RY + 18}H645`, 1.3);
    deck += k.shape(`M-5 ${RY + 18}L190 ${RY + 18}L120 245H-5Z`, 'mid', { w: 0, op: .5 }); // the shadow of the sails
    let stan = '';
    for (let x = 18; x < 645; x += 52) stan += k.rect(x, RY + 2, 6, 16);
    deck += k.shape(stan, 'mid', { w: .7 });
    deck += k.shape(`M-5 ${RY - 3}H645V${RY + 4}H-5Z`, 'light', { w: 1.4 }) + k.line(`M-5 ${RY + 1}H645`, .6);
    // a hatch with its tarpaulin, casks, the capstan, a coil of rope, the crew at work, a lantern
    deck += k.shape('M150 236v-16h86v16Z', 'dark', { w: 1.1 }) + k.shape('M146 220l8 -8h78l8 8Z', 'light', { w: 1 }) + k.line('M164 213v7M196 213v7M224 213v7', .7);
    const cask = (x, y, sc) => k.shape(`M${f(x - 7 * sc)} ${f(y)}q${f(-2 * sc)} ${f(-9 * sc)} 0 ${f(-18 * sc)}h${f(14 * sc)}q${f(2 * sc)} ${f(9 * sc)} 0 ${f(18 * sc)}Z`, 'mid', { w: .9 }) + k.shape(`M${f(x + 2 * sc)} ${f(y)}q${f(2 * sc)} ${f(-9 * sc)} 0 ${f(-18 * sc)}h${f(5 * sc)}q${f(2 * sc)} ${f(9 * sc)} 0 ${f(18 * sc)}Z`, 'black', { w: 0 }) + k.line(`M${f(x - 7.8 * sc)} ${f(y - 4.5 * sc)}h${f(15.6 * sc)}M${f(x - 7.8 * sc)} ${f(y - 13.5 * sc)}h${f(15.6 * sc)}`, .9);
    deck += cask(36, 240, 1.4) + cask(64, 238, 1.3) + cask(50, 216, 1.2);
    deck += k.shape('M410 238v-20q0 -4 16 -4t16 4v20Z', 'mid', { w: 1.1 }) + k.shape('M408 214q0 -5 18 -5t18 5q0 4 -18 4t-18 -4Z', 'light', { w: 1 }) + k.line('M396 213h60M426 207v12', 1.8);
    let coil = '';
    for (let i = 0; i < 5; i++) coil += `M${f(292 - i * 3.6)} 234a${f(18 - i * 3.6)} ${f(5.4 - i)} 0 1 0 ${f(2 * (18 - i * 3.6))} 0a${f(18 - i * 3.6)} ${f(5.4 - i)} 0 1 0 ${f(-2 * (18 - i * 3.6))} 0`;
    deck += k.line(coil, 1.3) + k.line('M328 234q20 -2 30 -14', 1.3);
    deck += k.figure(366, 240, 1.6, 'porter') + k.figure(512, 238, 1.45, 'man') + k.figure(548, 236, 1.2, 'porter') + k.figure(260, 216, 1, 'man');
    deck += k.line('M604 190v-30', 1.3) + k.shape('M597 160h14l-2 -9h-10Z', 'light', { w: .9 }) + k.shape('M599 151l5 -4l5 4Z', 'dark', { w: .5 });
    k.lights.push([600, 152.5, 8, 7]);
    // the shrouds: deadeyes on the rail, lines climbing to the mast top beyond the frame, ratlines across them
    const top = [-60, -170];
    let shr = '', ratl = '', eyes = '';
    const foot = [14, 42, 70, 98, 126];
    for (const x of foot) { shr += `M${x} ${RY - 10}L${top[0]} ${top[1]}`; eyes += `M${x - 4} ${RY - 9}a4 5 0 1 0 8 0a4 5 0 1 0 -8 0`; shr += `M${x} ${RY - 4}V${RY}`; }
    for (let yy = RY - 22; yy > -5; yy -= 8) {
      const t = (RY - 10 - yy) / (RY - 10 - top[1]);
      const xs = foot.map((x) => x + (top[0] - x) * t);
      for (let j = 0; j < xs.length - 1; j++) ratl += `M${f(xs[j])} ${f(yy)}Q${f((xs[j] + xs[j + 1]) / 2)} ${f(yy + 1.4)} ${f(xs[j + 1])} ${f(yy - .3)}`;
    }
    deck += k.line(shr, 1.9) + k.line(ratl, 1) + k.shape(eyes, 'black', { w: .7 });
    deck += k.line(`M214 ${RY - 2}L70 -10M268 ${RY - 2}L160 -10`, 1.2); // a backstay and a brace
    deck += k.figure(64, 104, 1, 'porter'); // a hand aloft in the ratlines

    hide(nFar, [[B0 - 5, 0, B1 + 4, BB]]); // nothing of the town behind glows through the Exchange
    return far + ex + water + deck;
  },
};
