# Editions published as PDF

Survey conducted 2026-08-29 (Claude, read-only against files already in `glossa-corpus/raw/`, plus one live probe fetch of the English _Amoris Laetitia_ PDF). Companion to `vatican-documents.md` and `catholic-growth-and-catechism-languages.md`. Written because the ten-language Magisterium ingestion turned up a class of absence the corpus had no vocabulary for: **an edition that exists and that we cannot read.**

**Scope note**: nothing here is ingested. `pipeline/` gains no PDF reader in this pass — this document is the plan, deliberately written down before any of it is built, so the decision about whether to build it is made with the measurements in view rather than mid-implementation.

## TL;DR

There are **54 PDFs already in `raw/`, 49 MB**, captured by earlier scrapes and read by nothing, plus **6 document editions** that exist only as PDF on vatican.va and are not yet fetched. Together they are roughly **13 editions and ~10,000 addressable units** — two whole Catechisms (Arabic, Chinese), four whole Compendia (Belarusian, Indonesian, Lithuanian, Russian), and six Magisterial documents including the **English _Amoris Laetitia_**, which is the most-read exhortation in the corpus and currently has no English text at all.

**Every one of them that matters carries a real text layer.** This is a parsing project, not an OCR project — with exactly one exception (`wujek_1599_ia`, a 2,139-page scan of the 1599 Wujek Bible, which extracts zero characters and should stay out of scope).

The single decision that has to be made before any code is written is **which extractor**, and the project has already been burned by getting the analogous question wrong once (`CLAUDE.md`, the Doré anchors). The recommendation is a version-pinned Python library declared in the scraper's PEP 723 header, **not** `pdftotext` from `PATH`.

## 1. What is already on disk

`glossa-corpus/raw/`, counted 2026-08-29:

| Directory        | Files | Shape                                  | What it is                           |
| ---------------- | ----- | -------------------------------------- | ------------------------------------ |
| `ccc-zh/`        | 43    | part-files, ~15 pp each                | the Catechism in Chinese, §§1–2865   |
| `ccc-ar/`        | 5     | part-files (`prefazione`, `parte1..4`) | the Catechism in Arabic, §§1–2865    |
| `ccc-mg/`        | 1     | 983 pp                                 | the Catechism in Malagasy            |
| `compendium-be/` | 1     | 247 pp                                 | the Compendium in Belarusian, Q1–598 |
| `compendium-id/` | 1     | 244 pp                                 | the Compendium in Indonesian         |
| `compendium-lt/` | 1     | 240 pp                                 | the Compendium in Lithuanian         |
| `compendium-ru/` | 1     | 109 pp                                 | the Compendium in Russian            |
| `wujek_1599_ia/` | 1     | 2,139 pp                               | the 1599 Wujek Bible, Polish         |

`ccc-mg` is the odd one: Malagasy was ingested from HTML, so its PDF is redundant as a source. It is not worthless — it is a free cross-check on an edition nobody working here can read, which is exactly the edition a silent parse defect would survive in.

`compendium-lt` is the file `CLAUDE.md` already warns about from the other direction: `catechism_lt` on vatican.va is **Latin**, and `compendium_catech_lit.pdf` two directories away is **Lithuanian**. Both expansions are plausible and nothing else in the corpus disambiguates them.

## 2. What is not on disk yet

