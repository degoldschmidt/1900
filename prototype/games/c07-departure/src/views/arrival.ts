/**
 * Arrival (RULES.md 9): what the last ride ended in (arrival, missed connection, ghost or refusal),
 * the delay, the news revealed since boarding and lapses; at an ending the UI turns to the autopsy
 * and the questionnaire.
 */
import { cityOfStation } from '../rules/data.ts';
import type { PublicState, ViewData } from './public.ts';
import { clock, stationName, cityName, interruptLabel, type Clock } from './format.ts';
import { newsView, type NewsItem } from './news.ts';

const RIDE_END = ['arrival', 'missed', 'ghost', 'refused'];

export interface ArrivalViewModel {
  kind: string | null; label: string | null; at: Clock | null; station: string | null; stationName: string | null; city: string | null; cityName: string | null;
  delaySec: number | null; made: boolean | null; slackSec: number | null;
  since: Array<{ kind: string; label: string; at: Clock; ref: unknown }>;
  news: NewsItem[]; ended: boolean; ending: string | null;
}

export function arrivalView(p: PublicState, d: ViewData): ArrivalViewModel {
  const b = d.b; const ints = p.diary.interrupts;
  let i = -1;
  for (let k = ints.length - 1; k >= 0; k--) if (RIDE_END.includes(ints[k]!.kind)) { i = k; break; }
  if (i < 0) return { kind: null, label: null, at: null, station: null, stationName: null, city: null, cityName: null, delaySec: null, made: null, slackSec: null, since: [], news: [], ended: p.ending !== null, ending: p.ending?.kind ?? null };
  const it = ints[i]!;
  const ref = (it.ref ?? {}) as { station?: string; delaySec?: number; slackSec?: number };
  const station = ref.station ?? null;
  const city = station ? cityOfStation(b, station) : null;
  let prev = -1;
  for (let k = i - 1; k >= 0; k--) if (RIDE_END.includes(ints[k]!.kind)) { prev = k; break; }
  const since = ints.slice(prev + 1).filter((x, k) => prev + 1 + k !== i).map((x) => ({ kind: x.kind, label: interruptLabel(x.kind), at: clock(b, city ?? b.gameCities[0]!, x.at), ref: x.ref }));
  const news = city ? newsView(p, d, city).items.filter((n) => n.at.t > (prev >= 0 ? ints[prev]!.at : 0)) : [];
  return {
    kind: it.kind, label: interruptLabel(it.kind), at: clock(b, city ?? b.gameCities[0]!, it.at), station, stationName: station ? stationName(b, station) : null,
    city, cityName: city ? cityName(b, city) : null, delaySec: ref.delaySec ?? null, made: it.kind === 'arrival' ? true : it.kind === 'missed' ? false : null,
    slackSec: ref.slackSec ?? null, since, news, ended: p.ending !== null, ending: p.ending?.kind ?? null,
  };
}
