import { isCanonicalPath, type RouteManifest } from './lib/route-manifest';

interface AssetFetcher {
	fetch(request: Request): Promise<Response>;
}

interface Env {
	ASSETS: AssetFetcher;
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

function isNavigation(request: Request): boolean {
	return request.method === 'GET' && request.headers.get('accept')?.includes('text/html') === true;
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
	async fetch(request: Request, env: Env): Promise<Response> {
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
	}
};
