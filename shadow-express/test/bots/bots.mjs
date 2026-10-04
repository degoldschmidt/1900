// Bot players for balancing. Each policy answers cards and chooses what to do in a city; play() runs a whole campaign.
//   careless: next train toward the order, one cover, first choice, hotels, never checks for a tail.
//   competent: safest route when there is slack, rotates and stashes covers, safe houses, checks tails, scores choices.
//   exploit-*: one trick spammed (third class only, bribe everything, plant false trails, never sleep in hotels).

import { advance } from '../../src/core/sim.js';
import { board, book, bookTrip, plan, cardView, choose, walk, opActions, doWay, canLieLow, lieLow, wireFunds, switchCover, stash, retrieve, sendFor, checkTail, shakeTail, setLodging, safehouseHere, contactsHere, seek, passDays, doActivity, stopRoutine } from '../../src/core/actions.js';
import { legendOf, stayDays } from '../../src/core/residence.js';
import { currentStep, stepCities, activeOps } from '../../src/core/ops.js';
import { T, DAY } from '../../src/data/time.js';
import { rand } from '../../src/core/rng.js';
import { carriedCovers, contraband, hasUse } from '../../src/core/game.js';

const HOUR = 60;

/** Where the current step of the most urgent active op wants the player. A careful player gives up on a step that
 *  no train can reach in time and turns to the next order instead. */
function target(G) {
  const { S, I } = G;
  const cands = [];
  for (const o of activeOps(G)) {
    const st = currentStep(G, o.id);
    if (!st) continue;
    let cities = stepCities(st);
    if (st.kind === 'meet') cities = [st.city ?? I.person.get(st.person).city].flat().filter(Boolean);
    if (st.kind === 'carry' && !S.case.some((x) => x.id === st.item)) continue;
    if (!cities.length || cities[0] === '*') continue;
    cands.push({ op: o, step: st, cities, by: st.by ? T(st.by) : Infinity, after: st.after ? T(st.after) : 0 });
  }
  cands.sort((a, b) => a.by - b.by);
  if (G.policy !== POLICIES.competent && G.policy !== POLICIES['exploit-plant']) return cands[0] ?? null;
  const main = cands.filter((c) => !c.op.side);
  // the last boat comes first once there is barely a day in hand to reach it
  const boat = main.find((c) => c.op.id === 'op-lastboat');
  if (boat && S.city && !boat.cities.includes(S.city)) {
    const arr = Math.min(...boat.cities.flatMap((c) => plan(G, c).map((it) => it.arr)));
    if (boat.by - arr < 30 * HOUR) return boat;
  }
  const pick = main.find((c) => reachable(G, c)) ?? main[0] ?? cands[0] ?? null; // favours wait while an order is open
  // where two orders can both be served in one city, go there
  if (pick && pick.cities.length > 1) for (const o of cands) {
    if (o === pick) continue;
    const both = pick.cities.filter((c) => o.cities.includes(c));
    if (both.length) return { ...pick, cities: both };
  }
  return pick;
}
function reachable(G, c) {
  const { S } = G;
  if (c.by === Infinity || c.cities.includes(S.city)) return true;
  const k = `${c.op.id}:${c.step.id}:${Math.floor(S.t / 120)}`;
  G._reach ??= {};
  if (k in G._reach) return G._reach[k];
  let ok = false;
  for (const city of c.cities) for (const it of plan(G, city)) if (it.arr + 60 <= c.by) ok = true;
  return (G._reach[k] = ok);
}

/** Score a list of effects as a careful reader of the sub-text would. */
function scoreFx(eff = []) {
  let s = 0;
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
    if (e[0] === 'op') s += e[2] === 'fail' ? -25 : e[2] === 'win' ? 8 : 4;
    if (e[0] === 'cover') s += 3;
    if (e[0] === 'papers') s += e[2] * 4;
  }
  return s;
}
/** A choice's worth: with a roll, the chance-weighted value of success and failure. */
function score(c) {
  let s = c.roll ? c.roll.p * scoreFx(c.ok) + (1 - c.roll.p) * scoreFx(c.fail) : scoreFx(c.ok);
  if (c.cost?.money) s -= c.cost.money * .3;
  if (c.next) s += .5;
  return s;
}

/** Ways a careful agent chooses by evidence rather than by risk: naming the mole. */
function pickWay(G, a) {
  if (a.op.id !== 'op-mole' || a.step.id !== 'name') return null;
  const sc = { brandl: 0, ilic: 0, amsler: 0 };
  for (const e of G.S.intel) {
    const m = /^person:(brandl|ilic|amsler)$/.exec(e.subj ?? '');
    if (m && e.claim?.loyal) sc[m[1]] += (String(e.claim.loyal).startsWith('enemy') ? 1 : -1) * e.rel;
  }
  const [best, v] = Object.entries(sc).sort((x, y) => y[1] - x[1])[0];
  return a.ways.find((w) => w.open && w.way.id === (v >= 0 ? best : 'nobody')) ?? null;
}

