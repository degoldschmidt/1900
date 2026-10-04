// Boot and the clock. Builds the screen (globe, HUD, ledger, cards), runs time while the player travels or waits,
// saves, resumes, and exposes hooks for the tests.

import D from '../data/index.js';
import { newGame, makeGame, coverName, coverLegend } from '../core/game.js';
import { advance, endGame } from '../core/sim.js';
import { cardView } from '../core/actions.js';
import { currentStep, stepCities, activeOps } from '../core/ops.js';
import * as A from '../core/actions.js';
import { when, longDate, hm, span, dateOf } from '../data/time.js';
import { HEAT } from '../core/enemy.js';
import { makeGlobe, haloOf } from './globe.js';
import { makeLedger } from './ledger.js';
import { makeCards } from './cards.js';
import { creator } from './creator.js';
import { defaultHero } from '../core/hero.js';
import { portraitUrl } from './art.js';
import { $, esc, el, store } from './dom.js';

const KEY = 'shadow-express-v2';
const app = $('#app');
app.innerHTML = '';
const canvas = el('canvas'); canvas.id = 'globe'; canvas.setAttribute('aria-label', 'Map of Europe, summer 1914');
app.appendChild(canvas);
const hud = el('div', 'hud'); app.appendChild(hud);
const journeyEl = el('div', 'journey plate paper'); journeyEl.hidden = true; app.appendChild(journeyEl);
const toasts = el('div', 'toasts'); toasts.setAttribute('aria-live', 'polite'); app.appendChild(toasts);

let G = null, speed = 1, paused = false, dirty = true, highlightTo = null, wasTravelling = false;

const globe = makeGlobe(canvas, {
  game: () => G,
  ledgerInset: () => (ledger?.isOpen() ? (innerWidth >= 900 ? { right: 420, bottom: 0 } : { right: 0, bottom: innerHeight * .58 - 52 }) : { right: 0, bottom: innerWidth < 900 ? 52 : 0 }),
  onCity: (id) => {
    if (!G || G.S.ended) return;
    if (id === G.S.city) ledger.show('city');
    else if (G.S.city) { ledger.state.planTo = id; highlightTo = id; ledger.show('board', G.D.lines.some((l) => (l.a === G.S.city && l.b === id) || (l.b === G.S.city && l.a === id)) ? id : null); }
    dirty = true;
  },
  redraw: () => { dirty = true; },
});
const ledger = makeLedger(app, {
  refresh: () => refresh(),
  acted: () => { save(); refresh(); },
  toast: (t, bad) => toast(t, bad),
  ticket: (a, b, c) => {
    const t = el('div', 'toast ticket', `<div class="tk-h">Ticket</div><div class="tk-r">${esc(a)}</div><div class="tk-s">${esc(b)}</div><div class="tk-s">${esc(c)}</div>`);
    toasts.appendChild(t);
    while (toasts.children.length > 3) toasts.firstChild.remove();
    setTimeout(() => t.remove(), 5000);
  },
  layout: () => { globe.invalidate(); dirty = true; },
  booked: () => { ledger.setOpen(innerWidth >= 900); },
  highlight: (to) => { highlightTo = to; dirty = true; },
});
const cards = makeCards(app, { after: () => { save(); refresh(); }, toast: (t, b) => toast(t, b), ledgerOpen: () => ledger.isOpen() && innerWidth >= 900 });

function toast(text, bad) {
  const t = el('div', `toast paper${bad ? ' bad' : ''}`, esc(text));
  toasts.appendChild(t);
  while (toasts.children.length > 3) toasts.firstChild.remove();
  setTimeout(() => t.remove(), 5000);
}

