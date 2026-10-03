/**
 * OwnTrail (RULES.md 9): the records the player's own acts have written (a copy passed in, never
 * the store), each with the readers the public rows allow and when they could hold it. Ranges only:
 * no draws, nothing hidden.
 */
import { trailReach, type Reach } from '../rules/forecast.ts';
import type { ViewData, PublicState } from './public.ts';
import { clock, recordLabel, instName, cityName, type Clock } from './format.ts';
import { cityOfPlace } from '../rules/data.ts';

export interface TrailRow {
  rec: number; kind: string; label: string; at: Clock; place: string | null; placeName: string | null; named: boolean; confidence: number;
  source: string; sourceName: string; readers: Array<Reach & { name: string; earliest: Clock; latest: Clock; already: boolean }>;
}

export function trailView(p: PublicState, d: ViewData): TrailRow[] {
  const b = d.b;
  const reach = trailReach(b, d.params, d.trail.records);
  return d.trail.records.map((r, i) => {
    const city = r.place ? cityOfPlace(b, r.place) : (p.me.where.k === 'city' ? p.me.where.city : b.gameCities[0]!);
    return {
      rec: r.id, kind: r.kind, label: recordLabel(r.kind), at: clock(b, city, r.time), place: r.place ?? null, placeName: r.place ? (b.station.get(r.place)?.name ?? cityName(b, r.place)) : null,
      named: !r.subject.startsWith('anon:'), confidence: r.confidence, source: r.source, sourceName: r.source.startsWith('VENUE-') ? 'Witnesses at the meeting place' : instName(b, r.source),
      readers: reach[i]!.reach.map((x) => ({ ...x, name: instName(b, x.reader), earliest: clock(b, city, r.time + x.minSec), latest: clock(b, city, r.time + x.maxSec), already: r.time + x.minSec <= d.now })),
    };
  });
}
