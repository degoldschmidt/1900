// What the player can do, and how each card's choices are built and answered. The UI and the bots call only these.

import { DAY, T } from '../data/time.js';
import { rand, hash } from './rng.js';
import { departuresFrom, earliest, route, crossings, cancelled, delayOf, CHANGE } from './timetable.js';
import { controlOdds, pickStory, advance, confront, knowDisruption, endGame, TICK, startActivity, takeLodging } from './sim.js';
import { skill, has as trait, tongue } from './hero.js';
import { activities, watchOf, shadowed, addWatch, legendOf, SHADOWED, LODGINGS } from './residence.js';
import { context, storyChoices, resolveChoice, leave, note, log, has, hasUse, contraband, coverData, coverName, aff, caseSize, CASE_SIZE, personHere, addIntel, carriedCovers, nationNow, pro, act as actOf } from './game.js';
import { currentStep, stepCities, finishOp, activeOps } from './ops.js';
import { apply as applyEffects, all, chanceOf } from './storylet.js';
import { SUSPECT } from './enemy.js';

const HOUR = 60;
export const PUNCT_WORDS = (p) => (p >= .85 ? 'keeps time' : p >= .7 ? 'often late' : 'rarely on time');

// ---------- the departure board ----------
/** Is a cancellation known to the player? Facts are public once they happen; fictions only when heard of. */
function knownCancel(G, dp) {
  const why = cancelled(G.W, dp);
  if (!why) return null;
  if (why === 'military') return G.W.act(G.S.t) === 3 && G.W.act(dp.dep) === 3 ? why : null;
  const row = G.W.rows.find((r) => r.id === why);
  if (row?.fact && row.t <= G.S.t) return why;
  return G.S.newsSeen.includes(why) || G.S.flags[`known:${why}`] ? why : null;
}

/** Departures from here in the next hours, each with what the player can know about it. */
export function board(G, hours = 36) {
  const { S, W, I } = G;
  if (!S.city) return [];
  const list = departuresFrom(W, S.city, S.t + 5, S.t + hours * HOUR);
  const firstTo = new Map();
  return list.map((dp) => {
    const s = W.service.get(dp.svc), l = W.line.get(dp.line);
    const known = knownCancel(G, dp);
    const xs = crossings(W, dp).map((x) => ({ ...x, odds: controlOdds(G, x, { t: x.t, cls: s.fare[2] ? 2 : Number(Object.keys(s.fare)[0]), svc: s.id }) }));
    const recs = [...s.records, ...xs.map(() => 'frontier')];
    const lag = W.lagH(dp.from, dp.dep);
    const rumour = W.rumours(S.t).some((r) => r.fx.some((e) => e[0] === 'suspend' && (e[1] === `line:${dp.line}` || e[1] === `service:${dp.svc}`)));
    const isNext = !firstTo.has(dp.to) && !known;
    if (isNext) firstTo.set(dp.to, dp.key);
    const c = coverData(G);
    const forecast = has(G, 'bradshaw') && !known ? delayOf(W, dp) : null;
    return { dp, svc: s, line: l, to: dp.to, dep: dp.dep, arr: dp.arr, fares: s.fare, classes: Object.keys(s.fare).map(Number), cancelled: known, forecast,
      punct: PUNCT_WORDS(s.punct), crossings: xs, records: recs, lagH: lag, rumour, next: isNext, sleeper: s.sleeper,
      alien: xs.some((x) => x.odds.alien), alert: xs.some((x) => x.odds.alert), plaus: c ? Object.fromEntries(Object.keys(s.fare).map((k) => [k, aff(G, `class:${k}`)])) : {} };
  });
}

export function book(G, key, cls) {
  const { S, W } = G;
  const row = board(G).find((r) => r.dp.key === key);
  if (!row) return { ok: false, why: 'That train has gone.' };
  if (row.cancelled) return { ok: false, why: 'It does not run.' };
  const fare = row.fares[cls];
  if (fare === undefined) return { ok: false, why: 'No such class on that train.' };
  if (S.money < fare) return { ok: false, why: 'You cannot afford it.' };
  S.money -= fare;
  S.booked = { dp: row.dp, cls, fare, dep: row.dp.dep };
  S.trip = null;
  S.routine = null;
  S.place = 'station';
  S.stats.decisions++;
  if (row.next) S.stats.nextTrain++; else S.stats.notNext++;
  const p = aff(G, `class:${cls}`);
  if (p < 0) leave(G, 'sighting', .4, { heat: .5 }); // a count in third class is noticed
  return { ok: true };
}

/** Book a whole journey: every leg paid now, connections made on the way if the trains allow. */
export function bookTrip(G, it, cls) {
  const { S, W } = G;
  if (!S.city || !it?.legs?.length || it.legs[0].from !== S.city) return { ok: false, why: 'Not from here.' };
  const fares = it.legs.map((l) => { const f = W.service.get(l.svc).fare; return f[cls] ?? f[2] ?? f[3] ?? f[1]; });
  const total = fares.reduce((a, b) => a + b, 0);
  if (S.money < total) return { ok: false, why: 'You cannot afford the whole journey.' };
  const first = book(G, it.legs[0].key, W.service.get(it.legs[0].svc).fare[cls] !== undefined ? cls : Number(Object.keys(W.service.get(it.legs[0].svc).fare)[0]));
  if (!first.ok) return first;
  S.money -= total - fares[0];
  S.trip = { legs: it.legs, i: 0, cls, to: it.legs.at(-1).to };
  return { ok: true, total };
}

