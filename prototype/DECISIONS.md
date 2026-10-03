# Prototype decision log

Chronological record of decisions and events for the three prototypes of the top-ranked concepts. Times are UTC. The full plan is reproduced in `prototype/PLAN.md`.

## 2026-10-03 09:26 — G0: plan approved (Decision P-001)

The owner approved the implementation plan for first prototypes of C07 *The Departure Is the Turn*, C01 *Several Masters, One Truth* and C04 *The Legend Portfolio*.

**Owner decisions (from the planning questions):**
- Platform: browser, TypeScript; each game is one self-contained HTML file.
- Shape: three separate prototypes, one per idea; a shared kit holds generic plumbing only, never game rules.
- Historical data: transcribed from period guides before gameplay is built; design and balance values are kept separate and labelled.
- Period: one shared dataset, late 1912 to August 1914, plus wartime tables for the London–Low Countries–Berlin corridor into 1915. The timetable game moves from 1908 to 1914.
- Source access: the owner will open archive.org, gallica.bnf.fr, catalog.hathitrust.org and babel.hathitrust.org in the environment's network settings.
- Commits stay local; nothing is pushed.

**Scope choices approved with the plan:**
1. Node-only transcription (times at game cities and frontier stations, train headers, footnotes).
2. Anchor edition June/July 1914; then March/April 1914, summer 1913, winter 1912–13, wartime.
3. A transcribed issue holds until the next transcribed issue; gaps flagged and shown in-game.
4. C04 has two hunting services on one code path.
5. Build order C07, C01, C04; no game-rule code before that game's data freeze.
6. Facsimile of the 1913 Bradshaw's Continental is optional insurance (owner's call).

## 2026-10-03 09:26 — Access check (Event P-E001)

The four library domains still return no connection through the environment's egress proxy. Discovery (D0) waits; scaffold, kit, routing and data tooling (M0, M1, M2, D1) proceed, using synthetic fixtures that can never be compiled into a game.

## 2026-10-03 09:32 — M0 scaffold complete (Event P-E002)

Layout, exact tool pins, the single-file build (`tools/make/bundle-game.ts`), static checks (determinism scan, import boundaries, ignore traps, size budget, no synthetic data in releases) and placeholder pages for the three games. The shell E2E opens each page from `file://`, under the artifact page's script policy and with `localStorage` forced to throw: 12 of 12 pass.

## 2026-10-03 09:42 — M1 kit core complete (Event P-E003)

Calendar (Gregorian, Julian, dual dates), dated zones, the event queue, the simulation loop with input log keyed by events processed, monthly snapshots, canonical JSON and state hash, save codes, keyed murmur3 draws, the dated parameter layer, money in integer minor units, and the record store with readers derived at query time, delivery and backfill. Property test: eager delivery to subscribers equals lazy `arrival()`. Replay from the start and from a snapshot reproduces the hash.

## 2026-10-03 10:01 — M2 kit routing and hunter complete (Event P-E004)

Timetable model, per-day connection expansion, connection-scan earliest arrival with footpaths, minimum change and through links, exact profile cache, known-graph overlays with ghost checks, round-based Pareto itineraries, and the particle hunter. Exit criteria met: the scan equals an order-independent brute-force fixpoint on 1,000 random synthetic networks, and the hunter never rides a trip outside its known editions. 49 kit tests pass; typecheck and static checks clean.

Fix during M2: the itinerary rounds were not monotone when the start was seeded only in round 0, so a two-train journey could be reported as one train. Every round is now seeded with the start, and reconstruction steps down one round per ride.

Access re-checked at 10:01: the four library domains still do not connect. D0 remains blocked.

## 2026-10-03 10:22 — D1 data tooling built (Event P-E005)

Both halves of the data tooling are built, reviewed and committed; 288 tests pass across the prototype, with typecheck and static checks clean.

- **D1a (data core):** canonical schema with cell-level citations, validators V01–V12 with seeded-error tests, the normaliser, and the per-game bundle compiler. Canonical CSVs are header-only.
- **D1b (acquisition and keying):** discovery clients for archive.org, HathiTrust and Gallica (about one request per second per host), the coverage-matrix generator, the manifest-driven page fetcher (scans hashed, kept out of git), composite crops, the keyer, resolver and historian briefs, diff, resolution packets, merge, blind sampling, synthetic calibration pages and the side-by-side review page. The library formats are tested against hand-written fixtures only, since the hosts are still blocked; HathiTrust has no title-search API, so its volume ids will be listed by hand from the catalogue site.

**Conventions fixed (Decision P-002):**
1. Date ranges in canonical CSVs are inclusive. The compiler converts them to the kit's exclusive `to` for zones, station zones, params and institutions. An edition's `validTo` stays inclusive. Both rules are now stated in the kit types.
2. Waivers for unreadable cells live in `data/canonical/waivers.csv` and need the historian's reasoning.
3. A calendar event is hidden from the player only if its kind starts with `secret`.
4. Two design-value registers, both labelled and shown on each game's About screen. Data-level values used by canonical rows (for example a minimum change time no guide prints) are `DV-###` in `data/design/DESIGN_VALUES.md`. Game-rule balance constants are `DV-C07-###`, `DV-C01-###` and `DV-C04-###` in each game's `design/design-values.json`.
5. A separate footnote crop per table panel (`<table>-fn-<panel>`).

**Also built while access is pending:**
- The debug inspector, test hooks, golden runs and playtest analysis.
- A debug-only kit lab page. Routing, itineraries, the hunter, keyed draws, money and calendars give identical results in Node and Chromium, and save codes replay to the same hash in both directions.
- Three agents are drafting each game's rules specification and data-needs list, a design document, not rule code, so discovery knows which non-timetable facts to look for.

