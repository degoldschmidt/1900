/**
 * RULES.md 8 on the invented world: T1 (missed connection without buffer, made with one; delays
 * forced only by overriding the design c07.delay rows), T3 (the bank at closing time), T9 (stops
 * aboard a night train), T12 (UI stamps never change the game), plus the frontier hall and berths.
 */
import { describe, it, expect } from 'vitest';
import { newSim, forceDelays, cmd, until, at, bundle } from './helpers.ts';
import { delayAt, stopOf } from '../src/rules/travel.ts';
import { c07Metrics } from '../src/rules/metrics.ts';

const D = { apr27: 5229, apr28: 5230 };
const FORCED = forceDelays([1200, 1200], [1000]);

describe('T1 missed connection without buffer, made with one', () => {
  it('T1a: slack below the forced delay at the change misses, at odds the planner showed as certain', () => {
    const sim = newSim('preview-changeover', { overrides: FORCED });
    // 31 Aubrevaux 06.20 → Vellois 10.48, then 37 Vellois 11.05: 7 minutes after the 10-minute change.
    cmd(sim, { type: 'book', cls: 3, sleeper: false, legs: [
      { tripId: 'SYN_T_W14_O31', day: D.apr28, from: 'SYN_S_AUBN', to: 'SYN_S_VEL' },
      { tripId: 'SYN_T_W14_O37', day: D.apr28, from: 'SYN_S_VEL', to: 'SYN_S_QUE' },
    ] });
    expect(sim.state.diary.booking!.minSlackSec).toBe(420);
    expect(sim.state.diary.booking!.missOdds).toBe(1000);
    expect(until(sim, ['missed', 'arrival'])).toBe('missed');
    expect(sim.trace.filter((t) => t.kind === 'missed')).toHaveLength(1);
    expect(sim.state.stats.misses).toHaveLength(1);
    expect(sim.state.stats.misses[0]).toMatchObject({ station: 'SYN_S_VEL', slackSec: 420, delaySec: 1200, oddsShown: 1000 });
    expect(sim.state.diary.booking).toBeNull();
    expect(sim.state.me.where).toMatchObject({ k: 'city', city: 'SYN_C_VEL', station: 'SYN_S_VEL' });
    // The ticket stays valid to the end of the next day for the rest of the journey.
    expect(sim.state.diary.tickets[0]).toMatchObject({ fromCity: 'SYN_C_VEL', toCities: ['SYN_C_QUE'], cls: 3 });
  });

  it('T1b: with 68 minutes of slack the change is made; arrival = scheduled + the final stop delay', () => {
    const sim = newSim('preview-changeover', { overrides: FORCED });
    // 31 Aubrevaux 06.20 → Corlaine 08.55, then D 11 Corlaine 10.13 → Tolvenberg 17.43.
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [
      { tripId: 'SYN_T_W14_O31', day: D.apr28, from: 'SYN_S_AUBN', to: 'SYN_S_COR' },
      { tripId: 'SYN_T_W14_D11', day: D.apr28, from: 'SYN_S_COR', to: 'SYN_S_TOLW' },
    ] });
    expect(sim.state.diary.booking!.minSlackSec).toBeGreaterThanOrEqual(2400);
    expect(sim.state.diary.booking!.missOdds).toBe(0);
    expect(until(sim, ['missed', 'arrival'])).toBe('arrival');
    expect(sim.trace.some((t) => t.kind === 'missed')).toBe(false);
    const b = bundle(); const trip = b.tt.trip('SYN_T_W14_D11');
    const z = stopOf(b, trip, 'SYN_S_TOLW')!;
    expect(delayAt(b, sim.params, sim.seed, trip, D.apr28, z)).toBe(1200);
    expect(sim.now).toBe(b.tt.arrAt(z, D.apr28)! + 1200);
    expect(sim.state.me.where).toMatchObject({ k: 'city', city: 'SYN_C_TOL' });
    // The frontier hall at Steinhag wrote a named passport record and an anonymous customs record.
    const kinds = sim.records.all().map((r) => r.kind);
    expect(kinds.filter((k) => k === 'ticket.sale')).toHaveLength(2);
    expect(kinds).toContain('frontier.passport');
    expect(kinds).toContain('frontier.customs');
    expect(sim.records.all().find((r) => r.kind === 'frontier.passport')!.place).toBe('SYN_S_STH');
  });
});

