/**
 * The service worker's decisions, as pure functions.
 *
 * `src/service-worker.ts` cannot be imported by a test: it reads
 * `$service-worker` at module scope and registers event listeners as a side
 * effect of loading. Everything it *decides* lives here instead, so the
 * decisions can be exercised directly — the same split `route-manifest.ts`
 * already makes for the edge worker in `src/worker.ts`, and for the same
 * reason: both workers fail silently when they classify a URL wrongly.
 *
 * That silence is the whole argument for this file. The worker's own docblock
 * names its failure mode — "a service worker that installs cleanly, reports
 * success, and leaves the reader with no library offline" — and until now
 * nothing checked any of it. A misclassified corpus file does not throw; it
 * lands in the versioned shell cache, gets wiped on the next deploy, and the
 * reader re-downloads their library without ever seeing an error.
 *
 * Two independent things live here:
 *
 *   1. THE PARTITION — which of the build's URLs are corpus content (kept
 *      forever, immutable, content-hashed) and which are shell (rebuilt every
 *      deploy), plus the routing table that follows from it.
 *
 *   2. THE WAVES — the order the content tier is downloaded in, and how far
 *      down that order the worker may go without being asked. See
 *      `planWaves`.
 */

// --- Shapes ---------------------------------------------------------------
//
// Declared structurally rather than imported from `corpus-index.ts`: this
// module must stay loadable by a test with no corpus, no Vite glob and no
// `$service-worker`, and the fields below are all it actually reads.

/** One content-tier file, as `listContentAssets()` reports it. */
export interface ContentAssetLike {
	workId: string;
	kind: string;
	/** The language the work DECLARES — `sync-corpus.mjs` copies it from the
	 *  manifest rather than parsing the work id, which only looks parseable. */
	lang: string;
	bytes: number;
	/** How often the rest of the corpus cites this work; 0 for everything that
	 *  is not a document. Ordering signal for `magisterium`, see `planWaves`. */
	citedBy: number;
	/** Vite's `?url` value, which in a browser is an absolute href and in a
	 *  test is whatever the fixture says. Normalized by `contentPath`. */
	url: string;
}

/** The same file with its URL reduced to a comparable pathname. */
export interface ContentEntry extends ContentAssetLike {
	path: string;
}

/**
 * Normalize any of the three URL spellings in play to a single comparable
 * pathname. This is load-bearing, not tidiness: the two sides genuinely
 * disagree, and every way they can disagree fails *silently*.
 *
 *   - `$service-worker`'s `build` entries: base-prefixed, root-relative
 *     (`/_app/immutable/assets/x.json`).
 *   - Vite `?url` values from `listContentAssets()`: **document-relative, no
 *     leading slash** (`_app/immutable/assets/x.json`), which the bundler
 *     resolves against `import.meta.url` at runtime — so in a browser these
 *     arrive as fully absolute hrefs.
 *   - `fetch` events: `url.pathname`, always root-relative.
 *
 * Comparing any two of those as raw strings matches nothing, and nothing
 * throws when it doesn't match: content simply never routes to the content
 * cache, and the corpus quietly lands in the shell precache instead.
 */
export function contentPath(url: string, baseHref: string): string {
	try {
		return new URL(url, baseHref).pathname;
	} catch {
		return url.startsWith('/') ? url : `/${url}`;
	}
}

// --- The partition --------------------------------------------------------

/**
 * `_headers` and `_redirects` ship in `static/` because Cloudflare only reads
 * them from the deployed asset directory, but the host treats both as
 * configuration and never serves them. Precaching them spends install-time
 * requests to be told 404 — harmless, since the precache ignores non-ok
 * responses, but the misses look like real assets failing on every install.
 */
const HOST_CONFIG_FILES = ['/_headers', '/_redirects'];

/**
 * Static files that exist for machines which are not this browser.
 *
 * `sitemap.xml` is the whole ~6,000-address citation space as XML — half a
 * megabyte
 * that no part of the app ever fetches, and precaching it would spend a
 * reader's bandwidth at install on a file written for crawlers. `security.txt`
 * is small but is read the same way: by a researcher over HTTP, never by the
 * running application. `og.png` is the link-preview card — 47 KB rendered for
 * an unfurler in someone else's chat client, which is not this browser and
 * never this cache. All three are in `static/`, so `files` offers them and the
 * precache would take them without this.
 *
 * Kept separate from HOST_CONFIG_FILES because the reason differs: those two
 * are deploy-time configuration the host itself consumes and never serves,
 * these are served, just never to the app.
 *
 * `robots.txt` and `llms.txt` were the noted exception — "arguably the same
 * category", a few KB each, left alone rather than changed in passing. They
 * joined the list on 2026-08-29, when `llms.txt` stopped being a disclaimer and
 * became the machine-readable statement of the address grammar, and `works.json`
 * arrived beside it as the imprint of every work. Neither is fetched by
 * anything that runs in a browser, and together they are no longer a rounding
 * error on a reader's install.
 */
const CRAWLER_FILES = [
	'/sitemap.xml',
	'/.well-known/security.txt',
	'/og.png',
	'/robots.txt',
	'/llms.txt',
	'/works.json'
];

