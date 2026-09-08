import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	BASELINE_PATH,
	compareLanguageCoverage,
	describePairs,
	languageCoverage
} from '../../scripts/language-coverage.mjs';

/**
 * The gate on what a reader in a given language can open.
 *
 * WHAT IS UNDER TEST IS THE FAILURE MODE AND NOT THE SET ARITHMETIC. Three
 * things have to hold or the gate guards nothing: a loss must be caught, a
 * SWAP must be caught (which is the whole reason the baseline is pairs and
 * not counts), and a work that fails to sync at all must read as losing every
 * one of its languages rather than as an absence nobody asked about.
 */

const baseline = {
	version: 1 as const,
	coverage: { bible: ['en', 'la', 'pt'], canonLaw: ['en'] }
};

const censusWith = (rows: Record<string, string[]>, languages = ['en', 'la', 'pt', 'pl']) => ({
	coverage: {
		languages,
		rows: Object.entries(rows).map(([key, langs]) => ({
			key,
			values: languages.map((l) => (langs.includes(l) ? 1 : 0))
		}))
	}
});

describe('languageCoverage', () => {
	it('keeps only the languages that reach anything, sorted', () => {
		const report = languageCoverage(censusWith({ bible: ['pt', 'en'] }));
		expect(report.coverage.bible).toEqual(['en', 'pt']);
	});

	it('writes an empty list rather than dropping a work nothing reaches', () => {
		// The distinction the whole gate turns on: a work present with no
		// languages is a corpus that lost them all, and must not look like a
		// work that was never there.
		expect(languageCoverage(censusWith({ bible: [] })).coverage.bible).toEqual([]);
	});
});

describe('compareLanguageCoverage', () => {
	it('names the pair a build no longer offers', () => {
		const { lost } = compareLanguageCoverage(
			languageCoverage(censusWith({ bible: ['en', 'la'], canonLaw: ['en'] })),
			baseline
		);
		expect(lost).toEqual([{ work: 'bible', lang: 'pt' }]);
	});

	/**
	 * THE CASE A COUNT WOULD MISS, and the reason the baseline is a set. Three
	 * languages before and three after; the one that went is the finding.
	 */
	it('catches a swap that leaves the count unchanged', () => {
		const { lost, gained } = compareLanguageCoverage(
			languageCoverage(censusWith({ bible: ['en', 'la', 'pl'], canonLaw: ['en'] })),
			baseline
		);
		expect(lost).toEqual([{ work: 'bible', lang: 'pt' }]);
		expect(gained).toEqual([{ work: 'bible', lang: 'pl' }]);
	});

	/**
	 * The failure `CLAUDE.md` records for the lastmod ledger, one file over: a
	 * `CORPUS_DIR` that yields nothing produces a report with the work missing
	 * entirely, and two clean runs would otherwise ship it.
	 */
	it('reads a work absent from the build as losing every language it had', () => {
		const { lost } = compareLanguageCoverage(languageCoverage(censusWith({})), baseline);
		expect(lost).toEqual([
			{ work: 'bible', lang: 'en' },
			{ work: 'bible', lang: 'la' },
			{ work: 'bible', lang: 'pt' },
			{ work: 'canonLaw', lang: 'en' }
		]);
	});

	it('reads a work the baseline has never seen as a gain and never as a loss', () => {
		const { lost, gained } = compareLanguageCoverage(
			languageCoverage(censusWith({ bible: ['en', 'la', 'pt'], canonLaw: ['en'], summa: ['la'] })),
			baseline
		);
		expect(lost).toEqual([]);
		expect(gained).toEqual([{ work: 'summa', lang: 'la' }]);
	});

	it('passes an unchanged build', () => {
		const { lost, gained } = compareLanguageCoverage(
			languageCoverage(censusWith({ bible: ['en', 'la', 'pt'], canonLaw: ['en'] })),
			baseline
		);
		expect(lost).toEqual([]);
		expect(gained).toEqual([]);
	});
});

describe('describePairs', () => {
	it('caps the list so a total collapse does not print itself', () => {
		const pairs = Array.from({ length: 30 }, (_, i) => ({ work: 'bible', lang: `l${i}` }));
		const text = describePairs(pairs, 3);
		expect(text).toBe('bible l0, bible l1, bible l2, +27 more');
	});
});

/**
 * The committed baseline is a file a person reads as a diff, so its shape is
 * asserted rather than assumed: a stray write with different formatting would
 * make the next real change unreadable, which is the only thing it is for.
 */
describe('the committed baseline', () => {
	const raw = readFileSync(BASELINE_PATH, 'utf8');
	const parsed = JSON.parse(raw);

	it('is version 1 and holds a language list per work', () => {
		expect(parsed.version).toBe(1);
		expect(Object.keys(parsed.coverage).length).toBeGreaterThan(0);
		for (const langs of Object.values(parsed.coverage)) {
			expect(Array.isArray(langs)).toBe(true);
		}
	});

	it('is sorted, tab-indented and newline-terminated, so a diff reads as one', () => {
		expect(Object.keys(parsed.coverage)).toEqual(
			[...Object.keys(parsed.coverage)].sort((a, b) => a.localeCompare(b))
		);
		for (const [work, langs] of Object.entries(parsed.coverage)) {
			expect([...(langs as string[])], work).toEqual(
				[...(langs as string[])].sort((a, b) => a.localeCompare(b))
			);
		}
		expect(raw.endsWith('\n')).toBe(true);
		// Tabs, matching every other generated JSON here. The file is in
		// `.prettierignore` all the same — prettier and this writer disagree
		// about wrapping a short array — so nothing but this asserts the shape.
		expect(raw).toContain('\n\t"coverage"');
	});
});
