/**
 * Gallica (BnF) discovery: SRU search, issue lists of periodicals, pagination, ContentSearch, IIIF.
 *
 * Documented formats this module is built against (verify once gallica.bnf.fr is reachable):
 * - SRU: GET https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=<CQL>&maximumRecords=N&startRecord=K
 *   → <srw:searchRetrieveResponse><srw:numberOfRecords>…</srw:numberOfRecords><srw:records><srw:record>
 *       <srw:recordData><oai_dc:dc><dc:title/>, <dc:date/>, <dc:identifier>https://gallica.bnf.fr/ark:/12148/<ark></dc:identifier>,
 *       <dc:publisher/>, <dc:language/>, <dc:rights xml:lang="…"/>, <dc:type/>…</oai_dc:dc></srw:recordData>
 *       <srw:extraRecordData><typedoc>monographie|fascicule|periodique</typedoc>…</srw:extraRecordData>
 * - Issues of a periodical: GET https://gallica.bnf.fr/services/Issues?ark=ark:/12148/<cb…>/date&date=<year>
 *   → <issues …><issue ark="bpt6k…" dayOfYear="…">1 juin 1914</issue>…</issues>
 * - Pagination: GET https://gallica.bnf.fr/services/Pagination?ark=<ark>
 *   → <livre><structure><nbVueImages>N</nbVueImages>…</structure>
 *       <pages><page><numero>12</numero><ordre>14</ordre><pagination_type>A</pagination_type>
 *       <image_width>…</image_width><image_height>…</image_height></page>…</pages></livre>
 * - ContentSearch: GET https://gallica.bnf.fr/services/ContentSearch?ark=<ark>&query=<words>
 *   → <results …><items><item><p_id>PAG_14</p_id><page>14</page><content>…</content></item>…</items></results>
 *   ASSUMPTION: the hit's view number is <page>, else the number in p_id "PAG_<n>"; it is the
 *   image order (ordre / f<n>), not the printed page number.
 * - IIIF image: https://gallica.bnf.fr/iiif/ark:/12148/<ark>/f<n>/full/full/0/native.jpg (n = ordre, 1-based)
 *
 * The XML is read with small regular expressions (no XML dependency), tolerant of namespace prefixes.
 */
import type { CatalogueRow } from './catalogue.ts';
import { gallicaArkName, sourceIdFor } from './catalogue.ts';
import { decodeXml } from './hathitrust.ts';

const BASE = 'https://gallica.bnf.fr';

export function sruUrl(cql: string, o: { maximumRecords?: number; startRecord?: number } = {}): string {
  const p = new URLSearchParams({
    operation: 'searchRetrieve', version: '1.2', query: cql,
    maximumRecords: String(o.maximumRecords ?? 50), startRecord: String(o.startRecord ?? 1),
  });
  return `${BASE}/SRU?${p.toString()}`;
}
export const issuesUrl = (periodicalArk: string, year: number) =>
  `${BASE}/services/Issues?ark=${encodeURIComponent(`ark:/12148/${gallicaArkName(periodicalArk)}/date`)}&date=${year}`;
export const paginationUrl = (ark: string) => `${BASE}/services/Pagination?ark=${encodeURIComponent(gallicaArkName(ark))}`;
export const contentSearchUrl = (ark: string, query: string) =>
  `${BASE}/services/ContentSearch?ark=${encodeURIComponent(gallicaArkName(ark))}&query=${encodeURIComponent(query)}`;
export const iiifImageUrl = (ark: string, n: number) => `${BASE}/iiif/ark:/12148/${gallicaArkName(ark)}/f${n}/full/full/0/native.jpg`;
export const viewerUrl = (ark: string) => `${BASE}/ark:/12148/${gallicaArkName(ark)}`;

