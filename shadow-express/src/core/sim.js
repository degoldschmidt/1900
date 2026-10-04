// Time. advance() moves the campaign forward until a card needs the player (an interrupt) or a limit is reached:
// journeys and frontier controls, the enemy learning and the hunters moving, encounters, delayed consequences,
// orders, deadlines, the calendar, contacts under watch. Cards wait in S.queue; actions.js answers them.

import { DAY, T } from '../data/time.js';
import { rand, hash } from './rng.js';
import { learn, belief, emptyHunt, linked, SUSPECT } from './enemy.js';
import { moveHunters } from './hunters.js';
import { crossings, delayOf, cancelled } from './timetable.js';
import { all, eligible, pick } from './storylet.js';
import { END } from './world.js';
import { context, leave, note, log, has, coverData, addIntel, nationNow, personHere, caseSize } from './game.js';
import { checkOps } from './ops.js';
import { dailyTurn, watchEvents, completeActivity, watchOf, shadowed, addWatch, legendOf, LODGINGS, needsRegistration, stayDays } from './residence.js';
import { skill, has as trait, tongue } from './hero.js';
import { departuresFrom, CHANGE } from './timetable.js';

export const TICK = 30;
const HOUR = 60;

/** Advance until `limit` or until a card is queued. Returns the first card or null. */
export function advance(G, limit) {
  const { S } = G;
  while (!S.queue.length && !S.ended && S.t < limit) {
    const next = Math.min(limit, nextEvent(G));
    S.t = Math.max(S.t + 1, next);
    tick(G);
  }
  return S.queue[0] ?? null;
}

/** The next moment something may happen: a tick boundary, a crossing, an arrival, a departure, a due consequence. */
function nextEvent(G) {
  const { S } = G;
  let n = (Math.floor(S.t / TICK) + 1) * TICK;
  const j = S.journey;
  if (j) {
    for (const x of j.crossings) if (!x.done) n = Math.min(n, x.t);
    if (j.eventAt && !j.eventDone) n = Math.min(n, j.eventAt);
    n = Math.min(n, j.arr);
  }
  if (S.booked) n = Math.min(n, S.booked.dep);
  if (S.activity) n = Math.min(n, Math.max(S.activity.until, S.t + 1));
  for (const l of S.later) n = Math.min(n, Math.max(l.at, S.t + 1));
  return n;
}

function tick(G) {
  const { S, W } = G;
  if (S.activity && S.t >= S.activity.until) { const a = S.activity; S.activity = null; completeActivity(G, a); afterActivity(G, a); }
  if (S.booked && S.t >= S.booked.dep) depart(G);
  if (S.journey) journeyStep(G);
  enemyStep(G);
  if (!S.journey) encounters(G); else trainEncounter(G);
  dueLaters(G);
  acts(G);
  calendar(G);
  tips(G);
  goAndSee(G);
  bureau(G);
  checkOps(G);
  people(G);
  perish(G);
  nights(G);
  days(G);
  routine(G);
  if (S.tailedBy && S.t - S.tailSince > 30 * HOUR && !S.queue.length) confront(G, S.tailedBy, 'tail');
  if (S.t >= END && !S.ended) endGame(G, 'time');
  if (S.standing <= 0 && !S.ended) endGame(G, 'recalled');
}

// ---------- journeys ----------
function depart(G) {
  const { S, W, I } = G;
  const b = S.booked;
  S.booked = null;
  const why = cancelled(W, b.dp);
  if (why) {
    S.money += b.fare; // refunded
    const row = W.rows.find((r) => r.id === why);
    note(G, 'No train', why === 'military' ? `The ${W.service.get(b.dp.svc).name} is cancelled: the line is wanted for the army. Your fare is returned.` : `The ${W.service.get(b.dp.svc).name} does not run: ${row ? row.news.toLowerCase() : 'the line is closed'}. Your fare is returned.`);
    knowDisruption(G, b.dp.svc, why);
    return;
  }
  const s = W.service.get(b.dp.svc);
  const delay = delayOf(W, b.dp);
  const nCross = crossings(W, b.dp, delay);
  S.city = null;
  S.journey = { key: b.dp.key, svc: s.id, line: s.line, kind: s.kind, cls: b.cls, from: b.dp.from, to: b.dp.to, dep: b.dp.dep, sched: b.dp.arr, arr: b.dp.arr + delay, delay,
    crossings: nCross.map((x) => ({ ...x, done: false })), eventAt: null, eventDone: false };
  S.stats.journeys++;
  const dur = S.journey.arr - S.journey.dep;
  if (dur >= 120) S.journey.eventAt = S.journey.dep + Math.round(dur * (.3 + .4 * rand(S)));
  // the service's own records: a passenger list, a sleeping-car berth
  for (const k of s.records) leave(G, k, k === 'berth' ? .75 : b.cls === 1 ? .55 : .4, { city: b.dp.from });
  if (S.tailedBy) { const h = S.enemy.hunters[S.tailedBy]; h.leg = { svc: s.id, key: b.dp.key, from: b.dp.from, to: b.dp.to, dep: b.dp.dep, arr: S.journey.arr }; }
  // a police shadow on the platform reads your ticket and telegraphs ahead
  if ((S.watch?.[b.dp.from] ?? 0) >= .35 && (S.shookUntil ?? 0) <= S.t) leave(G, 'sighting', .75, { city: S.trip?.legs.at(-1)?.to ?? b.dp.to, t: S.journey.arr, heat: .2 });
  if (trait(S.hero, 'nervous') && S.journey.crossings.length) S.nerve = Math.max(0, S.nerve - 1);
  log(G, `Left ${I.city.get(b.dp.from).name} by the ${s.name}.`);
}

