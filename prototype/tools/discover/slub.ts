/**
 * SLUB Dresden (Sächsische Landesbibliothek – Staats- und Universitätsbibliothek) digital collections.
 *
 * Only the Kitodo data paths are used; the viewer pages (digital.slub-dresden.de/werkansicht/…)
 * answer with a bot check. Verified against the live host on 3 Oct 2026 for
 * rfrkuf_394077458-19130002, -19140001 and -19140002 (R. Fritzsches Kursbuch):
 *
 * - METS:  https://digital.slub-dresden.de/data/kitodo/<id>/<id>_mets.xml
 *   MODS of the issue (mods:part/mods:detail/mods:number "1914,So.", mods:dateIssued, the purl,
 *   mods:accessCondition "Public Domain Mark 1.0"); the LOGICAL structMap's top div carries the
 *   periodical title as LABEL; the PHYSICAL structMap lists one div TYPE="page" per image with
 *   ORDER (1-based image order) and ORDERLABEL (the printed page number, " - " when none), whose
 *   fptrs point into the file groups DEFAULT (medium JPEG), ORIGINAL (*.tif.original.jpg, the
 *   full 300 dpi image), FULLTEXT (ALTO), DOWNLOAD (single-page PDF) and THUMBS.
 * - Image: https://digital.slub-dresden.de/data/kitodo/<id>/<id>_tif/jpegs/<NNNNNNNN>.tif.original.jpg
 * - ALTO:  https://digital.slub-dresden.de/data/kitodo/<id>/<id>_ocr/<NNNNNNNN>.xml
 *   (ALTO v2 from ABBYY Recognition Server; MeasurementUnit pixel, in the original image's pixels;
 *   <TextLine> holds <String CONTENT HPOS VPOS WIDTH HEIGHT [STYLE]>, <SP/> and <HYP CONTENT/>).
 *   NNNNNNNN is ORDER zero-padded to 8 digits for every page of the three issues checked.
 *
 * Our page_seq is the METS physical ORDER. The source id is sl-<Kitodo id>, e.g.
 * sl-rfrkuf_394077458-19140001. OCR is used to find pages and to propose table layouts only;
 * values are never taken from it.
 */
import type { CatalogueRow } from './catalogue.ts';
import { sourceIdFor } from './catalogue.ts';
import { attr, elements } from './gallica.ts';
import { decodeXml } from './hathitrust.ts';

export const SLUB_DATA = 'https://digital.slub-dresden.de/data/kitodo';

const pad8 = (n: number) => String(n).padStart(8, '0');
const checkId = (id: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`SLUB id "${id}" must be a Kitodo id such as rfrkuf_394077458-19140001`);
  return id;
};

export const metsUrl = (id: string) => `${SLUB_DATA}/${checkId(id)}/${id}_mets.xml`;
/** The full-resolution page image for page_seq `seq` (METS physical ORDER). */
export const pageImageUrl = (id: string, seq: number) => `${SLUB_DATA}/${checkId(id)}/${id}_tif/jpegs/${pad8(seq)}.tif.original.jpg`;
export const altoUrl = (id: string, seq: number) => `${SLUB_DATA}/${checkId(id)}/${id}_ocr/${pad8(seq)}.xml`;

export interface MetsPage {
  seq: number;
  /** The printed page number (ORDERLABEL), "" when the page has none. */
  label: string;
  image: string | null;
  alto: string | null;
}

export interface SlubMets {
  /** Kitodo id (from the image paths), e.g. rfrkuf_394077458-19140001. */
  id: string;
  title: string;
  /** mods:part number, e.g. "1914,So." or "1913/14,Wi.". */
  volume: string;
  dateIssued: string;
  purl: string;
  presentation: string;
  license: string;
  language: string;
  shelfLocator: string;
  pages: MetsPage[];
}

const innerText = (inner: string) => decodeXml(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const firstText = (xml: string, name: string) => { const e = elements(xml, name)[0]; return e ? innerText(e.inner) : ''; };

/** Parses an issue's METS/MODS file. */
export function parseMets(xml: string): SlubMets {
  if (!/<(?:\w+:)?mets\b/.test(xml)) throw new Error('SLUB METS: not a METS document');
  const files = new Map<string, string>();
  for (const f of xml.matchAll(/<mets:file\s+ID="([^"]+)"[^>]*>\s*<mets:FLocat\b[^>]*?xlink:href="([^"]+)"/g)) files.set(f[1]!, decodeXml(f[2]!));
  const phys = /<mets:structMap TYPE="PHYSICAL">([\s\S]*?)<\/mets:structMap>/.exec(xml)?.[1] ?? '';
  const pages: MetsPage[] = [];
  for (const m of phys.matchAll(/<mets:div\b([^>]*\bTYPE="page"[^>]*)>([\s\S]*?)<\/mets:div>/g)) {
    const seq = Number(attr(m[1]!, 'ORDER'));
    if (!Number.isInteger(seq) || seq < 1) continue;
    const hrefs = [...m[2]!.matchAll(/FILEID="([^"]+)"/g)].map((f) => files.get(f[1]!)).filter((h): h is string => !!h);
    const label = attr(m[1]!, 'ORDERLABEL').trim();
    pages.push({
      seq, label: label === '-' ? '' : label,
      image: hrefs.find((h) => h.endsWith('.original.jpg')) ?? null,
      alto: hrefs.find((h) => /_ocr\/[^/]+\.xml$/.test(h)) ?? null,
    });
  }
  pages.sort((a, b) => a.seq - b.seq);
  const anyHref = [...files.values()].find((h) => h.startsWith(`${SLUB_DATA}/`)) ?? '';
  const id = /\/data\/kitodo\/([^/]+)\//.exec(anyHref)?.[1] ?? '';
  const logical = /<mets:structMap TYPE="LOGICAL">([\s\S]*?)<\/mets:structMap>/.exec(xml)?.[1] ?? '';
  const topLabel = /<mets:div\b[^>]*\bLABEL="([^"]*)"/.exec(logical)?.[1] ?? '';
  const ids = elements(xml, 'identifier');
  const purl = ids.find((e) => attr(e.attrs, 'type') === 'purl');
  const access = elements(xml, 'accessCondition').find((e) => attr(e.attrs, 'type') === 'use and reproduction');
  return {
    id,
    title: decodeXml(topLabel).trim() || firstText(xml, 'title'),
    volume: firstText(xml, 'number'),
    dateIssued: firstText(xml, 'dateIssued'),
    purl: purl ? innerText(purl.inner) : '',
    presentation: firstText(xml, 'presentation'),
    license: access ? innerText(access.inner) : '',
    language: firstText(xml, 'languageTerm'),
    shelfLocator: firstText(xml, 'shelfLocator'),
    pages,
  };
}

