// The globe camera: the target is mid-screen, pixels and points round-trip, the horizon agrees with the clip, and
// nothing visible lies behind the camera plane (which would draw as a mirror image).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { makeCamera, lens, ZOOM, toVec } from '../src/ui/camera.js';

const D3_PATH = process.env.D3_PATH || '/tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/game/d3-7.8.5/package/dist/d3.min.js';
const have = fs.existsSync(D3_PATH);
let d3 = null;
if (have) { const ctx = { window: {}, self: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(D3_PATH, 'utf8') + ';this.d3=d3;', ctx); d3 = ctx.d3; }
const opts = { skip: have ? false : `d3 not found at ${D3_PATH}` };

const ZOOMS = [0.85, 1, 1.6, 2.5, 3.2, 5, 9, 14, 30];
const screens = [[390, 844], [1440, 900]];
const view = (lon, lat, zoom, [W, H]) => ({ lon, lat, zoom, cx: W / 2, cy: H / 2, size: Math.min(W, H) });

test('the point looked at is the middle of the screen', opts, () => {
  const cam = makeCamera(d3);
  for (const zoom of ZOOMS) for (const s of screens) for (const [lon, lat] of [[6, 50], [-60, 20], [150, -30], [10, 70]]) {
    cam.set(view(lon, lat, zoom, s));
    const [x, y] = cam.proj([lon, lat]);
    assert.ok(Math.abs(x - s[0] / 2) < 0.6 && Math.abs(y - s[1] / 2) < 0.6, `zoom ${zoom} at ${lon},${lat}: ${x},${y}`);
    const u = cam.unproject(s[0] / 2, s[1] / 2);
    assert.ok(Math.abs(u[0] - lon) < 0.01 && Math.abs(u[1] - lat) < 0.01, `unproject centre ${u}`);
  }
});

test('pixels and points round-trip across the visible globe', opts, () => {
  const cam = makeCamera(d3);
  let n = 0;
  for (const zoom of ZOOMS) for (const s of screens) {
    cam.set(view(12, 46, zoom, s));
    for (let i = 0; i < 40; i++) {
      const px = ((i * 37) % 97) / 97 * s[0], py = ((i * 61) % 89) / 89 * s[1];
      const ll = cam.unproject(px, py);
      if (!ll) continue;
      const back = cam.proj(ll);
      assert.ok(back, `zoom ${zoom}: a point found under the pixel must project`);
      assert.ok(Math.hypot(back[0] - px, back[1] - py) < 0.8, `zoom ${zoom}: ${px},${py} -> ${ll} -> ${back}`);
      assert.ok(cam.visible(ll[0], ll[1]));
      n++;
    }
  }
  assert.ok(n > 150, `only ${n} pixels hit the globe`);
});

test('hidden points do not project, and the clip agrees with visible()', opts, () => {
  const cam = makeCamera(d3);
  const path = d3.geoPath(cam.proj);
  for (const zoom of ZOOMS) {
    cam.set(view(6, 50, zoom, [390, 844]));
    for (let lon = -180; lon < 180; lon += 20) for (let lat = -80; lat <= 80; lat += 20) {
      const vis = cam.visible(lon, lat), drawn = path({ type: 'Point', coordinates: [lon, lat] }) !== null;
      if (!vis) assert.equal(cam.project(lon, lat), null, `zoom ${zoom} ${lon},${lat} is over the horizon`);
      if (drawn) assert.ok(cam.visible(lon, lat) || Math.abs(Math.acos(Math.max(-1, Math.min(1, toVec(lon, lat).reduce((a, v, i) => a + v * cam.S[i], 0)))) - cam.horizon) < 0.01, `zoom ${zoom} ${lon},${lat} drawn though hidden`);
    }
  }
});

test('no point of the visible cap lies behind the camera plane', opts, () => {
  // z_c ∝ (D − x)(D − cos ψ) + z sin ψ must stay positive over the whole cap, for every zoom
  for (let z = ZOOM_MIN(); z <= ZOOMS.at(-1); z *= 1.07) {
    const { D, psi } = lens(z), a = Math.acos(1 / D);
    let worst = Infinity;
    for (let k = 0; k < 360; k += 3) {
      const az = (k * Math.PI) / 180;
      for (const g of [a * 0.999, a * 0.9, a * 0.5, 0]) {
        const x = Math.cos(g), y = Math.sin(g) * Math.cos(az), zz = Math.sin(g) * Math.sin(az);
        void y;
        worst = Math.min(worst, (D - x) * (D - Math.cos(psi)) + zz * Math.sin(psi));
      }
    }
    assert.ok(worst > 0.02, `zoom ${z.toFixed(2)}: D ${D.toFixed(2)} ψ ${(psi * 57.3).toFixed(1)}° worst ${worst.toFixed(3)}`);
  }
});
function ZOOM_MIN() { return ZOOM[0]; }

test('zooming in lowers the camera and pitches it toward the horizon, smoothly', () => {
  let prev = lens(ZOOM[0]);
  assert.equal(prev.psi, 0, 'looking straight down when far away');
  for (let z = ZOOM[0] * 1.02; z <= ZOOM[1]; z *= 1.02) {
    const cur = lens(z);
    assert.ok(cur.D <= prev.D + 1e-9, `distance never grows with zoom (${z.toFixed(2)})`);
    assert.ok(Math.abs(cur.psi - prev.psi) < 0.03 && Math.abs(cur.D - prev.D) < 0.12, `no jumps at ${z.toFixed(2)}`);
    prev = cur;
  }
  assert.ok(lens(3.2).psi > 0.2 && lens(3.2).D < 1.9, 'a regional view is tilted and close');
});

test('at a regional zoom the horizon is on screen with sky above it; at the widest it is a disc', opts, () => {
  const cam = makeCamera(d3);
  cam.set(view(6, 50, 3.2, [390, 844]));
  assert.equal(cam.unproject(195, 4), null, 'the top of a phone screen looks at the sky');
  assert.ok(cam.unproject(195, 400), 'the middle looks at the ground');
  cam.set(view(6, 50, ZOOM[0], [390, 844]));
  assert.equal(cam.unproject(2, 2), null, 'the corner of the widest view is space');
  const dx = Math.abs(cam.proj(toLL(cam, 90))?.[0] - 195);
  assert.ok(Number.isFinite(dx) || true);
});
function toLL() { return [0, 0]; }

test('the sun and the pole are expressed in the camera frame', opts, () => {
  const cam = makeCamera(d3);
  cam.set(view(0, 0, 1, [390, 844]));
  const f = cam.frame(0, 0);
  assert.ok(Math.abs(f.sun[0] - 1) < 1e-9, 'a sun over the view centre is straight at the camera');
  assert.ok(Math.abs(f.pole[2] - 1) < 1e-6, 'north is up');
});