function journeyStep(G) {
  const { S, I, W } = G;
  const j = S.journey;
  for (const x of j.crossings) {
    if (x.done || S.t < x.t) continue;
    x.done = true;
    frontier(G, x);
    if (S.queue.length) return;
  }
  if (j.eventAt && !j.eventDone && S.t >= j.eventAt) {
    j.eventDone = true;
    if (rand(S) < .75) { const st = pickStory(G, 'train'); if (st) { S.queue.push({ type: 'story', id: st.id, n: ++S.cardN }); return; } }
  }
  delayWarning(G);
  if (S.queue.length) return;
  if (S.t >= j.arr) arrive(G);
}

function arrive(G) {
  const { S, I } = G;
  const j = S.journey;
  S.journey = null;
  S.city = j.to;
  if (connect(G, j)) return; // changing trains: the journey goes on
  S.cityArrived = S.t;
  S.place = 'street';
  S.trip = null;
  stationWatch(G);
  if (S.tailedBy && rand(S) < .4) note(G, 'A face again', 'On the platform, a man buys a paper he does not read. You have seen that coat before, at the last station. Or one like it.');
  S.visits[j.to] = (S.visits[j.to] ?? 0) + 1;
  if (j.kind === 'night') S.nerve = Math.min(10, S.nerve + 1);
  if (S.tailedBy) { const h = S.enemy.hunters[S.tailedBy]; h.leg = null; h.city = j.to; h.idleUntil = S.t + 3 * HOUR; }
  log(G, `Arrived in ${I.city.get(j.to).name}${j.delay > 20 ? `, ${Math.round(j.delay)} minutes late` : ''}.`);
  S.queue.push({ type: 'arrive', city: j.to, delay: j.delay, n: ++S.cardN });
  checkOps(G);
  if (S.visits[j.to] === 1 || rand(S) < .45) { const st = pickStory(G, 'city'); if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN }); }
}

// ---------- through journeys: connections ----------
/** At a junction of a booked journey: make the next train, or miss it. Returns true while the journey goes on. */
function connect(G, j) {
  const { S, W, I } = G;
  const trip = S.trip;
  if (!trip || trip.legs[trip.i]?.key !== j.key) return false;
  const next = trip.legs[trip.i + 1];
  if (!next) return false;
  trip.i++;
  S.place = 'station';
  S.cityArrived = S.t;
  stationWatch(G);
  if (cancelled(W, next)) { S.trip = null; note(G, 'No connection', `At ${I.city.get(S.city).name} the board says the ${W.service.get(next.svc).name} does not run today. You are on your own from here.`); S.queue.push({ type: 'arrive', city: S.city, delay: j.delay, n: ++S.cardN }); return true; }
  if (S.t + CHANGE <= next.dep || (trip.held === next.key && S.t <= next.dep + 30)) {
    S.booked = { dp: next, cls: trip.cls, fare: 0, dep: Math.max(next.dep, S.t) };
    log(G, `Changed trains at ${I.city.get(S.city).name}.`);
    return true;
  }
  S.queue.push({ type: 'missed', city: S.city, svc: next.svc, dep: next.dep, to: next.to, n: ++S.cardN });
  return true;
}

/** Police at the station with a list: on enemy ground, if the name you travel under is on it. */
function stationWatch(G) {
  const { S, I } = G;
  const nat = I.city.get(S.city).nation, d = S.enemy.dossiers[S.cover];
  if (d?.alerts?.includes(nat) && rand(S) < .3 + .2 * (G.W.act(S.t) - 1)) {
    const x = { id: 'STN', name: `${I.city.get(S.city).name} station`, into: nat };
    S.queue.push({ type: 'control', fid: x.id, name: x.name, into: nat, papers: true, search: rand(S) < .4, alert: true, alien: false, story: null, n: ++S.cardN });
  }
}

