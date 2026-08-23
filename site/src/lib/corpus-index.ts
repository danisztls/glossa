/**
 * The corpus boot index: every registry `corpus.ts`'s public API is backed
 * by, built once at module load and read synchronously ever after. This is
 * the "small index the app boots from" — work manifests, the canonical
 * Bible book/chapter *numbers* (never verse text), the CCC/Compendium/
 * Document TOC trees, CCC abbreviations, and the scripture cross-reference
 * table — never the heavy reading text itself (Bible chapters, CCC
 * paragraph prose, Compendium answers, document sections), which
 * `corpus.ts` fetches separately, on demand, per page (see that file's
 * docblock for why the split, and the two-tier `corpus-data/index/` vs
 * `corpus-data/content/` layout `scripts/sync-corpus.mjs` produces).
 *
 * Two sources, chosen the same way `corpus.ts` always has:
 *   - Real corpus: `import.meta.glob(..., { eager: true })` over
 *     `corpus-data/index/*.json` — small (well under 500 KB total at real
 *     scale, see the build report this shipped with), so eager-inlining
 *     costs less than a `+layout.ts` fetch round-trip would, and it's
 *     needed synchronously by components that read it outside any `load()`
 *     (`BookChapterPicker`, `JumpBox`, the CCC/Compendium TOC pages — see
 *     each's own corpus.ts imports).
 *   - Fixtures (`src/lib/fixtures/`, always used under vitest — see
 *     `corpus.ts`'s `VITEST` guard): hand-authored, already small, imported
 *     directly and reduced to the same registry shapes below so both
 *     branches present one interface to `corpus.ts`.
 *
 * Content-tier URL lookups (`bibleBookUrl`, `cccChunkUrl`,
 * `compendiumQuestionsUrl`) live here too, alongside `listContentAssets()`
 * — the per-work-file inventory (URL shape, byte size) the service worker
 * needs to precache real content explicitly instead of the size-sniffing
 * heuristic its docblock currently describes as a stopgap (see
 * `src/service-worker.ts`'s "CONTENT TIER POLICY" block, which names this
 * exact shape as what should replace it).
 */

import type {
	BibleBook,
	CccAbbreviation,
	CccBibleXref,
	DocumentBibleXref,
	CccNode,
	CccParagraph,
	CompendiumQuestion,
	StructureNode,
	DocumentNode,
	WorkManifest
} from './types';

import bibleCpdvEnManifest from './fixtures/bible.cpdv.en/manifest.json';
import fixtureGenJson from './fixtures/bible.cpdv.en/books/gen.json';
import fixtureJohnJson from './fixtures/bible.cpdv.en/books/john.json';

import bibleMatosSoaresPtManifest from './fixtures/bible.matos-soares.pt/manifest.json';
import fixtureMatosSoaresGenJson from './fixtures/bible.matos-soares.pt/books/gen.json';
import fixtureMatosSoaresJohnJson from './fixtures/bible.matos-soares.pt/books/john.json';

// The Latin Bible is the corpus's only content language that is not also an
// interface language, so it is the only fixture that can exercise
// `content.svelte.ts`'s "an override the UI can never default to is never
// cleared by a UI event" rule. It carries the same two books as the other
// two editions.
import bibleClementinaLaManifest from './fixtures/bible.clementina.la/manifest.json';
import fixtureClementinaGenJson from './fixtures/bible.clementina.la/books/gen.json';
import fixtureClementinaJohnJson from './fixtures/bible.clementina.la/books/john.json';

import cccEnManifest from './fixtures/ccc.en/manifest.json';
import cccEnStructure from './fixtures/ccc.en/structure.json';
import fixtureCccEnParagraphs from './fixtures/ccc.en/paragraphs.json';
import cccEnAbbreviations from './fixtures/ccc.en/abbreviations.json';

import cccPtManifest from './fixtures/ccc.pt/manifest.json';
import cccPtStructure from './fixtures/ccc.pt/structure.json';
import fixtureCccPtParagraphs from './fixtures/ccc.pt/paragraphs.json';
import cccPtAbbreviations from './fixtures/ccc.pt/abbreviations.json';

