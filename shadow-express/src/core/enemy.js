// The enemy's knowledge: a pure function of its own state, the records delivered to it, the data and the time.
// It never sees where the player really is. Co-location (encounters) is decided in sim.js with the truth;
// recognition there uses only what this module knows (a name, a description, a photograph).

import { hash } from './rng.js';
import { earliest } from './timetable.js';

/** How suspicious a kind of record is in itself (fidelity scales it). Routine records only place a name somewhere. */
export const HEAT = { register: 0, frontier: 0, berth: 0, list: 0, wire: .12, sighting: .2, bribe: .45, meeting: .35, photo: .6 };
/** How much a record tells about the body (description). */
const DESC = { sighting: .25, meeting: .3, photo: 1, bribe: .2, frontier: .08, register: .02, berth: .05 };

export const SUSPECT = .3; // the trail of a cover this suspect is followed
export const ALERT = .55;  // a name this suspect is posted on frontier alerts

export function newEnemy(D) {
  const hunters = {};
  for (const h of D.hunters) hunters[h.id] = { city: h.start, leg: null, role: 'watch', target: h.start, idleUntil: 0 };
  return { dossiers: {}, desc: 0, photo: false, links: [], assoc: {}, scepticism: 0, plans: [], belief: null, planted: [], hunters, read: 0, checks: [], talk: [], voice: {}, log: [] };
}

const dossier = (E, c) => (E.dossiers[c] ??= { susp: 0, name: false, alerts: [], seen: [], checked: false });

/** Covers the enemy believes are one person with c (by links). */
export function linked(E, c) {
  const out = new Set([c]);
  for (let grow = true; grow;) { grow = false; for (const [a, b] of E.links) { if (out.has(a) && !out.has(b)) { out.add(b); grow = true; } if (out.has(b) && !out.has(a)) { out.add(a); grow = true; } } }
  return [...out];
}

/** Is the agent able to get from (city a, time ta) to city b by time tb on the real timetable? */
function feasible(W, a, ta, b, tb) {
  if (a === b) return true;
  if (tb <= ta) return false;
  const r = earliest(W, a, ta, { horizon: Math.min(4 * 1440, tb - ta + 60) });
  return (r.get(b)?.t ?? Infinity) <= tb;
}

/**
 * Learn from records that have arrived. `ctx` = { W, D, covers: id → cover data }.
 * Mutates and returns E. Deterministic: chance comes from hash(seed, …).
 */
export function learn(E, records, ctx, t) {
  const { W } = ctx;
  for (const r of records) {
    if (r.planted) { plant(E, r, ctx, t); continue; }
    if (r.kind === 'calm') { const d = dossier(E, r.cover); if (!d.name) d.susp = Math.max(0, d.susp - r.fid); continue; } // a story that holds
    if (r.kind === 'link') { E.links.push([r.cover, r.other]); note(E, t, `links ${r.cover} and ${r.other}`); continue; }
    if (r.kind === 'plan') { E.plans.push({ op: r.op, city: r.city, conf: r.fid, from: r.t }); note(E, t, `learns of a plan at ${r.city}`); continue; }
    if (r.kind === 'talk') { // an arrested contact gives up a cover or an associate
      if (r.cover) { const d = dossier(E, r.cover); d.susp = Math.max(d.susp, ALERT); d.name = true; }
      if (r.person) E.assoc[r.person] = Math.min(1, (E.assoc[r.person] ?? 0) + .5);
      continue;
    }
    const heat = (r.heat ?? HEAT[r.kind] ?? 0) * r.fid;
    E.desc = Math.min(1, E.desc + (DESC[r.kind] ?? 0) * r.fid * (r.kind === 'photo' ? 1 : .6) * (E.descMul ?? 1));
    if (r.kind === 'photo' && r.fid > .6) E.photo = true;
    if (r.person) E.assoc[r.person] = Math.min(1, (E.assoc[r.person] ?? 0) + r.fid * .45);
    if (!r.cover) continue;
    const d = dossier(E, r.cover);
    // a known suspect's routine records add a little; a clean name's routine records add nothing
    d.susp = Math.min(1, d.susp + heat * (d.susp >= SUSPECT ? 1.2 : 1));
    d.seen.push({ city: r.city, t: r.t, fid: r.fid, kind: r.kind });
    if (d.seen.length > 24) d.seen.shift();
    if (d.susp >= SUSPECT && !d.checked) { d.checked = true; E.checks.push({ cover: r.cover, at: r.arrives + (ctx.covers[r.cover]?.backstopH ?? 48) * 60 }); }
    if (d.susp >= ALERT && !d.name) { d.name = true; note(E, t, `posts the name of ${r.cover}`); }
    // a genuine sighting fresher than a planted belief exposes the plant
    for (const p of E.planted) if (p.accepted && !p.exposed && linked(E, r.cover).includes(p.cover) && r.t > p.t - 120 && r.city !== p.city && !feasible(W, p.city, p.t, r.city, r.t)) exposePlant(E, p, t);
  }
  // legends checked by letter: a poor one fails and the name is posted
  for (const c of E.checks.filter((x) => !x.done && x.at <= t)) {
    c.done = true;
    const d = dossier(E, c.cover), q = ctx.papers(c.cover);
    if (hash(W.seed, 'backstop', c.cover, c.at) > q) { d.name = true; d.susp = Math.max(d.susp, ALERT); note(E, t, `finds the legend of ${c.cover} false`); }
    else d.susp = Math.max(0, d.susp - .1);
  }
  for (const d of Object.values(E.dossiers)) d.alerts = d.name ? ctx.ground : [];
  E.belief = belief(E);
  return E;
}

