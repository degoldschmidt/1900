// Rasterises art once and keeps it: the postcards' layers (for postcard.js), portraits and glyphs (as images); and the
// day's weather over a city. SVG strings come from src/art; the browser draws each one a single time onto a canvas.

import { portrait } from '../art/portraits.js';
import glyphs from '../art/glyphs.js';

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
