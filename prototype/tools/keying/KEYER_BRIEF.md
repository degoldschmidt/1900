# Keyer brief

You are one of two independent keyers. You transcribe **one crop** of a printed railway timetable, cell by cell, exactly as printed. Another keyer does the same crop without seeing your work; the two readings are compared and every difference goes to a resolver. Accuracy matters far more than speed: the target is at most 1 wrong cell in 100.

## The rules that matter most

1. **Look only at the crop image you were given.** Do not open the other keyer's file, a resolved file, OCR text, another guide, a map or anything you remember about real trains. Do not "fix" a time because the train would otherwise be too fast or too slow.
2. **Transcribe as printed. Do not normalise.** No 24-hour conversion, no leading zeros added or dropped, no spelling corrections, no expanded abbreviations.
3. **Never guess.** If you cannot read a cell, mark it `sure=x` (illegible). If you can read it but are not fully certain, give your reading with `sure=n`.
4. **Key every cell of the grid, including blank ones.** A blank cell is a line with empty text.
5. **Never key a crop you have not seen.** If reading the crop image fails, returns an error, or shows "media removed", an empty or a broken picture instead of a printed page: stop work on that crop and try to read it once more. If it fails again, write **no file** for that crop and say in your reply which crop could not be loaded and what the tool returned. Never fill cells from memory, from the other crops of the table, from the ruler numbers or from what a timetable usually holds. The same holds for any image you open later (a sign example, a second look): if it does not load, do not act on it.

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
- **Pale strips at the edges** of each part (the print shown through a white wash) are margin: a little of the page beyond the crop's own cells, shown so that nothing at an edge is cut. Use them only to finish reading a cell of the crop whose print runs over its edge (the last letters of a station name, a figure printed across a column rule, a time in the edge column). Never key anything that lies wholly in a pale strip: those cells belong to other rows, columns or crops.
- **Row numbers may jump.** Only the rows a game needs are keyed (stations such as Dresden, Bodenbach, Prague); the rows between them are left out of the crop, and an orange line marks each place where rows were left out. Key exactly the `r<n>` shown.
- A **footnote crop** (its id ends in `-fn-<panel>`) shows only the footnotes printed under the table; see "Footnote crops" below.
- A **column-notes crop** (its id contains `-cn-`) shows the train columns at full height; see "Column-notes crops" below.

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

**Characters.** Copy letters, digits and punctuation as printed, including old spellings, accents and capitals: `Cöln`, `Eydtkuhnen`, `Wirballen`, `ST. PETERSBURG`. Keep the separator between hours and minutes exactly as printed: `8 15`, `8.15`, `8·15`. Several spaces count as one. Do not add a separator that is not printed (`815` stays `815`). The one exception: minutes printed **raised and smaller** than the hour figures (`8⁵⁰`, as in the German Kursbücher) are written after one space, `8 50`; the raised position is their separator.

**Signs: use these tokens.**

- A ditto mark (printed as `"`, `„`, `”`, `〃` or similar) → `〃` (always this one character, U+3003).
- `do.`, `id.` or `dito` written in letters → as printed (letters are text, not a ditto mark).
- A vertical bar or rule, meaning the train passes without stopping → `|` (one vertical-bar character, however long the printed rule).
- A horizontal dash or rule inside a cell, any length → `—` (one em dash, U+2014).
- A bar or line running across the whole column on the line between two rows (closing a boxed note, a frame round a group of times, or one train before the next one starts, often with `ab` below it) is the table's structure, not part of either cell: do not key it. A dash in a cell is short and stands mid-row, level with the figures.
- A row of dots or dot leaders → `…` (U+2026).
- Nothing printed → empty text, `sure=y`.
- A word or abbreviation (`arr.`, `dep.`, `aft`, `mrn`, `Lux.`, `Sleeping Car`) → as printed, keeping the full stop.

**Two things in one cell.** Write them in reading order (left to right, then top to bottom) with one space between: a small `aft` printed above `1 15` → `aft 1 15`.

**A heading spanning several columns** (for example `Sleeping Car` printed across c14 and c15): write it once, in the leftmost column it covers, and leave the other columns' lines for that header line empty. The same holds for a time printed once across two columns (often under a brace joining them): write it in the leftmost column it covers, leave the others empty, and mark it `sure=n` so the resolver checks the span.

**Notes printed sideways or in boxes inside the train columns** (`Schlafwagen Berlin–Karlsbad`, `Nur Sonn- u. Festtags`, `Vom 15. Juni bis 15. September`) are not the content of the cells they run through. Key such a cell empty with `sure=y` unless a time or sign of the train itself is also printed in it; the notes are keyed from the column-notes crop. Everything that belongs to the note stays with the note: the sign that opens it (the `□` before `In Tetschen u. Bodenbach Zollabfertigung`), and any time printed inside it, turned with its words (`… in Bergen 1 40, in Sassnitz 2 23`). Such a time is not the train's time at the row it happens to cross: the cell stays empty. A time of the train stands upright in its row, like the times above and below it.

