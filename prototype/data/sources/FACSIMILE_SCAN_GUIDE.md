# Photographing the Bradshaw's Continental facsimile

Gate G1 (decisions P-007 and P-009) takes a printed facsimile of *Bradshaw's Continental Railway Guide* as the timetable anchor. Your photos are the scans: the keyers read them, and every transcribed time cites the page it came from. The photos are never committed to the repository; only the transcribed values and their citations are.

**Which book.**
- **Best:** *Bradshaw's August 1914 Continental Guide*, the David & Charles facsimile of 1972, later reprinted. It reproduces the issue in force at the outbreak of war, which is exactly the plan's anchor month. Second-hand copies are common. archive.org holds it only as a borrow-only scan that cannot be fetched from here.
- **Also usable:** the 1913 facsimile. That makes the anchor 1913, held into 1914 under the approved rule and flagged as a gap.
- Whichever you use, photograph its title page first so the issue month is on record.

**Already covered online.** The Berlin – Dresden – Prague – Vienna route (no. 9 below) comes from the Dresden library's digitised regional timetables: winter 1913/14 and summer 1914. Photograph it from the facsimile only if it is quick; it serves as a cross-check.

## 1. What to photograph, in this order

Use the guide's own index of places to find the tables. Photograph **every page of each table**, in **both directions**. Many routes are printed as an outward table and a return table on different pages.

**A. Identification (essential for citations)**
1. The title page and any page that states the month of issue or "corrected to".
2. The contents page(s).

**B. How to read the tables**

3. The explanation of signs, references and abbreviations, often near the front.
4. Any note on time: Central European time, Russian time, how a.m. and p.m. are shown (often by heavy type).

**C. The ten main routes (tier A).** The names in brackets are stations to look for.

| # | Route | Look for |
|---|---|---|
| 1 | London – Dover – Calais – Paris | Charing Cross or Victoria, Dover, Calais, Amiens, Paris Nord |
| 2 | London – Dover – Ostend – Brussels | Dover, Ostend, Bruges, Ghent, Brussels |
| 3 | Paris – Brussels | Paris Nord, St. Quentin, Maubeuge, Feignies or Quévy, Mons, Brussels |
| 4 | Brussels – Cologne | Brussels, Louvain, Liège, Verviers, Herbesthal, Aix-la-Chapelle, Cologne |
| 5 | Cologne – Hanover – Berlin | Cologne, Düsseldorf, Hamm, Hanover, Stendal, Berlin |
| 6 | London – Harwich – Hook of Holland – Rotterdam | Liverpool Street, Harwich, Hook of Holland, Rotterdam |
| 7 | Rotterdam (or Amsterdam) – Bentheim – Berlin | Rotterdam, Utrecht, Oldenzaal, Bentheim, Rheine, Hanover, Berlin |
| 8 | Berlin – Eydtkuhnen/Wirballen – St. Petersburg | Berlin, Schneidemühl, Dirschau, Königsberg, Insterburg, Eydtkuhnen, Wirballen, Vilna, Dünaburg, Pskov, St. Petersburg |
| 9 | Berlin – Vienna | Berlin, Dresden, Bodenbach or Tetschen, Prague, Vienna; or via Breslau and Oderberg |
| 10 | Paris – Vienna | Paris Est, Nancy, Avricourt, Strasburg, Stuttgart, Munich, Salzburg, Vienna |

**D. Sea crossings and expresses**
- The Channel and North Sea steamer services: Dover–Calais, Dover–Ostend, Harwich–Hook of Holland, and Queenborough or Folkestone–Flushing if printed.
- The pages listing international express, sleeping-car and through-carriage services.

**E. Fares and money (if printed)**
- Fare tables for the routes above, and any table of foreign money or exchange.

**F. Later, if tier B is wanted**
- Berlin – Warsaw – St. Petersburg (Alexandrowo), London – Flushing – Berlin, Harwich – Antwerp, the Baltic steamers. Don't photograph these yet.

Expect roughly 40–80 pages for A to E. If a route is missing from the guide, just tell me: that is a finding, not a problem.

## 2. How to photograph

- **Light:** daylight or bright even room light, with no flash. Avoid shadows across the page, including your own and the phone's.
- **Flat page:** press the book open, ideally under a sheet of clear glass or acrylic, or have someone hold the edges. Curved lines near the spine are the most common cause of misread cells.
- **Straight on:** hold the phone parallel to the page, directly above it, with the whole page in frame: margins, header and the printed page number.
- **One page per photo.** Don't photograph two facing pages together.
- **Sharpness:** after each shot, zoom in on the smallest figures. If you can't read a footnote mark (†, ‡, §) or tell a 3 from an 8, take it again closer. Move closer rather than zooming the camera.
- **Format:** JPEG at full resolution. On an iPhone set Settings → Camera → Formats → *Most Compatible*, otherwise photos are saved as HEIC.
- **No editing:** don't crop, filter or enhance. Rotating to upright is fine.
- **Order:** shoot in page order. If you can, rename files to include the printed page, e.g. `p387.jpg` or `IMG_1234_p387.jpg`. Otherwise I read page numbers from the images.

## 3. How to send them

- Attach them to a message here in batches (20–30 photos per message is fine), **or**
- upload them to a Google Drive folder named **1900 scans** and tell me. This session has a Google Drive connection and I can download from there.

Tell me which issue the facsimile reproduces (the month on its title page) when you send the first batch.

## 4. What happens next

I import the photos with `tools/fetch/import-scans.ts` as source `os-bradshaw-continental-1913`, which records a hash and dimensions for each page. Then the pilot (D2) runs on Berlin – St. Petersburg in both directions: crops, two blind keyers, a resolver, the validators and a historian sample. Its report shows accuracy and throughput before the rest is transcribed. Blurred cells are marked illegible rather than guessed. If a page needs re-taking, I will name the page and the cells.