/** Up to three itineraries to a destination: fastest, safest, cheapest, on the timetable as the player knows it. */
export function plan(G, to, from = G.S.city, t = G.S.t) {
  const { S, W } = G;
  if (!from || from === to) return [];
  const usable = (dp) => !knownCancel(G, dp);
  const risk = (dp) => crossings(W, dp).reduce((a, x) => { const o = controlOdds(G, x, { t: x.t, svc: dp.svc }); return a + (o.alien || o.alert ? 50 : 0) + o.papers * 4 + o.search * 3; }, 0) + W.service.get(dp.svc).records.length;
  const fare = (dp) => { const f = W.service.get(dp.svc).fare; return f[3] ?? f[2] ?? f[1]; };
  const out = [];
  for (const [kind, cost] of [['fastest', () => 0], ['safest', (dp) => risk(dp) * 90], ['cheapest', (dp) => fare(dp) * 120]]) {
    const r = earliest(W, from, t, { usable, cost, horizon: 5 * DAY });
    const legs = route(r, to);
    if (!legs.length) continue;
    const sig = legs.map((l) => l.key).join(',');
    if (out.some((o) => o.sig === sig)) { out.find((o) => o.sig === sig).kinds.push(kind); continue; }
    out.push({ kinds: [kind], sig, legs, arr: legs.at(-1).arr, fare: legs.reduce((a, l) => a + fare(l), 0), risk: legs.reduce((a, l) => a + risk(l), 0) });
  }
  return out;
}

// ---------- in a city ----------
export function walk(G) {
  const { S } = G;
  if (!S.city || S.queue.length) return null;
  S.place = 'street';
  S.busyUntil = S.t + 60 + Math.round(rand(S) * 60);
  const st = pickStory(G, 'city');
  if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN });
  return st;
}

/** People the player can seek out here: met or known contacts present, with their best storylet. */
export function contactsHere(G) {
  const { S, I } = G;
  return G.D.people.filter((p) => personHere(G, p.id) && (S.people[p.id].st !== 'unknown' || p.city === S.city)).map((p) => ({ person: p, story: personStory(G, p.id) })).filter((x) => x.story);
}
function personStory(G, id) {
  const { S, I } = G;
  const ctx = context(G);
  const st = S.people[id];
  const entry = I.story.get(I.person.get(id).entry);
  if (st.st === 'unknown' && entry && all(entry.if, ctx)) return entry;
  const list = (I.atList.person ?? []).filter((s) => s.speaker === id && !(s.once && S.seen[s.id]) && all(s.if, ctx));
  if (!list.length) return null;
  return list.reduce((a, b) => ((b.w ?? 1) > (a.w ?? 1) ? b : a));
}
export function seek(G, id) {
  const { S } = G;
  const s = personStory(G, id);
  if (!s) return null;
  if (s.once) S.seen[s.id] = true;
  S.busyUntil = S.t + 45;
  meetingTrace(G, id);
  S.queue.push({ type: 'story', id: s.id, person: id, n: ++S.cardN });
  return s;
}
/** Meeting a contact leaves a trace only if someone is watching: a tail, a watched contact, a traitor. */
function meetingTrace(G, id) {
  const { S } = G;
  const ps = S.people[id];
  (ps.covers ??= []).includes(S.cover) || ps.covers.push(S.cover);
  if (ps.st === 'unknown') ps.st = 'met';
  if (S.tailedBy) leave(G, 'meeting', 1, { person: id });
  else if ((ps.loyal ?? '').startsWith('enemy:')) leave(G, 'meeting', .7, { person: id, heat: .6 });
  else if (ps.exp >= .5) leave(G, 'meeting', .5, { person: id });
}

/** Where to sleep tonight. */
export function setLodging(G, place) {
  const { S } = G;
  if (place === 'safehouse' && !safehouseHere(G)) return false;
  if (S.lodging?.city === S.city && S.lodging.kind === place) return false;
  S.stats.decisions++;
  return takeLodging(G, place);
}

// ---------- the day in a city ----------
export { activities };
/** Spend the rest of this watch of the day on an activity. */
export function doActivity(G, id) {
  const { S } = G;
  const a = activities(G).find((x) => x.id === id);
  if (!a || !a.open || S.queue.length) return false;
  S.routine = null;
  S.stats.decisions++;
  startActivity(G, id);
  return true;
}
/** Let the days pass: the routine runs until something needs you, or for at most `days` days. */
export function passDays(G, days = 7) {
  const { S } = G;
  if (!S.city || S.queue.length) return false;
  S.routine = { until: S.t + days * DAY };
  S.stats.decisions++;
  return true;
}
export const stopRoutine = (G) => { G.S.routine = null; };
export const safehouseHere = (G) => G.D.people.some((p) => p.city === G.S.city && p.perks.includes('safehouse') && G.S.people[p.id].st === 'recruited');

export function switchCover(G, id) {
  const { S } = G;
  const c = S.covers[id];
  if (!c || c.burned || !c.carried || id === S.cover) return { ok: false, why: 'Not possible.' };
  if (!S.city) return { ok: false, why: 'Not on a train.' };
  const old = S.cover;
  if (S.tailedBy) leave(G, 'link', 1, { cover: old, other: id }); // seen going in as one man and out as another
  S.cover = id;
  S.busyUntil = Math.max(S.busyUntil, S.t) + 60;
  S.stats.decisions++;
  log(G, `Now travelling as ${coverName(G)}.`);
  return { ok: true };
}

/** Leave a set of papers in this city (or take them back): only the papers you carry can be found in a search. */
export function stash(G, id) {
  const { S } = G;
  const c = S.covers[id];
  if (!c || !S.city || id === S.cover || !c.carried) return false;
  c.carried = false; c.stash = S.city;
  log(G, `Left the papers of ${coverName(G, id)} in ${G.I.city.get(S.city).name}.`);
  return true;
}
export function retrieve(G, id) {
  const { S } = G;
  const c = S.covers[id];
  if (!c || c.carried || c.stash !== S.city || (c.ready ?? 0) > S.t) return false;
  c.carried = true; c.stash = null; c.ready = null;
  return true;
}
/** Papers left with the Bureau in London can be sent for by the embassy bag: two days, a fee, and a visit to the
 *  embassy that someone may watch. Safer than carrying a second passport through the customs. */
