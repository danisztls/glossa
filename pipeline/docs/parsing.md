# Parsing

How the scrapers read a page, and the rebuild that re-runs them. Reading
citations out of the parsed text is the site's job — `site/docs/references.md`.

## Reading a page

**What the source states outranks what we infer.** vatican.va's markup carries
no heading semantics — a chapter title and a sub-section title are both a `<p>`
with emphasis on it — so levels are inferred from typography. Wherever a page
states its own structure the statement wins and the heuristics stop applying to
it: a printed table of contents, a named anchor on every real title, an `<hr>`
closing the masthead, a declared breadcrumb chain.

**If two headings look the same on the page, they are the same level.** That is
the corpus's rule and the reader's rule both.

**A heading in an unexpected style is read, not corrected.** The Swedish
Compendium heads two of eight sections `sektionen` where the rest are
`avdelningen`; the Italian numbers one chapter `CAPITOLO I` where its other
nineteen spell the ordinal out. Both say exactly which division they are, so
reading them as printed loses nothing and the parser's vocabulary widens
instead. The contrast is the one heading that IS corrected: Swedish prints
`Andra delen` over a SECTION, and `delen` is that edition's word for a PART —
read as printed it opens a fifth part in a four-part work.

**A wrong separator is corrected only when it stops the line parsing.** The
Compendium's reference lines are full of typesetting slips and none is
corrected, because none changes which paragraphs are cited. Two are: a colon
standing where a comma belongs (PT Q378) and where a range hyphen belongs
(SV Q5), because a colon is not a separator in these lists at all and the line
stops being a reference list. The test is not "what would a careful typesetter
have done" but "does reading it as printed lose something".

**A stray U+00C2 before a punctuation mark is decoding, not a correction.** 38
occurrences across four editions, always in front of an en dash, a curly quote
or an ellipsis, in files that are otherwise pure ASCII entities: the residue of
encoding the mark twice. Removed in `strip_tags`, one level up from
`decode_cp1252`. The follow-set is checked rather than assumed — French prints
a real Â in "GRÂCE".

**Page furniture is text until something removes it, and the pre-CMS shell is
full of it.** Those pages put `<head>` inside `<body>`, so a `<style>`
element's rules (`cdf.communionis-notio.la` opened on
`.style1 { color: #663300; }`, five works) and a UTF-8 byte order mark the CMS
escaped as `&iuml;&raquo;&iquest;` (`cdf.homosexualitatis-problema.en`
published it as the first word of its title, five works) were both stored as
the document's first words. Neither is reachable by a tag rule — `strip_tags`
and `narrow_html` both drop the tag and keep what it wrapped — and no charset
sniff can see a mark already spelled as three cp1252 characters, so
`common.strip_bom` runs at the decode and `strip_non_text_elements` beside the
transparent spans. The same mark reaches `bible.crampon.fr` as itself,
fr.wikisource setting one as the whole payload of a fixed-width `<span>` used
as an indent.

**Inline emphasis is not a word boundary.** A tag becomes a space only where it
is block-level. The substituted space was hiding real source defects behind a
code rule, and stripping whitespace afterwards cannot work because this corpus
prints spaced punctuation on purpose.

**A whitelist keeps out everything nobody enumerated, and the exception it
lets in is told apart by how it is SET, not by what encloses it.** Crampon's
editorial arguments have three mutually inconsistent wrappers, which is why
verse text is captured only from inside a `<p>` — and twenty of those
arguments are typeset in a `<p>` after all. The second rule names no wrapper
either: an argument carries no verse anchor, says everything it says in
emphasis, and prints outside that emphasis nothing but parenthesised verse
ranges. 861 anchorless paragraphs that are genuine verse text match none of
the three. **A rule about what a block SAYS can only fire when the block
closes**, so the walker marks its buffers on the way in and takes the
paragraph back out on the way out rather than deciding at the opening tag.

