/**
 * The hunt on the invented world: T4 (a registration slip reaches the service at exactly its kit
 * `arrival`, eager equal to lazy), T6 (an escape by a connection the service does not know; a
 * cordon after a known train placed at the watchers' physical arrival), T11 (every cordon feasible
 * over random walks) and the causes of every cordon ending in the player's own trail.
 */
import { describe, it, expect } from 'vitest';
import { Sim, type Scenario } from '../../../kit/src/sim/sim.ts';
import { arrival, delivered } from '../../../kit/src/records/delivery.ts';
import { connections } from '../../../kit/src/timetable/expand.ts';
import { earliestArrival, journey } from '../../../kit/src/timetable/csa.ts';
import type { ParamRow } from '../../../kit/src/params/types.ts';
import { module } from '../src/game.ts';
import { bundle, raw, scenario, cmd, until, at, randomWalk } from './helpers.ts';
import { hunterView } from '../src/rules/knowledge.ts';
import { delayAt } from '../src/rules/travel.ts';
import { policeOpen, localOffice } from '../src/rules/hunt.ts';
import { stationsOfCity, dv } from '../src/rules/data.ts';
import type { Setup } from '../src/scenarios.ts';
import type { C07Sim } from '../src/session.ts';

const SERVICE = 'SYN_I_AR_POL';

/** The changeover scenario, starting somewhere else and lodged since the evening before. */
function lodgedAt(city: string, station: string, start: string, since: string, overrides: ParamRow[] = [], seed?: number): Scenario {
  const base = scenario('preview-changeover', seed === undefined ? {} : { seed });
  const setup = base.setup as Setup;
  const [d, t] = start.split(' ') as [string, string];
  const [sd, st] = since.split(' ') as [string, string];
  return {
    ...base, start: at(city, d, t), paramOverrides: overrides,
    setup: { ...setup, place: { city, station, venue: 'station' }, lodged: { tier: 'modest', since: at(city, sd, st) }, offers: [] },
  };
}

const coopFast = (from: string): ParamRow[] => raw().params.filter((r) => r.param === 'coop.edge' && r.key === `${from}>${SERVICE}`).map((r) => ({ ...r, value: { ...(r.value as object), lagSec: [0, 0] } }));

describe('T4 registration lag: eager delivery equals lazy arrival', () => {
  it('a Corvenian hotel slip reaches the Ardesian service by the cooperation edge, exactly at arrival()', () => {
    const sim = new Sim(module.game, bundle(), scenario('preview-changeover'));
    cmd(sim, { type: 'planVerb', verb: 'lodge', args: { tier: 'modest' } });
    sim.advanceUntil((s) => s.hunt.fixes.length > 0);
    const slip = sim.records.all().find((r) => r.kind === 'registration.slip')!;
    expect(slip.source).toBe('SYN_I_CV_PSO');
    const A = arrival(slip, SERVICE, sim.params, sim.seed);
    expect(sim.state.hunt.delivered).toContainEqual({ rec: slip.id, at: A });
    expect(delivered(sim.records, SERVICE, A - 1, sim.params, sim.seed).map((r) => r.id)).not.toContain(slip.id);
    expect(delivered(sim.records, SERVICE, A, sim.params, sim.seed).map((r) => r.id)).toContain(slip.id);
    const fix = sim.trace.find((t) => t.kind === 'hunt.fix')!;
    expect(fix.at).toBe(A);
    expect(fix.data).toMatchObject({ rec: slip.id, city: 'SYN_C_AUB' });
    // Within the source lag plus the edge lag.
    expect(A - slip.time).toBeGreaterThanOrEqual(7200 + 43200);
    expect(A - slip.time).toBeLessThanOrEqual(86400 + 129600);
  });
});

