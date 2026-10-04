// Cards over the globe: storylets, frontier controls, encounters, telegrams, newspapers, arrival postcards, debriefs.
// Each choice shows its stakes; after a roll the card says how it went and what changed.

import { cardView, choose, decline } from '../core/actions.js';
import { context, text, coverName, aff } from '../core/game.js';
import { chanceOf } from '../core/storylet.js';
import { postmortem } from '../core/postmortem.js';
import { when, longDate, hm, span } from '../data/time.js';
import { portraitUrl, glyphSvg, weatherAt } from './art.js';
import { esc } from './dom.js';
import { iconSVG } from './icons.js';
import { postcard, postcardInput, hasPostcard } from './postcard.js';
import { copyRunReport } from './report-ui.js';

/** Service names carry their own article ('the Calais night mail', 'a Greek island steamer'); this starts a sentence with one. */
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const oddsWord = (p) => (p >= .85 ? 'all but certain' : p >= .65 ? 'likely' : p >= .45 ? 'even chances' : p >= .25 ? 'unlikely' : 'a long shot');

/** What changed between two snapshots of the state, in a few words each. */
export function changes(G, a, b) {
  const out = [];
  const d = (x, y, f) => (y !== x ? f(y - x) : null);
  out.push(d(a.money, b.money, (n) => [`${n > 0 ? '+' : '−'}£${Math.abs(Math.round(n))}`, n < 0 ? 'bad' : 'good']));
  out.push(d(a.nerve, b.nerve, (n) => [`nerve ${n > 0 ? '+' : '−'}${Math.abs(n)}`, n < 0 ? 'bad' : 'good']));
  out.push(d(a.standing, b.standing, (n) => [`standing ${n > 0 ? '+' : '−'}${Math.abs(n)}`, n < 0 ? 'bad' : 'good']));
  for (const [id, p] of Object.entries(b.people)) {
    const q = a.people[id];
    if (q.trust !== p.trust) out.push([`${G.I.person.get(id).name.split(' ').at(-1)}: trust ${p.trust > q.trust ? '+' : '−'}${Math.abs(p.trust - q.trust)}`, p.trust < q.trust ? 'bad' : 'good']);
    if (q.st !== p.st) out.push([`${G.I.person.get(id).name}: ${p.st}`, ['compromised', 'arrested', 'dead'].includes(p.st) ? 'bad' : 'good']);
  }
  const items = (s) => s.case.map((x) => x.id).sort().join(',');
  if (items(a) !== items(b)) {
    const ai = a.case.map((x) => x.id), bi = b.case.map((x) => x.id);
    for (const id of bi.filter((x) => !ai.includes(x) || bi.filter((y) => y === x).length > ai.filter((y) => y === x).length)) out.push([`+ ${G.I.item.get(id)?.name}`, 'good']);
    for (const id of ai.filter((x) => !bi.includes(x))) out.push([`− ${G.I.item.get(id)?.name}`, 'bad']);
  }
  for (const id of Object.keys(b.covers)) if (!a.covers[id]) out.push([`new papers: ${coverName(G, id)}`, 'good']);
  const recs = b.records.length - a.records.length;
  if (recs > 0) out.push([recs === 1 ? 'you left a trace' : `you left ${recs} traces`, 'warn']);
  if (b.intel.length > a.intel.length) out.push(['a note for the dossier', '']);
  if (b.later.length > a.later.length) out.push(['this may come back', 'warn']);
  const mins = Math.max(b.busyUntil, b.t) - Math.max(a.busyUntil, a.t);
  if (mins >= 30) out.push([mins >= 120 ? `${Math.round(mins / 60)} hours` : `${mins} minutes`, '']);
  return out.filter(Boolean);
}

const snap = (S) => JSON.parse(JSON.stringify({ money: S.money, nerve: S.nerve, standing: S.standing, people: S.people, case: S.case, covers: S.covers, records: S.records.map((r) => r.id), intel: S.intel.map((e) => e.id), later: S.later, busyUntil: S.busyUntil, t: S.t }));

