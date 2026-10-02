# Engine audit — C17 The Paper Hunter: One Evidence Engine
## Verdict
Feasible with corrections: the store, views, determinism and authoring claims are the ratified spine; the delivery model, the readers field and lazy materialisation need precision.
## Corrections
1. **Engine** — "emission schedules one delivery event per reader on C07's global priority queue" → schedule delivery events only for subscribed readers (active hunters, bourses, censors on gated channels); all other readers evaluate arrival lazily on query from the same seeded lag rule → broadcast records (circulars, gazettes) would otherwise post thousands of events each, and C13 describes the lazy form.
2. **Hook / Engine** — the tuple's "readers" field → store the record's source institution; derive the reader set at query time from C03's matrix and archive survival on that date → the 1914 fusion and the worked example's 1916 review must open 1912 records to readers that did not exist at emission.
3. **Engine** — "only ledgers a hunter queries expand into records; the rest remain counts" → applies to the background population only; records tagged to the player and other entities of interest are always written → the own-trail view and self-forecast read them before any hunter does.
4. **Engine** — "seeded lags" → seed each draw by hashing (seed, record id, reader id, edge id), not from a shared sequential stream → lazy and eager evaluation must agree and replay must be order-independent.
5. **Engine** — "Cost is linear in acts" → holds under correction 1; as written it is acts × readers.
## Consistency with the other four
C17 is the substrate the other four cite, and their tuple, authorship and view language matches it. Two reconciliations are needed: C13's lazy arrivals against this pitch's per-reader events (correction 1), and C07's reachability wording against the on-demand hierarchical propagation stated here, which is the feasible one. C01 and C04 inherit the readers derivation of correction 2.
## Notes
Build order is right: the store with replay and the autopsy is the engine's first deliverable and its debugger. Keep emission rules, coverage and lags as C10 rows so a jurisdiction is data. The scepticism learner should be a per-service weight vector updated on discarded fabrications, nothing heavier.
