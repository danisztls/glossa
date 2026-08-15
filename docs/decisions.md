# Decision log

## 2026-08-13/14 — Project scoping

**What**: a free reading/reference site for the Catechism of the Catholic Church, the Bible, encyclicals and other magisterial documents. Excellent UX; desktop, mobile, and PWA. English first, then Portuguese.

**Copyright posture** (see `research/copyright.md`): host Church-owned texts (CCC, encyclicals) verbatim with full attribution without prior permission; comply promptly if a rights holder asks. This is a deliberate political statement in the "Free the Word" lineage. The posture applies to Church-owned material only — Bible translations owned by commercial publishers are out of scope for it; those must be public domain (one accepted exception below). Site stays free, ad-free, account-free, with a colophon stating the position and a contact address.

**Architecture consequences**:

- Scraped/copyrighted corpus lives outside the public git repo (fetched at build, gitignored); only code is published (MIT).
- Every document carries provenance metadata: source URL, retrieval date, edition.
- Any work can be individually unpublished or degraded to a link-out to vatican.va without rearchitecting.
- Text is always verbatim, complete, never serialized, with exact copyright notices.
- Scraping vatican.va: respect `Crawl-delay: 2`.

**Bible lineup** (see `research/bible-texts.md`):

- English: **CPDV** (modern, PD, passes the no-demythologizing test; known caveats documented).
- Portuguese: **Matos Soares 1956** (modern register, orthodox; copyrighted until 31 Dec 2027 — knowingly accepted, self-resolving exposure).
- Later candidates: Douay-Rheims Challoner, Clementine Vulgate, Figueiredo 1950 (text only — its notes are on the Index).
- Rejected: WEB Catholic Edition (Luke 1:28 "highly favored" fails the litmus test).

**Name**: **Depositum** (decided 2026-08-14), from _depositum fidei_ — the deposit of faith. Chosen over `scriptura` (three existing Bible apps share that name; evokes _sola scriptura_) and Fontes. Taken in this niche: Verbum, Magisterium, Catena, Laudate, Lectio. Repo directory to be renamed `~/Dev/me/depositum` (outside a live session).

## 2026-08-14 — Scope, UX, stack

**v1 scope**: Bible + CCC + Compendium of the CCC (added 2026-08-14), both languages (EN: CPDV; PT: Matos Soares 1956). Flagship feature: **bidirectional cross-linking** between CCC scripture citations and verses (citation in a CCC paragraph → verse popover; verse page → "cited in CCC §…" reverse index). Encyclicals are v2, reusing the same pipeline.

**UX model**: two explicit modes.

- _Reading mode_: continuous, book-like, distraction-free; remembers position per work (localStorage — no accounts).
- _Lookup mode_: omnipresent jump box accepting references (`ccc 1324`, `john 3:16`, `jo 3,16`), full-text search (prebuilt client-side index), stable guessable deep links (`/ccc/1324`, `/bible/john/3#16`) for every paragraph and verse.
- Parallel view: EN/PT side by side; Vulgate column later. Footnotes as sidenotes on desktop, tap-popovers on mobile.

**Offline**: **offline-first PWA** — entire library (~10–15 MB) cached on device after first visit. Committed early because it constrains architecture favorably.

**Design**: hybrid, leaning classical — liturgical/medieval aesthetics for the text (serif, drop caps, ornaments) with modern chrome where it makes sense. Light/dark/sepia themes; print stylesheets. Details decided with mockups.

**Stack**: **SvelteKit + static adapter**. Chosen over Vue/Nuxt for: minimal shipped JS (offline-first on mid-range phones), built-in transitions/animations for reader polish, stores for the many small coordinated behaviors (popovers, scroll sync, jump box, position persistence), built-in service worker support, full-corpus prerendering. Vue was the safer-ecosystem alternative; nothing here needs that depth.

**Architecture**: two layers, cleanly separated.

1. **Corpus pipeline**: scrapers → normalized canonical schema (work / division / unit, stable IDs, provenance metadata). Corpus lives outside the public repo (gitignored, fetched/built locally).
2. **Site**: compiles whatever corpus it is given into prerendered static pages + JSON. i18n decouples UI language from content language (URL carries content choice, setting carries UI language).

**Deferred**: name/domain, hosting provider, colophon text, analytics (default: none — strengthens the colophon's privacy statement).

## 2026-08-14 — Language symmetry principle

Language switching anchors on **canonical, language-independent unit IDs**: CCC paragraph number (1–2865), OSIS book+chapter+verse (Vulgate psalm numbering in both v1 editions), Compendium question number (1–598). The toggle keeps the ID, swaps the language — the reader never loses their place. Structure trees (TOC/breadcrumbs) stay **per-language and source-faithful**: the vatican.va editions genuinely diverge in a few article groupings and In-Brief granularity, and we render each language's real tree rather than forcing false symmetry; navigation never breaks because breadcrumbs are derived from the unit ID per-language. Corollary: source typos in unit _numbers_ (PT ¶2217 printed "2117", ¶2439 printed "1439") are corrected as metadata to preserve the shared address space, while body text stays verbatim.

## 2026-08-14 — Source-defect corrections policy

Amends pure-verbatim: **verified source defects are corrected, and every correction is auditable.** Corrections live as data in the repo (`pipeline/corrections/{work_id}.json` — committed, so git history is the audit log), each entry carrying locator, exact before/after, reason, and evidence (parallel-language reading, other-edition reading, or linguistic impossibility). Scrapers apply them post-parse and fail loudly if a correction's `from` text no longer matches the source (drift guard). Each work's output includes `corrections-applied.json` (the receipt) and the manifest counts applied corrections. Only mechanical/typographic defects qualify (OCR artifacts, digit typos, marker mismatches) — never wording, never modernization.
