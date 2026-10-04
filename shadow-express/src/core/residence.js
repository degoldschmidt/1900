// Living under cover in a city: the watches of the day, the work that keeps a legend alive, lodgings and the police
// registration, and the local police's attention ("the watch"), which the player never sees directly.
//   legend: S.legend['VIE|hale'] 0..1, how established a cover is in a city; it grows with cover work, wears with neglect.
//   watch:  S.watch['VIE'] 0..1, how closely the local police follow you there; it rises with traces and slips,
//           falls with quiet, established days. At .35 you are shadowed; at .55 your rooms may be searched;
//           at .7 an inspector calls.

import { DAY } from '../data/time.js';
import { rand, hash } from './rng.js';
import { skill, has as trait, tongue } from './hero.js';

const HOUR = 60;
export const SHADOWED = .35, SEARCHED = .55, QUESTIONED = .7;
export const WATCHES = [['morning', 8, 12], ['afternoon', 12, 18], ['evening', 18, 23], ['night', 23, 32]];

/** The watch of the day at a moment, and when it ends. */
export function watchOf(t) {
  const m = ((t % DAY) + DAY) % DAY, h = m / 60;
  const w = WATCHES.find(([, a, b]) => (h >= a && h < b) || (b > 24 && (h >= a || h < b - 24))) ?? WATCHES[3];
  const day0 = Math.floor(t / DAY) * DAY;
  let end = day0 + w[2] * HOUR;
  if (w[0] === 'night' && h < 8) end = day0 + 8 * HOUR;
  if (end <= t) end += DAY;
  return { name: w[0], end };
}

export const legendKey = (city, cover) => `${city}|${cover}`;
export const legendOf = (G, city = G.S.city, cover = G.S.cover) => G.S.legend?.[legendKey(city, cover)] ?? 0;
export function addLegend(G, n, city = G.S.city, cover = G.S.cover) {
  if (!city || !cover) return;
  const S = G.S;
  S.legend ??= {};
  const k = legendKey(city, cover);
  S.legend[k] = Math.max(0, Math.min(1, (S.legend[k] ?? 0) + n));
}
export const watchLevel = (G, city = G.S.city) => G.S.watch?.[city] ?? 0;
export function addWatch(G, n, city = G.S.city) {
  if (!city) return;
  const S = G.S;
  S.watch ??= {};
  const nat = G.I.city.get(city)?.nation;
  let m = n > 0 ? (G.I.ground.includes(nat) ? 1 : ['CH', 'NL', 'DK', 'SE'].includes(nat) && G.W.act(S.t) >= 2 ? .6 : .45) : 1;
  if (n > 0) m *= (1 - .08 * skill(S.hero, 'tradecraft')) * (tongue(S.hero, nat) === 0 ? 1.25 : 1);
  S.watch[city] = Math.max(0, Math.min(1, (S.watch[city] ?? 0) + n * m));
}
export const shadowed = (G) => !!G.S.city && watchLevel(G) >= SHADOWED && (G.S.shookUntil ?? 0) <= G.S.t;
export const stayDays = (G) => (G.S.city && G.S.cityArrived !== undefined ? Math.floor((G.S.t - G.S.cityArrived) / DAY) : 0);

/** How quickly cover work settles a legend here: languages, charm, the virtue of a quick study. */
function legendRate(G) {
  const S = G.S, nat = G.I.city.get(S.city).nation;
  const lang = [.7, 1, 1.2][tongue(S.hero, nat)];
  return .13 * lang * (1 + .08 * skill(S.hero, 'charm')) * (trait(S.hero, 'quick') ? 1.5 : 1);
}

/** What the active cover does for a living, as a line for the log. */
const WORK = {
  hale: ['call on wine shippers and leave samples', 'taste a consignment at a merchant\'s cellar', 'argue freight rates in a shipping office'],
  weiss: ['demonstrate a prism to an instrument maker', 'call on a university workshop', 'take an order for field glasses'],
  marchand: ['file a column at the telegraph office', 'sit in the press gallery', 'lunch with a legation secretary'],
  doyle: ['read in a monastery library', 'visit the sick at a hospital', 'say an early mass for a parish priest'],
  vessey: ['call on a duchess', 'lose a little at the club', 'ride in the park at the fashionable hour'],
  self: ['write letters home', 'walk the city like any tourist', 'buy books you will not read'],
};
export const workLine = (G, i) => { const w = WORK[G.S.cover] ?? WORK.self; return w[i % w.length]; };

