import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * THE READER'S TEXT FACE, AND THE FOUR NUMBERS THAT MOVE WITH IT.
 *
 * A face is not only a family. Switching it changes the measure
 * (`--prose-char-advance`, which `--content-width` is computed from) and the
 * illuminated initial's three sizes, which are derived from the face's cap
 * height, ascent and descent. `styles/dropcaps.css` spends two pages saying
 * why those derivations are delicate, and names the failure: the cap's float
 * box grows past its line budget and indents ONE MORE LINE than it should.
 * Nothing throws, nothing logs, and the page paints — the same shape as the
 * mis-placed grid child `layout-placement.test.ts` was written for.
 *
 * So this asserts the arithmetic rather than trusting the comments to stay
 * true of it: the scales are read out of the stylesheet, evaluated against
 * each face's tokens, and checked against the line budgets the file states.
 *
 * IT ALSO PINS THE SERIF TO WHAT IT WAS. The three scales were literals
 * (4.98 / 2.9 / 1.487) until the second face made them expressions. An
 * expression that returns something else for EB Garamond is a redesign of the
 * default reading page disguised as a refactor.
 */
const tokens = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const dropcaps = readFileSync(new URL('../styles/dropcaps.css', import.meta.url), 'utf8');
const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
const prefs = readFileSync(new URL('./prefs.svelte.ts', import.meta.url), 'utf8');

/** `.reading-text`'s leading, which every derivation below is against. Read
 *  from the stylesheet rather than restated, so a change to it fails here
 *  instead of quietly invalidating the budgets. */
const LEADING = Number(
	readFileSync(new URL('../styles/layout.css', import.meta.url), 'utf8')
		.split('.reading-text {')[1]
		.match(/line-height:\s*([\d.]+)/)![1]
);

/** The declarations inside one rule, by selector, as a flat map. Enough of a
 *  parser for a token block, and deliberately not more. */
function declarations(css: string, selector: string): Record<string, string> {
	const start = css.indexOf(`${selector} {`);
	expect(start, `${selector} is missing`).toBeGreaterThan(-1);
	const body = css.slice(start + selector.length + 2, css.indexOf('\n}', start));
	const out: Record<string, string> = {};
	for (const [, prop, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
		out[prop] = value.replace(/\s+/g, ' ').trim();
	}
	return out;
}

/** A `calc()` of numbers and `var()`s, evaluated. The expressions here carry
 *  no units and no nesting, which is what makes this three lines. */
function evaluate(expression: string, vars: Record<string, number>): number {
	const substituted = expression
		.replace(/^calc\(/, '(')
		.replace(/var\((--[\w-]+)\)/g, (_, name) => {
			expect(vars[name], `${name} is not a face token`).toBeTypeOf('number');
			return String(vars[name]);
		});
	return Function(`"use strict"; return (${substituted});`)();
}

const serif = declarations(tokens, ':root');
const sans = declarations(tokens, ":root[data-face='sans']");

const FACES = {
	serif: {
		'--text-ascent': Number(serif['--text-ascent']),
		'--text-descent': Number(serif['--text-descent']),
		'--text-cap-height': Number(serif['--text-cap-height']),
		'--prose-char-advance': Number(serif['--prose-char-advance'])
	},
	sans: {
		'--text-ascent': Number(sans['--text-ascent']),
		'--text-descent': Number(sans['--text-descent']),
		'--text-cap-height': Number(sans['--text-cap-height']),
		'--prose-char-advance': Number(sans['--prose-char-advance'])
	}
};

/** The three initials, each with the `line-height` that turns its font-size
 *  into a float box and the budget in body lines that box may not exceed.
 *  Both numbers are the stylesheet's; only the pairing is stated here. */
const INITIALS = [
	{ name: 'three-line cap', selector: '.drop-cap-letter', lines: 3, serifWas: 4.98 },
	{ name: 'versal', selector: '.drop-cap-letter.drop-cap-versal', lines: 1, serifWas: 1.487 },
	{ name: 'two-line cap (phone)', selector: '\t.drop-cap-letter', lines: 2, serifWas: 2.9 }
] as const;

function initial(selector: string) {
	const decls = declarations(dropcaps, selector);
	return {
		scale: decls['--drop-cap-scale'],
		lineHeight: Number(
			dropcaps.slice(dropcaps.indexOf(`${selector} {`)).match(/line-height:\s*([\d.]+)/)![1]
		)
	};
}

describe('the reader’s text face', () => {
	it('gives every face the four tokens the derivations read', () => {
		for (const [face, vars] of Object.entries(FACES)) {
			for (const [token, value] of Object.entries(vars)) {
				expect(value, `${face} ${token}`).toBeGreaterThan(0);
			}
		}
	});

	// The measure is a count of CHARACTERS, so a wider face takes a wider
	// column to hold the same 62.4 of them. This is the direction check, not
	// the value: the values are measured over the corpus and argued in
	// `tokens.css`, and a face narrower than the serif would be a surprise
	// worth failing on.
	it('measures the sans face wider per character than the serif', () => {
		expect(FACES.sans['--prose-char-advance']).toBeGreaterThan(FACES.serif['--prose-char-advance']);
	});

	// `--content-width` clamps at 56rem, so past some reading scale the column
	// stops holding 62.4 characters and starts holding fewer. That is allowed;
	// leaving the 55-65 band the measure exists to hold is not.
	it('keeps both faces inside the 55-65 character band at every step', () => {
		const base = 1.3;
		const cpl = 62.4;
		for (const [face, vars] of Object.entries(FACES)) {
			for (let scale = 0.8; scale <= 1.8001; scale += 0.1) {
				const advance = vars['--prose-char-advance'];
				const width = Math.min(cpl * advance * base * scale, 56);
				const actual = width / (advance * base * scale);
				expect(actual, `${face} at ${scale.toFixed(1)}`).toBeGreaterThanOrEqual(55);
				expect(actual, `${face} at ${scale.toFixed(1)}`).toBeLessThanOrEqual(65);
			}
		}
	});

	describe.each(INITIALS)('$name', ({ selector, lines, serifWas }) => {
		const { scale, lineHeight } = initial(selector);

		it('is still the size it was under the serif', () => {
			expect(evaluate(scale, FACES.serif)).toBeCloseTo(serifWas, 2);
		});

		// The one that renders wrong rather than erroring. Text wraps around
		// the float's margin box, so the box — font-size x line-height — is
		// what decides how many lines indent, and a box over budget indents
		// one line too many.
		it.each(Object.keys(FACES))('fits its line budget under the %s face', (face) => {
			const box = evaluate(scale, FACES[face as keyof typeof FACES]) * lineHeight;
			expect(box).toBeLessThan(lines * LEADING);
		});
	});

	/**
	 * The pre-hydration script in `app.html` is a second copy of the store's
	 * contract, written in ES5 inside a string, where no type checker reaches
	 * it. It exists because applying the face after hydration would reflow
	 * every line rather than merely repaint it — so the two drifting apart is
	 * a flash of the wrong measure on every load, for the readers who chose
	 * the setting and nobody else.
	 */
	it('applies the stored face before first paint, on the same contract', () => {
		expect(prefs).toContain("'glossa:face'");
		expect(appHtml).toContain("localStorage.getItem('glossa:face') === 'sans'");
		expect(appHtml).toContain("setAttribute('data-face', 'sans')");
		// The default is the ABSENT attribute, which is what lets a first-ever
		// visit be correct with no storage read at all. A script that also
		// wrote a serif value would be claiming a state the store never sets.
		expect(appHtml).not.toContain("'data-face', 'serif'");
	});
});
