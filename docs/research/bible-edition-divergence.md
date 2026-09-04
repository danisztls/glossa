# When two Bible editions disagree about shape

First measured 2026-08-16 across `bible.cpdv.en` and `bible.matos-soares.pt`,
when it was analysis and a proposal. **Re-measured and classified 2026-08-25
across four editions**, and the classification is now code: `KINDS` in
`pipeline/scrapers/bible/divergence.py` holds one reviewed entry per diverging
chapter, and the tool fails if a chapter starts diverging that nobody has read,
or stops diverging while its entry stands. Run it with no arguments for the
table below.

```sh
uv run pipeline/scrapers/bible/divergence.py            # the table + the staleness check
uv run pipeline/scrapers/bible/divergence.py --verbose  # + verse-number sets and evidence
uv run pipeline/scrapers/bible/divergence.py --shifted  # + the silent-case candidates
```

## The measurement

`bible.cpdv.en` and `bible.matos-soares.pt` carry all 73 books and 1,333
chapters in common. **31 chapters** have differing verse-number _sets_ — 30 of
them differing in their numbering, plus Esther 16, which exists in Portuguese
and not in English.

Two more editions have joined since the first pass, and both are witnesses
rather than parties. `bible.clementina.la` is the text CPDV was translated
from and the one Matos Soares follows; `bible.douay-rheims.en` is a second
English edition of that same base, which matters at exactly two rows.

## The kinds

The 2026-08-16 pass named four kinds and **two of them did not survive
re-reading**. They are recorded here because the correction is the useful part:
each was a plausible reading of two editions that a third edition falsified.

| kind              | chapters | what it is                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------- |
| `arrangement`     | 16       | The book's material is ordered differently by tradition. Esther, and only Esther      |
| `merge-split`     | 8        | One incidental boundary — one edition divides where the other joins. Mappable exactly |
| `re-division`     | 6        | One edition divides the same words by a principle it applies throughout the passage   |
| `textual-variant` | 1        | One edition carries words the other does not. Not a numbering question at all         |

**Gone: "numbering tradition — Psalms."** The first pass filed the four
leftover Psalms rows under the Hebrew/Greek-Vulgate offset, as "the residue
that `versification.ts` does not yet cover." There is no residue. The corpus
canonicalizes on Vulgate numbering at ingestion, so the offset produces no
divergence at all, and all four Psalms rows turn out to be ordinary
`merge-split` or `re-division` — Psalm 43 splits one Latin verse in two, Psalms
125 and 135 join two, Psalm 92 numbers a title CPDV folds everywhere else.
Reading them as a numbering tradition would have sent someone looking for a
formula that was never there.

**Changed: Psalm 13 is not the "no formula relates them" case it was called.**
See below; it is the sharpest row here, but not for the reason first given.

## The table

Latin `?` is the column reported by the tool: which vernacular the Clementine's
verse division agrees with. It is evidence about one question and settles no
row on its own — Psalm 13 is why.

| locator     | kind              | Latin ? | what happens                                                                                              |
| ----------- | ----------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `gen 37`    | `merge-split`     | EN      | Latin v35 ends _Et illo perseverante in fletu,_; PT sets those words as its own v36                       |
| `judg 21`   | `merge-split`     | EN      | Latin v24 carries the return to the tents and _In diebus illis non erat rex in Israel_; PT divides them   |
| `2sam 13`   | `merge-split`     | EN      | Latin v38 carries Absalom's flight and David's ceasing to pursue him; PT divides them                     |
| `esth 1–16` | `arrangement`     | PT      | see below — the whole book, not sixteen incidents                                                         |
| `ps 13`     | `textual-variant` | PT      | PT omits the Romans 3 catena; LA, DR and EN all carry it. See below                                       |
| `ps 43`     | `merge-split`     | EN      | Latin v22 carries _Nonne Deus requiret ista_ and _Quoniam propter te mortificamur_; PT divides them       |
| `ps 92`     | `re-division`     | PT      | The Clementine prints no title; EN and PT both carry one and EN alone numbers it. EN also splits Latin v1 |
| `ps 125`    | `merge-split`     | PT      | Latin v6 carries the going out weeping and the coming back rejoicing; **EN and DR both** divide them      |
| `ps 135`    | `merge-split`     | PT      | Latin v26 carries both _Confitemini_; **EN and DR both** divide them                                      |
| `song 1`    | `re-division`     | PT      | see below — CPDV re-divides the Song by speaker                                                           |
| `song 2`    | `re-division`     | PT      | idem                                                                                                      |
| `song 5`    | `re-division`     | PT      | idem                                                                                                      |
| `song 7`    | `re-division`     | PT      | idem                                                                                                      |
| `song 8`    | `re-division`     | PT      | idem                                                                                                      |
| `sir 29`    | `merge-split`     | EN      | Latin v33 carries the guest being sent away and the reason for it; PT divides them                        |
| `2thess 2`  | `merge-split`     | EN      | Latin v10 carries _Ideo mittet illis Deus operationem erroris_; PT divides it off, so EN 16 is PT 17      |

