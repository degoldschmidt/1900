// The post-mortem: what the other side held on you at the end, what led them to you, what you were told that was
// not so, and what was true all along. A pure function of the game: no DOM, no randomness, and nothing in G.S is
// changed. Every line is read from what the engine kept (the records, the dossiers, the enemy's log, the intel, the
// hidden loyalties, the stats and the log); nothing is invented, and a thing the data cannot say is left unsaid.
//
//   postmortem(G) → {
//     why, at, when,                 // S.ended.why and S.ended.t (null while the campaign runs), and the date text
//     headline,                      // one sentence on how it ended
//     place,                         // where you were: 'in Vienna', 'on the road between Paris and Vienna'
//     covers: [{ cover, name, own, status, burned, posted, postedAt, postedBy, susp, papers, summary, alerts, linked,
//                because: [{ id, kind, city, cityName, t, fid, weight, label, person }] }],   // up to 4, heaviest first
//     knew: { name, desc, photo },   // what they held of your body: a posted name, a description (0..1), a photograph
//     believed,                      // where they thought you were: { city, cityName, t, cover, name, planted, ageH }
//     falseTips: [{ id, subj, claim, src, learned, rel, stale, heard, text }],   // intel you held that was not so (stale: it was so when heard)
//     sources: [{ src, name, right, wrong }],
//     truths: [ line … ],            // hidden facts, now told (only once the campaign has ended)
//     hunters: [{ id, name, active, role, where, hours, together, nearest }], nearest,
//     nearMisses,
//     costliest: [ line … ],         // up to three plain lines on what cost the most
//     failed: [{ op, title, at, standing }],
//   }

import { dateOf, when, T, DAY } from '../data/time.js';
import { coverName, nationNow, pro } from './game.js';
import { HEAT, SUSPECT } from './enemy.js';
import { SHADOWED, SEARCHED, QUESTIONED } from './residence.js';
import { earliest } from './timetable.js';

const HOUR = 60;