export function makeCards(root, hooks) {
  const veil = document.createElement('div');
  veil.className = 'veil';
  veil.hidden = true;
  const frame = document.createElement('div'); // holds the card (which scrolls) and its close button (which does not)
  frame.className = 'card-frame';
  const card = document.createElement('div');
  card.className = 'card paper';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'card-x';
  x.innerHTML = iconSVG('close');
  frame.append(card, x);
  veil.appendChild(frame);
  root.appendChild(veil);
  let shownN = null, resultShown = false, aside = null, cur = null;
  let pc = null; // the living postcard on an arrival card
  x.addEventListener('click', () => dismiss());
  veil.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); dismiss(); } });

  /**
   * The close button, as the engine rules it (cardView's close). 'continue': a card that only informs is done with.
   * 'decline': one the player could walk away from closes with no effect (a meeting sought and thought better of gives
   * back its time). 'aside': one that needs an answer is set aside; the map and the ledger can be looked at, the clock
   * stays stopped, and the HUD offers the way back to it.
   */
  function dismiss() {
    if (!cur || veil.hidden) return;
    if (resultShown) { card.querySelector('#cardCont')?.click(); return; }
    const kind = cur.v.close;
    if (kind === 'continue') { card.querySelector('.choice[data-i="0"]')?.click(); return; }
    if (kind === 'decline') { if (decline(cur.G)) { shownN = null; hooks.after?.(); } return; }
    aside = cur.v.card.n;
    veil.hidden = true;
    hooks.aside?.();
  }
  /** The close button's look and words: a cross closes; a chevron sets aside what needs an answer. */
  function closeButton(v) {
    const kind = v.close;
    const label = kind === 'aside' ? 'This needs your answer: set it aside for now' : kind === 'decline' ? (v.card.sought ? 'Never mind' : 'Walk away') : 'Close';
    x.innerHTML = iconSVG(kind === 'aside' ? 'aside' : 'close');
    x.classList.toggle('aside', kind === 'aside');
    x.setAttribute('aria-label', label);
    x.title = kind === 'aside' ? 'Set aside: this needs your answer' : label;
  }
  function reopen() { aside = null; shownN = null; hooks.after?.(); }
  function reset() { aside = null; shownN = null; cur = null; resultShown = false; veil.hidden = true; }

  function render(G) {
    const v = G ? cardView(G) : null;
    if (!v) { veil.hidden = true; shownN = null; aside = null; cur = null; return false; }
    if (aside === v.card.n) { veil.hidden = true; return false; }
    aside = null;
    if (shownN === v.card.n && !veil.hidden) return true;
    shownN = v.card.n; resultShown = false;
    cur = { G, v };
    closeButton(v);
    veil.hidden = false;
    veil.classList.toggle('withledger', !!hooks.ledgerOpen?.());
    card.className = 'card paper';
    if (pc) { pc.destroy(); pc = null; }
    card.innerHTML = body(G, v) + choicesHtml(G, v);
    wire(G, v);
    card.scrollTop = 0;
    card.querySelector('.choice:not(:disabled)')?.focus({ preventScroll: true });
    return true;
  }

  function body(G, v) {
    const { S, I } = G;
    const c = v.card, st = v.story;
    const t = (s) => esc(text(G, s, c)).replace(/\n/g, '<br>');
    if (c.type === 'telegram') {
      const o = I.op.get(c.op);
      card.classList.add('telegram');
      const giver = o.giver === 'handler' ? 'ASHBY LONDON' : (I.person.get(o.giver)?.name ?? '').toUpperCase();
      return `<div class="form"><div class="hd"><span>TELEGRAM</span><span>${esc(when(S.t).toUpperCase())}</span></div><div class="kick">${esc(o.side ? 'A favour' : `Act ${o.act}`)} · ${esc(giver)}</div><h2 class="sc">${esc(o.title)}</h2><p>${esc(o.brief)}</p>${S.ops[c.op]?.advance ? `<p class="dim">£${S.ops[c.op].advance} FOR EXPENSES WIRED WITH THIS ORDER</p>` : ''}</div>`;
    }
    if (c.type === 'news') {
      card.classList.add('news');
      const rows = c.rows.map((id) => G.W.rows.find((r) => r.id === id)).filter(Boolean);
      return `<div class="mast">The Continental Herald</div><div class="dateline"><span>${esc(longDate(S.t))}</span><span>One penny</span></div>${rows.map((r) => `<div class="head">${esc(r.news)}</div><div class="col"><p>${esc(r.text)}</p></div>`).join('')}`;
    }
    if (c.type === 'arrive') {
      const city = I.city.get(c.city);
      const late = c.delay > 20 ? ` · ${Math.round(c.delay)} minutes late` : '';
      // the city's postcard, living: the hour, the weather, the news
      if (hasPostcard(c.city)) setTimeout(() => {
        const host = card.querySelector('.pc-wide');
        if (!host || pc) return;
        pc = postcard(c.city, postcardInput(G, c.city, S.t, weatherAt(G, c.city, S.t)), { width: host.clientWidth || 440 });
        host.append(pc.el);
      }, 0);
      return `<div class="kick">Arrived · ${esc(when(S.t))}${esc(late)}</div>${hasPostcard(c.city) ? '<div class="wide pc-wide"></div>' : ''}<h2>${esc(city.name)}</h2><p class="it">${esc(city.line)}</p>`;
    }
    if (c.type === 'debrief') {
      const o = I.op.get(c.op);
      const lines = S.debrief.filter((d) => d.op === c.op).map((d) => `<p>${esc(d.text)}</p>`).join('');
      card.classList.add('debrief');
      return `<div class="kick">Debrief · ${esc(when(S.t))}</div><span class="stamp ${c.won ? 'ok' : ''}" style="float:right">${c.won ? 'ACCOMPLISHED' : 'FAILED'}</span><h2>${esc(o.title)}</h2>${lines}<div class="rule"></div><p class="it">${esc(o.debrief)}</p>`;
    }
    if (c.type === 'act') { card.classList.add('title-card'); return `<div class="kick">${esc(longDate(S.t))}</div><h1>${esc(c.title.split(' · ')[1] ?? c.title)}</h1><div class="kick" style="text-align:center">${esc(c.title.split(' · ')[0])}</div><div class="rule"></div><p>${esc(c.text)}</p>`; }
    if (c.type === 'missed') { card.classList.add('danger'); return `<div class="kick">${esc(I.city.get(c.city).name)} · ${esc(when(S.t))}</div><h2>Missed connection</h2><p>${esc(cap(G.W.service.get(c.svc).name))} for ${esc(I.city.get(c.to).name)} left at ${esc(hm(c.dep))}${S.t > c.dep ? `, ${esc(span(S.t - c.dep))} before you stepped down` : ''}. A porter shrugs. The station clock does not care about your orders.</p>`; }
    if (c.type === 'late') return `<div class="kick">${esc(G.W.service.get(S.journey?.svc)?.name ?? '')}</div><h2>Running late</h2><p>The guard says the train is ${esc(span(c.delay))} behind time. At ${esc(I.city.get(c.at).name)} ${esc(G.W.service.get(c.svc).name)} leaves at ${esc(hm(c.dep))}: you will not make it, unless it waits.</p>`;
    if (c.type === 'inspector') { card.classList.add('danger'); return `<div class="kick">${esc(I.city.get(S.city)?.name ?? '')} · ${esc(when(S.t))}</div><h2>An inspector calls</h2><p>A man in a good overcoat is waiting in your rooms, hat on his knee. Police. He has a list of questions and all the time in the world: your business here, your friends, the letters you post, and why ${esc(coverName(G))} keeps the hours ${S.sex === 'f' ? 'she' : 'he'} does.</p>`; }
    if (c.type === 'note') return `<div class="kick">${esc(when(S.t))}</div><h2>${esc(c.title)}</h2><p>${esc(c.text)}</p>`;
    if (c.type === 'end') return endText(G, c);
    // storylets, controls, encounters
    let kick = '', art = '';
    const who = st?.speaker ?? st?.from;
    const speaker = who ? (I.person.get(who) ?? I.hunter.get(who)) : null;
    if (c.type === 'control') kick = `Frontier control · ${c.name}`;
    else if (c.type === 'encounter') kick = `${I.hunter.get(c.hunter).name}`;
    else if (speaker && st.from) kick = `From ${speaker.name}${speaker.role ? ` · ${speaker.role}` : ''}`;
    else if (speaker) kick = `${speaker.name}${speaker.role ? ` · ${speaker.role}` : ''}`;
    else kick = S.journey ? `${G.W.service.get(S.journey.svc).name}` : I.city.get(S.city)?.name ?? '';
    const face = c.type === 'encounter' ? I.hunter.get(c.hunter) : speaker;
    if (face?.portrait) { art = `<div class="art"><img alt="" data-portrait="${esc(face.id)}"></div>`; setTimeout(() => portraitUrl(face.id, face.portrait).then((u) => { const im = card.querySelector(`[data-portrait="${face.id}"]`); if (u && im) im.src = u; }), 0); }
    else if (c.type === 'control') art = `<div class="art">${glyphSvg('sentry')}</div>`;
    if (c.type === 'encounter' || c.type === 'control') card.classList.add('danger');
    const title = st?.title ?? (c.type === 'control' ? 'Your papers, please' : c.type === 'encounter' ? 'A hand on your sleeve' : '');
    const def = c.type === 'control' ? `The ${c.papers ? 'commissioner works down the corridor, asking for papers' : 'customs men come aboard with chalk and a lamp'}${c.search ? '; the cases come down from the racks' : ''}.`
      : c.type === 'encounter' ? `${I.hunter.get(c.hunter).look[0].toUpperCase()}${I.hunter.get(c.hunter).look.slice(1)}. He has found you.` : '';
    return `<div class="kick">${esc(kick)}</div>${art}<h2>${esc(title)}</h2><p>${st ? t(st.text) : esc(def)}</p>${c.type === 'control' && st ? `<p class="dim">${esc(def)}</p>` : ''}`;
  }

  function choicesHtml(G, v) {
    const ctx = context(G, v.card);
    return `<div class="choices">${v.choices.map((c, i) => {
      const fit = c.tag ? aff(G, c.tag) : 1;
      const p = c.std ? c.p : c.roll ? Math.max(.05, chanceOf(c.roll, ctx) - (fit < 0 ? .2 : 0)) : null;
      const fitNote = fit < 0 ? `implausible for ${coverName(G)}` : fit === 0 ? `odd for ${coverName(G)}` : null;
      const cost = [c.cost?.money ? `£${c.cost.money}` : null, c.cost?.nerve ? `nerve ${c.cost.nerve}` : null, c.cost?.min >= 60 ? `${Math.round(c.cost.min / 60)}h` : c.cost?.min ? `${c.cost.min} min` : null].filter(Boolean).join(' · ');
      const sub = [c.sub ? text(G, c.sub, v.card) : null, cost && !(c.sub ?? '').includes('£') ? cost : null, fitNote].filter(Boolean).join(' — ');
      if (v.card.type === 'end') return `<button class="choice" data-i="${i}"><b>Begin a new campaign</b><span>another agent, another summer</span></button>`;
      if (c.std === 'nevermind') return `<button class="choice quiet" data-i="${i}"><b>${esc(c.label)}</b><span>${esc(c.sub)}</span></button>`;
      return `<button class="choice" data-i="${i}" ${c.open === false || c.afford === false ? 'disabled' : ''}>${p !== null && p !== undefined ? `<span class="odds">${oddsWord(p)}</span>` : ''}<b>${esc(text(G, c.label, v.card))}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }

  function wire(G, v) {
    const report = card.querySelector('[data-copy-report]'); // the end card only; the answer shows on the button, since a toast would sit under the veil
    report?.addEventListener('click', () => copyRunReport(G).then((m) => { const s = report.querySelector('span'); if (s) { s.textContent = m; s.setAttribute('role', 'status'); } }));
    card.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      if (resultShown) return;
      if (v.card.type === 'end') { hooks.newCampaign?.(); return; } // the summer is over: the only way on is a new one
      const c = v.choices[Number(b.dataset.i)];
      const before = snap(G.S);
      const res = choose(G, Number(b.dataset.i));
      if (!res) { hooks.toast?.('Not possible now.', true); return; }
      const ch = changes(G, before, G.S);
      const rolled = c.roll || (c.std && c.p !== undefined && c.p < 1);
      const typeEnd = G.S.ended;
      if ((rolled || ch.length) && !['telegram', 'news', 'arrive', 'note', 'debrief', 'act', 'missed'].includes(v.card.type) && !typeEnd) {
        resultShown = true;
        const word = rolled ? (res.success ? 'It goes as you hoped.' : 'It does not go your way.') : 'Done.';
        card.querySelector('.choices').innerHTML = `<p class="result">${esc(word)}</p><div class="chips" style="justify-content:flex-start">${ch.map(([s, k]) => `<span class="chip ${k}">${esc(s)}</span>`).join('')}</div><button class="choice" id="cardCont"><b>Continue</b></button>`;
        card.querySelector('#cardCont').addEventListener('click', () => { resultShown = false; shownN = null; hooks.after?.(); });
        card.querySelector('#cardCont').focus({ preventScroll: true });
        return;
      }
      shownN = null;
      hooks.after?.();
    }));
  }

  return { render, isOpen: () => !veil.hidden, isAside: () => aside !== null, reopen, reset, dismiss, el: veil };
}

