/**
 * What the jump box offers while the reader is still typing.
 *
 * The box has always been a PARSER: `refparse.ts` reads a finished citation,
 * `book-token.ts` resolves its book, and Enter navigates or says "no match".
 * That serves a reader who already knows the address and can spell it. It
 * serves nobody else — and nobody else could reach a prayer, a document or a
 * Summa question at all, because those are addressed by slug and no reader
 * types `/documenta/lumen-gentium`.
 *
 * This module is the other half: given a fragment, every canonical address it
 * could be the beginning of. The address space it enumerates is the SITEMAP's
 * (`scripts/sitemap.mjs`) — Bible chapters and verses, Catechism paragraphs
 * and chapters, Compendium questions and chapters, documents, prayers, Summa
 * questions, and the section landing pages — because that is the one place
 * the whole of it is already stated, and a suggester that offered less would
 * be a second, quietly smaller answer to "what is addressable here".
 *
 * WHAT IT COMPLETES IS THE READER'S OWN NOTATION, not English. The forms come
 * from `refs-grammar.ts`'s per-language tables through `grammarSurface` — the
 * same tables `parseRefs` links the corpus's printed citations with — so a
 * French reader typing `Jn` is completing *Jean*, an Italian reader typing
 * `Gv` is completing *Giovanni*, and the separator offered between chapter
 * and verse is the one that language prints (`3:16` against `3,16`). Sharing
 * the parser's tables is not tidiness: a form the suggester completes and the
 * parser then fails to resolve would offer an address that does not exist.
 *
 * THE GRAMMAR TABLE IS FIRST, NOT ONLY. Behind it every edition's own stored
 * `abbrevs` and `name` are matched too, ranked below, for the same reason
 * `book-token.ts` matches names as well as abbreviations: the five interface
 * languages with no grammar config (`hu`, `ro`, `sl`, `sv`, `en-gb`) would
 * otherwise complete nothing but English, and a reader who types the
 * abbreviation their own edition prints should not be told it is not a book.
 *
 * NOTHING HERE READS TEXT. Every source is the index tier the app already has
 * in memory — manifests, structures, question and paragraph numbers, book
 * metadata — so a keystroke costs no fetch, and the suggester works offline
 * exactly as the rest of the shell does. It is deliberately NOT a full-text
 * search: it completes addresses, and an address is what this site's URLs
 * name.
 *
 * DIVERGENT NUMBERING IS OFFERED, NOT GUESSED. `docs/link-surface.md`'s
 * standing warning is that a wrong chapter does not fail an existence check —
 * `Ps 23` resolves to real but wrong text. `refparse.ts` answers it by
 * converting Psalms/Malachi/Joel unconditionally, which is right for a
 * parser, which has one answer to give. A suggester has a list, so a typed
 * `ps 23` offers BOTH the Vulgate address that citation means (Psalm 22) and
 * the literal one, converted first, each labelled by where it actually goes.
 * The reader disambiguates by reading, which is the one thing this surface
 * can do that the parser cannot.
 */

import { hrefFor, summaPartFromSlug, summaPartSlug, type Address } from './address';
import {
	canonLawCanonExists,
	canonLawLangs,
	cccLangs,
	cccParagraphExists,
	compendiumLangs,
	compendiumQuestionExists,
	defaultDocumentWorkId,
	documentSectionExists,
	getBook,
	getCanonicalBook,
	getCccChapterFor,
	getCompendiumChapterFor,
	getDocumentManifest,
	listBibleWorks,
	listBooks,
	listCccChapters,
	listCompendiumChapters,
	listDocuments,
	listPrayerMeta,
	listSummaQuestions,
	prayerIndexLang,
	socialDoctrineLangs,
	socialDoctrineParagraphExists,
	summaLangs,
	summaQuestionExists,
	PREFERRED_EDITION,
	baseLang,
	contentLangChain
} from './corpus';
import { expandRun } from './corpus-index';
import { boundedEdit } from './edit-distance';
import { i18n, isUiLang, loadedDictionary, UI_LANGS } from './i18n.svelte';
import sectionNamesTable from './section-names.json';
import { normalizeBookToken, parseReference } from './refparse';
import { grammarSurface } from './refs-grammar';
import { summaQuestionLabel } from './summa-titles';
import { documentHeadingParts, displayTitle } from './titles';
import { canonLawHeadingHref, canonLawHeadingParts } from './canonLawNav';
import { socialDoctrineHeadingHref } from './socialDoctrineNav';
import { EMPTY_SECTION_HEADINGS, type HeadingRow, type SectionHeadings } from './section-headings';
import type { TopicIndex } from './types';
import { isDivergentBook, resolveVulgate, toVulgateCandidates } from './versification';
import type { StructureNode } from './types';

export type SuggestionKind =
	| 'bible'
	| 'ccc'
	| 'cccChapter'
	| 'compendium'
	| 'compendiumChapter'
	| 'canonLaw'
	| 'document'
	| 'prayer'
	| 'socialDoctrine'
	| 'summa'
	| 'section'
	/** A heading printed inside a work — a document's section, one of the
	 *  Code's titles, a division of the Compendium of the Social Doctrine. */
	| 'heading'
	/** A question on `/quaestiones`, which is a door onto the works rather
	 *  than a unit of any of them. */
	| 'topic';

export interface Suggestion {
	/** The canonical URL, written by `hrefFor` and by nothing else. */
	href: string;
	kind: SuggestionKind;
	/** The address as this reader's language spells it — "John 3:16", "Jo 3,16". */
	label: string;
	/** Where it sits, or what it is: a chapter title, a pontiff, an edition. */
	detail?: string;
	/** Which work this belongs to, already translated — the row's quiet badge. */
	badge: string;
	/**
	 * What to put in the box when the reader completes this row with Tab.
	 *
	 * USUALLY THE LABEL, AND NOT DEFINABLE AS IT. A completion is an INPUT and
	 * a label is an OUTPUT, and the two part company wherever the label is
	 * prettier than the grammar: "Summa II-II, Q 184" reads well and parses as
	 * nothing (`SUMMA_RE` knows no `Q`), and "Genesis · Introduction" is not a
	 * chapter number. Every row states its own, and `suggest.test.ts` asserts
	 * the property that makes Tab safe — feeding a completion back in offers
	 * that same address again, first.
	 *
	 * ONE EXCEPTION, AND IT IS THE CORPUS'S RATHER THAN THIS MODULE'S: the
	 * Compendium reproduces the Catechism's structure headings verbatim, so
	 * "The Profession of Faith" is the honest and complete name of two
	 * different chapter addresses. Both rows carry the same completion, both
	 * stay visible after Tab, and the reader picks — which is the same answer
	 * this module gives everywhere else it cannot know what was meant.
	 */
	completion: string;
}

export interface SuggestOpts {
	/** Interface language: which grammar completes the citation, which
	 *  dictionary names the works. Defaults to whatever the reader has set. */
	lang?: string;
	/** The Bible edition the reader currently has open, which breaks ties over
	 *  a token two editions both claim (`jn` is John in English and Jonas in
	 *  Portuguese — `book-token.ts` documents the inversion). */
	bibleWorkId?: string;
	/** Content languages, as the reader currently has them. Each falls back to
	 *  the interface language's own chain when not given. */
	cccLang?: string;
	compendiumLang?: string;
	prayerLang?: string;
	socialDoctrineLang?: string;
	canonLawLang?: string;
	summaLang?: string;
	/**
	 * The headings printed inside the works, as `corpus.ts`'s
	 * `loadSectionHeadings` hands them over — the reader's own shard, already
	 * resolved to one edition per work.
	 *
	 * AN ARGUMENT AND NOT A REGISTRY READ, which is this module's own rule
	 * about its language stated for a table: a function that half-reads its
	 * inputs from a global is one nobody can test, and the shard is fetched
	 * rather than resident, so a registry would also make every caller wonder
	 * whether it had arrived. Absent, the box completes names alone, exactly
	 * as it did before the shards existed.
	 */
	headings?: SectionHeadings;
	/** The topic list (`corpus.ts`'s `loadQuaestiones`), for the same reason
	 *  and on the same terms. What is matched is in the DICTIONARIES — a
	 *  topic's title, its question and a line of keywords nobody sees — so
	 *  this carries only which topics this build published. */
	topics?: TopicIndex;
	/** How many rows the caller will draw. */
	limit?: number;
}

const DEFAULT_LIMIT = 8;

/**
 * Score bands, high to low. Only the ORDER matters; the gaps exist so a
 * within-band tie-break (a shorter title, an earlier book) can never lift a
 * row past the band above it.
 */
const SCORE = {
	/** A complete, existing reference — what Enter would already have done. */
	exactReference: 1000,
	/** The number typed names a unit that exists. */
	exactUnit: 900,
	/** A title spelled in full — which is where a SIGLUM lands too, since a
	 *  siglum is one of the names this language calls that document by, and
	 *  `LG` is spelled in full at two letters. */
	titleExact: 800,
	/** The digits typed are the start of a longer number that exists. */
	numericPrefix: 700,
	/** A book named with no number yet. */
	bookOnly: 660,
	titlePrefix: 600,
	titleWord: 480,
	titleSubstring: 380,
	/** A name matched loosely — a typo, or an abbreviation of the reader's own
	 *  invention ("lumgen"). Below every literal reading, and one band, so
	 *  fuzzy rows are ordered among THEMSELVES by the matcher's score and can
	 *  never interleave with rows something actually read. */
	titleFuzzy: 340,
	/** A section's own landing page. */
	landing: 300,
	/** The same, matched loosely. Below the prefix band, unlike titles: there
	 *  are six sections and their names are short, so a loose reading of one is
	 *  the weakest thing this module offers. */
	landingFuzzy: 290,
	/**
	 * A question on `/quaestiones`, and every heading printed inside a work,
	 * sit in bands of their own BELOW everything above.
	 *
	 * The order is how directly the row answers a typed name. A work's own
	 * title names the work; a section landing page names a shelf of them; a
	 * topic is a door onto passages of several works, written here rather
	 * than published by anyone; a heading is one line inside one edition, and
	 * there are five thousand of them against fifteen hundred names. So a
	 * reader typing `mercy` is offered the works called that before the
	 * chapters that mention it, which is the order they would read a
	 * catalogue in.
	 *
	 * Within a band the tier still decides — `banded` folds `titleScore`'s
	 * own answer into the low digits — so an exact heading beats a substring
	 * one and no heading can climb out of the band.
	 */
	topic: 270,
	heading: 240
} as const;

/**
 * A candidate's score, moved into its band.
 *
 * `titleScore` answers in hundreds (800 exact … 380 substring) and the bands
 * are ten apart, so the tier is divided down to a single digit and added.
 * A loose reading lands one point BELOW the band's floor, which is the same
 * relation `titleFuzzy` has to the literal tiers.
 */
function banded(band: number | undefined, score: number): number {
	return band === undefined ? score : band + Math.round(score / 100);
}

function bandedFuzzy(band: number | undefined, score: number): number {
	return band === undefined ? SCORE.titleFuzzy + score : band - 1 + score;
}

/** How many rows one producer may contribute before it starts crowding the others. */
const PER_PRODUCER_CAP = 6;

/** Case- and accent-insensitive. The last tier of book matching and the only
 *  tier of title matching — see `book-token.ts` on why accents are folded
 *  late rather than early (`jó` is Job, `jo` is John).
 *
 *  Exported for `highlight.ts`, which has to fold per code point to keep an
 *  index map back to the original and therefore cannot call this — its test
 *  asserts the two agree, which is the coupling that matters. */
export function fold(s: string): string {
	return s
		.normalize('NFD')
		.replace(/\p{Mn}/gu, '')
		.toLowerCase();
}

