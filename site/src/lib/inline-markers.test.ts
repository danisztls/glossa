import { describe, it, expect } from 'vitest';
import { splitMarkers } from './inline-markers';
import { displayTitle } from './titles';
import type { StructureNode } from './types';

describe('splitMarkers', () => {
	it('returns the title as one run when the heading carries no apparatus', () => {
		expect(splitMarkers('The Desire for God')).toEqual([{ text: 'The Desire for God' }]);
		expect(splitMarkers('The Desire for God', 'The Desire for God')).toEqual([
			{ text: 'The Desire for God' }
		]);
	});

	// Verbatim from ccc.en: the source prints a <sup> on the heading, sourcing
	// the phrase it quotes (footnote 25 is "DV 2."). `displayTitle` has already
	// stripped the "III." into a separate ordinal, so the displayed title is a
	// suffix of the corpus one and every offset shifts by that much.
	it('rebases a terminal marker onto the ordinal-stripped title', () => {
		const marked = 'III. Christ Jesus -- "Mediator and Fullness of All Revelation"⟦25⟧';
		const shown = 'Christ Jesus -- "Mediator and Fullness of All Revelation"';
		expect(splitMarkers(shown, marked)).toEqual([{ text: shown }, { marker: '25', seq: 0 }]);
	});

	it('keeps a mid-title marker where the source printed it', () => {
		expect(splitMarkers('A B C', 'A B⟦7⟧ C')).toEqual([
			{ text: 'A B' },
			{ marker: '7', seq: 0 },
			{ text: ' C' }
		]);
	});

	it('numbers repeats by position, so each discloses independently', () => {
		expect(splitMarkers('A B', 'A⟦4⟧ B⟦4⟧')).toEqual([
			{ text: 'A' },
			{ marker: '4', seq: 0 },
			{ text: ' B' },
			{ marker: '4', seq: 1 }
		]);
	});

	// A trailing colon `displayTitle` trims leaves the displayed title still a
	// PREFIX of the corpus one, so offsets survive unchanged.
	it('still places markers when only a trailing colon was trimmed', () => {
		expect(splitMarkers('The Creeds', 'The⟦9⟧ Creeds:')).toEqual([
			{ text: 'The' },
			{ marker: '9', seq: 0 },
			{ text: ' Creeds' }
		]);
	});

	// `displayTitle` also normalizes the source's all-caps runs, which leaves
	// the displayed title matching nothing in the corpus one. Guessing an
	// offset there could land mid-word; appending cannot.
	it('appends every marker when the displayed title is not a substring at all', () => {
		expect(splitMarkers('The Creeds', 'THE⟦9⟧ CREEDS')).toEqual([
			{ text: 'The Creeds' },
			{ marker: '9', seq: 0 }
		]);
	});

	// The two real nodes, end to end through the transform the reading view
	// actually applies. This is the pairing that can silently regress: nothing
	// stops `displayTitle` from one day rewriting the title in a way that no
	// longer matches the corpus form, and the fallback would quietly move a
	// mid-title marker to the end.
	it.each([
		[
			'III. Christ Jesus -- "Mediator and Fullness of All Revelation"',
			'III. Christ Jesus -- "Mediator and Fullness of All Revelation"⟦25⟧',
			3
		],
		['II. "I Know Whom I Have Believed"', 'II. "I Know Whom I Have Believed"⟦16⟧', 2]
	])("places ccc.en's own heading citation after %s", (title, title_marked, n) => {
		const node = { kind: 'sub', n, title, title_marked } as StructureNode;
		const shown = displayTitle(node, 'en');
		const pieces = splitMarkers(shown.title, node.title_marked);
		expect(pieces.at(-1)).toEqual({ marker: title_marked.match(/⟦(\d+)⟧/)![1], seq: 0 });
		expect(pieces.filter((p) => 'text' in p).map((p) => (p as { text: string }).text)).toEqual([
			shown.title
		]);
	});
});

describe('splitMarkers over an annotated verse', () => {
	// A verse passes its own `text`, so `plain.indexOf(shown)` is 0 and the
	// rebasing that exists for display titles is a no-op. Asserted because the
	// heading path is the one with all the edge cases, and a regression there
	// would land silently on 1,917 Douay-Rheims notes.
	const text =
		'Jesus answered: Amen, amen, I say to thee, unless a man be born again of water and the Holy Ghost, he cannot enter into the kingdom of God.';
	const marked =
		'Jesus answered: Amen, amen, I say to thee, unless a man be born again⟦1⟧ of water and the Holy Ghost, he cannot enter into the kingdom of God.';

	it('puts the marker after the last word of the lemma', () => {
		const pieces = splitMarkers(text, marked);
		expect(pieces).toHaveLength(3);
		expect(pieces[0]).toEqual({
			text: 'Jesus answered: Amen, amen, I say to thee, unless a man be born again'
		});
		expect(pieces[1]).toEqual({ marker: '1', seq: 0 });
		// The lemma is "Unless a man be born again": walking back from the token
		// by exactly that string is what a renderer would underline.
		expect((pieces[0] as { text: string }).text.toLowerCase()).toContain(
			'unless a man be born again'
		);
	});

	it('reproduces the verse character for character', () => {
		const joined = splitMarkers(text, marked)
			.map((piece) => ('text' in piece ? piece.text : ''))
			.join('');
		expect(joined).toBe(text);
	});

	it('leaves an unannotated verse as one run', () => {
		// The overwhelming majority: 35,804 verses carry 1,917 notes between
		// them, so most have no `text_marked` twin at all.
		expect(splitMarkers(text)).toEqual([{ text }]);
	});
});
