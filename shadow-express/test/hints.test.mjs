// The hints: when each is due (pure logic, no DOM), that each is said once, that "no more hints" silences them,
// that saves made before hints existed still work, and that the words keep to the house style.
//   node --test test/hints.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T } from '../src/data/time.js';
import { newGame, makeGame } from '../src/core/game.js';
import { advance, endGame } from '../src/core/sim.js';
import { cardView, choose, plan, bookTrip, stash } from '../src/core/actions.js';
import { defaultHero } from '../src/core/hero.js';
import { play } from './bots/bots.mjs';
import { HINTS, dueHint, isIdle, makeHints, plain } from '../src/ui/hints.js';

const IDS = HINTS.map((h) => h.id);
const BOARD = { open: true, tab: 'board' };

/** Answer every card with its first open choice, until the game is waiting for the player. */
function drain(G) {
  for (let i = 0; i < 60 && G.S.queue.length; i++) {
    const v = cardView(G);
    if (!v) break;
    const k = v.choices.findIndex((c) => c.open && c.afford !== false);
    if (k < 0 || !choose(G, k)) G.S.queue.shift();
  }
}
/** A new campaign as the player first sees it: in London, the first newspaper read. */
function fresh(seed = 7, sex = 'f') {
  const G = makeGame(D, newGame(D, { seed, hero: defaultHero(sex) }));
  G.endGame = endGame;
  advance(G, G.S.t + 1);
  drain(G);
  return G;
}
/** Past the opening telegram: the Sarajevo order is open and nothing is booked. */
function ordered(seed) {
  const G = fresh(seed);
  advance(G, T('06-28 17.00') + 1);
  drain(G);
  G.S.busyUntil = Math.min(G.S.busyUntil, G.S.t);
  return G;
}
/** The first journey made: by the Channel to Paris. */
function arrived(seed) {
  const G = ordered(seed);
  const it = plan(G, 'PAR')[0];
  assert.ok(bookTrip(G, it, 2).ok, 'a route to Paris books');
  for (let i = 0; i < 200 && (G.S.journey || G.S.booked || G.S.queue.length || G.S.t < G.S.busyUntil); i++) {
    if (G.S.queue.length) drain(G); else advance(G, G.S.journey ? G.S.journey.arr + 1 : G.S.booked ? G.S.booked.dep + 1 : G.S.busyUntil);
  }
  assert.equal(G.S.city, 'PAR');
  G.S.busyUntil = Math.min(G.S.busyUntil, G.S.t);
  return G;
}
const seenAll = (G, except = []) => { G.S.hints = { off: false, seen: Object.fromEntries(IDS.filter((i) => !except.includes(i)).map((i) => [i, 1])) }; return G; };

// ---------- when the game is idle ----------
test('a new campaign is idle once the first card is read, and says nothing until there is something to say', () => {
  const G = fresh();
  assert.ok(isIdle(G));
  assert.equal(G.S.city, 'LON');
  assert.equal(dueHint(G), null, 'no order yet, nobody met, nowhere to go: the first hour is not talked over');
});

test('nothing is due while travelling, with a train booked, a routine running, the clock busy or a card queued', () => {
  const cases = {
    'a journey': (S) => { S.journey = { svc: 'x' }; },
    'a train booked': (S) => { S.booked = { dp: {}, cls: 2, fare: 1, dep: S.t + 60 }; },
    'the clock busy': (S) => { S.busyUntil = S.t + 30; },
    'a routine': (S) => { S.routine = { until: S.t + 1440 }; },
    'a card queued': (S) => { S.queue.push({ type: 'note', title: 'x', text: 'y', n: 99 }); },
    'the campaign over': (S) => { S.ended = { why: 'home', t: S.t }; },
    'no city': (S) => { S.city = null; },
  };
  for (const [name, spoil] of Object.entries(cases)) {
    for (const make of [fresh, ordered, arrived]) {
      const G = make();
      assert.ok(dueHint(G, BOARD), `something is due in the quiet (${make.name})`);
      spoil(G.S);
      assert.equal(isIdle(G), false, name);
      assert.equal(dueHint(G, BOARD), null, `${name} (${make.name})`);
    }
  }
});

// ---------- each trigger, once ----------
const later = (hours) => (G) => { G.S.t += hours * 60; G.S.busyUntil = G.S.t; };
const SITUATIONS = {
  orders: { make: ordered, ui: {} },
  trains: { make: fresh, ui: BOARD },
  papers: { make: ordered, ui: {} },
  arrival: { make: arrived, ui: {} },
  traces: { make: arrived, ui: {}, after: later(4) },
  days: { make: arrived, ui: {}, after: later(13) },
  frontier: { make: arrived, ui: BOARD },
  people: { make: fresh, ui: {}, after: (G) => { G.S.people.ashby.st = 'met'; } },
};

test('every hint has a situation that makes it due, and the situations are all the hints', () => {
  assert.deepEqual(Object.keys(SITUATIONS), IDS);
});

