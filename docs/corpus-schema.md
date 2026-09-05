# Corpus schema

The data contract between `pipeline/` (producers) and `site/` (consumer). This document is normative for v1; JSON Schema validation may follow. All JSON is UTF-8, 2-space indented, LF.

## Layout

```
glossa-corpus/               # a separate PRIVATE repository, sibling of this one
  raw/                       # cached raw fetches, one subdir per scraper (re-runs must be offline-capable)
    cpdv/ ...
    matos-soares/ ...
    vulgate1914/ ...
    ccc-en/ ...
  build/                     # parsed output, UNTRACKED — was works/ until 2026-08-27; rebuilt by pipeline/rebuild.py
    bible.cpdv.en/
      manifest.json
      books/gen.json … rev.json     # one file per book, lowercase OSIS code
    bible.matos-soares.pt/
      manifest.json
      books/…
    bible.clementina.la/
      manifest.json
      books/…
    commentary.haydock.en/
      manifest.json
      books/…                       # notes ADDRESSING bible.douay-rheims.en, no verses
    dore.tours/
      manifest.json                 # type "plates", language null
      plates.json                   # the 241 engravings; verse anchors from pipeline/dore-anchors.json
      images/…                      # AVIF ladder per plate
    ccc.en/
      manifest.json
      structure.json
      paragraphs.json
      abbreviations.json     # the CCC's own abbreviations table (LG = Lumen Gentium, …)
    ccc.pt/
      …
    compendium.en/
      manifest.json
      structure.json         # same node schema as the CCC structure tree
      questions.json
    compendium.pt/
      …
    prayer.common.en/
      manifest.json
      structure.json         # same node schema, grouping only -- see "Prayers" below
      prayers.json
    prayer.common.pt/
      …
    vatii.lumen-gentium.en/
      manifest.json
      structure.json
      sections.json
    vatii.lumen-gentium.pt/
      …
    encyclical.centesimus-annus.en/
      …
```

There is no `xrefs/` directory. Cross-reference indexes are DERIVED, not
stored — see "Cross-references" below.

## Work IDs

