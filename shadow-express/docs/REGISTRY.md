# Shadow Express v2 — registry

The fixed ids, who owns which file, and the outline of the campaign. Every agent writes against this file and `docs/CONTRACTS.md`. Ids listed here exist from the start as stub rows, so a reference to any of them validates even before its owner has written the full row. Do not rename a listed id; you may add ids inside your own files.

## 1. The game in one paragraph

*July 1914.* The player is a freelance agent of the Secret Service Bureau, run from London by Commander Ashby. The campaign runs from the evening of Sunday 28 June (the shots in Sarajevo) to Britain's declaration of war on 4 August, in three acts:
- **Act I, A Shot in Sarajevo** (28 Jun – 12 Jul): calm, porous frontiers.
- **Act II, The Ultimatum** (13 – 25 Jul): vigilance rises; a third hunter.
- **Act III, Mobilisation** (26 Jul – 5 Aug): lines requisitioned, frontiers shut, enemy aliens interned, hunters arrest on their own ground.

The player travels by named trains and steamers under cover identities, cultivates and betrays people, and runs nine operations, while three hunters work from what the enemy actually knows. The protagonist is a man or a woman, chosen at the start; the covers come in matched pairs. About an hour of play; a campaign is roughly 300 decisions.

## 2. Files and owners

| owner | files |
|---|---|
| coordinator | `src/core/**`, `src/ui/**`, `src/art/kit.js`, `src/art/frame.js`, `src/art/vignettes/LON.js`, `src/data/index.js`, `src/data/time.js`, `build.mjs`, `template.html`, `test/**`, `tools/**`, `docs/**` |
| World | `src/data/nations.js`, `cities.js`, `lines.js`, `services.js`, `calendar.js` |
| People | `src/data/people.js`, `hunters.js`, `src/data/stories/people-<id>.js` (one per person), `src/data/stories/hunters.js` |
| Events | `src/data/stories/city.js`, `train.js`, `control.js`, `encounter.js`, `interlude.js` (split further as `city-2.js` etc. if long) |
| Ops | `src/data/covers.js`, `items.js`, `src/data/ops/<id>.js`, `src/data/stories/ops-<id>.js` |
| Art A | vignettes `PAR BRU AMS FLU COL HAM BER CPH STO SPB` |
| Art B | vignettes `WAR PRG VIE MUN ZUR MAR BAR MAD LIS ROM` |
| Art C | vignettes `VEN TRI BUD SAR BEG BUC ODE IST ATH`, `src/art/portraits.js`, `src/art/glyphs.js` |

The story and op indexes (`src/data/stories/index.js`, `src/data/ops/index.js`, `src/art/vignettes/index.js`) are generated: drop a file in the folder and run `node test/validate.mjs`. Never edit another owner's file. If you need a change there, say so in your final report.

**Flags** are namespaced by owner:
- People: `<personId>-…` (e.g. `kowal-owes`).
- Events: `ev-…`.
- Ops: `<opId>-…` (e.g. `op-cable-burned`).

Read only your own flags, plus these shared flags; for everything else use `st`, `trust`, `op` and `item` conditions:
- the unlock flags `kowal-path` and `ilic-path` (People set them);
- the flags the engine sets: `<opId>-won` and `<opId>-failed` when an operation ends (e.g. `op-cable-won`), and `<coverId>-burned` when a cover is burned (e.g. `hale-burned`).

## 3. Cities (30) and their specialities

