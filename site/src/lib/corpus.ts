/**
 * Corpus access layer — public API. `corpus-index.ts` builds the boot
 * index (registries + content-tier URL maps, see that file's docblock);
 * this module is what every route/component actually imports, and it's
 * responsible for two things the index alone doesn't give you: the
 * structure-tree walkers shared by the CCC and Compendium, and — the part
 * that changed on 2026-08-15 — fetching the actual reading text.
 *
 * WHY FETCH, NOW, WHEN THIS FILE USED TO ARGUE THE OPPOSITE: until
 * 2026-08-15 this module `import.meta.glob(..., { eager: true })`-ed the
 * ENTIRE corpus (every Bible verse, every CCC paragraph, every Compendium
 * answer, both languages) straight into the client JS graph, on the
 * reasoning that adapter-static prerendered every route at build time back
 * then (no server runtime, docs/decisions.md) so inlining avoided a network
 * round-trip and any risk of drift between what a page fetched and what
 * got embedded in it. That reasoning was correct as far as it went — it
 * just didn't scale. Measured against the real corpus: one chunk file, 18 MB
 * raw / 4.6 MB gzipped, `modulepreload`-ed on every page including the
 * home page, because "inline everything" doesn't distinguish between "the
 * page needs this" and "this exists somewhere in the corpus." A phone
 * doesn't just download that chunk once; it PARSES 18 MB of JS and holds
 * it on the heap for the lifetime of every tab, on every visit, to read
 * one Bible chapter. Content here is immutable (a published CCC paragraph
 * or Bible verse doesn't change once stable) — which is precisely the
 * property that makes per-file `fetch()` + long-lived caching strictly
 * better than eager-inlining once the corpus is real-sized: a
 * content-hashed file fetched once is cached forever (`immutable`
 * Cache-Control, wired at the host), and adding a work invalidates only
 * that work's files, never the whole library.
 *
 * THE SPLIT THIS LEADS TO (see `corpus-index.ts`'s docblock for the physical
 * layout `scripts/sync-corpus.mjs` produces):
 *   - INDEX tier (`corpus-data/index/`): manifests, canonical book/chapter
 *     NUMBERS, CCC/Compendium TOC trees, abbreviations, xrefs — small
 *     (kilobytes, not megabytes) and needed SYNCHRONOUSLY by components
 *     that read it outside any `load()` (the book/chapter picker, the jump
 *     box, both TOC pages). Still eager-glob-inlined — at this size that's
 *     the right call, not the mistake the content tier was.
 *   - CONTENT tier (`corpus-data/content/`): the actual reading text —
 *     Bible books (73/edition), CCC paragraphs (chunked, 100/file), the
 *     Compendium (whole per language). Globbed with `{ query: '?url' }`,
 *     which makes Vite emit each file as its own content-hashed build
 *     asset and hand back its URL as a plain string — the client bundle
 *     ends up with a few hundred URL strings, not 21 MB of JSON.
 *
 * HOW CONTENT ACTUALLY GETS READ IS NOT "fetch() everywhere" — that was
 * the first attempt, and it broke twice, both times because SvelteKit's
 * `load`-time `fetch` is doing more than moving bytes:
 *   1. A plain global `fetch()` with a relative URL failed outright during
 *      prerendering ("Failed to parse URL from /_app/immutable/...") —
 *      Node's `fetch` has no origin to resolve a relative URL against.
 *      SvelteKit's `load(event)` hands `load` a special `fetch` that
 *      SOLVES this (it resolves same-origin URLs by invoking the request
 *      in-process) — but reaching for it walks straight into the next
 *      problem.
 *   2. That special `fetch` also INLINED the full response of every
 *      request it made into the prerendered page — the site still
 *      prerendered every route at the time — so a client-side `load()`
 *      re-run could replay it without a network round-trip — a real
 *      feature, useful for dynamic routes, but one that applies to the raw
 *      response, not to whatever slice `load()` returns. Fetching a whole
 *      book that way to read one chapter measured out to a ~300 KB
 *      Genesis-1 page — the entire book, re-embedded, once per chapter:
 *      exactly the per-page bloat this rewrite exists to remove, just
 *      relocated from the JS bundle into the HTML.
 * So content is read two different ways depending on where the code runs,
 * and the split is SSR vs browser, not "prerender vs runtime" as it might
 * look: `import.meta.env.SSR` is true whenever this module runs in
 * SvelteKit's server build, not whenever a route is prerendered — those
 * used to be the same thing, back when every route was prerendered, but
 * since the site became one SPA shell with `ssr = false` (`+layout.ts`,
 * docs/decisions.md §The site) no route's `load()` executes on the server
 * for a real visit any more, so `readContentFromDisk`'s branch has nothing
 * left to run against in production — it stays correct and in place
 * because the split was never actually about prerendering, only about
 * where the code executes, and `import.meta.env.SSR` still answers that
 * question precisely. When it IS true, `readContentFromDisk` reads the
 * file straight off disk with `node:fs` — no `fetch` involved, so nothing
 * auto-inlines anything; in the browser, `readContentFromNetwork` is a
 * normal `fetch()` against the content-hashed URL, immutable-cached from
 * the second read on. Both branches share one memoization cache and one
 * public function (`getChapter`, `getCccParagraphAsync`, …) — this is what
 * makes "one call shape, not a server/client branch" true at every call
 * site; only `readContent` itself knows the two paths differ, and why.
 *
 * COARSE READ, NARROW RETURN: reading is per-BOOK / per-CHUNK /
 * per-LANGUAGE-WHOLE (the granularity a service worker should cache), never
 * per-page — but a `load()` must not then embed the whole read object into
 * that page's data (see point 2 above — this discipline matters even
 * MORE now that content isn't fetched through SvelteKit's auto-inlining
 * fetch, because there's no framework backstop catching an oversized
 * return value either; it's on this module alone to keep the cut narrow).
 * `getChapter` reads an entire book but returns only the one requested
 * `Chapter` (verses) alongside book *metadata* (name/osis/abbrevs — no
 * other chapter's verses); the CCC/Compendium neighbor helpers return bare
 * `{ n }` for prev/next rather than the neighboring paragraph's/question's
 * full content, since every caller only ever links to it by number.
 *
 * FUNCTIONS THAT STAYED SYNCHRONOUS ARE BACKED BY THE INDEX, NOT CONTENT:
 * `findBookByAbbrev`/`workIdToEdition` (depended on synchronously by
 * `refs.ts`, which this restructuring must not require editing) only ever
 * needed book metadata (name/osis/abbrevs/order/chapter EXISTENCE) — never
 * verse text — so they're unaffected by the content tier moving to fetch:
 * they still read straight out of `corpus-index.ts`'s `bibleIndex`, still
 * synchronous, still returning immediately. Same story for the book/chapter
 * picker, the CCC/Compendium TOC trees, and paragraph-number existence
 * checks (`cccParagraphExists`, used by the jump box and the "related
 * paragraphs" links) — all index-backed, all still plain synchronous calls.
 * Only the functions that need actual reading TEXT (`getChapter`,
 * `getCccParagraphAsync`, `getCompendiumQuestionAsync` and friends) became
 * `async`; every caller of those is a route `load()`, which was already the
 * right place for async work.
 *
 * FIXTURES (`src/lib/fixtures/`, always used under vitest — see the
 * `USE_REAL_CORPUS` guard re-exported from `corpus-index.ts`, and that
 * file's docblock for why the guard exists) never had a content tier to
 * fetch from — they're two hand-authored books and a couple dozen
 * paragraphs, already in memory. The `async` functions below still return
 * `Promise`s under fixtures (for one call shape regardless of branch); they
 * just resolve immediately from the already-imported fixture data instead
 * of issuing a `fetch()`.
 */

import type {
	BibleIntro,
	CccNode,
	CccParagraph,
	Chapter,
	Citer,
	CompendiumQuestion,
	DocumentManifest,
	DocumentAppendixUnit,
	DocumentSection,
	Prayer,
	ScriptureRef,
	StructureNode,
	DocumentNode,
	SummaDivision,
	SummaNode,
	SummaQuestion,
	WorkManifest,
	WorkType
} from './types';

import { inlineText, parseInlineHtml } from './inline-html';
import { summaPartSlug } from './route-manifest';
import { summaHeadingTitle, summaQuestionLabel } from './summa-titles';
import {
	USE_REAL_CORPUS,
	bibleIndex,
	bibleIntroBooks,
	bibleIntroLocation,
	fixtureBibleIntrosByLang,
	cccBibleXrefsByCcc,
	cccCitationXrefs,
	documentBibleXrefs,
	documentCitationXrefs,
	cccChunkLocation,
	cccChunkStartFor,
	isUnpublished,
	cccParagraphNumbers,
	cccStructures,
	compendiumChunkLocation,
	compendiumChunkLocationsFor,
	compendiumChunkStartFor,
	compendiumQuestionNumbers,
	compendiumStructures,
	documentChunkLocation,
	documentAppendixLocation,
	documentAppendixUnits,
	documentChunkLocations,
	documentSectionNumbers,
	documentStructures,
	fixtureBibleBooks,
	fixtureCccParagraphsByLang,
	fixtureCompendiumQuestionsByLang,
	fixtureSummaQuestionsByLang,
	summaQuestionLocation,
	summaQuestionMetas,
	summaStructures,
	type SummaQuestionMeta,
	bibleChapterLocation,
	manifests,
	translatedDescriptionsLocation,
	listContentAssets,
	prayerContentLocation,
	prayerMetasByLang,
	prayerStructures,
	type BibleBookMeta,
	type ContentAsset,
	type ContentLocation,
	type PrayerMeta
} from './corpus-index';

export type { PrayerMeta };

export type { BibleBookMeta, ContentAsset };
export { USE_REAL_CORPUS, listContentAssets };

// --- Works -----------------------------------------------------------------

/** All work manifests available in this corpus, in registry order. */
/**
 * Whether a work is switched off in this build — see `site/unpublished.json`
 * for the mechanism. A disabled work has no content on the server, so the
 * callers of this are the ones that would otherwise offer an address with
 * nothing behind it.
 *
 * Re-exported here so callers have one import for everything corpus-shaped,
 * and so `corpus-index.ts` stays the boundary nothing outside `$lib` reaches
 * past.
 */
export { isUnpublished };

export function listWorks(): WorkManifest[] {
	return Object.values(manifests);
}

export function getWork(workId: string): WorkManifest | undefined {
	return manifests[workId];
}

/** Convenience: just the Bible works. */
export function listBibleWorks(): WorkManifest[] {
	return listWorks().filter((w) => w.type === 'bible');
}

/** All works of a given type, in registry order (unsorted — see `listEditions`). */
export function listWorksOfType(type: WorkType): WorkManifest[] {
	return listWorks().filter((w) => w.type === type);
}

/**
 * Editions of a work type, sorted by language then id — the order the
 * edition/version selector (docs/decisions.md #1) lists them in. Distinct
 * from `listWorksOfType`, which returns registry order.
 */
export function listEditions(type: WorkType): WorkManifest[] {
	return listWorksOfType(type).sort(
		(a, b) =>
			baseLang(a.language).localeCompare(baseLang(b.language)) ||
			// Within one language, the default region first — see `DEFAULT_REGION`.
			regionRank(a) - regionRank(b) ||
			a.id.localeCompare(b.id)
	);
}

/**
 * The order a content language is fallen back to when the reader's own has
 * no edition of a work: English first, then Latin.
 *
 * ENGLISH BEFORE LATIN, and stated rather than left to sort order. Every
 * work type used to have an edition in both interface languages, so this
 * question never arose — `defaultWorkId` took "the first edition" and the
 * answer happened to be English because `en` sorts before `la` and `pt`.
 * The Summa breaks that: it ships EN + LA and no Portuguese, and will not
 * have one before 2055 (docs/decisions.md §Scope). A Portuguese reader
 * following a citation to `STh I-II, 79, 1` must land somewhere, and which
 * somewhere should not be a property of how work ids happen to alphabetize.
 *
 * English before Latin because it is the one more readers can read; Latin
 * before nothing because it is the normative text and always complete where
 * it exists.
 */
const CONTENT_LANG_FALLBACK = ['en', 'la'];

/**
 * A reader's content languages in preference order: their own, then the
 * fallback chain, deduped.
 *
 * Exported for the service worker's download planner, which is per-language by
 * design — the corpus is 82.6 MB raw across fourteen languages and a reader
 * speaks one or two of them. `editionInLang` already walks this chain one
 * edition at a time; this is the same chain as a list, so the two cannot
 * disagree about what a reader's languages are.
 */
