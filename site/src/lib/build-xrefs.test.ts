import { describe, it, expect, beforeAll } from 'vitest';
import {
	buildCitationXrefs,
	buildScriptureRefs,
	checkXrefsAgainstCorpus,
	invertScriptureRefs
} from '../../scripts/build-xrefs.mjs';
import { expandIbidem, parseRefs, setDocumentTitleSource } from './refs-grammar';

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

/** The refs one citing unit produces, which is what most of these assert. */
function refsOf(units: Parameters<typeof buildScriptureRefs>[0]) {
	return buildScriptureRefs(units)[0]?.refs ?? [];
}

describe('buildScriptureRefs', () => {
	it('reads footnote citations in the language of the edition', () => {
		const xrefs = buildScriptureRefs([
			{
				citer: { kind: 'ccc', n: 1 },
				lang: 'en',
				unit: para(1, [{ marker: '1', text: 'Cf. Acts 2:41; 8:12-13.' }])
			}
		]);
		expect(xrefs).toEqual([
			{
				citer: { kind: 'ccc', n: 1 },
				refs: [
					{ osis: 'acts', chapter: 2, verses: [41], cf: true },
					{ osis: 'acts', chapter: 8, verses: [12, 13], cf: true }
				]
			}
		]);
	});

	it('reads a Portuguese inline locator from its `label`, the field the renderer shows', () => {
		expect(
			refsOf([
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'pt',
					unit: para(2, [{ marker: 'inline1', text: 'Mt 28, 19-20', label: '(Mt 28, 19-20)' }])
				}
			])
		).toEqual([{ osis: 'matt', chapter: 28, verses: [19, 20] }]);
	});

	it('reads a reference the body names in its own sentence, with no citation apparatus at all', () => {
		expect(
			refsOf([
				{
					citer: { kind: 'ccc', n: 207 },
					lang: 'pt',
					unit: para(207, [], ['(«Eu estarei contigo» – Ex 3, 12)'])
				}
			])
		).toEqual([{ osis: 'exod', chapter: 3, verses: [12] }]);
	});

	it('unions the two editions rather than trusting either alone', () => {
		// The same paragraph, cited differently in each language: EN footnotes
		// one verse, PT prints the neighbouring one inline. Both are real, and
		// what makes them one entry is that both units name the same citer.
		expect(
			buildScriptureRefs([
				{
					citer: { kind: 'ccc', n: 9 },
					lang: 'en',
					unit: para(9, [{ marker: '1', text: 'Mk 10:18.' }])
				},
				{
					citer: { kind: 'ccc', n: 9 },
					lang: 'pt',
					unit: para(9, [{ marker: 'inline1', text: 'Mc 10, 19', label: '(Mc 10, 19)' }])
				}
			])
		).toEqual([
			{ citer: { kind: 'ccc', n: 9 }, refs: [{ osis: 'mark', chapter: 10, verses: [18, 19] }] }
		]);
	});

	it('keeps "cf." only when every edition prints it as one', () => {
		const cfBoth = refsOf([
			{
				citer: { kind: 'ccc', n: 9 },
				lang: 'en',
				unit: para(9, [{ marker: '1', text: 'Cf. Mk 10:18.' }])
			},
			{
				citer: { kind: 'ccc', n: 9 },
				lang: 'pt',
				unit: para(9, [{ marker: '2', text: 'Cf. Mc 10, 18.' }])
			}
		]);
		expect(cfBoth[0].cf).toBe(true);

		const quotedInOne = refsOf([
			{
				citer: { kind: 'ccc', n: 9 },
				lang: 'en',
				unit: para(9, [{ marker: '1', text: 'Cf. Mk 10:18.' }])
			},
			{
				citer: { kind: 'ccc', n: 9 },
				lang: 'pt',
				unit: para(9, [{ marker: '2', text: 'Mc 10, 18.' }])
			}
		]);
		expect(quotedInOne[0].cf).toBeUndefined();
	});

	it('keeps a whole-chapter reference separate from a verse-level one', () => {
		expect(
			refsOf([
				{
					citer: { kind: 'ccc', n: 9 },
					lang: 'en',
					unit: para(9, [{ marker: '1', text: 'Ezek 16; Ezek 16:8.' }])
				}
			])
		).toEqual([
			{ osis: 'ezek', chapter: 16, verses: [] },
			{ osis: 'ezek', chapter: 16, verses: [8] }
		]);
	});

	it("converts a Hebrew-numbered citation into the corpus's Vulgate address space", () => {
		// Ps 95 (Hebrew) is Ps 94 (Vulgate) — the numbering the corpus stores.
		expect(
			refsOf([
				{
					citer: { kind: 'ccc', n: 2628 },
					lang: 'en',
					unit: para(2628, [{ marker: '1', text: 'Cf. Ps 95:1-6.' }])
				}
			])
		).toEqual([{ osis: 'ps', chapter: 94, verses: [1, 2, 3, 4, 5, 6], cf: true }]);
	});

	it('omits a unit with no scripture references', () => {
		expect(
			buildScriptureRefs([
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{ citer: { kind: 'ccc', n: 2 }, lang: 'en', unit: para(2, []) }
			])
		).toEqual([]);
	});

	it("unions a document's two editions under one edition-free citer", () => {
		expect(
			buildScriptureRefs([
				{
					citer: { kind: 'document', slug: 'lumen-gentium', n: 8 },
					lang: 'en',
					unit: para(8, [{ marker: '1', text: 'Cf. Eph 4:16.' }])
				},
				{
					citer: { kind: 'document', slug: 'lumen-gentium', n: 8 },
					lang: 'pt',
					unit: para(8, [{ marker: '1', text: 'Cf. Ef 4, 15.' }])
				}
			])
		).toEqual([
			{
				citer: { kind: 'document', slug: 'lumen-gentium', n: 8 },
				refs: [{ osis: 'eph', chapter: 4, verses: [15, 16], cf: true }]
			}
		]);
	});

	it('orders by kind, then by the address inside it', () => {
		const xrefs = buildScriptureRefs([
			{
				citer: { kind: 'document', slug: 'gaudium-et-spes', n: 22 },
				lang: 'en',
				unit: para(22, [{ marker: '1', text: 'Rom 8:29.' }])
			},
			{
				citer: { kind: 'document', slug: 'ad-gentes', n: 2 },
				lang: 'en',
				unit: para(2, [{ marker: '1', text: 'Eph 1:10.' }])
			},
			{
				citer: { kind: 'ccc', n: 400 },
				lang: 'en',
				unit: para(400, [{ marker: '1', text: 'Gen 1:26.' }])
			}
		]);
		expect(xrefs.map((x) => x.citer)).toEqual([
			{ kind: 'ccc', n: 400 },
			{ kind: 'document', slug: 'ad-gentes', n: 2 },
			{ kind: 'document', slug: 'gaudium-et-spes', n: 22 }
		]);
	});

	it('reads a document body the same way it reads its footnotes', () => {
		expect(
			refsOf([
				{
					citer: { kind: 'document', slug: 'evangelium-vitae', n: 3 },
					lang: 'en',
					unit: para(3, [], ['"I came that they may have life" (Jn 10:10).'])
				}
			])
		).toEqual([{ osis: 'john', chapter: 10, verses: [10] }]);
	});

	it("reads a Summa article's prose, a prayer's citation and an annotated verse's note", () => {
		const xrefs = buildScriptureRefs([
			{
				citer: { kind: 'summa', part: 'I', question: 1, article: 1 },
				lang: 'en',
				work: 'summa.en',
				unit: { blocks: [{ html: 'Seek not the things that are too high (Ecclus. 3:22).' }] }
			},
			{
				citer: { kind: 'prayer', slug: 'rosary' },
				lang: 'en',
				work: 'prayer.common.en',
				unit: { citations: [{ marker: '1', text: 'Lk 1:26-27' }] }
			},
			{
				citer: {
					kind: 'annotation',
					work: 'bible.douay-rheims.en',
					osis: 'matt',
					chapter: 1,
					verse: 1
				},
				lang: 'en',
				work: 'bible.douay-rheims.en',
				unit: { blocks: [{ text: 'The bill of a divorce is called a little book (Gen. 5:1).' }] }
			}
		]);
		expect(xrefs).toEqual([
			{
				citer: { kind: 'summa', part: 'I', question: 1, article: 1 },
				refs: [{ osis: 'sir', chapter: 3, verses: [22] }]
			},
			{
				citer: { kind: 'prayer', slug: 'rosary' },
				refs: [{ osis: 'luke', chapter: 1, verses: [26, 27] }]
			},
			{
				citer: {
					kind: 'annotation',
					work: 'bible.douay-rheims.en',
					osis: 'matt',
					chapter: 1,
					verse: 1
				},
				refs: [{ osis: 'gen', chapter: 5, verses: [1] }]
			}
		]);
	});

	it('drops the reference a note makes to its own chapter, and keeps the rest', () => {
		// The circularity docs/link-surface.md #12 left open: a note glossing
		// Matthew 1 that points at Matthew 1 is pointing at the page the reader
		// already has open. Genesis is another book and stands.
		expect(
			refsOf([
				{
					citer: {
						kind: 'annotation',
						work: 'bible.douay-rheims.en',
						osis: 'matt',
						chapter: 1,
						verse: 1
					},
					lang: 'en',
					work: 'bible.douay-rheims.en',
					unit: { blocks: [{ text: 'See Matt. 1:16, and Gen. 5:1.' }] }
				}
			])
		).toEqual([{ osis: 'gen', chapter: 5, verses: [1] }]);
	});

	it('keeps two annotated editions apart where it unions two editions of one work', () => {
		// Challoner's note is not Allioli's, so both are listed; the Catechism
		// in two languages is one Catechism, and is not.
		const xrefs = buildScriptureRefs([
			{
				citer: {
					kind: 'annotation',
					work: 'bible.douay-rheims.en',
					osis: 'john',
					chapter: 1,
					verse: 1
				},
				lang: 'en',
				work: 'bible.douay-rheims.en',
				unit: { blocks: [{ text: 'Gen. 1:1.' }] }
			},
			{
				citer: {
					kind: 'annotation',
					work: 'bible.allioli.de',
					osis: 'john',
					chapter: 1,
					verse: 1
				},
				lang: 'de',
				work: 'bible.allioli.de',
				unit: { blocks: [{ text: 'Gen 1, 1.' }] }
			}
		]);
		expect(xrefs).toHaveLength(2);
	});
});

