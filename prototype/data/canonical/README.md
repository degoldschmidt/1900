# Canonical data

The transcribed historical facts every game is compiled from. Each file here is one table; each
row is either cited to a page of a period source or tied to a design value. The schema is defined
in code in `tools/schema/canonical.ts`; this folder keeps a header-only file for every table, so
it documents itself.

```
keyed crops (data/raw)  →  tools/normalize/normalize.ts  →  data/canonical/*.csv
data/canonical + data/design/DESIGN_VALUES.md  →  tools/validate/run.ts (V01–V12)  →  build/reports/validation.md
validated data + games/<game>/data-manifest.json  →  tools/compile/compile-bundles.ts  →  build/data/<game>.bundle.json
```

## Two rules

**Node-only transcription.** For every train on a needed corridor we copy its times at the
games' cities and frontier stations, its header (number, classes, name) and the footnotes. Halts
in between are skipped, since no game lets a traveller board or alight there. This selects what
to copy; it approximates nothing: every time that is written is exactly as printed.

**One truth edition per segment per date.** A segment (`segments.csv`) is a stretch of line a
game needs, such as Berlin–Eydtkuhnen. `segment_sources.csv` names, for each date range, the
edition whose timetable is the truth on the ground for that segment (`rank` 1). Other guides
may be transcribed for the same segment at higher ranks; they only cross-check (V04 lists their
differences as warnings). Two rank-1 rows for one segment on one day is an error (V07). A train
serving several segments is the truth on the intersection of their rank-1 ranges and its
edition's validity. A transcribed issue holds until the next transcribed issue of its family:
`editions.valid_to` is set to the day before the next one starts, with `gap_flag` = y when that
end date is our assumption rather than printed.

## File format

- UTF-8, comma-separated, RFC 4180 quoting (a field containing a comma, a double quote or a line
  break is quoted and its quotes doubled), one header row exactly as in the header file, LF line ends.
- Values are trimmed; an empty value means "none". Lists are semicolon-separated (`1;2;3`).
  Flags are `y` or `n`.
- Dates are ISO Gregorian `1914-08-01` or Julian `J1914-07-19` (Russia; 13 days behind between
  March 1900 and February 1918). `calendar.date_greg` must be Gregorian and `date_jul` Julian;
  both, when given, must name the same day (V07).
- **Every date range is inclusive at both ends** (`to` is the last day). An empty `to` is
  open-ended. The compiler converts to the kit's conventions (see below).
- Times are `HH:MM` (24-hour), local to the station's railway zone on that day, exactly as
  printed after reading the guide's notation; `arr_dayoff`/`dep_dayoff` count days after the
  service day, which is the day of the train's first printed departure (offset 0).
- Money is an integer in minor units: GBP farthings (1d = 4, 1s = 48, £1 = 960), FRF/BEF/CHF
  centimes, DEM pfennig, NLG cents, AUK heller, RUB kopecks. A fare is in the currency of the
  country where the journey starts (V08).
- Identifiers are stable text keys. `SYN_`-prefixed identifiers are synthetic and exist only in
  test fixtures under `tools/*/test/fixtures/`; a bundle containing them is never released.

## Citations

A `src` value names where a value was read:

```
<source_id>:p<page_seq>:<table_ref or ->:<crop_id or ->:<cell or ->
BCG1914-06:p412:T254:T254-a:c3r12
```

`source_id` and `page_seq` must exist in `sources.csv` and `pages.csv` (V02). Cells follow the
keying tools: `c<col>r<row>` a body cell, `c<col>r<row>-<row2>` a stop printed on an arrival and
a departure line, `h<line>c<col>` a header cell, `l<subcol>r<row>` a label cell, `f<n>` a footnote
line. Bundles keep one citation per (source, page, table), so the game can show "Bradshaw's
Continental, June 1914, p. 412, table 254" for every time.

## Design values

A value chosen by design (no source prints it) is a `DV-###` entry in
`data/design/DESIGN_VALUES.md` (format described there). Rows cite it in `src_or_dv`
(transfers, min_change, institutions, with `basis` = design) or `dv_id` (params, when
`date_basis` or `value_basis` is design). **Design values are banned in services, stops, fares,
calendar and zones**, which hold only transcribed, cited values (V02). Every design value a
bundle uses is listed in the bundle and on the game's About screen.

## Tables

