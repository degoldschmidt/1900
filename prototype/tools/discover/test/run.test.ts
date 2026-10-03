import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHttp, type Clock } from '../http.ts';
import { dateInRange, frenchDate, grepSource, mergeIntoCatalogue, parsePlan, plannedRequests, runDiscovery, titleMatches, type SearchPlan } from '../run.ts';
import { roots } from '../../keying/paths.ts';

const fx = (name: string) => readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8');

const clock = (): Clock => { let t = 0; return { now: () => t, sleep: async (ms) => { t += ms; } }; };

/** Serves the recorded fixtures by URL, as the three libraries would. */
function libraryFetch(o: { blocked?: string[] } = {}) {
  const urls: string[] = [];
  const f = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    urls.push(url.toString());
    if (o.blocked?.includes(url.host)) {
      throw new TypeError('fetch failed', { cause: new Error('Request was cancelled.', { cause: new Error('Proxy response (403) !== 200 when HTTP Tunneling') }) });
    }
    const ok = (body: string, type: string) => new Response(body, { status: 200, headers: { 'content-type': type } });
    if (url.host === 'archive.org') {
      if (url.pathname === '/advancedsearch.php') return ok(fx('ia-advancedsearch.json'), 'application/json');
      if (url.pathname === '/metadata/bradshawscontine1914brad') return ok(fx('ia-metadata.json'), 'application/json');
      if (url.pathname === '/metadata/bradshawscontine1913june') return ok(fx('ia-metadata-1913.json'), 'application/json');
      if (url.pathname.startsWith('/metadata/')) return ok('{}', 'application/json');
      if (url.pathname === '/download/bradshawscontine1914brad/bradshawscontine1914brad_djvu.txt') return ok(fx('ia-djvu.txt'), 'text/plain');
    }
    if (url.host === 'catalog.hathitrust.org') {
      if (url.pathname === '/api/volumes/full/oclc/1536542.json') return ok(fx('ht-brief-oclc.json'), 'application/json');
      if (url.pathname.startsWith('/api/volumes/full/htid/')) return ok(fx('ht-full-htid.json'), 'application/json');
    }
    if (url.host === 'gallica.bnf.fr') {
      if (url.pathname === '/SRU') return ok(fx('ga-sru.xml'), 'text/xml');
      if (url.pathname === '/services/Issues') return ok(fx(url.searchParams.get('date') === '1914' ? 'ga-issues-1914.xml' : 'ga-issues-empty.xml'), 'text/xml');
      if (url.pathname === '/services/Pagination') return ok(fx('ga-pagination.xml'), 'text/xml');
      if (url.pathname === '/services/ContentSearch') {
        return ok(url.searchParams.get('query') === 'Eydtkuhnen' ? fx('ga-contentsearch.xml') : '<results><items/></results>', 'text/xml');
      }
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
  return { f, urls };
}

const PLAN: SearchPlan = parsePlan(JSON.stringify({
  plan_version: 1,
  years: [1910, 1916],
  entries: [
    { id: 'bradshaw-continental', title: "Bradshaw's Continental", title_must_match: ['bradshaw', 'continental'],
      archive_org: { queries: ['title:(bradshaw* AND continental)'] }, hathitrust: { oclc: ['1536542'] }, gallica: { queries: [] } },
    { id: 'livret-chaix', title: 'Livret-Chaix', title_must_match: ['chaix'], gallica: { queries: ['dc.title all "livret chaix"'], issues: true } },
    { id: 'baedeker-russia', title: 'Baedeker Russia', hathitrust: { htid: ['uc2.ark:/13960/t3bz6xk1m'] } },
  ],
}));

describe('discovery helpers', () => {
  it('filters titles and dates', () => {
    expect(titleMatches("Bradshaw's continental railway guide", ['bradshaw', 'continental'])).toBe(true);
    expect(titleMatches("Bradshaw's dictionary of bathing places", ['bradshaw', 'continental'])).toBe(false);
    expect(titleMatches('Baedeker: Österreich-Ungarn', ['austria|osterreich'])).toBe(true);
    expect(dateInRange('1914', [1910, 1916])).toBe('in');
    expect(dateInRange('1898-01-01T00:00:00Z', [1910, 1916])).toBe('out');
    expect(dateInRange('1846-1939', [1910, 1916])).toBe('in');
    expect(dateInRange('', [1910, 1916])).toBe('undated');
    expect(frenchDate('01 juin 1914')).toBe('1914-06-01');
    expect(frenchDate('1er août 1914')).toBe('1914-08-01');
    expect(frenchDate('Année 1914')).toBe('1914');
  });

  it('validates the shipped search plan and lists its first requests without network', () => {
    const plan = parsePlan(readFileSync(join(import.meta.dirname, '..', 'search-plan.json'), 'utf8'));
    expect(plan.entries.map((e) => e.id)).toEqual(expect.arrayContaining([
      'bradshaw-continental', 'bradshaw-british', 'cooks-continental', 'livret-chaix', 'reichs-kursbuch', 'officieele-reisgids',
      'baedeker-northern-germany', 'baedeker-russia', 'baedeker-belgium-holland', 'baedeker-paris', 'baedeker-london', 'baedeker-austria-hungary',
    ]));
    const reqs = plannedRequests(plan);
    expect(reqs.some((r) => r.startsWith('bradshaw-continental ia  https://archive.org/advancedsearch.php?'))).toBe(true);
    expect(reqs.some((r) => r.startsWith('livret-chaix ga  https://gallica.bnf.fr/SRU?'))).toBe(true);
  });
});

describe('runDiscovery', () => {
  it('collects, filters and merges rows from all three libraries into a deterministic catalogue', async () => {
    const lf = libraryFetch();
    const http = createHttp({ clock: clock(), fetchImpl: lf.f, cacheDir: null });
    const rep = await runDiscovery(PLAN, http);
    expect(rep.errors).toEqual([]);
    expect(rep.blocked).toEqual([]);
    expect(rep.rows.map((r) => r.source_id).sort()).toEqual([
      'ga-bpt6k5800114x', 'ga-bpt6k5800152b', 'ga-bpt6k9612345t',
      'ht-hvd.32044099887766', 'ht-mdp.39015011223344', 'ht-nyp.33433000111222', 'ht-uc2.ark~3a~2f13960~2ft3bz6xk1m',
      'ia-bradshawscontine1913june', 'ia-bradshawscontine1914brad',
    ]);
    const issue = rep.rows.find((r) => r.source_id === 'ga-bpt6k5800152b')!;
    expect(issue).toMatchObject({ issue_date: '1914-06-01', edition_label: '01 juin 1914', pages: '4', access: 'full', found_by: 'livret-chaix:ga' });
    expect(rep.counts.find((c) => c.entry === 'bradshaw-continental' && c.library === 'ia')).toEqual({ entry: 'bradshaw-continental', library: 'ia', kept: 2, dropped: 2 });

    const dir = mkdtempSync(join(tmpdir(), 'p1900-cat-'));
    const r = roots({ root: dir });
    const first = mergeIntoCatalogue(r, rep.rows);
    const second = mergeIntoCatalogue(r, [...rep.rows].reverse());
    expect(second).toBe(first);
    expect(first.split('\n').filter(Boolean)).toHaveLength(10);
    expect(readFileSync(join(dir, 'data', 'sources', 'catalogue.csv'), 'utf8')).toBe(first);
  });

  it('reports a blocked host once and carries on with the other libraries', async () => {
    const lf = libraryFetch({ blocked: ['archive.org'] });
    const logs: string[] = [];
    const http = createHttp({ clock: clock(), fetchImpl: lf.f, cacheDir: null });
    const rep = await runDiscovery(PLAN, http, { log: (m) => logs.push(m) });
    expect(rep.blocked).toEqual(['archive.org']);
    expect(logs.filter((l) => l.startsWith('host blocked by environment egress policy: archive.org'))).toHaveLength(1);
    expect(lf.urls.filter((u) => u.includes('archive.org'))).toHaveLength(1);
    expect(rep.rows.some((r) => r.source_id.startsWith('ht-'))).toBe(true);
    expect(rep.rows.some((r) => r.source_id.startsWith('ia-'))).toBe(false);
  });
});

describe('grepSource', () => {
  it('greps an archive.org item through its djvu.txt', async () => {
    const http = createHttp({ clock: clock(), fetchImpl: libraryFetch().f, cacheDir: null });
    const res = await grepSource(http, 'ia-bradshawscontine1914brad', ['Eydtkuhnen', 'Wirballen'], 2);
    expect(res.rows.map((r) => r.page_seq)).toEqual([3, 4]);
  });

  it('combines Gallica ContentSearch hits per view', async () => {
    const http = createHttp({ clock: clock(), fetchImpl: libraryFetch().f, cacheDir: null });
    const res = await grepSource(http, 'ga-bpt6k5800152b', ['Eydtkuhnen', 'Wirballen'], 1);
    expect(res.rows).toEqual([{ page_seq: 37, stations: ['Eydtkuhnen'] }, { page_seq: 214, stations: ['Eydtkuhnen'] }]);
  });

  it('prints search-inside links for HathiTrust', async () => {
    const http = createHttp({ clock: clock(), fetchImpl: libraryFetch().f, cacheDir: null });
    const res = await grepSource(http, 'ht-mdp.39015011223344', ['Eydtkuhnen'], 1);
    expect(res.links).toEqual(['https://babel.hathitrust.org/cgi/pt/search?q1=Eydtkuhnen&id=mdp.39015011223344']);
  });
});
