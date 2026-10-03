/**
 * Newspaper (RULES.md 9): items published in a city that the player has seen (aboard, nothing new
 * until arrival), with citations for calendar rows.
 */
import type { PublicState, ViewData } from './public.ts';
import { clock, cityName, citation, money, type Clock, type CitationView } from './format.ts';

export interface NewsItem { id: string; title: string; at: Clock; kind: string; citation: CitationView | null }

export function newsView(p: PublicState, d: ViewData, city: string): { city: string; cityName: string; items: NewsItem[] } {
  const b = d.b;
  const seen = p.me.where.k === 'aboard' ? p.world.seenUntil : d.now;
  const items = p.world.news.filter((n) => n.city === city && n.at <= seen).map((n) => {
    const ev = b.raw.calendar.find((e) => e.id === n.id);
    if (ev) return { id: n.id, title: ev.title, at: clock(b, city, n.at), kind: ev.kind, citation: citation(b, ev.cite) };
    if (n.id.startsWith('protest:')) {
      const amount = p.ledger.bill ? money(b, p.ledger.bill.amount) : '';
      return { id: n.id, title: `Bill of ${amount} protested for non-payment`, at: clock(b, city, n.at), kind: 'notice', citation: null };
    }
    return { id: n.id, title: n.id, at: clock(b, city, n.at), kind: 'notice', citation: null };
  });
  return { city, cityName: cityName(b, city), items: items.reverse() };
}
