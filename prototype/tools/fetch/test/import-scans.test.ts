import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { importScans, naturalCompare, printedFromName } from '../import-scans.ts';
import { readManifest } from '../manifest.ts';
import { readCatalogue } from '../../discover/catalogue.ts';
import { roots, manifestCsv, catalogueCsv, scansDir } from '../../keying/paths.ts';

async function jpeg(shade: number): Promise<Buffer> {
  return sharp({ create: { width: 40, height: 60, channels: 3, background: { r: shade, g: shade, b: shade } } }).jpeg().toBuffer();
}

describe('owner scan import', () => {
  it('orders files naturally and reads printed pages from names', () => {
    expect(['IMG_10.jpg', 'IMG_2.jpg', 'IMG_1.jpg'].sort(naturalCompare)).toEqual(['IMG_1.jpg', 'IMG_2.jpg', 'IMG_10.jpg']);
    expect(printedFromName('IMG_0412_p387.jpg')).toBe('387');
    expect(printedFromName('p.xiv.jpg')).toBe('xiv');
    expect(printedFromName('IMG_0412.jpg')).toBe('');
  });

  it('copies pages into scans, writes the manifest and a catalogue row, and is idempotent', async () => {
    const root = mkdtempSync(join(tmpdir(), 'p1900-import-'));
    const r = roots({ root });
    const src = join(root, 'photos');
    mkdirSync(src);
    writeFileSync(join(src, 'IMG_2_p388.jpg'), await jpeg(200));
    writeFileSync(join(src, 'IMG_1_p387.jpg'), await jpeg(100));
    const opts = { title: "Bradshaw's Continental Railway Guide (facsimile)", issue: '1913-06', now: () => '2026-10-03T12:00:00Z' };
    const rep = await importScans(r, 'os-bradshaw-continental-1913', src, opts);
    expect(rep).toEqual({ added: [1, 2], unchanged: [], errors: [] });
    const m = readManifest(manifestCsv(r, 'os-bradshaw-continental-1913'));
    expect(m.map((x) => [x.page_seq, x.printed_page, x.url, x.width, x.height])).toEqual([[1, '387', 'owner:IMG_1_p387.jpg', '40', '60'], [2, '388', 'owner:IMG_2_p388.jpg', '40', '60']]);
    expect(existsSync(join(scansDir(r, 'os-bradshaw-continental-1913'), 'p1.jpg'))).toBe(true);
    const cat = readCatalogue(catalogueCsv(r));
    expect(cat.find((c) => c.source_id === 'os-bradshaw-continental-1913')?.library).toBe('owner-scan');
    expect(await importScans(r, 'os-bradshaw-continental-1913', src, opts)).toEqual({ added: [], unchanged: [1, 2], errors: [] });
    writeFileSync(join(src, 'IMG_1_p387.jpg'), await jpeg(50));
    expect((await importScans(r, 'os-bradshaw-continental-1913', src, opts)).errors.join('\n')).toMatch(/differs from the page already imported/);
    await expect(importScans(r, 'ia-something', src, opts)).rejects.toThrow(/os- source id/);
  });
});
