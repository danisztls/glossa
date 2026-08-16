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
 * artifact, fixed at the source in pipeline/scrapers/matos_soares.py so
 * future scrapes come out clean). Re-scraping the existing corpus isn't on
 * the table, so strip that trailing parenthetical here too. The PD date
 * itself isn't lost: it stays documented in the manifest's `notes` and in
 * docs/research/copyright.md — this only cleans up the *label* text.
 */
function stripTrailingParenthetical(holder: string): string {
	return holder.replace(/\s*\([^()]*\)\s*$/, '');
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
