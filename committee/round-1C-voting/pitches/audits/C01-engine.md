# Engine audit — C01 Several Masters, One Truth
## Verdict
Feasible with corrections: the faction entity, event-only reconciliation and the budget loop are sound; four precision points.
## Corrections
1. **Engine** — "Consistency debt is a priority queue" → claim test events are entries on C07's one global queue, keyed by their world-clock trigger → a separate queue would break total ordering and exact replay.
2. **Engine** — "events number dozens per campaign" → hundreds to low thousands (audit cadence × ten to fifteen factions × thirty years, plus liaison openings), each linear in shared facts → still trivial, but the number as written cannot hold.
3. **Risks** — "an estimated beliefs view that is never ground truth" → a self-forecast computed from the player's own deliveries and the public audit, lag and liaison rows, never reading a store → anything else reopens the minimap that A-P08-1 closed.
4. **Engine** — "the store ... holding only facts about entities of interest" → add that a world record's readers are derived at query time from its source institution and C03's matrix on that date → the 1914 fusion and the 1917 spill must open old records to readers that did not exist at emission.
## Consistency with the other four
Fully aligned with C17 (stores are views of one tuple type; claims carry authorship), C04 (liaison reconciliation as a linkage source), C05 (votes fund watchers and cables), C10 (Tier 0 alliance rows; votes as Tier 1 outputs) and C07 (the clock). The only open point is the beliefs view, which must be the same object as the self-forecast in C13, C02 and C17.
## Notes
Reconciliation only at events is the cost control that keeps ten stores free between reckonings; keep it. Signature matching (marks, keywords, hands) is C04's link pass run over the two reconciled views, not a separate matcher. The MVP's twenty game-months with three paymasters is well sized for tuning lag, reversal and threshold constants.
