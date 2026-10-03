/**
 * Compiles the canonical data into one game bundle (kit/src/data/bundle.ts ReadyBundle).
 *
 *   node tools/compile/compile-bundles.ts <game|c07|c01|c04|--all> [--synthetic]
 *        [--data <data root>] [--manifest <data-manifest.json>] [--out <dir>]
 *
 * Reads games/<game>/data-manifest.json:
 *   { game, status, freezeTag, segments: [segment_id…], editions: [edition_id…],
 *     params: [param name or row_id…], calendarWindow: [fromIso, toIso] | null,
 *     window?: [fromIso, toIso], institutions?: [inst_id…] }
 * and writes build/data/<game>.bundle.json (tools/make/bundle-game.ts inlines it). With --all,
 * manifests whose status is "awaiting-data" are skipped; naming one explicitly is refused.
 *
 * What goes in:
 *  - window: manifest.window, else calendarWindow (day numbers, inclusive); required;
 *  - trips: services of the listed editions serving at least one listed segment, with their
 *    stops; run = the printed rule compiled over the bundle window; truth = the days the trip is
 *    the truth on the ground: its edition's validity ∩ for every segment it serves, the rank-1
 *    segment_sources rows naming its edition ∩ the window (tools/schema/running-rule.ts explains
 *    why the two windows differ);
 *  - stations: stops of included trips, ends of listed segments, and their frontier pairs; their
 *    cities, station zones and zones (rows overlapping the window); the cities' civil zones;
 *  - editions listed; transfers and minimum changes among included stations; through links
 *    between included trips; fares of the included editions between included stations;
 *  - params: rows whose param or row_id the manifest lists, overlapping the window, plus every
 *    row a selected calendar event names as an effect; calendar events dated inside
 *    calendarWindow; institutions listed (or, if the manifest lists none, all overlapping the
 *    window); design values used by any included row (DESIGN_VALUES.md);
 *  - citations: one entry per (source, page, table), sorted, referenced by index.
 * Conversions: dates → day numbers; "HH:MM" → seconds (−1 when not printed); classes → bit mask
 * (1st = 1, 2nd = 2, 3rd = 4); stop flags → bits (customs 1, passport 2, gauge 4, arr_only 8,
 * dep_only 16, request 32). CSV ranges are inclusive; the kit's params, zones, station zones and
 * institutions take `to` exclusive ([from, to)), so their `to` is the CSV's to + 1. Truth ranges,
 * run ranges, editions' validTo and the meta window stay inclusive.
 *
 * Refuses (exit 1, nothing written): any V01–V12 error; synthetic sources (SYN_) unless
 * --synthetic (which sets meta.synthetic); a stop that is not agree/resolved/waived; a
 * design-basis row without a design-value id; unknown segments or editions in the manifest.
 * Deterministic: everything is sorted explicitly and serialised as canonical JSON (sorted keys),
 * so identical inputs give byte-identical output; meta.dataHash is the first 16 hex digits of the
 * sha256 of the canonical JSON of the bundle without meta.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Citation, DesignValueRow, ReadyBundle } from '#kit/data/bundle.ts';
import type { InstitutionRow, ParamRow, WorldEventRow } from '#kit/params/types.ts';
import type { CityRow, EditionRow, FareRow, MinChangeRow, StationRow, StationZoneRow, StopColumns, ThroughLinkRow, TransferRow, TripRow, ZoneRow } from '#kit/timetable/types.ts';
import { canonicalJson } from '#kit/sim/canonical.ts';
import { dayFromIso } from '#kit/time/calendar.ts';
import { GAMES, ROOT, SHORT } from '../make/paths.ts';
import { loadDataset, type Dataset } from '../schema/dataset.ts';
import { STOP_FLAGS, type ServiceRow } from '../schema/canonical.ts';
import { isDvId, parseCitation } from '../schema/citation.ts';
import { cmpStr } from '../schema/csv.ts';
import { intersectRanges, secOfHm, stopsByService, truthRanges, type Range } from '../schema/derive.ts';
import { errorsOf, formatIssue } from '../schema/issues.ts';
import { compileRuleText } from '../schema/running-rule.ts';
import { runSuite } from '../validate/suite.ts';

export interface Manifest {
  game: string;
  status: string;
  freezeTag?: string;
  segments: string[];
  editions: string[];
  params: string[];
  calendarWindow: [string, string] | null;
  window?: [string, string];
  institutions?: string[];
}

export class CompileError extends Error {
  readonly reasons: string[];
  constructor(game: string, reasons: string[]) {
    super(`cannot compile ${game}:\n  ${reasons.join('\n  ')}`);
    this.name = 'CompileError';
    this.reasons = reasons;
  }
}

const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isPair = (v: unknown): v is [string, string] => isStrArr(v) && v.length === 2;

export function parseManifest(text: string, file = 'data-manifest.json'): Manifest {
  const j = JSON.parse(text) as Record<string, unknown>;
  const bad: string[] = [];
  if (typeof j.game !== 'string' || !j.game) bad.push('game must be a string');
  if (typeof j.status !== 'string') bad.push('status must be a string');
  for (const k of ['segments', 'editions', 'params'] as const) if (!isStrArr(j[k])) bad.push(`${k} must be a list of strings`);
  if (j.calendarWindow !== null && !isPair(j.calendarWindow)) bad.push('calendarWindow must be [from, to] or null');
  if (j.window !== undefined && !isPair(j.window)) bad.push('window must be [from, to]');
  if (j.institutions !== undefined && !isStrArr(j.institutions)) bad.push('institutions must be a list of strings');
  if (j.freezeTag !== undefined && typeof j.freezeTag !== 'string') bad.push('freezeTag must be a string');
  if (bad.length) throw new Error(`${file}: ${bad.join('; ')}`);
  const m: Manifest = {
    game: j.game as string, status: j.status as string, segments: j.segments as string[], editions: j.editions as string[],
    params: j.params as string[], calendarWindow: (j.calendarWindow as [string, string] | null) ?? null,
  };
  if (typeof j.freezeTag === 'string') m.freezeTag = j.freezeTag;
  if (j.window !== undefined) m.window = j.window as [string, string];
  if (j.institutions !== undefined) m.institutions = j.institutions as string[];
  return m;
}

export interface CompileOptions {
  synthetic: boolean;
  /** Run V01–V12 first and refuse on any error (default true; tests may turn it off). */
  validate?: boolean;
}

