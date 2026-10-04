// The engraved globe: paper sea ruled in indigo, water-lined coasts, stippled land, engraved nation names,
// railways drawn as the old maps drew them, frontier posts, the night, hunters as the player knows them, the train.
// The base layer is cached per view; the overlay is redrawn when something moves.

import land from '../../land.json';
import landLo from '../../land-lo.json';
import { glyph } from './art.js';
import { lineCourse, earliest } from '../core/timetable.js';
import { DAY } from '../data/time.js';

const d3 = () => window.d3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
export const ZOOM = [0.85, 30];

const INK = '#2b1d12', PAPER = '#efe2c4', SEA = '#e6dbc0', WASH = '#3a4870', SEPIA = '#9c7b52', BLOOD = '#8c1d12', SOOT = '#15100b';

const NATIONS = [
  ['GREAT BRITAIN', -2.2, 53.4, 1], ['FRANCE', 2.4, 46.6, 1], ['GERMAN EMPIRE', 10.6, 51.4, 1], ['AUSTRIA-HUNGARY', 18.2, 47.4, 1],
  ['RUSSIAN EMPIRE', 33, 55.6, 1], ['ITALY', 12.4, 42.8, 1], ['SPAIN', -3.8, 40.0, 1], ['PORTUGAL', -8.1, 39.7, 2], ['SWITZERLAND', 8.2, 46.75, 3],
  ['NETHERLANDS', 5.7, 52.5, 3], ['BELGIUM', 4.7, 50.55, 3], ['DENMARK', 9.4, 56.1, 2], ['SWEDEN', 15.6, 62.2, 1], ['NORWAY', 9.2, 61.2, 2],
  ['SERBIA', 21.0, 43.95, 2], ['ROUMANIA', 25.0, 45.8, 2], ['BULGARIA', 25.4, 42.75, 2], ['GREECE', 22.0, 39.5, 2], ['OTTOMAN EMPIRE', 33.5, 39.4, 1],
  ['MONTENEGRO', 19.3, 42.75, 4], ['ALBANIA', 20.0, 41.1, 4], ['LUXEMBOURG', 6.1, 49.75, 6],
];
const SEAS = [['North Sea', 3.6, 56.2, 1], ['Baltic Sea', 19.2, 57.6, 1], ['Mediterranean Sea', 16, 35.2, 1], ['Black Sea', 34.2, 43.2, 1], ['Adriatic', 15.6, 42.8, 2],
  ['Atlantic Ocean', -16, 46, 1], ['Bay of Biscay', -5.2, 45.3, 2], ['Aegean', 25.0, 38.4, 3], ['Tyrrhenian Sea', 11.8, 39.8, 2], ['English Channel', -2.0, 49.9, 3]];

/** A small canvas used as a repeating pattern. */
function pattern(ctx, w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  return ctx.createPattern(c, 'repeat');
}

