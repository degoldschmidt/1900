// The hunters move on the real timetable, coordinated from what the enemy believes (enemy.js), never from the truth.
// Roles each decision: the nearest hunter tracks the freshest sighting; another guards a leaked objective or watches
// a junction on its own ground between the sighting and London; the rest hold their home city.

import { hash } from './rng.js';
import { earliest, route, departuresFrom, delayOf, cancelled } from './timetable.js';

const HOUR = 60;

/** Cities reachable from `from` within `minutes` (true timetable), with arrival times. */
function reach(W, from, t, minutes) {
  const r = earliest(W, from, t, { horizon: Math.max(6 * HOUR, minutes) });
  return [...r.entries()].filter(([, v]) => v.t <= t + minutes).map(([c, v]) => ({ city: c, t: v.t }));
}

/** Where the enemy would look for the agent now: the sighting city while fresh, else the likeliest onward city. */
export function predict(E, W, t) {
  const B = E.belief;
  if (!B) return null;
  const age = t - B.t;
  if (age < 10 * HOUR) return B.city;
  const plan = E.plans.filter((p) => p.from <= t).at(-1);
  const opts = reach(W, B.city, B.t, Math.min(age, 3 * 24 * HOUR));
  let best = B.city, bw = -1;
  for (const o of opts) {
    const c = W.city.get(o.city);
    let w = (c.capital ? 1.6 : 1) + (o.city === 'LON' ? -.8 : 0) + (plan && plan.city === o.city ? 4 : 0);
    w *= 1 + .2 * hash(W.seed, 'pred', o.city, Math.floor(t / (6 * HOUR)));
    if (w > bw) { bw = w; best = o.city; }
  }
  return best;
}

/** One decision round for every active hunter. Mutates E.hunters. */
export function moveHunters(E, W, t) {
  const active = W.D.hunters.filter((h) => W.hunterActive(h, t));
  const target = predict(E, W, t);
  const plan = E.plans.filter((p) => p.from <= t && t - p.from < 4 * 24 * HOUR).at(-1);
  // who is nearest the target (by travel time)
  let tracker = null;
  if (target) {
    let bt = Infinity;
    for (const h of active) {
      const st = E.hunters[h.id];
      const from = st.leg ? st.leg.to : st.city, t0 = st.leg ? st.leg.arr : t;
      const r = earliest(W, from, t0, { horizon: 3 * 24 * HOUR });
      const at = r.get(target)?.t ?? Infinity;
      if (at < bt) { bt = at; tracker = h.id; }
    }
  }
  for (const h of active) {
    const st = E.hunters[h.id];
    if (st.leg && t >= st.leg.arr) { st.city = st.leg.to; st.leg = null; st.idleUntil = t + 3 * HOUR; }
    if (st.leg) continue;
    if (t < st.idleUntil) continue;
    let goal = h.start, role = 'watch';
    if (h.id === tracker && target) { goal = target; role = 'tail'; }
    else if (plan) { goal = plan.city; role = 'guard'; }
    else if (target) { goal = guardPoint(W, h, target, t) ?? h.start; role = 'watch'; }
    st.role = role; st.target = goal;
    if (goal === st.city) { st.idleUntil = t + 2 * HOUR; continue; }
    const r = earliest(W, st.city, t, { horizon: 3 * 24 * HOUR, usable: (dp) => usable(W, h, dp) });
    const legs = route(r, goal);
    if (!legs.length) { st.idleUntil = t + 4 * HOUR; continue; }
    const dp = legs[0];
    st.leg = { svc: dp.svc, key: dp.key, from: dp.from, to: dp.to, dep: dp.dep, arr: dp.arr + delayOf(W, dp) };
  }
  return E;
}

/** Hunters ride what runs; in wartime they ride military trains on their own ground too. */
function usable(W, h, dp) {
  const why = cancelled(W, dp);
  if (!why) return true;
  if (why === 'military') { const l = W.line.get(dp.line); return h.ground.includes(W.city.get(l.a).nation) || h.ground.includes(W.city.get(l.b).nation); }
  return false;
}

/** A city on the hunter's ground that the agent must pass between the predicted place and London, or the nearest ground city. */
function guardPoint(W, h, target, t) {
  const r = earliest(W, target, t, { horizon: 3 * 24 * HOUR });
  const legs = route(r, 'LON');
  for (const dp of legs) if (h.ground.includes(W.city.get(dp.to).nation) && dp.to !== target) return dp.to;
  for (const dp of legs) if (h.ground.includes(W.city.get(dp.from).nation)) return dp.from;
  return null;
}

/** Where a hunter is at t: a city, or on a leg (between). */
export function whereIs(E, id) {
  const st = E.hunters[id];
  return st.leg ? { moving: true, from: st.leg.from, to: st.leg.to, dep: st.leg.dep, arr: st.leg.arr, key: st.leg.key } : { moving: false, city: st.city };
}

export { departuresFrom };
