// Engine rules the design depends on: fairness, false trails, controls, determinism, save and reload.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T } from '../src/data/time.js';
import { newGame, makeGame, leave } from '../src/core/game.js';
import { newEnemy, learn, belief } from '../src/core/enemy.js';
import { moveHunters } from '../src/core/hunters.js';
import { advance, controlOdds } from '../src/core/sim.js';
import { buildWorld } from '../src/core/world.js';
import { play } from './bots/bots.mjs';

const W = buildWorld(D, 11);
const ctx = (W) => ({ W, D, covers: Object.fromEntries(D.covers.map((c) => [c.id, c])), papers: () => .7, ground: ['DE', 'AH'] });

test('the enemy knows only what reaches it: the same inbox gives the same mind wherever the player truly is', () => {
  const recs = [{ id: 1, kind: 'bribe', city: 'VIE', t: T('07-01 10.00'), cover: 'hale', fid: 1, arrives: T('07-01 20.00'), person: null }];
  const a = learn(newEnemy(D), recs, ctx(W), T('07-02 00.00'));
  const b = learn(newEnemy(D), recs, ctx(W), T('07-02 00.00'));
  moveHunters(a, W, T('07-02 00.00')); moveHunters(b, W, T('07-02 00.00'));
  assert.deepEqual(a, b);
  assert.equal(a.belief.city, 'VIE');
});

test('a false trail the timetable makes impossible is rejected and exposes the person who laid it', () => {
  const E = newEnemy(D);
  learn(E, [{ id: 1, kind: 'bribe', city: 'LIS', t: T('07-01 10.00'), cover: 'hale', fid: 1, arrives: T('07-01 12.00') }], ctx(W), T('07-01 12.00'));
  learn(E, [{ id: 2, kind: 'sighting', city: 'SPB', t: T('07-01 14.00'), cover: 'hale', fid: .7, arrives: T('07-01 16.00'), person: 'kowal', planted: true }], ctx(W), T('07-01 16.00'));
  assert.equal(E.planted[0].accepted, false);
  assert.ok(E.scepticism >= .25);
  assert.ok((E.assoc.kowal ?? 0) > .2);
});

test('repeated false trails lose force: scepticism only grows', () => {
  const E = newEnemy(D);
  let last = 0;
  for (let i = 0; i < 4; i++) {
    learn(E, [{ id: 10 + i, kind: 'sighting', city: 'ZUR', t: T('07-02 10.00') + i * 600, cover: 'weiss', fid: .7, arrives: T('07-02 12.00') + i * 600, person: 'amsler', planted: true }], ctx(W), T('07-02 12.00') + i * 600);
    E.planted.at(-1).accepted && (E.planted.at(-1).exposed = false);
    learn(E, [{ id: 20 + i, kind: 'frontier', city: 'LIS', t: T('07-02 11.00') + i * 600, cover: 'weiss', fid: 1, arrives: T('07-02 13.00') + i * 600 }], ctx(W), T('07-02 13.00') + i * 600);
    assert.ok(E.scepticism >= last);
    last = E.scepticism;
  }
});

test('controls only grow stricter with tension, alerts and enemy-alien status', () => {
  const G = makeGame(D, newGame(D, { seed: 3 }));
  const x = { id: 'AVR', name: 'Avricourt', from: 'FR', into: 'DE' };
  const peace = controlOdds(G, x, { t: T('07-01 12.00'), cls: 2 });
  const war = controlOdds(G, x, { t: T('08-04 12.00'), cls: 2 });
  assert.ok(war.papers >= peace.papers && war.search >= peace.search);
  G.S.enemy.dossiers.hale = { susp: 1, name: true, alerts: ['DE', 'AH'], seen: [], checked: true };
  const alerted = controlOdds(G, x, { t: T('07-01 12.00'), cls: 2 });
  assert.equal(alerted.papers, 1);
  assert.ok(alerted.alert);
});

test('a campaign is a function of its seed and choices', () => {
  const run = () => { const G = makeGame(D, newGame(D, { seed: 4242, sex: 'f' })); play(G, 'competent', 3000); return JSON.stringify(G.S); };
  assert.equal(run(), run());
});

test('a save mid-journey resumes to the same end', () => {
  const G = makeGame(D, newGame(D, { seed: 99 }));
  play(G, 'careless', 400);
  const saved = JSON.parse(JSON.stringify(G.S));
  const G2 = makeGame(D, saved);
  play(G, 'careless'); play(G2, 'careless');
  assert.equal(JSON.stringify(G.S), JSON.stringify(G2.S));
});

test('a record reaches the enemy only after the local delay', () => {
  const G = makeGame(D, newGame(D, { seed: 5 }));
  const r = leave(G, 'register', .6);
  assert.ok(r.arrives > G.S.t + 60);
  advance(G, r.arrives - 1);
  assert.equal(!!r.read, false);
});
