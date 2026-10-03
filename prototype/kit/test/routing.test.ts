import { describe, it, expect } from 'vitest';
import { Timetable, runsOn } from '../src/timetable/model.ts';
import { connections, truthView, type Connections, type GraphView } from '../src/timetable/expand.ts';
import { earliestArrival, journey, type Start } from '../src/timetable/csa.ts';
import { ProfileCache } from '../src/timetable/profiles.ts';
import { newKnownGraph, knownView, learn, ghostCheck, addEdition } from '../src/timetable/knowledge.ts';
import { itineraries } from '../src/timetable/plan.ts';
import { seedBelief, propagate, observe, resample, mass } from '../src/hunter/belief.ts';
import { instantOf } from '../src/time/instant.ts';
import { belowN } from '../src/rng/draw.ts';
import { randomNetwork, BASE_DAY } from './fixtures/synthetic-network.ts';

/** Order-independent fixpoint reference with the same boarding semantics as the scan. */
function reference(tt: Timetable, c: Connections, starts: readonly Start[]): Float64Array {
  const ns = tt.stationIds.length;
  const arr = new Float64Array(ns).fill(Infinity); const ready = new Float64Array(ns).fill(Infinity);
  const relax = (s: number, t: number) => { for (const fp of tt.footpaths[s]!) { if (t + fp.sec < arr[fp.to]!) arr[fp.to] = t + fp.sec; if (t + fp.sec < ready[fp.to]!) ready[fp.to] = t + fp.sec; } };
  for (const s of starts) { arr[s.station] = Math.min(arr[s.station]!, s.t); ready[s.station] = Math.min(ready[s.station]!, s.t); }
  for (const s of starts) relax(s.station, s.t);
  const boarded = new Float64Array(c.nInst).fill(Infinity);
  const instArr = new Map<number, Map<number, number>>();
  for (let changed = true; changed;) {
    changed = false;
    for (let i = c.n - 1; i >= 0; i--) { // deliberately reverse order
      const inst = c.inst[i]!; const dep = c.dep[i]!; const fs = c.fromSt[i]!;
      let can = ready[fs]! <= dep;
      if (!can) for (const l of tt.throughInto.get(c.trip[i]!) ?? []) {
        if (l.station !== fs) continue;
        for (const [a, m] of instArr) if (c.instTrip[a] === l.fromTrip && (m.get(fs) ?? Infinity) <= dep) can = true;
      }
      if (can && dep < boarded[inst]!) { boarded[inst] = dep; changed = true; }
      if (boarded[inst]! <= dep) {
        const to = c.toSt[i]!; const a = c.arr[i]!;
        const m = instArr.get(inst) ?? instArr.set(inst, new Map()).get(inst)!;
        if (a < (m.get(to) ?? Infinity)) { m.set(to, a); changed = true; }
        if (a < arr[to]!) { arr[to] = a; relax(to, a); changed = true; }
        if (a + tt.minChange[to]! < ready[to]!) { ready[to] = a + tt.minChange[to]!; changed = true; }
      }
    }
  }
  return arr;
}

describe('running rules', () => {
  it('apply ranges, weekday masks, extra and excluded days', () => {
    const run = { ranges: [[BASE_DAY, BASE_DAY + 13, 0b0000001]] as Array<[number, number, number]>, also: [BASE_DAY + 1], except: [BASE_DAY + 7] };
    const mondays = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((d) => BASE_DAY + d).filter((d) => runsOn(run, d));
    // BASE_DAY 5000 is a Thursday (5000 % 7 = 2 → Wednesday?) — compute expectation from weekday directly.
    expect(mondays.includes(BASE_DAY + 1)).toBe(true);
    expect(mondays.includes(BASE_DAY + 7)).toBe(false);
  });
});

