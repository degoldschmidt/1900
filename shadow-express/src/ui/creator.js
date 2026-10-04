// The agent's file: an RPG-style creator on the title screen. Identity and looks (with a live engraved portrait),
// background, skills and languages (point-buy), virtues and vices, the starting kit, and the closing file.

import { BACKGROUNDS, TRAITS, KIT, AGES, BIRTH, FRIENDS, SKILL_TEXT, SKILL_MAX, LANG_MAX, defaultHero, points, skill, fullName } from '../core/hero.js';
import { SKILLS, LANGUAGES, HATS, HAIR, BEARDS, COLLARS } from '../core/spec.js';
import { portraitUrl } from './art.js';
import { esc, el } from './dom.js';

const FIRST = { m: ['Thomas', 'Arthur', 'Edmund', 'Hugh', 'Lionel', 'Rupert', 'Walter', 'Basil', 'Gerald', 'Ivo', 'Cecil', 'Hector'],
  f: ['Evelyn', 'Constance', 'Winifred', 'Agnes', 'Beatrice', 'Muriel', 'Violet', 'Hester', 'Sybil', 'Marjorie', 'Ottoline', 'Rosamund'] };
const LAST = ['Kemp', 'Ashdown', 'Fairbairn', 'Quested', 'Lisle', 'Merriman', 'Tolland', 'Dacre', 'Pennick', 'Harrowby', 'Gresham', 'Vane', 'Strachan', 'Coulter'];
const STEPS = [['who', 'Identity'], ['bg', 'Background'], ['skills', 'Skills'], ['char', 'Character'], ['kit', 'Kit'], ['file', 'The file']];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WORDS = { hat: { none: 'bareheaded', bowler: 'bowler', top: 'top hat', cap: 'cloth cap', boater: 'boater', fez: 'fez', veil: 'veil', kepi: 'kepi', wide: 'picture hat' }, hair: { short: 'short', long: 'long', bun: 'pinned up', bald: 'bald' }, beard: { none: 'clean-shaven', moustache: 'moustache', full: 'full beard', goatee: 'goatee' }, collar: { lace: 'lace collar', stiff: 'stiff collar', uniform: 'tunic', cassock: 'cassock', fur: 'fur collar' } };