/** The activities open now, with what each costs and promises (UI and bots use this). */
export function activities(G) {
  const S = G.S;
  if (!S.city) return [];
  const { name, end } = watchOf(S.t);
  const night = name === 'night';
  return [
    { id: 'work', label: 'Work your legend', sub: `${workLine(G, Math.floor(S.t / DAY))}`, open: !night, end },
    { id: 'cafe', label: 'Sit in a café and listen', sub: 'rumours, some of them true', open: !night, end },
    { id: 'rest', label: night ? 'Sleep' : 'Keep to your rooms', sub: 'nerve; nothing seen, nothing done', open: true, end },
  ];
}

/** Finish an activity begun earlier (called by the sim when its time is up). */
export function completeActivity(G, a) {
  const S = G.S;
  if (!S.city || a.city !== S.city) return;
  if (a.id === 'work') {
    addLegend(G, legendRate(G) * (1 - legendOf(G) * .5));
    addWatch(G, -.04);
    S.workedOn = Math.floor(S.t / DAY);
    const earn = { hale: 1 + skill(S.hero, 'commerce'), weiss: 1 + Math.floor(skill(S.hero, 'commerce') / 2) }[S.cover] ?? 0;
    if (earn) S.money += earn;
  }
  if (a.id === 'rest') S.nerve = Math.min(10, S.nerve + (a.night ? 2 : 1));
}

/** The day's turn, at 06.00: neglect wears a legend thin; quiet established days calm the watch; enemy alerts heat it. */
export function dailyTurn(G) {
  const S = G.S;
  if (!S.city) return;
  const today = Math.floor(S.t / DAY);
  const worked = S.workedOn === today - 1 || S.workedOn === today;
  const L = legendOf(G);
  if (!worked && stayDays(G) >= 1) { addLegend(G, -.05); addWatch(G, .03); }
  const nat = G.I.city.get(S.city).nation;
  const d = S.enemy.dossiers[S.cover];
  if (d?.name && G.I.ground.includes(nat)) addWatch(G, .07); // they have asked the police to find this name
  for (const h of G.D.hunters) { const st = S.enemy.hunters[h.id]; if (G.W.hunterActive(h, S.t) && !st.leg && st.city === S.city) addWatch(G, .05); }
  addWatch(G, -.06 * (1 + L));
}

/** A record left in a city tells its police something too. */
export function noticeRecord(G, r) {
  if (!r.city || r.kind === 'calm' || r.planted) return;
  const heat = (r.heat ?? { bribe: .45, sighting: .2, meeting: .35, photo: .6, wire: .12 }[r.kind] ?? 0) * r.fid;
  if (heat > 0) addWatch(G, heat * .4, r.city);
}

/** Lodgings: an hotel registers you each arrival; a pension's landlady notices; rented rooms need the police. */
export const LODGINGS = {
  hotel: { label: 'An hotel', perNight: 1, fid: .6, watchMul: 1 },
  pension: { label: 'A pension', perNight: .5, fid: .5, watchMul: 1.1 },
  rooms: { label: 'Rented rooms', perNight: .4, fid: .8, watchMul: .8 },
  safehouse: { label: 'The safe house', perNight: 0, fid: 0, watchMul: .5 },
  rough: { label: 'No bed', perNight: 0, fid: 0, watchMul: 1.2 },
};
export const needsRegistration = (G, city = G.S.city) => ['DE', 'AH', 'RU', 'OT'].includes(G.I.city.get(city)?.nation);

/** Consequences of a high watch, rolled once a day: a search of your rooms, or a call from an inspector. */
export function watchEvents(G) {
  const S = G.S;
  if (!S.city || S.queue.length) return null;
  const w = watchLevel(G);
  const u = rand(S);
  if (w >= QUESTIONED && u < .35) return 'inspector';
  if (w >= SEARCHED && u < .3 && S.place !== 'safehouse') return 'search';
  return null;
}
export { hash };