export function contentLangChain(lang: string): string[] {
	return [...new Set([lang, ...CONTENT_LANG_FALLBACK])];
}

/**
 * Which edition a content language resolves to when it has more than one,
 * keyed `"{type}:{base language}"`.
 *
 * STATED, BECAUSE THE ALTERNATIVE WAS AN ACCIDENT. `editionInLang` used to
 * take the first manifest in `listEditions` order, which within one language
 * is `id` order — so an English reader got the CPDV because `c` sorts before
 * `d`, and ingesting the Douay-Rheims (2026-08-24) put a second English Bible
 * one rename away from silently becoming the default. Which translation a
 * reader meets first is an editorial decision and now reads as one.
 *
 * THE BIBLE IS THE ONLY TYPE HERE, and by expectation the only one that ever
 * will be: everywhere else an "edition" is a language (see `editionStyle` in
 * EditionMenu.svelte and the compare-column fork below, which fork on the same
 * assumption). All three of its languages are listed even though only English
 * currently has a choice, because the point is that the answer is written
 * down rather than derived.
 *
 * WHAT IS DELIBERATELY NOT LISTED: a regional pair like `prayer.common.en`
 * against `prayer.common.en-gb`. That is already decided, explicitly, by
 * `DEFAULT_REGION`, and repeating the answer here would be a second place for
 * it to be true.
 *
 * Exported for corpus.test.ts, which asserts that every entry names an
 * edition that exists, and — the guard that matters — that no two editions
 * sharing one full language tag are left without an entry to separate them.
 * That is the check a third English Bible has to walk past.
 */
export const PREFERRED_EDITION: Record<string, string> = {
	'bible:en': 'bible.cpdv.en',
	'bible:pt': 'bible.matos-soares.pt',
	'bible:la': 'bible.clementina.la'
};

/**
 * Preferred work id for a type at a UI language (docs/decisions.md #1:
 * content language follows UI language by default) — the edition in the
 * reader's own language, else the first one `CONTENT_LANG_FALLBACK` finds,
 * else any edition at all.
 */
export function defaultWorkId(type: WorkType, lang: string): string | undefined {
	const editions = listEditions(type);
	return editionInLang(editions, lang)?.id ?? editions[0]?.id;
}

/**
 * The edition of `editions` a reader of `lang` should get, following the
 * fallback chain. `undefined` only when `editions` is empty or carries none
 * of the chain's languages — callers decide whether that means "no link" or
 * "show anything", and they differ (see `refHref` vs. `defaultWorkId`).
 *
 * Exported because the reference system needs exactly this decision without
 * `defaultWorkId`'s last-resort "any edition": a citation must not silently
 * land a reader on an edition in a language nobody asked for, but it must
 * still resolve when the reader's own language has no edition — which is the
 * whole of the Summa's situation.
 */
export function editionInLang(editions: WorkManifest[], lang: string): WorkManifest | undefined {
	// The type comes off the manifests rather than the signature: every caller
	// passes one type's editions (`listEditions`), so asking them to repeat it
	// would add an argument that can disagree with the list it describes.
	const type = editions[0]?.type;
	for (const candidate of [baseLang(lang), ...CONTENT_LANG_FALLBACK]) {
		const inLang = editions.filter((w) => baseLang(w.language) === candidate);
		if (!inLang.length) continue;
		const named = PREFERRED_EDITION[`${type}:${candidate}`];
		return inLang.find((w) => w.id === named) ?? inLang[0];
	}
	return undefined;
}

/**
 * Which of `available` an edition-tag preference resolves to.
 *
 * `available` is a set of full language tags (`"en-US"`, `"pt"`, `"la"`) —
 * whatever a route's own `byLang` map is keyed on. The chain is: the exact
 * tag, then the base language's default region, then any edition in that base
 * language, then `CONTENT_LANG_FALLBACK` applied the same way, and finally
 * whatever exists. Same "degrade, don't fabricate" posture as
 * `editionInLang`, which this is the tag-level counterpart of — that one
 * picks between MANIFESTS and collapses regions, this one picks between the
 * tags a route has text for and does not.
 */
export function resolveEditionTag(available: string[], preferred: string): string | undefined {
	const has = (tag: string) => available.find((a) => a.toLowerCase() === tag.toLowerCase());
	const inLang = (base: string) =>
		has(DEFAULT_REGION[base] ?? base) ?? available.find((a) => baseLang(a) === base);
	return (
		has(preferred) ??
		inLang(baseLang(preferred)) ??
		CONTENT_LANG_FALLBACK.map(inLang).find(Boolean) ??
		available[0]
	);
}

/** BCP-47 language tag -> bare language subtag, e.g. "pt-PT" -> "pt". */
export function baseLang(tag: string): string {
	return tag.split('-')[0].toLowerCase();
}

/**
 * A content language's own name, written in that language ("Português", not
 * "Portuguese") — same convention LanguageMenu.svelte uses for the UI
 * language switch, and `Latina` is deliberately the same string in both.
 * Keyed on CONTENT language, which is NOT the interface list and must not be
 * derived from it — the last four here have no dictionary and never appear in
 * the language switch (see `ContentLang` in types.ts). An unrecognized tag
 * falls back to the tag itself, which is why a missing entry degrades to
 * "sv" rather than to nothing.
 */
const LANGUAGE_NAMES: Record<string, string> = {
	en: 'English',
	pt: 'Português',
	la: 'Latina',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français',
	it: 'Italiano',
	pl: 'Polski',
	ru: 'Русский',
	ar: 'العربية',
	hu: 'Magyar',
	ro: 'Română',
	sl: 'Slovenščina',
	sv: 'Svenska'
};

/**
 * A REGIONAL EDITION NAMES ITS REGION; the unmarked one does not.
 * `prayer.common.en-gb` is the UK wording of the five prayers the source
 * prints twice, alongside `prayer.common.en`, which is the collection
 * (docs/decisions.md §Addresses and editions). Only the marked one needs a name here —
 * `en` falls through to `LANGUAGE_NAMES` and stays plain "English", which is
 * what the collection is.
 *
 * Written in the content language's own language, like every other entry
 * here — this one happens to be English already. The region is spelled the
 * way a reader of that edition would name it ("UK"), not by its BCP-47
 * subtag, which is `GB`.
 */
const REGION_NAMES: Record<string, string> = {
	'en-gb': 'English (UK)'
};

export function languageDisplayName(tag: string): string {
	return REGION_NAMES[tag.toLowerCase()] ?? LANGUAGE_NAMES[baseLang(tag)] ?? tag;
}

/**
 * Within one base language, the full tag that reads as the unmarked default —
 * what a reader who asked for "English" and nothing more specific gets.
 *
 * Stated here rather than left to `listEditions`' id tiebreak, which would
 * answer whichever id sorts first. That is the kind of answer that is right
 * by accident and stays right only until an id changes. Only the reader's own
 * stored preference overrides it.
 *
 * Reading `en: 'en'` as a tautology misses what it says: English has two
 * prayer editions, and the region-less one is the unmarked member of the
 * pair. A corpus could just as well ship `en-US` and `en-GB` with no plain
 * `en` — the option-(a) shape this one replaced did exactly that — and then
 * this entry would have to name one of them.
 */
const DEFAULT_REGION: Record<string, string> = {
	en: 'en'
};

/** Sort key putting a base language's default region ahead of its siblings. */
function regionRank(manifest: WorkManifest): number {
	const preferred = DEFAULT_REGION[baseLang(manifest.language)];
	return preferred && manifest.language.toLowerCase() === preferred.toLowerCase() ? 0 : 1;
}

/**
 * What names a compare column once the two stack and position stops saying
 * anything (`.compare-cell-tag`, app.css).
 *
 * SAME FORK AS `EditionMenu`'s `editionStyle`, for the same reason: only the
 * Bible is expected to ever carry more than one edition in the same language,
 * so everywhere else the two columns differ ONLY by language and the edition's
 * `short_title` is the wrong discriminator — "Catecismo da Igreja Católica"
 * over one column and "Catechism of the Catholic Church" over the other makes
 * the reader parse a title to recover a fact ("Português") the language name
 * states outright. Worse on `/documenta`, where `short_title` is the document's
 * own Latin-incipit title and is frequently the SAME STRING in both columns.
 *
 * The Bible is where the title genuinely carries information the language does
 * not — `bible.cpdv.en` and a future second English edition are both "English"
 * — so there, and only there, the tag is both: "English — Douay-Rheims (CPDV)".
 */
export function compareColumnLabel(
	manifest: { language: string; short_title: string },
	editionStyle = false
): string {
	const language = languageDisplayName(manifest.language);
	return editionStyle ? `${language} – ${manifest.short_title}` : language;
}

/**
 * Bible work IDs are `bible.{edition}` (see docs/corpus-schema.md); routes
 * use just the `{edition}` part (e.g. `cpdv.en`) to avoid the `bible/bible.`
 * stutter in URLs like `/bible/cpdv.en/john/3`.
 */
export function workIdToEdition(workId: string): string {
	return workId.replace(/^bible\./, '');
}

// --- Bible: index-backed (metadata + chapter existence, sync) -------------

export function getBook(workId: string, osis: string): BibleBookMeta | undefined {
	return bibleIndex[workId]?.find((b) => b.osis === osis);
}

/** All books physically present for a work, in canonical (`order`) order —
 *  already sorted by `scripts/sync-corpus.mjs` / `corpus-index.ts`'s fixture
 *  branch. */
export function listBooks(workId: string): BibleBookMeta[] {
	return bibleIndex[workId] ?? [];
}

// --- Book introductions (chapter 0) --------------------------------------
//
// Addressed as chapter 0 of the book, but stored and reasoned about apart
// from the chapters (see `types.ts`'s `BibleIntro`). Keyed by LANGUAGE, not
// by edition: the three editions of a language share one introduction,
// because an introduction is about the book.
//
// Which means chapter 0's existence is a language question, and every helper
// here that takes a `workId` resolves it to that work's language first. A
// reader on the Clementine Vulgate gets no chapter 0 while a reader on the
// CPDV does, and that asymmetry is the ordinary "absent in this edition" path
// the Bible routes already handle — not a special case.

/** Does this language have an introduction for this book? Synchronous
 *  (index-tier), so the picker and adjacency never wait on a fetch. */
export function hasBookIntro(lang: string, osis: string): boolean {
	return (bibleIntroBooks[baseLang(lang)] ?? []).includes(osis);
}

/** Whether a reader of `workId` has an introduction for this book — i.e.
 *  whether THAT WORK'S LANGUAGE has one. Exported for the chapter picker,
 *  which is prop-driven (it is handed a work id, not the reader's store). */
export function hasIntroForWork(workId: string, osis: string): boolean {
	const work = manifests[workId];
	return work ? hasBookIntro(work.language, osis) : false;
}

/** This book's chapter numbers as the READER navigates them in `workId`:
 *  the chapters present, preceded by 0 when this work's language has an
 *  introduction. Deliberately not the same list as `book.chapters` — that one
 *  is scripture, and `refs.ts` resolves citations against it. */
function navigableChapters(workId: string, book: BibleBookMeta): number[] {
	const ns = book.chapters.map((c) => c.n).sort((a, b) => a - b);
	return hasIntroForWork(workId, book.osis) ? [0, ...ns] : ns;
}

export async function getBookIntro(lang: string, osis: string): Promise<BibleIntro | undefined> {
	const base = baseLang(lang);
	if (!hasBookIntro(base, osis)) return undefined;
	const intros = await fetchTier(
		fixtureBibleIntrosByLang[base],
		bibleIntroLocation(`bible-intro.${base}`),
		undefined as BibleIntro[] | undefined
	);
	return intros?.find((entry) => entry.osis === osis);
}

/** The chapter immediately before/after the given one, among chapters present. */
function getAdjacentChapter(
	workId: string,
	osis: string,
	chapterN: number,
	direction: 'prev' | 'next'
): number | undefined {
	const book = getBook(workId, osis);
	if (!book) return undefined;
	const ns = navigableChapters(workId, book);
	const idx = ns.indexOf(chapterN);
	if (idx === -1) return undefined;
	const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
	return ns[nextIdx];
}

/**
 * Like `getAdjacentChapter`, but rolls over into the next/previous book
 * when the current book has no more chapters in that direction — this is
 * what gives the reading view a continuous, book-like flow (docs/decisions.md
 * "Reading mode: continuous, book-like") instead of dead-ending at each
 * book's edges.
 */
