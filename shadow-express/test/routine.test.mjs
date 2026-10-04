// Letting the days pass: the routine runs "until something needs you". An order, a hunter, the police or a contact ends
// it; the routine's own scenes of city life and the morning paper do not. With the whole campaign's content.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { newGame, makeGame } from '../src/core/game.js';
import { advance } from '../src/core/sim.js';
import { passDays, cardView, choose } from '../src/core/actions.js';
import { defaultHero } from '../src/core/hero.js';

const answer = (G) => { const v = cardView(G); const k = v.choices.findIndex((c) => c.open && c.afford !== false); if (k < 0 || !choose(G, k)) G.S.queue.shift(); };

test('letting the days pass at the start stops for the first order, which is not failed by it', () => {
  for (const seed of [7, 11, 23]) {
    const G = makeGame(D, newGame(D, { seed, hero: defaultHero(seed % 2 ? 'm' : 'f') }));
    advance(G, G.S.t + 1);
    while (G.S.queue.length) answer(G); // the opening paper and any first scene
    assert.ok(passDays(G, 7), 'the routine can start');
    let telegram = null, quiet = 0;
    for (let i = 0; i < 400 && !telegram && !G.S.ended; i++) {
      advance(G, G.S.t + 24 * 60);
      const top = G.S.queue[0];
      if (!top) { if (!G.S.routine) passDays(G, 7); continue; }
      if (top.type === 'telegram') { telegram = top; break; }
      if (top.routine || top.type === 'news') { quiet++; assert.ok(G.S.routine, `seed ${seed}: the routine stops for its own scene or the paper (${top.type})`); }
      while (G.S.queue.length) answer(G);
      if (!G.S.routine) passDays(G, 7);
    }
    assert.ok(telegram, `seed ${seed}: an order arrived`);
    assert.equal(G.S.routine, null, `seed ${seed}: the routine ended when the order came`);
    assert.notEqual(G.S.ops[telegram.op]?.status, 'failed', `seed ${seed}: the order is not failed before it is read`);
    void quiet;
  }
});
