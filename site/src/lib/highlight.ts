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
	 * Fall back to a subsequence, or to the word a typo was aimed at, for the
	 * tokens nothing matched literally.
	 *
	 * For the rows a LOOSE matcher put on the list, and only useful there:
	 * "capcity" appears nowhere in "Man's Capacity for God", and marking
	 * `**cap**a**city**` is the whole of the explanation for a row that would
	 * otherwise look like it arrived by accident. Per token and only where the
	 * literal tiers read nothing, so it can never blur a mark something
	 * actually read — and so `rerum novarm` still marks the word that was
	 * typed correctly as the evidence it is.
	 *
	 * Every surface that filters with `filterByQuery` owes its rows this, since
	 * its second pass can put a row on a list for a reason only this can draw.
	 */
	loose?: boolean;
}

/** Below four characters an interior hit is noise rather than evidence —
 *  `suggest.ts`'s `titleScore` gates its substring tier on the same number,
 *  measured against the real Magisterium corpus. */
const MIN_INTERIOR = 4;

/**
 * And a loose reading owes the same four characters an interior literal hit
 * owes — the same number as `MIN_INTERIOR`, for the same measurement.
 *
 * IT IS `MIN_INTERIOR`'S NUMBER BECAUSE A FALLBACK LOOSER THAN THE TIER IT
 * FALLS BACK FROM IS NOT A FALLBACK, IT IS THE GATE BEING REMOVED. `rav` sits
 * contiguously inside "Ingravescentibus" and `occurrences` refuses it at three
 * characters; a loose pass that then walked the same three letters would have
 * handed back through the back door exactly what was measured to be kept out.
 *
 * Three was enough while the loose pass only ever explained a row the fuzzy
 * RANKER had already chosen, where reaching too far costs a stray mark on a
 * row that was going to be there anyway. As a filter it costs the row itself,
 * and three characters measurably reach: over the Magisterium's 434 documents
 * `man` walked "**Ma**so**n**ic Associations" and `leo` walked "**Le**ban**o**n",
 * a third of the list arriving for no reason a reader could see.
 */
const MIN_LOOSE = 4;

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
 * included. One edit, and nothing below `MIN_LOOSE`, where a single edit
 * reaches most of the short words there are.
 */
