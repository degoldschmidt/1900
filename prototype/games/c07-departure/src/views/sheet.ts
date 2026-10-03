/**
 * The city sheet (Decision P-012): what a tap on a city opens over the map.
 *  - Your own city: the departures one train away, each in a plain row with Book; the booked train
 *    with a countdown; and two to four things to do in town that fit before it.
 *  - Another city: the best journeys there (from the planner), changes listed in words.
 * Times are 24-hour railway times; no odds, no cost vectors, no edition codes.
 */
import { dayOf } from '#kit/time/instant.ts';
import type { Money } from '#kit/money/money.ts';
import { cityOfStation, localIn } from '../rules/data.ts';
import type { Cls, PlannedLeg } from '../rules/types.ts';
import { costOf } from '../rules/costs.ts';
import { categoryOf } from '../rules/forecast.ts';
import { drawYield, correspondentIn } from '../rules/verbs.ts';
import { leaveAt } from '../rules/diary.ts';
import { convertTo } from '../rules/costs.ts';
import { checkCommand, type C07Command } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, stationClock, money, cityName, stationName, instName, span, classWord, reliabilityWord, changeWord, poundsWords, type Clock } from './format.ts';
import { boardView } from './board.ts';
import { plannerView, plannerStart } from './planner.ts';
import { actionsView, type ActionView } from './actions.ts';
import { goalView, dayTime } from './goal.ts';

export interface DepartureRow {
  id: string;
  dep: Clock; arr: Clock;
  toCity: string; toName: string;
  /** "12.20 to Corlaine". */
  head: string;
  /** "arrives 14.20 · 2 h" (with the weekday when it is another day). */
  times: string;
  /** "Corvenian Mail" / "train 35" / "the night steamer". */
  train: string;
  /** "2nd class 6.70 cv." */
  fare: string;
  cls: Cls;
  /** "usually on time", "tight change at Aubrevaux". */
  reliability: string;
  /** Changes and frontiers in words. */
  notes: string[];
  goal: boolean;
  /** Where the choice was offered (stamped on the booking for the metrics). */
  source: 'default' | 'planner' | 'board';
  cmd: C07Command; legal: boolean; error: string | null;
  /** A berth in the sleeping car, when the train has one. */
  berth: { fare: string; cmd: C07Command; legal: boolean } | null;
}

export interface TownChoice {
  id: string; label: string;
  /** "45 min", "1 h, from 15.00". */
  time: string;
  /** One line: what it does for you. */
  effect: string;
  cmd: C07Command; legal: boolean; error: string | null;
  kind: string;
}

export interface CitySheetViewModel {
  city: string; cityName: string; country: string;
  here: boolean;
  /** "Your contact waits here 15.00–19.00." */
  goalNote: string | null;
  booking: null | {
    head: string; times: string; leavesIn: string; leaveBy: string;
    cancel: C07Command; cancelLegal: boolean;
  };
  departures: DepartureRow[];
  choices: TownChoice[];
  /** Why the list is empty, or a hint. */
  note: string | null;
}

const countryName = (d: ViewData, city: string): string => d.b.map?.countries.find((c) => c.id === d.b.city.get(city)?.country)?.name ?? '';

function trainWord(d: ViewData, tripId: string): string {
  const t = d.b.tt.trips[d.b.tt.trip(tripId)]!;
  if (t.mode !== 'rail') return t.name ? `the ${t.name.toLowerCase()}` : 'the steamer';
  return t.name ?? `train ${t.trainNo}`;
}

const sameDay = (d: ViewData, city: string, a: number, b: number): boolean => localIn(d.b, city, a).day === localIn(d.b, city, b).day;

function arrivesText(d: ViewData, fromCity: string, toCity: string, dep: number, arr: number, arrClock: Clock): string {
  const when = sameDay(d, fromCity, dep, arr) && sameDay(d, toCity, d.now, arr) ? arrClock.time : dayTime(d, toCity, arr, true);
  return `arrives ${when} · ${span(arr - dep)}`;
}

/** Frontier halls on the way, in words. */
function frontierNotes(d: ViewData, trace: ReturnType<typeof costOf>['trace']): string[] {
  const out: string[] = [];
  if (trace.some((t) => t.kind === 'frontier.passport')) out.push('a frontier: your name goes into the register');
  else if (trace.some((t) => t.kind === 'frontier.customs')) out.push('customs at the frontier');
  if (trace.some((t) => t.kind === 'berth.reservation')) out.push('the berth is booked in your name');
  void d;
  return out;
}

function pickClass(mask: number, want: Cls): Cls {
  for (const c of [want, 2, 3, 1] as Cls[]) if ((mask & (1 << (c - 1))) !== 0) return c;
  return want;
}

