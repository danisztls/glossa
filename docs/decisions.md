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

## 2026-08-16 — Renamed to Glossa Catholica

**What**: the site is **Glossa Catholica**. `Depositum` (named 2026-08-14, first entry above) is retired.

**Why the old name failed**: _Fidei Depositum_ is the apostolic constitution promulgating the Catechism — a document the site serves. `research/vatican-documents.md` §5 already places apostolic constitutions in the encyclical parser family, so it was a plausible future corpus member, and the CCC front matter is already inventoried as one in `link-surface.md`. A site named after a document inside its own library is ambiguous in exactly the places that matter: a listing, a search result, a citation. The defect was the **category** of name, not the language — a two-word Latin doctrinal phrase is the form papal documents take.

**The rule that follows, and cost us a second candidate**: do not name the site anything shaped like an incipit. This killed _Atrium Fidei_, proposed after _Depositum_ fell. `[noun] + fidei` is the pattern itself — and unlike the original collision, which was hypothetical, the corpus **already ships** `encyclical.lumen-fidei.{en,pt}` and `encyclical.fidei-donum.{en,pt}`. The replacement would have reproduced the defect against four works already on disk.

**Why _Glossa Catholica_**: the _Glossa Ordinaria_ is the medieval apparatus of cross-references and patristic commentary set around the sacred page — compiled and attributed, never the compiler's own voice. That is what this site already is (`refs.ts` is 1,362 lines, the largest module in `$lib`, and `link-surface.md` states the dense-linking thesis outright) and what it is planned to become: annotation from **Douay-Rheims Challoner**, already listed as a later Bible candidate in the first entry above. Neither word can be an incipit; both are transparent cognates in English and Portuguese, so the name does not need to localize.

