import type { Apparatus } from './lib/apparatus';
import { bookFromLegacySlug, bookSlug } from './lib/address';
import { isCanonicalPath, type RouteManifest } from './lib/route-manifest';
import { isUiLang } from './lib/ui-langs';
import {
	headFor,
	headHtml,
	htmlAttrs,
	noscriptHtml,
	SITE_ORIGIN,
	type RouteTitles
} from './lib/shell-head';
import { isLocalHost } from './lib/usage-device';
import { MAX_BODY_BYTES, validatePayload } from './lib/usage-schema';
import { pruneExpired, recordSession, type D1Database } from './lib/usage-store';

interface AssetFetcher {
	fetch(request: Request): Promise<Response>;
}

interface Env {
	ASSETS: AssetFetcher;
	/** Optional so that a deploy without the binding — a preview, a fresh
	 *  clone, `wrangler dev` before `wrangler d1 create` — serves the site
	 *  normally and silently drops beacons, rather than failing a navigation
	 *  over a statistic. */
	USAGE?: D1Database;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
}

interface ScheduledEvent {
	scheduledTime: number;
}

/**
 * The slice of Cloudflare's `HTMLRewriter` this file uses.
 *
 * Hand-declared like `AssetFetcher` and `ExecutionContext` above, and for the
 * same reason: pulling `@cloudflare/workers-types` in would put the whole
 * runtime's surface into a project whose other 50 modules run in a browser,
 * where none of it is true. Three methods is the whole dependency.
 */
interface RewriterElement {
	setInnerContent(content: string, options?: { html?: boolean }): void;
	setAttribute(name: string, value: string): void;
	append(content: string, options?: { html?: boolean }): void;
}

interface ElementHandler {
	element(element: RewriterElement): void;
}

declare class HTMLRewriter {
	on(selector: string, handler: ElementHandler): HTMLRewriter;
	transform(response: Response): Response;
}

/** Where the usage beacon posts. Short because `sendBeacon` bodies are small
 *  and this is one of only two paths the worker answers itself. Note the WAF
 *  custom rule that guards it matches this literal path — see
 *  docs/decisions.md §Usage measurement. */
const BEACON_PATH = '/a';

/**
 * Take one usage beacon.
 *
 * EVERY OUTCOME IS 204. A malformed payload, an unknown schema version, a
 * missing binding, a capped day and a stored row are indistinguishable from
 * the outside. That is deliberate on an open endpoint: distinct answers would
 * tell someone probing it exactly which shape the validator accepts, and the
 * sender is a `sendBeacon` that discarded the response before it arrived.
 */
async function handleBeacon(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const accepted = new Response(null, { status: 204 });
	if (!env.USAGE) return accepted;

	// `wrangler dev --remote` runs this worker, on localhost, against the REAL
	// database — the one path by which a working tree can write production
	// rows. The client refuses to send from a local host and this refuses to
	// store from one; either alone would be enough, and neither costs anything.
	if (isLocalHost(new URL(request.url).hostname)) return accepted;

	// Refuse on the declared length before reading, then again on what
	// actually arrived: `content-length` is the sender's claim, not a fact.
	if (Number(request.headers.get('content-length') ?? '0') > MAX_BODY_BYTES) return accepted;

	let body: unknown;
	try {
		const text = await request.text();
		if (text.length > MAX_BODY_BYTES) return accepted;
		body = JSON.parse(text);
	} catch {
		return accepted;
	}

	const payload = validatePayload(body);
	if (!payload) return accepted;

	// The one field the client does not send and cannot influence. `XX` when
	// Cloudflare has no answer, so the column is never null and the report
	// never has to special-case it.
	const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? 'XX';

	ctx.waitUntil(recordSession(env.USAGE, payload, country, Date.now()));
	return accepted;
}

let manifestPromise: Promise<RouteManifest | undefined> | undefined;
let titlesPromise: Promise<RouteTitles | undefined> | undefined;
let apparatusPromise: Promise<Apparatus | undefined> | undefined;

/**
 * Read one generated JSON asset, once per isolate.
 *
 * A new deploy creates a new isolate, so a module-global promise cannot retain
 * a stale corpus map. Every failure is `undefined` rather than a throw: each
 * caller below has a defined answer for a table it could not read, and a
 * navigation must not fail over one.
 */