export const BAG = { days: 2, fee: 3 };
export function sendFor(G, id) {
  const { S, I } = G;
  const c = S.covers[id];
  if (!c || c.burned || c.carried || c.stash !== 'LON' || !S.city || S.city === 'LON' || S.money < BAG.fee) return false;
  S.money -= BAG.fee;
  c.stash = S.city; c.ready = S.t + BAG.days * DAY;
  leave(G, 'sighting', .3, { heat: .1 });
  S.stats.decisions++;
  log(G, `Wired the Bureau for the papers of ${coverName(G, id)}: the bag reaches ${I.city.get(S.city).name} in two days.`);
  return true;
}

export function checkTail(G) {
  const { S } = G;
  S.busyUntil = Math.max(S.busyUntil, S.t) + 90;
  S.stats.decisions++;
  const eye = .06 * skill(S.hero, 'observation') + .04 * skill(S.hero, 'tradecraft');
  const police = shadowed(G);
  const seen = S.tailedBy ? rand(S) < .7 + eye : police ? rand(S) < .55 + eye : rand(S) < .08 - eye / 2;
  S.knownTail = seen && (!!S.tailedBy || police);
  const h = S.tailedBy ? G.I.hunter.get(S.tailedBy) : null;
  note(G, 'A long walk', seen ? (h ? `Twice round the square and back by the arcade. ${cap(h.look)} keeps forty yards behind you.` : police ? 'A plain-clothes man with a policeman\'s boots stops when you stop, and studies a shop window full of corsets.' : 'A man in a brown coat stops when you stop. Or does he?') : 'Nobody follows. Or nobody you can see.');
  if (seen) addIntel(G, { subj: 'cover:active', claim: { note: h ? `followed by ${h.name}` : 'followed in the street' }, src: 'seen', rel: h || police ? .9 : .4, truth: !!h || police });
  return seen;
}
export function shakeTail(G) {
  const { S } = G;
  S.busyUntil = Math.max(S.busyUntil, S.t) + 120;
  S.nerve = Math.max(0, S.nerve - 1);
  S.stats.decisions++;
  const p = .5 + (S.nerve >= 6 ? .15 : 0) + (G.I.city.get(S.city).capital ? .1 : 0) + .08 * skill(S.hero, 'tradecraft');
  if (!S.tailedBy) { // only the police shadow: lose him for the day, at the cost of looking like someone with a reason to
    if (shadowed(G) && rand(S) < p) { S.shookUntil = Math.floor(S.t / DAY) * DAY + DAY + 6 * HOUR; addWatch(G, .05); S.knownTail = false; note(G, 'Lost him', 'In at the front of the Arcade, out by the tradesmen\'s door. For the rest of the day nobody follows you; tomorrow, someone will be told to try harder.'); return true; }
    return false;
  }
  if (rand(S) < p) { const h = S.tailedBy; S.tailedBy = null; S.knownTail = false; leave(G, 'sighting', .5, { heat: .4 }); note(G, 'Lost him', 'Through a department store, out by the goods door, onto a moving tram. You are alone.'); log(G, `Shook off ${G.I.hunter.get(h).name}.`); return true; }
  confront(G, S.tailedBy, 'tail');
  return false;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------- the market ----------
export function market(G) {
  const { S, W, I } = G;
  if (!S.city) return { buy: [], sell: [] };
  const c = skill(S.hero, 'commerce');
  const buy = G.D.items.filter((it) => it.city === S.city && it.price !== null).map((it) => ({ item: it, price: Math.max(1, Math.round(it.price * W.price(it.id, S.city, S.t) * (1 - .05 * c))) }));
  const sell = S.case.map((x) => I.item.get(x.id)).filter((it) => it && it.sell[S.city] !== undefined).map((it) => ({ item: it, price: Math.round(it.sell[S.city] * W.price(it.id, S.city, S.t) * (1 + .06 * c)) }));
  return { buy, sell };
}
export function buy(G, id) {
  const { S, I } = G;
  const o = market(G).buy.find((x) => x.item.id === id);
  if (!o || S.money < o.price) return false;
  if (caseSize(G) + o.item.size > CASE_SIZE) return false;
  S.money -= o.price;
  S.case.push({ id, t: S.t });
  S.stats.decisions++;
  if (o.item.tags.includes('contraband')) leave(G, 'sighting', .3, { heat: .2 });
  return true;
}
export function sell(G, id) {
  const { S } = G;
  const o = market(G).sell.find((x) => x.item.id === id);
  if (!o) return false;
  const i = S.case.findIndex((x) => x.id === id);
  S.case.splice(i, 1);
  S.money += o.price;
  S.stats.decisions++;
  return true;
}

// ---------- operations ----------
/** The act or meet the player can do here for active operations, with ways and whether each is open. */
export function opActions(G) {
  const { S, I } = G;
  const out = [];
  if (!S.city) return out;
  for (const o of activeOps(G)) {
    const step = currentStep(G, o.id);
    if (!step || !['act', 'meet'].includes(step.kind)) continue;
    if (step.after && S.t < T(step.after)) continue;
    if (step.kind === 'meet') {
      const p = I.person.get(step.person);
      const where = [step.city ?? p.city].flat().filter(Boolean);
      if (where.length && !where.includes(S.city)) continue;
      if (['arrested', 'dead'].includes(S.people[step.person]?.st)) continue;
      // an order that names the city has arranged the meeting there; otherwise the person must be about
      if (!step.city && !personHere(G, step.person) && p.city !== S.city) continue;
      out.push({ op: o, step, ways: (step.ways ?? [{ id: 'meet', label: `Meet ${p.name}`, risk: 0 }]).map((w) => wayView(G, o, step, w)) });
      continue;
    }
    if (!(stepCities(step).includes(S.city) || step.city === '*')) continue;
    const ctx = context(G, { op: o.id });
    const openNow = (!step.clock || all([['clock', step.clock[0], step.clock[1]]], ctx)) && (!step.days || step.days.includes(String(ctx.dow())));
    out.push({ op: o, step, closed: !openNow, ways: step.ways.map((w) => wayView(G, o, step, w)) });
  }
  return out;
}
function wayView(G, o, step, w) {
  const ctx = context(G, { op: o.id });
  const tried = G.S.ops[o.id].way[`${step.id}:${w.id}`] === 'noticed';
  const plaus = step.venue ? aff(G, step.venue) : 1;
  const risk = Math.min(.95, (w.risk ?? 0) + (plaus < 0 ? .2 : plaus === 0 ? .07 : 0) + (G.S.tailedBy ? .15 : 0));
  return { way: w, open: all(w.if, ctx) && !tried, afford: (w.cost?.money ?? 0) <= G.S.money && (w.cost?.nerve ?? 0) <= G.S.nerve, risk, plaus, tried };
}
export function doWay(G, opId, wayId) {
  const { S, I } = G;
  const a = opActions(G).find((x) => x.op.id === opId);
  const v = a?.ways.find((x) => x.way.id === wayId);
  if (!a || !v || !v.open || !v.afford || a.closed) return false;
  const { step } = a, w = v.way;
  const ctx = context(G, { op: opId });
  S.stats.decisions++;
  if (w.cost?.money) S.money -= w.cost.money;
  if (w.cost?.nerve) S.nerve = Math.max(0, S.nerve - w.cost.nerve);
  S.busyUntil = Math.max(S.busyUntil, S.t) + (w.cost?.min ?? 60);
  S.ops[opId].wayUsed = { ...(S.ops[opId].wayUsed ?? {}), [step.id]: w.id };
  if (step.kind === 'meet') meetingTrace(G, step.person);
  if (w.story) { S.queue.push({ type: 'story', id: w.story, op: opId, n: ++S.cardN }); return true; }
  if (step.kind === 'meet' && !step.ways) { finishStep(G, opId, step.id); return true; }
  const noticed = rand(S) < v.risk;
  const rec = w.rec ?? null;
  if (noticed) {
    S.ops[opId].way[`${step.id}:${w.id}`] = 'noticed';
    if (rec) leave(G, rec[0], 1, { heat: .6 }); else leave(G, 'sighting', .8, { heat: .6 });
    applyEffects(w.fail, ctx);
    note(G, 'Noticed', `${w.label}: it did not go unseen. The way is shut; you will have to find another.`);
  } else {
    if (rec) leave(G, rec[0], rec[1]);
    if (v.plaus === 0 && step.venue) leave(G, 'sighting', .3, { heat: .2 });
    applyEffects(w.ok, ctx);
    finishStep(G, opId, step.id);
  }
  return true;
}
function finishStep(G, opId, stepId) { applyEffects([['op', opId, `step:${stepId}`]], context(G, { op: opId })); }

// ---------- waiting, lying low, the wire ----------
/** Let time pass for `min` minutes (or until a card). */
export function wait(G, min) { G.S.busyUntil = Math.max(G.S.busyUntil, G.S.t) + min; return advance(G, G.S.busyUntil); }

/** When no order is pending: an interlude, then time skips to the next telegram. */
export function canLieLow(G) {
  const { S, D } = G;
  if (!S.city || activeOps(G).some((o) => !o.side)) return null;
  const next = D.ops.filter((o) => !o.side && S.ops[o.id].status === 'pending' && o.issue).map((o) => T(o.issue)).sort((a, b) => a - b)[0];
  return next && next - S.t > 6 * HOUR ? next : null;
}
export function lieLow(G) {
  const { S } = G;
  const until = canLieLow(G);
  if (!until) return false;
  S.lyingLow = until;
  const st = pickStory(G, 'interlude');
  if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN });
  return true;
}

