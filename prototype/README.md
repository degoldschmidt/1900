# Project 1900 prototypes

First playable prototypes of the committee's three top-ranked concepts, each a separate browser game:

| Game | Concept | Build output |
|---|---|---|
| `games/c07-departure` | C07 The Departure Is the Turn | `dist/c07-departure.html` |
| `games/c01-masters` | C01 Several Masters, One Truth | `dist/c01-masters.html` |
| `games/c04-legends` | C04 The Legend Portfolio | `dist/c04-legends.html` |

The approved plan is `PLAN.md`; decisions and events are logged in `DECISIONS.md`.

## Commands

```
npm install            # pinned toolchain; never run `playwright install` (Chromium is at /opt/pw-browsers)
npm run typecheck
npm test               # vitest: kit, tools and game tests
npm run build          # dist/<game>.html, .debug.html and .artifact.html (all, or: npm run build -- c07)
npm run e2e            # Playwright against the built pages
npm run check          # all of the above plus the static checks
```

Tools are TypeScript files run directly by Node 22 (type stripping), so imports carry `.ts` extensions and code uses only erasable syntax (no enums, namespaces or parameter properties).

## Layout

- `kit/` — shared plumbing only: time and calendars, the event queue and simulation harness, keyed random draws, the dated parameter layer, money, timetable routing, the record store, the particle hunter, data loading. No game rules.
- `games/<game>/` — each game's rules, views, UI, scenarios and tests. Games never import each other.
- `data/` — sources, transcriptions, canonical CSVs, design-value register, historian review.
- `tools/` — discovery, page fetching, cropping, keying, validation, compilation, build and checks.
- `scans/` — downloaded page images (git-ignored; never committed).

## Rules that keep simulations replayable

Game time is an integer number of seconds since 1900-01-01 GMT. Kit and rule code may not use `Math.random`, `Date`, `Intl`, `localeCompare`, `for…in`, transcendental `Math` functions or `**`; every random draw is keyed by (seed, purpose, ids). `npm run check:static` enforces this, the import boundaries, and that no source file is caught by the repository's `.gitignore` (which ignores `lib/`, `build/`, `env/`, `var/`, `downloads/`, `*.log`, `*.spec` and `*.manifest` at any depth).

## Data

Historical facts are transcribed from period guides with a citation on every cell; balance values live in separate design-value files. Synthetic fixtures (identifiers prefixed `SYN_`) exist only for tests and can never be compiled into a release build.
