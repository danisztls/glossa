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
 */
const HOME: readonly IndexName[] = ['bible', 'ccc', 'compendium', 'document', 'prayer'];

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
	scriptura: ['bible'],
	catechismus: ['ccc', 'compendium'],
	documenta: ['document'],
	preces: ['prayer'],
	doctores: ['summa'],
	// The Compendium of the Social Doctrine and the Code of Canon Law read
	// registries that are still eagerly inlined (6.9 KB and 15.5 KB), so they
	// need nothing primed — but they DO render the reading chrome, whose
	// edition menu asks the manifest, not an index. Listed with an empty set
	// rather than left out, so a reader of this table can tell "needs nothing"
	// from "nobody considered it".
	'doctrina-socialis': [],
	'ius-canonicum': [],
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