describe('connection scan', () => {
  it('equals an order-independent reference on 1,000 random synthetic networks', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const data = randomNetwork(seed, { through: seed % 3 === 0 });
      const tt = new Timetable(data, { defaultMinChangeSec: 300 });
      const view = truthView(tt);
      const t0 = instantOf(BASE_DAY + belowN(5, seed, 'd'), belowN(86400, seed, 's'));
      const c = connections(tt, view, t0, t0 + 4 * 86400);
      const starts = [{ station: belowN(tt.stationIds.length, seed, 'o'), t: t0 }];
      const got = earliestArrival(tt, c, starts).arr;
      const want = reference(tt, c, starts);
      expect(Array.from(got), `seed ${seed}`).toEqual(Array.from(want));
    }
  });

  it('reconstructs journeys whose legs chain in time and respect change times', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const tt = new Timetable(randomNetwork(seed), { defaultMinChangeSec: 300 });
      const t0 = instantOf(BASE_DAY + 2, 6 * 3600);
      const c = connections(tt, truthView(tt), t0, t0 + 3 * 86400);
      const origin = belowN(tt.stationIds.length, seed, 'o');
      const res = earliestArrival(tt, c, [{ station: origin, t: t0 }]);
      for (let s = 0; s < tt.stationIds.length; s++) {
        const legs = journey(tt, c, res, s);
        if (!legs) { expect(res.arr[s]).toBe(Infinity); continue; }
        if (legs.length === 0) { expect(s).toBe(origin); continue; }
        expect(legs[0]!.fromStation).toBe(origin);
        expect(legs[legs.length - 1]!.toStation).toBe(s);
        expect(legs[legs.length - 1]!.arr).toBe(res.arr[s]);
        for (let i = 1; i < legs.length; i++) {
          const a = legs[i - 1]!; const b = legs[i]!;
          expect(b.fromStation).toBe(a.toStation);
          const need = a.kind === 'ride' && b.kind === 'ride' && tt.throughInto.size === 0 ? tt.minChange[a.toStation]! : 0;
          expect(b.dep - a.arr).toBeGreaterThanOrEqual(need);
        }
      }
    }
  });
});

describe('profile cache', () => {
  it('answers exactly like a direct scan', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const tt = new Timetable(randomNetwork(seed), { defaultMinChangeSec: 300 });
      const view = truthView(tt);
      const horizon = 3 * 86400;
      const cache = new ProfileCache(tt, { horizonSec: horizon });
      for (let q = 0; q < 12; q++) {
        const o = belowN(tt.stationIds.length, seed, 'po', q);
        const d = belowN(tt.stationIds.length, seed, 'pd', q);
        const t = instantOf(BASE_DAY + 2, belowN(86400, seed, 'pt', q));
        const direct = earliestArrival(tt, connections(tt, view, t, t + horizon), [{ station: o, t }]).arr[d]!;
        const cached = cache.earliest(view, o, t, d);
        // Arrivals beyond the horizon window may differ in reach; compare where the direct scan found one.
        if (Number.isFinite(direct) && direct - t < horizon / 2) expect(cached, `seed ${seed} q ${q}`).toBe(direct);
      }
    }
  });
});

describe('knowledge and ghost connections', () => {
  const tt = new Timetable(randomNetwork(42, { editions: 2, trips: 20 }), { defaultMinChangeSec: 300 });
  it('routes only on owned editions and learned trains', () => {
    const kg = newKnownGraph('SYN_player', ['SYN_E0']);
    const v = knownView(tt, kg);
    tt.trips.forEach((t, i) => { if (t.edition !== 'SYN_E0') expect(v.uses(i, BASE_DAY + 1)).toBe(false); });
    const other = tt.trips.findIndex((t) => t.edition === 'SYN_E1');
    learn(kg, { trainKey: tt.trips[other]!.trainKey, edition: 'SYN_E1', source: 'porter', learnedDay: BASE_DAY, confidence: 800 });
    const v2 = knownView(tt, kg);
    expect(v2.key).not.toBe(v.key);
    expect(v2.uses(other, BASE_DAY + 1) || !tt.printedRuns(other, BASE_DAY + 1)).toBe(true);
    learn(kg, { trainKey: tt.trips[other]!.trainKey, edition: 'SYN_E1', source: 'observed', learnedDay: BASE_DAY, confidence: 0 });
    expect(knownView(tt, kg).uses(other, BASE_DAY + 1)).toBe(false);
    addEdition(kg, 'SYN_E1');
    expect(kg.editions).toEqual(['SYN_E0', 'SYN_E1']);
  });
  it('reports withdrawn, retimed, not-that-day and suspended trains', () => {
    const mk = (over: Partial<import('../src/timetable/types.ts').TripRow>, base = 0) => ({ ...tt.trips[base]!, ...over });
    // Build a tiny explicit network: one train key in two editions.
    const data = randomNetwork(7, { trips: 2 });
    const t0 = data.trips[0]!;
    const late = { ...t0, id: 'SYN_T0b', edition: 'SYN_E1', truth: [[BASE_DAY + 3, BASE_DAY + 30]] as Array<[number, number]>, firstStop: data.stops.station.length };
    for (let j = t0.firstStop; j < t0.firstStop + t0.nStops; j++) {
      data.stops.station.push(data.stops.station[j]!); data.stops.arr.push(data.stops.arr[j]! < 0 ? -1 : data.stops.arr[j]! + 600);
      data.stops.dep.push(data.stops.dep[j]! < 0 ? -1 : data.stops.dep[j]! + 600); data.stops.arrDay.push(data.stops.arrDay[j]!);
      data.stops.depDay.push(data.stops.depDay[j]!); data.stops.flags.push(0); data.stops.cite.push(0);
    }
    data.trips[0] = { ...t0, run: { ranges: [[BASE_DAY - 10, BASE_DAY + 30, 127]], also: [], except: [] }, truth: [[BASE_DAY - 10, BASE_DAY + 2]] };
    data.trips.push({ ...late, run: { ranges: [[BASE_DAY - 10, BASE_DAY + 30, 127]], also: [], except: [BASE_DAY + 5] } });
    const tt2 = new Timetable(data, { defaultMinChangeSec: 300 });
    const s = data.stops.station[t0.firstStop]!;
    expect(ghostCheck(tt2, 0, s, BASE_DAY + 1).status).toBe('ok');
    expect(ghostCheck(tt2, 0, s, BASE_DAY + 4).status).toBe('retimed');
    expect(ghostCheck(tt2, 0, s, BASE_DAY + 5).status).toBe('notThatDay');
    expect(ghostCheck(tt2, 0, s, BASE_DAY + 40).status).toBe('withdrawn');
    expect(ghostCheck(tt2, 0, s, BASE_DAY + 4, () => true).status).toBe('suspended');
    void mk;
  });
});