import compendiumEnManifest from './fixtures/compendium.en/manifest.json';
import compendiumEnStructure from './fixtures/compendium.en/structure.json';
import fixtureCompendiumEnQuestions from './fixtures/compendium.en/questions.json';

import compendiumPtManifest from './fixtures/compendium.pt/manifest.json';
import compendiumPtStructure from './fixtures/compendium.pt/structure.json';
import fixtureCompendiumPtQuestions from './fixtures/compendium.pt/questions.json';

import fixtureXrefs from './fixtures/xrefs/ccc-bible.json';

// --- Bible book metadata (index tier: chapter NUMBERS, never verse text) --

/** Verse EXISTENCE only — `{ n }`, never `text` — kept as `{ n }[]` rather
 *  than a bare `number[]` specifically so `refs.ts`'s `refHref`
 *  (`chapter.verses.some(v => v.n === verseN)`, checking a cited verse
 *  exists before linking to it — a file this restructuring must not
 *  require editing) keeps compiling and working unmodified. */
export interface BibleVerseMeta {
	n: number;
}

/** Chapter EXISTENCE + verse EXISTENCE — see `BibleVerseMeta`. Same
 *  reasoning applies to keeping `{ n }[]` rather than `number[]`:
 *  `refs.ts`'s `book.chapters.find(c => c.n === seg.chapter)`. */
export interface BibleChapterMeta {
	n: number;
	verses: BibleVerseMeta[];
}

export interface BibleBookMeta {
	osis: string;
	name: string;
	abbrevs: string[];
	order: number;
	chapters: BibleChapterMeta[];
}

function metaFromFullBook(book: BibleBook): BibleBookMeta {
	return {
		osis: book.osis,
		name: book.name,
		abbrevs: book.abbrevs,
		order: book.order,
		chapters: book.chapters.map((c) => ({ n: c.n, verses: c.verses.map((v) => ({ n: v.n })) }))
	};
}

/** On-disk/wire shape of `bible-index.json`'s per-book entry: `verses` is a
 *  PLAIN number array, not `{ n }[]` — see `scripts/sync-corpus.mjs`'s
 *  comment on why (object-wrapping ~72,000 verse numbers was most of the
 *  client chunk's weight for zero benefit, since the wrapping only needs
 *  to exist in memory). Expanded to `BibleBookMeta` (which DOES use `{ n
 *  }[]`, for `refs.ts`'s sake) once, below, when the registry is built. */
interface BibleBookMetaCompact {
	osis: string;
	name: string;
	abbrevs: string[];
	order: number;
	chapters: { n: number; verses: number[] }[];
}

function expandBookMeta(compact: BibleBookMetaCompact): BibleBookMeta {
	return {
		...compact,
		chapters: compact.chapters.map((c) => ({
			n: c.n,
			verses: c.verses.map((n) => ({ n }))
		}))
	};
}

// --- Real corpus, if `npm run sync-corpus` has populated corpus-data/ -----
//
// Glob paths are relative to this file and must be literal for Vite's
// static analysis, so they can't be built from the CORPUS_DIR env var here
// — that's why sync-corpus.mjs materializes real data at this fixed path
// instead of reading `../../corpus` directly.

interface BibleIndexFile {
	[workId: string]: { books: BibleBookMetaCompact[] };
}
interface CccIndexFile {
	[lang: string]: {
		structure: CccNode[];
		abbreviations: CccAbbreviation[];
		paragraphNumbers: number[];
	};
}
interface CompendiumIndexFile {
	[lang: string]: { structure: StructureNode[] };
}
/**
 * Keyed by WORK ID (`vatii.lumen-gentium.en`), not by bare language like
 * `CccIndexFile`/`CompendiumIndexFile` above -- see `corpus.ts`'s "Documents"
 * section docblock for why: a document work type is really N independent
 * works (one per {family, slug} pair, each with its own EN/PT editions),
 * not one canonical work per language.
 */
interface DocumentIndexFile {
	[workId: string]: { structure: DocumentNode[]; sectionNumbers: number[] };
}
/**
 * Existence/metadata for one prayer -- the index-tier projection of `Prayer`
 * (types.ts), analogous to `BibleBookMeta` a few sections up: enough to
 * build `/prayers`' list, an `entries()` crawl target, and prev/next
 * adjacency, WITHOUT a content-tier fetch. Never `blocks`/`variants`/
 * `latin`/`groups` themselves -- those are the actual reading text, and
 * that's what decides the tier (see `scripts/sync-corpus.mjs`'s docblock).
 */
