/**
 * What a highlighted passage IS, once the reader lets go of the mouse.
 *
 * A SELECTION IS NOT AN ADDRESS, and this site's bookmarks are addresses and
 * nothing else -- `{href, addedAt}`, edition-free, with the citation and the
 * text re-derived from whatever edition the reader is in when they come back
 * (`bookmarks.svelte.ts`). So a selection has to be resolved to one before it
 * can be marked, and the resolution is the whole of this module: the unit the
 * highlight lies in, which is the unit its number would have bookmarked had
 * the reader clicked the number instead.
 *
 * That loses the exact words, deliberately. Storing character offsets would
 * buy precision that survives nothing -- an offset into the Clementina names
 * a different phrase in the Douay-Rheims and no phrase at all in the
 * Portuguese -- and a bookmark that stops following the reader across
 * editions is the one property this store was built to have. What the words
 * are for is the COPY, which happens now, in the edition on screen, and needs
 * no storage at all.
 *
 * THE RANGE RULE IS BIBLE-ONLY because the grammar is. `hrefFor` already
 * writes `?v=3-5#v3` for a cited extent, so a highlight drawn across three
 * verses saves the passage rather than its first verse; no other work has a
 * way to spell "sections 4 through 6", and minting one for this would put a
 * new address shape into the sitemap, the edge worker and the route manifest
 * to serve a gesture. Everything else saves the unit the selection STARTS in
 * -- which is also the right answer for the cases where an extent is
 * meaningless: a highlight dragged across the two columns of compare mode, or
 * from the end of one work's page into another's.
 *
 * Pure, and imports only `address.ts`: the DOM half -- which element a
 * selection is inside, what a `Range` measures -- is `SelectionMenu.svelte`'s,
 * and this half is the part worth testing without a layout.
 */

import { hrefFor, parseHref } from './address';
import { EDITION_PARAM } from './edition-pin';

/**
 * Everything inside the reading text that is APPARATUS rather than the text.
 *
 * A verse's `<span>` contains its own reference number, so a reader who
 * selects the whole of Genesis 1:3 hands us `"3In the beginning…"` -- a stray
 * digit welded to the first word of every quotation the site would ever
 * produce. Footnote and commentary markers are the same problem one
 * superscript at a time, and the margin note is a whole sentence of somebody
 * else's apparatus landing in the middle of a quoted paragraph.
 *
 * Selectors rather than a `data-` attribute the components opt into: these
 * five classes are already what the CSS reaches for, they are already the
 * definition of "not the text", and a parallel marker would be a second thing
 * to remember to add to the sixth kind of marker.
 */
export const APPARATUS_SELECTOR =
	'.reference-number, .note-marker, .citation-marker, .commentary-submarker, .margin-note';

/**
 * The address a selection running from one unit to another saves.
 *
 * Takes the two units' canonical addresses rather than the DOM nodes, so the
 * one decision worth checking is checkable. `start` is the answer in every
 * case the grammar cannot improve on -- see the docblock: same unit, two
 * works, two columns, a work with no range spelling.
 */
export function spanAddress(start: string, end: string): string {
	if (start === end) return start;

	const from = parseHref(start);
	const to = parseHref(end);
	if (!from || !to) return start;
	if (from.kind !== 'bible' || to.kind !== 'bible') return start;
	if (from.osis !== to.osis || from.chapter !== to.chapter) return start;

	// A verse address parses as a one-verse extent (`from === to`), so the
	// span is the first's opening and the last's close. `hrefFor` writes the
	// query only when they differ, which makes a selection that turned out to
	// lie in one verse after all identical to that verse's own address --
	// bookmarking it twice is one row, not two.
	const first = from.from;
	const last = to.to ?? to.from;
	if (first === undefined || last === undefined || last <= first) return start;
	return hrefFor({ kind: 'bible', osis: from.osis, chapter: from.chapter, from: first, to: last });
}

/**
 * The selected words as a quotation.
 *
 * Prose in the reader is laid out across elements and indented source, so the
 * raw text of a range carries the newlines and runs of tabs that separate one
 * verse's markup from the next. A quotation pasted into a note wants one
 * paragraph; collapsing every run of whitespace to a single space is what
 * makes the two verses either side of a line break read as one sentence.
 */
export function tidyQuote(raw: string): string {
	return raw.replace(/\s+/g, ' ').trim();
}

