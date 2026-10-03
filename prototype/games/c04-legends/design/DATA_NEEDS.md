# C04 The Legend Portfolio — data needs

What C04 needs from transcribed history, so discovery and transcription know what to look for. Nothing here is a value: every place name, date window and institution below is orientation "(to verify)" and becomes data only as a cited row. Rule constants are in `RULES.md` §6 (`DV-C04-*`). Where a fallback is allowed it is a design value, labelled design on the row and on the About screen.

Tiers in this file follow `ParamRow.tier`: **0** = a row that starts or ends with a world-calendar event; **1** = a standing institutional fact (coverage, hours, terms, fees, parities); **2** = a local or procedural detail (lags, reach, prices) where a design fallback is tolerable.

## 1. Timetable

**Cities played:** London, Berlin, Rotterdam. Other stations are nodes only (frontier, pier, change points). Node-only rule as in the plan: copy times at these cities, frontier stations, piers and change nodes; skip intermediate halts.

| Corridor / segment | Plan tier | C04 use | Priority |
|---|---|---|---|
| London–Harwich–Hook of Holland–Rotterdam (boat train, night boat) | A | Main hand-over route; S0, S1 | must |
| Hook of Holland / Rotterdam–Oldenzaal–Bentheim–Berlin (incl. through trains from the Hook) | A | Main route to Berlin; German frontier checks | must |
| London–(Queenborough or Folkestone)–Flushing–German frontier–Berlin | B | Second boat route: the connection a service may not know (DV-C04-011, test T2); public worst case | should (must for H04-6) |
| London–Dover–Ostend–Brussels–Cologne–(Hanover)–Berlin | A | Completeness of the public worst case London↔Berlin before August 1914 | should |
| Wartime Britain–Netherlands boats (ports and operators to be found: e.g. Tilbury, Folkestone, Harwich services to Rotterdam or Flushing, to verify) and Dutch lines to the frontier | W | S1 August 1914–March 1915 | must for wartime travel |
| German wartime trains frontier–Berlin | W | S1 wartime | must for wartime travel |

Without wartime sources, travel ends at the last transcribed date and is shown as a source gap; pre-war tables are never carried forward without a citation (plan, G1 sub-gate).

**Stations per city (to verify which are needed by the transcribed trains):**

| City / node | Stations | Notes |
|---|---|---|
| London | boat-train termini for each route (e.g. Liverpool Street; Victoria, Holborn Viaduct or Charing Cross; a Tilbury-boat terminus) | Cross-London transfer rows between them (historical if printed, else shared-register design) |
| British ports | Harwich (Parkeston Quay), Queenborough or Folkestone, Dover, Tilbury as used | Port stations flagged frontier; pier connection times |
| Netherlands | Hook of Holland pier, Flushing pier, Rotterdam stations served (and transfers between them), Oldenzaal and the Flushing route's frontier station | Rotterdam is a played city |
| German frontier | Bentheim; the Flushing route's German frontier station; Herbesthal for the Ostend route | Frontier pair ids on both sides |
| Berlin | Stadtbahn and terminal stations served by these trains (e.g. Charlottenburg, Zoologischer Garten, Friedrichstraße, Schlesischer Bahnhof) | Cross-Berlin transfer rows |
| Change nodes | Cologne (Ostend route), Hanover if a change is printed | Node only |

**Editions needed and why:**

| Edition | Why | Priority |
|---|---|---|
| A winter 1913–14 issue valid from the autumn 1913 changeover | S0 (October 1913) and the S1 prologue and opening months. The plan's list lacks it. If the March/April 1914 issue prints the winter timetable with its validity start, it may serve back to that start (date basis cited); otherwise a separate winter issue is needed for the Hook route, or S0 moves | must |
| March/April 1914 (pre-changeover) | S1 January–April 1914 | must |
| Summer 1914 and the June/July 1914 anchor | S1 May–August 1914, the July crisis | must |
| Wartime issues, August 1914 → March 1915: British Bradshaw (boats, boat trains), German wartime guides (frontier–Berlin), Dutch Officieele Reisgids | S1 wartime travel; the photograph rule window | must (else source gap) |
| Cross-check editions of other families | Not needed: service knowledge is set by operator (DV-C04-011), not by guide family | — |

**Other timetable needs**

