# Postcards: the scene contract

Every city's picture is a picture postcard of 1914, after a Viennese card the player sent: *Gruss aus Wien*. The cards
share one frame family:

- cream card stock, a little foxed;
- a painted band with gold edges and whiplash vines;
- the city's flower in the corners;
- a ribbon with the greeting and a "1914" cartouche.

Inside the frame is a chromolithograph view of the city's landmarks, alive:

- lit by the true sun over that city at the game's hour;
- under the day's weather;
- turning from early-summer green to late-summer gold as the campaign runs;
- dressed by the crisis: newspaper bills in the tension, mobilisation posters, flags and marching soldiers at war.

Two cards set the standard: **`src/art/postcards/VIE.js`** (the model card) and **`src/art/postcards/LON.js`**. Read both
before drawing a city. Match their density of detail and their care.

## Files

| File | What it does |
|---|---|
| `src/art/postcards/<ID>.js` | One city: its frame, greeting, flowers, inks and three drawing functions. The only file a city's author touches. |
| `src/art/postcard/paint.js` | The drawing kit (`P`): inks, shapes, buildings, trees, water, paving, people, lamps, flags, the crisis. |
| `src/art/postcard/sprites.js` | Moving parts (`T`): trams, an omnibus, carriages, a motor car, a cart, boats of six kinds, walkers, a column of soldiers. |
| `src/art/postcard/light.js` | The hour, weather and season turned into inks. Every ink passes through it. |
| `src/art/postcard/frame.js` | The frame, the greeting's layout (from Federant's measured widths), and the flower kit (`F`). |
| `src/art/postcard/compose.js` | A state turned into four still layers plus moving parts. Runs in Node too. |
| `src/ui/postcard.js` + `postcard.css` | Puts a card on the page: rasterises the layers, animates the parts with CSS transforms, crossfades when the light changes. |
| `tools/postcards.mjs` | The contact sheet. |
| `test/postcards.test.mjs` | The contract's checks. |

## The card

The card is 600 × 400. The scene shows through the window `WIN = { x: 26, y: 26, w: 548, h: 348 }`, which has rounded
corners: the top right is the most rounded, at radius 70.

Draw past the window's edges where it helps. The frame covers everything outside the window.

Keep anything that must be seen out of these zones:

- **The title** covers the top. The ribbon spans y 34–80, from x 30 to wherever the greeting ends (up to about x 480).
  The cartouche comes after it (about 70 px wide, y 33–75). Tall landmarks may rise behind the ribbon, as St Stephen's
  spire does, but a clock face or a statue must sit below y ≈ 86.
- **The corner flowers** cover about 60 px in from each corner.
- **The ornament** sits at the foot, x 250–350, below y 356.

Set `horizon` to the y where sky meets land or water. The sky's gradient runs down to it.

## A city's module

```js
export default {
  id: 'VIE',                    // the city's id in src/data/cities.js
  greet: 'GRUSS aus WIEN',      // capitalised words are set large, the small words between at 0.58
  nation: 'AH',                 // the city's nation (decides the crisis, uniforms, bills); must match cities.js
  flag: 'AH',                   // the flag its windows fly at war (Budapest flies HU, though its nation is AH)
  flower: 'poppy',              // unique among all cards
  flower2: 'marguerite',        // the small flower at the frame's foot (may repeat between cards)
  frame: { band: [light, dark], gold, ink, leaf: [light, dark], year, halo },  // see the table below
  horizon: 292, clouds: 4, wind: 1,          // clouds: how many on a clear day; wind: which way clouds and smoke go
  birds: { c: '#f6f5ef', n: 4 },             // optional: gulls (a colour) instead of swifts
  pal: { key, wall, stone, roof, glass, sash, ground, water, iron, … },    // the card's inks, by name
  flowerArt(F) { … },          // the corner flower, centred on 0,0, about 20 px in radius
  flowerArt2(F) { … },         // the foot flower
  back(P, T, st) { … },        // far things: skyline, distant landmarks, water, boats behind piers
  mid(P, T, st) { … },         // the city: the main landmarks, the street, the middle-distance crowd, movers
  front(P, T, st) { … },       // the foreground: big figures, lamps, a waiting carriage, a wall
};
```

