/**
 * The corpus boot index: every registry `corpus.ts`'s public API is backed
 * by, built once at module load and read synchronously ever after. This is
 * the "small index the app boots from" — work manifests, the canonical
 * Bible book/chapter *numbers* (never verse text), the CCC/Compendium TOC
 * trees, CCC abbreviations, and the scripture cross-reference table — never
 * the heavy reading text itself (Bible chapters, CCC paragraph prose,
 * Compendium answers, document sections), which `corpus.ts` fetches
 * separately, on demand, per page (see that file's docblock for why the
 * split, and the two-tier `corpus-data/index/` vs `corpus-data/content/`
 * layout `scripts/sync-corpus.mjs` produces).
 *
 * THE DOCUMENT TOC TREES ARE NO LONGER AMONG THEM. There are 354 document
 * editions and a reader opens one, so their outlines went to the content tier
 * on 2026-08-26 (`documentStructureLocation` below,
 * `document-structures.svelte.ts` above it); what stays here of a document is
 * its section NUMBERS, which is an existence question asked without a document
 * in hand. The eager/lazy line in this file is that distinction and not size:
 * a registry answering "does this address exist" boots with the app, a
 * registry only the page already reading a work can want does not.
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
 * Content-tier location lookups live here too — one `…Location(…)` per work
 * type, each resolving an address to the single chunk file holding it, plus a
 * plural form for the callers that want every chunk of a work. All of them go
 * through the same fixed-stride `*ChunkStartFor` functions below, which are
 * the client half of the split `scripts/sync-corpus.mjs` writes; the two
 * halves are separate literals (this module cannot import a build script) and
 * `corpus.test.ts` pins each stride to its counterpart, because a mismatch is
 * silent — it shows up only as a location lookup returning `undefined` for a
 * chunk that was in fact written.
 *
 * The per-file INVENTORY that the service worker downloads from is NOT here:
 * it is `corpus-assets.ts`, imported by `src/service-worker.ts` and by nothing
 * that runs on a page. It used to live here, which put 248 KB of manifest rows
 * into the boot chunk every page preloads, to be read by nothing on any page.
 */

import type {
	BibleBook,
	BibleIntro,
	CccAbbreviation,
	CccBibleXref,
	CccCitationXref,
	DocumentBibleXref,
	DocumentCitationXref,
	CccNode,
	CccParagraph,
	CompendiumQuestion,
	StructureNode,
	SummaNode,
	SummaPart,
	SummaQuestion,
	WorkManifest
} from './types';

import bibleCpdvEnManifest from './fixtures/bible.cpdv.en/manifest.json';
import fixtureGenJson from './fixtures/bible.cpdv.en/books/gen.json';
import fixtureJohnJson from './fixtures/bible.cpdv.en/books/john.json';
import bibleDouayRheimsEnManifest from './fixtures/bible.douay-rheims.en/manifest.json';
import fixtureDouayRheimsGenJson from './fixtures/bible.douay-rheims.en/books/gen.json';
import fixtureDouayRheimsJohnJson from './fixtures/bible.douay-rheims.en/books/john.json';
import bibleIntroEnManifest from './fixtures/bible-intro.en/manifest.json';
import fixtureBibleIntroEn from './fixtures/bible-intro.en/intros.json';

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

import summaEnManifest from './fixtures/summa.en/manifest.json';
import summaEnStructure from './fixtures/summa.en/structure.json';
import fixtureSummaEnQuestions from './fixtures/summa.en/questions.json';

// The Summa is the corpus's only work with no Portuguese edition, and the
// only one whose two editions cover different PARTS (the Latin has no
// Supplement). These fixtures carry that asymmetry deliberately: `summa.en`
// includes a Supplement question and `summa.la` cannot, which is what
// exercises the EN-then-LA fallback in `defaultWorkId`/`editionInLang`.
// They also both carry I q. 71, the article-less question.
import summaLaManifest from './fixtures/summa.la/manifest.json';
import summaLaStructure from './fixtures/summa.la/structure.json';
import fixtureSummaLaQuestions from './fixtures/summa.la/questions.json';

import compendiumEnManifest from './fixtures/compendium.en/manifest.json';
import compendiumEnStructure from './fixtures/compendium.en/structure.json';
import fixtureCompendiumEnQuestions from './fixtures/compendium.en/questions.json';

import compendiumPtManifest from './fixtures/compendium.pt/manifest.json';
import compendiumPtStructure from './fixtures/compendium.pt/structure.json';
import fixtureCompendiumPtQuestions from './fixtures/compendium.pt/questions.json';

