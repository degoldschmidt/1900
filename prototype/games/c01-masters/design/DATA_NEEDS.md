# C01 Several Masters, One Truth — data needs

What the game needs from transcribed history, so that source discovery knows what to look for. Every value below is "to be transcribed and cited"; dates are orientation only, "(to verify)". Anything not found falls back to a design value (`DV-C01-NNN`, see `RULES.md` section 6) that is labelled design and listed on the About screen, never presented as history. Window: October 1912 – September 1914. No Russian data is needed, so no Julian dates.

---

## 1. Timetable

### Corridors

Node-only transcription (plan scope choice 1): times at the game's cities, junctions where a change is printed, and frontier stations; train headers and footnotes.

| Segment | Plan tier | C01 use | Priority |
|---|---|---|---|
| London–Dover–Calais–Paris | A | London↔Paris, the core triangle | must |
| London–Dover–Ostend–Brussels | A | London↔Brussels | must |
| Paris–Brussels | A | Paris↔Brussels | must |
| Brussels–Cologne | A | to Berlin from Brussels, Paris, London | must |
| Cologne–Hanover–Berlin | A | as above | must |
| London–Harwich–Hook of Holland–Rotterdam | A | London↔Rotterdam | must |
| Rotterdam–Bentheim–Berlin | A | Rotterdam↔Berlin | must |
| Berlin–Vienna | A | acquisition trips | must |
| Paris–Vienna | A | acquisition trips | must |
| Brussels–Antwerp–Roosendaal–Rotterdam | not in plan list | the house's city to the shipping topic; request adding it | should |
| Harwich–Antwerp; London–Flushing–Berlin | B | alternatives | could |

### Stations per city (to verify which trains use which)

| City | Main stations to transcribe (e.g., to verify) |
|---|---|
| London | Charing Cross and Victoria (Channel boat trains), Liverpool Street (Harwich) |
| Paris | Nord (Calais, Brussels), Est (Strasbourg route to Vienna) |
| Brussels | Nord, Midi, Quartier-Léopold |
| Berlin | Friedrichstrasse, Zoologischer Garten, Anhalter Bahnhof, Potsdamer and Schlesischer as printed |
| Vienna | Westbahnhof (from Munich and Paris); the terminus for Berlin trains (via Prague or Oderberg) |
| Rotterdam | Maas, Delftsche Poort, Beurs as printed |
| Junctions | Dover pier, Calais Maritime, Ostend Quay, Harwich (Parkeston Quay), Hook of Holland, Cologne, Hanover, and the change points the guides print on Paris–Vienna and Berlin–Vienna |

Intra-city transfers (station to station in Paris, Brussels, Berlin, Vienna, Rotterdam): cited walking or cab times where a guide gives them; otherwise design transfer rows.

### Frontier stations and dwell

Needed for crossings (`RULES.md` 5.2): the station pair, whether the stop is flagged customs or passport, and the printed dwell (arrival and departure). Candidates (e.g., to verify): Dover/Calais and Dover/Ostend (sea), Harwich/Hook of Holland (sea), Feignies–Quévy or Jeumont–Erquelines (Paris–Brussels), Welkenraedt–Herbesthal (Brussels–Cologne), Oldenzaal–Bentheim (Rotterdam–Berlin), Igney-Avricourt–Deutsch-Avricourt and a Bavarian–Austrian station (Paris–Vienna), Bodenbach or Oderberg (Berlin–Vienna). Footnotes on where luggage is examined (in the train, at the frontier, at destination) are needed to set the stop flags.

### Editions

| Edition | Why | Priority |
|---|---|---|
| Winter 1912–13 | S1 and S2 start in October 1912 | must (S1, S2) |
| Summer 1913 | About May–October 1913 (to verify): the Treaty of London to Bucharest period | must (S1, S2) |
| Winter 1913–14 | Otherwise summer 1913 is held forward for months (flagged gap) | should |
| March/April 1914 (shared with C07) | S3 prologue start | must (S3) |
| June/July 1914 anchor | July crisis; S3 hand-over | must |
| August–September 1914 status | Which services ran on the C01 corridors after mobilisation; London–Paris and London–Rotterdam continuation | must as suspension rows; should as tables |

### Classes, sleepers, fares, through carriages

