# Project "1900" — Game Design Committee Charter

*Adopted 2026-10-02 (UTC). This document is the shared brief for every panelist. Read it in full before producing anything.*

---

## 1. The commission

The committee is asked to generate, debate, and rank **game concept pitches** for a single game. The commissioning owner has given exactly **five base directives** and asked the committee to be *as creative and innovative as possible* within them.

### The five base directives (verbatim)

1. **Historically accurate**, set between **1895 and 1925**.
2. **Life sim / RPG of a spy** (reference: *Reilly, Ace of Spies*).
3. **Incredibly deep systems** of **travel** (reference: *Bradshaw's Guide*, the *80 Days* iOS game), **deception / conversation / coding**, **items / artifacts**, **economy / business**, **politics / warfare**.
4. **Pressure by time-sensitive events** (the world moves independently of the player) and **hidden movements** (the player is being hunted, as in *Scotland Yard*).
5. **Create an efficient and scalable engine for dynamic events, decisions, actions and dependencies.**

### The one hard prohibition (verbatim intent of the owner)

> It is imperative that none of the ideas/proposals are about details of persons, story, graphics, style, etc.; but rather about **gameplay and systems mechanics**, giving an idea **why this game would be captivating and addictive to play**.

Concretely, a proposal must **not**:
- propose characters, named protagonists/antagonists, cast lists, or scripted plots;
- propose a narrative arc, "the story of…", scenes, dialogue lines, or endings as story;
- propose art direction, visual style, UI skinning, music, tone, or "feel" descriptions that are not mechanical.

A proposal **may**:
- reference historical **institutions, technologies, infrastructures, legal regimes, and macro-events** as *inputs to mechanics* (e.g., "border passport regimes change in 1914, which alters the travel graph");
- describe **procedural / systemic** sources of drama (e.g., "faction pressure generates emergent betrayal opportunities") as long as it is the *system* being proposed, not authored content;
- describe information presented to the player in abstract terms (e.g., "the player sees a ledger", "a timetable") where needed to explain a mechanic.

The Secretary and Rapporteur will **flag and exclude** any proposal that violates this prohibition.

---

## 2. Touchstones, explained mechanically (so nobody needs to research them)

- **Reilly, Ace of Spies** — The model career of the protagonist is a *freelance / semi-official agent* over ~25 years (c. 1901–1925) who mixes **commerce** (arms deals, concession brokering, commissions), **espionage** (document theft, infiltration, double-dealing with multiple services), **politics** (coups, counter-revolution), and a **private life** (multiple identities, households in several cities, debts, affairs, gambling) — until the past catches up with him. Mechanically: *a life sim in which the spy career, business career and personal life are one interlocking resource system*, and in which the protagonist ultimately gets hunted down.
- **Bradshaw's Guide** — Monthly railway & steamship timetable books (Bradshaw's Continental Railway Guide, 1847–1939). Mechanically: *real, dense, time-stamped network of departures, connections, fares and classes*; travel is a planning problem under a schedule, not teleportation.
- **80 Days (inkle, 2014)** — Route-planning travel game under a hard global clock (80 days). Mechanically: routes are *discovered* (via conversation, purchased guides, rumours), each leg has departure time, duration and cost; a *trade system* (buy items cheap in one city, sell high in another, with luggage limits) funds travel; the companion's health is a resource; the world has events that occur whether or not you are there; "one more leg" compulsion.
- **Scotland Yard (board game, 1983)** — Hidden-movement pursuit. A fugitive moves secretly across a transport network; pursuers see only *which transport type* was used each turn and get *periodic reveals*; they deduce and cordon. Mechanically: *asymmetric information*, *trace evidence* left by mode of movement, *deduction by the hunter*, *reveal cadence*, *cordon formation*.

---

## 3. Historical grounding kit (1895–1925)

Use these as mechanical raw material. Accuracy matters; the Period Historian will audit.

**Travel infrastructure.** Dense European rail; through-trains (Orient Express, Paris–Constantinople; Nord-Express); Trans-Siberian (through service c. 1904–05, Amur line 1916: Moscow–Vladivostok ~2 weeks); Berlin–Baghdad railway (begun 1903, incomplete by 1918); ocean liners (Atlantic crossing ~5–6 days by 1907; London–Bombay via Suez ~2–3 weeks); coastal and river steamers; horse-cabs → motor taxis (c. 1905–10); passenger Zeppelins (DELAG, 1910–14); aeroplanes (1903; Channel 1909; first scheduled airlines 1914 and 1919 London–Paris). Classes of travel (1st/2nd/3rd), sleeping cars (Wagons-Lits), customs stops, gauge breaks (Russian broad gauge → bogie change / transfer at the frontier), seasonal ice closures, strikes, wartime requisition.

**Communication.** Telegraph cables (global; the British "All Red Line" completed 1902; telegraph companies kept copies of cables → interceptable); wireless telegraphy (Marconi 1896–1901 transatlantic); telephone (urban/national; no transatlantic telephony until 1927); post (several deliveries a day in big cities; pneumatic post in Paris/Berlin/Vienna); newspapers with multiple daily editions; news agencies (Reuters, Havas, Wolff); poste restante; cable addresses; commercial code books to shorten telegrams.

