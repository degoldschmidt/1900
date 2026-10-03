/**
 * Hypothesis metrics (RULES.md section 1), read from a replayed game: state.stats, state.ending,
 * the input log, the trace and the questionnaire answers. Analysis only; nothing here feeds play.
 */
import type { Metric } from '#kit/sim/module.ts';
import type { InputEntry, TraceEntry } from '#kit/sim/sim.ts';
import type { C07State } from './types.ts';
import type { C07Bundle } from './data.ts';
import { dv } from './data.ts';

export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const v = [...xs].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m]! : Math.floor((v[m - 1]! + v[m]!) / 2);
}

const permille = (n: number, d: number): number | null => (d === 0 ? null : Math.floor((n * 1000) / d));

interface Cmd { type: string; ui?: { sinceArrivalMs?: number; source?: string } }

export function c07Metrics(s: C07State, b: C07Bundle, log: ReadonlyArray<InputEntry<Cmd>>, trace: readonly TraceEntry[], answers: Readonly<Record<string, string | number>>): Record<string, Metric> {
  const st = s.stats;
  // H07-1
  const minStay = dv<number>(b, 'DV-C07-004');
  const stays = st.stays.filter((x) => x.to - x.from >= minStay);
  const span = stays.reduce((a, x) => a + (x.to - x.from), 0);
  // H07-2
  const multi = st.bookings.filter((x) => x.legs >= 2);
  const firstMiss = st.misses[0]?.at ?? null;
  const before = firstMiss === null ? [] : multi.filter((x) => x.at < firstMiss).map((x) => x.minSlackSec);
  const after = firstMiss === null ? [] : multi.filter((x) => x.at > firstMiss).map((x) => x.minSlackSec);
  const mb = median(before); const ma = median(after);
  const q1 = answers.q1;
  // H07-3
  const firstGhost = st.ghosts[0]?.at ?? null;
  const afterGhost = firstGhost === null ? [] : st.bookings.filter((x) => x.at > firstGhost);
  const beforeGhost = firstGhost === null ? st.bookings : st.bookings.filter((x) => x.at <= firstGhost);
  // H07-4
  const sessions = st.sessions.filter((x) => s.ending === null || x.at < s.ending.at);
  // H07-5
  const detecting = new Set(st.detections.map((d) => d.cordon));
  const causes = new Set(s.hunt.cordons.filter((c) => detecting.has(c.id)).flatMap((c) => c.cause));
  const cordonTraces = trace.filter((t) => t.kind === 'hunt.cordon').map((t) => t.data as { from: number; local: number | null; train: number | null });
  // H07-6
  const books = log.filter((e) => e.cmd.type === 'book');
  const planMs = books.map((e) => e.cmd.ui?.sinceArrivalMs).filter((x): x is number => typeof x === 'number');
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    ending: s.ending?.kind ?? null,
    'H07-1.verbsPerStay': median(stays.map((x) => x.verbs)),
    'H07-1.waitShare': permille(stays.reduce((a, x) => a + x.waitSec, 0), span),
    'H07-1.stays': stays.length,
    'H07-2.bufferRatio': before.length >= 2 && after.length >= 2 && mb !== null && ma !== null && mb > 0 ? Math.floor((ma * 1000) / mb) : null,
    'H07-2.missesForecast': permille(st.misses.filter((m) => m.oddsShown > 0).length, st.misses.length),
    'H07-2.misses': st.misses.length,
    'H07-2.blame': q1 === 'plan' || q1 === 'luck' || q1 === 'unfair' ? q1 : null,
    'H07-3.verifyAfterGhost': permille(afterGhost.filter((x) => x.verified).length, afterGhost.length),
    'H07-3.verifyBeforeGhost': permille(beforeGhost.filter((x) => x.verified).length, beforeGhost.length),
    'H07-3.repeatGhosts': firstGhost === null ? null : st.ghosts.filter((g) => g.at > firstGhost + dv<number>(b, 'DV-C07-069')).length,
    'H07-3.ghosts': st.ghosts.length,
    'H07-3.fair': num(answers.q2),
    'H07-4.stopsAboardNight': sessions.length >= 2 ? permille(sessions.filter((x) => x.night).length, sessions.length) : null,
    'H07-5.attribution': st.detections.length === 0 || num(answers.q3) === null ? null : causes.has(num(answers.q3)!),
    'H07-5.explicable': num(answers.q4),
    'H07-5.cordonFeasible': cordonTraces.every((c) => c.from === Math.min(c.local ?? Infinity, c.train ?? Infinity)),
    'H07-5.cordons': cordonTraces.length,
    'H07-6.planMs': median(planMs),
    'H07-6.defaultShare': permille(books.filter((e) => e.cmd.ui?.source === 'default').length, books.length),
  };
}
