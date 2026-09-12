import { describe, expect, it } from 'vitest';
import { CHIP_CHROME, fitChips, TAG_BUDGET_NARROW, TAG_BUDGET_WIDE } from './chip-fit';

/** `n` labels of `len` characters each. */
const run = (n: number, len: number) => Array.from({ length: n }, () => 'x'.repeat(len));

describe('fitChips', () => {
	it('prints everything that fits', () => {
		expect(fitChips(run(3, 8), TAG_BUDGET_WIDE)).toBe(3);
	});

	it('cuts where the budget runs out', () => {
		// 10 + 3 per chip, so six fill 78 and the seventh passes 88.
		expect(fitChips(run(9, 10), TAG_BUDGET_WIDE)).toBe(6);
	});

	it('cuts sooner on a phone than beside an aside', () => {
		expect(fitChips(run(9, 10), TAG_BUDGET_NARROW)).toBeLessThan(
			fitChips(run(9, 10), TAG_BUDGET_WIDE)
		);
	});

	// A `+1` is about as wide as the chip it replaces, so hiding one buys the
	// row nothing and costs the reader a press to learn one word.
	it('never hides exactly one chip', () => {
		expect(fitChips(run(7, 10), TAG_BUDGET_WIDE)).toBe(7);
	});

	// Otherwise a subject long enough to fill the row on its own would be a
	// row whose only visible subject is `+1`.
	it('always prints one, however long it is', () => {
		expect(fitChips(['x'.repeat(200)], TAG_BUDGET_NARROW)).toBe(1);
		expect(fitChips(['x'.repeat(200), 'war', 'peace'], TAG_BUDGET_NARROW)).toBe(1);
	});

	it('is zero for a row with no subjects', () => {
		expect(fitChips([], TAG_BUDGET_WIDE)).toBe(0);
	});

	// The chrome is what stops a budget from being read as a character count of
	// the labels alone: ten one-letter subjects cost forty characters, not ten.
	it('charges every chip for its own padding', () => {
		expect(fitChips(run(10, 1), 10 * (1 + CHIP_CHROME))).toBe(10);
		expect(fitChips(run(12, 1), 10 * (1 + CHIP_CHROME))).toBe(10);
	});
});
