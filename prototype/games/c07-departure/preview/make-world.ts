/**
 * The invented world of the C07 mechanics preview (Decision P-006): three invented countries,
 * their railways, two editions of one invented guide plus a cheaper local guide, and every
 * parameter the rules read. Nothing here is history: all ids start with SYN_, every display name
 * is invented, and citations point only to the invented "Preview guide". The output is a
 * ReadyBundle with meta.synthetic = true, which release builds refuse.
 *
 *   node games/c07-departure/preview/make-world.ts        # writes preview/world.bundle.json
 *
 * Deterministic: no clock, no unkeyed randomness (the few varied values use keyed draws).
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReadyBundle, Citation, DesignValueRow } from '../../../kit/src/data/bundle.ts';
import type { TripRow, StationRow, CityRow, ZoneRow, StationZoneRow, EditionRow, TransferRow, MinChangeRow, ThroughLinkRow, FareRow, StopColumns, Mode } from '../../../kit/src/timetable/types.ts';
import type { ParamRow, WorldEventRow, InstitutionRow } from '../../../kit/src/params/types.ts';
import { dayFromGregorian } from '../../../kit/src/time/calendar.ts';
import { belowN } from '../../../kit/src/rng/draw.ts';
import { canonicalJson } from '../../../kit/src/sim/canonical.ts';
import { hash64 } from '../../../kit/src/sim/hash.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WORLD_FILE = join(HERE, 'world.bundle.json');
const SEED = 0x1914;
const draw = (n: number, ...ids: Array<string | number>): number => belowN(n, SEED, 'preview-world', ...ids);

const D = (m: number, d: number): number => dayFromGregorian(1914, m, d);
export const WINDOW: [number, number] = [D(4, 18), D(5, 12)];
export const CHANGEOVER = D(5, 1);
const hhmm = (s: string): number => { const [h, m] = s.split(':').map(Number); return h! * 3600 + m! * 60; };

// ---------------------------------------------------------------- places
interface Country { id: string; jur: string; name: string; cur: string; unit: string; zone: string; offset: number }
export const COUNTRIES: Country[] = [
  { id: 'SYN_CV', jur: 'SYN_J_CV', name: 'Corvenia', cur: 'SYN_CVN', unit: 'cv.', zone: 'SYN_Z_CV', offset: 1200 },
  { id: 'SYN_AR', jur: 'SYN_J_AR', name: 'Ardesia', cur: 'SYN_THL', unit: 'th.', zone: 'SYN_Z_AR', offset: 3600 },
  // Varnholm railway time is 1 h 45 min 13 s east of Greenwich: the odd-second offset.
  { id: 'SYN_VH', jur: 'SYN_J_VH', name: 'Varnholm', cur: 'SYN_VRN', unit: 'vn.', zone: 'SYN_Z_VH', offset: 6313 },
];
const country = (id: string): Country => COUNTRIES.find((c) => c.id === id)!;

interface CityDef { id: string; name: string; c: string; game: boolean }
const CITY_DEFS: CityDef[] = [
  { id: 'SYN_C_AUB', name: 'Aubrevaux', c: 'SYN_CV', game: true },
  { id: 'SYN_C_COR', name: 'Corlaine', c: 'SYN_CV', game: true },
  { id: 'SYN_C_PAN', name: 'Port-Ancel', c: 'SYN_CV', game: true },
  { id: 'SYN_C_VEL', name: 'Vellois', c: 'SYN_CV', game: false },
  { id: 'SYN_C_STH', name: 'Steinhag', c: 'SYN_AR', game: false },
  { id: 'SYN_C_QUE', name: 'Quellingen', c: 'SYN_AR', game: true },
  { id: 'SYN_C_TOL', name: 'Tolvenberg', c: 'SYN_AR', game: true },
  { id: 'SYN_C_EBB', name: 'Ebbenhall', c: 'SYN_AR', game: true },
  { id: 'SYN_C_KES', name: 'Kessling', c: 'SYN_AR', game: false },
  { id: 'SYN_C_VBY', name: 'Varnby', c: 'SYN_VH', game: false },
  { id: 'SYN_C_HOL', name: 'Holmvara', c: 'SYN_VH', game: true },
  { id: 'SYN_C_SKA', name: 'Skarnvik', c: 'SYN_VH', game: true },
];
export const GAME_CITIES = CITY_DEFS.filter((c) => c.game).map((c) => c.id);

interface StationDef { id: string; name: string; city: string; frontier?: string }
const STATION_DEFS: StationDef[] = [
  { id: 'SYN_S_AUBN', name: 'Aubrevaux-Nord', city: 'SYN_C_AUB' },
  { id: 'SYN_S_AUBO', name: 'Aubrevaux-Ouest', city: 'SYN_C_AUB' },
  { id: 'SYN_S_COR', name: 'Corlaine', city: 'SYN_C_COR' },
  { id: 'SYN_S_PAN', name: 'Port-Ancel Quai', city: 'SYN_C_PAN', frontier: 'SYN_FP_SEA' },
  { id: 'SYN_S_VEL', name: 'Vellois-Frontière', city: 'SYN_C_VEL', frontier: 'SYN_FP_CA' },
  { id: 'SYN_S_STH', name: 'Steinhag Grenzbahnhof', city: 'SYN_C_STH', frontier: 'SYN_FP_CA' },
  { id: 'SYN_S_QUE', name: 'Quellingen Hauptbahnhof', city: 'SYN_C_QUE' },
  { id: 'SYN_S_TOLW', name: 'Tolvenberg Westbahnhof', city: 'SYN_C_TOL' },
  { id: 'SYN_S_TOLN', name: 'Tolvenberg Nordbahnhof', city: 'SYN_C_TOL' },
  { id: 'SYN_S_EBB', name: 'Ebbenhall Hafen', city: 'SYN_C_EBB', frontier: 'SYN_FP_LAKE' },
  { id: 'SYN_S_KES', name: 'Kessling', city: 'SYN_C_KES', frontier: 'SYN_FP_AV' },
  { id: 'SYN_S_VBY', name: 'Varnby', city: 'SYN_C_VBY', frontier: 'SYN_FP_AV' },
  { id: 'SYN_S_HOL', name: 'Holmvara Central', city: 'SYN_C_HOL' },
  { id: 'SYN_S_SKA', name: 'Skarnvik Pier', city: 'SYN_C_SKA', frontier: 'SYN_FP_SEA' },
];
const cityOf = (st: string): CityDef => CITY_DEFS.find((c) => c.id === STATION_DEFS.find((s) => s.id === st)!.city)!;
const countryOfStation = (st: string): Country => country(cityOf(st).c);

// ---------------------------------------------------------------- guides and citations
const SRC = 'SYN_SRC_PREVIEW_GUIDE';
const SRC_LOCAL = 'SYN_SRC_PREVIEW_LOCAL';
export const ED_W = 'SYN_E_W14';
export const ED_S = 'SYN_E_S14';
export const ED_L = 'SYN_E_L14';
const editions: EditionRow[] = [
  { id: ED_W, source: SRC, family: 'SYN_F_PREVIEW', label: 'Preview guide (invented), winter edition 1913–14', issueDay: dayFromGregorian(1913, 11, 1), validFrom: dayFromGregorian(1913, 11, 1), validTo: D(4, 30) },
  { id: ED_S, source: SRC, family: 'SYN_F_PREVIEW', label: 'Preview guide (invented), summer edition 1914', issueDay: D(4, 24), validFrom: CHANGEOVER, validTo: null },
  { id: ED_L, source: SRC_LOCAL, family: 'SYN_F_LOCAL', label: 'Corvenian local guide (invented), summer 1914', issueDay: D(4, 26), validFrom: CHANGEOVER, validTo: null },
];

const citations: Citation[] = [];
const cite = (edition: string, printedPage: string, tableRef: string | null): number => {
  const title = edition === ED_W ? 'Preview guide (invented), winter edition' : edition === ED_S ? 'Preview guide (invented), summer edition' : 'Corvenian local guide (invented), summer edition';
  const source = edition === ED_L ? SRC_LOCAL : SRC;
  const i = citations.findIndex((c) => c.edition === edition && c.printedPage === printedPage && c.tableRef === tableRef);
  if (i >= 0) return i;
  citations.push({ source, sourceTitle: title, edition, pageSeq: citations.length + 1, printedPage, tableRef });
  return citations.length - 1;
};
const PRELIM = (): number => cite(ED_W, 'iv', null); // "Regulations, money, posts and telegraphs"
const PRELIM_S = (): number => cite(ED_S, 'iv', null);
const TABLE_PAGE: Record<string, [string, string]> = {
  main: ['12', 'SYN_TB_MAIN'], north: ['14', 'SYN_TB_NORTH'], coast: ['16', 'SYN_TB_COAST'], lake: ['18', 'SYN_TB_LAKE'],
};

// ---------------------------------------------------------------- trains
const OPS = {
  CVR: 'SYN_O_CVR', // Corvenian State Railways
  ARR: 'SYN_O_ARR', // Ardesian State Railways
  VHR: 'SYN_O_VHR', // Varnholm Railways
  VSP: 'SYN_O_VSP', // Varnholm Steam Packet Company
  MSC: 'SYN_O_MSC', // Meridian Sleeping-Car Company
  EBL: 'SYN_O_EBL', // Ebbenhall Light Railway (private)
};
const CUSTOMS = 1; const PASSPORT = 2;

interface Hop { st: string; run: number; dwell?: number; flags?: number }
interface TrainSpec {
  key: string; no: string; name: string | null; op: string; mode?: Mode; cls: number; sleeper?: boolean;
  table: keyof typeof TABLE_PAGE; from: string; dep: string; hops: Hop[]; mask?: number;
}
type Variant = { mask?: number; shiftMin?: number; extraDwellAt?: { st: string; min: number } } | 'withdrawn';
interface TrainDef { spec: TrainSpec; winter: Variant | 'absent'; summer: Variant | 'absent'; local?: boolean }

const MON_WED_FRI = 1 | 4 | 16;
const TUE_THU_SAT = 2 | 8 | 32;
const MON_SAT = 63;

// Run minutes between consecutive stations (express; ordinaries run slower).
const EXP = { 'AUBN-COR': 120, 'COR-VEL': 85, 'VEL-STH': 12, 'STH-QUE': 115, 'QUE-TOLW': 150, 'TOLN-KES': 170, 'KES-VBY': 12, 'VBY-HOL': 160 };
const ORD = { 'AUBN-COR': 155, 'COR-VEL': 110, 'VEL-STH': 15, 'STH-QUE': 150, 'QUE-TOLW': 190, 'TOLN-KES': 210, 'KES-VBY': 15, 'VBY-HOL': 200 };

const S = (k: string): string => `SYN_S_${k}`;
function line(path: string[], speed: typeof EXP, flagsAt: Record<string, number>, dwell: Record<string, number>): Hop[] {
  const hops: Hop[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!; const b = path[i]!;
    const run = (speed as Record<string, number>)[`${a}-${b}`] ?? (speed as Record<string, number>)[`${b}-${a}`];
    if (run === undefined) throw new Error(`No run time ${a}-${b}`);
    hops.push({ st: S(b), run, dwell: i < path.length - 1 ? (dwell[b] ?? 3) : 0, flags: flagsAt[b] ?? 0 });
  }
  return hops;
}
const MAIN_E = ['AUBN', 'COR', 'VEL', 'STH', 'QUE', 'TOLW'];
const MAIN_W = [...MAIN_E].reverse();
const NORTH_E = ['TOLN', 'KES', 'VBY', 'HOL'];
const NORTH_W = [...NORTH_E].reverse();
const FRONT_DWELL = { VEL: 20, STH: 25, KES: 20, VBY: 25 };
const EAST_FLAGS = { STH: CUSTOMS | PASSPORT };
const WEST_FLAGS = { VEL: CUSTOMS };
const NORTH_E_FLAGS = { VBY: CUSTOMS | PASSPORT };
const NORTH_W_FLAGS = { KES: CUSTOMS | PASSPORT };
const sub = (path: string[], from: string, to: string): string[] => path.slice(path.indexOf(from), path.indexOf(to) + 1);

const same: Variant = {};
const TRAINS: TrainDef[] = [
  // Main line, eastbound
  { spec: { key: 'SYN_K_MERID_E', no: 'M 1', name: 'Meridian Express', op: OPS.MSC, cls: 3, sleeper: true, table: 'main', from: S('AUBN'), dep: '21:30', hops: line(MAIN_E, EXP, EAST_FLAGS, FRONT_DWELL) },
    winter: { mask: MON_WED_FRI }, summer: { mask: 127 } },
  { spec: { key: 'SYN_K_D11', no: 'D 11', name: 'Tolvenberg Express', op: OPS.ARR, cls: 3, table: 'main', from: S('AUBN'), dep: '08:10', hops: line(MAIN_E, EXP, EAST_FLAGS, FRONT_DWELL) },
    winter: same, summer: { shiftMin: -30 } },
  { spec: { key: 'SYN_K_D15', no: 'D 15', name: 'Corvenian Mail', op: OPS.ARR, cls: 7, table: 'main', from: S('AUBN'), dep: '12:20', hops: line(MAIN_E, EXP, EAST_FLAGS, FRONT_DWELL) },
    winter: same, summer: { extraDwellAt: { st: S('QUE'), min: 15 } } },
  { spec: { key: 'SYN_K_O31', no: '31', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('AUBN'), dep: '06:20', hops: line(sub(MAIN_E, 'AUBN', 'VEL'), ORD, {}, {}) },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O35', no: '35', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('AUBN'), dep: '13:00', hops: line(sub(MAIN_E, 'AUBN', 'VEL'), ORD, {}, {}) },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O37', no: '37', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('VEL'), dep: '11:05', hops: line(sub(MAIN_E, 'VEL', 'TOLW'), ORD, EAST_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O39', no: '39', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('VEL'), dep: '18:05', hops: line(sub(MAIN_E, 'VEL', 'QUE'), ORD, EAST_FLAGS, FRONT_DWELL) },
    winter: same, summer: { mask: MON_SAT } },
  { spec: { key: 'SYN_K_O51', no: '51', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('QUE'), dep: '07:00', hops: line(['QUE', 'TOLW'], ORD, {}, {}) },
    winter: same, summer: 'withdrawn' },
  { spec: { key: 'SYN_K_O53', no: '53', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('QUE'), dep: '12:10', hops: line(['QUE', 'TOLW'], ORD, {}, {}) },
    winter: 'absent', summer: same },
  { spec: { key: 'SYN_K_O55', no: '55', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('QUE'), dep: '17:30', hops: line(['QUE', 'TOLW'], ORD, {}, {}) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O33', no: '33', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('AUBN'), dep: '17:45', hops: line(['AUBN', 'COR'], ORD, {}, {}) },
    winter: same, summer: same, local: true },
  // Main line, westbound
  { spec: { key: 'SYN_K_MERID_W', no: 'M 2', name: 'Meridian Express', op: OPS.MSC, cls: 3, sleeper: true, table: 'main', from: S('TOLW'), dep: '20:10', hops: line(MAIN_W, EXP, WEST_FLAGS, FRONT_DWELL) },
    winter: { mask: TUE_THU_SAT }, summer: { mask: 127 } },
  { spec: { key: 'SYN_K_D12', no: 'D 12', name: 'Tolvenberg Express', op: OPS.ARR, cls: 3, table: 'main', from: S('TOLW'), dep: '07:50', hops: line(MAIN_W, EXP, WEST_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_D16', no: 'D 16', name: 'Corvenian Mail', op: OPS.ARR, cls: 7, table: 'main', from: S('TOLW'), dep: '13:05', hops: line(MAIN_W, EXP, WEST_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O38', no: '38', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('TOLW'), dep: '05:50', hops: line(sub(MAIN_W, 'TOLW', 'VEL'), ORD, WEST_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O32', no: '32', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('VEL'), dep: '13:10', hops: line(sub(MAIN_W, 'VEL', 'AUBN'), ORD, {}, {}) },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O34', no: '34', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('COR'), dep: '07:10', hops: line(['COR', 'AUBN'], ORD, {}, {}) },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O36', no: '36', name: null, op: OPS.CVR, cls: 7, table: 'main', from: S('COR'), dep: '16:40', hops: line(['COR', 'AUBN'], ORD, {}, {}) },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O52', no: '52', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('TOLW'), dep: '16:20', hops: line(['TOLW', 'QUE'], ORD, {}, {}) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O54', no: '54', name: null, op: OPS.ARR, cls: 7, table: 'main', from: S('TOLW'), dep: '09:40', hops: line(['TOLW', 'QUE'], ORD, {}, {}) },
    winter: same, summer: same },
  // Northern line (Tolvenberg Nordbahnhof – Holmvara)
  { spec: { key: 'SYN_K_N1', no: 'N 1', name: 'Northern Express', op: OPS.ARR, cls: 7, table: 'north', from: S('TOLN'), dep: '09:15', hops: line(NORTH_E, EXP, NORTH_E_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_N3', no: 'N 3', name: 'Varnholm Night Mail', op: OPS.MSC, cls: 3, sleeper: true, table: 'north', from: S('TOLN'), dep: '22:05', hops: line(NORTH_E, EXP, NORTH_E_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O61', no: '61', name: null, op: OPS.ARR, cls: 7, table: 'north', from: S('TOLN'), dep: '06:40', hops: line(['TOLN', 'KES'], ORD, {}, {}) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O63', no: '63', name: null, op: OPS.VHR, cls: 7, table: 'north', from: S('VBY'), dep: '11:30', hops: line(['VBY', 'HOL'], ORD, {}, {}) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_N2', no: 'N 2', name: 'Northern Express', op: OPS.ARR, cls: 7, table: 'north', from: S('HOL'), dep: '08:30', hops: line(NORTH_W, EXP, NORTH_W_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_N4', no: 'N 4', name: 'Varnholm Night Mail', op: OPS.MSC, cls: 3, sleeper: true, table: 'north', from: S('HOL'), dep: '21:40', hops: line(NORTH_W, EXP, NORTH_W_FLAGS, FRONT_DWELL) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O62', no: '62', name: null, op: OPS.VHR, cls: 7, table: 'north', from: S('HOL'), dep: '06:15', hops: line(['HOL', 'VBY'], ORD, {}, {}) },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_O64', no: '64', name: null, op: OPS.ARR, cls: 7, table: 'north', from: S('KES'), dep: '11:00', hops: line(['KES', 'TOLN'], ORD, {}, {}) },
    winter: same, summer: same },
  // Coast: boat trains, the night packet across the sea, Skarnvik–Holmvara
  { spec: { key: 'SYN_K_B1', no: 'B 1', name: 'Boat Train', op: OPS.CVR, cls: 3, table: 'coast', from: S('AUBO'), dep: '17:10', hops: [{ st: S('PAN'), run: 150 }] },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_B2', no: 'B 2', name: 'Boat Train', op: OPS.CVR, cls: 3, table: 'coast', from: S('PAN'), dep: '12:20', hops: [{ st: S('AUBO'), run: 150 }] },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O41', no: '41', name: null, op: OPS.CVR, cls: 7, table: 'coast', from: S('AUBO'), dep: '07:30', hops: [{ st: S('PAN'), run: 190 }] },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O43', no: '43', name: null, op: OPS.CVR, cls: 7, table: 'coast', from: S('AUBO'), dep: '11:00', hops: [{ st: S('PAN'), run: 190 }] },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_O42', no: '42', name: null, op: OPS.CVR, cls: 7, table: 'coast', from: S('PAN'), dep: '15:00', hops: [{ st: S('AUBO'), run: 190 }] },
    winter: same, summer: same, local: true },
  { spec: { key: 'SYN_K_S1', no: 'S 1', name: 'Night Packet', op: OPS.VSP, mode: 'steamer', cls: 3, table: 'coast', from: S('PAN'), dep: '21:00', hops: [{ st: S('SKA'), run: 840, flags: CUSTOMS | PASSPORT }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_S2', no: 'S 2', name: 'Night Packet', op: OPS.VSP, mode: 'steamer', cls: 3, table: 'coast', from: S('SKA'), dep: '20:30', hops: [{ st: S('PAN'), run: 840, flags: CUSTOMS }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_R71', no: '71', name: null, op: OPS.VHR, cls: 7, table: 'coast', from: S('SKA'), dep: '13:30', hops: [{ st: S('HOL'), run: 130 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_R73', no: '73', name: null, op: OPS.VHR, cls: 7, table: 'coast', from: S('SKA'), dep: '17:20', hops: [{ st: S('HOL'), run: 130 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_R72', no: '72', name: null, op: OPS.VHR, cls: 7, table: 'coast', from: S('HOL'), dep: '07:10', hops: [{ st: S('SKA'), run: 130 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_R74', no: '74', name: null, op: OPS.VHR, cls: 7, table: 'coast', from: S('HOL'), dep: '15:50', hops: [{ st: S('SKA'), run: 130 }] },
    winter: same, summer: same },
  // The lake: Ebbenhall Light Railway and the day steamer to Skarnvik
  { spec: { key: 'SYN_K_L81', no: 'L 81', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('QUE'), dep: '08:20', hops: [{ st: S('EBB'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_L83', no: 'L 83', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('QUE'), dep: '15:40', hops: [{ st: S('EBB'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_L85', no: 'L 85', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('QUE'), dep: '19:10', hops: [{ st: S('EBB'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_L82', no: 'L 82', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('EBB'), dep: '06:30', hops: [{ st: S('QUE'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_L84', no: 'L 84', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('EBB'), dep: '11:40', hops: [{ st: S('QUE'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_L86', no: 'L 86', name: null, op: OPS.EBL, cls: 6, table: 'lake', from: S('EBB'), dep: '17:10', hops: [{ st: S('QUE'), run: 140 }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_S3', no: 'S 3', name: 'Lake Steamer', op: OPS.VSP, mode: 'steamer', cls: 3, table: 'lake', from: S('EBB'), dep: '09:00', hops: [{ st: S('SKA'), run: 360, flags: CUSTOMS | PASSPORT }] },
    winter: same, summer: same },
  { spec: { key: 'SYN_K_S4', no: 'S 4', name: 'Lake Steamer', op: OPS.VSP, mode: 'steamer', cls: 3, table: 'lake', from: S('SKA'), dep: '08:00', hops: [{ st: S('EBB'), run: 360, flags: CUSTOMS | PASSPORT }] },
    winter: same, summer: same },
];

const stationOffset = (st: string): number => countryOfStation(st).offset;

interface BuiltStop { station: string; arr: number; dep: number; arrDay: number; depDay: number; flags: number }

/** Printed local times from an origin departure and run/dwell minutes, rounded to the minute. */
function buildStops(spec: TrainSpec, v: Exclude<Variant, 'withdrawn'>): BuiltStop[] {
  const shift = (v.shiftMin ?? 0) * 60;
  const offFrom = stationOffset(spec.from);
  let t = hhmm(spec.dep) + shift - offFrom; // seconds after 00:00 GMT of the service day
  const split = (local: number): [number, number] => { const d = Math.floor(local / 86400); return [local - d * 86400, d]; };
  const [d0, dd0] = split(t + offFrom);
  const out: BuiltStop[] = [{ station: spec.from, arr: -1, dep: d0, arrDay: 0, depDay: dd0, flags: 0 }];
  spec.hops.forEach((h, i) => {
    const off = stationOffset(h.st);
    const arrLocal = Math.round((t + h.run * 60 + off) / 60) * 60;
    const last = i === spec.hops.length - 1;
    let dwell = (h.dwell ?? 0) * 60;
    if (v.extraDwellAt && v.extraDwellAt.st === h.st) dwell += v.extraDwellAt.min * 60;
    const depLocal = arrLocal + dwell;
    const [a, ad] = split(arrLocal);
    const [d, dd] = split(depLocal);
    out.push({ station: h.st, arr: a, dep: last ? -1 : d, arrDay: ad, depDay: last ? 0 : dd, flags: h.flags ?? 0 });
    t = depLocal - off;
  });
  return out;
}

