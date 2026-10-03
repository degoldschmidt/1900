/**
 * Timetable data as it arrives in a game bundle (JSON). The kit converts it into a columnar model
 * (see model.ts). Times are as printed, in the local railway time of each station's zone, in
 * seconds after midnight, plus a day offset relative to the trip's service day (the day of its first
 * departure). -1 means "no time printed".
 */
export type Mode = 'rail' | 'steamer' | 'ferry';

/** Days on which a printed service runs, compiled from the guide's footnotes. */
export interface RunRule {
  /** [fromDay, toDay] inclusive, with a weekday mask: bit 0 = Monday … bit 6 = Sunday (127 = daily). */
  ranges: Array<[number, number, number]>;
  /** Extra days it runs. */
  also: number[];
  /** Days it does not run. */
  except: number[];
}

export interface StationRow {
  id: string;
  name: string;
  city: string;
  country: string;
  frontier: boolean;
  frontierPair: string | null;
}

export interface CityRow {
  id: string;
  name: string;
  country: string;
  jurisdiction: string;
  civilZone: string;
}

export interface ZoneRow {
  id: string;
  name: string;
  /** Seconds east of Greenwich (Petersburg time is +7278, Amsterdam time +1172). */
  offsetSec: number;
  appliesTo: 'railway' | 'civil';
  from: number;
  to: number | null;
  cite?: number;
  dv?: string;
}

export interface StationZoneRow {
  station: string;
  zone: string;
  from: number;
  to: number | null;
  cite?: number;
}

export interface EditionRow {
  id: string;
  source: string;
  family: string;
  label: string;
  issueDay: number;
  validFrom: number;
  validTo: number | null;
}

export interface TripRow {
  /** Unique within the bundle: one printed train in one edition. */
  id: string;
  /** Identity across editions (e.g. "DE-D1-Berlin-Eydtkuhnen"), used to detect withdrawn or retimed trains. */
  trainKey: string;
  edition: string;
  trainNo: string;
  name: string | null;
  operator: string;
  mode: Mode;
  /** Bit 0 = 1st class, bit 1 = 2nd, bit 2 = 3rd. */
  classMask: number;
  sleeper: boolean;
  run: RunRule;
  /** Day ranges [from, to] inclusive when this trip is the truth on the ground (one truth edition per segment per date). */
  truth: Array<[number, number]>;
  /** Index of the first stop in the stop columns, and how many stops. */
  firstStop: number;
  nStops: number;
  cite: number;
}

/** Stop columns (parallel arrays, one entry per stop). */
export interface StopColumns {
  station: number[];
  arr: number[];
  dep: number[];
  arrDay: number[];
  depDay: number[];
  /** Bit flags: 1 customs, 2 passport, 4 gauge change, 8 arrival only, 16 departure only, 32 request stop. */
  flags: number[];
  cite: number[];
}

export interface TransferRow {
  from: string;
  to: string;
  minSec: number;
  kind: 'same-station' | 'cross-city' | 'frontier-change' | 'gauge-change' | 'pier';
  basis: 'historical' | 'design';
  cite?: number;
  dv?: string;
}

export interface MinChangeRow {
  station: string;
  minSec: number;
  basis: 'historical' | 'design';
  cite?: number;
  dv?: string;
}

export interface ThroughLinkRow {
  fromTrip: string;
  toTrip: string;
  station: string;
  classMask: number;
  cite: number;
}

export interface FareRow {
  edition: string;
  from: string;
  to: string;
  scope: 'table' | 'train' | 'through';
  /** "1" | "2" | "3" | "sleeper" | "boat". */
  cls: string;
  ret: boolean;
  currency: string;
  amountMinor: number;
  validityDays: number | null;
  cite: number;
}

export interface TimetableData {
  stations: StationRow[];
  cities: CityRow[];
  zones: ZoneRow[];
  stationZones: StationZoneRow[];
  editions: EditionRow[];
  trips: TripRow[];
  stops: StopColumns;
  transfers: TransferRow[];
  minChange: MinChangeRow[];
  throughLinks: ThroughLinkRow[];
  fares: FareRow[];
}