| id | city | nation | speciality (item id · fn) | landmark for the vignette |
|---|---|---|---|---|
| LON | London | GB | `bradshaw` · tool (use:guide) | Westminster clock tower and Parliament over the Thames |
| PAR | Paris | FR | `couture-hat` · gift | the Eiffel Tower over the Seine and mansard roofs |
| BRU | Brussels | BE | `lace` · trade | the Grand-Place guildhalls and the Hôtel de Ville spire |
| AMS | Amsterdam | NL | `diamonds` · trade (contraband) | gabled canal houses, a bascule bridge, the Westerkerk tower |
| FLU | Flushing (Vlissingen) | NL | `dutch-cigars` · gift | the harbour mouth, the Zeeland mail steamer, a lighthouse, a windmill |
| COL | Cologne | DE | `eau-de-cologne` · gift | the cathedral's twin spires and the Hohenzollern bridge with a train |
| HAM | Hamburg | DE | `seamans-papers` · access | harbour cranes, an emigrant liner, St Michael's tower |
| BER | Berlin | DE | `vest-camera` · tool (use:camera) | the Brandenburg Gate with its quadriga, the Reichstag dome |
| CPH | Copenhagen | DK | `porcelain` · trade | the Exchange's dragon-tail spire and the ships of Nyhavn |
| STO | Stockholm | SE | `punsch` · gift | the openwork iron spire of Riddarholmen church, islands, a steamer |
| SPB | St Petersburg | RU | `sable-furs` · trade (size 2) | St Isaac's dome and the Admiralty needle over the Neva |
| WAR | Warsaw | RU | `amber` · trade | the Royal Castle clock tower and Sigismund's Column |
| PRG | Prague | AH | `bohemian-glass` · trade | the Charles Bridge towers under the castle and St Vitus |
| VIE | Vienna | AH | `opera-tickets` · access | St Stephen's spire and the giant wheel of the Prater |
| MUN | Munich | DE | `field-glasses` · tool (use:binoculars) | the twin onion domes of the Frauenkirche |
| ZUR | Zurich | CH | `letter-of-credit` · tool (use:credit) | the Grossmünster towers on the Limmat, lake and Alps |
| MAR | Marseille | FR | `skeleton-keys` · tool (use:keys, contraband) | Notre-Dame de la Garde on its rock, the transporter bridge |
| BAR | Barcelona | ES | `lined-valise` · tool (use:lining) | the half-built Sagrada Família in scaffolding, palms |
| MAD | Madrid | ES | `saffron` · trade | the Royal Palace and the Puerta de Alcalá |
| LIS | Lisbon | PT | `port-wine` · prop (cover:hale) | the Belém Tower on the Tagus |
| ROM | Rome | IT | `blessing-letter` · prop (cover:doyle) | the Colosseum with St Peter's dome beyond |
| VEN | Venice | IT | `silk-brocade` · gift | the rebuilt Campanile, the Doge's Palace arcade, gondolas |
| TRI | Trieste | AH | `naval-charts` · trade (contraband) | Miramare castle on its point, warships in the roads |
| BUD | Budapest | AH | `tokaji` · prop (cover:vessey) | the Parliament on the Danube and the Chain Bridge |
| SAR | Sarajevo | AH | `browning` · tool (weapon, contraband) | minarets and domes in a valley, the Latin Bridge |
| BEG | Belgrade | RS | `slivovitz` · tool (use:nerve) | Kalemegdan fortress above the two rivers |
| BUC | Bucharest | RO | `oil-shares` · trade | the domed Athenaeum among boulevards |
| ODE | Odessa | RU | `caviar` · gift (perishable:96) | the great stairs down to a harbour of grain ships |
| IST | Constantinople | OT | `turkish-carpet` · trade (size 2) | Hagia Sophia with its minarets, the Galata Tower, caiques |
| ATH | Athens | GR | `antiquities` · trade (contraband) | the Parthenon on the Acropolis rock |

**Other items** (Ops owns them):
- tool: `diplomatic-bag` (use:pouch; city null, from Ashby).
- docs: `sarajevo-cable`, `rangefinder-plates`, `ultimatum-copy`, `staff-papers`, `troop-tally`.
- companions: `companion-jovan`, `companion-sauer`.

## 4. Lines (57) and frontier stations

Ids are `A-B`. Frontier stations are listed in a→b order:

