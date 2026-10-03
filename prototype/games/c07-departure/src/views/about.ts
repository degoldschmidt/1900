/**
 * About (RULES.md 9): build, data freeze, sources, the design values in use and the source gaps.
 * The preview's banner is permanent: an invented railway, not history (Decision P-006).
 */
import type { ViewData } from './public.ts';

export const PREVIEW_BANNER = 'Mechanics preview: an invented railway, not history';

export interface AboutViewModel {
  banner: string | null; game: string; freezeTag: string | null; dataHash: string; synthetic: boolean; buildId: string;
  window: [string, string];
  sources: Array<{ source: string; title: string; editions: string[] }>;
  editions: Array<{ id: string; label: string; family: string }>;
  designValues: Array<{ id: string; value: string; unit: string; rationale: string }>;
  designRows: Array<{ id: string; param: string; key: string; dv: string }>;
  gaps: string[];
}

export function aboutView(d: Pick<ViewData, 'b' | 'params'>, buildId: string, isoOf: (day: number) => string): AboutViewModel {
  const b = d.b; const meta = b.raw.meta;
  const bySource = new Map<string, { title: string; editions: Set<string> }>();
  for (const c of b.raw.citations) {
    const e = bySource.get(c.source) ?? { title: c.sourceTitle, editions: new Set<string>() };
    if (c.edition) e.editions.add(c.edition);
    bySource.set(c.source, e);
  }
  const gaps: string[] = [];
  if (meta.synthetic) {
    gaps.push('Every place, railway, guide, fare, price and institution here is invented; no historical source is cited.');
    gaps.push('No world events: the invented calendar holds only timetable and bank notices. Suspensions, papers decrees, moratoria and telegraph restrictions are supported by the rules but unused.');
    gaps.push('The 1914 scenarios (S1 Changeover, S2 The Last Week) wait for transcribed data.');
  }
  for (const p of ['service.suspension', 'telegraph.private.suspended', 'bank.moratorium', 'bill.moratorium']) if (b.raw.params.every((r) => r.param !== p)) gaps.push(`No ${p} rows in this data.`);
  return {
    banner: meta.synthetic ? PREVIEW_BANNER : null, game: meta.game, freezeTag: meta.freezeTag ?? null, dataHash: meta.dataHash, synthetic: meta.synthetic, buildId,
    window: [isoOf(meta.window[0]), isoOf(meta.window[1])],
    sources: [...bySource].map(([source, v]) => ({ source, title: v.title, editions: [...v.editions].sort() })),
    editions: b.raw.editions.map((e) => ({ id: e.id, label: e.label, family: e.family })),
    designValues: b.raw.designValues.map((v) => ({ id: v.id, value: typeof v.value === 'string' ? v.value : JSON.stringify(v.value), unit: v.unit, rationale: v.rationale })),
    designRows: b.raw.params.filter((r) => r.valueBasis === 'design').map((r) => ({ id: r.id, param: r.param, key: r.key, dv: r.dv ?? '' })),
    gaps,
  };
}