export function getAdjacentChapterAcrossBooks(
	workId: string,
	osis: string,
	chapterN: number,
	direction: 'prev' | 'next'
): { osis: string; chapter: number } | undefined {
	const within = getAdjacentChapter(workId, osis, chapterN, direction);
	if (within !== undefined) return { osis, chapter: within };

	const books = listBooks(workId);
	const bookIdx = books.findIndex((b) => b.osis === osis);
	if (bookIdx === -1) return undefined;

	const adjacentBook = books[direction === 'next' ? bookIdx + 1 : bookIdx - 1];
	if (!adjacentBook || adjacentBook.chapters.length === 0) return undefined;

	// Reading forward into a new book lands on its introduction when it has
	// one, which is where a reader turning the page would arrive in print.
	const chapterNs = navigableChapters(workId, adjacentBook);
	const chapter = direction === 'next' ? chapterNs[0] : chapterNs[chapterNs.length - 1];
	return { osis: adjacentBook.osis, chapter };
}

/** Find a book by one of its jump-box abbreviations (case-insensitive). */
export function findBookByAbbrev(workId: string, abbrev: string): BibleBookMeta | undefined {
	const needle = abbrev.trim().toLowerCase();
	return listBooks(workId).find(
		(b) => b.osis === needle || b.abbrevs.some((a) => a.toLowerCase() === needle)
	);
}

// --- Canonical (edition-independent) Bible structure ---------------------
//
// Tables of contents and the book/chapter picker describe the *work*, not
// whichever edition is currently selected (docs/decisions.md #4): a reader
// picking "Genesis 12" shouldn't see the picker change shape when they
// switch editions. `CanonicalBook` is the union of a book's presence across
// every Bible work — every osis code and chapter number seen in ANY
// edition — with `namesByWorkId` carrying each edition's own display name
// so callers can still label the book in the reader's chosen edition.
//
// Computed once at module load (not per call): with up to 73 books x ~150
// chapters x every Bible edition, re-walking this on every render would be
// wasteful for something that never changes at runtime. Index-backed (chapter
// NUMBERS only), same as everything else in this section — no content fetch.

export interface CanonicalBook {
	osis: string;
	order: number;
	/** Chapter numbers present in at least one edition, ascending. Includes 0
	 *  when some language introduces this book — see `hasBookIntro`. */
	chapters: number[];
	/** Display name per bible work id, for labelling in the reader's own edition. */
	namesByWorkId: Record<string, string>;
}

const canonicalBooksByOsis: Map<string, CanonicalBook> = (() => {
	const out = new Map<string, CanonicalBook>();
	// Sorted for determinism: iteration order otherwise depends on
	// filesystem/glob enumeration order, which isn't guaranteed stable.
	const works = [...listBibleWorks()].sort((a, b) => a.id.localeCompare(b.id));
	for (const work of works) {
		for (const book of listBooks(work.id)) {
			let entry = out.get(book.osis);
			if (!entry) {
				entry = { osis: book.osis, order: book.order, chapters: [], namesByWorkId: {} };
				out.set(book.osis, entry);
			}
			entry.namesByWorkId[work.id] = book.name;
			const chapters = new Set(entry.chapters);
			for (const chapter of book.chapters) chapters.add(chapter.n);
			entry.chapters = [...chapters].sort((a, b) => a - b);
		}
	}
	// Chapter 0 where any language has an introduction — the union across
	// LANGUAGES, matching how the rest of this map is the union across
	// editions. The picker then marks it present or unavailable per edition
	// through `chaptersInEdition`, exactly as it already does for a chapter
	// one edition has and another doesn't.
	for (const osis of new Set(Object.values(bibleIntroBooks).flat())) {
		const entry = out.get(osis);
		if (entry && !entry.chapters.includes(0)) entry.chapters = [0, ...entry.chapters];
	}
	return out;
})();

export function listCanonicalBooks(): CanonicalBook[] {
	return [...canonicalBooksByOsis.values()].sort((a, b) => a.order - b.order);
}

export function getCanonicalBook(osis: string): CanonicalBook | undefined {
	return canonicalBooksByOsis.get(osis);
}

// --- Bible: content tier (async, read/fetched, memoized) -------------------

/**
 * `__CORPUS_DATA_DIR__`: the absolute path to `src/lib/corpus-data/`,
 * baked in at build time by `vite.config.ts` (`define`) — see that file's
 * comment for why it's injected there rather than derived from
 * `import.meta.url` here (Vite's SSR build bundles this module into a
 * chunk that doesn't live in `src/lib/`, so a self-relative path would
 * resolve against the wrong directory).
 */
declare const __CORPUS_DATA_DIR__: string;

/**
 * Content is read two different ways depending on where this code runs,
 * and the split is NOT the obvious "prerender vs runtime" one:
 *
 *   - SSR (`import.meta.env.SSR`) reads the file straight off disk with
 *     `node:fs`. This is NOT primarily an optimization — it's required for
 *     correctness, because SvelteKit's `load`-time `fetch` inlines the FULL
 *     response of every request it makes into the page's hydration
 *     payload, so a future client-side `load()` re-run can replay it
 *     without a network round-trip — a real feature, but one that applies
 *     to the raw response, not to whatever slice `load()` actually
 *     returns. Tried first, measured, back when the site still prerendered
 *     every route: fetching a whole book that way to read one chapter
 *     produced a ~300 KB page for Genesis 1 (the entire book, re-embedded,
 *     once per chapter — the exact per-page re-bloat this whole
 *     restructuring exists to remove, just relocated). A plain
 *     `fs.readFile` has no such side effect — nothing inlines a value into
 *     the page except `load`'s own return. `import.meta.env.SSR` is true
 *     whenever this module runs in SvelteKit's server build; since the site
 *     became one SPA shell with `ssr = false` (`+layout.ts`,
 *     docs/decisions.md §The site) no route's `load()` runs there for a
 *     real visit any more, so this branch has nothing left to run against
 *     today — it is kept because the split was never really "prerender vs
 *     runtime", only "server vs browser", and `import.meta.env.SSR` still
 *     answers that correctly if SSR is ever reinstated for a route.
 *   - Browser (post-hydration, client-side navigation): a normal `fetch()`
 *     against the content-hashed URL, cached by the HTTP cache and (once
 *     wired) the service worker.
 *
 * Both branches share the same in-memory memoization below, so this is
 * still "one call shape, not a server/client branch" at every call site —
 * only this one function knows the two paths differ.
 */
/** relPath -> in-flight/resolved read, so N pages needing the same book
 *  (every chapter of Genesis wants Genesis's one file) issue exactly one
 *  disk read / fetch. */
const contentCache = new Map<string, Promise<unknown>>();

/**
 * The content file most recently read in this tab, as the service worker's
 * wave planner wants it (see `planWaves`'s `current`).
 *
 * Recorded here because this is the only place that resolves an address to a
 * content file, and the root layout — which is what talks to the worker — has
 * no idea which file the route it just rendered needed. Threading it up
 * through every `+page.ts` would touch a dozen routes to say something one
 * function already knows.
 *
 * The work id is recovered from `relPath` (`content/{workId}/...`), which is
 * the shape `sync-corpus.mjs` writes and `contentKey` preserves.
 */
let lastRead: { workId: string; path: string } | undefined;

export function lastContentRead(): { workId: string; path: string } | undefined {
	return lastRead;
}

async function readContent<T>(location: ContentLocation): Promise<T> {
	// `globalThis.location`, not the bare name: the parameter above shadows it.
	const here = globalThis.location?.href;
	if (!import.meta.env.SSR && here) {
		lastRead = {
			workId: location.relPath.split('/')[1] ?? '',
			path: new URL(location.url, here).pathname
		};
	}
	let pending = contentCache.get(location.relPath) as Promise<T> | undefined;
	if (!pending) {
		pending = import.meta.env.SSR
			? readContentFromDisk<T>(location.relPath)
			: readContentFromNetwork<T>(location.url);
		contentCache.set(location.relPath, pending);
	}
	return pending;
}

async function readContentFromDisk<T>(relPath: string): Promise<T> {
	const { readFile } = await import('node:fs/promises');
	const path = await import('node:path');
	const raw = await readFile(path.join(__CORPUS_DATA_DIR__, relPath), 'utf8');
	return JSON.parse(raw) as T;
}

async function readContentFromNetwork<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`corpus.ts: failed to fetch ${url} (${res.status})`);
	return res.json() as Promise<T>;
}

/**
 * Descriptions translated into `lang`, as `document slug -> text`.
 *
 * A description written by READING a document is already on its manifest, in
 * the work's own language. This is the other kind: renderings marked
 * `origin: "translated"` in `site/descriptions.json`, which are shipped one
 * file per language and fetched only when a reader's language is not the one
 * a description was written in. An English reader never issues this request;
 * everyone else issues exactly one, for every document at once, because
 * `/documenta` lists them all on one page.
 *
 * Keyed by document slug rather than work id: a translation is prose about the
 * document, so it serves whichever edition a reader happens to be shown. See
 * `scripts/sync-corpus.mjs` for why the authoring file is keyed the other way.
 *
 * `{}` for a language nothing is translated into — the ordinary case today
 * and not an error, the same way an absent content file means "the corpus has
 * nothing built at that address" rather than a failure.
 */
export async function loadTranslatedDescriptions(lang: string): Promise<Record<string, string>> {
	if (!USE_REAL_CORPUS) return {};
	const location = translatedDescriptionsLocation(lang);
	if (!location) return {};
	return readContent<Record<string, string>>(location);
}

/**
 * Shared shape behind every content-tier fetch (Bible books, CCC chunks,
 * Compendium/document/prayer whole-language files): under fixtures
 * (`!USE_REAL_CORPUS`, always true under vitest — see this module's
 * docblock, "FIXTURES") return `fixture` outright, never touching the index
 * or issuing a read. Otherwise an absent `location` means the corpus simply
 * has nothing built at that address — an unbuilt/withheld work, a chunk past
 * the end, a language with no file (`sync-corpus.mjs` never wrote it) — so
 * return `empty` rather than attempting a read; a present `location` defers
 * to `readContent`, which does the actual disk read / fetch and owns the
 * memoization, so callers never pay for the same file twice.
 */
async function fetchTier<T>(
	fixture: T,
	location: ContentLocation | undefined,
	empty: T
): Promise<T> {
	if (!USE_REAL_CORPUS) return fixture;
	if (!location) return empty;
	return readContent<T>(location);
}

/**
 * The 20-chapter chunk `chapterN` of `osis` lives in (see
 * `BIBLE_CHAPTER_CHUNK_SIZE` in scripts/sync-corpus.mjs).
 *
 * The fixture branch returns the whole fixture book rather than a slice of
 * it, and that is deliberate rather than an approximation: fixtures are
 * hand-authored two-book editions well under a single chunk, so "the chunk
 * containing chapter n" and "the book" are the same set of chapters there.
 * Slicing them to the stride would make the tests assert the chunking
 * arithmetic twice — once here and once in the stride-parity test — while
 * testing nothing the real corpus does differently.
 */
async function fetchChapterChunk(
	workId: string,
	osis: string,
	chapterN: number
): Promise<Chapter[]> {
	return fetchTier(
		fixtureBibleBooks[workId]?.[osis]?.chapters,
		bibleChapterLocation(workId, osis, chapterN),
		[]
	);
}

/**
 * Reads the chapter chunk (content tier) but returns only book METADATA
 * (already had it, from the index — no need to wait on the read for it)
 * plus the ONE requested `Chapter` (verses). See this module's docblock,
 * "COARSE FETCH, NARROW RETURN": returning the whole chunk here would
 * re-embed twenty chapters of text into every one of their pages' route
 * data, exactly the bloat this rewrite removes.
 *
 * The coarse unit used to be the whole book, which was the print volume's
 * granularity but never the reader's: this tier's only caller is this
 * function, and it wants one chapter. Reading Ps 23 fetched all 150 psalms —
 * 374 KB raw, the largest single read in the corpus — until 2026-08-25.
 */
export async function getChapter(
	workId: string,
	osis: string,
	chapterN: number
): Promise<{ book: BibleBookMeta; chapter: Chapter } | undefined> {
	const book = getBook(workId, osis);
	if (!book || !book.chapters.some((c) => c.n === chapterN)) return undefined;
	const chunk = await fetchChapterChunk(workId, osis, chapterN);
	const chapter = chunk.find((c) => c.n === chapterN);
	if (!chapter) return undefined;
	return { book, chapter };
}

// --- Structure trees (shared: CCC and Compendium) -------------------------
//
// The CCC and Compendium both model their table of contents as the same
// tree shape (`StructureNode`, see types.ts — Compendium's `.paragraphs`
// holds QUESTION ranges there, not CCC paragraph numbers). Both trees use
// the same null-bound convention for unaddressable content
// (docs/corpus-schema.md, "amended 2026-08-14"). Shared here so that
// convention is handled in exactly one place instead of two copies drifting
// apart. Index-backed (structure trees are index tier, not content) — no
// fetch involved anywhere in this section.

