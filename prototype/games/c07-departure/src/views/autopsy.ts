/**
 * The autopsy and the questionnaire (RULES.md 5.11 and 9). The only view that reads the hunt, and
 * only once the game has ended (T10): the service's file with arrival times, its fixes, every
 * cordon (how it was placed: local office or watchers by train, from where, from when) and the
 * detections, so the player can trace each cordon back to records of their own trail.
 */
import type { C07State } from '../rules/types.ts';
import { questionsFor } from '../rules/endings.ts';
import type { ViewData, PublicState } from './public.ts';
import { clock, recordLabel, instName, cityName, type Clock } from './format.ts';

export interface AutopsyViewModel {
  ending: { kind: string; at: Clock; event: string; causes: Array<{ rec: number; label: string }>; cordon: number | null };
  service: string; serviceName: string;
  file: Array<{ rec: number; kind: string; label: string; written: Clock | null; arrived: Clock; ownTrail: boolean }>;
  fixes: Array<{ rec: number; city: string; cityName: string; recordTime: Clock; at: Clock }>;
  cordons: Array<{ id: number; city: string; cityName: string; from: Clock; to: Clock; via: string; base: string | null; baseName: string | null; trainKey: string | null; causes: number[]; sighted: boolean }>;
  detections: Array<{ at: Clock; cordon: number; noticed: boolean }>;
}

export function autopsyView(s: C07State, d: ViewData): AutopsyViewModel {
  if (s.ending === null) throw new Error('The autopsy opens only after the ending');
  const b = d.b; const h = s.hunt;
  const own = new Map(d.trail.records.map((r) => [r.id, r] as const));
  const city = s.me.where.k === 'city' ? s.me.where.city : b.gameCities[0]!;
  const label = (rec: number): string => { const r = own.get(rec); return r ? recordLabel(r.kind) : rec === h.lastFix?.rec ? 'Sighting by watchers' : `Record ${rec}`; };
  return {
    ending: { kind: s.ending.kind, at: clock(b, city, s.ending.at), event: s.ending.cause.event, causes: s.ending.cause.recs.map((rec) => ({ rec, label: label(rec) })), cordon: s.ending.cause.cordon },
    service: h.service, serviceName: instName(b, h.service),
    file: h.delivered.map((x) => { const r = own.get(x.rec); return { rec: x.rec, kind: r?.kind ?? 'unknown', label: label(x.rec), written: r ? clock(b, city, r.time) : null, arrived: clock(b, city, x.at), ownTrail: !!r }; }),
    fixes: h.fixes.map((f) => ({ rec: f.rec, city: f.city, cityName: cityName(b, f.city), recordTime: clock(b, f.city, f.t), at: clock(b, f.city, f.at) })),
    cordons: h.cordons.map((c) => ({ id: c.id, city: c.city, cityName: cityName(b, c.city), from: clock(b, c.city, c.from), to: clock(b, c.city, c.to), via: c.via, base: c.base, baseName: c.base ? cityName(b, c.base) : null, trainKey: c.trainKey, causes: c.cause, sighted: c.sighted })),
    detections: s.stats.detections.map((x) => ({ at: clock(b, city, x.at), cordon: x.cordon, noticed: x.noticed })),
  };
}

export interface QuestionView { id: string; kind: 'choice' | 'likert' | 'record' | 'text'; prompt: string; options: Array<{ value: string | number; label: string }> }

/** The end-of-scenario questionnaire; q3 offers the records of the player's own trail. */
export function questionnaireView(p: PublicState, d: ViewData): QuestionView[] {
  if (p.ending === null) return [];
  return questionsFor(p).map((q) => ({
    id: q.id, kind: q.kind, prompt: q.prompt,
    options: q.kind === 'choice' ? (q.options ?? []).map((o) => ({ value: o, label: o }))
      : q.kind === 'likert' ? [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))
        : q.kind === 'record' ? d.trail.records.filter((r) => !r.subject.startsWith('watch:')).map((r) => ({ value: r.id, label: `${recordLabel(r.kind)} (${r.id})` }))
          : [],
  }));
}