/**
 * Static files served over HTTP to this project's own infrastructure.
 *
 * A third list rather than more entries on the second, because the reason
 * differs again: CRAWLER_FILES are read by a stranger's machine, these are
 * read by ours. `corpus-routes.json` is fetched once per Worker isolate by
 * `src/worker.ts` to decide whether an address exists;
 * `reference-coverage.json` is read out of `build/` by
 * `scripts/preflight-deploy.mjs` before an upload. Neither is fetched by any
 * code that runs in a browser, and grep is the whole proof — no `.svelte` or
 * client `.ts` names either.
 *
 * They were precached anyway, for as long as this partition has existed:
 * `files` offers everything in `static/`, and a file is taken unless a list
 * here refuses it. That is 39 KB spent at install by every reader on two files
 * that reader will never read. Found 2026-08-28 while adding a third file of
 * the same kind (`route-titles.json`), which is what made the category worth
 * naming rather than fixing one file quietly.
 *
 * AND `route-titles.json` WAS THEN LEFT OUT OF IT — negated in
 * `wrangler.jsonc` so it costs no invocation, and precached all the same, 62 KB
 * per reader for a table only the edge reads. The list it prompted did not
 * include it for a day. It is here now, with `apparatus.json`, which is the
 * same thing again and five times the size: three files, one worker, no
 * browser.
 *
 * `apparatus.json` is read by BOTH since 2026-08-31, when `llms.txt` started
 * naming it: the edge reads it to write a head, and a stranger reads it because
 * the descriptions and the cross-references are the two things on this site
 * that are ours to offer. It stays here rather than moving, because the two
 * lists do the same thing — refuse the precache — and only this one is also
 * true. What a crawler-facing file additionally needs is its `run_worker_first`
 * negation, which this one has had since it shipped.
 */
const INFRASTRUCTURE_FILES = [
	'/corpus-routes.json',
	'/reference-coverage.json',
	'/route-titles.json',
	'/apparatus.json'
];

/**
 * Raster image extensions that belong in the content cache rather than the
 * install precache. Deliberately excludes `.svg` — the favicon is one, and the
 * document head asks for it before anything else.
 *
 * FONTS ARE NOT HERE AND ARE NOT EAGER EITHER; they are partitioned by SCRIPT
 * a few lines down, which is a third answer to a question this file has now
 * given three of. See `DEFERRED_FONTS`.
 */
const DEFERRED_MEDIA = ['.webp', '.png', '.jpg', '.jpeg', '.avif'];

/**
 * The faces every reader gets, whatever they read: the two text families'
 * `latin` subsets and the two display faces.
 *
 * `-latin-wght-` is what separates these from `-latin-ext-wght-`, and the
 * hyphen on the right is the whole of that separation — drop it and the
 * `latin-ext` subsets match here too, which is the one typo in this block
 * that would silently restore the old behaviour rather than break anything.
 *
 * The display faces are small and unconditional: `pirata-one-dropcap` sets the
 * wordmark in the header of every route, and `ponomar-dropcap-latin` is the
 * initial the reading pages open with. `source-sans-3-marks` is 1.1 KB and is
 * the dagger a commentary is anchored by — it is here rather than in a
 * deferred bucket because at that size the round trip costs more than the
 * bytes, and because a reader who filled the offline library and then switched
 * a commentary on would otherwise meet a tofu box (`fonts.css`).
 *
 * EXPORTED FOR THE TEST, which used to restate this list as a regex of its
 * own. Two copies of a partition is how a face comes to be classified in one
 * of them and not the other, and the failure that hides is the silent one this
 * whole block exists to prevent.
 */
export const CORE_FONTS = [
	'-latin-wght-',
	'pirata-one-dropcap',
	'ponomar-dropcap-latin',
	'source-sans-3-marks'
];

/**
 * Every other face, by the script it serves.
 *
 * WHY THIS EXISTS. `fonts.css` says declaring a subset is "close to free"
 * because `unicode-range` means a browser fetches a file only when a character
 * in its range is actually on the page. That is true over HTTP and it was
 * false the moment this service worker installed: everything in `static/` that
 * the precache does not refuse is downloaded whole at install. Measured
 * 2026-08-31: 1,118 KB of woff2 for EVERY reader, of which 413 KB is Amiri and
 * 315 KB is the two `latin-ext` subsets — paid in full by an English reader who
 * will never render an Arabic character or a Polish one.
 *
 * So the faces move to the content tier, where the browser's own laziness
 * survives: a deferred font is fetched on demand, stored on first read, and
 * outlives every deploy — the same terms the corpus itself is cached on. The
 * install precache drops from 1,118 KB of fonts to 157 KB, an 86% cut, and
 * what a reader adds back is bounded by their own CHAIN — which is the word
 * that matters, see the `la` paragraph below: 413 KB for Arabic, 315 for the
 * `latin-ext` languages, 160 for the Cyrillic ones, 21 for Vietnamese, 13 for
 * Hebrew, and nothing at all for English, Italian, Spanish, Portuguese,
 * German, French, Dutch, Danish, Finnish, Swedish, Latin and the rest of the
 * plain-`latin` set.
 *
 * ON DEMAND IS NOT ENOUGH ON ITS OWN, which is the other half. A reader who
 * fills the offline library and then loses the network needs the faces for
 * what they downloaded, and a font nobody has rendered yet has never been
 * fetched. That is what `fontsForLangs` is for: every message the client sends
 * this worker already carries `contentLangChain(readerLang())` (see
 * `sw.svelte.ts`), so the worker can warm exactly the scripts the reader's own
 * languages need, and nothing else.
 *
 * `greek` is the one bucket no language claims, and that is correct rather
 * than an omission: Greek here is an APPARATUS script, a patristic quotation
 * inside an edition in some other language, so no reader's language predicts
 * it. It is fetched the first time one is rendered and kept forever after.
 * The cost of being wrong about it is one quotation in a fallback face on one
 * page, once, and only for a reader who met their first Greek quotation while
 * offline.
 */
const DEFERRED_FONTS = {
	'latin-ext': ['-latin-ext-wght-'],
	cyrillic: ['-cyrillic-wght-', '-cyrillic-ext-wght-', 'ponomar-dropcap-cyrillic'],
	greek: ['-greek-wght-'],
	vietnamese: ['-vietnamese-wght-'],
	arabic: ['amiri-arabic-'],
	hebrew: ['frank-ruhl-libre-hebrew-']
} as const satisfies Record<string, readonly string[]>;

