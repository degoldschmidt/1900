/**
 * The autopsy as a map replay (Decision P-012). Like the autopsy view, it opens the hunt only once
 * the game has ended: your route drawn on the map, numbered points where your records were made
 * (and whether each reached the hunting service), and where its watchers could have stood.
 */
import type { C07State } from '../rules/types.ts';
import { cityOfStation, cityOfPlace } from '../rules/data.ts';
import type { C07Bundle } from '../rules/data.ts';
import type { ViewData } from './public.ts';
import { clock, cityName, instName, stationName, type Clock } from './format.ts';
import { pathOf, segmentLine, cityPoint, stationPoint } from './map.ts';

type Pt = [number, number];

export interface ReplayViewModel {
  ending: { kind: string; word: string; at: Clock; text: string };
  serviceName: string;
  route: Array<{ d: string; mode: 'rail' | 'steamer' }>;
  visited: string[];
  records: Array<{ n: number; x: number; y: number; label: string; place: string; at: Clock; named: boolean; filed: Clock | null }>;
  watchers: Array<{ id: number; x: number; y: number; cityName: string; from: Clock; to: Clock; base: { x: number; y: number; name: string } | null; sighted: boolean; text: string }>;
  summary: string[];
}

const WORD: Record<string, string> = { delivered: 'Delivered', partial: 'Out of time', captured: 'Arrested', ruined: 'Ruined', stranded: 'Stranded' };

const LABEL: Record<string, string> = {
  'ticket.sale': 'ticket bought', 'registration.slip': 'hotel slip in your name', 'frontier.passport': 'frontier register', 'frontier.customs': 'customs check',
  'bank.draw': 'draft cashed', 'bill.met': 'bill met', 'post.collect': 'letters signed for', 'meet.witness': 'seen at the meeting', 'cable.copy': 'telegram copy',
  'berth.reservation': 'berth in your name', 'hotel.complaint': 'hotel complaint', 'bill.protest': 'bill protested',
};

/** The shortest drawn path between two stations over segments of one mode (a single ride). */
function ridePath(b: C07Bundle, from: string, to: string, mode: 'rail' | 'steamer'): Pt[] {
  const segs = b.map!.segments.filter((s) => s.mode === mode);
  const len = (l: Pt[]): number => l.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - l[i - 1]![0], q[1] - l[i - 1]![1]) : 0), 0);
  const dist = new Map<string, number>([[from, 0]]); const prev = new Map<string, string>(); const done = new Set<string>();
  for (;;) {
    let u: string | null = null;
    for (const [k, v] of dist) if (!done.has(k) && (u === null || v < dist.get(u)!)) u = k;
    if (u === null || u === to) break;
    done.add(u);
    for (const s of segs) {
      const v = s.a === u ? s.b : s.b === u ? s.a : null;
      if (!v || done.has(v)) continue;
      const nd = dist.get(u)! + len(s.line);
      if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); prev.set(v, u); }
    }
  }
  if (!dist.has(to)) return [stationPoint(b, from), stationPoint(b, to)];
  const chain = [to];
  while (chain[0] !== from) chain.unshift(prev.get(chain[0]!)!);
  const pts: Pt[] = [];
  for (let i = 0; i + 1 < chain.length; i++) { const l = segmentLine(b, chain[i]!, chain[i + 1]!); pts.push(...(i ? l.slice(1) : l)); }
  return pts;
}

export function replayView(s: C07State, d: ViewData): ReplayViewModel {
  if (s.ending === null) throw new Error('The autopsy opens only after the ending');
  const b = d.b; const h = s.hunt;
  const end = s.me.where.k === 'city' ? s.me.where.city : cityOfStation(b, s.me.where.ride.to);
  const own = d.trail.records.filter((r) => !r.subject.startsWith('watch:'));
  const filed = new Map(h.delivered.map((x) => [x.rec, x.at] as const));
  const route: ReplayViewModel['route'] = [];
  const visited: string[] = [];
  for (const r of own) {
    if (r.kind !== 'ticket.sale') continue;
    const v = (r.value ?? {}) as { mode?: string; from?: string; dir?: string };
    if (!v.from || !v.dir) continue;
    const mode = v.mode === 'rail' ? 'rail' : 'steamer';
    route.push({ d: pathOf(ridePath(b, v.from, v.dir, mode)), mode });
    for (const st of [v.from, v.dir]) { const c = cityOfStation(b, st); if (visited[visited.length - 1] !== c) visited.push(c); }
  }
  const seen = new Map<string, number>();
  const records = own.map((r, i) => {
    const place = r.place ?? end;
    const base = b.station.get(place) ? stationPoint(b, place) : cityPoint(b, cityOfPlace(b, place));
    const k = seen.get(place) ?? 0; seen.set(place, k + 1);
    const ring = [[11, -11], [-11, -11], [11, 11], [-11, 11], [0, -16], [0, 16], [16, 0], [-16, 0], [22, -6]][k % 9]!;
    const city = cityOfPlace(b, place);
    const at = filed.get(r.id);
    return {
      n: i + 1, x: base[0] + ring[0]!, y: base[1] + ring[1]!, label: LABEL[r.kind] ?? r.kind, place: b.station.get(place) ? stationName(b, place) : cityName(b, city),
      at: clock(b, city, r.time), named: !r.subject.startsWith('anon:'), filed: at === undefined ? null : clock(b, city, at),
    };
  });
  const watchers = h.cordons.map((c) => {
    const [x, y] = cityPoint(b, c.city);
    const base = c.via === 'train' && c.base ? { x: cityPoint(b, c.base)[0], y: cityPoint(b, c.base)[1], name: cityName(b, c.base) } : null;
    const from = clock(b, c.city, c.from); const to = clock(b, c.city, c.to);
    return {
      id: c.id, x, y, cityName: cityName(b, c.city), from, to, base, sighted: c.sighted,
      text: `${base ? `Watchers came by train from ${base.name}` : 'The local police watched'} at ${cityName(b, c.city)}, ${from.date.split(' ').slice(0, 3).join(' ')} ${from.time}–${to.time}${c.sighted ? ', and saw you' : ''}.`,
    };
  });
  const nFiled = records.filter((r) => r.filed).length;
  const summary = [
    `You made ${records.length} record${records.length === 1 ? '' : 's'} on the way; ${nFiled === 0 ? 'none' : nFiled} reached the ${instName(b, h.service)}.`,
    watchers.length ? `They placed ${watchers.length} watch${watchers.length === 1 ? '' : 'es'}: ${watchers.map((w) => w.cityName).join(', ')}.` : 'They never had enough to place a watch.',
  ];
  const kind = s.ending.kind;
  const text = kind === 'delivered' ? 'Every meeting kept.' : kind === 'captured' ? 'The police were waiting.' : kind === 'stranded' ? 'The timetable left you short of your contact.' : 'Time ran out.';
  return { ending: { kind, word: WORD[kind] ?? kind, at: clock(b, end, s.ending.at), text }, serviceName: instName(b, h.service), route, visited, records, watchers, summary };
}
