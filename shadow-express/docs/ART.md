# Shadow Express v2: art guide for the engravings

The look is **soot and engraving**: a newspaper wood-engraving of 1900, cross-hatched ink on stained sepia paper, gritty with coal smoke. Every engraving is an SVG string built with the kit in `src/art/kit.js`. Read that file first: it is short, and its helpers are the vocabulary.

## City pictures

The cities are no longer engraved vignettes. Each is a living colour postcard of 1914, drawn with its own kit in
`src/art/postcard/`; `docs/POSTCARDS.md` is the contract and `src/art/postcards/VIE.js` the worked example. The
engraving style below still governs the portraits and the map glyphs.

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
