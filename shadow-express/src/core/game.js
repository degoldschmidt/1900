// The game object: data, world, state and indexes; a new campaign; the storylet context (conditions and effects).
// State S is plain JSON (saved as is). The world W and the indexes are rebuilt from the data and the seed.

import { T, DAY, clock } from '../data/time.js';
import { buildWorld } from './world.js';
import { hash, rand, weighted } from './rng.js';
import { newEnemy } from './enemy.js';
import { DEFAULT_AFF, classAff } from './spec.js';
import { chanceOf, apply as applyEffects, all, render } from './storylet.js';
import { earliest } from './timetable.js';
import { BACKGROUNDS, KIT, defaultHero, skill, has as trait, fullName } from './hero.js';
import { legendOf, addLegend, addWatch, shadowed, stayDays, noticeRecord } from './residence.js';

export const START = T('06-28 16.00');
export const CASE_SIZE = 6;
export const NERVE_MAX = 10;

/** When every borrowed name is burned, the agent travels on a genuine British passport: safer papers, but a real name to lose. */
export const SELF = { id: 'self', nation: 'GB', cls: 2, man: { name: 'yourself', legend: 'a British subject on your own passport' }, woman: { name: 'yourself', legend: 'a British subject on your own passport' },
  papers: .9, backstopH: 6, aff: { 'topic:military': -1, 'venue:barracks': -1 }, props: [], unlock: null, blurb: 'Your own name. The last one you have.' };

export function indexes(D) {
  const by = (rows) => new Map(rows.map((r) => [r.id, r]));
  const I = { city: by(D.cities), nation: by(D.nations), item: by(D.items), cover: by(D.covers), person: by(D.people), hunter: by(D.hunters), op: by(D.ops), story: by(D.stories), line: by(D.lines) };
  I.cover.set('self', SELF);
  I.atList = {};
  for (const s of D.stories) (I.atList[s.at] ??= []).push(s);
  I.ground = [...new Set(D.hunters.flatMap((h) => h.ground))];
  return I;
}

/** Draw each person's hidden loyalty once per campaign: exactly one of those who might be the enemy is. */
function loyalties(D, seed) {
  const out = {};
  const moles = D.people.filter((p) => typeof p.loyalty === 'object' && Object.keys(p.loyalty).some((k) => k.startsWith('enemy:')));
  const mole = weighted(moles.map((p) => [p.id, Object.entries(p.loyalty).find(([k]) => k.startsWith('enemy:'))[1]]), hash(seed, 'mole'));
  for (const p of D.people) {
    if (typeof p.loyalty === 'string') { out[p.id] = p.loyalty; continue; }
    const opts = Object.entries(p.loyalty).filter(([k]) => (p.id === mole ? k.startsWith('enemy:') : !k.startsWith('enemy:')));
    out[p.id] = weighted(opts.length ? opts : Object.entries(p.loyalty), hash(seed, 'loyal', p.id));
  }
  return out;
}