`{corpus}.{edition}.{lang}` for Bibles (`bible.cpdv.en`, `bible.matos-soares.pt`); `ccc.{lang}` for the Catechism; `compendium.{lang}` for the Compendium; `csdc.{lang}` for the Compendium of the Social Doctrine of the Church (one work, no edition axis — see its own section below for why it is not a `document`); `cic.{lang}` for the Code of Canon Law (same shape and the same reason); `prayer.{slug}.{lang}` for prayer collections (currently one: `prayer.common.{lang}`, combining the Compendium's Appendix A, the two Creeds and the Our Father, and — in the six languages the Holy Rosary micro-site publishes — the Litany of Loreto; see "Prayers" below; `{slug}` leaves room for a later, larger collection to ship as its own work rather than growing `common` without bound); `{family}.{slug}.{lang}` for documents (encyclicals, conciliar texts, curial documents) — e.g. `vatii.lumen-gentium.en`, `encyclical.centesimus-annus.pt`, `cdf.dominus-iesus.en`; `commentary.{slug}.{lang}` for a commentary on another work (`commentary.haydock.en` — see "Commentary" below).

## manifest.json (all works)

```jsonc
{
  "id": "bible.cpdv.en",
  "type": "bible", // "bible" | "bible-intro" | "catechism" | "compendium" | "prayer" | "summa" | "document" | "social-doctrine" | "canon-law" | "commentary" | "plates"
  "title": "Catholic Public Domain Version",
  "short_title": "CPDV",
  "language": "en", // BCP 47
  "edition": "2009, per errata of 2025-02-26 where stated",
  "sources": [
    {
      "url": "https://sacredbible.org/catholic/…",
      "retrieved_at": "2026-08-14",
    },
  ],
  "copyright": {
    "status": "public-domain", // "public-domain" | "copyrighted"
    "holder": null, // e.g. "Libreria Editrice Vaticana / USCCB"
    "notice": "…exact notice text to display, if any…",
  },
  "notes": "free text: edition diagnostics, known issues",
  "generated_at": "2026-08-14T12:00:00Z",
  // bible-only:
  "psalm_numbering": "vulgate", // per edition: "vulgate" | "hebrew" (bible.crampon.fr is hebrew; the rest Vulgate/Septuagint)
  "books": ["gen", "exod", "…"], // the 73 lowercase OSIS codes in this work's canonical order
  // commentary-only, and REQUIRED there:
  "annotates": "bible.douay-rheims.en", // the work whose addresses this one's units name
  // plates-only (dore.tours): "language" is null, and "credit" names the digitization source
}
```

## Bible book files — `books/{osis}.json`

```jsonc
{
  "osis": "john", // lowercase OSIS code, matches filename
  "name": "John", // display name in the work's language, e.g. "São João"
  "abbrevs": ["jn", "joh", "john"], // lowercase, for the jump box; include common local abbrevs
  "order": 50, // 1-based position in the 73-book canonical order
  "chapters": [
    {
      "n": 1,
      // Optional. What the source prints before the chapter's verses to say
      // what is in it — see "A chapter may carry a summary" below.
      "summary": "Christ's discourse with Nicodemus. John's testimony.",
      "verses": [{ "n": 1, "text": "In the beginning was the Word…" }],
    },
  ],
}
```

- `text` is plain text: no markup, no verse markers, no footnote markers, single spaces, no leading/trailing whitespace. Typographic quotes/dashes preserved as proper UTF-8.
- Verse-number gaps are allowed (critical-text omissions); never renumber. A verse present with empty text is invalid — omit it instead.
- If the source carries footnotes, capture them as `"notes"` on the verse and strip the markers from `text` regardless — see "An annotated edition" below for the full entry shape. (Matos Soares: liriocatolico chapter pages carry markers but not note content — strip markers, and note in the manifest that footnote content is a future enrichment via vulgata.online.)
- If the source prints section headings inside chapters (e.g. "Primeiro dia da criação"), capture them as `"headings": [{ "before_verse": 3, "level": 4, "text": "…" }]` on the chapter; omit the field when absent. A heading takes the same optional `text_marked`/`notes` a verse does, and for the same reason the CCC's structure nodes do (§"A heading can carry citations"): some sources anchor a footnote inside one.
- `level` is 1 (most prominent) to 4 (least): a part title, a section, a subsection, and the innermost line printed above a verse. **Several headings may share one `before_verse`** — the Matos Soares edition sets "PRIMEIRA PARTE", "I - CRIAÇÃO DO MUNDO" and "Principio." all before Genesis 1:1, and does so at 558 of its verse numbers. Emit them in level order so a consumer can take them in sequence. Where two headings of the SAME level precede one verse (13 times in that edition) the source gives no order between them and the response is unordered, so the order is the response's own and is not authoritative; keep both rather than choosing.
- **Headings are presentation; verse numbering is the structure.** A heading names the verse it precedes and is addressed by nothing — no reference ever resolves to one. Two consequences: the cross-language symmetry oracle compares verse-number sets and must never compare headings, and an edition dividing a chapter differently from another edition is not a disagreement about shape. This is also why `level` may be absent: an edition ingested before 2026-08-25 has none, and a renderer must have a default.

### A chapter may carry a summary

**Added 2026-08-24.** `summary` is optional and omitted when absent, per the rule `kind`/`attribution`/`label` already follow. It holds whatever the source prints ahead of a chapter's verses to say what the chapter contains — plain text, on the same terms as verse text.

**Named for what it is, not for what one edition calls it.** Challoner (and Knox, and Figueiredo) print what Bible typography calls the chapter's _argument_; the term is precise and almost entirely unread outside that trade, where it collides with two commoner senses. Editions that print one are common enough that this is edition-agnostic vocabulary rather than a Douay-Rheims field: `bible.douay-rheims.en` carries one on every chapter, and the other three editions carry none, which is exactly the shape an optional field is for.

**Not a heading.** A `headings` entry is a division _inside_ a chapter and is addressed by the verse it precedes; a summary belongs to the chapter as a whole and has no `before_verse`. Folding one into the other would make a renderer guess which it had.

### An annotated edition — `notes`, `text_marked`, and `lemma`

**Added 2026-08-24 with `bible.douay-rheims.en`,** the corpus's first edition whose apparatus is part of the work rather than absent from the source.

```jsonc
{
  "n": 19,
  "text": "And this is the judgment: Because the light is come into the world…",
  "text_marked": "And this is the judgment⟦1⟧: Because the light is come into the world…",
  "notes": [
    {
      "marker": "1",
      "lemma": "The judgment", // optional — see below
      "text": "That is, the cause of his condemnation.",
    },
  ],
}
```

- **`text_marked` is the same vocabulary the CCC, the Compendium and the prayers already use**, and deliberately not a second one: `⟦marker⟧` keeps each note's position in the sentence, `text` is that string with the tokens stripped, and the two must agree. Both are optional on a verse and appear together or not at all — a verse with no apparatus stores only `text`, so a stored `text_marked` always marks a verse that really carries one.
- **A marker is unique within its unit, not within the chapter.** This is the sharp edge. Sources number footnotes per verse and restart at 1: John 3 carries four notes and every one of them is marker `1`. Uniqueness is therefore scoped exactly as it is for a CCC paragraph — within the one `text_marked` the tokens appear in — and a consumer that builds a chapter-wide marker index will collide on the first annotated chapter it meets.
- **The marker is stored, not printed.** The site letters notes `a`, `b`, `c` down the chapter instead (`noteLetter` in `site/src/lib/sidenotes.svelte.ts`), because a reading column already carries a superscript number every few words and a second one meaning something else is a collision the reader has to learn their way around. That is presentation and belongs there; the corpus records the ordinal the source printed. It also disposes of the oddity above — John 3's four `1`s are read as a, b, c, d.
- **One note may be anchored twice in a unit, and a repeated token is not a defect.** The Matos Soares edition does it wherever a note glosses both limbs of a Hebrew parallelism: Deuteronomy 32:21 anchors note 1 at `com o que não é Deus` and again at `eu os provocarei`. Same shape the CCC has for a paragraph citing one footnote twice. What the rule above forbids is two _notes_ sharing a marker, not two _references_ to one note.
- **`lemma` is optional and holds the words the note glosses**, when the source's apparatus names them before glossing them. It exists because for this class of edition the distinction is carried by _emphasis_ — Challoner's notes open by quoting the lemma in italics — and the corpus's standing rule that inline emphasis is a v1 loss would, here alone, destroy meaning rather than flatten it: strip the italics and the reader must guess where the quotation ends. Promoting it to a field keeps the boundary without inventing a markup. Emphasis anywhere else in a note stays a v1 loss, recoverable from `raw/`.
- **The token is a point, the lemma is a range, and that is not a contradiction.** The token sits immediately after the last word the note refers to, which is where a printed edition sets its marker; a renderer wanting to underline the whole glossed phrase walks back from the token by exactly `lemma`.
- **Every token must have a note entry. A note need not have a token.** The asymmetry is real and is the one place this differs from the CCC's 1:1 rule: a transcription may carry a note whose anchor it never marks — 9 of the first 148 Douay-Rheims notes sampled, among them Jonas 1:2, where drbo.org marks the lemma in the verse and vulgata.online does not. Such a note is stored against the verse it names, with a marker but no token, and renders as a note on that verse. Dropping it to preserve a 1:1 invariant would discard the source to satisfy the schema.
- **A `lemma` that appears nowhere in its unit's `text` is a defect, and the validator says so.** It is the cheapest available check on an annotated edition, because the lemma is a quotation: the source printed those words twice, once in the verse and once at the head of the note, so a mismatch means one of the two is mistranscribed. It found `Nineve` for `Ninive` in Jonas 1:2 (`pipeline/corrections/bible.douay-rheims.en.json`) — a defect invisible to spellcheck, since both are plausible transliterations, and invisible to the token check, since that note has no token to disagree with. Reported rather than fatal: an edition may legitimately normalize a lemma's capitalization or elide it with "etc.".

## Book introductions — `bible-intro.{lang}/intros.json`

**Added 2026-08-23.** A short introduction per book, which the site addresses as **chapter 0** of that book (`/scriptura/gen/0`). `type: "bible-intro"`; work id `{corpus}.{lang}`, the `ccc.{lang}` shape rather than the Bible's `{corpus}.{edition}.{lang}`.

```jsonc
[{ "osis": "gen", "blocks": [{ "text": "This book is so called from…" }] }]
```

**Keyed by language, not by edition, and that is the whole design.** An introduction describes the _book_, not the translation, so the three editions of a language share one — writing it per edition would mean maintaining the same prose three times and again for every edition added later. It follows that chapter 0's existence is a **language** question: a reader on `bible.cpdv.en` has one, a reader on `bible.clementina.la` does not, and that asymmetry is served as an ordinary absent chapter rather than by falling back to another language's prose (see `site/src/routes/scriptura/[book]/[chapter]/+page.svelte`, which does fall back across editions for real chapters and deliberately does not here).

**Chapter 0 is navigable but never citable, and it stays out of `books/{osis}.json`.** Folding it into a Bible book's `chapters` would make it indistinguishable from scripture to everything that reads chapter numbers from there — `refs.ts`'s existence check (so `Gen 0` would begin resolving as a citation), the xref checker's `chapterVerses` map, `versification.ts`. The two registries are kept apart precisely so an introduction cannot become a citation target by accident; `site/scripts/sync-corpus.mjs` unions the 0 into `corpus-routes.json` only, which is addresses and nothing else.

Manifest carries `books` (OSIS codes with an introduction, canonical order) and `shared_preface_with` (`osis -> the book whose introduction covers it`) for sources that print one preface across two volumes.

- `blocks[].text` is plain text on the same terms as verse text above: markup dropped, emphasis a documented v1 loss recoverable from `raw/`.
- A book may legitimately have none. Challoner prints one preface for both volumes of Kings and both of Paralipomenon, so `bible-intro.en` covers 71 of 73 books, and `/scriptura/2kgs/0` is correctly not an address at all.

## Commentary — `commentary.{slug}.{lang}`

**Added 2026-09-01 with `commentary.haydock.en`,** the corpus's first work whose units
_address_ Scripture rather than containing it. `type: "commentary"`.

```jsonc
{
  "osis": "john",
  "order": 50,
  "chapters": [
    {
      "n": 1,
      "verses": [
        {
          "verse": 2,
          "notes": [
            {
              "lemma": "The same was in the beginning with God", // optional
              "text": "In the text is only, \"this was in the beginning;\" but the sense…",
              "attribution": "Witham", // optional — see below
            },
          ],
        },
      ],
    },
  ],
}
```

**A commentary has no address space of its own, and that is the definition rather than a
simplification.** Its every unit names a `{osis, chapter, verse}` of the work its manifest
`annotates`, so it is reachable at that verse's address and nowhere else — no
`Address.kind`, no route, no sitemap entry, nothing in `route-titles.json`. `bible-intro`
is the near precedent and stops one step short: an introduction is addressed as chapter 0,
which is an address, and a commentary note is not addressed at all. The manifest's
`annotates` field is what makes the reference resolvable, and it is required.

**`subsumes_notes` says the commentary already contains the annotated edition's own
apparatus.** Optional, and true for `commentary.haydock.en`: Haydock published Challoner's
text with Challoner's notes absorbed into the catena, so 1,399 of the Douay-Rheims's 1,916
notes appear again here (1,249 of them at ≥0.9 similarity on the same verse) and 1,300
paragraphs are signed "Challoner". It is a fact about the WORK and belongs to the corpus
for the same reason `annotates` does — the interface cannot measure it. What the site does
with it is turn one default around rather than suppress anything, because the overlap is
73% and not 100%: 517 of Challoner's notes are not in this capture. Absent means no claim,
which is the right default for a commentary written on a text nobody else annotated.

**Every `{osis, chapter, verse}` must exist in the annotated work.** A note naming a verse
that is not there addresses nothing and renders beside nothing, which is invisible on the
page — so it is the scraper's one fatal check, not a report.

**`attribution` is the field the work exists for.** A catena's value is that the tradition's
voices are _named_: about half of Haydock's paragraphs close with the authority the remark
is drawn from (Calmet, Worthington, Witham, Menochius, Berthier, Bristow, the Fathers
directly), and leaving that as the last word of a sentence would make it invisible to
everything but a reader. It is matched against a **closed vocabulary**, and a tail that is
not in it stays in `text` with the field absent — the same class-vs-instance discipline
`pipeline/overrides/README.md` states, and for the same reason: a rule that takes whatever
capitalised run ends a paragraph reads "Mauduit here represents the word:" as an author.
The stored value is the vocabulary's spelling, not the page's, because the source prints
"Calmet" and "Calmet." interchangeably.

**One note is one paragraph, and the source's own unit is the verse.** `HAY` ships exactly
one record per annotated verse, holding that verse's whole commentary as blank-line
separated paragraphs, and each paragraph is one authority's remark. Storing the record
whole would file fourteen thousand characters under a single attribution — Apocalypse 20:2
is one such record — so the paragraph is the unit and the verse is the key.

**A note may carry its own apparatus**, and it is the ordinary `Annotated` shape one level
down: `text_marked` with `⟦N⟧` tokens and a `notes` array of `{marker, text}`, on exactly
the terms §An annotated edition states. Haydock uses it for philological sub-notes — the
Greek and Latin behind a rendering. **The source numbers every one of them `1` and pairs
them by POSITION**, so the *n*th `_(#1)_` anchor in a record belongs to the *n*th
`__Notes:__` block appended after it; reading the digit as a marker collapses Apocalypse
20:2's sixteen sub-notes into one. They are renumbered per paragraph on the way out, so the
stored unit satisfies the schema's "unique within its unit" rule like any other.

**`lemma` is Challoner's convention, one work over.** A paragraph opens by quoting the
words it glosses, set in italics by the source, and it is promoted to a field for the reason
§An annotated edition already gives. The validator reports how many lemmas are found in the
verse they gloss but does **not** fail on a miss: Haydock quotes loosely where Challoner
quotes exactly — eliding with "&c.", modernising a spelling, quoting the Latin where the
verse prints English — so a mismatch is a lead rather than a verdict.

### Two unit spaces, named by `addresses`

**Added 2026-09-04 with `commentary.preces.{lang}`,** the Catechism and its Compendium
read as an apparatus to the prayers. A commentary's units still address another work and
still have no address of their own; what is new is that the unit may be a **prayer** and
not a verse. `addresses` says which, and it is **required on every commentary**:

| `addresses` | file                | a unit is                | manifest also carries      |
| ----------- | ------------------- | ------------------------ | -------------------------- |
| `bible`     | `books/{osis}.json` | `{osis, chapter, verse}` | `psalm_numbering`, `books` |
| `prayer`    | `prayers.json`      | a `Prayer.slug`          | `prayers`                  |

**It is written rather than derived from the annotated work's own type.** The site's sync
branches on it before it opens the work's directory, so deriving it would make the answer
depend on which manifest had been read yet — an ordering dependency standing in for a fact
that is simply true of the commentary.

**The prayer arm ships ONE file per work, unchunked**, where the Bible arm packs by size:
a commentary on Scripture varies by an order of magnitude per chapter, and this one is a
few tens of kilobytes per language. It is `prayer.common.*`'s own precedent, on the same
grounds.

```jsonc
[
  {
    "slug": "hail-mary",
    "notes": [
      {
        "lemma": "Full of grace, the Lord is with thee", // REQUIRED here — see below
        "text": "These two phrases of the angel's greeting shed light on one another…",
        "locus": { "work": "ccc", "n": 2676 },
      },
    ],
    "references": [
      {
        "work": "bible",
        "osis": "luke",
        "chapter": 1,
        "first": 28,
        "last": 28,
      },
      { "work": "ccc", "first": 2676, "last": 2677 },
      { "work": "compendium", "first": 562, "last": 563 },
    ],
  },
]
```

**A NOTE WITHOUT A LEMMA IS NOT STORED, and this arm is the one that says so** (2026-09-05).
`CommentaryNote.lemma` is optional in the schema and stays optional for Haydock, whose
unanchored notes hang at the end of the verse they belong to. A prayer has no such place
until its last line, and an apparatus at the foot of a seven-line text is a paragraph of the
Catechism reprinted beside the prayer rather than a gloss ON it — so `prayers_glossa.py`
keeps only the notes that quote a clause — a minority of what it reads, and the script prints
the table.

**`references` LEFT THIS WORK THE DAY AFTER IT ARRIVED, and where it went is the
point** (2026-09-05). What a book says about the prayer as a whole is a place to go and
read it, which is a different KIND of claim from a note — and, unlike a note, it is the
same claim for every reader. It is one language-free table now, `prayer-references/`
below. Nothing in a commentary work carries it, and an entry here is its notes and its
slug and nothing else.

**`locus` is provenance per NOTE, and it exists because one work draws on two books.**
A manifest names one set of sources; `commentary.preces.{lang}` reads the Catechism on the
Hail Mary and the Compendium on the Our Father, so a manifest-level attribution would tell
half its readers the wrong book. It is also the more useful half — the site renders it as
the note's label and links it to the paragraph — and it is stored typed rather than as the
string `CCC 2676`, because re-deriving a fact by parsing a string we wrote ourselves is how
a value comes to be regenerable only from a previous copy of itself. `attribution` is
untouched and remains the catena's closed vocabulary of authorities; a note carries one or
the other, never both.

**Here the lemma is DERIVED and every stored one is verbatim.** Haydock's headwords are
transcribed from italics and the validator only reports a miss; these sources mark their
lemma differently in every edition — italics inside guillemets, a colon and no markup,
nothing at all — so `prayers_glossa.py` takes instead the longest opening run of the note
that the annotated prayer prints verbatim. It cannot invent, and a note whose source
glosses a different wording is dropped rather than approximately placed. The French
Catechism glosses a `tu` Ave against an appendix that prints `vous`, so its `prie pour
nous` shortens to `Sainte Marie, Mère de Dieu` and the note that glosses only `Prie pour
nous, pauvres pécheurs` is not kept at all.

**THE STORED LEMMA AND THE PRINTED HEADWORD ARE NOT THE SAME LENGTH**, which is the trap
in deriving one. The lemma stops where the prayer stops agreeing; the source's headword
runs on to whatever the edition closes it with, and `text` must begin after THAT — cut at
the lemma instead, five editions opened a note on the tail of their own headword
(`toi " : Les deux paroles`, `[or Rejoice, Mary]: the greeting`). And **no two lemmas may
claim the same words**: CCC 2677 heads its two runs `Santa Maria, Mãe de Deus, rogai por
nós…` and `Rogai por nós, pecadores…`, so the first is cut back where the second begins.
The site anchors in one pass with a cursor, so an overlap costs the later note its place
silently — and English, which heads the same two runs `Holy Mary, Mother of God` and `Pray
for us sinners`, is the edition that hides it.

**Every unit named must exist in the annotated work**, exactly as for a verse, and for the
same reason: a note addressing nothing renders beside nothing, which is invisible on the
page.

**`default_on` is a commentary's own answer to which way its switch points** before the
reader touches it, and `commentary.preces.*` is the only work in the corpus that sets it.
The default is off, because a commentary is normally the largest thing in the corpus and
nobody opening a chapter asked for it (Haydock is 23 MB); this one is tens of kilobytes, is
the only apparatus a prayer page has, and reaches part of the collection rather than all of
it — so off meant a reader who never opened the panel never learned it existed. It is `subsumes_notes`'s
precedent exactly: a fact about the work, flipping a default and suppressing nothing.

## Canonical book order (73 books, lowercase OSIS)

OT (46): `gen exod lev num deut josh judg ruth 1sam 2sam 1kgs 2kgs 1chr 2chr ezra neh tob jdt esth 1macc 2macc job ps prov eccl song wis sir isa jer lam bar ezek dan hos joel amos obad jonah mic nah hab zeph hag zech mal`

NT (27): `matt mark luke john acts rom 1cor 2cor gal eph phil col 1thess 2thess 1tim 2tim titus phlm heb jas 1pet 2pet 1john 2john 3john jude rev`

Esther and Daniel include their deuterocanonical portions as the edition prints them (do not split into separate books). Baruch includes the Letter of Jeremiah as chapter 6 if the edition prints it so.

## Catechism — `structure.json`

The CCC hierarchy as a tree. Nodes:

```jsonc
{
  "kind": "part",                     // "prologue" | "part" | "section" | "chapter" | "article" | "sub" | "in-brief"
  "n": 1,                             // ordinal within parent, when the source numbers it
  "title": "The Profession of Faith",
  "paragraphs": [26, 1065],           // [first, last] unit numbers this node spans (inclusive) — see note below
  "children": [ … ],

  // Both omitted unless the source prints a footnote reference on the
  // heading itself — see "A heading can carry citations" below.
  "title_marked": "III. Christ Jesus — \"Mediator and Fullness of All Revelation\"⟦25⟧",
  "citations": [{ "marker": "25", "text": "DV 2." }],
}
```

**`site/src/lib/types.ts` carries one `kind` this list does not, and the
difference is deliberate.** `CccNodeKind` there also has `'title'` — the Code
of Canon Law's division — and **nothing ever reads it off a file**. The Code
does write `"kind": "title"` into its own `structure.json` (§The Code of Canon
Law below; it is the one work whose nodes carry the word the edition printed),
but that is a `DocumentNode.kind`, a free string on a flat array, and the tree
this list describes is not built from it: `buildDocumentOutline` stamps every
derived node `sub`, so the Code's titles reach the site's `StructureNode` as
`sub` nodes whose printed `label` says what they are. The union member exists
so the site's two shared label tables (`KIND_LABELS`, `LABEL_KIND_WORDS`) can
key a column on it instead of the Code keeping a private copy of both. It is a
name in the site's vocabulary, not a value a CCC-shaped `structure.json` may
carry — which is the same separation `DocumentNode.kind` already documents from
the other side.

**A heading can carry citations** (added 2026-08-23), and `title`/`title_marked`/`citations` are the same triple a paragraph has, for the same reason: the source prints a `<sup>` reference inside the heading, and the footnote it points at is content that has to live somewhere. `title` is always the plain form with no `⟦⟧` tokens in it, so every consumer that only wants to print a heading can keep reading `title` alone; `title_marked` keeps each reference where the source set it, and is present **only** when there is at least one. `citations` uses the identical entry shape as `paragraphs.json` (`marker`, `text`, optional `label`), and the same invariants are validated: every token has an entry, every entry has a token, and no token survives in `title`.

Rare, and expected to stay rare — two nodes in the whole corpus, both in `ccc.en`: `III. Christ Jesus — "Mediator and Fullness of All Revelation"` (footnote `DV 2.`) and `II. "I Know Whom I Have Believed"` (footnote `2 Tim 1:12`), each sourcing the phrase its heading quotes. The fields are optional precisely so the other 394 CCC nodes, and every node of every other work, carry no trace of the case.

**A consumer must not render a heading's citation as an interactive control inside a link.** Index and table-of-contents rows are links, so they print `title` and drop the apparatus; the reading views, where a heading is an actual heading, render `title_marked` with the marker as a disclosure the same way body prose does.

**`paragraphs` is generic unit-number-span vocabulary, not CCC-specific**, despite the name: it holds CCC paragraph numbers here, Compendium question numbers in `compendium.{lang}/structure.json`, and document section numbers in `{family}.{slug}.{lang}/structure.json`. The field keeps this one name across all work types rather than being renamed per type (e.g. to `sections` for documents) because the site's shared structure-tree walkers (`corpus.ts`'s `breadcrumbIn`/`flattenTree` over `StructureNode`) already operate on it across CCC and Compendium; a third name per work type would fork that code for no gain. Each work-type section below states what the span counts.