const fareText = (d: ViewData, cls: Cls, m: Money[]): string => `${classWord(cls)} ${m.map((x) => money(d.b, x)).join(' + ')}`;

/** The departures one train away from the player's city, grouped by destination (two each), goal first. */
export function departuresHere(p: PublicState, d: ViewData, want: Cls): DepartureRow[] {
  if (p.me.where.k !== 'city' || p.ending) return [];
  const b = d.b; const s = asRules(p); const here = p.me.where.city;
  const e = { b, params: d.params, now: d.now };
  const goal = goalView(p, d).city;
  const ps = plannerStart(p, d); const start = ps.t;
  const rows: DepartureRow[] = [];
  const perCity = new Map<string, number>();
  const cand: Array<{ tripId: string; day: number; from: string; to: string; dep: number; arr: number; arrClock: Clock; depClock: Clock }> = [];
  for (const st of ps.stations) {
    for (const r of boardView(p, d, st, 86400).rows) {
      if (r.dep.t < start) continue;
      const seen = new Set<string>();
      for (const c of r.calls) {
        const city = cityOfStation(b, c.station);
        if (city === here || seen.has(city)) continue;
        seen.add(city);
        cand.push({ tripId: r.tripId, day: r.day, from: st, to: c.station, dep: r.dep.t, arr: c.arr.t, arrClock: c.arr, depClock: r.dep });
      }
    }
  }
  cand.sort((x, y) => x.dep - y.dep || x.arr - y.arr);
  for (const c of cand) {
    const city = cityOfStation(b, c.to);
    if ((perCity.get(city) ?? 0) >= 2) continue;
    perCity.set(city, (perCity.get(city) ?? 0) + 1);
    const trip = b.tt.trips[b.tt.trip(c.tripId)]!;
    const cls = pickClass(trip.classMask, want);
    const leg: PlannedLeg = { tripId: c.tripId, trainKey: trip.trainKey, day: c.day, from: c.from, to: c.to, dep: c.dep, arr: c.arr };
    const cost = costOf({ type: 'book', legs: [leg], cls, sleeper: false }, s, e);
    const cmd: C07Command = { type: 'book', legs: [{ tripId: c.tripId, day: c.day, from: c.from, to: c.to }], cls, sleeper: false };
    const error = checkCommand(s, b, d.params, d.params, d.now, null, cmd);
    let berth: DepartureRow['berth'] = null;
    if (trip.sleeper) {
      const bc: C07Command = { ...cmd, sleeper: true } as C07Command;
      const bcost = costOf({ type: 'book', legs: [leg], cls, sleeper: true }, s, e);
      berth = { fare: bcost.money.map((m) => money(b, m)).join(' + '), cmd: bc, legal: checkCommand(s, b, d.params, d.params, d.now, null, bc) === null };
    }
    rows.push({
      id: `${c.tripId}@${c.day}>${c.to}`, dep: stationClock(b, c.from, c.dep), arr: c.arrClock, toCity: city, toName: cityName(b, city),
      head: `${c.depClock.time} to ${cityName(b, city)}`, times: arrivesText(d, here, city, c.dep, c.arr, c.arrClock), train: trainWord(d, c.tripId),
      fare: fareText(d, cls, cost.money), cls, reliability: reliabilityWord(categoryOf(trip)), notes: frontierNotes(d, cost.trace), goal: city === goal, source: 'board',
      cmd, legal: error === null, error, berth,
    });
  }
  const order = (r: DepartureRow): number => (r.goal ? 0 : b.gameCities.includes(r.toCity) ? 1 : 2);
  return rows.sort((x, y) => order(x) - order(y) || x.dep.t - y.dep.t).slice(0, 10);
}

