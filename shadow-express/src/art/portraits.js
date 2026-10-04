// Engraved cameo portraits (owner: Art C): a double inked oval on paper, a head-and-shoulders profile facing left.
// portrait({ seed, sex, hat, hair, beard, collar, age }, uid) → SVG string, viewBox 120×150.
// The parameters choose costume and age; the seed shapes the face (nose, brow, jaw, lips, neck, skull, ear)
// so that no two people look alike. Unknown or missing values fall back to defaults; nothing throws.
import { makeKit } from './kit.js';

const ONE = (v, list, d) => (list.includes(v) ? v : d);
const HATS = ['none', 'bowler', 'top', 'cap', 'boater', 'fez', 'veil', 'kepi', 'wide'];
const HAIR = ['short', 'long', 'bun', 'bald'];
const BEARDS = ['none', 'moustache', 'full', 'goatee'];
const COLLARS = ['lace', 'stiff', 'uniform', 'cassock', 'fur'];
const AGES = ['young', 'mid', 'old'];
const f = (n) => Math.round(n * 10) / 10;

/** A smooth closed or open path through points (Catmull-Rom as cubic Béziers). A point [x, y, 1] is a corner. */
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

/** The face and skull for one person: landmark points, shaped by sex, age and the seed. */
function geometry(sex, age, r) {
  const v = {};
  for (const key of ['nose', 'hump', 'tip', 'brow', 'slope', 'chin', 'jaw', 'lips', 'neck', 'eye', 'ear', 'skull', 'nostril', 'cheek']) v[key] = r();
  const fem = sex === 'f', old = age === 'old', young = age === 'young';
  const sm = fem ? .68 : 1;
  const g = { v, fem, old, young };
  g.F = [35.5 + (v.slope - .5) * 4, 34];
  g.F2 = [33 + (v.slope - .5) * 2.4, 43];
  g.G = [31 - (v.brow - .5) * 2.6 * sm + (fem ? 1.2 : 0), 52];
  g.N = [g.G[0] + 2.2 + v.brow * 1.2 * sm, 56.6];
  g.T = [20.5 - (v.nose - .5) * 6.4 * sm - (old ? 1 : 0) + (fem ? 2.4 : 0), 69 + (v.tip - .5) * 3 + (old ? 1.2 : 0)];
  g.B = [(g.N[0] + g.T[0]) / 2 - (v.hump - .42) * 4 * sm, (g.N[1] + g.T[1]) / 2 - .5];
  g.S = [29.5 + (fem ? .6 : 0) + (v.nostril - .5) * 1.2, 74.4 + (old ? .6 : 0)];
  const lip = (v.lips - .5) * 1.6 + (fem ? 1 : 0) + (young ? .4 : 0) - (old ? 1 : 0);
  g.UL = [28.4 - lip, 77.8];
  g.ST = [31.6, 80.2];
  g.LL = [29.8 - lip * .85, 82.6];
  const cx = 35.4 - (v.chin - .5) * 5 * (fem ? .7 : 1) + (old ? 1.4 : 0);
  g.SL = [cx + 2.4 + (v.chin > .6 ? .6 : 0), 86.2];
  g.PG = [cx, 90.8 + (v.jaw - .5) * 1.6];
  g.ME = [cx + 4 + (fem ? .6 : 0), 95.6 + (fem ? -.8 : 0)];
  g.J = [61 + (v.jaw - .5) * 6, 89.5 + (v.jaw - .5) * 3 + (old ? 2.4 : 0)];
  g.UJ = [g.ME[0] + 8, g.ME[1] + 2.6 + (old ? 2.8 : 0) + (fem ? -.6 : 0)];
  g.CP = [46 - (v.neck - .5) * 4 + (fem ? 2 : 0) - (old ? 1 : 0), 101 + (old ? 2 : 0)];
  g.NF = [g.CP[0] + .8, 116];
  g.NB = [75 + (v.neck - .5) * 3 - (fem ? 2.4 : 0), 116];
  g.NP = [g.NB[0] + 2, 98];
  g.BK = [92 + (v.skull - .5) * 4, 62];
  g.OC = [g.BK[0] - 7, 84];
  g.BT = [g.BK[0] - 3.6, 38];
  g.CR = [76, 24.5];
  g.V = [57, 21.4];
  g.E = [63.5 + (v.ear - .5) * 3, 65];
  g.EY = [37.6 + (v.eye - .5) * 1.2, 59.4 + (v.eye - .5) * 1.2];
  const prof = [g.F, g.F2, g.G, g.N, g.B, g.T, [g.T[0] + .6, g.T[1] + 2.4], [g.S[0] - 2.2, g.S[1] - .4], [g.S[0], g.S[1], 1],
    g.UL, [g.ST[0], g.ST[1], 1], g.LL, g.SL, g.PG, g.ME, g.UJ, g.CP];
  if (!fem && !old) prof.push([g.CP[0] - 1.6, 105.4], [g.CP[0] - .4, 109]);
  else prof.push([g.CP[0] - (old ? 1.4 : .6), 108]);
  prof.push([g.NF[0], g.NF[1], 1], [g.NB[0], g.NB[1], 1], g.NP, g.OC, g.BK, g.BT, g.CR, g.V, [42, 25.6]);
  g.face = spline(prof, true);
  return g;
}

