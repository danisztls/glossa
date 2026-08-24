/**
 * Copyright display for a work, per the posture decided in
 * docs/research/copyright.md and docs/decisions.md: public-domain works say
 * so plainly; copyrighted works are attributed, on every landing/reading
 * page, to the party that holds the rights.
 *
 * TWO STRINGS, TWO JOBS. `copyright.notice` is the notice the *source page*
 * printed, transcribed byte-for-byte; it is evidence of what the publisher
 * claimed and must never be rewritten or cleaned up here. `copyright.holder`
 * is our own descriptive attribution string, composed for a UI label, so it
 * is fair game to normalize. Until 2026-08-24 the visible label preferred
 * the notice, which put up to 130 characters of legal boilerplate under
 * every chapter and inside every edition menu. It now shows a short label
 * derived from `holder`, and the exact notice moves to the element's
 * `title` — still one hover from the reader, still in the published
 * manifest, no longer shouting.
 */

import type { WorkManifest } from './types';

/**
 * A v1 scraper wrote the public-domain date into the holder string as a
 * trailing parenthetical (`"...Matos Soares (domínio público em 1 Jan
 * 2028)"`) — a status summary in a field that is supposed to be a plain
 * attribution. It was fixed at the source in
 * pipeline/scrapers/bible/matos_soares.py and no longer appears in the built
 * corpus, but the fixtures still carry that shape deliberately, so this stays
 * both as the guard for it and as the thing keeping the fixtures honest about
 * what a v1 manifest looked like. The PD date itself isn't lost: it stays in
 * the manifest's `notes` and in docs/research/copyright.md — this only cleans
 * up the *label* text.
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

/**
 * The short attribution shown to the reader.
 *
 * Holders are recorded as a `/`-separated chain when more than one party has
 * a claim ("Libreria Editrice Vaticana / Dicastery for Communication",
 * "... / United States Catholic Conference"). The label keeps only the first,
 * which in every such case is LEV — the party the Holy See's own decrees put
 * the base copyright with (docs/research/copyright.md §1), with the others
 * being the curial body or territorial conference administering one edition
 * of it. The full chain is not lost: it stays in the manifest, and the
 * source's own notice — which names those parties where the source named
 * them — is what `copyrightNoticeExact` returns for the tooltip.
 */
function shortHolder(holder: string): string {
	return stripTrailingParenthetical(holder.split('/')[0].trim());
}

export function copyrightLabel(manifest: WorkManifest): string {
	if (manifest.copyright.status === 'public-domain') return 'Public domain';
	return manifest.copyright.holder ? `© ${shortHolder(manifest.copyright.holder)}` : 'Copyrighted';
}

/**
 * The notice exactly as the source page printed it, for the `title` on the
 * label above. Undefined when the source printed none — several public-domain
 * works carry a descriptive note here instead, which is worth surfacing the
 * same way, so this does not filter by status.
 */
export function copyrightNoticeExact(manifest: WorkManifest): string | undefined {
	return manifest.copyright.notice ?? undefined;
}