function readAsset<T>(
	path: string,
	request: Request,
	assets: AssetFetcher
): Promise<T | undefined> {
	const url = new URL(path, request.url);
	return assets
		.fetch(new Request(url, { headers: { Accept: 'application/json' } }))
		.then(async (response) => (response.ok ? ((await response.json()) as T) : undefined))
		.catch(() => undefined);
}

/** The address-only manifest: which paths exist. Without it the worker hands
 *  every navigation to the asset binding rather than guessing at a 404. */
function getManifest(request: Request, assets: AssetFetcher): Promise<RouteManifest | undefined> {
	return (manifestPromise ??= readAsset<RouteManifest>('/corpus-routes.json', request, assets));
}

/**
 * The names for those same addresses: what each path is called.
 *
 * A SEPARATE FILE AND A SEPARATE PROMISE, deliberately. If this one fails to
 * load, the worker must still answer 200 and 404 correctly — the site is fully
 * usable with a generic `<head>`, which is what it shipped with until now, and
 * unusable if an address stops resolving. Reading them apart makes that
 * degradation structural rather than a `try` someone can drop.
 */
function getTitles(request: Request, assets: AssetFetcher): Promise<RouteTitles | undefined> {
	return (titlesPromise ??= readAsset<RouteTitles>('/route-titles.json', request, assets));
}

/**
 * The descriptions and the cross-references: what this site wrote.
 *
 * A THIRD FILE AND A THIRD PROMISE, on the reasoning that split the first two
 * and one step further along. This table is the largest and the least
 * critical: losing `corpus-routes.json` costs the address, losing
 * `route-titles.json` costs the name, and losing this costs a description and
 * some links on a page that still resolves and still says what it is. Reading
 * them apart is what keeps those three failures three different sizes.
 */
function getApparatus(request: Request, assets: AssetFetcher): Promise<Apparatus | undefined> {
	return (apparatusPromise ??= readAsset<Apparatus>('/apparatus.json', request, assets));
}

/**
 * Whether this method could be asking for a page at all.
 *
 * HEAD COUNTS, and it was excluded until 2026-08-28 — `method === 'GET'`
 * alone. A HEAD then fell through to the asset binding, which has no file at
 * `/catechismus/330`, so **every canonical address in the corpus answered 404
 * to a HEAD while answering 200 to the GET of the same URL**. Nothing on this
 * site issues one, which is why it went unseen; what does is exactly the
 * traffic the address space exists to serve — link checkers, several
 * unfurlers, and crawlers probing before they fetch.
 *
 * Nothing else needs to change to support it: the asset binding answers a HEAD
 * with the shell's headers and a null body on its own, and `notFoundShell`
 * passes that null body through unaltered.
 */
export function isPageMethod(request: Request): boolean {
	return request.method === 'GET' || request.method === 'HEAD';
}

/**
 * Whether the client named HTML in its `Accept`.
 *
 * IT DOES NOT DECIDE WHETHER AN ADDRESS EXISTS. Folding it together with the
 * method into one `isNavigation` test that did is the same defect as the HEAD
 * one above, found the same way and one day later — Search Console reporting
 * `/scriptura` and `/documenta` as 404 while `/` was 200. A request carrying
 * a wildcard `Accept`, or no `Accept` at all, failed that test, fell through to the
 * asset binding, and got a real 404 at every path but `/`, which is the one
 * path this build emits a file for. So **every canonical address in the corpus
 * answered 404 to any client that did not think to ask for HTML** — curl with
 * no flags, several crawlers, and whatever Google fetched these pages with.
 * A browser always asks, which is why nothing a person does could see it.
 *
 * EXISTENCE IS A PROPERTY OF THE URL, and `isCanonicalPath` is the authority
 * on it without reading a single header. So `fetch` below consults the
 * manifest first and reaches for this only to settle what a path naming NO
 * address should get: the app's own not-found UI for a client that wanted a
 * page, and the asset binding's own answer for one that wanted a file.
 */
export function wantsHtml(request: Request): boolean {
	return request.headers.get('accept')?.includes('text/html') === true;
}

