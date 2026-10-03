/**
 * Event cards (Decision P-012): short cards for what the rules produced while the clock ran: a
 * frontier hall, a delay, a change, a train that is not as the guide said, a missed connection,
 * arrival, letters, the end. Each has one or two buttons. Built from the public state, the own
 * trail and the marks taken when the clock started, so a card never reveals the hunt.
 */
import { cityOfStation, cityOfPlace, localIn } from '../rules/data.ts';
import { lodgingPrice } from '../rules/verbs.ts';
import { checkCommand, type C07Command } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, stationClock, money, cityName, stationName, interruptText, verbLabel, span, type Clock } from './format.ts';
import { goalView, dayTime } from './goal.ts';
import { shelfView } from './shelf.ts';

/** How far the screens have read: taken before the clock runs, compared after. */
export interface Marks { interrupts: number; records: number; stages: number; delay: number; at: string }

export type CardAction =
  | { kind: 'dismiss' }
  | { kind: 'open'; city: string }
  | { kind: 'act'; cmds: C07Command[] }
  | { kind: 'pocket' }
  | { kind: 'end' };

export interface CardButton { label: string; action: CardAction; primary: boolean }

export interface EventCard {
  id: string; kind: string; tone: 'good' | 'bad' | 'note';
  title: string; text: string; at: Clock;
  buttons: CardButton[];
}

const stagesDone = (p: PublicState): number => p.commissions.offers.reduce((n, o) => n + o.stages.filter((s) => s.done !== null).length, 0);
const whereKey = (p: PublicState): string => {
  const w = p.me.where; const bk = p.diary.booking;
  return w.k === 'aboard' ? `ride:${w.ride.booking}:${w.ride.leg}` : `city:${w.city}:${bk ? `${bk.id}:${bk.next}` : '-'}`;
};

export function marksOf(p: PublicState, d: ViewData): Marks {
  return {
    interrupts: p.diary.interrupts.length, records: d.trail.records.length, stages: stagesDone(p),
    delay: p.me.where.k === 'aboard' ? p.me.where.ride.shownDelay : 0, at: whereKey(p),
  };
}

const ok = (label = 'Carry on'): CardButton => ({ label, action: { kind: 'dismiss' }, primary: true });

const ENDING: Record<string, [string, EventCard['tone']]> = {
  delivered: ['Delivered', 'good'], partial: ['Out of time', 'note'], captured: ['Arrested', 'bad'], ruined: ['Ruined', 'bad'], stranded: ['Stranded', 'bad'],
};

const GHOST: Record<string, string> = {
  withdrawn: 'no longer runs', retimed: 'now leaves at another time', notThatDay: 'does not run today', suspended: 'is suspended',
};

