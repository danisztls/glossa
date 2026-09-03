/**
 * Which of the three error pages a failed navigation gets.
 *
 * A separate module for `sw-policy.ts`'s reason: this is a POLICY, three lines
 * long, and the alternative is three lines of `{#if}` inside `+error.svelte`
 * that no test can reach — nothing in this project renders a component under
 * `vitest` (`environment: 'node'`). The rule was wrong for a year in a way that
 * was invisible precisely because it lived where nothing could assert it.
 *
 * See `+error.svelte`'s docblock for why each answer is the right one; this
 * file owns only the choosing.
 */
export type ErrorView =
	/** The corpus does not carry this address. A dead end, by design. */
	| 'not-found'
	/** It threw, and offline mode is on: the text exists, it is not on the device. */
	| 'not-downloaded'
	/** It threw while online: the address is good and the request was not. */
	| 'load-failed';

/**
 * `status` is SvelteKit's: 404 for every deliberate `error(404, …)` in a
 * `load`, 500 for an unexpected throw. The status is the discriminator and the
 * message is not — see `+error.svelte`.
 */
export function errorView(status: number, offlineEnabled: boolean): ErrorView {
	if (status === 404) return 'not-found';
	return offlineEnabled ? 'not-downloaded' : 'load-failed';
}