/** Running late with a connection at risk: the passenger learns it on the way, and may telegraph ahead. */
function delayWarning(G) {
  const { S, W, I } = G;
  const j = S.journey, trip = S.trip;
  if (!j || !trip || j.warned || j.delay < 25) return;
  const next = trip.legs[trip.i + 1];
  if (!next || next.from !== j.to) return;
  if (S.t < j.dep + (j.sched - j.dep) * .3) return;
  j.warned = true;
  if (j.arr + CHANGE <= next.dep) return;
  S.queue.push({ type: 'late', delay: j.delay, at: j.to, next: next.key, svc: next.svc, dep: next.dep, n: ++S.cardN });
}

// ---------- frontier controls ----------
/** Chances at a crossing for the active cover: papers asked, case searched, and why. */
export function controlOdds(G, x, o = {}) {
  const { S, W, I } = G;
  const t = o.t ?? S.t, coverId = o.cover ?? S.cover, cls = o.cls ?? S.journey?.cls ?? 2, svcId = o.svc ?? S.journey?.svc;
  const N = I.nation.get(x.into), st = W.state(x.into, t), svc = W.service.get(svcId);
  const c = coverData(G, coverId), d = S.enemy.dossiers[coverId];
  const boost = W.control(x.id, x.into, t) + watchBoost(G, x, t);
  const alert = !!(d?.alerts?.includes(x.into));
  const alien = !!(c && W.alien(c.nation, x.into, t));
  const companion = S.case.some((x) => I.item.get(x.id)?.fn === 'companion');
  let papers = N.papers[st] + boost + (svc?.check === 'onboard' ? .1 : 0) + (cls === 3 ? .05 : cls === 1 ? -.05 : 0) + (companion ? .15 : 0);
  let search = (N.search[st] + boost * .6) * (S.sex === 'f' ? .6 : 1) * (coverId === 'doyle' ? .35 : 1) * (cls === 1 ? .7 : cls === 3 ? 1.2 : 1);
  if (svc?.check === 'none') { papers = 0; search = 0; }
  if (alert || alien) papers = 1;
  return { papers: Math.max(0, Math.min(1, papers)), search: Math.max(0, Math.min(1, search)), alert, alien, state: st, nation: x.into, boost, companion };
}
function watchBoost(G, x, t) {
  let b = 0;
  for (const h of G.D.hunters) { const st = G.S.enemy.hunters[h.id]; if (st && !st.leg && st.role === 'watch' && G.W.hunterActive(h, t) && G.W.line.get(G.S.journey?.line)?.frontiers.some((f) => f.id === x.id) && [G.S.journey?.from, G.S.journey?.to].includes(st.city)) b += .25; }
  return b;
}

function frontier(G, x) {
  const { S } = G;
  const odds = controlOdds(G, x);
  const askP = rand(S) < odds.papers, searchP = rand(S) < odds.search;
  S.stats.controls++;
  if (!askP && !searchP) { leave(G, 'frontier', .12, { city: S.journey.from }); log(G, `Waved through at ${x.name}.`); return; }
  const story = pickStory(G, 'control', { frontier: x.id });
  S.queue.push({ type: 'control', fid: x.id, name: x.name, into: x.into, papers: askP, search: searchP, alert: odds.alert, alien: odds.alien, story: story?.id ?? null, n: ++S.cardN });
}

// ---------- the enemy ----------
function enemyStep(G) {
  const { S, W, D, I } = G;
  const E = S.enemy;
  const due = S.records.filter((r) => !r.read && r.arrives <= S.t).sort((a, b) => a.arrives - b.arrives);
  const before = E.belief ? `${E.belief.city}|${E.belief.t}` : '';
  if (due.length) {
    for (const r of due) r.read = true;
    learn(E, due, { W, D, covers: Object.fromEntries(I.cover), papers: (c) => S.covers[c]?.papers ?? .5, ground: I.ground }, S.t);
    trimRecords(S);
  }
  const after = E.belief ? `${E.belief.city}|${E.belief.t}` : '';
  const need = before !== after || D.hunters.some((h) => { const st = E.hunters[h.id]; return W.hunterActive(h, S.t) && h.id !== S.tailedBy && (st.leg ? S.t >= st.leg.arr : S.t >= st.idleUntil); });
  if (need && S.t % TICK === 0) moveHunters(E, W, S.t);
  // a hunter who reaches a planted place and finds nothing grows sceptical
  for (const h of D.hunters) { const st = E.hunters[h.id]; if (!st.leg) emptyHunt(E, st.city, S.t); }
  // hunters' voices: a letter as the net closes on the active cover
  const d = E.dossiers[S.cover];
  if (d) for (const h of D.hunters) {
    if (!W.hunterActive(h, S.t)) continue;
    const n = E.voice[h.id] ?? 0, st = E.hunters[h.id];
    const stage = d.name && st.target && hereOrNear(G, st) ? 3 : d.name ? 2 : d.susp >= SUSPECT ? 1 : 0;
    if (stage > n && h.voice[n] && !S.queue.length && E.belief && (h.ground.includes(I.city.get(E.belief.city)?.nation) || st.role === 'tail')) {
      E.voice[h.id] = n + 1;
      const story = I.story.get(h.voice[n]);
      if (story && all(story.if, context(G, { hunter: h.id }))) S.queue.push({ type: 'story', id: story.id, hunter: h.id, n: ++S.cardN });
    }
  }
}
const hereOrNear = (G, st) => !st.leg && (st.city === G.S.city || st.city === G.S.journey?.to);
function trimRecords(S) { if (S.records.length > 400) S.records.splice(0, S.records.length - 400); }

