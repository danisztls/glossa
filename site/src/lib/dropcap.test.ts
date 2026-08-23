import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { splitDropCap } from './dropcap';

/*
 * The drop-cap face is a hard subset — 137 codepoints out of Pirata One's 215,
 * because a drop cap needs almost none of a font (see the @font-face in
 * app.css for the pyftsubset invocation that produces it).
 *
 * That makes the subset a standing liability: `splitDropCap` decides at runtime
 * which character gets promoted, and if it ever promotes one the subset lacks,
 * the reader gets a tofu box at 4.98em in the accent colour, at the top of a
 * passage. Nothing else in the build would catch it — the page renders fine
 * in the browser, the build succeeds, only the glyph is missing.
 *
 * Only `first` is at risk. The `lead` punctuation is set in the *text* face
 * beside the cap (`.drop-cap-lead`), so it never asks the subset for a glyph.
 *
 * So the `unicode-range` is parsed out of app.css rather than copied here. A
 * copy would drift; this fails if someone narrows the subset without widening
 * the font, or adds a fixture whose opening character falls outside it.
 */
const CSS = readFileSync(fileURLToPath(new URL('../app.css', import.meta.url)), 'utf8');

function dropCapRanges(): Array<[number, number]> {
	// Match on the family declaration, NOT on the woff2 filename: the comment
	// above the block quotes the pyftsubset command (filename and all), and
	// that comment lands in the PRECEDING segment of this split — matching the
	// filename silently returned the vietnamese block's range instead.
	const block = CSS.split('@font-face').find((b) => /font-family:\s*'Pirata One Subset'/.test(b));
	if (!block) throw new Error('no drop-cap @font-face in app.css');
	const range = /unicode-range:([^;]+);/.exec(block);
	if (!range) throw new Error('drop-cap @font-face has no unicode-range');
	return range[1]
		.split(',')
		.map((part) => part.trim().replace(/^U\+/i, ''))
		.filter(Boolean)
		.map((part) => {
			const [lo, hi] = part.split('-');
			return [parseInt(lo, 16), parseInt(hi ?? lo, 16)] as [number, number];
		});
}

const RANGES = dropCapRanges();
const covered = (cp: number) => RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);

/*
 * The strings the fixtures actually hand to `splitDropCap` — which is a much
 * narrower set than "every block". A drop cap is only ever set on the FIRST
 * block of a chapter or section (see the three routes that set a drop cap), so
 * walking every `text` field instead sweeps up mid-chapter verses that open
 * lowercase and demands the subset carry a-z it will never render.
 */
function dropCapPositions(): string[] {
	const root = fileURLToPath(new URL('./fixtures', import.meta.url));
	const out: string[] = [];

	const eachJson = (dir: string, fn: (data: unknown, file: string) => void) => {
		for (const entry of readdirSync(dir)) {
			const p = join(dir, entry);
			if (statSync(p).isDirectory()) eachJson(p, fn);
			else if (entry.endsWith('.json')) fn(JSON.parse(readFileSync(p, 'utf8')), p);
		}
	};

	eachJson(root, (data, file) => {
		// Bible: the reader drop-caps verse 1 of every chapter.
		if (file.includes('/books/')) {
			const chapters = (data as { chapters?: Array<{ verses?: Array<{ text?: string }> }> })
				.chapters;
			for (const ch of chapters ?? []) {
				const first = ch.verses?.[0]?.text;
				if (first) out.push(first);
			}
		}
		// CCC / Compendium: the chapter view drop-caps the opening block of the
		// first paragraph it renders.
		if (file.endsWith('paragraphs.json')) {
			const paras = data as Array<{ blocks?: Array<{ text_marked?: string; text?: string }> }>;
			for (const p of paras ?? []) {
				const first = p.blocks?.[0];
				const text = first?.text_marked ?? first?.text;
				if (text) out.push(text);
			}
		}
	});

	return out;
}

