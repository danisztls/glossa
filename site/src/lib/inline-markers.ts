/**
 * Splitting a marked string into text runs and the footnote markers the
 * source printed inside it — the pure logic behind `HeadingText.svelte` and
 * `AnnotatedText.svelte`, kept out of both components so it can be unit-tested
 * directly (house style — see `structureToc.ts`). Each is a thin `{#each}`
 * over what this returns.
 *
 * IT WAS `heading-markers.ts` UNTIL THE DOUAY-RHEIMS ARRIVED, when a second
 * surface turned out to want the identical operation. The corpus encodes an
 * apparatus the same way wherever it carries one — a plain field, a `_marked`
 * twin of it, and `⟦ ⟧` around each marker (docs/corpus-schema.md) — so a CCC
 * heading's `title`/`title_marked` and a Douay-Rheims verse's
 * `text`/`text_marked` are one shape under two names. The rename is the point:
 * nothing here was ever about headings.
 *
 * The two callers do differ in one way, and it is handled below rather than
 * by forking: a heading passes a DISPLAY title that may not be the corpus
 * string the offsets were measured against, while a verse passes its own
 * `text` and matches exactly. See the rebasing rule in `splitMarkers`.
 */

/** A footnote reference in the corpus, as `structure.json`, `paragraphs.json`
 *  and the annotated Bible editions all encode it: the marker inside `⟦ ⟧`. */
const MARKER_RE = /⟦([^⟧]+)⟧/g;

export type MarkedPiece = { text: string } | { marker: string; seq: number };

/**
 * `shown` split into text runs and footnote markers, with each marker where
 * the source printed it.
 *
 * `marked` is the corpus's marked form of the SAME string
 * (docs/corpus-schema.md — "A heading can carry citations" for the CCC, the
 * annotated-edition section for the Bible); `shown` is what the caller wants
 * rendered. For a VERSE the two are the same string apart from the markers,
 * and the rebasing below is a no-op. For a numbered HEADING `shown` is
 * `displayTitle`'s form with the source's own redundant ordinal ("III.",
 * "CHAPTER TWO") stripped off the front and rendered separately — so a
 * marker's offset is measured against the plain corpus string and then
 * rebased onto the displayed one.
 *
 * `undefined`/empty `marked` — still the common case, since an unannotated
 * edition carries no `_marked` twin at all — returns `shown` as a single
 * text run.
 *
 * WHERE THE DISPLAYED TITLE IS NOT A SUBSTRING of the corpus title, every
 * marker goes to the end rather than to a guessed position. That is not a
 * theoretical branch: `displayTitle` also trims a trailing colon, which is
 * enough to break the match. Terminal is the right fallback — a heading's
 * footnote is terminal in both attested cases, and appending is the only
 * placement that cannot land mid-word.
 *
 * `seq` numbers the markers by POSITION rather than by name, so a string
 * citing one footnote twice discloses each occurrence independently — the
 * same rule `ProseBlocks` follows for a paragraph, which does have such
 * cases. It matters for the Bible too, though one level up: a marker is
 * unique within its VERSE and not within its chapter, so `⟦1⟧` recurs down a
 * chapter meaning something different each time (docs/corpus-schema.md). That
 * is the caller's problem — resolve `marker` against the unit's OWN notes —
 * but `seq` is what keeps two occurrences inside one unit distinct.
 */
export function splitMarkers(shown: string, marked?: string): MarkedPiece[] {
	if (!marked) return [{ text: shown }];

	const markers: { marker: string; seq: number; at: number }[] = [];
	let plain = '';
	let last = 0;
	let seq = 0;
	for (const match of marked.matchAll(MARKER_RE)) {
		const index = match.index ?? 0;
		plain += marked.slice(last, index);
		markers.push({ marker: match[1], seq: seq++, at: plain.length });
		last = index + match[0].length;
	}
	plain += marked.slice(last);
	if (markers.length === 0) return [{ text: shown }];

	const base = plain.indexOf(shown);
	const pieces: MarkedPiece[] = [];
	let cursor = 0;
	for (const mk of markers) {
		const at = base === -1 ? shown.length : clamp(mk.at - base, 0, shown.length);
		if (at > cursor) pieces.push({ text: shown.slice(cursor, at) });
		pieces.push({ marker: mk.marker, seq: mk.seq });
		cursor = at;
	}
	if (cursor < shown.length) pieces.push({ text: shown.slice(cursor) });
	return pieces;
}

function clamp(value: number, low: number, high: number): number {
	return Math.max(low, Math.min(high, value));
}
