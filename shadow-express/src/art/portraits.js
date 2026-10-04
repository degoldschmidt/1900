// Engraved cameo portraits (owner: Art C): a double inked oval on paper, a head-and-shoulders profile facing left.
// portrait({ seed, sex, hat, hair, beard, collar, age }, uid) → SVG string, viewBox 120×150.
// The parameters choose costume and age; the seed shapes the face (nose, brow, forehead, lips, chin, jaw, neck,
// skull, ear) so that no two people look alike. Unknown or missing values fall back to defaults; nothing throws.
import { makeKit } from './kit.js';

const ONE = (v, list, d) => (list.includes(v) ? v : d);
const HATS = ['none', 'bowler', 'top', 'cap', 'boater', 'fez', 'veil', 'kepi', 'wide'];
const HAIR = ['short', 'long', 'bun', 'bald'];
const BEARDS = ['none', 'moustache', 'full', 'goatee'];
const COLLARS = ['lace', 'stiff', 'uniform', 'cassock', 'fur'];
const AGES = ['young', 'mid', 'old'];
// how far a hat pushes the head down the oval so that it fits under the frame
const DROP = { none: 4, bowler: 7, top: 13, cap: 5, boater: 6, fez: 9, veil: 5, kepi: 9, wide: 8 };
const f = (n) => Math.round(n * 10) / 10;