export function cardsSince(p: PublicState, d: ViewData, m: Marks): EventCard[] {
  const b = d.b; const s = asRules(p);
  const here = p.me.where.k === 'city' ? p.me.where.city : cityOfStation(b, p.me.where.ride.to);
  const out: Array<EventCard & { t: number; order: number }> = [];
  const push = (c: EventCard, t: number, order = 0): void => { out.push({ ...c, t, order }); };
  const ended = p.ending !== null;

  // Frontier halls: from the own trail written since the marks.
  const fresh = d.trail.records.slice(m.records);
  for (const r of fresh) {
    if (r.kind !== 'frontier.passport' && r.kind !== 'frontier.customs') continue;
    if (r.kind === 'frontier.customs' && fresh.some((x) => x.kind === 'frontier.passport' && x.place === r.place && x.time === r.time)) continue;
    const st = r.place ?? ''; const city = cityOfPlace(b, st);
    const delay = p.me.where.k === 'aboard' && p.me.where.ride.shownDelay > m.delay ? ` The train is running ${span(p.me.where.ride.shownDelay)} late.` : '';
    push({
      id: `rec-${r.id}`, kind: 'frontier', tone: r.kind === 'frontier.passport' ? 'bad' : 'note',
      title: `Frontier at ${stationName(b, st)}`,
      text: r.kind === 'frontier.passport'
        ? `An officer checks your passport and your name goes into the frontier register.${delay}`
        : `Customs look through your luggage. Nobody asks your name.${delay}`,
      at: clock(b, city, r.time), buttons: [ok()],
    }, r.time, 1);
  }
  // A delay shown at a hall without a record of ours (none in this world, but the rules allow it).
  if (p.me.where.k === 'aboard' && p.me.where.ride.shownDelay > m.delay && !out.some((c) => c.kind === 'frontier')) {
    const r = p.me.where.ride;
    push({ id: `late-${r.booking}-${r.leg}-${r.shownDelay}`, kind: 'delay', tone: 'note', title: 'Running late', text: `The train is running ${span(r.shownDelay)} late.`, at: clock(b, here, d.now), buttons: [ok()] }, d.now, 1);
  }
  // A change between two booked trains.
  const key = whereKey(p);
  const bk = p.diary.booking;
  if (key !== m.at && p.me.where.k === 'city' && bk && bk.next > 0 && bk.next < bk.legs.length) {
    const prev = bk.legs[bk.next - 1]!; const next = bk.legs[bk.next]!;
    const city = p.me.where.city;
    const across = prev.to !== next.from ? `, across town at ${stationName(b, next.from)}` : '';
    const wait = next.dep - d.now;
    const hour = Math.floor(localIn(b, city, d.now).sec / 3600);
    const buttons: CardButton[] = [ok(wait >= 5 * 3600 ? 'Wait at the station' : 'Carry on')];
    let extra = '';
    if (wait >= 5 * 3600 && (hour >= 19 || hour < 5)) {
      const lodge: C07Command = { type: 'planVerb', verb: 'lodge', args: { tier: 'modest' } };
      const price = lodgingPrice({ b, params: d.params, now: d.now }, city, 'modest');
      const restSec = Math.min(8, Math.floor((wait - 3 * 3600) / 3600)) * 3600;
      if (price && restSec >= 3600 && checkCommand(s, b, d.params, d.params, d.now, null, lodge) === null) {
        const rest: C07Command = { type: 'planVerb', verb: 'rest', args: { sec: restSec } };
        buttons.unshift({ label: `Take a room (${money(b, price)})`, action: { kind: 'act', cmds: [lodge, rest] }, primary: true });
        buttons[1] = { ...buttons[1]!, primary: false };
        extra = ' A night in a hotel rests you, but the hotel writes your name on a police slip.';
      }
    }
    push({
      id: `change-${bk.id}-${bk.next}`, kind: 'change', tone: 'note', title: `Change at ${cityName(b, city)}`,
      text: `You made the connection. The ${stationClock(b, next.from, next.dep).time} to ${cityName(b, cityOfStation(b, next.to))} leaves in ${span(wait)}${across}.${extra}`,
      at: clock(b, city, d.now), buttons,
    }, d.now, 2);
  }
  // A meeting kept.
  const goal = goalView(p, d);
  if (stagesDone(p) > m.stages && !(ended && p.ending!.kind === 'delivered')) {
    push({
      id: `stage-${stagesDone(p)}`, kind: 'stage', tone: 'good', title: 'Letter handed over',
      text: goal.status === 'open' && goal.city && goal.closes ? `Next: ${goal.cityName} by ${dayTime(d, goal.city, goal.closes.t)}.` : 'That was the last meeting.',
      at: clock(b, here, d.now), buttons: [ok()],
    }, d.now, 3);
  }
  // Interrupts since the marks.
  p.diary.interrupts.slice(m.interrupts).forEach((it, i) => {
    const ref = (it.ref ?? {}) as Record<string, unknown>;
    const id = `int-${m.interrupts + i}`;
    const at = clock(b, here, it.at);
    const station = typeof ref.station === 'string' ? ref.station : null;
    const city = station ? cityOfStation(b, station) : here;
    const see: CardButton = { label: 'See other trains', action: { kind: 'open', city }, primary: true };
    switch (it.kind) {
      case 'arrival': {
        const late = Number(ref.delaySec ?? 0);
        const contact = goal.city === city && goal.opens && goal.closes ? ` Your contact waits here ${dayTime(d, city, goal.opens.t, true)}–${goal.closes.time}.` : '';
        push({ id, kind: 'arrival', tone: 'good', title: `Arrived in ${cityName(b, city)}`, text: `${station ? stationName(b, station) : cityName(b, city)}, ${late > 0 ? `${span(late)} late` : 'on time'}.${contact}`, at: clock(b, city, it.at), buttons: ended ? [ok()] : [{ label: 'Step out', action: { kind: 'open', city }, primary: true }] }, it.at, 5);
        break;
      }
      case 'missed': {
        const late = Number(ref.delaySec ?? 0);
        push({ id, kind: 'missed', tone: 'bad', title: 'Connection missed', text: `Your train came in ${span(late)} late and the onward train had gone. Your ticket stays good for two days on the same route.`, at, buttons: [see] }, it.at, 5);
        break;
      }
      case 'ghost': {
        const status = String(ref.status ?? '');
        const trainKey = String(ref.trainKey ?? '');
        const idx = b.tt.tripsByKey.get(trainKey)?.[0];
        const tno = idx === undefined ? 'train' : (b.tt.trips[idx]!.name ?? `train ${b.tt.trips[idx]!.trainNo}`);
        const later = status === 'retimed' && typeof ref.truthDep === 'number' && ref.truthDep >= it.at;
        const truth = typeof ref.truthDep === 'number' && status === 'retimed' ? ` It leaves at ${clock(b, city, ref.truthDep).time} now${later ? ', and you will take it then' : ', and it has gone'}.` : '';
        const buttons: CardButton[] = later ? [ok()] : [];
        const shelf = shelfView(p, d);
        const sale = shelf.onSale.find((x) => x.legal && !p.knowledge.kg.editions.includes(x.edition));
        if (sale && !later) {
          const cmd: C07Command = { type: 'planVerb', verb: 'buyGuide', args: { edition: sale.edition } };
          if (checkCommand(s, b, d.params, d.params, d.now, null, cmd) === null) buttons.push({ label: `Buy the new guide (${sale.price})`, action: { kind: 'act', cmds: [cmd] }, primary: true });
        }
        if (!later) buttons.push({ ...see, primary: buttons.length === 0 });
        push({ id, kind: 'ghost', tone: 'bad', title: 'Not in the timetable', text: `The ${tno} ${GHOST[status] ?? 'is not as your guide said'}: your guide is out of date.${truth}${later ? '' : ' The booking is void.'}`, at, buttons }, it.at, 4);
        break;
      }
      case 'refused':
        push({ id, kind: 'refused', tone: 'bad', title: 'Turned back at the frontier', text: `At ${station ? stationName(b, station) : 'the frontier'} your papers do not pass.`, at, buttons: [see] }, it.at, 5);
        break;
      case 'news': {
        const ids = Array.isArray(ref.ids) ? ref.ids as string[] : [];
        const titles = ids.map((x) => b.raw.calendar.find((e) => e.id === x)?.title ?? (x.startsWith('protest:') ? 'A bill protested for non-payment' : x));
        push({ id, kind: 'news', tone: 'note', title: `In the ${cityName(b, String(ref.city ?? here))} papers`, text: titles.length ? `${titles.join('. ')}.` : 'Nothing that concerns you.', at, buttons: [ok('Noted')] }, it.at, 6);
        break;
      }
      case 'offer':
        push({ id, kind: 'offer', tone: 'good', title: 'Letters for you', text: interruptText(b, it.kind, it.ref, here), at, buttons: [{ label: 'Read them', action: { kind: 'pocket' }, primary: true }, { label: 'Later', action: { kind: 'dismiss' }, primary: false }] }, it.at, 6);
        break;
      case 'lapsed':
        push({ id, kind: 'lapsed', tone: 'bad', title: ref.failed ? 'Too late' : 'An offer lapsed', text: ref.failed ? 'A meeting closed without you: the commission has failed.' : interruptText(b, it.kind, it.ref, here), at, buttons: [ok('Noted')] }, it.at, 6);
        break;
      case 'verbFailed':
        push({ id, kind: 'failed', tone: 'bad', title: `${verbLabel(String(ref.verb ?? ''))}: not possible`, text: String(ref.reason ?? 'It could not happen.'), at, buttons: [ok('Noted')] }, it.at, 6);
        break;
      case 'noticed':
        push({ id, kind: 'noticed', tone: 'bad', title: 'You are watched', text: `A man ${station ? `on the platform at ${stationName(b, station)}` : `in ${cityName(b, city)}`} watches the passengers rather than the trains.`, at, buttons: [ok('Noted')] }, it.at, 6);
        break;
      case 'ending': {
        const kind = String(ref.kind ?? p.ending?.kind ?? '');
        const [title, tone] = ENDING[kind] ?? ['The end', 'note'];
        const text = kind === 'delivered' ? `The last letter is handed over: ${goal.pay ?? ''} is paid to your letter of credit.` : kind === 'captured' ? 'The police were waiting for you.' : kind === 'stranded' ? 'The timetable left you stranded short of your contact.' : 'The time for the commission has run out.';
        push({ id, kind: 'ending', tone, title, text, at, buttons: [{ label: 'How it went', action: { kind: 'end' }, primary: true }] }, it.at, 9);
        break;
      }
      default:
        push({ id, kind: it.kind, tone: it.kind === 'remittance' || it.kind === 'cable' ? 'good' : 'note', title: interruptTitle(it.kind), text: interruptText(b, it.kind, it.ref, here), at, buttons: [ok('Noted')] }, it.at, 6);
    }
  });
  return out.sort((x, y) => x.t - y.t || x.order - y.order).map(({ t: _t, order: _o, ...c }) => { void _t; void _o; return c; });
}

