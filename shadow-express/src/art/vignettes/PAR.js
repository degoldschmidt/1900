// Paris: up a wet avenue of the Left Bank. A Haussmann block in shadow, a café under its awnings, runs down the left
// to the vanishing point; on the right, past the railings of the Champ de Mars, the Eiffel Tower looms over the
// gardens. A fiacre in the rain, a coal-heaver and a porter on the cobbles, a gas lamp and a Morris column.

export default {
  id: 'PAR',
  draw(k) {
    const f = k.f, P = k.paper;
    // one-point perspective: the eye 3 m above the street, vanishing point (VX, VY), focal length FL px
    const FL = 400, VX = 205, VY = 184, EYE = 3;
    const p3 = (X, Y, Z) => [VX + FL * X / Z, VY - FL * (Y - EYE) / Z];
    const sc = (Z) => FL / Z;
    const zAt = (y) => FL * EYE / (y - VY); // the depth of a ground point at screen y
    const quad = (X, y0, y1, z0, z1) => k.poly([p3(X, y0, z0), p3(X, y0, z1), p3(X, y1, z1), p3(X, y1, z0)]);
    const seg = (a, b) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    const light = (pts) => { // remember a lit window by its bounding box
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      k.lights.push([f(Math.min(...xs)), f(Math.min(...ys)), f(Math.max(...xs) - Math.min(...xs)), f(Math.max(...ys) - Math.min(...ys))]);
    };
    const hide = (x0, y0, x1, y1) => { for (let i = k.lights.length - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (x + w > x0 && x < x1 && y + h > y0 && y < y1) k.lights.splice(i, 1); } };
    const X0 = -17; // the facade plane of the left block

    // ---------- far: the roofs of Grenelle on the horizon, soot
    let far = k.skyline(196, 660, VY + 1, { seed: 21, style: 'paris', hMin: 5, hMax: 12, wMin: 16, wMax: 30 });
    for (const [x, h] of [[371, 58], [622, 44]]) far += k.shape(k.poly([[x - 2.6, VY], [x - 1.5, VY - h], [x + 1.5, VY - h], [x + 2.6, VY]]), 'dark', { far: true, w: .6 }) + k.smoke(x, VY - h - 2, 1.5, { seed: x });
    far += k.haze(VY - 30, 32, .38);
    hide(-10, 0, 205, 200); // far windows that fall behind the block must not glow through it

    // ---------- the Eiffel Tower: four legs flaring to the ground, the great arch, three platforms, the lantern
    const tower = (cx, y0, H) => {
      const s = H / 312;
      const ex = (h) => 1.14 + .42 * Math.pow(Math.max(0, 1 - h / 312), 2.6); // the flare is exaggerated toward the feet
      const pt = (xm, hm) => [cx + xm * s * ex(hm), y0 - hm * s];
      const crv = (ha, wa, hb, wb, pw) => (h) => wb + (wa - wb) * Math.pow(1 - Math.min(1, Math.max(0, (h - ha) / (hb - ha))), pw);
      const run = (fn, h0, h1, n, sg) => Array.from({ length: n + 1 }, (_, i) => { const h = h0 + (h1 - h0) * i / n; return pt(sg * fn(h), h); });
      const oA = crv(0, 62.5, 52, 35, 1.9), iA = crv(0, 37.5, 52, 19.5, 1.55);
      const oB = crv(59, 33.5, 114, 21, 1.35), iB = crv(59, 18.5, 114, 7.5, 1.2);
      const oC = crv(119, 20, 274, 9, 1.9), iC = (h) => (h >= 205 ? 0 : crv(119, 7, 205, 0, 1.15)(h));
      let s1 = '', lat = '';
      const lattice = (fo, fi, h0, h1, n, sg) => { // ties and cross-bracing, white line on the dark iron
        const o = run(fo, h0, h1, n, sg), i = run(fi, h0, h1, n, sg);
        for (let j = 0; j <= n; j++) lat += seg(o[j], i[j]);
        for (let j = 0; j < n; j++) lat += seg(o[j], i[j + 1]) + seg(i[j], o[j + 1]);
      };
      for (const sg of [-1, 1]) {
        const tone = sg < 0 ? 'dark' : 'black';
        s1 += k.shape(k.poly([...run(oA, 0, 52, 12, sg), ...run(iA, 52, 0, 12, sg)]), tone, { w: 1.5 });
        s1 += k.shape(k.poly([...run(oB, 59, 114, 6, sg), ...run(iB, 114, 59, 6, sg)]), tone, { w: 1.1 });
        s1 += k.shape(k.poly([...run(oC, 119, 274, 12, sg), ...run(iC, 274, 119, 12, sg)]), tone, { w: 1 });
        lattice(oA, iA, 0, 52, 9, sg); lattice(oB, iB, 59, 114, 6, sg); lattice(oC, iC, 119, 205, 8, sg);
        s1 += k.shape(k.poly([pt(sg * 65, 0), pt(sg * 65, 6), pt(sg * 35, 6), pt(sg * 35, 0)]), sg < 0 ? 'light' : 'dark', { w: .9 }); // masonry feet
      }
      for (let h = 205; h < 268; h += 9) lat += seg(pt(-oC(h), h), pt(oC(h), h)) + seg(pt(-oC(h), h), pt(oC(h + 9), h + 9)) + seg(pt(oC(h), h), pt(-oC(h + 9), h + 9));
      s1 += k.line(lat, .5, { color: P });
      // the great arch under the first platform
      let ao = '', ai = '';
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * i / 16, po = pt(-Math.cos(a) * 34, 6 + Math.sin(a) * 45), pi = pt(-Math.cos(a) * 30.5, 6 + Math.sin(a) * 40.5);
        ao += `${i ? 'L' : 'M'}${f(po[0])} ${f(po[1])}`; ai = `L${f(pi[0])} ${f(pi[1])}` + ai;
      }
      s1 += k.shape(ao + ai + 'Z', 'dark', { w: .9 });
      // platforms: the first with its arcade, the second, the third, then the lantern and the flagstaff
      const band = (h0, h1, hw, tone) => k.shape(k.poly([pt(-hw, h0), pt(hw, h0), pt(hw, h1), pt(-hw, h1)]), tone, { w: 1.1 });
      s1 += band(50.5, 60.5, 38.5, 'light');
      let arc = '';
      const a0 = pt(-36.5, 52), a1 = pt(36.5, 52), n = 15, aw = (a1[0] - a0[0]) / n, ay = pt(0, 59)[1], ah = pt(0, 52.5)[1] - ay;
      for (let i = 0; i < n; i++) arc += k.arch(a0[0] + i * aw + aw * .2, ay, aw * .6, ah);
      s1 += k.shape(arc, 'black', { w: .4 });
      s1 += band(60.5, 63, 36, 'dark');
      s1 += band(112.5, 119, 23.5, 'light') + band(119, 121, 21.5, 'dark');
      s1 += band(272, 279, 11.5, 'light');
      s1 += k.shape(k.poly([pt(-6, 279), pt(6, 279), pt(5.4, 291), pt(-5.4, 291)]), 'mid', { w: .8 });
      s1 += k.shape(k.dome(cx, pt(0, 291)[1], 5.6 * s * 1.14, 7 * s), 'dark', { w: .8 });
      s1 += k.line(seg(pt(0, 298), pt(0, 314)), 1);
      const fl = pt(0, 314);
      s1 += k.shape(`M${f(fl[0])} ${f(fl[1])}q4 -1.4 8.5 0v4.4q-4.5 -1.4 -8.5 0Z`, 'mid', { w: .5 });
      return s1;
    };
    const TZ = 700, TX = 482;
    const eiffel = tower(TX, VY + FL * EYE / TZ, 312 * FL / TZ);

    // ---------- the park: far trees round the tower's feet, nearer chestnuts
    const crown = (x, yg, s) => { // a chestnut standing on ground y, s px per metre: a scalloped crown, its shadow side dark
      const R = 3.3 * s, cy = yg - 8.4 * s, far = s < 1.6, n = 9;
      let d = '';
      for (let i = 0; i <= n; i++) {
        const a = Math.PI * 2 * i / n + .3, px = x + Math.cos(a) * R * (1 + (i % 2) * .08), py = cy + Math.sin(a) * R * (Math.sin(a) > 0 ? .62 : 1.08);
        d += i ? `A${f(R * .42)} ${f(R * .38)} 0 0 1 ${f(px)} ${f(py)}` : `M${f(px)} ${f(py)}`;
      }
      let t = k.line(`M${f(x)} ${f(yg)}V${f(cy + R * .3)}`, Math.max(.6, s * .3));
      t += k.shape(d + 'Z', 'stipple', { w: far ? .5 : .7, far });
      if (!far) t += k.shape(`M${f(x - R * .3)} ${f(cy + R * .6)}Q${f(x + R * .9)} ${f(cy + R * .65)} ${f(x + R * 1.02)} ${f(cy - R * .1)}Q${f(x + R * .55)} ${f(cy + R * .3)} ${f(x - R * .3)} ${f(cy + R * .6)}Z`, 'dark', { w: 0 });
      return t;
    };
    let park = '';
    for (const [x, y] of [[248, 187.5], [272, 188], [298, 187.6], [326, 188.4], [356, 188], [392, 188.6], [425, 188], [536, 188.3], [566, 188], [598, 188.6], [628, 188]]) park += crown(x, y, (y - VY) / EYE * 1.1);
    for (const [x, y] of [[300, 196], [352, 199], [596, 201], [632, 196]]) park += crown(x, y, (y - VY) / EYE);

    // ---------- the left side: a Haussmann block in shadow, receding to the vanishing point
    let block = '', smoke = '';
    const blocks = [[28, 44, 18.2], [44, 60, 19.2], [60, 76, 17.6], [76, 93, 18.6], [93, 112, 18], [112, 132, 19]];
    const floors = [[5.1, 6.8], [7.7, 10.2], [11, 13.4], [14.2, 15.9], [16.5, 17.7]];
    blocks.forEach(([z0, z1, hc], bi) => {
      const far = bi >= 4;
      block += k.shape(quad(X0, 0, hc, z0, z1), 'dark', { w: .9, far });
      block += k.shape(k.poly([p3(X0, hc, z0), p3(X0, hc, z1), p3(X0 - 2.6, hc + 4.6, z1), p3(X0 - 2.6, hc + 4.6, z0)]), 'mid', { w: .8, far }); // the mansard
      const nb = Math.round((z1 - z0) / 3.5), bw = (z1 - z0) / nb;
      let wins = '', dorm = '', shut = '';
      for (let b = 0; b < nb; b++) {
        const za = z0 + (b + .3) * bw, zb = z0 + (b + .7) * bw;
        for (const [y0, y1] of floors) {
          const pts = [p3(X0, y0, za), p3(X0, y0, zb), p3(X0, y1, zb), p3(X0, y1, za)];
          wins += k.poly(pts);
          if (k.rand() < .32) light(pts);
          if (!far) shut += seg(p3(X0, y0 - .25, za - .2), p3(X0, y0 - .25, zb + .2)); // the sills, in white
        }
        const dp = [p3(X0 - 1, hc + 1.3, za), p3(X0 - 1, hc + 1.3, zb), p3(X0 - 1, hc + 3.1, zb), p3(X0 - 1, hc + 3.1, za)];
        dorm += k.poly(dp);
        if (k.rand() < .3) light(dp);
      }
      block += k.shape(wins, 'black', { w: .5, far }) + k.shape(dorm, 'light', { w: .5, far }) + (shut ? k.line(shut, .7, { color: P }) : '');
      // balconies and cornice picked out in white line, as an engraver does on a shadowed face
      for (const y of [7.3, 16.2]) {
        block += k.line(seg(p3(X0, y, z0), p3(X0, y, z1)), far ? .5 : Math.max(.6, sc(z0) * .09), { color: P });
        let rail = '';
        if (bi < 3) for (let z = z0 + .7; z < z1; z += .7) rail += seg(p3(X0, y, z), p3(X0, y + .9, z));
        if (rail) block += k.line(rail + seg(p3(X0, y + .9, z0), p3(X0, y + .9, z1)), .45, { color: P });
      }
      block += k.line(seg(p3(X0, hc, z0), p3(X0, hc, z1)), far ? .6 : 1.8) + k.line(seg(p3(X0, 0, z0), p3(X0, hc, z0)), .7, { color: P });
      // shop fronts: black openings, striped awnings over most
      let shops = '', awn = '', stripes = '';
      for (let b = 0; b < nb; b++) {
        const za = z0 + (b + .1) * bw, zb = z0 + (b + .9) * bw;
        shops += k.poly([p3(X0, .2, za), p3(X0, .2, zb), p3(X0, 3.7, zb), p3(X0, 3.7, za)]);
        if (bi < 3) light([p3(X0, .9, za + .3), p3(X0, .9, zb - .3), p3(X0, 3.1, zb - .3), p3(X0, 3.1, za + .3)]);
        if ((b + bi) % 4 !== 2) {
          awn += k.poly([p3(X0, 4.1, za), p3(X0, 4.1, zb), p3(X0 + 2.3, 2.8, zb), p3(X0 + 2.3, 2.8, za)]);
          if (!far) for (let z = za + .45; z < zb; z += .9) stripes += k.poly([p3(X0, 4.1, z), p3(X0, 4.1, z + .45), p3(X0 + 2.3, 2.8, z + .45), p3(X0 + 2.3, 2.8, z)]);
        }
      }
      block += k.shape(shops, 'black', { w: .5, far }) + k.shape(awn, 'paper', { w: .6, far }) + (stripes ? k.shape(stripes, 'mid', { w: 0 }) : '');
      // the party-wall chimney stack, smoking
      const c0 = p3(X0 - 2.2, hc + 3.8, z0), sw = Math.max(2.4, sc(z0) * 1.6), ch = Math.max(4, sc(z0) * 2.6);
      block += k.shape(k.rect(c0[0] - sw / 2, c0[1] - ch, sw, ch), 'black', { w: .6, far });
      let pots = '';
      for (let i = 0; i < 3; i++) pots += k.rect(c0[0] - sw / 2 + sw * (.12 + i * .3), c0[1] - ch - sw * .35, sw * .18, sw * .35);
      block += k.shape(pots, 'dark', { w: .4, far });
      if (bi % 2 === 1 || bi === 0) smoke += k.smoke(c0[0], c0[1] - ch - 2, Math.max(.7, 1.7 - bi * .2), { seed: 40 + bi });
    });
    // further down the avenue, in sepia, to the vanishing point
    block += k.shape(quad(X0, 0, 18.5, 132, 900), 'light', { far: true, w: .5 });
    block += k.shape(k.poly([p3(X0, 18.5, 132), p3(X0, 18.5, 900), p3(X0 - 2.6, 22.8, 900), p3(X0 - 2.6, 22.8, 132)]), 'mid', { far: true, w: .4 });
    let farWin = '';
    for (let z = 135; z < 700; z *= 1.06) farWin += seg(p3(X0, 1.5, z), p3(X0, 17, z));
    block += k.line(farWin, .5, { far: true });

    // ---------- the ground: pavements, kerbs, the wet cobbled roadway, the lawns of the park
    let ground = k.shape(`M-5 ${VY}H645V245H-5Z`, 'paper', { w: 0 });
    const kerbL = -13, kerbR = 9, lawn = 13;
    ground += k.shape(k.poly([p3(kerbL, 0, 3000), p3(kerbR, 0, 3000), p3(kerbR, 0, 12), p3(kerbL, 0, 12)]), 'horiz', { w: 0, op: .6 }); // the wet sheen
    ground += k.shape(k.poly([p3(lawn, 0, 3000), [645, VY + .6], [645, 245], p3(lawn, 0, 9)]), 'stipple', { w: 0, far: true });
    let tuft = '';
    for (let i = 0; i < 70; i++) { const y = VY + 3 + Math.pow(i / 70, 1.6) * 56, x0 = VX + FL * (lawn + 1) / zAt(y), x = x0 + ((i * 97) % 61) / 61 * (640 - x0), h = 1 + (y - VY) * .07; tuft += `M${f(x)} ${f(y)}l${f(-h * .4)} ${f(-h)}M${f(x + 1)} ${f(y)}l${f(h * .3)} ${f(-h * 1.1)}`; }
    ground += k.line(tuft, .5);
    // cobbles in perspective, one path
    let cob = '';
    for (let n = 0; ; n++) {
      const y = VY + 2.4 * Math.pow(1.2, n);
      if (y > 242) break;
      const Z = zAt(y), xl = VX + FL * kerbL / Z, xr = VX + FL * kerbR / Z, w = (y - VY) * .5 + 1.4;
      for (let x = xl + ((n % 2) * w) / 2; x < xr - w * .6; x += w) cob += `M${f(x)} ${f(y)}q${f(w * .45)} ${f(-.8 - (y - VY) * .05)} ${f(w * .88)} 0`;
    }
    ground += k.line(cob, .55);
    ground += k.line(seg(p3(kerbL, 0, 3000), p3(kerbL, 0, 12)) + seg(p3(kerbR, 0, 3000), p3(kerbR, 0, 12)), 1.4) + k.line(seg(p3(lawn, 0, 3000), p3(lawn, 0, 9)), .8);
    // the block's shadow across the roadway; puddles that hold the sky, with a glint
    ground += k.shape(k.poly([p3(kerbL, 0, 3000), p3(-5, 0, 3000), p3(-5, 0, 12), p3(kerbL, 0, 12)]), 'mid', { w: 0, op: .55 });
    let wet = '', glint = '';
    for (const [x, y, w] of [[112, 200, 50], [226, 210, 74], [60, 222, 70], [290, 230, 110], [160, 236, 80], [372, 219, 46], [20, 236, 40]]) {
      const d = 1.6 + (y - VY) * .07;
      wet += `M${x} ${y}q${f(w * .5)} ${f(-d)} ${w} 0q${f(-w * .5)} ${f(d * .9)} ${-w} 0Z`;
      glint += `M${f(x + w * .2)} ${f(y - d * .15)}h${f(w * .35)}`;
    }
    ground += k.shape(wet, 'water', { w: .5 }) + k.line(glint, .8, { color: P });

    // ---------- street furniture and life
    const at = (yg) => (yg - VY) / EYE; // px per metre for something standing on ground y
    const morris = (x, yg) => { // the Morris column: a drum of playbills under a little dome
      const s = at(yg), w = .62 * s, h = 3.4 * s;
      let m = k.shape(k.rect(x - w, yg - h, 2 * w, h), 'light', { w: 1 }) + k.shape(k.rect(x + w * .25, yg - h, w * .75, h), 'dark', { w: 0 });
      m += k.shape(k.rect(x - w * .85, yg - h * .8, w * .95, h * .26), 'paper', { w: .5 }) + k.shape(k.rect(x - w * .8, yg - h * .48, w * .75, h * .22), 'horiz', { w: .5 }) + k.shape(k.rect(x - w * .2, yg - h * .5, w * .9, h * .3), 'paper', { w: .5 });
      m += k.line(`M${f(x - w * .7)} ${f(yg - h * .72)}h${f(w * .6)}M${f(x - w * .7)} ${f(yg - h * .67)}h${f(w * .45)}M${f(x - w * .1)} ${f(yg - h * .4)}h${f(w * .6)}M${f(x - w * .1)} ${f(yg - h * .34)}h${f(w * .5)}`, .6);
      m += k.shape(k.rect(x - w * 1.18, yg - h - .3 * s, w * 2.36, .3 * s), 'dark', { w: .8 }) + k.shape(k.dome(x, yg - h - .3 * s, w * 1.02, w * .85), 'mid', { w: .8 });
      return m + k.line(`M${f(x)} ${f(yg - h - .3 * s - w * 1.1)}v${f(-.35 * s)}`, 1.1) + k.shape(k.rect(x - w * 1.12, yg - .3 * s, w * 2.24, .3 * s), 'black', { w: .6 });
    };
    const horse = (x, y, s, dir) => { // s: px per metre; a cab horse, head low in the rain
      const X = (m) => f(x + m * s * dir), Y = (m) => f(y - m * s);
      let h = k.shape(`M${X(0)} ${Y(1.5)}C${X(.4)} ${Y(1.72)} ${X(1.5)} ${Y(1.6)} ${X(1.95)} ${Y(1.62)}L${X(2.32)} ${Y(2.02)}L${X(2.4)} ${Y(2.2)}L${X(2.5)} ${Y(2.04)}L${X(2.95)} ${Y(1.62)}L${X(2.88)} ${Y(1.5)}L${X(2.45)} ${Y(1.68)}L${X(2.12)} ${Y(1.32)}C${X(2.1)} ${Y(1.02)} ${X(1.9)} ${Y(.92)} ${X(1.7)} ${Y(.92)}L${X(.45)} ${Y(.95)}C${X(.1)} ${Y(1)} ${X(-.05)} ${Y(1.2)} ${X(0)} ${Y(1.5)}Z`, 'dark', { w: .8 });
      h += k.line(`M${X(1.85)} ${Y(.95)}L${X(1.98)} ${Y(.45)}L${X(1.92)} ${Y(0)}M${X(1.62)} ${Y(.95)}L${X(1.48)} ${Y(.45)}L${X(1.58)} ${Y(0)}M${X(.45)} ${Y(1)}L${X(.62)} ${Y(.5)}L${X(.5)} ${Y(0)}M${X(.2)} ${Y(1.05)}L${X(.1)} ${Y(.5)}L${X(.22)} ${Y(0)}`, Math.max(1, s * .12));
      h += k.line(`M${X(0)} ${Y(1.45)}q${f(-.25 * s * dir)} ${f(.3 * s)} ${f(-.15 * s * dir)} ${f(.75 * s)}`, Math.max(1, s * .1));
      return h + k.shape(k.poly([[+X(.9), +Y(1.68)], [+X(1.5), +Y(1.68)], [+X(1.45), +Y(1.15)], [+X(.95), +Y(1.15)]]), 'black', { w: 0 }); // the blanket
    };
    const fiacre = (x, y, s, dir) => { // x,y: under the rear wheel
      const X = (m) => x + m * s * dir, Y = (m) => y - m * s;
      let c = horse(X(2.6), y, s, dir);
      c += k.line(`M${f(X(1.9))} ${f(Y(1.05))}L${f(X(3.7))} ${f(Y(1.28))}`, Math.max(.8, s * .07));
      c += k.shape(k.poly([[X(-.65), Y(.75)], [X(-.7), Y(2.1)], [X(1.25), Y(2.1)], [X(1.45), Y(1.4)], [X(1.2), Y(.75)]]), 'black', { w: .9 });
      c += k.shape(k.poly([[X(-.8), Y(2.1)], [X(1.35), Y(2.1)], [X(1.25), Y(2.28)], [X(-.7), Y(2.28)]]), 'dark', { w: .7 });
      const g = [[X(.05), Y(1.95)], [X(.75), Y(1.95)], [X(.75), Y(1.35)], [X(.05), Y(1.35)]];
      c += k.shape(k.poly(g), 'glass', { w: .6 });
      light(g);
      c += k.figure(X(1.68), Y(1.2), s * .07, 'man') + k.line(`M${f(X(1.85))} ${f(Y(2.1))}q${f(.9 * s * dir)} ${f(-.7 * s)} ${f(1.9 * s * dir)} ${f(-.25 * s)}`, .55);
      c += k.shape(k.poly([[X(1.45), Y(1.68)], [X(2.15), Y(1.62)], [X(2.12), Y(1.12)], [X(1.5), Y(1.15)]]), 'black', { w: .6 });
      for (const [wx, wr] of [[0, .58], [1.78, .44]]) {
        let sp = '';
        for (let a = 0; a < 6; a++) { const q = a * Math.PI / 6; sp += `M${f(X(wx) - Math.cos(q) * wr * s)} ${f(Y(wr) - Math.sin(q) * wr * s)}L${f(X(wx) + Math.cos(q) * wr * s)} ${f(Y(wr) + Math.sin(q) * wr * s)}`; }
        c += k.line(sp, .5) + `<circle cx="${f(X(wx))}" cy="${f(Y(wr))}" r="${f(wr * s)}" fill="none" stroke="${k.ink}" stroke-width="${f(Math.max(1, s * .09))}"/>`;
      }
      const lx = X(1.38);
      c += k.shape(k.rect(lx - .12 * s, Y(1.95), .24 * s, .3 * s), 'light', { w: .5 });
      k.lights.push([f(lx - .1 * s), f(Y(1.93)), f(.2 * s), f(.26 * s)]);
      return c;
    };
    const coalman = (x, y, s) => k.figure(x, y, s, 'porter').replace(/<path d="[^"]*" fill="url\(#mid-[^"]*\)"[^>]*\/>$/, '') // a coal-heaver, his sack on his back
      + k.shape(`M${f(x - .5 * s)} ${f(y - 23 * s)}Q${f(x - 6 * s)} ${f(y - 25 * s)} ${f(x - 7 * s)} ${f(y - 18 * s)}Q${f(x - 7.6 * s)} ${f(y - 11 * s)} ${f(x - 3.6 * s)} ${f(y - 9.5 * s)}Q${f(x - .6 * s)} ${f(y - 11 * s)} ${f(x - .2 * s)} ${f(y - 16 * s)}Z`, 'black', { w: .7 })
      + k.line(`M${f(x - 5.5 * s)} ${f(y - 22 * s)}q${f(1 * s)} ${f(4 * s)} ${f(-.5 * s)} ${f(9 * s)}`, .5, { color: P });
    const handcart = (x, y, s) => k.shape(k.poly([[x, y - 9 * s], [x + 22 * s, y - 9 * s], [x + 20 * s, y - 5 * s], [x + 2 * s, y - 5 * s]]), 'mid', { w: .7 })
      + k.shape(k.rect(x + 3 * s, y - 16 * s, 9 * s, 7 * s), 'light', { w: .6 }) + k.shape(k.rect(x + 12 * s, y - 14 * s, 8 * s, 5 * s), 'dark', { w: .6 })
      + k.line(`M${f(x + 22 * s)} ${f(y - 8 * s)}l${f(8 * s)} ${f(1.5 * s)}`, .9)
      + `<circle cx="${f(x + 11 * s)}" cy="${f(y - 4 * s)}" r="${f(4 * s)}" fill="${P}" stroke="${k.ink}" stroke-width="${f(1.1 * s)}"/>` + k.line(`M${f(x + 7 * s)} ${f(y - 4 * s)}h${f(8 * s)}M${f(x + 11 * s)} ${f(y - 8 * s)}v${f(8 * s)}`, .5);
    const lampAt = (x, yg) => { const s = at(yg) * .155; k.lights.push([f(x - 1.6 * s), f(yg - 28.6 * s), f(3.2 * s), f(4.2 * s)]); return k.lamp(x, yg, s); };
    const man = (x, yg, kind = 'man') => k.figure(x, yg, at(yg) * .077, kind);

    let life = ''; // the café terrace under the first awnings
    for (const z of [31, 34.5, 38]) { const [x, y] = p3(X0 + 2.2, 0, z), s = sc(z); life += k.line(`M${f(x)} ${f(y)}v${f(-.75 * s)}M${f(x - .38 * s)} ${f(y - .75 * s)}h${f(.76 * s)}`, Math.max(.7, s * .07)); }
    life += man(...p3(X0 + 1.6, 0, 33)) + man(...p3(X0 + 2.8, 0, 36), 'woman') + man(...p3(X0 + 3.3, 0, 41)) + man(...p3(X0 + 2, 0, 52), 'woman') + man(...p3(X0 + 3, 0, 66), 'soldier');
    life += man(...p3(-2, 0, 90)) + man(...p3(3, 0, 120), 'woman') + man(...p3(18, 0, 70), 'woman') + man(...p3(22, 0, 95));
    const cabY = 214, cab = fiacre(150, cabY, at(cabY), 1);
    const people = handcart(44, 233, 1.2) + k.figure(36, 233, 1.2, 'porter') + coalman(296, 229, 1.12)
      + man(330, 210) + man(339, 211, 'woman');
    const bench = (x, yg) => { const s = at(yg); return k.shape(k.rect(x, yg - .45 * s, 1.8 * s, .12 * s), 'dark', { w: .6 }) + k.shape(k.rect(x, yg - .9 * s, 1.8 * s, .25 * s), 'mid', { w: .6 }) + k.line(`M${f(x + .15 * s)} ${f(yg)}v${f(-.9 * s)}M${f(x + 1.65 * s)} ${f(yg)}v${f(-.9 * s)}`, Math.max(.8, s * .07)); };
    const pram = (x, yg) => { const s = at(yg); return k.shape(`M${f(x)} ${f(yg - .45 * s)}h${f(.9 * s)}q${f(.1 * s)} ${f(-.5 * s)} ${f(-.35 * s)} ${f(-.6 * s)}h${f(-.55 * s)}Z`, 'dark', { w: .6 }) + `<circle cx="${f(x + .2 * s)}" cy="${f(yg - .15 * s)}" r="${f(.15 * s)}" fill="none" stroke="${k.ink}" stroke-width=".6"/><circle cx="${f(x + .75 * s)}" cy="${f(yg - .15 * s)}" r="${f(.15 * s)}" fill="none" stroke="${k.ink}" stroke-width=".6"/>`; };
    const furniture = lampAt(392, 227) + lampAt(262, 199) + bench(486, 222) + man(510, 222, 'porter') + pram(444, 206) + man(438, 206, 'woman') + man(560, 199, 'soldier') + man(548, 198, 'woman') + morris(592, 236);
    const refl = k.reflect(cab, cabY, .2) + k.reflect(people, 233, .14);

    // order: back to front
    return far + eiffel + k.haze(VY - 14, 16, .26) + park + smoke + block + ground + refl + life + cab + people + furniture;
  },
};