export function newGame(D, { seed = 1, sex = 'm', start = 'LON', t = START, hero = null } = {}) {
  hero = hero ? JSON.parse(JSON.stringify(hero)) : defaultHero(sex);
  sex = hero.sex;
  const bg = BACKGROUNDS.find((b) => b.id === hero.background) ?? BACKGROUNDS[0];
  const loyal = loyalties(D, seed);
  const S = {
    v: 2, seed, rng: (seed * 2654435761) >>> 0 || 1, t, sex,
    city: start, journey: null, booked: null, busyUntil: t, place: 'street',
    money: 45, nerve: 7, standing: 50,
    cover: null, covers: {}, case: [],
    flags: {}, seen: {}, later: [], queue: [], cardN: 0,
    people: {}, ops: {}, intel: [], intelN: 0, sources: {}, records: [], recN: 0,
    enemy: newEnemy(D), tailedBy: null, tailSince: null, knownTail: false,
    newsSeen: [], log: [], debrief: [], visits: { [start]: 1 }, ended: null,
    stats: { decisions: 0, journeys: 0, nextTrain: 0, notNext: 0, controls: 0, encounters: 0, nearMisses: 0, detained: 0, records: 0, plants: 0 },
  };
  // the agent: covers from the background, purse and standing from background and traits, papers from paperwork
  S.hero = hero;
  S.legend = {}; S.watch = {};
  const covers = bg.covers.filter((id) => D.covers.some((c) => c.id === id));
  for (const id of covers.length ? covers : D.covers.filter((c) => c.unlock === null).map((c) => c.id)) {
    const c = D.covers.find((x) => x.id === id);
    S.covers[id] = { papers: Math.min(1, c.papers + .03 * skill(hero, 'paperwork') - (trait(hero, 'poor') ? .1 : 0)), carried: true, burned: false };
    S.cover ??= id;
  }
  S.money = bg.money + (trait(hero, 'money') ? 30 : 0) - (trait(hero, 'gambler') ? 15 : 0);
  S.standing = Math.min(80, bg.standing + (trait(hero, 'protege') ? 10 : 0) - (trait(hero, 'debts') ? 8 : 0));
  S.nerve = 7 + (trait(hero, 'iron') ? 2 : 0) - (trait(hero, 'drink') ? 1 : 0);
  for (const p of D.people) S.people[p.id] = { st: 'unknown', trust: 0, exp: 0, loyal: loyal[p.id], told: [] };
  if (hero.friend && S.people[hero.friend]) Object.assign(S.people[hero.friend], { st: 'met', trust: 2, old: true });
  for (const o of D.ops) S.ops[o.id] = { status: 'pending', done: {}, waitMin: 0, obsMin: 0, way: {}, twists: {} };
  const items = [bg.item, ...(hero.kit ?? [])].filter((id, i, a) => id && a.indexOf(id) === i && D.items.some((x) => x.id === id));
  for (const id of items) S.case.push({ id, t });
  S.money = Math.max(5, S.money - (hero.kit ?? []).reduce((a, id) => a + (KIT.find((k) => k.id === id)?.price ?? 0), 0));
  // the face the enemy may learn: some faces are easier to describe than others
  S.enemy.descMul = trait(hero, 'forgettable') ? .6 : trait(hero, 'striking') ? 1.5 : 1;
  if (trait(hero, 'known')) S.enemy.desc = .3;
  return S;
}

export function makeGame(D, S) {
  const W = buildWorld(D, S.seed);
  return { D, W, S, I: indexes(D) };
}

// ---------- queries ----------
export const coverData = (G, id = G.S.cover) => G.I.cover.get(id);
export const coverName = (G, id = G.S.cover) => { if (id === 'self' && G.S.hero) return fullName(G.S.hero); const c = coverData(G, id); return c ? c[G.S.sex === 'f' ? 'woman' : 'man'].name : 'yourself'; };
export const coverLegend = (G, id = G.S.cover) => { const c = coverData(G, id); return c ? c[G.S.sex === 'f' ? 'woman' : 'man'].legend : ''; };
export function aff(G, tag, id = G.S.cover) {
  const c = coverData(G, id);
  if (!c) return 0;
  if (tag in c.aff) return c.aff[tag];
  if (tag.startsWith('class:')) return classAff(c.cls, Number(tag.slice(6)));
  return DEFAULT_AFF[tag] ?? 0;
}
export const has = (G, id) => G.S.case.some((x) => x.id === id);
export const caseSize = (G) => G.S.case.reduce((a, x) => a + (G.I.item.get(x.id)?.size ?? 1), 0);
export const carriedCovers = (G) => Object.entries(G.S.covers).filter(([, c]) => c.carried && !c.burned).map(([id]) => id);
export const hasUse = (G, use) => G.S.case.some((x) => G.I.item.get(x.id)?.tags.includes(`use:${use}`));
export const contraband = (G) => G.S.case.filter((x) => G.I.item.get(x.id)?.tags.includes('contraband'));
/** The nation the player is in now (on a journey: the nation of the last frontier passed). */
export function nationNow(G) {
  const { S, I } = G;
  if (S.city) return I.city.get(S.city).nation;
  const j = S.journey;
  if (!j) return null;
  let n = I.city.get(j.from).nation;
  for (const x of j.crossings) if (x.done) n = x.into;
  return n;
}
export const localMinute = (t) => ((t % DAY) + DAY) % DAY;
export const act = (G) => G.W.act(G.S.t);

