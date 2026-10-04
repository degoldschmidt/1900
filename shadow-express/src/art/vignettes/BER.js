// Berlin: across the Pariser Platz, square on to the Brandenburg Gate. Six Doric columns, deep passages with the
// Tiergarten showing green beyond, the Quadriga driving out over the attic; the glass dome of the Reichstag rises
// over the palaces to the right. A column of the Guard marches across the square behind a mounted officer.

export default {
  id: 'BER',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(14);
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const GB = 202, s = 4.95, CX = 320; // the gate's foot, px per metre, its axis
    const gy = (m) => GB - m * s, gx = (m) => CX + m * s;

    // ---------- far: the Tiergarten through the passages, the Reichstag over the roofs to the right, soot
    let far = k.shape(`M60 ${GB}Q100 150 160 156Q220 140 300 150Q380 138 460 152Q520 142 590 158V${GB}Z`, 'stipple', { far: true, w: .5 });
    const RX = 566, rb = 150, rs = 1.4, ry = (m) => rb - m * rs;
    let rei = k.shape(k.rect(RX - 44, ry(26), 88, 26 * rs + 4), 'light', { far: true, w: .7 }) + k.windows(RX - 40, ry(24), 80, 20 * rs, 9, 2, { far: true, lit: .3 });
    for (const tx of [RX - 46, RX + 40]) rei += k.shape(k.rect(tx, ry(40), 8, 40 * rs), 'mid', { far: true, w: .7 }) + k.shape(k.dome(tx + 4, ry(40), 4.4, 5), 'dark', { far: true, w: .6 }) + k.line(`M${tx + 4} ${f(ry(40) - 6)}v-4`, .6, { far: true });
    rei += k.shape(k.rect(RX - 18, ry(38), 36, 12 * rs), 'mid', { far: true, w: .7 });
    rei += k.shape(`M${RX - 20} ${f(ry(38))}Q${RX - 20} ${f(ry(58))} ${RX} ${f(ry(60))}Q${RX + 20} ${f(ry(58))} ${RX + 20} ${f(ry(38))}Z`, 'glass', { far: true, w: .9 });
    rei += k.line(`M${RX - 10} ${f(ry(38))}Q${RX - 10} ${f(ry(55))} ${RX} ${f(ry(60))}M${RX + 10} ${f(ry(38))}Q${RX + 10} ${f(ry(55))} ${RX} ${f(ry(60))}M${RX} ${f(ry(38))}V${f(ry(60))}`, .7, { far: true });
    rei += k.shape(k.rect(RX - 3, ry(66), 6, 6 * rs), 'light', { far: true, w: .6 }) + k.shape(`M${RX - 4} ${f(ry(66))}l1 -4l3 2l3 -2l1 4Z`, 'dark', { far: true, w: .5 }) + k.line(`M${RX} ${f(ry(68.8))}v-4`, .7, { far: true });
    far += rei + k.haze(120, 40, .3);
    const nFar = k.lights.length;
    for (const [x, sc] of [[118, 1.1], [470, .9]]) far += k.shape(k.rect(x - 2, 112, 4, 18), 'dark', { far: true, w: .4 }) + k.smoke(x, 110, sc, { seed: x });

    // ---------- the palaces of the Pariser Platz, framing the square in perspective
    let sides = '';
    const facade = (xa, xb, ta, tb, ba, bb, flip) => { // a front receding in perspective: near edge a, far edge b
      let d = k.shape(k.poly([[xa, ba], [xa, ta], [xb, tb], [xb, bb]]), flip ? 'light' : 'dark', { w: 1.1 });
      d += k.shape(k.poly([[xa, ta], [xa, ta - 8], [xb, tb - 4], [xb, tb]]), 'dark', { w: .9 });
      let wn = '';
      const n = 7;
      for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) {
        const t0 = (i + .25) / n, t1 = (i + .75) / n, x0 = xa + (xb - xa) * t0, x1 = xa + (xb - xa) * t1;
        const top0 = ta + (tb - ta) * t0, bot0 = ba + (bb - ba) * t0, top1 = ta + (tb - ta) * t1, bot1 = ba + (bb - ba) * t1;
        const v0 = .14 + j * .27, v1 = v0 + .16;
        const q = [[x0, top0 + (bot0 - top0) * v0], [x1, top1 + (bot1 - top1) * v0], [x1, top1 + (bot1 - top1) * v1], [x0, top0 + (bot0 - top0) * v1]];
        wn += k.poly(q);
        if (k.rand() < .35) { const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]); k.lights.push([f(Math.min(...xs)), f(Math.min(...ys)), f(Math.max(...xs) - Math.min(...xs)), f(Math.max(...ys) - Math.min(...ys))]); }
      }
      return d + k.shape(wn, 'black', { w: .5 });
    };
    sides += facade(-5, 96, 40, 120, 236, GB + 2, false);
    sides += facade(645, 548, 46, 124, 236, GB + 2, true);
    sides += k.shape(k.rect(-5, 214, 70, 22), 'black', { w: .6 }) + k.shape(k.poly([[-5, 214], [66, 210], [74, 218], [-5, 224]]), 'light', { w: .7 }); // the hotel's awning
    for (let i = 0; i < 4; i++) k.lights.push([4 + i * 15, 222, 9, 10]);

    // ---------- the gate
    let gate = '';
    // the side wings, lower, with their porticos
    for (const sg of [-1, 1]) {
      const a = gx(sg * 31), b = gx(sg * 41.5), x0 = Math.min(a, b), w = Math.abs(b - a);
      gate += k.shape(k.rect(x0, gy(11), w, 11 * s), 'vert', { w: 1.1 }) + k.shape(k.rect(x0 - 2, gy(12.6), w + 4, 1.6 * s), 'light', { w: 1 });
      let cs = '';
      for (let i = 0; i < 4; i++) cs += k.rect(x0 + 3 + i * (w - 9) / 3, gy(10), 3.4, 10 * s);
      gate += k.shape(k.rect(x0 + 1, gy(10), w - 2, 10 * s), 'black', { w: 0 }) + k.shape(cs, 'vert', { w: .7 });
    }
    // the six columns and the five passages
    const cols = [-26.8, -16.2, -6.6, 6.6, 16.2, 26.8], CR = 1.6, CH = 15;
    for (let i = 0; i < 5; i++) {
      const a = gx(cols[i] + CR), b = gx(cols[i + 1] - CR);
      gate += k.shape(k.rect(a, gy(CH), b - a, CH * s), 'black', { w: .8 });
      gate += k.shape(k.rect(a + (b - a) * .18, gy(CH * .82), (b - a) * .64, CH * .82 * s), 'stipple', { w: .6, far: true }); // the far opening and the trees
      gate += k.shape(k.rect(a + (b - a) * .18, gy(CH * .82), (b - a) * .64, CH * .82 * s), 'dark', { w: 0, op: .35 });
    }
    // the deep cross walls behind the columns, a step and plinth
    gate += k.shape(k.rect(gx(-30.5), gy(.9), 61 * s, .9 * s), 'light', { w: 1 });
    for (const c of cols) {
      const x0 = gx(c - CR), w = 2 * CR * s;
      gate += k.shape(k.rect(x0, gy(CH), w, CH * s - .9 * s), 'vert', { w: 1.1 });
      gate += k.shape(k.rect(x0 + w * .6, gy(CH), w * .4, CH * s - .9 * s), 'dark', { w: 0 });
      let fl = '';
      for (let j = 1; j < 4; j++) fl += seg(x0 + w * j / 4.4, gy(CH - .2), x0 + w * j / 4.4, gy(1.1));
      gate += k.line(fl, .5) + k.shape(k.rect(x0 - 2, gy(CH + .8), w + 4, .8 * s), 'light', { w: .8 });
    }
    // the entablature: architrave, triglyph frieze, cornice
    gate += k.shape(k.rect(gx(-30), gy(CH + 2.4), 60 * s, 1.6 * s), 'light', { w: 1.1 });
    gate += k.shape(k.rect(gx(-30), gy(CH + 4.4), 60 * s, 2 * s), 'light', { w: 1.1 });
    let tri = '';
    for (let m = -29; m <= 29; m += 2.6) tri += k.rect(gx(m - .45), gy(CH + 4.2), .9 * s, 1.6 * s);
    gate += k.shape(tri, 'vert', { w: .5 });
    gate += k.shape(k.rect(gx(-31), gy(CH + 5.4), 62 * s, 1 * s), 'light', { w: 1.1 }) + k.line(seg(gx(-31), gy(CH + 4.4), gx(31), gy(CH + 4.4)), 1.6);
    gate += k.shape(k.rect(gx(-30), gy(CH + 4.4) + 1, 60 * s, 2.2), 'black', { w: 0 }); // the shadow under the cornice
    // the attic, stepped, with its relief, and the pedestal of the Quadriga
    gate += k.shape(k.rect(gx(-28), gy(CH + 9.6), 56 * s, 4.2 * s), 'vert', { w: 1.1 });
    gate += k.shape(k.rect(gx(-11), gy(CH + 9.2), 22 * s, 3.4 * s), 'light', { w: .9 });
    let relief = '';
    for (let i = 0; i < 9; i++) { const x = gx(-10 + i * 2.4); relief += `M${f(x)} ${f(gy(CH + 6.2))}q2 -6 5 -9`; }
    gate += k.line(relief, .7);
    gate += k.shape(k.rect(gx(-8), gy(CH + 12.4), 16 * s, 2.8 * s), 'light', { w: 1.1 }) + k.shape(k.rect(gx(-9), gy(CH + 9.6) - 3, 18 * s, 3), 'dark', { w: .8 });
    gate += k.shape(k.rect(gx(4), gy(CH + 12.4), 4 * s, 2.8 * s), 'dark', { w: 0 });
    // the Quadriga: four horses splayed to the front, the chariot, Victoria with her staff, wreath and eagle
    const qb = gy(CH + 12.4);
    const horse = (x, dir, h) => { // a rearing horse in profile, h px tall
      const X = (m) => f(x + m * h * dir), Y = (m) => f(qb - m * h);
      return k.shape(`M${X(-.45)} ${Y(.42)}C${X(-.3)} ${Y(.62)} ${X(.05)} ${Y(.62)} ${X(.2)} ${Y(.66)}L${X(.36)} ${Y(1)}L${X(.46)} ${Y(1.03)}L${X(.58)} ${Y(.86)}L${X(.53)} ${Y(.8)}L${X(.42)} ${Y(.86)}L${X(.36)} ${Y(.66)}L${X(.48)} ${Y(.5)}L${X(.62)} ${Y(.58)}L${X(.66)} ${Y(.52)}L${X(.44)} ${Y(.36)}L${X(.28)} ${Y(.38)}L${X(.1)} ${Y(.34)}L${X(-.12)} ${Y(.36)}L${X(-.24)} ${Y(0)}L${X(-.32)} ${Y(0)}L${X(-.3)} ${Y(.32)}L${X(-.42)} ${Y(.34)}L${X(-.4)} ${Y(0)}L${X(-.48)} ${Y(0)}L${X(-.5)} ${Y(.36)}Q${X(-.62)} ${Y(.3)} ${X(-.64)} ${Y(.12)}Q${X(-.56)} ${Y(.3)} ${X(-.45)} ${Y(.42)}Z`, 'black', { w: .7 });
    };
    gate += k.shape(`M${f(gx(-3))} ${f(qb)}q${f(-.4 * s)} ${f(-3 * s)} ${f(1.2 * s)} ${f(-3.2 * s)}h${f(3.6 * s)}q${f(1.6 * s)} ${f(.2 * s)} ${f(1.2 * s)} ${f(3.2 * s)}Z`, 'dark', { w: .8 }); // the chariot
    gate += horse(gx(-4.6), -1, 6.2 * s) + horse(gx(4.6), 1, 6.2 * s) + horse(gx(-1.6), -1, 5.8 * s) + horse(gx(1.6), 1, 5.8 * s);
    gate += k.shape(`M${f(gx(-.9))} ${f(gy(CH + 15.6))}q${f(.9 * s)} ${f(-1 * s)} ${f(1.8 * s)} 0l${f(.3 * s)} ${f(-3.2 * s)}q${f(-1.2 * s)} ${f(-1 * s)} ${f(-2.4 * s)} 0Z`, 'dark', { w: .7 }); // Victoria
    gate += `<circle cx="${f(gx(0))}" cy="${f(gy(CH + 19.6))}" r="${f(.55 * s)}" fill="${k.ink}"/>`;
    gate += k.shape(`M${f(gx(-.8))} ${f(gy(CH + 18.8))}q${f(-2.6 * s)} ${f(-1.2 * s)} ${f(-3.4 * s)} ${f(-3.8 * s)}q${f(1.8 * s)} ${f(1.2 * s)} ${f(3.4 * s)} ${f(2.6 * s)}ZM${f(gx(.8))} ${f(gy(CH + 18.8))}q${f(2.6 * s)} ${f(-1.2 * s)} ${f(3.4 * s)} ${f(-3.8 * s)}q${f(-1.8 * s)} ${f(1.2 * s)} ${f(-3.4 * s)} ${f(2.6 * s)}Z`, 'dark', { w: .5 }); // her wings
    const sx = gx(1.6), stTop = gy(CH + 24);
    gate += k.line(`M${f(sx)} ${f(gy(CH + 16))}V${f(stTop)}`, 1.3);
    gate += `<circle cx="${f(sx)}" cy="${f(stTop + 5.4)}" r="3.6" fill="none" stroke="${k.ink}" stroke-width="1.2"/>` + k.line(`M${f(sx - 2.4)} ${f(stTop + 5.4)}h4.8M${f(sx)} ${f(stTop + 3)}v4.8`, 1.2);
    gate += k.shape(`M${f(sx)} ${f(stTop)}l-5 -3l2 -1l-2 -3l5 2l5 -2l-2 3l2 1Z`, 'black', { w: .5 }); // the eagle
    gate += k.line(seg(gx(-41.5), GB, gx(41.5), GB), 1.6);

    // ---------- the square, and the Guard marching across it
    let ground = k.shape(`M-5 ${GB}H645V245H-5Z`, 'paper', { w: 0 }) + k.line(`M-5 ${GB + 2}H645`, 1);
    let pave = '';
    for (let yy = GB + 5; yy < 242; yy += 3 + (yy - GB) * .14) { const w = 5 + (yy - GB) * .5; for (let x = ((yy * 7) % w) - 6; x < 650; x += w) pave += `M${f(x)} ${f(yy)}h${f(w * .82)}`; }
    ground += k.line(pave, .5);
    let rails = '';
    for (const yy of [218, 221.5]) rails += `M-5 ${yy}Q320 ${yy - 3} 645 ${yy}`;
    ground += k.line(rails, .9);
    // the mounted officer leading
    const rider = (x, yb, h) => { // a horse walking right, its rider in a spiked helmet
      const X = (m) => f(x + m * h), Y = (m) => f(yb - m * h);
      let d = k.shape(`M${X(0)} ${Y(.62)}C${X(.1)} ${Y(.72)} ${X(.5)} ${Y(.7)} ${X(.66)} ${Y(.7)}L${X(.82)} ${Y(.92)}L${X(.9)} ${Y(.88)}L${X(1)} ${Y(.66)}L${X(.94)} ${Y(.62)}L${X(.8)} ${Y(.72)}L${X(.74)} ${Y(.56)}Q${X(.7)} ${Y(.42)} ${X(.6)} ${Y(.42)}L${X(.18)} ${Y(.42)}Q${X(0)} ${Y(.44)} ${X(0)} ${Y(.62)}Z`, 'black', { w: .7 });
      d += k.line(`M${X(.62)} ${Y(.44)}L${X(.7)} ${Y(.2)}L${X(.66)} ${Y(0)}M${X(.54)} ${Y(.44)}L${X(.5)} ${Y(.22)}L${X(.56)} ${Y(0)}M${X(.18)} ${Y(.44)}L${X(.24)} ${Y(.2)}L${X(.18)} ${Y(0)}M${X(.08)} ${Y(.46)}L${X(.02)} ${Y(.22)}L${X(.08)} ${Y(0)}M${X(0)} ${Y(.6)}q${f(-.08 * h)} ${f(.1 * h)} ${f(-.04 * h)} ${f(.3 * h)}`, Math.max(1, h * .04));
      d += k.figure(+X(.4), +Y(.62), h * .03, 'soldier').replace(/<path d="M[^"]*l[^"]*" fill="none"[^>]*\/>$/, '');
      return d;
    };
    let guard = rider(150, 226, 38);
    for (let i = 0; i < 11; i++) { const x = 202 + i * 21, yb = 228 + (i % 2) * 1.5; guard += k.figure(x, yb, 1.2, 'soldier') + k.figure(x + 9, yb - 3, 1.08, 'soldier'); }
    guard += k.flag(196, 214, 1.5);
    // the crowd at the kerbs, a newsboy, a motor car
    let crowd = '';
    for (let i = 0; i < 9; i++) crowd += k.figure(18 + i * 9 + r() * 3, 210 + r() * 2, .9, i % 3 === 1 ? 'woman' : 'man');
    for (let i = 0; i < 8; i++) crowd += k.figure(560 + i * 10 + r() * 3, 212 + r() * 2, .9, i % 3 === 0 ? 'woman' : 'man');
    crowd += k.figure(600, 240, 1.3, 'porter') + k.shape('M604 214h9v6h-9Z', 'paper', { w: .6 }) + k.line('M605 216h7M605 218h5', .5);
    const car = (x, yb) => k.shape(`M${x} ${yb - 6}h40q4 0 5 -4l-2 -6h-14l-4 -8h-14l-3 8h-8q-2 0 -2 4Z`, 'black', { w: .8 }) + k.shape(`M${x + 15} ${yb - 16}h11l3 6h-14Z`, 'glass', { w: .5 })
      + `<circle cx="${x + 8}" cy="${yb - 4}" r="4.4" fill="${P}" stroke="${k.ink}" stroke-width="1.6"/><circle cx="${x + 36}" cy="${yb - 4}" r="4.4" fill="${P}" stroke="${k.ink}" stroke-width="1.6"/>` + k.figure(x + 22, yb - 9, .55, 'man');
    crowd += car(470, 210);
    crowd += k.lamp(108, 214, 1.4) + k.lamp(532, 214, 1.4);
    k.lights.push([105.8, 174, 4.5, 5.9], [529.8, 174, 4.5, 5.9]);

    hide(nFar, [[gx(-42), 0, gx(42), GB], [546, 0, 650, GB]]); // behind the gate and the palace the far town stays dark
    return far + gate + sides + ground + crowd + guard;
  },
};
