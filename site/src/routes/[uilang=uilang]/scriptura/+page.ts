import { i18n } from '$lib/i18n.svelte';
import { primeForPath } from '$lib/index-priming';
import { isUiLang, UI_LANGS } from '$lib/ui-langs';

/**
 * Prerendered, like every chrome page — `src/routes/+page.ts` holds why the
 * root layout's `ssr = false` is overridden on these routes and nowhere else.
 *
 * A PREFIXED PAGE IS THE HALF WORTH PRERENDERING MOST, because its language is
 * in the address: `/pt/scriptura` can be written out in Portuguese at build
 * time, where the bare path can only be written in English and swapped once the
 * reader's own dictionary lands.
 *
 * `entries()` is what makes a dynamic route prerenderable at all. SvelteKit
 * cannot discover `/pt/scriptura` by crawling, every link on the site being
 * unprefixed by design (`CHROME_PATHS`), so the paths have to be stated —
 * derived from `UI_LANGS` here so that adding a language needs no edit.
 */
export const ssr = true;
export const prerender = true;

export function entries() {
	return UI_LANGS.map((uilang) => ({ uilang }));
}

/**
 * Three things, and the second and third are the server's alone.
 *
 * `await parent()` is the wait every `+page.ts` here owes. `i18n.set` is
 * normally the parent layout's job — but a layout that declares `ssr = false`
 * has no `load` in the server build at all (SvelteKit sets `load: null` on
 * that node), so without this the page prerenders in English under a
 * Portuguese address, which is the exact flash the prefix exists to avoid, made
 * permanent. `primeForPath` is the same story for the registries.
 *
 * All three are memoised or idempotent, so in the browser — where the layout's
 * `load` does run — this costs a resolved promise apiece.
 */
export async function load({
	parent,
	params,
	url
}: {
	parent: () => Promise<unknown>;
	params: { uilang: string };
	url: URL;
}) {
	await parent();
	if (isUiLang(params.uilang)) await i18n.set(params.uilang);
	await primeForPath(url.pathname);
}
