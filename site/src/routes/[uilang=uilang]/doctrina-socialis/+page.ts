import { i18n } from '$lib/i18n.svelte';
import { primeForPath } from '$lib/index-priming';
import { isUiLang, UI_LANGS } from '$lib/ui-langs';

/**
 * Prerendered, like every chrome page — `src/routes/+page.ts` holds why the
 * root layout's `ssr = false` is overridden on these routes and nowhere else.
 *
 * A PREFIXED PAGE IS THE HALF WORTH PRERENDERING MOST, because its language is
 * in the address: `/pt/doctrina-socialis` can be written out in Portuguese at build
 * time, where the bare path can only be written in English and swapped once the
 * reader's own dictionary lands.
 */
export const ssr = true;
export const prerender = true;

export function entries() {
	return UI_LANGS.map((uilang) => ({ uilang }));
}

/**
 * `i18n.set` is normally the parent layout's job — but a layout declaring
 * `ssr = false` has no `load` in the server build at all, so without this the
 * page prerenders in English under a Portuguese address.
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
