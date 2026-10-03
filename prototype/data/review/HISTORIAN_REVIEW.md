# Historian review — D2 transcription pilot (Fritzsches Kursbuch, Sommer-Ausgabe 1914), 2026-10-03

Reviewer: historian agent (Claude). Data state: git `16ede40` plus the uncommitted pilot keying and resolution under `data/raw/sl-rfrkuf_394077458-19140001/`. Validation report: not run for this round.

This round covers **only check 3, the blind sample**. Checks 1, 2 and 4–7 are not part of this pilot round and have not been done.

## Verdict
FAIL for the sample (check 3). The pilot source is over the 0.5% line however the errors are counted. Every keying error found is a **mark that carries meaning in this guide**: italic (express) left out three times, and the `!` sign before a time left out twice. No hour or minute figure was found wrong in 132 cells. Tables 13, 112 and 23 had no keying error. Tables 12, 123 and 126 did. The record below is for the G2 decision on the re-key threshold (P-011). I did not run `--apply`, so no crop was marked `rekey`.

## 3. Blind sample (pilot)

**Draw.** `node tools/keying/sample.ts draw --seed 52817 --label pilot --stop-permille 200 --sources sl-rfrkuf_394077458-19140001`
Seed **52817**, label `pilot`, a 20% sample (200‰, not the usual 50‰) of the stop cells of every resolved table of `sl-rfrkuf_394077458-19140001`. That gives **132 cells**. Filled file: `data/review/sample-pilot.csv`. Score report: `build/review/sample-pilot.score.md`.

| table | pages | cells sampled |
|---|---|---|
| 12 | 58–59 | 18 |
| 13 | 60–61 | 18 |
| 23 | 74–79 | 32 |
| 112 | 182–183 | 23 |
| 123 | 189 | 15 |
| 126 | 192–193 | 26 |
| **all** | | **132** |

**Method.** I read every cell from the page scan, using the zoom PNG and my own crops of the page at `page_region`. I applied each panel's `deskew_deg` from `layout.json`, including the 91.3° rotation of p. 189 (table 123). Without that rotation its regions lie outside the unrotated page. My crops had no box drawn round the cell, because the box in the zoom PNG sits exactly where an underline would be. For cells where it was unclear which printed line a row holds (rows 0120 and 0126 on the last rows of table 23), I checked the station-name column. I did not mark bold, because bold has no meaning in this guide (P-010). Rules applied: underlined minutes (night) and italic figures (express) are value, bold is typography, and footnote signs are always value. All 132 images loaded, so no row is left blank. Before scoring I opened no `.R/.A/.B.csv`, diff, packet, status file, review page or `stops.csv`.

**Score (after my one correction).** Read 132; exact mismatches 22 (166‰); **value mismatches 7 (53‰)**, of which **5 are keying errors (38‰; Wilson 95% interval about 1.6–8.6%)** and 2 are genuinely ambiguous. My first reading differed on one more cell, and on a second look I judged my own reading wrong. Text alone (figures and signs, marks set aside) has 0 clear errors in 132 cells: the only two text differences are the ambiguous cells.

| table | read | exact mism. | value mism. | of which keying errors | value ‰ | keying-error ‰ | 0.5% met? |
|---|---|---|---|---|---|---|---|
| 12 | 18 | 1 | 1 | 1 (probable) | 56 | 56 | no |
| 13 | 18 | 0 | 0 | 0 | 0 | 0 | yes (no error seen) |
| 23 | 32 | 9 | 1 | 0 | 31 | 0 | yes on keying errors; no on value (1 ambiguous) |
| 112 | 23 | 8 | 1 | 0 | 43 | 0 | yes on keying errors; no on value (1 ambiguous) |
| 123 | 15 | 3 | 3 | 3 | 200 | 200 | no |
| 126 | 26 | 1 | 1 | 1 | 38 | 38 | no |
| **source** | **132** | **22** | **7** | **5** | **53** | **38** | **no** |

At 15–32 cells per table, one error is already 3–7%. "Met" therefore only means that no error was seen. A table with 0 errors in 18 cells is only bounded below about 17% (rule of three). The per-table rows cannot show 0.5%; only the pooled source figure has any precision.