The tree must cover paragraphs 1–2865 with no gaps at the top level. "In Brief" blocks are nodes of kind `in-brief` under their article.

A node's span bounds may be `null` (amended 2026-08-14): a null bound marks **unnumbered content** the structure knows about but no paragraph number addresses (creed texts, Decalogue epigraphs, catechetical formulas). Consumers must treat non-finite bounds as unaddressable — render without a link, skip in breadcrumb resolution. (These nodes are also the future schema home for the currently-dropped epigraph text.)

## Catechism — `paragraphs.json`

Array ordered by `n`:

```jsonc
{
  "n": 1234,
  "blocks": [
    { "kind": "prose", "text_marked": "…prose with inline ⟦12⟧ markers…" },
    {
      "kind": "quote", // indented quotation (Scripture, Fathers, liturgy, prayer)
      "text_marked": "…the quotation, markers preserved…",
      "attribution": "St. Augustine, Conf. 1, 1", // only when the source sets one off; else omit
    },
  ],
  "text": "…derived: all blocks joined, markers stripped, spaces normalized…", // for search
  "in_brief": false,
  "citations": [{ "marker": "12", "text": "Jn 3:16" }], // verbatim footnote content, keyed by marker; a "label" marks one the source printed inline
  "related": [1094, 2179], // marginal cross-reference numbers: other CCC paragraphs on the same theme
  "notes": [], // any other footnote text
}
```

- **Block structure is preserved**: a CCC paragraph is a sequence of `blocks` — `prose` for running text, `quote` for the indented quotations the print edition sets in smaller type. Do not flatten quotes into prose. Line breaks inside a block collapse to single spaces.

- **`kind` is omitted when it is `prose`** (**amended 2026-08-22**, all work types). Absence means the default, the same rule `attribution`/`label` and structure.json's `label`/`subtitle`/`title_html` already follow, so every stored `kind` marks a real exception and `grep -c '\"kind\"'` is the census of them. The share that is not prose varies by work type and is what decides whether the field earns its place: 11% of CCC blocks, 4% of the Compendium's, 19% of prayer blocks (`versicle`/`response`) — but 6 blocks in 14,924 for documents, where `<blockquote>` is rare and, in the PT editions, sometimes used for indentation rather than quotation (see `pipeline/overrides/README.md`). Readers must test for the exception (`kind === 'quote'`), never for `'prose'`.
- **Inline reference positions are preserved**: `text_marked` keeps each footnote marker exactly where the source prints it, encoded as `⟦marker⟧` (e.g. `⟦12⟧`). Portuguese's archive sometimes types a Scripture locator directly in the prose where English uses a numbered footnote; the parser turns that locator into an `⟦inlineN⟧` token carrying `{ "label": "(Heb 11, 2. 39)" }` — the source's parenthesis verbatim, leading-space irregularities and all. **`label` is the discriminator**: a citation that has one is printed back where it stands, exactly as the source sets it, with links woven through; a citation without one is a numbered note and renders as a marker. The token exists to isolate the citation apparatus from the sentence around it (so the reference parser is handed a citation-shaped string, not running prose), not to convert it into a footnote. The raw source remains the authoritative original.
- Every `citations[].marker` appears exactly once across the paragraph's `text_marked` fields, and every `⟦⟧` token has a matching `citations` entry (validated). `text` = all blocks joined in order with ordinary markers stripped and an inline citation's source locator restored.
- Inline emphasis (italics for titles/Latin terms) is a **known, deliberate v1 loss** — recoverable later from `corpus/raw/` without re-crawling.
- Keep citation `text` **raw and verbatim** as printed in the source footnote — the phase-2 citation parser consumes it; do not normalize.
- `related` captures the CCC's **marginal reference apparatus**: the small paragraph numbers printed beside/inside each paragraph pointing to other paragraphs on the same theme. Capture them in printed order, deduplicated, each in 1–2865; empty array when a paragraph has none. These are NOT footnotes — do not mix them into `citations`, and strip them from `text`/`text_marked`.
- Cross-paragraph references inside the running prose ("cf. 1212") stay in `text`/`text_marked` as printed.
- Every edition must contain exactly paragraphs 1–2865; report (in `manifest.notes`) any source gaps rather than papering over them.

**Eight editions as of 2026-08-26** — `de`, `en`, `es`, `fr`, `it`, `la`, `mg`, `pt` — which is every language vatican.va publishes the Catechism in as HTML. The two it publishes only as PDF (Arabic, and Traditional Chinese, both split across part-files rather than one document) are captured in `raw/` and parsed by nothing. Three source mirrors are involved and the differences between them are edition facts worth stating before anyone reads an asymmetry as a defect:

- **Only five of the eight print a footnote apparatus.** English keys its notes to anchors, Italian and Latin to `<sup>` numbers with the notes at the foot of the page, Malagasy to Word's footnote export, Portuguese to bare `(N)` markers. French, German and Spanish print no notes at all: they fold every reference into the running text — French in parentheses (`(cf. CT 20-22 ; 25)`), German in square brackets (`[Vgl. DV 5.]`), Spanish in parentheses with a hyperlink where the referent is on vatican.va. Those three therefore store `citations: []` throughout, and their `text` is correspondingly longer than the same paragraph elsewhere. Lifting a parenthesis out of French prose would be inventing an apparatus the source does not have, and would remove words the source does print. `audit.py balance` normalizes each pair by its own median, which is what makes the comparison survive this.
- **`in_brief` is 81 divisions in every edition**, and getting there found two defects in editions that had been in the corpus for a week — see ../pipeline/docs/oracles.md.
- **`sub` density is a typographic fact, not a structural one.** The unnumbered run-in sub-headings ("The living God", "God is Truth") are bold in the Spanish, Malagasy, Italian and Latin mirrors and plain in the English and German ones. Where the source bolds them they are `sub` nodes; where it does not they are dropped as display matter and logged. So the same work has 2 unnumbered subs in `ccc.en` and several hundred in `ccc.es`. No paragraph text differs.
- **English prints two divisions as articles that the others print as subheadings** — `2746-2758` ("The prayer of the hour of Jesus") and `2855-2865` ("The final doxology") — which is why it has 67 articles against everyone else's 65. Read as printed; not a defect in either direction.

## Catechism — `abbreviations.json`

Each edition's own front-matter sigla table, verbatim and in source order:

```jsonc
[
  {
    "abbr": "LG",
    "expansion": "Lumen gentium",
    "kind": "general",
    "section": "LISTE DES SIGLES",
  },
  {
    "abbr": "Gn",
    "expansion": "Liber Genesis",
    "kind": "scripture",
    "section": "VETUS TESTAMENTUM",
  },
]
```

This is the decoder ring for `citations` strings ("LG 12", "DS 150", "CIC, can. 849"): a siglum's expansion, for the tooltip layer and for anything that has to know what an edition means by two letters.

**Populated for two of the eight editions, 2026-08-26; the other six are `[]` because their mirrors print no table.** English and Portuguese begin at the Prologue, which is why this file was empty everywhere from the first ingestion until the six new editions landed. French serves a table as `__P1.HTM` ("LISTE DES SIGLES", 58 entries) and Latin as `abbrev_lt.htm` (119); both were captured in `raw/` on 2026-08-26 and parsed the same day, no second crawl.

**Per-edition, not one shared table** — the open schema question this file used to carry, settled by reading the two sources rather than by argument, because they are not the same table:

- **French** lists magisterial documents and liturgical books: `AA Apostolicam actuositatem`, `CT Catechesi tradendae`, `DV Dei Verbum`, `OICA Ordo initiationis christianae adultorum`.
- **Latin** lists bibliographic series and editorial abbreviations — `PL`, `PG`, `CSEL`, `c` for _caput vel corpus_, `q` for _quaestio_ — and then all 73 Scripture books under its own two testament headings.

Their overlap is eight abbreviations, and on two of those eight the editions disagree about what the letters mean: `SC` is _Sacrosanctum concilium_ in French and _Sources chrétiennes_ in Latin, `CA` is _Centesimus annus_ against _Corpus apologetarum_. Each is right about its own edition — the Latin text's 118 `SC` references are volume-and-page ("SC 211, 392 (PG 7, 944)"), not conciliar sections — so no shared table could be built without overruling one edition about its own apparatus. `site/src/lib/refs-grammar.ts` had already reached the same conclusion for EN and PT from the citations alone.

**`abbr` is not a key.** The Latin table gives `Act` twice, as _Actio_ among the sigla and as _Actus Apostolorum_ among the New Testament books. Hence an array in source order, and hence `kind` — which is `"scripture" | "general"`, the only division either source itself draws. (This section previously proposed `"scripture" | "document"`; "document" would be a false claim about most of the Latin general list.) `section` keeps the source's own heading verbatim so a consumer can regroup without the pipeline having guessed a taxonomy.

Both tables carry misprints, corrected pre-parse under the `abbreviation_html` field with the usual locator/before/after/reason/evidence: Latin glosses `3 Io` as _Epistula II Ioannis_ (the row above it, verbatim) and misspells three expansions; French prints the siglum itself wrong twice, `GB` for Gravissimum educationis and `CJC` for a row whose own expansion reads _Codex Iuris Canonici_ — its own text uses `GE` and `CIC`, 3 and 138 times, and `GB`/`CJC` never.

## Compendium — `questions.json`

The Compendium of the CCC (2005) is Q&A-format: 598 numbered questions, each printed with a reference to the CCC paragraphs it condenses. Work IDs `compendium.{lang}`; manifest `type: "compendium"`. **Fourteen editions** — `de`, `en`, `es`, `fr`, `hu`, `it`, `pt`, `ro`, `sl`, `sv` parsed from HTML (2026-08-25, every language vatican.va publishes as HTML), and the four it publishes only as PDF (`be`, `id`, `lt`, `ru`) parsed by `ccc/compendium_pdf.py` since 2026-09-02. This was the first work with more than three editions, and the first to bring content languages the interface did not then have. Array ordered by `n`:

```jsonc
{
  "n": 1,
  "question": "What is the plan of God for man?",
  "answer_blocks": [{ "kind": "prose", "text": "…" }], // same block model as CCC (prose | quote, attribution?)
  "ccc_refs": "1-25", // RAW reference string as printed beside the question (e.g. "279-289, 296-298") — do not parse
}
```

