import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * THE MANICULE AND THE FACE THAT CARRIES IT HAVE TO AGREE, which is the dagger
 * rule (`sidenotes.test.ts`) on a second pair of marks.
 *
 * Google's EB Garamond subsets carry neither U+261C nor U+261E in any of their
 * fourteen files, so `fonts.css` declares a 4.2 KB face over exactly those two
 * — and if the mark, the range and the family name ever come apart the hand
 * renders in whatever the reader's system offers for a pointing hand, which on
 * most of them is a colour emoji. Nothing else can see that: the page still
 * works, the build still passes, and the gutter has a cartoon in it.
 *
 * IT SCANS `components.css` AND NOT A ROUTE, since 2026-09-11. The rule was
 * `/quaestiones`'s own until `/preces` wanted the same mark; `.pointing-row`
 * is where it lives now, and the second assertion below is what that move
 * added — a surface that draws the hand in a scoped block of its own is the
 * copy this class exists to prevent, and two copies drift in exactly the
 * direction no reader can report.
 */

const SRC = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const COMPONENTS = 'styles/components.css';

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return walk(path);
		return /\.(svelte|css)$/.test(entry.name) ? [path] : [];
	});
}

/** A declaration setting one of the two hands as generated content. */
function manicules(source: string): string[] {
	return [...source.matchAll(/content: '(.)\\fe0e'/g)].map((match) => match[1]);
}

describe('the row that points', () => {
	const components = readFileSync(join(SRC, COMPONENTS), 'utf8');

	it('draws both hands in the shared class, each pointing into its own page', () => {
		expect(manicules(components).map((mark) => mark.codePointAt(0))).toEqual([0x261e, 0x261c]);
		expect(components).toContain("font-family: 'EB Garamond Manicule'");
	});

	it('asks for the face over exactly the two codepoints it draws', () => {
		const fonts = readFileSync(join(SRC, 'styles/fonts.css'), 'utf8');
		const face = fonts.slice(fonts.indexOf("font-family: 'EB Garamond Manicule'"));
		expect(face.slice(0, face.indexOf('}'))).toContain('unicode-range: U+261C, U+261E;');
	});

	it('is the only place on the site that draws one', () => {
		const elsewhere = walk(SRC)
			.map((path) => ({ path: path.slice(SRC.length + 1), source: readFileSync(path, 'utf8') }))
			.filter((file) => file.path !== COMPONENTS && manicules(file.source).length > 0)
			.map((file) => file.path);
		expect(elsewhere, '.pointing-row is the mark; a second copy of it will drift').toEqual([]);
	});
});