/**
 * Walk a structure tree and return the path of nodes from root to the
 * deepest node whose range contains `n` (a breadcrumb trail).
 */
function breadcrumbIn(tree: StructureNode[], n: number): StructureNode[] {
	const path: StructureNode[] = [];

	function walk(nodes: StructureNode[]): boolean {
		for (const node of nodes) {
			const [first, last] = node.paragraphs;
			// A `null` bound marks unnumbered content the structure knows
			// about but no number addresses (creed texts, epigraphs, ...).
			// Treat it as never containing anything rather than letting
			// `n < null` (== `n < 0` via JS coercion) falsely match.
			if (typeof first !== 'number' || typeof last !== 'number') continue;
			if (n < first || n > last) continue;
			path.push(node);
			walk(node.children);
			return true;
		}
		return false;
	}

	walk(tree);
	return path;
}

/** Flatten a structure tree into a depth-first list, for building a TOC. */
function flattenTree(tree: StructureNode[]): { node: StructureNode; depth: number }[] {
	const out: { node: StructureNode; depth: number }[] = [];
	function walk(nodes: StructureNode[], depth: number) {
		for (const node of nodes) {
			out.push({ node, depth });
			walk(node.children, depth + 1);
		}
	}
	walk(tree, 0);
	return out;
}

/**
 * True when a node can serve as a whole-chapter reading unit: one of
 * `kinds` (the caller's own chapter-ish kind list — CCC and Compendium each
 * have their own, see `CCC_CHAPTER_KINDS`/`COMPENDIUM_CHAPTER_KINDS`) AND a
 * fully-numbered range to actually read (the corpus permits null bounds,
 * meaning "unaddressable" — docs/corpus-schema.md). Shared because the CCC
 * and Compendium disagree on which kinds count but agree on everything else
 * about the test.
 */
function isChapterNode(node: StructureNode, kinds: readonly StructureNode['kind'][]): boolean {
	return (
		kinds.includes(node.kind) &&
		Number.isFinite(node.paragraphs[0]) &&
		Number.isFinite(node.paragraphs[1])
	);
}

/**
 * A breadcrumb trail cut off at the chapter-sized node, inclusive — the
 * ancestors a WHOLE-CHAPTER reading view can name above itself.
 *
 * The single-unit routes print the full trail because everything in it is
 * above the paragraph on the page. On `/catechismus/caput/[n]` and
 * `/compendium/caput/[n]` the chapter IS the page, so the articles and
 * subsections below it are not places the reader could go up to — they are
 * headings already printed in the body. Truncating at the chapter is what
 * keeps the crumb row a path to this page rather than a path through it.
 *
 * Empty when no node of `kinds` contains `n`, matching the chapter
 * accessors below: no chapter, no chapter trail.
 */
function chapterTrailIn(
	trail: StructureNode[],
	kinds: readonly StructureNode['kind'][]
): StructureNode[] {
	for (let i = trail.length - 1; i >= 0; i--) {
		if (isChapterNode(trail[i], kinds)) return trail.slice(0, i + 1);
	}
	return [];
}

/**
 * The value in a sorted, ascending, gap-tolerant number list immediately
 * before/after `n` — shared by the CCC's and Compendium's "adjacent
 * paragraph/question that actually exists" accessors, which both need this
 * over a possibly-gappy list (fixtures deliberately are, see
 * `cccParagraphExists`'s docblock) rather than simple `n - 1`/`n + 1`
 * arithmetic. Doesn't assume `ns` excludes `n` itself — `find`/`reverse+find`
 * only ever look strictly past it in the requested direction.
 */
function adjacentInSorted(
	ns: readonly number[],
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	if (direction === 'next') return ns.find((x) => x > n);
	return [...ns].reverse().find((x) => x < n);
}

// --- Catechism: index-backed (structure, abbreviations, existence, sync) --

/** Languages the CCC is available in. */
export function cccLangs(): string[] {
	return Object.keys(cccStructures).sort();
}

export function getCccStructure(lang: string): CccNode[] {
	return cccStructures[lang] ?? [];
}

const cccParagraphNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(cccParagraphNumbers).map(([lang, ns]) => [lang, new Set(ns)])
);

/** Whether paragraph `n` exists in this corpus for `lang` — index-backed
 *  (no fetch), so the jump box and "related paragraphs" links can check
 *  existence without pulling in that paragraph's content. Never assume a
 *  contiguous range: the fixtures are deliberately gappy (see
 *  `corpus-index.ts`'s docblock). */
export function cccParagraphExists(lang: string, n: number): boolean {
	return cccParagraphNumberSets[lang]?.has(n) ?? false;
}

/** The paragraph number immediately before/after `n` that actually exists,
 *  or undefined at either end. Index-backed — see `cccParagraphExists`. */
export function getAdjacentCccParagraphNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	return adjacentInSorted(cccParagraphNumbers[lang] ?? [], n, direction);
}

/**
 * Walk the structure tree and return the path of nodes from root to the
 * deepest node whose range contains paragraph `n` (a breadcrumb trail).
 * Shared implementation: see `breadcrumbIn` above.
 */
export function getCccBreadcrumb(lang: string, n: number): CccNode[] {
	return breadcrumbIn(getCccStructure(lang), n);
}

/**
 * Flatten the structure tree into a depth-first list, for building a TOC.
 * Shared implementation: see `flattenTree` above.
 */
export function flattenCccStructure(lang: string): { node: CccNode; depth: number }[] {
	return flattenTree(getCccStructure(lang));
}

/**
 * The kinds that count as a "chapter" for whole-chapter reading, innermost
 * first.
 *
 * `chapter` is the unit a reader means by the word, and the CCC's own
 * structure uses it consistently — but not universally: the Prologue holds
 * paragraphs 1-25 directly under itself with no chapter beneath, so it has
 * to be its own unit. `section` and `part` are the fallbacks for any node
 * arrangement neither covers (none exists in today's corpus; they are here
 * so a structure change upstream degrades to a larger reading unit rather
 * than to no link at all).
 *
 * Deliberately NOT including `article`: articles nest INSIDE chapters, so
 * ranking them innermost would make "read the full chapter" silently mean
 * "read this article" for the ~67 paragraphs that live under one.
 */
const CCC_CHAPTER_KINDS: CccNode['kind'][] = ['chapter', 'prologue', 'section', 'part'];

/**
 * The chapter-sized node containing paragraph `n`, or undefined if none
 * does. Walks the breadcrumb from the inside out and takes the first
 * qualifying ancestor, so a paragraph inside an article inside a chapter
 * resolves to the chapter.
 */
export function getCccChapterFor(lang: string, n: number): CccNode | undefined {
	return getCccChapterBreadcrumb(lang, n).at(-1);
}

/**
 * The trail from root down to and including that chapter — what
 * `/catechismus/caput/[n]` prints above the chapter it is showing. See
 * `chapterTrailIn` for why it stops there.
 */
export function getCccChapterBreadcrumb(lang: string, n: number): CccNode[] {
	return chapterTrailIn(getCccBreadcrumb(lang, n), CCC_CHAPTER_KINDS);
}

/**
 * Every chapter-sized node in a language's structure — this used to be the
 * entry list handed to `adapter-static`'s prerendering for
 * `/catechismus/caput/[n]`, back when every route was prerendered
 * individually. Since the site became one SPA shell with `ssr = false`
 * (`+layout.ts`, docs/decisions.md §The site) there is no such entry list
 * to prerender any more; this now resolves a chapter address to its
 * structure node instead (`linkPreviewContent.ts` uses it to find the
 * chapter starting at a given paragraph number), and it still defines which
 * `/catechismus/caput/[n]` addresses are canonical at all — a chapter,
 * addressed by its FIRST paragraph number.
 *
 * That address is chosen over a slug or an index because it is the only
 * identifier the corpus already guarantees: chapter titles differ by
 * language and change with the case-normalization pass, and an ordinal
 * position shifts if the structure is ever re-parsed, but "the chapter
 * starting at paragraph 27" names the same text in every edition and needs
 * nothing stored to resolve.
 */
export function listCccChapters(lang: string): CccNode[] {
	return flattenCccStructure(lang)
		.map(({ node }) => node)
		.filter((node) => isChapterNode(node, CCC_CHAPTER_KINDS));
}

// --- Catechism: content tier (async, read/fetched, memoized, chunked) -----

async function fetchCccChunk(lang: string, n: number): Promise<CccParagraph[]> {
	return fetchTier(fixtureCccParagraphsByLang[lang] ?? [], cccChunkLocation(`ccc.${lang}`, n), []);
}

/** Reads the 100-paragraph chunk `n` lives in (content tier), returns only
 *  paragraph `n` itself. Checks `cccParagraphExists` first so a
 *  not-in-this-corpus number never triggers a read. */
export async function getCccParagraphAsync(
	lang: string,
	n: number
): Promise<CccParagraph | undefined> {
	if (!cccParagraphExists(lang, n)) return undefined;
	const chunk = await fetchCccChunk(lang, n);
	return chunk.find((p) => p.n === n);
}

/**
 * Every paragraph from `from` to `to` inclusive — the whole-chapter reading
 * view (`/catechismus/caput/[n]`).
 *
 * Fetches one chunk per 100-paragraph span the range touches, not one per
 * paragraph: the CCC's largest chapter is ~90 paragraphs, so this is
 * typically one or two reads regardless of range size, and each is the same
 * immutable, already-cacheable file the single-paragraph route pulls. That's
 * the "COARSE FETCH, NARROW RETURN" rule this module's docblock states,
 * applied in the direction it was designed for — a reader who opens a
 * chapter after reading one of its paragraphs usually needs no new request
 * at all.
 *
 * Chunk boundaries do not align with chapter boundaries (chunks are a fixed
 * arithmetic partition of the paragraph space, chapters are editorial), so
 * the fetched chunks are filtered down to the requested range afterwards and
 * re-sorted — a chapter spanning a boundary otherwise arrives in chunk
 * order, which is only coincidentally paragraph order.
 */
export async function getCccParagraphRangeAsync(
	lang: string,
	from: number,
	to: number
): Promise<CccParagraph[]> {
	if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];

	// Step by chunk rather than by paragraph, then dedupe: `cccChunkStartFor`
	// is a pure function of `n`, so the set of distinct chunk starts is all
	// that decides how many reads happen.
	const starts = new Set<number>();
	for (let n = from; n <= to; n++) starts.add(cccChunkStartFor(n));

	const chunks = await Promise.all([...starts].map((start) => fetchCccChunk(lang, start)));
	return chunks
		.flat()
		.filter((p) => p.n >= from && p.n <= to)
		.sort((a, b) => a.n - b.n);
}

// --- Compendium: index-backed (structure, sync) ----------------------------
//
// The Compendium of the CCC (docs/corpus-schema.md "Compendium —
// questions.json"): 598 Q&A pairs, each printing the CCC paragraph range it
// condenses (`ccc_refs`, a raw string — see docs/link-surface.md #11). Its
// `structure.json` reuses the CCC's tree shape (see `StructureNode` in
// types.ts) but addresses QUESTION numbers via `.paragraphs`, not CCC
// paragraph numbers — every accessor below is careful to say "question",
// never "paragraph", so that distinction stays visible at the call site.

/** Languages the Compendium is available in. */
export function compendiumLangs(): string[] {
	return Object.keys(compendiumStructures).sort();
}

export function getCompendiumStructure(lang: string): StructureNode[] {
	return compendiumStructures[lang] ?? [];
}

/**
 * Walk the structure tree and return the path of nodes from root to the
 * deepest node whose QUESTION range contains `n` (a breadcrumb trail).
 * Shared implementation: see `breadcrumbIn` above.
 */
export function getCompendiumBreadcrumb(lang: string, n: number): StructureNode[] {
	return breadcrumbIn(getCompendiumStructure(lang), n);
}

/**
 * The Compendium's equivalent of a CCC whole-chapter unit. A chapter is the
 * usual answer; the outer section/part fallbacks cover headings which begin
 * before their first child chapter, so every outline destination can open a
 * continuous reading page rather than one isolated question.
 */
const COMPENDIUM_CHAPTER_KINDS: StructureNode['kind'][] = ['chapter', 'section', 'part'];

/** The innermost whole-reading unit containing question `n`. */
export function getCompendiumChapterFor(lang: string, n: number): StructureNode | undefined {
	return getCompendiumChapterBreadcrumb(lang, n).at(-1);
}

