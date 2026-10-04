// Bot players for balancing. Each policy answers cards and chooses what to do in a city; play() runs a whole campaign.
//   careless: next train toward the order, one cover, first choice, hotels, never checks for a tail.
//   competent: safest route when there is slack, rotates and stashes covers, safe houses, checks tails, scores choices.
//   exploit-*: one trick spammed (third class only, bribe everything, plant false trails, never sleep in hotels).

import { advance } from '../../src/core/sim.js';
import { board, book, bookTrip, plan, cardView, choose, walk, opActions, doWay, canLieLow, lieLow, wireFunds, switchCover, stash, checkTail, shakeTail, setLodging, safehouseHere, contactsHere, seek, passDays, doActivity } from '../../src/core/actions.js';
import { legendOf, stayDays } from '../../src/core/residence.js';
import { currentStep, stepCities, activeOps } from '../../src/core/ops.js';
import { T } from '../../src/data/time.js';
import { rand } from '../../src/core/rng.js';
import { carriedCovers, contraband, hasUse } from '../../src/core/game.js';

const HOUR = 60;

/** Where the current step of the most urgent active op wants the player. */
function target(G) {
  const { S, I } = G;
  let best = null;
  for (const o of activeOps(G)) {
    const st = currentStep(G, o.id);
    if (!st) continue;
    let cities = stepCities(st);
    if (st.kind === 'meet') cities = [st.city ?? I.person.get(st.person).city].flat().filter(Boolean);
    if (st.kind === 'carry' && !S.case.some((x) => x.id === st.item)) continue;
    if (!cities.length || cities[0] === '*') continue;
    const by = st.by ? T(st.by) : Infinity;
    if (!best || by < best.by) best = { op: o, step: st, cities, by, after: st.after ? T(st.after) : 0 };
  }
  return best;
}

/** Score a data choice by its visible effects (what a careful reader of the sub-text would infer). */
function score(c) {
  let s = 0;
  const eff = [...(c.ok ?? [])];
  for (const e of eff) {
    if (e[0] === 'standing') s += e[1] * .8;
    if (e[0] === 'money') s += e[1] * .3;
    if (e[0] === 'nerve') s += e[1] * .6;
    if (e[0] === 'trust') s += e[2] * 1.2;
    if (e[0] === 'record') s -= 2 * e[2];
    if (e[0] === 'susp') s -= 6 * e[2];
    if (e[0] === 'expose') s -= 2;
    if (e[0] === 'intel') s += .8;
    if (e[0] === 'item') s += e[1][0] === '+' ? 1 : -1;
    if (e[0] === 'st' && e[2] === 'recruited') s += 3;
    if (e[0] === 'op') s += 4;
    if (e[0] === 'cover') s += 3;
    if (e[0] === 'papers') s += e[2] * 4;
  }
  if (c.cost?.money) s -= c.cost.money * .3;
  if (c.roll) s *= c.roll.p;
  if (c.next) s += .5;
  return s;
}

export const POLICIES = {
  careless: {
    card(G, v) { return v.choices.findIndex((c) => c.open && c.afford !== false); },
    city(G) { return goTo(G, 'fastest', 2) || idle(G, false); },
    way: (ways) => ways.find((w) => w.open && w.afford),
  },
  competent: {
    start(G) { for (const c of carriedCovers(G)) if (c !== G.S.cover) stash(G, c); },
    card(G, v) {
      const { S } = G;
      const open = v.choices.map((c, i) => ({ c, i })).filter((x) => x.c.open && x.c.afford !== false);
      if (v.card.type === 'control') {
        const by = (k) => open.find((x) => x.c.std === k);
        if (v.card.search && contraband(G).length && !hasUse(G, 'lining') && !hasUse(G, 'pouch')) return (by('bribe') ?? by('declare') ?? open[0]).i;
        if (v.card.alert || v.card.alien) return (by('bribe') ?? by('talk') ?? open[0]).i;
        return (by('pouch') ?? by('papers') ?? open[0]).i;
      }
      if (v.card.type === 'encounter') {
        const named = !!G.S.enemy.dossiers[S.cover]?.name; // a careful agent assumes the worst once traced
        const by = (k) => open.find((x) => x.c.std === k);
        return ((named ? by('porter') ?? by('slip') : by('brazen')) ?? open[0]).i;
      }
      if (v.card.type === 'inspector') { const by = (k) => open.find((x) => x.c.std === k); return ((legendOf(G) >= .45 ? by('answer') : by('papers')) ?? open[0]).i; }
      if (v.card.type === 'missed') return (open.find((x) => x.c.std === 'reroute') ?? open[0]).i;
      if (!open.length) return -1;
      return open.reduce((a, b) => (score(b.c) > score(a.c) ? b : a)).i;
    },
    city(G) {
      const { S } = G;
      // a cover that has left too many sharp traces is retired
      const heat = S.records.filter((r) => r.cover === S.cover && S.t - r.t < 5 * 24 * HOUR).reduce((a, r) => a + (r.heat ?? (r.kind === 'bribe' ? .45 : r.kind === 'sighting' ? .2 : 0)) * r.fid, 0);
      if (heat > .45) { const alt = Object.entries(S.covers).find(([id, c]) => id !== S.cover && !c.burned && (c.carried || c.stash === S.city)); if (alt) { if (!alt[1].carried) { alt[1].carried = true; alt[1].stash = null; } if (switchCover(G, alt[0]).ok) { stash(G, Object.keys(S.covers).find((k) => k !== S.cover && S.covers[k].carried) ?? ''); return true; } } }
      if (S.stats.nearMisses > (S._nm ?? 0)) { S._nm = S.stats.nearMisses; if (checkTail(G) && S.tailedBy) shakeTail(G); return true; }
      if (safehouseHere(G)) setLodging(G, 'safehouse');
      else if (S.lodging?.city !== S.city) setLodging(G, 'pension');
      const tg = target(G);
      const slack = tg ? tg.by - S.t : Infinity;
      return goTo(G, slack > 30 * HOUR ? 'safest' : 'fastest', null) || idle(G, true);
    },
    way: (ways) => ways.filter((w) => w.open && w.afford).sort((a, b) => a.risk + (a.way.cost?.money ?? 0) / 60 - (b.risk + (b.way.cost?.money ?? 0) / 60))[0],
  },
  'exploit-third': {
    card: (G, v) => v.choices.findIndex((c) => c.open && c.afford !== false),
    city(G) { return goTo(G, 'cheapest', 3) || idle(G, false); },
    way: (ways) => ways.find((w) => w.open && w.afford),
  },
  'exploit-bribe': {
    card(G, v) { const i = v.choices.findIndex((c) => c.std === 'bribe' && c.afford !== false); return i >= 0 ? i : v.choices.findIndex((c) => c.open && c.afford !== false); },
    city(G) { return goTo(G, 'fastest', 2) || idle(G, false); },
    way: (ways) => ways.find((w) => w.open && w.afford),
  },
  'exploit-rough': {
    card: (G, v) => v.choices.findIndex((c) => c.open && c.afford !== false),
    city(G) { setLodging(G, 'rough'); return goTo(G, 'fastest', 2) || idle(G, false); },
    way: (ways) => ways.find((w) => w.open && w.afford),
  },
};

