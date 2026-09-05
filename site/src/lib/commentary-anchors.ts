/**
 * Placing a commentary's notes INSIDE the verse they annotate, at the words
 * each one quotes.
 *
 * THE MARK NAMED THE VERSE UNTIL 2026-09-01, and the reason it could not name
 * the words was that the commentary was offered beside every edition of its
 * address: a lemma quotes ONE text, so a mark keyed to it would have vanished
 * on the Clementine and the CPDV, where those words are not there. The
 * commentary is the annotated edition's now (`commentariesAt` takes a work id
 * again), which is what makes this possible at all — and what it costs is that
 * a reader of another edition is no longer offered it.
 *
 * THE ORDER OF THE NOTES IS THE DISAMBIGUATOR, and it is what makes this work
 * rather than merely mostly work. A verse repeats its own words — `and the
 * Lord said`, `of the Lord` — so 1,939 of Haydock's headwords occur more than
 * once in the verse they annotate and a search alone cannot say which is meant.
 * But a catena is printed in reading order: the source's notes walk the verse
 * from its start to its end. So the search carries a CURSOR, each note is found
 * at or after the end of the last one, and 1,930 of the 1,939 resolve. The nine
 * that do not, and the 237 whose headwords appear out of order, are refused
 * rather than guessed.
 *
 * WHAT IT REACHES, over the whole commentary against `bible.douay-rheims.en`:
 *
 *   anchored           24,805 of 45,662 notes   54.3%
 *   no headword        18,466                   40.4%
 *   headword refused    2,332                    5.1%
 *   elided catchword       59                    0.1%
 *
 * SO NEARLY HALF THE APPARATUS HAS NO PLACE IN THE TEXT, and that is the fact
 * the design has to carry rather than hide. Those notes are a remark on the
 * verse — which is what Haydock's own page says by giving them no headword —
 * and they keep the mark at the end of the verse that every note used to have.
 * A verse therefore ends up with inline marks, a trailing mark, or both: 9,349
 * verses have only inline marks, 1,846 only a trailing one, and 9,594 have both.
 * The two sets PARTITION the verse's notes, so no note is behind two marks and
 * none is behind none.
 *
 * DENSITY IS NOT THE PROBLEM IT LOOKS LIKE. One inline mark in 14,298 verses,
 * two in 3,709, three or more in 936, and one verse with twelve; the anchored
 * span is 5% of its verse at the median and 13% at the ninetieth percentile.
 * That is a printed catena's own arrangement, which is where it comes from.
 */
// WITH THE `.ts`, like `route-manifest.ts` writes `./address.ts` and for its
// reason: Node's type-stripping loader will not resolve an extensionless
// relative specifier, and this module is checked against the real corpus from a
// plain Node script. Vite resolves it either way, so tidying the extension away
// breaks only the measurement — silently, and not the site.
import { ELIDED, fold, WORD } from './lemma.ts';
import type { CommentaryNote } from './types';

export interface CommentaryAnchor {
	/** Where the quoted words start in the verse text. */
	from: number;
	/** Just past them — where the mark is set, the way a printed apparatus
	 *  sets its marker after the words it glosses rather than before. */
	to: number;
	/** The notes anchored here, in the order the source prints them. */
	notes: CommentaryNote[];
}

export interface AnchoredCommentary {
	/** In text order, never overlapping — see the cursor in the header. */
	anchors: CommentaryAnchor[];
	/** The notes with no place in the text, for the mark at the verse's end. */
	trailing: CommentaryNote[];
}

/** Whether a boundary at `at` cuts a word in half. `Uncleanness` inside
 *  `uncleannesses` matches at the start and not at the end, so both ends are
 *  asked — unlike `splitLemma`, whose end is pinned by the marker. */
function splitsWord(text: string, at: number): boolean {
	return at > 0 && at < text.length && WORD.test(text[at - 1]) && WORD.test(text[at]);
}

/** One line's share of a quotation: where in THAT line the words fall. */
export interface LineSpan {
	line: number;
	from: number;
	to: number;
}

export interface CommentaryLineAnchor {
	/** The lines the quoted words run across, in order, each clipped to its
	 *  own line. One entry for a clause that fits a line, more for one the
	 *  edition set across a break. Never empty. */
	spans: LineSpan[];
	/** The notes anchored here, in the order the source prints them. */
	notes: CommentaryNote[];
}

export interface AnchoredLines {
	/** In text order, never overlapping — see the cursor in the header. */
	anchors: CommentaryLineAnchor[];
	/** The notes with no place in the text, for the mark at the end. */
	trailing: CommentaryNote[];
}

