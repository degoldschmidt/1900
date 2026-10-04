// Prague: from the Old Town bank above the weir. The Old Town Bridge Tower stands near and huge on the right; the Charles
// Bridge runs away from it in perspective, statues black against the light, to the Malá Strana towers; above them
// the castle's long front and St Vitus (the great tower's baroque cap, the twin west spires). A timber raft on the Vltava.

export default {
  id: 'PRG',
  draw(k) {
    const f = k.f, r = k.rng(41);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };

    // ---- the castle hill: Hradčany along the ridge, gardens and Malá Strana roofs falling to the river
    let s = k.shape('M-5 116Q40 100 90 102L360 100Q420 108 470 150L520 178V200H-5Z', 'stipple', { far: true, w: .6 });
    // palace gardens under the castle, then Malá Strana roofs stepping down the slope
    const blob = (cx, cy, rx, ry) => { let d = ''; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; d += i ? `A${f(rx * .5)} ${f(rx * .5)} 0 0 1 ${P(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)}` : `M${P(cx + rx, cy)}`; } return d + 'Z'; };
    for (let i = 0; i < 26; i++) { const x = 20 + i * 15 + r() * 8, y = 118 + r() * 10 + (x > 330 ? (x - 330) * .35 : 0); s += k.shape(blob(x, y, 7 + r() * 4, 5 + r() * 2), i % 3 ? 'stipple' : 'mid', { far: true, w: .5 }); }
    s += k.skyline(-5, 120, 150, { seed: 12, hMin: 8, hMax: 16, wMin: 10, wMax: 16, style: 'north', lit: .3 });
    s += k.skyline(360, 470, 146, { seed: 15, hMin: 8, hMax: 16, wMin: 10, wMax: 16, style: 'north', lit: .3 });
    s += k.skyline(-5, 150, 182, { seed: 13, hMin: 10, hMax: 22, wMin: 10, wMax: 18, style: 'north', lit: .35 });
    s += k.skyline(160, 520, 176, { seed: 14, hMin: 12, hMax: 30, wMin: 12, wMax: 22, style: 'east', lit: .35 });
    // St Nicholas in Malá Strana: the green dome and its belfry
    s += k.shape(k.rect(318, 132, 30, 30), 'light', { far: true }) + k.shape(k.dome(333, 132, 15, 14), 'mid', { far: true }) + k.shape(k.rect(330, 108, 6, 8), 'light', { far: true })
      + k.shape(k.rect(354, 114, 12, 52), 'light', { far: true }) + k.shape(k.dome(360, 114, 7, 8), 'mid', { far: true }) + k.shape(k.spire(360, 105, 3, 10), 'mid', { far: true });
    s += k.haze(146, 36, .4) + k.smoke(40, 140, .8, { seed: 6 }) + k.smoke(410, 136, .8, { seed: 2 });
    // the castle's long south front
    const cb = 108, cr = 88;
    let c = k.shape(k.poly([[66, cr], [72, cr - 8], [352, cr - 8], [358, cr]]), 'dark', { w: .8 }) + k.shape(k.rect(66, cr, 292, cb - cr), 'light', { w: .9 });
    c += k.windows(70, cr + 2, 284, 15, 26, 2, { lit: .45, ww: .4 }) + k.shape(k.rect(66, cb - 4, 292, 4), 'mid', { w: .5 });
    c += k.shape(k.rect(34, cr + 6, 32, 18), 'light', { w: .8 }) + k.windows(36, cr + 8, 28, 12, 3, 1, { lit: .4 }) + k.shape(k.poly([[32, cr + 6], [38, cr], [62, cr], [68, cr + 6]]), 'dark', { w: .6 });
    // St Vitus: the twin west spires (finished 1892), the nave roof, the great south tower with its baroque cap, the choir's buttresses
    for (const x of [164, 184]) {
      c += k.shape(k.rect(x - 6, 48, 12, cr - 48), 'vert', { w: 1 }) + k.shape(k.rect(x + 2, 48, 4, cr - 48), 'dark', { w: .4 });
      c += k.shape(k.spire(x, 48, 13, 40), 'dark', { w: .9 }) + k.shape(k.spire(x - 7, 50, 3, 12), 'dark', { w: .4 }) + k.shape(k.spire(x + 7, 50, 3, 12), 'dark', { w: .4 });
      c += k.shape(k.gothic(x - 2.6, 56, 4.4, 18), 'black', { w: .4 });
    }
    c += k.shape(k.poly([[190, cr], [197, 58], [226, 58], [232, cr]]), 'dark', { w: .9 });
    c += k.shape(k.poly([[248, cr], [254, 60], [292, 62], [302, cr]]), 'dark', { w: .9 });
    for (let x = 254; x < 302; x += 8) c += k.shape(k.spire(x, cr, 3, 18), 'mid', { w: .5 });
    const gx = 239;
    c += k.shape(k.rect(gx - 12, 44, 24, cr - 44 + 2), 'vert', { w: 1.2 }) + k.shape(k.rect(gx + 4, 44, 8, cr - 44 + 2), 'dark', { w: .5 }) + k.shape(k.gothic(gx - 6.5, 52, 9, 26), 'black', { w: .5 });
    c += k.shape(k.rect(gx - 14, 40, 28, 4), 'dark', { w: .7 });
    c += k.shape(`M${P(gx - 12, 40)}C${P(gx - 13, 29)} ${P(gx - 7, 26)} ${P(gx - 4.5, 21)}L${P(gx + 4.5, 21)}C${P(gx + 7, 26)} ${P(gx + 13, 29)} ${P(gx + 12, 40)}Z`, 'mid', { w: 1.1 });
    c += k.shape(`M${P(gx + 3, 40)}C${P(gx + 6, 31)} ${P(gx + 5, 25)} ${P(gx + 3, 21)}L${P(gx + 4.5, 21)}C${P(gx + 7, 26)} ${P(gx + 13, 29)} ${P(gx + 12, 40)}Z`, 'dark', { w: .4 });
    c += k.shape(k.rect(gx - 4, 12, 8, 9), 'light', { w: .7 }) + k.shape(k.rect(gx - 1.2, 13.5, 2.4, 6), 'black', { w: 0 }) + k.shape(k.onion(gx, 12, 10, 8), 'mid', { w: .8 }) + k.line(`M${P(gx, 4)}v-6`, 1);
    s += c;
    hide([[150, 150, 645, 240], [300, 110, 380, 170]]);

    // ---- the Malá Strana bridge towers at the far end
    let mt = k.shape(k.rect(118, 132, 22, 54), 'vert', { w: .9 }) + k.shape(k.rect(133, 132, 7, 54), 'dark', { w: .4 }) + k.shape(k.poly([[116, 132], [129, 106], [142, 132]]), 'dark', { w: .9 });
    mt += k.shape(k.spire(117, 134, 4, 14), 'dark', { w: .5 }) + k.shape(k.spire(141, 134, 4, 14), 'dark', { w: .5 }) + k.shape(k.gothic(124, 140, 6, 10), 'black', { w: .4 });
    mt += k.shape(k.rect(92, 150, 18, 36), 'light', { w: .8 }) + k.shape(k.poly([[90, 150], [101, 136], [112, 150]]), 'dark', { w: .7 }) + k.shape(k.arch(108, 162, 12, 24), 'black', { w: .6 });
    s += mt;

    // ---- the river: water, the slant of the weir, a timber raft with its raftsmen
    let w = k.water(186, 240, { seed: 9 });
    w += k.shape('M-5 212L250 196L256 201L-5 220Z', 'dark', { w: 0 }) + k.shape('M-5 205L250 191L252 196L-5 212Z', 'paper', { w: .9 });
    let fall = '';
    for (let x = 0; x < 250; x += 4) { const y = 211 - x * .062; fall += `M${P(x, y)}l1 ${f(5 + r() * 3)}`; }
    w += k.line(fall, .6);
    // raft: three sections of lashed logs, low in the water
    const rx = 100, ry = 228;
    let raft = '';
    for (let i = 0; i < 3; i++) {
      const x0 = rx + i * 64;
      raft += k.shape(k.poly([[x0, ry], [x0 + 60, ry - 3], [x0 + 64, ry + 3], [x0 + 3, ry + 6]]), 'dark', { w: .8 });
      raft += k.line(`M${P(x0 + 2, ry + 1.6)}l60 -3M${P(x0 + 2.6, ry + 3.6)}l60 -3`, .5, { color: k.paper });
    }
    raft += k.figure(rx + 30, ry + 1, 1.25, 'man') + k.line(`M${P(rx + 24, ry - 26)}L${P(rx + 44, ry + 10)}`, 1.3);
    raft += k.figure(rx + 168, ry - 3, 1.2, 'porter') + k.line(`M${P(rx + 160, ry - 30)}L${P(rx + 184, ry + 6)}`, 1.3);
    w += raft + k.boat(420, 238, 1, 'barge', -1);
    s += w;

    // ---- the Charles Bridge in perspective: parapet, arches, cutwaters, statues
    const VX = 40, VY = 172, X0 = 516, TOP = 120, DECK = 132, WAT = 238;
    const xz = (z) => VX + (X0 - VX) / z;
    const yz = (z, yn) => VY + (yn - VY) / z;
    const at = (z, h) => [xz(z), yz(z, WAT + (TOP - WAT) * h)]; // h: 0 at the water, 1 at the parapet top
    const zF = 3.9, n = 10, dz = (zF - 1) / n;
    // the face of the bridge, stone in the light
    let b = k.shape(k.poly([at(1, 1), at(zF, 1), at(zF, 0), at(1, 0)]), 'light', { w: 1.2 });
    // arches: dark undersides, a strip of light water beyond
    for (let i = 0; i < n; i++) {
      const za = 1 + i * dz + dz * .14, zb = 1 + (i + 1) * dz - dz * .14, pts = [];
      for (let t = 0; t <= 1.001; t += .125) pts.push(at(za + (zb - za) * t, .44 + .38 * Math.sin(Math.PI * t)));
      b += k.shape(k.poly([...pts, at(zb, 0), at(za, 0)]), 'dark', { w: 1 });
      b += k.shape(k.poly([at(za, .05), at(zb, .05), at(zb, 0), at(za, 0)]), 'water', { w: 0 });
      let rim = '';
      for (const [x, y] of pts) rim += `${rim ? 'L' : 'M'}${P(x, y)}`;
      b += k.line(rim, 1.3 / Math.sqrt(1 + i * dz));
    }
    // parapet band and cornice
    b += k.shape(k.poly([at(1, 1), at(zF, 1), at(zF, .9), at(1, .9)]), 'vert', { w: .9 });
    b += k.line(`M${P(...at(1, .9))}L${P(...at(zF, .9))}`, 1.2);
    // cutwaters at the piers, pointing toward us
    for (let i = n; i >= 0; i--) {
      const z = 1 + i * dz, [x, y0] = at(z, 0), [, y1] = at(z, .36), sc = 1 / z;
      b += k.shape(k.poly([[x - 9 * sc, y0], [x - 9 * sc, y1], [x + 2 * sc, y1 + 9 * sc], [x + 13 * sc, y1], [x + 13 * sc, y0 + 4 * sc], [x + 2 * sc, y0 + 10 * sc]]), 'vert', { w: .9 });
      b += k.shape(k.poly([[x + 2 * sc, y1 + 9 * sc], [x + 13 * sc, y1], [x + 13 * sc, y0 + 4 * sc], [x + 2 * sc, y0 + 10 * sc]]), 'dark', { w: .5 });
      b += k.shape(k.poly([[x - 9 * sc, y1], [x + 1 * sc, y1 - 12 * sc], [x + 13 * sc, y1], [x + 2 * sc, y1 + 9 * sc]]), 'mid', { w: .6 });
    }
    // baroque statues on the parapet over each pier, black against the sky; one is the great crucifix
    for (let i = n; i >= 1; i--) {
      const z = 1 + i * dz, [x, y] = at(z, 1), sc = 1.15 / z;
      b += k.shape(k.rect(x - 5 * sc, y - 9 * sc, 10 * sc, 9 * sc), 'dark', { w: .6 });
      if (i === 3) b += k.line(`M${P(x, y - 9 * sc)}v${f(-34 * sc)}M${P(x - 8 * sc, y - 34 * sc)}h${f(16 * sc)}`, 2.2 * sc) + k.shape(`M${P(x - 1.6 * sc, y - 31 * sc)}l-1 ${f(12 * sc)}h${f(5 * sc)}l-1 ${f(-12 * sc)}Z`, 'ink', { w: 0 });
      else {
        b += k.shape(`M${P(x - 6 * sc, y - 9 * sc)}q${f(1 * sc)} ${f(-12 * sc)} ${f(4 * sc)} ${f(-19 * sc)}q${f(2 * sc)} ${f(-3 * sc)} ${f(4 * sc)} 0q${f(4 * sc)} ${f(8 * sc)} ${f(4 * sc)} ${f(19 * sc)}Z`, 'black', { w: .5 });
        b += `<circle cx="${f(x)}" cy="${f(y - 30 * sc)}" r="${f(2.6 * sc)}" fill="${k.ink}"/>`;
        if (i % 2) b += `<circle cx="${f(x)}" cy="${f(y - 30 * sc)}" r="${f(5 * sc)}" fill="none" stroke="${k.ink}" stroke-width="${f(.8 * sc + .2)}"/>`;
        else b += k.line(`M${P(x + 3 * sc, y - 22 * sc)}l${f(6 * sc)} ${f(-8 * sc)}`, 1.2 * sc);
      }
    }
    // gas lamps and walkers along the deck, near end
    for (const [z, kind] of [[1.25, 'man'], [1.5, 'woman'], [2.1, 'man'], [2.6, 'woman']]) { const [x, y] = at(z, .93); b += k.figure(x, y, 1.1 / z, kind); }
    for (const z of [1.35, 1.95, 2.9]) { const [x, y] = at(z, 1); b += k.lamp(x, y, .9 / z); }
    s += b;

    // ---- the Old Town Bridge Tower: gate tower with gallery, steep slate roof and four corner turrets
    const tx = 516, tw = 96, tb = 240, tg = 64;
    let t = k.shape(k.rect(tx, tg, tw, tb - tg), 'light', { w: 1.4 }) + k.shape(k.rect(tx + tw - 26, tg, 26, tb - tg), 'dark', { w: .7 });
    t += k.shape(k.rect(tx, 196, tw, 44), 'mid', { w: .9 }); // soot on the lower courses
    for (const y of [98, 132, 166]) t += k.line(`M${P(tx, y)}h${f(tw)}`, .8);
    t += k.shape(k.gothic(tx + 14, 104, 12, 24), 'black', { w: .6 }) + k.shape(k.gothic(tx + 40, 104, 12, 24), 'black', { w: .6 });
    t += k.windows(tx + 12, 138, 52, 24, 3, 1, { ww: .4, wh: .8, lit: .6 });
    for (let x = tx + 8; x < tx + tw - 10; x += 12) t += k.shape(k.gothic(x, 72, 8, 20), 'mid', { w: .5 });
    t += k.shape(k.arch(tx + 30, 210, 14, 30), 'black', { w: .9 });
    // gallery, roof and turrets
    t += k.shape(k.rect(tx - 4, tg - 6, tw + 8, 6), 'dark', { w: 1 });
    t += k.shape(k.poly([[tx + 6, tg - 6], [tx + 28, 14], [tx + tw - 28, 14], [tx + tw - 6, tg - 6]]), 'dark', { w: 1.3 });
    t += k.shape(k.poly([[tx + tw * .5, tg - 6], [tx + tw * .62, 14], [tx + tw - 28, 14], [tx + tw - 6, tg - 6]]), 'black', { w: .5 });
    t += k.line(`M${P(tx + 28, 14)}H${f(tx + tw - 28)}`, 1.4) + k.line(`M${P(tx + 40, 14)}v-8M${P(tx + tw - 40, 14)}v-8`, 1.1);
    for (const x of [tx - 2, tx + tw - 12]) {
      t += k.shape(k.rect(x, tg - 22, 14, 26), 'vert', { w: 1 }) + k.shape(k.rect(x + 9, tg - 22, 5, 26), 'dark', { w: .4 }) + k.shape(`M${P(x + 2, tg + 4)}l5 8l5 -8Z`, 'mid', { w: .6 });
      t += k.shape(k.spire(x + 7, tg - 22, 16, 34), 'dark', { w: 1 }) + k.line(`M${P(x + 7, tg - 56)}v-5`, .9);
    }
    t += k.shape(k.rect(tx + tw, 150, 40, 90), 'mid', { w: .9 }) + k.windows(tx + tw + 4, 156, 30, 40, 2, 3, { lit: .4 }) + k.shape(k.poly([[tx + tw, 150], [tx + tw + 20, 136], [tx + tw + 44, 150]]), 'tiles', { w: .8 });
    s += t;
    // smoke from Malá Strana and the Old Town, haze along the water
    s += k.smoke(626, 136, 1.1, { seed: 4 });
    return s;
  },
};
