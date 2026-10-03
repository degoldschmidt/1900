// The engraving kit: soot and ink on stained paper. Every vignette, portrait and glyph is drawn with it.
// All functions return SVG strings. A kit is made per drawing: makeKit({ uid, seed }) so pattern ids never clash.
// Light falls from the upper left: lit faces take 'light' or 'vert', faces turned away 'dark', deep shadow 'black'.
// Far layers pass { far:true }: sepia lines, thinner, the way an engraver fades distance.

export const INK = '#2b1d12';
export const PAPER = '#efe2c4';
export const SEPIA = '#9c7b52';
export const WASH = '#2f3a5c';
export const BLOOD = '#8c1d12';

const f = (n) => Math.round(n * 10) / 10;

export function rng(seed = 1) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// pattern tiles: [id, size, rotate, body(stroke, width)]
const TILES = [
  ['light', 5, 45, (s, w) => `<path d="M0 2.5H5" stroke="${s}" stroke-width="${w * .75}"/>`],
  ['mid', 3.4, 45, (s, w) => `<path d="M0 1.7H3.4" stroke="${s}" stroke-width="${w * .9}"/>`],
  ['dark', 3.2, 45, (s, w) => `<path d="M0 1.6H3.2M1.6 0V3.2" stroke="${s}" stroke-width="${w * .85}"/>`],
  ['black', 2.2, 45, (s, w) => `<path d="M0 1.1H2.2M1.1 0V2.2" stroke="${s}" stroke-width="${w * 1.15}"/>`],
  ['vert', 3, 0, (s, w) => `<path d="M1.5 0V3" stroke="${s}" stroke-width="${w * .72}"/>`],
  ['horiz', 3, 0, (s, w) => `<path d="M0 1.5H3" stroke="${s}" stroke-width="${w * .55}"/>`],
  ['glass', 1.8, 0, (s, w) => `<path d="M0 .9H1.8" stroke="${s}" stroke-width="${w * 1.05}"/>`],
  ['water', 24, 0, (s, w) => `<path d="M0 3Q3 1.6 6 3T12 3T18 3T24 3" fill="none" stroke="${s}" stroke-width="${w * .6}"/>`, 6],
  ['tiles', 8, 0, (s, w) => `<path d="M0 4.5Q2 1 4 4.5Q6 1 8 4.5M-4 0Q-2 -3.5 0 0Q2 -3.5 4 0Q6 -3.5 8 0" fill="none" stroke="${s}" stroke-width="${w * .5}"/>`, 4.5],
  ['brick', 12, 0, (s, w) => `<path d="M0 .3H12M0 3.3H12M3 .3V3.3M9 3.3V6" stroke="${s}" stroke-width="${w * .45}"/>`, 6],
];
function stippleTile(id, s, bg, w) {
  const r = rng(7);
  let dots = '';
  for (let i = 0; i < 26; i++) dots += `<circle cx="${f(r() * 14)}" cy="${f(r() * 14)}" r="${f((.35 + r() * .35) * w)}" fill="${s}"/>`;
  return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${bg}"/>${dots}</pattern>`;
}

