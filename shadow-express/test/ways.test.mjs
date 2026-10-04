// Approaches in an operation are tried once: a scene that does not finish the step still spends the way.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T } from '../src/data/time.js';
import { newGame, makeGame } from '../src/core/game.js';
import { opActions, doWay, cardView, choose } from '../src/core/actions.js';
import { defaultHero } from '../src/core/hero.js';

function optics() {
  const G = makeGame(D, newGame(D, { seed: 5, hero: defaultHero('m') }));
  const { S } = G;
  S.queue.length = 0;
  S.cover = 'weiss'; S.covers.weiss.carried = true;
  S.city = 'VIE'; S.journey = null; S.booked = null; S.t = T('07-07 10.00'); S.busyUntil = S.t; S.money = 40;
  Object.assign(S.ops['op-optics'], { status: 'active', started: T('07-03 09.00'), done: { reach: 1, case: 1 } });
  return G;
}
const way = (G, id) => opActions(G).find((a) => a.op.id === 'op-optics')?.ways.find((v) => v.way.id === id);

test('an approach whose scene leaves the step open cannot be taken again', () => {
  const G = optics();
  assert.ok(way(G, 'visit')?.open, 'the sales call is open to a Swiss traveller on a weekday morning');
  assert.ok(doWay(G, 'op-optics', 'visit'));
  assert.equal(cardView(G).story.id, 'op-optics.visit');
  const i = cardView(G).choices.findIndex((c) => /Take an order/.test(c.label));
  assert.ok(i >= 0);
  const money = G.S.money, legend = G.S.legend?.['VIE|weiss'] ?? 0;
  assert.ok(choose(G, i));
  assert.equal(G.S.money, money + 4, 'the order pays once');
  assert.ok((G.S.legend['VIE|weiss'] ?? 0) > legend);
  G.S.queue.length = 0;
  assert.ok(!G.S.ops['op-optics'].done.photo, 'the step is still open');
  const v = way(G, 'visit');
  assert.ok(v.tried && !v.open, 'the sales call is shut');
  assert.equal(doWay(G, 'op-optics', 'visit'), false, 'and cannot be repeated for another £4');
  assert.equal(G.S.money, money + 4);
});

test('another approach is still available after one is spent', () => {
  const G = optics();
  doWay(G, 'op-optics', 'visit'); G.S.queue.length = 0;
  const open = opActions(G).find((a) => a.op.id === 'op-optics').ways.filter((v) => v.open && v.afford);
  assert.ok(open.length >= 1, `ways left: ${open.map((v) => v.way.id)}`);
});

test('every operation step keeps two approaches that need no contact', () => {
  for (const o of D.ops) for (const st of o.steps) {
    if (!st.ways || st.key === false) continue;
    const free = st.ways.filter((x) => !/"(st|trust|loyal)"/.test(JSON.stringify(x.if ?? []))).length;
    assert.ok(free >= 2, `${o.id}/${st.id}: ${free}`);
  }
});
