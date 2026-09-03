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
 *     `corpus-data/index/*.json`, one glob per file, so what is eager is a
 *     LIST and not a wildcard. It is needed synchronously by components that
 *     read it outside any `load()` (`BookChapterPicker`, `JumpBox`, the
 *     CCC/Compendium TOC pages — see each's own corpus.ts imports), which is
 *     what buys eager-inlining over a `+layout.ts` fetch round-trip.
 *
 *     THIS SAID "SMALL — WELL UNDER 500 KB TOTAL AT REAL SCALE" UNTIL
 *     2026-09-02, and the twelve inlined files measured 2,579,725 bytes: five
 *     times the premise the paragraph was arguing from. Nothing re-measured it
 *     as the corpus went from 383 works to 1,468, and the number is
 *     load-bearing — this is parsed before the first paint on EVERY route, so
 *     it is most of what Lighthouse bills as TBT. Re-measure it rather than
 *     quoting this sentence; `sync-corpus.mjs`'s `indexBytes` prints the
 *     per-file sizes on every run, and `manifests.json` is half the total.
 *
 *     DO NOT TRY TO COMPRESS IT — that was measured too, and it does not work.
 *     `copyright` is fifteen distinct objects across 1,468 works, one of them
 *     on 1,411 of them, so deduping it into a table is the obvious win: it took
 *     `manifests.json` down 18% and the boot chunk down 180 KB raw. Over the
 *     wire it saved 3,116 bytes — 0.58% — because gzip had already collapsed
 *     the repetition, and the reverted commit is in the history if the
 *     arithmetic is wanted again. The conclusion generalises to the whole tier:
 *     what is left in these files is ENTROPY rather than redundancy, so no
 *     encoding buys anything a reader would feel. The only lever on this cost
 *     is not shipping it eagerly — making the index lazy, or splitting it per
 *     route so a Bible reader does not parse the Summa's and the Compendium's
 *     registries to read Genesis 1.
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
// `./content-urls` is reached by `await import()` inside `ensureContentIndex`
// below and is deliberately NOT imported here — see that function for why the
// one static edge was 1.1 MB of the boot chunk.

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
/** `workId -> { annotates, books }` — which chapters a commentary reaches, and
 *  which work its notes address. Existence only: the notes themselves are
 *  content tier, and nothing on a page needs to know WHICH verses are
 *  annotated until the reader has asked for the commentary at all. */
interface CommentaryIndexFile {
	[workId: string]: {
		annotates: string;
		books: { osis: string; order: number; chapters: CompactRun }[];
	};
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
	/** The prayer's opening words, for the listing to be recognizable by more
	 *  than its title. Derived in `scripts/sync-corpus.mjs` (`incipitOf`),
	 *  which is also where the one prayer that has none is explained: a
	 *  `group` prayer's first block is not its opening. */
	incipit?: string;
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
const realIndexManifestsUrl = import.meta.glob('./corpus-data/index/manifests.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const realIndexBibleUrl = import.meta.glob('./corpus-data/index/bible-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const realIndexBibleIntro = import.meta.glob('./corpus-data/index/bible-intro-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, BibleIntroIndexFile>;

const realIndexCommentary = import.meta.glob('./corpus-data/index/commentary-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, CommentaryIndexFile>;

const realIndexCccUrl = import.meta.glob('./corpus-data/index/ccc-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const realIndexCompendiumUrl = import.meta.glob('./corpus-data/index/compendium-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const realIndexCondensation = import.meta.glob('./corpus-data/index/ccc-compendium.json', {
	eager: true,
	import: 'default'
}) as Record<string, CondensationMap>;

const realIndexSummaUrl = import.meta.glob('./corpus-data/index/summa-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

const realIndexDocumentsUrl = import.meta.glob('./corpus-data/index/document-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

/**
 * The Compendium of the Social Doctrine's three index files.
 *
 * ITS CONTENT TIER NEEDS NO ENTRY OF ITS OWN, and that is the point of the
 * work having a document's content shape: its chunks, outline and appendix
 * land at `content/csdc.{lang}/sections/…`, `…/structure.json` and
 * `…/appendix.json`, which are the paths the document matchers below already
 * read into `documentChunkLocationsByWork`, `documentStructureLocations` and
 * `documentAppendixLocations`. Only the ADDRESS side is new, and that is what
 * these three carry.
 */
const realIndexSocialDoctrine = import.meta.glob('./corpus-data/index/social-doctrine-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, { sectionNumbers: number[]; appendixUnits?: number }>>;

const realIndexSocialDoctrineChapters = import.meta.glob(
	'./corpus-data/index/social-doctrine-chapters.json',
	{ eager: true, import: 'default' }
) as Record<string, number[]>;

const realIndexSocialDoctrineAbbreviationsUrl = import.meta.glob(
	'./corpus-data/index/social-doctrine-abbreviations.json',
	{ eager: true, query: '?url', import: 'default' }
) as Record<string, string>;

const realIndexCanonLaw = import.meta.glob('./corpus-data/index/canon-law-index.json', {
	eager: true,
	import: 'default'
}) as Record<string, Record<string, { sectionNumbers: number[] }>>;

const realIndexCanonLawUnits = import.meta.glob('./corpus-data/index/canon-law-units.json', {
	eager: true,
	import: 'default'
}) as Record<string, number[]>;

const realIndexPrayersUrl = import.meta.glob('./corpus-data/index/prayer-index.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

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

// Subject tags for the magisterial documents: `index/document-tags.json`,
// `slug -> [tag, …]`, written by `sync-corpus.mjs` from the tracked
// `site/document-tags.json`. A URL and not an eager inline for the reason
// stated at the head of this file: `/documenta`'s filter panel is the only
// thing that wants it, and a tag answers neither "does this address exist"
// nor "where does it live", which is what the boot index is for.
const realDocumentTagUrls = import.meta.glob('./corpus-data/index/document-tags.json', {
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
	!import.meta.env?.VITEST && Object.keys(realIndexManifestsUrl).length > 0;

function single<T>(modules: Record<string, T>): T | undefined {
	return Object.values(modules)[0];
}

// --- Registries (real corpus when present, fixtures otherwise) -----------

export const manifests: Record<string, WorkManifest> = USE_REAL_CORPUS
	? {}
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
	? {}
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

/**
 * Which chapters each commentary reaches, and what it annotates.
 *
 * `workId -> annotates -> osis -> chapter numbers`. This is what decides
 * whether the apparatus panel offers a commentary at an address at all, so it
 * has to be synchronous and therefore index tier — but it is deliberately the
 * COARSEST thing that answers that question. A verse list would be ~24,000
 * numbers in the boot chunk of every route, to save one fetch on the pages
 * where the reader has already asked for the commentary.
 *
 * Empty under fixtures. The corpus holds one commentary and the four Bible
 * fixtures are not the work it annotates, so a fixture entry would assert a
 * relation the fixture corpus does not have; the tests that need one build it
 * themselves.
 */
export const commentaryChapters: Record<
	string,
	{ annotates: string; books: Record<string, number[]> }
> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCommentary) ?? {}).map(([workId, work]) => [
				workId,
				{
					annotates: work.annotates,
					books: Object.fromEntries(work.books.map((book) => [book.osis, expandRun(book.chapters)]))
				}
			])
		)
	: {};

export const cccStructures: Record<string, CccNode[]> = USE_REAL_CORPUS
	? {}
	: {
			en: cccEnStructure as unknown as CccNode[],
			pt: cccPtStructure as unknown as CccNode[]
		};

export const cccAbbreviations: Record<string, CccAbbreviation[]> = USE_REAL_CORPUS
	? {}
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
	? {}
	: {
			en: (fixtureCccEnParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b),
			pt: (fixtureCccPtParagraphs as CccParagraph[]).map((p) => p.n).sort((a, b) => a - b)
		};

/** Summa headings per language. Latin carries only its four parts -- the
 *  Corpus Thomisticum prints no treatise groupings and no question titles. */
export const summaStructures: Record<string, SummaNode[]> = USE_REAL_CORPUS
	? {}
	: {
			en: summaEnStructure as unknown as SummaNode[],
			la: summaLaStructure as unknown as SummaNode[]
		};

/** Question existence/metadata per language -- see `SummaQuestionMeta`. */
export const summaQuestionMetas: Record<string, SummaQuestionMeta[]> = USE_REAL_CORPUS
	? {}
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
	? {}
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
	? {}
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
const documentAppendixUnitCounts: Record<string, number> = {};

/** Section numbers actually present per document work id — same role as
 *  `cccParagraphNumbers` above, keyed by work id instead of language. */
export const documentSectionNumbers: Record<string, number[]> = USE_REAL_CORPUS ? {} : {};

/** Section numbers present per `csdc.{lang}` work id -- the same role
 *  `documentSectionNumbers` plays, and keyed the same way, because an edition
 *  is a work here rather than a language of one work. */
export const socialDoctrineSectionNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexSocialDoctrine) ?? {}).map(([workId, v]) => [
				workId,
				expandRun(v.sectionNumbers)
			])
		)
	: {};

/** The paragraph each reading division opens at, unioned across editions --
 *  see `socialDoctrineChapterStarts` in `scripts/sync-corpus.mjs` for why this
 *  is one list for the work rather than one per edition, which is what every
 *  other work's chapter list is. */
export const socialDoctrineChapterStarts: number[] = USE_REAL_CORPUS
	? (single(realIndexSocialDoctrineChapters) ?? [])
	: [];

/** Canon numbers present per `cic.{lang}` work id — the same role
 *  `socialDoctrineSectionNumbers` plays and keyed the same way, because an
 *  edition of the Code is a work here rather than a language of one work. */
export const canonLawSectionNumbers: Record<string, number[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(single(realIndexCanonLaw) ?? {}).map(([workId, v]) => [
				workId,
				expandRun(v.sectionNumbers)
			])
		)
	: {};

/** The canon each reading unit of the Code opens at, unioned across editions
 *  — see `canonLawUnitStarts` in `scripts/sync-corpus.mjs` for what a unit is
 *  and why it is a title rather than a book or a chapter. */
export const canonLawUnitStarts: number[] = USE_REAL_CORPUS
	? (single(realIndexCanonLawUnits) ?? [])
	: [];

/** Each edition's own printed sigla table, keyed by bare LANG, in the same
 *  shape and for the same consumers as `cccAbbreviations`. */
export const socialDoctrineAbbreviations: Record<string, CccAbbreviation[]> = {};

/**
 * Prayer structure trees, keyed by bare LANG (see `PrayerIndexFile`'s
 * docblock). No fixture branch -- prayers have no hand-authored fixtures
 * (same posture as `documentStructures` above: `corpus.ts`'s prayer content-
 * tier functions degrade to empty under vitest for the same reason), so
 * this is `{}` under vitest/no-corpus.
 */
export const prayerStructures: Record<string, StructureNode[]> = USE_REAL_CORPUS ? {} : {};

/** Per-prayer existence/metadata, keyed by bare LANG -- same role as
 *  `cccParagraphNumbers`/`documentSectionNumbers`, one type up. */
export const prayerMetasByLang: Record<string, PrayerMeta[]> = USE_REAL_CORPUS ? {} : {};

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
 *  where the choice of stride is argued. The two are separate literals because
 *  this module cannot import from a build script; `documentChunkLocation`
 *  returning `undefined` for a chunk the sync did write is what a mismatch
 *  would look like, and `corpus.test.ts` pins them together. */
const DOCUMENT_CHUNK_SIZE = 25;

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
/**
 * ALSO SERVES COMMENTARY WORKS, and that is why `sync-corpus.mjs` writes them
 * into `content/{workId}/books/{osis}/{start}-{end}.json` rather than a path
 * shape of their own. A commentary is chunked over the same axis, by the same
 * size target, and a second regex plus a second three-level map to read it
 * would be this module's one lookup written twice. The name is the Bible's
 * because the Bible is what it was built for; the key is a work id and it
 * makes no claim about the work's type.
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

/**
 * Where the document subject tags live, or undefined when nothing in this
 * corpus is tagged — which is not an error: `/documenta` then offers its
 * author and type facets and no tag facet. See `site/document-tags.json`.
 */
export function documentTagsLocation(): ContentLocation | undefined {
	const relPath = 'index/document-tags.json';
	const url = realDocumentTagUrls[`./corpus-data/${relPath}`];
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
/**
 * Fill the location tables above from the content tier's URL map.
 *
 * THIS RAN AT MODULE SCOPE UNTIL 2026-09-03, and it was the second-largest
 * thing in front of first paint on every route. Two costs, and the smaller one
 * is the loop:
 *
 *   - `./content-urls` is one eager `?url` glob over the whole content tier —
 *     9,733 files as of this writing — which compiles to a map of string pairs
 *     weighing ~1.1 MB. A STATIC import put that map in the boot chunk, where
 *     rolldown merged it with the index tier's inlined JSON into one 4.37 MB
 *     chunk `nodes/0.js` pulled in synchronously.
 *   - The loop then ran up to ten regexes against each of those 9,733 keys
 *     before the app could render anything.
 *
 * Neither is work a reader needs done to see a page: a location answers "which
 * file holds section 12 of this document", which nothing can ask before a route
 * has decided to read something. So the map arrives by `await import()` and the
 * loop runs on first use — one chunk, fetched in parallel with the content read
 * that wanted it, and never fetched at all on a route that reads no content
 * (the colophon, a chrome page, a 404).
 *
 * `./content-urls` IS IMPORTED NOWHERE ELSE ON THE APP SIDE, which is what
 * makes the deferral real rather than nominal — a single surviving static edge
 * anywhere in the boot graph would put the map straight back, exactly as
 * `[INEFFECTIVE_DYNAMIC_IMPORT]` warns when a module is reached both ways
 * (`i18n.svelte.ts` has the other instance of that lesson). `corpus-assets.ts`
 * imports it too and is allowed to: it is the service worker's bundle alone,
 * which is its own entry and never loads with a page.
 *
 * Idempotent and concurrency-safe by memoising the PROMISE rather than a
 * boolean: `corpus.ts` fires several content reads at once on a reading route,
 * and each awaits this before touching a table.
 */
let contentIndexReady: Promise<void> | undefined;

export function ensureContentIndex(): Promise<void> {
	return (contentIndexReady ??= buildContentIndex());
}

/**
 * Whether the tables are populated, for the synchronous location readers below.
 *
 * They stay synchronous on purpose — every one of them is called from inside an
 * `async` function that has already awaited `ensureContentIndex`, and making
 * fifteen signatures async to express a wait their callers had already done
 * would have spread `await` across `corpus.ts` for nothing. What the flag buys
 * is that FORGETTING the await is loud: an unprimed lookup would otherwise
 * return `undefined`, which every caller reads as "this corpus does not have
 * that", so a missing await would surface as content that silently does not
 * exist rather than as an error.
 */
let contentIndexBuilt = false;

function requireContentIndex(fn: string): void {
	if (contentIndexBuilt || !USE_REAL_CORPUS) return;
	throw new Error(`${fn}: await ensureContentIndex() before reading a content location`);
}

/**
 * THE SIX LARGE PER-WORK-TYPE INDEXES, fetched by the route that reads them.
 *
 * They were eagerly inlined — `import.meta.glob(..., { eager: true })` compiles
 * a JSON file into the importing chunk as an object literal — which put
 * 1.33 MB of them in front of first paint on EVERY route, so a reader opening
 * Genesis 1 parsed the Summa's, the Compendium's and the prayer book's
 * registries to do it. This file's own docblock named that as the only
 * remaining lever ("making the index lazy, or splitting it per route"), and
 * `docs/decisions.md` §The site rules out the alternative: compressing the
 * tier was measured and bought 0.58% over the wire, because gzip had already
 * collapsed the redundancy. What is left is entropy, so the only thing that
 * helps is not sending it.
 *
 * `?url` rather than a lazy `import()` of the JSON: a fetched asset is parsed
 * by `JSON.parse` rather than by the JavaScript parser (several times faster
 * for the same bytes), it is content-hashed and immutably cacheable on its own
 * rather than inside a chunk that changes whenever any code near it does, and
 * `sw-policy.ts` already partitions such assets into the shell tier, so offline
 * keeps working with no new rule. It is the arrangement the xref tables moved
 * to for exactly these reasons, and the four `?url` globs beside these six are
 * its precedent.
 *
 * WHICH REGISTRIES A PRIMER FILLS IS FIXED BY WHICH FILE THEY COME OUT OF, not
 * by which route wants them — `ccc-index.json` carries the structure, the
 * abbreviations and the paragraph numbers, so `ensureCccIndex` fills all three
 * or none. Splitting a file's registries across two primers would mean fetching
 * it twice.
 *
 * The registries stay the same mutable objects they always were and are filled
 * in place with `Object.assign`, so every one of the two dozen SYNCHRONOUS
 * readers in `corpus.ts` (`getBook`, `getCccStructure`, `listSummaQuestions`,
 * …) keeps its signature and its call sites. That is the whole reason this is a
 * change to two files rather than to the component tree: what is asynchronous
 * is the ARRIVAL of the data, and `load()` is where a route already waits.
 */
async function fetchIndexFile<T>(url: string | undefined, name: string): Promise<T | undefined> {
	if (!url) return undefined;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`index tier: ${name} -> ${response.status}`);
	return (await response.json()) as T;
}

/**
 * One primer per index file.
 *
 * Memoised on the PROMISE, not on a boolean: a reading route and the jump box
 * can ask for the same index in the same tick, and a boolean would let the
 * second caller past while the first was still in flight.
 */
const indexPrimers = new Map<string, Promise<void>>();

function primeOnce(name: string, load: () => Promise<void>): Promise<void> {
	let inFlight = indexPrimers.get(name);
	if (!inFlight) {
		inFlight = USE_REAL_CORPUS ? load() : Promise.resolve();
		indexPrimers.set(name, inFlight);
	}
	return inFlight;
}

const indexPrimed = new Set<string>();

/**
 * Guard for the synchronous readers: an unprimed read returns an empty
 * registry, which every caller upstream reads as "this corpus does not have
 * that" — a page that quietly says the text is missing, which is the worst of
 * the available failures because nothing anywhere reports it.
 *
 * IT THROWS IN DEV AND STAYS QUIET IN PRODUCTION, which is not the arrangement
 * `requireContentIndex` uses, and the difference is how completely each one's
 * callers can be enumerated. Every content-location call site is inside one of
 * eighteen `async` functions in three modules, so that guard is provably
 * covered and may be strict. These readers are called from RENDER, in route
 * components and in reading chrome that appears on more than one shelf, and
 * `index-priming.ts` maps them by path — a mapping that is a judgement about
 * which component renders where, and judgements are wrong sometimes. Under
 * fixtures (`npm test`) `USE_REAL_CORPUS` is false and this cannot fire at all,
 * so the test suite is not what would catch a mistake; `npm run dev` is, and
 * that is where the throw is worth having. A reader on the deployed site gets
 * the empty-registry behaviour instead of a blank page — worse diagnostics,
 * better failure.
 */
export function requireIndex(name: string, fn: string): void {
	if (!USE_REAL_CORPUS || indexPrimed.has(name)) return;
	const message = `${fn}: the ${name} index was read before it was primed — see index-priming.ts`;
	if (import.meta.env?.DEV) throw new Error(message);
	console.warn(message);
}

export function ensureBibleIndex(): Promise<void> {
	return primeOnce('bible', async () => {
		const file = await fetchIndexFile<BibleIndexFile>(single(realIndexBibleUrl), 'bible-index');
		for (const [workId, v] of Object.entries(file ?? {})) {
			bibleIndex[workId] = v.books.map(expandBookMeta);
		}
		indexPrimed.add('bible');
	});
}

export function ensureCccIndex(): Promise<void> {
	return primeOnce('ccc', async () => {
		const file = await fetchIndexFile<CccIndexFile>(single(realIndexCccUrl), 'ccc-index');
		for (const [lang, v] of Object.entries(file ?? {})) {
			cccStructures[lang] = v.structure;
			cccAbbreviations[lang] = v.abbreviations;
			cccParagraphNumbers[lang] = expandRun(v.paragraphNumbers);
		}
		indexPrimed.add('ccc');
	});
}

export function ensureCompendiumIndex(): Promise<void> {
	return primeOnce('compendium', async () => {
		const file = await fetchIndexFile<CompendiumIndexFile>(
			single(realIndexCompendiumUrl),
			'compendium-index'
		);
		for (const [lang, v] of Object.entries(file ?? {})) {
			compendiumStructures[lang] = v.structure;
			compendiumQuestionNumbers[lang] = expandRun(v.questionNumbers ?? 0);
		}
		indexPrimed.add('compendium');
	});
}

export function ensureSummaIndex(): Promise<void> {
	return primeOnce('summa', async () => {
		const file = await fetchIndexFile<SummaIndexFile>(single(realIndexSummaUrl), 'summa-index');
		for (const [lang, v] of Object.entries(file ?? {})) {
			summaStructures[lang] = v.structure;
			summaQuestionMetas[lang] = v.questions.map((q) => ({
				...q,
				articles: expandRun(q.articles)
			}));
		}
		indexPrimed.add('summa');
	});
}

export function ensureDocumentIndex(): Promise<void> {
	return primeOnce('document', async () => {
		const file = await fetchIndexFile<DocumentIndexFile>(
			single(realIndexDocumentsUrl),
			'document-index'
		);
		for (const [workId, v] of Object.entries(file ?? {})) {
			documentSectionNumbers[workId] = expandRun(v.sectionNumbers);
			if (v.appendixUnits) documentAppendixUnitCounts[workId] = v.appendixUnits;
		}
		indexPrimed.add('document');
	});
}

export function ensurePrayerIndex(): Promise<void> {
	return primeOnce('prayer', async () => {
		const file = await fetchIndexFile<PrayerIndexFile>(single(realIndexPrayersUrl), 'prayer-index');
		for (const [lang, v] of Object.entries(file ?? {})) {
			prayerStructures[lang] = v.structure;
			prayerMetasByLang[lang] = v.prayers;
		}
		indexPrimed.add('prayer');
	});
}

/**
 * The CORE index: the work manifests, and the one other large file that is not
 * per-work-type.
 *
 * `manifests.json` is 1.50 MB and answers "does this address exist, and what is
 * it called" for every work in the corpus — the question this file's docblock
 * says the boot index is FOR, and one that the language menu, the edition
 * pickers, the colophon and fourteen other places ask without a work in hand.
 * So unlike the six above it is not route-scoped: `+layout.ts` awaits it on
 * every path.
 *
 * What changes is only that it ARRIVES as a fetched, content-hashed JSON asset
 * rather than as an object literal compiled into the boot chunk. That is worth
 * the move on its own: `JSON.parse` is several times faster than the JavaScript
 * parser over the same bytes, the fetch runs concurrently with the rest of the
 * boot rather than inside it, and the file is then cached and revalidated on
 * its own hash instead of being re-downloaded whenever unrelated code near it
 * changes.
 *
 * `plates-credit.json` is deliberately NOT here despite being index tier: the
 * colophon prints it and renders nothing else that fetches, and attribution
 * that arrives over the network is attribution that can fail to arrive. It is
 * 495 bytes. The same goes for the other small eager files — under 20 KB each,
 * where a request costs more than the parse.
 */
export function ensureCoreIndex(): Promise<void> {
	return primeOnce('core', async () => {
		const [works, abbreviations] = await Promise.all([
			fetchIndexFile<Record<string, WorkManifest>>(single(realIndexManifestsUrl), 'manifests'),
			fetchIndexFile<Record<string, CccAbbreviation[]>>(
				single(realIndexSocialDoctrineAbbreviationsUrl),
				'social-doctrine-abbreviations'
			)
		]);
		Object.assign(manifests, works ?? {});
		Object.assign(socialDoctrineAbbreviations, abbreviations ?? {});
		indexPrimed.add('core');
	});
}

/** Every per-work-type index at once, for the readers that range over the whole
 *  corpus rather than over one work — the jump box's suggester and the link
 *  preview, which cannot know which tier a fragment or an href will land in. */
export function ensureAllIndexes(): Promise<void> {
	return Promise.all([
		ensureBibleIndex(),
		ensureCccIndex(),
		ensureCompendiumIndex(),
		ensureSummaIndex(),
		ensureDocumentIndex(),
		ensurePrayerIndex()
	]).then(() => undefined);
}

async function buildContentIndex(): Promise<void> {
	// Under fixtures there is no content tier to locate: `corpus.ts` passes both
	// a fixture and a location to `fetchTier` and reads the fixture, so every
	// table below would be built and then never consulted. Bailing here is not
	// just the saving — it is what keeps `npm test` off the glob entirely. The
	// module resolves `?url` for all 9,733 content files, which a build folds
	// into one chunk but vite-node transforms on demand, and two content-tier
	// tests timed out at 5 s the first time anything awaited it.
	if (!USE_REAL_CORPUS) {
		contentIndexBuilt = true;
		return;
	}
	const { contentUrlByRelPath } = await import('./content-urls');
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
	contentIndexBuilt = true;
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
	requireContentIndex('bibleChapterLocation');
	return bibleChapterChunkFor(workId, osis, n);
}

/** Every chunk of one book, in chapter order — for a whole-book read. Nothing
 *  needs it today (`getChapter` is this tier's only reader and wants one
 *  chapter), but it is what makes "download this book for offline" expressible
 *  as a book rather than as a list of chunk paths. */
export function bibleBookLocations(workId: string, osis: string): ContentLocation[] {
	requireContentIndex('bibleBookLocations');
	return locationsInChunkOrder(bibleChapterLocations[workId]?.[osis]);
}

export function cccChunkLocation(workId: string, n: number): ContentLocation | undefined {
	requireContentIndex('cccChunkLocation');
	return cccChunkLocations[workId]?.[cccChunkStartFor(n)];
}

/** The one chunk question `n` lives in. */
export function compendiumChunkLocation(workId: string, n: number): ContentLocation | undefined {
	requireContentIndex('compendiumChunkLocation');
	return compendiumChunkLocations[workId]?.[compendiumChunkStartFor(n)];
}

/** Every chunk of one edition, in question order — for a range read that
 *  spans the whole work. */
export function compendiumChunkLocationsFor(workId: string): ContentLocation[] {
	requireContentIndex('compendiumChunkLocationsFor');
	return locationsInChunkOrder(compendiumChunkLocations[workId]);
}

export function summaQuestionLocation(
	workId: string,
	partSlug: string,
	n: number
): ContentLocation | undefined {
	requireContentIndex('summaQuestionLocation');
	return summaQuestionLocations[workId]?.[partSlug]?.[n];
}

/** How many unnumbered units a document has; 0 when it has none. */
export function documentAppendixUnits(workId: string): number {
	return documentAppendixUnitCounts[workId] ?? 0;
}

/** A document's unnumbered matter, when it has any. */
export function documentAppendixLocation(workId: string): ContentLocation | undefined {
	requireContentIndex('documentAppendixLocation');
	return documentAppendixLocations[workId];
}

/** A document's outline. `undefined` means the work was never built, not that
 *  it has no headings — the sync writes the file even when the tree is empty,
 *  precisely so the two stay distinguishable. */
export function documentStructureLocation(workId: string): ContentLocation | undefined {
	requireContentIndex('documentStructureLocation');
	return documentStructureLocations[workId];
}

/** The one chunk section `n` lives in — for a single-section read (a link
 *  preview), which must not pay for the whole document. */
export function documentChunkLocation(workId: string, n: number): ContentLocation | undefined {
	requireContentIndex('documentChunkLocation');
	return documentChunkLocationsByWork[workId]?.[documentChunkStartFor(n)];
}

/** Every chunk of a document, in section order — for the continuous reading
 *  view, which needs all of them. See `locationsInChunkOrder` for why the
 *  numeric key, not insertion order, decides. */
export function documentChunkLocations(workId: string): ContentLocation[] {
	requireContentIndex('documentChunkLocations');
	return locationsInChunkOrder(documentChunkLocationsByWork[workId]);
}

export function bibleIntroLocation(workId: string): ContentLocation | undefined {
	requireContentIndex('bibleIntroLocation');
	return bibleIntroLocations[workId];
}

/** Where `workId`'s plate list lives, or undefined when the corpus has no
 *  such collection built — the ordinary case under fixtures. */
export function plateContentLocation(workId: string): ContentLocation | undefined {
	requireContentIndex('plateContentLocation');
	return plateLocations[workId];
}

export function prayerContentLocation(workId: string): ContentLocation | undefined {
	requireContentIndex('prayerContentLocation');
	return prayerLocations[workId];
}
