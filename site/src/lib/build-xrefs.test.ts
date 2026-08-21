import { describe, it, expect } from 'vitest';
import {
	buildCccBibleXrefs,
	buildDocumentBibleXrefs,
	checkXrefsAgainstCorpus
} from '../../scripts/build-xrefs.mjs';

/** A CCC paragraph shaped the way `paragraphs.json` stores one. */
function para(
	n: number,
	citations: { marker: string; text?: string; label?: string }[],
	blocks: string[] = []
) {
	return {
		n,
		blocks: blocks.map((text_marked) => ({ kind: 'prose', text_marked })),
		citations,
		text: '',
		in_brief: false,
		related: [],
		notes: []
	};
}

describe('buildCccBibleXrefs', () => {
	it('reads footnote citations in the language of the edition', () => {
		const xrefs = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(1, [{ marker: '1', text: 'Cf. Acts 2:41; 8:12-13.' }])] }
		]);
		expect(xrefs).toEqual([
			{
				ccc: 1,
				refs: [
					{ osis: 'acts', chapter: 2, verses: [41], cf: true },
					{ osis: 'acts', chapter: 8, verses: [12, 13], cf: true }
				]
			}
		]);
	});

	it('reads a Portuguese inline locator from its `label`, the field the renderer shows', () => {
		const xrefs = buildCccBibleXrefs([
			{
				lang: 'pt',
				paragraphs: [
					para(2, [{ marker: 'inline1', text: 'Mt 28, 19-20', label: '(Mt 28, 19-20)' }])
				]
			}
		]);
		expect(xrefs[0].refs).toEqual([{ osis: 'matt', chapter: 28, verses: [19, 20] }]);
	});

	it('reads a reference the body names in its own sentence, with no citation apparatus at all', () => {
		const xrefs = buildCccBibleXrefs([
			{ lang: 'pt', paragraphs: [para(207, [], ['(«Eu estarei contigo» – Ex 3, 12)'])] }
		]);
		expect(xrefs[0].refs).toEqual([{ osis: 'exod', chapter: 3, verses: [12] }]);
	});

	it('unions the two editions rather than trusting either alone', () => {
		// The same paragraph, cited differently in each language: EN footnotes
		// one verse, PT prints the neighbouring one inline. Both are real.
		const xrefs = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(9, [{ marker: '1', text: 'Mk 10:18.' }])] },
			{
				lang: 'pt',
				paragraphs: [para(9, [{ marker: 'inline1', text: 'Mc 10, 19', label: '(Mc 10, 19)' }])]
			}
		]);
		expect(xrefs).toEqual([{ ccc: 9, refs: [{ osis: 'mark', chapter: 10, verses: [18, 19] }] }]);
	});

	it('keeps "cf." only when every edition prints it as one', () => {
		const cfBoth = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(9, [{ marker: '1', text: 'Cf. Mk 10:18.' }])] },
			{ lang: 'pt', paragraphs: [para(9, [{ marker: '2', text: 'Cf. Mc 10, 18.' }])] }
		]);
		expect(cfBoth[0].refs[0].cf).toBe(true);

		const quotedInOne = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(9, [{ marker: '1', text: 'Cf. Mk 10:18.' }])] },
			{ lang: 'pt', paragraphs: [para(9, [{ marker: '2', text: 'Mc 10, 18.' }])] }
		]);
		expect(quotedInOne[0].refs[0].cf).toBeUndefined();
	});

	it('keeps a whole-chapter reference separate from a verse-level one', () => {
		const xrefs = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(9, [{ marker: '1', text: 'Ezek 16; Ezek 16:8.' }])] }
		]);
		expect(xrefs[0].refs).toEqual([
			{ osis: 'ezek', chapter: 16, verses: [] },
			{ osis: 'ezek', chapter: 16, verses: [8] }
		]);
	});

	it("converts a Hebrew-numbered citation into the corpus's Vulgate address space", () => {
		// Ps 95 (Hebrew) is Ps 94 (Vulgate) — the numbering the corpus stores.
		const xrefs = buildCccBibleXrefs([
			{ lang: 'en', paragraphs: [para(2628, [{ marker: '1', text: 'Cf. Ps 95:1-6.' }])] }
		]);
		expect(xrefs[0].refs).toEqual([
			{ osis: 'ps', chapter: 94, verses: [1, 2, 3, 4, 5, 6], cf: true }
		]);
	});

	it('omits paragraphs with no scripture references', () => {
		expect(
			buildCccBibleXrefs([
				{ lang: 'en', paragraphs: [para(1, [{ marker: '1', text: 'LG 12.' }]), para(2, [])] }
			])
		).toEqual([]);
	});
});

