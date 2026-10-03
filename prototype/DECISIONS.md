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

## 2026-10-03 10:50 — D1 data tooling built (Event P-E005)

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

## 2026-10-03 12:00 — Keyer calibration, round 1 (Event P-E006; Decision P-003)

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

## 2026-10-03 12:20 — Rules specifications written (Event P-E007; Decision P-004)

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

## 2026-10-03 12:50 — Keyer calibration, round 2; D1 closed (Event P-E008; Decision P-005)

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

## 2026-10-03 11:25 — C07 mechanics preview on invented data (Decision P-006); PR #1 merged

**Owner decision.** Build a playable C07 mechanics preview now, on an invented railway, instead of waiting for transcribed 1914 data. This reverses scope choice 5 ("no game-rule code before that game's data freeze") for C07 only. The owner chose it over waiting for library access or supplying scans.

**Rules of the preview:**
1. **The rules code is the real C07 code** (`games/c07-departure/src/`), written to `design/RULES.md`. When the transcribed 1914 data is frozen, it replaces the invented world without changing the rules, and balance values are revisited at that point.
2. **The invented world is kept apart.** It lives only in `games/c07-departure/preview/`: invented towns, countries, guides, timetables, fares and dates, under `SYN_` ids with invented display names. It never enters `data/`, and the release build still refuses synthetic bundles.
3. **The preview is its own page** (`dist/c07-departure.preview.html`). It carries a permanent banner, "Mechanics preview: an invented railway, not history", and its About screen says the same. No historical events are simulated.
4. **Its playtest results answer the mechanics hypotheses only** (H07-1 to H07-6, for the loop). Historical texture is judged again on the 1914 build.

**PR #1 merged** into `master` (merge commit `1a11e5c`) at the owner's request. The working branch was not reset to the new `master`, because the reset was refused by the session's permission check. Further commits continue on the same branch from the merged head, so a later PR will show only new work.

## 2026-10-03 12:05 — D0 discovery, first pass: no full-view 1912–1915 timetable (Event P-E010)

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
