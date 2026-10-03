/**
 * archive.org discovery: advanced search, item metadata, full text (djvu.txt) and a station grep.
 *
 * Documented formats this module is built against (verify once archive.org is reachable):
 * - Advanced search: GET https://archive.org/advancedsearch.php?q=<lucene>&fl[]=identifier&…&rows=N&page=P&output=json
 *   → { responseHeader: {...}, response: { numFound, start, docs: [{ identifier, title, year, date, creator, language }] } }
 *   Field values may be a string, a number (year) or an array of strings.
 * - Item metadata: GET https://archive.org/metadata/<identifier>
 *   → { metadata: { identifier, title, date, year, creator, publisher, language, imagecount, possible-copyright-status, … },
 *       files: [{ name, format, source, size }], … }; an unknown identifier returns {}.
 * - Full text: https://archive.org/download/<identifier>/<file> where <file> has format "DjVuTXT"
 *   (usually <identifier>_djvu.txt).
 * - Page images (BookReader): https://archive.org/download/<identifier>/page/n<leaf>.jpg, leaf 0-based.
 *
 * Pages (verified against live archive.org on 3 Oct 2026): djvu.txt has NO page separators on
 * current items (no form feeds), so it cannot locate pages. Items OCRed with the hOCR pipeline carry
 *   <id>_hocr_searchtext.txt.gz   the plain text of all leaves, concatenated;
 *   <id>_hocr_pageindex.json.gz   one [textStart, textEnd, hocrStart, hocrEnd] entry per leaf, in leaf order;
 *   <id>_page_numbers.json        { pages: [{ leafNum, pageNumber, … }] } with printed page numbers.
 * Leaf i (0-based) is stored as page_seq = i + 1 and is the BookReader page n<i>. djvu.txt split on
 * form feeds remains a fallback for older items that have no hOCR files.
 */
import type { CatalogueRow } from './catalogue.ts';
import { sourceIdFor } from './catalogue.ts';

export const IA_FIELDS = ['identifier', 'title', 'year', 'date', 'creator', 'language', 'publisher'] as const;

export function advancedSearchUrl(q: string, o: { rows?: number; page?: number; fields?: readonly string[] } = {}): string {
  const p = new URLSearchParams();
  p.set('q', q);
  for (const f of o.fields ?? IA_FIELDS) p.append('fl[]', f);
  p.append('sort[]', 'identifier asc');
  p.set('rows', String(o.rows ?? 100));
  p.set('page', String(o.page ?? 1));
  p.set('output', 'json');
  return `https://archive.org/advancedsearch.php?${p.toString()}`;
}

export const metadataUrl = (id: string) => `https://archive.org/metadata/${encodeURIComponent(id)}`;
export const detailsUrl = (id: string) => `https://archive.org/details/${encodeURIComponent(id)}`;
export const downloadUrl = (id: string, file: string) => `https://archive.org/download/${encodeURIComponent(id)}/${file.split('/').map(encodeURIComponent).join('/')}`;
export const djvuTxtUrl = (id: string, file?: string) => downloadUrl(id, file ?? `${id}_djvu.txt`);
/** BookReader page image; `seq` is our 1-based page_seq (leaf = seq - 1). */
export const pageImageUrl = (id: string, seq: number) => `https://archive.org/download/${encodeURIComponent(id)}/page/n${seq - 1}.jpg`;

export interface IaDoc {
  identifier: string;
  title: string;
  year: string;
  date: string;
  creator: string;
  language: string;
  publisher: string;
}

/** Flattens a field that may be a string, number or array into a "; "-joined string. */
export function flat(v: unknown): string {
  if (v === undefined || v === null) return '';
  if (Array.isArray(v)) return v.map(flat).filter(Boolean).join('; ');
  return String(v).trim();
}

export interface IaSearchPage { numFound: number; start: number; docs: IaDoc[] }

export function parseAdvancedSearch(json: unknown): IaSearchPage {
  const r = (json as { response?: { numFound?: unknown; start?: unknown; docs?: unknown } })?.response;
  if (!r || !Array.isArray(r.docs)) throw new Error('archive.org advancedsearch: no response.docs in reply');
  const docs = (r.docs as Array<Record<string, unknown>>).map((d) => ({
    identifier: flat(d.identifier),
    title: flat(d.title),
    year: flat(d.year),
    date: flat(d.date),
    creator: flat(d.creator),
    language: flat(d.language),
    publisher: flat(d.publisher),
  })).filter((d) => d.identifier);
  return { numFound: Number(r.numFound ?? docs.length), start: Number(r.start ?? 0), docs };
}

export interface IaItem {
  identifier: string;
  title: string;
  date: string;
  year: string;
  creator: string;
  publisher: string;
  language: string;
  imagecount: number | null;
  copyright: string;
  djvuTxtFile: string | null;
  /** Page-indexed OCR (preferred for locating pages). */
  hocrSearchTextFile: string | null;
  hocrPageIndexFile: string | null;
  pageNumbersFile: string | null;
  files: Array<{ name: string; format: string }>;
}

