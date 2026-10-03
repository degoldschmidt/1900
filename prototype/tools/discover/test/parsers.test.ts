import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ia from '../archive-org.ts';
import * as ht from '../hathitrust.ts';
import * as ga from '../gallica.ts';

const fx = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
const json = (name: string) => JSON.parse(fx(name)) as unknown;

describe('archive.org', () => {
  it('builds the advanced search URL with fields, paging and JSON output', () => {
    const u = new URL(ia.advancedSearchUrl('title:(bradshaw) AND mediatype:texts', { rows: 50, page: 2 }));
    expect(u.origin + u.pathname).toBe('https://archive.org/advancedsearch.php');
    expect(u.searchParams.get('q')).toBe('title:(bradshaw) AND mediatype:texts');
    expect(u.searchParams.getAll('fl[]')).toEqual(['identifier', 'title', 'year', 'date', 'creator', 'language', 'publisher']);
    expect(u.searchParams.get('rows')).toBe('50');
    expect(u.searchParams.get('page')).toBe('2');
    expect(u.searchParams.get('output')).toBe('json');
  });

  it('parses advanced search results whose fields are strings, numbers or arrays', () => {
    const r = ia.parseAdvancedSearch(json('ia-advancedsearch.json'));
    expect(r.numFound).toBe(4);
    expect(r.docs).toHaveLength(4);
    expect(r.docs[0]).toMatchObject({ identifier: 'bradshawscontine1914brad', year: '1914', creator: 'Bradshaw, George, 1801-1853', language: 'English' });
    expect(r.docs[1]!.language).toBe('English');
    expect(() => ia.parseAdvancedSearch({ error: 'x' })).toThrow(/response\.docs/);
  });

  it('parses item metadata, finds the DjVuTXT file and treats {} as unknown', () => {
    const item = ia.parseMetadata(json('ia-metadata.json'))!;
    expect(item).toMatchObject({ identifier: 'bradshawscontine1914brad', imagecount: 1186, djvuTxtFile: 'bradshawscontine1914brad_djvu.txt', copyright: 'NOT_IN_COPYRIGHT' });
    expect(ia.parseMetadata(json('ia-metadata-missing.json'))).toBeNull();
    const odd = ia.parseMetadata(json('ia-metadata-1913.json'))!;
    expect(ia.djvuTxtUrl(odd.identifier, odd.djvuTxtFile!)).toBe('https://archive.org/download/bradshawscontine1913june/Bradshaw%20June%201913_djvu.txt');
    expect(ia.djvuTxtUrl('abc')).toBe('https://archive.org/download/abc/abc_djvu.txt');
    expect(ia.pageImageUrl('abc', 1)).toBe('https://archive.org/download/abc/page/n0.jpg');
  });

  it('makes a catalogue row with a stable source_id', () => {
    const doc = ia.parseAdvancedSearch(json('ia-advancedsearch.json')).docs[0]!;
    const row = ia.iaCatalogueRow(doc, ia.parseMetadata(json('ia-metadata.json')), 'bradshaw-continental:ia');
    expect(row).toMatchObject({
      source_id: 'ia-bradshawscontine1914brad', library: 'archive.org', issue_date: '1914', pages: '1186', access: 'full',
      url: 'https://archive.org/details/bradshawscontine1914brad', language: 'eng',
    });
    expect(ia.normaliseIaDate('1913-06-01T00:00:00Z')).toBe('1913-06-01');
    expect(ia.normaliseIaDate('1914-01-01T00:00:00Z')).toBe('1914');
  });

  it('splits djvu.txt on form feeds and greps station names, folding accents and line-end hyphens', () => {
    const text = fx('ia-djvu.txt');
    expect(ia.splitDjvuPages(text)).toHaveLength(5);
    const hits = ia.grepStations(text, ['Berlin', 'Eydtkuhnen', 'Wirballen', 'Köln|Cologne|Coeln', 'Königsberg'], 2);
    expect(hits).toEqual([
      { page_seq: 3, stations: ['Berlin', 'Eydtkuhnen', 'Wirballen', 'Königsberg'] },
      { page_seq: 4, stations: ['Berlin', 'Eydtkuhnen', 'Wirballen'] },
      { page_seq: 2, stations: ['Berlin', 'Köln'] },
    ]);
    // A name is matched as a whole word, not inside another word.
    expect(ia.grepStations('Berliner Zeitung', ['Berlin'])).toEqual([]);
  });
});

