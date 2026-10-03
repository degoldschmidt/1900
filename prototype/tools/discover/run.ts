/**
 * Discovery runner.
 *
 *   NODE_USE_ENV_PROXY=1 node tools/discover/run.ts [--plan tools/discover/search-plan.json]
 *        [--only <entry,…>] [--library ia,ht,ga] [--max-results 200] [--no-metadata] [--offline] [--dry-run]
 *   NODE_USE_ENV_PROXY=1 node tools/discover/run.ts grep <source_id> --stations "Berlin,Köln|Cologne,…" [--min 2] [--out file.csv]
 *
 * (The tools re-run themselves with NODE_USE_ENV_PROXY=1 when HTTPS_PROXY is set; see http.ts.)
 *
 * The first form runs every query of the search plan against archive.org, the HathiTrust Bib API
 * and Gallica, then merges the results into data/sources/catalogue.csv (deterministic: same inputs,
 * same bytes). --dry-run prints the first request of every query without touching the network.
 * --offline answers only from the HTTP cache (build/cache/http/).
 *
 * The grep form finds pages that mention the given stations: archive.org items through their
 * djvu.txt full text, Gallica documents through ContentSearch (one request per station).
 * HathiTrust has no full-text API; the search-inside links are printed instead.
 *
 * A host refused by the environment's egress proxy is reported once ("host blocked by environment
 * egress policy: <host>") and skipped; the exit status is then 3.
 */
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BlockedHostError, createHttp, ensureProxyEnv, type Http } from './http.ts';
import * as ia from './archive-org.ts';
import * as ht from './hathitrust.ts';
import * as ga from './gallica.ts';
import { mergeCatalogue, parseSourceId, readCatalogue, writeCatalogue, type CatalogueRow } from './catalogue.ts';
import { catalogueCsv, httpCacheDir, roots, type Roots } from '../keying/paths.ts';
import { cmpStr, writeCsv, writeTextFile } from '../keying/csv.ts';

export type LibKey = 'ia' | 'ht' | 'ga';

export interface PlanEntry {
  id: string;
  title: string;
  kind?: string;
  title_must_match?: string[];
  archive_org?: { queries?: string[] };
  hathitrust?: { catalog_search?: string; oclc?: string[]; recordnumber?: string[]; htid?: string[] };
  gallica?: { queries?: string[]; issues?: boolean };
  notes?: string;
}

export interface SearchPlan {
  plan_version: 1;
  years: [number, number];
  notes?: string[];
  entries: PlanEntry[];
}

export function parsePlan(text: string): SearchPlan {
  const p = JSON.parse(text) as SearchPlan;
  if (p.plan_version !== 1) throw new Error('search plan: plan_version must be 1');
  if (!Array.isArray(p.years) || p.years.length !== 2 || !p.years.every(Number.isInteger)) throw new Error('search plan: years must be [from, to]');
  if (!Array.isArray(p.entries)) throw new Error('search plan: entries must be an array');
  const ids = new Set<string>();
  for (const e of p.entries) {
    if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) throw new Error(`search plan: entry id "${e.id}" must be lower-case letters, digits and -`);
    if (ids.has(e.id)) throw new Error(`search plan: duplicate entry id ${e.id}`);
    ids.add(e.id);
  }
  return p;
}

/** Every word of `must` (alternatives split by "|") appears in the folded title. */
export function titleMatches(title: string, must: readonly string[] | undefined): boolean {
  if (!must || must.length === 0) return true;
  const t = ` ${ia.foldForMatch(title)} `;
  return must.every((w) => w.split('|').some((alt) => t.includes(ia.foldForMatch(alt))));
}

