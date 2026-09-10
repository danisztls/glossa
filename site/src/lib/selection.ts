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
