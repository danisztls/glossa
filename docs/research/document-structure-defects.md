# Structure-tree defects in the Magisterium corpus

Findings from 2026-08-16, recorded for a later fix. Only §1 was fixed at the
time; everything after it was diagnosed and left alone deliberately. **A
section says in its own heading whether it has since been fixed** — the rest
have not been.

Section text is not in question anywhere in this note. `sections.json` is
sound; it is `structure.json` — the tree of Parts, Chapters, Articles and bold
subheadings that gives a document its divisions — that is unreliable for most
of the corpus.

## Why this blocks work, not just tidiness

Three things that were wanted immediately all depend on the structure tree,
and none of them can be built on it as it stands:

- **A per-division reading view.** Reading a 245-section encyclical in one
  page is too much; the natural unit is the document's own divisions. There is
  no usable division boundary for most documents (§3).
- **The sidebar table of contents.** It renders the structure tree. A document
  with one root node gets a table of contents with one row.
- **Naming the unit in the UI** ("Read full chapter" vs "Read full document").
  The vocabulary problem is real (§4) but downstream of this: you cannot pick
  a good name for a division that the parser did not find.

## 1. The page's own table of contents parsed as structure — FIXED

The modern vatican.va shell prints a linked table of contents ahead of the
body, and each entry is a fully-bold `<p>` — indistinguishable to
`is_full_bold` from the heading it points at. Each became a structure node,
and since a heading stays open until the next one pops it, the last TOC entry
was still open when section 1 arrived and adopted the document's opening.

`encyclical.magnifica-humanitas` showed it as five phantom top-level nodes
with null ranges plus a `CHAPTER FIVE` spanning sections 1–16 — a chapter five
beginning at section one, holding what is actually the Introduction. The real
chapters below parsed correctly, which is what made it look plausible.

Fixed in `drop_table_of_contents` (`pipeline/scrapers/vatican_docs.py`): a
pre-body heading is dropped when a later heading duplicates it, requiring at
least two such duplicates before anything is removed. Re-parsing the 16
Vatican II documents left every artifact byte-identical, so the guard holds.

## 2. Headings not detected at all — THE CHECK IS BUILT, FOUR CLASSES FIXED

The larger problem. Measured across 339 document works:

| root-level structure          | documents |
| ----------------------------- | --------- |
| only `sub` nodes              | 300       |
| `chapter` + `sub`             | 29        |
| `part` + `sub`                | 4         |
| `chapter` only                | 4         |
| `chapter` + `section` + `sub` | 1         |
| nothing at all                | 1         |

And, counting root nodes that carry a real section range, across 333 works
that have both a structure and sections:

- **211 documents have exactly one top-level division** — i.e. a structure
  tree that says nothing about how the document is divided.
- median top-level divisions per document: **1**
- median sections per document: **27**; largest: 287

### The proof that these are defects, not unstructured documents

The cross-language oracle (`CLAUDE.md`: when a document exists in two
languages their structures must agree) settles it:

```
encyclical.fratelli-tutti.en   1 root node:  [sub] [1,287] "Fratelli Tutti"
encyclical.fratelli-tutti.pt   8 root nodes: [chapter] Capítulo I..VIII, ranges correct

encyclical.mater.en            1 division
encyclical.mater.pt           69 divisions
```