- `ccc_refs` stays a **raw verbatim string** per the store-raw principle; the phase-2 parser expands ranges into links. Empty string if a question prints none.
- `structure.json` uses the same node schema as the CCC (parts/sections/chapters); the `paragraphs` field is the generic unit-number span described under "Catechism — `structure.json`" above and holds Compendium question numbers here, spanning questions 1–598 by number.
- **The division scheme is the same in every edition and is asserted against each**: four parts, eight sections, twenty chapters, in that printed order. The scraper checks the labelled headings it found are a _subsequence_ of that scheme — a heading the work does not have, or one out of order, fails the run; a heading an edition does not print is recorded in `manifest.notes`, because there is nothing to invent it from. Nine of the ten carry the whole scheme. That was recorded as three editions _omitting_ headings until 2026-08-25, and two of the three were not omissions at all: the Swedish edition heads Part Two's sections `sektionen` where its other six are `avdelningen`, and the Italian numbers one chapter `CAPITOLO I` where its other nineteen spell the ordinal out. Both were read once the vocabulary widened. The one still short — `es`, Part Four's first section — is printed too, inside the same paragraph as the part's own title, where the walk reads it as the part's trailing lines; that is a gap in this parser, not in the edition, and it is written down here so it is not filed as a source omission a third time. The unnumbered `sub` nodes beneath a chapter do vary widely and legitimately by edition — 42 in Romanian against 109 in Slovenian.
- The Compendium's Appendix A (common prayers, in Latin parallel) is parsed separately, from the same cached raw HTML, into `prayer.common.{lang}` — see "Prayers" below; **all fourteen editions are read, the four PDF-only ones included** — the appendix is set in two parallel columns on the page there, vernacular left and Latin right, and is read by geometry rather than by markup. **So is the Compendium's own BODY**, which prints the two Creeds at the head of Part One Section Two and the Our Father at the head of Part Four Section Two, vernacular beside Latin, in every edition. Appendix B (doctrinal formulas — virtues, precepts, capital sins, …) remains deferred: not prayers, out of scope for that work too; document its presence in `manifest.notes`.
- The print edition's sacred-art images and their commentary are out of scope for v1 (note their existence in `manifest.notes`).

## Prayers — `prayers.json`

> **THIS WORK IS CURATED, AND EVERYTHING BELOW DESCRIBES ITS FILE FORMAT
> RATHER THAN ITS PROVENANCE** (2026-09-04, `pipeline/docs/corpus.md`).
> `build/prayer.common.*` is no longer a parse. The corpus is
> `<corpus>/authored/prayers/*.json` — one file per prayer, the text as it
> should read in every language, with each editorial act recorded beside it —
> and `pipeline/scrapers/prayers_project.py` writes these work directories
> from it. `prayers.py` still reads every page, as the verifier
> (`--verify-curated`) that each curated line is findable in the witness it
> cites; 363 (language, prayer) pairs, 0 unexplained departures.
>
> Four statements in this section are superseded, and are kept because the
> reasoning that produced them is still the reasoning:
>
> - **The edition list is 20, not 16.** `hi`, `vi`, `zh` and `zht` come from
>   Vatican News, which publishes no Compendium; so do seven prayers the
>   Compendium's appendix does not print at all (St Michael, St Joseph, the
>   Holy Family, spiritual communion, the Divine Mercy chaplet, the
>   consecration to the Immaculate Heart, the prayer for the Pope). 477
>   prayers across 20 editions.
> - **`latin` is ONE canonical text, attached to every edition**, not each
>   page's own transcription of it. The appendix prints the Latin beside every
>   vernacular, so the corpus held fourteen transcriptions of one text with
>   their own misprints (`luz perpetua`, `Spirits Sancti`, `sieut locutus`).
>   Each curated file holds one Latin; `prayer.common.la` is emitted from that
>   same field, so the companion a German reader sees and the Latin edition a
>   Latin reader reads cannot disagree. Every witness's departure from it is
>   recorded per prayer in `latin_witnesses` — 122 of them.
> - **`prayer.common.la` is no longer "the English page's, every character of
>   it."** It is the canonical Latin of the curation, and it cites the two
>   witnesses it was reconciled from rather than the fifty-nine pages that
>   print some Latin.
> - **A block may carry VERSE STRUCTURE the page does not print.** The curated
>   files declare a `form` (`prose` / `clauses` / `verse` / `versicles` /
>   `petitions` / `groups`), and where that form is metrical the lines are
>   grouped into stanzas: the Veni Creator is seven quatrains in the projected
>   editions, where every vernacular page runs its 28 lines together and only
>   `prayer.common.la` divided them.

