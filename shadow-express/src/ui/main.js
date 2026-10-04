// Boot and the clock. Builds the screen (globe, HUD, ledger, cards), runs time while the player travels or waits,
// saves, resumes, and exposes hooks for the tests.

import D from '../data/index.js';
import { newGame, makeGame } from '../core/game.js';
import { advance, endGame } from '../core/sim.js';
import { cardView } from '../core/actions.js';
import { currentStep, stepCities, activeOps } from '../core/ops.js';
import * as A from '../core/actions.js';
import { when, span } from '../data/time.js';
import { makeGlobe, haloOf } from './globe.js';
import { makeLedger } from './ledger.js';
import { makeCards } from './cards.js';
import { makeHud } from './hud.js';
import { copyRunReport } from './report-ui.js';
import { makeHints } from './hints.js';
import { creator } from './creator.js';
import { defaultHero } from '../core/hero.js';
import { $, esc, el, store } from './dom.js';
import { iconSVG } from './icons.js';

const KEY = 'shadow-express-v2';
const app = $('#app');
app.innerHTML = '';
const canvas = el('canvas'); canvas.id = 'globe'; canvas.setAttribute('aria-label', 'Map of Europe, summer 1914');
app.appendChild(canvas);
const toasts = el('div', 'toasts'); toasts.setAttribute('aria-live', 'polite'); app.appendChild(toasts);

let G = null, speed = 1, paused = false, dirty = true, highlightTo = null, wasTravelling = false;

/** What the ledger covers of the screen: a panel on the right, or a sheet from the bottom on a phone. */
const ledgerInset = () => (ledger?.isOpen() ? (innerWidth >= 900 ? { right: 420, bottom: 0 } : { right: 0, bottom: innerHeight * .58 }) : { right: 0, bottom: innerWidth < 900 ? 52 : 0 });
const globe = makeGlobe(canvas, {
  game: () => G,
  ledgerInset,
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
const cards = makeCards(app, { after: () => { save(); refresh(); }, toast: (t, b) => toast(t, b), ledgerOpen: () => ledger.isOpen() && innerWidth >= 900, newCampaign: () => newCampaign() });

const hud = makeHud(app, {
  game: () => G,
  open: (tab) => { if (G) ledger.show(tab); },
  toggleLedger: () => { ledger.setOpen(!ledger.isOpen()); refresh(); },
  ledgerOpen: () => ledger.isOpen(),
  about: () => about(),
  inset: ledgerInset,
  speed: () => speed, setSpeed: (v) => { speed = v; },
  paused: () => paused, setPaused: (v) => { paused = v; },
  stopRoutine: () => { if (G) { A.stopRoutine(G); save(); refresh(); } },
  cardAside: () => !!G && cards.isAside(),
  reopenCard: () => cards.reopen(),
});

// the Bureau's instructions: one-time hints while nothing else is on screen
const hints = makeHints(app, {
  game: () => G,
  openTab: (k) => { if (G) ledger.show(k); },
  pause: () => {},
  save: () => save(),
  busy: () => cards.isOpen() || cards.isAside() || !!app.querySelector('.title'), // a card (even set aside), the creator, About, the title page
});
setInterval(() => hints.check(), 1000);

// the ledger closes with its own button too
const ledgerX = el('button', 'ledger-x', iconSVG('close'));
ledgerX.type = 'button'; ledgerX.setAttribute('aria-label', 'Close the ledger'); ledgerX.title = 'Close the ledger';
ledgerX.addEventListener('click', () => { ledger.setOpen(false); refresh(); });
ledger.el.appendChild(ledgerX);
// while a card waits for an answer, the ledger can be read but not acted on: its buttons lead back to the card
const ACTS = ['do', 'seek', 'activity', 'pass', 'trip', 'wait', 'lodge', 'way', 'book', 'switch', 'stash', 'retrieve', 'sendfor', 'buy', 'sell', 'use', 'mend', 'courier', 'query'].map((k) => `[data-${k}]`).join(',');
ledger.el.addEventListener('click', (e) => {
  if (!G || !cardView(G) || !e.target.closest?.(ACTS)) return;
  e.stopPropagation(); e.preventDefault();
  cards.reopen();
}, true);
// Escape closes what is on top: About or the creator, then a card, then the ledger
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const top = [...app.querySelectorAll('.title')].at(-1);
  if (top) { top.querySelector('.card-x')?.click(); return; }
  if (G && cards.isOpen()) { cards.dismiss(); return; }
  if (hints.isOpen()) { hints.dismiss(); return; }
  if (G && ledger.isOpen()) { ledger.setOpen(false); refresh(); }
});
app.appendChild(toasts); // toasts above the HUD