const trips: TripRow[] = [];
const stops: StopColumns = { station: [], arr: [], dep: [], arrDay: [], depDay: [], flags: [], cite: [] };
const stationIndex = new Map(STATION_DEFS.map((s, i) => [s.id, i] as const));
const tripIdOf = (ed: string, key: string): string => `SYN_T_${ed.slice(6)}_${key.slice(6)}`;
const RUN_FROM = WINDOW[0] - 7; const RUN_TO = WINDOW[1] + 7;

function addTrip(def: TrainDef, ed: string, v: Exclude<Variant, 'withdrawn'>, truth: Array<[number, number]>): void {
  const s = def.spec;
  const built = buildStops(s, v);
  const [page, table] = TABLE_PAGE[s.table]!;
  const c = cite(ed, ed === ED_L ? '3' : page, ed === ED_L ? 'SYN_TB_LOCAL' : table);
  const firstStop = stops.station.length;
  for (const b of built) {
    stops.station.push(stationIndex.get(b.station)!); stops.arr.push(b.arr); stops.dep.push(b.dep);
    stops.arrDay.push(b.arrDay); stops.depDay.push(b.depDay); stops.flags.push(b.flags); stops.cite.push(c);
  }
  trips.push({
    id: tripIdOf(ed, s.key), trainKey: s.key, edition: ed, trainNo: s.no, name: s.name, operator: s.op, mode: s.mode ?? 'rail',
    classMask: s.cls, sleeper: s.sleeper ?? false, run: { ranges: [[RUN_FROM, RUN_TO, v.mask ?? s.mask ?? 127]], also: [], except: [] },
    truth, firstStop, nStops: built.length, cite: c,
  });
}