describe('invertScriptureRefs', () => {
	it('keys by book, chapter and verse, with the citers in kind order', () => {
		expect(
			invertScriptureRefs([
				{
					citer: { kind: 'document', slug: 'lumen-gentium', n: 8 },
					refs: [{ osis: 'eph', chapter: 4, verses: [15, 16] }]
				},
				{ citer: { kind: 'ccc', n: 792 }, refs: [{ osis: 'eph', chapter: 4, verses: [16] }] }
			])
		).toEqual({
			eph: {
				'4': {
					'15': [{ kind: 'document', slug: 'lumen-gentium', n: 8 }],
					'16': [
						{ kind: 'ccc', n: 792 },
						{ kind: 'document', slug: 'lumen-gentium', n: 8 }
					]
				}
			}
		});
	});

	it('files a whole-chapter reference under verse 0 rather than across the chapter', () => {
		const index = invertScriptureRefs([
			{ citer: { kind: 'ccc', n: 31 }, refs: [{ osis: 'gen', chapter: 1, verses: [] }] }
		]);
		expect(index.gen['1']).toEqual({ '0': [{ kind: 'ccc', n: 31 }] });
	});

	it('lists a citer once however many of its references reach one verse', () => {
		const index = invertScriptureRefs([
			{
				citer: { kind: 'ccc', n: 31 },
				refs: [
					{ osis: 'gen', chapter: 1, verses: [1] },
					{ osis: 'gen', chapter: 1, verses: [1] }
				]
			}
		]);
		expect(index.gen['1']['1']).toEqual([{ kind: 'ccc', n: 31 }]);
	});
});