type FontScript = keyof typeof DEFERRED_FONTS;

/**
 * Which of those buckets a language actually needs — keyed on the BARE
 * language, since that is what `contentLangChain` produces.
 *
 * Only the languages that need something beyond `CORE_FONTS` appear; an
 * unlisted language warms nothing, which is the right answer for English,
 * Italian, Spanish, Portuguese, German, French, Dutch, Danish, Finnish,
 * Swedish, Indonesian, Tagalog and Swahili alike — every one of them spells
 * its chrome inside `latin`, Swedish's `å ä ö` included (they are Latin-1
 * Supplement, which the `latin` subset carries).
 *
 * `la` IS DELIBERATELY ABSENT, and it is the entry that has to be argued
 * because `fonts.css` names `ǽ` (U+01FD) in Latin liturgical text as the very
 * reason `latin-ext` is declared. It was here for one commit, and the effect
 * was to undo this whole partition: `en` and `la` are the tail of EVERY row in
 * `CONTENT_LANG_FALLBACK`, so `la` is in every reader's chain by construction,
 * so keying 315 KB of `latin-ext` to it warmed that 315 KB for every reader on
 * earth — the precise thing deferring the faces was meant to stop. Measured:
 * an English reader's automatic fill takes 28 KB of Latin (the prayers; Latin
 * has no Compendium and the elected Catechism is English), so it was eleven
 * times the font of the content it existed to set. The 19 glyphs fetch on
 * demand and are then kept forever, exactly like `greek` above, and the only
 * reader who ever sees a fallback serif is one who met their first `ǽ` while
 * offline. THE GENERAL RULE THIS BOUGHT: a language in the universal tail
 * cannot be given a script here, because the tail is not a preference.
 *
 * `ig` takes `vietnamese` rather than `latin-ext`, and that one is not a
 * mistake either.
 *   Igbo's dots-below vowels are `ị ọ ụ` (U+1ECB, U+1ECD, U+1EE5), which live
 *   in Latin Extended Additional — the block Google's subsetter files under
 *   `vietnamese` (U+1EA0-1EF9). `latin-ext` does not reach them. It takes both
 *   because its `ṅ` and its chrome's Latin-Extended-A punctuation do.
 *
 * CHECK THIS TABLE WHEN ADDING A LANGUAGE, beside the glyph inventory in
 * `fonts.css` that answers the same question for the online path. A language
 * missing here still renders correctly online — the browser fetches what it
 * needs — and is missing its face only offline, which is exactly the failure
 * this project keeps describing as the one nobody reports.
 */
const LANG_FONT_SCRIPTS: Record<string, readonly FontScript[]> = {
	ar: ['arabic'],
	he: ['hebrew'],
	ru: ['cyrillic'],
	uk: ['cyrillic'],
	be: ['cyrillic'],
	vi: ['latin-ext', 'vietnamese'],
	ig: ['latin-ext', 'vietnamese'],
	pl: ['latin-ext'],
	cs: ['latin-ext'],
	sk: ['latin-ext'],
	hr: ['latin-ext'],
	sl: ['latin-ext'],
	hu: ['latin-ext'],
	ro: ['latin-ext'],
	lv: ['latin-ext'],
	mg: ['latin-ext']
};

/** Every fragment in `DEFERRED_FONTS`, flattened once. */
const DEFERRED_FONT_FRAGMENTS: readonly string[] = Object.values(DEFERRED_FONTS).flat();

/** A font file, by extension — the only thing this partition needs to know
 *  about the shape of a static asset. */
function isFont(path: string): boolean {
	return path.endsWith('.woff2') || path.endsWith('.woff');
}

/**
 * Whether a `static/` URL is a face the install pass should NOT take.
 *
 * A font that matches no bucket is precached, not deferred — the default is
 * the safe direction. Adding a face with an unrecognized name costs a reader
 * its bytes at install; forgetting to precache one costs them tofu offline,
 * and only them.
 */
export function isDeferredFont(path: string): boolean {
	if (!isFont(path)) return false;
	if (CORE_FONTS.some((fragment) => path.includes(fragment))) return false;
	return DEFERRED_FONT_FRAGMENTS.some((fragment) => path.includes(fragment));
}

/**
 * The deferred faces `langs` need, as cacheable assets.
 *
 * `bytes` is 0 because nothing prices this: the tally the worker reports is
 * the reader's LIBRARY, and folding a few hundred KB of typography into "the
 * Catechism is 4.1 MB" would make that number answer a question nobody asked.
 * The faces are warmed unconditionally for the same reason they are not
 * priced — they are the reader's own language, they are bounded by this
 * table, and the largest any one language can pull is Arabic's 413 KB.
 */
export function fontsForLangs(
	files: readonly string[],
	langs: readonly string[]
): { path: string; bytes: number }[] {
	const scripts = new Set<FontScript>();
	for (const lang of langs) {
		for (const script of LANG_FONT_SCRIPTS[lang.toLowerCase().split('-')[0] ?? ''] ?? []) {
			scripts.add(script);
		}
	}
	if (!scripts.size) return [];

	const fragments = [...scripts].flatMap((script) => DEFERRED_FONTS[script]);
	return files
		.filter((url) => isFont(url) && fragments.some((fragment) => url.includes(fragment)))
		.map((path) => ({ path, bytes: 0 }));
}