/** 'in' if any year in the string lies in range (a "1846-1939" span counts if it overlaps), 'undated' if none. */
export function dateInRange(s: string, years: [number, number]): 'in' | 'out' | 'undated' {
  const ys = [...s.matchAll(/\b(1[5-9]\d\d|20\d\d)\b/g)].map((m) => Number(m[1]));
  if (ys.length === 0) return 'undated';
  if (ys.length >= 2 && /\d{4}\s*[-–]\s*\d{4}/.test(s)) {
    const lo = Math.min(...ys); const hi = Math.max(...ys);
    return lo <= years[1] && hi >= years[0] ? 'in' : 'out';
  }
  return ys.some((y) => y >= years[0] && y <= years[1]) ? 'in' : 'out';
}

const FR_MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

/** "1 juin 1914" / "1er août 1914" → ISO date; otherwise the first year found, or "". */
export function frenchDate(label: string): string {
  const f = ia.foldForMatch(label);
  const m = /\b(\d{1,2})(?:er)? (\p{L}+) (\d{4})\b/u.exec(f);
  if (m) {
    const mi = FR_MONTHS.indexOf(m[2]!);
    if (mi >= 0) return `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  }
  const y = /\b(\d{4})\b/.exec(f);
  return y ? y[1]! : '';
}

export interface RunOptions {
  libraries?: readonly LibKey[];
  only?: readonly string[];
  maxResults?: number;
  metadata?: boolean;
  log?: (msg: string) => void;
}

export interface RunReport {
  rows: CatalogueRow[];
  blocked: string[];
  errors: string[];
  counts: Array<{ entry: string; library: LibKey; kept: number; dropped: number }>;
}

function withNote(r: CatalogueRow, note: string): CatalogueRow {
  return { ...r, notes: [r.notes, note].filter(Boolean).join('; ') };
}

async function discoverIa(http: Http, e: PlanEntry, years: [number, number], o: Required<Pick<RunOptions, 'maxResults' | 'metadata'>>, rep: RunReport) {
  let kept = 0; let dropped = 0;
  const seen = new Set<string>();
  for (const q of e.archive_org?.queries ?? []) {
    const query = `(${q}) AND mediatype:texts`;
    const docs: ia.IaDoc[] = [];
    for (let page = 1; docs.length < o.maxResults; page++) {
      const res = ia.parseAdvancedSearch((await http.get(ia.advancedSearchUrl(query, { rows: 100, page }), { accept: 'application/json' })).json());
      docs.push(...res.docs);
      if (res.docs.length === 0 || res.start + res.docs.length >= res.numFound) break;
    }
    for (const d of docs.slice(0, o.maxResults)) {
      if (seen.has(d.identifier)) continue;
      seen.add(d.identifier);
      const when = dateInRange(`${d.year} ${d.date}`, years);
      if (!titleMatches(d.title, e.title_must_match) || when === 'out') { dropped++; continue; }
      const item = o.metadata ? ia.parseMetadata((await http.get(ia.metadataUrl(d.identifier), { accept: 'application/json' })).json()) : null;
      let row = ia.iaCatalogueRow(d, item, `${e.id}:ia`);
      if (when === 'undated') row = withNote(row, 'undated in archive.org metadata');
      rep.rows.push(row); kept++;
    }
  }
  rep.counts.push({ entry: e.id, library: 'ia', kept, dropped });
}

async function discoverHt(http: Http, e: PlanEntry, years: [number, number], rep: RunReport) {
  let kept = 0; let dropped = 0;
  const h = e.hathitrust ?? {};
  const lookups: Array<[ht.HtIdType, string]> = [
    ...(h.oclc ?? []).map((v) => ['oclc', v] as [ht.HtIdType, string]),
    ...(h.recordnumber ?? []).map((v) => ['recordnumber', v] as [ht.HtIdType, string]),
    ...(h.htid ?? []).map((v) => ['htid', v] as [ht.HtIdType, string]),
  ];
  for (const [type, id] of lookups) {
    const vols = ht.parseBibApi((await http.get(ht.bibApiUrl('full', type, id), { accept: 'application/json' })).json());
    for (const row of ht.htCatalogueRows(vols, `${e.id}:ht`)) {
      const when = dateInRange(`${row.edition_label} ${row.issue_date}`, years);
      // A serial's items carry their own year in enumcron; a record's publishDates may be a span.
      const itemYear = dateInRange(row.edition_label, years);
      if (!titleMatches(row.title, e.title_must_match) || (itemYear !== 'undated' ? itemYear === 'out' : when === 'out')) { dropped++; continue; }
      rep.rows.push(row); kept++;
    }
  }
  rep.counts.push({ entry: e.id, library: 'ht', kept, dropped });
}

async function discoverGa(http: Http, e: PlanEntry, years: [number, number], o: Required<Pick<RunOptions, 'maxResults' | 'metadata'>>, rep: RunReport) {
  let kept = 0; let dropped = 0;
  const seen = new Set<string>();
  for (const q of e.gallica?.queries ?? []) {
    const recs: ga.GallicaRecord[] = [];
    for (let start = 1; recs.length < o.maxResults;) {
      const page = ga.parseSru((await http.get(ga.sruUrl(q, { maximumRecords: 50, startRecord: start }), { accept: 'application/xml' })).text());
      recs.push(...page.records);
      if (!page.nextRecordPosition || page.records.length === 0) break;
      start = page.nextRecordPosition;
    }
    for (const r of recs.slice(0, o.maxResults)) {
      if (seen.has(r.ark)) continue;
      seen.add(r.ark);
      const when = dateInRange(r.date, years);
      if (!titleMatches(r.title, e.title_must_match) || when === 'out') { dropped++; continue; }
      if (ga.isPeriodicalRecord(r) && e.gallica?.issues) {
        for (let y = years[0]; y <= years[1]; y++) {
          const issues = ga.parseIssues((await http.get(ga.issuesUrl(r.ark, y), { accept: 'application/xml' })).text());
          for (const is of issues) {
            if (seen.has(is.ark)) continue;
            seen.add(is.ark);
            const pages = o.metadata ? ga.parsePagination((await http.get(ga.paginationUrl(is.ark), { accept: 'application/xml' })).text()).views : undefined;
            const row = ga.gallicaCatalogueRow({ ...r, ark: is.ark, date: frenchDate(is.label) || String(y), identifier: `https://gallica.bnf.fr/ark:/12148/${is.ark}` },
              `${e.id}:ga`, { issueLabel: is.label, ...(pages ? { pages } : {}) });
            rep.rows.push(withNote(row, `issue of ark:/12148/${r.ark}`)); kept++;
          }
        }
        continue;
      }
      const pages = o.metadata && !ga.isPeriodicalRecord(r) ? ga.parsePagination((await http.get(ga.paginationUrl(r.ark), { accept: 'application/xml' })).text()).views : undefined;
      let row = ga.gallicaCatalogueRow(r, `${e.id}:ga`, pages ? { pages } : {});
      if (when === 'undated') row = withNote(row, 'undated in Gallica record');
      rep.rows.push(row); kept++;
    }
  }
  rep.counts.push({ entry: e.id, library: 'ga', kept, dropped });
}

