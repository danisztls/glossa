/**
 * The compact, public description of canonical reader URLs.
 *
 * This deliberately contains addresses and no reading text. It is generated
 * from the same corpus indexes the client uses, then consulted by the edge
 * worker before it returns the SPA shell. Keeping the grammar here makes the
 * client and the worker testable without giving either one a special case for
 * individual works.
 *
 * The URL grammar itself lives in `./address.ts` — this file decides only
 * whether an address the grammar recognises actually EXISTS.
 */

import { parseHref, summaPartFromSlug, summaPartSlug } from './address.ts';
import { isUiLang } from './ui-langs.ts';

// Re-exported because `scripts/sync-corpus.mjs` imports `summaPartSlug` from
// here (it lays the Summa's content files out by part slug) and this module is
// the one the build scripts already know about.
export { summaPartFromSlug, summaPartSlug };

export interface RouteManifest {
	version: 1;
	/** Deployment guard only; not used to decide any one URL. */
	workCount: number;
	/** Deployment guard only; not used to decide any one URL. */
	contentAssetCount: number;
	bible: Record<string, number[]>;
	ccc: number[];
	cccChapters: number[];
	compendium: number[];
	compendiumChapters: number[];
	documents: string[];
	prayers: string[];
	/** Part slug -> question numbers, unioned across editions. */
	summa: Record<string, number[]>;
}

/**
 * The pages whose content IS the interface, in the order the sitemap lists them.
 *
 * These eight are the only addresses that take an interface-language prefix
 * (`/pt/catechismus`), and the reason is the distinction the whole URL grammar
 * rests on: a reading address names a citation, which is the same citation in
 * every language and takes no prefix, while these name a page whose every word
 * is the chrome. A Portuguese reader searching for the Catechism has nothing to
 * match on this site otherwise — the reading pages are Latin addresses over
 * text a crawler is served in English (`SITEMAP_LANGS`).
 *
 * `/signata` and `/404` are static too and are deliberately absent: both are
 * `noindex`, so a language cluster would multiply pages nobody may find.
 */
export const CHROME_PATHS = [
	'/',
	'/scriptura',
	'/catechismus',
	'/documenta',
	// The shelf and the one work on it. Both are chrome by the same test as
	// the rest: every word on either page is the interface. `/doctores/summa`
	// is the only two-segment member, which `parseChromePath` handles because
	// it splits on the FIRST slash and matches the remainder whole.
	'/doctores',
	'/doctores/summa',
	'/preces',
	'/colophon'
] as const;

const CHROME_PATH_SET: ReadonlySet<string> = new Set(CHROME_PATHS);

/**
 * `/pt/catechismus` -> `{ lang: 'pt', path: '/catechismus' }`, else undefined.
 *
 * The bare path is NOT a language address and does not parse here: it
 * negotiates (see `app.html`'s pre-paint block and `I18nStore`), which is a
 * different thing from naming a language, and it is what `x-default` means in
 * the cluster these form.
 */
export function parseChromePath(pathname: string): { lang: string; path: string } | undefined {
	const slash = pathname.indexOf('/', 1);
	const lang = pathname.slice(1, slash === -1 ? undefined : slash);
	if (!isUiLang(lang)) return undefined;
	const path = slash === -1 ? '/' : pathname.slice(slash);
	return CHROME_PATH_SET.has(path) ? { lang, path } : undefined;
}

/**
 * `/es/scriptura/iosue/1` -> `{ lang: 'es', path: '/scriptura/iosue/1' }`.
 *
 * A LANGUAGE ENTRY POINT, WHICH IS NOT A PUBLISHED ADDRESS. The eight
 * `CHROME_PATHS` above take a prefix and KEEP it: they are real pages in
 * fourteen languages, they self-canonicalize, and they declare an `hreflang`
 * cluster. A reading address prefixed this way is a doorway instead -- it is
 * served, it sets and persists the language exactly as the switcher does, and
 * then `[uilang=uilang]/[...rest]` replaces it in the bar with the citation it
 * names. It canonicalizes to that bare path, appears in no sitemap, and
 * declares no alternates.
 *
 * WHY IT EXISTS AT ALL, given that prefixing reading addresses was refused
 * (docs/decisions.md §The site): every objection there is about PUBLICATION --
 * `hreflang` alternates that would be a false claim, 5,811 addresses becoming
 * 81,368, a forced `<sitemapindex>`, `hrefFor` losing its monopoly on the
 * spelling of an address. None of them reaches an address that is never
 * published. What forced the question is that the site teaches
 * `/pt/catechismus`, so `/pt/catechismus/330` is the form a reader
 * extrapolates, and it answered 404.
 *
 * `parseChromePath` is tried FIRST by every caller: a chrome page's prefix is
 * published and must not be stripped.
 */