/** Ask London about a person: the answer comes in a day or two, and is not always right. */
export function wireQuery(G, person) {
  const { S } = G;
  if (!S.city || S.money < 2) return false;
  S.money -= 2;
  (S.queries ??= []).push({ person, at: S.t + (24 + Math.round(rand(S) * 24)) * HOUR });
  leave(G, 'wire', .4);
  S.stats.decisions++;
  log(G, `Wired London about ${G.I.person.get(person).name}.`);
  return true;
}

/** A recruited forger mends the papers of the active cover. */
export function mendPapers(G, person) {
  const { S } = G;
  const p = G.I.person.get(person);
  if (!p?.perks.includes('papers') || S.people[person].st !== 'recruited' || !personHere(G, person) || S.money < 5) return false;
  S.money -= 5;
  S.covers[S.cover].papers = Math.min(1, S.covers[S.cover].papers + .15);
  S.busyUntil = Math.max(S.busyUntil, S.t) + 3 * HOUR;
  meetingTrace(G, person);
  S.stats.decisions++;
  log(G, `${p.name} mends the papers of ${coverName(G)}.`);
  return true;
}

/** A recruited courier takes a document to London for you; it arrives in two days, if the courier is not stopped. */
export function sendCourier(G, person, item) {
  const { S } = G;
  const p = G.I.person.get(person);
  if (!p?.perks.includes('courier') || S.people[person].st !== 'recruited' || !personHere(G, person) || !has(G, item)) return false;
  S.case.splice(S.case.findIndex((x) => x.id === item), 1);
  const companion = G.I.item.get(item)?.fn === 'companion';
  const dest = companion ? (G.D.ops.map((o) => o.steps.find((st) => st.kind === 'carry' && st.item === item)).find(Boolean)?.to ?? 'LON') : 'LON';
  S.later.push({ at: S.t + (companion ? 60 : 48) * HOUR, until: S.t + 100 * HOUR, courier: { person, item, to: [dest].flat()[0] } });
  S.stats.decisions++;
  log(G, `${p.name} takes ${G.I.item.get(item).name.replace(/,.*$/, '').toLowerCase()} on, out of your hands.`);
  return true;
}

