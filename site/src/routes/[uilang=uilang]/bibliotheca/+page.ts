import { i18n } from '$lib/i18n.svelte';
import { primeForPath } from '$lib/index-priming';
import { isUiLang, UI_LANGS } from '$lib/ui-langs';

/**
 * Prerendered, like every chrome page — `src/routes/+page.ts` holds why the
 * root layout's `ssr = false` is overridden on these routes and nowhere else.
 *
 * A PREFIXED PAGE IS THE HALF WORTH PRERENDERING MOST, because its language is
 * in the address: `/pt/bibliotheca` can be written out in Portuguese at build
 * time, where the bare path can only be written in English and swapped once the
 * reader's own dictionary lands.
 *
 * THE ROUTE ITSELF IS NEW (2026-09-11). `/bibliotheca` has been in
 * `CHROME_PATHS` — so the sitemap has published `/pt/bibliotheca` and the
 * `hreflang` cluster has claimed it — while the app had no page here and
 * `[...rest]` redirected the address away. A cluster whose members redirect to
 * one negotiated page is the claim the cluster exists to make, unmade.
 */
export const ssr = true;
export const prerender = true;

export function entries() {
	return UI_LANGS.map((uilang) => ({ uilang }));
}

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