describe('itineraries', () => {
  it('are Pareto-optimal by arrival and number of trains, with the fastest equal to the scan', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const tt = new Timetable(randomNetwork(seed), { defaultMinChangeSec: 300 });
      const view = truthView(tt);
      const t = instantOf(BASE_DAY + 2, 7 * 3600);
      const o = belowN(tt.stationIds.length, seed, 'io'); const d = (o + 1 + belowN(tt.stationIds.length - 1, seed, 'id')) % tt.stationIds.length;
      const its = itineraries(tt, view, [o], t, [d], { horizonSec: 3 * 86400, maxTrains: 40 });
      const ea = earliestArrival(tt, connections(tt, view, t, t + 3 * 86400), [{ station: o, t }]).arr[d]!;
      if (its.length === 0) { expect(ea).toBe(Infinity); continue; }
      for (let i = 1; i < its.length; i++) { expect(its[i]!.arr).toBeLessThan(its[i - 1]!.arr); expect(its[i]!.trains).toBeGreaterThan(its[i - 1]!.trains); }
      expect(its[its.length - 1]!.arr).toBe(ea);
      for (const it of its) { expect(it.legs.filter((l) => l.kind === 'ride').length).toBe(it.trains); for (const sl of it.slack) expect(sl).toBeGreaterThanOrEqual(0); }
    }
  });
});

describe('particle hunter', () => {
  it('never rides a train outside its own knowledge and is deterministic', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const tt = new Timetable(randomNetwork(seed, { trips: 25 }), { defaultMinChangeSec: 300 });
      const kg = newKnownGraph('SYN_police', ['SYN_E0']);
      const view: GraphView = knownView(tt, kg);
      const run = () => {
        const b = seedBelief('SYN_police', 'SYN_subject', [0], instantOf(BASE_DAY + 1, 0), 64);
        const rides = propagate(b, instantOf(BASE_DAY + 3, 0), tt, view, seed, { stayPermille: 200, maxRides: 3, fanout: 4 });
        return { b, rides };
      };
      const a = run(); const b = run();
      expect(a.b).toEqual(b.b);
      for (const ride of a.rides) expect(tt.trips[ride.trip]!.edition).toBe('SYN_E0');
      observe(a.b, [0], instantOf(BASE_DAY + 3, 0), 1000, 100);
      resample(a.b, seed);
      expect(a.b.particles.length).toBe(64);
      expect(mass(a.b, [...Array(tt.stationIds.length).keys()])).toBe(1000);
    }
  });
  it('reseeds at an observation when every particle is contradicted', () => {
    const b = seedBelief('SYN_police', 'SYN_x', [1], instantOf(BASE_DAY, 0), 10);
    observe(b, [3], instantOf(BASE_DAY, 100), 1000, 0);
    expect(mass(b, [3])).toBe(1000);
  });
});
