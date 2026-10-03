/**
 * The pocket (Decision P-012), a sheet over the map: money, the guides you carry (their printed
 * titles and citations only here), your papers, how you feel, other letters, and "What they could
 * know about you": your own trail in plain sentences, with who could hold each record and from when.
 */
import { dayOf } from '#kit/time/instant.ts';
import { fmtDate } from '#kit/time/format.ts';
import { cityOfPlace } from '../rules/data.ts';
import { activeEdition } from '../rules/knowledge.ts';
import { convertTo } from '../rules/costs.ts';
import { trailReach } from '../rules/forecast.ts';
import { checkCommand, type C07Command } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { clock, money, cityName, instName, stationName, poundsWords, citation, type Clock, type CitationView } from './format.ts';
import { dayTime } from './goal.ts';

export interface PocketViewModel {
  cash: Array<{ amount: string; words: string }>;
  credit: { amount: string; words: string; banks: string[] };
  health: string;
  lodged: string | null;
  papers: string[];
  guides: Array<{ title: string; when: string; inForce: boolean; detail: string; citation: CitationView | null }>;
  letters: Array<{ id: string; text: string; pay: string; status: string; accept: C07Command | null; legal: boolean }>;
  /** "What they could know about you": one sentence per record of yours, newest first. */
  trail: Array<{ at: Clock; place: string; text: string; who: string; named: boolean }>;
}

const SENTENCE: Record<string, string> = {
  'ticket.sale': 'You bought a ticket. The clerk did not ask your name.',
  'registration.slip': 'The hotel wrote your name on a police slip.',
  'frontier.passport': 'Your name went into the frontier register.',
  'frontier.customs': 'Customs looked through your luggage; no name was taken.',
  'bank.draw': 'You cashed a draft in your own name.',
  'bill.met': 'Your bill was met at the bank, in your name.',
  'post.collect': 'You signed for letters at the post office.',
  'meet.witness': 'People at the meeting place saw you with your contact.',
  'cable.copy': 'The telegraph office kept a copy of your telegram.',
  'berth.reservation': 'The sleeping-car company booked a berth in your name.',
  'hotel.complaint': 'The hotel complained to the police that you left without paying.',
  'bill.protest': 'Your bill was protested for non-payment.',
};

function healthWord(h: number): string {
  if (h >= 650) return 'Well rested.';
  if (h >= 400) return 'A little tired.';
  if (h >= 300) return 'Tired.';
  return 'Exhausted: everything takes longer.';
}

const FAMILY: Record<string, string> = { SYN_F_PREVIEW: 'The railway guide', SYN_F_LOCAL: 'The local guide' };

export function pocketView(p: PublicState, d: ViewData): PocketViewModel {
  const b = d.b; const s = asRules(p); const day = dayOf(d.now);
  const gbp = (m: { cur: string; minor: number }): number => (m.cur === 'GBP' ? m.minor : convertTo(m as never, 'GBP' as never, d.params, day).minor);
  const here = p.me.where.k === 'city' ? p.me.where.city : null;
  const reach = trailReach(b, d.params, d.trail.records);
  const trail = d.trail.records.map((r, i) => {
    const city = r.place ? cityOfPlace(b, r.place) : (here ?? b.gameCities[0]!);
    const place = r.place ? (b.station.get(r.place) ? stationName(b, r.place) : cityName(b, r.place)) : cityName(b, city);
    const readers = reach[i]!.reach.filter((x) => b.inst.get(x.reader)?.kind === 'police').sort((x, y) => x.minSec - y.minSec);
    const first = readers[0];
    let who = 'No police office reads it.';
    if (first) {
      const from = r.time + first.minSec;
      who = from <= d.now ? `The ${instName(b, first.reader)} could have it already.` : `The ${instName(b, first.reader)} could have it from ${dayTime(d, city, from, true)}.`;
    }
    return { at: clock(b, city, r.time), place, text: SENTENCE[r.kind] ?? 'A record was made.', who, named: !r.subject.startsWith('anon:') };
  }).filter((x, i) => !d.trail.records[i]!.subject.startsWith('watch:')).reverse();
  const shelf = [...p.knowledge.kg.editions].map((id) => b.edition.get(id)!).filter(Boolean).sort((x, y) => x.issueDay - y.issueDay);
  const guides = shelf.map((ed) => {
    const inForce = activeEdition(b, p.knowledge.kg, ed.family, day) === ed.id;
    const season = ed.validTo !== null ? `until ${fmtDate(ed.validTo, 'greg', false).replace(/ 1914$/, '')}` : `from ${fmtDate(ed.validFrom, 'greg', false).replace(/ 1914$/, '')}`;
    const name = `${FAMILY[ed.family] ?? 'A guide'}, ${ed.validTo !== null ? 'winter' : 'summer'} edition`;
    const first = b.raw.citations.findIndex((c) => c.edition === ed.id);
    return { title: name, when: inForce ? `in force today (${season})` : ed.validFrom > day ? `not yet in force (${season})` : `out of date (${season})`, inForce, detail: ed.label, citation: citation(b, first >= 0 ? first : null) };
  });
  const letters = p.commissions.offers.filter((o) => o.kind !== 'chain' && o.revealed && (o.status === 'open' || o.status === 'held')).map((o) => {
    const stage = o.stages.find((x) => x.done === null) ?? o.stages[o.stages.length - 1]!;
    const accept: C07Command | null = o.status === 'open' ? { type: 'acceptOffer', offerId: o.id } : null;
    return {
      id: o.id, text: `${o.kind === 'errand' ? 'An errand' : 'An offer'}: meet someone in ${cityName(b, stage.city)}, ${dayTime(d, stage.city, stage.open, true)}–${clock(b, stage.city, stage.close).time}`,
      pay: money(b, o.pay), status: o.status === 'held' ? 'accepted' : 'open', accept, legal: accept ? checkCommand(s, b, d.params, d.params, d.now, null, accept) === null : false,
    };
  });
  const lodged = p.me.lodged ? `A ${p.me.lodged.tier} room in ${cityName(b, p.me.lodged.city)} since ${dayTime(d, p.me.lodged.city, p.me.lodged.since, true)}.` : null;
  const papers = [p.legend.papers.passport ? `A passport of ${b.map?.countries.find((c) => `SYN_J_${c.id.slice(4)}` === p.legend.nationality)?.name ?? 'your country'}, in your own name.` : 'No passport.'];
  for (const v of p.legend.papers.visas) papers.push(`A visa for ${v}.`);
  return {
    cash: p.ledger.cash.filter((m) => m.minor > 0).map((m) => ({ amount: money(b, m), words: poundsWords(gbp(m)) })),
    credit: { amount: money(b, p.ledger.credit), words: poundsWords(p.ledger.credit.minor), banks: p.ledger.correspondents.map((id) => { const inst = b.inst.get(id); return inst?.city ? cityName(b, inst.city) : instName(b, id); }) },
    health: healthWord(p.me.health), lodged, papers, guides, letters, trail,
  };
}