/** The trail from root down to and including that unit, for
 *  `/compendium/caput/[n]`'s crumb row — the CCC's
 *  `getCccChapterBreadcrumb`, over question numbers. */
export function getCompendiumChapterBreadcrumb(lang: string, n: number): StructureNode[] {
	return chapterTrailIn(getCompendiumBreadcrumb(lang, n), COMPENDIUM_CHAPTER_KINDS);
}

/** Every canonical Compendium whole-reading start in one language. */
export function listCompendiumChapters(lang: string): StructureNode[] {
	return flattenCompendiumStructure(lang)
		.map(({ node }) => node)
		.filter((node) => isChapterNode(node, COMPENDIUM_CHAPTER_KINDS));
}

/**
 * Flatten the structure tree into a depth-first list, for building a TOC.
 * Shared implementation: see `flattenTree` above.
 */
export function flattenCompendiumStructure(lang: string): { node: StructureNode; depth: number }[] {
	return flattenTree(getCompendiumStructure(lang));
}

// --- Compendium: content tier (async, read/fetched, memoized, chunked) ----
//
// Chunked by question at a stride of 100, exactly as the CCC is by paragraph
// — see `COMPENDIUM_CHUNK_SIZE` in scripts/sync-corpus.mjs for why, and for
// the whole-file rule this replaced on 2026-08-25. Ten editions at 280-290 KB
// raw each meant opening question 1 downloaded all 598 answers.

async function fetchCompendiumChunk(lang: string, n: number): Promise<CompendiumQuestion[]> {
	return fetchTier(
		fixtureCompendiumQuestionsByLang[lang] ?? [],
		compendiumChunkLocation(`compendium.${lang}`, n),
		[]
	);
}

/** Reads the 100-question chunk `n` lives in, returns only question `n`.
 *  Checks existence against the index first, so a number this edition does
 *  not carry never triggers a read — the CCC's `getCccParagraphAsync` rule,
 *  and newly possible here because the numbers moved to the index with the
 *  split (see `compendiumQuestionNumbers`). */
export async function getCompendiumQuestionAsync(
	lang: string,
	n: number
): Promise<CompendiumQuestion | undefined> {
	if (!compendiumQuestionExists(lang, n)) return undefined;
	const chunk = await fetchCompendiumChunk(lang, n);
	return chunk.find((q) => q.n === n);
}

/**
 * Every question in an inclusive structural range, for `/compendium/caput/[n]`.
 *
 * One fetch per 100-question span the range touches, not one per question —
 * see `getCccParagraphRangeAsync`, which this mirrors exactly, including the
 * re-sort: chunk boundaries are a fixed arithmetic partition and chapter
 * boundaries are editorial, so a chapter spanning a boundary arrives in chunk
 * order, which is only coincidentally question order.
 */
export async function getCompendiumQuestionRangeAsync(
	lang: string,
	from: number,
	to: number
): Promise<CompendiumQuestion[]> {
	if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];

	const starts = new Set<number>();
	for (let n = from; n <= to; n++) starts.add(compendiumChunkStartFor(n));

	const chunks = await Promise.all([...starts].map((start) => fetchCompendiumChunk(lang, start)));
	return chunks
		.flat()
		.filter((question) => question.n >= from && question.n <= to)
		.sort((a, b) => a.n - b.n);
}

/** Question numbers this edition carries, as a set per language — the
 *  Compendium's `cccParagraphNumberSets`. */
const compendiumQuestionNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(compendiumQuestionNumbers).map(([lang, ns]) => [lang, new Set(ns)])
);

/** Whether this edition carries question `n`. Index-backed (no fetch), same
 *  role as `cccParagraphExists`. */
export function compendiumQuestionExists(lang: string, n: number): boolean {
	return compendiumQuestionNumberSets[lang]?.has(n) ?? false;
}

/** The question number immediately before/after `n` that actually exists, or
 *  undefined at either end. Index-backed — see `compendiumQuestionExists`.
 *  Was a content read until the chunk split, which would now have had to pull
 *  every chunk to answer. */
export function getAdjacentCompendiumQuestionNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	return adjacentInSorted(compendiumQuestionNumbers[lang] ?? [], n, direction);
}

// --- Cross-references -------------------------------------------------

/**
 * Scripture references for a CCC paragraph (xrefs/ccc-bible.json, derived —
 * see docs/corpus-schema.md). References are edition-independent (OSIS +
 * chapter + verse); resolve against whichever Bible edition the reader has
 * open. Index-backed (small — see corpus-index.ts): empty array when the
 * paragraph has none, or the xrefs file itself is absent (fixtures without
 * one).
 */
export function getCccBibleXrefs(cccN: number): ScriptureRef[] {
	return cccBibleXrefsByCcc.get(cccN) ?? [];
}

/**
 * The REVERSE direction of the same data: which CCC paragraphs cite a given
 * chapter, grouped by verse.
 *
 * docs/decisions.md calls bidirectional CCC-Bible linking the flagship v1
 * feature, and only the forward half (`getCccBibleXrefs`) ever shipped: a
 * reader could go from a Catechism paragraph to the verse it cites, but a
 * reader in the Bible had no way to learn that the verse in front of them is
 * cited in the Catechism at all. This is the other half, and it needs no new
 * corpus data -- the same `xrefs/ccc-bible.json` inverted.
 *
 * INVERTED LAZILY AND ONCE, on the first Bible chapter that asks. The
 * forward file is ~3,800 refs over 1,198 paragraphs; building the reverse
 * map eagerly at module load would put that work on every page in the site,
 * including the ones that never open a Bible chapter. Building it per-call
 * would put it on every chapter navigation. The memo is the obvious middle,
 * and the data is immutable once loaded.
 *
 * A WHOLE-CHAPTER CITATION (`verses: []`, the corpus's convention -- see
 * `ScriptureRef`) is recorded under the sentinel key 0 rather than being
 * dropped or expanded across every verse in the chapter. Expanding it would
 * claim the Catechism cites each verse individually, which is a different
 * and stronger statement than what it actually did; dropping it would lose a
 * real citation. Callers render key 0 as a chapter-level note.
 */
type CccCitationsByVerse = Map<number, number[]>;
let cccBibleReverseIndex: Map<string, CccCitationsByVerse> | null = null;

function reverseKey(osis: string, chapter: number): string {
	return `${osis}:${chapter}`;
}

function buildCccBibleReverseIndex(): Map<string, CccCitationsByVerse> {
	const index = new Map<string, CccCitationsByVerse>();
	for (const [cccN, refs] of cccBibleXrefsByCcc) {
		for (const ref of refs) {
			const key = reverseKey(ref.osis, ref.chapter);
			let byVerse = index.get(key);
			if (!byVerse) index.set(key, (byVerse = new Map()));
			// `[0]` rather than `ref.verses` when empty -- see the docblock.
			for (const verse of ref.verses.length > 0 ? ref.verses : [0]) {
				const list = byVerse.get(verse);
				if (list) {
					// The same paragraph can cite the same verse twice (a "cf."
					// repeat in a long footnote); the reader wants one link.
					if (!list.includes(cccN)) list.push(cccN);
				} else {
					byVerse.set(verse, [cccN]);
				}
			}
		}
	}
	for (const byVerse of index.values()) {
		for (const list of byVerse.values()) list.sort((a, b) => a - b);
	}
	return index;
}

/**
 * CCC paragraph numbers citing each verse of one chapter, keyed by verse
 * number (0 = the chapter as a whole). Empty map when nothing cites it.
 *
 * Scoped to a chapter rather than exposing the whole reverse index because
 * that is exactly what a reading page needs, and it keeps the shape that
 * callers iterate small enough to hand straight to a template.
 */
export function getCccCitationsForChapter(osis: string, chapter: number): CccCitationsByVerse {
	cccBibleReverseIndex ??= buildCccBibleReverseIndex();
	return cccBibleReverseIndex.get(reverseKey(osis, chapter)) ?? new Map();
}

/**
 * The same relation for the magisterial documents: which SECTION of which
 * document cites each verse of one chapter.
 *
 * Grouped by document here rather than left as a flat list, because that is
 * the shape the reader wants and the shape the page renders — one label per
 * work with its section numbers beside it ("Lumen Gentium §8 §22"), not the
 * work's name repeated once per section. Sections within a document come out
 * ascending; the documents themselves are left in the index's own order,
 * which is alphabetical by slug, and the page re-sorts by display title since
 * the title is what a reader actually scans.
 *
 * Same lazy-once inversion as the CCC index above, and for the same reason:
 * ~1,900 entries is real work to invert, and no page outside a Bible chapter
 * ever asks for it. `verses: []` (a whole-chapter citation) lands under the
 * sentinel key 0, identically.
 */
export interface DocumentCitation {
	slug: string;
	sections: number[];
}
type DocumentCitationsByVerse = Map<number, DocumentCitation[]>;

let documentBibleReverseIndex: Map<string, DocumentCitationsByVerse> | null = null;

function buildDocumentBibleReverseIndex(): Map<string, DocumentCitationsByVerse> {
	const index = new Map<string, DocumentCitationsByVerse>();
	for (const entry of documentBibleXrefs) {
		for (const ref of entry.refs) {
			const key = reverseKey(ref.osis, ref.chapter);
			let byVerse = index.get(key);
			if (!byVerse) index.set(key, (byVerse = new Map()));
			for (const verse of ref.verses.length > 0 ? ref.verses : [0]) {
				let works = byVerse.get(verse);
				if (!works) byVerse.set(verse, (works = []));
				const existing = works.find((w) => w.slug === entry.work);
				if (existing) {
					// One section can cite the same verse from two of its
					// citations; the reader wants one link.
					if (!existing.sections.includes(entry.n)) existing.sections.push(entry.n);
				} else {
					works.push({ slug: entry.work, sections: [entry.n] });
				}
			}
		}
	}
	for (const byVerse of index.values()) {
		for (const works of byVerse.values()) {
			for (const work of works) work.sections.sort((a, b) => a - b);
		}
	}
	return index;
}

export function getDocumentCitationsForChapter(
	osis: string,
	chapter: number
): DocumentCitationsByVerse {
	documentBibleReverseIndex ??= buildDocumentBibleReverseIndex();
	return documentBibleReverseIndex.get(reverseKey(osis, chapter)) ?? new Map();
}

/**
 * The non-scripture reverse index: who cites this document, and who cites
 * this Catechism paragraph.
 *
 * ALREADY INVERTED, unlike the two above, which is why there is no lazy build
 * here. Those two invert a forward index the site also needs forward (a
 * paragraph's own references); this one has no forward use — the forward
 * direction is a link the grammar renders from the citation string itself,
 * with nothing stored. So the builder emits it in the only shape anything
 * reads it in (`scripts/build-xrefs.mjs`).
 *
 * Grouped by section for the same reason `DocumentCitation` groups by work:
 * the reader is standing on one section and wants that section's citers, not
 * a flat list to filter. The `null` key holds the citations that name the
 * document without naming a section of it — see `DocumentCitationXref`.
 */
let documentCitationIndex: Map<string, Map<number | null, Citer[]>> | null = null;

function buildDocumentCitationIndex(): Map<string, Map<number | null, Citer[]>> {
	const index = new Map<string, Map<number | null, Citer[]>>();
	for (const entry of documentCitationXrefs) {
		let bySection = index.get(entry.work);
		if (!bySection) index.set(entry.work, (bySection = new Map()));
		bySection.set(entry.n, entry.cited_by);
	}
	return index;
}

/**
 * Every citer of one document, keyed by the section cited (`null` = the
 * document at large). Empty map when nothing cites it.
 */
export function getDocumentCitations(slug: string): Map<number | null, Citer[]> {
	documentCitationIndex ??= buildDocumentCitationIndex();
	return documentCitationIndex.get(slug) ?? new Map();
}

let cccCitationIndex: Map<number, Citer[]> | null = null;

/** Who cites one Catechism paragraph. Empty array when nothing does. */
export function getCccCitations(cccN: number): Citer[] {
	cccCitationIndex ??= new Map(cccCitationXrefs.map((entry) => [entry.ccc, entry.cited_by]));
	return cccCitationIndex.get(cccN) ?? [];
}

// --- Documents: index-backed (registry, structure, existence, sync) -------
//
// docs/corpus-schema.md §Documents: encyclicals, conciliar constitutions/
// decrees/declarations, CDF declarations, .... Unlike the CCC and Compendium
// — one canonical work per language, so their accessors above are keyed by
// bare LANGUAGE — a "document" work type is really N independent works, one
// per {family, slug} pair, each with its own EN/PT editions (work ids
// `{family}.{slug}.{lang}`, e.g. `vatii.lumen-gentium.en`). There is no
// single "the document structure for English" the way there's a single CCC
// tree for English, so every document accessor below is keyed by WORK ID,
// and `DocumentGroup` — the one new grouping concept this needs — is what
// gives a language-independent handle (`slug`) to address a document's
// editions together, the same job `listEditions('bible')` does for Bible
// work ids, just scoped to one document instead of the whole work type.