Six editions that vatican.va publishes as PDF and as nothing else. They are recorded in `pipeline/translations-checked.json` with the `pdf-only` status added the same day (`docs/corpus-schema.md` #Documents):

| Work                            | Language | PDF                                                    |
| ------------------------------- | -------- | ------------------------------------------------------ |
| `exhortation.amoris-laetitia`   | en       | `..._amoris-laetitia_en.pdf`                           |
| `exhortation.verbum-domini`     | la       | `..._verbum-domini_lt.pdf` (mirror code: `lt` = Latin) |
| `exhortation.africae-munus`     | ar       | `..._africae-munus_ar.pdf`                             |
| `exhortation.evangelii-gaudium` | ar       | `..._evangelii-gaudium_ar.pdf`                         |
| `encyclical.lumen-fidei`        | ar       | `..._enciclica-lumen-fidei_ar.pdf`                     |
| `encyclical.lumen-fidei`        | pl       | `..._enciclica-lumen-fidei_pl.pdf`                     |

The evidence that each is a real edition rather than a stray link is that the `/content/dam/` href's **language suffix matches the page it sits on**; every page also links its siblings' PDFs, so the suffix is what makes it evidence. Fetching all six is six requests.

**`amoris-laetitia.en` is the case that makes this worth doing.** The scraper has known about it since `STUB_CONTENT_MIN_CHARS` was written — the comment names the document — but knowing meant only that the page was correctly refused, not that the text was anywhere.

## 3. Text layers: measured, not assumed

Probed with `pdftotext` purely as an availability test (the extractor for production is §5's question, not this one):

| File                             | Producer             | First pages extract            |
| -------------------------------- | -------------------- | ------------------------------ |
| `ccc-ar/prefazione_1-25.pdf`     | Microsoft Word 2016  | Arabic text, **mangled order** |
| `ccc-zh/03_0050-0141_ccc_zh.pdf` | Acrobat Distiller 11 | clean, **§ numbers intact**    |
| `ccc-mg/catechism_mg.pdf`        | Acrobat Distiller 7  | clean                          |
| `compendium-be/…`                | Acrobat Distiller 7  | 4,299 chars / 5 pp             |
| `compendium-id/…`                | Adobe PDF Library 8  | 4,098 chars / 5 pp             |
| `compendium-lt/…`                | Adobe PDF Library 7  | 3,909 chars / 5 pp             |
| `compendium-ru/…`                | Acrobat Distiller 5  | 21,838 chars / 5 pp            |
| `wujek_1599_ia/…`                | Ghostscript 10       | **0 chars — image only**       |
| `amoris-laetitia_en.pdf` (live)  | Adobe PDF Library 11 | clean, **§ numbers intact**    |

Two findings carry the whole plan:

**The Chinese and the English extract with their paragraph numbers.** `50. 人藉著自然的理智…` and `29. With a gaze of faith and love…` come out of the extractor already carrying the address the corpus is built on. The numbering matches the HTML editions, so every one of these files has a free correctness oracle sitting beside it.

**The Arabic does not round-trip.** `pdftotext` returns visual-order presentation forms with bidi control characters interleaved — readable to a human squinting at it, wrong as stored text. That is a property of the extractor rather than of the file, and it is the go/no-go for §5.

## 4. What it would be worth

| Family     | Editions           | Units each | Notes                                                                          |
| ---------- | ------------------ | ---------- | ------------------------------------------------------------------------------ |
| Catechism  | 2 (ar, zh)         | 2,865      | two whole editions; `ar` and `zh` are content languages the site has never had |
| Compendium | 4 (be, id, lt, ru) | 598        | `ru` already has full site chrome and no Compendium                            |
| Documents  | 6                  | 8–325      | includes the English _Amoris Laetitia_                                         |

Roughly 10,000 addressable units. For comparison, the entire ten-language Magisterium expansion that prompted this survey was 1,237 editions but only ~90,000 units, and most of those editions print no paragraph numbers at all.

Four of these are **new content languages** (`zh`, `id`, `be`, and arguably `lt`), which by the rule in `CLAUDE.md` means a line in `LANGUAGE_NAMES` in the same commit, and by the rule in `refs-grammar.ts` means measuring what the English fallback reads in them before shipping — the `1 Joh` lesson, where three editions had every First-John citation resolve to the Gospel.

## 5. The decision that has to be made first

**Extraction must be reproducible, and `pdftotext` from `PATH` is not.**

`CLAUDE.md` records the precedent at length. 202 of the 241 Doré anchors came from tesseract reading a caption, and the problem was not that OCR is inaccurate — it is that **a different engine build reads a digit differently**, silently, with no diff anywhere, because the output lived in `build/`. The answer there was to stop deriving the value and commit it.

Text-layer extraction is a much better-behaved operation than OCR: it reads embedded glyph codes rather than classifying pixels, so the characters are stable. But **the layout algorithm is not** — column detection, line joining and reading order all change between poppler releases, and nothing in this repository pins poppler. The corpus README's rebuild recipe is supposed to be the only way back to `build/`; a recipe whose output depends on the machine's poppler version is not a recipe.

So: **a version-pinned Python library declared in the scraper's PEP 723 `dependencies`**, the same way every other pinned thing in this pipeline is pinned. That is a departure — the scrapers are stdlib-only today — and it is the right one, because the alternative is an unpinned dependency on a binary that happens to be installed.

The first spike is therefore not "write a reader" but **"prove one library on three pages"**: an Arabic CCC part (does it round-trip to logical order?), a Chinese part (is the column order right?), and one _Amoris Laetitia_ page (are footnotes separable from body?). That spike is a day, and it decides whether Arabic is in scope at all.

## 6. What the reader has to do beyond extracting text

Visible in the _Amoris Laetitia_ probe, and each of these is ordinary work rather than a risk:

- **Page numbers land as their own lines** mid-text (`20`, `21` between paragraphs). Detectable by position and by being a bare integer matching the page index.
- **Hyphenation across a narrow measure.** These are two-column-width settings and words break across lines.
- **Footnotes.** _Amoris Laetitia_ carries ~390. The HTML parser already has `find_footnote_region_start`; the PDF equivalent is per-page rather than per-document, which is a different shape.
- **Front and back matter.** The Malagasy Catechism opens with a bishops' conference imprint and a copyright notice before any Catechism text; `ccc-ar` splits its front matter into its own file, which is a convenience.
- **Part-file boundaries.** `ccc-zh`'s 43 files and `ccc-ar`'s 5 each carry their own headers and page numbering, and the units run across them.

## 7. Sequencing, if it is built

1. **Spike the extractor** on the three hard pages above. Go/no-go on Arabic.
2. **`common/pdf.py`** — pages → blocks, with page-number stripping, de-hyphenation and footnote-rule detection. Shared by everything below.
3. **Documents first.** Six editions, smallest surface, and the schema already fits: `sources[]` takes a PDF URL unchanged. Validate against the HTML siblings — _Amoris Laetitia_'s numbering must match the 325 sections its eight HTML editions agree on, which is an oracle no other family gives for free.
4. **Compendium next.** Fixed 1–598 address space, four editions. Note the vacuous-oracle warning in `CLAUDE.md`: a fixed address space can never disagree, so the checks that earn their keep are `audit.py balance` (per-unit length against the other 45 pairs) and the division comparison, not the unit-number sets.
5. **Catechism last.** 2,865 §§ across 48 part-files; most work, most boundary handling. `ccc-mg` is the free rehearsal — parse it and diff against the HTML edition already in the corpus, and the diff is a pure measure of the PDF reader.
6. **Not Wujek.** A 1599 blackletter scan is an OCR project with its own reconciliation problem, and this repository has already learned where that ends.

## 8. The open question

**Is a PDF-sourced edition publishable on equal terms with an HTML one, or does it land switched off in `site/unpublished.json` until someone has read it?**

Not resolved here. The English _Amoris Laetitia_ is what forces it: withholding it keeps the corpus's standard, and publishing it fills the most visible hole in the English shelf. The honest position is probably that a PDF-sourced edition ships only where a sibling edition exists to check it against — which is true for all six documents and for both Catechisms, and false for exactly the four Compendia in languages nobody here reads.
