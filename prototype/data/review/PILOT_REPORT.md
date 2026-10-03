# Transcription pilot (D2): report for gate G2

**Source.** *R. Fritzsches Kursbuch*, Sommer-Ausgabe 1914 (valid 1 May – 30 September 1914), from SLUB Dresden, 300 dpi scans.
**Scope.** The Berlin – Dresden – Bodenbach/Tetschen – Prague – Vienna corridor in both directions: six tables (12, 13, 23, 112, 123, 126), 18 pages.
**Method.** Layout from OCR word boxes with hand correction, then crops, two blind keyer agents per crop, a value-aware diff, a resolver agent with zooms, the normaliser, validators V01–V12, and a historian's blind 20% re-read. The decisions are logged in `DECISIONS.md` (P-E014 – P-E018, P-010, P-011).

## Output

| | |
|---|---|
| Crops | 69 (33 grid, 31 column-notes, 5 footnote); 1,247 grid cells |
| Canonical rows | 175 services (127 trains), 487 stops, 189 footnotes, 30 running-rule proposals, 13 stations, 27 aliases, 7 segments |
| Illegible cells | 56 (51 distinct), each listed with the resolver's note and a waiver citation in `build/reports/pending-FKB1914-SO.md` |
| Validators | V01, V02, V04, V05, V06, V08, V09, V12 clean. V11: 71 illegible stops (expected). V07: 38 unreviewed running rules (expected). V03: 3 errors, all traced to the print or a likely misread (below) |

## Accuracy

- **Times are reliable.** Of 132 sampled cells, none had a wrong hour or minute figure. Before resolution the two keyers disagreed on about 10 of roughly 600 time cells in tables 12 and 13.
- **Marks are not.** The historian found 5 keying errors in 132 cells (**3.8%**, 95% interval about 1.6–8.6%) against a 0.5% target, so the source **fails**. All five are missing marks: italic in express-train columns (three) and a "!" printed before a time (two). Two further cells are genuinely ambiguous.
- **Consistency.** The 12 trains printed in two tables agree at Dresden. The physics check caught one normaliser bug, now fixed. It also flagged print or reading problems that are reported, not corrected: a Prague time whose night underline gives a 19-hour run, two "times" that are not times, and three suspect speeds that are probably misreads.

## Cost and effort

| Stage | Tokens | Recurs per page? |
|---|---|---|
| Source tools, layouts, crops, notation | 535k | partly; every layout needed hand correction |
| Keying, 6 agents | 904k | yes |
| Diff tooling | 195k | no |
| Resolution, 3 agents | 643k | yes |
| Historian, 20% sample | 222k | yes, about a quarter of this at the usual 5% |
| Normaliser and canonical rows | 524k | partly |
| **Total** | **≈ 3.0M** | **≈ 100k tokens per page recurring** |

Elapsed time was a few hours of parallel agents. Two of three resolvers reported image reads that failed partway through, and they redid those decisions. Image loading should be checked automatically, not trusted.

## What the pilot taught

1. **Agent double keying works for times** but shares blind spots on small signs and on italic.
2. **Diffing by exact text is wrong for real print.** Disagreements were dominated by typography: bold, leader dots, sign placement. The value rules belong to each guide's notation file (P-010).
3. **Italic in this guide marks a whole train** (an express), so it belongs to the column, not the cell. The normaliser now records a train `category`.
4. **Layout is a real cost.** Every panel needed hand correction, and sideways pages and rotated OCR need care.
5. **Crop edges cut cells.** Five illegible cells and several label suffixes were lost at crop borders, so crops need a wider margin.

## Proposed fixes before more transcription

1. **Read train category once per column** (from the header and the column's type) instead of italic cell by cell.
2. **Add the guide's sign list** ("!", □, ◗, °/○, doubled signs) to the keyer brief with zoomed examples, and give doubled signs a token.
3. **Widen crop margins**, and add a rule for sideways notes interrupted by times.
4. **Detect failed image loads in agent runs** and re-queue that work.
5. **Re-key tables 12, 123 and 126 for signs only** under the new brief, then draw a fresh 20% sample. G2 passes when that sample meets 0.5%.

## Volume ahead

The plan estimated about 15,000 cells across all editions. At about 1.5k recurring tokens per cell, that is roughly 20M tokens, more than one session's budget and above the usage limits this account has hit. Suggested order:
1. **C07 first:** Fritzsche Winter 1913/14 for the same corridor (C07's real changeover test, similar in size to this pilot).
2. **The facsimile pages** for the other C07 corridors, once you have the book.
3. C01 and C04 editions after C07 is playable on real data.

## Decisions for you (G2)

- Accept the method with fixes 1–5, or change it.
- The volume order above.
- Historian decisions to follow:
  - waivers for the 51 illegible cells;
  - the 30 running-rule proposals (which Austrian holidays count as *Festtage*);
  - zone citations;
  - Bodenbach/Tetschen is not a frontier pair (both are in Austria).
