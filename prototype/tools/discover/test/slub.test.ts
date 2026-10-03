import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as sl from '../slub.ts';
import { createHttp, type Clock } from '../http.ts';
import { grepSource, plannedRequests, parsePlan, runDiscovery } from '../run.ts';
import { pageUrlFor } from '../../fetch/manifest.ts';

// Fixtures are cut from the live responses of 3 Oct 2026: the Summer 1914 issue's METS (pages 1, 2
// and 5 kept) and the first text lines of its ALTO pages 1, 2, 5 and 74.
const fx = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');
const ID = 'rfrkuf_394077458-19140001';

const clock = (): Clock => { let t = 0; return { now: () => t, sleep: async (ms) => { t += ms; } }; };

function slubFetch() {
  const urls: string[] = [];
  const f = (async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    const ok = (body: string) => new Response(body, { status: 200, headers: { 'content-type': 'text/xml' } });
    if (url === sl.metsUrl(ID)) return ok(fx('sl-mets-19140001.xml'));
    for (const seq of [1, 2, 5]) if (url === sl.altoUrl(ID, seq)) return ok(fx(`sl-alto-19140001-${String(seq).padStart(3, '0')}.xml`));
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { f, urls };
}

describe('SLUB Dresden', () => {
  it('builds the Kitodo URLs, with page_seq zero-padded to 8 digits', () => {
    expect(sl.metsUrl(ID)).toBe(`https://digital.slub-dresden.de/data/kitodo/${ID}/${ID}_mets.xml`);
    expect(sl.pageImageUrl(ID, 74)).toBe(`https://digital.slub-dresden.de/data/kitodo/${ID}/${ID}_tif/jpegs/00000074.tif.original.jpg`);
    expect(sl.altoUrl(ID, 5)).toBe(`https://digital.slub-dresden.de/data/kitodo/${ID}/${ID}_ocr/00000005.xml`);
    expect(pageUrlFor(`sl-${ID}`, 74)).toBe(sl.pageImageUrl(ID, 74));
    expect(() => sl.metsUrl('../x')).toThrow(/Kitodo id/);
  });

  it('parses the METS: title, volume, date, rights and pages in physical order with their files', () => {
    const m = sl.parseMets(fx('sl-mets-19140001.xml'));
    expect(m).toMatchObject({
      id: ID,
      title: 'R. Fritzsches Kursbuch für Sachsen, das übrige Mitteldeutschland, Böhmen und Schlesien',
      volume: '1914,So.', dateIssued: '1914', license: 'Public Domain Mark 1.0', language: 'ger',
      presentation: 'https://digital.slub-dresden.de/id394077458-19140001',
    });
    expect(m.pages.map((p) => [p.seq, p.label])).toEqual([[1, ''], [2, ''], [5, '1']]);
    for (const p of m.pages) {
      expect(p.image).toBe(sl.pageImageUrl(ID, p.seq));
      expect(p.alto).toBe(sl.altoUrl(ID, p.seq));
    }
    expect(() => sl.parseMets('<html/>')).toThrow(/METS/);
  });

  it('makes a catalogue row with the edition label and page count from the METS', () => {
    const row = sl.slubCatalogueRow(sl.parseMets(fx('sl-mets-19140001.xml')), 'fritzsche-kursbuch:sl');
    expect(row).toMatchObject({
      source_id: `sl-${ID}`, library: 'slub', library_id: ID, edition_label: 'Sommer 1914', issue_date: '1914',
      access: 'full', pages: '3', validity_stated: '', found_by: 'fritzsche-kursbuch:sl',
    });
    expect(row.notes).toContain('METS volume "1914,So."');
    expect(sl.editionLabel('1913/14,Wi.')).toBe('Winter 1913/14');
    expect(sl.editionLabel('Heft 3')).toBe('Heft 3');
  });

  it('parses ALTO words with pixel boxes and styles, line by line', () => {
    const a = sl.parseAlto(fx('sl-alto-19140001-074.xml'));
    expect([a.width, a.height]).toEqual([1299, 1842]);
    expect(a.lines).toHaveLength(6);
    expect(a.words[0]).toEqual({ text: 'Dresden', x: 147, y: 113, w: 146, h: 22, style: 'bold', line: 0 });
    expect(sl.altoText(a).split('\n')[0]).toBe('Dresden — Bodenbach nnd Tetschen. (Direkte Wagen b. unter 320.)');
    expect(sl.parseAlto(fx('sl-alto-19140001-001.xml')).words).toEqual([]);
    expect(() => sl.parseAlto('<mets/>')).toThrow(/ALTO/);
  });

  it('catalogues issues listed in the search plan and greps their pages through ALTO', async () => {
    const { f, urls } = slubFetch();
    const http = createHttp({ clock: clock(), fetchImpl: f, cacheDir: null });
    const plan = parsePlan(JSON.stringify({ plan_version: 1, years: [1910, 1916], entries: [{ id: 'fritzsche-kursbuch', title: 'Fritzsche', slub: { ids: [ID] } }] }));
    expect(plannedRequests(plan, ['sl'])).toEqual([`fritzsche-kursbuch sl  ${sl.metsUrl(ID)}`]);
    const rep = await runDiscovery(plan, http, { libraries: ['sl'] });
    expect(rep.rows.map((r) => r.source_id)).toEqual([`sl-${ID}`]);
    expect(rep.counts).toEqual([{ entry: 'fritzsche-kursbuch', library: 'sl', kept: 1, dropped: 0 }]);
    const res = await grepSource(http, `sl-${ID}`, ['Hamburg', 'Wien'], 1);
    expect(res.rows).toEqual([{ page_seq: 5, stations: ['Hamburg'], printed: '1' }]);
    expect(urls.filter((u) => u.includes('_ocr/'))).toHaveLength(3);
  });
});
