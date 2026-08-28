import { describe, expect, it } from 'vitest';
import { bookmarkGroup } from './bookmarkContent';
import { parseHref } from './address';

const at = (href: string) => bookmarkGroup(parseHref(href)!);

describe('bookmarkGroup', () => {
	it('files a document section and the whole document together', () => {
		expect(at('/documenta/lumen-gentium#s12').key).toBe('document:lumen-gentium');
		expect(at('/documenta/lumen-gentium').key).toBe('document:lumen-gentium');
	});

	it('files a paragraph and its chapter under one work', () => {
		expect(at('/catechismus/1213').key).toBe('catechism');
		expect(at('/catechismus/caput/27').key).toBe('catechism');
	});

	it('files a question and one of its articles under one work', () => {
		expect(at('/summa/ii-ii/184').key).toBe('summa');
		expect(at('/summa/ii-ii/184#a3').key).toBe('summa');
	});

	// The Summa files with the doctrinal works rather than after them: the
	// document library grows without bound, so appending a new work at the end
	// would have buried it under every encyclical a reader had marked.
	it('orders scripture, catechism, compendium, summa, prayers, then documents', () => {
		expect([
			at('/scriptura/gen/1').order,
			at('/catechismus/1').order,
			at('/catechismus/compendium/1').order,
			at('/summa/i/1').order,
			at('/preces/our-father').order,
			at('/documenta/lumen-gentium').order
		]).toEqual([0, 1, 2, 3, 4, 5]);
	});
});