import fixtureXrefs from './fixtures/xrefs/ccc-bible.json';

import { buildCondensationMap, type CondensationMap } from './condensation';
import { contentUrlByRelPath } from './content-urls';

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

/**
 * A sorted run of positive integers as the index tier stores it: the bare
 * COUNT when the run is exactly `1..n`, and the explicit array otherwise.
 * `compactRun` in `scripts/sync-corpus.mjs` is the encoder and argues the
 * trade; `expandRun` below is the only thing that reads this type, so nothing
 * downstream ever sees the two shapes.
 */
export type CompactRun = number | number[];

/**
 * Decode a `CompactRun` back into the array the registries and every caller
 * work in.
 *
 * Total, and deliberately so: an encoder that only ever emits the count for a
 * gapless run means `expandRun(n)` reconstructs exactly what was encoded, and
 * the three real gaps in the corpus today (Douay-Rheims Ps 115 and Ps 147,
 * which begin at verses 10 and 12, and Wis 18, which skips 25) arrive as
 * arrays and pass straight through. `0` is the empty run — an article-less
 * Summa question — not a missing field.
 */
export function expandRun(run: CompactRun): number[] {
	if (Array.isArray(run)) return run;
	return Array.from({ length: run }, (_, i) => i + 1);
}

/** On-disk/wire shape of `bible-index.json`'s per-book entry: `verses` is a
 *  PLAIN number run, not `{ n }[]` — see `scripts/sync-corpus.mjs`'s
 *  comment on why (object-wrapping ~72,000 verse numbers was most of the
 *  client chunk's weight for zero benefit, since the wrapping only needs
 *  to exist in memory). Expanded to `BibleBookMeta` (which DOES use `{ n
 *  }[]`, for `refs.ts`'s sake) once, below, when the registry is built. */
interface BibleBookMetaCompact {
	osis: string;
	name: string;
	abbrevs: string[];
	order: number;
	chapters: { n: number; verses: CompactRun }[];
}

