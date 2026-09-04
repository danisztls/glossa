# The corpus

Why the corpus repository is shaped the way it is. The data contract is
`docs/corpus-schema.md`; what must be true before touching a file is
`CLAUDE.md` and `pipeline/CLAUDE.md`.

## Where it lives

**The corpus is a separate, private repository** — `glossa-corpus`, a sibling
checkout, `CORPUS_DIR` moving both halves. Not because of size: `raw/` is
**reproduction**, the complete original pages including everything the parser
discards, where quotation (fixtures, corrections' `from`/`to`, research notes)
is a different thing and stays here. A build is therefore not reproducible from
a clone of this repository alone. That is the accepted cost.

**`raw/` is write-once; `build/` is regenerable; `oracles/` is hand-read.** The
whole insurance policy is that capture regret is fixed by re-parsing, never
re-crawling, and that holds only while `raw/` is intact. The directories are
named for that question (2026-08-27, was `works/`), so `.gitignore` can say
`build/` once and a generated kind added later is ignored by default rather
than by someone remembering.

**`build/` is not tracked** (2026-08-27). Tracking it bought a history of
_output_ — 42 of 71 commits touched nothing else — over a repository that
exists for the pages someone else's server was asked for. The pack fell from
182 MB to 137 MB, which is the smaller half of the point.

**The precondition was a measurement, not the README's claim.** "Reproducible,
therefore safe to drop" had never been tested and failed three ways: the
documented recipe named pre-reorganisation paths for six of eight commands, it
omitted three scrapers and built 369 of 383 works silently, and a rebuild into
an empty directory dropped `translations` from 125 manifests. Verified after
the fixes: 383 works, 1,850 files, zero differences outside three timestamps,
zero requests, 16 seconds.

**Output regenerable only from a copy of itself is not regenerable.** Every one
of the losses above was a fact the scrapers kept alive by reading their own
previous `manifest.json`. `CLAUDE.md` holds the table of what was moved and
where it lives now.

**A normalised field is a hole a reproducibility check cannot see.** The
capture dates were being lost invisibly because the check excluded
`retrieved_at` on the strength of a README sentence saying it recorded only
when the parse ran. A check can disprove a claim about a value; it cannot
disprove a claim that the value does not matter. Normalise `generated_at` and
`applied_at`, nothing else.

**A date the source was asked on belongs to the page.** `retrieved_at` records
an action taken toward a third party rather than a computation over the result,
so it lives in `raw/<source>/captured-at.json`, written by `Fetcher` as it
writes the file — the only point where a cache hit cannot fake it. The true
per-page dates were recovered from filesystem mtimes, which git does not
preserve.

**A status the source answered is an input.** `translations` records what a
missing sibling-language edition turned out to BE — a page shell, a measured
404 — knowledge bought with requests, so it sits beside `absent-sources.json`
in `pipeline/`, tracked and diffable, and the parser reads it rather than
remembering it.

## Capture

**Someone else's server is a commitment, not a tuning parameter.** vatican.va's
`Crawl-delay: 2` is its own; `FetchPolicy` has no default for `delay` or
`user_agent`, so a new scraper cannot inherit a floor by forgetting to state
one. Never run two sweeps at once.

**Requests are serial; parsing is not.** `fetch_for_parse` stays behind the
floor, `parse_and_write` fans out, so a document parses inside the two seconds
the crawler already owes.

**A 404 is an answer, not a failure to retry.** Definitive statuses land in
`pipeline/absent-sources.json`; a timeout or 5xx must never, since caching one
as an absence drops a real document. `--recheck-absent` reopens the question.

**Capture every edition the source has, because capture is cheap and
re-crawling is not.** All fourteen Compendium editions were in `raw/` when two
were parsed — twelve requests once, against crawling that server again the day
a third language is wanted. It paid out on 2026-09-02 when all fourteen came to
parse with no request to anyone. It scales by judgment: that Compendium is
68 MB, 51 MB of it one Indonesian PDF, and a work with hundreds of per-chapter
pages per language would deserve a different answer.

**A resumed download is a different operation from a retried one.** A 50 MB
file across an edge that drops long transfers never arrives by retrying — three
attempts reached 8 MB, then 33 MB, then failed. `common.download_resumable`
appends to a `.part` and asks for the rest; `Fetcher` stays the
whole-response-in-memory thing the pipeline is otherwise made of. (Related:
`IncompleteRead` is an `http.client` exception urllib does not wrap, so it used
to escape every caller that handles `FetchError`.)

**`generated_at` means when the content was generated**, not when a run touched
the file — `common.write_stamped_json` compares against the stored stamp,
all-or-nothing across a work's files. Otherwise every run rewrites everything
and the diff shows nothing.

**A sampled run reports and writes nothing** (`common.sample_run_writes_nothing`).
Seven of eight scrapers with `--sample` used to write the fraction they parsed
into the work's real `build/` directory, marked only by a `manifest.notes` line
nothing reads: a sampled `ccc.en` replaced `paragraphs.json` with two article
slices and would have passed preflight. The protocol exists to learn what a
full crawl would cost, which wants a report and not an artifact.

## What is stored

**One representation: `html`, with nothing derived stored beside it.** The
source is HTML and the render target is HTML; Markdown would be a detour with a
hand-rolled escaping layer over a corpus that is wall-to-wall `«…»`, `[…]`,
`(N*)` and italicised Latin, where an escaping bug looks exactly like a source
defect. The stored subset is a measured allowlist (`i`, `b`, `sup`, `br`,
`blockquote`); an unexpected tag has its markup stripped, its text kept, and an
anomaly logged.

**An oracle whose expected value is stored is not an oracle.** `text` and
`text_marked` were dropped once the round-trip check moved into
`validate_document`, where both sides are computed from the same source string
in the same process. Computing both is what made the check work.

**Absence means the default.** `kind`, `attribution`, `label`, `subtitle`,
`title_html` and their kin are omitted when unexceptional, so every stored
value marks an exception and `grep -c` is the census. `to: null` in an override
deletes a field back to its default rather than inventing a state.

**Structure records observed depth and an anchor; nesting and ranges are
derived.** A stored range drifts from the text — nearly every structural defect
found here was one — and a semantic `kind` would force the scraper to judge
whether a heading _means_ "chapter", which the sources do not encode.

**A section always has a number.** Text the source prints with no number goes
in `appendix.json`: `sections.json` is indexed by number by the chunker, the
compare view, `#s{n}` deep links and the route manifest, and a numberless row
is a hole in all four. An edition that numbers nothing is an `UNNUMBERED
EDITION` — valid, published, honest about lacking a citable address.

**Leading matter is a field, not a re-reading of `appendix.json`.**
`position: "leading"` rides on the unit as well as the structure row, because
the first leading run has no heading to carry it (Vatican I's constitutions
open with an address to the Church above the first `CAPUT`), and pairing by
title cannot place a run with no title. `before: null` keeps meaning what it
always meant.