export interface PrayerMeta {
	slug: string;
	/** Print order -- see `Prayer.n` (types.ts): ordering only, never addressing. */
	n: number;
	title: string;
	kind: 'simple' | 'dialogic' | 'group';
	hasLatin: boolean;
	hasVariants: boolean;
	hasGroups: boolean;
}
/** Keyed by bare LANG, matching `CccIndexFile`/`CompendiumIndexFile` above --
 *  not by work id like `DocumentIndexFile`: today's corpus has exactly one
 *  prayer collection per language, and the task this shipped under is
 *  explicit that prayers should follow the Compendium's shape (one
 *  canonical work per language), not the Documents one. */
interface PrayerIndexFile {
	[lang: string]: { structure: StructureNode[]; prayers: PrayerMeta[] };
}
export interface ContentManifestEntry {
	workId: string;
	kind:
		'bible-book' | 'ccc-chunk' | 'compendium-questions' | 'document-sections' | 'prayer-collection';
	relPath: string;
	bytes: number;
}

const realIndexManifests = import.meta.glob('./corpus-data/index/manifests.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, WorkManifest>>;

const realIndexBible = import.meta.glob('./corpus-data/index/bible-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, BibleIndexFile>;

const realIndexCcc = import.meta.glob('./corpus-data/index/ccc-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccIndexFile>;

const realIndexCompendium = import.meta.glob('./corpus-data/index/compendium-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, CompendiumIndexFile>;

const realIndexDocuments = import.meta.glob('./corpus-data/index/document-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, DocumentIndexFile>;

const realIndexPrayers = import.meta.glob('./corpus-data/index/prayer-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, PrayerIndexFile>;

const realIndexXrefs = import.meta.glob('./corpus-data/index/xrefs.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccBibleXref[]>;

const realIndexDocumentXrefs = import.meta.glob('./corpus-data/index/document-xrefs.json', {
	eager: true,
	import: 'default'
}) as Record<string, DocumentBibleXref[]>;

const realContentManifest = import.meta.glob('./corpus-data/index/content-manifest.json', {
	eager: true,
	import: 'default'
}) as Record<string, ContentManifestEntry[]>;

/**
 * Works taken down — written by `sync-corpus.mjs` from `site/unpublished.json`,
 * which documents the mechanism. Index tier, and tiny: one entry per
 * unpublished work, normally none at all.
 *
 * Carried as data rather than inferred from "this work has no content files",
 * because a partially-built corpus looks identical from the outside and wants
 * the opposite treatment — a missing chunk should fail loudly in development,
 * a taken-down work should render a calm, deliberate notice.
 */
const realUnpublished = import.meta.glob('./corpus-data/index/unpublished.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, UnpublishedWork>>;

/**
 * Why a work is withheld, for the notice its pages render in place of the
 * text.
 *
 * `kind` matters to the reader, not just to us. "We can't render this
 * properly yet" and "the rights holder asked us to stop" are different
 * statements about the same blank space, and a reader deciding whether to
 * trust the rest of the site is owed the right one. Defaults to `quality`
 * because that is what this mechanism is actually for (see
 * `site/unpublished.json`).
 */
export interface UnpublishedWork {
	kind?: 'quality' | 'rights';
	/** ISO date the work was withheld. */
	date: string;
	/** Free text, shown to the reader as given. */
	reason: string;
}

const unpublishedWorks: Record<string, UnpublishedWork> = single(realUnpublished) ?? {};

/**
 * The takedown record for a work, or undefined if it is published.
 *
 * Note there is no fixture counterpart: the fixtures ship no unpublished
 * works, so `npm test` exercises the published path by default and any test
 * of this behaviour has to opt in explicitly. That is the right default for a
 * mechanism whose failure mode is publishing something it shouldn't.
 */
export function unpublishedInfo(workId: string): UnpublishedWork | undefined {
	return unpublishedWorks[workId];
}

/** True when this work has been taken down (see `unpublishedInfo`). */
export function isUnpublished(workId: string): boolean {
	return workId in unpublishedWorks;
}

// Content tier: `?url` + `import: 'default'` yields the hashed BUILD ASSET
// URL for each file (a string), not its contents — Vite still emits the
// file itself as a build asset, just doesn't inline it. `corpus.ts` fetches
// these at runtime, one file at a time, only for the page that needs it.
const realContentUrls = import.meta.glob('./corpus-data/content/**/*.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

/**
 * True once corpus-data/ has been synced from a real corpus checkout —
 * except under vitest, which always uses the fixtures.
 *
 * The `VITEST` guard is what actually makes site/README.md's determinism
 * promise true. Omitting a `pretest` sync hook is NOT sufficient: `prebuild`
 * and `predev` sync into `src/lib/corpus-data/`, and that directory persists
 * afterwards, so any developer who has ever run `npm run build` would
 * silently have every subsequent `npm test` run against real corpus data
 * instead of the fixtures — with different pass/fail results (fixtures
 * deliberately contain absent chapters and out-of-range cross-references to
 * exercise the not-in-this-corpus paths, which real data doesn't reproduce).
 * Found exactly that way: a real-corpus build flipped two passing tests to
 * failing without a line of test or source code changing.
 *
 * The CCC fixture's structure tree carries one more deliberate edge case: a
 * `sub` heading with its own `title_marked`/`citations` (docs/corpus-schema.md,
 * "A heading can carry citations"). Two nodes in the real corpus have that and
 * both are deep inside chapters the fixture doesn't cover, so without this the
 * reading view's heading-footnote path would never run under `npm run dev`
 * against fixtures.
 */
export const USE_REAL_CORPUS =
	!import.meta.env?.VITEST && Object.keys(realIndexManifests).length > 0;

function single<T>(modules: Record<string, T>): T | undefined {
	return Object.values(modules)[0];
}

// --- Registries (real corpus when present, fixtures otherwise) -----------

export const manifests: Record<string, WorkManifest> = USE_REAL_CORPUS
	? (single(realIndexManifests) ?? {})
	: {
			'bible.cpdv.en': bibleCpdvEnManifest as WorkManifest,
			'bible.matos-soares.pt': bibleMatosSoaresPtManifest as WorkManifest,
			'bible.clementina.la': bibleClementinaLaManifest as WorkManifest,
			'ccc.en': cccEnManifest as WorkManifest,
			'ccc.pt': cccPtManifest as WorkManifest,
			'compendium.en': compendiumEnManifest as WorkManifest,
			'compendium.pt': compendiumPtManifest as WorkManifest
		};

export const bibleIndex: Record<string, BibleBookMeta[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexBible) ?? {}).map(([workId, v]) => [
				workId,
				v.books.map(expandBookMeta)
			])
		)
	: {
			'bible.cpdv.en': [
				metaFromFullBook(fixtureGenJson as BibleBook),
				metaFromFullBook(fixtureJohnJson as BibleBook)
			],
			'bible.matos-soares.pt': [
				metaFromFullBook(fixtureMatosSoaresGenJson as BibleBook),
				metaFromFullBook(fixtureMatosSoaresJohnJson as BibleBook)
			],
			'bible.clementina.la': [
				metaFromFullBook(fixtureClementinaGenJson as BibleBook),
				metaFromFullBook(fixtureClementinaJohnJson as BibleBook)
			]
		};

export const cccStructures: Record<string, CccNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCcc) ?? {}).map(([lang, v]) => [lang, v.structure])
		)
	: {
			en: cccEnStructure as unknown as CccNode[],
			pt: cccPtStructure as unknown as CccNode[]
		};

export const cccAbbreviations: Record<string, CccAbbreviation[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCcc) ?? {}).map(([lang, v]) => [lang, v.abbreviations])
		)
	: {
			en: cccEnAbbreviations as CccAbbreviation[],
			pt: cccPtAbbreviations as CccAbbreviation[]
		};

/** Sorted paragraph numbers actually present per language — existence and
 *  adjacency checks (`cccParagraphExists`, `getAdjacentCccParagraphNumber`
 *  in corpus.ts) use this instead of scanning fetched content, so they stay
 *  synchronous. Never assume a contiguous 1..2865 range: the real corpus is
 *  contiguous, but the fixtures deliberately aren't (see this file's own
 *  docblock and corpus.ts's VITEST guard). */
export const cccParagraphNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCcc) ?? {}).map(([lang, v]) => [lang, v.paragraphNumbers])
		)
	: {
			en: (fixtureCccEnParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b),
			pt: (fixtureCccPtParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b)
		};