/** The best journeys to another city, from the planner, in words. */
export function journeysTo(p: PublicState, d: ViewData, to: string, want: Cls): { rows: DepartureRow[]; note: string | null } {
  const b = d.b; const tt = b.tt; const s = asRules(p);
  const pl = plannerView(p, d, to);
  const goal = goalView(p, d).city;
  const fromCity = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(b, p.me.where.ride.to);
  const opts = [...pl.options].sort((x, y) => Number(y.isDefault) - Number(x.isDefault) || x.dep.t - y.dep.t).slice(0, 4);
  const rows = opts.map((o): DepartureRow => {
    const co = o.classes.find((c) => c.cls === want) ?? o.classes.find((c) => c.legal) ?? o.classes[0]!;
    const legs = o.legs;
    const notes: string[] = [];
    o.changes.forEach((c, i) => {
      const prev = legs[i]!; const next = legs[i + 1]!;
      const where = cityName(b, cityOfStation(b, c.station));
      const across = prev.to !== next.from ? ', across town' : '';
      const night = c.slackSec >= 6 * 3600 && !sameDay(d, cityOfStation(b, c.station), prev.arr.t, next.dep.t) ? `a night in ${where}` : `${changeWord(c.odds, c.slackSec)} at ${where}`;
      notes.push(`${night}${across} (${span(next.dep.t - prev.arr.t)})`);
    });
    const e = { b, params: d.params, now: d.now };
    const planned: PlannedLeg[] = legs.map((l) => ({ tripId: l.tripId, trainKey: l.trainKey, day: l.day, from: l.from, to: l.to, dep: l.dep.t, arr: l.arr.t }));
    const frontier = frontierNotes(d, costOf({ type: 'book', legs: planned, cls: co.cls, sleeper: false }, s, e).trace);
    const first = tt.trips[tt.trip(legs[0]!.tripId)]!;
    const reliability = o.changes.length === 0 ? reliabilityWord(categoryOf(first)) : notes.shift()!;
    notes.push(...frontier);
    return {
      id: `plan-${o.index}`, dep: o.dep, arr: o.arr, toCity: to, toName: cityName(b, to),
      head: `${o.dep.time} to ${cityName(b, to)}`, times: arrivesText(d, fromCity, to, o.dep.t, o.arr.t, o.arr),
      train: legs.map((l) => trainWord(d, l.tripId)).join(', then '), fare: fareText(d, co.cls, co.fareMoney), cls: co.cls,
      reliability, notes, goal: to === goal, source: o.isDefault ? 'default' : 'planner', cmd: co.cmd, legal: co.legal, error: co.error,
      berth: o.sleeper.available && o.sleeper.cmd ? { fare: o.sleeper.fare.join(' + '), cmd: o.sleeper.cmd, legal: o.sleeper.legal } : null,
    };
  });
  return { rows, note: rows.length ? null : pl.note === 'You are already there' ? null : (pl.note ?? 'No train you know of goes there within two days.') };
}

// ------------------------------------------------------------------ things to do in town

/** Two to four things to do before the train, chosen for the moment, each with its time and effect in words. */
export function townChoices(p: PublicState, d: ViewData): TownChoice[] {
  if (p.me.where.k !== 'city' || p.ending) return [];
  const b = d.b; const s = asRules(p); const city = p.me.where.city;
  const e = { b, params: d.params, now: d.now };
  const acts = actionsView(p, d).filter((a) => a.cmd.type === 'planVerb');
  const verb = (a: ActionView): string => (a.cmd as { verb: string }).verb;
  const args = (a: ActionView): Record<string, unknown> => (a.cmd as { args: Record<string, unknown> }).args;
  const hour = Math.floor(localIn(b, city, d.now).sec / 3600);
  const day = dayOf(d.now);
  const cashGbp = p.ledger.cash.reduce((acc, m) => acc + convertTo(m, 'GBP', d.params, day).minor, 0);
  const booked = p.diary.booking !== null;
  const goal = goalView(p, d);
  const out: Array<TownChoice & { score: number }> = [];
  const when = (a: ActionView): string => {
    const pv = a.preview!;
    const dur = span(pv.durationSec);
    return pv.start && pv.start.t > d.now + 25 * 60 ? `${dur}, from ${pv.start.time}` : dur;
  };
  const add = (a: ActionView, label: string, effect: string, score: number): void => {
    out.push({ id: a.id, label, time: when(a), effect, cmd: a.cmd, legal: a.legal, error: a.legal ? null : plainRefusal(a.error), kind: verb(a), score });
  };
  let drew = false; let lodged = false; let rested = false;
  for (const a of acts) {
    const v = verb(a); const x = args(a);
    switch (v) {
      case 'meet': {
        const last = goal.done + 1 === goal.total;
        add(a, 'Meet your contact', last ? `hand over the letter: the commission pays ${goal.pay}` : 'hand over the letter, then on to the next town', 100);
        break;
      }
      case 'drawCredit': {
        if (drew || x.meetBill) break;
        if (Number(x.amount) < 4800 && p.ledger.credit.minor >= 4800) break;
        const bank = correspondentIn(b, s, city);
        const got = drawYield(e, s, city, Number(x.amount));
        drew = true;
        add(a, `Cash a draft${bank ? ` at the ${instName(b, bank)}` : ''}`, `+${money(b, got)} from your letter of credit (${money(b, { cur: p.ledger.credit.cur, minor: Number(x.amount) })})`, cashGbp < 2880 ? 80 : 35);
        break;
      }
      case 'buyGuide': {
        const ed = b.edition.get(String(x.edition));
        if (!ed) break;
        const summer = ed.validFrom > day;
        const local = ed.family !== 'SYN_F_PREVIEW';
        add(a, local ? 'Buy the cheap local guide' : summer ? 'Buy the summer guide' : 'Buy the new guide',
          summer ? `shows the trains that run from ${clock(b, city, ed.validFrom * 86400 + 43200).date.split(' ').slice(1, 3).join(' ')}` : 'shows the trains as they run now', local ? 30 : summer ? 70 : 50);
        break;
      }
      case 'lodge': {
        if (lodged || x.tier !== 'modest' || p.me.lodged?.city === city) break;
        lodged = true;
        add(a, 'Take a room for the night', 'a bed and a rest; the hotel fills in a police slip with your name', hour >= 18 || (!booked && hour >= 16) ? 60 : 12);
        if (hour >= 6 && hour < 16) out.pop();
        break;
      }
      case 'rest': {
        if (rested || Number(x.sec) !== 10800) break;
        rested = true;
        add(a, p.me.lodged?.city === city ? 'Sleep at the hotel for three hours' : 'Doze in the waiting room', 'you feel less tired', p.me.health < 400 ? 65 : 8);
        break;
      }
      case 'posteRestante': add(a, 'Collect letters at the post office', 'new work may be waiting for you', 25); break;
      case 'askPorter': add(a, 'Ask a porter about your train', 'learn whether it really runs as your guide says', 45); break;
      case 'checkBoard': add(a, 'Read the departure board', 'see which trains really run today', 20); break;
      case 'cable': {
        if (x.mode !== 'send' || x.purpose !== 'funds') break;
        add(a, 'Telegraph home for money', 'funds reach your letter of credit in a few hours', cashGbp < 1440 ? 40 : 6);
        break;
      }
      case 'wait': if (Number(x.sec) === 3600) add(a, 'Wait an hour', 'pass the time', 4); break;
      default: break;
    }
  }
  const legal = out.filter((c) => c.legal).sort((x, y) => y.score - x.score);
  const blocked = out.filter((c) => !c.legal && c.kind === 'meet');
  return [...blocked, ...legal].slice(0, 4).map(({ score: _s, ...c }) => { void _s; return c; });
}