/** All elements named `name` (any namespace prefix): their inner XML and attribute string. */
export function elements(xml: string, name: string): Array<{ attrs: string; inner: string }> {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>)`, 'g');
  const out: Array<{ attrs: string; inner: string }> = [];
  for (const m of xml.matchAll(re)) out.push({ attrs: m[1] ?? '', inner: m[2] ?? '' });
  return out;
}

export function text(inner: string): string {
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(inner);
  const raw = cdata ? cdata[1]! : inner.replace(/<[^>]+>/g, '');
  return (cdata ? raw : decodeXml(raw)).replace(/\s+/g, ' ').trim();
}

export function attr(attrs: string, name: string): string {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(attrs);
  return m ? decodeXml(m[1]!) : '';
}

const first = (xml: string, name: string) => { const e = elements(xml, name)[0]; return e ? text(e.inner) : ''; };

export interface GallicaRecord {
  ark: string;
  title: string;
  date: string;
  publisher: string;
  language: string;
  rights: string;
  typedoc: string;
  identifier: string;
}

export interface SruPage { numberOfRecords: number; records: GallicaRecord[]; nextRecordPosition: number | null }

export function parseSru(xml: string): SruPage {
  if (!/searchRetrieveResponse/.test(xml)) throw new Error('Gallica SRU: not a searchRetrieveResponse');
  const diag = elements(xml, 'diagnostic')[0];
  if (diag) throw new Error(`Gallica SRU diagnostic: ${first(diag.inner, 'message') || text(diag.inner)}`);
  const records = elements(xml, 'record').map((r) => {
    const dc = elements(r.inner, 'recordData')[0]?.inner ?? r.inner;
    const ids = elements(dc, 'identifier').map((e) => text(e.inner));
    const identifier = ids.find((i) => /ark:\/12148\//.test(i)) ?? ids[0] ?? '';
    const rights = elements(dc, 'rights');
    const rightsEn = rights.find((e) => attr(e.attrs, 'xml:lang') === 'eng') ?? rights[0];
    return {
      ark: /ark:\/12148\//.test(identifier) ? gallicaArkName(identifier) : '',
      title: first(dc, 'title'),
      date: first(dc, 'date'),
      publisher: first(dc, 'publisher'),
      language: elements(dc, 'language').map((e) => text(e.inner)).join('; '),
      rights: rightsEn ? text(rightsEn.inner) : '',
      typedoc: first(r.inner, 'typedoc'),
      identifier,
    };
  }).filter((r) => r.ark);
  const n = Number(first(xml, 'numberOfRecords'));
  const next = Number(first(xml, 'nextRecordPosition'));
  return { numberOfRecords: Number.isFinite(n) ? n : records.length, records, nextRecordPosition: Number.isFinite(next) && next > 0 ? next : null };
}

/** Periodical title records have arks of the form cb…/date; their issues come from the Issues service. */
export function isPeriodicalRecord(r: GallicaRecord): boolean {
  return r.typedoc === 'periodique' || /^cb\w+\/date/.test(r.identifier.split('ark:/12148/')[1] ?? '') || /\/date$/.test(r.identifier);
}

export interface GallicaIssue { ark: string; label: string; dayOfYear: string }

export function parseIssues(xml: string): GallicaIssue[] {
  return elements(xml, 'issue').map((e) => ({ ark: gallicaArkName(attr(e.attrs, 'ark')), label: text(e.inner), dayOfYear: attr(e.attrs, 'dayOfYear') }))
    .filter((i) => i.ark);
}

export interface GallicaPage { ordre: number; numero: string; type: string; width: number | null; height: number | null }

export function parsePagination(xml: string): { views: number; pages: GallicaPage[] } {
  const pages = elements(xml, 'page').map((p) => {
    const w = Number(first(p.inner, 'image_width')); const h = Number(first(p.inner, 'image_height'));
    return {
      ordre: Number(first(p.inner, 'ordre')),
      numero: first(p.inner, 'numero'),
      type: first(p.inner, 'pagination_type'),
      width: Number.isFinite(w) && w > 0 ? w : null,
      height: Number.isFinite(h) && h > 0 ? h : null,
    };
  }).filter((p) => Number.isInteger(p.ordre) && p.ordre > 0);
  const nb = Number(first(xml, 'nbVueImages'));
  return { views: Number.isFinite(nb) && nb > 0 ? nb : pages.length, pages };
}

export interface ContentHit { view: number; snippet: string }

export function parseContentSearch(xml: string): ContentHit[] {
  const hits = elements(xml, 'item').map((it) => {
    const page = Number(first(it.inner, 'page'));
    const pid = /PAG_(\d+)/.exec(first(it.inner, 'p_id'));
    const view = Number.isInteger(page) && page > 0 ? page : pid ? Number(pid[1]) : NaN;
    return { view, snippet: first(it.inner, 'content') };
  }).filter((h) => Number.isInteger(h.view));
  return hits.sort((a, b) => a.view - b.view);
}

export function accessFromRights(rights: string): 'full' | 'none' | '' {
  if (/public domain|domaine public/i.test(rights)) return 'full';
  if (!rights) return '';
  return 'none';
}

export function gallicaCatalogueRow(r: GallicaRecord, foundBy: string, o: { pages?: number; issueLabel?: string } = {}): CatalogueRow {
  const access = accessFromRights(r.rights);
  return {
    source_id: sourceIdFor('gallica', r.ark),
    library: 'gallica',
    library_id: `ark:/12148/${r.ark}`,
    title: r.title,
    publisher: r.publisher,
    edition_label: o.issueLabel ?? '',
    issue_date: r.date,
    validity_stated: '',
    access,
    pages: o.pages ? String(o.pages) : '',
    language: r.language,
    url: viewerUrl(r.ark),
    terms_note: access === 'full'
      ? 'Gallica: public domain; non-commercial reuse free, commercial reuse needs a BnF licence'
      : r.rights ? `Gallica: ${r.rights}` : 'Gallica: rights not stated in SRU record',
    found_by: foundBy,
    notes: r.typedoc ? `typedoc ${r.typedoc}` : '',
  };
}
