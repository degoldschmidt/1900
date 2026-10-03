/**
 * The canonical schema: one declarative spec per data/canonical/*.csv file, row types derived
 * from the specs, and parsers that turn raw CSV records into typed rows.
 *
 * Conventions (see data/canonical/README.md):
 *  - every value is trimmed; empty means "none";
 *  - dates are ISO Gregorian "1914-08-01" or Julian "J1914-07-19" and parse to day numbers
 *    (#kit/time/calendar.ts); every date range in the CSVs is inclusive at both ends;
 *  - lists are semicolon-separated; y|n flags parse to booleans;
 *  - citation columns (src, src_or_dv, dv_id) keep their text and are checked by V02.
 */
import { dayFromAnyIso, isoFromDay } from '#kit/time/calendar.ts';
import type { RawTable } from './raw-table.ts';
import { issue, type Issue } from './issues.ts';

export type ColType =
  | 'text' | 'int' | 'num' | 'date' | 'yn' | 'enum' | 'list' | 'enumlist' | 'time'
  | 'cite' | 'cite_or_dv' | 'dv' | 'json';

export interface ColSpec {
  readonly name: string;
  readonly type: ColType;
  /** Must be non-empty (not enforced by V01 for citation columns: V02 owns those). */
  readonly req?: boolean;
  readonly values?: readonly string[];
  /** Foreign key "table.column" (checked for every item of a list column). */
  readonly ref?: string;
  /** Date columns: which calendar the text must use. */
  readonly cal?: 'greg' | 'jul';
  /** Smallest allowed value (int and num columns). */
  readonly min?: number;
}

type Req<C> = C extends { readonly req: true } ? true : false;
type EnumV<C> = C extends { readonly values: readonly (infer V extends string)[] } ? V : string;
type ValueOf<C extends ColSpec> =
  C['type'] extends 'int' | 'num' | 'date' ? (Req<C> extends true ? number : number | null)
  : C['type'] extends 'yn' ? boolean
  : C['type'] extends 'list' ? string[]
  : C['type'] extends 'enumlist' ? EnumV<C>[]
  : C['type'] extends 'enum' ? (Req<C> extends true ? EnumV<C> : EnumV<C> | '')
  : C['type'] extends 'json' ? unknown
  : string;

/** The typed row of a spec, plus the CSV line it came from. */
export type RowOf<Cs extends readonly ColSpec[]> = { -readonly [C in Cs[number] as C['name']]: ValueOf<C> } & { line: number };

export const ACCESS = ['full', 'pdus', 'search-only', 'none'] as const;
export const PAGE_CONTENT = ['table', 'handbook', 'index', 'notation', 'footnotes', 'ads'] as const;
export const TIERS = ['A', 'B', 'C', 'W'] as const;
export const GAMES = ['c07', 'c01', 'c04'] as const;
export const MODES = ['rail', 'steamer', 'ferry'] as const;
export const CLASSES = ['1', '2', '3'] as const;
export const STOP_FLAGS = ['customs', 'passport', 'gauge', 'arr_only', 'dep_only', 'request'] as const;
/** Stop statuses: only agree|resolved|waived may be compiled (V11). */
export const STOP_STATUS = ['agree', 'resolved', 'waived', 'illegible', 'unresolved'] as const;
export const TRANSFER_KINDS = ['same-station', 'cross-city', 'frontier-change', 'gauge-change', 'pier'] as const;
export const BASIS = ['historical', 'design'] as const;
export const FARE_SCOPES = ['table', 'train', 'through'] as const;
export const FARE_CLASSES = ['1', '2', '3', 'sleeper', 'boat'] as const;
export const CURRENCIES = ['GBP', 'FRF', 'BEF', 'CHF', 'DEM', 'NLG', 'AUK', 'RUB'] as const;
export const KEY_KINDS = ['edge', 'jurisdiction', 'institution', 'station', 'city', 'topic', 'pair', 'currency', 'global'] as const;
export const PARAM_TIERS = ['0', '1', '2'] as const;
export const INSTITUTION_KINDS = ['police', 'intelligence', 'bank', 'post', 'telegraph', 'registry', 'press', 'commercial', 'consulate', 'court', 'other'] as const;
export const ZONE_APPLIES = ['railway', 'civil'] as const;
export const YN = ['y', 'n'] as const;

