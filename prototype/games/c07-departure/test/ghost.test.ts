/**
 * T2 on the invented world: holding the winter guide after the 1 May changeover meets ghost
 * connections (kit ghostCheck statuses), and buying the summer guide avoids them. Plus the guide
 * rules: the edition in force per service day, porters, boards and cables.
 */
import { describe, it, expect } from 'vitest';
import { ghostCheck } from '../../../kit/src/timetable/knowledge.ts';
import { newSim, cmd, until, plan, bundle, at } from './helpers.ts';
import { plannerView, activeEdition } from '../src/rules/knowledge.ts';

const D = { apr28: 5230, may2: 5234, may3: 5235 };

describe('the changeover in the guides', () => {
  it('winter trains on the changeover corridor meet every kind of ghost on summer days', () => {
    const b = bundle(); const tt = b.tt;
    const st = (trip: string, station: string, day: number) => ghostCheck(tt, tt.trip(trip), tt.st(station), day).status;
    expect(st('SYN_T_W14_D11', 'SYN_S_COR', D.apr28)).toBe('ok');
    expect(st('SYN_T_W14_D11', 'SYN_S_COR', D.may2)).toBe('retimed');      // 30 minutes earlier
    expect(st('SYN_T_W14_D15', 'SYN_S_QUE', D.may2)).toBe('retimed');      // 15 minutes later from Quellingen
    expect(st('SYN_T_W14_O51', 'SYN_S_QUE', D.may2)).toBe('withdrawn');
    expect(st('SYN_T_W14_O39', 'SYN_S_VEL', D.may3)).toBe('notThatDay');   // Sundays withdrawn in summer
    expect(st('SYN_T_W14_O37', 'SYN_S_VEL', D.may2)).toBe('ok');
  });

  it('the edition in force follows the service day: winter for April days, summer from 1 May', () => {
    const sim = newSim('preview-changeover');
    const kg = sim.state.knowledge.kg;
    kg.editions.push('SYN_E_S14');
    expect(activeEdition(bundle(), kg, 'SYN_F_PREVIEW', D.apr28)).toBe('SYN_E_W14');
    expect(activeEdition(bundle(), kg, 'SYN_F_PREVIEW', D.may2)).toBe('SYN_E_S14');
  });
});

