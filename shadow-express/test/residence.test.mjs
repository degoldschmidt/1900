// Living under cover and changing trains: the posting model's rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, DAY } from '../src/data/time.js';
import { buildWorld } from '../src/core/world.js';
import { newGame, makeGame } from '../src/core/game.js';
import { advance } from '../src/core/sim.js';
import { doActivity, passDays, bookTrip, plan, cardView, choose } from '../src/core/actions.js';
import { legendOf, watchLevel, addWatch, watchOf, SHADOWED } from '../src/core/residence.js';
import { defaultHero, skill } from '../src/core/hero.js';

const load = async () => {
  const names = ['nations', 'cities', 'lines', 'services', 'calendar', 'covers', 'people', 'hunters', 'items'];
  const D = {};
  for (const n of names) D[n] = (await import(`../src/data/${n}.js`)).default;
  D.stories = []; D.ops = []; // the rules alone, without content
  return D;
};
const D = await load();
const game = (o = {}) => { const G = makeGame(D, newGame(D, { seed: o.seed ?? 3, hero: o.hero ?? defaultHero('m') })); G.S.queue.length = 0; return G; };
const drain = (G) => { for (let i = 0; i < 50 && G.S.queue.length; i++) { const v = cardView(G); if (!v) break; const k = v.choices.findIndex((c) => c.open && c.afford !== false); if (k < 0 || !choose(G, k)) G.S.queue.shift(); } };

test('the watches of the day', () => {
  assert.equal(watchOf(T('07-01 09.00')).name, 'morning');
  assert.equal(watchOf(T('07-01 13.00')).name, 'afternoon');
  assert.equal(watchOf(T('07-01 20.00')).name, 'evening');
  assert.equal(watchOf(T('07-01 02.00')).name, 'night');
  assert.equal(watchOf(T('07-01 02.00')).end, T('07-01 08.00'));
});

test('cover work settles a legend; neglect wears it thin', () => {
  const G = game();
  G.S.t = T('07-01 09.00'); G.S.city = 'VIE'; G.S.cityArrived = G.S.t;
  doActivity(G, 'work');
  const end = G.S.busyUntil + 1;
  for (let i = 0; i < 50 && G.S.t < end; i++) { advance(G, end); drain(G); }
  const after = legendOf(G);
  assert.ok(after > .05, `legend ${after}`);
  // three days doing nothing
  G.S.routine = null; G.S.busyUntil = G.S.t;
  const until = G.S.t + 3 * DAY;
  for (let i = 0; i < 100 && G.S.t < until; i++) { advance(G, until); drain(G); }
  assert.ok(legendOf(G) < after, 'neglect wears the legend');
});

test('the local watch grows with traces on enemy ground and shadows you past the threshold', () => {
  const G = game();
  G.S.t = T('07-02 09.00'); G.S.city = 'VIE'; G.S.cityArrived = G.S.t - 2 * DAY;
  addWatch(G, .5);
  assert.ok(watchLevel(G) >= SHADOWED);
  const G2 = game();
  G2.S.t = T('07-02 09.00'); G2.S.city = 'ZUR';
  addWatch(G2, .5);
  assert.ok(watchLevel(G2) < watchLevel(G), 'neutral police care less in Act I');
});

test('tradecraft and languages change how fast the police notice you', () => {
  const sly = defaultHero('m'); sly.skills.tradecraft = 3; sly.langs.german = 2;
  const G1 = game({ hero: sly }), G2 = game();
  for (const G of [G1, G2]) { G.S.t = T('07-02 09.00'); G.S.city = 'VIE'; addWatch(G, .3); }
  assert.ok(skill(sly, 'tradecraft') === 3);
  assert.ok(watchLevel(G1) < watchLevel(G2));
});

test('letting the days pass runs the routine and stops at the limit', () => {
  const G = game();
  G.S.t = T('07-03 10.00'); G.S.city = 'VIE'; G.S.cityArrived = G.S.t;
  passDays(G, 2);
  for (let i = 0; i < 200 && G.S.routine; i++) { advance(G, G.S.routine.until); drain(G); }
  assert.ok(G.S.t >= T('07-05 10.00') - 60, `time ${G.S.t}`);
  assert.ok(legendOf(G) > .1, 'the routine works the legend');
});

test('a whole journey changes trains, and a late train can miss its connection', () => {
  const G = game({ seed: 11 });
  G.S.t = T('06-29 08.00'); G.S.city = 'LON'; G.S.money = 200;
  const its = plan(G, 'VIE');
  const it = its.find((x) => x.legs.length > 1) ?? its[0];
  assert.ok(it, 'an itinerary to Vienna');
  const r = bookTrip(G, it, 2);
  assert.ok(r.ok, r.why);
  let missed = false, guard = 0;
  while (G.S.city !== 'VIE' && guard++ < 400) {
    advance(G, G.S.t + 6 * 60);
    const v = cardView(G);
    if (v?.card.type === 'missed') missed = true;
    drain(G);
    if (G.S.city && !G.S.journey && !G.S.booked && !G.S.trip) break;
  }
  assert.ok(G.S.city === 'VIE' || missed, `ended in ${G.S.city}`);
});
