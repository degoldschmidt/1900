# Design-value register

Values chosen by design rather than transcribed from a period source: balance constants, minimum
change times where no guide prints one, delay odds, thresholds. Each one has an id `DV-###` that
the canonical rows using it cite (`src_or_dv` in transfers, min_change and institutions; `dv_id`
in params). Design values are banned in services, stops, fares, calendar and zones: those hold
only transcribed, cited values (validator V02).

The historian reviews this register at gate G3 for anything passing as history, and each game's
About screen lists the design values its bundle uses.

## Format

Each design value is a level-2 heading `## DV-<number> — <name>` (three or more digits; em dash,
en dash or hyphen) followed by a field list:

```
## DV-001 — Minimum change at a frontier station
- value: 15
- unit: minutes
- rationale: No guide prints a minimum change here; 15 minutes lets the printed
  connection work, which the guide implies by printing it.
- used-by: min_change.csv (STATION-ID)
```

- `value` (required): JSON when it parses as JSON (`15`, `0.25`, `[1, 2]`, `{"open": "09:00"}`,
  `"text"`), otherwise kept as text.
- `unit` (required): e.g. minutes, seconds, per-mille, hours, GBP farthings.
- `rationale` (required): why this value; what period evidence, if any, bounds it.
- `used-by` (informational): the tables and rows that cite it.

A field may continue on indented lines. Ids are never reused: a retired value keeps its section
with a note in its rationale. Examples inside fenced code blocks (like the one above) are ignored
by the parser (`tools/schema/design-values.ts`).

## Register

(No design values yet.)