describe('T2 ghost connection after the changeover, and avoided by the new guide', () => {
  it('T2a: with the winter guide, the D 11 of 2 May (retimed earlier) is gone at the station', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D11', day: D.may2, from: 'SYN_S_AUBN', to: 'SYN_S_TOLW' }] });
    expect(until(sim, ['ghost', 'arrival'], 200)).toBe('ghost');
    const g = sim.trace.find((t) => t.kind === 'ghost')!;
    expect(g.data).toMatchObject({ trainKey: 'SYN_K_D11', status: 'retimed' });
    expect(sim.state.diary.booking).toBeNull();
    expect(sim.state.stats.ghosts).toHaveLength(1);
    expect(sim.state.stats.ghosts[0]).toMatchObject({ trainKey: 'SYN_K_D11', edition: 'SYN_E_W14', status: 'retimed' });
    const learned = sim.state.knowledge.kg.learned.find((e) => e.trainKey === 'SYN_K_D11' && e.edition === 'SYN_E_W14');
    expect(learned).toMatchObject({ confidence: 0, source: 'observed' });
    expect(sim.trace.some((t) => t.kind === 'board')).toBe(false);
  });

  it('T2a: a withdrawn train voids the booking the same way', () => {
    const sim = newSim('preview-changeover');
    // Reach Quellingen first, then book the winter 51 of 3 May, withdrawn in summer.
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_D11', day: D.apr28, from: 'SYN_S_AUBN', to: 'SYN_S_QUE' }] });
    expect(until(sim, ['arrival'])).toBe('arrival');
    cmd(sim, { type: 'book', cls: 2, sleeper: false, legs: [{ tripId: 'SYN_T_W14_O51', day: D.may3, from: 'SYN_S_QUE', to: 'SYN_S_TOLW' }] });
    expect(until(sim, ['ghost', 'arrival'], 300)).toBe('ghost');
    expect(sim.state.stats.ghosts.at(-1)).toMatchObject({ trainKey: 'SYN_K_O51', status: 'withdrawn' });
  });

  it('T2b: after buying the summer guide the ghost trip leaves the planner view and the first itinerary boards', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'buyGuide', args: { edition: 'SYN_E_S14' } });
    sim.advanceUntil((s) => s.knowledge.kg.editions.includes('SYN_E_S14'));
    const view = plannerView(bundle(), sim.params, sim.state);
    expect(view.uses(bundle().tt.trip('SYN_T_W14_D11'), D.may2)).toBe(false);
    expect(view.uses(bundle().tt.trip('SYN_T_S14_D11'), D.may2)).toBe(true);
    expect(view.uses(bundle().tt.trip('SYN_T_W14_D11'), D.apr28)).toBe(true); // April days still read the winter guide
    // Wait to the eve of 2 May, then take the planner's first itinerary to Tolvenberg.
    sim.advanceTo(at('SYN_C_AUB', '1914-05-01', '18:00'));
    const pl = plan(sim, 'SYN_C_TOL');
    const first = pl.options.find((o) => o.legs[0]!.day >= D.may2)!;
    expect(first).toBeDefined();
    expect(first.legs.every((l) => !l.tripId.startsWith('SYN_T_W14_'))).toBe(true);
    const c = first.classes.find((x) => x.legal)!;
    cmd(sim, c.cmd);
    expect(until(sim, ['ghost', 'arrival', 'missed'], 200)).not.toBe('ghost');
    expect(sim.state.stats.ghosts).toHaveLength(0);
    expect(sim.trace.some((t) => t.kind === 'board')).toBe(true);
  });
});

describe('porters, boards and cables learn from the ground', () => {
  it('a porter at Aubrevaux tells the truth of D 11 on 2 May; the planner then knows the summer time', () => {
    const sim = newSim('preview-changeover');
    sim.advanceTo(at('SYN_C_AUB', '1914-05-01', '01:00'));
    cmd(sim, { type: 'planVerb', verb: 'askPorter', args: { trainKeys: ['SYN_K_D11'] } });
    sim.advanceUntil((s) => s.diary.slots.some((x) => x.verb === 'askPorter' && x.state === 'done'));
    const k = sim.state.knowledge.kg.learned.filter((e) => e.trainKey === 'SYN_K_D11');
    expect(k.find((e) => e.edition === 'SYN_E_S14')).toMatchObject({ source: 'porter', confidence: 900 });
    expect(k.find((e) => e.edition === 'SYN_E_W14')).toMatchObject({ confidence: 0 });
  });

  it('the departure board learns the true departures of the next hours', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'checkBoard', args: {}, notBefore: at('SYN_C_AUB', '1914-04-27', '10:00') });
    sim.advanceUntil((s) => s.diary.slots.some((x) => x.verb === 'checkBoard' && x.state === 'done'));
    expect(sim.state.knowledge.kg.learned.some((e) => e.source === 'board' && e.trainKey === 'SYN_K_D15')).toBe(true);
    expect(sim.state.diary.verifiedInStay).toBe(true);
  });

  it('a cable enquiry about a withdrawn train answers that it does not run', () => {
    const sim = newSim('preview-changeover');
    cmd(sim, { type: 'planVerb', verb: 'cable', args: { mode: 'send', purpose: 'enquire', trainKey: 'SYN_K_O51', day: D.may3, words: 12 } });
    expect(until(sim, ['cable'])).toBe('cable');
    expect(sim.trace.find((t) => t.kind === 'cable')!.data).toMatchObject({ trainKey: 'SYN_K_O51', runs: false });
    expect(sim.state.knowledge.kg.learned.find((e) => e.trainKey === 'SYN_K_O51')).toMatchObject({ source: 'cable', confidence: 0 });
    expect(sim.records.all().filter((r) => r.kind === 'cable.copy')).toHaveLength(1);
  });
});
