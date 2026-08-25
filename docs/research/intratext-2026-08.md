# IntraText as a source for the Magisterium documents, 2026-08-22

Companion to `vulgate-edition-choice.md` §3, which evaluated IntraText for the
**Latin Bible** and disqualified it. This one asks the same question for the
**Magisterium documents** and reaches a different-looking answer for a
different reason — see §5, which is the part worth remembering.

**Verdict: not a source to migrate to, and no use as a second witness.** For
these documents IntraText publishes _the same electronic text_ vatican.va
does. It cannot improve on our text, and it cannot corroborate it.

## 1. We already parse IntraText — this is not a new source

Worth stating first, because it reframes the question. The Catechism's English
corpus comes from `https://www.vatican.va/archive/ENG0015/__P1.HTM` — an
**IntraText production hosted on vatican.va**, under IntraText's own `ENG####`
work-id scheme (`ENG0015` for the CCC; `ENG0214` is Centesimus Annus on
intratext.com) with its footnote convention
`<sup><a name=-CODE href=#$CODE>N</a></sup>`. `ccc.py`'s docblock says so, and
`vatican_docs.py` describes itself as generalizing that parser for "the same
IntraText-family template".

So the question is not "should we adopt IntraText?" but "should we fetch that
same family of pages from intratext.com rather than from vatican.va?"

## 2. Provenance: the documents are the same text

Centesimus Annus EN, the 14 sections sharing one page
(`IXT/ENG0214/_P6.HTM`, §30–43), against our vatican.va parse:

| measure                 | result                              |
| ----------------------- | ----------------------------------- |
| similarity, per section | **0.998 – 1.000** (one exact 1.000) |
| character differences   | none                                |
| the residual 0.2%       | footnote marker digits only         |

The only divergence is that stripping IntraText's `<sup><a>65</a></sup>`
leaves the digits in the plain text, where ours carries them as
`<sup data-fn="65">`. The prose is identical.

**Consequence:** IntraText cannot serve as an independent witness for a
disputed passage — the evidence a `pipeline/corrections/` entry wants. The 16
missing-space defects corrected on 2026-08-22 (`<i>modus vivendi</i>had` and
kin) are very likely present there too; testing it would prove nothing either
way, because the text has one origin.

## 3. Do they have a contract with the Holy See?

Nothing on IntraText's pages claims one, and none was found. What _is_
established: the Holy See publishes an IntraText-produced edition of the
Catechism on its own domain under IntraText's ID scheme. That is evidence of a
real working relationship, not of its terms.

The operator is EuloTech SRL, Rome. Their Editorial Info page describes a
digitisation service that "processes texts converting them into XML according
to international standards, such as the TEI", "cooperates with outstanding
religious and research institutes", and "publishes for free within research
activities" — i.e. texts arrive through client work, consistent with the
Vatican hosting one of their productions.

## 4. Cheap or careful?

**Both, in different places.** Careful in presentation: the per-word
concordance apparatus is real lexical work, footnote markers are uniformly
structured, and the stated conversion target is XML/TEI.

Cheap exactly where it would have helped us: **paragraph numbers are left as
plain text at the start of a paragraph** (`30. …`), as vatican.va prints them.
A scholarly TEI encoding would have captured the numbering that _addresses_
the text; this one did not. Every heuristic our parser spends its effort on
would still be needed.

## 5. The finding that matters: quality is per-work, not per-site

`vulgate-edition-choice.md` §3 disqualified IntraText's `LAT0001` on measured
integrity — Baruch absent, Daniel stopping at chapter 3, Numbers at 32, Esther
at 10, Psalms at 149, and a text that is not the Clementine at all but an
unattributed Stuttgart-family transcription whose own credits give its printed
source as "Not available."

This survey finds the opposite for `ENG0214`: a faithful copy of the same text
the Holy See publishes.

Both are true, and the reconciliation is the useful part. **IntraText is an
aggregator of separately-sourced e-texts, not a single edition with a single
standard.** A work there is exactly as good as whatever transcription was
donated or commissioned for it, and the site's own credits page is the only
thing that says which. So "is IntraText any good?" has no answer; it has to be
asked per work, and the credits page checked every time. That is a poor
foundation for a corpus, independent of how any individual work scores — and
it is why a good result for Centesimus Annus does not license trusting the
next document.

## 6. Markup, measured on one page

| property          | IntraText                                      | vatican.va documents          |
| ----------------- | ---------------------------------------------- | ----------------------------- |
| paragraph numbers | plain text, `30.`                              | plain text, `30.`             |
| footnote markers  | `<sup><a name=… href=…>65</a></sup>`, uniform  | several competing conventions |
| noise             | **~3,300 `<A NAME=…>` per page** (concordance) | `<font>`/`<span>` wrappers    |
| document = files  | paginated `_P1..N.HTM`, editorial breaks       | one page per document         |
| addressing        | opaque per-language ids (`ENG0214`)            | derivable from slug + lang    |