/**
 * The Bible's books took Latin slugs on 2026-09-02; this is the 301 off the
 * OSIS spelling that preceded them (`/scriptura/josh/1` -> `/scriptura/iosue/1`).
 *
 * THE ONLY PLACE THE OLD VOCABULARY IS READ, together with the one-shot
 * bookmark migration in `bookmarks.svelte.ts`. Both run BEFORE the grammar:
 * `parseHref` and `isCanonicalPath` know Latin and nothing else, so the site
 * still has exactly one spelling per address and "there is no compatibility
 * layer" stays true of the addresses themselves. What has a compatibility
 * layer is the doormat.
 *
 * A language prefix is carried through rather than dropped, so
 * `/es/scriptura/josh/1` lands on `/es/scriptura/iosue/1` and the entry point
 * then strips itself as usual. One redirect, not two hops through a language
 * the reader would lose on the way.
 *
 * Returns the new pathname, or undefined when there is nothing to redirect.
 */
export function legacyBiblePath(pathname: string): string | undefined {
	const m = /^(\/[a-z]{2})?(\/scriptura\/)([a-z0-9]+)(\/\d+)$/.exec(pathname);
	if (!m) return undefined;
	if (m[1] && !isUiLang(m[1].slice(1))) return undefined;
	const osis = bookFromLegacySlug(m[3]);
	// A book already spelled in Latin is not legacy, and neither is a segment
	// naming no book at all -- that one is a 404 and must stay one.
	if (osis === undefined) return undefined;
	return `${m[1] ?? ''}${m[2]}${bookSlug(osis)}${m[4]}`;
}

/** Fetch the SPA shell without changing the reader-visible address. */
function shellRequest(request: Request): Request {
	const url = new URL(request.url);
	url.pathname = '/';
	url.search = '';
	url.hash = '';
	return new Request(url, request);
}

/** Keep the app's own not-found UI while preserving an HTTP 404 status. */
async function notFoundShell(request: Request, assets: AssetFetcher): Promise<Response> {
	const shell = await assets.fetch(shellRequest(request));
	return new Response(shell.body, {
		status: 404,
		statusText: 'Not Found',
		headers: shell.headers
	});
}

/**
 * Rewrite the shell's `<head>` to describe the address it is being served for.
 *
 * THE ONE PLACE THIS WORKER TOUCHES A RESPONSE BODY, and the line it walks is
 * worth stating: `wrangler.jsonc` says this is "not an application server and
 * never reads or transforms corpus text". It still doesn't. `route-titles.json`
 * holds names — a book's, a document's, a division's — which is the imprint of
 * a work and the same class of fact `sitemap.xml` already publishes an address
 * for. No paragraph, answer or verse reaches the edge, and none may.
 *
 * `HTMLRewriter` rather than reading the body and replacing strings: it
 * streams, so the shell is never buffered, and it parses rather than
 * pattern-matches — a `<title>` inside the long explanatory comment in
 * `app.html` would be a real trap for a regex and is invisible to this.
 *
 * A head this cannot build is not an error. `headFor` returns `undefined` for
 * an address whose name the tables do not carry, and the answer then is the
 * shell exactly as the build emitted it: the page still titles itself at
 * hydration, so what is lost is the name a crawler reads, not the page.
 */