export function parseLangEntry(
	pathname: string,
	manifest: RouteManifest
): { lang: string; path: string } | undefined {
	const slash = pathname.indexOf('/', 1);
	if (slash === -1) return undefined; // `/pt` alone is the chrome home page
	const lang = pathname.slice(1, slash);
	if (!isUiLang(lang)) return undefined;
	const path = pathname.slice(slash);
	// A chrome page keeps its prefix, so it is not an entry point in this sense
	// even though it parses as one.
	if (CHROME_PATH_SET.has(path)) return undefined;
	// ONE prefix, never two. `isCanonicalPath` calls back into this function, so
	// without this line `/es/pt/scriptura/iosue/1` would peel a segment per
	// round and answer 200 -- an address with 34 x 34 spellings, which is the
	// exact multiplication the unprefixed reading addresses exist to avoid.
	const next = path.indexOf('/', 1);
	if (isUiLang(path.slice(1, next === -1 ? undefined : next))) return undefined;
	return isCanonicalPath(path, manifest) ? { lang, path } : undefined;
}

const STATIC_PATHS = new Set([
	'/',
	'/scriptura',
	'/catechismus',
	// NOT `/catechismus/compendium`: the Compendium has no index of its own,
	// because the Catechism's presents both works a row at a time
	// (`CatechismIndex.svelte`, 2026-08-28). It is a path segment that groups
	// addresses rather than a page, exactly as `/catechismus/caput` is.
	'/documenta',
	'/doctores',
	'/doctores/summa',
	'/preces',
	// The reader's own bookmark library. Static and corpus-free, like
	// `/colophon`: what it lists lives in this browser's localStorage, so
	// there is nothing for the generated manifest to validate against.
	'/signata',
	'/colophon',
	'/404'
]);

/**
 * True exactly for an address the corpus or the app shell can resolve.
 *
 * `parseHref` decides SHAPE — including the one-canonical-spelling rule that
 * rejects `/catechismus/01234`, and the bare `0` admitted only for a book
 * introduction. This function decides EXISTENCE, and nothing else: a
 * well-formed address for a work the corpus does not carry is a real 404.
 */
export function isCanonicalPath(pathname: string, manifest: RouteManifest): boolean {
	if (STATIC_PATHS.has(pathname)) return true;
	if (parseChromePath(pathname)) return true;
	// A language entry point exists (200) but is nobody's address: it
	// canonicalizes to the bare path and the client strips it. Recursion is
	// bounded at one level, because `parseLangEntry` splits exactly one segment
	// and `isUiLang` never accepts a Latin path word.
	if (parseLangEntry(pathname, manifest)) return true;

	const address = parseHref(pathname);
	if (!address) return false;

	switch (address.kind) {
		case 'bible':
			return (manifest.bible[address.osis] ?? []).includes(address.chapter);
		case 'ccc':
			return manifest.ccc.includes(address.n);
		case 'cccChapter':
			return manifest.cccChapters.includes(address.n);
		case 'compendium':
			return manifest.compendium.includes(address.n);
		case 'compendiumChapter':
			return manifest.compendiumChapters.includes(address.n);
		case 'document':
			return manifest.documents.includes(address.slug);
		case 'prayer':
			return manifest.prayers.includes(address.slug);
		// `/doctores/summa/{part}/{question}` — an article is a FRAGMENT on the
		// question's page (`#a3`), so a part slug naming no part simply finds no
		// question list here.
		case 'summa':
			return (manifest.summa[address.part] ?? []).includes(address.question);
	}
}
