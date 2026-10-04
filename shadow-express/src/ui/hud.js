// The heads-up display over the globe, in the manner of the travel games: a dark pill at the top with money, the day
// and the hour; round buttons in the corners (the ledger's briefcase, the gear for About); the agent's portrait peeking
// in at the bottom right with nerve and standing; the cover being worn; a callout over the city you are in, with its
// trains for the next few hours; and a status bar while the clock runs (a journey, a wait for a train, the routine).
// Built once; each frame only changes text and positions.

import { esc, el } from './dom.js';
import { iconSVG } from './icons.js';
import { dateOf, hm, span, when, T, DAY } from '../data/time.js';
import { coverName } from '../core/game.js';
import * as A from '../core/actions.js';
import { activeOps, currentStep, stepCities } from '../core/ops.js';
import { HEAT } from '../core/enemy.js';
import { portraitUrl } from './art.js';

const ACTS = ['A Shot in Sarajevo', 'The Ultimatum', 'Mobilisation'];
const ROMAN = ['I', 'II', 'III'];
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * hooks: { open(tab, arg), toggleLedger(), ledgerOpen(), about(), inset() → {right, bottom},
 *          speed() / setSpeed(v), paused() / setPaused(v), stopRoutine() }
 */
export function makeHud(app, hooks) {
  const root = el('div', 'hud2');
  root.innerHTML = `
    <div class="hpill" role="status" aria-live="off">
      <span class="hp-money" title="Money"></span>
      <span class="hp-day"><b></b><span class="hp-time"></span></span>
      <span class="hp-date"></span>
    </div>
    <div class="hp-act"></div>
    <button class="rbtn dark hgear" aria-label="About and settings" title="About and settings">${iconSVG('gear')}</button>
    <button class="rbtn light hcase" aria-label="The ledger" title="The ledger">${iconSVG('case')}</button>
    <button class="hcover" title="The name you are using: what they may know of it"><span class="hc-k">as</span><span class="hc-n"></span><span class="hc-heat"><i></i></span></button>
    <button class="hhero" aria-label="Your file" title="Your file"><span class="hh-tab"><span class="hh-nerve">${iconSVG('heart')}<b></b></span><span class="hh-stand">${iconSVG('star')}<b></b></span></span><img alt="" src="${BLANK}"></button>
    <button class="hwait" hidden title="Back to the card"><i></i><b>A card waits for you</b><span>Back to it</span></button>
    <div class="hstatus" hidden><div class="hs-main"></div><div class="hs-ctl"><button class="hs-speed" aria-label="Faster"></button><button class="hs-pause" aria-label="Pause"></button></div></div>
    <div class="callout" hidden><div class="co-box"><div class="co-name"></div><button class="co-badge" aria-label="Trains from here in the next six hours">${iconSVG('train')}<b></b></button><div class="co-sub"></div><div class="co-due"></div></div><i class="co-stem"></i></div>`;
  app.appendChild(root);
  const q = (s) => root.querySelector(s);
  const E = {
    money: q('.hp-money'), day: q('.hp-day b'), time: q('.hp-time'), date: q('.hp-date'), act: q('.hp-act'),
    gear: q('.hgear'), kase: q('.hcase'), cover: q('.hcover'), coverName: q('.hc-n'), heat: q('.hc-heat i'),
    hero: q('.hhero'), img: q('.hhero img'), nerve: q('.hh-nerve b'), stand: q('.hh-stand b'), nerveBox: q('.hh-nerve'),
    status: q('.hstatus'), smain: q('.hs-main'), speed: q('.hs-speed'), pause: q('.hs-pause'),
    wait: q('.hwait'), co: q('.callout'), coName: q('.co-name'), coBadge: q('.co-badge'), coN: q('.co-badge b'), coSub: q('.co-sub'), coDue: q('.co-due'),
  };
  E.gear.addEventListener('click', () => hooks.about());
  E.kase.addEventListener('click', () => hooks.toggleLedger());
  E.cover.addEventListener('click', () => hooks.open('covers'));
  E.hero.addEventListener('click', () => hooks.open('you'));
  E.coBadge.addEventListener('click', () => hooks.open('board'));
  E.wait.addEventListener('click', () => hooks.reopenCard?.());
  E.speed.addEventListener('click', () => { const s = hooks.speed(); hooks.setSpeed(s === 1 ? 3 : s === 3 ? 8 : 1); last = ''; });
  E.pause.addEventListener('click', () => {
    const G = hooks.game();
    if (G?.S.routine && !G.S.journey && !G.S.booked) { hooks.stopRoutine(); last = ''; return; }
    hooks.setPaused(!hooks.paused()); last = '';
  });
  // render() runs every frame: write to the DOM only what changed
  const set = (e, v) => { if (e.textContent !== v) e.textContent = v; };
  const attr = (e, k, v) => { if (e.getAttribute(k) !== v) e.setAttribute(k, v); };
  const styled = new Map();
  const css = (e, k, v) => { const key = `${k}`; const m = styled.get(e) ?? {}; if (m[key] !== v) { m[key] = v; styled.set(e, m); if (k.startsWith('--')) e.style.setProperty(k, v); else e.style[k] = v; } };
  let last = '', faceKey = '', coKey = '', co = null, heatKey = '';

  /** Heat of a cover: how much the other side may hold on it (0–1), from the records left under it. */
  function heatOf(G, id) {
    const S = G.S;
    if (S.covers[id]?.burned) return 1;
    let hi = 0;
    for (const r of S.records) if (r.cover === id) hi += ((r.heat ?? HEAT[r.kind] ?? 0) * 1.3 + 0.02) * r.fid;
    return Math.min(1, hi);
  }

  /** The callout's contents: trains in the next six hours, the soonest, and the nearest order deadline. */
  function calloutData(G) {
    const S = G.S;
    const rows = A.board(G, 6).filter((r) => !r.cancelled);
    const first = rows[0];
    let due = null;
    for (const o of activeOps(G)) {
      const s = currentStep(G, o.id);
      if (!s?.by) continue;
      const t = T(s.by);
      if (t > S.t && (!due || t < due.t)) due = { t, here: stepCities(s).includes(S.city) };
    }
    return {
      n: rows.length,
      sub: first ? `next ${hm(first.dep)} to ${G.I.city.get(first.to).name}` : 'no trains for six hours',
      due: due ? `orders due ${when(due.t)}` : '',
    };
  }

  function render(G, { speed, paused }) {
    const S = G.S, d = dateOf(S.t), inset = hooks.inset();
    const phone = innerWidth < 900;
    const moving = !!S.journey || !!S.booked || !!S.routine || S.t < S.busyUntil;
    css(root, '--gr', `${Math.round(inset.right)}px`);
    css(root, '--gb', `${Math.round(inset.bottom)}px`);
    root.classList.toggle('sheet', phone && hooks.ledgerOpen());
    root.classList.toggle('moving', moving);
    // the pill
    set(E.money, `£${Math.round(S.money)}`);
    set(E.day, `Day ${d.d + 1}`);
    set(E.time, hm(S.t));
    set(E.date, phone ? `${d.dayName.slice(0, 3)} ${d.day} ${d.monthName.slice(0, 3)}` : `${d.dayName} ${d.day} ${d.monthName}`);
    const act = G.W.act(S.t);
    set(E.act, `Act ${ROMAN[act - 1]} · ${ACTS[act - 1]}`);
    // the agent and the cover
    set(E.nerve, String(S.nerve));
    set(E.stand, String(Math.round(S.standing)));
    E.nerveBox.classList.toggle('low', S.nerve <= 2);
    set(E.coverName, coverName(G));
    const hk = `${S.cover}|${S.recN}|${S.records.length}|${!!S.covers[S.cover]?.burned}`;
    if (hk !== heatKey) { heatKey = hk; css(E.heat, 'width', `${Math.round(heatOf(G, S.cover) * 100)}%`); }
    attr(E.kase, 'aria-pressed', String(hooks.ledgerOpen()));
    const fk = S.hero ? `hero-${JSON.stringify(S.hero.portrait)}` : '';
    if (fk && fk !== faceKey) { faceKey = fk; portraitUrl(fk, S.hero.portrait).then((u) => { if (u && faceKey === fk) E.img.src = u; }); }
    if (E.hero.hidden !== !fk) E.hero.hidden = !fk;
    // a card set aside: the way back to it
    const waiting = !!hooks.cardAside?.();
    if (E.wait.hidden === waiting) E.wait.hidden = !waiting;
    root.classList.toggle('waiting', waiting);
    // the status bar
    const key = [Math.floor(S.t), speed, paused, !!S.journey, !!S.booked, !!S.routine, S.busyUntil].join('|');
    if (key !== last) { last = key; status(G, speed, paused, moving); }
    // the callout's words (its place is set every frame by place())
    const ck = `${S.city}|${Math.floor(S.t / 5)}|${S.journey ? 1 : 0}|${S.queue.length}`;
    if (ck !== coKey) {
      coKey = ck;
      co = S.city && !S.journey ? calloutData(G) : null;
      if (co) {
        set(E.coName, G.I.city.get(S.city).name);
        set(E.coN, `×${co.n}`);
        E.coBadge.classList.toggle('none', !co.n);
        set(E.coSub, co.sub);
        set(E.coDue, co.due);
        E.coDue.hidden = !co.due;
      }
    }
  }

  function status(G, speed, paused, moving) {
    const S = G.S;
    E.status.hidden = !moving;
    if (!moving) return;
    const city = (id) => esc(G.I.city.get(id).name);
    let h = '';
    if (S.journey) {
      const j = S.journey, f = Math.max(0, Math.min(1, (S.t - j.dep) / Math.max(1, j.arr - j.dep)));
      const marks = j.crossings.map((x) => `<s style="left:${Math.round(((x.t - j.dep) / Math.max(1, j.arr - j.dep)) * 100)}%" title="${esc(x.name)}"></s>`).join('');
      const next = S.trip?.legs[S.trip.i + 1];
      h = `<div class="hs-l"><b>${esc(G.W.service.get(j.svc).name)}</b><span>to ${city(j.to)}</span></div>
        <div class="hs-bar"><i style="width:${(f * 100).toFixed(1)}%"></i>${marks}</div>
        <div class="hs-l dim"><span>${city(j.from)} ${esc(hm(j.dep))}</span><span>due ${esc(hm(j.sched))}</span></div>
        ${next ? `<div class="hs-l dim"><span>change at ${city(next.from)} for the ${esc(hm(next.dep))}</span><span>${S.trip.legs.length - S.trip.i - 1} more</span></div>` : ''}`;
    } else if (S.booked) {
      const r = S.booked.dp;
      h = `<div class="hs-l"><b>Waiting for ${esc(G.W.service.get(r.svc).name)}</b><span>${esc(hm(r.dep))}</span></div>
        <div class="hs-l dim"><span>to ${city(r.to)}</span><span>in ${esc(span(r.dep - S.t))}</span></div>`;
    } else if (S.routine) {
      const r = S.routine;
      h = `<div class="hs-l"><b>Letting the days pass</b><span>until ${esc(when(r.until))}</span></div>
        <div class="hs-l dim"><span>the routine stops for anything that needs you</span></div>`;
    } else {
      h = `<div class="hs-l"><b>Busy</b><span>until ${esc(hm(S.busyUntil))}</span></div>`;
    }
    E.smain.innerHTML = h;
    const routineOnly = S.routine && !S.journey && !S.booked;
    E.speed.textContent = ['»', '»»', '»»»'][[1, 3, 8].indexOf(speed)] ?? '»';
    E.speed.setAttribute('aria-pressed', String(speed > 1));
    E.speed.title = speed === 1 ? 'Faster' : speed === 3 ? 'Fastest' : 'Normal speed';
    E.pause.textContent = routineOnly ? '■' : paused ? '▶' : '❚❚';
    E.pause.title = routineOnly ? 'Stop the routine' : paused ? 'Go on' : 'Pause';
    E.pause.setAttribute('aria-label', E.pause.title);
    E.pause.setAttribute('aria-pressed', String(!!paused));
  }

  /** Keep the callout over the city marker as the globe turns; hide it when the city is out of sight. */
  let coPos = '';
  function place(G, project) {
    const S = G?.S;
    const show = !!(co && S && S.city && !S.journey && !S.ended);
    const p = show ? project(G.I.city.get(S.city).ll) : null;
    const inset = hooks.inset();
    const inView = p && p[0] > 20 && p[0] < innerWidth - inset.right - 20 && p[1] > 20 && p[1] < innerHeight - inset.bottom - 10;
    if (!inView) { if (!E.co.hidden) E.co.hidden = true; coPos = ''; return; }
    const below = p[1] < 150; // too near the top: hang the callout under the marker instead
    const pos = `${Math.round(p[0])},${Math.round(p[1])},${below}`;
    if (E.co.hidden) E.co.hidden = false;
    if (pos === coPos) return;
    coPos = pos;
    E.co.classList.toggle('below', below);
    E.co.style.transform = `translate(${Math.round(p[0])}px, ${Math.round(p[1])}px)`;
  }

  function show(on) { root.hidden = !on; if (!on) E.co.hidden = true; }
  show(false);
  return { render, place, show, el: root };
}
