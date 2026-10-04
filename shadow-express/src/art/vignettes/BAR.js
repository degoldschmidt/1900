// Barcelona: the Sagrada Família in 1914, seen across the dusty building lot. Only the Nativity façade is rising:
// three deep portals under dripping stone and the dark cypress, the four bell towers half-built in scaffolding,
// derricks on their stumps; the apse's finished pinnacles to the left. Stone blocks, a mule cart, masons, palms,
// Gaudí's wave-roofed school, the smoking chimneys of Poblenou and the ridge of Collserola under a hard sun.

export default {
  id: 'BAR',
  draw(k) {
    const f = k.f, r = k.rng(73);
    const P = (x, y) => `${f(x)} ${f(y)}`;
    const hide = (boxes) => { k.lights = k.lights.filter(([x, y, w, h]) => !boxes.some(([a, b, c, d]) => x + w / 2 > a && x + w / 2 < c && y + h / 2 > b && y + h / 2 < d)); };
    const horse = (x, y, s, dir = 1, tone = 'dark', mule = false) => {
      const Q = (a, b) => `${f(x + a * s * dir)} ${f(y + b * s)}`;
      const body = `M${Q(-11, -12)}Q${Q(-11.5, -16)} ${Q(-8, -16.2)}Q${Q(-2, -14.6)} ${Q(2.6, -16.4)}L${Q(9.4, -22.6)}L${Q(10.4, -24)}L${Q(11, -22.4)}L${Q(15.6, -17.6)}L${Q(15, -16.2)}L${Q(12, -17.6)}L${Q(8.8, -12.4)}Q${Q(8.8, -9)} ${Q(6.5, -8.6)}Q${Q(-1, -7.4)} ${Q(-6.5, -8.4)}Q${Q(-10.4, -8.6)} ${Q(-11, -12)}Z`;
      const legs = `M${Q(-8.5, -9)}L${Q(-9.8, -4.5)}L${Q(-8.8, 0)}M${Q(-6, -8.4)}L${Q(-6.6, -4.4)}L${Q(-5.6, 0)}M${Q(4.6, -8.6)}L${Q(4.8, 0)}M${Q(6.6, -9)}L${Q(7.4, -4)}L${Q(7.2, 0)}`;
      return k.line(legs, 1.25 * s) + k.line(`M${Q(-11, -14)}q${f(-2.4 * s * dir)} ${f(3 * s)} ${f(-1.8 * s * dir)} ${f(9 * s)}`, 1.3 * s) + k.shape(body, tone, { w: .6 })
        + (mule ? k.line(`M${Q(10.2, -23)}L${Q(8.6, -28.5)}M${Q(10.8, -22.8)}L${Q(11.4, -28.4)}`, 1.2 * s) : '');
    };

    // ---- far: the ridge of Collserola, the new Eixample blocks, the factory chimneys of Poblenou smoking
    let s = k.shape('M-5 176Q60 150 130 156T260 142T400 150T520 136T645 152V200H-5Z', 'stipple', { far: true, w: .7 });
    s += k.shape('M510 138l6 -8 6 8Z', 'mid', { far: true, w: .5 });
    s += k.skyline(380, 645, 194, { seed: 75, hMin: 14, hMax: 30, wMin: 22, wMax: 40, style: 'south', lit: .35, chimneys: false });
    for (const [x, h] of [[452, 58], [478, 44], [610, 64]]) s += k.shape(k.poly([[x - 3, 194], [x - 2, 194 - h], [x + 2, 194 - h], [x + 3, 194]]), 'brick', { far: true, w: .6 }) + k.smoke(x, 192 - h, 1.1, { seed: x });
    s += k.haze(150, 44, .35);

    // ---- the apse, finished in 1893: a curved wall of tall windows crowned by its pinnacles
    let ap = k.shape('M24 202V150Q70 136 128 150V202Z', 'light', { w: 1.1 }) + k.shape('M96 202V143Q114 145 128 150V202Z', 'dark', { w: .5 });
    for (let x = 32; x < 120; x += 12) ap += k.shape(k.gothic(x, 160, 6, 30), 'black', { w: .5 });
    for (let i = 0; i < 8; i++) {
      const x = 28 + i * 13.5, y = 150 - Math.sin(i / 7 * Math.PI) * 10;
      ap += k.shape(k.poly([[x - 4, y], [x - 2.4, y - 30], [x + 2.4, y - 30], [x + 4, y]]), i < 5 ? 'vert' : 'dark', { w: .8 }) + k.shape(k.spire(x, y - 30, 6, 16), 'mid', { w: .7 }) + `<circle cx="${f(x)}" cy="${f(y - 47)}" r="1.6" fill="${k.ink}"/>`;
    }
    s += ap;
    hide([[20, 100, 140, 210]]);

    // ---- the Nativity façade: three portals under dripping stone, the cypress, four towers in scaffolding
    const base = 204;
    let fa = '';
    const tower = (cx, w, top) => {
      let t = k.shape(k.poly([[cx - w / 2, base], [cx - w * .43, top], [cx + w * .43, top], [cx + w / 2, base]]), 'light', { w: 1.3 });
      t += k.shape(k.poly([[cx + w * .12, base], [cx + w * .1, top], [cx + w * .43, top], [cx + w / 2, base]]), 'dark', { w: .5 });
      // the louvred slits winding up the tower
      let sl = '';
      for (let y = top + 8, i = 0; y < base - 34; y += 7, i++) for (let j = 0; j < 3; j++) { const x = cx - w * .32 + j * w * .27 + (i % 2) * w * .13; sl += `M${P(x, y)}l${f(w * .1)} -2.6v3l${f(-w * .1)} 2.6Z`; }
      t += k.shape(sl, 'ink', { w: 0 });
      // ragged unfinished top courses
      t += k.line(`M${P(cx - w * .43, top)}l3 -3 3 2 4 -4 3 3 4 -2 3 3`, 1.1);
      // scaffold poles, ledgers and braces; a derrick on the stump
      let sc = `M${P(cx - w / 2 - 4, base)}V${f(top - 18)}M${P(cx + w / 2 + 4, base)}V${f(top - 18)}`;
      for (let y = top - 14; y < base - 40; y += 11) sc += `M${P(cx - w / 2 - 6, y)}h${f(w + 12)}`;
      for (let y = top - 14; y < base - 50; y += 22) sc += `M${P(cx - w / 2 - 4, y)}l${f(w + 8)} 11`;
      t += k.line(sc, .7);
      t += k.line(`M${P(cx, top)}v-30M${P(cx, top - 2)}L${P(cx + 24, top - 26)}M${P(cx, top - 30)}L${P(cx + 24, top - 26)}M${P(cx + 24, top - 26)}v14`, 1.1) + k.shape(k.rect(cx + 21, top - 12, 6, 5), 'black', { w: .4 });
      return t;
    };
    // portals and gables first, then the towers over their edges
    const portal = (x0, x1, h, gh) => {
      const xc = (x0 + x1) / 2, w = x1 - x0;
      // the gable: rounded masses of carved stone, as if dripping
      let d = `M${P(x0 - 6, base - h + 12)}`;
      const n = 6;
      for (let i = 0; i < n; i++) { const xa = x0 - 6 + (w + 12) * (i + 1) / n, ya = base - h + 12 - gh * Math.sin((i + 1) / n * Math.PI) * .9; d += `Q${P(xa - (w + 12) / n / 2, ya - 12)} ${P(xa, ya)}`; }
      d += `L${P(x1 + 6, base)}H${f(x0 - 6)}Z`;
      let o = k.shape(d, 'light', { w: 1.2 });
      let drip = '';
      for (let i = 0; i < 9; i++) { const x = x0 + w * (i + .5) / 9, y = base - h - gh * .3 * Math.sin((i + .5) / 9 * Math.PI); drip += `M${P(x, y)}q-2 6 0 ${f(8 + r() * 6)}q2 -6 0 ${f(-8 - r() * 6)}`; }
      o += k.shape(drip, 'mid', { w: .6 });
      o += k.shape(`M${P(x0 + w * .16, base)}V${f(base - h * .62)}Q${P(xc, base - h * 1.18)} ${P(x1 - w * .16, base - h * .62)}V${f(base)}Z`, 'black', { w: 1 });
      o += k.line(`M${P(xc, base)}V${f(base - h * .72)}`, 1.2, { color: k.paper }) + k.shape(k.rect(xc - 2.5, base - h * .5, 5, 7), 'light', { w: .5 });
      return o;
    };
    fa += portal(190, 220, 58, 20) + portal(320, 350, 58, 20);
    fa += portal(240, 300, 86, 36);
    fa += k.tree(270, 116, 1.9, 'cypress') + `<circle cx="270" cy="38" r="2" fill="${k.ink}"/>`;
    fa += k.shape(k.rect(184, base - 6, 172, 6), 'dark', { w: .7 });
    fa += tower(182, 22, 80) + tower(358, 22, 88) + tower(230, 26, 40) + tower(310, 26, 50);
    s += fa;

    // ---- Gaudí's school with its wave roof; palms
    let sc = k.shape(k.rect(464, 184, 92, 20), 'light', { w: 1 }) + k.windows(468, 188, 84, 12, 7, 1, { lit: .5, ww: .5 });
    let wave = `M${P(462, 184)}`;
    for (let i = 0; i < 6; i++) wave += `q8 ${i % 2 ? 6 : -6} 16 0`;
    sc += k.shape(wave + `L${P(558, 178)}L${P(462, 178)}Z`, 'dark', { w: 1 });
    s += sc;
    s += k.tree(586, 206, 2.4, 'palm') + k.tree(618, 210, 2, 'palm') + k.tree(430, 206, 1.7, 'palm');

    // ---- the lot: dust and ruts, stone blocks with hard black shadows, a mason's shed, a mule cart, workmen
    let g = k.shape(k.rect(-5, 204, 650, 41), 'paper', { w: 0 }) + k.line('M-5 204H645', 1.3);
    let ruts = '';
    for (let i = 0; i < 44; i++) { const y = 208 + r() * 30, x = r() * 640; ruts += `M${P(x, y)}h${f(4 + r() * 14 * (y - 200) / 22)}`; }
    g += k.line(ruts, .55);
    g += k.shape('M-5 214Q120 208 240 216T520 212T645 220V226Q500 220 380 228T120 222T-5 230Z', 'stipple', { w: 0, op: .6 });
    // the mason's shed
    g += k.shape('M24 236V214L96 206V236Z', 'dark', { w: 1 }) + k.shape('M18 216L100 204L102 208L20 220Z', 'mid', { w: .9 }) + k.shape(k.rect(36, 222, 16, 14), 'black', { w: .5 }) + k.windows(62, 218, 22, 8, 2, 1, { lit: 1, ww: .6, wh: .8 });
    // stone blocks and their shadows
    for (const [x, y, w, h] of [[120, 228, 28, 12], [154, 232, 22, 10], [138, 218, 20, 10], [372, 230, 26, 12], [400, 234, 18, 9], [520, 236, 30, 12]]) {
      g += k.shape(`M${P(x + w, y)}l${f(w * .8)} 3l-2 2.4l${f(-w * .8)} -2Z`, 'black', { w: 0, op: .75 });
      g += k.shape(k.rect(x, y - h, w, h), 'light', { w: 1 }) + k.shape(k.rect(x + w * .7, y - h, w * .3, h), 'dark', { w: .5 }) + k.line(`M${P(x - 1, y - h)}l3 -3h${f(w)}l-2 3`, .8);
    }
    // the mule cart with a block of stone
    const cx = 236, cy = 236;
    g += `<circle cx="${cx}" cy="${cy - 12}" r="12" fill="none" stroke="${k.ink}" stroke-width="1.8"/>`;
    let spk = '';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 6; spk += `M${P(cx - Math.cos(a) * 12, cy - 12 - Math.sin(a) * 12)}L${P(cx + Math.cos(a) * 12, cy - 12 + Math.sin(a) * 12)}`; }
    g += k.line(spk, .7) + k.shape(`M${P(cx - 24, cy - 22)}h52l4 -3h12l-1 3h-12l-4 2h-51Z`, 'dark', { w: .8 }) + k.shape(k.rect(cx - 18, cy - 38, 34, 16), 'light', { w: 1 }) + k.shape(k.rect(cx + 8, cy - 38, 8, 16), 'dark', { w: .4 });
    g += horse(cx + 56, cy, 1.4, 1, 'dark', true) + k.figure(cx + 82, cy + 2, 1.5, 'man');
    // workmen, a priest of the expiatory temple, a lady under her parasol
    g += k.figure(186, 236, 1.5, 'porter') + k.figure(330, 238, 1.55, 'porter') + k.figure(352, 236, 1.45, 'man') + k.line('M358 216l7 -8', 1.6);
    g += k.figure(458, 236, 1.5, 'priest') + k.figure(560, 238, 1.6, 'woman') + k.shape('M548 202q12 -11 24 0Z', 'light', { w: .8 }) + k.line('M560 202v14', .8);
    let sh = '';
    for (const [x, y, sc2] of [[186, 236, 1.5], [330, 238, 1.55], [352, 236, 1.45], [458, 236, 1.5], [560, 238, 1.6], [318, 238, 1.5]]) sh += `M${P(x, y)}l${f(18 * sc2)} 2l-2 1.6l${f(-17 * sc2)} -1.8Z`;
    g += k.shape(sh, 'black', { w: 0, op: .7 });
    s += g;
    return s;
  },
};