/** Use a tool from the case: brandy for nerve, a letter of credit at a bank. */
export function useItem(G, id) {
  const { S, I, W } = G;
  const it = I.item.get(id);
  if (!it || !has(G, id)) return false;
  if (it.tags.includes('use:nerve')) { S.case.splice(S.case.findIndex((x) => x.id === id), 1); S.nerve = Math.min(10, S.nerve + (trait(S.hero, 'drink') ? 5 : 3)); log(G, `${it.name}: courage, of a kind.`); S.stats.decisions++; return true; }
  if (it.tags.includes('use:credit')) {
    if (!S.city || !I.city.get(S.city).venues.includes('venue:bank')) return false;
    if (!W.credit(S.t)) { note(G, 'No credit', 'The cashier shakes his head: the exchanges are closed, and no letter of credit will be honoured until the crisis is over.'); return false; }
    if ((S.lastCredit ?? -Infinity) > S.t - 2 * 1440) return false;
    S.lastCredit = S.t; S.money += 20; leave(G, 'register', .5); S.stats.decisions++;
    log(G, 'Drew £20 against the letter of credit.');
    return true;
  }
  return false;
}
export const usable = (G, id) => { const it = G.I.item.get(id); return !!it && (it.tags.includes('use:nerve') || (it.tags.includes('use:credit') && !!G.S.city && G.I.city.get(G.S.city).venues.includes('venue:bank'))); };

export function wireFunds(G) {
  const { S } = G;
  if (!S.city) return false;
  S.money += 15;
  S.standing = Math.max(0, S.standing - 4);
  leave(G, 'wire', .5);
  S.stats.decisions++;
  log(G, 'The Bureau wires £15, with a sharp word.');
  return true;
}

// ---------- cards ----------
/** The card on top, with its choices (data choices, plus the standard ones for controls and encounters). */
export function cardView(G) {
  const { S, I } = G;
  let card = S.queue[0];
  while (card && card.type === 'story' && !I.story.get(card.id)) { S.queue.shift(); card = S.queue[0]; } // a storylet that no longer exists
  if (!card) return null;
  if (card.type === 'story') { const s = I.story.get(card.id); const ch = storyChoices(G, s, card); return { card, story: s, choices: ch.length ? ch : [{ label: 'Continue', ok: [], std: 'continue', open: true, afford: true }] }; }
  if (card.type === 'control') { const s = card.story ? I.story.get(card.story) : null; return { card, story: s, choices: [...controlChoices(G, card), ...(s ? storyChoices(G, s, card).slice(0, 2) : [])] }; }
  if (card.type === 'encounter') { const s = card.story ? I.story.get(card.story) : null; return { card, story: s, choices: [...encounterChoices(G, card), ...(s ? storyChoices(G, s, card).slice(0, 2) : [])] }; }
  if (card.type === 'missed') return { card, choices: missedChoices(G, card) };
  if (card.type === 'late') return { card, choices: [
    { std: 'hold', label: 'Telegraph ahead to hold the connection', sub: '£1; the station-master may oblige', cost: 1, p: .45 + .05 * skill(S.hero, 'charm'), open: true, afford: S.money >= 1 },
    { std: 'continue', label: 'Sit back and hope', open: true, afford: true }] };
  if (card.type === 'inspector') return { card, choices: inspectorChoices(G) };
  if (card.type === 'telegram' && I.op.get(card.op)?.optional && S.ops[card.op].status === 'active') return { card, choices: [
    { std: 'accept', label: 'Accept the job', open: true, afford: true }, { std: 'decline', label: 'Decline it', sub: 'Ashby will not hold it against you, much', open: true, afford: true }] };
  return { card, choices: [{ label: card.type === 'end' ? 'The end' : 'Continue', ok: [], std: 'continue', open: true, afford: true }] };
}

/** Answer the top card with choice index i. */
export function choose(G, i) {
  const { S } = G;
  const view = cardView(G);
  if (!view) return null;
  const c = view.choices[i];
  if (!c || !c.open || c.afford === false) return null;
  const card = S.queue.shift();
  if (card.type === 'end') { S.queue.unshift(card); return null; }
  if (card.person && card.type === 'story') { const ps = S.people[card.person]; (ps.covers ??= []).includes(S.cover) || ps.covers.push(S.cover); }
  if (c.std) return std(G, card, c);
  const res = resolveChoice(G, c, card);
  if (res.next) {
    const n = G.I.story.get(res.next);
    if (n && all(n.if, context(G, card))) S.queue.unshift({ type: 'story', id: n.id, op: card.op, person: card.person, hunter: card.hunter, n: ++S.cardN });
  }
  if (card.type === 'control' && !S.queue.some((q) => q.type === 'control')) passControl(G, card, 'story');
  if (S.lyingLow && card.type === 'story' && !S.queue.length) { const u = S.lyingLow; S.lyingLow = null; G.S.enemy && cool(G); S.busyUntil = u; }
  return res;
}
function cool(G) { for (const d of Object.values(G.S.enemy.dossiers)) if (!d.name) d.susp *= .7; G.S.enemy.desc *= .85; }

