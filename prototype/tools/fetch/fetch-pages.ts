/**
 * Page acquisition.
 *
 *   NODE_USE_ENV_PROXY=1 node tools/fetch/fetch-pages.ts <source_id> [--pages 120-125,301] [--refetch]
 *
 * (Re-runs itself with NODE_USE_ENV_PROXY=1 when HTTPS_PROXY is set; see tools/discover/http.ts.)
 *
 * Downloads only the pages listed in data/sources/manifests/<source_id>.csv, through the polite HTTP
 * client (≈1 request/s per host, backoff, no response cache: the scans are the cache), into
 * scans/<source_id>/p<seq>.<ext> (git-ignored). The extension follows the response's content type.
 *
 * - A page already on disk is not downloaded again; its sha256 is checked against the manifest
 *   (a mismatch is an error: the file was changed or replaced).
 * - A page whose manifest row has no sha256 yet gets sha256, width, height (sharp metadata) and
 *   retrieved_at (UTC) filled in; the manifest is rewritten after every page.
 * - --refetch downloads again and verifies against the recorded sha256; a different image is an
 *   error, and the new bytes are kept beside the old as p<seq>.<ext>.mismatch for inspection.
 * - A response that is not an image (an HTML error page, say) is an error.
 * - A host refused by the egress proxy stops the run ("host blocked by environment egress policy").
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { BlockedHostError, createHttp, ensureProxyEnv, type Http } from '../discover/http.ts';
import { writeTextFile } from '../keying/csv.ts';
import { manifestCsv, roots, scansDir, type Roots } from '../keying/paths.ts';
import { parsePageList, readManifest, writeManifest, type ManifestRow } from './manifest.ts';

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/tiff': 'tif', 'image/jp2': 'jp2',
  'image/jpx': 'jp2', 'image/webp': 'webp', 'image/gif': 'gif',
};
const PAGE_EXTS = ['jpg', 'png', 'tif', 'jp2', 'webp', 'gif', 'jpeg', 'tiff'];

export function extFor(contentType: string, url: string): string | null {
  const t = contentType.split(';')[0]!.trim().toLowerCase();
  if (EXT_BY_TYPE[t]) return EXT_BY_TYPE[t]!;
  if (t === 'application/octet-stream' || t === '') {
    const m = /\.(jpe?g|png|tiff?|jp2|webp|gif)(?:$|[?#])/i.exec(url);
    if (m) return m[1]!.toLowerCase().replace('jpeg', 'jpg').replace('tiff', 'tif');
  }
  return null;
}

export const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

/** UTC timestamp to the second, e.g. 2026-10-03T09:30:00Z. */
export const isoNow = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

export function existingPage(dir: string, seq: number): string | null {
  if (!existsSync(dir)) return null;
  const names = new Set(readdirSync(dir));
  for (const e of PAGE_EXTS) if (names.has(`p${seq}.${e}`)) return join(dir, `p${seq}.${e}`);
  return null;
}

async function dims(buf: Buffer): Promise<{ width: string; height: string }> {
  try {
    const m = await sharp(buf).metadata();
    return { width: m.width ? String(m.width) : '', height: m.height ? String(m.height) : '' };
  } catch {
    return { width: '', height: '' }; // e.g. JPEG 2000 without a decoder: sizes stay blank
  }
}

export interface FetchOptions {
  http?: Http;
  pages?: readonly number[];
  refetch?: boolean;
  now?: () => string;
  log?: (m: string) => void;
}

export interface FetchReport {
  fetched: number[];
  verified: number[];
  filled: number[];
  errors: string[];
  blocked: string | null;
}

