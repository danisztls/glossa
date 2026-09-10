import { describe, expect, it } from 'vitest';
import { headingRows } from './section-headings';

/** The shape `structure.json` really stores, abbreviated to the two fields a
 *  heading row is made of. */
const node = (title: string, before?: number | null) => ({ title, before });

describe('headingRows', () => {
	const work = { title: 'Lumen Gentium', short_title: 'LG' };

	it('keeps a heading and the unit it stands before', () => {
		expect(headingRows([node('The Mystery of the Church', 1)], work)).toEqual([
			[1, 'The Mystery of the Church']
		]);
	});

	it('drops a heading that stands after the last numbered unit', () => {
		// `#s{n}` would name nothing — 6,642 rows of the real corpus, mostly
		// appendices and closing formulae.
		expect(headingRows([node('Appendix', null), node('Notes', undefined)], work)).toEqual([]);
	});

	it('drops the work’s own title and short title', () => {
		// Every document prints its name over its first page, and the box
		// already offers the document by that name.
		expect(
			headingRows([node('LUMEN GENTIUM', 1), node('lg', 1), node('Chapter I', 2)], work)
		).toEqual([[2, 'Chapter I']]);
	});

	it('drops the same words at the same anchor twice', () => {
		expect(headingRows([node('Introduction', 3), node('INTRODUCTION', 3)], work)).toEqual([
			[3, 'Introduction']
		]);
	});

	it('keeps the same words at two different anchors', () => {
		// Two chapters of one document may both open with `Conclusion`, and
		// they are two places.
		expect(headingRows([node('Conclusion', 4), node('Conclusion', 9)], work)).toEqual([
			[4, 'Conclusion'],
			[9, 'Conclusion']
		]);
	});

	it('keeps the front matter a document opens with', () => {
		// Deliberate: they are headings the edition really prints, and every
		// rule proposed for recognising them also catches a first chapter.
		expect(
			headingRows([node('PAUL, BISHOP, SERVANT OF THE SERVANTS OF GOD', 1)], work)
		).toHaveLength(1);
	});

	it('drops an empty or whitespace-only heading', () => {
		expect(headingRows([node('   ', 1), node('', 2)], work)).toEqual([]);
	});

	it('answers for a work with no title of its own', () => {
		expect(headingRows([node('Book I', 1)], {})).toEqual([[1, 'Book I']]);
	});
});
