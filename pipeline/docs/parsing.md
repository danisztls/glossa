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

**Inline emphasis is not a word boundary.** A tag becomes a space only where it
is block-level. The substituted space was hiding real source defects behind a
code rule, and stripping whitespace afterwards cannot work because this corpus
prints spaced punctuation on purpose.

**A missing heading is a claim about the parser until the raw page is opened.**
All three editions recorded as "omitting" a Compendium heading were printing
it. The subsequence check reports what it did not find, and "not found" was
written into a manifest note as "not printed at all" without anyone looking.
`raw/` is kept so that question is always answerable.

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

**`lt` is Latin on this host and `lit` is Lithuanian.** Third family to spring
the trap (`ccc.py` documents it for `catechism_lt`, `VATII_LANG_FROM_URL` for
the conciliar mirror) and the first where both readings are live on one index,
which is what makes it dangerous: a code map borrowed from elsewhere does not
fail, it files sixty-six Latin editions as Lithuanian and says nothing.
`lang_urls` is keyed by what the SOURCE calls a language — vatican.va's modern
CMS calls Hebrew `iw`, the retired ISO 639-1 code, while its Vatican II mirror
calls it `he`.

**A fifth paragraph-numbering convention exists** — `<b>1 </b>`, no period,
`BOLD_BARE_NUM_RE` — which is how all sixteen Czech Vatican II editions print
their numbers. `sacrosanctum-concilium.cs` went from 9 sections to 130.

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
