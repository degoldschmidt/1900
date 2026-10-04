// Decodes the packed coastlines (tools/pack-land.mjs) into GeoJSON MultiPolygons.
import { HI, LO } from './land.pack.js';

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const IDX = new Int16Array(128);
for (let i = 0; i < A.length; i++) IDX[A.charCodeAt(i)] = i;

function unpack(s) {
  return {
    type: 'MultiPolygon',
    coordinates: s.split('~').map((poly) => poly.split('|').map((r) => {
      const ring = [];
      let i = 0, x = 0, y = 0, n = 0;
      const next = () => {
        const c = IDX[r.charCodeAt(i++)];
        if (c !== 0) return c - 32;
        const v = (IDX[r.charCodeAt(i)] << 12) | (IDX[r.charCodeAt(i + 1)] << 6) | IDX[r.charCodeAt(i + 2)];
        i += 3;
        return v - 131072;
      };
      while (i < r.length) {
        const dx = next(), dy = next();
        if (n++ === 0) { x = dx; y = dy; } else { x += dx; y += dy; }
        ring.push([x / 50, y / 50]);
      }
      return ring;
    })),
  };
}
export const land = unpack(HI);
export const landLo = unpack(LO);
