# The patristic citations, parsed

Measured 2026-08-25 over every `citations[].text` in `works/`, by
`pipeline/scrapers/patristics.py`. No fetches; nothing here was ingested.

This is the pass `docs/research/summa-and-fathers.md` §6 recommended in place
of ingesting a patristic library: parse the citation strings already captured
into `{author, work, locator}` and see what the corpus is actually asking for.
That survey did its counting with regexes over whole strings and said so; this
replaces its guesses with a parse, and **the answer it gives is harsher than
the survey's framing implied.**

```sh
uv run pipeline/scrapers/patristics.py            # the summary + the subset ladder
uv run pipeline/scrapers/patristics.py --authors  # the full author table
uv run pipeline/scrapers/patristics.py --works    # the work table, most-cited first
uv run pipeline/scrapers/patristics.py --residue  # what no author was read from
uv run pipeline/scrapers/patristics.py --json     # every parsed clause
```

## The measurement

| what                                                |               |
| --------------------------------------------------- | ------------- |
| citation strings in the corpus                      | 22,278        |
| clauses carrying a Migne `PL`/`PG` reference        | 1,767 (7.9%)  |
| of those, also carrying a **work-internal locator** | 1,287 (72.8%) |
| of those, **attributed** to an author               | 1,026 (58.1%) |
| distinct authors named                              | 50            |
| distinct works, abbreviations folded                | 734           |
| distinct Migne volumes                              | 203           |

The 1,767 is up from the survey's 1,244 because the corpus has grown, and it
is still a floor for the same reason the survey gave: a patristic citation
printed without a Migne column is invisible to this discriminator.

**72.8%, not 94%.** The survey's headline number was that "94% of the 1,244
patristic citations carry a work-internal locator". Parsed rather than
sampled, it is 72.8%. The 480 clauses without one divide cleanly: **307 name
no work at all** — a bare `PL 54, 931`, which is a footnote continuing the one
before it — and **173 name a work but no place in it** (`St. Maximus the
Confessor, Ambigua: PG 91, 1156C`). Neither is a parser failure; both are
citations that genuinely address a Migne column and nothing else.

That still leaves the survey's core claim standing: nearly three-quarters of
this apparatus is addressable in a way that survives the choice of edition,
and it was addressable months ago at no cost.

## The authors

Cumulative share of the 1,026 attributed clauses:

| rank | author                     | citations | cumulative |
| ---- | -------------------------- | --------: | ---------: |
| 1    | Augustine                  |       296 |      28.8% |
| 2    | Ambrose                    |        76 |      36.3% |
| 3    | Irenaeus                   |        73 |      43.4% |
| 4    | John Chrysostom            |        68 |      50.0% |
| 5    | Leo the Great              |        40 |      53.9% |
| 6    | Tertullian                 |        39 |      57.7% |
| 7    | Basil the Great            |        36 |      61.2% |
| 8    | Gregory the Great          |        33 |      64.4% |
| 9    | Origen                     |        33 |      67.6% |
| 10   | Cyprian                    |        30 |      70.6% |
| 11   | Justin Martyr              |        29 |      73.4% |
| 12   | Jerome                     |        28 |      76.1% |
| 13   | John Damascene             |        25 |      78.6% |
| 14   | Gregory of Nazianzus       |        22 |      80.7% |
| 15   | Gregory of Nyssa           |        20 |      82.7% |
| 16   | Cyril of Jerusalem         |        19 |      84.5% |
| 17   | Germanus of Constantinople |        18 |      86.3% |
| 18   | Peter Chrysologus          |        16 |      87.8% |
| 19   | Athanasius                 |        12 |      89.0% |
| 20   | Hilary of Poitiers         |        10 |      90.0% |

**Four authors are half of it; twenty are ninety per cent.** That confirms the
survey's shape, and it is the encouraging half of this document.

The survey's own table left 34% unmatched against a hand-built list. This
leaves 41.9% **unattributed**, which is not the same thing and is not worse:
those clauses do not name an author for the parser to miss.

### Why 41.9% names nobody, and why that is not a gap to close

The residue concentrates, and reading where it concentrates explains it:

| citing work                             | unattributed clauses |
| --------------------------------------- | -------------------: |
| `encyclical.sacra-virginitas` (en + pt) |                   96 |
| `encyclical.aeterna-dei` (en + pt)      |                   87 |
| `encyclical.doctor-mellifluus.pt`       |                   40 |
| `encyclical.mysterium` (en + pt)        |                   52 |

Each is an encyclical **about** one Father — _Aeterna Dei_ on Leo the Great,
_Doctor Mellifluus_ on Bernard, _Sacra Virginitas_ drawing overwhelmingly on
Ambrose — and a document about one man names him in its first footnote and
then cites him by work alone for forty more. The unattributed set is dominated
by the Migne volumes those men occupy: `PL 54` (Leo) 95 clauses, `PL 16` and
`PL XVI` (Ambrose) 57 between them, `PL 183` and `PL 182` (Bernard) 51.

**Attributing those from the Migne volume is refused**, and the refusal is the
point. Migne is arranged by author, so `PL 182` could be read as Bernard from
a table. That table would be written from memory rather than from the
citation, and its output would be indistinguishable in the index from an
attribution a source actually made. The parser reports what the corpus says.

## The works — and the finding that changes the recommendation

The survey imagined the parser would produce "the thing that would tell a
later ingest which 40 works to do and which 250 to skip". It does, and the
answer is that there is no such subset.