/** Take the first leg toward the current target, by an itinerary kind; or act if already there. */
function goTo(G, kind, cls) {
  const { S } = G;
  for (const a of opActions(G)) {
    if (a.closed) continue;
    const w = G.policy.way(a.ways);
    if (w && doWay(G, a.op.id, w.way.id)) return true;
  }
  const tg = target(G);
  if (!tg) return false;
  if (tg.cities.includes(S.city)) {
    if (S.t < tg.after) { advance(G, Math.min(tg.after, S.t + 6 * HOUR)); return true; }
    if (tg.step.kind === 'meet' || tg.step.kind === 'act') { const a = opActions(G).find((x) => x.op.id === tg.op.id); if (a && a.closed) { advance(G, S.t + HOUR); return true; } }
    return false;
  }
  let best = null;
  for (const c of tg.cities) for (const it of plan(G, c)) if (!best || score2(it, kind) < score2(best, kind)) best = it;
  if (!best) return false;
  if (best.legs.length > 1 && G.policy !== POLICIES.careless) {
    const want = cls ?? G.I.cover.get(S.cover)?.cls ?? 2;
    for (const c of [want, 2, 3, 1]) {
      const r = bookTrip(G, best, c);
      if (r.ok) { advance(G, best.legs[0].dep + 1); return true; }
      if (/afford/.test(r.why ?? '')) { if (!wireFunds(G)) break; }
    }
  }
  const leg = best.legs[0];
  const row = board(G, 96).find((r) => r.dp.key === leg.key);
  if (!row) return false;
  const want = cls ?? G.I.cover.get(S.cover)?.cls ?? 2;
  const c = row.classes.includes(want) ? want : row.classes.includes(2) ? 2 : row.classes[0];
  if (S.money < row.fares[c]) { if (!wireFunds(G)) return false; }
  if (S.money < row.fares[c]) return false;
  if (!book(G, leg.key, c).ok) return false;
  advance(G, leg.dep + 1);
  return true;
}
const score2 = (it, kind) => (kind === 'safest' ? it.risk * 600 + it.arr : kind === 'cheapest' ? it.fare * 600 + it.arr : it.arr);

function idle(G, careful) {
  const { S } = G;
  if (canLieLow(G) && lieLow(G)) return true;
  const people = contactsHere(G);
  if (people.length && rand(S) < .35) { seek(G, people[Math.floor(rand(S) * people.length)].person.id); return true; }
  if (!careful && rand(S) < .3) { walk(G); return true; }
  const tg = target(G);
  // waiting for a window to open in this city, or for the next order: let the days pass
  const until = tg && tg.after > S.t ? Math.min(tg.after, S.t + 2 * 1440) : S.t + 1440;
  passDays(G, Math.max(.25, (until - S.t) / 1440));
  advance(G, until);
  return true;
}

export function play(G, name, maxSteps = 40000) {
  const { S } = G;
  const P = POLICIES[name];
  G.policy = P;
  P.start?.(G);
  let guard = 0;
  while (!S.ended && guard++ < maxSteps) {
    const v = cardView(G);
    if (v) { const i = P.card(G, v); if (i < 0 || !choose(G, i)) S.queue.shift(); continue; }
    if (S.t < S.busyUntil) { advance(G, S.busyUntil); continue; }
    if (S.booked) { advance(G, S.booked.dep + 1); continue; }
    if (S.journey) { advance(G, S.journey.arr + 1); continue; }
    if (S.city && P.city(G)) continue;
    advance(G, S.t + HOUR);
  }
  return S;
}

export const won = (S) => S.ended?.why === 'home' && S.standing >= 50;