| Item | Needed | Priority |
|---|---|---|
| Classes | 1st and 2nd (fares for both legends); 3rd only if a needed train has no other class | must |
| Sleepers and cabins | Which night trains carry sleepers and which boats have cabins (named tickets, DV-C04-044 fallback); supplements | should |
| Fares | Single fares, classes 1–2, for London–Rotterdam, Rotterdam–Berlin, London–Berlin (each route), Hook/Flushing–Berlin; boat, cabin and sleeper supplements; wartime fares if printed. No design fallback: a leg without a cited fare is refused | must |
| Through carriages | Hook–Berlin, Flushing–Berlin, Ostend–Berlin through coaches as printed | must (EA correctness) |
| Pier connections | Boat arrival to train departure at Harwich, Hook, Flushing, Queenborough/Folkestone, Dover, Ostend; any printed minimum or guaranteed connection | must |
| Frontier dwell and controls | Arrival and departure at both stations of each frontier pair; customs and passport marks and their footnotes; wartime control stops | must |
| Running days | Steamer running days and exceptions; wartime "as announced" sailings flagged as unroutable unless dated | must |
| Suspensions | Dated suspensions (mobilisation, sailing stoppages) as `service.suspension` rows | must (wartime) |
| Zones | Railway and civil time for Britain, the Netherlands (Amsterdam time) and Germany, with dates; which zone each frontier and pier station keeps | must |

## 2. Parameters

| Param | Key kind | Keys | Date range | Value (JSON sketch) | Priority | Candidate sources | Tier |
|---|---|---|---|---|---|---|---|
| `reg.coverage` | jurisdiction | DE (Prussia/Berlin), NL, GB | Oct 1913–Mar 1915 | `{residents, hotelGuests, aliensOnly, withinSec, deregister}` | must | Berlin police registration ordinance; Baedeker *Northern Germany* 1913 and *Berlin* "Practical information"; Baedeker *Belgium and Holland*; Aliens Restriction Order 1914 text | 1 (GB change: 0) |
| `records.lag` | jurisdiction / kind@source | slips, Anmeldung, frontier, port, passport, censor | same | `{minSec, maxSec}` | should | Ordinances (registration deadlines); else design (DV-C04-017) | 2 |
| `coop.edge` | pair | `DE.BER.police-reg>svc.DE`, `DE.frontier>svc.DE`, `DE.censor>svc.DE`, `DE.enemyProp>svc.DE`, `GB.ports>svc.GB`, `GB.passport>svc.GB` (retro), `GB.censor>svc.GB`, `NL.ROT.police>svc.DE` and `>svc.GB` (wartime) | from dated events | `{lagSec:[min,max], retro}` | must (relation) | Official histories of the services and Special Branch; published regulations; else design | 2 |
| `control.active` | station | DE frontier stations; British boat ports; (NL frontier, could) | from decree / war | `{source, passport, search}` | must | Reichsgesetzblatt notices; port control orders; *The Times* | 0 |
| `passport.required` | station | same | from decree / war | `{required: true}` | must | Bundesrat decree in the Reichsgesetzblatt; British Foreign Office notices; Dutch Staatscourant | 0 |
| `exit.permitted` | pair | `DE>GB` (jurisdiction>nationality) | Aug 1914– | `{permitted}` | must | Reichsgesetzblatt / Prussian ordinances; newspaper of record | 0 |
| `internment` | jurisdiction | DE | autumn 1914– | `{nationalities, scope}` | must | Official notices; newspaper of record | 0 |
| `enemyProperty` | jurisdiction | DE | autumn 1914– | `{nationalities, accounts, residences}` | must | Reichsgesetzblatt ordinances | 0 |
| `censorship` | jurisdiction | DE, GB | Aug 1914– | `{active}` (sample rate is DV-C04-023) | must | Official notices; newspaper of record | 0 |
| `war.state` | pair | DE>GB, GB>DE (others for display) | Aug 1914– | `"war"` | must | Declarations (gazettes) | 0 |
| `passport.photo` | jurisdiction | GB | early 1915– | `{required}` | must | Foreign Office notice; *London Gazette*; *The Times* | 0 |
| `passport.validity` | jurisdiction | GB | 1913–1915 | `{validSec}` | should | Foreign Office passport regulations; *Whitaker's Almanack* | 1 |
| `passport.fee` | jurisdiction | GB (London; consulates) | 1913–1915 | `{cur, minor}` | should | Same | 1 |
| `rent.terms` | jurisdiction | DE-BER | 1913–1915 | `{dates:[[m,d]], noticeSec}` (moving days, e.g. 1 April and 1 October, to verify) | must | Baedeker *Berlin*; Berlin tenancy custom or ordinance; civil code commentary | 1 |
| `addr.terms` | jurisdiction | GB | 1913–1915 | `{dates:[[m,d]]}` (quarter-days) | should | *Whitaker's Almanack* | 1 |
| `bank.hours` | institution | Berlin, London, Rotterdam banks | 1913–1915 | `{days, open:[[from,to]]}` | must | Baedeker "Practical information" | 1 |
| `police.hours` | institution | Berlin registration office | 1913–1915 | same | must | Baedeker; ordinance | 1 |
| `post.hours` | institution | main post offices (poste restante) | 1913–1915 | same | should | Baedeker | 1 |
| `passport.hours` | institution | London passport office; Rotterdam consulate | 1913–1915 | same | should | *Whitaker's*; Baedeker *London* | 1 |
| `parity` | pair | GBP>DEM, GBP>NLG, DEM>NLG | 1913–1915 | `{num, den}` | must | Baedeker money tables (pre-war); wartime quotations in a newspaper of record | 1 (wartime 0) |
| `price.hotel` | pair | city×class band (BER, LON, ROT) | 1913–1915 | `{cur, minorMin, minorMax}` | must | Baedeker hotel entries | 2 |
| `price.rent`, `price.wage`, `price.addrFee` | jurisdiction | DE-BER, GB | 1913–1915 | `{cur, minor}` | could (fallback DV-C04-040) | Baedeker *Berlin* (rooms, servants); newspaper advertisements | 2 |
| `postage.abroad` | jurisdiction | DE, GB, NL | 1913–1915 | `{cur, minor}` | should | Baedeker; postal guides | 1 |
| `ticket.named` | edge | sleepers, cabins, wartime boats | 1913–1915 | `{named}` | could (fallback DV-C04-044) | Bradshaw notes; operator conditions | 2 |
| `service.suspension` | edge | mobilisation, sailings | Aug 1914– | `{suspended}` | must (wartime) | Wartime timetable notices; newspaper of record | 0 |
| `obligation.grace` | jurisdiction | DE-BER rent | 1913–1915 | `{sec}` | could (fallback DV-C04-035) | Tenancy custom | 2 |

