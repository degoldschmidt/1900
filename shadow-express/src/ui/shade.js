// Light on the globe. A coarse grid of rays is cast from the camera: rays that hit the sphere get a sea colour and a
// land colour for that spot (day or night, the terminator's dusk, the rim of atmosphere at the limb, pale polar caps);
// rays that miss get the glow of the atmosphere they pass through (blue on the night side, gold toward the sun, a
// peach band along the dusk). Lighting changes slowly across the screen, so a coarse grid, scaled up smoothly, looks
// exact; the crisp coastlines come from the vector map that is masked through it. Pure: no DOM, testable in Node.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** The palette: night (dusk teal and navy) and day (the sunlit side, warm and sepia). [r, g, b], 0–255. */
export const PAL = {
  space: [3, 7, 18],
  seaN: [9, 40, 78], seaD: [98, 124, 148],
  landN: [36, 112, 102], landD: [118, 99, 62],
  iceN: [112, 156, 168], iceD: [214, 210, 196],
  rimN: [84, 164, 238], rimD: [255, 234, 186], dusk: [255, 156, 96],
  glowN: [34, 104, 206], glowD: [255, 228, 172],
};

/** Daylight at a surface normal n for sun direction s: 0 night … 1 day, with a soft dusk between. */
export const daylight = (lam) => smooth(lam, -0.1, 0.3);

/**
 * Shade a W×H screen (CSS pixels) at `cell` pixels per sample. `frame` comes from camera.frame(sunLon, sunLat).
 * Returns { gw, gh, sky, sea, land, haze }: sky, sea and land are gw×gh opaque RGBA texels (the sky already laid over
 * the black of space), haze is the atmosphere's strength per texel (0–255), so stars can fade behind it.
 */