// ---------- HUD ----------
function heatOf(id) {
  const S = G.S;
  let hi = 0;
  for (const r of S.records) if (r.cover === id) hi += ((r.heat ?? HEAT[r.kind] ?? 0) * 1.3 + .02) * r.fid;
  return Math.min(1, S.covers[id]?.burned ? 1 : hi);
}
let hudKey = '';
function renderHud() {
  const S = G.S;
  const d = dateOf(S.t);
  const key = [S.t, S.money, S.nerve, S.standing, S.cover, speed, paused, !!S.journey, S.records.length, ledger.isOpen(), innerWidth < 600].join('|');
  if (key === hudKey) return;
  hudKey = key;
  const act = G.W.act(S.t);
  const nerve = Array.from({ length: 10 }, (_, i) => `<i class="${S.nerve > i ? 'on' : ''}"></i>`).join('');
  const moving = !!S.journey || !!S.booked || S.t < S.busyUntil;
  const compact = innerWidth < 600;
  hud.classList.toggle('compact', compact);
  const faceKey = S.hero ? `hero-${JSON.stringify(S.hero.portrait)}` : null;
  hud.innerHTML = `${faceKey && !compact ? `<button class="plate paper" data-you title="Your file" style="padding:4px"><img class="face" alt="" data-hface src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></button>` : ''}<div class="plate paper"><div class="date">${esc(compact ? d.dayName.slice(0, 3) : d.dayName)} ${d.day} ${esc(compact ? d.monthName.slice(0, 4).replace(/e$/, '') : d.monthName)} · ${esc(hm(S.t))}<small>Act ${['I', 'II', 'III'][act - 1]}: ${['A Shot in Sarajevo', 'The Ultimatum', 'Mobilisation'][act - 1]}</small></div>
    <div class="stats"><span>£<b>${Math.round(S.money)}</b></span><span title="Nerve">${compact ? '' : 'nerve '}<span class="pips ${S.nerve <= 2 ? 'low' : ''}">${nerve}</span></span><span title="Standing with the Bureau">${compact ? '' : 'standing '}<span class="gauge"><i style="width:${S.standing}%"></i></span></span></div></div>
    <button class="plate paper coverbadge" data-covers title="Your cover"><div class="nm">${esc(coverName(G))}</div>${compact ? '' : `<div class="lg">${esc(coverLegend(G))}</div>`}<div class="lg">${compact ? '' : 'what they may know '}<span class="heat"><i style="left:0;width:${Math.round(heatOf(S.cover) * 100)}%"></i></span></div></button>
    <div class="speed">${compact ? '' : `<button class="iconbtn" data-ledger aria-pressed="${ledger.isOpen()}">Ledger</button>`}<button class="iconbtn" data-about aria-label="About">${compact ? '?' : 'About'}</button></div>
    ${moving ? `<div class="speed"><button class="iconbtn" data-speed aria-pressed="${speed > 1}">${compact ? ['»', '»»', '»»»'][[1, 3, 8].indexOf(speed)] : speed === 1 ? '» faster' : speed === 3 ? '»» fast' : '»»» fastest'}</button><button class="iconbtn" data-pause aria-pressed="${paused}">${paused ? '▶' + (compact ? '' : ' go on') : '❚❚' + (compact ? '' : ' pause')}</button></div>` : ''}`;
  hud.querySelector('[data-covers]').addEventListener('click', () => ledger.show('covers'));
  hud.querySelector('[data-you]')?.addEventListener('click', () => ledger.show('you'));
  if (faceKey) portraitUrl(faceKey, S.hero.portrait).then((u) => { const im = hud.querySelector('[data-hface]'); if (u && im) im.src = u; });
  hud.querySelector('[data-ledger]')?.addEventListener('click', () => { ledger.setOpen(!ledger.isOpen()); hudKey = ''; refresh(); });
  hud.querySelector('[data-about]').addEventListener('click', about);
  hud.querySelector('[data-speed]')?.addEventListener('click', () => { speed = speed === 1 ? 3 : speed === 3 ? 8 : 1; hudKey = ''; renderHud(); });
  hud.querySelector('[data-pause]')?.addEventListener('click', () => { paused = !paused; hudKey = ''; renderHud(); });
}
function renderJourney() {
  const S = G.S;
  if (!S.journey && !S.booked) { journeyEl.hidden = true; return; }
  journeyEl.hidden = false;
  if (S.booked) { const r = S.booked.dp; journeyEl.innerHTML = `<div class="ln"><span class="sc">Waiting for the ${esc(G.W.service.get(r.svc).name)}</span><span>${esc(hm(r.dep))}</span></div><div class="ln dim"><span>to ${esc(G.I.city.get(r.to).name)}</span><span>in ${esc(span(r.dep - S.t))}</span></div>`; return; }
  const j = S.journey, f = Math.max(0, Math.min(1, (S.t - j.dep) / Math.max(1, j.arr - j.dep)));
  const marks = j.crossings.map((x) => `<s style="left:${Math.round(((x.t - j.dep) / Math.max(1, j.arr - j.dep)) * 100)}%" title="${esc(x.name)}"></s>`).join('');
  const trip = S.trip, next = trip?.legs[trip.i + 1];
  const conn = next ? `<div class="ln dim"><span>change at ${esc(G.I.city.get(next.from).name)} for the ${esc(hm(next.dep))} to ${esc(G.I.city.get(next.to).name)}</span><span>${esc(trip.legs.length - trip.i - 1)} more</span></div>` : '';
  journeyEl.innerHTML = `<div class="ln"><span class="sc">${esc(G.W.service.get(j.svc).name)}</span><span>${esc(G.I.city.get(j.to).name)}</span></div><div class="bar"><i style="width:${Math.round(f * 100)}%"></i>${marks}</div><div class="ln dim"><span>${esc(G.I.city.get(j.from).name)} ${esc(hm(j.dep))}</span><span>due ${esc(hm(j.sched))}</span></div>${conn}`;
}

