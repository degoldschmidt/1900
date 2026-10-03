# Plan: first prototypes of the top three game ideas

## Context

The committee ranked three concepts for the 1895–1925 spy life-sim:
- **C07 The Departure Is the Turn**: the railway timetable is the clock; every action fits in the slack before a train that leaves without you.
- **C01 Several Masters, One Truth**: several paymasters, each holding its own belief store about you, reconciled only on dated occasions.
- **C04 The Legend Portfolio**: cover identities as accounts; the hunt advances only by linking two names.

Their pitches, engine audits and MVP scopes are in `committee/round-1C-voting/pitches/`. The owner wants a first playable prototype of each, to judge each hook on its own.

**Owner decisions (binding):**
- **Browser, TypeScript.** Each game builds to one self-contained HTML file, playable from a private link or from `file://`, nothing to install.
- **Three separate prototypes.** Each game tests one idea; the ideas never meet in play. Generic plumbing lives in a shared kit; game rules are never shared.
- **Transcribed historical data, before gameplay is built.** Timetables, fares and institutional facts come from period guides with cell-level page citations. Balance values (delay odds, suspicion thresholds) are allowed but kept in separate files labelled as design values.
- **One shared period:** late 1912 to August 1914, plus wartime tables for the London–Low Countries–Berlin corridor into 1915 for the legends game. The timetable game moves from its pitch's 1908 to 1914.
- **Source access:** the owner opens archive.org, gallica.bnf.fr, catalog.hathitrust.org and babel.hathitrust.org in the environment's network settings (environment menu → Edit → Network access → Custom, keeping the package-manager defaults; see https://code.claude.com/docs/en/cloud-environments#network-access). Today these hosts are blocked, as are most others; npm and PyPI are allowed.
- **Commits stay local; no pushing.**

**Repo today:** committee documents, the pitch-page generator (`pitches/`), and a broken 2015 pygame stub (`1910.py`, left untouched). **Toolchain:** Node 22.22 and npm (registry reachable); global Playwright 1.56.1 with Chromium at `/opt/pw-browsers/chromium`; Python 3.11.

## Scope choices made in this plan (change any of them at approval)