**What was checked and rejected**, so nobody re-treads it: _Tolle Lege_ (`tollelege.ai` is a Catholic search over the Catechism, Scripture and Tradition — the same product; and Tolle Lege Press publishes the 1599 Geneva Bible); _Ambo_ (live B2B SaaS on `amboapp.com`); _Vereda_ (Editora Moderna's secondary-school study app — fatal in Brazil); _Lectern_ (three apps); _Lectica_ (means _litter/palanquin_, from _lectus_, not from _legere_ — and is taken by Lectica Inc. and a language app); _Bibliotheca Catholica_ (saturated: a Brazilian subscription book club plus two free Catholic ebook libraries). **Bare _Glossa_ was rejected too**: in Brazilian Portuguese _glosa_ overwhelmingly means an insurer's refusal to pay a medical claim, and the whole first page of Brazilian search results is billing. `Catholica` is load-bearing — it disambiguates the false friend and separates the name from _Glossa: a journal of general linguistics_.

**Name architecture**, three slots, each carrying what a name cannot:

- **Name**: Glossa Catholica. Identical in both locales; `home.title` is its plain-text form and the wordmark (`components/Wordmark.svelte`) its visual one.
- **Subtitle** (`home.tagline`): _Scripture and the Magisterium_ / _Escritura e Magistério_. The inventory, since the previous tagline named only the Bible and the Catechism and had been inaccurate since the encyclical sweep landed.
- **Posture**: not asserted in the name. "No agenda", "humble", "free" are claims that destroy themselves when a name makes them — every agenda-driven site in this niche calls itself the impartial one. They belong in the colophon, which already states them without self-praise.

**Mechanical consequences** (all landed with this entry): `localStorage` keys `depositum:*` → `glossa:*`; service-worker caches `depositum-content` / `depositum-shell-{version}` → `glossa-content` / `glossa-shell-{version}`; `CONTACT_EMAIL` → `glossa@posix.dev.br`; manifest `name` "Glossa Catholica", `short_name` "Glossa"; scraper `USER_AGENT`s. **The cache and key renames were free only because nothing is deployed** — after launch they orphan every reader's preferences and, worse, the precached corpus that the offline commitment is about. That is the whole reason this was decided now rather than later. The repo directory rename (still `~/Dev/me/scriptura`, never done for the old name either) remains outstanding, outside a live session.

**Debt this name takes on**: it names an apparatus of commentary that does not exist yet. The reference half is real; the annotation half is not. Until Challoner ships, the name is a promise. Accepted knowingly.

**The rule for when it does ship**: a gloss must never be confusable with its source, visually or structurally. The _Glossa Ordinaria_ solved this by layout — smaller script, in the margin, never mixed into the text column — and gap #7 in `PLAN.md` (sidenotes on desktop, tap-popovers on mobile) is therefore a **prerequisite** for annotation, not a polish item. This is the same discipline `pipeline/corrections/` already enforces with "never invented text", applied to added text rather than altered text.

**A caveat to record before anyone builds it**: Challoner's notes are not neutral historical context. The 1582 Rheims annotations were open anti-Protestant controversy; Challoner cut and rewrote most of them, but confessional apologetics remain in places. Reproducing them as a dated, attributed historical apparatus is consistent with everything else here. Presenting them as impartial commentary would not be. Note also that **CPDV is not Douay-Rheims** — Challoner's notes are anchored to DR wording, so attaching them to CPDV text would be an editorial act. Annotation means adding DR-Challoner as a third Bible edition. And it lands English-only: Matos Soares' own notes are **not** recoverable by re-parsing, since the upstream source never carried them (verified against `corpus/raw/matos-soares/`), so the usual "re-parse, never re-crawl" insurance does not apply here.

## 2026-08-16 — The corpus is committed to the repository

**What**: `corpus/` — `raw/`, `works/` and `xrefs/`, 2,548 files, 149 MB — is now tracked in git. The `.gitignore` rule that read "the corpus is never committed — copyrighted or scraped text stays out of the public repo" is gone. `corpus/README.md` carries the copyright statement and is the first thing anyone opening the directory reads.

**Reversing what**: the 2026-08-13/14 architecture entry's "corpus lives outside the public repo (gitignored, fetched/built locally)". That was a copyright-driven rule, and the reversal does not pretend the copyright question went away — it answers it in the open instead of by omission, which is the same move the colophon makes for the site and `docs/research/copyright.md` §5 already argues for. 345 of the 347 works are Libreria Editrice Vaticana material; one is Matos Soares (public domain 1 Jan 2028, a knowingly accepted exposure); one is public domain today.

**What it buys**:

- **`raw/` stops being a single-copy artifact.** CLAUDE.md calls it write-once and the only thing that cost real fetches against vatican.va, and `link-surface.md`'s whole insurance policy — any capture regret is fixed by re-parsing, never re-crawling — holds only while it survives. Until now it survived in exactly one directory on one machine, with no backup the project itself controlled. Version control is the first thing that has ever made that claim true rather than aspirational.
- **A build becomes reproducible from a clone.** `CORPUS_DIR` and the fixture-fallback trap it guards against (CLAUDE.md, site/README.md) stop being the only path to a real build.

**What it costs, stated rather than buried**: a takedown is no longer cheap. On the site, withholding a work is an edit to `site/unpublished.json` and a deploy. In git, deleting a file leaves it in the history, so honouring a rights request properly means rewriting history and force-pushing, breaking every clone. The commitment does not change — if asked, the text goes out of the working tree and out of the history — but the cost of honouring it went up, and `corpus/README.md` says so on its own page rather than leaving a rights holder to discover it.

**Not affected**: `site/build/` stays ignored. The corpus is the source; 460 MB of prerendered output regenerated by every build is not.

## 2026-08-16 — Hosting: Cloudflare Workers static assets, and the site is live

**What**: the "hosting provider" deferred in the 2026-08-13/14 scoping entry is **Cloudflare Workers static assets**, configured in `site/wrangler.jsonc` and deployed with `wrangler deploy` from a local `npm run build`. First deploy is up at `https://glossa.me-f65.workers.dev`. A custom domain is deliberately a later, separate step.

**Workers rather than Cloudflare Pages.** Pages' one real advantage would be Git-integrated builds with per-branch previews, and that is precisely what this project cannot use: a build triggered from the repo needs the corpus, and until today the corpus was not in the repo (it is now — see the entry above — but deploys still come from a local build, and the fixture-fallback trap in CLAUDE.md is what a misconfigured CI build would hit). With Git integration off the table, Pages' remaining edge over Workers is nothing this project would use, against the cost of adopting the platform Cloudflare has stopped developing. Workers also keeps the deploy config in the repo, which is where every other decision here lives.

**Assets-only, no `main`.** Nothing runs server-side. The offline-first PWA commitment depends on it staying that way, and an empty `main` is the cheapest possible enforcement.

**Two configuration choices worth their own lines**:

- `not_found_handling: "404-page"`, served from a new prerendered `/404` route. Explicitly **not** `"single-page-application"`: that answers every unknown URL with 200 and the app shell, which on a site whose whole point is citable deep links would tell crawlers that every mistyped citation is a real page.
- `html_handling: "auto-trailing-slash"`, matching SvelteKit's `trailingSlash: 'never'`. **This one bit immediately**, and the bug is worth recording because it is invisible until the worst possible moment: the host canonicalises `.html` URLs by redirecting, so `/offline.html` 307s to `/offline`, `fetch` follows it transparently, and the resulting response carries `redirected: true`. Browsers reject a redirected response passed to `respondWith` for a **navigation** — and `handleNavigate`'s offline fallback is a navigation. The failure would only ever fire offline, with no cached shell, which is the single scenario that fallback exists for. Fixed in `service-worker.ts` by copying the body into a fresh `Response` at precache time (`navigable()`), which drops the flag and is a no-op for every asset that does not redirect.

**Caching** is now `site/static/_headers`: a year plus `immutable` for `_app/immutable/*`, which is content-hashed and therefore genuinely immutable; 30 days with revalidation for `fonts/` and `icons/`, whose filenames are **not** hashed, so `immutable` would be a year-long commitment to bytes we could no longer replace. Everything else keeps Cloudflare's `must-revalidate` default, which is correct for prerendered HTML and mandatory for `service-worker.js`.

**The ceiling to watch** (acted on the next day — see the entry below, which supersedes this paragraph's numbers): Cloudflare caps a deployment at **20,000 files** and this build is **15,256** — 76% used, at 461 MB. **9,315 of those files (61%) are `/documents/<slug>/<n>` section pages** at ~21 KB each, against a 118 KB `read` view for a whole 83-section document; the slices cost roughly 15× the document they slice, nearly all repeated shell. With ~460 works anticipated once the encyclical sweep finishes, plus DR-Challoner as a third Bible edition, this ceiling is reachable. The fix when it arrives is **not** to stop prerendering — that would cost crawlability of exactly the deep links this project is built on, archivability, and the strict-prerender link check that currently proves all 14,638 pages resolve. It is to make section deep links anchors into the already-prerendered `read` page, which stays fully static and drops the deployment to roughly 5,900 files. The tradeoff is that a section page has its own `<title>` and can rank independently; an anchor cannot.

**What a deploy costs**: ~16 minutes for a first upload of 15,256 assets, ~5 minutes for a redeploy. Wrangler dedupes by content hash, but a rebuild changes SvelteKit's `version`, which is embedded in every page — so a redeploy re-uploads nearly every HTML file regardless of whether its text changed.

**Now true, and it was not before**: the note in the naming entry above that "the cache and key renames were free only because nothing is deployed" has expired. `glossa:*` localStorage keys and the `glossa-content` / `glossa-shell-{version}` caches are now on real readers' devices. Renaming either from here orphans reader preferences and, worse, the precached corpus the offline commitment is about.

## 2026-08-17 — A document is one page

**What**: `documents/[slug]/[n]` (one prerendered page per numbered section) and `documents/[slug]/read` (the continuous full text) are both gone. `/documents/{slug}` is now the document: metadata, table of contents, and the whole text. A section is a fragment on it, `#s{n}`, against the `id="s{n}"` anchors the continuous view already carried. **The deployment went from 15,258 files / 461 MB to 5,708 / 252 MB** — `documents/` alone from 9,777 files to 232 — taking the 20,000-file ceiling from 76% used to 29%.

**Why the per-section pages were the right thing to cut**: they were 61% of the entire deployment to carry a few hundred bytes of text each, at ~21 KB per file. The other ~20 KB was nav, TOC, footer and hydration payload, repeated 9,315 times. Nothing else in the build had that ratio.

**The counter-argument, and why it lost.** The case for keeping them was that a prerendered page per section is what makes a cited link work for machines that don't run JavaScript — crawlers, link unfurlers, the Internet Archive. Half of that survives the change and half does not, and it is worth being precise about which. What is genuinely lost: a section no longer has its own `<title>` or Open Graph tags, so a link to one unfurls as the whole document. What was never really there: search ranking. Every one of these texts is a verbatim reproduction of a vatican.va page that outranks this site for its own words, so indexing 9,315 near-duplicates was never going to earn traffic on the text. The value here is the reading tool, not the words, and the words are the only thing a per-section page was giving the crawlers.

**What was NOT lost, and had to be checked rather than assumed**:

- **The strict-prerender link check still covers everything.** The build passes with `handleHttpError: 'fail'`, which is what proves all 5,093 remaining pages and every anchor resolve.
- **Withheld documents still render.** `read/+page.ts` used to 404 when a document had no readable sections, which was safe only because the landing page sat in front of it to show the takedown notice. There is no page behind this one any more, so the merged loader returns metadata-without-sections instead, and the page shows the notice. This was the one behaviour that could not be carried over unchanged.
- **The narrow-screen table of contents.** Below 80rem `.reading-layout` stops being a grid and `.reading-aside` falls to the bottom of the page — which on a 287-section encyclical is past everything. Before the merge a phone reader met the TOC first, because the landing page _was_ a table of contents. `.toc-inline` restores that, as plain markup rather than a second `StructureSidebarToc`, since that component owns fixed element ids and rendering it twice would duplicate them.
- **Link previews.** `parsePreviewHref` keyed on a trailing `/\d+` in the path; it now keys on the `#s{n}` fragment, and an unanchored `/documents/{slug}` correctly gets no preview — a whole encyclical is not a popover.

**Redirects, deliberately minimal**: one dynamic rule in `site/static/_redirects` maps `/documents/:slug/:n` to `/documents/:slug#s:n`. Cloudflare allows 100 dynamic rules and this is one of them, covering all 9,315 retired URLs. It is insurance for a typed or noted-down URL, not migration: the site had been public for a single day when this landed, and nothing outside this repo has ever linked to the old shape.

**What was considered and NOT done**:

- **Chapter-sized pages for documents** — the shape actually wanted, so a long encyclical reads as a book rather than one endless article. **Blocked by a corpus defect**: only 16 of 233 documents have any `chapter` node in `structure.json`, and the heaviest ones have none — `fratelli-tutti` (482 KB) has **2** structure nodes for **287** sections, `laudato-si` (421 KB) and `veritatis-splendor` (419 KB) likewise have zero chapters. The _text_ is complete; only the structure is flat. The chapter headings are present in `corpus/raw/vatican-docs/encyclical__fratelli-tutti__en.html` (`CHAPTER ONE` … `CHAPTER EIGHT`) and did not survive the parse, so this is fixable by re-parsing with no re-crawl. **It is also a live bug independent of pagination**: the table of contents for Fratelli Tutti offers a reader two entries. Splitting by a structure that isn't there would just yield one page per document again, so the parser has to come first. Deferred knowingly.
- **Collapsing `/ccc/[n]`** (2,865 pages, 19% of what remains). The mapping from paragraph to containing chapter is not derivable from the path, so it needs 2,865 static redirect rules against Cloudflare's 2,000 cap — meaning a Worker with a range table, giving up the assets-only property recorded in the entry above. Left alone: `/ccc/1324` is this project's most citable URL form and the one place a per-unit `<title>` is worth its file.
- **Collapsing `/compendium/[n]`** (598 pages, 10%). Fits under the redirect cap, but unlike documents it has no continuous view to collapse into, so it means building a chapter route first. Cleanup, not a fix.

## 2026-08-18 — One SPA shell, corpus-validated deep links

**What**: replaces the full prerender with one static SvelteKit SPA shell. Reader URLs stay path-based and edition-free: `/scriptura/gen/17#v5`, `/catechismus/1234`, `/compendium/456`, `/documenta/lumen-gentium`, and `/preces/our-father`. The corpus sync now also emits `site/static/corpus-routes.json`, an address-only manifest. A small Cloudflare Worker checks navigation paths against it: canonical paths receive the SPA shell; invalid reference-shaped paths receive that shell with an HTTP 404; non-navigation assets pass directly to the static asset binding. It also canonicalizes a trailing slash with a permanent redirect.

**Why**: the static page was not the content identity. A canonical URL selects a reference, while the reader's stored preference selects an effective edition/language. Prerendering therefore repeated the application chrome thousands of times and could only embed a build-time default or every edition of a unit. The corpus had already been split into immutable, content-hashed JSON precisely so the browser could fetch a work as it was needed; the page explosion was the remaining mismatch. The real-corpus build is now **635 files / 56 MB**, including **two HTML documents** (`index.html` and the offline fallback), down from the previous ~5,700-file / 252 MB build.

**Why not the host's ordinary SPA fallback**: it would return `200 OK` for `/catechismus/999999` and make a typo look like a citeable resource. The route manifest is deliberately small and contains no reading text: Bible book/chapter addresses, CCC and Compendium unit numbers, canonical CCC chapter starts, document slugs, and prayer slugs. It is generated from the same source indexes as the client, so the edge and reader do not maintain separate hand-written route lists. The client still presents the site's custom not-found view via `+error.svelte`.

### 2026-08-18 — Canonical Latin route grammar

**Decision**: Canonical collection names are Latin and do not vary with interface language or edition: `/scriptura/{osis}/{chapter}`, `/catechismus/{paragraph}`, `/catechismus/caput/{start}`, `/compendium/{question}`, `/documenta/{slug}`, and `/preces/{slug}`. `colophon` is already Latin. OSIS book IDs remain the final Scripture path component: they are stable corpus identifiers, not localised display labels.

**Why**: a URL names the same work for every reader and must outlast presentation-language choices. Latin supplies the common, non-localised vocabulary for the collection segments; edition and language continue to come solely from reader preference. Translating book titles into URL slugs would introduce a second handwritten canonicalisation table without improving address stability.

**No compatibility layer**: this is still a development site, so the earlier English roots (`/bible`, `/ccc`, `/documents`, `/prayers`) deliberately resolve as invalid paths rather than redirecting. The edge route manifest recognizes only the Latin grammar.

**Offline policy**: initial route loading still fetches only its needed immutable content. After first render, the root layout asks the service worker to fill the remaining content tier at low priority; it does not do so when the browser declares data saver. The worker's existing `CACHE_CONTENT` operation is resumable in the practical sense: a later visit asks again and immutable cache hits are skipped. Browser lifecycle and storage quota remain authoritative, so the site promises progressive offline availability rather than claiming a background worker can finish after a tab is closed. Per-work download/progress controls remain future UI work.

**Deployment guard**: `preflight-deploy.mjs` now checks the generated manifest's work and content-file counts rather than a minimum number of HTML files; the old prerender-count guard would reject a correct SPA build and could not distinguish it from fixtures.

**Verified**: the real corpus sync generated **347 works / 541 content assets** and its route manifest; `npm test` passes (**303 tests**), `npm run check` passes with zero diagnostics, `npm run build` produces the two-shell / 635-file output, and `npm run preflight` accepts it. Local Worker requests verified canonical `200` responses for `/scriptura/gen/1`, `/catechismus/1234`, and `/documenta/lumen-gentium`; former English roots return `404`; and a trailing slash returns `308`. `wrangler deploy --dry-run` compiled the worker and recognized the `ASSETS` binding (the sandbox could not write Wrangler's optional home-directory debug log). A browser-level Cloudflare request and service-worker lifecycle test still belongs to deployment verification.

## 2026-08-18 — Detect interface language on a reader's first visit

**What**: when `glossa:ui-lang` is absent or invalid, the client examines the browser's ordered language preferences and selects the first supported primary language: `pt-*` selects Portuguese, `en-*` selects English. It falls back to English when neither appears. That detected value is immediately stored under the existing preference key; an explicit choice made from the language menu always remains authoritative.

**Why**: the interface language also selects the default content edition. Starting a Portuguese-speaking reader in English made both the chrome and their first Bible/Catechism text unnecessarily wrong, while changing an existing preference from the browser on every visit would be equally surprising. Persisting the initial negotiation gives first-time readers the right default without taking a later choice away.

**Static-shell consequence**: the app HTML uses the same small primary-subtag check before hydration to set the document's `lang` attribute. The reader UI still changes when the client hydrates; this early step preserves the correct document language for assistive technology during that interval.

## 2026-08-20 — There is no "prefer duplication" convention in the scrapers

**What**: `pipeline/scrapers/common.py` now holds `load_corrections`, `CorrectionDriftError`, and `chapter_opening_letter`/`CHAPTER_OPENING_PUNCT`. Five scrapers had their own copy of the corrections loader — all resolving the same `pipeline/corrections` path under four different local names — three had the same drift exception, and both Bible scrapers had a byte-identical drop-cap helper.

**Why this needs an entry rather than just a commit**: the duplication was defended in code by two claims, and both were false. `cpdv.py` stated that each scraper reimplements the corrections layer "(small duplication preferred over a shared module per project convention)". No such convention exists — nothing in `CLAUDE.md`, this log, or `corpus-schema.md` ever stated one, and it appears to have been invented and then cited as though already settled. The same file also called the scrapers "standalone PEP 723 scripts with no common import path"; Python puts a script's own directory on `sys.path`, so a sibling `import common` resolves from any working directory (verified directly before relying on it), and PEP 723 governs third-party dependencies, not local imports.

**What stays duplicated, deliberately** — recorded in `common.py` so the question does not get reopened by whoever next greps for repetition:

- **Per-host rate limits.** vatican.va's 2.0s comes from its own `robots.txt` and is a commitment about someone else's server; sacredbible.org and liriocatolico.com.br are different hosts with independently chosen floors. One shared constant would either loosen a self-imposed limit or read as a pretext to speed up the vatican.va crawl.
- **`Fetcher`.** The four implementations differ in retry policy, raise-versus-return error handling, and even HTTP library. Unifying them is a decision about behaviour, not a mechanical merge, and the scrapers have no tests to catch a regression.
- **`strip_tags`.** `compendium.py`'s copy turns `<br/>` into a space before dropping other tags and `ccc.py`'s does not — a documented difference that a consistency-motivated merge would silently lose.

**Verified**: all six scrapers byte-compile and import cleanly with the shared module resolving to the same objects (checked from an unrelated working directory); `ruff format --check` is no worse than before. No scraper was run — this change is verifiable by reading and importing, which is the standard anything in `common.py` has to meet, since there are no scraper tests and re-crawling to check a refactor is not acceptable.

## 2026-08-21 — Paragraph text is HTML in JSON; headings record depth, not a taxonomy

**What**: two changes to the corpus schema for the numbered-unit works
(documents, CCC, Compendium — not the Bible, which is verse-addressed and stays
as it is).

1. A unit stores one `html` string instead of `blocks[]` + `text_marked` +
   `text`. The container stays JSON; only the text encoding changes.
2. `structure.json` records a heading's **observed depth** (`level: 1|2|3`) and
   an anchor (`before`: the unit number it precedes), instead of a semantic
   `kind` and a stored `[lo, hi]` range. Nesting and ranges are derived by the
   consumer from depth and order.

```jsonc
// sections.json
{
  "n": 35,
  "html": "…meets God's law in <i>Veritatis Splendor</i>…<sup data-fn=\"12\"></sup>",
  "citations": [{ "marker": "12", "text": "Cf. <i>Gaudium et Spes</i>, 22." }]
}
// structure.json
[{ "level": 1, "title": "CHAPTER I — “Teacher, what good must I do…?”", "before": 28 }]
```

**Why the block model goes**: it is elaborate machinery for a case that barely
occurs. Across every document work there are 14,896 single-block units against
11 that have more, and 14,913 `prose` blocks against 11 `quote`. A quote is
`<blockquote>` in the html string. Separately, every word was stored twice —
`text_marked` with `⟦n⟧` tokens, and a derived `text` with them stripped.

**Why HTML and not Markdown**, having seriously considered Markdown first: the
source is HTML and the render target is HTML, so Markdown is a detour that
expresses strictly less than either end, with a hand-rolled escaping layer in
between. The decisive points:

- The escape hatch was needed immediately. `<sup>`, `<br>`, `span[lang]` and
  Lumen Gentium's `(N*)` star notes all need passthrough, and an abstraction
  that needs its escape hatch on day one is not abstracting much.
- Nobody authors this. Markdown's value is comfortable hand-writing; the corpus
  is generated and hand-edits are forbidden (a re-parse eats them), so we would
  pay Markdown's ambiguity costs for a benefit never collected.
- CommonMark emphasis is underspecified around punctuation-adjacent delimiters,
  and this corpus is wall-to-wall `«…»`, `[…]`, `(N*)` and italicised Latin.
  Escaping bugs there would be silent and would look exactly like source
  defects — the most expensive failure mode this project has.
- Storing a _narrowed subset of HTML_ is a restriction, not a translation.
- It dissolves the dependency question: `DOMParser` is built in and
  spec-compliant, and the site walks its node tree into Svelte snippets the same
  way it would have walked a Markdown AST. No package added.

Most of the git-readability motivation was really "store prose as one string
with inline markup", which either format delivers; against today's
double-stored, JSON-escaped pair, `<i>Rerum Novarum</i>` versus
`*Rerum Novarum*` is the whole difference.

**The allowlist, derived by measurement rather than assumption** — tag counts
inside numbered body paragraphs across 465 raw pages:

| keep                   | why                                                                                                          | drop           | why                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------- |
| `i` (9,901 + 794 `em`) | the documented v1 italics loss, recovered                                                                    | `a` (7,206)    | footnote apparatus, already modelled as `citations[]` |
| `b` (352)              | real inline bold                                                                                             | `font` (3,408) | legacy presentation (`size`/`face`/`color`)           |
| —                      |                                                                                                              | `span[lang]`   | export noise — see the correction below               |
| `sup` (739)            | footnote refs become `<sup data-fn>`; the 106 that survive marking are real typography (`Paris 1960²`, `2ª`) |                |                                                       |
| `br` (149)             | meaningful line breaks                                                                                       | `u` (1)        | single occurrence                                     |
| `blockquote`           | block-level, covers the 11 quote cases                                                                       |                |                                                       |

Measuring corrected two guesses: `<small>` does not occur anywhere and would
have been allowlisted on assumption, and `span[lang]` would have been missed.
(`span[lang]` was then dropped again — see the fourth correction below.)
A third correction came from the round-trip run itself: `sup` was first written
down here as dropped, on the assumption it was purely the footnote-marker
template. 106 of them across 11 files survive `mark_footnotes`, and about half
are genuine superscripts inside bibliographic citations, which dropping would
flatten (`1960²` to `1960 2`). Keeping bare `<sup>` is invariant-neutral — it
strips to a space either way — so it is allowlisted, and the renderer
distinguishes a footnote from typography by the `data-fn` attribute.

A fourth correction, and the sharpest: `span[lang]` was allowlisted on the
reasoning that it "marks Latin inside vernacular text". It does not. All 486
instances are `lang="pt"` inside Portuguese documents — three `__pt.html`
files — wrapping ordinary Portuguese headings (`<span lang="pt">Normas
concretas</span>`). It is word-processor export noise, and the justification
was inferred from the attribute's NAME without reading its values, which is
exactly the error a measured allowlist exists to prevent. Dropped: the text
inside is kept regardless, only the redundant wrapper goes. It was inert in any
case, since `strip_transparent_spans` removes every span before blocks are
built.
`em` normalises to `i` — HTML5's `<i>` means idiomatic text (foreign phrases,
work titles), which is what this corpus italicises, while `<em>` means stress
emphasis.

**Why depth and not `kind`**: the taxonomy forced the scraper to judge whether a
heading _means_ "chapter" or "section", which the sources do not reliably
encode. That judgement is the direct cause of `LEVELS` ranking `section` above
`chapter` (so in `gaudium-et-spes.en` chapters nest under sections, chapter
ranges truncate to one paragraph, and section ranges overreach into the next
chapter's text), and of `CONCLUSION` landing inside `CHAPTER SIX` in
`caritas-in-veritate.en`. Depth is observable in the markup; semantics is
inferred from it. Recording the observable thing and deriving nothing is the
same posture as the source-defect policy: document, don't invent.

**Why ranges are derived**: nearly every structural defect found in the 2026-08
description pass was a stored span drifting from the text — 680 `[null, null]`
nodes before the August 20 fix, `CHAPTER II` at `[53,53]`, `SECTION 2` at
`[67,78]` swallowing two other chapters, parents collapsing to their first
child's range. Nothing stored is nothing to drift.

**Enforcement**: the allowlist is validated at emit. An unexpected tag has its
markup stripped and its **text kept**, and an anomaly is recorded with a
locator — logged, never silently absent, matching every other scraper
behaviour. A `--strict` flag makes it fatal for CI. One stray `<u>` in 465 pages
must not kill a document.

**Migration oracle**: `strip_tags(html)` must equal the current `text` for all
14,907 units. That is an exact, cheap, corpus-wide check, and it separates a
format bug from a parser bug — which matters because the input-side parser
fixes from the description pass are still outstanding and would otherwise be
confounded with the migration.

**Not affected**: the description sweep's outstanding _input-side_ fixes
(separator-split bold, dropped salutations, and the undecided plain-centered and
inline-style-bold variants) are independent of storage and still needed — no
storage change recovers a heading the parser never saw. The `LEVELS` reorder and
the stored-range repairs are dropped, since this schema removes both problems
rather than fixing them.

## 2026-08-21 — PT's inline Scripture citations stay inline

**What**: the Portuguese Catechism prints many Scripture locators directly in
the sentence — `«...até ao fim do mundo» (Mt 28, 19-20)` — where the English
edition footnotes the same reference. The parser extracts those into
`⟦inlineN⟧` tokens with a verbatim `label`, and the reader used to render each
one as a superscript number opening a disclosure. That replaced something the
source actually prints with an apparatus it does not have: 1,255 parentheses
became footnotes, and PT's real notes were renumbered into one work-wide 1–4,853
display sequence to make room for them. Both are reverted. A citation carrying
a `label` is now printed back exactly where it stands, parentheses and all,
with links woven through it; a citation without one is a numbered note and
keeps the source's own printed number, as EN always did. `citations[].number`
is gone from the schema — its only justification was the interleaving.

**Why the token stays**: tokenizing is not the same decision as footnoting. The
token isolates the citation apparatus from the sentence around it, so the
reference parser is handed a citation-shaped string instead of having to find
one inside running prose (`linkifyProse`'s deliberately narrow "cf."-triggered
grammar would not, and should not, link a bare parenthesis). `label` stores
every source character, so the extraction is reversible in the data and
invisible to the reader — the only thing render changes is the source's loose
spacing, below.

**The typos**: the PT mirror's citation punctuation is pervasively OCR-drifted.
Two rules decide where each defect is fixed, following what the corpus already
did with `Dr`-for-`Dt` and `Fl . 3, 8`:

- _Punctuation and spacing drift is grammar tolerance_, in `site/src/lib/refs.ts`
  — a space before the separator (`Rm 8 , 15`), `.` for `,` between chapter and
  verse (`Sl 40. 7-9`), `:` for `;` between clauses (`Ex 34, 28: Dt 4, 13`), a
  book glued to its chapter (`Jo14`, `DS1511`), and a lowercase `l` for the
  digit `1` inside a locus (`Act 4, l2`). Nothing is rewritten; the source
  string still renders verbatim, it just resolves now. Measured against every
  citation in both editions, old parser vs new: **+345 references linked in
  `ccc.pt` and +19 in `ccc.en`, with not one citation losing a link it had.**
- _A wrong character with a known right value is a correction_, in
  `pipeline/corrections/ccc.pt.json` with the usual locator/evidence — `(Ts; 5,
14-15)` for James 5:14-15 (the paragraph's own prose names São Tiago), `Lc 1 ,
3 1` for Lk 1:31, `Is 1 l, 2` for Isa 11:2. These name a different book or a
  different verse; no tolerance rule may guess them, and each is confirmed
  against the EN parallel.

**Loose spacing is tidied at render, for every work**: the same mirrors print
a stray space after "(", before ")", or before a comma or period — `( Sl 105,
3)`, `(2 Cor 5, 17 )`, `Cf . Lc 1, 38`, `Catechesi tradendae , 1`. Across the
whole corpus **4,916 of 18,077 citation strings carry one**, so this is a
typesetting habit of the source, not a handful of defects, and 4,916
corrections entries would be absurd. `normalizeCitationSpacing` in `refs.ts`
handles it, applied by `RefText.svelte` — the one presentation layer every
work's citations pass through, so the Catechism, the Compendium, the council
documents and the encyclicals all get it from the same rule. It is
**whitespace-only**: no mark is added, removed or replaced, verified over the
whole corpus (0 non-whitespace changes, 0 citations losing a link). The corpus
and `corpus/raw/` keep the source's own spelling; this is the presentation
layer deciding presentation, which is why it is not a corrections-file matter.

The tidy removes whitespace and never adds it, so a book glued to its chapter
is out of its reach. There are 19 of those corpus-wide; 18 sit inside footnote
text (`DS1511`, `PL16`, `CSEL73`) and all of them resolve, so they are left as
printed. The one in a paragraph's running sentence — `(Jo14, 16-17)`, CCC 2615
— gets a corrections entry, because that one a reader actually reads.

**Also fixed while in there**: an EN cross-chapter range (`Isa 52:13-53:12`) was
expanding to 41 verses of a 15-verse chapter — it now links its opening verse
and leaves the rest as text. `parseClause` keeps scanning after a match instead
of dropping the clause's tail, which is what lets a comma-joined second
reference link. And the scraper now accepts a Roman book number in an inline
locator (`(I Jo 4, 9)`) and no longer swallows a footnote marker the source
printed inside the same parenthesis (CCC 857's `(Ef 2, 20 (368))`).

## 2026-08-21 — One grammar: the xref index is derived, not stored

**What**: `corpus/xrefs/ccc-bible.json` is gone from the repository, and so is
`pipeline/build/xrefs.py`. The CCC → Bible index is now built by
`site/scripts/build-xrefs.mjs` on every corpus sync, straight into the site's
generated `corpus-data/index/`.

**Why it was wrong to store it**. Three separate problems, one cause:

- It was a **derived interpretation living in the corpus**, next to `raw/`
  (irreplaceable) and `works/` (parsed source). `link-surface.md` says the
  corpus stores raw strings and never interpretations; an index of what cites
  what is exactly an interpretation. Committed, it could drift from the
  `works/` it describes, and nothing checked that it hadn't.
- It required a **second implementation of the citation grammar**, in Python,
  because the renderer's grammar lives in TypeScript. The two drifted, and we
  knew: `refs.ts`'s own docblock recorded that they agreed on 98.4% of
  paragraphs, that every disagreement traced to one bug, and that the Python
  was the wrong one each time. That sat as "tracked follow-up" because fixing
  it meant fixing it twice and re-committing a 543 KB artifact.
- It covered **`ccc.en` only** — not the Portuguese edition, whose inline
  locators are references the English edition footnotes, and not the prose of
  either.

**How it works now**. `src/lib/refs.ts` was split. The grammar — every table,
`parseRefs`, `linkifyProse`, `normalizeCitationSpacing` — moved to
`src/lib/refs-grammar.ts`, which imports nothing. `refs.ts` keeps the half that
genuinely needs the corpus (`refHref`, and the document-title table it injects
into the grammar) and re-exports the rest, so no caller changed. Because the
grammar module is dependency-free, plain Node imports it directly — no bundler,
no new dependency, Node's native type stripping and the `tsconfig` setting
already present are enough. The builder and the reader therefore run the _same
parser over the same strings_, and the index cannot drift from the corpus
because it does not outlive the build.

**Result**: 1,198 → 1,303 paragraphs with references; 7,870 → 8,764
(paragraph, verse) pairs, of which 6 disappeared and all 6 were wrong (the
Python read John 17 as Luke 17, and "Moralia in Job 31" as the book of Job).
The index is also smaller — 543 KB stored → 210 KB generated, 22 KB gzipped.
The QA pass that reports references pointing outside the corpus moved into the
builder and still runs on every sync, still loud and still non-fatal.

**What is NOT done**: the documents (232 works) are parsed by the same grammar
and their references now render as links, but they do not yet feed a reverse
index — "cited in Lumen Gentium §22" needs an index shape with a work
dimension and a Bible-page section to show it. That is the obvious next step,
not a gap in this one.

`pipeline/build/` is gone entirely. `versification.py` had no caller left once
`xrefs.py` was deleted, and it was a hand-maintained twin of
`versification.ts`'s tables — the same duplication, one layer down, waiting to
drift the same way. Its content is in git if a future Python consumer ever
needs it back.

## 2026-08-21 — References link in prose, with no trigger and no brackets

**What**: `linkifyProse` used to require an explicit "cf." before it would look
for anything. It now scans for a Scripture locator anywhere in a paragraph's
own text. The case that forced it: `(«Eu estarei contigo» – Ex 3, 12)`, where
the parenthesis holds a quotation AND its locator, so neither the citation
grammar (which assumes the whole string is apparatus) nor the old prose rule
(which needs "cf.") could see the reference.

**Why it matters well beyond that**: the encyclicals cite Scripture almost
entirely this way — in parentheses, inside the argument, with no apparatus at
all. The corpus holds **5,932 such locators**, 336 in Evangelium Vitae alone,
every one of them previously plain text.

**What keeps it from over-linking** (the standing rule: under-linking is
acceptable, a wrong link is not). It is a dedicated scan, deliberately NOT
`parseRefs` over prose — that function splits on `;` and `:`, which in prose
are ordinary punctuation, and carries a book across clauses, which in prose
would turn page numbers and dates into verses. Instead every match must carry
its own book name, matched **case-sensitively** on the exact printed surface
form, followed immediately by its own locus within that book's real chapter
count. Case sensitivity is what makes short Portuguese abbreviations safe:
"na" and "at" are a common preposition and a common word, "Na" (Nahum) and
"At" (Acts) are not.

**Two over-links found by measuring, and fixed**:

- A patristic commentary title names the book it comments on — "Moralia in
  Job 31, 45", "Origenes, In Mt. 16, 21" — and the numbers after it are the
  commentary's own divisions. Scanning all 347 works for a match preceded by
  "in" found ten: nine titles and one real English "quoted in Mt 1:23". The
  guard separates them exactly.
- A bare "cf. 1212" as a CCC PARAGRAPH reference is now opt-in and off. The
  apparatus it targets is absent from both vatican.va mirrors, so the corpus
  contains zero of them in either Catechism or either Compendium — while the
  rule produced 104 wrong links in the encyclicals, where a bare number after
  "cf." is a Scripture chapter continuing an earlier reference ("cf. 22:32")
  or a book number ("cf. 1 Ped 2, 21").

**Book tables extended to the older translations**, by the same method the
tables were originally built with — scan the real corpus for scripture-shaped
prose that produced no link, read the sentence around each one, add only what
is confirmed. That is where "Gén", "Sal", "Apoc", "Hebr", "Luc", "Fil", "Col",
"Eclo", "1 Ped", "2 Tess" came from, and it is why English now tolerates the
abbreviating full stop ("Lk. 1:28", "Matt. 16, 18"), worth ~200 references on
its own. "Rom" returns to the Portuguese table too: it had been dropped
wholesale to avoid mislinking "Cat Rom" (Catechismus Romanus), at the cost of
153 real references to Romans — the collision is now blocked by its prefix,
which is where it actually occurs.

## 2026-08-21 — One "Cited in" panel, every work that cites the verse

**What**: the Bible chapter page's "Cited in the Catechism" section becomes
"Cited in", and carries the magisterial documents beside the Catechism. A row
is a verse; inside it, each citing work names itself once and lists its
references: `v. 16 — CCC (¶219 · ¶444 · ¶454) Deus Caritas Est (§19) Dominum
et Vivificantem (§8 · §23 · §49)`.

**Why one panel and not two**: the reader looks up a verse, not a work. Two
sections would build the whole verse scaffold twice — the same verse number,
the same present/absent handling, the same anchor — and force a reader
following one verse to find it in two places. One panel says each verse once.

**Why grouped, not one chip per reference**: naming the work per reference is
unreadable where it matters most. Matthew 25 draws 237 document references
across its verses and John 3:16 alone is cited by a dozen documents; the work's
name said once with its sections in parentheses is what keeps those rows
scannable. Each number is its own link — `/catechismus/{n}` and
`/documenta/{slug}#s{n}`, the same targets the citation renderer uses.

**The index**: `document-xrefs.json`, built by the same pass as the CCC one and
sharing its shape — `{ work, n, refs }` keyed by the document's edition-free
slug, unioned across that document's editions. 1,926 entries over 232 works;
327 KB raw, **31 KB gzipped**, against an eager index tier already at ~227 KB
gzipped. It goes in that tier for the same reason the CCC index did: inlining
costs less than the round trip. It is also the entry most likely to outgrow the
tier first, and `corpus-index.ts` says so where a future reader will look.

**A defect this surfaces, deliberately unfixed**: many encyclical manifests
carry a title derived from the slug — "Dominum Et Vivificantem" with a
capitalised "Et", "Populorum" for _Populorum Progressio_, "Ecclesiam" for
_Ecclesiam Suam_. That is wrong in the corpus, not in this panel, and it
already shows in the document library and the home page. Correcting it in the
view would be inventing text; it belongs in the scraper's title derivation,
with a source for the real titles.

**What actually landed, 2026-08-21** (the entry above is the design; this is
the implementation record):

- `sections.json` carries `html` per block. Verified over all 14,907 sections.
  The oracle earned its keep immediately, catching two bugs that reading the
  code would not have: a paragraph number padded with `&nbsp;` passed the text
  gate while the html strip silently no-opped, leaving "9." in nine
  paragraphs; widening the padding to any named entity then swallowed a leading
  `&quot;` from 359 sections. Both would have shipped looking like source
  defects.
- `sup` was allowlisted after all — see the correction note above.
- `structure.json` becomes a flat `{level, title, before}` array. Levels are
  assigned by walking the document, not by a per-heading rank: a heading
  directly after another with no section between is its subtitle and sits one
  level under it; a heading whose styling was seen before keeps its first
  level, so siblings stay siblings; otherwise the global rank applies but never
  descends more than one level. The result is compacted to contiguous `1..N`.
  Labelled headings outrank unlabelled, because styling alone inverts —
  vatican.va wraps Gaudium et Spes's chapters in `<center>` and prints `PART I`
  as an ordinary left-aligned paragraph.
- `manifest.header` captures the document's own masthead, with the language
  selector stripped. Leaving it in the block stream made it a phantom
  top-level structure node; Rerum Novarum's entire two-node "outline" was its
  own title and subtitle.
- Two more input-side heading recoveries: plain-centered runs (gated to runs of
  > = 3 inside the numbered body, which is where page furniture never is) —
  > this is what restores Ad Petri Cathedram's I/II/III/IV part tier and Laudato
  > Si's chapter markers — and italic promotion now gated to the body too, which
  > stops salutations being promoted in documents that also have a heading run.

**Site half, landed the same day**: `DocumentNode` is a new type in
`types.ts` rather than a change to `CccNode`, which the CCC, Compendium and
prayers still share and which is deliberately untouched. `documentOutline`
(corpus.ts) derives the nesting and the ranges the schema specifies -- a
heading owns sections from its anchor until the next heading of equal or
shallower level -- so the shared sidebar TOC, which walks `children` and reads
`paragraphs` for three work types, needed no fork. That derivation is the one
place the risk now lives, so it is split into a pure `buildDocumentOutline` and
unit-tested against the shapes the stored ranges used to get wrong.
`manifest.header` renders as a masthead element above the text.

**Still on the old shape**: the CCC and the Compendium. They need the same
migration, and until then `StructureNode` must keep its current meaning.

## 2026-08-21 — Where a page prints its own table of contents, that outline wins

**What**: `vatican_docs.py` reads the linked table of contents a page prints
ahead of its body, and takes heading levels from it instead of inferring them
from the body's styling. Where a TOC is present it also **promotes** blocks the
style rules missed but the TOC names, and the styling rules stop applying to
that document entirely.

**Why**: every other level signal in the scraper is inferred from how a heading
is _painted_ — bold, italic, centered, and that heading's rank among whichever
styles the document happens to use. That is guesswork, because vatican.va's
markup carries no heading semantics at all: a chapter title and a sub-section
title are both a `<p>` with some emphasis on it. A table of contents is
different in kind. It is the document stating its own outline — which headings
exist, in what order, and, through the TOC's own indentation and emphasis, at
what depth. Inference should defer to a statement, not average with it.

**How widespread — measured, not assumed**: across all 466 pages in
`corpus/raw/vatican-docs`, exactly **three** carry a linked TOC —
`magnifica-humanitas` in both languages (82 entries each, complete) and
`divini-redemptoris.pt` (7 entries, top level only). Nothing else has one. So
this is not a general replacement for the style heuristics; it is an override
that fires on the pages that earned it, and its blast radius is those three.
Worth re-measuring as new documents arrive: Magnifica Humanitas (2026) is the
newest encyclical in the corpus and the only one produced with this markup.

**Detection rule**: a TOC entry is an in-page link whose target is defined
_later_ in the document. That forward direction is the whole discriminator, and
it is what separates a TOC from the far more common footnote back-reference —
`dominum-et-vivificantem` has 594 in-page links and `quadragesimo-anno.pt` 161,
every one of them pointing backward from a note to its marker. A first pass
that counted in-page links without checking direction reported 47 pages with a
"TOC"; the real number is 3.

**Levels come from the TOC's own typography**: bold → 1, italic or indented →
3, neither → 2. The two languages agree on the scheme without using the same
cues — the English page indents its level-3 entries by eight `&nbsp;` _and_
italicises them, the Portuguese one only italicises, and indents with
`margin-left` — so either signal alone is taken as sufficient and neither page
depends on the other's convention.

**Three things this got wrong on the way, all worth keeping written down**:

- _Entries are lines, not links._ Iterating anchors drops the unlinked ones:
  `magnifica-humanitas.pt` prints `CAPÍTULO I` as a link and its title line
  `UM PENSAMENTO DINÂMICO FIEL AO EVANGELHO` as plain text inside the same
  `<b>`. It also over-merges, because that page puts its `<br>` _inside_ the
  anchors. Splitting each TOC paragraph on `<br>` is the only cut that agrees
  with what the page prints.
- _Emphasis must be re-balanced per line._ `<b><a>CHAPTER ONE</a><br/> A
DYNAMIC APPROACH</b>` opens `<b>` on one line and closes it on the next, so
  testing the raw slice reads every emphasised run exactly one line late — the
  chapter number came out a level below its own subtitle.
- _Shift to base 1 before clamping descents, not after._ `divini-redemptoris.pt`
  emphasises none of its seven entries, so all seven read as level 2; clamping
  first pulled only the first of them to 1 and left its six peers a level below
  it.

**The anchors are not usable as the join key**, though they look like the
obvious one: `magnifica-humanitas.en` points both `FOUNDATIONS AND PRINCIPLES
OF THE SOCIAL DOCTRINE OF THE CHURCH` and `The foundations of Social Doctrine`
at the same `#The_foundations`, so keying on them silently merges a chapter
title with its first section. Matching is on text, in document order, and the
**body** text is always kept as the title — the TOC supplies depth, not
wording. The same page prints `The limit, the heart, the grandeur of the human
person` in its TOC and `…the heart and the grandeur…` in the body.

**Promotion is held to a stricter match than levelling** — exact or fuzzy only,
never prefix, and never a numbered paragraph. A prefix match would let a short
TOC entry claim the opening words of a long paragraph and delete it from the
text, which is the failure mode `promote_italic_heading_run` is careful about
for the same reason.

**Also fixed here**, because it surfaced in the same outline: `PIO XI PP.` was
signing `divini-redemptoris.pt` as a top-level heading, because
`_PAPAL_SIGNATURE_RE` allowed `PP.` only _before_ the numeral (`PIO PP. XII`).
Across the whole emitted corpus only three structure titles match the signature
pattern at all, and the third — `Gregory XIII` in `insignes.en` — is anchored
to section 10, so the existing "only after the last numbered paragraph" guard
keeps it.

## 2026-08-22 — A heading printed on three lines is one heading, and the sidebar addresses headings

Two corrections to the day before, both from reading the rendered result.

**1. Identifier, name and subtitle are one heading.** vatican.va prints a
division's opening as separate paragraphs:

```html
<p><b>CHAPTER THREE</b></p>
<p><b>TECHNOLOGY AND DOMINANCE.</b></p>
<p><b>THE GRANDEUR OF HUMANITY IN LIGHT OF THE PROMISES OF AI</b></p>
```

Three blocks, one heading. Stored as three nodes they render as three `h2`s in
a row and three table-of-contents rows, all anchored to the same section — so
all three derive the _same_ range and a position-tracking TOC highlights three
rows at once. Reading the levels off the page's own TOC exposed this; before
that the levelling walk's subtitle rule merely hid it behind an invented tier,
putting the identifier one level _above_ its own name.

So `structure.json` gains optional `ident` and `subtitle` and the scraper folds
the run into one node. They are stored apart from `title`, not concatenated
into it, because they are different things: the identifier names the division's
place in a sequence, the title names its subject, and a renderer wants them
typeset apart — the reader page prints the identifier small and quiet above the
name, and the sidebar shows it as the row's marker.

**What is absorbed, and why not more.** The run must open with a **bare**
division label (`CHAPTER THREE`, `CAPÍTULO IV`, `PRIMEIRA PARTE`) — the only
unambiguous evidence in the source that a heading continues on the next line. A
label that already carries its name (`III OS ARGUMENTOS TEOLÓGICOS`) is
complete, and what follows it is a real sub-heading. Then exactly **one**
following heading is taken as the name, because the third line is genuinely
ambiguous: Ad Petri Cathedram prints `QUARTA PARTE` / `EXORTAÇÕES PATERNAIS` /
`Aos bispos`, and `Aos bispos` is the part's first sub-section, not its
subtitle. Further lines merge only where the page's own TOC assigns them the
same level as the label — a statement, not an inference, and the only reason
Magnifica Humanitas' three-line chapter openings merge while Ad Petri's does
not.

Measured before it was written: **154 runs in 33 works** open with a bare
label, every one an identifier followed by a name.

**2. A table-of-contents row addresses the heading it names, not the section
behind it.** Rows linked `#s{n}` — `before`, the section the heading precedes —
so clicking a chapter scrolled _past_ its title to the first paragraph
underneath. Each heading now carries an id, each row links to that id, and both
come from one indexed list (`documentHeadingAnchor(i)` over the flat corpus
array): the table of contents and the text it describes cannot disagree about
which heading is which, or about where a division starts. `#s{n}` deep links to
sections are untouched — they are the documented address and still what the
section number itself copies.

This covers **both** tables of contents the route renders — the sidebar aside
and the inline one that replaces it below 80rem. Two lists addressing the same
document differently is the same incoherence one level down.

## 2026-08-22 — Theme is two questions, not one list, and both live in one popover

The header carried two triggers for one question ("how does this page look to
me?"): a palette icon opening a four-item theme list, and an `Aa` icon opening
the reading-size stepper. They are now a single **Appearance** popover holding
dark mode, sepia and text size.

**The four-item list was hiding a second axis.** `auto / light / dark / sepia`
made one value answer two independent questions — _do I want dark?_ and _do I
want warm paper?_ — and the collapse cost the reader a real combination:
picking sepia silently meant opting out of `prefers-color-scheme`, so a reader
who liked warm paper by day could not also follow the system into dark at
night. Nothing in the UI said so. Split, they are a tri-state **dark mode**
(auto / on / off) and a boolean **sepia** toggle.

**Sepia yields to dark rather than combining with it.** There is no dark-sepia
palette, and a warm dark would be a new design rather than a composition of two
existing ones — so while dark is showing, the sepia row goes inert and says
why. It is _suspended, not cleared_: the stored preference survives, and
turning dark back off restores the tint. The alternative — letting sepia win
over dark — was rejected because a dark control that silently does nothing is
the more surprising of the two inert cases.

**In the DOM this is two attributes, and their order in `app.css` is the
rule.** `data-theme` now carries only `light` / `dark` (absent = auto);
`data-sepia` is presence-only. The three palette blocks are written light →
sepia → dark at equal specificity, so cascade order alone encodes "dark beats
sepia". `color-scheme` is now pinned per block as well, so an explicit choice
also governs the browser's own scrollbars and form controls.

**Migration is carried in two places, on purpose.** `theme.svelte.ts` maps the
old `glossa:theme` value onto the two new keys, and `app.html`'s pre-hydration
script repeats the mapping by hand because it cannot import anything — without
that copy a returning reader would flash the default theme on every load until
they next touched the setting. `sepia` migrates to dark mode `off`, not `auto`,
which is what leaves that reader's screen exactly as they left it.

## 2026-08-22 — The stored markup is finally rendered, and casing stops mangling numerals

Three defects reported against Magnifica Humanitas, all of which turned out to
be corpus-wide.

**1. Inline markup was stored and never rendered.** The HTML-in-JSON migration
landed `html` on every block, and `CccParagraphText` still read `text_marked`,
so _no_ italics reached a reader anywhere on the site — `the <i>grandeur of
humanity</i> that shines a light` printed flat. The renderer now walks the
markup into nodes and prints those.

**Walked, not pasted into `{@html}`** — and not for safety. `narrow_html`
rebuilds every stored string from a closed five-tag allowlist, so the payload
cannot contain anything else, and the site does hand inert corpus markup to
`{@html}` already (`manifest.header`). Body text is not inert: `<sup
data-fn="12">` is where the footnote disclosure button goes and would render as
an empty superscript, `linkifyProse` must find "cf. Jn 3:16" in the text and
not inside a tag, and the drop cap needs the first letter of the first text
run. Any one of those means walking it.

**2. Headings never stored their markup at all.** `The <i>res novae</i> of our
time` was flattened at parse time. `structure.json` gains optional `title_html`
on the 275 headings that carry _partial_ emphasis. The emphasis around a whole
heading is not stored, because `is_full_bold` IS the heading detector — that
markup is our own signal showing through, not the document distinguishing
words.

**3. Title-casing mangled roman numerals and acronyms.** `III` became `Iii` —
**325 occurrences** across the corpus's ALL-CAPS headings, the second most
common token shape after ordinary words — and `AI` became `Ai`. Numerals are
now recognised by shape (two letters minimum: a lone `I` is the pronoun more
often than the number) and skipped; acronyms need a list, since nothing
distinguishes `AI` from `AS` inside an ALL-CAPS title. That list is derived,
not guessed: it holds the tokens the corpus itself writes in capitals inside
ordinary mixed-case prose (`AI` 59 times, `IA` 57).

A numeral does not consume the title's first-word slot and an acronym does —
`IV OS FRUTOS` is `IV Os Frutos`, while `AI AND THE HUMAN PERSON` is `AI and
the Human Person`.

**Entities moved to parse time.** The renderer decodes text itself now, so the
choice was an HTML entity table on the client, kept complete forever, against
`&amp;`/`&lt;`/`&gt;` — three cases that cannot grow. The scraper decodes the
source's vocabulary once. A side effect worth having: `&nbsp;` now collapses
like the whitespace it is, so 1,301 stored non-breaking spaces stop printing as
a stray double space.

## 2026-08-22 — Post-parse overrides, kept separate from source corrections

**What**: a second fix layer, `pipeline/overrides/`, applied to parsed output
after parsing and before the corpus is written. Same per-work JSON shape as
`pipeline/corrections/`, a different claim, a different directory.

**Why separate.** The two answer different questions and only look alike:

- `pipeline/corrections/` says **the source is wrong**. It edits the fetched
  page before parsing; its evidence argues what vatican.va should have
  printed.
- `pipeline/overrides/` says **the source is fine and our derivation is not**.
  It edits `structure.json`/`sections.json`; its evidence quotes what the
  source actually prints — the thing we failed to reproduce.

Merging them would cost the question `corpus/raw/` exists to answer. The
project's insurance policy is that capture regret is fixed by re-parsing,
never re-crawling (`docs/link-surface.md`), and that holds only while the
record of what the source said stays distinct from the record of how we read
it. Filing a parser defect as a correction puts a change to _our reading_ into
the record of what the Church published.

**Overrides are the exception, not the rule**, and the bar is one question:
does this defect belong to one document or to a class of them? That test has
been decisive every time it has been applied. `III` rendering as `Iii` looked
like a Magnifica Humanitas quirk and was 325 occurrences corpus-wide; a
heading losing its italics looked like one heading and turned out to be every
heading on the site; a tag boundary inserting a space the source does not
render (`R esponsibility`) looked like one title and is 65. Each was a parser
fix repairing hundreds to thousands of units. An override would have repaired
one and left the rest broken while claiming the defect was handled.

So the layer shipped **empty**, deliberately, and
`ls corpus/works/*/overrides-applied.json` is the census of where the parser
gave up.

**Everything fails loudly.** `from` must equal the current value and a locator
must match exactly one unit; anything else is `OverrideDriftError`, surfacing
as `status="overrides-drift"` with the entry id and reason in the run summary.
The reasoning is sharper than for corrections: an override exists _because_ the
parser is wrong, so the parser improving is the expected way for one to stop
matching — the good case, meaning it is now redundant and should be deleted.
That is indistinguishable from the bad case (aimed at the wrong unit) unless
the run says so. An override that silently no-ops is worse than none: the
defect is back and the file still claims it is handled.

**Fixed in passing**: neither drift status was in the run summary's problem
list, so a run printed `corrections-drift: 1` and never said which entry
stopped matching or why — the one thing a loud failure exists to report. Both
now print the entry id and the reason.

## 2026-08-22 — The corpus stays fat, the site ships thin; `kind` states only exceptions

Four changes to how corpus data is stored and shipped, from measuring where
the bytes actually go. `sections.json` is 52 MB of the corpus's 80 MB, and
**97% of it is the same prose three times**: `html` 33%, `text_marked` 32%,
`text` 32%.

**Not a format problem.** NDJSON was considered first and rejected on
measurement: the line-wise-diff argument it usually wins on is worth nothing
here (`corpus/works/` is gitignored — the tracked artifact is `corpus/raw/`),
it parses ~60% slower than one `JSON.parse` of an array (0.78 ms vs 0.49 ms on
the largest file), and streaming/Range arguments are moot because the host
serves brotli (verified: `content-encoding: br`), which puts the worst file at
95 KB on the wire. A binary encoding (MessagePack/CBOR) fails differently:
after brotli the raw-size win largely evaporates, and it would cost the
`jq`-over-the-corpus auditability this project leans on.

**1. `kind` is omitted when it is `prose`.** Absence means the default, as
with `attribution`, `label`, and structure.json's `ident`/`subtitle`/
`title_html`. It nearly disappeared entirely — documents are 99.93% prose —
but it is 11% of CCC blocks and 4% of the Compendium's, so the field earns its
place where quotations are real and says nothing where they are not. Every
stored `kind` now marks an exception, and `grep -c '"kind"'` is the census.
No site code tested for `'prose'`; every read already compared against the
exception, which is what made this safe.

**2. Five `quote` blocks were not quotations**, and are now the overrides
layer's first entries. The PT editions of Sacrosanctum Concilium and Slavorum
Apostoli wrap the document's own words in `<blockquote>` — four lettered
norms introduced by the preceding block, one dash-led list of places the Pope
wishes to visit — which the parser read faithfully as quotations and the site
set in italic, muted, behind a citation rule. Six other `<blockquote>`s in the
corpus are genuine (closing prayers of Deus Caritas Est, Lumen Fidei, Ecclesia
de Eucharistia). Nothing inside one document separates the two uses; the only
discriminator is that the EN editions mark neither, and the parser reads one
document at a time by design. `to: null` was added to the override format for
this: it deletes a field back to its omitted default rather than writing
`"kind": null`, which would invent a state the schema does not define.

**3. Documents are chunked by section**, 50 per chunk, as the CCC is by
paragraph. The rule this replaces justified itself with "~200 KB raw
worst-case (Gaudium et Spes)" — written 2026-08-16, five days before `html`
landed, and stale by 4×: Gaudium et Spes is 623 KB and the real worst case is
Evangelium Vitae at 827 KB. What made it matter is that a hover link preview
of one cited section paid for the whole file, so citing one paragraph of an
encyclical downloaded the encyclical.

**4. `text` and `text_marked` are dropped from the shipped copy** and derived
from `html` (`documentSectionText`). The corpus keeps all three on purpose:
`html_to_text(html) == text_marked` is the round-trip oracle checked over
every section on every run, and an oracle whose expected value is derived from
the thing under test checks nothing. The site runs no such check.

Result: the build is **74 MB → 42 MB**, the worst document asset **827 KB →
171 KB raw / 95 KB → 46 KB brotli**, and documents no longer appear among the
largest shipped assets at all. Note what compression already did, though —
stripping the duplication is only ~12% of the _wire_ cost; the win is client
parse time and retained heap, which are paid in raw bytes.

**Found by the derivation, not fixed here**: deriving text from `html` does
not reproduce the stored `text` byte-for-byte. 2,567 of 14,907 sections
(17.2%) differ — every one by whitespace alone, none by any other character.
`html_to_text` turns every tag into a space "matching `strip_tags`", so the
source's `Constitution <i>Esti minime</i>.` is stored as `Esti minime .`. The
derived form is the faithful one. This is the same tag-boundary defect
previously recorded as "65 headings"; it is in fact 17.2% of all body text,
and the round-trip oracle cannot see it because both sides of the comparison
insert the same space. Fixing it means changing `html_to_text` and re-parsing.

## 2026-08-22 — An emphasis tag is not a word boundary

`strip_tags` turned every tag into a space, so `Constitution <i>Esti
minime</i>.` was stored as `Esti minime .` and `Sh<sup>e</sup>ma` as
`Sh e ma`. **6,436 spurious spaces across 17.2% of sections**, none of them
in the source. Emphasis tags now leave nothing behind; `br`, `blockquote`
and every tag narrowing drops still leave a space.

**Why not strip the whitespace afterwards**, which is the obvious fix: the
corpus's own text prints spaced punctuation on purpose — 2,450 `« x »`,
2,300 `. . .`, 960 `( 1 )`, ~9,800 instances in total — so a rule keyed on
the characters cannot tell the source's spacing from ours, and would corrupt
more than it repaired. Only the tag boundary distinguishes them, and it is
known in exactly one place.

**The substituted space was also hiding source defects.** Where the source
omits a space around a tag (`<i>modus vivendi</i>had`, `the<i>reaffirmation`,
`<i>Rm</i>12, 1`), the substitution silently supplied one. Removing it
surfaced 16 such places, now filed in `pipeline/corrections/` with the raw
markup as evidence — which is what the source-defect policy has always
required, against a code rule that was papering over them. A further 17
flush-tag cases turned out to be the tag sitting INSIDE a word
(`q<i>uando`, `A<i>cta`, `Sh<sup>e</sup>ma`) and are simply correct now.

**Two silent-failure modes fixed on the way**, both found by verification
rather than by reading:

- The round-trip invariant `html_to_text(html) == text_marked` was stated in
  five comments and **enforced nowhere** — only ever run by an ad-hoc script
  somebody remembered to write. It is now checked in `validate_document`,
  per block, every run. That matters more now that the two derivations have
  to agree about every tag.
- Two corrections in one file derived the same `id`, and
  `apply_raw_text_corrections` skips an id it has already seen, so the second
  never applied while the receipt still reported success. `load_corrections`
  now refuses duplicate ids.

Footnote parsing needed one structural change to go with it: Ecclesia de
Eucharistia prints its notes as `<sup>98</sup>Cf. …`, with no space after the
label, so the number and the text are flush once tags are gone.
`parse_footnote_entry` now matches that form on the raw markup, as it already
did for the anchor form — the split is structural and no rule over the
characters could recover it. Without this, all 104 of that document's
footnotes stopped resolving.

Corpus-wide effect: stored `text` and text derived from `html` now agree on
**14,907 of 14,907 sections** (0 differ, was 2,567), and the site's
`documentSectionText` reproduces the corpus exactly rather than approximately.
Validation is unchanged from baseline: 29/3 in phase 1, 266/41/10 in phase 2.