function toast(text, bad) {
  const t = el('div', `toast${bad ? ' bad' : ''}`, esc(text));
  toasts.appendChild(t);
  while (toasts.children.length > 3) toasts.firstChild.remove();
  setTimeout(() => t.remove(), 5000);
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
  let route = null;
  if (highlightTo && S.city) for (const it of A.plan(G, highlightTo).slice(0, 1)) {
    for (const l of it.legs) highlight.add(l.line);
    route = [G.I.city.get(S.city).ll, ...it.legs.map((l) => G.I.city.get(l.to).ll)];
  }
  const fk = `${highlightTo}|${S.city}`;
  if (fk !== framedFor) { framedFor = fk; globe.frameRoute(S.journey ? null : route); } // a new plan is shown whole, once
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
  return { targets, highlight, hunterMarks: marks, knownCancelled, callout: !S.journey, planTo: S.journey ? null : highlightTo };
}
const haloCache = {};
let framedFor = '';

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
      else if (S.t < S.busyUntil || S.routine) { rate = S.routine ? 900 : 200; stop = S.routine ? Math.max(S.routine.until, S.busyUntil) : S.busyUntil; }
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
    hud.render(G, { speed, paused });
    hud.place(G, globe.project);
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
  hints.check();
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
  t.innerHTML = `<div class="card-frame"><button type="button" class="card-x" data-close aria-label="Close" title="Close">${iconSVG('close')}</button><div class="card paper"><div class="kick">About</div><h2>Shadow Express</h2><div class="rule"></div>
    <p>A spy journey through the July Crisis of 1914. The dates and headlines in the newspapers are real; the people you meet are invented, and so is what the crisis does to each train, frontier and price: that is the game's design, not history.</p>
    <p>What you know is in the dossier: what you have seen, what you only suspect, and the traces you have left behind you, with your guess at when each will reach the other side. Hunters on the map are drawn as you last heard of them; the dotted rings are where they could be by now.</p>
    <p>Living under cover: every name you use has a legend in every city, which grows while you work it and wears thin when you do not. The local police watch you more closely after each slip and less after each quiet day; past a point they follow you, search your rooms, or call. Spare papers are safest left with the Bureau in London and sent for by the embassy bag.</p>
    <p class="dim">On the map: the callout over your city counts its trains in the next six hours (tap it for the departures); the pill at the top keeps your money, the day and the hour; the briefcase opens the ledger; your portrait opens your file, with your nerve (♥) and your standing with the Bureau (★).</p>
    <p class="dim">An original game in the manner of the great travel-and-choice games. Art, words and code made for this prototype.</p>
    <div class="choices"><button class="choice" data-close><b>Back to the game</b></button>${G ? `<button class="choice" data-hints><b>${hints.enabled() ? 'Hints are on' : 'Show the hints again'}</b><span>${hints.enabled() ? 'the Bureau’s instructions to agents abroad; press to switch them off' : 'from the beginning, one at a time'}</span></button>` : ''}${G ? '<button class="choice" data-report><b>Copy run report</b><span>a plain account of this campaign, to paste to the developer</span></button>' : ''}<button class="choice" data-new><b>Begin a new campaign</b><span>this one will be lost</span></button></div></div></div>`;
  app.appendChild(t);
  t.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => t.remove()));
  t.addEventListener('click', (e) => { if (e.target === t) t.remove(); }); // a click beside the page closes it too
  t.querySelector('.choice[data-close]')?.focus({ preventScroll: true });
  t.querySelector('[data-hints]')?.addEventListener('click', (e) => {
    if (hints.enabled()) hints.setEnabled(false); else hints.reset();
    const b = e.currentTarget;
    b.querySelector('b').textContent = hints.enabled() ? 'Hints are on' : 'Hints are off';
    b.querySelector('span').textContent = hints.enabled() ? 'they will come as the moment does' : 'press again to show them from the beginning';
  });
  t.querySelector('[data-report]')?.addEventListener('click', (e) => { const sub = e.currentTarget.querySelector('span'); copyRunReport(G).then((m) => { sub.textContent = m; sub.setAttribute('role', 'status'); }); });
  t.querySelector('[data-new]').addEventListener('click', () => { t.remove(); newCampaign(); });
}
/** Forget this campaign and go back to the title. */
function newCampaign() {
  store.del(KEY);
  G = null;
  cards.reset();
  ledger.setOpen(false);
  title((hero) => start(hero));
}

// ---------- start ----------
function title(onStart) {
  hud.show(false);
  const t = el('div', 'title');
  t.dataset.v = '2';
  t.innerHTML = `<div class="card paper"><div class="kick">Europe, summer 1914</div><h1>Shadow Express</h1><div class="rule"></div>
    <p>Sunday, the twenty-eighth of June. In Sarajevo, the heir to the Austrian throne has been shot. In London, a commander of the Secret Service Bureau sends for you.</p>
    <p>For five weeks you will live under borrowed names in Vienna, Belgrade and Berlin, working a legend by day and listening in cafés by night. Now and then the Bureau sends you on a journey where a late train, a missed connection or a commissioner with a list can undo weeks of patience. You will cultivate people who may betray you, and betray some who trust you. Three hunters work from whatever you leave behind: a hotel register, a passenger list, a frontier book, a face.</p>
    <p class="dim">Drag the globe to turn it; pinch or scroll to look closer. Tap a city for its trains. Every choice may come back.</p>
    <div class="choices"><button class="choice" data-new><b>Make your agent</b><span>name, looks, past, talents, faults and kit</span></button><button class="choice" data-quick><b>Begin at once</b><span>with a ready-made agent</span></button></div></div>`;
  app.appendChild(t);
  t.querySelector('[data-new]').addEventListener('click', () => { t.remove(); creator(app, D.items, (hero) => onStart(hero), D.people, () => title(onStart)); });
  t.querySelector('[data-quick]').addEventListener('click', () => { t.remove(); onStart(defaultHero(Math.random() < .5 ? 'm' : 'f')); });
}
function start(hero, seed = (Date.now() ^ 0x5eed) >>> 0) {
  if (typeof hero === 'string') hero = defaultHero(hero);
  G = makeGame(D, newGame(D, { seed, hero }));
  G.endGame = endGame;
  cards.reset();
  hud.show(true);
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
  hud.show(true);
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
  setSpeed: (v) => { speed = v; }, refresh, ledger, globe, hints,
};
