# Resolver brief

Two keyers transcribed the same crop independently (`tools/keying/KEYER_BRIEF.md`). Where they disagree, you decide what is printed. You see both readings and a sharper, 4× zoom of each disputed cell. You never re-key the agreed cells: `tools/keying/merge.ts` copies them.

## Your packet

`node tools/keying/resolve-support.ts <source_id> <table_ref> <crop_id>` writes `build/resolve/<source_id>/<table_ref>/<crop_id>/`:

- `packet.md`: the crop image's path, then one section per disputed cell: its key (kind, col, row), the reason (`text`, `marks`, `text+marks`, `typography`, `missing-A`, `missing-B`, `illegible`, `doubtful`), keyer A's and keyer B's readings, and its zoom;
- `zoom-<kind>-c<col>-r<row>.png`: the cell cut from the page scan with a margin, magnified 4×, the print untouched; red ticks in the white frame round the image mark the cell's four edges (nothing is drawn on the print, so an underline just below the cell's lower edge is visible: look for it there);
- `R.template.csv`: one line per disputed cell, for you to fill.

For a column-notes crop (`-cn-`), the zoom of a note shows the whole crop part; read the note in the crop itself. A column-notes line keyed by one keyer only (`missing-A`/`missing-B`) is resolved like any other: keep it if the note is printed in that column, otherwise choose `other` with empty text.

**Notes are matched by content.** In footnote and column-notes crops the two keyers' notes are paired by column mark (`c:<n>`) and text similarity, not by their order, and the row numbers are keyer A's. A note only B gave is numbered after A's last note and shows as `missing-A`; a note one keyer split in two and the other joined shows as one `text` dispute plus one `missing-…` line. Choose `other` with empty text for a line whose note is already wholly in another line.