// ---------- frontier control choices ----------
function controlChoices(G, card) {
  const { S, I, W } = G;
  const N = I.nation.get(card.into);
  const cb = contraband(G), pouch = hasUse(G, 'pouch'), lining = hasUse(G, 'lining');
  const spare = carriedCovers(G).filter((c) => c !== S.cover);
  const papers = S.covers[S.cover]?.papers ?? .5;
  const desc = S.enemy.desc * (I.ground.includes(card.into) ? .3 : .1);
  const out = [];
  const companion = S.case.some((x) => I.item.get(x.id)?.fn === 'companion');
  const pw = .05 * skill(S.hero, 'paperwork'), cmp = .06 * skill(S.hero, 'composure'), lang = [-.12, .05, .1][tongue(S.hero, card.into)];
  const pPapers = card.alien ? .05 : card.alert ? .1 + cmp / 2 : Math.max(.05, Math.min(.95, .35 + papers * .6 - desc - (companion ? .12 : 0) + pw));
  if (card.papers || card.search) out.push({ std: 'papers', label: card.papers ? `Show the papers of ${coverName(G)}` : 'Open your case', sub: card.search ? 'They will search the case' : companion ? 'Two sets of papers to satisfy him' : 'Your name goes in their book', p: card.papers ? pPapers : 1, open: true, afford: true });
  if (card.search && cb.length) out.push({ std: 'declare', label: 'Declare what you carry', sub: `Lose ${cb.map((x) => I.item.get(x.id).name.toLowerCase()).join(', ')}`, open: true, afford: true });
  if (card.search && pouch) out.push({ std: 'pouch', label: 'Claim the diplomatic bag', sub: 'Not searched; but remembered', open: true, afford: true });
  const bribe = 2 + 2 * actOf(G);
  out.push({ std: 'bribe', label: `Fold £${bribe} into the passport`, sub: N.bribe >= .5 ? 'Officials here are known to oblige' : 'Officials here are not known to oblige', cost: bribe, open: true, afford: S.money >= bribe, p: Math.min(.95, N.bribe + (S.journey?.cls === 1 ? .1 : 0) - (card.alert ? .3 : 0) + .05 * skill(S.hero, 'streetwise')) });
  if (S.nerve >= 1) out.push({ std: 'talk', label: 'Talk your way through', sub: tongue(S.hero, card.into) === 0 ? 'Costs nerve; you do not speak his language' : 'Costs nerve', open: true, afford: true, p: Math.max(.05, .4 + (coverData(G)?.nation === 'CH' ? .15 : 0) + cmp + lang - (card.alien ? .4 : 0) - (card.alert ? .25 : 0)) });
  return out.map((c) => ({ ...c, spare, lining }));
}

function std(G, card, c) {
  const { S } = G;
  S.stats.decisions++;
  if (card.type === 'control') return controlOutcome(G, card, c);
  if (card.type === 'encounter') return encounterOutcome(G, card, c);
  if (card.type === 'missed') return missedOutcome(G, card, c);
  if (card.type === 'inspector') return inspectorOutcome(G, c);
  if (card.type === 'late') {
    if (c.std === 'hold') { S.money -= 1; if (rand(S) < c.p) { if (S.trip) S.trip.held = card.next; log(G, 'The connection will wait, a little.'); return { success: true }; } return { success: false }; }
    return { success: true };
  }
  if (card.type === 'telegram' && c.std === 'decline') { S.ops[card.op].status = 'declined'; S.standing = Math.max(0, S.standing - 2); log(G, `Declined: ${G.I.op.get(card.op).title}.`); return { success: true }; }
  if (['telegram', 'debrief', 'news', 'note', 'arrive', 'act', 'story'].includes(card.type)) {
    if (S.lyingLow && !S.queue.length) { const u = S.lyingLow; S.lyingLow = null; cool(G); S.busyUntil = u; }
    return { success: true };
  }
  return { success: true };
}

function controlOutcome(G, card, c) {
  const { S, I } = G;
  if (trait(S.hero, 'nervous')) S.nerve = Math.max(0, S.nerve - 1);
  const x = { fid: card.fid, name: card.name };
  if (c.std === 'bribe') {
    S.money -= c.cost;
    if (rand(S) < c.p) { leave(G, 'bribe', .3); log(G, `Bought a quiet passage at ${card.name}.`); return search(G, card, { skip: true }); }
    leave(G, 'bribe', 1); detain(G, card, 3 * HOUR, 'The officer pockets the money and calls his sergeant.');
    return { success: false };
  }
  if (c.std === 'talk') {
    S.nerve = Math.max(0, S.nerve - 1);
    if (rand(S) < c.p) { leave(G, 'frontier', .45); return search(G, card, { skip: rand(S) < .5 }); }
    detain(G, card, 2 * HOUR, 'He hears you out, then asks you to step down from the train.');
    return { success: false };
  }
  if (c.std === 'declare') {
    for (const x of contraband(G)) S.case.splice(S.case.findIndex((y) => y.id === x.id), 1);
    leave(G, 'frontier', .8);
    log(G, `Declared and surrendered contraband at ${card.name}.`);
    return { success: true };
  }
  if (c.std === 'pouch') { leave(G, 'frontier', .6, { heat: .1 }); return { success: true }; }
  // papers
  if (card.papers) {
    if (card.alien || card.alert || rand(S) >= c.p) {
      leave(G, 'frontier', 1, { heat: card.alert ? 1 : .3 });
      if ((card.alert || card.alien) && G.W.act(S.t) === 3) return arrest(G, card);
      detain(G, card, card.alert || card.alien ? 8 * HOUR : 2 * HOUR, card.alien ? `Your papers make you an enemy alien here.` : card.alert ? 'Your name is on a list in the commissioner\'s pocket.' : 'The papers do not satisfy him.');
      return { success: false };
    }
    leave(G, 'frontier', .8);
  }
  return search(G, card, {});
}

