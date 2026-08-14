# The link surface

Depositum's value is dense internal linking. This document inventories **every reference apparatus in the source texts**, what the corpus captures for each, and why the deferred ones are safe to defer. Companion to `corpus-schema.md` (the how); this is the what and why.

## Principle

The corpus stores **positions and raw strings, never interpretations**. Citation strings stay verbatim, markers stay where printed, marginal numbers stay in printed order. Parsing, normalization, and link resolution happen in later derived passes — a better parser next year improves every link without touching scraped data. Insurance policy: every raw source page is cached in `corpus/raw/`, so any capture regret is fixable by **re-parsing, never re-crawling**.

## Inventory

| #   | Link surface                                                                            | Schema home                                                 | Status                                                                                                 |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | CCC footnote citations (→ Scripture, councils, Fathers, canon law, liturgy, papal docs) | `citations` + inline `⟦n⟧` tokens in `blocks[].text_marked` | Captured, position-preserving                                                                          |
| 2   | CCC marginal numbers (→ other CCC ¶¶ on the same theme; the internal concordance)       | `related`                                                   | **Empty in v1 sources** — the vatican.va HTML mirrors omit the print margin apparatus entirely (verified 2026-08-14, both languages). To be filled by an enrichment pass from a supplementary source (candidates: scborromeo.org, catholiccrossreference.online); schema field ready |
| 3   | CCC in-prose internal refs ("cf. 1212")                                                 | left verbatim in text                                       | Deferred: regex-linkifiable any time from flat text; nothing lost                                      |
| 4   | CCC abbreviations table (LG = _Lumen Gentium_, DS, CIC, …)                              | `abbreviations.json`                                        | **Empty in v1 sources** — neither vatican.va mirror carries the front-matter table (verified 2026-08-14). Enrichment candidates: scborromeo.org's abbreviations page (used by prior projects for exactly this), USCCB edition. Field ready |
| 5   | CCC indented block quotations + attributions                                            | `blocks` (`kind: "quote"`, `attribution`)                   | Captured — where many citations attach; irreversible from flat text                                    |
| 6   | CCC hierarchy + In Brief blocks                                                         | `structure.json`, `in_brief`                                | Captured                                                                                               |
| 7   | Bible verse addresses                                                                   | OSIS + chapter + verse, edition-independent                 | Captured — the anchor targets #1 resolves against                                                      |
| 8   | Bible in-chapter section headings                                                       | optional `chapters[].headings`                              | Captured when the source prints them                                                                   |
| 9   | Bible footnotes                                                                         | optional per-verse `notes`                                  | Not captured in v1 — see below                                                                         |
| 10  | Reverse indexes (verse → "cited in CCC ¶…")                                             | `xrefs/` (generated)                                        | Phase 2, derived from #1 + #7; nothing to store now                                                    |
| 11  | Compendium question → CCC ¶¶ (each question prints the paragraphs it condenses)         | `questions[].ccc_refs` (raw string)                         | Captured — gives Compendium ↔ CCC ↔ Bible transitively; reverse "summarized in Q n" derived in phase 2 |

## Why no Bible footnotes in v1

Two different reasons, one per edition:

- **CPDV: none exist.** Conte published the CPDV deliberately without annotations (his stated position: Canon 825 requires annotations _and_ approval, and he refused the approval process). The online edition has no notes to capture.
- **Matos Soares: notes exist, our source lacks them.** The translator's apologetic/explanatory footnotes are real, but liriocatolico chapter pages print only the markers (`[i]`) without the note content. The sole structured source carrying the notes is vulgata.online — Cloudflare-protected, self-described "EM FASE DE DESENVOLVIMENTO". Deferred as a future enrichment pass; recorded in the work's manifest. (The notes are also under the same copyright clock as the translation, PD 1 Jan 2028.)

The schema's per-verse `notes` field already exists, so adding footnotes later — Matos Soares via vulgata.online, or Douay-Rheims with its public-domain Challoner notes — is additive: no schema change, no re-architecture.

## Deferred with rationale

- **Inline emphasis (italics)** in CCC text: v1 loss, recoverable from `corpus/raw/`. Not a link surface, purely typographic.
- **CCC front matter** (_Fidei Depositum_): unnumbered, participates in no linking; becomes an ordinary document in v2.
- **Hebrew↔Vulgate psalm numbering**: both v1 editions use Vulgate numbering, so this is jump-box logic ("Psalm 23" opens Psalm 22), not corpus data. Becomes corpus-relevant only if a Hebrew-numbered edition is added.

## v2 surfaces this design anticipates

- **Encyclicals & council documents**: once ingested, the raw `citations` strings + `abbreviations.json` let the parser resolve "LG 12" to an actual paragraph link — bidirectionally (CCC ¶ ↔ LG §12).
- **Bible → Bible parallels** (synoptic cross-refs): none of our v1 sources carry them; would come from a separate PD apparatus, joined by OSIS address.
- **Fathers / Denzinger citations**: same mechanism as encyclicals, further out.
