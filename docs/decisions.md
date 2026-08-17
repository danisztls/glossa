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