Fratelli Tutti has eight chapters. The Portuguese parse found all eight with
correct ranges; the English parse found none and fell back to the trivial
single-node tree (`docs/corpus-schema.md`'s "a document with no internal
headings gets a trivial single-node tree spanning its full section range").
The document is not unstructured — our parse of it is.

Both editions agree on section count (287 = 287), so **`check-symmetry` passes
these documents**: it compares section-number sets only. The structure trees
are never compared, which is why a defect this large went unnoticed.

### Recommended first step

Extend `check-symmetry` (or add a sibling pass) to compare **structure trees**
across languages, not just section sets: root-node count, per-node ranges, and
tree depth. That turns a 339-document manual audit into a ranked worklist, and
it is the same oracle already trusted elsewhere in the project. Documents where
one language finds divisions and the other finds one are the highest-value
cases, because the working side shows what the broken side should produce.

Only after that is it worth asking why detection fails on the English pages —
likely a heading-markup variant `is_full_bold` misses, and likely fixable once
there are paired examples to compare.

### The check, built 2026-09-08 — `audit.py trees`

A sibling pass rather than an extension, because `divisions` reads the nested
`structure.json` and the documents store a flat one. It compares by the section
number a heading precedes — the only part of a heading that survives
translation — and by the sign of the step in level between consecutive shared
anchors rather than the level itself, and it refuses to treat an edition that
found no outline as a witness about anyone else's. Each of those three is a
general fact about this kind of oracle and is argued in
`pipeline/docs/oracles.md`; the step comparison is what leaves 203 editions in
76 works genuinely nesting a heading where their siblings do not, against the
thousands a level comparison reports.

**529 editions across 126 works depart from their siblings' outline**, 63 of
them with no outline at all against siblings that have one. That is the ranked
worklist §2 asked for, and it ranks without adjudicating: `evangelii-nuntiandi.en`
is first on it and correct (§13).

### What the worklist held: four classes, all fixed

Each was found by reading the raw markup above every anchor a top-ranked edition
lacked, and each is a general form rather than a document:

- **A division above the numbers may say so in words or in paint, not only in
  Roman numerals.** `numbering_is_in_headings` refuses to read a numbered run as
  the outline when a coarser heading interrupts it, and knew only the numeral.
  `gaudium-et-spes` stored 0–1 sections in ar/de/it/la and 10 in fr against its
  peers' 93, all of it blocked by an unlabelled `EXPOSÉ PRÉLIMINAIRE` that says
  "above" by being set above. **16 editions, 888 addresses.**
- **Capitals with no emphasis are a heading.** Two promotion passes recovered an
  italic run and a plain centred one; a plain all-caps run was the third and had
  no pass. **26 editions, 389 headings.**
- **An anchor around a heading names it as surely as one before it.**
  `<a name="X">X</a>` and `<a name="X"></a>X` are one claim. **10 editions, 135
  headings** — with the caveat that only the empty form may speak for the
  heading's STYLE, since `caritas-in-veritate.pt` anchors chapters II–VI and
  prints chapter I plain, and ranking all six as anchor-titled cost chapter I
  its label.
- **Brackets around an italic line do not stop it being a heading.** The Latvian
  council prints its whole outline as `(<i>…</i>)`, which the italic pass tested
  whole and missed.

The ToC oracles held at 68 of 377 works and 524 differences across all four, so
none of them reaches a document that was already right.

### What is left, named

- **Two markup classes not yet taken.** Hungarian numbered italics —
  `<em>2. <a name=…>Title</a></em>`, excluded from the italic run by the guard
  that keeps section numbers out (`ut-unum-sint.hu`, 5 anchors against 32) — and
  the bold and bold-italic residue (`fratelli-tutti.sl` 67/87 with 26 anchors
  only it has, `ecclesia-in-africa.de` 76/100).
- **22 editions in 19 works hold a fraction of their siblings' SECTIONS**, which
  the report marks `COLLAPSED SECTIONS`. There the outline is a symptom and the
  defect is upstream of it: `lumen-gentium.ar` and `ecclesiam.fr` store one
  anchor against peer medians of 67 and 45. These belong to `coverage`, not to
  the heading detector.
- **The stubs still want reading one at a time**, because §13 is real: an
  unstructured mirror and an unparsed one are the same row.

## 3. Consequence for choosing a reading unit

Two candidate units were evaluated and both fail on today's trees:

- **Split on `<h2>`** — only **5 of 339** documents have one. `headingTag()`
  maps `part`/`section`→h2, `chapter`→h3, `sub`→h5, and 300 documents have
  only `sub` at root, so 334 of 339 would get zero split points: one giant
  page, which is the problem being solved.
- **Split on the structure tree's top level, whatever kind it is** — fails for
  the 211 documents with a single top-level division.

Both become workable once §2 is fixed. Neither is worth implementing before.

## 4. The vocabulary collision (independent of the defects)

Worth recording because it will come up again when the unit is finally named:

- **"section"** already means the numbered unit — §17, the `{n}` in
  `/documents/{slug}/{n}`, `sections.json` — _and_ is a `StructureNode.kind`
  (`SECTION ONE`).
- **"chapter"** collides with Bible chapters and with `/ccc/chapter/[n]`.

The suggestion that avoids inventing a word that fits all 339 documents: label
a division with **its own printed title**, verbatim — "Read Chapter III",
"Read the Introduction", "Read Part Two" — and keep "Read full document" as
the other option. The document says what its divisions are called; the UI does
not have to generalize.

## 5. Smaller things noticed in passing

- `encyclical.magnifica-humanitas`: the body's `CONCLUSION` heading is a `sub`,
  so it nests under `CHAPTER FIVE` rather than sitting beside it. A `sub` never
  pops a `chapter` in `push_heading`'s level logic. This follows from the
  documented "any other fully-bold block becomes a generic `sub` node" design
  rather than being a separate bug, but it means a document's concluding
  material is filed inside its last chapter.
- The Introduction's own subheadings land as top-level siblings of the
  Introduction rather than beneath it, for the same reason: all unlabelled
  headings are `sub`, and `sub` does not nest under `sub`.
- `--overwrite` was documented in `vatican_docs.py`'s module docstring but was
  never wired into argparse, so no parser fix in this project had ever been
  verified by re-parsing. It and `--slugs` now exist; see
  `docs/writing-descriptions.md` for the blast-radius procedure that uses them.

---

# What the exhortations added, 2026-08-29

The 33 apostolic exhortations sat in `raw/` unparsed until 2026-08-29
(`CLAUDE.md`, "Apostolic exhortations were fetched and never parsed"), so when
the 32 English editions were read for a ToC oracle they were the first
documents in the family nobody had ever checked. Ten agree with the parse and
22 do not. Everything below was found by that reading and then **measured
across the whole corpus**, because a defect seen once in a family of 1,447
works is a lead and not a finding.

**Each entry names its population so the blast radius of a fix can be predicted
before it is written**, which is the whole use of this half of the note. Seven
have since been fixed and say so where they are recorded; the rest have not.

## 6. The residue of §1's fix, in three shapes — TWO FIXED

§1 taught `drop_table_of_contents` to remove a pre-body heading that a later
heading duplicates. Three things survive that rule, and each wants a different
change:

- **The caption over the list — 44 works. FIXED.** `INDEX` / `ÍNDICE` /
  `INDICE` / `INHALT` / `SPIS TREŚCI` names the table but nothing later
  duplicates the word, so the caption stays; and being an unpopped heading it
  adopts the document's real opening divisions as its children. 38
  exhortations, 6 Vatican II documents, 9 languages. No encyclical. The
  measurement that settled the fix is that **not one of the 46 sits inside a
  body**, so the caption needs no window and none of the duplicate machinery:
  it is dropped on its own text, which is what reaches the four unnumbered
  documents (`samaritanus-bonus.pl`) the window would never have covered.
  `_TOC_CAPTION_WORDS` is `_TOC_TITLE_WORDS` plus the five an unlinked outline
  turned out to print, kept apart because that table is closed against a
  measurement over LINKED outlines and widening it moves two other readers.
- **A ToC printed AFTER the body — 15 works. FIXED, 2 left.** The guard only
  considered blocks before the first numbered paragraph, so a trailing
  contents list was never a candidate. `ecclesia-in-asia.en` prints a second
  full index after the papal signature and all ten of its captions survived as
  level-1 nodes with `before: null`. 6 Vatican II, 5 exhortations, 4
  encyclicals. The same rule now runs over a second window — the blocks after
  the LAST numbered paragraph, judged by the body's headings — with two
  guards it needed and the front window does not:
  - **The witness must be a heading printed in its place.** Neither window may
    vouch for the other, or a front outline and a trailing one certify each
    other and both go.
  - **A printed table is contiguous.** `dei-verbum.de` prints its endnotes in
    six groups headed `Kapitel 2:` .. `Kapitel 6:`, which to `match_label` are
    the body's own six chapters repeated — five duplicates, a clean pass, and
    the notes under them go out with the headings. A group heading with its
    notes underneath is not a run; a contents list is.

  The two left are `ecclesia-in-america.es` and `querida-amazonia.ar`, and
  they are §2 rather than this: their bodies' sub-headings were never detected
  at all, so the trailing outline has nothing to be a duplicate OF.

- **Entries promoted to headings — 44 nodes in 6 works.** The match is on
  exact text, so an entry whose case differs from the body it points at is
  never deduped and becomes a node of its own. The signature is exact and
  unused: a ToC entry carries its target's span, so these titles still end in
  `[31]`, `[1-6]`, `[94]`. `fides-et-ratio.de` (15), `fides-et-ratio.fi` (9),
  `africae-munus.es` (8), `africae-munus.en` (6), `evangelii-gaudium.de` (5),
  `sacramentum-caritatis.be` (1). Their addresses are nonsense —
  `africae-munus.en` gives all six `before: 2`, since they sit inside §1.

The same case-insensitivity leaves the entries in the BODY where they are not
promoted: measured as "§1 contains the text of 2+ headings that occur later",
**18 works when this was written and 35 by 2026-09-08**, `sacrosanctum-concilium.hu`
(83 leaked headings inside §1), `sacramentum-caritatis.hu` (68),
`africae-munus.en` (44). This was the one defect in this note a reader saw
directly: the document opened with a wall of its own contents.

**FIXED, 2026-09-08, in `toc_reprint_span`.** Every one of these prints an
outline the link rule could not see — no link at all (`evangelii-gaudium.nl`,
`csdc.sw`), 128 links to anchors the page never defines
(`sacrosanctum-concilium.hu`), or one paragraph of 95 lines
(`evangelii-gaudium.hu`) — plus five editions of `africae-munus`, whose
unlinked third tier read as the body's paragraph 1 and disqualified the whole
span. **A table of contents says nothing of its own**: every line it prints is
a line the document prints again below it, which is the property the links
were a proxy for and the property a masthead lacks. So a paragraph is a row
where MOST of its lines are reprinted below as whole lines, the span runs from
the first row to the last, and two guards keep it honest — the rows must point
at three DIFFERENT paragraphs (a subtitle printed twice is one place), and a
page whose body never starts, as the 328 editions that number nothing do not,
gets no span at all. 24 works changed and nothing else did; `africae-munus.en`
went from 39 disagreements with its hand-read contents to 10.

## 7. Tiers flattened — three documents confirmed — FIXED

Three readers who could not see each other's work found the same thing and
named the same cause. The page prints three tiers and the tree stores two:

    <p align="left"><b><i>…</i></b></p>     middle tier
    <p align="left"><i>…</i></p>            the tier below it

and the parser treats both as one. `ecclesia-in-oceania.en` (19 headings
misplaced), `gaudete-et-exsultate.en` (30), `familiaris-consortio.en` (four
real tiers stored as two, plus five italic-only numbered headings absorbed
into an adjacent paragraph and absent from the tree at any level).

**The population is a place to look, not a count.** 157 document works have
40+ headings and only two levels, but a long document with two genuine tiers
is indistinguishable from the outside; only the census's markup column
separates them. The tighter signal is total collapse: **25 works carry 25+
headings with every single one at level 1**, including
`sacrosanctum-concilium.hu` (130), three editions of `evangelii-nuntiandi`
(91 each) and three of `christifideles-laici` (74 each).

**FIXED, 2026-09-08.** `heading_style_rank` modelled centring, size and
italics and said nothing about bold, so the two markups above are one rank.
A fourth bit, between the size bit and the italic one, ranks a bold heading
above an unemphasised one and leaves `style ^ 1` still meaning "the same but
for the italics". 103 works changed, **every one of them in `structure.json`
alone** — this moves a tree and cannot move a word of text — and the ToC
oracles fell from 561 disagreements to 524, `divino-afflante-spiritu.pt` from
18 to none.

**An anchor-titled heading is not bold either, and that is the whole of what
the fix got wrong first.** Giving it the emphasised rank — on the reasoning
that it carries no emphasis and would otherwise sink below the tier it is
printed among — split `fratelli-tutti.en`'s two shapes,
`<p><a name=…></a>SHATTERED DREAMS</p>` and
`<p><i><a name=…></a>The end of historical consciousness</i></p>`, which its
hand-read contents makes peers: 45 disagreements, from none. Unemphasised
means unemphasised in both bits, and the two land on the same rank again.

## 8. A heading the detector cannot see, and one document's text lost — FIXED

`santateresa-delbambinogesu.en` prints its four chapter headings as plain
centred numbered text — `<p style="text-align: center;">N. Title</p>`, no bold,
no italic — and the detector requires one or the other. Three of the four are
in `raw/` once and in the build **zero** times: "The little way of trust and
love", "I will be love", "At the heart of the Gospel". The fourth survives only
because its leading "1." reads as a paragraph number, becoming a phantom §7
holding three words, which shifts real §7-8 to stored 8-9 and leaves real §9
appended inside stored §9 with its prefix unstripped. Numbering resynchronises
at §10 and `sections.json` still totals 53, so no count check sees it.

`laudate-deum.en` is the control: it prints its six chapter titles in the same
shape, numeral inline — "1. The Global Climate Crisis" — and loses none,
because it prints them BOLD. The detector is not confused by the inline
numeral; it requires emphasis this one document does not supply.

**FIXED, 2026-09-08, in `promote_plain_centered_run`.** That pass already
recovers an unemphasised centred run and excluded these four for carrying a
number — the gate that keeps ordinary numbered paragraphs out of a run.
**A number that goes backwards is not a paragraph number**: these read 1..4
while the body is at 6, 9, 20 and 30, and a paragraph continues the
document's count where a chapter heading restarts it. Seven works changed and
all seven gained headings the page prints — `donum-vitae.hu` eleven,
`africae-munus.sw` twenty, `pacem.pt` its parts — with santateresa's phantom
§7 gone and its two displaced sections back at their own addresses.
`sacerdotalis.en` recovered a heading its hand-read contents transcribed
without the numeral the page prints, so the oracle counts the recovery as two
differences; `laudate-deum.en`'s oracle keeps the numeral, which is the
convention, and that one wants re-reading rather than the parse.

## 9. Prose loss across the family: two blocks, and two wrong answers first

Recorded because the measurement was harder than the result.

- Probing the first 80 characters of each raw paragraph said 31 of 32 works had
  lost text, up to 298 paragraphs. Artifact: the build strips a paragraph's
  leading number into the unit's `n`.
- A normalised middle-slice probe said 23 of 32. Artifact: footnotes live in
  `citations[].text`, not in `blocks`.
- Reading blocks, citations and structure titles: 7 works with one line each,
  all masthead furniture or a footnote the line-splitter cut in half. Below 120
  characters, 39 hits, of which 32 are the identical string `tickets for papal
audiences and celebrations` — vatican.va site navigation, correctly dropped.

The real residue is two blocks: `evangelii-nuntiandi.en`'s "But who then has
the mission of evangelizing?" (in `raw/` once, absent from the build) and
`signum-magnum.en`'s salutation. **And the scan still missed §8**, whose lost
headings are 14-31 characters against its 40-character floor. A scan's floor is
part of its claim.

## 10. Chapter epigraphs, which nothing agrees about

Three documents, three different wrong answers, one unasked question about what
an epigraph is:

- `sacramentum-caritatis.en` stores the three Scripture epigraphs under its
  Part titles (Jn 6:29, 6:32, 6:57) as level-3 headings.
- `ecclesia-in-america.en` concatenates each into its chapter's title string:
  `THE ENCOUNTER WITH THE LIVING JESUS CHRIST "We have found the Messiah" (Jn
1:41)`.
- `ecclesia-in-europa.en` files all seven under the LAST numbered paragraph of
  the preceding chapter, so §105's stored html ends with the epigraph that
  opens Chapter Six. No text is lost and no `before` moves, so the oracle never
  sees it; what it costs is a citation.

In the first two the document's own printed contents list is the discriminator
— it prints the title without the epigraph.

## 11. Smaller things, each with its population

- **The papal signature as a heading — 92 works. FIXED.** `PAULUS P. P. VI`,
  `LEONE PP. XIII`, `JUAN PP. XXIII` print in the same
  `<p style="text-align: center;"><b>` as every chapter heading in those
  editions and become level-1 nodes with `before: null`. 87 encyclicals, 5
  exhortations, overwhelmingly it/es/la — which is why the en/pt sweeps never
  saw it. `_PAPAL_SIGNATURE_RE` was eighteen Latin, English and Portuguese
  spellings; the 226 nodes that survived it were the same handful of men
  signing in ten more languages, so the fix is the name list read off the
  corpus rather than off the papal succession, plus the two arrangements
  English does not have — Hungarian's `XVI. Benedek pápa` puts the ordinal
  first, and `P. P.` is printed with every combination of its spaces and
  stops. One node is left, `lumen-gentium.pt`, and the positional guard is
  why: the Fathers' subscriptions below it are numbered.
- **The drop cap as a heading — 11 nodes in 5 works. FIXED.** A styled first
  letter is its own bold element: `ecclesia-in-america.en` stores a level-1
  heading titled `W` and then a paragraph beginning "e thank you, Lord Jesus,".
  Also `.fr` and `.it`, plus Croatian `eccl-de-euch.hr` (5) and
  `ecclesia-in-europa.hr` (3), where the caps sit mid-body and break a chapter
  opening rather than a prayer. This one damages the text a reader sees.
  `repair_drop_caps` gives the letter back to the word it heads;
  `_DIVISION_LETTERS` is measured, since 129 of the 141 one-letter titles in
  the corpus are real `I`/`V`/`X` divisions.
- **The first of two adjacent pre-body headings swallowed — 6 works.**
  `reconciliatio-et-paenitentia.en` prints `INTRODUCTION` then `ORIGIN AND
MEANING OF THE DOCUMENT`, both before §1; the second is kept and the first
  absorbed into the following paragraph. `ecclesia-in-africa.en` has the same
  shape, as do four Portuguese encyclicals (`miranda-prorsus`, `pacem`,
  `pascendi-dominici-gregis`, `princeps`). Not "a heading before §1 is dropped"
  — the pairing is what predicts the fix.
- **A closing prayer's last stanzas promoted — 2 confirmed, no population.**
  `evangelii-gaudium.en` and `querida-amazonia.en` promote the final one or two
  stanzas of an identically-marked-up run into level-1 nodes ("Amen." is a
  heading in the second). **The obvious test does not work**: "an address-less
  heading node that is a full sentence" returns 67 works, and most are correct,
  because Latin, French and Italian end a real heading with a full stop by
  convention. Two by reading; the rest of the number is noise.
- **A multi-line heading merged only two deep.** `africae-munus.en`'s Chapter
  III prints across three blocks — "Chapter III" / "'Stand up, take your mat and
  walk!'" / "(Jn 5:8)" — and the third is orphaned as its own node. Every other
  title in that document spans two and merges correctly.
- Single documents: `catechesi-tradendae.en` (chapter IV alone has its numeral
  inside the `<center>` wrapper and its title outside, defeating the merge);
  `marialis-cultus.en` (a title with an internal `<br/>` absorbed, leaving a
  node with the bare label `Section Two` and an empty title);
  `evangelica-testificatio.en` (the masthead subtitle survives as §1's first
  block — it carries none of the colour styling the 6fca769 guard matches on);
  `gaudete-et-exsultate.en` (`merge_heading_lines` folded Chapter One's first
  real sub-heading into the chapter's `subtitle`, the "third line of a run"
  ambiguity its own docstring warns about, and it is the only chapter whose
  first sub-heading is not preceded by a numbered paragraph);
  `sacramentum-caritatis.en` (`level` tracks nothing real — 41 of 114 wrong,
  chapters inside a Part at level 1 beside INTRODUCTION, their subsections at
  3, some siblings at 5, while every `before` is right).

## 12. Two things checked and dismissed

Recorded so nobody re-derives them.

- **`OFFSET` does not come from the phantom index node.** Zero overlap between
  the 10 works whose tree is read a tier off and the 44 carrying an index node.
  Two problems, two fixes.
- **`manifest.title` is not falling back to the slug.** It reads
  "Santateresa Delbambinogesu" for `santateresa-delbambinogesu.en`, but **1,412
  works derive their title from the slug this way** and it is right nearly
  everywhere ("Acerba Animi", "Ad Beatissimi Apostolorum"). It reads badly here
  because vatican.va's slug for that one document is a run-on of the saint's
  Italian name instead of the incipit `C'est la confiance`. One slug, not a
  class.

## 13. `evangelii-nuntiandi.en` has no divisions, and that is the edition

The cross-edition comparison `CLAUDE.md` prescribes flags this loudly: de, es,
fr, it, lv all carry 91 headings, hr 100, pt 89 — and en carries 1, the
masthead. Read directionally that is the shape of a parser failure, one edition
missing what every other has.

It is not. The English page contains **six bold runs in the whole document**,
all of them furniture, and the part titles the Italian edition prints do not
appear on it **in any form**. The English mirror is an unstructured rendering
of the same text. `la` (7) and `hu` (8) are worth the same check before anyone
treats them as damage.

Two other genre notes from the same reading: `ideal-film.en` is not a treatise
but two allocutions four months apart (21 June and 28 October 1955) whose
source numbers 4 of ~140 paragraphs and reuses "1." for two unrelated
divisions, so it has no citable addresses at all; and `signum-magnum.en` is
already in `site/unpublished.json` because §1 holds 58.5% of its text, nothing
before the first numbered paragraph carrying a number.

## 14. One candidate for `pipeline/corrections/`

`exhortation.redemptionis-donum.en`, the heading before §7:
`Religious Profession Is a "Fuller Expression"of Baptismal Consecration` — no
space after the closing quotation mark, `&quot;of Baptismal` in the raw HTML.
The source's typo, with a known correct value, which is what makes it fixable
rather than merely documentable. Two more were seen and left alone as
reader-invisible: `christifideles-laici.en` prints "Lay Faithtul" in Chapter
II's second line and `"Criteria of Ecclesiality"for Lay Groups` at §30.
