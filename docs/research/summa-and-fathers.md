# The Summa and the Fathers as corpus sources, 2026-08-23

Scoping survey for the two source families `link-surface.md` §"v2 surfaces"
parks as "a further-out, differently-sourced problem (Migne PL/PG, not
vatican.va)". The question asked here is narrower than "should we host them":
it is whether ingesting them is the way to **expand citation coverage**, which
is the stated goal.

**Verdict, three parts:**

1. **The Summa is feasible and small** — one work, one closed address space,
   248 citation strings across 55 works. Latin and English are both sourceable.
   **Portuguese is not**, and the free Portuguese Summa circulating online is
   machine-translated (§3.3) — a disqualification, not a quality quibble.
2. **The Fathers are not one project; they are a library.** 1,244 citations
   spread over 157 distinct Migne volumes and ~288 abbreviated work-titles,
   with a 34% tail of minor authors. No Portuguese source exists that this
   project could use at any price.
3. **The goal is separable from the ingest, and the cheap half comes first.**
   94% of these citations already carry a resolvable work-internal locator in
   text we captured months ago. Parsing them delivers most of the citation
   coverage, costs no fetches and no copyright exposure, and is a prerequisite
   for either ingest anyway. See §6.

## 1. What the corpus already asks for — measured

Measured 2026-08-23 over every `citations[].text` in `works/` (all
`paragraphs.json` and `sections.json`): **20,061 citation strings across 175
works**. Classification is by regex over the verbatim strings, word-bounded
(an early count was inflated by `Esth` matching the `S Th` siglum).

| family                                     | citations | share | works citing | ¶/§ that would gain a link |
| ------------------------------------------ | --------: | ----: | -----------: | -------------------------: |
| Patristic (carrying a Migne `PL`/`PG` ref) |     1,244 |  6.2% |           85 |                        964 |
| Summa Theologiae                           |       248 |  1.2% |           55 |                        232 |
| **both**                                   | **1,463** |  7.3% |            — |                  **1,126** |

Against the CCC specifically: **543 of 3,905 citation-bearing paragraph slots
(14%)** across `ccc.en` + `ccc.pt` carry at least one such reference. That is
the honest size of the prize — real, and an order of magnitude below Scripture.

## 2. The two families have opposite shapes

This is the finding that decides everything downstream.

**The Summa is a point target.** 248 citations resolve to **92 distinct
(part, question, article) addresses** — 71 distinct questions. The whole
demand from the entire corpus fits in about 3% of one work. Distribution by
part (Roman-form citations): I 76, II-II 56, I-II 47, III 40. The most-cited
article, `III, 73, 3`, is cited 8 times.

**The Fathers are a long tail.** The same 1,244 citations touch **157 distinct
Migne volumes** (PL has 217, PG 161 — so the citations reach across
essentially the whole of Migne) and roughly **288 distinct abbreviated
work-titles**. Author concentration, matching EN and PT name forms against a
canonical list:

| rank | author          | citations | cumulative |
| ---- | --------------- | --------: | ---------: |
| 1    | Augustine       |       305 |        25% |
| 2    | Irenaeus        |        72 |        30% |
| 3    | Ambrose         |        60 |        35% |
| 4    | John Chrysostom |        60 |        40% |
| 5    | Tertullian      |        38 |        43% |
| 6–12 | Origen … Nyssa  |       156 |        56% |
| tail | unmatched       |       421 |       100% |

The 34% tail is not noise, and it is not one more scrape: Faustus of Riez,
Theophilus of Antioch, Epiphanius, Nicetas, Symeon of Thessalonica, Benedict's
_Regula_, anonymous liturgical homilies. Each is a separate work with a
separate source and a separate rights question.

Even _inside_ Augustine the tail repeats. His 305 citations break down as
_Sermones_ ~32, _Confessiones_ ~21, _Enarrationes in Psalmos_ ~17,
_Epistulae_, _De sermone Domini in monte_, _De Trinitate_, _De civitate Dei_ —
and the largest bucket, the sermons, is exactly where the public-domain
English selection is thinnest (§4.1).

## 3. The Summa: sources

### 3.1 Address space

`(part, question, article)` plus an internal division the citations actually
use: `obj n` / `sed contra` / `corpus` / `ad n`. Parts are I, I-II, II-II, III
**and the Supplementum** — `casti-connubii.en` cites `p. III Supplem 9, XLIX,
art. 3`, so the Supplement is in the address space whether or not we want it
there.

Two numbering conventions are live in our own corpus and a parser must accept
both: **EN uses Roman** (`STh I-II, 79, 1`), **PT uses Arabic**
(`Summa theologiae, 1-2, q. 79, a. 1`), and the PT edition appends the Leonine
volume/page (`: Ed. Leon. 7, 76-77`). The PT strings also carry the familiar
OCR damage — `11-II` for `II-II`, `a. l` and `a. I` for `a. 1` — the same
defect class `research/ccc-citation-defects.md` already catalogues.

### 3.2 Latin and English — available

