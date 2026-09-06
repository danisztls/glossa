import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * A SOURCE SCAN OVER THE PIGMENTS, because every way this family breaks is
 * silent.
 *
 * `tokens.css` declares TWO tokens per shelf of the corpus and derives the
 * second from the first. `--shelf-*` is the literal — a colour somebody would
 * name out loud, written per theme family because a colour's name lives at a
 * particular lightness. `--pigment-*` is that literal mixed halfway to the
 * theme's own `--color-text-muted`, which is a dot's ornament sitting in one
 * tonal band. `/schola`'s shelf icons take the first, `CitedBy`'s panel marks
 * take the second, and each page maps its own vocabulary onto them with a block
 * of attribute selectors — the panel's keys are citer families and the guide's
 * are its own row keys.
 *
 * WHAT CAN GO WRONG WITHOUT A SYMPTOM:
 *
 * - **A token referenced by a name that does not exist.**
 *   `var(--pigment-vermilion)` with no such custom property is not an error;
 *   the declaration is invalid at computed-value time, so the mark falls back
 *   to whatever the `var()` names — or, with no fallback, to the inherited
 *   colour. One grey icon among seven coloured ones reads as a design choice.
 *   This is not hypothetical: `/schola` shipped a parallel family keyed by
 *   pigment NAME (`--pigment-azurite`, `--pigment-folium`) for one commit, and
 *   converging the two is what this file was written for.
 * - **A shelf that gains a colour in one family and not another.** The literals
 *   are per-family and the mixes are not, so a `--shelf-*` written into `:root`
 *   and forgotten in the dark block inherits the light value: a #2e7d32 green
 *   on a #161313 ground is 2.4:1, and only in dark.
 * - **A pigment that survives monochrome.** That mode's whole claim is that
 *   nothing anywhere is told apart by hue. One live pigment falsifies it, for
 *   exactly the readers it exists for. The dial is one declaration, and so is
 *   the way to lose it.
 * - **A pigment that stops being derived.** Writing a `--pigment-*` as its own
 *   literal is how a shelf comes to be two colours: the dot and the icon drift,
 *   and nothing says so because each looks fine alone.
 *
 * What is not bookkeeping is where either may be SET. The pigments resolve to a
 * decoration's contrast and not a text colour's; the shelf colours clear the
 * 3:1 graphical-object floor and no more. Both are arithmetic, measured once,
 * and argued beside the values.
 */
const TOKENS = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const SRC = fileURLToPath(new URL('..', import.meta.url));

/** The mixed pigments, in declaration order. `--pigment-strength` is the dial
 *  they are mixed with and `--pigment` is what a consumer resolves one into;
 *  neither is a pigment, and the `color-mix(` anchor is what excludes them. */
function declared(): string[] {
	return Array.from(TOKENS.matchAll(/^\t--pigment-([a-z-]+): color-mix\(/gm), (m) => m[1]);
}

/** Every `--shelf-<name>` set inside one block of the file. */
function shelvesIn(block: string): Set<string> {
	return new Set(Array.from(block.matchAll(/--shelf-([a-z-]+)\s*:/g), (m) => m[1]));
}

function block(afterSelector: string): string {
	const at = TOKENS.indexOf(afterSelector);
	expect(at, `no block matching ${afterSelector}`).toBeGreaterThan(-1);
	const open = TOKENS.indexOf('{', at);
	return TOKENS.slice(open, TOKENS.indexOf('\n}', open));
}

/** CSS and HTML comments both, since a `.svelte` file carries either. */
function stripComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return walk(path);
		return entry.name.endsWith('.svelte') || entry.name.endsWith('.css') ? [path] : [];
	});
}

