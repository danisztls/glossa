import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FONT_SIZES } from './prefs.svelte';

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
		'--prose-char-advance': Number(serif['--prose-char-advance']),
		'--face-size-adjust': Number(serif['--face-size-adjust'])
	},
	sans: {
		'--text-ascent': Number(sans['--text-ascent']),
		'--text-descent': Number(sans['--text-descent']),
		'--text-cap-height': Number(sans['--text-cap-height']),
		'--prose-char-advance': Number(sans['--prose-char-advance']),
		'--face-size-adjust': Number(sans['--face-size-adjust'])
	}
};

/**
 * WHAT THE FACE ADJUSTMENT IS ALLOWED TO BE, which is a range and not a value.
 *
 * Two frequency-weighted measurements over the corpus bracket it, both taken
 * off the font files with fontTools at wght 400 and written here because a
 * test may not open a woff2 or walk the corpus: against EB Garamond, matching
 * Atkinson's mean ink HEIGHT gives 0.8946 and matching its mean ink AREA gives
 * 0.9295 as a linear scale.
 *
 * BOTH ARE DIVIDED BY THE FACE'S 93% `size-adjust` HERE, because that
 * descriptor has already spent part of the same adjustment and this token is
 * only what is left for the font-size to carry. Raw against rendered is the
 * one way to get these numbers wrong by a whole face.
 *
 * So this cannot assert a number — it asserts that the number stays inside
 * what was measured. Outside the bracket is not a judgement call: 1.0 is no
 * adjustment at all and the sans reads visibly large, and the x-height match
 * is the standard advice for pairing faces and is wrong for these two — EB
 * Garamond's small x-height comes with long extenders, so matching there
 * leaves its caps and ascenders 20% taller and the SERIF reading large. Both
 * of those shipped, one commit each, and were reported.
 */
