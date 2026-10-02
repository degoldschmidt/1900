# Project "1900" — Decision Log

A chronological record of every decision and event in the game-design committee process. Times are UTC. Entries are appended by the Secretary (orchestrating agent) as they happen; nothing is edited retroactively except to fix typos (noted when done).

Related files:
- `committee/CHARTER.md` — the brief, roster, rules of order, voting method
- `committee/round-1A-proposals/` — raw proposals per panelist
- `committee/round-1B-synthesis/` — compiled proposals, reviews, draft and final candidates
- `committee/round-1C-voting/` — ballots, tally, finalist pitches
- `pitches/index.html` — the final pitch document for the owner

---

## 2026-10-02

### 10:45 — Session opened
- Repository `degoldschmidt/1900` on branch `claude/spy-life-sim-game-design-lvtgcg`. Existing content: a 2015 pygame stub (`1910.py`, one background image). No prior design documents found.
- Owner's commission received: form a 10-person agentic committee; Round 1A fan-out (≥10 proposals per panelist); Round 1B deliberation/synthesis to 20 candidates (merging allowed); Round 1C final vote, with detailed pitches delivered as a designed HTML document; keep a decision/event record as a separate Markdown file.
- Owner's constraints received: five base directives (1895–1925 historical accuracy; spy life sim/RPG à la *Ace of Spies*; deep systems of travel / deception–conversation–coding / items–artifacts / economy–business / politics–warfare; time-sensitive world and hidden-movement hunt à la *Scotland Yard*; efficient, scalable engine for dynamic events, decisions, actions and dependencies). Hard prohibition: no proposals about persons, story, graphics, style — gameplay and systems mechanics only, with an argument for why the game is captivating and addictive.

### 10:52 — Committee constituted (Decision D-001)
- Ten voting panelists created as independent agents with distinct roles: P01 Core Loop & Systems Designer; P02 Simulation Engine Architect; P03 Period Historian (1895–1925); P04 Travel & Logistics Designer; P05 Deception, Conversation & Cryptography Designer; P06 Economy, Business & Artifacts Designer; P07 Politics & Warfare Designer; P08 Pursuit & Hidden-Information Designer; P09 Player Psychology & Retention Designer; P10 Life-Sim & Character Progression Designer.
- Facilitation (non-voting, non-proposing): Secretary = the orchestrating agent (process, record, mechanical tallies); Rapporteur = a dedicated agent spawned in Round 1B to draft the synthesis strictly from the panel's nominations and merge proposals.
- Rationale: ten roles chosen to cover each named system in directive 3, the two pressure mechanics in directive 4, the engine in directive 5, historical accuracy in directive 1, the life-sim framing in directive 2, plus one role dedicated to the owner's "captivating and addictive" criterion.

### 10:52 — Charter adopted (Decision D-002)
- `committee/CHARTER.md` written: directives verbatim; prohibition made operational (what a proposal may/may not contain); touchstones explained mechanically; a historical grounding kit; the proposal format with IDs `P<NN>.<k>`; roster; rules of order.
- Voting method fixed **before** any proposal exists, to prevent method-shopping: Round 1C primary tally = Borda count on complete rankings (rank r → 21 − r points), secondary = mean 0–10 score, tiebreak = first-place count, then recorded coin-toss. Top 5 become finalists for full pitches.
- Synthesis rules fixed in advance: nominations capped at 10 per panelist with at most 3 self-nominations; cluster support counted as distinct nominating panelists (so large merges cannot inflate support); amendments carry with ≥2 proposers/seconders or when correcting a directive violation or factual error.

### 10:53 — Round 1A opened
- Fan-out: all ten panelists instructed to read the charter and file ≥10 proposals each to `committee/round-1A-proposals/`. Panelists work independently and in parallel; no coordination permitted in this round.

### 10:53–11:16 — Round 1A submissions received (Event E-001)
All ten panelists filed within ~23 minutes. Each submission was format-checked by the Secretary (heading regex, eight required fields, ≥10 proposals) and spot-checked for the prohibition (named persons, plot, art/tone vocabulary): clean. Panelists trimmed their files after first writing them; the Secretary committed each state as it appeared and compiled the pool only from final versions.

