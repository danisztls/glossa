# A glossa for the prayers: where its text could come from

Survey conducted 2026-09-03 (read-only: the corpus already on disk, the raw
pages behind it, plus live checks on five external hosts — no capture, no
ingestion). Companion to `prayers.md` (the original prayers proposal),
`prayers-beyond-the-vatican.md` (the survey for the languages vatican.va does
not reach), `haydock.md` (the precedent: the corpus's first work that
_addresses_ another instead of containing it), and `copyright.md` for the
rights posture. `docs/corpus-schema.md` §Commentary is the shape.

**This exists because "a glossa for Prayers" was raised and immediately
parked** — the reason given was that it "would need sources". This is what a
day of looking found, so that the decision is taken against evidence and not
re-surveyed later.

## TL;DR

**The machinery is already built and does not need to change.** A commentary
is a work whose units carry a `lemma` and address another work; its notes are
placed inside the annotated text by searching for the quoted words in reading
order, with a cursor to disambiguate repeats (`commentary-anchors.ts`). That
was built for Haydock against a Bible verse. A prayer is a shorter unit with
the same properties, and since 2026-09-03 a prayer's printed lines are
addressable (`prayer-lines.ts`).

**The best source is already on disk, in eight languages, and costs no
fetches: the Catechism itself.** The CCC's fourth part is a phrase-by-phrase
commentary on the Our Father whose section headings _are the petitions_; its
¶2676–2677 is a commentary on the Hail Mary set as one gloss per clause of the
prayer; and its whole first part is the Apostles' Creed article by article.
Nothing needs to be sourced, translated or licensed that is not already here.

**Four of the twenty-eight prayers already have a commentary in the corpus
under a different address**, because they are Scripture: the Magnificat, the
Benedictus, the Our Father and the first half of the Hail Mary are glossed by
`commentary.haydock.en` at Luke 1, Matthew 6 and Luke 11 — with lemmas like
`Hail, full of grace` and `Hallowed` that quote the prayer's own words.

**Beyond the corpus, four public-domain works fit and are machine-readable**:
the Roman Catechism on Wikisource, Aquinas's three Lenten conferences, Britt's
notes on the Breviary hymns, and Liguori on the Salve Regina. They are ranked
in §3 by how much work each is, not by how good it is.

**Some prayers have no glossa and should get none.** The four Acts, Angel of
God and Eternal Rest are modern devotional formulas with no classical
commentary; the three Eastern-rite prayers have none in any language this
project reads. An apparatus that covers two thirds of a collection is a fact
about the sources; one that pads the rest is a fabrication.

**Two defects surfaced on the way, and both turned out to be ours** (§6): the
Portuguese Creeds were being collapsed into seven lines, and the English
Catechism was missing 60 of its subdivisions — including the seventh petition
of the Our Father, and the second of the Church's four marks.

## 1. What a source has to be, for this site to use it

Three properties, in order of how hard they are to satisfy:

- **It quotes the prayer.** `commentary-anchors.ts` places a note at the words
  it names. A commentary that discusses the Our Father without ever printing
  `hallowed be thy name` can only hang at the foot of the whole prayer, which
  is the `no headword` case Haydock already puts 40% of its notes in — usable,
  but not a glossa.
- **It is printed in reading order.** The cursor that resolves a repeated
  headword assumes a catena walks its text from start to end. A thematic essay
  does not.
- **It is in a language the reader is reading.** A commentary is offered
  beside its annotated edition and no other, which is what let the mark name
  the words instead of the verse. An English glossa on `prayer.common.pt`
  would have nothing to anchor to.

The third is what disqualifies most of §3 for most languages, and it is why
§2 is worth as much as it is.

## 2. Tier 0 — already on disk, no fetch, no new rights question

### 2.1 The Catechism on the Our Father: the headings are the petitions

