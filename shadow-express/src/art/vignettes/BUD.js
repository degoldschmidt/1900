// Budapest: from the Buda embankment beside the Chain Bridge. Its near pylon, a triumphal arch, towers at the right;
// the chains sweep away across the Danube to the far pylon, and on the Pest bank the Parliament spreads out
// with its ribbed dome and spire.

export default {
  id: 'BUD',
  draw(k) {
    const f = k.f, r = k.rng(52);
    const bank = 176;

    // the bridge in perspective: t runs from the near pylon (0) to the far one (1)
    const Z = 3, xN = 474, xF = 262, cy = 168;
    const vx = (Z * xF - xN) / (Z - 1);
    const z = (t) => 1 + t * (Z - 1);
    const P = (t, Y, dx = 0) => [vx + (xN + dx - vx) / z(t), cy - Y / z(t)];

    // ---------- far: Pest behind the Parliament ----------
    let far = k.skyline(-5, 300, bank - 2, { seed: 13, style: 'east', hMin: 10, hMax: 26 }) + k.haze(bank - 30, 30, .35);

    // ---------- the Parliament ----------
    const parl = (() => {
      const by = bank, top = 130;
      let s = k.shape(k.rect(-6, top, 250, by - top), 'light');
      s += k.shape(k.rect(-6, by - 12, 250, 12), 'mid', { w: .7 });
      // the river front: tall pointed windows in pairs, buttresses with pinnacles
      for (let x = -2; x < 240; x += 10) s += k.shape(k.gothic(x + 2, top + 8, 5, 20), 'glass', { w: .45 }) + k.shape(k.gothic(x + 2, top + 32, 5, 10), 'glass', { w: .45 });
      for (let x = -6; x <= 244; x += 20) s += k.shape(k.rect(x - 1.5, top - 6, 3, 7), 'mid', { w: .5 }) + k.shape(k.spire(x, top - 6, 4, 9), 'dark', { w: .5 });
      // steep roofs behind the parapet
      s += k.shape(k.poly([[-6, top], [4, top - 12], [80, top - 12], [90, top]]), 'dark', { w: .8 }) + k.shape(k.poly([[150, top], [160, top - 12], [236, top - 12], [246, top]]), 'dark', { w: .8 });
      // pavilions with their pointed roofs and turrets
      for (const [x, w] of [[14, 24], [182, 24], [-6, 14], [230, 16]]) {
        s += k.shape(k.rect(x, top - 16, w, by - top + 16), 'light', { w: .9 }) + k.shape(k.rect(x + w - 6, top - 16, 6, by - top + 16), 'dark', { w: 0 });
        s += k.windows(x + 2, top - 12, w - 9, 40, 2, 3, { arched: true, ww: .5, wh: .7 });
        s += k.shape(k.poly([[x - 2, top - 16], [x + w / 2, top - 38], [x + w + 2, top - 16]]), 'dark', { w: .8 });
        s += k.shape(k.spire(x + 1, top - 16, 4, 14), 'dark', { w: .5 }) + k.shape(k.spire(x + w - 1, top - 16, 4, 14), 'dark', { w: .5 });
      }
      // the central block, its two slender spires, the drum and the great ribbed dome
      const cx = 120;
      s += k.shape(k.rect(cx - 38, top - 22, 76, by - top + 22), 'light', { w: 1 }) + k.shape(k.rect(cx + 24, top - 22, 14, by - top + 22), 'dark', { w: .5 });
      s += k.windows(cx - 34, top - 18, 56, 46, 5, 2, { arched: true, ww: .45, wh: .7 });
      s += k.shape(k.gable(cx - 18, top - 22, 36, 14), 'mid', { w: .8 });
      for (const sx of [cx - 46, cx + 46]) s += k.shape(k.rect(sx - 3.5, top - 52, 7, 52), 'vert', { w: .7 }) + k.shape(k.spire(sx, top - 52, 8, 30), 'dark', { w: .7 });
      s += k.shape(k.rect(cx - 30, 92, 60, 18), 'light', { w: 1 }) + k.shape(k.rect(cx + 14, 92, 16, 18), 'dark', { w: 0 });
      for (let x = cx - 28; x < cx + 26; x += 7) s += k.shape(k.gothic(x, 94, 4, 14), 'glass', { w: .4 });
      for (let x = cx - 30; x <= cx + 30; x += 10) s += k.shape(k.spire(x, 92, 3.5, 10), 'dark', { w: .5 });
      s += k.shape(`M${cx - 28} 92C${cx - 30} 64 ${cx - 14} 48 ${cx} 44C${cx + 14} 48 ${cx + 30} 64 ${cx + 28} 92Z`, 'light', { w: 1.3 });
      s += k.shape(`M${cx + 4} 45C${cx + 18} 52 ${cx + 30} 66 ${cx + 28} 92H${cx + 10}C${cx + 12} 72 ${cx + 10} 56 ${cx + 4} 45Z`, 'dark', { w: 0 });
      for (const t of [-.66, -.33, 0, .33, .66]) s += k.line(`M${f(cx + t * 28)} 92Q${f(cx + t * 24)} 58 ${cx} 44`, .6);
      s += k.shape(k.rect(cx - 5, 32, 10, 13), 'light', { w: .8 }) + k.shape(k.spire(cx, 32, 9, 26), 'dark', { w: .8 }) + k.line(`M${cx} 6v-4`, .7);
      return s;
    })();

    // ---------- the Danube ----------
    let water = k.water(bank, 240, { seed: 33 });
    water += k.reflect(`<g>${parl}</g>`, bank, .22) + k.shape(k.rect(-5, bank, 650, 4), 'horiz', { w: 0 });
    const paddle = (x, y, s, dir = 1) => { // a Danube paddle steamer
      const S = (n) => f(n * s), D = (n) => f(n * s * dir);
      let o = k.shape(`M${f(x - 34 * s * dir)} ${f(y - 6 * s)}h${D(70)}l${D(-6)} ${S(6)}h${D(-60)}Z`, 'black', { w: .7 });
      o += k.shape(k.rect(x - 26 * s, y - 13 * s, 50 * s, 7 * s), 'light', { w: .6 }) + k.windows(x - 25 * s, y - 12 * s, 48 * s, 5 * s, 9, 1, { lit: .6 });
      o += k.shape(k.rect(x - 28 * s, y - 15 * s, 56 * s, 2.4 * s), 'dark', { w: .5 });
      o += k.shape(`M${f(x - 8 * s)} ${f(y - 6 * s)}a${S(8)} ${S(8)} 0 0 1 ${S(16)} 0Z`, 'dark', { w: .6 });
      o += k.shape(k.rect(x - 2 * s, y - 32 * s, 4.4 * s, 17 * s), 'black', { w: .5 }) + k.smoke(x, y - 33 * s, .9 * s, { seed: 6 });
      return o + k.flag(x + 30 * s * dir, y - 15 * s, .5 * s);
    };
    const traffic = paddle(328, 204, 1, -1) + k.boat(150, 190, .8, 'barge', 1) + k.boat(560, 226, 1.1, 'barge', -1);

    // ---------- the Chain Bridge ----------
    const bridge = (() => {
      let s = '';
      // a pylon, a triumphal arch in dressed stone, drawn at depth t (0 near, 1 far)
      const pylon = (t) => {
        const q = (dx, Y) => P(t, Y, dx), box = (dx0, Y0, dx1, Y1) => { const [ax, ay] = q(dx0, Y0), [bx, by] = q(dx1, Y1); return k.rect(ax, ay, bx - ax, by - ay); };
        const sc = 1 / z(t), w = t ? .8 : 1.3;
        let o = k.shape(box(-4, 134, 122, -46), 'light', { w });
        o += k.shape(box(-4, 134, 8, -46), 'vert', { w: w * .6 });
        if (!t) {
          let joints = '';
          for (let Y = 120, row = 0; Y > -46; Y -= 9, row++) {
            const [ax, ay] = q(8, Y), [bx] = q(104, Y); joints += `M${f(ax)} ${f(ay)}H${f(bx)}`;
            for (let dx = 16 + (row % 2) * 9; dx < 104; dx += 18) { if (Y < 94 && Y > 10 && dx > 26 && dx < 90) continue; const [jx, jy] = q(dx, Y); joints += `M${f(jx)} ${f(jy)}v9`; }
          }
          o += k.line(joints, .4);
        }
        o += k.shape(box(104, 134, 122, -46), 'dark', { w: w * .5 });
        const [ax, ay] = q(30, 94), [bx, by] = q(86, 18), [cx2, cy2] = q(38, 78), [dx2, dy2] = q(78, 18);
        o += k.shape(k.arch(ax, ay, bx - ax, by - ay), 'black', { w: w * .85 }) + k.shape(k.arch(cx2, cy2, dx2 - cx2, dy2 - cy2), 'paper', { w: w * .5 });
        if (!t) { // the voussoirs and the keystone; soot darkening the foot
          const cxA = (ax + bx) / 2, rA = (bx - ax) / 2, cyA = ay + rA; let vs = '';
          for (let i = 1; i < 12; i++) { const qa = Math.PI + i * Math.PI / 12; vs += `M${f(cxA + Math.cos(qa) * rA)} ${f(cyA + Math.sin(qa) * rA)}L${f(cxA + Math.cos(qa) * (rA + 9))} ${f(cyA + Math.sin(qa) * (rA + 9))}`; }
          o += k.line(vs, .6) + k.shape(k.rect(cxA - 5, ay - 10, 10, 11), 'light', { w: .9 });
          o += k.shape(box(-4, -20, 122, -46), 'mid', { w: 0, op: .55 });
        }
        o += k.shape(box(-8, 140, 126, 132), 'light', { w: w * .8 }) + k.shape(box(-6, 152, 124, 140), 'light', { w: w * .7 }) + k.shape(box(104, 152, 126, 132), 'dark', { w: 0 });
        o += k.line((() => { const [l, y] = q(-8, 132), [rr] = q(126, 132); return `M${f(l)} ${f(y)}H${f(rr)}`; })(), w);
        for (const dx of [14, 96]) o += k.shape(box(dx, 108, dx + 6, -12), 'vert', { w: w * .45 });
        return o + (sc < 1 ? '' : '');
      };
      s += pylon(1);
      // the deck receding, its girder and railing
      const d0 = P(0, 18), d1 = P(1, 18), b0 = P(0, 6), b1 = P(1, 6);
      s += k.shape(k.poly([d0, d1, b1, b0]), 'mid', { w: .9 });
      s += k.line(`M${f(d0[0])} ${f(d0[1] - 5)}L${f(d1[0])} ${f(d1[1] - 2)}`, .8);
      for (let t = 0; t <= 1; t += .04) { const [x, y] = P(t, 18); s += k.line(`M${f(x)} ${f(y)}v${f(-5 / z(t))}`, .4); }
      // the chains: two strands on each side, the far side's thinner, hung with rods to the deck
      const chain = (dx, lift, w) => {
        let d = '', rods = '';
        for (let i = 0; i <= 30; i++) {
          const t = i / 30, Y = 124 - lift - 104 * 4 * t * (1 - t);
          const [x, y] = P(t, Y, dx);
          d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
          if (lift === 0 && i % 2 === 1 && i < 29) { const [, yd] = P(t, 18, dx); rods += `M${f(x)} ${f(y)}V${f(yd)}`; }
        }
        return k.line(d, w) + (rods ? k.line(rods, .45) : '');
      };
      s += chain(-14, 0, 1) + chain(-14, 8, .8) + chain(0, 0, 2.2) + chain(0, 8, 1.6);
      s += pylon(0);
      const x1 = 596, x0 = xN - 4, base = 214;
      // the deck through the arch, and on toward Buda; the chains running down to their anchorage
      s += k.shape(k.rect(x1, 148, 50, 10), 'mid', { w: .8 }) + k.line(`M${x1} 143H646`, .8);
      s += k.line(`M${x1} 44Q620 80 646 108`, 2.2) + k.line(`M${x1} 52Q620 86 646 114`, 1.6);
      s += k.shape(k.rect(x0 - 10, base - 6, x1 - x0 + 26, 32), 'vert', { w: 1 }) + k.shape(k.rect(x1 - 4, base - 6, 20, 32), 'dark', { w: 0 });
      return s;
    })();

    // ---------- the Buda embankment, a lion on its plinth ----------
    let quay = k.shape('M-5 226H460V245H-5Z', 'vert', { w: 1 }) + k.line('M-5 226H460', 1.4) + k.shape(k.rect(-5, 226, 465, 4), 'light', { w: 0 });
    for (const x of [60, 180, 300, 420]) quay += k.shape(`M${x} 226v-5q0 -3 3 -3t3 3v5Z`, 'black', { w: .6 });
    quay += k.lamp(240, 226, 1) + k.figure(118, 226, 1, 'man') + k.figure(132, 226, .95, 'woman') + k.figure(360, 226, 1, 'porter');
    k.lights.push([237.5, 197, 5, 4]);
    const lion = (() => { // one of the bridge's stone lions, couchant on its plinth, facing the river
      let s = k.shape(k.rect(394, 196, 58, 30), 'light', { w: 1 }) + k.shape(k.rect(438, 196, 14, 30), 'dark', { w: 0 }) + k.shape(k.rect(390, 191, 66, 6), 'light', { w: .9 });
      for (let y = 203; y < 226; y += 7) s += k.line(`M394 ${y}H438`, .4);
      // haunch, back and chest, then the forepaws stretched out in front
      s += k.shape('M446 191C448 182 444 176 434 176C426 176 420 174 414 172L404 186L398 186C394 186 392 189 394 191Z', 'light', { w: 1 });
      s += k.shape('M446 191C448 184 446 180 440 179C442 184 442 188 438 191Z', 'mid', { w: 0 }) + k.shape('M404 191H428C426 188 422 186 416 186H404Z', 'mid', { w: 0 });
      s += k.line('M394 189.4H404M396 191V188', .6);
      // the head with its heavy mane, the muzzle forward
      s += k.shape('M402 186C398 184 397 178 400 172C402 166 408 163 414 164C421 165 424 171 422 178C420 184 414 188 406 188Z', 'mid', { w: 1 });
      s += k.shape('M400 172C398 172 395 174 395 177C395 180 397 181 400 181L404 180C405 176 404 173 400 172Z', 'light', { w: .8 });
      s += k.line('M398 175h1.6M396 179.6q2 1 4 0M408 168q4 4 3 12M413 167q3 5 2 13', .6);
      s += k.line('M446 189q8 -2 6 -9q-1 -4 3 -5', 1.2); // the tail
      return s;
    })();
    return far + parl + water + traffic + bridge + quay + lion;
  },
};
