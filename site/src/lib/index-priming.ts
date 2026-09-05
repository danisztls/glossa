/**
 * Which per-work-type indexes a path needs before its route can render.
 *
 * `corpus-index.ts` stopped inlining the six large index files on 2026-09-03
 * (see the primers there for the 1.33 MB and why compression was not the
 * lever). What that leaves is one question — WHO waits for them — and this
 * module is the answer for reading routes.
 *
 * ONE PRIMING POINT IN THE ROOT LAYOUT, NOT THIRTEEN IN `+page.ts` FILES. The
 * synchronous readers are not confined to route components: `BookChapterPicker`
 * and `EditionMenu` sit in the reading chrome, `bookmarkContent.ts` answers for
 * a bookmark to any tier, and five of the thirteen reading routes have no
 * `+page.ts` at all. Priming per route would therefore have meant creating
 * files whose only content was a wait, and would still have left every
 * chrome component to be audited one by one — with a miss showing up as a
 * thrown error on a route nobody tested. The layout's `load` already runs, and
 * already runs before any page component renders.
 *
 * IT IS NOT A ROUTE TABLE and deliberately does not import one. `route-
 * manifest.ts` decides what is a valid address; this only asks which shelf a
 * path is on, which is the first segment and nothing more. Getting it wrong in
 * the permissive direction costs a fetch; the `ALL` default is what makes that
 * the only direction it can be wrong in.
 */

import { isUiLang } from './ui-langs';

/** The primer names `corpus-index.ts` exports an `ensure…Index()` for. */
export type IndexName = 'bible' | 'ccc' | 'compendium' | 'summa' | 'document' | 'prayer';

const ALL: readonly IndexName[] = ['bible', 'ccc', 'compendium', 'summa', 'document', 'prayer'];

/**
 * The home page renders FIVE shelves, not one — a Bible chapter picker, the
 * Catechism pair's outlines, the prayer groups and the Magisterium's documents
 * grouped by pontiff. It got `['ccc', 'compendium']` when this table was first
 * written, from a grep that found the two it names in `+page.svelte` and not
 * the three it reaches through `listDocuments`, `listPrayerGroups` and
 * `BookChapterPicker`; the Bible and Magisterium sections rendered empty
 * against a full corpus. Only the Summa is absent, and deliberately —
 * `/doctores` is not in the nav and the home page does not list it.
 *
 * IT TAKES NO `REFS` BEYOND WHAT IT ALREADY LISTS, unlike every reading shelf
 * below. The home page renders shelf listings, work titles and prayer
 * incipits, and not one line of corpus prose or apparatus — so nothing on it
 * ever resolves a reference, which is the whole of what that set is for.
 */
const HOME: readonly IndexName[] = ['bible', 'ccc', 'compendium', 'document', 'prayer'];

/**
 * The indexes a linkified REFERENCE reads, which every reading shelf owes on
 * top of its own — a shelf renders the corpus's prose, and the corpus's prose
 * cites the rest of the corpus.
 *
 * `refs.ts`'s `refAddress` is called from render, once per reference, by
 * `ProseBlocks`/`InlineProse`/`Sidenote`/`CommentaryGloss`/`RefText` — every
 * component that turns a citation into a link. It validates the address before
 * minting one (a plausible-looking wrong link is the failure that module is
 * written against), and three of its branches validate against a registry:
 * scripture through `findBookByAbbrev`, a Summa citation through
 * `summaQuestionExists`, a document siglum through `documentSectionExists`.
 * The other two need none — a CCC or Compendium paragraph address is minted
 * from the number itself, and a `CIC` canon reads a registry that is still
 * inlined.
 *
 * THE TABLE BELOW ASKED WHERE A SHELF'S OWN TEXT COMES FROM, and that is not
 * the same question. `/doctrina-socialis/1` was listed as needing nothing: the
 * Compendium of the Social Doctrine reads an inlined registry for its own
 * paragraphs, which is true, and then footnotes those paragraphs with
 * Scripture — so the first reference on the page threw `listBooks: the bible
 * index was read before it was primed` out of `ProseBlocks`' own `hrefFor`. It
 * was never one shelf's bug. `/documenta` primed only `document`, against
 * prose that cites Scripture in the open rather than in footnotes (~4,400
 * locators corpus-wide, 334 in Evangelium Vitae alone — see
 * `refs-grammar.ts`'s `linkifyProse`); `/catechismus` primed the Catechism
 * pair and neither of the two registries its footnotes cite most.
 *
 * It costs three parallel fetches on a cold reading route — 314 KB, 87 KB and
 * 127 KB raw as of 2026-09-03, `sync-corpus.mjs` prints the current figures —
 * and nothing on any later navigation, since the primers memoise. That is the
 * price of the lazy index tier being correct rather than nearly correct; the
 * alternative on offer was a page that renders its citations as dead text.
 */