`ccc.{lang}/structure.json`, Part Four Section Two. The English:

    [2777-2802] Article 2 "OUR FATHER WHO ART IN HEAVEN"
      [2777-2778] I. "We Dare To Say"
      [2779-2785] II. Abba - "Father!"
      [2786-2793] III. "Our" Father
      [2794-2796] IV. "Who Art in Heaven"
    [2803-2854] Article 3 THE SEVEN PETITIONS
      [2807-2815] I. "Hallowed be Thy Name"
      [2816-2821] II. "Thy Kingdom Come"
      [2822-2827] III. "Thy Will Be Done on Earth as It is in Heaven"
      [2828-2837] IV. "Give Us This Day Our Daily Bread"
      [2838-2845] V. "And Forgive Us Our Trespasses, as We Forgive…"
      [2846-2854] VI. "And Lead Us not into Temptation"

Every heading is a line of the prayer, in quotation marks, in the edition's
own language — so the anchor is a heading-to-line match and not a search.
Confirmed identical in shape in `pt`, `la` and `fr`; the Latin goes one better
and splits its fifth petition into two sub-headings at the comma
(`« Dimitte nobis debita nostra »` / `…« sicut et nos dimittimus »`).

The unit would be a section rather than a note: forty-odd paragraphs of the
Catechism hanging off nine lines of the prayer. That is a lot of text per
line, and it is the one design question this tier raises — see §5.

### 2.2 The Catechism on the Hail Mary: one gloss per clause, already written

¶2676–2677 is the closest thing in the corpus to a printed glossa. From
`raw/ccc-en/__P9F.HTM`, the source's own line breaks kept:

    2676 This twofold movement of prayer to Mary has found a privileged
    expression in the Ave Maria: <br>
    Hail Mary [or Rejoice, Mary]: the greeting of the angel Gabriel opens
    this prayer… <br>
    Full of grace, the Lord is with thee: These two phrases of the angel's
    greeting shed light on one another… <br>

Each `<br>`-separated run opens with the lemma and continues with the note.
That is the `{lemma, text}` pair the schema already has, requiring no
judgment about where a note begins.

**The lemma boundaries survive in `raw/` and not in `build/`.** CCC paragraph
blocks collapse `<br>` to spaces by the convention `docs/corpus-schema.md`
states for them, so `ccc.en/paragraphs.json` ¶2676 is one undifferentiated
run. This costs nothing — it is a re-parse, which is the insurance policy
`link-surface.md` names — but it does mean the tier-0 work is a parser and not
a query.

### 2.3 The Catechism on the Creed: twelve articles, twelve lines

`[199-421] Article 1 "I BELIEVE IN GOD THE FATHER ALMIGHTY, CREATOR OF HEAVEN
AND EARTH"` through `[1020-1065] Article 12 "I BELIEVE IN LIFE EVERLASTING"`.
The Apostles' Creed line by line, and the largest body of text in the tier by
a wide margin — Article 9 alone is ¶748–975.

This is the tier's limit rather than its promise: a "commentary" that hands a
reader 227 paragraphs for one line of a prayer is a cross-reference wearing a
glossa's clothes. What the Creed articles are genuinely good for is a link,
which `link-surface.md` already governs.

### 2.4 The Compendium: the same commentary, at a length that fits