**Identity, borders, surveillance.** Before 1914 most of Western/Central Europe was passport-free; Russia and the Ottoman Empire required passports/visas; WWI introduced universal passport controls, exit permits and visas (standardised at the 1920 League of Nations conference). Hotel police registration (Germany, Austria, Russia, France); residence permits; letters of introduction and visiting cards; Bertillonage (1880s), fingerprinting at Scotland Yard (1901); photography; wanted notices in press; mail "perlustration" (Okhrana "black cabinets"); informant networks; physical shadowing; Special Branch (UK, 1883); Secret Service Bureau (UK, 1909 → MI5/MI6); Deuxième Bureau (France); Evidenzbureau (Austria-Hungary); Abteilung IIIb (Germany); Okhrana incl. its Paris bureau (Russia, to 1917); Cheka (1917–22) → GPU; Pinkerton / Bureau of Investigation (US, 1908); Room 40 (UK naval codebreaking, 1914); censorship offices in wartime.

**Money & business.** Classical gold standard with fixed parities until 1914 (e.g., £1 ≈ 25.2 French francs ≈ 20.4 marks ≈ 9.5 roubles ≈ $4.87); letters of credit, circular notes (Thomas Cook), bills of exchange, bank drafts, gold coin; wartime inflation and exchange controls; German hyperinflation (1922–23); rouble collapse and expropriation (1917+). Businesses of the age: arms (Vickers, Krupp, Schneider, Škoda) and their commission agents; oil (Baku, Persia 1908); railway, mining and timber concessions (Manchuria, Korea, Persia, Ottoman lands); shipping and insurance (Lloyd's); rubber; stock exchanges and bourses; newspapers; patents (wireless, aviation, motor); gold rushes (Klondike 1896–99); colonial trading houses; smuggling.

**Cryptography & tradecraft.** Codebooks and nomenclators; commercial codes; Playfair, Vigenère and transposition ciphers; book ciphers; ADFGVX (1918); one-time pad (1917–19); invisible inks and chemical developers; typewriter typeface identification; dead drops; cut-outs; cover addresses; "legends" (cover biographies); forged papers; disguise as a practical, not theatrical, art; concealment compartments in luggage; cameras (Kodak Brownie 1900; Vest Pocket Kodak 1912); blueprints and naval plans as the age's prize documents; the Zimmermann telegram (1917) as the archetypal intercepted cable.

**World clock (macro-events the world will run through regardless of the player).** Dreyfus affair (1894–1906) · Fashoda (1898) · Spanish–American War (1898) · Boer War (1899–1902) · Boxer Rebellion (1900) · Russo-Japanese War (1904–05) · Russian Revolution of 1905 · Moroccan crises (1905–06, 1911) · Anglo-Russian Convention (1907) · Young Turk Revolution (1908) · Bosnian Crisis (1908–09) · Mexican Revolution (1910–20) · Italo-Turkish War (1911–12) · Balkan Wars (1912–13) · First World War (1914–18) · Easter Rising (1916) · Russian Revolutions (1917) · Russian Civil War (1917–22) · Influenza pandemic (1918–20) · Paris Peace Conference (1919) · Irish War of Independence (1919–21) · Greco-Turkish War (1919–22) · German hyperinflation (1923) · Locarno (1925).

---

## 4. What counts as a proposal

A proposal is a **pitch of a game concept or a game-defining system**, written so that a reader understands *what the player does, why it is deep, and why they will not want to stop*. Every proposal must plausibly honour **all five directives** (a system-level pitch must say how it sits inside a spy life-sim with travel, deception, items, economy, politics, time pressure, and the hunt).

Judge "captivating and addictive" in the sense of **deep, sustained engagement**: meaningful agency, legible-but-deep systems, tension/relief cycles, mastery curves, consequence that persists, "one more turn/leg/day" structure, emergent stories *generated by systems* (not authored), and replayability. Be specific about the psychological mechanism; do not just assert "it will be fun".

### Required format (Round 1A)

File: `committee/round-1A-proposals/P<NN>-<role-slug>.md`. IDs are `P<NN>.<k>` (panelist number, proposal number), e.g. `P04.07`.

```
# Round 1A Proposals — <Role title> (Panelist P<NN>)

## Panelist statement
<2–4 sentences: your lens, what you think the game must get right.>

## P<NN>.01 — <Title>
- **Type:** whole-game concept | game-defining system
- **Central mechanical hook:** <one or two sentences — the one thing that is new>
- **How it plays (core loop):** <what the player does minute-to-minute and session-to-session>
- **Directive coverage:** <how travel, deception/conversation/coding, items/artifacts, economy/business, politics/warfare, time pressure & the hunt each show up; which are primary>
- **Historical grounding:** <which period realities the mechanic is built from>
- **Why captivating & addictive:** <specific psychological mechanisms>
- **Engine implications:** <what the dynamic events/decisions/actions/dependencies engine must support for this; scalability notes>
- **Risks / open questions:** <honest>

## P<NN>.02 — ...
```

- **At least 10 proposals** per panelist (10–12 is ideal). 150–300 words each.
- Aim for **breadth**: include some whole-game concepts and some game-defining systems; vary the scale of ambition; at least two should be ideas you consider *risky but potentially brilliant*.
- Write from your role's lens, but every proposal must be a *game* idea, not a lecture.
- Do **not** coordinate with other panelists in Round 1A; convergent ideas will be merged in Round 1B and convergence counts as support.

---

## 5. The committee

Ten voting panelists (independent agents, each with a distinct role and lens). The **Secretary** (the orchestrating agent) runs the process, keeps the record and performs mechanical tallies; a non-voting **Rapporteur** agent drafts the synthesis in Round 1B strictly from the panel's own nominations and merge proposals. Neither facilitation role proposes ideas or votes.

| # | Role | Lens |
|---|------|------|
| P01 | Core Loop & Systems Designer | How all systems interlock into one compulsive loop; pacing; feedback; the "verbs" of play |
| P02 | Simulation Engine Architect | Directive 5: event/decision/action/dependency engine; world simulation at scale; data-driven content; determinism, save/replay, performance |
| P03 | Period Historian (1895–1925) | Historical accuracy as *mechanical* truth: timetables, borders, money, communications, institutions; what the period uniquely affords |
| P04 | Travel & Logistics Designer | Bradshaw's/80 Days: network, schedules, fares, classes, luggage, delays, routes-as-knowledge |
| P05 | Deception, Conversation & Cryptography Designer | Cover identities, social engineering, interrogation, codes/ciphers, document forgery, information as currency |
| P06 | Economy, Business & Artifacts Designer | Money, trade, commissions, concessions, markets, debt, items/artifacts with provenance and use |
| P07 | Politics & Warfare Designer | Factions, intelligence services, diplomacy, crises, war as a scheduled-but-perturbable world process; influence mechanics |
| P08 | Pursuit & Hidden-Information Designer | The hunt: hunter AI, trace evidence, deduction, cordons, reveals, counter-surveillance; asymmetric information design |
| P09 | Player Psychology & Retention Designer | Why players stay: tension/relief, loss aversion, mastery, meaningful choice, session structure, "one more turn" |
| P10 | Life-Sim & Character Progression Designer | The spy as a *life*: ageing, health, reputation, households, debts, relationships-as-systems, skills, legends, retirement/ruin |

---

## 6. Process & rules of order

**Round 1A — Fan-out.** Each panelist independently submits ≥10 proposals (format above). Secretary records receipt and compiles all proposals into `committee/round-1B-synthesis/ALL_PROPOSALS.md`.

**Round 1B — Deliberation & synthesis to 20 candidates.**
- *1B-1 Review & nominate.* Each panelist reads all proposals and files a review: **10 nominations** (max **3** of their own, by ID, one-line rationale each); up to **5 merge proposals** (2–4 IDs → working title + one-paragraph merged concept); up to **5 flags** (directive violations, historical errors, infeasibility — with reason). Role-lens notes welcome (Historian audits accuracy; Engine Architect audits feasibility).
- *1B-2 Rapporteur synthesis.* The Rapporteur drafts **20 candidates** by procedure: (a) tally nominations per proposal; (b) build merge clusters from overlapping merge proposals; a cluster's support = number of *distinct panelists* nominating any member; (c) rank by support, resolving ties toward broader directive coverage and panel diversity of support; (d) exclude flagged violators unless the flag is clearly wrong (explain); (e) write each candidate as a unified pitch with provenance IDs. Publish `committee/round-1B-synthesis/DRAFT_CANDIDATES.md` with the full tally.
- *1B-3 Ratification.* Each panelist replies **RATIFY** or **AMEND** (≤3 specific amendments: swap-in/swap-out, split, merge, rename, clarify). An amendment carries if proposed/seconded by **≥2 panelists** or if it corrects a directive violation or a factual error; the Rapporteur applies carried amendments, notes the rest, and publishes `CANDIDATES_FINAL.md` (exactly 20).

**Round 1C — Final vote & pitches.**
- Each panelist files a secret ballot: a **complete ranking 1–20**, a **score 0–10** for each candidate, a one-line justification per candidate, and a ≤150-word "champion statement" for their #1.
- **Tally (fixed in advance):** primary = **Borda count** (rank r earns 21 − r points; max 200); secondary = **mean score**; tiebreak = number of first-place ranks, then Rapporteur coin-toss recorded in the log. Panelists are not told others' ballots before voting.
- The **top 5** become *finalists* and are written up as full detailed pitches (template issued at that time) by the panel; ranks 6–20 are presented with their candidate text and tallies. The Secretary renders everything into the HTML pitch document and records all events in `committee/DECISION_LOG.md`.

**Conduct.** Argue from mechanics and from the five directives. Cite IDs. Be concrete. Disagree openly in writing; the record is public. No proposal is anyone's property after Round 1A: merging and rewriting is expected.
