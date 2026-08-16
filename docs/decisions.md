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

**Offline**: **offline-first PWA** — entire library cached on device after first visit. Committed early because it constrains architecture favorably. (The "~10–15 MB" figure below was an early estimate made before any corpus existed; corrected to real measurements in the 2026-08-15 "Offline caching implementation" entry below — it was low by roughly 4x uncompressed, though close on the wire once gzipped.)

**Design**: hybrid, leaning classical — liturgical/medieval aesthetics for the text (serif, drop caps, ornaments) with modern chrome where it makes sense. Light/dark/sepia themes; print stylesheets. Details decided with mockups.

**Stack**: **SvelteKit + static adapter**. Chosen over Vue/Nuxt for: minimal shipped JS (offline-first on mid-range phones), built-in transitions/animations for reader polish, stores for the many small coordinated behaviors (popovers, scroll sync, jump box, position persistence), built-in service worker support, full-corpus prerendering. Vue was the safer-ecosystem alternative; nothing here needs that depth.

**Architecture**: two layers, cleanly separated.

1. **Corpus pipeline**: scrapers → normalized canonical schema (work / division / unit, stable IDs, provenance metadata). Corpus lives outside the public repo (gitignored, fetched/built locally).
2. **Site**: compiles whatever corpus it is given into prerendered static pages + JSON. ~~i18n decouples UI language from content language (URL carries content choice, setting carries UI language)~~ — reversed 2026-08-15, see below.

