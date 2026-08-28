import { describe, expect, it } from 'vitest';
import { PLATE_INTRINSIC_WIDTH, PLATE_WIDTHS, placePlates, plateImageName } from './plates';
import type { Plate } from './plates';

function plate(id: string, verse: number | null): Plate {
	return { id, osis: 'gen', chapter: 1, verse, title: id, width: 1200, height: 1500 };
}

/** 1..n, the ordinary chapter. */
const verses = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('placePlates', () => {
	it('keys each plate by the verse it is anchored to', () => {
		const placed = placePlates([plate('a', 3), plate('b', 9)], verses(20));
		expect([...placed.keys()].sort((x, y) => x - y)).toEqual([3, 9]);
		expect(placed.get(3)?.map((p) => p.id)).toEqual(['a']);
	});

	it('keeps two plates on one verse in the order given', () => {
		const placed = placePlates([plate('a', 5), plate('b', 5)], verses(20));
		expect(placed.get(5)?.map((p) => p.id)).toEqual(['a', 'b']);
	});

	/**
	 * The reason this function takes the edition's verse numbers at all.
	 * Anchors were decided against `bible.douay-rheims.en`, and the editions
	 * disagree about verse numbering in 31 chapters — a plate dropped for one
	 * edition and drawn for another would be a silent, edition-specific hole.
	 */
	it('falls back to the nearest earlier verse the edition prints', () => {
		const placed = placePlates([plate('a', 12)], [1, 2, 3, 10, 20]);
		expect(placed.get(10)?.map((p) => p.id)).toEqual(['a']);
		expect(placed.has(12)).toBe(false);
	});

	it('falls back to the first verse when the anchor precedes every verse', () => {
		// A chapter whose numbering starts late — the shape a critical text's
		// verse gap produces at the head of a chapter.
		const placed = placePlates([plate('a', 2)], [5, 6, 7]);
		expect(placed.get(5)?.map((p) => p.id)).toEqual(['a']);
	});

	it('keys a chapter-anchored plate 0, which the page draws before verse 1', () => {
		const placed = placePlates([plate('a', null)], verses(20));
		expect(placed.get(0)?.map((p) => p.id)).toEqual(['a']);
	});

	/** An edition that has nothing built at this address still must not throw:
	 *  `getChapter` can return a chapter with no verses. */
	it('survives an edition with no verses at all', () => {
		expect(() => placePlates([plate('a', 3)], [])).not.toThrow();
	});
});

describe('the image vocabulary shared with the sync', () => {
	it('names a file the way `syncPlates` copies it', () => {
		expect(plateImageName('OT-001', 800)).toBe('OT-001-800.avif');
	});

	/** The dimensions in the content file are one rendition's, so that
	 *  rendition has to be one the sync actually copies. */
	it('records dimensions for a width it emits', () => {
		expect(PLATE_WIDTHS).toContain(PLATE_INTRINSIC_WIDTH);
	});
});