A prayer collection has no numbered units in its source at all — unlike CCC paragraphs, Compendium questions, or document sections, none of which this schema invents a number for. Work IDs `prayer.{slug}.{lang}`, where `{lang}` is a full BCP-47 tag and may carry a region — `prayer.common.{be,de,en,en-gb,es,fr,hu,id,it,la,lt,pt,ro,ru,sl,sv}` (currently one slug: `prayer.common.{lang}`, combining the Compendium of the CCC's Appendix A, the two Creeds and the Our Father, and the Litany of Loreto — but **not every edition has every part**, because the source families are not published in the same languages: see the symmetry bullet below); manifest `type: "prayer"`. Array ordered by `n`:

```jsonc
{
  "n": 1, // collection order — for ordering only, never addressing (see below)
  "slug": "sign-of-the-cross", // stable, language-invariant identifier — the actual address
  "title": "The Sign of the Cross",
  "kind": "simple", // "simple" | "dialogic" | "group" — derived from what was actually parsed, not asserted per prayer: "group" whenever `groups` is present, "dialogic" whenever any block is a versicle/response, "simple" otherwise. Can legitimately differ between a work's two language editions for the same slug (see below) — this is source-faithful, the same way structure trees are per-language (see "Language symmetry principle" in decisions.md).
  "blocks": [{ "kind": "prose", "text": "…", "html": "…<br />…" }], // "prose" | "versicle" | "response" | "petitions"; `html` only when the block prints on more than one line, see below
  "latin": { "title": "Signum Crucis", "blocks": [ … ] }, // optional — same block shape, absent wherever the source prints no Latin for this prayer
  "rubric": null, // free text the source attaches directly to the prayer (distinct from a per-group rubric, see `groups` below)
  "groups": [ // optional; present only on prayers structured as named groups of items rather than flowing text (the Rosary's four mystery groups)
    { "name": "The Joyful Mysteries", "rubric": "(recited Monday and Saturday)", "days": [1, 6], "source": "https://…/misteri_gaudiosi_en.html", "items": [{ "title": "First Joyful Mystery: The Annunciation", "meditation": "…Scripture text…", "citation": { "marker": "1", "text": "Lk 1:26-27" } }] },
  ],
  "instructions": { "title": "How to pray the Rosary?", "blocks": [ … ], "source": "https://…/misteri_gaudiosi_en.html" }, // optional; source-provided directions, currently the Rosary only
  "sources": [{ "url": "https://…", "retrieved_at": "2026-08-14" }], // where THIS prayer's own text came from — see below
}
```

- **`slug`, not `n`, is the address.** `n` is kept alongside solely as a collection-order integer, but it is never what a URL or a cross-reference points at. It preserves source print order within a sourced tranche; where `prayer.common` combines the three CCC texts with the Compendium appendix, it supplies the deliberately displayed order between tranches. `slug` is English-derived, kebab-case, and — like Bible OSIS codes and document family slugs — language-invariant: the same prayer carries the same slug in every language edition of the work.
- **Latin is BOTH a field and an edition, and the two are not redundant.** The `latin` field stays exactly where it is, on the vernacular array entry, because that is what the source prints — a bound companion to the vernacular text, on the same page, in the same table cell. `prayer.common.la` is _derived_ from those fields (see below); it does not replace them, and a reader comparing a prayer with the Latin printed beside it is looking at the field. This reverses the original ruling here, which was that Latin must be a field and _not_ an edition. Half of that argument had already expired — it turned on Latin not being an interface language, which it has been since 2026-08-24 — and the remaining half ("a `prayer.common.la` work would be an edition nobody printed") lost to a plainer fact: every other work in this corpus reaches a Latin-preferring reader as a work (`bible.clementina.la`, `summa.la`), and prayers were the one place where choosing Latin as the content language silently returned English, because `CONTENT_LANG_FALLBACK` had no `la` work to resolve to. See `site/docs/addresses.md`.
- **`prayer.common.la` — a derived edition with two witnesses.** Work ID `prayer.common.la`, `type: "prayer"`, ordinary `prayers.json`/`structure.json`/`manifest.json`, plus a `witnesses.json` this work alone carries. It holds **24 of 28**, from two kinds of source: the 21 the Compendium prints a Latin companion for, derived as below, and **the two Creeds and the Our Father read directly off the Catechism's own Latin edition** (`catechism_lt` — that is _latine_, not Lithuanian), from its SYMBOLUM FIDEI table and the text it prints at 2759. Those three are not derived from anything and take no part in the two-witness reconciliation, there being one witness to them; `witnesses.json` marks them `ccc-la`. The remaining 4 (the three Eastern prayers, the Litany of Loreto) have no Latin anywhere in the source and are simply absent — a property of the source, not a gap. The Latin is printed **twice** on vatican.va, once in each vernacular Compendium page, and the two transcriptions differ, so the edition is built by a stated rule rather than a merge:
  - **The text is the English page's, every character of it.** It carries one malformed character in the whole edition (`sæ´cula`, an `&aelig;&acute;` that never composed — now fixed in `pipeline/corrections/prayer.common.en.json`) against the Portuguese page's 14 grave-for-acute letters, and where the two disagree in _letters_ rather than orthography — the Rosary alone — it is both fuller (the Portuguese drops the _Mystéria luminósa_ heading) and better spelled (`Templo`/`Dominica`/`coniúncta` against `Tempio`/`Dorninica`/`coniúcta`). 20 of the 21 are word-identical once ligatures, stress accents and punctuation are folded away.
  - **The Portuguese witness contributes only where the breaks fall.** It prints _Veni Creator Spiritus_ as 7 stanzas and _Veni Sancte Spiritus_ as 9 where the English page runs each into one undivided block; the English text is re-cut at those boundaries and asserted to rejoin exactly. Nothing is reconciled character by character, and no word is emitted that neither page printed.
  - `witnesses.json` is the per-prayer audit trail — which witness supplied the text, which supplied the segmentation, and whether the two disagreed about anything but orthography.
  - **The slug-set oracle does not apply as written** and is narrowed here the way it already is for the Summa and the documents: this edition covers a strict subset by construction, so what is asserted instead is that the derivation lost nothing — every prayer with a Latin companion reached it, and every character still folds to what the English witness printed.

- **A prayer is set as VERSE, and `html` is where its lines live.** A block that the source prints on more than one line carries `html` beside `text`: the same words, with the printed line breaks kept as `<br />`, in the same narrow allowlist a document section's block uses. `text` keeps the collapsed single-space form, so search and every plain-text consumer are unaffected; a block that prints on one line has no `html` at all, so the field marks a real exception rather than restating `text` with markup around it. This corrects an earlier reading: the scraper collapsed these breaks on the convention stated above for CCC paragraph blocks ("line breaks inside a block collapse to single spaces"), which is right for the Catechism's running prose and wrong for a prayer. Measured over the source's whole prayer region: 895 `<br/>`-separated lines, **median length 28 characters, 73% ending on punctuation** — the Salve Regina, the Te Deum and the Veni Creator are verse and the source sets them as verse. Corrections apply to both fields or fail loudly (`_correct_lines`), since two of the ten on file name a phrase printed across a line break.
- **`petitions` is the litany's own block kind, and it stores the response ONCE.** A litany is invocations under a held response, and the source says so in bold: the Litany of Loreto prints `<b>pray for us.</b>` a single time and then fifty-two more invocations under it, and the Portuguese page bolds its response inline at the end of each line instead. A `petitions` block carries `response` (the held text) and `invocations` (`[{ text, response_printed? }]`), where `response_printed` marks the one invocation the source actually printed the response after — every other carries it by implication, which is what a litany IS. Repeating the response per invocation would be inventing text the page does not print. `text` and `html` stay alongside, holding the lines as printed, so every consumer that predates the kind is unaffected: the structure is additive. A lone invocation with its own response is an ordinary `versicle`/`response` pair (the three Agnus Dei lines, the closing couplet); a paragraph with no bold at all stays `prose` (the Kyrie, the closing collect). **This was nine undifferentiated prose blocks until 2026-09-02**, one of them a single paragraph holding the entire Marian run, because `flatten` strips every tag before anything can read it.
- **`versicle`/`response`** are block kinds beyond the CCC/Compendium's `prose`/`quote` pair, for dialogic (V./R.) prayers such as the Angelus. Each such block carries an additional `"label"` field holding the verbatim printed prefix (e.g. `"V."`, `"R."`, or — a source uses this too, for the same leader/assembly roles under different initials — `"D."`, `"C."`); the prefix is kept, not normalized to a canonical V./R., since it's exactly what's printed.
- **`variants` is gone; the UK/USA split is an EDITION boundary.** The source prints one English appendix in which five prayers appear twice, headed "UK VERSION" and "USA VERSION". That was a `variants` array — a concept used by five prayers in one language and by nothing else in this corpus — and it is now two works. They are **not peers**: `prayer.common.en` is the collection, all 28 prayers, printing the USA wording of the five; `prayer.common.en-gb` is those five prayers in the UK wording and **nothing else**, a regional edition rather than a second book. A reader who prefers English (UK) therefore reads five prayers from it and twenty-three from `prayer.common.en`, resolved per address the way the Summa's Supplementum reaches a Latin-preferring reader. The `variants` array survives only inside the scraper, as an intermediate no edition carries. An earlier shape gave both regions all 28 (`prayer.common.en-us` + `prayer.common.en-gb`, 23 entries byte-identical) and was retired the same day: the shared prayers are not two editions agreeing but one text printed once, and duplicating it put two rows reading as English in the reader's picker. Which wording is unmarked is an editorial choice (`BASE_VARIANT`), not an artifact of parse order. See `site/docs/addresses.md`.
- **A sparse edition indexes off its base, per address.** The site keeps two questions apart for this: which edition the collection's SHAPE comes from (its listing, section headings, order and prev/next chain) and which edition one prayer's TEXT comes from. They differ only under an English (UK) preference. Completeness is measured **within a base language**, which is what keeps `prayer.common.la` — 24 of 28 — indexing itself: the four prayers it lacks are absent from the source, whereas English (UK)'s missing 23 are printed once, under "English", by the edition it falls back to.
- **`groups`** is the one schema piece here that isn't a variant of `blocks`: a prayer whose source structure is fundamentally a list of named items (the Rosary's four mystery groups, each with a weekday rubric and five items) gets that structure captured directly rather than flattened into prose. Each Rosary item keeps its printed title and full Scripture meditation; its terminal source-printed locator is captured as a raw `citation` and rendered as the site’s inline footnote. The shared decade prayer is expressed once in the source-derived `instructions` rather than copied twenty times.
- **`instructions`** carries source-provided directions with their own title and ordinary prayer blocks. It is currently present only on the Rosary. Its first block is not a direction but the opening prayer itself (the sign of the cross, _Deus in adiutorium_, the Glory be) — the words said aloud, where the remaining four are the steps that follow. The site sets the two apart; the corpus stores them in the source's own order and does not mark the difference, because the source does not.
- **`days` is derived and then checked, not asserted** (added 2026-08-26). Each mystery group carries the ISO weekday numbers (1 = Monday … 7 = Sunday) its printed `rubric` names. The rubric stays verbatim and is what a reader sees; `days` is the form a reader's own weekday can be compared against without a consumer parsing prose. It matters that it is a corpus field: the rubric is in the CONTENT language ("(recited Monday and Saturday)", "(Segundas e Sábados)") and the reader may be in any of fourteen interface languages, so a client-side parse would reimplement a weekday vocabulary per language to recover something the scraper already knew. The scraper reads it out of the rubric with a stem table and then asserts the result against `CANONICAL_MYSTERY_DAYS` — Joyful Mon/Sat, Luminous Thu, Sorrowful Tue/Fri, Glorious Wed/Sun. Parsing and then checking, rather than just assigning the canonical answer, is what catches a parser mis-zipping four rubrics onto four groups: every rubric would still be present, only attached to the wrong set, and nothing else in the file would show it.
- **Provenance is per prayer, not per work** (added 2026-08-25). A prayer collection is the one work type assembled from many unrelated pages: the English manifest lists eight `sources` and cannot say which prayer came from which, so a consumer reading `manifest.sources[0]` — which is what the site's copyright notice did — attributed all 28 to the Compendium's Appendix A. Four are not from it (the two Creeds and the Our Father come from the Catechism's own pages, the Litany of Loreto from the Holy Rosary micro-site), and the Rosary is only partly from it. So each prayer carries its own **`sources`**, in the manifest's `{url, retrieved_at}` shape.
  - **The Rosary needs it at two further levels**, because it is the only entry assembled from more than one page. Its `blocks` — the title, the rubric, the concluding prayer — genuinely are the Compendium's appendix entry, and that is what its `sources` names. Its twenty mysteries and its directions are not: those come from four Holy Rosary micro-site pages, and they are the bulk of what a reader sees. Each `groups` entry therefore carries a **`source`** naming the page its five mysteries were parsed from, and `instructions` carries one too (the Joyful Mysteries page, where the directions are printed once for all four). The site prints the prayer's own source under the title and each section's beside the section, so the whole page is checkable rather than just its top.
  - Both fields are optional and both are derived from the same constants the manifest's list is built from; `prayers.py`'s `check_source_coverage` asserts in both directions that no prayer claims a page the manifest does not declare and that no declared page goes unclaimed — the second is what a fifth Rosary page would trip.
- **The two Creeds and the Our Father come from the Compendium's OWN BODY in eight editions, and from the Catechism in three** (2026-09-03). Every Compendium prints all three at the head of Part One Section Two and Part Four Section Two, vernacular beside Latin — the same file Appendix A is already read from, so `de es fr hu it ro sl sv` gained them for no fetch and every edition of this work now carries the four prayers a Catholic is expected to know by heart. `en`, `pt` and `la` are unchanged and still read theirs from their own Catechism. Three things are worth stating because they are not obvious from the output:
  - **The printed Latin is the anchor, the classifier and the check, and it is not stored.** `Symbolum` and `Pater noster` are set in Latin script in every edition, so the region is found the same way in all of them without a table of vernacular headings; every block is then scored against `ccc-la`'s own text to decide whether it is Latin or vernacular. That matters because **the four blocks are not in one order** — German, Italian, Romanian and Slovenian interleave each Creed with its Latin, while English, French, Spanish and Hungarian print both vernaculars and then both Latins. Reading the vernacular as "the run before the Latin heading" files the Nicene Creed under `apostles-creed` in half the editions and reports nothing.
  - **`prayer.common.la` does not move.** The Compendium's Latin is a second transcription of what the Catechism already publishes, carrying its own misprints, so storing seven more copies of it would publish noise in the shape of a variant. `NO_LATIN_SLUGS` is unchanged and these three still have no `latin` companion outside Spanish, whose appendix prints its own.
  - **The comparison is a report and not a gate**, printed on every run. It separates a received variant from a misprint by how many editions share it: nine agree on `sedet ad dexteram Dei Patris` where `ccc-la` prints no `Dei`, and five on `quotidianum` against `cotidianum`. What one edition holds alone is a slip — `caeeli` and `Credo in unum Deum` on the Apostles' Creed (hu), `Víirgine` (en, it, one shared exemplar), `proper` (es), `MaríaVírgine` (fr), `et in incarnatus` (ro), `sedit` (sv). None is in the reader's text, all are in `raw/`.
- **Four editions are read out of a PDF, and the printed Latin is what makes that safe** (2026-09-03). vatican.va publishes the Compendium in fourteen languages and serves ten as HTML; Byelorussian, Indonesian, Lithuanian and Russian exist only as a PDF made by the national bishops' conference that translated each. Their Appendix A is the same twenty-four prayers set in two parallel columns — the vernacular left, the Latin right, each prayer opening with a heading on one baseline in both — so `prayer.common.{be,id,lt,ru}` are full editions of 27 prayers (24 for the Indonesian), and none of them cost a fetch. What is worth stating about the reading:
  - **The Latin column is the anchor, the bound and the check, and none of the three reads a word of the vernacular.** The prayers are located by their Latin titles, taken off `prayer.common.en`'s own Latin column rather than retyped; the columns being set in parallel, where a prayer's Latin stops its vernacular stops; and every extracted Latin word is folded against the English appendix's and the differences printed.
  - **The Indonesian prints neither the Rosary's concluding prayer nor any of the three Eastern-rite prayers**, which is the same statement Swedish and Slovenian already make about the same three, and is why that edition is 24 rather than 27.
  - **The Belarusian PRINTS a Latin column and publishes none of it.** Its accents are set as separate positioned glyphs over base letters the embedded fonts do not map, and both PDF readers fail at it in different, irrecoverable ways; word for word against the English appendix that column scores 84.9%, where the other three score 99.5%, 99.2% and 95.1%. The manifest says so. This is a limit of the FILE, distinct from the source printing no Latin at all — which is what the three Eastern-rite prayers do, in every edition — and the corpus keeps the two apart because a reader has to be able to tell "not printed" from "not readable". The same texts are published whole as `prayer.common.la`.
  - **The report is printed, never gated**, like the one for the Compendium's body above, and it is read by SHAPE: the Lithuanian's six departures in 1,359 words are each a single letter (`quelli` for `quem`, `sieut` for `sicut`), which says a reader misread a glyph; the Russian's are whole words (`genitrix` for `genetrix`, `solatium` for `solacium`), which says the edition did.
- **Cross-language symmetry is now PER EDITION against its own sources, not between two collections.** The rule used to read "the two vernacular collections' `slug` sets must match exactly", which was true while there were two and is false with ten: the collections are 28, 27, 26, 25, 24 and 21 entries long, and every one of those numbers is a fact about a mirror. Slovenian prints no Eastern-rite prayers and gives three Acts in Latin only; Swedish omits two of the three; Hungarian heads its Veni Sancte Spiritus and prints no text under it; Spanish prints a 25th appendix entry, its own Our Father; four mirrors have no Litany because the Holy Rosary micro-site publishes six languages and no more. So what is asserted is that each edition carries **exactly the slugs its own declared sources can produce, in the source's print order** (`LangSpec.expected_slugs`), which still catches a parser dropping or duplicating an entry — the thing the old rule was really for. What remains genuinely cross-edition is that a slug two editions BOTH carry has text in both. The old rule survives only in spirit — this is a real check, not a tautology, even when a scraper assigns slugs positionally from one shared list, because it still catches a parser producing the wrong count or order of entries in either language. `kind` and whether `latin` is present may legitimately differ per language for the same slug (the source itself typesets the same prayer differently across its two pages); only the address space itself — the slug set — is required to agree.
- `structure.json` reuses the generic node schema purely for grouping (a lightweight table of contents), not addressing: `paragraphs` is `[null, null]` throughout, the same allowance already documented for Creed/Decalogue-style unnumbered content under "Catechism — `structure.json`" above.

## Prayer references — `prayer-references/references.json`

**NOT A WORK, AND THAT IS THE WHOLE OF ITS DESIGN** (2026-09-05). Where else the corpus
speaks of a prayer — the Gospel its words are printed as, the Catechism article that
expounds it, the Compendium question that names it — is a fact about the PRAYER. It does
not change with the edition in front of the reader, so it is not `{type}.{slug}.{lang}`
and has no `manifest.json`: it is a directory under `build/` beside
`gcatholic-calendar/`, written by `prayers_glossa.py` and declared as that stage's second
output. The site's sync names it in `NON_WORK_DIRS` and copies it whole into the index
tier (~2 KB).

It rode `commentary.preces.{lang}` for one day and the shape was wrong in two ways at
once: the same table was written fifteen times, and it was absent from the five
collections that have no Catechism and no Compendium — so a reader of the Hindi or
Vietnamese prayers saw nothing under any prayer at all, for a claim their language has no
bearing on.

```jsonc
{
  "hail-mary": [
    { "work": "bible", "osis": "luke", "chapter": 1, "first": 28, "last": 28 },
    { "work": "bible", "osis": "luke", "chapter": 1, "first": 42, "last": 42 },
    { "work": "ccc", "first": 2676, "last": 2677 },
    { "work": "compendium", "first": 562, "last": 563 },
  ],
}
```

- **Each is a range** (`first`/`last`, plus `osis`/`chapter` where the work is the Bible,
  where they are VERSE numbers), because that is how the sources divide: `CCC 2759–2865`
  is one article, and where a prayer's words are drawn from two separate verses those are
  two references rather than one span across everything between them.
- **The addresses are edition-free**, which is what lets one table serve every language:
  `/catechismus/2676` and `/scriptura/luke/1#v28` open whichever edition the reader
  already has (`site/docs/addresses.md`).
- **Every number is checked against every edition that could hold it**, and a miss is
  fatal (`check_references`). Asked of one language it would pass on the strength of the
  one complete edition; asked of all of them it is a check of the claim. A Bible that
  does not print the chapter abstains — that edition cannot answer — but no edition may
  print the chapter and lack the verse, and at least one must print it.
- **The rule of admission is that the passage speaks of THIS prayer**: by naming it, by
  quoting it, or by being the article that expounds it. A passage on the same SUBJECT is
  not one, which is why prayers the Catechism never names carry nothing.
- **Which prayers are Scripture is swept for, not remembered** — every prayer against
  every verse of every Bible, 30 comparable characters verbatim
  (`prayers_glossa.py --scripture`). `docs/research/prayers-glossa.md` §2.7 has what it
  added and what it refused.

## Compendium of the Social Doctrine of the Church — `csdc.{lang}`

Ingested 2026-09-02. 583 numbered paragraphs, 1,232 footnotes, two printed sigla tables, in **ten of the twelve editions vatican.va publishes as HTML** — `en`, `es`, `fr`, `hu`, `it`, `pl`, `pt`, `sq`, `sw`, `vi`. Manifest `type: "social-doctrine"`, `document_kind: "compendium-social-doctrine"`, `pontiff_or_council: "Pontifical Council for Justice and Peace"`.

**Its content files are a DOCUMENT's and its addresses are the Catechism's**, and that split is the whole of why it is a work type of its own rather than a `document`. The source is a vatican.va document page and `vatican_docs.parse_document` reads it, so the work carries `structure.json` (the flat `{level, title, before}` array documented under §Documents), `sections.json` (`{n, blocks:[{html}], citations}`) and `appendix.json` in exactly the document shapes. But the work is cited by paragraph — "CSDC 160" names a paragraph the way "CCC 1731" does, not a position inside an encyclical — so each of its 583 paragraphs is an address of its own at `/doctrina-socialis/{n}`, and its divisions are `/doctrina-socialis/caput/{n}`. Everything that decides where a unit LIVES branches on the type; everything that decides how it READS reuses the document's.

`abbreviations.json`: the same shape the Catechism's carries (§Catechism — `abbreviations.json`), from the two tables the edition prints in its own front matter. Six editions print them — 95 rows in English (22 general, 73 Scripture), 103 French, 104 Italian, 73 Polish, 72 Hungarian, 19 Vietnamese — and four print none, which is `[]`. **`kind` is `"scripture"` only where the site's book table for that language corroborates it**, and `"general"` otherwise with the run saying so: Hungarian prints no general table at all and splits Scripture into `Ószövetség` and `Újszövetség`, so no rule over a table's POSITION can classify it, and a wrong `kind` on 45 rows is a claim about someone else's book.

`appendix.json` carries the edition's FRONT matter, in source order: Cardinal Sodano's letter of transmittal and Cardinal Martino's presentation. **The letter's own paragraph numbers are kept as text**, because the appendix has no `n` to put them in and the edition prints them. The back-of-book index of references is deliberately not here — it is a concordance keyed to this work's own paragraph numbers (`1:26-27 26, 36, 428`), so storing it as unnumbered prose gives a reader a wall of digits and the corpus nothing it can resolve, and what was captured was 19 KB of the English edition's ~195 KB anyway, stopping mid-block after Revelation 21:3. It is to be parsed as references; until that parser exists it is written nowhere.

**`epigraph` is a section-level field, and only this work has one.** The source opens each of its three parts with a quotation from _Centesimus Annus_, printed between `PART TWO` and `CHAPTER FIVE` and belonging to neither: `parse_document` reads it as prose buffered under a heading and gives it back to the section that heading interrupted, so §19, §208 and §520 each ended with the NEXT part's epigraph as their last sentence. `csdc.lift_part_epigraphs` moves it onto the section the part OPENS at (§20, §209, §521) as `epigraph: [{ html }]`, the same block shape as `blocks`. It lands on the section rather than on a structure node because half the editions have no part row to hang it on — `csdc.fr` emits none at all, and `csdc.sw` read two of its own epigraphs as headings, which is why that edition has one and not three.

`manifest.header` is the title page — the Council's name, the work's title, the dedication to John Paul II — as narrowed html, exactly as a document's is.

**Two editions are fetched and deliberately not written**, and the distinction between them is the one this schema keeps everywhere else:

- **`id` is the source's answer.** vatican.va publishes only this edition's table of contents and front matter: the page strips to 22,573 characters against the English edition's 846,980, carries every heading of all twelve chapters, and carries none of the 583 paragraphs. Nothing a re-crawl would find.
- **`nl` is ours.** The Dutch page is a Word export that keeps its footnotes in `<div id="ftnN">` blocks interleaved through the document and numbered per group rather than per document — `<div id="ftn1210">` holds the anchor `_ftn128`, and so do eleven other groups. Body and notes cannot be split at one offset (cutting at the first group yields 19 of 583 sections), and pooling the notes would resolve most citations to the WRONG note, which is worse than resolving none because a reader cannot see that a footnote is the wrong footnote. Left unwritten until the parser can read a per-group apparatus.

Both are named in `csdc.WITHHELD` with the measurement that put them there, and the five PDF-only editions (`be`, `el`, `lv`, `uk`, `zh`) are recorded in every manifest's `translations` as `pdf-only`, so an absent language column is never bare absence.

**Nine markers in three editions resolve to no note, and eight paragraphs in three editions have no address.** Both are tabled in `csdc.py` (`KNOWN_DANGLING`, `KNOWN_GAPS`) with the reason read off the page, and anything not in those tables fails the run. The gaps are all one source defect — the edition never closes the previous paragraph, so two numbered paragraphs share one `<p>`, and the second one's TEXT is stored under the first one's number rather than lost. Hungarian's five "dangling" markers are not dangling at all: that edition prints its real markers as bare digits glued to the preceding word, which nothing can read safely, and the five the parser does find are a quotation's own enumerated conditions.

## Code of Canon Law — `cic.{lang}`

Ingested 2026-09-03. 1,752 canons in the **seven languages vatican.va publishes the Code in as HTML** — `de`, `en`, `es`, `fr`, `it`, `la`, `ru`. Manifest `type: "canon-law"`, `document_kind: "code-of-canon-law"`, `pontiff_or_council: "John Paul II"`, `promulgated: "1983-01-25"`.

**Its content files are a DOCUMENT's and its addresses are the Catechism's**, which is `csdc.{lang}`'s arrangement exactly and for the same reason: "CIC can. 748 §2" names a canon the way "CCC 1731" names a paragraph. So the work carries `structure.json` (the flat `{level, title, before}` array) and `sections.json` (`{n, blocks:[{html}], citations}`) in the document shapes, and each of its 1,752 canons is an address of its own. A canon's `blocks` are the paragraphs the source prints inside it — its `§§`, and the enumerated items inside those — in source order.

**`citations` is `[]` in every unit of every edition, and is written all the same.** The Code prints no footnote apparatus anywhere: not one marker in seven editions. The field is an empty fact about this work rather than a missing one, and a consumer that reads a document's units should not have to branch on this one.

**`superseded` is a section-level field, and only this work has one.** Three editions print, after the text in force, the wording a later act replaced — under a bracketed line naming the act (`[Litterae Apostolicae Motu Proprio Datae "Authenticum charismatis" quibus can. 579 … mutatur]`, `[Earlier version]`, `[Redacción original del canon modificado por …]`) — and mark the amended canon in the body with a superscript `n`. It is an array of `{ title, blocks }`, the same block shape as `blocks`:

```jsonc
{
  "n": 579,
  "blocks": [
    {
      "html": "Episcopi dioecesani, in suo quisque territorio, instituta vitae consecratae formali decreto valide erigere possunt, praevia licentia Sedis Apostolicae scripto data.",
    },
  ],
  "citations": [],
  "superseded": [
    {
      "title": "[Litterae Apostolicae Motu Proprio Datae \"Authenticum charismatis\" quibus can. 579 Codicis Iuris Canonici mutatur, die I mensis Novembris, anno Domini MMXX]",
      "blocks": [
        {
          "html": "Episcopi dioecesani, in suo quisque territorio, instituta vitae consecrate formali decreto erigere possunt, dummodo Sedes Apostolica consulta fuerit.]",
        },
      ],
    },
  ],
}
```

**It rides on the canon rather than in the numbered flow because it is not an address.** A reader who asks for canon 579 is owed the law in force; the wording _Authenticum charismatis_ replaced is what that canon used to say, and it belongs beside the canon, never instead of it. The edition's own legend for the mark goes to `manifest.notes`, once — the source reprints it on every page that carries an amendment, and eleven copies of one sentence is not front matter.

**Book VI is the text in force, not the 1983 one, and the manifest says so.** _Pascite Gregem Dei_ replaced canons 1311–1399 whole with effect from 8 December 2021, and these pages carry the replacement — English canon 1311 has the §2 on pastoral charity the revision introduced, canon 1398 is the new delict against the dignity of the person, and the 1983 canon on abortion has moved to 1397 §2. The `cic_lib6_*.pdf` beside each edition is the same revised book in another format. Every manifest records the range and the date, because a citation to a Book VI canon written before then may name a different provision.

**`structure.json` carries a `kind` per node, and this work is the only one that does.** It is the division word the edition printed — `book`, `part`, `section`, `title`, `chapter`, `article` — from `cic.DIVISION_NOUNS`, a table of what each word is in each language. A document's `kind` was dropped in 2026-08-21 because it forced the scraper to judge what a heading MEANT from how it was painted, which the sources do not encode; the Code prints the word, so here it is read rather than judged. The consumer is the site: a reading page is a run of canons under one TITLE, and picking those by level number would be reading a per-edition compaction where the source printed a noun.

`appendix.json` carries the front matter where an edition prints any — the English edition's INTRODUCTION with its own sigla table, and the constitution _Sacrae disciplinae leges_. Written only where there is one; four editions print the Code and nothing else.

**Two canons are absent, each from one edition, and both are the source's omission** (`cic.KNOWN_GAPS`): `cic.de` has no 1330 (its page for 1321–1330 prints 1321–1329 under a heading naming the full range) and `cic.es` no 1482 (its page runs 1481 straight into 1483). Neither is supplied from another edition — a defect with no known correct value in its own edition gets documented, not invented — and the site's content-language chain is what a reader falls through.

The **Portuguese and Belarusian editions exist and are PDF-only**; both are fetched into `raw/` and parsed by nothing, and both are recorded in every manifest's `translations` as `pdf-only`. The Portuguese one is worth naming: the claim that no Portuguese edition exists on vatican.va is what kept this work out of scope until now, and it was never true.

## Summa Theologiae — `summa.{lang}`

Added 2026-08-23 (`decisions.md`; sourcing survey in `research/summa-and-fathers.md`). Work IDs `summa.en`, `summa.la`; manifest `type: "summa"`. Two editions from two different hosts — CCEL's ThML for the English Dominican Province translation, the Corpus Thomisticum for the Leonine-based Latin — joined by ADDRESS, which is safe here in a way it would not be for a Bible: an article's address is the work's own structure, not an editorial decision either site made.

**The two editions do not cover the same parts, permanently.** `summa.en` has all five (I, I-II, II-II, III, Suppl); `summa.la` has four, because the Corpus Thomisticum publishes no Supplementum — it is a posthumous compilation from the _Scriptum super Sententiis_, not Aquinas's own text for this work. **There is no Portuguese edition and will not be before 2055** (Alexandre Correia died in 1984; Loyola's translation is in print). Both facts are source-level realities to design around, not gaps to fill, and the site handles them with a stated fallback chain — the reader's language, then English, then Latin (`site/src/lib/corpus.ts`, `CONTENT_LANG_FALLBACK`), resolved **per address** so a citation to the Supplement reaches English even for a Latin-preferring reader.

