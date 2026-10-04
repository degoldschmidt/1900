// A random walker: answers every card with its first open choice, takes random trains. Finds crashes, not balance.
import D from '../../src/data/index.js';
import { newGame, makeGame } from '../../src/core/game.js';
import { advance } from '../../src/core/sim.js';
import { board, book, cardView, choose, walk } from '../../src/core/actions.js';
import { rand } from '../../src/core/rng.js';
import { when } from '../../src/data/time.js';

const seeds = Number(process.argv[2] ?? 5);
for (let seed = 1; seed <= seeds; seed++) {
  const G = makeGame(D, newGame(D, { seed, sex: seed % 2 ? 'm' : 'f' }));
  const { S } = G;
  let guard = 0, cards = {};
  const t0 = Date.now();
  while (!S.ended && guard++ < 20000) {
    const v = cardView(G);
    if (v) {
      cards[v.card.type] = (cards[v.card.type] ?? 0) + 1;
      const i = v.choices.findIndex((c) => c.open && c.afford !== false);
      if (i < 0 || !choose(G, i)) { S.queue.shift(); }
      continue;
    }
    if (S.t < S.busyUntil) { advance(G, S.busyUntil); continue; }
    if (S.city) {
      if (rand(S) < .3) { walk(G); continue; }
      const rows = board(G).filter((r) => !r.cancelled);
      if (rows.length) {
        const r = rows[Math.floor(rand(S) * Math.min(6, rows.length))];
        const cls = r.classes.includes(2) ? 2 : r.classes[0];
        if (S.money < r.fares[cls]) S.money += 20;
        book(G, r.dp.key, cls);
        advance(G, r.dp.dep + 1);
        continue;
      }
    }
    advance(G, S.t + 60);
  }
  console.log(`seed ${seed}: ${S.ended?.why ?? 'running'} at ${when(S.t)} · ${Date.now() - t0} ms · decisions ${S.stats.decisions} · journeys ${S.stats.journeys} · controls ${S.stats.controls} · encounters ${S.stats.encounters} · records ${S.records.length} · cards ${JSON.stringify(cards)} · £${S.money} · standing ${S.standing}`);
  console.log('  ops', Object.entries(S.ops).map(([k, v]) => `${k}:${v.status}`).join(' '));
  console.log('  enemy', JSON.stringify({ desc: S.enemy.desc.toFixed(2), photo: S.enemy.photo, sc: S.enemy.scepticism, dossiers: Object.fromEntries(Object.entries(S.enemy.dossiers).map(([k, d]) => [k, `${d.susp.toFixed(2)}${d.name ? ' NAMED' : ''}`])) }));
}
