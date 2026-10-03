/**
 * T8: the planner's miss odds equal a brute-force count over the public delay CDF, and the shared
 * delay is one draw per train and day. The forecast reads only the public rows and the own trail.
 * T13 / metrics: the hypothesis metrics computed from a replayed save code equal the live game's.
 */
import { describe, it, expect } from 'vitest';
import { Sim } from '../../../kit/src/sim/sim.ts';
import { ParamLayer } from '../../../kit/src/params/layer.ts';
import { belowN } from '../../../kit/src/rng/draw.ts';
import { decodeSave, encodeSave } from '../../../kit/src/sim/savecode.ts';
import { saveCodeOf } from '../../../kit/src/devtools/model.ts';
import { ownTrail } from '../../../kit/src/records/delivery.ts';
import { analyzeSave } from '../../../tools/playtest/analyze.ts';
import { module } from '../src/game.ts';
import { missPermille, itineraryForecast, trailReach, reachOf, type DelayCdf } from '../src/rules/forecast.ts';
import { delayOf } from '../src/rules/travel.ts';
import { c07Metrics } from '../src/rules/metrics.ts';
import { bundle, raw, scenario, cmd, until, forceDelays, randomWalk } from './helpers.ts';
import type { GameBundle } from '../../../kit/src/data/bundle.ts';

const CDFS: DelayCdf[] = ['DV-C07-018', 'DV-C07-019', 'DV-C07-020', 'DV-C07-021'].map((id) => bundle().dv.get(id) as DelayCdf);

function brute(cdf: DelayCdf, s: number, e: number, E: number): number {
  let p = 0;
  for (let i = 0; i < cdf.w.length; i++) {
    const lo = cdf.edges[i]!; const hi = cdf.edges[i + 1]!; const w = cdf.w[i]!;
    if (hi === lo) { if (Math.floor((lo * e) / E) > s) p += w; continue; }
    let n = 0;
    for (let D = lo; D < hi; D++) if (Math.floor((D * e) / E) > s) n++;
    p += Math.floor((w * n) / (hi - lo));
  }
  return p;
}

describe('T8 forecast odds', () => {
  it('equal a brute-force enumeration over the CDF for 200 random slacks', () => {
    for (let i = 0; i < 200; i++) {
      const cdf = CDFS[i % CDFS.length]!;
      const E = 1800 + belowN(40_000, 8, 'E', i);
      const e = 1 + belowN(E, 8, 'e', i);
      const s = belowN(5400, 8, 's', i);
      expect(missPermille(cdf, s, e, E)).toBe(brute(cdf, s, e, E));
    }
    expect(missPermille({ edges: [1200, 1200], w: [1000] }, 420, 100, 100)).toBe(1000);
    expect(missPermille({ edges: [1200, 1200], w: [1000] }, 1200, 100, 100)).toBe(0);
  });

  it('the delay is one draw per train and service day, whichever edition prints it', () => {
    const b = bundle(); const sim = new Sim(module.game, b, scenario('preview-changeover'));
    const w = b.tt.trip('SYN_T_W14_D12'); const s = b.tt.trip('SYN_T_S14_D12');
    for (let day = 5229; day < 5240; day++) expect(delayOf(b, sim.params, sim.seed, w, day)).toBe(delayOf(b, sim.params, sim.seed, s, day));
    const forced = new Sim(module.game, b, scenario('preview-changeover', { overrides: forceDelays([1800, 1800], [1000]) }));
    expect(delayOf(b, forced.params, forced.seed, w, 5230)).toBe(1800);
  });

  it('reads only public rows: hidden rows change nothing the player sees', () => {
    const b = bundle();
    const rows = raw().params;
    const hidden = rows.map((r) => (r.public ? r : { ...r, value: { tampered: true } }));
    hidden.push({ id: 'SYN_X_SECRET', param: 'coop.edge', keyKind: 'pair', key: 'SYN_I_CV_PSO>SYN_I_SECRET', from: 0, to: null, tier: 2, value: { lagSec: [0, 0], retro: true }, dateBasis: 'design', valueBasis: 'design', dv: 'DV-SYN-999', public: false });
    const a = new ParamLayer(rows).publicView(); const z = new ParamLayer(hidden).publicView();
    const sim = new Sim(module.game, b, scenario('preview-changeover'));
    cmd(sim, { type: 'planVerb', verb: 'lodge', args: { tier: 'modest' } });
    until(sim, ['offer', 'news', 'lapsed']);
    const trail = ownTrail(sim.records, [sim.state.legend.id, `anon:${sim.state.legend.id}`]).records;
    expect(trail.length).toBeGreaterThan(0);
    expect(trailReach(b, a, trail)).toEqual(trailReach(b, z, trail));
    expect(reachOf(b, a, 'registration.slip', 'SYN_I_CV_PSO', sim.now).map((r) => r.reader)).toEqual(['SYN_I_AR_POL', 'SYN_I_CV_PSO']);
    const legs = [{ trip: b.tt.trip('SYN_T_W14_O31'), day: 5230, from: 'SYN_S_AUBN', to: 'SYN_S_VEL' }, { trip: b.tt.trip('SYN_T_W14_O37'), day: 5230, from: 'SYN_S_VEL', to: 'SYN_S_QUE' }];
    expect(itineraryForecast(b, a, legs)).toEqual(itineraryForecast(b, z, legs));
  });
});

describe('metrics from a replayed save code', () => {
  it('equal the live game, answers included', () => {
    const sim = new Sim(module.game, bundle(), scenario('preview-changeover', { overrides: [] }));
    randomWalk(sim, 5, 10);
    cmd(sim, { type: 'endSession' });
    const answers = { q1: 'plan', q2: 4, q3: 1, q4: 5, q5: 'fine' };
    const save = decodeSave(saveCodeOf(sim, 'test', raw().meta.dataHash));
    save.answers = answers;
    const back = decodeSave(encodeSave(save));
    const a = analyzeSave(back, module as never, raw() as unknown as GameBundle);
    expect(a.ok).toBe(true);
    expect(a.metrics.hash).toBe(sim.hash());
    const live = c07Metrics(sim.state, sim.bundle, sim.log, sim.trace, answers);
    for (const [k, v] of Object.entries(live)) expect(a.metrics[k], k).toEqual(v);
    expect(a.metrics['H07-2.blame']).toBe('plan');
    expect(a.metrics['H07-5.cordonFeasible']).toBe(true);
  });
});
