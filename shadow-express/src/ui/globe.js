// The globe: a lit sphere hanging in space, the night creeping across it and an atmosphere glowing at its rim. Zoom in
// and the camera drops and tilts until the horizon curves across the top of the screen with sky above it. On it, the
// July 1914 map: railways, frontier posts, the hunters as the player knows them, the train.
// Two layers: a lit base (space, stars, atmosphere, sea, land, coast) cached per camera and per few game minutes of sun;
// and an overlay (lines, markers, labels, the train) redrawn whenever something moves.

import { land, landLo } from './land.js';
import { glyph } from './art.js';
import { lineCourse, earliest } from '../core/timetable.js';
import { DAY } from '../data/time.js';
import { makeCamera, ZOOM, BASE, toVec, toLonLat, rotationTaking } from './camera.js';
import { shade, PAL } from './shade.js';
import { drawIcon } from './icons.js';

export { ZOOM };
const d3 = () => window.d3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const angDiff = (a, b) => ((a - b + 540) % 360) - 180;
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const FONT = '"Oswald", "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif';
const START = 16 * 60; // 28 June 1914, 16.00 CET: the sun of the title screen

const C = {
  line: 'rgba(226,238,246,.34)', lineDim: 'rgba(226,238,246,.18)', lineStrong: '#f6e9c4', route: '#e1ec93',
  travelled: '#ff8a5c', ring: 'rgba(255,255,255,.88)', ringDim: 'rgba(255,255,255,.55)', here: '#e3342f', target: '#ffc451',
  hunter: '#d8412f', text: '#ffffff', halo: 'rgba(3,12,24,.62)', train: '#2d6fb5', post: 'rgba(255,255,255,.9)',
};

const NATIONS = [
  ['GREAT BRITAIN', -2.2, 53.4, 1], ['FRANCE', 2.4, 46.6, 1], ['GERMAN EMPIRE', 10.6, 51.4, 1], ['AUSTRIA-HUNGARY', 18.2, 47.4, 1],
  ['RUSSIAN EMPIRE', 33, 55.6, 1], ['ITALY', 12.4, 42.8, 1], ['SPAIN', -3.8, 40.0, 1], ['PORTUGAL', -8.1, 39.7, 2], ['SWITZERLAND', 8.2, 46.75, 3],
  ['NETHERLANDS', 5.7, 52.5, 3], ['BELGIUM', 4.7, 50.55, 3], ['DENMARK', 9.4, 56.1, 2], ['SWEDEN', 15.6, 62.2, 1], ['NORWAY', 9.2, 61.2, 2],
  ['SERBIA', 21.0, 43.95, 2], ['ROUMANIA', 25.0, 45.8, 2], ['BULGARIA', 25.4, 42.75, 2], ['GREECE', 22.0, 39.5, 2], ['OTTOMAN EMPIRE', 33.5, 39.4, 1],
  ['MONTENEGRO', 19.3, 42.75, 4], ['ALBANIA', 20.0, 41.1, 4], ['LUXEMBOURG', 6.1, 49.75, 6],
];
const SEAS = [['North Sea', 3.6, 56.2, 1], ['Baltic Sea', 19.2, 57.6, 1], ['Mediterranean Sea', 16, 35.2, 1], ['Black Sea', 34.2, 43.2, 1], ['Adriatic', 15.6, 42.8, 2],
  ['Atlantic Ocean', -16, 46, 1], ['Bay of Biscay', -5.2, 45.3, 2], ['Aegean', 25.0, 38.4, 3], ['Tyrrhenian Sea', 11.8, 39.8, 2], ['English Channel', -2.0, 49.9, 3]];

/** A separable box blur of a w×h field, radius r (clamped at the edges). */
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const o = y * w; let s = 0;
    for (let x = -r; x <= r; x++) s += src[o + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) { tmp[o + x] = s / n; s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
  }
  return out;
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ang = (a, b) => Math.acos(clamp(dot(a, b), -1, 1));
/** Each coastline polygon with the cap that bounds it (centre, angular radius), so hidden ones are skipped cheaply. */
function capsOf(geo) {
  return geo.coordinates.map((poly) => {
    const vs = poly[0].map(([lon, lat]) => toVec(lon, lat));
    const m = vs.reduce((a, v) => [a[0] + v[0], a[1] + v[1], a[2] + v[2]], [0, 0, 0]), l = Math.hypot(...m) || 1;
    const c = [m[0] / l, m[1] / l, m[2] / l];
    return { poly, c, r: vs.reduce((a, v) => Math.max(a, ang(v, c)), 0) };
  });
}