### Esther is one fact, not sixteen

CPDV **prefixes** the Greek additions and renumbers the whole book around them;
the Vulgate, and every edition following it, **appends** them as 10:4–16:24. So
CPDV 1 is Mardochai's dream (Vulgate 11), CPDV 2 the eunuchs' plot (Vulgate
12), and the Hebrew Esther does not begin until CPDV 3.

Every chapter of Esther names different text in the two editions. The sixteen
rows above are only the chapters loud enough about it to differ in verse
_count_ as well; the rest disagree just as completely and silently. Nothing
here maps chapter-to-chapter, and no table entry could make `/scriptura/esth/4`
mean one thing.

### The Song of Songs is an editorial reading imposed on the numbers

CPDV re-divides the Song by **speaker**, prints the attribution inside the
verse text, and numbers each speech as its own verse:

```
LA 1:1  Osculetur me osculo oris sui: quia meliora sunt ubera tua vino,
LA 1:2  fragrantia unguentis optimis. Oleum effusum nomen tuum: ideo…
LA 1:3  Trahe me: post te curremus… Introduxit me rex in cellaria sua…

EN 1:1  Bride: May he kiss me with the kiss of his mouth.
EN 1:2  Groom to Bride: So much better than wine are your breasts…
EN 1:3  Bride to Groom: Your name is oil that has been poured out…
EN 1:4  Chorus to Bride: We will run after you in the odor of your perfumes.
EN 1:5  Bride to Chorus: The king has led me into his storerooms.
EN 1:6  Chorus to Bride: We will exult and rejoice in you…
EN 1:7  Groom to Bride: The righteous love you.
```

Latin 1:1–3 is CPDV 1:1–7. This is not an incidental boundary and it is not
convertible: it is an interpretation of who is speaking, applied throughout the
book, and the labels are CPDV's own words rather than the text's. Mappable only
by reading the passage whole.

### Psalm 13, and why the Latin is a column and not an arbiter

The first pass called this "the sharpest case" and read it as presence versus
absence: "CPDV carries the long interpolation (the catena quoted at Romans
3:13–18); Matos Soares does not… Both editions are faithful to their own
textual tradition. Neither is wrong."

The absence half is right and the rest is not. **The Clementine carries the
catena**, folded into its v3 (_Sepulchrum patens est guttur eorum: linguis suis
dolose agebant…_), and so does the Douay-Rheims. Three of the four editions
have the text; only Matos Soares omits it outright, with no note saying so.
CPDV differs from the Latin not by carrying the interpolation but by numbering
it as vv. 4–6 where the Latin keeps it inside v3.

So the verse counts read 7 / 7 / 10 / 7 for LA / PT / EN / DR, and the Latin's
count "sides with the Portuguese" while the Latin's **text** sides with the
English. This corrects what this project then concluded (the standing rule is now
`../../pipeline/docs/oracles.md`), which took from the count alone that "the interpolation is not in CPDV's own base."

That is the general lesson, and it is why the tool reports the Latin as a
column rather than resolving rows with it. A verse-count oracle answers _how
the base divides its verses_. It does not answer _which reading is right_, and
Psalm 13 is where believing otherwise gets the wrong answer.

## The silent case: found, and worse than expected

The proposal's §3 asked for a way to detect a chapter whose verse numbers match
while its text has moved under them — the dangerous shape, because nothing
anywhere marks it and a citation lands on real, plausible, wrong sentences.
`--shifted` implements the signal proposed there: inside a chapter whose number
sets agree, flag a verse whose length ratio against the Latin is a wild outlier
on that chapter's own median. It finds candidates for a person to read; it
aligns nothing.

It flags **110 verses** across the two editions. Three chapters have been read
so far, and one of them is the worst divergence in the corpus:

| locator   | kind                | what happens                                                                                                                                                                                                                                                                    |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `acts 14` | `span-shift`        | PT divides Latin v6 in two (_Aí pregavam o Evangelho_ = _et ibi evangelizantes erant_), then rejoins Latin v26+v27 at the end. Both editions run 1–27, and **twenty verses in between name different text**: `en 6 ↔ pt 6+7`, then `en 7–25 ↔ pt 8–26`, then `en 26+27 ↔ pt 27` |
| `1cor 9`  | `local-repartition` | PT pulls _Non alligabis os bovi trituranti_ up into v8, restoring the boundary by v10. So a citation to 1 Corinthians 9:9 — which is how that Deuteronomy quotation is normally cited — lands on the wrong sentence in Portuguese                                               |
| `ps 77`   | `local-repartition` | PT moves _Et eiecit a facie eorum Gentes_ from Latin v54 into its v55, restoring at v56                                                                                                                                                                                         |

Acts 14 is exactly the failure the first pass said number-set comparison could
not see: the split and the rejoin cancel, the chapter's verse-number set is
identical in both editions, and every existing check passes. It was invisible
until something looked at verse _lengths_ rather than verse _numbers_.