export const compendiumStructures: Record<string, StructureNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCompendium) ?? {}).map(([lang, v]) => [lang, v.structure])
		)
	: {
			en: compendiumEnStructure as unknown as StructureNode[],
			pt: compendiumPtStructure as unknown as StructureNode[]
		};

/**
 * Document structure trees, keyed by WORK ID (not language — see
 * `DocumentIndexFile`'s docblock). No fixture branch: documents have no
 * hand-authored fixtures yet (`corpus.ts`'s content-tier functions return
 * empty results under fixtures for the same reason — see that file's
 * "Documents" section), so this is `{}` under vitest/no-corpus.
 */
export const documentStructures: Record<string, DocumentNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexDocuments) ?? {}).map(([workId, v]) => [workId, v.structure])
		)
	: {};

/** Section numbers actually present per document work id — same role as
 *  `cccParagraphNumbers` above, keyed by work id instead of language. */
export const documentSectionNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexDocuments) ?? {}).map(([workId, v]) => [
				workId,
				v.sectionNumbers
			])
		)
	: {};

/**
 * Prayer structure trees, keyed by bare LANG (see `PrayerIndexFile`'s
 * docblock). No fixture branch -- prayers have no hand-authored fixtures
 * (same posture as `documentStructures` above: `corpus.ts`'s prayer content-
 * tier functions degrade to empty under vitest for the same reason), so
 * this is `{}` under vitest/no-corpus.
 */
