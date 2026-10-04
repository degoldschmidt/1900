// Sarajevo: from the stones of the shallow Miljacka, looking upriver between its quays to the Latin Bridge,
// hump-backed, with its round eyes. On the Appel Quay at the right, the corner where the shots were fired;
// beyond, minarets and leaded domes climb a valley ringed by mountains.

export default {
  id: 'SAR',
  draw(k) {
    const f = k.f, r = k.rng(28);
    const deck = 168, river = 186;

    // ---------- the mountains ringing the valley ----------
    // rounded wooded ridges, the far one pale, Trebević darker on the right
    let far = k.shape('M-5 96C40 80 90 70 150 78S250 96 320 92S440 62 520 58S610 66 645 60V160H-5Z', 'light', { far: true, w: .6 });
    for (let i = 0; i < 22; i++) { const x = r() * 640, y = 84 + r() * 30; far += k.line(`M${f(x)} ${f(y)}q4 -2 8 0`, .5, { far: true }); }
    far += k.shape(`M-5 150C40 116 90 104 150 112S240 132 300 140V176H-5Z`, 'stipple', { far: true, w: .6 });
    far += k.shape(`M340 140C400 120 470 98 540 96S620 104 645 100V176H340Z`, 'stipple', { far: true, w: .6 });
    // houses dotted up the slopes, white walls under red-tile roofs, with poplars and cypresses
    const dots = [[20, 136], [44, 128], [70, 122], [96, 118], [120, 120], [34, 148], [62, 142], [88, 138], [112, 134], [140, 130], [164, 132], [190, 138],
      [380, 126], [408, 116], [436, 108], [466, 104], [496, 102], [528, 100], [560, 102], [590, 104], [620, 102], [396, 140], [424, 132], [452, 124], [484, 120], [514, 118], [546, 118], [576, 120], [606, 118]];
    for (const [x, y] of dots) far += k.building(x, y + 10, 11 + r() * 6, 8 + r() * 4, { far: true, roof: 'pitch', rh: 6, windows: false });
    for (let i = 0; i < 10; i++) far += k.tree(10 + r() * 620, 130 + r() * 30, .5, r() < .5 ? 'poplar' : 'cypress');
    far += k.smoke(70, 118, .5, { seed: 4 }) + k.smoke(452, 100, .5, { seed: 8 }) + k.smoke(560, 96, .45, { seed: 15 });
    far += k.haze(130, 40, .3);

    // ---------- the town on the valley floor: domes and minarets ----------
    const minaret = (cx, by, w, h, far) => k.shape(k.rect(cx - w / 2, by - h, w, h), 'paper', { w: far ? .5 : .8, far }) + k.shape(k.rect(cx + w * .1, by - h, w * .4, h), 'vert', { w: 0, far })
      + k.shape(k.rect(cx - w, by - h * .74, w * 2, 2.6), 'light', { w: .6, far }) + k.shape(k.spire(cx, by - h, w * 1.2, h * .2), 'dark', { w: .6, far }) + k.line(`M${f(cx)} ${f(by - h * 1.2)}v-3`, .6, { far });
    const mosque = (cx, by, w, dr, far) => {
      let s = k.shape(k.rect(cx - w / 2, by - 16, w, 16), 'light', { w: far ? .5 : .9, far }) + k.shape(k.rect(cx + w / 2 - 8, by - 16, 8, 16), 'mid', { w: 0, far });
      s += k.shape(k.rect(cx - dr * .9, by - 22, dr * 1.8, 6), 'light', { w: .7, far });
      s += k.shape(k.dome(cx, by - 22, dr, dr * .85), 'dark', { w: far ? .6 : 1, far }) + k.shape(`M${f(cx - dr * .8)} ${f(by - 24)}Q${f(cx - dr * .7)} ${f(by - 22 - dr * .7)} ${f(cx - dr * .1)} ${f(by - 22 - dr * .85)}Q${f(cx - dr * .5)} ${f(by - 22 - dr * .5)} ${f(cx - dr * .55)} ${f(by - 24)}Z`, 'light', { w: 0, far });
      s += k.line(`M${cx} ${f(by - 22 - dr * .85)}v-6`, .7, { far });
      return s + k.shape(`M${f(cx - w / 2 - 12)} ${by}v-10l6 -4l6 4v10Z`, 'light', { w: .6, far }) + k.windows(cx - w / 2 + 3, by - 13, w - 14, 8, Math.round(w / 9), 1, { arched: true, far, lit: .3 });
    };
    let town = k.skyline(-5, 645, 176, { seed: 19, style: 'south', hMin: 10, hMax: 22, wMin: 12, wMax: 22, far: true });
    town += minaret(92, 166, 4, 84, true) + minaret(560, 166, 4, 90, true) + minaret(612, 168, 3.5, 70, true);
    town += mosque(468, 172, 54, 20, true);
    // the Gazi Husrev-beg's great dome, the Emperor's mosque, their tall white minarets
    town += mosque(232, 174, 76, 30) + minaret(282, 176, 6, 122) + minaret(178, 176, 5, 98);
    town += minaret(424, 174, 5, 106) + minaret(340, 172, 4.4, 84);
    // the clock tower, square and plain
    town += k.shape(k.rect(374, 92, 12, 82), 'light', { w: .8 }) + k.shape(k.rect(381, 92, 5, 82), 'dark', { w: 0 }) + k.shape(k.rect(372, 82, 16, 12), 'light', { w: .8 })
      + `<circle cx="380" cy="88" r="4" fill="${k.paper}" stroke="${k.ink}" stroke-width=".6"/>` + k.shape(k.spire(380, 82, 18, 14), 'dark', { w: .8 });

    // ---------- the quays receding to the bridge ----------
    const lq = k.shape(`M-5 200L178 ${river - 2}L178 ${river + 2}L-5 222Z`, 'vert', { w: 1 }) + k.shape(`M-5 200L178 ${river - 2}V178L-5 186Z`, 'light', { w: .9 });
    const rq = k.shape(`M645 196L462 ${river - 2}L462 ${river + 2}L645 216Z`, 'dark', { w: 1 }) + k.shape(`M645 196L462 ${river - 2}V178L645 184Z`, 'light', { w: .9 });
    // houses along the left quay; on the right the corner building, plane trees, a motor car waiting
    let quays = lq + rq;
    for (const [x, by, w, h] of [[-6, 186, 36, 50], [30, 184, 30, 44], [60, 182, 32, 40], [92, 181, 28, 34], [120, 180, 30, 30], [150, 179, 24, 24]]) quays += k.building(x, by, w, h, { tone: x < 60 ? 'light' : 'mid', roof: 'pitch', lit: .4 });
    for (const x of [16, 74, 132]) quays += k.lamp(x, 186 - x * .08, .9);
    const corner = (() => {
      let s = k.building(470, 180, 46, 40, { tone: 'light', roof: 'pitch', floors: 2, cols: 4, lit: .5 });
      s += k.shape(k.poly([[472, 166], [514, 166], [518, 172], [468, 172]]), 'dark', { w: .6 }); // the shop's awning
      s += k.building(516, 182, 40, 46, { tone: 'mid', roof: 'pitch', lit: .4 }) + k.building(556, 184, 46, 50, { tone: 'light', roof: 'mansard', lit: .4 }) + k.building(602, 186, 46, 56, { tone: 'mid', roof: 'pitch', lit: .4 });
      for (const x of [534, 584, 630]) s += k.tree(x, 190, 1.3, 'round');
      // a touring car, hood down, its driver waiting
      s += k.shape('M490 192h28q4 0 5 -4h6l2 4h4v4h-46Z', 'black', { w: .6 }) + k.shape('M498 188h14v-4h-12Z', 'mid', { w: .5 });
      s += `<circle cx="495" cy="196" r="3.4" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.2"/><circle cx="528" cy="196" r="3.4" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.2"/>`;
      return s + k.figure(546, 194, .8, 'soldier') + k.figure(462, 180, .7, 'man');
    })();
    quays += corner;

    // ---------- the Latin Bridge ----------
    const bridge = (() => {
      const x0 = 172, x1 = 468, mid = (x0 + x1) / 2;
      const dy = (x) => deck - 15 * (1 - Math.pow((x - mid) / ((x1 - x0) / 2), 2)); // the hump
      let top = `M${x0} ${f(dy(x0))}`;
      for (let x = x0 + 12; x <= x1; x += 12) top += `L${x} ${f(dy(x))}`;
      // four arches, the two in the middle wider; between them the piers and their round eyes
      const arches = [[x0 + 10, 58], [x0 + 80, 64], [x0 + 154, 64], [x0 + 228, 58]];
      let d = top + `L${x1} ${river + 2}`;
      for (let i = arches.length - 1; i >= 0; i--) { const [a, w] = arches[i]; d += `L${a + w} ${river + 2}C${a + w} ${f(dy(a + w / 2) + 5)} ${a} ${f(dy(a + w / 2) + 5)} ${a} ${river + 2}`; }
      d += `L${x0} ${river + 2}Z`;
      let s = k.shape(d, 'light', { w: 1.2 });
      for (const [a, w] of arches) s += k.shape(`M${a} ${river + 2}C${a} ${f(dy(a + w / 2) + 5)} ${a + w} ${f(dy(a + w / 2) + 5)} ${a + w} ${river + 2}Z`, 'black', { w: .8 });
      for (const [a, w] of arches.slice(1)) { const ex = a - 8; s += `<circle cx="${ex}" cy="${f(dy(ex) + 11)}" r="5.4" fill="url(#black-${k.uid})" stroke="${k.ink}" stroke-width=".8"/>`; }
      // the voussoirs round each arch, the parapet
      for (const [a, w] of arches) s += k.line(`M${a - 3} ${river + 2}C${a - 3} ${f(dy(a + w / 2) - 1)} ${a + w + 3} ${f(dy(a + w / 2) - 1)} ${a + w + 3} ${river + 2}`, .5);
      s += k.shape(top + `L${x1} ${f(dy(x1) + 4)}` + (() => { let b = ''; for (let x = x1; x >= x0; x -= 12) b += `L${x} ${f(dy(x) + 4)}`; return b; })() + 'Z', 'mid', { w: .7 });
      s += k.figure(268, f(dy(268)), .7, 'man') + k.figure(280, f(dy(280)), .68, 'woman') + k.figure(392, f(dy(392)), .7, 'porter');
      return s;
    })();

    // ---------- the river ----------
    let water = k.shape(`M178 ${river}L462 ${river}L645 216V245H-5V222Z`, 'water', { w: 0 }) + k.line(`M178 ${river}H462`, 1);
    water += k.reflect(`<g>${bridge}</g>`, river + 2, .2);
    for (let i = 0; i < 10; i++) { const y = river + 6 + i * 5, x = 320 - (60 + i * 26) * r(); water += k.line(`M${f(x)} ${f(y)}h${f(20 + i * 6)}`, .5 + i * .05); }
    // the stony bed in the foreground, a fisherman on the stones
    let stones = '';
    for (let i = 0; i < 18; i++) {
      const x = r() * 640, y = 212 + r() * 28, w = 8 + r() * 14 + (y - 212) * .5;
      stones += k.shape(`M${f(x - w / 2)} ${f(y)}q${f(w * .1)} ${f(-w * .45)} ${f(w / 2)} ${f(-w * .45)}q${f(w * .4)} 0 ${f(w / 2)} ${f(w * .45)}Z`, 'paper', { w: .8 }) + k.shape(`M${f(x - w * .1)} ${f(y)}q${f(w * .4)} ${f(-w * .25)} ${f(w * .55)} ${f(-w * .12)}l${f(-w * .05)} ${f(w * .12)}Z`, 'dark', { w: 0 });
    }
    stones += k.shape('M60 240q30 -16 90 -14q50 2 70 14Z', 'stipple', { w: .9 }) + k.figure(118, 230, 1.3, 'porter') + k.line('M124 210q34 -14 62 4', .9) + k.line('M186 214v14', .5);

    // the near bank in shadow at the bottom left, the river darkening toward us
    let near = k.shape('M-5 226Q40 220 80 228Q110 236 120 245H-5Z', 'dark', { w: .9 }) + k.shape('M300 245Q420 230 645 236V245Z', 'mid', { w: 0, op: .7 });
    for (let i = 0; i < 12; i++) { const x = r() * 110, y = 222 + r() * 6; near += k.line(`M${f(x)} ${f(y + 4)}q${f(-1 + r() * 2)} -5 ${f(-2 + r() * 4)} -9`, .6); }
    return far + town + quays + bridge + water + near + stones;
  },
};
