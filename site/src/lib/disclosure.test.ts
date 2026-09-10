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