**Mismatches and my judgement**

| sample | table | resolved | my reading | judgement |
|---|---|---|---|---|
| Spilot-0042 | 123 | `9 55` [u;i] | `9 55` [fn:!;i;u] | **keying error**: a `!` is printed before the time, plainly inside the cell. The same sign is keyed as `fn:!` in 0045 and 0110. |
| Spilot-0050 | 123 | `11 15` [u;i] | `11 15` [fn:!;i;u] | **keying error**: as 0042, in the same column one row lower. |
| Spilot-0047 | 123 | `2 25` [u] | `2 25` [i;u] | **keying error**: c17 is an italic (express) column all the way down (`10 18`, `9 30`, `8 39`, `8 13`). In this face the italic 2 looks upright. |
| Spilot-0064 | 126 | `2 40` [u] | `2 40` [i;u] | **keying error**: the minutes slant plainly, `1 47` above is italic, and c15 is an italic column. |
| Spilot-0028 | 12 | `7 21` [u] | `7 21` [i;u] | **probable keying error**: column D 53 (D-Zug); the 1 has the italic curved foot, unlike the roman 1 in column 283. I marked my own reading `sure=n`. |
| Spilot-0022 | 112 | `48` | `48 \|` | **genuinely ambiguous**: the last row, under a brace joining c17 and c18. A short vertical rule is printed after the raised `48`, and I cannot tell whether it is a pass sign or part of the brace layout. What the train does here should be settled from the column notes or the footnotes. |
| Spilot-0121 | 23 | `□` | (empty) | **genuinely ambiguous / convention**: the `□` opens the boxed sideways note "□ In Tetschen … Zollabfertigung". Under KEYER_BRIEF a note running through a cell is not cell content, and the `□` belongs to the note. The resolver keyed it as the cell's content. The brief should say which. |
| Spilot-0045 | 123 | `2 23` [fn:!] | first `2 22`, corrected to `2 23` | **my misreading**: at higher zoom the last digit has a rounded lower bowl and a waist on the left, so it is a 3. The row is corrected and marked `sure=n`. |
| 0001, 0004, 0013, 0015, 0016, 0020, 0023, 0103, 0104, 0110, 0116, 0119, 0120, 0123, 0132 | 112, 23 | … [b…] | same without b | **typography only**: the resolution marks bold and I did not judge bold. Under P-010 this is not a value error. These 15 cells account for 15 of the 22 exact mismatches. |

**Tables sent for re-keying:** none marked (score run without `--apply`, as instructed). On keying errors alone, the tool would list 12, 123 and 126. Counting the ambiguous cells it would also list 112 and 23.

**Mismatches I attribute to my own misreading:** Spilot-0045 (2 22 → 2 23), corrected in the sample file before the final score.

**Notes**
1. All five keying errors are omitted marks, not wrong figures, and all five are in italic (express) columns. Italic in this face is easy to miss: the hour digits (2, 7) of the italic fount look upright, and only the minutes slant. Judging italic by the whole train column, as I did here, would catch these. The `!` before a time was keyed in two of the four cells where it occurs in the sample. Both point to a brief addition, not to a general re-key.
2. The sample says nothing about bold. If bold is ever needed for another guide, a separate sample is required.
3. Open for the owner: the convention for a footnote sign that opens a sideways note (0121), and the reading of the braced last row of table 112 (0022).

## 3b. Blind sample (G2 re-check)

Reviewer: historian agent (Claude), 2026-10-03. Data state: git `76c83f9`, where tables 12, 123 and 126 are re-keyed (`-v2` crops) and the old crops are skipped. The sample file is `data/review/sample-recheck.csv` and the score is `build/review/sample-recheck.score.md`.

**Draw.** `node tools/keying/sample.ts draw --seed 70419 --label recheck --stop-permille 200 --sources sl-rfrkuf_394077458-19140001`. The seed is new (the pilot used 52817). The draw is 133 cells from a population of 653 body cells. Every crop drawn for tables 12, 123 and 126 is a `-v2` crop.

