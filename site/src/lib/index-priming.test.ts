import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { indexesForPath } from './index-priming';

/**
 * The mapping decides which per-work-type indexes a route waits for, and a miss
 * is a class of bug the test suite cannot otherwise reach: under fixtures
 * `USE_REAL_CORPUS` is false, so `requireIndex`'s guard is inert and an
 * unprimed read looks exactly like a corpus that does not hold the text. What
 * IS testable is the mapping itself, which is where the judgement lives.
 */
/** What `refs.ts`'s `refAddress` validates an address against before it will
 *  mint a link — the set every shelf that renders a citation owes on top of
 *  its own. */
const REFS = ['bible', 'summa', 'document'];

describe('indexesForPath', () => {
	it('gives each reading shelf its own index', () => {
		expect(indexesForPath('/scriptura/iosue/1')).toEqual(REFS);
		expect(indexesForPath('/documenta/lumen-gentium')).toEqual(REFS);
		expect(indexesForPath('/preces/rosarium')).toEqual([...REFS, 'prayer']);
		expect(indexesForPath('/doctores/summa/i/1')).toEqual(REFS);
	});

	it('gives every reading shelf the indexes a reference resolves against', () => {
		// The bug this was written for: `/doctrina-socialis/1` was listed as
		// needing nothing, because the Compendium of the Social Doctrine reads an
		// inlined registry for its own paragraphs — and then footnotes them with
		// Scripture, so `ProseBlocks`' `hrefFor` threw on the first citation.
		// Rendering a shelf's text and resolving what its text CITES are two
		// different questions, and this is the second one.
		for (const path of [
			'/scriptura/iosue/1',
			'/catechismus/1',
			'/documenta/lumen-gentium',
			'/preces/rosarium',
			'/doctores/summa/i/1',
			'/doctrina-socialis/1',
			'/doctrina-socialis/caput/1',
			'/ius-canonicum/748',
			'/ius-canonicum/titulus/1'
		]) {
			expect(indexesForPath(path)).toEqual(expect.arrayContaining(REFS));
		}
	});

	it('gives the Catechism and the Compendium to each other', () => {
		// `CatechismIndex.svelte` renders the pair, and `/catechismus/caput/{n}`
		// reads the Compendium's structure — so splitting them would be a fetch
		// saved on one route and a thrown error on the other.
		const pair = ['bible', 'ccc', 'compendium', 'summa', 'document'];
		expect(indexesForPath('/catechismus/1')).toEqual(pair);
		expect(indexesForPath('/catechismus/compendium/1')).toEqual(pair);
		expect(indexesForPath('/catechismus/caput/1')).toEqual(pair);
	});

	it('reads a language entry point as the shelf it points at', () => {
		// `/es/scriptura/iosue/1` is served and canonicalizes to the bare path
		// (site/CLAUDE.md, "A reading address takes a language prefix as an ENTRY
		// POINT"), so it must prime the same index.
		expect(indexesForPath('/es/scriptura/iosue/1')).toEqual(REFS);
		expect(indexesForPath('/pt/preces/rosarium')).toEqual([...REFS, 'prayer']);
	});

	it('gives the home page every shelf it renders', () => {
		// Five sections: a Bible chapter picker, the Catechism pair, the prayer
		// groups and the Magisterium's documents. Getting this wrong rendered the
		// Bible and Magisterium sections empty against a full corpus.
		const home = ['bible', 'ccc', 'compendium', 'document', 'prayer'];
		expect(indexesForPath('/')).toEqual(home);
		expect(indexesForPath('')).toEqual(home);
		// A bare language prefix IS the home page, so it takes the same set.
		expect(indexesForPath('/it')).toEqual(home);
	});

	it('asks for nothing on the one shelf that cites nothing', () => {
		// The colophon is the site's own writing about the corpus and names works
		// by title, so it resolves no reference and reads no registry.
		expect(indexesForPath('/colophon')).toEqual([]);
	});

	it('falls back to everything for a path it has never heard of', () => {
		// The permissive direction is the only one this may be wrong in: an
		// unknown path costs fetches, where a narrow guess costs a thrown error
		// on a route added without this table being updated.
		expect(indexesForPath('/something-new/1')).toHaveLength(6);
	});
});

