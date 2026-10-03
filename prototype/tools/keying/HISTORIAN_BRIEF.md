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
node tools/keying/sample.ts draw --seed <your seed> --label <label> [--n <count>]
```

By default it takes 5% of the stop cells (body cells with a printed sign) of every resolved table and 10% of the fare cells (tables whose `layout.json` says `"table_kind": "fares"`), at least one per table. With `--n <count>` it takes exactly that many cells, split over the tables in proportion to their size, at least one each (the G2 sample uses `--n 360`: with no error, 344 cells read out of 653 are needed to show 0.5%, and the rest is headroom for cells that cannot be read). It writes `data/review/sample-<label>.csv` with **where** to look (`source_id`, `page_seq`, `table_ref`, `crop_id`, `kind`, `col`, `row`, `page_region` as `x,y,w,h` in the page image) but not what was transcribed. A zoom of each sampled cell is in `build/review/sample-<label>/<sample_id>.png`.

Re-read each cell **from the scan**, on the contact sheets below, following `tools/keying/KEYER_BRIEF.md`, and fill `reread_text`, `reread_marks`, `reread_sure` (`y`/`n`/`x`) and, if useful, `note`. Do not open the `.R.csv` files, the review pages or `stops.csv` until the sample is scored: the point is a reading the transcription cannot influence.

#### Contact sheets: reading the sample

Image requests are limited (reads fail with "media removed: request limit"), so read the cells from contact sheets, 16 cells per image, not from one zoom per request:

```
node tools/review/contact-sheet.ts --sample <label> [--filter-tables 12,13,23] [--per-sheet 16]
```

It writes `build/review/sample-<label>/sheet-01.png`, `sheet-02.png` … and `sheets.csv`, which maps each `(sheet, tile)` to its `sample_id`. With `--filter-tables`, the sheets of those tables go to their own sub-folder (`tables-12-13-23/`): when two reviewers split a sample by table, each reads only their own folder and fills only their own tables' rows. Each tile shows one cell cut from the page scan, magnified 2× or more: the cell at full contrast between four red ticks, a clear strip just above and below it (an underline or a sign often sits a little past the row line), the rows and columns beyond washed pale as context, and over it a band with a large tile number and the cell's key (`table 126 · c31 · r62`). A sheet never shows a transcription. Sign examples in `build/brief/signs/` never show a sampled cell and give no readings (P-E021); `contact-sheet.ts` refuses a sample while one of its cells is an example.

1. **One sheet per image request.** Never ask for two images in one request, and do not open the per-cell zooms as well.
2. Read every tile of the sheet, then write the readings into the sample rows that `sheets.csv` names for those tiles before you open the next sheet. Check the tile number against `sheets.csv` for every row you fill.
3. **If an image does not load** (an error such as "media removed: request limit", or a reply without the picture): stop, wait about a minute, and retry that sheet once. If it fails again, stop reading and report which sheets did not load and how many cells you read.
4. **Never fill a cell you have not seen** on a sheet that loaded. Leave its row blank, with a note such as `image not loaded`: a blank row is unread, so it is neither scored nor an error. A tile you see but cannot read gets `reread_sure=x` and a note; it is not measured either.
5. Read the cell between the ticks, not the pale context. An underline belongs to the figures above it: a line in the clear strip below the cell is this cell's, a line in the strip above is the row above's. If a mark is in doubt, open the cell's single zoom (nothing washed). Underlining and signs (`!`, `□`, `°` … before or after a time, as `fn:` marks) are value. In Fritzsches Kursbuch 1914 bold has no meaning, and a train's italic is judged once on its column's header cell (P-013), so do not mark `i` on body cells.

Then

```
node tools/keying/sample.ts score --label <label> [--apply]
```

compares your reading with the resolved cells **by value**, with the guide's notation rules (P-005, P-010, P-013): a difference in typography alone (a separator, bold where the guide gives it no meaning, italic on a body cell) is listed but is not an error. Unread and illegible rows are listed apart, without their stored values. For each source the score gives the exact one-sided 95% upper bound on the value error rate, with the finite-population (hypergeometric) correction over the source's sampleable cells, and the verdict: **PASS when the bound is at most 0.5%**, FAIL otherwise, with the number of cells that would have to be read at the current error count. In a failing source the tables with errors are re-keyed (`--apply` marks their crops `rekey` in `data/raw/status.csv`). Before you accept a mismatch as a keying error, look again: if your own reading was wrong, say so in the note and correct the sample row; the score is re-run on the corrected file.

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
Seed <n>, label <label>; sheets loaded <n> of <n>; read <n>, unread <n>, value errors <n>; per source: 95% upper bound <x>% as `sample.ts score` gives it, PASS / FAIL; tables sent for re-keying: … .
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