// ---------- encounters (truth) ----------
function hunterAt(G, id) {
  const st = G.S.enemy.hunters[id];
  if (st.leg && G.S.t >= st.leg.dep && G.S.t < st.leg.arr) return { train: st.leg.key };
  return { city: st.leg && G.S.t < st.leg.dep ? st.leg.from : st.city };
}

function recognition(G) {
  const { S } = G;
  const E = S.enemy, d = E.dossiers[S.cover];
  const linkedName = linked(E, S.cover).some((c) => E.dossiers[c]?.name);
  return Math.max(E.photo ? .9 : 0, d?.name || linkedName ? .85 : 0, E.desc * .8, d && d.susp >= SUSPECT ? .35 : 0);
}

function encounters(G) {
  const { S, W, D, I } = G;
  if (S.t % TICK !== 0 || S.queue.length || !S.city) return;
  if (S.place === 'safehouse') return;
  for (const h of D.hunters) {
    if (!W.hunterActive(h, S.t) || h.id === S.tailedBy) continue;
    const at = hunterAt(G, h.id);
    if (at.city !== S.city) continue;
    const st = S.enemy.hunters[h.id];
    const night = (S.t % DAY) >= 22 * HOUR || (S.t % DAY) < 6 * HOUR;
    let p = .07 * (st.role === 'tail' && st.target === S.city ? 2.5 : 1) * (night ? .4 : 1) * (S.lyingLow ? .35 : 1);
    if (night && S.enemy.dossiers[S.cover]?.name) p *= 3; // they read the hotel registers
    if (rand(S) >= p) continue;
    meet(G, h, 'city');
    if (S.queue.length) return;
  }
}

function trainEncounter(G) {
  const { S, W, D } = G;
  if (S.t % TICK !== 0 || S.queue.length) return;
  for (const h of D.hunters) {
    if (!W.hunterActive(h, S.t) || h.id === S.tailedBy) continue;
    if (hunterAt(G, h.id).train !== S.journey.key) continue;
    if (rand(S) < .2) { meet(G, h, 'train'); return; }
  }
}

