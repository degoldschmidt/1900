// Marseille: from the fish market on the Quai du Port, across the Vieux-Port. Notre-Dame de la Garde stands high on
// its limestone rock at the left, the gilded Virgin on her tower; at the harbour mouth the transporter bridge hangs
// its gondola under the girder. Tartanes and their masts crowd the quay; fishwives, porters, crates; harsh southern light.

export default {
  id: 'MAR',
  draw(k) {
    const f = k.f, r = k.rng(67);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    const truss = (x0, y0, x1, y1, w0, w1, n, lw = 1) => {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const pt = (t, s) => { const w = (w0 + (w1 - w0) * t) / 2 * s; return P(x0 + dx * t + nx * w, y0 + dy * t + ny * w); };
      let z = `M${pt(0, -1)}`;
      for (let i = 1; i <= n; i++) z += `L${pt(i / n, i % 2 ? 1 : -1)}`;
      return k.line(`M${pt(0, -1)}L${pt(1, -1)}M${pt(0, 1)}L${pt(1, 1)}`, lw) + k.line(z, lw * .55);
    };

    // ---- the rock of La Garde, houses climbing it, the forts at the harbour mouth
    const rock = 'M-5 176Q30 160 58 146L80 134L90 136L100 120L110 116L118 106H256L264 114L272 112L282 126L294 128L304 142L326 154L344 160L360 172L370 184H-5Z';
    let s = k.shape(rock, 'light', { w: 1.2 });
    s += k.shape('M256 106L264 114L272 112L282 126L294 128L304 142L326 154L344 160L360 172L370 184H262L270 160L258 136L246 120Z', 'dark', { w: 0 }); // the crag's flank away from the sun
    s += k.shape('M100 120L110 116L118 106H150L138 124L120 140L104 132Z', 'mid', { w: 0, op: .7 });
    let cliff = '';
    for (let i = 0; i < 26; i++) { const x = 64 + r() * 280, y = 116 + r() * 56; cliff += `M${P(x, y)}l${f(-2 + r() * 4)} ${f(5 + r() * 9)}`; }
    s += k.line(cliff, 1.1);
    const blob = (cx, cy, rx, ry) => { let d = ''; for (let i = 0; i <= 7; i++) { const a = i / 7 * Math.PI * 2; d += i ? `A${f(rx * .55)} ${f(rx * .55)} 0 0 1 ${P(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)}` : `M${P(cx + rx, cy)}`; } return d + 'Z'; };
    for (const [x, y, w] of [[88, 150, 10], [132, 132, 8], [200, 128, 12], [240, 146, 9], [160, 156, 11], [300, 160, 8]]) s += k.shape(blob(x, y, w, w * .55), 'stipple', { w: .5 });
    s += k.skyline(-5, 150, 182, { seed: 71, hMin: 10, hMax: 30, wMin: 12, wMax: 20, style: 'south', lit: .35 });
    s += k.skyline(20, 120, 156, { seed: 72, hMin: 8, hMax: 16, wMin: 10, wMax: 16, style: 'south', lit: .3 });
    s += k.skyline(260, 340, 172, { seed: 73, hMin: 8, hMax: 16, wMin: 10, wMax: 16, style: 'south', lit: .3 });
    // Fort Saint-Nicolas, low and angular, left of the mouth; Fort Saint-Jean with its square tower on the right
    s += k.shape('M330 184L338 166H400L408 184Z', 'vert', { w: .9 }) + k.shape('M378 166H400L408 184H384Z', 'dark', { w: .4 });
    s += k.shape(k.rect(604, 150, 40, 34), 'vert', { w: .9 }) + k.shape(k.rect(616, 128, 20, 24), 'light', { w: .9 }) + k.shape(k.rect(630, 128, 6, 24), 'dark', { w: .4 });
    let crenel = '';
    for (let x = 616; x < 636; x += 4) crenel += `M${x} 128v-3h2v3`;
    s += k.line(crenel, .8);

    // ---- Notre-Dame de la Garde: the fortress base, the striped nave and dome, the tower and the gilded Virgin
    // fortress base, then the striped nave, the dome on its drum, the tower, its arcaded belfry, the drum and the Virgin
    let nd = k.shape('M106 118L114 104H258L266 118Z', 'vert', { w: 1.1 }) + k.shape('M232 104H258L266 118H238Z', 'dark', { w: .4 });
    let cr = '';
    for (let x = 116; x < 256; x += 6) cr += `M${x} 104v-3h3v3`;
    nd += k.line(cr, .7);
    nd += k.shape(k.rect(122, 78, 100, 26), 'light', { w: 1.2 });
    let stripes = '';
    for (let y = 81; y < 104; y += 4) stripes += `M122 ${y}h100`;
    nd += k.line(stripes, .9) + k.shape(k.rect(204, 78, 18, 26), 'dark', { w: .5 });
    for (let x = 128; x < 200; x += 12) nd += k.shape(k.arch(x, 84, 6, 14), 'black', { w: .4 });
    nd += k.shape(k.poly([[119, 78], [126, 70], [218, 70], [225, 78]]), 'dark', { w: 1 });
    nd += k.shape(k.rect(136, 56, 32, 14), 'light', { w: 1 }) + k.shape(k.rect(160, 56, 8, 14), 'dark', { w: .4 });
    for (let x = 140; x < 162; x += 7) nd += k.shape(k.arch(x, 59, 3.4, 8), 'black', { w: .3 });
    nd += k.shape(k.dome(152, 56, 17, 16), 'mid', { w: 1.1 }) + k.shape(`M${P(156, 56)}C${P(160, 46)} ${P(158, 40)} ${P(153, 35)}C${P(162, 37)} ${P(169, 46)} ${P(169, 56)}Z`, 'dark', { w: .4 });
    nd += k.shape(k.rect(150.2, 30, 3.6, 5.4), 'dark', { w: .4 }) + k.line('M152 30v-5M150 27h4', .9);
    nd += k.shape(k.rect(180, 62, 16, 8), 'light', { w: .7 }) + k.shape(k.dome(188, 62, 8, 7), 'mid', { w: .8 });
    const tx = 226, tw = 26, tcx = tx + tw / 2;
    nd += k.shape(k.rect(tx, 52, tw, 52), 'light', { w: 1.3 }) + k.shape(k.rect(tx + 18, 52, 8, 52), 'dark', { w: .5 });
    let ts = '';
    for (let y = 56; y < 104; y += 4) ts += `M${tx} ${y}h${tw}`;
    nd += k.line(ts, .7) + k.shape(k.arch(tx + 8, 84, 10, 20), 'black', { w: .6 });
    nd += k.shape(k.rect(tx - 2, 32, tw + 4, 20), 'vert', { w: 1.2 }) + k.shape(k.rect(tx + 18, 32, 10, 20), 'dark', { w: .4 });
    nd += k.shape(k.arch(tx + 3, 35, 7, 14), 'black', { w: .4 }) + k.shape(k.arch(tx + 14, 35, 7, 14), 'black', { w: .4 }) + k.shape(k.rect(tx - 3.5, 29, tw + 7, 3.4), 'dark', { w: .8 });
    nd += k.shape(k.rect(tx + 6, 19, 14, 10), 'light', { w: 1 }) + k.shape(k.rect(tx + 15, 19, 5, 10), 'dark', { w: .4 }) + k.shape(k.rect(tx + 4.5, 17, 17, 2.6), 'dark', { w: .7 });
    nd += k.shape(`M${P(tcx - 5.6, 17)}q.8 -9 3 -13q-1.6 -3.4 0 -6q1.6 -2.2 2.6 -2.2q1 0 2.6 2.2q1.6 2.6 0 6q2.2 4 3 13Z`, 'mid', { w: 1 });
    nd += k.line(`M${P(tcx + 1.4, 8)}l3.4 -3.6`, 1.4) + `<circle cx="${f(tcx + 4.4)}" cy="4" r="1.6" fill="${k.ink}"/>`;
    s += nd;
    hide([[100, 0, 270, 120]]);
    s += k.haze(150, 34, .32);
    // the Rive Neuve: tall quay houses under the rock, shutters, soot-black arcades at the waterline
    const qr = k.rng(5);
    for (let x = -6; x < 330;) {
      const w = 22 + qr() * 18, h = 22 + qr() * 16;
      s += k.building(x, 184, w, h, { roof: qr() < .6 ? 'flat' : 'pitch', tone: qr() < .5 ? 'light' : 'vert', lit: .45, rh: 8 });
      s += k.shape(k.rect(x + w * .72, 184 - h, w * .28, h), 'dark', { w: .4 }) + k.shape(k.rect(x, 176, w, 8), 'black', { w: .5 });
      x += w;
    }

    // ---- the transporter bridge across the mouth: two lattice pylons, the girder, stays, the hanging gondola
    let tb = '';
    const g1 = 430, g2 = 596, gy = 120, top = 86, base = 184;
    for (const x of [g1, g2]) {
      tb += truss(x - 7, base, x - 2, top, 3, 2, 18, 1) + truss(x + 7, base, x + 2, top, 3, 2, 18, 1);
      tb += k.line(`M${P(x - 6, 160)}h12M${P(x - 4.6, 140)}h9.2M${P(x - 3.4, 104)}h6.8`, .8) + k.shape(k.rect(x - 4, top - 4, 8, 5), 'dark', { w: .6 });
    }
    tb += k.line(`M${g1} ${top}L${g1 - 40} ${base}M${g2} ${top}L${g2 + 40} ${base}`, .8); // backstays
    let stays = '';
    for (let i = 1; i <= 5; i++) stays += `M${g1} ${top}L${f(g1 + i * 14)} ${gy}M${g2} ${top}L${f(g2 - i * 14)} ${gy}`;
    tb += k.line(stays, .5);
    tb += k.shape(k.rect(g1 - 8, gy, g2 - g1 + 16, 7), 'paper', { w: 1.2 });
    let lat = '';
    for (let x = g1 - 8, i = 0; x < g2 + 8; x += 5, i++) lat += `${i ? 'L' : 'M'}${P(x, i % 2 ? gy + 7 : gy)}`;
    tb += k.line(lat, .55);
    const gx = 492;
    tb += k.shape(k.rect(gx - 8, gy + 7, 16, 4), 'black', { w: .5 }) + k.line(`M${gx - 6} ${gy + 11}L${gx - 14} 172M${gx + 6} ${gy + 11}L${gx + 14} 172M${gx} ${gy + 11}V172`, .5);
    tb += k.shape(k.rect(gx - 18, 172, 36, 6), 'dark', { w: .8 }) + k.shape(k.rect(gx - 12, 166, 24, 6), 'light', { w: .6 }) + k.figure(gx - 6, 172, .4, 'man') + k.figure(gx + 4, 172, .4, 'woman');
    s += tb;

    // ---- the harbour water; a tug smoking across it
    s += k.water(184, 214, { seed: 12 }) + k.reflect(`<path d="M110 184V108H262V184Z" fill="url(#vert-${k.uid})"/>`, 184, .16);
    s += k.boat(300, 204, .9, 'steamer', 1);

    // ---- tartanes moored stern-to at the near quay: hulls, masts, yards, furled sails, rigging
    let ms = '';
    const boats = [[10, 215, 1.2], [62, 214, 1.05], [92, 216, 1.15], [318, 213, .95], [372, 215, 1.1], [548, 213, .9], [636, 216, 1.2]];
    for (const [x, y, sc] of boats) {
      const L = 46 * sc, H = 9 * sc, mh = 120 * sc;
      ms += k.shape(`M${P(x - L / 2, y - H)}h${f(L)}q-3 ${f(H * .7)} -9 ${f(H)}h${f(-L + 16)}q-6 -2 -7 ${f(-H)}Z`, 'dark', { w: .9 }) + k.line(`M${P(x - L / 2, y - H + 2)}h${f(L)}`, .6, { color: k.paper });
      ms += k.line(`M${P(x, y - H)}V${f(y - mh)}`, 1.4 * sc);
      ms += k.line(`M${P(x - 2, y - mh * .82)}L${P(x + 26 * sc, y - mh * .52)}`, 1.1 * sc) + k.shape(`M${P(x, y - mh * .8)}L${P(x + 24 * sc, y - mh * .53)}l-2 3L${P(x, y - mh * .74)}Z`, 'light', { w: .6 });
      ms += k.line(`M${P(x, y - mh)}L${P(x - L / 2, y - H)}M${P(x, y - mh)}L${P(x + L / 2, y - H)}`, .45);
    }
    s += ms;

    // ---- the quay: paving, the fish market, crates and baskets, barrels, porters, fishwives, a sailor, a gendarme
    let q = k.shape(k.rect(-5, 214, 650, 31), 'paper', { w: 0 }) + k.shape(k.rect(-5, 214, 650, 4), 'vert', { w: 1 }) + k.line('M-5 218H645', 1);
    let pave = '';
    for (let y = 224; y < 242; y += 6) pave += `M-5 ${y}H645`;
    for (let x = -4, i = 0; x < 645; x += 16, i++) for (let y = 218; y < 240; y += 6) pave += `M${f(x + (y / 6 % 2) * 8)} ${y}v6`;
    q += k.line(pave, .4);
    // the awning and its black shade
    q += k.shape('M150 236L170 222H290L300 236Z', 'black', { w: 0, op: .55 }) + k.line('M164 236V200M286 236V200', 1.3);
    q += k.shape('M150 200L162 190H290L302 200Z', 'light', { w: 1 });
    let aw = '';
    for (let x = 152; x < 300; x += 12) aw += k.shape(`M${P(x, 200)}h12v4q-6 3 -12 0Z`, (x / 12) % 2 < 1 ? 'dark' : 'paper', { w: .6 });
    q += aw;
    for (const [x, y] of [[176, 232], [204, 234], [232, 230], [258, 233]]) {
      q += k.shape(k.rect(x - 11, y - 8, 22, 8), 'mid', { w: .8 });
      for (let i = 0; i < 3; i++) q += k.shape(`M${P(x - 8 + i * 6, y - 9)}q3 -3 5 0q-2 3 -5 0l-1.6 1.4v-2.8Z`, 'light', { w: .5 });
    }
    q += k.figure(190, 228, 1.4, 'woman') + k.figure(246, 226, 1.35, 'woman') + k.shape('M240 202q6 -6 12 0v4h-12Z', 'mid', { w: .6 });
    // barrels and a porter with a crate, a sailor coiling rope, a gendarme, a gentleman with a cane
    for (const [x, y] of [[44, 232], [58, 234], [51, 222]]) q += k.shape(`M${P(x - 6, y)}q-1.4 -5 0 -10h12q1.4 5 0 10Z`, 'mid', { w: .8 }) + k.line(`M${P(x - 6.4, y - 3)}h12.8M${P(x - 6.4, y - 7)}h12.8`, .5);
    q += k.figure(100, 238, 1.6, 'porter') + k.figure(338, 236, 1.5, 'man') + k.figure(362, 238, 1.55, 'soldier');
    q += `<ellipse cx="400" cy="234" rx="10" ry="3.4" fill="url(#dark-${k.uid})" stroke="${k.ink}" stroke-width=".7"/>` + k.figure(420, 236, 1.5, 'man');
    q += k.figure(560, 238, 1.6, 'woman') + k.shape('M552 214q8 -6 16 0v6h-16Z', 'dark', { w: .6 }) + k.figure(590, 236, 1.5, 'porter');
    for (const x of [320, 476, 634]) q += k.shape(`M${x - 4} 218v-6q0 -3 4 -3t4 3v6Z`, 'black', { w: .7 });
    // shadows thrown to the right by the noon sun
    let sh = '';
    for (const [x, y, sc] of [[100, 238, 1.6], [190, 228, 1.4], [338, 236, 1.5], [362, 238, 1.55], [420, 236, 1.5], [560, 238, 1.6], [590, 236, 1.5]]) sh += `M${P(x, y)}l${f(16 * sc)} 1.6l-2 1.6l${f(-15 * sc)} -1.4Z`;
    q += k.shape(sh, 'black', { w: 0, op: .6 });
    s += q;
    return s;
  },
};