function nearEnough(word: string, needle: string): boolean {
	if (needle.length < MIN_LOOSE) return false;
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

/**
 * The loose tier, as RANGES rather than as a verdict.
 *
 * ONE FUNCTION, SO THE MATCHER AND THE MARKER CANNOT DISAGREE — the rule
 * `matchesQuery` already states for the literal tiers, carried into the tier
 * that admits a misspelling. A row joins a filtered list loosely exactly when
 * there is something on it to draw, which is the whole of what keeps a
 * typo-tolerant search from answering with rows that look like accidents.
 *
 * PER FIELD, BECAUSE A SUBSEQUENCE WALKS OVER A SEAM THAT `indexOf` CANNOT.
 * The haystacks are newline-joined so that no token runs from the end of one
 * field into the start of the next, and a literal search gets that for free —
 * a token holding no newline cannot match across one. A subsequence steps over
 * anything, and `xiiiencyclical` is a dense walk of `Leo XIII\nEncyclical`.
 * Splitting first also hands `explains` the right denominator: density
 * measured against one title, not against a title with a description after it.
 */
function looseOccurrences(folded: string, token: string): Range[] {
	if (token.length < MIN_LOOSE) return [];
	const found: Range[] = [];
	let at = 0;
	for (const field of folded.split('\n')) {
		for (const [start, end] of looseInField(field, token)) found.push([start + at, end + at]);
		at += field.length + 1;
	}
	return found;
}

/** The subsequence first, because it marks the letters the reader actually
 *  typed. `nearWords` answers the two cases it cannot: there is no subsequence
 *  to walk (a transposition), or the one there is explains nothing. */
function looseInField(folded: string, token: string): Range[] {
	const walked = subsequence(folded, token);
	return explains(walked) ? walked : nearWords(folded, token);
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

	// PER TOKEN, AND ONLY WHERE THE LITERAL TIERS READ NOTHING. A token that was
	// read literally has already said why the row is here and a loose pass over
	// it could only blur that; a token that was not is the half of the query
	// still owed an explanation. `leo labr` marks `Leo` for the evidence it is
	// and `lab`our` for the guess it is, where the all-or-nothing pass this
	// replaced marked the first and left the second bare — which is the shape a
	// reader reads as "it found Leo and ignored the rest of what I typed".
	//
	// The query's own spacing still washes out where it should: `lumgen` is one
	// token and walks `Lumen Gentium` as a subsequence, `lum gen` is two and
	// each is read on its own, and the spans they mark are the same letters.
	let found: Range[] = [];
	for (const token of tokens) {
		const literal = occurrences(folded, token);
		found = found.concat(
			literal.length > 0 || !opts.loose ? literal : looseOccurrences(folded, token)
		);
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
 * The loose tier is deliberately not consulted here — see `looselyMatches`,
 * and `filterByQuery`, which is what most callers actually want.
 */
export function matchesQuery(text: string, query: string): boolean {
	const tokens = tokensOf(query);
	if (tokens.length === 0) return true;
	const { folded } = foldWithMap(text);
	return tokens.every((token) => occurrences(folded, token).length > 0);
}

/**
 * The same question, asked of a reader who cannot spell the answer.
 *
 * Every token again, each read literally OR loosely — so `rerum novarm` is
 * carried by the word that was typed correctly and the word that was not,
 * which is the ordinary shape of a misspelled query. A token read literally is
 * never re-read loosely: it has already answered.
 *
 * THIS IS A FALLBACK AND NOT A TIER TO MIX IN, and `filterByQuery` is where
 * that is enforced rather than merely intended. Measured over the
 * Magisterium's 619 document editions, admitting loose rows ALONGSIDE literal
 * ones widened the 400 commonest words of the corpus by 35% — `them` reaching
 * 460 rows through "the m-", `form` reaching 383 through "from" — and no floor
 * on the token length separated that from the repairs: at eight characters the
 * noise was still 3% and two thirds of the repairs were gone. The mixing is
 * what is wrong, not the threshold. A guess is worth a great deal to a reader
 * looking at an empty page and nothing at all to one already looking at rows.
 */
export function looselyMatches(text: string, query: string): boolean {
	const { folded } = foldWithMap(text);
	return tokensOf(query).every(
		(token) => occurrences(folded, token).length > 0 || looseOccurrences(folded, token).length > 0
	);
}

/**
 * The rows a query keeps: what it reads literally, or — only if that is
 * nothing at all — what it can be read to have meant.
 *
 * THE FALLBACK IS A DECISION ABOUT THE LIST AND CANNOT BE MADE ROW BY ROW,
 * which is why this exists rather than a third predicate. `suggest.ts` states
 * the rule for the jump box — fuzzy sits one band below every literal reading,
 * adding rows and never reordering the ones something actually read — and the
 * jump box can afford to mix the bands because it RANKS them. A filtered list
 * has no ranking to demote a guess into: every row it keeps is equally a row.
 * So "one band below" can only mean one thing here, and it is this.
 *
 * What it buys is that no reader whose spelling was right ever pays for the
 * tolerance, and every reader whose spelling was wrong gets the rows they
 * meant rather than an empty page. `textOf` per row rather than a prepared
 * array of strings, because the second pass runs for a minority of queries and
 * building every haystack twice for the majority would be the cost this avoids.
 *
 * THE LITERAL TIER IS INJECTABLE AND THE LOOSE ONE IS NOT, which is the whole
 * asymmetry this file is built on said once more. `/quaestiones` matches a
 * bare substring anywhere where every other box gates an interior hit at four
 * characters, and that is a decision about its vocabulary, so it passes its
 * own `readsLiterally`. What a reader means by `eutanasia` is a fact about
 * typing rather than about any vocabulary, so there is one of those and no
 * caller may bring another. The empty-query guard belongs to this function
 * either way: a reader who has typed nothing has not asked a question that a
 * literal tier could have its own opinion about.
 */
export function filterByQuery<T>(
	rows: readonly T[],
	textOf: (row: T) => string,
	query: string,
	readsLiterally: (text: string, query: string) => boolean = matchesQuery
): T[] {
	if (tokensOf(query).length === 0) return [...rows];
	const literal = rows.filter((row) => readsLiterally(textOf(row), query));
	if (literal.length > 0) return literal;
	return rows.filter((row) => looselyMatches(textOf(row), query));
}

/** Letters and digits are the word, everything else is between words — the
 *  split `highlight` makes on the query, folded, so a caller asking whether
 *  the reader typed anything at all asks it exactly once. */
function tokensOf(query: string): string[] {
	return foldWithMap(query)
		.folded.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}