/**
 * A SOURCE SCAN over the route tree, for the half of the mapping that is a fact
 * about components rather than a judgement about shelves.
 *
 * The table above was written by asking where each shelf's own text comes from,
 * which is the wrong half of the question: `/doctrina-socialis` reads an inlined
 * registry for its paragraphs and was therefore listed as needing nothing, while
 * every footnote on the page resolved a scripture citation through `refHref` and
 * threw. Whether a route resolves a reference is not a judgement — it is
 * reachability in the import graph, so it is checked rather than believed.
 *
 * `npm test` cannot catch the failure by RUNNING the routes: under fixtures
 * `USE_REAL_CORPUS` is false and `requireIndex` is inert (see the docblock at
 * the top of this file). The same move as `corpus-derivations.test.ts` and
 * `sw-policy.test.ts` — assert about the source text.
 */
describe('every route that resolves a reference is primed for one', () => {
	const SRC = new URL('..', import.meta.url);

	/** Every `.svelte` file under `src/`, by path relative to it. */
	function svelteFiles(dir: string): string[] {
		return readdirSync(new URL(dir, SRC), { withFileTypes: true }).flatMap((entry) => {
			const path = `${dir}${entry.name}`;
			if (entry.isDirectory()) return svelteFiles(`${path}/`);
			return entry.name.endsWith('.svelte') ? [path] : [];
		});
	}

	const source = new Map(
		[...svelteFiles('lib/components/'), ...svelteFiles('routes/')].map((path) => [
			path,
			readFileSync(new URL(path, SRC), 'utf8')
		])
	);

	/** The `.svelte` files a file imports, as keys of `source`. */
	function importsOf(path: string): string[] {
		const dir = path.slice(0, path.lastIndexOf('/') + 1);
		return [...source.get(path)!.matchAll(/from '([^']+\.svelte)'/g)]
			.map(([, spec]) =>
				spec.startsWith('$lib/')
					? spec.slice('$'.length)
					: new URL(spec, `file:///${dir}`).pathname.slice(1)
			)
			.filter((resolved) => source.has(resolved));
	}

	/** A component calls `refHref` itself, or renders one that does. `refHref`
	 *  is `refs.ts`'s single entry point for turning a reference into a link,
	 *  and it is what reads the three registries. */
	const resolvers = new Set(
		[...source].filter(([, text]) => /\brefHref\s*\(/.test(text)).map(([path]) => path)
	);
	for (let added = true; added;) {
		added = false;
		for (const path of source.keys()) {
			if (resolvers.has(path)) continue;
			if (!importsOf(path).some((dep) => resolvers.has(dep))) continue;
			resolvers.add(path);
			added = true;
		}
	}

	it('finds the components that resolve one', () => {
		// So the scan cannot pass by matching nothing — if `refHref` is renamed
		// or the callers move, this is what says so rather than a silent all-clear.
		expect(resolvers).toContain('lib/components/ProseBlocks.svelte');
		expect(resolvers).toContain('lib/components/RefText.svelte');
	});

	const pages = [...source.keys()].filter((path) => path.endsWith('/+page.svelte'));

	it.each(pages.filter((path) => resolvers.has(path)))('%s', (path) => {
		// `routes/doctrina-socialis/[n]/+page.svelte` -> `/doctrina-socialis/[n]`,
		// which `indexesForPath` reads for its first segment and nothing else.
		const url = path.slice('routes'.length, -'/+page.svelte'.length);
		expect(indexesForPath(url)).toEqual(expect.arrayContaining(['bible', 'summa', 'document']));
	});
});

/**
 * THE SECOND WAY A ROUTE READS AN UNPRIMED INDEX, and the one the scan above
 * cannot see: not through a citation, but by calling a `corpus.ts` reader
 * directly.
 *
 * `/schola` did (2026-09-04). It renders the Compendium of the Social
 * Doctrine's outline, resolves no reference at all, and so appears nowhere in
 * the `refHref` scan — it threw at every load under `npm run dev` on a
 * `requireIndex` in `buildDocumentOutline`. That guard was in the wrong place
 * and is gone, but the class is real: a page importing `documentOutline`,
 * `getCccStructure` or `summaQuestion` owes that index whether or not it ever
 * mints a link.
 *
 * SO THE REQUIREMENT IS READ OFF `corpus.ts` ITSELF. Each exported function
 * declares what it needs by calling `requireIndex`, and a function that calls
 * another inherits it — which is what makes this a check on the mapping rather
 * than a second copy of it. Regex over the source, like the scan above and for
 * the same reason: there is no other way to ask a question about which module
 * reaches which.
 *
 * IT ERRS TOWARD DEMANDING TOO MUCH, deliberately. The call detection is a
 * word match, so a name mentioned in a comment counts; the failure that
 * produces is a test asking for a primer that is not needed, which a person
 * reads and dismisses. The opposite error is a page that throws in dev and
 * renders empty in production.
 */
describe('every route that reads an index directly is primed for it', () => {
	const SRC = new URL('..', import.meta.url);
	const corpus = readFileSync(new URL('lib/corpus.ts', SRC), 'utf8');

	/** Exported function name -> its body, which runs to the next export. */
	const bodies = new Map<string, string>();
	const declarations = [...corpus.matchAll(/\nexport (?:async )?function ([A-Za-z0-9_]+)/g)];
	declarations.forEach((match, i) => {
		const next = declarations[i + 1];
		bodies.set(match[1], corpus.slice(match.index, next ? next.index : corpus.length));
	});

	/** Index names each exported function requires, its callees included. */
	const needs = new Map<string, Set<string>>(
		[...bodies].map(([name, body]) => [
			name,
			new Set([...body.matchAll(/requireIndex\('([a-z]+)'/g)].map(([, index]) => index))
		])
	);
	for (let changed = true; changed;) {
		changed = false;
		for (const [name, body] of bodies) {
			for (const callee of bodies.keys()) {
				if (callee === name || !new RegExp(`\\b${callee}\\s*\\(`).test(body)) continue;
				for (const index of needs.get(callee)!) {
					if (needs.get(name)!.has(index)) continue;
					needs.get(name)!.add(index);
					changed = true;
				}
			}
		}
	}

	it('finds the readers that declare a requirement', () => {
		// So the scan cannot pass by matching nothing — if `requireIndex` is
		// renamed or the readers move, this says so rather than going quiet.
		expect(needs.get('documentOutline')).toContain('document');
		expect(needs.get('getCccStructure')).toContain('ccc');
	});

	function pages(dir: string): string[] {
		return readdirSync(new URL(dir, SRC), { withFileTypes: true }).flatMap((entry) =>
			entry.isDirectory()
				? pages(`${dir}${entry.name}/`)
				: entry.name === '+page.svelte'
					? [`${dir}${entry.name}`]
					: []
		);
	}

	/** What a page imports from `$lib/corpus`, aliases resolved to the export. */
	function readersIn(text: string): string[] {
		return [...text.matchAll(/import\s*\{([^}]*)\}\s*from '\$lib\/corpus'/g)]
			.flatMap(([, names]) => names.split(','))
			.map((name) => name.trim().split(/\s+as\s+/)[0])
			.filter(Boolean);
	}

	it.each(pages('routes/'))('%s', (path) => {
		const wanted = new Set(
			readersIn(readFileSync(new URL(path, SRC), 'utf8')).flatMap((name) => [
				...(needs.get(name) ?? [])
			])
		);
		if (wanted.size === 0) return;
		// `routes/preces/[slug]/+page.svelte` -> `/preces/[slug]`, which
		// `indexesForPath` reads for its first segment and nothing else.
		const url = path.slice('routes'.length, -'/+page.svelte'.length) || '/';
		expect(indexesForPath(url)).toEqual(expect.arrayContaining([...wanted]));
	});
});