Each drawing function returns an SVG string in card coordinates.

`st` is the state: `{ t, weather, season, war, day, sun }`. Use it for anything bespoke. For example, London's clock
shows the game's time through `P.clock`.

## Layers and where things move

There are four still pictures, drawn once per light and cached:

1. **sky**, made by compose: the gradient, the sun or moon, stars and high cloud.
2. **back**
3. **mid**
4. **front**

The moving parts sit between them, in slots. The slot is chosen by the layer they were declared in:

| Slot | Above | Below | Typical parts |
|---|---|---|---|
| `sky` | sky | back | clouds and birds (compose adds these) |
| `back` | back | mid | boats behind a bridge, distant smoke |
| `street` | mid | front | trams, carriages, walkers, soldiers |
| `fore` | front | — | walkers in the very front |

Pass `{ z: 'fore' }` (or another slot) to override.

So a steamer that must pass behind a bridge's piers is declared in `back`, and the bridge is drawn in `mid` with its
arches cut through (`fill-rule="evenodd"`). See London's `bridge()`.

Depth: wrap distant drawing in `P.far(d, () => …)`, where d runs from 0 (the front) to 1 (the horizon). Fog and haze
thicken with it and the key lines thin.

## The kit (`P`)

**Inks.** Never write a lit colour into the SVG yourself: every fill goes through the light.

| Call | Gives |
|---|---|
| `P.ink(c, depth?)` | the ink in this light (`c` is a palette key or a hex) |
| `P.dark(c, k)` | the shadow stone |
| `P.light(c, k)` | the lit stone |
| `P.keyC()` | the key line's colour |
| `P.glow(c)` | something that emits light (lamps, lit windows): the night does not dim it |

**Marks.**

| Call | Draws |
|---|---|
| `P.fill(d, c, { w, k:false, op })` | a flat ink with a key line |
| `P.flat(d, c, { op, raw })` | no line |
| `P.shade(d, c, k)` / `P.lite(d, c, k)` | the shadow and highlight stones |
| `P.line(d, c, w, { op, dash })` | a line |
| `P.stipple(d, c, n, { box, op })` | crayon grain on big stone faces |

**Shapes** (path data):

- `P.rect`, `P.poly`, `P.circle`, `P.ellipse`;
- arches: `P.arch` (round), `P.gothic` (pointed);
- roofs and spires: `P.dome`, `P.onion`, `P.spire`, `P.gable`;
- `P.blob` (a tree crown, a cloud).

**Buildings.**

- `P.facade(x, by, w, h, o)` is a town house: windows that light at dusk, a shop with a striped awning, and a roof
  (`mansard`, `pitch`, `gable`, `dome` or `flat`). Its options are:
  - `{ c, roof, roofC, side, cols, floors, shop:[a,b], balconies, arched, lit, placard:false, flagSpot:false }`.
  - In the crisis it dresses itself with bills, posters and flags from the windows.
- `P.row(x0, x1, by, o)` is a run of houses, with style `north`, `south`, `paris`, `east` or `orient`.
- `P.windows(x, y, w, h, cols, rows, o)`
- `P.columns(x, by, w, h, n, c)`
- Draw your own landmarks with these. Gothic helpers (pinnacles, crockets, tracery) are in VIE.js; copy what you need
  into your own module.

**Nature.**

- `P.tree(x, y, s, kind)`, where kind is `round`, `plane`, `poplar`, `cypress`, `palm`, `pine`, `birch` or `willow`.
  Leaves follow the season and are bare in winter; evergreens keep `L.leaf.ever`.
- `P.hedge(x0, x1, y, h)`
- `P.water(y0, y1, { seed, shimmer, x0, x1 })`, with glints that move.
- `P.paving(y0, y1, { vx, seed })`, which grows puddles in rain and snow in winter.

