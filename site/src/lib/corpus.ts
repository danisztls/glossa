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
 * then (no server runtime, site/docs/shell.md) so inlining avoided a network
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
 * site/docs/shell.md) no route's `load()` executes on the server
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
	CommentaryChapter,
	CommentaryNote,
	PrayerCommentary,
	CompendiumQuestion,
	DocumentManifest,
	CccAbbreviation,
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
import { condensingRun, reverseCondensation } from './condensation';
// Imported rather than re-exported straight through, because this module's own
// `flattenDocumentStructure`/`documentOutline` call it; the `export` that makes
// it public again is beside those, in the Documents section.
import {
	getDocumentHeader,
	getDocumentStructure,
	loadDocumentStructure
} from './document-structures.svelte';
// `baseLang` and `languageDisplayName` live in `lang-names.ts` since
// 2026-09-04 and are re-exported here, where the whole app already reaches for
// them. See that file for why they had to leave: the sync could not import
// this module to check them, so nothing checked them.
import { baseLang, languageDisplayName } from './lang-names';
export { baseLang, languageDisplayName };
import { summaPartSlug } from './route-manifest';
import { summaHeadingTitle, summaQuestionLabel } from './summa-titles';
import {
	USE_REAL_CORPUS,
	bibleIndex,
	condensationMap,
	bibleIntroBooks,
	ensureContentIndex,
	indexGeneration,
	requireIndex,
	bibleIntroLocation,
	fixtureBibleIntrosByLang,
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
	documentChunkStartFor,
	documentSectionNumbers,
	socialDoctrineAbbreviations,
	socialDoctrineChapterStarts,
	socialDoctrineSectionNumbers,
	canonLawSectionNumbers,
	canonLawUnitStarts,
	fixtureBibleBooks,
	fixtureCccParagraphsByLang,
	fixtureCompendiumQuestionsByLang,
	fixtureSummaQuestionsByLang,
	summaQuestionLocation,
	summaQuestionMetas,
	summaStructures,
	type SummaQuestionMeta,
	bibleChapterLocation,
	commentaryChapters,
	commentaryPrayers,
	manifests,
	translatedDescriptionsLocation,
	documentTagsLocation,
	prayerContentLocation,
	prayerMetasByLang,
	prayerStructures,
	type BibleBookMeta,
	type ContentLocation,
	type PrayerMeta
} from './corpus-index';

export type { PrayerMeta };

