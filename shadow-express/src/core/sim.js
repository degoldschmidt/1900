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
  for (const l of S.later) n = Math.min(n, Math.max(l.at, S.t + 1));
  return n;
}

function tick(G) {
  const { S, W } = G;
  if (S.booked && S.t >= S.booked.dep) depart(G);
  if (S.journey) journeyStep(G);
  enemyStep(G);
  if (!S.journey) encounters(G); else trainEncounter(G);
  dueLaters(G);
  calendar(G);
  checkOps(G);
  people(G);
  perish(G);
  nights(G);
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
  if (S.t >= j.arr) arrive(G);
}

function arrive(G) {
  const { S, I } = G;
  const j = S.journey;
  S.journey = null;
  S.city = j.to;
  S.visits[j.to] = (S.visits[j.to] ?? 0) + 1;
  if (j.kind === 'night') S.nerve = Math.min(10, S.nerve + 1);
  if (S.tailedBy) { const h = S.enemy.hunters[S.tailedBy]; h.leg = null; h.city = j.to; h.idleUntil = S.t + 3 * HOUR; }
  log(G, `Arrived in ${I.city.get(j.to).name}${j.delay > 20 ? `, ${Math.round(j.delay)} minutes late` : ''}.`);
  S.queue.push({ type: 'arrive', city: j.to, delay: j.delay, n: ++S.cardN });
  checkOps(G);
  if (S.visits[j.to] === 1 || rand(S) < .45) { const st = pickStory(G, 'city'); if (st) S.queue.push({ type: 'story', id: st.id, n: ++S.cardN }); }
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
  let papers = N.papers[st] + boost + (svc?.check === 'onboard' ? .1 : 0) + (cls === 3 ? .05 : cls === 1 ? -.05 : 0);
  let search = (N.search[st] + boost * .6) * (S.sex === 'f' ? .6 : 1) * (coverId === 'doyle' ? .35 : 1) * (cls === 1 ? .7 : cls === 3 ? 1.2 : 1);
  if (svc?.check === 'none') { papers = 0; search = 0; }
  if (alert || alien) papers = 1;
  return { papers: Math.max(0, Math.min(1, papers)), search: Math.max(0, Math.min(1, search)), alert, alien, state: st, nation: x.into, boost };
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

function calendar(G) {
  const { S, W } = G;
  const fresh = W.rows.filter((r) => r.t <= S.t && !S.newsSeen.includes(r.id));
  if (!fresh.length) return;
  for (const r of fresh) S.newsSeen.push(r.id);
  const shown = fresh.filter((r) => r.fact || hearsOf(G, r));
  if (shown.length) S.queue.push({ type: 'news', rows: shown.map((r) => r.id), n: ++S.cardN });
}
/** A fictional disruption is heard of near it, or through the guide. */
function hearsOf(G, r) {
  const { S, W } = G;
  if (has(G, 'bradshaw') || !r.fx.length) return true;
  const n = S.city ? W.city.get(S.city).nation : null;
  return r.fx.some((e) => e[1] === n || (typeof e[1] === 'string' && e[1].startsWith('line:') && W.line.get(e[1].slice(5)) && [W.line.get(e[1].slice(5)).a, W.line.get(e[1].slice(5)).b].includes(S.city)));
}
export function knowDisruption(G, svc, why) { if (why && why !== 'military' && !G.S.newsSeen.includes(why)) G.S.newsSeen.push(why); G.S.flags[`known:${why}`] = true; }

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

/** Nights in a city: a hotel register under the active cover, a safe house, or none. */
function nights(G) {
  const { S } = G;
  if (S.t % DAY !== 23 * HOUR || !S.city) return;
  if (S.place === 'safehouse') { S.nerve = Math.min(10, S.nerve + 2); return; }
  if (S.place === 'rough') { S.nerve = Math.max(0, S.nerve - 1); return; }
  if (S.money >= 1) { S.money -= 1; leave(G, 'register', .6); S.nerve = Math.min(10, S.nerve + 1); }
  else { S.nerve = Math.max(0, S.nerve - 1); }
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
