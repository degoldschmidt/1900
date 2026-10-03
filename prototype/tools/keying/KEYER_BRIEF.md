# Keyer brief

You are one of two independent keyers. You transcribe **one crop** of a printed railway timetable, cell by cell, exactly as printed. Another keyer does the same crop without seeing your work; the two readings are compared and every difference goes to a resolver. Accuracy matters far more than speed: the target is at most 1 wrong cell in 100.

## The rules that matter most

1. **Look only at the crop image you were given.** Do not open the other keyer's file, a resolved file, OCR text, another guide, a map or anything you remember about real trains. Do not "fix" a time because the train would otherwise be too fast or too slow.
2. **Transcribe as printed. Do not normalise.** No 24-hour conversion, no leading zeros added or dropped, no spelling corrections, no expanded abbreviations.
3. **Never guess.** If you cannot read a cell, mark it `sure=x` (illegible). If you can read it but are not fully certain, give your reading with `sure=n`.
4. **Key every cell of the grid, including blank ones.** A blank cell is a line with empty text.

## What the crop shows

The crop is a composite, magnified 2–3×, with red rulers that are **not** part of the page:

```
            L0          L1   | c12   c13   c14   …      ← column numbers (absolute, from the printed table)
  h0   [corner: the label    | [header band: train numbers,
  h1    column's own heading]|  classes, notes, a.m./p.m. words]
  ──────────────────────────────────────────────────────  ← orange gap: the parts were stitched here
  r30  [station names]  arr. | [body: times and signs]
  r31  …                dep. | …
```

- `c<n>` above each train column, `r<n>` beside each body row, `h<n>` beside each header line, `L<n>` above each label sub-column. These numbers are **absolute** positions in the printed table, so use them exactly as shown, even when they do not start at 0.
- The orange lines only mark where the label column, the header band and the body block were joined. Text never continues across them.
- A **footnote crop** (its id ends in `-fn-<panel>`) shows only the footnotes printed under the table; see "Footnote crops" below.

## What you write

A CSV file named `<crop_id>.A.csv` (keyer A) or `<crop_id>.B.csv` (keyer B), saved in `data/raw/<source_id>/<table_ref>/`, UTF-8, comma-separated, with this header line and one line per cell:

```
crop_id,kind,col,row,text_as_printed,marks,sure
```

| column | meaning |
|---|---|
| `crop_id` | the crop's id, the same on every line |
| `kind` | `header`, `label`, `cell` or `footnote` |
| `col` | `cell` and `header`: the train column number `c<n>` → `n`. `label`: the label sub-column `L<n>` → `n` (0 = station name, 1 = the arr./dep. column, …). `footnote`: always `0` |
| `row` | `cell` and `label`: the body row number `r<n>` → `n`. `header`: the header line `h<n>` → `n` (0 = top line). `footnote`: the footnote's position, 0 for the first (top) one |
| `text_as_printed` | what is printed, using the tokens below; empty for a blank cell |
| `marks` | typographic marks of the cell, separated by `;` (see below); empty if none |
| `sure` | `y` sure, `n` readable but doubtful, `x` illegible |

How many lines: (number of train columns × number of header lines) + (number of body rows × (number of label sub-columns + number of train columns)). A crop with columns c12–c19, header lines h0–h2, label sub-columns L0–L1 and rows r30–r47 needs 8×3 + 18×(2+8) = 204 lines. The order of lines does not matter; header lines first, then row by row, is easiest to check.

Quote a field with double quotes if it contains a comma (`"Köln (Cologne), Hbf."`). Never type a bare `"` inside text (see ditto marks).

## Writing what is printed

**Characters.** Copy letters, digits and punctuation as printed, including old spellings, accents and capitals: `Cöln`, `Eydtkuhnen`, `Wirballen`, `ST. PETERSBURG`. Keep the separator between hours and minutes exactly as printed: `8 15`, `8.15`, `8·15`. Several spaces count as one. Do not add a separator that is not printed (`815` stays `815`).

**Signs: use these tokens.**

- A ditto mark (printed as `"`, `„`, `”`, `〃` or similar) → `〃` (always this one character, U+3003).
- `do.`, `id.` or `dito` written in letters → as printed (letters are text, not a ditto mark).
- A vertical bar or rule, meaning the train passes without stopping → `|` (one vertical-bar character, however long the printed rule).
- A horizontal dash or rule inside a cell, any length → `—` (one em dash, U+2014).
- A row of dots or dot leaders → `…` (U+2026).
- Nothing printed → empty text, `sure=y`.
- A word or abbreviation (`arr.`, `dep.`, `aft`, `mrn`, `Lux.`, `Sleeping Car`) → as printed, keeping the full stop.

**Two things in one cell.** Write them in reading order (left to right, then top to bottom) with one space between: a small `aft` printed above `1 15` → `aft 1 15`.

**A heading spanning several columns** (for example `Sleeping Car` printed across c14 and c15): write it once, in the leftmost column it covers, and leave the other columns' lines for that header line empty.