export interface DocumentGroup {
	/** Language-independent id, e.g. "lumen-gentium" — the segment between
	 *  `family` and `lang` in every edition's work id, and what edition-free
	 *  `/documents/{slug}` URLs address (docs/decisions.md #2's URL
	 *  convention, extended to documents). */
	slug: string;
	/** Publishing family (`vatii`, `encyclical`, future `apost-exhort`/
	 *  `apost-const`/`cdf`, docs/corpus-schema.md §Documents) — carried for
	 *  grouping/future per-family styling, not otherwise interpreted here. */
	family: string;
	/** This document's manifest per bare language it's available in. */
	manifests: Partial<Record<string, DocumentManifest>>;
}

const DOCUMENT_WORK_ID_RE = /^([a-z0-9-]+)\.([a-z0-9-]+)\.([a-z]{2,3})$/;

function parseDocumentWorkId(
	workId: string
): { family: string; slug: string; lang: string } | undefined {
	const m = DOCUMENT_WORK_ID_RE.exec(workId);
	return m ? { family: m[1], slug: m[2], lang: m[3] } : undefined;
}

/** Computed once at module load, same reasoning as `canonicalBooksByOsis`
 *  above: re-grouping ~450 document works (16 Vatican II + ~430 encyclicals
 *  and counting) on every `listDocuments()`/`getDocumentGroup()` call would
 *  be wasted work for something that never changes at runtime. */
const documentGroupsBySlug: Map<string, DocumentGroup> = (() => {
	const out = new Map<string, DocumentGroup>();
	// Sorted for determinism, same reasoning as `canonicalBooksByOsis`.
	const works = [...listWorksOfType('document')].sort((a, b) => a.id.localeCompare(b.id));
	for (const work of works) {
		const parsed = parseDocumentWorkId(work.id);
		if (!parsed) continue; // malformed work id -- skip rather than guess at its grouping
		let group = out.get(parsed.slug);
		if (!group) {
			group = { slug: parsed.slug, family: parsed.family, manifests: {} };
			out.set(parsed.slug, group);
		}
		group.manifests[parsed.lang] = work as DocumentManifest;
	}
	return out;
})();

/** All documents in this corpus, one entry per {family, slug} regardless of
 *  how many languages it has — the granularity the `/documents` library and
 *  the home page's Magisterium group both want (docs/corpus-schema.md
 *  §Documents). */
export function listDocuments(): DocumentGroup[] {
	return [...documentGroupsBySlug.values()];
}

export function getDocumentGroup(slug: string): DocumentGroup | undefined {
	return documentGroupsBySlug.get(slug);
}

/**
 * Preferred work id for a document slug at a UI language — same "content
 * language follows UI language by default" rule as `defaultWorkId`
 * (docs/decisions.md #1), scoped to one document's own editions rather than
 * a whole work type's edition list (see `DocumentGroup`'s docblock on why
 * documents need their own version of this instead of reusing
 * `defaultWorkId('document', lang)`, which would only tell you *a* document
 * exists in that language, not which one).
 */
/**
 * The edition of `slug` a reader of `lang` should get.
 *
 * Goes through `editionInLang` rather than falling straight from "no edition
 * in your language" to "the first one in the object". That shortcut was
 * invisible while every document had at most an English and a Portuguese
 * edition and every reader read one of the two. It stopped being invisible on
 * 2026-08-24, when the interface gained seven more languages: a German reader
 * opening Rerum Novarum matches neither edition, and which one they landed on
 * was decided by insertion order — the same "should not be a property of how
 * work ids happen to alphabetize" this module already rejects for the Summa.
 * English first, then Latin, then anything, is the answer stated once in
 * `CONTENT_LANG_FALLBACK` and now used here too.
 */
export function defaultDocumentWorkId(slug: string, lang: string): string | undefined {
	const group = getDocumentGroup(slug);
	if (!group) return undefined;
	const editions = Object.values(group.manifests).filter((m) => m !== undefined);
	return (editionInLang(editions, lang) ?? editions[0])?.id;
}

export function getDocumentManifest(workId: string): DocumentManifest | undefined {
	const manifest = manifests[workId];
	return manifest?.type === 'document' ? manifest : undefined;
}

// --- Documents: structure trees (index-backed, sync) ------------------------
//
// Reuses `breadcrumbIn`/`flattenTree` — the same walkers the CCC/Compendium
// section above shares — rather than a third copy, per this module's own
// "Structure trees (shared: CCC and Compendium)" docblock; a document's
// `structure.json` is the identical `StructureNode` shape (docs/corpus-
// schema.md §Documents: "reuse the Catechism/Compendium node schema
// verbatim"), just addressing SECTION numbers via `.paragraphs` instead of
// CCC paragraphs or Compendium questions.

export function getDocumentStructure(workId: string): DocumentNode[] {
	return documentStructures[workId] ?? [];
}

/**
 * Document structure is already flat and in document order
 * (`docs/corpus-schema.md`, amended 2026-08-21), so unlike the CCC/Compendium
 * this does not walk a tree: `depth` is just `level - 1`. Kept returning the
 * same `{ node, depth }` row shape its callers already render.
 */
export function flattenDocumentStructure(
	workId: string
): { node: DocumentNode; depth: number; anchor: string }[] {
	return getDocumentStructure(workId).map((node, i) => ({
		node,
		depth: node.level - 1,
		// The id the route puts on this heading, and the fragment the sidebar
		// row for it links to. Index into the one flat corpus array, so both
		// sides are addressing the same heading by construction.
		anchor: documentHeadingAnchor(i)
	}));
}

/** The in-page id for the heading at index `i` of a document's flat
 *  structure. One function so the route that renders the id and the outline
 *  that links to it cannot drift apart. */
export function documentHeadingAnchor(i: number): string {
	return `h${i}`;
}

/**
 * The document outline as a NESTED tree with derived ranges, for the shared
 * sidebar TOC — which walks `children` and reads `paragraphs`, and is also
 * serving the CCC and Compendium, whose node shape has not changed.
 *
 * This is the derivation `docs/corpus-schema.md` specifies rather than a
 * compatibility shim: a heading owns sections from its own anchor until the
 * next heading of equal or shallower `level`, and nesting follows `level`
 * directly. Deriving it here, once, is the point of not storing it — the
 * stored ranges were what drifted from the text.
 *
 * `kind` is reported as `sub` throughout because a document node no longer
 * claims one; the sidebar uses it only for a CSS hook, and indents from tree
 * position.
 */
export function documentOutline(workId: string): StructureNode[] {
	const sectionNs = documentSectionNumbers[workId] ?? [];
	return buildDocumentOutline(
		getDocumentStructure(workId),
		sectionNs.length > 0 ? sectionNs[sectionNs.length - 1] : null
	);
}

/** `documentOutline`'s derivation, split out so it is testable without a
 *  corpus: documents have no fixtures, so `documentStructures` is `{}` under
 *  vitest and the workId-taking wrapper can never exercise this. */
/**
 * The position a TAIL row occupies, past the document's last real section.
 *
 * A heading that anchors no numbered section has no `before`, so its outline
 * node's `paragraphs` range is `[null, null]` — and `rowState` keys entirely
 * off that range, which is why the sidebar could never mark such a row as the
 * one being read even once the body rendered it. These sentinels sit strictly
 * above every real section number, so they collide with nothing and the scroll
 * spy, the outline and the row-state machinery all keep speaking one language.
 *
 * Positional, not an address: nothing citable is derived from it, and it never
 * reaches the corpus or a URL — the row still links by its `#h{i}` anchor.
 */
export function documentTailNumber(lastN: number | null, tailIndex: number): number {
	return (lastN ?? 0) + tailIndex + 1;
}

export function buildDocumentOutline(rows: DocumentNode[], lastN: number | null): StructureNode[] {
	let lastAnchored = -1;
	rows.forEach((row, i) => {
		if (row.before !== null && row.before !== undefined) lastAnchored = i;
	});
	let tailIndex = -1;
	const nodes: StructureNode[] = rows.map((row, i) => {
		// Ends just before the next heading at this level or shallower; if
		// none follows, it runs to the document's last section.
		let end: number | null = lastN;
		for (let j = i + 1; j < rows.length; j++) {
			// A heading anchored to the SAME section is the same heading
			// printed on more than one line, not a boundary. Magnifica
			// Humanitas prints "CHAPTER THREE", "TECHNOLOGY AND DOMINANCE."
			// and "THE GRANDEUR OF HUMANITY..." as three lines all standing
			// before section 90; treating the second as the first's end
			// yields the inverted range [90, 89].
			if (rows[j].before !== null && rows[j].before === row.before) continue;
			if (rows[j].level <= row.level) {
				const nextStart = rows[j].before;
				end = nextStart === null ? end : nextStart - 1;
				break;
			}
		}
		const isTail = i > lastAnchored && (row.before === null || row.before === undefined);
		if (isTail) tailIndex += 1;
		const start = isTail ? documentTailNumber(lastN, tailIndex) : row.before;
		return {
			kind: 'sub',
			n: null,
			title: row.title,
			paragraphs: isTail ? [start, start] : [start, start === null ? null : end],
			children: [],
			// Same index, same id as the heading the document route renders
			// (`flattenDocumentStructure`), so a TOC row navigates to the
			// heading it names instead of to the section behind it.
			anchor: documentHeadingAnchor(i),
			label: row.label,
			titleHtml: row.title_html
		} as StructureNode;
	});

	const roots: StructureNode[] = [];
	const stack: { level: number; node: StructureNode }[] = [];
	rows.forEach((row, i) => {
		while (stack.length > 0 && stack[stack.length - 1].level >= row.level) stack.pop();
		if (stack.length === 0) roots.push(nodes[i]);
		else stack[stack.length - 1].node.children.push(nodes[i]);
		stack.push({ level: row.level, node: nodes[i] });
	});
	return roots;
}

const documentSectionNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(documentSectionNumbers).map(([workId, ns]) => [workId, new Set(ns)])
);

/** Whether section `n` exists in this corpus for `workId` — index-backed
 *  (no fetch), same role as `cccParagraphExists`. */
export function documentSectionExists(workId: string, n: number): boolean {
	return documentSectionNumberSets[workId]?.has(n) ?? false;
}

/**
 * Whether `workId` has ANY sections built at all — index-backed (no fetch),
 * so a caller can tell a withheld/never-built edition (an entry in
 * `DocumentGroup.manifests` whose `sections.json` `sync-corpus.mjs` never
 * wrote — site/unpublished.json, or a v1 EN/PT asymmetry) apart from a real
 * one WITHOUT paying for `getDocumentSectionsAsync`'s whole-file read just to
 * find out. `documents/[slug]/+page.ts` uses this to pick which
 * language's sections to embed without fetching every language's file first.
 */
export function documentHasSections(workId: string): boolean {
	return (documentSectionNumberSets[workId]?.size ?? 0) > 0;
}

/** Whether `workId` has any READABLE text — numbered or not.
 *
 *  Distinct from `documentHasSections`, and the distinction is the whole
 *  point: eight editions in this corpus print no paragraph number anywhere,
 *  so they have no sections and their entire text is unnumbered units. Gating
 *  the reader on section COUNT sent every one of them to the redirect that
 *  exists for works we genuinely cannot show. Callers deciding whether a
 *  reader can be offered this edition want this; callers resolving a `§n`
 *  address still want `documentHasSections`. */
export function documentHasText(workId: string): boolean {
	return documentHasSections(workId) || documentAppendixUnits(workId) > 0;
}

// --- Documents: content tier (async, read/fetched, memoized, chunked) ------
//
// Chunked by section, like the CCC is by paragraph (`DOCUMENT_CHUNK_SIZE` in
// `scripts/sync-corpus.mjs` argues the stride). These files are also SHIPPED
// THIN: `text_marked` and the section's `text` are dropped at sync time
// because both are derivable from `html`, so anything here that wants plain
// text derives it (`sectionText` below) rather than reading a stored copy.
// The corpus on disk keeps all three — see `thinDocumentSections`.
//
// No fixture branch: documents have no hand-authored fixtures yet (unlike
// the Bible/CCC/Compendium, which all ship a `src/lib/fixtures/` copy) —
// `documentStructures`/`documentSectionNumbers` are already `{}` under
// vitest/no-corpus (see `corpus-index.ts`), so `documentSectionExists`
// always answers false there and this never gets called under a fixture
// run. Returning `[]` rather than throwing keeps that graceful if a test
// ever does call it directly.