export interface PartitionInput {
	/** `$service-worker`'s `build` — EVERY emitted build asset, corpus JSON
	 *  included, which is exactly why this partition has to exist. */
	build: readonly string[];
	/** `$service-worker`'s `files` — the contents of `static/`. */
	files: readonly string[];
	/** `$service-worker`'s `base`. */
	base: string;
	/** The inventory from `listContentAssets()`. Empty under fixtures. */
	contentAssets: readonly ContentAssetLike[];
	/** What relative URLs resolve against — `self.location.href` in a worker. */
	baseHref: string;
}

export interface AssetPartition {
	contentEntries: ContentEntry[];
	/** Content pathnames, for O(1) routing.
	 *
	 *  This is the routing set, so it holds the corpus inventory PLUS the
	 *  deferred data assets described in `partitionAssets` — everything that
	 *  belongs in the permanent, immutable content cache. `contentEntries` is
	 *  the corpus inventory alone, because that is what the download waves
	 *  plan over and what a per-work UI prices. */
	contentUrls: Set<string>;
	/** Everything the install pass fetches into the versioned shell cache. */
	precacheUrls: string[];
	/** Shell pathnames, for O(1) routing — `precacheUrls` as a set.
	 *
	 *  A set rather than the array `precacheUrls` already is, because routing
	 *  consults it on EVERY request: the previous implementation ran two
	 *  `Array.prototype.includes` scans over ~200 entries per fetch event. */
	shellUrls: Set<string>;
	/** The single SPA shell, used as the offline boot document. */
	shellDocumentUrl: string;
	offlineFallbackUrl: string;
}

/**
 * Split the build into the two cache tiers.
 *
 * `build` is every emitted asset, and since the corpus split that includes
 * content-hashed corpus JSON — Vite emits it as an ordinary build asset,
 * indistinguishable from app code by URL shape alone. Precaching `build`
 * wholesale would pull the entire library at install into the cache that
 * `activate` wipes on every deploy: it would undo both of the worker's
 * decisions at once (don't download uninvited; content outlives deploys).
 */
export function partitionAssets(input: PartitionInput): AssetPartition {
	const { build, files, base, contentAssets, baseHref } = input;

	const contentEntries: ContentEntry[] = contentAssets.map((asset) => ({
		...asset,
		path: contentPath(asset.url, baseHref)
	}));
	const contentUrls = new Set(contentEntries.map((entry) => entry.path));

	// Data the app fetches on demand but which is not corpus TEXT: the four
	// citation tables (`xrefs.svelte.ts`) and the translated document
	// descriptions. They are content-hashed build assets like the corpus is,
	// so they belong in the permanent content cache on the same terms —
	// immutable, stored on first read, outliving deploys — and they must NOT
	// be in the install precache, which would download 715 KB of citation
	// apparatus before the reader had asked for a single page of it.
	//
	// Recognized by extension because that is what actually distinguishes
	// them: everything the shell needs to BOOT is JS, CSS, a font or an icon,
	// and every `.json` under the build's immutable assets is data some module
	// fetches. (`_app/version.json` is the one JSON outside that directory,
	// and it is SvelteKit's poll target, which must never be cached at all —
	// hence matching on the immutable prefix rather than on `.json` alone.)
	//
	// Raster IMAGES go the same way, for the same reason at a smaller scale:
	// the 404 page's drollery is 80 KB that a reader who never mistypes an
	// address never needs, and it is content-hashed, so the content cache's
	// terms (stored on first read, never revalidated, outliving deploys) are
	// exactly right for it. `.svg` is deliberately NOT here — the favicon is
	// one, it is referenced from the document head, and it is wanted on the
	// first offline load. Fonts are not here either, for the stronger version
	// of the same point: the shell cannot render without them.
	const isDeferred = (url: string) => {
		const path = contentPath(url, baseHref);
		if (!path.includes('/immutable/') || contentUrls.has(path)) return false;
		return path.endsWith('.json') || DEFERRED_MEDIA.some((ext) => path.endsWith(ext));
	};
	for (const url of build) {
		if (isDeferred(url)) contentUrls.add(contentPath(url, baseHref));
	}
	// Fonts arrive through `files`, not `build`, so they never reach the test
	// above — `isDeferred` requires `/immutable/` and a font is not
	// content-hashed. They join the same tier by the same reasoning all the
	// same: fetched on demand, stored on first read, outliving deploys. See
	// `DEFERRED_FONTS`.
	for (const url of files) {
		if (isDeferredFont(contentPath(url, baseHref))) contentUrls.add(contentPath(url, baseHref));
	}

	const shellDocumentUrl = `${base}/`;
	const offlineFallbackUrl = `${base}/offline.html`;

	const precacheUrls = [
		...build.filter((url) => !contentUrls.has(contentPath(url, baseHref))),
		...files.filter(
			(url) =>
				![...HOST_CONFIG_FILES, ...CRAWLER_FILES, ...INFRASTRUCTURE_FILES].some((name) =>
					url.endsWith(name)
				) && !isDeferredFont(contentPath(url, baseHref))
		),
		shellDocumentUrl
	];

	return {
		contentEntries,
		contentUrls,
		precacheUrls,
		shellUrls: new Set(precacheUrls.map((url) => contentPath(url, baseHref))),
		shellDocumentUrl,
		offlineFallbackUrl
	};
}

/** What the fetch handler should do with a request. */
export type RouteKind =
	/** Corpus text: content cache, stored on first read, never revalidated. */
	| 'content'
	/** App code, static assets, and the boot document: versioned shell cache. */
	| 'shell'
	/** A full-page navigation: network first, cached shell on failure. */
	| 'navigate'
	/** Left to the network untouched. */
	| 'passthrough';

export interface RoutableRequest {
	method: string;
	/** Whether the request targets this worker's own origin. A boolean rather
	 *  than the origin string, so the caller does the one comparison it is
	 *  actually positioned to make and this stays a pure decision. */
	sameOrigin: boolean;
	pathname: string;
	/** `Request.mode` — `'navigate'` for a full-page load. */
	mode: string;
}

