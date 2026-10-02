# Engine audit — C04 The Legend Portfolio: Several Lives at Once
## Verdict
Feasible with corrections: the identity entity, level of detail and lazy verification clocks are sound; the link pass and low-detail rule need fairness-critical precision.
## Corrections
1. **Engine** — "Linkage is a rule pass run only on new records against indexes" → run per service over that service's delivered view; a link candidate exists only for a service holding both records → a global pass over ground truth would link names with records no hunter has, breaking C17's invariant.
2. **Hook / Engine** — "two names whose records could have been produced by one body on the real timetable" → on the hunter's known graph (C07); the player's linkage-risk indicator uses the public timetable as worst case → C07 states that a connection the hunter does not know is an escape.
3. **Engine** — "Unattended identities run at low level of detail ... materialises specifics on arrival" → scheduled records (rent receipts, renewals, lapsed registrations) are emitted on time while unattended, only texture deferred → the worked example's cash receipt placing B in Berlin must exist when a hunter queries it.
4. **Candidate text** — "standing vectors propagated along bridges, breadth-capped per tick" → gossip crossings are scheduled events on the one queue; standing decay is evaluated lazily on query → the spine has no per-tick passes.
5. **Engine** — "fastest-path query ... cached per city pair and month" → cache earliest-arrival profiles per (origin, hour bucket, period) → compatibility depends on the first record's time, not the pair alone.
## Consistency with the other four
Agrees with C17 (identity-tagged records, dossiers as views, link provenance), C01 (reconciliation as linkage), C13 (own-trail indicator from own records), C10 (nationality and coverage as rows) and C07 (determinism). Divergence only on which graph the alibi test reads (fixed by 2) and on per-tick wording (fixed by 4).
## Notes
Cost follows attention, as claimed, once records are emitted eagerly and texture lazily. The burn cascade should be a dependency-graph walk emitting events, so the autopsy can replay it. Donor record-sets and the notebook are correctly bounded options adding no engine surface.