for (const def of TRAINS) {
  if (def.winter !== 'absent' && def.winter !== 'withdrawn') addTrip(def, ED_W, def.winter, [[RUN_FROM, CHANGEOVER - 1]]);
  if (def.summer !== 'absent' && def.summer !== 'withdrawn') addTrip(def, ED_S, def.summer, [[CHANGEOVER, RUN_TO]]);
}
// The local guide prints the summer Corvenian trains only (no truth of its own).
for (const def of TRAINS) if (def.local && def.summer !== 'absent' && def.summer !== 'withdrawn') addTrip(def, ED_L, def.summer, []);

// The station's index in stops must match the station list order used by the kit.
const stations: StationRow[] = STATION_DEFS.map((s) => ({
  id: s.id, name: s.name, city: s.city, country: cityOf(s.id).c, frontier: s.frontier !== undefined, frontierPair: s.frontier ?? null,
}));
const cities: CityRow[] = CITY_DEFS.map((c) => ({ id: c.id, name: c.name, country: c.c, jurisdiction: country(c.c).jur, civilZone: `${country(c.c).zone}_CIV` }));
const zones: ZoneRow[] = COUNTRIES.flatMap((c) => [
  { id: c.zone, name: `${c.name} railway time`, offsetSec: c.offset, appliesTo: 'railway' as const, from: 0, to: null, cite: PRELIM() },
  { id: `${c.zone}_CIV`, name: `${c.name} civil time`, offsetSec: c.offset, appliesTo: 'civil' as const, from: 0, to: null, cite: PRELIM() },
]);
const stationZones: StationZoneRow[] = STATION_DEFS.map((s) => ({ station: s.id, zone: countryOfStation(s.id).zone, from: 0, to: null, cite: PRELIM() }));

