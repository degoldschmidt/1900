/**
 * Page manifests: data/sources/manifests/<source_id>.csv lists the only pages that may be fetched.
 *
 *   page_seq      1-based image sequence in the library's viewer (archive.org leaf + 1, HathiTrust seq, Gallica f<n>,
 *                 SLUB METS physical ORDER)
 *   printed_page  the page number printed on the page, as printed ("412", "xiv", "" if none)
 *   content       title | table | handbook | index | notation | footnotes | ads
 *   table_refs    semicolon list of the guide's table numbers on the page ("57;60")
 *   url           the image URL (IIIF or image endpoint; see pageUrlFor)
 *   sha256, width, height, retrieved_at   filled by tools/fetch/fetch-pages.ts
 *
 *   node tools/fetch/manifest.ts init <source_id> <pages: 120-125,301> [--content table] [--tables "57;60"]
 * adds rows (with URLs from the library's image template) to the manifest, keeping existing rows.
 */
import { readCsvFileOr, writeCsv, writeTextFile, type CsvRow } from '../keying/csv.ts';
import { manifestCsv, roots } from '../keying/paths.ts';
import { parseSourceId } from '../discover/catalogue.ts';
import * as ia from '../discover/archive-org.ts';
import * as ht from '../discover/hathitrust.ts';
import * as ga from '../discover/gallica.ts';
import * as sl from '../discover/slub.ts';

export const MANIFEST_COLUMNS = ['page_seq', 'printed_page', 'content', 'table_refs', 'url', 'sha256', 'width', 'height', 'retrieved_at'] as const;
export const CONTENT = ['title', 'table', 'handbook', 'index', 'notation', 'footnotes', 'ads'] as const;
export type Content = (typeof CONTENT)[number];

export interface ManifestRow {
  page_seq: number;
  printed_page: string;
  content: Content;
  table_refs: string;
  url: string;
  sha256: string;
  width: string;
  height: string;
  retrieved_at: string;
}

export function parseManifestRows(rows: readonly CsvRow[], file = 'manifest'): { rows: ManifestRow[]; errors: string[] } {
  const errors: string[] = [];
  const out: ManifestRow[] = [];
  const seen = new Set<number>();
  rows.forEach((r, i) => {
    const where = `${file} row ${i + 2}`;
    const seq = Number((r.page_seq ?? '').trim());
    const content = (r.content ?? '').trim();
    const sha = (r.sha256 ?? '').trim().toLowerCase();
    if (!Number.isInteger(seq) || seq < 1) { errors.push(`${where}: page_seq "${r.page_seq}" must be a positive integer`); return; }
    if (seen.has(seq)) { errors.push(`${where}: duplicate page_seq ${seq}`); return; }
    seen.add(seq);
    if (!(CONTENT as readonly string[]).includes(content)) { errors.push(`${where}: content "${content}" is not one of ${CONTENT.join('|')}`); return; }
    if (!/^(https?:\/\/|owner:)/.test((r.url ?? '').trim())) { errors.push(`${where}: url must be http(s), or owner:<file> for an owner scan`); return; }
    if (sha && !/^[0-9a-f]{64}$/.test(sha)) { errors.push(`${where}: sha256 is not 64 hex digits`); return; }
    out.push({
      page_seq: seq, printed_page: (r.printed_page ?? '').trim(), content: content as Content, table_refs: (r.table_refs ?? '').trim(),
      url: (r.url ?? '').trim(), sha256: sha, width: (r.width ?? '').trim(), height: (r.height ?? '').trim(), retrieved_at: (r.retrieved_at ?? '').trim(),
    });
  });
  return { rows: out.sort((a, b) => a.page_seq - b.page_seq), errors };
}

export function readManifest(path: string): ManifestRow[] {
  const t = readCsvFileOr(path, MANIFEST_COLUMNS);
  const { rows, errors } = parseManifestRows(t.rows, path);
  if (errors.length) throw new Error(`invalid manifest:\n  ${errors.join('\n  ')}`);
  return rows;
}

export function writeManifest(rows: readonly ManifestRow[]): string {
  return writeCsv(MANIFEST_COLUMNS, [...rows].sort((a, b) => a.page_seq - b.page_seq).map((r) => ({ ...r, page_seq: String(r.page_seq) })));
}

/** The image URL for page `seq` of a source, from its library's template. */
export function pageUrlFor(sourceId: string, seq: number): string {
  const { library, libraryId } = parseSourceId(sourceId);
  if (library === 'archive.org') return ia.pageImageUrl(libraryId, seq);
  if (library === 'hathitrust') return ht.pageImageUrl(libraryId, seq);
  if (library === 'slub') return sl.pageImageUrl(libraryId, seq);
  if (library === 'owner-scan') throw new Error(`${sourceId} is an owner scan: add its pages with tools/fetch/import-scans.ts, not manifest init`);
  return ga.iiifImageUrl(libraryId, seq);
}

/** "120-125,301" → [120, …, 125, 301] (sorted, unique). */
export function parsePageList(s: string): number[] {
  const out = new Set<number>();
  for (const part of s.split(',').map((p) => p.trim()).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) throw new Error(`page list: "${part}" is not N or N-M`);
    const a = Number(m[1]); const b = Number(m[2] ?? m[1]);
    if (b < a || b - a > 2000) throw new Error(`page list: bad range "${part}"`);
    for (let i = a; i <= b; i++) out.add(i);
  }
  return [...out].sort((x, y) => x - y);
}

/** Adds rows for new pages; existing rows (and their checksums) are kept unchanged. */
export function addPages(existing: readonly ManifestRow[], sourceId: string, pages: readonly number[], o: { content?: Content; tables?: string } = {}): ManifestRow[] {
  const have = new Set(existing.map((r) => r.page_seq));
  const added = pages.filter((p) => !have.has(p)).map((p): ManifestRow => ({
    page_seq: p, printed_page: '', content: o.content ?? 'table', table_refs: o.tables ?? '', url: pageUrlFor(sourceId, p),
    sha256: '', width: '', height: '', retrieved_at: '',
  }));
  return [...existing, ...added].sort((a, b) => a.page_seq - b.page_seq);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  try {
    if (args[0] !== 'init' || !args[1] || !args[2]) throw new Error('usage: manifest.ts init <source_id> <pages: 120-125,301> [--content table] [--tables "57;60"]');
    const content = (opt('--content') ?? 'table') as Content;
    if (!(CONTENT as readonly string[]).includes(content)) throw new Error(`--content must be one of ${CONTENT.join('|')}`);
    const r = roots();
    const path = manifestCsv(r, args[1]);
    const rows = addPages(readManifest(path), args[1], parsePageList(args[2]), { content, ...(opt('--tables') ? { tables: opt('--tables')! } : {}) });
    writeTextFile(path, writeManifest(rows));
    console.log(`${path}: ${rows.length} page(s)`);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
