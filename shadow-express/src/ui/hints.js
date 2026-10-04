// Hints: the Bureau's "Instructions to Agents Abroad". Eight one-time, skippable notes that explain the game as it is
// played: one small paper card at the foot of the screen, shown only when nothing else is happening.
//
//   dueHint(G, ui)          pure, no DOM: the hint due now, or null. `ui` = { open, tab } says what the ledger shows.
//   makeHints(app, hooks)   the card itself. hooks = { game, openTab, pause, save, busy }:
//     game()     the running game, or null        openTab(key)  show a ledger tab (the links in a hint's text)
//     save()     persist after a change           busy()        a card, the creator or the About page is on screen
//     pause(on)  accepted, never used: nothing runs while a hint can show (it needs an idle game)
//   returns { check, reset, enabled, setEnabled, isOpen, dismiss }; the caller runs check() after every refresh and about once a second.
//
// State lives in the campaign: G.S.hints = { off, seen: { [id]: campaign minute } }, made when first needed, so older
// saves load unchanged.

import { esc } from './dom.js';
import { iconSVG } from './icons.js';

const HOUR = 60;
export const GAP_MS = 3000;     // real time between one hint closing and the next opening
export const SETTLE_MS = 800;   // real time a hint must have been due before it opens
export const READ_MS = 2500;    // a hint on screen this long counts as read when the player's own move closes it
const RECHECK_MS = 500;

// ---------- what the game is doing ----------
/** Nothing is happening: in a city, no journey, no booked train, no busy clock, no routine, no card waiting. */
export function isIdle(G) {
  const S = G?.S;
  return !!S && !S.ended && !!S.city && !S.journey && !S.booked && S.t >= S.busyUntil && !S.routine && !(S.queue?.length);
}
const journeys = (S) => S.stats?.journeys ?? 0;
const ordersOpen = (S) => Object.values(S.ops ?? {}).some((o) => o.status === 'active');
const spareCovers = (S) => Object.entries(S.covers ?? {}).some(([id, c]) => id !== S.cover && c.carried && !c.burned);
const hasTrace = (S) => (S.records ?? []).some((r) => r.kind !== 'plan' && r.kind !== 'calm' && !r.planted);
/** Someone met in play: the old acquaintance of the creator counts only once you have sought them out. */
const metSomeone = (S) => Object.values(S.people ?? {}).some((p) => p.st && p.st !== 'unknown' && (!p.old || p.covers?.length));
const sinceArrival = (S) => (S.cityArrived == null ? Infinity : S.t - S.cityArrived);
const onTab = (ui, tab) => !!ui?.open && ui.tab === tab;

