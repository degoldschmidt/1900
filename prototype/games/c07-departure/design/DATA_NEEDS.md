# C07 The Departure Is the Turn — data needs (1914)

This file tells source discovery what to find for C07, and what `games/c07-departure/data-manifest.json` must name. Every date or value below is an orientation "(to verify)", never data. Rows that may fall back to a design value say so, and such a fallback is always a `DV-C07-NNN` row with `basis = design` (see `RULES.md` §6). Segment ids are proposals for `segments.csv`.

**Tiers as used here:**
- **0** — a row started or ended by a dated world event (Tier-0 calendar);
- **1** — a standing rule or regular arrangement (regimes, hours, tariffs, parities, prices);
- **2** — operational values whose source is usually missing (lags, cooperation edges, fees), where a design fallback is allowed.

## 1. Timetable

### 1.1 Segments

| Proposed id | Corridor (plan tier) | Needed by | Priority |
|---|---|---|---|
| `PAR-BRU` | Paris–Brussels, via the FR/BE frontier pair the expresses used (to verify) (A) | S1 chain | must |
| `BRU-COL` | Brussels–Cologne, via the BE/DE frontier pair (to verify) (A) | S1 chain; S2 westward escape | must |
| `COL-BER` | Cologne–Hanover–Berlin (A) | S1 chain; S2 | must |
| `BER-PET` | Berlin–Eydtkuhnen/Wirballen–St Petersburg (A) | S2 | must |
| `LON-PAR`, `LON-BRU` | London–Dover–Calais–Paris; London–Dover–Ostend–Brussels (A) | London is in scope; S1/S2 alternatives | should |
| `BER-WAR-PET` | Berlin–Alexandrowo–Warsaw–Petersburg (B) | Warsaw in scope; S2 fallback route (T5b) | should |
| `STT-PET` | Stettin or Lübeck–Petersburg steamer (B) | S2 fallback; a train unknown to the hunter (T6) | could |
| `BER-VIE`, `PAR-VIE` | Berlin–Vienna; Paris–Vienna (A) | Vienna only "if cheap" | could |

Node-only transcription: copy times only at game cities and frontier stations. Hanover is copied only where a train changes or terminates there.

### 1.2 Stations per city

Station names and which station served which trains are to be transcribed from the guides and checked by the historian.

| City | Stations needed (to verify) | Notes |
|---|---|---|
| London | the Continental departure stations for Dover (two candidates) | cross-city `transfers` if both are used |
| Paris | Nord (Brussels, Cologne, Calais); Est only if `PAR-VIE` | — |
| Brussels | the stations used by Paris, Ostend and Cologne trains (Midi/Nord/Quartier-Léopold, to verify) | cross-city transfers are likely |
| Cologne | main station | — |
| Berlin | each station the corridors use (Friedrichstraße, Zoologischer Garten, Charlottenburg, Schlesischer Bahnhof, Potsdamer/Anhalter for Vienna; to verify) | cross-city transfers between them |
| Warsaw | the station of the line from Alexandrowo and the station of the Petersburg line (to verify) | the cross-city transfer is a design-fallback candidate |
| St Petersburg | the terminus of the Wirballen/Warsaw line (to verify) | — |

**Frontier stations** (both members of each pair, `is_frontier`, `frontier_pair_id`):
- FR/BE on `PAR-BRU`;
- BE/DE on `BRU-COL` (Herbesthal/Welkenraedt, to verify);
- Eydtkuhnen/Wirballen;
- Alexandrowo/Alexandrovo;
- the Dover, Calais and Ostend piers (kind `pier`).

### 1.3 Editions

Each segment needs one rank-1 truth edition per date in `segment_sources.csv`.

| Edition | Why | Priority |
|---|---|---|
| E1 — the last issue before the 1914 spring changeover (March/April 1914) | S1 player's initial guide; S1 truth before the changeover | must |
| E2 — the first issue after the changeover (May 1914) | S1 truth after the changeover; the guide on sale in S1; the cross-edition diff (V06) that produces ghosts | must (see the fallback below) |
| E3 — June/July 1914 (plan anchor) | S2 truth and the S2 player guide; the hunter's graph | must |
| E4 — any late-July 1914 issue, or official notices of timetable changes in the last week | S2 accuracy | could |
| National guides (Reichs-Kursbuch, the Russian official guide) | cross-check only; frontier dwell and gauge-change minutes where the continental guide is silent | should |

