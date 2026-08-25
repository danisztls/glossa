# Matos Soares: two transcriptions, and why the corpus keeps the one it has

Measured 2026-08-25 against a full crawl of vulgata.online edition `MS`
(73 books, 1,335 chapters, in `raw/vulgata-online/MS/`).

**Conclusion: do not re-source the text.** Take the apparatus and leave the
text where it is. The reasoning is below, and the crawl that establishes it is
already paid for and kept.

**Implemented 2026-08-25.** `matos_soares.py` now attaches the apparatus as
its last step, and `bible.matos-soares.pt` carries 3,013 footnotes, 1,279
chapter arguments and 5,733 headings on liriocatolico's verses. 1,483 notes
are anchored in the text by their own lemma; two named a verse this edition
does not have and were dropped. The section below is what the decision was
made on and is kept as the record.

## What was being decided

`bible.matos-soares.pt` is scraped from liriocatolico.com.br, whose chapter
pages print the edition's footnote **markers** and not their content. The
manifest has said since 2026-08-16 that vulgata.online carries the notes and
could backfill them.

Backfilling by marker position turned out to be impossible — the markers were
stripped at ingestion and their offsets never recorded — so the obvious move
was to re-take the whole edition from vulgata.online, which carries text and
apparatus together, already anchored, in the format `douay_rheims.py` reads.
`matos_soares_apparatus.py` does exactly that, and validates the result against
the edition already on disk before writing.

## What the comparison found

**98.01% of verses agree** (34,861 of 35,569, folding whitespace and
punctuation away). The disagreements that remain are almost all trivial —
`(foi)` against `(e foi)` in the Genesis 1 day-formula, and the like. Two
transcriptions of one 1956 printing, and they broadly are.

The problem is not the 2%. It is what is **absent**:

| what                          | count   | kind                                                            |
| ----------------------------- | ------- | --------------------------------------------------------------- |
| verses only in the old scrape | **247** | text this source does not have at all                           |
| — Job 32:15-22                | 8       | one contiguous run; the chapter stops at 14 of 22 verses        |
| — Esdras 6:9-13               | 5       | replaced by Esdras 4:9-13 (see below)                           |
| — Psalms 115 and 147          | 19      | numbering, not loss — see below                                 |
| — the rest                    | ~215    | scattered single verses: `gen 15:4`, `josh 4:25`, `ruth 1:19` … |

The scattered ones are **holes, not merges**. Genesis 15 arrives with 20
verses numbered up to 21 — verse 4 simply is not there, while 1-3 and 5-21
are. Josue 4 stops at 24 where the Clementine and the old scrape both have 25.

That is a defect rate of 0.7% of the Old and New Testaments, against a
transcription already in the corpus that does not have it. **No amount of
apparatus pays for 247 verses of Scripture.**

### Esdras 6 is contaminated by Esdras 4

Sixteen records — Esdras 4:9-24 — are duplicated into chapter 6 under their own
verse numbers. Nine of them collide with chapter 6's real verses (14-22) and
were caught as fatal segment collisions; the other five do not collide,
because **Esdras 6:9-13 is missing**, and Artaxerxes's letter sits silently in
its place. A reader would find the correspondence of chapter 4 in the middle of
the dedication of the Temple and nothing would look wrong.

This is the strongest single argument for the oracle that found it: the
contamination is invisible to every check that does not compare against another
witness.

### Psalms 115 and 147 keep Hebrew verse numbers

Both are the second half of a psalm the Vulgate splits (Hebrew 116 → Vulgate
114 + 115; Hebrew 147 → Vulgate 146 + 147). This source gives them Vulgate
psalm numbers with Hebrew **verse** numbers inside — Psalm 115 runs 10-19 where
the Clementine and the old scrape run 1-10.

Not a loss, and correctable with 19 renumbering corrections. Recorded because
it would break addressing silently: a citation to `Ps 115:1` would resolve to
nothing while the psalm sat there complete.

## What is worth taking

Everything the text is not. Parsed and validated, this source yields:

- **3,013 footnotes** (1,743 with a lemma) — the whole point of the exercise
- **1,279 chapter arguments**
- **5,733 headings** in a four-level hierarchy the corpus now models
  (`ChapterHeading.level`, added for this)
- the book prefaces, which belong to `bible-intro.pt` and are still unbuilt

## The path taken

Attach the apparatus to the text already in the corpus, rather than replacing
the text.

The join is by `(osis, chapter, verse)`, which 98% of verses agree on, and the
**anchors can be placed after all** — not by the marker positions that were
lost, but by the note's own `lemma`. Every note names the words it glosses;
find that phrase in the liriocatolico verse and put the token after it. That
is the same lemma-to-token relationship `douay_rheims.py` already builds, and
it is self-checking: the lemma oracle
(`docs/research/douay-rheims-lemma-audit.md`) reports every note whose lemma is
not in the verse, so a mis-join announces itself.

Notes whose lemma does not match go in verse-level without a token, which is
the shape the schema already allows (§"Every token must have a note entry. A
note need not have a token.").

**What this costs:** the 26 verses this source has and the old scrape does not,
and the chapter arguments/headings for anything the two number differently. Both
are recorded here rather than discovered later.

**What it cost in the event**, measured on the run that landed it:

| outcome                                                                        | notes |
| ------------------------------------------------------------------------------ | ----- |
| anchored in the text by their lemma                                            | 1,483 |
| kept on the verse, but the note quotes nothing to anchor to                    | 1,270 |
| kept on the verse, but the lemma quotes words this transcription does not have | 260   |
| dropped — named a verse this edition does not have (`ps 115:11`, `ps 115:16`)  | 2     |

The 1,270 were never anchorable: two in five of this edition's notes simply do
not open by quoting the text. The 260 are the interesting number — they are
where the two transcriptions disagree about the very words a note names, and
they are the Matos Soares counterpart of the Douay-Rheims lemma oracle's 72
(`douay-rheims-lemma-audit.md`). Both kinds keep the note and lose only the
token, which the schema allows outright.

**One bug worth recording, because it looked like a formatting quirk.** The
first implementation built its fold-to-plain-letters index over the
NFD-decomposed string and then sliced the original, so every accent before a
lemma pushed its token one place to the left — `quem não renascer ⟦1⟧da água`
instead of `renascer⟦1⟧ da`. In a language with an accent every few words that
is not an edge case. `fold_with_map` now decomposes per character, so an index
in the map is an index into the string the caller holds.

## What is already built

- `raw/vulgata-online/MS/` — the full crawl, committed, write-once
- `pipeline/scrapers/bible/matos_soares_apparatus.py` — parses it, validates it,
  and refuses to write; the re-sourcing oracle is the reason it exists
- `pipeline/corrections/bible.matos-soares.pt.json` — one file, two layers,
  told apart by the shape of the locator: 39 `{osis, chapter, verse}` entries
  correcting the liriocatolico verses that ship, and 32 `{osis, chapter,
record}` entries correcting an apparatus record of this source before it is
  parsed. The second set is what took the fatal collisions to zero; the first
  set is live, not retired, because the text it corrects is the text the site
  still serves

Nothing here needs re-crawling to act on.
