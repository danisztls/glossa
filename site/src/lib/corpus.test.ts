import { describe, expect, it } from 'vitest';
import {
	getCompendiumChapterFor,
	getCompendiumQuestionRangeAsync,
	listCompendiumChapters
} from './corpus';

describe('Compendium whole-reading units', () => {
	it('uses the innermost chapter, while retaining a section fallback before its first chapter', () => {
		expect(getCompendiumChapterFor('en', 2)?.kind).toBe('chapter');
		expect(getCompendiumChapterFor('en', 1)?.kind).toBe('section');
	});

	it('makes all whole-reading starts available to the route manifest', () => {
		expect(listCompendiumChapters('en').map((chapter) => chapter.paragraphs[0])).toEqual([
			1, 1, 2, 6, 25
		]);
	});

	it('reads only the requested question range from the memoized language asset', async () => {
		await expect(getCompendiumQuestionRangeAsync('en', 2, 4)).resolves.toMatchObject([
			{ n: 2 },
			{ n: 3 },
			{ n: 4 }
		]);
	});
});
