// Trieste: from the terrace of the coast road high above the gulf, under an umbrella pine. Below, white Miramare
// on its wooded point at the right; out in the roads the Austrian dreadnoughts lie at anchor, smoking.

export default {
  id: 'TRI',
  draw(k) {
    const f = k.f, r = k.rng(23);
    const sea = 150;

    // ---------- the far shore and the open gulf ----------
    let far = k.shape(`M-5 ${sea}L-5 ${sea - 5}Q40 ${sea - 9} 90 ${sea - 6}T190 ${sea - 3}T260 ${sea}Z`, 'light', { far: true, w: .5 });
    far += k.shape(`M380 ${sea}Q440 ${sea - 6} 520 ${sea - 10}T645 ${sea - 20}V${sea}Z`, 'light', { far: true, w: .5 });
    let water = k.water(sea, 240, { seed: 21 });
    for (let i = 0; i < 16; i++) { const y = sea + 2 + i * i * .35; water += k.line(`M${f(r() * 600)} ${f(y)}h${f(8 + i * 3)}`, .4 + i * .04); }
    water += k.haze(sea - 6, 14, .4);

    // ---------- the warships in the roads ----------
    const dread = (x, y, s, dir = 1) => { // a dreadnought: low hull, two funnels, turrets fore and aft, tripod masts
      const S = (n) => f(n * s), X = (n) => f(x + n * s * dir);
      let o = k.shape(`M${X(-56)} ${f(y - 7 * s)}L${X(60)} ${f(y - 8 * s)}L${X(54)} ${f(y)}L${X(-52)} ${f(y)}Z`, 'black', { w: .7 });
      o += k.line(`M${X(-54)} ${f(y - 4 * s)}L${X(56)} ${f(y - 4.5 * s)}`, .5 * s, { color: k.paper });
      o += k.shape(k.poly([[x - 20 * s, y - 7 * s], [x - 18 * s, y - 15 * s], [x + 20 * s, y - 15 * s], [x + 22 * s, y - 7 * s]]), 'mid', { w: .6 });
      o += k.shape(k.rect(x - 8 * s, y - 21 * s, 14 * s, 6 * s), 'dark', { w: .5 });
      for (const t of [-40, -28, 28, 40]) { // turrets and their guns
        const tx = x + t * s * dir, hy = t === -28 || t === 28 ? 11 : 9;
        o += k.shape(`M${f(tx - 5 * s)} ${f(y - 7 * s)}v${S(-hy + 7)}h${S(10)}v${S(hy - 7)}Z`, 'dark', { w: .5 });
        o += k.line(`M${f(tx)} ${f(y - (hy - 1) * s)}h${f((t < 0 ? -11 : 11) * s * dir)}`, 1.1 * s);
      }
      for (const fx of [-6, 6]) o += k.shape(k.rect(x + fx * s * dir - 2.6 * s, y - 30 * s, 5.2 * s, 15 * s), 'black', { w: .5 });
      o += k.line(`M${X(-14)} ${f(y - 15 * s)}V${f(y - 42 * s)}M${X(16)} ${f(y - 15 * s)}V${f(y - 38 * s)}M${X(-17)} ${f(y - 15 * s)}L${X(-14)} ${f(y - 34 * s)}`, .7 * s);
      o += k.shape(k.rect(x - 17 * s * dir - 3 * s, y - 37 * s, 6 * s, 3 * s), 'dark', { w: .4 });
      o += k.flag(x + 58 * s * dir, y - 8 * s, .5 * s);
      return o + k.smoke(x - 6 * s * dir, y - 31 * s, .9 * s, { seed: Math.round(x) }) + k.smoke(x + 6 * s * dir, y - 31 * s, .7 * s, { seed: Math.round(x) + 3 });
    };
    const fleet = dread(96, 166, .55, 1) + dread(300, 172, .72, -1) + k.boat(380, 160, .5, 'warship', 1) + dread(186, 196, 1.2, 1) + k.boat(372, 196, .7, 'steamer', -1)
      + k.boat(36, 196, .9, 'sail', 1);

    // ---------- Miramare on its point ----------
    const point = (() => {
      let s = k.shape('M646 116Q604 120 574 140Q546 156 506 168Q466 180 432 190Q408 198 414 204Q470 210 540 210T646 214Z', 'stipple', { w: 1 });
      s += k.shape('M414 204Q470 210 540 210T646 214V219Q560 219 500 214T410 204Z', 'black', { w: .5 }); // the rock at the waterline
      for (let i = 0; i < 10; i++) { const x = 424 + i * 22 + r() * 6; s += k.line(`M${f(x)} ${f(205 + i * .5)}l${f(2 + r() * 3)} 5`, .6); }
      // the park climbing behind: one dark wood of ilex and pine, its crowns lit along the top
      let wood = 'M582 178', wy = 146;
      for (let x = 582; x < 650; x += 12) { wy -= 3 + r() * 3; const up = 6 + r() * 8; wood += `L${x} ${f(wy)}q3 ${f(-up)} 6 ${f(-up * .7)}q3 ${f(up * .1)} 6 ${f(up * .6)}`; }
      s += k.shape(wood + 'V182H582Z', 'dark', { w: .8 });
      for (let i = 0; i < 6; i++) { const x = 588 + i * 12 + r() * 4, y = 142 - i * 4 + r() * 4; s += k.shape(`M${f(x - 6)} ${f(y)}q3 -6 7 -5q4 1 4 5Z`, 'stipple', { w: 0 }); }
      for (let i = 0; i < 5; i++) { const x = 570 + r() * 20, y = 170 + r() * 14; s += k.shape(`M${f(x - 7)} ${f(y)}q3 -8 8 -7q5 1 5 7Z`, 'dark', { w: .5 }); }
      return s;
    })();
    const castle = (() => {
      const by = 192;
      let s = '';
      // the landing stage and its sphinx
      s += k.shape(k.rect(402, by + 6, 40, 6), 'light', { w: .8 }) + k.shape(`M408 ${by + 6}v-5q3 -4 7 -4l3 4h4v5Z`, 'dark', { w: .5 });
      // the main block: two storeys under a crenellated parapet, the far wing in shade
      s += k.shape(k.rect(466, 124, 102, by - 124), 'light', { w: 1.3 });
      s += k.shape(k.rect(552, 124, 16, by - 124), 'mid', { w: .6 });
      s += k.shape(k.rect(568, 140, 34, by - 140 + 4), 'mid', { w: 1.1 }) + k.shape(k.rect(588, 140, 14, by - 136), 'dark', { w: 0 });
      s += k.windows(470, 132, 78, 50, 7, 2, { arched: true, ww: .45, wh: .62, lit: .5 });
      s += k.windows(571, 146, 28, 38, 2, 2, { arched: true, ww: .45, wh: .6, lit: .4 });
      const crenels = (x0, x1, y, h = 4.4) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1 - 1; x += 7) d += `v${-h}h3.6v${h}h3.4`; return k.shape(d + `V${y + 2.4}H${x0}Z`, 'light', { w: .8 }); };
      s += crenels(464, 570, 124) + crenels(566, 604, 140);
      s += k.shape(k.rect(466, 158, 86, 3.4), 'mid', { w: .5 }); // the string course
      s += k.shape(k.rect(466, by - 8, 102, 8), 'mid', { w: .6 }); // the sea-stained plinth
      // the terrace on the seaward end with its balustrade
      s += k.shape(k.rect(424, 166, 20, by - 166 + 4), 'light', { w: .9 }) + k.line('M423 166h22', 1.1);
      for (let x = 426; x < 444; x += 3) s += k.line(`M${x} 166v-5`, .5);
      s += k.line('M423 161h22', .8);
      // the square keep at the point, with its corbelled crown and the flag
      const tx = 440, tw = 30, tt = 80;
      s += k.shape(k.rect(tx, tt, tw, by - tt), 'paper', { w: 1.4 }) + k.shape(k.rect(tx + tw - 10, tt, 10, by - tt), 'mid', { w: .6 });
      s += k.windows(tx + 4, tt + 14, tw - 13, 66, 1, 4, { arched: true, ww: .5, wh: .6, lit: .5 });
      s += k.shape(k.rect(tx - 4, tt - 9, tw + 8, 9), 'light', { w: 1.1 });
      let corb = `M${tx - 4} ${tt}`;
      for (let i = 0; i < 7; i++) corb += 'q2.7 4.4 5.4 0';
      s += k.shape(corb + 'Z', 'dark', { w: .5 }) + crenels(tx - 4, tx + tw + 5, tt - 9, 5);
      s += k.shape(k.rect(tx + tw - 6, tt - 9, 10, 9), 'mid', { w: 0 });
      s += k.flag(tx + tw / 2, tt - 14, 1.3, 'mid');
      // a steam launch putting out from the landing
      s += k.shape('M372 197h30l-4 4h-24Z', 'black', { w: .6 }) + k.shape(k.rect(380, 191, 12, 6), 'light', { w: .5 }) + k.shape(k.rect(388, 183, 3, 8), 'black', { w: .4 }) + k.smoke(389.5, 182, .45, { seed: 12 });
      return s;
    })();

    // ---------- the terrace: balustrade, the umbrella pine, the strollers ----------
    let terrace = k.shape('M-5 230H420L432 245H-5Z', 'paper', { w: 0 }) + k.shape('M-5 230H210L220 245H-5Z', 'light', { w: 0 });
    for (let i = 0; i < 14; i++) { const x = r() * 400, y = 234 + r() * 6; terrace += k.line(`M${f(x)} ${f(y)}h${f(5 + r() * 9)}`, .5); }
    let balu = k.shape(k.rect(-5, 207, 420, 5), 'light', { w: 1 }) + k.shape(k.rect(-5, 227, 420, 4), 'mid', { w: .9 });
    for (let x = 2; x < 410; x += 7) balu += k.shape(`M${x} 212q-2.6 5 0 8q-1.8 3 0 7h3.4q1.8 -4 0 -7q2.6 -3 0 -8Z`, 'light', { w: .45 });
    for (const x of [96, 232, 368, 414]) balu += k.shape(k.rect(x - 5, 204, 10, 27), 'vert', { w: .9 }) + k.shape(k.rect(x + 1, 204, 4, 27), 'dark', { w: 0 }) + k.shape(k.rect(x - 6.5, 201, 13, 3.4), 'light', { w: .7 });
    terrace += balu + k.shape('M414 231V245H440Z', 'dark', { w: .6 });
    terrace += k.figure(252, 240, 1.35, 'woman') + k.line('M247 212q7 -12 17 -2', 1.2) + k.figure(272, 240, 1.4, 'soldier') + k.figure(150, 242, 1.3, 'man');
    terrace += k.lamp(332, 231, 1.1);
    k.lights.push([329.3, 198.1, 5.4, 4]);
    const pine = (() => { // a stone pine: the leaning trunk, the flat parasol crown, lit along its top
      let s = k.shape('M54 246Q46 176 58 126Q68 86 88 58L96 62Q78 90 70 128Q60 176 68 246Z', 'dark', { w: .9 });
      s += k.shape('M76 94Q100 78 128 76L128 80Q104 82 80 98Z', 'dark', { w: .6 }) + k.shape('M66 114Q46 96 24 90L24 94Q46 100 62 120Z', 'dark', { w: .6 });
      let top = 'M-10 72', y = 64;
      for (let x = -10; x < 190; x += 16) { const up = 10 + r() * 10; top += `q4 ${f(-up)} 8 ${f(-up * .6)}q4 ${f(up * .1)} 8 ${f(up * .5)}`; }
      s += k.shape(top + 'q6 6 -2 10Q90 80 -10 84Z', 'dark', { w: .9 });
      s += k.shape(top + 'q-40 4 -100 2Q40 64 -10 76Z', 'stipple', { w: 0 });
      s += k.shape('M-10 80Q80 74 186 78Q100 84 -10 86Z', 'black', { w: 0 });
      return s;
    })();

    return far + water + fleet + point + castle + terrace + pine;
  },
};