export function shade(frame, W, H, cell, pal = PAL, reuse = null) {
  const gw = Math.ceil(W / cell) + 1, gh = Math.ceil(H / cell) + 1, n = gw * gh * 4;
  const sky = reuse?.sky?.length === n ? reuse.sky : new Uint8ClampedArray(n);
  const sea = reuse?.sea?.length === n ? reuse.sea : new Uint8ClampedArray(n);
  const land = reuse?.land?.length === n ? reuse.land : new Uint8ClampedArray(n);
  const haze = reuse?.haze?.length === n / 4 ? reuse.haze : new Uint8ClampedArray(n / 4);
  const SP = pal.space;
  const { D, f, r, u, F, cx, cy, sun, pole } = frame;
  const c2 = D * D - 1;
  const sx = sun[0], sy = sun[1], sz = sun[2], px_ = pole[0], py_ = pole[1], pz_ = pole[2];
  const P = pal;
  let o = 0;
  for (let j = 0; j < gh; j++) {
    const b = -(j * cell - cy) / F;
    for (let i = 0; i < gw; i++, o += 4) {
      const a = (i * cell - cx) / F;
      // the ray through this sample, normalised (f, r, u are orthonormal)
      let dx = f[0] + r[0] * a + u[0] * b, dy = f[1] + r[1] * a + u[1] * b, dz = f[2] + r[2] * a + u[2] * b;
      const il = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz); dx *= il; dy *= il; dz *= il;
      const bq = D * dx, disc = bq * bq - c2;
      let nx, ny, nz, mu, hit = false;
      if (disc > 0 && -bq - Math.sqrt(disc) > 0) {
        const t = -bq - Math.sqrt(disc);
        nx = D + t * dx; ny = t * dy; nz = t * dz;
        mu = -(dx * nx + dy * ny + dz * nz);
        hit = true;
      } else {
        // closest approach of the ray to the centre: the limb point it grazes, and how high above it the ray passes
        const t0 = Math.max(0, -bq);
        const qx = D + t0 * dx, qy = t0 * dy, qz = t0 * dz, dm = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
        nx = qx / dm; ny = qy / dm; nz = qz / dm; mu = 0;
        // the atmosphere: a thin bright shell and a broad faint one
        const alt = dm - 1;
        const lamq = nx * sx + ny * sy + nz * sz;
        const dq = smooth(lamq, -0.18, 0.35), tw = Math.exp(-(lamq * lamq) / 0.02);
        const g = Math.exp(-alt / 0.03) * 0.85 + Math.exp(-alt / 0.13) * 0.12;
        const al = clamp(g * (0.5 + 0.5 * dq), 0, 1);
        const gr = Math.min(255, P.glowN[0] + (P.glowD[0] - P.glowN[0]) * dq + P.dusk[0] * tw * 0.6);
        const gg = Math.min(255, P.glowN[1] + (P.glowD[1] - P.glowN[1]) * dq + P.dusk[1] * tw * 0.35);
        const gb = Math.min(255, P.glowN[2] + (P.glowD[2] - P.glowN[2]) * dq + P.dusk[2] * tw * 0.15);
        sky[o] = SP[0] + (gr - SP[0]) * al; sky[o + 1] = SP[1] + (gg - SP[1]) * al; sky[o + 2] = SP[2] + (gb - SP[2]) * al;
        sky[o + 3] = 255;
        haze[o >> 2] = al * 255;
      }
      // the surface (also filled for misses, from the limb point, so the smooth scale-up has no dark fringe)
      const lam = nx * sx + ny * sy + nz * sz;
      const day = smooth(lam, -0.1, 0.3);
      const twl = Math.exp(-((lam - 0.02) * (lam - 0.02)) / 0.006); // the dusk band: a little darker, a little warmer
      const k = (0.7 + 0.3 * clamp(lam * 1.2 + 0.25, 0, 1)) * (0.8 + 0.2 * mu) * (1 - 0.16 * twl);
      const ice = smooth(Math.abs(nx * px_ + ny * py_ + nz * pz_), 0.86, 0.975);
      const rimK = Math.pow(1 - mu, 3) * (0.28 + 0.32 * day);
      const tw = Math.exp(-(lam * lam) / 0.01) * 0.7;
      const rr = (P.rimN[0] + (P.rimD[0] - P.rimN[0]) * day + P.dusk[0] * tw) * rimK;
      const rg = (P.rimN[1] + (P.rimD[1] - P.rimN[1]) * day + P.dusk[1] * tw) * rimK;
      const rb = (P.rimN[2] + (P.rimD[2] - P.rimN[2]) * day + P.dusk[2] * tw) * rimK;
      sea[o] = (P.seaN[0] + (P.seaD[0] - P.seaN[0]) * day) * k + rr + P.dusk[0] * 0.05 * twl;
      sea[o + 1] = (P.seaN[1] + (P.seaD[1] - P.seaN[1]) * day) * k + rg + P.dusk[1] * 0.05 * twl;
      sea[o + 2] = (P.seaN[2] + (P.seaD[2] - P.seaN[2]) * day) * k + rb + P.dusk[2] * 0.05 * twl;
      sea[o + 3] = 255;
      const lr = P.landN[0] + (P.landD[0] - P.landN[0]) * day, lg = P.landN[1] + (P.landD[1] - P.landN[1]) * day, lb = P.landN[2] + (P.landD[2] - P.landN[2]) * day;
      const ir = P.iceN[0] + (P.iceD[0] - P.iceN[0]) * day, ig = P.iceN[1] + (P.iceD[1] - P.iceN[1]) * day, ib = P.iceN[2] + (P.iceD[2] - P.iceN[2]) * day;
      land[o] = (lr + (ir - lr) * ice) * k + rr * 0.8 + P.dusk[0] * 0.08 * twl;
      land[o + 1] = (lg + (ig - lg) * ice) * k + rg * 0.8 + P.dusk[1] * 0.08 * twl;
      land[o + 2] = (lb + (ib - lb) * ice) * k + rb * 0.8 + P.dusk[2] * 0.08 * twl;
      land[o + 3] = 255;
      if (hit) {
        // inside the disc the glow is the limb's own, so the scaled-up sky blends cleanly at the edge
        const dq = smooth(lam, -0.18, 0.35), tq = Math.exp(-(lam * lam) / 0.02), al = 0.9 * (0.5 + 0.5 * dq);
        const gr = Math.min(255, P.glowN[0] + (P.glowD[0] - P.glowN[0]) * dq + P.dusk[0] * tq * 0.6);
        const gg = Math.min(255, P.glowN[1] + (P.glowD[1] - P.glowN[1]) * dq + P.dusk[1] * tq * 0.35);
        const gb = Math.min(255, P.glowN[2] + (P.glowD[2] - P.glowN[2]) * dq + P.dusk[2] * tq * 0.15);
        sky[o] = SP[0] + (gr - SP[0]) * al; sky[o + 1] = SP[1] + (gg - SP[1]) * al; sky[o + 2] = SP[2] + (gb - SP[2]) * al;
        sky[o + 3] = 255;
        haze[o >> 2] = 255;
      }
    }
  }
  return { gw, gh, sky, sea, land, haze };
}
