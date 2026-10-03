# Resolver brief

Two keyers transcribed the same crop independently (`tools/keying/KEYER_BRIEF.md`). Where they disagree, you decide what is printed. You see both readings and a sharper, 4× zoom of each disputed cell. You never re-key the agreed cells: `tools/keying/merge.ts` copies them.

## Your packet

`node tools/keying/resolve-support.ts <source_id> <table_ref> <crop_id>` writes `build/resolve/<source_id>/<table_ref>/<crop_id>/`:

- `packet.md`: the crop image's path, then one section per disputed cell: its key (kind, col, row), the reason (`text`, `marks`, `text+marks`, `missing-A`, `missing-B`, `illegible`, `doubtful`), keyer A's and keyer B's readings, and its zoom;
- `zoom-<kind>-c<col>-r<row>.png`: the cell cut from the page scan with a margin, magnified 4×, the cell's box outlined in translucent red (the outline sits on the cell boundary; it is not a printed rule);
- `R.template.csv`: one line per disputed cell, for you to fill.

Look at the whole crop first (to learn the type: how this guide's 3, 5, 6, 8 and 9 look, how heavy its p.m. type is, what its ditto marks look like), then at each zoom.

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
5. **`doubtful`**: both keyers gave the same reading but at least one marked it `sure=n`. Do not assume agreement makes it right: two keyers can share a misreading of a blurred digit, separator or footnote symbol. Read the zoom afresh; choose `A` (the shared reading) only if the print shows it, otherwise `other` or `illegible`.
6. Do not change, add or remove lines for cells that are not disputed.

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
