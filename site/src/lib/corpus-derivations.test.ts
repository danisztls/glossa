import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * A SOURCE SCAN, because no unit test can reach this bug.
 *
 * `corpus-index.ts`'s large registries are filled by primers now, not at module
 * load. Anything in `corpus.ts` that derives a map from one of them at MODULE
 * SCOPE therefore derives it from nothing, and memoises the emptiness forever.
 * That is what blanked the home page's Bible and Magisterium sections against a
 * full corpus on 2026-09-03: `canonicalBooksByOsis` and `documentGroupsBySlug`
 * were module-scope IIFEs, and both read `manifests` indirectly through
 * `listWorksOfType`, so neither looked like a registry read.
 *
 * `npm test` cannot catch a repeat by RUNNING anything: under fixtures
 * `USE_REAL_CORPUS` is false, the registries are populated with fixture data at
 * module scope, and an eager derivation is perfectly correct. The difference
 * only exists against a real corpus. So the invariant is asserted about the
 * source text instead — the same move `sw-policy.test.ts` makes when it reads
 * the kinds back out of `sync-corpus.mjs`.
 *
 * The fix for a failure here is `derived(() => …)` in `corpus.ts`, which
 * recomputes when `indexGeneration()` moves.
 */
const SOURCE = readFileSync(new URL('./corpus.ts', import.meta.url), 'utf8');

/** The registries `corpus-index.ts` fills from a primer rather than at module
 *  load. The small ones it still inlines eagerly are deliberately absent — a
 *  derivation from those is safe at module scope. */
const LAZY_REGISTRIES = [
	'manifests',
	'bibleIndex',
	'cccStructures',
	'cccAbbreviations',
	'cccParagraphNumbers',
	'summaStructures',
	'summaQuestionMetas',
	'compendiumStructures',
	'compendiumQuestionNumbers',
	'documentSectionNumbers',
	'prayerStructures',
	'prayerMetasByLang',
	'socialDoctrineAbbreviations'
];

/** Functions in this module that read a lazy registry for you — the indirection
 *  that made the original two invisible. */
const LAZY_READERS = [
	'listWorks',
	'listWorksOfType',
	'getWork',
	'listBooks',
	'getBook',
	'listDocuments',
	'getCccStructure',
	'getCompendiumStructure',
	'listPrayerGroups',
	'listSummaQuestions'
];

/** Module-scope `const`/`let` declarations, with the initializer text that
 *  follows them up to the next top-level declaration. */
function moduleScopeDeclarations(): { name: string; body: string; line: number }[] {
	const lines = SOURCE.split('\n');
	const out: { name: string; body: string; line: number }[] = [];
	let depth = 0;
	let current: { name: string; body: string[]; line: number } | undefined;
	for (const [i, line] of lines.entries()) {
		const declaration = depth === 0 ? /^(?:export )?(?:const|let) (\w+)/.exec(line) : null;
		if (declaration) {
			if (current) out.push({ ...current, body: current.body.join('\n') });
			current = { name: declaration[1], body: [line], line: i + 1 };
		} else if (current && depth > 0) {
			current.body.push(line);
		} else if (current) {
			out.push({ ...current, body: current.body.join('\n') });
			current = undefined;
		}
		for (const ch of line) {
			if ('{(['.includes(ch)) depth++;
			else if ('})]'.includes(ch)) depth--;
		}
	}
	if (current) out.push({ ...current, body: current.body.join('\n') });
	return out;
}

describe('corpus.ts module-scope derivations', () => {
	const pattern = new RegExp(`\\b(${[...LAZY_REGISTRIES, ...LAZY_READERS].join('|')})\\b`);

	it('routes every derivation from a lazily-primed registry through `derived`', () => {
		const offenders = moduleScopeDeclarations()
			.filter((d) => pattern.test(d.body))
			.filter((d) => !/=\s*derived[<(]/.test(d.body))
			.map((d) => `${d.name} (corpus.ts:${d.line})`);

		expect(
			offenders,
			'These read a registry that is empty until a primer fills it, and memoise the result. ' +
				'Wrap the initializer in `derived(() => …)` so it recomputes when `indexGeneration()` moves.'
		).toEqual([]);
	});

	it('still has derivations to check, so the scan cannot pass by finding nothing', () => {
		// A guard on the guard: if `moduleScopeDeclarations` ever stops matching
		// (a formatting change, a refactor), the test above would pass silently on
		// an empty list. These two are the ones the bug was found in.
		const derivations = moduleScopeDeclarations().filter((d) => /=\s*derived[<(]/.test(d.body));
		expect(derivations.map((d) => d.name)).toEqual(
			expect.arrayContaining(['canonicalBooksByOsis', 'documentGroupsBySlug'])
		);
	});
});
