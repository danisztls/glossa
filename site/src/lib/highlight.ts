/**
 * Where the query landed in a suggestion's own words.
 *
 * A jump-box row shows an address as THIS reader's language spells it, which
 * is very often not what they typed: `jo 3` offers "John 3", `lg` offers
 * "Lumen Gentium", `ccc 27` offers "Catechism 27". So the row answers *where
 * it goes* and says nothing about *why it is here* — and with eight rows
 * competing, why is the half a reader scans for. Marking the matched spans is
 * that answer, and it costs one pass over eight short strings per keystroke.
 *
 * THE SPANS ARE RE-DERIVED HERE RATHER THAN CARRIED FROM `suggest.ts`, and
 * that is not duplication. The suggester matches a candidate's *forms* — a
 * title, a slug with its hyphens opened out, a siglum from the reader's own
 * grammar table, a book abbreviation in eleven languages — and a span in a
 * form the reader cannot see is nothing this module could draw. What can be
 * drawn is a span in the LABEL, and finding one means matching the label,
 * which is the work this file does and the only work there is.
 *
 * The consequence is worth stating plainly: a row can be on the list and carry
 * no mark at all. `lg` reaching "Lumen Gentium" is the honest case — the
 * evidence was a siglum, and the siglum is not printed. Nothing is invented to
 * fill the gap.
 *
 * WHAT IT MARKS FOLLOWS `suggest.ts`'S OWN TIERS rather than a fresh idea of
 * relevance. A token marks where it begins a word; only when it begins no word
 * anywhere does an interior hit count, and then only from four characters —
 * the same gate `titleScore` puts on `SCORE.titleSubstring`, and for the same
 * measurement (three characters reached "Inter Graves" and "Ingravescentibus
 * Malis" before anything a reader meant). A highlighter looser than the
 * matcher would mark text that is not why the row is there.
 */

import { boundedEdit } from './edit-distance';

/** One run of the string, marked or not. Concatenating every `text` in order
 *  reproduces the input exactly — the caller renders, it never reassembles. */
export interface HighlightSegment {
	text: string;
	hit: boolean;
}

export interface HighlightOpts {
	/**
	 * Fall back to a subsequence when nothing matches literally.
	 *
	 * For the rows the LOOSE matcher put on the list, and only useful there:
	 * "capcity" appears nowhere in "Man's Capacity for God", and marking
	 * `**cap**a**city**` is the whole of the explanation for a row that would
	 * otherwise look like it arrived by accident. It runs only after the
	 * literal tiers find nothing, so it can never blur a mark something
	 * actually read.
	 */
	loose?: boolean;
}

/** Below four characters an interior hit is noise rather than evidence —
 *  `suggest.ts`'s `titleScore` gates its substring tier on the same number,
 *  measured against the real Magisterium corpus. */
const MIN_INTERIOR = 4;

/** And below three, a subsequence reaches everything. `suggest.ts`'s
 *  `MIN_FUZZY_LENGTH`, which is what put the loose rows on the list to begin
 *  with; a highlighter that fired below it would mark rows fuzzy matching had
 *  already declined to produce. */
const MIN_LOOSE = 3;

/**
 * `suggest.ts`'s `fold`, computed per code point so the result can be walked
 * back to the source.
 *
 * A whole-string fold cannot be: NFD splits `é` into two and stripping the
 * mark rejoins it into one, `İ` decomposes and folds to a single `i`, and a
 * span found in the folded text would then name the wrong characters of the
 * original. `map[i]` is the source offset of the character that produced
 * `folded[i]`, with a sentinel at the end so an exclusive bound maps too.
 *
 * A character that folds to nothing (a combining mark that arrived on its own)
 * gets no entry, so it falls inside whichever run follows it — which keeps a
 * mark attached to its base rather than orphaning it just outside the span.
 */
interface FoldedText {
	folded: string;
	map: number[];
}

