// The globe's camera. The player looks at a point on the surface (lon, lat) from a distance that shrinks as they zoom;
// as they zoom in the camera also pitches toward the horizon, so a regional view shows the curve of the earth and the sky
// above it. Everything is a perspective projection of a unit sphere, expressed as a d3 projection so that the same
// clipping and resampling that drew the flat map draws the tilted one. d3 is passed in so Node tests can use it.
//
// The frame used below ("rotated frame"): the sphere has radius 1; x points at the sub-camera point S (the surface point
// beneath the camera), y east, z north. The camera sits at C = (D, 0, 0). The surface point T the player looks at lies
// ψ radians north of S on the same meridian, and is the centre of the screen.

const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export const ZOOM = [0.85, 30];
/** Pixels per radian at the point looked at, for zoom 1, as a fraction of the shorter screen side. */
export const BASE = 0.456;

/** Camera distance from the globe's centre (in earth radii) and the tilt (radians) for a zoom level. */
export function lens(zoom) {
  const lz = Math.log(zoom);
  const near = smooth(lz, Math.log(0.85), Math.log(3.2));
  const D = lerp(4.6, 1.55, Math.pow(near, 0.85));
  const tilt = lerp(0, 17, smooth(lz, Math.log(1.7), Math.log(4.6))) * (1 - 0.5 * smooth(lz, Math.log(9), Math.log(30)));
  return { D, psi: tilt * RAD };
}

export const toVec = (lon, lat) => { const l = lon * RAD, p = lat * RAD, c = Math.cos(p); return [c * Math.cos(l), c * Math.sin(l), Math.sin(p)]; };
export const toLonLat = (v) => [Math.atan2(v[1], v[0]) / RAD, Math.asin(clamp(v[2], -1, 1)) / RAD];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Rotate vector v about unit axis k by angle a (Rodrigues). */
function rotate(v, k, a) {
  const c = Math.cos(a), s = Math.sin(a), kv = cross(k, v), kd = dot(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}

/** The rotation that takes unit vector b to unit vector a, as a function on vectors. */
export function rotationTaking(b, a) {
  const k = cross(b, a), s = Math.hypot(k[0], k[1], k[2]);
  if (s < 1e-9) return (v) => v;
  const ang = Math.atan2(s, dot(b, a));
  const axis = [k[0] / s, k[1] / s, k[2] / s];
  return (v) => rotate(v, axis, ang);
}

export function makeCamera(d3) {
  const P = { D: 4, cps: 1, sps: 0, L: 1, L2: 1 };
  const raw = (lam, phi) => {
    const cp = Math.cos(phi), x = cp * Math.cos(lam), y = cp * Math.sin(lam), z = Math.sin(phi);
    const zc = (P.D - x) * (P.D - P.cps) + z * P.sps;
    const yc = z * (P.D - P.cps) - (P.D - x) * P.sps;
    return [P.L2 * y / zc, P.L * yc / zc];
  };
  const proj = d3.geoProjection(raw).precision(0.3);
  const coarse = d3.geoProjection(raw).precision(0); // no resampling: for dense coastlines, where it only costs time
  const cam = { proj, coarse, D: 4, psi: 0, R: 100, cx: 0, cy: 0, lonS: 0, latS: 0, S: [1, 0, 0], T: [1, 0, 0], F: 1, f: [-1, 0, 0], r: [0, 1, 0], u: [0, 0, 1] };

  /** Aim at (lon, lat) with the given zoom on a screen of `size` (its shorter side) centred on (cx, cy). */
  cam.set = ({ lon, lat, zoom, cx, cy, size }) => {
    const { D, psi } = lens(zoom);
    P.D = D; P.cps = Math.cos(psi); P.sps = Math.sin(psi); P.L2 = D * D - 2 * D * P.cps + 1; P.L = Math.sqrt(P.L2);
    const T = toVec(lon, lat);
    const n = [-Math.sin(lat * RAD) * Math.cos(lon * RAD), -Math.sin(lat * RAD) * Math.sin(lon * RAD), Math.cos(lat * RAD)]; // north at T
    const S = norm([T[0] * P.cps - n[0] * P.sps, T[1] * P.cps - n[1] * P.sps, T[2] * P.cps - n[2] * P.sps]);
    const [lonS, latS] = toLonLat(S);
    cam.D = D; cam.psi = psi; cam.cx = cx; cam.cy = cy; cam.T = T; cam.S = S; cam.lonS = lonS; cam.latS = latS;
    cam.R = size * BASE * zoom;
    cam.F = cam.R * P.L;
    // optical axis: from the camera toward T, which in the rotated frame is (cos ψ, 0, sin ψ)
    cam.f = norm([P.cps - D, 0, P.sps]);
    cam.r = [0, 1, 0];
    cam.u = [P.sps / P.L, 0, (D - P.cps) / P.L]; // camera up: toward the north, tipped toward the viewer
    cam.horizon = Math.acos(1 / D);              // angular radius of the visible cap, about S
    // d3 puts the projection's centre (in the rotated frame) at the translate point: that centre is T, ψ north of S
    for (const p of [proj, coarse]) p.rotate([-lonS, -latS, 0]).center([0, psi / RAD]).scale(cam.R).translate([cx, cy]).clipAngle(cam.horizon / RAD - 0.35);
    cam.rot = d3.geoRotation([-lonS, -latS, 0]);
    return cam;
  };

  /** A lon/lat as a unit vector in the rotated frame. */
  cam.local = (lon, lat) => { const [l, p] = cam.rot([lon, lat]); return toVec(l, p); };
  /** Is the surface point on the near side of the horizon? */
  cam.visible = (lon, lat) => dot(toVec(lon, lat), cam.S) > 1 / cam.D + 0.004;
  cam.visibleVec = (v) => dot(v, cam.S) > 1 / cam.D + 0.004;

  /** The surface point under a pixel as lon/lat, or null if the pixel looks at the sky. */
  cam.unproject = (px, py) => {
    const a = (px - cam.cx) / cam.F, b = -(py - cam.cy) / cam.F;
    const d = norm([cam.f[0] + cam.r[0] * a + cam.u[0] * b, cam.f[1] + cam.r[1] * a + cam.u[1] * b, cam.f[2] + cam.r[2] * a + cam.u[2] * b]);
    const bq = cam.D * d[0], disc = bq * bq - (cam.D * cam.D - 1);
    if (disc <= 0) return null;
    const t = -bq - Math.sqrt(disc);
    if (t <= 0) return null;
    const p = [cam.D + t * d[0], t * d[1], t * d[2]];
    const [l, ph] = toLonLat(p);
    return cam.rot.invert([l, ph]);
  };

  /** Pixel of a lon/lat (null when hidden behind the horizon). */
  cam.project = (lon, lat) => (cam.visible(lon, lat) ? proj([lon, lat]) : null);

  /** The frame the shader needs, all in the rotated frame. */
  cam.frame = (sunLon, sunLat) => ({
    D: cam.D, f: cam.f, r: cam.r, u: cam.u, F: cam.F, cx: cam.cx, cy: cam.cy,
    sun: cam.local(sunLon, sunLat), pole: cam.local(0, 90),
  });
  return cam;
}
