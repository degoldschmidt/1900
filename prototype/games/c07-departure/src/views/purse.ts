/**
 * Purse (RULES.md 9): cash, credit, the correspondents' hours, rent, the bill, debts and the public
 * parities, with the account's entries.
 */
import { dayOf } from '#kit/time/instant.ts';
import { money as mk } from '#kit/money/money.ts';
import { localIn } from '../rules/data.ts';
import type { PublicState, ViewData } from './public.ts';
import { clock, money, cityName, instName, citation, weekText, type Clock, type CitationView } from './format.ts';

export interface PurseViewModel {
  cash: string[]; credit: string; remitted: string;
  correspondents: Array<{ bank: string; name: string; city: string; cityName: string; hours: Array<[number, number, number]>; hoursText: string[]; citation: CitationView | null }>;
  rent: { amount: string; nextDue: Clock; arrearsSince: Clock | null } | null;
  bill: { amount: string; bank: string; bankName: string; maturity: Clock; met: boolean; protested: boolean } | null;
  unpaid: string[];
  parities: Array<{ pair: string; text: string; citation: CitationView | null }>;
  entries: Array<{ at: Clock; what: string; amount: string }>;
}

export function purseView(p: PublicState, d: ViewData): PurseViewModel {
  const b = d.b;
  const city = p.me.where.k === 'city' ? p.me.where.city : p.me.cameFrom ?? b.gameCities[0]!;
  const day = dayOf(d.now);
  return {
    cash: p.ledger.cash.map((m) => money(b, m)), credit: money(b, p.ledger.credit), remitted: money(b, p.ledger.remitted),
    correspondents: p.ledger.correspondents.map((id) => {
      const inst = b.inst.get(id)!;
      const row = d.params.row('bank.hours', id, inst.city ? localIn(b, inst.city, d.now).day : day);
      const hours = (row?.value as { days: Array<[number, number, number]> } | undefined)?.days ?? [];
      return { bank: id, name: inst.name, city: inst.city ?? '', cityName: inst.city ? cityName(b, inst.city) : '', hours, hoursText: weekText(hours), citation: citation(b, row?.cite) };
    }),
    rent: p.ledger.rent ? { amount: money(b, p.ledger.rent.amount), nextDue: clock(b, city, p.ledger.rent.nextDue), arrearsSince: p.ledger.rent.arrearsSince === null ? null : clock(b, city, p.ledger.rent.arrearsSince) } : null,
    bill: p.ledger.bill ? { amount: money(b, p.ledger.bill.amount), bank: p.ledger.bill.bank, bankName: instName(b, p.ledger.bill.bank), maturity: clock(b, b.inst.get(p.ledger.bill.bank)?.city ?? city, p.ledger.bill.maturity), met: p.ledger.bill.met, protested: p.ledger.bill.protested } : null,
    unpaid: p.ledger.unpaid.map((m) => money(b, m)),
    parities: d.params.rowsFor('fx.parity').filter((r) => r.from <= day && (r.to === null || day < r.to)).map((r) => {
      const v = r.value as { num: number; den: number };
      const to = r.key.split('>')[1]!;
      // £1 = 960 farthings
      const per = Math.round((960 * v.num) / v.den);
      return { pair: r.key, text: `£1 = ${money(b, mk(to as never, per))}`, citation: citation(b, r.cite) };
    }),
    entries: p.ledger.entries.map((e) => ({ at: clock(b, city, e.at), what: e.what, amount: money(b, e.amount) })),
  };
}