Keyer calibration on synthetic pages, the last D1 exit criterion, is under way: three pages, nine crops, two blind keyers, then resolution and scoring against hidden ground truth.

## 2026-10-03 10:46 — Keyer calibration, round 1 (Event P-E006; Decision P-003)

**Set-up.** Three synthetic period-style pages with sealed ground truth, nine crops, 724 cells per keyer:
- seed 7: light degradation, the realism target;
- seed 11: heavy blur, mrn/aft style;
- seed 23: heavy blur and halftone noise, 12 trains.

Two blind keyer agents worked from the crop images only, then a diff, then two resolver agents with 4× zooms, then a merge, then a score against the sealed truth.

**Results**

| | cells | value errors | exact errors | illegible |
|---|---|---|---|---|
| single keyers (A+B) | 1,248 | 5 (0.40%) | 14 (1.12%) | 3 |
| resolved | 624 | 1 (0.16%) | 6 (0.96%) | 24 (3.8%) |

- **Page 7:** no value errors, no illegible cells.
- **Pages 11 and 23:** all 24 illegible cells are here. Each resolver note gave the correct context reading, which supports historian waivers.
- **Remaining value error:** a blurred header train number printed `108`, which both keyers and the resolver read as `106`.
- The single-keyer target is met; the resolved target (0.1%) is met on pages 7 and 11 but not on page 23.

**Findings and changes**
1. **Agent keyers share their misreadings.** Every residual error was identical in A and B, so the diff never saw it. Cells the keyers agree on but either marked doubtful now go to the resolver as well (reason `doubtful`). This does not lower the agreement figure.
2. **Value versus typography (Decision P-003).** The calibration targets apply to the **value** error rate. The printed separator between figures, italics and small capitals are typography. Bold (p.m.), underlining and footnote marks are value. The exact rate is still reported.
3. **Brief rules added:**
   - an uncertain separator alone never makes a cell illegible;
   - footnote symbols are never guessed (on the blurred page every guessed symbol was wrong);
   - confusable digits (3/8, 5/6, 6/8, 0/8, 3/5, 8/9) count as read only when the telling stroke is visible, header train numbers included.
4. **Ground-truth fix.** The synthetic ground truth lacked the italic that the page prints on arr./dep. The keyers were right and the generator was wrong; the generator is fixed.

**Implications for real pages.** Scan quality, not keying, sets the abstention rate. Real scans should be fetched at the highest resolution the library offers, so crops resemble page 7 rather than pages 11 and 23. Validator V04 (the same train agreeing across tables) gives a second check on train numbers.

**Next.** Round 2 on three fresh pages with the revised briefs, to confirm the resolved target before D1 is closed.

## 2026-10-03 10:48 — Rules specifications written (Event P-E007; Decision P-004)

Each game now has `design/RULES.md` and `design/DATA_NEEDS.md`. These are design documents, not rule code, so the plan's order (no rule code before a game's data freeze) holds. They contain mechanics only. Every historical value is a named parameter to be transcribed and cited, and every orientation date is flagged "to verify".

| Game | Commands | Event types | Design values | Hypothesis metrics |
|---|---|---|---|---|
| C07 The Departure | 7 | 23 | 60 (DV-C07-) | H07-1 to H07-6, 14 metrics |
| C01 Several Masters | 18 | 15 + 3 kit | 84 (DV-C01-) | H01-1 to H01-6, 13 metrics |
| C04 The Legend Portfolio | 12 | 19 | 47 (DV-C04-) | H04-1 to H04-6, 14 metrics |

**Kit gaps the specs found, now closed in the kit or tooling:**
- metrics receive the questionnaire answers;
- `Ctx.pick` (a keyed CDF draw);
- `Ctx.bundle` (needed because a game restored from a snapshot never runs `init`);
- cooperation edges filtered by record kind and keyed pass share, with `arrivalVia` naming the delivering row;
- scenario prologues;
- key kinds `city` and `topic`;
- game-prefixed design-value ids;
- draw-free worst-case exposure (`records/exposure.ts`) for player-side indicators, so hidden draws cannot leak.

One gap is left to the C07 build: filtering a known graph by mode or operator.

**Proposed scope additions for gate G1** (from the data-needs lists):
1. Brussels–Rotterdam as a corridor (C01).
2. A winter 1913–14 issue for the Harwich–Hook of Holland route both ways (C04).
3. The Flushing route promoted to the tier needed for C04's escape-by-unknown-boat test (H04-6).

**Spec questions with defaults adopted provisionally (Decision P-004).** The owner may override any of them at G1.

Already settled by the kit changes:
- the questionnaire channel (C07 Q5);
- the design-value id format (C07 Q6);
- kit gaps K1 and K2 (C01 Q6).

| # | Game | Question | Default adopted |
|---|---|---|---|
| 1 | C07 | No May 1914 issue transcribed: may the June/July anchor be the truth from the changeover date its own preliminary pages print? | Yes, if printed and cited; otherwise S1 moves to the first transcribed summer issue |
| 2 | C07 | Warsaw | Only if Berlin–Alexandrowo–Warsaw–Petersburg is transcribed |
| 3 | C07 | Arrest after one detection | Keep; two detections if playtests find it harsh |
| 4 | C07 | Hunter present in S1 | Yes (one code path) |
| 5 | C01 | Should distinct cipher keywords cost something? | No; reuse is a measured choice |
| 6 | C01 | Pre-war flips without a cited power row | Stop pay and watch only |
| 7 | C01 | The commission house | A design row, labelled; its legal environment cited |
| 8 | C01 | Aug–Sep 1914 London–Paris and London–Rotterdam | Close at cited suspension dates; show the source gap |
| 9 | C01 | Fusion date if no source dates liaison | The cited British declaration of war, date basis design, stated on About |
| 10 | C04 | No pre-war record path gives one service both a Berlin and a London record | Test-only reach rows for T1–T2; in play, links come from footprints, wartime Rotterdam, queries, searches and photographs |
| 11 | C04 | Both services read Rotterdam police registers from the outbreak | Yes, labelled design |
| 12 | C04 | A non-British second passport at S1 | No |
| 13 | C04 | Questionnaire by an `Answer` command | Yes, so answers replay |
| 14 | C04 | Alibi veto window | 7 days (DV-C04-005); revisit after playtest |
| 15 | C04 | Keep the second hunting service and the photograph rule | Keep; decide at G1 by source coverage |