const FLAG_BITS: Record<(typeof STOP_FLAGS)[number], number> = { customs: 1, passport: 2, gauge: 4, arr_only: 8, dep_only: 16, request: 32 };
const classMask = (cls: readonly string[]): number => cls.reduce((m, c) => m | (c === '1' ? 1 : c === '2' ? 2 : c === '3' ? 4 : 0), 0);
const exclusiveTo = (to: number | null): number | null => (to === null ? null : to + 1);
const overlaps = (from: number | null, to: number | null, w: Range): boolean => (from ?? -Infinity) <= w[1] && (to ?? Infinity) >= w[0];

/** Compiles one game's bundle from a loaded dataset. Throws CompileError listing every refusal. */
export function compileBundle(ds: Dataset, manifest: Manifest, opts: CompileOptions): { bundle: ReadyBundle; json: string } {
  const why: string[] = [];
  const game = manifest.game;
  if (manifest.status === 'awaiting-data') why.push('the manifest status is "awaiting-data"');
  const winIso = manifest.window ?? manifest.calendarWindow;
  let window: Range | null = null;
  try { if (winIso) window = [dayFromIso(winIso[0]), dayFromIso(winIso[1])]; } catch (e) { why.push(`window: ${(e as Error).message}`); }
  if (!winIso) why.push('the manifest gives neither window nor calendarWindow');
  else if (window && window[0] > window[1]) why.push('the window ends before it starts');
  let calWindow: Range | null = null;
  try { if (manifest.calendarWindow) calWindow = [dayFromIso(manifest.calendarWindow[0]), dayFromIso(manifest.calendarWindow[1])]; } catch (e) { why.push(`calendarWindow: ${(e as Error).message}`); }
  const segIds = new Set(ds.t.segments.map((s) => s.segment_id));
  const edById = new Map(ds.t.editions.map((e) => [e.edition_id, e]));
  for (const s of manifest.segments) if (!segIds.has(s)) why.push(`segment ${s} is not in segments.csv`);
  for (const e of manifest.editions) if (!edById.has(e)) why.push(`edition ${e} is not in editions.csv`);
  if (opts.validate !== false) {
    const errs = errorsOf(runSuite(ds).issues);
    if (errs.length) why.push(`${errs.length} validation error(s); run tools/validate/run.ts. First: ${formatIssue(errs[0]!)}`);
  }
  const synth = ds.t.sources.filter((s) => s.source_id.startsWith('SYN_')).map((s) => s.source_id);
  if (synth.length && !opts.synthetic) why.push(`synthetic sources (${synth.join(', ')}) need --synthetic, and such bundles never ship`);
  if (why.length || !window) throw new CompileError(game, why);
  const W = window;

  // Trips and stops.
  const sbs = stopsByService(ds);
  const wantSeg = new Set(manifest.segments);
  const wantEd = new Set(manifest.editions);
  const services: ServiceRow[] = ds.t.services
    .filter((s) => wantEd.has(s.edition_id) && s.segment_ids.some((g) => wantSeg.has(g)))
    .sort((a, b) => cmpStr(a.service_id, b.service_id));
  const tripIds = new Set(services.map((s) => s.service_id));
  for (const s of services) for (const st of sbs.get(s.service_id) ?? []) {
    if (st.status !== 'agree' && st.status !== 'resolved' && st.status !== 'waived') why.push(`stop ${s.service_id} seq ${st.seq} has status ${st.status}`);
  }
  const stationIds = new Set<string>();
  for (const s of services) for (const st of sbs.get(s.service_id) ?? []) stationIds.add(st.station_id);
  for (const g of ds.t.segments) if (wantSeg.has(g.segment_id)) { stationIds.add(g.from_station); stationIds.add(g.to_station); }
  const stationById = new Map(ds.t.stations.map((s) => [s.station_id, s]));
  for (const id of [...stationIds]) { const p = stationById.get(id)?.frontier_pair_id; if (p && stationById.has(p)) stationIds.add(p); }
  const stations = [...stationIds].sort(cmpStr).map((id) => stationById.get(id)).filter((s) => s !== undefined);
  const stIndex = new Map(stations.map((s, i) => [s.station_id, i]));

  // Citations: collected as text, numbered after sorting.
  const citeText = new Map<string, Citation>();
  const citeKey = (c: { source: string; pageSeq: number; tableRef: string | null }) => `${c.source}\u0000${String(c.pageSeq).padStart(8, '0')}\u0000${c.tableRef ?? ''}`;
  const pages = new Map(ds.t.pages.map((p) => [`${p.source_id}:${p.page_seq}`, p]));
  const sources = new Map(ds.t.sources.map((s) => [s.source_id, s]));
  const pending: Array<{ set: (i: number) => void; key: string }> = [];
  const cite = (src: string, set: (i: number) => void, what: string): void => {
    const c = parseCitation(src);
    if (!c) { why.push(`${what}: "${src}" is not a citation`); return; }
    const key = citeKey(c);
    if (!citeText.has(key)) {
      const eds = ds.t.editions.filter((e) => e.source_id === c.source);
      citeText.set(key, {
        source: c.source, sourceTitle: sources.get(c.source)?.title ?? '', edition: eds.length === 1 ? eds[0]!.edition_id : null,
        pageSeq: c.pageSeq, printedPage: pages.get(`${c.source}:${c.pageSeq}`)?.printed_page ?? '', tableRef: c.tableRef,
      });
    }
    pending.push({ set, key });
  };
  const dvUsed = new Set<string>();
  /** cite or dv for a src_or_dv value; design basis must be a DV id. */
  const citeOrDv = (v: string, basis: string, target: { cite?: number; dv?: string }, what: string): void => {
    if (isDvId(v)) { target.dv = v; dvUsed.add(v); if (basis !== 'design') why.push(`${what}: historical row cites a design value`); }
    else if (basis === 'design') why.push(`${what}: design row without a design-value id`);
    else cite(v, (i) => { target.cite = i; }, what);
  };

  const stopCols: StopColumns = { station: [], arr: [], dep: [], arrDay: [], depDay: [], flags: [], cite: [] };
  const trips: TripRow[] = [];
  for (const s of services) {
    const ed = edById.get(s.edition_id)!;
    const stops = sbs.get(s.service_id) ?? [];
    const truth = intersectRanges(truthRanges(ds, s, Math.max(1, W[1] - ed.valid_from + 1)), [W]);
    let run;
    try { run = compileRuleText(s.running_rule, W); } catch (e) { why.push(`${s.service_id}: ${(e as Error).message}`); continue; }
    const trip: TripRow = {
      id: s.service_id, trainKey: s.train_key, edition: s.edition_id, trainNo: s.train_no_as_printed, name: s.name || null,
      operator: s.operator, mode: s.mode, classMask: classMask(s.classes), sleeper: s.sleeper, run, truth,
      firstStop: stopCols.station.length, nStops: stops.length, cite: -1,
    };
    cite(s.src, (i) => { trip.cite = i; }, `service ${s.service_id}`);
    for (const st of stops) {
      const k = stopCols.station.length;
      stopCols.station.push(stIndex.get(st.station_id)!);
      stopCols.arr.push(st.arr_local ? secOfHm(st.arr_local) : -1);
      stopCols.dep.push(st.dep_local ? secOfHm(st.dep_local) : -1);
      stopCols.arrDay.push(st.arr_dayoff ?? st.dep_dayoff ?? 0);
      stopCols.depDay.push(st.dep_dayoff ?? st.arr_dayoff ?? 0);
      stopCols.flags.push(st.flags.reduce((m, f) => m | FLAG_BITS[f], 0));
      stopCols.cite.push(-1);
      cite(st.src, (i) => { stopCols.cite[k] = i; }, `stop ${s.service_id} seq ${st.seq}`);
    }
    trips.push(trip);
  }

  // Places and clocks.
  const cityIds = new Set(stations.map((s) => s.city_id));
  const cities: CityRow[] = ds.t.cities.filter((c) => cityIds.has(c.city_id)).sort((a, b) => cmpStr(a.city_id, b.city_id))
    .map((c) => ({ id: c.city_id, name: c.name, country: c.country, jurisdiction: c.jur_id, civilZone: c.civil_zone_id }));
  const stationRows: StationRow[] = stations.map((s) => ({
    id: s.station_id, name: s.name, city: s.city_id, country: s.country, frontier: s.is_frontier,
    frontierPair: s.frontier_pair_id && stIndex.has(s.frontier_pair_id) ? s.frontier_pair_id : null,
  }));
  const stationZones: StationZoneRow[] = [];
  for (const r of [...ds.t.station_zones].sort((a, b) => cmpStr(a.station_id, b.station_id) || a.from - b.from || cmpStr(a.zone_id, b.zone_id))) {
    if (!stIndex.has(r.station_id) || !overlaps(r.from, r.to, W)) continue;
    const row: StationZoneRow = { station: r.station_id, zone: r.zone_id, from: r.from, to: exclusiveTo(r.to) };
    cite(r.src, (i) => { row.cite = i; }, `station zone ${r.station_id}`);
    stationZones.push(row);
  }

  // Params, calendar, institutions.
  const wantParam = new Set(manifest.params);
  const events: WorldEventRow[] = [];
  const effectIds = new Set<string>();
  if (calWindow) {
    const cw = calWindow;
    for (const c of ds.t.calendar) {
      const day = c.date_greg ?? c.date_jul;
      if (day === null || day < cw[0] || day > cw[1]) continue;
      const ev: WorldEventRow = {
        id: c.event_id, day, timeLocal: c.time_local ? secOfHm(c.time_local) : null, zone: c.zone_id || null,
        jurisdiction: c.jur_id || null, kind: c.kind, title: c.title, effects: [...c.effects].sort(cmpStr), cite: -1,
      };
      cite(c.src, (i) => { ev.cite = i; }, `event ${c.event_id}`);
      for (const e of c.effects) effectIds.add(e);
      events.push(ev);
    }
  }
  events.sort((a, b) => a.day - b.day || (a.timeLocal ?? -1) - (b.timeLocal ?? -1) || cmpStr(a.id, b.id));
  const params: ParamRow[] = [];
  for (const p of [...ds.t.params].sort((a, b) => cmpStr(a.row_id, b.row_id))) {
    const named = wantParam.has(p.param) || wantParam.has(p.row_id);
    if (!(named && overlaps(p.from, p.to, W)) && !effectIds.has(p.row_id)) continue;
    const row: ParamRow = {
      id: p.row_id, param: p.param, keyKind: p.key_kind, key: p.key, from: p.from, to: exclusiveTo(p.to),
      tier: Number(p.tier) as 0 | 1 | 2, value: p.value_json, dateBasis: p.date_basis, valueBasis: p.value_basis, public: p.public,
    };
    const design = p.date_basis === 'design' || p.value_basis === 'design';
    if (p.src) cite(p.src, (i) => { row.cite = i; }, `param ${p.row_id}`);
    if (p.dv_id) { row.dv = p.dv_id; dvUsed.add(p.dv_id); }
    else if (design) why.push(`param ${p.row_id}: design-basis row without a dv_id`);
    params.push(row);
  }
  for (const n of manifest.params) {
    if (!ds.t.params.some((p) => p.param === n || p.row_id === n)) why.push(`manifest param "${n}" names no params.csv row`);
  }
  const wantInst = manifest.institutions ? new Set(manifest.institutions) : null;
  const institutions: InstitutionRow[] = [];
  for (const r of [...ds.t.institutions].sort((a, b) => cmpStr(a.inst_id, b.inst_id))) {
    if (wantInst ? !wantInst.has(r.inst_id) : !overlaps(r.from, r.to, W)) continue;
    const row: InstitutionRow = {
      id: r.inst_id, name: r.name, nameAsPeriod: r.name_as_period || r.name, kind: r.kind, jurisdiction: r.jur_id,
      city: r.city_id || null, parent: r.parent_id || null, from: r.from, to: exclusiveTo(r.to), readsKinds: [...r.reads_kinds], basis: r.basis,
    };
    citeOrDv(r.src_or_dv, r.basis, row, `institution ${r.inst_id}`);
    institutions.push(row);
  }

  // Zones: railway zones of included stations, civil zones of their cities, zones of events.
  const zoneIds = new Set<string>([...stationZones.map((z) => z.zone), ...cities.map((c) => c.civilZone), ...events.map((e) => e.zone).filter((z): z is string => z !== null)]);
  const zones: ZoneRow[] = [];
  for (const z of [...ds.t.zones].sort((a, b) => cmpStr(a.zone_id, b.zone_id) || a.from - b.from)) {
    if (!zoneIds.has(z.zone_id) || !overlaps(z.from, z.to, W)) continue;
    const row: ZoneRow = { id: z.zone_id, name: z.name, offsetSec: z.offset_seconds, appliesTo: z.applies_to, from: z.from, to: exclusiveTo(z.to) };
    cite(z.src, (i) => { row.cite = i; }, `zone ${z.zone_id}`);
    zones.push(row);
  }

  // Editions, transfers, minimum change, through links, fares.
  const editions: EditionRow[] = [...manifest.editions].sort(cmpStr).map((id) => edById.get(id)!).map((e) => ({
    id: e.edition_id, source: e.source_id, family: e.family, label: e.label, issueDay: e.issue_date ?? e.valid_from, validFrom: e.valid_from, validTo: e.valid_to,
  }));
  const transfers: TransferRow[] = [];
  for (const r of [...ds.t.transfers].sort((a, b) => cmpStr(a.from_station_id, b.from_station_id) || cmpStr(a.to_station_id, b.to_station_id))) {
    if (!stIndex.has(r.from_station_id) || !stIndex.has(r.to_station_id)) continue;
    const row: TransferRow = { from: r.from_station_id, to: r.to_station_id, minSec: r.min_minutes * 60, kind: r.kind, basis: r.basis };
    citeOrDv(r.src_or_dv, r.basis, row, `transfer ${r.from_station_id}→${r.to_station_id}`);
    transfers.push(row);
  }
  const minChange: MinChangeRow[] = [];
  for (const r of [...ds.t.min_change].sort((a, b) => cmpStr(a.station_id, b.station_id))) {
    if (!stIndex.has(r.station_id)) continue;
    const row: MinChangeRow = { station: r.station_id, minSec: r.min_minutes * 60, basis: r.basis };
    citeOrDv(r.src_or_dv, r.basis, row, `min change ${r.station_id}`);
    minChange.push(row);
  }
  const throughLinks: ThroughLinkRow[] = [];
  for (const r of [...ds.t.through_links].sort((a, b) => cmpStr(a.from_service_id, b.from_service_id) || cmpStr(a.to_service_id, b.to_service_id) || cmpStr(a.station_id, b.station_id))) {
    if (!tripIds.has(r.from_service_id) || !tripIds.has(r.to_service_id)) continue;
    const row: ThroughLinkRow = { fromTrip: r.from_service_id, toTrip: r.to_service_id, station: r.station_id, classMask: classMask(r.classes), cite: -1 };
    cite(r.src, (i) => { row.cite = i; }, `through link ${r.from_service_id}→${r.to_service_id}`);
    throughLinks.push(row);
  }
  const fares: FareRow[] = [];
  for (const r of [...ds.t.fares].sort((a, b) => cmpStr(a.edition_id, b.edition_id) || cmpStr(a.from_station_id, b.from_station_id) ||
    cmpStr(a.to_station_id, b.to_station_id) || cmpStr(a.scope, b.scope) || cmpStr(a.class, b.class) || cmpStr(a.single_return, b.single_return))) {
    if (!wantEd.has(r.edition_id) || !stIndex.has(r.from_station_id) || !stIndex.has(r.to_station_id)) continue;
    const row: FareRow = {
      edition: r.edition_id, from: r.from_station_id, to: r.to_station_id, scope: r.scope, cls: r.class, ret: r.single_return === 'r',
      currency: r.currency, amountMinor: r.amount_minor, validityDays: r.validity_days, cite: -1,
    };
    cite(r.src, (i) => { row.cite = i; }, `fare ${r.from_station_id}→${r.to_station_id}`);
    fares.push(row);
  }

  // Design values used.
  const dvById = new Map(ds.designValues.map((d) => [d.id, d]));
  const designValues: DesignValueRow[] = [];
  for (const id of [...dvUsed].sort(cmpStr)) {
    const d = dvById.get(id);
    if (!d) { why.push(`design value ${id} is not in DESIGN_VALUES.md`); continue; }
    designValues.push({ id: d.id, value: d.value, unit: d.unit, rationale: d.rationale });
  }

  if (why.length) throw new CompileError(game, why);

  // Number the citations in sorted order.
  const keys = [...citeText.keys()].sort(cmpStr);
  const index = new Map(keys.map((k, i) => [k, i]));
  for (const p of pending) p.set(index.get(p.key)!);
  const citations = keys.map((k) => citeText.get(k)!);

  const body = {
    stations: stationRows, cities, zones, stationZones, editions, trips, stops: stopCols, transfers, minChange, throughLinks, fares,
    citations, params, calendar: events, institutions, designValues,
  };
  const dataHash = createHash('sha256').update(canonicalJson(body)).digest('hex').slice(0, 16);
  const meta: ReadyBundle['meta'] = { game, status: 'ready', synthetic: opts.synthetic, dataHash, schema: 1, window: [W[0], W[1]] };
  if (manifest.freezeTag) meta.freezeTag = manifest.freezeTag;
  const bundle: ReadyBundle = { meta, ...body };
  return { bundle, json: `${canonicalJson(bundle)}\n` };
}

