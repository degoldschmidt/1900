/**
 * Commissions (RULES.md 9): held, revealed and lapsed offers (with the rival's outcome once known),
 * each stage's window against the earliest arrival on the player's own known view.
 */
import { connections } from '#kit/timetable/expand.ts';
import { earliestArrival } from '#kit/timetable/csa.ts';
import { stationsOfCity, dv } from '../rules/data.ts';
import { plannerView } from '../rules/knowledge.ts';
import { checkCommand } from '../commands.ts';
import { type PublicState, type ViewData, asRules } from './public.ts';
import { plannerStart } from './planner.ts';
import { clock, money, cityName, type Clock } from './format.ts';

export interface StageView { index: number; city: string; cityName: string; open: Clock; close: Clock; done: Clock | null; earliestArrival: Clock | null; reachable: boolean }
export interface OfferView {
  id: string; kind: string; status: string; pay: string; revealed: boolean; rival: boolean | null; postCity: string | null;
  stages: StageView[]; accept: { legal: boolean; error: string | null } | null;
}
export interface CommissionsViewModel { held: OfferView[]; open: OfferView[]; closed: OfferView[]; unread: number }

export function commissionsView(p: PublicState, d: ViewData): CommissionsViewModel {
  const b = d.b; const tt = b.tt; const s = asRules(p);
  const start = plannerStart(p, d);
  const view = plannerView(b, d.params, p);
  const c = connections(tt, view, start.t, start.t + dv<{ awayEa: number }>(b, 'DV-C07-070').awayEa);
  const ea = earliestArrival(tt, c, start.stations.map((x) => ({ station: tt.st(x), t: start.t })));
  const here = p.me.where.k === 'city' ? p.me.where.city : null;
  const arriveAt = (city: string): number => (city === here ? d.now : Math.min(...stationsOfCity(b, city).map((x) => ea.arr[tt.st(x)]!)));
  const toView = (o: PublicState['commissions']['offers'][number]): OfferView => {
    const err = o.status === 'open' && o.revealed ? checkCommand(s, b, d.params, d.params, d.now, null, { type: 'acceptOffer', offerId: o.id }) : null;
    return {
      id: o.id, kind: o.kind, status: o.status, pay: money(b, o.pay), revealed: o.revealed, rival: o.status === 'lapsed' ? o.rival : null, postCity: o.post,
      stages: o.stages.map((st, index) => {
        const a = arriveAt(st.city);
        return {
          index, city: st.city, cityName: cityName(b, st.city), open: clock(b, st.city, st.open), close: clock(b, st.city, st.close),
          done: st.done === null ? null : clock(b, st.city, st.done), earliestArrival: Number.isFinite(a) ? clock(b, st.city, a) : null, reachable: Number.isFinite(a) && a < st.close,
        };
      }),
      accept: o.status === 'open' && o.revealed ? { legal: err === null, error: err } : null,
    };
  };
  const visible = p.commissions.offers.filter((o) => o.revealed);
  return {
    held: visible.filter((o) => o.status === 'held').map(toView),
    open: visible.filter((o) => o.status === 'open').map(toView),
    closed: visible.filter((o) => o.status === 'done' || o.status === 'lapsed' || o.status === 'failed').map(toView),
    unread: 0,
  };
}
