import { describe, expect, it } from 'vitest';
import { inlineShift } from './floating';

/** A `.menu-panel`'s box, in viewport coordinates. */
const box = (left: number, width: number) => ({ left, right: left + width });

/** `.menu-panel`'s `min-width`, at the default root font size. */
const PANEL = 224;

describe('inlineShift', () => {
	it('leaves a panel that already fits alone', () => {
		expect(inlineShift(box(120, PANEL), 380)).toBe(0);
	});

	it('pulls back a panel overflowing the right edge', () => {
		// Right edge at 400 on a 380px viewport: 20 past it, plus the 8px gap.
		expect(inlineShift(box(176, PANEL), 380)).toBe(-28);
	});

	it('pushes in a panel overflowing the left edge', () => {
		// The reading bar's edition picker: its trigger is the first control in
		// the row, so the panel grows leftward past x=0.
		expect(inlineShift(box(-31, PANEL), 445)).toBe(39);
	});

	it('overflows the far edge, not the near one, when the panel is wider than the viewport', () => {
		// Correcting for the right edge alone would take this further negative;
		// the left clamp runs second and wins.
		expect(inlineShift(box(-40, 400), 300)).toBe(48);
	});

	it('respects the gap at both edges', () => {
		expect(inlineShift(box(0, PANEL), 380)).toBe(8);
		expect(inlineShift(box(380 - PANEL, PANEL), 380)).toBe(-8);
	});
});
