// Services expanded into dated departures; the true delay and cancellation of each run; frontier crossing times;
// earliest-arrival routing. Truth lives here; what the player believes is filtered in sim.js (known disruptions).

import { DAY, clock } from '../data/time.js';
import { hash } from './rng.js';

export const CHANGE = 20; // minutes to change trains in the same city

/** Polyline of a line a→b in [lon, lat], with cumulative km. */
function course(W, l) {
  if (l._course) return l._course;
  const pts = [W.city.get(l.a).ll, ...l.via, W.city.get(l.b).ll];
  const km = [0];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]], k = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
    km.push(km[i - 1] + Math.hypot((a[0] - b[0]) * 111.32 * k, (a[1] - b[1]) * 110.57));
  }
  const fr = l.frontiers.map((f) => { // fraction of the way a→b at which the station lies
    let best = Infinity, at = 0;
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1], pts[i]], k = Math.cos(f.ll[1] * Math.PI / 180);
      const ax = a[0] * 111.32 * k, ay = a[1] * 110.57, bx = b[0] * 111.32 * k, by = b[1] * 110.57, px = f.ll[0] * 111.32 * k, py = f.ll[1] * 110.57;
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, u = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
      const d = Math.hypot(px - ax - u * dx, py - ay - u * dy);
      if (d < best) { best = d; at = km[i - 1] + u * (km[i] - km[i - 1]); }
    }
    return at / km[km.length - 1];
  });
  Object.defineProperty(l, '_course', { value: { pts, km, total: km[km.length - 1], fr }, enumerable: false });
  return l._course;
}
export const lineCourse = course;

/** Does service s run on day d (day 0 = Sunday 28 June)? */
const runs = (s, d) => s.days === '*' || s.days.includes(String(((d % 7) + 7) % 7));

/** Departures from city c on day d (scheduled), cached on the world. */
function daily(W, c, d) {
  W._daily ??= new Map();
  const k = `${c}|${d}`;
  let out = W._daily.get(k);
  if (out) return out;
  out = [];
  for (const s of W.servicesFrom(c)) {
    if (!runs(s, d)) continue;
    const l = W.line.get(s.line);
    const to = l.a === c ? l.b : l.a;
    for (const hm of s.dep[c]) out.push(departure(W, s, c, to, d * DAY + clock(hm)));
  }
  out.sort((a, b) => a.dep - b.dep);
  W._daily.set(k, out);
  return out;
}

/** Every departure of every service from city c with dep in [t0, t1), scheduled times. */
export function departuresFrom(W, c, t0, t1) {
  const out = [];
  for (let d = Math.floor(t0 / DAY); d <= Math.floor((t1 - 1) / DAY); d++) for (const dp of daily(W, c, d)) if (dp.dep >= t0 && dp.dep < t1) out.push(dp);
  return out;
}

export function departure(W, s, from, to, dep) {
  const dur = Math.round(s.hours * 60);
  return { key: `${s.id}|${from}|${dep}`, svc: s.id, line: s.line, kind: s.kind, from, to, dep, arr: dep + dur, dur };
}

/** True delay of a run in minutes: on time with chance punct, otherwise up to maxDelay; worse in Act III. */
export function delayOf(W, dp) {
  const s = W.service.get(dp.svc);
  const u = hash(W.seed, 'delay', dp.key);
  let d = u < s.punct ? Math.floor(hash(W.seed, 'late', dp.key) * 9) : Math.round(s.maxDelay * Math.pow((u - s.punct) / (1 - s.punct), 1.5));
  if (W.act(dp.dep) === 3) d = Math.round(d * 1.6 + 20 * hash(W.seed, 'mob', dp.key));
  return d;
}

/** Why a run does not go: a calendar row id, 'military' (half the services cut on lines in a nation at war), or null. */
export function cancelled(W, dp) {
  const s = W.service.get(dp.svc);
  const row = W.suspended(s, dp.dep);
  if (row) return row;
  if (s.kind !== 'path') {
    const l = W.line.get(s.line);
    const nats = new Set([W.city.get(l.a).nation, W.city.get(l.b).nation, ...l.frontiers.map((f) => f.into)]);
    for (const n of nats) if (W.state(n, dp.dep) === 'war' && hash(W.seed, 'mil', dp.key) < .5) return 'military';
  }
  return null;
}

/** Frontier crossings of a departure in travel order: [{ id, name, from, into, t }] at scheduled times plus delay share. */
export function crossings(W, dp, delay = 0) {
  const l = W.line.get(dp.line);
  const c = course(W, l);
  const fwd = dp.from === l.a;
  const list = l.frontiers.map((f, i) => {
    const frac = fwd ? c.fr[i] : 1 - c.fr[i];
    return { id: f.id, name: f.name, ll: f.ll, from: fwd ? f.from : f.into, into: fwd ? f.into : f.from, t: Math.round(dp.dep + frac * (dp.dur + delay)) };
  });
  return fwd ? list : list.reverse();
}

/**
 * Earliest arrival at every city from `from`, leaving no earlier than t.
 * opts: { horizon (min), usable(dp) → bool, cost(dp) → extra minutes-equivalent, change (min) }.
 * Returns Map city → { t (arrival), cost, prev: { city, dp } | null }.
 */
export function earliest(W, from, t, opts = {}) {
  const horizon = opts.horizon ?? 4 * DAY, change = opts.change ?? CHANGE;
  const best = new Map([[from, { t, cost: 0, prev: null }]]);
  const done = new Set();
  const cache = new Map();
  const deps = (c, t0) => { // departures from c in the remaining horizon, cached per city
    if (!cache.has(c)) cache.set(c, departuresFrom(W, c, t, t + horizon));
    return cache.get(c).filter((d) => d.dep >= t0);
  };
  for (;;) {
    let cur = null;
    for (const [c, v] of best) if (!done.has(c) && (!cur || v.cost < best.get(cur).cost)) cur = c;
    if (!cur) break;
    done.add(cur);
    const here = best.get(cur);
    const ready = cur === from ? here.t : here.t + change;
    const seenSvc = new Set();
    for (const dp of deps(cur, ready)) {
      if (done.has(dp.to)) continue;
      const k = `${dp.svc}|${dp.to}`;
      if (seenSvc.has(k)) continue; // the first run of each service to each place dominates later runs of it
      if (opts.usable && !opts.usable(dp)) continue;
      seenSvc.add(k);
      const arr = dp.arr;
      const cost = here.cost + (arr - here.t) + (opts.cost ? opts.cost(dp) : 0);
      const old = best.get(dp.to);
      if (!old || cost < old.cost) best.set(dp.to, { t: arr, cost, prev: { city: cur, dp } });
    }
  }
  return best;
}

/** The legs from the search result to a destination, in order. */
export function route(result, to) {
  const legs = [];
  let c = to;
  while (result.get(c)?.prev) { const p = result.get(c).prev; legs.unshift(p.dp); c = p.city; }
  return legs;
}
