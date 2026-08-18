import { describe, expect, it } from 'vitest';
import { parsePreviewHref } from './linkPreviewHref';

describe('parsePreviewHref', () => {
	describe('bible', () => {
		it('parses a bare chapter link with no verse', () => {
			expect(parsePreviewHref('/scriptura/john/1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1
			});
		});

		it('parses a single-verse anchor (#v{n}, no ?v=)', () => {
			expect(parsePreviewHref('/scriptura/john/1#v1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 1,
				to: 1
			});
		});

		it('parses a cited span (?v=from-to#v{first})', () => {
			expect(parsePreviewHref('/scriptura/john/1?v=1-7#v1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 1,
				to: 7
			});
		});

		it('prefers the ?v= span over the anchor when both are present', () => {
			// refHref always agrees the two (anchor = span's first verse), but a
			// hand-edited URL might not -- the span is the more informative of
			// the two, so it should win rather than the parser picking whichever
			// happens to be checked first for no principled reason.
			expect(parsePreviewHref('/scriptura/gen/1?v=3-9#v1')).toEqual({
				kind: 'bible',
				osis: 'gen',
				chapter: 1,
				from: 3,
				to: 9
			});
		});

		it('supports multi-character OSIS codes (numbered books)', () => {
			expect(parsePreviewHref('/scriptura/1cor/13')).toEqual({
				kind: 'bible',
				osis: '1cor',
				chapter: 13
			});
		});

		it('falls back to the anchor when ?v= is malformed', () => {
			expect(parsePreviewHref('/scriptura/john/1?v=nonsense#v3')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 3,
				to: 3
			});
		});

		it('falls back to the anchor when ?v= is reversed (to <= from)', () => {
			expect(parsePreviewHref('/scriptura/john/1?v=7-1#v7')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 7,
				to: 7
			});
		});

		it('ignores an unrelated query string / hash', () => {
			expect(parsePreviewHref('/scriptura/john/1?utm=x#somewhere-else')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1
			});
		});
	});

	describe('ccc', () => {
		it('parses a paragraph link', () => {
			expect(parsePreviewHref('/catechismus/1234')).toEqual({ kind: 'ccc', n: 1234 });
		});

		it('parses a whole-chapter link', () => {
			expect(parsePreviewHref('/catechismus/caput/27')).toEqual({ kind: 'cccChapter', n: 27 });
		});

		it('does not treat the CCC landing page as a paragraph', () => {
			expect(parsePreviewHref('/catechismus')).toBeUndefined();
		});

		it('does not treat the chapter index as a chapter link', () => {
			expect(parsePreviewHref('/catechismus/caput')).toBeUndefined();
		});
	});

	describe('compendium', () => {
		it('parses a question link', () => {
			expect(parsePreviewHref('/compendium/12')).toEqual({ kind: 'compendium', n: 12 });
		});

		it('parses a whole-chapter link', () => {
			expect(parsePreviewHref('/compendium/caput/1')).toEqual({
				kind: 'compendiumChapter',
				n: 1
			});
		});

		it('does not treat the landing page as a question', () => {
			expect(parsePreviewHref('/compendium')).toBeUndefined();
		});
	});

	describe('documents', () => {
		it('parses a section link', () => {
			expect(parsePreviewHref('/documenta/gaudium-et-spes#s19')).toEqual({
				kind: 'document',
				slug: 'gaudium-et-spes',
				n: 19
			});
		});

		it('does not treat the whole document as a section', () => {
			expect(parsePreviewHref('/documenta/gaudium-et-spes')).toBeUndefined();
		});

		// The shape this route used to have, before a document became one page
		// (docs/decisions.md, 2026-08-17). Nothing generates it now, and a
		// stale link from anywhere should degrade to no preview rather than to
		// a preview of the wrong thing.
		it('does not parse the retired per-section path', () => {
			expect(parsePreviewHref('/documenta/gaudium-et-spes/19')).toBeUndefined();
		});

		it('does not treat the documents library as a section', () => {
			expect(parsePreviewHref('/documenta')).toBeUndefined();
		});
	});

	describe('chrome and non-content links', () => {
		it('rejects the header nav targets', () => {
			for (const href of [
				'/scriptura',
				'/catechismus',
				'/compendium',
				'/documenta',
				'/colophon',
				'/'
			]) {
				expect(parsePreviewHref(href)).toBeUndefined();
			}
		});

		it('rejects an absolute external URL', () => {
			expect(parsePreviewHref('https://www.vatican.va/archive/ccc/index.htm')).toBeUndefined();
		});

		it('rejects a mailto: link', () => {
			expect(parsePreviewHref('mailto:hello@example.com')).toBeUndefined();
		});

		it('rejects null/undefined/empty hrefs', () => {
			expect(parsePreviewHref(null)).toBeUndefined();
			expect(parsePreviewHref(undefined)).toBeUndefined();
			expect(parsePreviewHref('')).toBeUndefined();
		});

		it('rejects an unparsable href without throwing', () => {
			expect(() => parsePreviewHref('http://[::not-a-host')).not.toThrow();
			expect(parsePreviewHref('http://[::not-a-host')).toBeUndefined();
		});
	});
});
