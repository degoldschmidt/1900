// The engraving kit: soot and ink on stained paper, for the portraits and the map glyphs (the cities are postcards,
// drawn with src/art/postcard/). All functions return SVG strings. A kit is made per drawing: makeKit({ uid, seed })
// so pattern ids never clash. Lit faces take 'light' or 'vert', faces turned away 'dark', deep shadow 'black'.

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

  /** <defs>: hatch patterns near and far, the rough-ink filter. Once per SVG. */
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
  return k;
}
