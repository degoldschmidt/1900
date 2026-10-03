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
