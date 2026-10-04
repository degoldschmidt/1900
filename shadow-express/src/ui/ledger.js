// The ledger: the paper panel of the city, the departure board, orders, people, the case, covers and the dossier.
// Everything the player knows, and nothing the player does not: the dossier's "They know" is built from your own
// traces and when they will arrive, never from the enemy's mind.

import { board, book, plan, walk, contactsHere, seek, setLodging, safehouseHere, switchCover, stash, retrieve, checkTail, shakeTail, market, buy, sell, opActions, doWay, canLieLow, lieLow, wireFunds, wireQuery, mendPapers, sendCourier, useItem, usable, PUNCT_WORDS } from '../core/actions.js';
import { coverName, coverLegend, coverData, aff, caseSize, CASE_SIZE, has, act as actOf, personHere } from '../core/game.js';
import { currentStep, stepCities } from '../core/ops.js';
import { when, hm, dayShort, span, T } from '../data/time.js';
import { HEAT, SUSPECT } from '../core/enemy.js';
import { vignetteUrl, portraitUrl } from './art.js';
import { esc } from './dom.js';
import { oddsWord } from './cards.js';

const TABS = [['city', 'City'], ['board', 'Departures'], ['orders', 'Orders'], ['people', 'People'], ['case', 'Case'], ['covers', 'Covers'], ['dossier', 'Dossier']];
const KIND = { express: 'Express', mail: 'Mail', night: 'Night train', slow: 'Omnibus', steamer: 'Steamer', coach: 'Post coach', path: 'On foot' };
const REC = { list: 'passenger list', berth: 'sleeping-car berth', frontier: 'frontier book', register: 'hotel register', wire: 'telegram', sighting: 'seen', bribe: 'bribe', meeting: 'meeting watched', photo: 'photograph', talk: 'a contact talked', link: 'two names linked' };
const NAT = { GB: 'British', CH: 'Swiss', FR: 'French', AH: 'Austro-Hungarian', DE: 'German', RU: 'Russian', IT: 'Italian', US: 'American' };

