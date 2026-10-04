// St Petersburg: from the granite steps of the University Embankment, beside one of the Theban sphinxes, looking
// upstream. The Neva runs wide and grey; low along the far bank the palaces stretch away, and over them rise the
// gilded dome of St Isaac's on its colonnaded drum among four belfries and, to the east, the Admiralty's golden needle.

export default {
  id: 'SPB',
  draw(k) {
    const f = k.f, P = k.paper, r = k.rng(71);
    const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
    // drop lit windows of the first n lights (the far layers) wherever a nearer shape covers them; returns how many went
    const hide = (n, rects) => { let gone = 0; for (let i = n - 1; i >= 0; i--) { const [x, y, w, h] = k.lights[i]; if (rects.some(([x0, y0, x1, y1]) => x + w > x0 && x < x1 && y + h > y0 && y < y1)) { k.lights.splice(i, 1); gone++; } } return gone; };
    const FB = 172; // the far bank, the river's edge

    // ---------- the far bank: the English Embankment, a long low line of palaces, soot
    let far = k.skyline(-5, 392, FB - 1, { seed: 19, style: 'south', hMin: 9, hMax: 16, wMin: 18, wMax: 34, lit: .4 });
    far += k.shape(`M-5 ${FB - 1}H392V${FB + 2}H-5Z`, 'vert', { far: true, w: .5 });
    far += k.windows(130, FB - 12, 260, 7, 30, 1, { far: true, lit: .4, ww: .4 }); // the embankment's lower windows
    const nFar = k.lights.length;

    // ---------- St Isaac's: the body with its pedimented portico, four belfries, the drum ringed with columns, the gilded dome
    const IX = 222, s = 1.62, iy = (m) => FB - 6 - m * s;
    const ix = (m) => IX + m * s;
    let isaac = k.shape(k.rect(ix(-48), iy(30), 96 * s, 30 * s), 'light', { w: 1.1 });
    isaac += k.shape(k.rect(ix(14), iy(30), 34 * s, 30 * s), 'mid', { w: 0 });
    isaac += k.windows(ix(-44), iy(26), 30 * s, 18 * s, 4, 2, { lit: .45 }) + k.windows(ix(18), iy(26), 26 * s, 18 * s, 3, 2, { lit: .45 });
    // the portico: eight columns under a pediment
    isaac += k.shape(k.rect(ix(-14), iy(26), 28 * s, 26 * s), 'black', { w: .8 });
    let colm = '';
    for (let i = 0; i < 8; i++) colm += k.rect(ix(-13.4 + i * 3.6), iy(25), 1.6 * s, 25 * s);
    isaac += k.shape(colm, 'vert', { w: .6 }) + k.shape(k.rect(ix(-15), iy(29), 30 * s, 4 * s), 'light', { w: 1 });
    isaac += k.shape(k.poly([[ix(-15.5), iy(29)], [ix(0), iy(37)], [ix(15.5), iy(29)]]), 'light', { w: 1.1 }) + k.line(seg(ix(-12), iy(29.6), ix(12), iy(29.6)), .6);
    // the four belfries at the corners of the roof, the nearer pair larger
    for (const [m, sc] of [[-38, 1], [38, 1], [-30, .8], [30, .8]].slice(2).concat([[-40, 1], [40, 1]])) {
      const bx = ix(m), bw = 8 * s * sc, bh = 9 * s * sc, by = iy(30);
      isaac += k.shape(k.rect(bx - bw / 2, by - bh, bw, bh), 'light', { w: .9 }) + k.shape(k.rect(bx + bw * .1, by - bh, bw * .4, bh), 'dark', { w: 0 });
      isaac += k.line(`M${f(bx - bw * .25)} ${f(by - bh)}v${f(bh)}M${f(bx + bw * .25)} ${f(by - bh)}v${f(bh)}`, .7);
      isaac += k.shape(k.dome(bx, by - bh, bw * .45, bw * .55), 'light', { w: .9 }) + k.line(`M${f(bx)} ${f(by - bh - bw * .7)}v-4M${f(bx - 1.6)} ${f(by - bh - bw * .7 - 2.4)}h3.2`, .8);
    }
    // the drum: a ring of columns before the wall, then the attic
    const dr = 14.6 * s, d0 = iy(30), d1 = iy(52);
    isaac += k.shape(k.rect(IX - dr - 3, d0 - 3, 2 * dr + 6, 3), 'dark', { w: .9 });
    isaac += k.shape(k.rect(IX - dr, d1, 2 * dr, d0 - d1 - 3), 'mid', { w: 1.1 });
    let dc = '';
    for (let i = 0; i < 12; i++) { const a = Math.PI * (i + .5) / 12, x = IX - Math.cos(a) * dr * .96; dc += k.rect(x - 1.1, d1 + 2, 2.2, d0 - d1 - 6); }
    isaac += k.shape(dc, 'light', { w: .55 }) + k.shape(k.rect(IX + dr * .35, d1, dr * .65, d0 - d1 - 3), 'dark', { w: 0, op: .6 });
    isaac += k.shape(k.rect(IX - dr - 1.5, d1 - 3, 2 * dr + 3, 3.4), 'light', { w: 1 });
    isaac += k.shape(k.rect(IX - dr * .86, iy(58), dr * 1.72, 6 * s - 3), 'vert', { w: 1 });
    // the gilded dome: ribbed, bright, its shoulder catching the light; the lantern and the cross
    const db = iy(58), dw = dr * .86, dh = 21 * s;
    isaac += k.shape(`M${f(IX - dw)} ${f(db)}C${f(IX - dw)} ${f(db - dh * 1.2)} ${f(IX + dw)} ${f(db - dh * 1.2)} ${f(IX + dw)} ${f(db)}Z`, 'paper', { w: 1.7 });
    isaac += k.shape(`M${f(IX + dw * .25)} ${f(db - dh * .9)}C${f(IX + dw * .8)} ${f(db - dh * .8)} ${f(IX + dw)} ${f(db - dh * .4)} ${f(IX + dw)} ${f(db)}H${f(IX + dw * .45)}Q${f(IX + dw * .5)} ${f(db - dh * .5)} ${f(IX + dw * .25)} ${f(db - dh * .9)}Z`, 'light', { w: 0 });
    let ribs = '';
    for (const u of [-.75, -.45, -.15, .15, .45, .75]) ribs += `M${f(IX + u * dw)} ${f(db)}Q${f(IX + u * dw * 1.06)} ${f(db - dh * .7)} ${f(IX + u * dw * .2)} ${f(db - dh * .9)}`;
    isaac += k.line(ribs, .7) + k.line(`M${f(IX - dw * .82)} ${f(db - dh * .35)}q${f(dw * .2)} ${f(-dh * .45)} ${f(dw * .55)} ${f(-dh * .62)}`, 1.4, { color: P });
    const lb = db - dh * .88;
    isaac += k.shape(k.rect(IX - 4.2, lb - 11, 8.4, 11), 'light', { w: .9 }) + k.line(`M${IX - 2} ${f(lb - 11)}v11M${IX + 2} ${f(lb - 11)}v11`, .6);
    isaac += k.shape(k.dome(IX, lb - 11, 4.6, 5), 'paper', { w: .9 }) + k.line(`M${IX} ${f(lb - 17)}v-10M${IX - 3} ${f(lb - 23)}h6M${IX - 2} ${f(lb - 20)}h4`, 1.2);

    // ---------- the Admiralty: the long front, the tower with its colonnade, the golden needle and its ship
    const AX = 66;
    let adm = k.shape(k.rect(-5, FB - 18, 132, 16), 'light', { far: true, w: .8 }) + k.windows(-1, FB - 16, 124, 12, 14, 2, { far: true, lit: .45 });
    adm += k.shape(k.rect(AX - 14, FB - 44, 28, 28), 'light', { w: 1.1 }) + k.shape(k.arch(AX - 6, FB - 30, 12, 14), 'black', { w: .7 });
    adm += k.shape(k.rect(AX - 11, FB - 60, 22, 16), 'light', { w: 1 });
    let ac = '';
    for (let i = 0; i < 6; i++) ac += `M${AX - 9 + i * 3.6} ${FB - 58}v13`;
    adm += k.line(ac, 1) + k.shape(k.rect(AX - 12, FB - 62, 24, 3), 'dark', { w: .8 });
    adm += k.shape(`M${AX - 8} ${FB - 62}Q${AX - 8} ${FB - 72} ${AX} ${FB - 73}Q${AX + 8} ${FB - 72} ${AX + 8} ${FB - 62}Z`, 'light', { w: .9 }) + k.shape(k.rect(AX - 2.4, FB - 79, 4.8, 6), 'light', { w: .7 });
    adm += k.shape(k.poly([[AX - 2.4, FB - 79], [AX, 26], [AX + 2.4, FB - 79]]), 'light', { w: 1 }) + k.line(`M${AX - .4} ${FB - 80}L${AX} 34`, .5, { color: P });
    adm += k.line(`M${AX} 26v-4`, .9) + k.shape(`M${AX - 5} 21h10l-2 3h-6ZM${AX - 1} 21v-6l5 4Z`, 'black', { w: .4 }); // the little ship
    adm += k.shape(k.rect(AX + 14, FB - 34, 6, 16) + k.rect(AX - 20, FB - 34, 6, 16), 'mid', { w: .6 });
    far += k.haze(FB - 26, 26, .3);
    // a works chimney or two along the Moika, smoking
    for (const [x, sc] of [[330, 1.2], [362, .9], [130, .8]]) far += k.shape(k.rect(x - 2, FB - 40, 4, 38), 'dark', { far: true, w: .4 }) + k.smoke(x, FB - 42, sc, { seed: x });

    // ---------- the Neva: wide water, a ferry steamer, a barge under sail, the far bridge
    let neva = k.water(FB + 1, 240, { seed: 31 });
    let chop = '';
    for (let i = 0; i < 40; i++) { const t = Math.pow(r(), 1.2), y = FB + 3 + t * 64, x = -5 + r() * 400, w = 6 + t * 26; chop += `M${f(x)} ${f(y)}q${f(w / 2)} ${f(-1 - t * 2)} ${f(w)} 0`; }
    neva += k.line(chop, .6) + k.reflect(`<g opacity=".9">${isaac}</g>`, FB + 1, .2);
    const ferry = k.shape(`M244 196h56l-5 6h-48Z`, 'black', { w: .7 }) + k.shape(k.rect(258, 189, 28, 7), 'light', { w: .6 }) + k.windows(259, 190, 26, 5, 6, 1, { lit: .6 }) + k.shape(k.rect(270, 177, 4, 12), 'black', { w: .4 }) + k.smoke(272, 176, .8, { seed: 2 });
    const barge = k.shape('M60 214h70l-6 7h-60Z', 'dark', { w: .8 }) + k.shape(k.poly([[92, 213], [92, 168], [118, 210]]), 'light', { w: .7 }) + k.shape(k.poly([[89, 172], [89, 212], [68, 212]]), 'mid', { w: .6 }) + k.line('M92 214V164', 1.4) + k.figure(124, 214, .8, 'porter');

    // ---------- the near quay on the right: granite parapet, steps going down to the water, the sphinx on its pedestal
    let quay = k.shape('M645 150H402L378 170V245H645Z', 'vert', { w: 1.3 });
    quay += k.shape('M645 150H402V160H645Z', 'light', { w: 1.1 });
    // the steps, descending to the left into the water
    let steps = '', risers = '';
    for (let i = 0; i < 9; i++) { const y = 172 + i * 8, x0 = 350 - i * 10; steps += `M${x0} ${y}H${x0 + 140}V${y + 8}H${x0}Z`; risers += k.rect(x0, y + 4.5, 140, 3.5); }
    quay += k.shape(steps, 'light', { w: .9 }) + k.shape(risers, 'dark', { w: 0 });
    quay += k.shape('M645 160H490L490 245H645Z', 'dark', { w: 1.2 }); // the granite face of the quay
    let blocks = '';
    for (let y = 168; y < 245; y += 13) blocks += `M490 ${y}H645`;
    for (let i = 0; i < 6; i++) for (let x = 640 - (i % 2) * 24; x > 490; x -= 48) blocks += `M${x} ${168 + i * 13}v13`;
    quay += k.line(blocks, .6, { color: P });
    // the sphinx, facing upstream: a lion's body couchant, forepaws out, the pharaoh's head in its striped headdress
    const SX = 612, SY = 128, X = (n) => SX - n;
    let sph = k.shape(k.rect(X(126), SY + 4, 132, 18), 'light', { w: 1.2 }) + k.shape(k.rect(X(130), SY, 140, 5), 'dark', { w: 1 });
    sph += k.shape(k.rect(X(24), SY + 4, 30, 18), 'mid', { w: 0, op: .6 });
    sph += k.shape(`M${X(0)} ${SY}Q${X(-5)} ${SY - 12} ${X(7)} ${SY - 19}Q${X(34)} ${SY - 25} ${X(64)} ${SY - 22}L${X(74)} ${SY - 30}Q${X(74)} ${SY - 49} ${X(88)} ${SY - 50}Q${X(100)} ${SY - 50} ${X(102)} ${SY - 40}L${X(104)} ${SY - 30}L${X(101)} ${SY - 28}L${X(102)} ${SY - 24}L${X(99)} ${SY - 22}L${X(99)} ${SY - 15}L${X(95)} ${SY - 15}L${X(95)} ${SY - 11}L${X(124)} ${SY - 9}Q${X(129)} ${SY - 5} ${X(124)} ${SY}Z`, 'dark', { w: 1.4 });
    sph += k.shape(`M${X(74)} ${SY - 30}Q${X(74)} ${SY - 49} ${X(88)} ${SY - 50}Q${X(100)} ${SY - 50} ${X(102)} ${SY - 40}L${X(93)} ${SY - 40}L${X(92)} ${SY - 20}L${X(86)} ${SY - 12}L${X(78)} ${SY - 14}Z`, 'mid', { w: 1 }); // the nemes and its lappet
    let nem = '';
    for (let i = 0; i < 7; i++) nem += `M${f(X(77 + i * .4))} ${f(SY - 18 - i * 3.6)}l${f(-(13 - i * .5))} ${f(-1.4 - i * .2)}`;
    sph += k.line(nem, .8, { color: P });
    sph += k.shape(`M${X(93)} ${SY - 40}L${X(102)} ${SY - 40}L${X(104)} ${SY - 30}L${X(101)} ${SY - 28}L${X(102)} ${SY - 24}L${X(99)} ${SY - 22}L${X(93)} ${SY - 22}Z`, 'light', { w: .8 }); // the face
    sph += k.line(`M${X(97)} ${SY - 34}h-3M${X(99)} ${SY - 25.5}h-2.4`, .8) + k.shape(`M${X(95)} ${SY - 22}h-4v7h4Z`, 'dark', { w: .6 }); // eye, lips, the beard
    sph += k.line(`M${X(98)} ${SY - 4}h-24M${X(98)} ${SY - 1}h-25M${X(10)} ${SY - 8}q-14 6 -30 2q-6 -2 -10 2`, .9) + k.line(`M${X(6)} ${SY - 12}q8 4 4 10`, 1.2);
    sph += k.shape(`M${X(30)} ${SY - 22}Q${X(56)} ${SY - 20} ${X(70)} ${SY - 4}V${SY}H${X(30)}Z`, 'black', { w: 0, op: .5 });
    // a lamp on the parapet, figures on the quay, the boatman at the foot of the steps
    let life = k.lamp(414, 152, 1.5) + k.figure(464, 160, .95, 'woman') + k.figure(444, 159, 1, 'man') + k.figure(426, 182, 1.05, 'porter') + k.figure(378, 214, 1.05, 'soldier');
    k.lights.push([411.6, 108.9, 4.8, 6.3]);
    const skiff = k.shape('M344 236q-6 6 -20 6h-44q-10 0 -14 -8Z', 'black', { w: .9 }) + k.line('M340 237h-70', .7, { color: P }) + k.figure(304, 234, 1.15, 'man') + k.line('M322 222l26 18M288 222l-30 16', 1.1);
    hide(nFar, [[ix(-50), 0, ix(50), FB], [AX - 16, 0, AX + 16, FB], [-5, FB - 18, 127, FB], [376, 0, 650, FB + 2]]); // the far bank behind St Isaac's, the Admiralty and the quay stays dark

    return far + isaac + adm + neva + ferry + barge + quay + sph + life + skiff;
  },
};
