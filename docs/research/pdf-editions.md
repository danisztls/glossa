# Editions published as PDF

Survey conducted 2026-08-29 (Claude, read-only against files already in `glossa-corpus/raw/`, plus one live probe fetch of the English _Amoris Laetitia_ PDF). Companion to `vatican-documents.md` and `catholic-growth-and-catechism-languages.md`. Written because the ten-language Magisterium ingestion turned up a class of absence the corpus had no vocabulary for: **an edition that exists and that we cannot read.**

**Status, 2026-09-01**: the four Compendia are **built and shipping** — `compendium.{be,id,lt,ru}`, 598 questions each, all four passing `validate`. The Catechism's Arabic and Chinese editions and the six documents are still deferred. §5 and §8 below were the two decisions this survey said had to be made first; both were made differently from the recommendation here, and §§5a and 8a record what actually decided them. Everything above those sections is the original survey and still stands.

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

## 5a. What was actually decided (2026-09-01)

**§5's recommendation was not followed, and the reason is that no single library can read these four files.** The measurement that settles it is the one §3 could not reach, because it probed only first pages with one tool:

- The **Indonesian** file still carries the ITALIAN original as invisible text. poppler emits it, interleaved with the Indonesian — page 19 reads `1. Qual è il disegno di Dio per l'uomo?` woven through `Apa rencana Allah untuk manusia?`. MuPDF honours the render mode and never sees it. There is no optional-content group, so nothing declares the layer hidden.
- The **Russian** file's fonts carry no `ToUnicode` map. MuPDF refuses every glyph and answers U+FFFD; poppler passes the underlying byte through, and the custom encoding turns out to be **cp1251**, so the text is fully recoverable by re-decoding.

Pinning one library would therefore have shipped a bilingual Indonesian corpus or no Russian one. **The backend is a per-edition declared value** (`PDF_EDITIONS` in `pipeline/scrapers/ccc/compendium_pdf.py`), and both readers are system binaries invoked through `common/binaries.py`.

**The reproducibility concern §5 raised is real and is closed differently.** `rebuild.py` gained a `readers` fingerprint: `Stage.binaries` names the external programs a stage shells out to, and their identity — the **content hash of the resolved executable**, not a `--version` string, which a distribution can leave unchanged while rebuilding the package — is folded into `--changed-only`. A poppler or MuPDF upgrade now reports as `readers` moved, exactly as an edited parser reports `code`. `dore`'s `avifenc` had the identical unguarded exposure and was retrofitted in the same change.

**What the spike would not have caught.** §5 proposed proving one library on three pages. Every bug this reader actually had was invisible at that scale, and each produced plausible output rather than damage:

| Defect                                                  | What it looked like                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Merging line fragments before splitting the columns     | the margin glued onto the body — they sit 4.1pt apart, closer than the spaces inside a line — costing 118 of 288 questions their references |
| Grouping rows by bounding-box top instead of baseline   | "Krikščioniškojo slėpinio šventimas" as "kščionišk ėp Kri ojo sl inio šventimas"                                                            |
| Bounding the body at the first `1.`                     | the preface numbers its own paragraphs 1–6, so the work opened at question 7                                                                |
| A 2pt kerning gap after a drop cap read as a word space | "Pirmas poskyris" as "P irmas poskyris"; the heading stopped matching and the work lost a chapter                                           |
| The Decalogue printed as a numbered list                | a second Q1 after Q357                                                                                                                      |
| A symmetric head/foot furniture strip                   | the Indonesian runs text to a tenth of the page bottom; answers ended mid-phrase                                                            |
| Assuming the text block mirrors by page **parity**      | true of the Lithuanian, false of the Byelorussian, whose front matter has a different leaf count                                            |

What caught them was not a spike but the two oracles in §7 step 4, which is the part of this survey that held up best.

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

## 8a. How it resolved (2026-09-01)

**The last clause was wrong, and pleasantly so: the four Compendia have the strongest sibling check in the corpus.** "A language nobody here reads" is not the same as "an edition nothing can check", because the Compendium's cross-reference apparatus is language-independent. Question N is the same question in all fourteen editions, so the CCC paragraph numbers printed in the margin must agree digit for digit with what the ten HTML editions already store as `ccc_refs`:

| Edition         | Questions | `ccc_refs` present | Agreeing with `compendium.it` |
| --------------- | --------- | ------------------ | ----------------------------- |
| `compendium.be` | 598       | 598                | 584                           |
| `compendium.id` | 598       | 590                | 572                           |
| `compendium.lt` | 598       | 574                | 565                           |
| `compendium.ru` | 598       | 598                | 573                           |

Some of the disagreement is the **Italian's**, not ours: five questions have no reference line in that edition at all (Q361 and Q563–Q566, a defect already recorded in its own `LANG_CONFIG` notes), and four more are Italian misprints the new editions read correctly — `1198-1999` for 1198-1199 at Q245, `2617; 2018` for 2617-2618 at Q546, `2050-2051` for 2650-2651 at Q557, `2658` for 2758 at Q577.

The second oracle is `audit.py balance`, and it is what §7 step 4 predicted: it caught the Compendium's full-page art plates being absorbed into the last question of each part, which made Q217, Q356 and Q533 six to eight times longer than the same answer in every other edition. **All four editions now sit inside the same skew band as the ten HTML ones, with no outliers.**

So all four ship, unswitched. `site/unpublished.json` stays empty of them. The rule the survey was reaching for is sharper than it guessed: a PDF-sourced edition ships where **something in it can be checked against a sibling** — which need not be its prose, and here is its apparatus.

## 8b. What the four editions do NOT carry (2026-09-01)