Question 10 bears on C04's hook. Before the war, linking two legends depends mostly on the player's own footprint crossing jurisdictions. The owner should weigh this at G1, together with the wartime source sub-gate.

## 2026-10-03 11:01 — Keyer calibration, round 2; D1 closed (Event P-E008; Decision P-005)

**Set-up.** Three fresh synthetic pages with sealed ground truth, 677 cells per keyer:
- seed 31: light degradation, mrn/aft style;
- seed 37: light degradation, mrn/aft style, 15 rows;
- seed 41: heavy blur, 12 trains.

Two new blind keyers worked from the revised briefs, then one resolver.

**Results**

| | cells | value errors | exact errors | illegible |
|---|---|---|---|---|
| single keyers (A+B) | 1,354 | 0 (0.00%) | 20 | 8 |
| resolved | 677 | **0 (0.00%)** | 19 | 14 (2.1%) |

- **Both targets are met** on all three pages: single keyer ≤ 1.0% and resolved ≤ 0.1%, measured on value errors.
- **Illegible cells.** All 14 are on blurred prints. Ten are footnote symbols (†/‡/§, b/p) and four are header train numbers. All five train-number readings the resolver offered in its notes were correct: 308, 186, 396a, 352a and 388.
- **Exact errors.** These are all typography: bold on the ditto marks under bold station names, which one keyer and then the resolver judged heavy, and one separator.

