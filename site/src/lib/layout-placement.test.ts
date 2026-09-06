import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * A SOURCE SCAN, because a mis-placed grid child renders perfectly.
 *
 * `styles/layout.css` builds `.reading-layout` as a grid and places its
 * children BY CLASS — `.content-column` in track 2, `.landing-column` in
 * track 1 of the `.index` variant, the asides in the last track of each. A
 * column class the grid does not name is not an error: it is auto-placed, into
 * whichever track the cursor is on, and the page still paints.
 *
 * That is how `/documenta` shipped for a day with `.landing-column` inside a
 * plain `.reading-layout`: the whole Magisterium index was set in the
 * apparatus lane, 344px wide, with the 56rem reading track empty beside it.
 * Nothing threw, `svelte-check` had nothing to check, and the site has no
 * visual regression suite — the only witness was a screenshot.
 *
 * So the invariant is asserted about the source text, the same move
 * `corpus-derivations.test.ts` and `sw-policy.test.ts` make. It reads only
 * `class="…"` ATTRIBUTES, which is what lets the routes go on discussing
 * `.landing-column` and `.reading-layout` in their docblocks — three of them
 * do, at length — without tripping it.
 */
const ROUTES = fileURLToPath(new URL('../routes', import.meta.url));
const LAYOUT_CSS = readFileSync(new URL('../styles/layout.css', import.meta.url), 'utf8');

/** The column classes `layout.css` places explicitly, and the variant of
 *  `.reading-layout` that places each. */
const PLACED_BY = { 'content-column': 'plain', 'landing-column': 'index' } as const;

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return walk(path);
		return entry.name.endsWith('.svelte') ? [path] : [];
	});
}

/** Every `class="…"` attribute's value. Deliberately not a parse: an attribute
 *  is the one place a class name is a class name rather than prose about one. */
function classAttributes(source: string): string[] {
	return [...source.matchAll(/class="([^"]*)"/g)].map((match) => match[1]);
}

const files = walk(ROUTES).map((path) => ({
	path: path.slice(ROUTES.length + 1),
	attributes: classAttributes(readFileSync(path, 'utf8'))
}));

describe('reading-layout column placement', () => {
	it('finds the routes to check', () => {
		// A guard on the guard: a rename under `src/routes/` that emptied this
		// list would leave every assertion below vacuously true.
		const grids = files.filter((file) =>
			file.attributes.some((value) => value.split(/\s+/).includes('reading-layout'))
		);
		expect(grids.length).toBeGreaterThan(10);
	});

	it.each(files)('$path places every column it uses', ({ attributes }) => {
		const classes = attributes.map((value) => value.split(/\s+/));
		const wrapper = classes.find((names) => names.includes('reading-layout'));
		if (!wrapper) {
			// No grid, no placement to get wrong: `.landing-column` on its own is
			// a centred block and needs nothing from `layout.css` but a width.
			return;
		}
		const variant = wrapper.includes('index') ? 'index' : 'plain';
		for (const [column, placedBy] of Object.entries(PLACED_BY)) {
			if (!classes.some((names) => names.includes(column))) continue;
			expect(
				variant,
				`${column} inside .reading-layout is placed only by the "${placedBy}" variant — ` +
					`in any other it is auto-placed, into the apparatus lane`
			).toBe(placedBy);
		}
	});

	it('layout.css still places both columns', () => {
		// The invariant above is only worth anything while the rules it names
		// exist; deleting one would make every route above wrong at once.
		expect(LAYOUT_CSS).toMatch(/\.reading-layout > \.content-column \{[^}]*grid-column: 2;/);
		expect(LAYOUT_CSS).toMatch(/\.reading-layout\.index > \.landing-column \{[^}]*grid-column: 1;/);
		expect(LAYOUT_CSS).toMatch(/\.reading-layout\.index > \.index-aside \{[^}]*grid-column: 2;/);
	});
});