const TITLES: Record<string, string> = {
  cable: 'A telegram for you', remittance: 'Money from home', cannotPay: 'Not enough money', collapse: 'Exhausted', suspended: 'Service suspended', papers: 'New papers needed',
};
const interruptTitle = (kind: string): string => TITLES[kind] ?? 'News';

/** One line on what an act in town came to, once the clock has stopped. */
export function actOutcome(p: PublicState, d: ViewData, slotId: number): string | null {
  const b = d.b;
  const slot = p.diary.slots.find((x) => x.id === slotId);
  if (!slot) return null;
  const here = p.me.where.k === 'city' ? p.me.where.city : null;
  const at = here ? clock(b, here, slot.end).time : '';
  if (slot.state === 'failed') return null;
  switch (slot.verb) {
    case 'askPorter': {
      const keys = Array.isArray(slot.args.trainKeys) ? slot.args.trainKeys as string[] : [];
      const learned = p.knowledge.kg.learned.filter((e) => e.source === 'porter' && keys.includes(e.trainKey));
      const no = learned.some((e) => e.confidence === 0);
      return `${at}: the porter says ${no ? 'your train does not run as the guide says' : 'your train runs as the guide says'}.`;
    }
    case 'drawCredit': return `${at}: the draft is cashed.`;
    case 'buyGuide': return `${at}: the new guide is in your pocket.`;
    case 'lodge': return `${at}: you have a room for the night.`;
    case 'posteRestante': return `${at}: you collected your letters.`;
    case 'checkBoard': return `${at}: you read the departure board.`;
    case 'cable': return `${at}: the telegram is sent.`;
    case 'rest': return `${at}: you rested.`;
    case 'wait': return `${at}: you waited.`;
    case 'meet': return null;
    default: return `${at}: done.`;
  }
}