- **E2 fallback:** if E2 is missing, E3 may be truth from the changeover date only if its preliminary pages print that date (RULES open question 1).
- **Required S1 outcome:** V06 must list at least one train on `PAR-BRU`, `BRU-COL` or `COL-BER` that is withdrawn, retimed or on changed running days between E1 and E2. If none exists, S1 tests nothing and its dates move.

### 1.4 What to copy per train

- train key, number, name, operator, mode;
- classes (1/2/3) and sleeper flag;
- running marks and the footnotes behind them (the running days of the de luxe trains, to verify);
- times at every node station, with `customs`, `passport` and `gauge` stop flags from the footnotes or symbols;
- through-carriage notes (`through_links.csv`), e.g. Paris→Berlin or Ostend→Berlin carriages (to verify);
- minimum-change or connection notes where printed (`min_change.csv`, `transfers.csv`).

### 1.5 Fares (`fares.csv`, per edition)

- single fares in classes 1, 2 and 3 for every node pair a planner itinerary can contain on the must segments, both directions, including through fares where printed (e.g. Paris–Berlin, Berlin–Petersburg);
- sleeper supplements per train or route;
- boat fares on the Channel routes (should);
- fare validity days, where printed (could replace DV-C07-016).

Fallback: DV-C07-017, a per-hour design fare, flagged "design fare" on screen. Never written into `fares.csv`.

### 1.6 Frontier dwell and formalities