describe('HathiTrust', () => {
  it('builds Bib API, image and search URLs', () => {
    expect(ht.bibApiUrl('brief', 'oclc', '1536542')).toBe('https://catalog.hathitrust.org/api/volumes/brief/oclc/1536542.json');
    expect(ht.bibApiUrl('full', 'htid', 'uc2.ark:/13960/t3bz6xk1m')).toBe('https://catalog.hathitrust.org/api/volumes/full/htid/uc2.ark%3A%2F13960%2Ft3bz6xk1m.json');
    expect(ht.pageImageUrl('mdp.39015011223344', 412)).toBe('https://babel.hathitrust.org/cgi/imgsrv/image?id=mdp.39015011223344&seq=412&size=full');
    expect(ht.fullTextSearchUrl('Eydtkuhnen Wirballen')).toBe('https://babel.hathitrust.org/cgi/ls?q1=Eydtkuhnen%20Wirballen&anyall1=phrase&lmt=ft');
  });

  it('maps rights codes to access', () => {
    expect(ht.accessFromRights('pd')).toBe('full');
    expect(ht.accessFromRights('cc-by-4.0')).toBe('full');
    expect(ht.accessFromRights('pdus')).toBe('pdus');
    for (const c of ['ic', 'icus', 'und', 'op', 'orph', 'nobody']) expect(ht.accessFromRights(c)).toBe('none');
  });

  it('parses a brief reply into one row per item with access from the rights code', () => {
    const rows = ht.htCatalogueRows(ht.parseBibApi(json('ht-brief-oclc.json')), 'bradshaw-continental:ht');
    expect(rows.map((r) => [r.source_id, r.access, r.edition_label])).toEqual([
      ['ht-mdp.39015011223344', 'full', '1914:June'],
      ['ht-hvd.32044099887766', 'pdus', '1913:Apr.'],
      ['ht-uc1.~24b551234', 'none', '1921:Jan.'],
      ['ht-nyp.33433000111222', 'none', ''],
    ]);
    expect(rows[0]!.url).toBe('https://hdl.handle.net/2027/mdp.39015011223344');
    expect(rows[0]!.notes).toBe('enumcron: 1914:June; from University of Michigan; rights pd');
  });

  it('reads publisher, edition, date and language from the MARC-XML of a full reply', () => {
    const v = ht.parseBibApi(json('ht-full-htid.json'));
    expect(v.records[0]!.marc).toEqual({ publisher: 'K. Baedeker', edition: '[1st English ed.]', date: '1914.', language: 'eng' });
    const [row] = ht.htCatalogueRows(v, 'baedeker-russia:ht');
    expect(row).toMatchObject({ source_id: 'ht-uc2.ark~3a~2f13960~2ft3bz6xk1m', access: 'full', issue_date: '1914', publisher: 'K. Baedeker', language: 'eng' });
    expect(() => ht.parseBibApi({})).toThrow(/neither records nor items/);
  });
});

