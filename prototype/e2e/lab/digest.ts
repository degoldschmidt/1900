/**
 * A digest of kit results that must be identical in Node and in the browser: routing, itineraries,
 * the hunter, keyed draws, money conversion and calendars, all on synthetic data. The lab E2E
 * computes it on both sides and compares, so engine differences show up before any game exists.
 */
import { Timetable } from '../../kit/src/timetable/model.ts';
import { connections, truthView } from '../../kit/src/timetable/expand.ts';
import { earliestArrival } from '../../kit/src/timetable/csa.ts';
import { itineraries } from '../../kit/src/timetable/plan.ts';
import { seedBelief, propagate, resample } from '../../kit/src/hunter/belief.ts';
import { belowN, u32 } from '../../kit/src/rng/draw.ts';
import { convert, format, lsd, money } from '../../kit/src/money/money.ts';
import { dayFromJulian, gregorianFromDay } from '../../kit/src/time/calendar.ts';
import { fmtDate } from '../../kit/src/time/format.ts';
import { instantOf } from '../../kit/src/time/instant.ts';
import { canonicalJson } from '../../kit/src/sim/canonical.ts';
import { hash64 } from '../../kit/src/sim/hash.ts';
import { randomNetwork, BASE_DAY } from '../../kit/test/fixtures/synthetic-network.ts';

const fin = (x: number): number => (Number.isFinite(x) ? x : -1);

export function kitDigest(networks = 60): Record<string, string> {
  const routing: number[][] = [];
  const plans: number[][] = [];
  const hunter: number[][] = [];
  for (let seed = 1; seed <= networks; seed++) {
    const tt = new Timetable(randomNetwork(seed, { through: seed % 2 === 0 }), { defaultMinChangeSec: 300 });
    const view = truthView(tt);
    const t0 = instantOf(BASE_DAY + belowN(5, seed, 'lab-d'), belowN(86_400, seed, 'lab-s'));
    const c = connections(tt, view, t0, t0 + 3 * 86_400);
    const res = earliestArrival(tt, c, [{ station: 0, t: t0 }]);
    routing.push(Array.from(res.arr, fin));
    const target = tt.stationIds.length - 1;
    plans.push(itineraries(tt, view, [0], t0, [target], { horizonSec: 3 * 86_400, maxTrains: 4 }).flatMap((it) => [it.dep, it.arr, it.trains, ...it.slack]));
    const b = seedBelief('SYN_hunter', 'SYN_subject', [0, 1], t0, 24);
    propagate(b, t0 + 2 * 86_400, tt, view, seed, { stayPermille: 200, maxRides: 3, fanout: 4 });
    resample(b, seed);
    hunter.push(b.particles.flatMap((p) => [p.s, p.t, p.w]));
  }
  const draws = Array.from({ length: 500 }, (_, i) => u32(i, 'lab', i * 7, 'x'));
  const parity = { from: 'GBP' as const, to: 'DEM' as const, num: 2043, den: 960 };
  const moneyOut = [lsd(1), lsd(0, 13, 7, 2), money('GBP', -1001), lsd(250, 19, 11, 3)].map((m) => `${format(m)}=${format(convert(m, parity))}`);
  const cal = [[1900, 3, 1], [1914, 7, 19], [1912, 12, 31], [1918, 1, 31]].map(([y, m, d]) => {
    const day = dayFromJulian(y!, m!, d!);
    const g = gregorianFromDay(day);
    return `${day}:${g.y}-${g.m}-${g.d}:${fmtDate(day, 'dual')}`;
  });
  return {
    routing: hash64(canonicalJson(routing)),
    plans: hash64(canonicalJson(plans)),
    hunter: hash64(canonicalJson(hunter)),
    draws: hash64(canonicalJson(draws)),
    money: moneyOut.join(' | '),
    calendar: cal.join(' | '),
  };
}
