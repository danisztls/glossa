import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	assetsForWork,
	contentPath,
	naturalCompare,
	partitionAssets,
	planWaves,
	routeFor,
	type ContentAssetLike,
	type ContentEntry
} from './sw-policy';

/**
 * Tests for the service worker's decisions.
 *
 * The worker's own docblock names its failure mode — "installs cleanly,
 * reports success, and leaves the reader with no library offline" — and until
 * this file existed nothing checked any of it. Every case below corresponds to
 * a way the worker can be wrong WITHOUT throwing, which is the only way it has
 * ever been wrong.
 */

const BASE_HREF = 'https://glossacatholica.org/service-worker.js';

function asset(over: Partial<ContentAssetLike> = {}): ContentAssetLike {
	return {
		workId: 'ccc.en',
		kind: 'ccc-chunk',
		lang: 'en',
		bytes: 1000,
		citedBy: 0,
		url: '_app/immutable/assets/ccc.hash.json',
		...over
	};
}

function entry(over: Partial<ContentEntry> = {}): ContentEntry {
	const base = asset(over);
	return { ...base, path: over.path ?? contentPath(base.url, BASE_HREF) };
}

describe('contentPath', () => {
	/**
	 * The three spellings genuinely in play, which must all reduce to one
	 * comparable pathname. Nothing throws when they don't: the corpus quietly
	 * routes to the shell cache instead, gets wiped on the next deploy, and the
	 * reader silently re-downloads their library.
	 */
	it('reduces all three URL spellings to the same pathname', () => {
		const expected = '/_app/immutable/assets/x.json';
		// Vite `?url`: document-relative, no leading slash.
		expect(contentPath('_app/immutable/assets/x.json', BASE_HREF)).toBe(expected);
		// `$service-worker`'s `build`: root-relative.
		expect(contentPath('/_app/immutable/assets/x.json', BASE_HREF)).toBe(expected);
		// What a browser actually hands over once Vite has resolved it.
		expect(contentPath('https://glossacatholica.org/_app/immutable/assets/x.json', BASE_HREF)).toBe(
			expected
		);
	});

	it('drops query and hash, which a cache key must not carry', () => {
		expect(contentPath('/a/b.json?v=2#frag', BASE_HREF)).toBe('/a/b.json');
	});

	it('falls back to a rooted path rather than throwing on an unparseable URL', () => {
		expect(contentPath('not a url', '')).toBe('/not a url');
	});
});