**Verdict: NOT SHOWN. This is not a pass.** Only 56 of the 133 cells could be read blind. None of them was in table 12 or 112. In those 56 cells I found **0 value errors**. But 0 in 56 is far from showing 0.5%: the 95% upper bound is 6.4%. The G2 condition, a fresh 20% sample that passes 0.5%, is therefore **not met**. Nothing contradicts the re-keying, but the measurement is incomplete. I did not run `--apply`.

**A failure of my own process, stated first.** For this round, most zoom images did not load: the image tool returned "media removed: request limit", for the zoom PNGs and for my own page crops alike. In my first pass I wrote readings for 42 cells whose images had not loaded. Under the brief those cells had to be left blank. I caught this after the first score run and before writing this section. I removed every one of those readings, re-built the sample file from the cells whose images I had actually seen before scoring, and re-scored. **That first score (98 "read", 39 mismatches) is void.** Because it printed resolved values for many cells, I cannot re-read those cells blind any more. They need a different historian or a new seed.

**Per table**

| table | drawn | read blind | not loaded | excluded (loaded only after scoring) | value errors | value error rate | 95% interval (Clopper–Pearson) |
|---|---|---|---|---|---|---|---|
| 12 (-v2) | 19 | 0 | 19 | 0 | — | not measured | — |
| 13 | 18 | 13 | 5 | 0 | 0 | 0% | 0–24.7% |
| 23 | 32 | 17 | 7 | 8 | 0 | 0% | 0–19.5% |
| 112 | 23 | 0 | 23 | 0 | — | not measured | — |
| 123 (-v2) | 15 | 8 | 7 | 0 | 0 | 0% | 0–36.9% |
| 126 (-v2) | 26 | 18 | 8 | 0 | 0 | 0% | 0–18.5% |
| **source** | **133** | **56** | **69** | **8** | **0** | **0%** | **0–6.4%** |

"Not loaded": I tried the image at least twice (the zoom PNG and my own crop of the page, or the zoom PNG twice) and it never loaded. Such rows are blank with the note `image not loaded`. "Excluded": the zoom of Srecheck-0124…0126 and 0129…0133 loaded on its single retry, but only after the void score had shown their resolved values. They are left unscored with a note.

**What the 56 cells cover.** 41 are times and 15 are signs (`—`, `|`, `ab`, `Ank.`). 13 carry an underline. **None carries a footnote sign.** The two `!` cells drawn in table 123 (0043, 0047) are among those not loaded. The pilot's failure modes were italic in express columns and a dropped `!`, in tables 12, 123 and 126. Of those, this sample tested table 12 not at all, `!` not at all, and 123 in only 8 cells.

**Score** (`node tools/keying/sample.ts score --label recheck`, no `--apply`). Read 56, exact mismatches 23. By class:

| class | count | samples | note |
|---|---|---|---|
| keying error affecting value (digits, underline, sign, label identity, train category) | **0** | — | no figure, underline or sign differs |
| typography only: bold | 11 | 0057 (123); 0058, 0060, 0065, 0069, 0070, 0074, 0081 (126); 0102, 0111, 0128 (23) | the resolution marks `b` and I did not judge bold. Bold has no meaning in this guide (P-010) |
| typography only: body-cell italic | 12 | 0086, 0091, 0093, 0095, 0101 (13); 0105, 0106, 0107, 0110, 0112, 0114, 0127 (23) | tables 13 and 23 were keyed before P-013, so their resolved body cells still carry `i`. Under `valueMarks: ["u"]` this is typography. I checked each column's printed header: D 67, E 63, E 64, D 66, D 62, E137, D 1, E139, D 66, D 62, D 56, D 53. All agree with the resolved header text, so each category comes from its D/E prefix and is correct |
| my misreading | 0 | — | |
| genuinely ambiguous | 0 | — | |

**Sample size needed.** With 0 errors observed, a 95% one-sided bound of 0.5% needs about **598** cells (rule of three), or 736 for a two-sided Clopper–Pearson bound. These tables hold only 653 sampled-population cells, so the finite-population calculation applies. With no error in the sample, about **344 cells (53%)** are needed to be 95% sure that the population holds at most 3 errors (0.5% of 653). A 20% sample, even fully read, is 133 cells and can at best bound the rate near 2.2%. It can show a failure but never a pass at 0.5%. Either the gate's sample size changes to about 50% of cells, or a census, or the gate criterion changes (for example a zero-error sample of fixed size, read as a bound of about 2%).