export const prayerStructures: Record<string, StructureNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexPrayers) ?? {}).map(([lang, v]) => [lang, v.structure])
		)
	: {};

/** Per-prayer existence/metadata, keyed by bare LANG -- same role as
 *  `cccParagraphNumbers`/`documentSectionNumbers`, one type up. */
export const prayerMetasByLang: Record<string, PrayerMeta[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexPrayers) ?? {}).map(([lang, v]) => [lang, v.prayers])
		)
	: {};

// xrefs/ccc-bible.json has thousands of entries but compresses to ~30 KB
// gzipped (measured against the real corpus 2026-08-15) — small enough to
// stay in the eager index tier rather than fetched/chunked, and several
// call sites (the CCC paragraph page's future verse cross-links, per
// docs/decisions.md's "bidirectional cross-linking" flagship feature) want
// it synchronously.
const xrefsList: CccBibleXref[] = USE_REAL_CORPUS
	? (single(realIndexXrefs) ?? [])
	: (fixtureXrefs as CccBibleXref[]);

export const cccBibleXrefsByCcc: Map<number, CccBibleXref['refs']> = new Map(
	xrefsList.map((entry) => [entry.ccc, entry.refs])
);

/**
 * The document → Bible index, same tier and same reasoning as the CCC one
 * above: 327 KB raw but 31 KB gzipped (measured against the real corpus
 * 2026-08-21), against an index tier already at ~227 KB gzipped, so inlining
 * it costs less than the round-trip to fetch it would. Revisit if the
 * Magisterium corpus grows several times over — this is the entry most likely
 * to outgrow the eager tier first.
 *
 * `[]` under fixtures, deliberately: the fixture corpus has no documents at
 * all (`documentStructures` is `{}` for the same reason), so a citation index
 * over them would have nothing to point at.
 */
export const documentBibleXrefs: DocumentBibleXref[] = USE_REAL_CORPUS
	? (single(realIndexDocumentXrefs) ?? [])
	: [];

// --- Content tier: fixtures (whole, in-memory) vs. real (URL + fetch) -----

/** Fixture content, already in memory — `corpus.ts`'s async content
 *  functions read straight from these under vitest/no-corpus rather than
 *  fetching, since there's nothing to fetch and no chunk files exist for
 *  the fixtures (see this file's docblock). */