- **English: the Fathers of the English Dominican Province translation**
  (Shapcote, 1920; Benziger 1947 revision) is public domain by age. CCEL
  offers the whole thing as a **single bulk zip** (`smt_html.zip`), and
  Project Gutenberg carries it as complete per-part ebooks (17611, 18755, …).
  Either avoids crawling entirely — a meaningful difference from every source
  this pipeline currently handles.
- **Latin: available, but pick carefully.** Corpus Thomisticum is the scholarly
  reference and states **"Iura omnia asservantur"** — all rights reserved,
  © Fundación Tomás de Aquino — with no re-use grant. The Aquinas Institute
  (`aquinas.cc`) publishes the Leonine Latin alongside Shapcote's English with
  a clean per-article URL grammar, confirmed live: `/la/en/~ST.I.Q1.A1`
  returns 200. Its licence was not established (§7).

### 3.3 Portuguese — blocked, and the free option is machine-translated

- **Alexandre Correia's translation** (the classic Brazilian one, 30 bilingual
  volumes, Faculdade Sedes Sapientiae 1944) is the text that circulates freely.
  Correia died **14 August 1984**, so under life+70 it enters the public domain
  in Brazil on **1 January 2055**. That is not the Matos Soares situation. The
  Bible exception was accepted as a "knowingly accepted, self-resolving
  exposure" (`copyright.md` §5) because it self-resolves in **2028**; a
  thirty-year clock resolves nothing.
- **Edições Loyola's translation** (2001–2006) is current and commercially in
  print.
- **`liriocatolico.com.br`'s free Portuguese Summa is AI-generated.** The site
  says so itself, on the page: the Latin is Leonine via the Aquinas Institute,
  the English is Shapcote, and _"a tradução em português do Brasil foi
  realizada diretamente a partir do latim, com apoio de inteligência
  artificial (Anthropic Opus 4.1)"_. It is disqualified outright — this corpus
  reproduces editions somebody published, with provenance, and a machine
  translation is neither.

  **Worth flagging beyond this survey:** liriocatolico is already the source of
  `bible.matos-soares.pt`. Its Matos Soares chapter pages carry **no** such
  disclosure (checked, Genesis 1), so the existing corpus is not implicated —
  but the site has started publishing AI-translated text, and its per-work
  provenance now has to be read every time, exactly the per-work-not-per-site
  lesson `intratext-2026-08.md` §5 already paid for once.

## 4. The Fathers: sources

### 4.1 English — public domain, but the coverage is a selection

Ante-Nicene Fathers and Nicene & Post-Nicene Fathers (Schaff, 1885–1900) are
public domain by age everywhere relevant, and are hosted by CCEL and New
Advent. They are the only realistic English base.

The catch is that **ANF/NPNF are anthologies, not complete works**. They cover
most of the top-12 authors well, and they do not cover: Maximus the Confessor,
Peter Chrysologus, John Damascene (partially), Faustus of Riez, Nicetas,
Symeon of Thessalonica, Epiphanius — a good share of the 34% tail. And within
covered authors the selection bites hardest exactly where our demand is
heaviest: Augustine's _Sermones_, our single largest bucket, appears in NPNF
only as a small selection out of 400+.

New Advent hosts the same translations behind **opaque four-digit ids**
(`/fathers/0618.htm`) and asserts its own copyright over the edition — the
same two objections (hand-built id map, no derivable addressing) that
`intratext-2026-08.md` §6 raised against IntraText.

### 4.2 Portuguese — nothing usable

The only substantial Portuguese patristic corpus is **Paulus's Coleção
Patrística** (75 volumes), commercially in print and fully under copyright.
There is no public-domain Portuguese patristic collection. This is a harder
blocker than the encyclicals' Portuguese gap: there, vatican.va simply has not
translated a document; here the translations exist, are modern, and are
somebody's business.

### 4.3 Latin and Greek — public domain, wrong format

Migne PL/PG is public domain by age, but exists as **page scans**
(archive.org, documentacatholicaomnia) rather than structured text.
Converting Migne into an addressable corpus is an OCR-and-collation project of
a different kind and size from anything this pipeline has done.

## 5. Fit with the existing architecture

**Neither fits `sections.json`.** The document schema addresses a **flat,
document-ordered sequence of numbered sections** (`corpus-schema.md`
§Documents). The Summa's address is three-level with a fifth internal division;
a patristic work's is `book.chapter.section`. Both need a new work type, not a
new `document_kind`. The Summa's nearest existing analogue is the Compendium's
Q&A shape, but the Compendium is one level deep and the Summa is three.

**The free QA oracle disappears.** `CLAUDE.md`'s cross-language symmetry check
— the thing that caught three parser bugs — needs two editions covering one
address space. An EN-only Summa and an EN-only patristic library have nothing
to check against. This is worse than the Latin problem `PLAN.md` #1 already
flags for `check_language_symmetry` (which cannot yet parse a non-`en|pt` work
id at all): there the question is _what_ the check should assert, here there is
no second edition to assert anything about.