export function makeLedger(root, hooks) {
  const el = document.createElement('section');
  el.className = 'ledger paper';
  el.dataset.open = 'false';
  el.setAttribute('aria-label', 'Ledger');
  el.innerHTML = `<button class="grip" aria-label="Open or close the ledger"></button><div class="tabs" role="tablist"></div><div class="body"></div>`;
  root.appendChild(el);
  const tabsEl = el.querySelector('.tabs'), body = el.querySelector('.body');
  const state = { tab: 'city', sub: 'known', dest: null, open: false, person: null };
  el.querySelector('.grip').addEventListener('click', () => setOpen(!state.open));

  function setOpen(v) { state.open = v; el.dataset.open = v ? 'true' : 'false'; hooks.layout?.(); }
  function show(tab, arg) {
    state.tab = tab;
    if (tab === 'board' && arg !== undefined) state.dest = arg;
    if (tab === 'people' && arg !== undefined) state.person = arg;
    setOpen(true);
    hooks.refresh?.();
  }

  function render(G) {
    const { S } = G;
    const travelling = !!S.journey;
    tabsEl.innerHTML = TABS.map(([k, label]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${state.tab === k}">${label}${k === 'orders' && G.D.ops.some((o) => S.ops[o.id].status === 'active') ? '<span class="dot"></span>' : ''}</button>`).join('');
    tabsEl.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; setOpen(true); hooks.refresh?.(); }));
    const view = { city: cityView, board: boardView, orders: ordersView, people: peopleView, case: caseView, covers: coversView, dossier: dossierView }[state.tab];
    const scroll = body.scrollTop;
    body.innerHTML = view(G, travelling);
    body.scrollTop = scroll;
    wire(G);
  }

  // ---------- city ----------
  function cityView(G, travelling) {
    const { S, I, W } = G;
    if (travelling) {
      const j = S.journey, svc = W.service.get(j.svc);
      const next = j.crossings.find((x) => !x.done);
      return `<div class="kick">On the line</div><h2>${esc(svc.name)}</h2><p class="cityline">${esc(I.city.get(j.from).name)} to ${esc(I.city.get(j.to).name)}, ${esc(KIND[svc.kind] ?? svc.kind)}, ${j.cls === 1 ? 'first' : j.cls === 2 ? 'second' : 'third'} class.</p>
        <p>Due ${esc(when(j.sched))}${S.t > j.sched ? ', running late' : ''}.${next ? ` The frontier at <b>${esc(next.name)}</b> comes at about ${esc(hm(next.t))}.` : ''}</p>
        <p class="dim">Travelling as ${esc(coverName(G))}, ${esc(coverLegend(G))}.</p>`;
    }
    const c = I.city.get(S.city);
    setTimeout(() => vignetteUrl(S.city, (S.t % 1440) / 60).then((u) => { const im = body.querySelector('.vignette img'); if (!im || im.dataset.city !== S.city) return; if (u) im.src = u; else im.closest('.vignette').hidden = true; }), 0);
    const ops = opActions(G);
    const people = contactsHere(G);
    const lodge = S.place === 'safehouse' ? 'a safe house' : S.place === 'rough' ? 'no bed (sleeping rough)' : 'an hotel, under your cover name';
    const lie = canLieLow(G);
    let h = `<div class="vignette"><img alt="${esc(c.name)}" data-city="${esc(S.city)}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></div>
      <h2>${esc(c.name)}</h2><p class="cityline">${esc(c.line)}</p>`;
    if (ops.length) {
      h += `<h3>The work here</h3>`;
      for (const a of ops) {
        h += `<p class="dim">${esc(a.op.title)}: ${esc(a.step.label ?? stepWords(G, a.step))}${a.closed ? ' — not at this hour' : ''}</p><div class="acts">`;
        for (const v of a.ways) {
          const w = v.way;
          const chips = [w.cost?.money ? `£${w.cost.money}` : null, `risk: ${riskWord(v.risk)}`, w.rec ? REC[w.rec[0]] ?? w.rec[0] : null, v.plaus < 0 ? 'implausible for your cover' : v.plaus === 0 ? 'odd for your cover' : null].filter(Boolean);
          h += `<button class="act ${v.risk > .4 ? 'danger' : ''}" data-way="${esc(a.op.id)}|${esc(w.id)}" ${!v.open || !v.afford || a.closed ? 'disabled' : ''}><b>${esc(w.label)}</b><span class="chips">${chips.map((x) => `<span class="chip ${/implaus|risk: high/.test(x) ? 'bad' : ''}">${esc(x)}</span>`).join('')}</span></button>`;
        }
        h += `</div>`;
      }
    }
    h += `<h3>${esc(hm(S.t))} in ${esc(c.name)}</h3><div class="acts">`;
    h += `<button class="act" data-do="walk"><b>Walk the city</b><span>an hour or two; anything may happen</span></button>`;
    for (const p of people) h += `<button class="act" data-seek="${esc(p.person.id)}"><b>Seek out ${esc(p.person.name)}</b><span>${esc(G.S.people[p.person.id].st === 'unknown' ? p.person.role : G.S.people[p.person.id].st)}</span></button>`;
    h += `<button class="act" data-tab-go="board"><b>Departures</b><span>trains and boats from ${esc(c.name)}</span></button>`;
    if (market(G).buy.length || market(G).sell.length) h += `<button class="act" data-tab-go="case"><b>The market</b><span>${esc(market(G).buy.map((x) => x.item.name).join(', ') || 'buyers for what you carry')}</span></button>`;
    h += `<button class="act" data-wait="60"><b>Wait an hour</b><span>idle time is noticed</span></button>`;
    h += `<button class="act" data-wait="night"><b>Wait until morning</b><span>you sleep at ${esc(lodge)}</span></button>`;
    if (lie) h += `<button class="act" data-do="lielow"><b>Lie low until the next order</b><span>about ${esc(span(lie - S.t))}; the trail cools</span></button>`;
    h += `</div><h3>Tradecraft</h3><div class="acts">`;
    h += `<button class="act" data-lodge="hotel" ${S.place === 'hotel' || S.place === 'street' || S.place === 'station' ? 'disabled' : ''}><b>Sleep at an hotel</b><span>£1; your name goes in the register</span></button>`;
    if (safehouseHere(G)) h += `<button class="act" data-lodge="safehouse" ${S.place === 'safehouse' ? 'disabled' : ''}><b>Use the safe house</b><span>no register, rest</span></button>`;
    h += `<button class="act" data-lodge="rough" ${S.place === 'rough' ? 'disabled' : ''}><b>Sleep rough</b><span>no register; costs nerve</span></button>`;
    h += `<button class="act" data-do="tail"><b>Walk to see if you are followed</b><span>an hour and a half</span></button>`;
    if (S.knownTail && S.tailedBy) h += `<button class="act danger" data-do="shake"><b>Shake off the man behind you</b><span>two hours; nerve</span></button>`;
    h += `<button class="act" data-do="wire"><b>Wire London for funds</b><span>+£15; standing −4; a telegram is read</span></button>`;
    h += `<button class="act" data-tab-go="covers"><b>Change your papers</b><span>now ${esc(coverName(G))}</span></button></div>`;
    return h;
  }
  const riskWord = (r) => (r >= .45 ? 'high' : r >= .25 ? 'fair' : r >= .1 ? 'low' : 'slight');
  function stepWords(G, s) {
    const I = G.I, c = (x) => [x].flat().map((y) => I.city.get(y)?.name ?? y).join(' or ');
    return { goto: `reach ${c(s.city)}`, act: `the ${String(s.venue).slice(6)} in ${c(s.city)}`, meet: `meet ${I.person.get(s.person)?.name}`, wait: `wait in ${c(s.city)}`, carry: `bring ${I.item.get(s.item)?.name.toLowerCase()} to ${c(s.to)}`, observe: `watch at ${c(s.city)}` }[s.kind];
  }

  // ---------- departures ----------
  function boardView(G, travelling) {
    const { S, I, W } = G;
    if (travelling) return `<p class="dim">The board is for the next station.</p>`;
    const rows = board(G, 48);
    const dests = [...new Set(rows.map((r) => r.to))].sort((a, b) => I.city.get(a).name.localeCompare(I.city.get(b).name));
    const far = G.D.cities.filter((c) => c.id !== S.city).sort((a, b) => a.name.localeCompare(b.name));
    let h = `<div class="kick">Departures · ${esc(I.city.get(S.city).name)} · ${esc(when(S.t))}</div>
      <div class="filter"><select data-dest><option value="">All destinations</option>${dests.map((d) => `<option value="${d}" ${state.dest === d ? 'selected' : ''}>${esc(I.city.get(d).name)}</option>`).join('')}</select>
      <select data-plan><option value="">Plan a route to…</option>${far.map((c) => `<option value="${c.id}" ${state.planTo === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>`;
    if (state.planTo) {
      const its = plan(G, state.planTo);
      h += `<h3>To ${esc(I.city.get(state.planTo).name)}</h3>`;
      if (!its.length) h += `<p class="dim">No way there in the coming days, as far as you know.</p>`;
      for (const it of its) h += `<div class="itin"><span class="k">${esc(it.kinds.join(' · '))}</span> — arrives ${esc(when(it.arr))} · about £${Math.round(it.fare)} · ${it.risk < 4 ? 'few controls' : it.risk < 10 ? 'some controls' : 'hard frontiers'}<div class="legs">${it.legs.map((l) => `${esc(hm(l.dep))} ${esc(W.service.get(l.svc).name)} to ${esc(I.city.get(l.to).name)}`).join(' → ')}</div></div>`;
    }
    const list = rows.filter((r) => !state.dest || r.to === state.dest);
    if (!list.length) h += `<p class="dim">Nothing leaves for there in the next two days.</p>`;
    for (const r of list) {
      const xs = r.crossings.map((x) => {
        const o = x.odds, lvl = o.alien ? 'enemy alien' : o.alert ? 'your name posted' : o.papers + o.search > 1 ? 'strict' : o.papers + o.search > .45 ? 'watchful' : 'easy';
        return `<span class="chip ${o.alien || o.alert ? 'bad' : lvl === 'strict' ? 'warn' : ''}">${esc(x.name)}: ${lvl}</span>`;
      }).join('');
      const recs = r.svc.records.map((k) => `<span class="chip">${esc(REC[k])}</span>`).join('');
      const lag = r.records.length ? `<span class="chip">reaches them in ~${Math.round(r.lagH)}h</span>` : '';
      h += `<div class="dep ${r.cancelled ? 'cancelled' : ''} ${r.next ? 'next' : ''}"><div class="row1"><span><span class="t">${esc(hm(r.dep))}</span> <span class="to">${esc(I.city.get(r.to).name)}</span></span><span class="t">${esc(dayShort(r.arr) === dayShort(r.dep) ? '' : dayShort(r.arr) + ' ')}${esc(hm(r.arr))}</span></div>
        <div class="svc">${esc(r.svc.name)} · ${esc(KIND[r.svc.kind] ?? r.svc.kind)}${r.sleeper ? ' · sleeping cars' : ''} · ${esc(span(r.arr - r.dep))} · ${esc(r.punct)}${r.forecast > 30 ? ` · <b>the guide expects ${esc(span(r.forecast))} late</b>` : ''}${r.cancelled ? ' · DOES NOT RUN' : ''}</div>
        <div class="row2"><span class="chips" style="justify-content:flex-start">${xs}${recs}${lag}${r.rumour ? '<span class="chip warn">rumours of trouble</span>' : ''}</span>
        <span class="fares">${r.classes.map((k) => { const p = r.plaus[k] ?? 1; return `<button class="fare ${p < 0 ? 'implausible' : p === 0 ? 'odd' : ''}" data-book="${esc(r.dp.key)}" data-cls="${k}" ${r.cancelled || S.money < r.fares[k] ? 'disabled' : ''} title="${p < 0 ? 'Implausible for your cover' : p === 0 ? 'Odd for your cover' : 'Fits your cover'}">${['', '1st', '2nd', '3rd'][k]}<small>£${r.fares[k]}</small></button>`; }).join('')}</span></div></div>`;
    }
    return h;
  }

  // ---------- orders ----------
  function ordersView(G) {
    const { S, I } = G;
    const ops = G.D.ops.filter((o) => S.ops[o.id].status !== 'pending');
    if (!ops.length) return `<p class="dim">No orders yet.</p>`;
    let h = '';
    for (const o of ops.sort((a, b) => (S.ops[a.id].status === 'active' ? -1 : 1) - (S.ops[b.id].status === 'active' ? -1 : 1))) {
      const st = S.ops[o.id];
      const cur = currentStep(G, o.id);
      h += `<div class="order"><div class="head"><b>${esc(o.title)}</b>${st.status === 'active' ? '<span class="chip ink">active</span>' : `<span class="stamp ${st.status === 'won' ? 'ok' : ''}">${st.status === 'won' ? 'DONE' : 'FAILED'}</span>`}</div><div class="brief">${esc(o.brief)}</div><ul class="steps">`;
      for (const s of o.steps) {
        const win = [s.after ? `from ${when(T(s.after))}` : '', s.by ? `by ${when(T(s.by))}` : ''].filter(Boolean).join(', ');
        h += `<li class="${st.done[s.id] ? 'done' : cur === s && st.status === 'active' ? 'now' : ''}">${esc(s.label ?? stepWords(G, s))}${win ? ` <span class="dim">(${esc(win)})</span>` : ''}</li>`;
      }
      h += `</ul></div>`;
    }
    return h;
  }

  // ---------- people ----------
  function peopleView(G) {
    const { S, I } = G;
    const known = G.D.people.filter((p) => S.people[p.id].st !== 'unknown');
    if (!known.length) return `<p class="dim">You know nobody yet. People are met in their cities and on their lines.</p>`;
    let h = '';
    for (const p of known) {
      const st = S.people[p.id];
      const trust = Array.from({ length: 5 }, (_, i) => `<i class="${st.trust > i ? 'on' : ''}"></i>`).join('') + (st.trust < 0 ? Array.from({ length: -st.trust }, () => '<i class="neg"></i>').join('') : '');
      const where = p.city ? I.city.get(p.city).name : 'travels';
      const here = personHere(G, p.id) && !!S.city;
      setTimeout(() => portraitUrl(p.id, p.portrait).then((u) => { const im = body.querySelector(`[data-pid="${p.id}"]`); if (u && im) im.src = u; }), 0);
      h += `<div class="person" data-person="${esc(p.id)}"><img alt="" data-pid="${esc(p.id)}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div><div class="nm">${esc(p.name)}</div><div class="rl">${esc(p.role)} · ${esc(where)}</div>
        <div style="margin-top:3px"><span class="chip ${['compromised', 'arrested', 'dead'].includes(st.st) ? 'bad' : st.st === 'recruited' ? 'good' : ''}">${esc(st.st)}</span> <span class="trust">${trust}</span></div>
        ${st.covers?.length ? `<div class="dim" style="font-size:12.5px;margin-top:3px">knows you as ${esc(st.covers.map((c) => coverName(G, c)).join(', '))}</div>` : ''}
        ${st.st === 'recruited' && p.perks.length ? `<div class="dim" style="font-size:12.5px">offers: ${esc(p.perks.join(', '))}</div>` : ''}
        ${here ? `<button class="act" style="margin-top:5px" data-seek="${esc(p.id)}"><b>Seek out</b><span>here now</span></button>` : ''}
        ${here && st.st === 'recruited' && p.perks.includes('papers') ? `<button class="act" data-mend="${esc(p.id)}" ${S.money < 5 ? 'disabled' : ''}><b>Have your papers mended</b><span>£5, three hours</span></button>` : ''}
        ${here && st.st === 'recruited' && p.perks.includes('courier') ? S.case.filter((x) => I.item.get(x.id)?.fn === 'doc').map((x) => `<button class="act" data-courier="${esc(p.id)}" data-item="${esc(x.id)}"><b>Send ${esc(I.item.get(x.id).name.toLowerCase())} to London</b><span>two days; if all goes well</span></button>`).join('') : ''}
        ${S.city && !(S.queries ?? []).some((q) => q.person === p.id && !q.done) ? `<button class="act" data-query="${esc(p.id)}" ${S.money < 2 ? 'disabled' : ''}><b>Ask London about ${esc(p.name.split(' ').at(-1))}</b><span>£2; an answer in a day or two</span></button>` : ''}</div></div>`;
    }
    return h;
  }

  // ---------- case and market ----------
  function caseView(G) {
    const { S, I } = G;
    let h = `<div class="kick">Your case · ${caseSize(G)} of ${CASE_SIZE} · £${Math.round(S.money)}</div>`;
    if (!S.case.length) h += `<p class="dim">Empty but for a clean collar.</p>`;
    for (const x of S.case) {
      const it = I.item.get(x.id);
      if (!it) continue;
      const tags = it.tags.map((t) => t === 'contraband' ? '<span class="chip bad">contraband</span>' : t === 'weapon' ? '<span class="chip bad">weapon</span>' : t.startsWith('perishable') ? '<span class="chip warn">spoils</span>' : t.startsWith('use:') ? `<span class="chip good">${esc(t.slice(4))}</span>` : t.startsWith('cover:') ? `<span class="chip">suits ${esc(coverName(G, t.slice(6)))}</span>` : '').join('');
      h += `<div class="entry"><b class="sc">${esc(it.name)}</b> <span class="chips">${tags}</span><div class="dim">${esc(it.line)}</div>${usable(G, it.id) ? `<button class="iconbtn" style="margin-top:4px" data-use="${esc(it.id)}">${it.tags.includes('use:credit') ? 'Draw £20 at the bank' : 'Use it'}</button>` : ''}</div>`;
    }
    if (S.city) {
      const m = market(G);
      if (m.buy.length || m.sell.length) h += `<h3>The market in ${esc(I.city.get(S.city).name)}</h3><div class="acts">`;
      for (const o of m.buy) h += `<button class="act" data-buy="${esc(o.item.id)}" ${S.money < o.price || caseSize(G) + o.item.size > CASE_SIZE ? 'disabled' : ''}><b>Buy ${esc(o.item.name)}</b><span>£${o.price}</span></button>`;
      for (const o of m.sell) h += `<button class="act" data-sell="${esc(o.item.id)}"><b>Sell ${esc(o.item.name)}</b><span>£${o.price}</span></button>`;
      if (m.buy.length || m.sell.length) h += `</div>`;
    }
    return h;
  }

  // ---------- covers ----------
  /** The player's own estimate of what the enemy may know of a cover: from traces left, with a margin. */
  function heatRange(G, id) {
    const { S } = G;
    let lo = 0, hi = 0;
    for (const r of S.records) {
      if (r.cover !== id) continue;
      const h = (r.heat ?? HEAT[r.kind] ?? 0) * r.fid;
      if (r.arrives <= S.t) lo += h * .7; else lo += h * .3;
      hi += h * 1.3 + .02 * r.fid;
    }
    if (S.covers[id]?.burned) { lo = 1; hi = 1; }
    return [Math.min(1, lo), Math.min(1, hi)];
  }
  function coversView(G) {
    const { S, I } = G;
    let h = `<p class="dim">Who you claim to be decides where you can go, whom you can approach and what you may ask. Papers you carry can be found in a search; leave the others somewhere safe.</p>`;
    for (const [id, c] of Object.entries(S.covers)) {
      const d = coverData(G, id), [lo, hi] = heatRange(G, id);
      const fits = Object.entries(d.aff).filter(([, v]) => v === 1).map(([t]) => t.split(':')[1]).join(', ');
      const bad = Object.entries(d.aff).filter(([, v]) => v === -1).map(([t]) => t.split(':')[1]).join(', ');
      h += `<div class="cover ${id === S.cover ? 'active' : ''} ${c.burned ? 'burned' : ''}"><div class="nm">${esc(coverName(G, id))}</div><div class="lg">${esc(coverLegend(G, id))} · ${esc(NAT[d.nation] ?? d.nation)} · travels ${['', 'first', 'second', 'third'][d.cls]} class</div>
        <div class="row"><span>papers <span class="gauge"><i style="width:${Math.round(c.papers * 100)}%"></i></span></span><span>what they may know <span class="heat"><i style="left:${Math.round(lo * 100)}%;width:${Math.max(4, Math.round((hi - lo) * 100))}%"></i></span></span></div>
        <div class="affs">${fits ? `fits: ${esc(fits)}` : ''}${bad ? `<br>implausible: ${esc(bad)}` : ''}</div>
        <div class="row">${c.burned ? '<span class="stamp">BURNED</span>' : id === S.cover ? '<span class="chip ink">in use</span>' : c.carried ? `<button class="iconbtn" data-switch="${id}" ${S.city ? '' : 'disabled'}>Become ${esc(coverName(G, id).split(' ').at(-1))}</button><button class="iconbtn" data-stash="${id}" ${S.city ? '' : 'disabled'}>Leave here</button>` : `<span class="dim">left in ${esc(I.city.get(c.stash)?.name ?? '?')}</span>${c.stash === S.city ? `<button class="iconbtn" data-retrieve="${id}">Take back</button>` : ''}`}</div></div>`;
    }
    return h;
  }

  // ---------- dossier ----------
  function dossierView(G) {
    const { S, I } = G;
    const sub = state.sub;
    let h = `<div class="subtabs">${[['known', 'Known'], ['suspected', 'Suspected'], ['they', 'They know']].map(([k, l]) => `<button data-sub="${k}" aria-selected="${sub === k}">${l}</button>`).join('')}</div>`;
    const name = (subj) => { const [k, v] = subj.split(/:(.*)/s); return k === 'hunter' ? I.hunter.get(v)?.name : k === 'person' ? I.person.get(v)?.name : k === 'cover' ? (v === 'active' ? 'you' : coverName(G, v)) : k === 'line' ? `the ${v} line` : k === 'op' ? I.op.get(v)?.title : k === 'city' ? I.city.get(v)?.name : v; };
    const claim = (e) => { const [k, v] = Object.entries(e.claim)[0]; return k === 'at' ? `is in ${I.city.get(v)?.name}` : k === 'heading' ? `is bound for ${I.city.get(v)?.name}` : k === 'loyal' ? `is loyal to ${v === 'enemy' ? 'the other side' : v}` : k === 'closed' ? `is closed${v[0] ? ` from ${v[0]}` : ''}${v[1] ? ` until ${v[1]}` : ''}` : k === 'knows' ? `${v === 'name' ? 'is known by name' : v === 'photo' ? 'has been photographed' : 'is described'}` : v; };
    const srcName = (s) => s.startsWith('person:') ? I.person.get(s.slice(7))?.name : { seen: 'your own eyes', porter: 'a porter', paper: 'the newspapers', bureau: 'the Bureau', rumour: 'rumour', police: 'police gossip', guide: 'the guide' }[s] ?? s;
    const track = (s) => { const t = S.sources[s]; return t ? ` · right ${t.right}, wrong ${t.wrong}` : ''; };
    if (sub === 'known') {
      const list = S.intel.filter((e) => e.resolved === true || (e.src === 'seen' && e.resolved !== false)).slice().reverse();
      if (!list.length) h += `<p class="dim">Nothing you have seen with your own eyes, or proved.</p>`;
      for (const e of list) h += `<div class="entry"><b>${esc(name(e.subj))}</b> ${esc(claim(e))}<div class="src">${esc(when(e.learned))} · ${esc(srcName(e.src))}${e.resolved === true ? ' · <span class="stamp ok">TRUE</span>' : ''}</div></div>`;
    }
    if (sub === 'suspected') {
      const list = S.intel.filter((e) => e.resolved === null && e.src !== 'seen').slice().reverse();
      if (!list.length) h += `<p class="dim">No rumours worth the name.</p>`;
      for (const e of list) h += `<div class="entry"><b>${esc(name(e.subj))}</b> ${esc(claim(e))}<div class="src">${esc(when(e.learned))} · ${esc(srcName(e.src))}${esc(track(e.src))} · looks <span class="rel"><i style="width:${Math.round(e.rel * 100)}%"></i></span> ${esc(oddsWord(e.rel))}</div></div>`;
      const wrong = S.intel.filter((e) => e.resolved === false).slice(-5).reverse();
      if (wrong.length) h += `<h3>Proved false</h3>${wrong.map((e) => `<div class="entry dim"><s>${esc(name(e.subj))} ${esc(claim(e))}</s><div class="src">${esc(srcName(e.src))}</div></div>`).join('')}`;
    }
    if (sub === 'they') {
      h += `<p class="dim">Your traces, as you reckon them: every register, list and frontier book, and when it will reach the other side. A guess, not a certainty.</p>`;
      const recs = S.records.filter((r) => r.kind !== 'plan' && !r.planted).slice(-40).reverse();
      if (!recs.length) h += `<p class="dim">You have left no trace yet.</p>`;
      for (const r of recs) {
        const arrived = r.arrives <= S.t;
        h += `<div class="entry"><b>${esc(REC[r.kind] ?? r.kind)}</b> in ${esc(I.city.get(r.city)?.name ?? r.city)}${r.cover ? ` as ${esc(coverName(G, r.cover))}` : ''}${r.person ? ` with ${esc(I.person.get(r.person)?.name)}` : ''}<div class="src">${esc(when(r.t))} · ${arrived ? 'probably in their hands' : `reaches them about ${esc(when(r.arrives))}`} · ${r.fid > .7 ? 'clear' : r.fid > .35 ? 'fair' : 'vague'}</div></div>`;
      }
    }
    return h;
  }

  // ---------- events ----------
  function wire(G) {
    const q = (s) => body.querySelectorAll(s);
    const after = () => hooks.acted?.();
    q('[data-do]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.do;
      if (k === 'walk') walk(G);
      if (k === 'lielow') lieLow(G);
      if (k === 'tail') checkTail(G);
      if (k === 'shake') shakeTail(G);
      if (k === 'wire') wireFunds(G);
      after();
    }));
    q('[data-seek]').forEach((b) => b.addEventListener('click', () => { seek(G, b.dataset.seek); after(); }));
    q('[data-wait]').forEach((b) => b.addEventListener('click', () => {
      const S = G.S;
      const m = b.dataset.wait === 'night' ? (((7 * 60 - (S.t % 1440)) + 1440) % 1440 || 1440) : Number(b.dataset.wait);
      S.busyUntil = Math.max(S.busyUntil, S.t) + m;
      after();
    }));
    q('[data-lodge]').forEach((b) => b.addEventListener('click', () => { setLodging(G, b.dataset.lodge); after(); }));
    q('[data-way]').forEach((b) => b.addEventListener('click', () => { const [op, w] = b.dataset.way.split('|'); doWay(G, op, w); after(); }));
    q('[data-tab-go]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tabGo; hooks.refresh?.(); }));
    q('[data-book]').forEach((b) => b.addEventListener('click', () => {
      const r = book(G, b.dataset.book, Number(b.dataset.cls));
      if (!r.ok) hooks.toast?.(r.why, true); else { hooks.toast?.('Ticket bought. To the station.'); hooks.booked?.(); }
      after();
    }));
    body.querySelector('[data-dest]')?.addEventListener('change', (e) => { state.dest = e.target.value || null; hooks.refresh?.(); });
    body.querySelector('[data-plan]')?.addEventListener('change', (e) => { state.planTo = e.target.value || null; hooks.highlight?.(state.planTo); hooks.refresh?.(); });
    q('[data-switch]').forEach((b) => b.addEventListener('click', () => { const r = switchCover(G, b.dataset.switch); if (!r.ok) hooks.toast?.(r.why, true); after(); }));
    q('[data-stash]').forEach((b) => b.addEventListener('click', () => { stash(G, b.dataset.stash); after(); }));
    q('[data-retrieve]').forEach((b) => b.addEventListener('click', () => { retrieve(G, b.dataset.retrieve); after(); }));
    q('[data-buy]').forEach((b) => b.addEventListener('click', () => { buy(G, b.dataset.buy); after(); }));
    q('[data-sell]').forEach((b) => b.addEventListener('click', () => { sell(G, b.dataset.sell); after(); }));
    q('[data-use]').forEach((b) => b.addEventListener('click', () => { if (!useItem(G, b.dataset.use)) hooks.toast?.('Not here, not now.', true); after(); }));
    q('[data-mend]').forEach((b) => b.addEventListener('click', () => { mendPapers(G, b.dataset.mend); after(); }));
    q('[data-courier]').forEach((b) => b.addEventListener('click', () => { sendCourier(G, b.dataset.courier, b.dataset.item); after(); }));
    q('[data-query]').forEach((b) => b.addEventListener('click', () => { wireQuery(G, b.dataset.query); after(); }));
    q('[data-sub]').forEach((b) => b.addEventListener('click', () => { state.sub = b.dataset.sub; hooks.refresh?.(); }));
  }

  return { el, render, show, setOpen, isOpen: () => state.open, state };
}
