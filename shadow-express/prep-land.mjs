import { readFileSync, writeFileSync } from 'node:fs';
import * as topo from './topojson-client-3.1.0/package/dist/topojson-client.js';
const t50 = JSON.parse(readFileSync('world-atlas-2.0.2/package/land-50m.json', 'utf8'));
const t110 = JSON.parse(readFileSync('world-atlas-2.0.2/package/land-110m.json', 'utf8'));
const g50 = topo.feature(t50, t50.objects.land);
const g110 = topo.feature(t110, t110.objects.land);
const polys = (g) => g.features.flatMap((f) => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
// Detailed coast for Europe, the Mediterranean, the Black Sea and the Baltic; coarse elsewhere.
const BOX = [-32, 26, 62, 74];
const inBox = (poly) => poly[0].some(([x, y]) => x >= BOX[0] && x <= BOX[2] && y >= BOX[1] && y <= BOX[3]);
const r = (v) => Math.round(v * 50) / 50; // 0.02° ≈ 2 km
const thin = (ring, minArea) => { const out = []; let last = null; for (const p of ring) { const q = [r(p[0]), r(p[1])]; if (!last || q[0] !== last[0] || q[1] !== last[1]) out.push(q); last = q; } return out; };
const area = (ring) => { let a = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return Math.abs(a / 2); };
const near = polys(g50).filter(inBox).map((p) => p.map((ring) => thin(ring)).filter((ring) => ring.length >= 4 && area(ring) > 0.004));
const far = polys(g110).filter((p) => !inBox(p)).map((p) => p.map((ring) => thin(ring)).filter((ring) => ring.length >= 4));
const geo = { type: 'MultiPolygon', coordinates: [...near, ...far].filter((p) => p.length) };
const json = JSON.stringify(geo);
writeFileSync('land.json', json);
console.log('polygons', geo.coordinates.length, 'bytes', json.length);