```jsonc
// manifest.json — the shared fields, plus:
{
  "type": "summa",
  "parts": ["I", "I-II", "II-II", "III", "Suppl"], // what THIS edition carries
  "question_count": 611,
  "article_count": 3113,
  "corrections_applied": 2,
}
```

`structure.json`: FLAT and document-ordered, like the documents' and for the same reason (`../pipeline/docs/corpus.md` — "record the observable thing; derive the rest"), with one extra field:

```jsonc
[{ "level": 1, "part": "I", "title": "FIRST PART", "before": 1 }]
```

- `part` is what the documents' node does not need: **question numbering restarts at 1 in every part**, so `before` alone does not identify a position in the work. Every consumer that takes a question number must take a part with it.
- `before` is the question number the heading precedes; ranges are derived, never stored. `null` marks trailing matter.
- The Latin edition's structure is **the four parts and nothing else**. The Corpus Thomisticum prints no treatise groupings and no question titles — only address-titled paragraphs — so attaching the English edition's treatise names to it would assert that this source says something it does not.

`questions.json`: array ordered by part, then `n`.

```jsonc
{
  "part": "II-II",
  "n": 184,
  "title": "Of the state of perfection in general", // "" in summa.la, which prints none
  "prologue": [{ "html": "…" }],                    // the question's own preamble
  "articles": [
    {
      "n": 3,
      "title": "Whether perfection consists in the observance of the counsels?",
      "divisions": [
        { "kind": "objection", "n": 1, "blocks": [{ "html": "…" }] },
        { "kind": "sed-contra", "blocks": [{ "html": "…" }] },
        { "kind": "corpus", "blocks": [{ "html": "…" }] },
        { "kind": "reply", "n": 1, "blocks": [{ "html": "…" }] },
      ],
    },
  ],
  // Optional, and its PRESENCE is the signal — see below.
  "divisions": [ … ],
}
```

