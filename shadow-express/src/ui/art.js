// Rasterises art once and keeps it: vignettes (last 8, as PNG object URLs), portraits and glyphs (as images).
// SVG strings come from src/art; the browser draws each one a single time onto a canvas.

import vignettes from '../art/vignettes/index.js';
import { renderScene, phase } from '../art/frame.js';
import { portrait } from '../art/portraits.js';
import glyphs from '../art/glyphs.js';

const VIG = new Map(vignettes.map((v) => [v.id, v]));
const lru = new Map(); // key → Promise<url>
const MAX = 8;

function svgUrl(svg) { return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); }

/** Draws an SVG string to a PNG object URL at a pixel width (2× for sharpness). */
export function rasterise(svg, w, h, scale = 2) {
  return new Promise((resolve) => {
    const src = svgUrl(svg);
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(src);
        c.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), 'image/png');
      } catch { resolve(src); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The vignette of a city at an hour and weather, as an image URL (cached per city, phase and weather). */
export function vignetteUrl(city, hour, weather = 'clear') {
  const v = VIG.get(city);
  if (!v) return Promise.resolve(null);
  weather = weather === 'storm' ? 'rain' : weather === 'heat' ? 'clear' : weather; // the engravings know fewer skies
  const key = `${city}|${phase(hour)}|${weather}`;
  if (lru.has(key)) { const p = lru.get(key); lru.delete(key); lru.set(key, p); return p; }
  let svg;
  try { svg = renderScene(v, { hour, weather, uid: city.toLowerCase(), seed: skySeed(city) }); } catch { return Promise.resolve(null); }
  const p = rasterise(svg, 640, 240, Math.min(2, (window.devicePixelRatio || 1) * 1.2));
  lru.set(key, p);
  while (lru.size > MAX) { const [k, old] = lru.entries().next().value; lru.delete(k); old.then((u) => u && URL.revokeObjectURL(u)); }
  return p;
}
export const hasVignette = (city) => VIG.has(city);
/** Each city keeps its own sky: clouds and sun placed by its name. */
export const skySeed = (city) => [...city].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 997;

/**
 * The weather over a city on a day: fixed per campaign, foggier in the north-west, smoky once the armies move,
 * thunder in the summer's rain and a heat haze on the southern cities' clear days.
 */
export function weatherAt(G, city, t) {
  const day = Math.floor(t / 1440), u = hashU(G.S.seed, city, day), v = hashU(G.S.seed + 1, city, day);
  const north = ['LON', 'AMS', 'FLU', 'HAM', 'CPH', 'STO', 'SPB', 'BRU', 'COL'].includes(city);
  const south = ['MAR', 'BAR', 'MAD', 'LIS', 'ROM', 'VEN', 'TRI', 'ATH', 'IST', 'ODE', 'SAR', 'BEG', 'BUC', 'BUD'].includes(city);
  if (G.W.act(t) === 3 && u < .3) return 'smoke';
  if (u < (north ? .16 : .1)) return v < (north ? .2 : .45) ? 'storm' : 'rain';
  if (north && u < .26) return 'fog';
  if (u < .45) return 'cloud';
  return south && v < .4 ? 'heat' : 'clear';
}
function hashU(seed, city, day) { let h = 2166136261 ^ seed; for (const ch of `${city}|${day}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; }

const portraits = new Map();
/** A portrait image URL for a person's or hunter's portrait parameters. */
export function portraitUrl(id, params) {
  if (!portraits.has(id)) {
    let svg;
    try { svg = portrait(params, `p${id.replace(/[^a-z0-9]/gi, '')}`); } catch { svg = null; }
    portraits.set(id, svg ? rasterise(svg, 120, 150, 1.5) : Promise.resolve(null));
  }
  return portraits.get(id);
}

const glyphImgs = new Map();
/** A glyph as an <img>, for drawing on the globe; null until it has loaded. */
export function glyph(key) {
  if (!glyphImgs.has(key)) {
    const img = new Image();
    try { img.src = svgUrl(glyphs[key]?.(`g${key.replace(/[^a-z0-9]/gi, '')}`) ?? '<svg xmlns="http://www.w3.org/2000/svg"/>'); } catch { /* no glyph */ }
    glyphImgs.set(key, img);
  }
  const img = glyphImgs.get(key);
  return img.complete && img.naturalWidth ? img : null;
}
/** A glyph as an SVG string, for inline use in cards. */
export function glyphSvg(key) { try { return glyphs[key]?.(`i${key.replace(/[^a-z0-9]/gi, '')}`) ?? ''; } catch { return ''; } }
