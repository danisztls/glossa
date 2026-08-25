import { describe, it, expect, beforeAll } from 'vitest';
import {
	buildCccBibleXrefs,
	buildCitationXrefs,
	buildDocumentBibleXrefs,
	checkXrefsAgainstCorpus
} from '../../scripts/build-xrefs.mjs';
import { setDocumentTitleSource } from './refs-grammar';

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

describe('buildCitationXrefs', () => {
	/**
	 * A siglum only resolves to a slug the corpus actually holds
	 * (`refs-grammar.ts`: "A SLUG HERE IS A CLAIM, NOT A LINK"), so a test
	 * that does not declare its documents gets `slug: null` on every segment
	 * and silently proves nothing. This is the same call `sync-corpus.mjs`
	 * makes, with three documents instead of 232.
	 */
	beforeAll(() => {
		setDocumentTitleSource(() => [
			{ slug: 'lumen-gentium', manifests: { en: { title: 'Lumen Gentium' } } },
			{ slug: 'gaudium-et-spes', manifests: { en: { title: 'Gaudium et Spes' } } },
			{ slug: 'dei-verbum', manifests: { en: { title: 'Dei Verbum' } } }
		]);
	});

	const has = (slug: string, n: number) =>
		(slug === 'lumen-gentium' && n <= 69) || (slug === 'gaudium-et-spes' && n <= 93);

	it('records which CCC paragraph cites which document section', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 748 },
					lang: 'en',
					unit: para(748, [{ marker: '1', text: 'LG 1.' }])
				},
				{
					citer: { kind: 'ccc', n: 359 },
					lang: 'en',
					unit: para(359, [{ marker: '1', text: 'GS 22.' }])
				}
			],
			has,
			() => true
		);
		expect(documents).toEqual([
			{ work: 'gaudium-et-spes', n: 22, cited_by: [{ kind: 'ccc', n: 359 }] },
			{ work: 'lumen-gentium', n: 1, cited_by: [{ kind: 'ccc', n: 748 }] }
		]);
	});

	it('files a citation whose section the document does not have under the work at large', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					// 900 is past Lumen Gentium's last section; a bare siglum names
					// no section at all. Both name the document and neither names a
					// place in it.
					unit: para(1, [{ marker: '1', text: 'LG 900; cf. GS.' }])
				}
			],
			has,
			() => true
		);
		expect(documents).toEqual([
			{ work: 'gaudium-et-spes', n: null, cited_by: [{ kind: 'ccc', n: 1 }] },
			{ work: 'lumen-gentium', n: null, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('counts a citer once however many times it cites the same address', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [
						{ marker: '1', text: 'LG 8.' },
						{ marker: '2', text: 'Cf. LG 8.' }
					])
				},
				// The other language edition of the same paragraph, which is a
				// separate unit carrying the same address.
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'pt',
					unit: para(1, [{ marker: '1', text: 'LG 8.' }])
				}
			],
			has,
			() => true
		);
		expect(documents).toEqual([{ work: 'lumen-gentium', n: 8, cited_by: [{ kind: 'ccc', n: 1 }] }]);
	});

	it('drops a document citing itself', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'document', slug: 'lumen-gentium', n: 5 },
					lang: 'en',
					unit: para(5, [{ marker: '1', text: 'LG 8; GS 22.' }])
				}
			],
			has,
			() => true
		);
		expect(documents).toEqual([
			{
				work: 'gaudium-et-spes',
				n: 22,
				cited_by: [{ kind: 'document', slug: 'lumen-gentium', n: 5 }]
			}
		]);
	});

	it('records who cites a CCC paragraph, and never the Catechism citing itself', () => {
		const { ccc } = buildCitationXrefs(
			[
				{
					citer: { kind: 'document', slug: 'dei-verbum', n: 4 },
					lang: 'en',
					unit: para(4, [{ marker: '1', text: 'Catechism of the Catholic Church, 1234.' }])
				},
				{
					citer: { kind: 'ccc', n: 9 },
					lang: 'en',
					unit: para(9, [{ marker: '1', text: 'Cf. CCC 1234.' }])
				}
			],
			has,
			(n) => n === 1234
		);
		expect(ccc).toEqual([
			{ ccc: 1234, cited_by: [{ kind: 'document', slug: 'dei-verbum', n: 4 }] }
		]);
	});

	it('reads a document cited by its spelled-out title, not only by siglum', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [
						{ marker: '1', text: 'Second Vatican Council, Const. dogm. Dei Verbum, 2.' }
					])
				}
			],
			has,
			() => true
		);
		// `n: null` because `has` does not claim Dei Verbum has a section 2 —
		// the number is captured and validated, never trusted.
		expect(documents).toEqual([{ work: 'dei-verbum', n: null, cited_by: [{ kind: 'ccc', n: 2 }] }]);
	});

	it('ignores prose, because the grammar links no document title outside an apparatus', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 3 },
					lang: 'en',
					unit: para(3, [], ['As the Council teaches in Dei Verbum 2, God reveals himself.'])
				}
			],
			has,
			() => true
		);
		expect(documents).toEqual([]);
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
