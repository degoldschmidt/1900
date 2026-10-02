# Engine audit — C07 The Departure Is the Turn
## Verdict
Feasible with corrections: the queue, overlay and level-of-detail claims are sound; one scale claim and three wording points need fixing.
## Corrections
1. **Engine** — "reachability sets are precomputed per timetable period so dozens of hunters cost microseconds" → compute earliest-arrival profiles on demand by connection-scan and memoise them per (origin, hour bucket, period) on the hierarchical graph; the microseconds hold per propagation step from cached profiles → a full node × hour × node precomputation is hundreds of megabytes per monthly edition for the trunk network alone.
2. **Engine** — "a save is seed plus input log" → seed plus input log plus year-boundary snapshots (C11, A-P02-1) → replay is exact either way, but without snapshots every load replays thirty years.
3. **Systems/Deception** — "conversations run on a fine-grained clock nested inside a slot" → finer timestamps on the same global queue, never a second scheduler → one scheduler is the ratified spine and total ordering must hold across conversation and pursuit.
4. **Engine** — "the planner routes on [the overlay], the simulator executes the truth" → add that hunters route and test alibis on their own overlays, as the Systems section already says → C04's link test and C05's propagation must read a hunter's known graph, not ground truth.
## Consistency with the other four
Agrees with C17 (dwell emits records; the communications graph is C17's lag model), C13 (two graphs over shared places), C10's parameter layer, and C01 and C04 running on this clock. The one divergence is the reachability claim: C05 and C17 describe on-demand hierarchical propagation, which is the feasible form, and C07 should say the same. Nested clocks and sealed long legs must be stated as queue events, exactly as C19 states itineraries.
## Notes
This is the spine as ratified: one queue, total ordering, data handlers, level of detail. The MVP (one edition, one corridor, exact replay) is the right first deliverable and should ship with the replay harness that C16's autopsy and all balancing work need. Keep timetables as the only tables versioned per edition; everything else versions by date rows.
