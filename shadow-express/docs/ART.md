# Shadow Express v2 — art guide

The look is **soot and engraving**: a newspaper wood-engraving of 1900, cross-hatched ink on stained sepia paper, gritty with coal smoke. Every drawing is an SVG string built with the kit in `src/art/kit.js`. Read that file first: it is short, and its helpers are the vocabulary. `src/art/vignettes/LON.js` is the worked example.

## Vignettes (`src/art/vignettes/<CITY>.js`)

```js
export default { id:'PAR', draw(k, { hour, phase, weather, night }) { return '…svg elements…'; } };
```
- **Canvas** 640×240, y down. The frame (`src/art/frame.js`) draws the paper, the sky for the hour and weather, the night wash, lit windows, rain or fog, foxing and grain. You draw **the city layer only**: landmark, town, ground or water, people, boats, trains. Never draw sky, sun or moon.
- **Night is automatic**: draw the daytime engraving. Windows made with `k.windows` glow at night; you rarely need `night`, though you may add a lit café or a lamp's halo.
- **Horizon** between y≈150 and 195. Ground or water from there to the bottom edge (`k.ground(kind, y)` or `k.water(y)`).
- **Layers**, back to front:
  1. far town: `k.skyline(…, { far:true })`, `k.mountains(y)`, `k.haze(y, h)`;
  2. the landmark: big, crisp, dark outlines;
  3. the foreground: quay, bridge, boats, figures, lamps, trees.
- **Light** comes from the upper left:
  - faces in light: `'light'` or `'vert'` (stone);
  - faces turned away: `'dark'`;
  - deep shadow, doorways, undersides: `'black'`;
  - roofs: `'tiles'` or `'dark'`;
  - windows: `'glass'` (via `k.windows`);
  - foliage: `'stipple'`;
  - water: `k.water`.
- **Distance** fades: pass `{ far:true }` for sepia, thinner lines.

**Composition**
- The landmark must be **recognisable in silhouette at 320 px wide**. Exaggerate its defining shapes: the Eiffel Tower's taper and arches, the Riesenrad's spokes, the Galata Tower's cone, the Parthenon's columns on its rock.
- Make each city's composition **different from all the others**, not only its landmark. Vary:
  - where the landmark sits: left, centre or right third, near or far;
  - the viewpoint: across water, up a street, from a hill, from a quay, under a bridge;
  - what fills the foreground: water, cobbles, steps, a market, rails, palms, a railway yard.
  
  A few cities may show a train or a ship; most should not.
- Add life, sparingly: two to six small figures, a cab, a tram, a barge, smoke from chimneys. Soot is the grit: haze bands, smoke plumes and darker lower storeys.
- **Size**: keep the returned SVG under about 120 KB at noon. Use loops for repeats, never thousands of tiny paths. Keep coordinates to one decimal; `k.f(n)` rounds.

**Do not**
- No text or lettering, except an engraver's monogram if you must.
- No colour beyond the kit's palette. No gradients, no raster images, no external references, no `<script>`, no `<foreignObject>`.

**Check your work**:

```
node tools/sheet.mjs PAR,BRU --out build/sheet-a.png      # four hours each; add --weather rain, --scale 2
```
Then look at the PNG. Judge each vignette at noon and at night, at full size and at half (`--scale .5`): is the landmark unmistakable, is the composition its own, is the ink weight like LON's?

## Portraits (`src/art/portraits.js`)

```js
export function portrait(p, uid) → '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">…</svg>'
// p = { seed, sex:'m'|'f', hat, hair, beard, collar, age }   (values in docs/CONTRACTS.md §4)
```
- **Form**: an engraved oval cameo (a double inked oval frame on paper) with a head-and-shoulders portrait in **profile, facing left**: nose, lips, chin, ear, eye.
- **Shading**: the face mostly paper with fine hatching on the shadowed side; the clothes in dark tones.
- **Parameters**: every one must show clearly at 60 px wide. Each hat and collar is distinct; age shows as lines, a softer jaw and grey (paper) hair. The seed varies the nose, brow, jaw and neck so that no two people look alike.
- **Kit**: use `makeKit({ uid })`, include `<defs>${k.defs()}</defs>` in your SVG, and use `k.shape` and `k.line`.
- **Check**: `node tools/sheet.mjs --portraits`.

## Glyphs (`src/art/glyphs.js`)

```js
export default { loco:(uid) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">…</svg>', … }
```
- **Look**: small engraved map symbols on transparent ground. They must read at 16–24 px.
- **The set**, with these exact keys:
  - `loco`: a locomotive, facing right;
  - `steamer`, `coach`;
  - `walker`: a person on foot, for paths;
  - `sentry`: a frontier post with a striped box;
  - `barrier`: a closed frontier, a lowered boom;
  - `flood`, `plague` (a quarantine flag), `strike` (crossed hammers), `troops` (a row of bayonets);
  - `hunter`: a figure in a hat and long coat;
  - `eye`: watched;
  - `compass`: a compass rose;
  - `cartouche`: an empty engraved title frame, 64×32 inside the viewBox;
  - `stamp-secret`, `stamp-delivered`, `stamp-burned`: rubber-stamp rings, which may carry those words in capitals;
  - `seal`: a wax seal, the only place `k.blood` may fill;
  - `telegram`: a folded form.
- **Check**: `node tools/sheet.mjs --glyphs`.