describe('Gallica', () => {
  it('builds SRU, service and IIIF URLs', () => {
    const u = new URL(ga.sruUrl('dc.title all "livret chaix"', { maximumRecords: 20, startRecord: 21 }));
    expect(u.origin + u.pathname).toBe('https://gallica.bnf.fr/SRU');
    expect(Object.fromEntries(u.searchParams)).toEqual({ operation: 'searchRetrieve', version: '1.2', query: 'dc.title all "livret chaix"', maximumRecords: '20', startRecord: '21' });
    expect(ga.paginationUrl('ark:/12148/bpt6k5800152b')).toBe('https://gallica.bnf.fr/services/Pagination?ark=bpt6k5800152b');
    expect(ga.contentSearchUrl('bpt6k5800152b', 'Eydtkuhnen')).toBe('https://gallica.bnf.fr/services/ContentSearch?ark=bpt6k5800152b&query=Eydtkuhnen');
    expect(ga.issuesUrl('cb32808868k', 1914)).toBe('https://gallica.bnf.fr/services/Issues?ark=ark%3A%2F12148%2Fcb32808868k%2Fdate&date=1914');
    expect(ga.iiifImageUrl('bpt6k5800152b', 214)).toBe('https://gallica.bnf.fr/iiif/ark:/12148/bpt6k5800152b/f214/full/full/0/native.jpg');
  });

  it('parses SRU records: title, date, ark, rights, typedoc, entities and CDATA', () => {
    const p = ga.parseSru(fx('ga-sru.xml'));
    expect(p.numberOfRecords).toBe(3);
    expect(p.records.map((r) => [r.ark, r.date, r.typedoc, r.rights])).toEqual([
      ['cb32808868k', '1846-1939', 'periodique', 'public domain'],
      ['bpt6k9612345t', '1913', 'monographie', 'public domain'],
      ['bpt6k9700001z', '1925', 'monographie', 'public domain'],
    ]);
    expect(p.records[1]!.title).toBe("Livret-Chaix. Guide officiel des voyageurs & horaires du réseau de l'Est");
    expect(p.records[2]!.title).toBe('Livret-Chaix & annexes, 1925');
    expect(ga.isPeriodicalRecord(p.records[0]!)).toBe(true);
    expect(ga.isPeriodicalRecord(p.records[1]!)).toBe(false);
    const row = ga.gallicaCatalogueRow(p.records[1]!, 'livret-chaix:ga', { pages: 4 });
    expect(row).toMatchObject({ source_id: 'ga-bpt6k9612345t', library_id: 'ark:/12148/bpt6k9612345t', access: 'full', pages: '4', url: 'https://gallica.bnf.fr/ark:/12148/bpt6k9612345t' });
  });

  it('surfaces SRU diagnostics as errors', () => {
    expect(() => ga.parseSru(fx('ga-sru-diagnostic.xml'))).toThrow(/Query syntax error/);
  });

  it('parses issues, pagination and ContentSearch', () => {
    expect(ga.parseIssues(fx('ga-issues-1914.xml'))).toEqual([
      { ark: 'bpt6k5800114x', label: '01 avril 1914', dayOfYear: '91' },
      { ark: 'bpt6k5800152b', label: '01 juin 1914', dayOfYear: '152' },
    ]);
    expect(ga.parseIssues(fx('ga-issues-empty.xml'))).toEqual([]);
    const pag = ga.parsePagination(fx('ga-pagination.xml'));
    expect(pag.views).toBe(4);
    expect(pag.pages[2]).toEqual({ ordre: 3, numero: '1', type: 'A', width: 2475, height: 3712 });
    expect(ga.parseContentSearch(fx('ga-contentsearch.xml')).map((h) => h.view)).toEqual([37, 214]);
  });
});

describe('archive.org page-indexed OCR (hOCR search text + page index)', () => {
  it('splits text by the page index and reports printed page numbers', () => {
    const pages = ['Title page', 'Berlin dep. 11 0  Eydtkuhnen arr. 7 15', 'Index', 'Köln — Berlin  Wirballen'];
    const text = pages.join('');
    let at = 0;
    const index = pages.map((p) => { const e = [at, at + p.length, 0, 0]; at += p.length; return e; });
    expect(ia.splitByPageIndex(text, index)).toEqual(pages);
    const hits = ia.grepPages(ia.splitByPageIndex(text, index), ['Berlin', 'Eydtkuhnen', 'Wirballen'], 2);
    expect(hits.map((h) => [h.page_seq, h.stations])).toEqual([[2, ['Berlin', 'Eydtkuhnen']], [4, ['Berlin', 'Wirballen']]]);
    const printed = ia.printedPages({ pages: [{ leafNum: 1, pageNumber: '410' }, { leafNum: 3, pageNumber: '' }] });
    expect(printed.get(2)).toBe('410');
    expect(printed.has(4)).toBe(false);
  });

  it('finds the hOCR files in item metadata', () => {
    const item = ia.parseMetadata({ metadata: { identifier: 'x' }, files: [{ name: 'x_hocr_searchtext.txt.gz' }, { name: 'x_hocr_pageindex.json.gz' }, { name: 'x_page_numbers.json' }, { name: 'x_djvu.txt', format: 'DjVuTXT' }] })!;
    expect([item.hocrSearchTextFile, item.hocrPageIndexFile, item.pageNumbersFile, item.djvuTxtFile]).toEqual(['x_hocr_searchtext.txt.gz', 'x_hocr_pageindex.json.gz', 'x_page_numbers.json', 'x_djvu.txt']);
  });
});
