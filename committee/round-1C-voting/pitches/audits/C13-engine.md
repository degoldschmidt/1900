# Engine audit — C13 Faster Than the Wire: The Information Front
## Verdict
Feasible with corrections: two graphs, one propagation model, lazy markets and the self-forecast are sound; eager and lazy statements must be reconciled and two parameter points fixed.
## Corrections
1. **Engine / Time pressure** — "the scheduler posts arrival events at reader institutions" beside "arrivals materialise only when a reader queries" → post arrival events only for subscribed readers and evaluate all others lazily on query → the two sentences otherwise contradict, and C17 must state the same rule.
2. **Engine** — "every latency draw is seeded" → hash-seed each draw by (seed, fact id, reader id, edge id) rather than drawing from a sequential stream → lazy evaluation changes draw order, and only hash seeding keeps replay and the autopsy exact.
3. **Systems/Travel** — "a wire needs open offices at both ends and, across a frontier, a liaison agreement" → the jurisdiction gate applies to official traffic (police circulars, liaison requests); commercial and private cables cross frontiers ungated, subject to censorship rows after August 1914 → channel edges carry a gate keyed by traffic class.
4. **Engine** — "a fact is C17's tuple ... readers" → readers are derived at query time from the source institution and C03's matrix on that date → the worked example's office copy read "under an Ottoman warrant weeks away" requires it.
5. **Engine** — "thousands of facts per campaign, each with a handful of arrivals" → true for subject-of-interest facts; model editions and circulars as periodic broadcast channels with circulation geometry (C16), not one fact per copy → otherwise the count is tens of thousands.
## Consistency with the other four
Agrees with C07 (shared place nodes, arrivals on one queue), C17 (one tuple; propagation as the lag-and-reader model), C10 (edges as parameter rows), C04 and C01 (self-forecast as an own-record view). Divergence only in the eager wording, which C17 shares; both should adopt the subscribed-reader rule. Markets as lazily evaluated functions match the spine's no-per-tick rule.
## Notes
The self-forecast reusing propagation code on the player's own log is the cleanest fairness guarantee in the five pitches; enforce it by giving that code no handle to faction stores. Prescience and who-dealt rules as investigation-time queries are correctly lazy. The MVP's tuning-target sentence is the right acceptance test.