function foldWithMap(text: string): FoldedText {
	let folded = '';
	const map: number[] = [];
	let at = 0;
	for (const char of text) {
		const piece = char
			.normalize('NFD')
			.replace(/\p{Mn}/gu, '')
			.toLowerCase();
		for (let k = 0; k < piece.length; k++) map.push(at);
		folded += piece;
		at += char.length;
	}
	map.push(text.length);
	return { folded, map };
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** The same split `suggest.ts`'s `words` makes — letters and digits are the
 *  word, everything else is between words. `man's` is `man` and `s` in both. */
function isWordStart(folded: string, at: number): boolean {
	return at === 0 || !WORD_CHAR.test(folded[at - 1]);
}

function isWordEnd(folded: string, at: number): boolean {
	return at === folded.length || !WORD_CHAR.test(folded[at]);
}

const DIGIT = /\p{N}/u;

/**
 * A ONE-LETTER token must be a whole word; a one-DIGIT token need not be.
 *
 * Measured, and the asymmetry is the corpus's rather than a preference. A
 * single letter opens a word in nearly every line of prose there is: `summa
 * i-ii 1` marked the `I` of "In", "Is" and "Intention" down four rows of
 * Summa question titles, which is a list wearing highlights rather than a list
 * explaining itself. A single digit is the opposite — it is an ADDRESS, and a
 * typed prefix of a longer number is precisely why the row is on the list
 * (`suggest.ts`'s `SCORE.numericPrefix`), so `jo 3` marking the `3` of "Job
 * 30" says something true that the reader needs.
 *
 * The letter rule keeps what it should: `I` is a whole word in "Summa I-II",
 * and marking it there is the reader's own query.
 */
function marksWholeWordOnly(token: string): boolean {
	return token.length === 1 && !DIGIT.test(token);
}

type Range = [start: number, end: number];

function occurrences(folded: string, token: string): Range[] {
	const atWordStart: Range[] = [];
	const interior: Range[] = [];
	const wholeWord = marksWholeWordOnly(token);
	for (let at = folded.indexOf(token); at !== -1; at = folded.indexOf(token, at + 1)) {
		const end = at + token.length;
		if (wholeWord && !isWordEnd(folded, end)) continue;
		(isWordStart(folded, at) ? atWordStart : interior).push([at, end]);
	}
	// Every word start, or every interior hit, never a mix: a token that opens
	// a word here has said why the row is on the list, and also marking the
	// same letters buried inside a longer word is the noise `MIN_INTERIOR`
	// exists to keep out.
	if (atWordStart.length > 0) return atWordStart;
	return token.length >= MIN_INTERIOR ? interior : [];
}

/**
 * Greedy leftmost subsequence, runs merged as they form.
 *
 * Leftmost is what makes it readable rather than correct-but-scattered:
 * scanning forward from each match keeps consecutive query characters on
 * consecutive label characters wherever the label allows it, so a real typo
 * comes out as two or three runs ("capcity" over "Man's **Cap**a**city** for
 * God") rather than seven separate letters.
 */
function subsequence(folded: string, needle: string): Range[] {
	const ranges: Range[] = [];
	let at = 0;
	for (const char of needle) {
		const found = folded.indexOf(char, at);
		if (found === -1) return [];
		const last = ranges[ranges.length - 1];
		if (last && last[1] === found) last[1] = found + 1;
		else ranges.push([found, found + 1]);
		at = found + 1;
	}
	return ranges;
}

/**
 * A SUBSEQUENCE IS EVIDENCE ONLY WHERE IT IS DENSE, and this is the gate that
 * decides. Four letters exist somewhere in almost any sentence: `dani` walked
 * "Of Man's Various **D**uties **an**d States **i**n General" — four marks
 * strung across thirty characters, a row wearing highlights rather than a row
 * explaining itself, under the same query that marked "**Dani**el" correctly
 * one line above it.
 *
 * The first measure is how much of the span the marks fill. The letters of a
 * misspelling land in one neighbourhood — "capcity" fills 7 of the 9
 * characters it spans, "rermnvrum" 9 of 13 — and the letters of a coincidence
 * do not (`dani`, 4 of 22).
 *
 * The second is that something has to be a RUN. `Quo`d` An`n`i`versarius`
 * passes the first at 4 of 6 and is the same noise in miniature, so a match
 * must also hold three characters together somewhere, or be no more than two
 * pieces — a dropped vowel splits a short word in two ("psms" for "Psalms")
 * and that is still legible as the word. Counting runs alone would refuse the
 * five "rermnvrum" honestly needs.
 */
const MIN_DENSITY = 0.5;
const MIN_RUN = 3;
const MAX_PIECES = 2;

function explains(ranges: Range[]): boolean {
	if (ranges.length === 0) return false;
	const span = ranges[ranges.length - 1][1] - ranges[0][0];
	const marked = ranges.reduce((sum, [start, end]) => sum + (end - start), 0);
	if (marked / span < MIN_DENSITY) return false;
	const longest = Math.max(...ranges.map(([start, end]) => end - start));
	return longest >= MIN_RUN || ranges.length <= MAX_PIECES;
}

/**
 * How wrong a WORD may be and still be the word the reader aimed at.
 *
 * Deliberately stricter than `suggest.ts`'s `maxBookEdits`, which allows two
 * edits above six characters: that bound ranges over 258 book forms chosen to
 * be told apart, this one over every word of every label, "and" and "the"
 * included. One edit, and nothing below four characters, where a single edit
 * reaches most of the short words there are.
 */
function nearEnough(word: string, needle: string): boolean {
	if (needle.length <= MIN_LOOSE) return false;
	return boundedEdit(word, needle, 1) !== null;
}

/**
 * The word a typo was aimed at, marked whole.
 *
 * THE PASS A SUBSEQUENCE CANNOT BE. `deniel` is not a subsequence of "Daniel"
 * — the `e` it wants before the `n` is behind it — so the row `suggest.ts`'s
 * own edit-distance matcher had put at the top of the list arrived with
 * nothing marked on it at all, which reads as a result arriving for no
 * reason. This is the same shape as the matcher that found it: distance
 * rather than containment.
 *
 * A WHOLE WORD AND NOT AN ALIGNMENT. Marking the five letters of "Daniel"
 * that `deniel` got right would point at the typo rather than at the answer,
 * and which letters those are is an artifact of the edit the table happened
 * to prefer. The claim is "this word is what you meant", and the word is what
 * states it.
 */
function nearWords(folded: string, needle: string): Range[] {
	const found: Range[] = [];
	for (const match of folded.matchAll(/[\p{L}\p{N}]+/gu)) {
		if (nearEnough(match[0], needle)) found.push([match.index, match.index + match[0].length]);
	}
	return found;
}

function merge(ranges: Range[]): Range[] {
	const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const out: Range[] = [];
	for (const [start, end] of sorted) {
		const last = out[out.length - 1];
		if (last && start <= last[1]) last[1] = Math.max(last[1], end);
		else out.push([start, end]);
	}
	return out;
}

/**
 * Split `text` into marked and unmarked runs against what the reader typed.
 *
 * Returns a single unmarked segment when nothing matches, and `[]` for empty
 * text — so a caller can render the result unconditionally and never has to
 * ask whether there was a hit.
 */
export function highlight(
	text: string,
	query: string,
	opts: HighlightOpts = {}
): HighlightSegment[] {
	if (!text) return [];
	const plain: HighlightSegment[] = [{ text, hit: false }];

	const { folded, map } = foldWithMap(text);
	const needle = foldWithMap(query).folded;
	const tokens = needle.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	if (tokens.length === 0) return plain;

	let found: Range[] = [];
	for (const token of tokens) found = found.concat(occurrences(folded, token));

	if (found.length === 0 && opts.loose) {
		// The loose passes ignore the query's own spacing: a reader typing
		// "lum gen" and a reader typing "lumgen" mean the same thing, and the
		// spans they mark are letters either way.
		const letters = tokens.join('');
		if (letters.length >= MIN_LOOSE) {
			const walked = subsequence(folded, letters);
			// The subsequence first, because it marks the letters the reader
			// actually typed. `nearWords` answers the two cases it cannot:
			// there is no subsequence to walk (a transposition), or the one
			// there is explains nothing (`explains`).
			found = explains(walked) ? walked : nearWords(folded, letters);
		}
	}

	if (found.length === 0) return plain;

	const segments: HighlightSegment[] = [];
	let cursor = 0;
	for (const [start, end] of merge(found)) {
		const from = map[start];
		const to = map[end];
		if (from > cursor) segments.push({ text: text.slice(cursor, from), hit: false });
		segments.push({ text: text.slice(from, to), hit: true });
		cursor = to;
	}
	if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false });
	return segments;
}