function search(G, card, o) {
  const { S, I } = G;
  if (!card.search || o.skip) { passControl(G, card, 'papers'); return { success: true }; }
  if (hasUse(G, 'pouch')) { passControl(G, card, 'pouch'); return { success: true }; }
  let found = contraband(G).map((x) => x.id);
  if (hasUse(G, 'lining') && found.length) found = found.slice(1);
  const spare = carriedCovers(G).filter((c) => c !== S.cover);
  const spareFound = spare.length && !(hasUse(G, 'lining') && !contraband(G).length) && rand(S) < .5; // tucked in a book, perhaps missed
  if (!found.length && !spareFound) { passControl(G, card, 'search'); return { success: true }; }
  for (const id of found) { const i = S.case.findIndex((y) => y.id === id); if (i >= 0) S.case.splice(i, 1); }
  if (spareFound) { // a second set of papers: both names are burned
    for (const c of [S.cover, ...spare]) { S.covers[c].burned = true; leave(G, 'frontier', 1, { cover: c, heat: 1 }); }
    note(G, 'Two names, one face', `The customs man holds up a second passport. Both names are finished now.`);
  } else leave(G, 'frontier', 1, { heat: .5 });
  if (found.length) S.money = Math.max(0, S.money - 5);
  detain(G, card, 4 * HOUR, `They find ${found.map((id) => I.item.get(id).name.toLowerCase()).join(' and ') || 'the papers'}.`);
  return { success: false };
}
function passControl(G, card) { log(G, `Through the control at ${card.name}.`); }

function detain(G, card, minutes, why) {
  const { S } = G;
  S.stats.detained++;
  S.nerve = Math.max(0, S.nerve - 1);
  if (S.journey) { S.journey.arr += minutes; for (const x of S.journey.crossings) if (!x.done) x.t += minutes; }
  else S.busyUntil = Math.max(S.busyUntil, S.t) + minutes;
  note(G, `Detained at ${card.name}`, `${why} ${Math.round(minutes / 60)} hours lost; your train goes on, and you follow on the next.`);
}
function arrest(G, card) {
  const { S } = G;
  note(G, `Arrested at ${card.name}`, 'Two gendarmes, a locked waiting room, and a telegram to Berlin. Your war is over.');
  endGame(G, 'arrested');
  return { success: false };
}

// ---------- missed connections ----------
function missedChoices(G, card) {
  const { S, W, I } = G;
  const trip = S.trip;
  const final = trip?.to ?? card.to;
  const its = plan(G, final).slice(0, 2);
  const out = its.map((it, i) => ({ std: 'reroute', it, label: `${i === 0 ? 'Take' : 'Or take'} the ${hmText(it.legs[0].dep)} ${W.service.get(it.legs[0].svc).name}`, sub: `to ${I.city.get(it.legs[0].to).name}; in ${I.city.get(final).name} ${whenText(it.arr)}`, open: true, afford: true }));
  out.push({ std: 'stay', label: `Give up the journey at ${I.city.get(S.city).name}`, sub: 'take a room, think again', open: true, afford: true });
  return out;
}
function missedOutcome(G, card, c) {
  const { S, W } = G;
  if (c.std === 'reroute') {
    const cls = S.trip?.cls ?? 2;
    S.trip = null;
    S.booked = null;
    const r = bookTrip(G, c.it, cls);
    if (!r.ok) { note(G, 'Stranded', 'There is not enough in your purse for the new tickets. You will have to find the money, or another way.'); S.queue.push({ type: 'arrive', city: S.city, delay: 0, n: ++S.cardN }); return { success: false }; }
    return { success: true };
  }
  S.trip = null;
  S.queue.push({ type: 'arrive', city: S.city, delay: 0, n: ++S.cardN });
  return { success: true };
}
const hmText = (t) => { const m = ((t % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`; };
const whenText = (t) => `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][((Math.floor(t / 1440) % 7) + 7) % 7]} ${hmText(t)}`;

// ---------- the inspector calls ----------
function inspectorChoices(G) {
  const { S, I } = G;
  const L = legendOf(G), N = I.nation.get(I.city.get(S.city).nation);
  const alerted = !!S.enemy.dossiers[S.cover]?.name;
  const bribe = 3 + 2 * actOf(G);
  return [
    { std: 'answer', label: 'Answer every question', sub: L >= .5 ? 'Your life here bears looking into' : 'Your life here is thin', p: Math.max(.05, Math.min(.95, .3 + .5 * L + .05 * skill(S.hero, 'composure') - (alerted ? .3 : 0))), open: true, afford: true },
    { std: 'papers', label: 'Produce papers and a reference', sub: 'He will write it all down', p: Math.max(.05, Math.min(.95, .25 + (S.covers[S.cover]?.papers ?? .5) * .5 + .06 * skill(S.hero, 'paperwork') - (alerted ? .3 : 0))), open: true, afford: true },
    { std: 'fund', label: `£${bribe} for the police widows' fund`, sub: N.bribe >= .5 ? 'It is done here' : 'It is not much done here', cost: bribe, p: Math.min(.9, N.bribe + .05 * skill(S.hero, 'streetwise')), open: true, afford: S.money >= bribe },
    { std: 'leave', label: 'Promise to leave within the day', sub: 'No questions asked; no staying either', open: true, afford: true },
  ];
}
function inspectorOutcome(G, c) {
  const { S, I } = G;
  const onGround = I.ground.includes(I.city.get(S.city).nation);
  const expel = (why) => { S.expelled = { city: S.city, by: S.t + 24 * HOUR }; note(G, 'Ordered to leave', `${why} You have until this time tomorrow to be gone from ${I.city.get(S.city).name}.`); };
  if (c.std === 'leave') { addWatch(G, -.2); expel('He bows, satisfied.'); return { success: true }; }
  if (c.std === 'fund') {
    S.money -= c.cost;
    if (rand(S) < c.p) { addWatch(G, -.35); leave(G, 'bribe', .2); log(G, 'The inspector is grateful on behalf of the widows.'); return { success: true }; }
    leave(G, 'bribe', 1); addWatch(G, .2);
    if (onGround && G.W.act(S.t) === 3) { note(G, 'Arrested', 'He counts the money twice, then calls the constable from the stairs.'); endGame(G, 'arrested'); return { success: false }; }
    expel('He returns the money with a look you will remember.');
    return { success: false };
  }
  if (rand(S) < c.p) { addWatch(G, -.3); leave(G, c.std === 'papers' ? 'register' : 'calm', c.std === 'papers' ? .7 : .25); log(G, 'The inspector leaves, apparently content.'); return { success: true }; }
  addWatch(G, .1);
  leave(G, 'sighting', .8, { heat: .4 });
  if (onGround && G.W.act(S.t) === 3) { note(G, 'Arrested', 'He closes his notebook. "You will come with me, please." The please is a formality.'); endGame(G, 'arrested'); return { success: false }; }
  expel('He is not satisfied, and says so in the language of the regulations.');
  return { success: false };
}