- **`divisions` are an address space, not a rendering hint.** This corpus's own footnotes cite `co.` (the body) and `ad 3` (the third reply) as locators — `S. Th. I-II, q. 79, a. 1, ad 2` is an ordinary citation in the Portuguese Catechism — so the six kinds (`preamble` | `objection` | `sed-contra` | `corpus` | `reply` | `postscript`) are stored as structure rather than flattened into prose. `n` is present on an objection or a reply and absent on the body and the _sed contra_; it is also absent on the `ad arg.` form, a reply that answers the objections together, where inventing an ordinal would make it look like `ad 1`.
- **`kind` is always written here**, unlike every other work type (see the "omitted when prose" rule above). There is no default division: each of the five is a real, citable exception, so absence would mean nothing.
- **`preamble` and `postscript` are not Aquinas's** and are deliberately outside the citable set. Both exist so that the edition's own editorial matter is neither dropped nor mis-filed as part of the argument — the alternative the parser first produced put an editorial gloss exactly where a citation would land. `preamble` holds prose the English edition prints before the first objection, a translator's bracketed note on the 2 articles that have it. `postscript` (added 2026-08-25) holds matter printed after the last reply, which in this edition is one 5,150-character editorial essay on the Immaculate Conception at III q. 26 a. 2 — until then stored as the continuation of `ad 3`, where a citation to `ad 3` would have landed on it. Exactly one article carries one. Both render under the same neutral "Note" label; the reader is told the same thing either way, and the position on the page says the rest. The parser opens a `postscript` on the edition's own convention for an inserted heading — full capitals, no terminal punctuation — which five paragraphs in the English Summa answer to, four of them the next question's heading that `split_question_region` already cuts on.
- **A question may carry `divisions` of its own**, and then has no articles. I q. 71 and I q. 72 are article-less in _both_ sources — their objections, body and replies hang off the question itself. The field is absent rather than empty everywhere else, so its presence is the discriminator. No `a. 1` is invented for them: that would mint an address neither source uses and no citation can name, in the one place where the work's own address space is what everything else is built on.
- Blocks store **`html` and nothing derived from it**, the documents' amended shape (2026-08-22). The allowlist is the documents' five (`i`, `b`, `br`, `sup`, `blockquote`) **plus `<a data-ref="…">`, added 2026-08-24 and so far used only here**. In practice the English carries no inline emphasis at all — all 26,599 of its `<b>` elements are division markers, consumed by the parser — and the Latin uses only `<i>`.
- **`<a data-ref>` carries a cross-reference the SOURCE stated, not one we found.** CCEL marks every one of the Summa's self-citations with an anchor naming its exact target (`<a href="#FP_Q74_A2">`), and 5,180 of them survive into the corpus as `<a data-ref="summa:{part}:{question}[:{article}]">`. The attribute is a corpus address, never a URL: routing belongs to the site, and this file is the record of what the source says.

  This is the one place the corpus stores a reference instead of leaving it to be linkified out of prose, and the reason is that **this work's citations are not parseable in isolation**. The visible text is `Q[74], A[2]`, `(A[3])`, `Q[3], AA[1]`, `Q[76] , A[2]` — each meaningful only relative to the part and question printing it, and none of it a notation any other source uses. `link-surface.md`'s "regex-linkifiable any time from flat text; nothing lost" is true of the scripture references in the same prose and false of these, which is what earns the exception. The square brackets in that text are literally what a discarded anchor leaves behind; an earlier version of the scraper dropped these links and kept their words, and the brackets are how it showed.

  An anchor whose target this parser cannot resolve to a real address (`#APN_Q1_A1`, 2 of them — `AP` is not a part of the Summa) keeps its words and loses its markup, the same rule any unknown tag gets. The finest anchor CCEL offers is the **article**, which is also the finest address this corpus has, so nothing is lost by following it; a trailing `, ad 2` sits outside the anchor in the source and stays prose.

  The Latin edition carries none of this: Corpus Thomisticum's pages link only to other pages, never into the text.

- **No `citations` field.** Neither source carries a footnote apparatus: Aquinas cites in the body prose ("as Augustine says (De Trin. viii)"), and that is left verbatim where it stands. The reader linkifies scripture out of the prose itself (7,582 references in the English edition), which is `link-surface.md`'s "regex-linkifiable any time from flat text; nothing lost". The Summa's citations of _itself_ are the exception, and are stored — see `<a data-ref>` above for why they are the one kind that flat text cannot recover.

### Validation

The cross-language oracle applies here, narrowed: it runs over **the parts both editions carry**, and the Supplement is excluded by construction rather than by name. It is worth having — the two editions are independently derived from sites sharing no text, and they agree on 119 questions and 582 articles in the Prima Pars — and it earned its keep immediately by finding three articles whose body the English omits and the Latin has. It **reports and never fails**: every difference found so far has been the edition speaking, not the parser.

Per-edition invariants are what fail a run: question numbers inside their part's declared range, article numbers a clean sequence, divisions in printed order, no empty block, every `ad n` matching an `arg. n` _or_ reported as answering an unnumbered objection (the English folds objections the Latin numbers), and no bodiless article beyond the handful the editions genuinely print that way — an individual one is the edition, but more than 1% of them is a broken division matcher, which is the failure the check exists to catch.

## Documents (encyclicals, conciliar texts, curial documents)

v2, scoped 2026-08-15 — see `decisions.md` §Scope for what's in/out and why, and `research/vatican-documents.md` for the underlying survey (citation-frequency tables, per-pontificate EN/PT coverage audit, numbering tests — cited by locator below, not restated here). Covers Vatican II's 16 constitutions/decrees/declarations, papal encyclicals, apostolic exhortations, and CDF/DDF declarations — one schema shape for all of them, since every family sampled shares the same numbering/citation/quotation structure (`vatican-documents.md` §3). **The First Vatican Council joined on 2026-09-02 and is the one family that does not share that structure**: neither of its two constitutions has a document-wide numbering, and `Dei Filius` numbers only its canons, restarting at 1 in each of four canon groups. The schema shape held; the WALK did not, and `walk_vatican_i` is why (`pipeline/CLAUDE.md`).

Work IDs: `{family}.{slug}.{lang}`, where `{family}` is `vati` | `vatii` | `encyclical` | `exhortation` | `cdf` (distinguishes publishing pipeline and future per-family styling without forking the schema). Examples: `vatii.lumen-gentium.en`, `encyclical.centesimus-annus.pt`, `exhortation.amoris-laetitia.pt`, `cdf.libertatis-conscientia.la`.

**`cdf.*` slugs are ASSIGNED, not read off the source filename** (2026-09-03, `decisions.md` §Scope). Every other family here is filed under its document's incipit, so the slug and the title are the same fact; this one names its files after the subject — `freedom-liberation` is _Libertatis Conscientia_ — so `vatican_docs.CDF_DOCUMENTS` maps `(promulgation date, source slug)` to the corpus slug, the kind and the title. The slug is the Latin incipit where the document has one and an English description where it has none (`catholics-in-political-life`), because Latin is what this corpus addresses a document by. A document slug is unique across all five families: `getDocumentGroup` keys on the slug alone.

`manifest.json`: same shape as the Catechism/Compendium manifest, `"type": "document"`, plus document-only fields:

```jsonc
{
  "id": "vatii.lumen-gentium.en",
  "type": "document",
  // ...bible-manifest-shared fields (title, language, edition, sources, copyright, notes, generated_at)...
  // document-only:
  "document_kind": "conciliar-constitution", // "conciliar-constitution" | "conciliar-decree" | "conciliar-declaration" | "encyclical" | "apostolic-exhortation" | "apostolic-constitution" | "cdf-declaration" | "cdf-instruction" | "cdf-letter" | "cdf-doctrinal-note" | "cdf-responsum" | "cdf-considerations" | …
  "pontiff_or_council": "Second Vatican Council", // e.g. "John Paul II", "Second Vatican Council", "Congregation for the Doctrine of the Faith"
  // ^ for `cdf.*` this follows the PROMULGATION DATE, not the family: Praedicate
  //   Evangelium (2022-06-05) turned the Congregation into the Dicastery, and a 1975
  //   declaration is the Congregation's while a 2025 note is the Dicastery's. The
  //   documents were not retitled, so the field is what says which.
  "promulgated": "1964-11-21", // the document's own date, distinct from sources[].retrieved_at
  "translations": {
    // optional; present only when a sibling-language edition is known and NOT written as its own work — never present alongside a real sibling work, which is provenance enough on its own
    "pt": {
      "status": "stub-page", // "stub-page" | "pdf-only" | "no-url" | "not-found" | "fetch-failed"
      "checked_at": "2026-08-16", // when this status was established, not necessarily today
      "note": "…", // optional, freeform; used e.g. to record that a retry reproduced the same result
    },
  },
}
```

Absence of a sibling-language work (e.g. no `encyclical.rerum-novarum.pt` directory) is expected and common — coverage collapses for older pontificates (`vatican-documents.md` §2) — but bare absence on disk is provenance-free: it can't be told apart from "never checked" without re-crawling. `translations` on the surviving work closes that gap, recorded once the absent language's status is established, from whichever of these it turns out to be (checked from cache, no network needed once the crawl has already visited the URL once):

