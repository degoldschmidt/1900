// Colour arithmetic for the postcards: inks are '#rrggbb'; light multiplies them, fog and haze pull them toward a tint.

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const memo = new Map();
/** '#rgb' or '#rrggbb' → [r, g, b]. */
export function rgb(c) {
  let v = memo.get(c);
  if (v) return v;
  const s = c[0] === '#' ? c.slice(1) : c;
  const h = s.length === 3 ? s.split('').map((x) => x + x).join('') : s;
  v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  if (memo.size > 4000) memo.clear();
  memo.set(c, v);
  return v;
}
export const hex = ([r, g, b]) => `#${[r, g, b].map((x) => Math.round(clamp(x)).toString(16).padStart(2, '0')).join('')}`;
/** a → b by t (0..1). */
export const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); };
/** Multiply by a light colour given as [r, g, b] factors (1 = unchanged). */
export const mul = (c, m) => { const A = rgb(c); return hex([A[0] * m[0], A[1] * m[1], A[2] * m[2]]); };
/** Toward grey of the same lightness by t. */
export const desat = (c, t) => { const [r, g, b] = rgb(c), y = r * .3 + g * .59 + b * .11; return hex([r + (y - r) * t, g + (y - g) * t, b + (y - b) * t]); };
/** A shadow tone: darker and a little cooler, as a lithographer's second stone would print it. */
export const shadow = (c, k = .28) => { const [r, g, b] = rgb(c); return hex([r * (1 - k) - 6 * k, g * (1 - k) - 2 * k, b * (1 - k * .7) + 10 * k]); };
/** A lit tone: lighter and a little warmer. */
export const lit = (c, k = .2) => { const [r, g, b] = rgb(c); return hex([r + (255 - r) * k + 4 * k, g + (250 - g) * k, b + (228 - b) * k]); };
/** Relative luminance 0..1. */
export const lum = (c) => { const [r, g, b] = rgb(c); return (r * .3 + g * .59 + b * .11) / 255; };