function withHead(
	response: Response,
	pathname: string,
	manifest: RouteManifest,
	titles: RouteTitles | undefined,
	apparatus: Apparatus | undefined
): Response {
	const head = titles && headFor(pathname, manifest, titles, apparatus);
	if (!head) return response;
	const attrs = htmlAttrs(head);
	return new HTMLRewriter()
		.on('html', {
			element(element) {
				if (!attrs) return;
				element.setAttribute('lang', attrs.lang);
				element.setAttribute('dir', attrs.dir);
			}
		})
		.on('title', {
			element(element) {
				element.setInnerContent(head.title);
			}
		})
		.on('meta[name="description"], meta[property="og:description"]', {
			element(element) {
				element.setAttribute('content', head.description);
			}
		})
		.on('meta[property="og:title"]', {
			element(element) {
				element.setAttribute('content', head.title);
			}
		})
		.on('head', {
			element(element) {
				element.append(headHtml(head, SITE_ORIGIN), { html: true });
			}
		})
		.on('body', {
			element(element) {
				element.append(noscriptHtml(head), { html: true });
			}
		})
		.transform(response);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Before the navigation test, and cheaply: the site makes no other POST
		// request of any kind (no forms, no mutation — see the account-free
		// posture in docs/decisions.md), so a POST is either the beacon or is
		// not ours, and only a POST pays for the extra URL parse.
		if (request.method === 'POST') {
			return new URL(request.url).pathname === BEACON_PATH
				? handleBeacon(request, env, ctx)
				: new Response(null, { status: 405 });
		}
		if (!isPageMethod(request)) return env.ASSETS.fetch(request);
		const url = new URL(request.url);
		// The public route grammar has no trailing slash. `run_worker_first`
		// means this needs to happen here rather than relying on the asset
		// platform's HTML canonicalisation to run before us.
		if (url.pathname !== '/' && url.pathname.endsWith('/')) {
			url.pathname = url.pathname.slice(0, -1);
		}
		if (url.href !== request.url) return Response.redirect(url, 308);

		const manifest = await getManifest(request, env.ASSETS);
		if (!manifest) return env.ASSETS.fetch(request);

		// The OSIS book spelling, which stopped being an address on 2026-09-02.
		//
		// 301 and not 308: the method is GET or HEAD by this line, so there is no
		// body a downgrade could lose, and 301 is the one a search engine
		// consolidates link equity through.
		//
		// GATED ON THE TARGET EXISTING, which is why it reads the manifest first.
		// `/scriptura/gen/99` names no chapter in either spelling, and answering
		// it with a redirect to a 404 would publish a second dead address for
		// every dead one — a link checker follows the hop and reports the wrong
		// URL. A path that does not survive the rewrite falls through and 404s
		// where it stands, since the legacy spelling no longer parses.
		const relocated = legacyBiblePath(url.pathname);
		if (relocated && isCanonicalPath(relocated, manifest)) {
			url.pathname = relocated;
			return Response.redirect(url, 301);
		}

		const canonical = isCanonicalPath(url.pathname, manifest);
		// A path that names no address, asked for by a client that did not ask for
		// a page: that is a request for a FILE, and the asset binding owns it. It
		// is also the only thing keeping a new file in `static/` that nobody
		// negated in `wrangler.jsonc` served rather than answered with the app's
		// 404 — which CLAUDE.md promises still works and merely costs an
		// invocation. A canonical path never reaches this line, so no address
		// depends on an `Accept` header.
		if (!canonical && !wantsHtml(request)) return env.ASSETS.fetch(request);

		// The three tables are read apart and none blocks another: the manifest
		// decides the STATUS, the titles only the `<head>`, the apparatus only the
		// description and the links. A missing titles file costs a name and never
		// a page; a missing apparatus costs less again.
		//
		// Together rather than in sequence, and with the shell: they are three
		// subrequests on the FIRST navigation an isolate serves and none on any
		// after it, so the only thing serialising them would buy is latency.
		const [titles, apparatus, shell] = await Promise.all([
			getTitles(request, env.ASSETS),
			getApparatus(request, env.ASSETS),
			canonical ? env.ASSETS.fetch(shellRequest(request)) : notFoundShell(request, env.ASSETS)
		]);
		// A 404 is titled too — it is the one page whose name a crawler reads
		// and acts on — and `/404` is where `STATIC_HEADS` keeps that name.
		return withHead(shell, canonical ? url.pathname : '/404', manifest, titles, apparatus);
	},

	/**
	 * Enforce the usage measurement's retention window, daily.
	 *
	 * THIS IS THE POLICY. A retention period applied only when someone
	 * remembers to run a script is an indeterminate retention period, which is
	 * the one thing the ANPD cookie guide rejects outright — so it runs on a
	 * schedule declared in `wrangler.jsonc`, versioned with the deploy, rather
	 * than living in anyone's memory. `npm run usage -- --prune` still exists,
	 * as a way to force it, not as the mechanism.
	 *
	 * Cheap by construction: one `DELETE` batch a day against rows that are
	 * mostly already gone, on a table bounded at 20,000 rows a day.
	 */
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		if (!env.USAGE) return;
		ctx.waitUntil(pruneExpired(env.USAGE, event.scheduledTime));
	}
};
