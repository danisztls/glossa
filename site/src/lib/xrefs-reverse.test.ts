import { describe, expect, it } from 'vitest';
import { getCccBibleXrefs, getCccCitationsForChapter } from './corpus';

/**
 * The reverse direction of `xrefs/ccc-bible.json` — "which CCC paragraphs
 * cite this verse", the half of docs/decisions.md's flagship bidirectional
 * CCC-Bible linking that had never shipped.
 *
 * Runs against `fixtures/xrefs/ccc-bible.json` (npm test is fixture-locked;
 * see site/README.md), which carries, deliberately:
 *   - ¶29 and ¶31 both citing Genesis 3, at different verses and at a
 *     shared one (v9), so grouping and multi-paragraph verses are covered;
 *   - ¶31 and ¶32 both citing Genesis 1 as a WHOLE CHAPTER (`verses: []`),
 *     the case the sentinel-key-0 convention exists for.
 */
describe('getCccCitationsForChapter', () => {
	it('inverts a simple one-paragraph citation', () => {
		const byVerse = getCccCitationsForChapter('acts', 17);
		expect(byVerse.get(26)).toEqual([28]);
		expect(byVerse.get(27)).toEqual([28]);
		expect(byVerse.get(28)).toEqual([28]);
	});

	it('groups every paragraph citing the same verse', () => {
		// Gen 3:9 is cited by ¶29 (as part of 8-10) and by ¶31 on its own.
		expect(getCccCitationsForChapter('gen', 3).get(9)).toEqual([29, 31]);
	});

	it('keeps paragraph numbers sorted', () => {
		const all = [...getCccCitationsForChapter('gen', 3).values()];
		for (const list of all) {
			expect(list).toEqual([...list].sort((a, b) => a - b));
		}
	});

	it('records a whole-chapter citation under verse 0, not spread across verses', () => {
		// Expanding `verses: []` across every verse would claim the Catechism
		// cited each one individually — a stronger statement than it made.
		const byVerse = getCccCitationsForChapter('gen', 1);
		expect(byVerse.get(0)).toEqual([31, 32]);
		expect(byVerse.size).toBe(1);
	});

	it('returns an empty map for a chapter nothing cites', () => {
		expect(getCccCitationsForChapter('gen', 49).size).toBe(0);
		expect(getCccCitationsForChapter('nonexistent', 1).size).toBe(0);
	});

	it('agrees with the forward direction it is derived from', () => {
		// Every forward ref must reappear in the reverse index, or the
		// inversion silently dropped a citation.
		for (const cccN of [28, 29, 30, 31, 32]) {
			for (const ref of getCccBibleXrefs(cccN)) {
				const byVerse = getCccCitationsForChapter(ref.osis, ref.chapter);
				const keys = ref.verses.length > 0 ? ref.verses : [0];
				for (const key of keys) {
					expect(byVerse.get(key)).toContain(cccN);
				}
			}
		}
	});
});