describe('partitionAssets', () => {
	const build = [
		'/_app/immutable/entry/start.hash.js',
		'/_app/immutable/chunks/app.hash.js',
		'/_app/immutable/assets/ccc.hash.json',
		'/_app/immutable/assets/gen.hash.json'
	];
	const files = [
		'/manifest.webmanifest',
		'/offline.html',
		'/_headers',
		'/_redirects',
		'/sitemap.xml',
		'/.well-known/security.txt'
	];
	const contentAssets = [
		asset({ url: '_app/immutable/assets/ccc.hash.json' }),
		asset({
			workId: 'bible.cpdv.en',
			kind: 'bible-chapters',
			url: '/_app/immutable/assets/gen.hash.json'
		})
	];
	const partition = partitionAssets({ build, files, base: '', contentAssets, baseHref: BASE_HREF });

	/**
	 * The regression the worker's CONTENT TIER POLICY block predicts, in the
	 * direction that costs a reader their library on every deploy: corpus files
	 * are ordinary build assets, so precaching `build` wholesale would pull the
	 * whole library into the cache `activate` wipes.
	 */
	it('keeps every content file out of the shell precache', () => {
		for (const url of partition.precacheUrls) {
			expect(partition.contentUrls.has(contentPath(url, BASE_HREF))).toBe(false);
		}
	});

	/** The other direction: the failure where the content tier holds nothing at
	 *  all and the worker still reports success. */
	it('claims every content asset it was given', () => {
		expect(partition.contentEntries).toHaveLength(contentAssets.length);
		expect(partition.contentUrls.size).toBe(contentAssets.length);
	});

	it('partitions build into exactly two disjoint tiers', () => {
		const shell = build.filter((url) => partition.shellUrls.has(contentPath(url, BASE_HREF)));
		const content = build.filter((url) => partition.contentUrls.has(contentPath(url, BASE_HREF)));
		expect(shell).toHaveLength(2);
		expect(content).toHaveLength(2);
		expect(shell.filter((url) => content.includes(url))).toHaveLength(0);
	});

	it('normalizes content assets whichever spelling the inventory used', () => {
		// One of the two fixtures above is document-relative, the other rooted.
		expect([...partition.contentUrls].sort()).toEqual([
			'/_app/immutable/assets/ccc.hash.json',
			'/_app/immutable/assets/gen.hash.json'
		]);
	});

	it('drops host config files the platform never serves, and nothing else', () => {
		expect(partition.shellUrls.has('/_headers')).toBe(false);
		expect(partition.shellUrls.has('/_redirects')).toBe(false);
		// Served, but never to the app: the sitemap is 394 KB of crawler-facing
		// XML in the real build, and precaching it would spend a reader's
		// bandwidth at install on a file no module fetches.
		expect(partition.shellUrls.has('/sitemap.xml')).toBe(false);
		expect(partition.shellUrls.has('/.well-known/security.txt')).toBe(false);
		expect(partition.shellUrls.has('/manifest.webmanifest')).toBe(true);
		expect(partition.shellUrls.has('/offline.html')).toBe(true);
	});

	it('precaches the boot document', () => {
		expect(partition.shellDocumentUrl).toBe('/');
		expect(partition.shellUrls.has('/')).toBe(true);
	});

	it('plans no waves under fixtures, there being no inventory to plan over', () => {
		const empty = partitionAssets({
			build,
			files,
			base: '',
			contentAssets: [],
			baseHref: BASE_HREF
		});
		expect(empty.contentEntries).toHaveLength(0);
	});

	/**
	 * Data the app fetches on demand but which is not corpus text — the four
	 * citation tables, the translated descriptions. They must not be in the
	 * install precache (715 KB of citation apparatus before the reader has
	 * opened a page) and they must not be in the versioned shell cache (they
	 * are content-hashed and immutable, so there is nothing to re-download).
	 */
	it('routes on-demand data assets to the content cache, never the precache', () => {
		const withXrefs = partitionAssets({
			build: [...build, '/_app/immutable/assets/document-xrefs.hash.json'],
			files,
			base: '',
			contentAssets,
			baseHref: BASE_HREF
		});
		expect(withXrefs.contentUrls.has('/_app/immutable/assets/document-xrefs.hash.json')).toBe(true);
		expect(withXrefs.precacheUrls).not.toContain('/_app/immutable/assets/document-xrefs.hash.json');
		// But it is not corpus, so the download waves must not plan over it.
		expect(withXrefs.contentEntries.map((e) => e.path)).not.toContain(
			'/_app/immutable/assets/document-xrefs.hash.json'
		);
	});

	/** SvelteKit's update-poll target. Caching it at all would make the poll
	 *  answer from cache, which is the one thing it exists not to do. */
	it('leaves _app/version.json to the network', () => {
		const withVersion = partitionAssets({
			build: [...build, '/_app/version.json'],
			files,
			base: '',
			contentAssets,
			baseHref: BASE_HREF
		});
		expect(withVersion.contentUrls.has('/_app/version.json')).toBe(false);
	});
});

