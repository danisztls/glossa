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
	socialDoctrine: number[];
	socialDoctrineChapters: number[];
	canonLaw: number[];
	/** The canon each reading unit of the Code opens at — what
	 *  `/ius-canonicum/titulus/{n}` is addressed by. */
	canonLawTitles: number[];
	documents: string[];
	prayers: string[];
	/** Part slug -> question numbers, unioned across editions. */
	summa: Record<string, number[]>;
}

/**
 * The pages whose content IS the interface, in the order the sitemap lists them.
 *
 * These are the only addresses that take an interface-language prefix
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
	'/bibliotheca',
	'/scriptura',
	'/catechismus',
	'/catechismus/compendium',
	'/doctrina-socialis',
	'/documenta',
	'/ius-canonicum',
	// The shelf and the one work on it. Both are chrome by the same test as
	// the rest: every word on either page is the interface. It and
	// `/catechismus/compendium` are the two-segment members, which
	// `parseChromePath` handles because it splits on the FIRST slash and
	// matches the remainder whole.
	'/doctores',
	'/doctores/summa',
	'/preces',
	// The guide, last for the reason Learn is last in the bar and in the home
	// page's doors. It joined on 2026-09-06 with its 58 `schola.*` keys.
	'/schola',
	'/colophon'
] as const;

/**
 * ONE PAGE IS CHROME BY THIS TEST AND BELONGS ON THIS LIST, and is held off it
 * by one thing: **a cluster claims a page is written in 37 languages, and
 * `/calendarium` is not yet.**
 *
 * **IT IS WAITING, NOT EXCLUDED.** It joins the list above the day its strings
 * are translated — one line here plus a `CHROME_KEYS` entry in
 * `scripts/route-titles.mjs`, and nothing else moves, because
 * `sitemap.test.ts` and `shell-head.test.ts` are written as arithmetic over
 * `CHROME_PATHS.length`. Until then it is unpublished: no language prefix,
 * no `hreflang` cluster, no sitemap row, and no per-page `<title>` or
 * description at the edge. `PLAN.md` §Pages that are unpublished carries the
 * table of what it is waiting on and is the place to look for the current
 * state; the counts below are dated and rot.
 *
 * `scripts/route-titles.mjs` states the rule this enforces — a cluster whose
 * Portuguese member is described in English is worse than no cluster, because
 * it tells a search engine the page is Portuguese and then serves English.
 *
 *   - `/calendarium` holds no corpus text at all, which makes it the purest
 *     chrome page on the site, and its 75 `calendar.*` keys SPLIT IN TWO. The
 *     44 the page labels itself with — the date controls, the regions, the
 *     seasons, ranks and colours — are written in all 37 since 2026-09-06.
 *     The 31 that TEACH those words are not: `calendar.gloss.*` and
 *     `calendar.primer.*` are prose, they are written in `en`, `pt` and `la`,
 *     and the other 34 fall through to English per key (`i18n.svelte.ts`). A
 *     reader in those 34 would meet a page labelled in their language whose
 *     every gloss and whose whole primer is English, which is the ARGUED gate
 *     failing while the coded one passes — `calendar.title` and
 *     `calendar.tagline` are both label keys and would open it. The page is
 *     also still being built.
 *
 * It is in `STATIC_PATHS`, so it exists, answers 200 and is indexable at its
 * bare address; it is not claimed in a language it is not written in.
 *
 * **THE OTHER TWO WERE PUBLISHED ON 2026-09-06, AND WHAT EACH COST IS THE
 * POINT.** `/catechismus/compendium` needed nine `compendium.*` keys in
 * twenty-three dictionaries; `/schola` needed all 58 of its own in
 * thirty-six, because that page is addressed to the reader who has no
 * vocabulary yet (`docs/research/audiences.md` §5) and title-plus-tagline
 * alone would have satisfied the gate as CODED while breaking it as ARGUED —
 * a cluster in 37 languages over a page of English. **The gate is on the head,
 * and the claim is about the page**; where the two come apart, translate the
 * page.
 *
 * `/ius-canonicum` was missing for a different reason — nobody added it — and
 * its `canonLaw.landing.*` keys were already in all 37, which is why it joined
 * the list above on the day the omission was found and these did not.
 *
 * **`/` IS THE ONE EXCEPTION, AND IT IS TAKEN RATHER THAN OVERLOOKED**
 * (2026-09-06, by direction). Its rewrite added three English-only keys —
 * `home.tagline` and two section headings, all three translated later the same
 * day — and the remedy above is not available to the root: withholding the home
 * page costs the sitemap row and the `hreflang` cluster that every other page's
 * ranking leans on, which is a worse outcome than a heading falling through to
 * English. The exception is kept written down because it is the ROOT's, not
 * these keys': the next English-only string on `/` inherits it. What the rule
 * actually protects is intact either way, because the gate is on a page's NAME
 * and DESCRIPTION and not on its body: `/`'s `<title>` is `home.title` and its
 * description is composed by `scripts/route-titles.mjs` from five work names,
 * and all six are written in all 37. Everything else on the page is a name or
 * a sentence another page already wrote — each door is `nav.*` over its
 * destination's own tagline. **This is not a precedent for the three above**,
 * each of which has a page's worth of English and a remedy that costs it
 * nothing it cannot get back.
 */

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
 * A LANGUAGE ENTRY POINT, WHICH IS NOT A PUBLISHED ADDRESS. The
 * `CHROME_PATHS` above take a prefix and KEEP it: they are real pages in
 * fourteen languages, they self-canonicalize, and they declare an `hreflang`
 * cluster. A reading address prefixed this way is a doorway instead -- it is
 * served, it sets and persists the language exactly as the switcher does, and
 * then `[uilang=uilang]/[...rest]` replaces it in the bar with the citation it
 * names. It canonicalizes to that bare path, appears in no sitemap, and
 * declares no alternates.
 *
 * WHY IT EXISTS AT ALL, given that prefixing reading addresses was refused
 * (site/docs/languages.md): every objection there is about PUBLICATION --
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

