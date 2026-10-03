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
