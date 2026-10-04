// The world over time: the calendar's effects resolved into queries. Built once per campaign from the data and the seed;
// pure afterwards (every query takes the time). Fictional disruptions happen or not by hash(seed).

import { T, DAY } from '../data/time.js';
import { hash } from './rng.js';

export const ACT2 = T('07-13 00.00');
export const ACT3 = T('07-26 00.00');
export const END = T('08-05 06.00');
export const actAt = (t) => (t < ACT2 ? 1 : t < ACT3 ? 2 : 3);

const at = (s) => (s === null || s === undefined ? null : T(s));

export function buildWorld(D, seed) {
  const nation = new Map(D.nations.map((n) => [n.id, n]));
  const city = new Map(D.cities.map((c) => [c.id, c]));
  const line = new Map(D.lines.map((l) => [l.id, l]));
  const service = new Map(D.services.map((s) => [s.id, s]));
  const frontierLines = new Map(); // frontier id → line ids
  for (const l of D.lines) for (const f of l.frontiers) { if (!frontierLines.has(f.id)) frontierLines.set(f.id, []); frontierLines.get(f.id).push(l.id); }

  // calendar rows that happen in this campaign, in time order
  const rows = D.calendar.filter((r) => r.fact || hash(seed, 'cal', r.id) < r.p).map((r) => ({ ...r, t: T(r.at), until: at(r.until) })).sort((a, b) => a.t - b.t);
  const fx = [];
  for (const r of rows) for (const e of r.fx) fx.push({ row: r.id, t: r.t, until: r.until, name: e[0], a: e.slice(1) });

  const live = (e, t) => e.t <= t && (e.until === null || t < e.until);

  const byCity = new Map();
  for (const s of D.services) for (const c of Object.keys(s.dep)) { if (!byCity.has(c)) byCity.set(c, []); byCity.get(c).push(s); }
  const W = {
    D, seed, rows, nation, city, line, service, frontierLines,
    servicesFrom: (c) => byCity.get(c) ?? [],
    act: actAt,
    /** peace, tension or war for a nation at t. */
    state(n, t) {
      let s = 'peace';
      for (const e of fx) if (e.name === 'state' && e.a[0] === n && live(e, t)) s = e.a[1];
      if (s !== 'war' && fx.some((e) => e.name === 'war' && (e.a[0] === n || e.a[1] === n) && live(e, t))) s = 'war';
      return s;
    },
    atWar(a, b, t) { return fx.some((e) => e.name === 'war' && live(e, t) && ((e.a[0] === a && e.a[1] === b) || (e.a[0] === b && e.a[1] === a))); },
    /** The bloc of a nation at t: its data bloc, or neutral once declared. */
    bloc(n, t) { return fx.some((e) => e.name === 'neutral' && e.a[0] === n && live(e, t)) ? 'neutral' : nation.get(n)?.bloc ?? 'neutral'; },
    /** Extra control intensity at a frontier station (its own boost plus the nation it leads into). */
    control(fid, into, t) {
      let c = 0;
      for (const e of fx) if (e.name === 'control' && live(e, t) && (e.a[0] === into || e.a[0] === `frontier:${fid}`)) c += e.a[1];
      return c;
    },
    /** Multiplier on record delays in a nation. */
    lag(n, t) { let m = 1; for (const e of fx) if (e.name === 'lag' && e.a[0] === n && live(e, t)) m *= e.a[1]; return m; },
    /** Are nationals of `nat` enemy aliens in `inNation` at t? */
    alien(nat, inNation, t) { return fx.some((e) => e.name === 'alien' && e.a[0] === nat && e.a[1] === inNation && live(e, t)); },
    credit(t) { let c = true; for (const e of fx) if (e.name === 'credit' && live(e, t)) c = e.a[0]; return c; },
    hunterActive(h, t) {
      let on = t >= T(h.from);
      for (const e of fx) if (e.name === 'hunter' && e.a[0] === h.id && e.t <= t) on = e.a[1];
      return on;
    },
    price(item, c, t) { let m = 1; for (const e of fx) if (e.name === 'price' && e.a[0] === item && e.a[1] === c && live(e, t)) m *= e.a[2]; return m; },
    /** Suspensions in force: is this departure of service s (from the a or b end) cancelled at t? */
    suspended(s, t) {
      const l = line.get(s.line);
      for (const e of fx) {
        if (e.name !== 'suspend') continue;
        const from = e.a[1] === null ? e.t : T(e.a[1]), until = e.a[2] === null ? (e.until ?? Infinity) : T(e.a[2]);
        if (t < from || t >= until) continue;
        const [k, v] = e.a[0].split(/:(.*)/s);
        if (k === 'service' && v === s.id) return e.row;
        if (k === 'line' && v === s.line) return e.row;
        if (k === 'frontier' && l.frontiers.some((f) => f.id === v)) return e.row;
        if (k === 'border') { const [x, y] = v.split('-'); if (l.frontiers.some((f) => (f.from === x && f.into === y) || (f.from === y && f.into === x))) return e.row; }
      }
      return null;
    },
    /** Rows whose headline is public news at t (facts and fictions that happened), newest first. */
    news(t) { return rows.filter((r) => r.t <= t).reverse(); },
    /** Rows rumoured at t: their rumour lead has begun but they have not happened. */
    rumours(t) { return rows.filter((r) => r.rumourLeadH && r.t > t && r.t - r.rumourLeadH * 60 <= t); },
    /** Hours before a record made in city c at t reaches the enemy. */
    lagH(c, t) {
      const n = city.get(c)?.nation;
      const N = nation.get(n);
      if (!N) return 24;
      return N.lagH[this.state(n, t)] * this.lag(n, t);
    },
    day: (t) => Math.floor(t / DAY),
  };
  return W;
}
