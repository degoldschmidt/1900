/**
 * Commissions, the ledger and the paths the 1914 data will use (suspensions, papers) exercised on
 * the invented world through test overrides only — no invented history enters the bundle.
 */
import { describe, it, expect } from 'vitest';
import type { ParamRow } from '../../../kit/src/params/types.ts';
import { newSim, cmd, until, at, raw } from './helpers.ts';
import { eaTruth, nextHeldStage } from '../src/rules/commissions.ts';

const design = (id: string, param: string, keyKind: ParamRow['keyKind'], key: string, from: number, value: unknown): ParamRow =>
  ({ id, param, keyKind, key, from, to: null, tier: 0, value, dateBasis: 'design', valueBasis: 'design', dv: 'DV-SYN-900', public: true });

describe('commissions', () => {
  it('errands arrive by poste restante, are revealed by collecting, can be held, and lapse with a rival draw', () => {
    const sim = newSim('preview-changeover', { seed: 4 });
    sim.advanceTo(at('SYN_C_AUB', '1914-04-28', '08:30'));
    const waiting = sim.state.commissions.offers.filter((o) => o.kind !== 'chain');
    expect(waiting.length).toBeGreaterThan(0);
    expect(waiting.every((o) => !o.revealed && o.post === 'SYN_C_AUB')).toBe(true);
    cmd(sim, { type: 'planVerb', verb: 'posteRestante', args: {} });
    expect(until(sim, ['offer'])).toBe('offer');
    const revealed = sim.state.commissions.offers.filter((o) => o.revealed && o.kind !== 'chain');
    expect(revealed.length).toBe(waiting.length);
    // The chain is one held offer; one more may be held (DV-C07-044 = 2).
    const errand = revealed.find((o) => o.kind === 'errand' && o.stages[0]!.close > sim.now);
    if (errand) {
      cmd(sim, { type: 'acceptOffer', offerId: errand.id });
      expect(sim.state.commissions.offers.find((o) => o.id === errand.id)!.status).toBe('held');
      const other = revealed.find((o) => o.id !== errand.id && o.status === 'open');
      if (other) expect(sim.command({ type: 'acceptOffer', offerId: other.id }).ok).toBe(false);
    }
    sim.advanceTo(at('SYN_C_AUB', '1914-04-29', '08:00'));
    for (const o of sim.state.commissions.offers.filter((x) => x.status === 'lapsed')) expect(typeof o.rival).toBe('boolean');
  });

  it('an away offer is kept only if it excludes the next held stage by travel time', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const sim = newSim('preview-changeover', { seed });
      sim.advanceTo(at('SYN_C_AUB', '1914-04-30', '09:00'));
      for (const o of sim.state.commissions.offers.filter((x) => x.kind === 'away')) {
        const st = o.stages[0]!;
        expect(st.close - st.open).toBe(21600);
        const held = nextHeldStage(sim.state);
        if (held) {
          const h = held.offer.stages[held.index]!;
          expect(eaTruth(sim.bundle, st.city, st.open + 3600, h.city)).toBeGreaterThan(h.close);
        }
      }
    }
  });
});

describe('the ledger', () => {
  it('rent falls on the credit; the unmet bill is protested and ruins the legend', () => {
    const sim = newSim('preview-changeover');
    const credit = sim.state.ledger.credit.minor;
    sim.advanceTo(at('SYN_C_AUB', '1914-05-01', '10:00'));
    expect(sim.state.ledger.credit.minor).toBe(credit - 7680);
    while (!sim.state.ending && sim.step());
    expect(sim.state.ending).toMatchObject({ kind: 'ruined', cause: { event: 'bill.protest' } });
    expect(sim.records.all().some((r) => r.kind === 'bill.protest')).toBe(true);
    expect(sim.state.world.news.some((n) => n.id.startsWith('protest:'))).toBe(true);
  });

  it('a telegram home meets the bill by remittance', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'cable', args: { mode: 'send', purpose: 'remit', words: 14 } });
    expect(until(sim, ['remittance'])).toBe('remittance');
    expect(sim.state.ledger.bill!.met).toBe(true);
    expect(sim.state.ledger.remitted.minor).toBe(24000);
    while (!sim.state.ending && sim.step());
    expect(sim.state.ending!.kind).not.toBe('ruined');
  });

  it('lodging is charged at check-out per local night; without the cash it is owed and the hotel complains', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'lodge', args: { tier: 'first' } });
    sim.advanceTo(at('SYN_C_AUB', '1914-04-29', '09:00'));
    sim.state.ledger.cash = [{ cur: 'SYN_CVN', minor: 500 }];
    cmd(sim, { type: 'book', cls: 3, sleeper: false, legs: [{ tripId: 'SYN_T_W14_O35', day: 5231, from: 'SYN_S_AUBN', to: 'SYN_S_COR' }] });
    expect(until(sim, ['cannotPay', 'arrival'])).toBe('cannotPay');
    expect(sim.state.ledger.unpaid).toHaveLength(1);
    expect(sim.records.all().find((r) => r.kind === 'hotel.complaint')).toMatchObject({ subject: 'SYN_L_AGENT', source: 'SYN_I_CV_PSO' });
  });
});

describe('paths the 1914 data will use, driven by test overrides', () => {
  it('a suspension of a train in force meets the booking as a ghost "suspended"', () => {
    const rows = [design('SYN_T_SUSP', 'service.suspension', 'global', 'SYN_K_D15', 5229, { scope: 'trainKeys', ids: ['SYN_K_D15'] })];
    const sim = newSim('preview-changeover', { overrides: rows });
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D15', day: 5229, from: 'SYN_S_AUBN', to: 'SYN_S_COR' }] });
    expect(until(sim, ['ghost', 'arrival'])).toBe('ghost');
    expect(sim.state.stats.ghosts[0]!.status).toBe('suspended');
  });

  it('papers the legend lacks end the ride at the frontier hall (refused)', () => {
    const papers = raw().params.find((r) => r.param === 'frontier.papers' && r.key === 'SYN_S_VEL>SYN_S_STH')!;
    const rows = [{ ...papers, value: { ...(papers.value as object), visa: 'SYN_VISA_AR' } }];
    const sim = newSim('preview-changeover', { overrides: rows });
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D15', day: 5229, from: 'SYN_S_AUBN', to: 'SYN_S_QUE' }] });
    expect(until(sim, ['refused', 'arrival'])).toBe('refused');
    expect(sim.state.me.where).toMatchObject({ k: 'city', city: 'SYN_C_STH', station: 'SYN_S_STH' });
    expect(sim.state.diary.booking).toBeNull();
  });

  it('health spent to nothing collapses the legend into a day of rest', () => {
    const sim = newSim('preview-changeover');
    sim.state.me.health = 5;
    cmd(sim, { type: 'book', cls: 3, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D15', day: 5229, from: 'SYN_S_AUBN', to: 'SYN_S_TOLW' }] });
    expect(until(sim, ['collapse'])).toBe('collapse');
    expect(sim.state.me.health).toBe(0);
    expect(sim.state.diary.slots.some((x) => x.verb === 'rest' && Number(x.args.sec) === 86400)).toBe(true);
  });
});