export const POLICIES = {
  careless: {
    card(G, v) { return v.choices.findIndex((c) => c.open && c.afford !== false); },
    city(G) { return goTo(G, 'fastest', 2) || idle(G, false); },
    way: (ways) => ways.find((w) => w.open && w.afford),
  },
  competent: {
    start(G) { for (const c of carriedCovers(G)) if (c !== G.S.cover) stash(G, c); }, // spare papers stay with the Bureau
    card(G, v) {
      const { S } = G;
      const open = v.choices.map((c, i) => ({ c, i })).filter((x) => x.c.open && x.c.afford !== false);
      if (v.card.type === 'control') {
        const by = (k) => open.find((x) => x.c.std === k);
        if (by('pouch')) return by('pouch').i;
        if (v.card.search && contraband(G).length && !hasUse(G, 'lining')) { const b = by('bribe'); return (b && b.c.p >= .6 ? b : by('declare') ?? by('papers') ?? open[0]).i; }
        // otherwise the likeliest way through, as the card's own hints suggest
        const fatal = (x) => x.c.std === 'papers' && (v.card.alert || v.card.alien) && G.W.act(S.t) === 3; // a failure there is arrest
        const ranked = open.filter((x) => x.c.p !== undefined).sort((a, b) => (fatal(a) - fatal(b)) || b.c.p - a.c.p);
        return (ranked[0] ?? open[0]).i;
      }
      if (v.card.type === 'encounter') {
        const named = !!G.S.enemy.dossiers[S.cover]?.name; // a careful agent assumes the worst once traced
        const by = (k) => open.find((x) => x.c.std === k);
        return ((named ? by('porter') ?? by('slip') : by('brazen')) ?? open[0]).i;
      }
      if (v.card.type === 'inspector') { const by = (k) => open.find((x) => x.c.std === k); return ((legendOf(G) >= .45 ? by('answer') : by('papers')) ?? open[0]).i; }
      if (v.card.type === 'missed') return (open.find((x) => x.c.std === 'reroute') ?? open[0]).i;
      if (v.card.type === 'telegram' && open.some((x) => x.c.std === 'decline')) return open.find((x) => x.c.std === 'decline').i; // a careful agent keeps to the posting
      if (!open.length) return -1;
      return open.reduce((a, b) => (score(b.c) > score(a.c) ? b : a)).i;
    },
    city(G) {
      const { S } = G;
      stopRoutine(G);
      const tg = target(G);
      const posted = tg && tg.cities.includes(S.city);
      // spare papers are kept in the posting city, and travel with you when you move on
      for (const [id, c] of Object.entries(S.covers)) if (!posted && S.city !== 'LON' && !c.carried && !c.burned && c.stash === S.city) retrieve(G, id);
      if (posted) for (const id of carriedCovers(G)) if (id !== S.cover) stash(G, id);
      if (posted && S.city !== 'LON') for (const [id, c] of Object.entries(S.covers)) if (!c.burned && !c.carried && c.stash === 'LON') sendFor(G, id);
      // a name the enemy has, or a cover that has left too many sharp traces, is retired
      const named = !!S.enemy.dossiers[S.cover]?.name;
      const heat = S.records.filter((r) => r.cover === S.cover && S.t - r.t < 5 * 24 * HOUR).reduce((a, r) => a + (r.heat ?? (r.kind === 'bribe' ? .45 : r.kind === 'sighting' ? .2 : 0)) * r.fid, 0);
      if ((named || heat > .45) && S.t - (S._switched ?? -1e9) > 24 * HOUR) {
        const alts = Object.entries(S.covers).filter(([id, c]) => id !== S.cover && !c.burned && (c.carried || (c.stash === S.city && (c.ready ?? 0) <= S.t)));
        const cool = (id) => !S.enemy.dossiers[id]?.name && (S.enemy.dossiers[id]?.susp ?? 0) < (S.enemy.dossiers[S.cover]?.susp ?? 0) * .7;
        const alt = alts.find(([id]) => cool(id)) ?? null;
        if (alt) {
          if (!alt[1].carried) retrieve(G, alt[0]);
          const old = S.cover;
          if (switchCover(G, alt[0]).ok) { S._switched = S.t; if (posted) stash(G, old); return true; }
        }
      }
      if (S.stats.nearMisses > (S._nm ?? 0)) { S._nm = S.stats.nearMisses; if (checkTail(G) && S.tailedBy) shakeTail(G); return true; }
      if (safehouseHere(G)) setLodging(G, 'safehouse');
      else if (S.lodging?.city !== S.city) setLodging(G, 'pension');
      const slack = tg ? tg.by - S.t : Infinity;
      return goTo(G, slack > 30 * HOUR || G.W.act(S.t) === 3 ? 'safest' : 'fastest', null) || idle(G, true); // in the war, the safe road if it is in time
    },
    way: (ways) => ways.filter((w) => w.open && w.afford).sort((a, b) => a.risk + (a.way.cost?.money ?? 0) / 60 - (b.risk + (b.way.cost?.money ?? 0) / 60))[0],
  },
  'exploit-plant': { // careful otherwise, but lays a false trail through anyone who offers one
    start(G) { POLICIES.competent.start(G); },
    card(G, v) {
      const { S } = G;
      // one trail at a time, laid from lodgings in a city, never from a train
      const ready = S.city && S.lodging?.city === S.city && (S.quietUntil ?? 0) <= S.t;
      const i = ready ? v.choices.findIndex((c) => c.open && c.afford !== false && (c.ok ?? []).some((e) => e[0] === 'plant' && !String(e[1]?.subj ?? '').startsWith('op:'))) : -1;
      if (i >= 0) return i;
      // otherwise the careful choice, but nothing that leaves a mark while a trail is pending
      if ((S.quietUntil ?? 0) > S.t) {
        const quiet = v.choices.map((c, k) => ({ c, k })).filter((x) => x.c.open && x.c.afford !== false && !(x.c.ok ?? []).some((e) => ['record', 'plant', 'expose'].includes(e[0])));
        if (quiet.length && !['control', 'encounter', 'inspector', 'missed'].includes(v.card.type)) return quiet[0].k;
      }
      return POLICIES.competent.card(G, v);
    },
    city(G) {
      const { S } = G;
      // a trail holds only while nothing places you elsewhere: keep to the rooms until the hour it names
      if (S.lodging?.city !== S.city) setLodging(G, safehouseHere(G) ? 'safehouse' : 'pension');
      if ((S.quietUntil ?? 0) > S.t) { if (doActivity(G, 'rest')) { advance(G, Math.min(S.quietUntil + 1, S.t + 12 * HOUR)); return true; } }
      const people = contactsHere(G);
      if (people.length && rand(S) < .5) { seek(G, people[Math.floor(rand(S) * people.length)].person.id); return true; }
      return POLICIES.competent.city(G);
    },
    way: (ways) => POLICIES.competent.way(ways),
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
    const w = pickWay(G, a) ?? G.policy.way(a.ways);
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
  let its = tg.cities.flatMap((c) => plan(G, c));
  // a careful agent believes the rumours about lines and frontiers, if another way serves in time
  if (G.policy !== POLICIES.careless) { const clear = its.filter((it) => !it.rumoured && it.arr + 2 * HOUR <= tg.by); if (clear.length) its = clear; }
  const inTime = its.filter((it) => it.arr + 2 * HOUR <= tg.by);
  for (const it of (kind === 'safest' && inTime.length ? inTime : its)) if (!best || score2(it, kind === 'safest' && !inTime.length ? 'fastest' : kind) < score2(best, kind === 'safest' && !inTime.length ? 'fastest' : kind)) best = it;
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
  // on a hunter's own ground once the war has come, a careful agent keeps to the rooms between errands
  if (careful && G.W.act(S.t) === 3 && G.D.hunters.some((h) => h.ground.includes(G.I.city.get(S.city)?.nation))) {
    const tg = target(G);
    const until = tg && tg.after > S.t ? Math.min(tg.after, S.t + 12 * HOUR) : S.t + 6 * HOUR;
    if (doActivity(G, 'rest')) { advance(G, until); return true; }
  }
  const people = contactsHere(G);
  if (people.length && rand(S) < .35) { seek(G, people[Math.floor(rand(S) * people.length)].person.id); return true; }
  if (!careful && rand(S) < .3) { walk(G); return true; }
  const tg = target(G);
  // waiting for a window to open in this city, or for the next order: let the days pass, but never through a deadline
  let until = S.t + DAY;
  if (tg) {
    if (tg.after > S.t) until = Math.min(tg.after, S.t + 2 * DAY);
    else if (tg.cities.includes(S.city)) until = S.t + 3 * HOUR; // the step is here and open: look again soon
    if (tg.by !== Infinity) until = Math.min(until, tg.by - 2 * HOUR);
  }
  until = Math.max(until, S.t + HOUR);
  passDays(G, Math.max(.05, (until - S.t) / DAY));
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
