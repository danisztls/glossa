import { isCanonicalPath, type RouteManifest } from './lib/route-manifest';
import { headFor, headHtml, noscriptHtml, SITE_ORIGIN, type RouteTitles } from './lib/shell-head';
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
 * Whether this request is asking for a page rather than a file.
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
export function isNavigation(request: Request): boolean {
	return (
		(request.method === 'GET' || request.method === 'HEAD') &&
		request.headers.get('accept')?.includes('text/html') === true
	);
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
	titles: RouteTitles | undefined
): Response {
	const head = titles && headFor(pathname, manifest, titles);
	if (!head) return response;
	return new HTMLRewriter()
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
		if (!isNavigation(request)) return env.ASSETS.fetch(request);
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

		// Both tables are read together and neither blocks the other: the
		// manifest decides the STATUS and the titles only the `<head>`, so a
		// missing titles file costs a name and never a page.
		const titles = await getTitles(request, env.ASSETS);
		const canonical = isCanonicalPath(url.pathname, manifest);
		const shell = await (canonical
			? env.ASSETS.fetch(shellRequest(request))
			: notFoundShell(request, env.ASSETS));
		// A 404 is titled too — it is the one page whose name a crawler reads
		// and acts on — and `/404` is where `STATIC_HEADS` keeps that name.
		return withHead(shell, canonical ? url.pathname : '/404', manifest, titles);
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
