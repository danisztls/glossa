# Writing for the reader

The voice this site is written in, for whoever — person or agent — is asked to
write a string, a tagline, a section of `/schola`, a disclosure or a document
description. It covers **prose a reader reads**. Maintainer prose is a
different register and is governed elsewhere: `CLAUDE.md` §Documentation
conventions for the rules, `docs/decisions.md` for where a rationale goes.

**`docs/writing-descriptions.md` holds the procedure for a description** — how
to read the document, how to record the reading, what `origin` means. This
file holds the voice, and the two are read together for that one job.

## The reader is one of four, and the register follows

`docs/research/audiences.md` names nine readers. For writing they collapse to
four situations, and the first question before any sentence is which one it is
addressed to.

| Situation                | Who (audiences.md §)                | Register                                                 |
| ------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Arrived with a QUESTION  | §1 layperson, §5 OCIA               | teach the vocabulary without announcing it as vocabulary |
| Arrived with an ADDRESS  | §4 citation-follower, §7 seminarian | terse, provenance-forward, no teaching                   |
| Weighing the site itself | §9 legitimacy review                | operative, conceding, survives an adversarial reading    |
| Meeting a fallback       | §3 no chrome, §8 offline            | state the device and edition fact, never reassure        |

The first two are the split the whole site is organised around: the
question-holders are plausibly most of the traffic and the address-holders are
the ones every apparatus was built for. A string written for the wrong one is
the commonest failure — a label that explains itself to a reader who did not
need it, or a heading that assumes an outline the reader cannot name.

## The rules

**Declarative, never promotional.** A tagline says what a thing is and how
large it is. `'The law of the Latin Church, in 1,752 canons across seven
books.'` No adjective of praise appears in any dictionary, and none should.

**Deference by attribution.** Where a choice could read as this site teaching,
name who taught it instead. `/schola` recommends a Gospel and immediately
says whose recommendation it is — _"That is not our idea: a Council of the
Church asked that people be taught the right use of Scripture… It named no
single one, and neither will we."_ This is the move that makes a guide on a
site with no approbation legitimate rather than presumptuous, and it is the
one to reach for whenever prose is about to advise.

**Name the reader's real experience, including the failure.** _"Most people
start at the first page and stop a few weeks later, in a long chapter of
ancient law, because nothing has yet told them what it is for."_ Assume
nothing; condescend to nothing. A reader who has been told the Bible is
straightforward has been lied to and knows it.

**A plain statement, then the qualification that makes it honest.** _"Not a
story: a hundred and fifty prayers and songs."_ / _"Law rather than doctrine.
It states what the Church requires, and it is amended."_ The second clause is
where the writing earns its place.

**"We" only where the site takes responsibility; "you" only where the reader
acts.** _"We do repair plain defects"_ is the site answering for an editorial
act. _"what you have marked in it"_ is the reader's own doing. Never "we
believe", never "you'll love", never a first person that has no act behind it.

**Terms of art are given, not avoided.** _Siglum_, _canon_, _Magisterium_,
_Doctor_ all appear, each glossed where it first does work: _"by canon, which
is what its numbered units are called"_. The alternative — writing around the
word — leaves the reader unable to read the citation they came to read.
Everywhere else prefer the short word: "the older half", not "the Old
Testament corpus".

**Claim no authority, ever.** _"It carries no official authority, however
great its author."_ This is `site/docs/colophon.md`'s subject and a position
under can. 216, not a modesty pose. Nothing may imply the site acts in the
Church's name, and nothing may imply a text has been approved because it is
here.

**Say what is missing, to the reader's face.** _"A contact address has not
been set yet. This site should not be made public until it has one."_ /
_"There has never been a Catholic Bible in Swedish that is out of copyright."_
An absence explained costs a reader nothing; an absence hidden costs them the
trust the rest of the page is asking for.

**Do not evaluate, recommend or contextualise reception.** Describe. This
holds for descriptions by rule and for every other surface by temperament —
the site reproduces what the Church wrote and adds apparatus, not an opinion
of it.

## Every string is written to be translated

`t()` falls back to English key by key, so a dictionary may be partial without
breaking a page — but a string that only works in English will silently be the
English one on a page in another language. Write for the whole set
(`UI_LANGS` in `site/src/lib/i18n.svelte.ts`).

- **No idiom, no pun, no wordplay on an English word's two senses.** A joke
  that cannot cross is a joke that ships in one language.
- **Say what a translation must preserve**, in a comment beside the key, when
  the surface form is not the point: `home.doors.heading` carries _"A
  translation should keep it a direction and not an instruction."_
