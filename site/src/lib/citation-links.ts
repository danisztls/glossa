/**
 * Which anchor under an event is a citation, and which gestures may peek at
 * it instead of following it.
 *
 * THE RULE INVERTED, AND THAT IS THE POINT. It used to be an allowlist of two
 * classes, on the argument that hovering is free and tapping is not: a hover
 * previews every internal content link the site emits, a tap previews only
 * where a glance is the likely intent. The argument was right and the
 * allowlist was the wrong instrument for it. Citations are generated in
 * something like a dozen places and only two of them wear a class the list
 * knew — so a prayer's "See also" loci, a "Cited in" panel's chips, a CCC
 * paragraph's `related` numbers, a catena note's attribution, the `†` that
 * sources a reading order, all previewed on a desktop and none of them on a
 * phone, which is where most of the reading happens. Every one of those was a
 * surface that had to REMEMBER a global feature existed, and none of them
 * did.
 *
 * So the marker names navigation, which is the closed set, and everything
 * else is a citation by default — the same shape `LinkPreview` already uses
 * for the hover path, where `data-link-preview="off"` is the only thing that
 * opts out. A new reference surface gets its peek for free; a new table of
 * contents says so once, on its `<nav>`.
 *
 * `usage.ts` DOES NOT USE THIS, and its comment says why: it counts citations
 * followed against a series, so widening what counts is a decision with a
 * date on it rather than a consequence of a change to the card. It still
 * names the two classes this replaced.
 *
 * THREE STATES, INHERITED FROM ANY ANCESTOR, because a table of contents
 * should say it once rather than per row:
 *
 * | `data-link-preview` | hover | tap  | what it marks                     |
 * | ------------------- | ----- | ---- | --------------------------------- |
 * | absent              | peek  | peek | a citation                        |
 * | `"hover"`           | peek  | GO   | a destination worth a free glance |
 * | `"off"`             | -     | GO   | chrome; the reader is already there |
 *
 * `"off"` beats `"hover"` wherever both are in scope: it is checked against
 * every ancestor rather than the nearest marked one, so a region that opted
 * out cannot be opted back in by something nested inside it.
 *
 * WHY `"hover"` IS NOT JUST `"off"`, for the jump box and the reading picks:
 * those name a destination the reader chose in order to GO there, so taxing
 * the tap with a peek is an obstacle — but a cursor resting on one costs
 * nothing and the glance is genuinely useful. The two gestures want different
 * answers, which is exactly what the middle row is for. Breadcrumbs, prev/next
 * and the sidebar tables of contents keep `"off"`: what they name is the page
 * the reader is standing on, one level up or one unit over, so there is
 * nothing to peek at in either gesture.
 */

import { previewTarget, type PreviewTarget } from './address';

export interface CitationLink {
	el: HTMLAnchorElement;
	target: PreviewTarget;
	/** `citation`: peek on hover and on tap. `destination`: peek on hover
	 *  only — the reader picked it in order to leave, and a peek in the way of
	 *  the tap is an obstacle rather than a feature. */
	kind: 'citation' | 'destination';
}

/**
 * The anchor an event bubbled through, when it names previewable content and
 * has not opted out.
 *
 * `undefined` covers all three ways to not be one: the event was not over an
 * `<a href>` at all, the href names nothing this site can preview
 * (`previewTarget` — an external URL, a bare landing page, a prayer), or the
 * link sits under `data-link-preview="off"`.
 */
export function citationLink(start: EventTarget | null): CitationLink | undefined {
	if (!(start instanceof Element)) return undefined;
	const el = start.closest('a[href]');
	if (!(el instanceof HTMLAnchorElement)) return undefined;
	if (el.closest('[data-link-preview="off"]')) return undefined;
	const target = previewTarget(el.getAttribute('href'));
	if (!target) return undefined;
	return {
		el,
		target,
		kind: el.closest('[data-link-preview="hover"]') ? 'destination' : 'citation'
	};
}