**Found outside the blind sample (post-score checks of the print; not counted above)**
1. **Table 112 c28: the train category is wrong (value).** The train from Wien prints its times in italic: on p. 183 `5 17`, `7 06`, `7 37`, `8 11`, `8 54`, `10 35` (r58), `12 58` (r60) and `11 23` all slant clearly against the upright neighbouring columns. Yet `services.csv` gives `FKB1914-SO.112.c28.r55` and `.r56` an empty category. The normaliser reports "i (Schnellzug) on 2 of 4 times and not on the header; category left empty" (`build/reports/pending-FKB1914-SO.md`, lines 310–311). The cause is that table 112 was not re-keyed under P-013: its header carries no `i`, and the old body-cell italic does not reach a majority. The keyed figures are right. Tables 112, 13 and 23 should get a header-only category pass (italic on the train-number or `h0` cell, per column), because body-cell italic no longer decides anything. In 13 and 23 this matters only for columns without a D/E/L prefix.
2. **Table 126 c31: a feeder leg in italic under an upright train (ambiguous; method gap).** On p. 193 the feeder block of c31 (`6 50`, `7 09`, `6 19` = Srecheck-0077, `7 23`) is printed in italic. The column's main train (`4 55`, `8 08`, … `8 20`) is upright, and its header `I-III` correctly has no `i`. The per-column rule has no place for a leg with its own category in a table that prints no train numbers. So `FKB1914-SO.126.c31.r62` gets an empty category. The rule also does not say whether a connecting leg's italic changes the category of the through service. The owner should decide. One option is to key such a block's italic as a column note (like a part-way train number).
3. I looked at 112 c9, c17 and c23 while checking these. c9 and c23 (italic, Schnellzug) and c17 (upright, no category) agree with `services.csv`.

**What would complete G2.** A historian not exposed to the void score needs to re-read the 77 unread cells of this draw: all of tables 12 and 112, 7 cells of 123 including both `!` cells, and the rest. The better course is to draw a larger sample of about 50%, given the arithmetic above. Reads should go in small batches, retried one at a time, because of the image request limit that blocked this round.

## 3c. Blind sample (G2 final, contact sheets)

Reviewers: three blind historian agents (H1, H2 and H3) and one adjudicator agent (Claude), 2026-10-03; written up by the coordinator. Data state: git `5922cb8` (draw) to `8028de2` (adjudicated). Files: the sample `data/review/sample-g2final.csv`, the adjudication `data/review/adjudication-g2final.csv` (brief beside it) and the score `build/review/sample-g2final.score.md`.

**Draw.** `node tools/keying/sample.ts draw --seed 19140501 --label g2final --n 360 --sources sl-rfrkuf_394077458-19140001`. That is 360 of the 653 cells (55%), proportional by table (112: 63, 12: 50, 123: 40, 126: 71, 13: 50, 23: 86), and only from resolved crops: the superseded crops of 12, 123 and 126 are never drawn.

**Reading.** On contact sheets (`tools/review/contact-sheet.ts`, 16 tiles per image, 23 sheets). H1 read tables 12, 13 and 23 (12 sheets) and H2 read 112, 123 and 126 (11 sheets). Every sheet loaded. Both re-checked doubtful marks on unwashed zooms they cut from the scans.

**Exposure, and how it was handled.** The sign-example index (`build/brief/signs/index.md`) printed the stored reading of each example cell. Seven sampled cells were examples: 0001, 0034 and 0114 in H2's tables, and 0065, 0069, 0071 and 0077 in H1's. Both historians had opened the index.
- Before anything was scored (commit `fafaf38`), their readings of these seven were dropped.
- H3, who never saw the old index, re-read them and agreed with the stored value on all seven.
- The index now gives no readings, and examples skip every sampled cell.

**Score before adjudication.**
- Read: 359.
- Illegible to the reader: 1 (0067: a 3 or an 8 blotted into its underline).
- Value mismatches: 7.
- Typography only: 177. These are bold, which has no meaning in this guide, and body-cell italic (P-013).

