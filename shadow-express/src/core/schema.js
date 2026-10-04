// The validator: every data row against docs/CONTRACTS.md, every reference resolved, the style rules enforced.
// validate(DATA) → { errors:[…], warnings:[…], stats:{…} }. No DOM; Node and the browser both import it.

import * as S from './spec.js';
import { isTime, isClock, T } from '../data/time.js';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isNum = (x, lo = -Infinity, hi = Infinity) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
const isStr = (x) => typeof x === 'string' && x.trim().length > 0;
const LOWER_ID = /^[a-z][a-z0-9-]*$/;
const STORY_ID = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const FLAG = /^[a-z0-9][a-z0-9.:_-]*$/;
const CITY_ID = /^[A-Z]{3}$/;

/** Words as a reader counts them: a {a|b} template is one word. */
export function words(s) {
  return String(s).replace(/\{[^{}]*\}/g, 'X').split(/\s+/).filter(Boolean).length;
}

// Plain-text checks. Errors for clear anachronisms, warnings for American spellings.
const BANNED = [/\bokay\b/i, /\bOK\b/, /\bteenager/i, /\bLeica\b/, /\bballpoint/i, /\bMI5\b/, /\bMI6\b/, /\bNazi/i, /\bSoviet/i,
  /\bWorld War\b/i, /\bGreat War\b/i, /\bfirst world war\b/i, /\bradio\b/i, /\bfeedback\b/i, /\bupdate[sd]?\b/i, /\bimpact(ed|s)?\b/i,
  /\bguys?\b/i, /\bcool\b/i, /\bfocus on\b/i, /\bdeadline/i];
const AMERICAN = [/\bcolor/i, /\bhonor/i, /\bfavor/i, /\bcenter\b/i, /\btheater\b/i, /\bgray\b/i, /\bharbor/i, /\barmor/i, /\bneighbor/i];

/** Flags the engine sets: '<opId>-won' and '<opId>-failed' when an operation ends, '<coverId>-burned' when a cover is burned. */
export function engineFlags(D) {
  return [...(D.ops || []).flatMap((o) => [`${o.id}-won`, `${o.id}-failed`]), ...(D.covers || []).map((c) => `${c.id}-burned`)];
}