// ---------- the end card ----------
/** The end card: how it ended, the Bureau's verdict, the contacts' fates, and what the other side held on you. */
export function endText(G, c) {
  const { S } = G;
  const why = {
    home: 'You came home before the lamps went out.', stranded: 'The last boat sailed without you.', time: 'The war overtook you on the road.',
    arrested: 'Arrested.', captured: 'Taken.', exposed: 'Every name you had is known to them.', recalled: 'The Bureau has recalled you.',
  }[c.why] ?? 'The end.';
  const mains = G.D.ops.filter((o) => !o.side);
  const won = mains.filter((o) => S.ops[o.id].status === 'won').length;
  const people = G.D.people.filter((p) => S.people[p.id].st !== 'unknown').map((p) => {
    const st = S.people[p.id];
    const fate = { recruited: 'stood by you to the end', cultivated: 'remembers you kindly', met: 'never quite knew who you were', compromised: 'lives under watch', arrested: 'was taken, and talked', dead: 'is dead', turned: 'works for the other side now' }[st.st] ?? st.st;
    return `<p><b class="sc">${esc(p.name)}</b> ${esc(fate)}.</p>`;
  }).join('');
  const verdict = c.why !== 'home' ? '' : S.standing >= 70 ? 'Ashby puts your name forward for a decoration that will never be gazetted. You have done very well.'
    : S.standing >= 50 ? 'Ashby shakes your hand and says the Bureau will want you again. From him, it is a great deal.'
    : S.standing >= 30 ? 'Ashby thanks you, coolly. You are home, and alive, and not much else can be said for the summer.'
    : 'Ashby does not come down to meet the boat. A clerk takes your papers and your key to the Bureau door.';
  let file = '';
  try { file = pmHtml(postmortem(G)); } catch (e) { console.error(e); } // a fault in the file must never cost the player the end card
  return `<div class="kick">${esc(longDate(S.t))} · ${esc(hm(S.t))}</div><h1>${esc(why)}</h1><div class="rule"></div>${verdict ? `<p>${esc(verdict)}</p>` : ''}<p>Operations accomplished: ${won} of ${mains.length}. Standing with the Bureau: ${S.standing}.</p>${people}${file}<button type="button" class="pm-copy" data-copy-report><b>Copy run report</b><span>a plain account of this campaign, to paste to the developer</span></button>`;
}