for (const id of IDS) {
  test(`'${id}' is due when it should be, once`, () => {
    const s = SITUATIONS[id];
    const G = s.make();
    s.after?.(G);
    seenAll(G, [id]);
    assert.equal(dueHint(G, s.ui), id, 'due in its situation');
    // said: it is not due again, now or later, however the situation stays
    G.S.hints.seen[id] = G.S.t;
    assert.equal(dueHint(G, s.ui), null, 'not due once seen');
    G.S.t += 60; G.S.busyUntil = G.S.t;
    assert.equal(dueHint(G, s.ui), null, 'not due later either');
    // and a saved game keeps it said
    const back = makeGame(D, JSON.parse(JSON.stringify(G.S)));
    assert.equal(dueHint(back, s.ui), null, 'not due after a save and load');
  });
}

test('the user-interface hints wait for their tab', () => {
  for (const id of ['trains', 'frontier']) {
    const s = SITUATIONS[id];
    const G = s.make();
    seenAll(G, [id]);
    assert.equal(dueHint(G, {}), null, `${id}: not with the ledger on no tab`);
    assert.equal(dueHint(G, { open: false, tab: 'board' }), null, `${id}: not with the ledger shut`);
    assert.equal(dueHint(G, { open: true, tab: 'city' }), null, `${id}: not on another tab`);
    assert.equal(dueHint(G, BOARD), id);
  }
});

test('the opening hints come in order: the order, the departures, the spare papers', () => {
  const G = ordered();
  const said = [];
  for (let i = 0; i < 6; i++) { const id = dueHint(G); if (!id) break; said.push(id); G.S.hints = { off: false, seen: { ...(G.S.hints?.seen ?? {}), [id]: G.S.t } }; }
  assert.deepEqual(said, ['orders', 'papers']);
  const B = ordered();
  const withTab = [];
  for (let i = 0; i < 6; i++) { const id = dueHint(B, BOARD); if (!id) break; withTab.push(id); B.S.hints = { off: false, seen: { ...(B.S.hints?.seen ?? {}), [id]: B.S.t } }; }
  assert.deepEqual(withTab, ['orders', 'trains', 'papers'], 'with the departures open, what they mean comes before the papers');
});

test('a hint is done when the player is already doing what it says', () => {
  const by = (id) => HINTS.find((h) => h.id === id);
  const G = ordered();
  for (const [id, tab] of [['orders', 'board'], ['papers', 'covers'], ['traces', 'dossier'], ['people', 'people']]) {
    assert.equal(by(id).done(G, { open: true, tab }), true, `${id} is done on ${tab}`);
    assert.equal(by(id).done(G, { open: true, tab: 'city' }), false, `${id} is not done on the city tab`);
    assert.equal(by(id).done(G, { open: false, tab }), false, `${id} is not done with the ledger shut`);
  }
});

test('spare papers are mentioned before the first journey, and not once they are put away', () => {
  const G = ordered();
  seenAll(G, ['papers']);
  assert.equal(dueHint(G), 'papers');
  const spare = Object.keys(G.S.covers).find((c) => c !== G.S.cover);
  assert.ok(stash(G, spare), 'the spare set is left with the Bureau');
  assert.equal(dueHint(G), null, 'nothing to say about papers you do not carry');
});

test('the people hint waits for someone you have met, not for the old acquaintance of the creator', () => {
  const hero = { ...defaultHero('m'), friend: 'platt' };
  const G = makeGame(D, newGame(D, { seed: 3, hero }));
  advance(G, G.S.t + 1); drain(G);
  seenAll(G, ['people']);
  assert.equal(G.S.people.platt.st, 'met', 'the friend is on file from the start');
  assert.equal(dueHint(G), null, 'but has not been met in play');
  G.S.people.platt.covers = ['hale'];
  assert.equal(dueHint(G), 'people');
});

// ---------- no more hints ----------
test('"no more hints" silences every hint, in every situation', () => {
  for (const id of IDS) {
    const s = SITUATIONS[id];
    const G = s.make();
    s.after?.(G);
    seenAll(G, [id]);
    assert.equal(dueHint(G, s.ui), id);
    G.S.hints.off = true;
    assert.equal(dueHint(G, s.ui), null, id);
  }
});

// ---------- older saves ----------
test('saves made before hints existed work: nothing breaks, nothing is written until a hint is read', () => {
  const G = ordered();
  delete G.S.hints;
  const old = JSON.parse(JSON.stringify(G.S));
  assert.equal('hints' in old, false);
  const H = makeGame(D, old);
  assert.equal(dueHint(H), 'orders');
  assert.equal('hints' in H.S, false, 'asking leaves the save untouched');
  // a stripped-down state, as a very old or hand-made save might be
  const bare = { ...old, stats: undefined, ops: undefined, covers: undefined, people: undefined, records: undefined };
  assert.equal(dueHint({ S: bare }), null, 'nothing known, nothing said');
  assert.equal(dueHint({ S: bare }, BOARD), 'trains');
  assert.equal(dueHint({ S: { ...old, hints: {} } }), 'orders', 'a hints record without a seen list');
  assert.equal(dueHint({ S: { ...old, hints: { off: false, seen: { orders: 5 } } } }), 'papers');
  assert.equal(dueHint(null), null);
  assert.equal(dueHint({}), null);
});

