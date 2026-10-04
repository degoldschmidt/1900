// Cologne: from the tracks beside the Hauptbahnhof. The cathedral, black with a century of soot, looms over the
// railway yard, its two openwork spires far above the long roof and the forest of pinnacles round the choir; on the
// right a train comes off the Hohenzollern bridge under its bowstring arches. Signals, a shunting engine, workmen.

export default {
  id: 'COL',
  draw(k) {
    const f = k.f, P = k.paper;
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const CB = 190; // the cathedral's foot, behind the embankment
    const s = 1.17; // px per metre on the cathedral

    // ---------- far: Deutz across the Rhine, soot
    let far = k.skyline(300, 660, 184, { seed: 17, style: 'north', hMin: 8, hMax: 20, wMin: 14, wMax: 26 }) + k.haze(150, 40, .34);
    const nFar = k.lights.length;

    // ---------- the cathedral
    const y = (m) => CB - m * s;
    const tower = (cx, w, H, near) => { // w: base width px; H: height px to the finial
      let t = '';
      const lit = near ? 'mid' : 'dark';
      const st = [[0, .3, 1, 3], [.3, .52, .93, 2], [.52, .68, .8, 2]];
      for (const [a, b, ww, bays] of st) {
        const x0 = cx - w * ww / 2, x1 = cx + w * ww / 2, y0 = CB - a * H, y1 = CB - b * H, sw = x1 - x0;
        t += k.shape(k.rect(x0, y1, sw, y0 - y1), lit, { w: 1.3 });
        t += k.shape(k.rect(cx + sw * .1, y1, sw * .4, y0 - y1), 'black', { w: 0 });
        // tall lancets between the buttresses
        let lan = '', mul = '';
        for (let i = 0; i < bays; i++) {
          const bx = x0 + sw * (.12 + .76 * (i + .5) / bays), lw = sw * .62 / bays * .62, lh = (y0 - y1) * (b === .68 ? .8 : .7);
          lan += k.gothic(bx - lw / 2, y1 + (y0 - y1) * .1, lw, lh);
          mul += seg(bx, y1 + (y0 - y1) * .1 + lw * .5, bx, y1 + (y0 - y1) * .1 + lh);
        }
        t += k.shape(lan, 'black', { w: .6 }) + k.line(mul, .55, { color: P });
        // buttresses as strong verticals, a pinnacle crowning each
        let bt = '';
        for (const u of [0, .5, 1]) bt += seg(x0 + sw * u, y0, x0 + sw * u, y1);
        t += k.line(bt, 2.4) + k.line(seg(x0 - 1.5, y1, x1 + 1.5, y1) + seg(x0, y1 + 3, x1, y1 + 3), 1.2);
        for (const u of [0, .25, .5, .75, 1]) t += k.shape(k.spire(x0 + sw * u, y1, u % .5 ? 3.4 : 5, (u % .5 ? 9 : 14) + (b === .68 ? 8 : 0)), u > .5 ? 'black' : 'dark', { w: .7 });
      }
      // the openwork spire: dark stone pierced by tracery, crockets up both edges, the cross-flower on top
      const sb = CB - .68 * H, tip = CB - .985 * H, sw = w * .64;
      t += k.shape(k.poly([[cx - sw / 2, sb], [cx, tip], [cx + sw / 2, sb]]), near ? 'dark' : 'dark', { w: 1.4 });
      t += k.shape(k.poly([[cx + sw * .04, sb], [cx, tip], [cx + sw / 2, sb]]), 'black', { w: 0 });
      let tr = '', cr = '';
      for (let i = 1; i < 10; i++) {
        const yy = sb + (tip - sb) * i / 10, hw = sw / 2 * (1 - i / 10), y2 = sb + (tip - sb) * (i - 1) / 10, hw2 = sw / 2 * (1 - (i - 1) / 10);
        tr += seg(cx - hw, yy, cx + hw, yy);
        for (const u of [-.5, 0, .5]) if (hw2 > 3) tr += `M${f(cx + u * hw2)} ${f(y2 - 1)}Q${f(cx + u * hw2 + 1.6)} ${f((y2 + yy) / 2)} ${f(cx + u * hw)} ${f(yy + 1.2)}`;
        cr += `M${f(cx - hw)} ${f(yy)}l-2.8 -1.4M${f(cx + hw)} ${f(yy)}l2.8 -1.4`;
      }
      t += k.line(tr, .65, { color: P }) + k.line(cr, 1.1);
      t += k.line(`M${f(cx)} ${f(tip)}v-6M${f(cx - 3.6)} ${f(tip - 3)}h7.2`, 1.4) + `<circle cx="${f(cx)}" cy="${f(tip - 6.4)}" r="1.7" fill="${k.ink}"/>`;
      return t;
    };
    let dom = '';
    // the long body: aisles, clerestory, the steep roof, flying buttresses, pinnacles, the crossing spire, the choir
    const NX0 = 170, NX1 = 318;
    dom += k.shape(k.poly([[NX0, y(44)], [NX0 + 7, y(62)], [NX1 - 26, y(62)], [NX1 - 2, y(44)]]), 'dark', { w: 1.3 }); // the roof
    let slate = '';
    for (let i = 1; i < 4; i++) slate += seg(NX0 + 1.7 * i, y(44 + i * 4.4), NX1 - 2 - 6 * i, y(44 + i * 4.4));
    dom += k.line(slate, .55, { color: P });
    dom += k.shape(k.rect(NX0, y(44), NX1 - NX0, 44 * s), 'mid', { w: 1.2 }); // clerestory over the aisles
    dom += k.shape(k.rect(NX0, y(24), NX1 - NX0, 24 * s), 'dark', { w: 1.1 });
    let win = '', fly = '', pin = '';
    for (let x = NX0 + 6; x < NX1 - 8; x += 12) {
      win += k.gothic(x, y(41), 5.4, 14 * s) + k.gothic(x, y(20), 5.4, 13 * s);
      fly += `M${f(x + 10)} ${f(y(27))}Q${f(x + 10)} ${f(y(39))} ${f(x + 2)} ${f(y(41))}`;
      pin += k.rect(x + 8.4, y(36), 3.2, 12 * s);
      dom += k.shape(k.spire(x + 10, y(36), 4.4, 15), 'dark', { w: .7 });
    }
    dom += k.shape(win, 'glass', { w: .5 }) + k.shape(pin, 'dark', { w: .6 }) + k.line(fly, 1.3);
    // the north transept front, gabled, with its rose and portals
    const TX0 = 220, TX1 = 254;
    dom += k.shape(k.rect(TX0, y(47), TX1 - TX0, 47 * s), 'mid', { w: 1.2 }) + k.shape(k.gable(TX0, y(47), TX1 - TX0, 22), 'dark', { w: 1.2 });
    dom += k.shape(k.rect(TX0 + 20, y(47), 14, 47 * s), 'black', { w: 0 });
    dom += k.shape(k.gothic(TX0 + 8, y(43), TX1 - TX0 - 16, 21 * s), 'glass', { w: .7 }) + `<circle cx="${(TX0 + TX1) / 2}" cy="${f(y(37))}" r="5.4" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width=".7"/>`;
    dom += k.shape(k.gothic(TX0 + 5, y(14), 9, 14 * s) + k.gothic(TX1 - 14, y(14), 9, 14 * s), 'black', { w: .6 });
    for (const px of [TX0, TX1]) dom += k.shape(k.rect(px - 2.6, y(52), 5.2, 52 * s), 'dark', { w: .8 }) + k.shape(k.spire(px, y(52), 6.4, 20), 'dark', { w: .8 });
    // the crossing spire on the roof ridge, slender
    dom += k.shape(k.rect(232, y(70), 8, 8 * s + 1), 'dark', { w: .9 }) + k.shape(k.spire(236, y(70), 7, 40), 'black', { w: .8 }) + k.line(`M236 ${f(y(70) - 40)}v-5`, 1);
    // the choir: its rounded east end bristling with buttresses and pinnacles
    dom += k.shape(`M${NX1 - 4} ${f(y(44))}Q${NX1 + 18} ${f(y(40))} ${NX1 + 20} ${f(y(0))}H${NX1 - 4}Z`, 'black', { w: 1.2 });
    for (let i = 0; i < 4; i++) { const px = NX1 + 2 + i * 6, ph = 50 - i * 6.5; dom += k.shape(k.rect(px - 1.7, y(ph), 3.4, ph * s), 'dark', { w: .6 }) + k.shape(k.spire(px, y(ph), 4.8, 16), 'dark', { w: .7 }); }
    dom += k.line(seg(NX0 - 2, y(44), NX1 + 4, y(44)), 1.5);
    dom += k.windows(NX0 + 6, y(24) + 6, NX1 - NX0 - 12, 9, 12, 1, { lit: .35, ww: .3 });
    // the twin west towers, the south one behind and to the left; the west front between them
    dom += k.shape(k.rect(100, y(60), 70, 60 * s), 'dark', { w: 1.2 });
    dom += tower(110, 44, 157 * s * .975, false) + tower(160, 46, 157 * s, true);
    // the station's great arched hall on the far left
    let hall = k.shape(`M-5 196V122Q38 74 84 122V196Z`, 'dark', { w: 1.3 });
    hall += k.shape(`M6 196V128Q38 92 72 128V196Z`, 'glass', { w: 1 });
    let ribs = '';
    for (let x = 14; x < 72; x += 8.5) ribs += `M${x} 196V${f(128 - Math.sin(Math.PI * (x - 6) / 66) * 34 + 6)}`;
    for (let yy = 140; yy < 196; yy += 11) ribs += `M6 ${yy}H72`;
    hall += k.line(ribs, .8) + k.shape(k.rect(-5, 120, 6, 76) + k.rect(78, 120, 8, 76), 'black', { w: .8 });
    for (const [lx, ly] of [[14, 152], [32, 144], [50, 152], [14, 172], [32, 166], [50, 172]]) k.lights.push([lx, ly, 9, 8]);
    hall += k.smoke(30, 112, 1.2, { seed: 5 });

    // ---------- the Hohenzollern bridge in profile, a train coming off it
    const BD = 176; // deck
    let bridge = k.shape(k.rect(380, BD, 265, 7), 'dark', { w: 1 });
    for (const [a, b] of [[420, 610], [610, 800]]) {
      const rise = 52;
      for (const off of [-4, 0]) { // the far truss shows just above the near one
        let arc = `M${a} ${BD + off}Q${(a + b) / 2} ${BD - rise * 2 + off} ${b} ${BD + off}`;
        bridge += k.line(arc, off ? 1 : 2.2, { far: !!off });
        let hang = '', lat = '';
        for (let i = 1; i < 14; i++) { const t = i / 14, xx = a + (b - a) * t, yy = BD - rise * 4 * t * (1 - t) + off; hang += `M${f(xx)} ${f(yy)}V${BD + off}`; if (i < 13) { const t2 = (i + 1) / 14; lat += seg(xx, yy, a + (b - a) * t2, BD + off); } }
        bridge += k.line(hang + lat, off ? .5 : .75, { far: !!off });
      }
    }
    bridge += k.shape(k.rect(594, BD + 7, 32, 20) + k.rect(404, BD + 7, 30, 20), 'vert', { w: .9 }); // the piers
    // the western bridgehead: a portal tower with a steep roof
    bridge += k.shape(k.rect(384, 124, 38, 62), 'vert', { w: 1.2 }) + k.shape(k.rect(409, 124, 13, 62), 'dark', { w: 0 });
    bridge += k.shape(k.poly([[380, 124], [403, 92], [426, 124]]), 'dark', { w: 1.2 }) + k.shape(k.gothic(394, 152, 16, 34), 'black', { w: .8 });
    bridge += k.windows(388, 130, 30, 13, 3, 1, { arched: true, lit: .5 });
    for (const px of [381, 425]) bridge += k.shape(k.spire(px, 124, 7, 16), 'dark', { w: .7 });
    // an equestrian emperor on the bridgehead
    bridge += k.shape(`M396 92q4 -6 10 -4l3 -5l2 4q2 4 -2 6v4h-2v-3h-7v3h-2Z`, 'black', { w: .5 }) + k.line('M402 84v-6', 1.2);
    // the river glimpsed under the deck
    let rhine = k.shape(k.rect(334, BD + 3, 312, 17), 'water', { w: 0 }) + k.line(`M346 ${BD + 13}h30M440 ${BD + 16}h60M540 ${BD + 11}h30`, .6, { color: P });
    const train = k.train(446, BD, 1.12, -1, 5);

    // ---------- the yard: embankment, tracks, signals, a shunting engine, wagons, coal, men
    let yard = k.shape(`M-5 194L645 ${BD + 20}V245H-5Z`, 'paper', { w: 0 }) + k.line(`M-5 194L645 ${BD + 20}`, 1.2);
    yard += k.shape(`M-5 194L645 ${BD + 20}V${BD + 30}L-5 205Z`, 'stipple', { w: 0 });
    let rails = '', ties = '';
    for (const [y0, gap] of [[205, 3.2], [216, 4], [229, 5.2]]) {
      rails += `M-5 ${y0}H645M-5 ${f(y0 + gap)}H645`;
      for (let x = -4; x < 645; x += 4 + gap) ties += `M${f(x)} ${f(y0 - .8)}l${f(-gap * .25)} ${f(gap + 1.6)}`;
    }
    yard += k.line(ties, .9) + k.line(rails, 1.15);
    yard += k.line('M-5 239H645', .6) + k.shape('M-5 236H645V245H-5Z', 'stipple', { w: 0 });
    // semaphore signals on their lattice posts
    for (const [sx, sy, up] of [[352, 206, 1], [470, 202, 0]]) {
      yard += k.shape(k.rect(sx - 2, sy - 64, 4, 64), 'mid', { w: .8 }) + k.line(`M${sx - 2} ${sy}L${sx + 2} ${sy - 16}M${sx + 2} ${sy}L${sx - 2} ${sy - 16}M${sx - 2} ${sy - 18}L${sx + 2} ${sy - 34}`, .5);
      yard += k.shape(up ? k.poly([[sx + 2, sy - 58], [sx + 19, sy - 66], [sx + 19, sy - 62], [sx + 2, sy - 54]]) : k.rect(sx + 2, sy - 59, 17, 4), 'light', { w: .8 }) + k.line(`M${sx + 15} ${f(sy - (up ? 64 : 58))}v${up ? 5 : 3}`, 1.4);
      yard += k.line(`M${sx} ${sy - 64}v-4`, 1.2);
      k.lights.push([sx - 4.5, sy - 56, 3.5, 3.5]);
    }
    // the signal box on its legs
    yard += k.shape(k.rect(600, 158, 34, 22), 'brick', { w: 1 }) + k.shape(k.poly([[596, 158], [617, 146], [638, 158]]), 'tiles', { w: 1 }) + k.windows(602, 160, 30, 10, 4, 1, { lit: .9, wh: .8, ww: .7 }) + k.line('M602 180V204M632 180V204M602 190L632 204M632 190L602 204', 1);
    // wagons and a shunting engine, a coal heap, the men of the yard
    let wag = '';
    for (const wx of [24, 74]) wag += k.shape(k.rect(wx, 194, 44, 18), 'dark', { w: 1 }) + k.line(`M${wx + 22} 194v18M${wx} 203h44`, .8) + `<circle cx="${wx + 10}" cy="213" r="3.4" fill="${k.ink}"/><circle cx="${wx + 34}" cy="213" r="3.4" fill="${k.ink}"/>`;
    const engine = k.train(212, 236, 1.9, 1, 0);
    yard += k.shape('M300 238Q326 214 352 220Q372 214 392 238Z', 'black', { w: .9 }) + k.line('M310 232l8 -4M336 226l10 -2M360 230l9 -3', .6, { color: P });
    yard += k.figure(282, 238, 1.12, 'porter') + k.figure(404, 239, 1.15, 'man') + k.figure(420, 238, 1.12, 'soldier') + k.figure(436, 239, 1.1, 'soldier') + k.figure(150, 204, .82, 'porter') + k.figure(520, 214, .88, 'man');
    yard += k.lamp(470, 238, 1.3);
    k.lights.push([467.9, 200.8, 4.2, 5.4]);
    yard += k.haze(196, 30, .22);

    hide(nFar, [[296, 90, 440, 186]]); // nothing of Deutz shows through the choir and the bridgehead
    return far + dom + rhine + bridge + train + hall + yard + wag + engine;
  },
};