/**
 * Whether `text` answers `query` — every token found, not merely one.
 *
 * `/documenta`'s search box is the caller (that route's `+page.svelte`), and
 * it exists here rather than there so that MATCHING AND MARKING CANNOT
 * DISAGREE. They run the same fold and the same `occurrences` tiers, so a
 * document is on the results list exactly when the highlighter has something
 * to draw on it — which is the property that makes a filtered list legible:
 * every row can show why it is a row. A matcher written separately would
 * drift within a week, and the drift is invisible in the direction that
 * matters (a row that matched on a rule the marker does not implement looks,
 * to a reader, like a result arriving for no reason).
 *
 * AND across tokens, though `highlight` ORs them. Marking is generous because
 * an unmarked span costs nothing; filtering is strict because two words typed
 * into a search box are a narrowing, not a widening — "leo labour" means both.
 *
 * An empty query matches everything, so a caller can apply it unconditionally.
 * The `loose` subsequence pass is deliberately NOT consulted: it is a last
 * resort for explaining a row the fuzzy ranker already chose, and as a filter
 * over 272 documents it would match nearly all of them.
 */
export function matchesQuery(text: string, query: string): boolean {
	const tokens = foldWithMap(query)
		.folded.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
	if (tokens.length === 0) return true;
	const { folded } = foldWithMap(text);
	return tokens.every((token) => occurrences(folded, token).length > 0);
}