describe('the shelf pigments', () => {
	const pigments = declared();

	it('is one seed per shelf, and the Compendium is not one of them', () => {
		// It wears the Catechism's, being the same teaching abridged — the
		// pairing `catechismPairLang` makes everywhere else in the codebase.
		expect(pigments).toEqual([
			'bible',
			'catechism',
			'magisterium',
			'social-doctrine',
			'canon-law',
			'doctors',
			'prayer',
			'commentary'
		]);
	});

	it('mixes every one toward the theme’s own muted grey, which is what serves four palettes at once', () => {
		for (const pigment of pigments) {
			const at = TOKENS.indexOf(`--pigment-${pigment}: color-mix(`);
			const decl = TOKENS.slice(at, TOKENS.indexOf(');', at));
			expect(decl, `--pigment-${pigment} does not follow the theme`).toContain(
				'var(--color-text-muted)'
			);
			expect(decl, `--pigment-${pigment} does not read the dial`).toContain(
				'var(--pigment-strength)'
			);
			// `oklab` and not sRGB: the sRGB path from a blue seed to a warm
			// grey runs through a violet half of these would land in.
			expect(decl, `--pigment-${pigment} interpolates in the wrong space`).toContain('in oklab');
		}
	});

	it('is mixed from a shelf colour rather than from a literal of its own', () => {
		for (const pigment of pigments) {
			const at = TOKENS.indexOf(`--pigment-${pigment}: color-mix(`);
			expect(
				TOKENS.slice(at, TOKENS.indexOf(');', at)),
				`--pigment-${pigment} carries its own literal, so the dot and the icon can drift`
			).toContain(`var(--shelf-${pigment})`);
		}
	});

	it('has a shelf colour per pigment, in every family that paints one', () => {
		const light = shelvesIn(block('\n:root {'));
		expect([...light].sort()).toEqual([...pigments].sort());
		for (const [name, selector] of [
			['auto dark', ":root:not([data-theme='light']) {"],
			['explicit dark', ":root[data-theme='dark'] {"],
			['monochrome', ':root[data-mono] {']
		] as const) {
			expect([...shelvesIn(block(selector))].sort(), `${name} is missing a shelf`).toEqual(
				[...light].sort()
			);
		}
	});

	/* Sepia restates none on purpose: a warmer paper is still paper, and each
	   clears its floor against that ground as written. */
	it('leaves sepia and OLED to inherit, both being a ground and not a palette', () => {
		expect(shelvesIn(block(':root[data-sepia] {')).size).toBe(0);
		expect(shelvesIn(block(":root[data-theme='dark'][data-oled] {")).size).toBe(0);
	});

	it('is turned off in full by one dial under monochrome', () => {
		const at = TOKENS.indexOf(':root[data-mono] {');
		expect(at, 'no [data-mono] rule sets the dial').toBeGreaterThan(-1);
		expect(TOKENS.slice(at, TOKENS.indexOf('\n}', at))).toContain('--pigment-strength: 0%;');
	});

	/*
	 * `--pigment-strength` is a dial and a consumer may turn it up — `/schola`
	 * runs at 85%, because a 1.35rem icon standing alone in a row has to read
	 * as a colour where a 0.4em dot in a column of dots is read against its
	 * neighbours. But `data-mono` sets the dial to 0% ON THE ROOT, so an
	 * override anywhere below beats it, and the one mode whose entire contract
	 * is "nothing anywhere is told apart by hue" would keep its colours on that
	 * page. Nothing renders under vitest, so the only witness is this scan.
	 */
	it('lets a consumer turn the dial up only outside monochrome', () => {
		for (const file of walk(SRC)) {
			if (file.endsWith('tokens.css')) continue;
			// Comments go first, over the WHOLE file rather than per slice: the
			// paragraphs explaining this gate quote the declaration verbatim, and
			// a slice that starts inside one leaves it unterminated and unstripped.
			const source = stripComments(readFileSync(file, 'utf8'));
			for (const m of source.matchAll(/--pigment-strength:\s*(\d+)%/g)) {
				const rule = source.slice(source.lastIndexOf('}', m.index), m.index);
				expect(
					rule,
					`${file} sets --pigment-strength: ${m[1]}% without excluding [data-mono]`
				).toContain(':not([data-mono])');
			}
		}
	});

	/*
	 * `--pigment-strength: 0%` cannot reach the literals, because they are not
	 * mixes. The mode has to restate them, and if it ever stops, `/schola`'s
	 * icons keep their colours in the one mode whose entire contract is that
	 * nothing anywhere is told apart by hue.
	 */
	it('takes the shelf literals back to the muted grey under monochrome', () => {
		const mono = block(':root[data-mono] {');
		for (const shelf of pigments) {
			expect(mono, `--shelf-${shelf} stays coloured under [data-mono]`).toContain(
				`--shelf-${shelf}: var(--color-text-muted);`
			);
		}
	});

	it('is never referenced by a name it does not have', () => {
		const used = new Set<string>();
		for (const file of walk(SRC)) {
			if (file.endsWith('tokens.css')) continue;
			for (const m of readFileSync(file, 'utf8').matchAll(/var\(--pigment-([a-z-]+)/g)) {
				used.add(m[1]);
			}
		}
		// `--pigment` bare is what a consumer resolves a token into and
		// `strength` is the dial. Neither is a pigment.
		const known = new Set([...pigments, 'strength']);
		expect([...used].filter((name) => !known.has(name)).sort()).toEqual([]);
	});

	it('is resolved by each consumer into a per-row property of its own', () => {
		// `SRC` is `src/`, so both are named from there. The panel resolves a
		// muted mix per SHELF, which is an identity; the guide resolves the
		// ordered ramp on its reading cards, which is variety and claims
		// nothing. That difference is the whole reason both families exist.
		expect(
			readFileSync(join(SRC, 'lib/components/CitedBy.svelte'), 'utf8'),
			'the panel sets no --pigment'
		).toMatch(/--pigment:\s*var\(--pigment-/);
		expect(
			readFileSync(join(SRC, 'routes/schola/+page.svelte'), 'utf8'),
			'the guide sets no --shelf'
		).toMatch(/--shelf:\s*var\(--hue-/);
	});

	/*
	 * The guide names no `--shelf-*` at all any more: its rows are one accent,
	 * and a work's identity colour is the panel's business. Asserted because
	 * the tokens are still there and reaching for one is a one-line change that
	 * would put a colour on this page claiming something.
	 */
	it('never lets the guide claim a shelf colour, which is the panel\u2019s to make', () => {
		const guide = stripComments(readFileSync(join(SRC, 'routes/schola/+page.svelte'), 'utf8'));
		expect(guide, 'the guide names a --shelf-* in a declaration').not.toMatch(/var\(--shelf-/);
	});

	/*
	 * THE ONE THAT ACTUALLY BIT, and it cost three rounds of palette work.
	 * `.book-icon { color: var(--shelf) }` sat above a
	 * `.feature-icon, .book-icon { … color: var(--color-accent) }` — same
	 * specificity, later wins — so every shelf icon was the house red at rest
	 * and took its colour only from the `:hover` rule one class higher. The
	 * feature was inverted, nothing errored, `svelte-check` saw two live
	 * selectors, and every judgement of the colours was made against a hover
	 * state because that was the only place they appeared.
	 *
	 * The invariant that prevents it: **a rule that sizes both kinds of icon
	 * may not colour either.** Colour is stated per kind, after.
	 */
	it('keeps colour out of the rule that sizes both kinds of icon', () => {
		const guide = readFileSync(join(SRC, 'routes/schola/+page.svelte'), 'utf8');
		for (const m of stripComments(guide).matchAll(/\.feature-icon,\s*\.book-icon\s*\{([^}]*)\}/g)) {
			expect(
				m[1],
				'the shared icon rule sets a colour, which overrides every per-shelf one below it'
			).not.toMatch(/(^|[\s;])color\s*:/);
		}
	});

	/*
	 * The ordered ramp is ALIASES, and that is what makes it free. Each
	 * `--hue-N` points at a `--shelf-*`, so it follows every theme family and
	 * `[data-mono]` flattens all of them through the values they point at. A
	 * literal written into one would be a colour outside the palette: right on
	 * paper, wrong on a dark ground, and still coloured in the mode whose whole
	 * contract is that nothing is told apart by hue.
	 */
	it('is an ordered alias of the shelf colours, never a set of literals', () => {
		const ramp = Array.from(TOKENS.matchAll(/^\t--hue-(\d+): ([^;]+);/gm));
		expect(ramp.length, 'no --hue-* ramp').toBe(pigments.length);
		expect(ramp.map((m) => Number(m[1]))).toEqual(pigments.map((_, i) => i + 1));
		const pointed = new Set<string>();
		for (const [, n, value] of ramp) {
			const at = /^var\(--shelf-([a-z-]+)\)$/.exec(value.trim());
			expect(at, `--hue-${n} is ${value.trim()} rather than a --shelf-* alias`).not.toBeNull();
			pointed.add(at![1]);
		}
		// Every shelf exactly once, so the ramp is a permutation and no colour
		// is unreachable through it.
		expect([...pointed].sort()).toEqual([...pigments].sort());
	});

	it('never lets the guide reach for the muted mix, which is the drift to watch', () => {
		const guide = stripComments(readFileSync(join(SRC, 'routes/schola/+page.svelte'), 'utf8'));
		expect(guide, 'the guide names a --pigment-* in a declaration').not.toMatch(/var\(--pigment-/);
	});
});