**Words in time cells** such as `ab`, `an`, `Ank.` or `Abf.` are written as printed, like any other word.

**Station names (label column L0).** Three conventions, the same for every keyer:
- A sign printed after the name (`□`, `●`, `†`, `*` …) is a footnote mark: it goes into `marks` as `fn:<sign>`, never into the text. `in Bodenbach □ . .` → text `in Bodenbach`, marks `fn:□`.
- Leader dots after the name (`.`, `. .`, `....`) are written as one `…` after a space: `aus Dresden-Neustadt …`. An abbreviation's own full stop stays (`Dresden Hbf. …`).
- A number printed before the name (the number of a connecting table, or a kilometre figure) is part of the text, as printed: `62 in Tetschen`, `3 Dresd. Wettinerstr. …`. Do not drop it.

**A station name broken over two rows** (`Eydtkuh-` / `nen`): write each part on its own row, as printed, including the hyphen.

**Small capitals** (`Berlin` printed in small caps): type the letters as they read (capital first letter, the rest lower case) and add the mark `sc`.

## Marks

| mark | when |
|---|---|
| `b` | the cell's figures or words are in **bold/heavy** type (many guides print p.m. times in heavy type: this matters) |
| `i` | italic: **only on the column's train-number header cell**, for a train whose times are printed in italic (see "Train category" below). Not on body cells |
| `u` | underlined (German Kursbücher underline the minutes of night times, 6.00 p.m.–5.59 a.m.: this matters as much as bold) |
| `sc` | small capitals |
| `fn:<symbol>` | a footnote reference mark printed with the cell, e.g. `fn:*`, `fn:†`, `fn:‡`, `fn:§`, `fn:a`, `fn:b`, `fn:1` |

- Light (normal) type has no mark. Judge bold against the neighbouring cells: in guides that print p.m. in heavy type, the difference can be slight but is consistent.
- If only part of a cell is bold (a roman `aft` beside a heavy time), mark what the figures are in.
- A footnote reference mark goes into `marks`, **not** into the text: a time `8 15` with a small `†` after it is text `8 15`, marks `fn:†`. Two marks: `fn:*;fn:†`.
- A symbol standing **alone** in a cell, as its whole content, is text: a cell holding only `*` is text `*`, no marks. (A sign that opens a sideways note is part of the note, not of the cell: see above.)

## Train category: italic, once per column

In some guides (Fritzsches Kursbuch among them) a train's times are all printed in italic figures when it is an express (Schnellzug, Luxuszug). Italic belongs to the **train**, not to single cells, and in this type it is easy to miss: the italic hour figures (`2`, `7`, `1`) look almost upright, and only the minutes slant clearly. So:

- **Judge italic for the whole column**, from all its times together: compare their slant with the upright times of the neighbouring columns. A column whose minutes slant is italic, even where one figure looks upright.
- **Mark it once: `i` on the column's train-number header cell** (the header line holding `D 53`, `57`, `283`). If the table prints no train numbers in its header (an empty header band, or only classes), put `i` on the column's top header line (`h0`), even when that cell is otherwise empty (text empty, marks `i`).
- **Do not mark `i` on body cells.** Key the times with their other marks only (`u`, `fn:…`).
- A train that starts part-way down a column (its number printed there, keyed in the column-notes crop as `293 II-IV`): put `i` on that note's line if its times are italic.
- If you are not sure whether a column is italic, mark the header cell as you judge it and set its `sure=n`.

## Signs in this guide: Fritzsches Kursbuch

Fritzsche explains its signs on p. 5 ("Zeichenerklärung"). The ones you will meet, and how to key them:

