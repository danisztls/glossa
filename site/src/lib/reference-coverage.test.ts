import { describe, expect, it } from 'vitest';
import {
	CoverageMeter,
	classifyCitation,
	compareCoverage,
	compareCrossWork
} from '../../scripts/reference-coverage.mjs';

describe('classifyCitation', () => {
	it('is linkable when any segment could become a link', () => {
		expect(classifyCitation('Cf. Jn 3:16; DS 1514.', 'en')).toBe('linkable');
		expect(classifyCitation('279-289, 296-298', 'en')).toBe('linkable');
	});

	it('is recognized when only unlinkable sigla were found', () => {
		expect(classifyCitation('DS 1514; PL 36, 508.', 'en')).toBe('recognized');
	});

	it('is nothing when the grammar found no reference', () => {
		expect(classifyCitation('Ibid., 14.', 'en')).toBe('nothing');
		expect(classifyCitation('Roman Missal, Eucharistic Prayer IV, 118.', 'en')).toBe('nothing');
	});
});

describe('CoverageMeter', () => {
	it('counts citations, prose references and stored references per family', () => {
		const meter = new CoverageMeter();
		meter.addUnits('ccc', 'en', [
			{
				n: 1,
				citations: [
					{ marker: '1', text: 'Jn 3:16' },
					{ marker: '2', text: 'Ibid.' }
				],
				blocks: [{ text_marked: 'As Paul says in Rom 5:8⟦1⟧, love.' }]
			}
		]);
		meter.addUnits('summa', 'en', {
			articles: [
				{
					divisions: [
						{ blocks: [{ html: 'See <a data-ref="summa:I:2:3">Q[2], A[3]</a> and Jn 1:1.' }] }
					]
				}
			]
		});
		const { families } = meter.report();
		expect(families.ccc.citations).toEqual({ total: 2, linkable: 1, recognized: 0, nothing: 1 });
		expect(families.ccc.prose.scripture).toBe(1);
		expect(families.ccc.residue).toEqual([{ key: 'ibid.', count: 1, example: 'Ibid.' }]);
		expect(families.summa.prose).toEqual({ blocks: 1, scripture: 1, document: 0, stored: 1 });
	});
});

/**
 * The three shapes the walk used to skip, added 2026-08-26 in the same change
 * that made the page draw them. A meter that reads what the renderer does not
 * (or the reverse) makes `preflight-deploy.mjs`'s drop guard a guard over
 * nothing — the CCC had that failure in one direction the same week, the
 * Compendium and the Bible's notes in the other.
 */
describe('CoverageMeter — the prose surfaces that are not `blocks`', () => {
	it("reads a Compendium answer's blocks and its question", () => {
		const meter = new CoverageMeter();
		meter.addUnits('compendium', 'en', [
			{
				n: 51,
				question: 'What is the importance of “In the beginning” (Genesis 1:1)?',
				answer_blocks: [{ text: 'They bear “the fruit of the Spirit” (Galatians 5:22).' }]
			}
		]);
		const { families } = meter.report();
		expect(families.compendium.prose.scripture).toBe(2);
	});

	it("reads an annotated edition's notes, which is where its commentary cites", () => {
		const meter = new CoverageMeter();
		meter.addUnits('bible', 'en', {
			chapters: [
				{
					verses: [
						{
							n: 1,
							text: 'And it came to pass.',
							notes: [{ marker: '1', text: 'That is, a firm covenant. See Nm. 18,19.' }]
						}
					]
				}
			]
		});
		const { families } = meter.report();
		// The VERSE is not counted — it is the text, not an apparatus over it.
		expect(families.bible.prose.scripture).toBe(1);
	});

	/*
	 * A commentary names its neighbours with no book and no chapter, because
	 * both are the page the reader is on. The meter has to carry the address
	 * the PAGE carries or it reads 2,745 fewer references than are drawn —
	 * and the same file shape under `bible` must not be read that way, since
	 * `Sidenote` passes no address and Challoner's `v.` is far more often a
	 * Roman five.
	 */
	it("reads a commentary's bare verse numbers against its own address", () => {
		const unit = () => ({
			osis: 'gen',
			chapters: [
				{
					n: 1,
					verses: [{ verse: 4, notes: [{ text: 'as he had said, v. 3. and again v. 10.' }] }]
				}
			]
		});
		const commentary = new CoverageMeter();
		commentary.addUnits('commentary', 'en', unit(), 'commentary.haydock.en');
		expect(commentary.report().families.commentary.prose.scripture).toBe(2);

		const bible = new CoverageMeter();
		bible.addUnits('bible', 'en', unit(), 'bible.douay-rheims.en');
		expect(bible.report().families.bible.prose.scripture).toBe(0);
	});
});

describe('compareCoverage', () => {
	const baseline = {
		families: {
			ccc: { citations: { linkable: 1000 }, prose: { scripture: 100, stored: 0 } },
			summa: { citations: { linkable: 0 }, prose: { scripture: 7000, stored: 5000 } }
		}
	};

	it('is silent within the tolerance', () => {
		const report = {
			families: {
				ccc: { citations: { linkable: 980 }, prose: { scripture: 100, stored: 0 } },
				summa: { citations: { linkable: 0 }, prose: { scripture: 7000, stored: 4900 } }
			}
		};
		expect(compareCoverage(report, baseline)).toEqual([]);
	});

	it('names every family and metric that fell past it', () => {
		const report = {
			families: {
				ccc: { citations: { linkable: 900 }, prose: { scripture: 100, stored: 0 } }
			}
		};
		expect(compareCoverage(report, baseline)).toEqual([
			'ccc: linkable citations 1000 → 900',
			'summa: in the baseline, absent from this build'
		]);
	});
});

describe('compareCrossWork', () => {
	const baseline = {
		families: {},
		crossWork: { pairedDivisions: 2560, condensedQuestions: 598, condensedParagraphs: 2735 }
	};

	it('is silent within the tolerance', () => {
		expect(
			compareCrossWork(
				{
					families: {},
					crossWork: { pairedDivisions: 2520, condensedQuestions: 598, condensedParagraphs: 2735 }
				},
				baseline
			)
		).toEqual([]);
	});

	// The Spanish Compendium parsed seven sections against the other nine
	// editions' eight, and the pairing dropped that whole level rather than
	// mispairing it. This is the counter that would have said so.
	it('names a level the outlines stopped agreeing on', () => {
		expect(
			compareCrossWork(
				{
					families: {},
					crossWork: { pairedDivisions: 2480, condensedQuestions: 598, condensedParagraphs: 2735 }
				},
				baseline
			)
		).toEqual(['cross-work: pairedDivisions 2560 → 2480']);
	});

	it('reads a counter absent from the build as zero, not as NaN', () => {
		expect(compareCrossWork({ families: {} }, baseline)).toEqual([
			'cross-work: pairedDivisions 2560 → 0',
			'cross-work: condensedQuestions 598 → 0',
			'cross-work: condensedParagraphs 2735 → 0'
		]);
	});

	// The other direction: a baseline recorded before these counters existed
	// must not fail every build that comes after it.
	it('passes a baseline that predates the counters', () => {
		expect(
			compareCrossWork({ families: {}, crossWork: { pairedDivisions: 2560 } }, { families: {} })
		).toEqual([]);
	});
});
