// Hamburg: on the quay under the bow of an emigrant liner of the Hamburg-Amerika Linie. The black hull towers on the
// right, three raked funnels smoking; lattice cranes swing cargo aboard; across the harbour the tower of St Michael
// stands over the waterfront. Emigrants with their bundles and trunks wait on the cobbles by the gangway.

export default {
  id: 'HAM',
  draw(k) {
    const f = k.f, P = k.paper;
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const lerp = (a, b, t) => a + (b - a) * t;
    const QY = 208; // quay edge

    // ---------- far: the north bank, the Landungsbrücken, St Michael's over the roofs, soot
    let far = k.skyline(-5, 330, 168, { seed: 9, style: 'north', hMin: 12, hMax: 30, wMin: 12, wMax: 22 });
    far += k.shape(k.rect(-5, 160, 260, 8), 'light', { far: true, w: .5 }) + k.shape(k.rect(130, 148, 10, 12) + k.rect(200, 150, 8, 10), 'mid', { far: true, w: .4 });
    // the Michel: brick tower, clock stage, the colonnaded lantern, the copper cupola and spire
    const MX = 86, mb = 168, ms = 1.18, my = (m) => mb - m * ms;
    let mic = k.shape(k.rect(MX - 9, my(70), 18, 70 * ms), 'dark', { far: true, w: 1 }) + k.shape(k.rect(MX + 2, my(70), 7, 70 * ms), 'black', { far: true, w: 0 });
    mic += k.shape(k.rect(MX - 7.5, my(84), 15, 14 * ms), 'mid', { far: true, w: 1 }) + `<circle cx="${MX}" cy="${f(my(77))}" r="3.6" fill="${P}" stroke="${k.sepia}" stroke-width=".7"/>`;
    mic += k.shape(k.rect(MX - 8.5, my(85.5), 17, 1.6), 'dark', { far: true, w: .5 });
    mic += k.shape(k.rect(MX - 6, my(98), 12, 12.5 * ms), 'none', { far: true, w: .9 }) + k.line(`M${MX - 6} ${f(my(98))}V${f(my(85.5))}M${MX - 2} ${f(my(98))}V${f(my(85.5))}M${MX + 2} ${f(my(98))}V${f(my(85.5))}M${MX + 6} ${f(my(98))}V${f(my(85.5))}`, 1.3, { far: true });
    mic += k.shape(k.rect(MX - 7, my(99.5), 14, 1.6), 'dark', { far: true, w: .5 });
    mic += k.shape(`M${MX - 6} ${f(my(99.5))}Q${MX - 6} ${f(my(108))} ${MX} ${f(my(109))}Q${MX + 6} ${f(my(108))} ${MX + 6} ${f(my(99.5))}Z`, 'black', { far: true, w: .9 });
    mic += k.shape(k.rect(MX - 2.5, my(113), 5, 4 * ms), 'light', { far: true, w: .5 }) + k.shape(k.spire(MX, my(113), 5.4, 18 * ms), 'black', { far: true, w: .8 }) + k.line(`M${MX} ${f(my(131))}v-4M${MX - 1.6} ${f(my(129.5))}h3.2`, .7, { far: true });
    far += mic + k.haze(110, 60, .34);
    const nFar = k.lights.length;
    for (const [x, sc] of [[150, 1.1], [204, 1.3], [262, .9]]) far += k.shape(k.rect(x - 2, 136, 4, 24), 'dark', { far: true, w: .4 }) + k.smoke(x, 134, sc, { seed: x });

    // ---------- the harbour water, tugs and lighters
    let water = k.water(166, QY + 2, { seed: 7 });
    const tug = (x, yw, sc, dir) => k.shape(`M${f(x - 16 * sc * dir)} ${f(yw - 5 * sc)}h${f(32 * sc * dir)}q${f(2 * sc * dir)} ${f(4 * sc)} ${f(-4 * sc * dir)} ${f(5 * sc)}h${f(-26 * sc * dir)}Z`, 'black', { w: .6 })
      + k.shape(k.rect(x - 7 * sc, yw - 10 * sc, 12 * sc, 5 * sc), 'light', { w: .5 }) + k.shape(k.rect(x - 1.6 * sc, yw - 18 * sc, 3.6 * sc, 8 * sc), 'black', { w: .4 }) + k.smoke(x, yw - 19 * sc, .8 * sc, { seed: Math.round(x) });
    water += tug(70, 186, 1.2, 1) + tug(214, 178, .8, -1);
    water += k.shape('M110 196h52l-3 5h-46ZM40 200h46l-2 4h-42Z', 'dark', { w: .6 }) + k.shape('M118 190h20v6h-20ZM48 195h12v5h-12Z', 'mid', { w: .5 });

    // ---------- the cranes on the quay, jibs over the liner
    const crane = (x, y, h, jibA, jibL) => { // a portal crane: lattice legs over the rails, the cab, a lattice jib
      let c = k.shape(k.poly([[x - 16, y], [x - 6, y - h], [x + 6, y - h], [x + 16, y]]), 'none', { w: 1.3 });
      let lat = '';
      for (let i = 0; i < 6; i++) { const t0 = i / 6, t1 = (i + 1) / 6; lat += seg(lerp(x - 16, x - 6, t0), y - h * t0, lerp(x + 16, x + 6, t1), y - h * t1) + seg(lerp(x + 16, x + 6, t0), y - h * t0, lerp(x - 16, x - 6, t1), y - h * t1); }
      c += k.line(lat, .55) + k.shape(k.rect(x - 10, y - 6, 20, 3), 'dark', { w: .6 });
      c += k.shape(k.rect(x - 9, y - h - 14, 18, 14), 'light', { w: 1 }) + k.shape(k.rect(x + 2, y - h - 14, 7, 14), 'dark', { w: 0 }) + k.shape(k.gable(x - 10, y - h - 14, 20, 5), 'dark', { w: .8 });
      k.lights.push([x - 7, y - h - 11, 6, 5]);
      const jx = x + Math.cos(jibA) * jibL, jy = y - h - 8 - Math.sin(jibA) * jibL, nx = -Math.sin(jibA) * 3.4, ny = -Math.cos(jibA) * 3.4;
      c += k.line(seg(x + 6, y - h - 6, jx, jy) + seg(x + 6 + nx, y - h - 6 + ny, jx, jy), 1.1);
      let jl = '';
      for (let i = 1; i < 10; i++) { const t = i / 10; jl += seg(lerp(x + 6, jx, t), lerp(y - h - 6, jy, t), lerp(x + 6 + nx, jx, t + .05), lerp(y - h - 6 + ny, jy, t + .05)); }
      c += k.line(jl, .5) + k.line(seg(x - 6, y - h - 18, jx, jy) + seg(x - 6, y - h - 14, x - 6, y - h - 22), .6);
      c += k.shape(k.rect(x - 16, y - h - 12, 7, 8), 'black', { w: .5 }); // the counterweight
      return { svg: c, hook: [jx, jy] };
    };
    const c1 = crane(188, QY, 70, .62, 92), c2 = crane(262, QY, 78, .38, 70);
    let cranes = c1.svg + c2.svg;
    // a cargo net of crates swinging from the first crane
    const [hx, hy] = c1.hook;
    cranes += k.line(seg(hx, hy, hx, hy + 52), .7) + k.shape(`M${f(hx - 10)} ${f(hy + 52)}h20l-3 14h-14Z`, 'mid', { w: .7 }) + k.line(`M${f(hx - 10)} ${f(hy + 52)}L${f(hx)} ${f(hy + 46)}L${f(hx + 10)} ${f(hy + 52)}M${f(hx - 6)} ${f(hy + 58)}h12`, .6);
    const [gx2, gy2] = c2.hook;
    cranes += k.line(seg(gx2, gy2, gx2, gy2 + 30), .7) + k.shape(k.rect(gx2 - 6, gy2 + 30, 12, 9), 'dark', { w: .6 });

    // ---------- the liner: the bow on the left, the black hull running off right in perspective
    const BX = 318, top0 = 98, top1 = 136, wl0 = QY + 4, wl1 = QY - 2;
    const hullY = (x, t) => lerp(lerp(top0, top1, (x - BX) / (650 - BX)), lerp(wl0, wl1, (x - BX) / (650 - BX)), t);
    let liner = '';
    // the superstructure, set back above the hull: white decks with windows, boats in davits
    const decks = [[.0, 22, 330, 650], [22, 40, 380, 650]];
    for (const [d0, d1, xa, xb] of decks) {
      const ya = (x) => hullY(x, 0) - d1 * (1 - (x - BX) / 600 * .35), yb = (x) => hullY(x, 0) - d0 * (1 - (x - BX) / 600 * .35);
      liner += k.shape(k.poly([[xa, yb(xa)], [xa + 6, ya(xa)], [xb, ya(xb)], [xb, yb(xb)]]), 'light', { w: 1 });
      let wn = '';
      for (let x = xa + 12; x < xb - 4; x += 9 - (x - BX) / 120) { const y0 = lerp(ya(x), yb(x), .3), h = (yb(x) - ya(x)) * .38; wn += k.rect(x, y0, 3.4 - (x - BX) / 300, h); if (k.rand() < .4) k.lights.push([f(x), f(y0), f(3.4 - (x - BX) / 300), f(h)]); }
      liner += k.shape(wn, 'glass', { w: .4 });
      liner += k.line(seg(xa, ya(xa), xb, ya(xb)), 1.4);
    }
    let boats = '';
    for (const x of [420, 478, 530, 576, 618]) { const y0 = hullY(x, 0) - 44 * (1 - (x - BX) / 600 * .35); boats += `M${x} ${f(y0)}h${f(22 - (x - BX) / 30)}q-2 5 -6 5h${f(-10 + (x - BX) / 60)}q-4 0 -6 -5Z`; }
    liner += k.shape(boats, 'light', { w: .7 });
    // three funnels, raked, banded, smoking
    for (const [fx, fw, fh] of [[436, 24, 54], [520, 21, 47], [596, 18, 41]]) {
      const by = hullY(fx, 0) - 44 * (1 - (fx - BX) / 600 * .35), ty = by - fh, rake = 10;
      liner += k.shape(k.poly([[fx - fw / 2, by], [fx - fw / 2 + rake, ty], [fx + fw / 2 + rake, ty], [fx + fw / 2, by]]), 'dark', { w: 1.1 });
      liner += k.shape(k.poly([[fx + fw * .1, by], [fx + fw * .1 + rake, ty], [fx + fw / 2 + rake, ty], [fx + fw / 2, by]]), 'black', { w: 0 });
      liner += k.shape(k.poly([[fx - fw / 2 + rake * .8, ty + fh * .2], [fx - fw / 2 + rake, ty], [fx + fw / 2 + rake, ty], [fx + fw / 2 + rake * .8, ty + fh * .2]]), 'black', { w: 1 }) + k.line(seg(fx - fw / 2 + rake * .76, ty + fh * .24, fx + fw / 2 + rake * .76, ty + fh * .24), 2, { color: P });
      liner += k.smoke(fx + rake + 2, ty - 2, 1.9 - (fx - 436) / 200, { seed: fx });
    }
    // the masts and their stays
    liner += k.line(`M352 ${f(hullY(352, 0) - 4)}L360 2M630 ${f(hullY(630, 0) - 40)}L636 10`, 2) + k.line(`M360 4L${BX + 2} ${f(top0 + 2)}M360 4L470 ${f(hullY(470, 0) - 40)}M360 16H372M636 14L600 ${f(hullY(600, 0) - 40)}`, .6);
    // the hull: black, the white sheer strake, rows of portholes, the anchor at the hawse
    liner += k.shape(`M${BX} ${top0}L650 ${top1}V${wl1}L${BX + 26} ${wl0}Q${BX + 4} ${wl0 - 30} ${BX} ${top0}Z`, 'black', { w: 1.4 });
    liner += k.line(`M${BX + 2} ${top0 + 4}L650 ${top1 + 3}`, 1.6, { color: P });
    let ports = '';
    for (const t of [.2, .36, .52]) for (let x = BX + 18; x < 646; x += 9 - (x - BX) / 90) { const yy = hullY(x, t); if (x > BX + 8 + (yy - top0) * .14) ports += `M${f(x)} ${f(yy)}a1.3 1.3 0 1 0 .1 0`; }
    liner += k.line(ports, 1.5, { color: P });
    liner += k.shape(`M${BX + 14} ${top0 + 22}a5 5 0 1 0 .1 0Z`, 'dark', { w: .9 }) + k.line(`M${BX + 14} ${top0 + 28}v30m-6 -4q6 8 12 0M${BX + 10} ${top0 + 34}h8`, 1.6) + k.line(`M${BX + 14} ${top0 + 28}v30`, .5, { color: P });
    liner += k.line(`M${BX} ${top0}l-6 -6h14`, 1.4); // the jackstaff at the stem
    // mooring lines to the bollards
    liner += k.line(`M${BX + 30} ${top0 + 16}Q${BX - 10} ${QY - 20} ${BX - 40} ${QY - 4}M${BX + 60} ${top0 + 22}Q${BX + 20} ${QY - 6} ${BX + 10} ${QY - 4}`, .9);
    // the gangway up her side
    liner += k.shape(k.poly([[476, QY - 2], [490, QY - 2], [548, hullY(548, .18) + 2], [536, hullY(536, .18) + 2]]), 'light', { w: .9 }) + k.line(`M476 ${QY - 10}L536 ${f(hullY(536, .18) - 8)}`, .7);
    liner += k.shape(k.rect(538, hullY(540, .12) - 8, 12, 14), 'ink', { w: 0 });
    k.lights.push([539, f(hullY(540, .12) - 7), 10, 12]);

    // ---------- the quay: setts, crane rails, bollards, crates; the emigrants
    let quay = k.shape(`M-5 ${QY}H645V245H-5Z`, 'paper', { w: 0 }) + k.line(`M-5 ${QY}H645`, 1.6);
    quay += k.shape(`M-5 ${QY}H645V${QY + 4}H-5Z`, 'dark', { w: 0 });
    let sett = '';
    for (let yy = QY + 8; yy < 242; yy += 4 + (yy - QY) * .1) { const w = 5 + (yy - QY) * .35; for (let x = ((yy * 5) % w) - 6; x < 650; x += w) sett += `M${f(x)} ${f(yy)}h${f(w * .8)}`; }
    quay += k.line(sett, .5) + k.line(`M-5 ${QY + 12}H645M-5 ${QY + 15}H645`, 1);
    quay += k.shape(`M${BX - 46} ${QY}v-6q0 -3 4 -3t4 3v6ZM${BX + 6} ${QY}v-6q0 -3 4 -3t4 3v6Z`, 'black', { w: .7 });
    let crates = k.shape(k.rect(20, 214, 26, 18) + k.rect(46, 220, 20, 12) + k.rect(28, 200, 18, 14), 'light', { w: .9 }) + k.line('M20 223h26M33 214v18M46 226h20M28 207h18', .6);
    crates += k.shape(`M78 232a9 4 0 0 1 18 0v-14a9 4 0 0 0 -18 0Z`, 'mid', { w: .8 }) + k.shape('M92 232a8 3.6 0 0 1 16 0v-12a8 3.6 0 0 0 -16 0Z', 'dark', { w: .8 });
    // the emigrants: families with bundles, a man on a trunk, a child, a Schutzmann keeping order
    const bundle = (x, y, sc) => k.shape(`M${f(x)} ${f(y)}a${f(4 * sc)} ${f(3.4 * sc)} 0 1 1 ${f(8 * sc)} 0Z`, 'stipple', { w: .6 });
    let folk = '';
    folk += k.figure(150, 236, 1.2, 'man') + k.figure(162, 237, 1.15, 'woman') + k.figure(172, 236, .65, 'woman') + bundle(176, 222, 1.2) + k.figure(132, 234, 1.15, 'woman') + bundle(118, 236, 1.4);
    folk += k.shape(k.rect(214, 226, 22, 10), 'dark', { w: .8 }) + k.figure(225, 226, 1.0, 'man') + k.figure(250, 238, 1.2, 'porter');
    folk += k.figure(300, 230, 1.05, 'soldier') + k.figure(352, 224, .95, 'woman') + k.figure(364, 225, .95, 'man') + bundle(370, 216, 1);
    folk += k.figure(420, 236, 1.2, 'porter') + k.shape(k.rect(426, 214, 12, 9), 'light', { w: .7 }) + k.figure(452, 228, 1.05, 'woman') + k.figure(468, 226, .95, 'man');
    folk += k.figure(520, 239, 1.25, 'man') + k.figure(560, 232, 1.1, 'woman') + k.figure(574, 233, .62, 'man') + bundle(586, 224, 1.3) + k.figure(612, 238, 1.2, 'priest');
    folk += k.lamp(268, 240, 1.4);
    k.lights.push([265.8, 199.9, 4.5, 5.9]);

    hide(nFar, [[316, 0, 650, 220]]); // the north bank behind the liner's bow stays dark
    return far + water + cranes + liner + quay + crates + folk;
  },
};
