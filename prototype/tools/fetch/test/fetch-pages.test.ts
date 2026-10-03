import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { createHttp } from '../../discover/http.ts';
import { roots, type Roots } from '../../keying/paths.ts';
import { extFor, fetchPages, sha256 } from '../fetch-pages.ts';
import { addPages, pageUrlFor, parseManifestRows, parsePageList, readManifest, writeManifest, MANIFEST_COLUMNS } from '../manifest.ts';
import { parseCsv, writeCsv } from '../../keying/csv.ts';

let server: Server;
let base = '';
let png: Buffer;
let jpg: Buffer;
let png2: Buffer;
const hits: Record<string, number> = {};

beforeAll(async () => {
  png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#f4ecd8' } }).png().toBuffer();
  png2 = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#222222' } }).png().toBuffer();
  jpg = await sharp({ create: { width: 50, height: 20, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  let swapped = false;
  server = createServer((req, res) => {
    const path = req.url ?? '/';
    hits[path] = (hits[path] ?? 0) + 1;
    if (path === '/iiif/p1.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(png); return; }
    if (path === '/img?seq=2') { res.writeHead(200, { 'content-type': 'image/jpeg; charset=binary' }); res.end(jpg); return; }
    if (path === '/flaky.png') {
      if (hits[path] === 1) { res.writeHead(503); res.end('busy'); return; }
      res.writeHead(200, { 'content-type': 'image/png' }); res.end(png); return;
    }
    if (path === '/error-page') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html>Sign in</html>'); return; }
    if (path === '/changes.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(swapped ? png2 : png); swapped = true; return; }
    res.writeHead(404); res.end('nope');
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((ok) => server.close(() => ok())));

const http = () => createHttp({ cacheDir: null, minIntervalMs: 0, baseBackoffMs: 5 });

function setup(rows: Array<Record<string, string>>): { r: Roots; manifest: string } {
  const dir = mkdtempSync(join(tmpdir(), 'p1900-fetch-'));
  const r = roots({ root: dir });
  const manifest = join(r.data, 'sources', 'manifests', 'ia-testbook.csv');
  const full = rows.map((x) => ({ printed_page: '', content: 'table', table_refs: '', sha256: '', width: '', height: '', retrieved_at: '', ...x }));
  const text = writeCsv(MANIFEST_COLUMNS, full);
  mkdirSync(join(r.data, 'sources', 'manifests'), { recursive: true });
  writeFileSync(manifest, text);
  return { r, manifest };
}

describe('fetch-pages', () => {
  it('downloads listed pages, names them by content type and fills sha256, size and time', async () => {
    const { r, manifest } = setup([
      { page_seq: '1', url: `${base}/iiif/p1.png`, printed_page: '412', table_refs: '57' },
      { page_seq: '2', url: `${base}/img?seq=2` },
      { page_seq: '3', url: `${base}/flaky.png` },
    ]);
    const rep = await fetchPages(r, 'ia-testbook', { http: http(), now: () => '2026-10-03T10:00:00Z' });
    expect(rep.errors).toEqual([]);
    expect(rep.fetched).toEqual([1, 2, 3]);
    expect(readFileSync(join(r.scans, 'ia-testbook', 'p1.png'))).toEqual(png);
    expect(existsSync(join(r.scans, 'ia-testbook', 'p2.jpg'))).toBe(true);
    const rows = readManifest(manifest);
    expect(rows[0]).toMatchObject({ page_seq: 1, printed_page: '412', table_refs: '57', sha256: sha256(png), width: '40', height: '30', retrieved_at: '2026-10-03T10:00:00Z' });
    expect(rows[1]).toMatchObject({ sha256: sha256(jpg), width: '50', height: '20' });
    expect(hits['/flaky.png']).toBe(2);

    // A second run verifies what is on disk and downloads nothing.
    const before = hits['/iiif/p1.png'];
    const again = await fetchPages(r, 'ia-testbook', { http: http() });
    expect(again.verified).toEqual([1, 2, 3]);
    expect(again.fetched).toEqual([]);
    expect(hits['/iiif/p1.png']).toBe(before);
  });

  it('only fetches pages that are in the manifest', async () => {
    const { r } = setup([{ page_seq: '1', url: `${base}/iiif/p1.png` }]);
    const rep = await fetchPages(r, 'ia-testbook', { http: http(), pages: [1, 7] });
    expect(rep.fetched).toEqual([1]);
    expect(rep.errors).toEqual(['p7: not in the manifest (only listed pages are fetched)']);
  });

  it('reports a changed local file as a sha256 mismatch', async () => {
    const { r } = setup([{ page_seq: '1', url: `${base}/iiif/p1.png` }]);
    await fetchPages(r, 'ia-testbook', { http: http() });
    writeFileSync(join(r.scans, 'ia-testbook', 'p1.png'), png2);
    const rep = await fetchPages(r, 'ia-testbook', { http: http() });
    expect(rep.errors).toHaveLength(1);
    expect(rep.errors[0]).toMatch(/p1: .* has sha256 .*manifest says/);
  });

  it('verifies sha256 on re-fetch and keeps a differing download aside', async () => {
    const { r, manifest } = setup([{ page_seq: '5', url: `${base}/changes.png` }]);
    await fetchPages(r, 'ia-testbook', { http: http() });
    const recorded = readManifest(manifest)[0]!.sha256;
    const rep = await fetchPages(r, 'ia-testbook', { http: http(), refetch: true });
    expect(rep.errors[0]).toMatch(/re-fetched image has sha256/);
    expect(existsSync(join(r.scans, 'ia-testbook', 'p5.png.mismatch'))).toBe(true);
    expect(readManifest(manifest)[0]!.sha256).toBe(recorded);
    expect(readFileSync(join(r.scans, 'ia-testbook', 'p5.png'))).toEqual(png);
  });

  it('rejects a response that is not an image', async () => {
    const { r } = setup([{ page_seq: '1', url: `${base}/error-page` }]);
    const rep = await fetchPages(r, 'ia-testbook', { http: http() });
    expect(rep.errors[0]).toMatch(/text\/html", not an image/);
    expect(existsSync(join(r.scans, 'ia-testbook'))).toBe(false);
  });

  it('fills sha256 and size for a page placed on disk by hand', async () => {
    const { r, manifest } = setup([{ page_seq: '9', url: `${base}/missing.png` }]);
      mkdirSync(join(r.scans, 'ia-testbook'), { recursive: true });
    writeFileSync(join(r.scans, 'ia-testbook', 'p9.jpg'), jpg);
    const rep = await fetchPages(r, 'ia-testbook', { http: http() });
    expect(rep.filled).toEqual([9]);
    expect(readManifest(manifest)[0]).toMatchObject({ sha256: sha256(jpg), width: '50', height: '20' });
    expect(readManifest(manifest)[0]!.retrieved_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  });
});

describe('manifest', () => {
  it('validates rows', () => {
    const t = parseCsv(`${MANIFEST_COLUMNS.join(',')}\n1,,table,,https://x/1,,,,\n1,,table,,https://x/1,,,,\n2,,map,,https://x/2,,,,\n3,,ads,,ftp://x,,,,\n4,,ads,,https://x/4,abc,,,\n`);
    const { rows, errors } = parseManifestRows(t.rows);
    expect(rows.map((r) => r.page_seq)).toEqual([1]);
    expect(errors).toEqual([
      'manifest row 3: duplicate page_seq 1',
      'manifest row 4: content "map" is not one of table|handbook|index|notation|footnotes|ads',
      'manifest row 5: url must be http(s)',
      'manifest row 6: sha256 is not 64 hex digits',
    ]);
  });

  it('derives image URLs per library and adds pages without touching existing rows', () => {
    expect(pageUrlFor('ia-bradshawscontine1914brad', 413)).toBe('https://archive.org/download/bradshawscontine1914brad/page/n412.jpg');
    expect(pageUrlFor('ht-mdp.39015011223344', 413)).toBe('https://babel.hathitrust.org/cgi/imgsrv/image?id=mdp.39015011223344&seq=413&size=full');
    expect(pageUrlFor('ht-uc2.ark~3a~2f13960~2ft3bz6xk1m', 2)).toBe('https://babel.hathitrust.org/cgi/imgsrv/image?id=uc2.ark%3A%2F13960%2Ft3bz6xk1m&seq=2&size=full');
    expect(pageUrlFor('ga-bpt6k5800152b', 214)).toBe('https://gallica.bnf.fr/iiif/ark:/12148/bpt6k5800152b/f214/full/full/0/native.jpg');
    expect(parsePageList('5,1-3,3')).toEqual([1, 2, 3, 5]);
    const rows = addPages(addPages([], 'ga-x', [2], { tables: '57' }), 'ga-x', [1, 2], { content: 'index' });
    expect(rows.map((r) => [r.page_seq, r.content, r.table_refs])).toEqual([[1, 'index', ''], [2, 'table', '57']]);
    expect(writeManifest(rows).split('\n')[0]).toBe(MANIFEST_COLUMNS.join(','));
  });

  it('maps content types to extensions', () => {
    expect(extFor('image/jpeg', 'x')).toBe('jpg');
    expect(extFor('application/octet-stream', 'https://x/a.TIFF?x=1')).toBe('tif');
    expect(extFor('text/html', 'https://x/a.jpg')).toBeNull();
  });
});