export async function fetchPages(r: Roots, sourceId: string, o: FetchOptions = {}): Promise<FetchReport> {
  const http = o.http ?? createHttp({ cacheDir: null });
  const now = o.now ?? isoNow;
  const log = o.log ?? (() => {});
  const mPath = manifestCsv(r, sourceId);
  if (!existsSync(mPath)) throw new Error(`no manifest ${mPath} (create it with tools/fetch/manifest.ts init)`);
  const rows = readManifest(mPath);
  const dir = scansDir(r, sourceId);
  const rep: FetchReport = { fetched: [], verified: [], filled: [], errors: [], blocked: null };
  const save = () => writeTextFile(mPath, writeManifest(rows));
  const wanted = o.pages ? new Set(o.pages) : null;
  if (wanted) for (const p of wanted) if (!rows.some((x) => x.page_seq === p)) rep.errors.push(`p${p}: not in the manifest (only listed pages are fetched)`);

  for (const row of rows) {
    if (wanted && !wanted.has(row.page_seq)) continue;
    const local = existingPage(dir, row.page_seq);
    if (local && !o.refetch) {
      const buf = readFileSync(local);
      const h = sha256(buf);
      if (row.sha256 && row.sha256 !== h) { rep.errors.push(`p${row.page_seq}: ${local} has sha256 ${h}, manifest says ${row.sha256} (file changed; delete it to fetch again, or --refetch)`); continue; }
      if (!row.sha256 || !row.width || !row.height || !row.retrieved_at) {
        const d = await dims(buf);
        Object.assign(row, { sha256: h, width: row.width || d.width, height: row.height || d.height, retrieved_at: row.retrieved_at || new Date(statSync(local).mtimeMs).toISOString().replace(/\.\d{3}Z$/, 'Z') } satisfies Partial<ManifestRow>);
        save();
        rep.filled.push(row.page_seq);
      } else rep.verified.push(row.page_seq);
      continue;
    }
    let res;
    try {
      res = await http.get(row.url, { accept: 'image/jpeg,image/png,image/*;q=0.8', cache: 'off' });
    } catch (e) {
      if (e instanceof BlockedHostError) { rep.blocked = e.message; rep.errors.push(e.message); break; }
      rep.errors.push(`p${row.page_seq}: ${(e as Error).message}`);
      continue;
    }
    const ext = extFor(res.contentType, row.url);
    if (!ext) { rep.errors.push(`p${row.page_seq}: ${row.url} returned "${res.contentType || 'no content type'}", not an image`); continue; }
    const h = sha256(res.body);
    if (row.sha256 && row.sha256 !== h) {
      const keep = join(dir, `p${row.page_seq}.${ext}.mismatch`);
      writeTextFile(keep, res.body);
      rep.errors.push(`p${row.page_seq}: re-fetched image has sha256 ${h}, manifest says ${row.sha256}; new bytes kept as ${keep}`);
      continue;
    }
    const out = join(dir, `p${row.page_seq}.${ext}`);
    writeTextFile(out, res.body);
    const d = await dims(res.body);
    Object.assign(row, { sha256: h, width: d.width, height: d.height, retrieved_at: now() } satisfies Partial<ManifestRow>);
    save();
    rep.fetched.push(row.page_seq);
    log(`p${row.page_seq} → ${out} (${d.width}×${d.height})`);
  }
  return rep;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const source = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--pages'));
  if (!source) { console.error('usage: fetch-pages.ts <source_id> [--pages 120-125,301] [--refetch]'); process.exit(1); }
  ensureProxyEnv();
  const pages = opt('--pages');
  fetchPages(roots(), source, {
    http: createHttp({ cacheDir: null, log: (m) => console.error(m) }),
    ...(pages ? { pages: parsePageList(pages) } : {}),
    refetch: args.includes('--refetch'),
    log: (m) => console.log(m),
  }).then((rep) => {
    console.log(`fetched ${rep.fetched.length}, verified ${rep.verified.length}, filled ${rep.filled.length}, errors ${rep.errors.length}`);
    for (const e of rep.errors) console.error(`error: ${e}`);
    process.exit(rep.blocked ? 3 : rep.errors.length ? 1 : 0);
  }, (e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
