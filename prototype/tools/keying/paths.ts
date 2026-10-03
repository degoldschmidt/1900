/**
 * Folder conventions for acquisition and keying. Every function takes a Roots object so tests can
 * point the tools at a temporary folder.
 *
 *   data/sources/catalogue.csv, coverage.csv, COVERAGE.md, manifests/<source_id>.csv
 *   data/raw/status.csv
 *   data/raw/<source_id>/<table_ref>/layout.json, crops.csv, <crop_id>.{A,B,R}.csv, <crop_id>.diff.csv
 *   scans/<source_id>/p<seq>.<ext>                         (git-ignored page images)
 *   scans/<source_id>/crops/<table_ref>/<crop_id>.png      (git-ignored composite crops)
 *   build/cache/http/                                      (git-ignored HTTP cache)
 *   build/resolve/<source_id>/<table_ref>/<crop_id>/       (resolver packets with zoomed cells)
 *   build/review/<source_id>-<table_ref>.html              (side-by-side review pages)
 */
import { join, resolve } from 'node:path';
import { ROOT } from '../make/paths.ts';

export interface Roots {
  /** The prototype/ folder. */
  root: string;
  data: string;
  scans: string;
  build: string;
}

/**
 * The folders the tools work in. Command-line runs may redirect them with the environment variables
 * P1900_DATA, P1900_SCANS and P1900_BUILD (relative to prototype/), e.g. to run the whole keying
 * pipeline on synthetic calibration pages under build/synth/ without touching data/ or scans/.
 */
export function roots(over: Partial<Roots> = {}): Roots {
  const root = over.root ?? ROOT;
  const env = (k: string) => (over.root === undefined && process.env[k] ? resolve(root, process.env[k]!) : undefined);
  return {
    root,
    data: over.data ?? env('P1900_DATA') ?? join(root, 'data'),
    scans: over.scans ?? env('P1900_SCANS') ?? join(root, 'scans'),
    build: over.build ?? env('P1900_BUILD') ?? join(root, 'build'),
  };
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;

/** Throws unless `id` is safe to use as a single path segment. */
export function assertSafeId(what: string, id: string): string {
  if (!SAFE_ID.test(id) || id.includes('..')) throw new Error(`${what} "${id}" must match ${SAFE_ID} (letters, digits, . _ ~ -)`);
  return id;
}

export const catalogueCsv = (r: Roots) => join(r.data, 'sources', 'catalogue.csv');
export const coverageCsv = (r: Roots) => join(r.data, 'sources', 'coverage.csv');
export const coverageMd = (r: Roots) => join(r.data, 'sources', 'COVERAGE.md');
export const manifestCsv = (r: Roots, source: string) => join(r.data, 'sources', 'manifests', `${assertSafeId('source_id', source)}.csv`);
export const statusCsv = (r: Roots) => join(r.data, 'raw', 'status.csv');
export const rawDir = (r: Roots, source: string, table: string) =>
  join(r.data, 'raw', assertSafeId('source_id', source), assertSafeId('table_ref', table));
export const layoutJson = (r: Roots, source: string, table: string) => join(rawDir(r, source, table), 'layout.json');
export const cropsCsv = (r: Roots, source: string, table: string) => join(rawDir(r, source, table), 'crops.csv');
export const keyingCsv = (r: Roots, source: string, table: string, crop: string, who: 'A' | 'B' | 'R') =>
  join(rawDir(r, source, table), `${assertSafeId('crop_id', crop)}.${who}.csv`);
export const diffCsv = (r: Roots, source: string, table: string, crop: string) =>
  join(rawDir(r, source, table), `${assertSafeId('crop_id', crop)}.diff.csv`);
export const scansDir = (r: Roots, source: string) => join(r.scans, assertSafeId('source_id', source));
export const cropImageDir = (r: Roots, source: string, table: string) =>
  join(scansDir(r, source), 'crops', assertSafeId('table_ref', table));
export const cropImage = (r: Roots, source: string, table: string, crop: string) =>
  join(cropImageDir(r, source, table), `${assertSafeId('crop_id', crop)}.png`);
export const httpCacheDir = (r: Roots) => join(r.build, 'cache', 'http');
export const resolvePacketDir = (r: Roots, source: string, table: string, crop: string) =>
  join(r.build, 'resolve', assertSafeId('source_id', source), assertSafeId('table_ref', table), assertSafeId('crop_id', crop));
export const reviewHtml = (r: Roots, source: string, table: string) =>
  join(r.build, 'review', `${assertSafeId('source_id', source)}-${assertSafeId('table_ref', table)}.html`);