**People.**

- `P.person(x, y, s, kind, o)` is about 30 px tall at s = 1. Kinds:
  - civilians: `gent`, `boater`, `lady`, `girl`, `child`, `worker`, `newsboy`, `peasant`;
  - clergy and the sea: `priest`, `nun`, `sailor`;
  - uniforms, by nation: `soldier`, `officer`.

  Options: `{ c, legs, hat, parasol, dir, stride }`.
- `P.figure(x, by, s, 'gent'|'lady', o)` is a large figure seen from behind (about 100 px at s = 1), for the foreground.
- `P.crowd(x0, x1, y, n, { s, seed, kinds })` is a scatter of strollers. In the crisis it takes in newsboys, then
  soldiers.

**Things.**

- `P.lamp(x, y, s, kind)`, where kind is `iron` (three lanterns), `single`, `bracket` or `globe`. It glows and flickers
  after dusk.
- `P.flag(x, y, s, nation)` is a staff whose flag waves.
- `P.smoke(x, y, s, { dark })` is a rising plume.
- `P.clock(x, y, r, { tz })` is a dial whose hands keep the game's time. `tz` is minutes from CET, so London is -60.
- `P.spin(sprite, { x, y, dur, dir })` turns a part about its anchor (windmill sails, a wheel).

**The crisis.**

- `P.facade` dresses itself.
- Where there are no house fronts, call:
  - `P.wall(x, y, w, h)` for a bill or poster spot;
  - `P.flagAt(x, y)` for a window flag.
- **Always** call `P.setStreet(y, x0, x1, s)` once. That is where soldiers march at war and a newsboy walks in the
  tension. Choose a level, open stretch where feet stand, at a scale where people look right.
- For anything bespoke, read `P.war` (`peace`, `tension` or `war`): flags on a public building, a crowd at a poster.

**Movers.**

- `P.mover(sprite, { path, dur, offset })` follows a path. Each path point is `[x, y, scale, t (0..1), opacity]`.
- `P.cross(sprite, { y, s, dir, dur, rest, offset, x0, x1, z })` crosses on a level from off one side to off the other.
- Make paths whose ends are hidden: off the window, behind a building, or faded at the vanishing point.

## Moving parts (`T`)

| Call | Moves as |
|---|---|
| `T.tram({ c, band, number, s, dir })` | three-quarter view, coming down a street toward us |
| `T.tramSide(o)` | broadside |
| `T.omnibus({ c, adText, fleet })` | |
| `T.fiacre({ horses: 1|2, body, hood, horse, wheelC })` | two frames of the trot |
| `T.motorcar({ c })` | |
| `T.cart({ load, horse })` | |
| `T.steamer({ hull, house, funnel:[body,top], paddle, flag })` | its smoke rides with it |
| `T.tug(o)` | |
| `T.sail({ rig: gaff|lateen|sprit, sailC, hull })` | |
| `T.gondola({ felze })` | |
| `T.caique({ rowers })` | |
| `T.rowboat(o)` | |
| `T.walkers({ kinds, dresses, coats, seed, s, dir })` | two frames of the stride |
| `T.column({ n, nation, flag })` | soldiers in step |

Every sprite takes `s` (scale) and `dir` (1 to the right, -1 to the left).

`T.place(sprite, x, y)` draws a sprite standing still into a layer, such as a fiacre waiting.

