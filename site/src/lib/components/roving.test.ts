import { describe, expect, it } from 'vitest';
import { rovedIndex } from './roving';

/** Nine, because that is the jump box's legend — the list whose length is not
 *  the one the arithmetic used to read. */
const NINE = 9;

describe('rovedIndex', () => {
	describe('ArrowDown', () => {
		it('opens at the first row from nothing chosen', () => {
			expect(rovedIndex('ArrowDown', -1, NINE)).toBe(0);
		});

		// The regression this module exists for: with the count taken from the
		// wrong list it was 0, `active >= -1` was always true, and every press
		// answered 0 again.
		it('advances one row at a time, and does not stick on the first', () => {
			expect(rovedIndex('ArrowDown', 0, NINE)).toBe(1);
			expect(rovedIndex('ArrowDown', 1, NINE)).toBe(2);
			expect(rovedIndex('ArrowDown', 7, NINE)).toBe(8);
		});

		it('wraps at the end', () => {
			expect(rovedIndex('ArrowDown', 8, NINE)).toBe(0);
		});
	});

	describe('ArrowUp', () => {
		it('opens at the last row from nothing chosen', () => {
			expect(rovedIndex('ArrowUp', -1, NINE)).toBe(8);
		});

		it('steps back one row at a time', () => {
			expect(rovedIndex('ArrowUp', 8, NINE)).toBe(7);
			expect(rovedIndex('ArrowUp', 1, NINE)).toBe(0);
		});

		it('wraps at the start', () => {
			expect(rovedIndex('ArrowUp', 0, NINE)).toBe(8);
		});
	});

	// They move within a list the reader is already walking. Before that the
	// caret owns them, and the caller reads `undefined` as "leave it alone".
	describe('Home and End', () => {
		it('jump to the ends once a row is chosen', () => {
			expect(rovedIndex('Home', 4, NINE)).toBe(0);
			expect(rovedIndex('End', 4, NINE)).toBe(8);
		});

		it('decline with nothing chosen', () => {
			expect(rovedIndex('Home', -1, NINE)).toBeUndefined();
			expect(rovedIndex('End', -1, NINE)).toBeUndefined();
		});
	});

	it('declines every other key', () => {
		for (const key of ['Tab', 'Enter', 'Escape', 'Backspace', 'a', ' ', 'PageDown']) {
			expect(rovedIndex(key, 3, NINE), key).toBeUndefined();
		}
	});

	it('declines an empty list, whichever key', () => {
		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			expect(rovedIndex(key, -1, 0), key).toBeUndefined();
			expect(rovedIndex(key, 0, 0), key).toBeUndefined();
		}
	});

	it('is a no-op on a list of one, rather than an out-of-range index', () => {
		expect(rovedIndex('ArrowDown', 0, 1)).toBe(0);
		expect(rovedIndex('ArrowUp', 0, 1)).toBe(0);
		expect(rovedIndex('End', 0, 1)).toBe(0);
	});
});
