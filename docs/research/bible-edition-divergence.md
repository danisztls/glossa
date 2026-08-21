# When two Bible editions disagree about shape

Measured 2026-08-16 across `bible.cpdv.en` and `bible.matos-soares.pt`.
Analysis and a proposal; **nothing here is implemented** beyond the advisory
the compare view already shows.

## The measurement

Both editions carry all 73 books and 1,333 chapters in common.

- **30 chapters (2.25%)** have differing verse-number *sets*.
- **1 chapter** exists in one edition only (Esther 16, PT).

| book | diverging chapters |
| --- | --- |
| Esther | 15 |
| Psalms | 5 |
| Song of Songs | 5 |
| Genesis, Judges, 2 Samuel, 2 Thessalonians, Sirach | 1 each |

## The four kinds, which need different treatment

Lumping these together as "versification differences" is the mistake to avoid.
They are four distinct phenomena.

### a. Different distribution of deuterocanonical material — Esther

15 chapters plus a chapter that exists in only one edition. The Greek
additions to Esther are placed differently by different traditions; the
Vulgate appends them, others interleave them. Not a defect, not convertible by
a formula, and the largest single contributor.

### b. Verse merge/split — the five singletons, and Song of Songs

All five one-off cases have the identical shape: Portuguese has one more verse
at the end of the chapter. Reading the text shows no text is missing on either
side — the editions divide the same words differently:

```
2 Samuel 13
  EN v38  "…Absalom was in that place for three years. And king David ceased
           to pursue Absalom, because he had been consoled…"     ← PT 38 + 39
  PT v38  "Absalão, tendo fugido, acolheu-se a Gessur…"
  PT v39  "E o rei Davide deixou de perseguir Absalão…"
```

Same for Judges 21 (EN v24 = PT v24 + v25) and, in the other direction,
Genesis 37, where PT splits a clause into its own v36 and EN does not. Song of
Songs is the same phenomenon systematically rather than once.

**Consequence: from the merge point to the end of the chapter, the same verse
number names different text in the two editions.** In 2 Thessalonians 2,
EN v16 is PT v17.

### c. Numbering tradition — Psalms

The Hebrew/Greek-Vulgate offset that `versification.ts` already exists for.
The corpus canonicalizes on Vulgate and converts citations.
This is the one kind that *is* formulaic, and it is already handled — the
Psalms entries here are the residue that the table does not yet cover.

### d. Genuine textual variant — Psalm 13

The sharpest case. CPDV carries the long interpolation (the catena quoted at
Romans 3:13–18); Matos Soares does not. EN has 10 verses, PT has 7:

```
EN v6  "There is no fear of God before their eyes."          ← end of interpolation
EN v7  "Will they never learn: all those who work iniquity…" ≡ PT v4
EN v10 "Who will grant the salvation of Israel from Zion…"   ≡ PT v7
```

So EN 7–10 and PT 4–7 are the same four verses under different numbers, and
EN 4–6 have no counterpart at all. Both editions are faithful to their own
textual tradition. Neither is wrong.

## Why this matters more than 2.25% suggests

`docs/decisions.md` #2 made URLs edition-free: `/bible/2thess/2?v=16` names a
verse, not an edition's verse. That is right for 97.75% of chapters and false
for the rest — **and the failure is silent.** A reader following a citation
gets real, plausible, wrong text, with nothing marking it. This is the same
trap `CLAUDE.md` already records for Hebrew-vs-Vulgate chapter numbers ("a
wrong chapter does not fail an existence check — `Joel 3:1-5` resolves to real
but wrong text"), one level down.

It reaches further than the compare view:

- **Cross-references.** `xrefs/ccc-bible.json` anchors on verse numbers. In a
  divergent chapter the anchor is edition-dependent, and nothing says so.
- **The `?v=` citation highlight.** Highlights a span by number; in a divergent
  chapter it can highlight the wrong sentences.
- **Compare mode.** Aligns by number. Where the number *sets* differ it now
  shows an advisory. Where they coincide but the text has shifted, it cannot
  know.

## Proposal

### 1. Name it as its own category

The corpus has two mechanisms and this fits neither:

- `pipeline/corrections/` — **defects**, where one value is wrong and a
  correct one is known.
- `versification.*` — **conversions**, where a formula maps one system to
  another.

This is a third thing: **edition divergence**, where both editions are correct
and no formula relates them. Calling it a defect invites someone to "fix" a
faithful text; calling it versification invites someone to look for a formula
that does not exist.

### 2. A divergence table, generated then reviewed

Keyed by `(osis, chapter)`, recording the kind (`chapter-absent`,
`merge-split`, `numbering-tradition`, `textual-variant`), the verse-number sets
on each side, and evidence. Generated like `xrefs/`, but with the
*classification* reviewed by a person — a script can detect that two editions
disagree; it cannot diagnose why, and the four kinds above needed reading the
text to tell apart.

30 chapters is small enough to classify exhaustively and once.

### 3. Detect the silent case, without guessing

Number-set comparison misses the dangerous case (same numbers, shifted text).
A cheap signal that invents nothing: within a chapter whose verse-number sets
*match*, compare per-verse text-length ratios against the chapter's own median
ratio. A verse where one edition runs 2× the other, in a chapter averaging
~1.05×, is a candidate for review. This finds candidates; it does not align
anything and it does not decide anything.

### 4. Record explicit mappings only where confirmed

Where a correspondence is determinable and checked — `2thess 2: en 16 ↔ pt 17`
— record it. Then citations and compare mode can be *right* in those chapters
rather than merely cautious. A handful of chapters, verifiable by hand.

### 5. Disclose in the reading view, not only in compare mode

A reader following a citation into Psalm 13 is exposed whether or not they
opened the comparison. If a chapter is in the divergence table, the reading
view should say so — quietly, the way `.verse-absent` and the unpublished
notice already say what the site does not know.

### 6. Do not align by text similarity

Fuzzy-matching verses across editions to guess correspondence is exactly the
invention `docs/decisions.md` forbids for source defects. Detect, classify,
disclose, and map only where a person has confirmed the mapping.

## Note on how this was found

The cross-edition comparison was written for a reading feature, and it
surfaced a corpus-integrity problem nobody was looking for — the same way the
EN/PT symmetry check caught three parser bugs (`CLAUDE.md`). The five
singleton merge/split cases in particular are invisible from inside either
edition alone: each is internally consistent and perfectly plausible.

That argues for running the comparison as a **validation pass**, not only as a
reader-facing view.