/** Where a person is now: their home city, or a city among their places they are visiting, or on a line. */
export function personHere(G, id) {
  const { S, I } = G;
  const p = I.person.get(id);
  if (!p) return false;
  const ps = S.people[id];
  if (['arrested', 'dead'].includes(ps.st)) return false;
  if (ps.st === 'recruited' && ps.with) return true;
  if (S.city) return p.city === S.city || (p.city === null && p.places.includes(S.city) && hash(S.seed, 'visit', id, S.city, Math.floor(S.t / DAY)) < .5);
  if (S.journey) return p.places.includes(`train:${S.journey.line}`);
  return false;
}

// ---------- the storylet context ----------
export function context(G, card = {}) {
  const { S, W, I } = G;
  const ctx = {
    city: () => S.city,
    nation: () => nationNow(G),
    act: () => W.act(S.t),
    status: (id) => S.people[id]?.st ?? 'unknown',
    trust: (id) => S.people[id]?.trust ?? 0,
    loyalty: (id) => S.people[id]?.loyal,
    hasItem: (id) => has(G, id),
    cover: () => S.cover,
    aff: (tag) => aff(G, tag),
    sex: () => S.sex,
    flag: (n) => !!S.flags[n],
    opActive: (op) => S.ops[op]?.status === 'active',
    opDone: (op, step) => !!S.ops[op]?.done[step],
    tailed: () => !!S.tailedBy,
    localMinute: () => localMinute(S.t),
    dow: () => ((Math.floor(S.t / DAY) % 7) + 7) % 7,
    rand: () => rand(S),
    money: () => S.money, nerve: () => S.nerve, standing: () => S.standing,
    journey: () => (S.journey ? { mode: I.line.get(S.journey.line).mode, kind: S.journey.kind, cls: S.journey.cls } : null),
    worldState: (n) => W.state(n, S.t),
    atWar: (a, b) => W.atWar(a, b, S.t),
    hunterHere: (id) => card.hunter === id,
    skill: (name) => skill(S.hero, name),
    stay: () => stayDays(G),
    legend: () => legendOf(G),
    watched: () => shadowed(G),
    seen: (id) => !!S.seen[id],
    coverName: () => coverName(G), coverLegend: () => coverLegend(G),
    cityName: () => (S.city ? I.city.get(S.city).name : I.city.get(S.journey?.to)?.name ?? ''),
    personName: (id) => I.person.get(id)?.name ?? I.hunter.get(id)?.name ?? id,
    effects: effects(G, card),
  };
  return ctx;
}

export function addIntel(G, o, extra = {}) {
  const { S } = G;
  let truth = o.truth;
  if (truth === 'auto') truth = autoTruth(G, o);
  const e = { id: ++S.intelN, subj: o.subj, claim: o.claim, src: o.src, rel: o.rel, truth: !!truth, planted: !!extra.planted, about: S.t, learned: S.t, resolved: null, city: S.city };
  S.intel.push(e);
  if (S.intel.length > 150) S.intel.splice(S.intel.findIndex((x) => x.resolved !== null) >>> 0, 1);
  return e;
}
function autoTruth(G, o) {
  const { S, W } = G;
  const [k, v] = o.subj.split(/:(.*)/s);
  const [ck, cv] = Object.entries(o.claim)[0];
  if (k === 'hunter') { const h = S.enemy.hunters[v]; if (ck === 'at') return h && !h.leg && h.city === cv; if (ck === 'heading') return h && (h.target === cv || h.leg?.to === cv); }
  if (k === 'person' && ck === 'loyal') return (S.people[v]?.loyal ?? '').startsWith(cv);
  if (k === 'line' && ck === 'closed') return D_lineClosed(G, v, cv);
  if (k === 'cover' && ck === 'knows') { const d = S.enemy.dossiers[v === 'active' ? S.cover : v]; return cv === 'name' ? !!d?.name : cv === 'photo' ? S.enemy.photo : S.enemy.desc > .4; }
  return hash(S.seed, 'intel', S.intelN) < .5;
}
function D_lineClosed(G, lineId, [a, b]) {
  const s = G.D.services.find((x) => x.line === lineId);
  if (!s) return false;
  const t = a ? T(a) : G.S.t;
  return !!G.W.suspended(s, t + 60);
}