// ---------- what the globe shows ----------
let ovKey = '', ovVal = null;
function overlays() {
  const S = G.S;
  const key = `${Math.floor(S.t / 15)}|${S.city}|${highlightTo}|${S.intel.length}|${S.queue.length}`;
  if (key === ovKey && ovVal) return ovVal;
  ovKey = key;
  ovVal = computeOverlays();
  return ovVal;
}
function computeOverlays() {
  const S = G.S;
  const targets = new Set();
  for (const o of activeOps(G)) { const s = currentStep(G, o.id); if (!s) continue; const cs = s.kind === 'meet' ? [s.city ?? G.I.person.get(s.person).city].flat() : stepCities(s); for (const c of cs) if (c && c !== '*') targets.add(c); }
  const highlight = new Set();
  if (highlightTo && S.city) for (const it of A.plan(G, highlightTo).slice(0, 1)) for (const l of it.legs) highlight.add(l.line);
  // hunters, from the dossier: the latest word of each
  const marks = [];
  for (const h of G.D.hunters) {
    const e = S.intel.filter((x) => x.subj === `hunter:${h.id}` && x.claim.at && x.resolved !== false).sort((a, b) => b.learned - a.learned)[0];
    if (!e) continue;
    const age = S.t - e.learned;
    if (age > 4 * 1440) continue;
    const kind = e.src === 'seen' ? 'seen' : e.src.startsWith('person:') || e.src === 'porter' || e.src === 'bureau' ? 'reported' : 'rumour';
    const ll = G.I.city.get(e.claim.at).ll;
    const key = `${h.id}|${e.id}|${Math.floor(S.t / 60)}`;
    haloCache[key] ??= haloOf(G.W, e.claim.at, e.learned, S.t);
    marks.push({ ll, kind, alpha: Math.max(.3, 1 - age / (4 * 1440)), label: `${h.name.split(' ').at(-1)} · ${span(age)} ago`, halo: haloCache[key] });
  }
  // lines the player knows are closed now
  const knownCancelled = new Set();
  for (const l of G.D.lines) {
    const svcs = G.D.services.filter((x) => x.line === l.id && x.kind !== 'path');
    if (!svcs.length) continue;
    const rows = svcs.map((x) => G.W.suspended(x, S.t));
    if (rows.every(Boolean) && rows.every((r) => { const row = G.W.rows.find((y) => y.id === r); return (row?.fact && row.t <= S.t) || S.newsSeen.includes(r); })) knownCancelled.add(l.id);
  }
  return { targets, highlight, hunterMarks: marks, knownCancelled };
}
const haloCache = {};

// ---------- the clock ----------
let last = performance.now(), lastPulse = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000);
  last = now;
  if (G && !G.S.ended && !paused) {
    const S = G.S;
    const open = cardView(G);
    if (!open) {
      let rate = 0, stop = Infinity;
      if (S.journey) { rate = Math.max(40, Math.min(600, (S.journey.arr - S.journey.dep) / 7)); stop = S.journey.arr + 1; }
      else if (S.booked) { rate = 240; stop = S.booked.dep + 1; }
      else if (S.t < S.busyUntil || S.routine) { rate = S.routine ? 900 : 200; stop = S.routine ? S.routine.until : S.busyUntil; }
      if (rate) {
        const before = S.t;
        advance(G, Math.min(stop, S.t + rate * speed * dt));
        if (S.t !== before) dirty = true;
        if (!S.journey && !S.booked && S.t >= S.busyUntil && !cardView(G)) { refresh(); save(); }
        if (wasTravelling && !S.journey && !S.booked && S.city) { wasTravelling = false; ledger.state.tab = 'city'; ledger.setOpen(true); refresh(); }
        if (S.journey) wasTravelling = true;
      }
    }
  }
  if (G) {
    globe.aim(G, dt);
    const pulse = G.S.city && !G.S.journey && now - lastPulse > 90;
    if (dirty || globe.view.moving || pulse) { globe.draw(G, overlays()); dirty = false; if (pulse) lastPulse = now; }
    renderHud();
    renderJourney();
    if (cardView(G)) { if (!cards.isOpen()) { cards.render(G); } else cards.render(G); }
    else if (cards.isOpen()) cards.render(G);
  } else globe.draw(null, {});
  requestAnimationFrame(frame);
}
let lastLedgerKey = '';
function refresh() {
  if (!G) return;
  lastLedgerKey = '';
  ledger.render(G);
  cards.render(G);
  hudKey = '';
  dirty = true;
}
setInterval(() => { // keep the ledger fresh as time passes in a city
  if (!G) return;
  const k = `${G.S.t}|${G.S.city}|${!!G.S.journey}|${G.S.queue.length}`;
  if (k !== lastLedgerKey && !cardView(G)) { lastLedgerKey = k; ledger.render(G); }
}, 700);

