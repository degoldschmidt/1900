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
      let s = k.shape(`M646 128Q600 132 570 150Q540 166 500 178Q470 186 446 194Q436 198 440 202Q480 206 540 206T646 210Z`, 'stipple', { w: 1 });
      s += k.shape(`M440 202Q480 206 540 206T646 210V214Q560 214 500 210T436 202Z`, 'black', { w: .5 }); // the rock at the waterline
      for (let i = 0; i < 9; i++) { const x = 450 + i * 22 + r() * 6; s += k.line(`M${f(x)} ${f(203 + i * .4)}l${f(2 + r() * 3)} 5`, .6); }
      // the park climbing behind: one dark wood of ilex and pine, its crowns lit along the top
      let wood = 'M560 176', wy = 150;
      for (let x = 560; x < 650; x += 12) { wy -= 3 + r() * 3; const up = 6 + r() * 8; wood += `L${x} ${f(wy)}q3 ${f(-up)} 6 ${f(-up * .7)}q3 ${f(up * .1)} 6 ${f(up * .6)}`; }
      s += k.shape(wood + 'V180H560Z', 'dark', { w: .8 });
      for (let i = 0; i < 7; i++) { const x = 566 + i * 12 + r() * 4, y = 146 - i * 4 + r() * 4; s += k.shape(`M${f(x - 6)} ${f(y)}q3 -6 7 -5q4 1 4 5Z`, 'stipple', { w: 0 }); }
      for (let i = 0; i < 5; i++) { const x = 548 + r() * 20, y = 168 + r() * 14; s += k.shape(`M${f(x - 7)} ${f(y)}q3 -8 8 -7q5 1 5 7Z`, 'dark', { w: .5 }); }
      return s;
    })();
    const castle = (() => {
      const by = 186;
      let s = '';
      // the landing stage and its sphinx
      s += k.shape(k.rect(430, by + 8, 30, 5), 'light', { w: .7 }) + k.shape(`M434 ${by + 8}v-4q2 -3 5 -3l2 3h3v4Z`, 'dark', { w: .4 });
      // the main block: two storeys, crenellated, the far wing in shade
      s += k.shape(k.rect(470, 136, 72, by - 136), 'light', { w: 1.2 });
      s += k.shape(k.rect(530, 136, 12, by - 136), 'mid', { w: .6 });
      s += k.shape(k.rect(542, 148, 26, by - 148 + 4), 'mid', { w: 1 }) + k.shape(k.rect(556, 148, 12, by - 144), 'dark', { w: 0 });
      s += k.windows(474, 142, 54, 36, 6, 2, { arched: true, ww: .45, wh: .62, lit: .5 });
      s += k.windows(544, 152, 22, 28, 2, 2, { arched: true, ww: .45, wh: .6, lit: .4 });
      const crenels = (x0, x1, y, h = 3.6) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1 - 1; x += 6) d += `v${-h}h3v${h}h3`; return k.shape(d + `V${y + 2}H${x0}Z`, 'light', { w: .7 }); };
      s += crenels(468, 544, 136) + crenels(540, 570, 148);
      s += k.shape(k.rect(470, 158, 60, 3), 'mid', { w: .4 }); // the string course
      // the terrace on the seaward end with its balustrade
      s += k.shape(k.rect(448, 170, 24, by - 170 + 4), 'light', { w: .8 }) + k.line(`M447 170h26`, 1);
      for (let x = 450; x < 472; x += 3) s += k.line(`M${x} 170v-4`, .5);
      s += k.line('M447 166h26', .7);
      // the square keep at the point, with its corbelled crown and the flag
      const tx = 452, tw = 24, tt = 100;
      s += k.shape(k.rect(tx, tt, tw, by - tt), 'paper', { w: 1.3 }) + k.shape(k.rect(tx + tw - 8, tt, 8, by - tt), 'mid', { w: .6 });
      s += k.windows(tx + 3, tt + 12, tw - 10, 48, 1, 3, { arched: true, ww: .5, wh: .6, lit: .5 });
      s += k.shape(k.rect(tx - 3, tt - 8, tw + 6, 8), 'light', { w: 1 });
      let corb = `M${tx - 3} ${tt}`;
      for (let i = 0; i < 6; i++) corb += `q2.5 4 5 0`;
      s += k.shape(corb + 'Z', 'dark', { w: .5 }) + crenels(tx - 3, tx + tw + 4, tt - 8, 4);
      s += k.shape(k.rect(tx + tw - 5, tt - 8, 8, 8), 'mid', { w: 0 });
      s += k.flag(tx + tw / 2, tt - 12, 1.1, 'mid');
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
    terrace += k.tree(440, 246, 2.2, 'cypress');

    return far + water + fleet + point + castle + terrace + pine;
  },
};
