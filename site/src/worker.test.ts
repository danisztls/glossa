import { describe, expect, it } from 'vitest';
import type { RouteManifest } from './lib/route-manifest';

/**
 * `HTMLRewriter` is a Cloudflare runtime global with no Node equivalent, and
 * `withHead` in the worker constructs one on every navigation. A pass-through
 * stub is the right stand-in HERE because this file tests ROUTING — which
 * status each address and method gets — and nothing about the markup. What the
 * rewrite actually writes is `headFor`/`headHtml`/`noscriptHtml`, which are
 * pure and tested against strings in `shell-head.test.ts`; the transform
 * between them is Cloudflare's, and a reimplementation of it here would be
 * asserting our own stub.
 *
 * Installed before the import, since the worker module reads the global at
 * call time but the import itself must not fail.
 */
class PassThroughRewriter {
	on() {
		return this;
	}
	transform(response: Response) {
		return response;
	}
}
(globalThis as Record<string, unknown>).HTMLRewriter = PassThroughRewriter;

const { default: worker, isPageMethod, wantsHtml } = await import('./worker');

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
	socialDoctrine: [1, 160],
	socialDoctrineChapters: [1, 160],
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
		// Deliberately absent, and the site must be entirely serviceable
		// without it: the titles table decides what a page is CALLED, the route
		// manifest decides whether it exists. Losing the first costs a name;
		// losing the second would cost the address.
		if (pathname === '/route-titles.json') return new Response('missing', { status: 404 });
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

describe('request classification', () => {
	it('accepts HEAD as well as GET', () => {
		for (const method of ['GET', 'HEAD']) {
			const request = new Request('https://glossacatholica.org/catechismus/330', { method });
			expect(isPageMethod(request), method).toBe(true);
		}
	});

	/** `wantsHtml` answers for the CLIENT and never for the address, which is
	 *  the whole of the fix below: a wildcard `Accept` and an absent one both
	 *  mean the client named nothing, not that the URL does not exist. */
	it('reads text/html out of an Accept header and nothing more', () => {
		const accepts = (accept?: string) =>
			wantsHtml(
				new Request('https://glossacatholica.org/scriptura', {
					headers: accept === undefined ? {} : { accept }
				})
			);
		expect(accepts('text/html,application/xhtml+xml')).toBe(true);
		expect(accepts('*/*')).toBe(false);
		expect(accepts('image/png')).toBe(false);
		expect(accepts(undefined)).toBe(false);
	});
});