export function makeGlobe(canvas, hooks) {
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d');
  const proj = d3().geoOrthographic().clipAngle(90).precision(0.3);
  const path = d3().geoPath(proj, ctx);
  const bpath = d3().geoPath(proj, bctx);
  const sphere = { type: 'Sphere' };
  const graticule = d3().geoGraticule10();
  const LAND = { type: 'Feature', geometry: land }, LANDLO = { type: 'Feature', geometry: landLo };
  const view = { lon: 6, lat: 50, zoom: 1.6, tLon: 6, tLat: 50, tZoom: 1.6, follow: true, moving: 0, interacting: false };
  const stats = { base: 0, bases: 0 };
  let W = 0, H = 0, DPR = 1, baseKey = '', pats = null, labelW = new Map();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    const phone = Math.min(W, H) < 600;
    DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    baseKey = '';
    pats = null;
  }
  function geom() {
    const ledger = hooks.ledgerInset?.() ?? { right: 0, bottom: 0 };
    const w = W - ledger.right, h = H - ledger.bottom;
    const R = Math.min(w, h) * 0.46 * view.zoom;
    return { cx: w / 2, cy: h / 2 + (H < 600 ? 10 : 0), R };
  }
  function patterns() {
    if (pats) return pats;
    pats = {
      sea: pattern(bctx, 6, 4, (c, w, h) => { c.fillStyle = SEA; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(58,72,112,.38)'; c.fillRect(0, 2, w, .9); }),
      land: pattern(bctx, 48, 48, (c, w, h) => {
        c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
        let s = 9; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(90,70,50,${0.12 + r() * .18})`; c.fillRect(r() * w, r() * h, .9, .9); }
      }),
      grain: pattern(bctx, 96, 96, (c, w, h) => {
        let s = 31; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < 520; i++) { c.fillStyle = `rgba(43,29,18,${r() * .16})`; c.fillRect(r() * w, r() * h, 1.2, 1.2); }
      }),
      night: pattern(ctx, 6, 6, (c, w, h) => { c.strokeStyle = 'rgba(21,22,40,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, h); c.lineTo(w, 0); c.stroke(); }),
    };
    return pats;
  }
  const visible = (ll) => d3().geoDistance(ll, [view.lon, view.lat]) < Math.PI / 2 - 0.03;

  function drawBase(cx, cy, R) {
    const fast = view.interacting || view.moving;
    const lod = fast ? 'lo' : view.zoom >= 2.6 ? 'hi' : 'lo';
    const key = [W, H, DPR, view.lon.toFixed(3), view.lat.toFixed(3), view.zoom.toFixed(4), lod, fast].join('|');
    if (key === baseKey) return;
    baseKey = key;
    const t0 = performance.now();
    if (base.width !== canvas.width || base.height !== canvas.height) { base.width = canvas.width; base.height = canvas.height; }
    const c = bctx, P = patterns();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    // soot round the globe, a glow at its edge
    const glow = c.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.25);
    glow.addColorStop(0, 'rgba(239,226,196,.16)'); glow.addColorStop(1, 'rgba(239,226,196,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(cx, cy, R * 1.25, 0, 2 * Math.PI); c.fill();
    // the sea, ruled
    c.beginPath(); bpath(sphere); c.fillStyle = P.sea; c.fill();
    c.save(); c.beginPath(); bpath(sphere); c.clip();
    c.beginPath(); bpath(graticule); c.strokeStyle = 'rgba(156,123,82,.35)'; c.lineWidth = .6; c.stroke();
    const L = lod === 'hi' ? LAND : LANDLO;
    // water-lining: three rules following the coast out to sea (at rest only)
    if (!fast) {
      const sc = clamp(view.zoom, 1, 6);
      const ring = new Path2D(); // one projected path, stroked six times
      const rp = d3().geoPath(proj, ring);
      rp(view.zoom >= 5 ? L : LANDLO);
      for (const w of [13, 9, 5.5].map((x) => x * Math.sqrt(sc) / 1.4)) {
        c.strokeStyle = 'rgba(58,72,112,.5)'; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(ring);
        c.strokeStyle = SEA; c.lineWidth = w - 1.1; c.stroke(ring);
      }
    }
    const coast = new Path2D();
    d3().geoPath(proj, coast)(L);
    c.fillStyle = P.land; c.fill(coast);
    c.strokeStyle = INK; c.lineWidth = view.zoom > 4 ? 1.1 : .8; c.stroke(coast);
    // engraved names: nations in spaced capitals, seas in italic
    if (!fast) {
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const [name, lon, lat, minZ] of NATIONS) {
        if (view.zoom < minZ * .7 || !visible([lon, lat])) continue;
        const [x, y] = proj([lon, lat]);
        const size = clamp(4.2 * view.zoom + 4, 8, 26) * (minZ >= 3 ? .8 : 1);
        c.font = `${size}px "IM Fell English SC", Georgia, serif`;
        c.fillStyle = 'rgba(43,29,18,.42)';
        spaced(c, name, x, y, size * .32);
      }
      for (const [name, lon, lat, minZ] of SEAS) {
        if (view.zoom < minZ * .8 || !visible([lon, lat])) continue;
        const [x, y] = proj([lon, lat]);
        c.font = `italic ${clamp(3.4 * view.zoom + 5, 9, 22)}px "IM Fell English", Georgia, serif`;
        c.fillStyle = 'rgba(58,72,112,.62)';
        spaced(c, name, x, y, 1.5);
      }
    }
    if (!fast) { c.fillStyle = P.grain; c.fillRect(0, 0, W, H); }
    c.restore();
    // the rim: a double rule
    c.beginPath(); bpath(sphere); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    c.beginPath(); c.arc(cx, cy, R + 5, 0, 2 * Math.PI); c.strokeStyle = 'rgba(239,226,196,.55)'; c.lineWidth = .8; c.stroke();
    stats.base = performance.now() - t0; stats.bases++;
  }
  const charW = new Map();
  function spaced(c, text, x, y, sp) {
    const chars = [...text], widths = chars.map((ch) => { const k = c.font + ch; if (!charW.has(k)) charW.set(k, c.measureText(ch).width); return charW.get(k); });
    const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    let px = x - total / 2;
    c.textAlign = 'left';
    chars.forEach((ch, i) => { c.fillText(ch, px, y); px += widths[i] + sp; });
    c.textAlign = 'center';
  }

  /** Lon/lat of a point a fraction f along a line from `from`. */
  function along(Wd, lineId, from, f) {
    const l = Wd.line.get(lineId), c = lineCourse(Wd, l);
    const pts = from === l.a ? c.pts : [...c.pts].reverse();
    const km = from === l.a ? c.km : c.km.map((k) => c.total - k).reverse();
    const goal = clamp(f, 0, 1) * c.total;
    for (let i = 1; i < pts.length; i++) if (km[i] >= goal) { const u = (goal - km[i - 1]) / Math.max(1e-6, km[i] - km[i - 1]); return [pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1])]; }
    return pts[pts.length - 1];
  }
  const lineGeo = (Wd, l) => ({ type: 'LineString', coordinates: lineCourse(Wd, l).pts });

  function draw(G, ui) {
    const { cx, cy, R } = geom();
    proj.scale(R).translate([cx, cy]).rotate([-view.lon, -view.lat]);
    drawBase(cx, cy, R);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = SOOT; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!G) return;
    const { S, W: Wd, I } = G;
    // the night, hatched
    const sun = sunPoint(S.t);
    ctx.save(); ctx.beginPath(); path(sphere); ctx.clip();
    ctx.beginPath(); path(d3().geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)()); ctx.fillStyle = 'rgba(20,22,38,.24)'; ctx.fill();
    ctx.beginPath(); path(d3().geoCircle().center([sun[0] + 180, -sun[1]]).radius(80)()); ctx.fillStyle = patterns().night; ctx.fill();
    ctx.restore();
    const here = S.city;
    const known = ui.knownCancelled ?? new Set();
    // railways: a black and white band; steamers dotted; roads dashed; paths dotted red
    for (const l of G.D.lines) {
      const ends = [l.a, l.b];
      const fromHere = here && ends.includes(here);
      const onTrip = S.journey && S.journey.line === l.id;
      const hot = ui.highlight?.has(l.id);
      ctx.beginPath(); path(lineGeo(Wd, l));
      ctx.setLineDash([]);
      const strong = fromHere || onTrip || hot;
      if (l.mode === 'rail' || l.mode === 'ferry') {
        ctx.strokeStyle = strong ? INK : 'rgba(43,29,18,.62)'; ctx.lineWidth = strong ? 3.4 : 2.2; ctx.stroke();
        ctx.setLineDash(strong ? [4, 4] : [3, 3]); ctx.strokeStyle = PAPER; ctx.lineWidth = strong ? 1.6 : 1; ctx.stroke();
        if (l.mode === 'ferry') { /* the crossing part is drawn like a sea lane by its dots */ }
      } else if (l.mode === 'sea') {
        ctx.setLineDash([1.2, 3.4]); ctx.lineCap = 'round'; ctx.strokeStyle = strong ? INK : 'rgba(58,72,112,.85)'; ctx.lineWidth = strong ? 2.4 : 1.6; ctx.stroke(); ctx.lineCap = 'butt';
      } else {
        ctx.setLineDash([5, 3]); ctx.strokeStyle = strong ? INK : 'rgba(90,70,50,.8)'; ctx.lineWidth = strong ? 2 : 1.3; ctx.stroke();
      }
      if (known.has(l.id)) { const m = along(Wd, l.id, l.a, .5); if (visible(m)) { const [x, y] = proj(m); ctx.setLineDash([]); ctx.strokeStyle = BLOOD; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); } }
    }
    ctx.setLineDash([]);
    // frontier posts, closer in (their names are placed after the cities, where there is room)
    const frontierLabels = [];
    if (view.zoom >= 2.4) {
      const sentry = glyph('sentry'), seen = new Set();
      const s = clamp(view.zoom * 3.2, 10, 22);
      for (const l of G.D.lines) for (const f of l.frontiers) {
        if (seen.has(f.id) || !visible(f.ll)) continue;
        seen.add(f.id);
        const [x, y] = proj(f.ll);
        if (sentry) ctx.drawImage(sentry, x - s / 2, y - s / 2, s, s);
        else { ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 3, 6, 6); }
        if (view.zoom >= 4.5) frontierLabels.push({ name: f.name, x, y, off: s / 2 + 2 });
      }
    }
    // the journey: travelled part bold, the train on the line
    let trainAt = null;
    if (S.journey) {
      const j = S.journey, f = clamp((S.t - j.dep) / Math.max(1, j.arr - j.dep), 0, 1);
      const l = Wd.line.get(j.line), c = lineCourse(Wd, l);
      const pts = j.from === l.a ? c.pts : [...c.pts].reverse();
      const done = [], goal = f;
      for (let i = 0; i <= 40; i++) { const u = (i / 40) * goal; done.push(along(Wd, j.line, j.from, u)); }
      ctx.beginPath(); path({ type: 'LineString', coordinates: done }); ctx.strokeStyle = BLOOD; ctx.lineWidth = 3.4; ctx.stroke();
      trainAt = along(Wd, j.line, j.from, f);
      void pts;
    }
    // hunters as the player knows them: seen (solid), reported (dashed), rumoured (faint); and where they could be by now
    for (const m of ui.hunterMarks ?? []) {
      if (!visible(m.ll)) continue;
      const [x, y] = proj(m.ll);
      if (m.halo) for (const ll of m.halo) { if (!visible(ll)) continue; const [hx, hy] = proj(ll); ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 2 * Math.PI); ctx.setLineDash([2, 3]); ctx.strokeStyle = `rgba(140,29,18,${.5 * m.alpha})`; ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.setLineDash(m.kind === 'seen' ? [] : m.kind === 'reported' ? [4, 3] : [1.5, 3]);
      ctx.globalAlpha = m.alpha;
      const g = glyph('hunter'), s = 22;
      ctx.beginPath(); ctx.arc(x + 13, y - 13, 12, 0, 2 * Math.PI); ctx.fillStyle = PAPER; ctx.fill(); ctx.strokeStyle = BLOOD; ctx.lineWidth = 1.6; ctx.stroke();
      if (g) ctx.drawImage(g, x + 13 - s / 2 + 1, y - 13 - s / 2, s - 2, s - 2);
      ctx.setLineDash([]);
      ctx.font = `italic 12px "IM Fell English", Georgia, serif`; ctx.fillStyle = BLOOD; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(m.label, x + 13, y - 27);
      ctx.globalAlpha = 1;
    }
    // cities and their names (most important first, no overlaps)
    const labels = [];
    const conn = new Set(here ? G.D.lines.filter((l) => l.a === here || l.b === here).map((l) => (l.a === here ? l.b : l.a)) : []);
    const targets = ui.targets ?? new Set();
    for (const c of G.D.cities) {
      if (!visible(c.ll)) continue;
      const [x, y] = proj(c.ll);
      const isHere = c.id === here, isT = targets.has(c.id), isConn = conn.has(c.id), isEnd = S.journey && [S.journey.from, S.journey.to].includes(c.id);
      const r = isHere ? 5.5 : isConn || isEnd ? 4.4 : 3.4;
      ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, 2 * Math.PI); ctx.fillStyle = PAPER; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = INK; ctx.fill();
      if (c.capital) { ctx.beginPath(); ctx.arc(x, y, r + 3, 0, 2 * Math.PI); ctx.strokeStyle = INK; ctx.lineWidth = .9; ctx.stroke(); }
      if (isT) { ctx.beginPath(); ctx.arc(x, y, 12, 0, 2 * Math.PI); ctx.strokeStyle = BLOOD; ctx.lineWidth = 2.2; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 16, 0, 2 * Math.PI); ctx.lineWidth = .8; ctx.stroke(); }
      const prio = isHere || isEnd ? 0 : isT ? 1 : isConn ? 2 : 3;
      labels.push({ c, x, y, prio, big: prio <= 1, red: isT });
    }
    labels.sort((a, b) => a.prio - b.prio || a.y - b.y);
    const placed = [];
    const hits = (r) => placed.some((q) => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h);
    for (const L of labels) {
      const size = clamp((L.big ? 16 : 13.5) + (view.zoom - 2) * 1.1, L.big ? 15 : 12, L.big ? 22 : 18);
      ctx.font = `${size}px "IM Fell English SC", Georgia, serif`;
      const k = `${L.c.id}|${size}`;
      if (!labelW.has(k)) labelW.set(k, ctx.measureText(L.c.name).width + 4);
      const w = labelW.get(k), h = size + 2;
      const spots = [[L.x + 8, L.y - h / 2], [L.x - 8 - w, L.y - h / 2], [L.x - w / 2, L.y - 10 - h], [L.x - w / 2, L.y + 9]];
      const spot = spots.map(([x, y]) => ({ x, y, w, h })).find((r) => !hits(r) && r.x >= 4 && r.x + r.w <= W - 4 && r.y >= 4 && r.y + r.h <= H - 4);
      if (!spot && L.prio > 1) continue;
      const r = spot ?? { x: spots[0][0], y: spots[0][1], w, h };
      placed.push(r);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(239,226,196,.92)'; ctx.strokeText(L.c.name, r.x + 2, r.y + h / 2 + 1);
      ctx.fillStyle = L.red ? BLOOD : INK; ctx.fillText(L.c.name, r.x + 2, r.y + h / 2 + 1);
    }
    ctx.font = `italic ${clamp(view.zoom * 1.4 + 6, 11, 14)}px "IM Fell English", Georgia, serif`;
    for (const F of frontierLabels) {
      const w = ctx.measureText(F.name).width + 4, h = 14;
      const spots = [[F.x + F.off, F.y - h / 2], [F.x - F.off - w, F.y - h / 2], [F.x - w / 2, F.y + F.off]];
      const spot = spots.map(([x, y]) => ({ x, y, w, h })).find((r) => !hits(r) && r.x >= 4 && r.x + r.w <= W - 4 && r.y >= 4 && r.y + r.h <= H - 4);
      if (!spot) continue;
      placed.push(spot);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(239,226,196,.85)'; ctx.strokeText(F.name, spot.x + 2, spot.y + h / 2);
      ctx.fillStyle = 'rgba(43,29,18,.9)'; ctx.fillText(F.name, spot.x + 2, spot.y + h / 2);
    }
    // the train, or the player in a city
    if (trainAt && visible(trainAt)) {
      const [x, y] = proj(trainAt);
      const kind = Wd.line.get(S.journey.line).mode;
      const g = glyph(kind === 'sea' ? 'steamer' : kind === 'road' ? 'coach' : 'loco'), s = 30;
      ctx.beginPath(); ctx.arc(x, y, 15, 0, 2 * Math.PI); ctx.fillStyle = PAPER; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
      if (g) ctx.drawImage(g, x - s / 2 + 2, y - s / 2 + 1, s - 4, s - 4);
    } else if (here) {
      const c = I.city.get(here);
      if (visible(c.ll)) {
        const [x, y] = proj(c.ll);
        const pulse = reduceMotion ? .3 : (performance.now() / 1100) % 1;
        ctx.beginPath(); ctx.arc(x, y, 8 + pulse * 12, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(140,29,18,${.7 * (1 - pulse)})`; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fillStyle = BLOOD; ctx.fill(); ctx.strokeStyle = PAPER; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  }

  // ---------- the camera ----------
  function aim(G, dt = 1 / 60) {
    if (G && view.follow) {
      const { S, W: Wd, I } = G;
      const ledger = hooks.ledgerInset?.();
      if (S.journey) {
        const l = Wd.line.get(S.journey.line), c = lineCourse(Wd, l);
        const xs = c.pts.map((p) => p[0]), ys = c.pts.map((p) => p[1]);
        const mid = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
        const span = Math.max(d3().geoDistance([Math.min(...xs), mid[1]], [Math.max(...xs), mid[1]]), d3().geoDistance([mid[0], Math.min(...ys)], [mid[0], Math.max(...ys)]), .03);
        view.tLon = mid[0]; view.tLat = clamp(mid[1], -60, 72); view.tZoom = clamp(1.1 / span, 1.4, 14);
      } else if (S.city) {
        const c = I.city.get(S.city);
        view.tLon = c.ll[0]; view.tLat = clamp(c.ll[1] - (ledger?.bottom ? 1.5 : 0), -60, 72); view.tZoom = Math.max(view.tZoom, 3.2) > 6 ? view.tZoom : 3.2;
      }
    }
    const k = reduceMotion ? 1 : 1 - Math.pow(1 - 0.12, Math.min(6, dt * 60)); // frame-rate independent easing
    const dl = angDiff(view.tLon, view.lon), da = view.tLat - view.lat, dz = view.tZoom - view.zoom;
    if (Math.abs(dl) < .02 && Math.abs(da) < .02 && Math.abs(dz) < .004 * view.zoom) { // close enough: snap and rest
      const was = view.moving;
      view.lon = view.tLon; view.lat = view.tLat; view.zoom = view.tZoom; view.moving = false;
      if (was) hooks.redraw?.();
      return;
    }
    view.lon += dl * k; view.lat += da * k; view.zoom += dz * k;
    view.moving = true;
  }

  // ---------- input: drag, wheel, pinch, tap ----------
  const pointers = new Map();
  let dragStart = null, pinch0 = null, moved = false, idleTimer = 0;
  const settle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { view.interacting = false; baseKey = ''; hooks.redraw?.(); }, 160); };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 1) dragStart = { x: e.clientX, y: e.clientY, lon: view.lon, lat: view.lat };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom }; }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      view.tZoom = view.zoom = clamp(pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d, ZOOM[0], ZOOM[1]);
      view.follow = false; moved = true; view.interacting = true; settle(); hooks.redraw?.(); return;
    }
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) { moved = true; canvas.classList.add('dragging'); view.follow = false; }
    if (!moved) return;
    const { R } = geom(), k = 180 / Math.PI / R;
    view.lon = view.tLon = dragStart.lon - dx * k; view.lat = view.tLat = clamp(dragStart.lat + dy * k, -70, 80);
    view.interacting = true; settle(); hooks.redraw?.();
  });
  const end = (e) => {
    pointers.delete(e.pointerId); canvas.classList.remove('dragging');
    if (pointers.size < 2) pinch0 = null;
    if (pointers.size === 0) { if (!moved && dragStart) tap(e.clientX, e.clientY); dragStart = null; }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    view.tZoom = view.zoom = clamp(view.zoom * Math.exp(-e.deltaY * 0.0016), ZOOM[0], ZOOM[1]);
    view.follow = false; view.interacting = true; settle(); hooks.redraw?.();
  }, { passive: false });
  function tap(px, py) {
    const rect = canvas.getBoundingClientRect(), x = px - rect.left, y = py - rect.top;
    const G = hooks.game?.();
    if (!G) return;
    let best = null, bd = 24;
    for (const c of G.D.cities) { if (!visible(c.ll)) continue; const [cx, cy] = proj(c.ll); const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = c.id; } }
    if (best) hooks.onCity?.(best);
  }
  function zoomBy(f) { view.tZoom = clamp(view.tZoom * f, ZOOM[0], ZOOM[1]); view.follow = false; }
  function recentre() { view.follow = true; }

  resize();
  return { draw, aim, resize, view, zoomBy, recentre, stats, invalidate: () => { baseKey = ''; } };
}

/** The sub-solar point at a campaign minute (CET clock, summer declination). */
export function sunPoint(t) {
  const day = Math.floor(t / DAY) + 179; // 28 June is day 179 of 1914
  const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (day + 10));
  const m = ((t % DAY) + DAY) % DAY;
  const lon = -((m / 60 - 1) - 12) * 15; // CET is an hour ahead of Greenwich
  return [lon, decl];
}

/** Cities a hunter could have reached since a report, on the real timetable ("if true"). */
export function haloOf(Wd, city, from, to) {
  if (to - from < 60) return [];
  const r = earliest(Wd, city, from, { horizon: Math.min(3 * DAY, to - from + 60) });
  return [...r.entries()].filter(([c, v]) => c !== city && v.t <= to).map(([c]) => Wd.city.get(c).ll);
}