**Deferred**: name/domain, hosting provider, colophon text, analytics (default: none — strengthens the colophon's privacy statement).

## 2026-08-14 — Language symmetry principle

Language switching anchors on **canonical, language-independent unit IDs**: CCC paragraph number (1–2865), OSIS book+chapter+verse (Vulgate psalm numbering in both v1 editions), Compendium question number (1–598). The toggle keeps the ID, swaps the language — the reader never loses their place. Structure trees (TOC/breadcrumbs) stay **per-language and source-faithful**: the vatican.va editions genuinely diverge in a few article groupings and In-Brief granularity, and we render each language's real tree rather than forcing false symmetry; navigation never breaks because breadcrumbs are derived from the unit ID per-language. Corollary: source typos in unit _numbers_ (PT ¶2217 printed "2117", ¶2439 printed "1439") are corrected as metadata to preserve the shared address space, while body text stays verbatim.

## 2026-08-14 — Source-defect corrections policy

Amends pure-verbatim: **verified source defects are corrected, and every correction is auditable.** Corrections live as data in the repo (`pipeline/corrections/{work_id}.json` — committed, so git history is the audit log), each entry carrying locator, exact before/after, reason, and evidence (parallel-language reading, other-edition reading, or linguistic impossibility). Scrapers apply them post-parse and fail loudly if a correction's `from` text no longer matches the source (drift guard). Each work's output includes `corrections-applied.json` (the receipt) and the manifest counts applied corrections. Only mechanical/typographic defects qualify (OCR artifacts, digit typos, marker mismatches) — never wording, never modernization.

## 2026-08-15 — Content language follows UI language

**What**: reverses the 2026-08-14 line above ("i18n decouples UI language from content language"). One language switch now drives both chrome and default content edition (`$lib/content.svelte.ts`, `corpus.defaultWorkId`), with an explicit per-work-type edition override scoped to the UI language it was chosen under — a reader can read the Portuguese Bible under an English interface, but switching the interface language resets to that language's default edition rather than silently keeping a stale pick.

**Why**: fewer surprising states, one primary "which language am I in" control, with the version/edition selector kept as the deliberate escape hatch for a reader who wants a specific edition regardless of interface language.

**Consequence for URLs — CCC/Compendium vs. Bible differ, deliberately**: CCC and Compendium URLs stay edition-free (`/ccc/1234`, `/compendium/1`) and resolve the edition client-side from the stored preference, so every prerendered page embeds all languages of that item. The Bible keeps its edition in the URL (`/bible/{edition}/{book}/{chapter}`). The difference isn't arbitrary: for the CCC and Compendium, language and edition are the same axis — one canonical LEV/USCCB-equivalent translation per language, so leaving edition out of the URL loses no addressing information. The Bible lineup already has (or plans) more than one edition _per language_ (CPDV now, Douay-Rheims/Clementine Vulgate later for English; Matos Soares now, Figueiredo later for Portuguese — see `research/bible-texts.md`), so language alone doesn't determine which edition a bare `/bible/john/3` means. Edition has to stay an explicit URL segment for the Bible for as long as that's true.

## 2026-08-15 — Vatican documents in scope

**What**: scopes the "encyclicals and other Vatican documents with doctrinal value" item from the original brief (`2026-08-13/14 — Project scoping`) to **all encyclicals, across all pontificates, plus the 16 Vatican II documents** — broader than the ~90-encyclical figure assumed at scoping time.

**Why / what the survey found** (`research/vatican-documents.md`, 2026-08-15): one parser family covers Vatican II's constitutions/decrees/declarations, encyclicals (tested 1891–2015), apostolic exhortations, and CDF/DDF declarations — the same inline-digit paragraph numbering `ccc.py` already parses defensively, needing only two more regex branches (survey §3). Numbering is reliably, completely addressable in every document family tested (survey §3). The corpus is materially larger than assumed: **~250–300 encyclicals** across all pontificates (survey §2, per-pontificate index audit), not ~90. Portuguese coverage collapses for older pontificates — **Leo XIII 17%, Pius XII 83%, John Paul II and Francis 100%** (survey §2) — so a substantial part of the corpus lands English-only. This bends the language-symmetry principle (2026-08-14 entry above) but is an accepted, documented exception: the existing "any work can be individually unpublished or degraded" architecture (2026-08-13/14 entry) already handles a work missing one language without rearchitecting.

**Explicitly out of scope**, each for a reason the survey establishes:

- **Code of Canon Law**: no Portuguese edition on vatican.va at all — Italian and Spanish exist, Portuguese doesn't (survey §2) — despite 264 CCC citations to CIC canons (survey §1c). A hard language-symmetry blocker, not a doctrinal-weight judgment.
- **Denzinger**: 502 CCC citations, the single most-cited non-scripture, non-AAS siglum (survey §1d), but Herder-copyrighted and never a vatican.va publication (survey §2) — out of reach for a vatican.va-sourced pipeline regardless of citation weight.
- **Roman Catechism and Vatican Council I**: not found on vatican.va under any URL pattern tried (survey §2); Vatican I's absence specifically is not conclusively confirmed (no sitemap search attempted), just not surfaced.
- **General audiences**: confirmed to exist (per-pontificate, per-year index pages, survey §2) but excluded on volume (thousands of individual talks across decades) and lower doctrinal-citation density relative to encyclicals and conciliar documents.

## 2026-08-15 — Deep-link format amendment

**What**: amends the 2026-08-14 example `/bible/john/3#16` to match the implementation, `/bible/{edition}/{book}/{chapter}#v{n}` (e.g. `/bible/cpdv.en/john/3#v16`).

**Why**: the original example predates the edition-in-URL decision above — editions need addressing, so the path needs an edition segment regardless. And a bare `#16` fragment is ambiguous (does it name a verse, a footnote marker, some other numbered anchor on the page?) and collides with the browser's native "scroll to the element whose `id` is `16`" behavior if more than one such id exists on a page; `#v16` makes the fragment self-describing and collision-free.

## 2026-08-15 — Icon library: Lucide

**What**: `@lucide/svelte` (MIT), inline tree-shaken SVG, wrapped behind `$lib/components/Icon.svelte` so the choice is reversible in one file.

**Why, over Font Awesome Free**: MIT license vs. Font Awesome Free's CC-BY-4.0, which requires attribution the site would have to surface somewhere for every icon used. Inline SVG (~1KB/icon, only the icons actually used ship) vs. a 100KB+ webfont bundle loaded whole regardless of how many glyphs are drawn from it. No runtime network fetch for either the font file or the SVGs — which the offline-first PWA commitment (2026-08-14 entry above) effectively requires anyway, so this wasn't really a close call once that commitment was made.

## 2026-08-15 — Offline caching implementation

**What**: builds the offline-first PWA committed to in the 2026-08-14 entry above: `site/src/service-worker.ts` (SvelteKit's `$service-worker` module, auto-registered in production builds), `static/manifest.webmanifest`, generated app icons (`static/icons/`), and a standalone `static/offline.html` fallback. See `site/README.md` "Offline / service worker" for how to test this locally.

**Corrected figures** (the 2026-08-14 entry's "~10–15 MB" was a pre-corpus estimate): against the real corpus (Bible × 2 editions, CCC × 2, Compendium × 2, plus the 16 Vatican II documents now in the corpus — see "Vatican documents in scope" above), a full build emits **6,134 prerendered HTML pages totalling ~216 MB**, and bundles all corpus data into **one ~17.9 MB raw / ~4.7 MB gzipped JS chunk** (`_app/immutable/chunks/*.js` — see `src/lib/corpus.ts`'s `import.meta.glob({ eager: true })`). Estimate was low by roughly 4x uncompressed; close to right once gzipped, which is what actually crosses the wire on first visit.

**The caching strategy cannot precache the prerendered set** (216 MB blows past Cache Storage quotas on constrained browsers — iOS Safari evicts under pressure starting around 1 GB) **and deliberately doesn't try to**: those pages exist for first paint, SEO, and no-JS readers, not for the offline path. Instead the service worker precaches two things and nothing else:

- **Content tier** (`depositum-content` cache, unversioned, never swept on deploy — evicted only by explicit user action): today, the one big corpus JS chunk, classified out of the SvelteKit build's `build` list at install time by measured response size (>1 MB — the next-largest legitimate chunk observed was ~52 KB, three orders of magnitude smaller). This is the tier the "entire library on device" commitment is actually about, and it's written to survive routine app updates the way a downloaded book should.
- **Shell tier** (`depositum-shell-{version}` cache, versioned off SvelteKit's build `version`, swept on every `activate`): the rest of the build's JS/CSS, `static/`'s assets (manifest, icons, `offline.html`, `robots.txt`), and — the one deliberate exception to "never cache a prerendered page" — the home page's HTML, used purely as an offline navigation's boot document. A navigation to a URL that was never fetched before, made while offline, is served this cached home page; the app's own client-side router then renders the actually-requested page from the content tier already in memory, with no further network request (this is the same recovery mechanism `adapter-static`'s own SPA `fallback` option relies on — this project doesn't use that option, see `vite.config.ts`'s `fallback: undefined` and its "strict prerendering" rationale — applied here by hand, for exactly one page).

**The assumption this rests on, stated once and pointed at from the code** (`site/src/service-worker.ts`'s "CONTENT TIER POLICY" comment block is the single place this lives): all corpus data is currently inlined into client JS by `corpus.ts`'s eager glob, so the content/shell split can be done by chunk size alone. When corpus data moves to per-work `fetch()`-loaded JSON under a `/data/` prefix (flagged as planned in `corpus.ts`'s own docblock — deliberately not done in this change), the size-sniffing classifier stops working and needs to be replaced with an explicit `/data/manifest.json` listing of per-work files; nothing else in the service worker needs to change.

**Update/activation policy**: no `skipWaiting()` — a reader mid-chapter shouldn't have assets swapped under an open tab; a new version takes over only once every tab on the old version has closed or navigated away (browser default), then claims clients on `activate`.

**Sketched, not built**: a `message` handler in the service worker (`CACHE_CONTENT` / `CLEAR_CONTENT`) is the hook a future per-work "make this work available offline" control would call — real per-work sizes (~1.6–1.7 MB gzipped per complete Bible edition, well under 1 MB for CCC or Compendium) become meaningful once the `/data/` split above lands; today "cache a work" and "cache everything" are the same operation. No UI was built for this in this change.

**Verified**: `npm run check` and `npm test` pass; a real-corpus build (`CORPUS_DIR=../corpus npm run build`) completes with zero prerender errors and emits `build/service-worker.js`; `npm run preview` serves `service-worker.js` (`text/javascript`), `manifest.webmanifest` (`application/manifest+json`), and `offline.html` correctly, and the home page links the manifest and carries both light/dark `theme-color` meta tags. **Not verified** (no browser available in this environment): actual install/activate lifecycle, actual runtime classification of the content chunk into the right cache, and actual offline navigation/hydration-recovery behavior — these need a real browser (see `site/README.md`'s testing section for how to check them).

## 2026-08-15 — Latin as next source language, documented not built

**What**: Latin is the user's chosen next source language, added to `PLAN.md` as a planned phase. This entry records the decision and its scope; no pipeline or site code changes were made — `research/latin-sources.md` is a live-fetched availability survey only (methodology matching `research/vatican-documents.md`), and `PLAN.md`'s Latin phase lays out dependencies and open questions rather than a build plan. **Not implemented now** — deliberately: sequencing (documents UI, the encyclical sweep already crawling, reverse xrefs, search) comes first; see `PLAN.md`.

**What the survey found, briefly** (full detail, citations, retrieval dates in `research/latin-sources.md`): Latin is available on vatican.va for the Bible (Nova Vulgata — but Hebrew/Masoretic Psalm numbering, not the Vulgate numbering the corpus's versification system assumes), all 16 Vatican II documents, the CCC, and unevenly but non-trivially for encyclicals (Leo XIII: 64% Latin vs. only 17% Portuguese, since Latin is the actual promulgation language for that era, not a retrofitted translation). The Compendium has **no** Latin edition anywhere on vatican.va — confirmed absent, not unlinked. A second Latin Bible option, the Clementine Vulgate, isn't on vatican.va at all but lives at `sacredbible.org` (Ronald Conte's own site, same operator as the existing CPDV source) in a PD-disclaimed 1914 Hetzenauer edition — the exact Latin base CPDV was translated from, and one that already matches the corpus's Vulgate psalm-numbering convention, unlike Nova Vulgata.

**The architectural problem Latin raises, stated for whoever picks this up**: Latin would be Depositum's first _content_ language that is not also a _UI_ language — nobody wants a Latin interface, but readers will want the Latin text. This breaks the coupling adopted just one entry above ("Content language follows UI language," 2026-08-15): that decision made UI language the primary control and the edition override an escape hatch, reasonable when content languages and UI languages were the same two-element set (`en`/`pt`). Latin makes them different sets, so the override stops being an escape hatch for a whole class of readers and becomes their primary path to the content they actually want — while `content.svelte.ts`'s override is currently designed to reset itself the moment the UI language changes (by design, for the `en`/`pt` case), which is exactly the wrong behavior for a reader who deliberately picked Latin. It also surfaces two smaller, previously-invisible assumptions: `pipeline/scrapers/vatican_docs.py`'s `check_language_symmetry` hardcodes a two-language (`en`/`pt`) world in its work-ID regex and its pairwise comparison, and this entry's own "Language symmetry principle" (2026-08-14) describes a binary "toggle keeps the ID, swaps the language" — language that stops fitting once a third language exists for only some works, and once one of those languages (Latin, for conciliar/papal texts specifically) is the _normative_ text rather than a co-equal translation. `PLAN.md`'s architecture section lays out options (typing content language separately from UI language; making the override's reset-on-switch behavior conditional on whether the picked language is a UI language at all; generalizing the symmetry check to N languages, compared pairwise or against Latin as ground truth) and a recommendation — not decided here, since no code changes accompany this entry.

## 2026-08-16 — Per-work unpublish, built

**What**: the takedown mechanism the 2026-08-13/14 Architecture consequences required ("any work can be individually unpublished or degraded to a link-out to vatican.va without rearchitecting") now exists and has been exercised. It had been assumed, never built.

**Shape**: `site/unpublished.json`, a tracked data file mapping work id → `{ date, reason }`. Deliberately data and not code: responding to a rights holder should be an edit and a deploy by whoever is awake, not a patch. Keyed by **work id** rather than slug, because a request may concern one language edition and not another — `encyclical.laudato-si.en` can come down while `.pt` stays up, and that granularity is what "any work can be individually unpublished" actually means.

**What a takedown withholds**: everything derived from the work — reading text _and_ structure tree. `sync-corpus.mjs` reads the registry at the point where content is written and skips both, so they are absent from the build rather than hidden by the client. Only the manifest survives (title, language, rights holder's notice, source URL), which is bibliographic data _about_ the work rather than the work. Structure is withheld with the text on purpose: a table of contents is a map of a work's internal divisions, which is less than the text but more than nothing, and a takedown request is not an invitation to negotiate over how much we keep.

**What the reader gets**: the work's landing page still exists and renders a notice naming the work, the stated reason verbatim, the rights holder's own copyright line, and a link to the vatican.va page the text came from. Listings mark the work rather than hiding it — a document that silently vanishes from the library looks like a bug and invites someone to "fix" it. The notice is deliberately **not** styled as a warning or an error: amber banners would frame a rights holder exercising their rights as a fault and frame us as having been caught at something, when complying promptly is the normal, expected half of the posture adopted in the first entry above.

**What breaks, recorded rather than glossed**: per-section URLs (`/documents/{slug}/{n}`) stop being generated, since the structure they are enumerated from is gone, so an external bookmark to a section lands on the site's 404 rather than on the notice. Links from _inside_ the site do not break — `refs.ts` asks `documentSectionExists` before linking, which now answers false, so CCC citations quietly stop linking rather than pointing at nothing, and the build stays green under `handleHttpError: 'fail'`. Keeping section URLs alive would mean keeping the section numbers, i.e. keeping a map of the work's divisions; that trade was considered and not taken (see above).

**Why `unpublished.json` is also copied into the index tier**: the site needs to know a work is _unpublished_, not merely that its content files are missing. A partially-built corpus looks identical from the outside and wants the opposite treatment — a missing chunk should fail loudly in development, a taken-down work should render a calm, deliberate notice.

**A missing or malformed registry is a hard error** in `sync-corpus.mjs`, unlike every other input there, which degrades quietly when absent. Silently publishing a work somebody asked us to take down is the one failure this script must never produce.

**Verified** by taking a work down for real: with `encyclical.laudato-si.en` in the registry, a full real-corpus build exits 0, `corpus-data/content/encyclical.laudato-si.en/` is not written (while `.pt` still is — per-work granularity confirmed), no English Laudato Si' text appears anywhere in `build/`, and `documents/laudato-si.html` renders the notice, the stated reason and the vatican.va link. The registry was then emptied again; it ships with no entries.

## 2026-08-16 — Correction: what per-work unpublish is actually for

**Correcting the entry directly above**, which framed the mechanism built that day as the copyright takedown lever the 2026-08-13/14 Architecture consequences called for. That framing is wrong in one direction and misses the point in the other.

**A rights request from the Holy See would not be per-work.** Essentially the entire corpus outside the two Bible editions — the CCC, the Compendium, all 16 Vatican II documents, all 307 encyclical works — is Libreria Editrice Vaticana material under a single identical notice. A request from that rights holder would concern most of the site at once. Responding to it is a whole-site decision (stop publishing; degrade everything to link-outs; take the site down while it is discussed), and a file listing individual work ids is not the shape of that decision. The per-work mechanism does not become useless — it is exactly right for a request naming one document — but it should not be recorded as _the_ answer to the scenario the copyright posture actually anticipates, because someone reading that entry in a hurry would reach for the wrong tool. **No whole-site lever has been built**; that is a genuine open item, deliberately not speculated into existence here.

**What the mechanism is actually for is quality.** A work whose parse is damaged is worse than a work not published at all: the reader has no way to tell that what they are reading is incomplete. Measured across the 339 document works by how much of each work's own section numbering is missing — a direct signal, unlike cross-language mismatch, which conflates our parser with vatican.va's own truncation:

- **6 works have no sections at all** (`pascendi-dominici-gregis.pt`, `vigilanti-cura.en`, `miranda-prorsus.pt`, `mense-maio.pt`, `divini-illius-magistri.pt`, `quae-ad-nos.en`) — already documented individually in their own `manifest.notes`.
- **11 are missing ≥20% of their numbering**, all Portuguese, all matching the missing-`<p>` root cause in `research/vatican-documents.md` §7.1. The worst: `lumen-fidei.pt` (60%), `aeterna-dei.pt` (55%), `princeps.pt` (46%). The most consequential: **`humanae-vitae.pt`, missing 41%** — a heavily-read document shipping with two-fifths of its paragraphs silently absent.
- 5 more are missing 5–20%; the remaining 317 are under 5%.

**Consequences for the mechanism**: entries gain a `kind` (`quality` | `rights`, defaulting to `quality`), and the reader-facing notice branches on it. "We could not render this properly yet" and "the rights holder asked us to stop" are different statements about the same blank space, and a reader deciding whether to trust the rest of the corpus is owed the accurate one. The quality copy admits fault plainly — a site that hides its failures is asking to be trusted about the ones you cannot see — and points at vatican.va, which is what the reader wants anyway. Entries of this kind are expected to be **temporary**: the fix is to repair the parser and delete the entry, and §7.1 already describes what that repair involves.

**Withholding is still the right default over shipping a damaged text**, but it is a stopgap and must not become a way to make the validation numbers look better. Anything withheld for quality is a known bug with an owner, not a resolved item.
