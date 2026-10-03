// Engraved cameo portraits (owner: Art C). Stub: an oval and a plain profile; see docs/ART.md.
import { makeKit } from './kit.js';

export function portrait(p, uid = 'p') {
  const k = makeKit({ uid, seed: p.seed });
  const body = k.shape('M30 150q4 -34 30 -40q26 6 30 40Z', 'dark') + k.shape('M48 108q-2 -20 0 -40q14 -16 28 0q4 14 -6 24l2 16Z', 'paper');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><defs>${k.defs()}</defs>`
    + `<ellipse cx="60" cy="75" rx="56" ry="71" fill="${k.paper}" stroke="${k.ink}" stroke-width="2"/>${body}</svg>`;
}
