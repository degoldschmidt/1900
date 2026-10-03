# Page manifests

One file per source, `<source_id>.csv` (the `source_id` of `data/sources/catalogue.csv`), listing the only pages that may be fetched. `tools/fetch/fetch-pages.ts` downloads exactly these pages into the git-ignored `scans/<source_id>/p<page_seq>.<ext>` and fills in the checksum columns; the images themselves are never committed.

| column | filled by | meaning |
|---|---|---|
| `page_seq` | you | 1-based image sequence in the library's viewer: archive.org leaf + 1 (BookReader `n0` is page_seq 1), HathiTrust `seq`, Gallica view `f<n>`, SLUB METS physical `ORDER`. Not the printed page number. |
| `printed_page` | you | the page number printed on the page, as printed (`412`, `xiv`), empty if none |
| `content` | you | `title` (the title page, which states the edition and its validity), `table` (timetable or fare table), `handbook` (Baedeker text), `index`, `notation` (the guide's explanation of its signs: needed for every edition), `footnotes` (a page of general notes), `ads` |
| `table_refs` | you | the guide's own table numbers on the page, separated by `;` (`57;60`) |
| `url` | `manifest.ts init`, or you | the image URL: archive.org `https://archive.org/download/<id>/page/n<leaf>.jpg`, HathiTrust `https://babel.hathitrust.org/cgi/imgsrv/image?id=<htid>&seq=<n>&size=full`, Gallica IIIF `https://gallica.bnf.fr/iiif/ark:/12148/<ark>/f<n>/full/full/0/native.jpg`, SLUB `https://digital.slub-dresden.de/data/kitodo/<id>/<id>_tif/jpegs/<00000NNN>.tif.original.jpg` |
| `sha256` | fetch-pages | checksum of the downloaded file; a later download or a changed local file that differs is an error |
| `width`, `height` | fetch-pages | pixel size (sharp metadata) |
| `retrieved_at` | fetch-pages | UTC time of the download, `2026-10-03T10:00:00Z` |

Create or extend a manifest (existing rows and their checksums are kept):

```
node tools/fetch/manifest.ts init ia-bradshawscontine1914brad 410-415,1180 --content table --tables "57;60"
```

then edit `printed_page`, `content` and `table_refs` per page, and fetch:

```
NODE_USE_ENV_PROXY=1 node tools/fetch/fetch-pages.ts ia-bradshawscontine1914brad
```

Pages are found from the full text (`node tools/discover/run.ts grep <source_id> --stations "…"`), but no value is ever taken from OCR text: every value is keyed from the page image.