export function creator(root, items, onDone, people = []) {
  const h = defaultHero(Math.random() < .5 ? 'm' : 'f');
  h.first = pick(FIRST[h.sex]); h.last = pick(LAST); h.portrait.seed = Math.floor(Math.random() * 9000) + 100;
  let step = 'who';
  const wrap = el('div', 'title creator');
  root.appendChild(wrap);
  const itemName = (id) => items.find((x) => x.id === id)?.name ?? id;

  let faceKey = '', faceUrl = '';
  function face() {
    const key = `hero-${JSON.stringify(h.portrait)}`;
    portraitUrl(key, h.portrait).then((u) => { if (!u) return; faceKey = key; faceUrl = u; const im = wrap.querySelector('.cr-face img'); if (im && im.src !== u) im.src = u; });
  }
  const faceSrc = () => (faceKey === `hero-${JSON.stringify(h.portrait)}` && faceUrl ? faceUrl : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
  const bg = () => BACKGROUNDS.find((b) => b.id === h.background);

  let shownStep = null, rendering = false;
  function render() {
    if (rendering) return; // removing a focused field fires blur and change mid-render
    rendering = true;
    try { draw(); } finally { rendering = false; }
  }
  function draw() {
    const pts = points(h);
    const scroll = shownStep === step ? wrap.scrollTop : 0;
    const B = bg();
    wrap.innerHTML = `<div class="card paper cr"><div class="kick">Secret Service Bureau · Personnel</div>
      <div class="cr-top"><div class="cr-face"><img alt="Your portrait" src="${faceSrc()}"><div class="cr-name sc">${esc(fullName(h) || 'Unnamed')}</div><div class="dim cr-sub">${esc(B.name)}</div></div>
      <div class="cr-main"><nav class="cr-steps">${STEPS.map(([k, l], i) => `<button data-step="${k}" aria-current="${step === k}">${i + 1}. ${l}</button>`).join('')}</nav><div class="cr-body">${body(pts)}</div></div></div>
      <div class="cr-foot"><span class="dim">${step === 'skills' || step === 'char' ? `${pts.left} point${pts.left === 1 ? '' : 's'} to spend` : ''}</span>
      <span>${step !== 'who' ? '<button class="iconbtn" data-nav="-1">Back</button>' : ''} ${step !== 'file' ? '<button class="iconbtn" data-nav="1">Next</button>' : `<button class="choice cr-go" data-go ${pts.left < 0 ? 'disabled' : ''}><b>Accept the commission</b><span>Sunday 28 June 1914, London</span></button>`}</span></div></div>`;
    wire();
    face();
    wrap.scrollTop = scroll;
    shownStep = step;
  }

  function body(pts) {
    if (step === 'who') return `<h2>Who are you?</h2>
      <div class="cr-grid">
        <label>First name<input data-f="first" value="${esc(h.first)}" maxlength="18"></label>
        <label>Surname<input data-f="last" value="${esc(h.last)}" maxlength="22"></label>
        <button class="iconbtn" data-dice="name" title="Another name">⚄ another name</button>
      </div>
      <div class="cr-row"><span class="cr-l">You are</span>${[['m', 'a gentleman'], ['f', 'a lady']].map(([k, l]) => `<button class="chipbtn" data-sex="${k}" aria-pressed="${h.sex === k}">${l}</button>`).join('')}</div>
      <div class="cr-row"><span class="cr-l">Aged</span>${AGES.map(([k, l]) => `<button class="chipbtn" data-age="${k}" aria-pressed="${h.age === k}">${l}</button>`).join('')}</div>
      <div class="cr-row"><span class="cr-l">Born in</span><select data-f="birth">${BIRTH.map(([k, l]) => `<option value="${k}" ${h.birth === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <h3>Your looks</h3>
      <div class="cr-row"><span class="cr-l">Face</span><button class="iconbtn" data-dice="face">⚄ another face</button></div>
      ${look('hat', HATS.filter((x) => h.sex === 'f' ? x !== 'kepi' && x !== 'fez' : x !== 'veil'))}
      ${look('hair', HAIR.filter((x) => h.sex === 'f' ? x !== 'bald' : true))}
      ${h.sex === 'm' ? look('beard', BEARDS) : ''}
      ${look('collar', COLLARS.filter((x) => x !== 'uniform' && (h.sex === 'f' ? x !== 'cassock' : x !== 'lace')))}
      <p class="dim">Your looks are your own; your borrowed names come with your background. People remember faces longer than names.</p>`;
    if (step === 'bg') return `<h2>What were you, before?</h2><div class="cr-cards">${BACKGROUNDS.map((b) => `<button class="cr-card" data-bg="${b.id}" aria-pressed="${h.background === b.id}"><b class="sc">${esc(b.name)}</b><span>${esc(b.blurb)}</span>
      <span class="chips" style="justify-content:flex-start">${Object.entries(b.skills).map(([k, v]) => `<span class="chip">${k} +${v}</span>`).join('')}${Object.entries(b.langs).map(([k, v]) => `<span class="chip">${k} +${v}</span>`).join('')}<span class="chip">£${b.money}</span><span class="chip">standing ${b.standing}</span>${b.item ? `<span class="chip good">${esc(itemName(b.item))}</span>` : ''}</span>
      <span class="dim">borrowed names: ${b.covers.join(' and ')}</span></button>`).join('')}</div>
      <h3>Someone you knew before</h3><div class="cr-cards two">${FRIENDS.map((f) => { const p = people.find((x) => x.id === f.id); return `<button class="cr-card small" data-friend="${f.id ?? ''}" aria-pressed="${(h.friend ?? '') === (f.id ?? '')}"><b class="sc">${esc(p ? `${p.name}, ${p.role}` : 'No one')}</b><span>${esc(f.why)}</span></button>`; }).join('')}</div>`;
    if (step === 'skills') {
      const row = (k, max) => { const base = (bg().skills[k] ?? 0) + (bg().langs?.[k] ?? 0), own = (SKILLS.includes(k) ? h.skills[k] : h.langs[k]) ?? 0, total = skill(h, k);
        return `<div class="cr-skill"><div><b class="sc">${k}</b> <span class="dim">${esc(SKILL_TEXT[k])}</span></div><div class="cr-step"><button class="iconbtn" data-dec="${k}" ${own <= 0 ? 'disabled' : ''} aria-label="less ${k}">−</button><span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < total ? 'on' : ''}${i < base ? ' gift' : ''}"></i>`).join('')}</span><button class="iconbtn" data-inc="${k}" ${pts.left <= 0 || total >= max ? 'disabled' : ''} aria-label="more ${k}">+</button></div></div>`; };
      return `<h2>What can you do?</h2><p class="dim">${POINTS_TEXT} Pips your background gives are marked; they cost nothing.</p><h3>Skills</h3>${SKILLS.map((k) => row(k, SKILL_MAX)).join('')}<h3>Languages</h3>${LANGUAGES.map((k) => row(k, LANG_MAX)).join('')}`;
    }
    if (step === 'char') {
      const v = h.traits.filter((t) => TRAITS.find((x) => x.id === t).kind === 'virtue').length, x = h.traits.filter((t) => TRAITS.find((y) => y.id === t).kind === 'vice').length;
      const card = (t) => { const on = h.traits.includes(t.id), full = t.kind === 'virtue' ? v >= 2 : x >= 2; return `<button class="cr-card small" data-trait="${t.id}" aria-pressed="${on}" ${!on && full ? 'disabled' : ''}><b class="sc">${esc(t.name)}</b><span>${esc(t.text)}</span></button>`; };
      return `<h2>What are you like?</h2><p class="dim">Up to two virtues, which cost nothing. Up to two vices, each worth a skill point.</p><h3>Virtues</h3><div class="cr-cards two">${TRAITS.filter((t) => t.kind === 'virtue').map(card).join('')}</div><h3>Vices</h3><div class="cr-cards two">${TRAITS.filter((t) => t.kind === 'vice').map(card).join('')}</div>`;
    }
    if (step === 'kit') {
      const B = bg(), spent = h.kit.reduce((a, id) => a + (KIT.find((k) => k.id === id)?.price ?? 0), 0);
      const purse = B.money + (h.traits.includes('money') ? 30 : 0) - (h.traits.includes('gambler') ? 15 : 0);
      return `<h2>What do you pack?</h2><p class="dim">Your background gives you ${esc(itemName(B.item))}. Whatever else you buy comes out of your purse: £${purse} now, £${Math.max(5, purse - spent)} after this.</p><div class="cr-cards two">${KIT.map((k) => `<button class="cr-card small" data-kit="${k.id}" aria-pressed="${h.kit.includes(k.id)}" ${!h.kit.includes(k.id) && purse - spent - k.price < 5 ? 'disabled' : ''}><b class="sc">${esc(itemName(k.id))}</b><span>£${k.price} · ${esc(items.find((x) => x.id === k.id)?.line ?? '')}</span></button>`).join('')}</div>`;
    }
    // the file
    const B = bg();
    const sk = [...SKILLS, ...LANGUAGES].filter((k) => skill(h, k) > 0).map((k) => `${k} ${'●'.repeat(skill(h, k))}`).join(' · ') || 'none to speak of';
    const tr = h.traits.map((t) => TRAITS.find((x) => x.id === t).name).join('; ') || 'nothing remarkable';
    return `<div class="cr-file type"><div class="cr-stamp">SECRET</div><p>NAME: ${esc(fullName(h).toUpperCase())}</p><p>BORN: ${esc((BIRTH.find((b) => b[0] === h.birth) ?? BIRTH[0])[1].toUpperCase())} · AGE ${esc((AGES.find((a) => a[0] === h.age) ?? AGES[1])[1].toUpperCase())}</p>
      <p>FORMERLY: ${esc(B.name.toUpperCase())}</p><p>ACCOMPLISHMENTS: ${esc(sk.toUpperCase())}</p><p>CHARACTER: ${esc(tr.toUpperCase())}</p>
      <p>BORROWED NAMES: ${esc(B.covers.join(', ').toUpperCase())}</p>${h.friend ? `<p>KNOWN TO: ${esc((people.find((x) => x.id === h.friend)?.name ?? h.friend).toUpperCase())}</p>` : ''}<p>KIT: ${esc([B.item, ...h.kit].filter(Boolean).map(itemName).join(', ').toUpperCase())}</p>
      <p>REMARKS: ${esc(remark(h))}</p></div>${pts.left < 0 ? '<p class="red">You have spent more points than you have.</p>' : pts.left > 0 ? `<p class="dim">${pts.left} skill point${pts.left === 1 ? '' : 's'} unspent.</p>` : ''}`;
  }
  const POINTS_TEXT = 'Spend your points on skills (up to three pips) and languages (up to two).';
  function remark(h) {
    const k = [...SKILLS].sort((a, b) => skill(h, b) - skill(h, a))[0];
    return { charm: 'PEOPLE CONFIDE IN THIS AGENT.', tradecraft: 'HARD TO FOLLOW. HARDER TO FIND.', observation: 'MISSES NOTHING. SAYS LITTLE.', composure: 'STEADY UNDER QUESTIONING.', paperwork: 'A GOOD HAND WITH A STAMP.', streetwise: 'KNOWS WHAT EVERYTHING COSTS.', commerce: 'A CONVINCING MAN OF BUSINESS.' }[k] ?? 'SUITABLE.';
  }
  function look(k, list) { return `<div class="cr-row"><span class="cr-l">${k === 'hair' ? 'Hair' : k === 'hat' ? 'Hat' : k === 'beard' ? 'Beard' : 'Collar'}</span>${list.map((x) => `<button class="chipbtn" data-look="${k}" data-v="${x}" aria-pressed="${h.portrait[k] === x}">${esc(WORDS[k][x] ?? x)}</button>`).join('')}</div>`; }

  function wire() {
    const q = (s) => wrap.querySelectorAll(s);
    q('[data-step]').forEach((b) => b.addEventListener('click', () => { step = b.dataset.step; render(); }));
    q('[data-nav]').forEach((b) => b.addEventListener('click', () => { const i = STEPS.findIndex(([k]) => k === step) + Number(b.dataset.nav); step = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))][0]; render(); }));
    // typing updates the file in place: a full redraw would steal the click that ends the typing
    q('[data-f]').forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => {
      h[i.dataset.f] = i.value.trim().slice(0, 22);
      const n = wrap.querySelector('.cr-name'); if (n) n.textContent = fullName(h) || 'Unnamed';
    }));
    q('[data-dice]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.dice === 'name') { h.first = pick(FIRST[h.sex]); h.last = pick(LAST); } else h.portrait.seed = Math.floor(Math.random() * 9000) + 100; render(); }));
    q('[data-sex]').forEach((b) => b.addEventListener('click', () => {
      if (h.sex === b.dataset.sex) return;
      if (!h.first || FIRST[h.sex].includes(h.first)) h.first = pick(FIRST[b.dataset.sex]); // a name the player typed stays
      h.sex = b.dataset.sex; h.portrait.sex = h.sex;
      if (h.sex === 'f') { h.portrait.beard = 'none'; if (['kepi', 'fez', 'top', 'cap'].includes(h.portrait.hat)) h.portrait.hat = 'wide'; if (h.portrait.hair === 'bald') h.portrait.hair = 'bun'; if (h.portrait.collar === 'stiff' || h.portrait.collar === 'cassock') h.portrait.collar = 'lace'; }
      else { if (['veil', 'wide'].includes(h.portrait.hat)) h.portrait.hat = 'bowler'; if (h.portrait.collar === 'lace') h.portrait.collar = 'stiff'; if (h.portrait.hair === 'bun' || h.portrait.hair === 'long') h.portrait.hair = 'short'; }
      render();
    }));
    q('[data-age]').forEach((b) => b.addEventListener('click', () => { h.age = b.dataset.age; h.portrait.age = h.age; render(); }));
    q('[data-look]').forEach((b) => b.addEventListener('click', () => { h.portrait[b.dataset.look] = b.dataset.v; render(); }));
    q('[data-bg]').forEach((b) => b.addEventListener('click', () => { h.background = b.dataset.bg; trimSkills(); render(); }));
    q('[data-friend]').forEach((b) => b.addEventListener('click', () => { h.friend = b.dataset.friend || null; render(); }));
    q('[data-inc]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.inc, t = SKILLS.includes(k) ? h.skills : h.langs; if (points(h).left > 0) t[k] = (t[k] ?? 0) + 1; render(); }));
    q('[data-dec]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.dec, t = SKILLS.includes(k) ? h.skills : h.langs; t[k] = Math.max(0, (t[k] ?? 0) - 1); render(); }));
    q('[data-trait]').forEach((b) => b.addEventListener('click', () => { const t = b.dataset.trait; h.traits = h.traits.includes(t) ? h.traits.filter((x) => x !== t) : [...h.traits, t]; if (points(h).left < 0) trimSkills(); render(); }));
    q('[data-kit]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.kit; h.kit = h.kit.includes(k) ? h.kit.filter((x) => x !== k) : [...h.kit, k]; render(); }));
    wrap.querySelector('[data-go]')?.addEventListener('click', () => { if (points(h).left < 0) return; wrap.remove(); onDone(JSON.parse(JSON.stringify(h))); });
  }
  /** Keep spending within points and caps when the background or vices change. */
  function trimSkills() {
    for (const k of [...SKILLS, ...LANGUAGES]) { const t = SKILLS.includes(k) ? h.skills : h.langs; const cap = SKILLS.includes(k) ? SKILL_MAX : LANG_MAX; while ((t[k] ?? 0) > 0 && skill(h, k) > cap) t[k]--; }
    for (const k of [...SKILLS, ...LANGUAGES].reverse()) { const t = SKILLS.includes(k) ? h.skills : h.langs; while (points(h).left < 0 && (t[k] ?? 0) > 0) t[k]--; }
  }
  render();
  return wrap;
}
