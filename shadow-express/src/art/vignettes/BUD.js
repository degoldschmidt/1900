// Budapest: from the roadway of the Chain Bridge, looking upriver. The Buda pylon's dressed stone stands at the left;
// the great eyebar chains sweep down across the view, hung with rods to the lattice parapet. Beyond the Danube the
// Parliament fills the Pest bank; Castle Hill rises on the left with the Matthias Church and the Fishermen's Bastion.

export default {
  id: 'BUD',
  draw(k) {
    const f = k.f, r = k.rng(52);
    const bank = 168, par = 194, deck = 214;

    // ---------- far: St Stephen's dome over the Pest roofs, factory smoke ----------
    let far = k.shape(k.rect(596, 100, 30, 30), 'light', { far: true, w: .5 }) + k.shape(k.dome(611, 100, 15, 18), 'mid', { far: true, w: .6 }) + k.shape(k.rect(608, 70, 6, 8), 'light', { far: true, w: .4 }) + k.line('M611 70v-6', .5, { far: true });
    for (const x of [586, 636]) far += k.shape(k.rect(x - 4, 92, 8, 38), 'light', { far: true, w: .5 }) + k.shape(k.dome(x, 92, 4, 5), 'mid', { far: true, w: .4 });
    far += k.shape(k.rect(606, 104, 4, 30), 'black', { far: true, w: .4 }) + k.smoke(608, 102, .7, { seed: 3 });
    far += k.haze(bank - 36, 36, .35);

    // ---------- Castle Hill on the Buda side ----------
    const hill = (() => {
      let s = k.shape(`M30 ${bank}C60 148 84 112 118 96C150 82 220 78 262 88C290 98 306 130 322 ${bank}Z`, 'stipple', { far: true, w: .8 });
      for (let i = 0; i < 14; i++) { const x = 60 + r() * 250, y = 112 + r() * 40, w = 6 + r() * 6; s += k.shape(`M${f(x - w)} ${f(y)}q${f(w * .3)} ${f(-w)} ${f(w)} ${f(-w * .9)}q${f(w)} 0 ${f(w)} ${f(w * .9)}Z`, 'dark', { far: true, w: .4 }); }
      s += k.skyline(52, 322, bank, { seed: 21, style: 'east', far: true, hMin: 10, hMax: 22, wMin: 12, wMax: 20 }); // the Water Town
      // the Fishermen's Bastion: white arcades and conical turrets along the crest
      s += k.shape(k.rect(140, 88, 112, 12), 'light', { far: true, w: .6 });
      for (let x = 144; x < 250; x += 8) s += k.shape(k.arch(x, 91, 4, 9), 'dark', { far: true, w: .3 });
      for (const [x, h] of [[142, 14], [170, 20], [206, 24], [242, 16]]) s += k.shape(k.rect(x - 3.5, 94 - h, 7, h - 6), 'paper', { far: true, w: .5 }) + k.shape(k.spire(x, 94 - h, 10, 11), 'mid', { far: true, w: .5 });
      // the Matthias Church and its tall tiled spire
      s += k.shape(k.rect(184, 70, 40, 18), 'light', { far: true, w: .6 }) + k.shape(k.gable(182, 70, 44, 14), 'tiles', { far: true, w: .6 });
      s += k.shape(k.rect(214, 40, 13, 48), 'light', { far: true, w: .6 }) + k.shape(k.rect(222, 40, 5, 48), 'mid', { far: true, w: 0 });
      s += k.shape(k.spire(220.5, 40, 15, 30), 'dark', { far: true, w: .6 }) + k.line('M220.5 10v-5M218.5 7h4', .6, { far: true });
      return s;
    })();

    // ---------- the Parliament on the Pest bank ----------
    const parl = (() => {
      const x0 = 300, x1 = 652, by = bank, top = 128, cx = 476;
      let s = k.shape(k.rect(x0, top, x1 - x0, by - top), 'light');
      s += k.shape(k.rect(x0, by - 12, x1 - x0, 12), 'mid', { w: .7 });
      for (let x = x0 + 4; x < x1; x += 10) s += k.shape(k.gothic(x + 2, top + 8, 5, 18), 'glass', { w: .45 }) + k.shape(k.gothic(x + 2, top + 30, 5, 9), 'glass', { w: .45 });
      for (let x = x0; x <= x1; x += 20) s += k.shape(k.rect(x - 1.5, top - 6, 3, 7), 'mid', { w: .5 }) + k.shape(k.spire(x, top - 6, 4, 9), 'dark', { w: .5 });
      s += k.shape(k.poly([[x0, top], [x0 + 10, top - 12], [cx - 62, top - 12], [cx - 52, top]]), 'dark', { w: .8 }) + k.shape(k.poly([[cx + 52, top], [cx + 62, top - 12], [x1, top - 12], [x1, top]]), 'dark', { w: .8 });
      for (const [x, w] of [[x0, 16], [cx - 118, 26], [cx + 92, 26], [x1 - 24, 22]]) { // pavilions with steep roofs and corner turrets
        s += k.shape(k.rect(x, top - 16, w, by - top + 16), 'light', { w: .9 }) + k.shape(k.rect(x + w - 6, top - 16, 6, by - top + 16), 'dark', { w: 0 });
        s += k.windows(x + 2, top - 12, w - 9, 40, 2, 3, { arched: true, ww: .5, wh: .7 });
        s += k.shape(k.poly([[x - 2, top - 16], [x + w / 2, top - 40], [x + w + 2, top - 16]]), 'dark', { w: .8 });
        s += k.shape(k.spire(x + 1, top - 16, 4, 14), 'dark', { w: .5 }) + k.shape(k.spire(x + w - 1, top - 16, 4, 14), 'dark', { w: .5 });
      }
      // the central block, its two slender spires, the drum and the great ribbed dome
      s += k.shape(k.rect(cx - 40, top - 22, 80, by - top + 22), 'light', { w: 1 }) + k.shape(k.rect(cx + 26, top - 22, 14, by - top + 22), 'dark', { w: .5 });
      s += k.windows(cx - 36, top - 18, 58, 44, 5, 2, { arched: true, ww: .45, wh: .7 });
      s += k.shape(k.gable(cx - 18, top - 22, 36, 14), 'mid', { w: .8 });
      for (const sx of [cx - 48, cx + 48]) s += k.shape(k.rect(sx - 3.5, top - 54, 7, 54), 'vert', { w: .7 }) + k.shape(k.spire(sx, top - 54, 8, 32), 'dark', { w: .7 });
      s += k.shape(k.rect(cx - 31, 88, 62, 18), 'light', { w: 1 }) + k.shape(k.rect(cx + 15, 88, 16, 18), 'dark', { w: 0 });
      for (let x = cx - 29; x < cx + 27; x += 7) s += k.shape(k.gothic(x, 90, 4, 14), 'glass', { w: .4 });
      for (let x = cx - 31; x <= cx + 31; x += 10.3) s += k.shape(k.spire(x, 88, 3.5, 10), 'dark', { w: .5 });
      s += k.shape(`M${cx - 29} 88C${cx - 31} 60 ${cx - 15} 43 ${cx} 39C${cx + 15} 43 ${cx + 31} 60 ${cx + 29} 88Z`, 'light', { w: 1.3 });
      s += k.shape(`M${cx + 4} 40C${cx + 19} 47 ${cx + 31} 62 ${cx + 29} 88H${cx + 10}C${cx + 12} 68 ${cx + 10} 51 ${cx + 4} 40Z`, 'dark', { w: 0 });
      for (const t of [-.66, -.33, 0, .33, .66]) s += k.line(`M${f(cx + t * 29)} 88Q${f(cx + t * 25)} 54 ${cx} 39`, .6);
      s += k.shape(k.rect(cx - 5, 27, 10, 13), 'light', { w: .8 }) + k.shape(k.spire(cx, 27, 9, 24), 'dark', { w: .8 }) + k.line(`M${cx} 3v-3`, .7);
      return s;
    })();

    // ---------- the Danube ----------
    let water = k.water(bank, 240, { seed: 33 });
    water += k.reflect(k.shape(k.rect(300, 128, 352, 40), 'light', { w: .6 }) + k.shape(`M447 88C445 60 461 43 476 39C491 43 507 60 505 88Z`, 'light', { w: 1 }) + k.shape(k.rect(436, 106, 80, 62), 'light', { w: .8 }), bank, .2) + k.shape(k.rect(-5, bank, 650, 3), 'horiz', { w: 0 });
    const paddle = (x, y, s, dir = 1) => { // a Danube paddle steamer
      const S = (n) => f(n * s), D = (n) => f(n * s * dir);
      let o = k.shape(`M${f(x - 34 * s * dir)} ${f(y - 6 * s)}h${D(70)}l${D(-6)} ${S(6)}h${D(-60)}Z`, 'black', { w: .7 });
      o += k.shape(k.rect(x - 26 * s, y - 13 * s, 50 * s, 7 * s), 'light', { w: .6 }) + k.windows(x - 25 * s, y - 12 * s, 48 * s, 5 * s, 9, 1, { lit: .6 });
      o += k.shape(k.rect(x - 28 * s, y - 15 * s, 56 * s, 2.4 * s), 'dark', { w: .5 });
      o += k.shape(`M${f(x - 8 * s)} ${f(y - 6 * s)}a${S(8)} ${S(8)} 0 0 1 ${S(16)} 0Z`, 'dark', { w: .6 });
      o += k.shape(k.rect(x - 2 * s, y - 32 * s, 4.4 * s, 17 * s), 'black', { w: .5 }) + k.smoke(x, y - 33 * s, .9 * s, { seed: 6 });
      return o + k.flag(x + 30 * s * dir, y - 15 * s, .5 * s);
    };
    const traffic = paddle(250, 188, .75, -1) + k.boat(120, 180, .5, 'barge', 1) + k.boat(560, 184, .55, 'barge', -1) + k.boat(400, 186, .5, 'sail', 1);

    // ---------- the bridge: rods, lattice parapet, the chains overhead ----------
    const chainY = (x, d = 0) => { const t = (590 - x) / 524; return 196 + d - 190 * t * t; };
    let rods = '';
    for (let x = 90; x < 640; x += 24) { const y = chainY(x, 9); if (par - y > 3) rods += `M${x} ${f(y)}V${par}`; }
    let bridge = k.line(rods, .7);
    // the parapet: an iron lattice between two rails, posts at intervals
    bridge += k.shape(k.rect(60, par, 590, deck - par), 'none', { w: 0 });
    let lat = '';
    for (let x = 52; x < 650; x += 9) lat += `M${x} ${par + 2}l9 ${deck - par - 4}M${x + 9} ${par + 2}l-9 ${deck - par - 4}`;
    bridge += k.line(lat, .55) + k.shape(k.rect(60, par - 2, 590, 4), 'dark', { w: .8 }) + k.shape(k.rect(60, deck - 3, 590, 4), 'dark', { w: .8 });
    for (let x = 108; x < 650; x += 96) bridge += k.shape(k.rect(x - 3, par - 4, 6, deck - par + 2), 'black', { w: .5 });
    for (const x of [300, 492]) { bridge += k.lamp(x, par - 4, 1.4); k.lights.push([f(x - 3.5), f(par - 4 - 40.6), 7, 7]); }
    // the chains: two strands of eyebars pinned link to link, lit along their tops
    const strand = (d, w) => {
      let path = '', pins = '';
      for (let x = 66; x <= 650; x += 6) path += `${x === 66 ? 'M' : 'L'}${x} ${f(chainY(x, d))}`;
      let s = k.line(path, w) + k.line(path.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (m, a, b) => `${a} ${f(+b - w * .32)}`), w * .22, { color: k.paper });
      for (let x = 66; x < 650; x += 30) pins += `<circle cx="${x}" cy="${f(chainY(x, d))}" r="${f(w * .42)}" fill="${k.paper}" stroke="${k.ink}" stroke-width=".8"/>`;
      return s + pins;
    };
    bridge += strand(9, 5.4) + strand(0, 6.6);

    // ---------- the roadway, its people, a cab ----------
    let road = k.shape(k.rect(-5, deck, 655, 32), 'paper', { w: 0 }) + k.line(`M-5 ${deck}H650`, 1.2);
    let setts = '';
    for (let row = 0; row < 5; row++) { const y = deck + 4 + row * 5 + row * row * .5; for (let x = (row % 2) * 7 - 7; x < 650; x += 13 + row * 2) setts += `M${f(x)} ${f(y)}q${f(3 + row * .5)} -2.4 ${f(7 + row)} 0`; }
    road += k.line(setts, .5) + k.shape(k.rect(-5, deck, 655, 3), 'dark', { w: 0, op: .6 });
    road += k.figure(236, 238, 1.4, 'man') + k.figure(251, 238, 1.35, 'woman') + k.figure(452, 239, 1.45, 'soldier') + k.figure(150, 237, 1.3, 'porter');
    const cab = (x, y, s) => { // a fiaker trotting toward Pest: solid ink silhouettes, paper highlights
      const T = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, u, w) => `${f(x + u * s)} ${f(y + w * s)}`);
      let o = k.shape(T('M2 -24 C10 -27 22 -25 28 -28 C30 -32 32 -36 34 -38 L35 -42 L37 -38 C39 -37 41 -33 42 -31 L41 -28 C38 -29 36 -30 34 -30 C33 -27 32 -24 31 -20 C28 -16 18 -16 10 -16 C6 -17 3 -19 1 -22 Z'), 'ink', { w: .6 });
      o += k.line(T('M29 -18 L33 -9 L31 -2 M27 -18 L25 -9 L21 -4 M7 -17 L4 -8 L5 0 M10 -17 L13 -9 L12 0'), 2.2 * s);
      o += k.line(T('M2 -24 C-2 -22 -3 -16 -2 -11'), 1.6 * s) + k.line(T('M12 -25 C20 -27 26 -26 30 -30'), .7, { color: k.paper });
      o += k.line(T('M30 -24 L-6 -18'), 1.2); // the shafts
      o += k.shape(T('M-36 -12 L-6 -12 C-4 -16 -5 -24 -10 -26 L-34 -26 C-38 -24 -38 -16 -36 -12 Z'), 'ink', { w: .6 }); // the body
      o += k.shape(T('M-36 -26 C-40 -36 -32 -42 -24 -42 L-22 -26 Z'), 'dark', { w: .7 }); // the folded hood
      o += k.line(T('M-33 -20 L-10 -20'), .8, { color: k.paper });
      o += k.shape(T('M-12 -26 L-10 -34 L-2 -34 L-4 -26 Z'), 'ink', { w: .5 }); // the box
      o += k.figure(x - 6 * s, y - 34 * s, .8 * s, 'man') + k.line(T('M-3 -44 C6 -54 18 -52 26 -46'), .6);
      for (const [wx, wr] of [[-28, 9], [-9, 6.5]]) o += `<circle cx="${f(x + wx * s)}" cy="${f(y - wr * s)}" r="${f(wr * s)}" fill="none" stroke="${k.ink}" stroke-width="${f(1.4 * s)}"/>` + k.line(T(`M${wx - wr} ${-wr} L${wx + wr} ${-wr} M${wx} ${-2 * wr} L${wx} 0`), .6);
      return o;
    };
    road += cab(552, 240, 1.15);

    // ---------- the Buda pylon: dressed stone, sooted at its foot ----------
    const pylon = (() => {
      let s = k.shape('M-6 -6H66V246H-6Z', 'light', { w: 1.4 });
      let joints = '';
      for (let y = 4, row = 0; y < 240; y += 10, row++) { joints += `M-6 ${y}H54`; for (let x = (row % 2) * 9 + 4; x < 54; x += 18) joints += `M${x} ${y}v10`; }
      s += k.line(joints, .45) + k.shape('M52 -6H66V246H52Z', 'dark', { w: .7 });
      s += k.shape('M-6 150H66V246H-6Z', 'mid', { w: 0, op: .5 }) + k.shape('M-6 206H68V246H-6Z', 'vert', { w: 1 });
      s += k.shape('M-6 22H70V30H-6Z', 'light', { w: 1 }) + k.line('M-6 30H70', 1.4);
      return s;
    })();

    return far + hill + parl + water + traffic + bridge + road + pylon;
  },
};
