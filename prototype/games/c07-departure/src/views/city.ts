/**
 * CityPanel (RULES.md 9): the venues with today's hours, the registration regime, lodging tiers
 * and prices, and the acts possible now (with previews, from `actionsView`).
 */
import { fmtClock } from '#kit/time/format.ts';
import { dv, localIn, jurOfCity, stationsOfCity } from '../rules/data.ts';
import { correspondentIn, postIn, telegraphIn, lodgingPrice, slipAuthority, TIERS } from '../rules/verbs.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, money, cityName, instName, stationName, citation, type Clock, type CitationView } from './format.ts';
import { actionsView, type ActionView } from './actions.ts';

export interface VenueView { venue: string; institution: string | null; name: string; hoursToday: string; openNow: boolean; citation: CitationView | null }

export interface CityViewModel {
  city: string; cityName: string; jurisdiction: string; date: Clock; venues: VenueView[];
  registration: { slip: boolean; text: string; authority: string | null; citation: CitationView | null };
  lodging: Array<{ tier: string; price: string; range: string; citation: CitationView | null }>;
  lodged: { tier: string; since: Clock } | null;
  stations: Array<{ id: string; name: string }>;
  acts: ActionView[];
}

function spansText(spans: Array<[number, number, number]> | undefined, weekday: number): { text: string; list: Array<[number, number]> } {
  const list = (spans ?? []).filter(([m]) => (m & (1 << weekday)) !== 0).map(([, o, c]) => [o, c] as [number, number]).sort((x, y) => x[0] - y[0]);
  if (list.length === 0) return { text: 'closed today', list };
  if (list.length === 1 && list[0]![0] === 0 && list[0]![1] === 86400) return { text: 'day and night', list };
  return { text: list.map(([o, c]) => `${fmtClock(o)}–${fmtClock(c === 86400 ? 0 : c)}`).join(', '), list };
}

export function cityView(p: PublicState, d: ViewData): CityViewModel | null {
  if (p.me.where.k !== 'city') return null;
  const b = d.b; const s = asRules(p); const city = p.me.where.city;
  const e = { b, params: d.params, now: d.now };
  const { day, sec } = localIn(b, city, d.now);
  const wd = ((day % 7) + 7) % 7;
  const jur = jurOfCity(b, city);
  const venue = (v: string, param: string | null, inst: string | null, closedReason: string | null = null): VenueView => {
    const row = param && inst ? d.params.row(param, inst, day) : undefined;
    const sp = param && inst ? spansText((row?.value as { days?: Array<[number, number, number]> } | undefined)?.days, wd) : { text: 'always', list: [[0, 86400]] as Array<[number, number]> };
    const text = closedReason ?? sp.text;
    return { venue: v, institution: inst, name: inst ? instName(b, inst) : v, hoursToday: text, openNow: closedReason === null && sp.list.some(([o, c]) => sec >= o && sec < c), citation: citation(b, row?.cite) };
  };
  const venues: VenueView[] = [];
  if (stationsOfCity(b, city).length) {
    const h = dv<{ open: number; close: number }>(b, 'DV-C07-008');
    venues.push({ venue: 'station', institution: null, name: stationsOfCity(b, city).map((x) => stationName(b, x)).join(' / '), hoursToday: `bookstall and porters ${fmtClock(h.open)}–${fmtClock(h.close)}`, openNow: sec >= h.open && sec < h.close, citation: null });
  }
  const bank = correspondentIn(b, s, city);
  const closed = d.params.get<{ reason: string }>('bank.closed', jur, day);
  if (bank) venues.push(venue('bank', 'bank.hours', bank, closed ? `closed today: ${closed.reason}` : null));
  const post = postIn(b, city); if (post) venues.push(venue('post', 'post.hours', post));
  const tel = telegraphIn(b, city); if (tel) venues.push(venue('telegraph', 'telegraph.hours', tel));
  const lodging = TIERS.map((tier) => {
    const r = d.params.row('lodging.price', `${city}|${tier}`, day);
    const pr = lodgingPrice(e, city, tier);
    const v = r?.value as { minMinor: number; maxMinor: number; cur: string } | undefined;
    return pr && v ? { tier, price: money(b, pr), range: `${money(b, { cur: pr.cur, minor: v.minMinor })}–${money(b, { cur: pr.cur, minor: v.maxMinor })}`, citation: citation(b, r?.cite) } : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  if (lodging.length) venues.push({ venue: 'hotel', institution: null, name: 'Hotels', hoursToday: 'always', openNow: true, citation: null });
  if (b.gameCities.includes(city)) venues.push({ venue: 'meeting', institution: null, name: 'Meeting places', hoursToday: 'as arranged', openNow: true, citation: null });
  const regRow = d.params.row('registration.regime', jur, day);
  const reg = regRow?.value as { hotelSlip: boolean; toPolice: boolean; deadlineSec: number | null; appliesTo: string } | undefined;
  const auth = slipAuthority(s, e, city);
  return {
    city, cityName: cityName(b, city), jurisdiction: jur, date: clock(b, city, d.now), venues,
    registration: {
      slip: auth !== null,
      text: !reg ? 'No registration rule known' : !reg.hotelSlip ? 'Hotels keep no slips' : `Hotels fill a slip for ${reg.appliesTo === 'all' ? 'every guest' : 'foreign guests'}${reg.toPolice ? ', sent to the police' : ''}${reg.deadlineSec ? ` within ${Math.round(reg.deadlineSec / 3600)} h` : ''}`,
      authority: auth ? instName(b, auth) : null, citation: citation(b, regRow?.cite),
    },
    lodging,
    lodged: p.me.lodged && p.me.lodged.city === city ? { tier: p.me.lodged.tier, since: clock(b, city, p.me.lodged.since) } : null,
    stations: stationsOfCity(b, city).map((x) => ({ id: x, name: stationName(b, x) })),
    acts: actionsView(p, d).filter((a) => a.cmd.type === 'planVerb'),
  };
}
