import { describe, expect, it } from 'vitest';
import { bookmarkGroup, parseBookmarkHref } from './bookmark-target';

describe('parseBookmarkHref', () => {
	it('reads a verse as the preview parser does', () => {
		expect(parseBookmarkHref('/scriptura/exod/3#v12')).toEqual({
			kind: 'unit',
			target: { kind: 'bible', osis: 'exod', chapter: 3, from: 12, to: 12 }
		});
	});

	it.each([
		['/scriptura/gen/1', { kind: 'bible', osis: 'gen', chapter: 1 }],
		['/catechismus/1213', { kind: 'ccc', n: 1213 }],
		['/catechismus/caput/27', { kind: 'cccChapter', n: 27 }],
		['/compendium/45', { kind: 'compendium', n: 45 }],
		['/compendium/caput/1', { kind: 'compendiumChapter', n: 1 }],
		['/documenta/lumen-gentium#s12', { kind: 'document', slug: 'lumen-gentium', n: 12 }]
	])('reads %s as a unit', (href, target) => {
		expect(parseBookmarkHref(href)).toEqual({ kind: 'unit', target });
	});

	// The two shapes `linkPreviewHref` deliberately declines, which is the
	// whole reason this module wraps it rather than extending it.
	it('reads a whole prayer, which is not a preview target at all', () => {
		expect(parseBookmarkHref('/preces/sub-tuum-praesidium')).toEqual({
			kind: 'prayer',
			slug: 'sub-tuum-praesidium'
		});
	});

	it('reads an unanchored document as the whole document', () => {
		expect(parseBookmarkHref('/documenta/evangelium-vitae')).toEqual({
			kind: 'documentWhole',
			slug: 'evangelium-vitae'
		});
	});

	it.each([
		// The English route names resolve as invalid addresses site-wide
		// (docs/decisions.md, 2026-08-18); a bookmark must not resurrect them.
		'/ccc/1213',
		'/bible/exod/3#v12',
		'/prayers/sub-tuum-praesidium',
		'/documents/lumen-gentium',
		'https://vatican.va/documenta/lumen-gentium',
		'/signata',
		'/',
		'mailto:someone@example.org',
		'',
		undefined,
		null
	])('declines %s', (href) => {
		expect(parseBookmarkHref(href as string | undefined)).toBeUndefined();
	});
});

describe('bookmarkGroup', () => {
	it('files a document section and the whole document together', () => {
		const section = parseBookmarkHref('/documenta/lumen-gentium#s12')!;
		const whole = parseBookmarkHref('/documenta/lumen-gentium')!;
		expect(bookmarkGroup(section).key).toBe('document:lumen-gentium');
		expect(bookmarkGroup(whole).key).toBe('document:lumen-gentium');
	});

	it('files a paragraph and its chapter under one work', () => {
		const para = parseBookmarkHref('/catechismus/1213')!;
		const chapter = parseBookmarkHref('/catechismus/caput/27')!;
		expect(bookmarkGroup(para).key).toBe('catechism');
		expect(bookmarkGroup(chapter).key).toBe('catechism');
	});

	// The Summa files with the doctrinal works rather than after them: the
	// document library grows without bound, so appending a new work at the end
	// would have buried it under every encyclical a reader had marked.
	it('orders scripture, catechism, compendium, summa, prayers, then documents', () => {
		const order = (href: string) => bookmarkGroup(parseBookmarkHref(href)!).order;
		expect([
			order('/scriptura/gen/1'),
			order('/catechismus/1'),
			order('/compendium/1'),
			order('/summa/i/1'),
			order('/preces/our-father'),
			order('/documenta/lumen-gentium')
		]).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('files a question and one of its articles under one work', () => {
		const question = parseBookmarkHref('/summa/ii-ii/184')!;
		const article = parseBookmarkHref('/summa/ii-ii/184#a3')!;
		expect(bookmarkGroup(question).key).toBe('summa');
		expect(bookmarkGroup(article).key).toBe('summa');
	});
});

/**
 * The Summa reaches `BookmarkTarget` through `{kind:'unit'}` rather than a
 * kind of its own. It briefly had one, on the reasoning that governs prayers
 * and whole documents — that `linkPreviewHref` deliberately declines them.
 * That stopped being true the moment the hover preview learned `/summa`
 * (this work cites itself 5,180 times, which is what earned it one), so the
 * separate kind was dead code the day it was written.
 */
describe('summa bookmarks', () => {
	it('parses a question and an article fragment as units', () => {
		expect(parseBookmarkHref('/summa/ii-ii/184')).toEqual({
			kind: 'unit',
			target: { kind: 'summa', part: 'ii-ii', question: 184, article: null }
		});
		expect(parseBookmarkHref('/summa/ii-ii/184#a3')).toEqual({
			kind: 'unit',
			target: { kind: 'summa', part: 'ii-ii', question: 184, article: 3 }
		});
	});

	it('drops an address with no question number', () => {
		expect(parseBookmarkHref('/summa/i')).toBeUndefined();
		expect(parseBookmarkHref('/summa/i/0')).toBeUndefined();
	});
});