/** Leave a record of the player under the active cover (or as given). It reaches the enemy after the local lag. */
export function leave(G, kind, fid, o = {}) {
  const { S, W } = G;
  const j = S.journey;
  const city = o.city ?? S.city ?? (j ? (j.crossings.length && j.crossings.every((x) => x.done) ? j.to : j.from) : 'LON');
  const t = o.t ?? S.t;
  const lag = W.lagH(city, t) * 60 * (.75 + .5 * hash(S.seed, 'lag', S.recN));
  const r = { id: ++S.recN, kind, city, t, cover: o.cover === undefined ? S.cover : o.cover, fid: Math.max(0, Math.min(1, fid)), arrives: Math.round(t + lag), person: o.person ?? null };
  for (const k of ['heat', 'planted', 'other', 'op', 'note']) if (o[k] !== undefined) r[k] = o[k];
  if (S.tailedBy && kind !== 'talk') { r.arrives = Math.min(r.arrives, t + 90); r.fid = Math.max(r.fid, .8); } // a tail sees everything
  S.records.push(r);
  S.stats.records++;
  noticeRecord(G, r);
  if (shadowed(G) && kind !== 'talk' && kind !== 'calm') { r.fid = Math.max(r.fid, .7); r.arrives = Math.min(r.arrives, t + 6 * 60); } // the police pass on what they see
  return r;
}

function effects(G, card) {
  const { S, I, W } = G;
  const opOf = () => card.op ?? Object.keys(S.ops).find((k) => S.ops[k].status === 'active');
  return {
    money: (n) => { S.money = Math.max(0, Math.round((S.money + n) * 100) / 100); },
    nerve: (n) => { S.nerve = Math.max(0, Math.min(NERVE_MAX, S.nerve + n)); },
    standing: (n) => { S.standing = Math.max(0, Math.min(100, S.standing + n)); },
    min: (n) => { S.busyUntil = Math.max(S.busyUntil, S.t) + n; },
    trust: (id, n) => { const p = S.people[id]; p.trust = Math.max(-3, Math.min(5, p.trust + n)); if (p.st === 'unknown') p.st = 'met'; },
    st: (id, st) => { const p = S.people[id]; if (st === 'arrested' && p.st !== 'arrested') p.arrestedAt = S.t; p.st = st; },
    flag: (n) => { S.flags[n] = true; },
    unflag: (n) => { delete S.flags[n]; },
    unlock: (f) => { S.flags[f.slice(5)] = true; },
    item: (d) => {
      const id = d.slice(1);
      if (d[0] === '+') {
        const it = I.item.get(id);
        if (caseSize(G) + (it?.size ?? 1) > CASE_SIZE) { note(G, 'Your case is full', `There is no room for ${it.name.toLowerCase()}; you leave it behind.`); return; }
        S.case.push({ id, t: S.t });
      } else { const i = S.case.findIndex((x) => x.id === id); if (i >= 0) S.case.splice(i, 1); }
    },
    intel: (o) => { addIntel(G, o); },
    record: (kind, fid) => { leave(G, kind, fid); },
    susp: (c, n) => { const cover = c === 'active' ? S.cover : c; if (n >= 0) leave(G, 'sighting', n, { cover, heat: 1 }); else leave(G, 'calm', -n, { cover }); },
    expose: (id, p) => { if (rand(S) < p) leave(G, 'meeting', 1, { person: id }); S.people[id].exp = Math.min(1, S.people[id].exp + p * .5); },
    plant: (o) => plant(G, o),
    cover: (d) => { const id = d.slice(1); if (!S.covers[id]) S.covers[id] = { papers: I.cover.get(id).papers, carried: true, burned: false, gained: S.t }; },
    papers: (c, n) => { const id = c === 'active' ? S.cover : c; if (S.covers[id]) S.covers[id].papers = Math.max(0, Math.min(1, S.covers[id].papers + n)); },
    op: (id, a) => opControl(G, id, a),
    later: (h, story) => { S.later.push({ at: S.t + Math.round(h * 60), story, until: S.t + Math.round(h * 60) + 2 * DAY }); },
    delay: (n) => { if (S.journey) { S.journey.arr += n; for (const x of S.journey.crossings) if (!x.done) x.t += Math.round(n / 2); } },
    debrief: (text) => { S.debrief.push({ t: S.t, op: opOf() ?? null, text }); },
    legend: (n) => addLegend(G, n),
    watch: (n) => addWatch(G, n),
    // engine-only effects (never in data)
    note: (title, text) => note(G, title, text),
  };
}

