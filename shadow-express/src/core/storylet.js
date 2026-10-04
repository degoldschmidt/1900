// The storylet interpreter: conditions, rolls, effects and text templates.
// It knows nothing about the game state; the engine passes a context `ctx` that answers the questions
// below and carries `ctx.effects[name](...args)` for every effect in core/spec.js.

import { clock } from '../data/time.js';

function cmp(a, op, b) {
  switch (op) {
    case '>': return a > b; case '>=': return a >= b; case '<': return a < b;
    case '<=': return a <= b; case '==': return a === b; case '!=': return a !== b;
    default: throw new Error(`unknown comparison ${op}`);
  }
}

/** Does one condition hold? */
export function test(c, ctx) {
  const [name, ...a] = c;
  switch (name) {
    case 'city': return ctx.city() === a[0];
    case 'nation': return ctx.nation() === a[0];
    case 'act': return a.length === 1 ? ctx.act() === a[0] : cmp(ctx.act(), a[0], a[1]);
    case 'st': return ctx.status(a[0]) === a[1];
    case 'trust': return cmp(ctx.trust(a[0]), a[1], a[2]);
    case 'loyal': return ctx.loyalty(a[0]) === a[1];
    case 'item': return ctx.hasItem(a[0]);
    case 'cover': return ctx.cover() === a[0];
    case 'aff': return cmp(ctx.aff(a[0]), a[1], a[2]);
    case 'sex': return ctx.sex() === a[0];
    case 'flag': return ctx.flag(a[0]);
    case 'not': return !test(a[0], ctx);
    case 'any': return a.some((x) => test(x, ctx));
    case 'op': return a.length === 1 ? ctx.opActive(a[0]) : ctx.opDone(a[0], a[1]);
    case 'tailed': return ctx.tailed();
    case 'clock': {
      const m = ctx.localMinute(), s = clock(a[0]), e = clock(a[1]);
      return s <= e ? m >= s && m < e : m >= s || m < e;
    }
    case 'day': return a[0].includes(String(ctx.dow()));
    case 'chance': return ctx.rand() < a[0];
    case 'money': return cmp(ctx.money(), a[0], a[1]);
    case 'nerve': return cmp(ctx.nerve(), a[0], a[1]);
    case 'standing': return cmp(ctx.standing(), a[0], a[1]);
    case 'mode': return ctx.journey()?.mode === a[0];
    case 'kind': return ctx.journey()?.kind === a[0];
    case 'class': return ctx.journey()?.cls === a[0];
    case 'state': return ctx.worldState(a[0]) === a[1];
    case 'war': return ctx.atWar(a[0], a[1]);
    case 'hunter': return ctx.hunterHere(a[0]);
    case 'skill': return cmp(ctx.skill(a[0]), a[1], a[2]);
    case 'stay': return cmp(ctx.stay(), a[0], a[1]);
    case 'legend': return cmp(ctx.legend(), a[0], a[1]);
    case 'watched': return ctx.watched();
    default: throw new Error(`unknown condition ${name}`);
  }
}
export const all = (conds, ctx) => (conds || []).every((c) => test(c, ctx));

/** The chance of a roll: p plus the deltas of the mods whose condition holds, kept within 5–95%. */
export function chanceOf(roll, ctx) {
  let p = roll.p;
  for (const [c, d] of roll.mods || []) if (test(c, ctx)) p += d;
  return Math.max(0.05, Math.min(0.95, p));
}

/** Applies effects in order. */
export function apply(effects, ctx) {
  for (const [name, ...a] of effects || []) {
    const fn = ctx.effects[name];
    if (!fn) throw new Error(`unknown effect ${name}`);
    fn(...a);
  }
}

/** Fills {sir|madam}, {name}, {legend}, {city}, {person:id}. */
export function render(text, ctx) {
  return String(text).replace(/\{([^{}]+)\}/g, (m, k) => {
    if (k.includes('|')) { const [man, woman] = k.split('|'); return ctx.sex() === 'f' ? woman : man; }
    if (k === 'name') return ctx.coverName();
    if (k === 'legend') return ctx.coverLegend();
    if (k === 'city') return ctx.cityName();
    if (k.startsWith('person:')) return ctx.personName(k.slice(7));
    return m;
  });
}

/** Storylets that may be offered at `at` now. */
export function eligible(stories, at, ctx) {
  return stories.filter((s) => s.at === at && !(s.once && ctx.seen(s.id)) && all(s.if, ctx));
}
/** Weighted pick. */
export function pick(list, rand) {
  const total = list.reduce((a, s) => a + (s.w ?? 1), 0);
  let r = rand() * total;
  for (const s of list) { r -= s.w ?? 1; if (r <= 0) return s; }
  return list[list.length - 1] ?? null;
}