**Adjudication.** A fresh agent judged each mismatch on a plain contact sheet: nothing washed or drawn on the print, and a wide view round the cell. It was given the two readings unlabelled, in a seeded random order, and the key stayed apart until it had decided.

| sample | cell | stored | reader | verdict | class |
|---|---|---|---|---|---|
| 0031 | 112 c16 r55 (Wien Staatsb.) | `10 00` u | `10 22` u | stored | reader misread: italic 00 (closed slanted ovals), not 22 |
| 0165 | 126 c13 r2 (Tetschen) | `9 20` | `9 20` u | reader | **keying error**: a thick underline under 20, on the cell's lower edge |
| 0169 | 126 c7 r29 | `ab` | `— ab` | stored | reader misread: a heavy bar on the r28/r29 line closes the note area above |
| 0171 | 126 c10 r29 | `ab` | `— ab` | stored | reader misread: the bottom edge of the boxed note "□ An Sonn- u. F.T. …" |
| 0172 | 126 c11 r29 | `ab` | `— ab` | stored | reader misread: the bar closes c11's frame round 6 05–7 32 |
| 0178 | 126 c4 r31 | `ab` | `— ab` | stored | reader misread: a hairline on the r30/r31 line separates two trains |
| 0343 | 23 c54 r135 | `□` | (empty) | reader | **keying error**: the □ opens the boxed sideways note "In Tetschen und Bodenbach Zollabfertigung" and belongs to it |

**Verdict: FAIL** under the rule fixed before the draw. There are 2 keying errors in 359 cells read: observed 0.56%, exact one-sided 95% upper bound 1.225% (at most 8 of 653). At this error count the source passes only if at least 589 cells are read (230 more) with no further error.

**What the two errors have in common.** Both are resolver overrides, readings the resolver wrote because it judged both keyers wrong (resolution `other`). The source has 5 such cells. The sample held 3, and 2 of them were wrong. The other 356 cells read had no keying error: 197 where the keyers agreed and 159 where the resolver chose one keyer's reading. No hour or minute figure was wrong anywhere in the sample; the one digit dispute (0031) was the reader's.
- **0165.** Keyer B had the underline and keyer A did not. The resolver wrote `9 20` without it ("no rule under 20 in the zoom"), for two reasons:
  - the zoom's red outline lay on the cell's lower edge, exactly where the underline is printed;
  - in table 126 the grid's row lines sit about 8 px above the line of times, so underlines fall on or just below a cell's edge.

  Without the underline the train runs Dresden 18.30 → Tetschen 09.20 the next day, 15 hours for about 50 km. V03 had warned at 3 km/h, but nobody followed the warning up. **Data impact: yes** (09:20 should be 21:20).
- **0343.** Both keyers left the cell empty, which was correct. The resolver put the □ in the cell "as the station sign". Table 23 was resolved before the sideways-note rule (P-013). The note and its □ are keyed from the column-notes crop. **Data impact: none**, since the normaliser ignores a lone sign.

**Reader errors.** H2 misread 5 of its 174 cells:
- four bars on row lines read as in-cell dashes. The keyer brief said "a horizontal dash or rule inside a cell → —" without saying how to tell a row-line bar from an in-cell dash;
- one italic 00 read as 22, marked sure after a second look.

No misreading by H1 or H3 was found. Only mismatches are adjudicated, though, so a reader's error that happens to agree with a wrong stored value cannot show here.

**Corrected** in the resolved files, each citing this adjudication:
- 126 c13 r2 is now `9 20 [b;u]` (resolution B, keyer B's reading). 126.c13 now reaches Tetschen at 21.20 the same evening, and V03's warning is gone.
- 23 c54 r135 is now empty, as both keyers had it.

**Targeted re-read (H4).** Pending. A fresh blind historian (H4) is re-reading, on one plain contact sheet (`data/review/sample-g2fix.csv`), the six cells in these groups that no reader had verified: the 2 remaining resolver overrides (`other`), the 2 remaining keyer disagreements on an underline, and the other stop of each V03-flagged leg (112 c14, 126 c13). Its result will be added here.