/** "1914,So." → "Sommer 1914"; "1913/14,Wi." → "Winter 1913/14"; anything else as given. */
export function editionLabel(volume: string): string {
  const m = /^\s*(\d{4}(?:\/\d{2})?)\s*,\s*(So|Wi)\.?\s*$/.exec(volume);
  if (!m) return volume.trim();
  return `${m[2] === 'So' ? 'Sommer' : 'Winter'} ${m[1]}`;
}

/** A catalogue row for one issue, from its METS. validity_stated is left for a person (catalogue rule). */
export function slubCatalogueRow(m: SlubMets, foundBy: string): CatalogueRow {
  if (!m.id) throw new Error('SLUB METS: no Kitodo id found in the file paths');
  const noOcr = m.pages.filter((p) => !p.alto).length;
  return {
    source_id: sourceIdFor('slub', m.id),
    library: 'slub',
    library_id: m.id,
    title: m.title,
    publisher: '',
    edition_label: editionLabel(m.volume),
    issue_date: m.dateIssued,
    validity_stated: '',
    access: 'full',
    pages: String(m.pages.length),
    language: m.language,
    url: m.presentation || m.purl,
    terms_note: `SLUB Dresden: ${m.license || 'see the METS accessCondition'}`,
    found_by: foundBy,
    notes: [`METS volume "${m.volume}"`, m.shelfLocator ? `shelf mark ${m.shelfLocator}` : '', noOcr ? `${noOcr} page(s) without ALTO` : ''].filter(Boolean).join('; '),
  };
}

// ---------------------------------------------------------------- ALTO

export interface AltoWord {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** ALTO STYLE (e.g. "bold", "superscript"), "" if none. */
  style: string;
  /** Index of the TextLine the word belongs to. */
  line: number;
}

export interface AltoLine { x: number; y: number; w: number; h: number; words: AltoWord[]; hyphen: boolean }

export interface AltoPage { width: number; height: number; lines: AltoLine[]; words: AltoWord[] }

const num = (attrs: string, k: string) => { const v = Number(attr(attrs, k)); return Number.isFinite(v) ? Math.round(v) : 0; };

/** Parses an ALTO page: lines and words with pixel boxes. */
export function parseAlto(xml: string): AltoPage {
  if (!/<alto\b/.test(xml)) throw new Error('ALTO: not an ALTO document');
  const unit = /<MeasurementUnit>\s*([^<\s]+)/.exec(xml)?.[1] ?? 'pixel';
  if (unit !== 'pixel') throw new Error(`ALTO: MeasurementUnit "${unit}" is not supported (pixel only)`);
  const pageAttrs = /<Page\b([^>]*)>/.exec(xml)?.[1] ?? '';
  const ps = /<PrintSpace\b([^>]*)>/.exec(xml)?.[1] ?? '';
  const width = num(pageAttrs, 'WIDTH') || num(ps, 'HPOS') + num(ps, 'WIDTH');
  const height = num(pageAttrs, 'HEIGHT') || num(ps, 'VPOS') + num(ps, 'HEIGHT');
  const lines: AltoLine[] = [];
  const words: AltoWord[] = [];
  for (const tl of xml.matchAll(/<TextLine\b([^>]*)>([\s\S]*?)<\/TextLine>/g)) {
    const li = lines.length;
    const lw: AltoWord[] = [];
    for (const s of tl[2]!.matchAll(/<String\b([^>]*?)\/?>/g)) {
      const a = s[1]!;
      const text = attr(a, 'CONTENT');
      if (!text) continue;
      const w: AltoWord = { text, x: num(a, 'HPOS'), y: num(a, 'VPOS'), w: num(a, 'WIDTH'), h: num(a, 'HEIGHT'), style: attr(a, 'STYLE'), line: li };
      lw.push(w); words.push(w);
    }
    const a = tl[1]!;
    lines.push({ x: num(a, 'HPOS'), y: num(a, 'VPOS'), w: num(a, 'WIDTH'), h: num(a, 'HEIGHT'), words: lw, hyphen: /<HYP\b/.test(tl[2]!) });
  }
  return { width, height, lines, words };
}

/** The page's plain text, one ALTO line per text line (a hyphenated line ends in "-"). */
export function altoText(p: AltoPage): string {
  return p.lines.map((l) => l.words.map((w) => w.text).join(' ') + (l.hyphen ? '-' : '')).join('\n');
}