export function validate(D, opts = {}) {
  const errors = [], warnings = [];
  const err = (w, m) => errors.push(`${w}: ${m}`);
  const warn = (w, m) => warnings.push(`${w}: ${m}`);

  // ---------- indexes ----------
  const index = (rows, kind) => {
    const m = new Map();
    if (!Array.isArray(rows)) { err(kind, 'must be an array'); return m; }
    rows.forEach((r, i) => {
      if (!isObj(r) || !isStr(r.id)) { err(`${kind}[${i}]`, 'row without an id'); return; }
      if (m.has(r.id)) err(`${kind}:${r.id}`, 'duplicate id');
      m.set(r.id, r);
    });
    return m;
  };
  const C = index(D.cities, 'city'), N = index(D.nations, 'nation'), L = index(D.lines, 'line');
  const SV = index(D.services, 'service'), CAL = index(D.calendar, 'calendar'), CV = index(D.covers, 'cover');
  const P = index(D.people, 'person'), H = index(D.hunters, 'hunter'), I = index(D.items, 'item');
  const ST = index(D.stories, 'story'), O = index(D.ops, 'op');
  for (const id of P.keys()) if (H.has(id) || CV.has(id) || I.has(id)) err(`person:${id}`, 'id also used by a hunter, cover or item');
  for (const id of CV.keys()) if (H.has(id) || I.has(id)) err(`cover:${id}`, 'id also used by a hunter or item');

  // frontier stations, keyed by id across lines
  const FR = new Map();
  for (const l of L.values()) for (const f of l.frontiers || []) {
    if (!isObj(f) || !isStr(f.id)) continue;
    const prev = FR.get(f.id);
    const same = prev && prev.name === f.name && (prev.into === f.into || prev.from === f.from || (prev.from === f.into && prev.into === f.from));
    if (prev && !same) err(`frontier:${f.id}`, `differs between lines ${prev.line} and ${l.id}`);
    if (!prev) FR.set(f.id, { ...f, line: l.id });
  }

  // flags: where they are read and set
  const flagRead = new Map(), flagSet = new Map();
  const note = (m, f, w) => { if (!m.has(f)) m.set(f, w); };
  const storyRefs = new Map(); // story id → first referrer
  const ref = (id, w) => { if (!storyRefs.has(id)) storyRefs.set(id, w); };
  const stats = { laters: 0, falseIntel: 0, plants: 0, choices: 0, words: 0, byAt: {} };

  const keysOnly = (o, allowed, w) => { for (const k of Object.keys(o)) if (!allowed.includes(k)) err(w, `unexpected key "${k}"`); };
  const text = (w, s, max, what = 'text') => {
    if (!isStr(s)) { err(w, `${what} missing`); return; }
    const n = words(s);
    stats.words += n;
    if (max && n > max) err(w, `${what} has ${n} words (max ${max})`);
    for (const re of BANNED) if (re.test(s)) err(w, `${what} uses "${s.match(re)[0]}" (anachronism or modern idiom)`);
    for (const re of AMERICAN) if (re.test(s)) warn(w, `${what}: British spelling please ("${s.match(re)[0]}")`);
    for (const m of s.matchAll(/\{([^{}]*)\}/g)) {
      const k = m[1];
      if (k.includes('|')) { if (k.split('|').length !== 2) err(w, `template {${k}} needs exactly man|woman`); continue; }
      if (['name', 'legend', 'city'].includes(k)) continue;
      if (k.startsWith('person:')) { if (!P.has(k.slice(7)) && !H.has(k.slice(7))) err(w, `template {${k}}: no such person`); continue; }
      err(w, `unknown template {${k}}`);
    }
    if (/[{}]/.test(s.replace(/\{[^{}]*\}/g, ''))) err(w, `${what} has an unmatched brace`);
  };
  const tagOk = (t) => {
    if (typeof t !== 'string') return false;
    const [p, v] = t.split(':');
    if (p === 'venue') return S.VENUES.includes(v);
    if (p === 'topic') return S.TOPICS.includes(v);
    if (p === 'item') return I.has(v);
    if (p === 'class') return ['1', '2', '3'].includes(v);
    return false;
  };
  const loyaltyOk = (v) => S.LOYALTIES.includes(v) || (typeof v === 'string' && v.startsWith('enemy:') && H.has(v.slice(6)));
  const ll = (x) => Array.isArray(x) && x.length === 2 && isNum(x[0], -30, 60) && isNum(x[1], 25, 72);

  // ---------- argument types ----------
  function arg(type, a, rest, w, ctx) {
    switch (type) {
      case 'city': return C.has(a) || `no city ${a}`;
      case 'nation': return N.has(a) || `no nation ${a}`;
      case 'person': return P.has(a) || `no person ${a}`;
      case 'status': return S.STATUSES.includes(a) || `bad status ${a}`;
      case 'loyalty': return loyaltyOk(a) || `bad loyalty ${a}`;
      case 'cmp': return S.CMP.includes(a) || `bad comparison ${a}`;
      case 'num': return isNum(a) || `not a number: ${a}`;
      case 'hours': return isNum(a, 0.25, 240) || `hours out of range: ${a}`;
      case 'prob': return isNum(a, 0, 1) || `not a probability: ${a}`;
      case 'item': return I.has(a) || `no item ${a}`;
      case 'cover': return CV.has(a) || `no cover ${a}`;
      case 'coverOrActive': return a === 'active' || CV.has(a) || `no cover ${a}`;
      case 'tag': return tagOk(a) || `bad tag ${a}`;
      case 'sex': return a === 'm' || a === 'f' || `sex must be 'm' or 'f'`;
      case 'flag': if (!FLAG.test(a ?? '')) return `bad flag name ${a}`; note(flagRead, a, w); return true;
      case 'flagSet': if (!FLAG.test(a ?? '')) return `bad flag name ${a}`; note(flagSet, a, w); return true;
      case 'op': return O.has(a) || `no op ${a}`;
      case 'clock': return isClock(a) || `bad clock ${a}`;
      case 'days': return (typeof a === 'string' && /^[0-6]+$/.test(a)) || `days must be digits 0–6`;
      case 'mode': return S.MODES.includes(a) || `bad mode ${a}`;
      case 'skind': return S.SERVICE_KINDS.includes(a) || `bad service kind ${a}`;
      case 'cls': return [1, 2, 3].includes(a) || `class must be 1, 2 or 3`;
      case 'wstate': return S.WORLD_STATES.includes(a) || `bad world state ${a}`;
      case 'hunter': return H.has(a) || `no hunter ${a}`;
      case 'here': return a === 'here' || `write 'here'`;
      case 'skillName': return S.SKILLS.includes(a) || S.LANGUAGES.includes(a) || `no skill ${a}`;
      case 'rkind': return S.RECORD_KINDS.includes(a) || `bad record kind ${a}`;
      case 'story': if (!ST.has(a)) return `no story ${a}`; ref(a, w); return true;
      case 'itemDelta': return (typeof a === 'string' && /^[+-]/.test(a) && I.has(a.slice(1))) || `item delta must be '+id' or '-id' of a known item: ${a}`;
      case 'coverDelta': return (typeof a === 'string' && a[0] === '+' && CV.has(a.slice(1))) || `cover delta must be '+id': ${a}`;
      case 'unlockFlag': if (!(typeof a === 'string' && a.startsWith('flag:') && FLAG.test(a.slice(5)))) return `unlock must be 'flag:name'`; note(flagSet, a.slice(5), w); return true;
      case 'str': return isStr(a) || 'text missing';
      case 'bool': return typeof a === 'boolean' || 'must be true or false';
      case 'timeOrNull': return a === null || isTime(a) || `bad time ${a}`;
      case 'nationOrFrontier': return N.has(a) || (typeof a === 'string' && a.startsWith('frontier:') && FR.has(a.slice(9))) || `no nation or frontier ${a}`;
      case 'target': {
        if (typeof a !== 'string') return 'target must be a string';
        const [k, v] = a.split(/:(.*)/s);
        if (k === 'line') return L.has(v) || `no line ${v}`;
        if (k === 'service') return SV.has(v) || `no service ${v}`;
        if (k === 'frontier') return FR.has(v) || `no frontier ${v}`;
        if (k === 'border') { const [x, y] = (v || '').split('-'); return (N.has(x) && N.has(y)) || `border must be 'border:AA-BB'`; }
        return `target must be line:, service:, frontier: or border:`;
      }
      case 'opAction': {
        if (['start', 'win', 'fail'].includes(a)) return true;
        if (typeof a === 'string' && a.startsWith('step:')) {
          const op = O.get(ctx.opArg);
          return !op || (op.steps || []).some((s) => s.id === a.slice(5)) || `op ${ctx.opArg} has no step ${a.slice(5)}`;
        }
        return `op action must be start, win, fail or step:id`;
      }
      case 'intelObj': return intelOk(a, w, false);
      case 'plantObj': return intelOk(a, w, true);
      default: return `unknown argument type ${type}`;
    }
  }
  function subjOk(s) {
    if (typeof s !== 'string') return 'subj missing';
    const [k, v] = s.split(/:(.*)/s);
    const table = { hunter: H, person: P, line: L, cover: CV, op: O, city: C, service: SV, frontier: FR }[k];
    if (!table) return `bad subject ${s}`;
    if (k === 'cover' && v === 'active') return true;
    return table.has(v) || `no ${k} ${v}`;
  }
  function claimOk(c) {
    if (!isObj(c) || Object.keys(c).length !== 1) return 'claim must have exactly one key';
    const [k, v] = Object.entries(c)[0];
    switch (k) {
      case 'at': case 'heading': return C.has(v) || `no city ${v}`;
      case 'loyal': return ['enemy', 'bureau', 'self', 'cause'].includes(v) || `bad loyal claim ${v}`;
      case 'closed': return (Array.isArray(v) && v.length === 2 && v.every((x) => x === null || isTime(x))) || 'closed needs [time|null, time|null]';
      case 'knows': return S.KNOWS.includes(v) || `knows must be name, desc or photo`;
      case 'note': return (isStr(v) && words(v) <= 20) || 'note must be ≤ 20 words';
      default: return `unknown claim ${k}`;
    }
  }
  function intelOk(o, w, planted) {
    if (!isObj(o)) return 'must be an object';
    const allowed = planted ? ['via', 'subj', 'claim'] : ['subj', 'claim', 'src', 'rel', 'truth'];
    for (const k of Object.keys(o)) if (!allowed.includes(k)) return `unexpected key "${k}"`;
    let r = subjOk(o.subj); if (r !== true) return r;
    r = claimOk(o.claim); if (r !== true) return r;
    if (planted) { stats.plants++; return P.has(o.via) || `plant needs via: a person id`; }
    const src = o.src;
    if (!(S.SOURCES.includes(src) || (typeof src === 'string' && src.startsWith('person:') && P.has(src.slice(7))))) return `bad source ${src}`;
    if (!isNum(o.rel, 0, 1)) return 'rel must be 0..1';
    if (!(o.truth === true || o.truth === false || o.truth === 'auto')) return "truth must be true, false or 'auto'";
    if (o.truth === 'auto' && 'note' in o.claim) return "a note claim cannot have truth 'auto'";
    if (o.truth === false) stats.falseIntel++;
    return true;
  }
  function args(types, a, w, ctx = {}) {
    let i = 0;
    for (const t of types) {
      if (t === 'actArgs') {
        const ok = (a.length === 1 && [1, 2, 3].includes(a[0])) || (a.length === 2 && S.CMP.includes(a[0]) && [1, 2, 3].includes(a[1]));
        if (!ok) err(w, `act takes [n] or [cmp, n] with n 1–3`);
        return;
      }
      if (t === 'cond+') {
        if (a.length - i < 2) err(w, `any needs at least two conditions`);
        for (; i < a.length; i++) cond(a[i], w);
        return;
      }
      if (t === 'cond') { cond(a[i++], w); continue; }
      if (t === 'step?') {
        if (i < a.length) { const op = O.get(a[0]); if (op && !(op.steps || []).some((s) => s.id === a[i])) err(w, `op ${a[0]} has no step ${a[i]}`); i++; }
        continue;
      }
      if (i >= a.length) { err(w, `missing argument (${t})`); return; }
      if (t === 'op') ctx.opArg = a[i];
      const r = arg(t, a[i], a.slice(i + 1), w, ctx);
      if (r !== true) err(w, r);
      i++;
    }
    if (i < a.length) err(w, `too many arguments`);
  }
  function cond(c, w) {
    if (!Array.isArray(c) || typeof c[0] !== 'string') { err(w, `condition must be ['name', …args]: ${JSON.stringify(c)}`); return; }
    const types = S.CONDS[c[0]];
    if (!types) { err(w, `unknown condition ${c[0]}`); return; }
    args(types, c.slice(1), `${w} [${c[0]}]`);
  }
  const conds = (cs, w) => { if (cs === undefined) return; if (!Array.isArray(cs)) { err(w, 'if must be an array of conditions'); return; } cs.forEach((c) => cond(c, w)); };
  function effect(e, w) {
    if (!Array.isArray(e) || typeof e[0] !== 'string') { err(w, `effect must be ['name', …args]: ${JSON.stringify(e)}`); return; }
    const types = S.EFFECTS[e[0]];
    if (!types) { err(w, `unknown effect ${e[0]}`); return; }
    if (e[0] === 'later') stats.laters++;
    args(types, e.slice(1), `${w} [${e[0]}]`);
  }
  const effects = (es, w) => { if (es === undefined) return; if (!Array.isArray(es)) { err(w, 'effects must be an array'); return; } es.forEach((e) => effect(e, w)); };
  const costOk = (c, w) => {
    if (c === undefined) return;
    if (!isObj(c)) { err(w, 'cost must be an object'); return; }
    keysOnly(c, ['money', 'min', 'nerve'], w);
    for (const [k, v] of Object.entries(c)) if (!isNum(v, 0)) err(w, `cost.${k} must be ≥ 0`);
  };
  const rollOk = (r, w) => {
    if (r === undefined) return;
    if (!isObj(r) || !isNum(r.p, 0, 1)) { err(w, 'roll needs p in 0..1'); return; }
    keysOnly(r, ['p', 'mods'], w);
    for (const m of r.mods || []) {
      if (!Array.isArray(m) || m.length !== 2 || !isNum(m[1], -1, 1)) { err(w, `roll mod must be [condition, delta]`); continue; }
      cond(m[0], w);
    }
  };

  // ---------- the world ----------
  for (const n of N.values()) {
    const w = `nation:${n.id}`;
    keysOnly(n, ['id', 'name', 'bloc', 'papers', 'search', 'lagH', 'bribe'], w);
    if (!S.NATIONS.includes(n.id)) err(w, 'not a nation code of the contract');
    if (!isStr(n.name)) err(w, 'name missing');
    if (!S.BLOCS.includes(n.bloc)) err(w, `bad bloc ${n.bloc}`);
    for (const k of ['papers', 'search']) for (const s of S.WORLD_STATES) if (!isNum(n[k]?.[s], 0, 1)) err(w, `${k}.${s} must be 0..1`);
    for (const s of S.WORLD_STATES) if (!isNum(n.lagH?.[s], 0, 200)) err(w, `lagH.${s} must be hours`);
    if (!isNum(n.bribe, 0, 1)) err(w, 'bribe must be 0..1');
  }
  for (const c of C.values()) {
    const w = `city:${c.id}`;
    keysOnly(c, ['id', 'name', 'll', 'nation', 'capital', 'port', 'line', 'venues', 'speciality'], w);
    if (!CITY_ID.test(c.id)) err(w, 'city ids are three capitals');
    if (!isStr(c.name)) err(w, 'name missing');
    if (!ll(c.ll)) err(w, 'll must be [lon, lat] in Europe');
    if (!N.has(c.nation)) err(w, `no nation ${c.nation}`);
    if (typeof c.capital !== 'boolean' || typeof c.port !== 'boolean') err(w, 'capital and port must be true or false');
    text(w, c.line, 25, 'line');
    if (!Array.isArray(c.venues) || c.venues.length < 4) err(w, 'needs at least four venues');
    for (const v of c.venues || []) if (!v?.startsWith?.('venue:') || !tagOk(v)) err(w, `bad venue ${v}`);
    const it = I.get(c.speciality);
    if (!it) err(w, `speciality ${c.speciality} is not an item`);
    else if (it.city !== c.id) err(w, `speciality ${c.speciality} is sold in ${it.city}, not here`);
  }
  const km = (a, b) => { // equirectangular, good enough for checks
    const k = Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180);
    return Math.hypot((a[0] - b[0]) * 111.32 * k, (a[1] - b[1]) * 110.57);
  };
  const toSeg = (p, a, b) => {
    const k = Math.cos(p[1] * Math.PI / 180), X = (q) => [q[0] * 111.32 * k, q[1] * 110.57];
    const [px, py] = X(p), [ax, ay] = X(a), [bx, by] = X(b);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  };
  const lineKm = new Map();
  for (const l of L.values()) {
    const w = `line:${l.id}`;
    keysOnly(l, ['id', 'a', 'b', 'mode', 'via', 'frontiers'], w);
    const A = C.get(l.a), B = C.get(l.b);
    if (!A || !B) { err(w, `ends must be cities (${l.a}, ${l.b})`); continue; }
    if (l.a === l.b) err(w, 'a line needs two different ends');
    if (l.id !== `${l.a}-${l.b}`) err(w, `id must be '${l.a}-${l.b}'`);
    if (!S.MODES.includes(l.mode)) err(w, `bad mode ${l.mode}`);
    if (!Array.isArray(l.via) || !l.via.every(ll)) { err(w, 'via must be a list of [lon, lat]'); continue; }
    const pts = [A.ll, ...l.via, B.ll];
    let d = 0; for (let i = 1; i < pts.length; i++) d += km(pts[i - 1], pts[i]);
    lineKm.set(l.id, d);
    if (!Array.isArray(l.frontiers)) { err(w, 'frontiers must be an array (empty if none)'); continue; }
    let nat = A.nation;
    for (const f of l.frontiers) {
      const fw = `${w} frontier ${f?.id}`;
      if (!isObj(f)) { err(w, 'frontier must be an object'); continue; }
      keysOnly(f, ['id', 'name', 'll', 'from', 'into'], fw);
      if (!/^[A-Z]{3}$/.test(f.id ?? '')) err(fw, 'frontier ids are three capitals');
      if (C.has(f.id)) err(fw, 'frontier id clashes with a city id');
      if (!isStr(f.name)) err(fw, 'name missing');
      if (!ll(f.ll)) { err(fw, 'll must be [lon, lat]'); continue; }
      if (f.from !== nat) err(fw, `from must be ${nat} (the nation the line is in at that point)`);
      if (!N.has(f.into) || f.into === f.from) err(fw, `bad into ${f.into}`);
      nat = f.into;
      let best = Infinity; for (let i = 1; i < pts.length; i++) best = Math.min(best, toSeg(f.ll, pts[i - 1], pts[i]));
      if (best > 120) err(fw, `lies ${Math.round(best)} km off the line's drawn course; add via points`);
    }
    if (nat !== B.nation) err(w, `frontiers lead into ${nat} but ${l.b} is in ${B.nation}`);
  }
  const lineServices = new Map();
  for (const s of SV.values()) {
    const w = `service:${s.id}`;
    keysOnly(s, ['id', 'line', 'kind', 'name', 'dep', 'days', 'hours', 'fare', 'sleeper', 'records', 'punct', 'maxDelay', 'check', 'unlock'], w);
    if (!LOWER_ID.test(s.id)) err(w, 'service ids are lowercase with hyphens');
    const l = L.get(s.line);
    if (!l) { err(w, `no line ${s.line}`); continue; }
    lineServices.set(l.id, (lineServices.get(l.id) || 0) + 1);
    if (!S.SERVICE_KINDS.includes(s.kind)) err(w, `bad kind ${s.kind}`);
    if (!isStr(s.name)) err(w, 'name missing');
    if (!isObj(s.dep) || !Object.keys(s.dep).length) err(w, 'dep must map a line end to departure times');
    else {
      for (const [end, times] of Object.entries(s.dep)) {
        if (end !== l.a && end !== l.b) err(w, `dep from ${end}, which is not an end of ${l.id}`);
        if (!Array.isArray(times) || !times.length || !times.every(isClock)) err(w, `dep.${end} must be a list of 'hh.mm'`);
      }
      if (Object.keys(s.dep).length === 1) warn(w, 'runs in one direction only');
    }
    if (!(s.days === '*' || (typeof s.days === 'string' && /^[0-6]+$/.test(s.days)))) err(w, "days must be '*' or digits 0–6");
    if (!isNum(s.hours, 0.25, 120)) err(w, 'hours must be 0.25..120');
    if (!isObj(s.fare) || !Object.keys(s.fare).length) err(w, 'fare must map class to £');
    else for (const [k, v] of Object.entries(s.fare)) { if (!['1', '2', '3'].includes(k)) err(w, `fare class ${k}`); if (!isNum(v, 0, 100)) err(w, `fare.${k} must be £0..100`); }
    if (typeof s.sleeper !== 'boolean') err(w, 'sleeper must be true or false');
    if (!Array.isArray(s.records) || !s.records.every((r) => S.RECORD_KINDS.includes(r))) err(w, 'records must be record kinds');
    if (!isNum(s.punct, 0, 1)) err(w, 'punct must be 0..1');
    if (!isNum(s.maxDelay, 0, 2880)) err(w, 'maxDelay must be minutes');
    if (!S.CHECKS.includes(s.check)) err(w, `bad check ${s.check}`);
    if (l.frontiers?.length && s.check === 'none' && s.kind !== 'path') err(w, `${l.id} crosses a frontier; check cannot be 'none'`);
    if (!l.frontiers?.length && s.check !== 'none') warn(w, `${l.id} crosses no frontier; check should be 'none'`);
    if (s.unlock !== undefined) { if (typeof s.unlock === 'string' && s.unlock.startsWith('flag:') && FLAG.test(s.unlock.slice(5))) note(flagRead, s.unlock.slice(5), w); else err(w, "unlock must be 'flag:name'"); }
    if (s.kind === 'path' && s.unlock === undefined) warn(w, 'a path is usually unlocked by a contact');
    const k = lineKm.get(l.id);
    if (k && isNum(s.hours, 0.25)) {
      const v = k / s.hours, [lo, hi] = l.mode === 'road' ? [3, 30] : l.mode === 'sea' ? [8, 40] : [8, 80];
      if (v < lo || v > hi) warn(w, `averages ${Math.round(v)} km/h over ${Math.round(k)} km`);
    }
  }
  for (const l of L.values()) if (!lineServices.get(l.id)) err(`line:${l.id}`, 'has no services');
  // every city reachable from London
  if (C.has('LON')) {
    const seen = new Set(['LON']), q = ['LON'];
    while (q.length) { const c = q.shift(); for (const l of L.values()) { const o = l.a === c ? l.b : l.b === c ? l.a : null; if (o && !seen.has(o)) { seen.add(o); q.push(o); } } }
    for (const c of C.keys()) if (!seen.has(c)) err(`city:${c}`, 'cannot be reached from London');
  }

  // ---------- calendar ----------
  for (const r of CAL.values()) {
    const w = `calendar:${r.id}`;
    keysOnly(r, ['id', 'at', 'until', 'p', 'fact', 'rumourLeadH', 'news', 'text', 'fx'], w);
    if (!isTime(r.at)) err(w, `bad time ${r.at}`);
    if (r.until !== undefined && r.until !== null && (!isTime(r.until) || (isTime(r.at) && T(r.until) <= T(r.at)))) err(w, 'until must be a time after at');
    if (!isNum(r.p, 0, 1)) err(w, 'p must be 0..1');
    if (typeof r.fact !== 'boolean') err(w, 'fact must be true or false');
    if (r.fact && r.p !== 1) err(w, 'a fact happens: p must be 1');
    if (!isNum(r.rumourLeadH, 0, 200)) err(w, 'rumourLeadH must be hours');
    text(w, r.news, 14, 'news');
    text(w, r.text, 60);
    if (!Array.isArray(r.fx)) { err(w, 'fx must be an array'); continue; }
    for (const e of r.fx) {
      if (!Array.isArray(e) || !S.CAL_FX[e[0]]) { err(w, `unknown calendar effect ${JSON.stringify(e)}`); continue; }
      args(S.CAL_FX[e[0]], e.slice(1), `${w} [${e[0]}]`);
    }
  }

  // ---------- covers ----------
  let starters = 0;
  for (const c of CV.values()) {
    const w = `cover:${c.id}`;
    keysOnly(c, ['id', 'nation', 'cls', 'man', 'woman', 'papers', 'backstopH', 'aff', 'props', 'unlock', 'blurb'], w);
    if (!LOWER_ID.test(c.id)) err(w, 'cover ids are lowercase');
    if (!N.has(c.nation)) err(w, `no nation ${c.nation}`);
    if (![1, 2, 3].includes(c.cls)) err(w, 'cls must be 1, 2 or 3');
    for (const s of ['man', 'woman']) { if (!isObj(c[s])) { err(w, `${s} missing`); continue; } keysOnly(c[s], ['name', 'legend'], `${w}.${s}`); text(`${w}.${s}`, c[s].name, 5, 'name'); text(`${w}.${s}`, c[s].legend, 12, 'legend'); }
    if (!isNum(c.papers, 0, 1)) err(w, 'papers must be 0..1');
    if (!isNum(c.backstopH, 1, 400)) err(w, 'backstopH must be hours');
    if (!isObj(c.aff)) err(w, 'aff must be an object');
    else for (const [t, v] of Object.entries(c.aff)) { if (!tagOk(t)) err(w, `bad aff tag ${t}`); if (![1, 0, -1].includes(v)) err(w, `aff ${t} must be 1, 0 or -1`); }
    if (!Array.isArray(c.props) || !c.props.every((p) => I.has(p))) err(w, 'props must be item ids');
    text(w, c.blurb, 30, 'blurb');
    if (c.unlock === null) starters++;
    else if (typeof c.unlock === 'string' && c.unlock.startsWith('op:')) { if (!O.has(c.unlock.slice(3))) err(w, `no op ${c.unlock.slice(3)}`); }
    else if (typeof c.unlock === 'string' && c.unlock.startsWith('person:')) { if (!P.has(c.unlock.slice(7))) err(w, `no person ${c.unlock.slice(7)}`); }
    else err(w, "unlock must be null, 'op:id' or 'person:id'");
  }
  if (CV.size && starters !== 2) warn('covers', `${starters} covers at the start; the design says two`);

  // ---------- items ----------
  for (const it of I.values()) {
    const w = `item:${it.id}`;
    keysOnly(it, ['id', 'name', 'city', 'price', 'sell', 'size', 'fn', 'tags', 'line'], w);
    if (!LOWER_ID.test(it.id)) err(w, 'item ids are lowercase with hyphens');
    text(w, it.name, 5, 'name');
    if (it.city !== null && !C.has(it.city)) err(w, `no city ${it.city}`);
    if (it.city === null ? it.price !== null : !isNum(it.price, 0, 500)) err(w, it.city === null ? 'an item sold nowhere has price null' : 'price must be £0..500');
    if (!isObj(it.sell)) err(w, 'sell must map city to £ (empty if unsellable)');
    else for (const [c, v] of Object.entries(it.sell)) { if (!C.has(c)) err(w, `sell: no city ${c}`); if (!isNum(v, 0, 1000)) err(w, `sell.${c} must be £`); }
    if (![0, 1, 2].includes(it.size)) err(w, 'size must be 0, 1 or 2');
    if (!S.ITEM_FNS.includes(it.fn)) err(w, `bad fn ${it.fn}`);
    if (!Array.isArray(it.tags)) err(w, 'tags must be an array');
    let use = null;
    for (const t of it.tags || []) {
      const [k, v] = String(t).split(':');
      if (t === 'contraband' || t === 'weapon') continue;
      if (k === 'perishable' && isNum(Number(v), 1, 1000)) continue;
      if (k === 'gift' && P.has(v)) continue;
      if (k === 'cover' && CV.has(v)) continue;
      if (k === 'use' && S.ITEM_USES.includes(v)) { use = v; continue; }
      err(w, `bad tag ${t}`);
    }
    if (it.fn === 'tool' && !use && !(it.tags || []).includes('weapon')) err(w, "a tool needs a 'use:' tag (or 'weapon')");
    if (it.fn === 'gift' && !(it.tags || []).some((t) => t.startsWith('gift:'))) warn(w, 'a gift with nobody who likes it');
    text(w, it.line, 25, 'line');
  }

  // ---------- people and hunters ----------
  const portraitOk = (p, w) => {
    if (!isObj(p)) { err(w, 'portrait missing'); return; }
    keysOnly(p, ['seed', 'sex', 'hat', 'hair', 'beard', 'collar', 'age'], `${w}.portrait`);
    if (!Number.isInteger(p.seed)) err(w, 'portrait.seed must be an integer');
    if (p.sex !== 'm' && p.sex !== 'f') err(w, 'portrait.sex must be m or f');
    for (const [k, list] of [['hat', S.HATS], ['hair', S.HAIR], ['beard', S.BEARDS], ['collar', S.COLLARS], ['age', S.AGES]]) if (!list.includes(p[k])) err(w, `portrait.${k} must be one of ${list.join(' ')}`);
    if (p.sex === 'f' && p.beard !== 'none') err(w, 'portrait: beard on a woman');
  };
  for (const p of P.values()) {
    const w = `person:${p.id}`;
    keysOnly(p, ['id', 'name', 'city', 'role', 'nation', 'wants', 'loyalty', 'courage', 'greed', 'likes', 'perks', 'portrait', 'entry', 'places'], w);
    if (!LOWER_ID.test(p.id)) err(w, 'person ids are lowercase');
    text(w, p.name, 5, 'name');
    if (p.city !== null && !C.has(p.city)) err(w, `no city ${p.city}`);
    text(w, p.role, 6, 'role');
    if (!N.has(p.nation)) err(w, `no nation ${p.nation}`);
    if (!Array.isArray(p.wants) || !p.wants.length || !p.wants.every((x) => S.WANTS.includes(x))) err(w, `wants must be from ${S.WANTS.join(' ')}`);
    if (isObj(p.loyalty)) { if (!Object.entries(p.loyalty).every(([k, v]) => loyaltyOk(k) && isNum(v, 0, 1))) err(w, 'weighted loyalty must map loyalties to weights'); }
    else if (!loyaltyOk(p.loyalty)) err(w, `bad loyalty ${p.loyalty}`);
    if (!isNum(p.courage, 0, 1) || !isNum(p.greed, 0, 1)) err(w, 'courage and greed must be 0..1');
    if (!Array.isArray(p.likes) || !p.likes.every((x) => I.has(x))) err(w, 'likes must be item ids');
    if (!Array.isArray(p.perks) || !p.perks.every((x) => S.PERKS.includes(x))) err(w, `perks must be from ${S.PERKS.join(' ')}`);
    portraitOk(p.portrait, w);
    if (!ST.has(p.entry)) err(w, `entry ${p.entry} is not a story`); else ref(p.entry, w);
    if (!Array.isArray(p.places) || p.places.length < 2) err(w, 'needs at least two places');
    for (const pl of p.places || []) if (!(C.has(pl) || (typeof pl === 'string' && pl.startsWith('train:') && L.has(pl.slice(6))))) err(w, `bad place ${pl}`);
    if (p.city && !(p.places || []).includes(p.city)) warn(w, 'places should include the home city');
  }
  for (const h of H.values()) {
    const w = `hunter:${h.id}`;
    keysOnly(h, ['id', 'name', 'service', 'nation', 'ground', 'look', 'start', 'from', 'portrait', 'voice'], w);
    text(w, h.name, 4, 'name'); text(w, h.service, 6, 'service'); text(w, h.look, 25, 'look');
    if (!N.has(h.nation)) err(w, `no nation ${h.nation}`);
    if (!Array.isArray(h.ground) || !h.ground.every((n) => N.has(n))) err(w, 'ground must be nation ids');
    if (!C.has(h.start)) err(w, `no city ${h.start}`);
    if (!isTime(h.from)) err(w, `bad time ${h.from}`);
    portraitOk(h.portrait, w);
    if (!Array.isArray(h.voice)) err(w, 'voice must be story ids');
    for (const v of h.voice || []) if (!ST.has(v)) err(w, `no story ${v}`); else ref(v, w);
  }

  // ---------- operations ----------
  const coversOpenTo = (ifs) => { // which covers could satisfy the cover-related conditions of a way
    return [...CV.values()].filter((c) => (ifs || []).every((x) => {
      if (!Array.isArray(x)) return true;
      if (x[0] === 'cover') return x[1] === c.id;
      if (x[0] === 'aff') { const v = c.aff?.[x[1]] ?? S.DEFAULT_AFF[x[1]] ?? 0; return cmpv(v, x[2], x[3]); }
      if (x[0] === 'not' && Array.isArray(x[1]) && x[1][0] === 'cover') return x[1][1] !== c.id;
      return true;
    })).length;
  };
  const cmpv = (a, op, b) => ({ '>': a > b, '>=': a >= b, '<': a < b, '<=': a <= b, '==': a === b, '!=': a !== b }[op]);
  for (const o of O.values()) {
    const w = `op:${o.id}`;
    keysOnly(o, ['id', 'act', 'issue', 'giver', 'title', 'brief', 'steps', 'twists', 'win', 'fail', 'debrief', 'side', 'optional'], w);
    if (!/^op-[a-z0-9-]+$/.test(o.id)) err(w, "op ids start with 'op-'");
    if (![1, 2, 3].includes(o.act)) err(w, 'act must be 1, 2 or 3');
    if (o.side) { if (o.issue !== null) err(w, 'a side op is started by a storylet: issue null'); }
    else if (!isTime(o.issue)) err(w, `bad issue time ${o.issue}`);
    if (!(o.giver === 'handler' || P.has(o.giver))) err(w, `giver must be 'handler' or a person`);
    text(w, o.title, 6, 'title'); text(w, o.brief, 60, 'brief'); text(w, o.debrief, 90, 'debrief');
    if (!Array.isArray(o.steps) || !o.steps.length) { err(w, 'needs steps'); continue; }
    const ids = new Set();
    let last = isTime(o.issue) ? T(o.issue) : -Infinity;
    for (const s of o.steps) {
      const sw = `${w} step ${s?.id}`;
      if (!isObj(s) || !LOWER_ID.test(s.id ?? '')) { err(w, 'step needs a lowercase id'); continue; }
      if (ids.has(s.id)) err(sw, 'duplicate step id');
      ids.add(s.id);
      keysOnly(s, ['id', 'kind', 'city', 'venue', 'person', 'item', 'to', 'min', 'clock', 'days', 'after', 'by', 'ways', 'gives', 'story', 'key', 'label'], sw);
      if (!S.STEP_KINDS.includes(s.kind)) { err(sw, `bad kind ${s.kind}`); continue; }
      if (s.label !== undefined) text(sw, s.label, 8, 'label');
      const need = { goto: ['city'], act: ['city', 'venue', 'ways'], meet: ['person'], wait: ['city', 'min'], carry: ['item', 'to'], observe: ['city', 'after', 'by'] }[s.kind];
      for (const k of need) if (s[k] === undefined) err(sw, `${s.kind} needs ${k}`);
      const cities = (x) => (Array.isArray(x) ? x : x === '*' && s.kind === 'act' ? [] : [x]);
      if (s.city !== undefined) for (const c of cities(s.city)) if (!C.has(c)) err(sw, `no city ${c}`);
      if (s.to !== undefined) for (const c of cities(s.to)) if (!C.has(c)) err(sw, `no city ${c}`);
      if (s.venue !== undefined && !(s.venue.startsWith?.('venue:') && tagOk(s.venue))) err(sw, `bad venue ${s.venue}`);
      if (s.venue && s.city) for (const c of cities(s.city)) if (C.get(c) && !C.get(c).venues?.includes(s.venue)) warn(sw, `${c} has no ${s.venue}`);
      if (s.person !== undefined && !P.has(s.person)) err(sw, `no person ${s.person}`);
      if (s.item !== undefined && !I.has(s.item)) err(sw, `no item ${s.item}`);
      if (s.gives !== undefined && !I.has(s.gives)) err(sw, `no item ${s.gives}`);
      if (s.min !== undefined && !isNum(s.min, 10, 4320)) err(sw, 'min must be 10..4320 minutes');
      if (s.clock !== undefined && !(Array.isArray(s.clock) && s.clock.length === 2 && s.clock.every(isClock))) err(sw, "clock must be ['hh.mm','hh.mm']");
      if (s.days !== undefined && !/^[0-6]+$/.test(s.days)) err(sw, 'days must be digits 0–6');
      for (const k of ['after', 'by']) if (s[k] !== undefined && !isTime(s[k])) err(sw, `bad ${k} ${s[k]}`);
      if (isTime(s.after) && isTime(s.by) && T(s.after) >= T(s.by)) err(sw, 'after must come before by');
      if (isTime(s.by)) { if (T(s.by) <= last) err(sw, 'by comes before the op is issued or an earlier step closes'); last = T(s.by); }
      if (s.story !== undefined) { if (!ST.has(s.story)) err(sw, `no story ${s.story}`); else ref(s.story, sw); }
      if (s.ways !== undefined) {
        if (!Array.isArray(s.ways) || !s.ways.length) { err(sw, 'ways must be a non-empty array'); continue; }
        const wids = new Set();
        let open3 = false;
        for (const x of s.ways) {
          const ww = `${sw} way ${x?.id}`;
          if (!isObj(x) || !LOWER_ID.test(x.id ?? '')) { err(sw, 'way needs a lowercase id'); continue; }
          if (wids.has(x.id)) err(ww, 'duplicate way id');
          wids.add(x.id);
          keysOnly(x, ['id', 'label', 'sub', 'tag', 'if', 'cost', 'risk', 'rec', 'ok', 'fail', 'story'], ww);
          text(ww, x.label, 7, 'label');
          if (x.sub !== undefined) text(ww, x.sub, 12, 'sub');
          if (x.tag !== undefined && !tagOk(x.tag)) err(ww, `bad tag ${x.tag}`);
          conds(x.if, ww); costOk(x.cost, ww); effects(x.ok, ww); effects(x.fail, ww);
          if (!isNum(x.risk, 0, 0.95)) err(ww, 'risk must be 0..0.95');
          if (x.rec !== undefined && x.rec !== null && !(Array.isArray(x.rec) && S.RECORD_KINDS.includes(x.rec[0]) && isNum(x.rec[1], 0, 1))) err(ww, 'rec must be [kind, fidelity] or null');
          if (x.story !== undefined) { if (!ST.has(x.story)) err(ww, `no story ${x.story}`); else ref(x.story, ww); }
          if (coversOpenTo(x.if) >= Math.min(3, CV.size)) open3 = true;
        }
        if (s.key !== false && s.ways.length < 2) err(sw, 'a key step needs at least two ways (key:false if it is not one)');
        if (!open3) err(sw, 'no way is open to at least three covers');
      }
    }
    for (const t of o.twists || []) {
      if (!isObj(t)) { err(w, 'twist must be { if, story }'); continue; }
      keysOnly(t, ['if', 'story'], `${w} twist`);
      conds(t.if, `${w} twist`);
      if (!ST.has(t.story)) err(`${w} twist`, `no story ${t.story}`); else ref(t.story, `${w} twist`);
    }
    effects(o.win, `${w} win`); effects(o.fail, `${w} fail`);
  }
  for (const c of CV.values()) {
    const u = c.unlock;
    if (typeof u !== 'string') continue;
    const grant = (es) => (es || []).some((e) => e[0] === 'cover' && e[1] === `+${c.id}`);
    const ok = u.startsWith('op:') ? grant(O.get(u.slice(3))?.win)
      : [...ST.values()].some((s) => s.speaker === u.slice(7) && (s.choices || []).some((ch) => grant(ch.ok) || grant(ch.fail)));
    if (!ok) warn(`cover:${c.id}`, `nothing grants it yet (${u} should apply ['cover','+${c.id}'])`);
  }

  // ---------- storylets ----------
  for (const s of ST.values()) {
    const w = `story:${s.id}`;
    keysOnly(s, ['id', 'at', 'if', 'w', 'once', 'speaker', 'from', 'title', 'text', 'choices'], w);
    if (s.from !== undefined && !P.has(s.from) && !H.has(s.from)) err(w, `no person or hunter ${s.from}`);
    if (s.from !== undefined && s.speaker !== undefined) err(w, 'a storylet has a speaker or a sender, not both');
    if (!STORY_ID.test(s.id)) err(w, 'story ids are lowercase words joined by dots');
    if (!S.STORY_AT.includes(s.at)) err(w, `bad at ${s.at}`);
    stats.byAt[s.at] = (stats.byAt[s.at] || 0) + 1;
    conds(s.if, w);
    if (s.w !== undefined && !isNum(s.w, 0.01, 100)) err(w, 'w must be a positive weight');
    if (s.once !== undefined && typeof s.once !== 'boolean') err(w, 'once must be true or false');
    if (s.speaker !== undefined && !P.has(s.speaker) && !H.has(s.speaker)) err(w, `no person or hunter ${s.speaker}`);
    if (s.at === 'person' && !P.has(s.speaker) && !H.has(s.speaker)) err(w, "an at:'person' storylet needs a speaker");
    text(w, s.title, 6, 'title'); text(w, s.text, 70);
    if (/\["(loyal|hunter)"/.test(JSON.stringify(s.if || [])) && !['encounter', 'op', 'then'].includes(s.at)) warn(w, 'tests a hidden truth outside an encounter, op or continuation');
    if (!Array.isArray(s.choices) || !s.choices.length) { err(w, 'needs choices'); continue; }
    if (s.choices.length > 5) err(w, 'at most five choices');
    if (s.choices.length < 2 && !['op', 'then'].includes(s.at)) err(w, 'needs at least two choices (decisions that matter)');
    let risky = false;
    s.choices.forEach((ch, i) => {
      const cw = `${w} choice ${i + 1}`;
      stats.choices++;
      if (!isObj(ch)) { err(cw, 'must be an object'); return; }
      keysOnly(ch, ['label', 'sub', 'tag', 'if', 'cost', 'roll', 'ok', 'fail', 'next'], cw);
      text(cw, ch.label, 7, 'label');
      if (ch.sub !== undefined) text(cw, ch.sub, 12, 'sub');
      if (ch.tag !== undefined && !tagOk(ch.tag)) err(cw, `bad tag ${ch.tag}`);
      conds(ch.if, cw); costOk(ch.cost, cw); rollOk(ch.roll, cw);
      if (ch.ok === undefined) err(cw, 'ok missing (use [] for none)');
      effects(ch.ok, cw);
      if (ch.fail !== undefined && !ch.roll) err(cw, 'fail without a roll never applies');
      if (ch.roll && ch.fail === undefined) warn(cw, 'a roll without fail effects');
      effects(ch.fail, cw);
      if (ch.next !== undefined) { if (!ST.has(ch.next)) err(cw, `no story ${ch.next}`); else ref(ch.next, cw); }
      const all = [...(ch.ok || []), ...(ch.fail || [])].filter(Array.isArray);
      const stakes = ch.roll || ch.next || ch.cost?.money > 0 || ch.cost?.nerve > 0 || all.some((e) => e[0] !== 'min');
      if (!stakes) err(cw, 'has no effect beyond time passing');
      const hurts = (e) => S.RISKY.has(e[0]) || (['money', 'nerve', 'standing'].includes(e[0]) && e[1] < 0) || (e[0] === 'trust' && e[2] < 0)
        || (e[0] === 'item' && String(e[1]).startsWith('-')) || (e[0] === 'st' && ['compromised', 'arrested', 'dead', 'turned'].includes(e[2])) || (e[0] === 'papers' && e[2] < 0);
      if (ch.roll || ch.cost?.money > 0 || ch.cost?.nerve > 0 || ch.cost?.min >= 120 || all.some(hurts)) risky = true;
    });
    if (!risky && s.at !== 'then') warn(w, 'no choice risks anything');
  }
  // reachability: continuations must be referenced; dialogue must be able to end
  for (const s of ST.values()) if (s.at === 'then' && !storyRefs.has(s.id)) err(`story:${s.id}`, "at:'then' but nothing leads here (next, later, entry, voice or op)");
  const ends = new Set();
  for (let changed = true; changed;) {
    changed = false;
    for (const s of ST.values()) {
      if (ends.has(s.id) || !Array.isArray(s.choices)) continue;
      if (s.choices.some((c) => !c?.next || ends.has(c.next))) { ends.add(s.id); changed = true; }
    }
  }
  for (const s of ST.values()) if (Array.isArray(s.choices) && !ends.has(s.id)) err(`story:${s.id}`, 'every path loops: the conversation can never end');
  for (const p of P.values()) {
    const n = [...ST.values()].filter((s) => s.speaker === p.id).length;
    if (n === 0) err(`person:${p.id}`, 'has no storylets');
    else if (n < 4) warn(`person:${p.id}`, `only ${n} storylets`);
  }
  // flags
  for (const [f, w] of flagRead) if (!flagSet.has(f) && !engineFlags(D).includes(f)) err(w, `reads flag ${f}, which nothing sets`);
  for (const [f, w] of flagSet) if (!flagRead.has(f)) warn(w, `sets flag ${f}, which nothing reads`);
  // persistence: share of travel and city storylets that leave a consequence for later
  const road = [...ST.values()].filter((s) => s.at === 'train' || s.at === 'city');
  const persists = road.filter((s) => (s.choices || []).some((c) => [...(c.ok || []), ...(c.fail || [])].some((e) => Array.isArray(e) && (e[0] === 'later' || ((e[0] === 'flag' || e[0] === 'unlock') && flagRead.has(String(e[1]).replace(/^flag:/, '')))))));
  stats.persistShare = road.length ? persists.length / road.length : 0;
  if (road.length >= 6 && stats.persistShare < 1 / 3) warn('stories', `only ${Math.round(stats.persistShare * 100)}% of city and train storylets leave a later consequence (want ≥ 33%)`);
  Object.assign(stats, { cities: C.size, lines: L.size, services: SV.size, people: P.size, hunters: H.size, items: I.size, covers: CV.size, ops: O.size, stories: ST.size, calendar: CAL.size });
  return { errors, warnings, stats };
}
