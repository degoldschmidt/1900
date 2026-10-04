// The postcard kit: chromolithograph drawing. Flat inks under a dark key line, a second, darker stone for shadow, a
// lighter one for the lit faces. Every ink goes through the light (light.js), so a card drawn once at noon is drawn
// again at dusk with nothing in the city's module changed. Functions return SVG strings in card space (600 × 400).
//
// While a city draws, it also registers its living parts on the kit: lamps (glows), lit windows, movers, smoke,
// flags, water shimmer, walls for placards and spots for flags; compose.js turns them into the animated layers.

import { mix, shadow, lit, lum } from './color.js';
import { inkOf, glowOf } from './light.js';

export const CW = 600, CH = 400;
/** The scene's window inside the frame. Cities draw anywhere; the card shows this much. */
export const WIN = { x: 26, y: 26, w: 548, h: 348, r: 26 };
export const f = (n) => Math.round(n * 10) / 10;

export function rng(seed = 1) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** 1914 uniforms: coat, trousers, headgear and its colour. */
export const UNIFORM = {
  AH: { coat: '#7a8796', legs: '#56606e', hat: 'kepi', hatC: '#6d7987' },
  DE: { coat: '#7c826e', legs: '#5e6352', hat: 'pickel', hatC: '#3a3a34' },
  FR: { coat: '#3f5a92', legs: '#b8322c', hat: 'kepi', hatC: '#b8322c' },
  GB: { coat: '#8a7a52', legs: '#7a6b47', hat: 'cap', hatC: '#7a6b47' },
  RU: { coat: '#9c9468', legs: '#5f5a44', hat: 'cap', hatC: '#5f5a44' },
  RS: { coat: '#6e6e4c', legs: '#58583c', hat: 'sajkaca', hatC: '#58583c' },
  BE: { coat: '#2b3346', legs: '#3d4a6b', hat: 'shako', hatC: '#1f2430' },
  NL: { coat: '#6a7a6a', legs: '#4f5a4f', hat: 'kepi', hatC: '#4f5a4f' },
  CH: { coat: '#4a5f7c', legs: '#3c4d66', hat: 'kepi', hatC: '#3c4d66' },
  IT: { coat: '#7d806a', legs: '#5c5f4c', hat: 'kepi', hatC: '#5c5f4c' },
  OT: { coat: '#8e8360', legs: '#6b6248', hat: 'kabalak', hatC: '#7a6f50' },
  RO: { coat: '#6f7a7e', legs: '#4f585c', hat: 'kepi', hatC: '#4f585c' },
  GR: { coat: '#7c7a5a', legs: '#5d5b42', hat: 'kepi', hatC: '#5d5b42' },
  ES: { coat: '#4f6177', legs: '#a8382e', hat: 'kepi', hatC: '#4f6177' },
  PT: { coat: '#5d6a78', legs: '#4a5562', hat: 'kepi', hatC: '#4a5562' },
  DK: { coat: '#4a586e', legs: '#3c4758', hat: 'kepi', hatC: '#3c4758' },
  SE: { coat: '#3f4f6e', legs: '#2f3b52', hat: 'kepi', hatC: '#2f3b52' },
};