/**
 * Every page the app renders that is not an address into the corpus.
 *
 * THIS IS THE EXISTENCE TABLE AND `CHROME_PATHS` IS THE PUBLICATION ONE, and
 * a page needs the first to answer 200 at all. They overlap almost entirely,
 * which is how the two that were in neither went unnoticed: `/calendarium`
 * and `/ius-canonicum` answered **404 with the app's own not-found UI** to
 * every cold load and every crawler from the day each landed, while
 * client-side navigation into them worked perfectly, because the SPA router
 * never asks the worker. A reader who followed the nav saw the page; a reader
 * who refreshed it, opened it in a new tab, or was sent the link did not.
 * (`/ius-canonicum` is in `CHROME_PATHS` now too and would pass on that
 * alone; it is listed here as well because every other page on this list is.)
 *
 * `route-manifest.test.ts` walks `src/routes/` and fails on a route directory
 * that reaches neither table, so the next one cannot be forgotten the same way.
 */
const STATIC_PATHS = new Set([
	'/',
	'/bibliotheca',
	'/scriptura',
	'/catechismus',
	// The Compendium's own index, added 2026-09-04. It was NOT a page until
	// then — the Catechism's index presents both works a row at a time
	// (`CatechismIndex.svelte`, 2026-08-28) — but that index is a table of
	// DIVISIONS, so the Compendium's 598 questions were reachable only by
	// number and the one work written for a reader with no vocabulary could
	// not be browsed as questions at all.
	'/catechismus/compendium',
	'/doctrina-socialis',
	'/documenta',
	'/ius-canonicum',
	// The one page here whose subject is not a text at all.
	'/calendarium',
	'/doctores',
	'/doctores/summa',
	'/preces',
	// The learning portal, added 2026-09-04, and the door the bar's "Learn"
	// opens since that day — it pointed at `/catechismus` before, which is a
	// table of divisions and so unusable by a reader who cannot name one
	// (`docs/research/audiences.md` §5). It holds no corpus text: every step
	// of every route on it is a link, titled by the work it names.
	'/schola',
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
		case 'socialDoctrine':
			return manifest.socialDoctrine.includes(address.n);
		case 'socialDoctrineChapter':
			return manifest.socialDoctrineChapters.includes(address.n);
		case 'canonLaw':
			return manifest.canonLaw.includes(address.n);
		case 'canonLawTitle':
			return manifest.canonLawTitles.includes(address.n);
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
