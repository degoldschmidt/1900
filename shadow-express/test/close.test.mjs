// The close button on a card: what the player could walk away from closes with no effect and no time lost; what is
// forced (controls, hunters, the police, an order's scenes, consequences, scenes with no way out) waits for an answer.
// Seeking someone costs nothing until the player commits to the meeting.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { newGame, makeGame } from '../src/core/game.js';
import { advance } from '../src/core/sim.js';
import { seek, cardView, choose, decline } from '../src/core/actions.js';
import { defaultHero } from '../src/core/hero.js';

const answer = (G) => { const v = cardView(G); const k = v.choices.findIndex((c) => c.open && c.afford !== false && c.std !== 'nevermind'); if (k < 0 || !choose(G, k)) G.S.queue.shift(); };
/** A game in London with nothing waiting. */
function london(seed = 7) {
  const G = makeGame(D, newGame(D, { seed, hero: defaultHero('f') }));
  advance(G, G.S.t + 1);
  for (let i = 0; i < 20 && G.S.queue.length; i++) answer(G);
  G.S.busyUntil = G.S.t;
  return G;
}
const without = (S, ...keys) => { const x = JSON.parse(JSON.stringify(S)); for (const k of keys) delete x[k]; delete x.stats; return x; };
const top = (G, card) => { G.S.queue.unshift({ n: ++G.S.cardN, ...card }); return cardView(G); };

test('seeking someone and thinking better of it leaves no trace and costs no time', () => {
  const G = london();
  const S = G.S;
  assert.equal(S.city, 'LON');
  assert.equal(S.people.ashby.st, 'unknown', 'the handler is still to be met');
  const before = without(S, 'queue', 'cardN', 'busyUntil'), busy = S.busyUntil;
  const s = seek(G, 'ashby');
  assert.ok(s, 'the handler can be sought');
  const v = cardView(G);
  assert.equal(v.close, 'decline', 'the close button walks away');
  assert.equal(v.choices.at(-1).std, 'nevermind');
  assert.equal(v.choices.at(-1).label, 'Never mind');
  assert.ok(choose(G, v.choices.length - 1), 'Never mind can be chosen');
  assert.equal(S.queue.length, 0);
  assert.equal(S.busyUntil, busy, 'the time is given back');
  assert.deepEqual(without(S, 'queue', 'cardN', 'busyUntil'), before, 'nothing else changed: no record, no meeting, nothing seen');
  // the same scene is there next time, and the close button does the same as Never mind
  assert.equal(seek(G, 'ashby').id, s.id);
  assert.ok(decline(G));
  assert.equal(S.queue.length, 0);
  assert.equal(S.busyUntil, busy);
  assert.equal(S.people.ashby.st, 'unknown');
});

test('a meeting kept leaves what it always left', () => {
  const G = london();
  const S = G.S;
  S.tailedBy = G.D.hunters[0].id; // a tail sees every meeting
  const recs = S.records.length;
  const s = seek(G, 'ashby');
  answer(G);
  assert.notEqual(S.people.ashby.st, 'unknown', 'met');
  assert.ok(S.records.length > recs && S.records.some((r) => r.kind === 'meeting' && r.person === 'ashby'), 'the tail saw it');
  if (s.once) assert.ok(S.seen[s.id], 'a once-only scene is used up');
  assert.ok(S.people.ashby.covers.includes(S.cover), 'they know the name you used');
});