/**
 * Text and citation, in the order a reader pastes them.
 *
 * The quotation first and the address under it, which is `AnchorMenu`'s
 * arrangement and for its reason: what lands in a message or a note should
 * read as the words, with the reference as the footer it would have on a
 * page. Deliberately the same shape as the unit copy -- a reader who copies a
 * whole verse from its number and a phrase from a highlight is doing one
 * thing twice, and two formats would make it look like two.
 */
export function quoteWithCitation(text: string, citation: string): string {
	return citation ? `${text}\n— ${citation}` : text;
}

/**
 * How long a quotation may be spelled out whole in a text directive before it
 * is written as its two ends instead.
 *
 * A directive is a URL somebody pastes into a message, so its length is part
 * of what it is. Two hundred characters is roughly two sentences — past that
 * the link stops looking like a link, and `textStart,textEnd` names the same
 * span in a fraction of the room.
 */
const WHOLE_QUOTE_MAX = 200;

/** Words taken from each end when a quotation is too long to spell out. Enough
 *  that the pair is unique in a paragraph; few enough to stay short. */
const EDGE_WORDS = 8;

/**
 * The reader's own words as a text directive — `text=…`, the fragment
 * syntax browsers implement natively.
 *
 * THE BROWSER DOES THE FINDING, which is the whole reason this is worth
 * having: no offsets to store, no scheme to version, no mark for this site to
 * paint, and a highlight that survives the text being re-chunked or the
 * markup around it changing. What it costs is that the quotation travels IN
 * the URL — a shared link now carries the sentence it points at, which is
 * longer and less opaque than an address — and that a browser without support
 * (Firefox before 131) simply lands on the unit and highlights nothing, which
 * is the failure this can afford.
 *
 * IT IS FIND-THE-TEXT, NOT AN OFFSET, so it is only as deterministic as the
 * words are distinctive. That is what `EDITION_PARAM` is for: the same words
 * in the same edition. Where a short phrase repeats within the unit the
 * browser lands on the first, which is why a long quotation is written as its
 * two ends rather than truncated to its first — a pair pins the span where a
 * prefix only pins its opening.
 *
 * `-`, `,` and `&` delimit the directive itself, so they are percent-encoded.
 * `encodeURIComponent` covers the last two and leaves the hyphen, which is
 * unreserved in a URL and reserved in here.
 */
export function textDirective(quote: string): string {
	const text = tidyQuote(quote);
	if (!text) return '';
	const words = text.split(' ');
	if (text.length <= WHOLE_QUOTE_MAX || words.length <= EDGE_WORDS * 2) {
		return `text=${encodeDirectivePart(text)}`;
	}
	const start = words.slice(0, EDGE_WORDS).join(' ');
	const end = words.slice(-EDGE_WORDS).join(' ');
	return `text=${encodeDirectivePart(start)},${encodeDirectivePart(end)}`;
}

function encodeDirectivePart(part: string): string {
	return encodeURIComponent(part).replace(/-/g, '%2D');
}

/**
 * The address a highlight copies: the unit's canonical URL, the edition it was
 * read in, and the words themselves.
 *
 * All three parts are needed and none of them changes what the address IS. The
 * path is exactly what the unit number's popover copies; `?ed=` decorates the
 * visit (`edition-pin.ts`); the directive rides after `:~:`, which browsers
 * strip from the fragment before any `#s3` in front of it is resolved — so a
 * recipient whose browser has never heard of text directives still lands on
 * the right section and sees it marked.
 *
 * The edition is optional because the surface may not declare one, and a link
 * that pins nothing is still a good link — it opens the unit in the reader's
 * own edition, which is what every other link on this site does.
 */
export function shareHref(href: string, edition: string | undefined, quote: string): string {
	const hashAt = href.indexOf('#');
	const path = hashAt === -1 ? href : href.slice(0, hashAt);
	const fragment = hashAt === -1 ? '' : href.slice(hashAt + 1);
	const pinned = edition
		? `${path}${path.includes('?') ? '&' : '?'}${EDITION_PARAM}=${encodeURIComponent(edition)}`
		: path;
	const directive = textDirective(quote);
	if (!fragment && !directive) return pinned;
	return `${pinned}#${fragment}${directive ? `:~:${directive}` : ''}`;
}