describe('splitDropCap', () => {
	it('promotes a single opening letter', () => {
		expect(splitDropCap('In the beginning')).toEqual({
			lead: '',
			first: 'I',
			rest: 'n the beginning'
		});
	});

	it('sets opening punctuation beside the cap rather than inside it', () => {
		// The mark leads into the initial at body size; the initial is the
		// letter alone. Setting `“A` in the display face put a 4.98em quotation
		// mark where the ornament should be — see the module docblock.
		expect(splitDropCap('“And the Lord said')).toEqual({
			lead: '“',
			first: 'A',
			rest: 'nd the Lord said'
		});
		expect(splitDropCap('«Ninguém pode dizer')).toEqual({
			lead: '«',
			first: 'N',
			rest: 'inguém pode dizer'
		});
	});

	it('keeps the source’s own spacing inside the lead', () => {
		// encyclical.pt spaces its guillemets: "« Caritas in veritate »". The
		// space is the corpus's, so it stays in the lead (where it collapses
		// against the cap) rather than being quietly dropped.
		expect(splitDropCap('« Caritas in veritate »')).toEqual({
			lead: '« ',
			first: 'C',
			rest: 'aritas in veritate »'
		});
	});

	it('trims leading whitespace rather than capping it', () => {
		expect(splitDropCap('   Therefore')).toEqual({ lead: '', first: 'T', rest: 'herefore' });
	});

	it('keeps a combining accent attached to its base letter', () => {
		// Decomposed "Ó" (O + U+0301). Slicing at index 1 would strand the
		// accent in the cap and render a bare diacritic.
		const decomposed = 'Ótimo';
		const { first, rest } = splitDropCap(decomposed);
		expect(first.normalize('NFC')).toBe('Ó');
		expect(rest).toBe('timo');
	});

	it('handles a precomposed accented capital', () => {
		expect(splitDropCap('Édito')).toEqual({ lead: '', first: 'É', rest: 'dito' });
	});

	it('stops taking punctuation before it pushes the cap off the margin', () => {
		// Bounded at three punctuation units, so a run of dashes and quotes
		// can't drive the initial arbitrarily far into the line.
		const { lead } = splitDropCap('«—— \"Assim');
		expect(lead.length).toBeLessThanOrEqual(3);
	});

	it('declines to cap a digit', () => {
		// Real openings, from Sacrosanctum Concilium and Christus Dominus. A
		// five-em blackletter "1" reads as a list numeral set by mistake.
		for (const text of ['1. Regulation of the sacred liturgy', '1) Conferência episcopal']) {
			expect(splitDropCap(text)).toEqual({ lead: '', first: '', rest: text });
		}
	});

	it('declines to cap a lowercase letter, without altering it', () => {
		// "(a) To bishops" is a legitimate list label; "o Senhor falou a Moisés"
		// (Exod 14:1, matos-soares) is a transcription defect. Both render as
		// the corpus has them, just without an initial — the module docblock
		// explains why suppressing the cap is not the same as uppercasing it.
		for (const text of ['(a) To bishops, as successors', 'o Senhor falou a Moisés']) {
			const split = splitDropCap(text);
			expect(split).toEqual({ lead: '', first: '', rest: text });
			expect(split.rest).toBe(text);
		}
	});

	it('degrades to no cap for empty or punctuation-only text', () => {
		expect(splitDropCap('')).toEqual({ lead: '', first: '', rest: '' });
		expect(splitDropCap('...')).toEqual({ lead: '', first: '', rest: '...' });
		// 126 PT CCC paragraphs used to open on a stray "." left behind by the
		// paragraph-number markup (fixed in pipeline/scrapers/ccc/ccc.py). The
		// degradation that covered for it stays covered.
		expect(splitDropCap('. O homem: Com a sua abertura')).toEqual({
			lead: '',
			first: '',
			rest: '. O homem: Com a sua abertura'
		});
	});

	it('leaves the original text recoverable by concatenation', () => {
		// The rendered output is `lead + first + rest`; if that isn't the input
		// (modulo the deliberate leading-whitespace trim), the reader loses
		// characters — the one thing a presentation-layer split must never do.
		for (const text of ['In the beginning', '“And', 'Ódio', 'A', '¿Quién', '« Caritas »']) {
			const { lead, first, rest } = splitDropCap(text);
			expect(lead + first + rest).toBe(text.trimStart());
		}
	});
});

describe('drop-cap font coverage', () => {
	it('parses a non-trivial unicode-range out of app.css', () => {
		// Guards the guard: a regex that silently matched nothing would make
		// every assertion below vacuously pass.
		expect(RANGES.length).toBeGreaterThan(5);
		expect(covered('A'.codePointAt(0)!)).toBe(true);
		expect(covered('一'.codePointAt(0)!)).toBe(false);
	});

	it('covers every character a fixture drop-cap position can promote', () => {
		const positions = dropCapPositions();
		// Without this the assertion below passes vacuously if the fixture shape
		// ever changes and the walk stops finding anything.
		expect(positions.length).toBeGreaterThan(20);

		const uncovered = new Map<string, string>();
		for (const text of positions) {
			const { first } = splitDropCap(text);
			for (const ch of first) {
				// Combining marks compose onto the base letter and are not
				// separately rendered, so they need no glyph of their own.
				if (/\p{M}/u.test(ch)) continue;
				if (!covered(ch.codePointAt(0)!)) uncovered.set(ch, text.slice(0, 40));
			}
		}
		expect(Object.fromEntries(uncovered)).toEqual({});
	});

	it('covers the openings the real corpus is known to contain', () => {
		// Regression cases from a scan of corpus/works, which the fixtures are
		// too small to exercise.
		for (const text of ['«Assim', '“And', 'Ódio', '(Em seguida) levantei', '- ACÇÃO DA IGREJA']) {
			const { first } = splitDropCap(text);
			expect(first.length).toBeGreaterThan(0);
			expect({ char: first, covered: covered(first.codePointAt(0)!) }).toEqual({
				char: first,
				covered: true
			});
		}
	});

	it('covers the whole Latin-1 uppercase block, not just today’s accents', () => {
		// The corpus exhibits only ÀÁÂÉÓÚ today, but a newly-parsed work opening
		// on Ç or Ñ must not be the thing that discovers the subset is too tight.
		for (let cp = 0x00c0; cp <= 0x00de; cp++) {
			if (cp === 0x00d7) continue; // ×, a multiplication sign, not a letter
			expect({ char: String.fromCodePoint(cp), covered: covered(cp) }).toEqual({
				char: String.fromCodePoint(cp),
				covered: true
			});
		}
	});
});