/** Stars, fixed on the sky: direction, size, brightness. */
const STARS = (() => {
  let s = 1914; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 1300 }, () => { const z = r() * 2 - 1, a = r() * Math.PI * 2, q = Math.sqrt(1 - z * z), m = Math.pow(r(), 3.6); return { v: [q * Math.cos(a), q * Math.sin(a), z], a: 0.14 + 0.82 * m, s: 0.6 + 1.5 * m }; });
})();

export function makeGlobe(canvas, hooks) {
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas'), bctx = base.getContext('2d');
  const tex = { sky: document.createElement('canvas'), sea: document.createElement('canvas'), land: document.createElement('canvas') };
  const cam = makeCamera(d3());
  const path = d3().geoPath(cam.proj, ctx);
  const SPHERE = { type: 'Sphere' };
  const CAPS = { hi: capsOf(land), lo: capsOf(landLo) };
  const view = { lon: 6, lat: 50, zoom: 1.6, tLon: 6, tLat: 50, tZoom: 1.6, follow: true, moving: false, interacting: false };
  const stats = { base: 0, bases: 0, light: 0 };
  let W = 1, H = 1, DPR = 1, baseKey = '', vecKey = '', vec = null, grid = null, drift = 0;
  const labelW = new Map(), charW = new Map();
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    const phone = Math.min(W, H) < 600;
    DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    baseKey = ''; vecKey = '';
  }
  function geom() {
    const ledger = hooks.ledgerInset?.() ?? { right: 0, bottom: 0 };
    const w = W - ledger.right, h = H - ledger.bottom;
    // on a tall screen the view centre sits a little high, so less of the picture is sky
    return { cx: w / 2, cy: h * (h > w * 1.3 ? 0.42 : 0.5) + (H < 600 ? 8 : 0), size: Math.min(w, h), w, h };
  }
  /** The zoom of a city view: about 1150 px per radian of the globe, whatever the screen. */
  const cityZoom = () => clamp(1150 / (Math.min(W, H) * BASE), 2.4, 8);
  function setCam() { const g = geom(); cam.set({ lon: view.lon, lat: view.lat, zoom: view.zoom, cx: g.cx, cy: g.cy, size: g.size }); return g; }
  const visible = (ll) => cam.visible(ll[0], ll[1]);
  const proj = (ll) => cam.proj(ll);

  function put(cv, data, w, h) {
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
  }
  /** Angular radius about the view centre that the screen spans, or null if the sky shows (then the horizon bounds it). */
  function screenCap() {
    let m = 0;
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, 0], [W / 2, H], [0, H / 2], [W, H / 2]]) {
      const ll = cam.unproject(x, y);
      if (!ll) return null;
      m = Math.max(m, ang(toVec(ll[0], ll[1]), cam.T));
    }
    return m * 1.15 + 0.02;
  }
  function buildVec(lod) {
    const sc = screenCap(), h = cam.horizon + 0.01;
    const polys = CAPS[lod].filter(({ c, r }) => ang(c, cam.S) - r < h && (sc == null || ang(c, cam.T) - r < sc));
    const coast = new Path2D(); d3().geoPath(cam.coarse, coast)({ type: 'MultiPolygon', coordinates: polys.map((q) => q.poly) });
    const sphere = new Path2D(); d3().geoPath(cam.proj, sphere)(SPHERE);
    return { coast, sphere };
  }
  // the shallows: a soft light in the sea along every coast, from the land drawn small and blurred
  const maskCv = document.createElement('canvas'), mctx = maskCv.getContext('2d', { willReadFrequently: true });
  let shelf = null, shelfKey = '';
  function shelfOf(gw, gh, cell) {
    const key = `${vecKey}|${gw}|${gh}|${cell}`;
    if (key === shelfKey) return shelf;
    shelfKey = key;
    if (maskCv.width !== gw || maskCv.height !== gh) { maskCv.width = gw; maskCv.height = gh; }
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, gw, gh);
    mctx.setTransform(1 / cell, 0, 0, 1 / cell, 0.5, 0.5); // texel i is centred on screen pixel i·cell
    mctx.fillStyle = '#fff'; mctx.fill(vec.coast);
    const a = mctx.getImageData(0, 0, gw, gh).data, m = new Float32Array(gw * gh);
    for (let i = 0; i < m.length; i++) m[i] = a[i * 4 + 3] / 255;
    const r = Math.max(1, Math.round(10 / cell));
    const b = boxBlur(boxBlur(m, gw, gh, r), gw, gh, r);
    for (let i = 0; i < m.length; i++) b[i] = Math.min(1, b[i] * 1.1) * (1 - m[i]);
    return (shelf = b);
  }
  /** Stars, fading where the atmosphere glows (the haze field from the shader, one texel per `cell` pixels). */
  function drawStars(c, haze, gw, gh, cell) {
    const Fs = 0.95 * Math.max(W, H);
    for (const s of STARS) {
      const [l, p] = cam.rot(toLonLat(s.v));
      const v = toVec(l, p);
      const zc = v[0] * cam.f[0] + v[2] * cam.f[2];
      if (zc < 0.2) continue;
      const x = cam.cx + Fs * v[1] / zc, y = cam.cy - Fs * (v[0] * cam.u[0] + v[2] * cam.u[2]) / zc;
      if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
      const hz = haze[clamp(Math.round(y / cell), 0, gh - 1) * gw + clamp(Math.round(x / cell), 0, gw - 1)] / 255;
      const a = s.a * (1 - hz) * (1 - hz);
      if (a < 0.04) continue;
      c.fillStyle = `rgba(235,242,255,${a.toFixed(2)})`;
      c.fillRect(x, y, s.s, s.s);
    }
  }

  // ---------- the lit base ----------
  let lastLight = 0, baseScale = 1;
  function drawBase(t) {
    const fast = view.interacting || view.moving;
    const lod = !fast && cam.R >= 800 ? 'hi' : 'lo';
    const ck = [W, H, DPR, view.lon.toFixed(3), view.lat.toFixed(3), view.zoom.toFixed(4), lod, fast ? 1 : 0, cam.cx.toFixed(1), cam.cy.toFixed(1)].join('|');
    const key = `${ck}|${Math.floor(t / 4)}`;
    if (key === baseKey) return;
    const now = performance.now();
    if (ck === vecKey && now - lastLight < 110) return; // only the sun moved: relight a few times a second, no more
    baseKey = key; lastLight = now;
    const t0 = now;
    // while the camera moves the base is drawn at one pixel per CSS pixel and scaled up: motion hides it
    baseScale = fast ? 1 : DPR;
    const bw = Math.round(W * baseScale), bh = Math.round(H * baseScale);
    if (base.width !== bw || base.height !== bh) { base.width = bw; base.height = bh; }
    if (ck !== vecKey) { vecKey = ck; vec = buildVec(lod); }
    const sun = sunPoint(t);
    const cell = fast ? 10 : 6;
    const t1 = performance.now();
    grid = shade(cam.frame(sun[0], sun[1]), W, H, cell, PAL, grid);
    const sh = shelfOf(grid.gw, grid.gh, cell), sea = grid.sea;
    for (let i = 0, o = 0; i < sh.length; i++, o += 4) {
      const v = sh[i];
      if (v < 0.004) continue;
      sea[o] = sea[o] * (1 + 0.32 * v) + 6 * v; sea[o + 1] = sea[o + 1] * (1 + 0.46 * v) + 14 * v; sea[o + 2] = sea[o + 2] * (1 + 0.4 * v) + 16 * v;
    }
    put(tex.sky, grid.sky, grid.gw, grid.gh); put(tex.sea, sea, grid.gw, grid.gh); put(tex.land, grid.land, grid.gw, grid.gh);
    stats.light = performance.now() - t1;
    const c = bctx;
    c.setTransform(baseScale, 0, 0, baseScale, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the lighting is smooth: bilinear scaling of the coarse grid is exact enough, and far cheaper than 'high'
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low';
    const o = -cell / 2, M = new DOMMatrix([cell, 0, 0, cell, o, o]);
    c.drawImage(tex.sky, o, o, grid.gw * cell, grid.gh * cell); // opaque: space and the atmosphere in one
    drawStars(c, grid.haze, grid.gw, grid.gh, cell);
    const seaP = c.createPattern(tex.sea, 'no-repeat'); seaP.setTransform(M);
    c.fillStyle = seaP; c.fill(vec.sphere);
    const landP = c.createPattern(tex.land, 'no-repeat'); landP.setTransform(M);
    c.fillStyle = landP; c.fill(vec.coast);
    if (!fast) { c.strokeStyle = 'rgba(220,238,242,.3)'; c.lineWidth = cam.R > 1800 ? 0.9 : 0.6; c.stroke(vec.coast); }
    c.strokeStyle = 'rgba(170,214,255,.22)'; c.lineWidth = 1; c.stroke(vec.sphere);
    stats.base = performance.now() - t0; stats.bases++;
  }
  /** Width of letter-spaced text in the current font. */
  function spacedW(c, text, sp) {
    let total = -sp;
    for (const ch of text) { const k = c.font + ch; if (!charW.has(k)) charW.set(k, c.measureText(ch).width); total += charW.get(k) + sp; }
    return total;
  }
  /** Letter-spaced text centred on (x, y); with `halo`, a dark outline under it. */
  function spaced(c, text, x, y, sp, halo = 0) {
    const total = spacedW(c, text, sp);
    const al = c.textAlign; c.textAlign = 'left';
    for (const pass of halo ? [0, 1] : [1]) {
      let px = x - total / 2;
      for (const ch of text) { if (pass) c.fillText(ch, px, y); else c.strokeText(ch, px, y); px += charW.get(c.font + ch) + sp; }
    }
    c.textAlign = al;
    return total;
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

  // ---------- the overlay ----------
  function draw(G, ui = {}) {
    setCam();
    drawBase(sunT ?? (G ? G.S.t : START + drift));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!G) return;
    const { S, W: Wd, I } = G;
    const here = S.city;
    const known = ui.knownCancelled ?? new Set();
    const now = performance.now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // railways, sea lanes and roads; the lines out of here, and the planned route, stand out
    for (const l of G.D.lines) {
      const fromHere = here && (l.a === here || l.b === here);
      const onTrip = S.journey && S.journey.line === l.id;
      const hot = ui.highlight?.has(l.id);
      ctx.beginPath(); path(lineGeo(Wd, l));
      ctx.setLineDash(l.mode === 'sea' ? [0.1, 4.2] : l.mode === 'road' ? [5, 4] : []);
      if (hot) {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(225,236,147,.22)'; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = C.route; ctx.lineWidth = 3.2; ctx.stroke();
      } else if (fromHere || onTrip) {
        ctx.strokeStyle = C.lineStrong; ctx.lineWidth = l.mode === 'sea' ? 2.6 : 2; ctx.stroke();
      } else {
        ctx.strokeStyle = l.mode === 'rail' || l.mode === 'ferry' ? C.line : C.lineDim; ctx.lineWidth = l.mode === 'sea' ? 1.8 : 1.15; ctx.stroke();
      }
      if (known.has(l.id)) {
        const m = along(Wd, l.id, l.a, 0.5);
        if (visible(m)) { const [x, y] = proj(m); ctx.setLineDash([]); ctx.strokeStyle = C.here; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); }
      }
    }
    ctx.setLineDash([]);
    // frontier posts, closer in: a small barrier; their names where there is room
    const frontierLabels = [];
    if (cam.R >= 1100) {
      const seen = new Set(), s = clamp(cam.R / 600, 2.6, 4.2);
      for (const l of G.D.lines) for (const f of l.frontiers) {
        if (seen.has(f.id) || !visible(f.ll)) continue;
        seen.add(f.id);
        const [x, y] = proj(f.ll);
        ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
        ctx.fillStyle = C.post; ctx.fill(); ctx.strokeStyle = 'rgba(3,12,24,.7)'; ctx.lineWidth = 1; ctx.stroke();
        if (cam.R >= 3200) frontierLabels.push({ name: f.name, x, y, off: s + 3 });
      }
    }
    // the journey: travelled part bright, the train on the line
    let trainAt = null;
    if (S.journey) {
      const j = S.journey, f = clamp((S.t - j.dep) / Math.max(1, j.arr - j.dep), 0, 1);
      const done = [];
      for (let i = 0; i <= 40; i++) done.push(along(Wd, j.line, j.from, (i / 40) * f));
      ctx.beginPath(); path({ type: 'LineString', coordinates: done });
      ctx.strokeStyle = 'rgba(255,138,92,.25)'; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = C.travelled; ctx.lineWidth = 3.2; ctx.stroke();
      trainAt = along(Wd, j.line, j.from, f);
    }
    // hunters as the player knows them: seen (solid), reported (dashed), rumoured (faint); where they could be by now
    for (const m of ui.hunterMarks ?? []) {
      if (!visible(m.ll)) continue;
      const [x, y] = proj(m.ll);
      if (m.halo) for (const ll of m.halo) { if (!visible(ll)) continue; const [hx, hy] = proj(ll); ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 2 * Math.PI); ctx.setLineDash([2, 3]); ctx.strokeStyle = `rgba(216,65,47,${0.55 * m.alpha})`; ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.setLineDash(m.kind === 'seen' ? [] : m.kind === 'reported' ? [4, 3] : [1.5, 3]);
      ctx.globalAlpha = m.alpha;
      const g = glyph('hunter'), s = 22;
      ctx.beginPath(); ctx.arc(x + 13, y - 13, 12, 0, 2 * Math.PI); ctx.fillStyle = '#f3ead6'; ctx.fill(); ctx.strokeStyle = C.hunter; ctx.lineWidth = 2; ctx.stroke();
      if (g) ctx.drawImage(g, x + 13 - s / 2 + 1, y - 13 - s / 2, s - 2, s - 2);
      ctx.setLineDash([]);
      ctx.font = `500 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = C.halo; ctx.strokeText(m.label.toUpperCase(), x + 13, y - 27);
      ctx.fillStyle = '#ffb3a6'; ctx.fillText(m.label.toUpperCase(), x + 13, y - 27);
      ctx.globalAlpha = 1;
    }
    // cities: rings, brighter where a line leaves for them, amber where an order wants you
    const labels = [];
    const conn = new Set(here ? G.D.lines.filter((l) => l.a === here || l.b === here).map((l) => (l.a === here ? l.b : l.a)) : []);
    const targets = ui.targets ?? new Set();
    const pulse = reduceMotion ? 0.3 : (now / 1400) % 1;
    const mk = clamp(cam.R / 900, 0.6, 1); // markers shrink when the globe is small
    for (const c of G.D.cities) {
      if (!visible(c.ll)) continue;
      const [x, y] = proj(c.ll);
      const isHere = c.id === here, isT = targets.has(c.id), isConn = conn.has(c.id), isEnd = S.journey && [S.journey.from, S.journey.to].includes(c.id);
      if (!isHere) {
        const r = (c.capital ? 4.3 : 3.4) * mk;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(3,14,26,.42)'; ctx.fill();
        ctx.lineWidth = isConn || isEnd ? 1.9 : 1.4; ctx.strokeStyle = isConn || isEnd || isT ? C.ring : C.ringDim; ctx.stroke();
        if (c.capital && cam.R > 700) { ctx.beginPath(); ctx.arc(x, y, r + 2.8, 0, 2 * Math.PI); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke(); }
      }
      if (isT && !isHere) {
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 2 * Math.PI); ctx.strokeStyle = C.target; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 9 + pulse * 10, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(255,196,81,${0.65 * (1 - pulse)})`; ctx.lineWidth = 1.4; ctx.stroke();
      }
      if (ui.planTo === c.id && !isHere) pill(x, y - 15);
      if (isHere && ui.callout && !S.journey) continue; // the callout names it
      const prio = isHere || isEnd ? 0 : isT ? 1 : isConn ? 2 : 3;
      labels.push({ c, x, y, prio, big: prio <= 1, gold: isT && !isHere });
    }
    labels.sort((a, b) => a.prio - b.prio || a.y - b.y);
    const placed = [];
    const hits = (r) => placed.some((q) => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h);
    // names keep off other cities' markers, and off the callout over the city you are in (the HUD draws it there)
    const marks = [];
    for (const c of G.D.cities) { if (!visible(c.ll)) continue; const [x, y] = proj(c.ll); marks.push({ id: c.id, x: x - 6, y: y - 6, w: 12, h: 12 }); }
    if (ui.callout && here && !S.journey && visible(I.city.get(here).ll)) {
      const [x, y] = proj(I.city.get(here).ll);
      marks.push({ id: '', x: x - 110, y: y < 150 ? y + 4 : y - 124, w: 220, h: 120 });
    }
    const onMark = (r, id) => marks.some((m) => m.id !== id && r.x < m.x + m.w && m.x < r.x + r.w && r.y < m.y + m.h && m.y < r.y + r.h);
    const lk = clamp(Math.log2(cam.R / 700), -1, 1.4);
    for (const L of labels) {
      if (L.prio === 3 && cam.R < 600) continue;
      const size = Math.round(((L.big ? 13.5 : 11) + lk * 1.1) * 2) / 2;
      ctx.font = `${L.big ? 500 : 400} ${size}px ${FONT}`;
      const name = L.c.name.toUpperCase(), sp = size * 0.08;
      const k = `${L.c.id}|${ctx.font}`;
      if (!labelW.has(k)) labelW.set(k, spacedW(ctx, name, sp) + 4);
      const w = labelW.get(k), h = size + 2;
      const spots = [[L.x + 8, L.y - h / 2], [L.x - 8 - w, L.y - h / 2], [L.x - w / 2, L.y - 10 - h], [L.x - w / 2, L.y + 8]];
      const spot = spots.map(([x, y]) => ({ x, y, w, h })).find((r) => !hits(r) && !onMark(r, L.c.id) && r.x >= 4 && r.x + r.w <= W - 4 && r.y >= 4 && r.y + r.h <= H - 4);
      if (!spot && L.prio > 1) continue;
      const r = spot ?? { x: spots[0][0], y: spots[0][1], w, h };
      placed.push(r);
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.2; ctx.strokeStyle = C.halo; ctx.fillStyle = L.gold ? '#ffd27a' : L.prio <= 2 ? C.text : 'rgba(255,255,255,.78)';
      spaced(ctx, name, r.x + w / 2, r.y + h / 2 + 1, sp, 1);
    }
    ctx.font = `italic 400 ${clamp(view.zoom * 1.3 + 6, 10.5, 13)}px ${FONT}`;
    for (const F of frontierLabels) {
      const w = ctx.measureText(F.name).width + 4, h = 14;
      const spots = [[F.x + F.off, F.y - h / 2], [F.x - F.off - w, F.y - h / 2], [F.x - w / 2, F.y + F.off]];
      const spot = spots.map(([x, y]) => ({ x, y, w, h })).find((r) => !hits(r) && !onMark(r, null) && r.x >= 4 && r.x + r.w <= W - 4 && r.y >= 4 && r.y + r.h <= H - 4);
      if (!spot) continue;
      placed.push(spot);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.strokeStyle = C.halo; ctx.strokeText(F.name, spot.x + 2, spot.y + h / 2);
      ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.fillText(F.name, spot.x + 2, spot.y + h / 2);
    }
    // nations and seas: faint, and only where they clash with nothing
    ctx.textBaseline = 'middle';
    for (const [name, lon, lat, minZ] of NATIONS) {
      if (cam.R < minZ * 520 || !visible([lon, lat])) continue;
      const [x, y] = proj([lon, lat]);
      const size = Math.round(clamp(8 + Math.log2(cam.R / 300) * 2.6, 9, 17) * (minZ >= 3 ? 0.82 : 1));
      ctx.font = `500 ${size}px ${FONT}`;
      const sp = size * 0.34, w = spacedW(ctx, name, sp), r = { x: x - w / 2, y: y - size / 2, w, h: size };
      if (hits(r) || onMark(r, null)) continue;
      placed.push(r);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; spaced(ctx, name, x, y, sp);
    }
    for (const [name, lon, lat, minZ] of SEAS) {
      if (cam.R < minZ * 620 || !visible([lon, lat])) continue;
      const [x, y] = proj([lon, lat]);
      const size = Math.round(clamp(8 + Math.log2(cam.R / 300) * 2.2, 10, 16));
      ctx.font = `italic 300 ${size}px ${FONT}`;
      const w = spacedW(ctx, name, 1.4), r = { x: x - w / 2, y: y - size / 2, w, h: size };
      if (hits(r) || onMark(r, null)) continue;
      placed.push(r);
      ctx.fillStyle = 'rgba(196,228,246,.36)'; spaced(ctx, name, x, y, 1.4);
    }
    // the train, or the player in a city: a red capsule with a heartbeat
    if (trainAt && visible(trainAt)) {
      const [x, y] = proj(trainAt);
      const kind = Wd.line.get(S.journey.line).mode;
      ctx.beginPath(); ctx.arc(x, y, 16, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(45,111,181,.3)'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 13, 0, 2 * Math.PI); ctx.fillStyle = C.train; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.stroke();
      drawIcon(ctx, kind === 'sea' ? 'steamer' : kind === 'road' ? 'coach' : 'train', x, y, 17, '#ffffff');
    } else if (here) {
      const c = I.city.get(here);
      if (visible(c.ll)) {
        const [x, y] = proj(c.ll);
        ctx.beginPath(); ctx.ellipse(x, y, 10 + pulse * 14, 7 + pulse * 10, 0, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(227,52,47,${0.7 * (1 - pulse)})`; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, 8, 5.2, 0, 0, 2 * Math.PI); ctx.fillStyle = C.here; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  }
  function pill(x, y) { // the planned destination: a white pill with a play mark
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 11, y - 7, 22, 14, 7) : ctx.rect(x - 11, y - 7, 22, 14);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3, y - 4); ctx.lineTo(x + 4.5, y); ctx.lineTo(x - 3, y + 4); ctx.closePath(); ctx.fillStyle = '#0d2238'; ctx.fill();
  }

  // ---------- the light's clock ----------
  // It follows the game's clock, but holds still while days fly past (a routine, the fastest speed) and then sweeps
  // forward to the hour at no more than ten hours a second: day and night never flicker across the screen.
  let sunT = null, clockT = null;
  function sunClock(t, dt) {
    if (sunT == null || t < clockT || t - sunT > 3 * DAY) { sunT = clockT = t; return; }
    const rate = dt > 0 ? (t - clockT) / dt : 0;
    clockT = t;
    if (rate > 360) return;
    const d = (((t - sunT) % DAY) + DAY) % DAY, step = 600 * dt;
    sunT = d <= step ? t : sunT + step;
  }

  // ---------- the camera ----------
  function aim(G, dt = 1 / 60) {
    sunClock(G ? G.S.t : START + drift, dt);
    if (!G && !view.interacting && !reduceMotion) { view.tLon = view.lon = (view.lon + dt * 3) % 360; drift = (drift + dt * 4) % (24 * 60); } // the title screen turns slowly
    if (G && view.follow) {
      const { S, W: Wd, I } = G;
      if (S.journey) {
        const l = Wd.line.get(S.journey.line), c = lineCourse(Wd, l);
        const xs = c.pts.map((p) => p[0]), ys = c.pts.map((p) => p[1]);
        const mid = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
        const span = Math.max(d3().geoDistance([Math.min(...xs), mid[1]], [Math.max(...xs), mid[1]]), d3().geoDistance([mid[0], Math.min(...ys)], [mid[0], Math.max(...ys)]), 0.03);
        view.tLon = mid[0]; view.tLat = clamp(mid[1], -60, 72); view.tZoom = clamp(0.95 / span, 1.4, cityZoom() * 2.2);
      } else if (S.city) {
        const c = I.city.get(S.city);
        const z = cityZoom();
        view.tLon = c.ll[0]; view.tLat = clamp(c.ll[1], -60, 72); view.tZoom = view.tZoom > z * 2 ? view.tZoom : z;
      }
    }
    const k = reduceMotion ? 1 : 1 - Math.pow(1 - 0.11, Math.min(6, dt * 60)); // frame-rate independent easing
    const dl = angDiff(view.tLon, view.lon), da = view.tLat - view.lat, dz = view.tZoom - view.zoom;
    if (Math.abs(dl) < 0.02 && Math.abs(da) < 0.02 && Math.abs(dz) < 0.004 * view.zoom) { // close enough: snap and rest
      const was = view.moving;
      view.lon = view.tLon; view.lat = view.tLat; view.zoom = view.tZoom; view.moving = false;
      if (was) hooks.redraw?.();
      return;
    }
    view.lon += dl * k; view.lat += da * k; view.zoom += dz * k;
    view.moving = true;
  }

  // ---------- input: grab and drag, pinch and wheel toward the pointer, tap, double tap ----------
  const pointers = new Map();
  let drag = null, pinch0 = null, moved = false, idleTimer = 0, lastTap = 0;
  const settle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (pointers.size && moved) return; view.interacting = false; baseKey = ''; hooks.redraw?.(); }, 160); };
  const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  /** Turn the globe so the surface point `grabbed` sits under pixel (x, y) again. */
  function keepUnder(grabbed, x, y) {
    setCam();
    const now = cam.unproject(x, y);
    if (!grabbed || !now) return false;
    const T = rotationTaking(toVec(...now), toVec(...grabbed))(toVec(view.lon, view.lat));
    const [lon, lat] = toLonLat(T);
    view.lon = view.tLon = lon; view.lat = view.tLat = clamp(lat, -70, 80);
    return true;
  }
  function zoomAt(z, x, y) {
    setCam();
    const grabbed = cam.unproject(x, y);
    view.zoom = view.tZoom = clamp(z, ZOOM[0], ZOOM[1]);
    keepUnder(grabbed, x, y);
    view.follow = false; view.interacting = true; settle(); hooks.redraw?.();
  }
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = local(e);
    pointers.set(e.pointerId, { x, y });
    moved = false;
    setCam();
    if (pointers.size === 1) drag = { x0: x, y0: y, x, y, grabbed: cam.unproject(x, y) };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a.x - b.x, a.y - b.y), z: view.zoom }; drag = null; }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const [x, y] = local(e);
    pointers.set(e.pointerId, { x, y });
    if (pointers.size === 2 && pinch0) {
      const [a, b] = [...pointers.values()];
      moved = true;
      zoomAt(pinch0.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch0.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (!drag) return;
    if (!moved && Math.abs(x - drag.x0) + Math.abs(y - drag.y0) > 5) { moved = true; canvas.classList.add('dragging'); view.follow = false; }
    if (!moved) return;
    if (!keepUnder(drag.grabbed, x, y)) { // grabbed the sky: turn by the pointer's travel instead
      const k = 180 / Math.PI / cam.R;
      view.lon = view.tLon = view.lon - (x - drag.x) * k; view.lat = view.tLat = clamp(view.lat + (y - drag.y) * k, -70, 80);
    }
    drag.x = x; drag.y = y;
    view.interacting = true; settle(); hooks.redraw?.();
  });
  const end = (e) => {
    const [x, y] = local(e);
    pointers.delete(e.pointerId); canvas.classList.remove('dragging');
    if (pointers.size < 2) pinch0 = null;
    if (pointers.size === 0) {
      if (!moved && drag) {
        const t = performance.now();
        if (t - lastTap < 320) { lastTap = 0; zoomAt(view.zoom * 1.9, x, y); } else { lastTap = t; tap(x, y); }
      }
      drag = null;
      if (view.interacting) settle();
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = local(e); zoomAt(view.zoom * Math.exp(-e.deltaY * 0.0016), x, y); }, { passive: false });
  function tap(x, y) {
    const G = hooks.game?.();
    if (!G) return;
    let best = null, bd = 26;
    for (const c of G.D.cities) { if (!visible(c.ll)) continue; const [cx, cy] = proj(c.ll); const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = c.id; } }
    if (best) hooks.onCity?.(best);
  }
  function zoomBy(f) { view.tZoom = clamp(view.tZoom * f, ZOOM[0], ZOOM[1]); view.follow = false; }
  function recentre() { view.follow = true; }
  /** Where a lon/lat is on screen now (CSS pixels), or null if it is over the horizon. */
  function project(ll) { return visible(ll) ? proj(ll) : null; }

  resize();
  setCam();
  return { draw, aim, resize, view, zoomBy, recentre, stats, project, invalidate: () => { baseKey = ''; vecKey = ''; } };
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