/**
 * The routing table, as one function rather than a run of `if`s in an event
 * handler — so the order of the branches is testable, which matters because
 * one of them is surprising:
 *
 * **`/` is `shell`, not `navigate`.** The boot document is in the precache
 * list, and the shell branch is checked before the navigation branch, so the
 * home page is served cache-first while every other route is network-first.
 * That is correct — the shell cache is version-scoped, so its copy can never
 * be staler than the worker serving it — but it was previously an accident of
 * branch order that contradicted the navigation handler's own docblock.
 */
export function routeFor(request: RoutableRequest, partition: AssetPartition): RouteKind {
	// The site makes no non-GET requests (no forms, no mutation — see
	// docs/decisions.md's account-free posture); stay defensive anyway.
	if (request.method !== 'GET') return 'passthrough';
	// Never touch cross-origin, and in particular never cache an opaque
	// response whose success this worker cannot inspect. The site makes no
	// cross-origin requests at all (docs/decisions.md's "Icon library: Lucide"
	// entry picked inline SVG specifically to avoid a webfont fetch), so this
	// is insurance against that changing silently rather than a live branch.
	if (!request.sameOrigin) return 'passthrough';
	if (partition.contentUrls.has(request.pathname)) return 'content';
	if (partition.shellUrls.has(request.pathname)) return 'shell';
	if (request.mode === 'navigate') return 'navigate';
	return 'passthrough';
}

// --- Download waves -------------------------------------------------------

/**
 * The order the content tier is filled in, coarsest decision first.
 *
 * Before this existed, the root layout asked for the WHOLE library 1.5s after
 * first render, on every visit, in every language: 2,236 files and ~26 MB
 * gzipped, to a reader who had opened one prayer. The size figure in the
 * worker's own header said 4.6 MB, which had been true a corpus ago.
 *
 * Two rules shape the order:
 *
 *   - **Never leave the reader's own language uninvited.** English alone is
 *     ~13.6 MB gzipped across 1,117 files; the other fourteen languages are
 *     work nobody asked for. `planWaves` takes the reader's language chain
 *     (their own, then English and Latin) and considers nothing else.
 *     Another language is reachable, but only by asking for it by work id.
 *
 *   - **Value per byte, descending.** The next chunk of what is open costs
 *     under 100 KB and removes the next page's fetch entirely; the Summa is
 *     5 MB and is the work least likely to be read end to end.
 */
export type WaveId =
	| 'neighbours'
	| 'essentials'
	| 'catechism'
	| 'scripture'
	| 'magisterium'
	| 'summa'
	| 'illustrations'
	| 'other';

/** A `CACHE_WAVE` target: one wave, or the library entire. `'all'` is not a
 *  `WaveId` because it is not a wave — it is every wave, and making it one
 *  would put it in `WAVE_ORDER` and have `planWaves` try to fill it. */
export type WaveRequest = WaveId | 'all';

export interface Wave {
	id: WaveId;
	/** Whether ANY of this wave may be fetched without the reader asking.
	 *  See `AUTOMATIC_WAVES` for where the line is drawn and why. */
	automatic: boolean;
	/** The whole wave, in download order — what an explicit `CACHE_WAVE` takes. */
	assets: ContentEntry[];
	/** Sum of `bytes` — raw, not transfer size, and it is the number a UI
	 *  should show *before* committing a reader to a download. `content-length`
	 *  is only knowable after fetching, which is too late to ask. */
	bytes: number;
	/**
	 * The leading slice of `assets` that may be taken UNINVITED, with its own
	 * size — `assets`/`bytes` for every wave but `catechism`, and empty for
	 * every wave outside `AUTOMATIC_WAVES`.
	 *
	 * Two numbers rather than one because "what the reader may ask for" and
	 * "what we take without asking" stopped being the same set when the
	 * Catechism became eight editions; see `ONE_EDITION_AUTOMATIC`. The gate
	 * in `service-worker.ts` prices `autoBytes`, not `bytes`, or it would
	 * refuse an automatic fill on the size of a download it was never going
	 * to start.
	 */
	autoAssets: ContentEntry[];
	autoBytes: number;
}

/**
 * Waves the worker fills without being asked, and the line's justification.
 *
 * `neighbours` and `essentials` are together under ~150 KB gzipped in any
 * language: the next chunk of the open work, plus the prayers, the Compendium
 * and the Bible introductions whole. That is a rounding error against a single
 * photograph on most sites, and it makes the app meaningfully usable offline.
 *
 * `catechism` is ~0.6 MB gzipped per edition (3.0-3.8 MB raw, 29 files), which
 * is a real download and is included anyway: the Catechism is the site's second
 * pillar, a reader who installed this PWA installed it to read one of four or
 * five works offline, and it is the cheapest whole work among them. The
 * excluded waves are 23-28 MB raw each, and `illustrations` is 103 MB.
 *
 * The worker gates this further at runtime on connection and storage quota —
 * see `src/service-worker.ts`. This table is the ceiling, not the decision.
 */
const AUTOMATIC_WAVES: ReadonlySet<WaveId> = new Set<WaveId>([
	'neighbours',
	'essentials',
	'catechism'
]);

