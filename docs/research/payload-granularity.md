# Payload granularity: should chunking extend past the CCC?

Research conducted 2026-08-16, against the real corpus as synced by
`scripts/sync-corpus.mjs` (347 works, 539 content files, 53.5 MB raw / ~12.0 MB
gzip in `corpus-data/content/` total — measured directly, not the 16.9 MB/4.6 MB
figure in `service-worker.ts`'s docblock, which predates the encyclical corpus
and is now stale by about 3x). The CCC's 100-paragraph chunking
(`sync-corpus.mjs`'s `CCC_CHUNK_SIZE`) is the only content kind split below
"whole work" today. This asks whether that precedent should extend to the
Bible, the Compendium, or Documents, now that two features (hover previews,
the full-document read view — see this task's Part 1) make read cost newly
visible.

## Current per-request cost, measured

Every number below is a real file size in `corpus-data/content/`, not an
estimate. "Worst" is the single largest file of that kind across both
languages; "median" is the middle value across every file of that kind.

| Content kind        | Unit fetched today    | Files      | Median raw                    | Median gzip | Worst raw                       | Worst gzip |
| ------------------- | --------------------- | ---------- | ----------------------------- | ----------- | ------------------------------- | ---------- |
| Bible chapter       | whole book            | 146 (73×2) | 45.7 KB (en) / 43.3 KB (pt)   | ~13 KB\*    | 287.4 KB (Psalms, en)           | 83.4 KB    |
| CCC paragraph       | 100-paragraph chunk   | 58 (29×2)  | 103.9 KB (en) / 110.1 KB (pt) | ~24 KB\*    | 143.4 KB (¶601-700, pt)         | 30.3 KB    |
| Compendium question | whole language file   | 2          | — (one file/lang)             | —           | 288.9 KB (en)                   | 85.1 KB    |
| Document section    | whole `sections.json` | 333        | 61.9 KB                       | ~14 KB\*    | 558.1 KB (Evangelium Vitae, pt) | 112.9 KB   |

\*Gzip figures marked with an asterisk are computed on the worst-case file
specifically (not a true median-of-gzip-sizes, which would require compressing
every file individually) — included because raw-to-gzip ratio is consistent
(~3.6-4.7x) across every kind measured, so the worst-case ratio is a reasonable
stand-in.

Two things stand out immediately:

1. **The CCC's own worst case (143 KB / 30 KB gzip) already exceeds its
   pre-chunking design budget** ("15-28 KB gzipped", `sync-corpus.mjs`'s own
   comment) — the corpus has grown since that number was written, and the
   chunk stride was never revisited. Not urgent (30 KB gzip is still small
   against a Bible chapter), but worth knowing the precedent has already
   drifted once.
2. **Documents are the true outlier, and only in the tail.** The median
   document (61.9 KB) is smaller than the median Bible book and smaller than
   every CCC chunk — chunking it would be pure overhead. But 113 of 333
   document files exceed 100 KB, and 53 exceed 200 KB; the worst, Evangelium
   Vitae's Portuguese edition, is 9x the document median and nearly 2x the
   CCC's own worst chunk. Documents also dominate total corpus weight: 35.8 MB
   of the corpus's 53.5 MB raw (67%) is `sections.json` files, against the
   Bible's ~19 MB and the CCC's ~7 MB combined across both languages.

## What chunking each kind would cost

All figures below are measured, not projected: `sync-corpus.mjs` was actually
run (0.5s wall time for the current 539-file corpus — file count is not the
bottleneck there) and directory listings were counted on disk.

**Bible.** Splitting per-chapter instead of per-book would go from 146 files to
2,667 (1,333 cpdv.en chapters + 1,334 matos-soares.pt chapters) — an 18x
increase in file count for a content kind whose read-time waste is already
small: `getChapter` in `corpus.ts` already reads the whole book but _returns_
one chapter, so the only cost chunking would remove is the first chapter read
of a session pulling in the rest of the book. That "waste" is deliberate
elsewhere in this codebase's design — a reader who opens Genesis 1 very often
continues to Genesis 2 and 3, and having the whole book already cached
(content-hashed, immutable, permanent in the service worker's `CONTENT_CACHE`)
turns every subsequent chapter in that book into a zero-network read. Chunking
would trade that away for a marginal first-load saving on books that are
mostly already well under budget (median 45.7 KB, i.e. one chapter's rendered
HTML weighs more than the JSON that fed it).

**CCC.** Halving the chunk size (50 paragraphs) would go from 29 to 58 chunks
per language — doubling file count to shave the worst chunk from 143 KB to
roughly 70-80 KB raw. Given the CCC's paragraphs are also the most
heavily cross-referenced content in the corpus (`getCccBibleXrefs`,
~3,800 refs), a smaller stride also means whole-chapter reads
(`getCccParagraphRangeAsync`) cross chunk boundaries more often — more distinct
fetches for the same chapter, working against the very feature ("a reader who
opens a chapter after reading one of its paragraphs usually needs no new
request at all," `corpus.ts`) the chunking scheme was built to preserve.

**Compendium.** 598 questions in one ~289 KB/85 KB gzip file per language is
already smaller than the CCC's _single largest chunk_. Chunking it would add
files (at CCC-sized strides, roughly 3-4 chunks/language) to shave a payload
that's already below what the CCC treats as one acceptable unit. Not worth it
on the numbers alone.

**Documents — the one case with a real argument.** Chunking only the 113
files over 100 KB, at a 100 KB stride (matching the rough size the Bible/CCC
already treat as an acceptable single unit), adds **220 files** — 333 becomes
553, a 66% increase concentrated entirely in the corpus's largest works. This
is a real migration, not a parameter tweak: it touches `sync-corpus.mjs` (a
new chunking pass, chunk-boundary bookkeeping like `cccChunkStartFor`),
`corpus.ts` (`getDocumentSectionAsync`/`getDocumentSectionsAsync` would need
the CCC's two-tier fetch-then-filter shape), `corpus-index.ts`'s content
manifest, and every document reading route (`documents/[slug]/[n]`,
`documents/[slug]/read`, the two routes this task's Part 1 already touches).
Total corpus size on disk is unaffected either way (chunking splits files, it
doesn't duplicate content) — the cost is entirely in file count and code
surface, not storage.

**Build cost.** `sync-corpus.mjs` runs in well under a second at current scale
(539 files); adding a few hundred more content files would not make it a
build bottleneck. The real cost of more, smaller files is on the _client_:
`corpus-index.ts`'s `listContentAssets()` is eager-inlined into the boot
index, so file count (not byte size) is what grows that inventory, and the
service worker's `cacheContent()` opens one `fetch()` per file when a reader
asks to cache a whole work offline — chunking the 113 large documents adds 220
files, so "download the whole library" goes from 539 requests to about 759,
mitigated by `cacheContent`'s existing concurrency cap of 6 but not
eliminated.

## Interaction with prerendering and the service worker

**Prerendering doesn't care about content-file granularity at all** — every
`load()` this task's Part 1 touched reads content at build time via
`node:fs` (`readContentFromDisk`), not `fetch()`, so chunking changes _which_
files get read and _how many reads_ happen, but not whether prerendering
works. The number that DOES matter to prerendering is **page count** (6,134
today), which chunking content files doesn't change — chunking is invisible
to the site's route/page structure; it only changes what a route's `load()`
fetches to fill a page that already exists.

**The service worker is where finer chunking pays off, and where it doesn't.**
`service-worker.ts`'s `CONTENT_CACHE` stores whatever a reader actually opens,
permanently, keyed by content-hashed URL — this is strictly a per-file cache,
so a reader who opens one section of Evangelium Vitae today downloads and
caches the _entire_ 558 KB `sections.json` to read a single section, and every
other section of that document is then free (already cached). Chunking that
file would shrink the first read but turn "every other section is free" into
"every other section in a DIFFERENT chunk costs a new fetch" — for a reader
working through a document section-by-section (the site's own primary
navigation pattern, per/next), that is a straight trade of one cost for
another, not a pure win. It's a clear win specifically for: (a) the hover
preview (Part 1 already resolves only the active language, so a chunked
document would additionally avoid pulling in sections the reader never asked
about), and (b) a reader who opens exactly one section and leaves — the CCC's
own justifying case, since 2,865 paragraphs behind one `¶1` visit is a much
worse ratio than 105 sections behind one `§1` visit.

## Ranked recommendation

1. **Do not chunk the Bible or the Compendium.** Both are already at or below
   the CCC's own single-chunk budget (Compendium's whole file is smaller than
   the CCC's largest chunk; the Bible's median book is a third of it), and the
   Bible's per-book granularity is load-bearing for continuous-reading cache
   locality (`getAdjacentChapterAcrossBooks`) in a way chunking would work
   against. No numbers here justify the migration cost.
2. **Documents are the one candidate worth a real proposal, and only the
   tail.** Chunk the ~113 files over 100 KB (not all 333) — most of the
   corpus's total weight and every payload this task's Part 1 had to work
   around lives in that tail. This is real engineering (220 new files, a new
   chunk-boundary scheme, four call sites to update), so it should be scoped
   and staffed as its own migration, not folded into Part 1's fix.
3. **Revisit the CCC's own chunk size before extending the pattern anywhere
   else.** Its worst case has already drifted past its original design budget
   (143 KB vs. a stated 15-28 KB gzipped target) as the corpus grew; extending
   the same fixed 100-paragraph stride to a new content kind without first
   confirming it still holds its own budget would carry the drift forward
   rather than fix it.
4. **The highest-leverage fix was already the one this task implemented, not
   a corpus migration:** Part 1's fetch-the-active-language-only change
   removes the _entire_ unused-language payload (up to 558 KB raw per
   document) from the read view without touching a single content file —
   cheaper than any chunking scheme here, and it composes with chunking later
   if Documents' tail does get split.
