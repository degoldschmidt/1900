// Odessa: from the grain harbour, looking straight up the great stairs, which widen as they come down so that
// the eye runs up them to the Duke's statue between the two crescent buildings. A grain steamer's bow and
// a barque's masts frame the view like theatre wings; sacks and porters crowd the quay.

export default {
  id: 'ODE',
  draw(k) {
    const f = k.f, r = k.rng(46);
    const cliff = 98, quayY = 200, sea = 214;
    const bL = 232, bR = 408, tL = 300, tR = 340; // the stairs: bottom and top edges

    // ---------- the city on the cliff ----------
    let far = k.skyline(-5, 645, cliff, { seed: 31, style: 'east', hMin: 12, hMax: 28, wMin: 14, wMax: 26 });
    far += k.shape(k.rect(496, 46, 30, 52), 'light', { far: true, w: .5 }) + k.shape(k.dome(511, 46, 15, 16), 'mid', { far: true, w: .6 }) + k.shape(k.rect(508, 22, 6, 12), 'light', { far: true, w: .4 }) + k.shape(k.onion(511, 22, 9, 10), 'mid', { far: true, w: .4 });
    far += k.shape(k.rect(140, 40, 10, 58), 'light', { far: true, w: .5 }) + k.shape(k.spire(145, 40, 12, 24), 'mid', { far: true, w: .5 }); // a belfry
    far += k.haze(cliff - 26, 26, .35);
    // the Vorontsov colonnade at the cliff's edge
    let colon = k.shape(k.rect(40, 88, 110, 10), 'light', { w: .7 });
    for (let x = 44; x < 148; x += 8) colon += k.shape(k.rect(x, 74, 3, 14), 'paper', { w: .5 });
    colon += k.shape(k.rect(38, 70, 114, 4), 'light', { w: .6 }) + k.shape(k.rect(40, 74, 110, 14), 'black', { w: 0, op: .5 });
    // the twin crescent buildings and the Duke between them, arm outstretched
    const crescent = (x0, x1, dir) => {
      let s = k.shape(k.rect(x0, 66, x1 - x0, cliff - 66), 'light', { w: 1 });
      s += k.shape(k.rect(dir > 0 ? x0 : x1 - 16, 66, 16, cliff - 66), 'mid', { w: 0 });
      s += k.windows(x0 + 4, 72, x1 - x0 - 8, 22, Math.round((x1 - x0) / 10), 2, { lit: .5, ww: .4 });
      const pc = (x0 + x1) / 2;
      s += k.shape(k.rect(pc - 16, 70, 32, cliff - 70), 'black', { w: 0 });
      for (let i = 0; i < 4; i++) s += k.shape(k.rect(pc - 14 + i * 9, 70, 4, cliff - 70), 'paper', { w: .5 });
      s += k.shape(k.gable(pc - 18, 70, 36, 8), 'light', { w: .7 }) + k.line(`M${x0 - 1} 66H${x1 + 1}`, 1.2);
      return s;
    };
    let top = crescent(196, 300, 1) + crescent(340, 444, -1);
    top += k.shape(k.rect(312, 78, 16, 20), 'light', { w: .9 }) + k.shape(k.rect(310, 76, 20, 3), 'light', { w: .6 });
    top += k.figure(320, 76, 1.05, 'priest') + k.line('M322 62l7 -4', 1.2);

    // ---------- the escarpment and its trees ----------
    let slope = k.shape(`M-5 ${cliff}H645V${quayY}H-5Z`, 'stipple', { w: 0 }) + k.line(`M-5 ${cliff}H645`, 1.2);
    slope += k.shape(`M404 ${quayY}L344 ${cliff}H645V${quayY}Z`, 'dark', { w: 0, op: .55 });
    // the wooded slopes: clumps of acacia and plane, lit along their tops, darker on the shaded side
    const clump = (x, y, w, shade) => k.shape(`M${f(x - w)} ${f(y)}q${f(w * .1)} ${f(-w * .9)} ${f(w * .7)} ${f(-w * .8)}q${f(w * .5)} ${f(-w * .5)} ${f(w * .9)} ${f(w * .1)}q${f(w * .5)} ${f(w * .1)} ${f(w * .4)} ${f(w * .7)}Z`, shade ? 'dark' : 'mid', { w: .5 })
      + k.shape(`M${f(x - w * .9)} ${f(y - w * .2)}q${f(w * .1)} ${f(-w * .6)} ${f(w * .6)} ${f(-w * .6)}q${f(w * .3)} ${f(-w * .3)} ${f(w * .7)} 0q${f(-w * .6)} ${f(w * .1)} ${f(-w * 1.3)} ${f(w * .6)}Z`, 'stipple', { w: 0 });
    for (let row = 0; row < 6; row++) for (let i = 0; i < 16; i++) {
      const x = -6 + i * 42 + (row % 2) * 21 + r() * 10, y = cliff + 16 + row * 17 + r() * 4, t = (y - cliff) / (quayY - cliff);
      const sl = tL - 10 + (bL - 40 - tL) * t, sr = tR + 6 + (bR + 16 - tR) * t;
      if (x > sl - 12 && x < sr + 12) continue;
      slope += clump(x, y, 12 + r() * 5, x > 320);
    }
    // ---------- the stairs ----------
    const edge = (t, side) => side < 0 ? tL + (bL - tL) * t : tR + (bR - tR) * t;
    const yAt = (t) => cliff + 2 + (quayY - cliff - 2) * t;
    let stairs = k.shape(k.poly([[tL, cliff + 2], [tR, cliff + 2], [bR, quayY], [bL, quayY]]), 'paper', { w: 1.2 });
    // the risers, crowding together as they climb away
    let risers = '';
    const n = 60;
    for (let i = 1; i < n; i++) { const t = Math.pow(i / n, 1.35), y = yAt(t); risers += `M${f(edge(t, -1))} ${f(y)}H${f(edge(t, 1))}`; }
    stairs += `<path d="${risers}" stroke="${k.ink}" stroke-width=".55" fill="none"/>`;
    // the right half of each step a little shaded, the light being from the left
    stairs += k.shape(k.poly([[320, cliff + 2], [tR, cliff + 2], [bR, quayY], [320 + (bR - bL) * .18, quayY]]), 'light', { w: 0, op: .6 });
    // the parapets, with lamps along them
    for (const side of [-1, 1]) {
      const o = side < 0 ? [[tL - 4, cliff], [tL, cliff], [bL, quayY], [bL - 14, quayY]] : [[tR, cliff], [tR + 4, cliff], [bR + 14, quayY], [bR, quayY]];
      stairs += k.shape(k.poly(o), side < 0 ? 'vert' : 'dark', { w: .9 });
      for (const t of [.12, .3, .52, .78]) { const x = edge(t, side) + side * (2 + 6 * t), y = yAt(t); stairs += k.lamp(x, y, .35 + t * .5); k.lights.push([f(x - 1.6 * (.35 + t * .5)), f(y - 29 * (.35 + t * .5)), f(3.2 * (.35 + t * .5)), f(4 * (.35 + t * .5))]); }
    }
    // the funicular beside the stairs, its car halfway up
    stairs += k.line(`M${tL - 12} ${cliff}L${bL - 40} ${quayY}`, 1.2) + k.line(`M${tL - 8} ${cliff}L${bL - 28} ${quayY}`, .8);
    stairs += k.shape(k.poly([[262, 146], [276, 146], [272, 160], [256, 160]]), 'dark', { w: .7 }) + k.windows(259, 148, 14, 5, 3, 1, { lit: .8 });
    stairs += k.figure(300, 150, .6, 'woman') + k.figure(338, 170, .75, 'man') + k.figure(276, 190, .9, 'porter');

    // ---------- the quay: sacks, porters, a crane ----------
    let quay = k.shape(k.rect(-5, quayY, 650, sea - quayY), 'vert', { w: 1 }) + k.line(`M-5 ${quayY}H645`, 1.4) + k.line(`M-5 ${sea}H645`, 1.2);
    const sacks = (x, y, rows) => { let s = ''; for (let j = 0; j < rows; j++) for (let i = 0; i < rows - j; i++) s += k.shape(`M${f(x + i * 9 + j * 4.5)} ${f(y - j * 6)}q-1 -6 4.5 -6.4q5.5 .4 4.5 6.4Z`, j % 2 ? 'light' : 'paper', { w: .6 }); return s; };
    quay += sacks(176, quayY, 4) + sacks(420, quayY, 3) + sacks(456, quayY, 2);
    quay += k.figure(216, quayY, 1, 'porter') + k.figure(442, quayY + 1, 1, 'porter') + k.figure(226, quayY, .95, 'man') + k.figure(478, quayY, 1, 'soldier');
    quay += k.crane(460, quayY, 1.3, -1);
    quay += k.shape(`M180 ${quayY - 2}h26v-12h-26Z`, 'mid', { w: .7 }) + `<circle cx="186" cy="${quayY}" r="3" fill="${k.ink}"/><circle cx="200" cy="${quayY}" r="3" fill="${k.ink}"/>`;

    // ---------- the harbour water ----------
    let water = k.water(sea, 240, { seed: 7 });

    // ---------- the wings: a grain steamer's bow on the left, a barque on the right ----------
    const steamer = (() => {
      let s = k.shape(`M-6 ${sea - 34}L150 ${sea - 38}Q168 ${sea - 38} 176 ${sea - 30}L160 ${sea + 14}L-6 ${sea + 18}Z`, 'black', { w: 1 });
      s += k.line(`M-6 ${sea - 28}L158 ${sea - 32}`, 1, { color: k.paper }) + k.line(`M-6 ${sea + 4}L162 ${sea}`, .6, { color: k.paper });
      s += `<circle cx="150" cy="${sea - 22}" r="3" fill="none" stroke="${k.paper}" stroke-width="1"/>`; // the hawse pipe
      s += k.shape(k.rect(10, sea - 72, 60, 38), 'light', { w: .9 }) + k.windows(14, sea - 68, 50, 12, 6, 1, { lit: .6 }) + k.shape(k.rect(6, sea - 76, 68, 5), 'dark', { w: .6 });
      s += k.shape(k.rect(28, sea - 118, 16, 42), 'black', { w: .8 }) + k.shape(k.rect(28, sea - 108, 16, 5), 'paper', { w: .5 });
      s += k.smoke(36, sea - 120, 1.4, { seed: 11 });
      s += k.line(`M118 ${sea - 36}V12M108 30H128M118 40L160 ${sea - 34}M118 20L-6 ${sea - 70}M118 40L60 ${sea - 36}`, .9);
      s += k.line(`M118 ${sea - 60}L150 ${sea - 80}`, 1.4); // the derrick
      return s;
    })();
    const barque = (() => {
      let s = k.shape(`M470 ${sea - 18}Q480 ${sea - 32} 500 ${sea - 32}L646 ${sea - 34}V${sea + 16}L488 ${sea + 14}Z`, 'black', { w: 1 });
      s += k.shape(`M478 ${sea - 24}L646 ${sea - 26}V${sea - 20}L476 ${sea - 18}Z`, 'paper', { w: .5 });
      for (let x = 490; x < 646; x += 12) s += k.shape(k.rect(x, sea - 24, 5, 4), 'black', { w: 0 }); // painted ports
      s += k.line(`M478 ${sea - 26}L424 ${sea - 50}`, 1.6); // the bowsprit
      for (const [mx, mt] of [[534, 8], [600, 14]]) {
        s += k.line(`M${mx} ${sea - 32}V${mt}`, 1.6);
        for (const [y, w] of [[mt + 14, 34], [mt + 34, 44], [mt + 56, 52], [mt + 80, 58]]) s += k.line(`M${mx - w / 2} ${y}H${mx + w / 2}`, 1.2) + k.shape(k.rect(mx - w / 2 + 2, y, w - 4, 3), 'light', { w: .4 });
        s += k.line(`M${mx} ${mt}L${mx - 40} ${sea - 32}M${mx} ${mt}L${mx + 44} ${sea - 32}`, .5);
      }
      s += k.line(`M534 8L424 ${sea - 50}`, .5) + k.flag(600, 14, .9);
      return s;
    })();
    water += k.reflect(`<g>${steamer}${barque}</g>`, sea, .2);

    return far + colon + top + slope + stairs + quay + water + steamer + barque;
  },
};