export const fixtureBibleBooks: Record<string, Record<string, BibleBook>> = {
	'bible.cpdv.en': { gen: fixtureGenJson as BibleBook, john: fixtureJohnJson as BibleBook },
	'bible.matos-soares.pt': {
		gen: fixtureMatosSoaresGenJson as BibleBook,
		john: fixtureMatosSoaresJohnJson as BibleBook
	},
	'bible.clementina.la': {
		gen: fixtureClementinaGenJson as BibleBook,
		john: fixtureClementinaJohnJson as BibleBook
	}
};
export const fixtureCccParagraphsByLang: Record<string, CccParagraph[]> = {
	en: fixtureCccEnParagraphs as CccParagraph[],
	pt: fixtureCccPtParagraphs as CccParagraph[]
};
export const fixtureCompendiumQuestionsByLang: Record<string, CompendiumQuestion[]> = {
	en: fixtureCompendiumEnQuestions as CompendiumQuestion[],
	pt: fixtureCompendiumPtQuestions as CompendiumQuestion[]
};

const CCC_CHUNK_SIZE = 100;

/** The fixed-range chunk a CCC paragraph number lives in (see
 *  scripts/sync-corpus.mjs's `CCC_CHUNK_SIZE` docblock) — a pure function of
 *  `n`, so no chunk-boundary lookup table needs to ship alongside it. */
export function cccChunkStartFor(n: number): number {
	return Math.floor((n - 1) / CCC_CHUNK_SIZE) * CCC_CHUNK_SIZE + 1;
}

/** Must equal `DOCUMENT_CHUNK_SIZE` in scripts/sync-corpus.mjs, which is
 *  where the choice of 50 is argued. The two are separate literals because
 *  this module cannot import from a build script; `documentChunkLocation`
 *  returning `undefined` for a chunk the sync did write is what a mismatch
 *  would look like, and `corpus.test.ts` pins them together. */
const DOCUMENT_CHUNK_SIZE = 50;

/** The fixed-range chunk a document SECTION number lives in — same pure
 *  function of `n` as `cccChunkStartFor`, applied to a different stride. */
export function documentChunkStartFor(n: number): number {
	return Math.floor((n - 1) / DOCUMENT_CHUNK_SIZE) * DOCUMENT_CHUNK_SIZE + 1;
}

/** `./corpus-data/content/...` glob key -> the `relPath` shape
 *  `content-manifest.json` entries use (`content/...`), so the two can be
 *  joined without a second copy of the path. */