**Gain:** uniform footnote markup — the part of the parser that works hardest.

**Costs:** every content word is wrapped in a concordance anchor, so _every
word boundary becomes a tag boundary_ — precisely the defect class that cost a
day on 2026-08-22 (`decisions.md` §Storage, "inline emphasis is not a word boundary").
Documents split across pages multiply requests per work, the same shape as the
18× fetch multiplier `vulgate-edition-choice.md` §3 measured for LAT0001. And
discovery needs a hand-built id map per work per language, where vatican.va
URLs derive from slug + lang — which is what makes the sweep work at all.

Separately from the parse: `robots.txt` names and blocks every bulk mirroring
agent (HTTrack, Wget, WebCopier, Teleport, WebZIP, …) and sets no
`Crawl-delay`. Systematic harvesting runs against its evident intent.

Incidental gap-closure for `vulgate-edition-choice.md`, which recorded the
licence variant as undetermined because `Copyright.htm` 404s: the statement
lives at `/info/copyENG.htm` and is **CC BY-NC-SA 3.0 Unported**, "except
where otherwise noted", with per-page copyright notes governing and a stated
preference that content be linked rather than republished elsewhere. Recorded
for completeness; it is not what decides anything here.

## 7. The coverage question, measured — it does not fill the gap

Coverage was the one thing left open as able to change the verdict (§8).
It was measured on 2026-08-23 and the answer is **no**.

**Our gap**: 128 of 216 encyclical slugs have English text and no Portuguese —
Leo XIII 70, Pius XI 21, Pius X 16, Benedict XV 12, Pius XII 8, Paul VI 1.

**Their Portuguese catalogue** (`/POR/`, 174 works, of which 109 are dated
works by a pope we ingest), matched against ours on promulgation date:

| outcome                                         | count |
| ----------------------------------------------- | ----- |
| we already hold the Portuguese edition          | 53    |
| other genres (exhortations, apostolic letters…) | 53    |
| **nominally fills a gap**                       | **3** |

The 53 in the middle row — _Pastores dabo vobis_, _Rosarium Virginis Mariae_,
_Ordinatio sacerdotalis_ and kin — are document families this corpus does not
ingest at all. vatican.va publishes them too, so they are a scope decision
about genres, not something IntraText uniquely offers.

**The three, and why they are not really three.** All are works where
vatican.va _has_ the Portuguese and our parser was defeated by it, not works
vatican.va lacks:

| work                     | our EN                     | why our PT is empty                                               |
| ------------------------ | -------------------------- | ----------------------------------------------------------------- |
| Pascendi dominici gregis | 58 sections                | PT typeset as continuous prose, **no paragraph numbering at all** |
| Miranda prorsus          | 4 sections (also defeated) | same                                                              |
| Mense maio               | 15 sections                | same                                                              |

Fetching IntraText's `POR0243` (Pascendi) settles it: **their Portuguese
edition is unnumbered too** — an 83 KB text page yields two numbered openers,
against the 57 the English edition carries. It is the same translation with
the same absence, so it cannot be addressed by section number any better than
vatican.va's can. The corpus's problem there is the Portuguese edition itself,
not where it is fetched from.

_Verified for Pascendi only; Miranda prorsus and Mense maio were not fetched,
and Miranda prorsus's English side is independently defeated, so it would not
pair with a working sibling regardless._

**The structural reason it was never likely.** IntraText's Portuguese holdings
sit where our coverage is already good and are nearly absent where our gap is:

| pope         | our PT gap | IntraText PT |
| ------------ | ---------- | ------------ |
| Leo XIII     | 70         | **2**        |
| Pius XI      | 21         | **2**        |
| Pius X       | 16         | **1**        |
| Benedict XV  | 12         | **0**        |
| Pius XII     | 8          | 39           |
| John Paul II | 0          | 46           |

Both of Leo XIII's Portuguese works there (_Humanum genus_,
_Dall'alto dell'Apostolico Seggio_ — our `apostolico-seggio`) are already in
the corpus.

## 8. What would change the verdict

Nothing now identified. Coverage was the one open candidate and §7 closed it.
A genre expansion (apostolic exhortations and letters) would add real
documents, but vatican.va publishes those as well, so it is a decision about
scope rather than a reason to change source.

## Honest gaps

- One page of one document was fetched (`ENG0214/_P6.HTM`, 14 sections).
  §2's conclusion is that those 14 sections match; it is not a corpus-wide
  measurement, and by §5's own argument it does not generalize to other works.
- Whether IntraText's copies carry the same missing-space source defects was
  not tested.
- Coverage overlap was measured for Portuguese only (§7), matching on
  promulgation date; other languages were not surveyed.
- Of the three nominal gap-fillers, only Pascendi's numbering was checked
  directly.
