/**
 * world (RULES.md 5.10; H07-2, H07-3): the calendar and the newspapers. Dated changes themselves
 * (suspensions, papers, closures, moratoria, registration) are parameter rows the other modules
 * read; this module only announces them and interrupts. The invented preview world carries no
 * history: its calendar holds timetable and bank notices only, and the political paths stay unused.
 */
import { worldEventInstant, calendarWindow } from '#kit/params/worldcal.ts';
import { dayOf, type Instant } from '#kit/time/instant.ts';
import { dv, localIn, instantIn, cmpStr } from './data.ts';
import type { C07State } from './types.ts';
import { type C, interrupt, reflow } from './diary.ts';

export const PRIO_NEWS = 15;

export function initWorld(s: C07State, ctx: C, start: Instant, end: Instant): void {
  const b = ctx.bundle;
  const offset = (zone: string, day: number): number => b.tt.zones.offset(zone, day);
  for (const ev of calendarWindow(b.raw.calendar, dayOf(start) - 2, dayOf(end))) {
    const at = worldEventInstant(ev, offset);
    if (at <= start) {
      s.world.fired.push(ev.id);
      for (const c of b.gameCities) s.world.queued.push({ id: ev.id, city: c });
    } else if (at <= end) ctx.schedule(at, 0, 'kit.World', { id: ev.id });
  }
  for (const c of b.gameCities) scheduleEdition(s, ctx, c);
}

function scheduleEdition(s: C07State, ctx: C, city: string): void {
  const times = dv<number[]>(ctx.bundle, 'DV-C07-014');
  const { day } = localIn(ctx.bundle, city, ctx.now);
  for (let d = day; d <= day + 1; d++) {
    for (const sec of [...times].sort((x, y) => x - y)) {
      const at = instantIn(ctx.bundle, city, d, sec);
      if (at > ctx.now) { if (at <= s.endsAt) ctx.schedule(at, PRIO_NEWS, 'c07.Newspaper', { city }); return; }
    }
  }
}

export function onWorld(s: C07State, p: { id: string }, ctx: C): void {
  if (!s.world.fired.includes(p.id)) s.world.fired.push(p.id);
  for (const c of ctx.bundle.gameCities) s.world.queued.push({ id: p.id, city: c });
  ctx.trace('world', p);
}

/** A newspaper edition in a city publishes what is queued for it (seen at once only by a player there). */
export function onNewspaper(s: C07State, p: { city: string }, ctx: C): void {
  const due = s.world.queued.filter((q) => q.city === p.city);
  s.world.queued = s.world.queued.filter((q) => q.city !== p.city);
  for (const q of due) s.world.news.push({ id: q.id, city: p.city, at: ctx.now });
  if (due.length && s.me.where.k === 'city' && s.me.where.city === p.city) {
    s.world.seenUntil = ctx.now;
    interrupt(s, ctx, 'news', { city: p.city, ids: due.map((q) => q.id) });
  }
  scheduleEdition(s, ctx, p.city);
}

/** At arrival, everything published here since boarding is revealed at once. */
export function revealNews(s: C07State, ctx: C): void {
  const city = s.me.where.k === 'city' ? s.me.where.city : null;
  const since = s.world.seenUntil;
  s.world.seenUntil = ctx.now;
  if (!city) return;
  const fresh = s.world.news.filter((n) => n.city === city && n.at > since).map((n) => n.id).sort(cmpStr);
  if (fresh.length) interrupt(s, ctx, 'news', { city, ids: fresh });
}

interface ParamChange { day: number; started: string[]; ended: string[] }

/** A dated row started or ended: a suspension or papers change touching the booking interrupts; closures re-flow. */
export function onParamChanged(s: C07State, p: ParamChange, ctx: C): void {
  const rows = ctx.params.rowsFor('service.suspension').map((r) => r.id);
  const papers = ctx.params.rowsFor('frontier.papers').map((r) => r.id);
  if (s.diary.booking) {
    if (p.started.some((id) => rows.includes(id))) interrupt(s, ctx, 'suspended', { rows: p.started.filter((id) => rows.includes(id)) });
    if (p.started.some((id) => papers.includes(id))) interrupt(s, ctx, 'papers', { rows: p.started.filter((id) => papers.includes(id)) });
  }
  if (s.me.where.k === 'city' && s.diary.slots.some((x) => x.state === 'planned')) reflow(s, ctx);
}