/** The rules' refusals, in the map's words. */
function plainRefusal(err: string | null): string | null {
  if (!err) return null;
  if (/leave time/.test(err)) return 'It would make you miss your train.';
  if (/Closed/.test(err)) return 'Closed for days.';
  return err;
}

export function citySheetView(p: PublicState, d: ViewData, city: string, want: Cls = 2): CitySheetViewModel {
  const b = d.b; const s = asRules(p);
  const here = p.me.where.k === 'city' && p.me.where.city === city;
  const goal = goalView(p, d);
  const goalNote = goal.city === city && goal.opens && goal.closes
    ? `Your contact waits here ${dayTime(d, city, goal.opens.t, true)}–${goal.closes.time}${goal.openNow ? ' (now)' : ''}.`
    : null;
  let booking: CitySheetViewModel['booking'] = null;
  const bk = p.diary.booking;
  if (here && bk && bk.next < bk.legs.length) {
    const leg = bk.legs[bk.next]!; const last = bk.legs[bk.legs.length - 1]!;
    const toCity = cityOfStation(b, last.to);
    const leave = leaveAt(s, b);
    const cancel: C07Command = { type: 'cancelBooking' };
    booking = {
      head: `${stationClock(b, leg.from, leg.dep).time} to ${cityName(b, toCity)}, ${classWord(bk.cls)}`,
      times: arrivesText(d, city, toCity, leg.dep, last.arr, stationClock(b, last.to, last.arr)),
      leavesIn: span(leg.dep - d.now),
      leaveBy: Number.isFinite(leave) ? clock(b, city, leave).time : stationClock(b, leg.from, leg.dep).time,
      cancel, cancelLegal: checkCommand(s, b, d.params, d.params, d.now, null, cancel) === null,
    };
  }
  if (here) {
    const departures = booking ? [] : departuresHere(p, d, want);
    return {
      city, cityName: cityName(b, city), country: countryName(d, city), here, goalNote, booking, departures, choices: townChoices(p, d),
      note: booking ? null : departures.length ? null : 'No train you know of leaves here within a day.',
    };
  }
  const j = journeysTo(p, d, city, want);
  return { city, cityName: cityName(b, city), country: countryName(d, city), here, goalNote, booking: null, departures: j.rows, choices: [], note: j.note };
}

/** Local cash with its sterling worth in words, for the top bar. */
export function purseLine(p: PublicState, d: ViewData): { cash: string; words: string } {
  const b = d.b; const day = dayOf(d.now);
  const cash = p.ledger.cash.filter((m) => m.minor > 0);
  const gbp = p.ledger.cash.reduce((acc, m) => acc + convertTo(m, 'GBP', d.params, day).minor, 0);
  return { cash: cash.length ? cash.map((m) => money(b, m)).join(' + ') : 'no cash', words: poundsWords(gbp) };
}
