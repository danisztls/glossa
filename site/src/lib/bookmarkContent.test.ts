import { describe, expect, it } from 'vitest';
import { bookmarkGroup, compareBookmarks } from './bookmarkContent';
import { parseHref } from './address';

const at = (href: string) => bookmarkGroup(parseHref(href)!);

describe('bookmarkGroup', () => {
	// One heading for the whole Magisterium, not one per document: a reader who
	// marks widely rather than deeply got a page of headings with a single row
	// under each.
	it('files every document under one section', () => {
		expect(at('/documenta/lumen-gentium#s12').key).toBe('magisterium');
		expect(at('/documenta/lumen-gentium').key).toBe('magisterium');
		expect(at('/documenta/dei-verbum').key).toBe('magisterium');
	});

	it('files a paragraph and its chapter under one work', () => {
		expect(at('/catechismus/1213').key).toBe('catechism');
		expect(at('/catechismus/caput/27').key).toBe('catechism');
	});

	it('files a question and one of its articles under one work', () => {
		expect(at('/doctores/summa/ii-ii/184').key).toBe('summa');
		expect(at('/doctores/summa/ii-ii/184#a3').key).toBe('summa');
	});

	// The Summa files with the doctrinal works rather than after them: the
	// document library grows without bound, so appending a new work at the end
	// would have buried it under every encyclical a reader had marked.
	it('orders scripture, catechism, compendium, summa, social doctrine, canon law, prayers, documents', () => {
		expect([
			at('/scriptura/genesis/1').order,
			at('/catechismus/1').order,
			at('/catechismus/compendium/1').order,
			at('/doctores/summa/i/1').order,
			at('/doctrina-socialis/160').order,
			at('/ius-canonicum/216').order,
			at('/preces/our-father').order,
			at('/documenta/lumen-gentium').order
		]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
	});
});

// The fixtures carry no documents, so every promulgation date reads empty and
// the comparison falls through to its tie-break — which is the half worth
// pinning here: whatever the dates say, one document's marks stay contiguous
// and its whole-document row opens them.
describe('compareBookmarks over documents', () => {
	const sorted = (...hrefs: string[]) =>
		hrefs
			.map((href) => parseHref(href)!)
			.sort(compareBookmarks)
			.map((target) => (target.kind === 'document' ? target.slug + (target.n ?? '') : ''));

	it('keeps a document together and opens it with the whole document', () => {
		expect(
			sorted(
				'/documenta/lumen-gentium#s12',
				'/documenta/dei-verbum#s21',
				'/documenta/lumen-gentium',
				'/documenta/dei-verbum#s2'
			)
		).toEqual(['dei-verbum2', 'dei-verbum21', 'lumen-gentium', 'lumen-gentium12']);
	});
});