describe('routeFor', () => {
	const partition = partitionAssets({
		build: ['/_app/immutable/chunks/app.hash.js', '/_app/immutable/assets/ccc.hash.json'],
		files: ['/offline.html'],
		base: '',
		contentAssets: [asset({ url: '/_app/immutable/assets/ccc.hash.json' })],
		baseHref: BASE_HREF
	});

	const route = (over: Partial<Parameters<typeof routeFor>[0]>) =>
		routeFor(
			{ method: 'GET', sameOrigin: true, pathname: '/', mode: 'no-cors', ...over },
			partition
		);

	it('sends corpus text to the content tier', () => {
		expect(route({ pathname: '/_app/immutable/assets/ccc.hash.json' })).toBe('content');
	});

	it('sends app code and static assets to the shell tier', () => {
		expect(route({ pathname: '/_app/immutable/chunks/app.hash.js' })).toBe('shell');
		expect(route({ pathname: '/offline.html' })).toBe('shell');
	});

	it('sends a reader path to the navigation handler', () => {
		expect(route({ pathname: '/catechismus/1', mode: 'navigate' })).toBe('navigate');
	});

	/**
	 * The surprising one, and the reason this table is a function rather than a
	 * run of `if`s in an event handler. `/` is in the precache list, so the
	 * shell branch answers before the navigation branch: the home page is
	 * cache-first while every other route is network-first. Correct — the shell
	 * cache is version-scoped, so its copy can never be staler than the worker
	 * serving it — but it used to be an accident of branch order that
	 * contradicted the navigation handler's own docblock.
	 */
	it('serves the home page from the shell cache, not the network', () => {
		expect(route({ pathname: '/', mode: 'navigate' })).toBe('shell');
	});

	it('never touches a non-GET request', () => {
		expect(route({ method: 'POST', pathname: '/_app/immutable/assets/ccc.hash.json' })).toBe(
			'passthrough'
		);
	});

	it('never touches a cross-origin request', () => {
		expect(route({ sameOrigin: false, pathname: '/_app/immutable/assets/ccc.hash.json' })).toBe(
			'passthrough'
		);
		expect(route({ sameOrigin: false, pathname: '/x', mode: 'navigate' })).toBe('passthrough');
	});

	it('leaves anything else to the network', () => {
		expect(route({ pathname: '/something-else.txt' })).toBe('passthrough');
	});
});

describe('naturalCompare', () => {
	/** Chunked kinds zero-pad and sort lexically by accident; the Summa does
	 *  not, so a plain string sort puts question 102 before question 2 and
	 *  `neighbours` picks the wrong files. */
	it('reads digit runs as numbers', () => {
		expect(['q/102.json', 'q/2.json', 'q/11.json'].sort(naturalCompare)).toEqual([
			'q/2.json',
			'q/11.json',
			'q/102.json'
		]);
	});

	it('still orders zero-padded chunk names correctly', () => {
		expect(['p/0101-0200.json', 'p/0001-0100.json'].sort(naturalCompare)).toEqual([
			'p/0001-0100.json',
			'p/0101-0200.json'
		]);
	});
});

