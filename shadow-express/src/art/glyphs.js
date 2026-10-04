// Engraved map glyphs (owner: Art C): small symbols on a transparent ground, drawn to read at 16–24 px.
// Each entry is (uid) => SVG string, viewBox 64×64. Bold ink silhouettes carry the shape at small sizes;
// hatching and paper highlights give the engraved look when they are shown larger.
import { makeKit, PAPER, INK, WASH, BLOOD } from './kit.js';

const f = (n) => Math.round(n * 10) / 10;

/** Only the hatch patterns a glyph uses, cut from the kit's defs to keep each glyph small. */
function svg(uid, tones, body, view = '0 0 64 64') {
  const k = makeKit({ uid });
  const all = k.defs();
  let defs = '';
  for (const t of tones) { const m = all.match(new RegExp(`<pattern id="${t}-${uid}"[\\s\\S]*?</pattern>`)); if (m) defs += m[0]; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}">${defs ? `<defs>${defs}</defs>` : ''}${body(k)}</svg>`;
}
const circle = (cx, cy, r, fill, stroke = INK, w = 1) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${w}"` : ''}/>`;
const puff = (k, x, y, r, tone = 'paper') => k.shape(`M${f(x - r)} ${f(y)}a${f(r)} ${f(r * .82)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r * .82)} 0 1 0 ${f(-2 * r)} 0Z`, tone, { w: 1.6 });

/** A rubber stamp: a double ring, a band across with the word, stars either side. */
function stamp(uid, word, color, o = {}) {
  return svg(uid, [], () => {
    const rot = o.rot ?? -12, fill = o.hollow ? PAPER : color;
    let s = `<g transform="rotate(${rot} 32 32)" fill="none" stroke="${color}">`;
    s += `<circle cx="32" cy="32" r="29" stroke-width="3"/><circle cx="32" cy="32" r="24.6" stroke-width="1.1"/>`;
    s += `<path d="M5.4 24.6H58.6M5.4 39.4H58.6" stroke-width="1.6"/>`;
    s += `<path d="M32 9.6l1.3 3.4l3.6 .1l-2.8 2.2l1 3.5l-3.1 -2l-3.1 2l1 -3.5l-2.8 -2.2l3.6 -.1Z M32 44.6l1.3 3.4l3.6 .1l-2.8 2.2l1 3.5l-3.1 -2l-3.1 2l1 -3.5l-2.8 -2.2l3.6 -.1Z" fill="${color}" stroke="none"/>`;
    s += `<text x="32" y="35.6" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="${o.size ?? 11}" textLength="${o.len ?? 46}" lengthAdjust="spacingAndGlyphs" fill="${fill}" stroke="${o.hollow ? color : 'none'}" stroke-width="${o.hollow ? .9 : 0}">${word}</text>`;
    // the uneven inking of a worn rubber stamp
    s += `<path d="M10 14l5 3M48 52l6 -4M7 44l3 -2M50 12l4 2M24 59l6 0" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round"/>`;
    return s + '</g>';
  });
}

