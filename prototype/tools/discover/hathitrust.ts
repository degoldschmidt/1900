/**
 * HathiTrust discovery: the Bib API, rights codes, page image and full-text search links.
 *
 * Documented formats this module is built against (verify once the hosts are reachable):
 * - Bib API: GET https://catalog.hathitrust.org/api/volumes/brief/<idtype>/<id>.json
 *   (idtype oclc | lccn | issn | isbn | htid | recordnumber) and …/full/… (adds "marc-xml" per record):
 *   { records: { "<recordnumber>": { recordURL, titles: [..], isbns, issns, oclcs, lccns, publishDates: [..],
 *                                    "marc-xml"?: "<collection>…</collection>" } },
 *     items: [{ orig, fromRecord, htid, itemURL, rightsCode, lastUpdate, enumcron (string or false), usRightsString }] }
 * - Page image: https://babel.hathitrust.org/cgi/imgsrv/image?id=<htid>&seq=<n>&size=full (seq 1-based)
 * - Full-text search across the collection: https://babel.hathitrust.org/cgi/ls?q1=<q>&anyall1=phrase&lmt=ft
 * - Search inside one volume: https://babel.hathitrust.org/cgi/pt/search?q1=<q>&id=<htid>
 * The Bib API looks volumes up by identifier only; title searching is done in the catalog UI
 * (catalogSearchUrl) and the identifiers found there go into tools/discover/search-plan.json.
 *
 * Rights: pd (and the Creative Commons codes) = full view everywhere → access "full";
 * pdus = full view in the US only → "pdus"; everything else (ic, icus, op, orph, und, nobody, …) → "none".
 */
import type { CatalogueRow } from './catalogue.ts';
import { sourceIdFor } from './catalogue.ts';
import type { Access } from './catalogue.ts';

export type HtIdType = 'oclc' | 'lccn' | 'issn' | 'isbn' | 'htid' | 'recordnumber';

export const bibApiUrl = (level: 'brief' | 'full', type: HtIdType, id: string) =>
  `https://catalog.hathitrust.org/api/volumes/${level}/${type}/${encodeURIComponent(id)}.json`;
export const pageImageUrl = (htid: string, seq: number) =>
  `https://babel.hathitrust.org/cgi/imgsrv/image?id=${encodeURIComponent(htid)}&seq=${seq}&size=full`;
export const fullTextSearchUrl = (q: string) =>
  `https://babel.hathitrust.org/cgi/ls?q1=${encodeURIComponent(q)}&anyall1=phrase&lmt=ft`;
export const searchInsideUrl = (htid: string, q: string) =>
  `https://babel.hathitrust.org/cgi/pt/search?q1=${encodeURIComponent(q)}&id=${encodeURIComponent(htid)}`;
export const viewerUrl = (htid: string) => `https://babel.hathitrust.org/cgi/pt?id=${encodeURIComponent(htid)}`;
export const catalogSearchUrl = (title: string) =>
  `https://catalog.hathitrust.org/Search/Home?lookfor=${encodeURIComponent(title)}&type=title`;

export function accessFromRights(code: string): Access {
  const c = code.trim().toLowerCase();
  if (c === 'pd' || c === 'pdw' || c.startsWith('cc-') || c === 'cc0') return 'full';
  if (c === 'pdus') return 'pdus';
  return 'none';
}

export interface HtRecord {
  recordNumber: string;
  recordURL: string;
  title: string;
  publishDates: string[];
  oclcs: string[];
  marc: { publisher: string; edition: string; date: string; language: string } | null;
}

export interface HtItem {
  htid: string;
  fromRecord: string;
  orig: string;
  itemURL: string;
  rightsCode: string;
  enumcron: string;
  usRightsString: string;
  lastUpdate: string;
}

export interface HtVolumes { records: HtRecord[]; items: HtItem[] }