## 3. World calendar (Tier-0)

Each event gets Gregorian date (and time if printed), jurisdiction and its effect row ids. All windows below are orientation (to verify).

| Event type | Window (to verify) | Jurisdiction | Rows started / ended |
|---|---|---|---|
| Autumn 1913 and spring 1914 timetable changeovers | Oct 1913; May 1914 | GB, NL, DE | edition validity (not params) |
| July crisis notices (ultimatum, "imminent danger of war") | late July 1914 | AT-HU, DE | notices only |
| German passport decree | c. 31 July 1914; effective date to cite | DE | `passport.required`, `control.active` (DE frontier) |
| Dutch mobilisation and frontier measures | c. 31 July–early Aug 1914 | NL | NL `control.active` (could) |
| German mobilisation; civilian traffic restricted and resumed | early–late Aug 1914 | DE | `service.suspension` start and end |
| Declarations of war (DE–RU, DE–FR, GB–DE) | 1–4 Aug 1914 | DE, GB | `war.state`; `exit.permitted DE>GB` (date may differ: cite) |
| Aliens Restriction Order | c. 5 Aug 1914 | GB | `reg.coverage GB` (aliens); port `control.active` if the same instrument |
| Postal censorship begins | Aug 1914 | GB, DE | `censorship` |
| Wartime sailings: suspension, rerouting, resumption | Aug–Oct 1914 | GB, NL | `service.suspension`; edition changes |
| German enemy-property ordinances (payment bans, compulsory administration) | c. Sep–Nov 1914 | DE | `enemyProperty` |
| Internment of British civilian men in Germany | c. early Nov 1914 | DE | `internment` |
| British passport photograph requirement | c. Feb 1915 | GB | `passport.photo` |

## 4. Institutions

Rows in `institutions.csv`; names as period sources print them, to be transcribed and cited.

