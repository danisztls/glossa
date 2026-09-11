/**
 * Matching a reader's words against the topic list on `/quaestiones`.
 *
 * A MODULE AND NOT FOUR LINES IN THE PAGE, because the rules below are the
 * whole of what makes this useful and not one of them is visible in a rendered
 * list: a page that quietly fails to match `cremação` typed as `cremacao`
 * looks exactly like a page with no such topic.
 *
 * WHAT IS SEARCHED IS THE TITLE, THE QUESTION AND A LINE OF KEYWORDS NOBODY
 * SEES. Not the slug — `mors-voluntaria` is an address, and a reader who knew
 * to type it would have used the jump box — and not the Catechism's text,
 * which is not loaded on this page and would make the index the size of the
 * corpus. The question is the half of the visible pair that matters:
 * `docs/research/topics.md` found that readers arrive with a sentence rather
 * than a subject, and the sentence is exactly what that field holds.
 *
 * THE KEYWORDS ARE THERE BECAUSE THE TWO VISIBLE STRINGS ARE WRITTEN TO BE
 * READ AND NOT TO BE MATCHED. `mors-voluntaria` is titled `After a suicide`
 * and asks `Someone has taken their own life` — a reader typing `killed
 * himself` finds nothing; `crematio` never says `urn`, `divinatio` never says
 * `ouija`, `contraceptio` never says `the pill`. The alternative was to write
 * the terms into the questions, which would cost the register that whole page
 * is built on. So they sit in the dictionaries beside the title and the
 * question, are rendered nowhere, and are translated rather than transliterated
 * — the Portuguese reader's word is `camisinha`, not `condom`.
 *
 * THIS IS THE FIRST SURFACE ON THE SITE THAT SEARCHES WORDS RATHER THAN
 * ADDRESSES. `JumpBox` completes citations; `PLAN.md` gap 2 is full-text
 * search over the corpus and is unbuilt. This is neither: it filters a list
 * already in memory, in the reader's own interface language, and its scope is
 * one page's own rows.
 *
 * THE LITERAL TIER IS THIS FILE'S OWN AND THE LOOSE TIER IS NOT. The substring
 * rule below is argued on `matchesQuery` and is deliberately not
 * `highlight.ts`'s; what a reader means by `eutanasia` when the dictionary
 * says `euthanasia` is not a fact about this vocabulary at all, and a second
 * implementation of "near enough" would drift from the first within a week
 * while looking correct in both files. So the fallback is imported whole,
 * band rule and all: `filterByQuery` takes this file's literal tier as its
 * argument and keeps the one decision that may not vary — that a guess is what
 * a list falls back to, never what it mixes in.
 */

import { filterByQuery } from './highlight';

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

/**
 * One row as the page knows it: an address, the two strings a reader reads and
 * the one they do not.
 */
export interface TopicSearchRow {
	slug: string;
	title: string;
	question: string;
	/** Comma-separated, in the reader's own language, additive to the pair
	 *  above — a term already in the title or the question is already matched
	 *  and buys nothing here. Empty is legitimate and means the dictionary has
	 *  none for this topic yet. */
	keywords: string;
}

/**
 * A dictionary's keywords for one topic, or nothing where it has none.
 *
 * `t()` FALLS BACK TO THE KEY, which for a string on the page is a legible
 * defect and for this one is a silent bug: `quaestiones.crematio.keywords` in
 * the haystack makes the slug searchable — the thing the first rule above says
 * it is not — and makes the bare word `quaestiones` match every row on the
 * page. So the page asks here rather than trusting the lookup.
 */
export function keywordsFrom(key: string, value: string): string {
	return value === key ? '' : value;
}

/** The three strings a row is searched on, as one. */
function haystack(row: TopicSearchRow): string {
	return `${row.title} ${row.question} ${row.keywords}`;
}

/**
 * The slugs a query keeps, as a set the page can test membership against.
 *
 * A SET AND NOT A FILTERED LIST, because the page's grouping is
 * doorway-then-cluster and it has to decide, per group, whether the group
 * survives at all. Handing back a flat list would make the page rebuild that
 * structure from it.
 *
 * A misspelling is answered only where nothing else was — a reader who types
 * `eutanasia` meant a topic that exists and would otherwise meet a page saying
 * it does not, and a reader whose words matched sixteen rows is owed those
 * sixteen and not a seventeenth that merely looks like one of them.
 * `filterByQuery` is that rule and carries the measurement behind it; the only
 * thing this page brings is `matchesQuery`, its own literal tier.
 */
export function matchingSlugs(rows: TopicSearchRow[], query: string): Set<string> {
	return new Set(filterByQuery(rows, haystack, query, matchesQuery).map((row) => row.slug));
}
