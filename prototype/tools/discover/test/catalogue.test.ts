import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CATALOGUE_COLUMNS, decodeIdPart, encodeIdPart, mergeCatalogue, parseSourceId, sourceIdFor, writeCatalogue, type CatalogueRow,
} from '../catalogue.ts';
import { parseCsv } from '../../keying/csv.ts';

function row(p: Partial<CatalogueRow> & { source_id: string }): CatalogueRow {
  const r = {} as CatalogueRow;
  for (const c of CATALOGUE_COLUMNS) r[c] = '';
  return { ...r, ...p };
}

describe('source_id', () => {
  it('derives ia-, ht- and ga- ids from library identifiers', () => {
    expect(sourceIdFor('archive.org', 'bradshawscontine1914brad')).toBe('ia-bradshawscontine1914brad');
    expect(sourceIdFor('hathitrust', 'mdp.39015011223344')).toBe('ht-mdp.39015011223344');
    expect(sourceIdFor('hathitrust', 'uc1.$b551234')).toBe('ht-uc1.~24b551234');
    expect(sourceIdFor('gallica', 'https://gallica.bnf.fr/ark:/12148/bpt6k5800152b')).toBe('ga-bpt6k5800152b');
    expect(sourceIdFor('gallica', 'ark:/12148/bpt6k5800152b/f12.item')).toBe('ga-bpt6k5800152b');
    expect(sourceIdFor('gallica', 'bpt6k5800152b')).toBe('ga-bpt6k5800152b');
    expect(() => sourceIdFor('archive.org', ' ')).toThrow();
  });

  it('round-trips through parseSourceId', () => {
    expect(parseSourceId('ht-uc2.ark~3a~2f13960~2ft3bz6xk1m')).toEqual({ library: 'hathitrust', libraryId: 'uc2.ark:/13960/t3bz6xk1m' });
    expect(parseSourceId('ga-bpt6k5800152b')).toEqual({ library: 'gallica', libraryId: 'bpt6k5800152b' });
    expect(sourceIdFor('slub', 'rfrkuf_394077458-19140001')).toBe('sl-rfrkuf_394077458-19140001');
    expect(parseSourceId('sl-rfrkuf_394077458-19140001')).toEqual({ library: 'slub', libraryId: 'rfrkuf_394077458-19140001' });
    expect(() => parseSourceId('xx-1')).toThrow();
  });

  it('encodes any identifier reversibly into file-name-safe characters', () => {
    fc.assert(fc.property(fc.string({ unit: 'grapheme', minLength: 1, maxLength: 30 }), (s) => {
      const e = encodeIdPart(s);
      expect(e).toMatch(/^[A-Za-z0-9._~-]+$/);
      expect(decodeIdPart(e)).toBe(s);
    }), { numRuns: 300 });
  });
});

describe('catalogue merge', () => {
  const existing = [
    row({ source_id: 'ia-b', library: 'archive.org', library_id: 'b', title: 'Curated title', validity_stated: '1 June – 30 Sept 1914', notes: 'checked by hand', found_by: 'x:ia' }),
    row({ source_id: 'ga-a', library: 'gallica', library_id: 'ark:/12148/a', title: 'A', access: 'none' }),
  ];
  const found = [
    row({ source_id: 'ia-b', library: 'archive.org', library_id: 'b', title: 'Library title', publisher: 'Blacklock', pages: '1186', access: 'full', validity_stated: 'should be ignored', notes: 'auto note', found_by: 'bradshaw:ia' }),
    row({ source_id: 'ht-c', library: 'hathitrust', library_id: 'c', title: 'C', access: 'pdus', found_by: 'cooks:ht' }),
    row({ source_id: 'ga-a', library: 'gallica', library_id: 'ark:/12148/a', access: 'full', found_by: 'chaix:ga' }),
  ];

  it('refreshes library fields, fills empty descriptive fields, keeps curated ones and unions found_by', () => {
    const m = mergeCatalogue(existing, found);
    expect(m.map((r) => r.source_id)).toEqual(['ga-a', 'ht-c', 'ia-b']);
    const b = m.find((r) => r.source_id === 'ia-b')!;
    expect(b).toMatchObject({ title: 'Curated title', publisher: 'Blacklock', pages: '1186', access: 'full', validity_stated: '1 June – 30 Sept 1914', notes: 'checked by hand', found_by: 'bradshaw:ia;x:ia' });
    expect(m.find((r) => r.source_id === 'ga-a')!.access).toBe('full');
  });

  it('is deterministic and idempotent regardless of input order', () => {
    const once = writeCatalogue(mergeCatalogue(existing, found));
    const reversed = writeCatalogue(mergeCatalogue([...existing].reverse(), [...found].reverse()));
    expect(reversed).toBe(once);
    const again = writeCatalogue(mergeCatalogue(parseCsv(once).rows as CatalogueRow[], found));
    expect(again).toBe(once);
    expect(once.split('\n')[0]).toBe(CATALOGUE_COLUMNS.join(','));
  });

  it('rejects duplicate source_ids in the existing catalogue', () => {
    expect(() => mergeCatalogue([existing[0]!, existing[0]!], [])).toThrow(/duplicate/);
  });
});