/** Runs the plan; a blocked host stops that library for the rest of the run. */
export async function runDiscovery(plan: SearchPlan, http: Http, o: RunOptions = {}): Promise<RunReport> {
  const libs = o.libraries ?? ['ia', 'ht', 'ga'];
  const opts = { maxResults: o.maxResults ?? 200, metadata: o.metadata ?? true };
  const log = o.log ?? (() => {});
  const rep: RunReport = { rows: [], blocked: [], errors: [], counts: [] };
  const blockedLibs = new Set<LibKey>();
  for (const e of plan.entries) {
    if (o.only && !o.only.includes(e.id)) continue;
    for (const lib of libs) {
      if (blockedLibs.has(lib)) continue;
      try {
        if (lib === 'ia') await discoverIa(http, e, plan.years, opts, rep);
        else if (lib === 'ht') await discoverHt(http, e, plan.years, rep);
        else await discoverGa(http, e, plan.years, opts, rep);
      } catch (err) {
        if (err instanceof BlockedHostError) {
          blockedLibs.add(lib);
          if (!rep.blocked.includes(err.host)) { rep.blocked.push(err.host); log(err.message); }
        } else {
          rep.errors.push(`${e.id} (${lib}): ${(err as Error).message}`);
          log(`error: ${e.id} (${lib}): ${(err as Error).message}`);
        }
      }
    }
  }
  rep.blocked.sort(cmpStr);
  return rep;
}