test('what the close button does, card by card', () => {
  const G = london();
  const S = G.S, svc = G.D.services[0].id, hunter = G.D.hunters[0].id;
  const kind = (card) => { const v = top(G, card); S.queue.length = 0; return v.close; };
  assert.equal(kind({ type: 'control', fid: 'x', name: 'Herbesthal', into: G.D.nations[0].id, papers: true, search: false, alert: false, alien: false, story: null }), 'aside', 'a frontier control');
  assert.equal(kind({ type: 'encounter', hunter, kind: 'confront', story: null }), 'aside', 'a hunter');
  assert.equal(kind({ type: 'inspector' }), 'aside', 'the police');
  assert.equal(kind({ type: 'missed', city: 'LON', svc, dep: S.t + 60, to: 'PAR' }), 'aside', 'a missed connection');
  assert.equal(kind({ type: 'end', why: 'home' }), 'aside', 'the end');
  assert.equal(kind({ type: 'news', rows: [] }), 'continue');
  assert.equal(kind({ type: 'arrive', city: 'LON', delay: 0 }), 'continue');
  assert.equal(kind({ type: 'late', delay: 40, at: 'PAR', next: 'x', svc, dep: S.t + 60 }), 'decline', 'a late train: sit back and hope');
  // an order's scene, a hunter's, a consequence: forced, whatever the scene
  const op = G.D.ops.find((o) => o.steps.some((x) => x.story));
  const scene = op.steps.find((x) => x.story).story;
  assert.equal(kind({ type: 'story', id: scene, op: op.id }), 'aside', 'an order\'s scene');
  const city = G.D.stories.filter((x) => x.at === 'city');
  assert.equal(kind({ type: 'story', id: city[0].id, hunter }), 'aside', 'a hunter\'s scene');
  assert.equal(kind({ type: 'story', id: city[0].id, later: true }), 'aside', 'a consequence');
  // a scene written with no way out stays; one with a way out closes
  assert.equal(kind({ type: 'story', id: 'ev.city.mar-pickpocket' }), 'aside', 'the pickpocket: no free choice');
  const forced = city.filter((x) => kind({ type: 'story', id: x.id }) === 'aside');
  const open = city.filter((x) => kind({ type: 'story', id: x.id }) === 'decline');
  assert.ok(open.length > forced.length, `most city scenes can be walked away from (${open.length} of ${city.length})`);
  for (const x of forced) {
    const v = top(G, { type: 'story', id: x.id });
    S.queue.length = 0;
    const opScene = x.choices.some((c) => [...(c.ok ?? []), ...(c.fail ?? [])].some((e) => e[0] === 'op'));
    const free = v.choices.some((c) => !c.std && c.afford !== false && !c.roll && !c.next && !c.cost);
    assert.ok(opScene || !free, `${x.id} is forced only for a reason`);
  }
});

test('walking away from a scene changes nothing but the queue', () => {
  const G = london();
  const S = G.S;
  const city = G.D.stories.filter((x) => x.at === 'city');
  let tried = 0;
  for (const x of city) {
    const v = top(G, { type: 'story', id: x.id });
    if (v.close !== 'decline') { S.queue.length = 0; continue; }
    const before = without(S, 'queue');
    assert.ok(decline(G), x.id);
    assert.deepEqual(without(S, 'queue'), before, `${x.id}: no effect`);
    assert.equal(S.queue.length, 0);
    if (++tried >= 12) break;
  }
  assert.ok(tried >= 12);
  // a forced card is not declined
  top(G, { type: 'inspector' });
  assert.equal(decline(G), false);
  assert.equal(S.queue[0].type, 'inspector');
  S.queue.length = 0;
  // a late train: sit back and hope
  const before = without(S, 'queue', 'cardN');
  top(G, { type: 'late', delay: 40, at: 'PAR', next: 'x', svc: G.D.services[0].id, dep: S.t + 60 });
  assert.ok(decline(G));
  assert.deepEqual(without(S, 'queue', 'cardN'), before);
});

test('walking away from the scene that came with lying low still ends the lying low', () => {
  const G = london();
  const S = G.S;
  const quiet = G.D.stories.filter((x) => x.at === 'interlude').find((x) => { const v = top(G, { type: 'story', id: x.id }); S.queue.length = 0; return v.close === 'decline'; });
  assert.ok(quiet, 'an interlude that can be walked away from');
  S.lyingLow = S.t + 600;
  top(G, { type: 'story', id: quiet.id });
  assert.ok(decline(G));
  assert.equal(S.lyingLow, null);
  assert.equal(S.busyUntil, S.t + 600, 'the quiet days run on');
});
