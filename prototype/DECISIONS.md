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