function save() { if (G) store.set(KEY, JSON.stringify(G.S)); }

function about() {
  const t = el('div', 'title');
  t.innerHTML = `<div class="card paper"><div class="kick">About</div><h2>Shadow Express</h2><div class="rule"></div>
    <p>A spy journey through the July Crisis of 1914. The dates and headlines in the newspapers are real; the people you meet are invented, and so is what the crisis does to each train, frontier and price: that is the game's design, not history.</p>
    <p>What you know is in the dossier: what you have seen, what you only suspect, and the traces you have left behind you, with your guess at when each will reach the other side. Hunters on the map are drawn as you last heard of them; the dotted rings are where they could be by now.</p>
    <p class="dim">An original game in the manner of the great travel-and-choice games. Art, words and code made for this prototype.</p>
    <div class="choices"><button class="choice" data-close><b>Back to the game</b></button><button class="choice" data-new><b>Begin a new campaign</b><span>this one will be lost</span></button></div></div>`;
  app.appendChild(t);
  t.querySelector('[data-close]').addEventListener('click', () => t.remove());
  t.querySelector('[data-new]').addEventListener('click', () => { t.remove(); store.del(KEY); G = null; title((hero) => start(hero)); });
}

// ---------- start ----------
function title(onStart) {
  const t = el('div', 'title');
  t.dataset.v = '2';
  t.innerHTML = `<div class="card paper"><div class="kick">Europe, summer 1914</div><h1>Shadow Express</h1><div class="rule"></div>
    <p>Sunday, the twenty-eighth of June. In Sarajevo, the heir to the Austrian throne has been shot. In London, a commander of the Secret Service Bureau sends for you.</p>
    <p>For five weeks you will cross Europe by named trains under borrowed names, with papers that may not bear inspection. You will cultivate people who may betray you, and betray some who trust you. Three hunters work from whatever you leave behind: a hotel register, a passenger list, a frontier book, a face.</p>
    <p class="dim">Drag the globe to turn it; pinch or scroll to look closer. Tap a city for its trains. Every choice may come back.</p>
    <div class="choices"><button class="choice" data-new><b>Make your agent</b><span>name, looks, past, talents, faults and kit</span></button><button class="choice" data-quick><b>Begin at once</b><span>with a ready-made agent</span></button></div></div>`;
  app.appendChild(t);
  t.querySelector('[data-new]').addEventListener('click', () => { t.remove(); creator(app, D.items, (hero) => onStart(hero), D.people); });
  t.querySelector('[data-quick]').addEventListener('click', () => { t.remove(); onStart(defaultHero(Math.random() < .5 ? 'm' : 'f')); });
}
function start(hero, seed = (Date.now() ^ 0x5eed) >>> 0) {
  if (typeof hero === 'string') hero = defaultHero(hero);
  G = makeGame(D, newGame(D, { seed, hero }));
  G.endGame = endGame;
  highlightTo = null;
  ledger.state.tab = 'city';
  ledger.setOpen(true);
  advance(G, G.S.t + 1);
  refresh();
  save();
}
function resume(S) {
  G = makeGame(D, S);
  G.endGame = endGame;
  ledger.setOpen(true);
  refresh();
  toast(`Resumed: ${when(S.t)}, ${S.journey ? 'travelling' : G.I.city.get(S.city)?.name ?? ''}.`);
}
function boot(data) {
  globe.resize();
  let saved = data?.state ?? null;
  if (!saved) { try { saved = JSON.parse(store.get(KEY) || 'null'); } catch { saved = null; } }
  if (saved && saved.v === 2 && !saved.ended) resume(saved);
  else title((hero) => start(hero));
  requestAnimationFrame(frame);
}
window.addEventListener('resize', () => { globe.resize(); dirty = true; });
window.addEventListener('pagehide', save);
setInterval(save, 15000);
if (window.claude?.hot?.snapshot) window.claude.hot.snapshot(() => ({ state: G?.S }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});

// hooks for the tests
window.__shadow = {
  get G() { return G; }, D, A, advance: (t) => advance(G, t), start: (hero = 'm', seed = 7) => { document.querySelectorAll('.title').forEach((x) => x.remove()); start(hero, seed); },
  setSpeed: (v) => { speed = v; }, refresh, ledger, globe,
};