/**
 * Loose matching, injected rather than imported.
 *
 * WHY INJECTED. `fuzzysort` is 7.5 KB gzipped and `JumpBox` sits in the layout
 * header, so importing it here would put it in the boot chunk every route
 * `modulepreload`s — the same cost `corpus-index.ts` goes to such lengths to
 * keep the corpus out of. The box loads it when it OPENS and calls
 * `setFuzzyRanker`; until then the literal tiers below answer alone, which is
 * what a reader sees for the first keystroke and never notices. This is
 * `refs-grammar.ts`'s `setDocumentTitleSource` arrangement, for the same
 * reason: the module that must stay cheap declares what it needs and the
 * caller supplies it.
 *
 * OFFLINE IS NOT THE CASUALTY IT LOOKS LIKE. `sw-policy.ts` precaches every
 * emitted build asset except corpus content, and a lazily-imported chunk is an
 * ordinary build asset, so the ranker is on disk before a reader is ever
 * offline.
 *
 * THE RANKER SCORES, IT DOES NOT RANK THE LIST. Everything it returns lands in
 * one score band beneath every literal reading (see `SCORE.titleFuzzy`), so a
 * matcher that is confidently wrong can reorder its own rows and nothing else.
 * That is deliberate: fuzzy matching is a long tail competing for eight
 * visible rows, and the tiers above it are evidence rather than guesses.
 */
export interface FuzzyTarget {
	/** Folded text to match against — see `fold`. */
	text: string;
	/** Which candidate this form belongs to; several forms share one. */
	index: number;
}

export type FuzzyRanker = (
	needle: string,
	haystack: readonly FuzzyTarget[]
) => { index: number; score: number }[];

let fuzzyRanker: FuzzyRanker | undefined;

/** Supply (or, with `undefined`, withdraw) the loose matcher. */
export function setFuzzyRanker(ranker: FuzzyRanker | undefined): void {
	fuzzyRanker = ranker;
}

/**
 * Below this, a query is too short to be matched loosely.
 *
 * Two characters already reach most of a 450-document corpus by prefix alone,
 * which is why the interior-substring tier needs four; a loose reading of two
 * characters reaches all of it. Three is where a query starts to carry enough
 * shape for a gap-penalised match to mean anything.
 */
const MIN_FUZZY_LENGTH = 3;

/** Rank one haystack, best score per candidate index. `[]` when no ranker has
 *  been supplied, which is the whole of what "fuzzy is optional" means here. */
function fuzzyHits(needle: string, haystack: readonly FuzzyTarget[]): Map<number, number> {
	const best = new Map<number, number>();
	if (!fuzzyRanker || needle.length < MIN_FUZZY_LENGTH) return best;
	for (const hit of fuzzyRanker(needle, haystack)) {
		best.set(hit.index, Math.max(best.get(hit.index) ?? 0, hit.score));
	}
	return best;
}