- **Register is the translator's call, not the English one's.** `Learn` is an
  imperative in a bar of nouns; each dictionary takes whatever its own
  language puts on a nav item, and an imperative that would read as an order
  becomes a verbal noun (`site/docs/finding.md`).
- **Never assume interface language equals content language.** A reader can
  hold Malagasy content under English chrome, or English Scripture under
  Portuguese chrome via `CONTENT_LANG_FALLBACK`. A string that says "in your
  language" is usually wrong; name the edition instead —
  _"The Summa has no edition in your language. Shown in {lang}."_
- **A string naming something outside the site must use that thing's own
  words.** `install.hint.*` names an entry in the reader's OS menu, so the
  wrong regional variant sends them looking for words their phone does not
  print (`site/docs/languages.md`).

## Writing a description

The procedure is `docs/writing-descriptions.md` and it is not optional: a
description is written by **reading the document in the corpus**, and `origin`
records that it was. What follows is the shape the reading takes.

One paragraph, roughly 40–70 words, a library card and not an abstract.

- **Open with author, genre, date and addressee, then the subject.** _"Pius
  XI's 1932 encyclical to the bishops of Mexico on the continuing persecution
  of the Church there…"_ The kind, the pope and the date render beside it, so
  the opening earns its place by being specific — the addressee and the
  occasion are what the metadata does not carry.
- **Then either a chain of participles or a second structural sentence.**
  _"…reviewing the government's anti-Catholic constitutional laws and broken
  pledges, addressing whether seeking state permission for worship compromises
  Catholic principle, urging the faithful toward Catholic Action."_ Or:
  _"It closes with six binding ordinances: weekly catechism for children,
  First Communion preparation, a parish Confraternity of Christian Doctrine…"_
- **Name the specific thing.** "On the social order" describes half the
  corpus. Prefer the named institution, the named feast, the named date:
  _"institutes the feast of the Queenship of Mary, to be kept every 31 May"_,
  _"eight new dioceses under Goa's patriarchal see"_.
- **Keep structural imagery the document uses of itself.** It is how readers
  remember which encyclical is which.
- **Every clause traceable to a section actually read.** If you cannot point
  at the section, cut the clause.
- **Write each language's description from that language's edition.** A
  Portuguese description is prose about the Portuguese text, not a translation
  of the English one; `descriptions.json` is keyed by work for that reason. A
  translation is marked `origin: "translated"` with `from`, and is written
  from the description, never from the document.
- **A reading also proposes subject terms** for `site/document-tags.json`, a
  closed vocabulary. A term names what a document is _about_, never what it
  _does_.

## Mechanics

**Numerals split by job.** Prose that teaches spells them out — "seventy-three
books", "a hundred and fifty prayers and songs". A tagline or label that
specifies uses digits — "1,752 canons", "583 numbered paragraphs". The test is
whether the number is orientation or precision.

**No count that will rot.** A number belongs in reader-facing copy only where
it is a property of the work itself (the canons in the Code, the books of the
Bible). A count of what this site currently holds goes through the colophon's
computed counters, never into a written sentence.

**Typographic marks everywhere a reader sees them**: `’` for the apostrophe,
`—` for the em dash, and a quoted phrase in `“…”` — the convention
`descriptions.json` already held for quotations and now holds for apostrophes
too. A language that quotes differently keeps its own marks: the Polish
descriptions use `„…”` and are not a defect to normalise. The straight `'` is
correct in `$comment`, in code and in a path, and nowhere a reader reads.

**Sentence case for headings**, and the site's own nouns capitalised as the
Church capitalises them — Scripture, the Catechism, the Magisterium, a
Council.

**Short sentences carry the load; the long one is the exception that earns
it.** _"Not on this device."_ / _"The page you asked for is not here."_

## Before it ships

1. **Which of the four readers is this addressed to**, and does the register
   match?
2. **Does any sentence claim authority, approval, or an opinion of a text?**
   Cut it.
3. **Would it survive translation** into a language with no word for the term
   of art — and if not, is the comment beside the key saying what to preserve?
4. **Is every factual clause checkable** against a text in the corpus, a path
   in the repo, or a source page?
5. **Does it count anything that will be untrue next month?**
6. **Is a new key needed at all?** `/`'s two new sections cost three strings
   because every other line on the page was a name some other page had already
   written in every language. Reuse before you add.

Concurrent writers share one `site/descriptions.json` and will collide: an
agent working in a batch returns its entry and the coordinator applies it.
ToC oracles are one file per work and may be written directly.
