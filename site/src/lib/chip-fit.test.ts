import { describe, expect, it } from 'vitest';
import { fitChips } from './chip-fit';

/** `n` chips of `px` each, gaps included — what the route hands in. */
const run = (n: number, px: number) => Array.from({ length: n }, () => px);

const COUNT = 40;

describe('fitChips', () => {
	it('prints a run that fits entire, with no room kept for a count', () => {
		// 300 of 320 used, and the 40 a count would want is never asked for.
		expect(fitChips(run(3, 100), 320, COUNT)).toBe(3);
	});

	it('cuts where the line runs out', () => {
		// 40 for the count leaves 260: two chips of 100 fit, the third does not.
		expect(fitChips(run(5, 100), 300, COUNT)).toBe(2);
	});

	it('measures chips one by one rather than by their average', () => {
		// The long one is what does not fit, and a mean would have hidden the
		// two short ones with it.
		expect(fitChips([60, 60, 400], 300, COUNT)).toBe(2);
	});

	// The count's own chip is why: hiding one 100px chip to print a 40px count
	// frees 60px, so the run really is shorter.
	it('keeps a chip a narrower count cannot pay for', () => {
		expect(fitChips(run(4, 100), 360, COUNT)).toBe(3);
	});

	it('always prints one, however wide it is', () => {
		expect(fitChips([900], 300, COUNT)).toBe(1);
		expect(fitChips([900, 40, 40], 300, COUNT)).toBe(1);
	});

	it('is zero for a row with no chips', () => {
		expect(fitChips([], 300, COUNT)).toBe(0);
	});

	// A width the route could not measure yet arrives as 0; the guard is the
	// route's, and this only has to not divide by anything.
	it('prints everything when the line has not been measured', () => {
		expect(fitChips(run(3, 0), 0, 0)).toBe(3);
	});
});
