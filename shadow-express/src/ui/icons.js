// Small flat icons shared by the globe (canvas) and the HUD (SVG): drawn once in a 24×24 box with d3.path, so one
// description serves both. Shapes are wound clockwise; holes counter-clockwise or with the even-odd rule.

const TAU = Math.PI * 2;
const circle = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
const rect = (p, x0, y0, x1, y1) => { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath(); };
const hole = (p, x0, y0, x1, y1) => { p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath(); };
function round(p, x0, y0, x1, y1, r) {
  p.moveTo(x0 + r, y0); p.lineTo(x1 - r, y0); p.arcTo(x1, y0, x1, y0 + r, r); p.lineTo(x1, y1 - r); p.arcTo(x1, y1, x1 - r, y1, r);
  p.lineTo(x0 + r, y1); p.arcTo(x0, y1, x0, y1 - r, r); p.lineTo(x0, y0 + r); p.arcTo(x0, y0, x0 + r, y0, r); p.closePath();
}

export const ICONS = {
  /** A locomotive, side on, facing left. */
  train(p) {
    rect(p, 14, 4.5, 20.5, 15); hole(p, 16, 6.8, 18.8, 10);
    rect(p, 5, 8.5, 14, 15);
    rect(p, 7, 4.5, 9.6, 8.5);
    p.moveTo(2.5, 15.5); p.lineTo(5, 11.5); p.lineTo(5, 15.5); p.closePath();
    rect(p, 2.5, 15, 21.5, 16.6);
    circle(p, 7, 18.6, 2.1); circle(p, 11.6, 18.6, 2.1); circle(p, 17.6, 18.2, 2.6);
  },
  /** A screw steamer with one funnel. */
  steamer(p) {
    p.moveTo(1.5, 14); p.lineTo(22.5, 14); p.lineTo(19.5, 19.5); p.lineTo(4.5, 19.5); p.closePath();
    rect(p, 6.5, 10, 17, 14);
    rect(p, 10, 4.5, 13, 10);
    rect(p, 18, 8, 18.9, 14);
  },
  /** A post coach. */
  coach(p) {
    round(p, 4.5, 6, 19.5, 15, 2); hole(p, 7, 8, 11, 11.5); hole(p, 13, 8, 17, 11.5);
    rect(p, 6, 4, 18, 5.2);
    circle(p, 8, 18.2, 2.6); circle(p, 16, 18.2, 2.6);
  },
  /** A briefcase: the ledger. Use the even-odd rule. */
  case(p) {
    round(p, 2.5, 7, 21.5, 20.5, 2.2);
    round(p, 8, 3, 16, 8, 1.4); round(p, 9.8, 4.6, 14.2, 8, 0.6);
    rect(p, 2.5, 12.4, 21.5, 13.6); // the seam, cut by even-odd
  },
  /** A cog: settings and About. Use the even-odd rule. */
  gear(p) {
    const n = 8, cx = 12, cy = 12, ro = 10.2, ri = 7.6, w = 0.2;
    for (let i = 0; i < n; i++) {
      const c = (i / n) * TAU;
      const pts = [[c - 0.5 / n * TAU + w * 0.3, ri], [c - w, ro], [c + w, ro], [c + 0.5 / n * TAU - w * 0.3, ri]];
      pts.forEach(([a, r], k) => { const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); if (i === 0 && k === 0) p.moveTo(x, y); else p.lineTo(x, y); });
    }
    p.closePath();
    circle(p, cx, cy, 3.4);
  },
  /** A heart: nerve. */
  heart(p) {
    p.moveTo(12, 20.5); p.bezierCurveTo(5, 15.5, 2.5, 12, 2.5, 8.5); p.bezierCurveTo(2.5, 5.5, 4.8, 3.5, 7.4, 3.5);
    p.bezierCurveTo(9.4, 3.5, 11, 4.6, 12, 6.3); p.bezierCurveTo(13, 4.6, 14.6, 3.5, 16.6, 3.5);
    p.bezierCurveTo(19.2, 3.5, 21.5, 5.5, 21.5, 8.5); p.bezierCurveTo(21.5, 12, 19, 15.5, 12, 20.5); p.closePath();
  },
  /** A star: standing with the Bureau. */
  star(p) {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 4.4 : 10, x = 12 + r * Math.cos(a), y = 12.6 + r * Math.sin(a); if (i) p.lineTo(x, y); else p.moveTo(x, y); }
    p.closePath();
  },
  /** A cross: close. */
  close(p) {
    const t = 1.5, L = 8.2, c = Math.SQRT1_2;
    [[t, L], [t, t], [L, t], [L, -t], [t, -t], [t, -L], [-t, -L], [-t, -t], [-L, -t], [-L, t], [-t, t], [-t, L]]
      .forEach(([x, y], i) => { const X = 12 + (x - y) * c, Y = 12 + (x + y) * c; if (i) p.lineTo(X, Y); else p.moveTo(X, Y); });
    p.closePath();
  },
  /** A crosshair: back to where you are. */
  locate(p) {
    circle(p, 12, 12, 8); circle(p, 12, 12, 6.2);
    rect(p, 11.1, 1.5, 12.9, 6); rect(p, 11.1, 18, 12.9, 22.5); rect(p, 1.5, 11.1, 6, 12.9); rect(p, 18, 11.1, 22.5, 12.9);
    circle(p, 12, 12, 2.4);
  },
};
const EVENODD = new Set(['case', 'gear', 'locate']);
const cache = new Map();
/** SVG path data for an icon. */
export function iconD(name) {
  if (!cache.has(name)) { const p = window.d3.path(); ICONS[name](p); cache.set(name, p.toString()); }
  return cache.get(name);
}
/** An inline SVG for the DOM; colour follows `currentColor`. */
export const iconSVG = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" ${EVENODD.has(name) ? 'fill-rule="evenodd"' : ''} d="${iconD(name)}"/></svg>`;
/** Fill an icon on a canvas, centred at (x, y), `s` pixels across. */
export function drawIcon(ctx, name, x, y, s, color) {
  const p2 = new Path2D(iconD(name));
  ctx.save(); ctx.translate(x - s / 2, y - s / 2); ctx.scale(s / 24, s / 24); ctx.fillStyle = color; ctx.fill(p2, EVENODD.has(name) ? 'evenodd' : 'nonzero'); ctx.restore();
}