const transfers: TransferRow[] = [
  { from: S('AUBN'), to: S('AUBO'), minSec: 2400, kind: 'cross-city', basis: 'design', dv: 'DV-SYN-001' },
  { from: S('AUBO'), to: S('AUBN'), minSec: 2400, kind: 'cross-city', basis: 'design', dv: 'DV-SYN-001' },
  { from: S('TOLW'), to: S('TOLN'), minSec: 1800, kind: 'cross-city', basis: 'design', dv: 'DV-SYN-001' },
  { from: S('TOLN'), to: S('TOLW'), minSec: 1800, kind: 'cross-city', basis: 'design', dv: 'DV-SYN-001' },
];
const MIN_CHANGE: Record<string, number> = { COR: 600, VEL: 600, STH: 600, QUE: 600, KES: 600, VBY: 600, PAN: 1200, SKA: 1200, EBB: 900 };
const minChange: MinChangeRow[] = Object.entries(MIN_CHANGE).map(([k, sec]) => ({ station: S(k), minSec: sec, basis: 'design' as const, dv: 'DV-SYN-002' }));

// Through carriages: Aubrevaux–Ebbenhall in the Tolvenberg Express, onto the light railway at Quellingen.
const throughLinks: ThroughLinkRow[] = [ED_W, ED_S].map((ed) => ({ fromTrip: tripIdOf(ed, 'SYN_K_D11'), toTrip: tripIdOf(ed, 'SYN_K_L83'), station: S('QUE'), classMask: 3, cite: cite(ed, TABLE_PAGE.lake![0], TABLE_PAGE.lake![1]) }));