/**
 * One unit's commentary where the unit is SET AS LINES — a prayer, whose notes
 * name the prayer and quote one of its clauses.
 *
 * `lines` is the unit as the annotated edition prints it, in reading order.
 * Nothing here rewrites any of them: a span is a pair of offsets into one of
 * those exact strings.
 *
 * A QUOTATION MAY CROSS A LINE BREAK, and refusing to let it was measured and
 * reversed the same day. A printed glossa quotes a clause; an edition sets that
 * clause where its measure falls, and the two disagree constantly — the
 * Catechism glosses `Full of grace, the Lord is with thee` and the English Ave
 * ends a line after `full of grace,`. Confined to one line, the whole tier
 * anchored 77 of its 120 headwords and the Ave itself showed one mark in most
 * languages; spanning the break, the words are marked where they are and the
 * mark goes after the last of them. The line break is the edition's
 * typesetting, which is the same reason §5 of the survey keeps the LEMMA off
 * line numbers in the first place.
 *
 * THE CURSOR WALKS THE WHOLE UNIT, not each line. A catena and a printed
 * glossa both proceed from the start of the text to its end, so a note is found
 * at or after the end of the last one — across a line boundary exactly as
 * within one. Resetting per line would give the same repeated clause to two
 * notes; searching each line alone would let a later note anchor above an
 * earlier one. `Mary` occurs in three lines of the English Ave.
 *
 * It works by folding the lines JOINED, which costs nothing and buys the break:
 * `fold` drops everything that carries no words, so the separator vanishes from
 * the comparable string and a clause reads continuously across it. The offsets
 * come back through `fold`'s own map, and the join character is a newline
 * precisely so `splitsWord` still refuses a match that cuts a word in half at
 * either end.
 */
export function anchorCommentaryLines(
	lines: readonly string[],
	notes: CommentaryNote[]
): AnchoredLines {
	const joined = lines.join('\n');
	const run = fold(joined);
	// Where each line starts in `joined` — the separator is one character, so
	// this is the running sum plus one per line before it.
	const starts: number[] = [];
	let offset = 0;
	for (const line of lines) {
		starts.push(offset);
		offset += line.length + 1;
	}

	const anchors: CommentaryLineAnchor[] = [];
	const trailing: CommentaryNote[] = [];
	let cursor = 0;

	for (const note of notes) {
		const found = note.lemma && !ELIDED.test(note.lemma) ? locate(note.lemma) : undefined;
		if (!found) {
			trailing.push(note);
			continue;
		}
		// Two notes cannot share a span — the cursor has already moved past the
		// last one — so an anchor is only ever appended, never merged into.
		anchors.push({ spans: found, notes: [note] });
	}
	return { anchors, trailing };

	function locate(lemma: string): LineSpan[] | undefined {
		const quoted = fold(lemma).text;
		if (quoted === '') return undefined;
		for (let i = run.text.indexOf(quoted, cursor); i !== -1; i = run.text.indexOf(quoted, i + 1)) {
			const from = run.at[i];
			const to = run.at[i + quoted.length - 1] + 1;
			if (splitsWord(joined, from) || splitsWord(joined, to)) continue;
			cursor = i + quoted.length;
			return spansOf(from, to);
		}
		return undefined;
	}

	/** `[from, to)` in the joined text, clipped to the lines it covers. A line
	 *  the range only touches through the separator contributes nothing and is
	 *  dropped, so `spans` never holds an empty one. */
	function spansOf(from: number, to: number): LineSpan[] {
		const spans: LineSpan[] = [];
		for (const [line, start] of starts.entries()) {
			const end = start + lines[line].length;
			const a = Math.max(from, start);
			const b = Math.min(to, end);
			if (a < b) spans.push({ line, from: a - start, to: b - start });
		}
		return spans;
	}
}

/**
 * One verse's commentary, divided into what the text can carry and what it
 * cannot.
 *
 * `text` is the verse as the annotated edition prints it. Nothing here rewrites
 * it: an anchor is a pair of offsets into that exact string.
 *
 * A verse is one line, so this is `anchorCommentaryLines` with a list of one —
 * kept as its own function because it is what every Bible caller wants and
 * because the measurements in this file's header were taken through it. With
 * one line every anchor has exactly one span, so the flattening cannot lose
 * anything.
 */
export function anchorCommentary(text: string, notes: CommentaryNote[]): AnchoredCommentary {
	const { anchors, trailing } = anchorCommentaryLines([text], notes);
	return {
		anchors: anchors.map((a) => ({ from: a.spans[0].from, to: a.spans[0].to, notes: a.notes })),
		trailing
	};
}
