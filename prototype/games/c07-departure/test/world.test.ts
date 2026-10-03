/**
 * The invented preview world passes structural checks: it is synthetic and invented throughout,
 * the generator's output is the committed bundle, stations are connected, times run forward on
 * every trip, the two editions differ on the changeover corridor, and every table and parameter
 * the rules read is there, each row either citing the invented guide or carrying a design id.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { truthView } from '../../../kit/src/timetable/expand.ts';
import { ProfileCache } from '../../../kit/src/timetable/profiles.ts';
import { instantOf } from '../../../kit/src/time/instant.ts';
import { canonicalJson } from '../../../kit/src/sim/canonical.ts';
import { hash64 } from '../../../kit/src/sim/hash.ts';
import { buildWorld, WORLD_FILE, CHANGEOVER } from '../preview/make-world.ts';
import { raw, bundle, scenario } from './helpers.ts';
import type { Setup } from '../src/scenarios.ts';

/** Real European towns and cities an invented name must never match (capitals, large cities, frontier and port towns). */
const REAL = `London Paris Berlin Vienna Wien Rome Roma Madrid Lisbon Lisboa Brussels Bruxelles Brussel Amsterdam Rotterdam Antwerp Anvers Antwerpen Hague Haag Utrecht
Cologne Köln Koln Hamburg Bremen Hanover Hannover Munich München Frankfurt Leipzig Dresden Stuttgart Nuremberg Nürnberg Breslau Danzig Königsberg Stettin Posen Aachen
Kiel Lübeck Magdeburg Düsseldorf Essen Dortmund Bonn Mainz Strasbourg Strassburg Metz Lyon Marseille Bordeaux Lille Calais Dover Boulogne Dieppe Rouen Nancy Reims Nice
Toulouse Nantes Brest Cherbourg Havre Ostend Oostende Ghent Gent Liège Liege Namur Bruges Brugge Charleroi Mons Luxembourg Herbesthal Welkenraedt Flushing Vlissingen
Harwich Hook Hoek Bentheim Eydtkuhnen Wirballen Alexandrowo Warsaw Warszawa Petersburg Moscow Moskva Riga Reval Tallinn Vilna Vilnius Kovno Kaunas Kiev Kyiv Odessa
Lemberg Lviv Cracow Kraków Krakow Prague Praha Budapest Pressburg Bratislava Trieste Venice Venezia Milan Milano Turin Torino Genoa Genova Florence Firenze Naples Napoli
Bologna Zurich Zürich Geneva Genève Basel Bâle Bern Berne Lausanne Lucerne Innsbruck Salzburg Graz Linz Belgrade Sofia Bucharest Constantinople Istanbul Athens Salonika
Copenhagen København Stockholm Oslo Christiania Helsinki Helsingfors Gothenburg Göteborg Malmö Bergen Trondheim Aarhus Odense Edinburgh Glasgow Dublin Belfast Liverpool
Manchester Birmingham Leeds Sheffield Bristol Cardiff Newcastle Southampton Plymouth Portsmouth Folkestone Newhaven Hull Grimsby Cork Barcelona Valencia Seville Porto Oporto
Bilbao Zaragoza Malaga Granada Cadiz Saragossa Gdansk Poznan Wroclaw Szczecin Lodz Łódź Minsk Smolensk Tilsit Memel Insterburg Thorn Bromberg Elbing Kassel Erfurt Weimar
Halle Chemnitz Würzburg Augsburg Regensburg Passau Ulm Freiburg Karlsruhe Mannheim Heidelberg Saarbrücken Trier Koblenz Wiesbaden Darmstadt Osnabrück Münster Bielefeld
Emden Wilhelmshaven Rostock Stralsund Schwerin Potsdam Spandau Charlottenburg Arnhem Nijmegen Eindhoven Maastricht Venlo Groningen Leeuwarden Zwolle Haarlem Leiden Delft
Dordrecht Middelburg Tournai Courtrai Kortrijk Louvain Leuven Malines Mechelen Verviers Spa Arlon Sedan Charleville Maubeuge Valenciennes Douai Arras Amiens Laon Soissons
Compiègne Chantilly Creil Beauvais Orleans Orléans Tours Angers Poitiers Limoges Dijon Besancon Besançon Belfort Mulhouse Colmar Avricourt Pagny Feignies Jeumont Erquelinnes
Quévy Blandain Baisieux Hazebrouck Dunkirk Dunkerque`.split(/\s+/).filter(Boolean).map((x) => x.toLowerCase());