describe('T6 escape by a connection the service does not know', () => {
  it('T6a: fixed in Ebbenhall, gone by the light railway before the cordon: nothing follows to Quellingen', () => {
    const sc = lodgedAt('SYN_C_EBB', 'SYN_S_EBB', '1914-04-28 05:00', '1914-04-27 22:00', coopFast('SYN_I_EBB_PD'));
    const sim: C07Sim = new Sim(module.game, bundle(), sc);
    cmd(sim, { type: 'book', cls: 3, sleeper: false, legs: [{ tripId: 'SYN_T_W14_L82', day: 5230, from: 'SYN_S_EBB', to: 'SYN_S_QUE' }] });
    expect(until(sim, ['arrival'])).toBe('arrival');
    sim.advanceTo(at('SYN_C_QUE', '1914-04-30', '12:00'));
    const fix = sim.trace.find((t) => t.kind === 'hunt.fix');
    expect(fix?.data).toMatchObject({ city: 'SYN_C_EBB' });
    const boarded = sim.trace.find((t) => t.kind === 'board')!.at;
    const cordons = sim.trace.filter((t) => t.kind === 'hunt.cordon').map((t) => t.data as { city: string; from: number });
    expect(cordons.every((c) => c.city === 'SYN_C_EBB' && c.from > boarded)).toBe(true);
    expect(sim.state.stats.detections).toEqual([]);
    const ticks = sim.trace.filter((t) => t.kind === 'hunt.tick').map((t) => t.data as { masses: Record<string, number> });
    expect(ticks.length).toBeGreaterThan(5);
    for (const t of ticks) expect(t.masses.SYN_C_QUE).toBe(0);
    expect(sim.state.ending).toBeNull();
  });

  it('T6b and T11: over random walks every cordon starts at the earliest physical arrival', () => {
    const b = bundle(); const tt = b.tt;
    let trainCordons = 0; let localCordons = 0; let detections = 0;
    const starts: Array<[string, string]> = [['SYN_C_QUE', 'SYN_S_QUE'], ['SYN_C_TOL', 'SYN_S_TOLW'], ['SYN_C_EBB', 'SYN_S_EBB'], ['SYN_C_COR', 'SYN_S_COR']];
    for (let seed = 1; seed <= 24; seed++) {
      const [city, station] = starts[seed % starts.length]!;
      const office = localOffice(b, sim0Params(), SERVICE, city);
      const sc = lodgedAt(city, station, '1914-04-28 05:00', '1914-04-27 21:00', office ? coopFast(office) : [], seed);
      const sim: C07Sim = new Sim(module.game, b, sc);
      randomWalk(sim, seed);
      const kg = sim.state.hunt.kg;
      for (const t of sim.trace.filter((x) => x.kind === 'hunt.cordon')) {
        const c = t.data as { city: string; from: number; local: number | null; train: number | null; via: string; trips: Array<{ trip: string; day: number }>; decidedAt: number };
        expect(c.from).toBe(Math.min(c.local ?? Infinity, c.train ?? Infinity));
        // Recompute both from scratch at the decision time.
        const off = localOffice(b, sim.params, SERVICE, c.city);
        const local = off ? policeOpen(b, sim.params, off, c.decidedAt + dv<number>(b, 'DV-C07-037')) : null;
        expect(c.local).toBe(local);
        const train = watchers(sim, kg, c.city, c.decidedAt);
        expect(c.train).toBe(train);
        if (c.via === 'train') {
          trainCordons++;
          for (const r of c.trips) {
            const i = tt.trip(r.trip);
            expect(tt.truthRuns(i, r.day)).toBe(true);
            expect(['SYN_O_ARR', 'SYN_O_MSC']).toContain(tt.trips[i]!.operator);
          }
        } else localCordons++;
      }
      // Every cordon's causes end in records of the player's own trail.
      const legend = sim.state.legend.id;
      for (const c of sim.state.hunt.cordons) {
        const own = c.cause.filter((id) => { const r = sim.records.get(id)!; return r.subject === legend || r.subject === `anon:${legend}`; });
        expect(own.length).toBeGreaterThan(0);
      }
      detections += sim.state.stats.detections.length;
    }
    expect(trainCordons).toBeGreaterThan(0);
    expect(localCordons).toBeGreaterThan(0);
    void detections;
  });
});

let paramsCache: C07Sim['params'] | null = null;
function sim0Params(): C07Sim['params'] { return paramsCache ??= new Sim(module.game, bundle(), scenario('preview-changeover')).params; }

/** Watcher arrival recomputed independently: hunter-view earliest journey from the bases, the last train's delay, posting. */
function watchers(sim: C07Sim, kg: C07Sim['state']['hunt']['kg'], city: string, now: number): number | null {
  const b = sim.bundle; const tt = b.tt;
  const bases = sim.params.get<{ cities: string[] }>('hunt.bases', SERVICE, Math.floor(now / 86400))!.cities;
  const post = dv<{ post: number }>(b, 'DV-C07-040').post;
  let best = Infinity;
  for (const base of bases) {
    const t0 = now + dv<number>(b, 'DV-C07-039');
    if (base === city) { best = Math.min(best, t0 + post); continue; }
    const c = connections(tt, hunterView(b, sim.params, kg), t0, now + dv<number>(b, 'DV-C07-041'));
    const res = earliestArrival(tt, c, stationsOfCity(b, base).map((s) => ({ station: tt.st(s), t: t0 })));
    for (const s of stationsOfCity(b, city)) {
      const legs = journey(tt, c, res, tt.st(s));
      const rides = legs?.filter((l) => l.kind === 'ride') ?? [];
      const last = rides.at(-1);
      if (!legs || !last || last.kind !== 'ride') continue;
      let t = last.arr + delayAt(b, sim.params, sim.seed, last.trip, last.day, last.toStop);
      for (const l of legs.slice(legs.indexOf(last) + 1)) t += l.arr - l.dep;
      best = Math.min(best, t + post);
    }
  }
  return Number.isFinite(best) ? best : null;
}

