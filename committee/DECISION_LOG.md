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

| Panelist | File | Proposals | Words (final) | Final report |
|---|---|---|---|---|
| P01 Core Loop & Systems | `P01-core-loop.md` | 12 | 3,780 | 11:05 |
| P02 Simulation Engine | `P02-engine.md` | 12 | 3,840 | 11:12 |
| P03 Period Historian | `P03-historian.md` | 12 | 3,787 | 11:16 |
| P04 Travel & Logistics | `P04-travel.md` | 12 | 3,697 | 11:08 |
| P05 Deception/Conversation/Crypto | `P05-deception.md` | 12 | 3,709 | 11:08 |
| P06 Economy/Business/Artifacts | `P06-economy.md` | 12 | 3,748 | 11:04 |
| P07 Politics & Warfare | `P07-politics.md` | 12 | 3,759 | 11:09 |
| P08 Pursuit & Hidden Information | `P08-pursuit.md` | 12 | 3,805 | 11:06 |
| P09 Player Psychology & Retention | `P09-psychology.md` | 12 | 3,981 | 11:11 |
| P10 Life-Sim & Progression | `P10-life-sim.md` | 12 | 3,839 | 11:09 |

- **Total: 120 proposals** (owner's minimum was 100). Every panelist marked at least two proposals as "risky but potentially brilliant"; whole-game concepts and game-defining systems are both well represented.
- **Convergences visible before any deliberation** (recorded for transparency; they will count as support in Round 1B): several independent panelists proposed (a) travel departures as the fundamental unit of time ("the departure is the turn"), (b) legends/cover identities as maintained assets with burn rates and falsifiable fact-graphs, (c) a provenance model in which every object and message carries a history that can incriminate, (d) a ledger of traces read by a hunter that reasons from evidence (registers, cables, tickets, bank drafts), (e) a multi-master structure (serving several intelligence services at once), (f) three-tier "bounded history" so the world clock stays accurate while remaining perturbable, (g) debt/creditors as a second hunter, and (h) news latency ("the wire") as a tradable market.

### 11:17 — Historian's audit of the grounding kit (Decision D-003)
P03 flagged three inaccuracies in the Charter's grounding kit (gauge break = change of train, not bogie exchange; Trans-Siberian through running 1903–04; Britain had no routine hotel registration before 1914–16). The Secretary appended an *Errata* section to `CHARTER.md` rather than silently editing the kit, so the record shows what panelists read in Round 1A. All panelists will be told of the errata when Round 1B opens.

### 11:17 — Pool compiled; Round 1A closed (Event E-002)
`committee/round-1B-synthesis/ALL_PROPOSALS.md` compiled verbatim from the ten final files (120 proposals, ~40,000 words) with an index table of ID, title, type and panelist. Nothing was edited.

*Housekeeping:* pushes to the remote are refused (HTTP 403: the Claude GitHub App is not authorised for this repository). The owner instructed "just commit for now, no pushing"; all work is committed locally on `claude/spy-life-sim-game-design-lvtgcg`.
