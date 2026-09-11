import { describe, expect, it } from 'vitest';
import { foldState } from './fold-state.svelte';

/**
 * THE THREE RULES ARE EACH INVISIBLE WHEN THEY ARE WRONG, which is why they
 * are a module and why this file exists: a section that should be open and is
 * not renders perfectly, and so does one that records a fold the reader never
 * chose. There is no component harness here, so the policy is tested where it
 * lives and the two routes keep only their own default.
 */
describe('a folded index', () => {
	it('starts shut where the page states no default', () => {
		const folds = foldState({ searching: () => false });
		expect(folds.isOpen('a', 0)).toBe(false);
	});

	it('opens the sections the page says are open', () => {
		const folds = foldState({ searching: () => false, defaultOpen: (i) => i < 2 });
		expect([0, 1, 2].map((i) => folds.isOpen('s', i))).toEqual([true, true, false]);
	});

	it('forces every section open while a query is live', () => {
		let searching = false;
		const folds = foldState({ searching: () => searching });
		expect(folds.isOpen('a', 0)).toBe(false);
		searching = true;
		expect(folds.isOpen('a', 0)).toBe(true);
	});

	it('records nothing a query opened', () => {
		let searching = true;
		const folds = foldState({ searching: () => searching });
		// What the browser fires as the reactive attribute opens each section.
		folds.remember('a', 0, true);
		searching = false;
		expect(folds.isOpen('a', 0)).toBe(false);
	});

	it('keeps a fold the reader made', () => {
		const folds = foldState({ searching: () => false, defaultOpen: () => true });
		folds.remember('a', 0, false);
		expect(folds.isOpen('a', 0)).toBe(false);
	});

	/**
	 * The breakpoint case: a viewport narrowing moves the default and the
	 * browser fires `toggle` for every section it closed. Recorded, those would
	 * be choices the reader never made — and rotating back would leave the page
	 * folded at a width with room for it.
	 */
	it('forgets a toggle that only agrees with a default that moved', () => {
		let narrow = true;
		const folds = foldState({ searching: () => false, defaultOpen: (i) => !narrow || i < 2 });
		expect(folds.isOpen('s', 5)).toBe(false);
		folds.remember('s', 5, false);
		narrow = false;
		expect(folds.isOpen('s', 5)).toBe(true);
	});

	it('gives a reader who toggles back to the default their default back', () => {
		let narrow = false;
		const folds = foldState({ searching: () => false, defaultOpen: (i) => !narrow || i < 2 });
		folds.remember('s', 5, false);
		folds.remember('s', 5, true);
		narrow = true;
		expect(folds.isOpen('s', 5)).toBe(false);
	});

	it('opens the section a fragment names, and ignores no fragment', () => {
		const folds = foldState({ searching: () => false });
		folds.reveal('');
		expect(folds.isOpen('a', 0)).toBe(false);
		folds.reveal('a');
		expect(folds.isOpen('a', 0)).toBe(true);
	});
});
