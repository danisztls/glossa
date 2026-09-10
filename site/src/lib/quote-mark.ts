/**
 * Finding the words a bookmark quoted, inside the unit as it is rendered now.
 *
 * A MARK SHOULD COVER WHAT THE READER MARKED. A highlight bookmark stores the
 * sentence the reader drew a line under (`bookmarks.svelte.ts`), and until
 * this existed the library's wash covered the whole paragraph it sat in — the
 * unit is what the ADDRESS names, and the address is all a bookmark used to
 * hold. With the words stored, the wash can be the sentence.
 *
 * IT IS A SEARCH, AND `lemma.ts` REFUSES TO BE ONE — worth saying why the same
 * argument does not apply. There the anchor is the marker and searching would
 * pick the wrong occurrence of a repeated phrase with nothing to say it had.
 * Here there is no anchor to match backwards from: the reader's own selection
 * is gone, and only its text survives. What makes the search safe enough is
 * what is being searched for — a run of prose the reader chose, not an
 * editor's two-word headword — and what it costs when it is wrong: the mark
 * lands on the same words somewhere else in the same paragraph. The first
 * occurrence is taken and the ambiguity is not reported, because there is
 * nothing better to report it in favour of.
 *
 * THE FOLD IS `lemma.ts`'s, AND THAT IS THE POINT. A stored quote has had its
 * whitespace collapsed and its apparatus cut out (`selection.ts`); the
 * rendered unit has neither treatment, and may have been re-transcribed since.
 * Comparing text stripped of everything that carries no words, with an index
 * map back to the source, is exactly the problem that module already solved
 * for a printed headword, and a second matcher tuned to the same corpus would
 * be a second set of tolerances to keep in step.
 *
 * WHAT IT DOES NOT DO IS GUESS ACROSS EDITIONS. The caller only asks when the
 * reader is in the edition the quote was taken from; a different edition is a
 * different translation, where these words do not appear and should not be
 * hunted for. Refusing there is not a limitation, it is the correct answer —
 * and the whole-unit wash is what the reader gets instead.
 */

import { fold } from './lemma';

export interface QuoteSpan {
	/** First character of the quotation, as an index into the text searched. */
	from: number;
	/** One past its last character. */
	to: number;
}

/**
 * Where `quote` sits inside `text`, or `undefined` if those words are not
 * there.
 *
 * Both sides are folded, so the answer survives the differences that carry no
 * words — the collapsed whitespace the quote was stored with, the punctuation
 * an edition sets differently, a marker's letter the quote had cut out. The
 * offsets that come back are into `text` exactly as it was passed in, which is
 * what lets a caller turn them into a range over real text nodes.
 */
export function locateQuote(text: string, quote: string): QuoteSpan | undefined {
	const needle = fold(quote);
	if (!needle.text) return undefined;

	const haystack = fold(text);
	const at = haystack.text.indexOf(needle.text);
	if (at === -1) return undefined;

	const from = haystack.at[at];
	const lastAt = haystack.at[at + needle.text.length - 1];
	if (from === undefined || lastAt === undefined) return undefined;
	// The last folded character is one SOURCE character, which may be a
	// surrogate pair — `at` maps to where it starts, so the end has to clear
	// the whole of it or the range would split it.
	const last = text.codePointAt(lastAt);
	return { from, to: lastAt + (last !== undefined && last > 0xffff ? 2 : 1) };
}