// ---------- small helpers ----------
const num = (x, d = 0) => (Number.isFinite(x) ? x : d);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const join = (xs) => (xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const long = (t) => { const x = dateOf(t); return `${x.dayName} ${x.day} ${x.monthName}`; };
const ago = (min) => { const m = Math.max(0, Math.round(min)); return m < 60 ? 'under an hour' : m < 90 ? 'an hour' : m < 48 * HOUR ? `${Math.round(m / HOUR)} hours` : `${Math.round(m / DAY)} days`; };
const hoursText = (h) => (h === null ? null : h < 1 ? 'under an hour' : h < 48 ? plural(Math.round(h), 'hour') : plural(Math.round(h / 24), 'day'));
const cityName = (G, id) => G.I.city.get(id)?.name ?? id ?? 'somewhere';
const personName = (G, id) => G.I.person.get(id)?.name ?? G.I.hunter.get(id)?.name ?? id ?? 'someone';
const nationName = (G, id) => G.I.nation.get(id)?.name ?? id;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** What a record weighs on a name: the same figure the enemy adds to its suspicion (enemy.js learn). */
const weigh = (r) => (r.kind === 'talk' ? 1 : num((r.heat ?? HEAT[r.kind] ?? 0) * r.fid));

/** A record, in a few plain words. The record knows its city but not which side of a frontier it was made on. */
function recLabel(G, r) {
  const at = cityName(G, r.city);
  const who = r.person ? personName(G, r.person) : null;
  switch (r.kind) {
    case 'register': return `A register signed in ${at}`;
    case 'frontier': return num(r.heat) > 0 ? `Stopped at a frontier, on a journey to or from ${at}` : `Papers noted at a frontier, on a journey to or from ${at}`;
    case 'berth': return `A sleeping-car berth booked out of ${at}`;
    case 'list': return `Your name on a passenger list out of ${at}`;
    case 'wire': return `A telegram sent from ${at}`;
    case 'sighting': return r.planted ? `The false trail you laid, placing you in ${at}` : `Noticed in ${at}`;
    case 'bribe': return `A bribe offered in ${at}`;
    case 'meeting': return who ? `Seen with ${who} in ${at}` : `A meeting watched in ${at}`;
    case 'photo': return `Photographed in ${at}`;
    case 'talk': return `${who ?? 'A contact'} was taken and talked`;
    case 'link': return 'Seen going in as one name and out as another';
    case 'plan': return 'A plan of yours reached them through a traitor';
    default: return `${cap(r.kind)} in ${at}`;
  }
}

// ---------- where you were ----------
function placeOf(G) {
  const { S } = G;
  if (S.city) return { id: S.city, text: `in ${cityName(G, S.city)}` };
  const j = S.journey;
  if (j) {
    const x = (j.crossings ?? []).filter((c) => c.done).at(-1);
    return { id: j.to, arr: j.arr, text: `${x ? `at the ${x.name} control, ` : ''}on the road between ${cityName(G, j.from)} and ${cityName(G, j.to)}` };
  }
  return { id: null, text: 'on the road' };
}

// ---------- the names ----------
/** When, and how, the enemy first posted a name: the enemy's own log, or the record in which a contact gave it up. */
function postedHow(G, id) {
  const { S } = G;
  let best = null;
  const see = (t, by, extra = {}) => { if (best === null || t < best.t) best = { t, by, ...extra }; };
  for (const l of S.enemy?.log ?? []) {
    const m = /^posts the name of (.+)$/.exec(l.text), n = /^finds the legend of (.+) false$/.exec(l.text);
    if (m && m[1] === id) see(l.t, 'records');
    if (n && n[1] === id) see(l.t, 'legend');
  }
  for (const r of S.records ?? []) if (r.kind === 'talk' && r.cover === id) see(r.arrives, 'talk', { person: r.person });
  return best;
}

function coverFile(G, id) {
  const { S, I } = G;
  const E = S.enemy ?? {};
  const d = E.dossiers?.[id] ?? null;
  const held = S.covers?.[id] ?? null;
  const posted = !!d?.name;
  const how = posted ? postedHow(G, id) : null;
  const postedAt = how ? how.t : null;
  const susp = num(d?.susp);
  const burned = !!held?.burned;
  const own = id === 'self';
  const name = coverName(G, id);
  // the records that weighed most on this name, from those that had reached them before it was posted
  const heavy = (S.records ?? []).filter((r) => r.cover === id && r.kind !== 'calm' && !r.planted).map((r) => ({ r, w: weigh(r) })).filter((x) => x.w > 0);
  const early = postedAt === null ? heavy : heavy.filter((x) => x.r.arrives <= postedAt);
  const because = (early.length ? early : heavy).sort((a, b) => b.w - a.w || a.r.t - b.r.t).slice(0, 4).map(({ r, w }) => ({
    id: r.id, kind: r.kind, city: r.city, cityName: cityName(G, r.city), t: r.t, fid: r.fid, weight: Math.round(w * 100) / 100, label: recLabel(G, r), person: r.person ?? null,
  }));
  const status = posted ? 'posted' : burned ? 'burned' : susp >= SUSPECT ? 'suspect' : susp > 0 ? 'noticed' : 'clean';
  const alerts = posted ? (d.alerts ?? []).map((n) => nationName(G, n)) : [];
  const linked = [...new Set((E.links ?? []).filter(([a, b]) => a === id || b === id).map(([a, b]) => (a === id ? b : a)))].map((c) => coverName(G, c));
  const papers = held ? num(held.papers, null) : null;
  // the sentence for the card
  let summary;
  if (posted) {
    if (how?.by === 'talk') summary = `${how.person ? personName(G, how.person) : 'A contact'} was taken, and gave this name up${postedAt !== null ? ` by ${long(postedAt)}` : ''}.`;
    else if (how?.by === 'legend') {
      const c = (E.checks ?? []).find((x) => x.cover === id);
      const doubt = c && I.cover.get(id) ? c.at - I.cover.get(id).backstopH * HOUR : null;
      summary = `${doubt !== null ? `They began to doubt this name on ${long(doubt)}, wrote to check its legend, and` : 'They wrote to check its legend, and'} on ${long(postedAt)} the papers did not bear the test.`;
    } else summary = postedAt !== null ? `Posted on ${long(postedAt)}, once the marks it had left added up to more than they would bear.` : 'Posted, once the marks it had left added up to more than they would bear. The file does not say when.';
    if (alerts.length) summary += ` From then on every frontier post and station in ${join(alerts)} had it on a list.`;
  } else if (burned) summary = `Burned${because[0] ? `, though never posted. The sharpest mark it left: ${because[0].label[0].toLowerCase()}${because[0].label.slice(1)}, ${when(because[0].t)}` : ', though never posted'}.`;
  else if (status === 'suspect') summary = 'Suspected. They followed this name\'s trail, but never posted it.';
  else if (status === 'noticed') summary = 'Noticed a little, and nothing more.';
  else summary = 'Never traced.';
  if (linked.length) summary += ` They had joined it with ${join(linked)}: one person, two names.`;
  return { cover: id, name, own, status, burned, posted, postedAt, postedBy: how?.by ?? null, susp: Math.round(susp * 100) / 100, papers: papers === null ? null : Math.round(papers * 100) / 100, summary, alerts, linked, because };
}

const ORDER = { posted: 0, burned: 1, suspect: 2, noticed: 3, clean: 4 };
function coverFiles(G) {
  const { S } = G;
  const ids = [...new Set([...Object.keys(S.covers ?? {}), ...Object.keys(S.enemy?.dossiers ?? {})])].filter((id) => G.I.cover.has(id));
  return ids.map((id) => coverFile(G, id)).sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.postedAt ?? Infinity) - (b.postedAt ?? Infinity) || b.susp - a.susp);
}

