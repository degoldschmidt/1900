/**
 * data/sources/catalogue.csv: one row per digitised volume or issue found by discovery.
 *
 * source_id is derived from the library's own identifier, so re-running discovery finds the same row:
 *   archive.org  ia-<identifier>      (identifiers are already [A-Za-z0-9._-])
 *   HathiTrust   ht-<htid>            (e.g. ht-mdp.39015012345678)
 *   Gallica      ga-<ark name>        (the part after ark:/12148/, e.g. ga-bpt6k1234567x)
 * Characters outside [A-Za-z0-9._-] are written as ~XX (UTF-8 hex), so the mapping is reversible and
 * the id is safe as a file name (htids such as uc1.$b123456 or uc2.ark:/13960/t0abc become
 * ht-uc1.~24b123456 and ht-uc2.ark~3a~2f13960~2ft0abc).
 *
 * Merging is deterministic: rows are sorted by source_id; discovery refreshes the library-owned
 * fields (library, library_id, url, access, pages, language), fills the descriptive fields (title,
 * publisher, edition_label, issue_date, terms_note, notes) only when they are empty, never touches
 * validity_stated, and keeps found_by as the sorted union of query ids.
 */
import { cmpStr, readCsvFileOr, writeCsv, type CsvRow } from '../keying/csv.ts';

export const CATALOGUE_COLUMNS = [
  'source_id', 'library', 'library_id', 'title', 'publisher', 'edition_label', 'issue_date', 'validity_stated',
  'access', 'pages', 'language', 'url', 'terms_note', 'found_by', 'notes',
] as const;

/** owner-scan: pages photographed by the owner from a printed copy (imported by tools/fetch/import-scans.ts). */
export type Library = 'archive.org' | 'hathitrust' | 'gallica' | 'owner-scan';
export type Access = 'full' | 'pdus' | 'none' | '';

export type CatalogueRow = Record<(typeof CATALOGUE_COLUMNS)[number], string>;

const PREFIX: Record<Library, string> = { 'archive.org': 'ia', hathitrust: 'ht', gallica: 'ga', 'owner-scan': 'os' };

export function encodeIdPart(s: string): string {
  let out = '';
  for (const ch of s) {
    if (/[A-Za-z0-9._-]/.test(ch)) out += ch;
    else for (const b of Buffer.from(ch, 'utf8')) out += `~${b.toString(16).padStart(2, '0')}`;
  }
  return out;
}

export function decodeIdPart(s: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '~') { bytes.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(...Buffer.from(s[i]!, 'utf8'));
  }
  return Buffer.from(bytes).toString('utf8');
}

/** Strips "ark:/12148/" and any URL prefix from a Gallica ark. */
export function gallicaArkName(ark: string): string {
  const m = /ark:\/12148\/([^/?#\s]+)/.exec(ark);
  return m ? m[1]! : ark.trim();
}

export function sourceIdFor(library: Library, libraryId: string): string {
  const id = library === 'gallica' ? gallicaArkName(libraryId) : libraryId.trim();
  if (!id) throw new Error(`empty ${library} identifier`);
  return `${PREFIX[library]}-${encodeIdPart(id)}`;
}

export function parseSourceId(sourceId: string): { library: Library; libraryId: string } {
  const m = /^(ia|ht|ga|os)-(.+)$/.exec(sourceId);
  if (!m) throw new Error(`source_id "${sourceId}" does not start with ia-, ht-, ga- or os-`);
  const library = (Object.keys(PREFIX) as Library[]).find((l) => PREFIX[l] === m[1])!;
  return { library, libraryId: decodeIdPart(m[2]!) };
}

const REFRESH = ['library', 'library_id', 'url', 'access', 'pages', 'language'] as const;
const FILL = ['title', 'publisher', 'edition_label', 'issue_date', 'terms_note', 'notes'] as const;

function emptyRow(id: string): CatalogueRow {
  const r = {} as CatalogueRow;
  for (const c of CATALOGUE_COLUMNS) r[c] = '';
  r.source_id = id;
  return r;
}

function unionList(a: string, b: string): string {
  return [...new Set([...a.split(';'), ...b.split(';')].map((s) => s.trim()).filter(Boolean))].sort(cmpStr).join(';');
}

/** Merges one discovered row into an existing one (see the module comment). */
export function mergeRow(existing: CatalogueRow | undefined, found: CatalogueRow): CatalogueRow {
  const out = existing ? { ...existing } : emptyRow(found.source_id);
  for (const c of REFRESH) if (found[c]) out[c] = found[c];
  for (const c of FILL) if (!out[c] && found[c]) out[c] = found[c];
  out.found_by = unionList(out.found_by, found.found_by);
  return out;
}

/** Merges discovered rows into the existing catalogue; returns rows sorted by source_id. */
export function mergeCatalogue(existing: readonly CatalogueRow[], found: readonly CatalogueRow[]): CatalogueRow[] {
  const byId = new Map<string, CatalogueRow>();
  for (const r of existing) {
    if (byId.has(r.source_id)) throw new Error(`catalogue: duplicate source_id ${r.source_id}`);
    byId.set(r.source_id, r);
  }
  for (const f of found) byId.set(f.source_id, mergeRow(byId.get(f.source_id), f));
  return [...byId.values()].sort((a, b) => cmpStr(a.source_id, b.source_id));
}

export function toCatalogueRow(r: CsvRow): CatalogueRow {
  const out = emptyRow(r.source_id ?? '');
  for (const c of CATALOGUE_COLUMNS) out[c] = r[c] ?? '';
  return out;
}

export function readCatalogue(path: string): CatalogueRow[] {
  return readCsvFileOr(path, CATALOGUE_COLUMNS).rows.map(toCatalogueRow);
}

export function writeCatalogue(rows: readonly CatalogueRow[]): string {
  return writeCsv(CATALOGUE_COLUMNS, [...rows].sort((a, b) => cmpStr(a.source_id, b.source_id)));
}
