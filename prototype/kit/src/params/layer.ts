/**
 * The dated parameter layer (C10): one table of rows keyed by (param, key) and valid on days
 * [from, to). When several rows match, the one with the latest `from` wins; equal `from` is
 * resolved by position (later rows, such as scenario overrides, win). The layer is immutable.
 */
import type { ParamRow } from './types.ts';
import type { DayNumber } from '../time/calendar.ts';

const validOn = (r: ParamRow, day: DayNumber): boolean => r.from <= day && (r.to === null || day < r.to);

export class ParamLayer {
  private readonly byKey = new Map<string, ParamRow[]>();
  private readonly byParam = new Map<string, ParamRow[]>();
  readonly rows: readonly ParamRow[];

  constructor(rows: readonly ParamRow[]) {
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.id)) throw new Error(`Duplicate param row id ${r.id}`);
      seen.add(r.id);
    }
    this.rows = rows;
    rows.forEach((r) => {
      const k = `${r.param}\u0000${r.key}`;
      (this.byKey.get(k) ?? this.byKey.set(k, []).get(k)!).push(r);
      (this.byParam.get(r.param) ?? this.byParam.set(r.param, []).get(r.param)!).push(r);
    });
  }

  /** The row in force for (param, key) on `day`, or undefined. */
  row(param: string, key: string, day: DayNumber): ParamRow | undefined {
    const list = this.byKey.get(`${param}\u0000${key}`);
    if (!list) return undefined;
    let best: ParamRow | undefined;
    for (const r of list) if (validOn(r, day) && (!best || r.from >= best.from)) best = r;
    return best;
  }

  get<T>(param: string, key: string, day: DayNumber): T | undefined {
    return this.row(param, key, day)?.value as T | undefined;
  }

  /** All rows of a parameter, in data order. */
  rowsFor(param: string): readonly ParamRow[] {
    return this.byParam.get(param) ?? [];
  }

  /** All rows for (param, key), sorted by from. */
  history(param: string, key: string): ParamRow[] {
    return [...(this.byKey.get(`${param}\u0000${key}`) ?? [])].sort((a, b) => a.from - b.from);
  }

  /** Sorted distinct days in [d0, d1] on which some row starts or ends. */
  boundaries(d0: DayNumber, d1: DayNumber): DayNumber[] {
    const days = new Set<number>();
    for (const r of this.rows) {
      if (r.from >= d0 && r.from <= d1) days.add(r.from);
      if (r.to !== null && r.to >= d0 && r.to <= d1) days.add(r.to);
    }
    return [...days].sort((a, b) => a - b);
  }

  /** Rows that start or end exactly on `day`. */
  changesOn(day: DayNumber): { started: string[]; ended: string[] } {
    const started: string[] = []; const ended: string[] = [];
    for (const r of this.rows) {
      if (r.from === day) started.push(r.id);
      if (r.to === day) ended.push(r.id);
    }
    return { started: started.sort(), ended: ended.sort() };
  }

  /** A new layer with overrides: a row with an existing id replaces it; new ids are appended. */
  withOverrides(overrides: readonly ParamRow[]): ParamLayer {
    const ids = new Map(overrides.map((r) => [r.id, r] as const));
    const merged = this.rows.map((r) => ids.get(r.id) ?? r);
    const existing = new Set(this.rows.map((r) => r.id));
    for (const r of overrides) if (!existing.has(r.id)) merged.push(r);
    return new ParamLayer(merged);
  }

  /** The public subset: what the player, self-forecasts and indicators may read. */
  publicView(): PublicParams {
    return new PublicParams(new ParamLayer(this.rows.filter((r) => r.public)));
  }
}

/** Read-only view of public rows. Forecast code receives this, never the full layer. */
export class PublicParams {
  private readonly layer: ParamLayer;
  constructor(layer: ParamLayer) { this.layer = layer; }
  get<T>(param: string, key: string, day: DayNumber): T | undefined { return this.layer.get<T>(param, key, day); }
  row(param: string, key: string, day: DayNumber): ParamRow | undefined { return this.layer.row(param, key, day); }
  history(param: string, key: string): ParamRow[] { return this.layer.history(param, key); }
}
