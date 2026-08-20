/**
 * Thin localStorage wrappers shared by every reader-preference module —
 * theme, font scale, UI language, content-edition override, compare mode,
 * install-hint state, and reading position.
 *
 * THE GUARD IS NOT DEFENSIVE NOISE. Several of these stores read their
 * initial value into `$state(...)` at MODULE INIT time, so merely importing
 * one touches storage — there is no "wait until the component mounts" point
 * to hide behind. And these modules are imported in two places that have no
 * `localStorage` global at all, where it is genuinely absent rather than a
 * stubbed-out empty object:
 *
 *   - **Under Vitest**, which runs with `environment: 'node'`
 *     (`vitest.config.ts`) — `compare-pref`, `i18n` and `install` all have
 *     tests that import the store directly.
 *   - **At build time**, when the application shell is generated in Node.
 *
 * Referencing it unguarded throws a `ReferenceError` in both. `typeof
 * localStorage === 'undefined'` is therefore load-bearing on every read and
 * write here, not a habit copied from call site to call site — which is
 * exactly what had happened before this module existed: the same guard,
 * spelled out by hand, at every one of them.
 *
 * WRITING `undefined` REMOVES THE KEY, rather than being rejected or
 * stringified to `"undefined"`. Every preference in this codebase already
 * has a notion of "no explicit choice" — compare mode off, no edition
 * override, no install-hint dismissal recorded — and that state is
 * represented by the key being absent, never by a sentinel string. Giving
 * `writeStoredString` that same two-state contract (a `string` sets,
 * `undefined` removes) lets a caller express "clear this preference"
 * directly, without a separate `removeItem` call the two could drift out
 * of sync with.
 *
 * `readStoredString` treats an empty-string value the same as an absent
 * key (both read back as `undefined`). That is a real behavioral choice,
 * not a rounding error — it is only safe to use at a call site that
 * already didn't distinguish "key missing" from "key present but empty"
 * (most of them never write `''` in the first place). One call site
 * genuinely does distinguish the two and deliberately does not use this
 * helper for its read; see the comment at `prefs.svelte.ts`'s `readStored`.
 */

export function readStoredString(key: string): string | undefined {
	if (typeof localStorage === 'undefined') return undefined;
	return localStorage.getItem(key) || undefined;
}

export function writeStoredString(key: string, value: string | undefined): void {
	if (typeof localStorage === 'undefined') return;
	if (value === undefined) {
		localStorage.removeItem(key);
	} else {
		localStorage.setItem(key, value);
	}
}

export function readStoredJson<T>(key: string, fallback: T): T {
	if (typeof localStorage === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		// Corrupt/foreign localStorage value — behave as if nothing were stored
		// rather than throwing during module init.
		return fallback;
	}
}

export function writeStoredJson<T>(key: string, value: T): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(key, JSON.stringify(value));
}