- arrival and departure times at both stations of each frontier pair, as printed;
- the gauge-change transfer minutes at Eydtkuhnen/Wirballen and Alexandrowo where printed (fallback DV-C07-022);
- whether customs and passport examination happen on the train or in a hall, and on which side (from the guide's footnotes and the Baedeker introductions); this sets the stop flags and `frontier.papers.inspector`.

### 1.7 Zones (`zones.csv`, `station_zones.csv`)

The railway time and civil time of FR, BE, DE, RU and GB for 1914, with exact second offsets (Petersburg time, to verify), and which railway clock each frontier station kept on each side.

## 2. Parameters (`params.csv`)

| Param | Key kind | Keys | Dates | Value shape | Prio | Candidate sources | Tier |
|---|---|---|---|---|---|---|---|
| `registration.regime` | jurisdiction | FR, BE, Prussia, RU, GB (+ AT if Vienna) | Apr–Aug 1914 | `{hotelSlip: bool, toPolice: bool, deadlineSec: int\|null, appliesTo: 'all'\|'aliens'}` | must | Baedeker 1914 introductions ("Passports", "Police regulations"); police ordinances; for GB the Aliens Restriction Act text | 1 (GB change: 0) |
| `records.lag` | institution | `registration.slip@<authority>` for Berlin, Cologne and the Prussian frontier towns; `frontier.passport@<post>` | window | `{minSec, maxSec}` | must | ordinance deadlines ("within n hours", to verify) | 2, fallback design |
| `coop.edge` | pair | `<registration authority or frontier post>><hunting service>` | window | `{lagSec: [min, max], retro: false}` | must | police-history literature, reporting ordinances | 2, fallback DV-C07-029 |
| `frontier.papers` | edge | each frontier pair, both directions | 1914, plus the German passport decree and Russian closures | `{passport, visa, recordsName: bool, inspector: instId, byNationality?: {…}}` | must | Baedeker Russia 1914 and Northern Germany 1913 introductions; Bradshaw's Continental "Passports" page; Reichsgesetzblatt (decree text) | 1; decree rows 0 |
| `service.suspension` | edge or global | per segment or railway administration (DE, RU, BE) | late July–5 Aug 1914 | `{scope: 'all'\|'segments'\|'trainKeys', ids: [], admin}` | must (S2) | official notices in newspapers of record (Le Temps; a Berlin daily, to verify); railway gazettes | 0 |
| `bank.hours` | institution | the correspondent bank in each scope city | 1914 | `{days: [[weekdayMask, openSec, closeSec]]}` (local) | must | Baedeker city sections ("Bankers", "Money"); banking almanacs | 1 |
| `bank.closed` | jurisdiction | FR, BE, Prussia, RU (Julian feasts), GB | S1 and S2 windows | `{reason}` (one-day rows) | should | Baedeker holiday notes; almanacs | 1 |
| `bank.moratorium`, `bill.moratorium` | jurisdiction | DE, RU, FR, BE, GB | late July–Aug 1914 | `{closed: bool}`, `{deferDays: int}` | should | official gazettes; newspapers of record | 0 |
| `post.hours` | institution | the main post office (poste restante) per city | 1914 | as `bank.hours` | must | Baedeker "Post and Telegraph Offices" | 1 |
| `post.restanteFee` | jurisdiction | as above | 1914 | `{minor, cur}` | could | Baedeker; postal guides | 1 |
| `telegraph.hours` | institution | the central telegraph office per city | 1914 | as `bank.hours` (24 h where so) | must | Baedeker | 1 |
| `telegraph.tariff` | pair | jurisdiction pairs among FR, BE, DE, RU, GB, including inland | 1914 | `{perWordMinor, cur, minWords}` | must | Baedeker telegraph paragraphs; Bradshaw preliminary pages; official tariff tables | 1 |
| `telegraph.private.suspended` | pair | outgoing DE, RU, FR, BE, GB | late July–Aug 1914 | `{suspended: true, except?: []}` | should | gazettes; newspapers | 0 |
| `fx.parity` | currency | GBP>FRF, GBP>BEF, GBP>DEM, GBP>RUB (+ AUK) | 1914 | `{num, den}` (minor units) | must | Baedeker money tables; Bradshaw's Continental money table; mint-par statutes | 1 |
| `lodging.price` | city (kit gap K4) | scope city × modest/middle/first | 1914 | `{minMinor, maxMinor, cur}` per room-night | must | Baedeker hotel entries (room-price ranges) | 1; the point used is DV-C07-059 |
| `porter.tip` | jurisdiction | FR, BE, DE, RU, GB | 1914 | `{minor, cur}` | should | Baedeker "Porters"; railway porterage tariffs | 1, fallback design |
| `guide.price` | global (edition id) | E1–E3 | per edition | `{minor, cur}` | should | the guide's cover or title page | 1, fallback design |
| `police.officeHours` | institution | the hunting service, local police, frontier posts | 1914 | as `bank.hours` | could | police almanacs; Baedeker | 1, fallback DV-C07-060 |
| `c07.delay` | global (category) | express, ordinary, boat; crisis rows | design windows | `{edges: [s…], w: [‰…]}` | must | design only (DV-C07-018…021) | 2 |

`institutions.office_hours_param` points banks, posts, telegraph offices and police at their hours rows.

## 3. World calendar (Tier 0)

All dates below are "(to verify)". Each row needs Gregorian and, for Russian events, Julian dates; a local time where known; a citation; and its effect row ids.

| Event | Window (orientation) | Jurisdiction | Param rows started or ended |
|---|---|---|---|
| Spring timetable changeover on the S1 corridor | around 1 May 1914 | FR, BE, DE | none (editions carry it); an optional news row |
| Public or bank holidays in the S1 window | late Apr–early May 1914 | FR, BE, DE | `bank.closed` |
| Austro-Hungarian ultimatum to Serbia, and its expiry | 23–25 July 1914 (published in the first S2 edition) | AT-HU | news only |
| Austro-Hungarian declaration of war on Serbia | about 28 July | AT-HU | `c07.delay` crisis rows begin (design date basis) |
| Russian partial, then general mobilisation | about 29–31 July | RU | `service.suspension` (RU lines), `telegraph.private.suspended` (RU) if cited |
| German "state of imminent danger of war" | about 31 July | DE | `frontier.papers` changes if cited |
| German passport decree | about 31 July – 1 August | DE | `frontier.papers` (`passport: true`, `recordsName: true`) on DE frontier edges |
| German mobilisation and declaration of war on Russia | about 1 August | DE, RU | `service.suspension` (DE civilian services as cited), frontier closure at Eydtkuhnen/Alexandrowo |
| French mobilisation; Belgian mobilisation | about 31 July – 1 August | FR, BE | `service.suspension` (BE/FR lines, should) |
| German declaration of war on France; ultimatum to and entry into Belgium | about 2–4 August | DE, FR, BE | `service.suspension` on `BRU-COL` |
| British declaration of war | about 4 August | GB | news |
| Bank closures and moratoria | about 31 July – 6 August | GB, FR, DE, RU, BE | `bank.closed`, `bank.moratorium`, `bill.moratorium` |
| Aliens Restriction Act in force | about 5 August | GB | `registration.regime` (GB, aliens) — could |

## 4. Institutions (`institutions.csv`)

The `name_as_period` of every row is to be transcribed. Where a source names no specific body, a design choice is labelled with its `dv`.

| Function | Jurisdiction / city | Attributes needed |
|---|---|---|
| Hunting service (the political department of the Berlin police presidium, to verify) | Prussia / Berlin | kind `police`; `reads_kinds` registration.slip, frontier.passport, hotel.complaint; `office_hours_param`; validity |
| Registration authorities | Berlin, Cologne, the Prussian frontier towns; Paris, Brussels, Warsaw, St Petersburg | kind `registry` or `police`; parent; the source of `registration.slip` and `hotel.complaint` |
| Frontier passport posts (both sides) | each frontier pair | kind `police`; the inspector named by `frontier.papers` |
| Customs administrations | FR, BE, DE, RU | kind `other`; source of `frontier.customs` |
| Correspondent banks (one per scope city) | each city | kind `bank`; `office_hours_param` = `bank.hours`; basis historical if a letter-of-credit list survives, else a Baedeker-listed bank chosen by design (`dv`) |
| Main post offices | each city | kind `post`; poste restante; `post.hours` |
| Telegraph offices and administrations | each city / jurisdiction | kind `telegraph`; source of `cable.copy` |
| Railway administrations and the sleeping-car company | per `stations.railway_admin`; international | kind `commercial`; sources of `ticket.sale` and `berth.reservation` |
| A court or notary for bill protests | St Petersburg (Berlin for the synthetic twin) | kind `court` |

## 5. Money

- **Currencies:** GBP (farthings), FRF and BEF (centimes), DEM (pfennig), RUB (kopecks); AUK only with Vienna.
- **Parities:** GBP to each, as exact rationals (`fx.parity`). Sources: guide money tables, mint parities. The crisis exchange disruption of 1914 is out of scope unless cited rows exist (could).

| Price | Use | Source types | Fallback |
|---|---|---|---|
| Fares, sleeper supplements, boat fares | `book`/`Board` | the guides (per edition) | DV-C07-017 (labelled) |
| Lodging room-night ranges per tier | `lodge` | Baedeker hotel entries | none; the city is unplayable for lodging |
| Porterage or porter tip | `askPorter` | Baedeker; porterage tariffs | design (labelled) |
| Telegram tariffs | `cable` | Baedeker; official tariffs | none (must) |
| Guide cover prices | `buyGuide` | the editions themselves | design (labelled) |
| Poste restante fee | `posteRestante` | Baedeker; postal guides | 0 (no fee row) |
| Meals, cabs | not used by MVP rules | — | — |

## 6. Coverage priority

**Minimum for a playable S1:**
1. E1 and E2 (or E3 with a printed changeover date) for `PAR-BRU`, `BRU-COL` and `COL-BER`, both directions, with running rules, stop flags and through links, and a non-empty V06 diff on these segments.
2. Stations, frontier pairs and zones for FR, BE and DE; min change at the stations used.
3. Fares in classes 1–3 for the node pairs on these segments in E1 and E2; sleeper supplements for any night train.
4. `bank.hours`, `post.hours` and `telegraph.hours` for Paris, Brussels, Cologne and Berlin; `telegraph.tariff` among FR, BE, DE and GB.
5. `registration.regime` for FR, BE and Prussia; `frontier.papers` for the FR/BE and BE/DE edges.
6. `fx.parity` for GBP to FRF, BEF and DEM; `lodging.price` for the four cities.
7. Institutions: the hunting service, the Cologne and Berlin registration authorities, correspondents, post and telegraph offices.

**Minimum for S2**, in addition:
- E3 for `BER-PET`, with the Eydtkuhnen/Wirballen dwell and gauge change;
- Petersburg railway time;
- RU `registration.regime` and `frontier.papers`;
- `bank.hours` for Berlin and Petersburg; `telegraph.tariff` DE>RU;
- the RUB parity; lodging in Petersburg;
- the court institution;
- the Tier-0 rows of §3 marked as S2 effects: the passport decree, suspensions and frontier closures, mobilisations and declarations.

**Design fallbacks allowed** (always labelled design and shown on the About screen):

| Need | Fallback |
|---|---|
| `records.lag`, `coop.edge` | DV-C07-029 |
| min change, gauge-change transfer | DV-C07-022 |
| Warsaw cross-city transfer | design `transfers` row |
| `porter.tip`, `guide.price`, police office hours | design values |
| choice of correspondent bank | design |
| price point within a cited lodging range | DV-C07-059 |
| missing fares | DV-C07-017 |
| bill grace, ticket validity after a miss | DV-C07-053, DV-C07-016 |

**No fallback** (must be cited; otherwise the feature is switched off and listed as a source gap):
- train times and running days;
- edition validity and changeover dates;
- Tier-0 dates;
- `frontier.papers`, `registration.regime`, `service.suspension`;
- parities and telegraph tariffs.

A design value never stands in for any of these.
