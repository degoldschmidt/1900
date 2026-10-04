// Venice: from a gondola on the basin, looking west along the Molo as Canaletto did. The Doge's Palace recedes from
// the right, arcade over arcade under its lozenged wall; the rebuilt Campanile (1912) rises behind its far end, the
// Salute's domes stand across the water at the left, and a gondola glides past in the foreground.

export default {
  id: 'VEN',
  draw(k) {
    const f = k.f, r = k.rng(17);
    const HZ = 175; // the waterline is the horizon: our eye is barely above the water

    // the palace front in perspective: u runs from the east corner (0) to the west (1), h from the quay (0) to the top (1)
    const VX = 190, X0 = 600, T0 = 12, Z1 = 2.6;
    const zAt = (u) => 1 + (Z1 - 1) * u;
    const Q = (u, h) => [VX + (X0 - VX) / zAt(u), HZ - (HZ - T0) * h / zAt(u)];
    const P = (u, h) => { const [x, y] = Q(u, h); return `${f(x)} ${f(y)}`; };
    const quad = (u0, u1, h0, h1) => `M${P(u0, h0)}L${P(u1, h0)}L${P(u1, h1)}L${P(u0, h1)}Z`;
    const arch = (ua, ub, h0, hs, hc) => { const um = (ua + ub) / 2, hq = hc - (hc - hs) * .2; return `M${P(ua, h0)}L${P(ua, hs)}Q${P(ua, hq)} ${P(um, hc)}Q${P(ub, hq)} ${P(ub, hs)}L${P(ub, h0)}Z`; };

    // ---------- far: the Salute and the Dogana across the water, the lagoon's haze ----------
    let far = k.shape(`M-5 ${HZ}V168H40V${HZ}Z`, 'light', { far: true, w: .5 });
    far += k.shape(k.rect(52, 140, 90, 35), 'light', { far: true, w: .5 }) + k.shape(k.rect(70, 124, 54, 16), 'light', { far: true, w: .5 });
    far += k.shape(k.dome(97, 124, 26, 30), 'light', { far: true, w: .7 }) + k.shape(k.rect(93, 84, 8, 8), 'light', { far: true, w: .4 }) + k.shape(k.dome(97, 84, 4, 6), 'mid', { far: true, w: .4 }) + k.line('M97 78v-6', .5, { far: true });
    for (const x of [58, 136]) far += k.shape(`M${x - 6} 142q6 -14 12 0Z`, 'mid', { far: true, w: .4 }); // the great volutes
    far += k.shape(k.dome(150, 140, 10, 12), 'light', { far: true, w: .5 }) + k.shape(k.rect(162, 148, 30, 27), 'light', { far: true, w: .4 });
    far += k.shape(k.rect(196, 150, 8, 25), 'light', { far: true, w: .4 }) + `<circle cx="200" cy="146" r="3.4" fill="url(#midF-${k.uid})" stroke="${k.sepia}" stroke-width=".5"/>`; // the Dogana's golden ball
    far += k.haze(HZ - 26, 26, .4);

    // ---------- the far waterfront: the Zecca and the Library beyond the Piazzetta, the two columns ----------
    let molo = '';
    for (const [u0, u1, h] of [[1.25, 1.55, .5], [1.6, 2.4, .42], [2.5, 4, .3]]) {
      molo += k.shape(quad(u0, u1, 0, h), 'light', { w: .7 }) + k.shape(quad(u0, u1, 0, h * .4), 'mid', { w: 0 });
      for (let u = u0 + .03; u < u1 - .02; u += .06) molo += k.shape(quad(u, u + .025, h * .5, h * .8), 'black', { w: 0 });
    }
    const column = (u, top, lion) => {
      const [x, y0] = Q(u, 0), [, y1] = Q(u, top), w = 26 / zAt(u);
      let s = k.shape(k.rect(x - w / 2, y1, w, y0 - y1), 'vert', { w: .6 }) + k.shape(k.rect(x - w, y1 - 2, w * 2, 2.4), 'light', { w: .5 });
      if (lion) s += k.shape(`M${f(x - 6)} ${f(y1 - 2)}l1 -4q3 -2 7 -1l1.6 -3l1.6 1.4l-.6 2.4l2 1l-1.6 3.2Z`, 'black', { w: .4 });
      else s += k.figure(x, y1 - 2, .42, 'man');
      return s;
    };
    molo += column(1.08, .8, true) + column(1.2, .78, false);

    // ---------- the Campanile, rising behind the palace's far end ----------
    const campanile = (() => {
      const cx = 372, w = 21, shaft = 54;
      let s = k.shape(k.rect(cx - w / 2, shaft, w, HZ - shaft), 'brick', { w: 1.2 });
      s += k.shape(k.rect(cx + w / 2 - 7, shaft, 7, HZ - shaft), 'dark', { w: .5 });
      s += k.line(`M${cx - 4} ${shaft + 3}V140M${cx + 2} ${shaft + 3}V140`, .6);
      s += k.shape(k.rect(cx - w / 2 - 2, shaft - 3, w + 4, 4), 'light', { w: .8 });
      s += k.shape(k.rect(cx - w / 2, shaft - 17, w, 14), 'light', { w: 1 });
      for (let i = 0; i < 4; i++) s += k.shape(k.arch(cx - w / 2 + 1.6 + i * 4.8, shaft - 15.6, 3.2, 11.6), 'black', { w: .4 });
      s += k.shape(k.rect(cx - w / 2 - 2, shaft - 20, w + 4, 3), 'light', { w: .8 });
      s += k.shape(k.rect(cx - w / 2 + 1, shaft - 32, w - 2, 12), 'light', { w: 1 }) + k.shape(k.rect(cx + w / 2 - 6, shaft - 32, 5, 12), 'mid', { w: 0 });
      s += k.shape(k.poly([[cx - w / 2, shaft - 32], [cx, 4], [cx + w / 2, shaft - 32]]), 'mid', { w: 1.1 });
      s += k.shape(k.poly([[cx + 1.2, 6], [cx + w / 2, shaft - 32], [cx + 2.4, shaft - 32]]), 'dark', { w: 0 });
      return s + k.line(`M${cx} 4v-3`, .8) + k.shape(`M${cx - 3} 1.6l3 -2l3 2l-3 -1Z`, 'ink', { w: .5 });
    })();

    // ---------- the Doge's Palace ----------
    const palace = (() => {
      let s = k.shape(quad(0, 1, 0, 1), 'light', { w: 1.2 });
      // the upper wall's lozenges of pink and white stone
      let lat = '';
      for (let i = -14; i < 30; i++) { const u = i * .045; lat += `M${P(u, .56)}L${P(u + .26, 1)}M${P(u + .26, .56)}L${P(u, 1)}`; }
      s += `<clipPath id="ven-wall-${k.uid}"><path d="${quad(0, 1, .56, 1)}"/></clipPath><path d="${lat}" stroke="${k.ink}" stroke-width=".4" opacity=".75" clip-path="url(#ven-wall-${k.uid})"/>`;
      // the great windows and the central balcony
      for (const u of [.08, .21, .34, .66, .79, .92]) {
        s += k.shape(arch(u - .022, u + .022, .62, .8, .87), 'glass', { w: .7 });
        const [x0, y0] = Q(u - .02, .84), [x1, y1] = Q(u + .02, .63);
        if (r() < .5) k.lights.push([f(x1), f(y0), f(x0 - x1), f(y1 - y0)]);
      }
      s += k.shape(arch(.47, .53, .6, .86, .94), 'glass', { w: .9 }) + k.shape(quad(.46, .54, .58, .61), 'mid', { w: .6 }) + k.shape(arch(.48, .52, .94, .97, 1.06), 'dark', { w: .6 });
      // the crenellation of little spikes along the top
      let cren = `M${P(0, 1)}`;
      for (let u = 0; u < .995; u += .02) cren += `L${P(u + .005, 1.045)}L${P(u + .01, 1.02)}L${P(u + .015, 1.045)}L${P(u + .02, 1)}`;
      s += k.shape(cren + 'Z', 'light', { w: .6 });
      // the loggia: slender pointed arches over a balustrade, quatrefoils above
      s += k.shape(quad(0, 1, .28, .56), 'light', { w: .8 });
      for (let i = 0; i < 22; i++) { const u0 = i / 22 + .006, u1 = (i + 1) / 22 - .006; s += k.shape(arch(u0, u1, .31, .44, .5), 'black', { w: .5 }); }
      for (let i = 1; i < 22; i++) { const [x, y] = Q(i / 22, .525), rr = 9 / zAt(i / 22); s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${k.paper}" stroke="${k.ink}" stroke-width=".5"/>`; }
      s += k.shape(quad(0, 1, .28, .315), 'mid', { w: .6 }) + k.line(`M${P(0, .56)}L${P(1, .56)}`, 1);
      // the ground arcade: stout columns, deep shade beneath
      for (let i = 0; i < 11; i++) { const u0 = i / 11 + .016, u1 = (i + 1) / 11 - .016; s += k.shape(arch(u0, u1, 0, .19, .26), 'black', { w: .7 }); }
      s += k.line(`M${P(0, .28)}L${P(1, .28)}`, 1.2);
      // the corner, with its twisted cable moulding
      let cable = `M${P(0, 0)}L${P(0, 1)}`;
      for (let h = .02; h < 1; h += .025) { const [x, y] = Q(0, h); cable += `M${f(x - 1.6)} ${f(y + 1.4)}l3.2 -2.8`; }
      return s + k.line(cable, .7);
    })();

    // ---------- the Ponte della Paglia and the Prisons at the right edge ----------
    let right = k.shape(`M600 ${HZ}V40H614V${HZ}Z`, 'black', { w: .6 }); // the mouth of the Rio di Palazzo
    right += k.shape('M604 112h10v8q-5 4 -10 0Z', 'mid', { w: .6 }); // the Bridge of Sighs, glimpsed up the rio
    right += k.shape(`M612 ${HZ}V46H650V${HZ}Z`, 'light', { w: 1.1 }) + k.shape(`M612 ${HZ}V136H650V${HZ}Z`, 'mid', { w: 0 });
    let rust = ''; for (let y = 52; y < HZ; y += 8) rust += `M612 ${y}H650`;
    right += k.line(rust, .45) + k.shape(k.arch(622, 140, 18, 35), 'black', { w: .7 }) + k.windows(616, 56, 30, 60, 2, 3, { ww: .5, wh: .6, lit: .4 });
    right += k.shape(`M592 ${HZ}Q607 ${HZ - 12} 622 ${HZ}Z`, 'paper', { w: 1 }) + k.line(`M594 ${HZ - 4}Q607 ${HZ - 15} 620 ${HZ - 4}`, .8);

    // ---------- the quay's edge, its people, lamps and moored gondolas ----------
    let quay = '';
    for (let u = .04; u < 1; u += .1) { const [x, y] = Q(u, 0), s = 1 / zAt(u); quay += k.figure(f(x + 6 * s), y, .9 * s, u < .3 ? 'man' : u < .6 ? 'woman' : 'man'); }
    for (const u of [.15, .45, .8]) { const [x, y] = Q(u, 0), s = 1 / zAt(u); quay += k.lamp(x, y, 1.3 * s); k.lights.push([f(x - 2 * s), f(y - 37 * s), f(4 * s), f(5 * s)]); }
    let moored = '';
    for (let u = .02; u < 1.2; u += .085) {
      const [x, y] = Q(u, 0), s = 1 / zAt(u);
      moored += k.boat(x - 4 * s, y + 6 * s, 1.15 * s, 'gondola', -1) + k.line(`M${f(x + 10 * s)} ${f(y + 8 * s)}V${f(y - 14 * s)}`, f(1.2 * s));
    }

    // ---------- the basin ----------
    let water = k.water(HZ, 240, { seed: 12 });
    water += k.reflect(`<g>${campanile}${palace}</g>`, HZ, .18) + k.shape(k.rect(-5, HZ, 650, 3), 'horiz', { w: 0 });
    const vap = (() => { // a vaporetto puffing across, the soot of the modern city on the old
      const x = 260, y = 196;
      let s = k.shape(`M${x - 30} ${y - 6}h58l-5 6h-50Z`, 'black', { w: .7 }) + k.shape(k.rect(x - 22, y - 13, 38, 7), 'light', { w: .6 });
      s += k.windows(x - 21, y - 12, 36, 5, 7, 1, { lit: .6 }) + k.shape(k.rect(x - 25, y - 15, 44, 2.4), 'dark', { w: .5 });
      return s + k.shape(k.rect(x - 2, y - 30, 3.4, 15), 'black', { w: .5 }) + k.smoke(x - .3, y - 31, .8, { seed: 4 });
    })();
    const sail = k.shape('M96 192q20 2 44 0l-6 6h-32Z', 'black', { w: .6 }) + k.shape('M116 190L114 150L138 158L132 188Z', 'mid', { w: .7 }) + k.line('M116 192V146', .9) + `<circle cx="125" cy="170" r="4" fill="${k.paper}" stroke="${k.ink}" stroke-width=".6"/>`;
    // our own gondola gliding left: the black hull, the felze, the gondolier at the oar, the iron ferro
    const gondola = (() => {
      let s = k.shape('M96 216C120 230 200 234 300 232C360 230 404 226 432 212L437 214C414 232 360 240 300 240C200 241 120 236 92 218Z', 'ink', { w: .9 });
      s += k.shape('M92 218C80 210 72 198 70 186L74 186C78 198 86 208 98 214Z', 'ink', { w: .6 });
      s += k.line('M100 220C140 230 220 233 300 231C360 229 400 224 428 214', .8, { color: k.paper });
      s += k.shape('M196 230V214Q196 202 214 200H262Q280 202 280 214V231Z', 'ink', { w: .8 }) + k.shape('M206 208h18v11h-18Z', 'light', { w: .6 }) + k.line('M200 206Q238 196 276 206', .8, { color: k.paper }) + k.line('M276 212V228', .7, { color: k.paper, op: .6 });
      s += k.shape('M68 188L66 156Q74 150 82 154L80 158Q75 156 71 158L72 188Z', 'ink', { w: .6 }); // the ferro: its blade
      for (let i = 0; i < 6; i++) s += k.shape(`M72 ${160 + i * 4.4}h9l1.6 1.2l-1.6 1.2h-9Z`, 'ink', { w: 0 });
      s += k.shape('M68 170h-6l-1.2 1.2l1.2 1.2h6Z', 'ink', { w: 0 });
      s += k.shape('M404 222h7l1 -9h-7Z', 'ink', { w: .5 }); // the forcola
      s += k.figure(420, 220, 2.1, 'man') + k.line('M412 188L462 246', 1.8) + k.line('M424 180l-12 8', 2.2);
      return s;
    })();

    return far + campanile + molo + palace + right + quay + water + moored + vap + sail + gondola;
  },
};
