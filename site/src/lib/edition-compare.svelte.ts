/**
 * Compare-mode edition resolution, shared by the four CCC/Compendium reading
 * routes (paragraph, chapter, question, chapter — `/catechismus/[n]`,
 * `/catechismus/caput/[n]`, `/compendium/[n]`, `/compendium/caput/[n]`).
 * Given a page's `byLang` map — every language the corpus embeds for this
 * address — and the reader's preferred content language, work out which
 * language renders as the primary column and, if compare mode is on, which
 * second edition goes beside it.
 *
 * WHY THIS IS FREE (no fetch) on all four routes: each route's `+page.ts`
 * embeds every language the corpus has for this address up front, precisely
 * because these pages are prerendered and content language is a client-side
 * preference (`content.svelte.ts`) with no server request to resolve it
 * against at load time. Comparing two editions here is just reading a
 * second already-embedded key out of the same map, never a second request.
 *
 * WHY `lang` FALLS BACK TO `availableLangs[0]` rather than the preferred
 * language unconditionally: the real corpus has every language complete for
 * every CCC paragraph and Compendium question (docs/decisions.md's language
 * symmetry principle), so this only fires against a partial fixture or a
 * genuine corpus asymmetry — but when it does, showing whichever language
 * actually exists beats a blank page for a preference the content simply
 * doesn't have.
 *
 * WHY `others` SKIPS AN ABSENT LANGUAGE rather than indexing into
 * `byLang` blind: the map is `Partial<Record<string, T>>` by construction —
 * every caller's `+page.ts` `continue`s past a language it doesn't have — so
 * a missing key is a real, reachable state, not a formality.
 *
 * WHY A WORK ID, NOT A BARE LANGUAGE TAG, IS WHAT GETS RESOLVED:
 * `compare.resolveTarget` (`compare-pref.svelte.ts`) checks a stored
 * preference against work ids, because the preference has to survive moving
 * between different works — a Bible edition id means nothing on a Catechism
 * page — see that module's docblock. `fallbackWorkId` is the route's own
 * choice with no reader override in play: the first other embedded
 * language, the same pick every one of these routes made before the
 * preference store existed.
 *
 * Returns a getter-backed object, not a plain object of already-read values:
 * every field here is a `$derived`, and reading them through getters is what
 * lets a caller's template keep reacting when the reader switches content
 * language, or the stored comparison target, mid-read. A plain object
 * literal would freeze each value at the moment this function returns.
 */

import type { WorkManifest } from './types';
import { compare } from './compare-pref.svelte';

/** One embedded language other than the primary, paired with the
 *  `WorkManifest` that `ComparisonEditionMenu` picks between and
 *  `compare.resolveTarget` checks a stored preference against. */
export interface OtherEdition {
	lang: string;
	work: WorkManifest;
}

export interface EditionCompare<T> {
	/** Every language this address has embedded, in `byLang`'s key order. */
	readonly availableLangs: string[];
	/** The language to render as the primary column — see the module
	 *  docblock on the `availableLangs[0]` fallback. */
	readonly lang: string;
	/** `byLang()[lang]` — `undefined` only if `byLang()` is empty, which
	 *  every caller's `+page.ts` already 404s on before this runs. */
	readonly current: T | undefined;
	/** Every OTHER embedded language, paired with its `WorkManifest`. */
	readonly others: OtherEdition[];
	/** `others[0]`'s work id — the route's own pick, before any
	 *  reader preference is applied. */
	readonly fallbackWorkId: string | undefined;
	/** The work id compare mode actually resolved to, or `undefined` when
	 *  compare is off or there is no second edition to offer. */
	readonly secondaryWorkId: string | undefined;
	readonly secondaryLang: string | undefined;
	readonly secondary: T | undefined;
	/** Whether both a primary and a resolved secondary edition exist —
	 *  what routes gate `CompareGrid` vs. the single-column view on. */
	readonly compareActive: boolean;
}

/**
 * Resolve the compare-mode edition chain for one reading route.
 *
 * `byLang` and `preferredLang` are thunks, not values, so this stays
 * reactive to the same things the inlined code was: `byLang` because the
 * route is reused across navigations to a new `n` (SvelteKit swaps
 * `data.byLang` under the same component), and `preferredLang` because it
 * tracks `content.langFor(...)`, itself a reactive read.
 *
 * Call once in a component body, like `useScrollSpy` — the `$derived`s below
 * need the component's reactive context to attach to.
 */
export function useEditionCompare<T extends { work: WorkManifest }>(
	byLang: () => Partial<Record<string, T>>,
	preferredLang: () => string
): EditionCompare<T> {
	const availableLangs = $derived(Object.keys(byLang()));
	const lang = $derived(byLang()[preferredLang()] ? preferredLang() : availableLangs[0]);
	const current = $derived(byLang()[lang]);

	const others = $derived(
		availableLangs
			.filter((l) => l !== lang)
			.flatMap((l) => {
				const entry = byLang()[l];
				return entry ? [{ lang: l, work: entry.work }] : [];
			})
	);
	const fallbackWorkId = $derived(others[0]?.work.id);

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			others.map((edition) => edition.work.id),
			fallbackWorkId
		)
	);
	const secondaryLang = $derived(
		others.find((edition) => edition.work.id === secondaryWorkId)?.lang
	);
	const secondary = $derived(secondaryLang ? byLang()[secondaryLang] : undefined);
	const compareActive = $derived(current !== undefined && secondary !== undefined);

	return {
		get availableLangs() {
			return availableLangs;
		},
		get lang() {
			return lang;
		},
		get current() {
			return current;
		},
		get others() {
			return others;
		},
		get fallbackWorkId() {
			return fallbackWorkId;
		},
		get secondaryWorkId() {
			return secondaryWorkId;
		},
		get secondaryLang() {
			return secondaryLang;
		},
		get secondary() {
			return secondary;
		},
		get compareActive() {
			return compareActive;
		}
	};
}