/** The post-mortem as a collapsible page of short paragraphs and lists. Every string is escaped. */
export function pmHtml(pm) {
  const list = (items) => `<ul class="pm-list">${items.join('')}</ul>`;
  const more = (items, label, shown) => (items.length > shown
    ? `${list(items.slice(0, shown))}<details class="pm-more"><summary>${esc(label(items.length - shown))}</summary>${list(items.slice(shown))}</details>`
    : list(items));

  const seen = pm.covers.filter((x) => x.status !== 'clean');
  const never = pm.covers.filter((x) => x.status === 'clean').map((x) => (x.own ? 'your own name' : x.name));
  const stamps = (x) => [x.posted && 'POSTED', x.burned && 'BURNED', x.status === 'suspect' && 'SUSPECTED'].filter(Boolean).map((w) => `<span class="stamp">${w}</span>`).join('');
  const names = seen.map((x) => `<div class="pm-cover pm-${esc(x.status)}${x.burned ? ' pm-burned' : ''}"><div class="pm-top"><b class="pm-name">${esc(x.name)}</b>${x.own ? '<span class="dim"> · your own name</span>' : ''}<span class="pm-stamps">${stamps(x)}</span></div>`
    + `<p>${esc(x.summary)}</p>`
    + (['posted', 'burned', 'suspect'].includes(x.status) && x.because.length
      ? `<div class="pm-sub">What weighed most, heaviest first</div>${list(x.because.map((b) => `<li><span class="pm-when">${esc(when(b.t))}</span>${esc(b.label)}</li>`))}` : '')
    + '</div>').join('');

  const wrong = pm.falseTips.filter((t) => !t.stale), cold = pm.falseTips.filter((t) => t.stale);
  const LOOK = (p) => (p >= .85 ? 'all but certain' : p >= .65 ? 'likely' : p >= .45 ? 'as likely as not' : p >= .25 ? 'unlikely' : 'a long shot');
  const tip = (t) => `<li>${esc(t.text)}<div class="pm-src">${esc(when(t.learned))} · it looked ${esc(LOOK(t.rel))}${t.heard > 1 ? ` · heard ${t.heard} times` : ''}</div></li>`;
  const told = wrong.length || cold.length
    ? `<h3>Told you, and not so</h3>${wrong.length ? more(wrong.map(tip), (n) => `and ${n} more`, 4) : '<p class="dim">Nothing you were told was proved false.</p>'}`
      + (cold.length ? `<details class="pm-more"><summary>${esc(`${cold.length} more were so when you heard them, and cold when you looked`)}</summary>${list(cold.map(tip))}</details>` : '')
      + (pm.sources.length ? `<p class="dim">How your informants fared: ${esc(pm.sources.map((s) => `${s.name}, wrong ${s.wrong} of ${s.right + s.wrong}`).join('; '))}.</p>` : '') : '';

  const truths = pm.truths.length ? `<h3>True all along</h3>${more(pm.truths.map((t) => `<li>${esc(t)}</li>`), (n) => `and ${n} more`, 5)}` : '';
  const cost = pm.costliest.length || pm.nearMisses
    ? `<h3>What it cost you</h3>${pm.costliest.length ? list(pm.costliest.map((t) => `<li>${esc(t)}</li>`)) : ''}${pm.nearMisses ? `<p class="dim">Near things: ${pm.nearMisses === 1 ? 'once' : `${pm.nearMisses} times`} a hunter was close, and did not know you.</p>` : ''}` : '';

  return `<details open class="pm"><summary>Their file on you</summary><p class="pm-lead">${esc(pm.headline)}</p>`
    + (seen.length ? `<h3>The names they held</h3>${names}` : '') + (never.length ? `<p class="dim">Never traced: ${esc(never.join(', '))}.</p>` : '')
    + told + truths + cost + '</details>';
}
