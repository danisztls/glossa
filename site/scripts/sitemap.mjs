/**
 * Build `static/sitemap.xml` from the generated route manifest.
 *
 * The site is one SPA shell (`+layout.ts` sets `ssr = false`), so every
 * address returns the same document and every in-page cross-reference link is
 * written by JavaScript. A crawler that renders can therefore discover the
 * corpus only by walking a link graph it must execute the app to see, and a
 * crawler that does not render discovers nothing at all. This file replaces
 * that walk with a flat enumeration — the one place the whole address space is
 * stated as URLs rather than as a grammar.
 *
 * Derived from the SAME `routeManifest` object the edge worker reads, in the
 * same pass that writes it, so the sitemap cannot advertise an address
 * `src/worker.ts` would 404. `assertCanonical` re-checks that through
 * `isCanonicalPath` rather than trusting the derivation, because the two
 * consumers are the reason the manifest exists and a sitemap that disagrees
 * with the worker is worse than no sitemap.
 *
 * Every URL is produced by `hrefFor`, which `address.ts` calls "the only place
 * a canonical URL is written". Building the strings here instead would be a
 * second spelling of the grammar, and the first one to drift would drift
 * silently — a sitemap is read by machines that never complain.
 *
 * `<lastmod>` comes from `scripts/lastmod.json`, a committed ledger of one
 * fingerprint per address — never from the build clock. The objection that kept
 * it out of this file until now still stands and is what that ledger exists to
 * satisfy: a build-time value would mark all ~5,800 URLs as changed on every
 * deploy, and Google discounts a lastmod it catches lying, for the whole file
 * rather than the one entry. See `scripts/lastmod.mjs`.
 *
 * The static pages below carry no `lastmod` at all. They are chrome, not corpus
 * — their content changes with the app, which the ledger deliberately does not
 * fingerprint — and the element is per-URL optional. Saying nothing about them
 * is the only claim available that is certainly true.
 *
 * Still deliberately no `<changefreq>` or `<priority>`: both are ignored by
 * every major crawler.
 */

import { hrefFor } from '../src/lib/address.ts';
import { isCanonicalPath } from '../src/lib/route-manifest.ts';

/**
 * @typedef {import('../src/lib/route-manifest.ts').RouteManifest} RouteManifest
 */

export const ORIGIN = 'https://glossacatholica.org';

/** A sitemap file may hold at most 50,000 URLs (sitemaps.org §index). */
const MAX_URLS = 50_000;

/**
 * The static pages worth enumerating, in `STATIC_PATHS` order.
 *
 * `/signata` and `/404` are excluded on purpose, and for different reasons.
 * The bookmark library is real but its contents live in the reader's own
 * localStorage, so there is nothing there for anyone but that reader; `/404`
 * is a route that exists to render a status, not an address to visit.
 */
const STATIC_URLS = [
	'/',
	'/scriptura',
	'/catechismus',
	'/documenta',
	'/summa',
	'/preces',
	'/colophon'
];

/**
 * Every canonical address in the corpus, as root-relative paths.
 *
 * Order follows the manifest's own (already sorted) arrays, so the output is
 * stable across builds: a rebuild that changes no corpus data produces a
 * byte-identical file, which is what lets Wrangler skip re-uploading it.
 *
 * @param {RouteManifest} manifest
 * @returns {string[]}
 */
export function sitemapPaths(manifest) {
	const paths = [...STATIC_URLS];

	for (const [osis, chapters] of Object.entries(manifest.bible)) {
		// Chapter 0 is a book introduction where an edition has one
		// (docs/corpus-schema.md §Book introductions). It is an address on the
		// same terms as any other chapter, so it is listed on those terms too.
		for (const chapter of chapters) paths.push(hrefFor({ kind: 'bible', osis, chapter }));
	}
	for (const n of manifest.cccChapters) paths.push(hrefFor({ kind: 'cccChapter', n }));
	for (const n of manifest.ccc) paths.push(hrefFor({ kind: 'ccc', n }));
	for (const n of manifest.compendiumChapters)
		paths.push(hrefFor({ kind: 'compendiumChapter', n }));
	for (const n of manifest.compendium) paths.push(hrefFor({ kind: 'compendium', n }));
	for (const slug of manifest.documents) paths.push(hrefFor({ kind: 'document', slug }));
	for (const slug of manifest.prayers) paths.push(hrefFor({ kind: 'prayer', slug }));
	for (const [part, questions] of Object.entries(manifest.summa)) {
		// An article is a fragment on its question's page (`#a3`), and a
		// fragment is not a separate address — the question is the unit here.
		for (const question of questions) {
			paths.push(hrefFor({ kind: 'summa', part, question, article: null }));
		}
	}

	return paths;
}

/**
 * Throw unless the worker would answer 200 for every path. Cheap, and the only
 * check that can catch the sitemap and the route manifest drifting apart.
 *
 * @param {string[]} paths
 * @param {RouteManifest} manifest
 */
export function assertCanonical(paths, manifest) {
	const strays = paths.filter((p) => !isCanonicalPath(p, manifest));
	if (strays.length) {
		throw new Error(
			`sitemap: ${strays.length} path(s) the edge worker would 404: ${strays.slice(0, 5).join(', ')}`
		);
	}
}

/**
 * `&`, `<` and `>` are the three the spec requires escaped in a <loc>.
 *
 * @param {string} s
 * @returns {string}
 */
function escapeXml(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @param {RouteManifest} manifest
 * @param {Record<string, string>} [dates] Address -> ISO date, from the lastmod
 *   ledger. An address absent here is emitted without `<lastmod>`, which is the
 *   correct output for the static pages and for a build that has no ledger yet.
 * @returns {string}
 */
export function sitemapXml(manifest, dates = {}) {
	const paths = sitemapPaths(manifest);
	assertCanonical(paths, manifest);
	if (paths.length > MAX_URLS) {
		throw new Error(
			`sitemap: ${paths.length} URLs exceeds the ${MAX_URLS} single-file limit — split into a sitemap index`
		);
	}
	const entries = paths.map((p) => {
		const loc = `<loc>${escapeXml(ORIGIN + p)}</loc>`;
		const date = dates[p];
		return `\t<url>${loc}${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		'</urlset>',
		''
	].join('\n');
}
