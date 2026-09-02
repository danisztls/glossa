import { redirect } from '@sveltejs/kit';

/**
 * `/es/scriptura/iosue/1` sets Spanish, then becomes `/scriptura/iosue/1`.
 *
 * THE PREFIX IS A DOORWAY, NOT AN ADDRESS. The eight pages under
 * `CHROME_PATHS` have their own `+page.svelte` here and KEEP their prefix:
 * they are published in fourteen languages and declare an `hreflang` cluster.
 * Everything else a reader can put a language in front of is a citation, which
 * is the same citation in every language -- so the language is taken, stored,
 * and the bar is left showing the address (`docs/decisions.md` §The site, and
 * `parseLangEntry` in `route-manifest.ts` for the edge's half).
 *
 * SvelteKit prefers a literal route segment to a rest parameter, so this does
 * not shadow those eight. `route-manifest.test.ts` asserts the boundary rather
 * than trusting it: the failure mode is a chrome page quietly redirecting to
 * its own unprefixed path and losing the published address a search result
 * points at.
 *
 * The parent layout's `load` has already awaited `i18n.set(uilang)` -- a
 * layout load resolves before its page's -- so the language is applied and
 * persisted by the time this runs, and the reader lands on a page that is
 * already in the right language rather than one that changes into it.
 *
 * A `load` redirect REPLACES the history entry, so Back does not bounce off
 * the doorway.
 *
 * The hash is read from `location` rather than `url`, which is not an
 * oversight: a fragment is never sent to a server, so SvelteKit's `url` has
 * none to give during a `load`. `ssr = false` (see `src/routes/+layout.ts`)
 * makes reading `location` here unconditional and safe, and dropping the hash
 * would lose the verse a shared `/es/scriptura/ioannes/3#v16` names.
 */
export function load({ params, url }: { params: { rest: string }; url: URL }) {
	const hash = typeof location === 'undefined' ? '' : location.hash;
	redirect(307, `/${params.rest}${url.search}${hash}`);
}
