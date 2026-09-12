/**
 * Which of a document's languages a catalogue row PRINTS, and how many it
 * folds into a count.
 *
 * A row on `/documenta` is one document and not one edition — the page's own
 * docblock says why — so which languages it exists in is the one fact about a
 * document the row was not carrying. Printed whole they would be the longest
 * line on the card and very nearly the same line on every card, which is a
 * texture rather than information.
 *
 * THE CUT IS THE READER'S OWN CHAIN, `contentLangChain`: their content
 * language, its neighbour, and the `en`/`la` tail every row of
 * `CONTENT_LANG_FALLBACK` ends in. That is the same table `editionInLang`
 * resolves the document WITH, so a printed chip is a language this reader
 * would actually be given on opening it, and the count behind it is every
 * language they would not.
 *
 * `current` LEADS AND IS NEVER FOLDED AWAY. It is the language the row's own
 * title and description are written in, and it can be one the chain does not
 * name — a reader who pinned an edition of this one document (`EditionMenu`
 * on `/documenta/{slug}`), or a document the chain reaches in nothing at all.
 * A row printing "+13" over a Ukrainian title would be counting the language
 * it was written in.
 *
 * It is deliberately NOT `readerLangChain`, which the edition MENUS rank on:
 * that one leads with `navigator.languages`, so this page would print a
 * different number of chips per visitor on a route the build prerenders.
 * Ranking a panel the reader opened is reader-shaped; a catalogue's rows are
 * the same rows for everyone reading in that language.
 */

/** The languages a row prints, and the ones behind its count. */
export interface NearLanguages {
	/** `current` first, then the chain's own order. */
	shown: string[];
	/** Everything else, in the order the caller listed it. */
	rest: string[];
}

export function nearLanguages(
	available: readonly string[],
	chain: readonly string[],
	current?: string
): NearLanguages {
	const near = [current, ...chain].filter(
		(lang): lang is string => lang !== undefined && available.includes(lang)
	);
	const shown = [...new Set(near)];
	return { shown, rest: available.filter((lang) => !shown.includes(lang)) };
}
