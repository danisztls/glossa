import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// `sveltekit()` returns a `Promise<Plugin[]>`, not a `Plugin[]` — Vite's own
// dev/build pipeline tolerates a bare (unawaited) promise sitting in
// `plugins` because `resolveConfig` recursively flattens and awaits nested
// array entries, but Vitest's config resolution does not do that same
// flatten before wiring up the plugin list. Left unawaited, the promise
// never resolves and the entire SvelteKit plugin — the `$lib`/`$app` path
// aliases, and the `.svelte.ts` rune-module compiler `compare-pref.svelte.ts`
// needs to even construct — is silently absent under `vitest run`, not an
// error, just gone. That's why no test before this one ever imported a
// `.svelte.ts` store or a `$lib/...` alias: nothing had exercised the gap.
// Confirmed directly: a scratch test importing `$lib/compare` failed with
// "Cannot find module", and a scratch test constructing a `$state`-based
// store threw `ReferenceError: $state is not defined` (the literal,
// uncompiled rune call) — both fixed by this one `await`.
// The argument is `{}` and it is not decoration. `sveltekit()` called with
// NOTHING loads `svelte.config.js`, which this project does not have — its
// Kit options are passed inline in `vite.config.ts` — so every `npm test`
// printed `No Svelte config file found in …/site - using SvelteKit's default
// configuration without an adapter.` before its first line of output. Passing
// an object takes the "options from the Vite config" branch instead
// (@sveltejs/kit's exports/vite/index.js), which is silent. The validated
// config is the same either way: both end in `process_config` over an empty
// object, and nothing under `vitest run` reads an adapter.
//
// `runes` is here because a divergence in it would be silent and confusing
// rather than harmless — it is the one Kit option `vite.config.ts` sets that
// changes how a file COMPILES, and a `.svelte` component compiled one way by
// the dev server and another by a test is a difference no test could report
// as itself. Nothing imports a component today (`environment: 'node'`), which
// is exactly when a divergence like this gets written down instead of found.
export default defineConfig({
	plugins: [
		await sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	test: {
		include: ['src/**/*.test.ts'],
		// THE ORACLE IS NOT PART OF `npm test`, and the line above is why:
		// everything this run contains is hermetic — fixtures, no corpus, no
		// network, the same answer on any machine — while `oracle.test.ts`
		// reads 281 files of somebody else's computed calendars out of the
		// private corpus checkout. Checking our calendar against theirs is a
		// development verification, not a build gate; `npm run verify:calendar`
		// is the task and `vitest.oracle.config.ts` is its config.
		exclude: ['node_modules/**', 'src/lib/calendar/oracle.test.ts'],
		environment: 'node'
	}
});