/**
 * Waves whose automatic part is ONE EDITION — the first language in the
 * reader's chain that has one — rather than every edition in the chain.
 *
 * "Per edition" is what made this necessary. Until the Catechism was eight
 * editions (2026-08-26) a language cost one Catechism because most languages
 * had none, and the whole automatic set was the ~3.3 MB raw this file and
 * `corpus.ts` both still claimed afterwards. With eight, `OFFLINE_LANG_DEPTH`
 * multiplies: an English reader's chain reached two editions and a Portuguese
 * reader's three, so the fill was 1.37 MB gzipped against 2.19 — a 1.6x spread
 * for a preference neither reader expressed, and the exact property
 * `OFFLINE_LANG_DEPTH`'s docblock exists to defend.
 *
 * THE ELECTED EDITION IS THE ONE THE READER WILL BE SHOWN. Because the wave is
 * already sorted by language rank, the leading run IS the highest-ranked
 * language that has an edition — the same answer `editionInLang` gives when
 * they open the Catechism. So a Romanian reader (chain `ro > it > en`, and
 * there is no `ccc.ro`) fills Italian and not also English; a Hungarian reader
 * fills German. Electing `langs[0]` instead would leave seven of the fifteen
 * chains — every language with a Compendium but no Catechism — with no
 * Catechism offline at all.
 *
 * The other editions are not lost, and are not a wave either: `CACHE_WAVE`
 * takes the whole `catechism` wave, and `assetsForWork` takes one edition by
 * id. Both are the reader asking, which is what crossing an edition boundary
 * has always required here.
 *
 * Every chain now fills 39-51 files, 0.74-1.00 MB gzipped, against 68-109
 * files and 1.37-2.19 MB before.
 */
const ONE_EDITION_AUTOMATIC: ReadonlySet<WaveId> = new Set<WaveId>(['catechism']);

/**
 * Which wave each content `kind` belongs to.
 *
 * `kind` is written by `scripts/sync-corpus.mjs` and typed in
 * `corpus-index.ts`, and those two had already drifted once — the union
 * listed `document-sections` while the sync wrote `document-chunk`. So this
 * maps what the sync actually emits, and `planWaves` puts anything it does
 * not recognize into `other` rather than dropping it. A kind landing in
 * `other` is a bug (a whole work type that never downloads), which is why the
 * test asserts `other` is empty for the real inventory.
 */
const WAVE_FOR_KIND: Readonly<Record<string, WaveId>> = {
	'prayer-collection': 'essentials',
	'compendium-chunk': 'essentials',
	'bible-intros': 'essentials',
	// The 29 KB list of where Doré's 241 engravings sit, NOT the engravings.
	// It is `essentials` because it is tiny and because without it the plates
	// a reader HAS cached cannot be placed offline: the pictures would be on
	// the device and unreachable, which is the worse of the two failures and
	// the silent one.
	plates: 'essentials',
	// AND THE ENGRAVINGS THEMSELVES, which were in no wave until 2026-09-02.
	// They are ordinary build assets rather than corpus text, so the fetch
	// handler has always stored them in the permanent content cache on first
	// read — but a file that arrives only by being looked at is a file a
	// reader cannot ask for ahead of a flight, and 482 AVIFs at 103 MB is the
	// one thing here big enough that nobody should get it uninvited. A wave of
	// its own answers both: `illustrations` is outside `AUTOMATIC_WAVES`, so
	// it is only ever the reader pressing the button.
	'plate-image': 'illustrations',
	'ccc-chunk': 'catechism',
	'bible-chapters': 'scripture',
	// A commentary rides the wave of the work it annotates, which is
	// `scripture` today and would follow `annotates` if one were ever written
	// on something else. It is NOT a wave of its own: a reader filling
	// Scripture offline and finding the apparatus missing has the same
	// half-library problem `document-structure` is in `magisterium` to avoid,
	// one work over. `scripture` is outside `AUTOMATIC_WAVES`, so this is only
	// ever downloaded by a reader who asked — which is the right default for
	// the largest body of text the corpus holds.
	'commentary-chapters': 'scripture',
	'document-chunk': 'magisterium',
	'document-appendix': 'magisterium',
	// The outline, ~1.2 KB, beside the text it indexes. In `magisterium` and
	// not `essentials` despite the size: a reader whose fill stops before the
	// magisterium wave has no document text offline either, so an outline
	// downloaded ahead of it would index nothing.
	'document-structure': 'magisterium',
	// The Compendium of the Social Doctrine, whose three kinds are a
	// document's three under different names — see `docs/corpus-schema.md`.
	// In `magisterium` and not `essentials` for its size: one edition is
	// ~850 KB raw against the whole essentials wave's ~150 KB gzipped, and it
	// is a work a reader chooses rather than one the app cannot work without.
	// The outline and the back matter go with the text for the reason the
	// document's outline does — ahead of it they would index nothing.
	'social-doctrine-chunk': 'magisterium',
	'social-doctrine-appendix': 'magisterium',
	'social-doctrine-structure': 'magisterium',
	'summa-question': 'summa'
};

const WAVE_ORDER: readonly WaveId[] = [
	'neighbours',
	'essentials',
	'catechism',
	'scripture',
	'magisterium',
	'summa',
	// Last of the real waves, which is what the order means: 103 MB of
	// engravings is the lowest value per byte in the corpus by a wide margin,
	// and it is the one wave whose absence costs a reader nothing but
	// pictures. `other` still follows it, being the bug-catcher rather than a
	// shelf.
	'illustrations',
	'other'
];

/**
 * Reading order for the Bible, which is not print order.
 *
 * A reader who wants Scripture offline wants the Gospels first, then the
 * Psalms, then the Pentateuch. Anything not named here follows in canonical
 * order, so the list is a re-ranking of the front rather than a full
 * enumeration to keep in sync with the canon.
 */
const SCRIPTURE_FIRST: readonly string[] = [
	'matt',
	'mark',
	'luke',
	'john',
	'acts',
	'ps',
	'gen',
	'exod',
	'lev',
	'num',
	'deut',
	'prov',
	'isa',
	'rom'
];