/** Currency of fares sold in each country (country codes as used in stations.csv). */
export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = {
  GB: 'GBP', FR: 'FRF', BE: 'BEF', CH: 'CHF', DE: 'DEM', NL: 'NLG', AT: 'AUK', HU: 'AUK', RU: 'RUB',
};

/** Minor units per major unit (GBP counts farthings: 1d = 4, 1s = 48, £1 = 960). */
export const MINOR_PER_MAJOR: Readonly<Record<string, number>> = {
  GBP: 960, FRF: 100, BEF: 100, CHF: 100, DEM: 100, NLG: 100, AUK: 100, RUB: 100,
};

const SOURCES = [
  { name: 'source_id', type: 'text', req: true },
  { name: 'library', type: 'text', req: true },
  { name: 'library_id', type: 'text' },
  { name: 'title', type: 'text', req: true },
  { name: 'publisher', type: 'text' },
  { name: 'edition_label', type: 'text' },
  { name: 'issue_date', type: 'date' },
  { name: 'validity_stated', type: 'text' },
  { name: 'access', type: 'enum', req: true, values: ACCESS },
  { name: 'pages', type: 'int', min: 1 },
  { name: 'language', type: 'text' },
  { name: 'url', type: 'text' },
  { name: 'terms_note', type: 'text' },
  { name: 'found_by', type: 'text' },
  { name: 'notes', type: 'text' },
] as const satisfies readonly ColSpec[];

const PAGES = [
  { name: 'source_id', type: 'text', req: true, ref: 'sources.source_id' },
  { name: 'page_seq', type: 'int', req: true, min: 1 },
  { name: 'printed_page', type: 'text' },
  { name: 'content', type: 'enum', req: true, values: PAGE_CONTENT },
  { name: 'table_refs', type: 'list' },
  { name: 'sha256', type: 'text' },
] as const satisfies readonly ColSpec[];

const EDITIONS = [
  { name: 'edition_id', type: 'text', req: true },
  { name: 'source_id', type: 'text', req: true, ref: 'sources.source_id' },
  { name: 'family', type: 'text', req: true },
  { name: 'label', type: 'text', req: true },
  { name: 'issue_date', type: 'date' },
  { name: 'valid_from', type: 'date', req: true },
  { name: 'valid_to', type: 'date' },
  { name: 'notation_file', type: 'text' },
  { name: 'gap_flag', type: 'yn', req: true },
  { name: 'notes', type: 'text' },
] as const satisfies readonly ColSpec[];

const SEGMENTS = [
  { name: 'segment_id', type: 'text', req: true },
  { name: 'from_station', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'to_station', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'via', type: 'text' },
  { name: 'tier', type: 'enum', req: true, values: TIERS },
  { name: 'games', type: 'enumlist', values: GAMES },
  { name: 'notes', type: 'text' },
] as const satisfies readonly ColSpec[];

const SEGMENT_SOURCES = [
  { name: 'segment_id', type: 'text', req: true, ref: 'segments.segment_id' },
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'date_from', type: 'date', req: true },
  { name: 'date_to', type: 'date', req: true },
  { name: 'rank', type: 'int', req: true, min: 1 },
] as const satisfies readonly ColSpec[];