// ---------- the hints ----------
// Array order is the priority when several are due, and the number printed on the card. {tab|Words} makes a link that
// opens that tab. due(G, ui): the hint applies now. done(G, ui): the player is already doing what it says.
export const HINTS = [
  { id: 'orders', n: 1,
    text: 'Your orders are kept under {orders|Orders} in the Ledger. To obey one, open {board|Trains}, or the city label with the train badge on the map, and choose ‘Plan a route to…’: the whole journey is booked at once, changes included.',
    due: ({ S }) => ordersOpen(S) && journeys(S) === 0,
    done: (G, ui) => onTab(ui, 'board') },
  { id: 'trains', n: 2,
    text: 'Read each departure with care. Its labels name the frontier controls and how strict they are, the records it keeps of you (passenger list, sleeping-car berth) and how soon they reach the enemy. The line beneath says whether it keeps time.',
    due: (G, ui) => onTab(ui, 'board') },
  { id: 'papers', n: 3,
    text: 'A second passport found in a search burns both names. Before you go, leave your spare papers with the Bureau: {covers|Covers}, ‘Leave here’. Abroad, ‘Send for them by the bag’ brings them in two days for £3.',
    due: ({ S }) => spareCovers(S) && journeys(S) === 0 && ordersOpen(S),
    done: (G, ui) => onTab(ui, 'covers') },
  { id: 'arrival', n: 4,
    text: 'Take lodgings under City: an hotel enters you in its register, rented rooms in the police’s; each register is a trace. ‘Your legend here’ shows how well your name is established in this town: work it, or it wears thin.',
    due: ({ S }) => journeys(S) >= 1 && sinceArrival(S) <= 12 * HOUR },
  { id: 'traces', n: 5,
    text: 'You are leaving traces: registers, passenger lists, frontier books. In the {dossier|Dossier}, ‘They know’ shows what you have left and about when it reaches the enemy; ‘Known’ and ‘Suspected’ hold what you have seen and what you only suspect.',
    due: ({ S }) => journeys(S) >= 1 && hasTrace(S) && sinceArrival(S) >= 3 * HOUR,
    done: (G, ui) => onTab(ui, 'dossier') },
  { id: 'days', n: 6,
    text: 'Under City, ‘Let the days pass’ runs your routine, pausing at each card but heeding no deadline: read Orders first, and ‘Stop the routine’ in time. By day ‘Keep to your rooms’, by night ‘Sleep’: a hunter finds you less often there.',
    due: ({ S }) => journeys(S) >= 1 && sinceArrival(S) >= 12 * HOUR },
  { id: 'frontier', n: 7,
    text: 'At a frontier the officials may wave you through, ask for papers or search your case. Papers, a bribe, a few plain words: each is a risk, never a certainty. The labels beneath a departure say how strict its controls are.',
    due: ({ S }, ui) => (S.stats?.controls ?? 0) > 0 && onTab(ui, 'board') },
  { id: 'people', n: 8,
    text: 'Those you meet are kept under {people|People}. Trust, shown in dots, grows with attention and with gifts they like; it takes about three before anyone will serve you. A recruit lends you their talents, but what they know of you, the enemy may learn.',
    due: ({ S }) => metSomeone(S),
    done: (G, ui) => onTab(ui, 'people') },
];
const BY_ID = new Map(HINTS.map((h) => [h.id, h]));

const MARK = /\{([a-z]+)\|([^}]+)\}/g;
/** A hint's words as the player reads them, links without their markup. */
export const plain = (text) => text.replace(MARK, '$2');
const html = (text) => {
  let out = '', i = 0;
  for (const m of text.matchAll(MARK)) { out += esc(text.slice(i, m.index)) + `<button type="button" class="hint-tab" data-tab="${m[1]}">${esc(m[2])}</button>`; i = m.index + m[0].length; }
  return out + esc(text.slice(i));
};

/** The hint due now, or null. Reads the game and what the ledger shows; changes nothing. */
export function dueHint(G, ui = {}) {
  const S = G?.S;
  if (!S || !isIdle(G) || S.hints?.off) return null;
  const seen = S.hints?.seen ?? {};
  for (const h of HINTS) if (seen[h.id] == null && h.due(G, ui)) return h.id;
  return null;
}

