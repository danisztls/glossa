import { primeForPath } from '$lib/index-priming';

/**
 * The home page is prerendered, against the root layout's `ssr = false`.
 *
 * THE SHELL PAINTS NOTHING UNTIL ITS DATA HAS LANDED, which is a fact about
 * every route and only worth paying to fix on the ones a stranger arrives at:
 * measured cold on Slow 4G, `/` reported LCP 5,344 ms with FCP at the same
 * millisecond — the first pixel of text and the largest were one event,
 * because both waited on the boot chunk and the layout's fetches.
 *
 * A page option set here overrides the layout's for this route alone, so the
 * shell arrangement `site/docs/shell.md` describes is unchanged everywhere
 * else. `ssr` and `prerender` are both required and neither is sufficient:
 * prerendering with `ssr = false` writes the same empty shell to a second
 * filename.
 *
 * WHAT IS DELIBERATELY NOT IN THE PRERENDERED HTML is the day's card. `day`
 * derives from `todayNumber`, which `onMount` assigns from the client's clock
 * (`+page.svelte`), so `{#if day}` emits nothing at build time — and that is
 * the correct output rather than a limitation to work around. A build-time
 * "today" is the day the build was made, and a deploy here ships one person's
 * working tree whenever they have something to ship.
 */
export const ssr = true;
export const prerender = true;

/**
 * `await parent()` first, the wait every `+page.ts` here owes the layout's
 * index priming — and then the same priming again, because on the SERVER the
 * layout's `load` does not exist: SvelteKit sets `load: null` on the server
 * node of any node declaring `ssr = false`, and the root layout declares it.
 * Without this line a prerendered page renders against empty registries and
 * says so only as a warning. `primeForPath` holds the whole argument.
 */
export async function load({ parent, url }: { parent: () => Promise<unknown>; url: URL }) {
	await parent();
	await primeForPath(url.pathname);
}