/** A smooth path through points (Catmull-Rom as cubic Béziers). A point [x, y, 1] is a corner. */
function spline(pts, closed = false) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const t1 = p1[2] ? 0 : 1 / 6, t2 = p2[2] ? 0 : 1 / 6;
    d += `C${f(p1[0] + (p2[0] - p0[0]) * t1)} ${f(p1[1] + (p2[1] - p0[1]) * t1)} ${f(p2[0] - (p3[0] - p1[0]) * t2)} ${f(p2[1] - (p3[1] - p1[1]) * t2)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}

/** The face and skull of one person: landmark points shaped by sex, age and the seed. Head top near y 21, chin near 96. */
function geometry(fem, age, r) {
  const v = {};
  for (const key of ['nose', 'noseType', 'tip', 'brow', 'forehead', 'chin', 'chinType', 'jaw', 'lips', 'lower', 'neck', 'eye', 'ear', 'skull', 'cheek', 'nostril', 'build', 'crown', 'style', 'part', 'tache'])
    v[key] = r();
  const old = age === 'old', young = age === 'young';
  const sm = fem ? .66 : 1;
  const stout = v.build > .74, thin = v.build < .26;
  const g = { v };
  // the lower face is long or short; everything below the nose scales about the nostril
  const L = .9 + v.lower * .2 + (fem ? -.03 : 0);
  const low = (x, y) => [x, 74.4 + (y - 74.4) * L];
  // forehead: sloping, upright or bulging
  const ft = Math.floor(v.forehead * 3);
  g.F = [35.5 + (ft === 0 ? 3 : ft === 2 ? -1 : 0) + (fem ? -.6 : 0), 34];
  g.F2 = [33 + (ft === 0 ? 2 : ft === 2 ? -2 : 0), 43];
  // brow ridge
  g.G = [31.2 - (v.brow - .5) * 3 * sm + (fem ? 1.4 : 0), 52];
  g.N = [g.G[0] + 2 + v.brow * 1.6 * sm, 56.6];
  // the nose: straight, aquiline, snub, fleshy or neat
  const nt = Math.floor(v.noseType * 5);
  const len = (v.nose - .5) * 5 * sm + (old ? 1 : 0);
  g.T = [20.6 - len + (fem ? 2.6 : 0), 69 + (v.tip - .5) * 2 + (old ? 1.2 : 0)];
  g.B = [(g.N[0] + g.T[0]) / 2 + .4, (g.N[1] + g.T[1]) / 2 - .6];
  g.T2 = [g.T[0] + .7, g.T[1] + 2.4];
  g.C = [27.4 + (fem ? .8 : 0), 73.8];
  g.S = [29.6 + (v.nostril - .5) * 1.4 + (fem ? .6 : 0), 74.4 + (old ? .6 : 0)];
  if (nt === 1) { g.B[0] -= 3.2 * sm; g.B[1] -= 1; g.T[1] += 1.8; g.T2 = [g.T[0] + 1.6, g.T[1] + 2.2]; g.C[0] += .6; } // aquiline: a hump, the tip hooked
  if (nt === 2) { g.B[0] += 1.6; g.T[0] += 2.6 * sm; g.T[1] -= 1.8; g.T2 = [g.T[0] + .2, g.T[1] + 2.8]; g.C[1] -= .6; } // snub: a dip, the tip up
  if (nt === 3) { g.T[0] += .6; g.T2 = [g.T[0] + .4, g.T[1] + 3.6]; g.C = [g.C[0] - .8, g.C[1] + .6]; g.Tx = [g.T[0] - 1, g.T[1] + 1.6]; } // fleshy: a round heavy tip
  if (nt === 4) { g.T[0] += 1.6 * sm; g.B[0] += .4; } // neat: short and straight
  // lips: thin, full, or a pouting lower lip
  const lip = (v.lips - .5) * 1.8 + (fem ? 1.1 : 0) + (young ? .4 : 0) - (old ? 1.1 : 0);
  g.UL = low(28.4 - lip, 77.8);
  g.ST = low(31.6, 80.2);
  g.LL = low(29.8 - lip * .85 - (v.lips > .8 ? 1 : 0), 82.6);
  // chin: receding, average or jutting
  const ct = Math.floor(v.chinType * 3);
  const cx = 35.6 + (ct === 0 ? 3 : ct === 2 ? -2.6 : 0) * (fem ? .6 : 1) - (v.chin - .5) * 1.6 + (old ? 1.4 : 0) + (fem ? 1.2 : 0);
  g.SL = low(cx + 2.4 + (ct === 2 ? 1 : 0), 86.2);
  g.PG = low(cx, 90.8);
  g.ME = low(cx + 4 + (fem ? .6 : 0), 95.6 + (fem ? -.8 : 0));
  // jaw, neck, skull
  g.J = [61 + (v.jaw - .5) * 7 - (fem ? 2.4 : 0), g.ME[1] - 6 + (v.jaw - .5) * 3 + (old ? 2.4 : 0) - (fem ? 1.6 : 0)];
  g.UJ = [g.ME[0] + 8, g.ME[1] + 2.6 + (old ? 2.8 : 0) + (fem ? -.6 : 0)];
  g.CP = [46.4 - (v.neck - .5) * 5 + (fem ? 2.4 : 0) - (old ? 1 : 0) - (stout ? 3 : thin ? -2.4 : 0), g.ME[1] + 5.4 + (old ? 2 : 0) + (stout ? 2 : 0)];
  g.stout = stout; g.thin = thin;
  g.NF = [g.CP[0] + 1, 118];
  g.NB = [75 + (v.neck - .5) * 4 - (fem ? 2.6 : 0) + (stout ? 2.4 : thin ? -2 : 0), 118];
  g.NP = [g.NB[0] + 2, 99];
  g.BK = [92 + (v.skull - .5) * 5, 62];
  g.OC = [g.BK[0] - 7, 84];
  g.BT = [g.BK[0] - 3.6, 38];
  g.CR = [76, 24.5 + (v.crown - .5) * 3];
  g.V = [57, 21.4 + (v.crown - .5) * 2.4];
  g.E = [63.4 + (v.ear - .5) * 3, 64.6 + (v.ear - .5) * 1.6];
  g.EY = [37.4 + (v.eye - .5) * 1.4 + (g.N[0] - 33.4) * .4, 59.4 + (v.eye - .5) * 1.2];
  const prof = [g.F, g.F2, g.G, g.N, g.B, g.T];
  if (g.Tx) prof.push(g.Tx);
  prof.push(g.T2, [g.C[0], g.C[1]], [g.S[0], g.S[1], 1], g.UL, [g.ST[0], g.ST[1], 1], g.LL, g.SL, g.PG, g.ME);
  if (stout) prof.push([g.ME[0] + 3.4, g.ME[1] + 4.4], [g.ME[0] + 8, g.ME[1] + 6.4]); // a second chin
  prof.push(g.UJ, g.CP);
  if (!fem && !old && !stout) prof.push([g.CP[0] - 1.6, g.CP[1] + 4.4], [g.CP[0] - .4, g.CP[1] + 8]);
  else prof.push([g.CP[0] - (old ? 1.4 : .6), g.CP[1] + 7]);
  prof.push([g.NF[0], g.NF[1], 1], [g.NB[0], g.NB[1], 1], g.NP, g.OC, g.BK, g.BT, g.CR, g.V, [42, 25.6]);
  g.face = spline(prof, true);
  return g;
}

export function portrait(p = {}, uid = 'p') {
  p = p || {};
  const seed = Number.isFinite(+p.seed) ? Math.abs(Math.round(+p.seed)) : 1;
  const fem = p.sex === 'f';
  const hat = ONE(p.hat, HATS, 'none'), age = ONE(p.age, AGES, 'mid'), collar = ONE(p.collar, COLLARS, 'stiff');
  const hair = ONE(p.hair, HAIR, fem ? 'bun' : 'short'), beard = fem ? 'none' : ONE(p.beard, BEARDS, 'none');
  const k = makeKit({ uid, seed: seed + 1 });
  const r = k.rng(seed * 7919 + 101);
  const g = geometry(fem, age, r), v = g.v;
  const old = age === 'old', young = age === 'young';
  const nun = hat === 'veil' && collar === 'cassock';
  const { F, G, T, S, UL, ST, LL, SL, PG, ME, J, UJ, CP, NF, NB, NP, BK, OC, BT, CR, V, E, EY } = g;
  const ink = k.ink, paper = k.paper, grey = k.sepia;
  const clip = (id) => `clip-path="url(#${id}-${uid})"`;
  const tone = (darkest) => (old ? 'paper' : young ? darkest : 'dark');

  // ---------- the bust ----------
  const coat = collar === 'uniform' || collar === 'cassock' ? 'black' : 'dark';
  let s = k.shape(`M${f(NF[0] - 1)} 110C38 114 28 126 20 152H118C117 134 110 120 96 114C90 111 ${f(NB[0] + 4)} 108 ${f(NB[0] + 1)} 108Z`, coat, { w: 1.1 });
  s += k.line(`M${f(NB[0] + 12)} 116C94 122 100 136 102 152`, .8, { color: paper, op: .5 }); // the sleeve's seam catching the light

  // ---------- the head, and the shade on the side turned from the light ----------
  s += k.shape(g.face, 'paper', { w: 1.2 });
  let shade = k.shape(`M${f(ME[0] + 1)} ${f(ME[1] - .4)}C${f(UJ[0] + 4)} ${f(J[1] + 3)} ${f(J[0] - 4)} ${f(J[1] + 1.6)} ${f(J[0] + 1)} ${f(J[1] - 3)}L${f(NB[0] + 6)} ${f(J[1] - 6)}V${f(J[1] + 10)}C${f(J[0])} ${f(J[1] + 12)} ${f(CP[0] + 6)} ${f(CP[1] + 4)} ${f(CP[0] - 2)} ${f(CP[1] + 6)}Z`, 'mid', { w: 0 });
  { const n = g.thin || old ? 5 : 3; let c = '';
    for (let i = 0; i < n; i++) c += `M${f(ME[0] + 9 + i * 1.6)} ${f(ME[1] - 4 - i * 3.2)}Q${f((ME[0] + J[0]) / 2 + 3)} ${f(J[1] - 1 - i * 3.4)} ${f(J[0] - 1 - i * .4)} ${f(J[1] - 5 - i * 3.4)}`;
    shade += k.line(c, .45, { op: .8 }); }
  shade += k.shape(`M${f(G[0] + 4)} ${f(EY[1] - 3.4)}C${f(EY[0] + 2)} ${f(EY[1] - 4.4)} ${f(EY[0] + 6)} ${f(EY[1] - 3)} ${f(EY[0] + 8)} ${f(EY[1] + 1)}C${f(EY[0] + 4)} ${f(EY[1] - 1.6)} ${f(EY[0])} ${f(EY[1] - 2)} ${f(G[0] + 4)} ${f(EY[1] - 3.4)}Z`, 'light', { w: 0 });
  if (old || g.thin || v.cheek > .8) shade += k.shape(`M${f(S[0] + 7)} ${f(S[1] - 6)}C${f(S[0] + 12)} ${f(S[1] - 2)} ${f(S[0] + 12)} ${f(ST[1] + 4)} ${f(ST[0] + 9)} ${f(ST[1] + 8)}C${f(ST[0] + 12)} ${f(ST[1])} ${f(S[0] + 14)} ${f(S[1] - 6)} ${f(S[0] + 7)} ${f(S[1] - 6)}Z`, 'light', { w: 0 });
  s += `<g ${clip('face')}>${shade}</g>`;
  s += k.line(`M${f(ME[0] + 3)} ${f(ME[1] - .2)}C${f(J[0] - 12)} ${f(J[1] + 1.4)} ${f(J[0] - 3)} ${f(J[1] + 1)} ${f(J[0])} ${f(J[1] - 3)}C${f(J[0] + 1)} ${f(J[1] - 7)} ${f(J[0] + 1.6)} ${f(J[1] - 11)} ${f(J[0] + 2.4)} ${f(J[1] - 13)}`, old ? .5 : .65);
  if (old) s += k.line(`M${f(UJ[0] - 2)} ${f(UJ[1] - 1)}q4 3 9 2`, .55); // the jowl

  // ---------- the collar, over the neck ----------
  if (collar === 'stiff') {
    s += k.shape(`M${f(NF[0] - 1)} 115C38 120 30 132 26 152H42C42 138 44 126 ${f(NF[0] + 6)} 118Z`, 'paper', { w: .9 }); // the shirt front
    s += k.shape(`M${f(CP[0] - 2.6)} ${f(CP[1] + 1)}L${f(NF[0] - 1.6)} 117L${f(NB[0] + 1.6)} 115L${f(NB[0] + .6)} ${f(CP[1])}C64 ${f(CP[1] + 3.4)} 54 ${f(CP[1] + 3.4)} ${f(CP[0] - 2.6)} ${f(CP[1] + 1)}Z`, 'paper', { w: 1.1 });
    s += k.shape(`M${f(CP[0] - 4.2)} ${f(CP[1] + 7)}l4.4 -2.8l4.4 2.8l-4.4 2.8Z`, 'black', { w: .5 }) + k.shape(`M${f(CP[0] - 5.6)} ${f(CP[1] + 4)}l1.4 3l-1.4 3l-2.2 -3Z`, 'black', { w: .5 }); // the bow tie
    s += k.shape(`M${f(NF[0] + 7)} 118C46 126 42 138 42 152H54C54 138 58 126 ${f(NF[0] + 14)} 117Z`, 'black', { w: .8 }); // the lapel
    s += k.line(`M${f(NF[0] + 7)} 118L44 130L50 133`, .7, { color: paper, op: .8 });
  }
  if (collar === 'uniform') {
    s += k.shape(`M${f(CP[0] - 3)} ${f(CP[1] - 3)}L${f(NF[0] - 2)} 117L${f(NB[0] + 2)} 115L${f(NB[0] + 1)} ${f(CP[1] - 4)}C64 ${f(CP[1])} 54 ${f(CP[1])} ${f(CP[0] - 3)} ${f(CP[1] - 3)}Z`, 'dark', { w: 1.1 });
    s += k.line(`M${f(CP[0] - 2.8)} ${f(CP[1] - .6)}C54 ${f(CP[1] + 2.2)} 64 ${f(CP[1] + 2.2)} ${f(NB[0] + 1)} ${f(CP[1] - 1.4)}`, 1.3, { color: paper });
    s += k.shape(`M${f(CP[0] + 1.6)} ${f(CP[1] + 4)}h8v6.4h-8Z`, 'light', { w: .6 }) + `<circle cx="${f(CP[0] + 5.6)}" cy="${f(CP[1] + 7.2)}" r="1.4" fill="${ink}"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${f(NF[0] - 6.4 - i * 4.4)}" cy="${f(123 + i * 7.2)}" r="1.6" fill="${paper}" stroke="${ink}" stroke-width=".5"/>`;
    s += k.shape('M80 118Q93 110 106 119L104 126Q93 121 82 124Z', 'light', { w: .9 }); // the epaulette and its fringe
    let fr = ''; for (let x = 83; x < 105; x += 2) fr += `M${x} ${f(124.6 - (x - 82) * .06)}v6.4`;
    s += k.line(fr, .8) + k.line('M24 142Q52 126 96 152', 1.8, { color: paper }) + k.line('M24 146Q52 130 92 156', .7, { color: paper });
  }
  if (collar === 'cassock') {
    if (fem) { // the wimple close about the face and the white guimpe over the breast
      s += k.shape(`M${f(G[0] + 9)} 72C${f(G[0] + 7)} 86 ${f(ME[0] - 1)} ${f(ME[1] + 2)} ${f(CP[0] - 6)} ${f(CP[1] + 3)}C36 114 28 126 24 152H82C84 134 86 120 ${f(NB[0] + 3)} 106C${f(NB[0] + 6)} 94 ${f(E[0] + 8)} 78 ${f(E[0] + 4)} 66Z`, 'paper', { w: 1.1 });
      s += k.line(`M${f(CP[0] - 4)} ${f(CP[1] + 8)}C40 120 34 132 32 148M${f(CP[0] + 6)} ${f(CP[1] + 12)}C52 126 50 138 50 150M${f(CP[0] + 16)} ${f(CP[1] + 12)}C66 126 66 138 66 150`, .45);
      s += k.shape(`M${f(G[0] + 9)} 72C${f(G[0] + 7)} 86 ${f(ME[0] - 1)} ${f(ME[1] + 2)} ${f(CP[0] - 6)} ${f(CP[1] + 3)}L${f(CP[0] - 4)} ${f(CP[1] + 6)}C${f(ME[0] + 2)} ${f(ME[1] + 4)} ${f(G[0] + 10)} 88 ${f(G[0] + 11)} 72Z`, 'light', { w: 0 });
    } else {
      s += k.shape(`M${f(CP[0] - 2.6)} ${f(CP[1] + 1.4)}L${f(NF[0] - 1.6)} 117L${f(NB[0] + 1.6)} 115L${f(NB[0] + .6)} ${f(CP[1] + .4)}C64 ${f(CP[1] + 4)} 54 ${f(CP[1] + 4)} ${f(CP[0] - 2.6)} ${f(CP[1] + 1.4)}Z`, 'black', { w: 1 });
      s += k.shape(`M${f(CP[0] - 2.4)} ${f(CP[1] + 2.6)}h6.6v5.4h-6Z`, 'paper', { w: .6 }); // the white tab
      for (let i = 0; i < 5; i++) s += `<circle cx="${f(NF[0] - 6 - i * 4.4)}" cy="${f(123 + i * 7)}" r="1.1" fill="${paper}"/>`;
    }
  }
  if (collar === 'lace') { // a high boned collar of lace, frilled along the top, and a jabot falling in front
    const top = CP[1] - (fem ? 7 : 3), bot = 118;
    const fx = (y) => CP[0] - 3.4 - (y - top) * .1, bx = (y) => NB[0] + 2 + (y - top) * .1;
    const n = 9, w = bx(top) - fx(top);
    let d = `M${f(fx(top))} ${f(top)}`;
    for (let i = 0; i < n; i++) d += `a${f(w / n / 2)} 2.4 0 0 1 ${f(w / n)} 0`;
    s += k.shape(d + `L${f(bx(bot))} ${bot}L${f(fx(bot))} ${bot}Z`, 'paper', { w: 1 });
    let lace = '';
    for (let row = 0; row < 3; row++) {
      const y = top + 4.4 + row * 5.2;
      for (let x = fx(y) + 2.2 + (row % 2) * 1.6; x < bx(y) - 2.4; x += 3.4) lace += `M${f(x)} ${f(y)}a1.3 1.3 0 1 0 2.6 0`;
    }
    s += k.line(lace, .45) + k.line(`M${f(fx(top) + .6)} ${f(top + 1.6)}H${f(bx(top) - .6)}`, .4);
    let jab = `M${f(NF[0] - 3)} 117`;
    for (let i = 0; i < 5; i++) jab += `q-7 ${f(2 + i * .4)} -4.4 ${f(5.6 + i)}`;
    s += k.shape(jab + `L${f(NF[0] + 10)} 152V119Z`, 'paper', { w: .9 });
    for (let i = 0; i < 5; i++) s += k.line(`M${f(NF[0] - 5 - i * 1.6)} ${f(122 + i * 6.4)}q6 1 12 -1`, .5);
    if (fem) s += `<circle cx="${f(fx(bot) + 3)}" cy="${f(bot - 2)}" r="2.4" fill="${paper}" stroke="${ink}" stroke-width=".8"/><circle cx="${f(fx(bot) + 3)}" cy="${f(bot - 2)}" r="1" fill="${ink}"/>`; // a cameo brooch
  }
  if (collar === 'fur') {
    let fur = `M${f(CP[0] - 7)} ${f(CP[1] + 1)}`;
    for (let i = 0; i <= 18; i++) { const t = i / 18, a = Math.PI * (1.04 - t * 1.08); fur += `L${f(60 + Math.cos(a) * 37 + (i % 2 ? 2.4 : -1.4))} ${f(121 - Math.sin(a) * 21 + (i % 2 ? 2.6 : -2.2))}`; }
    fur += `L112 152H18Z`;
    s += k.shape(fur, 'stipple', { w: 1 }) + k.shape(`M18 152C22 136 32 126 ${f(NF[0] - 4)} 122C46 134 44 144 46 152Z`, 'dark', { w: 0 });
    let tufts = ''; for (let i = 0; i < 26; i++) { const x = 24 + r() * 84, y = 108 + r() * 40; tufts += `M${f(x)} ${f(y)}q1.6 -2.6 3.6 -1.4`; }
    s += k.line(tufts, .6);
  }

  // ---------- the hair ----------
  const hairTone = old ? 'paper' : young ? 'black' : 'dark';
  // a man's short hair is parted and oiled, cropped, thick and wavy, or receding from a high forehead
  const style = hair === 'short' ? ['parted', 'cropped', 'wavy', 'receding'][Math.floor(v.style * 4)] : hair === 'long' ? (v.style < .5 ? 'wavy' : 'parted') : 'parted';
  const vol = style === 'cropped' ? 1.2 : style === 'wavy' ? 4.2 : style === 'receding' ? 1.8 : 2.8;
  const front = style === 'receding' ? [F[0] + 9, F[1] - 7] : [F[0] + 1.4, F[1] - 2];
  let crown = [front, [40 + (style === 'receding' ? 8 : 0), 24.6 - vol + (style === 'receding' ? 1.6 : 0)], [V[0], V[1] - vol - .4], [CR[0] + 1, CR[1] - vol], [BT[0] + vol + .6, BT[1] - 1], [BK[0] + vol, BK[1] + 2]];
  if (style === 'wavy') { // bumps of curl along the crown
    const w = [];
    for (let i = 0; i < crown.length - 1; i++) { const [a, b] = [crown[i], crown[i + 1]]; w.push(a, [(a[0] + b[0]) / 2 + (i % 2 ? 1.6 : -1.2), (a[1] + b[1]) / 2 - 1.6]); }
    crown = [...w, crown[crown.length - 1]];
  }
  const sideburn = (y) => [[E[0] + 2, E[1] - 11.8], [E[0] - 5.6, E[1] - 11], [E[0] - 7.4, E[1] - 1], [E[0] - 8.4, E[1] + y, 1], [E[0] - 11.4, E[1] - 3], [E[0] - 13, E[1] - 12], [F[0] + 7, F[1] + 8]];
  let hairD = '';
  if (hair === 'short') hairD = spline([[front[0] - .8, front[1] + 3.4, 1], ...crown, [OC[0] + 3, OC[1] + 1], [NP[0] + 2.6, NP[1] - 1, 1], [NP[0] - 3, NP[1] - 5], [E[0] + 8.6, E[1] + 7], [E[0] + 7.6, E[1] - 6], ...sideburn(6)], true);
  if (hair === 'long') hairD = spline([[front[0] - .8, front[1] + 3.4, 1], ...crown, [BK[0] + 3.8, BK[1] + 16], [NB[0] + (fem ? 10 : 7), fem ? 128 : 112], [NB[0] + (fem ? 4 : 2), fem ? 134 : 117, 1], [NB[0] - 4, fem ? 120 : 108], [E[0] + 8, E[1] + 10], [E[0] + 7, E[1] - 8], ...sideburn(8)], true);
  if (hair === 'bun') hairD = spline([[F[0] + 1, F[1] + 2.6, 1], [F[0] - 2.6, F[1] - 4.4], [38, 18.6], [V[0], V[1] - 6.6], [CR[0] + 2, CR[1] - 4.6], [BT[0] + 4, BT[1] - 1], [BK[0] + 2.6, BK[1] + 2], [OC[0] + 2, OC[1] - 2], [NP[0], NP[1] - 8, 1], [E[0] + 8, E[1] + 2], [E[0] + 6, E[1] - 9], [E[0], E[1] - 12.4], [E[0] - 6.6, E[1] - 11], [E[0] - 8.4, E[1] - 1, 1], [E[0] - 11, E[1] - 9], [F[0] + 7, F[1] + 8]], true);
  if (hair === 'bald') hairD = spline([[E[0] - 6, E[1] - 10, 1], [E[0] + 1, E[1] - 13.4], [E[0] + 12, E[1] - 14.4], [BK[0] + 1.8, BK[1] - 6], [BK[0] + 2.6, BK[1] + 8], [OC[0] + 2.8, OC[1] + 1], [NP[0] + 2.4, NP[1] - 1, 1], [NP[0] - 3, NP[1] - 5], [E[0] + 8.6, E[1] + 6], [E[0] + 7.6, E[1] - 6], [E[0] + 1, E[1] - 9.4], [E[0] - 5, E[1] - 7.6]], true);
  let hairS = '';
  if (!nun) {
    hairS += k.shape(hairD, hairTone, { w: .8 });
    // engraved strands: contours following the skull round from the brow to the nape, waved if the hair is
    let st = '';
    const hc = [E[0] - 1.4, E[1] - 12.6], pt = (R, deg) => { const q = deg * Math.PI / 180; return `${f(hc[0] + Math.cos(q) * R)} ${f(hc[1] + Math.sin(q) * R)}`; };
    const waves = style === 'wavy' ? [175, 235, 295, 355, 415, 460] : [170, 310, 460];
    for (let i = 0; i < 13; i++) {
      const R = 13 + i * 2.7 + (v.part - .5) * 1.4;
      st += `M${pt(R, waves[0])}`;
      for (let j = 1; j < waves.length; j++) { const RR = R + (style === 'wavy' ? (j % 2 ? 1.4 : -1) : (j - 1) * .9); st += `A${f(RR)} ${f(RR)} 0 0 1 ${pt(RR, waves[j])}`; }
    }
    if (hair === 'long') for (let i = 0; i < 6; i++) st += `M${f(BK[0] - 6 + i * 1.8)} ${f(BK[1] + i * 3)}q${f(7 - i)} ${f(22 + i * 2)} ${f(-1 + i * 2)} ${f(fem ? 56 : 40)}`;
    hairS += `<path d="${st}" fill="none" stroke="${old ? ink : paper}" stroke-width="${old ? .5 : .7}" opacity="${old ? .75 : young ? .8 : .6}" ${clip('hair')}/>`;
    if (style === 'parted' && hair !== 'bald' && hair !== 'bun') hairS += k.line(`M${f(front[0] + 8 + v.part * 6)} ${f(front[1] - 9 - vol)}Q${f(V[0] + 6)} ${f(V[1] - vol + 1.4)} ${f(CR[0] + 6)} ${f(CR[1] - vol + 4)}`, .8, { color: old ? ink : paper, op: .8 });
    if (style === 'wavy') { let c = ''; for (let i = 0; i < 6; i++) c += `M${f(F[0] + 6 + i * 7)} ${f(F[1] - 6 + i * 2)}q3 -3 6 0t6 0`; hairS += `<path d="${c}" fill="none" stroke="${old ? ink : paper}" stroke-width=".6" opacity=".7" ${clip('hair')}/>`; }
    if (!young && !old) hairS += `<path d="M${f(E[0] - 10)} ${f(E[1] - 12)}q4 -2 9 -1M${f(E[0] - 9)} ${f(E[1] - 9)}q3 -1 7 0" fill="none" stroke="${paper}" stroke-width=".8" ${clip('hair')}/>`; // grey at the temple
    if (hair === 'bun') {
      const bx = BT[0] - 2, by = BT[1] - 5;
      hairS += k.shape(`M${f(bx - 9)} ${f(by + 2)}a10 9.4 0 1 1 6 9.4Z`, hairTone, { w: 1 });
      hairS += k.line(`M${f(bx - 4)} ${f(by - 6)}q7 3 6 12M${f(bx)} ${f(by - 7.6)}q6 4 4 13M${f(bx - 7)} ${f(by - 2)}q6 2 7 10`, .55, { color: old ? ink : paper, op: .75 });
    }
    // wisps at the nape and before the ear
    hairS += k.line(`M${f(NP[0] + 1)} ${f(NP[1] - 3)}l-1.6 4M${f(NP[0] - 1)} ${f(NP[1] - 4)}l-2.4 3.4M${f(E[0] - 8.4)} ${f(E[1] + 3)}l-.6 3`, .6);
    if (hair === 'bald') hairS += k.line(`M44 27q9 -6 22 -5`, .9, { color: ink, op: .35 });
  }

  // ---------- ear, eye, brow, nostril, mouth, and the lines of age ----------
  let feat = '';
  if (!nun) {
    feat += k.shape(`M${f(E[0] - 4)} ${f(E[1] - 5)}C${f(E[0] - 3.2)} ${f(E[1] - 9.4)} ${f(E[0] + 5)} ${f(E[1] - 9.6)} ${f(E[0] + 5.4)} ${f(E[1] - 3.4)}C${f(E[0] + 5.6)} ${f(E[1] + 2)} ${f(E[0] + 2)} ${f(E[1] + 3)} ${f(E[0] + 1.2)} ${f(E[1] + 6)}C${f(E[0] + .4)} ${f(E[1] + 8.8)} ${f(E[0] - 3.8)} ${f(E[1] + 9)} ${f(E[0] - 4)} ${f(E[1] + 5.4)}Z`, 'paper', { w: .9 });
    feat += k.line(`M${f(E[0] - 1.2)} ${f(E[1] - 4.8)}C${f(E[0] - .4)} ${f(E[1] - 7.4)} ${f(E[0] + 3.4)} ${f(E[1] - 6.6)} ${f(E[0] + 3)} ${f(E[1] - 2.2)}C${f(E[0] + 2.6)} ${f(E[1] + .8)} ${f(E[0])} ${f(E[1] + 1.2)} ${f(E[0] - .8)} ${f(E[1] + 3.6)}`, .6);
    feat += k.shape(`M${f(E[0] - 1.6)} ${f(E[1] - 1.6)}q2.4 -.6 2.6 2.4q-2 1 -2.6 -2.4Z`, 'mid', { w: 0 });
  }
  const ex = EY[0], ey = EY[1];
  feat += k.shape(`M${f(ex + 3.4)} ${f(ey - .8)}Q${f(ex)} ${f(ey - 2.4)} ${f(ex - 2.8)} ${f(ey + .2)}Q${f(ex)} ${f(ey + 1.8)} ${f(ex + 3)} ${f(ey + 1.3)}Z`, 'paper', { w: .5 });
  feat += k.shape(`M${f(ex - 2.4)} ${f(ey + .1)}Q${f(ex - 1.2)} ${f(ey - 1.6)} ${f(ex + .4)} ${f(ey - 1.4)}Q${f(ex + 1)} ${f(ey + .4)} ${f(ex - .2)} ${f(ey + 1.2)}Z`, 'ink', { w: 0 });
  feat += k.line(`M${f(ex + 3.8)} ${f(ey - 1.1)}Q${f(ex)} ${f(ey - 2.9)} ${f(ex - 3)} ${f(ey)}`, fem ? 1 : 1.1);
  if (fem) feat += k.line(`M${f(ex - 2.8)} ${f(ey)}l-1.2 -1.2M${f(ex - 1.8)} ${f(ey - 1)}l-.8 -1.5M${f(ex - .6)} ${f(ey - 1.5)}l-.3 -1.5`, .5);
  if (!young) feat += k.line(`M${f(ex + 3.4)} ${f(ey + 1.6)}q-2.4 1.4 -5 .4`, .4); // the lower lid's crease
  const browW = fem ? .85 : 1.2 + v.brow * 1.1;
  feat += k.line(`M${f(ex + 4.8)} ${f(ey - 5.4)}Q${f(ex)} ${f(ey - 7.6 - v.brow * 1.2 + (fem ? -.8 : 0))} ${f(G[0] + 2.2)} ${f(ey - 5.2 + v.brow * .8)}`, browW, { color: old && !fem ? grey : ink });
  feat += k.line(`M${f(S[0] + .4)} ${f(S[1] - 1.4)}Q${f(T[0] + 3.6)} ${f(T[1] + .6)} ${f(T[0] + 4.2)} ${f(T[1] + 2.8)}`, .65);
  feat += k.line(`M${f(ST[0])} ${f(ST[1])}Q${f(ST[0] + 3)} ${f(ST[1] + .9)} ${f(ST[0] + 4.8)} ${f(ST[1] - .3)}`, .85);
  if (!young) feat += k.line(`M${f(S[0] + 4.4)} ${f(S[1] - 4.4)}Q${f(S[0] + 6.6)} ${f(ST[1] - 2)} ${f(ST[0] + 5.2)} ${f(ST[1] + 2.6)}`, old ? .65 : .45);
  if (old) {
    feat += k.line(`M${f(F[0] + 1)} 41.6q4.6 -1.2 8 .2M${f(F[0] - .2)} 46.4q4.6 -1 8 .2M${f(ex + 4.4)} ${f(ey + .6)}l3.4 1.6M${f(ex + 4.4)} ${f(ey - .8)}l3.4 -.6M${f(ex + 4)} ${f(ey + 2.4)}l2.8 2.6`, .5);
    feat += k.line(`M${f(ST[0] + 5.6)} ${f(ST[1] + 2.6)}q1 3.4 -1 5.6M${f(CP[0] + 2)} ${f(CP[1] + 3)}q5 3 11 2M${f(CP[0] + 1)} ${f(CP[1] + 9)}q6 2 12 1`, .5);
  }
  if (!fem && !old && !young) feat += k.line(`M${f(F[0] + 1.6)} 44q4 -1 7 .2`, .4);

  // ---------- the beard ----------
  let beardS = '';
  const bTone = tone('black');
  const must = `M${f(S[0] - 1.6)} ${f(S[1] + .2)}C${f(UL[0] - 3)} ${f(UL[1] - 1.4)} ${f(UL[0] - 2.4)} ${f(UL[1] + 2.8)} ${f(ST[0] - .4)} ${f(ST[1] + .3)}C${f(ST[0] + 3)} ${f(ST[1] + 2.4)} ${f(ST[0] + 6.4)} ${f(ST[1] + 4)} ${f(ST[0] + 9)} ${f(ST[1] + 1.4)}C${f(ST[0] + 6.4)} ${f(S[1] - .4)} ${f(S[0] + 3)} ${f(S[1] - 1.8)} ${f(S[0] - 1.6)} ${f(S[1] + .2)}Z`;
  if (beard === 'full') {
    beardS += k.shape(`M${f(E[0] - 5)} ${f(E[1] + 1)}C${f(E[0] - 2)} ${f(E[1] + 16)} ${f(J[0] + 4)} ${f(J[1] + 6)} ${f(CP[0] + 6)} ${f(CP[1] + 2)}C${f(CP[0])} ${f(CP[1] + 4)} ${f(PG[0] - 1)} ${f(ME[1] + 9)} ${f(PG[0] - 5)} ${f(ME[1] + 4)}C${f(PG[0] - 7)} ${f(PG[1])} ${f(LL[0] - 1)} ${f(LL[1] + 2.4)} ${f(LL[0] + 1.4)} ${f(LL[1] + .8)}L${f(ST[0] + 3)} ${f(ST[1] + 1.6)}C${f(ST[0] + 9)} ${f(ST[1] - 2.4)} ${f(E[0] - 12)} ${f(E[1] + 4)} ${f(E[0] - 7)} ${f(E[1] - 5)}Z`, bTone, { w: .9 });
    let st = ''; for (let i = 0; i < 8; i++) st += `M${f(E[0] - 7 - i * 3.2)} ${f(E[1] + 7 + i * 3)}q-1.4 6 -4.6 9.6`;
    beardS += k.line(st, .5, { color: old ? ink : paper, op: old ? .7 : .55 });
  }
  // the moustache: waxed and turned up like the Kaiser's, a drooping walrus, or neatly trimmed
  const tache = beard === 'full' ? 'walrus' : collar === 'uniform' ? 'kaiser' : v.tache < .4 ? 'kaiser' : v.tache < .7 ? 'walrus' : 'neat';
  const tacheD = tache === 'kaiser'
    ? `M${f(S[0] - 1.4)} ${f(S[1] + .2)}C${f(UL[0] - 2.6)} ${f(UL[1] - 1.2)} ${f(UL[0] - 2.2)} ${f(UL[1] + 2.2)} ${f(ST[0] - .4)} ${f(ST[1] + .2)}C${f(ST[0] + 3)} ${f(ST[1] + 1.8)} ${f(ST[0] + 6.4)} ${f(ST[1] + 1.6)} ${f(ST[0] + 9.4)} ${f(ST[1] - 1.6)}L${f(ST[0] + 12.6)} ${f(ST[1] - 7.4)}C${f(ST[0] + 9)} ${f(ST[1] - 4)} ${f(S[0] + 5)} ${f(S[1] - 2.2)} ${f(S[0] - 1.4)} ${f(S[1] + .2)}Z`
    : tache === 'walrus'
      ? `M${f(S[0] - 1.8)} ${f(S[1] + .2)}C${f(UL[0] - 3.6)} ${f(UL[1] - 1)} ${f(UL[0] - 3.4)} ${f(UL[1] + 3.8)} ${f(ST[0] - .8)} ${f(ST[1] + 1.6)}C${f(ST[0] + 3)} ${f(ST[1] + 4.4)} ${f(ST[0] + 7)} ${f(ST[1] + 6.6)} ${f(ST[0] + 9.4)} ${f(ST[1] + 6)}C${f(ST[0] + 9)} ${f(ST[1] + 1)} ${f(S[0] + 6)} ${f(S[1] - 1.8)} ${f(S[0] - 1.8)} ${f(S[1] + .2)}Z`
      : must;
  if (beard !== 'none') beardS += k.shape(tacheD, bTone, { w: .8 });
  if (beard !== 'none' && beard !== 'full') beardS += k.line(`M${f(S[0] + .4)} ${f(S[1] + 1)}q2 2 3 4.4M${f(S[0] + 3)} ${f(S[1] + .4)}q2.4 2 3.4 4`, .45, { color: old ? ink : paper, op: .6 });
  if (beard === 'goatee') beardS += k.shape(`M${f(LL[0] + 1.8)} ${f(LL[1] + 1.4)}C${f(SL[0] - 2.4)} ${f(SL[1] + 2)} ${f(PG[0] - 5)} ${f(PG[1] + 3.4)} ${f(PG[0] - 3.4)} ${f(ME[1] + 6)}C${f(PG[0] + 4)} ${f(ME[1] + 3)} ${f(ME[0] + 3)} ${f(ME[1] - 4)} ${f(SL[0] + 4)} ${f(SL[1] - 2)}Z`, bTone, { w: .8 });

  // ---------- the hat ----------
  let hatS = '';
  const hy = F[1] + 3; // where a brim crosses the brow
  if (hat === 'bowler') {
    hatS += k.shape(`M35 ${f(hy - 2)}C34 17 45 9 60 9C75 9 87 16 87 ${f(hy - 6)}Z`, 'black', { w: 1.1 });
    hatS += k.shape(`M40 ${f(hy - 6)}C40 22 46 14 54 12.6C48 18 45.6 26 46 ${f(hy - 7)}Z`, 'mid', { w: 0 });
    hatS += k.shape(`M26 ${f(hy + 1)}C32 ${f(hy - 6)} 84 ${f(hy - 11)} 95 ${f(hy - 7)}C97 ${f(hy - 4)} 93 ${f(hy - 2)} 89 ${f(hy - 4)}C74 ${f(hy - 5)} 42 ${f(hy - 1)} 30 ${f(hy + 4)}Z`, 'black', { w: 1 });
    hatS += k.line(`M36 ${f(hy - 4.6)}C52 ${f(hy - 8)} 72 ${f(hy - 10)} 87 ${f(hy - 8.4)}`, 1.3, { color: paper, op: .55 });
  }
  if (hat === 'top') { // a tall silk hat, waisted, with its sheen
    hatS += k.shape(`M37 ${f(hy - 3)}C39 20 37 8 35 -6H85C83 8 82 20 84 ${f(hy - 8)}Z`, 'black', { w: 1.1 });
    hatS += k.shape(`M41 ${f(hy - 6)}C43 20 41 6 40 -5H46C46 6 48 20 47 ${f(hy - 7)}Z`, 'mid', { w: 0 });
    hatS += k.shape(`M36.6 ${f(hy - 10)}L84.4 ${f(hy - 14.6)}L84 ${f(hy - 8)}L37 ${f(hy - 3)}Z`, 'dark', { w: .7 });
    hatS += k.line(`M35 -6H85`, 1.4);
    hatS += k.shape(`M24 ${f(hy + 2)}C30 ${f(hy - 5)} 84 ${f(hy - 13)} 97 ${f(hy - 9)}C99 ${f(hy - 5)} 93 ${f(hy - 4)} 87 ${f(hy - 6)}C70 ${f(hy - 7)} 40 ${f(hy - 1)} 28 ${f(hy + 5)}Z`, 'black', { w: 1 });
  }
  if (hat === 'cap') {
    hatS += k.shape(`M34 ${f(hy)}C30 22 46 12 66 12C84 12 94 20 92 ${f(hy - 7)}C76 ${f(hy - 3)} 50 ${f(hy)} 34 ${f(hy)}Z`, 'dark', { w: 1.1 });
    hatS += k.shape(`M37 ${f(hy - 2)}C36 24 44 16 56 14.6C48 20 44 28 44.6 ${f(hy - 2.6)}Z`, 'light', { w: 0 });
    hatS += k.line(`M50 ${f(hy - .6)}C52 26 62 17 76 14.4`, .6, { color: paper, op: .7 });
    hatS += k.shape(`M35 ${f(hy - 1)}C27 ${f(hy)} 18 ${f(hy + 3)} 16 ${f(hy + 6)}C25 ${f(hy + 7.4)} 34 ${f(hy + 4)} 40 ${f(hy + 1.4)}Z`, 'black', { w: .9 });
    hatS += k.shape(`M62.6 12.8a3 1.8 0 1 1 6 0Z`, 'black', { w: .4 });
  }
  if (hat === 'boater') {
    hatS += k.shape(`M37 ${f(hy - 3)}L38 13C52 11 74 11 86 13L86 ${f(hy - 7)}Z`, 'paper', { w: 1.1 });
    let straw = ''; for (let y = 15; y < hy - 13; y += 2.2) straw += `M38.6 ${f(y)}H85.4`;
    hatS += k.line(straw, .4) + k.shape(`M72 13H86V${f(hy - 13)}H72Z`, 'light', { w: 0 });
    hatS += k.shape(`M37.4 ${f(hy - 10)}L86 ${f(hy - 13.4)}V${f(hy - 7)}L37 ${f(hy - 3)}Z`, 'black', { w: .7 });
    hatS += k.shape(`M14 ${f(hy)}C28 ${f(hy - 6)} 90 ${f(hy - 12)} 104 ${f(hy - 8)}L103 ${f(hy - 4.4)}C90 ${f(hy - 8)} 28 ${f(hy - 2)} 15 ${f(hy + 3.4)}Z`, 'paper', { w: 1.1 });
    hatS += k.shape(`M15 ${f(hy + 3.4)}C28 ${f(hy - 2)} 90 ${f(hy - 8)} 103 ${f(hy - 4.4)}L103 ${f(hy - 3)}C90 ${f(hy - 6.6)} 28 ${f(hy - .4)} 16 ${f(hy + 4.6)}Z`, 'dark', { w: 0 });
  }
  if (hat === 'fez') { // a felt cone narrowing to a small flat top, no peak, and the black tassel swinging behind
    hatS += k.shape(`M37 ${f(hy)}L47 1.6C55 .4 63 .4 71 1.6L84 ${f(hy - 6.4)}C70 ${f(hy - 6.4)} 52 ${f(hy - 3.4)} 37 ${f(hy)}Z`, 'mid', { w: 1.2 });
    hatS += k.shape(`M64 1.6L71 1.6L84 ${f(hy - 6.4)}C80 ${f(hy - 6.4)} 76 ${f(hy - 6.2)} 73 ${f(hy - 6)}Z`, 'dark', { w: 0 });
    hatS += k.shape(`M41 ${f(hy - 2)}L49 3.4H53L46.6 ${f(hy - 3)}Z`, 'paper', { w: 0 });
    hatS += k.shape(`M46.6 1.8C54 -.6 64 -.6 71.4 1.8C64 3.6 54 3.6 46.6 1.8Z`, 'black', { w: .7 });
    hatS += k.line(`M60 1.2C72 2.6 82 8 86 18`, 1.3) + k.shape(`M83.6 17.4l5.4 -.4l2 12l-4 1.6l-4 -1.4Z`, 'black', { w: .5 });
    let fr = ''; for (let i = 0; i < 4; i++) fr += `M${f(84.6 + i * 1.4)} 29v${f(3 + (i % 2))}`;
    hatS += k.line(fr, .6);
  }
  if (hat === 'kepi') {
    hatS += k.shape(`M35 ${f(hy)}L39 5L80 9.4L83 ${f(hy - 6)}C68 ${f(hy - 5)} 50 ${f(hy - 2)} 35 ${f(hy)}Z`, 'dark', { w: 1.1 });
    hatS += k.shape(`M35.6 ${f(hy - 6.4)}L82.4 ${f(hy - 12)}L83 ${f(hy - 6)}L35 ${f(hy)}Z`, 'black', { w: .7 });
    hatS += k.shape(`M39 5L80 9.4C70 11.6 48 9.6 39 5Z`, 'light', { w: .7 });
    hatS += k.line(`M36.4 ${f(hy - 9.4)}L82.6 ${f(hy - 15)}M37 ${f(hy - 12.4)}L82.2 ${f(hy - 18)}M60 9L61 ${f(hy - 7.6)}`, .8, { color: paper });
    hatS += `<circle cx="42" cy="${f(hy - 8.6)}" r="2.6" fill="${paper}" stroke="${ink}" stroke-width=".7"/>`;
    hatS += k.shape(`M36 ${f(hy - 1)}C28 ${f(hy + 1)} 20 ${f(hy + 4)} 18 ${f(hy + 7.6)}C27 ${f(hy + 7)} 36 ${f(hy + 3.6)} 42 ${f(hy + .4)}Z`, 'black', { w: .9 });
  }
  if (hat === 'wide') {
    if (fem) { // a picture hat: a broad brim tilted up at the back, an ostrich plume curling over the crown
      hatS += k.shape(`M38 ${f(hy - 3)}C38 16 50 9 64 9C78 9 86 15 84 ${f(hy - 8)}Z`, 'dark', { w: 1.1 });
      hatS += k.shape(`M4 ${f(hy + 6)}C14 ${f(hy - 6)} 86 ${f(hy - 17)} 114 ${f(hy - 11)}C117 ${f(hy - 7)} 110 ${f(hy - 4)} 100 ${f(hy - 5)}C74 ${f(hy - 8)} 24 ${f(hy + 2)} 8 ${f(hy + 10)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M46 14C48 4 70 0 86 5C98 9 104 18 100 27C96 18 86 12 74 11C64 10.6 54 11.4 46 14Z`, 'paper', { w: 1 }); // the plume
      let pl = ''; for (let i = 0; i < 10; i++) pl += `M${f(50 + i * 4.6)} ${f(12.4 - Math.sin(i / 9 * Math.PI) * 6.4)}q${f(3 + i * .3)} ${f(-3.4 + i * .6)} ${f(6 + i * .3)} ${f(-2.4 + i * .9)}`;
      hatS += k.line(pl, .55) + k.shape(`M40 ${f(hy - 8)}a4.4 4.4 0 1 1 8.8 -2a4.4 4.4 0 1 1 -8.8 2Z`, 'light', { w: .7 }) + `<circle cx="44.4" cy="${f(hy - 10.2)}" r="1.6" fill="${ink}"/>`;
    } else { // a broad felt slouch hat with a pinched crown
      hatS += k.shape(`M36 ${f(hy - 3)}C36 16 42 6 56 5L62 9L68 5C80 6 86 16 86 ${f(hy - 8)}Z`, 'dark', { w: 1.1 });
      hatS += k.shape(`M36.4 ${f(hy - 9)}L85.8 ${f(hy - 13)}V${f(hy - 8)}L36 ${f(hy - 3)}Z`, 'black', { w: .6 });
      hatS += k.shape(`M6 ${f(hy + 6)}C16 ${f(hy - 5)} 90 ${f(hy - 15)} 112 ${f(hy - 7)}C114 ${f(hy - 3)} 108 ${f(hy - 1)} 100 ${f(hy - 3)}C74 ${f(hy - 8)} 26 ${f(hy + 2)} 10 ${f(hy + 10)}Z`, 'black', { w: 1.1 });
    }
  }
  if (hat === 'veil') {
    if (nun) { // the black veil over a white coif
      hatS += k.shape(`M${f(F[0] - 3)} ${f(F[1] + 2)}C${f(F[0] - 6)} 16 52 8 70 8C92 8 104 26 104 52C104 78 108 110 118 152H${f(NB[0] - 2)}C${f(NB[0] + 4)} 122 ${f(NB[0])} 100 ${f(E[0] + 4)} ${f(E[1] + 6)}C${f(E[0] - 4)} ${f(E[1] - 6)} ${f(E[0] - 16)} ${f(E[1] - 18)} ${f(F[0] + 3)} ${f(F[1] + 5)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M${f(F[0] - 2.4)} ${f(F[1] + 1.6)}C${f(F[0] - 4)} 20 52 14 68 14L69 20C56 20 ${f(F[0] + 2)} 24 ${f(F[0] + 2.4)} ${f(F[1] + 5)}Z`, 'paper', { w: .9 });
      hatS += k.line(`M80 20C92 32 96 70 100 110`, .7, { color: paper, op: .5 });
    } else { // a small mourning hat, its veil down the back and a net before the eyes
      hatS += k.shape(`M38 ${f(hy - 3)}C40 18 50 12 62 12C74 12 82 18 82 ${f(hy - 7)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M28 ${f(hy + 1)}C40 ${f(hy - 6)} 82 ${f(hy - 11)} 92 ${f(hy - 7)}L90 ${f(hy - 3.6)}C80 ${f(hy - 6.6)} 42 ${f(hy - 2)} 30 ${f(hy + 4)}Z`, 'black', { w: .9 });
      hatS += k.shape(`M80 ${f(hy - 7)}C96 46 100 80 94 108C92 124 100 140 110 152H84C88 136 84 120 ${f(NB[0] + 3)} 104C${f(NB[0] + 7)} 88 ${f(BK[0])} 72 ${f(BK[0] - 4)} 52Z`, 'black', { w: 1, op: .93 });
      hatS += k.shape(`M29 ${f(hy + 3)}L${f(T[0] - 3)} ${f(T[1] - 3)}Q${f(ex + 2)} ${f(T[1] - 1)} ${f(E[0] - 5)} ${f(T[1] - 4)}L${f(E[0] - 3)} ${f(hy - 4)}Z`, 'dark', { w: 0, op: .32 });
      let hem = ''; for (let i = 0; i <= 10; i++) { const t = i / 10; hem += `<circle cx="${f(T[0] - 3 + (E[0] - 2 - T[0]) * t)}" cy="${f(T[1] - 3 + Math.sin(t * Math.PI) * 2 - t)}" r=".7" fill="${ink}"/>`; }
      hatS += hem;
    }
  }

  s += hairS + feat + beardS + hatS;

  // ---------- the cameo ----------
  const drop = DROP[hat] ?? 4;
  const defs = k.defs() + `<clipPath id="cam-${uid}"><ellipse cx="60" cy="75" rx="52.6" ry="67.6"/></clipPath>`
    + `<clipPath id="face-${uid}"><path d="${g.face}"/></clipPath><clipPath id="hair-${uid}"><path d="${hairD || 'M0 0Z'}"/></clipPath>`;
  const frame = `<ellipse cx="60" cy="75" rx="55.8" ry="70.8" fill="none" stroke="${ink}" stroke-width="2.6"/>`
    + `<ellipse cx="60" cy="75" rx="54.1" ry="69.1" fill="none" stroke="url(#dark-${uid})" stroke-width="2.2"/>`
    + `<ellipse cx="60" cy="75" rx="52.6" ry="67.6" fill="none" stroke="${ink}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><defs>${defs}</defs>`
    + `<ellipse cx="60" cy="75" rx="55" ry="70" fill="${paper}"/><g clip-path="url(#cam-${uid})">${k.shape('M0 0H120V150H0Z', 'horiz', { w: 0 })}`
    + `<g transform="translate(0 ${drop})">${s}</g></g>${frame}</svg>`;
}