**A footnote belongs to the text it is printed in, not to the address that
happens to be open.** `matt 20:34` carried the cross-reference for Matthew
21:1, because the marker sits in chapter 21's argument; when the argument
goes the note goes with it. Reported as an anomaly rather than reattached —
where in the next verse it belongs is not on the page, which is Martini's 13
dropped notes again.

**A missing heading is a claim about the parser until the raw page is opened.**
All three editions recorded as "omitting" a Compendium heading were printing
it. The subsequence check reports what it did not find, and "not found" was
written into a manifest note as "not printed at all" without anyone looking.
`raw/` is kept so that question is always answerable.

**`census.py` answers it, and a verdict it gets wrong costs a reader's whole
investigation.** Both of its own blind spots were the same mistake as the defect
it exists to catch — asking a narrower question than the one meant. An appendix
unit's `title` is a heading the parse kept, and only its `blocks` were read, so
an unnumbered edition's headings all scored `DROPPED`
(`incarnationis-mysterium`, in seven languages). And `heading*` — the verdict
for one line of a heading the source printed across two — was being spent on a
title another block already prints entire, which made a dropped heading read as
a kept one (`mitis-iudex-dominus-iesus.en`'s `The Competent Forum`). A title a
`heading` block prints whole is CLAIMED and the two-line rule may not reach for
it: 429 `heading*` verdicts over the corpus were that, 127 of them a heading
genuinely gone.

## The same work in ten hands

Nothing about the Compendium's markup is uniform across its editions, and every
rule the parser has is a claim about which of them — the reference line follows
the question in eight editions and the answer in two; Romanian sets no
`<blockquote>` and italicises instead; Swedish prints 21 questions and 39
answers outside any paragraph; Italian packs question, references and answer
into one paragraph broken by `<br/>`. Each is declared per edition in
`LANG_CONFIG` rather than sniffed, **because a rule that guesses will guess
wrong silently on the eleventh**.

**A heading's title ends where the source says, and the source says it two
ways.** The named anchor is the mirror's own statement and is used where it
exists; the printed line break between label and title is the fallback for the
five editions with no usable anchors (Hungarian has 21 anchors for 33 headings,
which is worse than none). The line rule is second because it cannot see a
title that wraps across three lines.

**The division scheme is asserted as a subsequence, not as equality.** Four
parts, eight sections, twenty chapters, written down rather than taken from one
edition's parse. A heading matched that the work does not have, or matched out
of order, fails the run — that is ours. A heading an edition does not print is
reported and not failed — that is the page's, and there is nothing to invent it
from.

**A DISAGREEMENT ABOUT TYPOGRAPHY IS NOT A DISAGREEMENT ABOUT STRUCTURE, and
the CCC's run-in headings were read as one for as long as they existed.** The
Catechism sets a heading level below its roman numerals — "The covenant with
Noah", "God chooses Abraham" — which four mirrors bold and four print plain.
`ccc.py` recognised the plain ones with `is_mini_header` and then discarded
them, so English carried one node spanning §§54–64 where Italian, Latin and
Spanish each carried four. The count of what was discarded is what makes the
loss legible, because the per-edition total is near-constant:

|         | ES  | IT  | LA  | MG  | FR  | DE  | PT  | EN  |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- |
| kept    | 380 | 378 | 378 | 400 | 39  | 7   | 13  | 2   |
| dropped | 5   | 7   | 6   | 41  | 156 | 330 | 344 | 315 |

Keeping them moved cross-edition node agreement from two disjoint clusters at
~47% to 85–99% for every edition. **The editions that already had them are the
oracle** (`pipeline/docs/oracles.md`): the fixed parse must reproduce their
node ranges, and it does — the four stages at 54–55, 56–58, 59–61 and 62–64 in
all eight.

**WHAT A RUN-IN HEADING IS DEPENDS ON WHAT FOLLOWS IT, and nothing else can
tell.** The Catechism sets two different devices in that same style:

```
The covenant with Noah          What is an indulgence?
56 Once the unity of the ...    "An indulgence is a remission ..."
```

The first is a division; the second is a question §1471 asks and answers in
its own next block. Reading both as headings finalizes §1471 at its first
sentence and orphans the definition — 2,633 characters across EN §§1471, 2071,
2558, DE §§1471, 2558 and PT §§205, 1471. So a PLAIN run-in line is a heading
only when a numbered paragraph or a real heading follows the run; a BOLD one is
a heading unless a paragraph is open and no new matter follows, because the
source has already said bold means heading and testing it anyway costs the two
creeds and the Decalogue, which each intratext mirror declares in its own
`<meta name="part">` and then follows with unnumbered display matter.

**The same rule fixed a verbatim-text defect nobody was looking for.** French
bolds its run-in headings, and a bold block after body text was demoted to a
quote for the Our Father's sake — so French's headings were never offered to
`is_mini_header` at all and `merge_quote_blocks` welded each to the paragraph
above. §55 ended "…(MR, prière eucharistique IV, 118). L'alliance avec Noé":
the next section's title inside a liturgical quotation, in a corpus that
reproduces text verbatim. 264 French paragraphs carried one; every removal was
checked to be exactly a structure node's title and nothing else, and the seven
other editions' paragraph text is character-identical across the change.

§1471 was the worst cross-language length skew in the work at 8.2×. It is now
1.3×, which is `audit.py balance`'s own measure and the reason that audit
exists.

**AND A RUNNING BANNER'S SECOND LINE IS NEITHER, when only its first line is
bolded the second time.** PT reprints `SEGUNDA PARTE` over `A CELEBRAÇÃO DO
MISTÉRIO CRISTÃO` atop all seven pages of Part Two and bolds both lines only on
the first, so `push_heading` merged the ordinal into the Part it had already
opened and the title line went to `take_mini_header`, which read a real Section
heading behind it and called it a division. **The cost was not the five junk
`sub` nodes but where they stood**: `same_heading` merges a repeated banner into
the immediately preceding sibling only, so a node between two restatements
fragmented Part Two's two sections into six — `PRIMEIRA SECÇÃO` as 1076–1134 and
1135–1209, `SEGUNDA SECÇÃO` as four. `_restates_banner` drops a mini-header that
finishes the title of a banner just MERGED rather than opened; `repeated_banner`
is the one-block window that says which, and no other edition moves.

**A CITATION MAY INTRODUCE ITS QUOTATION INSTEAD OF FOLLOWING IT, and where it
does the book is not in the parenthesis.** Five of the Holy Rosary micro-site's
six editions trail each mystery's meditation with the whole locator; Italian
heads it — `Dal Vangelo secondo Luca (1,26-28.30-31)` — and sets the passage in
the paragraph beneath. Read as the other five are read, the formula became all
twenty Italian meditations (25 characters against the others' ~300) and chapter
and verse with no book became all twenty citations, which can never resolve.
The lead-in is a table per language (`ROSARY_CITATION_LEADIN`), matched exactly
like `ROSARY_INSTRUCTIONS_HEADING`, so a book nobody has chosen a siglum for
fails naming the formula. **The siglum is ours and the locator is the page's**:
`refs-grammar.ts` reads `Luca` and `Apocalisse` but not `Matteo`, `Marco` or
`Giovanni`, so a citation in the page's own words would have resolved for two
books of five.

## Document families

**Word writes `_edn`/`_ednref` when the author used endnotes.** Same export,
same pairing, three letters different, and every regex read only `_ftn`, so
those pages matched no marker template and fell through to the `(N)` fallback.
Aliasing the two gave 39 works a footnote apparatus they did not have,
including _Caritas in Veritate_ in eight languages at once (0 → 159 citations
each).

**A footnote list can announce itself only by the numbering restarting**, which
is also how every numbered paragraph in this corpus opens. Two guards make it
readable and neither is optional: the run must be a RESTART, and 90% of its
numbers must already appear as inline markers above it — which a body part that
restarts its own numbering cannot satisfy. Measured over 1,611 works: 16
changed, zero regressed.

**A marker's delimiter and digits are not always adjacent**, and admitting
inline TAGS between them gains 591 markers at the cost of one false, where also
admitting bare WHITESPACE gains 12 more and costs two. So tags are admitted and
whitespace is not: **a false marker is worse than a missing one**, because it
takes a printed number out of the reader's prose and puts a footnote where the
source marked nothing.

**`narrow_html` kept the HTML comments `strip_tags` drops** — `<!--` is not a
tag to a regex requiring a letter after the `<` — so Word's
`<!--[if !supportFootnotes]-->` wrappers came back out of `html_to_text` as
literal markup in the reader's prose.

**A document whose first sentence names its own issuing body loses that
sentence to the masthead.** `extract_document_header` reads down until the
matter stops looking like a masthead, and the issuing body's name is the
strongest thing it looks for — so a text opening `This Congregation for the
Doctrine of the Faith has been asked…` reads as more masthead. The loss is
invisible wherever the document is long enough to absorb it:
`catholics-in-political-life.en` has carried an 840-character masthead holding
its whole introductory paragraph since the family was first parsed, under a
clean validation, because nothing downstream asks how far the cut reached. It
became visible only where the document was two sentences long and the cut left
110 characters, which is under the stub threshold.

**A length threshold calibrated on one family cannot judge another's shortest
document.** `STUB_CONTENT_MIN_CHARS` is 300 because the shortest genuine
encyclical strips to 7,106 and the largest sampled stub to ~90 — true, and
silent about a family that publishes two-sentence notifications. The Latin
_Notification on the validity of Baptism conferred in The New Church_ is a
complete, correctly parsed document of 285 characters, refused as a page with
nothing on it. The number is not wrong; its evidence was drawn from documents
of one kind, and a floor picked that way says nothing about a corpus that has
since grown another.

**`lt` is Latin on this host and `lit` is Lithuanian.** Third family to spring
the trap (`ccc.py` documents it for `catechism_lt`, `VATII_LANG_FROM_URL` for
the conciliar mirror) and the first where both readings are live on one index,
which is what makes it dangerous: a code map borrowed from elsewhere does not
fail, it files sixty-six Latin editions as Lithuanian and says nothing.
`lang_urls` is keyed by what the SOURCE calls a language — vatican.va's modern
CMS calls Hebrew `iw`, the retired ISO 639-1 code, while its Vatican II mirror
calls it `he`.

**A heading's emphasis is a claim about the heading; its number is not part of
that claim.** `is_full_italic` takes no tolerance by design — its docstring
records both tolerances measured and reverted — so `<p>I. <i>Title</i></p>`,
the numeral outside the run, reaches neither `structure.json` nor
`sections.json`. An upper bound of 548 headings over 173 editions, counted in
the body region only, since the footnote apparatus prints the same shape and
means a citation by it. What makes the core of that unarguable is the
translations: `libertatis-conscientia` loses 14 to 18 in each of four
languages, `veritatis-splendor` the same heading in all seven.

**A DIVISION LABEL is the part of that number both predicates may read**,
because a label is not an enumerator: `LABEL_PATTERNS` demands the document's
own word for a division and a number after it, where the reverted tolerance
admitted `(a)` and a dateline. `<p>Article 1. <i><b>The Nature of these General
Norms</b></i></p>` — `ex-corde-ecclesiae` sets all seven articles of its
GENERAL NORMS that way, and a short unpunctuated prose line is a run-in header,
so the walk discarded all seven with their names. 21 works in five languages,
and in three of them the heading had been welded to the end of the paragraph
above it, which is the cost of a heading nobody detects in a corpus that
reproduces text verbatim (`lumen-fidei.de` §22, `crebrae-allatae.la`,
`cleri-sanctitati.la`). **The run must still carry a word**: `pastor-bonus.it`
emphasises nothing but the mirror's own brown amendment `<sup>`, and its six
amended articles came out titled `n`.

**A NUMERAL PRINTED ABOVE ITS OWN NAME IS THAT LABEL WITH THE NOUN LEFT OUT,
and the style is what says so.** `merge_heading_lines` folds `PART TWO` into the
line beneath it and could not see `I`, so 281 headings in 56 works stood as two
nodes anchored at the same section — a numeral row and a title row, which derive
the same range and highlight together in a reader's outline; in
`praedicate-evangelium.en` the title also took a level the numeral did not, the
page's own linked outline vouching for one of the two. The guard the labelled
form does not need is that the page paints the two lines alike. `PART TWO` says
what it is however it is set; `I` says nothing, and a numeral standing as a
division on its own is followed by prose or by a heading set differently —
which is how the six the Sapientia Christiana foreword prints inside
`veritatis-gaudium.en`'s appendix stay six divisions.

**Every heading detector needs markup, and the modern Dicastery template
prints none.** `dignitas-infinita.en` prints 32 headings as bare `<p>` and six
reach the tree — the six the page happens to italicise, which is an
inconsistency in hand-typed HTML and not a tier, so they land flat where the
document has three levels.

**Where a document's only numbering sits on its headings, the numeral is
consumed as a paragraph number and lost from the title.**
`inter-insigniores.en` stores `The Church's Constant Tradition` for a page
printing `1. The Church's Constant Tradition`. The same shape survives intact
in `santateresa-delbambinogesu.en`, which numbers its paragraphs separately —
so the numeral disappears exactly when it is the section number, which is when
it matters.

**`looks_like_number_typo` is vacuous at one digit**: any two distinct single
digits differ in exactly one place at the same length, so a part restarting at
1 reads as a misprint of the running count. `sacerdotium-ministeriale.en`
renumbers two restarts and then absorbs the rest of the third into §9, which
runs 5,564 characters against neighbours of 230 to 1,230; `donum-vitae.en` §9
is 8,149 against 1,276. The heuristic-versus-restart shape this repository
already records for _Dei Filius_ — but **tightening the typo test is not the
fix**, because refusing the correction orphans those paragraphs instead of
joining them. What it needs is restart detection.

**A fifth paragraph-numbering convention exists** — `<b>1 </b>`, no period,
`BOLD_BARE_NUM_RE` — which is how all sixteen Czech Vatican II editions print
their numbers. `sacrosanctum-concilium.cs` went from 9 sections to 130.

**A horizontal rule is evidence of a lid only where it is near the bottom.**
The other three footnote signals read the apparatus; the last `<hr>` guesses
that a rule means "notes follow", and a page whose only rule sits ABOVE its text
means the opposite by it — front matter cut off from the document. Both readings
are furniture and neither is stated, so the SIZE of what is being called a
footnote list is the only thing that separates them. Measured over every raw
page: 1,008 boundary on this signal and they do not form a spectrum — 1,003
leave at most 26.1% of the region below the rule and five leave at least 96.9%,
with nothing in between, so `_HR_MAX_SHARE` is not a tuning parameter.

**And a rule INSIDE the text is the third thing it can be, which no threshold
reaches.** `sapientia-christiana.en` sets one above its two appendices, 5,132
characters of the constitution and 5.8% of the region — so far inside the notes
band that the size test can only agree with it, and both appendices plus two
footnotes were never offered to the parse. What separates them is not how much
lies below the rule but what it OPENS with: a footnote list does not begin with
a division. Measured over every page that boundaries on this signal — 1,228 of
them, and exactly one prints a labelled division under the rule.

**Empty is measured in characters, not in blocks.** The five were the Hungarian
Rerum Novarum, Arcanum, Humanae Vitae and Redemptionis Donum, each of which had
been in the corpus as a work whose whole text was filed as notes and discarded —
0 sections, one unnumbered unit holding the page's printed table of contents,
and a clean validation, because the stub test asked whether an unnumbered
edition had a BLOCK and never whether it had any text. A contents list is ~1,100
characters and the shortest genuine unnumbered edition is tens of thousands, so
`STUB_CONTENT_MIN_CHARS` separates them with the margin it was already chosen
for.

## Vatican I: the walk is forked and nothing else is

**The schema held and the walk did not.** _Pastor Aeternus_ prints no number
anywhere; _Dei Filius_ numbers only its canons, restarting at 1 in each of four
groups; and the numbered matter comes LAST, after four unnumbered `CAPUT`s.
Fed to the general walk it produced a confident, wrong answer and reported the
damage as a fix: canon II.1 arrives as `cand=1` against `last_n=5`, which
`looks_like_number_typo` reads as a single-digit substitution, so four canons
were silently renumbered under an anomaly reading "typo, corrected". **A
heuristic tuned to a misprint cannot tell a misprint from a restart.**

`walk_vatican_i` is ~150 lines deciding what a block MEANS; shell sniffing,
block extraction, footnote split, manifest building, validation, ledgers and
the lock are all shared. The shape is small, fixed and fully known — two
documents, one council closed in 1870 — so it is read by a walk written for it
rather than by a third set of exceptions in a parser tuned against seventeen
hundred other pages.

**The canons are the sections and the chapters are leading matter.** §6 is a
number the printed edition never uses (it prints `II. 1`), so the printed
address is recovered as a RANGE rather than fabricated as a number. The
chapters take `position: "leading"` (`pipeline/docs/corpus.md`), because
rendered as back matter _Dei Filius_ would read backwards.

## Four repairs, measured and not made

Each was found by one document and measured over the whole of `raw/` before it
was written down, which is the only part of a repair that can be done without
touching the parser. None has been made, because a change here runs under every
family and `pipeline/CLAUDE.md` asks for the corpus-wide comparison first. They
are in the order worth doing: the first buys back text, the second buys back
editions, the last two stop losses nothing currently reports.

**Read a measurement before trusting it.** Every count below is a date-stamped
scan, not an invariant, and the scans are cheap — re-run one rather than
inheriting it.

### 1. `N)` is an address on a page that numbers no other way

97 raw pages open a `1) 2) 3)` run. On 67 of them the parens are a
sub-enumeration inside sections the page numbers `N.`, and admitting them would
be the false marker this file already refuses; on **30 there is no `N.` opener
anywhere**, 26 of those CDF, and the parens are the only addresses the document
has. So the rule is conditional on the page and not on the run:
admit `N)` where the page numbers no other way.

`catholics-who-join-masonic-associations.en` stores 502 characters of a document
its Portuguese edition reads at 1,551, and its `unpublished.json` entry names
this repair. Verification is a re-parse: exactly those 30 pages gain sections,
nothing else moves, and the baselined failures on `penalties-for-illicit-
ordinations`, `unlawful-ordinations` and `cum-oecumenicum-concilium` clear.

### 2. The masthead cut is bounded by nothing but the text

`extract_document_header` reads down while the matter still looks like a
masthead, and the issuing body's name is its strongest signal — so a document
opening `This Congregation for the Doctrine of the Faith has been asked…` reads
as more masthead. The long mastheads are overwhelmingly English:
`clarification-on-procured-abortion.en` at 1,244 characters,
`catholics-in-political-life.en` at 840, the latter holding that document's
whole introductory paragraph since the family was first parsed.

What it needs is a stop condition that is not "does this name the issuing
body". Verification is the header field's length distribution per family before
and after, plus the invariant that no work may LOSE characters from `sections`
and `appendix` — this repair only ever moves text the other way.

### 3. The stub floor is one number for families of different lengths

`STUB_CONTENT_MIN_CHARS` is 300 because the shortest genuine encyclical strips
to 7,106 and the largest sampled stub to ~90. Both true, and silent about a
family whose documents are two sentences: the Latin _Notification on the
validity of Baptism conferred in The New Church_ is a complete, correct parse
of 285 characters, refused as a page carrying nothing. Verification is the set
of works raising `StubPageError`, which may only shrink, and only by documents
whose refused text is prose.

### 4. A derived URL is asked for where the page links the real one

`translation_url_for` substitutes the language into the path and keeps the
filename; the switcher states the real path. Measured over every cached
modern-shell page: **8,854 switcher links agree with the derivation and 259
differ**, most of them a `.pdf`/`.html` split on a PDF-only base edition. The
residue is the documented trap — the date digits written the other way round —
and it costs editions that exist: `acerba-animi.la` and
`non-abbiamo-bisogno.es` are both linked by their own pages and both remembered
in `absent-sources.json` as 404s, because the guess was asked for and the
answer was filed against the document.

Verification has a second half most repairs do not: the absent ledger's entries
for every URL that changes have to be WITHDRAWN rather than bypassed, or the
corpus keeps a recorded absence for a page nobody ever asked for.

## The rebuild

**The rebuild recipe is a program** (`pipeline/rebuild.py`). It was seventeen
`sh` lines in the corpus README — the only way back to an untracked `build/`,
which nothing executes, so nothing checked it. It rotted four times without
once failing, the last being a hand-written `--langs` list one language short
of `DIVISIONS`, which meant phase 2 had never asked for a Swahili edition of
anything: **a hand-written list decides what is captured, not just what is
read, and "re-parse, never re-crawl" cannot recover a page nobody asked for.**
It derives what it can from the scrapers rather than restating it. It is
deliberately not a build system — a cached `raw/` already makes a re-run fetch
nothing, and `write_stamped_json` already makes it write nothing it did not
change.

**Each stage declares the work-id globs it writes, and those globs partition
`build/`** — every work claimed by exactly one stage, none twice, none
unclaimed. That is what makes concurrent stages safe rather than merely faster,
and what keeps the `wrote` column honest under `--jobs`.

**The two document stages run `--offline` and take a lock per phase.** Their
shared crawl lock was two reasons wearing one name — doubling the request rate,
and racing a work directory. An offline run retires the first; the second is a
race between two runs of one phase, never between phases, which write disjoint
families. `--offline` is also worth having on its own: this recipe has always
claimed zero network and nothing enforced it.

**`--changed-only` is opt-in and stays opt-in.** It skips a stage whose `code`,
`data`, `corpus` and `outputs` fingerprints all match the last run that exited 0. `code` is the script's real import closure, read off its `import` statements
and hashed by content, so a new import counts the day it is written — a table
would have been a second place to remember something, which is the shape of
every rot above. The list is knowably incomplete (`uv` resolves PEP 723 headers
at run time), which is what `--force` is for; a stage that exits nonzero is
never recorded, so a broken parser is never skipped. Fifty seconds to nineteen.

**A run's verdict is a baseline, because most failure here is the corpus's
known state.** Gating on the cross-language symmetry check meant both document
phases had exited 1 on every run they ever had; gating on "no document failed"
would have been as useless, since a run legitimately reports 445 fetch
failures, 212 documents whose parse does not validate and 67 stub pages. The
answerable question is whether a run went worse than what is written down:
`absent-sources.json` and `translations-checked.json` answer first, and
`pipeline/parse-baseline.json` holds the 312 works they cannot speak for. The
limit is stated where the code is — the baseline is a floor under the parse's
addresses and not its structure, since `validate_document` never reads
`structure.json`.

**A recall fix scores as a regression in a checker that counts incidents.**
`eccl-de-euch.hr` went from 47 citations to 100 and from 46 resolved to 96, and
the baseline recorded `1 -> 4 problems`. The two numbers have to be read
together.
