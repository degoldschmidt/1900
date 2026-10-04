// Bucharest: up the boulevard in one-point perspective. Tall Parisian fronts recede in shadow on the left;
// on the right, behind its garden railing, the Athenaeum lifts its ribbed dome over an Ionic portico.
// A birja cab trots past; chestnut leaves hang over the corner.

export default {
  id: 'BUC',
  draw(k) {
    const f = k.f, r = k.rng(36);
    const VX = 300, VY = 160;
    const P = (X, Y, z) => [VX + X / z, VY + Y / z];
    const quad = (X, Ya, Yb, za, zb) => k.poly([P(X, Ya, za), P(X, Ya, zb), P(X, Yb, zb), P(X, Yb, za)]);

    // ---------- the far end of the boulevard ----------
    let far = k.skyline(200, 400, VY + 4, { seed: 9, style: 'paris', far: true, hMin: 8, hMax: 18, wMin: 8, wMax: 14 });
    far += k.shape(k.rect(292, VY - 30, 12, 32), 'light', { far: true, w: .5 }) + k.shape(k.dome(298, VY - 30, 8, 8), 'mid', { far: true, w: .5 }); // a church at the far end
    far += k.haze(VY - 24, 26, .4);

    // ---------- the road ----------
    let road = k.shape(k.poly([[-5, 245], [VX - 6, VY], [VX + 6, VY], [645, 245]]), 'paper', { w: 0 });
    for (let i = 1; i < 14; i++) { const z = 1 + i * i * .06, [, y] = P(0, 80, z); road += k.line(`M${f(VX - 300 / z)} ${f(y)}H${f(VX + 300 / z)}`, .35 + .3 / z); }
    for (const X of [-40, -28, 34, 46]) road += k.line(`M${f(VX + X)} 240L${VX + X / 30} ${VY + 2.6}`, .7); // tram rails
    road += k.shape(k.poly([[-5, 240], [VX - 2, VY + 1], [VX - 1, VY + 2], [-5, 245]]), 'black', { w: 0 }); // the left kerb's shadow

    // ---------- the left fronts, receding in shade ----------
    const X = -320, Yb = 80;
    let left = '';
    const segs = [[1, 2.1, -170, 'mansard'], [2.1, 3.3, -132, 'mansard'], [3.3, 4.6, -150, 'mansard'], [4.6, 7, -116, 'mansard']];
    for (const [za, zb, Yt, roof] of segs) {
      left += k.shape(quad(X, Yt, Yb, za, zb), 'mid', { w: 1 });
      left += k.shape(quad(X, Yt - 24, Yt, za, zb), 'dark', { w: .9 }); // the mansard
      left += k.shape(quad(X, Yt - 2, Yt + 6, za, zb), 'light', { w: .7 }); // the cornice
      left += k.shape(quad(X, 34, Yb, za, zb), 'dark', { w: .8 }); // the ground floor, sooty
      for (let z = za + .08; z < zb - .1; z += .25) left += k.shape(quad(X, 40, Yb, z, z + .12), 'black', { w: .4 }); // shop windows
      for (let Y = Yt + 14; Y < 20; Y += 34) {
        left += k.line((() => { const [a1, b1] = P(X, Y + 26, za), [a2, b2] = P(X, Y + 26, zb); return `M${f(a1)} ${f(b1)}L${f(a2)} ${f(b2)}`; })(), .7);
        for (let z = za + .1; z < zb - .14; z += .25) {
        left += k.shape(quad(X, Y, Y + 20, z, z + .1), 'black', { w: .5 }) + k.shape(quad(X, Y + 20, Y + 23, z - .01, z + .11), 'light', { w: .4 });
        if (Y === Yt + 48 && za < 2) left += k.shape(k.poly([P(X, Y + 20, z - .02), P(X, Y + 20, z + .12), P(X + 14, Y + 20, z + .12), P(X + 14, Y + 20, z - .02)]), 'dark', { w: .5 }) + k.shape(quad(X + 14, Y + 12, Y + 20, z - .02, z + .12), 'none', { w: .5 });
        if (k.rand() < (za < 2 ? 0 : za < 3 ? .2 : .3)) { const [x0, y0] = P(X, Y, z), [x1, y1] = P(X, Y + 20, z + .1); k.lights.push([f(Math.min(x0, x1)), f(y0), f(Math.abs(x1 - x0) || 1), f(y1 - y0)]); }
        }
      }
      const [px, py] = P(X, Yt - 24, za), [qx, qy] = P(X, Yb, za);
      left += k.line(`M${f(px)} ${f(py)}L${f(qx)} ${f(qy)}`, 1.1);
    }
    // awnings over the shops, gas lamps marching up the kerb
    for (let z = 1.05; z < 3; z += .5) left += k.shape(k.poly([P(X, 30, z), P(X, 30, z + .32), P(X + 40, 44, z + .32), P(X + 40, 44, z)]), 'vert', { w: .6 });
    for (const z of [1.2, 1.9, 2.8, 4.2]) { const [x, y] = P(-250, Yb, z); left += k.lamp(x, y, 1.5 / z); k.lights.push([f(x - 2.4 / z), f(y - 43 / z), f(4.8 / z), f(5 / z)]); }

    // ---------- the Athenaeum ----------
    const ath = (() => {
      const cx = 468, base = 170;
      let s = '';
      // the round body behind, and the low curved wings
      s += k.shape(k.rect(cx - 74, 116, 148, base - 116), 'light', { w: 1 }) + k.shape(k.rect(cx + 44, 116, 30, base - 116), 'dark', { w: 0 });
      s += k.windows(cx - 70, 124, 30, 30, 2, 2, { arched: true, ww: .5, lit: .4 }) + k.windows(cx + 44, 124, 26, 30, 2, 2, { arched: true, ww: .5, lit: .4 });
      s += k.shape(k.rect(cx - 56, 88, 112, 28), 'light', { w: 1.1 }) + k.shape(k.rect(cx + 26, 88, 30, 28), 'dark', { w: 0 });
      for (let x = cx - 52; x < cx + 52; x += 8) s += k.shape(k.rect(x, 96, 4, 12), 'glass', { w: .4 }); // the attic's ring of little windows
      s += k.line(`M${cx - 58} 88H${cx + 58}`, 1.4);
      // the dome: tall, ribbed like a helmet, lit from the left
      s += k.shape(`M${cx - 52} 88C${cx - 54} 54 ${cx - 28} 34 ${cx} 32C${cx + 28} 34 ${cx + 54} 54 ${cx + 52} 88Z`, 'light', { w: 1.4 });
      s += k.shape(`M${cx + 8} 33C${cx + 34} 38 ${cx + 54} 56 ${cx + 52} 88H${cx + 20}C${cx + 24} 64 ${cx + 18} 44 ${cx + 8} 33Z`, 'dark', { w: 0 });
      for (const t of [-.75, -.5, -.25, 0, .25, .5, .75]) s += k.line(`M${f(cx + t * 52)} 88Q${f(cx + t * 46)} 46 ${cx} 32`, .8);
      for (const y of [74, 60]) s += k.line(`M${f(cx - 50 + (88 - y) * .3)} ${y}Q${cx} ${y - 6} ${f(cx + 50 - (88 - y) * .3)} ${y}`, .4);
      s += k.shape(k.rect(cx - 5, 22, 10, 11), 'light', { w: .8 }) + k.shape(k.dome(cx, 22, 7, 6), 'dark', { w: .7 }) + k.line(`M${cx} 16v-8`, .9);
      // the steps and the portico: six Ionic columns under a pediment
      s += k.shape(k.rect(cx - 62, base - 8, 124, 8), 'light', { w: .9 }) + k.line(`M${cx - 62} ${base - 5}h124M${cx - 62} ${base - 2.5}h124`, .5);
      s += k.shape(k.rect(cx - 50, 126, 100, base - 8 - 126), 'black', { w: 0 });
      for (let i = 0; i < 6; i++) {
        const x = cx - 46 + i * 18;
        s += k.shape(k.rect(x, 126, 7, base - 8 - 126), 'paper', { w: .8 }) + k.shape(k.rect(x + 4, 126, 3, base - 8 - 126), 'mid', { w: 0 });
        s += k.line(`M${x - 2} 126q2 -3 4 0M${x + 5} 126q2 -3 4 0`, .7); // the volutes
      }
      s += k.shape(k.rect(cx - 54, 118, 108, 8), 'light', { w: 1 }) + k.shape(k.poly([[cx - 56, 118], [cx, 98], [cx + 56, 118]]), 'light', { w: 1.1 });
      s += k.shape(k.poly([[cx - 46, 116], [cx, 101], [cx + 46, 116]]), 'mid', { w: .5 });
      return s;
    })();
    // the garden: trees behind and beside, its railing along the pavement
    let garden = '';
    for (const [x, y, s] of [[372, 176, 1.6], [400, 172, 1.2], [560, 176, 1.7], [600, 182, 2]]) garden += k.tree(x, y, s, 'round');
    garden += k.shape(k.poly([[352, 182], [645, 196], [645, 200], [352, 185]]), 'light', { w: .7 });
    let rail = '';
    for (let x = 356; x < 645; x += 5) rail += `M${x} ${f(182 + (x - 352) * .048)}v-9`;
    garden += k.line(rail, .6) + k.line(`M352 173L645 187`, .9);
    // the near chestnut at the corner, overhanging the top right
    const chestnut = k.shape('M612 246Q604 190 616 150Q624 120 640 100L646 104V246Z', 'black', { w: .8 })
      + k.shape('M520 40Q540 4 600 2Q646 0 650 10V120Q630 134 600 120Q560 128 548 104Q510 96 520 70Q500 56 520 40Z', 'dark', { w: .9 })
      + k.shape('M520 40Q540 4 600 2Q630 0 640 8Q600 10 580 30Q556 52 530 58Q514 50 520 40Z', 'stipple', { w: 0 }) + k.shape('M548 104Q540 84 560 70Q580 60 596 76Q570 76 562 96Z', 'stipple', { w: 0 })
      + k.shape('M548 104Q580 112 600 108Q624 118 650 104V120Q630 134 600 120Q560 128 548 104Z', 'dark', { w: 0 });

    // ---------- traffic: a birja cab, a far tram, strollers ----------
    const birja = (x, y, s) => { // a light Bucharest cab: folded hood, high box, one horse trotting to the right
      const T = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, a, b) => `${f(x + a * s)} ${f(y + b * s)}`);
      let o = k.shape(T('M-50 -24 C-52 -36 -44 -42 -36 -42 L-34 -24 Z'), 'black', { w: .6 }); // the hood
      o += k.shape(T('M-52 -24 L-14 -24 C-12 -16 -18 -13 -26 -13 L-44 -13 C-50 -14 -52 -18 -52 -24 Z'), 'dark', { w: .7 });
      o += k.shape(T('M-18 -24 L-16 -32 L-8 -32 L-10 -24 Z'), 'mid', { w: .6 }); // the box
      o += k.figure(x - 12 * s, y - 31 * s, .75 * s, 'man') + k.line(T('M-9 -40 C0 -52 14 -54 24 -48'), .6);
      o += k.line(T('M-12 -20 L10 -24'), 1.2); // the shafts
      for (const [wx, wr] of [[-40, 10], [-14, 7]]) o += `<circle cx="${f(x + wx * s)}" cy="${f(y - wr * s)}" r="${f(wr * s)}" fill="none" stroke="${k.ink}" stroke-width="${f(1.3 * s)}"/>` + k.line(T(`M${wx - wr} ${-wr} L${wx + wr} ${-wr} M${wx} ${-2 * wr} L${wx} 0`), .5);
      // the horse
      o += k.shape(T('M0 -24 C0 -30 6 -32 14 -31 L24 -31 C29 -31 31 -28 31 -24 C31 -20 28 -18 24 -18 L6 -18 C2 -18 0 -20 0 -24 Z'), 'black', { w: .5 });
      o += k.shape(T('M23 -30 C26 -36 29 -42 33 -44 L36 -45 C38 -44 40 -40 42 -36 L43 -34 C42 -32 40 -32 39 -34 L35 -39 C33 -35 31 -30 30 -24 Z'), 'black', { w: .5 });
      o += k.shape(T('M33 -44 L34 -48 L36 -44 Z'), 'black', { w: .4 }) + k.line(T('M24 -30 C28 -38 31 -42 34 -44'), .5, { color: k.paper });
      o += k.line(T('M27 -19 L28 -6 L27 0 M24 -19 L29 -10 L26 -6 M5 -19 L3 -8 L5 0 M8 -19 L6 -10 L10 -7'), 1.7 * s);
      o += k.line(T('M0 -26 C-5 -24 -6 -18 -4 -12'), 1.2 * s);
      return o;
    };
    const tram = (() => { const [x, y] = P(30, 80, 4.2); return k.shape(k.rect(x - 9, y - 14, 18, 12), 'mid', { w: .6 }) + k.windows(x - 8, y - 12, 16, 5, 4, 1, { lit: .7 }) + k.line(`M${f(x)} ${f(y - 14)}l4 -8`, .5) + k.shape(k.rect(x - 10, y - 16, 20, 2.4), 'dark', { w: .4 }); })();
    let life = tram + birja(214, 232, 1.15) + k.figure(80, 238, 1.5, 'man') + k.figure(98, 238, 1.45, 'woman') + k.figure(150, 214, 1.05, 'soldier') + k.figure(412, 206, 1, 'woman') + k.figure(428, 206, 1.05, 'man');
    life += k.lamp(380, 206, 1.3) + k.lamp(520, 214, 1.6);
    k.lights.push([376.8, 165.3, 6.4, 6], [516, 165.6, 8, 8]);

    // soot: chimney stacks on the mansards, their smoke drifting over the boulevard
    let soot = '';
    for (const [z, Yt] of [[2.5, -156], [3.9, -174], [5.4, -140]]) {
      const [x, y] = P(X, Yt, z), h = 14 / z * 2;
      soot += k.shape(k.rect(x - 3 / z * 2, y - h, 6 / z * 2, h), 'black', { w: .5 }) + k.smoke(x, y - h, 1.6 / z * 2, { seed: Math.round(z * 10) });
    }
    return far + road + left + soot + ath + garden + life + chestnut;
  },
};