/** The OSIS id in a `content/{workId}/books/{osis}/{chunk}.json` path. */
function osisOf(entry: ContentEntry): string {
	return /\/books\/([^/]+)\//.exec(entry.path)?.[1] ?? '';
}

/**
 * Compare two paths with digit runs read as numbers.
 *
 * Chunked kinds zero-pad (`0001-0020`) and sort lexically by accident; the
 * Summa does not (`questions/i-ii/102.json`), so a plain string sort puts
 * question 102 before question 2. Both shapes need to come out in reading
 * order for `neighbours` to mean anything.
 */
export function naturalCompare(a: string, b: string): number {
	const split = (s: string) => s.split(/(\d+)/);
	const as = split(a);
	const bs = split(b);
	for (let i = 0; i < Math.max(as.length, bs.length); i++) {
		const x = as[i] ?? '';
		const y = bs[i] ?? '';
		if (x === y) continue;
		const bothNumeric = /^\d+$/.test(x) && /^\d+$/.test(y);
		if (bothNumeric) return Number(x) - Number(y);
		return x < y ? -1 : 1;
	}
	return 0;
}

export interface WavePlanInput {
	/** The reader's content-language chain, most preferred first —
	 *  `contentLangChain` in corpus.ts, the same order edition resolution
	 *  follows, so what a reader is routed to is what they have offline.
	 *  Only its first `OFFLINE_LANG_DEPTH` entries are planned, and nothing
	 *  outside it except `chosen`. */
	langs: readonly string[];
	/** What the reader has open, if anything, so `neighbours` knows what is
	 *  adjacent. A path this inventory does not contain yields no neighbours
	 *  rather than an error — a reader on a page with no content file (the
	 *  colophon, a listing) is an ordinary case. */
	current?: { workId: string; path: string };
	/**
	 * Work ids the reader picked FOR THEMSELVES in the edition menu —
	 * `content.svelte.ts`'s active overrides, which is the one input here that
	 * is a choice rather than an inference from the interface language.
	 *
	 * IT WAS INVISIBLE TO THE FILL UNTIL 2026-08-26, and the reader that
	 * broke on is the one `content.svelte.ts`'s own docblock uses as its
	 * example: an English interface reading the Portuguese Matos Soares Bible.
	 * The plan was built from `contentLangChain(ui language)` alone, so `[en,
	 * la]` filled and the single edition they had explicitly asked for was the
	 * one thing not on the device — the inverse of the intent, and invisible
	 * because everything still WORKS while the network is up.
	 *
	 * A chosen work is planned whatever its language (asking for an edition by
	 * id is the explicit request that crossing languages requires, the same
	 * rule `assetsForWork` states) and sorts first WITHIN ITS OWN WAVE. It is
	 * deliberately not promoted into `langs`: choosing a Portuguese Bible says
	 * nothing about which Catechism this reader wants, and a chain promotion
	 * would elect the Portuguese one for them.
	 */
	chosen?: readonly string[];
}

/**
 * How many languages deep the fill goes, and the reason it is a fixed number
 * rather than "the chain".
 *
 * EVERY READER SHOULD PAY ABOUT THE SAME. A language in an automatic wave
 * costs ~290 KB raw of essentials, and `CONTENT_LANG_FALLBACK` in corpus.ts
 * gives nine of its fifteen rows a neighbour language ahead of English and
 * Latin. Uncapped, that is a Spanish reader filling four languages against a
 * German reader's three, for a preference neither of them expressed. Three is
 * what every chain had before the neighbour rows existed, so the cap holds the
 * cost where it already was.
 *
 * THE CAP IS NOT WHAT HOLDS THE CATECHISM'S COST, and assuming it did is how
 * the automatic fill quietly reached 2.19 MB gzipped for a Portuguese reader:
 * at ~3.3 MB raw per edition, three languages deep is three Catechisms. That
 * is `ONE_EDITION_AUTOMATIC`'s job, and the two are independent — this number
 * bounds how many languages are planned, that set bounds how many editions of
 * one work are taken uninvited.
 *
 * WHAT IT DROPS IS LATIN, for the nine rows with a neighbour, and that is the
 * cheapest thing in the chain to lose: Latin sits last precisely because it
 * is only reached when English does not have the address, which for a corpus
 * whose English tier is the one complete tier is close to never. The reader
 * routed to a neighbour they can actually read keeps it offline; the reader
 * who would have been sent to Latin was not going to be sent there.
 *
 * It caps the FILL and not the chain: `editionInLang` still walks every row
 * to its end, so a reader is never refused an address that exists — it is
 * fetched when they ask for it rather than ahead of them.
 */
const OFFLINE_LANG_DEPTH = 3;

/** How many files either side of the open one count as neighbours. Forward
 *  weighted because reading runs forward: the next chunk is the one whose
 *  fetch a reader is about to wait on. */
const NEIGHBOURS_AHEAD = 3;
const NEIGHBOURS_BEHIND = 1;

/**
 * Order the content inventory into download waves for one reader.
 *
 * Every asset in the reader's language chain appears in exactly one wave, and
 * the concatenation of the waves is the full download order. Deterministic:
 * given the same inventory and the same reader it returns the same order, so a
 * fill interrupted by the browser killing the worker resumes where it stopped
 * rather than reshuffling.
 */
