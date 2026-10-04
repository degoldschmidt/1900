// Belgrade: from the Austrian bank at Semlin, across the Sava. The Kalemegdan fortress crowns its bluff above the
// meeting of the Sava and the Danube, bastions stepping down to the Nebojša tower at the water; the city runs
// along the ridge to the cathedral spire. An Austrian monitor lies in the Danube; a sentry watches from the reeds.

export default {
  id: 'BEG',
  draw(k) {
    const f = k.f, r = k.rng(64);
    const water = 180;

    // ---------- far: the Danube, the War Island, the Banat plain ----------
    let far = k.shape(`M-5 ${water - 12}H140V${water}H-5Z`, 'horiz', { far: true, w: 0 }) + k.line(`M-5 ${water - 12}H150`, .6, { far: true });
    far += k.shape(`M-5 ${water - 12}Q30 ${water - 22} 70 ${water - 18}T130 ${water - 12}Z`, 'stipple', { far: true, w: .5 });
    far += k.shape(k.rect(30, water - 9, 2, 6), 'black', { far: true, w: 0 }); // a distant chimney on the plain
    // the monitor: a low armoured hull, a turret, a funnel smoking
    const monitor = (x, y, s) => k.shape(`M${f(x - 30 * s)} ${f(y - 4 * s)}h${f(62 * s)}l${f(-4 * s)} ${f(4 * s)}h${f(-54 * s)}Z`, 'black', { w: .6 })
      + k.shape(k.rect(x - 12 * s, y - 9 * s, 20 * s, 5 * s), 'dark', { w: .5 }) + k.shape(`M${f(x - 26 * s)} ${f(y - 4 * s)}v${f(-4 * s)}h${f(9 * s)}v${f(4 * s)}Z`, 'dark', { w: .5 })
      + k.line(`M${f(x - 22 * s)} ${f(y - 6 * s)}h${f(-10 * s)}`, 1.2 * s) + k.shape(k.rect(x + 2 * s, y - 18 * s, 3.6 * s, 9 * s), 'black', { w: .4 })
      + k.line(`M${f(x - 4 * s)} ${f(y - 9 * s)}v${f(-14 * s)}`, .6) + k.flag(x + 30 * s, y - 4 * s, .45 * s) + k.smoke(x + 3.8 * s, y - 19 * s, .7 * s, { seed: 3 });
    far += monitor(56, water + 2, .9) + k.haze(water - 30, 28, .35);

    // ---------- the ridge, the city along it ----------
    const ridge = k.shape(`M86 ${water}C100 160 116 130 140 108C160 92 200 84 260 84S330 90 360 100S460 108 520 112S600 116 645 114V${water}Z`, 'stipple', { w: 1 });
    let city = k.skyline(330, 645, 118, { seed: 6, style: 'east', far: true, hMin: 10, hMax: 24, wMin: 12, wMax: 22 });
    // the cathedral: a baroque tower with a tall needle spire
    city += k.shape(k.rect(408, 56, 16, 64), 'light', { w: .9 }) + k.shape(k.rect(418, 56, 6, 64), 'dark', { w: 0 }) + k.windows(410, 62, 8, 40, 1, 3, { arched: true, ww: .6 });
    city += k.shape(`M406 56q10 -12 20 0Z`, 'dark', { w: .8 }) + k.shape(k.rect(412, 36, 8, 16), 'light', { w: .7 }) + k.shape(k.spire(416, 36, 10, 30), 'dark', { w: .8 }) + k.line('M416 6v-4M413 4h6', .7);
    city += k.shape(k.rect(424, 92, 40, 28), 'light', { w: .8 }) + k.shape(k.gable(424, 92, 40, 10), 'tiles', { w: .7 });
    // the Bajrakli minaret, the palace dome beyond
    city += k.shape(k.rect(482, 66, 4, 52), 'paper', { w: .7 }) + k.shape(k.rect(479, 80, 10, 2.4), 'dark', { w: .5 }) + k.shape(k.spire(484, 66, 5, 12), 'dark', { w: .6 });
    city += k.shape(k.rect(548, 96, 42, 22), 'light', { w: .5, far: true }) + k.shape(k.dome(569, 96, 12, 12), 'mid', { w: .6, far: true }) + k.shape(k.onion(569, 84, 8, 10), 'dark', { w: .5, far: true });
    // Savamala: houses and warehouses stepping down to the Sava, chimneys smoking
    let slope = '';
    for (const [x, by, w, h, tone] of [[340, 150, 30, 26, 'light'], [372, 154, 26, 24, 'mid'], [400, 150, 34, 28, 'light'], [436, 156, 30, 24, 'mid'], [470, 152, 28, 30, 'light'], [500, 158, 36, 26, 'mid'], [538, 154, 30, 30, 'light'],
      [330, 178, 40, 22, 'dark'], [372, 178, 34, 26, 'mid'], [408, 178, 44, 24, 'dark'], [454, 178, 30, 28, 'light'], [486, 178, 50, 22, 'dark'], [538, 178, 36, 26, 'mid'], [576, 178, 40, 30, 'light'], [618, 178, 30, 24, 'mid']]) slope += k.building(x, by, w, h, { tone, roof: by > 170 ? 'pitch' : 'gable', lit: .35, rh: 8 });
    for (const [x, y] of [[396, 124], [560, 130], [470, 150]]) slope += k.tree(x, y + 14, .9, 'round');
    slope += k.smoke(414, 146, .7, { seed: 7 }) + k.smoke(500, 150, .8, { seed: 2 }) + k.shape(k.rect(498, 136, 4, 16), 'black', { w: .4 });
    // the railway bridge to Semlin, low over the Sava at the right
    slope += k.bridge(560, 650, water - 4, { kind: 'girder', arches: 2, rise: 12, h: 8, far: true });

    // ---------- the fortress ----------
    const fort = (() => {
      let s = '';
      // the park's trees on the plateau behind the walls
      for (const x of [178, 206, 300, 328, 352]) s += k.tree(x, 98, 1.1, 'round');
      // upper walls along the plateau edge: a recessed curtain in shade, bastions thrust forward, lit on the west
      const wallTop = 98;
      const base = (x) => 128 + (x < 170 ? (170 - x) * .5 : 0);
      s += k.shape(`M134 ${base(134) + 8}L140 ${wallTop}H372L376 ${base(376)}Z`, 'mid', { w: 1.2 });
      for (let x = 146; x < 372; x += 9) s += k.line(`M${x} ${wallTop + 8}V${f(base(x) - 2)}`, .35);
      for (const x of [162, 236, 306, 362]) {
        const b2 = base(x) + 12;
        s += k.shape(`M${x - 22} ${wallTop}L${x} ${wallTop + 3}V${b2}L${x - 19} ${b2 - 9}Z`, 'light', { w: 1.1 });
        s += k.shape(`M${x} ${wallTop + 3}L${x + 16} ${wallTop}L${x + 14} ${b2 - 9}L${x} ${b2}Z`, 'dark', { w: .9 });
        s += k.line(`M${x - 21} ${wallTop + 6}L${x} ${wallTop + 9}L${x + 15} ${wallTop + 6}`, 1.1); // the cordon
        for (let y = wallTop + 14; y < b2 - 6; y += 7) s += k.line(`M${x - 19} ${f(y - 2)}L${x - 1} ${f(y + 1)}`, .35);
        s += k.shape(k.rect(x - 12, wallTop + 16, 3, 5), 'black', { w: 0 });
      }
      // the parapet with its embrasures
      let par = `M136 ${wallTop}`;
      for (let x = 136; x < 376; x += 10) par += `V${wallTop - 5}h7V${wallTop}h3`;
      s += k.shape(par + `V${wallTop + 2}H136Z`, 'light', { w: .8 });
      // the clock tower over the gate: square, a baroque bell-shaped roof and lantern
      const cx = 250;
      s += k.shape(k.rect(cx - 13, 54, 26, wallTop - 54), 'light', { w: 1.2 }) + k.shape(k.rect(cx + 4, 54, 9, wallTop - 54), 'dark', { w: .5 });
      s += `<circle cx="${cx - 2}" cy="66" r="6" fill="${k.paper}" stroke="${k.ink}" stroke-width=".9"/>` + k.line(`M${cx - 2} 66v-4M${cx - 2} 66l3 2`, .8);
      s += k.shape(k.arch(cx - 6, 78, 9, 18), 'black', { w: .6 });
      s += k.shape(`M${cx - 16} 54Q${cx - 14} 44 ${cx - 6} 40Q${cx} 30 ${cx + 6} 40Q${cx + 14} 44 ${cx + 16} 54Z`, 'dark', { w: 1 });
      s += k.shape(k.rect(cx - 3, 26, 6, 8), 'light', { w: .6 }) + k.shape(k.onion(cx, 26, 8, 10), 'dark', { w: .6 }) + k.line(`M${cx} 16v-4`, .7);
      s += k.flag(362, wallTop - 5, 1.3, 'mid');
      // the lower walls stepping down the slope to the water
      s += k.shape(`M96 ${water}L120 150L176 128L186 140L136 166L134 ${water}Z`, 'light', { w: 1.1 });
      s += k.shape(`M176 128L186 140L136 166L134 ${water}L148 ${water}L150 168L192 146L190 132Z`, 'dark', { w: .6 });
      s += k.shape(`M180 ${water}L196 152L232 140L240 150L206 162L204 ${water}Z`, 'light', { w: 1 }) + k.shape(`M232 140L240 150L206 162L204 ${water}L214 ${water}L214 166L246 154L244 144Z`, 'dark', { w: .5 });
      for (const [x0, y0, x1, y1] of [[120, 150, 176, 128], [196, 152, 232, 140]]) for (let i = 1; i < 6; i++) { const t = i / 6; s += k.shape(k.rect(x0 + (x1 - x0) * t - 1.5, y0 + (y1 - y0) * t - 4, 3, 4), 'light', { w: .5 }); }
      // the Nebojša tower at the water's edge
      s += k.shape(k.rect(98, 142, 26, water - 142), 'vert', { w: 1.1 }) + k.shape(k.rect(114, 142, 10, water - 142), 'dark', { w: .5 });
      s += k.shape(k.poly([[96, 142], [111, 126], [126, 142]]), 'dark', { w: .9 }) + k.shape(k.rect(102, 152, 3, 6), 'black', { w: 0 }) + k.shape(k.rect(108, 164, 3, 6), 'black', { w: 0 });
      // the slope's scrub and paths
      for (let i = 0; i < 10; i++) { const x = 150 + r() * 200, y = 140 + r() * 36; s += k.shape(`M${f(x - 5)} ${f(y)}a5 4 0 1 1 10 0Z`, 'dark', { w: .4 }); }
      s += k.line('M240 178Q280 160 300 140T330 112', .7) + k.figure(298, 144, .6, 'soldier') + k.figure(270, 166, .6, 'man');
      return s;
    })();

    // ---------- the Sava ----------
    let river = k.water(water, 240, { seed: 44 });
    river += k.reflect(`<g>${fort}</g>`, water, .2) + k.shape(k.rect(-5, water, 650, 4), 'horiz', { w: 0 });
    river += k.boat(250, 206, 1, 'barge', -1) + k.boat(372, 196, .7, 'sail', 1);

    // ---------- the Austrian bank: reeds, a moored boat, the sentry box and its sentry ----------
    let bank = k.shape(`M380 245C410 226 450 214 520 210S620 206 650 204V245Z`, 'stipple', { w: 1 });
    bank += k.shape(`M380 245C410 226 450 214 520 210S620 206 650 204V212C600 214 540 216 500 222S420 236 400 245Z`, 'dark', { w: 0 });
    for (let i = 0; i < 40; i++) { const x = 400 + r() * 240, y = 206 + r() * 34, h = 8 + r() * 12; bank += k.line(`M${f(x)} ${f(y)}q${f(-1 + r() * 2)} ${f(-h * .6)} ${f(-2 + r() * 4)} ${f(-h)}`, .6); }
    bank += k.shape('M330 236q20 6 52 0l-4 6h-44Z', 'dark', { w: .7 }) + k.line('M382 236l18 -12', .6);
    const box = (() => { // a frontier sentry box in the black-and-yellow stripes
      let s = k.shape(k.rect(560, 170, 24, 40), 'paper', { w: 1 });
      for (let i = 0; i < 9; i++) s += k.shape(`M560 ${174 + i * 5}l24 -6v4l-24 6Z`, 'black', { w: 0 });
      s += k.shape(k.rect(566, 180, 12, 26), 'black', { w: .6 }) + k.shape(k.poly([[556, 171], [572, 160], [588, 171]]), 'dark', { w: .9 });
      return s;
    })();
    bank += box + k.figure(604, 214, 1.5, 'soldier') + k.flag(630, 214, 1.6, 'mid');

    return far + ridge + city + slope + fort + river + bank;
  },
};
