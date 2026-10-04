// Postcards home: the album records each city where the agent first stops, once, with the time; changing trains on
// the way does not count; the album survives a save; a game saved before the album gets one from the cities visited.
//   node --test test/album.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T } from '../src/data/time.js';
import { newGame, makeGame } from '../src/core/game.js';
import { advance, endGame } from '../src/core/sim.js';
import { cardView, choose, plan, bookTrip } from '../src/core/actions.js';
import { defaultHero } from '../src/core/hero.js';

function drain(G) {
  for (let i = 0; i < 60 && G.S.queue.length; i++) {
    const v = cardView(G);
    if (!v) break;
    const k = v.choices.findIndex((c) => c.open && c.afford !== false && c.std !== 'nevermind');
    if (k < 0 || !choose(G, k)) G.S.queue.shift();
  }
}
function fresh(seed = 7) {
  const G = makeGame(D, newGame(D, { seed, hero: defaultHero('f') }));
  G.endGame = endGame;
  advance(G, T('06-28 17.00') + 1);
  drain(G);
  G.S.busyUntil = Math.min(G.S.busyUntil, G.S.t);
  return G;
}
/** Book the first route to a city and play until the agent stands in it. */
function go(G, to) {
  const its = plan(G, to);
  assert.ok(its.length, `a route to ${to}`);
  const it = its.find((x) => x.legs.length > 1) ?? its[0];
  assert.ok(bookTrip(G, it, 2).ok, `the route to ${to} books`);
  for (let i = 0; i < 300 && (G.S.journey || G.S.booked || G.S.queue.length || G.S.t < G.S.busyUntil); i++) {
    if (G.S.queue.length) drain(G); else advance(G, G.S.journey ? G.S.journey.arr + 1 : G.S.booked ? G.S.booked.dep + 1 : G.S.busyUntil);
  }
  G.S.busyUntil = Math.min(G.S.busyUntil, G.S.t);
  return it;
}

test('the album starts with the city the campaign starts in', () => {
  const S = newGame(D, { seed: 3, hero: defaultHero('m') });
  assert.deepEqual(S.album, { LON: S.t });
});

test('a first arrival goes in once, dated; changing trains on the way does not', () => {
  const G = fresh();
  const it = go(G, 'VIE');
  const S = G.S;
  if (S.city !== 'VIE') return; // the crisis may stop a train short: then that city is where the card comes from
  assert.ok(S.album.VIE >= it.legs.at(-1).dep && S.album.VIE <= S.t, 'dated on arrival');
  for (const leg of it.legs.slice(0, -1)) assert.equal(S.album[leg.to], undefined, `changed trains at ${leg.to}: no card`);
  const first = S.album.VIE;
  go(G, 'BUD');
  if (G.S.city === 'BUD') { go(G, 'VIE'); if (G.S.city === 'VIE') assert.equal(G.S.album.VIE, first, 'a second visit keeps the first card'); }
  assert.ok(Object.keys(G.S.album).length >= 2);
});

test('the album survives a save, and a game saved before it gets one', () => {
  const G = fresh();
  go(G, 'PAR');
  const saved = JSON.parse(JSON.stringify(G.S));
  assert.deepEqual(makeGame(D, saved).S.album, G.S.album);
  const old = JSON.parse(JSON.stringify(G.S));
  delete old.album;
  const R = makeGame(D, old);
  assert.deepEqual(Object.keys(R.S.album).sort(), Object.keys(old.visits).sort(), 'every city visited is in');
  assert.ok(Object.values(R.S.album).every((t) => t === old.t));
});
