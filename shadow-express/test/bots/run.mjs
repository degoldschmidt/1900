// node test/bots/run.mjs [seeds=40] [policy,policy…]
// Runs whole campaigns headless and prints the balance figures the design sets thresholds on.
import D from '../../src/data/index.js';
import { newGame, makeGame } from '../../src/core/game.js';
import { play, won, POLICIES } from './bots.mjs';
import { when } from '../../src/data/time.js';

const n = Number(process.argv[2] ?? 40);
const names = (process.argv[3] ?? Object.keys(POLICIES).join(',')).split(',');
const pct = (x) => `${Math.round(x * 100)}%`;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
for (const name of names) {
  const out = [];
  const t0 = Date.now();
  for (let seed = 1; seed <= n; seed++) {
    const G = makeGame(D, newGame(D, { seed: seed * 7919, sex: seed % 2 ? 'm' : 'f' }));
    play(G, name);
    const S = G.S;
    out.push({ win: won(S), why: S.ended?.why ?? 'running', t: S.ended?.t ?? S.t, opsWon: Object.values(S.ops).filter((o) => o.status === 'won').length, dec: S.stats.decisions,
      next: S.stats.nextTrain / Math.max(1, S.stats.nextTrain + S.stats.notNext), near: S.stats.nearMisses, det: S.stats.detained, standing: S.standing, plants: S.stats.plants });
  }
  const whys = {};
  for (const o of out) whys[o.why] = (whys[o.why] ?? 0) + 1;
  console.log(`${name.padEnd(14)} wins ${pct(out.filter((o) => o.win).length / n)} · ops won ${med(out.map((o) => o.opsWon))} · decisions ${med(out.map((o) => o.dec))} · next-train ${pct(med(out.map((o) => o.next)))} · near misses ${med(out.map((o) => o.near))} · detained ${med(out.map((o) => o.det))} · standing ${med(out.map((o) => o.standing))} · ended ${JSON.stringify(whys)} · median end ${when(med(out.map((o) => o.t)))} · ${((Date.now() - t0) / n).toFixed(0)} ms/run`);
}
