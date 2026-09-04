import { describe, expect, it } from 'vitest';
import { nearestScrollDelta } from './reveal-row';

/** A box 200px tall starting at viewport y=100 — the stand-in for an aside. */
const box = { top: 100, bottom: 300 };

describe('nearestScrollDelta', () => {
	it('is zero for a row already inside the box, which is the common case', () => {
		expect(nearestScrollDelta({ top: 150, bottom: 170 }, box)).toBe(0);
	});

	it('is zero for a row flush against either edge', () => {
		expect(nearestScrollDelta({ top: 100, bottom: 120 }, box)).toBe(0);
		expect(nearestScrollDelta({ top: 280, bottom: 300 }, box)).toBe(0);
	});

	it('scrolls up by exactly the overshoot for a row above the box', () => {
		expect(nearestScrollDelta({ top: 60, bottom: 80 }, box)).toBe(-40);
	});

	it('scrolls down by exactly the overshoot for a row below the box', () => {
		expect(nearestScrollDelta({ top: 330, bottom: 350 }, box)).toBe(50);
	});

	it('brings the row to the edge it came in from and no further', () => {
		const row = { top: 40, bottom: 60 };
		const moved = {
			top: row.top - nearestScrollDelta(row, box),
			bottom: row.bottom - nearestScrollDelta(row, box)
		};
		expect(moved.top).toBe(box.top);
	});

	it('aligns a row taller than the box to its top rather than chasing both edges', () => {
		expect(nearestScrollDelta({ top: 50, bottom: 500 }, box)).toBe(-50);
	});
});
