// Flushing: from the sea dyke at the mouth of the Scheldt, wide sky and grey water. The stone windmill on the
// boulevard turns on the left; the Zeeland mail steamer stands out to sea for Folkestone, trailing coal smoke; the
// lighthouse marks the harbour mouth on its pier at the right. Fisherfolk mend nets by a beached bomschuit.

export default {
  id: 'FLU',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(23);
    const HZ = 150; // the horizon at sea

    // ---------- far: the Flemish shore across the estuary, sails, the sea
    let sea = k.water(HZ, 214, { seed: 4, far: false });
    let swell = '';
    for (let i = 0; i < 46; i++) { const t = Math.pow(r(), 1.3), y = HZ + 2 + t * 56, x = r() * 650, w = 6 + t * 30; swell += `M${f(x)} ${f(y)}q${f(w / 2)} ${f(-1 - t * 2)} ${f(w)} 0`; }
    sea += k.line(swell, .6);
    sea += k.shape(`M-5 ${HZ}H645V${HZ + 9}H-5Z`, 'horiz', { w: 0, op: .5 }); // a squall darkening the far water
    sea += k.shape(`M-5 ${HZ + 30}Q200 ${HZ + 26} 400 ${HZ + 32}T645 ${HZ + 28}V${HZ + 40}Q420 ${HZ + 44} 200 ${HZ + 38}T-5 ${HZ + 40}Z`, 'horiz', { w: 0, op: .35 });
    let shore = k.shape(`M-5 ${HZ}L60 ${HZ - 3}L180 ${HZ - 2}L260 ${HZ - 4}L420 ${HZ - 2}L645 ${HZ - 3}V${HZ + 1}H-5Z`, 'mid', { far: true, w: .5 });
    shore += k.shape(k.rect(318, HZ - 14, 3, 11), 'dark', { far: true, w: .4 }) + k.shape(k.spire(319.5, HZ - 14, 4, 7), 'dark', { far: true, w: .4 });
    shore += k.haze(HZ - 14, 16, .3);
    const sail = (x, y, sc) => k.shape(`M${f(x - 7 * sc)} ${f(y - 3 * sc)}h${f(14 * sc)}l${f(-3 * sc)} ${f(3 * sc)}h${f(-9 * sc)}Z`, 'dark', { w: .5, far: sc < .8 }) + k.shape(k.poly([[x, y - 4 * sc], [x, y - 22 * sc], [x + 9 * sc, y - 5 * sc]]), 'light', { w: .5, far: sc < .8 }) + k.shape(k.poly([[x - 1, y - 20 * sc], [x - 1, y - 5 * sc], [x - 8 * sc, y - 5 * sc]]), 'mid', { w: .5, far: sc < .8 });
    shore += sail(150, HZ + 6, .55) + sail(205, HZ + 4, .45) + sail(452, HZ + 8, .6);

    // ---------- the harbour mouth: two piers on piles, the lighthouse at the head of the near one
    let pier = k.skyline(560, 660, HZ + 4, { seed: 41, style: 'north', hMin: 10, hMax: 22, wMin: 10, wMax: 16 });
    for (const [x, sc] of [[586, 1.3], [624, 1]]) pier += k.shape(k.rect(x - 2, HZ - 28, 4, 30), 'dark', { far: true, w: .4 }) + k.smoke(x, HZ - 30, sc, { seed: x });
    pier += k.shape(k.rect(540, HZ + 4, 110, 4), 'mid', { far: true, w: .5 });
    for (let x = 544; x < 645; x += 7) pier += k.line(`M${x} ${HZ + 8}v4`, .6, { far: true });
    pier += k.shape(k.rect(556, HZ - 6, 5, 10), 'light', { far: true, w: .5 }) + k.shape(k.rect(555, HZ - 9, 7, 3), 'dark', { far: true, w: .4 });
    const PY = 178;
    pier += k.shape(k.poly([[468, PY - 3], [650, PY - 6], [650, PY], [468, PY + 2]]), 'light', { w: .9 });
    let piles = '';
    for (let x = 470; x < 650; x += 8) piles += `M${x} ${f(PY + 2 - (x - 468) * .02)}V${f(PY + 10)}`;
    for (let x = 474; x < 650; x += 16) piles += `M${x - 4} ${f(PY + 2)}L${x + 4} ${f(PY + 9)}`;
    pier += k.line(piles, .9) + k.shape(k.rect(466, PY - 6, 10, 18), 'dark', { w: .8 });
    // the lighthouse: a tapering iron tower in bands, gallery, lantern, cupola
    const LX = 498, LB = PY - 4, LT = 62;
    let lh = k.shape(k.poly([[LX - 9, LB], [LX - 5, LT + 14], [LX + 5, LT + 14], [LX + 9, LB]]), 'light', { w: 1.2 });
    for (let i = 0; i < 4; i++) { const y0 = LB - 14 - i * 26, y1 = y0 - 13, w0 = 9 - (LB - y0) / (LB - LT - 14) * 4, w1 = 9 - (LB - y1) / (LB - LT - 14) * 4; lh += k.shape(k.poly([[LX - w0, y0], [LX - w1, y1], [LX + w1, y1], [LX + w0, y0]]), 'dark', { w: .6 }); }
    lh += k.shape(k.poly([[LX + 2, LB], [LX + 1, LT + 14], [LX + 5, LT + 14], [LX + 9, LB]]), 'mid', { w: 0, op: .7 });
    lh += k.shape(k.rect(LX - 9, LT + 11, 18, 3), 'dark', { w: .8 }) + k.line(`M${LX - 9} ${LT + 11}v-4h18v4M${LX - 6} ${LT + 7}v4M${LX} ${LT + 7}v4M${LX + 6} ${LT + 7}v4`, .6);
    lh += k.shape(k.rect(LX - 5, LT, 10, 11), 'glass', { w: .9 }) + k.shape(k.dome(LX, LT, 6, 6), 'black', { w: .8 }) + k.line(`M${LX} ${LT - 8}v-6`, 1);
    k.lights.push([LX - 4, LT + 1, 8, 9]);
    lh += k.shape(k.rect(LX - 2.4, LB - 12, 4.8, 8), 'black', { w: .5 });

    // ---------- the mail steamer, standing out to sea, two raked funnels, coal smoke astern
    const steamer = (x0, wl, L, dir) => { // x0: bow; extends L px astern (dir -1: bow on the left)
      const X = (u) => x0 - u * L * dir; // u from 0 (bow) to 1 (stern)
      const Y = (v) => wl - v * L; // v in hull lengths, up
      let o = k.shape(`M${f(X(0))} ${f(Y(.085))}Q${f(X(.03))} ${f(Y(.02))} ${f(X(.07))} ${f(Y(0))}H${f(X(.93))}Q${f(X(.99))} ${f(Y(.02))} ${f(X(1))} ${f(Y(.068))}Q${f(X(.5))} ${f(Y(.052))} ${f(X(0))} ${f(Y(.085))}Z`, 'black', { w: 1.1 });
      o += k.line(`M${f(X(.02))} ${f(Y(.074))}Q${f(X(.5))} ${f(Y(.044))} ${f(X(.98))} ${f(Y(.06))}`, .9, { color: P });
      o += k.shape(k.poly([[X(.22), Y(.06)], [X(.24), Y(.1)], [X(.8), Y(.1)], [X(.82), Y(.056)]]), 'light', { w: .9 });
      o += k.windows(Math.min(X(.26), X(.78)), Y(.095), Math.abs(X(.78) - X(.26)), L * .03, 16, 1, { lit: .55, ww: .5 });
      o += k.shape(k.poly([[X(.3), Y(.1)], [X(.31), Y(.125)], [X(.46), Y(.125)], [X(.47), Y(.1)]]), 'light', { w: .8 }); // the bridge
      o += k.line(`M${f(X(.29))} ${f(Y(.125))}H${f(X(.49))}`, 1.2);
      for (const u of [.52, .64]) {
        const fx = X(u), lean = -.03 * L * dir;
        o += k.shape(k.poly([[fx - .022 * L, Y(.1)], [fx - .022 * L + lean, Y(.205)], [fx + .022 * L + lean, Y(.205)], [fx + .022 * L, Y(.1)]]), 'black', { w: .8 });
        o += k.shape(k.poly([[fx - .023 * L + lean * .75, Y(.18)], [fx - .023 * L + lean * .82, Y(.19)], [fx + .023 * L + lean * .82, Y(.19)], [fx + .023 * L + lean * .75, Y(.18)]]), 'paper', { w: .4 });
      }
      o += k.line(`M${f(X(.16))} ${f(Y(.065))}L${f(X(.17))} ${f(Y(.3))}M${f(X(.86))} ${f(Y(.06))}L${f(X(.87))} ${f(Y(.26))}M${f(X(.17))} ${f(Y(.3))}L${f(X(0))} ${f(Y(.085))}M${f(X(.17))} ${f(Y(.3))}L${f(X(.87))} ${f(Y(.26))}L${f(X(1))} ${f(Y(.068))}`, .6);
      o += k.smoke(X(.52) - .03 * L * dir, Y(.215), 1.5, { seed: 8 }) + k.smoke(X(.64) - .03 * L * dir, Y(.215), 1.25, { seed: 13 });
      o += k.line(`M${f(X(-.02))} ${f(wl - 1)}q${f(-6 * dir)} -2 ${f(-14 * dir)} 1M${f(X(.4))} ${f(wl + 1.5)}h${f(-.4 * L * dir)}M${f(X(1))} ${f(wl)}q${f(10 * dir)} 3 ${f(30 * dir)} 1`, .8, { color: P });
      return o;
    };
    const ship = steamer(226, 182, 200, -1);

    // ---------- the dyke and the windmill on it
    let dyke = k.shape('M-5 197L136 194Q186 196 222 210Q240 217 262 219V245H-5Z', 'stipple', { w: 0 }) + k.line('M-5 197L136 194Q186 196 222 210Q240 217 262 219', 1.3);
    dyke += k.shape('M-5 214Q80 208 150 214Q200 222 230 245H-5Z', 'mid', { w: 0, op: .45 }); // the dyke's flank going down into shadow
    dyke += k.shape('M-5 197L136 194L148 199Q90 201 -5 206Z', 'paper', { w: .6 }); // the crest walk
    let toe = '';
    for (let i = 0; i < 9; i++) { const x = 178 + i * 10.5, y = 204 + i * 2.2 + (i > 4 ? (i - 4) * 1.4 : 0); toe += `M${f(x)} ${f(y + 9)}l1 -7q4 -3 9 -1l1 8Z`; }
    dyke += k.shape(toe, 'black', { w: .6 }) + k.line('M178 214Q220 222 262 226', .8, { color: P });
    let tufts = '';
    for (let i = 0; i < 40; i++) { const x = r() * 250, y = 208 + r() * 32; tufts += `M${f(x)} ${f(y)}l-1 -3M${f(x + 1.4)} ${f(y)}l.8 -3.4`; }
    dyke += k.line(tufts, .55);
    let rail = 'M-5 189H138';
    for (let x = 0; x < 140; x += 14) rail += `M${x} 197V187`;
    dyke += k.line(rail, .9) + k.lamp(126, 195, 1.15);
    k.lights.push([123.6, 161.8, 4.8, 4.8]);
    // the mill: a tapering stone tower, its stage, the cap, four sails across the sky
    const MX = 82, MB = 196, MT = 86;
    let mill = k.shape(k.poly([[MX - 27, MB], [MX - 17, MT], [MX + 17, MT], [MX + 27, MB]]), 'light', { w: 1.3 });
    mill += k.shape(k.poly([[MX + 4, MB], [MX + 3, MT], [MX + 17, MT], [MX + 27, MB]]), 'dark', { w: 0 });
    mill += k.shape(k.poly([[MX + 17, MT], [MX + 27, MB], [MX + 22, MB], [MX + 13.5, MT]]), 'black', { w: 0 });
    mill += k.windows(MX - 12, MT + 14, 12, 56, 1, 3, { arched: true, ww: .55, wh: .55 });
    mill += k.shape(k.arch(MX - 6, MB - 20, 12, 20), 'black', { w: .8 });
    // the stage, on struts
    mill += k.shape(k.rect(MX - 36, 146, 72, 4), 'dark', { w: .9 }) + k.line(`M${MX - 34} 150L${MX - 23} 168M${MX + 34} 150L${MX + 23} 168M${MX - 36} 140V146M${MX + 36} 140V146M${MX - 36} 140H${MX + 36}`, .9);
    mill += k.shape(`M${MX - 20} ${MT}Q${MX - 20} ${MT - 18} ${MX} ${MT - 19}Q${MX + 20} ${MT - 18} ${MX + 20} ${MT}Z`, 'dark', { w: 1.2 }); // the cap
    // the sails: two stocks crossing, each with a lattice of sail bars
    const hub = [MX - 2, MT - 6];
    const sailArm = (a, len) => {
      const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
      const p = (t, w) => [hub[0] + ca * t + nx * w, hub[1] + sa * t + ny * w];
      let d = k.shape(k.poly([p(12, 1), p(len, 1), p(len, 13), p(14, 12)]), 'light', { w: .8 });
      let bars = '';
      for (let t = 18; t < len; t += 7) bars += `M${f(p(t, 1)[0])} ${f(p(t, 1)[1])}L${f(p(t, 12.5)[0])} ${f(p(t, 12.5)[1])}`;
      bars += `M${f(p(14, 6.5)[0])} ${f(p(14, 6.5)[1])}L${f(p(len, 7)[0])} ${f(p(len, 7)[1])}`;
      d += k.line(bars, .55) + k.line(`M${f(hub[0])} ${f(hub[1])}L${f(p(len + 2, 0)[0])} ${f(p(len + 2, 0)[1])}`, 2.2);
      return d;
    };
    for (const a of [-2.3, -.73, .84, 2.41]) mill += sailArm(a, a > 0 && a < 1.5 ? 98 : 84);
    mill += `<circle cx="${hub[0]}" cy="${hub[1]}" r="3.6" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width="1"/>`;

    // ---------- the beach: a bomschuit pulled up, nets on poles, groynes, fisherfolk
    let beach = k.shape('M222 210Q300 206 420 207T645 204V245H262Z', 'paper', { w: 0 }) + k.line('M232 211Q300 206 420 207T645 204', 1.1);
    beach += k.shape('M240 213Q300 209 420 210T645 207V218Q520 219 420 218T262 222Z', 'horiz', { w: 0, op: .6 }); // the wet sand at the tide line
    let sand = '';
    for (let i = 0; i < 46; i++) { const x = 262 + r() * 383, y = 220 + r() * 20; sand += `M${f(x)} ${f(y)}h${f(1.5 + (y - 205) * .14)}`; }
    beach += k.line(sand, .5) + k.line('M244 212q60 -5 170 -4t231 -4', .8, { color: P });
    let groyne = '';
    for (let i = 0; i < 10; i++) { const x = 616 - i * 13, y = 216 - i * 4.4; groyne += `M${x} ${f(y)}v${f(-8 + i * .55)}`; }
    beach += k.line(groyne, 1.8);
    const bom = (x, y) => { // a flat-bottomed fishing boat drawn up on the sand, mast stepped
      let b = k.shape(`M${x} ${y - 18}Q${x + 2} ${y - 2} ${x + 20} ${y}H${x + 88}Q${x + 106} ${y - 4} ${x + 108} ${y - 22}Q${x + 60} ${y - 14} ${x} ${y - 18}Z`, 'dark', { w: 1.1 });
      b += k.shape(`M${x + 86} ${y - 2}Q${x + 104} ${y - 6} ${x + 108} ${y - 22}L${x + 98} ${y - 20}Q${x + 96} ${y - 8} ${x + 84} ${y - 4}Z`, 'black', { w: 0 });
      b += k.line(`M${x + 4} ${y - 14}Q${x + 60} ${y - 9} ${x + 104} ${y - 18}`, .8, { color: P });
      b += k.line(`M${x + 50} ${y - 15}V${y - 76}M${x + 50} ${y - 74}L${x + 104} ${y - 22}M${x + 50} ${y - 74}L${x + 4} ${y - 18}`, .8) + k.line(`M${x + 50} ${y - 15}V${y - 76}`, 2);
      b += k.shape(`M${x + 52} ${y - 70}q8 6 6 24q-4 10 -6 24Z`, 'mid', { w: .6 }); // the furled sail
      b += k.shape(`M${x + 10} ${y}a8 3 0 1 1 16 0Z`, 'mid', { w: .5 }); // the anchor rope coiled
      return b;
    };
    beach += bom(474, 228);
    let nets = '';
    for (const nx of [292, 338, 384]) nets += `M${nx} 226V186`;
    beach += k.line(nets, 1.6);
    let mesh = '';
    for (const [a0, a1] of [[292, 338], [338, 384]]) {
      for (let j = 0; j < 4; j++) mesh += `M${a0} ${190 + j * 4}Q${(a0 + a1) / 2} ${206 + j * 5} ${a1} ${190 + j * 4}`;
      for (let x = a0 + 4; x < a1; x += 4.5) { const t = (x - a0) / (a1 - a0), sag = Math.sin(t * Math.PI); mesh += `M${f(x)} ${f(190 + sag * 7.5)}v${f(12 + sag * 7)}`; }
    }
    beach += k.line(mesh, .45);
    // a basket of fish, a coil of rope
    beach += k.shape('M352 232h18l-2 -7h-14Z', 'light', { w: .7 }) + k.shape('M354 225q7 -5 14 0Z', 'stipple', { w: .5 }) + k.shape('M566 236a9 3.4 0 1 1 18 0Z', 'mid', { w: .6 });
    // gulls over the water, a tug with a string of coal lighters far off
    let gulls = '';
    for (const [gx, gy, gs] of [[300, 70, 1], [322, 82, .8], [604, 120, 1.1], [166, 128, .7], [420, 58, .7]]) gulls += `M${gx - 4 * gs} ${gy}q${2 * gs} ${-2.4 * gs} ${4 * gs} 0q${2 * gs} ${-2.4 * gs} ${4 * gs} 0`;
    beach += k.line(gulls, .8);
    const tug = k.shape('M150 164h22l-3 4h-17Z', 'black', { w: .5 }) + k.shape(k.rect(157, 158, 7, 6), 'dark', { w: .4 }) + k.shape(k.rect(165, 154, 2.5, 6), 'black', { w: .3 }) + k.smoke(166, 153, .6, { seed: 2 })
      + k.shape('M118 166h22l-2 3h-18ZM92 167h20l-2 2.6h-16Z', 'dark', { w: .5 }) + k.line('M140 166.5h10M112 167.5h6', .5);
    const folk = k.figure(316, 230, 1.08, 'porter') + k.figure(410, 234, 1.12, 'woman') + k.shape('M405 211q5 -4 10 0v5h-10Z', 'light', { w: .5 }) + k.figure(452, 226, .98, 'man') + k.figure(606, 238, 1.15, 'porter') + k.figure(40, 197, .82, 'man') + k.figure(54, 197, .8, 'woman') + k.figure(110, 196, .8, 'soldier');
    const ref = k.reflect(ship, 182, .16);

    return shore + sea + tug + ref + pier + lh + ship + dyke + mill + beach + folk;
  },
};
