import { redirect } from '@sveltejs/kit';

/**
 * `/es/scriptura/iosue/1` sets Spanish, then becomes `/scriptura/iosue/1`.
 *
 * THE PREFIX IS A DOORWAY, NOT AN ADDRESS. The eight pages under
 * `CHROME_PATHS` have their own `+page.svelte` here and KEEP their prefix:
 * they are published in fourteen languages and declare an `hreflang` cluster.
 * Everything else a reader can put a language in front of is a citation, which
 * is the same citation in every language -- so the language is taken, stored,
 * and the bar is left showing the address (`site/docs/languages.md`, and
 * `parseLangEntry` in `route-manifest.ts` for the edge's half).
 *
 * SvelteKit prefers a literal route segment to a rest parameter, so this does
 * not shadow those eight. `route-manifest.test.ts` asserts the boundary rather
 * than trusting it: the failure mode is a chrome page quietly redirecting to
 * its own unprefixed path and losing the published address a search result
 * points at.
 *
 * `await parent()` IS THE WHOLE POINT OF THE REDIRECT BEING DELAYED. The
 * parent layout's `load` awaits `i18n.set(uilang)` so that the reader lands on
 * a page already in the right language rather than one that changes into it --
 * and this said in as many words that "a layout load resolves before its
 * page's", which is not true of SvelteKit and never was. A route's `load`s all
 * start at once and `parent()` is the only thing that orders them, so the
 * redirect used to fire while `set` was still fetching a dictionary: the
 * reader arrived in the OLD language and watched it swap, which is the exact
 * flash this route exists to avoid. See `src/routes/+layout.ts`, where the
 * same premise cost a 404 on an address the corpus holds.
 *
 * It also waits on the ROOT layout's primers, which is not a delay so much as
 * a move: `indexesForPath` gives `/es/scriptura/iosue/1` the indexes
 * `/scriptura/iosue/1` needs, so the wait after the redirect is the one that
 * disappears, and the reader spends it on the address they typed.
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
export async function load({
	params,
	url,
	parent
}: {
	params: { rest: string };
	url: URL;
	parent: () => Promise<unknown>;
}) {
	await parent();
	const hash = typeof location === 'undefined' ? '' : location.hash;
	redirect(307, `/${params.rest}${url.search}${hash}`);
}