const REFS: readonly IndexName[] = ['bible', 'summa', 'document'];

/**
 * A shelf's own indexes plus `REFS`, ordered as `ALL` orders them so that the
 * answer does not depend on how the entry happened to be written.
 */
function withRefs(...own: readonly IndexName[]): readonly IndexName[] {
	const wanted = new Set<IndexName>([...own, ...REFS]);
	return ALL.filter((name) => wanted.has(name));
}

/**
 * First path segment -> the indexes a page under it reads.
 *
 * The Catechism and the Compendium are ONE entry and take both, in both
 * directions: `CatechismIndex.svelte` renders the pair's chapter lists side by
 * side, and `/catechismus/caput/{n}` reads the Compendium's structure to do it.
 * Splitting them would be a fetch saved on one route and a thrown error on the
 * other.
 */
const BY_SEGMENT: Readonly<Record<string, readonly IndexName[]>> = {
	scriptura: withRefs('bible'),
	catechismus: withRefs('ccc', 'compendium'),
	documenta: withRefs('document'),
	// The prayers themselves carry no links — `PrayerBlocks` renders through
	// `InlineText`, which is handed no `hrefFor` at all. `PrayerMystery` does:
	// a mystery of the Rosary prints the passage it is contemplated with, and
	// that citation is a `RefText` like any other.
	preces: withRefs('prayer'),
	doctores: withRefs('summa'),
	// These two read registries that are still eagerly inlined (6.9 KB and
	// 15.5 KB) for their own text, so `REFS` is the whole of what they need —
	// which is exactly what made them look like they needed nothing.
	'doctrina-socialis': withRefs(),
	'ius-canonicum': withRefs(),
	// The learning portal renders no corpus prose — every route step is a
	// LINK, titled from an index — so it takes the shelves it names and no
	// `REFS`, on the home page's reasoning directly above. It reaches the
	// documents and the Social Doctrine through `manifests` and an inlined
	// registry, both of which `+layout.ts` already has on every path.
	schola: ['bible', 'ccc', 'compendium', 'prayer'],
	// The one shelf that really does need nothing: the colophon is the site's
	// own writing about the corpus, and cites it only by title. Listed with an
	// empty set rather than left out, so a reader of this table can tell "needs
	// nothing" from "nobody considered it".
	colophon: []
};

/**
 * The indexes to prime for `pathname`.
 *
 * The home page takes the Catechism pair because it renders their outlines, and
 * anything unrecognised takes everything: a path this table has not heard of is
 * either a chrome page that will use none of them (the waits resolve against
 * primers that are already memoised, so a second visit costs nothing) or a
 * route added without this file being updated, and that one must not throw.
 */
export function indexesForPath(pathname: string): readonly IndexName[] {
	const segments = pathname.replace(/^\/+/, '').split('/');
	// A language entry point (`/es/scriptura/iosue/1`) is the same shelf as the
	// bare path — `isUiLang` rather than `route-manifest.ts`'s `parseLangEntry`,
	// which needs a `RouteManifest` this runs too early to have and answers a
	// stricter question (is this a VALID entry point) than the one asked here.
	const first = segments[0] ?? '';
	// `/pt` ALONE IS THE CHROME HOME PAGE, not a prefix with an empty rest —
	// `route-manifest.ts`'s `parseLangEntry` says so in as many words, and it is
	// why the language check cannot simply strip a leading tag: `/it` must land
	// where `/` lands, and `/it/scriptura/…` where `/scriptura/…` does.
	const segment = isUiLang(first) ? (segments[1] ?? '') : first;
	if (segment === '') return HOME;
	return BY_SEGMENT[segment] ?? ALL;
}