export interface CliResult { written: string[]; skipped: string[] }

/** Compiles the named games (or all ready manifests) and writes <out>/<game>.bundle.json. */
export function compileGames(args: string[]): CliResult {
  const val = (name: string): string | undefined => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  const synthetic = args.includes('--synthetic');
  const data = resolve(val('--data') ?? join(ROOT, 'data'));
  const out = resolve(val('--out') ?? join(ROOT, 'build', 'data'));
  const manifestPath = val('--manifest');
  const flagsWithValue = new Set(['--data', '--out', '--manifest']);
  const named = args.filter((a, i) => !a.startsWith('--') && !flagsWithValue.has(args[i - 1] ?? ''));
  const jobs: Array<{ path: string; explicit: boolean }> = [];
  if (manifestPath) jobs.push({ path: resolve(manifestPath), explicit: true });
  else if (args.includes('--all')) for (const g of GAMES) jobs.push({ path: join(ROOT, 'games', g, 'data-manifest.json'), explicit: false });
  else {
    if (named.length === 0) throw new Error('usage: compile-bundles.ts <game|c07|c01|c04|--all> [--synthetic] [--data <root>] [--manifest <file>] [--out <dir>]');
    for (const n of named) {
      const g = SHORT[n] ?? (GAMES as readonly string[]).find((x) => x === n);
      if (!g) throw new Error(`unknown game "${n}"`);
      jobs.push({ path: join(ROOT, 'games', g, 'data-manifest.json'), explicit: true });
    }
  }
  const ds = loadDataset(data);
  const res: CliResult = { written: [], skipped: [] };
  for (const job of jobs) {
    if (!existsSync(job.path)) throw new Error(`no manifest ${job.path}`);
    const manifest = parseManifest(readFileSync(job.path, 'utf8'), job.path);
    if (!job.explicit && manifest.status === 'awaiting-data') { res.skipped.push(manifest.game); continue; }
    const { json } = compileBundle(ds, manifest, { synthetic });
    mkdirSync(out, { recursive: true });
    const file = join(out, `${manifest.game}.bundle.json`);
    writeFileSync(file, json);
    res.written.push(file);
  }
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const r = compileGames(process.argv.slice(2));
    for (const g of r.skipped) console.log(`skipped ${g}: manifest status is awaiting-data`);
    for (const f of r.written) console.log(`wrote ${f}`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