| File | Key | Holds |
|---|---|---|
| `sources.csv` | source_id | A physical source (one digitised volume): library, title, access (`full`, `pdus`, `search-only`, `none`), terms |
| `pages.csv` | source_id, page_seq | Pages we use: printed page number, content (`title`, `table`, `handbook`, `index`, `notation`, `footnotes`, `ads`), tables on it, image sha256 |
| `editions.csv` | edition_id | A timetable issue: its source, family (e.g. Bradshaw's Continental), validity, notation file, gap flag. Editions of one family never overlap (V07) |
| `segments.csv` | segment_id | A stretch of line a game needs: end stations, tier (`A`, `B`, `C`, `W` wartime), games |
| `segment_sources.csv` | segment_id, edition_id, date_from | Which edition is the truth (rank 1) or a cross-check (rank > 1) for a segment, when |
| `jurisdictions.csv` | jur_id | States and their subdivisions with legal effect (registration, police) |
| `cities.csv` | city_id | A city, its jurisdiction and civil time zone (no citation column: its facts are its stations' and jurisdiction's) |
| `stations.csv` | station_id | A station, its city, railway administration, frontier flag and frontier pair; lat/lon are a modern gazetteer position used only to check speeds (V03) |
| `station_aliases.csv` | alias_as_printed, family | How each guide family prints each station; the normaliser maps labels through it |
| `zones.csv` | zone_id, from | A clock: offset in seconds east of Greenwich (odd seconds allowed, e.g. Petersburg +7278), railway or civil |
| `station_zones.csv` | station_id, zone_id, from | Which railway clock a station keeps, when (V09: exactly one on every day of every edition using it) |
| `services.csv` | service_id | One printed train column in one table of one edition: train_key (identity across editions), number, name, operator, mode, classes, sleeper, the running marks as printed, the running rule (DSL), segments served |
| `stops.csv` | service_id, seq | Its times at node stations: local arrival and departure, day offsets, raw cell text, flags (`customs`, `passport`, `gauge`, `arr_only`, `dep_only`, `request`), status |
| `footnotes.csv` | edition_id, table_ref, mark | Footnote text as printed |
| `running_rules.csv` | edition_id, table_ref, mark | The interpretation of a footnote mark as a running rule (`none` if it does not concern running days), who interpreted it and the historian who reviewed it. Combined marks are written `a+b` |
| `through_links.csv` | edition_id, from_service_id, to_service_id, station_id | Through carriages: stay aboard from one train into another |
| `transfers.csv` | from_station_id, to_station_id | Minimum minutes to change between two stations (directional), kind, basis |
| `min_change.csv` | station_id | Minimum minutes to change trains within a station, basis |
| `fares.csv` | edition_id, from, to, scope, class, single_return | Fares as printed (`raw`) and in minor units |
| `params.csv` | row_id | The dated parameter layer: (param, key) valid from..to, tier 0–2, JSON value, separate date and value basis, public flag |
| `calendar.csv` | event_id | Tier-0 world events with Gregorian and Julian dates, local time and zone, effects (params row ids starting that day) |
| `institutions.csv` | inst_id | Police, banks, posts and others: jurisdiction, city, parent, validity, record kinds they read, basis |
| `waivers.csv` | waiver_id | Historian waivers (see below) |

Every row of a table with a `src`, `src_or_dv` or `dv_id` column carries one (V02). The source
tables (sources, pages, editions, segments, segment_sources), cities and running_rules have no
citation column; a running_rules row must interpret a mark recorded in `footnotes.csv`.

### Running rules

`services.running_rule` (and `running_rules.rule_dsl`) is a small language, specified with its
compilation in `tools/schema/running-rule.ts`: semicolon-separated clauses `daily`,
`dow:Mo,Th`, `except-dow:Su`, `from:1914-05-01`, `to:1914-09-30`,
`dates:1914-06-01..1914-09-30` (repeatable), `also:1914-08-03`, `except:1914-12-25`; dates may be
Julian. A footnote mark becomes a rule only through a reviewed `running_rules.csv` row, never
automatically. The printed rule is compiled over the bundle window (a player keeps reading an old
guide); whether the train really runs also needs the truth ranges (above).

### Stop status and waivers

`stops.status` is `agree` (both keyers read the same), `resolved` (a resolver chose a reading),
`waived`, or, while work is in progress, `illegible` or `unresolved`. Only agree, resolved and
waived compile (V11). A waiver is a row in `waivers.csv` — `waiver_id`, `src` (the one cell
waived, cited as above), `note` (the historian's reasoning), `historian`, `reviewed_on` — accepting
a cell that stays illegible or disputed; the normaliser then leaves that time empty and marks the
stop `waived`. V11 requires a waiver whose cell lies within every waived stop's `src`, and also
blocks illegible or unresolved keyed cells in any table that already has services.

### Notation files

`notation/<edition_id>.json`, named by `editions.notation_file`, records the guide's own
conventions, cited to its explanation page: 12- or 24-hour clock and how a.m./p.m. or night is
shown (marker cells, heavy type, underlining), separators, ditto, pass-through and not-served
signs, arrival/departure line markers, what a single-line time means, the running rule of an
unmarked column, signs that set stop flags, sleeping-car markers, the meaning of each header
line, and per table the operator, mode and segments. The full format is documented in
`tools/schema/notation.ts`.

### Validator options

`validation.json` (optional) sets V05's options: `originCity` (default: the city named
"London"), `reachHours` (72), `reachSampleDays` (7), `frontierHours` (6), `maxThroughWaitHours`
(12), `openEndedDays` (366).

## In the bundle

The compiler turns dates into day numbers (days since 1900-01-01 Gregorian), times into seconds
after midnight (−1 when not printed), classes into a bit mask and flags into bits. The kit treats
params, zones, station zones and institutions as valid on `[from, to)`, so their `to` becomes the
CSV `to` + 1; truth ranges, running-rule ranges, editions' `validTo` and the bundle window stay
inclusive.