/** The one chunk section `n` lives in. Each chunk memoizes independently in
 *  `readContent`, so a reader who opens the document after following a
 *  preview re-fetches only the chunks the preview did not already pull. */
async function fetchDocumentChunk(workId: string, n: number): Promise<DocumentSection[]> {
	return fetchTier([], documentChunkLocation(workId, n), []);
}

/** Every chunk, concatenated in section order — the whole-document read.
 *  Ordered by `documentChunkLocations`, so no re-sort is needed. */
/** A document's unnumbered matter, or `[]` when it has none.
 *
 *  Not folded into `getDocumentSectionsAsync`: a section has a number and this
 *  does not, and merging the two would put a unit with no address into a list
 *  every caller indexes by `n`. */
export async function getDocumentAppendixAsync(workId: string): Promise<DocumentAppendixUnit[]> {
	if (!USE_REAL_CORPUS) return [];
	const location = documentAppendixLocation(workId);
	if (!location) return [];
	return readContent<DocumentAppendixUnit[]>(location);
}

async function fetchDocumentSections(workId: string): Promise<DocumentSection[]> {
	if (!USE_REAL_CORPUS) return [];
	const chunks = await Promise.all(
		documentChunkLocations(workId).map((location) => readContent<DocumentSection[]>(location))
	);
	return chunks.flat();
}

export async function getDocumentSectionAsync(
	workId: string,
	n: number
): Promise<DocumentSection | undefined> {
	if (!documentSectionExists(workId, n)) return undefined;
	// COARSE FETCH, NARROW RETURN (this module's docblock) — one chunk, not
	// the whole document. This is the path a hover link preview takes, and
	// before documents were chunked it pulled an entire encyclical (up to
	// 827 KB raw) to render one paragraph.
	const chunk = await fetchDocumentChunk(workId, n);
	return chunk.find((s) => s.n === n);
}

/**
 * Every section of a document, in corpus order — the whole-document
 * counterpart to `getDocumentSectionAsync`'s one-at-a-time lookup, for the
 * continuous "read the full document" view (`documents/[slug]`).
 * `fetchDocumentSections` already reads and memoizes the sections file
 * whole (a document ships ONE file per work, unlike the CCC's per-chapter
 * chunking — see this section's docblock), so this is a thin export rather
 * than a new fetch path: calling it after/before `getDocumentSectionAsync`
 * for the same work never costs a second read.
 *
 * Returns `[]` for a work with nothing built for it — an unknown work id, or
 * a withheld edition, whose `sections.json` `sync-corpus.mjs` never wrote
 * (site/unpublished.json) — rather than throwing, same posture as
 * `fetchDocumentSections` itself and as `getDocumentSectionAsync` above.
 */
export async function getDocumentSectionsAsync(workId: string): Promise<DocumentSection[]> {
	return fetchDocumentSections(workId);
}

/**
 * A section's plain text, derived from its blocks.
 *
 * The corpus stores `html` and nothing derived from it (docs/corpus-schema.md,
 * amended 2026-08-22), so there is no stored `text` to read and no branch on
 * whether one is present. This IS the definition: blocks joined by a single
 * space, footnote markers contributing nothing, whitespace collapsed —
 * mirroring `Section.resolve` in `vatican_docs.py`, which derives the same
 * string in the same way for the round-trip check.
 *
 * `text_marked` is the fallback for a CCC/Compendium block, which has no
 * `html` yet; a document block always takes the first branch.
 *
 * Derived per call rather than cached: the only caller is the link-preview
 * excerpt, which needs one section and truncates it immediately, so caching
 * whole-document text would cost more than it saves.
 */