// ---------- the card ----------
export function makeHints(app, hooks = {}, opts = {}) {
  const now = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  let card = null, openId = null, openedAt = 0, lastCloseAt = -Infinity, pending = null, timer = 0, bound = false;

  const game = () => hooks.game?.() ?? null;
  const state = (G) => { const S = G.S; S.hints ??= { off: false, seen: {} }; S.hints.seen ??= {}; return S.hints; };
  const later = (ms) => { clearTimeout(timer); timer = setTimeout(check, Math.max(30, ms)); timer?.unref?.(); };
  const markSeen = (G, id) => { state(G).seen[id] ??= G.S.t; };
  /** What the ledger shows, read from the page: whether it is open, and which tab. */
  function readUi() {
    const lg = app?.querySelector?.('.ledger');
    const open = !!lg && lg.dataset.open === 'true';
    return { open, tab: open ? lg.querySelector('.tab[aria-selected="true"]')?.dataset.tab ?? null : null };
  }

  /** Dock the card above the corner buttons; above the ledger when that is a sheet, clear of it when it is a side panel. */
  function place() {
    if (!card) return;
    const lg = app.querySelector('.ledger');
    let lift = 0, inset = 0;
    if (lg && lg.dataset.open === 'true') {
      const a = app.getBoundingClientRect(), r = lg.getBoundingClientRect();
      if (r.width < a.width * .9) inset = Math.max(0, a.right - r.left); else lift = Math.max(0, a.bottom - r.top);
    }
    card.style.setProperty('--hint-inset', `${Math.round(inset)}px`);
    card.style.setProperty('--hint-lift', `${Math.round(lift)}px`);
  }
  function bind() {
    if (bound) return;
    bound = true;
    window.addEventListener('resize', place);
    app.addEventListener('transitionend', (e) => { if (e.target.classList?.contains('ledger')) place(); }); // the ledger sliding in or out
  }

  function show(id) {
    const h = BY_ID.get(id);
    card = app.ownerDocument.createElement('aside');
    card.className = 'hint paper';
    card.dataset.hint = id;
    card.setAttribute('role', 'status');
    card.setAttribute('aria-label', 'Instructions to Agents Abroad');
    card.innerHTML = `<button type="button" class="card-x" aria-label="Close" title="Close">${iconSVG('close')}</button><div class="kick">Instructions to Agents Abroad · §${h.n}</div><p>${html(h.text)}</p><div class="hint-actions"><button type="button" class="hint-off">No more hints</button><button type="button" class="hint-ok">Understood</button></div>`;
    card.querySelector('.card-x').addEventListener('click', () => close('ok'));
    card.querySelector('.hint-ok').addEventListener('click', () => close('ok'));
    card.querySelector('.hint-off').addEventListener('click', () => close('off'));
    card.querySelectorAll('.hint-tab').forEach((b) => b.addEventListener('click', () => { hooks.openTab?.(b.dataset.tab); close('done'); }));
    card.addEventListener('keydown', (e) => { if (e.key === 'Escape') close('ok'); });
    app.appendChild(card);
    openId = id; openedAt = now(); pending = null;
    bind();
    place();
    later(RECHECK_MS);
  }
  function hide() {
    card?.remove();
    card = null; openId = null;
  }
  /** Close the card. 'ok', 'done' (the player did as it said) and 'off' count as read; 'lost' (the moment passed) only if it was on screen long enough. */
  function close(why) {
    if (!card) return;
    const id = openId, G = game(), shownFor = now() - openedAt;
    hide();
    lastCloseAt = now();
    pending = null;
    if (G?.S && (why !== 'lost' || shownFor >= READ_MS)) { markSeen(G, id); if (why === 'off') state(G).off = true; hooks.save?.(); }
    later(GAP_MS + 50);
  }

  /** Show, keep or close the card as the game allows. */
  function check() {
    clearTimeout(timer); timer = 0;
    const G = game();
    if (!G?.S) { hide(); pending = null; return; }
    const ui = readUi();
    const idle = isIdle(G) && !hooks.busy?.();
    if (card) {
      const h = BY_ID.get(openId);
      if (G.S.hints?.off) hide();                       // switched off elsewhere
      else if (!idle) close('lost');                    // time moved on, or a card or page took the screen
      else if (h.done?.(G, ui)) close('done');          // the player is doing what it says
      else if (!h.due(G, ui)) close('lost');            // the moment passed
      else { place(); later(RECHECK_MS); }
      return;
    }
    if (!app) return;
    let id = idle ? dueHint(G, ui) : null;
    while (id && BY_ID.get(id).done?.(G, ui)) { markSeen(G, id); hooks.save?.(); id = dueHint(G, ui); } // already knows: no need to say
    if (!id) { pending = null; return; }
    const t = now();
    if (pending?.id !== id) pending = { id, since: t };
    const wait = Math.max(pending.since + SETTLE_MS - t, lastCloseAt + GAP_MS - t);
    if (wait > 0) later(wait + 20); else show(id);
  }

  return {
    check,
    /** Forget what has been shown, switch hints on again, and close the card. */
    reset() {
      const G = game();
      if (G?.S) { G.S.hints = { off: false, seen: {} }; hooks.save?.(); }
      hide(); pending = null; lastCloseAt = -Infinity;
      later(SETTLE_MS);
    },
    enabled: () => !game()?.S?.hints?.off,
    setEnabled(on) {
      const G = game();
      if (!G?.S) return;
      state(G).off = !on;
      hooks.save?.();
      if (!on) { hide(); pending = null; } else later(SETTLE_MS);
    },
    isOpen: () => !!card,
    /** Close the card as if "Understood" had been pressed (for a caller's Escape key). */
    dismiss: () => close('ok'),
  };
}