export function parseMetadata(json: unknown): IaItem | null {
  const j = json as { metadata?: Record<string, unknown>; files?: Array<Record<string, unknown>> };
  if (!j || !j.metadata || !j.metadata.identifier) return null; // unknown identifiers return {}
  const m = j.metadata;
  const files = (j.files ?? []).map((f) => ({ name: flat(f.name), format: flat(f.format) }));
  const djvu = files.find((f) => f.format === 'DjVuTXT') ?? files.find((f) => f.name.endsWith('_djvu.txt'));
  const ic = Number(flat(m.imagecount));
  return {
    identifier: flat(m.identifier),
    title: flat(m.title),
    date: flat(m.date),
    year: flat(m.year),
    creator: flat(m.creator),
    publisher: flat(m.publisher),
    language: flat(m.language),
    imagecount: Number.isFinite(ic) && ic > 0 ? ic : null,
    copyright: flat(m['possible-copyright-status']) || flat(m.rights),
    djvuTxtFile: djvu ? djvu.name : null,
    hocrSearchTextFile: files.find((f) => f.name.endsWith('_hocr_searchtext.txt.gz'))?.name ?? null,
    hocrPageIndexFile: files.find((f) => f.name.endsWith('_hocr_pageindex.json.gz'))?.name ?? null,
    pageNumbersFile: files.find((f) => f.name.endsWith('_page_numbers.json'))?.name ?? null,
    files,
  };
}

/** A catalogue row for an archive.org item (from a search doc, enriched by metadata when present). */
export function iaCatalogueRow(doc: IaDoc, item: IaItem | null, foundBy: string): CatalogueRow {
  const date = item?.date || doc.date || item?.year || doc.year;
  return {
    source_id: sourceIdFor('archive.org', doc.identifier),
    library: 'archive.org',
    library_id: doc.identifier,
    title: item?.title || doc.title,
    publisher: item?.publisher || doc.publisher,
    edition_label: '',
    issue_date: normaliseIaDate(date),
    validity_stated: '',
    access: 'full',
    pages: item?.imagecount ? String(item.imagecount) : '',
    language: item?.language || doc.language,
    url: detailsUrl(doc.identifier),
    terms_note: item?.copyright ? `archive.org: ${item.copyright}` : 'archive.org: check the item page for rights',
    found_by: foundBy,
    notes: item && !item.djvuTxtFile ? 'no DjVuTXT full text' : '',
  };
}

/** "1914-01-01T00:00:00Z" → "1914-01-01"; keeps "1914" or "1914-06" as given. */
export function normaliseIaDate(s: string): string {
  const t = s.split(';')[0]!.trim();
  const m = /^(\d{4})(-\d{2})?(-\d{2})?/.exec(t);
  if (!m) return t;
  if (/T00:00:00Z?$/.test(t) && m[2] === '-01' && m[3] === '-01') return m[1]!; // IA stores bare years as Jan 1
  return m[0];
}

// ---------------------------------------------------------------- full-text grep

/** Splits djvu.txt into pages on form feeds (fallback for items without hOCR files). */
export function splitDjvuPages(text: string): string[] {
  return text.split('\f');
}

/** Splits hOCR search text into leaves using the page index ([textStart, textEnd, …] per leaf). */
export function splitByPageIndex(text: string, index: ReadonlyArray<readonly number[]>): string[] {
  return index.map((e) => text.slice(e[0] ?? 0, e[1] ?? 0));
}

/** Printed page number per page_seq (leaf + 1), from <id>_page_numbers.json. */
export function printedPages(json: unknown): Map<number, string> {
  const out = new Map<number, string>();
  const pages = (json as { pages?: Array<{ leafNum?: number; pageNumber?: string }> })?.pages ?? [];
  for (const p of pages) if (typeof p.leafNum === 'number' && p.pageNumber) out.set(p.leafNum + 1, String(p.pageNumber));
  return out;
}

/** Lower-cases, strips diacritics, folds ß/œ/æ and turns punctuation into single spaces. */
export function foldForMatch(s: string): string {
  return s.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()
    .replace(/ß/g, 'ss').replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Folded page text, plus a second copy with words hyphenated across line ends joined. */
function foldPage(p: string): string {
  const joined = p.replace(/-[ \t]*\r?\n[ \t]*/g, '');
  return ` ${foldForMatch(p)} ${joined === p ? '' : `${foldForMatch(joined)} `}`;
}

export interface StationHit {
  page_seq: number;
  stations: string[];
  /** The printed page number, when the item records one. */
  printed?: string;
}

/**
 * Pages whose OCR text mentions at least `minStations` of the given station names (each name may
 * list variants separated by "|", e.g. "Köln|Cologne|Coeln"). Sorted by number of distinct stations
 * matched (descending), then page. Values are never read from OCR: this only finds pages.
 */
export function grepStations(text: string, stations: readonly string[], minStations = 1): StationHit[] {
  return grepPages(splitDjvuPages(text), stations, minStations);
}

/** As grepStations, over text already split into pages (page_seq = index + 1). */
export function grepPages(rawPages: readonly string[], stations: readonly string[], minStations = 1): StationHit[] {
  const pages = rawPages.map(foldPage);
  const patterns = stations.map((s) => ({ name: s.split('|')[0]!.trim(), variants: s.split('|').map((v) => ` ${foldForMatch(v)} `).filter((v) => v.trim()) }));
  const hits: StationHit[] = [];
  pages.forEach((page, i) => {
    const found = patterns.filter((p) => p.variants.some((v) => page.includes(v))).map((p) => p.name);
    if (found.length >= minStations) hits.push({ page_seq: i + 1, stations: found });
  });
  return hits.sort((a, b) => b.stations.length - a.stations.length || a.page_seq - b.page_seq);
}
