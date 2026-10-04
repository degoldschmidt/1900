# Shadow Express v2 — contracts

Everything under `src/data/` and `src/art/` is written against this file. The engine (`src/core/`) reads data only through these shapes, and `node test/validate.mjs` rejects anything that does not match. If you need something this file does not offer, stop and ask the coordinator; do not invent a new key. Ids, file ownership and the story outline are in `docs/REGISTRY.md`.

## 1. Basics

- **Time** is whole minutes from **Sunday 28 June 1914, 00.00 CET**. Data files write moments as `'MM-DD hh.mm'` (`'07-23 18.00'`) and clock times as `'hh.mm'` (`'21.40'`), the way 1914 timetables printed them. Day 0 is a Sunday; weekday digits are `0` (Sunday) … `6` (Saturday). All clocks are CET for simplicity.
- **Ids**: cities and frontier stations are three capitals (`LON`, `VIE`, `AVR`); nations two (`GB`, `FR`, `DE`, `AH` Austria-Hungary, `RU`, `IT`, `CH`, `NL`, `BE`, `DK`, `SE`, `ES`, `PT`, `RS` Serbia, `RO`, `GR`, `OT` Ottoman Empire, `BG`, `LU`); everything else is lowercase with hyphens (`orient-w`, `kowal`, `op-optics`). Story ids are dotted: `kowal.meet`, `ev.train.card-sharp`.
- **Data modules** are plain ES modules: `export default [ … ]` (an op file exports one object). No logic; the only import allowed is `src/data/time.js`.
- **Every row** carries only the keys listed here. Optional keys are marked `?`.
- **Tags** say what an action looks like to an observer: `venue:x`, `topic:x`, `item:<itemId>`, `class:1|2|3`.
  - venues: `station hotel cafe market church telegraph docks ministry embassy barracks factory opera club press bank hospital university archive prison observatory fortress bazaar`
  - topics: `military naval diplomatic political shipping trade finance technical religion arts society police railways press medicine underworld`

## 2. The world

```js
// src/data/cities.js
CITY   = { id:'VIE', name:'Vienna', ll:[16.373, 48.208], nation:'AH', capital:true, port:false,
           line:'Coffee, waltzes, and a thousand informers.',          // one sentence, ≤ 25 words
           venues:['venue:ministry','venue:cafe','venue:opera','venue:station','venue:hotel','venue:church'],  // ≥ 4
           speciality:'opera-tickets' }                                // item id sold here (REGISTRY)

// src/data/nations.js
NATION = { id:'AH', name:'Austria-Hungary', bloc:'central'|'entente'|'neutral',   // alignment on 28 June
           papers:{ peace:.15, tension:.4, war:1 },    // chance a frontier control asks for papers
           search:{ peace:.05, tension:.2, war:.6 },   // chance of a customs search of your case
           lagH:{ peace:18, tension:8, war:3 },        // hours before a record made here reaches the enemy
           bribe:.4 }                                  // how bribable officials are, 0..1

// src/data/lines.js — id is 'A-B'
LINE   = { id:'PAR-VIE', a:'PAR', b:'VIE', mode:'rail'|'ferry'|'sea'|'road',
           via:[[7.75,48.58], …],                      // waypoints a→b (lon,lat) so the drawn line follows the real route
           frontiers:[{ id:'AVR', name:'Avricourt', ll:[6.8,48.65], from:'FR', into:'DE' }, …] }  // in a→b order; [] if none
```
The frontiers chain: the first `from` is the nation of `a`, each `into` is the next `from`, the last `into` is the nation of `b`. Each station lies within 120 km of the drawn course. A station shared by two lines has the same id, name and nations on both.

```js
// src/data/services.js
SERVICE= { id:'orient-w', line:'PAR-VIE', kind:'express'|'mail'|'night'|'slow'|'steamer'|'coach'|'path',
           name:'Orient Express', dep:{ PAR:['19.30'], VIE:['21.15'] },   // departures from each end
           days:'*'|'135',                             // weekdays it runs ('*' = daily)
           hours:26, fare:{ 1:9, 2:6 },                // £ per class it carries
           sleeper:true, records:['berth'],            // records the service writes about every passenger
           punct:.8, maxDelay:180,                     // chance of running to time; worst delay in minutes
           check:'onboard'|'station'|'none',           // where frontier control happens ('none' only for paths or lines without frontiers)
           unlock?:'flag:kowal-path' }                 // only offered once the flag is set
```

