/**
 * Imports pages the owner photographed from a printed copy (gate G1 option a) as an owner-scan
 * source, so they enter the same pipeline as library pages: crops, double keying, validation.
 *
 *   node tools/fetch/import-scans.ts <source_id: os-…> <folder> --title "…" [--edition "…"] [--issue YYYY-MM]
 *        [--content table] [--start-seq 1]
 *
 * Files are taken in natural name order. A file name containing "p<printed page>" (e.g.
 * IMG_0412_p387.jpg, p387.jpg, p.xiv.jpg) gives the printed page number; otherwise it is left blank.
 * Each page is copied to scans/<source_id>/p<seq>.<ext> (git-ignored; scans are never committed) and
 * listed in data/sources/manifests/<source_id>.csv with sha256, width, height and the import time;
 * its url is owner:<original file name>. A catalogue row (library owner-scan) is added if missing.
 * Re-importing the same file is a no-op; a different file under the same page_seq is refused.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { extname, join } from 'node:path';
import sharp from 'sharp';
import { manifestCsv, catalogueCsv, roots, scansDir, type Roots } from '../keying/paths.ts';
import { writeTextFile } from '../keying/csv.ts';
import { parseSourceId, readCatalogue, mergeCatalogue, writeCatalogue, type CatalogueRow } from '../discover/catalogue.ts';
import { readManifest, writeManifest, CONTENT, type Content, type ManifestRow } from './manifest.ts';

const IMAGE = /\.(jpe?g|png|tiff?|webp)$/i;

/** Natural order: "IMG_2.jpg" before "IMG_10.jpg". */
export function naturalCompare(a: string, b: string): number {
  const ax = a.toLowerCase().split(/(\d+)/); const bx = b.toLowerCase().split(/(\d+)/);
  for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
    const x = ax[i]!; const y = bx[i]!;
    if (x === y) continue;
    const nx = /^\d+$/.test(x); const ny = /^\d+$/.test(y);
    if (nx && ny) return Number(x) - Number(y) || x.length - y.length;
    return x < y ? -1 : 1;
  }
  return ax.length - bx.length;
}

/** The printed page named in a file name ("…_p387.jpg" → "387", "p.xiv.jpg" → "xiv"), or "". */
export function printedFromName(name: string): string {
  const m = /(?:^|[^a-z])p\.?([0-9]+[a-z]?|[ivxlc]+)(?=[^a-z0-9]|$)/i.exec(name.replace(IMAGE, ''));
  return m ? m[1]!.toLowerCase() : '';
}

export interface ImportOptions {
  title: string;
  edition?: string | undefined;
  issue?: string | undefined;
  content?: Content | undefined;
  startSeq?: number | undefined;
  now?: (() => string) | undefined;
}

export interface ImportReport { added: number[]; unchanged: number[]; errors: string[] }

export async function importScans(r: Roots, sourceId: string, folder: string, o: ImportOptions): Promise<ImportReport> {
  const { library } = parseSourceId(sourceId);
  if (library !== 'owner-scan') throw new Error(`${sourceId}: owner scans use an os- source id (e.g. os-bradshaw-continental-1913)`);
  if (!existsSync(folder)) throw new Error(`no folder ${folder}`);
  const files = readdirSync(folder).filter((f) => IMAGE.test(f)).sort(naturalCompare);
  if (files.length === 0) throw new Error(`${folder} holds no JPEG, PNG, TIFF or WebP images (set phones to JPEG, not HEIC)`);
  const mPath = manifestCsv(r, sourceId);
  const rows: ManifestRow[] = existsSync(mPath) ? readManifest(mPath) : [];
  const dir = scansDir(r, sourceId);
  mkdirSync(dir, { recursive: true });
  const now = o.now ?? (() => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
  const rep: ImportReport = { added: [], unchanged: [], errors: [] };
  const start = o.startSeq ?? 1;
  for (let i = 0; i < files.length; i++) {
    const name = files[i]!;
    const seq = start + i;
    const buf = readFileSync(join(folder, name));
    const sha = createHash('sha256').update(buf).digest('hex');
    const existing = rows.find((x) => x.page_seq === seq);
    if (existing) {
      if (existing.sha256 === sha) { rep.unchanged.push(seq); continue; }
      rep.errors.push(`p${seq}: ${name} differs from the page already imported as p${seq} (${existing.url}); use --start-seq to add pages after it`);
      continue;
    }
    let meta;
    try { meta = await sharp(buf).metadata(); } catch { rep.errors.push(`${name}: not a readable image`); continue; }
    const ext = extname(name).slice(1).toLowerCase().replace('jpeg', 'jpg').replace('tiff', 'tif');
    copyFileSync(join(folder, name), join(dir, `p${seq}.${ext}`));
    rows.push({
      page_seq: seq, printed_page: printedFromName(name), content: o.content ?? 'table', table_refs: '',
      url: `owner:${name}`, sha256: sha, width: String(meta.width ?? ''), height: String(meta.height ?? ''), retrieved_at: now(),
    });
    rep.added.push(seq);
  }
  rows.sort((a, b) => a.page_seq - b.page_seq);
  writeTextFile(mPath, writeManifest(rows));
  const cat = existsSync(catalogueCsv(r)) ? readCatalogue(catalogueCsv(r)) : [];
  if (!cat.some((c) => c.source_id === sourceId)) {
    const row: CatalogueRow = {
      source_id: sourceId, library: 'owner-scan', library_id: sourceId.slice(3), title: o.title, publisher: '',
      edition_label: o.edition ?? '', issue_date: o.issue ?? '', validity_stated: '', access: 'full', pages: '',
      language: '', url: '', terms_note: 'photographed by the owner from a printed copy; images are not committed', found_by: 'owner', notes: '',
    };
    writeTextFile(catalogueCsv(r), writeCatalogue(mergeCatalogue(cat, [row])));
  }
  return rep;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const [source, folder] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const title = opt('--title');
  const content = opt('--content') as Content | undefined;
  if (!source || !folder || !title) { console.error('usage: import-scans.ts <os-source_id> <folder> --title "…" [--edition "…"] [--issue YYYY-MM] [--content table] [--start-seq 1]'); process.exit(1); }
  if (content && !(CONTENT as readonly string[]).includes(content)) { console.error(`--content must be one of ${CONTENT.join('|')}`); process.exit(1); }
  importScans(roots(), source, folder, { title, edition: opt('--edition'), issue: opt('--issue'), content, startSeq: opt('--start-seq') ? Number(opt('--start-seq')) : undefined })
    .then((rep) => {
      console.log(`added ${rep.added.length} page(s)${rep.added.length ? ` (p${rep.added[0]}–p${rep.added.at(-1)})` : ''}, unchanged ${rep.unchanged.length}`);
      for (const e of rep.errors) console.error(e);
      process.exit(rep.errors.length ? 2 : 0);
    })
    .catch((e: unknown) => { console.error((e as Error).message); process.exit(1); });
}