- **Classes:** first and second on every train; third where the guide prints it (boat trains to verify).
- **Sleepers:** night trains on Paris–Vienna, Berlin–Vienna and Ostend/Brussels–Berlin, and berth supplements on night boats (e.g. Harwich–Hook, to verify). The supplement is needed, not only the existence of the car.
- **Fares (per edition):** single fares, first and second class (third where printed), as through fares where the guide gives them: London–Paris, London–Brussels, London–Rotterdam, London–Berlin (both routes), Paris–Brussels, Paris–Berlin, Paris–Vienna, Brussels–Berlin, Brussels–Rotterdam, Rotterdam–Berlin, Berlin–Vienna. Otherwise per-segment fares, plus sleeper and boat supplements, in the printed currency. Without a fare row an itinerary is not offered.
- **Through carriages:** through links where printed (e.g. Channel boat trains, through cars Ostend–Berlin or Paris–Vienna, to verify), so a carriage that runs through is not counted as a change.
- **Minimum change times:** printed connection notes; otherwise design (DV-C01-008).

---

## 2. Parameters

Key kinds follow `ParamRow.keyKind`; `city` and `topic` keys need kit gap K4 (fallback `global`). Tier 0 marks rows that are effects of a world-calendar event.

| Param | Key kind | Keys | Dates | Value shape | Priority | Candidate sources | Tier |
|---|---|---|---|---|---|---|---|
| `coop.edge` | pair | `GB_SSB_FS>FR_DB2`, `FR_DB2>GB_SSB_FS` (pre-war partial; wartime fusion); `GB_POLICE>GB_SSB_FS`; `GB_PORT>GB_SSB_FS`; `FR_PP>FR_DB2`; `FR_FRONTIER>FR_DB2` | Oct 1912–Sep 1914 | `{lagSec:[min,max], retro, fidelityPm}` | must | Opening dates: declarations of war (calendar) or a dated liaison arrangement in an official history (secondary, flagged); lags and fidelity are design (DV-C01-084–086) | 1 (wartime rows 0) |
| `records.lag` | global (`kind@source`) | `registration.slip@<police>`, `frontier.pass@<police>` | — | `{minSec, maxSec}` | should | Police regulations giving the time limit for reporting arrivals (statute, ordinance, Baedeker "Practical information"); else design | 1 |
| `value.segment` | topic | five topics | rows starting on events E1–E7 | `{pm}` | must | Dates from the calendar rows (cited); values design (DV-C01-091) | 0 |
| `budget.vote` | institution | `GB_SSB_FS`; `FR_DB2` | GB financial years 1912–13 to 1914–15; FR budget years 1912–1914 | `{amountMinor, currency, fy, scope: 'vote' \| 'allocation'}` | must (GB), should (FR) | GB: Parliamentary Papers (Civil Services Estimates and Appropriation Accounts, Secret Service), Hansard on the vote; the Bureau's own allocation only from an official history (secondary, flagged). FR: Journal officiel, lois de finances and the War Ministry budget (secret-expenditure chapter, to verify) | 1 |
| `budget.fyStart` | jurisdiction | GB, FR | — | `{month, day}` | must | Exchequer practice (Whitaker's Almanack, statute); French budget-year rules | 1 |
| `hunt.powers` | pair (`JUR\|national`, `JUR\|alien`) | GB and FR, both classes | Oct 1912–Sep 1914 | `{power: 'none' \| 'watch' \| 'expel' \| 'arrest', statute}` | must (GB wartime), should (FR), could (pre-war) | Public General Acts 1914 (Aliens Restriction Act; Defence of the Realm Act) with Orders in Council in the London Gazette; pre-war official secrets and aliens statutes (relevance to verify); Journal officiel (state of siege decree, espionage and expulsion law, to verify) | 0 |
| `reg.coverage` | jurisdiction | GB, FR, BE, NL, AT, DE | Oct 1912–Sep 1914 | `{scope: 'none' \| 'all' \| 'aliens', where: 'hotel' \| 'any'}` | should (GB, FR), could (others) | Baedeker police-regulation paragraphs; the 1914 aliens registration order (GB); national police ordinances | 1 (GB wartime row 0) |
| `frontier.papers` | edge (frontier station pair) | every crossing in section 1 | pre-war baseline + July–Sep 1914 changes | `{passport: boolean}` | must | Baedeker "Passports" paragraphs (baseline); decrees and notices in the London Gazette, Journal officiel, and newspapers of record (The Times, Le Temps) | 0 |
| `frontier.entry` | pair (`JUR\|nationality`) | FR, GB, BE, NL, DE, AT × nationalities allowed for legends | from late July 1914 | `{allowed: boolean}` | should | Decrees on enemy aliens and frontier closures; newspapers of record | 0 |
| `rail.suspension` | edge (segment) | all C01 corridors | late July–Sep 1914 | `{suspended: true, scope: 'all' \| 'civilian'}` | must | Railway notices in newspapers of record; guide notices; shared with C07 S2 | 0 |
| `city.lodging` | city | the six cities | 1912–1914 | `{currency, brackets: [{label, minMinor, maxMinor}]}` | must | Baedeker hotel listings (London; Paris; Belgium and Holland; Berlin or Northern Germany; Austria-Hungary; editions nearest the window) | 1 |
| `city.meals` | city | the six cities | 1912–1914 | `{currency, dayMinor}` from printed meal prices | must | Baedeker restaurant paragraphs | 1 |
| `money.parity` | currency (`A>B`) | see section 5 | Oct 1912–Sep 1914 | `{num, den}` | must | Baedeker money tables; Bradshaw's Continental money tables; mint parities | 1 |
| `haven.status` | jurisdiction | NL (and any reachable neutral) | — | `{haven: boolean}` | could | Extradition treaties and their political-offence clauses (treaty series); else DV-C01-120 | 1 |
| `inst.reachable` | institution | `BE_HOUSE` | from the occupation of Brussels | `{reachable: false}` | must | Newspapers of record | 0 |

Design-only rows also stored as parameters (never sought in sources): `audit.cadence`, `verify.lag`, coop lags and fidelity, `value.segment` values.

---

## 3. World calendar (Tier-0)

Gregorian dates, each with a citation (newspaper of record, gazette, treaty text). Windows are orientation only.

| Event | Window (to verify) | Jurisdiction | Rows started or ended |
|---|---|---|---|
| E1 First Balkan War outbreak | early–mid October 1912 | Balkan states, Ottoman Empire | `value.segment` (all topics) |
| E2 Treaty of London | late May 1913 (plan: 30 May) | international | `value.segment` |
| E3 Public compromise of Austro-Hungarian plans (supersession) | late May 1913 | AT | `value.segment` `deploy.AT` → 0 |
| E4 Second Balkan War outbreak | end of June 1913 | Balkan states | `value.segment` |
| E5 Treaty of Bucharest | August 1913 | international | `value.segment` |
| E6 Austro-Hungarian ultimatum to Serbia | late July 1914 | AT | `value.segment` |
| Mobilisations (AT, RU, DE, FR, BE) | late July – early August 1914 | each | `rail.suspension`, `frontier.papers` |
| German passport decree | about the end of July 1914 | DE | `frontier.papers` |
| Declarations of war; invasion of Belgium | early August 1914 | DE, FR, BE, GB, AT | `world.atWar`; `frontier.entry`; wartime `audit.cadence` |
| E7 British declaration of war | early August 1914 | GB | `coop.edge` fusion rows (if no liaison date is cited), `value.segment` |
| French state of siege | early August 1914 | FR | `hunt.powers` FR |
| Aliens Restriction Act | plan: 5 August 1914 | GB | `hunt.powers` GB alien; `reg.coverage` GB aliens |
| Defence of the Realm Act | plan: 8 August 1914 | GB | `hunt.powers` GB national |
| Channel and North Sea crossing rules (passports, permits) | August 1914 | GB, FR, NL | `frontier.papers` |
| Occupation of Brussels | plan: 20 August 1914 | BE | `inst.reachable` `BE_HOUSE`; `rail.suspension` Brussels segments |
| Budget votes in force | 1913, 1914 | GB, FR | `budget.vote` (effective at `budget.fyStart`) |
| Could: Sarajevo assassination; departure of the French government from Paris | end of June 1914; early September 1914 | AT; FR | news only (the Paris master stays by design) |

---

## 4. Institutions

| Id | Function | Jurisdiction, city | Kind | Attributes needed | Basis |
|---|---|---|---|---|---|
| `GB_SSB_FS` | Foreign Section of the Secret Service Bureau | GB, London | intelligence | parent (the Bureau), `from` date, `readsKinds` | historical (existence and dates); game attributes (currency, cadence) design |
| `FR_DB2` | Deuxième Bureau of the army general staff | FR, Paris | intelligence | parent (army staff, War Ministry), `from` | historical |
| `BE_HOUSE` | Representative commission house brokering orders | BE, Brussels | commercial | `dv` id, currency BEF | design (no real firm named) |
| `GB_POLICE` | Body receiving aliens' registrations from August 1914 (which body, to verify) | GB, London | police | `readsKinds: ['registration.slip']`, `from` | historical |
| `GB_PORT` | Port officers at Channel and North Sea ports (to verify) | GB | police | `readsKinds: ['frontier.pass']` | historical (should) |
| `FR_PP` | Préfecture de police | FR, Paris | police | `readsKinds: ['registration.slip']` | historical |
| `FR_FRONTIER` | Railway and frontier police (to verify) | FR | police | `readsKinds: ['frontier.pass']` | historical (should) |
| `BE_POLICE`, `NL_POLICE`, `AT_POLDIR`, `DE_POLPRAES` | Brussels, Rotterdam, Vienna and Berlin police | as named | police | sources only; no reader in the MVP | historical (could) |

---

## 5. Money

- **Currencies:** GBP (farthings), FRF and BEF (centimes), DEM (pfennig), AUK (heller), NLG (cents).
- **Parities needed:** GBP>FRF, GBP>BEF, GBP>DEM, GBP>AUK, GBP>NLG, FRF>BEF, and the inverse rows or exact rationals for each. Gold parities for the pre-war window; any cited August 1914 change (e.g., moratoria, to verify) is a "could", since banks are out of scope.

| Price | Where | Source types | Priority |
|---|---|---|---|
| Lodging per night by bracket | six cities | Baedeker hotel listings | must |
| Meals per day (déjeuner, dinner or table d'hôte) | six cities | Baedeker restaurant paragraphs | must |
| Sleeper and boat supplements | night trains, night boats | Bradshaw's Continental, Cook's Continental, Livret-Chaix | must |
| Cab or porterage, station to hotel | six cities | Baedeker arrival paragraphs | could (MVP uses none) |
| Telegrams | — | not needed (no cables in the MVP) | — |
| Bribes, copying, retainers, report prices | — | design (DV-C01-028, 041–044); never sought as history | — |

---

## 6. Coverage priority

**Minimum for a playable S1:**
1. The nine tier-A corridors of section 1 in the winter 1912–13, summer 1913, March/April 1914 and June/July 1914 editions, with first and second class fares and sleeper supplements.
2. Calendar rows E1–E7 and the August 1914 sequence (mobilisations, declarations, the two British Acts, French state of siege, occupation of Brussels).
3. `rail.suspension` and `frontier.papers` rows for July–September 1914 on the C01 corridors.
4. `money.parity`; `city.lodging` and `city.meals` for the six cities.
5. `hunt.powers` for GB; `budget.vote` and `budget.fyStart` for GB.

**Earliest playable:** S3 needs only the 1914 editions and the July–September 1914 calendar, so P01 can start on the frozen 1914 data while 1912–13 is finished.

**Fallbacks** (each labelled design and listed on About):

| Missing source | Fallback | Consequence |
|---|---|---|
| Winter 1913–14 edition | Summer 1913 held forward (plan scope choice 3), gap flagged | Possibly stale times in that winter |
| Brussels–Rotterdam segment | None; players route through other segments | Longer trips |
| August–September 1914 tables | Segments close at the cited suspension date; source gap shown | Travel ends where sources end |
| `budget.vote` FR | DV-C01-104 base, flagged | Budget loop still works |
| `hunt.powers` FR, or any pre-war row | DV-C01-116: `watch` only | A flip stops pay without arrest |
| `reg.coverage` | No registration records | Hunters observe less |
| `city.lodging` / `city.meals` | DV-C01-013 | Flagged per city |
| Fusion opening date | Design-dated at the cited British declaration of war (date basis design) | Stated on About |
| `frontier.entry` | DV-C01-016: entry barred between jurisdictions at war by cited declarations | Conservative |
| `haven.status` | DV-C01-120: no retirement ending | Owner may choose a flagged design haven |

**Never a fallback:** timetable times, fares, calendar dates and statute dates. If one is missing, the feature that needs it is withheld or travel ends; it is never designed.