const SIZE_ADJUST = 0.93;
const BRACKET = { byInkHeight: 0.8946 / SIZE_ADJUST, byInkArea: 0.9295 / SIZE_ADJUST };

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

	/**
	 * THE READING SIZE HAS TO MEAN THE SAME THING IN BOTH FACES, or the face
	 * picker is also a size control nobody asked for. `BRACKET` above holds
	 * why this checks a range: a single scalar can equalise two faces along
	 * one axis and these differ in shape, so the last few percent is an
	 * optical call and the measurements are what keep it honest.
	 */
	it('keeps the face adjustment inside what the two measurements bracket', () => {
		const adjust = FACES.sans['--face-size-adjust'];
		expect(adjust).toBeGreaterThanOrEqual(BRACKET.byInkHeight);
		expect(adjust).toBeLessThanOrEqual(BRACKET.byInkArea);
	});

	// The default face is the one every measurement is stated against, so its
	// adjustment is 1 by construction rather than by measurement. A value here
	// would mean the serif had been quietly resized to meet the sans.
	it('leaves the default face unadjusted', () => {
		expect(FACES.serif['--face-size-adjust']).toBe(1);
	});

	// `--content-width` clamps at 56rem, so past some reading scale the column
	// stops holding 62.4 characters and starts holding fewer. That is allowed;
	// leaving the 55-65 band the measure exists to hold is not.
	it('keeps both faces inside the 55-65 character band at every stop', () => {
		const base = 1.3;
		const cpl = 62.4;
		for (const [face, vars] of Object.entries(FACES)) {
			// The four the rail offers, read from the store rather than swept:
			// a scale nothing can select is not a measure anyone reads at, and
			// the ends of the range are what the band is tight against.
			for (const { scale } of FONT_SIZES) {
				// The rendered size carries the face adjustment, so the measure
				// has to as well or the column is sized for type the page is not
				// setting — which is the same mistake as measuring for the
				// other face, one step further in.
				const size = base * scale * vars['--face-size-adjust'];
				const advance = vars['--prose-char-advance'];
				const width = Math.min(cpl * advance * size, 56);
				const actual = width / (advance * size);
				expect(actual, `${face} at ${scale}`).toBeGreaterThanOrEqual(55);
				expect(actual, `${face} at ${scale}`).toBeLessThanOrEqual(65);
			}
		}
	});

	/**
	 * The adjustment has to reach the measure and the compare gutter, not just
	 * the font-size — a column measured for an unadjusted size is off by 17.7%
	 * in the sans, which is a whole face's worth of error and looks like a
	 * design choice rather than a bug.
	 */
	it('carries the face adjustment into everything measured against the type', () => {
		const layout = readFileSync(new URL('../styles/layout.css', import.meta.url), 'utf8');
		const from = layout.indexOf('.reading-text {');
		// To the rule's own close, not a fixed span: these rules carry more
		// comment than declaration, and a window sized to the code silently
		// stops covering it the moment somebody explains something.
		const rule = layout.slice(from, layout.indexOf('\n}', from));
		expect(rule, '.reading-text').toContain('var(--face-size-adjust, 1)');
		for (const token of ['--content-width', '--compare-gutter']) {
			const at = tokens.indexOf(`${token}:`);
			expect(tokens.slice(at, tokens.indexOf(';', at)), token).toContain(
				'var(--face-size-adjust, 1)'
			);
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

/**
 * A TOKEN THE MEASURE READS MAY ONLY BE SET WHERE THE MEASURE IS DECLARED.
 *
 * `--content-width` is a custom property whose value holds `var()`s, and those
 * are substituted for the element it is DECLARED on — descendants inherit the
 * result, not the expression. So a rule further down the tree that sets
 * `--measure-cpl` or `--prose-char-advance` changes nothing, and changes it
 * silently: the page paints, at the width the other script wanted.
 *
 * That is not hypothetical. `direction.css` measured the Traditional Chinese
 * edition at 0.9757em per character and set a 40-character target on the
 * reading region, and both were dead on arrival — the Han text was set in the
 * Latin column, 24.2 characters to the line, for as long as the edition has
 * been on the site. The comment beside them described the column they were
 * meant to produce, which is the only place that column ever existed.
 *
 * So this is a scan for the shape rather than for that instance: every
 * selector that sets either input must be one the width is declared for.
 * `styles/tokens.css` carries the argument; `routes/preces/[slug]` is the
 * same rule used deliberately, and sets neither of these two.
 */
/**
 * ARABIC IS NOT OFFERED THE SECOND FACE, and the two halves of that have to
 * stay together or the reader gets the worse of both.
 *
 * The preference is one per reader and the panel is one per page: choosing the
 * sans face anywhere carries `data-face='sans'` into every work afterwards. So
 * hiding the row without excluding the family switches Amiri out with nothing
 * on screen to say why, and excluding the family without hiding the row leaves
 * a control that does nothing. `styles/direction.css` argues it; this keeps
 * the halves in step.
 */
describe('the face Arabic is not offered', () => {
	const styles = ['layout.css', 'dropcaps.css'].map((name) => ({
		name,
		css: readFileSync(new URL(`../styles/${name}`, import.meta.url), 'utf8').replace(
			/\/\*[\s\S]*?\*\//g,
			''
		)
	}));

	it.each(styles)('excludes Arabic from the sans family rule in $name', ({ css }) => {
		const rules = [...css.matchAll(/([^{}@/;]*\[data-face='sans'\][^{}@/;]*)\{/g)].map((m) =>
			m[1].replace(/\s+/g, ' ').trim()
		);
		expect(rules.length).toBeGreaterThan(0);
		for (const rule of rules) {
			expect(rule, `${rule} would set an Arabic region in the sans face`).toContain(
				":not([lang='ar'])"
			);
		}
	});

	it('hides the face row over Arabic text', () => {
		const direction = readFileSync(new URL('../styles/direction.css', import.meta.url), 'utf8');
		expect(direction).toContain(":root:has(.reading-text[lang='ar']) .face-field");
		// The handle has to exist on the row, or the rule above hides nothing —
		// an unmatched class is not an error in CSS or in Svelte.
		const menu = readFileSync(new URL('./components/TypeMenu.svelte', import.meta.url), 'utf8');
		expect(menu).toContain('class="field face-field"');
	});
});

describe('the measure', () => {
	const STYLES = new URL('../styles/', import.meta.url);
	// Comments first, and not as tidiness: these files argue at length, a
	// selector may not contain `/`, and a `*/` two lines above a rule is
	// enough to make the rule invisible to the scan below.
	const sheets = ['tokens.css', 'direction.css', 'layout.css', 'compare.css'].map((name) => ({
		name,
		css: readFileSync(new URL(name, STYLES), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
	}));

	/** The selectors a declaration of `prop` appears under, as written. Rules
	 *  here are one selector list per `{`, which is what makes this a regex.
	 *
	 *  Unanchored, deliberately: a `\}` at the front would be CONSUMED by each
	 *  match and so could not also open the next one, which silently halves
	 *  the rules seen wherever two sit back to back — which is exactly where
	 *  the pair this checks now sits. `;` is excluded from the selector so a
	 *  capture cannot run backwards into the declaration above it. */
	function settersOf(css: string, prop: string): string[] {
		const out: string[] = [];
		for (const match of css.matchAll(/([^{}@/;]+?)\s*\{([^{}]*)\}/gs)) {
			if (new RegExp(`(^|;|\\s)${prop}\\s*:`).test(match[2])) {
				out.push(match[1].replace(/\s+/g, ' ').trim());
			}
		}
		return out;
	}

	/** One selector list into its selectors. Not `split(',')`: a comma inside
	 *  `:is(…)` or `:has(…)` groups arguments rather than ending a selector,
	 *  and cutting there invents selectors like `[lang='be']` that the file
	 *  never wrote — which reads exactly like the defect this checks for. */
	function selectors(list: string): string[] {
		const out: string[] = [];
		let depth = 0;
		let current = '';
		for (const ch of list) {
			if (ch === '(' || ch === '[') depth++;
			else if (ch === ')' || ch === ']') depth--;
			if (ch === ',' && depth === 0) {
				out.push(current.trim());
				current = '';
			} else current += ch;
		}
		if (current.trim()) out.push(current.trim());
		return out;
	}

	const declaresWidth = new Set(
		sheets.flatMap(({ css }) => settersOf(css, '--content-width').flatMap(selectors))
	);

	it('declares the width somewhere, on the document element at least', () => {
		expect(declaresWidth.has(':root')).toBe(true);
	});

	/**
	 * Whether `selector` can only ever match elements the width is declared
	 * for. Same selector qualifies, and so does one that REFINES it — a
	 * compound like `:root[data-face='sans']`, which is still the document
	 * element and so still substitutes into the `:root` declaration beside it.
	 *
	 * What must not qualify is a DESCENDANT of one, which is the whole bug:
	 * the remainder after the prefix may not begin with a combinator, because
	 * that is the point at which the selector stops naming the same box.
	 */
	function refines(selector: string, base: string): boolean {
		if (selector === base) return true;
		if (!selector.startsWith(base)) return false;
		return !/^[\s>+~]/.test(selector.slice(base.length));
	}

	it.each(['--measure-cpl', '--prose-char-advance'])(
		'sets %s only on an element the width is computed for',
		(prop) => {
			for (const { name, css } of sheets) {
				for (const selector of settersOf(css, prop)) {
					for (const one of selectors(selector)) {
						expect(
							[...declaresWidth].some((base) => refines(one, base)),
							`${name} sets ${prop} on \`${one}\`, which is not an element --content-width ` +
								`is declared for — the token will be inherited past, never read`
						).toBe(true);
					}
				}
			}
		}
	);
});
