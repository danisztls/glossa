import { describe, expect, it } from 'vitest';
import {
	CoverageMeter,
	classifyCitation,
	compareCoverage
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
		expect(families.summa.prose).toEqual({ blocks: 1, scripture: 1, stored: 1 });
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
