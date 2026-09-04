/**
 * The calendar oracle's own vitest run — `npm run verify:calendar`.
 *
 * IT IS A SEPARATE CONFIG BECAUSE IT IS A SEPARATE KIND OF CHECK. Everything
 * `npm test` runs is hermetic: fixtures, no corpus, no network, the same
 * answer on any machine. `src/lib/calendar/oracle.test.ts` is not that — it
 * reads 281 files of somebody else's computed calendars out of the private
 * corpus checkout and compares three years of every calendar GCatholic
 * publishes against ours. That is a verification task you run while working
 * on the calendar, not a gate on a build, and it is excluded from the default
 * run in `vite.config.ts` for that reason.
 *
 * NO PLUGINS, DELIBERATELY. The oracle test and everything it imports
 * (`./year`, `./computus`, `./national`) use relative specifiers only — no
 * `$lib`, no `$app`, no `.svelte.ts` — so it needs neither the SvelteKit
 * plugin nor the rune compiler, and skipping them makes this run start in
 * about a tenth of the time. A test file added here that DOES need an alias
 * would fail with `Cannot find module`, which is the right kind of loud.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/lib/calendar/oracle.test.ts'],
		environment: 'node'
	}
});
