/**
 * GuideShelf (RULES.md 9): owned editions and the one in force today per family, what is on sale
 * here, the trains learned outside the guides, and the log of ghost connections met.
 */
import { dayOf } from '#kit/time/instant.ts';
import { fmtDate } from '#kit/time/format.ts';
import { dv } from '../rules/data.ts';
import { activeEdition } from '../rules/knowledge.ts';
import { guidePrice } from '../rules/verbs.ts';
import { checkCommand } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, money, cityName } from './format.ts';

export interface ShelfViewModel {
  owned: Array<{ edition: string; label: string; family: string; issued: string; validFrom: string; validTo: string | null; inForceToday: boolean; boughtAt: string; boughtIn: string }>;
  onSale: Array<{ edition: string; label: string; price: string; legal: boolean; error: string | null }>;
  learned: Array<{ trainKey: string; trainNo: string; edition: string; source: string; confidence: number; learnedOn: string; runs: boolean }>;
  ghosts: Array<{ at: string; trainKey: string; trainNo: string; edition: string; status: string }>;
}

const trainNo = (d: ViewData, key: string): string => { const i = d.b.tt.tripsByKey.get(key)?.[0]; return i === undefined ? key : d.b.tt.trips[i]!.trainNo; };

export function shelfView(p: PublicState, d: ViewData): ShelfViewModel {
  const b = d.b; const s = asRules(p);
  const today = dayOf(d.now);
  const owned = [...p.knowledge.kg.editions].map((id) => b.edition.get(id)!).filter(Boolean).sort((x, y) => x.issueDay - y.issueDay);
  const shelfAt = (id: string) => p.knowledge.shelf.find((x) => x.edition === id);
  const city = p.me.where.k === 'city' ? p.me.where.city : null;
  const onSale = city === null ? [] : b.raw.editions.filter((ed) => guidePrice({ b, params: d.params, now: d.now }, ed.id, city) && today >= ed.issueDay + dv<number>(b, 'DV-C07-013')).map((ed) => {
    const err = checkCommand(s, b, d.params, d.params, d.now, null, { type: 'planVerb', verb: 'buyGuide', args: { edition: ed.id } });
    return { edition: ed.id, label: ed.label, price: money(b, guidePrice({ b, params: d.params, now: d.now }, ed.id, city)!), legal: err === null, error: err };
  });
  return {
    owned: owned.map((ed) => ({
      edition: ed.id, label: ed.label, family: ed.family, issued: fmtDate(ed.issueDay), validFrom: fmtDate(ed.validFrom), validTo: ed.validTo === null ? null : fmtDate(ed.validTo),
      inForceToday: activeEdition(b, p.knowledge.kg, ed.family, today) === ed.id,
      boughtAt: shelfAt(ed.id) ? clock(b, shelfAt(ed.id)!.city, shelfAt(ed.id)!.at).text : '', boughtIn: shelfAt(ed.id) ? cityName(b, shelfAt(ed.id)!.city) : '',
    })),
    onSale,
    learned: p.knowledge.kg.learned.map((e) => ({ trainKey: e.trainKey, trainNo: trainNo(d, e.trainKey), edition: e.edition, source: e.source, confidence: e.confidence, learnedOn: fmtDate(e.learnedDay), runs: e.confidence > 0 })),
    ghosts: p.stats.ghosts.map((g) => ({ at: fmtDate(dayOf(g.at)), trainKey: g.trainKey, trainNo: trainNo(d, g.trainKey), edition: g.edition, status: g.status })),
  };
}