/** Flags of 1914, drawn in a w × h box at the origin. */
export const FLAGS = {
  AH: (w, h) => band(w, h, ['#111111', '#f4c400']),
  HU: (w, h) => band(w, h, ['#c8102e', '#ffffff', '#3a7d44']),
  DE: (w, h) => band(w, h, ['#111111', '#ffffff', '#d4202a']),
  FR: (w, h) => vband(w, h, ['#2b4b9b', '#ffffff', '#d4202a']),
  BE: (w, h) => vband(w, h, ['#111111', '#f4c400', '#d4202a']),
  NL: (w, h) => band(w, h, ['#c8102e', '#ffffff', '#21468b']),
  RU: (w, h) => band(w, h, ['#ffffff', '#1f4fa0', '#d4202a']),
  RS: (w, h) => band(w, h, ['#c8102e', '#21468b', '#ffffff']),
  IT: (w, h) => vband(w, h, ['#2b8a3e', '#ffffff', '#d4202a']) + `<rect x="${f(w * .42)}" y="${f(h * .3)}" width="${f(w * .16)}" height="${f(h * .4)}" fill="#d4202a" stroke="#2b5fb0" stroke-width="${f(h * .04)}"/>`,
  ES: (w, h) => `<rect width="${w}" height="${h}" fill="#c8102e"/><rect y="${f(h * .25)}" width="${w}" height="${f(h * .5)}" fill="#f4c400"/>`,
  PT: (w, h) => `<rect width="${w}" height="${h}" fill="#d4202a"/><rect width="${f(w * .4)}" height="${h}" fill="#2b7a3e"/><circle cx="${f(w * .4)}" cy="${f(h / 2)}" r="${f(h * .22)}" fill="#f4c400"/>`,
  CH: (w, h) => `<rect width="${w}" height="${h}" fill="#d4202a"/><path d="M${f(w / 2 - h * .08)} ${f(h * .2)}h${f(h * .16)}v${f(h * .22)}h${f(h * .22)}v${f(h * .16)}h${f(-h * .22)}v${f(h * .22)}h${f(-h * .16)}v${f(-h * .22)}h${f(-h * .22)}v${f(-h * .16)}h${f(h * .22)}Z" fill="#ffffff"/>`,
  DK: (w, h) => `<rect width="${w}" height="${h}" fill="#c8102e"/><path d="M${f(w * .3)} 0h${f(h * .14)}v${h}h${f(-h * .14)}ZM0 ${f(h * .43)}h${w}v${f(h * .14)}H0Z" fill="#ffffff"/>`,
  SE: (w, h) => `<rect width="${w}" height="${h}" fill="#1f5fa8"/><path d="M${f(w * .3)} 0h${f(h * .16)}v${h}h${f(-h * .16)}ZM0 ${f(h * .42)}h${w}v${f(h * .16)}H0Z" fill="#f4c400"/>`,
  GB: (w, h) => `<rect width="${w}" height="${h}" fill="#1f3b7a"/><path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="#ffffff" stroke-width="${f(h * .2)}"/><path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="#c8102e" stroke-width="${f(h * .07)}"/><path d="M${f(w / 2)} 0V${h}M0 ${f(h / 2)}H${w}" stroke="#ffffff" stroke-width="${f(h * .32)}"/><path d="M${f(w / 2)} 0V${h}M0 ${f(h / 2)}H${w}" stroke="#c8102e" stroke-width="${f(h * .18)}"/>`,
  GR: (w, h) => { let s = ''; for (let i = 0; i < 9; i++) s += `<rect y="${f(h * i / 9)}" width="${w}" height="${f(h / 9 + .2)}" fill="${i % 2 ? '#ffffff' : '#1f5fa8'}"/>`; return s + `<rect width="${f(w * .38)}" height="${f(h * 5 / 9)}" fill="#1f5fa8"/><path d="M${f(w * .19)} 0V${f(h * 5 / 9)}M0 ${f(h * 5 / 18)}H${f(w * .38)}" stroke="#ffffff" stroke-width="${f(h / 9)}"/>`; },
  OT: (w, h) => `<rect width="${w}" height="${h}" fill="#c8102e"/><circle cx="${f(w * .42)}" cy="${f(h / 2)}" r="${f(h * .26)}" fill="#ffffff"/><circle cx="${f(w * .47)}" cy="${f(h / 2)}" r="${f(h * .21)}" fill="#c8102e"/><path d="${star(w * .62, h / 2, h * .12)}" fill="#ffffff"/>`,
  RO: (w, h) => vband(w, h, ['#21468b', '#f4c400', '#c8102e']),
  BG: (w, h) => band(w, h, ['#ffffff', '#2b8a3e', '#c8102e']),
};
function band(w, h, cs) { return cs.map((c, i) => `<rect y="${f(h * i / cs.length)}" width="${w}" height="${f(h / cs.length + .3)}" fill="${c}"/>`).join(''); }
function vband(w, h, cs) { return cs.map((c, i) => `<rect x="${f(w * i / cs.length)}" width="${f(w / cs.length + .3)}" height="${h}" fill="${c}"/>`).join(''); }
function star(cx, cy, r) { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .42 : r; d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * q)} ${f(cy + Math.sin(a) * q)}`; } return d + 'Z'; }

/**
 * A kit for one card. pal: the city's inks (keys or hex); L: the light (light.js); war: peace tension war;
 * nation: the city's nation (flags, uniforms, placards).
 */
export function makePaint({ pal = {}, L, seed = 1, uid = 'pc', war = 'peace', nation = 'GB', flag = null, bills = null } = {}) {
  const P = { pal, L, war, nation, flagNation: flag ?? nation, uid, f, seed, depth: 0, bills };
  P.r = rng(seed);
  P.wr = rng(seed * 7 + 1);   // lit windows: always two draws a window, so the lit set only grows as the light goes
  P.xr = rng(seed * 13 + 5);  // war dressing: placards, bills, flags from windows
  P.rng = rng;
  P.layer = 'mid';
  /** The slot above the layer being drawn, where its living parts go. */
  P.zOf = () => (P.layer === 'back' ? 'back' : P.layer === 'front' ? 'fore' : 'street');
  P._placards = 0; P._wflags = 0;
  // living parts, registered while drawing
  P.sprites = []; P.glows = []; P.walls = []; P.flagSpots = []; P.street = null;

  // ---------- inks ----------
  P.c = (c) => (c && pal[c]) || c;
  P.ink = (c, d = P.depth) => inkOf(L, P.c(c), d);
  P.dark = (c, k = .3, d = P.depth) => inkOf(L, shadow(P.c(c), k), d);
  P.light = (c, k = .22, d = P.depth) => inkOf(L, lit(P.c(c), k), d);
  P.keyC = (d = P.depth) => inkOf(L, P.c(pal.key ?? '#2b2620'), d);
  P.glow = (c) => glowOf(L, c);
  /** Draw `fn` at an aerial depth (0 front … 1 horizon): fog and haze thicken, the key line thins. */
  P.far = (d, fn) => { const was = P.depth; P.depth = d; try { return fn(); } finally { P.depth = was; } };
  const kw = (o) => f((o.w ?? 1.05) * (1 - P.depth * .45));

  // ---------- marks ----------
  /** A flat ink with its key line. o: { w (line width), k:false (no line), op } */
  P.fill = (d, c, o = {}) => `<path d="${d}" fill="${P.ink(c)}"${o.k === false ? '' : ` stroke="${P.keyC()}" stroke-width="${kw(o)}" stroke-linejoin="round"`}${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
  /** A flat ink without a line. */
  P.flat = (d, c, o = {}) => `<path d="${d}" fill="${o.raw ? c : P.ink(c)}"${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
  /** The shadow stone over a shape (no line). */
  P.shade = (d, c, k = .3, o = {}) => `<path d="${d}" fill="${P.dark(c, k)}"${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
  /** The highlight stone. */
  P.lite = (d, c, k = .25, o = {}) => `<path d="${d}" fill="${P.light(c, k)}"${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
  /** A line in an ink (default the key). */
  P.line = (d, c = null, w = 1, o = {}) => `<path d="${d}" fill="none" stroke="${c ? P.ink(c) : P.keyC()}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${o.op != null ? ` opacity="${o.op}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
  /** Crayon stipple inside a path: the lithographer's grain on a shaded face. */
  P.stipple = (d, c, n = 40, o = {}) => {
    const id = `st${uid}${++P._st}`;
    const bb = o.box ?? [0, 0, CW, CH];
    const r = rng(o.seed ?? n * 7 + P._st);
    let dots = '';
    for (let i = 0; i < n; i++) dots += `<circle cx="${f(bb[0] + r() * bb[2])}" cy="${f(bb[1] + r() * bb[3])}" r="${f(.4 + r() * .7)}"/>`;
    return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})" fill="${P.dark(c, o.k ?? .35)}" opacity="${o.op ?? .55}">${dots}</g>`;
  };
  P._st = 0;

  // ---------- geometry (d strings) ----------
  P.rect = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  P.poly = (pts, close = true) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (close ? 'Z' : '');
  P.circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  P.ellipse = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
  P.arch = (x, y, w, h) => { const r = w / 2; return `M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`; };
  P.gothic = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w * .6)}Q${f(x)} ${f(y + w * .1)} ${f(x + w / 2)} ${f(y)}Q${f(x + w)} ${f(y + w * .1)} ${f(x + w)} ${f(y + w * .6)}V${f(y + h)}Z`;
  P.dome = (cx, by, r, h = r) => `M${f(cx - r)} ${f(by)}C${f(cx - r)} ${f(by - h * 1.33)} ${f(cx + r)} ${f(by - h * 1.33)} ${f(cx + r)} ${f(by)}Z`;
  P.onion = (cx, by, w, h) => `M${f(cx - w * .32)} ${f(by)}C${f(cx - w * .75)} ${f(by - h * .35)} ${f(cx - w * .5)} ${f(by - h * .62)} ${f(cx)} ${f(by - h)}C${f(cx + w * .5)} ${f(by - h * .62)} ${f(cx + w * .75)} ${f(by - h * .35)} ${f(cx + w * .32)} ${f(by)}Z`;
  P.spire = (cx, by, w, h) => `M${f(cx - w / 2)} ${f(by)}L${f(cx)} ${f(by - h)}L${f(cx + w / 2)} ${f(by)}Z`;
  P.gable = (x, by, w, h) => `M${f(x)} ${f(by)}L${f(x + w / 2)} ${f(by - h)}L${f(x + w)} ${f(by)}Z`;
  /** A lumpy round mass (a tree crown, a cloud): n bumps around an ellipse. */
  P.blob = (cx, cy, rx, ry, n = 9, seed = 1) => {
    const r = rng(seed);
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, j = .88 + r() * .2, x = cx + Math.cos(a) * rx * j, y = cy + Math.sin(a) * ry * j, br = Math.max(rx, ry) * 2.6 / n;
      d += i ? `A${f(br)} ${f(br)} 0 0 1 ${f(x)} ${f(y)}` : `M${f(x)} ${f(y)}`;
    }
    return d + 'Z';
  };

  // ---------- architecture ----------
  /**
   * A grid of windows. By day dark glass with a pale sash; as the light goes some are lit (deterministic per card),
   * drawn in lamp yellow that the night does not dim.
   */
  P.windows = (x, y, w, h, cols, rows, o = {}) => {
    const gw = w / cols, gh = h / rows, ww = gw * (o.ww ?? .5), wh = gh * (o.wh ?? .6);
    const glass = o.glass ?? pal.glass ?? '#3b4a5e', frameC = o.frame ?? pal.sash ?? '#efe6d2';
    let s = '';
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const wx = x + c * gw + (gw - ww) / 2, wy = y + r * gh + (gh - wh) / 2;
      const d = o.arched ? P.arch(wx, wy, ww, wh) : o.gothic ? P.gothic(wx, wy, ww, wh) : P.rect(wx, wy, ww, wh);
      const u = P.wr(), tone = P.wr(), on = u < L.windows * (o.lit ?? 1);
      if (on) s += `<path d="${d}" fill="${P.glow(tone < .3 ? '#ffe1a0' : tone < .8 ? '#ffc96b' : '#ffb35a')}" stroke="${P.keyC()}" stroke-width="${f(.5 * (1 - P.depth * .4))}"/>`;
      else s += `<path d="${d}" fill="${P.ink(glass)}" stroke="${P.ink(frameC)}" stroke-width="${f(.55 * (1 - P.depth * .4))}"/>`;
      if (!on && ww > 4 && !o.plain) s += P.line(`M${f(wx + ww / 2)} ${f(wy + 1)}V${f(wy + wh - .5)}`, frameC, .45);
    }
    return s;
  };
  /**
   * A town house: wall, shadowed side, cornice, windows, roof. o: { c wall, side (shaded width), roof: mansard pitch
   * flat dome none, roofC, cols, floors, shop (awning colours [a, b]), balconies, lit }
   */
  P.facade = (x, by, w, h, o = {}) => {
    const c = o.c ?? pal.wall ?? '#e6d6b4', roofC = o.roofC ?? pal.roof ?? '#7d8aa0';
    let s = P.fill(P.rect(x, by - h, w, h), c);
    if (o.side) s += P.shade(P.rect(x + w - o.side, by - h, o.side, h), c, .22);
    // cornice and string courses
    s += P.fill(P.rect(x - 1.5, by - h - 2, w + 3, 3), o.trim ?? c, { w: .6 });
    const floors = o.floors ?? Math.max(1, Math.round((h - 12) / 14)), cols = o.cols ?? Math.max(1, Math.round(w / 11));
    const shopH = o.shop ? Math.min(16, h * .22) : 0;
    if (o.windows !== false && w > 8 && h > 14) s += P.windows(x + 2, by - h + 5, w - 4 - (o.side ?? 0) * .5, h - 9 - shopH, cols, floors, { lit: o.lit, arched: o.arched });
    if (o.balconies) for (let i = 1; i < floors; i += 2) { const yy = by - h + 5 + (h - 9 - shopH) * (i / floors); s += P.line(`M${f(x + 3)} ${f(yy)}H${f(x + w - 3)}`, o.trim ?? '#3a3a36', .9); }
    if (o.shop) {
      const [a, b] = o.shop;
      s += P.fill(P.rect(x + 1, by - shopH, w - 2, shopH), o.shopC ?? '#5b3d2a', { w: .6 });
      // a striped awning
      const n = Math.max(3, Math.round(w / 7)), aw = (w - 2) / n;
      let st = '';
      for (let i = 0; i < n; i++) st += `<path d="${P.poly([[x + 1 + i * aw, by - shopH], [x + 1 + (i + 1) * aw, by - shopH], [x + 1 + (i + 1) * aw + 2, by - shopH + 6], [x + 1 + i * aw + 2, by - shopH + 6]])}" fill="${P.ink(i % 2 ? a : b)}"/>`;
      s += st + P.line(`M${f(x + 1)} ${f(by - shopH)}h${f(w - 2)}l2 6h${f(-(w - 2))}Z`, null, .5);
      if (L.windows > .2) s += `<path d="${P.rect(x + 3, by - shopH + 7, w - 6, shopH - 8)}" fill="${P.glow('#ffcf7a')}" opacity="${f(Math.min(.9, L.windows * 1.4))}"/>`;
    }
    const roof = o.roof ?? 'pitch', rh = o.rh ?? Math.min(w * .3, 22);
    if (roof === 'mansard') s += P.fill(P.poly([[x - 2, by - h - 1], [x + 4, by - h - rh], [x + w - 4, by - h - rh], [x + w + 2, by - h - 1]]), roofC) + P.windows(x + 6, by - h - rh + 3, w - 12, rh - 5, Math.max(1, Math.round(w / 14)), 1, { ww: .4, lit: (o.lit ?? 1) * .5 });
    if (roof === 'pitch') s += P.fill(P.poly([[x - 2, by - h - 1], [x + w * .2, by - h - rh], [x + w * .8, by - h - rh], [x + w + 2, by - h - 1]]), roofC);
    if (roof === 'gable') s += P.fill(P.gable(x - 1, by - h - 1, w + 2, rh), roofC);
    if (roof === 'dome') s += P.fill(P.dome(x + w / 2, by - h - 1, w * .34, w * .3), roofC);
    if (roof === 'flat') s += P.fill(P.rect(x - 2, by - h - 6, w + 4, 4), o.trim ?? c, { w: .6 });
    if (L.snow && roof !== 'none') s += P.flat(P.poly([[x - 2, by - h - 1], [x + w * .2, by - h - rh * (roof === 'flat' ? .2 : 1)], [x + w * .8, by - h - rh * (roof === 'flat' ? .2 : 1)], [x + w + 2, by - h - 1]]), '#f4f7fa', { op: .9 });
    if (o.placard !== false && w > 26 && h > 36) {
      const pw = Math.min(14, w * .34), ph = pw * 1.35;
      s += P.placard(x + 4 + P.xr() * Math.max(0, w - pw - 8 - (o.side ?? 0)), by - shopH - ph - 4, pw, ph, { chance: o.chance ?? .55 });
    }
    if (o.flagSpot !== false && w > 22 && h > 44) s += P.windowFlag(x + w * (.3 + P.xr() * .4), by - h + 6 + (h - shopH) * .25, { chance: o.flagChance ?? .45 });
    return s;
  };
  /** A row of houses for depth. o: { style: north south paris east orient, hMin hMax wMin wMax, seed, palette [walls], roofC } */
  P.row = (x0, x1, by, o = {}) => {
    const r = rng(o.seed ?? 3), walls = o.walls ?? [pal.wall ?? '#e3d2ae', pal.wall2 ?? '#d9b98f', pal.wall3 ?? '#efe3c8'];
    let s = '', x = x0;
    while (x < x1) {
      const w = (o.wMin ?? 18) + r() * ((o.wMax ?? 36) - (o.wMin ?? 18)), h = (o.hMin ?? 30) + r() * ((o.hMax ?? 60) - (o.hMin ?? 30));
      const st = o.style ?? 'north', p = r();
      const roof = st === 'paris' ? 'mansard' : st === 'south' ? (p < .55 ? 'flat' : 'pitch') : st === 'orient' ? (p < .3 ? 'dome' : 'flat') : st === 'east' ? (p < .2 ? 'dome' : 'pitch') : p < .45 ? 'gable' : 'pitch';
      s += P.facade(x, by, w, h, { c: walls[Math.floor(r() * walls.length)], roof, roofC: o.roofC, side: w * .18, lit: o.lit, flagSpot: o.flagSpot, placard: o.placard });
      x += w - .5;
    }
    return s;
  };
  /** Columns on a base: a portico. */
  P.columns = (x, by, w, h, n, c = pal.stone ?? '#efe7d4') => {
    let s = '';
    const g = w / (n - 1);
    for (let i = 0; i < n; i++) s += P.fill(P.rect(x + i * g - 2.2, by - h, 4.4, h), c, { w: .6 }) + P.shade(P.rect(x + i * g + .6, by - h, 1.6, h), c, .25);
    return s;
  };

  // ---------- nature ----------
  /** Trees in the season's leaves: round (linden, chestnut) plane poplar cypress palm pine birch willow. */
  P.tree = (x, y, s = 1, kind = 'round', o = {}) => {
    const S = (n) => f(n * s), lf = L.leaf;
    const trunkC = o.trunk ?? '#5b4532';
    let out = P.fill(`M${f(x - 1.6 * s)} ${f(y)}L${f(x - 1 * s)} ${f(y - 16 * s)}H${f(x + 1 * s)}L${f(x + 1.6 * s)} ${f(y)}Z`, trunkC, { w: .5 });
    const ever = kind === 'cypress' || kind === 'pine' || kind === 'palm';
    if (!lf.leaf && !ever) { // winter: bare branches, a little snow
      for (const [a, l] of [[-60, 14], [-110, 13], [-80, 18], [-35, 10], [-140, 10]]) { const q = a * Math.PI / 180; out += P.line(`M${f(x)} ${f(y - 12 * s)}l${f(Math.cos(q) * l * s)} ${f(Math.sin(q) * l * s)}`, trunkC, 1.1 * s); }
      return out;
    }
    const seed = Math.round(x * 13 + y * 7);
    if (kind === 'poplar') return out + P.fill(`M${f(x)} ${f(y - 62 * s)}q${S(9)} ${S(20)} ${S(6)} ${S(48)}h${S(-12)}q${S(-3)} ${S(-28)} ${S(6)} ${S(-48)}Z`, lf.leaf, { raw: 1 }) + P.shade(`M${f(x + 1)} ${f(y - 58 * s)}q${S(7)} ${S(18)} ${S(5)} ${S(44)}h${S(-4)}Z`, lf.leaf, .25);
    if (kind === 'cypress') return out + P.fill(`M${f(x)} ${f(y - 58 * s)}q${S(7)} ${S(20)} ${S(4)} ${S(46)}h${S(-8)}q${S(-3)} ${S(-26)} ${S(4)} ${S(-46)}Z`, mix(lf.ever, '#1f3b2a', .4));
    if (kind === 'pine') return out + P.fill(P.poly([[x, y - 46 * s], [x + 13 * s, y - 12 * s], [x - 13 * s, y - 12 * s]]), mix(lf.ever, '#24412e', .5));
    if (kind === 'palm') {
      let p = P.line(`M${f(x)} ${f(y)}q${S(4)} ${S(-20)} ${S(1)} ${S(-40)}`, '#7a5c3c', 2.6 * s);
      for (const a of [-160, -130, -100, -70, -40, -15, 10]) { const q = a * Math.PI / 180; p += P.line(`M${f(x + s)} ${f(y - 40 * s)}q${f(Math.cos(q) * 10 * s)} ${f(Math.sin(q) * 10 * s - 4 * s)} ${f(Math.cos(q) * 20 * s)} ${f(Math.sin(q) * 11 * s + 6 * s)}`, mix(lf.leaf ?? lf.ever, '#2f6b3a', .3), 2 * s); }
      return p;
    }
    // round crowns: a body, a shadowed underside, sunlit dabs on top
    const rx = (kind === 'plane' ? 20 : kind === 'birch' ? 11 : kind === 'willow' ? 18 : 16) * s, ry = (kind === 'birch' ? 20 : 15) * s, cy = y - 16 * s - ry * .8;
    out += `<path d="${P.blob(x, cy, rx, ry, 11, seed)}" fill="${P.ink(lf.leaf)}" stroke="${P.keyC()}" stroke-width="${f(.8 * (1 - P.depth * .4))}"/>`;
    out += `<path d="${P.blob(x + rx * .15, cy + ry * .35, rx * .8, ry * .55, 9, seed + 1)}" fill="${P.ink(lf.dark)}" opacity=".85"/>`;
    const r = rng(seed + 2);
    for (let i = 0; i < 5; i++) out += `<path d="${P.blob(x - rx * .45 + r() * rx * .7, cy - ry * .45 + r() * ry * .5, rx * .26, ry * .2, 6, seed + 3 + i)}" fill="${P.ink(lf.light)}" opacity=".9"/>`;
    if (lf.bloom) for (let i = 0; i < 8; i++) out += `<circle cx="${f(x - rx * .7 + r() * rx * 1.4)}" cy="${f(cy - ry * .6 + r() * ry)}" r="${S(1.6)}" fill="${P.ink(lf.bloom)}"/>`;
    if (kind === 'birch') out += P.line(`M${f(x)} ${f(y - 2)}v${S(-12)}`, '#efe9dc', 1.2 * s);
    return out;
  };
  /** A clipped hedge or a row of shrubs along y. */
  P.hedge = (x0, x1, y, h = 8) => {
    let d = `M${f(x0)} ${f(y)}`;
    for (let x = x0; x < x1; x += 7) d += `q3.5 ${f(-h * 1.3)} 7 0`;
    return P.fill(d + `V${f(y + 2)}H${f(x0)}Z`, L.leaf.dark ?? '#4a5a3c', { w: .6 });
  };
  /** Water from y0 to y1: bands, a sky reflection, and shimmer that compose animates. */
  P.water = (y0, y1, o = {}) => {
    const c = o.c ?? pal.water ?? '#3f86a6', fx0 = o.fx0 ?? WIN.x - 2, fw = (o.fx1 ?? WIN.x + WIN.w + 2) - fx0;
    let s = P.flat(P.rect(fx0, y0, fw, y1 - y0), c);
    s += P.flat(P.rect(fx0, y0, fw, Math.min(8, (y1 - y0) * .25)), lit(P.c(c), .25), { op: .7 });
    const r = rng(o.seed ?? 9);
    for (let i = 0; i < 26; i++) { const y = y0 + 4 + r() * (y1 - y0 - 6), w = 8 + r() * 26 * ((y - y0) / (y1 - y0) + .4), x = fx0 + r() * Math.max(0, fw - w); s += P.line(`M${f(x)} ${f(y)}h${f(w)}`, shadow(P.c(c), .25), .8, { op: .7 }); }
    s += P.line(`M${f(fx0)} ${f(y0)}h${f(fw)}`, null, .8);
    for (let i = 0; i < (o.shimmer ?? 7); i++) P.sprites.push({ kind: 'shimmer', x: (o.x0 ?? WIN.x + 20) + r() * ((o.x1 ?? WIN.x + WIN.w - 40) - (o.x0 ?? WIN.x + 20)), y: y0 + 4 + r() * (y1 - y0 - 8), w: (14 + r() * 24) * (o.glint ?? 1), z: P.zOf(), c: L.night > .5 ? P.glow('#ffd98a') : lit(P.c(c), .55), seed: i });
    return s;
  };
  /**
   * Paving from y0 to the bottom, with joints running to a vanishing point. o: { c, vx, rails: [x…] at the bottom edge,
   * fx0, fx1 (where the paving stops, if not at the window's edges) }
   */
  P.paving = (y0, y1 = WIN.y + WIN.h, o = {}) => {
    const c = o.c ?? pal.ground ?? '#d8c8a2', vx = o.vx ?? 300, fx0 = o.fx0 ?? WIN.x - 2, fw = (o.fx1 ?? WIN.x + WIN.w + 2) - fx0;
    const id = `pv${uid}${++P._st}`;
    let s = `<clipPath id="${id}"><path d="${P.rect(fx0, y0 - 1, fw, y1 - y0 + 3)}"/></clipPath><g clip-path="url(#${id})">`;
    s += P.flat(P.rect(fx0, y0, fw, y1 - y0 + 2), c);
    s += P.flat(P.rect(fx0, y0, fw, 6), shadow(P.c(c), .12), { op: .6 });
    // joints in perspective, and courses closer together toward the horizon
    for (let x = WIN.x - 300; x < WIN.x + WIN.w + 300; x += 34) s += P.line(`M${f(vx + (x - vx) * .08)} ${f(y0)}L${f(x)} ${f(y1)}`, shadow(P.c(c), .2), .5, { op: .55 });
    for (let k = 1; k < 9; k++) { const y = y0 + (y1 - y0) * Math.pow(k / 9, 1.6); s += P.line(`M${WIN.x - 2} ${f(y)}H${WIN.x + WIN.w + 2}`, shadow(P.c(c), .16), .45, { op: .55 }); }
    for (const rx of o.rails ?? []) s += P.line(`M${f(vx + (rx - vx) * .08)} ${f(y0)}L${f(rx)} ${f(y1)}`, '#6d6a66', 1.3) + P.line(`M${f(vx + (rx + 16 - vx) * .08)} ${f(y0)}L${f(rx + 16)} ${f(y1)}`, '#6d6a66', 1.3);
    const pr = rng(o.seed ?? 11);
    if (L.wet) for (let i = 0; i < 9; i++) { const x = WIN.x + pr() * WIN.w, y = y0 + 8 + pr() * (y1 - y0 - 10); s += P.flat(P.ellipse(x, y, 16 + pr() * 22, 2.4), lit(P.c(L.sky.low), .2), { op: .55 }); }
    if (L.snow) s += P.flat(P.rect(fx0, y0, fw, y1 - y0 + 2), '#f2f5f8', { op: .75 });
    return s + '</g>';
  };
  /** A reflection: broken strokes of a colour under something on the water, thinning and breaking up with distance. */
  P.reflect = (x0, x1, y0, h, c, seed = 1, o = {}) => {
    const r = rng(seed);
    let d = '';
    for (let y = y0 + 1; y < y0 + h; y += 2.6) {
      const k = (y - y0) / h;
      for (let x = x0; x < x1;) { const w = 4 + r() * 16 * (1 - k * .6); if (r() < .78 - k * .4) d += `M${f(x + (r() - .5) * 3)} ${f(y)}h${f(w)}`; x += w + 1 + r() * 5 * (1 + k * 2); }
    }
    return `<path d="${d}" stroke="${P.ink(c, .3)}" stroke-width="${f(o.w ?? 1.6)}" opacity="${o.op ?? .55}" stroke-linecap="round"/>`;
  };

  // ---------- people and things ----------
  /**
   * A person, s = 1 about 30 px tall, facing dir. kind: gent boater lady girl child worker soldier officer newsboy
   * priest sailor nun peasant. o: { c (coat/dress), hat, parasol, dir, nation }
   */
  P.person = (x, y, s = 1, kind = 'gent', o = {}) => person(P, x, y, s, kind, o);
  /**
   * A large figure for the foreground, seen from behind and walking into the picture: a gentleman (frock coat,
   * bowler, cane) or a lady (a long pale dress, puffed sleeves, a hat with flowers, a parasol over her shoulder).
   * s = 1 is about 100 px from the ground to the hat. o: { c (coat, dress), hat, flowers, parasol, sash, stride, arm }
   */
  P.figure = (x, by, s = 1, kind = 'gent', o = {}) => figure(P, x, by, s, kind, o);
  /** A colour of clothes as the season would have it: light summer dresses turn to autumn browns, then winter coats. */
  P.dress = (c, salt = 0) => seasonal(P, c, salt);
  /** A row of strolling people between x0 and x1 on y. In rain most carry umbrellas; in autumn and winter, none a parasol. */
  P.crowd = (x0, x1, y, n, o = {}) => {
    const r = rng(o.seed ?? 5);
    let kinds = o.kinds ?? ['gent', 'lady', 'boater', 'lady', 'gent', 'girl'];
    if (o.crisis !== false && war === 'tension') kinds = [...kinds, 'newsboy'];
    if (o.crisis !== false && war === 'war') kinds = [...kinds, 'soldier', 'soldier', 'officer', ...kinds.filter((k) => k !== 'boater')];
    const dresses = o.dresses ?? ['#f3eee2', '#e8b9b3', '#c9d6e6', '#efe3c3', '#b9c9a7'], coats = o.coats ?? ['#2f3440', '#4a3a30', '#3d4a3c', '#5a5450'];
    let s = '';
    const pts = Array.from({ length: n }, () => x0 + r() * (x1 - x0)).sort((a, b) => a - b);
    for (const x of pts) {
      const k = kinds[Math.floor(r() * kinds.length)];
      const c = k === 'lady' || k === 'girl' ? dresses[Math.floor(r() * dresses.length)] : coats[Math.floor(r() * coats.length)];
      s += P.person(x, y + r() * (o.jitter ?? 2), (o.s ?? 1) * (.9 + r() * .2), k, { c, dir: r() < .5 ? 1 : -1, parasol: k === 'lady' && r() < .35 ? dresses[Math.floor(r() * dresses.length)] : null, umbrella: r() < .65 });
    }
    return s;
  };
  /** A street lamp; its lantern glows and flickers after dusk. kind: iron (three lanterns) single bracket globe */
  P.lamp = (x, y, s = 1, kind = 'single', o = {}) => {
    const S = (n) => f(n * s), c = o.c ?? pal.iron ?? '#2f4a3e', h = (o.h ?? 62) * s;
    let out = P.fill(`M${f(x - 2.2 * s)} ${f(y)}h${S(4.4)}l${S(-.8)} ${S(-5)}h${S(-2.8)}Z`, c, { w: .6 });
    out += P.line(`M${f(x)} ${f(y - 5 * s)}V${f(y - h)}`, c, 2 * s);
    const lantern = (lx, ly) => {
      const lw = 5.5 * s, lh = 8 * s, on = L.lamps > .05;
      return P.fill(`M${f(lx - lw / 2)} ${f(ly)}h${f(lw)}l${S(-1)} ${f(-lh)}h${f(-lw + 2 * s)}Z`, on ? '#f7e1a0' : '#d8e2e0', { w: .5 })
        + (on ? `<path d="M${f(lx - lw / 2 + .6)} ${f(ly - .5)}h${f(lw - 1.2)}l${S(-.9)} ${f(-lh + 1)}h${f(-lw + 3 * s)}Z" fill="${P.glow('#ffd36a')}" opacity="${f(.4 + L.lamps * .6)}"/>` : '')
        + P.fill(P.poly([[lx - lw * .62, ly - lh], [lx, ly - lh - 4 * s], [lx + lw * .62, ly - lh]]), c, { w: .5 });
    };
    if (kind === 'iron') {
      out += P.line(`M${f(x)} ${f(y - h + 6 * s)}q${S(-9)} ${S(-2)} ${S(-11)} ${S(5)}M${f(x)} ${f(y - h + 6 * s)}q${S(9)} ${S(-2)} ${S(11)} ${S(5)}`, c, 1.4 * s);
      for (const [lx, ly] of [[x - 11 * s, y - h + 19 * s], [x + 11 * s, y - h + 19 * s], [x, y - h + 4 * s]]) { out += lantern(lx, ly); P.glows.push({ x: lx, y: ly - 4 * s, r: 22 * s, depth: P.depth }); }
    } else if (kind === 'globe') { // a post crowned with one white globe (Vienna's Ring)
      const gy = y - h + 1 * s, on = L.lamps > .05;
      out += P.fill(P.rect(x - 1.8 * s, gy + 3 * s, 3.6 * s, 3 * s), c, { w: .5 });
      out += `<circle cx="${f(x)}" cy="${f(gy)}" r="${f(4.2 * s)}" fill="${on ? P.glow('#fff0c0') : P.ink('#f1efe6')}" stroke="${P.keyC()}" stroke-width="${f(.6 * (1 - P.depth * .4))}"/>`;
      P.glows.push({ x, y: gy, r: 20 * s, depth: P.depth });
    } else if (kind === 'bracket') {
      out += P.line(`M${f(x)} ${f(y - h + 4 * s)}h${S(10)}`, c, 1.4 * s) + lantern(x + 10 * s, y - h + 14 * s);
      P.glows.push({ x: x + 10 * s, y: y - h + 10 * s, r: 22 * s, depth: P.depth });
    } else { out += lantern(x, y - h + 4 * s); P.glows.push({ x, y: y - h, r: 22 * s, depth: P.depth }); }
    return out;
  };
  /** A flagstaff whose flag waves (compose animates it). nation defaults to the city's. */
  P.flag = (x, y, s = 1, nation = P.flagNation, o = {}) => {
    const h = (o.h ?? 30) * s;
    P.sprites.push({ kind: 'flag', x, y: y - h + 1, w: 18 * s, h: 11 * s, nation, z: o.z ?? P.zOf(), depth: P.depth });
    return P.line(`M${f(x)} ${f(y)}V${f(y - h)}`, '#5a4a3a', 1.2 * s) + `<circle cx="${f(x)}" cy="${f(y - h - 1)}" r="${f(1.3 * s)}" fill="${P.ink('#d9b44a')}"/>`;
  };
  /** A chimney or funnel whose smoke rises (compose animates it). */
  P.smoke = (x, y, s = 1, o = {}) => { P.sprites.push({ kind: 'smoke', x, y, s, z: o.z ?? P.zOf(), dark: !!o.dark, depth: P.depth }); return ''; };
  /**
   * A clock face whose hands keep the game's time (the page turns them): centre, radius, and the city's offset from
   * Central European Time in minutes (London -60, St Petersburg +61 …). Draws the dial; the hands are live.
   * o: { tz, face, rim, marks (the hour marks' ink), hands (their colour) }
   */
  P.clock = (x, y, r, o = {}) => {
    P.sprites.push({ kind: 'hands', x, y, r, tz: o.tz ?? 0, z: o.z ?? P.zOf(), c: o.hands ?? '#1d1a17' });
    let d = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${P.ink(o.face ?? '#f4efdc')}" stroke="${P.ink(o.rim ?? '#d4a73a')}" stroke-width="${f(Math.max(.8, r * .14))}"/>`;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d += `<path d="M${f(x + Math.sin(a) * r * .72)} ${f(y - Math.cos(a) * r * .72)}L${f(x + Math.sin(a) * r * .88)} ${f(y - Math.cos(a) * r * .88)}" stroke="${P.ink(o.marks ?? '#2a2622')}" stroke-width="${f(Math.max(.4, r * (i % 3 ? .05 : .1)))}"/>`; }
    if (L.lamps > .3) d += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .9)}" fill="${P.glow('#ffe7a8')}" opacity="${f(.55 * L.lamps)}"/>`;
    return d;
  };
  /** Declare the street where traffic and, in war, columns of soldiers pass: y is where wheels and feet stand. */
  P.setStreet = (y, x0 = WIN.x, x1 = WIN.x + WIN.w, s = 1) => { P.street = { y, x0, x1, s }; return ''; };
  /**
   * A mover: a sprite (from sprites.js, made with this kit's inks) crossing from x0 to x1 with its feet on y, over
   * dur seconds. z: back (behind the city) street (between city and foreground) fore (in front).
   */
  P.mover = (sprite, o) => { P.sprites.push({ kind: 'mover', sprite, z: P.zOf(), dur: 40, ...o }); return ''; };
  /**
   * A mover crossing the picture on a level: from off one side to off the other along y, at scale s, over dur
   * seconds, then a rest of `rest` (a fraction of the cycle) before it comes again. dir 1: to the right.
   */
  P.cross = (sprite, { y, s = 1, dir = 1, dur = 40, rest = 0, offset = 0, x0 = WIN.x - 4, x1 = WIN.x + WIN.w + 4, z, bob, fade = false } = {}) => {
    const half = fade ? 0 : sprite.w * s; // a part that fades in and out may start and end in plain sight
    const a = dir > 0 ? x0 - half : x1 + half, b = dir > 0 ? x1 + half : x0 - half, end = 1 - rest, at = (t) => a + (b - a) * (t / end);
    const path = fade ? [[a, y, s, 0, 0], [at(.04 * end), y, s, .04 * end, 1], [at(.96 * end), y, s, .96 * end, 1], [b, y, s, end, 0]] : [[a, y, s, 0], [b, y, s, end]];
    if (rest) path.push([b, y, s, 1, fade ? 0 : 1]);
    return P.mover(sprite, { path, dur, offset, bob, ...(z ? { z } : {}) });
  };
  /** A sprite turning about its anchor at (x, y): a windmill's sails, a wheel. dur: seconds a turn; dir -1 turns back. */
  P.spin = (sprite, { x, y, dur = 20, dir = 1, z, offset = 0 } = {}) => { P.sprites.push({ kind: 'spin', sprite, x, y, dur, dir, offset, z: z ?? P.zOf() }); return ''; };
  /** A placard spot on a wall and a window where a flag may hang: empty in peace, dressed as the crisis comes. */
  P.wall = (x, y, w = 14, h = 19) => P.placard(x, y, w, h, { chance: 1 });
  P.flagAt = (x, y) => P.windowFlag(x, y, { chance: 1 });
  /** A bill or a poster on a wall (none in peace): newspaper bills in the tension, mobilisation posters at war. */
  P.placard = (x, y, w, h, o = {}) => {
    const u = P.xr();
    if (war === 'peace' || u > (o.chance ?? 1) || P._placards >= (o.max ?? 5)) return '';
    P._placards++; P.walls.push([x, y, w, h, P.depth]);
    return war === 'war' ? poster(P, x, y, w, h) : bill(P, x, y, w, h);
  };
  /** A flag on a short pole from a window, at war (and for a capital's flag days). */
  P.windowFlag = (x, y, o = {}) => {
    const u = P.xr();
    if (war !== 'war' || u > (o.chance ?? 1) || P._wflags >= (o.max ?? 6)) return '';
    P._wflags++; P.flagSpots.push([x, y, P.depth]);
    const dir = o.dir ?? (u < (o.chance ?? 1) / 2 ? 1 : -1), s = o.s ?? (1 - P.depth * .4);
    const fw = 11 * s, fh = 7.5 * s, px = x + dir * 9 * s, py = y - 7 * s;
    const id = `wf${uid}${P._wflags}`, fl = FLAGS[P.flagNation] ?? FLAGS.AH;
    const wave = `M0 0C${f(fw * .3)} ${f(-1.2 * s)} ${f(fw * .6)} ${f(1.2 * s)} ${f(fw)} ${f(.6 * s)}V${f(fh + .6 * s)}C${f(fw * .6)} ${f(fh + 1.6 * s)} ${f(fw * .3)} ${f(fh - 1 * s)} 0 ${f(fh)}Z`;
    return P.line(`M${f(x)} ${f(y)}L${f(px)} ${f(py)}`, '#4a3a2c', .9 * s)
      + `<g transform="translate(${f(px)} ${f(py)}) rotate(${dir > 0 ? 18 : 162}) scale(1 ${dir > 0 ? 1 : -1})"><clipPath id="${id}"><path d="${wave}"/></clipPath><g clip-path="url(#${id})">${fl(fw, fh)}</g><path d="${wave}" fill="${P.ink('#000000')}" opacity="${f(.12 + L.night * .35)}"/><path d="${wave}" fill="none" stroke="${P.keyC()}" stroke-width=".4"/></g>`;
  };
  return P;
}