export function portrait(p = {}, uid = 'p') {
  p = p || {};
  const seed = Number.isFinite(+p.seed) ? Math.abs(Math.round(+p.seed)) : 1;
  const sex = p.sex === 'f' ? 'f' : 'm', fem = sex === 'f';
  const hat = ONE(p.hat, HATS, 'none'), age = ONE(p.age, AGES, 'mid'), collar = ONE(p.collar, COLLARS, 'stiff');
  const hair = ONE(p.hair, HAIR, fem ? 'bun' : 'short'), beard = fem ? 'none' : ONE(p.beard, BEARDS, 'none');
  const k = makeKit({ uid, seed: seed + 1 });
  const r = k.rng(seed * 7919 + 101);
  const g = geometry(sex, age, r), v = g.v, old = g.old, young = g.young;
  const nun = hat === 'veil' && collar === 'cassock';
  const { F, G, N, T, S, UL, ST, LL, SL, PG, ME, J, UJ, CP, NF, NB, NP, BK, OC, BT, CR, V, E, EY } = g;
  const ink = k.ink, paper = k.paper;
  const clip = (id) => `clip-path="url(#${id}-${uid})"`;

  let s = k.shape('M0 0H120V150H0Z', 'horiz', { w: 0 }); // the ruled ground of the engraving

  // ---------- the bust ----------
  const coat = collar === 'uniform' || collar === 'cassock' ? 'black' : 'dark';
  s += k.shape(`M${f(NF[0] - 1)} 108C38 112 28 124 20 150H116C115 132 108 118 94 112C88 109 ${f(NB[0] + 4)} 106 ${f(NB[0] + 1)} 106Z`, coat, { w: 1.1 });
  s += k.line(`M${f(NB[0] + 12)} 114C94 120 100 134 102 150`, .7, { color: paper, op: .5 }); // the sleeve's seam catching light

  // ---------- the head ----------
  s += k.shape(g.face, 'paper', { w: 1.2 });
  // shade on the side turned from the light, cut to the face: under the jaw and down the neck, the cheek's hollow, the temple, the eye socket
  let shade = k.shape(`M${f(ME[0] + 1)} ${f(ME[1] - .4)}C${f(UJ[0] + 4)} ${f(J[1] + 3)} ${f(J[0] - 4)} ${f(J[1] + 1.6)} ${f(J[0] + 1)} ${f(J[1] - 3)}L${f(NB[0] + 6)} ${f(J[1] - 6)}V${f(J[1] + 10)}C${f(J[0])} ${f(J[1] + 12)} ${f(CP[0] + 6)} ${f(CP[1] + 4)} ${f(CP[0] - 2)} ${f(CP[1] + 6)}Z`, 'mid', { w: 0 });
  shade += k.shape(`M${f(CP[0] - 2)} ${f(CP[1] + 5)}C${f(CP[0] + 8)} ${f(CP[1] + 3)} ${f(J[0])} ${f(J[1] + 11)} ${f(NB[0] + 6)} ${f(J[1] + 9)}V124H${f(CP[0] - 4)}Z`, 'light', { w: 0 });
  shade += k.shape(`M${f(E[0] - 7)} ${f(E[1] + 2)}C${f(E[0] - 12)} ${f(E[1] + 8)} ${f(ST[0] + 12)} ${f(ST[1] - 2)} ${f(ST[0] + 7)} ${f(ST[1] + 4)}C${f(ST[0] + 14)} ${f(ST[1] + 1)} ${f(E[0] - 8)} ${f(E[1] + 13)} ${f(J[0] - 1)} ${f(J[1] - 6)}C${f(J[0])} ${f(E[1] + 8)} ${f(E[0] - 3)} ${f(E[1] + 4)} ${f(E[0] - 7)} ${f(E[1] + 2)}Z`, 'light', { w: 0 });
  shade += k.shape(`M${f(E[0] - 6)} ${f(E[1] - 12)}C${f(E[0] - 10)} ${f(E[1] - 6)} ${f(E[0] - 9)} ${f(E[1] + 1)} ${f(E[0] - 5)} ${f(E[1] + 3)}L${f(E[0])} ${f(E[1] - 12)}Z`, 'light', { w: 0 });
  shade += k.shape(`M${f(G[0] + 4)} ${f(EY[1] - 3.4)}C${f(EY[0] + 2)} ${f(EY[1] - 4.4)} ${f(EY[0] + 6)} ${f(EY[1] - 3)} ${f(EY[0] + 8)} ${f(EY[1] + 1)}C${f(EY[0] + 4)} ${f(EY[1] - 1.6)} ${f(EY[0])} ${f(EY[1] - 2)} ${f(G[0] + 4)} ${f(EY[1] - 3.4)}Z`, 'light', { w: 0 });
  if (old || v.cheek > .6) shade += k.shape(`M${f(S[0] + 7)} ${f(S[1] - 6)}C${f(S[0] + 12)} ${f(S[1] - 2)} ${f(S[0] + 12)} ${f(ST[1] + 4)} ${f(ST[0] + 9)} ${f(ST[1] + 8)}C${f(ST[0] + 12)} ${f(ST[1])} ${f(S[0] + 14)} ${f(S[1] - 6)} ${f(S[0] + 7)} ${f(S[1] - 6)}Z`, 'light', { w: 0 });
  s += `<g ${clip('face')}>${shade}</g>`;
  // the jaw's line from chin to ear
  s += k.line(`M${f(ME[0] + 3)} ${f(ME[1] - .2)}C${f(J[0] - 12)} ${f(J[1] + 1.4)} ${f(J[0] - 3)} ${f(J[1] + 1)} ${f(J[0])} ${f(J[1] - 3)}C${f(J[0] + 1)} ${f(J[1] - 7)} ${f(J[0] + 1.6)} ${f(J[1] - 11)} ${f(J[0] + 2.4)} ${f(J[1] - 13)}`, old ? .5 : .65);
  if (old) s += k.line(`M${f(UJ[0] - 2)} ${f(UJ[1] - 1)}q4 3 9 2`, .5); // the jowl

  // ---------- the collar, over the neck ----------
  if (collar === 'stiff') {
    s += k.shape(`M${f(NF[0] - 1)} 113C38 118 30 130 26 150H42C42 136 44 124 ${f(NF[0] + 6)} 116Z`, 'paper', { w: .9 }); // the shirt front
    s += k.shape(`M${f(NF[0] - 2.4)} 101.6L${f(NF[0] - 1.4)} 115L${f(NB[0] + 1.6)} 113L${f(NB[0] + .6)} 100.6C64 104 54 104 ${f(NF[0] - 2.4)} 101.6Z`, 'paper', { w: 1.1 });
    s += k.shape(`M${f(NF[0] - 4.6)} 107.4l4.4 -2.6l4.4 2.6l-4.4 2.6Z`, 'black', { w: .5 }) + k.shape(`M${f(NF[0] - 6)} 104.6l1.4 2.8l-1.4 2.8l-2 -2.8Z`, 'black', { w: .5 }); // a bow tie
    s += k.shape(`M${f(NF[0] + 7)} 116C46 124 42 136 42 150H54C54 136 58 124 ${f(NF[0] + 14)} 115Z`, 'black', { w: .8 }); // the lapel
    s += k.line(`M${f(NF[0] + 7)} 116L44 128L50 131`, .7, { color: paper, op: .8 });
  }
  if (collar === 'uniform') {
    s += k.shape(`M${f(NF[0] - 3)} 98.4L${f(NF[0] - 2)} 115L${f(NB[0] + 2)} 113L${f(NB[0] + 1)} 97.4C64 101 54 101 ${f(NF[0] - 3)} 98.4Z`, 'dark', { w: 1.1 });
    s += k.line(`M${f(NF[0] - 2.8)} 100.6C54 103.2 64 103.2 ${f(NB[0] + 1)} 99.6`, 1.2, { color: paper });
    s += k.shape(`M${f(NF[0] + 1)} 105.4h8v6.4h-8Z`, 'light', { w: .6 }) + `<circle cx="${f(NF[0] + 5)}" cy="108.6" r="1.3" fill="${ink}"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${f(NF[0] - 6.4 - i * 4.4)}" cy="${f(121 + i * 7.2)}" r="1.5" fill="${paper}" stroke="${ink}" stroke-width=".5"/>`;
    s += k.shape('M78 117Q92 109 104 118L102 125Q92 120 80 123Z', 'light', { w: .9 }); // the epaulette and its fringe
    let fr = ''; for (let x = 81; x < 103; x += 2) fr += `M${x} ${f(123.6 - (x - 80) * .06)}v6`;
    s += k.line(fr, .8) + k.line('M24 140Q52 124 96 150', 1.8, { color: paper }) + k.line('M24 144Q52 128 92 154', .7, { color: paper });
  }
  if (collar === 'cassock') {
    if (fem) { // the wimple and the white guimpe over the breast
      s += k.shape(`M${f(G[0] + 8)} 70C${f(G[0] + 6)} 84 ${f(ME[0] - 2)} 98 ${f(CP[0] - 6)} 104C36 112 28 124 24 150H80C82 132 84 118 ${f(NB[0] + 3)} 104C${f(NB[0] + 6)} 92 ${f(E[0] + 8)} 76 ${f(E[0] + 4)} 64Z`, 'paper', { w: 1 });
      s += k.line(`M${f(CP[0] - 4)} 108C40 118 34 130 32 146M${f(CP[0] + 6)} 112C52 124 50 136 50 148M${f(CP[0] + 16)} 112C66 124 66 136 66 148`, .45);
    } else {
      s += k.shape(`M${f(NF[0] - 2.4)} 103.4L${f(NF[0] - 1.4)} 115L${f(NB[0] + 1.6)} 113L${f(NB[0] + .6)} 102.4C64 106 54 106 ${f(NF[0] - 2.4)} 103.4Z`, 'black', { w: 1 });
      s += k.shape(`M${f(NF[0] - 2.2)} 104.6h6.4v5.4h-5.8Z`, 'paper', { w: .6 }); // the white tab
      for (let i = 0; i < 4; i++) s += `<circle cx="${f(NF[0] - 6 - i * 4.6)}" cy="${f(121 + i * 7.4)}" r="1.1" fill="${paper}"/>`;
    }
  }
  if (collar === 'lace') {
    const top = fem ? 97 : 102, w = NB[0] - NF[0] + 8;
    let sc = `M${f(NF[0] - 4)} ${top}`;
    for (let i = 0; i < 6; i++) sc += `q${f(w / 12)} -3.4 ${f(w / 6)} 0`;
    s += k.shape(sc + `L${f(NB[0] + 3)} 116L${f(NF[0] - 3)} 118Z`, 'paper', { w: 1 });
    let holes = ''; for (let i = 0; i < 10; i++) holes += `<circle cx="${f(NF[0] - 1 + (i % 5) * w / 5.6 + (i > 4 ? 2.4 : 0))}" cy="${f(top + 5 + (i > 4 ? 6 : 0))}" r="1" fill="none" stroke="${ink}" stroke-width=".45"/>`;
    s += holes;
    let jab = `M${f(NF[0] - 3)} 116`;
    for (let i = 0; i < 5; i++) jab += `q-7 ${f(2 + i * .4)} -4.4 ${f(5.6 + i)}`;
    s += k.shape(jab + `L${f(NF[0] + 10)} 150V118Z`, 'paper', { w: .9 });
    for (let i = 0; i < 5; i++) s += k.line(`M${f(NF[0] - 5 - i * 1.6)} ${f(121 + i * 6.4)}q6 1 12 -1`, .5);
  }
  if (collar === 'fur') {
    let fur = `M${f(NF[0] - 7)} 103`;
    for (let i = 0; i <= 18; i++) { const t = i / 18, a = Math.PI * (1.04 - t * 1.08); fur += `L${f(60 + Math.cos(a) * 36 + (i % 2 ? 2.2 : -1.2))} ${f(120 - Math.sin(a) * 20 + (i % 2 ? 2.4 : -2))}`; }
    fur += `L110 150H18Z`;
    s += k.shape(fur, 'stipple', { w: 1 }) + k.shape(`M18 150C22 134 32 124 ${f(NF[0] - 4)} 120C46 132 44 142 46 150Z`, 'dark', { w: 0 });
    let tufts = ''; for (let i = 0; i < 22; i++) { const x = 24 + r() * 82, y = 110 + r() * 36; tufts += `M${f(x)} ${f(y)}q1.6 -2.4 3.4 -1.2`; }
    s += k.line(tufts, .55);
  }

  // ---------- the hair ----------
  const tone = (darkest) => (old ? 'paper' : young ? darkest : 'dark');
  const hairTone = tone('black');
  const top = [[F[0] + 1.4, F[1] - 2], [40, 24.6], [V[0], V[1] - 3.2], [CR[0] + 1, CR[1] - 3], [BT[0] + 3.4, BT[1] - 1], [BK[0] + 3, BK[1] + 2]];
  let hairD = '';
  if (hair === 'short') hairD = spline([[F[0] + .6, F[1] + 1.4, 1], ...top, [OC[0] + 3, OC[1] + 1], [NP[0] + 2.6, NP[1] - 1, 1], [NP[0] - 3, NP[1] - 5], [E[0] + 9, E[1] + 7], [E[0] + 8, E[1] - 6], [E[0] + 2, E[1] - 12.4], [E[0] - 6, E[1] - 11.4], [E[0] - 7.6, E[1] - 1], [E[0] - 8.6, E[1] + 7, 1], [E[0] - 11.6, E[1] - 3], [E[0] - 13, E[1] - 12], [F[0] + 7, F[1] + 8]], true);
  if (hair === 'long') hairD = spline([[F[0] + .6, F[1] + 1.4, 1], ...top, [BK[0] + 3.6, BK[1] + 16], [NB[0] + (fem ? 10 : 6), fem ? 126 : 112], [NB[0] + (fem ? 4 : 2), fem ? 132 : 116, 1], [NB[0] - 4, fem ? 118 : 108], [E[0] + 8, E[1] + 10], [E[0] + 7, E[1] - 8], [E[0] + 1, E[1] - 12.4], [E[0] - 6, E[1] - 11.4], [E[0] - 7.6, E[1] + 2], [E[0] - 8.4, E[1] + 9, 1], [E[0] - 11.6, E[1] - 3], [E[0] - 13, E[1] - 12], [F[0] + 7, F[1] + 8]], true);
  if (hair === 'bun') hairD = spline([[F[0] + 1, F[1] + 2.6, 1], [F[0] - 2.4, F[1] - 4], [38, 19], [V[0], V[1] - 6.4], [CR[0] + 2, CR[1] - 4.4], [BT[0] + 4, BT[1] - 1], [BK[0] + 2.6, BK[1] + 2], [OC[0] + 2, OC[1] - 2], [NP[0], NP[1] - 8, 1], [E[0] + 8, E[1] + 2], [E[0] + 6, E[1] - 9], [E[0], E[1] - 12.6], [E[0] - 6.6, E[1] - 11], [E[0] - 8.4, E[1] - 1, 1], [E[0] - 11, E[1] - 9], [F[0] + 7, F[1] + 8]], true);
  if (hair === 'bald') hairD = spline([[E[0] - 6, E[1] - 10, 1], [E[0] + 1, E[1] - 13.4], [E[0] + 12, E[1] - 14.4], [BK[0] + 1.6, BK[1] - 6], [BK[0] + 2.4, BK[1] + 8], [OC[0] + 2.6, OC[1] + 1], [NP[0] + 2.4, NP[1] - 1, 1], [NP[0] - 3, NP[1] - 5], [E[0] + 8.6, E[1] + 6], [E[0] + 7.6, E[1] - 6], [E[0] + 1, E[1] - 9.4], [E[0] - 5, E[1] - 7.6]], true);
  let hairS = '';
  if (!nun) {
    hairS += k.shape(hairD, hairTone, { w: 1 });
    // strands: grey hair drawn in ink lines on paper, dark hair with paper glints
    let st = '';
    const n = hair === 'bald' ? 5 : 9;
    for (let i = 0; i < n; i++) {
      const y = (hair === 'bald' ? E[1] - 13 : 24) + i * (hair === 'bald' ? 5.4 : 7.6), x = (hair === 'bald' ? E[0] - 4 : 40 + i * .8);
      st += `M${f(x)} ${f(y)}q${f(18 - i)} ${f(-4 + i * .3)} ${f(44 - i * 2.4)} ${f(6 + i * 1.6)}`;
    }
    if (hair === 'long') for (let i = 0; i < 5; i++) st += `M${f(BK[0] - 4 + i * 1.6)} ${f(BK[1] + 4 + i * 3)}q${f(6 - i)} ${f(20 + i * 2)} ${f(-2 + i * 2)} ${f(fem ? 52 : 36)}`;
    hairS += `<path d="${st}" fill="none" stroke="${old ? ink : paper}" stroke-width="${old ? .55 : .7}" opacity="${old ? .85 : .75}" ${clip('hair')}/>`;
    if (hair === 'bun') {
      const bx = BT[0] - 2, by = BT[1] - 5;
      hairS += k.shape(`M${f(bx - 9)} ${f(by + 2)}a10 9.4 0 1 1 6 9.4Z`, hairTone, { w: 1 });
      hairS += k.line(`M${f(bx - 4)} ${f(by - 6)}q7 3 6 12M${f(bx)} ${f(by - 7.6)}q6 4 4 13`, .55, { color: old ? ink : paper, op: .7 });
    }
    if (hair === 'bald') hairS += k.line(`M44 27q9 -6 22 -5`, .8, { color: ink, op: .4 });
  }

  // ---------- ear, eye, brow, nostril, mouth ----------
  let feat = '';
  if (!nun) {
    feat += k.shape(`M${f(E[0] - 4)} ${f(E[1] - 5)}C${f(E[0] - 3.2)} ${f(E[1] - 9.4)} ${f(E[0] + 5)} ${f(E[1] - 9.6)} ${f(E[0] + 5.4)} ${f(E[1] - 3.4)}C${f(E[0] + 5.6)} ${f(E[1] + 2)} ${f(E[0] + 2)} ${f(E[1] + 3)} ${f(E[0] + 1.2)} ${f(E[1] + 6)}C${f(E[0] + .4)} ${f(E[1] + 8.8)} ${f(E[0] - 3.8)} ${f(E[1] + 9)} ${f(E[0] - 4)} ${f(E[1] + 5.4)}Z`, 'paper', { w: .9 });
    feat += k.line(`M${f(E[0] - 1.2)} ${f(E[1] - 4.8)}C${f(E[0] - .4)} ${f(E[1] - 7.4)} ${f(E[0] + 3.4)} ${f(E[1] - 6.6)} ${f(E[0] + 3)} ${f(E[1] - 2.2)}C${f(E[0] + 2.6)} ${f(E[1] + .8)} ${f(E[0])} ${f(E[1] + 1.2)} ${f(E[0] - .8)} ${f(E[1] + 3.6)}`, .6);
    feat += k.shape(`M${f(E[0] - 1.6)} ${f(E[1] - 2)}q2.4 -.6 2.6 2.4q-2 1 -2.6 -2.4Z`, 'mid', { w: 0 });
  }
  const ex = EY[0], ey = EY[1];
  feat += k.shape(`M${f(ex + 3.4)} ${f(ey - .8)}Q${f(ex)} ${f(ey - 2.4)} ${f(ex - 2.8)} ${f(ey + .2)}Q${f(ex)} ${f(ey + 1.8)} ${f(ex + 3)} ${f(ey + 1.3)}Z`, 'paper', { w: .5 });
  feat += k.shape(`M${f(ex - 2.4)} ${f(ey + .1)}Q${f(ex - 1.2)} ${f(ey - 1.6)} ${f(ex + .4)} ${f(ey - 1.4)}Q${f(ex + 1)} ${f(ey + .4)} ${f(ex - .2)} ${f(ey + 1.2)}Z`, 'ink', { w: 0 });
  feat += k.line(`M${f(ex + 3.8)} ${f(ey - 1.1)}Q${f(ex)} ${f(ey - 2.9)} ${f(ex - 3)} ${f(ey)}`, fem ? 1 : 1.1);
  if (fem) feat += k.line(`M${f(ex - 2.8)} ${f(ey)}l-1.2 -1.2M${f(ex - 1.8)} ${f(ey - 1)}l-.8 -1.5M${f(ex - .6)} ${f(ey - 1.5)}l-.3 -1.5`, .5);
  if (!young) feat += k.line(`M${f(ex + 3.4)} ${f(ey + 1.6)}q-2.4 1.4 -5 .4`, .4); // the lower lid's crease
  feat += k.line(`M${f(ex + 4.8)} ${f(ey - 5.6)}Q${f(ex)} ${f(ey - 7.8 - v.brow * 1.2)} ${f(G[0] + 2.2)} ${f(ey - 5.2)}`, fem ? .85 : 1.4 + v.brow * .8, { color: old && !fem ? '#6b5640' : ink });
  feat += k.line(`M${f(S[0] + .4)} ${f(S[1] - 1.4)}Q${f(T[0] + 3.6)} ${f(T[1] + .6)} ${f(T[0] + 4.2)} ${f(T[1] + 2.8)}`, .65);
  feat += k.line(`M${f(ST[0])} ${f(ST[1])}Q${f(ST[0] + 3)} ${f(ST[1] + .9)} ${f(ST[0] + 4.8)} ${f(ST[1] - .3)}`, .85);
  if (!young) feat += k.line(`M${f(S[0] + 4.4)} ${f(S[1] - 4.4)}Q${f(S[0] + 6.6)} ${f(ST[1] - 2)} ${f(ST[0] + 5.2)} ${f(ST[1] + 2.6)}`, old ? .65 : .45);
  if (old) {
    feat += k.line(`M${f(F[0] + 1)} 41.6q4.6 -1.2 8 .2M${f(F[0] - .2)} 46.4q4.6 -1 8 .2M${f(ex + 4.4)} ${f(ey + .6)}l3.4 1.6M${f(ex + 4.4)} ${f(ey - .8)}l3.4 -.6M${f(ex + 4)} ${f(ey + 2.4)}l2.8 2.6`, .5);
    feat += k.line(`M${f(ST[0] + 5.6)} ${f(ST[1] + 2.6)}q1 3.4 -1 5.6M${f(CP[0] + 2)} 104q5 3 11 2M${f(CP[0] + 1)} 110q6 2 12 1`, .5);
  }
  if (!fem && !old && !young) feat += k.line(`M${f(F[0] + 1.6)} 44q4 -1 7 .2`, .4);

  // ---------- the beard ----------
  let beardS = '';
  const bTone = tone('black');
  const must = `M${f(S[0] - 1.6)} ${f(S[1] + .2)}C${f(UL[0] - 3)} ${f(UL[1] - 1.4)} ${f(UL[0] - 2.4)} ${f(UL[1] + 2.8)} ${f(ST[0] - .4)} ${f(ST[1] + .3)}C${f(ST[0] + 3)} ${f(ST[1] + 2.4)} ${f(ST[0] + 6.4)} ${f(ST[1] + 4)} ${f(ST[0] + 9)} ${f(ST[1] + 1.4)}C${f(ST[0] + 6.4)} ${f(S[1] - .4)} ${f(S[0] + 3)} ${f(S[1] - 1.8)} ${f(S[0] - 1.6)} ${f(S[1] + .2)}Z`;
  if (beard === 'full') {
    beardS += k.shape(`M${f(E[0] - 5)} ${f(E[1] + 1)}C${f(E[0] - 2)} ${f(E[1] + 16)} ${f(J[0] + 4)} ${f(J[1] + 6)} ${f(CP[0] + 6)} ${f(CP[1] + 2)}C${f(CP[0])} ${f(CP[1] + 4)} ${f(PG[0] - 1)} ${f(ME[1] + 9)} ${f(PG[0] - 5)} ${f(ME[1] + 4)}C${f(PG[0] - 7)} ${f(PG[1])} ${f(LL[0] - 1)} ${f(LL[1] + 2.4)} ${f(LL[0] + 1.4)} ${f(LL[1] + .8)}L${f(ST[0] + 3)} ${f(ST[1] + 1.6)}C${f(ST[0] + 9)} ${f(ST[1] - 2.4)} ${f(E[0] - 12)} ${f(E[1] + 4)} ${f(E[0] - 7)} ${f(E[1] - 5)}Z`, bTone, { w: .9 });
    let st = ''; for (let i = 0; i < 7; i++) st += `M${f(E[0] - 7 - i * 3.4)} ${f(E[1] + 8 + i * 3.2)}q-1.4 6 -4.6 9.6`;
    beardS += k.line(st, .5, { color: old ? ink : paper, op: old ? .7 : .45 });
  }
  if (beard !== 'none') beardS += k.shape(must, bTone, { w: .8 });
  if (beard === 'moustache') beardS += k.line(`M${f(ST[0] + 8.4)} ${f(ST[1] + 1.6)}q2.4 -.6 3 -3.6`, 1.1, { color: old ? '#6b5640' : ink }); // the waxed point
  if (beard === 'goatee') beardS += k.shape(`M${f(LL[0] + 1.8)} ${f(LL[1] + 1.4)}C${f(SL[0] - 2.4)} ${f(SL[1] + 2)} ${f(PG[0] - 5)} ${f(PG[1] + 3.4)} ${f(PG[0] - 3.4)} ${f(ME[1] + 6)}C${f(PG[0] + 4)} ${f(ME[1] + 3)} ${f(ME[0] + 3)} ${f(ME[1] - 4)} ${f(SL[0] + 4)} ${f(SL[1] - 2)}Z`, bTone, { w: .8 });

  // ---------- the hat ----------
  let hatS = '';
  const hy = F[1] + 3; // where a brim crosses the brow
  if (hat === 'bowler') {
    hatS += k.shape(`M35 ${f(hy - 2)}C34 16 46 7 61 7C76 7 88 15 88 ${f(hy - 6)}Z`, 'black', { w: 1.1 });
    hatS += k.shape(`M40 ${f(hy - 6)}C40 21 46 13 54 11.6C48 17 45.6 25 46 ${f(hy - 7)}Z`, 'mid', { w: 0 });
    hatS += k.shape(`M26 ${f(hy + 1)}C32 ${f(hy - 6)} 84 ${f(hy - 11)} 95 ${f(hy - 7)}C97 ${f(hy - 4)} 93 ${f(hy - 2)} 89 ${f(hy - 4)}C74 ${f(hy - 5)} 42 ${f(hy - 1)} 30 ${f(hy + 4)}Z`, 'black', { w: 1 });
    hatS += k.line(`M36 ${f(hy - 4.6)}C52 ${f(hy - 8)} 72 ${f(hy - 10)} 88 ${f(hy - 8.4)}`, 1.3, { color: paper, op: .55 });
  }
  if (hat === 'top') {
    hatS += k.shape(`M36 ${f(hy - 3)}L33 4C48 1 74 1 88 4L86 ${f(hy - 8)}Z`, 'black', { w: 1.1 });
    hatS += k.shape(`M39.6 ${f(hy - 6)}L37.6 5C40 4.4 43 4 45.4 3.8L46 ${f(hy - 7.4)}Z`, 'mid', { w: 0 });
    hatS += k.shape(`M35.6 ${f(hy - 10)}L86.4 ${f(hy - 14.6)}L86 ${f(hy - 8)}L36 ${f(hy - 3)}Z`, 'dark', { w: .7 });
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
  if (hat === 'fez') {
    hatS += k.shape(`M39 ${f(hy)}L45 9C55 7 67 7 75 9L81 ${f(hy - 6)}C68 ${f(hy - 6)} 52 ${f(hy - 3)} 39 ${f(hy)}Z`, 'dark', { w: 1.1 });
    hatS += k.shape(`M43 ${f(hy - 2)}L48 10.6C50 10 52.6 9.6 55 9.4L51.6 ${f(hy - 3)}Z`, 'light', { w: 0 });
    hatS += k.shape(`M45 9C55 6 67 6 75 9C67 11 55 11 45 9Z`, 'black', { w: .7 });
    hatS += k.line(`M60 8.4C70 9 78 13 80.6 22`, 1.1) + k.shape(`M78.6 22h4.6l1 10l-3.4 1.2l-3.2 -1.2Z`, 'black', { w: .5 });
  }
  if (hat === 'kepi') {
    hatS += k.shape(`M35 ${f(hy)}L39 7L80 11.4L83 ${f(hy - 6)}C68 ${f(hy - 5)} 50 ${f(hy - 2)} 35 ${f(hy)}Z`, 'dark', { w: 1.1 });
    hatS += k.shape(`M35.6 ${f(hy - 6.4)}L82.4 ${f(hy - 12)}L83 ${f(hy - 6)}L35 ${f(hy)}Z`, 'black', { w: .7 });
    hatS += k.shape(`M39 7L80 11.4C70 13.6 48 11.6 39 7Z`, 'light', { w: .7 });
    hatS += k.line(`M38 15.4L81.4 ${f(hy - 16.6)}M50 9L51.6 ${f(hy - 3.6)}`, .8, { color: paper });
    hatS += `<circle cx="42" cy="${f(hy - 8.6)}" r="2.6" fill="${paper}" stroke="${ink}" stroke-width=".7"/>`;
    hatS += k.shape(`M36 ${f(hy - 1)}C28 ${f(hy + 1)} 20 ${f(hy + 4)} 18 ${f(hy + 7.6)}C27 ${f(hy + 7)} 36 ${f(hy + 3.6)} 42 ${f(hy + .4)}Z`, 'black', { w: .9 });
  }
  if (hat === 'wide') {
    if (fem) {
      hatS += k.shape(`M36 ${f(hy - 2)}C36 14 50 6 64 6C78 6 88 13 86 ${f(hy - 7)}Z`, 'dark', { w: 1.1 });
      hatS += k.shape(`M2 ${f(hy + 7)}C12 ${f(hy - 6)} 86 ${f(hy - 17)} 114 ${f(hy - 9)}C117 ${f(hy - 5)} 110 ${f(hy - 2)} 100 ${f(hy - 4)}C74 ${f(hy - 8)} 22 ${f(hy + 2)} 6 ${f(hy + 11)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M50 13C54 4 74 0 88 6C98 10 102 20 98 28C94 18 86 12 74 11C66 11 58 12 50 13Z`, 'paper', { w: 1 }); // the plume
      let pl = ''; for (let i = 0; i < 9; i++) pl += `M${f(54 + i * 4.4)} ${f(11.6 - Math.sin(i / 8 * Math.PI) * 6)}q${f(3 + i * .3)} ${f(-3.4 + i * .6)} ${f(6 + i * .3)} ${f(-2.4 + i * .9)}`;
      hatS += k.line(pl, .55) + k.shape(`M40 ${f(hy - 7)}a4.4 4.4 0 1 1 8.8 -2a4.4 4.4 0 1 1 -8.8 2Z`, 'light', { w: .7 }) + `<circle cx="44.4" cy="${f(hy - 9.2)}" r="1.6" fill="${ink}"/>`;
    } else {
      hatS += k.shape(`M36 ${f(hy - 3)}C36 16 42 6 56 5L62 9L68 5C80 6 86 16 86 ${f(hy - 8)}Z`, 'dark', { w: 1.1 });
      hatS += k.shape(`M36.4 ${f(hy - 9)}L85.8 ${f(hy - 13)}V${f(hy - 8)}L36 ${f(hy - 3)}Z`, 'black', { w: .6 });
      hatS += k.shape(`M6 ${f(hy + 6)}C16 ${f(hy - 5)} 90 ${f(hy - 15)} 112 ${f(hy - 7)}C114 ${f(hy - 3)} 108 ${f(hy - 1)} 100 ${f(hy - 3)}C74 ${f(hy - 8)} 26 ${f(hy + 2)} 10 ${f(hy + 10)}Z`, 'black', { w: 1.1 });
    }
  }
  if (hat === 'veil') {
    if (nun) {
      hatS += k.shape(`M${f(F[0] - 3)} ${f(F[1] + 2)}C${f(F[0] - 6)} 16 52 8 70 8C92 8 104 26 104 52C104 78 108 110 118 150H${f(NB[0] - 2)}C${f(NB[0] + 4)} 120 ${f(NB[0])} 98 ${f(E[0] + 4)} ${f(E[1] + 6)}C${f(E[0] - 4)} ${f(E[1] - 6)} ${f(E[0] - 16)} ${f(E[1] - 18)} ${f(F[0] + 3)} ${f(F[1] + 5)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M${f(F[0] - 2.4)} ${f(F[1] + 1.6)}C${f(F[0] - 4)} 20 52 14 68 14L69 20C56 20 ${f(F[0] + 2)} 24 ${f(F[0] + 2.4)} ${f(F[1] + 5)}Z`, 'paper', { w: .9 }); // the white band of the coif
      hatS += k.line(`M80 20C92 32 96 70 100 110`, .7, { color: paper, op: .5 });
    } else {
      hatS += k.shape(`M38 ${f(hy - 3)}C40 18 50 12 62 12C74 12 82 18 82 ${f(hy - 7)}Z`, 'black', { w: 1.1 });
      hatS += k.shape(`M28 ${f(hy + 1)}C40 ${f(hy - 6)} 82 ${f(hy - 11)} 92 ${f(hy - 7)}L90 ${f(hy - 3.6)}C80 ${f(hy - 6.6)} 42 ${f(hy - 2)} 30 ${f(hy + 4)}Z`, 'black', { w: .9 });
      hatS += k.shape(`M80 ${f(hy - 7)}C96 46 100 80 94 108C92 124 100 140 110 150H84C88 134 84 118 ${f(NB[0] + 3)} 102C${f(NB[0] + 7)} 86 ${f(BK[0])} 72 ${f(BK[0] - 4)} 52Z`, 'black', { w: 1, op: .93 }); // the mourning veil down the back
      hatS += k.shape(`M29 ${f(hy + 3)}L${f(T[0] - 3)} ${f(T[1] - 3)}Q${f(ex + 2)} ${f(T[1] - 1)} ${f(E[0] - 5)} ${f(T[1] - 4)}L${f(E[0] - 3)} ${f(hy - 4)}Z`, 'dark', { w: 0, op: .32 }); // the net over the eyes
      let hem = ''; for (let i = 0; i <= 10; i++) { const t = i / 10; hem += `<circle cx="${f(T[0] - 3 + (E[0] - 2 - T[0]) * t)}" cy="${f(T[1] - 3 + Math.sin(t * Math.PI) * 2 - t)}" r=".7" fill="${ink}"/>`; }
      hatS += hem;
    }
  }

  s += hairS + feat + beardS + hatS;

  // ---------- the cameo frame ----------
  const defs = k.defs() + `<clipPath id="cam-${uid}"><ellipse cx="60" cy="75" rx="52.6" ry="67.6"/></clipPath>`
    + `<clipPath id="face-${uid}"><path d="${g.face}"/></clipPath><clipPath id="hair-${uid}"><path d="${hairD || 'M0 0Z'}"/></clipPath>`;
  const frame = `<ellipse cx="60" cy="75" rx="55.8" ry="70.8" fill="none" stroke="${ink}" stroke-width="2.6"/>`
    + `<ellipse cx="60" cy="75" rx="54.1" ry="69.1" fill="none" stroke="url(#dark-${uid})" stroke-width="2.2"/>`
    + `<ellipse cx="60" cy="75" rx="52.6" ry="67.6" fill="none" stroke="${ink}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><defs>${defs}</defs>`
    + `<ellipse cx="60" cy="75" rx="55" ry="70" fill="${paper}"/><g clip-path="url(#cam-${uid})">${s}</g>${frame}</svg>`;
}
