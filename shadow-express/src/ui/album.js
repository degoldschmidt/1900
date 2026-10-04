// Postcards home: a card for every city where the agent has stopped, kept in the You tab. Each shows as a still,
// stamped with the day; opened, it lives again as it was that day: the same hour, the same weather, the same news.

import { postcard, postcardStill, postcardInput, hasPostcard } from './postcard.js';
import { titleSvg } from '../art/postcard/frame.js';
import { weatherAt } from './art.js';
import { longDate, hm } from '../data/time.js';
import { iconSVG } from './icons.js';
import { esc } from './dom.js';

const MODS = new Map();
const thumbs = new Map(); // city|t → element, kept between redraws so the pictures never flicker
const order = (G) => Object.entries(G.S.album ?? {}).filter(([c]) => hasPostcard(c)).sort((a, b) => a[1] - b[1]);

/** The album's section for the You tab: placeholders the ledger fills with fill(). */
export function albumHtml(G) {
  const got = order(G), all = G.D.cities.filter((c) => hasPostcard(c.id)).length;
  if (!got.length) return '';
  return `<h3>Postcards home</h3><p class="dim">One from every city where you have stopped: ${got.length} of ${all}.</p>
    <div class="album">${got.map(([c, t]) => `<button class="pc-thumb" data-postcard="${esc(c)}" data-t="${t}" aria-label="Postcard from ${esc(G.I.city.get(c).name)}, ${esc(longDate(t))}"><span class="pc-slot"></span><span class="pm">${esc(G.I.city.get(c).name)} · ${esc(longDate(t).replace(/ 1914$/, ''))}</span></button>`).join('')}</div>`;
}

/** Put the stills into the album's placeholders (the same element each time, so nothing redraws). */
export function fill(G, root) {
  for (const b of root.querySelectorAll('.pc-thumb')) {
    const c = b.dataset.postcard, t = +b.dataset.t, key = `${c}|${t}`;
    if (!thumbs.has(key)) thumbs.set(key, postcardStill(c, postcardInput(G, c, t, weatherAt(G, c, t)), 220));
    b.querySelector('.pc-slot').replaceWith(thumbs.get(key));
    b.addEventListener('click', () => open(G, c, t));
  }
}

/** The card, alive as it was the day it was bought. */
export function open(G, city, t) {
  close();
  const name = G.I.city.get(city).name;
  const v = document.createElement('div');
  v.className = 'pc-view';
  v.setAttribute('role', 'dialog');
  v.setAttribute('aria-label', `Postcard from ${name}`);
  v.innerHTML = `<div class="pc-view-in"><button class="card-x" aria-label="Close">${iconSVG('close')}</button><div class="pc-view-card"></div><p class="pc-cap">${esc(name)} · ${esc(longDate(t))}, ${esc(hm(t))}</p></div>`;
  const h = postcard(city, postcardInput(G, city, t, weatherAt(G, city, t)), { width: Math.min(760, window.innerWidth - 32) });
  v.querySelector('.pc-view-card').append(h.el);
  const shut = () => { h.destroy(); v.remove(); document.removeEventListener('keydown', key, true); MODS.delete('view'); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); shut(); } };
  v.addEventListener('click', (e) => { if (e.target === v) shut(); });
  v.querySelector('.card-x').addEventListener('click', shut);
  document.addEventListener('keydown', key, true);
  document.body.append(v);
  MODS.set('view', shut);
  v.querySelector('.card-x').focus({ preventScroll: true });
}
export function close() { MODS.get('view')?.(); }
export { titleSvg };