/** The first request of every query, for --dry-run. */
export function plannedRequests(plan: SearchPlan, libs: readonly LibKey[] = ['ia', 'ht', 'ga']): string[] {
  const out: string[] = [];
  for (const e of plan.entries) {
    if (libs.includes('ia')) for (const q of e.archive_org?.queries ?? []) out.push(`${e.id} ia  ${ia.advancedSearchUrl(`(${q}) AND mediatype:texts`, { rows: 100, page: 1 })}`);
    if (libs.includes('ht')) {
      const h = e.hathitrust ?? {};
      if (h.catalog_search) out.push(`${e.id} ht  (catalog UI, by hand) ${ht.catalogSearchUrl(h.catalog_search)}`);
      for (const [t, list] of [['oclc', h.oclc], ['recordnumber', h.recordnumber], ['htid', h.htid]] as const) for (const v of list ?? []) out.push(`${e.id} ht  ${ht.bibApiUrl('full', t, v)}`);
    }
    if (libs.includes('ga')) for (const q of e.gallica?.queries ?? []) out.push(`${e.id} ga  ${ga.sruUrl(q, { maximumRecords: 50, startRecord: 1 })}`);
  }
  return out;
}

/** Merges discovered rows into catalogue.csv; returns the new file text. */
export function mergeIntoCatalogue(r: Roots, found: readonly CatalogueRow[]): string {
  const path = catalogueCsv(r);
  const text = writeCatalogue(mergeCatalogue(readCatalogue(path), found));
  writeTextFile(path, text);
  return text;
}

// ---------------------------------------------------------------- grep

export interface GrepRow { page_seq: number; stations: string[]; printed?: string }

export async function grepSource(http: Http, sourceId: string, stations: readonly string[], minStations: number): Promise<{ rows: GrepRow[]; links: string[] }> {
  const { library, libraryId } = parseSourceId(sourceId);
  if (library === 'archive.org') {
    const item = ia.parseMetadata((await http.get(ia.metadataUrl(libraryId), { accept: 'application/json' })).json());
    if (!item) throw new Error(`archive.org has no item ${libraryId}`);
    if (item.hocrSearchTextFile && item.hocrPageIndexFile) {
      const text = gunzipSync((await http.get(ia.downloadUrl(libraryId, item.hocrSearchTextFile), { accept: 'application/gzip' })).body).toString('utf8');
      const index = JSON.parse(gunzipSync((await http.get(ia.downloadUrl(libraryId, item.hocrPageIndexFile), { accept: 'application/gzip' })).body).toString('utf8')) as number[][];
      const printed = item.pageNumbersFile ? ia.printedPages((await http.get(ia.downloadUrl(libraryId, item.pageNumbersFile), { accept: 'application/json' })).json()) : new Map<number, string>();
      const rows = ia.grepPages(ia.splitByPageIndex(text, index), stations, minStations).map((h) => (printed.has(h.page_seq) ? { ...h, printed: printed.get(h.page_seq)! } : h));
      return { rows, links: [] };
    }
    if (!item.djvuTxtFile) throw new Error(`archive.org item ${libraryId} has no OCR text`);
    const text = (await http.get(ia.djvuTxtUrl(libraryId, item.djvuTxtFile), { accept: 'text/plain' })).text();
    if (!text.includes('\f')) throw new Error(`archive.org item ${libraryId}: djvu.txt has no page breaks and the item has no hOCR page index, so pages cannot be located`);
    return { rows: ia.grepStations(text, stations, minStations), links: [] };
  }
  if (library === 'gallica') {
    const byView = new Map<number, Set<string>>();
    for (const s of stations) {
      const name = s.split('|')[0]!.trim();
      for (const variant of s.split('|').map((v) => v.trim()).filter(Boolean)) {
        const hits = ga.parseContentSearch((await http.get(ga.contentSearchUrl(libraryId, variant), { accept: 'application/xml' })).text());
        for (const h of hits) { const set = byView.get(h.view) ?? new Set<string>(); set.add(name); byView.set(h.view, set); }
      }
    }
    const order = stations.map((s) => s.split('|')[0]!.trim());
    const rows = [...byView.entries()].map(([v, set]) => ({ page_seq: v, stations: order.filter((n) => set.has(n)) }))
      .filter((r) => r.stations.length >= minStations)
      .sort((a, b) => b.stations.length - a.stations.length || a.page_seq - b.page_seq);
    return { rows, links: [] };
  }
  return { rows: [], links: stations.map((s) => ht.searchInsideUrl(libraryId, s.split('|')[0]!.trim())) };
}