`compendium.{lang}`, fourteen editions, and its Q&A on the Lord's Prayer is
one paragraph per petition rather than nine. Where the CCC is too long to sit
beside a line, the Compendium is the right size, and it reaches eight
languages the Catechism does not (`be hu id lt ro ru sl sv`, against the
Catechism's own `la` and `mg`). Both are already read by `pipeline/scrapers/ccc/`.

### 2.5 Haydock: four prayers are Scripture and are already glossed

`commentary.haydock.en` annotates `bible.douay-rheims.en`, and four of the
corpus's prayers are passages of it. Measured 2026-09-03 against the built
commentary:

| prayer            | address     | notes carrying a lemma that quotes the prayer                            |
| ----------------- | ----------- | ------------------------------------------------------------------------ |
| Our Father        | Matt 6:9–13 | `Hallowed`, `Our supersubstantial bread.`                                |
| Hail Mary (first) | Luke 1:28   | `Hail, full of grace`, `The Lord is with thee,`                          |
| Magnificat        | Luke 1:46–  | `In God my Saviour,`, `The humility of his handmaid,`                    |
| Benedictus        | Luke 1:68–  | `A powerful salvation.`, `To remember his holy covenant,`, `The Orient.` |

Haydock's note at Matt 6:13 is a textual one on the doxology — that the Greek
adds `for thine is the kingdom` and that it is absent from Tertullian, Cyprian
and Jerome. That is exactly the kind of remark a prayer reader has nowhere
else to get, and it is already in `build/`.

**It is English-only and edition-bound**, so it glosses `prayer.common.en` and
nothing else. That is the rule from §1 doing its job.

### 2.6 The Rosary, the Angelus and the Regina Caeli: the magisterium, ingested

Already in `build/`, found by listing the work ids: nine of Leo XIII's Rosary
encyclicals (`supremi-apostolatus-officio`, `octobri-mense`,
`magnae-dei-matris`, `laetitiae-sanctae`, `iucunda-semper-expectatione`,
`adiutricem`, `fidentem-piumque-animum`, `augustissimae-virginis-mariae`,
`diuturni-temporis`), Pius XII's `ingruentium-malorum`, and Paul VI's
`marialis-cultus` — whose §41 is on the Angelus and §§42–55 on the Rosary,
element by element.

This is not a glossa and should not be made into one: it is discursive, it
does not quote the prayer clause by clause, and it is already reachable at its
own address. It belongs in `link-surface.md`, not here. It is listed because
"the Rosary has no commentary source" would otherwise look true and is not.

**What is missing from the family is `Rosarium Virginis Mariae` (2002)**, John
Paul II's apostolic letter on the Rosary — the single most on-point document
for the corpus's longest prayer. It is an apostolic letter, and no such family
exists in `build/` yet, so it costs a family rather than a fetch.

## 3. Tier 1 — public domain, machine-readable, costs fetches

Ranked by how little has to be decided before capture.

### 3.1 The Roman Catechism (Trent, 1566) — the best external fit

**English on Wikisource**, in Donovan's translation, `The Catechism of the
Council of Trent`, already split into subpages per part and per petition
(`/Part_4:_Our_Father_who_art_in_heaven`). Wikisource states both the original
and the translation are public domain worldwide, author dead 100+ years.
Checked 2026-09-03.

Its Part IV is a commentary on the Lord's Prayer petition by petition and its
Part I on the Creed article by article — the same division the CCC makes, four
centuries earlier and at a length that fits beside a line. Wikisource is also
the only host in this section with a real API and a stable citation.

**What is not settled**: the Latin original, and whether Donovan (1829) or
McHugh–Callan (1923) is the edition to carry. Both are out of copyright; they
are different books to a reader.

### 3.2 Aquinas's three Lenten conferences — one per prayer, and that is rare

The 1273 Naples conferences are, by title, a commentary on three of this
corpus's prayers and nothing else:

| work                               | on             | Latin, Corpus Thomisticum  |
| ---------------------------------- | -------------- | -------------------------- |
| _In Symbolum Apostolorum_          | Apostles Creed | `csv.html`                 |
| _Expositio Salutationis angelicae_ | Hail Mary      | `cst.html`                 |
| _In orationem dominicam_           | Our Father     | `csu00.html`, `csu02.html` |

Checked 2026-09-03. `In Symbolum` is chunked by `Articulus`, each opening on
the Creed's own words (`Articulus 2 Et in Iesum Christum, Filium eius unicum,
Dominum nostrum`) — the anchor is free. The English at
`isidore.co/aquinas/english/PaterNoster.htm` is sectioned
`THE FIRST PETITION: "Hallowed Be Thy Name."`, the same shape in the other
language.

**Two things to know before capture.** First, the first article of
_In orationem dominicam_ does not survive in Thomas's own hand; Corpus
Thomisticum supplies it from Aldobrandinus of Toscanella's commentary and
files it separately (`xsu.html`) with an editor's note. That is a fact about
the work, and the manifest would have to say so. Second, Corpus Thomisticum
carries `© 2000-2019 Fundación Tomás de Aquino — Iura omnia asservantur`.

**That second point is already settled precedent, not a blocker.** `summa.la`
is sourced from the same site and its manifest says exactly the right thing:

> Latin text of St Thomas Aquinas (d. 1274); the Leonine edition (1888-1906)
> it follows is public domain by age. Electronic transcription by the Corpus
> Thomisticum, Fundacion Tomas de Aquino, which reserves rights over its own
> edition.

The English translations are the less certain half. Collins (1939) and
Shapcote (1937) are both within the window where a US renewal would matter,
and neither was checked. `isidore.co` prints no rights statement.

### 3.3 Britt, _The Hymns of the Breviary and Missal_ (1922) — for the hymns

Public domain, full text on archive.org. It gives each hymn's Latin, an
English verse translation, and a short note on authorship, date and
liturgical use. That covers the corpus's hymns — the Te Deum, Veni Creator
Spiritus, Veni Sancte Spiritus, Ave Maris Stella — which nothing in tier 0
touches at all.

**It is a headnote, not a glossa.** Britt annotates the hymn, not its lines,
so this anchors at the head of a prayer and never inside it. That may be the
right amount for a hymn.

### 3.4 Liguori, _The Glories of Mary_ (1750) — for the Salve Regina

Part I is, by its own table of contents, a set of discourses on the Salve
Regina clause by clause — the only phrase-by-phrase commentary found anywhere
on `hail-holy-queen`. Multiple public-domain English translations on
archive.org. It is also long and devotional in a way none of the above is;
whether it belongs beside the prayer or behind a link is a judgment nobody has
made yet.

### 3.5 What was looked at and set aside

- **The Fathers on the Lord's Prayer** — Tertullian's _De oratione_, Cyprian's
  _De dominica oratione_, Gregory of Nyssa's five homilies, Augustine's
  Sermons 56–59. All public domain in ANF/NPNF. `summa-and-fathers.md` §2
  already settled the shape of this problem: the Fathers are not one project
  but a library, and it declined the ingest for a much larger prize than this
  one. The same verdict holds a fortiori here.
- **The _Catena Aurea_ on Matthew 6** — a literal chain of Fathers on each
  phrase, Oxford translation of 1841, public domain. The most glossa-shaped
  text found in the whole survey. It addresses Scripture, not the prayer, so
  it belongs to whatever answers `haydock.md`'s question rather than this one.

## 4. What no source covers

| prayer                                                     | why nothing was found                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Act of Faith, Hope, Love, Contrition                       | modern catechetical formulas, varying by country                                 |
| Angel of God, Eternal Rest                                 | short devotional formulas; nothing commentaries them                             |
| Coptic Incense, Syro-Maronite Farewell, Byzantine Deceased | Eastern-rite, and no commentary in any language read                             |
| Sub Tuum Praesidium, Anima Christi, Memorare               | patristic/medieval scholarship exists; nothing PD and machine-readable was found |

Six of these are one to three lines long, which is most of why. **The honest
outcome is that a glossa reaches the Our Father, the Hail Mary, the two
Creeds, the Magnificat, the Benedictus, the hymns and the Salve Regina, and
stops.** Coverage should be printed, the way `prayer.common.en-gb`'s partial
edition already is.

## 5. The one thing that has to be decided first

**Whether a note addresses a LINE or a LEMMA.**

Haydock resolved this by having both: 54% of its notes anchor inside the verse
at their quoted words and the rest hang at the end of it. A prayer offers the
same two options and a third — since 2026-09-03 its printed lines are
numbered, so a note could name line 4 directly.

The line number is the tempting one and it is the wrong one. **A line number
is a property of an edition's typesetting, not of the prayer**, and this
survey turned up the proof while it was running: the Portuguese Apostles'
Creed was seven lines that morning and is twenty-two now (§6), with no change
to a single word of the text. A commentary keyed to the line numbers would
have moved with it. A commentary keyed to `Criador do Céu e da Terra` would
not have.

So: **lemma, with the line as a fallback**, which is what
`commentary-anchors.ts` already implements. Nothing new has to be designed.

## 6. Two defects this survey turned up

### 6.1 Ours, and fixed: the Portuguese Creeds were being collapsed

`build_creeds_pt` read one line per table ROW, on a comment asserting "each
table ROW is a printed line of the creed". The rows are not lines — the CCC's
`#table2` pairs the two Creeds _section_ for section so each stands level
beside its counterpart, and each cell holds several `<br>`-separated lines.
Collapsing them ran the Creed's clauses together with the semicolons as the
only surviving trace:

> padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à
> mansão dos mortos; ressuscitou ao terceiro dia; subiu aos Céus; …

Eight of the Apostles' Creed's semicolons and five of the Nicene's sat
mid-line for that reason. `line_html`'s own test decides which kind of `<br>`
these are, and the cells pass it more clearly than the Latin ones that already
ship as lines — median 25 characters and 82% clause-final for the Apostles'
Creed, 28 and 89% for the Nicene, against 22/80% and 23/71% in `ccc-la`'s
SYMBOLUM FIDEI table. Fixed 2026-09-03: 7 lines → 22, and 7 → 37.

**The neighbouring languages are NOT the same defect.** French prints both
Creeds as running prose with no `<br>` at all, and the Italian Apostles' Creed
likewise; those are the source, reproduced faithfully. Only Portuguese had a
table whose cells were being thrown away.

### 6.2 Theirs, and ours after all: the English CCC lost 60 subdivisions

`VII "BUT DELIVER US FROM EVIL"` is printed as an unmarked, unbolded `<p>`
inside `__PAC.HTM`, the file vatican.va's own index and breadcrumb file under
`VI. "And Lead Us not into Temptation"`. So the English structure ran VI from
¶2846 to ¶2854 and had no seventh petition at all, while `pt`, `la` and `fr`
all carried `VII` as a proper heading.

**That looked like the source's defect to reproduce, and it was ours.** The
heading is on the page; only vatican.va's navigation omits it, and the tree is
built from headings rather than from navigation. What dropped it was a
documented ceiling in `parse_page_en`: an unbolded roman-numeral heading was
refused because "`I.` et al. are too easily mistaken for ordinary prose
without the bold signal". That is true of Portuguese, which the rule was
written for, and it was inherited by the IntraText shell.

**Counting nodes whose title opens on a roman numeral is what turned a ceiling
into a defect:** es 272, fr 273, la 272, pt 272, mg 276, it 291 — against
**en 214 and de 213**. A one-sided gap of that shape is a parser defect by
this project's own rule (`CLAUDE.md`, "Work that spans languages").

Fixed 2026-09-03, en 214 → 274 and de 213 → 270, with three guards each
measured rather than assumed:

- **Length.** The bold signal is replaced by a 90-character cap. The fear the
  ceiling guarded against does not happen in these editions, and the reason is
  structural: IntraText numbers every body paragraph, so a body block opens on
  a _digit_ and a short block opening on a roman numeral is not prose.
- **Two characters before the period may be dropped.** English needs the
  period because `I` is its first-person pronoun and the book opens on it —
  making it optional outright admits `I BELIEVE` and `I am the LORD your God,
who brought you out of the land of Egypt`. No English word is two roman
  digits long, so requiring two leaves exactly the two headings that were
  missing: `VII "BUT DELIVER US FROM EVIL"` and `II THE CHURCH IS HOLY`.
- **The title must open on a capital, a quotation mark or an ellipsis.**
  French's pattern is period-optional, and without this the two cells of the
  Creed comparison table on `__P14.HTM` — `II ressuscita le troisième jour,`
  and `II a parlé par les prophètes.` — promote to subdivisions of Article 2.

**The second heading is the one worth remembering**, because nothing was
looking for it: `II THE CHURCH IS HOLY` was missing from ¶823–829, so the
English Catechism gave the Church three marks instead of four, silently, and
no reader of that edition alone could have noticed.

The titles keep the source's own missing period (`VII "BUT DELIVER US FROM
EVIL"`, not `VII.`), because that is what the page prints.
