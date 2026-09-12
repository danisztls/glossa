import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * EVERY `<details>` ON THE SITE DRAWS ONE DISCLOSURE, and this is what says so.
 *
 * Nine surfaces open one, and before `.fold` (styles/components.css) they had
 * arrived at three different marks: a chevron at the row's end, a `▸` glyph at
 * its start, and the browser's own triangle on the ones nobody had reached.
 * Each was reasonable where it was written and the set was not, because a
 * reader learns what a mark means once.
 *
 * SCANNED FROM THE SOURCE rather than asserted in a component test, for the
 * reason `layout-placement.test.ts` gives about the grid: there is no component
 * harness here, and the failure is invisible in every other check — a
 * `<details>` without the class renders perfectly, with the browser's triangle,
 * which is exactly what it looked like before anybody minded.
 */

const SRC = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return walk(path);
		return entry.name.endsWith('.svelte') ? [path] : [];
	});
}

/** Opening `<details>` tags, and only the ones that are markup. A docblock
 *  that mentions the element in prose ("`<details>` and not a component") is
 *  not one, so the tag has to open its own line — which is how every one of
 *  them is actually written, prettier having formatted them all. */
function detailsTags(source: string): string[] {
	return [...source.matchAll(/^[\t ]*<details\b[^>]*>/gm)].map((match) => match[0]);
}

const files = walk(SRC)
	.map((path) => ({
		path: path.slice(SRC.length + 1),
		tags: detailsTags(readFileSync(path, 'utf8'))
	}))
	.filter((file) => file.tags.length > 0);

describe('the site has one accordion', () => {
	it('finds the disclosures to check', () => {
		// A guard on the guard: a refactor that renamed the element out of every
		// file would leave the assertion below vacuously true.
		expect(files.flatMap((file) => file.tags).length).toBeGreaterThan(8);
	});

	it.each(files)('$path opens every <details> with .fold', ({ tags }) => {
		for (const tag of tags) {
			expect(tag, `${tag} — the mark, the reset and the tap target are .fold`).toMatch(
				/class="[^"]*\bfold\b/
			);
		}
	});
});

/**
 * AND NONE OF THEM STATES A `color` ON ITS SUMMARY, which is a rule about the
 * CASCADE rather than about taste.
 *
 * `.fold > summary:hover` (styles/components.css) is (0,2,1). A scoped
 * `.cited-in-fold > summary` compiles to exactly (0,2,1) as well — Svelte 5
 * puts the scoping hash in `:where()` on every compound but the first — so the
 * two tie, and a component's stylesheet is loaded after the global one, which
 * hands the tie to the resting colour. Five surfaces were written that way in
 * one commit and four stopped answering hover and focus, silently.
 *
 * So a surface declares `--fold-ink` on its own element and the shared rule
 * sets that property on the summary: a declaration on the element beats a
 * value inherited into it whatever the specificity and whatever the order. The
 * one spelling still allowed is `color: inherit`, which is how a heading inside
 * the row follows the surface rather than pinning a colour of its own.
 *
 * NOTHING ELSE CAN SEE THIS. The page renders, the colour is the one the
 * surface asked for, and the only symptom is a row that does not light.
 */
function summaryColourRules(source: string): string[] {
	const style = source.match(/<style[^>]*>([\s\S]*)<\/style>/)?.[1] ?? '';
	const css = style.replace(/\/\*[\s\S]*?\*\//g, '');
	const offenders: string[] = [];
	// `[^{}]` on both halves matches innermost rules only, so a rule nested in
	// an `@media` is found rather than swallowed along with its at-rule.
	for (const rule of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
		const selector = rule[1].trim().replace(/\s+/g, ' ');
		if (!/\bsummary\b/.test(selector) || selector.includes('::')) continue;
		// The lookahead spans the whitespace rather than sitting after it: with
		// `color\s*:\s*(?!inherit)` the `\s*` backtracks to nothing and the
		// lookahead then passes on the space, flagging `color: inherit`.
		if (/(^|[;{\s])color\s*:(?!\s*inherit\b)/.test(rule[2])) offenders.push(selector);
	}
	return offenders;
}

describe('a disclosure takes its ink from the surface', () => {
	const styled = walk(SRC)
		.map((path) => ({
			path: path.slice(SRC.length + 1),
			offenders: summaryColourRules(readFileSync(path, 'utf8'))
		}))
		.filter((file) => file.offenders.length > 0);

	it('no component states a colour on a summary', () => {
		expect(
			styled.map((file) => `${file.path}: ${file.offenders.join(', ')}`),
			'declare `--fold-ink` on the surface instead — components.css says why'
		).toEqual([]);
	});
});