| Panelist | File | Proposals | Words (final, Secretary's whitespace count) | Final report |
|---|---|---|---|---|
| P01 Core Loop & Systems | `P01-core-loop.md` | 12 | 3,780 | 11:05 |
| P02 Simulation Engine | `P02-engine.md` | 12 | 3,783 | 11:12 |
| P03 Period Historian | `P03-historian.md` | 12 | 3,846 | 11:16 |
| P04 Travel & Logistics | `P04-travel.md` | 12 | 3,697 | 11:08 |
| P05 Deception/Conversation/Crypto | `P05-deception.md` | 12 | 3,709 | 11:08 |
| P06 Economy/Business/Artifacts | `P06-economy.md` | 12 | 3,748 | 11:04 |
| P07 Politics & Warfare | `P07-politics.md` | 12 | 3,759 | 11:09 |
| P08 Pursuit & Hidden Information | `P08-pursuit.md` | 12 | 3,805 | 11:06 |
| P09 Player Psychology & Retention | `P09-psychology.md` | 12 | 3,745 | 11:11 |
| P10 Life-Sim & Progression | `P10-life-sim.md` | 12 | 3,839 | 11:09 |

- **Total: 120 proposals** (owner's minimum was 100). Every panelist marked at least two proposals as "risky but potentially brilliant"; whole-game concepts and game-defining systems are both well represented.
- **Convergences visible before any deliberation** (recorded for transparency; they will count as support in Round 1B): several independent panelists proposed (a) travel departures as the fundamental unit of time ("the departure is the turn"), (b) legends/cover identities as maintained assets with burn rates and falsifiable fact-graphs, (c) a provenance model in which every object and message carries a history that can incriminate, (d) a ledger of traces read by a hunter that reasons from evidence (registers, cables, tickets, bank drafts), (e) a multi-master structure (serving several intelligence services at once), (f) three-tier "bounded history" so the world clock stays accurate while remaining perturbable, (g) debt/creditors as a second hunter, and (h) news latency ("the wire") as a tradable market.

### 11:17 — Historian's audit of the grounding kit (Decision D-003)
P03 flagged three inaccuracies in the Charter's grounding kit (gauge break = change of train, not bogie exchange; Trans-Siberian through running 1903–04; Britain had no routine hotel registration before 1914–16). The Secretary appended an *Errata* section to `CHARTER.md` rather than silently editing the kit, so the record shows what panelists read in Round 1A. All panelists will be told of the errata when Round 1B opens.

### 11:17 — Pool compiled; Round 1A closed (Event E-002)
`committee/round-1B-synthesis/ALL_PROPOSALS.md` compiled verbatim from the ten final files (120 proposals, ~40,000 words) with an index table of ID, title, type and panelist. Nothing was edited. *(Typo fix 11:19: three word counts in the table above corrected to the Secretary's measurement of the final files.)*

*Housekeeping:* pushes to the remote are refused (HTTP 403: the Claude GitHub App is not authorised for this repository). The owner instructed "just commit for now, no pushing"; all work is committed locally on `claude/spy-life-sim-game-design-lvtgcg`.

### 11:20 — Round 1B-1 (Review & Nominate) opened (Event E-003)
- All ten panelists (the same agents, continuing with their Round 1A context) were instructed to read the entire compiled pool and the Charter errata, and to file a review per `REVIEW_TEMPLATE.md`: exactly 10 nominations (≤3 own), ≤5 merge proposals, ≤5 flags, plus role-lens audit notes. Each panelist was assigned an audit lens matching their role: P01 coherence of the loop; P02 feasibility and a common engine spine; P03 historical accuracy; P04 travel depth; P05 information systems; P06 economic integrity; P07 world-clock integrity; P08 hunt fairness; P09 hook honesty; P10 the life as a whole.
- Panelists may not read one another's reviews in this sub-round (independent judgement first; deliberation happens on the Rapporteur's draft in 1B-3).

### 11:22–11:31 — Round 1B-1 reviews received; Round 1B-1 closed (Event E-004)
All ten reviews filed and verified compliant by the Secretary's script (`round-1B-synthesis/tally_nominations.py`; output saved as `NOMINATION_TALLY.md`): exactly 10 nominations each, self-nominations within the cap of 3 (P04 nominated only 1 of its own; P03, P05, P07, P08, P10 used all 3), 5 merge proposals each, 4–5 flags each.

**Nominations.** 100 nominations over 67 distinct proposals. Highest support (distinct nominating panelists): P07.02 *Tramlines and Switchpoints* (4: P01, P02, P03, P07); P08.05 *The Honest Hunter* (4: P01, P02, P08, P09); P03.09 *Timetables of War* (3); P05.03 *The Exchange* (3); P09.04 *The Second Agent* (3); twenty-one further proposals with support 2.

**Merges.** 50 merge proposals. Convergent clusters (the same merge proposed independently by several panelists): *The Departure Is the Turn* (P01.01+P02.01+P04.02+P09.01 — proposed identically by P01, P02, P04, P09); *Several Masters* (P07.01+P02.10+P01.07+P05.09 — proposed by P05, P07, P09; members nominated by 7 panelists); *Hunters on the Timetable* (P08.05+P02.08+P08.07+… — P04, P08); *Bounded History / Tramlines* (P07.02+P02.03+P07.03+P07.04 — P02, P07; war-timetable variant by P03); *Papers / Forgery / Provenance* (P05.06+P03.05+P02.07+… — P03, P05); *Faster Than the Wire* (P02.02+P01.06+P04.06+… — P01, P02, P03); *Comfort or Cover / Pay for Silence / The Price of Comfort* (P01.04+P08.02+P04.07+P09.09 — P01, P08, P09, P10); *Legends as record-sets / Legend portfolio* (P05, P10); *Exits & the Second Agent / Thirty Winters* (P09, P10); *The World Posts Its Own Jobs* (P01, P02); *Concession Agent / Concession House / Broker's Board* (P06, P07); *The Cost Side / The Second Clock / Everyone You Owe* (P01, P06, P10); *Routine Is a Trail / Dossier Mirror* (P04, P09, P10); *Jurisdiction, Liaison and the Archive* (P03, P07, P08); *The Ledger State / The Paper Hunter* (P03, P08).

**Flags (consensus).** P07.10 flagged as a duplicate of P06.06/P03.12 by nine panelists including its author — to be merged, not counted thrice. P02.03 flagged by five panelists (P03, P04, P05, P07, P08) as a directive-1 risk (jittered, player-movable macro-event dates), all proposing the same remedy: adopt P07.02's tiering (Tier-0 dates immovable; jitter and pressure confined to lower tiers), keep the dependency DAG and inquest machinery. P05.11 flagged infeasible at scale by four (P01, P02, P09, P10) — to be bounded and folded into the legends cluster. P09.11 duplicate (3); P06.06 duplicate (3); P05.12 infeasible as mandatory (2); P09.08 duplicate of P05.05 (2); title collision *The Double Ledger* (P05.09 vs P06.01, also P01.07 *The Double Book*) flagged by four — rename. Single flags with corrections: P09.02 (P03: no fixed reveal cadence historically — derive cadence from institutional rhythms); P07.06 (P03: Cheka did not inherit the Okhrana as an institution — model partial archive inheritance); P06.11 (P06, own: gold hoarding was pressed/banned for export, not generally criminal outside Soviet Russia); P03.11 (P10: four-year scenario, not a life — keep as vertical slice inside a whole-life candidate); P06.12 (P01: second hidden-movement game — fold into luggage/consignments); P01.03 (P08: Heat scalar should be derived from the dossier, not drive hunters); P05.07, P05.10, P07.12, P02.12 (P06/P07: economy or directive-1 breaks in combination — bounded fixes proposed).

**Lens audits** are recorded in each review's role-lens notes (accuracy: P03 judged the pool "largely accurate", listing precision fixes by ID; feasibility: P02 proposed a common engine spine; hook honesty: P09; hunt fairness: P08; coherence: P01; travel depth: P04; information systems: P05; economic integrity: P06; world-clock integrity: P07; the life: P10).

### 11:33 — Round 1B-2 opened: Rapporteur appointed (Decision D-004)
- A fresh, non-voting Rapporteur agent is spawned with no proposals of its own. Mandate: apply Charter §6 1B-2 procedure to produce `DRAFT_CANDIDATES.md` with exactly 20 candidates, each a unified playable pitch with provenance, support counts and flag dispositions, plus a full procedure/tally section and a list of nominated proposals not carried (with reasons).
- Secretary's instructions to the Rapporteur: work from individual merge proposals (the transitive-closure cluster view in the tally is too coarse to use directly); candidates must be mutually distinct by hook; apply flag consensus (merge duplicates, bound infeasibles, fix directive-1 risks via tiering); keep breadth across all five directives; frame every candidate as a game the owner can picture playing.

### 12:48 — Round 1B-2 complete: draft of 20 candidates published (Event E-005)
- The Rapporteur filed `round-1B-synthesis/DRAFT_CANDIDATES.md` (9,370 words; each candidate 320–330 words) after reading the Charter, the full pool, all ten reviews and the tally. Secretary's checks: exactly 20 consecutive candidate headings (C01–C20); no named persons, plots, scenes, art or tone; the procedure section documents every step — cluster construction from the 50 merge proposals, the support ranking with tie-break values, all 46 flag rows applied (none rejected), five recorded breadth adjustments, and a "nominated but not carried" list.
- **Draft candidates (support = distinct nominating panelists):** C01 Several Masters, One Truth (7) · C02 Comfort or Cover (5) · C03 The Liaison Map (5) · C04 The Legend Portfolio (5) · C05 Hunters on the Same Bradshaw (5) · C06 Papers and Provenance (5) · C07 The Departure Is the Turn (4) · C08 One Ledger (4) · C09 The Timetable of War (4) · C10 Tramlines and Switchpoints (4) · C11 Thirty Winters (4) · C12 The Exchange (4) · C13 Faster Than the Wire (4) · C14 Routine Is a Trail (3) · C15 The Concession House (3) · C16 The Four Windows (3) · C17 The Paper Hunter (3) · C18 Wants and Windows (3) · C19 Everything That Moves Has an Itinerary (3) · C20 Codes, Ciphers, Censors and Copies (2).
- **Rapporteur's recorded judgement calls:** the hunt mega-cluster split by hook into C02, C03, C05, C14, C16, C17 along the panel's own merge carving; the money-instrument cluster merged into the ledger/debt cluster (C08) on P06's audit; the news-latency market attached to C13 on P01's flag; slot 20 given to Codes over two already-absorbed clusters because "coding" otherwise had no primary candidate; route-discovery (Known World) attached to C07 and skill rust (P10.05) to C11 as uncounted cross-references. Not carried: P08.11 *Poacher and Gamekeeper* and P07.07 *Doomed Projects* (support 1, no merges) — flagged by the Rapporteur as natural amendment targets.
- Decision D-005: the Secretary accepts the draft as procedurally compliant and opens Round 1B-3 without alteration.

### 12:48 — Round 1B-3 (Ratification) opened (Event E-006)
- All ten panelists instructed to read the draft and file RATIFY or AMEND (≤3 amendments) per `RATIFICATION_TEMPLATE.md`. Grounds for amendment: directive/prohibition breach, factual error, near-duplicate candidates, a nominated proposal wrongly dropped or mis-homed, misleading title, a mechanic watered down by the merge. Ranking preferences are not grounds (that is the Round 1C vote).
- Procedure fixed for carrying amendments: after all ten ratifications are in, the Secretary compiles every amendment (`compile_amendments.py` → `AMENDMENTS.md`) and each panelist seconds or objects to each in one line; an amendment carries with ≥2 supporters (proposer + seconder) or when it corrects a directive violation or factual error (Charter §6). The Rapporteur then applies carried amendments and publishes `CANDIDATES_FINAL.md`.

### 12:50–12:54 — Round 1B-3 ratifications received (Event E-007)
All ten panelists replied **AMEND** (0 RATIFY), each with exactly three amendments: 30 in total, compiled by `compile_amendments.py` into `AMENDMENTS.md` (6,583 words). By type: 4 *correct*, 8 *merge*, 18 *clarify*; no *swap-out* or *split* — nobody asked to remove or replace a candidate, so the twenty candidates themselves stand and the amendments concern their content, membership and consistency.

**Convergent amendments (already ≥2 proposers, so they carry under Charter §6):**
- Add P08.11 *Poacher and Gamekeeper* to C05 as a hunter-side/inverse mode on the same belief engine — proposed independently by **six** panelists (A-P02-2, A-P03-3, A-P04-3, A-P05-3, A-P08-2, A-P09-1).
- Home P07.07 *Doomed Projects* in C10 as a Tier-1 political-venture type with explicit extraction scoring — **three** panelists (A-P03-2, A-P07-1, A-P09-3).
- Declare C17 the single record/fact substrate of which C01/C04/C06/C12/C13 stores are views — **two** panelists (A-P05-1, A-P08-3).

**Factual corrections (carry on statement, subject to the Historian's confirmation in seconding):** A-P03-1 (C06: British photographic passports February 1915, compulsory November 1915; German decree 31 July 1914; France early August 1914); A-P01-1 (C03: an 1886 Anglo-Russian extradition treaty existed; sanctuary turns on the 1870 Act's political-offence exception — P07's Notes independently asked the Historian to verify this). P03's Notes carry five further corrections (British registration harmonised across C02/C04/C17; Baghdad concession vs the Ottoman Public Debt Administration; Playfair wording; gold-export ban wording; capitulations verb in C03).

**Engine corrections (P02):** A-P02-1 (C11: year-end compaction may touch only derived state; the event record stays append-only so event ids and replay stay exact); A-P02-3 (C10: one dated regime-parameter layer owned by C10's tier schema and read by C02/C03/C06/C09/C13).

**Other amendments** (one proposer each, need a second): A-P01-2 (C16 shows hunter inference only), A-P01-3 (C04 canonical linkage test = timetable incompatibility), A-P04-1 (C07: make routes-as-knowledge members), A-P04-2 (C09: disruption layer and war graph), A-P05-2 (C04: circles of repute as members), A-P06-1 (C08: debt-shedding bound explicit), A-P06-2 (C18: pay on corroboration), A-P06-3 (C06: provenance = C17 filtered by item), A-P07-2 (C09: rung dates Tier 0), A-P07-3 (C01: budget loop), A-P08-1 (C13: notoriety map is a self-forecast), A-P09-2 (C19: specific hooks), A-P10-1 (C08: obligations ledger), A-P10-2 (C02: body rules), A-P10-3 (C11: rust model as counted member).

### 12:55 — Seconding opened (Event E-008)
- All ten panelists instructed to read `AMENDMENTS.md` and file `ratification/P<NN>-seconds.md` per `SECONDING_TEMPLATE.md`: one position (SECOND / OBJECT / ABSTAIN / PROPOSER) with a one-line reason for each of the 30 amendments. The Historian is asked to confirm or refute the two factual corrections. Objections do not block under the fixed rule but are recorded and reported to the Rapporteur.

### 12:57–13:01 — Seconding complete (Event E-009) and amendments decided (Decision D-006)
- All ten panelists filed seconding tables covering all 30 amendments (`compile_seconds.py` → `SECONDING_TALLY.md`). Result: **every amendment was seconded by all nine non-proposing panelists — 30 of 30 carry with 10 supporters each; 0 objections; 0 abstentions.**
- The Historian confirmed the factual correction in A-P01-1: the Anglo-Russian Treaty for the Surrender of Fugitive Criminals was signed in London on 24 November 1886 (listed in Hansard, 25 February 1924); sanctuary rested on the 1870 Extradition Act's political-offence exception. C03's "no Anglo-Russian treaty" line (from P03.06) is to be corrected. The Historian also verified A-P07-2's dates and A-P04-2's disruption examples as accurate.
- Caveats recorded in-row for the Rapporteur: the six P08.11→C05 and three P07.07→C10 amendments are to be applied once each with consolidated text (requested by P02, P05, P06, P07); in A-P07-2 "watched stations" means wartime control posts, not C05's cordon allocation (P08); in A-P09-2 a crate is pursued only through C17 records (P08); approach events from A-P10-1 must surface in C16's autopsy (P08); when applying A-P01-2, list C12's interrogation inference among C16's windows (P05).
- Decision D-006: the Secretary records all 30 amendments as carried under Charter §6 and instructs the Rapporteur to apply them — plus the Historian's five further corrections from P03's ratification Notes — and publish `CANDIDATES_FINAL.md` with exactly 20 candidates, keeping the identifiers C01–C20 (the Round 1C vote, not the support ranking, determines the final order).

### 13:22 — Round 1B closed: final list of 20 candidates adopted (Decision D-007)
- The Rapporteur published `round-1B-synthesis/CANDIDATES_FINAL.md`: 20 candidates, identifiers and order unchanged from the draft (C01–C20), every one of the 30 carried amendments applied (the six P08.11→C05 and three P07.07→C10 variants applied once each with consolidated text; P08.11 and P07.07 now counted members of C05 and C10), the Historian's five further corrections applied, in-row caveats honoured, and a new **Amendments applied** field on each candidate. Support counts were recomputed and are unchanged.
- Rapporteur's recorded judgement calls: C06's "dice-free" pitch reworded to the two-step examination (probabilistic depth draw, deterministic field resolution) per A-P06-3; C16's title kept and C12's interrogation inference listed among its windows per P05; amendment texts condensed to the 450-word cap with all mechanics retained.
- Secretary's checks: 20 consecutive headings; prohibition scan clean; word cap respected.
- **The twenty candidates going to the vote:** C01 Several Masters, One Truth · C02 Comfort or Cover · C03 The Liaison Map · C04 The Legend Portfolio · C05 Hunters on the Same Bradshaw · C06 Papers and Provenance · C07 The Departure Is the Turn · C08 One Ledger · C09 The Timetable of War · C10 Tramlines and Switchpoints · C11 Thirty Winters · C12 The Exchange · C13 Faster Than the Wire · C14 Routine Is a Trail · C15 The Concession House · C16 The Four Windows · C17 The Paper Hunter · C18 Wants and Windows · C19 Everything That Moves Has an Itinerary · C20 Codes, Ciphers, Censors and Copies.

### 13:22 — Round 1C (final vote) opened (Event E-010)
- Secret ballot per `round-1C-voting/BALLOT_TEMPLATE.md`: each panelist ranks all 20 (1 = best), scores each 0–10, gives a one-line justification per candidate and a ≤150-word champion statement for their #1. Panelists may not read one another's ballots.
- Voting question put to the panel: *"If the owner could build only one of these as the game's defining concept — the spine around which the other systems are arranged — which should it be?"* Criteria: the five directives; captivating and addictive on an honest, specific argument; coherence as ONE game; feasibility of the engine; historical accuracy as mechanics.
- Tally method (fixed in the Charter before any proposal existed): Borda primary (21 − rank), mean score secondary, first-place count tiebreak, seeded coin toss last; `tally.py` validates every ballot (all 20 ranked exactly once, scores in range). Top 5 become finalists for full pitches.

### 13:24–13:28 — Round 1C ballots received, part one (Event E-011)
Ballots filed and validated: P01 (champion C07), P03 (champion C07), P04 (champion C07), P06 (champion C15), P08 (champion C04). Each ranks all 20, scores 0–10, and carries a ≤150-word champion statement. The Secretary has not read the ballots beyond validation and the panelists' own one-line reports; no tally is run until all ten are in.

### 13:28 — Interruption: account usage limit (Event E-012)
Five panelists (P02, P05, P07, P09, P10) were cut off mid-ballot by the account's session usage limit (HTTP 429, "resets 14:50 UTC"). No ballot was written by any of them, so no partial or invalid ballot exists. Their agent contexts are preserved; the Secretary will resume each after the reset with the same instruction, and the vote remains secret (no ballot has been read or tallied). The five completed ballots are committed unchanged.

### 13:25–13:27 — Round 1C ballots received, part two (Event E-013)
On inspection after the usage-limit reset, the five interrupted panelists (P02, P05, P07, P09, P10) had each written a complete ballot (file times 13:27:05–13:27:26) before their processes were cut off while reporting; the Secretary's validator accepts all ten. Champions by ballot: P01 C07 · P02 C07 · P03 C07 · P04 C07 · P05 C01 · P06 C15 · P07 C01 · P08 C04 · P09 C07 · P10 C04. Champion statements run 141–159 words (two slightly over the 150-word guide; accepted).

### 15:30 — Round 1C tally and result (Decision D-008)
The Secretary ran `tally.py` over the ten ballots (method fixed in the Charter: Borda primary, mean score secondary, first-place count tiebreak). No Borda ties occurred anywhere in the table. Full output in `round-1C-voting/RESULTS.md`; machine-readable in `pitches/data/results.json`.

| Final rank | Candidate | Borda | Mean score | Median score | 1st-place votes | Best rank | Worst rank |
|---|---|---|---|---|---|---|---|
| 1 | C07 | 188 | 8.60 | 9.0 | 5 | 1 | 5 |
| 2 | C01 | 185 | 8.50 | 8.5 | 2 | 1 | 5 |
| 3 | C04 | 181 | 8.30 | 8.0 | 2 | 1 | 4 |
| 4 | C17 | 155 | 7.80 | 8.0 | 0 | 2 | 10 |
| 5 | C13 | 145 | 7.50 | 8.0 | 0 | 2 | 14 |
| 6 | C11 | 141 | 7.40 | 7.5 | 0 | 2 | 12 |
| 7 | C05 | 139 | 7.50 | 8.0 | 0 | 3 | 13 |
| 8 | C10 | 122 | 7.30 | 7.0 | 0 | 2 | 14 |
| 9 | C18 | 118 | 7.00 | 7.0 | 0 | 6 | 17 |
| 10 | C15 | 112 | 6.90 | 7.0 | 1 | 1 | 15 |
| 11 | C02 | 102 | 6.70 | 7.0 | 0 | 5 | 17 |
| 12 | C08 | 99 | 6.60 | 7.0 | 0 | 6 | 13 |
| 13 | C03 | 79 | 6.40 | 6.0 | 0 | 8 | 17 |
| 14 | C12 | 69 | 6.30 | 6.0 | 0 | 8 | 18 |
| 15 | C09 | 62 | 6.10 | 6.0 | 0 | 11 | 19 |
| 16 | C06 | 59 | 6.10 | 6.0 | 0 | 13 | 17 |
| 17 | C19 | 55 | 5.90 | 6.0 | 0 | 6 | 19 |
| 18 | C14 | 49 | 5.90 | 6.0 | 0 | 10 | 19 |
| 19 | C16 | 24 | 5.10 | 5.0 | 0 | 14 | 20 |
| 20 | C20 | 16 | 4.80 | 5.0 | 0 | 17 | 20 |


- **Finalists (top 5):** C07 *The Departure Is the Turn* (Borda 188/200, mean 8.60, five first-place votes, never ranked below 5th) · C01 *Several Masters, One Truth* (185, 8.50, two firsts) · C04 *The Legend Portfolio* (181, 8.30, two firsts) · C17 *The Paper Hunter* (155, 7.80) · C13 *Faster Than the Wire* (145, 7.50).
- Reading of the result: the panel converged on a spine — the timetable as the game's clock (C07) — with the two identity systems (C01 several masters; C04 legends) as the dramatic engine and the record/latency substrate (C17, C13) as the hunt's mechanism. C11 *Thirty Winters* missed the final five by four Borda points; C05 *Hunters on the Same Bradshaw* by six.
- Decision D-008: the five finalists proceed to full pitches; ranks 6–20 are presented with their final candidate text and tallies.

### 15:30 — Finalist pitch writing opened (Event E-014)
- Lead authors assigned by provenance (author of each candidate's lead proposal, or its champion): C07 → P01; C01 → P07; C04 → P10; C17 → P08; C13 → P04 (P02 authored C13's lead text but serves as engine auditor for all five, so the travel/communications designer who co-authored a member proposal leads). Template: `round-1C-voting/PITCH_TEMPLATE.md`.
- Audit step to follow: P03 (historical accuracy), P02 (engine feasibility) and P09 (hook honesty) each audit all five pitches in parallel and file notes; lead authors then apply the corrections. Audit notes will be shown alongside each pitch in the owner's document.

### 15:37–15:42 — Finalist pitches filed (Event E-015)
All five lead authors filed complete pitches to `round-1C-voting/pitches/` (12 template sections each): C07 (P01, 2,908 words), C01 (P07, 2,867), C04 (P10, 2,633), C17 (P08, 3,067), C13 (P04, 3,075). Four authors' processes were terminated by an exhausted usage-credit balance while sending their confirmation reports, after their files were complete; the Secretary verified completeness against the template and committed the files unchanged. No content was lost.

### 15:43 — Audit step opened (Event E-016)
P03 (historical accuracy), P02 (engine feasibility and cross-pitch consistency) and P09 (hook honesty) instructed to audit all five pitches in parallel and file notes-only reports to `round-1C-voting/pitches/audits/` (one file per pitch per auditor; verdict, numbered corrections with location and reason, notes). Lead authors apply corrections afterwards; auditors do not edit the pitches, so no two agents write the same file.

### 15:45–15:49 — Audits filed (Event E-017)
Fifteen audit notes filed to `round-1C-voting/pitches/audits/` (three per finalist). Verdicts, in the auditors' words:
- **History (P03):** all five "Accurate", with precision corrections — C07 two corrections and a dating caution (wartime suspension applied only to Bradshaw's Continental; Nord-Express ran on fixed days; October 1905 strike dates N.S./O.S.); C01 one misdating in the worked example ("spring 1913, between the Balkan Wars") plus three precision notes (DORA vs the Aliens Act, Brussels autumn 1914, ICPC 1923); C04 four German precision corrections (31 July 1914 decree; Berlin *Anmeldung*, not *Meldezettel*; enemy property and Ruhleben, autumn 1914; 1917–18); C17 three (alien-registration photographs 1916; letters under perlustration vs censorship; the naval reader); C13 one substantive clarification (private telegrams crossed frontiers without liaison) and two precision corrections (1910 wireless case; Ottoman frontier post and time zone).
- **Engine (P02):** all five "Feasible with corrections" (four or five points each): C07 one scale claim and three wording points; C01 four precision points on the faction entity; C04 fairness-critical precision on the link pass and the low-detail rule; C17 precision on the delivery model, the readers field and lazy materialisation; C13 eager and lazy statements to be reconciled and two parameter points. The five engine sections are judged to describe one engine, the ratified spine.
- **Hook honesty (P09):** all five "honest and mechanism-backed", with five sharpenings each: C07 opens by quoting the panel instead of arguing and undersells two loops; C01 omits its best mechanism (the budget loop) and must state that audit cadences are learnable; C04 two phrasings drift toward upkeep-nagging; C17 claims loss aversion over a dossier the player cannot see and must name relief events; C13's "forecast rates at 40 per cent" reads as a dice roll unless the number is shown to decompose.

### 15:50 — Correction step opened (Event E-018)
Each lead author instructed to apply all three audits to their pitch in place and to append a *Corrections applied* ledger mapping every audit item to the change made (or stating why an item was not applied).

### 15:50–15:55 — Corrections applied (Event E-019)
Every lead author applied all three audits in place and appended a *Corrections applied* ledger: C07 12 of 12 items (P01); C01 13 of 13 (P07; H1 applied as "March 1913, the First Balkan War's last phase" rather than the audit's literal "June 1913", with the reasoning recorded in the ledger); C04 14 of 14 (P10); C17 14 of 14 (P08); C13 13 of 13 (P04). No item was declined. Final lengths including ledgers: C07 3,250 · C01 3,576 · C04 3,345 · C17 3,824 · C13 3,770 words. *(C17's count corrected at 15:58 after P08's final trim; the document was rebuilt and republished as version 2.)*

### 15:56 — Pitch document built and published (Decision D-009)
- `pitches/build.py` renders the committee's own files (final candidates, tally with every panelist's one-line justification and champion statement, the five corrected pitches, the fifteen audit notes) into `pitches/index.html` (standalone) and `pitches/artifact.html` (fragment). Contents: the verdict board; the brief and prohibition; the six-station process line; the roster; the vote as a Borda bar chart and a 20×10 rank matrix with per-cell justifications; the five pitches with champion statements, audit notes and corrections ledgers; the fifteen remaining candidates with full ratified text and the panel's justifications; the record. Both themes designed; the chart ramps were validated with the data-visualisation palette checker (six steps per theme).
- Published privately for the owner at https://claude.ai/artifact/DUCzC7ewT6u5zobPWZvKDY (version 1).

### 15:56 — Decision round 1 closed (Decision D-010)
- Outcome: five finalist pitches, in the panel's order — C07 The Departure Is the Turn; C01 Several Masters, One Truth; C04 The Legend Portfolio; C17 The Paper Hunter; C13 Faster Than the Wire — on a ratified list of twenty candidates, built from 120 proposals.
- Totals: 10 panelists · 120 proposals · 100 nominations over 67 proposals · 50 merge proposals · 46 flags · 20 candidates · 30 amendments proposed, 30 carried, 0 objections · 10 valid ballots, no ties · 5 pitches · 15 audits · 66 audit items applied, 0 declined.
- Interruptions recorded: a usage-limit pause (13:28–15:27 UTC) and an exhausted-credit cut-off (15:42) — in both cases every file had already been written and nothing was lost or altered.
- All work is committed locally on `claude/spy-life-sim-game-design-lvtgcg`; pushing was deferred at the owner's instruction (and the remote refuses the push until the Claude GitHub App is authorised for the repository).
