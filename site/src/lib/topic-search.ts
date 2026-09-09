/**
 * Matching a reader's words against the topic list on `/quaestiones`.
 *
 * A MODULE AND NOT FOUR LINES IN THE PAGE, because the two rules below are
 * the whole of what makes this useful and neither is visible in a rendered
 * list: a page that quietly fails to match `cremação` typed as `cremacao`
 * looks exactly like a page with no such topic.
 *
 * WHAT IS SEARCHED IS THE TITLE AND THE QUESTION, and nothing else. Not the
 * slug — `mors-voluntaria` is an address, and a reader who knew to type it
 * would have used the jump box — and not the Catechism's text, which is not
 * loaded on this page and would make the index the size of the corpus. The
 * question is the half that matters: `docs/research/topics.md` found that
 * readers arrive with a sentence rather than a subject, and the sentence is
 * exactly what that field holds.
 *
 * THIS IS THE FIRST SURFACE ON THE SITE THAT SEARCHES WORDS RATHER THAN
 * ADDRESSES. `JumpBox` completes citations; `PLAN.md` gap 2 is full-text
 * search over the corpus and is unbuilt. This is neither: it filters a list
 * already in memory, in the reader's own interface language, and its scope is
 * one page's own rows.
 */

/**
 * Case- and diacritic-insensitive form.
 *
 * FOLDING IS NOT OPTIONAL HERE, and Portuguese is why: the questions carry
 * `cremação`, `católico`, `gênero`, and a reader typing on a phone keyboard —
 * or in a hurry — types them bare. Without folding, the topic exists and the
 * search says it does not.
 *
 * NFD then strip `\p{Mn}`: decomposing separates a base letter from its
 * combining mark, and `Mn` (non-spacing mark) is the class those marks are
 * in. Same two lines as `book-token.ts`'s own `foldDiacritics`, which is not
 * exported and is about a different vocabulary — the Bible's book names, with
 * its own token normalisation around it. Copying two lines beats exporting a
 * function whose neighbours do not apply.
 */
export function foldForSearch(text: string): string {
	return text
		.normalize('NFD')
		.replace(/\p{Mn}/gu, '')
		.toLowerCase();
}

/**
 * Whether every word of `query` appears somewhere in `haystack`.
 *
 * ALL TERMS, ANY ORDER, ANY POSITION — an AND over substrings. "confession
 * years" finds "Confession after a long time / What happens if the last
 * confession was years ago?" though no field holds that pair adjacently, and
 * a reader who adds a word expects the list to get shorter rather than
 * longer, which OR would not give them.
 *
 * SUBSTRING AND NOT WORD-PREFIX, which is the call most search boxes get
 * wrong in the other direction. The site's interface languages include
 * Portuguese and German, where the word a reader half-remembers is often
 * inside a longer one, and a list of a hundred rows is small enough that the
 * looser match costs nothing in noise.
 *
 * An empty or whitespace-only query matches everything: the reader has not
 * asked for anything yet, and an empty list would read as "no results".
 */
export function matchesQuery(haystack: string, query: string): boolean {
	const terms = foldForSearch(query).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const folded = foldForSearch(haystack);
	return terms.every((term) => folded.includes(term));
}

/** One row as the page knows it: an address and the two strings a reader reads. */
export interface TopicSearchRow {
	slug: string;
	title: string;
	question: string;
}

/**
 * The slugs a query keeps, as a set the page can test membership against.
 *
 * A SET AND NOT A FILTERED LIST, because the page's grouping is
 * doorway-then-cluster and it has to decide, per group, whether the group
 * survives at all. Handing back a flat list would make the page rebuild that
 * structure from it.
 */
export function matchingSlugs(rows: TopicSearchRow[], query: string): Set<string> {
	return new Set(
		rows.filter((row) => matchesQuery(`${row.title} ${row.question}`, query)).map((row) => row.slug)
	);
}