The parts come out lit by the same light. Draw a bespoke moving part (a funicular car, a transporter bridge's gondola)
as a sprite object `{ svg, w, h, ax, ay }`. Copy the shape of sprites.js: a standalone `<svg>` drawn with `P`'s inks.

## The frame and the flower (`F`)

Frame inks are printed, not lit. Give:

- `band` (the two stops in the table below);
- `gold`;
- `ink`, the greeting, which must read well on cream;
- `leaf`;
- `year`, the 1914;
- `halo`, the outline behind the letters.

Flowers are drawn with the flower kit. Leaves go first (behind), then petals, then the centre. Aim for a silhouette
that reads at 30 px.

| Call | Draws |
|---|---|
| `F.petal(len, wid, c, shape, o)` | one petal; shape is `round`, `point`, `notch`, `heart`, `frill` or `strap` |
| `F.radial(n, len, wid, c, { rot, shape, vein, lite })` | n petals around the centre |
| `F.disc(r, c, { dots, lite })` | a centre |
| `F.leaf(len, wid, angle, c, { shape })` | a leaf; shape is `lance`, `oval`, `heart` or `serrate` |
| `F.stem(d, c, w)` | a stem |
| `F.bell(w, h, c)` | a hanging bell |
| `F.spike(len, size, c)` | a spike of florets |
| `F.cluster(r, n, size, c, { petals })` | a cluster |
| `F.berry(x, y, r, c)` | a berry |
| `F.cup(w, h, c, { flame })` | a cup flower |
| `F.at(x, y, body, angle, scale)` | places and turns any of these |
| `F.I` | the frame's inks |

## Rules

- **Your own.** No other card may have your flower or your band colour. No two cards may share more than two palette
  inks, leaving aside `key`, `glass`, `sash`, `gold` and `iron`, so name your inks freshly.
- **1914.** Draw only what stood or ran in July 1914: dress, vehicles, flags, and buildings as they then were.
  - The Petersburg card says St Petersburg, not Petrograd.
  - Sarajevo's Latin Bridge is where the archduke was shot on 28 June.
  - Belgrade was shelled from the river from 29 July.
- **The light.** Check dawn, noon, dusk and night, and rain, fog and storm.
  - Windows must light at night: `P.facade`, `P.windows` or your own windows with `P.wr()` (two draws a window, as in
    VIE's `leftHouse`).
  - At least one lamp must glow.
- **Seasons.** Spring, summer, autumn and winter must all look right. The kit does the trees and the snow on roofs and
  paving. Bespoke greenery must use `P.L.leaf` (`leaf`, `dark`, `light`, `ever`), and in winter `leaf` is null.
- **Budget.** A card must take under 120 ms to draw in Node and stay under 420 KB of SVG across its layers. It may have
  at most 70 moving parts and must have at least 3 movers.
- **Style.** Draw in chromolithograph:
  - flat inks under a dark key line, a shadow stone and a lit stone;
  - stipple on big stone faces;
  - warm whites;
  - strollers in summer whites with boaters and parasols, carriages, and a tram where the city had one.

  It should be a picture someone would buy at a kiosk and post home.

## Checking

```sh
CARDS=PAR,BRU node --test test/postcards.test.mjs        # the contract, for your cards
node tools/postcards.mjs PAR --set all --cols 3 --width 420 --out build/pc-PAR.png   # every light, weather, season, war
node tools/postcards.mjs PAR --cells "12:clear:peace" --cols 1 --width 900 --out build/pc-PAR-big.png
node tools/postcards.mjs PAR --cells "12:clear:peace" --shots 2 --every 3000 --out build/pc-PAR-anim.png  # does it move?
```

A cell is `hour:weather:war[:season[:day]]`. Look at every sheet: open the PNG and judge it against VIE and LON. Fix
anything that collides with the title or the corner flowers, reads muddy at night, or looks empty.

## The cards

The frame bands were chosen to be at least ΔE 16 apart. Use them as given.

The scenes are suggestions: keep the landmark, choose the view.

| ID | Greeting | Nation / flag | Flower / foot flower | Band | Title ink | Scene, and what moves |
|---|---|---|---|---|---|---|
| VIE | GRUSS aus WIEN | AH / AH | poppy / marguerite | #41a19b #265a5a | #1d4a3a | St Stephen's, the Secession, a tram coming toward us, a fiacre (drawn) |
| LON | GREETINGS from LONDON | GB / GB | tudor-rose / bluebell | #4a64a0 #2b3b5c | #8a1d24 | Parliament, the Clock Tower (live hands), Westminster Bridge, boats (drawn) |
| PAR | SOUVENIR de PARIS | FR / FR | lilac / violet | #93bead #4f6863 | #5a2a5e | The Seine and the Eiffel Tower from a quai, bouquinistes, a Morris column (posters at war), a Guimard Métro entrance; a bateau-mouche, taxis, strollers |
| BRU | SOUVENIR de BRUXELLES | BE / BE | yellow-iris / forget-me-not | #81373e #46252b | #2a1a10 | The Grand-Place: the Town Hall's spire, gilded guild houses, flower-market umbrellas, lace sellers; a dog-drawn milk cart, a tram |
| AMS | GROETEN uit AMSTERDAM | NL / NL | tulip / daffodil | #c66b2f #693f24 | #1f3a6e | A canal with gabled houses, a humpbacked bridge, the Westerkerk tower; a barge, cyclists, a street organ, a turning windmill |
| FLU | GROETEN uit VLISSINGEN | NL / NL | sea-thrift / sea-lavender | #809eb3 #465866 | #7a3a1a | The harbour boulevard, the De Ruyter statue, the Gevangentoren, a lighthouse, bathing huts; the night boat to Folkestone, brown-sailed fishing boats, gulls |
| COL | GRUSS aus CÖLN | DE / DE | grapevine / rose | #638137 #374a28 | #7a1f2a | The cathedral's twin spires over the Rhine, the Hohenzollern Bridge (1911); a train crossing in smoke, a white paddle steamer, barges |
| HAM | GRUSS aus HAMBURG | DE / DE | heather / forget-me-not | #306d88 #1e4050 | #8a1d24 | The harbour, the Landungsbrücken towers, the Michel's copper spire; a three-funnelled liner, ferries, tugs, cranes, gulls |
| CPH | HILSEN fra KJØBENHAVN | DK / DK | marguerite / red-clover | #c63e2f #692824 | #1f3a5a | Nyhavn's coloured gabled houses and tall ships, the Børsen's dragon spire; a rowboat, cyclists, Dannebrog flags, gulls |
| BER | GRUSS aus BERLIN | DE / DE | cornflower / chamomile | #394960 #222e3c | #1f2f5a | The Brandenburg Gate and Quadriga, Unter den Linden; a motor bus, Droschken, strollers, guards (at war, the Guards march) |
| STO | HÄLSNING från STOCKHOLM | SE / SE | harebell / lingonberry | #418ad2 #264e75 | #7a2a1a | Gamla Stan from the water: the palace, Riddarholmen's iron spire; white archipelago steamers, rowboats, gulls |
| SPB | SOUVENIR de ST.-PÉTERSBOURG | RU / RU | lily-of-the-valley / chamomile | #22775e #17453b | #7a1f1a | The Neva: the Admiralty or Peter and Paul's golden needle, the Winter Palace, a Rostral column; a droshky, a steamer (white nights come from the true sun) |
| WAR | POZDROWIENIA z WARSZAWY | RU / RU | chestnut-blossom / cornflower | #846ca7 #483f60 | #5a1a2a | Castle Square: Sigismund's Column, the Royal Castle, Old Town houses; an electric tram, droshkies, pigeons |
| PRG | POZDRAV z PRAHY | AH / AH | linden / rosehip | #8d6b49 #4c3f31 | #7a1f1a | Charles Bridge with its statues and tower, the Vltava, the Castle and St Vitus on the hill, red roofs; boats, swans, a tram |
| MUN | GRUSS aus MÜNCHEN | DE / DE | hops / gentian | #78a8d9 #425d79 | #1f3a6e | Marienplatz: the New Town Hall and its Glockenspiel tower, the Frauenkirche's onion domes; a tram, a brewery dray with barrels |
| ZUR | GRUSS aus ZÜRICH | CH / CH | edelweiss / alpine-rose | #a8af64 #5a613e | #2a3a1a | The Limmat, the Grossmünster's twin towers, the Fraumünster's green spire, the lake and snowy Alps; a paddle steamer, swans, a tram |
| MAR | SOUVENIR de MARSEILLE | FR / FR | lavender / mimosa | #2fa8c6 #1d5d6f | #8a2a1a | The Vieux-Port, the transporter bridge (its gondola crossing), Notre-Dame de la Garde on its hill; lateen-sailed fishing boats, gulls |
| BAR | RECUERDO de BARCELONA | ES / ES | orange-blossom / geranium | #c6992f #695624 | #5a1a2a | The foot of La Rambla: the Columbus column, palms, flower stalls, a Modernista front; the port's ships, a tram, pigeons |
| MAD | RECUERDO de MADRID | ES / ES | carnation / jasmine | #b95b77 #623748 | #2a1a10 | Calle de Alcalá: the Cibeles fountain, the Puerta de Alcalá, the domed Metrópolis building; a tram, mule carts, a carriage |
| LIS | LEMBRANÇA de LISBOA | PT / PT | bougainvillea / jacaranda | #d8bf5a #726939 | #1e3e8a | The Tagus and the Praça do Comércio's arch, or the Alfama under the castle; a tram climbing, tan-sailed river barges, gulls |
| ROM | SALUTI da ROMA | IT / IT | laurel / acanthus | #9f5738 #553528 | #2a1a10 | The Colosseum and umbrella pines, the Arch of Constantine, or the new Vittoriano (1911); carrozzelle, priests, swallows |
| VEN | SALUTI da VENEZIA | IT / IT | lily / water-lily | #952323 #501b1e | #1f3a3a | The Molo: the Doge's Palace, the Campanile (rebuilt 1912), the Salute across the water; gondolas, a vaporetto, pigeons |
| TRI | SALUTI da TRIESTE | AH / AH | wisteria / iris | #9793be #51536b | #1f3a2a | The waterfront palaces of the Piazza Grande, the Molo San Carlo, Miramare white on the coast; Lloyd steamers, sailing ships, gulls |
| BUD | Üdvözlet BUDAPESTRŐL | AH / HU | paprika / folk-tulip | #30884a #1e4d31 | #a8282e | Parliament on the Danube, the Chain Bridge and its lions, Buda Castle; a paddle steamer, a tram on the embankment |
| SAR | GRUSS aus SARAJEVO | AH / AH | pomegranate / damask-rose | #653456 #382337 | #1f3a3a | The Miljacka and the Latin Bridge, the Vijećnica's stripes, minarets and the Sebilj; a tram, a horse cart, men in fezzes, pigeons |
| BEG | POZDRAV iz BEOGRADA | RS / RS | plum-blossom / basil | #1d3a7c #14264a | #8a1a1a | Kalemegdan over the Sava and Danube, the Cathedral's bell tower; river boats, an ox cart, peasants (at war, smoke over the river) |
| BUC | SALUTĂRI din BUCUREȘTI | RO / RO | peony / linden | #c48d92 #685055 | #1f2f5a | Calea Victoriei and the Athenaeum's dome; birje (cabs with velvet-coated drivers), strollers, pigeons |
| ODE | SOUVENIR d'ODESSA | RU / RU | acacia / sunflower | #c2a170 #675a44 | #1f3a5a | The Potemkin Stairs to the port, the Duc de Richelieu, acacia trees; the funicular's cars, ships, gulls |
| IST | SOUVENIR de CONSTANTINOPLE | OT / OT | judas-tree / ottoman-tulip | #287171 #1a4245 | #8a1a1a | The Golden Horn: Hagia Sophia and the Sultan Ahmed mosque's minarets, the Galata Tower; caïques, a paddle ferry, gulls |
| ATH | SOUVENIR d'ATHÈNES | GR / GR | olive / anemone | #7881d9 #424a79 | #1a2f5a | The Acropolis and the Parthenon above the Plaka, cypresses and palms; a carriage, evzones, swallows |