**A copyright first: not Church-owned.** `copyright.md` §5's posture — host
verbatim without prior permission, comply if asked — was adopted as a
political statement about **Church-owned magisterial texts** (LEV/USCCB/CNBB).
Aquinas's Latin and the Fathers' Greek and Latin are public domain by eight
centuries; what is owned here is the **modern translation**, held by ordinary
commercial publishers (Loyola, Paulus). §4 of that document already draws
exactly this line for Bible translations, where "the 'free the word' political
argument does not transfer". It does not transfer here either. So the
Portuguese blockers in §3.3 and §4.2 are real blockers, not exposures to
accept.

## 6. Recommendation

**Do the citation parser first, and decide the rest afterwards.**

The stated goal is expanding citation coverage. Hosting the texts is one way to
serve it and the most expensive one, and it is not the first step even if both
ingests eventually happen.

**94% of the 1,244 patristic citations carry a work-internal locator** —
`St. Irenaeus, Adv. haeres. 3, 20, 2: PG 7/1, 944` names book 3, chapter 20,
section 2 quite apart from the Migne column. Only 6% are addressed by Migne
column alone. So the citations are already parseable into
`{author, work, locator}` from text captured months ago, with **zero fetches
and zero rights exposure**. That pass buys:

- a normalized author/work frequency index — the thing that would tell a later
  ingest which 40 works to do and which 250 to skip, replacing the guesswork
  this survey had to do with regexes;
- reverse "cited in" panels for Aquinas and the Fathers across the 175 works
  that already carry citations, the same derivation as `link-surface.md` #10;
- link-out targets (New Advent / CCEL) for the texts themselves — precisely the
  "degrade-to-link-out" pattern `copyright.md` §5 already names as
  architecture, and the pattern papalencyclicals.net uses for its own
  risk management;
- the same normalization that `link-surface.md` #12 needs for `LG 12` anyway.

Its hard part is real and should not be undersold: ~288 abbreviated titles in
two languages, with OCR damage, and no `abbreviations.json` to decode them
(itself still empty — `PLAN.md` #5).

**Then, if the appetite is there:**

- **Summa — worth doing, as Latin + English.** Small, closed, bulk-downloadable,
  no crawl. It requires accepting a work with no Portuguese edition for ~30
  years, as a documented exception rather than a silent gap, and a new
  three-level work type.
- **Fathers — do not ingest.** Link out. If it is ever revisited, revisit it as
  a targeted subset chosen by the parser's frequency table, not as "the
  Fathers"; and note that even a top-12-author subset leaves 44% of the
  citations unresolved, while the Portuguese half stays permanently empty.

### Sizing

All estimates, labelled as such — nothing here has been prototyped.

| item                            | sizing                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Citation parser (both families) | **Estimate: medium.** No fetches. The work is the abbreviation table and the two-language forms |
| Summa ingest, LA + EN           | **Estimate: medium.** ~2 sources, bulk download, but a new work type and a new reader route     |
| Summa, PT                       | **Blocked until 2055.** Not a sizing question                                                   |
| Patristic ingest, EN subset     | **Not sized, and deliberately so** — the number is a function of how many works are chosen      |
| Patristic ingest, PT            | **No source exists.** Not a sizing question                                                     |

## Honest gaps

- Family classification is **by regex over citation strings**, not by a real
  parser. The patristic count uses "carries a Migne `PL`/`PG` reference" as its
  discriminator, which is precise but **undercounts**: a patristic citation
  printed without a Migne column is invisible to it. The 1,244 is a floor.
- The author table leaves **34% unmatched** against a hand-built canonical list.
  Those are overwhelmingly minor authors, verified by sampling, but the
  cumulative-coverage percentages are therefore approximate.
- Summa targets were extracted with a regex that resolved 187 of 250 siglum
  occurrences; the 63 unresolved are Roman-numeral question numbers, the
  Supplement form, and OCR damage. So **92 distinct targets is a floor too**.
- **ANF/NPNF coverage was reasoned about, not measured.** §4.1's claim that the
  selection misses much of our tail follows from the collections' known
  contents, not from a title-by-title match against the 288 abbreviated titles.
  That match is exactly what the §6 parser would produce, and it should be run
  before anyone commits to a patristic subset.
- **CCEL's own terms were not established** — three candidate URLs 404 and the
  site is a JS app. The underlying Schaff translations are public domain by
  age regardless; what is unverified is whether CCEL asserts anything over its
  markup, which decides whether the bulk zip or archive.org scans is the right
  fetch target.
- **`aquinas.cc`'s licence was not established.** Its URL grammar was confirmed
  live; its rights statement was not read.
- The liriocatolico Matos Soares check covered **one chapter page** (Genesis 1).
  It is evidence that the Bible text carries no AI disclosure, not proof.
- Portuguese sources were surveyed by search, not exhaustively. A public-domain
  Portuguese patristic translation predating 1955 may exist in some archive; the
  claim in §4.2 is that no usable **corpus** exists, not that no page does.
