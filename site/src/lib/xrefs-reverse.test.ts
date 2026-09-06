import { describe, expect, it } from 'vitest';
import { getScriptureCitationsForChapter } from './corpus';

/**
 * The reverse scripture index — "what cites this verse", the half of
 * docs/decisions.md's flagship bidirectional CCC-Bible linking that had never
 * shipped, and since 2026-09-05 the half that answers for the whole corpus
 * rather than for the Catechism and the documents alone.
 *
 * Runs against `fixtures/xrefs/scripture-citations.json` (npm test is
 * fixture-locked; see site/README.md), which carries, deliberately:
 *   - ¶29 and ¶31 both citing Genesis 3, at different verses and at a
 *     shared one (v9), so grouping and multi-paragraph verses are covered;
 *   - ¶31 and ¶32 both citing Genesis 1 as a WHOLE CHAPTER, the case the
 *     sentinel-key-0 convention exists for;
 *   - a Summa article and a Douay-Rheims note among the citers, because the
 *     panel could see neither kind before and a fixture that holds only the
 *     old two would pass whatever happened to the rest.
 *
 * THE INVERSION IS NOT TESTED HERE ANY MORE and that is the change: it
 * happens in `build-xrefs.mjs` at build time, where `invertScriptureRefs`'
 * own suite covers it. What is left for this file is the lookup — that a
 * chapter finds its own verses, and that a chapter nothing cites answers
 * empty rather than throwing.
 */
describe('getScriptureCitationsForChapter', () => {
	it('finds every citer of a verse', () => {
		const byVerse = getScriptureCitationsForChapter('acts', 17);
		expect(byVerse.get(26)).toEqual([{ kind: 'ccc', n: 28 }]);
		expect(byVerse.get(27)).toEqual([{ kind: 'ccc', n: 28 }]);
		expect(byVerse.get(28)).toEqual([{ kind: 'ccc', n: 28 }]);
	});

	it('groups every citer of one verse, whatever kind they are', () => {
		// Gen 3:9 is cited by ¶29 (as part of 8-10), by ¶31 on its own, and by
		// a note in the Douay-Rheims's own apparatus.
		expect(getScriptureCitationsForChapter('gen', 3).get(9)).toEqual([
			{ kind: 'ccc', n: 29 },
			{ kind: 'ccc', n: 31 },
			{
				kind: 'annotation',
				work: 'bible.douay-rheims.en',
				osis: 'john',
				chapter: 1,
				verse: 14
			}
		]);
	});

	it('reads a whole-chapter citation under verse 0, not spread across verses', () => {
		// Expanding it would claim each work cited every verse individually —
		// a stronger statement than any of them made.
		const byVerse = getScriptureCitationsForChapter('gen', 1);
		expect(byVerse.get(0)).toEqual([
			{ kind: 'ccc', n: 31 },
			{ kind: 'ccc', n: 32 },
			{ kind: 'summa', part: 'I', question: 74, article: 2 }
		]);
		expect(byVerse.size).toBe(1);
	});

	it('returns an empty map for a chapter nothing cites', () => {
		expect(getScriptureCitationsForChapter('gen', 49).size).toBe(0);
		expect(getScriptureCitationsForChapter('nonexistent', 1).size).toBe(0);
	});
});
