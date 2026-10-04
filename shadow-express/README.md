# Shadow Express

A single-page browser spy game in the manner of the great travel-and-choice games: the globe is the home screen, every city has a departure board, and journeys play out on the map with story cards.

**Version 2, "July 1914"**
- **Setting**: the July Crisis, from the shots in Sarajevo on 28 June to Britain's declaration of war on 4 August.
- **The player**: a freelance agent of the Secret Service Bureau, made in an RPG-style creator: name and engraved likeness, a past that brings two borrowed names, skills and languages bought with points, virtues and vices, a starting kit, an old acquaintance.
- **Living under cover**: postings in Vienna, Belgrade and Berlin, days or weeks at a time. A legend for each name in each city, lodgings that keep registers, a local police watch that rises with every slip and falls with quiet days.
- **Journeys**: rarer and riskier. Whole itineraries are booked at once, delays show only on the way, connections can be missed, and frontier controls, station police and departure shadows all leave traces.
- **The operations**: nine orders from London in three acts (one of them optional) and three favours asked by the people you meet.
- **The hunters**: three of them, working from what the enemy actually knows: hotel registers, passenger lists, frontier books, wires, bribes, faces.

Original art, text and name. The dates and headlines are real; the people are invented, and so is what the crisis does to each train, frontier and price.

## Layout

- `src/data/`: the world and the story, as plain data.
  - Places and travel: cities, nations, lines with frontier stations, services, the calendar.
  - People and play: covers, people, hunters, items, operations (`ops/`) and storylets (`stories/`).
  - The shapes are fixed in `docs/CONTRACTS.md`; the ids and file owners are listed in `docs/REGISTRY.md`.
- `src/core/`: the engine. It has no DOM, and Node imports it directly.
  - World and travel: the calendar's effects (`world.js`), timetable and routing (`timetable.js`).
  - The enemy: what it knows (`enemy.js`), the hunters on the timetable (`hunters.js`).
  - The game: storylet conditions and effects (`storylet.js`, `game.js`), the time loop with controls, encounters and contacts (`sim.js`), operations (`ops.js`), the player's actions and the cards (`actions.js`).
  - The validator (`schema.js`).
- `src/art/`: the soot-and-engraving kit (`kit.js`), the frame for a city scene (`frame.js`), one hand-drawn vignette per city (`vignettes/`), engraved portraits and map glyphs. `docs/ART.md` is the style guide.
- `src/ui/`: the engraved globe, the ledger (city, departures, orders, people, case, covers, dossier), the cards and the boot loop.
- `land.json`, `land-lo.json`: coastlines from Natural Earth via world-atlas (`prep-land.mjs` cut them).

## Build, test, play

These commands use esbuild and Playwright from `../prototype/node_modules`.

```
node test/validate.mjs            # every data file against the contracts (errors fail)
node --test test/*.test.mjs       # validator, world, timetable and engine rules
node test/bots/run.mjs 200        # whole campaigns by careless, competent and exploit bots
node tools/sheet.mjs PAR,VIE      # a contact sheet of vignettes at four hours (also --portraits, --glyphs)
node build.mjs                    # build/dev.html for testing
node test/e2e.mjs                 # Playwright on desktop and phone, with screenshots in build/shots
node test/perf.mjs                # frame times under a 4× CPU throttle
node build.mjs --release          # index.html, the published page
```

The page loads d3 7.8.5 from cdnjs and its fonts from Google Fonts; everything else is inline. Saves go to the browser's local storage. Version 1 is kept as `v1-game.html` (`node tools/v1-build.mjs`).