function expandBookMeta(compact: BibleBookMetaCompact): BibleBookMeta {
	return {
		...compact,
		chapters: compact.chapters.map((c) => ({
			n: c.n,
			verses: expandRun(c.verses).map((n) => ({ n }))
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
/** `lang -> { books }` — which books have an introduction, and nothing else.
 *  The prose is content tier (see `sync-corpus.mjs`'s `bibleIntroIndex`). */
interface BibleIntroIndexFile {
	[lang: string]: { books: string[] };
}
interface CccIndexFile {
	[lang: string]: {
		structure: CccNode[];
		abbreviations: CccAbbreviation[];
		paragraphNumbers: CompactRun;
	};
}
interface CompendiumIndexFile {
	[lang: string]: { structure: StructureNode[]; questionNumbers: CompactRun };
}
/**
 * Keyed by WORK ID (`vatii.lumen-gentium.en`), not by bare language like
 * `CccIndexFile`/`CompendiumIndexFile` above -- see `corpus.ts`'s "Documents"
 * section docblock for why: a document work type is really N independent
 * works (one per {family, slug} pair, each with its own EN/PT editions),
 * not one canonical work per language.
 */
interface DocumentIndexFile {
	[workId: string]: {
		sectionNumbers: CompactRun;
		/** How many unnumbered units the work has, absent when none. */
		appendixUnits?: number;
	};
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
/**
 * Existence/metadata for one Summa question -- the index-tier projection of
 * `SummaQuestion` (types.ts), the same shape of thing `PrayerMeta` is one
 * section up: enough to build a table of contents, validate an address and
 * answer adjacency without a content fetch, and never a division's `html`.
 * At 611 questions this is ~40 KB per language against 19 MB of text.
 */
export interface SummaQuestionMeta {
	part: SummaPart;
	n: number;
	title: string;
	/** Article numbers, in order. Empty for an article-less question. */
	articles: number[];
	/** Set only on the article-less questions (I q. 71, q. 72) -- see `SummaQuestion.divisions`. */
	hasOwnDivisions?: boolean;
}
/** The wire form of `SummaQuestionMeta`: `articles` is a `CompactRun`, since
 *  a question's articles are 1..n in all but nothing. Expanded once, below. */
interface SummaQuestionMetaCompact extends Omit<SummaQuestionMeta, 'articles'> {
	articles: CompactRun;
}

/** Keyed by bare LANG, matching `CccIndexFile`/`CompendiumIndexFile`: one
 *  canonical Summa per language, not N works sharing a type. */
interface SummaIndexFile {
	[lang: string]: { structure: SummaNode[]; questions: SummaQuestionMetaCompact[] };
}
const realIndexManifests = import.meta.glob('./corpus-data/index/manifests.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, WorkManifest>>;

const realIndexBible = import.meta.glob('./corpus-data/index/bible-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, BibleIndexFile>;

const realIndexBibleIntro = import.meta.glob('./corpus-data/index/bible-intro-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, BibleIntroIndexFile>;

const realIndexCcc = import.meta.glob('./corpus-data/index/ccc-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccIndexFile>;

const realIndexCompendium = import.meta.glob('./corpus-data/index/compendium-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, CompendiumIndexFile>;

const realIndexCondensation = import.meta.glob('./corpus-data/index/ccc-compendium.json', {
	eager: true,
	import: 'default'
}) as Record<string, CondensationMap>;

const realIndexSumma = import.meta.glob('./corpus-data/index/summa-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, SummaIndexFile>;

const realIndexDocuments = import.meta.glob('./corpus-data/index/document-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, DocumentIndexFile>;

const realIndexPrayers = import.meta.glob('./corpus-data/index/prayer-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, PrayerIndexFile>;

/**
 * Credit for the illustration collections — index tier, ~470 bytes, and one
 * of the few things here that is eager on purpose rather than by inheritance.
 *
 * The colophon prints it, and the colophon renders no plates and fetches no
 * content; attribution that arrived over the network would be attribution
 * that can fail to arrive, on the one page whose whole job is to state the
 * site's position honestly (see that route's docblock). The plate LIST is
 * content tier for the opposite reason — 29 KB that only the Bible wants.
 */
const realPlateCredits = import.meta.glob('./corpus-data/index/plates-credit.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, PlateCredit>>;

/** How an illustration collection is to be credited, from its manifest. */
export interface PlateCredit {
	title: string;
	edition: string;
	copyright: { status: string; holder: string | null; notice: string | null };
	artist: string;
	reproduction: string;
	provider: string;
	provider_url: string;
	/** How many plates reached the build, and how many chapters carry one.
	 *  Counted by the sync from what it wrote, never typed into the copy. */
	plates: number;
	chapters: number;
}

/** Every illustration collection's credit, keyed by work id. Empty under
 *  fixtures and for a corpus with none built. */
export const plateCredits: Record<string, PlateCredit> = Object.values(realPlateCredits)[0] ?? {};

/**
 * Work ids switched off — written by `sync-corpus.mjs` from
 * `site/unpublished.json`, which documents the mechanism. Index tier, and
 * tiny: one id per disabled work, normally none at all. Ids only; the
 * registry's `date` and `reason` are notes for whoever files an entry and
 * never reach the client (docs/decisions.md §Posture).
 *
 * Carried as data rather than inferred from "this work has no content files",
 * because a partially-built corpus looks identical from the outside and wants
 * the opposite treatment — a missing chunk should fail loudly in development,
 * a disabled work is deliberate and silent.
 */
const realUnpublished = import.meta.glob('./corpus-data/index/unpublished.json', {
	eager: true,
	import: 'default'
}) as Record<string, string[]>;

const unpublishedWorks = new Set<string>(single(realUnpublished) ?? []);

/**
 * True when this work is switched off and has no content in this build — so
 * nothing should offer it: no preview, no bookmark target, no page.
 *
 * Note there is no fixture counterpart: the fixtures disable nothing, so
 * `npm test` exercises the published path by default and any test of this
 * behaviour has to opt in explicitly. That is the right default for a
 * mechanism whose failure mode is publishing something it shouldn't.
 */
export function isUnpublished(workId: string): boolean {
	return unpublishedWorks.has(workId);
}

// Translated descriptions: `index/descriptions.<lang>.json`, one per
// language, written by `sync-corpus.mjs` only for the languages that have
// any. Globbed as URLs rather than eagerly inlined for the same reason the
// content tier is: a reader downloads at most ONE of these, and only when
// their language is not the one a description was written in.
const realDescriptionUrls = import.meta.glob('./corpus-data/index/descriptions.*.json', {
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
			'bible.douay-rheims.en': bibleDouayRheimsEnManifest as WorkManifest,
			'bible.matos-soares.pt': bibleMatosSoaresPtManifest as WorkManifest,
			'bible.clementina.la': bibleClementinaLaManifest as WorkManifest,
			'bible-intro.en': bibleIntroEnManifest as WorkManifest,
			'ccc.en': cccEnManifest as WorkManifest,
			'ccc.pt': cccPtManifest as WorkManifest,
			'compendium.en': compendiumEnManifest as WorkManifest,
			'compendium.pt': compendiumPtManifest as WorkManifest,
			'summa.en': summaEnManifest as WorkManifest,
			'summa.la': summaLaManifest as WorkManifest
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
			'bible.douay-rheims.en': [
				metaFromFullBook(fixtureDouayRheimsGenJson as BibleBook),
				metaFromFullBook(fixtureDouayRheimsJohnJson as BibleBook)
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

/**
 * Which books have an introduction, per language — existence only, so
 * `hasBookIntro`/the chapter picker/adjacency stay synchronous, the same way
 * `cccParagraphNumbers` keeps those checks off the content tier.
 *
 * The fixture side deliberately covers Genesis and NOT John, so the tests
 * exercise both the present and the absent path (this file's docblock: the
 * fixtures are built to hit the not-in-corpus branches, not to look complete).
 */
export const bibleIntroBooks: Record<string, string[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexBibleIntro) ?? {}).map(([lang, v]) => [lang, v.books])
		)
	: { en: (fixtureBibleIntroEn as BibleIntro[]).map((entry) => entry.osis) };

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
			Object.entries(single(realIndexCcc) ?? {}).map(([lang, v]) => [
				lang,
				expandRun(v.paragraphNumbers)
			])
		)
	: {
			en: (fixtureCccEnParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b),
			pt: (fixtureCccPtParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b)
		};

/** Summa headings per language. Latin carries only its four parts -- the
 *  Corpus Thomisticum prints no treatise groupings and no question titles. */
export const summaStructures: Record<string, SummaNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexSumma) ?? {}).map(([lang, v]) => [lang, v.structure])
		)
	: {
			en: summaEnStructure as unknown as SummaNode[],
			la: summaLaStructure as unknown as SummaNode[]
		};

/** Question existence/metadata per language -- see `SummaQuestionMeta`. */
export const summaQuestionMetas: Record<string, SummaQuestionMeta[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexSumma) ?? {}).map(([lang, v]) => [
				lang,
				v.questions.map((q) => ({ ...q, articles: expandRun(q.articles) }))
			])
		)
	: Object.fromEntries(
			Object.entries({
				en: fixtureSummaEnQuestions as unknown as SummaQuestion[],
				la: fixtureSummaLaQuestions as unknown as SummaQuestion[]
			}).map(([lang, questions]) => [
				lang,
				questions.map((q) => ({
					part: q.part,
					n: q.n,
					title: q.title,
					articles: q.articles.map((a) => a.n),
					...(q.divisions ? { hasOwnDivisions: true as const } : {})
				}))
			])
		);

/**
 * Which Compendium questions condense which Catechism paragraphs, voted
 * across every edition at sync time (`condensation.ts`).
 *
 * EAGER, unlike the four citation tables next to it, and the measurement is
 * why: those are 715 KB of apparatus that renders BELOW the text it
 * annotates, so arriving after first paint costs nothing. This is 16 KB, and
 * one of its consumers is a row in the Catechism's table of contents —
 * layout, not apparatus. Arriving late would reflow the index a reader is
 * already scanning.
 *
 * DERIVED FROM THE FIXTURES rather than stubbed to `{}` under vitest, by the
 * same function the sync calls. The fixtures carry real `ccc_refs` strings
 * on their two Compendium editions, so the tests exercise the vote itself,
 * and a fixture-only shape could not drift from the real one.
 */
export const condensationMap: CondensationMap = USE_REAL_CORPUS
	? (single(realIndexCondensation) ?? {})
	: buildCondensationMap(
			[
				{
					lang: 'en',
					work: 'compendium.en',
					questions: fixtureCompendiumEnQuestions as CompendiumQuestion[]
				},
				{
					lang: 'pt',
					work: 'compendium.pt',
					questions: fixtureCompendiumPtQuestions as CompendiumQuestion[]
				}
			],
			new Set((fixtureCccEnParagraphs as CccParagraph[]).map((paragraph) => paragraph.n))
		).map;

export const compendiumStructures: Record<string, StructureNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCompendium) ?? {}).map(([lang, v]) => [lang, v.structure])
		)
	: {
			en: compendiumEnStructure as unknown as StructureNode[],
			pt: compendiumPtStructure as unknown as StructureNode[]
		};

/** Sorted question numbers present per language — the Compendium's
 *  `cccParagraphNumbers`, and new with the chunk split.
 *
 *  Before the split, existence and adjacency were answered by scanning the
 *  one whole-language file every reader had already fetched, which was free
 *  only because that file was whole. Chunked, the same scan would have to
 *  pull all six chunks to learn that question 599 does not exist. So the
 *  numbers move to the index, where the CCC has always kept them — strictly
 *  fewer requests than before, not more, since these checks now cost no
 *  fetch at all. */
export const compendiumQuestionNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCompendium) ?? {}).map(([lang, v]) => [
				lang,
				expandRun(v.questionNumbers ?? 0)
			])
		)
	: {
			// The raw fixture imports, not `fixtureCompendiumQuestionsByLang`
			// below: that binding is declared further down this module, and a
			// `const` cannot be read before its declaration is evaluated.
			en: (fixtureCompendiumEnQuestions as CompendiumQuestion[])
				.map((q) => q.n)
				.sort((a, b) => a - b),
			pt: (fixtureCompendiumPtQuestions as CompendiumQuestion[])
				.map((q) => q.n)
				.sort((a, b) => a - b)
		};

/** How many unnumbered units each document work has. Absent from the map when
 *  it has none, which is the great majority. */
const documentAppendixUnitCounts: Record<string, number> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexDocuments) ?? {})
				.filter(([, v]) => v.appendixUnits)
				.map(([workId, v]) => [workId, v.appendixUnits as number])
		)
	: {};

/** Section numbers actually present per document work id — same role as
 *  `cccParagraphNumbers` above, keyed by work id instead of language. */
export const documentSectionNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexDocuments) ?? {}).map(([workId, v]) => [
				workId,
				expandRun(v.sectionNumbers)
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

/**
 * The citation tables are the one part of the index tier that is NOT inlined.
 *
 * `xrefs.svelte.ts` fetches them after first paint; this exports only their
 * URLs. They were eager until 2026-08-25 on a "small enough to stay in the
 * eager tier" argument that was written when `xrefs.json` was the only one of
 * them and measured 30 KB gzipped. Four tables later they are 715 KB raw /
 * ~69 KB gzipped — the largest thing the boot chunk carried, in front of first
 * paint on every route including the ones that never read a byte of it.
 *
 * The fixture half stays synchronous and stays here, because there is nothing
 * to fetch: `fixtureXrefs` is already in memory, and the other three tables
 * are empty under fixtures anyway (the fixture corpus has no documents, so a
 * citation index over them would have nothing to point at).
 */
const realXrefUrls = import.meta.glob(
	'./corpus-data/index/{xrefs,document-xrefs,document-citations,ccc-citations}.json',
	{ eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

function xrefUrl(name: string): string | undefined {
	return realXrefUrls[`./corpus-data/index/${name}.json`];
}

export const xrefUrls = {
	cccBible: xrefUrl('xrefs'),
	documentBible: xrefUrl('document-xrefs'),
	documentCitations: xrefUrl('document-citations'),
	cccCitations: xrefUrl('ccc-citations')
};

/** The fixture CCC→Bible table, in the shape the queries want. Only ever
 *  consulted when `USE_REAL_CORPUS` is false — see `xrefs.svelte.ts`. */
export const cccBibleXrefsByCcc: Map<number, CccBibleXref['refs']> = new Map(
	(fixtureXrefs as CccBibleXref[]).map((entry) => [entry.ccc, entry.refs])
);

// --- Content tier: fixtures (whole, in-memory) vs. real (URL + fetch) -----

/** Fixture content, already in memory — `corpus.ts`'s async content
 *  functions read straight from these under vitest/no-corpus rather than
 *  fetching, since there's nothing to fetch and no chunk files exist for
 *  the fixtures (see this file's docblock). */
export const fixtureBibleBooks: Record<string, Record<string, BibleBook>> = {
	'bible.cpdv.en': { gen: fixtureGenJson as BibleBook, john: fixtureJohnJson as BibleBook },
	'bible.douay-rheims.en': {
		gen: fixtureDouayRheimsGenJson as BibleBook,
		john: fixtureDouayRheimsJohnJson as BibleBook
	},
	'bible.matos-soares.pt': {
		gen: fixtureMatosSoaresGenJson as BibleBook,
		john: fixtureMatosSoaresJohnJson as BibleBook
	},
	'bible.clementina.la': {
		gen: fixtureClementinaGenJson as BibleBook,
		john: fixtureClementinaJohnJson as BibleBook
	}
};
export const fixtureBibleIntrosByLang: Record<string, BibleIntro[]> = {
	en: fixtureBibleIntroEn as BibleIntro[]
};
export const fixtureCccParagraphsByLang: Record<string, CccParagraph[]> = {
	en: fixtureCccEnParagraphs as CccParagraph[],
	pt: fixtureCccPtParagraphs as CccParagraph[]
};
/** Fixture Summa content, keyed by bare lang -- the content-tier counterpart
 *  of `summaQuestionMetas`, read by `corpus.ts` under vitest instead of a
 *  fetch. `summaQuestionMetas` derives its fixture branch from the same two
 *  imports rather than from this registry: it is declared earlier in the
 *  file, and a `const` cannot be read before its initializer runs. */
export const fixtureSummaQuestionsByLang: Record<string, SummaQuestion[]> = {
	en: fixtureSummaEnQuestions as unknown as SummaQuestion[],
	la: fixtureSummaLaQuestions as unknown as SummaQuestion[]
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

/** Must equal `COMPENDIUM_CHUNK_SIZE` in scripts/sync-corpus.mjs, which is
 *  where the choice of 100 is argued — and where the whole-file rule it
 *  replaced is recorded. Pinned to that literal by `corpus.test.ts`, for the
 *  same reason the document stride is: a mismatch shows up only as
 *  `compendiumChunkLocation` returning `undefined` for a chunk that was in
 *  fact written. */
const COMPENDIUM_CHUNK_SIZE = 100;

/** The fixed-range chunk a Compendium QUESTION number lives in — the same
 *  pure function again, at the Compendium's stride. */
export function compendiumChunkStartFor(n: number): number {
	return Math.floor((n - 1) / COMPENDIUM_CHUNK_SIZE) * COMPENDIUM_CHUNK_SIZE + 1;
}

/**
 * The chunk holding one Bible chapter, or undefined when nothing holds it.
 *
 * THIS USED TO BE ARITHMETIC. Chapters were chunked on a fixed stride of 20,
 * so the chunk was `floor((n - 1) / 20) * 20 + 1` and needed no lookup at all.
 * Two editions ingested on 2026-08-28 ended that: Martini prints ~600 words of
 * commentary on a single verse, and a stride that produced 167 KB worst-case
 * across the first four editions produced 602 KB across the next two. Chunks
 * are now packed by size, which means their boundaries follow the text and
 * cannot be computed from a chapter number — see sync-corpus.mjs's
 * `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`, which argues why that trade is the right
 * one and what it costs.
 *
 * Nothing had to be added to the index tier to pay for it: this map is built
 * from the content manifest that already existed, and the file names already
 * carried both ends of their range. Bounded on both sides deliberately — a
 * chapter past the end of a book must return undefined rather than the last
 * chunk, which is what a nearest-start search would give.
 */
export function bibleChapterChunkFor(
	workId: string,
	osis: string,
	n: number
): BibleChapterChunk | undefined {
	const byStart = bibleChapterLocations[workId]?.[osis];
	if (!byStart) return undefined;
	for (const key of Object.keys(byStart)) {
		const chunk = byStart[Number(key)];
		if (chunk.start <= n && n <= chunk.end) return chunk;
	}
	// A chapter in a HOLE between two chunks, or past the end of the book.
	// Undefined is right for both: the caller renders an absent chapter, which
	// is a state this corpus has on purpose (a book a given edition omits).
	return undefined;
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
 * with `ssr = false` (`+layout.ts`, docs/decisions.md §The site) no
 * route's `load()` runs on the server at all, so `relPath` has nothing left
 * to read against today — `corpus.ts`'s docblock covers why it stays.
 */
export interface ContentLocation {
	relPath: string;
	url: string;
}

/**
 * Where the translated descriptions for `lang` live, or undefined when
 * nothing is translated into it — which is the ordinary case for most
 * languages and is not an error. See `sync-corpus.mjs`.
 */
export function translatedDescriptionsLocation(lang: string): ContentLocation | undefined {
	const relPath = `index/descriptions.${lang}.json`;
	const url = realDescriptionUrls[`./corpus-data/${relPath}`];
	return url ? { relPath, url } : undefined;
}

/** One packed range of chapters: the range it holds, and where the file is.
 *
 *  `end` is stored because chunk boundaries follow SIZE rather than a fixed
 *  stride (see `BIBLE_CHAPTER_CHUNK_TARGET_BYTES` in sync-corpus.mjs, which
 *  argues the change). Without it a lookup could only pick the nearest start
 *  at or below the chapter and would silently hand back a neighbouring chunk
 *  for a chapter past the end of the book. The path regex below always
 *  captured it and used to discard it. */
export interface BibleChapterChunk extends ContentLocation {
	start: number;
	end: number;
}

/** workId -> OSIS -> chunk start -> that chunk. Three levels: chunking
 *  partitions chapters WITHIN a book, so the OSIS id is part of the key rather
 *  than something a chapter number could ever encode. */
const bibleChapterLocations: Record<string, Record<string, Record<number, BibleChapterChunk>>> = {};
const cccChunkLocations: Record<string, Record<number, ContentLocation>> = {};
/** workId -> question-chunk start -> file. Two levels, exactly like the CCC's
 *  paragraph chunks; it was a single whole-language file until 2026-08-25. */
const compendiumChunkLocations: Record<string, Record<number, ContentLocation>> = {};
const documentChunkLocationsByWork: Record<string, Record<number, ContentLocation>> = {};
/** Keyed by WORK ID (`prayer.common.en`), not bare lang -- matches how every
 *  other content-tier location map here is keyed (the lang-vs-workid choice
 *  in the INDEX registries above is a different, index-only concern). */
const prayerLocations: Record<string, ContentLocation> = {};
/** workId -> part slug -> question number -> file. Three levels because a
 *  question number is only unique WITHIN a part: numbering restarts at 1 in
 *  each of the five. */
const summaQuestionLocations: Record<string, Record<string, Record<number, ContentLocation>>> = {};
/** Keyed by WORK ID (`bible-intro.en`), matching every other location map. */
const bibleIntroLocations: Record<string, ContentLocation> = {};
/**
 * An illustration collection's anchored plate list, keyed by work id.
 *
 * Content tier rather than index, though it is only ~29 KB: the index tier is
 * eagerly inlined into every route's boot chunk, and a reader on the colophon
 * or a prayer has no use for where 241 engravings sit in the Bible. The one
 * route that wants it fetches it once.
 */
const plateLocations: Record<string, ContentLocation> = {};
/** A document's unnumbered matter, keyed by work id. Absent for most works. */
const documentAppendixLocations: Record<string, ContentLocation> = {};
/**
 * A document's OUTLINE, keyed by work id — content tier since 2026-08-26.
 *
 * It was a field of `document-index.json` and therefore eager in the boot
 * chunk: 354 editions, 414 KB of tree, ~82 KB brotli, `modulepreload`ed by
 * every route so one of them could be read. `document-structures.svelte.ts`
 * fetches one on demand; see `sync-corpus.mjs`'s document branch for why the
 * content tier rather than a lazy index file (the service worker's download
 * waves are over the content inventory, and an offline library without
 * headings is not a library).
 */
const documentStructureLocations: Record<string, ContentLocation> = {};
// The content tier's URL map is `content-urls.ts`, not a glob of its own — see
// that module for why the second copy of this glob had to go (it doubled dev's
// module-request count and took the dev server past what a browser will open).
for (const [relPath, url] of Object.entries(contentUrlByRelPath)) {
	const location: ContentLocation = { relPath, url };
	const bibleMatch = relPath.match(/^content\/([^/]+)\/books\/([^/]+)\/(\d+)-(\d+)\.json$/);
	if (bibleMatch) {
		const [, workId, osis, startStr, endStr] = bibleMatch;
		const start = Number(startStr);
		((bibleChapterLocations[workId] ??= {})[osis] ??= {})[start] = {
			...location,
			start,
			end: Number(endStr)
		};
		continue;
	}
	const cccMatch = relPath.match(/^content\/([^/]+)\/paragraphs\/(\d+)-(\d+)\.json$/);
	if (cccMatch) {
		const [, workId, startStr] = cccMatch;
		(cccChunkLocations[workId] ??= {})[Number(startStr)] = location;
		continue;
	}
	const compendiumMatch = relPath.match(/^content\/([^/]+)\/questions\/(\d+)-(\d+)\.json$/);
	if (compendiumMatch) {
		const [, workId, startStr] = compendiumMatch;
		(compendiumChunkLocations[workId] ??= {})[Number(startStr)] = location;
		continue;
	}
	const documentMatch = relPath.match(/^content\/([^/]+)\/sections\/(\d+)-(\d+)\.json$/);
	if (documentMatch) {
		const [, workId, startStr] = documentMatch;
		(documentChunkLocationsByWork[workId] ??= {})[Number(startStr)] = location;
		continue;
	}
	const appendixMatch = relPath.match(/^content\/([^/]+)\/appendix\.json$/);
	if (appendixMatch) {
		documentAppendixLocations[appendixMatch[1]] = location;
		continue;
	}
	const structureMatch = relPath.match(/^content\/([^/]+)\/structure\.json$/);
	if (structureMatch) {
		documentStructureLocations[structureMatch[1]] = location;
		continue;
	}
	const introMatch = relPath.match(/^content\/([^/]+)\/intros\.json$/);
	if (introMatch) {
		bibleIntroLocations[introMatch[1]] = location;
		continue;
	}
	const prayerMatch = relPath.match(/^content\/([^/]+)\/prayers\.json$/);
	if (prayerMatch) {
		prayerLocations[prayerMatch[1]] = location;
		continue;
	}
	const platesMatch = relPath.match(/^content\/([^/]+)\/plates\.json$/);
	if (platesMatch) {
		plateLocations[platesMatch[1]] = location;
		continue;
	}
	// One file per question, which is one reader page -- `{part-slug}/{n}`.
	const summaMatch = relPath.match(/^content\/([^/]+)\/questions\/([^/]+)\/(\d+)\.json$/);
	if (summaMatch) {
		const [, workId, partSlug, nStr] = summaMatch;
		((summaQuestionLocations[workId] ??= {})[partSlug] ??= {})[Number(nStr)] = location;
	}
}

/** The one chunk chapter `n` of `osis` lives in. */
/** Chunk-keyed map -> its files in ascending chunk-start order. Ordered by
 *  the numeric key rather than by insertion, so the pieces concatenate into
 *  work order regardless of the order the glob happened to walk them. Shared
 *  by the three tiers whose chunks a caller may want all of. */
function locationsInChunkOrder(
	byStart: Record<number, ContentLocation> | undefined
): ContentLocation[] {
	if (!byStart) return [];
	return Object.keys(byStart)
		.map(Number)
		.sort((a, b) => a - b)
		.map((start) => byStart[start]);
}

export function bibleChapterLocation(
	workId: string,
	osis: string,
	n: number
): ContentLocation | undefined {
	return bibleChapterChunkFor(workId, osis, n);
}

/** Every chunk of one book, in chapter order — for a whole-book read. Nothing
 *  needs it today (`getChapter` is this tier's only reader and wants one
 *  chapter), but it is what makes "download this book for offline" expressible
 *  as a book rather than as a list of chunk paths. */
export function bibleBookLocations(workId: string, osis: string): ContentLocation[] {
	return locationsInChunkOrder(bibleChapterLocations[workId]?.[osis]);
}

export function cccChunkLocation(workId: string, n: number): ContentLocation | undefined {
	return cccChunkLocations[workId]?.[cccChunkStartFor(n)];
}

/** The one chunk question `n` lives in. */
export function compendiumChunkLocation(workId: string, n: number): ContentLocation | undefined {
	return compendiumChunkLocations[workId]?.[compendiumChunkStartFor(n)];
}

/** Every chunk of one edition, in question order — for a range read that
 *  spans the whole work. */
export function compendiumChunkLocationsFor(workId: string): ContentLocation[] {
	return locationsInChunkOrder(compendiumChunkLocations[workId]);
}

export function summaQuestionLocation(
	workId: string,
	partSlug: string,
	n: number
): ContentLocation | undefined {
	return summaQuestionLocations[workId]?.[partSlug]?.[n];
}

/** How many unnumbered units a document has; 0 when it has none. */
export function documentAppendixUnits(workId: string): number {
	return documentAppendixUnitCounts[workId] ?? 0;
}

/** A document's unnumbered matter, when it has any. */
export function documentAppendixLocation(workId: string): ContentLocation | undefined {
	return documentAppendixLocations[workId];
}

/** A document's outline. `undefined` means the work was never built, not that
 *  it has no headings — the sync writes the file even when the tree is empty,
 *  precisely so the two stay distinguishable. */
export function documentStructureLocation(workId: string): ContentLocation | undefined {
	return documentStructureLocations[workId];
}

/** The one chunk section `n` lives in — for a single-section read (a link
 *  preview), which must not pay for the whole document. */
export function documentChunkLocation(workId: string, n: number): ContentLocation | undefined {
	return documentChunkLocationsByWork[workId]?.[documentChunkStartFor(n)];
}

/** Every chunk of a document, in section order — for the continuous reading
 *  view, which needs all of them. See `locationsInChunkOrder` for why the
 *  numeric key, not insertion order, decides. */
export function documentChunkLocations(workId: string): ContentLocation[] {
	return locationsInChunkOrder(documentChunkLocationsByWork[workId]);
}

export function bibleIntroLocation(workId: string): ContentLocation | undefined {
	return bibleIntroLocations[workId];
}

/** Where `workId`'s plate list lives, or undefined when the corpus has no
 *  such collection built — the ordinary case under fixtures. */
export function plateContentLocation(workId: string): ContentLocation | undefined {
	return plateLocations[workId];
}

export function prayerContentLocation(workId: string): ContentLocation | undefined {
	return prayerLocations[workId];
}