test('the switch: enabled, setEnabled and reset keep to the campaign and ask for a save', () => {
  const G = ordered();
  delete G.S.hints;
  let saves = 0;
  const h = makeHints(null, { game: () => G, save: () => { saves++; }, busy: () => false });
  assert.equal(h.enabled(), true);
  assert.equal(h.isOpen(), false);
  h.setEnabled(false);
  assert.equal(h.enabled(), false);
  assert.equal(G.S.hints.off, true);
  assert.equal(dueHint(G), null);
  assert.equal(saves, 1);
  h.setEnabled(true);
  assert.equal(h.enabled(), true);
  assert.equal(dueHint(G), 'orders');
  G.S.hints.seen.orders = 5;
  assert.equal(dueHint(G), 'papers');
  h.reset();
  assert.deepEqual(G.S.hints, { off: false, seen: {} });
  assert.equal(dueHint(G), 'orders', 'reset forgets what was shown');
  assert.equal(saves, 3);
  // with no game at all
  const none = makeHints(null, { game: () => null });
  assert.equal(none.enabled(), true);
  none.setEnabled(false); none.reset(); none.check();
});

// ---------- the words ----------
test('six to eight hints, numbered in order, each at most 45 words', () => {
  assert.ok(HINTS.length >= 6 && HINTS.length <= 8, `${HINTS.length} hints`);
  assert.deepEqual(HINTS.map((h) => h.n), HINTS.map((_, i) => i + 1));
  assert.equal(new Set(IDS).size, IDS.length);
  for (const h of HINTS) {
    const words = plain(h.text).split(/\s+/).filter(Boolean).length;
    assert.ok(words <= 45, `${h.id}: ${words} words`);
    assert.ok(words >= 20, `${h.id}: ${words} words is too few to explain anything`);
  }
});

test('the hints speak in the house style: British, dry, of 1914, and about the game as it is called in play', () => {
  const TABS = ['City', 'Trains', 'Orders', 'People', 'Case', 'Covers', 'Dossier', 'You'];
  const KEYS = ['city', 'board', 'orders', 'people', 'case', 'covers', 'dossier', 'you'];
  const modern = /\b(okay|ok|process|impact|focus|update|click|tap|swipe|button|app|screen|menu|user|player|gamer|level|quest|tutorial|tooltip|pop-?up|smartphone|online|email|e-mail|upgrade|download)\b/i;
  const american = /\b(color|favor|honor|center|organiz|recogniz|realiz|analyz|defense|gray|traveler|license|catalog|program\b)/i;
  const brand = /claude|anthropic|\bAI\b|\bGPT\b|language model|assistant/i;
  for (const h of HINTS) {
    const text = plain(h.text);
    assert.doesNotMatch(text, modern, `${h.id}: modern idiom`);
    assert.doesNotMatch(text, american, `${h.id}: American spelling`);
    assert.doesNotMatch(text, brand, `${h.id}: names a tool`);
    assert.doesNotMatch(text, /\bDepartures\b/, `${h.id}: the tab is called Trains`);
    assert.doesNotMatch(text, /!/, `${h.id}: no exclamation marks in a Bureau memo`);
    assert.match(text, /[.:;]$/, `${h.id}: ends like a sentence`);
    for (const m of h.text.matchAll(/\{([a-z]+)\|([^}]+)\}/g)) {
      assert.ok(KEYS.includes(m[1]), `${h.id}: link to a real tab (${m[1]})`);
      assert.equal(TABS[KEYS.indexOf(m[1])], m[2], `${h.id}: the link is labelled as the tab is`);
    }
  }
});

// ---------- in a whole campaign ----------
test('played through by the bots, every hint becomes due, each only once', () => {
  const reached = new Set();
  for (const [policy, seed, start] of [['careless', 21, ordered], ['careless', 4, fresh], ['competent', 5, fresh], ['competent', 11, ordered]]) {
    const G = start(seed);
    const said = [];
    const probe = () => { // a player who reads every hint at every idle moment, on the city tab and on the departures
      for (const ui of [{}, BOARD]) {
        for (let id = dueHint(G, ui); id; id = dueHint(G, ui)) {
          assert.equal(said.includes(id), false, `${policy} ${seed}: '${id}' due again after it was said`);
          said.push(id); reached.add(id);
          G.S.hints = { off: false, seen: { ...(G.S.hints?.seen ?? {}), [id]: G.S.t } };
        }
      }
    };
    probe();
    for (let step = 0; step < 2500 && !G.S.ended; step++) { play(G, policy, 1); probe(); }
    assert.ok(said.length >= 3, `${policy} ${seed}: only ${said.join(', ') || 'nothing'} was due`);
  }
  assert.deepEqual([...reached].sort(), [...IDS].sort(), 'every hint is reachable in play');
});
