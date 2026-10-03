/**
 * Scenario files → kit Scenarios. Times in the files are local civil times of a named city; the
 * amounts carry their own ids in each file's `values` list (design, labelled).
 */
import type { Scenario } from '#kit/sim/sim.ts';
import type { Money } from '#kit/money/money.ts';
import { dayFromIso } from '#kit/time/calendar.ts';
import type { Instant } from '#kit/time/instant.ts';
import type { C07Bundle } from './rules/data.ts';
import { instantIn } from './rules/data.ts';
import type { Venue, Tier } from './rules/types.ts';
import tutorial from '../scenarios/preview-tutorial.scenario.json' with { type: 'json' };
import changeover from '../scenarios/preview-changeover.scenario.json' with { type: 'json' };

interface LocalTime { city?: string; date: string; time: string }
export interface ScenarioFile {
  id: string; title: string; note: string; endRule: 'chain' | 'commissionAndBill'; seed: number;
  start: LocalTime & { city: string }; end: LocalTime & { city: string };
  legend: { id: string; nationality: string; home: string; papers: { passport: boolean; visas: string[] } };
  place: { city: string; station: string | null; venue: string };
  lodged?: { tier: string; since: LocalTime } | null;
  guides: string[]; hunter: string;
  values: Array<{ id: string; name: string; value: unknown; rationale: string }>;
  cash: Money[]; credit: Money; correspondents: string[];
  rent: { amount: Money; firstDue: LocalTime & { city: string }; everyDays: number } | null;
  bill: { amount: Money; bank: string; maturity: string } | null;
  offers: Array<{ id: string; pay: Money; stages: Array<{ city: string; open: LocalTime; close: LocalTime }> }>;
}

/** What init receives: the file with every time resolved to an Instant. */
export interface Setup {
  file: ScenarioFile;
  legend: ScenarioFile['legend'];
  place: { city: string; station: string | null; venue: Venue };
  lodged: { tier: Tier; since: Instant } | null;
  guides: string[]; hunter: string; endRule: ScenarioFile['endRule'];
  cash: Money[]; credit: Money; correspondents: string[];
  rent: { amount: Money; firstDue: Instant; everySec: number } | null;
  bill: { amount: Money; bank: string; maturityDay: number } | null;
  offers: Array<{ id: string; pay: Money; stages: Array<{ city: string; open: Instant; close: Instant }> }>;
}

export const PREVIEW_SCENARIOS: Readonly<Record<string, ScenarioFile>> = {
  'preview-tutorial': tutorial as unknown as ScenarioFile,
  'preview-changeover': changeover as unknown as ScenarioFile,
};
export const SCENARIO_IDS = ['preview-tutorial', 'preview-changeover'] as const;

const hm = (s: string): number => { const [h, m] = s.split(':').map(Number); return h! * 3600 + m! * 60; };

export function buildScenario(b: C07Bundle, id: string, seed?: number): Scenario<Setup> {
  const f = PREVIEW_SCENARIOS[id];
  if (!f) throw new Error(`No scenario ${id} (the 1914 scenarios S1 and S2 wait for transcribed data)`);
  if (!b.raw.meta.synthetic) throw new Error(`${id} runs only on the invented preview world`);
  const at = (t: LocalTime, city: string): Instant => instantIn(b, t.city ?? city, dayFromIso(t.date), hm(t.time));
  const setup: Setup = {
    file: f, legend: f.legend, guides: f.guides, hunter: f.hunter, endRule: f.endRule,
    place: { city: f.place.city, station: f.place.station, venue: f.place.venue as Venue },
    lodged: f.lodged ? { tier: f.lodged.tier as Tier, since: at(f.lodged.since, f.place.city) } : null,
    cash: f.cash, credit: f.credit, correspondents: f.correspondents,
    rent: f.rent ? { amount: f.rent.amount, firstDue: at(f.rent.firstDue, f.rent.firstDue.city), everySec: f.rent.everyDays * 86400 } : null,
    bill: f.bill ? { amount: f.bill.amount, bank: f.bill.bank, maturityDay: dayFromIso(f.bill.maturity) } : null,
    offers: f.offers.map((o) => ({ id: o.id, pay: o.pay, stages: o.stages.map((st) => ({ city: st.city, open: at(st.open, st.city), close: at(st.close, st.city) })) })),
  };
  return { id: f.id, game: 'c07-departure', title: f.title, start: at(f.start, f.start.city), end: at(f.end, f.end.city), seed: seed ?? f.seed, setup };
}
