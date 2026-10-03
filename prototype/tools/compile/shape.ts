/**
 * Structural check of a compiled bundle against the kit's ReadyBundle contract
 * (kit/src/data/bundle.ts, kit/src/timetable/types.ts, kit/src/params/types.ts), plus internal
 * consistency: stop columns of equal length, trips' stop ranges inside them, station and
 * citation indices in range, sorted inclusive day ranges, references to included rows.
 * Returns the problems found (empty when the bundle is well formed).
 */
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isIntOrNull = (v: unknown): boolean => v === null || isInt(v);
const isStrOrNull = (v: unknown): boolean => v === null || isStr(v);

export function checkBundleShape(b: unknown): string[] {
  const p: string[] = [];
  const need = (cond: boolean, msg: string) => { if (!cond) p.push(msg); };
  if (!isObj(b)) return ['bundle is not an object'];
  const m = b.meta;
  if (!isObj(m)) return ['meta missing'];
  need(isStr(m.game), 'meta.game');
  need(m.status === 'ready', 'meta.status must be "ready"');
  need(isBool(m.synthetic), 'meta.synthetic');
  need(isStr(m.dataHash) && /^[0-9a-f]{16}$/.test(m.dataHash), 'meta.dataHash must be 16 hex digits');
  need(m.schema === 1, 'meta.schema must be 1');
  need(m.freezeTag === undefined || isStr(m.freezeTag), 'meta.freezeTag');
  need(Array.isArray(m.window) && m.window.length === 2 && m.window.every(isInt) && (m.window[0] as number) <= (m.window[1] as number), 'meta.window');
  const arrays = ['stations', 'cities', 'zones', 'stationZones', 'editions', 'trips', 'transfers', 'minChange', 'throughLinks', 'fares',
    'citations', 'params', 'calendar', 'institutions', 'designValues'] as const;
  for (const k of arrays) if (!Array.isArray(b[k])) p.push(`${k} must be an array`);
  if (p.length) return p;
  const arr = (k: (typeof arrays)[number]) => b[k] as unknown[];
  const nCite = arr('citations').length;
  const citeOk = (v: unknown) => isInt(v) && v >= 0 && v < nCite;
  const optCite = (o: Obj) => o.cite === undefined || citeOk(o.cite);
  const optDv = (o: Obj) => o.dv === undefined || (isStr(o.dv) && /^DV-\d{3,}$/.test(o.dv));
  const each = (k: (typeof arrays)[number], f: (o: Obj, i: number) => string | null) =>
    arr(k).forEach((o, i) => { const r = isObj(o) ? f(o, i) : 'not an object'; if (r) p.push(`${k}[${i}]: ${r}`); });

  const stationIds = new Set<string>();
  each('stations', (o) => {
    if (!isStr(o.id) || !isStr(o.name) || !isStr(o.city) || !isStr(o.country) || !isBool(o.frontier) || !isStrOrNull(o.frontierPair)) return 'bad fields';
    stationIds.add(o.id); return null;
  });
  each('stations', (o) => (o.frontierPair !== null && !stationIds.has(o.frontierPair as string) ? 'frontierPair not in stations' : null));
  each('cities', (o) => (isStr(o.id) && isStr(o.name) && isStr(o.country) && isStr(o.jurisdiction) && isStr(o.civilZone) ? null : 'bad fields'));
  const zoneIds = new Set<string>();
  each('zones', (o) => {
    if (!isStr(o.id) || !isStr(o.name) || !isInt(o.offsetSec) || !(o.appliesTo === 'railway' || o.appliesTo === 'civil') || !isInt(o.from) || !isIntOrNull(o.to) || !optCite(o) || !optDv(o)) return 'bad fields';
    zoneIds.add(o.id); return null;
  });
  each('stationZones', (o) => (isStr(o.station) && stationIds.has(o.station) && isStr(o.zone) && zoneIds.has(o.zone) && isInt(o.from) && isIntOrNull(o.to) && optCite(o) ? null : 'bad fields or unknown station/zone'));
  const editionIds = new Set<string>();
  each('editions', (o) => {
    if (!isStr(o.id) || !isStr(o.source) || !isStr(o.family) || !isStr(o.label) || !isInt(o.issueDay) || !isInt(o.validFrom) || !isIntOrNull(o.validTo)) return 'bad fields';
    editionIds.add(o.id); return null;
  });
  const s = b.stops;
  if (!isObj(s)) return [...p, 'stops must be an object of columns'];
  const cols = ['station', 'arr', 'dep', 'arrDay', 'depDay', 'flags', 'cite'] as const;
  for (const c of cols) if (!Array.isArray(s[c]) || !(s[c] as unknown[]).every(isInt)) p.push(`stops.${c} must be an array of integers`);
  if (p.length) return p;
  const n = (s.station as number[]).length;
  for (const c of cols) need((s[c] as number[]).length === n, `stops.${c} has ${(s[c] as number[]).length} entries, station has ${n}`);
  (s.station as number[]).forEach((x, i) => need(x >= 0 && x < stationIds.size, `stops.station[${i}] out of range`));
  (s.cite as number[]).forEach((x, i) => need(citeOk(x), `stops.cite[${i}] out of range`));
  for (const c of ['arr', 'dep'] as const) (s[c] as number[]).forEach((x, i) => need(x === -1 || (x >= 0 && x < 86400), `stops.${c}[${i}] out of range`));
  (s.flags as number[]).forEach((x, i) => need(x >= 0 && x < 64, `stops.flags[${i}] out of range`));
  const tripIds = new Set<string>();
  const rangesOk = (v: unknown, width: 2 | 3) => Array.isArray(v) && v.every((r) => Array.isArray(r) && r.length === width && r.every(isInt) && (r[0] as number) <= (r[1] as number));
  each('trips', (o) => {
    if (!isStr(o.id) || !isStr(o.trainKey) || !isStr(o.edition) || !isStr(o.trainNo) || !isStrOrNull(o.name) || !isStr(o.operator)) return 'bad text fields';
    if (!(o.mode === 'rail' || o.mode === 'steamer' || o.mode === 'ferry')) return 'bad mode';
    if (!isInt(o.classMask) || o.classMask < 0 || o.classMask > 7 || !isBool(o.sleeper) || !citeOk(o.cite)) return 'bad classMask, sleeper or cite';
    if (!editionIds.has(o.edition)) return `edition ${o.edition} not in editions`;
    const run = o.run;
    if (!isObj(run) || !rangesOk(run.ranges, 3) || !Array.isArray(run.also) || !run.also.every(isInt) || !Array.isArray(run.except) || !run.except.every(isInt)) return 'bad run rule';
    if ((run.ranges as number[][]).some((r) => r[2]! < 0 || r[2]! > 127)) return 'bad weekday mask';
    if (!rangesOk(o.truth, 2)) return 'bad truth ranges';
    if (!isInt(o.firstStop) || !isInt(o.nStops) || o.firstStop < 0 || o.nStops < 1 || o.firstStop + o.nStops > n) return 'stop range outside the stop columns';
    tripIds.add(o.id); return null;
  });
  const basisOk = (o: Obj) => (o.basis === 'historical' ? citeOk(o.cite) && o.dv === undefined : o.basis === 'design' ? optDv(o) && isStr(o.dv) && o.cite === undefined : false);
  each('transfers', (o) => (isStr(o.from) && stationIds.has(o.from) && isStr(o.to) && stationIds.has(o.to) && isInt(o.minSec) && o.minSec >= 0 &&
    ['same-station', 'cross-city', 'frontier-change', 'gauge-change', 'pier'].includes(o.kind as string) && basisOk(o) ? null : 'bad fields'));
  each('minChange', (o) => (isStr(o.station) && stationIds.has(o.station) && isInt(o.minSec) && o.minSec >= 0 && basisOk(o) ? null : 'bad fields'));
  each('throughLinks', (o) => (isStr(o.fromTrip) && tripIds.has(o.fromTrip) && isStr(o.toTrip) && tripIds.has(o.toTrip) && isStr(o.station) && stationIds.has(o.station) &&
    isInt(o.classMask) && citeOk(o.cite) ? null : 'bad fields or unknown trip'));
  each('fares', (o) => (isStr(o.edition) && editionIds.has(o.edition) && isStr(o.from) && stationIds.has(o.from) && isStr(o.to) && stationIds.has(o.to) &&
    ['table', 'train', 'through'].includes(o.scope as string) && ['1', '2', '3', 'sleeper', 'boat'].includes(o.cls as string) && isBool(o.ret) &&
    isStr(o.currency) && isInt(o.amountMinor) && o.amountMinor > 0 && isIntOrNull(o.validityDays) && citeOk(o.cite) ? null : 'bad fields'));
  each('citations', (o) => (isStr(o.source) && isStr(o.sourceTitle) && isStrOrNull(o.edition) && isInt(o.pageSeq) && isStr(o.printedPage) && isStrOrNull(o.tableRef) ? null : 'bad fields'));
  const paramIds = new Set<string>();
  each('params', (o) => {
    if (!isStr(o.id) || !isStr(o.param) || !isStr(o.key) || !isInt(o.from) || !isIntOrNull(o.to) || !isBool(o.public) || !('value' in o)) return 'bad fields';
    if (!['edge', 'jurisdiction', 'institution', 'station', 'pair', 'currency', 'global'].includes(o.keyKind as string)) return 'bad keyKind';
    if (!(o.tier === 0 || o.tier === 1 || o.tier === 2)) return 'bad tier';
    if (!['historical', 'design'].includes(o.dateBasis as string) || !['historical', 'design'].includes(o.valueBasis as string)) return 'bad basis';
    if (!optCite(o) || !optDv(o) || (o.cite === undefined && o.dv === undefined)) return 'needs cite or dv';
    paramIds.add(o.id); return null;
  });
  each('calendar', (o) => (isStr(o.id) && isInt(o.day) && isIntOrNull(o.timeLocal) && isStrOrNull(o.zone) && isStrOrNull(o.jurisdiction) && isStr(o.kind) && isStr(o.title) &&
    Array.isArray(o.effects) && o.effects.every((e) => isStr(e) && paramIds.has(e)) && citeOk(o.cite) ? null : 'bad fields or effect not in params'));
  each('institutions', (o) => (isStr(o.id) && isStr(o.name) && isStr(o.nameAsPeriod) && isStr(o.kind) && isStr(o.jurisdiction) && isStrOrNull(o.city) && isStrOrNull(o.parent) &&
    isInt(o.from) && isIntOrNull(o.to) && Array.isArray(o.readsKinds) && o.readsKinds.every(isStr) && ['historical', 'design'].includes(o.basis as string) && optCite(o) && optDv(o) ? null : 'bad fields'));
  const dvIds = new Set<string>();
  each('designValues', (o) => { if (!isStr(o.id) || !isStr(o.unit) || !isStr(o.rationale) || !('value' in o)) return 'bad fields'; dvIds.add(o.id); return null; });
  for (const k of ['transfers', 'minChange', 'params', 'institutions', 'zones'] as const) {
    each(k, (o) => (o.dv !== undefined && !dvIds.has(o.dv as string) ? `design value ${String(o.dv)} not in designValues` : null));
  }
  return p;
}
