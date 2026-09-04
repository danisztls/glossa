# Oracles

Every check here is blind to something the others see. None is a substitute for
another, and the reason each exists is the gap in the one before it.

- **Round-trip** (`html_to_text(html) == text`) — a statement about one block,
  so a block that never became a block is outside its universe.
- **Cross-language symmetry** — compares unit-number _sets_, so it is blind to
  loss inside a unit, and **where the address space is fixed it is vacuous and
  will not say so**: the Compendium is 1–598 in both editions by construction,
  and reported symmetry while four English answers were missing an entire
  enumeration.
- **Coverage** (`audit.py coverage`) — raw body text divided by what we stored.
  Crude and therefore hard to fool; it cannot say what was lost, only how much.
  It never legitimately reaches 100%, so a low band is a research lead and only
  a floor is gated.
- **Balance** (`audit.py balance`) — per-unit length against the sibling
  edition, normalized by the pair's own median. Run over the CCC, Compendium,
  prayers and Summa; deliberately not over documents (a section number is not
  the same section in both editions) or the Bible.
- **Divisions** (`audit.py divisions`) — structure trees compared by paragraph
  span. The one check that is not per-unit, and therefore the only one that can
  see a division that never got built.
- **Reference apparatus** (`audit.py refs`) — the Catechism paragraph numbers
  each Compendium question prints beside itself, across all fourteen editions.
  The only check here that may take a vote; see below.
- **Hand-read oracles** — a person reads the source page and writes down its
  table of contents (`audit.py toc`), or a note's lemma is checked against the
  verse it quotes. The only checks that can see something the parser never
  produced at all.

**Comparing DIVISIONS rather than units is the version of symmetry that is not
vacuous.** The CCC is 1–2865 in all eight editions by construction, so the unit
sets can never disagree — but the in-brief divisions can, and did: English had
59 where Portuguese, German and Malagasy each had 81 and agreed on which.
Twenty-one were a year-old parser defect, the twenty-second a genuine source
omission at §984. **A one-sided gap against three independent editions is not a
reading, it is a bug**, and no per-unit check could see it.

**A metric that ignores one of the places body text is stored reports
relocation as loss.** Learned three times — the masthead, the appendix, the
Summa's non-Aquinas divisions.

## What an oracle may claim

**An oracle records the page, not the corpus.** Where a correction is filed the
two _must_ differ, and reporting that is reporting the corrections layer
working. Editing an oracle to match the parser is how it stops being evidence;
the ToC audit applies filed corrections to the read side instead.

**A verse-count oracle is not a textual one.** Acts 14 runs 1–27 in both
editions with twenty verses naming different text.

**Asymmetry is edition divergence until the evidence points the other way.**
Calling it a defect invites someone to "fix" a faithful text
(`docs/research/bible-edition-divergence.md`). Three of the eight Catechism
editions print no footnote apparatus at all and fold their references into the
prose, so their paragraphs carry no citations and their stored text is longer.
**What separates that from the in-brief gap above is which way the evidence
points**: an edition doing something the others do not, consistently and
everywhere, is that edition; an edition missing something the others all have,
in scattered places, is a parser.

**A second transcription of the same printing is the only check that sees a
hole.** `bible.matos-soares.pt` keeps liriocatolico's verses despite taking its
apparatus from vulgata.online, because that transcription is missing 247 verses
and nothing but the comparison could tell which of the two was short.

**The cross-edition oracle belongs to any work translated once**, not to the
Catechism. `book-forms-oracle.mjs` takes any `--work`: what makes an alignment
usable is the translation history — a work rendered from one text at one moment
has section N meaning the same thing everywhere, which is exactly what a
nineteenth-century encyclical's translations do not.

## Voting

`audit.py refs` compares fourteen copies of one apparatus rather than fourteen
renderings of an assertion, which is what licenses a vote at all. Everything
else in the ladder compares prose length, typography or structure — things an
edition is entitled to differ about — so the strongest any of them may say is
"an edition alone against the rest is a lead".

**The shape of a disagreement names its culprit, which is why `refs` reports a
classification and not a count.** A subset or superset held consistently is the
edition (German prints only the first of two ranges at 170 of 598 questions and
its own raw page says so at every one). Overlapping or disjoint is a misprint —
no printing convention produces a set that crosses the others without
containing them. A displaced pair is a reading attached to the wrong unit. Led
with counts, the two consistent editions would have buried everything else.

**A lone coincidence is not a displacement.** The class began as "a set equal to
a neighbour's modal set"; checked against the raw pages, 14 of the 17 it
flagged sit in the right slot and merely name a range a neighbour also names. A
real displacement leaves a **pair**. That took the class from 17 to 3.

**The editions are not independent witnesses, and a vote quietly assumes they
are.** German and Slovenian carry an identical departure at six questions;
Italian and French an identical impossible range at another. Two editions
agreeing on a wrong value is evidence of a shared exemplar, not of two
observations — so "one against thirteen" is a real standard and "two against
twelve" is not the same claim with a smaller number.

**So a vote proposes and something else decides.** Every one of the 38 filed
corrections carries a witness independent of the count, and all three available
witnesses were measured rather than assumed: the apparatus's groups ascend in
375 of 375 modal sets, so a set running backwards is impossible on its face;
its last group is the article's In Brief in 357 of 375 (a heuristic, and it
fires the wrong way at Italian 557); and the decisive one is reading the
Catechism paragraph. **Counting a value proposes a candidate; reading the
sentence is what decides it.**

**The Catechism itself has no apparatus to audit.** `related` is empty in all
22,920 paragraphs of all eight editions because the mirrors do not print the
margin; what it has is `citations`, which are prose, and three editions fold
them into the sentence, so a cross-edition count measures the convention rather
than the parse. `docs/research/ccc-citation-apparatus.md` records the one
narrower comparison worth making.

## The magisterial apparatus

`audit.py apparatus` (2026-09-02) is three checks over a family that had none:
`coverage` cuts the raw page at the footnote boundary and `stored_text_len`
counts no citations, so the apparatus was outside its universe on both sides.
The corpus stores 92,519 citations and **24,154 notes the source prints reach
no reader**.

**Two exact measures beat one heuristic.** A hole in the marker run 1..N cannot
be made honest here — a stray `(302)` in prose is stored as marker 302, and
Vatican II restarts its numbering per chapter. Reading the source's own
footnote list with the parser's own reader asks both halves exactly instead: a
stored citation whose marker reached no note, and a note in the list no
citation carries.

**The two total failures point in opposite directions and were one bucket until
the corpus was read.** `list-unread` is 123 editions whose markers were all
found and whose footnote LIST was not; `markers-unread` is 97 where the list
was read whole and not one marker matched. Reported together as "notes missing"
they are one number; separated they are two bugs in two functions.

**A volume of the Acta is its year minus a constant, so a reference convicts
itself.** The only check needing no second edition, and therefore the only one
that reaches every edition of every document. The constants are DERIVED: 98.71%
of 19,782 AAS references satisfy `volume == year - 1908`, and the 304 that fail
are transpositions.

**Here the cross-language vote is the SUPPLEMENT, which is the exact inverse of
`refs`.** These are different apparatus — `ad-caeli-reginam` prints 53 notes in
Italian and 63 in English — so footnote _k_ is footnote _k_ only where the
marker sets are identical, which is 24 documents. What it adds is the PAGE,
which arithmetic cannot judge. **A vote is only ever as good as its
precondition, and the precondition is what differs between the two audits, not
the technique.**