const tokens = (s: string): string[] => s.toLowerCase().split(/[^a-zà-ÿ]+/).filter((t) => t.length > 2);

describe('the invented world', () => {
  const b = raw();

  it('is exactly what the generator makes (keyed, deterministic) and fits the page budget', () => {
    const made = buildWorld();
    expect(JSON.parse(JSON.stringify(made))).toEqual(b);
    const { meta, ...body } = made;
    expect(meta.dataHash).toBe(hash64(canonicalJson(body)));
    expect(readFileSync(WORLD_FILE, 'utf8').length).toBeLessThan(400_000);
  });

  it('is synthetic, for C07, frozen as preview-1, over about three weeks of spring 1914', () => {
    expect(b.meta).toMatchObject({ game: 'c07-departure', status: 'ready', synthetic: true, freezeTag: 'preview-1', schema: 1 });
    const [a, z] = b.meta.window;
    expect(z - a).toBeGreaterThanOrEqual(18);
    expect(z - a).toBeLessThanOrEqual(28);
    expect(a).toBeGreaterThanOrEqual(5200); // spring 1914
    expect(CHANGEOVER).toBeGreaterThan(a);
  });

  it('uses SYN_ ids throughout and invented names that are no real European town', () => {
    const ids = [
      ...b.stations.map((x) => x.id), ...b.cities.map((x) => x.id), ...b.cities.map((x) => x.jurisdiction), ...b.zones.map((x) => x.id),
      ...b.editions.map((x) => x.id), ...b.editions.map((x) => x.source), ...b.trips.map((x) => x.id), ...b.trips.map((x) => x.trainKey), ...b.trips.map((x) => x.operator),
      ...b.institutions.map((x) => x.id), ...b.params.map((x) => x.id), ...b.calendar.map((x) => x.id), ...b.citations.map((x) => x.source),
      ...b.fares.map((f) => f.currency).filter((c) => c !== 'GBP'),
    ];
    for (const id of ids) expect(id, id).toMatch(/^SYN_/);
    const names = [...b.stations.map((x) => x.name), ...b.cities.map((x) => x.name), ...b.institutions.map((x) => x.name), ...b.trips.map((x) => x.name ?? '')];
    for (const n of names) for (const t of tokens(n)) expect(REAL, `${n}: ${t}`).not.toContain(t);
    for (const c of b.citations) expect(c.sourceTitle).toMatch(/\(invented\)/);
  });

  it('has three countries with their own currencies and railway clocks, one at an odd-second offset', () => {
    const countries = [...new Set(b.cities.map((c) => c.country))];
    expect(countries).toHaveLength(3);
    const railway = b.zones.filter((z) => z.appliesTo === 'railway');
    expect(new Set(railway.map((z) => z.offsetSec)).size).toBe(3);
    expect(railway.some((z) => z.offsetSec % 60 !== 0)).toBe(true);
    const curByCountry = new Map<string, Set<string>>();
    for (const f of b.fares) {
      const c = b.stations.find((s) => s.id === f.from)!.country;
      (curByCountry.get(c) ?? curByCountry.set(c, new Set()).get(c)!).add(f.currency);
    }
    expect(new Set([...curByCountry.values()].map((s) => [...s].join())).size).toBe(3);
  });

  it('has about eight cities, two with two stations and a cross-city transfer, frontier pairs with a customs dwell', () => {
    expect(bundle().gameCities.length).toBe(8);
    const twoStations = b.cities.filter((c) => b.stations.filter((s) => s.city === c.id).length === 2).map((c) => c.id);
    expect(twoStations.sort()).toEqual(['SYN_C_AUB', 'SYN_C_TOL']);
    for (const c of twoStations) expect(b.transfers.some((t) => t.kind === 'cross-city' && b.stations.find((s) => s.id === t.from)!.city === c)).toBe(true);
    const pairs = new Map<string, string[]>();
    for (const s of b.stations) if (s.frontierPair) (pairs.get(s.frontierPair) ?? pairs.set(s.frontierPair, []).get(s.frontierPair)!).push(s.id);
    expect([...pairs.values()].filter((v) => v.length === 2).length).toBeGreaterThanOrEqual(2);
    // Every customs/passport stop with a departure dwells.
    const s = b.stops;
    let flagged = 0;
    for (let j = 0; j < s.station.length; j++) if ((s.flags[j]! & 3) && s.dep[j]! >= 0) { flagged++; expect(s.dep[j]! + s.depDay[j]! * 86400 - s.arr[j]! - s.arrDay[j]! * 86400).toBeGreaterThan(0); }
    expect(flagged).toBeGreaterThan(10);
  });

  it('has a sea crossing by steamer, a night express with sleeping cars, through carriages, classes 1–3 with fares', () => {
    expect(b.trips.some((t) => t.mode === 'steamer' && b.stations.find((x) => x.id === b.stations[b.stops.station[t.firstStop]!]!.id)!.country !== b.stations[b.stops.station[t.firstStop + t.nStops - 1]!]!.country)).toBe(true);
    expect(b.trips.some((t) => t.sleeper && t.name !== null)).toBe(true);
    expect(b.throughLinks.length).toBeGreaterThan(0);
    for (const cls of ['1', '2', '3', 'sleeper']) expect(b.fares.some((f) => f.cls === cls)).toBe(true);
  });

  it('runs every trip forward in time and connects every city to every other on the ground', () => {
    const tt = bundle().tt;
    const day = CHANGEOVER + 1;
    tt.trips.forEach((t, i) => {
      let last = -Infinity;
      for (let j = t.firstStop; j < t.firstStop + t.nStops; j++) {
        const a = j === t.firstStop ? tt.depAt(j, day)! : tt.arrAt(j, day)!;
        expect(a, t.id).toBeGreaterThan(last);
        last = a;
        if (tt.stopDep[j]! >= 0 && j > t.firstStop) { expect(tt.depAt(j, day)!).toBeGreaterThanOrEqual(a); last = tt.depAt(j, day)!; }
      }
      void i;
    });
    const pc = new ProfileCache(tt, { horizonSec: 3 * 86400 });
    const view = truthView(tt);
    const cities = b.cities.map((c) => c.id);
    for (const from of cities) for (const to of cities) {
      if (from === to) continue;
      const targets = b.stations.filter((s) => s.city === to).map((s) => tt.st(s.id));
      const best = Math.min(...b.stations.filter((s) => s.city === from).map((s) => pc.earliestAny(view, tt.st(s.id), instantOf(day, 6 * 3600), targets)));
      expect(Number.isFinite(best), `${from} → ${to}`).toBe(true);
    }
  });

  it('two editions of one guide differ on the changeover corridor; the local guide prints fewer trains', () => {
    const fam = new Map(b.editions.map((e) => [e.id, e.family] as const));
    const winter = b.trips.filter((t) => t.edition === 'SYN_E_W14'); const summer = b.trips.filter((t) => t.edition === 'SYN_E_S14');
    expect(fam.get('SYN_E_W14')).toBe(fam.get('SYN_E_S14'));
    const keysW = new Set(winter.map((t) => t.trainKey)); const keysS = new Set(summer.map((t) => t.trainKey));
    expect([...keysW].some((k) => !keysS.has(k))).toBe(true); // withdrawn
    expect([...keysS].some((k) => !keysW.has(k))).toBe(true); // added
    const changed = summer.filter((t) => { const w = winter.find((x) => x.trainKey === t.trainKey); return w && (JSON.stringify(w.run) !== JSON.stringify(t.run)); });
    expect(changed.length).toBeGreaterThan(0); // running days
    const sched = (t: typeof winter[number]) => JSON.stringify([...Array(t.nStops).keys()].map((k) => [b.stops.arr[t.firstStop + k], b.stops.dep[t.firstStop + k]]));
    expect(summer.some((t) => { const w = winter.find((x) => x.trainKey === t.trainKey); return w && sched(w) !== sched(t); })).toBe(true); // retimed
    const local = b.trips.filter((t) => t.edition === 'SYN_E_L14');
    expect(local.length).toBeGreaterThan(0);
    expect(local.length).toBeLessThan(summer.length);
    const s = scenario('preview-changeover'); const setup = s.setup as Setup;
    expect(setup.guides).toEqual(['SYN_E_W14']);
    expect(Math.floor(s.start / 86400)).toBeLessThan(CHANGEOVER);
    expect(Math.floor(s.end / 86400)).toBeGreaterThan(CHANGEOVER);
  });

  it('provides every parameter the rules read, each cited to the invented guide or labelled design', () => {
    const has = (param: string, key: string) => b.params.some((r) => r.param === param && r.key === key);
    const cities = bundle().gameCities;
    for (const c of cities) {
      for (const tier of ['modest', 'middle', 'first']) expect(has('lodging.price', `${c}|${tier}`), `${c} ${tier}`).toBe(true);
      for (const [param, prefix] of [['bank.hours', 'SYN_I_BK_'], ['post.hours', 'SYN_I_PO_'], ['telegraph.hours', 'SYN_I_TO_']] as const) expect(has(param, `${prefix}${c.slice(6)}`), `${param} ${c}`).toBe(true);
    }
    const jurs = [...new Set(b.cities.map((c) => c.jurisdiction))];
    for (const j of jurs) {
      expect(has('registration.regime', j)).toBe(true);
      expect(has('porter.tip', j)).toBe(true);
      for (const k of jurs) expect(has('telegraph.tariff', `${j}>${k}`)).toBe(true);
    }
    for (const cur of ['SYN_CVN', 'SYN_THL', 'SYN_VRN']) expect(has('fx.parity', `GBP>${cur}`)).toBe(true);
    for (const cat of ['express', 'ordinary', 'boat']) expect(has('c07.delay', cat)).toBe(true);
    for (const p of ['records.lag', 'coop.edge', 'frontier.papers', 'bank.closed', 'police.officeHours', 'guide.price', 'hunt.known', 'hunt.bases', 'post.restanteFee']) expect(b.params.some((r) => r.param === p), p).toBe(true);
    // Two police services cooperate, so a cordon in one country can be explained by a record in another.
    expect(b.params.some((r) => r.param === 'coop.edge' && r.key === 'SYN_I_CV_PSO>SYN_I_AR_POL')).toBe(true);
    for (const r of b.params) {
      if (r.valueBasis === 'design') { expect(r.dateBasis).toBe('design'); expect(r.dv, r.id).toMatch(/^DV-(C07|SYN)-\d{3}$/); }
      else expect(b.citations[r.cite!]!.sourceTitle, r.id).toMatch(/invented/);
    }
    const dvIds = new Set(b.designValues.map((v) => v.id));
    for (const r of b.params) if (r.dv) expect(dvIds.has(r.dv), r.dv).toBe(true);
    for (let i = 1; i <= 60; i++) expect(dvIds.has(`DV-C07-${String(i).padStart(3, '0')}`)).toBe(true);
  });
});