// ---------------------------------------------------------------- fares
// Per minute of scheduled travel, in the departure country's currency (minor units per minute ×10).
const RATE: Record<string, Record<string, number>> = {
  SYN_CV: { '1': 80, '2': 55, '3': 35 },
  SYN_AR: { '1': 65, '2': 45, '3': 30 },
  SYN_VH: { '1': 70, '2': 50, '3': 32 },
};
const BOAT_RATE: Record<string, number> = { '1': 120, '2': 80 };
const SLEEPER: Record<string, number> = { SYN_CV: 1500, SYN_AR: 1200, SYN_VH: 1300 };
const fares: FareRow[] = [];
const fareSeen = new Set<string>();
for (const t of trips) {
  const fc = cite(t.edition, t.edition === ED_L ? '4' : '30', t.edition === ED_L ? 'SYN_TB_LOCAL_FARES' : 'SYN_TB_FARES');
  const n = t.nStops;
  const timeAt = (j: number): number => {
    const sec = stops.arr[j]! >= 0 ? stops.arr[j]! : stops.dep[j]!;
    const day = stops.arr[j]! >= 0 ? stops.arrDay[j]! : stops.depDay[j]!;
    return day * 86400 + sec - stationOffset(STATION_DEFS[stops.station[j]!]!.id);
  };
  for (let a = 0; a < n - 1; a++) for (let b = a + 1; b < n; b++) {
    const ja = t.firstStop + a; const jb = t.firstStop + b;
    const from = STATION_DEFS[stops.station[ja]!]!.id; const to = STATION_DEFS[stops.station[jb]!]!.id;
    const minutes = Math.max(10, Math.round((timeAt(jb) - (stops.depDay[ja]! * 86400 + stops.dep[ja]! - stationOffset(from))) / 60));
    const ctry = countryOfStation(from);
    for (const cls of ['1', '2', '3']) {
      if ((t.classMask & (1 << (Number(cls) - 1))) === 0) continue;
      const key = `${t.edition}|${from}|${to}|${cls}`;
      if (fareSeen.has(key)) continue;
      fareSeen.add(key);
      const rate = t.mode === 'rail' ? RATE[ctry.id]![cls]! : (BOAT_RATE[cls] ?? 60);
      const amount = Math.floor((minutes * rate) / 10 / 5) * 5 + 5 * draw(3, 'fare', t.edition, from, to, cls);
      fares.push({ edition: t.edition, from, to, scope: 'table', cls, ret: false, currency: ctry.cur, amountMinor: amount, validityDays: 1, cite: fc });
    }
    if (t.sleeper) {
      const key = `${t.edition}|${from}|${to}|sleeper`;
      if (!fareSeen.has(key)) { fareSeen.add(key); fares.push({ edition: t.edition, from, to, scope: 'train', cls: 'sleeper', ret: false, currency: ctry.cur, amountMinor: SLEEPER[ctry.id]!, validityDays: 1, cite: fc }); }
    }
  }
}

// ---------------------------------------------------------------- institutions
const inst = (id: string, name: string, kind: InstitutionRow['kind'], jur: string, city: string | null, readsKinds: string[] = [], parent: string | null = null): InstitutionRow =>
  ({ id, name, nameAsPeriod: name, kind, jurisdiction: jur, city, parent, from: 0, to: null, readsKinds, basis: 'design', dv: 'DV-SYN-003' });