| Id (game) | Function | Kind | Jurisdiction / city | Attributes |
|---|---|---|---|---|
| `svc.DE` | Berlin political police (department of the Berlin police presidium) | police | DE / Berlin | from–to; reads `reg.*`, `frontier.passport`, `censor.copy`, `enemyProp.notice`, `internment.order` |
| `svc.GB` | Metropolitan Police Special Branch with the War Office Home Section | intelligence | GB / London | reads `port.control`, `passport.issued`, `censor.copy` |
| `DE.BER.police-reg` | Police registration (precinct, indexed at the residents' registration office) | registry | DE / Berlin | office hours param; record kinds; lag |
| `DE.frontier` | Frontier police at the used crossings | police | DE / frontier stations | from the decree |
| `DE.censor`, `GB.censor` | Postal censorship | post | DE, GB | from dates |
| `DE.enemyProp` | Enemy-property supervision or administration | court / other | DE / Berlin | from ordinance |
| `GB.passport` | Foreign Office passport department | registry | GB / London | hours, fee |
| `GB.consulate.ROT` | British consulate at Rotterdam (passport renewal abroad) | consulate | NL / Rotterdam | hours |
| `GB.ports` | Port control at the boat ports used | police | GB / ports | from date |
| `NL.ROT.police` | Rotterdam police, registration of foreigners | police | NL / Rotterdam | coverage, lag |
| Generic bank per city | Account holder's bank (unnamed) | bank | DE, GB, NL | basis design (no named bank); hours cited |
| Main post office per city | Poste restante, postage | post | DE, GB, NL | hours |

Landlords, hotels, address keepers, booking offices and steamer operators are game entities (`priv.*` sources), not institution rows.

## 5. Money

| Need | Detail | Sources | Priority |
|---|---|---|---|
| Currencies | GBP (farthings), DEM (pfennig), NLG (cents) | kit | — |
| Parities pre-war | GBP>DEM, GBP>NLG, DEM>NLG as printed | Baedeker money tables; bankers' almanacs | must |
| Wartime exchange | Dated quotations Aug 1914–Mar 1915 | Newspaper of record (London, Amsterdam exchange lists) | should; without it `exchange` is disabled after the last cited row (About shows the gap) |
| Lodging | Hotel room per night by class band, three cities | Baedeker | must |
| Rent, staff wage, accommodation-address fee | Berlin flat per term; a housekeeper's monthly wage; London address fee | Baedeker *Berlin*; advertisements | could (DV-C04-040) |
| Postage | Letter abroad from DE, GB, NL | Baedeker; postal guides | should |
| Passport fee | London and consulate | Foreign Office regulations; *Whitaker's* | should |
| Meals, porterage, telegrams | Not used in this MVP | — | — |

## 6. Coverage priority

**Minimum for a playable S1** (data freeze `data-c04-v1` cannot happen without these):
1. The Hook route both ways (London–Harwich–Hook–Rotterdam–Bentheim–Berlin) in the winter 1913–14, March/April 1914 and summer/anchor 1914 editions, with 1st/2nd fares, pier and frontier times, through coaches, zones and station zones.
2. `reg.coverage` for DE, NL and GB; `rent.terms` (Berlin); `bank.hours` and `police.hours` (three cities); pre-war `parity`; `price.hotel`.
3. Tier-0 rows: passport decree, `war.state`, `exit.permitted`, `internment`, `enemyProperty`, `censorship` (DE, GB), British port control, photograph rule. A missing Tier-0 row is not replaced by a design date; it blocks the freeze for S1.
4. `coop.edge` relations for registration slips, frontier records, port records, passport archive and censorship.

**Next:** the Flushing route (needed for H04-6 and T2; if absent, DV-C04-011 names another train svc.DE does not know, still design and flagged); the Ostend route (if absent, About states that the indicator's worst case covers transcribed routes only); wartime timetables (if absent, travel ends at the last transcribed date; S1 still runs in place to its end, so the photograph rule remains testable in London).

**Design fallbacks allowed (always labelled design):** all lags and design reach (DV-C04-017); cross-city transfers and minimum change (shared register); rent, wage and address-fee prices (DV-C04-040); obligation grace (DV-C04-035); staff notice (DV-C04-041); named tickets (DV-C04-044); port declared address (DV-C04-043); sample rates (DV-C04-022, -023).

**Never a fallback:** timetable times, running days and fares (a leg without them cannot be booked); calendar dates; zones; parities (exchange is disabled instead); regime dates.