Ingesting the works most-cited first:

| subset        | share of citations served |
| ------------- | ------------------------: |
| top 10 works  |                     17.4% |
| top 20 works  |                     24.6% |
| **top 40**    |                 **33.1%** |
| top 60 works  |                     39.1% |
| top 100 works |                     46.9% |
| top 200 works |                     60.9% |

**509 of the 734 works — 69% — are cited exactly once in the whole corpus.**

This is the decisive number, and it is the opposite of the author table above.
Author concentration is steep; **work concentration is flat**. Augustine's 296
citations are spread across **82 distinct works of his own**, so "ingest
Augustine" is not one project but eighty-two, and the fortieth most-cited work
in the entire patristic apparatus is cited five times.

The survey already concluded "Fathers — do not ingest. Link out", and reasoned
from author coverage that even a top-12-author subset leaves 44% unresolved.
The work-level measurement says the subset idea is weaker still: the unit of
ingestion is a work, not an author, and by works the demand has almost no head
to speak of.

### The top of the table, for the record

| rank | work                                          | citations |
| ---- | --------------------------------------------- | --------: |
| 1    | Augustine, _Sermones_                         |        57 |
| 2    | Irenaeus, _Adversus haereses_ (two spellings) |     37+19 |
| 3    | Augustine, _De civitate Dei_                  |        23 |
| 4    | Leo the Great, _Sermones_                     |        22 |
| 5    | Augustine, _Confessiones_                     |        21 |
| 6    | Augustine, _Enarrationes in Psalmos_          |        19 |
| 7    | Gregory of Nazianzus, _Orationes theologicae_ |        18 |
| 8    | Augustine, _In Ioannis Evangelium tractatus_  |        14 |
| 9    | Peter Chrysologus, _Sermones_                 |        14 |
| 10   | Cyprian, _Epistulae_                          |        12 |

Augustine's _Sermones_ leading at 57 is exactly the survey's worst case
restated: it is the single largest bucket, and NPNF carries only a small
selection of the 400-odd sermons.

## How the parser works, and where it is approximate

Every rule is in `patristics.py`'s own comments; the parts worth knowing
before trusting a number:

- **The author is matched anywhere in the clause, not only at its head.** A
  clause can open with prose (`vatii.lumen-gentium.pt` §42 prints a sentence
  of Portuguese before "cfr. S. João Crisóstomo") or with an unrelated
  conciliar citation. The risk of a whole-clause search is taking a name out
  of a **title** — `Contra Faustum`, `Ad Simplicianum`, `De fide ad
Gratianum` — and every such title puts the name after a preposition, so
  refusing a match preceded by one is the whole guard. `Pseudo-` is refused
  the same way: the corpus prints "Pseudo Eusébio de Alexandria", and reading
  that as Eusebius of Caesarea would attribute a work to a man on the strength
  of the words saying it is not his.
- **Leftmost wins.** A clause naming two people is cited for the first.
- **Abbreviated titles are folded by token-prefix, not by a table.** `Adv.
haer.` abbreviates `Adversus haereses` because each of its tokens is a
  prefix of the corresponding one — which is what an abbreviation is. That
  buys the fold with no 288-entry table, the half the survey called hard. It
  over-merges where two titles share a truncation (`De orat.` could abbreviate
  `De oratione` or `De ordine`), and the merged name is always a form the
  corpus prints.
- **Cross-language title pairs need a table and get a short one.** Prefix
  folding cannot join `Sermão` to `Sermo`; that is a translation, not a
  truncation. The table is fourteen entries long because the Portuguese
  editions mostly leave Latin titles in Latin.
- **The author is carried forward inside one citation string and never past
  it.** `S. Augustinus, De civ. Dei 1: PL 41, 13; Sermo 2: PL 38, 21` names
  him once for two works, and reading the second as his is reading the
  footnote. 84 clauses are attributed this way. Carrying across footnotes is
  the `Ibid.` problem — 6.2% of the corpus's citations — and it belongs to
  `site/scripts/build-xrefs.mjs`, where it is also unsolved.

## What this does not answer

- **No work is matched against ANF/NPNF.** That is the check the survey said
  must run before committing to a patristic subset, and it needs those
  collections' contents. The subset ladder above answers the prior question
  and answers it harshly enough that the ANF/NPNF match may never be worth
  running.
- **No reverse "cited in" panel is built for the Fathers**, because there is
  nothing to stand on: a panel saying "Augustine's _Sermones_ are cited in
  ¶983 and 56 other places" needs a page for Augustine's _Sermones_, and this
  corpus holds none. That deliverable was always downstream of an ingest the
  measurement above argues against. What the same derivation _did_ buy, for
  the works the corpus does hold, is `docs/link-surface.md` #12 — built
  2026-08-25.
- **No link-out targets are generated.** New Advent hosts the ANF/NPNF
  translations behind opaque four-digit ids (`/fathers/0618.htm`) with no
  derivable addressing, which is the same objection
  `research/intratext-2026-08.md` §6 raised against IntraText. A link-out
  layer needs a hand-built id map, and 734 works with a 69% singleton tail is
  the wrong shape for one.
- **The Summa half of §6 needs nothing.** It was ingested on 2026-08-23 and
  `site/src/lib/refs-grammar.ts` has parsed and linked `STh` citations since;
  that half of the recommendation is closed by other means.
