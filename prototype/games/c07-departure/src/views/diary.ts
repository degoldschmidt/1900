/**
 * DiaryPage (RULES.md 9): the pinned booking, leave time and slack countdown, the slots with their
 * hours and cost; `upcomingView` lists what will pass before the next interrupt, so Advance can
 * say it first.
 */
import { dv, cityOfStation, localIn } from '../rules/data.ts';
import { computeFlow, leaveAt } from '../rules/diary.ts';
import { costOf, traceScore } from '../rules/costs.ts';
import { hoursOf, type VerbName } from '../rules/verbs.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, stationClock, money, stationName, cityName, verbLabel, interruptLabel, recordLabel, hoursText, type Clock } from './format.ts';
import { legView, type LegView } from './planner.ts';

export interface SlotView {
  id: number; verb: string; label: string; venue: string; state: string; start: Clock; end: Clock; travelSec: number;
  /** The venue's hours on the slot's local day ("always" when it has none). */
  hours: string;
  cost: string[]; health: number; records: string[]; traceScore: number; ok: boolean; reason: string | null; args: Record<string, unknown>;
}

export interface DiaryViewModel {
  now: Clock;
  place: { kind: 'city'; city: string; cityName: string; venue: string; station: string | null; stationName: string | null } | { kind: 'aboard'; trainNo: string; trainKey: string; from: string; to: string; toName: string; schedArr: Clock; shownDelaySec: number; sleeper: boolean; cls: number };
  health: number;
  busyUntil: Clock | null;
  lodged: { city: string; cityName: string; tier: string; since: Clock } | null;
  booking: null | { id: number; legs: LegView[]; cls: number; sleeper: boolean; missOdds: number; minSlackSec: number; next: number; leaveAt: Clock | null; countdownSec: number | null; slackSec: number | null };
  slots: SlotView[];
  interrupts: Array<{ index: number; at: Clock; kind: string; label: string; ref: unknown }>;
  ended: boolean;
}

export function diaryView(p: PublicState, d: ViewData): DiaryViewModel {
  const b = d.b; const s = asRules(p);
  const e = { b, params: d.params, now: d.now };
  const city = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(b, p.me.where.ride.to);
  const flow = computeFlow(s, e);
  const leave = leaveAt(s, b);
  const slotViews: SlotView[] = p.diary.slots.map((x) => {
    const f = flow.slots.find((y) => y.id === x.id);
    const cost = costOf({ type: 'planVerb', verb: x.verb as VerbName, args: x.args }, s, e);
    const day = localIn(b, city, f?.start ?? x.start).day;
    const spans = p.me.where.k === 'city' && x.verb !== 'meet' ? hoursOf(x.verb as VerbName, x.args, s, e, city, day) : null;
    const st = x.verb === 'meet' ? p.commissions.offers.find((o) => o.id === x.args.offer)?.stages[Number(x.args.stage)] : undefined;
    return {
      id: x.id, verb: x.verb, label: verbLabel(x.verb), venue: f?.venue ?? x.venue, state: x.state,
      hours: st ? `meeting ${clock(b, st.city, st.open).time}–${clock(b, st.city, st.close).time}` : hoursText(spans, ((day % 7) + 7) % 7),
      start: clock(b, city, f?.start ?? x.start), end: clock(b, city, f?.end ?? x.end), travelSec: f?.travel ?? x.travel,
      cost: cost.money.map((m) => money(b, m)), health: cost.health, records: cost.trace.map((t) => recordLabel(t.kind)), traceScore: traceScore(cost.trace),
      ok: f ? f.ok : x.state !== 'failed', reason: f?.reason ?? null, args: x.args,
    };
  });
  const bk = p.diary.booking;
  const where = p.me.where;
  return {
    now: clock(b, city, d.now),
    place: where.k === 'city'
      ? { kind: 'city', city: where.city, cityName: cityName(b, where.city), venue: where.venue, station: where.station, stationName: where.station ? stationName(b, where.station) : null }
      : { kind: 'aboard', trainNo: b.tt.trips[b.tt.trip(where.ride.tripId)]!.trainNo, trainKey: where.ride.trainKey, from: where.ride.from, to: where.ride.to, toName: stationName(b, where.ride.to), schedArr: stationClock(b, where.ride.to, where.ride.schedArr), shownDelaySec: where.ride.shownDelay, sleeper: where.ride.sleeper, cls: where.ride.cls },
    health: p.me.health,
    busyUntil: p.me.busyUntil > d.now ? clock(b, city, p.me.busyUntil) : null,
    lodged: p.me.lodged ? { city: p.me.lodged.city, cityName: cityName(b, p.me.lodged.city), tier: p.me.lodged.tier, since: clock(b, p.me.lodged.city, p.me.lodged.since) } : null,
    booking: bk ? {
      id: bk.id, legs: bk.legs.map((l) => legView(d, p, l)), cls: bk.cls, sleeper: bk.sleeper, missOdds: bk.missOdds, minSlackSec: bk.minSlackSec, next: bk.next,
      leaveAt: Number.isFinite(leave) ? clock(b, city, leave) : null, countdownSec: Number.isFinite(leave) ? leave - d.now : null, slackSec: Number.isFinite(flow.slack) ? flow.slack : null,
    } : null,
    slots: slotViews,
    interrupts: p.diary.interrupts.map((i, index) => ({ index, at: clock(b, city, i.at), kind: i.kind, label: interruptLabel(i.kind), ref: i.ref })),
    ended: p.ending !== null,
  };
}