```
LON-PAR ferry  CAL Calais GB>FR          LON-BRU ferry  OST Ostend GB>BE          LON-AMS sea    HOO Hook of Holland GB>NL
LON-FLU ferry  VLI Flushing quay GB>NL   LON-HAM sea    CUX Cuxhaven GB>DE        LON-LIS sea    LXQ Lisbon quay GB>PT
PAR-BRU rail   QUE Quévy FR>BE           PAR-MAR rail   —                         PAR-ZUR rail   DLL Delle FR>CH
PAR-MUN rail   AVR Avricourt FR>DE       PAR-VIE rail   AVR FR>DE, SBG Salzburg DE>AH
PAR-MAD rail   IRU Irún FR>ES            BRU-AMS rail   RSD Roosendaal BE>NL      BRU-COL rail   HER Herbesthal BE>DE
AMS-COL rail   EMM Emmerich NL>DE        AMS-HAM rail   BEN Bentheim NL>DE        FLU-AMS rail   —
COL-BER rail   —                         COL-ZUR rail   BAS Basel DE>CH           HAM-BER rail   —
HAM-CPH ferry  KOR Korsør DE>DK          BER-CPH ferry  GED Gedser DE>DK          CPH-STO ferry  MAL Malmö DK>SE
STO-SPB sea    ABO Åbo SE>RU             BER-WAR rail   ALX Alexandrowo DE>RU     BER-SPB rail   EYD Eydtkuhnen DE>RU
BER-PRG rail   BOD Bodenbach DE>AH       BER-MUN rail   —                         WAR-SPB rail   —
WAR-VIE rail   GRA Granica RU>AH         WAR-ODE rail   —                         PRG-VIE rail   —
MUN-VIE rail   SBG Salzburg DE>AH        MUN-ZUR rail   ROS Romanshorn DE>CH      MUN-VEN rail   KUF Kufstein DE>AH, ALA Ala AH>IT
ZUR-VEN rail   CHI Chiasso CH>IT         VIE-BUD rail   —                         VIE-TRI rail   —
VIE-VEN rail   PON Pontafel AH>IT        BUD-BEG rail   SEM Semlin AH>RS          BUD-BUC rail   PRE Predeal AH>RO
BUD-SAR rail   —                         BEG-IST rail   TSA Tsaribrod RS>BG, MUS Mustafa Pasha BG>OT
BEG-SAR road   VIS Višegrad RS>AH        BUC-IST ferry  CON Constantinople quay RO>OT
BUC-ODE rail   UNG Ungheni RO>RU         ODE-IST sea    CON RU>OT                 IST-ATH sea    PIR Piraeus OT>GR
TRI-VEN sea    VEQ Venice quay AH>IT     TRI-ATH sea    PIR AH>GR                 VEN-ROM rail   —
ROM-MAR rail   VTM Ventimiglia IT>FR     ROM-ATH ferry  PAT Patras IT>GR          MAR-BAR rail   PBU Port-Bou FR>ES
BAR-MAD rail   —                         MAD-LIS rail   VAL Valencia de Alcántara ES>PT
MAR-IST sea    CON FR>OT
```
`CON` and `PIR` are port quays shared by lines from several countries: a shared station keeps its id and name, and its nations may differ between lines as long as `into` (or `from`) is the same. Frontier ids never repeat a city id.

Shared unlock services:
- `kowal-path`: line BER-WAR, kind path, unlock `flag:kowal-path`. Across the Prussian frontier near Thorn.
- `ilic-path`: line BEG-SAR, kind path, unlock `flag:ilic-path`. Across the Drina by night.

## 5. Covers (5)

| id | man · woman | nation | class | unlock | fits |
|---|---|---|---|---|---|
| `hale` | Edmund Hale, wine merchant of Bristol · Margaret Hale, widow running the family wine house | GB | 2 | start | docks, markets, hotels, shipping and trade talk |
| `weiss` | Carl Weiss, traveller in optical instruments for a Zurich firm · Clara Weiss, the firm's correspondent | CH | 2 | start | factories, observatories, technical questions. Neutral and easy at frontiers, but a Swiss legend is checked fast (short `backstopH`) and has no military or diplomatic access |
| `marchand` | Henri Marchand · Héloïse Marchand, correspondents of *L'Écho du Soir* | FR | 2 | `person:novak` | press rooms, ministries, legations, political questions. Watched closely and suspect in Germany and Austria after the ultimatum |
| `doyle` | Father Anselm Doyle SJ, Irish scholar · Sister Bridget Doyle, Irish nursing sister | GB | 3 | `person:agathe` | churches, archives, hospitals; rarely searched; odd in clubs and barracks |
| `vessey` | Count Pál Vészy · Countess Ilona Vészy | AH | 1 | `op:op-diamonds` | embassies, clubs, the opera, officers' messes; must travel first class; an enemy alien in Paris and London after the declarations |

## 6. People (13) and hunters (3)

Each person appears in at least two places. A person's `city` and `train` storylets fire only in their places. Their arc should touch at least one operation.

