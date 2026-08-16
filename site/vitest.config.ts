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
export default defineConfig({
	plugins: [await sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