// ---------- the crisis on the walls ----------
const BILL = { GB: 'WAR CRISIS', DE: 'EXTRABLATT', AH: 'EXTRAAUSGABE', CH: 'EXTRABLATT', FR: 'DERNIÈRE HEURE', BE: 'DERNIÈRE HEURE', NL: 'EXTRA', IT: 'STRAORDINARIO', ES: 'ÚLTIMA HORA', PT: 'ÚLTIMA HORA', DK: 'EKSTRABLAD', SE: 'EXTRA', RU: 'ТЕЛЕГРАММЫ', RS: 'ВАНРЕДНО', RO: 'EDIȚIE SPECIALĂ', GR: 'ΕΚΤΑΚΤΟΝ', OT: 'HAVADİS' };
const POSTER = { GB: 'PROCLAMATION', DE: 'MOBILMACHUNG', AH: 'AN MEINE VÖLKER', CH: 'MOBILMACHUNG', FR: 'MOBILISATION', BE: 'MOBILISATION', NL: 'MOBILISATIE', IT: 'MOBILITAZIONE', RU: 'МОБИЛИЗАЦIЯ', RS: 'МОБИЛИЗАЦИЈА', RO: 'MOBILIZARE', GR: 'ΕΠΙΣΤΡΑΤΕΥΣΙΣ', OT: 'SEFERBERLİK', ES: 'MOVILIZACIÓN', PT: 'MOBILIZAÇÃO', DK: 'SIKRINGSSTYRKEN', SE: 'MOBILISERING' };
/** A card's own wording for its bills (tension) or posters (war): a string, or several taken in turn. */
const words = (P, k) => { const w = P.bills?.[k]; return Array.isArray(w) ? w[(P._placards - 1 + w.length) % w.length] : w ?? null; };
const SERIF = `font-family="Georgia,'Times New Roman',serif"`;
/** A newspaper bill: a pale sheet, a black headline, lines of type. */
function bill(P, x, y, w, h) {
  const f = P.f;
  let s = P.fill(P.rect(x, y, w, h), '#f1ead6', { w: .45 }) + P.shade(P.rect(x + w * .8, y, w * .2, h), '#f1ead6', .12);
  s += `<text x="${f(x + w / 2)}" y="${f(y + h * .3)}" ${SERIF} font-size="${f(w * .17)}" font-weight="bold" text-anchor="middle" fill="${P.ink('#1d1a17')}" textLength="${f(w * .84)}" lengthAdjust="spacingAndGlyphs">${words(P, 'tension') ?? BILL[P.nation] ?? 'EXTRA'}</text>`;
  for (let i = 0; i < 4; i++) s += P.line(`M${f(x + w * .14)} ${f(y + h * (.45 + i * .13))}h${f(w * (i === 3 ? .4 : .72))}`, '#3a3530', .7 * w / 14, { op: .7 });
  return s;
}
/** A mobilisation poster: the nation's colours or arms over close type. */
function poster(P, x, y, w, h) {
  const f = P.f, n = P.nation, fl = FLAGS[P.flagNation] ?? FLAGS[n];
  let s = P.fill(P.rect(x, y, w, h), '#f4efe0', { w: .45 });
  if (n === 'FR' || n === 'BE') { // two flags crossed over the heading
    for (const k of [-1, 1]) s += `<g transform="translate(${f(x + w / 2)} ${f(y + h * .16)}) rotate(${k * 24}) translate(${f(k > 0 ? 0 : -w * .32)} ${f(-h * .06)})">${fl(w * .32, h * .11)}</g>`;
  } else if (n === 'DE' || n === 'AH' || n === 'RU' || n === 'RS') { // an eagle
    const cx = x + w / 2, cy = y + h * .14, r = w * .12;
    s += `<path d="M${f(cx)} ${f(cy - r)}l${f(r * .5)} ${f(r * .5)}l${f(r * 1.4)} ${f(-r * .6)}l${f(-r * .7)} ${f(r * 1.3)}l${f(-r * .5)} ${f(r * .1)}l${f(-r * .7)} ${f(r * .8)}l${f(-r * .7)} ${f(-r * .8)}l${f(-r * .5)} ${f(-r * .1)}l${f(-r * .7)} ${f(-r * 1.3)}l${f(r * 1.4)} ${f(r * .6)}Z" fill="${P.ink(n === 'AH' || n === 'RU' ? '#1a1a1a' : '#1a1a1a')}"/>`;
    if (n === 'AH') s += P.flat(P.rect(x + .6, y + .6, w - 1.2, h * .045), '#e8c23a') + P.flat(P.rect(x + .6, y + h - h * .045 - .6, w - 1.2, h * .045), '#e8c23a');
  } else s += `<g transform="translate(${f(x + w * .2)} ${f(y + h * .06)})">${fl(w * .6, h * .14)}</g>`;
  s += `<text x="${f(x + w / 2)}" y="${f(y + h * .38)}" ${SERIF} font-size="${f(w * .13)}" font-weight="bold" text-anchor="middle" fill="${P.ink('#1d1a17')}" textLength="${f(w * .86)}" lengthAdjust="spacingAndGlyphs">${words(P, 'war') ?? POSTER[n] ?? 'MOBILISATION'}</text>`;
  for (let i = 0; i < 7; i++) s += P.line(`M${f(x + w * .12)} ${f(y + h * (.47 + i * .068))}h${f(w * (i === 6 ? .36 : .76))}`, '#4a4440', .45 * w / 14, { op: .65 });
  return s;
}

