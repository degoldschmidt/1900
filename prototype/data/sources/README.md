# Sources: from library catalogue to resolved cells

This folder holds what we know about the digitised guides and where their pages are. The workflow (PLAN.md, Data workstream) runs left to right; each step has one tool and leaves a file you can review.

```
discover → coverage matrix → gate G1 → manifests → fetch → layout → crops
        → double keying → diff → resolve → merge → normalise → validate → historian review
```

| step | tool | reads | writes |
|---|---|---|---|
| 1. Discover | `node tools/discover/run.ts` (`--dry-run` lists the requests) | `tools/discover/search-plan.json` | `data/sources/catalogue.csv` |
| 2. Find pages | `node tools/discover/run.ts grep <source_id> --stations "Berlin,Eydtkuhnen,…"` | the library's full text (archive.org djvu.txt, Gallica ContentSearch) | page list on stdout |
| 3. Coverage | edit `coverage.csv`, then `node tools/discover/coverage.ts [--tier-a seg,…]` | `data/sources/coverage.csv` | `data/sources/COVERAGE.md` |
| 4. Gate G1 (owner) | — | `COVERAGE.md` | decision in `DECISIONS.md` |
| 5. Manifests | `node tools/fetch/manifest.ts init <source_id> <pages>` | catalogue | `data/sources/manifests/<source_id>.csv` |
| 6. Fetch | `node tools/fetch/fetch-pages.ts <source_id>` | manifest | `scans/<source_id>/p<seq>.<ext>` (git-ignored); checksums into the manifest |
| 7. Layout | by hand or by an agent, once per table | the page image | `data/raw/<source_id>/<table_ref>/layout.json` (format in `tools/crops/layout.ts`) |
| 8. Crops | `node tools/crops/make-crops.ts <source_id> <table_ref>` | layout, page image | `scans/<source_id>/crops/<table_ref>/*.png`, `data/raw/<source_id>/<table_ref>/crops.csv` |
| 9. Double keying | two agents, each following `tools/keying/KEYER_BRIEF.md` | one crop image | `data/raw/<source_id>/<table_ref>/<crop_id>.A.csv` and `.B.csv` |
| 10. Diff | `node tools/keying/diff.ts <source_id> <table_ref>` | A, B, crops, layout | `<crop_id>.diff.csv`; `data/raw/status.csv` (below 950‰ agreement: `rekey`) |
| 11. Resolve | `node tools/keying/resolve-support.ts <source_id> <table_ref>`, then a third agent per `tools/keying/RESOLVER_BRIEF.md` | diff, page image | `build/resolve/…/packet.md` + zooms; the resolver's `<crop_id>.R.csv` |
| 12. Merge | `node tools/keying/merge.ts <source_id> <table_ref>` | A, B, the resolver's rows | complete `<crop_id>.R.csv`; status `resolved` |
| 13. Review page | `node tools/review/side-by-side.ts <source_id> <table_ref>` | crops, R | `build/review/<source_id>-<table_ref>.html` |
| 14. Normalise | `tools/normalize/` (separate workstream) | resolved cells, notation | `data/canonical/*.csv` |
| 15. Validate | `npm run data:validate` | canonical tables, raw keying | `build/reports/validation.md` |
| 16. Historian | `tools/keying/HISTORIAN_BRIEF.md`; `node tools/keying/sample.ts draw/score` | everything above, the scans | `data/review/HISTORIAN_REVIEW.md`, `data/review/sample-*.csv` |

## Files here

- `catalogue.csv`: one row per digitised volume or issue. `source_id` is derived from the library's identifier (`ia-<archive.org identifier>`, `ht-<HathiTrust htid>`, `ga-<Gallica ark>`; characters outside `[A-Za-z0-9._-]` are written `~XX`), so re-running discovery updates the same row. Discovery refreshes `library`, `library_id`, `url`, `access`, `pages`, `language`; fills `title`, `publisher`, `edition_label`, `issue_date`, `terms_note`, `notes` only when empty; never touches `validity_stated` (read it from the guide's title page and write it by hand); `found_by` collects the search-plan entries that found the row. `access` is `full` (full view anywhere), `pdus` (HathiTrust: full view in the US only) or `none`.
- `coverage.csv`: one row per (edition, segment) assessed: `edition_id`, `segment_id`, `status` (`full` | `partial` | `missing` | `restricted`), `pages`, `table_refs`, `notes`. `COVERAGE.md` is generated from it.
- `manifests/`: per-source page lists; see `manifests/README.md`.

## Network

archive.org, gallica.bnf.fr, catalog.hathitrust.org and babel.hathitrust.org must be opened in the environment's network settings (PLAN.md, "Source access"). Until then every request is refused by the egress proxy and the tools say `host blocked by environment egress policy: <host>` and exit with status 3; nothing is retried.

Node's built-in `fetch` ignores `HTTPS_PROXY` unless Node starts with `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21). The discovery and fetch tools re-run themselves with that variable when a proxy is configured, so `node tools/discover/run.ts` works as is; setting it yourself (`NODE_USE_ENV_PROXY=1 node …`) avoids the extra process.

All requests go through one client (`tools/discover/http.ts`): about one request per second per host, exponential backoff on 429 and 5xx (honouring `Retry-After`), a descriptive User-Agent, and a response cache under `build/cache/http/` (git-ignored; `--offline` answers from it alone). Page images are not cached there: `scans/` is their cache.

## Calibration on synthetic pages

Keyers are calibrated before real pages (PLAN.md, Data workstream 5): `node tools/synth/render-page.ts --seed <n>` renders a period-style page with known truth into `build/synth/`; run the same tools on it with `P1900_DATA=build/synth/data P1900_SCANS=build/synth/scans`, then `node tools/synth/score.ts <source_id> SYN1` reports the cell error rate against the targets (single keyer ≤ 1.0%, resolved ≤ 0.1%). Synthetic names all start with `SYN_` and never enter `data/`.
