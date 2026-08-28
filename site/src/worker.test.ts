import { describe, expect, it } from 'vitest';
import worker, { isNavigation } from './worker';
import type { RouteManifest } from './lib/route-manifest';

/**
 * Enough of a corpus for the edge to have an opinion about an address. The
 * numbers are arbitrary; what matters is that one of each kind exists and one
 * of each kind does not.
 */
const manifest: RouteManifest = {
	version: 1,
	workCount: 1,
	contentAssetCount: 1,
	bible: { gen: [0, 1] },
	ccc: [330],
	cccChapters: [325],
	compendium: [45],
	compendiumChapters: [40],
	documents: ['lumen-gentium'],
	prayers: ['pater-noster'],
	summa: { i: [2] }
};

const SHELL =
	'<!doctype html><html lang="en"><head><title>Glossa Catholica</title></head><body></body></html>';

/**
 * Stands in for the asset binding: it holds the route manifest, the shell at
 * `/`, and nothing else — which is the whole point. Every canonical reader
 * address is a path the platform has no file for, so anything the worker does
 * not route to `/` itself comes back 404, exactly as it does in production.
 */
const ASSETS = {
	async fetch(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname === '/corpus-routes.json') {
			return new Response(JSON.stringify(manifest), {
				headers: { 'content-type': 'application/json' }
			});
		}
		if (pathname === '/') {
			return new Response(SHELL, { headers: { 'content-type': 'text/html' } });
		}
		return new Response('no such asset', { status: 404 });
	}
};

const env = { ASSETS };
const ctx = { waitUntil: () => {} };

function navigate(path: string, method = 'GET'): Promise<Response> {
	return worker.fetch(
		new Request(`https://glossacatholica.org${path}`, {
			method,
			headers: { accept: 'text/html,application/xhtml+xml' }
		}),
		env,
		ctx
	);
}

describe('isNavigation', () => {
	it('accepts HEAD as well as GET', () => {
		for (const method of ['GET', 'HEAD']) {
			const request = new Request('https://glossacatholica.org/catechismus/330', {
				method,
				headers: { accept: 'text/html' }
			});
			expect(isNavigation(request), method).toBe(true);
		}
	});

	it('ignores a request that is not asking for a page', () => {
		const asset = new Request('https://glossacatholica.org/og.png', {
			headers: { accept: 'image/png' }
		});
		expect(isNavigation(asset)).toBe(false);
	});
});

describe('navigation', () => {
	it('serves the shell for every kind of canonical address', async () => {
		const paths = [
			'/',
			'/catechismus',
			'/scriptura/gen/1',
			'/scriptura/gen/0',
			'/catechismus/330',
			'/catechismus/caput/325',
			'/catechismus/compendium/45',
			'/catechismus/compendium/caput/40',
			'/documenta/lumen-gentium',
			'/preces/pater-noster',
			'/summa/i/2'
		];
		for (const path of paths) {
			expect((await navigate(path)).status, path).toBe(200);
		}
	});

	/**
	 * THE REGRESSION, and it shipped: `isNavigation` required `GET` until
	 * 2026-08-28, so a HEAD fell through to the asset binding — which has no
	 * file at any reader address — and every canonical address in the corpus
	 * answered 404 to the HEAD of a URL it answered 200 to on GET. Nothing on
	 * this site issues a HEAD, which is why it went unseen for as long as the
	 * worker has existed; link checkers and unfurlers issue little else.
	 */
	it('answers a HEAD exactly as it answers the GET of the same address', async () => {
		for (const path of ['/', '/catechismus/330', '/summa/i/2', '/documenta/lumen-gentium']) {
			const get = await navigate(path, 'GET');
			const head = await navigate(path, 'HEAD');
			expect(head.status, path).toBe(get.status);
		}
	});

	it('404s a well-formed address the corpus does not carry, on both methods', async () => {
		for (const path of ['/catechismus/9999', '/scriptura/gen/99', '/documenta/no-such-thing']) {
			expect((await navigate(path, 'GET')).status, path).toBe(404);
			expect((await navigate(path, 'HEAD')).status, `HEAD ${path}`).toBe(404);
		}
	});

	it('404s an address the grammar does not recognise at all', async () => {
		expect((await navigate('/bible/gen/1')).status).toBe(404);
		expect((await navigate('/compendium/45')).status).toBe(404);
	});

	/** A 404 still has to be the app's own not-found UI, not the platform's. */
	it('serves the shell body with the 404 status', async () => {
		const response = await navigate('/catechismus/9999');
		expect(response.status).toBe(404);
		expect(await response.text()).toBe(SHELL);
	});

	it('leaves anything that is not a navigation to the asset binding', async () => {
		const response = await worker.fetch(
			new Request('https://glossacatholica.org/og.png', { headers: { accept: 'image/png' } }),
			env,
			ctx
		);
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('no such asset');
	});
});