- `"stub-page"`: a URL was fetched (200) but its content region carried no real translation, only vatican.va's page shell (see the scraper's `StubPageError`) — confirmed live to be the dominant case for pre-1960s Portuguese encyclical URLs, and measured on 2026-08-29 as the dominant case full stop: 613 of the 619 raw document pages that produced no work are this, across nine languages, German (181), French (143) and Spanish (135) ahead of Portuguese. `pipeline/scrapers/record_translations.py` is what reads them off cache and writes them down.
- `"pdf-only"`: the edition exists and vatican.va publishes it in a format nothing here reads, so the absence is **ours rather than the source's** — the one status that does not mean the edition is absent. Two shapes, and they are found two different ways. On the modern shell the URL 200s, its content region is a shell exactly as above, and the page's own link to the text in **that language** is a PDF under `/content/dam/`; the language suffix on the href is what makes it evidence, since every page links its siblings' PDFs too, and the mirror's own codes apply, so Latin arrives as `_lt`. On the Vatican II archive mirror the INDEX links the PDF directly, which is how seventeen editions went unrecorded until 2026-09-02 (Traditional Chinese for all sixteen documents, under a path sharing nothing with the rest of the mirror — `/chinese/concilio/vat-ii_{slug}_zh-t.pdf` — plus Hebrew for _Dei Verbum_, whose Nostra Aetate counterpart is HTML and was captured, so Hebrew looked complete). `discover_vatii` reads them off the index and `parse_and_write` records them on every edition of the same document it CAN read, so a PDF the Holy See replaces with HTML is picked up by the next crawl rather than by somebody noticing.
- `"no-url"`: no URL for that language could even be derived/discovered (distinct from a URL existing and failing).
- `"not-found"`: a derived URL was attempted and consistently returned HTTP 404 across a full retry cycle (3 attempts with backoff) — a measured, repeatable absence, not a guess. Confirmed live for 10 Pius XI/XII-era documents: the original crawl recorded them as failed, and an explicit post-sweep retry (once concurrent crawling was no longer a politeness concern) reproduced the same 404 on every one of 10/10, with none resolving — i.e. the earlier failure was never transient flakiness for these, it was vatican.va correctly reporting "no such page."
- `"fetch-failed"`: a URL was derived and a fetch was attempted but never resolved to a definite answer (connection/timeout error, not a clean 404) — genuinely transient network flakiness (the survey's ~1-in-6–8 Azure edge rate), worth a retry on a future crawl, unlike `"not-found"`.

Never fabricated or inferred without evidence: each status is derived from what's actually on disk or from a direct, logged HTTP response (an absent raw-cache file, a cached-but-stub one, or a reproduced 404), the same "auditable from cache/evidence" posture as everything else in this pipeline.

**Two fix layers, and they are not the same** (`../pipeline/docs/corrections.md`). `pipeline/corrections/` claims the _source_ is wrong and edits the fetched HTML before parsing; `pipeline/overrides/` claims the source is fine and our _derivation_ is not, and edits `structure.json`/`sections.json` after parsing. Keeping them apart is what lets `corpus/raw/` remain the record of what the source actually said. A work with overrides gets an `overrides-applied.json` receipt, written only when there are any; the layer ships empty on purpose, and the bar for filing an entry is that the defect belongs to one document rather than to a class of them. See `pipeline/overrides/README.md`.

`structure.json` **(amended 2026-08-21, documents only — see `decisions.md`)**: a FLAT, document-ordered array of `{ level, title, before }`, plus the optional `label` and `subtitle` added 2026-08-22 (`label` was called `ident` until 2026-08-25). It no longer reuses the CCC/Compendium node schema, and `kind`/`n`/`paragraphs`/`children` are gone.

```jsonc
[
  { "level": 1, "title": "PART I", "before": 11 },
  {
    "level": 2,
    "title": "CHAPTER I THE DIGNITY OF THE HUMAN PERSON",
    "before": 12,
  },
  {
    "level": 1,
    "label": "CHAPTER THREE",
    "title": "TECHNOLOGY AND DOMINANCE.",
    "subtitle": "THE GRANDEUR OF HUMANITY IN LIGHT OF THE PROMISES OF AI",
    "before": 90,
  },
]
```

- `level` is the heading's **observed depth**, 1-based and contiguous per document. It is not a taxonomy: the old `kind` forced the scraper to judge whether a heading _meant_ "chapter" or "section", which the sources do not reliably encode, and that judgement is what put chapters inside sections in Gaudium et Spes. Levels are assigned by walking the document — a heading directly following another with no section between is its subtitle and sits one level under it; a heading whose styling was seen before keeps the level it was first given, so siblings stay siblings; otherwise the global rank applies but never descends more than one level at a time — and are then compacted to contiguous `1..N`. Labelled headings (PART/CHAPTER/SECTION/ARTICLE) outrank unlabelled ones, because styling alone inverts: vatican.va wraps Gaudium et Spes's chapters in `<center>` while printing `PART I` as an ordinary left-aligned paragraph. **Amended 2026-08-21**: all of that is inference from how a heading is painted, and it is overridden outright on the three pages that print a linked table of contents (`magnifica-humanitas` in both languages, `divini-redemptoris.pt`) — there the levels come from the TOC's own indentation and emphasis, and blocks the style rules missed but the TOC names are promoted to headings. A TOC states the outline instead of implying it; see `decisions.md`.
- `before` is the section number the heading precedes — its anchor. `null` means trailing matter the numbered flow never reaches. **Ranges are derived, not stored**: a heading owns sections from its anchor until the next heading of equal or shallower level. Nearly every structural defect found in the 2026-08 description pass was a stored span drifting from the text (680 `[null, null]` nodes, `CHAPTER II` at `[53,53]`, `SECTION 2` overreaching into two other chapters). Nothing stored is nothing to drift.
- `label` and `subtitle` are **optional and omitted when absent**, so the ordinary one-line heading stays a three-key object. They exist because vatican.va prints a division's label, its name and sometimes a second title line as _separate paragraphs_ — three blocks, one heading. Kept as three nodes they became three table-of-contents rows all anchored to the same section, deriving the same range, so a position-tracking TOC highlighted three rows at once. `label` is the bare label line above the title (`CHAPTER THREE`, `PRIMEIRA PARTE`); `subtitle` is whatever further lines belong to the same heading. They are stored apart from `title` rather than folded into it because they are different things — the label names the division's place in a sequence, the title names its subject — and a renderer wants them typeset apart. The scraper merges only when the first line is a **bare** label and never absorbs more than one following line without the page's own TOC vouching for it; see `merge_heading_lines`.
- `title_html` is optional and present only where the source set emphasis on PART of a heading — 275 nodes. The emphasis wrapping a whole heading is the scraper's own detection signal (`is_full_bold` IS the heading detector), so storing it would say nothing; what this keeps is an encyclical name inside a heading (`THE MESSAGE OF <i>POPULORUM PROGRESSIO</i>`), a scripture reference (`QUEM ME VÊ, VÊ O PAI (CF. <i>JO</i> 14, 9)`), or a Latin phrase (`The <i>res novae</i> of our time`). `title` remains the plain form and the two must agree — including when a label moves into `label`, which it also leaves out of `title_html`. Seven nodes carried it in both and printed `CHAPTER VII` twice, because a renderer typesets the two as separate spans (**amended 2026-08-24**).
- `title` may carry the same narrowed inline html as body text.

A document with no internal headings gets a single node spanning from its first section.

**Amended 2026-08-21**: each block also carries `html` — the block's text as HTML restricted to a closed allowlist (`i`, `b`, `br`, `sup`, `blockquote`; `em`→`i`, `strong`→`b`), with footnote markers as `<sup data-fn="N"></sup>` instead of `⟦N⟧`. This recovers the inline italics the manifests have always described as "a deliberate v1 loss". Tags outside the allowlist keep their text and lose their markup, reported per run as an anomaly. **Amended 2026-08-22**: text runs are stored with the source's entities already decoded and only `&`/`<`/`>` re-escaped. vatican.va writes accented characters as named entities (`&atilde;` 47,570 times, and a long tail), and the site walks this markup rather than handing it to `{@html}` — three features have to reach inside it (the footnote disclosure, scripture linkification, the drop cap) — so decoding once here saves shipping an HTML entity table to the client and keeping it complete forever. The invariant, checked over all 14,907 sections: `strip_tags(html)` reproduces the stored `text` exactly. `manifest.json` also gains `header` — the document's own printed masthead as narrowed html (title, author, promulgation line), with vatican.va's language selector stripped; it is real content the page shows above its first heading, and leaving it in the block stream made it a phantom top-level structure node.

`sections.json` (not `paragraphs.json` — a document's numbered units are the print edition's own "sections," not CCC paragraphs; the _filename_ differs per work type even though the structure-tree _field_ stays `paragraphs`, per the note above): array ordered by `n`. **Amended 2026-08-22: a document block stores `html` and nothing derived from it.** `text_marked` and the section's `text` are gone — both were pure functions of `html`, and they were kept only as the round-trip oracle's expected value. That argument ended when the check moved into `validate_document` (`decisions.md`): both sides are now derived in-process from the same source string, so the oracle is exactly as strong with nothing on disk, and the corpus lost 33 MB, a fat/thin shipping split and a second format every reader had to branch on. The CCC, Compendium and prayers still store `text_marked`/`text` and no `html`, and keep the shape below until they are migrated.

```jsonc
{
  "n": 12,
  "blocks": [
    {
      // `kind` omitted when "prose"; `html` is the only text field.
      "html": "…narrowed html, markers as <sup data-fn=\"12\"></sup>…",
    },
  ],
  "citations": [{ "marker": "12", "text": "AAS 57 (1965) 12" }], // verbatim footnote content, keyed by marker
}
```

No `related` and no `in_brief` fields: no marginal cross-reference apparatus (the CCC's print-margin "see also ¶¶…" numbers) was found in any document family sampled (`vatican-documents.md` §2), and "In Brief" is a CCC-only summarization device with no analogue in these texts. Both are dropped rather than carried as permanently-empty dead fields.

### `appendix.json` — an unnumbered unit

**Added 2026-08-24.** A document's units are the numbers its own edition prints. Matter it prints with **no** number goes here instead, as an ordered array of `{ title?, blocks, citations }` — the heading the source prints above the run, and the run itself, in the same block model as a section.

```jsonc
[
  {
    "title": "NOTA EXPLICATIVA PRÉVIA",
    "blocks": [{ "html": "«A Comissão decidiu fazer preceder…" }],
    "citations": [],
  },
]
```

**Written only where there is one**, so the file's presence is itself the answer to "does this work have unnumbered matter", and a stale one from an earlier parse is deleted rather than left behind.

**Two different things arrive in this shape, deliberately.** One is what a numbered document appends after its last paragraph: Lumen Gentium's notifications and _Nota Explicativa Praevia_, Laudato Si's two closing prayers. The other is the **entire text of an edition that numbers nothing anywhere**, of which this corpus has eight — the Portuguese Pascendi, Quadragesimo Anno and Divini Illius Magistri, both editions of Miranda Prorsus, the English Vigilanti Cura, the Portuguese Mense Maio, the English Quae Ad Nos. Both are text with no citable address, so both store and render the same way and neither carries a `§n`.

**A third arrived with the First Vatican Council on 2026-09-02: unnumbered text a document prints BEFORE its numbered flow.** `Dei Filius` teaches in four unnumbered `CAPUT`s and then anathematizes the denial of what they taught in eighteen numbered canons, so an appendix that renders after the sections prints the constitution backwards. Two optional fields carry it, both written only by `walk_vatican_i` so every appendix already on disk keeps the shape it has:

```jsonc
[
  {
    "label": "CAPUT I", // the division label above the title, same split as a structure row's
    "title": "DE DEO RERUM OMNIUM CREATORE",
    "blocks": [{ "html": "Sancta Catholica Apostolica Romana Ecclesia…" }],
    "citations": [],
    "position": "leading", // the source prints this BEFORE its numbered flow
  },
]
```

`structure.json` rows take the same optional `position`. **`before: null` keeps meaning what it always has** — trailing matter the numbered flow never reaches — which is why leading matter needed a field of its own rather than a re-reading of that one. `position` rides on the UNIT as well as the row because the first leading run has no heading to carry it: `Dei Filius` opens with its address to the Church, above the first `CAPUT` and under no heading, and pairing by title cannot place a run with no title. The site's `splitUnnumbered` is the consumer.

**A document that numbers nothing gets no `position` at all**, and `walk_vatican_i` strips it: `Pastor Aeternus` is all chapters and has no numbered flow to be before or after, so marking it would ask a renderer to split a body with no other half.

**Why it is not a section with a null `n`.** `sections.json` is indexed by number by every consumer that touches it — the chunker, the compare view's alignment, `#s42` deep links, the route manifest. A unit with no number in that array is a hole in all of them. A separate file keeps the invariant "a section has a number" exactly true.

**What it fixes.** `push_heading` closes the open section, so every block after a trailing heading found no open section and was logged as orphan and dropped — while its heading survived in `structure.json`. That is how a table of contents came to list entries with nothing behind them, and how eight editions came to be withheld as parser defeats when their whole text was on the page. 495,753 characters across 20 works were being discarded.

**Whether a heading is back matter cannot be known when it is read**, only by whether a numbered paragraph ever follows it — so the parser buffers a unit at every heading and `start_section` throws the buffer away. Whatever survives to the end of the walk is the appendix.

`abbreviations.json`: not per-document. It stays homed at `ccc.{lang}/abbreviations.json`, and as of 2026-08-26 it is per-EDITION rather than corpus-wide (see above): the two editions that print a table print different tables and disagree where they overlap, so there is no one table to be corpus-wide. Between them they cover the sigla (LG, GS, DS, …) these documents are cited by and cite each other by; `link-surface.md` #4 records the other, independent route to the same expansions — each ingested document's own title.

CCC ¶ ↔ document section references (future, not yet built): turns a `citations[].text` string like `"LG 12"` into `{ document: "vatii.lumen-gentium", section: 12 }`, the same derivation the CCC → Bible index already does for scripture citations — a re-parse of already-captured raw citation text, not a re-scrape. Derived at build time like that one, and likewise not stored in the corpus. See `link-surface.md` row #12.

## Cross-references — derived, never stored

```jsonc
[
  {
    "ccc": 1234,
    "refs": [{ "osis": "john", "chapter": 3, "verses": [16, 17] }],
  },
]
```

Two indexes share this shape: the Catechism's (`{ ccc, refs }`, above) and the magisterial documents' (`{ work, n, refs }`, where `work` is the document's edition-free slug and `n` a section number).

**These are build artifacts, not corpus data.** `site/scripts/build-xrefs.mjs` produces it from `build/` on every build and writes it into the site's generated `corpus-data/index/`; nothing is committed and there is no `corpus/xrefs/`. It used to be a stored file built by a separate Python parser, which drifted from the one that renders the pages — see `pipeline/docs/parsing.md` for why one derivation beats two.

An entry's `refs` are the union across every edition of the work, drawn from all three places a reference appears: numbered footnotes, the inline locators Portuguese prints in the sentence (`citations[].label`), and the body prose itself. References are edition-independent (OSIS + chapter + verse); the site resolves them against whichever Bible edition the reader has open. Psalm references use Vulgate numbering — conversion happens in the builder, so nothing downstream sees two conventions. A whole-chapter reference is `"verses": []` and is kept distinct from a verse-level reference to the same chapter.

## Corrections (auditable source-defect fixes)

Verified source defects are fixed through a corrections layer, never by hand-editing output (see `../pipeline/docs/corrections.md`):

- **Input**: `pipeline/corrections/{work_id}.json` (committed to the repo) — array of entries:

```jsonc
{
  "id": "ccc.pt-679-fn660", // stable slug
  "locator": { "paragraph": 679, "marker": "660" }, // or {"osis":"john","chapter":19,"verse":29}, or {"structure": …}
  "field": "citation_text", // what is being corrected
  "from": "600.", // must match the parsed source exactly, else the run FAILS (drift guard)
  "to": "660.",
  "reason": "footnote list prints 600./601. immediately after 659 — digit-substitution typo",
  "evidence": "raw HTML corpus/raw/ccc-pt/…; EN parallel ¶679 footnotes 660-661",
  "added": "2026-08-14",
}
```

- **Application**: each scraper loads its corrections file (if present) and applies entries post-parse.
- **Receipt**: the work's output gains `corrections-applied.json` — the exact list applied, with before/after — and the manifest gains `"corrections_applied": n`.
- **Eligibility**: mechanical/typographic defects only (OCR artifacts, digit typos, marker mismatches, split words). Never wording changes, never modernization. Every entry needs evidence; a defect that can't be confidently resolved stays uncorrected and documented.

## Validation expectations (every scraper ships one)

Each scraper ends with a self-check that prints a report and exits non-zero on failure:

- Book count = 73; chapter counts sanity-checked against known values (Gen 50, Ps 150, Matt 28, Rev 22 …).
- No leftover markup: `<`, `{`, `}`, `[i]`-style markers, `�`, mojibake sequences (`Ã©`, `â€™`), double spaces.
- Matos Soares: scan for the known OCR artifact classes (`Ihe`, `Iá`, `Ies` — capital I for l) and report counts and locations.
- CCC: paragraphs 1–2865 present, structure tree spans them without top-level gaps; `text_marked` tokens ↔ `citations` markers match 1:1; `text` = `text_marked` minus tokens.
- Prayers: both language editions produce the same `slug` set (the cross-language symmetry oracle — see "Prayers" above); every Rosary `groups` entry has exactly 5 `items`; each language's Latin-present slug set matches the other's (a prayer missing Latin in one language but not the other is a parser bug, not an expected gap — the three CCC texts, the Litany, and the three Eastern-rite prayers genuinely lack Latin in _both_).
- **Sample-first protocol**: every scraper must support a `--sample` mode that processes a small representative slice, and the full crawl runs only after the sample output has been reviewed and approved. (`prayers.py` is the one documented exception: its 24 Appendix A entries, three short cached CCC texts, and one Litany are parsed in well under a second, so there is no meaningfully smaller slice to sample — see its docstring.)
- Provenance: manifest `sources[].retrieved_at` set, `generated_at` set.
