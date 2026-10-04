// The run report: a compact plain-text account of one campaign, for the player to paste to the developer.
// Pure and deterministic (no clock, no randomness, no DOM); it holds nothing about the person playing, only the
// agent they made, the choices the engine kept and what the other side knew. Under 8 KB however long the campaign.
//
//   reportText(G) → string

import { when } from '../data/time.js';
import { coverName, NERVE_MAX } from './game.js';
import { fullName, skill } from './hero.js';
import { SKILLS, LANGUAGES } from './spec.js';
import { postmortem } from './postmortem.js';

export const REPORT_VERSION = 'v2';
const LIMIT = 7600;     // bytes the report may take; the promise is 8 KB
const HEAD_MAX = 4400;  // of which the summary may use this much, so that the log keeps at least a screenful
const LOG_LINES = 120;  // the most that is kept of the log

const bytes = (s) => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : s.length);
const clean = (s, n = 140) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '?');
const count = (rows, key) => { const m = {}; for (const r of rows) m[r[key]] = (m[r[key]] ?? 0) + 1; return m; };
const pairs = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ');

export function reportText(G) {
  const { S, D } = G;
  const pm = postmortem(G);
  const h = S.hero ?? null;
  const E = S.enemy ?? {};

  // ---- what must be there
  const core = [];
  core.push(`SHADOW EXPRESS RUN REPORT ${REPORT_VERSION}`);
  core.push(`seed ${S.seed} · state v${S.v}`);
  core.push(S.ended ? `ending ${S.ended.why} · ${when(S.ended.t)} (minute ${S.ended.t}) · ${pm.place}` : `ending none: the campaign was running at ${when(S.t)} (minute ${S.t}) · ${pm.place}`);
  core.push(`headline ${clean(pm.headline, 400)}`);
  if (h) {
    core.push(`hero ${clean(fullName(h), 40)} · ${h.sex} · age ${h.age} · born ${h.birth} · background ${h.background}`);
    core.push(`skills ${SKILLS.filter((k) => skill(h, k) > 0).map((k) => `${k} ${skill(h, k)}`).join(', ') || 'none'} · languages ${LANGUAGES.filter((k) => skill(h, k) > 0).map((k) => `${k} ${skill(h, k)}`).join(', ') || 'none'}`);
    core.push(`traits ${(h.traits ?? []).join(', ') || 'none'} · kit ${(h.kit ?? []).join(', ') || 'none'} · friend ${h.friend ?? 'none'}`);
  } else core.push('hero: not recorded');
  core.push(`final £${Math.round(num(S.money))} · nerve ${S.nerve}/${NERVE_MAX} · standing ${S.standing}/100 · cover ${S.cover} (${clean(coverName(G), 40)})`);

  const ops = D.ops.map((o) => [o, S.ops?.[o.id]]).filter(([, st]) => st);
  core.push('orders');
  for (const [o, st] of ops.filter(([, st]) => st.status !== 'pending')) {
    const ways = Object.entries(st.wayUsed ?? {}).map(([k, v]) => `${k}:${v}`).join(' ');
    core.push(`  ${o.id}${o.side ? ' (favour)' : ''} ${st.status}${st.ended ? ` ${when(st.ended)}` : ''}${ways ? ` [${ways}]` : ''}`);
  }
  const pending = ops.filter(([, st]) => st.status === 'pending').map(([o]) => o.id);
  if (pending.length) core.push(`  not reached: ${pending.join(' ')}`);

  core.push('covers');
  for (const c of pm.covers) {
    core.push(`  ${c.cover}: ${c.status}${c.postedAt !== null ? ` ${when(c.postedAt)} via ${c.postedBy ?? '?'}` : ''}${c.burned && c.status !== 'burned' ? ', burned' : ''}, susp ${f2(c.susp)}, papers ${c.papers === null ? '-' : f2(c.papers)}`);
  }
  const b = E.belief;
  core.push(`enemy description ${Math.round(num(E.desc) * 100)}% · photograph ${E.photo ? 'yes' : 'no'} · scepticism ${f2(num(E.scepticism))}${b ? ` · believed ${b.city} as ${b.cover} at ${when(b.t)}${b.planted ? ' (planted)' : ''}` : ''}`);
  core.push(`hunters ${pm.hunters.map((x) => `${x.id} ${x.where}${x.role ? ` (${x.role})` : ''}${x.nearest ? ' NEAREST' : ''}`).join('; ')}`);
  core.push(`stats ${pairs(S.stats ?? {})}`);
  core.push(`records ${(S.records ?? []).length}${(S.records ?? []).length ? ` (${pairs(count(S.records, 'kind'))})` : ''} · intel ${(S.intel ?? []).length}, false ${pm.falseTips.length}`);

  // ---- what the post-mortem found, which may be cut if the report grows
  const extra = [];
  const because = pm.covers.filter((c) => c.because.length && ['posted', 'burned', 'suspect'].includes(c.status)).map((c) => `  ${c.cover}: ${c.because.slice(0, 3).map((x) => `${clean(x.label, 70)} ${when(x.t)} w${x.weight}`).join('; ')}`);
  if (because.length) extra.push({ pri: 1, lines: ['because'].concat(because) });
  if (pm.costliest.length) extra.push({ pri: 2, lines: ['costliest'].concat(pm.costliest.map((x) => `  ${clean(x, 220)}`)) });
  if (pm.truths.length) extra.push({ pri: 3, lines: ['truths'].concat(pm.truths.slice(0, 3).map((x) => `  ${clean(x, 220)}`)) });
  if (pm.sources.length) extra.push({ pri: 4, lines: [`sources ${pm.sources.map((x) => `${x.src} ${x.right}/${x.right + x.wrong}`).join(', ')}`] });

  const build = () => [...core, ...extra.flatMap((x) => x.lines)].join('\n');
  let head = build();
  while (bytes(head) > HEAD_MAX && extra.length) { extra.sort((a, b2) => b2.pri - a.pri); extra.shift(); head = build(); } // drop the least needed first
  if (bytes(head) > LIMIT - 300) head = head.split('\n').reduce((acc, line) => (bytes(`${acc}\n${line}`) <= LIMIT - 300 ? `${acc}\n${line}` : acc));

  // ---- the log, newest lines first until the room is spent, then in order
  const log = (S.log ?? []).slice(-LOG_LINES).map((l) => `${when(l.t)}  ${clean(l.text)}`);
  let room = LIMIT - bytes(head) - 40;
  const kept = [];
  for (let i = log.length - 1; i >= 0; i--) { const n = bytes(log[i]) + 1; if (n > room) break; room -= n; kept.unshift(log[i]); }
  return (kept.length ? `${head}\nlog (last ${kept.length} of ${(S.log ?? []).length})\n${kept.join('\n')}` : `${head}\nlog empty`).trimEnd();
}

function num(x) { return Number.isFinite(x) ? x : 0; }
