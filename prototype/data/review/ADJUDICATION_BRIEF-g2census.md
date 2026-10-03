# Adjudicator task: G2 census, disagreements between two readings

You are an independent adjudicator for the transcription of a real 1914 German railway timetable, R. Fritzsches Kursbuch, Sommer-Ausgabe 1914. For each case below, two careful readers read the same printed cell and disagreed (in one case, 6, a reader only doubted whether a sign belongs to the cell). You look at the print and decide which reading is right, under the keying conventions. You are not told which reader is which; do not try to find out. Repository /home/user/1900, workspace /home/user/1900/prototype. Do not commit or push.

## Read first
1. The first half of /home/user/1900/prototype/tools/keying/KEYER_BRIEF.md, for the conventions. In particular:
   - tokens: `〃` (ditto), `|` (a vertical rule: passes without stopping), `—` (any horizontal dash or rule inside a cell);
   - underline `u`: minutes underlined mark a night time (6 pm – 5.59 am);
   - footnote signs (`fn:□`, `fn:!` …) before or after a time;
   - notes printed sideways or in boxes are not the content of the cells they run through, and the sign that opens such a note stays with the note;
   - a symbol standing alone in a cell is text.
2. In this guide bold has no meaning, and italic is judged on a column's header, so neither is part of the readings below; only the text and the value marks (underline `u`, signs `fn:…`) are.

## Your material
- Contact sheets: /home/user/1900/prototype/build/review/sample-g2census-adj/sheet-01.png, sheet-02.png, … Each numbered tile shows one disputed cell, untouched (nothing washed, nothing drawn on the print), between four red ticks outside the image that mark the cell's edges, with a wide view of the rows and columns around it. Tile N is case N.
- The map from tiles to cases: build/review/sample-g2census-adj/sheets.csv (tile = case number).
- If a tile does not settle it, you may cut a larger view yourself from the page scan: /home/user/1900/prototype/scans/<source_id>/p<page_seq>.jpg, at the page_region given for the case's row in data/review/sample-g2census-adj.csv (x, y, width, height in page pixels; the region of that one cell). That file holds locations only. A script may use tools/crops/make-crops.ts `loadPage` and `renderZoom(page, paddedBox, cellBox, scale, 'plain')`. Put your scripts and images only in /tmp/claude-0/-home-user-1900/405f5ed7-5f5c-5b9f-97be-e5f97113fe9d/scratchpad/ADJ2work/.

## The cases
| case (tile) | reading X | reading Y |
|---|---|---|
| 1 | 5 45  [u] | 5 46  [u] |
| 2 | 1 48 | 48 |
| 3 | 7 13  [u] | 7 15  [u] |
| 4 | 11 15  [u;fn:!] | 11 15  [u] |
| 5 | 10 48 | 9 39 10 48  [fn:!] |
| 6 | 10 52  [u] | 10 52  [u;fn:◗] |

## Where the grid and the print disagree
- The grid (the ticks) is drawn from the page's layout, and in places it does not match the print: in table 126 the ticks sit a few pixels above the line of times, and below row 91 the print has six columns of times under the grid's five. If the cell between the ticks holds parts of two printed columns or rows, say so: decide what belongs to this cell's printed column and row, choose `neither` if neither reading is that, and describe the mismatch in the note.
- A time printed once across two columns, often under a brace joining them, belongs to the leftmost column it covers (keyer brief). A figure standing on a column rule belongs to the time it is part of.
- A bar or line across a whole column on a row line is structure, not `—`; a sign at a cell's corner belongs to a time only if it is printed with it (level with it, just before or after it), not if it ends a rule or a note.

## For each case
1. First look at the tile and write down what you see in the cell, before you compare: the text, and the value marks (is there an underline under the minutes? a sign before or after the time? a rule inside the cell, and where exactly: inside the cell's box between the ticks, or on the line between two rows?).
2. Then decide: `X` (reading X matches the print under the conventions), `Y`, `neither` (give the right reading), or `undecidable` (the print itself does not settle it; say why).
3. Write one line per case into /home/user/1900/prototype/data/review/adjudication-g2census.csv, with the header
   `case,verdict,seen,note`
   where `seen` is your own reading in the same notation (`10 00 [u]`, `— ab`, `(empty)`), and `note` says briefly what decided it (where the underline sits, which row a rule belongs to, what the note column shows).

## Rules
- One image per request. If an image read fails or returns "media removed" or any error: wait a moment and retry once. If it still fails, write `undecidable` with note `image not loaded` for the cases on it; never decide a case you have not seen.
- Do NOT open: any .A.csv, .B.csv or .R.csv; diff, packet or status files; anything under data/raw/ (except layout.json, if you need a panel's deskew) or data/canonical/; data/review/ files other than sample-g2census-adj.csv and your own output; build/review/ folders other than sample-g2census-adj/; build/reports/; anything in the scratchpad outside ADJ2work/; git history.

Reply in under 150 words: per case, the verdict in one phrase; and anything about the print or the conventions that the keying brief should say more clearly.