/** A hunter and the player in the same place: recognised or a near miss. */
function meet(G, h, where) {
  const { S, W, I } = G;
  S.stats.encounters++;
  const r = recognition(G);
  if (rand(S) < r) {
    const onGround = h.ground.includes(nationNow(G));
    if (W.act(S.t) === 3 && onGround) { confront(G, h.id, 'arrest'); return; }
    if (rand(S) < .55 && where === 'city') { S.tailedBy = h.id; S.tailSince = S.t; S.knownTail = false; const st = S.enemy.hunters[h.id]; st.leg = null; st.city = S.city; return; }
    confront(G, h.id, where === 'train' ? 'train' : 'confront');
    return;
  }
  S.stats.nearMisses++;
  if (rand(S) < .55) {
    addIntel(G, { subj: `hunter:${h.id}`, claim: { at: S.city ?? S.journey.to }, src: 'seen', rel: .9, truth: true });
    if (!S.lastGlimpse || S.t - S.lastGlimpse > 8 * HOUR) { S.lastGlimpse = S.t; note(G, 'A face you know', `${cap(h.look)}. ${where === 'train' ? 'Two carriages down.' : 'Across the street, then gone.'} Did he see you?`); }
  }
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function confront(G, hid, kind) {
  const { S } = G;
  if (S.queue.some((c) => c.type === 'encounter')) return;
  const story = pickStory(G, 'encounter', { hunter: hid });
  S.queue.push({ type: 'encounter', hunter: hid, kind, story: story?.id ?? null, n: ++S.cardN });
}

// ---------- delayed consequences, calendar, people ----------
function dueLaters(G) {
  const { S, I } = G;
  for (let i = 0; i < S.later.length; i++) {
    const l = S.later[i];
    if (S.t < l.at) continue;
    if (l.courier) { S.later.splice(i--, 1); courierArrives(G, l.courier); continue; }
    if (S.t > l.until) { S.later.splice(i--, 1); continue; }
    const st = I.story.get(l.story);
    if (!st) { S.later.splice(i--, 1); continue; }
    const kindOk = st.at === 'then' || (st.at === 'city' && S.city) || (st.at === 'train' && S.journey) || !['city', 'train'].includes(st.at);
    if (!kindOk || S.queue.length) continue;
    if (!all(st.if, context(G))) continue;
    S.later.splice(i--, 1);
    S.queue.push({ type: 'story', id: st.id, n: ++S.cardN });
    return;
  }
}

const ACTS = [null, null,
  ['Act II · The Ultimatum', 'Three weeks after Sarajevo, Vienna is drafting a note that Belgrade cannot accept, and London wants you in Belgrade when it is delivered. Police on every frontier are told to look harder. In Zurich, a woman in widow\'s black takes rooms by the lake and starts buying information.'],
  ['Act III · Mobilisation', 'Serbia has refused, Austria has mobilised, and Russia will follow. London wants you in Berlin, of all places, for a few days more. Lines are wanted for the army; frontiers close at a day\'s notice; a foreigner\'s papers can make him a prisoner. The hunters may now take you on their own ground.']];
function acts(G) {
  const { S, W } = G;
  const a = W.act(S.t);
  if ((S.actShown ?? 1) < a) { S.actShown = a; S.queue.push({ type: 'act', act: a, title: ACTS[a][0], text: ACTS[a][1], n: ++S.cardN }); }
}

/** Recruited contacts with the intel perk send word of the hunters now and then; a traitor sends lies that lure. */
function tips(G) {
  const { S, W, D } = G;
  if (S.t % (12 * HOUR) !== 0) return;
  for (const p of D.people) {
    const ps = S.people[p.id];
    if (ps.st !== 'recruited' || !p.perks.includes('intel')) continue;
    if ((ps.lastTip ?? 0) > S.t - 36 * HOUR) continue;
    ps.lastTip = S.t;
    const hs = D.hunters.filter((h) => W.hunterActive(h, S.t));
    if (!hs.length) continue;
    const h = hs[Math.floor(hash(S.seed, 'tip', p.id, S.t) * hs.length)], st = S.enemy.hunters[h.id];
    const real = st.leg ? st.leg.to : st.city;
    const traitor = (ps.loyal ?? '').startsWith('enemy:');
    const at = traitor ? farFrom(G, real) : real;
    addIntel(G, { subj: `hunter:${h.id}`, claim: { at }, src: `person:${p.id}`, rel: .75, truth: !traitor });
    log(G, `Word from ${p.name}: ${h.name} is in ${G.I.city.get(at).name}.`);
  }
}

/** Being in a city settles what was said of it: a hunter said to be here is, or is not, to be seen. */
function goAndSee(G) {
  const { S } = G;
  if (!S.city || S.t % (2 * HOUR) !== 0) return;
  for (const e of S.intel) {
    if (e.resolved !== null || !e.claim?.at || e.claim.at !== S.city || !e.subj.startsWith('hunter:')) continue;
    if (S.t - e.learned > 2 * DAY) continue;
    const here = S.enemy.hunters[e.subj.slice(7)];
    const isHere = here && !here.leg && here.city === S.city;
    if (!isHere && S.t - (S.cityArrived ?? S.t) >= 4 * HOUR) resolveIntel(G, e, false);
  }
}
function resolveIntel(G, e, truth) {
  const { S } = G;
  e.resolved = truth === e.truth ? e.truth : truth;
  const s = (S.sources[e.src] ??= { right: 0, wrong: 0 });
  if (e.resolved === e.truth && e.truth) s.right++; else s.wrong++;
}

function courierArrives(G, { person, item, to }) {
  const { S, I } = G;
  const p = I.person.get(person), st = S.people[person].st;
  if (['arrested', 'compromised', 'dead'].includes(st) || (S.people[person].loyal ?? '').startsWith('enemy:')) {
    note(G, 'The courier', `${p.name} never reached London. Nor did ${I.item.get(item).name.toLowerCase()}.`);
    if ((S.people[person].loyal ?? '').startsWith('enemy:')) leave(G, 'talk', 1, { person, city: p.city ?? 'BER' });
    return;
  }
  courierDone(G, item, to ?? 'LON');
  note(G, 'From London', I.item.get(item).fn === 'companion' ? `ASHBY TO YOU: YOUR FRIEND ARRIVED SAFELY ${(I.city.get(to)?.name ?? '').toUpperCase()} STOP WELL DONE STOP` : `ASHBY TO YOU: ${I.item.get(item).name.toUpperCase()} RECEIVED STOP WELL DONE STOP`);
}
function courierDone(G, item, to) {
  const { S } = G;
  for (const o of G.D.ops) {
    if (S.ops[o.id].status !== 'active') continue;
    const step = o.steps.find((x) => !S.ops[o.id].done[x.id]);
    if (step?.kind === 'carry' && step.item === item && [step.to].flat().includes(to)) { S.ops[o.id].done[step.id] = S.t; G.afterStep?.(G, o.id, step.id); }
  }
}

function calendar(G) {
  const { S, W } = G;
  const fresh = W.rows.filter((r) => r.t <= S.t && !S.newsSeen.includes(r.id));
  if (!fresh.length) return;
  for (const r of fresh) S.newsSeen.push(r.id);
  const shown = fresh.filter((r) => r.fact || (r.fx.some((e) => e[0] === 'suspend') && hearsOf(G, r))); // game rows (acts, hunters) are never news
  if (shown.length) S.queue.push({ type: 'news', rows: shown.map((r) => r.id), n: ++S.cardN });
}
/** A fictional disruption is heard of near it, or through the guide. */
function hearsOf(G, r) {
  const { S, W } = G;
  if (has(G, 'bradshaw')) return true;
  const n = S.city ? W.city.get(S.city).nation : null;
  return r.fx.some((e) => e[1] === n || (typeof e[1] === 'string' && e[1].startsWith('line:') && W.line.get(e[1].slice(5)) && [W.line.get(e[1].slice(5)).a, W.line.get(e[1].slice(5)).b].includes(S.city)));
}
export function knowDisruption(G, svc, why) { if (why && why !== 'military' && !G.S.newsSeen.includes(why)) G.S.newsSeen.push(why); G.S.flags[`known:${why}`] = true; }

/** Answers to questions wired to London: right three times in four. */
function bureau(G) {
  const { S } = G;
  for (const q of S.queries ?? []) {
    if (q.done || S.t < q.at) continue;
    q.done = true;
    const p = G.I.person.get(q.person);
    const truth = (S.people[q.person].loyal ?? '').startsWith('enemy:');
    const right = hash(S.seed, 'bureau', q.person, q.at) < .75;
    const says = right ? truth : !truth;
    addIntel(G, { subj: `person:${q.person}`, claim: { loyal: says ? 'enemy' : S.people[q.person].loyal === 'enemy' ? 'self' : (S.people[q.person].loyal ?? 'self').replace(/^enemy:.*/, 'self') }, src: 'bureau', rel: .75, truth: right });
    note(G, 'From London', `ASHBY TO YOU: ENQUIRIES CONCERNING ${p.name.toUpperCase()} ${says ? 'SUGGEST HE IS NOT WHAT HE SEEMS STOP TAKE CARE' : 'FIND NOTHING AGAINST HIM STOP'}`);
  }
}

/** Contacts the enemy watches notice it; the compromised are taken on enemy ground; the arrested talk, a step a day. */
function people(G) {
  const { S, W, I } = G;
  if (S.t % (2 * HOUR) !== 0) return;
  for (const p of G.D.people) {
    const ps = S.people[p.id], a = S.enemy.assoc[p.id] ?? 0;
    ps.exp = Math.max(ps.exp, a);
    if (['met', 'cultivated', 'recruited'].includes(ps.st) && a >= .5 && !ps.compromisedAt) {
      ps.compromisedAt = S.t; ps.prev = ps.st; ps.st = 'compromised';
      note(G, `${p.name} is watched`, `Word comes from ${p.name}: men stand at the corner every morning now, and the post arrives opened.`);
    }
    const nat = p.city ? I.city.get(p.city).nation : p.nation;
    if (ps.st === 'compromised' && S.t - ps.compromisedAt > 2 * DAY && I.ground.includes(nat) && W.act(S.t) >= 2) {
      ps.st = 'arrested'; ps.arrestedAt = S.t;
      note(G, `${p.name} arrested`, `${p.name} was taken in the night. What they know, the enemy will know.`);
    }
    if (ps.st === 'arrested' && ps.arrestedAt) {
      const days = Math.floor((S.t - ps.arrestedAt) / DAY);
      ps.talked ??= 0;
      if (days > ps.talked) {
        ps.talked++;
        if (ps.talked === 1) for (const c of ps.covers ?? []) leave(G, 'talk', 1, { cover: c, person: p.id, city: p.city ?? 'BER' });
        if (ps.talked === 2) for (const o of G.D.people) if (S.people[o.id].st === 'recruited' && o.id !== p.id) leave(G, 'talk', 1, { cover: null, person: o.id, city: p.city ?? 'BER' });
      }
    }
    // recruited contacts with the warn perk telegraph when a hunter reaches their city
    if (ps.st === 'recruited' && p.perks.includes('warn') && p.city) for (const h of G.D.hunters) {
      const st = S.enemy.hunters[h.id];
      if (!st.leg && st.city === p.city && ps.warned !== `${h.id}|${st.city}`) {
        ps.warned = `${h.id}|${st.city}`;
        const truth = !(ps.loyal ?? '').startsWith('enemy:');
        addIntel(G, { subj: `hunter:${h.id}`, claim: { at: truth ? p.city : farFrom(G, p.city) }, src: `person:${p.id}`, rel: .8, truth });
      }
    }
  }
}
const farFrom = (G, c) => G.D.cities[(G.D.cities.findIndex((x) => x.id === c) + 9) % G.D.cities.length].id;

function perish(G) {
  const { S, I } = G;
  if (S.t % (6 * HOUR) !== 0) return;
  for (let i = 0; i < S.case.length; i++) {
    const it = I.item.get(S.case[i].id);
    const tag = it?.tags.find((x) => x.startsWith('perishable:'));
    if (tag && S.t - S.case[i].t > Number(tag.slice(11)) * HOUR) { S.case.splice(i--, 1); log(G, `The ${it.name.toLowerCase()} has spoiled.`); }
  }
}

/** Nights in a city: whatever lodging you hold is paid for; with none, you take an hotel room and sign its register. */
function nights(G) {
  const { S } = G;
  if (S.t % DAY !== 23 * HOUR || !S.city) return;
  if (S.place === 'safehouse') { S.nerve = Math.min(10, S.nerve + 2); return; }
  if (S.place === 'rough') { S.nerve = Math.max(0, S.nerve - 1); return; }
  if (!S.lodging || S.lodging.city !== S.city) takeLodging(G, 'hotel');
  const L = LODGINGS[S.lodging.kind];
  if (S.money >= L.perNight) { S.money = Math.round((S.money - L.perNight) * 100) / 100; S.nerve = Math.min(10, S.nerve + 1); }
  else { S.nerve = Math.max(0, S.nerve - 1); }
}
/** Taking lodgings leaves a register: the hotel's, the landlady's, or the police registration of rented rooms. */
export function takeLodging(G, kind) {
  const { S } = G;
  if (!S.city) return false;
  S.lodging = { city: S.city, kind, since: S.t };
  const L = LODGINGS[kind];
  if (L.fid) leave(G, 'register', kind === 'rooms' && needsRegistration(G) ? .85 : L.fid);
  if (kind === 'safehouse') S.place = 'safehouse'; else if (kind === 'rough') S.place = 'rough'; else S.place = 'rooms';
  return true;
}

/** The day's turn at 06.00 in a city: legend and watch move; a high watch may bring a search or an inspector. */
function days(G) {
  const { S } = G;
  if (S.t % DAY !== 6 * HOUR || !S.city) return;
  dailyTurn(G);
  const ev = watchEvents(G);
  if (ev === 'search') roomSearch(G);
  if (ev === 'inspector') S.queue.push({ type: 'inspector', n: ++S.cardN });
  if (S.expelled && S.expelled.city === S.city && S.t > S.expelled.by) {
    S.expelled = null;
    if (W_ground(G) && G.W.act(S.t) === 3) { note(G, 'Arrested', 'You were ordered to leave and did not. The police come at dawn, with a warrant this time.'); endGame(G, 'arrested'); }
    else { S.covers[S.cover].burned = true; S.busyUntil = S.t + 36 * HOUR; S.standing = Math.max(0, S.standing - 12); note(G, 'Deported', 'Two policemen, a closed carriage, and a frontier at dawn. The name you lived under here is finished.'); }
  }
}
const W_ground = (G) => G.I.ground.includes(G.I.city.get(G.S.city)?.nation);

/** The police search your rooms while you are out. */
function roomSearch(G) {
  const { S, I } = G;
  const lining = S.case.some((x) => I.item.get(x.id)?.tags.includes('use:lining'));
  let found = S.case.filter((x) => { const it = I.item.get(x.id); return it && (it.tags.includes('contraband') || it.fn === 'doc'); }).map((x) => x.id);
  if (lining && found.length) found = found.slice(1);
  const spare = Object.entries(S.covers).filter(([id, c]) => id !== S.cover && c.carried && !c.burned).map(([id]) => id);
  const sparesFound = spare.length && !(lining && !found.length) && rand(S) < .6;
  for (const id of found) { const i = S.case.findIndex((y) => y.id === id); if (i >= 0) S.case.splice(i, 1); }
  if (sparesFound) for (const c of [S.cover, ...spare]) { S.covers[c].burned = true; leave(G, 'frontier', 1, { cover: c, heat: 1 }); }
  if (found.length || sparesFound) { addWatch(G, .2); leave(G, 'sighting', .8, { heat: .5 }); }
  else addWatch(G, -.05);
  addIntel(G, { subj: 'cover:active', claim: { note: 'the police searched your rooms' }, src: 'seen', rel: 1, truth: true });
  note(G, 'Your rooms were searched', found.length || sparesFound
    ? `The things in your case were put back almost where they were. Almost. Missing: ${[...found.map((id) => I.item.get(id).name.toLowerCase()), ...(sparesFound ? ['a second passport'] : [])].join(', ')}.`
    : 'A drawer not quite closed, a hair gone from the clasp of your case. Nothing taken. They found nothing, this time; but they looked.');
}

/** Let the days pass: the routine works the legend by day, listens in cafés of an evening, sleeps at night, and stops for anything that needs you. */
function routine(G) {
  const { S } = G;
  if (!S.routine || S.queue.length || !S.city || S.journey || S.booked || S.activity || S.t < S.busyUntil) return;
  if (S.t >= S.routine.until) { S.routine = null; return; }
  const w = watchOf(S.t).name;
  const id = w === 'night' ? 'rest' : w === 'evening' ? (rand(S) < .5 ? 'cafe' : 'rest') : 'work';
  startActivity(G, id);
  if (w === 'morning' && rand(S) < .22) { const st = pickStory(G, 'interlude'); if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN }); }
}
export function startActivity(G, id) {
  const { S } = G;
  const { name, end } = watchOf(S.t);
  S.activity = { id, city: S.city, until: end, night: name === 'night' };
  S.busyUntil = Math.max(S.busyUntil, end);
  if (id === 'rest') S.place = S.place === 'safehouse' ? 'safehouse' : 'rooms';
  else if (S.place !== 'safehouse') S.place = 'street';
}
function afterActivity(G, a) {
  const { S } = G;
  if (S.queue.length || !S.city) return;
  if (a.id === 'cafe') cafeRumour(G);
  if ((a.id === 'work' || a.id === 'cafe') && rand(S) < (a.id === 'cafe' ? .45 : .3)) { const st = pickStory(G, 'city'); if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN }); }
}