// ---------- what you were told that was not so ----------
function subjName(G, subj) {
  const [k, v] = String(subj ?? '').split(/:(.*)/s);
  switch (k) {
    case 'hunter': return G.I.hunter.get(v)?.name ?? v;
    case 'person': return G.I.person.get(v)?.name ?? v;
    case 'cover': return v === 'active' ? 'you' : coverName(G, v);
    case 'line': { const l = G.I.line.get(v); return l ? `the ${cityName(G, l.a)} and ${cityName(G, l.b)} line` : `the ${v} line`; }
    case 'service': return G.W.service.get(v)?.name ?? v;
    case 'frontier': { for (const l of G.D.lines) { const f = l.frontiers.find((x) => x.id === v); if (f) return `the frontier at ${f.name}`; } return `the frontier at ${v}`; }
    case 'city': return cityName(G, v);
    case 'op': return G.I.op.get(v)?.title ?? v;
    default: return String(subj ?? 'something');
  }
}
const SRC = { seen: 'your own eyes', porter: 'a porter', paper: 'the newspapers', bureau: 'the Bureau', rumour: 'rumour', police: 'police gossip', guide: 'the guide' };
const srcName = (G, s) => (String(s).startsWith('person:') ? personName(G, String(s).slice(7)) : SRC[s] ?? String(s));
const LEAD = { seen: 'Your own eyes told you', porter: 'A porter told you', paper: 'The newspapers said', bureau: 'London told you', rumour: 'A rumour had it', police: 'Police gossip had it', guide: 'The guide said' };
const stamp = (s) => { try { return when(T(s)); } catch { return String(s); } };

function claimText(G, e) {
  const [k, v] = Object.entries(e.claim ?? {})[0] ?? [];
  const who = subjName(G, e.subj);
  switch (k) {
    case 'at': return `${who} was in ${cityName(G, v)}`;
    case 'heading': return `${who} was bound for ${cityName(G, v)}`;
    case 'loyal': return `${who} was ${v === 'enemy' ? 'working for the other side' : v === 'bureau' ? 'the Bureau\'s own' : v === 'cause' ? 'true to a cause' : 'serving no one but themselves'}`;
    case 'closed': return `${who} was closed${v?.[0] ? ` from ${stamp(v[0])}` : ''}${v?.[1] ? ` until ${stamp(v[1])}` : ''}`;
    case 'knows': {
      const subjIsHunter = String(e.subj).startsWith('hunter:');
      const what = v === 'name' ? 'the name you travelled under' : v === 'photo' ? 'your photograph' : 'your description';
      return subjIsHunter ? `${who} had ${what}` : `the enemy had ${what}`;
    }
    default: return typeof v === 'string' ? v : `something about ${who}`;
  }
}