// ---------- encounters ----------
function encounterChoices(G, card) {
  const { S, I } = G;
  const d = S.enemy.dossiers[S.cover];
  const known = !!d?.name, photo = S.enemy.photo;
  const out = [];
  out.push({ std: 'brazen', label: 'Brazen it out', sub: known ? 'He knows the name you travel under' : 'He may not be sure of you', open: true, afford: true, p: Math.max(.05, .62 - (known ? .3 : 0) - (photo ? .25 : 0) + (coverData(G)?.nation === 'CH' ? .08 : 0) + .05 * skill(S.hero, 'composure')) });
  out.push({ std: 'slip', label: S.journey ? 'Get down at the next halt' : 'Slip away through the crowd', sub: 'Costs nerve', open: S.nerve >= 1, afford: true, p: .6 + (S.journey ? -.1 : 0) + .07 * skill(S.hero, 'tradecraft') });
  out.push({ std: 'porter', label: 'Pay a porter to delay him', sub: '£3', open: true, afford: S.money >= 3, p: .7 + .05 * skill(S.hero, 'streetwise') });
  if (S.case.some((x) => I.item.get(x.id)?.tags.includes('weapon'))) out.push({ std: 'pistol', label: 'Draw the pistol', sub: 'There will be no hiding afterwards', open: true, afford: true, p: .75 });
  out.push({ std: 'quiet', label: 'Go quietly', sub: card.kind === 'arrest' ? 'This is his ground' : 'He cannot hold you long here', open: true, afford: true });
  return out;
}

function encounterOutcome(G, card, c) {
  const { S, I, W } = G;
  const h = I.hunter.get(card.hunter), st = S.enemy.hunters[card.hunter];
  const onGround = h.ground.includes(nationNow(G));
  const caught = () => {
    if (W.act(S.t) === 3 && onGround) { note(G, 'Taken', `${h.name} does not raise ${pro(h, 'his')} voice. ${pro(h, 'he', true)} does not need to.`); endGame(G, 'captured'); return { success: false }; }
    if (!onGround) { // he cannot hold you here; he can look at you, long and well
      leave(G, 'photo', .7, { heat: .6 });
      S.nerve = Math.max(0, S.nerve - 2);
      S.busyUntil = Math.max(S.busyUntil, S.t) + 3 * HOUR;
      st.idleUntil = S.t + 3 * HOUR;
      note(G, 'A long look', `${h.name} cannot arrest you here, and knows it. ${pro(h, 'he', true)} walks beside you for a street, studying your face as if to learn it by heart. A man with a camera waits at the corner.`);
      return { success: false };
    }
    return detainedByHunter(G, h, onGround);
  };
  const away = (fid, txt) => { leave(G, 'sighting', fid, { heat: .4 }); S.tailedBy = null; S.knownTail = false; st.idleUntil = S.t + 2 * HOUR; if (txt) log(G, txt); return { success: true }; };
  if (c.std === 'brazen') return rand(S) < c.p ? away(.5, `${h.name} was not sure enough.`) : caught();
  if (c.std === 'slip') { S.nerve = Math.max(0, S.nerve - 1); if (S.journey) { S.journey.arr += 3 * HOUR; } return rand(S) < c.p ? away(.4, `Gave ${h.name} the slip.`) : caught(); }
  if (c.std === 'porter') { S.money -= 3; if (rand(S) < c.p) { st.idleUntil = S.t + 4 * HOUR; st.leg = null; return away(.3, 'A porter\'s barrow and a broken strap held him long enough.'); } leave(G, 'sighting', .9, { heat: .4 }); return caught(); }
  if (c.std === 'pistol') { S.nerve = Math.max(0, S.nerve - 2); S.standing = Math.max(0, S.standing - 6); leave(G, 'sighting', 1, { heat: 1 }); return rand(S) < c.p ? away(1, `${h.name} stepped back from the pistol. Every policeman in the country will have your description by night.`) : caught(); }
  return caught();
}

/** Held by a hunter where he cannot keep you: questioned, photographed, let go; the cover is finished. */
function detainedByHunter(G, h, onGround) {
  const { S } = G;
  S.stats.detained++;
  S.covers[S.cover].burned = true;
  leave(G, 'photo', 1, { heat: 1 });
  S.enemy.photo = true;
  S.busyUntil = Math.max(S.busyUntil, S.t) + (onGround ? 36 : 12) * HOUR;
  S.standing = Math.max(0, S.standing - (onGround ? 15 : 8));
  S.nerve = Math.max(0, S.nerve - 2);
  S.tailedBy = null;
  note(G, 'Questioned', `${h.name} keeps you ${onGround ? 'a day and a half' : 'half a day'} in a room without a window. A photographer comes. Then a door opens, and you are let go: the name of ${coverName(G)} is worth nothing now.`);
  const next = Object.entries(S.covers).find(([, v]) => !v.burned && v.carried);
  if (next) S.cover = next[0];
  else if (!S.covers.self) { S.covers.self = { papers: .9, carried: true, burned: false, gained: S.t }; S.cover = 'self'; note(G, 'Your own name', 'No borrowed name is left to you. From here you travel as yourself, on a British passport that is perfectly genuine, and perfectly easy to trace.'); }
  else endGame(G, 'exposed');
  return { success: false };
}

export { advance, crossings, endGame, TICK };
