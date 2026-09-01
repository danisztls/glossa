/**
 * Finding the words in a verse that a note's lemma quotes, so the verse can
 * mark them rather than the note repeating them.
 *
 * A LEMMA IS A HEADWORD, and a printed annotated Bible sets it twice: once in
 * the verse, where the marker follows it, and once at the head of the note, so
 * a reader looking at the foot of the page knows which words are being glossed
 * without looking back up. On screen the note is anchored to its own marker —
 * it opens FROM the words it quotes — so the second copy is answering a
 * question the reader cannot have. Marking the first copy says the same thing
 * in the place the reader is already looking.
 *
 * THE ANCHOR IS THE MARKER, NOT A SEARCH. The words are the run of text
 * immediately BEFORE the token, because that is where the source set the
 * marker; searching the verse for the lemma would find the wrong occurrence
 * for any phrase a verse repeats, and would have to decide what to do about
 * the ones it found twice. Matching backwards from the marker has one
 * candidate by construction, and it is either right or refused.
 *
 * WHAT THAT MEASURES, ACROSS THE THREE EDITIONS THAT PRINT A LEMMA AT ALL:
 *
 *   bible.douay-rheims.en   1,803 of 1,909   94%
 *   bible.matos-soares.pt   1,354 of 1,743   78%
 *   bible.martini.it            0 of 18,658   0%
 *
 * Allioli (37,790 notes), Straubinger (13,079) and Crampon (8,854) carry no
 * lemma at all and are untouched by any of this.
 *
 * MARTINI'S ZERO IS NOT A GAP TO BE CLOSED, and it is why the note keeps its
 * headword whenever this refuses. His notes are VERSE-level — every marker
 * sits at position 0, so there is nothing before it — and his lemma is a
 * catchword with the elision printed in: `E... diede... il nome di cielo.`,
 * `E la luce nominò ec.` Those name a discontinuous quotation, which is not a
 * span of anything. So an edition whose lemma cannot be marked goes on
 * printing it in the panel, and the reader never meets a note that has quietly
 * lost its headword. Refusing loudly in one edition is the price of marking
 * 3,157 in the other two.
 *
 * THE COMPARISON IGNORES EVERYTHING THAT CARRIES NO WORDS, and the answer is
 * still an exact offset into the verse, which is what `fold`'s index map is
 * for. Case and diacritics have to go — the Douay's note says `A firmament`
 * where the verse says `a firmament`, Matos Soares's says `A tua santa morada`
 * against `à tua Santa morada` — and so do punctuation and whitespace, which
 * is where a transcribing editor differs from the text most often.
 *
 * FUZZY MATCHING WAS TRIED AND BOUGHT NOTHING. A bounded edit distance over the
 * candidate tail, at one edit per twelve characters, recovers ZERO further
 * headwords in either edition: what is left is not near-misses but places where
 * the note does not quote the verse — `Let - human`, `A star fall`, `For three
 * crimes--and for four` against `For three crimes of Damascus`, and 1 Machabees
 * 7:5's `Now Alcimus` where the verse reads `Now one Alcimus`. Loosening
 * further only buys the power to mark a span the note never named, which is the
 * one failure this must not have — so the tolerances stop at the characters
 * that carry no words, where a match is still exact.
 */

/**
 * Elision, which is a catchword's way of saying "and the rest of it". A lemma
 * carrying one is quoting two ends of a phrase with the middle left out, so
 * there is no single run of the verse it names.
 */
export const ELIDED = /\.\.\.|…|\bec\.|\betc\.|&c\./u;

/** A letter or digit in any script — the only characters the comparison keeps,
 *  and the test the word-boundary guards use. Exported with `fold` and `ELIDED`
 *  because `commentary-anchors.ts` asks the same question of the same corpus
 *  and two definitions of "comparable" would drift within a week. */
export const WORD = /[\p{L}\p{N}]/u;

export interface Folded {
	/** The comparable text: letters and digits, lowercased and stripped of
	 *  diacritics, with everything else gone. */
	text: string;
	/** Where each character of `text` sits in the string it came from. */
	at: number[];
}

/**
 * The comparable form of a string, with a map back to the original.
 *
 * PUNCTUATION AND WHITESPACE ARE DROPPED, NOT NORMALISED, which is what makes
 * this a map rather than a fold. A headword is transcribed by an editor reading
 * a verse, and what they most often get differently is exactly the matter that
 * carries no words: Matos Soares's note is headed `Perto estás de mim` where
 * the verse opens a parenthesis inside it, `Deixa-a , ela reservou` against the
 * verse's semicolon, `Por que` against `Porque`, `Na fracçã o do pão` with a
 * space dropped into the middle of a word by the mirror's own markup. Comparing
 * without any of it matches 25 more headwords across the two editions.
 *
 * SO THE OFFSET COMES FROM `at` AND NEVER FROM ARITHMETIC. The earlier version
 * was a length-preserving fold precisely so an index into it was an index into
 * the source; dropping characters gives that up, and the map is what buys it
 * back. `at[i]` is where the ith comparable character really sits, so the mark
 * still covers the verse exactly as the verse is written — punctuation the
 * headword omitted included.
 *
 * IT ALSO MAKES `ELIDED` LOAD-BEARING RATHER THAN TIDY. `E... diede... il nome
 * di cielo.` folds to `ediedeilnomedicielo` once the dots are gone, which would
 * match a verse with any words at all between those pieces — a catchword
 * silently marking a span it does not name. It is refused before this runs.
 */
export function fold(text: string): Folded {
	let out = '';
	const at: number[] = [];
	let i = 0;
	for (const ch of text.normalize('NFC')) {
		const c = ch === '’' || ch === '‘' || ch === '‛' ? "'" : ch;
		const base = c.normalize('NFD')[0] ?? c;
		if (WORD.test(base)) {
			out += base.toLowerCase();
			at.push(i);
		}
		i += ch.length;
	}
	return { text: out, at };
}

export interface LemmaSplit {
	/** The run up to the quoted words — rendered plainly. */
	head: string;
	/** The words the note glosses, for the verse to mark. Never empty. */
	lemma: string;
}

/**
 * The tail of `text` that `lemma` quotes, or `undefined` when it quotes none
 * of it.
 *
 * `text` is the run immediately before the note's marker, already free of
 * marker tokens. The returned pieces concatenate back to it exactly: nothing
 * here rewrites a verse, it only says where to cut one.
 */
export function splitLemma(text: string, lemma: string | undefined): LemmaSplit | undefined {
	if (!lemma || ELIDED.test(lemma)) return undefined;

	const quoted = fold(lemma).text;
	const run = fold(text);
	if (quoted === '' || quoted.length > run.text.length) return undefined;

	const from = run.text.length - quoted.length;
	if (run.text.slice(from) !== quoted) return undefined;

	// AND IT HAS TO START ON A WORD. Without this a lemma that is a suffix of a
	// longer word matches it, and the mark opens mid-word — which reads as a
	// rendering fault rather than as an apparatus. It is not hypothetical:
	// Ezechiel 8:17's note is headed `Uncleanness` where the verse reads
	// `their uncleannesses`, and twelve more like it across the two editions.
	const at = run.at[from];
	if (at > 0 && WORD.test(text[at - 1]) && WORD.test(text[at])) return undefined;

	// To the END of the run, not to the end of the match: the verse's own
	// closing punctuation is not part of the headword and is not a reason to
	// stop short of it. `Why suspect, ye curdled mountains?` is the note's
	// heading for a verse ending in the same question mark, and a mark that
	// stopped one character before it would read as a slip.
	return { head: text.slice(0, at), lemma: text.slice(at) };
}
