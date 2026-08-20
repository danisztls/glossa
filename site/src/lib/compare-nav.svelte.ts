/**
 * Compare mode's routing half: the three things every reading route did
 * verbatim to keep the stored preference and the address bar agreeing.
 *
 * WHY THIS IS A THIRD MODULE rather than more surface on either existing one.
 * The feature already had two halves and both refuse this code on purpose:
 *
 *   - `compare.ts` is the pure core, and its own docblock commits to having
 *     "NO dependency on `$app/state` or `$app/navigation`" — it builds and
 *     rewrites addresses as plain strings so it stays callable from anywhere,
 *     including a prerender pass where there is no router at all.
 *   - `compare-pref.svelte.ts` is the stored preference. It answers "what does
 *     the reader want", and deliberately knows nothing about how any given
 *     page got here; `syncFromUrl`/`paramValue` are its encode/decode pair,
 *     not a navigation API.
 *
 * What was left over is genuinely a third concern — *committing* a preference
 * change into the current URL — and it needs both halves plus the router. It
 * lived, byte-identical, in all seven reading routes (Bible chapter, CCC
 * paragraph and chapter, Compendium question and chapter, document, prayer),
 * which is the usual outcome for a concern with no module to live in.
 *
 * WHY THE URL IS REWRITTEN AT ALL, given the preference is already stored:
 * so the address in front of the reader stays the address that reproduces
 * what they are looking at. Compare mode is shareable precisely because
 * `?compare=` survives a copy-paste (see `compare-pref.svelte.ts`), and a
 * toggle that changed the page without changing the URL would quietly hand
 * out links that don't show what the sender sees. Every rewrite is
 * `replaceState` — toggling a second column is not a destination, and a
 * reader who toggles it three times should still be one Back press from the
 * page they arrived from, not four.
 */

import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { withCompareParam } from './compare';
import { compare } from './compare-pref.svelte';

/**
 * Rewrite the current address to carry the reader's current preference,
 * without disturbing the reading position.
 *
 * All three flags matter and are not defensive padding: `noScroll` because a
 * comparison is toggled *while reading a passage* and jumping to the top of
 * the chapter would lose it; `keepFocus` because the toggle and the edition
 * picker are themselves focused controls, and a keyboard reader who lost
 * focus to `<body>` would have to tab back through the page to reach the
 * control they just used; `replaceState` per the module docblock.
 */
function commitToUrl() {
	goto(withCompareParam(page.url, compare.paramValue), {
		replaceState: true,
		noScroll: true,
		keepFocus: true
	});
}

/**
 * Turn compare mode on (route's own choice of second edition) or off.
 * Bound to `CompareToggle` on every reading route.
 */
export function toggleCompare() {
	compare.toggle();
	commitToUrl();
}

/**
 * The edition picker's choice handler — writes a SPECIFIC work id, where
 * `toggleCompare` writes the `AUTO` sentinel. Picking an edition is also how
 * compare mode gets turned on from the picker, so this never consults the
 * current state: choosing an edition means "compare against this one",
 * whether or not a second column was already showing.
 */
export function chooseComparisonEdition(id: string) {
	compare.set(id);
	commitToUrl();
}

/**
 * Adopt an incoming `?compare=` parameter as the stored preference, for as
 * long as the calling component is mounted. Call once during component init,
 * like any rune.
 *
 * The `browser` guard is inherited from the seven routes this was lifted out
 * of, where it dates from the era when every route was prerendered and
 * reading `page.url.searchParams` server-side threw (one prerendered file
 * served every query string that pointed at it — see
 * `bible/[book]/[chapter]/+page.svelte`'s `citedRange` docblock, which
 * documents that trap for `?v=`). Since the site became one SPA shell with
 * `ssr = false` (`+layout.ts`, docs/decisions.md 2026-08-18) no route
 * component runs during the build at all, so the guard is now belt-and-braces
 * rather than load-bearing. It is kept because it states the requirement —
 * this reads the address bar, which only exists in a browser — and costs
 * nothing; it is NOT evidence that this can run server-side.
 *
 * A side effect rather than a derived read, because this ADOPTS the parameter
 * into the stored preference rather than answering "is compare requested" for
 * this render alone — see `CompareStore.syncFromUrl`, including why the
 * ABSENCE of the parameter must stay silent instead of meaning "off".
 *
 * Reading `page.url` inside the effect is also what makes it re-run when the
 * router swaps one address for another under the same component — the reading
 * routes are reused chapter to chapter, and a fresh `?compare=` arriving that
 * way has to be honoured the same as one on a cold load.
 */
export function adoptCompareFromUrl() {
	$effect(() => {
		if (browser) compare.syncFromUrl(page.url);
	});
}