const JURISDICTIONS = [
  { name: 'jur_id', type: 'text', req: true },
  { name: 'name', type: 'text', req: true },
  { name: 'country', type: 'text', req: true },
  { name: 'kind', type: 'text', req: true },
  { name: 'from', type: 'date' },
  { name: 'to', type: 'date' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const CITIES = [
  { name: 'city_id', type: 'text', req: true },
  { name: 'name', type: 'text', req: true },
  { name: 'country', type: 'text', req: true },
  { name: 'jur_id', type: 'text', req: true, ref: 'jurisdictions.jur_id' },
  { name: 'civil_zone_id', type: 'text', req: true, ref: 'zones.zone_id' },
  { name: 'geo_src', type: 'text' },
] as const satisfies readonly ColSpec[];

const STATIONS = [
  { name: 'station_id', type: 'text', req: true },
  { name: 'name', type: 'text', req: true },
  { name: 'city_id', type: 'text', req: true, ref: 'cities.city_id' },
  { name: 'country', type: 'text', req: true },
  { name: 'railway_admin', type: 'text' },
  { name: 'is_frontier', type: 'yn', req: true },
  { name: 'frontier_pair_id', type: 'text', ref: 'stations.station_id' },
  { name: 'lat', type: 'num' },
  { name: 'lon', type: 'num' },
  { name: 'geo_src', type: 'text' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const STATION_ALIASES = [
  { name: 'alias_as_printed', type: 'text', req: true },
  { name: 'family', type: 'text', req: true },
  { name: 'station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const ZONES = [
  { name: 'zone_id', type: 'text', req: true },
  { name: 'name', type: 'text', req: true },
  { name: 'offset_seconds', type: 'int', req: true },
  { name: 'applies_to', type: 'enum', req: true, values: ZONE_APPLIES },
  { name: 'from', type: 'date', req: true },
  { name: 'to', type: 'date' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const STATION_ZONES = [
  { name: 'station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'zone_id', type: 'text', req: true, ref: 'zones.zone_id' },
  { name: 'from', type: 'date', req: true },
  { name: 'to', type: 'date' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const SERVICES = [
  { name: 'service_id', type: 'text', req: true },
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'table_ref', type: 'text', req: true },
  { name: 'train_key', type: 'text', req: true },
  { name: 'train_no_as_printed', type: 'text' },
  { name: 'name', type: 'text' },
  { name: 'operator', type: 'text', req: true },
  { name: 'mode', type: 'enum', req: true, values: MODES },
  { name: 'classes', type: 'enumlist', values: CLASSES },
  { name: 'sleeper', type: 'yn', req: true },
  { name: 'running_as_printed', type: 'text' },
  { name: 'running_rule', type: 'text', req: true },
  { name: 'segment_ids', type: 'list', req: true, ref: 'segments.segment_id' },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const STOPS = [
  { name: 'service_id', type: 'text', req: true, ref: 'services.service_id' },
  { name: 'seq', type: 'int', req: true, min: 1 },
  { name: 'station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'arr_local', type: 'time' },
  { name: 'dep_local', type: 'time' },
  { name: 'arr_dayoff', type: 'int', min: 0 },
  { name: 'dep_dayoff', type: 'int', min: 0 },
  { name: 'raw_arr', type: 'text' },
  { name: 'raw_dep', type: 'text' },
  { name: 'flags', type: 'enumlist', values: STOP_FLAGS },
  { name: 'status', type: 'enum', req: true, values: STOP_STATUS },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const FOOTNOTES = [
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'table_ref', type: 'text', req: true },
  { name: 'mark', type: 'text', req: true },
  { name: 'text_as_printed', type: 'text', req: true },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const RUNNING_RULES = [
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'table_ref', type: 'text', req: true },
  { name: 'mark', type: 'text', req: true },
  { name: 'rule_dsl', type: 'text', req: true },
  { name: 'interpreted_by', type: 'text', req: true },
  { name: 'reviewed_by', type: 'text' },
] as const satisfies readonly ColSpec[];

const THROUGH_LINKS = [
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'from_service_id', type: 'text', req: true, ref: 'services.service_id' },
  { name: 'to_service_id', type: 'text', req: true, ref: 'services.service_id' },
  { name: 'station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'classes', type: 'enumlist', values: CLASSES },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const TRANSFERS = [
  { name: 'from_station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'to_station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'min_minutes', type: 'int', req: true, min: 0 },
  { name: 'kind', type: 'enum', req: true, values: TRANSFER_KINDS },
  { name: 'basis', type: 'enum', req: true, values: BASIS },
  { name: 'src_or_dv', type: 'cite_or_dv', req: true },
] as const satisfies readonly ColSpec[];

const MIN_CHANGE = [
  { name: 'station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'min_minutes', type: 'int', req: true, min: 0 },
  { name: 'basis', type: 'enum', req: true, values: BASIS },
  { name: 'src_or_dv', type: 'cite_or_dv', req: true },
] as const satisfies readonly ColSpec[];

const FARES = [
  { name: 'edition_id', type: 'text', req: true, ref: 'editions.edition_id' },
  { name: 'from_station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'to_station_id', type: 'text', req: true, ref: 'stations.station_id' },
  { name: 'scope', type: 'enum', req: true, values: FARE_SCOPES },
  { name: 'class', type: 'enum', req: true, values: FARE_CLASSES },
  { name: 'single_return', type: 'enum', req: true, values: ['s', 'r'] },
  { name: 'currency', type: 'enum', req: true, values: CURRENCIES },
  { name: 'amount_minor', type: 'int', req: true },
  { name: 'validity_days', type: 'int', min: 1 },
  { name: 'raw', type: 'text', req: true },
  { name: 'src', type: 'cite', req: true },
] as const satisfies readonly ColSpec[];

const PARAMS = [
  { name: 'row_id', type: 'text', req: true },
  { name: 'param', type: 'text', req: true },
  { name: 'key_kind', type: 'enum', req: true, values: KEY_KINDS },
  { name: 'key', type: 'text', req: true },
  { name: 'from', type: 'date', req: true },
  { name: 'to', type: 'date' },
  { name: 'tier', type: 'enum', req: true, values: PARAM_TIERS },
  { name: 'value_json', type: 'json', req: true },
  { name: 'date_basis', type: 'enum', req: true, values: BASIS },
  { name: 'value_basis', type: 'enum', req: true, values: BASIS },
  { name: 'public', type: 'yn', req: true },
  { name: 'src', type: 'cite' },
  { name: 'dv_id', type: 'dv' },
] as const satisfies readonly ColSpec[];

const CALENDAR = [
  { name: 'event_id', type: 'text', req: true },
  { name: 'date_greg', type: 'date', cal: 'greg' },
  { name: 'date_jul', type: 'date', cal: 'jul' },
  { name: 'time_local', type: 'time' },
  { name: 'zone_id', type: 'text', ref: 'zones.zone_id' },
  { name: 'jur_id', type: 'text', ref: 'jurisdictions.jur_id' },
  { name: 'kind', type: 'text', req: true },
  { name: 'title', type: 'text', req: true },
  { name: 'effects', type: 'list', ref: 'params.row_id' },
  { name: 'src', type: 'cite', req: true },
  { name: 'notes', type: 'text' },
] as const satisfies readonly ColSpec[];

const INSTITUTIONS = [
  { name: 'inst_id', type: 'text', req: true },
  { name: 'name', type: 'text', req: true },
  { name: 'name_as_period', type: 'text' },
  { name: 'kind', type: 'enum', req: true, values: INSTITUTION_KINDS },
  { name: 'jur_id', type: 'text', req: true, ref: 'jurisdictions.jur_id' },
  { name: 'city_id', type: 'text', ref: 'cities.city_id' },
  { name: 'parent_id', type: 'text', ref: 'institutions.inst_id' },
  { name: 'from', type: 'date', req: true },
  { name: 'to', type: 'date' },
  { name: 'reads_kinds', type: 'list' },
  { name: 'office_hours_param', type: 'text', ref: 'params.param' },
  { name: 'basis', type: 'enum', req: true, values: BASIS },
  { name: 'src_or_dv', type: 'cite_or_dv', req: true },
] as const satisfies readonly ColSpec[];

/** Historian waivers for stop cells that stay illegible or disputed (see V11). */
const WAIVERS = [
  { name: 'waiver_id', type: 'text', req: true },
  { name: 'src', type: 'cite', req: true },
  { name: 'note', type: 'text', req: true },
  { name: 'historian', type: 'text', req: true },
  { name: 'reviewed_on', type: 'date', req: true, cal: 'greg' },
] as const satisfies readonly ColSpec[];

export type SourceRow = RowOf<typeof SOURCES>;
export type PageRow = RowOf<typeof PAGES>;
export type EditionCsvRow = RowOf<typeof EDITIONS>;
export type SegmentRow = RowOf<typeof SEGMENTS>;
export type SegmentSourceRow = RowOf<typeof SEGMENT_SOURCES>;
export type JurisdictionRow = RowOf<typeof JURISDICTIONS>;
export type CityCsvRow = RowOf<typeof CITIES>;
export type StationCsvRow = RowOf<typeof STATIONS>;
export type StationAliasRow = RowOf<typeof STATION_ALIASES>;
export type ZoneCsvRow = RowOf<typeof ZONES>;
export type StationZoneCsvRow = RowOf<typeof STATION_ZONES>;
export type ServiceRow = RowOf<typeof SERVICES>;
export type StopRow = RowOf<typeof STOPS>;
export type FootnoteRow = RowOf<typeof FOOTNOTES>;
export type RunningRuleRow = RowOf<typeof RUNNING_RULES>;
export type ThroughLinkCsvRow = RowOf<typeof THROUGH_LINKS>;
export type TransferCsvRow = RowOf<typeof TRANSFERS>;
export type MinChangeCsvRow = RowOf<typeof MIN_CHANGE>;
export type FareCsvRow = RowOf<typeof FARES>;
export type ParamCsvRow = RowOf<typeof PARAMS>;
export type CalendarRow = RowOf<typeof CALENDAR>;
export type InstitutionCsvRow = RowOf<typeof INSTITUTIONS>;
export type WaiverRow = RowOf<typeof WAIVERS>;

export interface Tables {
  sources: SourceRow[];
  pages: PageRow[];
  editions: EditionCsvRow[];
  segments: SegmentRow[];
  segment_sources: SegmentSourceRow[];
  jurisdictions: JurisdictionRow[];
  cities: CityCsvRow[];
  stations: StationCsvRow[];
  station_aliases: StationAliasRow[];
  zones: ZoneCsvRow[];
  station_zones: StationZoneCsvRow[];
  services: ServiceRow[];
  stops: StopRow[];
  footnotes: FootnoteRow[];
  running_rules: RunningRuleRow[];
  through_links: ThroughLinkCsvRow[];
  transfers: TransferCsvRow[];
  min_change: MinChangeCsvRow[];
  fares: FareCsvRow[];
  params: ParamCsvRow[];
  calendar: CalendarRow[];
  institutions: InstitutionCsvRow[];
  waivers: WaiverRow[];
}
export type TableName = keyof Tables;

export interface TableSpec {
  readonly name: TableName;
  readonly file: string;
  /** Columns whose values together identify a row (unique). */
  readonly key: readonly string[];
  readonly columns: readonly ColSpec[];
}

const t = (name: TableName, key: readonly string[], columns: readonly ColSpec[]): TableSpec => ({ name, file: `${name}.csv`, key, columns });

/** Every canonical table, in dependency order (referenced tables first where possible). */
export const TABLE_SPECS: readonly TableSpec[] = [
  t('sources', ['source_id'], SOURCES),
  t('pages', ['source_id', 'page_seq'], PAGES),
  t('editions', ['edition_id'], EDITIONS),
  t('jurisdictions', ['jur_id'], JURISDICTIONS),
  t('zones', ['zone_id', 'from'], ZONES),
  t('cities', ['city_id'], CITIES),
  t('stations', ['station_id'], STATIONS),
  t('station_aliases', ['alias_as_printed', 'family'], STATION_ALIASES),
  t('station_zones', ['station_id', 'zone_id', 'from'], STATION_ZONES),
  t('segments', ['segment_id'], SEGMENTS),
  t('segment_sources', ['segment_id', 'edition_id', 'date_from'], SEGMENT_SOURCES),
  t('services', ['service_id'], SERVICES),
  t('stops', ['service_id', 'seq'], STOPS),
  t('footnotes', ['edition_id', 'table_ref', 'mark'], FOOTNOTES),
  t('running_rules', ['edition_id', 'table_ref', 'mark'], RUNNING_RULES),
  t('through_links', ['edition_id', 'from_service_id', 'to_service_id', 'station_id'], THROUGH_LINKS),
  t('transfers', ['from_station_id', 'to_station_id'], TRANSFERS),
  t('min_change', ['station_id'], MIN_CHANGE),
  t('fares', ['edition_id', 'from_station_id', 'to_station_id', 'scope', 'class', 'single_return'], FARES),
  t('params', ['row_id'], PARAMS),
  t('calendar', ['event_id'], CALENDAR),
  t('institutions', ['inst_id'], INSTITUTIONS),
  t('waivers', ['waiver_id'], WAIVERS),
];

export function specOf(name: TableName): TableSpec {
  const s = TABLE_SPECS.find((x) => x.name === name);
  if (!s) throw new Error(`No table ${name}`);
  return s;
}

export const emptyTables = (): Tables => ({
  sources: [], pages: [], editions: [], segments: [], segment_sources: [], jurisdictions: [], cities: [],
  stations: [], station_aliases: [], zones: [], station_zones: [], services: [], stops: [], footnotes: [],
  running_rules: [], through_links: [], transfers: [], min_change: [], fares: [], params: [], calendar: [],
  institutions: [], waivers: [],
});

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const INT_RE = /^-?\d+$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;

export type ParseResult = { ok: true; value: unknown } | { ok: false; message: string };

const splitList = (s: string): string[] => s.split(';').map((x) => x.trim()).filter((x) => x !== '');

/** Parses one trimmed CSV value for a column. Empty values give the column's "none". */
export function parseValue(col: ColSpec, raw: string): ParseResult {
  const v = raw.trim();
  const isCite = col.type === 'cite' || col.type === 'cite_or_dv' || col.type === 'dv';
  if (v === '') {
    if (col.req && !isCite) return { ok: false, message: `${col.name} is required` };
    switch (col.type) {
      case 'int': case 'num': case 'date': return { ok: true, value: null };
      case 'list': case 'enumlist': return { ok: true, value: [] };
      case 'yn': return { ok: false, message: `${col.name} is required (y|n)` };
      default: return { ok: true, value: '' };
    }
  }
  switch (col.type) {
    case 'int': {
      if (!INT_RE.test(v)) return { ok: false, message: `${col.name} "${v}" is not an integer` };
      const n = Number(v);
      if (col.min !== undefined && n < col.min) return { ok: false, message: `${col.name} ${n} is below ${col.min}` };
      return { ok: true, value: n };
    }
    case 'num': {
      if (!NUM_RE.test(v)) return { ok: false, message: `${col.name} "${v}" is not a number` };
      const n = Number(v);
      if (col.min !== undefined && n < col.min) return { ok: false, message: `${col.name} ${n} is below ${col.min}` };
      return { ok: true, value: n };
    }
    case 'date': {
      if (col.cal === 'greg' && v.startsWith('J')) return { ok: false, message: `${col.name} "${v}" must be a Gregorian date (YYYY-MM-DD)` };
      if (col.cal === 'jul' && !v.startsWith('J')) return { ok: false, message: `${col.name} "${v}" must be a Julian date (JYYYY-MM-DD)` };
      try { return { ok: true, value: dayFromAnyIso(v) }; } catch (e) { return { ok: false, message: `${col.name}: ${(e as Error).message}` }; }
    }
    case 'yn':
      if (v === 'y') return { ok: true, value: true };
      if (v === 'n') return { ok: true, value: false };
      return { ok: false, message: `${col.name} "${v}" is not y|n` };
    case 'enum':
      if (col.values && !col.values.includes(v)) return { ok: false, message: `${col.name} "${v}" is not one of ${col.values.join('|')}` };
      return { ok: true, value: v };
    case 'list': return { ok: true, value: splitList(v) };
    case 'enumlist': {
      const items = splitList(v);
      for (const x of items) if (col.values && !col.values.includes(x)) return { ok: false, message: `${col.name} item "${x}" is not one of ${col.values.join('|')}` };
      if (new Set(items).size !== items.length) return { ok: false, message: `${col.name} "${v}" repeats an item` };
      return { ok: true, value: items };
    }
    case 'time':
      if (!TIME_RE.test(v)) return { ok: false, message: `${col.name} "${v}" is not a 24-hour time HH:MM` };
      return { ok: true, value: v };
    case 'json':
      try { return { ok: true, value: JSON.parse(v) as unknown }; } catch { return { ok: false, message: `${col.name} is not valid JSON: ${v}` }; }
    default:
      return { ok: true, value: v };
  }
}

/** Formats a typed value back to CSV text (dates are written as Gregorian ISO). */
export function formatValue(col: ColSpec, value: unknown): string {
  if (value === null || value === undefined) return '';
  switch (col.type) {
    case 'int': case 'num': return String(value);
    case 'date': return isoFromDay(value as number);
    case 'yn': return value ? 'y' : 'n';
    case 'list': case 'enumlist': return (value as string[]).join(';');
    case 'json': return JSON.stringify(value);
    default: return String(value);
  }
}

export function formatRow(spec: TableSpec, row: Readonly<Record<string, unknown>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of spec.columns) out[c.name] = formatValue(c, row[c.name]);
  return out;
}

export const headerOf = (spec: TableSpec): string[] => spec.columns.map((c) => c.name);

/**
 * Parses a raw table into typed rows. Rows with any unparseable value are left out (and
 * reported); header problems leave the whole table empty.
 */
export function parseRows(spec: TableSpec, raw: RawTable, check = 'V01'): { rows: Array<Record<string, unknown> & { line: number }>; issues: Issue[] } {
  const issues: Issue[] = [];
  const rows: Array<Record<string, unknown> & { line: number }> = [];
  if (raw.missing) {
    issues.push(issue(check, 'error', spec.file, 'file is missing (every canonical table must exist, with at least its header row)'));
    return { rows, issues };
  }
  for (const p of raw.problems) issues.push(issue(check, 'error', `${spec.file}:${p.line}`, p.message));
  const want = headerOf(spec);
  if (raw.header.join(',') !== want.join(',')) {
    issues.push(issue(check, 'error', `${spec.file}:1`, `header must be exactly: ${want.join(',')} (found: ${raw.header.join(',')})`));
    return { rows, issues };
  }
  for (const r of raw.rows) {
    const row: Record<string, unknown> & { line: number } = { line: r.line };
    let ok = true;
    for (const c of spec.columns) {
      const res = parseValue(c, r.values[c.name] ?? '');
      if (res.ok) row[c.name] = res.value;
      else { ok = false; issues.push(issue(check, 'error', `${spec.file}:${r.line}`, res.message)); }
    }
    if (ok) rows.push(row);
  }
  return { rows, issues };
}