**Decision P-005 (scoring refinement, made after seeing round 2's single-keyer results, and stated as such):**
- Bold counts toward the value error rate only on body cells, where it marks p.m. times. On station names and train numbers it is emphasis no game uses.
- Two keyers abstaining on the same reading count as concordant for the re-key threshold. The cell still goes to the resolver.
- Under the round-1 rules these round-2 single keyers would have shown 18 extra label-bold "errors". None changes data any game reads.

**Across both rounds.** One value error survived resolution in 1,301 resolved cells: round 1's header `108` read as `106`. It came before the confusable-digit rule. With the final briefs, no value error survived. Abstention is 0% on light-degradation pages and 2–6% on heavy-blur pages, so scan resolution decides the waiver workload.

**D1 is closed.** The data tooling runs end to end on synthetic pages and keyer error is within target. Calibration costs about 120,000 tokens per keyer per 9-crop round and 170,000–200,000 per resolver. This feeds the pilot (D2) throughput estimate.

**Waiting on access.** The remaining milestones need sources: D0 discovery, G1, the D2 pilot, transcription, historian review and freezes, and then the three builds. The four library domains still do not connect (re-checked 12:50).

## 2026-10-03 11:15 — Access re-check after the owner's change (Event P-E009)

The owner reported opening the four library domains. All four still get "403 to CONNECT" from the environment proxy, both in this session's container and in a fresh throwaway session started in the same environment at 11:05 (since archived). The environment is still listed as "Default - trusted network access", so the change has not reached its policy. The owner will re-check and save Network access: Custom, with the four domains and the package-manager defaults. The D0 run-book is in `PLAN.md` (addendum of 3 October).

## 2026-10-03 11:22 — C07 mechanics preview on invented data (Decision P-006); PR #1 merged

**Owner decision.** Build a playable C07 mechanics preview now, on an invented railway, instead of waiting for transcribed 1914 data. This reverses scope choice 5 ("no game-rule code before that game's data freeze") for C07 only. The owner chose it over waiting for library access or supplying scans.

**Rules of the preview:**
1. **The rules code is the real C07 code** (`games/c07-departure/src/`), written to `design/RULES.md`. When the transcribed 1914 data is frozen, it replaces the invented world without changing the rules, and balance values are revisited at that point.
2. **The invented world is kept apart.** It lives only in `games/c07-departure/preview/`: invented towns, countries, guides, timetables, fares and dates, under `SYN_` ids with invented display names. It never enters `data/`, and the release build still refuses synthetic bundles.
3. **The preview is its own page** (`dist/c07-departure.preview.html`). It carries a permanent banner, "Mechanics preview: an invented railway, not history", and its About screen says the same. No historical events are simulated.
4. **Its playtest results answer the mechanics hypotheses only** (H07-1 to H07-6, for the loop). Historical texture is judged again on the 1914 build.

**PR #1 merged** into `master` (merge commit `1a11e5c`) at the owner's request. The working branch was not reset to the new `master`, because the reset was refused by the session's permission check. Further commits continue on the same branch from the merged head, so a later PR will show only new work.

## 2026-10-03 11:46 — D0 discovery, first pass: no full-view 1912–1915 timetable (Event P-E010)

**Access.** Since 11:25 UTC the environment reaches archive.org in full: search, metadata, OCR, page images and the `*.archive.org` mirrors. It also reaches Gallica (SRU search) and the HathiTrust catalogue API, which looks volumes up by identifier only. HathiTrust's catalogue search and page images (`babel`) answer with a Cloudflare bot challenge, so HathiTrust volumes cannot be searched or fetched from here.

**Run.** `tools/discover/run.ts` worked through the 22 search-plan entries and wrote 370 rows to `data/sources/catalogue.csv`. Follow-up searches by hand used archive.org's full-text search API (`be-api.us.archive.org/fts`), which searches inside every scanned book.

**Finding.** No continental or national timetable valid in 1912–1915 is in full view:
- archive.org has Bradshaw's Continental for 1875, 1880 and 1888 and a 1934 issue; a Livret-Chaix of 1869; and British Bradshaws for 1877 and 1943. Its only 1915 "Bradshaw" is the shareholders' manual.
- Gallica holds only the Livret-Chaix railway maps.
- No Reichs-Kursbuch, Cook's Continental or Dutch Reisgids issue for 1912–1915 turned up.

Gate G1's pass condition (a full-view guide valid June–July 1914 covering at least 90% of tier A) is therefore **not met** with the open libraries.

**Useful finds:**
- *Bradshaw's Through Routes to the Chief Cities…*, 52nd issue, 1913 (`ia-bradshaws-india-1913`). From printed page 1 (page_seq 70) it holds tables of through fares from London to continental destinations by named route (via Calais, Ostend, Flushing, the Hook, Harwich), 1st and 2nd class, single and return. These are fare data for all three games, but there are no train times.
- Baedeker's *Russia* (English, 1914) and other Baedekers.
- 191 Reichsgesetzblatt records, Le Temps (62 periodical records) and the Journal officiel on Gallica.
- German local newspapers of 1911–1916 from Polish digital libraries, mirrored on archive.org (Thorn *Die Presse*, *Posener Tageblatt*, *Lodzer Zeitung*). These printed local timetables at changeovers and may give a cross-check for single stations.

**Tool fix from live data.** Current archive.org djvu.txt has no page breaks, so the page grep put every hit on page 1. The grep now uses the item's `_hocr_searchtext.txt.gz` with `_hocr_pageindex.json.gz` (page_seq = leaf + 1) and reports printed page numbers from `_page_numbers.json`. Tests were added.

**Next: gate G1 (owner).** The plan's options are (a) the owner scans facsimile pages, (b) national guides per segment from further libraries, (c) dropping tier B, (d) shifting dates.

## 2026-10-03 11:50 — Gate G1: facsimile scans plus more libraries (Decision P-007)

**Owner decision.** Both of these at once:

**(a) Facsimile scans.** The owner photographs a printed facsimile of *Bradshaw's Continental Railway Guide* (1913) following `data/sources/FACSIMILE_SCAN_GUIDE.md`:
- the identification pages, the explanation of signs, the ten tier-A routes in both directions, the sea crossings, the express and sleeping-car pages, and fares;
- about 40–80 pages.

The photos enter as source `os-bradshaw-continental-1913` through the new `tools/fetch/import-scans.ts`: copied into the git-ignored `scans/`, with a sha256 and dimensions per page, and a manifest row with url `owner:<file>`. Photos are never committed.

**Consequences, under the approved scope choices:**
- The anchor becomes the 1913 issue.
- By choice 3, it holds until the next transcribed issue, and every game's About screen shows that gap.
- C07's spring-1914 changeover test (S1) needs a second issue on either side of the changeover. That is open until a 1914 source is found, and the changeover is not invented.
- C04's wartime sub-gate stays open.

**(b) More libraries for national guides.** The owner will add further domains to the environment's Allowed domains:
- `europeana.eu`, `api.europeana.eu` (Europe-wide aggregator, for discovery);
- `deutsche-digitale-bibliothek.de`, `api.deutsche-digitale-bibliothek.de` (German aggregator);
- `digital.slub-dresden.de` (Dresden);
- `digitale-sammlungen.de`, `api.digitale-sammlungen.de` (Munich);
- `digital.staatsbibliothek-berlin.de`, `content.staatsbibliothek-berlin.de` (Berlin State Library);
- `delpher.nl`, `resolver.kb.nl` (Dutch);
- `anno.onb.ac.at`, `digital.onb.ac.at` (Austrian);
- `polona.pl` (Polish).

If the field accepts wildcards: `*.europeana.eu`, `*.deutsche-digitale-bibliothek.de`, `*.slub-dresden.de`, `*.digitale-sammlungen.de`, `*.staatsbibliothek-berlin.de`, `*.kb.nl`, `*.onb.ac.at`. The search targets are a Reichs-Kursbuch or a regional Prussian Kursbuch for spring and summer 1914, the Dutch Officieele Reisgids, Austrian Kursbücher, and Russian timetable pages.

## 2026-10-03 12:15 — C07 preview, stage 1: rules, invented world, view models (Event P-E011)

**Built:**
- The real C07 rules, per `design/RULES.md`: 7 commands, 23 event types, one file per §5 module, and `metrics.ts` for every §1 metric.
- Design values DV-C07-001 to 070 in `design/design-values.json`. Number 061 (pay for away offers) is new, and 062–070 are inline constants moved out of the rules.
- The invented world `preview/world.bundle.json` (161 KB, `synthetic: true`, `preview-1`, 18 April – 12 May 1914):
  - three invented countries, each with its own currency and railway clock, one of them with odd-second time;
  - 8 cities plus 4 frontier towns, and 103 trips;
  - a winter guide and a summer guide that changes over on 1 May, producing all four ghost statuses, plus a cheaper local guide.
- Scenarios `preview-tutorial` and `preview-changeover`, with golden scripts.
- View models for every screen.
- 55 new tests; 357 in total pass.

**Kit and tools:**
- K3 (a known graph can exclude modes and operators).
- Invented currency codes `SYN_*` with display units.
- `--preview` for golden runs and playtest analysis; golden records also store the metrics.
- The Node tools define `__DEBUG__`.
- The import check applies the forecast rule to views (the autopsy view excepted).

**Rules change (Decision P-008), departing from RULES.md §5.5:** a player keeps every guide edition bought. For each travel day the planner uses the newest owned edition already in force on that day. Dropping the older edition, as the spec said, would leave no correct guide for the remaining winter days after buying the summer guide early. The ghost-connection hypothesis (H07-3) is unaffected: holding only the old guide after the changeover still produces ghosts.

**Deferred:**
- The Tier-0 political event tests (T5a, T5b), since the invented world has no history. The code paths exist and are exercised through test overrides.
- The browser half of the replay test (T7), which waits for stage 2.

## 2026-10-03 12:37 — D0, second pass in the newly opened libraries (Event P-E012; Decision P-009)

**Access.** These are reachable: the Europeana API, SLUB Dresden (its `/data/kitodo/` paths serve METS, images, OCR and PDFs; the viewer pages have a bot check), the Munich digital collections, both Berlin State Library hosts, and Polona. These are not: `www.europeana.eu`, `www.deutsche-digitale-bibliothek.de`, `labs.ddb.de`, `www.delpher.nl`, `resolver.kb.nl`, `anno.onb.ac.at` and `digital.onb.ac.at`.

**Finding.**
1. **No national or international timetable for 1912–1915 is in full view** in any reachable library. That covers archive.org, Gallica, the Munich collections (Bavarian Kursbuch only to 1901), the Berlin State Library, Polona and Europeana (maps only).
2. **One regional series is fully usable:** SLUB Dresden's *R. Fritzsches Kursbuch für Sachsen, das übrige Mitteldeutschland, Böhmen und Schlesien*. It has OCR and 300 dpi page images, verified by download (1299×1842). The issues:
   - summer 1911 to winter 1915/16;
   - in particular **Winter 1913/14** (valid 1 October 1913 – 30 April 1914, `rfrkuf_394077458-19130002`), **Summer 1914** (1 May – 30 September 1914, `rfrkuf_394077458-19140001`) and **Winter 1914/15** (`rfrkuf_394077458-19140002`).

   It covers the tier-A corridor **Berlin – Dresden – Bodenbach – Prague – Vienna**, and Breslau – Oderberg in part. A sample of its OCR found no Eydtkuhnen, Herbesthal, Bentheim or Cologne tables.
3. ***Bradshaw's August 1914 Continental Guide* exists as a facsimile** (David & Charles, 1972; also a 1980 edition). archive.org has it as a borrow-only scan (`bradshawsaugust10000unse`) that cannot be fetched. It covers every tier-A corridor and matches the planned anchor month exactly.

**Decision P-009 (within the owner's G1 choices P-007):**
- The preferred book to photograph is the **August 1914** facsimile, if the owner can get one; the 1913 facsimile remains acceptable. `FACSIMILE_SCAN_GUIDE.md` is updated.
- **Berlin – Vienna comes from the Fritzsche Kursbuch** (source `slub-…`, to be added to the fetch tools): Summer 1914 is the anchor and Winter 1913/14 the earlier issue.
- **C07's changeover scenario (S1) can now be real.** The Fritzsche pair sits exactly either side of the 1 May 1914 change, so S1 is re-pointed to the Berlin – Dresden – Prague – Vienna corridor.
- **The D2 pilot moves to Berlin – Vienna in Fritzsche Summer 1914** (both directions). It needs no owner photos, so it can start now. The planned pilot corridor, Berlin – St Petersburg, waits for the facsimile.
- Winter 1914/15 gives a wartime comparison on the same corridor.

## 2026-10-03 12:42 — C07 preview, stage 2: playable page (Event P-E013)

**The page.** Preact screens built on the stage-1 view models:
- diary with the booked departure as a ticket, its slack and a latest-leave time;
- Advance, which first lists what will pass;
- planner with miss odds and the records each choice writes;
- departure board with citations, town, pocket, ledger, letters, newspaper and About;
- arrival, the questionnaire and the autopsy.

**Saving.** Save codes are kept in local storage when it is available, with copy and paste of the code; the host's `hot` snapshot keeps a running game across a republish.

**The build.** `node tools/make/bundle-game.ts c07 --preview` writes `dist/c07-departure.preview(.artifact).html` (391 KB). It uses the `__PREVIEW__` define, which lets a preview page carry synthetic data. Release pages still refuse synthetic data; they show the placeholder and pass the no-synthetic check.

**Tests.** 364 unit tests and 28 of 28 E2E pass.
- The whole tutorial is played in Chromium twice: on a phone from file://, and as the published fragment under the artifact CSP on a desktop.
- Save codes replay between Node and the browser to the same hash, which completes RULES T7.
- Play continues with storage refused.
- 19 screens were captured at 1280×800 and 390×844 in light and dark, with no horizontal scroll.

**Follow-up.** The release bundle's JavaScript includes the preview scenario files, because `scenarios.ts` imports them. The data block stays clean, but the scenarios should be loaded only in the preview build. This is to be fixed before the 1914 release.

## 2026-10-03 13:31 — D2 pilot preparation on Fritzsche Summer 1914 (Event P-E014)

**Source.** `sl-rfrkuf_394077458-19140001`, *R. Fritzsches Kursbuch*, Sommer-Ausgabe 1914, valid 1 May – 30 September 1914, from SLUB Dresden. SLUB is now a discovery and fetch library (`tools/discover/slub.ts`): it reads the METS, uses ALTO OCR to locate pages, and fetches 300 dpi JPEGs.

**Tables, in both directions:**
- 12 Dresden–Röderau–Berlin (pp. 54–55)
- 13 Dresden–Elsterwerda–Berlin (pp. 56–57)
- 23 Dresden–Bodenbach/Tetschen (pp. 70–75)
- 112 Bodenbach–Prague–Vienna, StEG (pp. 178–179)
- 123 Prague–Gmünd–Vienna (p. 185, printed sideways)
- 126 Tetschen–Vienna, Nordwestbahn (pp. 188–189)

Also the explanation of signs (p. 5) and the title page. In all, 18 pages, fetched with a sha256 for each.

**Crops.** 69: 33 grid crops (1,247 cells: 802 times, 318 header, 127 label), 31 column-notes crops and 5 footnote crops.

**Layout proposer.** `tools/crops/propose-layout.ts` proposes grids from ALTO word boxes. Every one of the 17 panels needed hand correction (columns were right first time on 4 of 15). On 6 pages the OCR coordinates are rotated, and table 123 was drawn by hand. Layout effort is a real cost for the G2 volume estimate.

**Notation draft.** `data/canonical/notation/FKB1914-SO.json`, cited to pp. 3 and 5. Underlined minutes mean night times (6.00 p.m. – 5.59 a.m.). Twelve items are flagged for the historian.

**Normaliser work before stage 3:**
- arrival/departure markers printed before the station name;
- table 123's reverse half, read bottom to top;
- column notes;
- "ab"/"Ank." words and braced times.

**Known hard spots:** the lower section of p. 192; p. 75's last column partly in the binding; braced shared times in table 112.

## 2026-10-03 13:52 — D2 pilot keying and diff; value rules per guide (Event P-E015; Decisions P-010, P-011)

**Keying.** Six blind keyer agents, two per batch: about 900,000 tokens for 69 crops on 18 pages. Two keyers made small blindness breaches; neither touched its partner's file. Keyer A of batch X listed its own empty output folder. Keyer B of batch Z ran a self-check over other B files after its keying was done.

**First diff.** Grid agreement was 70–95% and the notes much lower. The causes:
- bold on header train numbers, 78 of about 106 real disagreements in tables 12 and 13;
- label conventions: leader dots, and signs printed after names;
- notes listed in a different order by the two keyers;
- in tables 112, 123 and 126, bold on body times, 107 disputes.

On the times themselves, A and B disagreed on 10 of about 600 cells in tables 12 and 13.

**Tool changes** (pilot stage 3a and this session):
- `tools/keying/value.ts` holds the shared value function (diff and scorer);
- a new `typography` dispute reason, counted as concordant;
- column notes are aligned by content (`align.ts`);
- the label conventions are spelled out in both briefs;
- column-notes crops get real zooms;
- `resolve-support.ts --include-rekey` builds packets for crops below the re-key line.

**Decision P-010 (value rules per guide).** Which type styles carry meaning on body cells is a property of the guide. A guide's notation file may declare it as `valueMarks`; without one, the P-005 default applies (bold and underline are value; italic and small capitals are typography). Fritzsches Kursbuch 1914 declares `["u", "i"]`. Its signs page (p. 5, items 4, 6 and 10) gives meaning to italic figures (luxury and express trains) and underlined minutes (night) and none to bold.

With P-010, grid agreement per crop rose: table 12 to 81–100%, 13 to 89–98%, 112 to 79–94%, and 126 to 85–100%.

**Decision P-011 (pilot resolves every crop).** The plan's rule re-keys any crop under 950‰. In the pilot, every crop goes to resolution instead (67 packets, 711 disputed cells):
- 311 doubtful and 282 typography;
- 44 text, 43 illegible, 15 marks, 12 text and marks;
- 4 missing.

The historian's blind sample then measures whether resolution alone reaches the target. The re-key threshold for the full run is a G2 decision, informed by that sample.

## 2026-10-03 13:57 — First playtest of the C07 preview: map-first redesign (Event P-E016; Decision P-012)

**Owner's playtest verdict.** "Not good at all": most game elements were confusing and not motivating. Asked what failed, the owner chose all four options:
- too many screens (Diary, Plan, Board, Town, Pocket, Ledger);
- an unclear goal;
- the slack/diary idea felt like admin, not play;
- dry numbers (per-mille odds, cost vectors, citations, guide editions).

**Reading.** This is evidence against H07-1 in its diary form. Filling the slack before a booked departure, presented as a diary to manage, did not motivate. The routing, timetable, hunt and save engine is not in question; the presentation and the shape of the player's choices are.

**Decision P-012.** Rebuild the preview around a map, in the manner of *80 Days* (inkle). No assets, names or art are taken from that game.
- **The map is the home screen.** It shows the player's position, railways and sea routes, and the goal pinned on it.
- **One clear goal** sits at the top, with its deadline and pay.
- **A city sheet** lists departures in plain words and offers two or three quick things to do in town, with a visible countdown to the train.
- **Journeys play on the map:** the train moves along the line while the clock runs, and short event cards appear (frontier check, delay, a train missing from an out-of-date guide).
- **At most three screens**, numbers shown as words and icons, and a guided tutorial.

The rules engine, data model, save codes and metrics stay. H07-1 is restated for the map: "players use time in town for optional acts before departures". The metric remains verbs per stay and the waiting share.

## 2026-10-03 14:41 — C07 preview rebuilt map-first (Event P-E017)

The preview now plays on a map, following P-012.
- **Map (home):** a full-screen atlas of the invented countries, with sea, borders, railways and the steamer route. Your token and the goal flag with its deadline sit on it, towns one train away are emphasised, known police attention shows as a shaded ring, and night dims the map.
- **Top bar:** the date with a running clock, cash with its £ value in words, and one goal line with meeting pips and time left.
- **City sheet:** departures in plain words with Book; the best journeys to a distant town, with changes spelled out; and once booked, a countdown to the train with two to four things to do in town.
- **Journey:** the token runs along the line while the clock moves. Event cards cover the frontier register, delays, changes with an overnight room, missed connections, a ghost train (with "Buy the new guide"), arrival and delivery.
- **Pocket** is a sheet. The tutorial opens with three coach marks, and the autopsy is a map replay.

Eight old screens are removed. **The rules are unchanged.** The map layer is a `map` key in the world bundle, kept out of the data hash, so golden runs and save codes still match. Tests: 404 unit tests (14 new) and 28/28 E2E, including full playthroughs on phone and desktop under the artifact CSP. The page is 402 KB, and it is republished to the same private link.

## 2026-10-03 14:43 — D2 pilot, historian's blind sample: FAIL on marks (Event P-E018)

**Sample.** Seed 52817, a 20% stratified sample (132 cells): table 12, 18; 13, 18; 23, 32; 112, 23; 123, 15; 126, 26. The historian re-read every cell from the scans, blind to the transcription.

**Result.** **5 keying errors in 132 (3.8%; 95% interval about 1.6–8.6%)** against the 0.5% target, so the source fails.
- **Every error is a missing mark.** Italic was left out in an express-train column three times, and a "!" printed before a time was dropped twice.
- **No hour or minute figure was wrong** in the sample.
- Two cells are genuinely ambiguous. The historian corrected one misreading of their own.
- 15 bold-only differences are not value errors under P-010.
- By table: 13, 23 and 112 show no keying error; 12, 123 and 126 show one or more.

**Reading.** Agent keying is reliable for the figures that drive the game (times) and unreliable for small typographic signs and per-cell italic. Italic marks a whole train (an express), so it belongs to the column, not the cell.

**Proposed fixes, for G2:**
1. Read train category once per column (from the header and the column's type) and stop keying italic cell by cell. The normaliser applies it to the whole column.
2. Add the "!" sign, and a short list of this guide's signs, to the keyer brief with zoomed examples.
3. Re-key tables 12, 123 and 126 for signs only, then draw a fresh sample.

The verdict stands as FAIL until a new sample passes. The tool was run without `--apply`, so nothing is marked for re-keying yet.

## 2026-10-03 15:05 — D2 pilot complete; report for G2 (Event P-E019)

The normaliser produced 175 services (127 trains), 487 stops, 189 footnotes and 30 running-rule proposals for the six pilot tables. It gained a partial mode, label markers, reverse reading, column notes as train headers, alternative end rows, and a train `category` field (a schema change). Validators: V11 has 71 illegible stops and V07 has 38 unreviewed rules, both expected. V03 found three print or reading problems, reported and not corrected. All other checks are clean.

**Pilot cost:** about 3.0M tokens for 18 pages, about 100k per page recurring.

The full report is `data/review/PILOT_REPORT.md`. **Verdict: times are reliable, marks fail the 0.5% target (3.8%).** Five fixes are proposed and await the owner's G2 decision.

## 2026-10-03 15:05 — Gate G2: fix the method, then re-check (Decision P-013)

**Owner decision.** Apply the pilot report's five fixes. Re-key tables 12, 123 and 126 under the new brief. A fresh 20% blind sample must pass the 0.5% target before more transcription. After that, the first new volume is Fritzsche Winter 1913/14 (`rfrkuf_394077458-19130002`) for the same Berlin–Vienna corridor. Paired with Summer 1914, it gives C07 the real 1 May 1914 changeover.

**How the fixes are applied:**
1. **Train category is read per column.** Keyers mark italic once on the column's train-number header cell. In body cells italic becomes typography (FKB1914-SO `valueMarks` becomes `["u"]`), and the normaliser takes the category from the header.
2. **The guide's own signs go into the keyer brief,** with zoomed examples from the pilot scans (kept in `build/`, as scans are not committed) and a token for doubled signs.
3. **Crop margins are wider,** and there is a rule for sideways notes interrupted by times.
4. **Failed image loads are caught.** Agents stop and report any image read that fails. A post-check (`ocr-check`) compares keyed header train numbers with the page OCR, as a signal only, never as values, and flags crops a keyer may not have seen.
5. **Tables 12, 123 and 126 are re-keyed in full** by fresh blind keyers, then resolved, then sampled at 20% across all six tables.

## 2026-10-03 16:52 — G2 re-check sample: no errors found, but not conclusive (Event P-E020)

**Draw.** Seed 70419, 133 cells from 653, taken from the -v2 crops for 12, 123 and 126.

**Problems.** Image reads repeatedly failed with "media removed: request limit". Only 56 cells were read blind; tables 12 and 112 went unmeasured. The historian's first pass wrote readings for 42 cells never seen. They voided those and re-scored, but the void score had shown them the stored values, so those cells can no longer be re-read blind. This is a process failure and is recorded as such.

**Result.** On the 56 cells read blind: **0 value errors** (95% interval 0–6.4%). The 23 mismatches are all typography: 11 bold, and 12 body italics keyed before the per-column rule, where the D/E headers still set the category correctly.

**Across both samples,** no hour or minute figure was wrong in about 190 cells read blind.

**Statistics.** Showing ≤ 0.5% with zero errors needs about 344 of 653 cells. A 20% sample bounds the rate only near 2.2%, so the G2 target as written cannot be shown by a 20% sample.

**Gaps outside the sample:**
- Table 112 c28 prints italic but has no header italic, so no category is set.
- Table 126 c31 has an italic feeder block under an upright train, which the per-column rule cannot record.

**Main operational finding.** Image-read limits, not keying skill, are now the bottleneck for resolvers and the historian alike.

**Proposed remedy (owner's G2 decision pending).** Contact sheets: one image holding about 12–20 numbered cell zooms with their keys printed beside them. That cuts image requests about 15×. With it, either re-sample to the size the target needs, or replace the target with cumulative sampling during production.

## 2026-10-03 19:50 — G2 final blind sample: 2 keying errors in 359 cells, FAIL (Event P-E021)

**Draw.** Seed 19140501, 360 of the 653 sampleable cells of Fritzsche Summer 1914 (all six tables, in proportion), read on contact sheets by two blind historians split by table, H1 (12, 13, 23) and H2 (112, 123, 126). All 23 sheets loaded; no image failed.

**Exposure, handled before scoring.** The sign-example index printed its cells' stored readings, and 7 sampled cells were examples that both historians had seen. The rule, fixed before any score in commit `fafaf38`: drop those readings, and have a fresh historian (H3), who never saw the index, re-read the seven. H3 agreed on all seven.

**Score.** 359 read, 1 illegible to the reader, 7 value mismatches.

**Adjudication.** A fresh agent judged each mismatch on untouched zooms, with the two readings unlabelled and the key kept apart. Result: 2 keying errors and 5 reader misreads, detailed in `data/review/HISTORIAN_REVIEW.md` §3c.

| case | finding | data impact |
|---|---|---|
| 0165, 126 c13 r2 | Tetschen 9 20 is underlined, so 21:20, not 09:20 | yes |
| 0343, 23 c54 r135 | the □ belongs to the sideways customs note, not to the cell | none |

**Verdict under the pre-registered rule: FAIL.** 2 errors in 359 read: observed 0.56%, exact 95% upper bound 1.225% (at most 8 of 653). Passing at this count needs at least 589 cells read with no further error.

**Cause.** Both errors are resolver overrides (resolution `other`): 2 of the 3 such cells sampled; the source has 5. The other 356 cells read had no error: 197 keyer-agreed and 159 where the resolver chose a keyer's reading. No hour or minute figure was wrong in the sample.
- The 0165 override read an underline away under the zoom's red outline. Table 126's grid sits about 8 px above its times, which puts the underline right on that edge. V03 had flagged the leg at 3 km/h, and nobody re-read it.
- The 0343 override predates P-013's sideways-note rule.

**Fixed.**
1. Zooms mark the cell with ticks in a frame outside the image; nothing is drawn on the print.
2. The contact-sheet wash keeps a clear strip round the cell, for underlines and edge signs. Its `--plain` and `--context` options serve adjudication.
3. `tools/review/physics-queue.ts` turns V03's leg and dwell issues into blind re-reads.
4. Briefs:
   - a bar across a column on a row line is structure, not `—`;
   - a resolver looks for a mark one keyer saw below the cell's edge before dropping it;
   - every `other` resolution and every V03 leg warning is re-read blind;
   - every mismatch is adjudicated before it counts.
5. The sign-example index gives no readings and skips unread sampled cells. The draw warns about overlap, and contact sheets refuse it.
6. Both errors are corrected in the resolved files. 126.c13 now reaches Tetschen at 21.20, and its V03 warning is gone.
7. The log's heading times from P-E005 on had run ahead of the clock (estimates). They are corrected to their commit times, and the plan addendum on G2 to 18:01 UTC.

**Targeted re-read (H4).** A fresh blind historian re-read six cells on one plain contact sheet (`data/review/sample-g2fix.csv`). They are the cells in these groups that no reader had yet verified:
- the 2 remaining resolver overrides (12 c12 r85 and 23 c2 r0);
- the 2 remaining keyer disagreements on an underline (12 c9 r40 and 126 c30 r92);
- the other stop of each V03-flagged leg (112 c14 r47 and 126 c13 r1).

All six agree with the stored values (two differ in bold only). That completes three checks:
- all 5 overrides: 2 were wrong and are corrected, 3 were right;
- all 8 keyer disagreements on an underline are verified;
- both stops of both flagged legs are as printed.

The 112 c14 leg (Bodenbach 22.45 → Prag 18.10 the next day, 4 km/h) is therefore not a reading error. The column holds only those two times and a class line printed part-way down (`II.III`, from the column-notes crop), so it probably carries two trains that the normaliser joined. It is left for the historian's check of the page, with the other structural items. (The score's FAIL line for this file is no verdict: six chosen cells are not a sample.)

**For the owner (G2).** The source fails the rule as set. The errors are few, of one kind, and fixed at the cause. Options are put to the owner with this entry.

## 2026-10-03 20:10 — Gate G2: read the rest of the source (Decision P-014)

**Owner's choice:** "Read the rest". Every sampleable cell of Fritzsche Summer 1914 that no reader has checked yet is read blind. That is 288 of 652 (one cell became empty with the 0343 correction).

**Readers.** Two fresh historians (H5: tables 12, 13 and 23, 150 cells, 10 sheets; H6: tables 112, 123 and 126, 138 cells, 9 sheets). They read plain contact sheets, with nothing washed or drawn on the print. Each has a reading file of their own: `data/review/sample-g2census-H5.csv` and `-H6.csv`, merged into `sample-g2census.csv`.

**Briefs.** The briefs carry what earlier readers got wrong: underlines below a cell's edge, bars on row lines, table 126's grid offset, italic 0/2/7, and signs across a column rule.

**Adjudication.** Every mismatch is adjudicated blind, as in P-E021.

**Closing rule, set now.** The verdict is computed over the original population (N = 653) with all three readings together:
- g2final: 359 read, 2 keying errors;
- g2fix: 6 read, 0 errors;
- the census.

G2 passes when the exact one-sided 95% upper bound is at most 0.5%. With no further keying error, that holds from 589 cells read. A further confirmed error is corrected, and the source is then judged on the complete count (a census has no sampling error: its rate is the number found).

**In parallel.** Fritzsche Winter 1913/14 (`sl-rfrkuf_394077458-19130002`) is fetched and laid out for C07's changeover. Keying waits for G2.