export default {
  loco: (uid) => svg(uid, ['dark', 'mid'], (k) => {
    let s = puff(k, 44, 9, 5) + puff(k, 33, 7, 6) + puff(k, 20, 9, 5.4, 'mid');
    s += k.shape('M6 12H24V40H6Z', 'dark', { w: 2.2 }) + k.shape('M4 12H26V8.6H4Z', 'ink', { w: 1 }) + k.shape('M10 17H19V25H10Z', 'paper', { w: 1.4 });
    s += k.shape('M24 22H50Q54 22 54 30Q54 38 50 38H24Z', 'dark', { w: 2.4 }); // the boiler
    s += k.line('M24 26.4H52', 1.2, { color: PAPER });
    s += k.shape('M43 22V13.6H41V10H51V13.6H49V22Z', 'ink', { w: 1 }) + k.shape('M31 22Q31 16 34.5 16Q38 16 38 22Z', 'ink', { w: 1 });
    s += k.shape('M4 38H58V44H4Z', 'ink', { w: 1 }) + k.shape('M54 38L62 46H54Z', 'ink', { w: 1 }); // frame and cow-catcher
    for (const [x, r] of [[15, 7.4], [32, 7.4]]) s += circle(x, 46, r, PAPER, INK, 2.6) + circle(x, 46, 2, INK, null);
    s += circle(49, 49, 4.4, PAPER, INK, 2.2) + k.line('M15 46H32', 2.2);
    return s;
  }),
  steamer: (uid) => svg(uid, ['dark', 'mid'], (k) => {
    let s = puff(k, 26, 9, 4.6, 'mid') + puff(k, 15, 7, 5.6) + puff(k, 5, 9, 4.6);
    s += k.line('M14 34V14M48 34V18M14 15L48 19', 1.2);
    s += k.shape('M16 34H46V27H16Z', 'paper', { w: 2 }) + k.line('M20 30.6H43', 2.2, { color: INK });
    s += k.shape('M26 27V12H34V27Z', 'ink', { w: 1 }) + k.line('M26 16H34', 1.6, { color: PAPER });
    s += k.shape('M2 34H62L55 46H8Z', 'ink', { w: 1.4 }) + k.line('M6 38.6H58', 1.2, { color: PAPER });
    s += k.line('M2 52q5 -3 10 0t10 0t10 0t10 0t10 0t10 0', 2) + k.line('M8 58q5 -3 10 0t10 0t10 0t10 0t10 0', 1.4);
    return s;
  }),
  coach: (uid) => svg(uid, ['dark', 'mid'], (k) => {
    let s = k.shape('M4 16H30V40H4Z', 'dark', { w: 2.4 }) + k.shape('M2 16H32V12H2Z', 'ink', { w: 1 }) + k.shape('M9 20H25V29H9Z', 'paper', { w: 1.4 });
    s += k.shape('M8 12V7H20V12Z', 'mid', { w: 1.4 }); // the luggage on the roof
    s += k.shape('M30 30H40', 'none', { w: 2 }) + k.line('M30 32L40 31', 2.4);
    // the horse, at a trot
    s += k.shape('M38 26Q40 21 47 21H54Q57 16 60 15L62 17Q61 22 58 26Q57 31 52 32H42Q38 32 38 26Z', 'ink', { w: 1 });
    s += k.line('M42 31L39 41M45 31L48 41M52 31L50 41M55 30L60 38', 2.6);
    for (const [x, r] of [[10, 8], [27, 6.4]]) s += circle(x, 46, r, PAPER, INK, 2.6) + circle(x, 46, 1.8, INK, null) + k.line(`M${x - r + 1} 46H${x + r - 1}M${x} ${46 - r + 1}V${46 + r - 1}`, .9);
    return s;
  }),
  walker: (uid) => svg(uid, ['dark'], (k) => {
    let s = k.line('M4 60h6M15 60h6M26 60h6M37 60h6M48 60h6', 2, { color: INK }); // the path
    s += circle(31, 10.6, 5, INK, null) + k.shape('M24 7.6H38V5.6H35V1.6H27V5.6H24Z', 'ink', { w: 0 }); // head and hat
    s += k.shape('M27 16H36Q39 17 39 22L40 34H33L31 30L29 34H24L25 22Q25 17 27 16Z', 'ink', { w: 1 });
    s += k.line('M28 34L20 52L15 53M35 34L40 46L46 52', 4.6);
    s += k.line('M38 22L46 30L52 55', 2.2) + k.line('M26 21L20 30', 3.4);
    s += k.shape('M15 22Q12 14 18 13L22 17Q20 22 15 22Z', 'dark', { w: 1.6 }); // a bundle on the shoulder
    return s;
  }),
  sentry: (uid) => svg(uid, ['dark'], (k) => {
    let s = k.shape('M6 58H58', 'none', { w: 0 }) + k.line('M3 59H61', 2.4);
    s += k.shape('M10 22H32V58H10Z', 'paper', { w: 2.6 });
    for (let i = 0; i < 7; i++) s += k.shape(`M10 ${f(26 + i * 6)}L32 ${f(18 + i * 6)}V${f(22 + i * 6)}L10 ${f(30 + i * 6)}Z`, 'ink', { w: 0 });
    s += k.shape('M15 30H27V56H15Z', 'ink', { w: 1.6 }) + k.shape('M6 23L21 9L36 23Z', 'dark', { w: 2.4 });
    // the sentry beside his box, rifle and bayonet
    s += circle(46, 26, 3.8, INK, null) + k.shape('M42.4 23.4Q46 18 49.6 23.4Z', 'ink', { w: 0 }) + k.line('M46 22V17', 1.4);
    s += k.shape('M42 31H50L51 46H41Z', 'ink', { w: 1 }) + k.line('M43 46V58M49 46V58', 3.4) + k.line('M53 54V20L54 14', 2) + k.line('M50 34L53 33', 2.4);
    return s;
  }),
  barrier: (uid) => svg(uid, [], (k) => {
    let s = k.line('M3 56H61', 2.4);
    s += k.shape('M7 22H15V56H7Z', 'ink', { w: 1 }) + circle(11, 30, 6, INK, null) + circle(11, 30, 2, PAPER, null); // the post and the pivot's weight
    s += k.line('M50 56V36M44 36H56', 3) + k.line('M45 31L50 36L55 31', 2.4); // the fork that holds the lowered boom
    s += k.shape('M10 28H60V34H10Z', 'paper', { w: 2.2 });
    for (let x = 14; x < 60; x += 9) s += k.shape(`M${x} 28H${x + 4.6}L${x + 1.6} 34H${x - 3}Z`, 'ink', { w: 0 });
    s += circle(30, 16, 7, PAPER, INK, 2.4) + k.line('M25.2 11.2L34.8 20.8', 2.6) + k.line('M30 23V28', 1.4); // a disc: no road
    return s;
  }),
  flood: (uid) => svg(uid, ['dark'], (k) => {
    let s = k.shape('M14 38V24L28 12L42 24V38Z', 'paper', { w: 2.4 }) + k.shape('M10 25L28 9L46 25', 'none', { w: 3 }) + k.shape('M22 26H30V34H22Z', 'ink', { w: 1 });
    s += k.shape('M28 9L46 25L44 27L28 13Z', 'dark', { w: 0 });
    s += k.shape('M2 36q5 -5 10 0t10 0t10 0t10 0t10 0t10 0V62H2Z', 'dark', { w: 2.2 });
    s += k.line('M2 46q5 -5 10 0t10 0t10 0t10 0t10 0t10 0', 2.4, { color: PAPER }) + k.line('M2 55q5 -5 10 0t10 0t10 0t10 0t10 0t10 0', 2.4, { color: PAPER });
    s += k.line('M54 30V8M49 13L54 7L59 13', 2.6); // the water rising
    return s;
  }),
  plague: (uid) => svg(uid, [], (k) => {
    let s = k.line('M14 60V4', 3) + circle(14, 4, 2.4, INK, null) + k.shape('M7 60H21V56H7Z', 'ink', { w: 0 });
    s += k.shape('M15 7Q34 3 56 8V36Q34 31 15 36Z', 'paper', { w: 2.4 });
    s += k.shape('M15 7Q25 5 35.4 5.6V20.6Q25 20 15 21.6Z', 'ink', { w: 0 }) + k.shape('M35.4 20.6Q46 21 56 22.4V36Q46 33.6 35.4 33.4Z', 'ink', { w: 0 });
    return s;
  }),
  strike: (uid) => svg(uid, [], (k) => {
    // two hammers crossed, their heads square to the shafts at the upper corners
    let s = '';
    for (const a of [-38, 38]) {
      s += `<g transform="translate(32 37) rotate(${a})">` + k.shape('M-2.8 -14H2.8V25H-2.8Z', 'paper', { w: 2 }) + k.line('M0 -10V21', 1)
        + k.shape('M-11 -25H11V-14H-11Z', 'ink', { w: 1 }) + k.shape('M-11 -25H-14V-14H-11Z', 'ink', { w: 0 }) + k.line('M-9 -22H8', 1.2, { color: PAPER, op: .6 }) + '</g>';
    }
    return s + k.line('M8 60H56', 2);
  }),
  troops: (uid) => svg(uid, [], (k) => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const x = 7 + i * 12.5, y = 30 + (i % 2) * 2;
      s += k.line(`M${x + 4} ${y + 22}V${y - 14}`, 1.6) + k.shape(`M${x + 2.8} ${y - 14}L${x + 4} ${y - 26}L${x + 5.2} ${y - 14}Z`, 'ink', { w: .6 }); // rifle and bayonet
      s += circle(x, y + 3, 4, INK, null) + k.shape(`M${x - 4.6} ${y + 1}Q${x} ${y - 6} ${x + 4.6} ${y + 1}Z`, 'ink', { w: 0 }) + k.line(`M${x} ${y - 3}V${y - 8}`, 1.8); // a spiked helmet
      s += k.shape(`M${x - 5} ${y + 8}H${x + 5}V${y + 30}H${x - 5}Z`, 'ink', { w: 0 });
    }
    return s;
  }),
  hunter: (uid) => svg(uid, ['dark'], (k) => {
    let s = k.shape('M18 13.6Q32 8 46 13.6L44 16H20Z', 'ink', { w: 1 }) + k.shape('M23 13V5Q32 1 41 5V13Z', 'ink', { w: 1 }); // the homburg
    s += k.shape('M25 16H39V22Q32 26 25 22Z', 'dark', { w: 1.6 }); // the face in the hat's shadow
    s += k.shape('M22 20L42 20L44 28Q50 40 48 60H16Q14 40 20 28Z', 'ink', { w: 1 }); // the long coat, collar up
    s += k.line('M32 24V60', 1.4, { color: PAPER }) + k.line('M22 21L32 30L42 21', 1.6, { color: PAPER, op: .8 });
    s += k.line('M24 40L27 46M40 40L37 46', 1.4, { color: PAPER, op: .7 }) + k.line('M22 60H29M35 60H42', 3);
    return s;
  }),
  eye: (uid) => svg(uid, ['dark'], (k) => {
    let s = k.shape('M3 32Q32 4 61 32Q32 60 3 32Z', 'paper', { w: 2.6 });
    s += circle(32, 32, 12.4, `url(#dark-${uid})`, INK, 2) + circle(32, 32, 6, INK, null) + circle(35.4, 28.4, 2.4, PAPER, null);
    s += k.line('M3 32Q32 4 61 32', 4.4);
    let lash = ''; for (const [x, y, dx, dy] of [[12, 21, -3, -5], [20, 15.4, -1.6, -6], [28, 12.4, -.4, -6.4], [36, 12.4, .4, -6.4], [44, 15.4, 1.6, -6], [52, 21, 3, -5]]) lash += `M${x} ${y}l${dx} ${dy}`;
    return s + k.line(lash, 2) + k.line('M10 40Q32 56 54 40', 1, { op: .6 });
  }),
  compass: (uid) => svg(uid, [], (k) => {
    let s = circle(32, 32, 25, 'none', INK, 2.2) + circle(32, 32, 21.4, 'none', INK, .8);
    let ticks = ''; for (let a = 0; a < 360; a += 22.5) { const q = a * Math.PI / 180; ticks += `M${f(32 + Math.cos(q) * 21.4)} ${f(32 + Math.sin(q) * 21.4)}L${f(32 + Math.cos(q) * 25)} ${f(32 + Math.sin(q) * 25)}`; }
    s += k.line(ticks, 1);
    // eight points, each split into an inked half and a paper half, the light from the upper left
    const point = (a, len, w) => {
      const q = (a - 90) * Math.PI / 180, ux = Math.cos(q), uy = Math.sin(q), px = -uy, py = ux;
      const tip = [32 + ux * len, 32 + uy * len], l = [32 + px * w, 32 + py * w], rr = [32 - px * w, 32 - py * w];
      return k.shape(k.poly([[32, 32], l, tip]), 'paper', { w: 1.2 }) + k.shape(k.poly([[32, 32], rr, tip]), 'ink', { w: 1.2 });
    };
    for (const a of [45, 135, 225, 315]) s += point(a, 17, 4);
    for (const a of [0, 90, 180, 270]) s += point(a, 29, 5.6);
    s += circle(32, 32, 2.6, PAPER, INK, 1.2);
    s += k.shape('M32 0.6L35 5H29Z', 'ink', { w: 0 }); // the north mark
    return s;
  }),
  cartouche: (uid) => svg(uid, ['mid'], (k) => {
    // an empty engraved title frame, 64×32 across the middle of the square (y 16 to 48)
    let s = k.shape('M10 18H54Q58 18 58 22V42Q58 46 54 46H10Q6 46 6 42V22Q6 18 10 18Z', 'paper', { w: 2 });
    s += k.shape('M12 21.6H52Q54.4 21.6 54.4 24V40Q54.4 42.4 52 42.4H12Q9.6 42.4 9.6 40V24Q9.6 21.6 12 21.6Z', 'none', { w: .8 });
    // scrolls curling at either end
    for (const dir of [1, -1]) {
      const g = `<g transform="translate(32 32) scale(${dir} 1) translate(-32 -32)">`;
      s += g + k.shape('M6 22Q0 22 1 28Q2 32 6 31Q9 30 8 27Q7 25 5 26', 'none', { w: 1.8 }) + k.shape('M6 42Q0 42 1 36Q2 32 5 33', 'none', { w: 1.8 })
        + k.shape('M1.6 28Q2 31 5.6 30.6Q8 29.6 7.4 27.4Z', 'mid', { w: 0 }) + '</g>';
    }
    s += k.shape('M25 18.2Q32 15 39 18.2Z', 'mid', { w: 1.4 }) + k.shape('M25 45.8Q32 49 39 45.8Z', 'mid', { w: 1.4 });
    return s;
  }),
  'stamp-secret': (uid) => stamp(uid, 'SECRET', WASH, { rot: -12, len: 42 }),
  'stamp-delivered': (uid) => stamp(uid, 'DELIVERED', INK, { rot: 8, size: 9.4, len: 48 }),
  'stamp-burned': (uid) => stamp(uid, 'BURNED', BLOOD, { rot: -20, len: 44, hollow: true }),
  seal: (uid) => svg(uid, [], (k) => {
    // a blob of red wax, pressed with a crowned initial; the only red fill in the art
    let d = 'M32 4';
    const r = k.rng(9);
    for (let i = 1; i <= 16; i++) { const a = i / 16 * Math.PI * 2 - Math.PI / 2, rr = 26 + (i % 2 ? 2.6 : -1) + r() * 1.6; d += `Q${f(32 + Math.cos(a - .2) * (rr + 2))} ${f(32 + Math.sin(a - .2) * (rr + 2))} ${f(32 + Math.cos(a) * rr)} ${f(32 + Math.sin(a) * rr)}`; }
    let s = `<path d="${d}Z" fill="${BLOOD}" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<path d="M14 56Q12 62 16 62Q19 61 17 55Z" fill="${BLOOD}" stroke="${INK}" stroke-width="1"/>`; // a drip
    s += circle(32, 32, 17, 'none', INK, 1.4) + `<circle cx="32" cy="32" r="18.6" fill="none" stroke="${PAPER}" stroke-width=".8" opacity=".5"/>`;
    s += `<path d="M22 28L24 18L28 23L32 15L36 23L40 18L42 28Z" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`; // the crown
    s += `<path d="M24 31H40M27 44V31M37 44V31M27 37.6Q32 34 37 37.6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`; // an H for the house
    s += `<path d="M10 24Q14 12 26 8" fill="none" stroke="${PAPER}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`; // the shine on the wax
    return s;
  }),
  telegram: (uid) => svg(uid, ['light', 'dark'], (k) => {
    let s = `<g transform="rotate(-6 32 32)">`;
    s += k.shape('M8 6H56V58H8Z', 'paper', { w: 2.2 });
    s += k.shape('M8 41H56V58H8Z', 'light', { w: 1.6 }); // the lower third, folded back and in shade
    s += k.shape('M10 9H54V15H10Z', 'ink', { w: 0 }) + k.line('M14 12H24M28 12H50', 1.2, { color: PAPER }); // the printed head
    s += k.line('M12 19H52M12 23H40', .8);
    // the pasted strips of the message
    for (const [y, w] of [[28, 38], [33, 30], [38, 34]]) s += k.shape(`M12 ${y}H${12 + w}V${y + 3.2}H12Z`, 'paper', { w: .8 }) + k.line(`M14 ${y + 1.6}H${10 + w}`, 1.6, { color: INK });
    s += k.line('M8 41H56', 1.6) + k.line('M12 46H40M12 50H34', .8) + k.shape('M46 44H54V54H46Z', 'dark', { w: 1 });
    return s + '</g>';
  }),
};