export function note(G, title, text) { G.S.queue.push({ type: 'note', title, text, n: ++G.S.cardN }); }
export function log(G, text) { G.S.log.push({ t: G.S.t, text }); if (G.S.log.length > 200) G.S.log.shift(); }

/** A falsehood fed through a person. A false trail about you is acted out (the person travels as you, and is exposed); a secret about an op reaches the enemy only through a traitor. */
function plant(G, o) {
  const { S, W } = G;
  S.stats.plants++;
  const p = S.people[o.via];
  p.told.push({ t: S.t, subj: o.subj, claim: o.claim });
  const city = o.claim.at ?? o.claim.heading;
  if (o.subj.startsWith('op:')) {
    if ((p.loyal ?? '').startsWith('enemy:') || p.st === 'arrested' || p.st === 'turned') leave(G, 'plan', .8, { city, op: o.subj.slice(3), cover: null, person: o.via, t: S.t + 120 });
    return;
  }
  if (!city) return;
  const from = S.city ?? S.journey?.to ?? 'LON';
  const r = earliest(W, from, S.t, { horizon: 4 * DAY });
  const when = r.get(city)?.t ?? S.t + DAY;
  const cover = o.subj === 'cover:active' ? S.cover : o.subj.slice(6);
  leave(G, 'sighting', .7, { city, t: when, cover, person: o.via, planted: true });
  p.exp = Math.min(1, p.exp + .3);
}

/** Operation control from effects: start, finish a step, win, fail. */
export function opControl(G, id, a) {
  const { S } = G;
  const o = S.ops[id];
  if (!o) return;
  if (a === 'start') { if (o.status === 'pending') { o.status = 'active'; o.started = S.t; G.S.queue.push({ type: 'telegram', op: id, n: ++S.cardN }); } return; }
  if (o.status !== 'active') return;
  if (a.startsWith('step:')) { o.done[a.slice(5)] = S.t; G.afterStep?.(G, id, a.slice(5)); return; }
  if (a === 'win' || a === 'fail') G.finishOp?.(G, id, a === 'win');
}

// ---------- cards ----------
/** The choices a storylet card offers now: data choices whose `if` holds (shown greyed when unaffordable). */
export function storyChoices(G, story, card = {}) {
  const ctx = context(G, card);
  return story.choices.map((c, i) => ({ ...c, i, ok: c.ok, open: all(c.if, ctx), afford: (c.cost?.money ?? 0) <= G.S.money && (c.cost?.nerve ?? 0) <= G.S.nerve }))
    .filter((c) => c.open);
}

/** Apply a chosen choice: costs, roll, effects, next. Returns { success, next }. */
export function resolveChoice(G, choice, card = {}) {
  const { S } = G;
  const ctx = context(G, card);
  S.stats.decisions++;
  if (choice.cost?.money) S.money = Math.max(0, S.money - choice.cost.money);
  if (choice.cost?.nerve) S.nerve = Math.max(0, S.nerve - choice.cost.nerve);
  if (choice.cost?.min) ctx.effects.min(choice.cost.min);
  // who you claim to be: an odd act is remarked on; an implausible one is harder and remarked on sharply
  const fit = choice.tag ? aff(G, choice.tag) : 1;
  if (fit === 0) leave(G, 'sighting', .3, { heat: .15 });
  if (fit < 0) leave(G, 'sighting', .6, { heat: .35 });
  let success = true;
  const speaker = card.id ? G.I.story.get(card.id)?.speaker : null;
  const charm = speaker && G.I.person.has(speaker) ? .04 * skill(S.hero, 'charm') : 0;
  if (choice.roll) {
    const p = chanceOf(choice.roll, ctx) - (S.nerve <= 1 ? .1 : 0) - (fit < 0 ? .2 : 0) + charm;
    success = rand(S) < Math.max(.05, p);
  }
  applyEffects(success ? choice.ok : choice.fail, ctx);
  return { success, next: choice.next ?? null };
}

export const text = (G, s, card) => render(s, context(G, card));
export { clock };
