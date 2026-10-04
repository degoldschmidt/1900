// Pursuit, papers and pay: how hunters find you in a city, what a control's odds mean, the embassy bag,
// expulsions, the money that comes with an order, and suspicion that fades.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T, DAY } from '../src/data/time.js';
import { newGame, makeGame, opControl, EXPENSES } from '../src/core/game.js';
import { advance, findOdds, spotOdds } from '../src/core/sim.js';
import { cardView, choose, stash, retrieve, sendFor, BAG, book, board } from '../src/core/actions.js';
import { addWatch } from '../src/core/residence.js';
import { quietDay, QUIET } from '../src/core/enemy.js';
import { defaultHero } from '../src/core/hero.js';

const game = (o = {}) => { const G = makeGame(D, newGame(D, { seed: o.seed ?? 3, hero: o.hero ?? defaultHero('m') })); G.S.queue.length = 0; return G; };
const falk = D.hunters.find((h) => h.id === 'falk');
const inCity = (G, city, t = T('07-02 10.00')) => { G.S.t = t; G.S.city = city; G.S.cityArrived = t; G.S.journey = null; G.S.booked = null; };

test('a hunter finds a named guest in an hotel far sooner than an unknown lodger keeping to rented rooms', () => {
  const G = game();
  inCity(G, 'BER');
  G.S.lodging = { city: 'BER', kind: 'rooms', since: G.S.t }; G.S.place = 'rooms'; G.S.activity = { id: 'rest', city: 'BER', until: G.S.t + 60 };
  const quiet = findOdds(G, falk).day;
  G.S.enemy.dossiers[G.S.cover] = { susp: .8, name: true, alerts: ['DE'], seen: [], checked: true };
  G.S.lodging.kind = 'hotel'; G.S.activity = { id: 'cafe', city: 'BER', until: G.S.t + 60 };
  addWatch(G, .5);
  const loud = findOdds(G, falk);
  assert.ok(quiet < .15, `quiet ${quiet}`);
  assert.ok(loud.day > .8, `loud ${loud.day}`);
  assert.equal(loud.registers, true);
  G.S.lyingLow = true;
  assert.ok(findOdds(G, falk).day < loud.day * .5, 'lying low helps');
});

test('a watchful agent out in the city may see the hunter first; one keeping to the rooms rarely does', () => {
  const sharp = defaultHero('f'); sharp.skills.observation = 3;
  const G = game({ hero: sharp }), H = game();
  for (const g of [G, H]) { inCity(g, 'VIE'); g.S.activity = { id: 'work', city: 'VIE', until: g.S.t + 60 }; }
  assert.ok(spotOdds(G) > spotOdds(H));
  H.S.activity = { id: 'rest', city: 'VIE', until: H.S.t + 60 };
  assert.ok(spotOdds(H) < .15);
});

test('papers left with the Bureau come by the embassy bag in two days, for a fee', () => {
  const G = game();
  const spare = Object.keys(G.S.covers).find((k) => k !== G.S.cover);
  inCity(G, 'LON');
  assert.ok(stash(G, spare));
  assert.equal(sendFor(G, spare), false, 'not from London itself');
  inCity(G, 'VIE');
  const money = G.S.money;
  assert.ok(sendFor(G, spare));
  assert.equal(G.S.money, money - BAG.fee);
  assert.equal(retrieve(G, spare), false, 'not before the bag arrives');
  G.S.t += BAG.days * DAY;
  assert.ok(retrieve(G, spare));
  assert.equal(G.S.covers[spare].carried, true);
});

test('leaving the city that expelled you settles the order; coming back raises the watch', () => {
  const G = game();
  inCity(G, 'VIE', T('07-02 09.00'));
  G.S.expelled = { city: 'VIE', by: G.S.t + DAY };
  const row = board(G, 24).find((r) => !r.cancelled && r.classes.includes(2));
  assert.ok(row, 'a train out of Vienna');
  G.S.money = 99;
  assert.ok(book(G, row.dp.key, 2).ok);
  for (let i = 0; i < 50 && !G.S.journey && !G.S.ended; i++) { advance(G, row.dp.dep + 1); G.S.queue.length = 0; } // orders and news are beside the point
  assert.equal(G.S.expelled, null);
  assert.equal(G.S.banned?.VIE, G.S.cover);
});

test('showing papers at a control with your name on the list succeeds at the odds the card shows', () => {
  let shown = 0, passed = 0, n = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const G = game({ seed });
    inCity(G, 'VIE');
    G.S.enemy.dossiers[G.S.cover] = { susp: .8, name: true, alerts: ['AH'], seen: [], checked: true };
    G.S.queue.push({ type: 'control', fid: 'STN', name: 'Vienna station', into: 'AH', papers: true, search: false, alert: true, alien: false, story: null, n: 1 });
    const v = cardView(G);
    const i = v.choices.findIndex((c) => c.std === 'papers');
    shown += v.choices[i].p; n++;
    const before = G.S.stats.detained;
    choose(G, i);
    if (G.S.stats.detained === before && !G.S.ended) passed++;
  }
  const p = shown / n, rate = passed / n;
  assert.ok(rate > 0, 'it can succeed');
  assert.ok(Math.abs(rate - p) < .08, `rate ${rate.toFixed(2)} vs shown ${p.toFixed(2)}`);
});

test('a main order brings money for expenses; a favour does not', () => {
  const G = game();
  const main = D.ops.find((o) => !o.side && !o.optional), side = D.ops.find((o) => o.side);
  const m0 = G.S.money;
  opControl(G, main.id, 'start');
  assert.equal(G.S.money, m0 + EXPENSES);
  opControl(G, side.id, 'start');
  assert.equal(G.S.money, m0 + EXPENSES);
});

test('a name not yet posted fades from the enemy\'s mind on quiet days; a posted one does not', () => {
  const G = game();
  const E = G.S.enemy;
  E.dossiers.a = { susp: .3, name: false, alerts: [], seen: [], checked: false };
  E.dossiers.b = { susp: .9, name: true, alerts: ['DE'], seen: [], checked: true };
  quietDay(E);
  assert.ok(Math.abs(E.dossiers.a.susp - (.3 - QUIET)) < 1e-9);
  assert.equal(E.dossiers.b.susp, .9);
});
