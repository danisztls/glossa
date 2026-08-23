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
  works/
    bible.cpdv.en/
      manifest.json
      books/gen.json … rev.json     # one file per book, lowercase OSIS code
    bible.matos-soares.pt/
      manifest.json
      books/…
    bible.clementina.la/
      manifest.json
      books/…
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

`{corpus}.{edition}.{lang}` for Bibles (`bible.cpdv.en`, `bible.matos-soares.pt`); `ccc.{lang}` for the Catechism; `compendium.{lang}` for the Compendium; `prayer.{slug}.{lang}` for prayer collections (currently one: `prayer.common.{lang}`, combining the Compendium's Appendix A, three already-cached CCC texts, and the Litany of Loreto — see "Prayers" below; `{slug}` leaves room for a later, larger collection to ship as its own work rather than growing `common` without bound); `{family}.{slug}.{lang}` for documents (encyclicals, conciliar texts, curial documents) — e.g. `vatii.lumen-gentium.en`, `encyclical.centesimus-annus.pt`, `cdf.dominus-iesus.en`.

## manifest.json (all works)

```jsonc
{
  "id": "bible.cpdv.en",
  "type": "bible", // "bible" | "catechism" | "compendium" | "prayer" | "document"
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
  "psalm_numbering": "vulgate", // all three editions use Vulgate/Septuagint numbering
  "books": ["gen", "exod", "…"], // the 73 lowercase OSIS codes in this work's canonical order
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
      "verses": [{ "n": 1, "text": "In the beginning was the Word…" }],
    },
  ],
}
```

- `text` is plain text: no markup, no verse markers, no footnote markers, single spaces, no leading/trailing whitespace. Typographic quotes/dashes preserved as proper UTF-8.
- Verse-number gaps are allowed (critical-text omissions); never renumber. A verse present with empty text is invalid — omit it instead.
- If the source carries footnotes, they may optionally be captured as `"notes": [{ "marker": "i", "text": "…" }]` on the verse; strip markers from `text` regardless. (Matos Soares: liriocatolico chapter pages carry markers but not note content — strip markers, and note in the manifest that footnote content is a future enrichment via vulgata.online.)
- If the source prints section headings inside chapters (e.g. "Primeiro dia da criação"), capture them as `"headings": [{ "before_verse": 3, "text": "…" }]` on the chapter; omit the field when absent.

## Book introductions — `bible-intro.{lang}/intros.json`

**Added 2026-08-23.** A short introduction per book, which the site addresses as **chapter 0** of that book (`/scriptura/gen/0`). `type: "bible-intro"`; work id `{corpus}.{lang}`, the `ccc.{lang}` shape rather than the Bible's `{corpus}.{edition}.{lang}`.

```jsonc
[{ "osis": "gen", "blocks": [{ "text": "This book is so called from…" }] }]
```

**Keyed by language, not by edition, and that is the whole design.** An introduction describes the *book*, not the translation, so the three editions of a language share one — writing it per edition would mean maintaining the same prose three times and again for every edition added later. It follows that chapter 0's existence is a **language** question: a reader on `bible.cpdv.en` has one, a reader on `bible.clementina.la` does not, and that asymmetry is served as an ordinary absent chapter rather than by falling back to another language's prose (see `site/src/routes/bible/[book]/[chapter]/+page.svelte`, which does fall back across editions for real chapters and deliberately does not here).

**Chapter 0 is navigable but never citable, and it stays out of `books/{osis}.json`.** Folding it into a Bible book's `chapters` would make it indistinguishable from scripture to everything that reads chapter numbers from there — `refs.ts`'s existence check (so `Gen 0` would begin resolving as a citation), the xref checker's `chapterVerses` map, `versification.ts`. The two registries are kept apart precisely so an introduction cannot become a citation target by accident; `site/scripts/sync-corpus.mjs` unions the 0 into `corpus-routes.json` only, which is addresses and nothing else.

Manifest carries `books` (OSIS codes with an introduction, canonical order) and `shared_preface_with` (`osis -> the book whose introduction covers it`) for sources that print one preface across two volumes.

- `blocks[].text` is plain text on the same terms as verse text above: markup dropped, emphasis a documented v1 loss recoverable from `raw/`.
- A book may legitimately have none. Challoner prints one preface for both volumes of Kings and both of Paralipomenon, so `bible-intro.en` covers 71 of 73 books, and `/scriptura/2kgs/0` is correctly not an address at all.

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

- **`kind` is omitted when it is `prose`** (**amended 2026-08-22**, all work types). Absence means the default, the same rule `attribution`/`label` and structure.json's `ident`/`subtitle`/`title_html` already follow, so every stored `kind` marks a real exception and `grep -c '\"kind\"'` is the census of them. The share that is not prose varies by work type and is what decides whether the field earns its place: 11% of CCC blocks, 4% of the Compendium's, 19% of prayer blocks (`versicle`/`response`) — but 6 blocks in 14,924 for documents, where `<blockquote>` is rare and, in the PT editions, sometimes used for indentation rather than quotation (see `pipeline/overrides/README.md`). Readers must test for the exception (`kind === 'quote'`), never for `'prose'`.
- **Inline reference positions are preserved**: `text_marked` keeps each footnote marker exactly where the source prints it, encoded as `⟦marker⟧` (e.g. `⟦12⟧`). Portuguese's archive sometimes types a Scripture locator directly in the prose where English uses a numbered footnote; the parser turns that locator into an `⟦inlineN⟧` token carrying `{ "label": "(Heb 11, 2. 39)" }` — the source's parenthesis verbatim, leading-space irregularities and all. **`label` is the discriminator**: a citation that has one is printed back where it stands, exactly as the source sets it, with links woven through; a citation without one is a numbered note and renders as a marker. The token exists to isolate the citation apparatus from the sentence around it (so the reference parser is handed a citation-shaped string, not running prose), not to convert it into a footnote. The raw source remains the authoritative original.
- Every `citations[].marker` appears exactly once across the paragraph's `text_marked` fields, and every `⟦⟧` token has a matching `citations` entry (validated). `text` = all blocks joined in order with ordinary markers stripped and an inline citation's source locator restored.
- Inline emphasis (italics for titles/Latin terms) is a **known, deliberate v1 loss** — recoverable later from `corpus/raw/` without re-crawling.
- Keep citation `text` **raw and verbatim** as printed in the source footnote — the phase-2 citation parser consumes it; do not normalize.
- `related` captures the CCC's **marginal reference apparatus**: the small paragraph numbers printed beside/inside each paragraph pointing to other paragraphs on the same theme. Capture them in printed order, deduplicated, each in 1–2865; empty array when a paragraph has none. These are NOT footnotes — do not mix them into `citations`, and strip them from `text`/`text_marked`.
- Cross-paragraph references inside the running prose ("cf. 1212") stay in `text`/`text_marked` as printed.
- Both `ccc.en` and `ccc.pt` must contain exactly paragraphs 1–2865; report (in `manifest.notes`) any source gaps rather than papering over them.

## Catechism — `abbreviations.json`

The CCC's own front-matter abbreviations table, verbatim:

```jsonc
[{ "abbr": "LG", "expansion": "Lumen Gentium" }]
```

This is the decoder ring for `citations` strings ("LG 12", "DS 150", "CIC, can. 849") — the phase-2 citation parser and all future document-to-document linking (encyclicals, council documents) depend on it. Capture both the scripture-book abbreviations and the document abbreviations if the source separates them (a `"kind": "scripture" | "document"` field is welcome if distinguishable).

## Compendium — `questions.json`

The Compendium of the CCC (2005) is Q&A-format: 598 numbered questions, each printed with a reference to the CCC paragraphs it condenses. Work IDs `compendium.{lang}`; manifest `type: "compendium"`. Array ordered by `n`:

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
- The Compendium's Appendix A (common prayers, in Latin parallel) is parsed separately, from the same cached raw HTML, into `prayer.common.{lang}` — see "Prayers" below. Appendix B (doctrinal formulas — virtues, precepts, capital sins, …) remains deferred: not prayers, out of scope for that work too; document its presence in `manifest.notes`.
- The print edition's sacred-art images and their commentary are out of scope for v1 (note their existence in `manifest.notes`).

## Prayers — `prayers.json`

A prayer collection has no numbered units in its source at all — unlike CCC paragraphs, Compendium questions, or document sections, none of which this schema invents a number for. Work IDs `prayer.{slug}.{lang}` (currently one: `prayer.common.{lang}`, combining the Compendium of the CCC's Appendix A, the Apostles' Creed, Nicene Creed, and Our Father re-parsed from cached CCC pages, plus the Litany of Loreto); manifest `type: "prayer"`. Array ordered by `n`:

```jsonc
{
  "n": 1, // collection order — for ordering only, never addressing (see below)
  "slug": "sign-of-the-cross", // stable, language-invariant identifier — the actual address
  "title": "The Sign of the Cross",
  "kind": "simple", // "simple" | "dialogic" | "group" — derived from what was actually parsed, not asserted per prayer: "group" whenever `groups` is present, "dialogic" whenever any block is a versicle/response, "simple" otherwise. Can legitimately differ between a work's two language editions for the same slug (see below) — this is source-faithful, the same way structure trees are per-language (see "Language symmetry principle" in decisions.md).
  "blocks": [{ "kind": "prose", "text": "…" }], // "prose" | "versicle" | "response"
  "variants": [ // optional; present only when the source prints more than one full wording under one title
    { "label": "UK", "blocks": [ … ] },
    { "label": "USA", "blocks": [ … ] },
  ],
  "latin": { "title": "Signum Crucis", "blocks": [ … ] }, // optional — same block shape, absent wherever the source prints no Latin for this prayer
  "rubric": null, // free text the source attaches directly to the prayer (distinct from a per-group rubric, see `groups` below)
  "groups": [ // optional; present only on prayers structured as named groups of items rather than flowing text (the Rosary's four mystery groups)
    { "name": "The Joyful Mysteries", "rubric": "(recited Monday and Saturday)", "items": [{ "title": "First Joyful Mystery: The Annunciation", "meditation": "…Scripture text…", "citation": { "marker": "1", "text": "Lk 1:26-27" } }] },
  ],
  "instructions": { "title": "How to pray the Rosary?", "blocks": [ … ] }, // optional; source-provided directions, currently the Rosary only
}
```

- **`slug`, not `n`, is the address.** `n` is kept alongside solely as a collection-order integer, but it is never what a URL or a cross-reference points at. It preserves source print order within a sourced tranche; where `prayer.common` combines the three CCC texts with the Compendium appendix, it supplies the deliberately displayed order between tranches. `slug` is English-derived, kebab-case, and — like Bible OSIS codes and document family slugs — language-invariant: the same prayer carries the same slug in every language edition of the work.
- **Latin is a field, not an edition.** A prayer's `latin` sits beside its vernacular `blocks` on the same array entry rather than living in a `prayer.common.la` work, deliberately: a real Latin _edition_ would need to answer `PLAN.md`'s open "UI language vs. content language" question (nobody wants a Latin UI, but Latin would be the first _content_ language that isn't also one), and the source itself only ever prints Latin as a bound companion to the vernacular text, never as independently addressable content. See `decisions.md`'s 2026-08-15 "Latin as next source language" entry and `research/prayers.md` §3.
- **`versicle`/`response`** are block kinds beyond the CCC/Compendium's `prose`/`quote` pair, for dialogic (V./R.) prayers such as the Angelus. Each such block carries an additional `"label"` field holding the verbatim printed prefix (e.g. `"V."`, `"R."`, or — a source uses this too, for the same leader/assembly roles under different initials — `"D."`, `"C."`); the prefix is kept, not normalized to a canonical V./R., since it's exactly what's printed.
- **`variants`** exists for prayers the source prints more than once under one title with genuinely different wording (regional adaptations, e.g. UK vs. USA text) — not to be confused with a translation difference between language editions, which is just two separate top-level works. A prayer with no such split has no `variants` field at all, not an empty array.
- **`groups`** is the one schema piece here that isn't a variant of `blocks`: a prayer whose source structure is fundamentally a list of named items (the Rosary's four mystery groups, each with a weekday rubric and five items) gets that structure captured directly rather than flattened into prose. Each Rosary item keeps its printed title and full Scripture meditation; its terminal source-printed locator is captured as a raw `citation` and rendered as the site’s inline footnote. The shared decade prayer is expressed once in the source-derived `instructions` rather than copied twenty times.
- **`instructions`** carries source-provided directions with their own title and ordinary prayer blocks. It is currently present only on the Rosary.
- **Cross-language symmetry**, per `CLAUDE.md`'s free QA oracle: the two language editions' `slug` sets must match exactly — this is a real check, not a tautology, even when a scraper assigns slugs positionally from one shared list, because it still catches a parser producing the wrong count or order of entries in either language. `kind`, `variants`, and whether `latin` is present may legitimately differ per language for the same slug (the source itself typesets the same prayer differently across its two pages); only the address space itself — the slug set — is required to agree.
- `structure.json` reuses the generic node schema purely for grouping (a lightweight table of contents), not addressing: `paragraphs` is `[null, null]` throughout, the same allowance already documented for Creed/Decalogue-style unnumbered content under "Catechism — `structure.json`" above.

## Documents (encyclicals, conciliar texts, curial documents)

v2, scoped 2026-08-15 — see `decisions.md` §Vatican documents in scope for what's in/out and why, and `research/vatican-documents.md` for the underlying survey (citation-frequency tables, per-pontificate EN/PT coverage audit, numbering tests — cited by locator below, not restated here). Covers Vatican II's 16 constitutions/decrees/declarations, papal encyclicals, apostolic exhortations, and CDF/DDF declarations — one schema shape for all of them, since every family sampled shares the same numbering/citation/quotation structure (`vatican-documents.md` §3).

Work IDs: `{family}.{slug}.{lang}`, where `{family}` is `vatii` | `encyclical` | `apost-exhort` | `apost-const` | `cdf` (distinguishes publishing pipeline and future per-family styling without forking the schema). Examples: `vatii.lumen-gentium.en`, `encyclical.centesimus-annus.pt`, `cdf.dominus-iesus.en`.

`manifest.json`: same shape as the Catechism/Compendium manifest, `"type": "document"`, plus document-only fields:

```jsonc
{
  "id": "vatii.lumen-gentium.en",
  "type": "document",
  // ...bible-manifest-shared fields (title, language, edition, sources, copyright, notes, generated_at)...
  // document-only:
  "document_kind": "conciliar-constitution", // "conciliar-constitution" | "conciliar-decree" | "conciliar-declaration" | "encyclical" | "apostolic-exhortation" | "apostolic-constitution" | "cdf-declaration" | …
  "pontiff_or_council": "Second Vatican Council", // e.g. "John Paul II", "Second Vatican Council", "Congregation for the Doctrine of the Faith"
  "promulgated": "1964-11-21", // the document's own date, distinct from sources[].retrieved_at
  "translations": {
    // optional; present only when a sibling-language edition is known and NOT written as its own work — never present alongside a real sibling work, which is provenance enough on its own
    "pt": {
      "status": "stub-page", // "stub-page" | "no-url" | "not-found" | "fetch-failed"
      "checked_at": "2026-08-16", // when this status was established, not necessarily today
      "note": "…", // optional, freeform; used e.g. to record that a retry reproduced the same result
    },
  },
}
```

Absence of a sibling-language work (e.g. no `encyclical.rerum-novarum.pt` directory) is expected and common — coverage collapses for older pontificates (`vatican-documents.md` §2) — but bare absence on disk is provenance-free: it can't be told apart from "never checked" without re-crawling. `translations` on the surviving work closes that gap, recorded once the absent language's status is established, from whichever of these it turns out to be (checked from cache, no network needed once the crawl has already visited the URL once):

- `"stub-page"`: a URL was fetched (200) but its content region carried no real translation, only vatican.va's page shell (see the scraper's `StubPageError`) — confirmed live to be the dominant case for pre-1960s Portuguese encyclical URLs.
- `"no-url"`: no URL for that language could even be derived/discovered (distinct from a URL existing and failing).
- `"not-found"`: a derived URL was attempted and consistently returned HTTP 404 across a full retry cycle (3 attempts with backoff) — a measured, repeatable absence, not a guess. Confirmed live for 10 Pius XI/XII-era documents: the original crawl recorded them as failed, and an explicit post-sweep retry (once concurrent crawling was no longer a politeness concern) reproduced the same 404 on every one of 10/10, with none resolving — i.e. the earlier failure was never transient flakiness for these, it was vatican.va correctly reporting "no such page."
- `"fetch-failed"`: a URL was derived and a fetch was attempted but never resolved to a definite answer (connection/timeout error, not a clean 404) — genuinely transient network flakiness (the survey's ~1-in-6–8 Azure edge rate), worth a retry on a future crawl, unlike `"not-found"`.

Never fabricated or inferred without evidence: each status is derived from what's actually on disk or from a direct, logged HTTP response (an absent raw-cache file, a cached-but-stub one, or a reproduced 404), the same "auditable from cache/evidence" posture as everything else in this pipeline.

**Two fix layers, and they are not the same** (`decisions.md`, 2026-08-22). `pipeline/corrections/` claims the _source_ is wrong and edits the fetched HTML before parsing; `pipeline/overrides/` claims the source is fine and our _derivation_ is not, and edits `structure.json`/`sections.json` after parsing. Keeping them apart is what lets `corpus/raw/` remain the record of what the source actually said. A work with overrides gets an `overrides-applied.json` receipt, written only when there are any; the layer ships empty on purpose, and the bar for filing an entry is that the defect belongs to one document rather than to a class of them. See `pipeline/overrides/README.md`.

`structure.json` **(amended 2026-08-21, documents only — see `decisions.md`)**: a FLAT, document-ordered array of `{ level, title, before }`, plus the optional `ident` and `subtitle` added 2026-08-22. It no longer reuses the CCC/Compendium node schema, and `kind`/`n`/`paragraphs`/`children` are gone.

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
    "ident": "CHAPTER THREE",
    "title": "TECHNOLOGY AND DOMINANCE.",
    "subtitle": "THE GRANDEUR OF HUMANITY IN LIGHT OF THE PROMISES OF AI",
    "before": 90,
  },
]
```

- `level` is the heading's **observed depth**, 1-based and contiguous per document. It is not a taxonomy: the old `kind` forced the scraper to judge whether a heading _meant_ "chapter" or "section", which the sources do not reliably encode, and that judgement is what put chapters inside sections in Gaudium et Spes. Levels are assigned by walking the document — a heading directly following another with no section between is its subtitle and sits one level under it; a heading whose styling was seen before keeps the level it was first given, so siblings stay siblings; otherwise the global rank applies but never descends more than one level at a time — and are then compacted to contiguous `1..N`. Labelled headings (PART/CHAPTER/SECTION/ARTICLE) outrank unlabelled ones, because styling alone inverts: vatican.va wraps Gaudium et Spes's chapters in `<center>` while printing `PART I` as an ordinary left-aligned paragraph. **Amended 2026-08-21**: all of that is inference from how a heading is painted, and it is overridden outright on the three pages that print a linked table of contents (`magnifica-humanitas` in both languages, `divini-redemptoris.pt`) — there the levels come from the TOC's own indentation and emphasis, and blocks the style rules missed but the TOC names are promoted to headings. A TOC states the outline instead of implying it; see `decisions.md`.
- `before` is the section number the heading precedes — its anchor. `null` means trailing matter the numbered flow never reaches. **Ranges are derived, not stored**: a heading owns sections from its anchor until the next heading of equal or shallower level. Nearly every structural defect found in the 2026-08 description pass was a stored span drifting from the text (680 `[null, null]` nodes, `CHAPTER II` at `[53,53]`, `SECTION 2` overreaching into two other chapters). Nothing stored is nothing to drift.
- `ident` and `subtitle` are **optional and omitted when absent**, so the ordinary one-line heading stays a three-key object. They exist because vatican.va prints a division's identifier, its name and sometimes a second title line as _separate paragraphs_ — three blocks, one heading. Kept as three nodes they became three table-of-contents rows all anchored to the same section, deriving the same range, so a position-tracking TOC highlighted three rows at once. `ident` is the bare label line above the title (`CHAPTER THREE`, `PRIMEIRA PARTE`); `subtitle` is whatever further lines belong to the same heading. They are stored apart from `title` rather than folded into it because they are different things — the identifier names the division's place in a sequence, the title names its subject — and a renderer wants them typeset apart. The scraper merges only when the first line is a **bare** label and never absorbs more than one following line without the page's own TOC vouching for it; see `merge_heading_lines`.
- `title_html` is optional and present only where the source set emphasis on PART of a heading — 275 nodes. The emphasis wrapping a whole heading is the scraper's own detection signal (`is_full_bold` IS the heading detector), so storing it would say nothing; what this keeps is an encyclical name inside a heading (`THE MESSAGE OF <i>POPULORUM PROGRESSIO</i>`), a scripture reference (`QUEM ME VÊ, VÊ O PAI (CF. <i>JO</i> 14, 9)`), or a Latin phrase (`The <i>res novae</i> of our time`). `title` remains the plain form and the two must agree.
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

`abbreviations.json`: not per-document — corpus-wide, still homed at `ccc.{lang}/abbreviations.json` (see above). The CCC's own front-matter table already covers the sigla (LG, GS, DS, …) these documents are cited by and cite each other by; see `link-surface.md` on how ingesting Vatican II resolves that file's sourcing problem.

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

**These are build artifacts, not corpus data.** `site/scripts/build-xrefs.mjs` produces it from `works/` on every build and writes it into the site's generated `corpus-data/index/`; nothing is committed and there is no `corpus/xrefs/`. It used to be a stored file built by a separate Python parser, which drifted from the one that renders the pages — see `decisions.md`, 2026-08-21, for why one derivation beats two.

An entry's `refs` are the union across every edition of the work, drawn from all three places a reference appears: numbered footnotes, the inline locators Portuguese prints in the sentence (`citations[].label`), and the body prose itself. References are edition-independent (OSIS + chapter + verse); the site resolves them against whichever Bible edition the reader has open. Psalm references use Vulgate numbering — conversion happens in the builder, so nothing downstream sees two conventions. A whole-chapter reference is `"verses": []` and is kept distinct from a verse-level reference to the same chapter.

## Corrections (auditable source-defect fixes)

Verified source defects are fixed through a corrections layer, never by hand-editing output (see `decisions.md` §Source-defect corrections policy):

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