1. **Node-only transcription.** For every train on a needed corridor we copy the times at the game's cities and frontier stations, the train header and the footnotes. Intermediate halts are skipped, since no game lets you board or alight there. This selects what to copy; it approximates nothing.
2. **The anchor edition is June/July 1914** (valid at the outbreak of war). The other editions are, in order: March/April 1914 (before the spring changeover, needed for C07's stale-guide test), summer 1913, winter 1912–13, then the wartime tables.
3. **A transcribed issue holds until the next transcribed issue.** Each such gap is flagged in the coverage matrix and shown on each game's About screen.
4. **C04 gets two hunting services on one code path:** the Berlin political police and the British Home Section/Special Branch. Without the second one, the February 1915 photograph rule has no reader. The fallback is one service and no photograph rule.
5. **Build order follows the ranking:** C07, then C01, then C04. No game-rule code is written before that game's data is frozen.
6. **Optional insurance:** the owner may order the 1913 facsimile of Bradshaw's Continental Railway Guide now. It is the fallback if no digitised 1914 anchor is in full view.

## Architecture

### Layout
New top-level `prototype/`. Nothing else in the repo changes except `.gitignore`.

```
prototype/
  package.json  tsconfig.json  vitest.config.ts  README.md  DECISIONS.md
  kit/src/{time,queue,sim,rng,params,money,timetable,records,hunter,data,devtools}/   kit/test/ (+ synthetic fixtures, SYN_ ids)
  games/{c07-departure,c01-masters,c04-legends}/
      index.html (style/data/script slots)  data-manifest.json  design/design-values.json
      src/{main.tsx, game.ts, commands.ts, events.ts, rules/*, views/*, ui/*}
      scenarios/{*.scenario.json, scripts/*.script.json, logs/*.input.json, golden/*.golden.json}
      test/
  data/{sources/, raw/, canonical/, design/DESIGN_VALUES.md, review/}
  tools/{discover,fetch,crops,keying,normalize,validate,compile,review,synth,make,check,playtest}/
  e2e/{playwright.config.ts, shell.e2e.ts, c07.e2e.ts, c01.e2e.ts, c04.e2e.ts}
  scans/ (git-ignored)  build/ and dist/ (already ignored)
```

`.gitignore` additions: `node_modules/`, `prototype/scans/`, `prototype/test-results/`, `prototype/playwright-report/`, `prototype/coverage/`, `*.tsbuildinfo`.

The existing Python template already ignores `lib/`, `build/`, `env/`, `var/`, `downloads/`, `*.log` and `*.spec` at any depth. So:
- no source folder may use those names (the build tool lives in `tools/make/`);
- input logs are named `*.input.json` and E2E files `*.e2e.ts`;
- a check script fails if any intended source file is git-ignored.

### Toolchain
- Exact pins: `typescript@7.0.2` (fall back to the global 6.0.2 if needed), `esbuild@0.28.2`, `vitest@5.0.3`, `preact` 10.x, `@playwright/test@1.56.1` (matches the installed Chromium; never run `playwright install`), `fast-check`, and `sharp` (tools only).
- Tools run with `node tools/x.ts` using Node 22's type stripping, so imports carry `.ts` extensions and no enums or namespaces. If that fails, run tools through `node --experimental-strip-types`.
- Kit imports use the `#kit/*` subpath alias.

### Build (`tools/make/bundle-game.ts`, `npm run build [-- c07]`)
The game's entry is bundled with esbuild as a minified Preact IIFE, then inlined into `index.html`: CSS in `<style>`, the data bundle as `<script type="application/json" id="game-data">`, and JS in `<script>`.

Each game produces `dist/<game>.html` (release) and `dist/<game>.debug.html` (with the inspector and the `?test=1` hooks). Size budget: warn above 1.2 MB, fail above 2 MB.

The built pages must not use eval, workers, fetch or external scripts; only Google Fonts with system fallbacks. Inline scripts are allowed under the artifact page rules, so the same file opens from `file://`. `localStorage` is wrapped in try/catch, with a copyable save code as the fallback.

### Determinism rules (kit and all `rules/` code; enforced by `tools/check/determinism-scan.ts`)
- Time is an integer `Instant` in seconds since 1900-01-01 GMT.
- Banned: `Math.random`, `Date`, `Intl`, `localeCompare` and `for…in`. Transcendental Math functions are banned too; only `+ - * /`, `floor`, `ceil`, `min`, `max`, `abs`, `sqrt` and `imul` are allowed.
- Probabilities are integer per-mille or CDF tables.
- Events are data (`type` + payload) with handlers in a registry; state never holds closures.
- Every random draw is `draw(seed, purpose, ...ids)` using murmur3 keys. There is no sequential stream.
- The UI only calls `sim.step`.

### Shared kit (plumbing only)

| Module | Provides |
|---|---|
| `time/` | Gregorian/Julian day numbers and dual dates. Dated zone rows: each country's railway time vs civil time, with odd-second offsets. Formatting |
| `queue/` | The one binary-heap `EventQueue` per game, ordered by (time, priority, insertion seq), with cancel and serialisation |
| `sim/` | `GameDef{init, handlers, apply, validate}` and `Sim{command, step, advanceUntil}`. Input log keyed by events-processed count `k`. Monthly snapshots, canonical JSON, `stateHash`, base64url save codes, `runScenario`, script→log compiler |
| `rng/` | murmur3_32, `mixKey`, `chancePermille`, `pickCdf` |
| `params/` | The dated parameter layer: rows `(param, key, from, to, tier, value, date_basis, value_basis, src, dv)`. `get(param, key, day)`; changes are scheduled as `ParamChanged` events. Tier-0 world calendar loader |
| `money/` | Integer minor units per currency, £sd formatting, parity conversion with BigInt rationals |
| `timetable/` | Columnar model. Per-day connection expansion from running-day bitsets and suspension rows. CSA earliest arrival with footpaths, minimum change and through links. Profile cache keyed by (graph id, version, origin, absolute hour bucket). `KnownGraph` overlays with `ghostCheck` (withdrawn/retimed/not that day/suspended). Pareto itineraries with slack |
| `records/` | Append-only tuple store `(id, subject, predicate, value, confidence, source institution, time, authorship world/claim, place, sigs)`. `readersOf`/`canRead` derived at query time from dated cooperation rows. `arrival()`: eager for subscribed readers, lazy and identical for everyone else, with backfill when a liaison row opens. `ownTrail()` returns a copy with no store handle |
| `hunter/` | Particle belief over (station, time) propagated only on the hunter's `KnownGraph`, observation reweighting, keyed resampling. Used by C07 and C01 only |
| `data/` | Bundle types and the loader; refuses synthetic bundles in release builds |
| `devtools/` | An inspector for debug builds (queue, store and delivered views, params, beliefs, hash, snapshot/replay, save export) |

**Not shared:** diary and verbs, delay model, cost vector, ledgers, commission generation, faction scoring, debts, audits, budgets, flip, legends, link rules and alibi policy, burn and retire, cordon policy, design values, scenarios and screens. Where two games need a similar idea, each writes its own.

## Data workstream (before any gameplay)

1. **Discovery** (`tools/discover/{archive-org,hathitrust,gallica}.ts` → `data/sources/catalogue.csv`). Sources:
   - archive.org advanced search plus OCR text grep for station names;
   - the HathiTrust catalog and Bib API, checking `pd` vs US-only `pdus`;
   - Gallica SRU and ContentSearch;
   - titles: Bradshaw's Continental, British Bradshaw (North Sea boats, wartime), Cook's Continental, Livret-Chaix, Reichs-Kursbuch, the Dutch Officieele Reisgids;
   - Baedekers: Northern Germany 1913, Russia 1914, Belgium and Holland, Paris, London, Austria-Hungary;
   - statutes and gazettes, plus Le Temps for dated events.

   Output: the coverage matrix `COVERAGE.md` (edition × corridor, with page and table references) and per-source page manifests. Pages are found through OCR text; values never come from OCR. Requests are paced at about 1 per second per host. Further domains may be requested if gaps appear: delpher.nl, digitale-sammlungen.de, digital.slub-dresden.de, anno.onb.ac.at, thegazette.co.uk.
2. **Corridors to transcribe** (tier A is required):
   - London–Dover–Calais–Paris
   - London–Dover–Ostend–Brussels
   - Paris–Brussels
   - Brussels–Cologne
   - Cologne–Hanover–Berlin
   - London–Harwich–Hook of Holland–Rotterdam
   - Rotterdam–Bentheim–Berlin
   - Berlin–Eydtkuhnen/Wirballen–St Petersburg
   - Berlin–Vienna
   - Paris–Vienna

   Tier B: Berlin–Warsaw–Petersburg, London–Flushing–Berlin, the Stettin/Lübeck–Petersburg steamer, Harwich–Antwerp. Wartime: the London–Low Countries–Berlin corridors. Each segment has exactly one truth edition per date (`segment_sources.csv`); other guides only cross-check.
3. **Gate G1 (owner).**
   - **Pass:** a full-view continental guide valid in June–July 1914 covering at least 90% of tier A, plus a pre-changeover edition of the same family.
   - **Otherwise:** (a) the owner scans the listed facsimile pages; (b) national guides per segment; (c) drop tier B; (d) shift scenario dates.
   - **C04 wartime sub-gate:** without wartime sources, travel ends at the last transcribed date and is shown as a source gap. Pre-war tables are never carried forward without a citation.
4. **Acquisition.** `tools/fetch/fetch-pages.ts` downloads only the pages listed in the manifest, via IIIF or image endpoints, into the git-ignored `prototype/scans/`, with a sha256 per page. Scans are never committed.
5. **Transcription.**
   - **Crops:** composite magnified crops of each table, showing the station column and the header band with 6–8 train columns × 12–18 rows (`tools/crops`).
   - **Calibration:** keyers are first calibrated on synthetic period-style pages until single-keyer error is at most 1% and resolved error at most 0.1%.
   - **Double keying:** two independent agent keyers per crop, each blind to the other, following `KEYER_BRIEF.md`. They transcribe as printed, keep ditto marks, and mark doubtful cells rather than guessing.
   - **Diff and resolution:** cell diff, then a third resolver agent with zoomed sub-crops. An `illegible` cell blocks compilation unless the historian waives it. Any crop with agreement below 95% is re-keyed.
   - **Normalisation:** station aliases, the guide's own notation file (cited), day offsets, and footnotes turned into running rules. Every row carries `src = source:page:table:crop:cell`.
6. **Canonical schema** (`data/canonical/*.csv`; every row cited or tied to a design-value id):
   - **Sources and structure:** sources, pages, editions, segments.
   - **Places:** jurisdictions, cities, stations (modern coordinates only as a validation aid), station aliases, zones, station zones.
   - **Timetable tables:** services, stops (local times as printed plus raw cell text), footnotes, running rules, through links, transfers (marked historical or design), fares. All versioned per edition.
   - **Parameters:** params (registration coverage and lag, passports per edge, bank, post and telegraph hours, telegraph tariff, parities, service suspensions, cooperation edges, archive survival).
   - **World:** calendar (Tier-0 events with Gregorian and Julian dates, effects as param row ids), institutions.
7. **Validators V01–V12** (`tools/validate/run.ts`; each also a vitest suite with seeded errors):
   - schema and foreign keys;
   - citations everywhere, with design values banned from timetable tables;
   - monotone times and speed bounds;
   - the same train agreeing across tables;
   - frontier connections in both directions;
   - cross-edition diffs (added, withdrawn, retimed), which feed C07's stale-guide cases;
   - running-rule parsing;
   - fare ordering;
   - zone sanity;
   - every page keyed;
   - no unresolved cells;
   - basis fields present.
8. **Pilot, then gate G2 (owner).** Transcribe Berlin–St Petersburg both ways in the anchor, plus one Baedeker page and ten calendar events, end to end. Report agreement, throughput and a side-by-side review page, then re-plan the volume. The current estimate across all editions is about 15,000 cells and about 700 agent keying and resolution runs.
9. **Historian review** (`HISTORIAN_BRIEF.md`). The historian agent checks:
   - station identities and frontier designations;
   - zone assignments;
   - a blind 5% sample of stop cells and 10% of fares, re-read from the scans, with re-keying above 0.5% error;
   - all waivers and cross-guide disagreements;
   - every param and calendar row;
   - the design-value register, for anything passing as history.

   Verdicts go in `review/HISTORIAN_REVIEW.md`, then gate G3 (owner), then local freeze tags `data-c07-v1`, `data-c01-v1`, `data-c04-v1`.
10. **Compile** (`tools/compile/compile-bundles.ts`). One columnar bundle per game, holding only the segments, params and calendar named in its `data-manifest.json`, with citations as page indices. Every time shown in a game can show "Bradshaw's Continental, June 1914, p. N, table T".

## The three prototypes

Common to all three:
- an About screen (build id, data freeze, sources, design values in use);
- a citation on hover for every timetable time;
- dual Julian dates in Russia;
- save codes;
- an end-of-scenario questionnaire stored in the save code;
- no telemetry: metrics come from replaying save codes (`tools/playtest/analyze.ts`).

### C07 The Departure Is the Turn (1914)
- **Scope:** London, Paris, Brussels, Cologne, Berlin, Warsaw and St Petersburg (Vienna if cheap); classes 1, 2 and 3 plus sleepers; one legend; one hunting service; one commission type; rent and one bill.
- **Scenarios:**
  - **S1 "Changeover"** (late April – early May 1914). The player owns the winter guide when the summer timetable takes effect. A Paris–Brussels–Cologne–Berlin commission chain.
  - **S2 "The Last Week"** (24 July – 5 August 1914). A Petersburg commission and a bill. The Tier-0 rows (ultimatum, mobilisations, the German passport decree, declarations, suspensions) fire on their dates. The hunter is the Prussian political police reading registration slips and frontier records.
- **Rules** (`rules/`):
  - `diary` — booked departure, slot list, opening hours, re-planning on interrupt.
  - `verbs` — draw credit, poste restante, meet, cable, buy guide, ask porter, check board, lodge, wait, rest. Each declares its duration, hours, records written and cost.
  - `costs` — money, hours, health, trace.
  - `travel` — booking and boarding; a shared per-train delay draw; missed connections; the frontier hall; a sealed-leg action budget.
  - `knowledge` — owned editions, porter edges, ghost connections.
  - `commissions` — offers exclusive by travel time; lapsed offers report the rival outcome.
  - `ledger`, `hunt` (subscription plus belief plus a cordon only where watchers can arrive in time), `forecast` (own trail plus public rows only), `world`, `endings`.
- **UI:**
  - `DiaryPage` is the face, with the booked departure pinned and a slack countdown; "Advance" first lists what will pass.
  - `DepartureBoard` (owned-edition times with confidence and citation), `Planner` (slack per connection, delay odds before commitment, the trace each choice writes).
  - `CityPanel`, `GuideShelf`, `Purse`, `Commissions`, `OwnTrail`, `Newspaper`, `Arrival`, `About`.
- **Hypotheses:**
  - H07-1: players use the slack (two or more verbs per stay, waiting under 30%).
  - H07-2: missed connections are blamed on the player's own plan, and buffers grow.
  - H07-3: ghost connections feel fair and change behaviour.
  - H07-4: stops happen aboard night trains.
  - H07-5: cordons are explicable.
  - H07-6: planning stays quick (median 3 minutes or less from arrival to commit).
- **Tests** (scripts → logs → golden hashes; delays forced only through test overrides of design rows):
  - missed connection without buffer vs made with buffer;
  - ghost connection after the changeover, and avoided by buying the new guide;
  - bank closed at closing time;
  - registration lag, eager vs lazy equal;
  - stranded on 1 August vs buffer plus cited fallback;
  - escape by a connection the hunter doesn't know;
  - replay (straight, from snapshot, in browser).

### C01 Several Masters, One Truth (Oct 1912 – Sep 1914)
- **Scope:**
  - three paymasters: the Secret Service Bureau Foreign Section (London), the Deuxième Bureau (Paris), a Belgian commission house (Brussels);
  - each bound to a light legend: name, nationality, papers, cipher keyword;
  - five capitals plus Rotterdam;
  - granularity is the city-day (acts take half-days), with travel chosen from itineraries on the true timetable.
- **Scenarios:** S1 full run from 1 October 1912; S2 March 1913; S3 July 1914 (tests the fusion quickly). Later starts use a prologue script, so history stays honest.
- **Rules:**
  - `factions` — the store as a delivered view of subjects of interest; trust, retainer, audit cadence, requirements, vote, flip.
  - `tokens` — originals, marked copies, observations, fabrications.
  - `reports` — composition with fabrications (truth distance, maturity), cipher choice, claim tuples with signatures, provisional pay after a verification lag and reversal.
  - `debt` — maturities as events on the one queue; suspicion uses integer arithmetic on the product of confidences; service, roll over or buy back.
  - `audits` — questions drawn from the store's top subjects.
  - `liaison` — reconciliation only on dated cooperation rows and at audits; signature matches create linkage candidates; the August 1914 fusion opens old records through `readersOf`.
  - `valuecurves` — with Tier-0 breakpoints: Treaty of London 30 May 1913, the late-May supersession, the Second Balkan War, Bucharest, July 1914.
  - `budget` — a yearly vote anchored to the cited figures; the formula is a design value scaling prices and hunter capacity.
  - `flip` — a kit hunter seeded from the store; powers by the legend's papers (Aliens Restriction Act from 5 August 1914, Defence of the Realm Act from 8 August 1914).
  - `forecast`, `endings`.
- **UI:**
  - `Desk` (the week: meetings, audits, liaison dates as printed in the papers, maturities).
  - `Composer` (held tokens, fabrication distance and maturity, cipher, public-only forecast).
  - `Debts`, `Masters` (payments, reversals and questions; never store contents), `Journey`, `Newspaper`, `Autopsy`.
- **Hypotheses:**
  - H01-1: suspicion is attributed to the right report.
  - H01-2: debts are serviced before audits.
  - H01-3: the flip is preceded by noticed warnings and feels fair.
  - H01-4: reports are composed varied and quickly.
  - H01-5: players see that their successes funded the hunters.
  - H01-6: three masters are kept live into July 1914.
- **Tests:**
  - fabrication matures (exact suspicion), vs serviced;
  - double sale of a marked copy;
  - August fusion with a shared keyword gives a link, flip and autopsy chain, vs distinct keywords giving no link;
  - readers derived at query time with records byte-identical;
  - backfill arrival time;
  - budget loop gives the exact watcher count;
  - payment reversal;
  - powers follow nationality;
  - forecast isolation;
  - replay.

### C04 The Legend Portfolio (1913 – early 1915, as sources allow)
- **Scope:**
  - legend A: British-papered, London accommodation address;
  - legend B: second passport, Berlin flat with polizeiliche Anmeldung, a housekeeper;
  - cities: London, Berlin, Rotterdam, plus the wartime corridor;
  - registration regimes for Britain, Germany and the Netherlands from cited rows;
  - two hunting services (scope choice 4);
  - burn and clean retirement, the legend ledger and the linkage-risk indicator;
  - no donors, notebook, circles or gossip.
- **Scenarios:** S0 "One life" tutorial (October 1913); S1 "Two lives" (from January 1914, with a prologue, to February/March 1915 or the end of sources).
- **Rules:**
  - `legends` — states live, resting, retired, burnt, linked; decay evaluated lazily.
  - `acts` — every act names its legend and instrument and emits identity-tagged records with signatures.
  - `regimes` — registration coverage and lag; passports per edge from 31 July 1914; internment; enemy property; the February 1915 photograph rule.
  - `upkeep` — records of unattended legends emitted on time on quarter-days; texture materialised on arrival with keyed draws; at least one opportunity per obligation.
  - `linkage` — per service, on each delivery, over that service's delivered view only. Rules: shared objects or addresses, keywords, witness co-presence, photograph match at a review event. Timetable compatibility is a necessary gate and incompatibility a veto, never evidence on its own.
  - `alibi` — earliest arrival on the hunter's known graph, using scheduled times plus minimum change, never realised delays. The indicator runs the same test on the public timetable as the worst case.
  - `burn` / `retire` — dependency walk; Abmeldung with a forwarding address vs vanishing with a police query.
  - `ledger`, `endings`.
- **UI:**
  - `LegendLedger` (the central screen: one column per legend).
  - `ActAs` (pick name and payment, with the indicator preview).
  - `Circuit` (timetable plan showing the incompatibility band).
  - `CityDay`, `Calendar`, `BurnRetire` (cascade preview), `Autopsy`.
- **Hypotheses:**
  - H04-1: burning a deep legend hurts, and players prefer clean retirement.
  - H04-2: hand-overs are planned with the indicator green.
  - H04-3: upkeep reads as planning, not chores.
  - H04-4: players continue after a link or burn.
  - H04-5: players act on nationality before the regime flips.
  - H04-6: escapes by unknown connections are explicable.
- **Tests:**
  - Berlin Tuesday / London Wednesday kept apart, vs Monday giving a candidate but no link;
  - escape by a boat unknown to one service while the indicator shows amber;
  - an unattended rent receipt exists on its date;
  - burn cascade vs clean retirement;
  - a link appears only after delivery;
  - German passport decree crossing on 1 August 1914;
  - February 1915 photograph review link;
  - keyword in seized papers;
  - replay.

## Milestones and owner checkpoints

| Step | Content | Exit |
|---|---|---|
| **G0 (owner)** | Approve this plan and its scope choices; open the four domains; decide on the facsimile | Entry in `prototype/DECISIONS.md`; pointer added to `committee/DECISION_LOG.md` |
| M0 Scaffold | Layout, pins, build, check scripts, placeholder pages for all three games, shell E2E | `npm run check` green; three placeholders open from `file://` |
| M1 Kit core | time, queue, sim, rng, params, money, records with delivery and backfill, replay, hash | Unit and property tests green on synthetic fixtures |
| M2 Kit routing and hunter | CSA, profiles, knowledge and ghost check, plan, hunter | CSA equals brute force on 1,000 random synthetic networks; the hunter never uses an unknown trip |
| D1 Data tooling | Schema, validators, crops, briefs, diff, resolve, normalise, compile, synthetic calibration | End to end on synthetic pages; keyer error within targets |
| D0 Discovery | Catalogue, coverage matrix, manifests (needs the domains open) | `COVERAGE.md` |
| **G1 (owner)** | Anchor decision, C04 wartime sub-gate, scenario dates | Recorded |
| D2 Pilot | One corridor end to end | Measured quality and throughput |
| **G2 (owner)** | Method sign-off; volume re-plan | — |
| D3 Anchor, then D4 other editions | June/July 1914 tier A then B; then spring 1914 (C07), 1913 and 1912–13 (C01), wartime (C04) | Validators green per edition |
| D5 Historian review, then **G3 (owner)** | Per game as its data completes | Freeze tags |
| P07, then **G4** | C07 build, tests, private link, playtest read-out | Go/no-go for C01 |
| P01, then **G5** | C01, which can start on frozen 1914 data while 1912–13 finishes | Private link, playtest |
| P04, then **G6** | C04 | Private link, playtest |
| **G7 (owner)** | Comparison of the three hooks against their hypotheses; recommendation | `DECISIONS.md` |

**Parallel work:** M0, M1, M2 and D1 run while access is pending. So do the keyer, resolver and historian briefs and the design-value register. P07 overlaps D4, and P01 starts on frozen 1914 data.

**Commits:** locally at each milestone, with the session's attribution lines; freezes are tagged; nothing is pushed.

## Verification

1. **Unit (vitest).** Covers:
   - calendar vectors: 1 Mar 1900 O.S. = 14 Mar N.S.; 19 Jul 1914 O.S. = Sat 1 Aug N.S.;
   - odd-second zone offsets;
   - queue tie order and mid-run serialisation;
   - murmur reference vectors;
   - CSA vs brute force (midnight crossings, running days, transfers, frontier dwell);
   - eager arrival equals lazy (property test);
   - readers changing while records stay unchanged;
   - backfill;
   - the hunter staying on its overlay.
2. **Data.** `npm run data:validate` runs V01–V12 and writes `build/reports/validation.md`. Any error blocks compilation and builds.
3. **Determinism.** For every scenario script:
   - a straight run reproduces the golden hash;
   - snapshot, restore and finish gives the same hash;
   - the same log replayed in Chromium via `?test=1` matches the hash from Node;
   - the save code round-trips.

   Golden hashes change only via `npm run golden:update` with a reason logged.
4. **Static checks.** The determinism scan; import boundaries (UI imports only `views/`; forecasts and indicators never import stores or hunters; no game imports another); ignore traps; no synthetic data in releases; the size budget.
5. **E2E** (`npx playwright test -c e2e/playwright.config.ts`, `executablePath /opt/pw-browsers/chromium`, pages loaded from `file://`).
   - Zero console errors.
   - Only Google Fonts requests, plus an offline run with fonts blocked.
   - The page served under the artifact page's script rules with no policy violations.
   - `localStorage` forced to throw, with the save-code fallback still working.
   - Each game's core flow driven by clicks, with screenshots of every screen at desktop and phone widths in light and dark.
6. **Release.**
   - Publish each `dist/<game>.html` as a private page, the same way as `pitches/index.html`.
   - Record the link, build id and freeze tag in `DECISIONS.md`.
   - Playtest per the checklist: the tutorial first, then the questionnaire, then `npm run playtest:analyze -- <savecode>` to compute the hypothesis metrics; every anomaly must reproduce from its save code.

## Main risks

| Risk | Mitigation |
|---|---|
| No full-view 1914 anchor, or HathiTrust volumes geofenced | G1 options; the facsimile as insurance; national guides per segment |
| Wartime gaps (the continental Bradshaw ceased in 1914) | British Bradshaw, Kriegsfahrplan and Dutch guides; a visible source-gap closure instead of carrying tables forward |
| Small type, dittos, 12-hour typographic markers | Magnified composite crops, calibration, the guide's own notation page, double keying, physics and cross-table validators, the historian's blind sample |
| Transcription volume and usage limits (the account has already hit its limits twice in this project) | Node-only rule, tiers, per-game freezes, a pilot that measures throughput before committing, work in batches with commits between them |
| Determinism | The rules above, the scanner, and Node-vs-browser hash tests |
| Scope creep | Every rule module maps to a hypothesis; explicit "not in MVP" lists; go/no-go at each playtest |
| Design values passing as history | Separate date and value basis fields; a design-value register reviewed at G3 and listed on the About screen |
| Hidden hunter state leaking to the player | Import boundaries; the inspector stripped from release builds |
| Rights in scans | Scans never committed; only cited facts are |

## Refinements to the committee's engine rules (adopted)

1. The profile cache key includes the knowledge graph and an absolute hour bucket, and stores exact answers.
2. The backfill rule: `arrival = max(emit + lag, open + liaisonLag)`.
3. Draw keys carry a purpose tag.
4. Snapshots are taken monthly, not yearly.
5. The input log is keyed by event count, not by time.
6. Fares, footnotes and through links are versioned per edition, together with the timetables.
7. Param rows carry a separate date basis and value basis.
8. The kit has no general level-of-detail subsystem; only the deferred-texture pattern is shared.
9. In C04, timetable compatibility is a gate, never evidence on its own.
10. Alibi tests ignore realised delays, which a hunter cannot know.