export const HUNTER = 'SYN_I_AR_POL';
const institutions: InstitutionRow[] = [
  inst(HUNTER, 'Ardesian State Police, Political Section', 'police', 'SYN_J_AR', 'SYN_C_TOL', ['registration.slip', 'frontier.passport', 'hotel.complaint']),
  inst('SYN_I_TOL_PP', 'Tolvenberg Police Presidium', 'police', 'SYN_J_AR', 'SYN_C_TOL', ['registration.slip']),
  inst('SYN_I_QUE_PD', 'Quellingen Police Directorate', 'police', 'SYN_J_AR', 'SYN_C_QUE', ['registration.slip']),
  inst('SYN_I_EBB_PD', 'Ebbenhall Harbour Police', 'police', 'SYN_J_AR', 'SYN_C_EBB', ['registration.slip']),
  inst('SYN_I_AR_FRONT', 'Ardesian Frontier Police', 'police', 'SYN_J_AR', null, ['frontier.passport']),
  inst('SYN_I_CV_PSO', 'Corvenian Public Safety Office', 'police', 'SYN_J_CV', null, ['registration.slip']),
  inst('SYN_I_VH_CON', 'Varnholm Constabulary', 'police', 'SYN_J_VH', null, ['registration.slip', 'frontier.passport']),
  inst('SYN_I_CV_CUST', 'Corvenian Customs', 'other', 'SYN_J_CV', null),
  inst('SYN_I_AR_CUST', 'Ardesian Customs', 'other', 'SYN_J_AR', null),
  inst('SYN_I_VH_CUST', 'Varnholm Customs', 'other', 'SYN_J_VH', null),
  inst('SYN_I_CV_TEL', 'Corvenian Telegraph Administration', 'telegraph', 'SYN_J_CV', null),
  inst('SYN_I_AR_TEL', 'Ardesian Telegraph Administration', 'telegraph', 'SYN_J_AR', null),
  inst('SYN_I_VH_TEL', 'Varnholm Telegraph Administration', 'telegraph', 'SYN_J_VH', null),
  inst(OPS.CVR, 'Corvenian State Railways', 'commercial', 'SYN_J_CV', null),
  inst(OPS.ARR, 'Ardesian State Railways', 'commercial', 'SYN_J_AR', null),
  inst(OPS.VHR, 'Varnholm Railways', 'commercial', 'SYN_J_VH', null),
  inst(OPS.VSP, 'Varnholm Steam Packet Company', 'commercial', 'SYN_J_VH', null),
  inst(OPS.MSC, 'Meridian Sleeping-Car Company', 'commercial', 'SYN_J_CV', null),
  inst(OPS.EBL, 'Ebbenhall Light Railway', 'commercial', 'SYN_J_AR', null),
  inst('SYN_I_TOL_COURT', 'Tolvenberg Commercial Court', 'court', 'SYN_J_AR', 'SYN_C_TOL'),
];
const BANK_NAMES: Record<string, string> = {
  SYN_C_AUB: 'Crédit Aubrevalais', SYN_C_COR: 'Comptoir de Corlaine', SYN_C_PAN: 'Banque du Quai, Port-Ancel', SYN_C_QUE: 'Quellinger Handelsbank',
  SYN_C_TOL: 'Tolvenberger Diskontobank', SYN_C_EBB: 'Ebbenhaller Sparkasse', SYN_C_HOL: 'Holmvara Merchants’ Bank', SYN_C_SKA: 'Skarnvik Harbour Bank',
};
const cityName = (id: string): string => CITY_DEFS.find((c) => c.id === id)!.name;
const cityJur = (id: string): string => country(CITY_DEFS.find((c) => c.id === id)!.c).jur;
const short = (city: string): string => city.slice(6);
for (const city of GAME_CITIES) {
  const jur = cityJur(city);
  institutions.push(inst(`SYN_I_BK_${short(city)}`, BANK_NAMES[city]!, 'bank', jur, city));
  institutions.push(inst(`SYN_I_PO_${short(city)}`, `${cityName(city)} Main Post Office`, 'post', jur, city));
  institutions.push(inst(`SYN_I_TO_${short(city)}`, `${cityName(city)} Central Telegraph Office`, 'telegraph', jur, city, [], jur === 'SYN_J_CV' ? 'SYN_I_CV_TEL' : jur === 'SYN_J_AR' ? 'SYN_I_AR_TEL' : 'SYN_I_VH_TEL'));
}

// ---------------------------------------------------------------- parameter rows
const params: ParamRow[] = [];
let pn = 0;
const cited = (param: string, keyKind: ParamRow['keyKind'], key: string, value: unknown, c = PRELIM(), from = 0, to: number | null = null, pub = true): void => {
  params.push({ id: `SYN_P${String(++pn).padStart(3, '0')}`, param, keyKind, key, from, to, tier: 1, value, dateBasis: 'historical', valueBasis: 'historical', cite: c, public: pub });
};
const design = (param: string, keyKind: ParamRow['keyKind'], key: string, value: unknown, dv: string, pub = true, from = 0, to: number | null = null, tier: 0 | 1 | 2 = 2): void => {
  params.push({ id: `SYN_P${String(++pn).padStart(3, '0')}`, param, keyKind, key, from, to, tier, value, dateBasis: 'design', valueBasis: 'design', dv, public: pub });
};