describe('checkXrefsAgainstCorpus', () => {
	it('names the citer of a reference past the end of a chapter', () => {
		expect(
			checkXrefsAgainstCorpus(
				[
					{
						citer: { kind: 'summa', part: 'I-II', question: 79, article: 1 },
						refs: [{ osis: 'gen', chapter: 1, verses: [31, 99] }]
					}
				],
				new Map([['gen:1', 31]])
			)
		).toEqual(['summa I-II 79.1: gen 1:99 — past end of chapter (31)']);
	});

	it('reports a chapter no edition has', () => {
		expect(
			checkXrefsAgainstCorpus(
				[{ citer: { kind: 'ccc', n: 1 }, refs: [{ osis: 'gen', chapter: 99, verses: [] }] }],
				new Map()
			)
		).toEqual(['ccc 1: gen 99 — chapter not in any edition']);
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

	/** I q. 1 has ten articles; nothing else in this fixture corpus exists. */
	const hasArticle = (part: string, question: number, article: number | null) =>
		part === 'I' && question === 1 && (article === null || article <= 10);

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
			() => true,
			hasArticle
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
			() => true,
			hasArticle
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
			() => true,
			hasArticle
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
			() => true,
			hasArticle
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
			(n) => n === 1234,
			hasArticle
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
			() => true,
			hasArticle
		);
		// `n: null` because `has` does not claim Dei Verbum has a section 2 —
		// the number is captured and validated, never trusted.
		expect(documents).toEqual([{ work: 'dei-verbum', n: null, cited_by: [{ kind: 'ccc', n: 2 }] }]);
	});

	it('reads Ibid. as the work the footnote before it named', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [
						{ marker: '1', text: 'LG 12.' },
						{ marker: '2', text: 'Ibid., 14.' }
					])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] },
			{ work: 'lumen-gentium', n: 14, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('carries the work across a unit boundary when the footnote numbers run on', () => {
		// 401 of the corpus's 1,240 ibidem citations are the first note of
		// their unit. The apparatus is numbered document-wide, so the note
		// before note 2 is note 1 whichever section it sits in.
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [{ marker: '2', text: 'Ibid., 14.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] },
			{ work: 'lumen-gentium', n: 14, cited_by: [{ kind: 'ccc', n: 2 }] }
		]);
	});

	it('refuses to carry it when the numbering does not run on', () => {
		// A gap means a footnote this parser did not read, or a chapter that
		// restarts its numbering — either way the note before this one is not
		// the note it says it is, and the guard is what makes the carry a
		// reading rather than an assertion.
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [{ marker: '5', text: 'Ibid., 14.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('inherits the section too when Ibid. names none of its own', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [{ marker: '2', text: 'Ibid.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{
				work: 'lumen-gentium',
				n: 12,
				cited_by: [
					{ kind: 'ccc', n: 1 },
					{ kind: 'ccc', n: 2 }
				]
			}
		]);
	});

	it('follows a run of them, each against the one before', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [{ marker: '2', text: 'Ibid., 14.' }])
				},
				{
					citer: { kind: 'ccc', n: 3 },
					lang: 'en',
					unit: para(3, [{ marker: '3', text: 'Ibid.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] },
			{
				work: 'lumen-gentium',
				n: 14,
				cited_by: [
					{ kind: 'ccc', n: 2 },
					{ kind: 'ccc', n: 3 }
				]
			}
		]);
	});

	it('does not see past a footnote that named no work this corpus holds', () => {
		// "the same as two notes ago" is not what Ibid. says, and the note in
		// between is a real citation of something — a papal address, an AAS
		// page — that simply is not here.
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [
						{ marker: '2', text: 'Paul VI, Discourse of 21 November 1964: AAS 56 (1964) 1015.' }
					])
				},
				{
					citer: { kind: 'ccc', n: 3 },
					lang: 'en',
					unit: para(3, [{ marker: '3', text: 'Ibid., 1016.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('leaves Id. alone, which names the same author and a different work', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'ccc', n: 2 },
					lang: 'en',
					unit: para(2, [
						{
							marker: '2',
							text: 'Id., Homilia III in Dormitionem Ssmae Deiparae: PG XCVII, 1099 A.'
						}
					])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('is not interrupted by an inline locator, which carries no footnote number', () => {
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'ccc', n: 1 },
					lang: 'en',
					unit: para(1, [
						{ marker: '1', text: 'LG 12.' },
						{ marker: 'inline1', label: '(Cf. Mt 5:3)', text: 'Mt 5:3' },
						{ marker: '2', text: 'Ibid., 14.' }
					])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{ work: 'lumen-gentium', n: 12, cited_by: [{ kind: 'ccc', n: 1 }] },
			{ work: 'lumen-gentium', n: 14, cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	it('does not carry a work out of one edition and into the next', () => {
		// Two documents' apparatuses both number their notes from 1; nothing
		// but the edition boundary stops one running into the other.
		const { documents } = buildCitationXrefs(
			[
				{
					citer: { kind: 'document', slug: 'dei-verbum', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '1', text: 'LG 12.' }])
				},
				{
					citer: { kind: 'document', slug: 'gaudium-et-spes', n: 1 },
					lang: 'en',
					unit: para(1, [{ marker: '2', text: 'Ibid., 14.' }])
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(documents).toEqual([
			{
				work: 'lumen-gentium',
				n: 12,
				cited_by: [{ kind: 'document', slug: 'dei-verbum', n: 1 }]
			}
		]);
	});

	it('reads Ibid. against the Catechism as readily as against a document', () => {
		const { ccc } = buildCitationXrefs(
			[
				{
					citer: { kind: 'document', slug: 'dei-verbum', n: 1 },
					lang: 'en',
					unit: para(1, [
						{ marker: '1', text: 'Catechism of the Catholic Church, 2417.' },
						{ marker: '2', text: 'Ibid., 2418.' }
					])
				}
			],
			has,
			(n) => n === 2417 || n === 2418,
			hasArticle
		);
		expect(ccc).toEqual([
			{ ccc: 2417, cited_by: [{ kind: 'document', slug: 'dei-verbum', n: 1 }] },
			{ ccc: 2418, cited_by: [{ kind: 'document', slug: 'dei-verbum', n: 1 }] }
		]);
	});

	it('expands into a string the grammar reads back as the same document', () => {
		// The point of rewriting rather than carrying a target: the locus, the
		// "cf." and everything else in the citation go through the rules that
		// read every other citation.
		expect(
			parseRefs(expandIbidem('Cf. ibid ., 43: AAS 48 (1956), 336.', 'LG') ?? '', { lang: 'en' })
		).toContainEqual(
			expect.objectContaining({ kind: 'document', slug: 'lumen-gentium', locus: '43' })
		);
	});

	it('reads nothing from a unit marked scriptureOnly', () => {
		// The Italian Rosary prints its Gospel locators with no book —
		// `1,26-28.30-31` for Luke 1 — and a bare number list reads as bare
		// Catechism paragraph numbers. The prayers' apparatus cites Scripture
		// and nothing else, so every such segment is a misparse; the scripture
		// pass still reads the same unit.
		const { ccc } = buildCitationXrefs(
			[
				{
					citer: { kind: 'prayer', slug: 'rosary' },
					lang: 'it',
					unit: para(1, [{ marker: '1', text: '1,26-28.30-31' }]),
					scriptureOnly: true
				}
			],
			has,
			() => true,
			hasArticle
		);
		expect(ccc).toEqual([]);
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
			() => true,
			hasArticle
		);
		expect(documents).toEqual([]);
	});

	/**
	 * THE FOURTH LIST — what the apparatus asks for that this corpus has not
	 * got, which `/census` ranks as the list of what to ingest next.
	 *
	 * The three documents this suite declares are the whole of its corpus, so
	 * every other siglum in the English table is an absence here, exactly as
	 * Migne and Denzinger are absences in the real one.
	 */
	const weighing = (citations: { marker: string; text?: string; label?: string }[]) =>
		buildCitationXrefs(
			[{ citer: { kind: 'ccc', n: 1 }, lang: 'en', unit: para(1, citations) }],
			has,
			() => true,
			hasArticle
		);

	it('ranks a work the corpus has not got, by the name its tables agree on', () => {
		const { absent } = weighing([{ marker: '1', text: 'PL 54, 200.' }]);
		expect(absent).toEqual([
			{ work: 'Patrologia latina (Migne)', cited_by: [{ kind: 'ccc', n: 1 }] }
		]);
	});

	/**
	 * A CITATION THAT RESOLVED STILL REPORTS WHAT IT ALSO ASKED FOR. The
	 * apparatus reaches for Migne in the same breath as Lumen gentium, and a
	 * ranking of what this library is asked for and lacks has to hear the
	 * second half — only the RESIDUE is gated on the citation landing nowhere.
	 */
	it('records an absence beside a reference that did resolve', () => {
		const { documents, absent } = weighing([{ marker: '1', text: 'Cf. LG 12; PL 54, 200.' }]);
		expect(documents.map((d) => d.work)).toEqual(['lumen-gentium']);
		expect(absent.map((a) => a.work)).toEqual(['Patrologia latina (Migne)']);
	});

	/** A dicastery is not a work to acquire, and neither is a citation the
	 *  grammar read nothing out of. Both are residue, and the ibidem half is
	 *  kept apart because it is a limit of the READING. */
	it('counts what named nothing rather than ranking it', () => {
		const { absent, unread } = weighing([
			{ marker: '1', text: 'CDF, Declaration.' },
			{ marker: '2', text: 'Ibid.' },
			{ marker: '3', text: 'Propositio 14.' }
		]);
		expect(absent).toEqual([]);
		// `Ibid.` opens a run of its own here — the note before it named no
		// work — so nothing is inherited and the word stays unread.
		expect(unread).toEqual({ ibidem: { ccc: 1 }, other: { ccc: 2 } });
	});

	/** One citer per absent work however often it names it, which is the unit
	 *  every ranking on the page counts in. */
	it('counts a citing place once however many times it asks', () => {
		const { absent } = weighing([
			{ marker: '1', text: 'PL 54, 200.' },
			{ marker: '2', text: 'PL 60, 12.' }
		]);
		expect(absent[0].cited_by).toEqual([{ kind: 'ccc', n: 1 }]);
	});

	/** The Code is held under an address space of its own, so a citation to it
	 *  is neither an absence nor unread — `siglumStanding` answers held on
	 *  `work` before it ever looks at a slug. */
	it('does not count the Code, which this corpus holds as canons', () => {
		const { absent, unread } = weighing([{ marker: '1', text: 'CIC, can. 748, § 2.' }]);
		expect(absent).toEqual([]);
		expect(unread).toEqual({ ibidem: {}, other: {} });
	});
});