function tipText(G, e, stale) {
  const [k, v] = Object.entries(e.claim ?? {})[0] ?? [];
  const lead = String(e.src).startsWith('person:') ? `${personName(G, String(e.src).slice(7))} told you` : LEAD[e.src] ?? 'You heard';
  const body = k === 'note' ? (/^[A-ZÀ-Ý][\p{L}.' -]{1,30}: /u.test(String(v)) ? `"${v}"` : `${lead}: "${v}"`) : `${lead} that ${claimText(G, e)}.`;
  return `${body} ${stale ? 'It was so when you heard it, but had gone cold when you looked.' : 'It was not so when you heard it.'}`;
}

function falseTips(G) {
  const rows = (G.S.intel ?? []).filter((e) => e.truth === false || e.resolved === false).map((e) => {
    const stale = e.truth !== false; // true when learned, found wanting when the player looked
    return { id: e.id, subj: e.subj, claim: e.claim, src: e.src, learned: e.learned, rel: num(e.rel), stale, resolved: e.resolved ?? null, text: tipText(G, e, stale) };
  }).sort((a, b) => (a.stale - b.stale) || b.rel - a.rel || b.learned - a.learned);
  // the same thing heard twice is one line
  const out = new Map();
  for (const r of rows) { const k = r.text; if (out.has(k)) out.get(k).heard++; else out.set(k, { ...r, heard: 1 }); }
  return [...out.values()];
}

function sourceRecords(G) {
  return Object.entries(G.S.sources ?? {}).filter(([, v]) => v.wrong > 0).map(([src, v]) => ({ src, name: srcName(G, src), right: v.right, wrong: v.wrong }))
    .sort((a, b) => b.wrong - a.wrong || a.right - b.right).slice(0, 4);
}

// ---------- the hunters ----------
const ROLE = { tail: 'following your freshest trail', guard: 'guarding the place a leaked plan named', watch: 'holding a junction or home ground' };
function hunterFiles(G, t, place) {
  const { S, D, W } = G;
  const out = [];
  for (const h of D.hunters ?? []) {
    const st = S.enemy?.hunters?.[h.id];
    if (!st) continue;
    const active = !!W.hunterActive(h, t);
    const leg = st.leg ?? null;
    const moving = !!leg && t >= leg.dep && t < leg.arr;
    const at = leg ? (t < leg.dep ? leg.from : t >= leg.arr ? leg.to : null) : st.city;
    const sameTrain = moving && !!S.journey && leg.key === S.journey.key;
    let eta = null;
    if (active && place.id) {
      const [c0, t0] = moving ? [leg.to, leg.arr] : [at, t];
      eta = sameTrain ? t : c0 === place.id ? t0 : (earliest(W, c0, t0, { horizon: 3 * DAY }).get(place.id)?.t ?? null);
      if (eta !== null && place.arr !== undefined && !sameTrain) eta = Math.max(eta, place.arr); // you are on a train: not before it arrives
    }
    const hours = eta === null ? null : Math.max(0, (eta - t) / HOUR);
    const together = active && (sameTrain || (!moving && !!place.id && S.city === at));
    out.push({
      id: h.id, name: h.name, active, role: active ? st.role ?? 'watch' : null, together, hours: hours === null ? null : Math.round(hours * 10) / 10,
      where: !active ? 'not yet in the field' : moving ? `on the road between ${cityName(G, leg.from)} and ${cityName(G, leg.to)}` : `in ${cityName(G, at)}`,
    });
  }
  // the nearest: here, else the fewest hours; a tracker before a guard before a watcher
  const rank = { tail: 0, guard: 1, watch: 2 };
  const cands = out.filter((h) => h.active && h.hours !== null).sort((a, b) => a.hours - b.hours || (rank[a.role] ?? 3) - (rank[b.role] ?? 3));
  const nearest = cands[0]?.id ?? null;
  for (const h of out) h.nearest = h.id === nearest;
  return { hunters: out, nearest };
}

// ---------- the costs ----------
function failedOps(G) {
  const { S, I } = G;
  return Object.entries(S.ops ?? {}).filter(([, o]) => o.status === 'failed').map(([id, o]) => {
    const od = I.op.get(id);
    const standing = (od?.fail ?? []).filter((e) => e[0] === 'standing' && e[1] < 0).reduce((a, e) => a - e[1], 0);
    return { op: id, title: od?.title ?? id, at: o.ended ?? null, standing, side: !!od?.side };
  }).sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
}

function costliest(G, why, covers, failed) {
  const { S } = G;
  const c = [];
  const lost = failed.reduce((a, f) => a + f.standing, 0);
  const costly = failed.filter((f) => f.standing > 0);
  if (costly.length) {
    const titles = join(costly.map((f) => f.title));
    c.push({ w: lost, text: costly.length === 1 ? `${costly[0].title} failed${costly[0].at ? ` on ${long(costly[0].at)}` : ''}, and the Bureau docked ${costly[0].standing} standing.` : `${plural(costly.length, 'order')} failed (${titles}); the Bureau docked ${lost} standing for them.` });
  }
  const gone = covers.filter((x) => x.burned || x.posted);
  if (gone.length) {
    const items = gone.map((x) => `${x.own ? 'your own name' : x.name}${x.posted && x.postedAt !== null ? ` (posted ${long(x.postedAt)}${x.burned ? ', burned' : ''})` : x.burned ? ' (burned)' : ' (posted)'}`);
    c.push({ w: 10 * gone.length, text: `${gone.length === 1 ? 'A name' : `${gone.length} of your ${covers.length} names`} lost: ${join(items)}.` });
  }
  const held = num(S.stats?.detained);
  if (held >= 2) c.push({ w: 2 * held, text: `You were held up ${held} times, at frontiers and by hunters, and every stop cost hours.` });
  const wires = (S.log ?? []).filter((l) => /^The Bureau wires £/.test(l.text)).length;
  if (wires) c.push({ w: 4 * wires, text: `You asked the Bureau for money ${plural(wires, 'time')}, and each request came with a sharp word and a cost in standing.` });
  const lb = S.ops?.['op-lastboat'];
  if ((why === 'stranded' || why === 'time') && lb?.started !== undefined) {
    const ready = lb.done?.ready;
    c.push({ w: 30, text: `The order to come home reached you on ${when(lb.started)}; ${ready !== undefined ? `you set about it on ${when(ready)}` : 'you never answered it'}.` });
  }
  return c.sort((a, b) => b.w - a.w).slice(0, 3).map((x) => x.text);
}

// ---------- what was true all along ----------
function truthLines(G, t, place, hunt) {
  const { S, D, I } = G;
  const out = [];
  // the mole, and the others who might have been
  const mole = (D.people ?? []).find((p) => String(S.people?.[p.id]?.loyal ?? '').startsWith('enemy:'));
  if (mole) {
    const boss = I.hunter.get(String(S.people[mole.id].loyal).slice(6));
    const named = S.ops?.['op-mole']?.wayUsed?.name;
    let line = `${mole.name} was the other side's man all along${boss ? `, in ${boss.name}'s pay` : ''}.`;
    if (named === mole.id) line += ' You named the right man to London.';
    else if (named === 'nobody') line += ' You told London you could not say.';
    else if (named && I.person.has(named)) line += ` You named ${I.person.get(named).name} to London.`;
    const st = S.people[mole.id].st;
    if (st === 'recruited') line += ` You had recruited ${pro(mole, 'him')}.`;
    else if (st === 'cultivated') line += ` You had made a friend of ${pro(mole, 'him')}.`;
    else if (st === 'unknown') line += ` You never met ${pro(mole, 'him')}.`;
    out.push(line);
    const others = (D.people ?? []).filter((p) => p.id !== mole.id && p.loyalty && typeof p.loyalty === 'object' && Object.keys(p.loyalty).some((k) => k.startsWith('enemy:')));
    const how = (p) => { const l = S.people?.[p.id]?.loyal; return l === 'self' ? `served no one but ${pro(p, 'him')}self` : l === 'cause' ? `was true to ${pro(p, 'his')} cause` : l === 'bureau' ? 'was the Bureau\'s own' : `was loyal to ${l}`; };
    if (others.length) out.push(`${others.map((p) => `${p.name} ${how(p)}`).join(', and ')}.`);
  }
  // the cable: forged unless Amsler is Orlova's man (the rule of op-cable's stories)
  const cab = S.ops?.['op-cable'];
  if (cab?.done?.meet && S.people?.amsler) {
    const genuine = S.people.amsler.loyal === 'enemy:orlova';
    const said = S.flags?.['op-cable-said-genuine'] ? 'genuine' : S.flags?.['op-cable-said-forged'] ? 'a forgery' : null;
    out.push(`${genuine ? 'The Sarajevo cable was genuine: Belgrade\'s officers had sent it.' : 'The Sarajevo cable was a forgery, made in the Evidenzbureau to be found.'} ${said ? `You called it ${said}.` : cab.done.judge ? 'You would not give a verdict.' : 'You never gave a verdict.'}`);
  }
  // the false trails you laid: whether the enemy believed them is never shown to the player
  const trails = S.enemy?.planted ?? [];
  if (trails.length) {
    const held = trails.filter((p) => p.accepted && !p.exposed).length, seen = trails.filter((p) => p.exposed).length, no = trails.filter((p) => !p.accepted && !p.exposed).length;
    out.push(`You laid ${plural(trails.length, 'false trail')}: ${[held && `${held} believed to the end`, seen && `${seen} seen through`, no && `${no} not believed`].filter(Boolean).join(', ')}.${trails.length > 1 ? ' Each one made the next harder to believe.' : ''}`);
  }
  // the hunters
  const near = hunt.hunters.find((h) => h.nearest);
  if (near) {
    out.push(`${near.name} was nearest: ${near.together ? `with you, ${place.text}` : `${near.where}, ${hoursText(near.hours)} from you`}, ${ROLE[near.role] ?? 'on watch'}.`);
    const rest = hunt.hunters.filter((h) => !h.nearest);
    if (rest.length) out.push(`${rest.map((h) => `${cap(h.name)} was ${h.where}${h.active ? (h.hours !== null ? `, ${hoursText(h.hours)} off` : ', more than three days off') : ''}`).join('; ')}.`);
  }
  if (S.tailedBy) out.push(`${personName(G, S.tailedBy)} had been on your heels since ${S.tailSince !== null && S.tailSince !== undefined ? when(S.tailSince) : 'a while'}.`);
  // where they thought you were
  const B = S.enemy?.belief;
  if (B) {
    const age = ago(t - B.t);
    out.push(`${B.city === place.id ? `They had you placed correctly: ${cityName(G, B.city)}, as ${coverName(G, B.cover)}, on a sighting ${age} old.` : `They placed you in ${cityName(G, B.city)}, as ${coverName(G, B.cover)}, on a sighting ${age} old. You were ${place.text}.`}${B.planted ? ' That sighting was your own false trail.' : ''}`);
  }
  // what they held of your face
  const E = S.enemy ?? {};
  const photo = (S.records ?? []).filter((r) => r.kind === 'photo' && r.fid > .6).sort((a, b) => a.t - b.t)[0];
  const desc = num(E.desc);
  const word = desc >= .9 ? 'a complete' : desc >= .6 ? 'a good' : desc >= .25 ? 'a fair' : desc > 0 ? 'a vague' : null;
  if (E.photo || word) out.push(`By the end they had ${[word ? `${word} description of you` : null, E.photo ? `a photograph${photo ? `, taken in ${cityName(G, photo.city)} on ${long(photo.t)}` : ''}` : null].filter(Boolean).join(' and ')}.`);
  // the police of each city keep their own file; it only bites where you are, where you are bound, or if you go back
  const watch = Object.entries(S.watch ?? {}).filter(([, v]) => v >= SHADOWED).sort(([a, x], [b, y]) => Number(b === place.id) - Number(a === place.id) || y - x).slice(0, 3);
  const NOW = ['were shadowing you', 'were shadowing you, and might search your rooms', 'were watching you so closely that an inspector might call'];
  const WOULD = ['would have shadowed you', 'would have shadowed you, and might have searched your rooms', 'would have watched you so closely that an inspector might have called'];
  for (const [c, v] of watch) {
    const k = v >= QUESTIONED ? 2 : v >= SEARCHED ? 1 : 0, name = cityName(G, c);
    out.push(S.city === c ? `The police of ${name} ${NOW[k]}.` : place.id === c ? `The police of ${name}, where you were bound, ${WOULD[k]}.` : `Had you gone back to ${name}, the police ${WOULD[k]}.`);
  }
  return out;
}

// ---------- the sentence ----------
function headlineText(G, why, t, place, covers, failed, hunt) {
  const { S, D } = G;
  const day = long(t);
  const mains = D.ops.filter((o) => !o.side);
  const won = mains.filter((o) => S.ops?.[o.id]?.status === 'won').length;
  const used = covers.find((x) => x.cover === S.cover);
  const nameClause = () => {
    if (!used) return '';
    const alien = (() => { try { const n = nationNow(G); const c = G.I.cover.get(used.cover); return !!(n && c && G.W.alien(c.nation, n, t)); } catch { return false; } })();
    const tail = used.posted ? `, which the enemy had posted on ${used.postedAt !== null ? long(used.postedAt) : 'an earlier day'}` : used.status === 'suspect' ? ', which they had followed but never posted' : ', which they had never posted';
    return `, under the name of ${used.name}${tail}${alien ? ', and your papers alone made you an enemy alien there' : ''}`;
  };
  switch (why) {
    case 'home': return `You came home to London on ${day}, with ${won} of ${mains.length} orders accomplished and ${covers.filter((x) => x.posted).length} of your ${plural(Object.keys(S.covers ?? {}).length, 'name')} posted against you.`;
    case 'stranded': {
      const lb = S.ops?.['op-lastboat'];
      return `The last boat sailed without you: when the time ran out on ${day} you were ${place.text}${lb?.started !== undefined ? `, and the order to come home was ${ago(t - lb.started)} old` : ''}.`;
    }
    case 'time': return `The war overtook you ${place.text} on ${day}, with no road home settled.`;
    case 'arrested': return `On ${day} the police arrested you ${place.text}${nameClause()}.`;
    case 'captured': {
      const w = hunt.hunters.filter((h) => h.together);
      const by = S.tailedBy && G.I.hunter.get(S.tailedBy) ? [G.I.hunter.get(S.tailedBy).name] : w.map((h) => h.name);
      return by.length === 1 ? `On ${day} ${by[0]} took you ${place.text}${nameClause()}.` : by.length > 1 ? `On ${day} ${join(by)} were ${by.length === 2 ? 'both' : 'all'} ${place.text}, and one of them took you${nameClause()}.` : `On ${day} you were taken ${place.text}${nameClause()}.`;
    }
    case 'exposed': {
      const gone = covers.filter((x) => x.burned).map((x) => (x.own ? `your own, ${x.name}` : x.name));
      return gone.length ? `Every name you held had been burned by ${day}: ${join(gone)}.` : `The other side had you by ${day}, though none of your names was yet burned.`;
    }
    case 'recalled': {
      const costly = failed.filter((f) => f.standing > 0), lost = costly.reduce((a, f) => a + f.standing, 0);
      return `The Bureau recalled you on ${day}${S.standing <= 0 ? ': your standing had run out' : ''}${costly.length ? `, and ${plural(costly.length, 'failed order')} (${join(costly.map((f) => f.title))}) had cost you ${lost} of it` : S.standing <= 0 ? ', though no order had failed' : ''}.`;
    }
    default: return why ? `The campaign ended on ${day}.` : `The campaign is still running: it is ${when(t)}, with ${won} of ${mains.length} orders accomplished and ${plural(covers.filter((x) => x.posted).length, 'name')} posted against you.`;
  }
}

/** The whole post-mortem. Safe on a campaign still running (why is null, and the hidden facts stay hidden). */
export function postmortem(G) {
  const { S } = G;
  const why = S.ended?.why ?? null;
  const t = S.ended?.t ?? S.t;
  const place = placeOf(G);
  const covers = coverFiles(G);
  const failed = failedOps(G);
  const hunt = hunterFiles(G, t, place);
  const B = S.enemy?.belief ?? null;
  const E = S.enemy ?? {};
  return {
    why, at: t, when: when(t),
    headline: headlineText(G, why, t, place, covers, failed, hunt),
    place: place.text,
    covers,
    knew: { name: covers.some((x) => x.posted), desc: Math.round(num(E.desc) * 100) / 100, photo: !!E.photo },
    believed: B ? { city: B.city, cityName: cityName(G, B.city), t: B.t, cover: B.cover, name: coverName(G, B.cover), planted: !!B.planted, ageH: Math.round((t - B.t) / HOUR) } : null,
    falseTips: falseTips(G),
    sources: sourceRecords(G),
    truths: why ? truthLines(G, t, place, hunt) : [],
    hunters: hunt.hunters, nearest: hunt.nearest,
    nearMisses: num(S.stats?.nearMisses),
    costliest: costliest(G, why, covers, failed),
    failed,
  };
}