function contentKey(globPath: string): string {
	return globPath.replace(/^\.\/corpus-data\//, '');
}

/**
 * A content file's two addresses: `relPath` (its path under
 * `corpus-data/`, e.g. `content/bible.cpdv.en/books/gen.json`) and `url`
 * (its hashed build-asset URL, e.g.
 * `/_app/immutable/assets/gen.C3N1U3Ir.json`). `corpus.ts` uses `relPath`
 * to read the file straight off disk under SSR, and `url` to `fetch()` it
 * in the browser — see that file's docblock on why the SSR path needs the
 * former: SvelteKit's `load`-time `fetch` inlines every response it reads
 * into the SSR-rendered page's hydration payload (so hydration can replay
 * it without a second request) REGARDLESS of how little of that response
 * `load` actually returns, which is exactly the per-page re-bloat this
 * whole restructuring exists to remove. A plain `fs` read has no such
 * side effect: nothing inlines a value into the page except `load`'s own
 * return, which already only carries the coarse-fetch's requested slice
 * (see corpus.ts's "COARSE FETCH, NARROW RETURN"). That SSR path dates from
 * when every route was prerendered; since the site became one SPA shell
 * with `ssr = false` (`+layout.ts`, docs/decisions.md 2026-08-18) no
 * route's `load()` runs on the server at all, so `relPath` has nothing left
 * to read against today — `corpus.ts`'s docblock covers why it stays.
 */
export interface ContentLocation {
	relPath: string;
	url: string;
}

const bibleBookLocations: Record<string, Record<string, ContentLocation>> = {};
const cccChunkLocations: Record<string, Record<number, ContentLocation>> = {};
const compendiumQuestionsLocations: Record<string, ContentLocation> = {};
const documentChunkLocationsByWork: Record<string, Record<number, ContentLocation>> = {};
/** Keyed by WORK ID (`prayer.common.en`), not bare lang -- matches how every
 *  other content-tier location map here is keyed (the lang-vs-workid choice
 *  in the INDEX registries above is a different, index-only concern). */
const prayerLocations: Record<string, ContentLocation> = {};
/** relPath (`content-manifest.json`'s shape) -> hashed URL, built once so
 *  `listContentAssets()` doesn't rescan every glob entry per manifest row. */
const contentUrlByRelPath: Record<string, string> = {};

for (const [globPath, url] of Object.entries(realContentUrls)) {
	const relPath = contentKey(globPath);
	contentUrlByRelPath[relPath] = url;
	const location: ContentLocation = { relPath, url };
	const bibleMatch = relPath.match(/^content\/([^/]+)\/books\/([^/]+)\.json$/);
	if (bibleMatch) {
		const [, workId, osis] = bibleMatch;
		(bibleBookLocations[workId] ??= {})[osis] = location;
		continue;
	}
	const cccMatch = relPath.match(/^content\/([^/]+)\/paragraphs\/(\d+)-(\d+)\.json$/);
	if (cccMatch) {
		const [, workId, startStr] = cccMatch;
		(cccChunkLocations[workId] ??= {})[Number(startStr)] = location;
		continue;
	}
	const compendiumMatch = relPath.match(/^content\/([^/]+)\/questions\.json$/);
	if (compendiumMatch) {
		compendiumQuestionsLocations[compendiumMatch[1]] = location;
		continue;
	}
	const documentMatch = relPath.match(/^content\/([^/]+)\/sections\/(\d+)-(\d+)\.json$/);
	if (documentMatch) {
		const [, workId, startStr] = documentMatch;
		(documentChunkLocationsByWork[workId] ??= {})[Number(startStr)] = location;
		continue;
	}
	const prayerMatch = relPath.match(/^content\/([^/]+)\/prayers\.json$/);
	if (prayerMatch) {
		prayerLocations[prayerMatch[1]] = location;
	}
}

export function bibleBookLocation(workId: string, osis: string): ContentLocation | undefined {
	return bibleBookLocations[workId]?.[osis];
}

export function cccChunkLocation(workId: string, n: number): ContentLocation | undefined {
	return cccChunkLocations[workId]?.[cccChunkStartFor(n)];
}

export function compendiumQuestionsLocation(workId: string): ContentLocation | undefined {
	return compendiumQuestionsLocations[workId];
}

/** The one chunk section `n` lives in — for a single-section read (a link
 *  preview), which must not pay for the whole document. */
export function documentChunkLocation(workId: string, n: number): ContentLocation | undefined {
	return documentChunkLocationsByWork[workId]?.[documentChunkStartFor(n)];
}

/** Every chunk of a document, in section order — for the continuous reading
 *  view, which needs all of them. Ordered by chunk start rather than by the
 *  object's own key order so the fetched pieces concatenate into a
 *  document-ordered array without re-sorting the sections themselves. */
export function documentChunkLocations(workId: string): ContentLocation[] {
	const byStart = documentChunkLocationsByWork[workId];
	if (!byStart) return [];
	return Object.keys(byStart)
		.map(Number)
		.sort((a, b) => a - b)
		.map((start) => byStart[start]);
}

export function prayerContentLocation(workId: string): ContentLocation | undefined {
	return prayerLocations[workId];
}

/**
 * The full per-file content inventory (URL + byte size), for the service
 * worker's future explicit per-work precache/download UI (see this file's
 * docblock and `src/service-worker.ts`'s "CONTENT TIER POLICY" block).
 * Empty under fixtures/no-corpus — there's nothing to fetch.
 */
export interface ContentAsset extends ContentManifestEntry {
	url: string;
}

export function listContentAssets(): ContentAsset[] {
	if (!USE_REAL_CORPUS) return [];
	const manifest = single(realContentManifest) ?? [];
	const out: ContentAsset[] = [];
	for (const entry of manifest) {
		const url = contentUrlByRelPath[entry.relPath];
		if (url) out.push({ ...entry, url });
	}
	return out;
}
