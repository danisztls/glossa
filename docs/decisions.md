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

## 2026-08-22 — One representation: html, and nothing derived from it

`text_marked` and the section's `text` are no longer stored. A document block
is `html` plus an optional `kind`/`attribution`; a section is `n`, `blocks`,
`citations`.

The argument for keeping them was that `text_marked` is the round-trip
oracle's expected value, and an oracle whose expected value is derived from
the thing under test checks nothing. That was true while the check compared a
fresh derivation against a recorded one. It stopped being true the moment the
check moved into `validate_document` (entry above): both sides are now
computed in the same process from the same source string, so the oracle is
exactly as strong with nothing on disk. Storing the copy was never what made
the check work — computing both was.

What the stored copies were actually buying, once that is seen clearly:
33 MB of corpus, a fat-corpus/thin-shipped split with a `thinDocumentSections`
pass and a guard for blocks it could not strip, a second text format every
reader had to branch on, and two more optional fields in the types. Removed
together, including the 47-line stripping helper written earlier the same day
— it existed only to undo a duplication that should not have been created.

**One real consumer had to change.** `build-xrefs.mjs` reads block prose to
find Scripture references in running text, and read `text_marked`. It now
derives from `html`, which makes it the third implementation of the
tag-to-text rule (after the pipeline's `strip_tags` and the site's
`inlineText`) — a genuine cost, paid because a build script run by bare
`node` cannot import the TypeScript one. It is kept small and cross-referenced
in all three places. Verified equivalent rather than assumed: the rebuilt
index is byte-identical in shape to the baseline, 1,925 document entries /
5,358 refs and 1,303 CCC entries / 3,812 refs before and after.

Corpus 80 MB → 47 MB, build 42 MB, validation unchanged (29/3 phase 1,
266/41/10 phase 2). The CCC, Compendium and prayers are untouched: they store
`text_marked`/`text` and have no `html` at all, so they keep both fields until
that migration lands. `CccBlock.text_marked` stays optional for exactly that
reason, and `documentSectionText` keeps the fallback branch for them.

## 2026-08-22 — IntraText evaluated as a document source, not adopted

Companion to the Vulgate survey (`docs/research/vulgate-edition-choice.md`
§3), which disqualified IntraText's `LAT0001` on measured integrity. Asked
again for the Magisterium documents, with the opposite-looking result and one
finding that reconciles them.

**We already parse IntraText.** The Catechism's English corpus is an IntraText
production hosted on vatican.va (`archive/ENG0015/`), and `vatican_docs.py`
generalizes `ccc.py`'s parser for that same template family. The real question
was only whether to fetch those pages from intratext.com instead.

**No, because it is the same text.** Centesimus Annus EN §30–43 measured
0.998–1.000 against our parse, the residual being footnote marker digits
alone. It cannot improve on our text and cannot corroborate it, so it is no
use as the independent witness a `corrections/` entry wants.

**The finding worth keeping: quality there is per-work, not per-site.**
IntraText aggregates separately-sourced e-texts, so one work can be a faithful
copy of the Holy See's own edition while another is a truncated, unattributed
transcription — both were measured, in the same library, a day apart. A good
result for one document licenses nothing about the next; the credits page has
to be checked every time. That is the disqualifying property, more than any
individual work's score.

Full evidence, costs and the one thing that would change the verdict
(coverage vatican.va lacks, e.g. Portuguese) in
`docs/research/intratext-2026-08.md`.

## 2026-08-23 — Latin lands as a content language, via the Clementine Vulgate

**What**: `bible.clementina.la` — the Clementine Vulgate as printed in Hetzenauer's 1914 critical edition, scraped from `sacredbible.org/vulgate1914/` — is in the corpus, 73 books, 1,334 chapters, 35,810 verses. This is the corpus's first Latin work and its first **content language that is not also an interface language**, which is the part with consequences beyond one more edition in a menu.

**Which edition, and why not the other two.** `research/vulgate-edition-choice.md` has the measurements; the short version is that three candidates existed and only one fits. **IntraText's `Vulgata`** (raised as a lead, checked, disqualified) is missing Baruch entirely and truncates books mid-way — Daniel ends at chapter 3, verified against the text and not merely its table of contents, since `_PPA.HTM`, the page after Daniel 3, is Osee 1. It is also not the Clementine but an unattributed Stuttgart-family e-text whose own credits page states its printed source is "Not available". **Nova Vulgata** is a real edition and stays a plausible second one, but its Hebrew psalm numbering inverts the corpus's canonical address space and it is not the text the CCC's apparatus quotes. **Hetzenauer 1914** needed no versification work (Psalm 9 runs to verse 39 before Psalm 10 begins — the traditional merge), carries an explicit public-domain disclaimer, and is served in the same hand-built template as the CPDV pages already parsed from the same operator.

**The Vulgate's own book order was considered and declined.** The corpus's canonical order already matches the Clementine everywhere except Maccabees, which the Vulgate places last in the Old Testament and the corpus places after Esther. Adopting it would have been cheap — `order` is consumed by two sorts and nothing addressable depends on it — but it is a corpus-wide field (`corpus.ts` merges books across editions into one canonical list keyed by OSIS, so a per-edition order cannot exist), so it would have moved Maccabees in the English and Portuguese Bibles to suit the Latin one. Declined by the person directing the work; the Latin edition's `BOOKS` table follows the corpus order and says so, since its source filenames (`VT-45`, `VT-46`) visibly disagree.

**The page format moved to `pipeline/scrapers/sacredbible.py`** rather than being copied into a second scraper. This is the 2026-08-20 entry's rule applied again, with its boundary respected: `common.py` takes only what is identical _and_ source-agnostic, and a `{chapter:verse}` marker is neither — so the shared module is scoped to "one host's page format", documented as something a third scraper against a different site must not import. `Fetcher` is shared here, unlike across the four unrelated scrapers, because these two have no differences to preserve. **Verified the way that entry requires**: `cpdv.py` was re-run `--offline` from `corpus/raw/cpdv/` before and after, and all 73 book files are byte-identical, manifest and receipt differing only in the run timestamp. No re-crawl.

**A source defect found by the validator, fixed in the parser rather than in `corrections/`.** Two verses were missing a `<BR>` separator in the source (2 Reges 8:5–6, Nehemias 3:15–16), which glued two verses into one segment: the second verse was **lost** and its `{c:v}` marker left embedded in the first verse's text. `corrections/` would have been the wrong layer — the source's _text_ is not wrong, its markup is, and a correction per verse would treat a class as two accidents. Splitting each segment on every marker instead of matching one at its start recovers both verses; the run still reports each occurrence as an anomaly, because the source is still defective and a silently-repaired defect is one nobody knows about. Measured before changing anything: 2 affected segments in the Vulgate, **0** in CPDV, and no source anywhere has a marker at a non-zero offset — so the change could not disturb the existing edition, and the byte-identical re-run above confirms it did not.

**The edition override stops resetting itself for a language the interface does not have.** This is `PLAN.md`'s Option 1, now built. `content.svelte.ts` stamped every override with the UI language it was made under and discarded it once `i18n.lang` moved past — correct for the case the 2026-08-15 "content language follows UI language" entry designed it for, and exactly wrong for Latin: no UI language will ever default to the Latin Bible, so no interface event can honestly be read as the reader changing their mind about it. `#stillApplies` now keeps an override whose own content language is not a UI language and leaves every other override on the old rule untouched. `UiLang` stays `'en' | 'pt'` — nobody wants Latin chrome — and `i18n.svelte.ts` grew `UI_LANGS`/`isUiLang` so "is this a language the interface has?" is one exported question instead of three inline repetitions of the same pair.

**What the Latin turned out to be worth beyond a third reading language.** `research/bible-edition-divergence.md` measured 31 chapters where the English and Portuguese editions disagree about verse shape and concluded of the sharpest (Psalm 13, where CPDV carries the Romans 3 catena and Matos Soares does not) that "both editions are faithful to their own textual tradition. Neither is wrong." That was the right conclusion from two witnesses. The Latin is the text CPDV was translated _from_, and it has 7 verses there, siding with the Portuguese — the interpolation is not in CPDV's own base. Measured across the whole corpus: the Latin diverges from EN in 25 chapters and from PT in 6, and in **all 31** EN/PT disagreements it takes a side (PT 25, EN 6, neither 0). So that document's proposed divergence table can carry a documented base reading for every entry rather than a "no formula relates them" verdict for any. Not built here — the table is still a proposal — but its central open question is now answerable.

**A tier collision, caught by an existing test.** The Latin's `abbrevs` initially included each book's own display name, copying `cpdv.py`. `book-token.ts` resolves a typed token in tiers where a real abbreviation outranks a display name, so repeating the name as an abbreviation promotes it a tier, and `genesis` began resolving to the Latin edition ahead of the English book actually called that. Fixed in the scraper, not the test: the Latin emits only _variant_ spellings as abbreviations (`ioannes` for `Joannes`, `matthaeus` for `Matthæus`) — the ones tier 2's exact-name match cannot reach — and leaves the printed name to the `name` field.

