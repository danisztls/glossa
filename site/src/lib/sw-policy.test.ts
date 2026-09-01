import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import {
	assetsForWork,
	contentPath,
	fontsForLangs,
	isDeferredFont,
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
		'/.well-known/security.txt',
		'/og.png',
		'/corpus-routes.json',
		'/reference-coverage.json',
		'/route-titles.json',
		'/apparatus.json',
		'/works.json',
		'/robots.txt',
		'/llms.txt'
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
		// The link-preview card, rendered for an unfurler in someone else's
		// chat client: no browser on this site ever requests it.
		expect(partition.shellUrls.has('/og.png')).toBe(false);
		expect(partition.shellUrls.has('/manifest.webmanifest')).toBe(true);
		expect(partition.shellUrls.has('/offline.html')).toBe(true);
	});

	/**
	 * Served over HTTP, but only to this project's own infrastructure: the edge
	 * worker reads the route manifest once per isolate, preflight reads the
	 * coverage report out of `build/`, and nothing that runs in a browser
	 * fetches either. Both were precached until 2026-08-28 — 39 KB spent at
	 * install by every reader on two files no module names.
	 */
	it('drops the files only the edge worker and the deploy read', () => {
		expect(partition.shellUrls.has('/corpus-routes.json')).toBe(false);
		expect(partition.shellUrls.has('/reference-coverage.json')).toBe(false);
		// `route-titles.json` was NOT in the list the day the list was written
		// to hold it — negated in `wrangler.jsonc`, so it cost no invocation,
		// and precached all the same at 62 KB a reader. `apparatus.json` is the
		// same file five times over.
		expect(partition.shellUrls.has('/route-titles.json')).toBe(false);
		expect(partition.shellUrls.has('/apparatus.json')).toBe(false);
	});

	/**
	 * Written for a stranger's machine and never for this one. `llms.txt` was
	 * left precached as "a few KB" until it became the statement of the address
	 * grammar; `works.json` is a quarter of a megabyte of imprint that no
	 * module names.
	 */
	it('drops the files written for crawlers', () => {
		expect(partition.shellUrls.has('/works.json')).toBe(false);
		expect(partition.shellUrls.has('/llms.txt')).toBe(false);
		expect(partition.shellUrls.has('/robots.txt')).toBe(false);
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

	/**
	 * The 404 page's illustration is 77 KB that a reader who never mistypes an
	 * address never needs. Content-hashed, so the content cache's terms suit it
	 * exactly; but the favicon is an SVG the document head asks for on the
	 * first offline load, and the fonts are what the shell renders with, so
	 * neither may follow it out of the precache.
	 */
	it('defers raster images to the content cache but keeps the favicon and fonts', () => {
		const img = '/_app/immutable/assets/reynard-preaching.hash.avif';
		const favicon = '/_app/immutable/assets/favicon.hash.svg';
		const font = '/_app/immutable/assets/eb-garamond.hash.woff2';
		const withMedia = partitionAssets({
			build: [...build, img, favicon, font],
			files,
			base: '',
			contentAssets,
			baseHref: BASE_HREF
		});
		expect(withMedia.contentUrls.has(img)).toBe(true);
		expect(withMedia.precacheUrls).not.toContain(img);
		// Not corpus, so the download waves must not plan over it either.
		expect(withMedia.contentEntries.map((e) => e.path)).not.toContain(img);

		expect(withMedia.precacheUrls).toContain(favicon);
		expect(withMedia.precacheUrls).toContain(font);
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
	 * languages long, and each language costs ~290 KB of essentials. The fill
	 * stops at three so that a reader
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

	/**
	 * `dore.tours` is the first content file with no language: 241 engravings
	 * have no language, and `sync-corpus.mjs` leaves the field empty rather
	 * than inventing one. Every OTHER entry is admitted by matching the
	 * reader's chain, so without an explicit rule this one matches nothing and
	 * belongs to no wave — no error, no `other`, just a collection that is
	 * never offline for anybody.
	 */
	it('plans a languageless collection for every reader', () => {
		const plates = entry({ workId: 'dore.tours', kind: 'plates', lang: '', path: '/plates.json' });
		for (const langs of [['en'], ['pt', 'en', 'la'], ['sv', 'en', 'la']]) {
			const waves = planWaves([plates], { langs });
			expect(waves.find((w) => w.id === 'essentials')!.assets.map((a) => a.workId)).toEqual([
				'dore.tours'
			]);
			expect(waves.find((w) => w.id === 'other')!.assets).toEqual([]);
		}
	});

	/** The reader's own languages first: the plate list is enrichment and must
	 *  not push the text of the language they read behind it. */
	it('sorts a languageless collection behind the reader’s own languages', () => {
		const waves = planWaves(
			[
				entry({ workId: 'dore.tours', kind: 'plates', lang: '', path: '/plates.json' }),
				entry({ workId: 'prayer.common.en', kind: 'prayer-collection', path: '/pr-en.json' })
			],
			{ langs: ['en'] }
		);
		expect(waves.find((w) => w.id === 'essentials')!.assets.map((a) => a.workId)).toEqual([
			'prayer.common.en',
			'dore.tours'
		]);
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
			expect(wave.autoBytes).toBe(wave.autoAssets.reduce((n, a) => n + a.bytes, 0));
		}
	});

	/**
	 * The Catechism is eight editions, so a three-language chain used to take
	 * three of them uninvited — 2.19 MB gzipped for a Portuguese reader against
	 * an English reader's 1.37, a 1.6x spread for a preference neither
	 * expressed. One edition is taken; the rest stay in the wave for a reader
	 * who asks for it.
	 */
	it('takes one Catechism edition uninvited, and keeps the rest askable', () => {
		const waves = byId(['pt', 'en']);
		expect(waves['catechism'].assets.map((a) => a.lang)).toEqual(['pt', 'en', 'en']);
		expect(waves['catechism'].autoAssets.map((a) => a.lang)).toEqual(['pt']);
	});

	/**
	 * Seven of the fifteen chains have a Compendium in their own language and
	 * no Catechism — `ro > it > en` is one. Electing `langs[0]` would leave
	 * every one of them with no Catechism offline at all; electing the first
	 * language that HAS an edition gives them the one `editionInLang` will
	 * show them anyway.
	 */
	it('elects the first language in the chain that has an edition', () => {
		const withItalian = [
			...entries,
			entry({ workId: 'ccc.it', kind: 'ccc-chunk', lang: 'it', path: '/ccc-it-0001-0100.json' })
		];
		const waves = Object.fromEntries(
			planWaves(withItalian, { langs: ['ro', 'it', 'en'] }).map((w) => [w.id, w])
		);
		expect(waves['catechism'].autoAssets.map((a) => a.lang)).toEqual(['it']);
	});

	/** Only the Catechism is rationed this way. Essentials is ~90 KB per
	 *  language and its whole point is that every language in the chain has it. */
	it('takes every edition of the cheap waves', () => {
		const waves = byId(['en', 'fr']);
		expect(waves['essentials'].autoAssets).toEqual(waves['essentials'].assets);
		expect(waves['essentials'].assets.map((a) => a.lang)).toContain('fr');
	});

	/** A wave outside `AUTOMATIC_WAVES` has nothing takeable, not merely a flag
	 *  saying so — the worker reads `autoAssets`, and a non-empty one here
	 *  would be a 28 MB download nobody asked for. */
	it('offers nothing automatic from a wave that is not automatic', () => {
		const waves = byId(['en']);
		expect(waves['scripture'].assets.length).toBeGreaterThan(0);
		expect(waves['scripture'].autoAssets).toEqual([]);
		expect(waves['scripture'].autoBytes).toBe(0);
		expect(waves['summa'].autoAssets).toEqual([]);
	});

	/**
	 * The reader picked an edition in the menu; it is the one thing here that
	 * is a choice rather than an inference from the interface language, and
	 * until 2026-08-26 the plan could not see it — so an English-interface
	 * reader of the Portuguese Bible had `[en, la]` filled and their own
	 * edition left off the device.
	 */
	it('plans a chosen edition even from outside the language chain', () => {
		const waves = Object.fromEntries(
			planWaves(entries, { langs: ['en'], chosen: ['ccc.pt'] }).map((w) => [w.id, w])
		);
		expect(waves['catechism'].assets.map((a) => a.lang)).toEqual(['pt', 'en', 'en']);
		// And it is the edition elected, over the chain's own first language.
		expect(waves['catechism'].autoAssets.map((a) => a.lang)).toEqual(['pt']);
	});

	/** Choosing a Portuguese Bible says nothing about which Catechism this
	 *  reader wants: a chosen edition sorts first inside ITS OWN wave, and the
	 *  language chain is left alone. */
	it('does not let a chosen edition elect its language elsewhere', () => {
		const waves = Object.fromEntries(
			planWaves(
				[
					...entries,
					entry({
						workId: 'bible.matos-soares.pt',
						kind: 'bible-chapters',
						lang: 'pt',
						path: '/content/bible.matos-soares.pt/books/gen/0001-0020.json'
					})
				],
				{ langs: ['en'], chosen: ['bible.matos-soares.pt'] }
			).map((w) => [w.id, w])
		);
		expect(waves['scripture'].assets[0].workId).toBe('bible.matos-soares.pt');
		expect(new Set(waves['catechism'].autoAssets.map((a) => a.lang))).toEqual(new Set(['en']));
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

/**
 * The font partition (`DEFERRED_FONTS`).
 *
 * These read the REAL `static/fonts/` directory rather than a fixture list,
 * because the failure this partition has is a face nobody classified: a new
 * `@font-face` is added, its file matches no fragment, and it silently keeps
 * the old behaviour of being precached for every reader on earth. A fixture
 * cannot notice a file it was not told about.
 */
describe('the font partition', () => {
	const FONT_DIR = new URL('../../static/fonts/', import.meta.url);
	const FONTS = readdirSync(FONT_DIR)
		.filter((name) => name.endsWith('.woff2'))
		.map((name) => `/fonts/${name}`);

	it('finds fonts to classify at all', () => {
		expect(FONTS.length).toBeGreaterThan(20);
	});

	// The whole partition in one assertion: every face is either core or
	// deferred, and the set that is neither must be empty. A face that falls
	// through is precached — the safe direction, and the silent one.
	it('classifies every vendored face', () => {
		const unclassified = FONTS.filter(
			(path) =>
				!isDeferredFont(path) && !/-latin-wght-|pirata-one-dropcap|ponomar-dropcap-latin/.test(path)
		);
		expect(unclassified).toEqual([]);
	});

	// `-latin-wght-` against `-latin-ext-wght-`: the one typo in `CORE_FONTS`
	// that would restore the old behaviour rather than break anything.
	it('does not mistake latin-ext for latin', () => {
		expect(isDeferredFont('/fonts/eb-garamond-latin-wght-normal.woff2')).toBe(false);
		expect(isDeferredFont('/fonts/eb-garamond-latin-ext-wght-normal.woff2')).toBe(true);
		expect(isDeferredFont('/fonts/source-sans-3-latin-wght-italic.woff2')).toBe(false);
		expect(isDeferredFont('/fonts/source-sans-3-latin-ext-wght-italic.woff2')).toBe(true);
	});

	it('leaves the two display faces alone but defers the Cyrillic dropcap', () => {
		expect(isDeferredFont('/fonts/pirata-one-dropcap.woff2')).toBe(false);
		expect(isDeferredFont('/fonts/ponomar-dropcap-latin.woff2')).toBe(false);
		expect(isDeferredFont('/fonts/ponomar-dropcap-cyrillic.woff2')).toBe(true);
	});

	it('is not fooled by a non-font asset whose name contains a script', () => {
		expect(isDeferredFont('/fonts/OFL-EBGaramond.txt')).toBe(false);
		expect(isDeferredFont('/_app/immutable/assets/cyrillic.hash.json')).toBe(false);
	});

	it('keeps deferred faces out of the precache and in the content tier', () => {
		const partition = partitionAssets({
			build: [],
			files: [
				'/fonts/eb-garamond-latin-wght-normal.woff2',
				'/fonts/amiri-arabic-400-normal.woff2',
				'/offline.html'
			],
			base: '',
			contentAssets: [],
			baseHref: BASE_HREF
		});
		expect(partition.shellUrls.has('/fonts/eb-garamond-latin-wght-normal.woff2')).toBe(true);
		expect(partition.shellUrls.has('/fonts/amiri-arabic-400-normal.woff2')).toBe(false);
		expect(partition.contentUrls.has('/fonts/amiri-arabic-400-normal.woff2')).toBe(true);
		// And a deferred face routes as content, which is what makes it
		// survive a deploy instead of being wiped with the shell.
		expect(
			routeFor(
				{
					method: 'GET',
					sameOrigin: true,
					pathname: '/fonts/amiri-arabic-400-normal.woff2',
					mode: 'no-cors'
				},
				partition
			)
		).toBe('content');
	});

	describe('fontsForLangs', () => {
		it('gives a Latin-script reader nothing to warm', () => {
			expect(fontsForLangs(FONTS, ['en', 'la'])).not.toEqual([]); // `la` takes latin-ext
			expect(fontsForLangs(FONTS, ['en'])).toEqual([]);
			expect(fontsForLangs(FONTS, ['it', 'es', 'en'])).toEqual([]);
		});

		it('warms Amiri for Arabic and nothing else', () => {
			const paths = fontsForLangs(FONTS, ['ar', 'fr', 'en', 'la']).map((f) => f.path);
			expect(paths.filter((p) => p.includes('amiri'))).toHaveLength(4);
			expect(paths.some((p) => p.includes('hebrew'))).toBe(false);
			// `la` is in an Arabic reader's chain and takes latin-ext with it.
			expect(paths.some((p) => p.includes('latin-ext'))).toBe(true);
		});

		it('warms Frank Ruhl Libre for Hebrew', () => {
			const paths = fontsForLangs(FONTS, ['he', 'en', 'la']).map((f) => f.path);
			expect(paths.filter((p) => p.includes('frank-ruhl-libre'))).toHaveLength(2);
			expect(paths.some((p) => p.includes('amiri'))).toBe(false);
		});

		it('warms both Cyrillic subsets and the Cyrillic dropcap', () => {
			const paths = fontsForLangs(FONTS, ['be']).map((f) => f.path);
			expect(paths.some((p) => p.includes('cyrillic-ext'))).toBe(true);
			expect(paths.some((p) => p.includes('ponomar-dropcap-cyrillic'))).toBe(true);
		});

		// Igbo's ị ọ ụ are U+1ECB/1ECD/1EE5 — Latin Extended Additional, which
		// the subsetter files under `vietnamese`, not under `latin-ext`.
		it('gives Igbo the vietnamese subset, which is where its dots-below live', () => {
			const paths = fontsForLangs(FONTS, ['ig']).map((f) => f.path);
			expect(paths.some((p) => p.includes('vietnamese'))).toBe(true);
		});

		// Nothing warms Greek: it is an apparatus script, so no reader's
		// language predicts it and it stays purely on demand.
		it('never warms Greek, whatever the reader reads', () => {
			const langs = ['en', 'la', 'pt', 'ar', 'he', 'ru', 'be', 'uk', 'vi', 'ig', 'pl', 'hu'];
			expect(fontsForLangs(FONTS, langs).some((f) => f.path.includes('greek'))).toBe(false);
		});

		it('reads a regional tag by its base language', () => {
			expect(fontsForLangs(FONTS, ['ru-RU'])).toEqual(fontsForLangs(FONTS, ['ru']));
		});

		it('only ever returns fonts', () => {
			const paths = fontsForLangs([...FONTS, '/works.json'], ['ar']).map((f) => f.path);
			expect(paths.every((p) => p.endsWith('.woff2'))).toBe(true);
		});
	});
});
