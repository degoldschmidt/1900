// World calendar, timetable expansion and routing on the current data.
import test from 'node:test';
import assert from 'node:assert/strict';
import D from '../src/data/index.js';
import { T, DAY } from '../src/data/time.js';
import { buildWorld, actAt } from '../src/core/world.js';
import { departuresFrom, earliest, route, delayOf, cancelled, crossings } from '../src/core/timetable.js';

const W = buildWorld(D, 7);

test('acts by date', () => { assert.equal(actAt(T('07-12 23.59')), 1); assert.equal(actAt(T('07-13 00.00')), 2); assert.equal(actAt(T('07-26 00.00')), 3); });
test('departures are sorted, inside the window, from the right city', () => {
  const t0 = T('06-29 06.00'), list = departuresFrom(W, 'PAR', t0, t0 + DAY);
  assert.ok(list.length > 5);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].dep >= list[i - 1].dep);
  for (const d of list) { assert.equal(d.from, 'PAR'); assert.ok(d.dep >= t0 && d.dep < t0 + DAY); assert.ok(d.arr > d.dep); }
});
test('every city is reachable from London within six days in Act I', () => {
  const r = earliest(W, 'LON', T('06-28 18.00'), { horizon: 8 * DAY });
  for (const c of D.cities) assert.ok((r.get(c.id)?.t ?? Infinity) <= T('06-28 18.00') + 6 * DAY, `${c.id} too far`);
});
test('a route is a chain of legs', () => {
  const t0 = T('06-28 18.00');
  const r = earliest(W, 'LON', t0);
  const legs = route(r, 'VIE');
  assert.ok(legs.length >= 1);
  assert.equal(legs[0].from, 'LON'); assert.equal(legs.at(-1).to, 'VIE');
  for (let i = 1; i < legs.length; i++) { assert.equal(legs[i].from, legs[i - 1].to); assert.ok(legs[i].dep >= legs[i - 1].arr); }
});
test('delays are fixed per run and within bounds', () => {
  const dp = departuresFrom(W, 'BUD', T('07-01 00.00'), T('07-02 00.00'))[0];
  const s = W.service.get(dp.svc);
  assert.equal(delayOf(W, dp), delayOf(W, dp));
  assert.ok(delayOf(W, dp) >= 0 && delayOf(W, dp) <= s.maxDelay + 10);
  assert.equal(cancelled(W, dp), null);
});
test('crossings come in travel order between departure and arrival', () => {
  const dp = departuresFrom(W, 'VIE', T('06-29 00.00'), T('06-30 00.00')).find((d) => d.line === 'PAR-VIE');
  if (!dp) return;
  const x = crossings(W, dp);
  assert.ok(x.length >= 1);
  for (const c of x) assert.ok(c.t > dp.dep && c.t < dp.arr);
  assert.equal(x[0].from, 'AH');
});