const str = (v: unknown) => (v === undefined || v === null || v === false ? '' : String(v).trim());
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** Extracts subfield `code` of the first datafield `tag` from MARC-XML (namespace prefixes allowed). */
export function marcSubfield(xml: string, tag: string, code: string): string {
  const df = new RegExp(`<(?:\\w+:)?datafield[^>]*\\btag="${tag}"[^>]*>([\\s\\S]*?)</(?:\\w+:)?datafield>`).exec(xml);
  if (!df) return '';
  const sf = new RegExp(`<(?:\\w+:)?subfield[^>]*\\bcode="${code}"[^>]*>([\\s\\S]*?)</(?:\\w+:)?subfield>`).exec(df[1]!);
  return sf ? decodeXml(sf[1]!).replace(/\s*[,:;/]\s*$/, '').trim() : '';
}

/** MARC 008/35-37 language code. */
export function marcLanguage(xml: string): string {
  const cf = /<(?:\w+:)?controlfield[^>]*\btag="008"[^>]*>([^<]*)</.exec(xml);
  return cf && cf[1]!.length >= 38 ? cf[1]!.slice(35, 38).trim() : '';
}

export function decodeXml(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

export function parseBibApi(json: unknown): HtVolumes {
  const j = json as { records?: Record<string, Record<string, unknown>>; items?: Array<Record<string, unknown>> };
  if (!j || typeof j !== 'object' || (!j.records && !j.items)) throw new Error('HathiTrust Bib API: reply has neither records nor items');
  const records: HtRecord[] = Object.keys(j.records ?? {}).sort().map((k) => {
    const r = j.records![k]!;
    const marcXml = str(r['marc-xml']);
    return {
      recordNumber: k,
      recordURL: str(r.recordURL),
      title: strs(r.titles)[0] ?? '',
      publishDates: strs(r.publishDates),
      oclcs: strs(r.oclcs),
      marc: marcXml ? {
        publisher: marcSubfield(marcXml, '260', 'b') || marcSubfield(marcXml, '264', 'b'),
        edition: marcSubfield(marcXml, '250', 'a'),
        date: marcSubfield(marcXml, '260', 'c') || marcSubfield(marcXml, '264', 'c'),
        language: marcLanguage(marcXml),
      } : null,
    };
  });
  const items: HtItem[] = (j.items ?? []).map((it) => ({
    htid: str(it.htid),
    fromRecord: str(it.fromRecord),
    orig: str(it.orig),
    itemURL: str(it.itemURL),
    rightsCode: str(it.rightsCode),
    enumcron: str(it.enumcron),
    usRightsString: str(it.usRightsString),
    lastUpdate: str(it.lastUpdate),
  })).filter((i) => i.htid);
  return { records, items };
}

/** One catalogue row per HathiTrust item (volume). */
export function htCatalogueRows(v: HtVolumes, foundBy: string): CatalogueRow[] {
  const recs = new Map(v.records.map((r) => [r.recordNumber, r]));
  return v.items.map((it) => {
    const rec = recs.get(it.fromRecord);
    const access = accessFromRights(it.rightsCode);
    const notes = [it.enumcron ? `enumcron: ${it.enumcron}` : '', it.orig ? `from ${it.orig}` : '', `rights ${it.rightsCode}`]
      .filter(Boolean).join('; ');
    return {
      source_id: sourceIdFor('hathitrust', it.htid),
      library: 'hathitrust',
      library_id: it.htid,
      title: rec?.title ?? '',
      publisher: rec?.marc?.publisher ?? '',
      edition_label: it.enumcron || rec?.marc?.edition || '',
      issue_date: rec?.publishDates[0] ?? rec?.marc?.date ?? '',
      validity_stated: '',
      access,
      pages: '',
      language: rec?.marc?.language ?? '',
      url: it.itemURL || viewerUrl(it.htid),
      terms_note: access === 'full' ? 'HathiTrust: full view' : access === 'pdus' ? 'HathiTrust: full view in the US only (pdus)' : `HathiTrust: no full view (${it.rightsCode})`,
      found_by: foundBy,
      notes,
    };
  });
}
