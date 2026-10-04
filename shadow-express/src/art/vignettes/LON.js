// London: the clock tower and the Houses of Parliament seen across the Thames, Westminster Bridge on the left.
// The example vignette: see docs/ART.md for the composition rules every city follows.

export default {
  id: 'LON',
  draw(k) {
    const r = k.rng(12);
    const waterY = 184;
    let far = k.skyline(-5, 640, waterY - 6, { seed: 4, hMin: 10, hMax: 26, style: 'north' }) + k.haze(waterY - 30, 26, .3); // Lambeth behind, in soot
    const farLights = k.lights.length; // the far windows end here; those behind Parliament stay dark
    // Victoria Tower: square, pinnacled, the flag up
    const vt = (() => {
      const x = 532, w = 42, top = 52;
      let s = k.shape(k.rect(x, top, w, waterY - top), 'vert');
      s += k.shape(k.rect(x + w - 12, top, 12, waterY - top), 'dark', { w: .6 });
      for (let i = 0; i < 6; i++) s += k.shape(k.gothic(x + 7, top + 14 + i * 20, 9, 14), 'glass', { w: .5 }) + k.shape(k.gothic(x + 21, top + 14 + i * 20, 9, 14), 'glass', { w: .5 });
      for (const px of [x - 2, x + w - 4]) s += k.shape(k.rect(px, top - 16, 6, 18), 'mid', { w: .6 }) + k.shape(k.spire(px + 3, top - 16, 7, 16), 'dark', { w: .6 });
      s += k.shape(k.rect(x + 4, top - 8, w - 8, 8), 'light', { w: .6 });
      return s + k.flag(x + w / 2, top - 8, 1.2);
    })();
    // the long river front with its pinnacles
    const front = (() => {
      const x0 = 206, x1 = 534, top = 138;
      let s = k.shape(k.rect(x0, top, x1 - x0, waterY - top), 'light');
      s += k.shape(k.rect(x0, waterY - 10, x1 - x0, 10), 'mid', { w: .7 });
      for (let x = x0 + 6; x < x1 - 6; x += 12) s += k.shape(k.gothic(x, top + 10, 6, 22), 'glass', { w: .45 }) + k.shape(k.gothic(x, top + 34, 6, 12), 'glass', { w: .45 });
      for (let x = x0; x <= x1; x += 24) s += k.shape(k.rect(x - 2, top - 8, 4, 9), 'mid', { w: .5 }) + k.shape(k.spire(x, top - 8, 4.5, 10), 'dark', { w: .5 });
      for (const bx of [262, 330, 420, 488]) { // projecting bays
        s += k.shape(k.rect(bx, top - 14, 22, waterY - top + 14), 'light', { w: .8 }) + k.shape(k.rect(bx + 15, top - 14, 7, waterY - top + 14), 'dark', { w: .5 });
        s += k.windows(bx + 2, top - 10, 13, 40, 2, 3, { ww: .6, wh: .7 });
        s += k.shape(k.spire(bx + 3, top - 14, 5, 14), 'dark', { w: .5 }) + k.shape(k.spire(bx + 19, top - 14, 5, 14), 'dark', { w: .5 });
      }
      // central lantern spire
      s += k.shape(k.rect(368, top - 34, 22, 34), 'vert') + k.shape(k.rect(382, top - 34, 8, 34), 'dark', { w: .5 });
      s += k.shape(k.poly([[364, top - 34], [379, top - 78], [394, top - 34]]), 'dark');
      return s;
    })();
    // the clock tower
    const clock = (() => {
      const cx = 188, w = 28, base = waterY, shaft = 92;
      let s = k.shape(k.rect(cx - w / 2, shaft, w, base - shaft), 'vert');
      s += k.shape(k.rect(cx + w / 2 - 9, shaft, 9, base - shaft), 'dark', { w: .6 });
      for (let i = 0; i < 4; i++) s += k.shape(k.gothic(cx - 8, shaft + 10 + i * 20, 6, 13), 'glass', { w: .45 }) + k.shape(k.gothic(cx + 1, shaft + 10 + i * 20, 6, 13), 'glass', { w: .45 });
      s += k.shape(k.rect(cx - 17, 62, 34, 32), 'light'); // clock stage
      s += k.shape(k.rect(cx + 8, 62, 9, 32), 'mid', { w: .5 });
      s += `<circle cx="${cx - 1}" cy="78" r="11.5" fill="${k.paper}" stroke="${k.ink}" stroke-width="1.2"/><circle cx="${cx - 1}" cy="78" r="9" fill="none" stroke="${k.ink}" stroke-width=".5"/>`;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += k.line(`M${k.f(cx - 1 + Math.cos(a) * 7.4)} ${k.f(78 + Math.sin(a) * 7.4)}l${k.f(Math.cos(a) * 1.4)} ${k.f(Math.sin(a) * 1.4)}`, .6); }
      s += k.line(`M${cx - 1} 78l0 -6.5M${cx - 1} 78l4.5 2.5`, 1);
      s += k.shape(k.rect(cx - 13, 46, 26, 16), 'mid'); // belfry
      s += k.windows(cx - 11, 48, 22, 12, 3, 1, { arched: true, ww: .6, wh: .8 });
      s += k.shape(k.poly([[cx - 15, 46], [cx - 9, 24], [cx + 9, 24], [cx + 15, 46]]), 'dark'); // roof
      s += k.shape(k.spire(cx, 24, 9, 22), 'black', { w: .7 });
      for (const px of [cx - 15, cx + 13]) s += k.shape(k.spire(px + 1, 62, 5, 14), 'dark', { w: .5 });
      return s;
    })();
    // Westminster Bridge and its traffic
    const bridge = k.bridge(-5, 160, waterY - 12, { arches: 5, h: 16, tone: 'mid' })
      + k.lamp(30, waterY - 15, .8) + k.lamp(92, waterY - 15, .8) + k.lamp(150, waterY - 15, .8)
      + k.figure(56, waterY - 15, .6, 'man') + k.figure(64, waterY - 15, .6, 'woman') + k.figure(118, waterY - 15, .6, 'man');
    const city = far + vt + front + clock;
    const behind = ([x, y]) => (x > 170 && x < 576 && y > 40) || (x > 160 && x < 210);
    k.lights.splice(0, farLights, ...k.lights.slice(0, farLights).filter((l) => !behind(l)));
    let water = k.water(waterY, 240);
    water += k.reflect(`<g opacity=".9">${front}${clock}${vt}</g>`, waterY, .3) + k.shape(k.rect(-5, waterY, 650, 5), 'horiz', { w: 0 });
    // river traffic
    const boats = k.boat(440, 226, 1.6, 'steamer', -1) + k.boat(290, 234, 1.1, 'barge', 1) + k.boat(604, 214, .8, 'sail', -1);
    let mist = '';
    for (let i = 0; i < 3; i++) mist += k.line(`M${k.f(220 + r() * 300)} ${k.f(waterY + 6 + i * 7)}h${k.f(40 + r() * 60)}`, .6);
    return city + water + mist + bridge + boats;
  },
};