describe('planWaves', () => {
	const entries: ContentEntry[] = [
		entry({ workId: 'prayer.common.en', kind: 'prayer-collection', path: '/pr-en.json' }),
		entry({ workId: 'compendium.en', kind: 'compendium-chunk', path: '/comp-en-1.json' }),
		entry({ workId: 'ccc.en', kind: 'ccc-chunk', path: '/ccc-en-0001-0100.json' }),
		entry({ workId: 'ccc.en', kind: 'ccc-chunk', path: '/ccc-en-0101-0200.json' }),
		entry({
			workId: 'bible.cpdv.en',
			kind: 'bible-chapters',
			path: '/content/bible.cpdv.en/books/gen/0001-0020.json'
		}),
		entry({
			workId: 'bible.cpdv.en',
			kind: 'bible-chapters',
			path: '/content/bible.cpdv.en/books/john/0001-0020.json'
		}),
		entry({
			workId: 'vatii.lumen-gentium.en',
			kind: 'document-chunk',
			citedBy: 518,
			path: '/lg-en.json'
		}),
		entry({ workId: 'encyclical.obscure.en', kind: 'document-chunk', path: '/obscure-en.json' }),
		entry({ workId: 'summa.en', kind: 'summa-question', path: '/summa-en-1.json' }),
		// Another language entirely — the thing that must never be taken
		// uninvited.
		entry({ workId: 'ccc.pt', kind: 'ccc-chunk', lang: 'pt', path: '/ccc-pt-0001-0100.json' }),
		entry({ workId: 'compendium.fr', kind: 'compendium-chunk', lang: 'fr', path: '/comp-fr.json' })
	];

	const byId = (langs: string[], current?: { workId: string; path: string }) =>
		Object.fromEntries(planWaves(entries, { langs, current }).map((w) => [w.id, w]));

	/**
	 * The rule the whole redesign turns on. Before this, the layout asked for
	 * the entire library in every language on every visit: 2,236 files and
	 * ~26 MB gzipped to a reader who had opened one prayer.
	 */
	it('plans nothing outside the reader’s language chain', () => {
		const planned = planWaves(entries, { langs: ['en'] }).flatMap((w) => w.assets);
		expect(planned.every((a) => a.lang === 'en')).toBe(true);
		expect(planned.some((a) => a.lang === 'pt')).toBe(false);
	});

	/**
	 * The neighbour rows in `CONTENT_LANG_FALLBACK` made some chains four
	 * languages long, and a language costs ~3.3 MB in the automatic waves
	 * wherever it has a Catechism. The fill stops at three so that a reader
	 * whose row names a neighbour pays what every reader paid before the rows
	 * existed — the resolution chain still runs to its end.
	 */
	it('fills only the first three languages of a longer chain', () => {
		// Latin has to be IN the inventory or the assertion below passes for
		// the wrong reason — the shared fixture carries no Latin.
		const withLatin = [
			...entries,
			entry({ workId: 'ccc.la', kind: 'ccc-chunk', lang: 'la', path: '/ccc-la-0001-0100.json' })
		];
		const planned = planWaves(withLatin, { langs: ['pt', 'fr', 'en', 'la'] }).flatMap(
			(w) => w.assets
		);
		expect(planned.some((a) => a.lang === 'pt')).toBe(true);
		expect(planned.some((a) => a.lang === 'fr')).toBe(true);
		expect(planned.some((a) => a.lang === 'en')).toBe(true);
		expect(planned.every((a) => a.lang !== 'la')).toBe(true);
	});

	it('follows the fallback chain in order, own language first', () => {
		const catechism = byId(['pt', 'en'])['catechism'].assets;
		expect(catechism.map((a) => a.lang)).toEqual(['pt', 'en', 'en']);
	});

	/** A regioned work must reach a reader whose chain names the bare tag —
	 *  otherwise `prayer.common.en-gb` belongs to no wave at all. */
	it('matches a regioned work against a bare language', () => {
		const regional = [
			entry({
				workId: 'prayer.common.en-gb',
				kind: 'prayer-collection',
				lang: 'en-GB',
				path: '/pr-gb.json'
			})
		];
		const waves = planWaves(regional, { langs: ['en'] });
		expect(waves.find((w) => w.id === 'essentials')!.assets).toHaveLength(1);
	});

	/**
	 * Every asset in exactly one wave: a duplicate is a file downloaded twice,
	 * and a missing one is a file that never downloads at all.
	 */
	it('places every in-language asset in exactly one wave', () => {
		const planned = planWaves(entries, { langs: ['en'] }).flatMap((w) => w.assets);
		const paths = planned.map((a) => a.path);
		expect(new Set(paths).size).toBe(paths.length);
		expect(paths.sort()).toEqual(
			entries
				.filter((e) => e.lang === 'en')
				.map((e) => e.path)
				.sort()
		);
	});

	/** A kind nobody mapped is a whole work type that never downloads. `other`
	 *  catches it rather than dropping it, and staying empty is the property
	 *  worth asserting. */
	it('routes an unknown kind to `other` rather than losing it', () => {
		const odd = [entry({ kind: 'something-new', path: '/new.json' })];
		const waves = Object.fromEntries(planWaves(odd, { langs: ['en'] }).map((w) => [w.id, w]));
		expect(waves['other'].assets).toHaveLength(1);
		expect(waves['other'].automatic).toBe(false);
	});

	it('reports byte totals per wave, so a UI can price a download before it starts', () => {
		const waves = byId(['en']);
		for (const wave of Object.values(waves)) {
			expect(wave.bytes).toBe(wave.assets.reduce((n, a) => n + a.bytes, 0));
		}
	});

	it('holds the expensive waves back from the automatic set', () => {
		const waves = byId(['en']);
		expect(waves['neighbours'].automatic).toBe(true);
		expect(waves['essentials'].automatic).toBe(true);
		expect(waves['catechism'].automatic).toBe(true);
		expect(waves['scripture'].automatic).toBe(false);
		expect(waves['magisterium'].automatic).toBe(false);
		expect(waves['summa'].automatic).toBe(false);
	});

	it('takes the Gospels before the Pentateuch', () => {
		const scripture = byId(['en'])['scripture'].assets;
		expect(scripture.map((a) => a.path.match(/books\/([^/]+)\//)![1])).toEqual(['john', 'gen']);
	});

	it('takes the most-cited documents first', () => {
		const magisterium = byId(['en'])['magisterium'].assets;
		expect(magisterium.map((a) => a.workId)).toEqual([
			'vatii.lumen-gentium.en',
			'encyclical.obscure.en'
		]);
	});

	it('reads forward from what is open, and takes those first', () => {
		const waves = byId(['en'], { workId: 'ccc.en', path: '/ccc-en-0001-0100.json' });
		expect(waves['neighbours'].assets.map((a) => a.path)).toEqual(['/ccc-en-0101-0200.json']);
		// And the neighbour is not ALSO in the catechism wave.
		expect(waves['catechism'].assets.map((a) => a.path)).toEqual(['/ccc-en-0001-0100.json']);
	});

	it('yields no neighbours for a page with no content file', () => {
		const waves = byId(['en'], { workId: 'ccc.en', path: '/not-in-the-inventory.json' });
		expect(waves['neighbours'].assets).toHaveLength(0);
	});

	/** A fill interrupted by the browser killing the worker resumes by replaying
	 *  the plan, so the plan has to be stable. */
	it('is deterministic', () => {
		const once = planWaves(entries, { langs: ['en', 'la'] }).flatMap((w) =>
			w.assets.map((a) => a.path)
		);
		const twice = planWaves(entries, { langs: ['en', 'la'] }).flatMap((w) =>
			w.assets.map((a) => a.path)
		);
		expect(once).toEqual(twice);
	});
});

describe('assetsForWork', () => {
	/** Asking for a work by id IS the explicit request that crossing languages
	 *  requires, so this one is deliberately NOT language-filtered. */
	it('takes a whole work regardless of the reader’s languages', () => {
		const entries = [
			entry({ workId: 'compendium.sv', lang: 'sv', path: '/sv-0101-0200.json' }),
			entry({ workId: 'compendium.sv', lang: 'sv', path: '/sv-0001-0100.json' }),
			entry({ workId: 'ccc.en', path: '/en.json' })
		];
		expect(assetsForWork(entries, 'compendium.sv').map((a) => a.path)).toEqual([
			'/sv-0001-0100.json',
			'/sv-0101-0200.json'
		]);
	});
});

describe('the kinds the sync actually writes', () => {
	/**
	 * `WAVE_FOR_KIND` maps `kind` strings that are produced in a build script
	 * this module cannot import, and the pair has drifted before —
	 * `corpus-index.ts`'s union listed `document-sections` while the sync wrote
	 * `document-chunk`. A kind with no wave lands in `other` and never
	 * downloads automatically, which is a whole work type silently missing from
	 * the offline library.
	 */
	it('is fully covered by the named waves', () => {
		const source = readFileSync(new URL('../../scripts/sync-corpus.mjs', import.meta.url), 'utf8');
		// Scoped to `contentManifest.push(...)` calls specifically. A bare
		// `kind: '…'` search also catches the reverse-citation index's citers
		// (`{ kind: 'ccc' }`, `{ kind: 'document' }`), which are a different
		// vocabulary entirely and would make this fail for the wrong reason.
		const kinds = source
			.split('contentManifest.push(')
			.slice(1)
			.map((tail) => /kind: '([a-z-]+)'/.exec(tail.slice(0, 300))?.[1])
			.filter((kind): kind is string => Boolean(kind));
		expect(kinds.length).toBeGreaterThan(0);

		const planned = planWaves(
			[...new Set(kinds)].map((kind) => entry({ kind, path: `/${kind}.json` })),
			{ langs: ['en'] }
		);
		const other = planned.find((w) => w.id === 'other')!;
		expect(other.assets.map((a) => a.kind)).toEqual([]);
	});
});
