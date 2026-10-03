/** Basis of a date or value: transcribed and cited ("historical"), or chosen by design ("design"). */
export type Basis = 'historical' | 'design';

/**
 * One row of the dated parameter layer (C10). Rows are keyed by (param, key) and valid on days
 * [from, to); `to` null means open-ended. Day numbers count days since 1900-01-01 (Gregorian).
 */
export interface ParamRow {
  id: string;
  param: string;
  /** What the key names: an edge "STA>STB", a jurisdiction, an institution, a station, a pair "A>B", or "global". */
  keyKind: 'edge' | 'jurisdiction' | 'institution' | 'station' | 'pair' | 'currency' | 'global';
  key: string;
  from: number;
  to: number | null;
  tier: 0 | 1 | 2;
  value: unknown;
  dateBasis: Basis;
  valueBasis: Basis;
  /** Citation index into the bundle's citation table (historical rows). */
  cite?: number;
  /** Design-value id (design rows), e.g. "DV-007". */
  dv?: string;
  /** Public rows may be shown to the player and used by self-forecasts. */
  public: boolean;
}

/** A Tier-0 world-calendar event, scheduled at its time; its effects are param rows that start then. */
export interface WorldEventRow {
  id: string;
  /** Gregorian day number. */
  day: number;
  /** Local seconds after midnight, or null when only the date is known. */
  timeLocal: number | null;
  zone: string | null;
  jurisdiction: string | null;
  kind: string;
  title: string;
  /** Param row ids whose `from` coincides with this event. */
  effects: string[];
  cite: number;
}

export interface InstitutionRow {
  id: string;
  name: string;
  nameAsPeriod: string;
  kind: 'police' | 'intelligence' | 'bank' | 'post' | 'telegraph' | 'registry' | 'press' | 'commercial' | 'consulate' | 'court' | 'other';
  jurisdiction: string;
  city: string | null;
  parent: string | null;
  from: number;
  to: number | null;
  /** Record kinds this institution reads at source, e.g. ["registration.slip"]. */
  readsKinds: string[];
  basis: Basis;
  cite?: number;
  dv?: string;
}
