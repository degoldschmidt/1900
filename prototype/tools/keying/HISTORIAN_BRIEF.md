# Historian brief

You are the historian reviewer for one game's data freeze (gate G3 in `PLAN.md`). The data were transcribed from period guides by double keying and resolution, then normalised into `data/canonical/*.csv`; every value cites where it was read (`source:p<page_seq>:<table>:<crop>:<cell>`). Your job is to find what the process could still get wrong: identities, interpretations, design values passing as history, and transcription errors the double keying missed. You work from the page images, not from memory: a verdict that is not backed by a cited page is an opinion and must say so.

## What you receive

- `data/canonical/*.csv` (stations, station_aliases, zones, station_zones, editions, segments, segment_sources, services, stops, footnotes, running_rules, fares, transfers, min_change, params, calendar, institutions, jurisdictions, waivers);
- `data/design/DESIGN_VALUES.md` (the design-value register);
- `data/raw/status.csv` and the side-by-side review pages `build/review/<source_id>-<table_ref>.html` (`node tools/review/side-by-side.ts <source_id> <table_ref>`);
- the page scans in `scans/<source_id>/` (fetched with `tools/fetch/fetch-pages.ts`; not committed) and the validator report `build/reports/validation.md` (`npm run data:validate`).

## The checks

### 1. Station identities and frontier designations
For every station in `stations.csv` used by the game: is the printed name (`station_aliases.csv`, `alias_as_printed`) the station we think it is? Watch for same-named stations (two Frankfurts), stations renamed between editions, a city's several termini (Berlin Friedrichstrasse / Schlesischer Bf. / Charlottenburg), and German / French / Russian / Polish forms of one place. For frontier stations (`is_frontier`, `frontier_pair_id`) confirm from the guide's own notes which station held customs and passport control on each side (e.g. Eydtkuhnen / Wirballen, Bentheim / Oldenzaal, Herbesthal / Welkenraedt) and which clock the printed times used.

### 2. Zones
For each zone row (`zones.csv`, `station_zones.csv`): the time standard and its offset in seconds, the dates, and the citation. In particular: Russian railway time (St Petersburg time) at and beyond Wirballen; Paris time and its offset; Mid-European time in Germany and Austria-Hungary; Amsterdam time in the Netherlands; GMT in Britain and Belgium. The guide's notation page usually states which time its tables print.

### 3. The blind sample (transcription)
Draw the sample yourself, with a seed you choose and record:

```
node tools/keying/sample.ts draw --seed <your seed> --label <label>
```

It takes 5% of the stop cells (body cells with a printed sign) of every resolved table and 10% of the fare cells (tables whose `layout.json` says `"table_kind": "fares"`), at least one per table, and writes `data/review/sample-<label>.csv` with **where** to look (`source_id`, `page_seq`, `table_ref`, `crop_id`, `kind`, `col`, `row`, `page_region` as `x,y,w,h` in the page image) but not what was transcribed. A zoom of each sampled cell is in `build/review/sample-<label>/<sample_id>.png`.

Re-read each cell **from the scan** (the zoom, or the page at `page_region`), following `tools/keying/KEYER_BRIEF.md`, and fill `reread_text`, `reread_marks`, `reread_sure` (`y`/`n`/`x`) and, if useful, `note`. Do not open the `.R.csv` files, the review pages or `stops.csv` until the sample is scored: the point is a reading the transcription cannot influence. Then

```
node tools/keying/sample.ts score --label <label> [--apply]
```

compares your reading with the resolved cells. A source whose sampled cells are more than **0.5%** wrong fails: the tables with errors are re-keyed (`--apply` marks their crops `rekey` in `data/raw/status.csv`). Before you accept a mismatch as a keying error, look again: if your own reading was wrong, say so in the note and correct the sample row; the score is re-run on the corrected file.

### 4. Waivers
Every cell left `illegible` (or disputed) that the game needs must be either re-read from a better scan or waived. A waiver is a row in `data/canonical/waivers.csv`: `waiver_id, src, note, historian, reviewed_on`, where `src` cites the single cell and `note` gives your reasoning (what the context shows, e.g. the same train in the return table or in another guide). Review every existing waiver as well; a waiver must never invent a time the page does not support.

### 5. Cross-guide disagreements
Where a second guide covers the same segment (`segment_sources.csv`: one truth edition per date, others cross-check) and validators V04/V06 report a difference, decide which is a printing difference between guides (both kept, the truth edition rules), which is a transcription error (re-key), and which is a genuine timetable change between issue dates (record it; the timetable game uses these).

### 6. Params and calendar
Every row of `params.csv` and `calendar.csv`: does the cited page say what the row says, on the date it says? Check `date_basis` and `value_basis` (what was read vs what was inferred), Julian/Gregorian dates in Russia (`date_jul` 13 days behind in 1914), the local time and zone of each event, and that `effects` point at the right param rows. A row whose value is inferred rather than read must say so in its basis field.

### 7. The design-value register
Read `data/design/DESIGN_VALUES.md` for anything presented as history: a value with a period-sounding rationale but no source, a design value used where a guide does print a value (a minimum change time, a fare), or a balance constant that would make a historical claim on the About screen. Design values are allowed; disguised ones are not.

## Output

Write `data/review/HISTORIAN_REVIEW.md`, one file per review round, in this shape:

```markdown
# Historian review — <game(s)>, <date>

Reviewer: <name/agent>. Data state: <git commit or tag>. Validation report: <date, error/warning counts>.

## Verdict
<PASS | PASS WITH CONDITIONS | FAIL>, in one paragraph: what may be frozen, what must change first.

## 1. Stations and frontiers
| station_id | printed as | verdict | evidence (citation) | action |
|---|---|---|---|---|
| … | … | ok / fix / question | source:p412:57:-:- | … |

## 2. Zones
| zone_id / station_id | verdict | evidence | action |

## 3. Blind sample
Seed <n>, label <label>; read <n>, errors <n> (<‰>); per source: … ; tables sent for re-keying: … .
Mismatches I attribute to my own misreading: … .

## 4. Waivers
| waiver_id | src | verdict (keep / withdraw / new) | reasoning |

## 5. Cross-guide disagreements
| segment / service | guides | kind (printing / transcription / timetable change) | decision |

## 6. Params and calendar
| row_id / event_id | verdict | evidence | action |

## 7. Design values
| DV id | verdict (ok / passes as history / should be transcribed) | note |

## Open questions for the owner
- …
```

Verdict words: `ok` (checked against the cited page), `fix` (wrong; say what is right and cite it), `question` (cannot decide from the pages available; say what would decide it), `waive` / `withdraw` for waivers. Keep each evidence cell to a citation plus a few words; longer reasoning goes in a numbered note under the table.

The filled sample files `data/review/sample-<label>.csv` are part of the review and are committed with it; the score report (`build/review/sample-<label>.score.md`) is summarised in section 3.