// ---------- the season's clothes ----------
const AUTUMN = ['#a8794a', '#8a6a4a', '#b98a5a', '#7a5a3a', '#9a6a52', '#6a5a4a'];
const WINTER = ['#4a3a4a', '#3a4a5a', '#5a4a3a', '#2f3440', '#6a3a3a', '#44524a'];
/** Light summer clothes turned to the season's: autumn browns (some keep their light dress), winter coats. */
function seasonal(P, c, salt = 0) {
  const se = P.L.season;
  if (se !== 'winter' && se !== 'autumn') return c;
  const hex = P.c(c);
  if (typeof hex !== 'string' || hex[0] !== '#' || lum(hex) < .55) return c;
  const h = [...hex].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, salt + 7);
  if (se === 'autumn' && h % 3 === 0) return c;
  return (se === 'winter' ? WINTER : AUTUMN)[h % 6];
}
/** What a person carries over the head: a parasol on a dry summer day, a black umbrella in the rain, nothing else. */
function overhead(P, o) {
  if (P.L.rain > 0) return o.parasol || o.umbrella ? '#26262c' : null;
  if (P.L.season === 'winter' || P.L.season === 'autumn') return null;
  return o.parasol || null;
}

// ---------- large figures ----------
function figure(P, x, by, s, kind, o) {
  const f = P.f, X = (k) => f(x + k * s), Y = (k) => f(by - k * s), key = P.keyC(), w = f(.8);
  const path = (d, c, k = true) => `<path d="${d}" fill="${P.ink(c)}"${k ? ` stroke="${key}" stroke-width="${w}" stroke-linejoin="round"` : ''}/>`;
  const skin = '#e3c19c', hair = o.hair ?? '#5a3a24';
  let out = '';
  if (kind === 'lady') {
    const dress = seasonal(P, o.c ?? '#f4efe3', 3), sash = o.sash ?? '#d9a2a0', st = o.stride ?? 0;
    // the parasol behind her, over her shoulder (a black umbrella in the rain; none in autumn or winter)
    const pc = o.parasol === false ? null : overhead(P, { parasol: o.parasol ?? '#f7f2e6' });
    if (pc) {
      const hx = x + 30 * s, hy = by - 104 * s;
      out += `<path d="M${X(6)} ${Y(62)}L${f(hx)} ${f(hy)}" stroke="${P.ink('#4a3a30')}" stroke-width="${f(1.2 * s)}"/>`;
      out += path(`M${f(hx - 30 * s)} ${f(hy + 8 * s)}Q${f(hx - 26 * s)} ${f(hy - 20 * s)} ${f(hx)} ${f(hy - 22 * s)}Q${f(hx + 26 * s)} ${f(hy - 20 * s)} ${f(hx + 30 * s)} ${f(hy + 8 * s)}Q${f(hx + 20 * s)} ${f(hy + 3 * s)} ${f(hx + 10 * s)} ${f(hy + 8 * s)}Q${f(hx)} ${f(hy + 3 * s)} ${f(hx - 10 * s)} ${f(hy + 8 * s)}Q${f(hx - 20 * s)} ${f(hy + 3 * s)} ${f(hx - 30 * s)} ${f(hy + 8 * s)}Z`, pc);
      out += P.shade(`M${f(hx)} ${f(hy - 22 * s)}Q${f(hx + 26 * s)} ${f(hy - 20 * s)} ${f(hx + 30 * s)} ${f(hy + 8 * s)}Q${f(hx + 20 * s)} ${f(hy + 3 * s)} ${f(hx + 10 * s)} ${f(hy + 8 * s)}Z`, pc, .1);
      for (const k of [-20, -10, 0, 10, 20]) out += `<path d="M${f(hx)} ${f(hy - 22 * s)}L${f(hx + k * s)} ${f(hy + 6 * s)}" stroke="${P.dark(pc, .2)}" stroke-width="${f(.5 * s)}"/>`;
      out += `<path d="M${f(hx)} ${f(hy - 22 * s)}v${f(-4 * s)}" stroke="${P.ink('#4a3a30')}" stroke-width="${f(1 * s)}"/>`;
    }
    // the skirt, long and swinging, a little train behind
    const sw = st ? 2 : -1.4;
    out += path(`M${X(-6)} ${Y(56)}C${X(-10)} ${Y(36)} ${X(-15 + sw)} ${Y(12)} ${X(-18 + sw)} ${Y(-1)}Q${X(0)} ${Y(-5)} ${X(18 + sw)} ${Y(-1)}C${X(15 + sw)} ${Y(12)} ${X(10)} ${Y(36)} ${X(6)} ${Y(56)}Z`, dress);
    out += P.shade(`M${X(2)} ${Y(55)}C${X(8)} ${Y(36)} ${X(13 + sw)} ${Y(12)} ${X(18 + sw)} ${Y(-1)}Q${X(12)} ${Y(-3)} ${X(8 + sw)} ${Y(-2)}C${X(7)} ${Y(14)} ${X(5)} ${Y(36)} ${X(2)} ${Y(55)}Z`, dress, .14);
    for (const k of [-8, -2, 5]) out += `<path d="M${X(k * .4)} ${Y(50)}Q${X(k * .9)} ${Y(24)} ${X(k * 1.4 + sw * .5)} ${Y(1)}" stroke="${P.dark(dress, .16)}" stroke-width="${f(.6 * s)}" fill="none"/>`;
    out += `<path d="M${X(-16 + sw)} ${Y(5)}Q${X(0)} ${Y(1)} ${X(16 + sw)} ${Y(5)}" stroke="${P.dark(dress, .12)}" stroke-width="${f(.8 * s)}" fill="none"/>`;
    // the bodice and the sash at a narrow waist; sleeves puffed at the shoulder
    out += path(`M${X(-6)} ${Y(55)}L${X(-7.5)} ${Y(80)}Q${X(0)} ${Y(84)} ${X(7.5)} ${Y(80)}L${X(6)} ${Y(55)}Z`, dress);
    out += path(`M${X(-6.4)} ${Y(53)}H${X(6.4)}L${X(6.8)} ${Y(58)}H${X(-6.8)}Z`, sash);
    out += path(`M${X(-7.5)} ${Y(80)}C${X(-14)} ${Y(82)} ${X(-15)} ${Y(70)} ${X(-11)} ${Y(66)}L${X(-9)} ${Y(50)}Q${X(-7)} ${Y(48)} ${X(-6)} ${Y(52)}Z`, dress);
    out += path(`M${X(7.5)} ${Y(80)}C${X(13)} ${Y(82)} ${X(14)} ${Y(72)} ${X(11)} ${Y(68)}L${X(8)} ${Y(62)}L${X(6)} ${Y(66)}Z`, dress);
    out += path(`M${X(-9.6)} ${Y(51)}q${f(1 * s)} ${f(-2.4 * s)} ${f(2.6 * s)} ${f(-1 * s)}`, skin);
    // neck and the hair up under a wide hat heaped with flowers
    out += path(`M${X(-2.4)} ${Y(83)}V${Y(88)}H${X(2.4)}V${Y(83)}Z`, skin);
    out += path(`M${X(-5.5)} ${Y(87)}Q${X(-6)} ${Y(96)} ${X(0)} ${Y(97)}Q${X(6)} ${Y(96)} ${X(5.5)} ${Y(87)}Q${X(0)} ${Y(85)} ${X(-5.5)} ${Y(87)}Z`, hair);
    const hc = o.hat ?? '#f2e3c6';
    out += path(`M${X(-17)} ${Y(96)}Q${X(0)} ${Y(91)} ${X(17)} ${Y(96)}Q${X(16)} ${Y(100)} ${X(8)} ${Y(101)}Q${X(0)} ${Y(108)} ${X(-8)} ${Y(101)}Q${X(-16)} ${Y(100)} ${X(-17)} ${Y(96)}Z`, hc);
    out += P.shade(`M${X(-17)} ${Y(96)}Q${X(0)} ${Y(91)} ${X(17)} ${Y(96)}Q${X(0)} ${Y(94)} ${X(-17)} ${Y(96)}Z`, hc, .25);
    const fl = o.flowers ?? ['#d8576a', '#f08ea0', '#e8c25a'];
    const R = P.rng(Math.round(x * 3));
    if (P.L.season !== 'winter') for (let i = 0; i < 7; i++) { const fx = -9 + i * 3 + R() * 1.4, fy = 100 + R() * 4; out += `<circle cx="${X(fx)}" cy="${Y(fy)}" r="${f((1.8 + R() * 1) * s)}" fill="${P.ink(i % 3 === 2 ? '#7da05a' : fl[i % fl.length])}" stroke="${key}" stroke-width="${f(.4)}"/>`; }
    return out;
  }
  // the gentleman: trousers in step, a frock coat with its vent, broad shoulders, a bowler, his cane
  const coat = o.c ?? '#26282e', legs = o.legs ?? '#33343a', st = o.stride ?? 1;
  const a = st ? 4 : 1.5;
  out += path(`M${X(-6)} ${Y(42)}L${X(-6 - a)} ${Y(1)}H${X(-1 - a)}L${X(-.5)} ${Y(30)}Z`, legs) + path(`M${X(.5)} ${Y(30)}L${X(1 + a)} ${Y(1)}H${X(6 + a)}L${X(6)} ${Y(42)}Z`, P.dark(legs, .15).replace('#', '#'));
  out += path(`M${X(-8 - a)} ${Y(1)}Q${X(-4 - a)} ${Y(-2)} ${X(-.5 - a)} ${Y(1)}Z`, '#141416') + path(`M${X(.5 + a)} ${Y(1)}Q${X(4 + a)} ${Y(-2)} ${X(7.5 + a)} ${Y(1)}Z`, '#141416');
  out += path(`M${X(-12)} ${Y(38)}L${X(-11)} ${Y(56)}Q${X(-12)} ${Y(74)} ${X(-13)} ${Y(82)}Q${X(0)} ${Y(88)} ${X(13)} ${Y(82)}Q${X(12)} ${Y(74)} ${X(11)} ${Y(56)}L${X(12)} ${Y(38)}Q${X(0)} ${Y(35)} ${X(-12)} ${Y(38)}Z`, coat);
  out += P.lite(`M${X(-12)} ${Y(80)}Q${X(-6)} ${Y(85)} ${X(-1)} ${Y(85)}L${X(-4)} ${Y(42)}H${X(-11)}Z`, coat, .1);
  out += `<path d="M${X(0)} ${Y(84)}V${Y(38)}M${X(-2.6)} ${Y(57)}h${f(.1)}M${X(2.6)} ${Y(57)}h${f(.1)}" stroke="${P.dark(coat, .3)}" stroke-width="${f(.8 * s)}" stroke-linecap="round"/>`;
  // arms: one hanging with the cane, one crooked toward his companion
  out += path(`M${X(-13)} ${Y(82)}Q${X(-17)} ${Y(66)} ${X(-15)} ${Y(50)}L${X(-11)} ${Y(51)}Q${X(-12)} ${Y(66)} ${X(-10)} ${Y(78)}Z`, coat);
  out += path(`M${X(13)} ${Y(82)}Q${X(17)} ${Y(70)} ${X(o.arm ?? 18)} ${Y(60)}L${X((o.arm ?? 18) - 3)} ${Y(58)}Q${X(13)} ${Y(68)} ${X(10)} ${Y(78)}Z`, coat);
  out += `<path d="M${X(-14)} ${Y(50)}L${X(-19)} ${Y(1)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(1.3 * s)}"/>` + path(`M${X(-15.6)} ${Y(51.5)}q${f(1.6 * s)} ${f(-2.6 * s)} ${f(3.4 * s)} ${f(-.6 * s)}`, skin);
  // collar, neck, the back of the head, the bowler
  out += path(`M${X(-5)} ${Y(84)}Q${X(0)} ${Y(87)} ${X(5)} ${Y(84)}V${Y(88)}H${X(-5)}Z`, '#f4f1e8');
  out += path(`M${X(-4.6)} ${Y(87.5)}Q${X(-5.4)} ${Y(97)} ${X(0)} ${Y(98)}Q${X(5.4)} ${Y(97)} ${X(4.6)} ${Y(87.5)}Z`, hair);
  out += path(`M${X(-5)} ${Y(91)}q${f(-1.4 * s)} ${f(-1 * s)} ${f(-.6 * s)} ${f(-3.4 * s)}`, skin);
  const hc = o.hat ?? '#1b1b20';
  out += path(`M${X(-9)} ${Y(97)}Q${X(0)} ${Y(95)} ${X(9)} ${Y(97)}Q${X(9.6)} ${Y(98.6)} ${X(6.4)} ${Y(98.4)}Q${X(6)} ${Y(108)} ${X(0)} ${Y(108)}Q${X(-6)} ${Y(108)} ${X(-6.4)} ${Y(98.4)}Q${X(-9.6)} ${Y(98.6)} ${X(-9)} ${Y(97)}Z`, hc);
  out += `<path d="M${X(-4)} ${Y(105)}q${f(2 * s)} ${f(-1.6 * s)} ${f(4 * s)} 0" stroke="${P.light(hc, .3)}" stroke-width="${f(.8 * s)}" fill="none"/>`;
  // in the rain, a black umbrella over him
  if (P.L.rain > 0 && o.umbrella !== false) {
    const ux = x - 6 * s, uy = by - 118 * s;
    out += `<path d="M${X(-14)} ${Y(50)}L${f(ux)} ${f(uy)}" stroke="${P.ink('#3a2a1e')}" stroke-width="${f(1.2 * s)}"/>`;
    out += path(`M${f(ux - 26 * s)} ${f(uy + 9 * s)}Q${f(ux - 22 * s)} ${f(uy - 16 * s)} ${f(ux)} ${f(uy - 18 * s)}Q${f(ux + 22 * s)} ${f(uy - 16 * s)} ${f(ux + 26 * s)} ${f(uy + 9 * s)}Q${f(ux + 13 * s)} ${f(uy + 4 * s)} ${f(ux)} ${f(uy + 9 * s)}Q${f(ux - 13 * s)} ${f(uy + 4 * s)} ${f(ux - 26 * s)} ${f(uy + 9 * s)}Z`, '#26262c');
  }
  return out;
}