| id | name | where | role and arc | loyalty | perks |
|---|---|---|---|---|---|
| `ashby` | Commander Ashby | LON, PAR | the handler. Dry, impatient, fair. Debriefs, standing, the occasional favour (the diplomatic bag) | bureau | courier |
| `jovan` | Jovan Marić | SAR, BEG, train:BEG-SAR | a law student whose friends are being arrested. Holds the cable (op-cable); later must be got out (op-student) | cause | intel |
| `brandl` | Dr Emil Brandl | VIE, BUD, train:VIE-BUD | a nerve doctor whose patients wear epaulettes. Judges the cable; his patient at the Ballhausplatz is a way into op-ultimatum. Perhaps the mole | `{ self:.5, 'enemy:heller':.5 }` | intel, safehouse |
| `sauer` | Hedwig Sauer | BER, HAM, train:HAM-BER | a typist at the Great General Staff, quiet, a sister in Hamburg. Insider for op-optics; must be got out in op-typist | self | intel |
| `kowal` | Szymon Kowal | WAR, BER, train:BER-WAR | a smuggler with a path across the Prussian frontier (`kowal-path`). Helps op-diamonds; gives the side op op-amber | self | courier |
| `novak` | Václav Novák | PRG, VIE, train:PRG-VIE | a printer and forger, Czech patriot. Mends papers, grants the Marchand cover | cause | papers |
| `amsler` | Ruedi Amsler | ZUR, PAR, train:PAR-ZUR | a private banker: letters of credit, discreet accounts. Perhaps the mole, sold to Orlova | `{ self:.6, 'enemy:orlova':.4 }` | safehouse |
| `ilic` | Lieutenant Dragan Ilić | BEG, SAR, train:BUD-BEG | a Serbian officer, patriot, careless talker; knows the Drina path (`ilic-path`). Gives the side op op-brother. Perhaps the mole | `{ cause:.6, 'enemy:heller':.4 }` | intel, warn |
| `odile` | Odile Vasseur | PAR, BRU, train:PAR-BRU | a milliner who hears the officers' wives. Gives the side op op-letter | self | intel, safehouse |
| `agathe` | Sister Agathe | train:MUN-VEN, train:ZUR-VEN, ROM | a Belgian nursing nun who carries parcels for the poor. Can carry for you; grants the Doyle cover | cause | courier |
| `kessel` | Rittmeister von Kessel | train:COL-BER, train:BER-MUN, COL | a talkative Prussian cavalry officer. Remembers faces; in Act III he is at Cologne with the troop trains (op-troops) | self | intel |
| `platt` | Lyman Platt | PAR, BER, VIE, train:PAR-VIE | an American newspaperman, friendly and nosy. Trades rumours, some false; an unwitting carrier of a false trail | self | intel |
| `morel` | Dr Achille Morel | MAR, train:PAR-MAR, train:ROM-MAR | a dentist from Lyon who photographs stations and asks odd questions. A red herring: harmless, but he looks like a hunter | self | (none) |

**Gifts.** These are fixed so People (`likes`) and Ops (`gift:` tags) agree:

| person | likes |
|---|---|
| ashby | `dutch-cigars`, `port-wine` |
| jovan | `bradshaw` |
| brandl | `bohemian-glass`, `tokaji`, `opera-tickets` |
| sauer | `couture-hat`, `eau-de-cologne` |
| kowal | `dutch-cigars`, `slivovitz` |
| novak | `vest-camera` |
| amsler | `porcelain`, `antiquities` |
| ilic | `tokaji`, `browning` |
| odile | `silk-brocade`, `lace` |
| agathe | `lace` |
| kessel | `punsch`, `dutch-cigars`, `caviar` |
| platt | `amber`, `caviar`, `opera-tickets` |
| morel | `saffron`, `porcelain` |

| hunter | service | nation · ground | start | from | look |
|---|---|---|---|---|---|
| `falk` · Herr Falk | Abteilung IIIb | DE · DE, AH | BER | 06-28 00.00 | a tall man in a grey ulster who never seems to hurry |
| `heller` · Hauptmann Heller | Evidenzbureau | AH · AH, DE | VIE | 06-28 00.00 | a stout officer in mufti with a duelling scar and an unlit cigar |
| `orlova` · Madame Orlova | freelance, in Austrian pay | RU · AH, DE | ZUR | 07-13 00.00 | a small woman in widow's black with very good gloves |

## 7. Operations

Main ops arrive by telegram at `issue`; at most two overlap. Step ids in **bold** are fixed, because People and Events may test them with `['op', id, step]`.