**A station name broken over two rows** (`Eydtkuh-` / `nen`): write each part on its own row, as printed, including the hyphen.

**Small capitals** (`Berlin` printed in small caps): type the letters as they read (capital first letter, the rest lower case) and add the mark `sc`.

## Marks

| mark | when |
|---|---|
| `b` | the cell's figures or words are in **bold/heavy** type (many guides print p.m. times in heavy type: this matters) |
| `i` | italic |
| `u` | underlined |
| `sc` | small capitals |
| `fn:<symbol>` | a footnote reference mark printed with the cell, e.g. `fn:*`, `fn:†`, `fn:‡`, `fn:§`, `fn:a`, `fn:b`, `fn:1` |

- Light (normal) type has no mark. Judge bold against the neighbouring cells: in guides that print p.m. in heavy type, the difference can be slight but is consistent.
- If only part of a cell is bold (a roman `aft` beside a heavy time), mark what the figures are in.
- A footnote reference mark goes into `marks`, **not** into the text: a time `8 15` with a small `†` after it is text `8 15`, marks `fn:†`. Two marks: `fn:*;fn:†`.
- A symbol standing **alone** in a cell, as its whole content, is text: a cell holding only `*` is text `*`, no marks.

## sure

- `y`: you can read every character and mark.
- `n`: you can read it, but one character or mark is doubtful (a 3 that might be an 8, bold you are not sure of). Give your best reading.
- `x`: you cannot read it. Write the characters you can read with `?` for each one you cannot (`1? 15`), or leave the text empty if nothing is readable. Do not choose between two candidates: that is the resolver's job, with a sharper zoom.

## Footnote crops

A footnote crop shows the footnotes under the table. Key each footnote as one line of kind `footnote`, `col` 0, `row` 0, 1, 2 … from the top (left column first if they are printed in columns). The text is the whole footnote including its leading symbol, as printed; a footnote that wraps onto a second printed line is still one row, with the parts joined by one space. Put the footnote's own symbol in marks as `fn:<symbol>`.

## Before you save

- One line per cell; no cell missing, none twice; no cell outside the crop's columns and rows.
- Every ditto mark is `〃`, never `"`.
- Times are as printed: no added zeros, no 24-hour times, separators unchanged.
- Bold checked on every time.
- Illegible cells are `sure=x`, not guesses.

## Worked example

A crop of columns c4–c5 and rows r10–r13 with two header lines and label sub-columns L0–L1 shows:

```
             c4         c5
  h0         D 41       217          ← "D 41" in heavy type
  h1         1 2        "            ← a ditto mark under "1 2"
  r10 Berlin (Friedr.) dep.   11 0      8 15†   ← "11 0" heavy (p.m.); a dagger after 8 15
  r11 Küstrin          …      |         9 2?    ← last digit of 9 2? smudged: 9 23 or 9 28
  r12 Königsberg       arr.   4 31      —
  r13 "                dep.   4 45      ......
```

The file `<crop_id>.A.csv`:

```
crop_id,kind,col,row,text_as_printed,marks,sure
T57-c4-5-r10-13,header,4,0,D 41,b,y
T57-c4-5-r10-13,header,5,0,217,,y
T57-c4-5-r10-13,header,4,1,1 2,,y
T57-c4-5-r10-13,header,5,1,〃,,y
T57-c4-5-r10-13,label,0,10,Berlin (Friedr.),,y
T57-c4-5-r10-13,label,1,10,dep.,,y
T57-c4-5-r10-13,cell,4,10,11 0,b,y
T57-c4-5-r10-13,cell,5,10,8 15,fn:†,y
T57-c4-5-r10-13,label,0,11,Küstrin,,y
T57-c4-5-r10-13,label,1,11,,,y
T57-c4-5-r10-13,cell,4,11,|,,y
T57-c4-5-r10-13,cell,5,11,9 2?,,x
T57-c4-5-r10-13,label,0,12,Königsberg,,y
T57-c4-5-r10-13,label,1,12,arr.,,y
T57-c4-5-r10-13,cell,4,12,4 31,b,n
T57-c4-5-r10-13,cell,5,12,—,,y
T57-c4-5-r10-13,label,0,13,〃,,y
T57-c4-5-r10-13,label,1,13,dep.,,y
T57-c4-5-r10-13,cell,4,13,4 45,b,y
T57-c4-5-r10-13,cell,5,13,…,,y
```

Notes on the example: `11 0` stays `11 0` (no zero added); `4 31` is given with `sure=n` because the keyer was not certain it is heavy; the smudged `9 2?` is `sure=x`; the empty L1 cell of r11 is still keyed. A footnote crop for the same table might read:

```
crop_id,kind,col,row,text_as_printed,marks,sure
T57-fn-p1,footnote,0,0,† Runs on Sundays only.,fn:†,y
T57-fn-p1,footnote,0,1,"* Stops to set down from beyond Königsberg, on notice to the guard.",fn:*,y
```
