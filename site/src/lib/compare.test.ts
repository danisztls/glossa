import { describe, expect, it } from 'vitest';
import {
	alignByNumber,
	isCompareRequested,
	numberSetsDiffer,
	pickComparisonEdition,
	withCompareParam
} from './compare';

describe('alignByNumber', () => {
	it('pairs matching numbers on both sides', () => {
		const left = [
			{ n: 1, t: 'l1' },
			{ n: 2, t: 'l2' }
		];
		const right = [
			{ n: 1, t: 'r1' },
			{ n: 2, t: 'r2' }
		];
		expect(alignByNumber(left, right)).toEqual([
			{ n: 1, left: left[0], right: right[0] },
			{ n: 2, left: left[1], right: right[1] }
		]);
	});

	it('produces a gap, not a shift, when one side is missing a unit', () => {
		// Left has 1,2,3; right is missing 2 — a naive positional zip would
		// pair left's 3 with right's (positionally third) nothing-or-wrong
		// entry. This must instead keep 3 aligned with 3.
		const left = [{ n: 1 }, { n: 2 }, { n: 3 }];
		const right = [{ n: 1 }, { n: 3 }];
		const rows = alignByNumber(left, right);
		expect(rows.map((r) => r.n)).toEqual([1, 2, 3]);
		expect(rows[1]).toEqual({ n: 2, left: left[1], right: undefined });
		expect(rows[2]).toEqual({ n: 3, left: left[2], right: right[1] });
	});

	it('includes a unit present only on the right', () => {
		const left = [{ n: 1 }];
		const right = [{ n: 1 }, { n: 2 }];
		const rows = alignByNumber(left, right);
		expect(rows).toEqual([
			{ n: 1, left: left[0], right: right[0] },
			{ n: 2, left: undefined, right: right[1] }
		]);
	});

	it('sorts by number regardless of input order', () => {
		const left = [{ n: 3 }, { n: 1 }, { n: 2 }];
		const right = [{ n: 2 }, { n: 3 }, { n: 1 }];
		expect(alignByNumber(left, right).map((r) => r.n)).toEqual([1, 2, 3]);
	});

	it('returns an empty list for two empty inputs', () => {
		expect(alignByNumber([], [])).toEqual([]);
	});

	it('handles a completely disjoint pair (e.g. an EN-only vs PT-only document)', () => {
		const left = [{ n: 1 }, { n: 2 }];
		const right = [{ n: 5 }];
		const rows = alignByNumber(left, right);
		expect(rows.map((r) => r.n)).toEqual([1, 2, 5]);
		expect(rows.every((r) => r.left === undefined || r.right === undefined)).toBe(true);
	});
});

describe('numberSetsDiffer', () => {
	it('is false for identical sets, regardless of order', () => {
		expect(numberSetsDiffer([1, 2, 3], [3, 1, 2])).toBe(false);
	});

	it('is true when lengths differ (Esther-style: one edition has an extra chapter)', () => {
		expect(numberSetsDiffer([1, 2, 3], [1, 2, 3, 4])).toBe(true);
	});

	it('is true when lengths match but the members differ (Psalm 13-style split)', () => {
		// CPDV Ps 13 has verses 1-10; a hypothetical same-length-but-different
		// split would still need to be caught — length equality alone is not
		// enough evidence of agreement.
		expect(numberSetsDiffer([1, 2, 3, 4], [1, 2, 3, 5])).toBe(true);
	});

	it('is false for two empty sets', () => {
		expect(numberSetsDiffer([], [])).toBe(false);
	});
});

describe('pickComparisonEdition', () => {
	const editions = [
		{ id: 'bible.cpdv.en', lang: 'en' },
		{ id: 'bible.matos-soares.pt', lang: 'pt' }
	];

	it('picks the other-language edition over the primary', () => {
		expect(pickComparisonEdition('bible.cpdv.en', editions)?.id).toBe('bible.matos-soares.pt');
	});

	it('is symmetric', () => {
		expect(pickComparisonEdition('bible.matos-soares.pt', editions)?.id).toBe('bible.cpdv.en');
	});

	it('prefers a different-language edition over a same-language one', () => {
		const withSecondEnglish = [...editions, { id: 'bible.douay-rheims.en', lang: 'en' }];
		expect(pickComparisonEdition('bible.cpdv.en', withSecondEnglish)?.id).toBe(
			'bible.matos-soares.pt'
		);
	});

	it('falls back to any other edition when none differs in language', () => {
		const sameLangOnly = [
			{ id: 'bible.cpdv.en', lang: 'en' },
			{ id: 'bible.douay-rheims.en', lang: 'en' }
		];
		expect(pickComparisonEdition('bible.cpdv.en', sameLangOnly)?.id).toBe('bible.douay-rheims.en');
	});

	it('returns undefined when the primary is the only edition', () => {
		expect(pickComparisonEdition('bible.cpdv.en', [editions[0]])).toBeUndefined();
	});
});

describe('compare URL param', () => {
	it('isCompareRequested is false with no param', () => {
		expect(isCompareRequested(new URL('https://example.test/bible/john/1'))).toBe(false);
	});

	it('isCompareRequested is true only for the exact value "1"', () => {
		expect(isCompareRequested(new URL('https://example.test/ccc/1?compare=1'))).toBe(true);
		expect(isCompareRequested(new URL('https://example.test/ccc/1?compare=true'))).toBe(false);
		expect(isCompareRequested(new URL('https://example.test/ccc/1?compare='))).toBe(false);
	});

	it('withCompareParam adds the param without touching existing ones', () => {
		const url = new URL('https://example.test/bible/john/1?v=1-3');
		const next = withCompareParam(url, true);
		expect(next.searchParams.get('compare')).toBe('1');
		expect(next.searchParams.get('v')).toBe('1-3');
		// Original is untouched.
		expect(url.searchParams.has('compare')).toBe(false);
	});

	it('withCompareParam(false) removes the param', () => {
		const url = new URL('https://example.test/ccc/1?compare=1');
		expect(withCompareParam(url, false).searchParams.has('compare')).toBe(false);
	});

	it('round-trips through isCompareRequested', () => {
		const url = new URL('https://example.test/compendium/1');
		expect(isCompareRequested(withCompareParam(url, true))).toBe(true);
		expect(isCompareRequested(withCompareParam(withCompareParam(url, true), false))).toBe(false);
	});
});