| id | act | issue | title | outline |
|---|---|---|---|---|
| `op-cable` | 1 | 06-28 17.00 | The Sarajevo Cable | **reach** Sarajevo by 2 July; **meet** Jovan, who has the cable; **judge** it in Vienna (Brandl) or Prague (Novák); **home**: carry `sarajevo-cable` to London by 9 July. Was it forged? |
| `op-optics` | 1 | 07-03 09.00 | Coincidence | a Berlin works has a new coincidence rangefinder. **reach** Berlin; **photo** the drawings (as Weiss on a sales call, through Sauer, a bribed draughtsman, or keys at night); **home**: carry `rangefinder-plates` to London by 12 July |
| `op-diamonds` | 1 | 07-07 09.00 | Stones for Petersburg | **buy** uncut stones in Amsterdam with Bureau money; **carry** `diamonds` to St Petersburg by 15 July, across a Russian frontier, or by Kowal's path. Win grants `vessey` |
| `op-mole` | 2 | 07-13 09.00 | The Mole | Heller knew too much. Brandl, Ilić and Amsler each knew. **feed** each a different false detail (`plant`); **watch** which one the hunters act on; **name** the mole to Ashby by 20 July |
| `op-ultimatum` | 2 | 07-18 09.00 | The Ultimatum | **reach** Vienna by 21 July; **copy** the note's text at the ministry; **wire** it from neutral ground or London before it is delivered (23 July, 18.00) |
| `op-student` | 2 | 07-21 09.00 | Get Jovan Out | **find** Jovan before the police do; **out**: carry `companion-jovan` to Italy, Switzerland or London by 28 July |
| `op-typist` | 3 | 07-27 09.00 | Fräulein Sauer | **meet** Sauer in Berlin by 31 July; **out**: carry `companion-sauer` and `staff-papers` to neutral ground by 2 August |
| `op-troops` | 3 | 07-31 09.00 | Count the Trains | **watch** the Hohenzollern bridge at Cologne between 2 August 06.00 and 3 August 18.00; **out**: carry `troop-tally` to London, Flushing, Amsterdam or Brussels by 4 August, 23.00 |
| `op-lastboat` | 3 | 08-02 09.00 | The Last Boat | **home**: reach London before the British ultimatum expires (4 August, 23.00 London, midnight CET) with whatever papers you carry |
| `op-letter` | side | — | Odile's Letter | carry a sealed letter from Paris to a Belgian officer in Brussels. Is it only a love letter? |
| `op-brother` | side | — | The Brother | Ilić's brother Pavle was taken in the Sarajevo round-ups; get him out of the garrison prison |
| `op-amber` | side | — | Amber for Berlin | smuggle Kowal's parcel from Warsaw to Berlin |

## 8. Calendar anchors (World writes the full rows)

| date | event | fact | effect |
|---|---|---|---|
| 28 Jun | Sarajevo: Archduke Franz Ferdinand and the Duchess of Hohenberg shot | fact | act I opens; Bosnian round-ups; anti-Serb riots in Sarajevo on 28–29 June |
| 5–6 Jul | Berlin's assurance of support to Vienna, the "blank cheque" | fact | rumour only |
| 13 Jul | act II | | Orlova active; controls up in AH |
| 23 Jul, 18.00 | ultimatum delivered in Belgrade | fact | Semlin severe; Belgrade alert |
| 25 Jul | Serbia mobilises; Austria-Hungary partially mobilises; relations broken | fact | Belgrade services cut |
| 26 Jul | act III | | lags shorten; hunters may arrest on their ground |
| 28 Jul | Austria-Hungary declares war on Serbia | fact | Sava bridge at Semlin blown that night: BUD-BEG suspended |
| 30–31 Jul | Russian general mobilisation; Austrian general mobilisation; German "state of imminent danger of war"; exchanges close | fact | Russian frontier lines suspended; German papers compulsory; `credit:false` |
| 1 Aug | Germany mobilises and declares war on Russia; France mobilises | fact | German and French lines under military control |
| 2 Aug | Germany occupies Luxembourg; ultimatum to Belgium; Italy declares neutrality | fact | Franco-German frontier closes; `neutral IT` |
| 3 Aug | Germany declares war on France | fact | `war DE FR`; `alien` effects |
| 4 Aug | Germany invades Belgium; Britain declares war on Germany at 23.00 London time | fact | Belgian–German lines close; Channel boats requisitioned with reduced civilian sailings; `alien GB DE`, `alien GB AH` |
| invented | a railway strike, a Danube flood, cholera quarantine at a port, requisitioned rolling stock | fiction, p < 1 | suspensions for a day or two |