export interface UpcomingItem { at: Clock; what: string; interrupts: boolean }

/** What will pass before the next interrupt (scheduled times; delays are not known in advance). */
export function upcomingView(p: PublicState, d: ViewData): UpcomingItem[] {
  const b = d.b; const s = asRules(p);
  const city = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(b, p.me.where.ride.to);
  const items: Array<{ t: number; what: string; interrupts: boolean }> = [];
  for (const f of computeFlow(s, { b, params: d.params, now: d.now }).slots) {
    const x = p.diary.slots.find((y) => y.id === f.id)!;
    if (!f.ok) { items.push({ t: d.now, what: `${verbLabel(x.verb)} cannot happen: ${f.reason}`, interrupts: true }); continue; }
    if (f.travel > 0) items.push({ t: f.start - f.travel, what: `Go to the ${f.venue}`, interrupts: false });
    items.push({ t: f.start, what: `${verbLabel(x.verb)} begins`, interrupts: false });
    items.push({ t: f.end, what: `${verbLabel(x.verb)} ends`, interrupts: x.verb === 'cable' || x.verb === 'posteRestante' });
  }
  for (const x of p.diary.slots.filter((y) => y.state === 'running')) items.push({ t: x.end, what: `${verbLabel(x.verb)} ends`, interrupts: false });
  const bk = p.diary.booking;
  if (bk && p.me.where.k === 'city' && bk.next < bk.legs.length) {
    const leg = bk.legs[bk.next]!;
    const leave = leaveAt(s, b);
    if (Number.isFinite(leave)) items.push({ t: leave, what: `Leave for ${stationName(b, leg.from)}`, interrupts: false });
    items.push({ t: leg.dep - dv<number>(b, 'DV-C07-001'), what: `On the platform at ${stationName(b, leg.from)}`, interrupts: false });
    items.push({ t: leg.dep, what: `Departure of ${b.tt.trips[b.tt.trip(leg.tripId)]!.trainNo} (if it runs as you believe)`, interrupts: false });
  }
  if (p.me.where.k === 'aboard') {
    const r = p.me.where.ride;
    items.push({ t: r.schedArr + r.shownDelay, what: `Arrival at ${stationName(b, r.to)} (timetable)`, interrupts: true });
  }
  for (const o of p.commissions.offers.filter((x) => x.status === 'held')) {
    const i = o.stages.findIndex((st) => st.done === null);
    if (i >= 0) items.push({ t: o.stages[i]!.close, what: `Meeting in ${cityName(b, o.stages[i]!.city)} closes`, interrupts: true });
  }
  if (p.ledger.rent) items.push({ t: p.ledger.rent.nextDue, what: 'Rent falls due', interrupts: false });
  if (p.ledger.bill && !p.ledger.bill.met) items.push({ t: p.ledger.bill.maturity, what: 'The bill matures', interrupts: true });
  items.push({ t: p.endsAt, what: 'End of the scenario', interrupts: true });
  items.sort((x, y) => x.t - y.t);
  const out: UpcomingItem[] = [];
  for (const it of items) {
    if (it.t < d.now) continue;
    out.push({ at: clock(b, city, it.t), what: it.what, interrupts: it.interrupts });
    if (it.interrupts) break;
  }
  return out;
}