// ---------------------------------------------------------------- CLI

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (f: string) => args.includes(f);
  const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const r = roots();
  const dryRun = flag('--dry-run');
  if (!dryRun) ensureProxyEnv();
  const http = createHttp({ cacheDir: httpCacheDir(r), cache: flag('--offline') ? 'only' : 'use', log: (m) => console.error(m) });
  const main = async (): Promise<number> => {
    if (args[0] === 'grep') {
      const source = args[1];
      const stations = (opt('--stations') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      if (!source || stations.length === 0) throw new Error('usage: run.ts grep <source_id> --stations "A,B|B2,…" [--min 2] [--out file.csv]');
      const res = await grepSource(http, source, stations, Number(opt('--min') ?? '1'));
      const csv = writeCsv(['page_seq', 'printed_page', 'n_stations', 'stations'], res.rows.map((x) => ({ page_seq: String(x.page_seq), printed_page: x.printed ?? '', n_stations: String(x.stations.length), stations: x.stations.join(';') })));
      const out = opt('--out');
      if (out) writeTextFile(out, csv); else process.stdout.write(csv);
      for (const l of res.links) console.log(l);
      return 0;
    }
    const plan = parsePlan(readFileSync(opt('--plan') ?? join(r.root, 'tools', 'discover', 'search-plan.json'), 'utf8'));
    const libs = (opt('--library')?.split(',') ?? ['ia', 'ht', 'ga']) as LibKey[];
    if (dryRun) { for (const l of plannedRequests(plan, libs)) console.log(l); return 0; }
    const rep = await runDiscovery(plan, http, {
      libraries: libs, ...(opt('--only') ? { only: opt('--only')!.split(',') } : {}),
      maxResults: Number(opt('--max-results') ?? '200'), metadata: !flag('--no-metadata'), log: (m) => console.error(m),
    });
    mergeIntoCatalogue(r, rep.rows);
    for (const c of rep.counts) console.log(`${c.entry.padEnd(28)} ${c.library}  kept ${c.kept}  dropped ${c.dropped}`);
    console.log(`${rep.rows.length} row(s) merged into ${catalogueCsv(r)}`);
    for (const e of rep.errors) console.error(`error: ${e}`);
    for (const h of rep.blocked) console.error(`host blocked by environment egress policy: ${h} — open it in the environment's network settings (PLAN.md, "Source access")`);
    return rep.blocked.length ? 3 : rep.errors.length ? 1 : 0;
  };
  main().then((code) => process.exit(code), (e) => {
    console.error(e instanceof BlockedHostError ? e.message : (e as Error).message);
    process.exit(e instanceof BlockedHostError ? 3 : 1);
  });
}