| printed | meaning (p. 5 and the pilot) | how to key it |
|---|---|---|
| `!` before a time | a sign referring to a note (the pilot's keyers dropped it twice: look for it before every time) | marks `fn:!` |
| `□` small hollow square | customs examination in the Bodenbach/Tetschen tables, another note elsewhere | `fn:□` |
| `◗` half-disc, `●` large disc, `•` small dot, `■` filled square, `§`, `†`, `✠`, `✤`, `♣`, `:` (two stacked filled dots) | signs referring to notes in the column or under the table | `fn:<sign>`, the sign as printed |
| `°` small open ring vs `○` large open ring | two different signs, told apart **by size**: `°` is no taller than the raised minutes; `○` is about as tall as the hour figures | `fn:°` or `fn:○`; if you cannot tell the size, `fn:?` and `sure=x` |
| two small signs printed together, side by side or **stacked one above the other** (two rings, two squares) | one sign of its own, different from the single sign | the sign written twice with nothing between: `fn:°°`, `fn:○○`, `fn:□□` (two stacked filled dots are the colon, `fn::`) |
| `×` before a time | the train stops only on request (p. 5, item 1) | in the **text**, as printed: `× 8 15` |
| `(e)` / `(a)` with a time | stops only to pick up (`e`, Einsteigen) / only to set down (`a`, Aussteigen) (items 2–3) | in the **text**, as printed: `8 15 (e)` |
| italic figures | Schnellzug; with `L` before the number, Luxuszug (items 4, 6) | `i` once on the train-number header cell (see above) |
| `D`, `E`, `L` before a train number | D-Zug, Eilzug, Luxuszug (items 4, 5, 7) | part of the header text: `D 53` |
| underlined minutes (`6 50` with a rule under `50`) | night time, 6.00 p.m.–5.59 a.m. (item 10) | `u` |
| figures left / right of a station name | kilometres / number of a connecting table (items 11, 12) | part of the label text, as printed |

Signs are small: before writing a time, look at the space just left of its hour figure and just right of its minutes. A sign whose shape you cannot name is `fn:?` with `sure=x`, never the nearest sign in this list.

**Examples.** If the folder `build/brief/signs/` exists, look at its images before you start: each shows one sign, cut from the pilot pages and magnified (red ticks outside the image mark the cell; `index.md` there says which sign each image shows). If an image there does not load, carry on without it (rule 5): never guess what it showed.

## sure

- `y`: you can read every character and mark.
- `n`: you can read it, but one character or mark is doubtful (a 3 that might be an 8, bold you are not sure of). Give your best reading.
- `x`: you cannot read it. Write the characters you can read with `?` for each one you cannot (`1? 15`), or leave the text empty if nothing is readable. Do not choose between two candidates: that is the resolver's job, with a sharper zoom.
- **Confusable digits.** If a digit could be one of 3/8, 5/6, 6/8, 0/8, 3/5 or 8/9 and you cannot see the stroke that tells them apart, give your best reading with `sure=n` (header train numbers included), so the cell goes to the resolver's zoom.
- **An uncertain separator alone is never `x`.** If every figure is clear but you cannot tell whether hours and minutes are separated by a space, a point or a raised point, write the separator you think most likely and mark `sure=n`. The separator does not change the time; an `x` would block the whole table for nothing.
- **Footnote symbols are never guessed.** If you can see that a small mark follows a time but cannot tell which symbol it is (`†`, `‡`, `§`, `*`, a letter), write the time, put `fn:?` in marks and mark `sure=x`. A wrong symbol silently attaches the wrong running rule to a train; in calibration every guessed symbol on a blurred page was wrong.

## Footnote crops

A footnote crop shows the footnotes under the table. Key each footnote as one line of kind `footnote`, `col` 0, `row` 0, 1, 2 … from the top (left column first if they are printed in columns). The text is the whole footnote including its leading symbol, as printed; a footnote that wraps onto a second printed line is still one row, with the parts joined by one space. Put the footnote's own symbol in marks as `fn:<symbol>`.

## Column-notes crops

A column-notes crop (id `<table>-cn-<panel>-c<a>-<b>`) shows columns c<a>–c<b> over the whole height of the table, cut in two: the **left part is the upper half, the right part the lower half**; they overlap a little, and an orange bar separates them. The red ruler names the columns over each part.

Key only the notes printed inside the train columns, not the times:
- text printed sideways or in a box (`Speisewagen Berlin–Prag`, `Nur Sonn- u. Festtags`, `§ Über Riesa m. Umsteigen daselbst`);
- a train number or class printed part-way down a column, for a train that starts below the top of the table (`293` above `II-IV`), or a word such as `Ank.`, `ab`, `an` standing alone above or below a block of times only if it is part of such a note.

Write one line per note: kind `footnote`, `col` 0, `row` 0, 1, 2 … (left part top to bottom, then right part), the text as printed (lines of a note joined by one space; a train number with its class line as `293 II-IV`), and in `marks` the column it stands in as `c:<n>` (a note spanning two columns: `c:3;c:4`), plus `fn:<symbol>` if the note begins with a footnote symbol (`i` too on a train-number note whose train's times are italic). A note cut by the split between the halves is keyed once, from the part where it is whole (the overlap is there for that); if neither part shows it whole, join the two pieces with one space. Pale strips at the sides are margin (the neighbouring columns): key only notes whose column is named in the ruler.

**A sideways note interrupted by times.** A note often runs past, or is broken by, times printed in its column, and some notes contain times of their own (`In der Nacht nach Sonn- u. Festtagen: 12 24`, `° v. 15./6. b. 15./9. in Bergen 1 40, in Sassnitz 2 23`). Key the note **whole, once, in reading order**: its words and its own times (turned with its words) in the order you read them along the note, joined by single spaces, even when the train's upright times break it into pieces. Do not key the train's own upright times as part of the note, and do not key the note's pieces as separate notes.

## Before you save

- One line per cell; no cell missing, none twice; no cell outside the crop's columns and rows.
- Every ditto mark is `〃`, never `"`.
- Times are as printed: no added zeros, no 24-hour times, separators unchanged.
- Bold checked on every time.
- Every column judged for italic, and `i` given once on its train-number header cell (never on body cells).
- The space before every time checked for a sign (`!`, `□`, `°`, `◗` …).
- Illegible cells are `sure=x`, not guesses.
- You saw the crop image itself. If it did not load, there is no file and your reply says so.

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
