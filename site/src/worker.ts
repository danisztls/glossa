import { isCanonicalPath, type RouteManifest } from './lib/route-manifest';
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

/**
 * Reads the generated address-only manifest through the asset binding. The
 * module-global promise is shared by requests handled by this worker isolate;
 * a new deploy creates a new isolate, so it cannot retain an old corpus map.
 */
function getManifest(request: Request, assets: AssetFetcher): Promise<RouteManifest | undefined> {
	if (!manifestPromise) {
		const url = new URL('/corpus-routes.json', request.url);
		manifestPromise = assets
			.fetch(new Request(url, { headers: { Accept: 'application/json' } }))
			.then(async (response) =>
				response.ok ? ((await response.json()) as RouteManifest) : undefined
			)
			.catch(() => undefined);
	}
	return manifestPromise;
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

		return isCanonicalPath(url.pathname, manifest)
			? env.ASSETS.fetch(shellRequest(request))
			: notFoundShell(request, env.ASSETS);
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