Look at the whole crop first (to learn the type: how this guide's 3, 5, 6, 8 and 9 look, how heavy its p.m. type is, what its ditto marks look like), then at each zoom. The keyer brief's "Signs in this guide" table and the examples in `build/brief/signs/` (if present) show this guide's signs; the pale strips at a crop's edges are margin (print beyond the crop's own cells).

**Images that do not load.** If reading the crop image or a zoom fails, returns an error, or shows "media removed", an empty or a broken picture: stop work on that crop, and try to read the image once more. If it still fails, write no `.R.csv` for that crop and say in your reply which crop and which image could not be loaded, with what the tool returned. Never decide a cell you have not seen: not from the keyers' readings, not from the cells around it, not from what you decided before the failure. In the pilot two of three resolvers had image reads fail part-way through; decisions made after a failed read must be made again.

## Deciding

For each disputed cell choose one `resolution`:

| resolution | when | what to write in the line |
|---|---|---|
| `A` | keyer A's reading is exactly what is printed (text **and** marks) | leave `text_as_printed` and `marks` empty (they are copied from A) or repeat them exactly; `sure` `y`, or `n` if you still have a doubt |
| `B` | keyer B's reading is exactly right | as for A |
| `other` | neither reading is right, or one is right only in part (right text, wrong marks) | your own complete reading in `text_as_printed` and `marks`, `sure` `y` or `n` |
| `illegible` | the printed cell cannot be read even in the zoom | the characters you can read with `?` for the others (or empty); `sure` is set to `x` |

and add a short `note` saying what decided it (`closed bowl: 8 not 3`, `heavy face matches the p.m. times above`, `blot over the minutes`). The note is kept with the cell.

Rules:

1. **Decide from the print only**, with the same transcription rules the keyers follow (tokens `〃 | — …`, footnote marks in `marks`, no normalisation). Do not pick a reading because it makes a plausible journey time or keeps times in order; the validators check physics separately, and a resolver who "corrects" by plausibility hides real printing errors and real misreadings alike. If the glyph itself is ambiguous, choose `illegible` and put what the context suggests in the note (`context suggests 8 15`); the historian may then waive the cell with that reasoning.
2. **Marks count.** A reading with the right digits but missing bold (`b`) or a footnote mark is not right: use `other` with the full reading.
3. **A missing reading** (`missing-A` / `missing-B`): if the one reading given is right, choose that keyer; if the cell is blank on the page, choose `other` with empty text and `sure=y` (or the keyer who wrote it blank).
4. **Both keyers wrote `sure=x`** (`illegible` reason): try the zoom. If you can read it, `other`; if not, `illegible`.
5. **Separators and footnote symbols.** If only the separator between figures is in doubt, choose the shared or most likely reading with `sure=n`; do not make the cell `illegible` for a separator, since it does not change the time. A footnote symbol you cannot identify stays `illegible` (`fn:?`), whatever the keyers guessed; in calibration every guessed symbol on a blurred page was wrong.
6. **Confusable digits.** On a blurred or speckled print, 3/8, 5/6, 6/8, 0/8, 3/5 and 8/9 are told apart only by one stroke: the open left side of a 3 or 5, the closed lower bowl of a 6, the waist of an 8. Choose a reading only if that stroke is visible in the zoom; otherwise `illegible`, with the context reading in the note. This applies to train numbers in the header as much as to times: in calibration the one value error that survived resolution was a header `108` accepted as `106`, and in the G2 census a resolver chose `7 13` where the italic figure, compared with the column's other 3s and 5s, is a 5 (P-E022). Compare a doubtful digit with the same figure elsewhere in its column before you choose.
7. **`typography`**: the two readings have the same value and differ only in print detail: the separator, italic on a body cell, bold on a station name or train number, leader dots, a look-alike character for the same sign (`º` for `°`), or a sign after a station name written in the text by one keyer and as `fn:` by the other. Choose the reading that matches the print and the conventions below; such a cell is never `illegible`.
   **Italic is keyed once per column** (keyer brief, "Train category"): `i` on the train-number header cell (or the top header line of a table without numbers), never on body cells. A dispute over `i` on a header cell is a `marks` dispute: judge the slant of the whole column's times (the minutes slant most clearly), not of one figure. A body cell keyed with `i` under this rule is `other` without the `i`.
   **Signs:** a sign before a time (`!`, `□`, `°`, `◗` …) is `fn:<sign>`; the small ring `°` and the large ring `○` are different signs, told apart by size; two signs printed together or stacked are one sign written twice (`fn:°°`); a sign that opens a sideways note belongs to the note, so the cell it stands in is empty.
8. **Station-name conventions** (as in the keyer brief): a sign after the name goes into `marks` as `fn:<sign>`, not the text; leader dots are one `…` after a space (an abbreviation's own stop stays); a number printed before the name (connecting table or km) stays in the text as printed. If neither keyer followed them, use `other`.
9. **`doubtful`**: both keyers gave the same reading but at least one marked it `sure=n`. Do not assume agreement makes it right: two keyers can share a misreading of a blurred digit, separator or footnote symbol. Read the zoom afresh; choose `A` (the shared reading) only if the print shows it, otherwise `other` or `illegible`.
10. Do not change, add or remove lines for cells that are not disputed.
11. **A mark one keyer saw.** If one keyer gave an underline or a sign and the other did not, look for it where such a mark is printed, not only between the ticks: an underline sits under the minutes and may lie on or just below the cell's lower edge (in some tables the grid sits a few pixels above the line of times), and a sign before a time may stand across the column rule. Drop the mark only if the print plainly shows nothing there. The one time error with a data impact in the G2 sample was an underline a resolver read away (P-E021).
12. **`other` is checked.** A reading that neither keyer gave is re-read blind by a historian before the table is accepted (P-E021): in the G2 sample, 2 of the 3 `other` cells checked were wrong, against none of the 356 cells where the keyers agreed or the resolver chose one of them. Choose `other` only when the print plainly shows both keyers wrong, and say in the note exactly what you see there.
13. **Unreadable cells and grid errors.** A cell whose agreed reading is not a time (`48` alone, two times in one cell) usually means the grid and the print disagree, or a figure stands on a rule: look at the zoom's context, not only between the ticks, and say so in the note; such cells are re-read blind with the overrides (P-E022).

An `illegible` cell blocks compilation of the table until the historian waives it (`data/canonical/waivers.csv`) or the page is re-read from a better scan.

## Output

Save the filled template as `data/raw/<source_id>/<table_ref>/<crop_id>.R.csv`:

```
crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note
```

then run

```
node tools/keying/merge.ts <source_id> <table_ref> <crop_id>
```

`merge.ts` re-diffs A and B, copies every agreed cell with `resolution=agree`, merges your decisions and rewrites the `.R.csv` complete. It refuses, and changes nothing, if a disputed cell has no decision, if you chose `A`/`B` but wrote a different reading, if you used `other` with `sure=x`, or if a line names a cell outside the crop. Fix what it reports and run it again; running it twice gives the same file.

## Worked example

`packet.md` lists three disputed cells of crop `T57-c4-5-r10-13`:

```
## cell col 5 row 11 (c5r11) — illegible
- A: `9 2?` sure=x
- B: `9 28`
## cell col 4 row 12 (c4r12) — marks
- A: `4 31` marks `b` sure=n
- B: `4 31`
## header col 5 row 1 (h1c5) — text
- A: `〃`
- B: `1 2`
```

In the zooms: the last digit of c5r11 has a closed upper and lower bowl, an 8; c4r12 is in the same heavy face as the p.m. times above it; h1c5 shows a printed ditto mark (B wrote what the ditto stands for, which is normalisation). The filled `T57-c4-5-r10-13.R.csv`:

```
crop_id,kind,col,row,text_as_printed,marks,sure,resolution,note
T57-c4-5-r10-13,cell,5,11,,,y,B,both bowls closed in zoom: 8
T57-c4-5-r10-13,cell,4,12,,,y,A,heavy face as r10
T57-c4-5-r10-13,header,5,1,,,y,A,printed ditto mark; B expanded it
```
