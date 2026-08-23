/**
 * Copyright display for a work, per the posture decided in
 * docs/research/copyright.md and docs/decisions.md: public-domain works
 * say so plainly; copyrighted works display their exact notice (verbatim,
 * as required by the rights holders) on every landing/reading page.
 *
 * IMPORTANT: `copyright.notice`, when present, is reproduced byte-for-byte —
 * it is the rights holder's own required wording and must never be rewritten
 * or cleaned up here. `copyright.holder` is different: it's our own
 * descriptive attribution string (composed for a UI label), so it's fair
 * game to normalize. That distinction is why only `holder` gets touched
 * below.
 */

import type { WorkManifest } from './types';

/**
 * The already-built `bible.matos-soares.pt` corpus still carries a holder
 * string with the public-domain date parenthesized onto the end
 * (`"...Matos Soares (domínio público em 1 Jan 2028)"` — a v1 scraper
 * artifact, fixed at the source in pipeline/scrapers/bible/matos_soares.py so
 * future scrapes come out clean). Re-scraping the existing corpus isn't on
 * the table, so strip that trailing parenthetical here too. The PD date
 * itself isn't lost: it stays documented in the manifest's `notes` and in
 * docs/research/copyright.md — this only cleans up the *label* text.
 */
function stripTrailingParenthetical(holder: string): string {
	return holder.replace(/\s*\([^()]*\)\s*$/, '');
}

/**
 * The page this work's text was actually taken from, for the "source" link
 * beside its copyright notice (`CopyrightNotice.svelte`).
 *
 * `sources[0]` rather than a search for a "primary" one: the array is written
 * by the scrapers in the order they fetched, so the first entry is the work's
 * entry point in every case the corpus currently has — the single document
 * page for a Bible book or a Magisterium document, and, for the CCC's
 * hundreds-of-pages mirror, the mirror's own table of contents
 * (`_INDEX.HTM`), which `ccc.py` now puts at the head of the list precisely
 * because it is what this link wants. It used to be `__P1.HTM`, the crawl's
 * first CONTENT page — the Prologue — which is a true source of the text and
 * a useless place to send a reader looking for "the original".
 *
 * A work with no sources at all is possible per the schema, so this returns
 * undefined rather than assuming.
 */
export function sourceUrl(manifest: WorkManifest): string | undefined {
	return manifest.sources?.[0]?.url;
}

/**
 * Display text for that link — the bare hostname ("vatican.va"), not the full
 * URL. The URLs run to 120+ characters of path and would swamp the notice
 * they're attached to; the host is what tells a reader whether this text came
 * from the Holy See's own servers, which is the question the link exists to
 * answer. `www.` is stripped as noise.
 */
export function sourceHost(manifest: WorkManifest): string | undefined {
	const url = sourceUrl(manifest);
	if (!url) return undefined;
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		// A malformed URL in a manifest shouldn't take a reading page down.
		return undefined;
	}
}

export function copyrightLabel(manifest: WorkManifest): string {
	if (manifest.copyright.status === 'public-domain') return 'Public domain';
	return (
		manifest.copyright.notice ??
		(manifest.copyright.holder
			? `© ${stripTrailingParenthetical(manifest.copyright.holder)}`
			: 'Copyrighted')
	);
}