/** A kit bound to one drawing. */
export function makeKit({ uid = 'k', seed = 1 } = {}) {
  const k = { uid, ink: INK, paper: PAPER, sepia: SEPIA, wash: WASH, blood: BLOOD, f, lights: [], rand: rng(seed) };
  k.rng = rng;
  const pid = (tone, far) => `${tone}${far ? 'F' : ''}-${uid}`;

  /** <defs>: hatch patterns near and far, the rough-ink filter. The frame adds it once per SVG. */
  k.defs = () => {
    let s = '';
    for (const far of [false, true]) {
      const stroke = far ? SEPIA : INK, w = far ? .8 : 1, bg = PAPER;
      for (const [id, size, rot, body, h] of TILES) {
        const H = h ?? size;
        s += `<pattern id="${pid(id, far)}" width="${size}" height="${H}" patternUnits="userSpaceOnUse"${rot ? ` patternTransform="rotate(${rot})"` : ''}><rect width="${size}" height="${H}" fill="${bg}"/>${body(stroke, w)}</pattern>`;
      }
      s += stippleTile(pid('stipple', far), stroke, bg, w);
    }
    s += `<filter id="rough-${uid}" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>`;
    return s;
  };

  /** A paper-backed shape, hatched in a tone: paper light mid dark black vert horiz glass water tiles brick stipple none. */
  k.shape = (d, tone = 'mid', o = {}) => {
    const fill = tone === 'none' ? 'none' : tone === 'paper' ? PAPER : tone === 'ink' ? INK : `url(#${pid(tone, o.far)})`;
    const w = o.w ?? (o.far ? .6 : 1.15);
    return `<path d="${d}" fill="${fill}"${w ? ` stroke="${o.far ? SEPIA : INK}" stroke-width="${w}" stroke-linejoin="round"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };
  /** An inked stroke. */
  k.line = (d, w = 1, o = {}) => `<path d="${d}" fill="none" stroke="${o.far ? SEPIA : o.color || INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.op ? ` opacity="${o.op}"` : ''}/>`;

  // ---------- path helpers (return d strings) ----------
  k.rect = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  k.poly = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (close ? 'Z' : '');
  /** An opening with a round top: x,y is the top-left of the rectangle part's springing line minus the arch. */
  k.arch = (x, y, w, h) => { const r = w / 2; return `M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`; };
  /** A pointed (gothic) arch. */
  k.gothic = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w * .6)}Q${f(x)} ${f(y + w * .1)} ${f(x + w / 2)} ${f(y)}Q${f(x + w)} ${f(y + w * .1)} ${f(x + w)} ${f(y + w * .6)}V${f(y + h)}Z`;
  /** A dome on a base line; h is the rise. */
  k.dome = (cx, by, r, h = r) => `M${f(cx - r)} ${f(by)}C${f(cx - r)} ${f(by - h * 1.33)} ${f(cx + r)} ${f(by - h * 1.33)} ${f(cx + r)} ${f(by)}Z`;
  /** An onion dome. */
  k.onion = (cx, by, w, h) => `M${f(cx - w * .32)} ${f(by)}C${f(cx - w * .75)} ${f(by - h * .35)} ${f(cx - w * .5)} ${f(by - h * .62)} ${f(cx)} ${f(by - h)}C${f(cx + w * .5)} ${f(by - h * .62)} ${f(cx + w * .75)} ${f(by - h * .35)} ${f(cx + w * .32)} ${f(by)}Z`;
  /** A spire: a tall triangle. */
  k.spire = (cx, by, w, h) => `M${f(cx - w / 2)} ${f(by)}L${f(cx)} ${f(by - h)}L${f(cx + w / 2)} ${f(by)}Z`;
  /** A pitched roof over a span. */
  k.gable = (x, by, w, h) => `M${f(x)} ${f(by)}L${f(x + w / 2)} ${f(by - h)}L${f(x + w)} ${f(by)}Z`;

  // ---------- building blocks (return SVG) ----------
  /** A window grid. Lit windows are remembered in k.lights and glow when the frame draws night. */
  k.windows = (x, y, w, h, cols, rows, o = {}) => {
    const gw = w / cols, gh = h / rows, ww = gw * (o.ww ?? .45), wh = gh * (o.wh ?? .55);
    let s = '';
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const wx = x + c * gw + (gw - ww) / 2, wy = y + r * gh + (gh - wh) / 2;
      s += k.shape(o.arched ? k.arch(wx, wy, ww, wh) : k.rect(wx, wy, ww, wh), 'glass', { w: .5, far: o.far });
      if (k.rand() < (o.lit ?? .35)) k.lights.push([f(wx), f(wy), f(ww), f(wh)]);
    }
    return s;
  };
  /** A town house: body, roof, windows, cornice. roof: pitch mansard flat gable step dome none. */
  k.building = (x, by, w, h, o = {}) => {
    const tone = o.tone ?? 'light', far = o.far, rh = o.rh ?? Math.min(w * .45, h * .5);
    let s = k.shape(k.rect(x, by - h, w, h), tone, { far, w: far ? .5 : .9 });
    const roof = o.roof ?? 'pitch';
    if (roof === 'pitch') s += k.shape(k.poly([[x - 2, by - h], [x + w * .15, by - h - rh * .6], [x + w * .85, by - h - rh * .6], [x + w + 2, by - h]]), 'tiles', { far });
    if (roof === 'mansard') s += k.shape(k.poly([[x - 2, by - h], [x + 3, by - h - rh * .55], [x + w - 3, by - h - rh * .55], [x + w + 2, by - h]]), 'dark', { far });
    if (roof === 'gable') s += k.shape(k.gable(x, by - h, w, rh), 'tiles', { far });
    if (roof === 'step') {
      const n = 4, sw = w / (2 * n + 1);
      const pts = [[x, by - h]];
      for (let i = 0; i < n; i++) { pts.push([x + sw * i, by - h - rh * (i + 1) / (n + 1)], [x + sw * (i + 1), by - h - rh * (i + 1) / (n + 1)]); }
      pts.push([x + w / 2 - sw / 2, by - h - rh], [x + w / 2 + sw / 2, by - h - rh]);
      for (let i = n - 1; i >= 0; i--) { pts.push([x + w - sw * (i + 1), by - h - rh * (i + 1) / (n + 1)], [x + w - sw * i, by - h - rh * (i + 1) / (n + 1)]); }
      pts.push([x + w, by - h]);
      s += k.shape(k.poly(pts), tone === 'light' ? 'mid' : tone, { far });
    }
    if (roof === 'dome') s += k.shape(k.dome(x + w / 2, by - h, w * .32, w * .3), 'dark', { far });
    if (roof === 'flat') s += k.line(`M${f(x - 2)} ${f(by - h)}H${f(x + w + 2)}`, far ? .6 : 1.4, { far });
    if (o.windows !== false && w > 10 && h > 14) {
      const floors = o.floors ?? Math.max(1, Math.round((h - 6) / 13)), cols = o.cols ?? Math.max(1, Math.round(w / 10));
      s += k.windows(x + 2, by - h + 4, w - 4, h - 8, cols, floors, { far, lit: o.lit });
    }
    return s;
  };
  /** A row of generic buildings for depth. style: north (gables) south (flat, tiles) east (domes) orient (domes and minarets). */
  k.skyline = (x0, x1, by, o = {}) => {
    const r = rng(o.seed ?? 3), far = o.far ?? true, style = o.style ?? 'north';
    let s = '', x = x0;
    while (x < x1) {
      const w = (o.wMin ?? 14) + r() * ((o.wMax ?? 30) - (o.wMin ?? 14)), h = (o.hMin ?? 14) + r() * ((o.hMax ?? 34) - (o.hMin ?? 14));
      const pick = r();
      let roof = 'pitch';
      if (style === 'north') roof = pick < .45 ? 'gable' : pick < .6 ? 'step' : 'pitch';
      if (style === 'south') roof = pick < .5 ? 'flat' : 'pitch';
      if (style === 'east') roof = pick < .2 ? 'dome' : pick < .55 ? 'pitch' : 'flat';
      if (style === 'orient') roof = pick < .3 ? 'dome' : 'flat';
      if (style === 'paris') roof = 'mansard';
      s += k.building(x, by, w, h, { far, roof, tone: o.tone ?? (r() < .5 ? 'light' : 'mid'), lit: o.lit ?? .25 });
      if (style === 'orient' && r() < .18) s += k.minaret(x + w + 2, by, 3.2, h + 30 + r() * 20, { far });
      if ((style === 'east' || style === 'north') && r() < .07) s += k.shape(k.spire(x + w / 2, by - h - 4, 6, 26 + r() * 14), 'mid', { far });
      if (o.chimneys !== false && style !== 'orient' && r() < .22) { // soot: a chimney and its trail
        const cx = x + w * (.2 + r() * .6), cy = by - h - 6;
        s += k.shape(k.rect(cx - 1.5, cy, 3, 7), 'black', { far, w: .4 }) + k.line(`M${f(cx)} ${f(cy)}q${f(6 + r() * 6)} ${f(-6 - r() * 4)} ${f(18 + r() * 14)} ${f(-8 - r() * 6)}`, 1.6, { far, op: .45 });
      }
      x += w + (r() < .2 ? 3 : -1);
    }
    return s;
  };
  /** A slim minaret with a balcony and a pencil cap. */
  k.minaret = (cx, by, w, h, o = {}) => {
    const far = o.far;
    return k.shape(k.rect(cx - w / 2, by - h, w, h), 'vert', { far, w: .6 })
      + k.shape(k.rect(cx - w * .9, by - h * .72, w * 1.8, 2.2), 'dark', { far, w: .5 })
      + k.shape(k.spire(cx, by - h, w * 1.1, h * .18), 'dark', { far, w: .5 });
  };
  /** Foreground: cobbles quay water river hills grass, from y to the bottom edge. */
  k.ground = (kind = 'cobbles', y = 208) => {
    const H = 240 - y;
    if (kind === 'water' || kind === 'river') return k.water(y, 240, { river: kind === 'river' });
    if (kind === 'hills') return k.shape(`M-5 ${f(y + 6)}Q120 ${f(y - 10)} 260 ${f(y + 4)}T520 ${f(y)}T650 ${f(y + 4)}V245H-5Z`, 'stipple');
    if (kind === 'grass') return k.shape(k.rect(-5, y, 650, H + 5), 'stipple', { w: 0 }) + k.line(`M-5 ${y}H645`, 1.2);
    let s = k.shape(k.rect(-5, y, 650, H + 5), kind === 'quay' ? 'vert' : 'paper', { w: 0 }) + k.line(`M-5 ${y}H645`, 1.4);
    if (kind === 'cobbles') {
      const r = rng(11);
      for (let row = 0; row * 5 < H; row++) {
        const yy = y + 4 + row * 5 + row * row * .6;
        for (let x = (row % 2) * 6 - 6; x < 650; x += 9 + row * 1.5) s += k.line(`M${f(x)} ${f(yy)}q${f(3 + row * .5)} ${f(-2 - r())} ${f(7 + row)} 0`, .5);
      }
    }
    if (kind === 'quay') {
      for (let x = 0; x < 650; x += 22) s += k.line(`M${x} ${y}V${y + H}`, .5);
      s += k.line(`M-5 ${y + 9}H645`, .7);
      for (let x = 40; x < 640; x += 110) s += k.shape(`M${x} ${y}v-6q0 -3 3 -3t3 3v6Z`, 'black', { w: .6 });
    }
    return s;
  };
  /** A band of water with engraved ripples. */
  k.water = (y0, y1 = 240, o = {}) => {
    let s = k.shape(k.rect(-5, y0, 650, y1 - y0 + 5), 'water', { w: 0, far: o.far });
    const r = rng(o.seed ?? 5);
    for (let i = 0; i < 26; i++) {
      const y = y0 + 3 + r() * (y1 - y0 - 4), x = r() * 640, w = 10 + r() * 40 * ((y - y0) / (y1 - y0) + .3);
      s += k.line(`M${f(x)} ${f(y)}h${f(w)}`, .55 + (y - y0) / (y1 - y0) * .5, { far: o.far });
    }
    return s + k.line(`M-5 ${y0}H645`, 1);
  };
  /** A band of coal-smoke haze, e.g. along a horizon. */
  k.haze = (y, h = 16, op = .35) => `<rect x="-5" y="${f(y)}" width="650" height="${f(h)}" fill="url(#${pid('stipple', true)})" opacity="${op}"/>`;
  /** A reflection of some SVG in water whose surface is at y. */
  k.reflect = (svg, y, op = .28) => `<g transform="translate(0 ${f(2 * y)}) scale(1 -1)" opacity="${op}">${svg}</g>`;
  /** A coal-smoke plume rising and drifting right. */
  k.smoke = (x, y, s = 1, o = {}) => {
    const r = rng(o.seed ?? Math.round(x * 7 + y));
    let out = '';
    for (let i = 0; i < 7; i++) {
      const t = i / 6, cx = x + t * 46 * s + r() * 4, cy = y - t * 30 * s - r() * 4, rr = (3 + t * 9) * s;
      out += k.shape(`M${f(cx - rr)} ${f(cy)}a${f(rr)} ${f(rr * .8)} 0 1 0 ${f(2 * rr)} 0a${f(rr)} ${f(rr * .8)} 0 1 0 ${f(-2 * rr)} 0Z`, i < 3 ? 'dark' : 'stipple', { w: .5, far: i > 4 });
    }
    return out;
  };
  /** Small people: man woman soldier porter priest nun. */
  k.figure = (x, y, s = 1, kind = 'man') => {
    const S = (n) => f(n * s);
    const body = {
      man: `M${f(x)} ${f(y)}l${S(-2)} ${S(-10)}l${S(-.6)} ${S(-6)}q0 ${S(-2)} ${S(1.4)} ${S(-2.4)}h${S(2.4)}q${S(1.4)} ${S(.4)} ${S(1.4)} ${S(2.4)}l${S(-.6)} ${S(6)}l${S(-2)} ${S(10)}Z`,
      woman: `M${f(x - 4 * s)} ${f(y)}q${S(1)} ${S(-9)} ${S(3)} ${S(-12)}l${S(-.4)} ${S(-4)}q0 ${S(-2)} ${S(1.4)} ${S(-2.4)}h0q${S(1.4)} ${S(.4)} ${S(1.4)} ${S(2.4)}l${S(-.4)} ${S(4)}q${S(2)} ${S(3)} ${S(3)} ${S(12)}Z`,
    };
    const b = body[kind === 'woman' || kind === 'nun' ? 'woman' : 'man'];
    const headY = y - 20.5 * s;
    let s2 = k.shape(b, kind === 'priest' || kind === 'nun' ? 'black' : 'dark', { w: .5 });
    s2 += `<circle cx="${f(x)}" cy="${f(headY)}" r="${S(1.9)}" fill="${INK}"/>`;
    if (kind === 'man') s2 += k.shape(k.rect(x - 1.6 * s, headY - 5.2 * s, 3.2 * s, 3.6 * s), 'ink', { w: 0 }) + k.line(`M${f(x - 2.6 * s)} ${f(headY - 1.6 * s)}h${S(5.2)}`, .8 * s);
    if (kind === 'woman') s2 += k.shape(`M${f(x - 4 * s)} ${f(headY - .8 * s)}q${S(4)} ${S(-4)} ${S(8)} 0Z`, 'ink', { w: 0 });
    if (kind === 'soldier') s2 += k.shape(`M${f(x - 2 * s)} ${f(headY - .5 * s)}q${S(2)} ${S(-4)} ${S(4)} 0Z`, 'ink', { w: 0 }) + k.line(`M${f(x)} ${f(headY - 2.6 * s)}v${S(-2.4)}`, .7 * s) + k.line(`M${f(x + 2 * s)} ${f(y - 18 * s)}l${S(3)} ${S(-9)}`, .7 * s);
    if (kind === 'porter') s2 += k.shape(k.rect(x - 2 * s, headY - 3.2 * s, 4 * s, 1.8 * s), 'ink', { w: 0 }) + k.shape(k.rect(x + 1 * s, y - 17 * s, 6 * s, 5 * s), 'mid', { w: .5 });
    if (kind === 'priest') s2 += k.shape(`M${f(x - 3.2 * s)} ${f(headY - 1.4 * s)}h${S(6.4)}l${S(-1)} ${S(-1.6)}h${S(-4.4)}Z`, 'ink', { w: 0 });
    if (kind === 'nun') s2 += k.shape(`M${f(x - 2.8 * s)} ${f(headY + 4 * s)}q0 ${S(-7)} ${S(2.8)} ${S(-7)}q${S(2.8)} 0 ${S(2.8)} ${S(7)}Z`, 'ink', { w: 0 });
    return s2;
  };
  /** Trees: poplar round cypress palm pine. */
  k.tree = (x, y, s = 1, kind = 'round') => {
    const S = (n) => f(n * s);
    const trunk = k.line(`M${f(x)} ${f(y)}v${S(-10)}`, 1.4 * s);
    if (kind === 'poplar') return trunk + k.shape(`M${f(x)} ${f(y - 46 * s)}q${S(6)} ${S(16)} ${S(4)} ${S(38)}h${S(-8)}q${S(-2)} ${S(-22)} ${S(4)} ${S(-38)}Z`, 'mid', { w: .6 });
    if (kind === 'cypress') return trunk + k.shape(`M${f(x)} ${f(y - 40 * s)}q${S(5)} ${S(14)} ${S(3)} ${S(33)}h${S(-6)}q${S(-2)} ${S(-19)} ${S(3)} ${S(-33)}Z`, 'black', { w: .6 });
    if (kind === 'pine') return trunk + k.shape(k.poly([[x, y - 34 * s], [x + 9 * s, y - 8 * s], [x - 9 * s, y - 8 * s]]), 'dark', { w: .6 });
    if (kind === 'palm') {
      let p = k.line(`M${f(x)} ${f(y)}q${S(3)} ${S(-16)} ${S(1)} ${S(-30)}`, 1.6 * s);
      for (const a of [-150, -120, -60, -30, -95, 10, -170]) {
        const r = a * Math.PI / 180;
        p += k.line(`M${f(x + s)} ${f(y - 30 * s)}q${f(Math.cos(r) * 8 * s)} ${f(Math.sin(r) * 8 * s - 3 * s)} ${f(Math.cos(r) * 15 * s)} ${f(Math.sin(r) * 9 * s + 4 * s)}`, 1.1 * s);
      }
      return p;
    }
    return trunk + k.shape(`M${f(x - 10 * s)} ${f(y - 10 * s)}a${S(10)} ${S(9)} 0 1 1 ${S(20)} 0q${S(-10)} ${S(4)} ${S(-20)} 0Z`, 'stipple', { w: .6 });
  };
  /** Boats: steamer sail gondola barge warship liner. dir 1 faces right. */
  k.boat = (x, y, s = 1, kind = 'steamer', dir = 1) => {
    const S = (n) => f(n * s), D = (n) => f(n * s * dir);
    if (kind === 'gondola') return k.shape(`M${f(x - 16 * s * dir)} ${f(y - 6 * s)}q${D(4)} ${S(6)} ${D(14)} ${S(6)}h${D(8)}q${D(8)} 0 ${D(12)} ${S(-8)}q${D(-6)} ${S(5)} ${D(-14)} ${S(4)}h${D(-12)}q${D(-6)} 0 ${D(-8)} ${S(-2)}Z`, 'black', { w: .6 })
      + k.line(`M${f(x + 6 * s * dir)} ${f(y - 2 * s)}l${D(4)} ${S(-16)}`, .8 * s) + k.figure(x + 4 * s * dir, y - 2 * s, .55 * s, 'man');
    if (kind === 'sail') return k.shape(`M${f(x - 12 * s)} ${f(y - 5 * s)}h${S(24)}l${S(-4)} ${S(5)}h${S(-16)}Z`, 'dark', { w: .6 })
      + k.shape(k.poly([[x, y - 6 * s], [x, y - 34 * s], [x + 12 * s * dir, y - 8 * s]]), 'light', { w: .6 });
    if (kind === 'barge') return k.shape(`M${f(x - 18 * s)} ${f(y - 5 * s)}h${S(36)}l${S(-2)} ${S(5)}h${S(-32)}Z`, 'dark', { w: .6 }) + k.shape(k.rect(x - 12 * s, y - 9 * s, 14 * s, 4 * s), 'mid', { w: .5 });
    const big = kind === 'liner', war = kind === 'warship';
    const L = big ? 70 : war ? 54 : 34, H = big ? 9 : 6;
    let o = k.shape(`M${f(x - L / 2 * s * dir)} ${f(y - H * s)}h${D(L)}l${D(-4)} ${S(H)}h${D(-L + 8)}Z`, war ? 'black' : 'dark', { w: .7 });
    o += k.shape(k.rect(x - L * .28 * s, y - (H + 6) * s, L * .5 * s, 6 * s), war ? 'dark' : 'light', { w: .6 });
    if (!war) o += k.windows(x - L * .26 * s, y - (H + 5.5) * s, L * .46 * s, 5 * s, big ? 9 : 5, 1, { lit: .5 });
    const funnels = big ? 3 : war ? 2 : 1;
    for (let i = 0; i < funnels; i++) {
      const fx = x + (i - (funnels - 1) / 2) * 10 * s * dir;
      o += k.shape(k.rect(fx - 2.2 * s, y - (H + 15) * s, 4.4 * s, 9 * s), 'black', { w: .5 });
      if (i === 0) o += k.smoke(fx, y - (H + 16) * s, .7 * s, { seed: Math.round(x) });
    }
    if (war) o += k.line(`M${f(x - 20 * s * dir)} ${f(y - (H + 3) * s)}h${D(-10)}M${f(x + 18 * s * dir)} ${f(y - (H + 3) * s)}h${D(9)}`, 1.2 * s) + k.line(`M${f(x)} ${f(y - (H + 6) * s)}v${S(-16)}`, .7 * s);
    else o += k.line(`M${f(x - L * .4 * s * dir)} ${f(y - H * s)}v${S(-18)}M${f(x + L * .38 * s * dir)} ${f(y - H * s)}v${S(-16)}`, .6 * s);
    return o;
  };
  /** A locomotive with carriages; dir 1 runs right. */
  k.train = (x, y, s = 1, dir = 1, cars = 3) => {
    const S = (n) => f(n * s), D = (n) => f(n * s * dir);
    let o = '';
    for (let i = 0; i < cars; i++) {
      const cx = x - (30 + i * 27) * s * dir;
      o += k.shape(k.rect(cx - 12 * s, y - 13 * s, 24 * s, 10 * s), 'mid', { w: .6 }) + k.shape(k.rect(cx - 13 * s, y - 15 * s, 26 * s, 2.4 * s), 'dark', { w: .5 })
        + k.windows(cx - 11 * s, y - 12 * s, 22 * s, 5 * s, 5, 1, { lit: .6 });
      o += `<circle cx="${f(cx - 7 * s)}" cy="${f(y - 2 * s)}" r="${S(2)}" fill="${INK}"/><circle cx="${f(cx + 7 * s)}" cy="${f(y - 2 * s)}" r="${S(2)}" fill="${INK}"/>`;
    }
    o += k.shape(`M${f(x - 12 * s * dir)} ${f(y - 4 * s)}v${S(-14)}h${D(8)}v${S(5)}h${D(14)}q${D(5)} 0 ${D(5)} ${S(4)}v${S(5)}l${D(3)} 0v${S(2)}Z`, 'black', { w: .6 });
    o += k.shape(k.rect(x + (dir > 0 ? 3 : -6) * s, y - 20 * s, 3 * s, 6 * s), 'black', { w: .4 });
    for (const dx of [-8, -1, 6]) o += `<circle cx="${f(x + dx * s * dir)}" cy="${f(y - 2.5 * s)}" r="${S(3)}" fill="none" stroke="${INK}" stroke-width="${S(1.2)}"/>`;
    return o + k.smoke(x + 4.5 * s * dir, y - 21 * s, .9 * s);
  };
  /** A gas lamp. */
  k.lamp = (x, y, s = 1) => k.line(`M${f(x)} ${f(y)}v${f(-24 * s)}`, 1.1 * s) + k.shape(k.poly([[x - 2.5 * s, y - 24 * s], [x + 2.5 * s, y - 24 * s], [x + 1.6 * s, y - 29 * s], [x - 1.6 * s, y - 29 * s]]), 'light', { w: .6 });
  /** A small flag on a pole. */
  k.flag = (x, y, s = 1, tone = 'dark') => k.line(`M${f(x)} ${f(y)}v${f(-16 * s)}`, .7) + k.shape(`M${f(x)} ${f(y - 16 * s)}q${f(4 * s)} ${f(-2 * s)} ${f(9 * s)} 0v${f(5 * s)}q${f(-5 * s)} ${f(2 * s)} ${f(-9 * s)} 0Z`, tone, { w: .5 });
  /** A harbour crane, jib pointing dir. */
  k.crane = (x, y, s = 1, dir = 1) => k.shape(k.poly([[x - 5 * s, y], [x - 2 * s, y - 34 * s], [x + 2 * s, y - 34 * s], [x + 5 * s, y]]), 'dark', { w: .6 })
    + k.line(`M${f(x)} ${f(y - 34 * s)}l${f(30 * s * dir)} ${f(-8 * s)}M${f(x)} ${f(y - 24 * s)}l${f(30 * s * dir)} ${f(-18 * s)}M${f(x + 28 * s * dir)} ${f(y - 41 * s)}v${f(16 * s)}`, .8 * s);
  /** Arched stone bridge from x0 to x1 with deck at y and n arches; or kind 'girder'. */
  k.bridge = (x0, x1, y, o = {}) => {
    const n = o.arches ?? 5, w = (x1 - x0) / n, h = o.h ?? 18;
    if (o.kind === 'girder') {
      let s = k.shape(k.rect(x0, y - 3, x1 - x0, 5), 'dark', { w: .7, far: o.far });
      for (let i = 0; i < n; i++) {
        const a = x0 + i * w;
        s += k.line(`M${f(a)} ${f(y - 3)}Q${f(a + w / 2)} ${f(y - 3 - (o.rise ?? 14))} ${f(a + w)} ${f(y - 3)}`, 1.4, { far: o.far });
        for (let j = 1; j < 6; j++) s += k.line(`M${f(a + w * j / 6)} ${f(y - 3)}V${f(y - 3 - (o.rise ?? 14) * (1 - Math.pow(2 * j / 6 - 1, 2)))}`, .5, { far: o.far });
        s += k.shape(k.rect(a - 3, y, 6, h), 'vert', { w: .6, far: o.far });
      }
      return s;
    }
    let d = `M${f(x0)} ${f(y)}H${f(x1)}V${f(y + h)}`;
    for (let i = n - 1; i >= 0; i--) { const a = x0 + i * w; d += `H${f(a + w * .88)}A${f(w * .38)} ${f(h * .75)} 0 0 0 ${f(a + w * .12)} ${f(y + h)}`; }
    d += `H${f(x0)}Z`;
    return k.shape(d, o.tone ?? 'mid', { w: .8, far: o.far }) + k.line(`M${f(x0)} ${f(y - 3)}H${f(x1)}`, .8, { far: o.far });
  };
  /** A distant mountain range along y. */
  k.mountains = (y, o = {}) => {
    const r = rng(o.seed ?? 9);
    let d = `M-5 ${y}`, x = -5;
    while (x < 645) { const w = 30 + r() * 50, h = (o.h ?? 40) * (.5 + r() * .6); d += `L${f(x + w / 2)} ${f(y - h)}L${f(x + w)} ${f(y - r() * 8)}`; x += w; }
    d += `L645 ${y}Z`;
    let s = k.shape(d, 'light', { far: true, w: .7 });
    if (o.snow !== false) { // snow caps: short ink ticks on the lit side of each peak
      const r2 = rng(o.seed ?? 9); x = -5;
      while (x < 645) { const w = 30 + r2() * 50, h = (o.h ?? 40) * (.5 + r2() * .6); r2(); s += k.line(`M${f(x + w / 2)} ${f(y - h)}l${f(-w * .12)} ${f(h * .25)}`, .7, { far: true }); x += w; }
    }
    return s;
  };
  return k;
}
