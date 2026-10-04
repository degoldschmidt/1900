// Stockholm: from the heights of Södermalm, looking down across Riddarfjärden. Riddarholmen floats in the middle of
// the water, its church lifting the openwork iron spire; the old town and the palace crowd the island to the right;
// a white steamer cuts a long wake below. Granite, pines and a fence on the hilltop; smoke from the roofs beneath.

export default {
  id: 'STO',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(45);
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const FS = 118, IS = 154; // far shore, island quay

    // ---------- far: the north shore and its hills, Kungsholmen, soot over the water
    let far = k.shape(`M-5 ${FS}Q60 ${FS - 14} 140 ${FS - 8}T300 ${FS - 10}T470 ${FS - 6}T645 ${FS - 12}V${FS + 2}H-5Z`, 'stipple', { far: true, w: .5 });
    far += k.skyline(-5, 645, FS + 1, { seed: 33, style: 'north', hMin: 6, hMax: 14, wMin: 12, wMax: 22 });
    far += k.shape(k.rect(120, FS - 26, 3, 22), 'dark', { far: true, w: .4 }) + k.shape(k.spire(121.5, FS - 26, 5, 14), 'dark', { far: true, w: .4 });
    far += k.haze(FS - 20, 26, .36);
    let water = k.water(FS + 1, 240, { seed: 21 });
    water += k.shape(`M-5 ${FS + 1}H645V${FS + 14}H-5Z`, 'horiz', { w: 0, op: .35, far: true });
    water += k.shape(`M-5 186Q160 180 320 188T645 184V200Q480 206 320 198T-5 204Z`, 'horiz', { w: 0, op: .45 }); // a cat's-paw of wind darkening the fjord
    const nFar = k.lights.length;

    // ---------- the old town and the palace to the right, far
    let town = k.skyline(420, 660, IS + 2, { seed: 6, style: 'north', hMin: 16, hMax: 32, wMin: 10, wMax: 18 });
    town += k.shape(k.rect(560, IS - 44, 90, 46), 'light', { far: true, w: .7 }) + k.windows(564, IS - 40, 82, 36, 10, 4, { far: true, lit: .3 }); // the palace
    town += k.line(`M558 ${IS - 44}H650`, 1.2, { far: true });
    town += k.shape(k.rect(486, IS - 58, 9, 40), 'mid', { far: true, w: .6 }) + k.shape(k.spire(490.5, IS - 58, 10, 44), 'dark', { far: true, w: .6 }); // the German church
    town += k.shape(k.rect(528, IS - 52, 10, 34), 'light', { far: true, w: .6 }) + k.shape(k.onion(533, IS - 52, 13, 12), 'dark', { far: true, w: .6 }); // the great church
    town += k.shape(`M420 ${IS + 2}H650V${IS + 6}H420Z`, 'vert', { far: true, w: .5 });
    const nTown = k.lights.length;

    // ---------- Riddarholmen: the quay, the palaces, the church with its openwork spire
    const CX = 330, s = 1.55, cy = (m) => IS - m * s;
    let isl = k.shape(`M196 ${IS + 6}H470L462 ${IS - 2}H204Z`, 'vert', { w: 1 }) + k.line(`M196 ${IS + 6}H470`, 1.2);
    // the Wrangel palace and its round tower on the left of the island
    isl += k.shape(k.rect(206, cy(17), 64, 17 * s), 'light', { w: 1 }) + k.shape(k.poly([[204, cy(17)], [212, cy(24)], [264, cy(24)], [272, cy(17)]]), 'dark', { w: 1 }) + k.windows(210, cy(15), 56, 13 * s, 7, 2, { lit: .3 });
    isl += k.shape(k.rect(212, cy(27), 14, 27 * s), 'light', { w: 1 }) + k.shape(k.rect(220, cy(27), 6, 27 * s), 'dark', { w: 0 }) + k.shape(k.dome(219, cy(27), 8, 7), 'dark', { w: .9 }) + k.line(`M219 ${f(cy(27) - 9)}v-5`, .8);
    // the house fronts on the right of the island
    isl += k.shape(k.rect(394, cy(15), 66, 15 * s), 'light', { w: 1 }) + k.shape(k.poly([[392, cy(15)], [400, cy(21)], [454, cy(21)], [462, cy(15)]]), 'dark', { w: 1 }) + k.windows(398, cy(13), 58, 11 * s, 7, 2, { lit: .3 });
    // the church: a long brick nave with stepped gables, the square tower, and on it the cast-iron spire, pierced through
    let ch = k.shape(k.rect(CX - 50, cy(18), 96, 18 * s), 'brick', { w: 1.1 });
    ch += k.shape(k.poly([[CX - 52, cy(18)], [CX - 44, cy(28)], [CX + 38, cy(28)], [CX + 48, cy(18)]]), 'dark', { w: 1.1 });
    ch += k.shape(k.gothic(CX - 40, cy(15), 6, 11 * s) + k.gothic(CX - 22, cy(15), 6, 11 * s) + k.gothic(CX + 12, cy(15), 6, 11 * s) + k.gothic(CX + 30, cy(15), 6, 11 * s), 'glass', { w: .5 });
    for (const gx of [CX - 34, CX + 22]) ch += k.shape(`M${gx - 9} ${f(cy(18))}V${f(cy(24))}h3v-3h3v-3h6v3h3v3h3V${f(cy(18))}Z`, 'brick', { w: .9 });
    const TW = 22;
    ch += k.shape(k.rect(CX - TW / 2, cy(42), TW, 42 * s), 'brick', { w: 1.2 }) + k.shape(k.rect(CX + 3, cy(42), TW / 2 - 3, 42 * s), 'dark', { w: 0 });
    ch += k.shape(k.gothic(CX - 6, cy(38), 6, 10 * s) + k.gothic(CX + 1, cy(38), 6, 10 * s), 'black', { w: .5 }) + k.line(`M${CX - TW / 2 - 1} ${f(cy(42))}h${TW + 2}`, 1.6);
    for (const px of [CX - TW / 2, CX + TW / 2]) ch += k.shape(k.spire(px, cy(42), 4, 10), 'dark', { w: .7 });
    // the spire: an iron lattice cone, rings, crockets, the finial
    const sb = cy(42), st = 12, sw = 20;
    let sp = k.shape(k.poly([[CX - sw / 2, sb], [CX - 1, st], [CX + 1, st], [CX + sw / 2, sb]]), 'light', { w: 1.3, op: .55 });
    let lat = '';
    const hw = (t) => sw / 2 * (1 - t) + 1 * t, yy = (t) => sb + (st - sb) * t;
    for (let i = 0; i < 16; i++) { const t0 = i / 16, t1 = (i + 1) / 16; lat += seg(CX - hw(t0), yy(t0), CX + hw(t1) * .1, yy(t1)) + seg(CX + hw(t0), yy(t0), CX - hw(t1) * .1, yy(t1)); }
    for (const t of [.15, .3, .45, .6, .75]) lat += seg(CX - hw(t) - 1.5, yy(t), CX + hw(t) + 1.5, yy(t));
    lat += seg(CX, sb, CX, st);
    sp += k.line(lat, .75) + k.line(seg(CX - sw / 2, sb, CX - 1, st) + seg(CX + sw / 2, sb, CX + 1, st), 1.7);
    let cr = '';
    for (let i = 1; i < 12; i++) { const t = i / 12; cr += `M${f(CX - hw(t))} ${f(yy(t))}l-2 -1.4M${f(CX + hw(t))} ${f(yy(t))}l2 -1.4`; }
    sp += k.line(cr, .9) + k.line(`M${CX} ${st}v-8M${CX - 2.6} ${st - 5}h5.2`, 1.2);
    ch += sp;

    // ---------- the steamer crossing below, seen from above, and its wake; a sail, a skiff
    const steamer = (x, y, sc) => { // bow on the left
      let o = k.shape(`M${f(x)} ${f(y)}Q${f(x + 10 * sc)} ${f(y - 6 * sc)} ${f(x + 26 * sc)} ${f(y - 6 * sc)}H${f(x + 62 * sc)}Q${f(x + 68 * sc)} ${f(y - 5 * sc)} ${f(x + 68 * sc)} ${f(y - 1 * sc)}Q${f(x + 66 * sc)} ${f(y + 3 * sc)} ${f(x + 58 * sc)} ${f(y + 3 * sc)}H${f(x + 20 * sc)}Q${f(x + 6 * sc)} ${f(y + 3 * sc)} ${f(x)} ${f(y)}Z`, 'paper', { w: 1 });
      o += k.shape(`M${f(x + 22 * sc)} ${f(y + 3 * sc)}H${f(x + 58 * sc)}Q${f(x + 66 * sc)} ${f(y + 3 * sc)} ${f(x + 68 * sc)} ${f(y - 1 * sc)}V${f(y + 5 * sc)}H${f(x + 22 * sc)}Z`, 'dark', { w: .7 });
      o += k.shape(k.rect(x + 24 * sc, y - 11 * sc, 32 * sc, 6 * sc), 'light', { w: .8 }) + k.windows(x + 25 * sc, y - 10.5 * sc, 30 * sc, 4 * sc, 8, 1, { lit: .6 });
      o += k.shape(k.rect(x + 34 * sc, y - 24 * sc, 5 * sc, 13 * sc), 'black', { w: .6 }) + k.shape(k.rect(x + 34 * sc, y - 21 * sc, 5 * sc, 2 * sc), 'paper', { w: .3 });
      o += k.smoke(x + 36.5 * sc, y - 25 * sc, .9 * sc, { seed: 3 }) + k.line(`M${f(x + 16 * sc)} ${f(y - 6 * sc)}V${f(y - 20 * sc)}M${f(x + 60 * sc)} ${f(y - 6 * sc)}V${f(y - 16 * sc)}`, .6);
      return o;
    };
    let boats = steamer(126, 186, 1.35);
    let wake = '';
    for (let i = 0; i < 6; i++) wake += `M${f(212 + i * 3)} ${f(188 + i * .6)}Q${f(260 + i * 18)} ${f(190 + i * 4)} ${f(330 + i * 34)} ${f(196 + i * 9)}`;
    boats += k.line(wake, .8, { color: P }) + k.line('M124 187q-6 1 -8 4M126 188q-4 4 -2 7', .8, { color: P });
    boats += k.shape(`M520 192h22l-3 4h-17Z`, 'dark', { w: .5 }) + k.shape(k.poly([[531, 191], [531, 166], [545, 190]]), 'light', { w: .6 }) + k.shape(k.poly([[529, 168], [529, 190], [518, 190]]), 'mid', { w: .5 });
    boats += k.shape('M600 212h26l-3 4h-20Z', 'dark', { w: .6 }) + k.figure(612, 212, .7, 'man') + k.line('M606 205l-10 12M618 205l10 12', .8);
    boats += k.reflect(ch + isl, IS + 6, .26);
    let glint = '';
    for (let i = 0; i < 18; i++) { const y = IS + 10 + r() * 70, x = 180 + r() * 300; glint += `M${f(x)} ${f(y)}h${f(6 + r() * 18)}`; }
    boats += k.line(glint, .9, { color: P });

    // ---------- the hilltop: granite, pines, a fence; a couple at the view; roofs below smoking
    let hill = k.shape('M-5 160Q40 150 80 168Q120 180 150 210Q170 228 190 245H-5Z', 'dark', { w: 1.3 });
    hill += k.shape('M-5 176Q30 168 66 184Q104 200 124 226Q132 236 140 245H-5Z', 'black', { w: 0, op: .6 });
    let crack = '';
    for (let i = 0; i < 12; i++) { const x = 10 + r() * 140, y = 170 + r() * 60; crack += `M${f(x)} ${f(y)}l${f(6 + r() * 8)} ${f(2 + r() * 4)}`; }
    hill += k.line(crack, .7, { color: P }) + k.line('M-5 160Q40 150 80 168Q120 180 150 210Q170 228 190 245', 1.4);
    const pine = (x, y, h) => {
      let p = k.line(`M${f(x)} ${f(y)}V${f(y - h)}`, h * .035 + .6);
      for (let i = 0; i < 6; i++) { const yy = y - h * (.35 + i * .11), w = h * (.26 - i * .035); p += k.shape(`M${f(x - w)} ${f(yy + h * .04)}Q${f(x)} ${f(yy - h * .1)} ${f(x + w)} ${f(yy + h * .04)}Q${f(x)} ${f(yy)} ${f(x - w)} ${f(yy + h * .04)}Z`, 'black', { w: .5 }); }
      return p;
    };
    hill += pine(28, 168, 96) + pine(62, 172, 70) + pine(-2, 176, 60);
    let fence = 'M70 186L196 236';
    for (let x = 74; x < 196; x += 11) fence += `M${x} ${f(186 + (x - 70) * .4)}v-12`;
    hill += k.line(fence + 'M70 176L196 226', 1.1);
    hill += k.figure(100, 196, 1.15, 'man') + k.figure(112, 200, 1.1, 'woman');
    // roofs of the old wooden houses on the slope below, seen from above: tiled slopes, gable ends, chimneys
    let roofs = '';
    const roof = (x, y, w, d, gableLeft, smoke) => { // x,y: front eave's left end; w: length; d: depth of the slope seen from above
      let o = k.shape(k.poly([[x, y], [x + w, y], [x + w - 4, y - d], [x + 4, y - d]]), 'tiles', { w: 1 });
      o += k.shape(k.poly([[x + 4, y - d], [x + w - 4, y - d], [x + w - 8, y - d - d * .45], [x + 8, y - d - d * .45]]), 'dark', { w: .9 });
      const gx = gableLeft ? x : x + w;
      o += k.shape(k.poly([[gx, y], [gx + (gableLeft ? 4 : -4), y - d], [gx + (gableLeft ? 8 : -8), y - d - d * .45], [gx + (gableLeft ? 2 : -2), y + 10], [gx, y + 10]]), 'light', { w: .8 });
      o += k.shape(k.rect(x + 2, y, w - 4, 10), 'light', { w: .9 }) + k.windows(x + 6, y + 1, w - 12, 8, Math.max(2, Math.round(w / 16)), 1, { lit: .45 });
      const cx = x + w * (gableLeft ? .7 : .3);
      o += k.shape(k.rect(cx - 2, y - d - 6, 4.4, 9), 'black', { w: .5 });
      if (smoke) o += k.smoke(cx + 1, y - d - 7, .85, { seed: Math.round(x) });
      return o;
    };
    for (const [x, y, w, d, gl, sm] of [[300, 214, 70, 14, 1, 0], [470, 210, 60, 12, 0, 1], [560, 218, 84, 16, 1, 0], [384, 226, 78, 18, 0, 1], [214, 230, 64, 16, 1, 1], [500, 236, 80, 18, 1, 0], [290, 244, 90, 20, 0, 0]]) roofs += roof(x, y, w, d, gl, sm);
    const gone = hide(nFar, [[420, 0, 660, IS + 6], [-10, 60, 70, 170]]); // the north shore behind the old town and the pines
    hide(nTown - gone, [[196, 0, 470, IS + 6]]); // and everything behind Riddarholmen
    return far + water + town + isl + ch + boats + roofs + hill;
  },
};
