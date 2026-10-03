/**
 * C07 events (RULES.md section 4): type, priority and handler. Lower priority runs first at equal
 * time: arrivals precede departures, the hunter reads after the writing act, an arrest beats a
 * boarding. Events are data; handlers live in the rule modules.
 */
import type { Handler } from '#kit/sim/sim.ts';
import type { C07State } from './rules/types.ts';
import type { C07Bundle } from './rules/data.ts';
import { onAtStation, onBoard, onRideArrive, onFrontierHall } from './rules/travel.ts';
import { onVerbStart, onVerbEnd } from './rules/verbs.ts';
import { onDelivered, onHuntTick, onCordonStart, onCordonEnd, onArrestAttempt } from './rules/hunt.ts';
import { onCableReply, onEditionIssued } from './rules/knowledge.ts';
import { onRemittance, onRentDue, onBillMaturity } from './rules/ledger.ts';
import { onOfferBatch, onOfferLapse, onStageDeadline } from './rules/commissions.ts';
import { onWorld, onNewspaper, onParamChanged } from './rules/world.ts';
import { onScenarioEnd } from './rules/endings.ts';

export const EVENTS: Array<{ type: string; prio: number; handler: Handler<C07State, C07Bundle> }> = [
  { type: 'kit.World', prio: 0, handler: onWorld },
  { type: 'kit.ParamChanged', prio: 1, handler: onParamChanged },
  { type: 'c07.RideArrive', prio: 2, handler: onRideArrive },
  { type: 'c07.FrontierHall', prio: 3, handler: onFrontierHall },
  { type: 'c07.VerbEnd', prio: 4, handler: onVerbEnd },
  { type: 'c07.CordonStart', prio: 5, handler: onCordonStart },
  { type: 'c07.CordonEnd', prio: 5, handler: onCordonEnd },
  { type: 'c07.ArrestAttempt', prio: 6, handler: onArrestAttempt },
  { type: 'c07.AtStation', prio: 7, handler: onAtStation },
  { type: 'c07.Board', prio: 8, handler: onBoard },
  { type: 'c07.VerbStart', prio: 9, handler: onVerbStart },
  { type: 'kit.RecordDelivered', prio: 10, handler: onDelivered },
  { type: 'c07.HuntTick', prio: 11, handler: onHuntTick },
  { type: 'c07.CableReply', prio: 12, handler: onCableReply },
  { type: 'c07.Remittance', prio: 12, handler: onRemittance },
  { type: 'c07.EditionIssued', prio: 13, handler: onEditionIssued },
  { type: 'c07.OfferBatch', prio: 14, handler: onOfferBatch },
  { type: 'c07.Newspaper', prio: 15, handler: onNewspaper },
  { type: 'c07.OfferLapse', prio: 16, handler: onOfferLapse },
  { type: 'c07.StageDeadline', prio: 17, handler: onStageDeadline },
  { type: 'c07.RentDue', prio: 18, handler: onRentDue },
  { type: 'c07.BillMaturity', prio: 19, handler: onBillMaturity },
  { type: 'c07.ScenarioEnd', prio: 99, handler: onScenarioEnd },
];

/** Handlers keyed by type; after an ending every event passes without effect. */
export function handlers(): Record<string, Handler<C07State, C07Bundle>> {
  const out: Record<string, Handler<C07State, C07Bundle>> = {};
  for (const ev of EVENTS) out[ev.type] = (s, p, ctx) => { if (s.ending === null) ev.handler(s, p, ctx); };
  return out;
}