describe('buildDocumentBibleXrefs', () => {
	it("keys by slug and unions a document's two editions", () => {
		const xrefs = buildDocumentBibleXrefs([
			{
				slug: 'lumen-gentium',
				lang: 'en',
				sections: [para(8, [{ marker: '1', text: 'Cf. Eph 4:16.' }])]
			},
			{
				slug: 'lumen-gentium',
				lang: 'pt',
				sections: [para(8, [{ marker: '1', text: 'Cf. Ef 4, 15.' }])]
			}
		]);
		expect(xrefs).toEqual([
			{
				work: 'lumen-gentium',
				n: 8,
				refs: [{ osis: 'eph', chapter: 4, verses: [15, 16], cf: true }]
			}
		]);
	});

	it('orders by slug then section, and omits sections that cite no scripture', () => {
		const xrefs = buildDocumentBibleXrefs([
			{
				slug: 'gaudium-et-spes',
				lang: 'en',
				sections: [
					para(22, [{ marker: '1', text: 'Rom 8:29.' }]),
					para(12, [{ marker: '1', text: 'Gen 1:26.' }]),
					para(1, [{ marker: '1', text: 'AAS 58 (1966) 1026.' }])
				]
			},
			{ slug: 'ad-gentes', lang: 'en', sections: [para(2, [{ marker: '1', text: 'Eph 1:10.' }])] }
		]);
		expect(xrefs.map((x) => [x.work, x.n])).toEqual([
			['ad-gentes', 2],
			['gaudium-et-spes', 12],
			['gaudium-et-spes', 22]
		]);
	});

	it('reads a document body the same way it reads its footnotes', () => {
		const xrefs = buildDocumentBibleXrefs([
			{
				slug: 'evangelium-vitae',
				lang: 'en',
				sections: [para(3, [], ['"I came that they may have life" (Jn 10:10).'])]
			}
		]);
		expect(xrefs[0].refs).toEqual([{ osis: 'john', chapter: 10, verses: [10] }]);
	});
});

describe('checkXrefsAgainstCorpus', () => {
	const chapterVerses = new Map([
		['acts', 0],
		['acts:2', 47]
	]);

	it('reports a verse past the end of its chapter', () => {
		expect(
			checkXrefsAgainstCorpus(
				[{ ccc: 1, refs: [{ osis: 'acts', chapter: 2, verses: [41, 99] }] }],
				chapterVerses
			)
		).toEqual(['ccc 1: acts 2:99 — past end of chapter (47)']);
	});

	it('reports a chapter no edition has', () => {
		expect(
			checkXrefsAgainstCorpus(
				[{ ccc: 1, refs: [{ osis: 'acts', chapter: 99, verses: [] }] }],
				chapterVerses
			)
		).toEqual(['ccc 1: acts 99 — chapter not in any edition']);
	});

	it('names a document by slug and section, a CCC entry by paragraph', () => {
		expect(
			checkXrefsAgainstCorpus(
				[{ work: 'lumen-gentium', n: 8, refs: [{ osis: 'acts', chapter: 2, verses: [99] }] }],
				chapterVerses
			)
		).toEqual(['lumen-gentium 8: acts 2:99 — past end of chapter (47)']);
	});

	it('is silent on references that resolve', () => {
		expect(
			checkXrefsAgainstCorpus(
				[{ ccc: 1, refs: [{ osis: 'acts', chapter: 2, verses: [41] }] }],
				chapterVerses
			)
		).toEqual([]);
	});
});
