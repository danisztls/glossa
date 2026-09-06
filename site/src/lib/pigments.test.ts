import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * A SOURCE SCAN OVER THE PIGMENTS, because every way this family breaks is
 * silent.
 *
 * `tokens.css` declares one `--pigment-*` per shelf of the corpus, each mixed
 * halfway to that theme's `--color-text-muted`, and `[data-mono]` turns the
 * whole set off with a single `--pigment-strength: 0%`. Two pages spend them —
 * `CitedBy`'s panel dots and `/schola`'s shelf list — and each maps its own
 * vocabulary onto the tokens with a block of attribute selectors, because the
 * panel's keys are citer families and the guide's are its own row keys.
 *
 * WHAT CAN GO WRONG WITHOUT A SYMPTOM:
 *
 * - **A pigment referenced by a name that does not exist.**
 *   `var(--pigment-vermilion)` with no such custom property is not an error;
 *   the declaration is invalid at computed-value time, so the mark falls back
 *   to whatever the `var()` names — or, with no fallback, to the inherited
 *   colour. One grey icon among seven coloured ones reads as a design choice.
 *   This is not hypothetical: `/schola` shipped a parallel family keyed by
 *   pigment NAME (`--pigment-azurite`, `--pigment-folium`) for one commit, and
 *   converging the two is what this file was written for.
 * - **A pigment that survives monochrome.** That mode's whole claim is that
 *   nothing anywhere is told apart by hue. One live pigment falsifies it, for
 *   exactly the readers it exists for. The dial is one declaration, and so is
 *   the way to lose it.
 * - **A pigment that stops following the theme.** The family is one set of
 *   literals for four palettes, and what adapts is the MIX. A value written
 *   flat would look right on paper and ship a contrast failure in dark alone.
 *
 * What is not bookkeeping is where a pigment may be SET — they resolve to
 * 3.4-4.2:1 on a dark ground, which is a decoration's contrast and not a text
 * colour's. That is arithmetic, and it is argued beside the values.
 */
const TOKENS = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const SRC = fileURLToPath(new URL('..', import.meta.url));

/** The seeded pigments, in declaration order. `--pigment-strength` is the dial
 *  they are mixed with and `--pigment` is what a consumer resolves one into;
 *  neither is a pigment, and the `color-mix(` anchor is what excludes them. */
function declared(): string[] {
	return Array.from(TOKENS.matchAll(/^\t--pigment-([a-z-]+): color-mix\(/gm), (m) => m[1]);
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
			const source = readFileSync(file, 'utf8');
			for (const m of source.matchAll(/--pigment-strength:\s*(\d+)%/g)) {
				// Comments stripped first: the paragraph ABOVE this very rule
				// explains the gate, and matching prose would pass every time.
				const rule = source
					.slice(source.lastIndexOf('}', m.index), m.index)
					.replace(/\/\*[\s\S]*?\*\//g, '');
				expect(
					rule,
					`${file} sets --pigment-strength: ${m[1]}% without excluding [data-mono]`
				).toContain(':not([data-mono])');
			}
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
		const known = new Set([...pigments, 'strength']);
		expect([...used].filter((name) => !known.has(name)).sort()).toEqual([]);
	});

	it('is resolved by both consumers into the same per-row property', () => {
		// `SRC` is `src/`, so both are named from there.
		for (const consumer of ['lib/components/CitedBy.svelte', 'routes/schola/+page.svelte']) {
			expect(readFileSync(join(SRC, consumer), 'utf8'), `${consumer} sets no --pigment`).toMatch(
				/--pigment:\s*var\(--pigment-/
			);
		}
	});
});
