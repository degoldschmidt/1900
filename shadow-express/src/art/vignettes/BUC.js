// Bucharest: from the shade of a café terrace on the Calea Victoriei, under its striped awning and between its
// cast-iron columns, across the boulevard to the Athenaeum, whose ribbed dome rises over an Ionic portico among
// the garden's trees. A tram and a birja pass; a gentleman hides behind his newspaper; the waiter brings coffee.

export default {
  id: 'BUC',
  draw(k) {
    const f = k.f, r = k.rng(36);
    const base = 178, kerb = 206;

    // ---------- far: the city's roofs, church towers, the smoke of the new industries ----------
    let far = k.skyline(-5, 645, base - 2, { seed: 9, style: 'east', hMin: 14, hMax: 34, wMin: 14, wMax: 26 });
    for (const x of [96, 118]) far += k.shape(k.rect(x - 5, 104, 10, 46), 'light', { far: true, w: .5 }) + k.shape(k.onion(x, 104, 12, 14), 'mid', { far: true, w: .5 }) + k.line(`M${x} 90v-6`, .5, { far: true });
    far += k.shape(k.rect(586, 96, 5, 60), 'black', { far: true, w: .4 }) + k.smoke(588, 94, 1.1, { seed: 2 }) + k.shape(k.rect(560, 112, 4, 44), 'black', { far: true, w: .4 }) + k.smoke(562, 110, .8, { seed: 5 });
    far += k.haze(base - 40, 40, .35);

    // ---------- the buildings either side of the garden ----------
    let flank = k.building(26, 186, 186, 74, { tone: 'light', roof: 'mansard', floors: 4, cols: 12, lit: .35, rh: 20 });
    flank += k.shape(k.dome(36, 112, 12, 14), 'dark', { w: .8 }) + k.shape(k.dome(202, 112, 12, 14), 'dark', { w: .8 }); // the hotel's corner cupolas
    flank += k.building(430, 186, 186, 66, { tone: 'mid', roof: 'mansard', floors: 4, cols: 11, lit: .35, rh: 18 });
    for (let x = 434; x < 612; x += 22) flank += k.shape(k.poly([[x, 172], [x + 18, 172], [x + 20, 178], [x - 2, 178]]), 'vert', { w: .5 }); // shop blinds
    flank += k.shape(k.rect(120, 98, 4, 14), 'black', { w: .4 }) + k.smoke(122, 97, .7, { seed: 8 }) + k.shape(k.rect(520, 104, 4, 14), 'black', { w: .4 }) + k.smoke(522, 103, .6, { seed: 11 });

    // ---------- the Athenaeum, drawn about its own centre and set in place ----------
    const ath = (() => {
      const n0 = k.lights.length, X = 320, Y = base, sc = .9;
      let s = k.shape(k.rect(-74, -54, 148, 54), 'light', { w: 1 }) + k.shape(k.rect(44, -54, 30, 54), 'dark', { w: 0 });
      s += k.windows(-70, -46, 30, 30, 2, 2, { arched: true, ww: .5, lit: .4 }) + k.windows(44, -46, 26, 30, 2, 2, { arched: true, ww: .5, lit: .4 });
      s += k.shape(k.rect(-56, -82, 112, 28), 'light', { w: 1.1 }) + k.shape(k.rect(26, -82, 30, 28), 'dark', { w: 0 });
      for (let x = -52; x < 52; x += 8) s += k.shape(k.rect(x, -74, 4, 12), 'glass', { w: .4 }); // the attic's ring of little windows
      s += k.line('M-58 -82H58', 1.4);
      // the dome: tall, ribbed like a helmet, lit from the left
      s += k.shape('M-52 -82C-54 -116 -28 -136 0 -138C28 -136 54 -116 52 -82Z', 'light', { w: 1.5 });
      s += k.shape('M8 -137C34 -132 54 -114 52 -82H20C24 -106 18 -126 8 -137Z', 'dark', { w: 0 });
      for (const t of [-.75, -.5, -.25, 0, .25, .5, .75]) s += k.line(`M${f(t * 52)} -82Q${f(t * 46)} -124 0 -138`, .8);
      for (const y of [-96, -110]) s += k.line(`M${f(-50 + (-82 - y) * .3)} ${y}Q0 ${y - 6} ${f(50 - (-82 - y) * .3)} ${y}`, .4);
      s += k.shape(k.rect(-5, -148, 10, 11), 'light', { w: .8 }) + k.shape(k.dome(0, -148, 7, 6), 'dark', { w: .7 }) + k.line('M0 -154v-8', .9);
      // the steps and the portico: six Ionic columns under a pediment
      s += k.shape(k.rect(-62, -8, 124, 8), 'light', { w: .9 }) + k.line('M-62 -5h124M-62 -2.5h124', .5);
      s += k.shape(k.rect(-50, -44, 100, 36), 'black', { w: 0 });
      for (let i = 0; i < 6; i++) {
        const x = -46 + i * 18;
        s += k.shape(k.rect(x, -44, 7, 36), 'paper', { w: .8 }) + k.shape(k.rect(x + 4, -44, 3, 36), 'mid', { w: 0 });
        s += k.line(`M${x - 2} -44q2 -3 4 0M${x + 5} -44q2 -3 4 0`, .7); // the volutes
      }
      s += k.shape(k.rect(-54, -52, 108, 8), 'light', { w: 1 }) + k.shape(k.poly([[-56, -52], [0, -72], [56, -52]]), 'light', { w: 1.1 });
      s += k.shape(k.poly([[-46, -54], [0, -69], [46, -54]]), 'mid', { w: .5 });
      for (let i = n0; i < k.lights.length; i++) { const [x, y, w, h] = k.lights[i]; k.lights[i] = [f(X + x * sc), f(Y + y * sc), f(w * sc), f(h * sc)]; }
      return `<g transform="translate(${X} ${Y}) scale(${sc})">${s}</g>`;
    })();
    // the garden: trees either side, its railing along the far pavement
    let garden = '';
    for (const [x, y, s] of [[226, 182, 1.8], [252, 180, 1.2], [394, 180, 1.3], [418, 182, 1.9]]) garden += k.tree(x, y, s, 'round');
    let rail = '';
    for (let x = 206; x < 436; x += 4) rail += `M${x} 186v-7`;
    garden += k.line(rail, .5) + k.line('M206 179H436', .8) + k.line('M206 186H436', 1);

    // ---------- the boulevard ----------
    let road = k.shape(k.rect(-5, 186, 655, kerb - 186), 'paper', { w: 0 }) + k.line('M-5 186H650', 1);
    let setts = '';
    for (let row = 0; row < 3; row++) { const y = 190 + row * 5.6; for (let x = (row % 2) * 8 - 8; x < 650; x += 18) setts += `M${x} ${f(y)}q3.4 -1.6 7 0`; }
    road += k.line(setts, .4) + k.line('M-5 197H650M-5 200H650', .6);
    for (const x of [192, 448]) { road += k.lamp(x, 188, 1); k.lights.push([x - 2.2, 158.6, 4.4, 4]); }
    const tram = (() => { // an electric tram, its trolley pole raised
      const x = 72, y = 200;
      let s = k.shape(k.rect(x, y - 24, 86, 20), 'mid', { w: .9 }) + k.shape(k.rect(x - 3, y - 28, 92, 5), 'dark', { w: .7 });
      s += k.windows(x + 4, y - 22, 78, 9, 7, 1, { ww: .7, wh: .8, lit: .7 }) + k.shape(k.rect(x, y - 6, 86, 3), 'black', { w: 0 });
      s += `<circle cx="${x + 16}" cy="${y - 2}" r="3" fill="${k.ink}"/><circle cx="${x + 70}" cy="${y - 2}" r="3" fill="${k.ink}"/>`;
      return s + k.line(`M${x + 40} ${y - 28}L${x + 64} ${y - 50}`, 1) + k.figure(x + 8, y - 6, .55, 'man');
    })();
    const birja = (x, y, s) => { // a birja facing left: black horse, folded hood, the coachman on his box
      const T = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, u, w) => `${f(x - u * s)} ${f(y + w * s)}`);
      let o = k.shape(T('M2 -24 C10 -27 22 -25 28 -28 C30 -32 32 -36 34 -38 L35 -42 L37 -38 C39 -37 41 -33 42 -31 L41 -28 C38 -29 36 -30 34 -30 C33 -27 32 -24 31 -20 C28 -16 18 -16 10 -16 C6 -17 3 -19 1 -22 Z'), 'ink', { w: .6 });
      o += k.line(T('M29 -18 L33 -9 L31 -2 M27 -18 L25 -9 L21 -4 M7 -17 L4 -8 L5 0 M10 -17 L13 -9 L12 0'), 2 * s) + k.line(T('M2 -24 C-2 -22 -3 -16 -2 -11'), 1.5 * s);
      o += k.line(T('M30 -24 L-6 -18'), 1.1) + k.shape(T('M-36 -12 L-6 -12 C-4 -16 -5 -24 -10 -26 L-34 -26 C-38 -24 -38 -16 -36 -12 Z'), 'ink', { w: .6 });
      o += k.shape(T('M-36 -26 C-40 -36 -32 -42 -24 -42 L-22 -26 Z'), 'dark', { w: .7 }) + k.shape(T('M-12 -26 L-10 -34 L-2 -34 L-4 -26 Z'), 'ink', { w: .5 });
      o += k.figure(x + 6 * s, y - 34 * s, .8 * s, 'man');
      for (const [wx, wr] of [[-28, 9], [-9, 6.5]]) o += `<circle cx="${f(x - wx * s)}" cy="${f(y - wr * s)}" r="${f(wr * s)}" fill="none" stroke="${k.ink}" stroke-width="${f(1.3 * s)}"/>`;
      return o;
    };
    road += tram + birja(486, 202, .8) + k.figure(290, 188, .8, 'woman') + k.figure(300, 188, .8, 'man') + k.figure(364, 188, .75, 'soldier');

    // ---------- the terrace, in the awning's shade ----------
    let terrace = k.shape(k.rect(-5, kerb, 655, 40), 'light', { w: 0 }) + k.line(`M-5 ${kerb}H650`, 1.4);
    let tiles = '';
    for (let x = -300; x < 960; x += 64) tiles += `M${f(320 + (x - 320) * .55)} ${kerb}L${x} 246`;
    terrace += k.line(tiles + 'M-5 218H650M-5 232H650', .45);
    const tub = (x) => k.shape(k.poly([[x - 8, kerb + 2], [x + 8, kerb + 2], [x + 6, kerb + 16], [x - 6, kerb + 16]]), 'dark', { w: .8 }) + k.line(`M${x} ${kerb + 2}v-14`, 1.4)
      + k.shape(`M${x - 11} ${kerb - 18}a11 10 0 1 1 22 0a11 10 0 1 1 -22 0Z`, 'dark', { w: .8 }) + k.shape(`M${x - 9} ${kerb - 20}a8 6 0 0 1 14 -4q-8 0 -14 4Z`, 'stipple', { w: 0 });
    terrace += tub(258) + tub(384);
    const table = (x, y) => k.shape(k.rect(x - 1.6, y, 3.2, 238 - y), 'ink', { w: 0 }) + k.line(`M${x - 9} 239L${x} 234L${x + 9} 239`, 1.4)
      + k.shape(`M${x - 17} ${y}a17 4 0 1 0 34 0a17 4 0 1 0 -34 0Z`, 'paper', { w: 1 }) + k.shape(`M${x - 17} ${y}a17 4 0 0 0 34 0v2a17 4 0 0 1 -34 0Z`, 'mid', { w: .6 });
    const chair = (x, y, dir) => { const D = (n) => f(n * dir); return k.line(`M${x} ${y}h${D(14)}M${f(x + 1 * dir)} ${y}l${D(-2)} 15M${f(x + 13 * dir)} ${y}l${D(2)} 15M${x} ${y}l${D(-2)} -20q${D(-1)} -9 ${D(6)} -9q${D(6)} 1 ${D(3)} 8`, 1.5); };
    // the newspaper reader: legs crossed, the broadsheet up, only his bowler showing
    const reader = (() => {
      const x = 104, y = 222;
      let s = chair(x - 10, y, 1);
      s += k.shape(`M${x - 8} ${y}l2 -22q3 -5 9 -4l4 3l-1 23Z`, 'ink', { w: .6 }) + k.shape(`M${x - 6} ${y - 2}h20l1 5h-21Z`, 'ink', { w: 0 });
      s += k.line(`M${x + 14} ${y + 1}l4 15h5M${x + 10} ${y + 2}l-1 14h5`, 2.6);
      s += k.shape(`M${x + 5} ${y - 50}h-8l-1 -2q5 -8 10 0Z`, 'ink', { w: .5 }) + k.line(`M${x - 6} ${y - 50}h14`, 1.4);
      s += k.shape(`M${x + 2} ${y - 48}L${x + 30} ${y - 46}L${x + 29} ${y - 14}L${x + 1} ${y - 16}Z`, 'paper', { w: 1 });
      let cols = '';
      for (let c = 0; c < 4; c++) for (let l = 0; l < 7; l++) cols += `M${f(x + 4 + c * 6.6)} ${f(y - 42 + l * 3.8 + c * .15)}h5`;
      s += k.line(cols, .55) + k.line(`M${x + 3} ${y - 45}h26`, 1.4) + k.line(`M${x + 15.5} ${y - 47}L${x + 15} ${y - 15}`, .6);
      return s + table(x + 48, y - 8) + k.shape(`M${x + 42} ${y - 13}h7v-4h-7Z`, 'paper', { w: .7 }) + k.line(`M${x + 50} ${y - 15}q2 0 2 2`, .6);
    })();
    // the lady at her coffee, in a wide hat
    const lady = (() => {
      const x = 532, y = 222;
      let s = table(x - 40, y - 8) + chair(x + 12, y, -1);
      s += k.shape(`M${x - 6} 238C${x - 8} ${y + 4} ${x - 6} ${y - 4} ${x - 2} ${y - 8}L${x - 1} ${y - 22}Q${x + 3} ${y - 28} ${x + 8} ${y - 24}L${x + 9} ${y - 8}C${x + 14} ${y - 2} ${x + 16} ${y + 8} ${x + 16} 238Z`, 'ink', { w: .6 });
      s += k.line(`M${x} ${y - 20}l-10 6l-8 -2`, 2) + `<circle cx="${x + 3}" cy="${y - 30}" r="3.6" fill="${k.ink}"/>`;
      s += k.shape(`M${x - 10} ${y - 33}q13 -8 26 0q-13 3 -26 0Z`, 'ink', { w: .5 }) + k.shape(`M${x + 2} ${y - 36}q6 -9 13 -5q-7 0 -10 6Z`, 'paper', { w: .6 });
      return s + k.shape(`M${x - 48} ${y - 13}h7v-4h-7Z`, 'paper', { w: .7 });
    })();
    // the waiter: black coat, long white apron, the tray held high
    const waiter = (() => {
      const x = 590, y = 240;
      let s = k.shape(`M${x - 5} ${y}l1 -24l-1 -14q0 -6 6 -7h4q6 1 6 7l-1 14l1 24Z`, 'ink', { w: .6 });
      s += k.shape(`M${x - 5} ${y - 23}h16l1 22h-18Z`, 'paper', { w: .8 }) + `<circle cx="${x + 3}" cy="${y - 46}" r="4.2" fill="${k.ink}"/>`;
      s += k.line(`M${x - 2} ${y - 38}l-8 -8l-2 -8`, 2.4) + k.shape(`M${x - 22} ${y - 56}h18v2.4h-18Z`, 'dark', { w: .6 });
      s += k.shape(`M${x - 18} ${y - 56}v-6q4 -4 8 0v6Z`, 'light', { w: .6 }) + k.line(`M${x - 10} ${y - 60}l4 -2`, .8);
      return s + k.shape(`M${x + 9} ${y - 36}l3 12l-4 1Z`, 'paper', { w: .6 });
    })();
    terrace += reader + lady + waiter;

    // ---------- the awning and the cast-iron columns that frame it all ----------
    let frame = '';
    for (let i = 0, x = -10; x < 650; x += 18, i++) {
      const tone = i % 2 ? 'paper' : 'dark';
      frame += k.shape(`M${x} -6H${x + 18}V22Q${x + 9} 31 ${x} 22Z`, tone, { w: .8 });
    }
    frame += k.line('M-6 16H646', .8);
    for (const x of [200, 440]) { // lanterns hung from the awning
      frame += k.line(`M${x} 22v10`, .7) + k.shape(k.poly([[x - 4, 32], [x + 4, 32], [x + 3, 44], [x - 3, 44]]), 'glass', { w: .8 }) + k.shape(k.poly([[x - 5, 32], [x, 28], [x + 5, 32]]), 'dark', { w: .6 });
      k.lights.push([x - 3, 33, 6, 10]);
    }
    for (const [x, dir] of [[12, 1], [628, -1]]) {
      frame += k.shape(k.rect(x - 3.5, 30, 7, 216), 'black', { w: .8 }) + k.line(`M${x - 1.6} 34V240`, .7, { color: k.paper, op: .7 });
      frame += k.shape(k.rect(x - 7, 24, 14, 7), 'dark', { w: .8 }) + k.shape(k.rect(x - 6, 232, 12, 8), 'dark', { w: .8 });
      frame += k.line(`M${x} 44q${16 * dir} 0 ${24 * dir} -14q${4 * dir} -6 ${10 * dir} -4M${x} 58q${30 * dir} -4 ${40 * dir} -28`, 1.2);
    }

    return far + flank + ath + garden + road + terrace + frame;
  },
};
