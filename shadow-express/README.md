# Shadow Express

A browser prototype of a spy journey game in the manner of inkle's *80 Days*: the globe is the home screen, every city has a departure board, and journeys play out on the map with short story cards. Instead of going round the world, you carry five orders across Europe in spring 1914, each with a deadline, while three enemy agents hunt you with hidden movement. You never see them move; you hear of them through rumours, porters, salesmen and the Bureau's delayed reports. Hotel registers, frontier checks, telegrams and passenger lists are the traces they follow.

Original art, text and name; nothing is taken from *80 Days* but the principle that the journey is the play.

- `game.html`: the page (HTML, CSS and the game's script).
- `land.json`, `land-lo.json`: coastlines (Natural Earth via world-atlas: 50m for Europe and its seas, 110m elsewhere).
- `build.mjs`: `node build.mjs` writes `index.html`, the published single-file page.
- `prep-land.mjs`: how the coastlines were cut down (needs the `world-atlas` and `topojson-client` npm packages).

The page loads d3 7.8.5 from cdnjs and its fonts from Google Fonts. Saves go to the browser's local storage.