// Registration regimes (who must be registered, by whom).
cited('registration.regime', 'jurisdiction', 'SYN_J_CV', { hotelSlip: true, toPolice: true, deadlineSec: 86400, appliesTo: 'aliens', authority: 'SYN_I_CV_PSO', byCity: {} });
cited('registration.regime', 'jurisdiction', 'SYN_J_AR', { hotelSlip: true, toPolice: true, deadlineSec: 43200, appliesTo: 'all', authority: 'SYN_I_TOL_PP', byCity: { SYN_C_QUE: 'SYN_I_QUE_PD', SYN_C_TOL: 'SYN_I_TOL_PP', SYN_C_EBB: 'SYN_I_EBB_PD' } });
cited('registration.regime', 'jurisdiction', 'SYN_J_VH', { hotelSlip: true, toPolice: true, deadlineSec: 86400, appliesTo: 'aliens', authority: 'SYN_I_VH_CON', byCity: {} });
// Record lags at source (design) and cooperation edges between the police services (design).
design('records.lag', 'institution', 'registration.slip@SYN_I_TOL_PP', { minSec: 1800, maxSec: 21600 }, 'DV-SYN-004');
design('records.lag', 'institution', 'registration.slip@SYN_I_QUE_PD', { minSec: 3600, maxSec: 43200 }, 'DV-SYN-004');
design('records.lag', 'institution', 'registration.slip@SYN_I_EBB_PD', { minSec: 3600, maxSec: 43200 }, 'DV-SYN-004');
design('records.lag', 'institution', 'registration.slip@SYN_I_CV_PSO', { minSec: 7200, maxSec: 86400 }, 'DV-SYN-004');
design('records.lag', 'institution', 'registration.slip@SYN_I_VH_CON', { minSec: 7200, maxSec: 86400 }, 'DV-SYN-004');
design('records.lag', 'institution', 'frontier.passport@SYN_I_AR_FRONT', { minSec: 600, maxSec: 3600 }, 'DV-SYN-004');
design('records.lag', 'global', 'hotel.complaint', { minSec: 3600, maxSec: 21600 }, 'DV-SYN-004');
const SLIPS = ['registration.slip', 'hotel.complaint'];
design('coop.edge', 'pair', `SYN_I_TOL_PP>${HUNTER}`, { lagSec: [1800, 7200], retro: false, kinds: SLIPS }, 'DV-SYN-005');
design('coop.edge', 'pair', `SYN_I_QUE_PD>${HUNTER}`, { lagSec: [3600, 14400], retro: false, kinds: SLIPS }, 'DV-SYN-005');
design('coop.edge', 'pair', `SYN_I_EBB_PD>${HUNTER}`, { lagSec: [7200, 28800], retro: false, kinds: SLIPS }, 'DV-SYN-005');
design('coop.edge', 'pair', `SYN_I_AR_FRONT>${HUNTER}`, { lagSec: [1800, 5400], retro: false, kinds: ['frontier.passport'] }, 'DV-SYN-005');
// The second police service: the Corvenian office passes slips and complaints on to the Ardesian section.
design('coop.edge', 'pair', `SYN_I_CV_PSO>${HUNTER}`, { lagSec: [43200, 129600], retro: false, kinds: SLIPS }, 'DV-C07-029');
// Frontier formalities per edge, in the direction of travel.
cited('frontier.papers', 'edge', `${S('VEL')}>${S('STH')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_AR_FRONT', customs: 'SYN_I_AR_CUST' });
cited('frontier.papers', 'edge', `${S('STH')}>${S('VEL')}`, { passport: false, visa: null, recordsName: false, inspector: 'SYN_I_CV_PSO', customs: 'SYN_I_CV_CUST' });
cited('frontier.papers', 'edge', `${S('KES')}>${S('VBY')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_VH_CON', customs: 'SYN_I_VH_CUST' });
cited('frontier.papers', 'edge', `${S('VBY')}>${S('KES')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_AR_FRONT', customs: 'SYN_I_AR_CUST' });
cited('frontier.papers', 'edge', `${S('PAN')}>${S('SKA')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_VH_CON', customs: 'SYN_I_VH_CUST' });
cited('frontier.papers', 'edge', `${S('SKA')}>${S('PAN')}`, { passport: false, visa: null, recordsName: false, inspector: 'SYN_I_CV_PSO', customs: 'SYN_I_CV_CUST' });
cited('frontier.papers', 'edge', `${S('EBB')}>${S('SKA')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_VH_CON', customs: 'SYN_I_VH_CUST' });
cited('frontier.papers', 'edge', `${S('SKA')}>${S('EBB')}`, { passport: true, visa: null, recordsName: true, inspector: 'SYN_I_AR_FRONT', customs: 'SYN_I_AR_CUST' });
// Opening hours (local): [weekday mask (bit 0 = Monday), open, close].
const MF = 31; const SAT = 32; const SUN = 64; const ALL = 127;
const h = (a: string, b: string): [number, number] => [hhmm(a), b === '24:00' ? 86400 : hhmm(b)];
const BANK_HOURS: Record<string, Array<[number, number, number]>> = {
  SYN_J_CV: [[MF, ...h('09:00', '12:00')], [MF, ...h('14:00', '16:00')], [SAT, ...h('09:00', '12:00')]],
  SYN_J_AR: [[MF, ...h('09:00', '15:00')], [SAT, ...h('09:00', '13:00')]],
  SYN_J_VH: [[MF | SAT, ...h('10:00', '15:00')]],
};
const POST_HOURS: Record<string, Array<[number, number, number]>> = {
  SYN_J_CV: [[MF | SAT, ...h('08:00', '20:00')], [SUN, ...h('08:00', '11:00')]],
  SYN_J_AR: [[MF | SAT, ...h('07:00', '21:00')], [SUN, ...h('08:00', '10:00')]],
  SYN_J_VH: [[MF | SAT, ...h('08:00', '19:00')]],
};
const CAPITALS = ['SYN_C_AUB', 'SYN_C_TOL', 'SYN_C_HOL'];
for (const city of GAME_CITIES) {
  const jur = cityJur(city);
  cited('bank.hours', 'institution', `SYN_I_BK_${short(city)}`, { days: BANK_HOURS[jur] });
  cited('post.hours', 'institution', `SYN_I_PO_${short(city)}`, { days: POST_HOURS[jur] });
  cited('telegraph.hours', 'institution', `SYN_I_TO_${short(city)}`, { days: CAPITALS.includes(city) ? [[ALL, 0, 86400]] : [[ALL, ...h('08:00', '21:00')]] });
}
for (const p of ['SYN_I_TOL_PP', 'SYN_I_QUE_PD', 'SYN_I_EBB_PD', HUNTER]) design('police.officeHours', 'institution', p, { days: [[ALL, ...h('08:00', '19:00')]] }, 'DV-SYN-006');
// Bank holidays (one-day rows, inclusive day → exclusive to).
cited('bank.closed', 'jurisdiction', 'SYN_J_CV', { reason: 'Corvenian spring holiday' }, PRELIM(), D(4, 30), D(5, 1));
cited('bank.closed', 'jurisdiction', 'SYN_J_AR', { reason: 'Ardesian bank holiday' }, PRELIM_S(), D(5, 4), D(5, 5));
cited('post.restanteFee', 'jurisdiction', 'SYN_J_CV', { minor: 10, cur: 'SYN_CVN' });
// Telegraph tariffs, per word with a minimum, in the sender's currency.
const TARIFF: Record<string, number> = {
  'SYN_J_CV>SYN_J_CV': 5, 'SYN_J_CV>SYN_J_AR': 15, 'SYN_J_CV>SYN_J_VH': 20,
  'SYN_J_AR>SYN_J_AR': 5, 'SYN_J_AR>SYN_J_CV': 12, 'SYN_J_AR>SYN_J_VH': 15,
  'SYN_J_VH>SYN_J_VH': 6, 'SYN_J_VH>SYN_J_CV': 22, 'SYN_J_VH>SYN_J_AR': 16,
};
for (const [pair, per] of Object.entries(TARIFF)) {
  const from = pair.split('>')[0]!;
  cited('telegraph.tariff', 'pair', pair, { perWordMinor: per, cur: COUNTRIES.find((c) => c.jur === from)!.cur, minWords: 10 });
}
// Parities: minor units of the currency per GBP farthings.
cited('fx.parity', 'currency', 'GBP>SYN_CVN', { num: 21, den: 8 });   // £1 = 25.20 cv.
cited('fx.parity', 'currency', 'GBP>SYN_THL', { num: 17, den: 8 });   // £1 = 20.40 th.
cited('fx.parity', 'currency', 'GBP>SYN_VRN', { num: 227, den: 120 }); // £1 = 18.16 vn.
// Lodging per room-night, a range per tier as the guide prints it.
const LODGING: Record<string, [number, number]> = { modest: [250, 450], middle: [500, 900], first: [1000, 1800] };
for (const city of GAME_CITIES) {
  const cur = country(CITY_DEFS.find((c) => c.id === city)!.c).cur;
  const capital = CAPITALS.includes(city) ? 2 : 0;
  for (const [tier, [lo, hi]] of Object.entries(LODGING)) {
    const bump = 25 * (capital + draw(3, 'lodging', city, tier));
    cited('lodging.price', 'city', `${city}|${tier}`, { minMinor: lo + bump, maxMinor: hi + 2 * bump, cur });
  }
}
for (const c of COUNTRIES) design('porter.tip', 'jurisdiction', c.jur, { minor: 20 + 5 * draw(2, 'tip', c.id), cur: c.cur }, 'DV-SYN-007');
// Guide prices where each edition is sold.
for (const c of COUNTRIES) {
  cited('guide.price', 'global', `${ED_W}@${c.jur}`, { minor: 250, cur: c.cur }, cite(ED_W, 'i', null));
  cited('guide.price', 'global', `${ED_S}@${c.jur}`, { minor: 250, cur: c.cur }, cite(ED_S, 'i', null));
}
cited('guide.price', 'global', `${ED_L}@SYN_J_CV`, { minor: 80, cur: 'SYN_CVN' }, cite(ED_L, 'i', null));
// Delays: the design CDFs of RULES.md (public: the planner shows the odds they imply).
const dvFile = JSON.parse(readFileSync(join(HERE, '..', 'design', 'design-values.json'), 'utf8')) as { values: DesignValueRow[] };
const dv = (id: string): unknown => dvFile.values.find((v) => v.id === id)!.value;
design('c07.delay', 'topic', 'express', dv('DV-C07-018'), 'DV-C07-018', true, 0, null, 2);
design('c07.delay', 'topic', 'ordinary', dv('DV-C07-019'), 'DV-C07-019', true, 0, null, 2);
design('c07.delay', 'topic', 'boat', dv('DV-C07-020'), 'DV-C07-020', true, 0, null, 2);
// The hunting service: what it knows of the timetable (K3) and where its watchers start. Hidden.
design('hunt.known', 'institution', HUNTER, { modes: ['rail'], operators: [OPS.ARR, OPS.MSC] }, 'DV-C07-031', false);
design('hunt.bases', 'institution', HUNTER, { cities: ['SYN_C_TOL'] }, 'DV-C07-038', false);

// ---------------------------------------------------------------- calendar (no history: timetable notices only)
const calendar: WorldEventRow[] = [
  { id: 'SYN_EV_SUMMER', day: CHANGEOVER, timeLocal: 0, zone: 'SYN_Z_AR_CIV', jurisdiction: 'SYN_J_AR', kind: 'timetable', title: 'Summer service in force on the Corvenian and Ardesian railways', effects: [], cite: cite(ED_S, 'ii', null) },
  { id: 'SYN_EV_GUIDE', day: D(4, 25), timeLocal: hhmm('07:00'), zone: 'SYN_Z_CV_CIV', jurisdiction: 'SYN_J_CV', kind: 'notice', title: 'Summer edition of the guide on sale at the bookstalls', effects: [], cite: cite(ED_S, 'i', null) },
  { id: 'SYN_EV_HOL_CV', day: D(4, 29), timeLocal: hhmm('07:00'), zone: 'SYN_Z_CV_CIV', jurisdiction: 'SYN_J_CV', kind: 'notice', title: 'Banks closed tomorrow: Corvenian spring holiday', effects: [], cite: PRELIM() },
  { id: 'SYN_EV_HOL_AR', day: D(5, 3), timeLocal: hhmm('07:00'), zone: 'SYN_Z_AR_CIV', jurisdiction: 'SYN_J_AR', kind: 'notice', title: 'Banks closed tomorrow: Ardesian bank holiday', effects: [], cite: PRELIM_S() },
];

// ---------------------------------------------------------------- design values: the rule register plus this world's register
const worldDv: DesignValueRow[] = [
  { id: 'DV-SYN-001', value: { 'Aubrevaux-Nord–Ouest': 2400, 'Tolvenberg West–Nord': 1800 }, unit: 's', rationale: 'Cross-city transfers by cab in the invented world.' },
  { id: 'DV-SYN-002', value: MIN_CHANGE, unit: 's', rationale: 'Minimum change times at invented stations; piers longer.' },
  { id: 'DV-SYN-003', value: 'invented institutions', unit: '-', rationale: 'Every institution of the preview is invented.' },
  { id: 'DV-SYN-004', value: 'records.lag rows', unit: 's', rationale: 'Time for a record to reach its own institution, within each regime’s deadline.' },
  { id: 'DV-SYN-005', value: 'coop.edge rows', unit: 's', rationale: 'Ardesian city police pass slips to the political section within hours; the frontier police faster.' },
  { id: 'DV-SYN-006', value: '08:00-19:00', unit: 'local', rationale: 'Police office hours in Ardesia.' },
  { id: 'DV-SYN-007', value: 'porter.tip rows', unit: 'minor', rationale: 'Porter tips in each invented currency.' },
  { id: 'DV-SYN-008', value: { SYN_CVN: 'cv.', SYN_THL: 'th.', SYN_VRN: 'vn.' }, unit: 'display', rationale: 'Display units of the invented currencies (corvin, thaler, varn).' },
];
const designValues: DesignValueRow[] = [...dvFile.values, ...worldDv];

export function buildWorld(): ReadyBundle {
  const body = {
    stations, cities, zones, stationZones, editions, trips, stops, transfers, minChange, throughLinks, fares,
    citations, params, calendar, institutions, designValues,
  };
  const meta = {
    game: 'c07-departure', status: 'ready' as const, synthetic: true, schema: 1 as const, freezeTag: 'preview-1',
    window: WINDOW, dataHash: hash64(canonicalJson(body)),
  };
  return { meta, ...body };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bundle = buildWorld();
  const json = JSON.stringify(bundle);
  writeFileSync(WORLD_FILE, json + '\n');
  console.log(`preview world: ${bundle.trips.length} trips, ${bundle.stations.length} stations, ${bundle.params.length} params, ${bundle.fares.length} fares, ${json.length} bytes, data ${bundle.meta.dataHash}`);
}