**Orthography is preserved as printed and folded only in lookup keys.** The edition prints `i` for `j` throughout (`Iesus`, `iudicium`; not one `j` in the body text) and uses the ae/oe ligatures (1,073 `æ` in the Psalms alone), while its own index inconsistently titles books `Josue`/`Joannes`. Normalising on the way in would make the Latin a silent modernisation of a 1914 critical printing, in the one place it could not be undone without re-parsing. So the text keeps what was printed, and each book carries both spellings as abbreviations so a reader can type either. **Full-text search will need the same folding** when it lands (`PLAN.md` #2) — a reader searching `caelum` against a text that prints `cælum` finds nothing otherwise.

**Verified**: full 73-book crawl at the same 1-second floor `cpdv.py` uses against that host, `robots.txt` re-read first (only page-scan directories are disallowed); validation passes with the two source anomalies reported; `npm run check` and `npm test` clean (412 tests, including a new `content.test.ts` covering the override rule against a real-text Latin fixture); a real-corpus build ships 348 works with all 73 Latin books as content, and preflight passes. **Not verified**: how any of it looks in a browser — no screenshots, per `CLAUDE.md`.

## 2026-08-23 — IntraText does not fill the Portuguese gap either

The one open candidate from the day before (`intratext-2026-08.md` §8:
"coverage vatican.va lacks") was measured and closed.

Our gap is 128 of 216 encyclical slugs with English text and no Portuguese,
concentrated in Leo XIII (70), Pius XI (21), Pius X (16) and Benedict XV (12).
IntraText's Portuguese catalogue holds 109 dated works by those popes and
their successors; matched on promulgation date, 53 are editions we already
have, 53 are genres this corpus does not ingest at all (exhortations,
apostolic letters — which vatican.va publishes too, so a scope decision rather
than a source one), and **3 nominally fill a gap**.

Those 3 collapse on inspection. All are works where vatican.va _has_ the
Portuguese and our parser was defeated by it: the PT editions of Pascendi
Dominici Gregis, Miranda Prorsus and Mense Maio are typeset as continuous
prose with **no paragraph numbering at all**, so there is no address to
capture. Fetching IntraText's own Pascendi PT confirms it is the same
unnumbered translation — two numbered openers on an 83 KB page against the
English edition's 57. The defect is in the Portuguese edition itself, not in
where it is fetched from.

Structurally it was never likely: IntraText's Portuguese holdings sit with
John Paul II (46) and Pius XII (39), where our coverage is already good, and
are almost absent for Leo XIII (2), Pius X (1), Pius XI (2) and Benedict XV
(0) — exactly the pontificates our gap is made of. Both Leo XIII works there
are already in the corpus.

**No open candidate remains for changing the IntraText verdict.**

## 2026-08-23 — The corpus leaves this repository, for a private one beside it

**What**: `corpus/` is gone from `danisztls/glossa`. The texts now live in `glossa-corpus`, a **private** repository expected on disk as a sibling checkout. This reverses the 2026-08-16 entry above, one week old, and it reverses it on the ground that entry itself named as the cost it was accepting.

**Why, in the order the reasons actually matter:**

- **A public repository published the sources, not just the site.** The site shows the parsed text of a work and can withhold any of it per work (`site/unpublished.json`). `raw/` is the complete original pages — everything the parser drops included — mirrored verbatim for anyone who cloned. That is a materially larger reproduction than the one `docs/research/copyright.md` reasoned about, and it was never the thing the copyright position was argued for.
- **A takedown could not have been honoured properly.** The 2026-08-16 entry said this plainly and accepted it: "honouring a request here means rewriting history and force-pushing, and that breaks every existing clone." What it did not weigh is that the history being rewritten would have been the history of all the code and documentation too. A rights request about one Portuguese Bible should not put 155 commits of unrelated work through a rewrite.
- **Growth was the prompting concern and is the weakest of the three.** Measured before deciding: `raw/` is 91 MB over 1,101 files, packing to ~20 MB (4.6× on this HTML). It is also write-once — fetches are cache-first, so a file is stored once and never rewritten, and git's usual binary-churn problem does not arise here at all. Projecting from `vatican-docs` (466 files, 76 KB average), Latin across the CCC and the document families is about +18 MB and each further vernacular another +15–20 MB, so four more languages lands near 190 MB. That is roughly a tenth of where GitHub becomes uncomfortable. **Size alone would not have justified this move**; it is recorded so the next person does not re-derive it.

**Why a separate repository and not a submodule.** Submodules are for a dependency shared by several consumers, or a third-party repo pinned at a version. The corpus is neither: one consumer, and a _pinned_ corpus is a liability rather than a feature — a stale pointer means the site builds against last week's texts, and quietly. A submodule would also multiply the project's own documented worst failure mode: an absent corpus makes the site fall back to fixtures, which `CLAUDE.md` already calls "broken in a confusing way rather than an obvious one", and every clone without `--recurse-submodules` produces exactly that. A private submodule inside a public repository additionally fails `submodule update` for anyone cloning the public one. The decoupling a submodule would have charged for already existed: `CORPUS_DIR`.

**One variable moves both halves.** `pipeline/scrapers/common.py` grew `corpus_dir()`/`raw_root()`/`works_root()`, defaulting to `../glossa-corpus`; `site/scripts/sync-corpus.mjs` defaults to `../../glossa-corpus`; both honour `CORPUS_DIR`, spelled identically. Seven scrapers previously each rebuilt `<repo>/corpus/...` from `__file__` under four different local names — the same duplication the 2026-08-20 entry found in the corrections loader, and now with a sharper failure mode, since a wrong path no longer writes to the wrong subdirectory but to a whole phantom corpus outside the repository.

**A missing corpus is an error in the pipeline and a warning on the site, deliberately.** `common.require_corpus()` runs at the top of every scraper's `main()` and exits with the path it tried, because every scraper creates its output with `parents=True` and would otherwise populate a wrong path in silence. The check is in `main()` rather than in `corpus_dir()` so that path arithmetic stays pure — several scrapers build module-level constants from it, and a check at import time would take `--help` with it. The site keeps warning-and-fixtures: a developer without the private corpus should still be able to run and build the site, which is now a real case rather than a hypothetical one.

**What this costs, stated rather than buried.** A build is no longer reproducible from a clone of this repository alone — the 2026-08-16 entry counted that as a benefit and it is genuinely lost. Anyone with the code but not the corpus gets the fixtures. That is the correct trade for a repository whose data half is other people's copyrighted text, and it is the same trade the project made before 2026-08-16, now with the difference that the corpus is under version control rather than existing only in one directory on one machine.

**The worktree trap shrank.** The old default `../corpus` resolved _inside_ a worktree, where no corpus ever exists, so every worktree needed `CORPUS_DIR`. `../../glossa-corpus` resolves _outside_ it, so a worktree created beside the main checkout now finds the corpus with no help. A worktree elsewhere still needs the variable.

**Verified**: the corpus repository holds 1,103 files (1,101 raw pages, README, `.gitignore`) with `works/` ignored as before; every scraper compiles and imports, `--help` works with no corpus present, and a missing corpus fails with the path it tried; `vulgate.py --offline` reparses all 73 books from the new location; a real build reports 348 works from `/home/dani/Dev/me/glossa-corpus/works` and preflight passes; `npm test` is 412 green. A full pre-split bundle of this repository, plus tarballs of `raw/` and `works/`, were taken before anything was moved.

**The published history was purged, not just the working tree.** Untracking alone would have left every byte readable in GitHub's history, which for a copyright motive achieves nothing. `git-filter-repo --path corpus --invert-paths` rewrote all 155 commits and the result was force-pushed: `.git` fell from 40 MB to 2.1 MB, no `corpus/` blob is reachable from any ref, and the one commit that had touched nothing else (`the corpus lives in the repository now`, which introduced the corpus on 2026-08-16) became empty and dropped out. Every SHA from that point on changed, this entry's own commit included. Rehearsed on a throwaway clone first, and the pre-split bundle taken above is the only copy of the old history that still exists.

**What this does NOT remove, stated so nobody reads the above as more than it is.** `site/src/lib/fixtures/` is still tracked here and still holds real text: 52 verses of the Portuguese Bible, 21 English and 11 Portuguese CCC paragraphs, 7 Compendium questions per language — about 46 KB of copyrighted excerpt, alongside the public-domain CPDV and Vulgate fixtures which carry no exposure at all. `pipeline/corrections/` and `pipeline/overrides/` quote roughly 2,800 characters across 87 entries, mostly single words, and cannot not quote: a correction is meaningless without naming what it replaces. Several `docs/research/` files print verses side by side to make an argument about them.

That is quotation, and the thing this move was about was **reproduction** — `raw/` was the complete original pages, everything the parser discards included, mirrored verbatim for anyone who cloned. The distinction is the whole point of the change, and it is why the fixtures were left alone rather than swept up with the rest. If they are ever revisited, note that `CLAUDE.md` records them as deliberately encoding absent chapters and out-of-range cross-references to exercise the not-in-corpus paths; a replacement has to keep those properties or it silently stops testing them.

## 2026-08-23 — Coverage as a third oracle, and the three works it caught in production

**What**: `pipeline/scrapers/audit.py`, two corpus audits comparing `raw/`
against `works/`; three works withheld; a hard gate in `sync-corpus.mjs`.

**Why a third oracle.** The project had two, and neither can see a block that
was dropped:

- the **round-trip** check compares a block's `html` against its own text. It
  is a statement about one block, so a block that never became a block is
  outside its universe.
- **cross-language symmetry** compares section-number _sets_. It is blind to
  loss _inside_ the sections.

`humanae-vitae.pt` is the case that proves the gap: 31 sections against the
English edition's 31, no manifest warning, symmetry clean — and **21% of its
text absent**. `mortalium-animos.pt` is worse, because the signal points the
wrong way: 19 sections against English's 13, so the asymmetry suggests the
Portuguese has _more_, while half its text is missing.

The new check is deliberately crude and therefore hard to fool: text of the
page's body region, divided by text of everything we stored from it. It cannot
say what was lost or why. It says how much.

**Calibration, not a guess**: all six works withheld by hand back in August
measure 0.0%. The metric agrees with the judgment already made, which is what
makes the rest of its readings worth believing.

**Why coverage is not a clean pass/fail.** It never reaches 100% legitimately —
the body/footnote boundary is sniffed, and where the sniff misses, footnote
text counts against the body. So a 90%-band reading is a research lead, not a
verdict, and only a 50% floor is gated, where no boundary error explains the
gap. Median across the 339 document works is 98.1%.

**The three works.** `vatican_docs.py` writes `PARSER DEFEATED` into
`manifest.notes` when a document's markup beats it — the parser's own verdict
on its own output, and the strongest quality signal the corpus produces. Nine
works carry it. **Six were withheld and three were being published:**

| work                               | coverage | sections        |
| ---------------------------------- | -------- | --------------- |
| `encyclical.quadragesimo-anno.pt`  | 8.7%     | 5, EN 148       |
| `encyclical.miranda-prorsus.en`    | 10.0%    | 4               |
| `vatii.gravissimum-educationis.en` | 85.7%    | 12, mis-divided |

All three are now in `unpublished.json` with their coverage figure in the
reader-facing reason. `unpublished.json`'s own header sets the standard —
"shipping a document with 40% of its paragraphs silently absent is not
[honest]" — and `quadragesimo-anno.pt` was shipping with 91% absent.

**Why it drifted.** `sync-corpus.mjs` sets `notes: ''` on the way into the
build, deliberately: it is scraper diagnostics, not reader-facing. So nothing
downstream — `preflight-deploy.mjs` included — could ever see the marker. The
gate therefore lives **in the sync step**, the last place the marker still
exists, and is a hard error: either withhold the work or repair the parse.
`gravissimum-educationis.en` shows why the marker is worth gating on
independently of coverage — at 85.7% it passes any text-volume floor, and is
still divided wrongly enough that a citation points at the wrong paragraph.

## 2026-08-23 — `_gap_block` keeps unnumbered text too

**What**: the gate in `_gap_block` (`vatican_docs.py`) no longer requires a
recovered gap to open with a paragraph number.

**Why.** The parser already walked the text between consecutive `_BLOCK_RE`
matches — that infrastructure was added for `aeterna-dei.pt` — but returned
nothing unless the gap itself began `N.`, so a bare continuation sentence or a
bare `<i><b>` heading was dropped exactly as before. Corpus-wide that was
**216,671 characters, 1.24% of all body text, in 43 files**.

This was considered against migrating block enumeration to a DOM parse. The
DOM's real advantage is _addressability_ — HTML5 parsing does not wrap stray
text in `<p>`, it just makes the text node reachable — and the gap walk
already provides that. Migrating would also have put four documented
behaviours at risk, all encoded in `_BLOCK_RE`: the `<p(?=[\s>])` guard
against inline SVG `<path>`, `<center>` as one block wrapping label plus
subtitle (a Vatican II finding), `<blockquote>` as `kind: "quote"`, and
non-overlapping `finditer`. Relaxing one gate risks none of them.

**Deliberately text only.** A bare `<i><b>Title</b></i>` is returned as prose,
not promoted to a heading, because promotion would change heading detection
corpus-wide and needs its own measurement. Losing a heading's rank is a much
smaller harm than losing the paragraph's words.

**Measured, per `writing-descriptions.md`'s procedure**: `phase1` +
`phase2 --overwrite`, **zero network fetches in phase 2** and `raw/` untouched
(phase 1's 36 are translation probes). Against the pre-change snapshot of all
684 artifacts:

|                          | result            |
| ------------------------ | ----------------- |
| median coverage          | 98.06% → 98.20%   |
| works improving > 0.5pp  | 20                |
| **coverage regressions** | **0**             |
| `mortalium-animos.pt`    | 50.1% → **98.4%** |
| `humanae-vitae.pt`       | 78.9% → **97.9%** |
| `sections.json` changed  | 6                 |
| `structure.json` changed | 80                |

**The 80 structure changes are the interesting part**, and they are why the
ToC oracle was built first. Recovered blocks feed `promote_italic_heading_run`,
which then finds heading runs that were never visible to it — so structure
improves without any change to heading detection itself. The oracle judged it:
across the 12 works with a recorded ToC, differences fell **79 → 67**,
`humanae-vitae.pt` went from 12 disagreements to **full agreement** (its 12
lost sub-headings are back), and **no work gained a disagreement**. That is
the check that a change touching 80 files it did not target is an improvement
rather than a drift.

`mortalium-animos.pt` is the honest limit: its text is recovered but its 19
inline mini-headings still do not reach the structure tree, because their
markup varies across three variants and the run rule does not catch them.
Text yes, headings no — exactly the scope chosen above.

**Also fixed**: `--overwrite`'s help says "no network", and phase 2 measured
0 — but a phase-2 run still fetches pontiff index pages during discovery (6 on
a single-slug run). The flag governs document re-parsing, not discovery.

## 2026-08-23 — `works/` is tracked in git too, not just `raw/`

**What**: `glossa-corpus/.gitignore` no longer excludes `/works/`. The parsed
corpus — 1,606 files, 54 MB — is now committed alongside `raw/`, reversing the
"Not tracked in git" standing the 2026-08-23 corpus-split entry above gave it.

**Why**: `works/` being a pure, byte-for-byte-reproducible function of `raw/`
was the reason it was gitignored, but reproducibility was never the question —
it answers "can I get back to _a_ correct state," not "can I see what changed
between two states." A pipeline fix, a correction, or an override edits
`works/` and the only way to inspect the effect was re-running the parser
against a stashed copy or trusting the run summary's own numbers. Git history
answers both questions git already exists to answer: diff two states, and
revert to one, for free.

**Why this doesn't reopen the size or reproducibility argument**: the
2026-08-23 split entry's growth case was about `raw/` specifically, because it
is write-once (cache-first fetches never rewrite a file) and git's binary-churn
problem doesn't apply to it. `works/` is regenerated wholesale on every rebuild,
so every commit here _is_ churn — but 54 MB of JSON/text compresses well, and
this repository's whole reason to exist privately is to hold exactly this kind
of size. Reproducibility is unaffected either way: `works/` is still derived,
still safe to `rm -rf` and rebuild (`glossa/CLAUDE.md`'s "safe to rebuild" row
is about deletion safety, not git status), and committing it doesn't make it
authoritative — `raw/` still is.

**Verified**: `.gitignore` and `README.md` updated to describe `works/` as
tracked; nothing else in either repository asserted the old gitignored status.

## 2026-08-23 — Three defects Mortalium Animos exposed

Reported from reading the rendered page: footnotes absent, masthead absent,
opening salutation gone. All three turned out to be classes, and one of them
was a regression introduced hours earlier the same day.

### 1. A fourth footnote-marker template: bare `[N]`

The parser knew `ftn` (anchors), `sup`, and `paren` (`(N)`). Some pages print
markers as plain **`[N]` attached to the preceding character** — `"one."[1]`,
`head,[4]` — with no `<sup>` and no anchor of any kind, so detection fell
through to `paren`, which matches `(N)` only, and nothing was marked.

The note _lists_ were never the problem: `build_footnote_table` parsed
Mortalium Animos' 30 entries correctly all along, with nothing in the body
pointing at them.

Guarded twice against an editorial `[1]`: the bracket must be attached to a
non-space character, and there must be at least three in the body.

**Measured: citations 9,633 → 11,507 (+1,874), across exactly the 36 works
the scan predicted.** Mediator Dei alone prints 171 of them; Mystici Corporis
149, Casti Connubii 100, Quadragesimo Anno 75.

Worth recording that batch 3 described `mediator-dei.en` and no one noticed —
the description brief asks about headings and text and never about the
apparatus. That is a gap in the brief, not only in the parser.

### 2. `pending_first_block` held one block, not all of them

Where a document prints no explicit `1.` and jumps to `2.`, the parser
promotes the preceding unnumbered text into section 1. That field was a scalar
overwritten by every unnumbered block before the first numbered one, so a page
opening with a salutation _and_ a real first paragraph kept whichever came
last. `singulari-quadam.en` lost its 1,747-character opening paragraph this
way; `mortalium-animos.en` lost its salutation.

Now accumulates. Joining rather than keeping separate blocks matches how
`add_continuation` already treats consecutive prose inside a section, so this
adds no new shape to the corpus. `singulari-quadam.en` §1 is 2,142 characters
again.

### 3. The masthead, and the region-start regression behind it

`manifest.header` was populated for all 32 old-shell `vatii` works and empty
for all 307 encyclicals — a split by page shell, which is what gave the cause
away. Two causes, one old and one new:

- `_LANG_BAR_RE` required brackets. The old shell prints `[ AR - BE - … ]`,
  the modern one a bare `EN - FR - IT - LA - PT`, sometimes with `ZH_CN` /
  `ZH_TW` among the codes.
- **`parse_document` started its content region AT the `class="testo"` match
  rather than after the enclosing tag**, leaving `class="testo">` as literal
  text at the head of the region. Harmless while those characters were skipped
  anyway — and not harmless once `_gap_block` began recovering unwrapped text
  the same day, because the debris then became the document's first block:
  `class="testo"> EN - FR - IT - LA - PT`. The language bar with garbage glued
  to it, so `extract_document_header` stopped on block 0.

Fixed in all three copies of the sniff (`vatican_docs.py`, `audit.py`,
`census.py`). **Headers: 32 → 313 of 339 works.**

The regression had been met and dismissed once already: `census.py` carried a
`startswith('class="testo"')` guard written to paper over the same artifact
rather than to ask where it came from. The guard is gone.

### The coverage metric was incomplete, and said so loudly

Applying fix 3 produced 14 apparent regressions of up to 2.6pp. None was real:
the masthead had moved out of `structure.json` (counted by `stored_text_len`)
into `manifest.header` (not counted). A coverage metric that ignores one of
the three places body text is stored reports _relocation_ as loss. `header`
now counts.

After that correction: **median coverage 98.20% → 99.04%, 187 works improved,
4 regressions** — and all four are bracket-footnote works whose `[N]` markers
correctly left the prose to become apparatus, worth about 0.5pp of marker
characters each.

### What held

`phase2` made **zero network fetches** and `raw/` is untouched. The ToC oracle
is **unchanged** — 67 differences across the same 6 works — which is the check
that changing the region start did not drift the structure trees. Both audit
gates pass, 416 site tests pass, `svelte-check` clean.

## 2026-08-23 — The unit number becomes an action, and a bookmark is an address

**What**: clicking a unit number — a Bible verse, a CCC paragraph in the
chapter reader, a Compendium question, a document § — no longer navigates. It
opens `AnchorMenu`, a small horizontal popover offering **copy**, **copy
link**, **view** and **bookmark**. Bookmarks collect in a library at
`/signata`, and a bookmarked unit stays marked where it lives.

**Why the number stopped being a plain link.** It is the most-touched
affordance in the reader and it did exactly one thing, which for a verse meant
navigating to text already on the screen. Everything else a reader wants from
an address they can see — quote it, send it, come back to it — meant selecting
text by hand and rebuilding the URL from the address bar. The element is still
a real `<a href>`: only the unmodified primary click is intercepted, so
⌘/ctrl-click, middle-click and the native context menu are untouched, and the
number still says where it goes to anything reading the page rather than
clicking it.

**A BOOKMARK IS A CANONICAL URL AND A TIMESTAMP, nothing else.** Not the text,
not the citation, not the edition it was read in. `refHref`'s output is
edition-free by design (2026-08-15, editions are a reader preference and not a
path segment), so `/scriptura/exod/3#v12` names the same verse in English,
Portuguese and Latin — resolving a bookmark LATE, through the reader's current
edition, is what makes it follow them across an edition switch instead of
freezing the wording they happened to have open. It also keeps the whole
library inside one localStorage key.

**This cost almost no new machinery, because `parsePreviewHref` already parses
exactly these addresses.** The hover preview (2026-08-16) had to turn an href
back into a typed target and resolve it to text; that is the same question a
bookmark asks. So the bookmark key is the preview's key, `resolveUnitText` is
`resolvePreview` minus the 320-character cap (moved out of the six resolver
branches to the one boundary that wanted it), and the two share a memo cache —
a reader who hovers a verse and then bookmarks it pays one corpus read.

**`PreviewTarget` was wrapped, not extended.** Two bookmarkable addresses are
deliberately not previewable ones: a whole prayer, and a whole document with no
`#s{n}`. Teaching the preview parser about them would silently give every
prayer link on the site a hover popover it does not have. `bookmark-target.ts`
tries `parsePreviewHref` first and adds only those two shapes.

**Two marks on one unit, and each keeps a cue.** A verse can be both bookmarked
and the target of an arriving citation, and the two say different things. The
background wash means "you arrived here from a citation" and keeps the accent
colour it already had; the number means "you saved this" and goes gold
(`--color-bookmark`, the first colour in `app.css` that is not accent-derived).
Cascade order decides each — the bookmark wash is written before `.highlighted`
so the arriving wash wins the background, and `.bookmarked` is written after
`.emphasized` so the number keeps the saved colour — which is the same
mechanism that already makes dark beat sepia.

**`/signata` groups by work rather than listing newest first.** A reading list
is not a history: a reader with eighty marks wants to find the verse where it
lives, and save order tells them nothing. It survives only as the tie-break
inside a section. Every document gets its own section, for the reason the
"Cited in" panel names a work once and lists its references under it
(2026-08-21). The route is static and corpus-free, so it joins `STATIC_PATHS`
in `route-manifest.ts` beside `/colophon` — the edge worker would otherwise
404 it.

**What else moved.** `LinkPreview`'s viewport-clamping positioner became
`floating.ts` when the popover needed the same measurement (the header menus
still position in pure CSS and should: their triggers are never near an edge).
`menu.svelte.ts` gained a fifth consumer and its `triggerEl` widened to
`HTMLElement`. The documents reader's hand-rolled `<a class="section-n">`, which
carried a near-verbatim copy of `ReferenceNumber`'s margin CSS, is now
`ReferenceNumber` — the drift that component's docblock exists to prevent.

**Scope deliberately not taken**: inline references in prose keep navigating on
click and keep their hover preview. They are a different affordance — the
reader is following an argument, not addressing a unit — and putting a menu in
front of every "cf. Jn 3:16" would tax reading to serve citing.

**The popover is a row of icons, not a list of rows.** Four actions with four
distinct glyphs do not need four lines of prose beside a paragraph of text — a
vertical list read as a page of its own opening over the one being read. The
names are carried by `title`, surfacing the way every other icon control on the
site surfaces its own. The bookmark glyph is filled when the address is saved,
which is what carries that state at a glance; `Icon.svelte` grew a `filled`
prop for it, keeping the icon library behind that one file as its docblock
requires.

**The copy confirmation is the icon, not a line of text.** Swapping the pressed
button's glyph for a tick — a cross when the clipboard refuses — says it where
the reader is already looking, and cannot resize the panel. That matters
because a panel opened near the bottom of the viewport is flipped above its
anchor, where any height change moves every button out from under the pointer;
a message appearing under the row did exactly that, which is why it is gone. A
visually-hidden live region carries the same words for assistive tech, which
has no glyph to read.

**`data-link-preview="off"` sits on the panel, not on the `Open` link.** It is
inherited by everything inside, so no action here can raise a hover preview on
top of the popover the reader just opened — which is the actual problem; the
action itself stays, unconditionally, including where the target is the page
already being read, because the reader asked for it and the address bar
following the anchor is a real result. It is called **View**, with an eye,
rather than **Open** with a book: "open" reads as a second thing appearing,
where all this does is take the reader to the address, and a book glyph beside
three abstract ones looked like it named the work rather than the act.

**The edition menu moved to the right of the compare toggle** in every reader's
toolbar, so the row now reads bookmark, compare, edition — the two controls
that change what is on the page sit together at the end, and the mark the
reader can make sits with the heading it belongs to.

## 2026-08-23 — The pipeline was sleeping, then single-threaded, then rewriting a corpus that had not changed

**What**: a full `phase2 --overwrite` — the loop a parser fix is checked in —
went from **2m59s to 1.3s**, and a re-run over the whole pipeline that changes
nothing now writes **0 of 1,477 files** instead of all of them. Four changes,
each of which only became visible once the one before it was out of the way.

**1. A 404 is an answer, not a failure to retry.** The run was making 36
requests while claiming to be a zero-network re-parse, and spending 2m59s of
wall clock against 6.5s of CPU. Every one of those requests was a retry storm
against 12 URLs that return a hard 404 — ten Pius XI/XII encyclicals with no
Portuguese translation, two pontificate indexes that do not exist. Nothing
recorded a failure, so every run rediscovered the same twelve absences at
`MAX_ATTEMPTS` requests and two backoff sleeps each, ~17s apiece.

`MAX_ATTEMPTS`/`RETRY_BACKOFF` exist for the ~1-in-6-to-8 _transient_ edge
failures the 2026-08-15 survey measured. 404 and 410 are the origin answering,
and two more identical requests cannot change the answer, so they now break out
of the loop and land in `pipeline/absent-sources.json`. **Only definitive
statuses go in**: caching a timeout or a 5xx as an absence would silently drop a
real document from the corpus, and that distinction is the whole safety
argument for the layer. An absence is not permanent either — a translation can
appear years later — so `--recheck-absent` re-asks and drops whatever now
exists.

**Why a ledger in `pipeline/` and not a marker in `raw/`**: both were on the
table. `raw/` is the record of what the source said and a 404 is something the
source said — but it is also the one artifact this project treats as write-once,
and a list of what is _missing_ is knowledge we derived rather than a page we
fetched. Kept in `pipeline/` it sits next to `corrections/` and `overrides/`,
the other two places where this pipeline writes down what it has learned about
its sources, and it is reviewable in the public repository.

**2. Only the requests have to be serial.** Removing the sleep left the run
CPU-bound for the first time: 6.25s pinned to one core with fifteen idle, 61% of
it inside `re.Pattern.sub` under `strip_tags`/`narrow_html`. The initial reading
— that parallelism was the wrong lever here — was wrong, and the correction is
worth recording because the distinction is easy to collapse: **concurrent
requests are forbidden, concurrent work was simply being left on the floor.**
vatican.va's 2s `Crawl-delay` is a commitment about someone else's server; it
says nothing about what we do with bytes already in hand.

So `scrape_one` split on exactly that line. `fetch_for_parse` touches the
network and stays strictly serial behind the same delay. `parse_and_write` is a
pure function of the page text plus this document's own corrections/overrides,
writing only its own `works/{work_id}/`, and fans out to a worker pool. 6.25s →
1.33s (2 jobs 1.9×, 4 3.1×, 8 4.5×, 16 4.7×). `--jobs 1` runs inline, which is
what to use when a parser crash needs a real traceback.

Driving the two halves apart has a second effect that matters more on a real
crawl than on a re-parse: a document parses _inside_ the 2s the parent is
already obliged to spend sleeping before the next request. Parsing stops adding
to a crawl's wall clock, rather than the crawl being made faster.

`fork` is requested explicitly rather than taking Python 3.14's new
`forkserver` default: that default guards against fork in a threaded process,
and this scraper has no threads, so workers can inherit an already-imported
module and its compiled regexes copy-on-write instead of re-importing a
4,900-line file per worker.

**3. Answer from memory.** What was left was work the run already knew the
answer to: 717 `exists()` calls per run to find the 12 corrections/overrides
files that are filed; 445 more on the page cache, each immediately followed by
the read it had just proved possible; and 14.4 MB of `sections.json` re-read by
`check_language_symmetry` seconds after being written. The symmetry check now
takes this run's section numbers as a **cache, not a substitute** — it still
sweeps `works/` to decide which pairs exist, so a `--slugs` run is still checked
against the whole corpus rather than quietly against its own slice.

**4. One write guard, shared, because `generated_at` defeats the obvious fix.**
Every scraper rewrote its whole output every run: 18.6 MB for vatican_docs, and
248 of 248 files / 28.5 MB across the other eight. That was tolerable while
`works/` was gitignored and stopped being so the same day it became tracked (see
the entry above) — a diff in which everything looks touched cannot show which
document a parser fix actually moved, which is the entire reason for tracking
it.

Skip-identical-files does not survive being copied eight times, because
`generated_at` is regenerated every run by construction and so defeats the check
on exactly the files that carry one. The scraper that forgot to handle that
would quietly put the churn back. So the rule is `common.write_stamped_json` and
all output goes through it: the comparison substitutes the **stored** stamp,
**all-or-nothing across a work's files**, and an unchanged work keeps the time
it had. Keeping an old stamp on a manifest while a sibling changed underneath it
would be a worse lie than the churn.

That makes `generated_at` mean _when this content was generated_ rather than
_when a run last touched the file_ — the former is the only one worth reading in
a diff.

Payload names may be nested, which is what lets a Bible be judged as the one
unit it is: 73 book files, a manifest counting them, and a corrections receipt,
where a book changing is a reason to restamp the manifest. That required folding
each receipt into the same call, built as a value rather than written separately
ahead of the rest.

**What stayed unshared**: the `Fetcher`s. `common.py`'s docblock rules them out
— different retry policies, different HTTP libraries, different self-chosen rate
limits — and only one line of them was ever the same (`exists()`-then-read, now
`read_bytes_or_none`). A claim that `ccc.py`/`compendium.py`/`prayers.py` shared
the retry-a-404 defect was **wrong and is retracted here**: none of them retry
at all, they raise on first failure, so there is no storm to stop and no absence
worth recording. The grep that suggested otherwise had matched the exception
clause, which is the shape, not the defect.

**Verified**: all ten entry points produce output byte-identical to before,
run offline against a copy of the corpus — same run text at `--jobs 1` and
`--jobs 16`, same 1,229-file `works/` tree for vatican_docs and same 248-file
tree for the rest, same 64 cross-language symmetry findings from the in-memory
path as from disk. A no-change re-run rewrites nothing; tampering with one
book rewrites exactly that book, its manifest and its receipt. `stat` 2,745 →
1,572, bytes moved 67.0 MB → 52.4 MB, writes 1,446 ops/18.6 MB → 217 ops/0 MB.

## 2026-08-23 — The fetchers unify; the policies become data

**What**: `common.py` now holds one `Fetcher`, and each scraper declares a
`FetchPolicy` for its own source. This reverses that module's own docblock,
which had listed `Fetcher` among the things that only _look_ duplicated.

**Why the old position was right, and why it stopped being the answer**: what
it actually said was that the implementations "genuinely differ — retry policy,
raise-vs-return-status error handling, even the HTTP library — and unifying
them is a design decision about behavior, not a mechanical merge." Every word
of that is still true. But it is a reason to _wait for someone to take that
decision_, not a reason never to take it, and read as the latter for long
enough that the same skeleton was written six times: look in the cache; on a
miss, wait out the politeness floor, make one request, store the bytes
verbatim. The differences were never that sequence.

**What survived as policy, deliberately**:

- **Retries, or none.** `vatican_docs.py` crawls hundreds of documents and must
  outlive one dead URL, so it retries transient failures three times with
  backoff. The others crawl one work each, where a failed page means the output
  would be wrong and stopping is correct.
- **Raise or report** — and this is two methods rather than a knob, because it
  is a property of the call site, not a configuration: `try_fetch` never
  raises, `fetch_bytes` does.
- **`delay_before`.** sacredbible.org's floor has always been spent _after_ a
  request completes rather than before the next one starts. Moving it to the
  shared "before" mode looks like tidying and is not: waiting beforehand counts
  parsing time toward the delay, so the identical number would make its
  requests come sooner than they do today. That is a loosening of a
  self-imposed limit, and this change had no business making it.

**Rate limits are still not shared, and the guarantee is now stronger.**
`FetchPolicy` has no default for `delay` or `user_agent`, so a new scraper
cannot inherit another source's floor by forgetting to state one — it does not
compile without an answer. Four copies of `CRAWL_DELAY = 2.0` never provided
that, and they left vatican.va's `robots.txt` commitment reading like an
implementation detail in each file rather than the commitment this document
says it is.

**`common.py` stays stdlib-only**, because `vatican_docs.py`, `ccc.py`,
`compendium.py` and `prayers.py` are PEP 723 scripts declaring
`dependencies = []`. `transport` is a callable, `urllib_transport` is the
default, and `httpx_transport` defers its own import to the call — so only the
two scrapers that already depend on httpx ever pay for it, and they hand in a
live client, so it is installed by definition by then.

**Also moved, as duplication with nothing to preserve**: `corrections_receipt`
(five byte-identical bodies, once the receipts became values rather than
writes), and `fold`, `roman_to_int`, `looks_like_number_typo` — which make
claims about roman numerals, combining marks and digit strings rather than
about any source.

**Deliberately not moved**, and now recorded in `common.py` so the next reader
does not have to re-derive it: `strip_tags`, whose copies differ on `<br/>`;
decoding, since cp1252-always and sniff-the-`<meta>`-charset are claims about
particular servers; the heading heuristics, same category; and `cpdv.py` /
`vulgate.py`'s `validate`, which is **byte-identical today** and must stay
separable — `sacredbible.py` records that those assert things about _an
edition_, not about a template, and being equal right now is not a reason to
make them unable to diverge. `apply_corrections` is byte-identical between the
same two and is left alone for the same reason, pending a decision of its own.

**Verified**: after each migration, not only at the end — all eleven entry
points run offline and diffed byte for byte, the 1,606-file corpus unchanged,
a no-change re-run still rewriting 0 files, and the lint profile matching the
previous commit exactly.

## 2026-08-23 — `apply_corrections` moves, `validate` does not, and the tree gets folders

**What**: three related changes to `pipeline/scrapers/`. The verse-corrections
applier is now shared by all three Bible scrapers; `common.py` became a
`common/` package of seven modules; and the scrapers moved into `bible/` and
`ccc/`.

**The applier, and the line it draws.** `cpdv.py` and `vulgate.py` had
`apply_corrections` identically, and `matos_soares.py` differed only in
reaching a book's fields by attribute rather than by key. It moved, and
`validate` — also byte-identical between the first two — did not. The
distinction is the useful part of this entry, because the two look the same
from the outside: **identical bodies were never the test; whether the source
is entitled to differ is.** Everything in the applier comes from above the
edition: the drift guard and the never-apply-a-`resolution` rule are this
document's source-defect corrections policy, and the `{osis, chapter, verse}`
locator and `{"n", "text"}` verse are `docs/corpus-schema.md`. An edition has
no standing to disagree with either. `validate` is exactly where an edition's
own claims about its own text live — CPDV's chapter counts are not the
Vulgate's — so it stays in three places and is expected to diverge.

Callers pass `(osis, chapters)` pairs, which is the one line that knows a
book's shape and the only thing that was ever genuinely per-source.

**The package.** `common.py` had reached 1,124 lines covering paths, file
I/O, fetching, the absent ledger, corrections, overrides and text utilities.
It is now `common/` with a module each, and `__init__.py` re-exports the whole
surface — so every `from common import X` in the scrapers is untouched and the
split is invisible from outside. `paths.py` is the one that must not import
sideways; everything else may depend on it.

**The folders.** `bible/` holds cpdv, vulgate, matos_soares and the
sacredbible page format the first two share; `ccc/` holds ccc and compendium;
`vatican_docs.py`, `prayers.py` and the three analysis tools stay at the top.

**The cost, which is real and worth stating**: a bare `import common` worked
because Python puts a script's own directory on `sys.path` at startup, and for
a file in `bible/` that directory no longer holds the package. Each moved file
now inserts its parent before importing `common`, which pushes that import
below the top of the file. That is the price of the folders, and it is
recorded in `CLAUDE.md` because the failure mode when someone "tidies" those
lines away is a `ModuleNotFoundError` in a file that otherwise looks fine.
(Ruff exempts imports following `sys.path` manipulation from E402, so this
costs no `noqa`; one added anyway is reported as unused.)

`common/paths.py` also moved a level deeper, so the repo root is `parents[3]`
rather than `parents[2]`. That one is asserted rather than trusted: a wrong
depth yields paths that are merely absent, and `load_corrections` reads an
absent directory as "no corrections filed" — a silent, corpus-wide no-op.

**Verified**: all eleven entry points byte-identical against the pre-change
baseline, run offline from a copy of the corpus, with the 1,606-file `works/`
tree unchanged; a no-change re-run still rewrites 0 files; the three analysis
tools still start; and the site's 448 tests pass after the path references in
its comments were updated.

## 2026-08-23 — Ruff, and a git hook rather than npm scripts

**What**: `ruff.toml` at the repo root, and `.githooks/pre-commit` running ruff
over staged Python. Enabled per clone with `git config core.hooksPath
.githooks`; bypassed with `git commit --no-verify`.

**Config in `ruff.toml`, not `pyproject.toml`.** There is no Python package
here — every scraper is a standalone PEP 723 `uv run --script` file with its
own `requires-python` and `dependencies`. A `pyproject.toml` would exist only
to carry a `[tool.ruff]` table, and would imply a distribution that does not
exist. `target-version = "py311"` is the floor across the scripts (`bible/cpdv.py`
and `bible/vulgate.py` say 3.11), not the median: set higher, the UP rules
start proposing syntax those two cannot run.

**The rule set is pinned, not defaulted.** Ruff's default selection has widened
across releases — the same tree reported 12 findings under 0.16's defaults and
40 under the set chosen here — so relying on the default means an upgrade
silently changes what a commit is checked against. Selected: E, W, F, I, UP, B,
SIM, C4, PIE, RET, PTH, DTZ, ISC, RUF, FURB. Two deliberate exclusions, both
about this corpus rather than about taste: **E501**, because the formatter owns
wrapping and cannot split a long string literal, and source URLs and verbatim
excerpts run past 88; and **RUF001/2/3** (ambiguous unicode), because Latin,
Portuguese and Greek prose with curly quotes and accents is the content, not a
homoglyph attack. DTZ and ISC earn their place here specifically: provenance
timestamps must carry a timezone, and a list of string literals missing a comma
is exactly how a scraper's notes silently lose an entry.

**A hook rather than npm scripts.** They answer different questions — an npm
script says _how_ to invoke a check, a hook says _when it runs_. There is no CI
(a deploy ships one person's working tree), so the alternative to a hook is not
"npm runs it instead", it is nothing running it. And the repo root has no
`package.json`; adding one whose job is to lint Python would put Node tooling in
front of a `uv` pipeline that has no other Node dependency, while `site/` already
owns `format`/`check`/`test` for itself. The hook is therefore Python-only.

**The hook checks the index, not the working tree.** Each staged file is piped
from `git show :path` into `ruff ... --stdin-filename`, so an unstaged fix
cannot make a broken commit pass and an unstaged breakage cannot fail a clean
one. `ruff format --check` on stdin prints nothing and only sets an exit status,
so the hook names the offending files itself.

**The cleanup that came with it**: 3 files reformatted and 57 findings resolved
— 37 autofixed, 20 by hand. Nothing was configured around. The only two worth
naming: a `lambda` in `ccc.py`'s validator closed over the loop variable
`citation_labels` (B023), safe today because `re.sub` calls it within the same
iteration, and now bound as a default argument; and both `zip()` calls gained
`strict=True`, where the surrounding code already asserts the lengths match, so
a future mismatch raises instead of silently truncating.

**Verified**: all 19 files byte-compile, all 10 entry points still start, and
`check-symmetry`, `audit all` and `census --headings` over 25 encyclical/council
works produce output byte-identical to the same commands run from a worktree at
the previous commit. The corpus was not re-parsed; every change is
output-neutral by construction (inlined returns, `contextlib.suppress`,
`unlink(missing_ok=True)`, `date()` for a calendar-validity test, and
re-wrapped f-strings whose concatenations were checked to be character-identical).

## 2026-08-23 — Heading titles: the source's own anchor, not its typography

**What broke.** Both the CCC and the Compendium print a division's label line
("CHAPTER TWO"), its title, and any sub-headings beneath it in the same centred
bold style, as separate `<p>` blocks. Both scrapers built a title by consuming
_every_ bold block after the label until something else turned up, so a chapter
title swallowed whatever the source printed under it — the Compendium's part
two, chapter two came out as **"The Sacramental Celebration of the Paschal
Mystery CELEBRATING THE LITURGY OF THE CHURCH Who celebrates?"**, and the two
sub-headings it ate were lost as structure nodes as well as printed as part of
the title.

**The Compendium's fix: the named anchor.** The IntraText mirror gives every
part/section/chapter title an `<a name="…">` — the target of the page's own
table of contents — and gives it to nothing else: not to the label line, not to
a sub-heading. Verified across both editions: all 64 label lines resolve to an
anchor, in their own block or the one immediately after, and no sub-heading
carries one. So the source states where a title ends, and `heading_title` reads
that instead of guessing from boldness. It also handles the one block that
prints label, title and sub-heading together (PT, "CAPÍTULO PRIMEIRO / CREIO EM
DEUS PAI / OS SÍMBOLOS DA FÉ"): text after the anchor closes becomes a `sub`,
which is what the EN edition's equivalent already parsed as. Result: EN and PT
now agree at 32 nodes above `sub`, and the four wrong titles are gone.

**The CCC's fix is different, because its markup is.** Those mirrors carry no
such anchor on every heading, so the rule there is a cap: **at most one**
continuation block. The EN mirror never prints more than one, which is why the
bug was invisible in English; the PT mirror prints a further sub-heading on four
pages, each of which came out glued onto the title _and_ missing from the tree
("CAPÍTULO PRIMEIRO A REVELAÇÃO DA ORAÇÃO O apelo universal à oração", against
EN's genuinely single-block "CHAPTER ONE THE REVELATION OF PRAYER - THE
UNIVERSAL CALL TO PRAYER"). Anything past the first block now falls through to
`bare_sub`, which is what the EN equivalents were already parsing as. The
language-symmetry oracle is what made all four visible.

**`ccc.en`'s Part One, Section Two has no title** — the mirror's own page prints
"SECTION TWO" followed directly by "I. THE CREEDS", where PT prints "A PROFISSÃO
DA FÉ CRISTÃ". A source omission, not a parser defect; corrected in the entry
below.

## 2026-08-23 — `sources[0]` is the mirror's index page, not its first content page

The site links "source" beside a copyright notice at `manifest.sources[0]`
(`site/src/lib/copyright.ts`), on the documented reasoning that the first entry
is the work's entry point. True for a Bible book or a document, which have one
page. False for the CCC: the crawl's first _content_ page is `__P1.HTM`, the
Prologue, so the link sent a reader to the middle of the work with no way out.

`ccc.py` now puts the mirror's own table of contents first —
`.../ENG0015/_INDEX.HTM` and `.../cathechism_po/index_new/prima-pagina-cic_po.html`.
That page is not a courtesy addition: `discover_pages_*` fetches it to get the
page list, so it is genuinely a source of this work and is already in `raw/`. It
is dated from the crawl that fetched the content pages, since it is the same
run. No site-side special case for the CCC was needed, and none was added.

## 2026-08-23 — The EN mirror declares its own structure, and we now check against it

Every page of the CCC's EN mirror carries its position in the document as a
`>`-separated chain of heading titles:

```html
<meta
  name="part"
  content="PART TWO: … &gt; SECTION ONE THE SACRAMENTAL ECONOMY
 &gt; CHAPTER ONE THE PASCHAL MYSTERY IN THE AGE OF THE CHURCH &gt; Article 1
 THE LITURGY - WORK OF THE HOLY TRINITY &gt; I. The Father-Source …"
/>
```

That is the mirror stating its own structure, independently of the heading
blocks the scraper reads out of the body — and the two disagreed. Checking all
394 declared headings against the parsed tree (`check_declared_structure`)
found **two divisions the mirror declares and never prints**:

- **Part One, Section Two has no title.** The page prints the identifier line
  and goes straight to "I. THE CREEDS", so the mirror's own breadcrumb falls
  through to that — which is why the section can look as if it were _called_
  "The Creeds". It isn't: "The Creeds" is its opening subdivision (¶185–197).
  The section is "The Profession of the Christian Faith", printed as such by
  the PT mirror over the identical range and by the EN Compendium.
- **Part Two, Section One's CHAPTER ONE is printed on no page at all.** Ten
  pages declare it in their breadcrumbs; the PT mirror prints it; ¶1076's own
  closing sentence announces it ("…to explain this 'sacramental dispensation'
  (chapter one)"). Without it, its two articles hung directly off the section.

Both are filed as corrections, in a new `heading_html` field: a raw-HTML
substitution applied pre-parse, like `citation_text`, but with a `page` in its
locator, because a heading's `from` is boilerplate Word markup rather than a
distinctive run of prose (`<p class=MsoNormal>SECTION TWO</b></p>` occurs on
four pages) and "first page where the string appears" is not a safe address.
`raw/` on disk is untouched, as always.

**The check is an audit, not an input.** A chain carries no paragraph numbers
and no kinds, so it can say _that_ a division is missing, never where its
content begins — structure still comes from the body in document order. It is
EN-only: the PT mirror prints no such tag on any of its 28 pages.

**Also fixed, found by the same check**: an "in brief" node was given
`parent.level + 1` and stayed open, so it adopted the next heading — "The
Credo" ended up inside the in-brief of Article 2, "Amen" inside that of
Article 12, and in PT the Decalogue texts inside one too. An in-brief is a
summary box closing a division, not a division; it now takes the deepest
level, so the next heading of any kind closes it.

**Measured, then done in the entry below**: `strip_tags` substituted a space
for every tag, which cost more than spacing.

## 2026-08-23 — `strip_tags` (CCC): inline tags are not whitespace

`ccc.py` flattened HTML by turning **every** tag into a space. That is right at
a block boundary and wrong at an inline one, and both mirrors are Word exports
that open and close inline tags mid-word. It looked cosmetic and was not.

**What it cost, measured against the cached `raw/`:**

- **58 PT citations, lost outright.** The PT mirror marks a footnote reference
  as `(N)` in running text and `_PT_MARKER_RE` looks for exactly that. Where
  the digits sat in their own tag the injected spaces made it `( 219)`, the
  regex missed it, and the reference stayed in the body as literal text with no
  `citations` entry. One of them, `(4 24)` in §889, had the _number itself_
  split across a tag.
- **5 PT footnotes wrong.** The same spaces broke `_pt_footnote_table`'s
  sequential-number scan — `279.` arriving as `2 79.` — leaving footnotes 264,
  279 and 291 empty and making 278 and 290 swallow the next one's text.
- **30 PT footnotes** opened with a stray `. ` (the period lived in a nested
  tag, so the number scan stopped before it).
- **Three headings and a scattering of proper nouns broken mid-word**:
  `VII. T he Eucharist` (source: `<b>VII. T</b><b>he Eucharist`), `S. Nicolau
de Fl üe`, `Erg ä nzungsband`, `Ed. Leon. 4, 2 5.`

**The rule now**: an explicit `_INLINE_TAGS` set (b, i, font, a, sup, sub,
span, and the other inline elements by definition) is dropped with no
replacement; everything else — br, p, td, tr, center, div, table, hr,
blockquote, and anything unforeseen — still becomes a space. Not the
Compendium's blanket "drop everything but `<br>`", because several CCC callers
flatten HTML spanning _many_ blocks (`_pt_footnote_table`, `parse_page_pt`'s
gap recovery) where the tag is the only separator between one block's last word
and the next block's first. Unknown tags default to a space, which is what they
did before — the safe direction.

**`is_full_bold` had to change with it.** It re-joins the block's `<b>` spans
with a space of its own and compares that to the whole block's text; once
`strip_tags` stopped inserting one at the inline boundary, the two sides
disagreed and the split-word heading stopped being recognised as a heading at
all — the structure oracle caught this immediately. Both sides are now compared
with whitespace removed, which is what the predicate actually means: whether
any _visible_ character sits outside the bold. Checked against the Compendium
too; there, zero blocks change under either rule.

**Verified**: 2,150 EN and 568 PT blocks changed, all spacing. EN paragraph
text is character-identical once spaces are ignored, EN citations unchanged at
3,698, PT up 4,856 → 4,888. Both editions still validate, and the declared-
structure oracle is clean. One behaviour change worth naming: PT's unbolded
sub-heading `«FAZ TUDO QUANTO LHE APRAZ» (Sl 115, 3)` loses a word to the
respacing, falls under `is_mini_header`'s eight-word cap, and is now dropped
and logged instead of being appended to the end of §268, where it never
belonged.

## 2026-08-23 — The Fathers are a library, not a work; the Summa is a work

Scoping decision for the two source families `link-surface.md` §"v2 surfaces"
had parked together as "Fathers / Denzinger citations … a further-out,
differently-sourced problem (Migne PL/PG, not vatican.va)". Measured survey and
full sourcing in `docs/research/summa-and-fathers.md`; this entry records what
was decided and why, not the measurements.

**They were parked together and they do not belong together.** Measured over
every `citations[].text` in `works/` — 20,061 strings across 175 works — the
two families have opposite shapes:

- **The Summa is a point target.** 248 citations from 55 works resolve to
  **92 distinct (part, question, article) addresses**. The entire corpus's
  demand fits inside about 3% of one work, with a single closed address space
  and one 13th-century author whose Latin is public domain outright.
- **The Fathers are a long tail.** 1,244 citations reach **157 distinct Migne
  volumes** (PL has 217, PG 161) across ~288 abbreviated work-titles. Augustine
  is 25% of it; the top twelve authors together reach 56%; the remaining 34% is
  Faustus of Riez, Theophilus of Antioch, Epiphanius, Nicetas, Symeon of
  Thessalonica — each a separate work, a separate source, a separate rights
  question. Even inside Augustine the tail repeats, and his largest bucket
  (the _Sermones_) is exactly where the public-domain English selection is
  thinnest.

**So: the Summa is ingested, the Fathers are not.** "Patristics" is not a
backlog item that a later sprint finishes; it is an open-ended commitment
whose size is chosen rather than discovered, and nothing in the corpus needs
that commitment made now.

**Three findings that would have been discovered the expensive way.**

- **No Portuguese source exists for either family**, and this is not the
  encyclicals' kind of gap. There, vatican.va simply has not translated a
  document. Here the translations exist, are modern, and are somebody's
  business: Alexandre Correia's Summa (the one that circulates freely) is under
  copyright until **2055** — he died in 1984 — and Loyola's is in print; the
  only substantial Portuguese patristic corpus is Paulus's 75-volume _Coleção
  Patrística_, commercially in print. `copyright.md` §5's host-anyway posture
  does **not** reach this material: it was adopted as a statement about
  **Church-owned magisterial texts**, and what is owned here is a commercial
  publisher's translation — the same line §4 of that document already draws for
  Bible translations. These are blockers, not exposures to accept.
- **`liriocatolico.com.br`'s free Portuguese Summa is machine-translated**, by
  its own disclosure on the page: _"com apoio de inteligência artificial
  (Anthropic Opus 4.1)"_. Disqualified — this corpus reproduces editions
  somebody published, with provenance. Worth flagging past this decision: that
  site is already the source of `bible.matos-soares.pt`. Its Matos Soares
  chapter pages carry no such disclosure (checked, Genesis 1), so nothing in
  the corpus is implicated — but the site has begun publishing AI-translated
  text, and its provenance now has to be read per work, which is
  `intratext-2026-08.md` §5's per-work-not-per-site lesson arriving a second
  time from a different direction.
- **The goal is separable from the ingest.** The stated aim was expanding
  citation coverage, and **94% of the patristic citations already carry a
  work-internal locator** (`Adv. haeres. 3, 20, 2` names book, chapter and
  section quite apart from the Migne column) in text captured months ago. A
  parsing pass over those strings buys reverse "cited in" panels for both
  families, the frequency table any later subset decision would need, and
  link-out targets — for no fetches and no rights exposure. It is recorded here
  as the recommended next step for the Fathers, in place of an ingest.

**The Summa's sources, and why these.** English is CCEL's edition of the
Fathers of the English Dominican Province translation (Shapcote, 1920 /
Benziger 1947) — public domain by age, and served under a **derivable**
per-article URL (`summa.SS_Q184_A3.html`), which is the property that makes a
sweep work at all and the one `intratext-2026-08.md` §6 faulted IntraText for
lacking. Latin is Corpus Thomisticum (Alarcón, Leonine-based), chosen over two
rejected candidates: **la.wikisource** declares its own text `editio:
incognita, fons: incognitus`, which is the same disqualifier
`vulgate-edition-choice.md` §3 applied to IntraText's `LAT0001`, and the
**Logic Museum**'s parallel text is self-described as incomplete with no stated
source. Corpus Thomisticum states `Iura omnia asservantur`; the claim is over
its transcription, while the Leonine text beneath it (1888–1906) is public
domain by age, which puts it below — not beside — the exposure this project
already accepts on vatican.va. Its pages group many questions each, so the
whole Latin Summa is a few dozen fetches rather than a few thousand.

**Latin here is not the Latin of `PLAN.md` #1.** For the conciliar and papal
documents, Latin is the normative text the vernaculars translate, which is why
`check_language_symmetry` has an undecided question about what it should
assert. The Summa has no vernacular in the corpus to compare against at all:
it ships **EN + LA and no Portuguese**, so the cross-language oracle
`CLAUDE.md` relies on has nothing to check. That is a real, named loss of a
safety net, not an oversight — the validation it would have done has to be
carried by the parser's own invariants instead (every article has a body, an
objection count matching its replies, and a question number inside its part's
declared range).

**Reference resolution falls back rather than failing.** A citation to
`STh I-II, 79, 1` must resolve for a reader whose interface is Portuguese, for
which no edition exists or will. So the effective-edition rule for a work type
becomes an explicit chain — **the reader's language, then English, then
Latin** — replacing `defaultWorkId`'s previous "first edition whose language
matches, or else whatever sorts first". The old behaviour already produced
English for an unmatched language, but only by alphabetical accident
(`en` < `la` < `pt`); a rule the corpus relies on should not be a property of
sort order.

## 2026-08-23 — A structure heading can carry its own footnotes

The CCC's EN mirror prints a `<sup>` footnote reference **inside** two of its
headings, in each case sourcing the phrase the heading quotes:
`III. Christ Jesus — "Mediator and Fullness of All Revelation"` cites _Dei
Verbum_ 2, and `II. "I Know Whom I Have Believed"` cites 2 Tim 1:12. The schema
had nowhere for that, so the marker token stayed embedded in `title` — rendering
literally, as `⟦25⟧`, in the site's index — and the footnote text reached no
output field at all.

**Schema**: a structure node gets `title_marked` and `citations`, the same pair
a paragraph has beside `text`, with the same validated invariants (every token
has an entry, every entry has a token, and no token survives in `title`). Both
are **omitted** unless the heading actually carries an apparatus, so 394 of the
CCC's 396 nodes and every node of every other work are byte-identical to before.
`title` stays the plain form, which is what makes this a non-event for every
consumer that only wants to print a heading.

**Where it renders, and where it must not.** A table-of-contents or index row is
a `<a>`, and a disclosure button inside an anchor is invalid markup — those keep
printing `title` and drop the apparatus, which is also the right editorial call
(a footnote in a navigation row is noise). The reading views, where a heading is
an actual heading, render `title_marked` with the marker as a disclosure exactly
as body prose does. `HeadingText` is that side; `InlineText`'s docblock already
stated the same rule from the other direction.

**Two things fell out of needing a surface for it.** First, `CitationDisclosure`
— the marker, the button, the boxed text and the three ways a citation can be
empty now have one owner instead of a copy per component. (`PrayerMystery`
deliberately keeps its own, unboxed `.citation-text`: a mystery's citation is
always visible rather than disclosed, so the name is taken there and the
treatments genuinely differ.) Second, the CCC chapter view now prints `sub`
headings as well as `article` ones — otherwise the two nodes that carry a
citation appear nowhere as a heading at all. That is deliberately deeper than
the sidebar's `article` floor: 3 to 37 headings per chapter reads like the
printed book in a full-width column and would bury the "you are here" row in a
17rem one.

**Offsets have to be rebased**, which is the one non-obvious bit and is why the
splitting lives in `heading-markers.ts` with tests rather than inside the
component: `title_marked` carries the corpus title, while the view shows
`displayTitle`'s form with the source's redundant ordinal stripped off the
front. Where the displayed title is not a substring of the corpus one at all
(case normalisation is enough to cause that), every marker goes to the end
rather than to a guessed position — a heading's footnote is terminal in both
attested cases, and appending is the only placement that cannot land mid-word.
Both real headings are pinned end-to-end through `displayTitle` in the tests.

The CCC fixture gained a heading with a citation for the same reason: both real
ones sit deep inside chapters the fixture doesn't cover, so the path would never
run under `npm run dev` against fixtures.

## 2026-08-24 — Where we have no text, we send the reader to the source

**Three states collapse into one.** A document address could previously resolve
three ways: we have the text (read it here); the text is withheld in
`site/unpublished.json` (a page explaining that, headed "This text is not
published here" or "We are not showing this text yet", quoting a reason and
linking to vatican.va); or the parse produced nothing and nothing was withheld
(a page with metadata and no body). The reader's question is the same in the
last two — _where is the document_ — and so is the only useful answer, so
`/documenta/{slug}` now **redirects to the source page** whenever this build
has none of the document's text. No notice, no badge, no explanation.

**What was removed**: `UnpublishedNotice.svelte` and its ten strings,
the `kind` field (`quality` | `rights`) that chose between two of them,
`unpublishedInfo`, and the `date`/`reason` fields' trip into the index tier —
`sync-corpus.mjs` now writes only the disabled ids, and the notice a listing
carried ("Not shown here", `.doc-unpublished`) is gone with them.

**Why the notice had to go rather than be reworded.** It was written for a
request that has never arrived. The 2026-08-16 entries built the mechanism
against the copyright posture, then corrected themselves the same day to say it
is really about parse quality — but the reader-facing half kept its original
shape, a considered editorial statement about rights. Every entry in the
registry is our own parser losing to someone's markup. And the badge that
announced it in the library was wrong on most of the rows it appeared on: an
entry is per EDITION, a row is per DOCUMENT, and six of the eight documents
with an entry today are complete in their other language — the row said "Not
shown here" over a link that opened the full text.

**Why redirect rather than hide.** Hiding was tried first, in the same session,
and it is worse in both directions: it loses the two documents that have rows
at all (`miranda-prorsus`, `quae-ad-nos`) from a library whose job is to be a
complete index of the Magisterium, and it silently drops an address that
external links and citations still point at. A redirect keeps the library
complete, keeps every address live, and gets the reader to the text — which is
the one thing they wanted and the one thing we cannot give them ourselves.

**Mechanically**: `documents/[slug]/+page.ts` throws `redirect(307, sourceUrl)`
when no edition has sections built. An external redirect from `load` becomes a
full-page navigation in the browser (SvelteKit turns a cross-origin redirect
into `location.href = …`), on cold entry and in-app navigation alike. The slug
therefore stays in `corpus-routes.json` — a 404 at the edge would strand the
redirect before it ran — and `error(404)` survives only for a manifest with no
source URL at all, which would be a corpus defect rather than a state to design
around.

**`reason` and `date` stay in `site/unpublished.json`** and stop travelling any
further. They are notes for whoever has to decide whether an entry can go, and
they were never something a reader needed. The site now keeps exactly one bit
about a disabled work — `isUnpublished`, an id set — and its only callers are
the ones that would otherwise offer an address with nothing behind it (link
previews, bookmark resolution).

**Unchanged**: withholding is still preferred over shipping a damaged text,
entries are still expected to be temporary, `sync-corpus.mjs` still hard-errors
on a work whose manifest says `PARSER DEFEATED` with no entry filed, and the
colophon still says plainly that a work whose copy came out incomplete is left
out rather than shown with invisible gaps. Still not built, and still worth
saying: a whole-site lever. The 2026-08-16 correction stands — a rights request
from Libreria Editrice Vaticana would concern nearly everything here at once,
and this file is not that lever.

## 2026-08-24 — A number in a heading: which documents mean it as an address

`vatican_docs.py` had a branch for one document's convention: Gravissimum
Educationis EN prints its twelve items as `<p><i><b>N. Title</b></i></p>` with
unnumbered prose beneath, never as a bare `N. body text` paragraph. The branch
fired on any bold heading opening with `N.` whose number continued the
sequence, and it folded the title into the section's first prose block.

Both halves of that were wrong, and the second was wrong in a way the corpus
had been carrying for a while.

**A heading is a heading.** Folding the title into the body left the stored
`html` unbalanced — `strip_leading_number_html` takes off the opening `<i><b>`
along with the number and leaves the matching `</b></i>` behind — and made
Gravissimum Educationis EN §1 open on "The Meaning of the Universal Right to an
Education All men of every race…" where its own PT sibling opens on "Todos os
homens…". PT prints the same twelve titles as ordinary heading blocks, so
reading them as headings is what makes the two editions agree; it is not a
convention invented for the English. A `pending_section_n` on `ScrapeState`
carries the number from the heading to the prose underneath, which is the one
thing an ordinary numbered paragraph never needs: there, the number and the
section's first words are in the same block.

Six published documents gained a real table of contents from this — Redemptor
Hominis EN/PT (5 nodes → 27/26), Laborem Exercens EN/PT (6/5 → 33/32), Dives in
Misericordia EN (9 → 24), Gravissimum Educationis EN (2 → 14). Their section
titles had been prose all along.

**Divino Afflante Spiritu PT was worse than untidy.** Its first numbered
heading became a phantom §1 whose entire content was `50° aniversário da
encíclica " Providentissimus Deus "</i></b>`, and every real section after it
was numbered one too high. Thirty Portuguese sections, all pointing at the
wrong text, in a published work. §1 and §2 now line up with the English.

### Which numbers are addresses

The branch also fired where the numbers were never section numbers, and both
cases were withheld for the damage rather than caught at the source.
`numbering_is_in_headings` now decides once per document, on three things:

- **at least three** numbered headings;
- **they never go backwards.** A gap is fine: Mortalium Animos PT prints 2, 3,
  8, 13, 14, 15, 17, 18 as headings and the rest of its numbers inline, where
  `_gap_block` recovers them. A restart is the fabrication signal — Quadragesimo
  Anno PT's bold numbers run 1, 2, 3 / 1, 3, 4, 5 / 1, 2, 3, a per-part outline
  beginning again in each part, and the parser read the first three and a later
  4, 5 as a section sequence. Five addresses invented for a document that
  numbers nothing, against an EN sibling running to 148.
- **every heading between the first numbered one and the last is numbered
  itself, or a Roman-numeral division.** A section number names the finest
  division a document has, so a heading of another kind underneath means the
  numbers are an outline over it. Miranda Prorsus EN passes the first two tests
  and fails this one: its 1–4 are the encyclical's parts (GENERAL INSTRUCTION,
  MOTION PICTURES, RADIO, TELEVISION) with fifteen unnumbered headings between
  the first and the second alone, and reading them as sections produced four
  ~18,000-character "paragraphs". The Roman exemption is not a loophole —
  Redemptor Hominis, Laborem Exercens and Dives in Misericordia all print
  `I. INHERITANCE`, `II. THE MYSTERY OF THE REDEMPTION` between their numbered
  sections, a **coarser** tier above them.

Each clause is here because a draft without it cost something measured: the
"no numbered paragraphs anywhere" clause an earlier draft carried cost
Mortalium Animos PT seven sections, and requiring nothing at all between the
numbers took Redemptor Hominis, Laborem Exercens and Dives in Misericordia to
zero — 64 real sections — before a full re-parse caught it. That re-parse is the
check: `works/` is tracked in the corpus repo, so the blast radius of a parser
change is `git status` there, and nothing but the two fabricating documents
lost a section.

### Two source defects this uncovered, and the honest count

Redemptor Hominis PT's opening heading is printed **without its number**, alone
among the edition's twenty-two. With nothing to open it, §1's prose was claimed
by nothing and left the corpus entirely — the loss was the encyclical's first
sentence, "O Redentor do homem, Jesus Cristo, é o centro do cosmos e da
história". Redemptor Hominis EN's marker for note 106 prints `06`. Both are
`pipeline/corrections/` entries with the correct value fixed by the page itself
(the surrounding headings run 2..22; the marker's own anchor resolves to the
entry numbered 106, between 105 and 107) rather than inferred from the sibling,
though the sibling agrees in both cases. Both editions now validate.

**The withheld count went 9 → 8, and the two that stayed are differently
described.** Their `PARSER_DEFEAT_NOTES` entries claimed partial failures with
sparse or interrupted numbering; both now say plainly that the edition numbers
no paragraph anywhere, because the sections we had were the parser's own
misreading. The remaining eight are one kind of thing: **an edition that prints
no paragraph numbers at all.** What to do about that is a schema question — the
address a citation would use does not exist in the source — and it is not
answered here.

## 2026-08-24 — Prettier joins the hook, and what the hook does not touch

**What**: `.githooks/pre-commit` now checks staged files with prettier as well
as ruff — everything under `site/`, plus Markdown anywhere in the tree. Same
contract as the ruff half: the **index** is what is checked, nothing is
rewritten, `--no-verify` bypasses.

**This reverses "the hook is therefore Python-only"** (2026-08-23 above). The
reasoning there was about the repo root having no `package.json` and not
wanting Node tooling in front of a `uv` pipeline — and none of that changed.
What changed is the reading of it: the hook does not need a root
`package.json`, it needs a prettier binary, and `site/node_modules/.bin/prettier`
is already on disk for anyone who can run the site. A commit that stages only
Python still never invokes Node, because the prettier half is skipped when
nothing it owns is staged.

**It checks, it does not write.** A hook that reformatted files behind you
would either commit what you did not stage or silently swallow a partial
`git add -p`. Reporting the file and letting you fix it keeps the index the
thing you chose.

**Scope is "what prettier already owns", not "what prettier can parse".** The
site, because `npm run format` already formats it and it is now clean; Markdown,
because the docs here are already written to prettier's defaults. The pipeline's
JSON is deliberately out — `pipeline/corrections/`, `pipeline/overrides/` and
`absent-sources.json` are written by the scrapers, and a hook that reformatted
them would fight their writer on every sweep.

**Two invocation details that are not incidental**:

- Prettier runs **from `site/`** for every file, including the ones outside it
  (addressed as `../path`). A config's `plugins` are resolved against the
  working directory, so `prettier-plugin-svelte` is only found from there —
  run from the repo root, every `.svelte` file fails to load the plugin. The
  default ignore file follows the same rule, and that is what keeps
  `package-lock.json` (listed in `site/.prettierignore`) from being checked.
- **A file prettier cannot parse exits 0 over stdin**, printing the syntax
  error to stderr only. Ruff exits non-zero for the same case, so the two
  halves cannot share a convention: the prettier loop fails on any stderr
  output, and treats a clean stderr as the pass.

**The eight Markdown files that had drifted were formatted in the same
breath** (`README.md`, `docs/corpus-schema.md`, and six under
`docs/research/`), so the hook never fires on someone else's old text. The
diff is entirely cosmetic — `*em*` to `_em_`, table padding, one `jsonc`
fence re-indented — and nothing under `site/` changed, having been formatted
already.

## 2026-08-24 — A heading has words, and an unwrapped bold line is one

Two changes to heading detection, both measured the same way: a full document
re-parse, `git status` in the corpus repo for the blast radius, and
`audit.py toc` against the twelve hand-read tables of contents.

**A fully-bold gap is a heading.** `_gap_block` recovers text the source left
between two blocks with no `<p>` of its own, and its docstring said promoting
such a span to a heading "would change heading detection for the whole corpus,
which is a separate decision needing its own blast-radius measurement", so it
returned prose. The harm was larger than "losing a heading's rank": Mortalium
Animos PT prints **eleven of its nineteen** section headings that way —
`</p> <b>4. <i>Outro erro...</i></b> <p>` — and kept as prose each one opened
its section with its own title as the first words of the body, the same defect
the `<p>`-wrapped case had. The test is `is_full_bold`, the detector every
ordinary block already uses, applied to a span that used to be skipped.

The source is not consistent about which side of the `<b>` its number falls on
— eighteen headings read `<b>4. <i>Title</i></b>` and the first reads
`1.  <b><i>Title</i></b>` — so the test is tried again with a leading number
stripped. Deliberately **not** `strip_leading_number_html`: that one lets tags
count as padding after the period, so it takes the opening `<b><i>` off with
the number and `is_full_bold` then sees no bold at all.

Mortalium Animos PT went from **15 oracle differences to 2**. Five works
changed in total, none lost a section, and two datelines and a salutation
stopped being headings (they are back matter, and the text is still in the
sections).

**A heading has at least one letter.** Both italic-run and centred-run recovery
promote a _run_ of same-styled blocks, and a source that sets its headings
apart typographically tends to set its scene breaks apart the same way.
Laudato Si' EN's `<p align="center">* * * * *</p>`, Laudato Si' PT's and
Fratelli Tutti EN's `* * *` were all standing in `structure.json` as headings.
Punctuation is not a title.

### The separator was holding up a level, and the oracle had recorded that

Removing it took Laudato Si' EN from 1 oracle difference to 10 — every heading
the reader had at level 4 dropped to 3. The mechanism is `compact`: levels are
squeezed to a contiguous range at the end, so a heading that is the sole member
of a tier keeps that tier alive for everything above it. The separator was that
sole member.

The reader was wrong and the parse is now right, which is worth stating
carefully because "correct the oracle to match the parser" is how an oracle
stops being one. The evidence is in the source, not in the parse: the original
reading used a scale with **no level 3 in it at all** except one entry, and it
split two siblings across tiers — `Pollution, waste and the throwaway culture`
at 3 and `Climate as a common good` at 4, when both are subsections of
`I. POLLUTION AND CLIMATE CHANGE` and are printed `<p align="left"><i>` and
`<p><i>`, which render identically flush left. The phantom tier reproduced the
reader's gap exactly, so the two agreed. With it gone the levels compact to a
contiguous 1..4 and the siblings sit together.

The oracle is corrected in place with a `correction` field saying all of this,
rather than silently edited. Laudato Si' EN now matches completely, and the
count of oracles disagreeing with the parse is 6 → 5.

## 2026-08-24 — An indent means a quotation, and front matter ranks against the document's own top division

Two more heading-detection fixes, measured the same way as the last: full
re-parse, `git status` in the corpus repo, `audit.py toc` against the twelve
hand-read tables of contents. Oracles disagreeing with the parse: **6 → 3**.

**An indented block is not a heading.** `heading_style_rank` models centred
against flush-left and nothing else, so an indent is invisible to it — and in
this corpus an indent means a quotation. Dilexit Nos EN quotes Dante in
`<p style="margin-left: 40px;"><i>…</i></p>` and John of the Cross in
`<p><i>&nbsp;&nbsp;… The wounded stag</i></p>`, four and three lines of verse,
short and fully italic and consecutive, which is exactly what the italic-run
recovery pass exists to find. Five of them were standing in `structure.json` as
sub-headings.

`is_indented` reads both spellings — a `margin-left`/`padding-left` on the
block, or three or more leading `&nbsp;` so an ordinary typographic space is
not mistaken for one — and both recovery passes skip an indented block.
`pipeline/overrides/README.md` records the mirror-image case, PT editions using
`<blockquote>` to indent the document's own words; the signal reads the same in
both directions. Corpus-wide this touches 18 blocks in two documents: Dilexit
Nos EN's seven verse lines, and eleven table-of-contents lines in Magnifica
Humanitas PT that were never headings either. Dilexit Nos EN went from 8 oracle
differences to 2, and it was the only document whose output changed.

**Front matter is a peer of the top division the document actually has.**
`depth_key` pinned a PREFACE/PROLOGUE/INTRODUCTION at `_LABEL_DEPTH["part"]`,
which is right for Gaudium et Spes and wrong for every document with no parts
in it. Dei Verbum PT has a PROÉMIO and six CAPÍTULOs, which are peers; ranking
the prologue at part depth invented a tier above the chapters, so every chapter
came out at level 2 — and because a chapter's first sub-heading is levelled
from the chapter, each one followed it down to 3 while its siblings stayed at 2.
All twelve of that document's oracle differences were those six pairs. It now
takes the shallowest label depth the document prints, defaulting to part when it
prints none.

Thirty-one works re-levelled, **none lost a node**, and every one lost exactly
one tier. Caritas in Veritate EN is the clearest: INTRODUCTION, six CHAPTERs and
CONCLUSION, previously 1 / 2 / 1, now all at 1, which is what they are. Dei
Verbum EN's seven nodes are its prologue and six chapters, now all at 1, which
also makes its two editions agree at the top tier for the first time.

Gaudium et Spes PT — the document the original rule was written for — keeps
`PART` at part depth and is strictly improved: its introduction's sub-headings
drop from 4 to 3, directly under the level-2 division that owns them. Its
`PRIMEIRA PARTE` still sits at 2 against `INTRODUÇÃO` at 1, which is a separate
pre-existing question this did not touch and no oracle covers.

## 2026-08-24 — Two headings over one section are two headings

The walker levelled a heading that follows another heading with no numbered
paragraph between them as its **subtitle**, one level down. Sometimes it is.
Ecclesiam Suam EN prints `The Two Vatican Councils` and `Leo XIII and Pius XII
on the Church` as consecutive `<p style="text-align: center;"><i>` blocks
before §31, in identical markup, and six pairs like it — two headings over one
section, not a title and its subtitle. That was six of that document's seven
oracle differences.

A heading goes under the one it follows when the source says so, in one of two
ways: by printing it **smaller** (a strictly deeper `heading_style_rank`), or by
having **named the previous one a division**. The label half is not redundant —
Lumen Gentium PT prints `CAPÍTULO VIII` and the `I. PROÉMIO` that opens it in
exactly the same centred bold, so style alone reads them as peers and flattens
that chapter's whole interior. Requiring only the style test cost Lumen Gentium
PT five differences; adding the label test gave them back.

Ecclesiam Suam EN: 7 differences → 1, the remaining one a heading anchored to
§63 where the reader put it before §64. **Forty-one works re-levelled, none
lost a node.**

### A second reader slip in the same oracle

Laudato Si' EN's `A Christian prayer in union with creation` was recorded one
level under `A prayer for our earth`. The encyclical closes with two prayers,
printed identically as `<p><i>` and appended side by side; they are peers, and
the reading had them nested — the same class of slip as the level-3 gap
corrected earlier today, in the same file. Corrected in place, appended to the
oracle's own `correction` field.

**Twelve oracles, two now disagreeing** — down from six this morning, and from
67 individual differences to 21. What is left is Ecclesiam Suam EN's single
mis-anchored heading, and Lumen Gentium PT's twenty, which are its own
question.

## 2026-08-24 — The Douay-Rheims, with Challoner's apparatus

**What**: `bible.douay-rheims.en` — Challoner's revision as transcribed by
vulgata.online (edition code `DR2`) — is in the corpus. **73 books, 1,334
chapters, 35,804 verses, 1,917 of Challoner's notes, 1,307 chapter arguments
and 151 lines and headings printed inside chapters.** It is the corpus's
fourth Bible edition, its second English one, and the first work of any type
whose apparatus is part of what we serve rather than something the source
threw away.

**It pays a debt this file opened.** The 2026-08-16 naming entry accepted
knowingly that _Glossa Catholica_ "names an apparatus of commentary that does
not exist yet… Until Challoner ships, the name is a promise." The text and the
apparatus are now both on disk. **Nothing renders yet**: gap #3 in `PLAN.md`
(sidenotes on desktop, tap-popovers on mobile) remains the stated prerequisite
for showing a gloss at all, and that entry's rule — "a gloss must never be
confusable with its source, visually or structurally" — is unchanged. Ingesting
now and rendering later costs one crawl instead of two, which is the whole of
`link-surface.md`'s "re-parse, never re-crawl".

**Three schema additions, written for any annotated edition rather than for
this one** (`corpus-schema.md`): `summary` on a chapter, for what the source
prints ahead of the verses to say what is in it — Bible typography calls it the
_argument_, and the field is named for what it is because Knox and Figueiredo
print one too; `text_marked` and `notes` on a verse or a heading, reusing the
`⟦marker⟧` vocabulary the CCC already defines rather than inventing a second;
and `lemma` on a note, for the words it glosses.

**`lemma` exists because emphasis is load-bearing here and nowhere else.** The
corpus's standing rule is that inline emphasis is a v1 loss. Challoner's
apparatus opens each note by quoting the words it glosses, in italics, and
nothing else in a note is italicised — so stripping the markers would leave the
reader guessing where the quotation ends. Promoting it to a field keeps the
boundary without inventing a markup the schema would then have to define.

**Two invariants differ from the CCC's, both deliberately.** A marker is unique
**within its unit, not its chapter**: sources number footnotes per verse and
restart at 1, so John 3's four notes are all marker `1`, and a chapter-wide
index collides on the first annotated chapter it meets. And every token has a
note while **a note need not have a token** — the transcription carries notes
whose anchor it never marks, which drbo.org marks. Dropping those to preserve
1:1 would discard Challoner to satisfy a schema.

**The edition arrived with an oracle the other three never had.**
`bible.clementina.la` is the text Challoner revised against, in the arrangement
he printed, so its chapter counts and verse-number sets are the expected shape
rather than a second opinion. Book lengths are still **discovered** (the API
answers `[]` past the end of a book) so the two stay independent. Chapter
counts agree for all 73 books. **15 chapters differ in their verse-number
set**, reported and not corrected — `research/bible-edition-divergence.md` is
explicit that calling that a defect invites someone to "fix" a faithful text.

**Eleven mis-filed segments, and the bug that nearly buried them.** The source
files two text segments under one verse number eleven times. The parser's first
behaviour was to report the collision and keep the first segment — which
discards real verse text while printing a line that reads like a warning about
formatting. Josue 5:5, 3 Kings 17:19, Proverbs 30:29, Wisdom 6:5, Lamentations
5:5, Baruch 6:37, 2 Machabees 7:5 and 10:25 were each simply **gone**. It is now
a fatal anomaly: a collision either has an adjudicating correction or the run
refuses to write. **The anomaly report truncates at 40 lines, and four of the
eleven were only ever visible past that line** — a report that elides is a
report that can be read as complete, and the count was wrong for an hour
because of it.

**A new correction scope: the source segment.** `pipeline/corrections/` gained
entries whose locator is the source's own record `_id` and whose `from`/`to`
are objects, because what is wrong is a segment's **number**, not its words.
They apply to the fetched records **before parsing** — which is what makes them
corrections and not overrides (`pipeline/overrides/README.md`): the claim is
that the source mis-numbered, not that our derivation slipped. `anchor` carries
a distinctive piece of the segment's text so the drift guard still fires if the
source rewrites the words under a stable id. Fourteen entries in all: eleven
segments, two typos in the apparatus, one stray emphasis marker. Every one
carries the Clementine's verdict, drbo.org's independent transcription of the
same edition, or both.

**Corrections run before validation here, unlike `cpdv.py`.** The two siblings
differ because only one of them has anything to correct: a validator that runs
first reports faults the corrections layer is about to repair and then fails the
run over them. The receipt keeps the audit trail, so validating the corrected
text hides nothing — and the corrected text is the text that ships.

**A check worth stealing for any annotated edition: the lemma oracle.** A lemma
is a quotation, so the source printed those words twice — once in the verse,
once at the head of the note. A lemma absent from its own verse means one of
the two is mistranscribed, and nothing else can see it: the token check cannot,
because an unanchored note has no token to disagree with, and spellcheck cannot,
because the words are plausible either way. It found `Nineve` for `Ninive` at
Jonas 1:2, against thirteen `Ninive`s elsewhere in the same source. It reports
72 of 1,908 and is deliberately **not** fatal — a lemma may carry the Latin it
renders (`Of slime. Bituminis`) or re-point its quotation.

**Book names are Challoner's, with a gloss where his nomenclature traps.** `1
Kings (1 Samuel)`, `3 Kings (1 Kings)`, `4 Kings`, `Apocalypse`,
`Ecclesiasticus`. The four Kings are deliberately **absent** from the jump-box
abbreviations: `1kgs` would mean 1 Samuel in this edition and 1 Kings in the
CPDV, and `book-token.ts` resolves an ambiguous token by whichever Bible the
reader has open, so adding them would make the answer depend on that. `apoc`
and `eccli` are in, which is how the older encyclicals here actually cite.

**Which edition an English reader gets by default is not decided here.**
`corpus.ts`'s `editionInLang` returns the first edition matching the language,
so the CPDV keeps the default because `c` sorts before `d` — an accident, not a
judgment. Making it a judgment is a one-line change and a separate decision.

**A correction to the entry above (2026-08-16).** That entry states that Matos
Soares' notes are "not recoverable by re-parsing, since the upstream source
never carried them (verified against `corpus/raw/matos-soares/`)". The
verification was sound and the conclusion was too narrow: it is true of
**liriocatolico**, the source that edition was scraped from. vulgata.online
carries the same transcription lineage _with_ the apparatus — spot-checked at
John 1, where 50 of 51 verses are byte-identical to what we hold and the one
difference is apparatus formatting rather than words — plus section headings,
chapter arguments and book prefaces. So the recourse is a different source, not
a re-parse of the same one, and the Portuguese notes are reachable by the
scraper family this entry adds. `bible-intro.pt` comes with them.

## 2026-08-24 — A division owns what it prints smaller

`assigned` caches one level per heading style for a whole document. That is
right while every division has the same internal depth, and wrong the moment
one has more. Lumen Gentium PT's chapter VIII alone is cut into `I. PROÉMIO`,
`II. A VIRGEM SANTÍSSIMA NA ECONOMIA DA SALVAÇÃO`, `III. A VIRGEM SANTÍSSIMA E
A IGREJA`, and its sub-headings are styled exactly like the ones sitting
directly under a chapter everywhere else in the document — so cached by style
they came out as **peers of the Roman divisions above them**. Thirteen of that
document's twenty oracle differences were that.

A floor fixes it without touching the cache: a heading the source prints
**smaller** than the division above it is at least one level below it.
`is_division` reads both spellings of a division — `match_label`'s
PART/CHAPTER/SECTION/ARTICLE, and the Roman form printed without the word,
which is the same tier and which the parser had no other way to recognise.

**The style comparison is the whole guard, and it cost two rounds to learn
that.** Without it the floor catches the division's own peers: Humanae Vitae PT
prints `AS CARACTERÍSTICAS DO AMOR CONJUGAL` and Ecclesiam Suam EN prints
`THE ACT OF FAITH` in exactly the markup of the numbered divisions they sit
among — `<p align="center"><b>` and `<p style="text-align: center;">` — and
flooring them put nine and ten headings a level too deep, in two documents that
had been clean. A heading printed exactly like the division above it is its
peer, whatever the numeral says. Lumen Gentium's Marian sub-headings are
`<p align="left"><b><i>` under a centred bold division, which is the case the
floor exists for.

The floor is also bounded to the body, the same way `toc_floor` already is: a
signature or an appendix trailing the last numbered paragraph is back matter,
not a subsection of whatever division came last.

**Eighteen works re-levelled, no work changed a node or a section.**

### Where the twelve oracles stand

Sixty-seven differences across six works this morning; **five across two now**.
What is left is Ecclesiam Suam EN's one heading anchored to §63 where the reader
put it before §64, and Lumen Gentium PT's four trailing nodes (`PAPA PAULO VI`,
the notifications, the `NOTA EXPLICATIVA PRÉVIA`) still one level too deep —
back matter that returns to the top tier, which nothing yet models.

### Three reader corrections, and what they say about the brief

Every oracle correction filed today was the reader adding something the page
does not print: a period standing in for a `<br />` inside one heading, two
pairs of identically-printed siblings recorded as nested, and a level scale
with no 3 in it. None of them was the parser. `docs/writing-descriptions.md` §3
now states the three rules directly — never invent punctuation, two headings
that look the same on the page are the same level, and levels are contiguous —
because these are the mistakes a careful reader actually makes, and the next
batch will otherwise make them again.

## 2026-08-24 — Two source defects in Ecclesiam Suam, and an oracle that must not copy our output

The last ToC-oracle difference in Ecclesiam Suam EN — a heading anchored to
§63 where the reader put it before §64 — turned out to be a **lost digit**.
The paragraph is printed `3.` where the sequence requires `63.`, between the
paragraphs printed `62.` and `64.`, in an edition otherwise numbered 1..119
with no gap and no repeat.

The parse had recovered the section anyway, through `validate_document`'s
one-wide-gap promotion — which is why nothing reported it: 119 sections, no
gaps, no anomalies. What it left behind was the giveaway. The promoted block
kept the literal `3. ` at the head of §63's stored text, and because the
promotion happens when §64 arrives, **both** headings pending at that moment
were anchored to §63 — so `The Term Explained`, which the source prints
directly above `<p>64.`, lost its anchor. A silent gap-fill can be right about
the number and wrong about everything attached to it.

The second defect is in the same document: `Modem Bent of Mind`, the
rn-read-as-m artifact, above the section on how reflection on known truths
suits "the genius and mentality of our contemporaries". Both are filed with
the correct value fixed by the page itself, not inferred from the sibling.

### The oracle records the page, not the corpus

Correcting `Modem` immediately produced a new oracle difference, because the
reader had written down `Modem` — correctly. The oracle is a record of what
the **page** prints; the corpus holds the page **as corrected**; wherever a
correction is filed the two must differ, and reporting that is reporting the
corrections layer working.

The wrong fix is to edit the oracle to say `Modern`, which would make it a
copy of our output and destroy the only thing it is for. `audit.py toc` now
loads the work's filed corrections and applies the same `from`/`to` to the
**read** side before comparing, matching on the visible text of each since a
filed string carries the source's markup and an oracle title does not.

Ecclesiam Suam EN is clean. **Twelve oracles, one disagreeing**: Lumen Gentium
PT's four trailing nodes, still one level too deep.

## 2026-08-24 — A label welded to its title, a line break that is page layout, and back matter

Three fixes from reading the corpus rather than the oracles.

**A label and its name printed inside one block.** `merge_heading_lines` splits
`ident` from `title` when the source prints them as two blocks, which is how
Lumen Gentium PT sets its chapters. The **English** edition of the same
document prints them inside one `<center>`, the label loose and the name in a
nested `<p>` — so `_BLOCK_RE` takes the whole thing as a single block, there
are never two lines to merge, and all eight chapters came out as
`CHAPTER I THE MYSTERY OF THE CHURCH` with an empty `ident`.
`split_label_prefix` matches the label patterns against the flattened text
rather than the markup, so it holds however the two are wrapped. **118 headings
across the corpus gained an `ident` they should always have had.**

**A `<br/>` in a heading is where the source's measure ran out.** Lumen Gentium
PT breaks its eighth chapter after `MÃE DE DEUS` — a wrap in the middle of one
title, which lands in the wrong place at any other width. `title` already
joined the words with a space; `title_html` was carrying the source's page
layout into ours. Stripped, and with it the last `<br/>` in any heading in the
corpus. Recoverable from `raw/`, like every other typographic loss. Note this
is **not** the same judgement as the text of a heading: where two lines are two
different things, both are still kept, joined by a space.

**Back matter is not a subsection of whatever came last.** Everything after the
last numbered paragraph — Lumen Gentium PT's `PAPA PAULO VI`, the notifications
read to the Council, the `NOTA EXPLICATIVA PRÉVIA` — was ranking under chapter
VIII. The walk now restarts there: the first such heading returns to the top
tier and the rest rank against it by style.

That required fixing `body_end`, which took the last block carrying a number
rather than the last that could have opened a section. Lumen Gentium PT's own
appendix numbers its four points `1.` .. `4.`, which put `body_end` past every
heading in the back matter, so nothing downstream could tell body from
appendix. Numbers are now accepted only while they increase, the same gate the
section walker uses.

The English edition shows what this is worth: it prints its own
`APPENDIX From the Acts of the Council` heading, which now sits at the top tier
with the notifications, the preliminary note and Felici's signature beneath it.
The Portuguese prints **no** appendix heading, so nothing was synthesised for
it — its three trailing nodes simply rank at the top instead of under a
chapter. Inventing a heading the source does not print is the one thing this
layer may not do.

**Sixty-nine works changed, none gained or lost a node or a section.** Lumen
Gentium PT: 4 oracle differences → 1.

### One consequence to weigh, not silently absorbed

Laudato Si' EN's two closing prayers follow §246 and are therefore back matter
by this rule, so they moved from level 3 to level 1 — and its oracle, which
already carries two corrections, now disagrees on them. **That is left
standing rather than corrected a third time.** Appended prayers are plausibly
appendix material and plausibly a final section; the source does not settle it,
and bending the same oracle again to match each parser change is how an oracle
stops being evidence.

## 2026-08-24 — Text the source prints with no number on it

A table of contents was listing entries with nothing behind them: Lumen
Gentium's `NOTA EXPLICATIVA PRÉVIA`, Laudato Si's two closing prayers. The
heading was in `structure.json` and the prose was nowhere.

The cause is one branch. `push_heading` closes the open section, so every block
after a trailing heading finds `open_section is None`, and that path logs the
block as orphan and drops it. The manifests said so all along — "17 unnumbered
content blocks not attached to any section (logged, not fabricated)" — honestly
enough that nothing looked wrong, and 291 of 339 works carried such a line.

**The same branch was discarding eight entire encyclicals.** An edition that
prints no paragraph number anywhere never opens a section at all, so _every_
block it has takes that path. Pascendi PT, Quadragesimo Anno PT, Divini Illius
Magistri PT, both editions of Miranda Prorsus, Vigilanti Cura EN, Mense Maio PT
and Quae Ad Nos EN were withheld as parser defeats while their whole text was
being read off the page and thrown away. **495,753 characters across 20 works.**

### `appendix.json`

An ordered array of `{ title?, blocks, citations }` — the heading the source
prints above a run, and the run itself, in the same block model as a section.
Written only where there is one, so its presence answers "does this work have
unnumbered matter" and a stale one cannot survive a re-parse.

Not a section with a null `n`: `sections.json` is indexed by number by the
chunker, the compare view's alignment, `#s42` deep links and the route
manifest, and a numberless row is a hole in all four. A separate file keeps
"a section has a number" exactly true.

**Whether a heading is back matter cannot be known when it is read** — only by
whether a numbered paragraph ever follows it. So the parser opens a unit at
every heading and `start_section` throws the buffer away; whatever survives to
the end of the walk is the appendix. That also leaves the first-paragraph
promotion machinery untouched, which reads the same orphan path and would have
been starved by any eager capture.

### An unnumbered edition is not a defeat

`validate_document` returned "no sections captured at all" for a work with no
numbers, and `build_manifest` stamped it `PARSER DEFEATED`. Both now
distinguish the two: zero sections **and** zero appendix is still a defeat;
zero sections **with** an appendix is an `UNNUMBERED EDITION`, valid, published,
and honest about what it lacks — a citable address, which is a property of the
edition and not a fault in the parse.

**`PARSER DEFEATED`: 8 works → 0. `unpublished.json`: 8 entries → 0.** The
quality-withholding mechanism stays exactly as it was; there is simply nothing
withheld by it today.

**Coverage tells the same story.** The `<50%` band, which held all eight, is
now empty; nothing in the corpus is below 80%; the median moved 99.0% → 99.1%.
`stored_text_len` counts the appendix, because a metric that ignores one of the
four places body text is stored reports storage as loss — the same lesson
`manifest.header` taught it in the morning.

### On the site

`documentHasText` joins `documentHasSections`, and the distinction is the whole
point: gating the reader on section COUNT sent every unnumbered edition to the
redirect meant for works we genuinely cannot show. A unit renders with its
heading and **no `§n` in the margin**, addressed by position (`#a1`) — an
address for scrolling and linking, not for citing. The language-switch fetch
takes sections and appendix together, since fetching only sections would switch
an unnumbered document to a blank page.

## 2026-08-24 — A tail heading and its text were both stored and neither reached the reader

Storing `appendix.json` was not enough to render it, and the reason is worth
recording because both halves were already on disk.

A tail heading lives in `structure.json` with `before: null`. Both tables of
contents gate a link on that field being a number, so they rendered it as
unlinked text — correctly, at the time: `headingsByStart` only emits a heading
that opens a numbered section, so there was no `h{i}` in the body to link to.
The text lives in `appendix.json`, which knows its own title but not which
structure row that title came from. Each half was addressable only through the
other.

`tailRows` rejoins them on the page: the structure rows after the last one that
anchors a numbered section, each paired with the appendix unit whose title
matches, first unclaimed row winning so a document printing the same tail
heading twice still pairs in order. A unit matching nothing — the untitled run
that can open an appendix — still renders, headingless. The heading is then
emitted through the **same** `structureHeadings` snippet the body already uses,
so it gets the ordinary `#h{i}` id and the tables of contents need no second
anchor scheme; they just stop refusing to link rows the body now renders
(`linkableAnchors`).

That refusal is still right for a row the body renders nothing for — Lumen
Gentium PT's `PAPA PAULO VI` is a signature line the source prints as a heading
with no prose beneath it, and it stays plain text rather than becoming a link
to nothing.

**Verified pairing**: Pascendi PT 8 tail rows / 8 units / 8 matched; Lumen
Gentium PT 4 rows / 2 units / 2; Laudato Si' EN 2 / 2 / 2.

**One operational note.** `predev` syncs the corpus, so a dev server started
before a parser run that adds a NEW content file keeps serving the old set:
`import.meta.glob(..., { eager: true })` is resolved at server start, and a
file appearing underneath it is not picked up. Restart after a re-parse that
adds files, not just after one that changes them.

## 2026-08-24 — The tail scrolls into view like anything else

`rowState` decides whether a table-of-contents row is the one being read
entirely from its `paragraphs` range, and a tail heading's range was
`[null, null]`. So even once the appendix rendered, the sidebar stopped marking
anything the moment a reader scrolled into it — and on an edition that numbers
nothing it never marked anything at all, because there was no `s{n}` on the
page to find.

`documentTailNumber` gives each tail row a position strictly above every real
section number. It is positional, never an address: nothing citable is derived
from it, it reaches no URL, and the row still links by its `#h{i}` anchor. The
scroll spy then extends its ordered list with the tail's heading ids instead of
needing a second mechanism.

`buildDocumentOutline`'s contract test asserted the opposite — `[null, null]`,
"a consumer must not link it; inventing a range would make it look
addressable". That was right while the body rendered nothing for such a row and
wrong the moment the appendix landed; the test now pins the new rule and says
why it changed, plus a second case for a document with no last section to count
from.

## 2026-08-24 — A line break in a heading is structure only above a bare label

`heading_inner_html` flattens every `<br/>` inside a heading to a space, on the
reasoning that a break there is the source's measure running out mid-phrase.
Lumen Gentium PT breaks its eighth chapter after `MÃE DE DEUS`, which lands in
the wrong place at any other width, and flattening it is right.

Lumen Gentium EN then showed the other case: `APPENDIX<br/>From the Acts of the
Council*`, where the break separates a division's label from its name and
flattening produces one run-on title. Both are the same character. Nothing in
the markup distinguishes them, so the rule had to come from somewhere else.

**The discriminator is the first line, and nothing else: it must be a division
label carrying no name of its own.** That is the same question
`merge_heading_lines` already asks when a source prints label and name as
separate paragraphs; this applies it when the source prints them as one block
divided by a break. Measured over every heading block in `raw/vatican-docs`
holding a `<br/>` — 326 of them — the test accepts 50 and every one is a label
(`SECTION 1`, `PRIMEIRA PARTE`, `CHAPTER FOUR`). Of the 276 it rejects, none
is: they are wraps (`FRATERNITY, ECONOMIC<br/>DEVELOPMENT AND CIVIL SOCIETY`)
and salutations (`Venerable Brethren,<br/>Health and the Apostolic Blessing.`),
and both have to stay whole. No false positive, no false negative.

42 of the 50 were already split from the flattened text by `split_label_prefix`,
whose patterns anchor on a numeral. The break reaches the other 8 — labels
spelled out in words — and the appendix, whose label carries no number at all.

**`APPENDIX` is a division label that LABEL_PATTERNS cannot hold**, because
every pattern there is anchored on a numeral. It went into `_label_prefix_end`
instead, the offset test now shared by both splitters, which deliberately keeps
it out of `match_label` and so out of the `_LABEL_DEPTH` ranking: three
appendices corpus-wide are not evidence for a new depth tier. It reaches
Sacrosanctum Concilium's `APPENDIX A DECLARATION…` and `Apêndice: Declaração…`
as well, which are the same shape run together rather than broken.

**A pre-existing defect surfaced while measuring**: seven structure nodes
carried the label in `title_html` as well as in `ident`, and the site typesets
those as separate spans — so `CHAPTER VII` printed twice. `title_html` is the
name's markup; `strip_leading_text_html` now removes the label from it wherever
the label moves to `ident`, matching across tag boundaries because the two are
routinely divided by markup (`APPENDIX <i>A DECLARATION…</i>`).

## 2026-08-24 — What a source may set outside a heading's emphasis

`is_full_bold` required a block's **entire** text to sit inside `<b>`, which is
what stops a bold lead-in to an ordinary paragraph reading as a heading. It
also meant a single character outside the run defeated it, and vatican.va puts
one there constantly:

    I. - <b><i>The Study of Scholastic Philosophy</i></b>
    <b><i>A Encíclica «Rerum novarum»</i></b>.
    <b>CHAPTER I</b> - <b>Title</b>

Measured cost: Pascendi EN's entire REMEDIES I–VII list was absent from the
corpus — not merely unlifted, gone — because the roman numeral sits outside
the bold. The predicate now tolerates exactly two things outside the run: the
**enumerator** a source prints in front, and the **punctuation** it closes
with (or sets between two runs). Anything else still means prose. 16 headings
came back across 8 works; no `sections.json` lost text.

**The italic predicate takes neither tolerance, and that was learned twice.**
Granting the enumerator cost Redemptoris Missio EN 9,318 characters: its
`(a) <i>Territorial limits.</i>` sub-labels became headings, and a heading
closes the open section, so §37's remaining prose was orphaned. Granting
trailing punctuation promoted Sacerdotii EN's closing dateline to a level-1
node. `is_full_italic`'s own docstring already said a lone italic block is
presumed not to be a heading; it is the weaker signal, and widening the weaker
signal is what turned a correct reading into lost text.

Those `(a)` sub-labels **are** headings. What cannot hold them yet is the
walk: `push_heading` finalizes the open section, so unnumbered prose after a
mid-section heading has nowhere to go. That is the same defect behind
Gravissimum Educationis' missing Introduction (~2,200 chars per edition, where
`pending_first_block` is discarded on the heading-driven branch) and Rerum
Novarum PT's ~4,800 characters between §5 and §6. One fix, three documents,
and it changes what a section is allowed to contain — so it is its own
decision, not a rider on this one.

## 2026-08-24 — An oracle says whether its edition is numbered

`before` is the number of the first numbered paragraph after a heading, and
null already meant "trailing matter the numbered flow never reaches". Eight
editions print no numbers at all, so every heading in their oracles is null
for an entirely different reason. Both readers who wrote one raised this
unprompted, and neither invented a field for it, which was the right call.

Oracles now carry `"numbered": false`, and `audit.py toc` checks the claim in
both directions rather than trusting it: a declared flag whose oracle still
carries a `before` is a contradiction, and an edition with no sections whose
oracle stays silent is reported until it says so. An undeclared flag is as
easy to get wrong as an undeclared null.

## 2026-08-24 — census.py stripped footnote markers from one side only

Its last-resort test is `n[:60] in kept_text`. The parser turns a footnote
reference into `<sup data-fn="N"></sup>` and stores nothing visible; the raw
page prints `...Encyclical,[48] is not...`. So any paragraph carrying a marker
in its first 60 characters failed every match and was reported `DROPPED`.

Three readers independently reported paragraphs as lost content on that basis,
and each had to verify by hand that the text was in fact present. The census
now marks the raw block with the document's own template — the one
`parse_document` detects — and removes the markers from both sides.
Quadragesimo Anno EN went from 11 dropped blocks to 8, and the three that left
were §83, §84 and §122.

## 2026-08-24 — Prose under a mid-body heading goes back to its section

`open_appendix_unit` buffers the prose under **every** heading, because
whether a heading is back matter cannot be known when it is read — only by
whether a numbered paragraph ever follows it. That is the trick that made
`appendix.json` work. What happened when a numbered paragraph did follow was
`self.appendix.clear()`: the buffer was thrown away, and with it every
unnumbered paragraph a source printed under a mid-body heading.

Measured cost, both found by readers writing table-of-contents oracles rather
than by any check we had: Rerum Novarum PT lost ~4,800 characters between §5
and §6, under three subheadings the English edition never prints; Gravissimum
Educationis lost its entire Introduction in both editions, which is most of
why both sat at ~89.6% coverage — the second and third lowest in the corpus.

`reclaim_mid_body_prose` gives it back, and where it goes depends on whether a
section had already started:

- **A section had started.** The heading interrupted it and the prose beneath
  is the rest of what the source printed there, so it is appended to that
  section and the section re-resolved. `Section.resolve` recomputes citations
  and text from its blocks, so re-running it after appending is safe.
- **No section had started.** This is front matter under its own heading, and
  it opens the first numbered section — which is what `pending_first_block`
  already does for a document that prints no explicit `1.`. That path was
  reachable only from the inline-number branch; a document whose sections open
  from headings instead discarded it.

**The heading itself still anchors at the next section, not at the one its
prose rejoined.** `before` means "the first numbered paragraph after the
heading" and is read off the page by eye when an oracle is written
(`docs/writing-descriptions.md` §3). Anchoring it where the parser decided to
put the text was tried and reverted: it moved Rerum Novarum PT's two headings
from `before: 6` to `before: 5`, disagreeing with the oracle a reader had just
written from the source, and it would leave `before` underivable from the page
at all. The heading points past its own recovered text; that is a real
mismatch, and the honest fix for it is a unit for unnumbered mid-body matter,
not a redefinition of the one field an oracle can check.

## 2026-08-24 — The paired-anchor footnote convention

`detect_marker_template` recognised `name="_ftnrefN"` — with the underscore.
27 Portuguese pages write `name="fnrefN"` without one, and split the marker
across two elements:

    body:  <a name="fnref1">(</a><a href="#fn1">1</a>)
    notes: <a name="fn1">(</a><a href="#fnref1">1</a>) Enc. Annum Sacrum...

Detection fell through to the "paren" template, whose regex needs a literal
untagged `(N)`; here the bracket and the digit sit in different elements, so
nothing matched either. Every footnote on all 27 pages resolved to nothing:
921 markers, `citations: []` in each work, and the note text stored nowhere in
the corpus at all.

Found by a reader writing a table-of-contents oracle for Haurietis Aquas, who
noticed its PT edition had no citations while its EN edition had 126, traced
it to the underscore, and correctly declined to guess how far it spread. It
spread to 27 works: **+697 citations across 23 numbered editions**, plus 80 in
Quadragesimo Anno PT and 69 in Divini Illius Magistri PT, whose text lives in
`appendix.json`.

Four markers still resolve empty, and both causes are the source's, not ours:
Ecclesia de Eucharistia PT prints one entry's `name` on the `<p>` rather than
on an `<a>`, and Mystici Corporis PT labels its thirteenth note "3" with a
back-link to `#fnref3`. Reported as anomalies, not fabricated — the standing
rule for a defect with no known correct value.

## 2026-08-24 — A footnote marker outside a heading's bold run

Gaudium et Spes PT prints `<p align="center"><b>PROÉMIO</b>(1)</p>`, with the
reference outside the emphasis. `is_full_bold` saw a partly-bold block and the
whole heading was dropped as page furniture — the Portuguese counterpart of the
English edition's PREFACE, absent from `structure.json` entirely.

A footnote marker is not part of the heading it hangs off, so `_emphasis_covers`
now tolerates a **bracketed** one after the run. Bracketed only: a bare trailing
numeral would make a heading of any bold line a source happens to follow with a
digit.

That surfaced a second question immediately. The marker survives into the
heading's text as a literal `⟦1⟧` token, because a structure node has no
citations array to resolve it against — the title came out `PROÉMIO⟦1⟧`.
`push_heading` now strips markers from `title`/`ident`/`subtitle`/`title_html`.
The note itself keeps its place in the footnote region and in `raw/`; what is
lost is the reference _from the heading_, which is much the lesser loss against
dropping the heading altogether.

## 2026-08-24 — Portuguese numbers a division three ways

`_PT_LABELS` matched one: the numeral after the noun, in roman (`PARTE II`).
The corpus uses all three — before the noun (`II PARTE`, `1ª PARTE`), spelled
out and leading (`PRIMEIRA PARTE`), and in arabic (`Secção 1`). Gaudium et
Spes PT prints `PRIMEIRA PARTE` and `II PARTE` in the same document; Pascendi
PT prints `1ª PARTE` and `II ª PARTE`.

The cost was not a missing label but a missing TIER. `_LABEL_DEPTH` never saw
a part in those documents, so `CAPÍTULO` ranked at the same level as the part
containing it and the Part>Chapter>Section spine flattened. Gaudium et Spes PT
had `PRIMEIRA PARTE`, `CAPÍTULO I` and `CAPÍTULO II` all at level 1.

Two things about the matching are worth writing down:

- **The ordinal indicator arrives folded to a lowercase letter.** `fold`
  uppercases then normalises NFKD, `'ª'.upper()` is `'ª'`, and NFKD decomposes
  it to a plain `a` — so `1ª PARTE` reaches these patterns as `1a PARTE`, one
  lowercase character in an otherwise uppercased string.
- **The ordinal words and the numeral-first form now live in `_PT_LABELS`
  only.** They had been duplicated into `_label_prefix_end` as a side
  mechanism. Keeping one question answered in two places is what cost a silent
  no-op earlier the same day — a rule measured with `bare_division_label` and
  implemented against `_label_prefix_end`, which disagreed about exactly these
  forms.

A third defect fell out of the same document: `PROÉMIO` was ranked by style
rather than as front matter, because its block text still carried the `⟦1⟧`
footnote token at ranking time and so missed `_FRONT_BACK_MATTER`.
`push_heading` strips markers, but that runs after the level walk.

Eleven Portuguese encyclicals gained a tier along with Gaudium et Spes:
Mediator Dei's four PARTE headings moved to level 1 with their subsections
following, and Pacem in Terris' sub-headings — previously scattered across
levels 1 and 2, some of them peers of the parts themselves — are now uniformly
level 3.

**Against the oracles this reads worse, and honestly so.** Gaudium et Spes PT
went from 47 differences to 63, because its reader recorded all ~92 italic
"argument" headings at one flat level 4 on the "same printing, same level"
rule, while the parser now nests each under whatever contains it — level 2
under the PROÉMIO, 3 under a chapter. That reader flagged the choice as
unresolved rather than picking silently, and it stays unresolved: the three
things they reported as _defects_ are fixed, and the level of identically
printed headings sitting inside different containers is a question about what
a table of contents is for, not a parse bug. Populorum PT's two new
differences are the same question in miniature.

## 2026-08-24 — A masthead's lines are its blocks

`extract_document_header` joined the masthead's blocks with a **space**. Each
of those blocks is its own printed paragraph — a line — so every line break in
a multi-block masthead was lost. Populorum Progressio EN prints its title,
`ENCYCLICAL OF POPE PAUL VI / ON THE DEVELOPMENT OF PEOPLES` and its date as
three separate blocks, and came out with the title run into the line beneath
it. Its Portuguese edition looked right only by accident of markup: that page
sets the whole masthead in ONE block with its own `<br/>`s, so nothing had to
be joined.

Joined with `<br/>` now, 108 mastheads over. Three details the sweep forced:

- Blocks that already end with a break would double it, so runs collapse.
- Emphasis wrapped around nothing (`<b><i> </i></b>`, left between lines on
  several pages) is not a line and is dropped.
- Three mastheads carried a closing tag nothing had opened — the source opens
  `<b><i>` in one block and closes it in the next, and the scan keeps only the
  second. Harmless in storage, not on the page: the site renders `header` as
  html, so a stray `</i></b>` closes a tag the page itself opened.
  `drop_orphan_close_tags` removes them.

**And one bug of my own, worth recording because the regex is still in use.**
`_EMPTY_TAG_PAIR_RE` was `<(\w+)[^>]*>\s*</\1>`, and `(\w+)` backtracks: given
`<br/> </b>` it matches the name as `b`, reads `r/` as attributes, and deletes
the pair. That destroyed Populorum Progressio PT's masthead — closing its
`<b>` and swallowing a line break at once — and it would have done the same
anywhere `strip_leading_text_html` met a break before a closing tag. A `\b`
after the name is what stops it, because there is no word boundary inside
`br`. Caught by reading the sweep's diff, not by any test.

## 2026-08-24 — Magnifica Humanitas in nine languages, and nine interface languages

**What**: Leo XIV's `Magnifica Humanitas` (15 May 2026) is published on
vatican.va in Arabic, German, English, Spanish, French, Italian, Polish,
Portuguese and Russian. All nine are now in the corpus, and the interface is
available in all nine.

**Why this document and not a general policy**: crawling every translation of
every document would be ~2,400 requests against a `Crawl-delay: 2` commitment,
for editions in languages the site had no interface in. So `phase2` keeps
`--langs en,pt` as its default and takes the wider set on request. Magnifica
Humanitas is the one document asked for; the mechanism is general and the
sweep is not.

**The corpus is not the interface, and now it is short in both directions.**
It already carried a content language nobody wants chrome in — Latin. It now
carries eight interface languages the corpus has almost nothing in: an Italian
reader gets Italian chrome and, for 420 of 421 works, the English text through
`CONTENT_LANG_FALLBACK`. That is stated in `i18n.svelte.ts` rather than hidden,
because the alternative is a reader who can read this encyclical in their own
language having to navigate to it in someone else's.

**Nine editions of one document is the best oracle in the corpus.** All nine
carry sections 1–245 and 224 citations, and all nine put the five chapters at
the same paragraphs (17, 46, 90, 131, 182) with the conclusion at 229. Two
editions can tell you a defect exists; nine tell you which one is wrong, so
`check_language_symmetry` now names the odd one out instead of reporting an
EN/PT disagreement with no way to say which side moved.

**What the seven new languages actually cost in the parser**, measured by a
full re-parse: no `structure.json` or `sections.json` byte in any of the 352
works already written changed. Four things had to generalise:

- **Division labels are generated from vocabulary now, not written per
  language.** Every language writes the noun and the number in some subset of
  four arrangements (`CHAPTER I`, `Capitolo primo`, `II PARTE`, `ERSTES
KAPITEL`), so `DIVISIONS` holds the nouns and the number-words and the
  patterns are built from them. The Portuguese list had already been rewritten
  twice this month, each time covering the forms one document happened to
  print. Ordinals are read on both sides of the noun and cardinals only after
  it, because `ONE PART OF THE CHURCH` is prose and `FIRST PART` is not.
- **`fold` is not length-preserving, and Arabic is where that stops being
  theoretical.** Its vowel marks are combining characters, so folding shortens
  the string and every offset past one is short. `fold_index` translates a
  match offset back; `_label_prefix_end` uses it rather than the caveat.
- **The page says where its masthead ends, on the pages that say it.** The
  identity rule — a leading block belongs to the masthead while it names the
  document or its author — is a Latin-script rule wearing a general one's
  clothes. Polish, Russian and Arabic open with a bare kind-word block
  (`ENCYKLIKA`, `ЭНЦИКЛИКА`, `رسالة بابويّة عامّة`) naming neither, and localised
  regnal names (`ЛЬВА XIV`) close the other route in; all three captured an
  empty masthead. These nine pages print a rule of underscores between the
  masthead and the body, and where a page prints one it outranks the guess —
  the same precedence a printed table of contents already gets over inferred
  heading levels. Exactly those nine pages of 468 print it, and six of them
  already had the right masthead, so they are the regression check.
- **A table of contents names a division by its label, not by its wording.**
  The Italian and Russian editions list `CAPITOLO 1` / `ГЛАВА 1` and print
  `Capitolo primo` / `ГЛАВА ПЕРВАЯ`, which no amount of text similarity
  connects. Unmatched, the TOC levelled every sub-heading around the chapters
  and left the chapters to the style walk, which ranked them _below_ their own
  sections — both editions came out as five-chapter documents whose chapters
  sat at levels 3 to 5.

**Right-to-left is a property of the text, not of the reader.** `<html dir>`
follows the interface language, which is right for the chrome and wrong for
the text: an English reader opening the Arabic edition needs that text
right-to-left inside a left-to-right page, and an Arabic reader needs the
opposite for every other work. The reader pages already declare the content
language on the region they render (74 places), so `app.css` derives direction
from that declaration once rather than repeating it 74 times. The stylesheet
was already written in logical properties; fifteen physical ones in ten
component files were converted.

**A defect the ninth language exposed**: `defaultDocumentWorkId` fell from "no
edition in your language" straight to "the first one in the object". Invisible
while every reader read one of the two languages every document had; with nine,
a German reader opening Rerum Novarum landed on an edition chosen by insertion
order. It goes through `editionInLang` now, like everything else.

## 2026-08-24 — Where the source publishes only a PDF, we publish nothing

**What**: `parse_document` now raises `StubPageError` when a parse yields no
numbered section _and_ no unnumbered unit, and nothing is written.

**Why**: `amoris-laetitia.en` is not a parse this scraper lost. The Holy See
publishes that exhortation's English text as a PDF; its HTML page carries a
sixteen-language bar, a six-line masthead, the words "DOWNLOAD PDF", and no
document. The existing `STUB_CONTENT_MIN_CHARS = 300` guard measures the raw
region _before_ the language bar and the masthead have been told apart from
the text, and this page clears 300 on those alone — sixteen languages is a
long bar. So the threshold stays as a cheap floor and the real question is
asked of the result, where the answer is not a guess.

**Zero sections alone is not the test and must not become it.** An edition
that prints no paragraph numbers is a real document whose whole text lives in
`appendix.json` — Pascendi PT, Quadragesimo Anno PT, Vigilanti Cura EN. Both
halves have to be empty.

Measured across every written work with a cached page: exactly one is
affected. Its directory was removed; the Portuguese edition is unaffected and
keeps its own source link, which is all the site ever promised for a text we
do not hold.

## 2026-08-24 — Latin is an interface language

**What**: `UI_LANGS` gains `la` (tenth), `site/src/lib/i18n/la.ts` is a
complete dictionary — all 188 keys, no English fallback anywhere — and the
language menu offers `LA / Latina` third, after English and Portuguese.
`content.svelte.ts`'s `#stillApplies` loses its Latin clause and is now one
line.

**Why**: the exclusion was an assumption about readers, never a fact about
the corpus, and it is the one this site is least entitled to. The canonical
URLs are Latin (`/scriptura`, `/catechismus`, `/preces`, `/signata`). Every
dictionary here already leaves the Summa's divisions in Latin — `Obiectio`,
`Sed contra`, `Respondeo dicendum` — because translating a heading a footnote
cites by its Latin name loses the reader. The corpus carries two whole works
in Latin. A reader who came for the Clementine and the Corpus Thomisticum is
the last reader who needs `Caput sequens` glossed.

**It deletes a special case rather than adding one.** The 2026-08-23 entry
above made an edition override permanent when its language was not a UI
language, on the reasoning that no UI language would ever default to the
Latin Bible, so no interface event could honestly mean "the reader changed
their mind about Latin." That was an escape hatch for a reader the language
menu could not serve. The menu serves them now — one choice gives the
Vulgate, the Corpus Thomisticum and Latin chrome — so the premise is gone and
with it the clause. Every override is again stamped with the UI language it
was made under and sleeps while the interface is elsewhere. The behaviour a
reader loses is narrow and was strange: an English interface holding the
Latin Bible across a switch to Portuguese and back. The behaviour they gain
is that Latin is a language of this site rather than a text stashed behind a
selector.

**`ContentLang` and `UiLang` are now the same ten tags and stay separate
types.** They answer different questions and are equal today by coincidence
of history: a content language arrives when someone ingests a text, an
interface language when someone writes a dictionary. Greek would enter one
alone; the seven that came with Magnifica Humanitas entered the other alone.
Nothing may be written that derives either from the other.

**The dictionary is the Church's Latin, not a reconstruction.** Where the
corpus supplies a term it wins: `Catechismus Catholicae Ecclesiae` is the
editio typica's own title, `CCE` its own siglum. Where the Church has no word
— browser, clipboard, monochrome — the entry is a descriptive phrase rather
than a Latinized loan (`navigatrum`, `Unicolor`, `Textum exscribe`), because
a reader who asks for Latin chrome wants Latin, not `installare`. Three
entries record a decision in the file itself: `Breviter` for the CCC's "In
Brief" because the editio typica's own heading there is `Compendium`, which
names another work in this corpus; `Sponte / Semper / Numquam` for dark
mode's three cells because Latin has no yes/no pair, so the control says when
rather than whether; and the search box's example stays `ioannes 3,16, ccc
1234` because those are the tokens the parser actually accepts — the
Clementine's own abbreviations carry `ioannes`, while `refparse.ts` reads
only `ccc`, so `cce 1234` would be a promise the box does not keep.

**What a Latin reader actually gets.** The Vulgate and the Corpus
Thomisticum by default rather than by override; English for the Catechism,
the Compendium, the documents and the prayers, through `CONTENT_LANG_FALLBACK`
unchanged. That is the same shape as the seven languages added earlier today,
in the opposite proportion — and the Supplementum still resolves to English
for a Latin reader, per address, because that fallback was never a property
of the override store.

## 2026-08-24 — The page's own table of contents is not the document's first paragraph

Reported from the site: `magnifica-humanitas` opened §1 with its own table of
contents, run together as prose. It affected **eight of its nine editions**
and `divini-redemptoris.pt`; the Arabic edition escaped only because it prints
no table of contents at all.

`drop_table_of_contents` existed for exactly this and was too narrow. Its rule
— a pre-body **heading** that a later heading duplicates — matched only the
half of a printed outline that is set in bold. The sub-entries are not bold,
so they never became headings, stayed ordinary prose blocks, and were swept
into the first numbered section.

The fix uses the discriminator already in the file. `extract_toc_outline`
finds the outline by its **forward-pointing** in-page links, which is what
separates a table of contents from the far more common footnote
back-reference. That detection is now `toc_link_span`, and `parse_document`
excises the span from the body before any block is cut, keeping the untouched
string for the outline's levels. **A table of contents never contains a
numbered paragraph**, so a span holding one is not a table of contents and
nothing is excised — a property of the two things being told apart, not a
threshold.

Two mistakes on the way, both kept in the docstrings because each failed in
its own direction. Extending the span over trailing unlinked entries,
measuring "printed again below" from the _span_ rather than from _the
paragraph under test_ made every paragraph contain its own lines and ran the
span to the end of the document — which fails safe, so German and Polish lost
their outline entirely rather than gaining a wrong one. Testing as a substring
rather than as a whole printed line let Polish `WPROWADZENIE` match its own
body, since it is both the title of the introduction and the ordinary word for
introducing something.

Blast radius: 9 works of 346, every structural change a gain — Italian loses
three phantom nodes anchored at §1, Russian reads four more outline entries.

## 2026-08-24 — Unclaimed prose was kept in two places, and printed twice

Found while writing descriptions, then measured: **171 works opened §1 with
the same block twice** — every occurrence in §1, none anywhere else. The
salutation and first paragraph of nearly every encyclical from Leo XIII to
Pius XII read twice on the page.

Two buffers held the same blocks and did not know about each other.
`pending_first_block` accumulates unclaimed prose as one joined string, ready
to be promoted into a section the source never numbered; `add_appendix_block`
buffers the same blocks against the chance that they are back matter. When the
promotion fired, `start_section` handed the buffer back through
`reclaim_mid_body_prose` _and_ appended the promoted string.

`take_buffered_blocks` empties the buffer and hands it to the promoted section
as its content. **The buffered blocks are the better copy**, not the joined
string: `pending_first_block` only accumulates `kind == "prose"`, so a
blockquote printed before the first numbered paragraph is missing from it
entirely.

The same promotion also mis-anchored headings. A heading printed _after_ the
text being promoted belongs to the section that follows, not to the one the
text becomes — Humanae Vitae prints its salutation, then `I. PROBLEM AND
COMPETENCY OF THE MAGISTERIUM`, then `2.`, and that heading was landing at
`before` 1. `start_section` now takes a `claim` count, and the promotion
claims only the headings that predate its buffer.

Removed exactly 191,233 characters across 182 works, and in 178 of them the
removal is exactly the duplicated block. The other four are the same defect
across two sections rather than within one — including the Sacrosanctum
Concilium PT §70 gap-fill this machinery was written for, which was counting
its text into §69 as well.

## 2026-08-24 — Four smaller parse defects, each its own class

Found by reading six documents for descriptions. Each is small; none is
unique to the document that surfaced it.

**A paragraph number whose digits are split by a tag.** Humanae Vitae EN
prints paragraph 14 as `1<b>4.</b>`, opening the bold run between the digits.
Read as a contiguous `\d{1,4}` it was not a numbered paragraph at all: it was
buffered as unnumbered prose, given back to §13, and then promoted a second
time to fill the §14 gap its own absence had created. `PARA_NUM_RE` and
`_NUM_PREFIX_HTML_RE` now tolerate tags — never whitespace, which would read
`1 4.` as fourteen. One page in the corpus does this.

**A sub-heading before the first numbered paragraph.** `promote_italic_heading_run`
excluded that whole region, and had to: a salutation is printed in exactly the
italics of a sub-heading. But an encyclical whose §1 is unnumbered framing
text puts its first real sub-heading there too.
`augustissimae-virginis-mariae.en` kept nine of its ten and lost _Mary's Place
in the Incarnation and Redemption_. The two are told apart by what follows — a
heading is followed by the numbered paragraph it heads; the salutation by the
document's unnumbered opening prose. **The run itself is still established by
the body**: counting a pre-body block toward the threshold let one push a
document over it on its own, and `quum-diuturnum.en` then turned an italic
continuation of §4's own sentence into a heading. 27 headings recovered.

**A language bar of one code.** A document published in a single language
still prints the bar, and it is then a bare `EN`. That failed the whole-block
test, was not the title or the author either, and ended the masthead scan on
block one — leaving `ENCYCLICAL OF POPE PIUS XI / ON CATHOLIC MISSIONS / TO
OUR VENERABLE BRETHREN…` to be read as the opening words of §1. 19 mastheads
recovered, none lost. Only the whole-block test was loosened; the prefix form
still needs two codes, or it would truncate any masthead line beginning with a
two-letter word.

**Front matter promoted above its own peers.** `depth_key` lifts a
PREFACE/INTRODUCTION to the top tier, which is right where the document prints
it as the top tier — Gaudium et Spes' PROÉMIO and Divini Redemptoris PT's
INTRODUÇÃO are both set in the best heading style their page uses. It is wrong
where the front matter is printed in a _lesser_ style than something else on
the page: `spe-salvi.en` sets "Introduction" in the bold-italic of the eight
headings it sits among, while the page's best style belongs to the three
centred `I./II./III.` settings nested inside one of them. Promoting it
invented a tier above its own peers and pushed every other heading in the
document one level down. Gated on `b.style <= best_heading_style`.

Two rules were tried against all 46 ToC oracles and **rejected for regressing
documents they were not aimed at**: suppressing the promotion whenever the
front matter shares a style with any ordinary heading (turned a perfect
`divini-redemptoris.pt` into 25 differences), and releasing `division_floor`
for a style already established elsewhere (best total of all — 159
differences against 175 — but it cost `lumen-gentium.pt` fourteen, the very
case the floor was written for). Corpus-wide oracle differences: **175 → 169,
with no work worse than before**.

That last one — _Mary, Star of Hope_ parsing three levels deep — did have a
rule, found after those two were rejected: **a heading printed like the
document's FIRST heading is a peer of it, not a subsection of whatever
division precedes it.** `division_floor` is released for it. Mary is set in
the bold italic that opens the encyclical and follows the centred `III.`,
which is the only reason it was being buried.

That is what a rule looks like when it is about the page rather than about the
document: it takes `spe-salvi` to zero oracle differences and changes exactly
three works in the corpus, all of them the same shape — `spe-salvi.en` and
`spe-salvi.pt` alike, which is the cross-language agreement that says a
levelling rule is real, plus `sacerdotalis.pt`'s closing _Intercessão de
Maria_. `lumen-gentium.pt` and `gaudium-et-spes.pt`, which the two rejected
rules pulled in opposite directions, are untouched. Corpus-wide oracle
differences: **175 → 168**.

## 2026-08-25 — What the language bar says, and what the server actually has

The nine-language pass raised an obvious question — which languages does the
Holy See actually publish an encyclical in — and the cheap answer turned out
to be wrong.

Every vatican.va document page prints its own language bar, so the set can be
read off `raw/` at zero cost. Done that way over the 232 magisterial documents
on the site, it reports Italian 85%, Spanish 40%, French 37%, German 21%.
Fetching the pages says otherwise:

|     | bar says | actually there |
| --- | -------- | -------------- |
| fr  | 32%      | **94%**        |
| de  | 15%      | **94%**        |
| it  | 83%      | **94%**        |
| es  | 36%      | **94%**        |
| la  | 71%      | 72%            |
| pl  | 9%       | 10%            |
| ar  | 3%       | 4%             |
| ru  | 2%       | 3%             |

**The bar under-reports by a factor of six for German and French.** It is a
navigation widget maintained per page, not an index of what exists, and the
modern shell's URLs are one path substitution apart whether the bar mentions
them or not. Latin and the three low-coverage languages match, which is what
made the discrepancy legible rather than a suspicion: the bar is not wrong at
random, it is stale on exactly the editions added after the page was built.

So the corpus now holds every encyclical in the nine interface languages and
Latin as **raw only** — 1,007 pages, no works — and the absent ledger carries
723 entries recording the (language, document) pairs that genuinely 404, so no
future run re-asks. `phase2 --fetch-only` exists for this: acquiring sources
and deciding what to publish are separate decisions on separate timescales.

## 2026-08-25 — What is missing from the site, and why

Discovery reads the **English** index only
(`discover_encyclicals`), deriving every other language by substituting the
path segment. A document the Holy See never put into English is therefore
invisible: never discovered, never fetched, never recorded as absent. Every
document each English index does list is written — 216 of 216 — so the gap is
entirely in what those indexes show.

Comparing each pontificate's Italian index against its English one (24
requests) gives the whole answer:

- **Seven encyclicals are listed in Italian and not in English.** Six are Pius
  XI's — `studiorum-ducem` (1923, St Thomas Aquinas), `ecclesiam-dei` (1923,
  St Josaphat), `rerum-orientalium` (1928, oriental studies),
  `quinquagesimo-ante-anno` (1929), `ad-salutem-humani` (1930, St Augustine),
  `lux-veritatis` (1931, Ephesus) — and one is Pius XII's `orientales` (1952).
- **Pius IX's ~38 encyclicals are absent for a different reason.** Both
  `/content/pius-ix/en/encyclicals.index.html` and its Italian twin 404. That
  pontificate is not published under the `content/{pontiff}/{lang}/` shape at
  all, so no language of discovery would find it; it needs a different source
  path, not a different language.
- John Paul I's index also 404s, correctly: he reigned 33 days and wrote none.
- Leo XIII's Italian index lists 65 against English's 86, and adds nothing —
  Italian is the wider edition overall, not everywhere.

Ingesting the seven is a separate decision and is not taken here: they would
be the corpus's first Italian-only works, and `CONTENT_LANG_FALLBACK` resolves
a reader's language, then English, then Latin — a chain none of them can
satisfy.

## 2026-08-25 — Every encyclical in some language, and Italian when not English

Discovery read the English index only, so seven encyclicals the Holy See never
translated were invisible: not discovered, not fetched, not recorded absent.
The rule is now that **every encyclical the Holy See publishes is on the site
in some language** — English where it exists, otherwise the language it does
exist in.

`FALLBACK_INDEX_LANGS = ("it",)`, consulted per pontificate for anything the
English index does not list. Italian is enough: measured across all thirteen
pontificates, it lists seven documents English does not and no other language
reaches a document at all. This is not a "crawl more languages" switch — the
language a document arrives in is whichever one it exists in, not a preference.

Three things had assumed English and now do not:

- **`DocRef.base_lang`** — the language of the index that found a document,
  and the one every other URL is substituted from. `translation_url_for` used
  to derive from `lang_urls["en"]`, which a document with no English edition
  does not have.
- **`submit_doc`** starts from `base_lang` rather than from `"en"`.
- **`_WORK_ID_RE`** matched `(en|pt)`, so `check_language_symmetry` was
  silently skipping seven of Magnifica Humanitas' nine editions — the literal
  pair outlived the two-language corpus by one day, and the docstring had been
  generalised while the regex was not. Any two-letter language now.

**The seven are Italian-only, and the English pages exist but are stubs.** All
seven have an `…/en/…` URL that returns a 31 KB page with no document in it,
which `StubPageError` already refuses to write — so "no English edition" is
the correct reading and not a discovery accident. `orientales` also has a real
Portuguese edition (24 sections), ingested alongside; the other six are
Italian and Latin only.

All seven are **unnumbered documents** — continuous prose with no inline
paragraph numbers, so their text is in `appendix.json` and `sections.json` is
empty, the shape the corpus already had eight editions of. 20–75 KB of text
each. The corpus is 367 works.

## 2026-08-25 — A description that was read and a description that was translated are different things

`site/descriptions.json` was `work id -> string`. It is now
`work id -> language -> { text, origin }`, with `origin` either `"read"` or
`"translated"` (plus `from`, naming the rendering it came from).

The distinction is the same one `docs/writing-descriptions.md` opens with. A
description must be written by READING THE DOCUMENT, never from recollection
of what a document with that title probably says, because a fluent wrong
summary is indistinguishable on the page from a real one. A translation is not
a reading: it inherits whatever the reading got right and whatever it got
wrong, and it never touches the document. Storing both in one string field
would erase exactly the property the procedure exists to guarantee.

`from` makes provenance a chain rather than a label — correct a reading, and
every translation of it is known to be stale by inspection.

The outer key stays the WORK. A description read from the Portuguese edition
is prose about that text, not a translated label for the English one; the two
editions are described separately and always were.

**Only the reading is shipped.** `sync-corpus.mjs` merges the work's
own-language rendering into `manifest.description` as before. The index tier is
eagerly loaded by every reader and already 2.2 MB; eight translations of every
description would multiply the one field in it that is prose. Shipping
translations wants a per-language asset loaded on demand, which is a separate
decision and is not taken here.

## 2026-08-25 — Latin becomes an edition of the prayers, built from two witnesses

**What**: `prayer.common.la` now exists as a real work, alongside `prayer.common.en` and
`prayer.common.pt`. It holds the 21 of 28 prayers the Compendium prints Latin for. The
per-prayer `latin` field stays exactly where it is.

**This reverses `corpus-schema.md` §Prayers' "Latin is a field, not an edition."** That
ruling rested on two claims. One had already expired and the entry said so: a Latin
edition was held to reopen the UI-language-vs-content-language question, and Latin has
been an interface language since 2026-08-24. What was left — "a `prayer.common.la` work
would be an edition nobody printed" — is true about the source and wrong about the
reader. Every other work in this corpus reaches a Latin-preferring reader as a work
(`bible.clementina.la`, `summa.la`). Prayers were the single place where setting Latin
as the content language silently returned English, because `CONTENT_LANG_FALLBACK` had
no `la` work to resolve to and fell through. The site had already noticed: the reading
route carried a fabricated `prayer.latin` target whose manifest was the vernacular
work's with `id` and `language` overwritten. An edition that has to be forged at render
time to be offered at all is an edition; promoting it deletes the forgery rather than
adding a case.

**The field is not redundant and does not go away.** It is what the source prints — Latin
bound to the vernacular, same page, same cell — and it is what the edition is derived
from. Both are true statements about different things, and the schema now says both.

**THE HARD PART WAS THAT THERE ARE TWO WITNESSES AND THEY DISAGREE.** The Latin appears
twice on vatican.va, once in each vernacular Compendium page. Measured across all 21:

- **20 of 21 are word-identical** once ligatures, stress accents and punctuation are
  folded away. The Rosary is the sole exception.
- **The English witness carries one malformed character in the whole edition** —
  `sæ´cula`, an `&aelig;&acute;` that never composed — against the Portuguese witness's
  14 grave-for-acute letters (13 `ò`, 1 `À`).
- **Where they differ in letters, English is fuller and better spelled**: Portuguese
  drops the _Mystéria luminósa_ heading outright and prints `Tempio` for `Templo`,
  `Dorninica` for `Dominica` (an rn/m slip) and `coniúcta` for `coniúncta`.
- **But Portuguese segments better in two prayers**: it prints _Veni Creator Spiritus_ as
  7 stanzas and _Veni Sancte Spiritus_ as 9, where English runs each into one block.
  English segments better in three (Angelus 11/1, Regina Cæli 5/1, Rosary 12/9).

**The rule is: English's text, the finer of the two segmentations.** Every character comes
from one witness, chosen once and stated; the other contributes only _where the breaks
fall_, which is information the base witness does not carry and cannot be wrong about.
`_resegment` asserts the re-cut pieces rejoin to exactly the text they were cut from, so
a transplant that does not fit is refused rather than approximated. Nothing is reconciled
character by character and no word is emitted that neither page printed.

**Why not a critical edition.** The tempting move is to take the better reading at each
disagreement — Portuguese's `sǽcula` here, English's `Templo` there. That is editing, not
transcription, and it produces a text no page prints, whose provenance is a rule rather
than a URL. The whole corpus's claim is that a reader can check any string against a
source page; a per-character merge would be the first text here that fails that.

**The one English defect is a correction, not a merge.** `pipeline/corrections/prayer.common.en.json`
fixes `sæ´cula` against the source HTML, citing the Portuguese witness as evidence for
what was meant — the ordinary path for a source defect with a known correct value. Filing
it there rather than in the derivation keeps the builder a pure selection over parsed
text, and fixes the English edition's own `latin` field at the same time.

**`witnesses.json`** is written into the work: one row per prayer naming which witness
supplied the text, which supplied the breaks, and whether the two disagreed about
anything but orthography. The choice is inspectable without re-running the scraper.

**Validation is narrowed, not skipped.** The slug-set oracle cannot apply — this edition
covers a strict subset by construction — so `validate_latin` asserts what is actually
assertable: every prayer with a Latin companion reached the edition, and every character
of it still folds to what the English witness printed. Same narrowing the Summa already
has for the Supplementum.

**Built only on a full run.** `build_latin_edition` needs both witnesses, so
`prayers.py --lang en` alone does not write it — producing a differently-segmented
edition under the same work id from one witness is exactly the silent failure worth
refusing.

**Verified**: re-parsed from `raw/` with no network. 21 prayers, 61 blocks, 2 re-segmented
from Portuguese, 1 recorded divergence, zero malformed characters in the output (the
character inventory is `ÁÆÍáæéíóúœǽ` and nothing else). Both vernacular editions
re-parsed byte-identical apart from `generated_at` and the correction — and the removal of
`"kind": "prose"` from 103 blocks per edition, which is the schema's omit-the-default rule
(`BlockOut.to_dict`) reaching files last generated before it applied.

## 2026-08-25 — Translated descriptions ship one file per language

Chosen over the two alternatives, both of which were measured against the 61
descriptions written so far (417 characters on average, 239 works to describe):

|                         | files | a reader downloads                        |
| ----------------------- | ----- | ----------------------------------------- |
| all in `manifests.json` | 0 new | **+959 KB, always**                       |
| one per language        | **8** | 107 KB, once, only if not reading English |
| one per work + language | 2,151 | 239 requests to render `/documenta`       |

The last row is what settles it rather than the byte counts: `/documenta`
lists every document with its description, so a per-work file means a request
per row for a single page. And the first row is the one that had to be
avoided — a description is the only prose in the index tier, which every
reader downloads before the first paint.

`sync-corpus.mjs` writes `index/descriptions.<lang>.json` for each language
that has any, containing only `origin: "translated"` renderings. The reading
stays on the manifest: duplicating it would give two places to disagree the
moment one is corrected. `corpus-index.ts` globs them as URLs, the way the
content tier is globbed, and `loadTranslatedDescriptions(lang)` fetches
through the same memoised reader every content file uses.

**Vite inlines an asset under 4 KB**, so while only a handful of translations
exist these ride along in a chunk instead of being fetched. That is
self-correcting — at the real size, 107 KB, they cross the threshold and
become separate hashed assets — but it means the "one request" property is a
property of the finished state, not of today's.

`/documenta` prefers a translation in the reader's interface language over the
manifest's own, which is written in the WORK's language: a reader of Italian
looking at an English edition wants the Italian sentence about it, and the
English one is the fallback rather than the default.

`descriptions.test.ts` pins the provenance invariants rather than the prose: a
reading is filed under its work's own language and there is at most one, every
translation names a `from` that exists and is not itself, and translations go
only into interface languages. A batch that fills the text correctly and
labels its origin wrongly would render identically and be wrong silently.

## 2026-08-25 — A prayer is verse, and the scraper was reading it as prose

**What**: `PrayerBlock` gains `html`, carrying the source's own line breaks for any block
that prints on more than one line. Every prayer on the site rendered as a single
undifferentiated paragraph until it did.

**The bug was an inherited convention, applied one work-type too far.** `flatten`'s
docstring called the source's `<br/>` "a fixed-column-width typesetting artifact, not
meaningful structure", and cited `corpus-schema.md`'s rule for CCC paragraph blocks. That
rule is right about the Catechism, whose paragraphs are running prose broken by whatever
width the page was set to. It is wrong about a prayer. Measured over the whole Appendix A
region of the English page: **895 `<br/>`-separated lines, median length 28 characters,
73% of them ending on punctuation.** Column wrap produces long lines of near-uniform width
breaking mid-clause. These are short and clause-final, because the Salve Regina, the Te
Deum and the Veni Creator are verse and vatican.va sets them as verse.

**Stored as `html`, not as a `lines` array or newlines inside `text`.** A document section
already carries exactly this — block text with the source's narrow inline markup, `<br>` in
the allowlist — so `parseInlineHtml` already parses it and every prose renderer on the site
already emits it. A second convention would have been a new thing to teach five components
about, for no gain. `text` is unchanged, so nothing that reads plain text noticed.

**`InlineText`, not `InlineProse`, renders it.** The one thing `InlineProse` adds is
linkifying scripture references out of running prose, and a prayer does not contain any —
running that scanner over "and lead us not into temptation" is a hunt for citations that
are not there. The Rosary's meditations do carry sourced locators; those are
`PrayerMystery`'s and were never this component's.

**The hanging indent is not decoration.** Once a block keeps its own breaks, two things
that must not look alike otherwise do: a line the SOURCE broke and a line the VIEWPORT
broke. A wrapped continuation now sits in from the margin and a real new line starts at it,
which is how a printed missal sets the same text.

**A correction has to land on both fields or fail.** `apply_corrections` fixed `text` and
silently left `html` alone in the first version of this, which produced blocks whose two
fields disagreed about what the prayer says — caught by the Latin edition's re-segmentation
refusing to align, not by anything looking for it. Two of the ten corrections on file name
a phrase the source prints across a line break, so the match is whitespace-flexible and the
replacement reuses the separators it matched: a correction can change words and can never
move, add or remove a line break. Unequal word counts raise rather than guess.

**Also**: the Latin edition's `_resegment` now works at line granularity rather than by
cutting strings. A stanza break can only fall between two printed lines, so a donor
boundary that would land mid-line is a boundary the base witness does not have, and it is
refused instead of approximated.

## 2026-08-25 — The USA wording is the English prayer; the UK wording is an alternative

**What**: five English prayers carry a UK/USA regional split. The USA wording now renders
as the prayer — unlabelled and unboxed — and the UK wording keeps a box headed
"English (UK)".

**Why this is a presentation choice and stays one.** The source prints "UK VERSION" and
"USA VERSION" as two equal headings, and the corpus stores both wordings verbatim under
exactly those labels; none of that changes, and `variants` remains what
`corpus-schema.md` describes. What changed is the reader's page. Rendering two boxed,
equally-labelled alternatives is faithful to vatican.va and unhelpful as an edition: a
reader who wants "the English Te Deum" was made to choose between two regional labels
before reading a word, and neither box was simply the prayer.

**The label is built, not translated**: `languageDisplayName(lang)` plus the source's own
regional label, which is the same construction every column tag on the site uses. It names
what the text IS, not what the reader's interface calls it — so a Portuguese-reading
visitor still sees "English (UK)".

## 2026-08-25 — The Summa's sidebar was an accidental fork, not a requirement

**What**: `summaToc.ts` and `SummaSidebarToc.svelte` are gone. The Summa reader now uses
`StructureSidebarToc` over a real `StructureNode` tree, built by `summaOutline`
(`corpus.ts`).

**The argument for the fork was false, and it is worth saying exactly how.** `summaToc.ts`
justified itself this way: every other sidebar walks a `StructureNode` tree, "the Summa's
`SummaNode` is a FLAT list of `{ level, part, title, before }`", and reshaping it into a
tree "would mean inventing bounds (`paragraphs`) and kinds the corpus does not carry,
which is the kind of quiet fabrication `docs/corpus-schema.md` exists to prevent."

`DocumentNode` is `{ level, title, before }` — the same shape minus `part`. And
`buildDocumentOutline` performs precisely the reshaping that was called fabrication:
`paragraphs` derived as `[before, nextBefore - 1]`, a uniform `kind`, nesting by `level`.
Far from being forbidden, that derivation is the documented convention for this node
shape. `types.ts`: "a heading owns sections from its anchor until the next heading of
equal or shallower `level`. Storing ranges is what let them drift from the text."
`corpus-schema.md`, about the Summa specifically: its `structure.json` is "FLAT and
document-ordered, **like the documents' and for the same reason**."

`summaTocGroups` was already doing the same derivation — "a treatise runs from its own
`before` up to the next heading's" — and only differed in stopping at one level and
returning a bespoke type. Two implementations of one rule, one of them arguing the other
was impossible.

**The three things that really are the Summa's, none of them a fork:**

- **`part`.** Question numbers restart at 1 in every part, so an outline is built per
  part and `lastN` is that part's own last question. A parameter.
- **The Latin edition prints no treatise headings.** The Corpus Thomisticum publishes the
  four part headings and nothing below them, so `headings` is empty and every question
  lands at the top level. That falls out of the same builder as correct degradation —
  attaching the English edition's treatise names to Latin text would assert a structure
  that source does not print.
- **A borrowed title.** Under Latin every question title is the English edition's, by
  address. `StructureNode` gained `titleLang` for it: the row renders muted and italic
  with the real language on the element, rather than passing another edition's words off
  as this source's own. General, not Summa-shaped — any work that ever borrows a title
  gets it.

**Articles are fragments, and they say so with null bounds plus an `anchor`.** An article
is genuinely not addressed by a question number; `/summa/ii-ii/184#a3` is what reaches it.
Giving them their question's range instead would have been the easy path and wrong twice
over: it would claim an address they do not have, and `currentIndex`'s first-match-wins
rule would then permanently highlight article 1. With null bounds they render as ordinary
links and never take the current-row highlight from their question — which is exactly what
the bespoke component did by hand.

That needed two small, general changes to the shared machinery, neither of them a Summa
case: `hrefFor` now returns `#{anchor}` for a row with an anchor and no numbered bound,
and the row renders as a link when `linkableAnchors` vouches for it regardless of
`linkMode`. `linkableAnchors` already existed for exactly this situation in documents —
rows the page renders that bound no numbered unit.

**Verified**: 12 new tests in `summa-outline.test.ts` over the real derivation, replacing
the 6 that tested the bespoke grouping; full suite 568 passing, `svelte-check` clean,
production build clean. Net: three files deleted, one function added.

## 2026-08-25 — The prayers' UK/USA split becomes two English editions

**What**: `prayer.common.en` is replaced by `prayer.common.en-us` and
`prayer.common.en-gb`, each carrying all 28 prayers. `variants` is gone from the schema.

**They were always editions.** Two texts of one work, in one language, differing in
wording, is what an edition is here — it is exactly `bible.cpdv.en` against
`bible.douay-rheims.en`. Modelling them as a `variants` array instead created a concept
used by five prayers, in one language, and by nothing else in the corpus, and it pushed a
choice onto the reader at the wrong moment: five pages showed two boxed, equally-labelled
wordings, and neither box was simply the Te Deum. An intermediate attempt made the USA
wording the default in the VIEW, which was better for the reader and worse as
architecture — an editorial decision hardcoded in a template, invisible to the edition
picker, the compare feature and the stored preference.

As editions the reader picks once, in the same menu as every other work, the choice
persists across pages through the same store, and compare mode can put the two side by
side for free.

**This reverses "only the Bible may carry more than one edition per language."** That was
hardcoded at `EditionMenu.svelte:127` as `ctx.type === 'bible'` and stated in
`compareColumnLabel`. It stays hardcoded, because it is still true of the `editionStyle`
FORK it governs — that fork exists to disambiguate two editions whose language name is
identical, and here `languageDisplayName` disambiguates them itself: `en-US` and `en-GB`
render as "English (US)" and "English (UK)". The rule that changed is the corpus one, not
the display one.

**Both editions carry all 28, and that duplication is the point.** 23 prayers are
byte-identical between them. The alternative was a sparse `en-gb` of only the five that
differ, with the rest resolved through `CONTENT_LANG_FALLBACK`. Rejected: that chain
exists for content that is _absent_, not for content that exists and happens to match, and
it would have made `/preces` under English (UK) look like a five-prayer collection. Every
word in either edition is a word the source printed under "English"; nothing is
synthesized.

**`langFor` could not express this, so `tagFor` joined it.** `content.langFor(type)`
returns `baseLang(edition.language)` — `"en"` for both editions — which is right for the
things it feeds (citation grammar, abbreviation tables, a `lang` attribute) and useless
for telling two English editions apart. `tagFor` returns the full tag; the two prayer
routes use it, and `resolveEditionTag` is the tag-level counterpart of `editionInLang`:
exact tag, then the base language's default region, then any edition in that language,
then the fallback chain, then whatever exists.

**A default region had to be stated rather than fallen into.** `listEditions` sorted by
base language then by id, which would have answered `en-gb` purely because `g` sorts
before `u` — right by accident, and right only until an id changed. `DEFAULT_REGION`
(`{ en: 'en-US' }`) is one table saying which edition a reader who asked for "English" and
nothing more specific gets, consulted by `listEditions`, `defaultWorkId` and
`resolveEditionTag` alike. Only the reader's own stored preference overrides it.

**The Latin edition is derived from the UNSPLIT parse.** Latin is one column on the page
and does not vary by region, so deriving `prayer.common.la` from either regional edition
would imply a distinction the source does not make.

**Validation asserts the two things that would catch a broken split**: every edition
carries every slug (a silently sparse edition is the failure this design rejected), and
the set of prayers whose text differs between them is exactly the set the source marked
with a UK/USA heading — no more, which would mean the resolver touched a prayer it should
not have, and no fewer, which would mean a wording was dropped.

**`works/prayer.common.en` was deleted**, being superseded generated output. `raw/` is
untouched and both editions re-parse from it with no network.

## 2026-08-25 — A translated description is about the document, not about the edition

Correcting the shipping entry above, which keyed `index/descriptions.<lang>.json`
by work id. That left a Portuguese reader looking at the Portuguese edition of a
document read in English with **no description at all**: the row he sees is the
`.pt` work, and the translation was filed against the `.en` one. The failure was
invisible in testing because it only appears for the 122 documents that have a
Portuguese edition — exactly the ones a Portuguese reader is most likely to open.

The two keys answer different questions, and both are right where they are:

| File                        | Keyed by | Because                                                         |
| --------------------------- | -------- | --------------------------------------------------------------- |
| `site/descriptions.json`    | work id  | records WHICH TEXT WAS READ; the PT edition is a different text |
| `index/descriptions.<lang>` | doc slug | a translation is prose about the DOCUMENT; every edition is it  |

The route is `/documenta/{slug}` on the same reasoning.

`/documenta` now resolves a row's description in this order: **a reading in the
reader's own language** (the manifest's, when the edition shown is in that
language), then a translation into it, then the manifest's own. A reading beats a
translation because both are in the language he wants and only one was written by
someone looking at the text the row leads to — and 22 Portuguese editions have
been read on their own terms, so the case is real. It is also the only ordering
under which correcting a reading cannot be silently overruled by a translation of
some other edition's reading.

## 2026-08-25 — Challoner's apparatus reaches the page, and the default edition stops being alphabetical

Three related changes, all downstream of the Douay-Rheims ingestion of the day
before.

### The apparatus renders

`PLAN.md` #3 had been ranked first on a claim no other gap could make: it was
the only row blocking data already paid for. 1,917 of Challoner's notes and
1,307 chapter arguments were on disk and nowhere on screen. They are now on the
page.

**A note goes in the margin where there is a margin, and becomes a disclosure
where there is not.** Above 100rem `Sidenote.svelte` floats it into the
**inline-start** slack outside the reading column; below that it opens as a
block under the line the reader tapped. Inline-start rather than inline-end
because `.reading-aside` already owns the end margin at these widths — and
because a _Glossa Ordinaria_ sets its gloss around the text, which is the
arrangement this site is named for.

Floats, not absolute positioning: several notes against nearby verses stack
down the margin instead of overlapping, and getting that right by measurement
would need JavaScript watching layout.

**The breakpoint is legible to the markup and not only to the stylesheet**
(`sidenotes.svelte.ts`), which is the one place this could have been done
purely in CSS and should not have been. A margin note is already visible, so
its marker is not a disclosure control; `aria-expanded` on a button whose
content is on screen regardless is a lie to a screen reader, and a control with
no state is the same mistake from the other side. The two layouts differ in
what the marker _is_, so JavaScript has to know where the breakpoint is.

**A marker is unique within its unit, not within its chapter** — the sharp edge
`docs/corpus-schema.md` records, and the one that would have shipped as a bug.
John 3 carries four notes and every one of them is numbered 1. Keyed on the
marker alone, opening the note at verse 5 would also open the ones at 16, 18
and 20. `noteKey(unit, marker, seq)` is the fix and `sidenotes.test.ts` is the
guard.

**`heading-markers.ts` became `inline-markers.ts`.** A CCC heading's
`title`/`title_marked` and a Douay-Rheims verse's `text`/`text_marked` are one
shape under two names, because the corpus encodes an apparatus the same way
wherever it carries one. Nothing in that module was ever about headings.

**The chapter argument is set as apparatus, not as text** — sans, muted, above
the rule that opens the reading column — and carries no visible label, because
that is how the editions print it. The `aria-label` exists for a reader who
cannot see that it is set apart. Same rule as the notes, and the same reason:
the 2026-08-16 naming decision says a gloss must never be confusable with its
source, and Challoner writing _about_ Scripture is not Scripture.

The note markers take `--color-apparatus`, the ground-lapis token that
`app.css` explicitly keeps **off** Bible verse numbers because those "recur
every few words at 0.65em, and the convention was never to colour an apparatus
that dense". Challoner's markers are the opposite case — roughly one per
nineteen verses — which is the density the convention was for.

### Which Bible an English reader gets is now stated

`editionInLang` took the first manifest in `listEditions` order, which within
one language is `id` order. So an English reader got the CPDV because `c` sorts
before `d`, and the arrival of a second English Bible put the default one
rename away from changing by accident. `PREFERRED_EDITION` in `corpus.ts` names
it: **CPDV for English**, Matos Soares for Portuguese, the Clementine for
Latin.

All three of the Bible's languages are listed although only English currently
has a choice, because the point is that the answer is written down rather than
derived. Regional pairs are deliberately **not** listed — `prayer.common.en-us`
against `prayer.common.en-gb` is already decided by `DEFAULT_REGION`, and
repeating it here would be a second place for it to be true.

`corpus.test.ts` asserts that every entry names an edition that exists and —
the guard that matters — that no two editions sharing one full language tag are
left without an entry. A third English Bible has to walk past that test.

**The same accident existed a second time**, in `resolveBookToken`: within one
tier several editions can match a token exactly (`joh` is a real abbreviation
in both English Bibles), and the winner was registry order. It now defers to
the same table. Only _within_ a tier, never across one — a stronger reading in
any edition still beats a weaker reading in the preferred one, so `genesis`
still reports the Douay-Rheims, where it is an abbreviation rather than merely
the display name.

### The fixtures gained a second English Bible

`bible.douay-rheims.en` is now a fixture (Genesis 1:1-13, John 1:1-18 and
3:1-21, mirroring the CPDV's). Not for coverage — for the case the fixtures
could not previously express. Until it existed there was exactly one edition
per language under test, so neither the preferred-edition table nor the
same-tier tie-break had anything to fail against, and the annotated reading
path had no notes to render. John 3 keeps all four of Challoner's notes,
markers and all.

## 2026-08-25 — Two levelling defects: a phantom tier, and a staircase

Found by the ToC-oracle pass, which is what the oracles exist for: 102 oracles
now compared, and the audit went from **34 documents disagreeing / 284
differences to 31 / 206**. Forty-three `structure.json` files changed; **no
`sections.json` and no `appendix.json` changed at all**, so no text moved —
only the nesting of headings over it.

**The phantom tier.** `depth_key` lifts a heading named CONCLUSION or PROÉMIO
to the tier of the document's labelled divisions, which is right where the page
prints it as that tier (Gaudium et Spes' PREFACE beside its PART I). But the key
it returns outranks _every_ style key, so in a document whose divisions carry no
label the promotion joins no tier — it invents one above the whole document.
`aeterna-dei.en` is the clean case: six divisions in byte-identical
`<p align="CENTER">`, no bold, no italic, none saying CHAPTER, and CONCLUSION
alone at level 1 with its five siblings at 2. `mater.en` across five,
`orientalium-ecclesiarum.en` across eight. The audit reported each as "most
headings parsed +1 level(s)" with the closing heading the lone outlier.

Fixed as a **post-condition, not a guard on the promotion**: the promoted
heading may not rise above headings the page sets in the same style. Withholding
the key entirely collapses a tier in `divini-redemptoris.pt`, whose INTRODUÇÃO,
seven parts and their sub-headings need three levels out of two styles and get
the third from exactly this key — measured, 25 differences, which is why the
first attempt was thrown away. The post-pass is skipped where the document does
label its divisions, because there the front matter is _supposed_ to outrank its
same-styled twins.

**The staircase.** Rule 2 of the levelling walk — a style already seen keeps the
level it was first given — was written at the head of the walk from the start
and was never reachable: it sat under `elif prev_heading_idx is not None`, which
after the document's opening is always true. It only fires when a heading has no
heading before it.

That is invisible in most documents, because a numbered paragraph between two
headings resets `prev_heading_idx`. It is fatal in a document that numbers its
own headings (`1. At the close of the second Millennium`), where there is no
numbered block between them and the whole document is one unbroken run, each
heading ranked against the one before it rather than against its siblings.
Redemptor Hominis' four parts — identical centred bold — came out at levels
2, 3, 4, 5; Laborem Exercens reached **level 7**. Titles and positions were
right in every case, which is the signature of a heading that never gets popped.

Moving rule 2 above the two branches that shadowed it took `redemptor-hominis`
21 differences → 2, `dives-in-misericordia` 21 → 2, `laborem-exercens` 25 → 2,
and helped `quadragesimo-anno.pt` and `sacrosanctum-concilium.pt` besides. The
key that must match is `depth_key`, not raw style: Lumen Gentium PT's
`CAPÍTULO VIII` and the `I. PROÉMIO` nested inside it are set in the same
centred bold but differ in key, so that pair is untouched.

**What is left in those three is one heading.** `Blessing`, the salutation John
Paul II prints before his first part, is centred bold-**italic** where the parts
are centred bold, so the parse gives it a tier of its own and the oracles read it
as their peer. Two differences each, and the disagreement is about whether a
salutation is a division at all — not about the staircase.

## 2026-08-25 — A part marker named `II` was being read as a language bar

`ad-petri.en` prints its four parts as bare `<p align="CENTER">I</p>` …
`IV`, byte-identical. `I` and `III` became divisions; `II` and `IV` vanished.

The discriminator was **how many letters the numeral has**. `_LANG_CODE` is
`[A-Za-z]{2}`, and the whole-block bar test had been loosened from "two or more
codes" to "one or more" on 2026-08-25 so that a document published in a single
language — whose bar is a bare `EN` — would not end the masthead scan on block
one. `drop_page_furniture` shares that regex and **deletes** what it matches, so
a two-letter Roman numeral matched a one-code bar and was dropped as furniture.
`II` and `IV` are two letters; `I` and `III` are not.

The effect was worse than a missing heading: `structure.json` is a flat array,
so a document that loses a part marker has no boundary at all where that part
begins — a consumer walking it cannot tell where part II starts.
`sacerdotii.en`, `grata-recordatio.en` and `princeps.en` lost the same `II`.

Split in two, by what the match is used to decide. `_LANG_BAR_ONE_RE` keeps the
one-code tolerance for the masthead scan, which only asks where the front matter
starts; `_LANG_BAR_RE` requires two codes again, because it is the one that
deletes. Five `structure.json` files changed, no `sections.json`, and the 19
recovered mastheads stayed recovered — the count of works with an empty
`manifest.header` is 9 before and after.

Also fixed alongside it: the centred-unemphasised heading recovery counted only
the run members no earlier pass had claimed, so a page's own table of contents
promoting two of four markers left the other two below the threshold of three.
The run is now the whole run, and only the unclaimed members are promoted.

Audit over 102 oracles: **34 documents disagreeing / 284 differences before the
day's three levelling fixes, 28 / 200 after.**

## 2026-08-25 — Headings whose only marking is the anchor pointing at them

Measured before it was fixed, because it looked like one document's problem and
mostly was.

`fratelli-tutti.en` prints 34 of its sub-headings as
`<p><a name="SHATTERED_DREAMS"></a>SHATTERED DREAMS</p>` — no bold, no italic,
no centring, nothing `is_full_bold` or either recovery pass can see. They were
not absorbed into a section, they were **dropped outright**: the text appears
nowhere in `sections.json`, so a third of that document's outline simply did not
exist. (The census scored five of them `kept`; that verdict is a substring test
against the whole document's prose and was a false positive in all five.)

**How general is it.** Scanning every raw page for a `<p>` whose entire content
is an empty `<a name>` and text the anchor names: 9 pages, 149 paragraphs. Of
the pages backing an ingested work, 102 such paragraphs — and 68 of them are
already headings by some other route, so the shape only _loses_ a heading in one
document. `magnifica-humanitas.fr/it/de` and `dilexit-nos.pt` use it too and
lose nothing. So: a real convention of the modern shell, with exactly one
victim today.

Fixed in the parser rather than in `pipeline/overrides/` even so. The rule is
stated in terms of the source's own convention — an empty `<a name>` exists to
be linked _to_, and one whose name spells the paragraph's own text is a heading
the page means a table of contents to point at; body prose never carries one —
and the alternative was 34 hand-written headings with levels and positions in
the override layer, which is derived data that should be derived.

**The level was the harder half.** Promoted on markup alone the anchored
headings rank between the centred tier and the left-italic one, so they became a
tier of their own and pushed every italic heading down: 34 MISSING turned into
**45 LEVEL differences — worse than leaving them out**. They are peers of the
italic sub-headings, not a tier above or below them: `THE BASIS OF CONSENSUS`
sits _between_ two italic sub-headings rather than containing either. Ranking an
anchor-titled heading as emphasised says so, and takes the document to **zero**
differences.

Blast radius: two files, both in that one document — `structure.json` (55 nodes
→ 89) and `sections.json` (287 sections before and after, content unchanged).
No other work in the corpus changed. Audit over 102 oracles: **200 differences
→ 166**, 28 documents disagreeing → 27.

**Two neighbouring shapes were left alone**, both single-document accidents with
no convention behind them: `grande-munus.en` prints three headings whose `<i>`
wrapper slipped outside the paragraph, leaving an orphaned `<i> </i>` before a
plain `<p>`; `mense-maio.en` prints two centred unemphasised headings, one short
of the run of three that recovery requires. Recorded here rather than fixed —
two headings are not a run, and a detached tag is not a convention.
