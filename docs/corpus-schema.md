# Corpus schema

The data contract between `pipeline/` (producers) and `site/` (consumer). This document is normative for v1; JSON Schema validation may follow. All JSON is UTF-8, 2-space indented, LF.

## Layout

```
corpus/                      # gitignored, built locally
  raw/                       # cached raw fetches, one subdir per scraper (re-runs must be offline-capable)
    cpdv/ ...
    matos-soares/ ...
    ccc-en/ ...
  works/
    bible.cpdv.en/
      manifest.json
      books/gen.json … rev.json     # one file per book, lowercase OSIS code
    bible.matos-soares.pt/
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
    vatii.lumen-gentium.en/
      manifest.json
      structure.json
      sections.json
    vatii.lumen-gentium.pt/
      …
    encyclical.centesimus-annus.en/
      …
  xrefs/
    ccc-bible.json           # generated later by the citation parser (phase 2)
    ccc-documents.json       # future: CCC ¶ ↔ document section refs, same derivation (see docs/link-surface.md)
```

## Work IDs

`{corpus}.{edition}.{lang}` for Bibles (`bible.cpdv.en`, `bible.matos-soares.pt`); `ccc.{lang}` for the Catechism; `compendium.{lang}` for the Compendium; `{family}.{slug}.{lang}` for documents (encyclicals, conciliar texts, curial documents) — e.g. `vatii.lumen-gentium.en`, `encyclical.centesimus-annus.pt`, `cdf.dominus-iesus.en`.

## manifest.json (all works)

```jsonc
{
  "id": "bible.cpdv.en",
  "type": "bible", // "bible" | "catechism" | "compendium" | "document"
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
  "psalm_numbering": "vulgate", // both v1 editions use Vulgate/Septuagint numbering
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
  "children": [ … ]
}
```

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
  "citations": [{ "marker": "12", "text": "Jn 3:16" }], // verbatim footnote content, keyed by marker
  "related": [1094, 2179], // marginal cross-reference numbers: other CCC paragraphs on the same theme
  "notes": [], // any other footnote text
}
```

- **Block structure is preserved**: a CCC paragraph is a sequence of `blocks` — `prose` for running text, `quote` for the indented quotations the print edition sets in smaller type. Do not flatten quotes into prose. Line breaks inside a block collapse to single spaces.
- **Inline reference positions are preserved**: `text_marked` keeps each footnote marker exactly where the source prints it, encoded as `⟦marker⟧` (e.g. `⟦12⟧`).
- Every `citations[].marker` appears exactly once across the paragraph's `text_marked` fields, and every `⟦⟧` token has a matching `citations` entry (validated). `text` = all blocks joined in order with markers stripped.
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
- The Compendium's appendices (common prayers — some in Latin parallel — and doctrinal formulas) are optional in v1: capture if straightforwardly parseable into `notes`-style ancillary JSON, otherwise document their presence in `manifest.notes` and defer.
- The print edition's sacred-art images and their commentary are out of scope for v1 (note their existence in `manifest.notes`).

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
  "translations": { // optional; present only when a sibling-language edition is known and NOT written as its own work — never present alongside a real sibling work, which is provenance enough on its own
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

`structure.json`: reuse the Catechism/Compendium node schema verbatim (`kind`/`n`/`title`/`paragraphs`/`children` — `paragraphs` is the generic unit-number span from the note above, and holds document section numbers here). Chapter/Part headings for the longer documents (Gaudium et Spes has Parts and Chapters; Laudato Si' has numbered chapters and roman-numeral subsections, `vatican-documents.md` §3); a document with no internal headings (a short CDF declaration) gets a trivial single-node tree spanning its full section range, the same shape a short Compendium chapter would get.

`sections.json` (not `paragraphs.json` — a document's numbered units are the print edition's own "sections," not CCC paragraphs; the _filename_ differs per work type even though the structure-tree _field_ stays `paragraphs`, per the note above): array ordered by `n`, same `blocks`/`text_marked`/`citations`/`text` shape as the CCC's `paragraphs.json`:

```jsonc
{
  "n": 12,
  "blocks": [
    { "kind": "prose", "text_marked": "…prose with inline ⟦12⟧ markers…" },
  ],
  "text": "…derived: all blocks joined, markers stripped, spaces normalized…",
  "citations": [{ "marker": "12", "text": "AAS 57 (1965) 12" }], // verbatim footnote content, keyed by marker
}
```

No `related` and no `in_brief` fields: no marginal cross-reference apparatus (the CCC's print-margin "see also ¶¶…" numbers) was found in any document family sampled (`vatican-documents.md` §2), and "In Brief" is a CCC-only summarization device with no analogue in these texts. Both are dropped rather than carried as permanently-empty dead fields.

`abbreviations.json`: not per-document — corpus-wide, still homed at `ccc.{lang}/abbreviations.json` (see above). The CCC's own front-matter table already covers the sigla (LG, GS, DS, …) these documents are cited by and cite each other by; see `link-surface.md` on how ingesting Vatican II resolves that file's sourcing problem.

`xrefs/ccc-documents.json` (future, phase-2-style derived pass, not yet built): turns a `citations[].text` string like `"LG 12"` into `{ document: "vatii.lumen-gentium", section: 12 }`, the same derivation `ccc-bible.json` already does for scripture citations — a re-parse of already-captured raw citation text, not a re-scrape. See `link-surface.md` row #12.

## Cross-references — `xrefs/ccc-bible.json` (phase 2, generated)

```jsonc
[
  {
    "ccc": 1234,
    "refs": [{ "osis": "john", "chapter": 3, "verses": [16, 17] }],
  },
]
```

References are edition-independent (OSIS + chapter + verse); the site resolves them against whichever Bible edition the reader has open. Psalm references use Vulgate numbering (both v1 editions agree).

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
- **Sample-first protocol**: every scraper must support a `--sample` mode that processes a small representative slice, and the full crawl runs only after the sample output has been reviewed and approved.
- Provenance: manifest `sources[].retrieved_at` set, `generated_at` set.