function note(E, t, text) { E.log.push({ t, text }); if (E.log.length > 60) E.log.shift(); }

function exposePlant(E, p, t) {
  p.exposed = true;
  E.scepticism = Math.min(1, E.scepticism + .25);
  if (p.via) E.assoc[p.via] = Math.min(1, (E.assoc[p.via] ?? 0) + .3);
  note(E, t, `sees through a false trail at ${p.city}`);
}

/** A false trail laid through a person: rejected if impossible against a fresher sighting, else believed at 1 − scepticism. */
function plant(E, r, ctx, t) {
  const p = { id: r.id, cover: r.cover, city: r.city, t: r.t, via: r.person, accepted: false, exposed: false };
  E.planted.push(p);
  const fresh = linked(E, r.cover).flatMap((c) => E.dossiers[c]?.seen ?? []).filter((s) => s.t <= r.t).sort((a, b) => b.t - a.t)[0];
  if (fresh && !feasible(ctx.W, fresh.city, fresh.t, r.city, r.t)) { exposePlant(E, p, t); return; }
  if (hash(ctx.W.seed, 'plant', r.id) < 1 - E.scepticism) {
    p.accepted = true;
    const d = dossier(E, r.cover);
    d.seen.push({ city: r.city, t: r.t, fid: .7, kind: 'sighting', planted: true });
    d.susp = Math.max(d.susp, SUSPECT);
    note(E, t, `believes ${r.cover} is at ${r.city}`);
  }
  if (r.person) E.assoc[r.person] = Math.min(1, (E.assoc[r.person] ?? 0) + .15);
}

/** Where the enemy thinks the agent is: the freshest sighting of any suspected cover, with its age. */
export function belief(E) {
  let best = null;
  for (const [c, d] of Object.entries(E.dossiers)) {
    if (d.susp < SUSPECT && !d.name) continue;
    for (const s of d.seen) {
      const p = s.planted ? E.planted.find((x) => x.cover === c && x.t === s.t && x.city === s.city) : null;
      if (p && p.exposed) continue;
      if (!best || s.t > best.t) best = { city: s.city, t: s.t, cover: c, planted: !!s.planted };
    }
  }
  return best;
}

/** Hunters notice when a hunt at a planted place comes to nothing for long enough. */
export function emptyHunt(E, city, t) {
  for (const p of E.planted) if (p.accepted && !p.exposed && p.city === city && t - p.t > 12 * 60) exposePlant(E, p, t);
}

/** Every day: a name that is not yet posted fades a little from the enemy's mind when nothing new comes in. */
export function quietDay(E) {
  for (const d of Object.values(E.dossiers)) if (!d.name) d.susp = Math.max(0, d.susp - QUIET);
}
export const QUIET = .02;

/** Lie-low decay: suspicion cools a little, old sightings go stale. */
export function cool(E, factor) {
  for (const d of Object.values(E.dossiers)) if (!d.name) d.susp *= factor;
  E.desc *= (1 + factor) / 2;
}