## 3. The calendar (the July Crisis)

```js
// src/data/calendar.js
CAL = { id:'ultimatum', at:'07-23 18.00', until?:'07-30 00.00', p:1, fact:true,
        rumourLeadH:0,                                 // hours before `at` that rumours of it start
        news:'AUSTRIA DELIVERS ULTIMATUM TO SERBIA', text:'One or two sentences of report, ≤ 60 words.',
        fx:[ ['state','RS','tension'], ['war','AH','RS'], ['suspend','line:BUD-BEG','07-29 02.00',null],
             ['control','DE',.3], ['control','frontier:AVR',.5], ['lag','DE',.5], ['alien','GB','DE'], ['credit',false],
             ['hunter','orlova',true], ['price','diamonds','IST',1.4], ['neutral','IT'] ] }
```
- `fact:true` rows are real dated events: their headlines and dates must be accurate. Their *effects* are game design. `fact:false` rows are invented disruptions (strikes, floods, quarantine, requisitions) with `p < 1`; whether they happen is drawn once per campaign.
- `suspend` targets: `'line:ID'`, `'service:ID'`, `'frontier:ID'` (every line through that station) or `'border:FR-DE'` (every frontier between two nations); then from (null = `at`) and until (null = the row's `until`; for a fact row with none, for good; for an invented disruption with none, a day or two).
- `control` adds to control intensity (0..1) for a nation or one frontier station; `lag` multiplies record delays in a nation; `alien` makes nationals of the first nation enemy aliens in the second; `credit:false` stops letters of credit; `hunter` activates or retires a hunter; `price` multiplies an item's sale price in a city.

## 4. Covers, people, hunters, items

```js
// src/data/covers.js
COVER  = { id:'hale', nation:'GB', cls:2,                        // class a person of this kind travels
           man:{ name:'Edmund Hale', legend:'wine merchant of Bristol' },
           woman:{ name:'Margaret Hale', legend:'widow running her late husband\'s wine house' },
           papers:.7,                                            // quality of the papers, 0..1
           backstopH:48,                                         // hours for the enemy to check the legend by letter
           aff:{ 'venue:docks':1, 'topic:shipping':1, 'topic:military':0, 'venue:barracks':-1 },  // 1 fits · 0 odd · -1 implausible
           props:['port-wine'],                                  // items that make the legend convincing
           unlock:null|'op:op-diamonds'|'person:novak',          // null = held from the start (exactly two)
           blurb:'One or two sentences for the Covers view, ≤ 30 words.' }
```
A tag a cover does not list counts as odd (0), except `venue:station hotel cafe market church telegraph`, which fit everyone. Travelling in your cover's class fits; one class off is odd; two off is implausible. An odd act leaves a record; an implausible one needs a roll and leaves a sharper record.

```js
// src/data/people.js
PERSON = { id:'kowal', name:'Szymon Kowal', city:'WAR'|null, role:'smuggler', nation:'RU',
           wants:['money','thrill'],                             // from: money safety revenge love cause fame debt family escape faith career thrill
           loyalty:'self'|'bureau'|'cause'|'enemy:falk'|{ self:.6, 'enemy:heller':.4 },
           courage:.3, greed:.6, likes:['amber'],                // likes: item ids that work as gifts
           perks:['safehouse','papers','warn','courier','intel'],  // what they do for you once recruited
           portrait:{ seed:7, sex:'m', hat:'cap', hair:'short', beard:'moustache', collar:'stiff', age:'mid' },
           entry:'kowal.meet',                                   // the first storylet with them
           places:['WAR','train:BER-WAR'] }                      // where they can be met (≥ 2): cities or 'train:<line>'
```
- **Weighted loyalty** is drawn once per campaign. Among all people whose weighted loyalty includes an `enemy:` option, exactly one is the enemy (chosen by those weights); the others take their other option. This is the mole.
- **Statuses**: `unknown met cultivated recruited compromised arrested dead turned`. Trust runs −3..5.
- `city:null` is a traveller; `portrait` values: hat `none bowler top cap boater fez veil kepi wide`, hair `short long bun bald`, beard `none moustache full goatee`, collar `lace stiff uniform cassock fur`, age `young mid old`.

```js
// src/data/hunters.js
HUNTER = { id:'falk', name:'Herr Falk', service:'Abteilung IIIb', nation:'DE', ground:['DE','AH'],  // where they can have you arrested
           look:'a tall man in a grey ulster who never seems to hurry', start:'BER', from:'06-28 00.00',
           portrait:{ … as PERSON }, voice:['falk.letter', …] }                  // storylets in the hunter's own voice

// src/data/items.js
ITEM   = { id:'diamonds', name:'Uncut stones', city:'AMS'|null, price:30|null, sell:{ SPB:52, IST:45 }, size:0|1|2,
           fn:'trade'|'gift'|'prop'|'access'|'tool'|'doc'|'companion',
           tags:['contraband','weapon','perishable:48','gift:kowal','cover:hale','use:camera'],
           line:'One sentence: what it is and why you would carry it.' }
```
- The case holds 6 size units. `city:null` items are not for sale (`price:null`): op documents (`fn:'doc'`) and companions (`fn:'companion'`, size 0: a person travelling with you, e.g. a defector posing as your secretary; they cross controls on their own papers).
- A **tool** names its use: `use:camera` (photograph), `use:keys` (locks), `use:guide` (true timetable: delays and disruptions), `use:binoculars` (observe from afar), `use:credit` (draw money in any bank city), `use:nerve` (restore nerve once), `use:lining` (hides one contraband item from a search), `use:pouch` (a case that is not searched).

## 5. Storylets: events, dialogue, twists, controls, encounters

One format for everything the player reads and answers.

```js
// src/data/stories/<file>.js   — export default [ STORY, … ]
STORY = { id:'kowal.meet', at:'city'|'train'|'person'|'op'|'interlude'|'control'|'encounter'|'then',
          if:[ ['city','WAR'], ['st','kowal','unknown'] ],     // all must hold
          w?:1, once?:true,                                      // weight among eligible storylets; fire at most once
          speaker?:'kowal', title:'Short heading', text:'…',   // a speaker must be present for the card to fire
          from?:'ashby',                                         // or: the sender of a letter or wire (portrait, no presence needed)
          choices:[ { label:'Buy him a vodka', sub?:'£1, half an hour', tag?:'venue:cafe',
                      if?:[ … ], cost?:{ money:1, min:30, nerve:0 },
                      roll?:{ p:.6, mods:[ [['aff','topic:underworld','>=',1], .2], [['item','amber'], .2] ] },
                      ok:[ effects … ], fail?:[ effects … ],     // without a roll only `ok` applies
                      next?:'kowal.paths' } ] }                  // another storylet, shown at once
```
**Where storylets appear (`at`)**
- `city`: on arrival and when you walk the city.
- `train`: during journeys. Add `['mode', …]`, `['kind', …]` or `['class', …]` conditions.
- `person`: when you seek out a person in the People view. The engine opens the heaviest eligible one whose `speaker` is that person.
- `op`: an operation's step, way or twist.
- `interlude`: quiet days in a posting, while the days pass (and lie-low gaps between orders).
- `control`: frontier controls. The engine adds the standard choices: show papers, declare goods, bribe, trust the lining, claim the pouch, talk your way through. Your storylet supplies the scene and at most two extra choices.
- `encounter`: a hunter is here. The engine adds: brazen it out, slip away, pay a porter to delay him, draw the pistol (with a weapon), go quietly. You supply the scene and at most two extra choices.
- `then`: never chosen by the engine. Only reached through `next`, `later`, an `entry`, a hunter's `voice` or an op.

`next` shows the target at once if its `if` holds; otherwise the chain ends. `later` queues a storylet: it fires at the first chance after the delay whose kind matches its `at` (`then` = anywhere) and whose `if` holds, within 48 h, or never.

**Conditions** — `[name, ...args]`, all of which must hold:

| condition | meaning |
|---|---|
| `['city', id]` · `['nation', id]` | where the player is |
| `['act', n]` · `['act', '>=', n]` | campaign act |
| `['st', person, status]` · `['trust', person, op, n]` | person status; trust −3..5 compared with `op` ∈ `> >= < <= == !=` |
| `['loyal', person, loyalty]` | the person's hidden loyalty (truth: only in `op`, `then` and `encounter` storylets, e.g. a debrief) |
| `['item', id]` | the item is in your case |
| `['cover', id]` · `['aff', tag, op, n]` | the active cover, or its affinity for a tag |
| `['sex', 'm'\|'f']` | the protagonist |
| `['flag', name]` · `['not', cond]` · `['any', cond, cond, …]` | flags and logic |
| `['op', opId]` · `['op', opId, stepId]` | operation active, or step done |
| `['tailed']` | a hunter is tailing you (truth: offer warning signs, never state it) |
| `['clock', 'hh.mm', 'hh.mm']` · `['day', '12345']` | local time and weekday |
| `['chance', p]` | random |
| `['money', op, n]` · `['nerve', op, n]` · `['standing', op, n]` | the player's purse (£), nerve (0..10) and Bureau standing (0..100) |
| `['mode', m]` · `['kind', k]` · `['class', n]` | the current journey's line mode, service kind, travel class |
| `['state', nation, 'peace'\|'tension'\|'war']` · `['war', a, b]` | the world |
| `['hunter', id, 'here']` | a hunter is in the same place (truth; encounters only) |
| `['skill', name, op, n]` | the agent's skill: languages `german french italian slavic` (0–2), and `charm tradecraft observation composure paperwork streetwise commerce` (0–3) |
| `['stay', op, n]` | whole days spent in the current city since arriving |
| `['legend', op, n]` | how established the active cover is in this city, 0..1 (grows with cover work) |
| `['watched']` | the local police are watching you here (truth: offer warning signs, never state it) |

**Effects** — `[name, ...args]`, applied in order:

| effect | meaning |
|---|---|
| `['money', n]` · `['nerve', n]` · `['standing', n]` | change the player's purse, nerve, Bureau standing |
| `['min', n]` | n minutes pass |
| `['trust', person, n]` · `['st', person, status]` | change a person's trust or status |
| `['flag', name]` · `['unflag', name]` | set or clear a flag |
| `['item', '+id']` · `['item', '-id']` | gain or lose an item |
| `['intel', { subj, claim, src, rel, truth }]` | something the player learns (see below) |
| `['record', kind, fid]` | you leave a record here under the active cover: `register frontier berth list wire sighting bribe meeting photo`, fidelity 0..1 |
| `['susp', coverId\|'active', n]` | enemy suspicion of a cover (rare: prefer records) |
| `['expose', person, p]` | the enemy may learn of your link with a person (chance p) |
| `['plant', { via, subj, claim }]` | feed the enemy a falsehood through person `via` (false trail, canary trap) |
| `['cover', '+id']` · `['papers', coverId\|'active', n]` | gain a cover; improve or spoil its papers (n is −1..1) |
| `['op', opId, 'start'\|'step:id'\|'win'\|'fail']` | operation control |
| `['later', hours, storyId]` | a delayed consequence |
| `['delay', n]` | the current journey arrives n minutes later |
| `['unlock', 'flag:name']` | set a flag that opens a hidden service or path |
| `['debrief', text]` | a line for the operation's debrief |
| `['legend', n]` | the active cover becomes more (or less) established in this city (n −1..1) |
| `['watch', n]` | local police attention on you here rises (or falls) by n (−1..1) |

**Intel.** `subj` is `hunter:id`, `person:id`, `line:ID`, `service:id`, `frontier:ID`, `city:ID`, `cover:id` (or `cover:active`) or `op:id`. `claim` has exactly one key: `{at:CITY}`, `{heading:CITY}`, `{loyal:'enemy'|'bureau'|'self'|'cause'}`, `{closed:[from|null, until|null]}`, `{knows:'name'|'desc'|'photo'}` or `{note:'≤ 20 words'}`. `src` is `seen porter paper bureau rumour police guide` or `person:id`. `rel` is how reliable it looks (0..1). `truth` is `true`, `false` or `'auto'` (the engine decides from the world; not for notes).

**Text templates**: `{sir|madam}` picks by the protagonist's sex (any `{man|woman}` pair: `{he|she}`, `{Herr|Frau}`, `{Monsieur|Madame}`); `{name}` is the active cover's name, `{legend}` its legend, `{city}` the current city, `{person:id}` a person's or hunter's name.

**Rolls**: chance = p + the deltas of the mods whose condition holds, clamped to 0.05–0.95.

## 6. Operations

```js
// src/data/ops/<id>.js — export default OP
OP = { id:'op-ultimatum', act:2, issue:'07-18 09.00'|null, giver:'handler'|personId, side?:true,
       title:'The Ultimatum\'s Text', brief:'Telegram text from the handler, ≤ 60 words.',
       steps:[ { id:'reach', kind:'goto', city:'VIE', by?:'07-21 12.00', after?:'07-19 18.00' },
               { id:'copy', kind:'act', city:'VIE', venue:'venue:ministry', clock?:['09.00','17.00'], days?:'12345', gives?:'ultimatum-copy',
                 ways:[ { id:'patient', label:'Through Brandl\'s patient', if:[['st','brandl','recruited']], risk:.15, rec:['meeting',.3] },
                        { id:'porter', label:'Bribe the night porter', sub:'£25 and a long night', cost:{ money:25 }, risk:.35, rec:['bribe',.6],
                          ok?:[effects], fail?:[effects], story?:'op-ultimatum.porter' } ] },
               { id:'wire', kind:'carry', item:'ultimatum-copy', to:['ZUR','VEN','LON'], by:'07-24 12.00' } ],
       twists:[ { if:[['op','op-ultimatum','copy'],['chance',.5]], story:'op-ultimatum.forged' } ],
       win:[ ['standing',15] ], fail:[ ['standing',-20] ],
       debrief:'What was really going on, revealed after the operation, ≤ 90 words.' }
```
- **Steps** are done in order.
  - `goto`: be in `city` inside the window.
  - `act`: do something at `venue` in `city`, one of several `ways`.
  - `meet`: meet `person` (in their city, or `city` if given).
  - `wait`: stay `min` minutes in `city`, e.g. surveillance.
  - `carry`: bring `item` to `to`.
  - `observe`: be in `city` between `after` and `by`, optionally for `min` minutes.
- `city` and `to` may be a list (any of them). Optional on any step: `label` (≤ 8 words, shown on the order), `story` (a storylet shown when the step is reached), `gives` (item gained when it is done), `key:false`.
- **Windows** punish early and late. Arriving before `after` is as bad as after `by`; the op fails when a `by` passes with the step undone.
- **A way** is chosen on the spot. Its `if` and `cost` must be met. Then `risk` is the chance it is noticed:
  - Noticed: the step is not done, `fail` effects apply, and the record is written at fidelity 1.
  - Not noticed: the step is done, `ok` applies, and `rec` is written at its fidelity.
  - With `story`, the storylet runs instead of the roll; its choices finish the step with `['op', id, 'step:copy']`.
- **Every key step** (any `act` unless `key:false`) has at least two ways, and at least one way is open to three or more covers.
- **Side ops** (`side:true`, `issue:null`) come from a person through `['op', id, 'start']`. **Main ops** arrive by telegram at `issue`; at most two main ops overlap. A main op with `optional:true` may be declined on its telegram.
- **Postings** (REGISTRY §7): most steps are city work in the city where the agent is posted; a journey is a deliberate, high-stakes step. `wait` and `observe` steps count the time spent living in that city.

## 7. Runtime shapes (engine only, for reference)

```js
INTEL  = { id, subj, claim, about:t, learned:t, src, rel:0..1, truth:bool, planted:bool, resolved:null|bool }
RECORD = { kind, city, t, cover:'hale'|null, fid:0..1, arrives:t, person:null|id }
ENEMY  = { inbox:[RECORD], dossiers:{ hale:{ susp, name, desc, photo, alerts:['DE'], sightings:[], links:[] } },
           assoc:{ kowal:0..1 }, plans:[{ city, from, to, conf }], scepticism:0..1, belief:[{ city, t, w }],
           roles:{ falk:{ role:'tail'|'guard'|'watch', target } } }
```
**False trails** (`['plant', …]` about the agent): the person lays the trail by travelling as you, which exposes them. The enemy rejects a trail when a fresher genuine record makes it impossible on the timetable (so the agent must lie quiet until the claimed hour; the engine says so in a note). Otherwise it believes the trail with chance 1 − scepticism. Every trail received adds 0.3 to scepticism, believed or not; each one exposed adds 0.25 more. Measured with the `exploit-plant` bot: the first trail is believed about 70% of the time, the third under 20%.

## 8. Writing style (all text)

- **Voice**: 1914, British English, dry and specific; the narrator writes like a good thriller of the day (Buchan, Childers, Conrad's *Secret Agent*) without imitating any of them. Short sentences. No modern idioms ("okay", "process", "impact", "focus on", "update"), no anachronisms (no Leica, radio broadcasts, ballpoints, "teenager", MI5/MI6, "the Great War").
- **Lengths**: a storylet `text` ≤ 70 words; a `title` ≤ 6; a `label` ≤ 7; a `sub` ≤ 12; a brief ≤ 60; a city `line` one sentence.
- **Every choice matters**: each choice has an effect beyond `['min', …]`, a cost, a roll or a `next`. At least one choice per storylet risks something: money, a record, trust, standing, an item, or time against a window. Write the stakes into `sub` when the player could reasonably know them, never the hidden odds.
- **People are invented.** Real events appear through `calendar.js` headlines and news; real people may be mentioned in news text but never appear as characters.
- **Consequences persist**: use `flag` and `later` so that choices come back. At least a third of the `city` and `train` storylets use `later` or set a flag that another storylet reads. A flag nobody reads is a broken promise; a flag nobody sets is an error.
- **Uncertainty**: rumours, tips and sightings go through `['intel', …]` with an honest source and reliability. Some are false (`truth:false`) or planted, and the player must be able to check them.
- **Protagonist**: address with templates; never assume the player's sex in plain text.

## 9. Art kit (`src/art/kit.js`) and art modules

The art is **soot and engraving**: ink cross-hatching on stained sepia paper, coal-smoke grain, no flat fills except paper. Colours come from `kit.ink` (near-black brown), `kit.paper`, `kit.sepia`, `kit.wash` (a thin indigo wash used sparingly for water and night), and `kit.blood` (only for danger marks).

```js
// kit API (SVG strings; viewBox 640×240 for vignettes, 120×150 for portraits)
kit.defs(uid)                       // <defs>: hatch patterns (h45, h45f, h135, cross, hz, stipple, waves), paper and grain filters
kit.hatch(d, pattern, uid, opts?)   // a path filled with a hatch pattern and inked outline
kit.outline(d, w?)                  // an inked stroke
kit.sky(hour, weather, uid)         // the sky band: hatching density by hour, sun or moon, stars, smoke clouds
kit.ground(kind, uid)               // foreground strip: 'cobbles' | 'quay' | 'water' | 'river' | 'hills'
kit.smoke(x, y, scale, uid)         // a rising coal-smoke plume
kit.windows(x, y, w, h, cols, rows, lit) // window grid, lit at night
kit.rng(seed)                       // seeded random for jitter

// src/art/vignettes/<CITY>.js — one per city, hand-written around its landmark
export default { id:'LON', draw(kit, { hour, weather, uid }) { return '<g>…</g>'; } }   // landmark + city layer only; no sky

// src/art/portraits.js
portrait(params, uid) → '<svg viewBox="0 0 120 150">…</svg>'   // an engraved cameo, profile silhouette from PERSON.portrait
```
Each vignette must be **recognisable in silhouette** (the Eiffel Tower, the Riesenrad and the Stephansdom, the Galata Tower and Hagia Sophia, the Parthenon on its rock …) and must differ from every other in composition, not only in its landmark.