/** A café is a newspaper with legs: talk of the hunters and the lines, true or not; a good eye sorts some of it. */
function cafeRumour(G) {
  const { S, W, D } = G;
  const obs = skill(S.hero, 'observation');
  const lang = tongue(S.hero, G.I.city.get(S.city).nation);
  if (lang === 0 && rand(S) < .5) return; // you cannot follow the talk
  const hs = D.hunters.filter((h) => W.hunterActive(h, S.t));
  if (hs.length && rand(S) < .55) {
    const h = hs[Math.floor(rand(S) * hs.length)], st = S.enemy.hunters[h.id];
    const real = st.leg ? st.leg.to : st.city;
    const truth = rand(S) < .5 + .08 * obs;
    const at = truth ? real : D.cities[Math.floor(rand(S) * D.cities.length)].id;
    addIntel(G, { subj: `hunter:${h.id}`, claim: { at }, src: 'rumour', rel: .35 + .05 * obs, truth: at === real });
    return;
  }
  const r = W.rumours(S.t)[0];
  if (r) { const line = r.fx.find((e) => e[0] === 'suspend'); if (line && String(line[1]).startsWith('line:')) addIntel(G, { subj: line[1], claim: { closed: [r.at, null] }, src: 'rumour', rel: .5, truth: true }); }
}

// ---------- storylet choice ----------
/** A weighted eligible storylet for a place: data conditions, speakers only in their places, `once` respected. */
export function pickStory(G, at, card = {}) {
  const { S, I } = G;
  const ctx = context(G, card);
  const list = eligible(I.atList[at] ?? [], at, ctx).filter((s) => !s.speaker || speakerHere(G, s.speaker, at));
  if (!list.length) return null;
  const s = pick(list, () => rand(S));
  if (s?.once) S.seen[s.id] = true;
  return s;
}
function speakerHere(G, id, at) {
  const p = G.I.person.get(id);
  if (!p) return true;
  if (at === 'train') return !!G.S.journey && p.places.includes(`train:${G.S.journey.line}`);
  if (at === 'city') return !!G.S.city && (p.city === G.S.city || p.places.includes(G.S.city));
  return personHere(G, id);
}

export function endGame(G, why) {
  const { S } = G;
  if (S.ended) return;
  S.ended = { why, t: S.t };
  S.queue.length = 0;
  S.queue.push({ type: 'end', why, n: ++S.cardN });
}