export type { BibleBookMeta };
// NOT re-exporting `listContentAssets`: it lives in `corpus-assets.ts` now,
// and a re-export here would pull the whole content inventory back into the
// app bundle, which is the one thing moving it out was for.
export { USE_REAL_CORPUS };

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
 * edition/version selector (site/docs/addresses.md) lists them in. Distinct
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
 * The order a content language is fallen back to when the reader's own has no
 * edition of a work — one row per content language, most preferred first.
 *
 * ENGLISH THEN LATIN ENDS EVERY ROW, and that is the invariant, not a
 * default: English is the language more readers can read and the only one the
 * whole corpus exists in, and Latin is the normative text and always complete
 * where it exists, so a chain that ends in the two of them can always answer.
 * A row that dropped them would strand its readers on whatever
 * `defaultWorkId` shows last-resort. `fallbackTailIsEnglishThenLatin` in the
 * tests asserts it of every row.
 *
 * IT WAS ONE GLOBAL `['en', 'la']` UNTIL 2026-08-26, which stated where a
 * reader ends up and nothing about where they should look first. Every work
 * type used to have an edition in both interface languages, so the question
 * never arose — `defaultWorkId` took "the first edition" and the answer
 * happened to be English because `en` sorts before `la` and `pt`. The Summa
 * broke that (EN + LA, no Portuguese before 2055, docs/decisions.md §Scope)
 * and the Catechism's eight editions made it routine: most readers here now
 * have a language the corpus reaches for some works and not others.
 *
 * WHAT A ROW IS FOR is the reader who cannot have their own language on this
 * address and would rather have a near one than a far one:
 *
 *   - `mg: ['fr', …]` is the row this table was written for. French is
 *     co-official in Madagascar and the language the Church there works in
 *     alongside Malagasy; sending a Malagasy reader to English first was
 *     wrong on the ground, and `mg` has exactly one work (the Catechism), so
 *     it is a reader who falls back constantly.
 *   - `la: ['it', …]` for the same kind of reason pointing the other way:
 *     Italian is the closest living language to the Latin the reader chose
 *     and the Holy See's own working language.
 *   - `es: ['pt', …]` and `pt: ['es', …]`, which is where the fallback buys
 *     the most: Portuguese carries 112 works to Spanish's three, and the two
 *     are close enough to read across.
 *   - `ar: ['fr', …]` and `hu: ['de', …]`: the second language those readers
 *     are likeliest to already have.
 *   - `sk: ['cs', …]`, added 2026-08-31 and the `mg` case again in a different
 *     family. Slovak has ONE work in the corpus, so a Slovak reader falls back
 *     on nearly every address; Czech has fifteen, and Czech is the one
 *     language in Europe a Slovak reader can be assumed to read without
 *     having learned it — a shared state until 1993, and Czech has stayed the
 *     dominant publishing and dubbing language in Slovakia since. The
 *     comprehension is famously ASYMMETRIC, which is why the reverse row does
 *     not exist: Czech readers under forty follow Slovak markedly less well
 *     than the other way round, and `cs: ['sk', …]` would move exactly one
 *     document out of English for them.
 *   - `be: ['pl', …]`, and it is the row here chosen AGAINST the closer
 *     language rather than for it. Byelorussian and Russian are nearly
 *     mutually intelligible and Belarus is thoroughly Russophone, so `ru`
 *     is what a reader-in-general would want — but it moves TWO works out
 *     of English, because Russian's ten are almost a subset of
 *     Byelorussian's thirty-one. Polish moves twenty-eight, and the
 *     readership this table is about is Belarusian CATHOLICS, whose church
 *     is historically and demographically Polish-facing: the Latin-rite
 *     population concentrates around Grodno, and Polish has been its
 *     catechetical language for centuries. A row that buys two documents is
 *     not a claim about a readership, it is a rounding error with an
 *     opinion attached.
 *
 * ONE NEIGHBOUR PER ROW AT MOST, deliberately. A longer row reads as a
 * ranking of languages by how close they are, which is an argument nobody
 * wins and which the corpus cannot settle; one neighbour is a claim about a
 * specific readership, and each of the six above is defensible on its own.
 * The rows that name none are not gaps — a German, Polish, Slovenian,
 * Swedish or Russian reader who cannot have their own language is better
 * served by English than by a language they are being guessed into.
 *
 * SIZE IS A TIEBREAKER AND NEVER THE CRITERION, which is worth stating
 * because the measurement invites the opposite. Ranking every language by how
 * many works a row would move out of English recommends Italian to everybody
 * — it is the second-largest corpus here, so it "wins" for Dutch, Danish,
 * Croatian, Finnish and Hebrew alike, none of whose readers read it. The
 * readership question is asked first and the count only chooses among the
 * languages that survive it. Measured 2026-08-31, the rows move 19, 33,
 * 53, 134, 110, 90, 45, 15 and 28 works respectively; `it: ['es', …]` moves two,
 * and is kept because an Italian reader has 240 works and the row is a
 * rounding error either way.
 *
 * NO ROW UNLOCKS ANYTHING, WHICH IS WHAT MAKES THE READERSHIP TEST DECISIVE.
 * Measured across every candidate weighed on 2026-08-31: not one work a
 * neighbour holds is absent from English or Latin, so a row never decides
 * whether a reader can reach an address — only which language they meet it
 * in. There is no access benefit to weigh against guessing a readership
 * wrong, and that asymmetry is why the bar for a row is a claim someone can
 * defend rather than a number that looks large.
 *
 * NINE CONTENT LANGUAGES DELIBERATELY HAVE NO ROW — `nl`, `da`, `cs`, `hr`,
 * `fi`, `lv`, `sw`, `vi`, `he` and the eight reach languages beside them.
 * Three near-misses are worth recording so they are not re-proposed:
 *
 *   - `da: ['sv', …]` and `fi: ['sv', …]`. Written Danish and Swedish are
 *     close, and Swedish is co-official in Finland. Both fail on the same
 *     fact: Danish and Finnish readers' English is stronger than their
 *     Swedish, and Swedish here is one work — the Compendium.
 *   - `uk: ['ru', …]` and `lv: ['ru', …]`. Both move real work out of English
 *     (10 and 9) and both unlock nothing, per the paragraph above. They are
 *     rejected for DIFFERENT reasons, and only one of them is about politics.
 *     Ukrainian Catholics are overwhelmingly the Greek Catholic Church, which
 *     the Soviet state liquidated in 1946 and forcibly absorbed into the
 *     Moscow Patriarchate until 1989; routing that readership's magisterium
 *     through Russian is not an awkward default but close to the inverse of
 *     what the row would mean. Latvian is the ordinary kind of near-miss:
 *     Latgale is both the Catholic region and the Russian-speaking one, so
 *     the row was true of readers over fifty and is getting less true every
 *     year — Russian left the schools entirely in 2025, Latvian is Baltic and
 *     shares no intelligibility with Russian at all, and `lv` already carries
 *     19 works of its own. A fallback row should encode a durable fact about
 *     a readership; this one has a direction and it points away.
 *   - `nl: ['de', …]`, `vi: ['fr', …]` and `sw: ['fr', …]` are the three that
 *     would also ELECT A DIFFERENT CATECHISM (see below). None survives the
 *     readership test: Dutch readers have the highest English proficiency
 *     measured anywhere, French among Vietnamese Catholics is generational,
 *     and Swahili's readership is split between anglophone East Africa and
 *     francophone Central Africa, so English serves the larger half.
 *
 * A ROW ALSO ELECTS THE CATECHISM, which is the cost that is easy to miss.
 * `ONE_EDITION_AUTOMATIC` fills the first edition in the chain that has one,
 * and `catechismPairLang` renders `/catechismus` in the first chain language
 * carrying either work — so `nl: ['de', …]` would not merely re-rank a
 * fallback, it would give every Dutch reader a German Catechism, downloaded
 * uninvited. Check a proposed row against `ccc.*` and `compendium.*` before
 * arguing it on readership alone: of the candidates weighed on 2026-08-31,
 * every one that changed the elected edition was also one the readership test
 * rejected, and that convergence is luck rather than a rule.
 *
 * KEYED ON CONTENT LANGUAGE (see `ContentLang` in types.ts) — all of them
 * interface languages since the superset flip, and most of them without a row.
 * An unlisted tag gets the tail alone, so a language ingested before its row
 * is written degrades to the old global behaviour rather than to nothing, and
 * `lt`, `sq`, `uk` and `hi` are deliberately left there: each is one work or
 * two, no neighbour of any of them passes the two tests above (Polish is not
 * intelligible to a Lithuanian reader, and Russian for `uk` is not this
 * project's call to make), and English is what the tail already says.
 */
export const CONTENT_LANG_FALLBACK: Readonly<Record<string, readonly string[]>> = {
	en: ['en', 'la'],
	pt: ['es', 'en', 'la'],
	la: ['it', 'en', 'la'],
	de: ['en', 'la'],
	es: ['pt', 'en', 'la'],
	fr: ['it', 'en', 'la'],
	it: ['es', 'en', 'la'],
	mg: ['fr', 'en', 'la'],
	pl: ['en', 'la'],
	ru: ['en', 'la'],
	ar: ['fr', 'en', 'la'],
	hu: ['de', 'en', 'la'],
	ro: ['it', 'en', 'la'],
	sl: ['en', 'la'],
	sv: ['en', 'la'],
	sk: ['cs', 'en', 'la'],
	be: ['pl', 'en', 'la'],
	// THE ONLY PAIR HERE THAT IS ONE LANGUAGE. Every other row names a
	// neighbour a reader can make something of; these two name each other,
	// and a reader of either can read the other with effort, because the
	// difference is the script and not the words. So the pair is mutual,
	// which no other row is — the asymmetry elsewhere is real (a Slovak
	// reader reads Czech far more easily than the reverse is assumed), and
	// here there is none to encode.
	//
	// It is also the cheapest neighbour in the table: `prayer.common.zh` and
	// `prayer.common.zht` are the whole of the corpus in either, so the
	// offline fill's per-language cost (see `contentLangChain` below) is one
	// prayer collection rather than a Compendium.
	zh: ['zht', 'en', 'la'],
	zht: ['zh', 'en', 'la']
};

/** The tail every row ends in, and what an unlisted language falls back to. */
const CONTENT_LANG_FALLBACK_TAIL = ['en', 'la'] as const;

/**
 * Where a reader of `base` looks after their own language.
 *
 * A row names the reader's own language only where it is also part of
 * someone's tail (`en`, `la`); every caller puts the reader's own language
 * first anyway, so the repetition costs nothing and keeps every row ending
 * the same way.
 */
function fallbackFor(base: string): readonly string[] {
	return CONTENT_LANG_FALLBACK[base] ?? CONTENT_LANG_FALLBACK_TAIL;
}

/**
 * A reader's content languages in preference order: their own, then their
 * row, deduped. `editionInLang` walks the same order one edition at a time,
 * so the two cannot disagree about what a reader's languages are.
 *
 * THE OFFLINE FILL TAKES THIS SAME CHAIN, and that is a decision with a
 * price. The download planner's three automatic waves fill per language (see
 * `AUTOMATIC_WAVES` in sw-policy.ts), so a neighbour row is not free there the
 * way it is when resolving one address: a reader whose row names a neighbour
 * pays ~290 KB raw of essentials for it — its Compendium, and its prayers
 * where it has them — before being asked. Nine of the fifteen rows name such
 * a neighbour.
 *
 * IT IS NOT ~3.3 MB, which is what this said until 2026-08-26 and which was
 * the Catechism's doing rather than the chain's. Eight editions made the
 * per-language figure a per-EDITION one, and `ONE_EDITION_AUTOMATIC` in
 * sw-policy.ts now takes exactly one — so the chain's own cost is the cheap
 * part again, which is what the argument below always assumed.
 *
 * IT IS WORTH THAT because the alternative fails in the one condition the
 * offline library exists for. A short download chain would leave a Romanian
 * reader routed to the Italian Catechism with no Italian Catechism on the
 * device — the fallback would stop working exactly when the network does,
 * which is when a reader most needs the address to resolve to something. A
 * reader's languages are one list, and a fallback nobody can read offline is
 * not a fallback.
 */
export function contentLangChain(lang: string): string[] {
	return [...new Set([lang, ...fallbackFor(baseLang(lang))])];
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
 * AND ON 2026-09-01 THAT DECISION WAS MADE THE OTHER WAY. English is the one
 * language whose default was not a received edition — every other Bible here
 * is an approved translation with a history (Clementina 1592, Martini,
 * Allioli, Káldi-Tárkányi, Crampon, Straubinger, Matos Soares) and the CPDV is
 * one man's, self-published, unreviewed by his own choice, which its manifest
 * says and `docs/research/bible-texts.md` assesses. What decided it was the
 * apparatus rather than the provenance: the CPDV carries NO notes, and Haydock
 * annotates the Douay-Rheims, so `ApparatusMenu`'s trigger did not render at
 * all for the reader who chose nothing — on a site named for the *Glossa
 * Ordinaria*. The Douay-Rheims brings Challoner's 1,916 notes, his 1,307
 * chapter arguments and Haydock's 45,747. THE COST IS THE REGISTER, and it is
 * paid by the readers least able to afford it: every `CONTENT_LANG_FALLBACK`
 * row ends in `en, la` and only eight interface languages have a Bible of
 * their own, so this is what most of the world reads here, mostly
 * as non-native English. It is bounded — the CPDV is one click away in the
 * edition menu and the choice persists — and that is why it was accepted.
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
	'bible:en': 'bible.douay-rheims.en',
	'bible:pt': 'bible.matos-soares.pt',
	'bible:la': 'bible.clementina.la'
};

/**
 * Preferred work id for a type at a UI language (site/docs/addresses.md:
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
	for (const candidate of [baseLang(lang), ...fallbackFor(baseLang(lang))]) {
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
		fallbackFor(baseLang(preferred)).map(inLang).find(Boolean) ??
		available[0]
	);
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
	requireIndex('bible', 'getBook');
	return bibleIndex[workId]?.find((b) => b.osis === osis);
}

/** All books physically present for a work, in canonical (`order`) order —
 *  already sorted by `scripts/sync-corpus.mjs` / `corpus-index.ts`'s fixture
 *  branch. */
export function listBooks(workId: string): BibleBookMeta[] {
	requireIndex('bible', 'listBooks');
	return bibleIndex[workId] ?? [];
}

/**
 * One verse of `workId`, drawn at random — what the landing page's dice
 * button opens.
 *
 * UNIFORM OVER VERSES, NOT OVER BOOKS. Picking a book and then a chapter
 * inside it would give Obadiah (one chapter, 21 verses) the same weight as
 * the Psalms (150 chapters), and a reader rolling twice would notice: the
 * short prophets would come up constantly and the historical books almost
 * never. So the walk is over a running total of verse counts, and every
 * verse in the edition is equally likely.
 *
 * INDEX TIER ONLY — no fetch, no chapter text. `bibleIndex` already carries
 * every chapter's verse numbers (it is what `refs.ts` checks citations
 * against), which is also why the verse is read out of `verses[]` by
 * position rather than assumed to be `index + 1`: verse numbering is not
 * always contiguous.
 *
 * Chapter 0 needs no excluding here. A book introduction is addressed as
 * chapter 0 but is deliberately kept out of `chapters` (see
 * `scripts/sync-corpus.mjs`), so it is not a candidate, and it has no verse
 * to land on in any case.
 *
 * `random` is injectable only so the walk's boundaries can be tested;
 * callers pass nothing.
 */
export function randomVerse(
	workId: string,
	random: () => number = Math.random
): { osis: string; chapter: number; verse: number } | undefined {
	const books = listBooks(workId);
	let total = 0;
	for (const book of books) for (const chapter of book.chapters) total += chapter.verses.length;
	if (total === 0) return undefined;

	// `Math.random()` is [0, 1), so this is already in [0, total) — clamped
	// because an injected generator that returns exactly 1 would otherwise
	// walk off the end and report "no verses" for a corpus plainly full of
	// them.
	let index = Math.min(Math.floor(random() * total), total - 1);
	for (const book of books) {
		for (const chapter of book.chapters) {
			const verse = chapter.verses[index];
			if (verse) return { osis: book.osis, chapter: chapter.n, verse: verse.n };
			index -= chapter.verses.length;
		}
	}
	return undefined;
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
	await ensureContentIndex();
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
// whichever edition is currently selected (site/docs/addresses.md): a reader
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

/**
 * A value derived from the index registries, recomputed when they change.
 *
 * The registries are filled by `corpus-index.ts`'s primers rather than at
 * module load (see `indexGeneration` there), so a map built at module scope is
 * built from nothing. These derivations exist because rebuilding them per call
 * would be real waste — regrouping ~450 document works on every
 * `listDocuments()` — so the answer is to keep the memo and key it on the
 * generation, not to drop it.
 */
function derived<T>(build: () => T): () => T {
	let value: T | undefined;
	let builtAt = -1;
	return () => {
		const now = indexGeneration();
		if (builtAt !== now) {
			value = build();
			builtAt = now;
		}
		return value as T;
	};
}

const canonicalBooksByOsis = derived<Map<string, CanonicalBook>>(() => {
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
});

export function listCanonicalBooks(): CanonicalBook[] {
	return [...canonicalBooksByOsis().values()].sort((a, b) => a.order - b.order);
}

export function getCanonicalBook(osis: string): CanonicalBook | undefined {
	return canonicalBooksByOsis().get(osis);
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
 *     site/docs/shell.md) no route's `load()` runs there for a
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

/**
 * Told which work was read, if anyone is listening.
 *
 * INJECTED RATHER THAN IMPORTED, the same way `suggest.ts` takes its fuzzy
 * ranker: `usage.ts` wants exactly the fact the line below already computes,
 * and importing the collector here would make the module every reading route
 * depends on depend on the measurement. Nothing registers one under test or in
 * a build, and an unobserved read costs a single optional call.
 */
let contentReadObserver: ((workId: string) => void) | undefined;

export function setContentReadObserver(observer: (workId: string) => void): void {
	contentReadObserver = observer;
}

async function readContent<T>(location: ContentLocation): Promise<T> {
	// `globalThis.location`, not the bare name: the parameter above shadows it.
	const here = globalThis.location?.href;
	if (!import.meta.env.SSR && here) {
		lastRead = {
			workId: location.relPath.split('/')[1] ?? '',
			path: new URL(location.url, here).pathname
		};
		contentReadObserver?.(lastRead.workId);
	}
	let pending = contentCache.get(location.relPath) as Promise<T> | undefined;
	if (!pending) {
		pending = (
			import.meta.env.SSR
				? readContentFromDisk<T>(location.relPath)
				: readContentFromNetwork<T>(location.url)
		).catch((err: unknown) => {
			// A FAILED READ IS NOT MEMOIZED. The map exists to collapse
			// concurrent reads of one file, and a rejection kept in it makes the
			// failure permanent for the life of the page: every later route
			// asking for the same book is handed the same dead promise without
			// ever trying again. Harmless while the only cause was a network
			// that had already gone away; not harmless since offline mode, where
			// the reader turns the switch off precisely in order to retry.
			contentCache.delete(location.relPath);
			throw err;
		});
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
	await ensureContentIndex();
	if (!USE_REAL_CORPUS) return {};
	const location = translatedDescriptionsLocation(lang);
	if (!location) return {};
	return readContent<Record<string, string>>(location);
}

/**
 * Subject tags for the magisterial documents, as `document slug -> [tag, …]`.
 *
 * Keyed by slug rather than work id for the reason the translations above are:
 * a tag is about the DOCUMENT, so it serves whichever edition a reader is
 * shown. Written from the tracked `site/document-tags.json`, whose docblock
 * carries the rules for editing it.
 *
 * One request, for every document at once, issued only by `/documenta` —
 * which is the whole point of it not being in the boot index (see
 * `documentTagsLocation`). `{}` for a corpus nothing is tagged in and under
 * fixtures, both of which are ordinary states: the filter panel then offers
 * its author and type facets and no tag facet.
 */
export async function loadDocumentTags(): Promise<Record<string, string[]>> {
	await ensureContentIndex();
	if (!USE_REAL_CORPUS) return {};
	const location = documentTagsLocation();
	if (!location) return {};
	return readContent<Record<string, string[]>>(location);
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
	await ensureContentIndex();
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

// --- Commentary ------------------------------------------------------------
//
// A commentary work (`commentary.haydock.en`) holds notes that ADDRESS another
// work's verses and contains no text of its own — docs/corpus-schema.md
// §Commentary. Everything here is keyed by the address of the ANNOTATED work,
// because that is the only address a commentary note has.

/**
 * The commentaries that have anything to say at one address, in id order.
 *
 * Synchronous, off the index tier, because this is what decides whether the
 * apparatus panel offers a work at all — a control that appears only after a
 * fetch has landed is a control that moves under the reader's cursor.
 *
 * IT TAKES AN EDITION AS WELL AS AN ADDRESS, and the reason is the ANCHOR —
 * which is the same reason it did NOT for the week in between, read the other
 * way round. The gate was dropped on the argument that a verse anchor asks
 * nothing of the text beside it: every edition here is versified alike, so a
 * mark at the end of a verse means the same thing beside the Clementine as
 * beside the Douay, and nothing about the apparatus is silent — a separate
 * work, named in the panel that switches it on, opened from its own mark, set
 * in a card with its own `lang`. That held exactly as long as the mark named
 * the verse.
 *
 * IT NAMES THE WORDS NOW (`commentary-anchors.ts`), and a lemma quotes ONE
 * text: 24,805 of Haydock's notes are placed by matching his headword against
 * `bible.douay-rheims.en`, and beside any other edition every one of them would
 * find nothing. That was written down as the hypothetical this function did not
 * have to worry about; it is the actual arrangement now. So the commentary is
 * offered at the edition it annotates, which is what `manifest.annotates` has
 * said all along.
 *
 * WHAT IT COSTS IS REAL AND IS NOT A DEFECT: a reader of the Clementine or the
 * CPDV is no longer offered Haydock. The alternative is a marker run with holes
 * — half the apparatus in the text on one edition and all of it heaped at the
 * end of the verse on the others — which is a worse answer than either.
 *
 * `subsumes_notes` is still asked against `annotates` separately, because
 * "this commentary already contains the edition's own notes" is a narrower
 * claim than "this commentary belongs beside this edition".
 */
export function commentariesAt(
	osis: string,
	chapterN: number,
	workId: string | undefined
): WorkManifest[] {
	if (!workId) return [];
	return Object.entries(commentaryChapters)
		.filter(([, work]) => (work.books[osis] ?? []).includes(chapterN))
		.map(([id]) => manifests[id])
		.filter((work): work is WorkManifest => Boolean(work) && !isUnpublished(work.id))
		.filter((work) => work.type === 'commentary' && work.annotates === workId)
		.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The commentaries offered beside ONE PRAYER of one edition.
 *
 * `commentariesAt`'s twin, and everything its docblock argues holds here
 * unchanged — a commentary is offered at the edition it annotates and no
 * other, because a lemma quotes one text. That rule is the whole reason
 * Haydock is not on this list: he glosses four of these prayers at their
 * Scripture address, in Challoner's wording, and the appendix prints a
 * different English (`pipeline/scrapers/prayers_glossa.py` holds the
 * measurement). The four get a link instead.
 */
export function prayerCommentariesAt(slug: string, workId: string | undefined): WorkManifest[] {
	if (!workId) return [];
	return Object.entries(commentaryPrayers)
		.filter(([, work]) => work.prayers.includes(slug))
		.map(([id]) => manifests[id])
		.filter((work): work is WorkManifest => Boolean(work) && !isUnpublished(work.id))
		.filter((work) => work.type === 'commentary' && work.annotates === workId)
		.sort((a, b) => a.id.localeCompare(b.id));
}

/** Every commentary in the corpus, whether or not it reaches any given address. */
export function listCommentaries(): WorkManifest[] {
	return listEditions('commentary');
}

/**
 * One chapter's commentary, keyed by the verse of the annotated work.
 *
 * COARSE FETCH, NARROW RETURN, exactly as `getChapter` above: the chunk holds
 * a size-packed run of chapters and this returns the one asked for, as a map
 * the renderer can index by verse number without scanning. `Map` rather than
 * the stored array because a reading page asks it once per verse — 176 times
 * in Psalm 118 — and a linear find per verse is quadratic over a chapter.
 */
export async function getCommentaryChapter(
	workId: string,
	osis: string,
	chapterN: number
): Promise<Map<number, CommentaryNote[]>> {
	await ensureContentIndex();
	const chunk = await fetchTier<CommentaryChapter[]>(
		[],
		bibleChapterLocation(workId, osis, chapterN),
		[]
	);
	const chapter = chunk.find((c) => c.n === chapterN);
	return new Map((chapter?.verses ?? []).map((entry) => [entry.verse, entry.notes]));
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
 * `/catechismus/compendium/caput/[n]` the chapter IS the page, so the articles and
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
	requireIndex('ccc', 'cccLangs');
	return Object.keys(cccStructures).sort();
}

export function getCccStructure(lang: string): CccNode[] {
	requireIndex('ccc', 'getCccStructure');
	return cccStructures[lang] ?? [];
}

const cccParagraphNumberSets = derived<Record<string, Set<number>>>(() =>
	Object.fromEntries(Object.entries(cccParagraphNumbers).map(([lang, ns]) => [lang, new Set(ns)]))
);

/** Whether paragraph `n` exists in this corpus for `lang` — index-backed
 *  (no fetch), so the jump box and "related paragraphs" links can check
 *  existence without pulling in that paragraph's content. Never assume a
 *  contiguous range: the fixtures are deliberately gappy (see
 *  `corpus-index.ts`'s docblock). */
export function cccParagraphExists(lang: string, n: number): boolean {
	requireIndex('ccc', 'cccParagraphExists');
	return cccParagraphNumberSets()[lang]?.has(n) ?? false;
}

/** The paragraph number immediately before/after `n` that actually exists,
 *  or undefined at either end. Index-backed — see `cccParagraphExists`. */
export function getAdjacentCccParagraphNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	requireIndex('ccc', 'getAdjacentCccParagraphNumber');
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
 * (`+layout.ts`, site/docs/shell.md) there is no such entry list
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
	await ensureContentIndex();
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
	requireIndex('compendium', 'compendiumLangs');
	return Object.keys(compendiumStructures).sort();
}

export function getCompendiumStructure(lang: string): StructureNode[] {
	requireIndex('compendium', 'getCompendiumStructure');
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
 *  `/catechismus/compendium/caput/[n]`'s crumb row — the CCC's
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

// --- Catechism <-> Compendium: the condensation relation ------------------
//
// The one join between the two works the SOURCES state rather than we do:
// every Compendium question prints the CCC paragraphs it condenses, and
// `condensation.ts` votes those across all ten editions at sync time. The
// structural pairing in `toc-pairing.ts` answers for parts, sections and
// chapters, which the two outlines share; this answers below that level,
// where they do not.

/** Lazily built: the map arrives keyed by question, and both readers below
 *  want it keyed by paragraph. Built once, never invalidated — the map is a
 *  module-level constant of the build. */
let condensationReverse: Map<number, number[]> | undefined;

/** The Compendium questions condensing CCC paragraph `n`, ascending. */
export function questionsCondensing(n: number): number[] {
	condensationReverse ??= reverseCondensation(condensationMap);
	return condensationReverse.get(n) ?? [];
}

/**
 * The run of Compendium questions condensing the CCC paragraphs `[from, to]`
 * — a Catechism ARTICLE's counterpart, since the Compendium prints no
 * articles of its own. See `condensingRun` for why it is a contiguous run
 * rather than the outermost pair.
 */
export function condensingQuestionRun(from: number, to: number): [number, number] | undefined {
	return condensingRun(condensationMap, from, to);
}

// --- Compendium: content tier (async, read/fetched, memoized, chunked) ----
//
// Chunked by question at a stride of 100, exactly as the CCC is by paragraph
// — see `COMPENDIUM_CHUNK_SIZE` in scripts/sync-corpus.mjs for why, and for
// the whole-file rule this replaced on 2026-08-25. Ten editions at 280-290 KB
// raw each meant opening question 1 downloaded all 598 answers.

async function fetchCompendiumChunk(lang: string, n: number): Promise<CompendiumQuestion[]> {
	await ensureContentIndex();
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
 * Every question in an inclusive structural range, for `/catechismus/compendium/caput/[n]`.
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
const compendiumQuestionNumberSets = derived<Record<string, Set<number>>>(() =>
	Object.fromEntries(
		Object.entries(compendiumQuestionNumbers).map(([lang, ns]) => [lang, new Set(ns)])
	)
);

/** Whether this edition carries question `n`. Index-backed (no fetch), same
 *  role as `cccParagraphExists`. */
export function compendiumQuestionExists(lang: string, n: number): boolean {
	return compendiumQuestionNumberSets()[lang]?.has(n) ?? false;
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
	requireIndex('compendium', 'getAdjacentCompendiumQuestionNumber');
	return adjacentInSorted(compendiumQuestionNumbers[lang] ?? [], n, direction);
}

// --- Cross-references -------------------------------------------------
//
// The four citation tables and every query over them moved to
// `xrefs.svelte.ts` on 2026-08-25, because they are the largest thing the boot
// chunk was carrying for pages that never ask: 715 KB raw / ~69 KB gzipped of
// reverse-lookup apparatus, eagerly inlined into the bundle every route
// `modulepreload`s. They are re-exported here so no call site had to change —
// see that module for how the load is triggered and why nothing had to become
// `await`.

export {
	getCccBibleXrefs,
	getCccCitations,
	getCccCitationsForChapter,
	getDocumentCitations,
	getDocumentCitationsForChapter,
	type DocumentCitation
} from './xrefs.svelte';

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
	 *  `/documents/{slug}` URLs address (site/docs/addresses.md's URL
	 *  convention, extended to documents). */
	slug: string;
	/** Publishing family (`vatii`, `encyclical`, `exhortation`, future
	 *  `cdf`, docs/corpus-schema.md §Documents) — carried for
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

/** Memoised per index generation, same reasoning as `canonicalBooksByOsis`
 *  above: re-grouping ~450 document works (16 Vatican II + ~430 encyclicals
 *  and counting) on every `listDocuments()`/`getDocumentGroup()` call would
 *  be wasted work for something that never changes at runtime. */
const documentGroupsBySlug = derived<Map<string, DocumentGroup>>(() => {
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
});

/** All documents in this corpus, one entry per {family, slug} regardless of
 *  how many languages it has — the granularity the `/documents` library and
 *  the home page's Magisterium group both want (docs/corpus-schema.md
 *  §Documents). */
export function listDocuments(): DocumentGroup[] {
	return [...documentGroupsBySlug().values()];
}

export function getDocumentGroup(slug: string): DocumentGroup | undefined {
	return documentGroupsBySlug().get(slug);
}

/**
 * Preferred work id for a document slug at a UI language — same "content
 * language follows UI language by default" rule as `defaultWorkId`
 * (site/docs/addresses.md), scoped to one document's own editions rather than
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

/**
 * A document's outline. Re-exported from `document-structures.svelte.ts`,
 * where it became a fetch on 2026-08-26 — see that module for why nothing had
 * to become `await` and why the route awaits one anyway.
 *
 * The two functions below are pure derivations over it and therefore inherit
 * the same behaviour: empty until the tree lands, then correct, with the
 * `$derived` callers re-running of their own accord.
 */
export { getDocumentHeader, getDocumentStructure, loadDocumentStructure };

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
	requireIndex('document', 'documentOutline');
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
	// NO `requireIndex` HERE, and it had one until 2026-09-04. This function
	// reads no registry at all — it is pure over `rows` and `lastN`, which is
	// the whole reason it is split out from `documentOutline` (see the note
	// below on testing it without a corpus). Its three callers differ in what
	// they read: `documentOutline` takes `documentSectionNumbers`, which IS
	// lazily primed, and guards itself; `socialDoctrineOutline` and
	// `canonLawOutline` take registries that are still eagerly inlined and need
	// nothing. So the guard fired on two callers that were right, and `/schola`
	// — which renders the Social Doctrine's outline and primes no `document`
	// index because it reads none — threw at every load.
	//
	// A GUARD BELONGS AT THE READ, not at a function the read happens to pass
	// through. Put one here again and it is a claim about all three callers.
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

const documentSectionNumberSets = derived<Record<string, Set<number>>>(() =>
	Object.fromEntries(
		Object.entries(documentSectionNumbers).map(([workId, ns]) => [workId, new Set(ns)])
	)
);

/** Whether section `n` exists in this corpus for `workId` — index-backed
 *  (no fetch), same role as `cccParagraphExists`. */
export function documentSectionExists(workId: string, n: number): boolean {
	return documentSectionNumberSets()[workId]?.has(n) ?? false;
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
	return (documentSectionNumberSets()[workId]?.size ?? 0) > 0;
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
	await ensureContentIndex();
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
	await ensureContentIndex();
	if (!USE_REAL_CORPUS) return [];
	const location = documentAppendixLocation(workId);
	if (!location) return [];
	return readContent<DocumentAppendixUnit[]>(location);
}

async function fetchDocumentSections(workId: string): Promise<DocumentSection[]> {
	await ensureContentIndex();
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
	requireIndex('prayer', 'prayerLangs');
	return Object.keys(prayerStructures).sort();
}

/**
 * Which edition the prayer INDEX runs on for a reader who prefers `tag` — the
 * collection's shape, its section headings, its order and its prev/next
 * chain — as distinct from the edition any one prayer's TEXT resolves to.
 *
 * THE TWO DIFFER FOR A REGIONAL EDITION AND ONLY FOR ONE. `prayer.common.en-gb`
 * is the five prayers the source heads "UK VERSION" and nothing else
 * (site/docs/addresses.md), so indexing off it would present the
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
	requireIndex('prayer', 'prayerIndexLang');
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
 * exists. `prayer.common.en-gb` is five prayers (site/docs/addresses.md
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
	requireIndex('prayer', 'listPrayerEditions');
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
	requireIndex('prayer', 'getPrayerStructure');
	return prayerStructures[lang] ?? [];
}

/** Every prayer's metadata for `lang`, in PRINT order (`n`) -- the order
 *  `/prayers`' groups and the prev/next nav both want. Index-backed, no
 *  fetch: this is existence/metadata, never `blocks`/`latin`/`groups`
 *  themselves (see `PrayerMeta`'s docblock in corpus-index.ts). */
export function listPrayerMeta(lang: string): PrayerMeta[] {
	requireIndex('prayer', 'listPrayerMeta');
	return [...(prayerMetasByLang[lang] ?? [])].sort((a, b) => a.n - b.n);
}

export function getPrayerMeta(lang: string, slug: string): PrayerMeta | undefined {
	requireIndex('prayer', 'getPrayerMeta');
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
	await ensureContentIndex();
	return fetchTier([], prayerContentLocation(`prayer.common.${lang}`), []);
}

/**
 * One prayer commentary's notes, keyed by the slug of the annotated prayer.
 *
 * COARSE FETCH, NARROW RETURN, like `getCommentaryChapter` — except that the
 * whole work is one file, so the "chunk" is the apparatus entire. At a few
 * tens of kilobytes per language that is the same call `getPrayers` already
 * makes for the prayers themselves, and splitting it would buy nothing.
 */
export async function getPrayerCommentary(workId: string): Promise<Map<string, CommentaryNote[]>> {
	await ensureContentIndex();
	const entries = await fetchTier<PrayerCommentary[]>([], prayerContentLocation(workId), []);
	return new Map(entries.map((entry) => [entry.slug, entry.notes]));
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
// FRAGMENT on its question's page (`/doctores/summa/ii-ii/184#a3`), not a page of its
// own: 3,113 articles would be 3,113 addresses for one article of text each,
// which is the trade documents already made and reversed (docs/decisions.md
// §The site).

export function summaLangs(): string[] {
	requireIndex('summa', 'summaLangs');
	return Object.keys(summaStructures).sort();
}

export function getSummaStructure(lang: string): SummaNode[] {
	requireIndex('summa', 'getSummaStructure');
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
	requireIndex('summa', 'listSummaQuestions');
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
 * One article of the question being read, as the reading page hands it to
 * `summaOutline` for the sidebar.
 *
 * `title` is the article's own where its edition prints one and the other
 * edition's where it does not — the Corpus Thomisticum prints no article
 * titles at all, so under Latin every one of these is borrowed, and
 * `titleLang` is what lets the row say so rather than passing English words
 * off as this source's. The page already resolves that for its own headings
 * (`articleTitle`), so it is passed in rather than resolved a second time
 * here: the sidebar and the heading naming the same article differently
 * would be worse than either naming it badly.
 */
export interface SummaOutlineArticle {
	n: number;
	/** Verbatim from the edition — recased and stripped of its translator's
	    note by `summaQuestionLabel`, the same pass a question title gets. */
	title?: string;
	/** Set only when `title` came from another edition. */
	titleLang?: string;
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
 * and `/doctores/summa/ii-ii/184#a3` is the address that reaches it. They hang under
 * their own question, so the shared component's "only the reader's own
 * branch expands" rule already shows them for the question being read and
 * for no other — the same rule the bespoke component implemented by hand.
 *
 * THEIR TITLES COME FROM THE CALLER, because they are not in this tier at
 * all: `SummaQuestionMeta.articles` is a run of NUMBERS (corpus-index.ts),
 * kept that way so a table of contents costs no content fetch, and an
 * article's "Whether God exists?" lives in the question file the reading
 * page has already loaded. Passing the numbers alone was what left every
 * article row in the sidebar reading as a bare ordinal while the heading
 * three inches to its left printed the title — `title: String(a)` under a
 * `sub` kind, which `displayTitle` then read as the ordinal it had already
 * shown and rendered as nothing at all.
 */
export function summaOutline(
	lang: string,
	part: string,
	currentN?: number,
	articles: SummaOutlineArticle[] = []
): StructureNode[] {
	const questions = listSummaQuestions(lang).filter((q) => q.part === part);
	if (questions.length === 0) return [];
	const lastN = questions[questions.length - 1].n;

	const questionNode = (meta: { n: number }): StructureNode => {
		const named = summaTitleFor(lang, part, meta.n);
		const kids: StructureNode[] =
			meta.n === currentN
				? articles.map((a) => ({
						// `article`, not `sub`: it is one, and the kind is what earns
						// the row its "Art. 3" marker from the shared table
						// (`kindOrdinalLabel`, titles.ts), which has no entry for
						// `sub` and so numbered these by falling through to
						// `displayTitle`'s ordinal.
						kind: 'article',
						n: a.n,
						// Empty only where no edition on the page prints one; the row
						// is still a number and a link, exactly as before.
						title: a.title ? summaQuestionLabel(a.title) : '',
						// Null bounds: an article is not addressed by a question
						// number. `anchor` is what addresses it, and the shared
						// row renders that as an in-page link.
						paragraphs: [null, null],
						children: [],
						anchor: `a${a.n}`,
						titleLang: a.titleLang
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
	await ensureContentIndex();
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

// --- The Compendium of the Social Doctrine (docs/corpus-schema.md) ---------
//
// ADDRESSED LIKE THE CATECHISM, STORED LIKE A DOCUMENT, and every function
// here is one or the other of those two things. Existence, adjacency and the
// division a paragraph sits in are the Catechism's questions and are answered
// from this work's own index; reading a paragraph, an outline or the
// unnumbered matter is a document's question and is answered by the document
// readers above, unchanged, because the files are at the paths they already
// read (`content/csdc.{lang}/sections/…`).
//
// So there is no second content tier and no second chunk stride. What there
// is instead is `socialDoctrineWorkId`, and every function below goes through
// it rather than composing the id itself.

/** `'en'` -> `'csdc.en'`. One place, so a language that is not an edition
 *  fails to find content rather than finding someone else's. */
export function socialDoctrineWorkId(lang: string): string {
	return `csdc.${lang}`;
}

const socialDoctrineNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(socialDoctrineSectionNumbers).map(([workId, ns]) => [workId, new Set(ns)])
);

/** The languages this corpus carries an edition in, sorted. Ten today; two
 *  more exist on vatican.va and are withheld with the measurement that put
 *  them there (`csdc.WITHHELD`). */
export function socialDoctrineLangs(): string[] {
	return Object.keys(socialDoctrineSectionNumbers)
		.map((workId) => workId.slice('csdc.'.length))
		.sort();
}

/** Whether paragraph `n` exists in this edition — index-backed, no fetch,
 *  the same role `cccParagraphExists` plays. */
export function socialDoctrineParagraphExists(lang: string, n: number): boolean {
	return socialDoctrineNumberSets[socialDoctrineWorkId(lang)]?.has(n) ?? false;
}

/** The next or previous paragraph this edition actually carries.
 *
 *  Reads the edition's own numbers rather than stepping by one, because three
 *  editions do not carry all 583: `csdc.pl` has no §35, `csdc.hu` no §116,
 *  `csdc.pt` no §553 (the source prints each inside the paragraph before it —
 *  `csdc.KNOWN_GAPS`). Stepping by one would send a Polish reader from §34 to
 *  a page with nothing on it. */
export function getAdjacentSocialDoctrineNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	const numbers = socialDoctrineSectionNumbers[socialDoctrineWorkId(lang)] ?? [];
	const i = numbers.indexOf(n);
	if (i === -1) return undefined;
	return direction === 'prev' ? numbers[i - 1] : numbers[i + 1];
}

/** This edition's own printed sigla table, or `[]` where it prints none.
 *  Four of the ten do; the file is written only where there are rows. */
export function getSocialDoctrineAbbreviations(lang: string): CccAbbreviation[] {
	return socialDoctrineAbbreviations[lang] ?? [];
}

/** Every reading division, as `[from, to]` paragraph spans covering 1..last.
 *
 *  Derived from `socialDoctrineChapterStarts`, which is the work's own list
 *  rather than this edition's: the anchors are the same paragraph numbers in
 *  every language, because the editions are translations of one numbered
 *  text. `to` comes from the NEXT start, so a span never has to be stored and
 *  cannot drift from the text — the same reasoning `docs/corpus-schema.md`
 *  gives for a document's heading ranges. */
export function listSocialDoctrineChapters(lang: string): [number, number][] {
	const numbers = socialDoctrineSectionNumbers[socialDoctrineWorkId(lang)] ?? [];
	if (numbers.length === 0) return [];
	const last = numbers[numbers.length - 1];
	const starts = socialDoctrineChapterStarts.filter((n) => n <= last);
	return starts.map((from, i) => [from, (starts[i + 1] ?? last + 1) - 1]);
}

/** The division containing paragraph `n`, or undefined for a number outside
 *  every span. */
export function socialDoctrineChapterFor(lang: string, n: number): [number, number] | undefined {
	return listSocialDoctrineChapters(lang).find(([from, to]) => n >= from && n <= to);
}

/** Whether `n` opens a division — what `/doctrina-socialis/caput/{n}` is
 *  addressed by. */
export function socialDoctrineChapterExists(n: number): boolean {
	return socialDoctrineChapterStarts.includes(n);
}

/** One paragraph. One chunk, not the whole edition — see `COARSE FETCH,
 *  NARROW RETURN` in this module's docblock. */
export async function getSocialDoctrineParagraphAsync(
	lang: string,
	n: number
): Promise<DocumentSection | undefined> {
	await ensureContentIndex();
	if (!socialDoctrineParagraphExists(lang, n)) return undefined;
	const workId = socialDoctrineWorkId(lang);
	const chunk = await fetchTier<DocumentSection[]>([], documentChunkLocation(workId, n), []);
	return chunk.find((section) => section.n === n);
}

/** A run of paragraphs, for the division reading view. Fetches only the
 *  chunks the span touches — one or two at this stride, never the edition. */
export async function getSocialDoctrineRangeAsync(
	lang: string,
	from: number,
	to: number
): Promise<DocumentSection[]> {
	await ensureContentIndex();
	const workId = socialDoctrineWorkId(lang);
	const starts = new Set<number>();
	for (const n of socialDoctrineSectionNumbers[workId] ?? []) {
		if (n >= from && n <= to) starts.add(documentChunkStartFor(n));
	}
	const chunks = await Promise.all(
		[...starts]
			.sort((a, b) => a - b)
			.map((n) => fetchTier<DocumentSection[]>([], documentChunkLocation(workId, n), []))
	);
	return chunks
		.flat()
		.filter((section) => section.n >= from && section.n <= to)
		.sort((a, b) => a.n - b.n);
}

/**
 * The edition's outline, as the sidebar's row model.
 *
 * `documentOutline` is the same derivation over the same file, with one
 * difference that matters here: THE UNANCHORED HEADINGS ARE DROPPED. A
 * document's sidebar links to `#s{n}` fragments of a page that renders the
 * whole work, so a heading standing over no numbered paragraph — the letter
 * of transmittal, the presentation, the 90 book names of the index of
 * references — still has somewhere to point. This work is addressed a
 * paragraph at a time, and `buildDocumentOutline` gives such a row a
 * SENTINEL number past the last real one (`documentTailNumber`, positional
 * and never an address); routed rather than anchored, that sentinel would
 * become `/doctrina-socialis/584`, which is a link to a 404. The unnumbered
 * matter is on the landing page instead, where it has a reader and no
 * address is implied.
 *
 * 59 of `csdc.en`'s 305 rows go, and every one of them is back matter.
 */
export function socialDoctrineOutline(lang: string): StructureNode[] {
	const workId = socialDoctrineWorkId(lang);
	const numbers = socialDoctrineSectionNumbers[workId] ?? [];
	return buildDocumentOutline(
		levelSocialDoctrineRows(
			getDocumentStructure(workId).filter((row) => row.before !== null && row.before !== undefined),
			socialDoctrineChapterStarts
		),
		numbers.length > 0 ? numbers[numbers.length - 1] : null
	);
}

/**
 * The edition's heading rows with `level` REPLACED by the one hierarchy all
 * ten editions agree on: part, division, and everything printed inside it.
 *
 * `level` is not a fact about this work — it is read off how a page paints a
 * heading, and the ten editions are ten differently painted pages. The
 * twelve chapters sit at level 2 in English, level 1 in Portuguese, and in
 * Hungarian, Swahili and Vietnamese at no level that isolates them at all
 * (`socialDoctrineChapterStarts`, scripts/sync-corpus.mjs, which is where
 * this was first measured). Handed to `buildDocumentOutline` as printed, a
 * flat edition builds a flat tree: `csdc.pt` produced 75 roots and `csdc.hu`
 * 99, so the sidebar listed every chapter AND every roman-numeral section
 * inside it at the top level, permanently open, where the reader's own
 * branch is the only thing meant to be expanded (`StructureSidebarToc` —
 * ONLY THE READER'S OWN BRANCH IS EXPANDED). Re-levelled, every edition
 * renders the same 3-to-13-root outline.
 *
 * WHAT THE EDITIONS DO AGREE ON IS THE DIVISION ANCHOR, which is the whole
 * basis of this: `starts` is the work's own list of the paragraph each
 * reading division opens at, unioned across editions and identical in all of
 * them because they are translations of one numbered text. So the levels are
 * derived from where a row FALLS rather than from how it was painted:
 *
 *  - the rows an edition prints above a division's own heading are the part
 *    divider standing over it (`PART ONE`, printed on a page of its own with
 *    no name beside it) — level 1;
 *  - the division's own heading, the labelled one where the edition prints a
 *    label and otherwise the first row at the anchor — level 2. This is the
 *    same choice, and for the same reason, that `socialDoctrineDivisions`
 *    makes when it names a division;
 *  - everything else in the division keeps the source's own relative depth,
 *    shifted to sit below the heading. An edition that paints two levels
 *    inside a chapter gets two; one that paints none gets one flat run,
 *    which is that edition's own granularity and not something to invent.
 *
 * The three editions printing no label anywhere therefore hand the division
 * row to the part where a part opens at the same paragraph, so their outline
 * has thirteen roots rather than four. That is the silence `sync-corpus.mjs`
 * describes, not a miss here: an anchor is taken when any edition labels it,
 * and an edition that labels nothing cannot say which of its own rows is the
 * chapter.
 */
export function levelSocialDoctrineRows(
	rows: DocumentNode[],
	starts: readonly number[]
): DocumentNode[] {
	const anchors = [...starts].sort((a, b) => a - b);
	if (anchors.length === 0) return rows;
	// Rows in the order they are printed, grouped by the division they fall
	// in — the last anchor at or before the row, and the first anchor for
	// anything ahead of it (`csdc.sw` anchors its front matter at §2 and §8).
	const byDivision = new Map<number, number[]>();
	for (const [i, row] of rows.entries()) {
		let division = anchors[0];
		for (const anchor of anchors) {
			if (anchor > (row.before as number)) break;
			division = anchor;
		}
		byDivision.set(division, [...(byDivision.get(division) ?? []), i]);
	}

	const levels = new Array<number>(rows.length);
	for (const group of byDivision.values()) {
		const labelled = group.findIndex((i) => rows[i].label);
		const head = labelled === -1 ? 0 : labelled;
		const inside = group.slice(head + 1);
		const floor = inside.length > 0 ? Math.min(...inside.map((i) => rows[i].level)) : 0;
		for (const [k, i] of group.entries()) {
			levels[i] = k < head ? 1 : k === head ? 2 : 3 + (rows[i].level - floor);
		}
	}
	return rows.map((row, i) => ({ ...row, level: levels[i] }));
}

/** `socialDoctrineOutline` in `StructureSidebarToc`'s row shape. The walk is
 *  over `children`, so only the roots are read from this array — the same
 *  contract `flattenCccStructure` has. */
export function flattenSocialDoctrineOutline(
	lang: string
): { node: StructureNode; depth: number }[] {
	return flattenTree(socialDoctrineOutline(lang));
}

/**
 * The reading divisions with their names — what the landing page lists and
 * what `/doctrina-socialis/caput/{n}` is titled.
 *
 * The name is READ OFF THE NODE THAT PRODUCED THE ANCHOR, not off the widest
 * division opening there, for the reason `shell-head.ts`'s
 * `socialDoctrineChapterNames` records: the source prints `PART ONE` on a
 * page of its own with no name beside it, and that divider opens at the same
 * paragraph as Chapter One and outruns it by three chapters.
 *
 * IT HANDS BACK THE NODE'S DEPTH BECAUSE THE CALLER CANNOT RECOVER IT.
 * The chapter page needs to know which outline rows sit INSIDE the division,
 * so it can print them as its inner headings, and it used to find the depth
 * by scanning its own `flattenSocialDoctrineOutline` for the node by
 * identity. That scan could never match: `buildDocumentOutline` maps the
 * stored `DocumentNode[]` into FRESH `StructureNode` objects on every call,
 * so a tree built here and a tree built in a caller's `$derived` share no
 * object at all. It silently took its `?? 0` fallback, which put every
 * division at the top level, and the page printed its `<h1>` again as the
 * first `<h2>` of its own body. Returning the depth from the one call that
 * has the row in hand removes the comparison rather than repairing it — an
 * identity test across two derivations of the same tree has no correct form.
 */
export function socialDoctrineDivisions(lang: string): SocialDoctrineDivision[] {
	const rows = flattenSocialDoctrineOutline(lang);
	return listSocialDoctrineChapters(lang).flatMap(([from, to]) => {
		const here = rows.filter(({ node }) => node.paragraphs[0] === from);
		const found = here.find(({ node }) => node.label) ?? here[0];
		return found ? [{ from, to, node: found.node, depth: found.depth }] : [];
	});
}

export interface SocialDoctrineDivision {
	from: number;
	to: number;
	node: StructureNode;
	depth: number;
}

/** Fetches the edition's outline into `document-structures.svelte.ts`, which
 *  is where `socialDoctrineOutline` reads it from. */
export async function loadSocialDoctrineOutline(lang: string): Promise<void> {
	await loadDocumentStructure(socialDoctrineWorkId(lang));
}

// --- The Code of Canon Law (docs/corpus-schema.md) ------------------------
//
// THE SAME ARRANGEMENT AS THE BLOCK ABOVE and nothing new in it: addressed
// like the Catechism, stored like a document, so existence and adjacency come
// from this work's own index and reading a canon or an outline goes through
// the document readers unchanged. `canonLawWorkId` is the one seam.
//
// WHAT IS DIFFERENT IS THE SHAPE OF A READING PAGE. The Compendium of the
// Social Doctrine is twelve chapters of about fifty paragraphs and its
// chapter is the obvious unit. The Code is seven books of two to three
// hundred canons, divided five levels deep, and neither end works: a book is
// 543 canons and 300 KB, a chapter is often three canons, and 78 titles hold
// 130 chapters between them while the rest hold their canons directly. The
// unit is the TITLE, which is what the Code's own editions paginate at.

/** `'en'` -> `'cic.en'`. One place, for `socialDoctrineWorkId`'s reason. */
export function canonLawWorkId(lang: string): string {
	return `cic.${lang}`;
}

const canonLawNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(canonLawSectionNumbers).map(([workId, ns]) => [workId, new Set(ns)])
);

/** The languages this corpus carries an edition in, sorted. Seven today —
 *  every one vatican.va publishes the Code in as HTML. Portuguese and
 *  Belarusian exist there as PDF and are recorded `pdf-only` in every
 *  manifest's `translations`. */
export function canonLawLangs(): string[] {
	return Object.keys(canonLawSectionNumbers)
		.map((workId) => workId.slice('cic.'.length))
		.sort();
}

/** Whether canon `n` exists in this edition — index-backed, no fetch. */
export function canonLawCanonExists(lang: string, n: number): boolean {
	return canonLawNumberSets[canonLawWorkId(lang)]?.has(n) ?? false;
}

/** The next or previous canon this edition actually carries.
 *
 *  Reads the edition's own numbers rather than stepping by one, because two
 *  editions do not carry all 1,752: `cic.de` prints no can. 1330 and
 *  `cic.es` no can. 1482, each the source's own omission (`cic.KNOWN_GAPS`).
 *  Stepping by one would send a German reader from 1329 to an empty page. */
export function getAdjacentCanonNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	const numbers = canonLawSectionNumbers[canonLawWorkId(lang)] ?? [];
	const i = numbers.indexOf(n);
	if (i === -1) return undefined;
	return direction === 'prev' ? numbers[i - 1] : numbers[i + 1];
}

/** Every reading unit, as `[from, to]` canon spans covering 1..last.
 *
 *  `to` comes from the NEXT start, so a span is never stored and cannot
 *  drift — the derivation `listSocialDoctrineChapters` uses and the one
 *  `docs/corpus-schema.md` gives for a document's heading ranges. */
export function listCanonLawTitles(lang: string): [number, number][] {
	const numbers = canonLawSectionNumbers[canonLawWorkId(lang)] ?? [];
	if (numbers.length === 0) return [];
	const last = numbers[numbers.length - 1];
	const starts = canonLawUnitStarts.filter((n) => n <= last);
	return starts.map((from, i) => [from, (starts[i + 1] ?? last + 1) - 1]);
}

/** The unit containing canon `n`, or undefined for a number outside every
 *  span. */
export function canonLawTitleFor(lang: string, n: number): [number, number] | undefined {
	return listCanonLawTitles(lang).find(([from, to]) => n >= from && n <= to);
}

/** Whether `n` opens a unit — what `/ius-canonicum/titulus/{n}` is addressed
 *  by. */
export function canonLawTitleExists(n: number): boolean {
	return canonLawUnitStarts.includes(n);
}

/** One canon. One chunk, not the whole edition. */
export async function getCanonAsync(lang: string, n: number): Promise<DocumentSection | undefined> {
	await ensureContentIndex();
	if (!canonLawCanonExists(lang, n)) return undefined;
	const workId = canonLawWorkId(lang);
	const chunk = await fetchTier<DocumentSection[]>([], documentChunkLocation(workId, n), []);
	return chunk.find((section) => section.n === n);
}

/** A run of canons, for the unit reading view. Fetches only the chunks the
 *  span touches — one at the median unit, five at the widest. */
export async function getCanonLawRangeAsync(
	lang: string,
	from: number,
	to: number
): Promise<DocumentSection[]> {
	await ensureContentIndex();
	const workId = canonLawWorkId(lang);
	const starts = new Set<number>();
	for (const n of canonLawSectionNumbers[workId] ?? []) {
		if (n >= from && n <= to) starts.add(documentChunkStartFor(n));
	}
	const chunks = await Promise.all(
		[...starts]
			.sort((a, b) => a - b)
			.map((n) => fetchTier<DocumentSection[]>([], documentChunkLocation(workId, n), []))
	);
	return chunks
		.flat()
		.filter((section) => section.n >= from && section.n <= to)
		.sort((a, b) => a.n - b.n);
}

/** The edition's outline, as the sidebar's row model. Unanchored rows are
 *  dropped for `socialDoctrineOutline`'s reason: this work is addressed a
 *  canon at a time, and a sentinel past the last canon routes to a 404. */
export function canonLawOutline(lang: string): StructureNode[] {
	const workId = canonLawWorkId(lang);
	const numbers = canonLawSectionNumbers[workId] ?? [];
	return buildDocumentOutline(
		getDocumentStructure(workId).filter((row) => row.before !== null && row.before !== undefined),
		numbers.length > 0 ? numbers[numbers.length - 1] : null
	);
}

/** `canonLawOutline` in `StructureSidebarToc`'s row shape. */
export function flattenCanonLawOutline(lang: string): { node: StructureNode; depth: number }[] {
	return flattenTree(canonLawOutline(lang));
}

export interface CanonLawDivision {
	from: number;
	to: number;
	node: StructureNode;
	depth: number;
}

/** How a unit's name is chosen where several divisions open at one canon:
 *  the narrowest that can BE a unit. A title says what a reader is about to
 *  read; the book and part above it are the trail. */
const CANON_LAW_UNIT_RANK: Record<string, number> = { title: 0, book: 1 };

/**
 * The reading units with their names — what the landing page lists and what
 * `/ius-canonicum/titulus/{n}` is titled.
 *
 * THE NAME COMES FROM THE NARROWEST UNIT DIVISION AT THE ANCHOR, and the
 * Compendium of the Social Doctrine takes the OUTERMOST at its own anchors
 * for a reason that inverts here. There the outermost is the chapter and
 * anything wider is a part divider the source prints on a page of its own;
 * here four divisions routinely open at one canon — canon 1311 opens Book VI,
 * its Part I and its Title I together — and the outermost would title every
 * such page after a book that runs eighty-nine canons past it.
 *
 * IT READS `kind` OFF THE STORED ROWS rather than off the outline, because
 * `StructureNode.kind` is the tree's own word (`'sub'`) and not the source's.
 * The two arrays are zipped by position within one anchor, which is safe
 * where an identity test is not: `buildDocumentOutline` maps rows to fresh
 * nodes ONE FOR ONE and in order, so the nth stored row anchored at `from` is
 * the nth outline row anchored there. (`socialDoctrineDivisions`' docblock
 * records what happens to code that compares the two trees by identity.)
 *
 * IT HANDS BACK THE DEPTH for that same function's reason: the caller needs
 * to know which outline rows sit inside the division, and cannot recover the
 * depth from a node it did not build.
 */
export function canonLawDivisions(lang: string): CanonLawDivision[] {
	const workId = canonLawWorkId(lang);
	const rows = getDocumentStructure(workId).filter(
		(row) => row.before !== null && row.before !== undefined
	);
	const flat = flattenCanonLawOutline(lang);
	return listCanonLawTitles(lang).flatMap(([from, to]) => {
		const here = flat.filter(({ node }) => node.paragraphs[0] === from);
		if (here.length === 0) return [];
		const rowsAt = rows.filter((row) => row.before === from);
		let best = 0;
		for (const [i, row] of rowsAt.entries()) {
			const rank = CANON_LAW_UNIT_RANK[row.kind ?? ''];
			const bestRank = CANON_LAW_UNIT_RANK[rowsAt[best]?.kind ?? ''];
			if (rank !== undefined && (bestRank === undefined || rank < bestRank)) best = i;
		}
		const found = here[best] ?? here[0];
		return [{ from, to, node: found.node, depth: found.depth }];
	});
}

/** Fetches the edition's outline into `document-structures.svelte.ts`, which
 *  is where `canonLawOutline` reads it from. */
export async function loadCanonLawOutline(lang: string): Promise<void> {
	await loadDocumentStructure(canonLawWorkId(lang));
}