export function planWaves(
	entries: readonly ContentEntry[],
	{ langs, current, chosen = [] }: WavePlanInput
): Wave[] {
	const chosenIds = new Set(chosen);
	const rank = new Map(
		langs.slice(0, OFFLINE_LANG_DEPTH).map((lang, i) => [lang.toLowerCase(), i])
	);
	const rankOf = (lang: string) => {
		// A regioned work matches a bare chain entry: `prayer.common.en-gb`
		// declares `en-GB`, and a reader whose chain says `en` wants it. The
		// reverse — a chain entry of `en-GB` against a work declaring `en` —
		// resolves the same way for the same reason. Without this the corpus's
		// one regional edition silently belongs to no wave at all.
		const l = lang.toLowerCase();
		return rank.get(l) ?? rank.get(l.split('-')[0]);
	};
	// A chosen edition is planned whether or not its language is in the chain;
	// everything else is planned only if it is. `rankOf` answers `undefined`
	// for the former, so every later comparison reads the rank through
	// `rankOrLast` rather than asserting it.
	// A LANGUAGELESS ENTRY IS PLANNED FOR EVERYONE. `dore.tours` is the first
	// content file with no `lang` at all — 241 engravings have no language,
	// and `sync-corpus.mjs` leaves the field empty rather than picking one.
	// Without this it would match no chain entry and belong to no wave, which
	// is the quiet failure `other` is a bug for: no error, nothing in the
	// planner, and the collection simply never offline for anybody.
	const mine = entries.filter(
		(entry) => entry.lang === '' || rankOf(entry.lang) !== undefined || chosenIds.has(entry.workId)
	);
	// Languageless entries fall to the end of their wave, the same place a
	// chosen work outside the chain lands: it is the reader's own languages
	// that should arrive first.
	const rankOrLast = (entry: ContentEntry) => rankOf(entry.lang) ?? OFFLINE_LANG_DEPTH;

	const neighbours = current ? neighboursOf(mine, current) : [];
	const claimed = new Set(neighbours.map((entry) => entry.path));

	const buckets = new Map<WaveId, ContentEntry[]>(WAVE_ORDER.map((id) => [id, []]));
	buckets.set('neighbours', neighbours);

	for (const entry of mine) {
		if (claimed.has(entry.path)) continue;
		buckets.get(WAVE_FOR_KIND[entry.kind] ?? 'other')!.push(entry);
	}

	for (const [id, assets] of buckets) {
		if (id === 'neighbours') continue; // already in reading order
		assets.sort((a, b) => {
			// An edition the reader picked outranks even language preference —
			// it IS the preference, stated rather than inferred. This is also
			// what elects it for `ONE_EDITION_AUTOMATIC`, which reads the
			// leading run.
			const byChosen = Number(chosenIds.has(b.workId)) - Number(chosenIds.has(a.workId));
			if (byChosen !== 0) return byChosen;
			// Language preference next: an English reader with Latin as
			// fallback finishes English before starting Latin.
			const byLang = rankOrLast(a) - rankOrLast(b);
			if (byLang !== 0) return byLang;
			if (id === 'scripture') {
				const byBook = scriptureRank(osisOf(a)) - scriptureRank(osisOf(b));
				if (byBook !== 0) return byBook;
			}
			if (id === 'magisterium') {
				// Most-cited first, then smallest first: the works the corpus
				// itself points at most, and after that as many whole documents
				// as possible per megabyte.
				const byCited = b.citedBy - a.citedBy;
				if (byCited !== 0) return byCited;
				const bySize = a.bytes - b.bytes;
				if (bySize !== 0) return bySize;
			}
			return naturalCompare(a.path, b.path);
		});
	}

	return WAVE_ORDER.map((id) => {
		const assets = buckets.get(id)!;
		const automatic = AUTOMATIC_WAVES.has(id);
		const autoAssets = !automatic
			? []
			: ONE_EDITION_AUTOMATIC.has(id)
				? leadingEdition(assets)
				: assets;
		return {
			id,
			automatic,
			assets,
			bytes: assets.reduce((sum, entry) => sum + entry.bytes, 0),
			autoAssets,
			autoBytes: autoAssets.reduce((sum, entry) => sum + entry.bytes, 0)
		};
	});
}

/**
 * The run of assets at the front of a sorted wave that share the first one's
 * language — for `ONE_EDITION_AUTOMATIC`, where that run is the edition the
 * reader will actually be shown.
 *
 * Read off the sort rather than elected separately, because the sort already
 * encodes the whole answer: a chosen edition first, then language rank. A
 * second implementation of "which edition is this reader's" is a second thing
 * to keep in step with `editionInLang`.
 */
function leadingEdition(assets: readonly ContentEntry[]): ContentEntry[] {
	const lead = assets[0]?.lang.toLowerCase();
	if (lead === undefined) return [];
	return assets.filter((entry) => entry.lang.toLowerCase() === lead);
}

function scriptureRank(osis: string): number {
	const i = SCRIPTURE_FIRST.indexOf(osis);
	return i === -1 ? SCRIPTURE_FIRST.length : i;
}

/** The files immediately around the open one, within the same work. */
function neighboursOf(
	entries: readonly ContentEntry[],
	current: { workId: string; path: string }
): ContentEntry[] {
	const siblings = entries
		.filter((entry) => entry.workId === current.workId)
		.sort((a, b) => naturalCompare(a.path, b.path));
	const at = siblings.findIndex((entry) => entry.path === current.path);
	if (at === -1) return [];
	return [
		...siblings.slice(Math.max(0, at - NEIGHBOURS_BEHIND), at),
		...siblings.slice(at + 1, at + 1 + NEIGHBOURS_AHEAD)
	];
}

/** Every asset of one work, in wave order — for a per-work "download this"
 *  control, which is the granularity a reader thinks in ("the Catechism",
 *  "the CPDV Bible") and the one `listContentAssets()`'s byte counts were
 *  always meant to price. Not language-filtered: asking for a work by id IS
 *  the explicit request that crossing languages requires. */
export function assetsForWork(entries: readonly ContentEntry[], workId: string): ContentEntry[] {
	return entries
		.filter((entry) => entry.workId === workId)
		.sort((a, b) => naturalCompare(a.path, b.path));
}
