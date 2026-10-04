// Lisbon: low tide on the beach at Belém. The Belém Tower stands in the Tagus left of centre: its bastion with gun ports at
// the waterline, shield merlons and ribbed sentry domes, the tower behind with its loggia. Across the wide river,
// fragatas under brown sails, a liner smoking toward the bar, the low hills of the south bank. On the wet sand,
// a crescent-prowed fishing boat, men hauling a net, varinas with baskets on their heads.

export default {
  id: 'LIS',
  draw(k) {
    const f = k.f, r = k.rng(97);
    const P = (x, y) => `${f(x)} ${f(y)}`;

    // ---- the south bank, low and far; a liner and its smoke; the estuary
    let s = k.shape('M-5 174Q80 166 160 170T340 164T500 168T645 162V176H-5Z', 'stipple', { far: true, w: .6 });
    s += k.skyline(380, 560, 175, { seed: 98, hMin: 4, hMax: 9, wMin: 8, wMax: 14, style: 'south', lit: .3, chimneys: false });
    for (const [x, h] of [[420, 30], [446, 22], [596, 26]]) s += k.shape(k.poly([[x - 2.4, 175], [x - 1.4, 175 - h], [x + 1.4, 175 - h], [x + 2.4, 175]]), 'dark', { far: true, w: .5 }) + k.smoke(x, 174 - h, .9, { seed: x });
    s += k.haze(150, 28, .35);
    const WY = 176;
    s += k.water(WY, 240, { seed: 21 });
    let rip = '';
    for (let y = WY + 4; y < 214; y += 2.6) for (let x = -5 + r() * 30; x < 645;) { const l = 8 + r() * 40 * (y - WY) / 30; rip += `M${P(x, y)}h${f(l)}`; x += l + 6 + r() * 26; }
    s += k.line(rip, .45) + k.boat(560, 184, .6, 'liner', -1);

    // fragatas: Tagus sailing barges, a big tanned gaff sail and a jib
    const fragata = (x, y, sc, dir = 1) => {
      const D = (n) => f(n * sc * dir), S = (n) => f(n * sc);
      let o = k.shape(`M${P(x - 18 * sc * dir, y - 5 * sc)}h${D(36)}q${D(-2)} ${S(5)} ${D(-8)} ${S(6)}h${D(-22)}q${D(-4)} ${S(-2)} ${D(-6)} ${S(-6)}Z`, 'black', { w: .6 });
      o += k.line(`M${P(x - 2 * sc * dir, y - 5 * sc)}v${S(-44)}`, f(1.1 * sc));
      o += k.shape(`M${P(x - 1 * sc * dir, y - 8 * sc)}l${D(-1)} ${S(-30)}l${D(-22)} ${S(-6)}l${D(-6)} ${S(34)}Z`, 'mid', { w: .7 });
      o += k.shape(`M${P(x - 1 * sc * dir, y - 46 * sc)}l${D(14)} ${S(40)}l${D(-14)} ${S(-2)}Z`, 'light', { w: .6 });
      return o;
    };
    s += fragata(420, 196, 1, -1) + fragata(510, 190, .7, 1) + fragata(610, 200, 1.15, -1) + fragata(345, 186, .5, 1);

    // ---- the Belém Tower
    const sentry = (x, y, sc = 1) => { // a ribbed dome on a corbelled drum
      let o = k.shape(`M${P(x - 4 * sc, y)}l${f(4 * sc)} ${f(5 * sc)}l${f(4 * sc)} ${f(-5 * sc)}Z`, 'mid', { w: .6 });
      o += k.shape(k.rect(x - 4 * sc, y - 9 * sc, 8 * sc, 9 * sc), 'light', { w: .8 }) + k.shape(k.rect(x + 1 * sc, y - 9 * sc, 3 * sc, 9 * sc), 'dark', { w: 0 }) + k.shape(k.rect(x - 1.2 * sc, y - 7 * sc, 2.4 * sc, 4 * sc), 'black', { w: 0 });
      o += k.shape(`M${P(x - 4.6 * sc, y - 9 * sc)}q0 ${f(-7 * sc)} ${f(4.6 * sc)} ${f(-8 * sc)}q${f(4.6 * sc)} ${f(1 * sc)} ${f(4.6 * sc)} ${f(8 * sc)}Z`, 'light', { w: .8 });
      o += k.line(`M${P(x - 2 * sc, y - 9 * sc)}q0 -4 2 ${f(-7.6 * sc)}M${P(x + 2 * sc, y - 9 * sc)}q0 -4 -2 ${f(-7.6 * sc)}`, .5) + k.line(`M${P(x, y - 17 * sc)}v${f(-3 * sc)}`, .8);
      return o;
    };
    const merlons = (x0, x1, y, h = 5, step = 6) => { let d = ''; for (let x = x0 + 1; x < x1 - 3; x += step) d += `M${P(x, y)}v${f(-h)}q2 -2.6 4 0v${f(h)}Z`; return k.shape(d, 'light', { w: .6 }); };
    const tx = 190, tw = 54, tt = 52, tb = 150;
    const n0 = k.lights.length, ox = 224, oy = WY + 2, sc = 1.15; // the tower is drawn at its own size, then brought nearer
    let t = '';
    // the tower: front face in light, the east face in shade, the loggia, the arms, the crown of merlons and sentry domes
    t += k.shape(k.rect(tx, tt, tw, tb - tt), 'light', { w: 1.4 }) + k.shape(k.poly([[tx + tw, tt], [tx + tw + 14, tt - 4], [tx + tw + 14, tb - 4], [tx + tw, tb]]), 'dark', { w: 1 });
    t += k.shape(k.rect(tx - 3, tt - 3, tw + 6, 3), 'vert', { w: .8 }) + merlons(tx - 3, tx + tw + 3, tt - 3, 6, 6.4) + k.shape(k.poly([[tx + tw + 3, tt - 3], [tx + tw + 15, tt - 7], [tx + tw + 15, tt - 13], [tx + tw + 3, tt - 9]]), 'dark', { w: .6 });
    t += sentry(tx, tt - 2, 1.2) + sentry(tx + tw, tt - 2, 1.2) + sentry(tx + tw + 14, tt - 6, .9);
    t += k.shape(k.rect(tx + 3, 114, tw - 6, 5), 'dark', { w: .8 }) + k.shape(k.rect(tx + 3, 100, tw - 6, 3), 'mid', { w: .6 });
    for (let i = 0; i < 7; i++) t += k.shape(k.arch(tx + 5.5 + i * 6.6, 103, 4.6, 11), 'black', { w: .5 }); // the loggia's arcade
    t += k.shape(k.arch(tx + 15, 70, 9, 18), 'black', { w: .6 }) + k.shape(k.arch(tx + 30, 70, 9, 18), 'black', { w: .6 }) + k.shape(k.rect(tx + 13, 88, 28, 3), 'dark', { w: .6 });
    t += `<circle cx="${f(tx + tw / 2)}" cy="62" r="3.4" fill="none" stroke="${k.ink}" stroke-width=".8"/>` + k.line(`M${P(tx + tw / 2 - 3.4, 62)}h6.8M${P(tx + tw / 2, 58.6)}v6.8`, .5);
    t += k.shape(k.arch(tx + 21, 128, 10, 22), 'black', { w: .7 }) + k.line(`M${P(tx, 98)}h${f(tw)}M${P(tx, 124)}h${f(tw)}`, .7);
    t += k.windows(tx + 7, 128, 10, 14, 1, 1, { lit: .9, ww: .6 }) + k.windows(tx + 36, 128, 10, 14, 1, 1, { lit: .9, ww: .6 });
    // the bastion in front: a broad platform on the water, gun ports, parapet of shields, sentry domes at its corners
    const bx = 156, bw = 134, bt = 148;
    t += k.shape(k.poly([[bx, WY + 2], [bx, bt], [bx + bw, bt], [bx + bw, WY + 2]]), 'light', { w: 1.4 }) + k.shape(k.poly([[bx + bw, bt], [bx + bw + 18, bt - 4], [bx + bw + 18, WY - 1], [bx + bw, WY + 2]]), 'dark', { w: 1 });
    t += k.shape(k.rect(bx, WY - 6, bw, 8), 'mid', { w: .8 }); // the weed-dark waterline
    for (let i = 0; i < 8; i++) t += k.shape(k.arch(bx + 8 + i * 15.8, WY - 20, 7, 12), 'black', { w: .6 });
    t += k.line(`M${P(bx, bt + 8)}h${f(bw)}`, .9) + k.shape(k.rect(bx - 2, bt - 2, bw + 4, 4), 'vert', { w: .9 });
    t += merlons(bx - 2, bx + bw + 2, bt - 2, 7, 7.4) + k.shape(k.poly([[bx + bw + 2, bt - 2], [bx + bw + 19, bt - 6], [bx + bw + 19, bt - 13], [bx + bw + 2, bt - 9]]), 'dark', { w: .6 });
    t += sentry(bx, bt - 1, 1.4) + sentry(bx + bw, bt - 1, 1.4) + sentry(bx + bw + 18, bt - 5, 1);
    const near = (svg) => `<g transform="translate(${ox} ${oy}) scale(${sc}) translate(${-ox} ${-oy})">${svg}</g>`;
    s += near(t);
    k.lights = k.lights.map((l, i) => i < n0 ? l : [f(ox + (l[0] - ox) * sc), f(oy + (l[1] - oy) * sc), f(l[2] * sc), f(l[3] * sc)]);
    // its reflection, broken by the ripples
    s += k.reflect(near(`<path d="M${bx} ${WY}V${bt}H${bx + bw}V${WY}Z" fill="url(#vert-${k.uid})"/><path d="M${tx} ${bt}V${tt}H${tx + tw}V${bt}Z" fill="url(#mid-${k.uid})"/>`), WY + 2, .3);
    let gl = '';
    for (let i = 0; i < 12; i++) { const y = WY + 6 + i * 4.2, x = 130 + r() * 180; gl += `M${P(x, y)}h${f(10 + r() * 30)}`; }
    s += k.line(gl, 1.2, { color: k.paper });
    s += k.shape(`M${P(ox + (bx + bw + 18 - ox) * sc, WY)}L${P(ox + (bx + bw + 18 - ox) * sc + 70, WY + 8)}L${P(ox + (bx + bw + 18 - ox) * sc + 64, WY + 14)}L${P(ox + (bx + bw - ox) * sc, WY + 6)}Z`, 'dark', { w: 0, op: .7 });
    // a rowing boat by the tower
    s += k.shape('M318 196q20 4 40 0l-4 4h-32Z', 'black', { w: .6 }) + k.figure(336, 197, .7, 'man');

    // ---- the beach at low tide: wet sand, the crescent-prowed boat, the net haulers, the varinas
    const BY = 212;
    let b = k.shape(`M-5 ${BY + 4}Q160 ${BY - 4} 340 ${BY}T645 ${BY + 2}V245H-5Z`, 'paper', { w: 1.2 });
    b += k.shape(`M-5 ${BY + 8}Q160 ${BY} 340 ${BY + 4}T645 ${BY + 6}V${BY + 12}Q480 ${BY + 8} 300 ${BY + 12}T-5 ${BY + 14}Z`, 'horiz', { w: 0 });
    b += k.shape(`M-5 ${BY + 4}Q160 ${BY - 4} 340 ${BY}T645 ${BY + 2}V${BY + 6}Q480 ${BY + 4} 340 ${BY + 4}T-5 ${BY + 8}Z`, 'glass', { w: 0, far: true });
    let sand = '';
    for (let i = 0; i < 40; i++) { const y = BY + 12 + r() * 26, x = r() * 640; sand += `M${P(x, y)}q${f(3 + r() * 4)} -1.2 ${f(7 + r() * 9)} 0`; }
    b += k.line(sand, .5);
    // the boat: a black crescent, its prow swept high, an eye on the bow
    b += k.shape('M60 228Q110 240 170 228L186 196L180 196L168 220Q110 230 66 222L52 206L48 208Z', 'black', { w: .8 }) + k.line('M66 224Q110 232 168 222', .8, { color: k.paper });
    b += `<circle cx="174" cy="214" r="1.6" fill="${k.paper}"/>` + k.line('M112 228V190M112 192l20 30', 1.2);
    // men hauling the net up the sand, the rope running to the water
    b += k.line('M262 236L420 210', 1, {}) + k.figure(300, 234, 1.6, 'man') + k.figure(326, 230, 1.5, 'man') + k.figure(350, 226, 1.4, 'porter');
    let net = '';
    for (let i = 0; i < 6; i++) net += `M${P(250 + i * 4, 236)}l-8 4`;
    b += k.shape('M226 240q14 -10 34 -6l-2 8Z', 'dark', { w: .6 }) + k.line(net, .5);
    // varinas: barefoot fishwives with flat baskets on their heads
    for (const [x, y, sc] of [[470, 236, 1.6], [500, 232, 1.45], [600, 238, 1.6]]) {
      b += k.figure(x, y, sc, 'woman') + k.shape(`M${P(x - 9 * sc, y - 24 * sc)}h${f(18 * sc)}l-2 ${f(-3 * sc)}h${f(-14 * sc)}Z`, 'dark', { w: .7 });
      b += k.shape(`M${P(x - 5 * sc, y - 27 * sc)}q${f(5 * sc)} -4 ${f(10 * sc)} 0Z`, 'mid', { w: .5 });
    }
    // an anchor and a coil of rope, a gull or two
    b += k.line('M420 236v-12M414 230h12M413 236q7 6 14 0', 1.3) + `<ellipse cx="440" cy="234" rx="7" ry="2.4" fill="none" stroke="${k.ink}" stroke-width="1"/>`;
    b += k.line('M380 120q4 -4 8 0q4 -4 8 0M420 96q3 -3 6 0q3 -3 6 0', .9);
    // shadows thrown to the right
    let sh = '';
    for (const [x, y, sc] of [[300, 234, 1.6], [326, 230, 1.5], [350, 226, 1.4], [470, 236, 1.6], [500, 232, 1.45], [600, 238, 1.6]]) sh += `M${P(x, y)}l${f(17 * sc)} 2l-2 1.6l${f(-16 * sc)} -1.8Z`;
    b += k.shape(sh, 'black', { w: 0, op: .65 });
    s += b;
    return s;
  },
};