/** Split a folded string into the words a "matches at a word start" test needs. */
function words(folded: string): string[] {
	return folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/**
 * A UI string, in the language THIS CALL was made for.
 *
 * Not `t()`, which reads the store: `suggest` takes its language as an
 * argument, and a function whose output half-follows its argument and
 * half-follows a global is a function nobody can test. The two agree in the
 * app — the component passes `i18n.lang` — and they must be free not to.
 *
 * The fallback is `t()`'s own: English fills any key a dictionary leaves out,
 * and a content language that is not an interface language has no dictionary
 * at all.
 */
function tr(key: string, lang: string): string {
	const tag = baseLang(lang);
	// `loadedDictionary` and not `dictionaryFor`: the latter is async since the
	// dictionaries went lazy, and this is called from a render. It needs no
	// await — the only language it is ever asked for is the reader's own,
	// which `+layout.ts` awaited before the first render, and English, which
	// is never not resident. A language somehow not yet loaded degrades to
	// English here, exactly as `t()` does.
	const dict = isUiLang(tag) ? loadedDictionary(tag) : undefined;
	return dict?.[key] ?? loadedDictionary('en')?.[key] ?? key;
}

interface Scored extends Suggestion {
	score: number;
	/** Within one score band, the producer's own natural order (book order,
	 *  unit number, corpus order) — so the list is stable rather than
	 *  alphabetical by accident. */
	order: number;
}

// --------------------------------------------------------------------------
// Context: the languages and editions one call runs against.
// --------------------------------------------------------------------------

interface Context {
	lang: string;
	bibleWorkIds: string[];
	cccLang: string;
	compendiumLang: string;
	prayerLang: string;
	socialDoctrineLang: string;
	canonLawLang: string;
	summaLang: string;
	headings: SectionHeadings;
	topics: TopicIndex | undefined;
	limit: number;
	sep: string;
	/**
	 * The query named a section (`parseSectionFilter`), so a producer may
	 * spend the whole list on one work.
	 *
	 * The per-kind caps below exist to stop one producer crowding the others
	 * in a list of eight — four titles of a kind, four headings, three topics.
	 * Under a scope there are no others to crowd: everything that survives the
	 * filter belongs to the section the reader named, and a cap then hides
	 * answers to the question they asked in order to leave room for rows that
	 * have already been dropped.
	 */
	scoped: boolean;
}

/** The first content language of `chain` that `available` actually carries. */
function pickLang(available: string[], chain: string[]): string {
	for (const candidate of chain) {
		const exact = available.find((tag) => tag === candidate);
		if (exact) return exact;
		const base = available.find((tag) => baseLang(tag) === baseLang(candidate));
		if (base) return base;
	}
	return available[0] ?? '';
}

/**
 * Bible editions in the order a token should be read against them, and — the
 * reason this list exists at all — in the order a BOOK should be named from.
 *
 * `book-token.ts`'s `orderedWorkIds` answers a neighbouring question (which
 * edition may claim an ambiguous token) and ranks the reader's own edition,
 * then `PREFERRED_EDITION`, then registry order. That is not enough here,
 * because registry order is alphabetical by work id and therefore silently
 * editorial: with no explicit preference it put the Clementine first, and an
 * English reader typing `jn 3,16` was offered "Joannes 3:16".
 *
 * So LANGUAGE ranks above the preferred-edition table: the reader's own
 * content-language chain first (`CONTENT_LANG_FALLBACK`, the same chain that
 * decides which edition a page renders), and the table breaks ties inside one
 * language, which is the only thing it was ever written to do.
 */
function orderedBibleWorkIds(lang: string, preferWorkId?: string): string[] {
	const chain = contentLangChain(lang).map(baseLang);
	const ids = listBibleWorks()
		.map((work, index) => {
			const position = chain.indexOf(baseLang(work.language));
			return {
				id: work.id,
				langRank: position === -1 ? chain.length : position,
				editionRank: PREFERRED_EDITION[`bible:${baseLang(work.language)}`] === work.id ? 0 : 1,
				index
			};
		})
		.sort((a, b) => a.langRank - b.langRank || a.editionRank - b.editionRank || a.index - b.index)
		.map((work) => work.id);
	if (!preferWorkId || !ids.includes(preferWorkId)) return ids;
	return [preferWorkId, ...ids.filter((id) => id !== preferWorkId)];
}

function resolveContext(opts: SuggestOpts, scoped: boolean): Context {
	const lang = opts.lang ?? i18n.lang;
	const chain = contentLangChain(lang);
	return {
		lang,
		bibleWorkIds: orderedBibleWorkIds(lang, opts.bibleWorkId),
		cccLang: opts.cccLang ?? pickLang(cccLangs(), chain),
		compendiumLang: opts.compendiumLang ?? pickLang(compendiumLangs(), chain),
		prayerLang: opts.prayerLang ?? prayerIndexLang(lang),
		socialDoctrineLang: opts.socialDoctrineLang ?? pickLang(socialDoctrineLangs(), chain),
		canonLawLang: opts.canonLawLang ?? pickLang(canonLawLangs(), chain),
		summaLang: opts.summaLang ?? pickLang(summaLangs(), chain),
		headings: opts.headings ?? EMPTY_SECTION_HEADINGS,
		topics: opts.topics,
		limit: opts.limit ?? DEFAULT_LIMIT,
		sep: grammarSurface(lang).chapterVerseSep,
		scoped
	};
}

// --------------------------------------------------------------------------
// Books: every surface form, in tiers.
// --------------------------------------------------------------------------

interface BookForm {
	/** `normalizeBookToken` shape, accents KEPT — the tier that can tell `jó`
	 *  from `jo`. */
	norm: string;
	/** The same, accent-folded — the tier that serves a reader who did not type
	 *  the accent, and which therefore must never outrank the one above. */
	folded: string;
	osis: string;
	/** 0 = this language's grammar table, 1 = an edition's own abbreviation or
	 *  OSIS code, 2 = an edition's display name. */
	tier: 0 | 1 | 2;
}

/**
 * Every spelling of every book, for one interface language.
 *
 * Memoized per language because it is the same list on every keystroke and
 * rebuilding it means walking each edition's 73 books on top of a grammar
 * table that is ~1,400 forms in English. Keyed by language alone: the edition
 * ORDER varies with the reader's preference, the set of forms does not, and
 * the preference is applied at match time instead.
 */
const bookFormsByLang = new Map<string, BookForm[]>();

function bookForms(lang: string): BookForm[] {
	const cached = bookFormsByLang.get(lang);
	if (cached) return cached;

	const out: BookForm[] = [];
	const seen = new Set<string>();
	const add = (form: string, osis: string, tier: 0 | 1 | 2) => {
		const norm = normalizeBookToken(form);
		if (!norm) return;
		const key = `${norm}\u0000${osis}\u0000${tier}`;
		if (seen.has(key)) return;
		seen.add(key);
		out.push({ norm, folded: fold(norm), osis, tier });
	};

	for (const [form, osis] of grammarSurface(lang).books) add(form, osis, 0);
	for (const work of listBibleWorks()) {
		for (const book of listBooks(work.id)) {
			add(book.osis, book.osis, 1);
			for (const abbrev of book.abbrevs) add(abbrev, book.osis, 1);
			add(book.name, book.osis, 2);
		}
	}

	bookFormsByLang.set(lang, out);
	return out;
}

/** A string's characters in a fixed order — two strings share one exactly when
 *  each is a rearrangement of the other. */
function sortedLetters(s: string): string {
	return [...s].sort().join('');
}

/**
 * How wrong a book token may be, by how much of it there is.
 *
 * Measured against the 258 forms the English editions carry. Nothing below
 * four characters is read loosely at all, because at three a single edit
 * reaches most of the canon — `jo` alone is within one of Joshua, Job,
 * Jeremiah and John, and it is a LITERAL reading of John, which is exactly the
 * inversion `book-token.ts` warns about. One edit up to six characters and two
 * above: `jonh`, `jhon`, `psalsm` and `mathew` are one; `corinthans` is two
 * (an `i` and the missing ordinal), and at ten characters two edits still
 * reach nothing else.
 *
 * The distance itself is `edit-distance.ts`, shared with `highlight.ts`; this
 * bound is not, and its docblock says why.
 */
function maxBookEdits(length: number): number {
	if (length < 4) return 0;
	return length <= 6 ? 1 : 2;
}

/**
 * The books a partly-typed token could name, best first.
 *
 * The tiers are `book-token.ts`'s, one rung finer: an exact reading still
 * beats a folded one and an abbreviation still beats a display name, but a
 * PREFIX of an exact form sits between them, because that is the whole point
 * of a suggester — `gene` is not a book and Genesis is the only thing it can
 * become.
 */
interface BookMatch {
	osis: string;
	score: number;
	/** Read through a misspelling rather than read. Every row built on one is
	 *  demoted into the fuzzy band as a block, and the shapes that promise an
	 *  exact address (`exactReference`) refuse it outright. */
	loose: boolean;
}

function matchBooks(token: string, ctx: Context): BookMatch[] {
	const norm = normalizeBookToken(token);
	if (!norm) return [];
	const folded = fold(norm);
	const forms = bookForms(ctx.lang);
	const best = new Map<string, number>();

	for (const form of forms) {
		let score: number;
		if (form.norm === norm) score = 100;
		else if (form.norm.startsWith(norm)) score = 70;
		else if (form.folded === folded) score = 55;
		else if (form.folded.startsWith(folded)) score = 35;
		else continue;
		// A form the reader's own grammar table carries outranks one only an
		// edition's metadata knows, without ever crossing a tier boundary above.
		score -= form.tier * 4;
		best.set(form.osis, Math.max(best.get(form.osis) ?? 0, score));
	}

	// ONLY WHEN NOTHING WAS READ. A misspelling is evidence of last resort, and
	// a token that spells a real book is never also a near-miss of another one
	// — `jo` would otherwise drag Joshua, Job and Jeremiah in behind the John
	// it actually names.
	const loose = best.size === 0;
	if (loose) {
		const max = maxBookEdits(folded.length);
		const letters = sortedLetters(folded);
		for (const form of forms) {
			if (max === 0) break;
			const distance = boundedEdit(folded, form.folded, max);
			if (distance === null) continue;
			// THE RIGHT LETTERS IN THE WRONG ORDER BEAT A WRONG LETTER, and it
			// is what separates the three books `jonh` is one edit from. Joshua
			// and Jonah are reached by changing a letter or dropping one, which
			// is also how one reaches a DIFFERENT book; John is reached by
			// rearranging the letters that were typed, which is only how one
			// mistypes the word one meant. Same letters and same length is the
			// cheap test for that, and it needs no backtrack through the matrix.
			const rearranged =
				folded.length === form.folded.length && sortedLetters(form.folded) === letters;
			// 0..100 like the tiers above, so the caller's `score / 100`
			// tie-break keeps working; nearer is better, and a form the grammar
			// table carries still edges out one only an edition knows.
			const score =
				Math.round(100 * (1 - distance / (folded.length + 1))) - form.tier + (rearranged ? 2 : 0);
			best.set(form.osis, Math.max(best.get(form.osis) ?? 0, score));
		}
	}

	return [...best.entries()]
		.map(([osis, score]) => ({ osis, score, loose }))
		.sort(
			(a, b) =>
				b.score - a.score ||
				(getCanonicalBook(a.osis)?.order ?? 0) - (getCanonicalBook(b.osis)?.order ?? 0)
		);
}

/** A book's name in the reader's own edition, falling through the same edition
 *  order a token is resolved in. `CanonicalBook` carries one name per edition
 *  for exactly this. */
function bookName(osis: string, ctx: Context): string {
	const names = getCanonicalBook(osis)?.namesByWorkId ?? {};
	for (const workId of ctx.bibleWorkIds) {
		if (names[workId]) return names[workId];
	}
	return Object.values(names)[0] ?? osis;
}

function chapterExists(osis: string, chapter: number): boolean {
	return getCanonicalBook(osis)?.chapters.includes(chapter) ?? false;
}

/** Verse numbers this chapter has in ANY edition, ascending. The destination is
 *  edition-free, so a verse one edition carries is an address.
 *
 *  The one caller that legitimately EXPANDS a stored run rather than asking
 *  the accessors a question about it: the jump box offers every verse of the
 *  chapter as a completion, so the numbers themselves are the answer. It is
 *  also the one such caller off the boot path — `JumpBox` lazy-imports this
 *  module, and nothing expands until a reader has opened the box and typed. */
function versesOf(osis: string, chapter: number): number[] {
	const out = new Set<number>();
	for (const work of listBibleWorks()) {
		const chapters = getBook(work.id, osis)?.chapters ?? [];
		const verses = chapters.find((c) => c.n === chapter)?.verses;
		if (verses === undefined) continue;
		for (const verse of expandRun(verses)) out.add(verse);
	}
	return [...out].sort((a, b) => a - b);
}

/**
 * The numbers a typed digit-prefix could be growing into, exact reading first.
 *
 * A reader who has typed one digit has said almost nothing, so the expansion is
 * capped and never displaces the number they may already have finished typing.
 */
function numericCompletions(typed: string, available: number[], cap: number): number[] {
	const exact = Number(typed);
	const out: number[] = [];
	if (available.includes(exact)) out.push(exact);
	for (const n of available) {
		if (out.length >= cap) break;
		if (n !== exact && String(n).startsWith(typed)) out.push(n);
	}
	return out;
}

/** The label a Bible address wears: the book as the reader's edition names it,
 *  the chapter, and — in this language's own punctuation — the verse. */
function bibleLabel(
	osis: string,
	chapter: number,
	verse: number | undefined,
	ctx: Context
): string {
	const name = bookName(osis, ctx);
	// Chapter 0 is a book introduction (docs/corpus-schema.md), which is an
	// address but not a chapter anyone cites by number.
	if (chapter === 0) return `${name} · ${tr('bible.introduction', ctx.lang)}`;
	return verse === undefined ? `${name} ${chapter}` : `${name} ${chapter}${ctx.sep}${verse}`;
}

/**
 * A Bible address, with the divergent-numbering question answered by offering
 * both readings rather than picking one — see the module docblock.
 *
 * Returns candidates in the order they should be shown: the address the
 * citation MEANS (what `refparse.ts` would navigate to) ahead of the address
 * the digits literally spell, and only those that exist.
 */
function bibleAddresses(
	osis: string,
	chapter: number,
	verse: number | undefined
): { chapter: number; verse?: number }[] {
	const exists = (o: string, c: number, v?: number) =>
		v === undefined ? chapterExists(o, c) : versesOf(o, c).includes(v);

	const out: { chapter: number; verse?: number }[] = [];
	const push = (c: number, v?: number) => {
		if (!exists(osis, c, v)) return;
		if (out.some((a) => a.chapter === c && a.verse === v)) return;
		out.push(v === undefined ? { chapter: c } : { chapter: c, verse: v });
	};

	const converted = resolveVulgate(osis, chapter, verse, exists);
	if (converted) push(converted.chapter, converted.verse);
	push(chapter, verse);
	return out;
}

/**
 * The Hebrew/Masoretic chapter that maps onto a Vulgate one, by search.
 *
 * `versification.ts` maps one way only, which is the direction everything else
 * needs; this is the one caller that needs the other, and searching 200
 * chapters through the same tables is exact where a second, hand-written
 * inverse table would be a place for the two to disagree. Called only for the
 * three divergent books, and only when a row is built.
 *
 * Falls back to the Vulgate number itself where nothing maps onto it (the
 * splits and merges around Psalm 147 leave such chapters). A dual citation
 * that prints one number twice is redundant, not wrong — the parser takes the
 * lower of the pair either way.
 */
function hebrewChapterFor(osis: string, vulgateChapter: number): number {
	for (let hebrew = 1; hebrew <= 200; hebrew++) {
		if (toVulgateCandidates(osis, hebrew)[0]?.chapter === vulgateChapter) return hebrew;
	}
	return vulgateChapter;
}

/**
 * What to type to reach this address again, said so that reading it back
 * cannot convert it a second time.
 *
 * THE ROUND TRIP IS WHERE THE DIVERGENT BOOKS BITE, and the completion test
 * found it across five languages: a row labelled "Psalms 22" completes to
 * "Psalms 22", which is itself read as a Hebrew citation and converted to
 * Psalm 21 — so Tab moved the reader's own chosen row down the list. It is the
 * same double-conversion `address.ts` refuses to risk when it parses URLs with
 * regexes instead of replaying how they were built.
 *
 * The escape hatch is the sources' own: a dual citation, "Ps 22(23)", which
 * `refparse.ts` reads by taking the lower of the pair and — the part that
 * matters here — returns WITHOUT converting, because the reader has already
 * said which numbering they mean. Psalters print it exactly this way, so the
 * completion is not a machine-readable encoding leaking into the field; it is
 * the notation, and it tells a reader puzzled by the divergence both numbers.
 */
function bibleCompletion(
	osis: string,
	chapter: number,
	verse: number | undefined,
	ctx: Context
): string {
	const name = bookName(osis, ctx);
	const number = isDivergentBook(osis)
		? `${chapter}(${hebrewChapterFor(osis, chapter)})`
		: `${chapter}`;
	return verse === undefined ? `${name} ${number}` : `${name} ${number}${ctx.sep}${verse}`;
}

function bibleRow(
	osis: string,
	chapter: number,
	verse: number | undefined,
	score: number,
	order: number,
	ctx: Context
): Scored {
	const address: Address =
		verse === undefined
			? { kind: 'bible', osis, chapter }
			: { kind: 'bible', osis, chapter, from: verse, to: verse };
	return {
		href: hrefFor(address),
		kind: 'bible',
		label: bibleLabel(osis, chapter, verse, ctx),
		// The introduction's LABEL names it in words and its COMPLETION names
		// it as the chapter 0 the address actually is — which is a real query,
		// since `numericCompletions` reads the canonical chapter list and that
		// list carries 0 for a book that has one.
		completion: bibleCompletion(osis, chapter, verse, ctx),
		badge: tr('nav.bible', ctx.lang),
		score,
		order
	};
}

/**
 * A book, optionally with a chapter and a verse in progress.
 *
 * The shape is `refparse.ts`'s `BIBLE_RE` with everything after the book made
 * optional and the ranges dropped: a range is a finished citation, which
 * `exactReference` below hands to the parser that already reads them. The book
 * token may still lead with a digit (`1cor`, `2 sam`) or a Roman numeral,
 * which `normalizeBookToken` folds afterwards.
 */
const PARTIAL_BIBLE_RE = new RegExp(
	String.raw`^(\d?\s*\p{L}[\p{L}\s.'’]*?)` +
		String.raw`(?:\s*(\d{1,3})` +
		// Dual numbering, "Sl 22(23)" — the reader has stated which system they
		// mean, so nothing below converts. `refparse.ts` reads the same shape
		// the same way, and `bibleCompletion` writes it.
		String.raw`(?:\s*\((\d{1,3})\))?` +
		// `\u060C` is the Arabic comma, which is `CONFIG_AR`'s primary separator
		// and therefore what `bibleCompletion` writes for an Arabic reader. A
		// completion this expression could not read back was a round trip that
		// silently ended nowhere.
		String.raw`(?:\s*[:,.\u060C]\s*(\d{1,3}))?)?\s*$`,
	'iu'
);

function bibleSuggestions(query: string, ctx: Context): Scored[] {
	const match = PARTIAL_BIBLE_RE.exec(query);
	if (!match) return [];
	const [, bookRaw, chapterRaw, altChapterRaw, verseRaw] = match;
	// Across every divergence the Vulgate number is the lower of the pair, so
	// the minimum is right whichever order the psalter printed them in —
	// `refparse.ts` states the same rule at more length.
	const stated =
		altChapterRaw === undefined ? undefined : Math.min(Number(chapterRaw), Number(altChapterRaw));

	const books = matchBooks(bookRaw, ctx);
	if (books.length === 0) return [];
	const loose = books[0].loose;

	const out: Scored[] = [];
	let order = 0;

	// No number yet: name the books themselves. The address of a book is its
	// first chapter — there is no page for a book as such — and its
	// introduction is offered beside it only when one book is left standing,
	// where a second row is a choice rather than clutter.
	if (chapterRaw === undefined) {
		for (const { osis, score } of books.slice(0, PER_PRODUCER_CAP)) {
			const chapters = getCanonicalBook(osis)?.chapters ?? [];
			const first = chapters.find((n) => n > 0) ?? chapters[0];
			if (first === undefined) continue;
			out.push(bibleRow(osis, first, undefined, SCORE.bookOnly + score / 100, order++, ctx));
			if (books.length === 1 && chapters.includes(0)) {
				out.push(bibleRow(osis, 0, undefined, SCORE.bookOnly - 1, order++, ctx));
			}
		}
		return demote(out, loose);
	}

	// A number narrows the intent sharply, so fewer books stay in the running.
	for (const { osis, score } of books.slice(0, 3)) {
		const canonical = getCanonicalBook(osis);
		if (!canonical) continue;

		// `jude 3` is a VERSE: a one-chapter book has no chapter to cite, so
		// both conventions write "Book verse" (`refs.ts`'s
		// `SINGLE_CHAPTER_BOOKS`, and `JumpBox`'s own `singleChapterFixup`).
		//
		// THE GUARD IS "NOT A CHAPTER THIS BOOK HAS", not "not the one chapter
		// it has", and the difference is chapter 0. A book introduction is a
		// real address on a one-chapter book too, and reading `philem 0` as
		// verse 0 of chapter 1 loses it — found by the completion round-trip,
		// which fed `Genesis 0` back in and got nothing.
		const only = canonical.chapters.filter((n) => n > 0);
		const singleChapter = only.length === 1 ? only[0] : undefined;
		if (
			verseRaw === undefined &&
			singleChapter !== undefined &&
			!canonical.chapters.includes(Number(chapterRaw))
		) {
			for (const verse of numericCompletions(chapterRaw, versesOf(osis, singleChapter), 4)) {
				out.push(
					bibleRow(
						osis,
						singleChapter,
						verse,
						(String(verse) === chapterRaw ? SCORE.exactUnit : SCORE.numericPrefix) + score / 100,
						order++,
						ctx
					)
				);
			}
			continue;
		}

		// A stated pair is not a prefix and not a guess: exactly one chapter, and
		// the conversion `bibleAddresses` would apply is the thing the reader
		// wrote the pair to prevent.
		if (stated !== undefined) {
			if (!chapterExists(osis, stated)) continue;
			const verse = verseRaw === undefined ? undefined : Number(verseRaw);
			if (verse !== undefined && !versesOf(osis, stated).includes(verse)) continue;
			out.push(bibleRow(osis, stated, verse, SCORE.exactUnit + score / 100, order++, ctx));
			continue;
		}

		if (verseRaw === undefined) {
			for (const chapter of numericCompletions(chapterRaw, canonical.chapters, 5)) {
				for (const address of bibleAddresses(osis, chapter, undefined)) {
					out.push(
						bibleRow(
							osis,
							address.chapter,
							undefined,
							(String(chapter) === chapterRaw ? SCORE.exactUnit : SCORE.numericPrefix) +
								score / 100,
							order++,
							ctx
						)
					);
				}
			}
			continue;
		}

		// A verse is in progress, so the chapter is settled — and settled in the
		// numbering the reader typed, which for Psalms, Malachi and Joel is not
		// this corpus's. Both readings of the CHAPTER are followed, each with
		// its own verse list, so `ps 23:1` offers Psalm 22:1 and Psalm 23:1.
		for (const base of bibleAddresses(osis, Number(chapterRaw), undefined)) {
			for (const verse of numericCompletions(verseRaw, versesOf(osis, base.chapter), 4)) {
				out.push(
					bibleRow(
						osis,
						base.chapter,
						verse,
						(String(verse) === verseRaw ? SCORE.exactUnit : SCORE.numericPrefix) + score / 100,
						order++,
						ctx
					)
				);
			}
		}
	}

	return demote(out, loose);
}

/**
 * Every row built on a book that was only read through a misspelling, moved as
 * a block into the band loose matching already occupies.
 *
 * Their own order is kept — the numeric tiers still say which chapter the
 * reader most likely meant — but nothing here may sit beside a row something
 * actually read. `SCORE.exactUnit` is 900 and `jonh 3` is not an exact
 * anything; the quality of the reading (`score / 100`, so one edit in four
 * characters is 0.8) is what places the block among the other fuzzy rows, and
 * the thousandths keep the block's own order inside it.
 */
function demote(rows: Scored[], loose: boolean): Scored[] {
	if (!loose) return rows;
	const ordered = [...rows].sort((a, b) => b.score - a.score || a.order - b.order);
	return ordered.map((row, rank) => ({
		...row,
		score: SCORE.titleFuzzy + (row.score % 1) - rank / 1000,
		order: rank
	}));
}

/**
 * What Enter would already have done, promoted to the top of the list.
 *
 * `parseReference` reads the shapes this module's own matcher deliberately does
 * not — verse ranges, verse lists, `ff`/`ss` tails, dual Psalm numbering — so a
 * reader who types a complete citation sees it confirmed rather than
 * approximated. Everything it produces is checked for existence first: an
 * offered row is a promise that the address resolves.
 */
function exactReference(query: string, ctx: Context): Scored[] {
	const ref = parseReference(query);

	if (ref.kind === 'ccc') {
		return cccParagraphExists(ctx.cccLang, ref.n)
			? [cccRow(ref.n, SCORE.exactReference, 0, ctx)]
			: [];
	}

	if (ref.kind !== 'bible') return [];
	// A bare `<book> <chapter>` or `<book> <c>:<v>` is the partial matcher's
	// own case, where it can offer the alternative numbering as well; only the
	// shapes it cannot express are worth confirming here.
	if (ref.verseEnd === undefined && ref.chapterEnd === undefined) return [];

	// A LITERAL book only: this producer's whole promise is that the address it
	// confirms is the one the reader typed, and `SCORE.exactReference` is the
	// top band. A misspelled book with a verse range attached is a guess
	// wearing a certainty, so it is declined rather than demoted.
	const book = matchBooks(ref.book, ctx).find((match) => !match.loose);
	if (!book) return [];
	const canonical = getCanonicalBook(book.osis);
	if (!canonical) return [];

	const only = canonical.chapters.filter((n) => n > 0);
	const single = only.length === 1 ? only[0] : undefined;
	const asVerses =
		single !== undefined && ref.verse === undefined && ref.chapter !== single
			? { chapter: single, from: ref.chapter, to: ref.chapterEnd ?? ref.chapter }
			: undefined;

	const chapter = asVerses?.chapter ?? ref.chapter;
	if (!chapterExists(book.osis, chapter)) return [];

	const from = asVerses?.from ?? ref.verse;
	const to = asVerses?.to ?? ref.verseEnd ?? ref.verse;
	if (from === undefined) {
		// A chapter RANGE (`gen 1-3`): one address, its first chapter, because
		// no canonical URL spans chapters.
		return [bibleRow(book.osis, chapter, undefined, SCORE.exactReference, 0, ctx)];
	}

	const verses = versesOf(book.osis, chapter);
	if (!verses.includes(from)) return [];
	const end = Math.max(from, to ?? from);
	const label =
		end > from
			? `${bibleLabel(book.osis, chapter, from, ctx)}-${end}`
			: bibleLabel(book.osis, chapter, from, ctx);

	return [
		{
			href: hrefFor({ kind: 'bible', osis: book.osis, chapter, from, to: end }),
			kind: 'bible',
			label,
			// A range reads back through `parseReference`, which is where it was
			// read from — the label IS the grammar here.
			completion: label,
			badge: tr('nav.bible', ctx.lang),
			score: SCORE.exactReference,
			order: 0
		}
	];
}

// --------------------------------------------------------------------------
// The numbered works: Catechism and Compendium.
// --------------------------------------------------------------------------

/**
 * How a reader names a section of this site, in every interface language.
 *
 * Derived from the dictionaries rather than written out, for the reason
 * `refs-grammar.ts` gives for deriving its document-title index from the
 * manifests: there is no judgment to encode here — the word for the Catechism
 * in German is whatever the German dictionary already calls it — and a
 * hand-written table would drift the first time a translation was revised.
 *
 * EVERY LANGUAGE'S WORD IS ACCEPTED, not just the reader's. The interface
 * language decides what a row is LABELLED; it does not get to decide what the
 * reader is allowed to type, and a reader who knows the site as "Catecismo"
 * does not stop knowing it when they switch the chrome to English. The Latin
 * URL segments (`catechismus`, `compendium`, `documenta`, `preces`,
 * `scriptura`, `summa`) are in for the same reason — they are what the address
 * bar shows — as are the sigla a citation would actually use.
 */
interface SectionWords {
	kind: SuggestionKind;
	/**
	 * Where a bare keyword lands — this section's own index page.
	 *
	 * The Compendium's `path` was `/catechismus` until 2026-09-04, because it
	 * had no index of its own and the Catechism's presents both works a row at
	 * a time. It has one now (`routes/catechismus/compendium/`), so the two no
	 * longer name one address — but the dedupe below stays: it is what keeps a
	 * one-letter prefix that matches several sections from offering the same
	 * page under several names, which is a property of the matcher and not of
	 * any one section's path.
	 *
	 * IT IS ALSO WHAT FILES A ROW INTO A SECTION (`sectionPathOf`), which is
	 * how a scope knows what it holds. Deliberately the address and not a set
	 * of `SuggestionKind`s: `heading` is one kind belonging to three sections,
	 * so a kind list could not tell a title of the Code from a division of the
	 * Compendium of the Social Doctrine — where the address says so already,
	 * and says so for every row a producer will ever add.
	 */
	path: string;
	titleKey: string;
	/**
	 * The dictionary key holding the siglum this work is CITED by, where one
	 * exists -- read for every language for the same reason `titleKey` is.
	 *
	 * These are the forms a reader copies off a page rather than out of a
	 * menu: `KKK 27` is what the Swedish Compendium prints beside every one of
	 * its 577 reference lines, and `Comp.` is what this site's own sibling
	 * links render on the Catechism index. A reader who is shown a form and
	 * cannot type it back is the same defect as a form the box completes and
	 * `parseRefs` then fails to resolve, in the other direction.
	 *
	 * ONE OF THEM IS A REAL COLLISION AND BOTH READINGS ARE NOW OFFERED.
	 * Portuguese cites the Catechism as `CIC` (*Catecismo da Igreja Catolica*),
	 * which everywhere else is the *Codex Iuris Canonici*. This block used to
	 * say the corpus held no canon law, so `cic 27` had one possible meaning;
	 * the Code was ingested in seven languages and the prediction came true.
	 *
	 * THE RESOLUTION IS NOT THE ONE THIS BLOCK PREDICTED. It expected a
	 * discriminator on the reader's language — Portuguese means the Catechism,
	 * everyone else means the Code — and that is wrong for the same reason
	 * `EVERY LANGUAGE'S WORD IS ACCEPTED` is right two paragraphs up: the
	 * interface language decides what a row is LABELLED and does not get to
	 * decide what the reader meant. A Portuguese speaker reading English chrome
	 * still types `CIC` for the Catechism, and a canonist reading Portuguese
	 * chrome still types it for the Code.
	 *
	 * So `cic` is an `extra` on BOTH sections and the box offers both rows,
	 * which is what an ambiguous input deserves and what the ranking exists to
	 * order. It costs one row in a list of eight and it can never be silently
	 * wrong, where a language-keyed guess would answer confidently and hide the
	 * other work from the reader who wanted it.
	 */
	abbrevKey?: string;
	/** Fixed forms no dictionary supplies: URL segments and citation sigla. */
	extra: string[];
}

const SECTIONS: SectionWords[] = [
	{ kind: 'bible', path: '/scriptura', titleKey: 'nav.bible', extra: ['scriptura', 'biblia'] },
	{
		kind: 'ccc',
		path: '/catechismus',
		titleKey: 'nav.ccc',
		abbrevKey: 'ccc.abbrev',
		// `cic` is here AND on the Code below: see `abbrevKey`'s note on the
		// one collision this table admits deliberately.
		extra: ['catechismus', 'ccc', 'cec', 'cic']
	},
	{
		kind: 'compendium',
		path: '/catechismus/compendium',
		titleKey: 'nav.compendium',
		abbrevKey: 'compendium.abbrev',
		extra: ['compendium', 'comp']
	},
	{
		kind: 'document',
		path: '/documenta',
		titleKey: 'nav.magisterium',
		extra: ['documenta', 'documents', 'documentos']
	},
	{
		kind: 'socialDoctrine',
		path: '/doctrina-socialis',
		titleKey: 'nav.socialDoctrine',
		abbrevKey: 'socialDoctrine.abbrev',
		// Every siglum any language cites this work by, offered to every
		// reader whatever the chrome is set to — `EVERY LANGUAGE'S WORD IS
		// ACCEPTED`, above. `abbrevKey` alone would give a reader only the
		// one their own dictionary answers, and these are four rearrangements
		// of the same four words, so none of them can mean anything else.
		extra: ['doctrina-socialis', 'csdc', 'cdsi', 'cdsc', 'cdse']
	},
	{
		kind: 'canonLaw',
		path: '/ius-canonicum',
		titleKey: 'nav.canonLaw',
		abbrevKey: 'canonLaw.canon',
		// `can` and `cann` are what a citation of the Code actually opens with
		// — `canonLaw.canon` is the same word in whatever the reader's
		// dictionary spells it, and these are the Latin forms every edition
		// prints. `cic` is the siglum, and is the collision documented on
		// `abbrevKey` above.
		extra: ['ius-canonicum', 'cic', 'can', 'cann', 'codex']
	},
	{ kind: 'prayer', path: '/preces', titleKey: 'nav.prayers', extra: ['preces'] },
	{
		kind: 'summa',
		path: '/doctores/summa',
		titleKey: 'nav.summa',
		extra: ['summa', 'sth', 'stheol']
	},
	// Last, and not a work: `/quaestiones` is a door onto the others rather
	// than a unit of any of them, which is what `SuggestionKind`'s own note on
	// `topic` says. It had no row here until 2026-09-10 and so could not be
	// typed at all — the topics were matchable by their titles and the page
	// that lists them was not. A scope (`parseSectionFilter`) is what made the
	// gap worth fixing: `quaestiones:` has to name something.
	{
		kind: 'topic',
		path: '/quaestiones',
		titleKey: 'quaestiones.landing.title',
		extra: ['quaestiones', 'questions']
	}
];

/**
 * Every section a scope can name, as addresses.
 *
 * Exported for one reason: `specimens.ts` writes the same nine paths by hand
 * — it feeds the jump box's legend and must not pull this module into the
 * boot payload — and `specimens.test.ts` asserts the two tables agree. A
 * section added here with no row there is then a failing test rather than a
 * work a reader cannot pick.
 */
export const SECTION_PATHS: readonly string[] = SECTIONS.map((section) => section.path);

/** The generated section-name table, by language (see that file's own note and
 *  `scripts/export-section-names.mjs`). */
const SECTION_NAMES: Record<string, Record<string, string>> = sectionNamesTable.names;

/**
 * Folded forms -> section, built once: the names do not change at runtime.
 *
 * READ OFF A GENERATED TABLE RATHER THAN THE DICTIONARIES THEMSELVES, and the
 * reason is the whole of why that table exists. This module is reached from
 * `+layout.svelte` through `JumpBox`, so it is on every route's boot path;
 * calling `dictionaryFor` here for each of `UI_LANGS` would import every
 * dictionary eagerly and undo the split `i18n.svelte.ts` describes — silently,
 * because the feature would keep working perfectly. `section-names.json` is
 * the eight keys this loop actually wants, ~4 KB against ~215 KB, kept honest
 * by `section-names.test.ts`.
 */
const sectionForms: { form: string; section: SectionWords }[] = (() => {
	const out: { form: string; section: SectionWords }[] = [];
	const seen = new Set<string>();
	const add = (raw: string, section: SectionWords) => {
		const form = sectionForm(raw);
		if (!form || seen.has(`${form} ${section.path}`)) return;
		seen.add(`${form} ${section.path}`);
		out.push({ form, section });
	};
	for (const section of SECTIONS) {
		for (const extra of section.extra) add(extra, section);
		for (const lang of UI_LANGS) {
			const row = SECTION_NAMES[lang] ?? {};
			add(row[section.titleKey] ?? '', section);
			if (section.abbrevKey) add(row[section.abbrevKey] ?? '', section);
		}
	}
	return out;
})();

/** The section names as one flat haystack, in `sectionForms` order — so a hit's
 *  index names the form, and that form names its section. */
const sectionHaystack: FuzzyTarget[] = sectionForms.map(({ form }, index) => ({
	text: form,
	index
}));

/**
 * A section keyword reduced to its letters and digits: `fold`, then every
 * separator dropped.
 *
 * PUNCTUATION IS NOT MEANING HERE. A siglum is written with a full stop
 * because it is an abbreviation -- `Comp.`, `Komp.`, `S. Th.` -- and no two
 * section names in fourteen dictionaries are told apart by one. Matching the
 * folded string directly made `comp. 1` find nothing while `comp 1` worked,
 * and `ccc. 27` worked only because the REFERENCE grammar reads that one and
 * tolerates the stop itself; the Compendium has no such rule and had only
 * this tier.
 *
 * Applied to both sides, so it can only ever make the same pair match -- and
 * it is deliberately NOT folded into `fold`, which `highlight.ts` reimplements
 * per code point to keep an index map back to the original string.
 */
function sectionForm(raw: string): string {
	return fold(raw).replace(/[^\p{L}\p{N}]+/gu, '');
}

/** A leading keyword and the number after it, either of which may be absent. */
const KEYWORD_RE = /^([^\d]*?)\s*(\d{1,4})?\s*$/u;

/**
 * The sections this text names: 2 for an exact spelling, 1 for a prefix, 0 for
 * a loose reading — which is how `catechsim` still reaches the Catechism.
 *
 * The loose tier runs only when the literal ones find nothing at all. Section
 * names are short and there are six of them across fourteen dictionaries, so a
 * gap-penalised match on one is nearly always also a prefix match on another,
 * and mixing the two produces a list that reorders itself as the reader types.
 */
function literalSections(needle: string): Map<SectionWords, 1 | 2> {
	const best = new Map<SectionWords, 1 | 2>();
	for (const { form, section } of sectionForms) {
		const score = form === needle ? 2 : form.startsWith(needle) ? 1 : 0;
		if (score === 0) continue;
		best.set(section, Math.max(best.get(section) ?? 0, score) as 1 | 2);
	}
	return best;
}

function matchSections(text: string): { section: SectionWords; score: 0 | 1 | 2 }[] {
	const needle = sectionForm(text);
	if (!needle) return [];
	const best: Map<SectionWords, 0 | 1 | 2> = literalSections(needle);

	if (best.size === 0) {
		for (const position of fuzzyHits(needle, sectionHaystack).keys()) {
			best.set(sectionForms[position].section, 0);
		}
	}

	return [...best.entries()]
		.map(([section, score]) => ({ section, score }))
		.sort((a, b) => b.score - a.score);
}

// --------------------------------------------------------------------------
// A scope: `ccc: church` is "church, in the Catechism".
// --------------------------------------------------------------------------

/**
 * A section named on the left of a colon, and the query left over.
 *
 * ## Why a colon and not `in:`
 *
 * The reader who knows which work they want had no way to say so, and saying
 * it made things worse rather than merely no better: `KEYWORD_RE` folds a
 * whole non-digit prefix into one keyword, so `catechism church` matched no
 * section, and `titleSuggestions` folds the entire query, so `church` was
 * never matched on its own either. Measured, that query answered with NOTHING
 * — naming the work destroyed the search.
 *
 * The operator is a colon after a word this table already knows, because that
 * costs no vocabulary at all. `in:` is an English word on an interface in
 * thirty-seven languages, and translating it means thirty-seven strings AND a
 * parser accepting all of them at once — `EVERY LANGUAGE'S WORD IS ACCEPTED`
 * (see `abbrevKey`) is the standing rule here, and an English-only operator
 * contradicts it. What sits left of the colon is exactly what `matchSections`
 * already resolves: every section's name in fourteen dictionaries, every
 * siglum, every URL segment. Nothing to translate, nothing to keep in step.
 *
 * ## Why the literal tiers only
 *
 * `matchSections` falls back to a loose reading when the literal ones find
 * nothing, and that is right for a keyword and wrong for a scope: a fuzzy
 * match would silently narrow a search to a work the reader did not name,
 * which is the one failure a filter must not have. So this reads `sectionForm`
 * exactly or as a prefix, and an unrecognised left side is not a filter — the
 * query falls through unchanged.
 *
 * THAT IS ALSO WHAT SETTLES THE COLLISION WITH SCRIPTURE, with no rule about
 * digits. In `jn 3:16` the left side is `jn 3`, which folds to `jn3` and is no
 * section's prefix; the same holds for `ps 118:1` and every other citation the
 * grammar writes, because a chapter number is on the left of that colon and no
 * section name begins with one.
 *
 * ## Several sections, and an empty rest
 *
 * A prefix may name more than one — `c:` is the Catechism, its Compendium and
 * the Code — and all of them are kept, at the best tier present. `cic:` is the
 * deliberate ambiguity this table documents at length, preserved: it scopes to
 * the Catechism AND the Code, rather than guessing at the reader's language.
 *
 * ## A scope with nothing typed after it is still a scope
 *
 * `ccc:` was read as a section KEYWORD with a stop on it — `sectionForm` drops
 * the stop, so the bare form reached the Catechism's landing page and the
 * colon was doing nothing. It looked equivalent and was not: the same string
 * also went to `titleSuggestions`, whose loose tier answered `ccc:` with
 * *Pastores Gregis* and *Ut Unum Sint*, so the one state in which the reader
 * has unambiguously said WHERE they are looking was the state that answered
 * with two documents from somewhere else.
 *
 * So an empty rest is a filter with `rest: ''`, and `suggest` answers it with
 * that section's landing row and nothing else: the scope is armed, and the row
 * says which work it is armed on.
 */
export interface SectionFilter {
	/** The landing paths of the sections named — `SECTIONS[].path`, which is
	 *  also what `sectionPathOf` files a row under. */
	paths: string[];
	/** What they are called, for a surface that has to show the reader what
	 *  their scope resolved to. In `paths` order. */
	names: string[];
	/** The word the reader put left of the colon, as they wrote it. What a
	 *  surface holding the scope apart from the term recomposes with, so the
	 *  string `suggest` reads is the one that would have been typed. */
	word: string;
	/** The query with the scope taken off, normalised the way `suggest`
	 *  normalises its input. Empty where the reader has typed the colon and
	 *  stopped. */
	rest: string;
}

const SCOPE_RE = /^([^:]+):\s*(.*)$/;

export function parseSectionFilter(input: string, lang?: string): SectionFilter | undefined {
	const match = SCOPE_RE.exec(input.trim());
	if (!match) return undefined;
	const needle = sectionForm(match[1]);
	if (!needle) return undefined;
	const sections = literalSections(needle);
	if (sections.size === 0) return undefined;
	const top = Math.max(...sections.values());
	const named = [...sections.entries()].filter(([, score]) => score === top).map(([s]) => s);
	return {
		paths: named.map((s) => s.path),
		names: named.map((s) => tr(s.titleKey, lang ?? i18n.lang)),
		word: match[1].trim(),
		rest: match[2].trim().replace(/\s+/g, ' ')
	};
}

/**
 * The section an address belongs to: the longest `SECTIONS` path it sits
 * under, or `undefined` for an address no section covers.
 *
 * LONGEST, because exactly one pair nests — `/catechismus/compendium/1` is the
 * Compendium and not the Catechism — and that pair is the one the table
 * already argues about under `path`.
 */
const SECTION_BY_PATH = new Map(SECTIONS.map((section) => [section.path, section]));

function sectionPathOf(href: string): string | undefined {
	const path = href.replace(/[#?].*$/, '');
	let best: string | undefined;
	for (const { path: base } of SECTIONS) {
		if (path !== base && !path.startsWith(`${base}/`)) continue;
		if (best === undefined || base.length > best.length) best = base;
	}
	return best;
}

/** A section's own index page as a row. Two callers: a keyword that named it,
 *  and a scope with nothing typed after it yet. */
function landingRow(section: SectionWords, score: number, order: number, ctx: Context): Scored {
	const name = tr(section.titleKey, ctx.lang);
	return {
		href: section.path,
		kind: 'section',
		label: name,
		completion: name,
		badge: name,
		score,
		order
	};
}

function cccRow(n: number, score: number, order: number, ctx: Context): Scored {
	const chapter = getCccChapterFor(ctx.cccLang, n);
	return {
		href: hrefFor({ kind: 'ccc', n }),
		kind: 'ccc',
		label: `${tr('nav.ccc', ctx.lang)} ${n}`,
		completion: `${tr('nav.ccc', ctx.lang)} ${n}`,
		detail: chapter ? displayTitle(chapter, ctx.cccLang).title : undefined,
		badge: tr('nav.ccc', ctx.lang),
		score,
		order
	};
}

function compendiumRow(n: number, score: number, order: number, ctx: Context): Scored {
	const chapter = getCompendiumChapterFor(ctx.compendiumLang, n);
	return {
		href: hrefFor({ kind: 'compendium', n }),
		kind: 'compendium',
		label: `${tr('nav.compendium', ctx.lang)} ${n}`,
		completion: `${tr('nav.compendium', ctx.lang)} ${n}`,
		detail: chapter ? displayTitle(chapter, ctx.compendiumLang).title : undefined,
		badge: tr('nav.compendium', ctx.lang),
		score,
		order
	};
}

/**
 * The Social Doctrine's paragraphs and the Code's canons.
 *
 * NEITHER CARRIES A `detail`, and that is a limit rather than an omission. The
 * two rows above name their enclosing division, which they can because the
 * Catechism's and the Compendium's outlines are eager. These two are derived
 * from a DOCUMENT's structure and are fetched (`loadSocialDoctrineOutline`,
 * `loadCanonLawOutline`), so a synchronous suggestion cannot see one. A row
 * with a label and a badge is already a complete offer; the division name is
 * what a reader gets on arriving.
 */
function socialDoctrineRow(n: number, score: number, order: number, ctx: Context): Scored {
	return {
		href: hrefFor({ kind: 'socialDoctrine', n }),
		kind: 'socialDoctrine',
		label: `${tr('nav.socialDoctrine', ctx.lang)} ${n}`,
		completion: `${tr('nav.socialDoctrine', ctx.lang)} ${n}`,
		badge: tr('nav.socialDoctrine', ctx.lang),
		score,
		order
	};
}

/** `Can. 748` — the abbreviation the Code is cited by, in the reader's own
 *  dictionary, which is what `canonLaw.canon` holds and why the reading pages
 *  print the same string. */
function canonLawRow(n: number, score: number, order: number, ctx: Context): Scored {
	const label = `${tr('canonLaw.canon', ctx.lang)} ${n}`;
	return {
		href: hrefFor({ kind: 'canonLaw', n }),
		kind: 'canonLaw',
		label,
		completion: label,
		badge: tr('nav.canonLaw', ctx.lang),
		score,
		order
	};
}

/**
 * The unit numbers of one work that a typed digit-prefix could be growing into.
 *
 * Both works are dense ranges (1-2865, 1-598) but neither is guaranteed
 * contiguous — the fixtures deliberately are not, and `cccParagraphExists`
 * exists because of it — so the candidates are generated and then filtered by
 * the existence check rather than assumed.
 */
function unitCompletions(typed: string, max: number, exists: (n: number) => boolean): number[] {
	// A leading zero is not a canonical spelling of any address (`address.ts`'s
	// `canonicalNumber` rejects `/catechismus/01234`), so there is nothing here
	// for it to be the beginning of.
	if (typed.startsWith('0')) return [];
	const out: number[] = [];
	const exact = Number(typed);
	if (exact >= 1 && exists(exact)) out.push(exact);
	for (let n = exact === 0 ? 1 : exact * 10; n <= max && out.length < 5; n++) {
		if (String(n).startsWith(typed) && n !== exact && exists(n)) out.push(n);
	}
	return out;
}

const MAX_CCC = 2865;
const MAX_COMPENDIUM = 598;
const MAX_SOCIAL_DOCTRINE = 583;
const MAX_CANON = 1752;

function numberedWorkSuggestions(query: string, ctx: Context): Scored[] {
	const match = KEYWORD_RE.exec(query);
	if (!match) return [];
	const [, keyword, numberRaw] = match;

	const out: Scored[] = [];
	let order = 0;

	// A bare number is genuinely ambiguous — 27 is a Catechism paragraph and a
	// Compendium question — so both are offered rather than one guessed. The
	// Catechism leads because it is the work the corpus is cited into most, and
	// because the Compendium's own range is a subset of its.
	if (!keyword.trim() && numberRaw) {
		const n = Number(numberRaw);
		if (cccParagraphExists(ctx.cccLang, n)) out.push(cccRow(n, SCORE.exactUnit, order++, ctx));
		if (compendiumQuestionExists(ctx.compendiumLang, n)) {
			out.push(compendiumRow(n, SCORE.exactUnit - 1, order++, ctx));
		}
		for (const c of unitCompletions(numberRaw, MAX_CCC, (x) =>
			cccParagraphExists(ctx.cccLang, x)
		)) {
			if (c !== n) out.push(cccRow(c, SCORE.numericPrefix, order++, ctx));
		}
		return out;
	}

	/** Landing pages already offered, so two sections cannot name one twice. */
	const landed = new Set<string>();
	for (const { section, score } of matchSections(keyword)) {
		const exactName = score === 2;
		const bump = exactName ? 2 : 0;
		// A NUMBER is only ever attached to a section the reader actually
		// spelled. "ctechism 27" reaching ¶27 would be two guesses stacked —
		// which work was meant, and that the digits are its unit number — and
		// the second is not a guess this module is entitled to make. The
		// landing row below still offers the section itself.
		if (score === 0 && numberRaw) continue;

		if (!numberRaw) {
			// `matchSections` is sorted by score, so the better-named section
			// keeps the row: typing `comp` reaches only the Compendium and is
			// unaffected, while a bare `c` prefixes both and would otherwise
			// offer the same index under two names.
			if (landed.has(section.path)) continue;
			landed.add(section.path);
			// A landing page is the coarsest thing the box can offer, so a
			// PREFIX of one sits at the bottom of the list and a loose reading
			// of one sits below that. Its full NAME does not: "Prayers" typed
			// in full is the prayers section, not a Summa question whose title
			// contains the word — which is what it resolved to at the landing
			// band, and which made Tab move the reader's own chosen row down
			// the list they picked it from.
			const landing = exactName
				? SCORE.titleExact + 1
				: score === 1
					? SCORE.landing
					: SCORE.landingFuzzy;
			out.push(landingRow(section, landing, order++, ctx));
			continue;
		}

		if (section.kind === 'ccc') {
			for (const n of unitCompletions(numberRaw, MAX_CCC, (x) =>
				cccParagraphExists(ctx.cccLang, x)
			)) {
				const exact = String(n) === numberRaw;
				out.push(cccRow(n, (exact ? SCORE.exactUnit : SCORE.numericPrefix) + bump, order++, ctx));
			}
		} else if (section.kind === 'compendium') {
			for (const n of unitCompletions(numberRaw, MAX_COMPENDIUM, (x) =>
				compendiumQuestionExists(ctx.compendiumLang, x)
			)) {
				const exact = String(n) === numberRaw;
				out.push(
					compendiumRow(n, (exact ? SCORE.exactUnit : SCORE.numericPrefix) + bump, order++, ctx)
				);
			}
		} else if (section.kind === 'socialDoctrine') {
			for (const n of unitCompletions(numberRaw, MAX_SOCIAL_DOCTRINE, (x) =>
				socialDoctrineParagraphExists(ctx.socialDoctrineLang, x)
			)) {
				const exact = String(n) === numberRaw;
				out.push(
					socialDoctrineRow(n, (exact ? SCORE.exactUnit : SCORE.numericPrefix) + bump, order++, ctx)
				);
			}
		} else if (section.kind === 'canonLaw') {
			for (const n of unitCompletions(numberRaw, MAX_CANON, (x) =>
				canonLawCanonExists(ctx.canonLawLang, x)
			)) {
				const exact = String(n) === numberRaw;
				out.push(
					canonLawRow(n, (exact ? SCORE.exactUnit : SCORE.numericPrefix) + bump, order++, ctx)
				);
			}
		}
	}

	return out;
}

// --------------------------------------------------------------------------
// The Summa, which is addressed by part and question rather than by number.
// --------------------------------------------------------------------------

/**
 * `STh I-II, 79` and everything on the way to it.
 *
 * The part slug carries the whole grammar (`address.ts`'s `SUMMA_PART_SLUGS`),
 * and it is spelled in the lower-case Roman the work's own citations use, so
 * the citation form and the URL form are the same string. A BARE part is
 * accepted only when it cannot be mistaken for something else: `i-ii`, `ii-ii`,
 * `iii` and `suppl` name nothing else a reader would type, while a lone `i` or
 * `ii` is a Roman numeral in every other citation on the site and needs the
 * work named first.
 */
const SUMMA_RE =
	/^(?:(summa|sth|stheol|s)\s*)?(i-ii|ii-ii|iii|suppl|i{1,2})\s*[,.]?\s*(\d{1,3})?$/i;

const UNAMBIGUOUS_PARTS = new Set(['i-ii', 'ii-ii', 'iii', 'suppl']);

function summaSuggestions(query: string, ctx: Context): Scored[] {
	const match = SUMMA_RE.exec(fold(query).replace(/\s+/g, ' ').trim());
	if (!match) return [];
	const [, keyword, partSlug, numberRaw] = match;
	if (!keyword && !UNAMBIGUOUS_PARTS.has(partSlug)) return [];

	const part = summaPartFromSlug(partSlug);
	if (!part) return [];

	const questions = listSummaQuestions(ctx.summaLang).filter((q) => q.part === part);
	// The Latin edition has no Supplementum and the English one does
	// (`CLAUDE.md`, "The Summa is the exception to two rules at once"), so the
	// reader's own edition may simply not carry this part; the address still
	// exists if any edition does.
	const numbers = questions.length
		? questions.map((q) => q.n)
		: [...Array(200).keys()].map((i) => i + 1).filter((n) => summaQuestionExists(part, n));

	// `summaQuestionLabel` is the compact-list entry point of `summa-titles.ts`:
	// CCEL prints every question title in full capitals and appends its article
	// count, and a suggestion row is exactly the compact list that module's
	// three entry points were split for.
	const titleFor = (n: number) => {
		const title = questions.find((q) => q.n === n)?.title;
		return title ? summaQuestionLabel(title) : undefined;
	};
	const row = (n: number, score: number, order: number): Scored => ({
		href: hrefFor({ kind: 'summa', part: partSlug, question: n, article: null }),
		kind: 'summa',
		label: `${tr('nav.summa', ctx.lang)} ${part}, ${tr('summa.questionShort', ctx.lang)} ${n}`,
		// NOT the label: `SUMMA_RE` knows no `Q`, and the part slug is the
		// citation form the work itself uses (`STh I-II, 79`). The keyword is
		// the literal `summa` rather than this language's word for it, so a
		// completion of a row is a query this module can read back whatever the
		// chrome is set to.
		completion: `summa ${partSlug} ${n}`,
		detail: titleFor(n),
		badge: tr('nav.summa', ctx.lang),
		score,
		order
	});

	if (!numberRaw) {
		return numbers.slice(0, 3).map((n, index) => row(n, SCORE.bookOnly - index, index));
	}

	return numericCompletions(numberRaw, numbers, PER_PRODUCER_CAP).map((n, index) =>
		row(n, String(n) === numberRaw ? SCORE.exactUnit : SCORE.numericPrefix, index)
	);
}

// --------------------------------------------------------------------------
// Titles and sigla: the only way to reach a slug.
// --------------------------------------------------------------------------

interface TitleCandidate {
	/** What is matched against, folded once when the index is built rather than
	 *  on every keystroke: a title index of the real corpus is ~1,500 rows of
	 *  two or three forms each, and `fold` normalizes and rewrites every one. */
	forms: { folded: string; length: number }[];
	/** Documents only: the edition whose numbered sections a trailing locus is
	 *  checked against. A section is a FRAGMENT on the document's one page
	 *  (`address.ts`), so `LG 12` is an address `LG` alone already reaches — it
	 *  just lands the reader on the paragraph they named. */
	sectionsOf?: string;
	href: string;
	kind: SuggestionKind;
	label: string;
	detail?: string;
	badge: string;
	order: number;
}

/**
 * Everything addressed by a name rather than a number, for one set of
 * languages.
 *
 * Memoized on the languages it was built for, not rebuilt per keystroke: the
 * document half alone walks ~450 groups and resolves an edition for each.
 */
interface TitleIndex {
	candidates: TitleCandidate[];
	/** Every candidate's every form, flattened, for the loose matcher — which
	 *  wants one array to scan rather than a call per string. Built with the
	 *  index because it is the same walk and the same lifetime. */
	haystack: FuzzyTarget[];
}

const titleIndexByKey = new Map<string, TitleIndex>();

function titleIndex(ctx: Context): TitleIndex {
	const key = [ctx.lang, ctx.cccLang, ctx.compendiumLang, ctx.prayerLang, ctx.summaLang].join('|');
	const cached = titleIndexByKey.get(key);
	if (cached) return cached;

	const out: TitleCandidate[] = [];
	let order = 0;
	const matchable = (...raw: (string | undefined)[]): TitleCandidate['forms'] =>
		raw
			.filter((form): form is string => Boolean(form))
			.map((form) => ({
				folded: fold(form),
				length: form.length
			}));

	// Documents. A siglum is carried as a matchable form beside the title, from
	// this language's own table — which is the point of keying it that way:
	// `SC` is Sacrosanctum concilium to a German or French reader and Sources
	// chrétiennes to a Latin or Italian one, and only the language's table
	// knows which (`CLAUDE.md`, "Reference grammar").
	const siglaBySlug = new Map<string, string[]>();
	const surface = grammarSurface(ctx.lang);
	if (surface.linksSigla) {
		for (const [siglum, entry] of surface.sigla) {
			if (!entry.slug) continue;
			siglaBySlug.set(entry.slug, [...(siglaBySlug.get(entry.slug) ?? []), siglum]);
		}
	}

	for (const group of listDocuments()) {
		const workId = defaultDocumentWorkId(group.slug, ctx.lang);
		const manifest = workId ? getDocumentManifest(workId) : undefined;
		if (!manifest) continue;
		const year = manifest.promulgated?.slice(0, 4);
		out.push({
			forms: matchable(
				manifest.title,
				manifest.short_title,
				group.slug.replace(/-/g, ' '),
				...(siglaBySlug.get(group.slug) ?? [])
			),
			sectionsOf: workId,
			href: hrefFor({ kind: 'document', slug: group.slug }),
			kind: 'document',
			label: manifest.title,
			detail: [manifest.pontiff_or_council, year].filter(Boolean).join(', ') || undefined,
			badge: tr('nav.magisterium', ctx.lang),
			order: order++
		});
	}

	for (const prayer of listPrayerMeta(ctx.prayerLang)) {
		out.push({
			forms: matchable(prayer.title, prayer.slug.replace(/-/g, ' ')),
			href: hrefFor({ kind: 'prayer', slug: prayer.slug }),
			kind: 'prayer',
			label: prayer.title,
			badge: tr('nav.prayers', ctx.lang),
			order: order++
		});
	}

	// Chapter starts, addressed by their first unit number (`corpus.ts`'s
	// `listCccChapters` explains that address). A node whose span has no
	// numbered bound addresses nothing and is skipped rather than guessed at.
	//
	// `StructureNode` IS `CccNode` (types.ts), so the Compendium's question
	// range is stored in the field named `paragraphs` — the type says so
	// explicitly and this is not the place to re-litigate the name.
	const chapterRows = (
		nodes: StructureNode[],
		lang: string,
		kind: 'cccChapter' | 'compendiumChapter',
		badge: string
	) => {
		for (const node of nodes) {
			const [start, end] = node.paragraphs;
			if (typeof start !== 'number') continue;
			const shown = displayTitle(node, lang);
			out.push({
				forms: matchable(shown.title, node.title),
				href: hrefFor({ kind, n: start }),
				kind,
				label: shown.title,
				detail: typeof end === 'number' ? `${badge} ${start}-${end}` : badge,
				badge,
				order: order++
			});
		}
	};
	chapterRows(listCccChapters(ctx.cccLang), ctx.cccLang, 'cccChapter', tr('nav.ccc', ctx.lang));
	chapterRows(
		listCompendiumChapters(ctx.compendiumLang),
		ctx.compendiumLang,
		'compendiumChapter',
		tr('nav.compendium', ctx.lang)
	);

	for (const question of listSummaQuestions(ctx.summaLang)) {
		const label = summaQuestionLabel(question.title);
		out.push({
			// Matched against BOTH spellings: the source's own capitals are what
			// `book-forms`-style folding already handles, but the article count
			// `summaQuestionLabel` strips is text a reader will never type.
			forms: matchable(label, question.title),
			href: hrefFor({
				kind: 'summa',
				part: summaPartSlug(question.part),
				question: question.n,
				article: null
			}),
			kind: 'summa',
			label,
			detail: `${question.part}, ${tr('summa.questionShort', ctx.lang)} ${question.n}`,
			badge: tr('nav.summa', ctx.lang),
			order: order++
		});
	}

	const index: TitleIndex = {
		candidates: out,
		haystack: out.flatMap((candidate, position) =>
			candidate.forms.map((form) => ({ text: form.folded, index: position }))
		)
	};
	titleIndexByKey.set(key, index);
	return index;
}

/**
 * How well a title answers to what has been typed.
 *
 * Four tiers, and the gap between the last two is deliberate: an interior
 * substring is the weakest evidence there is, so it takes four characters
 * before it counts at all. Without that, a short query matches most of the
 * corpus and the specific rows above it are pushed off the end of a list the
 * reader can only see eight of — measured against the real Magisterium
 * corpus, three characters was still too few: `ave` reached "Inter Graves"
 * and "Ingravescentibus Malis" before it reached anything a reader meant.
 */
function titleScore(forms: TitleCandidate['forms'], needle: string): number {
	let best = 0;
	for (const { folded, length } of forms) {
		let score = 0;
		if (folded === needle) score = SCORE.titleExact;
		else if (folded.startsWith(needle)) score = SCORE.titlePrefix;
		else if (words(folded).some((word) => word.startsWith(needle))) score = SCORE.titleWord;
		else if (needle.length >= 4 && folded.includes(needle)) score = SCORE.titleSubstring;
		// A short title matching is stronger evidence than a long one matching:
		// "Fides et Ratio" answering to "fides" says more than a forty-word
		// chapter heading that happens to contain it.
		if (score > 0) score -= Math.min(20, Math.floor(length / 8));
		best = Math.max(best, score);
	}
	return best;
}

/**
 * A trailing section number: `LG 12`, `Dei Verbum 2`, `Rerum Novarum 15`.
 *
 * Documents are the one named thing on this site that is also cited by number,
 * and it is how the Catechism cites them throughout — so a reader who has
 * learnt the notation from the text is typing it here. Everything named but
 * not numbered (a prayer, a chapter heading) simply finds no locus to match.
 */
const NAMED_LOCUS_RE = /^(.*\S)\s+(\d{1,4})$/;

function titleSuggestions(query: string, ctx: Context): Scored[] {
	const needle = fold(query).trim();
	if (needle.length < 2) return [];

	const locus = NAMED_LOCUS_RE.exec(needle);
	const namePart = locus?.[1];
	const section = locus ? Number(locus[2]) : undefined;

	const index = titleIndex(ctx);
	const hits: Scored[] = [];
	const literal = new Set<number>();
	for (const [position, candidate] of index.candidates.entries()) {
		if (namePart !== undefined && section !== undefined && candidate.sectionsOf) {
			const named = titleScore(candidate.forms, namePart);
			if (named > 0 && documentSectionExists(candidate.sectionsOf, section)) {
				hits.push({
					href: `${candidate.href}#s${section}`,
					kind: candidate.kind,
					label: `${candidate.label} ${section}`,
					completion: `${candidate.label} ${section}`,
					detail: candidate.detail,
					badge: candidate.badge,
					score: named,
					order: candidate.order
				});
				continue;
			}
		}

		const score = titleScore(candidate.forms, needle);
		if (score <= 0) continue;
		literal.add(position);
		hits.push({
			href: candidate.href,
			kind: candidate.kind,
			label: candidate.label,
			// A title is its own query: `titleScore`'s top tier is an exact
			// match, so completing a row and pressing Tab again is a fixed point
			// rather than a new search.
			completion: candidate.label,
			detail: candidate.detail,
			badge: candidate.badge,
			score,
			order: candidate.order
		});
	}

	// The loose pass runs over the WHOLE query, never over the locus split
	// above: `NAMED_LOCUS_RE` is an exact grammar, and letting a fuzzy reading
	// invent a section number would offer an address on the strength of a
	// guess about which document was meant AND a guess about which paragraph.
	//
	// Candidates the literal tiers already found are skipped rather than
	// scored again — a row cannot improve by being read more loosely, and
	// `suggest`'s dedupe would drop the weaker copy anyway.
	for (const [position, score] of fuzzyHits(needle, index.haystack)) {
		if (literal.has(position)) continue;
		const candidate = index.candidates[position];
		hits.push({
			href: candidate.href,
			kind: candidate.kind,
			label: candidate.label,
			completion: candidate.label,
			detail: candidate.detail,
			badge: candidate.badge,
			// One band, ordered within itself by the matcher — see `SCORE`.
			score: SCORE.titleFuzzy + score,
			order: candidate.order
		});
	}

	// Capped PER KIND rather than overall: 450 documents would otherwise fill
	// every row of a list a prayer and a chapter also belong in. Lifted under
	// a scope, where there is no list to share — see `Context.scoped`.
	const cap = ctx.scoped ? ctx.limit : 4;
	const perKind = new Map<SuggestionKind, number>();
	return hits
		.sort((a, b) => b.score - a.score || a.order - b.order)
		.filter((hit) => {
			const seen = perKind.get(hit.kind) ?? 0;
			if (seen >= cap) return false;
			perKind.set(hit.kind, seen + 1);
			return true;
		});
}

// --------------------------------------------------------------------------
// The headings inside a work, and the questions written about several.
// --------------------------------------------------------------------------

/**
 * Score one banded index, literally and then loosely, capped.
 *
 * The same two passes `titleSuggestions` makes and deliberately not folded
 * into it: that function carries the numbered-locus branch (`LG 12`), the
 * sigla and the per-KIND cap over a single index, and neither of the two
 * producers below wants any of it. What they share is this — fold, score,
 * demote into a band, take the best few.
 */
function bandedHits(needle: string, index: TitleIndex, band: number, cap: number): Scored[] {
	const hits: Scored[] = [];
	const literal = new Set<number>();
	for (const [position, candidate] of index.candidates.entries()) {
		const score = titleScore(candidate.forms, needle);
		if (score <= 0) continue;
		literal.add(position);
		hits.push({ ...toScored(candidate), score: banded(band, score) });
	}
	for (const [position, score] of fuzzyHits(needle, index.haystack)) {
		if (literal.has(position)) continue;
		hits.push({
			...toScored(index.candidates[position]),
			score: bandedFuzzy(band, score)
		});
	}
	return hits.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, cap);
}

/** A candidate as a row. The completion is the label for the reason a title's
 *  is: a heading is its own query, so Tab is a fixed point. */
function toScored(candidate: TitleCandidate): Scored {
	return {
		href: candidate.href,
		kind: candidate.kind,
		label: candidate.label,
		completion: candidate.label,
		detail: candidate.detail,
		badge: candidate.badge,
		score: 0,
		order: candidate.order
	};
}

/**
 * Memoized on the TABLE ITSELF, not on a language key.
 *
 * The shard is fetched, so it arrives after the first index would have been
 * built and a language key would hand back the empty one for ever. A
 * `WeakMap` on the object `loadSectionHeadings` resolved is exactly the
 * lifetime wanted: the same table means the same index, a new table means a
 * new one, and neither outlives the component holding it.
 */
let headingIndexCache = new WeakMap<object, Map<string, TitleIndex>>();

function indexFor<T extends object>(
	cache: WeakMap<object, Map<string, TitleIndex>>,
	table: T,
	key: string,
	build: () => TitleCandidate[]
): TitleIndex {
	let byKey = cache.get(table);
	if (!byKey) {
		byKey = new Map();
		cache.set(table, byKey);
	}
	const cached = byKey.get(key);
	if (cached) return cached;
	const candidates = build();
	const haystack: FuzzyTarget[] = [];
	for (const [index, candidate] of candidates.entries()) {
		for (const form of candidate.forms) haystack.push({ text: form.folded, index });
	}
	const built = { candidates, haystack };
	byKey.set(key, built);
	return built;
}

/** A heading's matchable form is the words it prints, cased as the page will
 *  case them — the ordinal (`CHAPTER I`) is dropped, being a marker rather
 *  than a name and one every chapter of every work would answer to. */
function headingCandidate(
	raw: string,
	shown: string,
	href: string,
	detail: string | undefined,
	badge: string,
	order: number
): TitleCandidate | undefined {
	const label = shown.trim() || raw.trim();
	if (!label) return undefined;
	return {
		forms: [{ folded: fold(label), length: label.length }],
		href,
		kind: 'heading',
		label,
		detail,
		badge,
		order
	};
}

function headingIndex(ctx: Context): TitleIndex {
	return indexFor(
		headingIndexCache,
		ctx.headings,
		[ctx.lang, ctx.socialDoctrineLang, ctx.canonLawLang].join('|'),
		() => {
			const out: TitleCandidate[] = [];
			let order = 0;
			const documentBadge = tr('nav.magisterium', ctx.lang);
			for (const [slug, rows] of Object.entries(ctx.headings.documents)) {
				// The document has to be in THIS build: a shard is written per
				// language over the whole corpus, and a partial sync is a real
				// state (`sync-corpus.mjs` warns and carries on).
				const workId = defaultDocumentWorkId(slug, ctx.lang);
				const manifest = workId ? getDocumentManifest(workId) : undefined;
				if (!manifest) continue;
				for (const [n, raw] of rows) {
					const candidate = headingCandidate(
						raw,
						documentHeadingParts(raw, ctx.lang).title,
						hrefFor({ kind: 'document', slug, n }),
						manifest.title,
						documentBadge,
						order++
					);
					if (candidate) out.push(candidate);
				}
			}
			const csdcBadge = tr('nav.socialDoctrine', ctx.lang);
			const csdcAbbrev = tr('socialDoctrine.abbrev', ctx.lang);
			for (const [n, raw] of ctx.headings.socialDoctrine) {
				const candidate = headingCandidate(
					raw,
					documentHeadingParts(raw, ctx.socialDoctrineLang).title,
					socialDoctrineHeadingHref(ctx.socialDoctrineLang, n),
					`${csdcAbbrev} ${n}`,
					csdcBadge,
					order++
				);
				if (candidate) out.push(candidate);
			}
			const canonBadge = tr('nav.canonLaw', ctx.lang);
			const canonWord = tr('canonLaw.canon', ctx.lang);
			for (const [n, raw] of ctx.headings.canonLaw) {
				// `canonLawHeadingParts` and not the document one: five of the
				// seven editions print the canon range inside the heading
				// (`(Cann. 35 – 93)`), which is neither part of the name nor
				// something a reader types.
				const candidate = headingCandidate(
					raw,
					canonLawHeadingParts(raw, ctx.canonLawLang).title,
					canonLawHeadingHref(ctx.canonLawLang, n),
					`${canonWord} ${n}`,
					canonBadge,
					order++
				);
				if (candidate) out.push(candidate);
			}
			return out;
		}
	);
}

/** Headings, capped at four: they are the most numerous thing here by a
 *  factor of three and the least specific, so a query they all answer must
 *  not become a list of nothing else. */
function headingSuggestions(query: string, ctx: Context): Scored[] {
	const needle = fold(query).trim();
	if (needle.length < 3) return [];
	const index = headingIndex(ctx);
	if (index.candidates.length === 0) return [];
	return bandedHits(needle, index, SCORE.heading, ctx.scoped ? ctx.limit : 4);
}

let topicIndexCache = new WeakMap<object, Map<string, TitleIndex>>();

/**
 * The topics, matched on what `/quaestiones`'s own search matches.
 *
 * TITLE, QUESTION AND THE KEYWORDS NOBODY SEES — `topic-search.ts` argues all
 * three, and the third is the load-bearing one: the two visible strings are
 * written to be READ, so `mors-voluntaria` is titled "After a suicide" and a
 * reader typing "killed himself" finds nothing without them. They are matched
 * here and shown nowhere, exactly as on that page.
 *
 * The strings are in the DICTIONARIES rather than in the topic file, so a
 * language without them falls back to English key by key, as `t()` does
 * everywhere. A key that resolves to itself is a topic this build published
 * and nobody has written yet: skipped, rather than offered as a row reading
 * `quaestiones.dei-existentia.title`.
 */
function topicIndex(ctx: Context): TitleIndex {
	const topics = ctx.topics;
	if (!topics) return { candidates: [], haystack: [] };
	return indexFor(topicIndexCache, topics, ctx.lang, () => {
		const out: TitleCandidate[] = [];
		const badge = tr('quaestiones.landing.title', ctx.lang);
		let order = 0;
		for (const slug of Object.keys(topics.topics)) {
			const named = (part: string) => {
				const key = `quaestiones.${slug}.${part}`;
				const value = tr(key, ctx.lang);
				return value === key ? undefined : value;
			};
			const title = named('title');
			if (!title) continue;
			const question = named('question');
			const keywords = named('keywords');
			out.push({
				forms: [title, question, keywords]
					.filter((form): form is string => Boolean(form))
					.map((form) => ({ folded: fold(form), length: form.length })),
				href: hrefFor({ kind: 'topic', slug }),
				kind: 'topic',
				label: title,
				detail: question,
				badge,
				order: order++
			});
		}
		return out;
	});
}

function topicSuggestions(query: string, ctx: Context): Scored[] {
	const needle = fold(query).trim();
	if (needle.length < 3) return [];
	const index = topicIndex(ctx);
	if (index.candidates.length === 0) return [];
	return bandedHits(needle, index, SCORE.topic, ctx.scoped ? ctx.limit : 3);
}

// --------------------------------------------------------------------------

/**
 * Every canonical address this fragment could be the beginning of, best first.
 *
 * Producers are run in full and merged rather than dispatched between: a query
 * genuinely can be two things at once — `1 co` is a book and the start of a
 * Compendium question, `comp` is a section and a word inside four document
 * titles — and deciding early which one it "is" is how a suggester loses the
 * answer the reader wanted. Ranking, not routing, resolves it.
 *
 * Deduplicated by href, keeping the highest score: the same address reached
 * two ways (a complete citation and its own partial reading) is one row.
 *
 * A SCOPE (`ccc: church`) is applied to that merged list and to nothing
 * before it — see `parseSectionFilter` for the syntax and `Context.scoped`
 * for what it costs the caps.
 */
export function suggest(input: string, opts: SuggestOpts = {}): Suggestion[] {
	const typed = input.trim().replace(/\s+/g, ' ');
	if (!typed) return [];
	// A SCOPE NARROWS THE ANSWER AND NEVER THE SEARCH. Every producer still
	// runs over the rest of the query, and the rows are filtered afterwards by
	// the address they landed on — so a scope cannot make a producer fail to
	// look, only fail to be listened to. Routing on the section instead would
	// be the mistake `suggest`'s own docblock warns about one paragraph up,
	// made deliberately: `ccc: 27` has to reach the exactly-numbered tier of
	// `numberedWorkSuggestions`, which is the branch for a query with no
	// keyword at all.
	const filter = parseSectionFilter(typed, opts.lang);
	const query = filter ? filter.rest : typed;
	const scope = filter && new Set(filter.paths);
	const ctx = resolveContext(opts, filter !== undefined);

	// An armed scope with nothing typed into it. Every producer would answer
	// nothing, so the landing row is the answer: it names the work the reader
	// has just narrowed to, which is the only thing there is to say yet.
	if (filter && !query) {
		return filter.paths
			.map((path) => SECTION_BY_PATH.get(path))
			.filter((section): section is SectionWords => section !== undefined)
			.map((section, index) => landingRow(section, SCORE.titleExact, index, ctx))
			.slice(0, ctx.limit)
			.map(({ score: _score, order: _order, ...suggestion }) => suggestion);
	}

	const rows = [
		...exactReference(query, ctx),
		...bibleSuggestions(query, ctx),
		...numberedWorkSuggestions(query, ctx),
		...summaSuggestions(query, ctx),
		...titleSuggestions(query, ctx),
		...topicSuggestions(query, ctx),
		...headingSuggestions(query, ctx)
	];

	const best = new Map<string, Scored>();
	for (const row of rows) {
		if (scope) {
			const path = sectionPathOf(row.href);
			// An address no section covers is dropped rather than kept: under a
			// scope the reader has named where they are looking, and a row that
			// belongs nowhere is not in there.
			if (path === undefined || !scope.has(path)) continue;
		}
		const existing = best.get(row.href);
		if (!existing || row.score > existing.score) best.set(row.href, row);
	}

	return [...best.values()]
		.sort((a, b) => b.score - a.score || a.order - b.order || a.label.localeCompare(b.label))
		.slice(0, ctx.limit)
		.map(({ score: _score, order: _order, ...suggestion }) => suggestion);
}

/** Drop the memoized indexes. Only the tests need this — the corpus does not
 *  change at runtime, and neither do the dictionaries. */
export function resetSuggestCaches(): void {
	bookFormsByLang.clear();
	titleIndexByKey.clear();
	// Reassigned rather than cleared: a `WeakMap` has no `clear`, which is the
	// price of keying on the table object instead of on a string.
	headingIndexCache = new WeakMap();
	topicIndexCache = new WeakMap();
}