describe('T3 the bank at closing time', () => {
  // Aubrevaux banks: 09.00–12.00 and 14.00–16.00; drawing takes 45 minutes.
  const close = at('SYN_C_AUB', '1914-04-27', '12:00');
  const dur = 2700;

  it('a draw that cannot end by the close is re-flowed to the next opening', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'drawCredit', args: { amount: 960 }, notBefore: close - dur + 60 });
    expect(sim.state.diary.slots[0]!.start).toBe(at('SYN_C_AUB', '1914-04-27', '14:00'));
  });

  it('is rejected when a booked departure leaves before the next opening', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D15', day: D.apr27, from: 'SYN_S_AUBN', to: 'SYN_S_COR' }] });
    const r = sim.command({ type: 'planVerb', verb: 'drawCredit', args: { amount: 960 }, notBefore: close - dur + 60 });
    expect(r.ok).toBe(false);
  });

  it('a draw that ends exactly at the close happens, and writes one bank.draw', () => {
    const sim = newSim('preview-changeover');
    const credit = sim.state.ledger.credit.minor;
    cmd(sim, { type: 'planVerb', verb: 'drawCredit', args: { amount: 960 }, notBefore: close - dur });
    sim.advanceUntil((s) => s.diary.slots[0]?.state === 'done');
    expect(sim.now).toBe(close);
    expect(sim.state.ledger.credit.minor).toBe(credit - 960);
    expect(sim.state.ledger.cash.find((c) => c.cur === 'SYN_CVN')!.minor).toBeGreaterThan(12000);
    expect(sim.records.all().filter((r) => r.kind === 'bank.draw')).toHaveLength(1);
  });

  it('a bank holiday closes the bank all day', () => {
    const sim = newSim('preview-changeover');
    // 30 April is the Corvenian spring holiday: a draw asked for that morning moves to 1 May.
    cmd(sim, { type: 'planVerb', verb: 'drawCredit', args: { amount: 960 }, notBefore: at('SYN_C_AUB', '1914-04-30', '08:00') });
    expect(sim.state.diary.slots[0]!.start).toBe(at('SYN_C_AUB', '1914-05-01', '09:00'));
  });
});

describe('T9 and T12: sessions aboard a night train; UI stamps', () => {
  it('T9: endSession aboard a night train and once in a city gives 500 per mille', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'book', cls: 1, sleeper: true, legs: [{ tripId: 'SYN_T_W14_MERID_E', day: D.apr27, from: 'SYN_S_AUBN', to: 'SYN_S_TOLW' }] });
    expect(sim.records.all().filter((r) => r.kind === 'berth.reservation')).toHaveLength(1);
    sim.advanceUntil((s) => s.me.where.k === 'aboard');
    cmd(sim, { type: 'endSession' });
    expect(until(sim, ['arrival'])).toBe('arrival');
    cmd(sim, { type: 'endSession' });
    const m = c07Metrics(sim.state, sim.bundle, sim.log, sim.trace, {});
    expect(sim.state.stats.sessions.map((x) => [x.aboard, x.night])).toEqual([[true, true], [false, false]]);
    expect(m['H07-4.stopsAboardNight']).toBe(500);
  });

  it('T12: the same play with different ui stamps has the same hash; planMs follows the stamps', () => {
    const run = (ms: number) => {
      const sim = newSim('preview-changeover', { overrides: FORCED });
      cmd(sim, { type: 'book', cls: 2, sleeper: false, ui: { sinceArrivalMs: ms, source: 'planner' }, legs: [
        { tripId: 'SYN_T_W14_O31', day: D.apr28, from: 'SYN_S_AUBN', to: 'SYN_S_COR' },
        { tripId: 'SYN_T_W14_D11', day: D.apr28, from: 'SYN_S_COR', to: 'SYN_S_TOLW' },
      ] });
      until(sim, ['arrival']);
      return { hash: sim.hash(), m: c07Metrics(sim.state, sim.bundle, sim.log, sim.trace, {}) };
    };
    const a = run(40_000); const b = run(95_000);
    expect(a.hash).toBe(b.hash);
    expect(a.m['H07-6.planMs']).toBe(40_000);
    expect(b.m['H07-6.planMs']).toBe(95_000);
    expect(a.m['H07-6.defaultShare']).toBe(0);
  });
});