describe('navigation', () => {
	it('serves the shell for every kind of canonical address', async () => {
		const paths = [
			'/',
			'/catechismus',
			'/scriptura/genesis/1',
			'/scriptura/genesis/0',
			'/catechismus/330',
			'/catechismus/caput/325',
			'/catechismus/compendium/45',
			'/catechismus/compendium/caput/40',
			'/documenta/lumen-gentium',
			'/preces/pater-noster',
			'/doctores/summa/i/2'
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
		for (const path of [
			'/',
			'/catechismus/330',
			'/doctores/summa/i/2',
			'/documenta/lumen-gentium'
		]) {
			const get = await navigate(path, 'GET');
			const head = await navigate(path, 'HEAD');
			expect(head.status, path).toBe(get.status);
		}
	});

	it('404s a well-formed address the corpus does not carry, on both methods', async () => {
		for (const path of ['/catechismus/9999', '/scriptura/genesis/99', '/documenta/no-such-thing']) {
			expect((await navigate(path, 'GET')).status, path).toBe(404);
			expect((await navigate(path, 'HEAD')).status, `HEAD ${path}`).toBe(404);
		}
	});

	/** The chrome pages times the interface languages. These KEEP their prefix:
	 *  they are published in every language and declare an `hreflang` cluster. */
	it('serves the language-prefixed chrome pages', async () => {
		for (const path of ['/pt', '/ar/catechismus', '/la/doctores/summa', '/sv/colophon']) {
			expect((await navigate(path)).status, path).toBe(200);
		}
	});

	/** A reading address under a prefix is an ENTRY POINT (2026-09-02): served,
	 *  so the language can be taken and stored, and then stripped in the bar by
	 *  `[uilang=uilang]/[...rest]`. It was a 404 until then, which is the form a
	 *  reader extrapolates from `/pt/catechismus` and so the defect this closed. */
	it('serves a reading address under a language prefix', async () => {
		for (const path of ['/pt/catechismus/330', '/es/scriptura/genesis/1']) {
			expect((await navigate(path)).status, path).toBe(200);
		}
	});

	it('refuses a prefix that is not a language, a doubled one, and a bad address under a good prefix', async () => {
		for (const path of [
			'/xx',
			'/xx/catechismus',
			'/xx/catechismus/330',
			// One prefix, never two: `parseLangEntry` peels exactly one segment,
			// or an address would have 34 x 34 spellings.
			'/es/pt/catechismus/330',
			'/pt/catechismus/9999',
			'/pt/scriptura/nonesuch/1',
			// `/signata` is `noindex` and outside `CHROME_PATHS`, but it is still
			// a real path, so a prefix on it is an entry point like any other.
			'/pt/signata/1'
		]) {
			expect((await navigate(path)).status, path).toBe(404);
		}
	});

	/**
	 * The Bible's books took Latin slugs on 2026-09-02, and the OSIS spelling
	 * they replaced gets a 301 here — the ONLY place the old vocabulary is read
	 * besides the bookmark migration. Both run before the grammar, so
	 * `parseHref` still knows exactly one spelling per address.
	 */
	describe('the OSIS book spelling', () => {
		it('301s to the Latin slug, keeping the query', async () => {
			const res = await navigate('/scriptura/gen/1');
			expect(res.status).toBe(301);
			expect(res.headers.get('location')).toBe('https://glossacatholica.org/scriptura/genesis/1');

			const span = await navigate('/scriptura/gen/1?v=1-3');
			expect(span.headers.get('location')).toBe(
				'https://glossacatholica.org/scriptura/genesis/1?v=1-3'
			);
		});

		it('carries a language prefix through rather than dropping it', async () => {
			const res = await navigate('/es/scriptura/gen/1');
			expect(res.status).toBe(301);
			expect(res.headers.get('location')).toBe(
				'https://glossacatholica.org/es/scriptura/genesis/1'
			);
		});

		/** A redirect to a 404 publishes a second dead address for every dead
		 *  one, and a link checker then reports the wrong URL. */
		it('404s where it stands when the target does not exist either', async () => {
			expect((await navigate('/scriptura/gen/99')).status).toBe(404);
			expect((await navigate('/scriptura/nonesuch/1')).status).toBe(404);
		});

		it('leaves an address already spelled in Latin alone', async () => {
			expect((await navigate('/scriptura/genesis/1')).status).toBe(200);
		});
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

	/** The degradation the two-file split exists to guarantee. `ASSETS` above
	 *  serves no `/route-titles.json`, so every assertion in this file has
	 *  already been made without one. */
	it('serves every address unchanged when the titles table cannot be read', async () => {
		expect((await navigate('/catechismus/330')).status).toBe(200);
		expect((await navigate('/catechismus/9999')).status).toBe(404);
	});

	/**
	 * THE SAME REGRESSION IN ITS SECOND FORM, and it shipped: the worker read
	 * the `Accept` header to decide whether a URL EXISTED. A client sending a
	 * wildcard `Accept`, or none at all, fell through to the asset binding —
	 * which has a file at `/` and at no other address — so the whole corpus
	 * answered 404 to curl, to crawlers, and to whatever Google fetched
	 * `/scriptura` and `/documenta` with while reporting them as not found. `/`
	 * answering 200 throughout is what made it look like a routing problem
	 * rather than a header one.
	 */
	it('answers a canonical address whatever the client accepts', async () => {
		const accepts = ['text/html,application/xhtml+xml', '*/*', 'image/avif,image/webp,*/*', ''];
		for (const path of ['/', '/scriptura', '/documenta', '/catechismus/330', '/pt/preces']) {
			for (const accept of accepts) {
				const response = await worker.fetch(
					new Request(`https://glossacatholica.org${path}`, {
						headers: accept ? { accept } : {}
					}),
					env,
					ctx
				);
				expect(response.status, `${path} <- ${accept || '(no accept)'}`).toBe(200);
			}
		}
	});

	/** And the other side of it: a path naming no address still belongs to the
	 *  asset binding unless the client wanted a page, so a file in `static/`
	 *  that nothing negated in `wrangler.jsonc` keeps being served. */
	it('leaves a non-address path to the asset binding when no page was asked for', async () => {
		for (const accept of ['*/*', 'image/png', '']) {
			const response = await worker.fetch(
				new Request('https://glossacatholica.org/og.png', {
					headers: accept ? { accept } : {}
				}),
				env,
				ctx
			);
			expect(await response.text(), accept || '(no accept)').toBe('no such asset');
		}
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
