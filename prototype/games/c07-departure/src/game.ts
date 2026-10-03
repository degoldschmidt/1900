/**
 * C07 The Departure Is the Turn: the game definition and module (RULES.md). The rules are the
 * real C07 rules; until the 1914 data is frozen they run on the invented preview world
 * (Decision P-006).
 */
import type { GameDef, Ctx, Scenario } from '#kit/sim/sim.ts';
import type { GameModule } from '#kit/sim/module.ts';
import { newKnownGraph } from '#kit/timetable/knowledge.ts';
import { money } from '#kit/money/money.ts';
import type { C07State } from './rules/types.ts';
import { type C07Bundle, makeBundle, dv } from './rules/data.ts';
import type { C07Command } from './commands.ts';
import { validate, apply } from './commands.ts';
import { handlers } from './events.ts';
import { initHunt } from './rules/hunt.ts';
import { initWorld } from './rules/world.ts';
import { setupOffer, scheduleNextBatch } from './rules/commissions.ts';
import { normaliseCash, billDueAt, PRIO_LEDGER, hotelAuthority } from './rules/ledger.ts';
import { PRIO_END } from './rules/endings.ts';
import { c07Metrics } from './rules/metrics.ts';
import { buildScenario, SCENARIO_IDS, type Setup } from './scenarios.ts';
import type { C } from './rules/diary.ts';

export const GAME_ID = 'c07-departure';

function init(ctx0: Ctx<undefined, C07Bundle>, b: C07Bundle, scenario: Scenario): C07State {
  const ctx = ctx0 as unknown as C;
  const setup = scenario.setup as Setup;
  const start = scenario.start; const end = scenario.end;
  const kg = newKnownGraph('player', setup.guides);
  const s: C07State = {
    scenario: scenario.id, endsAt: end, endRule: setup.endRule,
    legend: JSON.parse(JSON.stringify(setup.legend)) as C07State['legend'],
    me: { where: { k: 'city', city: setup.place.city, venue: setup.place.venue, station: setup.place.station }, health: dv<number>(b, 'DV-C07-027'), busyUntil: start, lodged: null, cameFrom: null },
    diary: { booking: null, slots: [], nextId: 0, nextBooking: 0, interrupts: [], stayFrom: start, inStay: true, verifiedInStay: false, tickets: [] },
    knowledge: { kg, shelf: setup.guides.map((edition) => ({ edition, at: start, city: setup.place.city })), drafts: 0, delays: [] },
    ledger: {
      cash: normaliseCash(setup.cash), credit: money(setup.credit.cur, setup.credit.minor), correspondents: [...setup.correspondents].sort(), unpaid: [],
      rent: setup.rent ? { amount: setup.rent.amount, nextDue: setup.rent.firstDue, everySec: setup.rent.everySec, arrearsSince: null } : null,
      bill: null, remitted: money(setup.credit.cur, 0), entries: [],
    },
    commissions: { offers: [] },
    world: { fired: [], news: [], queued: [], seenUntil: start },
    hunt: { service: setup.hunter, subject: setup.legend.id, kg: newKnownGraph('hunter', []), belief: null, file: [], lastFix: null, tickSeq: null, cordons: [], nextCordon: 1, delivered: [], fixes: [] },
    stats: { stays: [], bookings: [], misses: [], ghosts: [], sessions: [], detections: [] },
    passages: 0,
    ending: null,
  };
  // The hunting service subscribes before anything is written, so every record reaches it by its lag.
  s.hunt = initHunt(ctx, setup.hunter, setup.legend.id, start, end);
  if (setup.lodged) {
    // Lodged since before the start: the slip was written then (RULES 7, S2).
    const env = { b, params: ctx.params, now: setup.lodged.since };
    const auth = hotelAuthority(s, env, setup.place.city);
    const rec = ctx.emit({ kind: 'registration.slip', subject: setup.legend.id, predicate: 'lodged', value: { city: setup.place.city, tier: setup.lodged.tier, fromCity: null },
      confidence: dv<{ slip: number }>(b, 'DV-C07-028').slip, source: auth, time: setup.lodged.since, authorship: 'world', place: setup.place.city });
    s.me.lodged = { city: setup.place.city, tier: setup.lodged.tier, since: setup.lodged.since, slip: rec.id };
  }
  initWorld(s, ctx, start, end);
  for (const o of setup.offers) {
    setupOffer(s, ctx, { id: o.id, kind: 'chain', pay: o.pay, revealed: true, rival: null, status: 'held', stages: o.stages.map((st) => ({ ...st, done: null })), post: null, arrivedAt: start });
  }
  scheduleNextBatch(s, ctx, setup.place.city);
  if (s.ledger.rent && s.ledger.rent.nextDue <= end) ctx.schedule(s.ledger.rent.nextDue, PRIO_LEDGER.RentDue, 'c07.RentDue', {});
  if (setup.bill) {
    const maturity = billDueAt(b, ctx.params, setup.bill.bank, setup.bill.maturityDay);
    s.ledger.bill = { amount: setup.bill.amount, bank: setup.bill.bank, maturity, met: false, protested: false };
    if (maturity <= end) ctx.schedule(maturity, PRIO_LEDGER.BillMaturity, 'c07.BillMaturity', {});
  }
  ctx.schedule(end, PRIO_END, 'c07.ScenarioEnd', {});
  return s;
}

export const game: GameDef<C07State, C07Command, C07Bundle> = {
  id: GAME_ID,
  paramRows: (b) => b.raw.params,
  init,
  handlers: handlers(),
  validate,
  apply,
};

export const module: GameModule<C07State, C07Command, C07Bundle> = {
  game,
  scenarioIds: SCENARIO_IDS,
  bundleFrom: makeBundle,
  scenario: (b, id, seed) => buildScenario(b, id, seed),
  metrics: (sim, answers) => c07Metrics(sim.state, sim.bundle, sim.log, sim.trace, answers),
};
