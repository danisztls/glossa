/**
 * Pure logic behind `HeadingText.svelte`, pulled out of the component so it
 * can be unit-tested directly (house style — see `structureToc.ts`). The
 * component is a thin `{#each}` over what this returns.
 */

/** A footnote reference in the corpus, as `structure.json` and
 *  `paragraphs.json` both encode it: the marker inside `⟦ ⟧`. */
const MARKER_RE = /⟦([^⟧]+)⟧/g;

export type HeadingPiece = { text: string } | { marker: string; seq: number };

/**
 * `title` split into text runs and footnote markers, with each marker where
 * the source printed it.
 *
 * `titleMarked` is the corpus's marked form of the SAME heading
 * (docs/corpus-schema.md, "A heading can carry citations"); `title` is what
 * the caller wants shown, which for a numbered heading is `displayTitle`'s
 * form with the source's own redundant ordinal ("III.", "CHAPTER TWO")
 * stripped off the front and rendered separately. So a marker's offset is
 * measured against the plain corpus title and then rebased onto the displayed
 * one.
 *
 * `undefined`/empty `titleMarked` — the overwhelmingly common case, since two
 * nodes in the whole corpus carry an apparatus — returns the title as a
 * single text run.
 *
 * WHERE THE DISPLAYED TITLE IS NOT A SUBSTRING of the corpus title, every
 * marker goes to the end rather than to a guessed position. That is not a
 * theoretical branch: `displayTitle` also trims a trailing colon, which is
 * enough to break the match. Terminal is the right fallback — a heading's
 * footnote is terminal in both attested cases, and appending is the only
 * placement that cannot land mid-word.
 *
 * `seq` numbers the markers by POSITION rather than by name, so a heading
 * citing one footnote twice would disclose each occurrence independently —
 * the same rule `CccParagraphText` follows for a paragraph, which does have
 * such cases.
 */
export function splitHeadingMarkers(title: string, titleMarked?: string): HeadingPiece[] {
	if (!titleMarked) return [{ text: title }];

	const markers: { marker: string; seq: number; at: number }[] = [];
	let plain = '';
	let last = 0;
	let seq = 0;
	for (const match of titleMarked.matchAll(MARKER_RE)) {
		const index = match.index ?? 0;
		plain += titleMarked.slice(last, index);
		markers.push({ marker: match[1], seq: seq++, at: plain.length });
		last = index + match[0].length;
	}
	plain += titleMarked.slice(last);
	if (markers.length === 0) return [{ text: title }];

	const base = plain.indexOf(title);
	const pieces: HeadingPiece[] = [];
	let cursor = 0;
	for (const mk of markers) {
		const at = base === -1 ? title.length : clamp(mk.at - base, 0, title.length);
		if (at > cursor) pieces.push({ text: title.slice(cursor, at) });
		pieces.push({ marker: mk.marker, seq: mk.seq });
		cursor = at;
	}
	if (cursor < title.length) pieces.push({ text: title.slice(cursor) });
	return pieces;
}

function clamp(value: number, low: number, high: number): number {
	return Math.max(low, Math.min(high, value));
}
