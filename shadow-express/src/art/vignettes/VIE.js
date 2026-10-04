// Vienna: from the Prater fairground. The Riesenrad stands near and huge on the right, spokes and wagons against the sky;
// St Stephen's single spire and its steep zigzag roof rise over the Leopoldstadt roofs on the left. A carousel, a booth,
// a fiaker and the Sunday crowd under the chestnuts.

export default {
  id: 'VIE',
  draw(k) {
    const f = k.f, r = k.rng(31);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    // a lattice beam from a to b, w0 wide at a and w1 at b, n bays of zigzag bracing
    const truss = (x0, y0, x1, y1, w0, w1, n, lw = 1.1) => {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const pt = (t, s) => { const w = (w0 + (w1 - w0) * t) / 2 * s; return P(x0 + dx * t + nx * w, y0 + dy * t + ny * w); };
      let z = `M${pt(0, -1)}`;
      for (let i = 1; i <= n; i++) z += `L${pt(i / n, i % 2 ? 1 : -1)}`;
      return k.line(`M${pt(0, -1)}L${pt(1, -1)}M${pt(0, 1)}L${pt(1, 1)}`, lw) + k.line(z, lw * .55);
    };
    // a horse standing on y, facing dir (local helper: the kit has none)
    const horse = (x, y, s, dir = 1, tone = 'dark') => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, f(1.25 * s)) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, f(1.3 * s)) + k.shape(body, tone, { w: .6 });
    };
    // a lumpy crown, for trees shaded on the side away from the light
    const blob = (cx, cy, rx, ry, n = 9) => {
      let d = '';
      for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, rr = Math.max(rx, ry) * 2.8 / n; d += i ? `A${f(rr)} ${f(rr)} 0 0 1 ${P(x, y)}` : `M${P(x, y)}`; }
      return d + 'Z';
    };
    const chestnut = (x, y, s) => k.line(`M${P(x, y)}v${f(-14 * s)}`, 2.2 * s) + k.shape(blob(x, y - 22 * s, 13 * s, 11 * s), 'dark', { w: .7 })
      + k.shape(blob(x - 2.5 * s, y - 24 * s, 10 * s, 8.5 * s, 8), 'stipple', { w: 0 });
    // engraved ground: broken horizontal strokes, closer toward the bottom edge
    const hatchGround = (y0, y1, seed, w = .45) => {
      const q = k.rng(seed);
      let d = '';
      for (let y = y0 + 2.5, gap = 5; y < y1; y += gap, gap = Math.max(1.7, gap * .9)) for (let x = -5 + q() * 30; x < 645;) { const l = 16 + q() * 80; d += `M${P(x, y)}h${f(l)}`; x += l + 5 + q() * 34; }
      return k.line(d, w);
    };
    // the frame paints lit windows over everything: drop those hidden behind nearer things
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };

    // ---- far: Leopoldstadt and the inner city in coal smoke, darker at street level
    let s = k.skyline(-5, 430, 182, { seed: 21, hMin: 10, hMax: 26, wMin: 12, wMax: 26, style: 'east', lit: .3 });
    s += k.shape(k.rect(-5, 172, 440, 10), 'mid', { far: true, w: 0 }) + k.haze(146, 36, .4);
    hide([[34, 60, 220, 200], [258, 136, 374, 206], [-5, 160, 50, 230], [214, 170, 262, 210], [384, 174, 432, 210]]); // skyline lights behind nearer things
    s += k.smoke(22, 154, 1, { seed: 3 }) + k.smoke(250, 156, .9, { seed: 8 }) + k.smoke(338, 160, .8, { seed: 5 });

    // ---- St Stephen's: west front, steep zigzag roof, the north tower's little cupola and the great south spire
    const base = 188, eave = 150, ridge = 96, x0 = 44, x1 = 216;
    let c = '';
    c += k.shape(k.rect(170, 84, 15, 30), 'mid', { w: .8 }) + k.shape(k.dome(177.5, 84, 8, 7.5), 'dark', { w: .7 })
      + k.shape(k.rect(176, 70, 3, 8), 'dark', { w: .5 }) + k.shape(k.spire(177.5, 70, 4.4, 8), 'dark', { w: .5 });
    const roof = k.poly([[x0 + 4, eave], [x0 + 8, ridge], [x1 - 32, ridge], [x1, eave]]);
    c += k.shape(roof, 'light', { w: 1.2 });
    let z = '';
    const zig = (yy) => { const p = []; for (let x = x0 - 6, i = 0; x < x1 + 8; x += 5, i++) p.push([x, yy + (i % 2 ? 2.6 : -2.6)]); return p; };
    for (let y = ridge + 5; y < eave; y += 8) z += k.shape(k.poly([...zig(y), ...zig(y + 4).reverse()]), 'dark', { w: .5 });
    c += `<clipPath id="stroof-${k.uid}"><path d="${roof}"/></clipPath><g clip-path="url(#stroof-${k.uid})">${z}</g>` + k.shape(roof, 'none', { w: 1.4 });
    // nave wall: buttresses, tall windows, a row of pointed gables along the eaves; soot-dark below
    c += k.shape(k.rect(x0, eave, x1 - x0, base - eave), 'light', { w: 1 });
    for (let x = x0 + 6; x < x1 - 8; x += 17) {
      c += k.shape(k.gothic(x + 3, eave + 6, 8, base - eave - 12), 'glass', { w: .5 });
      c += k.shape(k.gable(x, eave + 2, 14, 13), 'light', { w: .7 });
      c += k.shape(k.rect(x + 14, eave - 4, 3.4, base - eave + 4), 'dark', { w: .5 }) + k.shape(k.spire(x + 15.7, eave - 4, 4.4, 10), 'dark', { w: .5 });
    }
    c += k.shape(k.rect(x0, base - 9, x1 - x0, 9), 'mid', { w: .6 });
    // west front: a Heathen tower with its octagonal top
    c += k.shape(k.rect(x0 - 8, 102, 14, base - 102), 'vert', { w: 1 }) + k.shape(k.rect(x0 + 1, 102, 5, base - 102), 'dark', { w: .5 })
      + k.shape(k.spire(x0 - 1, 102, 15, 17), 'dark', { w: .8 }) + k.shape(k.gothic(x0 - 5, 114, 6, 16), 'black', { w: .5 });
    c += k.shape(k.rect(x1 - 6, eave - 6, 8, base - eave + 6), 'dark', { w: .7 }) + k.shape(k.spire(x1 - 2, eave - 6, 6, 12), 'dark', { w: .6 });
    // the south tower: one continuous needle stepped with gables and pinnacles, its spire crocketed
    const cx = 130, top = 6;
    const prof = [[base, 18], [150, 16.5], [128, 14.5], [110, 12.5], [93, 10.5], [78, 8.6], [64, 7], [52, 5.8]];
    for (let i = 0; i < prof.length - 1; i++) {
      const [ya, wa] = prof[i], [yb, wb] = prof[i + 1];
      c += k.shape(k.poly([[cx - wa, ya], [cx - wb, yb], [cx + wb, yb], [cx + wa, ya]]), 'vert', { w: 1.1 });
      c += k.shape(k.poly([[cx + wa * .3, ya], [cx + wb * .3, yb], [cx + wb, yb], [cx + wa, ya]]), 'dark', { w: .5 });
      if (i > 0) c += k.shape(k.spire(cx - wb - .6, yb + 1, 3.4, 10), 'dark', { w: .5 }) + k.shape(k.spire(cx + wb + .6, yb + 1, 3.4, 10), 'dark', { w: .5 })
        + k.shape(k.gable(cx - wb * .85, yb + 4, wb * 1.7, 10), 'light', { w: .6 });
      if (i < 5) c += k.shape(k.gothic(cx - wb * .5, yb + 7, wb * .62, ya - yb - 10), 'black', { w: .5 });
    }
    c += k.shape(k.poly([[cx - 5.8, 52], [cx, top], [cx + 5.8, 52]]), 'vert', { w: 1.1 }) + k.shape(k.poly([[cx + 1.4, 52], [cx, top], [cx + 5.8, 52]]), 'dark', { w: .5 });
    for (let y = 47; y > 12; y -= 5.5) { const w = 5.8 * (y - top) / 46; c += k.line(`M${P(cx - w - 1.8, y + 1)}l1.8 -1.8M${P(cx + w + 1.8, y + 1)}l-1.8 -1.8`, .7); }
    c += k.line(`M${P(cx, top)}v-5M${P(cx - 2, top - 3)}h4`, .9);
    s += c;

    // ---- the Riesenrad: A-frame towers, tangent spokes, the lattice rim, thirty wagons, the station below
    const wx = 494, wy = 102, R = 90, rh = 9, Ri = R - 6.5, footY = 206;
    let w = truss(wx, wy, wx - 78, footY, 5, 17, 16, 1.6) + truss(wx, wy, wx + 78, footY, 5, 17, 16, 1.6);
    w += k.line(`M${P(wx - 46, 164)}H${f(wx + 46)}M${P(wx - 62, 186)}H${f(wx + 62)}`, 1.3) + k.line(`M${P(wx - 46, 164)}L${P(wx + 62, 186)}M${P(wx + 46, 164)}L${P(wx - 62, 186)}`, .6);
    let sp = '';
    for (let i = 0; i < 40; i++) {
      const a = i * Math.PI / 20, dir = i % 2 ? 1 : -1, px = wx + Math.cos(a) * rh, py = wy + Math.sin(a) * rh, t = Math.sqrt(Ri * Ri - rh * rh);
      sp += `M${P(px, py)}L${P(px - Math.sin(a) * t * dir, py + Math.cos(a) * t * dir)}`;
    }
    w += k.line(sp, .6);
    const circ = (rr) => `M${P(wx - rr, wy)}a${f(rr)} ${f(rr)} 0 1 0 ${f(2 * rr)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-2 * rr)} 0Z`;
    let lat = '';
    for (let i = 0; i <= 120; i++) { const a = i * Math.PI / 60, rr = i % 2 ? R : Ri; lat += `${i ? 'L' : 'M'}${P(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr)}`; }
    w += k.line(lat, .7) + `<path d="${circ(R)}${circ(Ri)}" fill="none" stroke="${k.ink}" stroke-width="1.8"/>` + k.line(circ(R * .48), .6);
    w += `<circle cx="${wx}" cy="${wy}" r="${rh + 1}" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width="1.3"/><circle cx="${wx}" cy="${wy}" r="3" fill="${k.paper}" stroke="${k.ink}" stroke-width=".8"/>`;
    for (let i = 0; i < 30; i++) {
      const a = i * Math.PI / 15 + .05, px = wx + Math.cos(a) * R, py = wy + Math.sin(a) * R;
      if (py > 184) continue;
      const gw = 13.5, gh = 8.4, gx = px - gw / 2, gy = py + 1.5;
      w += k.line(`M${P(px, py)}v1.8`, .9)
        + k.shape(k.rect(gx, gy + 1.4, gw, gh), 'light', { w: .8 }) + k.shape(k.rect(gx + gw - 3.6, gy + 1.4, 3.6, gh), 'dark', { w: .4 })
        + k.shape(k.poly([[gx - 1.5, gy + 1.6], [gx + 1, gy - .5], [gx + gw - 1, gy - .5], [gx + gw + 1.5, gy + 1.6]]), 'dark', { w: .6 })
        + k.windows(gx + .8, gy + 2.6, gw - 5, gh - 3.8, 3, 1, { ww: .62, wh: .8, lit: .7 });
    }
    w += k.shape(k.rect(wx - 48, 180, 96, 26), 'light', { w: 1 }) + k.shape(k.rect(wx + 30, 180, 18, 26), 'dark', { w: .6 })
      + k.shape(k.poly([[wx - 53, 180], [wx - 42, 169], [wx + 42, 169], [wx + 53, 180]]), 'tiles', { w: 1 })
      + k.windows(wx - 44, 184, 72, 16, 7, 1, { arched: true, ww: .55, wh: .85, lit: .6 }) + k.shape(k.rect(wx - 48, 200, 96, 6), 'mid', { w: .6 })
      + k.flag(wx - 32, 169, .9) + k.flag(wx + 32, 169, .9);
    s += w;

    // ---- the fairground
    let g = k.shape(k.rect(-5, 202, 650, 45), 'paper', { w: 0 }) + hatchGround(202, 242, 7) + k.shape(k.rect(-5, 202, 650, 6), 'light', { w: 0 }) + k.line('M-5 202H645', 1.3);
    for (const [x, y, rx] of [[30, 226, 44], [250, 214, 26], [626, 220, 30]]) g += k.shape(`M${P(x - rx, y)}a${f(rx)} ${f(rx * .14)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(rx * .14)} 0 1 0 ${f(-2 * rx)} 0Z`, 'dark', { w: 0 });
    // carousel: striped tent roof, scalloped valance, posts and horses
    const qx = 316, qy = 208;
    let q = k.shape(k.rect(qx - 46, qy - 7, 92, 7), 'dark', { w: .9 }) + k.shape(k.rect(qx - 46, qy - 36, 92, 29), 'black', { w: 0, op: .55 });
    for (let i = 0; i < 9; i++) q += k.line(`M${P(qx - 40 + i * 10, qy - 7)}V${f(qy - 36)}`, .9);
    for (let i = 0; i < 5; i++) q += horse(qx - 34 + i * 17, qy - 11 - (i % 2) * 4, .55, 1, 'light');
    q += k.shape(`M${P(qx - 52, qy - 36)}L${P(qx, qy - 68)}L${P(qx + 52, qy - 36)}Z`, 'light', { w: 1.1 });
    for (let i = 0; i < 10; i += 2) q += k.shape(k.poly([[qx - 52 + i * 10.4, qy - 36], [qx, qy - 68], [qx - 41.6 + i * 10.4, qy - 36]]), 'dark', { w: .4 });
    let val = `M${P(qx - 52, qy - 36)}`;
    for (let i = 0; i < 8; i++) val += `q6.5 7 13 0`;
    q += k.shape(val + 'Z', 'paper', { w: .9 }) + k.flag(qx, qy - 68, 1);
    g += q;
    // a sausage booth with a striped awning, smoking
    g += k.shape(k.rect(392, 188, 36, 20), 'mid', { w: .8 }) + k.shape(k.rect(395, 192, 30, 8), 'black', { w: .5 });
    for (let i = 0; i < 6; i++) g += k.shape(k.poly([[388 + i * 7.3, 188], [392 + i * 6.4, 178], [398.4 + i * 6.4, 178], [395.3 + i * 7.3, 188]]), i % 2 ? 'paper' : 'dark', { w: .6 });
    g += k.smoke(420, 176, .5, { seed: 2 });
    // chestnuts framing the left, lamps
    g += chestnut(14, 222, 2.4) + chestnut(236, 210, 1.5) + chestnut(622, 216, 1.9);
    g += k.lamp(176, 224, 1.2) + k.lamp(452, 226, 1.2);
    // a fiaker: two horses, a hooded cab, the driver on his box
    const fx = 118, fy = 226, c2 = 1.35, U = (a, b) => P(fx + a * c2, fy + b * c2);
    let fk = k.figure(fx + 19 * c2, fy - 15 * c2, c2 * .95, 'man') + k.figure(fx - 2 * c2, fy - 13 * c2, c2 * .95, 'woman');
    fk += k.shape(`M${U(-9, -12)}L${U(-8, -21)}Q${U(-7, -24)} ${U(-3, -24)}L${U(4, -24)}L${U(6, -18)}L${U(15, -18)}L${U(18, -25)}L${U(23, -25)}L${U(21, -13)}Q${U(10, -10)} ${U(-9, -12)}Z`, 'dark', { w: .8 });
    fk += k.shape(`M${U(-8, -21)}Q${U(-9, -34)} ${U(3, -34)}L${U(5, -23)}Z`, 'black', { w: .7 }) + k.line(`M${U(21, -15)}L${U(40, -13)}`, 1);
    for (const [a, rr] of [[0, 9], [24, 7]]) {
      fk += `<circle cx="${f(fx + a * c2)}" cy="${f(fy - rr * c2)}" r="${f(rr * c2)}" fill="none" stroke="${k.ink}" stroke-width="1.4"/>`;
      for (let i = 0; i < 4; i++) { const q = i * Math.PI / 4; fk += k.line(`M${U(a - Math.cos(q) * rr, -rr - Math.sin(q) * rr)}L${U(a + Math.cos(q) * rr, -rr + Math.sin(q) * rr)}`, .5); }
    }
    fk += horse(fx + 44 * c2, fy, c2 * 1.05) + horse(fx + 49 * c2, fy - 1.5, c2 * 1.05, 1, 'black');
    g += fk;
    // the crowd, near and large; long shadows under them
    for (const [x, y, sc, kind] of [[52, 236, 1.7, 'woman'], [66, 236, 1.75, 'man'], [212, 230, 1.35, 'soldier'], [262, 236, 1.6, 'porter'],
      [372, 232, 1.4, 'woman'], [386, 233, 1.45, 'man'], [452, 238, 1.8, 'man'], [560, 234, 1.5, 'nun'], [584, 236, 1.6, 'man']]) {
      g += k.shape(`M${P(x - 2, y)}l${f(14 * sc)} 1.5l-2 1.4l${f(-12 * sc)} -1Z`, 'dark', { w: 0 }) + k.figure(x, y, sc, kind);
    }
    return s + g;
  },
};
