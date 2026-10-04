// Brussels: across the Grand-Place on a market morning. The Hôtel de Ville stands at the back on the left, its
// gothic spire soaring to St Michael; the guildhalls run toward it from the right in a row of gilded gables;
// the flower market fills the cobbles under its parasols: market women, a porter, a dog cart with milk cans.

export default {
  id: 'BRU',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(77);
    const VY = 178, EYE = 4;
    const at = (yg) => (yg - VY) / EYE; // px per metre for something standing on ground y
    const seg = (a, b) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    const lerp = (a, b, t) => a + (b - a) * t;

    // ---------- far: roofs beyond the square, soot
    // chimneys of the lower town smoking behind the roofs
    let far = '';
    for (const [x, y, sc] of [[30, 118, 1.3], [250, 126, 1.1], [222, 112, .9], [286, 122, 1.2]]) far += k.shape(k.rect(x - 2, y, 4, 12), 'dark', { far: true, w: .5 }) + k.smoke(x, y - 1, sc, { seed: x });
    far += k.haze(104, 52, .32);

    // ---------- the Hôtel de Ville: arcade, two storeys of gothic windows, the steep roof with rows of dormers
    const HX0 = 58, HX1 = 246, HB = 190, s = 1.86; // facade span, base line, px per metre (up)
    const hy = (m) => HB - m * s;
    let hdv = k.shape(k.rect(HX0, hy(20), HX1 - HX0, 20 * s), 'vert', { w: 1.1 });
    hdv += k.shape(k.rect(HX0, hy(20), HX1 - HX0, 3), 'dark', { w: .8 });
    // the roof, steep, with three rows of little dormers
    hdv += k.shape(k.poly([[HX0 - 3, hy(20)], [HX0 + 10, hy(37)], [HX1 - 10, hy(37)], [HX1 + 3, hy(20)]]), 'dark', { w: 1.1 });
    let dorm = '';
    for (let row = 0; row < 3; row++) {
      const y = hy(22.5 + row * 4.6), inset = 4 + row * 3.6;
      for (let x = HX0 + inset; x < HX1 - inset - 3; x += 7.5 - row) { dorm += k.gable(x, y, 4, 4.5) + k.rect(x, y, 4, 2.4); if (k.rand() < .15) k.lights.push([f(x + .8), f(y + .2), 2.4, 2]); }
    }
    hdv += k.shape(dorm, 'light', { w: .5 });
    // the arcade on the ground floor
    let arc = '';
    for (let x = HX0 + 3; x < HX1 - 6; x += 9.8) arc += k.gothic(x, hy(5.4), 6.6, 5.4 * s);
    hdv += k.shape(arc, 'black', { w: .6 });
    // two storeys of tall windows between statue niches
    let win = '', nich = '';
    for (let x = HX0 + 4; x < HX1 - 6; x += 9.8) {
      for (const [y0, h] of [[hy(12), 5.6 * s], [hy(18.6), 5.4 * s]]) {
        win += k.gothic(x + 1, y0, 4.6, h);
        if (k.rand() < .3) k.lights.push([f(x + 1.4), f(y0 + 2.5), 3.8, f(h - 3)]);
      }
      nich += `M${f(x + 7.6)} ${f(hy(17.5))}v6M${f(x + 7.6)} ${f(hy(11))}v6`;
    }
    hdv += k.shape(win, 'glass', { w: .5 }) + k.line(nich, 1.1);
    hdv += k.line(`M${HX0} ${f(hy(13))}H${HX1}M${HX0} ${f(hy(6.4))}H${HX1}`, .8);
    // the octagonal corner turrets with their pepperpot spires
    for (const tx of [HX0, HX1]) hdv += k.shape(k.rect(tx - 4.5, hy(25), 9, 25 * s), 'vert', { w: .9 }) + k.shape(k.rect(tx + 1, hy(25), 3.5, 25 * s), 'dark', { w: 0 }) + k.shape(k.spire(tx, hy(25), 11, 14 * s), 'dark', { w: .9 });
    hdv += k.line(`M${HX0 - 6} ${HB}H${HX1 + 6}`, 1.4);
    // the tower: square stages above the portal, the octagonal lantern with flying buttresses, the openwork spire
    const TX = 160, tw = 25;
    let tow = k.shape(k.rect(TX - tw / 2, hy(52), tw, 52 * s), 'vert', { w: 1.2 });
    tow += k.shape(k.rect(TX + tw / 2 - 7, hy(52), 7, 52 * s), 'dark', { w: .6 });
    tow += k.shape(k.gothic(TX - 5, hy(9.5), 10, 9.5 * s), 'black', { w: .8 }); // the portal
    for (let i = 0; i < 4; i++) { const y = hy(24 + i * 7); tow += k.shape(k.gothic(TX - 7.5, y, 4.5, 9), 'glass', { w: .45 }) + k.shape(k.gothic(TX - 1.5, y, 4.5, 9), 'glass', { w: .45 }); }
    for (const y of [hy(21), hy(30), hy(38), hy(45), hy(52)]) tow += k.line(`M${f(TX - tw / 2 - 1)} ${f(y)}h${tw + 2}`, .9);
    for (const px of [TX - tw / 2 - 1, TX + tw / 2 + 1]) for (const ph of [37, 52]) tow += k.shape(k.spire(px, hy(ph), 4, 9), 'dark', { w: .6 });
    // the octagonal lantern
    const lw = 17;
    tow += k.shape(k.rect(TX - lw / 2, hy(68), lw, 16 * s), 'light', { w: 1.1 });
    tow += k.shape(k.rect(TX + lw / 2 - 5, hy(68), 5, 16 * s), 'dark', { w: 0 });
    let slots = '';
    for (const dx of [-5.5, -1.2, 3.1]) slots += k.gothic(TX + dx, hy(66), 2.6, 12 * s);
    tow += k.shape(slots, 'black', { w: .4 });
    tow += k.line(`M${f(TX - lw / 2)} ${f(hy(68))}h${lw}`, 1.2);
    // flying buttresses from the corner pinnacles to the lantern
    tow += k.line(`M${f(TX - tw / 2 - 1)} ${f(hy(55))}Q${f(TX - lw / 2 - 2)} ${f(hy(60))} ${f(TX - lw / 2)} ${f(hy(65))}M${f(TX + tw / 2 + 1)} ${f(hy(55))}Q${f(TX + lw / 2 + 2)} ${f(hy(60))} ${f(TX + lw / 2)} ${f(hy(65))}`, 1.2);
    for (const px of [TX - lw / 2 - .5, TX + lw / 2 + .5]) tow += k.shape(k.spire(px, hy(68), 3.4, 10), 'dark', { w: .6 });
    // the spire: an openwork pyramid with crockets, St Michael on top
    const sb = hy(70), st = hy(91), sw = 14;
    tow += k.shape(k.poly([[TX - sw / 2, sb], [TX - 1.2, st], [TX + 1.2, st], [TX + sw / 2, sb]]), 'mid', { w: 1.1 });
    let ow = '', crock = '';
    for (let i = 1; i < 7; i++) { const y = lerp(sb, st, i / 7), hw = lerp(sw / 2, 1.2, i / 7); ow += `M${f(TX - hw)} ${f(y)}h${f(2 * hw)}`; crock += `M${f(TX - hw)} ${f(y)}l-2.2 -1.2M${f(TX + hw)} ${f(y)}l2.2 -1.2`; }
    tow += k.line(ow, .6, { color: P }) + k.line(crock, .9);
    tow += k.shape(k.rect(TX - 2.2, sb - 2, 4.4, 2), 'dark', { w: .5 });
    tow += k.line(`M${TX} ${f(st)}V${f(st - 4)}`, 1) + k.shape(`M${f(TX - 1.6)} ${f(st - 4)}l1.6 -7l1.6 7Z`, 'black', { w: .5 }) + k.line(`M${f(TX - 3.5)} ${f(st - 9)}l3.5 -1.5l3.5 1.5M${f(TX + 1)} ${f(st - 10)}l2 -4`, .8);

    // ---------- the guildhalls, receding from the right toward the Hôtel de Ville
    // each front is a trapezoid; facade points are mapped by (u across, v up in metres)
    const kinds = ['volute', 'stern', 'bell', 'volute', 'step', 'bell', 'volute', 'stern', 'bell', 'volute', 'bell'];
    const widths = [10, 9, 8.5, 10, 8, 9, 8.5, 9.5, 8, 9, 8], heights = [18, 17, 16.5, 18.5, 15.5, 17, 16, 17.5, 16, 17, 16];
    const GX0 = 296, GX1 = 652, sAt = (x) => lerp(2.4, 6.2, Math.pow((x - GX0) / (GX1 - GX0), 1.35)), bAt = (x) => lerp(194, 232, Math.pow((x - GX0) / (GX1 - GX0), 1.35));
    let gx = GX1, guild = '', gilt = '', orn = '';
    const glights = [], fronts = [];
    for (let i = 0; i < kinds.length && gx > GX0 + 4; i++) {
      const wm = widths[i], sr = sAt(gx);
      let xl = gx - wm * sr;
      xl = Math.max(GX0 - 6, gx - wm * (sr + sAt(Math.max(GX0, xl))) / 2);
      fronts.push({ kind: kinds[i], wm, hm: heights[i], xr: gx, xl, sr, sl: sAt(Math.max(GX0, xl)), br: bAt(gx), bl: bAt(Math.max(GX0, xl)) });
      gx = xl;
    }
    // gable outlines, left half, as [cmd, u, v, (u, v)]: Q takes a control point then the end point
    const GAB = {
      volute: [['L', 0, .05], ['Q', .17, .08, .16, .3], ['L', .21, .3], ['L', .21, .36], ['Q', .33, .4, .31, .62], ['L', .35, .62], ['L', .35, .68], ['Q', .43, .7, .42, .86], ['L', .39, .86], ['L', .5, 1]],
      bell: [['Q', .03, .36, .18, .44], ['Q', .34, .52, .35, .78], ['Q', .37, .97, .5, 1]],
      stern: [['L', 0, .22], ['Q', -.02, .5, .14, .54], ['Q', .2, .76, .32, .86], ['Q', .41, .95, .5, .95]],
      step: [['L', 0, .2], ['L', .13, .2], ['L', .13, .4], ['L', .26, .4], ['L', .26, .6], ['L', .38, .6], ['L', .38, .8], ['L', .5, .8]],
    };
    for (const h of fronts.reverse()) { // far to near, so the nearer front overlaps
      const map = (u, v) => [lerp(h.xl, h.xr, u), lerp(h.bl, h.br, u) - v * lerp(h.sl, h.sr, u)];
      const poly = (pts) => k.poly(pts.map(([u, v]) => map(u, v)));
      const H = h.hm, G = 12, sm = (h.sl + h.sr) / 2;
      const P2 = (u, v) => { const q = map(u, v); return `${f(q[0])} ${f(q[1])}`; };
      // the outline: facade and gable in one shape
      const L = GAB[h.kind], half = [];
      for (const c of L) half.push(c);
      let d = `M${P2(0, 0)}`;
      for (const c of half) d += c[0] === 'L' ? `L${P2(c[1], H + c[2] * G)}` : `Q${P2(c[1], H + c[2] * G)} ${P2(c[3], H + c[4] * G)}`;
      // mirror back down the right side
      const pts = [[0, 0], ...half.map((c) => (c[0] === 'L' ? [c[1], c[2]] : [c[3], c[4]]))];
      for (let j = half.length - 1; j >= 0; j--) {
        const c = half[j], to = pts[j];
        d += c[0] === 'L' ? `L${P2(1 - to[0], j ? H + to[1] * G : 0)}` : `Q${P2(1 - c[1], H + c[2] * G)} ${P2(1 - to[0], j ? H + to[1] * G : 0)}`;
      }
      if (h.kind === 'step') d = d.replace(/Q/g, 'L');
      guild += k.shape(d + 'Z', 'vert', { w: 1.1 });
      guild += k.shape(poly([[.9, 0], [1, 0], [1, H], [.93, H]]), 'dark', { w: 0 }); // the shaded return
      // gilt and ornament: the gable's edge traced in gold, scrolls, obelisks and a finial on top
      gilt += `M${P2(.04, H + .1)}` + half.map((c) => (c[0] === 'L' ? `L${P2(c[1] + .04, H + c[2] * G - .5)}` : `L${P2(c[3] + .04, H + c[4] * G - .5)}`)).join('');
      if (h.kind === 'volute') for (const [u, v] of [[.04, .07], [.22, .37], [.36, .69]]) for (const uu of [u, 1 - u]) { const q = map(uu, H + v * G); orn += `M${f(q[0] - sm * .55)} ${f(q[1])}a${f(sm * .55)} ${f(sm * .55)} 0 1 0 ${f(sm * 1.1)} 0a${f(sm * .55)} ${f(sm * .55)} 0 1 0 ${f(-sm * 1.1)} 0`; }
      const tv = h.kind === 'step' ? .8 : h.kind === 'stern' ? .95 : 1, top = map(.5, H + tv * G);
      orn += `M${f(top[0])} ${f(top[1])}v${f(-sm * 2.4)}m${f(-sm * .8)} ${f(sm * .9)}h${f(sm * 1.6)}`;
      guild += k.shape(`M${f(top[0] - sm * .55)} ${f(top[1] - sm * 2.4)}a${f(sm * .55)} ${f(sm * .6)} 0 1 1 ${f(sm * 1.1)} 0a${f(sm * .55)} ${f(sm * .6)} 0 1 1 ${f(-sm * 1.1)} 0Z`, 'paper', { w: .7 });
      if (h.kind !== 'step') for (const uu of [.2, .8]) { const q = map(uu, H + (h.kind === 'bell' ? .44 : .36) * G); orn += `M${f(q[0])} ${f(q[1])}v${f(-sm * 1.6)}`; }
      // the gable window, and an oculus
      guild += k.shape(poly([[.4, H + G * .2], [.6, H + G * .2], [.6, H + G * .5], [.4, H + G * .5]]), 'glass', { w: .5 });
      const oc = map(.5, H + G * .66);
      guild += `<circle cx="${f(oc[0])}" cy="${f(oc[1])}" r="${f(sm * .55)}" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width=".5"/>`;
      // three storeys of windows between pilasters, entablatures, a shop below
      const cols = Math.max(3, Math.round(h.wm / 2.8)), fl = [[4.8, 8.2], [9.4, 12.6], [13.6, H - 1]];
      let ws = '', pil = '';
      for (let c = 0; c < cols; c++) {
        const u0 = (c + .26) / cols, u1 = (c + .74) / cols;
        for (const [v0, v1] of fl) {
          const q = [map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)];
          ws += k.poly(q);
          if (k.rand() < .3) glights.push(q);
        }
        if (c) pil += seg(map(c / cols, 4.4), map(c / cols, H));
      }
      guild += k.shape(ws, 'glass', { w: .5 }) + k.line(pil, .7);
      for (const v of [4.4, 9, 13.2, H]) guild += k.line(seg(map(0, v), map(1, v)) + seg(map(0, v + .4), map(1, v + .4)), .7);
      guild += k.shape(poly([[.08, 0], [.92, 0], [.92, 3.8], [.08, 3.8]]), 'black', { w: .6 });
      guild += k.shape(poly([[.08, 3.8], [.92, 3.8], [1.02, 2.6], [.02, 2.6]]), 'light', { w: .5 }); // a shop blind
    }
    guild += k.line(gilt, .9, { color: P }) + k.line(orn, .8);
    for (const pts of glights) { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); k.lights.push([f(Math.min(...xs)), f(Math.min(...ys)), f(Math.max(...xs) - Math.min(...xs)), f(Math.max(...ys) - Math.min(...ys))]); }
    // between the Hôtel de Ville and the guildhalls, the mouth of a street in sepia
    let gap = k.shape(k.rect(HX1 + 4, 150, GX0 - HX1 - 4, 44), 'light', { far: true, w: .5 }) + k.shape(k.gable(HX1 + 4, 150, GX0 - HX1 - 4, 18), 'tiles', { far: true });
    gap += k.windows(HX1 + 8, 156, GX0 - HX1 - 12, 32, 3, 3, { far: true, lit: .3 });
    // to the left of the Hôtel de Ville, the houses of the rue Charles Buls in sepia
    gap = k.skyline(-5, HX0 - 6, HB, { seed: 12, style: 'north', hMin: 26, hMax: 44, wMin: 12, wMax: 20 }) + gap;

    // ---------- the square: cobbles, the flower market under its parasols
    let ground = k.shape(`M-5 ${HB}L${GX0} ${HB + 4}L652 ${f(bAt(GX1))}V245H-5Z`, 'paper', { w: 0 }) + k.line(`M-5 ${HB}L${GX0} ${HB + 4}L652 ${f(bAt(GX1))}`, 1.2);
    let cob = '';
    for (let y = HB + 3; y < 242; y += 2.4 + (y - HB) * .16) { const w = 3 + (y - VY) * .36; for (let x = ((y * 3) % w) - 6; x < 650; x += w) if (x < GX0 || y > lerp(HB + 4, bAt(GX1), (x - GX0) / (GX1 - GX0)) + 2) cob += `M${f(x)} ${f(y)}q${f(w * .4)} ${f(-.6 - (y - VY) * .04)} ${f(w * .82)} 0`; }
    ground += k.line(cob, .5);
    const parasol = (x, yg, tone) => { // a market umbrella: domed canopy, scalloped rim, ribs, shaded on the right
      const sc = at(yg), w = 1.55 * sc, rim = yg - 2.2 * sc, ap = yg - 3.1 * sc;
      let p = k.line(`M${f(x)} ${f(yg)}V${f(ap)}`, Math.max(.8, sc * .07));
      let edge = '';
      for (let i = 0; i < 6; i++) edge += `A${f(w / 6)} ${f(.16 * sc)} 0 0 0 ${f(x + w - (i + 1) * w / 3)} ${f(rim)}`;
      p += k.shape(`M${f(x - w)} ${f(rim)}Q${f(x - w * .78)} ${f(ap)} ${f(x)} ${f(ap)}Q${f(x + w * .78)} ${f(ap)} ${f(x + w)} ${f(rim)}${edge.replace(/^A/, 'A')}Z`.replace(`${f(x + w)} ${f(rim)}A`, `${f(x + w)} ${f(rim)}A`), tone, { w: .9 });
      p += k.shape(`M${f(x + w * .2)} ${f(ap + .05 * sc)}Q${f(x + w * .78)} ${f(ap + .05 * sc)} ${f(x + w)} ${f(rim)}L${f(x + w * .33)} ${f(rim)}Z`, 'dark', { w: 0 });
      p += k.line(`M${f(x)} ${f(ap)}L${f(x - w * .5)} ${f(rim + .1 * sc)}M${f(x)} ${f(ap)}L${f(x + w * .5)} ${f(rim + .1 * sc)}M${f(x)} ${f(ap)}v${f(-.25 * sc)}`, .6);
      return p;
    };
    const stall = (x, yg) => { // a trestle of flowers, pots and baskets
      const sc = at(yg), w = 1.7 * sc;
      let t = k.shape(k.poly([[x - w, yg - .8 * sc], [x + w, yg - .8 * sc], [x + w * .95, yg - .1 * sc], [x - w * .95, yg - .1 * sc]]), 'mid', { w: .7 });
      let blooms = '';
      for (let i = 0; i < 6; i++) { const bx = x - w * .85 + i * w * .34, br = .3 * sc * (.8 + r() * .5); blooms += `M${f(bx - br)} ${f(yg - .8 * sc)}a${f(br)} ${f(br * 1.1)} 0 1 1 ${f(2 * br)} 0Z`; }
      t += k.shape(blooms, 'stipple', { w: .6 });
      let pots = '';
      for (const dx of [-1.2, .9, 1.3]) pots += `M${f(x + dx * w - .22 * sc)} ${f(yg)}h${f(.44 * sc)}l${f(.06 * sc)} ${f(-.4 * sc)}h${f(-.56 * sc)}Z`;
      return t + k.shape(pots, 'light', { w: .6 }) + k.shape(`M${f(x + (x % 2 ? -1.6 : 1.6) * w)} ${f(yg)}a${f(.35 * sc)} ${f(.25 * sc)} 0 1 1 ${f(.7 * sc)} 0Z`, 'stipple', { w: .6 });
    };
    const dogcart = (x, yg) => { // a Brussels milk cart drawn by a dog, brass cans aboard
      const sc = at(yg);
      let d = k.shape(k.rect(x, yg - 1 * sc, 1.4 * sc, .35 * sc), 'dark', { w: .6 });
      d += `<circle cx="${f(x + .55 * sc)}" cy="${f(yg - .38 * sc)}" r="${f(.38 * sc)}" fill="none" stroke="${k.ink}" stroke-width="1"/>`;
      let cans = '';
      for (const dx of [.15, .55, .95]) cans += k.rect(x + dx * sc, yg - 1.55 * sc, .3 * sc, .55 * sc);
      d += k.shape(cans, 'light', { w: .6 });
      d += k.shape(`M${f(x + 1.5 * sc)} ${f(yg - .55 * sc)}q${f(.4 * sc)} ${f(-.25 * sc)} ${f(.9 * sc)} ${f(-.1 * sc)}l${f(.25 * sc)} ${f(-.25 * sc)}l${f(.12 * sc)} ${f(.22 * sc)}l${f(-.1 * sc)} ${f(.2 * sc)}l${f(-.05 * sc)} ${f(.5 * sc)}h${f(-.1 * sc)}l${f(-.05 * sc)} ${f(-.35 * sc)}h${f(-.6 * sc)}l${f(-.05 * sc)} ${f(.35 * sc)}h${f(-.1 * sc)}Z`, 'black', { w: .5 });
      return d + k.line(`M${f(x + 1.4 * sc)} ${f(yg - .8 * sc)}l${f(.35 * sc)} ${f(.15 * sc)}`, .7);
    };
    const fig = (x, yg, kind) => k.figure(x, yg, at(yg) * .074, kind);
    let market = '';
    const spots = [[96, 206, 'light'], [186, 202, 'mid'], [262, 212, 'light'], [356, 207, 'mid'], [436, 218, 'light'], [118, 232, 'mid'], [318, 236, 'light'], [540, 238, 'mid'], [600, 214, 'light']];
    spots.sort((a, b) => a[1] - b[1]);
    for (const [x, yg, tone] of spots) market += parasol(x, yg - .3, tone) + fig(x - .9 * at(yg), yg - .25 * at(yg), 'woman') + stall(x, yg);
    const folk = fig(222, 208, 'man') + fig(230, 209, 'woman') + fig(402, 214, 'porter') + fig(476, 230, 'man') + fig(486, 231, 'woman') + fig(612, 238, 'priest') + fig(56, 222, 'soldier') + fig(66, 223, 'woman') + dogcart(196, 236) + fig(186, 236, 'woman') + fig(150, 214, 'man');

    return far + gap + hdv + tow + guild + ground + market + folk;
  },
};
