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

	it("gives a prose prayer's later block none, a further paragraph being no second beginning", () => {
		const lines = linesOf(
			verse('Remember, O most gracious Virgin Mary.'),
			verse('Inspired by this confidence.')
		);
		const later = lines.filter((line) => line.block === 1);
		expect(later.map((line) => prayerCap(line, { dropCap: true }))).toEqual([null]);
	});

	/* The Regina Caeli's shape: a stanza, `Let us pray;`, then a collect. Each
	   block is a movement the source set apart, so each opens with an initial —
	   and every one of them at the one-line size, the prayer being verse even
	   where the block it opens is a single run. */
	it("gives every block of a verse prayer's an initial, at the one size", () => {
		const lines = linesOf(
			verse('Queen of heaven, rejoice.<br>The Son whom you merited to bear.'),
			verse('Let us pray;'),
			verse('O God, who through the resurrection of your Son.')
		);
		const caps = lines.map((line) => prayerCap(line, { dropCap: true }));
		expect(caps.map((c) => c?.first ?? null)).toEqual(['Q', null, 'L', 'O']);
		expect(caps.filter((c) => c !== null).every((c) => c.versal)).toBe(true);
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
	it('reads the size off the PRAYER and never off the block it opens', () => {
		const [broken] = linesOf(verse('Thy kingdom come.<br>Thy will be done.'));
		const [run] = linesOf(verse('Remember, O most gracious Virgin Mary, that never was it known.'));
		expect(prayerCap(broken, { dropCap: true })?.versal).toBe(true);
		expect(prayerCap(run, { dropCap: true })?.versal).toBe(false);
	});

	/* The `Let us pray;` case, and the reason the size cannot be `line.verse`:
	   a three-line cap on a four-word paragraph overflows it into the collect
	   below and indents that, which is the bug the versal exists to prevent. */
	it('keeps the versal on a single-run block inside a verse prayer', () => {
		const lines = linesOf(verse('Queen of heaven.<br>Rejoice, alleluia.'), verse('Let us pray;'));
		const cap = prayerCap(
			lines.find((line) => line.block === 1)!,
			{ dropCap: true }
		);
		expect(cap?.first).toBe('L');
		expect(cap?.versal).toBe(true);
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

	/** `buildSegments`' shape, written out: the run before the quoted words, the
	 *  words themselves, and the mark that follows them.
	 *
	 *  EMPTY RUNS ARE OMITTED, which is `buildSegments`' own `push` guard and
	 *  not a tidying choice here — a lemma at character zero produces a
	 *  `quoted` first segment and no empty `text` before it, and a fixture that
	 *  wrote one would test a shape the real function cannot emit. */
	function segmentsAt(at: number, quoted: string): Segment[] {
		const before = text.slice(0, at);
		const after = text.slice(at + quoted.length);
		return [
			...(before === '' ? [] : ([{ kind: 'text', text: before }] as Segment[])),
			{ kind: 'quoted', text: quoted, mark: 0 },
			{ kind: 'mark', mark: 0 },
			...(after === '' ? [] : ([{ kind: 'text', text: after }] as Segment[]))
		];
	}

	it('sets both where the note quotes words the cap does not touch', () => {
		const segments = segmentsAt(4, 'Father');
		const cap = prayerCap(line, { dropCap: true, segments })!;
		expect(cap.first).toBe('O');
		expect(segmentText(capSegments(segments, cap.consumed))).toBe(text.slice(1));
	});

	/* The Creed and the Ave open on their own first lemma — `I believe in God`
	   and `Hail Mary`, both from character zero — so this is the case that
	   decides whether three of the four glossed prayers have an initial at all.
	   The letter comes out of the quoted run and the run KEEPS ITS KIND, so the
	   rest of it still lights when the note opens. */
	it('takes its letter out of the quoted words when they open the line', () => {
		const segments = segmentsAt(0, 'Our Father');
		const cap = prayerCap(line, { dropCap: true, segments })!;
		expect(cap.first).toBe('O');
		const cut = capSegments(segments, cap.consumed);
		expect(cut[0]).toEqual({ kind: 'quoted', text: 'ur Father', mark: 0 });
		expect(cap.lead + cap.first + segmentText(cut)).toBe(text);
	});

	/* The two guards, and neither shape is reachable from today's corpus — a
	   prayer anchor always quotes at least a word, and `buildSegments` never
	   opens with a mark. They are here because the alternative to refusing is
	   slicing past the run the cap owns and into somebody else's, which is the
	   failure mode that loses a word of a prayer without erring. */
	it('stands down where the opening run is shorter than the letter', () => {
		const segments: Segment[] = [
			{ kind: 'quoted', text: '', mark: 0 },
			{ kind: 'mark', mark: 0 },
			{ kind: 'text', text }
		];
		expect(prayerCap(line, { dropCap: true, segments })).toBeNull();
	});

	it('stands down where the opening run carries no text at all', () => {
		const segments: Segment[] = [
			{ kind: 'mark', mark: 0 },
			{ kind: 'text', text }
		];
		expect(prayerCap(line, { dropCap: true, segments })).toBeNull();
	});

	it('loses no character of the prayer when it does set both', () => {
		const segments = segmentsAt(4, 'Father');
		const cap = prayerCap(line, { dropCap: true, segments })!;
		expect(cap.lead + cap.first + segmentText(capSegments(segments, cap.consumed))).toBe(text);
	});
});