**101 candidates remain unread.** Clustering them by chapter is the cheapest
triage: Acts 14 was the only chapter with five flags, and the two-flag chapters
that have been read (`1cor 9`, `ps 77`) both turned out to be real local
re-partitions, which suggests the rest of the two-flag list is worth the time
and the single-flag list mostly is not. That is a hypothesis from three
readings, not a finding.

## Why this matters more than 2.25% suggests

`docs/decisions.md` #2 made URLs edition-free: `/scriptura/2thess/2?v=16` names
a verse, not an edition's verse. That is right for most chapters and false for
these — **and the failure is silent.** A reader following a citation gets real,
plausible, wrong text, with nothing marking it. Same trap `CLAUDE.md` records
for Hebrew-vs-Vulgate chapter numbers ("a wrong chapter does not fail an
existence check — `Joel 3:1-5` resolves to real but wrong text"), one level
down. Acts 14 makes it concrete: 20 consecutive verses, no signal of any kind.

It reaches further than the compare view:

- **Cross-references.** `xrefs/ccc-bible.json` anchors on verse numbers. In a
  divergent chapter the anchor is edition-dependent, and nothing says so.
- **The `?v=` citation highlight.** Highlights a span by number; in a divergent
  chapter it can highlight the wrong sentences.
- **Compare mode.** Aligns by number. Where the number _sets_ differ it shows
  an advisory. Where they coincide but the text has shifted — Acts 14 — it
  cannot know.

## Proposal, and what is left of it

### 1. Name it as its own category — done

The corpus has two mechanisms and this fits neither:

- `pipeline/corrections/` — **defects**, where one value is wrong and a correct
  one is known.
- `versification.*` — **conversions**, where a formula maps one system to
  another.

This is a third thing: **edition divergence**, where both editions are correct
and no formula relates them. Calling it a defect invites someone to "fix" a
faithful text; calling it versification invites someone to look for a formula
that does not exist. The four kinds above are the vocabulary, and they now have
one home rather than two — `divergence.py` holds them, this document explains
them.

### 2. A divergence table, generated then reviewed — done

`KINDS` is the review; the tool is the generator; the check that they still
describe each other is the part that keeps this from going stale silently.

### 3. Detect the silent case, without guessing — built, mostly unadjudicated

`--shifted`, above. 110 candidates, 3 chapters read, 101 outstanding.

### 4. Record explicit mappings only where confirmed — done for the 8 that have one

`MAPPINGS` in the same file. Only `merge-split` rows appear, and that is what
the kinds are for: an `arrangement` row has no chapter-level correspondence, a
`re-division` row has one only for the passage as a whole, and a
`textual-variant` row is not a numbering question.

```
gen 37     en 35 <-> pt 35+36; en 36 <-> pt 37
judg 21    en 24 <-> pt 24+25
2sam 13    en 38 <-> pt 38+39
ps 43      en 22 <-> pt 22+23; en 23-26 <-> pt 24-27
ps 125     en 6+7 <-> pt 6
ps 135     en 26+27 <-> pt 26
sir 29     en 33 <-> pt 33+34; en 34 <-> pt 35
2thess 2   en 10 <-> pt 10+11; en 11-16 <-> pt 12-17
```

Acts 14's mapping is known too — `en 6 ↔ pt 6+7`, `en 7–25 ↔ pt 8–26`,
`en 26+27 ↔ pt 27` — and is recorded in `SILENT` rather than `MAPPINGS`,
because its chapter does not appear in the number-set table at all.

### 5. Disclose in the reading view, not only in compare mode — not built

A reader following a citation into Psalm 13 or Acts 14 is exposed whether or
not they opened the comparison. If a chapter is in the divergence table, the
reading view should say so — quietly, the way `.verse-absent` and the
unpublished notice already say what the site does not know.

This is the one proposal item that needs the table to be _data_ rather than a
Python dict the site cannot read. Nothing else does, which is why the dict was
enough for everything above.

### 6. Do not align by text similarity — held

Fuzzy-matching verses across editions to guess correspondence is exactly the
invention `docs/decisions.md` forbids for source defects. Detect, classify,
disclose, and map only where a person has confirmed the mapping. `--shifted`
respects this: it ranks candidates by a length ratio and never proposes a
correspondence.

## Note on how this was found

The cross-edition comparison was written for a reading feature, and it surfaced
a corpus-integrity problem nobody was looking for — the same way the EN/PT
symmetry check caught three parser bugs (`CLAUDE.md`). The merge/split cases in
particular are invisible from inside either edition alone: each is internally
consistent and perfectly plausible.

Acts 14 sharpens the same point. It is invisible from inside either edition
_and_ from the comparison the first pass ran, because that comparison asked
about numbers. It argues for running this as a **validation pass**, not only as
a reader-facing view — which is what the staleness check at the end of
`divergence.py` now is, for the half that is classified.
