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
	const isDeferredData = (url: string) => {
		const path = contentPath(url, baseHref);
		return path.endsWith('.json') && path.includes('/immutable/') && !contentUrls.has(path);
	};
	for (const url of build) {
		if (isDeferredData(url)) contentUrls.add(contentPath(url, baseHref));
	}

	const shellDocumentUrl = `${base}/`;
	const offlineFallbackUrl = `${base}/offline.html`;

	const precacheUrls = [
		...build.filter((url) => !contentUrls.has(contentPath(url, baseHref))),
		...files.filter((url) => !HOST_CONFIG_FILES.some((name) => url.endsWith(name))),
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
	'neighbours' | 'essentials' | 'catechism' | 'scripture' | 'magisterium' | 'summa' | 'other';

export interface Wave {
	id: WaveId;
	/** Whether the worker may fetch this wave without the reader asking.
	 *  See `AUTOMATIC_WAVES` for where the line is drawn and why. */
	automatic: boolean;
	assets: ContentEntry[];
	/** Sum of `bytes` — raw, not transfer size, and it is the number a UI
	 *  should show *before* committing a reader to a download. `content-length`
	 *  is only knowable after fetching, which is too late to ask. */
	bytes: number;
}

/**
 * Waves the worker fills without being asked, and the line's justification.
 *
 * `neighbours` and `essentials` are together under ~150 KB gzipped in any
 * language: the next chunk of the open work, plus the prayers, the Compendium
 * and the Bible introductions whole. That is a rounding error against a single
 * photograph on most sites, and it makes the app meaningfully usable offline.
 *
 * `catechism` is ~1 MB gzipped, which is a real download and is included
 * anyway: the Catechism is the site's second pillar, a reader who installed
 * this PWA installed it to read one of four or five works offline, and 1 MB is
 * the cheapest whole work among them. The three excluded waves are 2-5 MB
 * each.
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
	'ccc-chunk': 'catechism',
	'bible-chapters': 'scripture',
	'document-chunk': 'magisterium',
	'document-appendix': 'magisterium',
	// The outline, ~1.2 KB, beside the text it indexes. In `magisterium` and
	// not `essentials` despite the size: a reader whose fill stops before the
	// magisterium wave has no document text offline either, so an outline
	// downloaded ahead of it would index nothing.
	'document-structure': 'magisterium',
	'summa-question': 'summa'
};

const WAVE_ORDER: readonly WaveId[] = [
	'neighbours',
	'essentials',
	'catechism',
	'scripture',
	'magisterium',
	'summa',
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
	 *  Nothing outside it is planned, and only its first `OFFLINE_LANG_DEPTH`
	 *  entries are. */
	langs: readonly string[];
	/** What the reader has open, if anything, so `neighbours` knows what is
	 *  adjacent. A path this inventory does not contain yields no neighbours
	 *  rather than an error — a reader on a page with no content file (the
	 *  colophon, a listing) is an ordinary case. */
	current?: { workId: string; path: string };
}

/**
 * How many languages deep the fill goes, and the reason it is a fixed number
 * rather than "the chain".
 *
 * EVERY READER SHOULD PAY ABOUT THE SAME. A language in an automatic wave
 * costs ~3.3 MB raw across ~35 files wherever it has a Catechism (~290 KB of
 * essentials, ~3 MB of Catechism), and `CONTENT_LANG_FALLBACK` in corpus.ts
 * gives nine of its fifteen rows a neighbour language ahead of English and
 * Latin. Uncapped, that is a Spanish reader filling four languages against a
 * German reader's three — ~12.9 MB against ~9.5 — for a preference neither of
 * them expressed. Three is what every chain had before the neighbour rows
 * existed, so the cap holds the cost where it already was.
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
	{ langs, current }: WavePlanInput
): Wave[] {
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
	const mine = entries.filter((entry) => rankOf(entry.lang) !== undefined);

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
			// Language preference outranks everything: an English reader with
			// Latin as fallback finishes English before starting Latin.
			const byLang = rankOf(a.lang)! - rankOf(b.lang)!;
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
		return {
			id,
			automatic: AUTOMATIC_WAVES.has(id),
			assets,
			bytes: assets.reduce((sum, entry) => sum + entry.bytes, 0)
		};
	});
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
