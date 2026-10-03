# Adjudicator task: G2 final sample, disagreements between two readings

You are an independent adjudicator for the transcription of a real 1914 German railway timetable, R. Fritzsches Kursbuch, Sommer-Ausgabe 1914. For each case below, two careful readers read the same printed cell and disagreed. You look at the print and decide which reading is right, under the keying conventions. You are not told which reader is which; do not try to find out. Repository /home/user/1900, workspace /home/user/1900/prototype. Do not commit or push.

## Read first
1. The first half of /home/user/1900/prototype/tools/keying/KEYER_BRIEF.md, for the conventions. In particular:
   - tokens: `〃` (ditto), `|` (a vertical rule: passes without stopping), `—` (any horizontal dash or rule inside a cell);
   - underline `u`: minutes underlined mark a night time (6 pm – 5.59 am);
   - footnote signs (`fn:□`, `fn:!` …) before or after a time;
   - notes printed sideways or in boxes are not the content of the cells they run through, and the sign that opens such a note stays with the note;
   - a symbol standing alone in a cell is text.
2. In this guide bold has no meaning, and italic is judged on a column's header, so neither is part of the readings below; only the text and the value marks (underline `u`, signs `fn:…`) are.

## Your material
- Contact sheets: /home/user/1900/prototype/build/review/sample-g2final-adj/sheet-01.png, sheet-02.png, … Each numbered tile shows one disputed cell, untouched (nothing washed, nothing drawn on the print), between four red ticks outside the image that mark the cell's edges, with a wide view of the rows and columns around it. Tile N is case N.
- The map from tiles to cases: build/review/sample-g2final-adj/sheets.csv (tile = case number).
- If a tile does not settle it, you may cut a larger view yourself from the page scan: /home/user/1900/prototype/scans/<source_id>/p<page_seq>.jpg, at the page_region given for the case's row in data/review/sample-g2final-adj.csv (x, y, width, height in page pixels; the region of that one cell). That file holds locations only. A script may use tools/crops/make-crops.ts `loadPage` and `renderZoom(page, paddedBox, cellBox, scale, 'plain')`. Put your scripts and images only in /tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/ADJwork/.

## The cases
| case (tile) | reading X | reading Y |
|---|---|---|
| 1 | 10 00  [u] | 10 22  [u] |
| 2 | 9 20 | 9 20  [u] |
| 3 | ab | — ab |
| 4 | — ab | ab |
| 5 | — ab | ab |
| 6 | ab | — ab |
| 7 | (empty) | □ |

## For each case
1. First look at the tile and write down what you see in the cell, before you compare: the text, and the value marks (is there an underline under the minutes? a sign before or after the time? a rule inside the cell, and where exactly: inside the cell's box between the ticks, or on the line between two rows?).
2. Then decide: `X` (reading X matches the print under the conventions), `Y`, `neither` (give the right reading), or `undecidable` (the print itself does not settle it; say why).
3. Write one line per case into /home/user/1900/prototype/data/review/adjudication-g2final.csv, with the header
   `case,verdict,seen,note`
   where `seen` is your own reading in the same notation (`10 00 [u]`, `— ab`, `(empty)`), and `note` says briefly what decided it (where the underline sits, which row a rule belongs to, what the note column shows).

## Rules
- One image per request. If an image read fails or returns "media removed" or any error: wait a moment and retry once. If it still fails, write `undecidable` with note `image not loaded` for the cases on it; never decide a case you have not seen.
- Do NOT open: any .A.csv, .B.csv or .R.csv; diff, packet or status files; anything under data/raw/ (except layout.json, if you need a panel's deskew) or data/canonical/; data/review/ files other than sample-g2final-adj.csv and your own output; build/review/ folders other than sample-g2final-adj/; build/reports/; anything in the scratchpad outside ADJwork/; git history.

Reply in under 150 words: per case, the verdict in one phrase; and anything about the print or the conventions that the keying brief should say more clearly.