Recorded so nobody re-derives it. None of this fails `validate`; all four editions pass, and every number below was measured against `compendium.it`, which is the reference throughout.

**Epigraphs and run-in sub-headings are partial, and precise where they exist.** The work closes many answers with a patristic epigraph and heads runs of questions with an italic or capitalised sub-heading. Both were folded into the answers' prose until this pass.

|                             | quote blocks | attributed | matching `it` | false positives | `sub` nodes |
| --------------------------- | ------------ | ---------- | ------------- | --------------- | ----------- |
| `compendium.it` (reference) | 24           | —          | —             | —               | 82          |
| `compendium.lt`             | 17           | 17         | 17            | 0               | 18          |
| `compendium.be`             | 16           | 16         | 16            | 0               | 17          |
| `compendium.id`             | 5            | 5          | 5             | 0               | 14          |
| `compendium.ru`             | 0            | 0          | 0             | 0               | 0           |

**Precision is total and recall is not**, which is the right way round for a corpus: every block emitted is one the Italian also marks. What is missed is an epigraph these editions set in roman, or one whose lines the reader did not group into a single run. The Indonesian is the weakest because it centres each line of an epigraph separately.

Three things about the discriminator are worth keeping, because each was arrived at by being wrong first:

- **Italic alone over-detects by more than twice** — 59 blocks against 24 — because these editions also italicise Latin phrases inside a sentence (`Fiat mihi secundum Verbum tuum`), liturgical incipits, and the run-in sub-headings themselves.
- **Position is most of the answer.** All 24 of the Italian's quote blocks are the LAST block of their answer; an italic run anywhere else is emphasis. But a trailing sub-heading sits after the epigraph where a chapter has both, so the headings have to come off first or they push the epigraph out of last place — that alone lost nine of the Indonesian's.
- **Neither quotation marks nor final punctuation separates an epigraph from a heading. Length does.** The Creed's article headings quote the Creed, so `„Amen“` carries marks and is a heading; three of the work's headings are questions ending in `?`. The Italian's shortest epigraph is 40 characters and every run-in heading is shorter, so the rule is length **and** marks together.

**The Russian carries neither**, and it is a limit of the reader rather than of the book. It sets its epigraphs in italic like the other three — `BPCABA+MSTT31c666` against the body's `BPCBHO+MSTT31c658` — but `pdftotext -bbox-layout` reports no font at all, and its quotation indent is identical to its paragraph first-line indent (137.5 against a 123.3 measure), so nothing left in the stream separates them. The fix is a backend that reports a face: `pdftohtml -xml` gives a font id per run **and its own page dimensions**, which would also retire the `/Rotate` special case in `page_boxes`. It would replace `-bbox-layout` here rather than supplement it, and the risk is re-tuning the two-up split and the furniture strip against a different coordinate space.

**`sub` nodes are 14–18 against the Italian's 82.** Only the italic and fully-capitalised headings are found; most of this work's sub-headings are set some other way in these editions. The tree is correct as far as it goes — `validate`'s skeleton check passes and the part/section/chapter spine is complete in all four — but it is not the Italian's tree.

**Two smaller residues.** The Lithuanian is missing 24 of its 598 `ccc_refs`: its right margin edge wanders more than the other three, and this was tuned rather than solved — raising `ANCHOR_BANDS` from 2 to 8 made it _worse_ (438 refs), because a page whose own measurement puts the edge a few points wide swallows the margin into the body. And the Russian's small-caps repair leaves `МЫ ВЕРУЕМ` as `МЫВЕРУЕМ` where a heading is set entirely in small capitals rather than with a single raised initial.

## 9. What is left

The four Compendia are done. Still deferred, with the measurements taken 2026-08-31:

- **The Chinese Catechism** — 43 files, each filename declaring its own paragraph range, which is a free coverage assertion. A naive scan finds 2,859 of 2,865, and **all six gaps are now explained**: §2256 and §2554 run the number into the previous line (parser tolerance); §1224 and §1478 omit the period after the number and §2835 is **printed `3835`** (three source defects for `pipeline/corrections/`); and **§1725 is genuinely absent from the edition** — the `撮要` (IN BRIEF) heading sits exactly where it belongs and the sequence runs 1724 → 撮要 → 1726, so it is a source omission to document, not to fix. It prints **no footnote apparatus at all** — no markers, no note blocks, no `PG`/`DV`/`LG` anywhere, and only two font sizes, 12pt body and 10.98pt inset quotation — so `citations: []` by construction. It folds Scripture into the running text (`創 10:5`, `希 1:1-2`), so publishing it needs a `zh` book table in `refs-grammar.ts`, and no CJK webfont is shipped. **It is the easiest of the six to extract and the hardest to publish**; keep those two judgements apart when it is picked up.
- **The Arabic Catechism** — 5 files mapping onto the Prologue and the four Parts. 2,852 of 2,865 paragraph numbers once the regex tolerates a combining mark or `«` between the bidi controls and the number, leaving 13 to read individually. **poppler only**: MuPDF fragments RTL lines, splitting single words across three. Also prints no footnote apparatus. §3's "does not round-trip" finding is confirmed and quantified — the Allah ligature decomposes in visual order, giving **2,312 occurrences of `هللا` for `الله` and 2,561 of `هلل`, against 30 correct spellings**. The text's commonest word is mis-spelled roughly 4,900 times before any normalisation, which is why it is deferred and why its normalisation must stay separable from extraction.
- **The six documents**, including the English _Amoris Laetitia_. Untouched by this pass. §7 step 3 still reads correctly, and the `common/pdf.py` it wanted now exists.
