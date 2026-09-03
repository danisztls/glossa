import { describe, expect, it } from 'vitest';
import { pairPrayerLines, prayerLines } from './prayer-lines';
import type { PrayerBlock } from './types';

/*
 * The flattening is what compare mode aligns on, so what these pin is the
 * fields that are NOT the text: a lone line has to carry everything its block
 * knew, because after the split there is no block left to ask.
 *
 * Written against the corpus's own shapes — the Pai Nosso's nine printed
 * lines, the Angelus's labelled turns, the Memorare printed as one run — since
 * those are the three the renderer branches on.
 */

const text = (block: Partial<PrayerBlock>): PrayerBlock => ({ text: '', ...block });

describe('prayerLines', () => {
	it('gives a block broken by the source one line per break', () => {
		const lines = prayerLines([text({ html: 'Pai Nosso<br />santificado<br />venha' })]);
		expect(lines).toHaveLength(3);
		expect(lines.map((l) => l.n)).toEqual([0, 1, 2]);
		expect(lines.map((l) => l.verse)).toEqual([true, true, true]);
		expect(lines.map((l) => l.first)).toEqual([true, false, false]);
		expect(lines.map((l) => l.last)).toEqual([false, false, true]);
	});

	it('marks a block printed as one run as prose, not verse', () => {
		const lines = prayerLines([text({ html: 'Lembrai-vos, ó piíssima Virgem Maria' })]);
		expect(lines).toHaveLength(1);
		// `verse` is what picks the one-line initial over the three-line one, and
		// what tells the renderer these wraps are the viewport's.
		expect(lines[0].verse).toBe(false);
		expect(lines[0].first).toBe(true);
		expect(lines[0].last).toBe(true);
	});

	it('numbers lines across blocks, and records which block each came from', () => {
		const lines = prayerLines([text({ html: 'a<br />b' }), text({ html: 'c' })]);
		expect(lines.map((l) => l.n)).toEqual([0, 1, 2]);
		expect(lines.map((l) => l.block)).toEqual([0, 0, 1]);
		// The last line of every block carries the gap to the next one.
		expect(lines.map((l) => l.last)).toEqual([false, true, true]);
	});

	it('prints the label on the first line of its turn and reserves it on the rest', () => {
		const lines = prayerLines([
			text({ kind: 'versicle', label: 'V.', html: 'O Anjo do Senhor<br />anunciou a Maria' })
		]);
		expect(lines.map((l) => l.label)).toEqual(['V.', undefined]);
		// Both lines are labelled: the column stays reserved so the turn's
		// continuation does not step back to the margin.
		expect(lines.map((l) => l.labelled)).toEqual([true, true]);
		expect(lines.map((l) => l.kind)).toEqual(['versicle', 'versicle']);
	});

	it('reserves nothing for a turn whose source prints no label', () => {
		const lines = prayerLines([text({ kind: 'response', html: 'Ave Maria' })]);
		expect(lines[0].labelled).toBe(false);
	});

	it('defaults a block with no kind to prose', () => {
		expect(prayerLines([text({ html: 'Amen.' })])[0].kind).toBe('prose');
	});

	it('escapes plain text before parsing it as markup', () => {
		// `text` is not markup, so an ampersand in it is an ampersand — parsing it
		// unescaped would leave a broken entity in the corpus's own words.
		const lines = prayerLines([text({ text: 'Pai & Filho' })]);
		expect(lines[0].nodes).toEqual([{ kind: 'text', text: 'Pai & Filho' }]);
	});

	it('prefers html over text where the block carries both', () => {
		const lines = prayerLines([text({ text: 'plain', html: '<i>marked</i>' })]);
		expect(lines[0].nodes[0].kind).toBe('emphasis');
	});

	it('keeps a break inside emphasis as a break, not as a line', () => {
		// `splitLines` splits at the TOP level only — its docblock says why, and
		// the count is what a caller would silently get wrong.
		const lines = prayerLines([text({ html: '<i>one<br />two</i>' })]);
		expect(lines).toHaveLength(1);
	});

	it('is empty for a prayer with no blocks', () => {
		// The Slovenian Rosary: four mystery groups, no blocks at all.
		expect(prayerLines([])).toEqual([]);
	});
});

describe('pairPrayerLines', () => {
	const nine = prayerLines([
		text({ html: Array.from({ length: 9 }, (_, i) => `l${i}`).join('<br />') })
	]);
	const one = prayerLines([text({ html: 'the whole prayer as one run' })]);

	it('pairs line for line where both editions break the same number of times', () => {
		const rows = pairPrayerLines(nine, [...nine]);
		expect(rows).toHaveLength(9);
		expect(rows.every((row) => row.left.lines.length === 1 && row.right.lines.length === 1)).toBe(
			true
		);
		expect(rows.map((row) => row.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it('falls back to one row holding each whole prayer where they do not', () => {
		// The Our Father: nine printed lines in Portuguese against one run in
		// English. Zipping would put the English prayer beside line 1 and leave
		// eight blank rows under it.
		const rows = pairPrayerLines(nine, one);
		expect(rows).toHaveLength(1);
		expect(rows[0].left.lines).toHaveLength(9);
		expect(rows[0].right.lines).toHaveLength(1);
	});

	it('still gives one row when neither side has any lines', () => {
		// The Slovenian Rosary is all mystery groups; the groups render in the
		// band above the first row, so the row has to exist.
		const rows = pairPrayerLines([], []);
		expect(rows).toHaveLength(1);
		expect(rows[0].left.lines).toEqual([]);
	});
});