// ---------- people ----------
const HATS = { gent: 'bowler', boater: 'boater', lady: 'picture', girl: 'bonnet', child: 'cap', worker: 'cap', newsboy: 'cap', priest: 'shovel', sailor: 'sailor', nun: 'veil', peasant: 'kerchief', officer: 'kepi' };
function person(P, x, y, s, kind, o) {
  const f = P.f, S = (n) => f(n * s), dir = o.dir ?? 1, D = (n) => f(n * s * dir);
  const skin = '#e8c4a0', key = P.keyC(), w = f(.55 * (1 - P.depth * .4));
  const uni = kind === 'soldier' || kind === 'officer' ? UNIFORM[o.nation ?? P.nation] ?? UNIFORM.GB : null;
  const cold = P.L.season === 'winter';
  const coat = uni ? uni.coat : seasonal(P, o.c ?? (kind === 'lady' ? '#f3eee2' : '#2f3440'), Math.round(x));
  const legs = uni ? uni.legs : o.legs ?? (kind === 'boater' && !cold ? '#d8cfb8' : '#2a2a30');
  const fem = kind === 'lady' || kind === 'girl' || kind === 'nun' || kind === 'peasant';
  const h = kind === 'child' ? 18 : kind === 'girl' ? 25 : 30;
  const top = y - h * s;
  let out = '';
  const st = o.stride ?? null; // null: standing; 0 or 1: the two frames of a walk
  if (fem) {
    // a long skirt, a fitted bodice, puffed sleeves; walking, the hem swings
    const sw = st === null ? 0 : (st ? .9 : -.5) * s * dir;
    out += `<path d="M${f(x - 5.4 * s + sw)} ${f(y)}Q${f(x - 4 * s)} ${f(y - h * .45 * s)} ${f(x - 2.2 * s)} ${f(y - h * .58 * s)}H${f(x + 2.2 * s)}Q${f(x + 4 * s)} ${f(y - h * .45 * s)} ${f(x + 5.4 * s + sw)} ${f(y)}Z" fill="${P.ink(coat)}" stroke="${key}" stroke-width="${w}"/>`;
    out += `<path d="M${f(x - 2.4 * s)} ${f(y - h * .58 * s)}L${f(x - 2 * s)} ${f(top + 7 * s)}H${f(x + 2 * s)}L${f(x + 2.4 * s)} ${f(y - h * .58 * s)}Z" fill="${P.ink(o.top ?? coat)}" stroke="${key}" stroke-width="${w}"/>`;
    out += `<path d="M${f(x)} ${f(y - h * .3 * s)}V${f(y)}" stroke="${P.dark(coat, .2)}" stroke-width="${S(1.2)}" opacity=".6"/>`;
  } else if (st === null) {
    out += `<path d="M${f(x - 2.2 * s)} ${f(y)}L${f(x - 1.6 * s)} ${f(y - h * .45 * s)}H${f(x + 1.6 * s)}L${f(x + 2.2 * s)} ${f(y)}H${f(x + .6 * s)}L${f(x)} ${f(y - h * .3 * s)}L${f(x - .6 * s)} ${f(y)}Z" fill="${P.ink(legs)}" stroke="${key}" stroke-width="${w}"/>`;
  } else {
    // two legs from the hip: apart in one frame, passing in the other
    const a = (st ? 3.4 : .9) * s, hy = y - h * .45 * s;
    for (const k of [-1, 1]) out += `<path d="M${f(x - 1.5 * s)} ${f(hy)}H${f(x + 1.5 * s)}L${f(x + k * a + 1 * s)} ${f(y)}H${f(x + k * a - 1 * s)}Z" fill="${P.ink(k * dir > 0 ? legs : shadow(P.c(legs), .2))}" stroke="${key}" stroke-width="${w}"/>`;
  }
  if (!fem) out += `<path d="M${f(x - 3 * s)} ${f(y - h * .4 * s)}L${f(x - 2.6 * s)} ${f(top + 7 * s)}Q${f(x)} ${f(top + 6 * s)} ${f(x + 2.6 * s)} ${f(top + 7 * s)}L${f(x + 3 * s)} ${f(y - h * .4 * s)}Z" fill="${P.ink(coat)}" stroke="${key}" stroke-width="${w}"/>`;
  // head
  out += `<circle cx="${f(x)}" cy="${f(top + 4.2 * s)}" r="${S(2.4)}" fill="${P.ink(skin)}" stroke="${key}" stroke-width="${w}"/>`;
  let hat = uni ? uni.hat : o.hatKind ?? HATS[kind] ?? 'bowler';
  if (hat === 'boater' && (cold || P.L.season === 'autumn')) hat = 'bowler';
  const hatC = uni ? uni.hatC : o.hat ?? (hat === 'fez' ? '#b8282e' : fem ? '#d9a7a0' : '#25252a');
  const hy = top + 2.8 * s;
  if (hat === 'bowler') out += `<path d="M${f(x - 3.4 * s)} ${f(hy)}h${S(6.8)}M${f(x - 2.2 * s)} ${f(hy)}q${S(2.2)} ${S(-4.4)} ${S(4.4)} 0Z" fill="${P.ink(hatC)}" stroke="${P.ink(hatC)}" stroke-width="${S(1)}"/>`;
  if (hat === 'boater') out += `<path d="M${f(x - 4 * s)} ${f(hy)}h${S(8)}M${f(x - 2.4 * s)} ${f(hy)}v${S(-2.4)}h${S(4.8)}v${S(2.4)}" fill="${P.ink('#e9d9a0')}" stroke="${P.ink('#c9b071')}" stroke-width="${S(1)}"/>`;
  if (hat === 'picture') out += `<path d="M${f(x - 6 * s)} ${f(hy + .6 * s)}q${S(6)} ${S(-6)} ${S(12)} 0Z" fill="${P.ink(hatC)}" stroke="${key}" stroke-width="${w}"/><circle cx="${f(x + 2 * s)}" cy="${f(hy - 1.6 * s)}" r="${S(1.4)}" fill="${P.ink(o.flower ?? '#c8506a')}"/>`;
  if (hat === 'bonnet' || hat === 'kerchief') out += `<path d="M${f(x - 3 * s)} ${f(hy + 2 * s)}q${S(3)} ${S(-6)} ${S(6)} 0Z" fill="${P.ink(hatC)}"/>`;
  if (hat === 'cap') out += `<path d="M${f(x - 2.6 * s)} ${f(hy + .4 * s)}q${S(2.6)} ${S(-3.4)} ${S(5.2)} 0h${D(1.6)}Z" fill="${P.ink(hatC)}"/>`;
  if (hat === 'kepi') out += `<path d="M${f(x - 2.2 * s)} ${f(hy + .6 * s)}v${S(-3.4)}h${S(4.4)}v${S(3.4)}h${D(1.4)}Z" fill="${P.ink(hatC)}" stroke="${key}" stroke-width="${w}"/>`;
  if (hat === 'pickel') out += `<path d="M${f(x - 2.6 * s)} ${f(hy + .6 * s)}q${S(2.6)} ${S(-4)} ${S(5.2)} 0Z" fill="${P.ink(hatC)}"/><path d="M${f(x)} ${f(hy - 2.2 * s)}v${S(-2.6)}" stroke="${P.ink('#c9b071')}" stroke-width="${S(.9)}"/>`;
  if (hat === 'shovel') out += `<path d="M${f(x - 4 * s)} ${f(hy + .4 * s)}h${S(8)}l${S(-1.4)} ${S(-2)}h${S(-5.2)}Z" fill="${P.ink('#1f1f22')}"/>`;
  if (hat === 'sailor') out += `<path d="M${f(x - 2.4 * s)} ${f(hy + .4 * s)}h${S(4.8)}v${S(-1.8)}h${S(-4.8)}Z" fill="${P.ink('#f4f1e8')}"/>`;
  if (hat === 'veil') out += `<path d="M${f(x - 3.2 * s)} ${f(y - h * .55 * s)}q0 ${S(-12)} ${S(3.2)} ${S(-12)}q${S(3.2)} 0 ${S(3.2)} ${S(12)}Z" fill="${P.ink('#222226')}"/>`;
  if (hat === 'sajkaca') out += `<path d="M${f(x - 2.6 * s)} ${f(hy + .6 * s)}l${S(.6)} ${S(-3)}h${S(4)}l${S(.6)} ${S(3)}Z" fill="${P.ink(hatC)}"/>`;
  if (hat === 'shako') out += `<path d="M${f(x - 2.4 * s)} ${f(hy + .6 * s)}v${S(-5)}h${S(4.8)}v${S(5)}Z" fill="${P.ink(hatC)}"/>`;
  if (hat === 'kabalak') out += `<path d="M${f(x - 2.8 * s)} ${f(hy + .8 * s)}q${S(2.8)} ${S(-4.6)} ${S(5.6)} 0Z" fill="${P.ink(hatC)}"/>`;
  if (hat === 'fez') out += `<path d="M${f(x - 2.3 * s)} ${f(hy + .8 * s)}l${S(.5)} ${S(-3.6)}h${S(3.6)}l${S(.5)} ${S(3.6)}Z" fill="${P.ink(hatC)}" stroke="${key}" stroke-width="${w}"/><path d="M${f(x)} ${f(hy - 2.8 * s)}q${D(1.6)} ${S(.4)} ${D(1.8)} ${S(2.4)}" stroke="${P.ink('#1d1a17')}" stroke-width="${S(.5)}" fill="none"/>`;
  // a rifle on a soldier's shoulder; papers for a newsboy; a parasol for a lady
  if (kind === 'soldier') out += `<path d="M${f(x + 2 * s * dir)} ${f(y - h * .45 * s)}l${D(2.4)} ${S(-14)}" stroke="${P.ink('#3b2c1e')}" stroke-width="${S(1.1)}"/>`;
  if (kind === 'newsboy') out += `<path d="M${f(x + 2 * s * dir)} ${f(y - h * .55 * s)}h${D(5)}v${S(4)}h${D(-5)}Z" fill="${P.ink('#f2efe6')}" stroke="${key}" stroke-width="${w}"/>`;
  const over = uni ? null : overhead(P, o);
  if (over) {
    const wet = P.L.rain > 0, px = x - (wet ? 0 : 1) * s * dir, py = top - (wet ? 3 : 2) * s, r = (wet ? 9 : 8) * s;
    out += `<path d="M${f(px)} ${f(py + 8 * s)}V${f(py)}" stroke="${P.ink('#4a3a30')}" stroke-width="${S(.7)}"/><path d="M${f(px - r)} ${f(py + 2 * s)}Q${f(px)} ${f(py - 7 * s)} ${f(px + r)} ${f(py + 2 * s)}Z" fill="${P.ink(over)}" stroke="${key}" stroke-width="${w}"/>`;
  }
  return out;
}