export function documentSectionText(section: DocumentSection): string {
	return section.blocks
		.map((block) =>
			block.html ? inlineText(parseInlineHtml(block.html)) : (block.text_marked ?? '')
		)
		.join(' ')
		.replace(/⟦[^⟧]*⟧/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

// --- Prayers: index-backed (structure, metadata, existence, adjacency, sync) --
//
// docs/corpus-schema.md §Prayers: one canonical collection per language
// (`prayer.common.{lang}`) -- modeled on the Compendium section above, not
// the Documents one, per this task's own brief. The one real difference
// from the Compendium: prayers address by `slug`, never by a number, so
// there is no `breadcrumbIn`/`flattenTree` walk here (`structure.json`'s
// ranges are `[null, null]` throughout -- nothing numeric to walk into) and
// no `StructureSidebarToc` reuse either (that component keys `hrefFor`/
// `rowState` on a numeric range every prayer section lacks). `/prayers`
// instead gets a flat, two-level grouping (`listPrayerGroups`) built by
// matching `structure.json`'s section children to `PrayerMeta` by TITLE --
// verified against the real corpus (both languages) to print in identical
// order, so this is a safe, self-checking join: a title that doesn't match
// anything is silently dropped rather than mis-paired, never a crash.

/** Language tags the prayer collection is available in -- FULL tags, so
 *  `en-gb` is one of them and is not the same entry as `en`. */
export function prayerLangs(): string[] {
	return Object.keys(prayerStructures).sort();
}

/**
 * Which edition the prayer INDEX runs on for a reader who prefers `tag` — the
 * collection's shape, its section headings, its order and its prev/next
 * chain — as distinct from the edition any one prayer's TEXT resolves to.
 *
 * THE TWO DIFFER FOR A REGIONAL EDITION AND ONLY FOR ONE. `prayer.common.en-gb`
 * is the five prayers the source heads "UK VERSION" and nothing else
 * (docs/decisions.md §Addresses and editions), so indexing off it would present the
 * collection as five prayers and a reader who prefers English (UK) would lose
 * the other twenty-three from the listing, the sidebar and the prev/next
 * chain — none of which they have lost: they read those from
 * `prayer.common.en`, resolved per address by `resolveEditionTag`. This is
 * the Summa's rule (an address, not a work, picks the edition) reached from
 * the other side.
 *
 * COMPLETENESS IS MEASURED WITHIN A BASE LANGUAGE, and that is the whole of
 * why `prayer.common.la` keeps indexing itself. Latin prints 21 of the 28
 * because the source prints no Latin for the other seven — content that is
 * genuinely ABSENT, which is what the fallback chain is for, and a Latin
 * reader's index honestly showing 21 Latin titles is right. English (UK)'s
 * missing 23 are not absent; they are printed once, under "English", by the
 * very edition this function falls back to. Measuring each edition against
 * the fullest one in its OWN language is what tells those two situations
 * apart without naming either work.
 */
export function prayerIndexLang(tag: string): string {
	const langs = prayerLangs();
	const sizes = Object.fromEntries(langs.map((l) => [l, prayerMetasByLang[l]?.length ?? 0]));
	return resolveEditionTag(completeEditionTags(sizes), tag) ?? langs[0] ?? '';
}

/**
 * Of `sizes` (language tag -> how many units that edition carries), the tags
 * that carry as many as the fullest edition IN THEIR OWN BASE LANGUAGE.
 *
 * Split out from `prayerIndexLang` only so the rule can be tested: everything
 * above it reads the corpus index, which the unit tests deliberately do not
 * have (`corpus.ts`'s prayer tier is empty under vitest). The reasoning for
 * measuring per base language rather than globally is that function's.
 */
export function completeEditionTags(sizes: Record<string, number>): string[] {
	const fullest = new Map<string, number>();
	for (const [tag, size] of Object.entries(sizes)) {
		fullest.set(baseLang(tag), Math.max(fullest.get(baseLang(tag)) ?? 0, size));
	}
	return Object.keys(sizes).filter((tag) => sizes[tag] === fullest.get(baseLang(tag)));
}

/**
 * The prayer editions a reader can actually CHOOSE at the address in view —
 * the edition menu's list on `/preces` and `/preces/{slug}`.
 *
 * IT IS NOT `listEditions('prayer')`, and that is the whole reason this
 * exists. `prayer.common.en-gb` is five prayers (docs/decisions.md §Addresses
 * and editions), so listing every prayer edition unconditionally put "English
 * (UK)" in the menu on all twenty-eight pages — an option that on twenty-three
 * of them named an edition with no text at this address, resolved straight
 * back to `prayer.common.en` through `resolveEditionTag`, and left the trigger
 * announcing a wording the page was not printing. A menu row that changes
 * nothing is worse than an absent one: it reads as a claim that a second
 * English wording of the Our Father exists.
 *
 * So the list is address-scoped, the same way the TEXT already was:
 *
 * - at a prayer (`slug` given), the editions that hold that slug — which is
 *   `en`/`pt`/`la` for most, plus `en-gb` for the five the source prints
 *   twice, minus `la` for the seven the source prints no Latin for;
 * - at the collection index (no `slug`), the editions that can enumerate it,
 *   which is exactly `prayerIndexLang`'s own set (`completeEditionTags`) —
 *   the index runs on `en` for a reader who prefers English (UK), and the
 *   menu should say so rather than offer a choice the listing overrules.
 *
 * Sorted like `listEditions`, so the menu order does not depend on which
 * branch produced the tags.
 */
export function listPrayerEditions(slug?: string): WorkManifest[] {
	const sizes = Object.fromEntries(
		prayerLangs().map((l) => [l, prayerMetasByLang[l]?.length ?? 0])
	);
	const tags = slug
		? prayerLangs().filter((l) => prayerExists(l, slug))
		: completeEditionTags(sizes);
	const editions = listEditions('prayer');
	return editions.filter((w) => tags.some((tag) => tag.toLowerCase() === w.language.toLowerCase()));
}

/**
 * Which prayer edition is actually being RENDERED at the address in view, for
 * the menu's trigger and its checkmark.
 *
 * `content.workIdFor('prayer')` answers what the reader PREFERS, which is the
 * right answer everywhere else on the site because every other type's editions
 * all hold every address. Prayers do not, so the preference and the page come
 * apart on twenty-three of twenty-eight pages, and the trigger was reporting
 * the preference. This applies the same `resolveEditionTag` the route itself
 * applies to `byLang`, over the same list the menu offers.
 */
export function currentPrayerEditionId(preferredTag: string, slug?: string): string | undefined {
	const editions = listPrayerEditions(slug);
	const tag = resolveEditionTag(
		editions.map((w) => w.language),
		preferredTag
	);
	return editions.find((w) => w.language.toLowerCase() === tag?.toLowerCase())?.id;
}

export function getPrayerStructure(lang: string): StructureNode[] {
	return prayerStructures[lang] ?? [];
}

/** Every prayer's metadata for `lang`, in PRINT order (`n`) -- the order
 *  `/prayers`' groups and the prev/next nav both want. Index-backed, no
 *  fetch: this is existence/metadata, never `blocks`/`latin`/`groups`
 *  themselves (see `PrayerMeta`'s docblock in corpus-index.ts). */
export function listPrayerMeta(lang: string): PrayerMeta[] {
	return [...(prayerMetasByLang[lang] ?? [])].sort((a, b) => a.n - b.n);
}

export function getPrayerMeta(lang: string, slug: string): PrayerMeta | undefined {
	return prayerMetasByLang[lang]?.find((p) => p.slug === slug);
}

/** Whether `slug` exists in this corpus for `lang` -- index-backed (no
 *  fetch), same role as `cccParagraphExists`/`documentSectionExists`. */
export function prayerExists(lang: string, slug: string): boolean {
	return getPrayerMeta(lang, slug) !== undefined;
}

/** The prayer immediately before/after `slug` in PRINT order, or undefined
 *  at either end. `n` is ordering-only (see `Prayer.n`'s docblock), which is
 *  exactly the role it plays here -- this never addresses by it, only walks
 *  it. */
export function getAdjacentPrayer(
	lang: string,
	slug: string,
	direction: 'prev' | 'next'
): PrayerMeta | undefined {
	const metas = listPrayerMeta(lang);
	const idx = metas.findIndex((p) => p.slug === slug);
	if (idx === -1) return undefined;
	return direction === 'next' ? metas[idx + 1] : metas[idx - 1];
}

/** One `/prayers` listing group -- `structure.json`'s section title, plus
 *  the prayers matched into it (see this section's docblock for how the
 *  match is made). `id` is a stable anchor id derived from the title, computed
 *  once here so `/prayers` and the home page's Prayers section link to the
 *  IDENTICAL anchor without deriving the same string twice in two files --
 *  presentation, not addressing (the id that actually ADDRESSES a prayer is
 *  `PrayerMeta.slug`, per-item, never per-group). */
export interface PrayerGroupSummary {
	id: string;
	title: string;
	prayers: PrayerMeta[];
}

function prayerGroupAnchorId(title: string): string {
	return (
		'prayers-' +
		title
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // strip accents, so a future PT-translated section title still yields a plain ASCII anchor
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
	);
}

/** Groups the 28 prayers into `structure.json`'s seven titled sections, for
 *  `/prayers`' listing and the home page's compact Prayers section. A
 *  structure child whose title doesn't match any `PrayerMeta` (a future
 *  corpus regen breaking the print-order/title correspondence this join
 *  relies on) is dropped from its group rather than crashing the page --
 *  the same "degrade, don't assume the parallel holds" posture
 *  `routes/+page.svelte`'s CCC/Compendium pairing already takes. */
export function listPrayerGroups(lang: string): PrayerGroupSummary[] {
	const metaByTitle = new Map(listPrayerMeta(lang).map((m) => [m.title, m]));
	return getPrayerStructure(lang).map((section) => ({
		id: prayerGroupAnchorId(section.title),
		title: section.title,
		prayers: section.children
			.map((child) => metaByTitle.get(child.title))
			.filter((m): m is PrayerMeta => m !== undefined)
	}));
}

// --- Prayers: content tier (async, read/fetched, memoized, whole) ---------
//
// Kept whole per language, like the Compendium (~40 KB raw per language in
// the real corpus -- see `scripts/sync-corpus.mjs`'s docblock).
//
// No fixture branch, same posture as documents: prayers have no hand-
// authored fixtures yet, so `prayerStructures`/`prayerMetasByLang` are
// already `{}` under vitest/no-corpus (corpus-index.ts), meaning
// `prayerExists` always answers false there and `getPrayerAsync` never
// reaches a real fetch in a test run. Returning `undefined`/`[]` rather than
// throwing keeps that graceful if a test ever does call this directly.

async function fetchPrayers(lang: string): Promise<Prayer[]> {
	return fetchTier([], prayerContentLocation(`prayer.common.${lang}`), []);
}

export async function getPrayerAsync(lang: string, slug: string): Promise<Prayer | undefined> {
	if (!prayerExists(lang, slug)) return undefined;
	const prayers = await fetchPrayers(lang);
	return prayers.find((p) => p.slug === slug);
}

// --- Summa: index tier (sync) ---------------------------------------------
//
// Addressed by (part, question, article), which is three levels rather than
// the CCC's one, and the question number RESTARTS in each part -- so nothing
// here takes a bare number the way `cccParagraphExists` can. An article is a
// FRAGMENT on its question's page (`/summa/ii-ii/184#a3`), not a page of its
// own: 3,113 articles would be 3,113 addresses for one article of text each,
// which is the trade documents already made and reversed (docs/decisions.md
// §The site).

export function summaLangs(): string[] {
	return Object.keys(summaStructures).sort();
}

export function getSummaStructure(lang: string): SummaNode[] {
	return summaStructures[lang] ?? [];
}

/**
 * The work id a reader of `lang` should read the Summa in: their own
 * language, else English, else Latin (`editionInLang`). Distinct from
 * `defaultWorkId('summa', lang)` only in that it cannot fall through to "any
 * edition at all" -- with two editions and a stated chain there is nothing
 * left for that to mean.
 */
export function defaultSummaWorkId(lang: string): string | undefined {
	return editionInLang(listEditions('summa'), lang)?.id;
}

export function listSummaQuestions(lang: string): SummaQuestionMeta[] {
	return summaQuestionMetas[lang] ?? [];
}

function summaQuestionMeta(lang: string, part: string, n: number): SummaQuestionMeta | undefined {
	return listSummaQuestions(lang).find((q) => q.part === part && q.n === n);
}

/** Does this address exist in ANY edition? The question a route asks. */
export function summaQuestionExists(part: string, n: number): boolean {
	return summaLangs().some((lang) => summaQuestionMeta(lang, part, n) !== undefined);
}

/**
 * The first edition that HAS `(part, n)`, following the reader's fallback
 * chain. This is what a citation link resolves against, and why it is not
 * simply `defaultSummaWorkId`: the Latin has no Supplement, so a reference to
 * `Suppl q. 77` must reach English even for a reader whose chain would
 * otherwise have picked Latin -- and, symmetrically, a Latin-preferring
 * reader keeps Latin everywhere it exists.
 */
export function summaWorkIdFor(lang: string, part: string, n: number): string | undefined {
	for (const edition of orderedSummaEditions(lang)) {
		const editionLang = baseLang(edition.language);
		if (summaQuestionMeta(editionLang, part, n)) return edition.id;
	}
	return undefined;
}

/** The reader's editions in preference order: their own, then the chain. */
function orderedSummaEditions(lang: string): WorkManifest[] {
	const editions = listEditions('summa');
	const preferred = editionInLang(editions, lang);
	return preferred ? [preferred, ...editions.filter((w) => w.id !== preferred.id)] : editions;
}

/**
 * A question's title, borrowed from another edition when the one being read
 * prints none.
 *
 * THE LATIN PRINTS NO TITLES AT ALL, and that is the Leonine text's own
 * shape rather than a gap in the capture: the Corpus Thomisticum heads each
 * question `Quaestio 1` and states its subject inside the prooemium prose
 * instead. Rendering that verbatim gives a Latin reader a table of contents
 * that is a column of bare numbers -- faithful, and useless for finding
 * anything.
 *
 * So the title is borrowed, and `borrowed` is returned alongside it rather
 * than hidden, because a borrowed title is a claim about the ADDRESS and not
 * about the text: `II-II q. 184` is "Of the State of Perfection in General"
 * in whatever language you read it. Every caller marks it as the other
 * edition's -- `lang` on the element, a muted treatment, a tooltip naming
 * the edition -- which is what keeps this an aid to navigation rather than a
 * quiet assertion that this source says something it does not.
 *
 * `undefined` only when no edition has a title for the address at all.
 */
export function summaTitleFor(
	lang: string,
	part: string,
	n: number
): { title: string; lang: string; borrowed: boolean } | undefined {
	const own = summaQuestionMeta(lang, part, n);
	if (own?.title) return { title: own.title, lang, borrowed: false };
	for (const edition of orderedSummaEditions(lang)) {
		const editionLang = baseLang(edition.language);
		const title = summaQuestionMeta(editionLang, part, n)?.title;
		if (title) return { title, lang: editionLang, borrowed: true };
	}
	return undefined;
}

/** Does `(part, n, article)` exist in any edition? Validates a `#a{n}` anchor. */
export function summaArticleExists(part: string, n: number, article: number): boolean {
	return summaLangs().some((lang) => summaQuestionMeta(lang, part, n)?.articles.includes(article));
}

/** Headings that apply to one part, in document order — that part's TOC. */
export function summaHeadingsForPart(lang: string, part: string): SummaNode[] {
	return getSummaStructure(lang).filter((row) => row.part === part);
}

/**
 * The Summa's outline for one part, as the SAME `StructureNode` tree every
 * other reader's sidebar walks.
 *
 * WHY THIS REPLACES A BESPOKE COMPONENT. `summaToc.ts` and
 * `SummaSidebarToc.svelte` existed on the argument that the Summa's
 * `SummaNode` is "a FLAT list of `{ level, part, title, before }`" and that
 * reshaping it into a tree "would mean inventing bounds (`paragraphs`) and
 * kinds the corpus does not carry". That argument does not survive contact
 * with `DocumentNode`, which is the SAME SHAPE minus `part` — and which
 * `buildDocumentOutline` reshapes in exactly that way, deriving each
 * heading's range from where the next heading of equal or shallower level
 * begins. Far from being fabrication, that derivation is the documented
 * convention for this node shape: `docs/corpus-schema.md` says the Summa's
 * `structure.json` is "FLAT and document-ordered, like the documents' and
 * for the same reason", and `types.ts` states the rule — "a heading owns
 * sections from its anchor until the next heading of equal or shallower
 * `level`. Storing ranges is what let them drift from the text."
 * `summaTocGroups` was already performing the same derivation ("a treatise
 * runs from its own `before` up to the next heading's"); it just stopped at
 * one level and returned a bespoke type. So the divergence was accidental,
 * and this is it removed.
 *
 * THE THREE THINGS THAT ARE GENUINELY THE SUMMA'S, and none of them a fork:
 *
 *  - **`part`.** Question numbers restart at 1 in every part, so an outline
 *    is built per part and `lastN` is that part's own last question. A
 *    parameter, not a different algorithm.
 *  - **The Latin edition prints no treatise headings at all** — the Corpus
 *    Thomisticum publishes the four part headings and nothing below them —
 *    so `headings` arrives empty and every question lands at the top level.
 *    That falls out of the same builder as correct degradation; borrowing
 *    the English edition's treatise names to organise Latin text would
 *    assert a structure that source does not print.
 *  - **A question's title may be borrowed from another edition**, which is
 *    the normal case under Latin. `titleLang` carries that so the row can
 *    say so, rather than passing another edition's words off as this one's.
 *
 * ARTICLES ARE FRAGMENTS, NOT ROUTES, and they say so with null bounds plus
 * an `anchor`: an article is genuinely not addressed by a question number,
 * and `/summa/ii-ii/184#a3` is the address that reaches it. They hang under
 * their own question, so the shared component's "only the reader's own
 * branch expands" rule already shows them for the question being read and
 * for no other — the same rule the bespoke component implemented by hand.
 */
export function summaOutline(
	lang: string,
	part: string,
	currentN?: number,
	articles: number[] = []
): StructureNode[] {
	const questions = listSummaQuestions(lang).filter((q) => q.part === part);
	if (questions.length === 0) return [];
	const lastN = questions[questions.length - 1].n;

	const questionNode = (meta: { n: number }): StructureNode => {
		const named = summaTitleFor(lang, part, meta.n);
		const kids: StructureNode[] =
			meta.n === currentN
				? articles.map((a) => ({
						kind: 'sub',
						n: a,
						title: String(a),
						// Null bounds: an article is not addressed by a question
						// number. `anchor` is what addresses it, and the shared
						// row renders that as an in-page link.
						paragraphs: [null, null],
						children: [],
						anchor: `a${a}`
					}))
				: [];
		return {
			kind: 'sub',
			n: meta.n,
			title: named ? summaQuestionLabel(named.title) : '',
			paragraphs: [meta.n, meta.n],
			children: kids,
			titleLang: named?.borrowed ? named.lang : undefined
		};
	};

	// `level > 1` drops the PART heading itself ("FIRST PART"): this outline
	// is already scoped to one part, and a single root containing everything
	// is a row that says nothing and costs a level of indent.
	const headings = summaHeadingsForPart(lang, part).filter(
		(row) => row.level > 1 && row.before !== null
	);
	if (headings.length === 0) return questions.map(questionNode);

	// One treatise runs from its own `before` to just before the next
	// heading's -- `buildDocumentOutline`'s rule, applied to the same shape.
	const treatises: StructureNode[] = headings.map((row, i) => {
		const from = row.before as number;
		const to = i + 1 < headings.length ? (headings[i + 1].before as number) - 1 : lastN;
		return {
			kind: 'section',
			n: null,
			title: summaHeadingTitle(row.title),
			paragraphs: [from, to],
			children: questions.filter((q) => q.n >= from && q.n <= to).map(questionNode)
		};
	});

	// Questions ahead of the first heading keep their place at the top level
	// rather than being swallowed into it -- the sidebar is a view of the
	// source's own outline, and a row it cannot place is not a row to drop.
	const leading = questions.filter((q) => q.n < (headings[0].before as number));
	return [...leading.map(questionNode), ...treatises];
}

// --- Summa: content tier (async, one file per question) -------------------

export async function getSummaQuestionAsync(
	workId: string,
	part: string,
	n: number
): Promise<SummaQuestion | undefined> {
	const lang = workId.slice('summa.'.length);
	const fixture = (fixtureSummaQuestionsByLang[lang] ?? []).find(
		(q) => q.part === part && q.n === n
	);
	return fetchTier(fixture, summaQuestionLocation(workId, summaPartSlug(part), n), undefined);
}

/**
 * Plain text of a run of divisions, for an excerpt. Derived the same way
 * `documentSectionText` derives a section's -- blocks walked through
 * `parseInlineHtml` rather than regex-stripped, so the narrowed-HTML
 * allowlist stays the one place that knows what markup the corpus carries.
 *
 * Per call rather than cached, and for the same reason: its only caller is
 * the bookmark library's excerpt, which truncates immediately.
 */
export function summaDivisionsText(divisions: SummaDivision[]): string {
	return divisions
		.flatMap((division) => division.blocks.map((block) => inlineText(parseInlineHtml(block.html))))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}
