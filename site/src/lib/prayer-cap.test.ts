import { describe, it, expect } from 'vitest';
import { prayerCap, capNodes, capSegments } from './prayer-cap';
import { prayerLines, type PrayerLine } from './prayer-lines';
import { segmentText, type Segment } from './annotated-segments';
import type { PrayerBlock } from './types';

/** The prayer as its printed lines, which is what the renderer is handed. */
function linesOf(...blocks: PrayerBlock[]): PrayerLine[] {
	return prayerLines(blocks);
}

function verse(text: string, extra: Partial<PrayerBlock> = {}): PrayerBlock {
	return { text: '', html: text, ...extra } as PrayerBlock;
}

describe('which line takes an initial', () => {
	it('gives the opening line of the opening block one, and no other line', () => {
		const lines = linesOf(verse('Our Father who art in heaven,<br>hallowed be thy name.'));
		const caps = lines.map((line) => prayerCap(line, { dropCap: true }));
		expect(caps.map((c) => c?.first ?? null)).toEqual(['O', null]);
	});

	it('gives a later block none, a further paragraph not being a second beginning', () => {
		const lines = linesOf(verse('Hail Mary,<br>full of grace.'), verse('Holy Mary.'));
		const later = lines.filter((line) => line.block === 1);
		expect(later.map((line) => prayerCap(line, { dropCap: true }))).toEqual([null]);
	});

	it('takes the caller at its word when it says these lines open nothing', () => {
		const [line] = linesOf(verse('Our Father who art in heaven.'));
		expect(prayerCap(line, { dropCap: false })).toBeNull();
	});

	/* Three prayers in the corpus open on a dialogue turn — the EN, FR and PT
	   Angelus — and the label in its own column is what says where the prayer
	   starts. The initial goes on the opening block alone, so such a prayer
	   takes none anywhere, which is the whole of what this asserts. */
	it('gives a dialogue turn none, at any label the source prints', () => {
		for (const [kind, label] of [
			['versicle', 'V.'],
			['versicle', 'D.'],
			['response', 'R.'],
			['response', 'C.']
		] as const) {
			const lines = linesOf(
				verse('The Angel of the Lord declared unto Mary.', { kind, label }),
				verse('And she conceived of the Holy Spirit.')
			);
			expect(
				lines.every((line) => prayerCap(line, { dropCap: true }) === null),
				label
			).toBe(true);
		}
	});
});

describe('which size it takes', () => {
	it('sets verse as a versal and a block printed as one run as a drop cap', () => {
		const [broken] = linesOf(verse('Thy kingdom come.<br>Thy will be done.'));
		const [run] = linesOf(verse('Remember, O most gracious Virgin Mary, that never was it known.'));
		expect(prayerCap(broken, { dropCap: true })?.versal).toBe(true);
		expect(prayerCap(run, { dropCap: true })?.versal).toBe(false);
	});
});

describe('what is left of the line', () => {
	it('reproduces the line character for character, leading space included', () => {
		const [line] = linesOf(verse('  «Ninguém vem ao Pai senão por mim.'));
		const cap = prayerCap(line, { dropCap: true })!;
		const rest = capNodes(line, cap);
		const text = rest.map((n) => (n.kind === 'text' ? n.text : '')).join('');
		expect(cap.lead + cap.first + text).toBe('«Ninguém vem ao Pai senão por mim.');
		// The trimmed whitespace is counted, or the cap sits an em off the margin.
		expect(cap.consumed).toBe(4);
	});

	it('keeps the markup after the opening run', () => {
		const [line] = linesOf(verse('Sancta <i>Maria</i>'));
		const cap = prayerCap(line, { dropCap: true })!;
		expect(capNodes(line, cap).map((n) => n.kind)).toEqual(['text', 'emphasis']);
	});
});

describe('the initial and the apparatus on one line', () => {
	const text = 'Our Father who art in heaven,';
	const [line] = linesOf(verse(text));

	/** `buildSegments`' shape, written out: the run before the quoted words,
	 *  the words themselves, and the mark that follows them. */
	function segmentsAt(at: number, quoted: string): Segment[] {
		return [
			{ kind: 'text', text: text.slice(0, at) },
			{ kind: 'quoted', text: quoted, mark: 0 },
			{ kind: 'mark', mark: 0 },
			{ kind: 'text', text: text.slice(at + quoted.length) }
		];
	}

	it('sets both where the note quotes words the cap does not touch', () => {
		const segments = segmentsAt(4, 'Father');
		const cap = prayerCap(line, { dropCap: true, segments })!;
		expect(cap.first).toBe('O');
		expect(segmentText(capSegments(segments, cap.consumed))).toBe(text.slice(1));
	});

	it('stands down where the note quotes the opening word itself', () => {
		expect(prayerCap(line, { dropCap: true, segments: segmentsAt(0, 'Our Father') })).toBeNull();
	});

	it('stands down where the quoted words begin inside the letter', () => {
		// A first segment shorter than the cap consumed: slicing it would eat
		// into the words the note is lighting.
		const segments: Segment[] = [
			{ kind: 'text', text: '' },
			{ kind: 'quoted', text: 'Our', mark: 0 },
			{ kind: 'mark', mark: 0 },
			{ kind: 'text', text: text.slice(3) }
		];
		expect(prayerCap(line, { dropCap: true, segments })).toBeNull();
	});

	it('loses no character of the prayer when it does set both', () => {
		const segments = segmentsAt(4, 'Father');
		const cap = prayerCap(line, { dropCap: true, segments })!;
		expect(cap.lead + cap.first + segmentText(capSegments(segments, cap.consumed))).toBe(text);
	});
});
