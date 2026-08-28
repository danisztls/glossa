/**
 * Suggester tests.
 *
 * These run against the FIXTURES, not the corpus (`corpus.ts` checks
 * `import.meta.env.VITEST` explicitly), which is two Bible books in four
 * editions, ten Catechism paragraphs in two, a handful of Compendium
 * questions and four Summa questions across three parts. That is small, and
 * it is also why the fixtures are shaped the way they are: they are
 * deliberately GAPPY (`corpus-index.ts`), so a numeric completion that
 * assumed a contiguous range would fail here rather than in production.
 *
 * What cannot be asserted here is the document and prayer half — the fixtures
 * carry neither — so those paths are exercised through their shape (a title
 * index that resolves an edition per interface language) rather than through
 * a row. The book tables, which is where the per-language behaviour actually
 * lives, are real in every environment: `refs-grammar.ts` imports nothing.
 */

import fuzzysort from 'fuzzysort';
import { beforeEach, describe, expect, it } from 'vitest';
import { dictionaryFor, i18n } from './i18n.svelte';
import { resetSuggestCaches, setFuzzyRanker, suggest } from './suggest';

/** The caches are keyed by language, and `t()` reads the store — so a test
 *  that switches language must not see the previous one's rows. */
beforeEach(() => {
	i18n.lang = 'en';
	resetSuggestCaches();
	// No loose matcher by default. That is the state a reader is in for the
	// first few milliseconds after the box opens, and every assertion outside
	// the `fuzzy` block below is about what the LITERAL tiers answer — so a
	// suite that left the matcher installed would stop testing them.
	setFuzzyRanker(undefined);
});

/** The ranker `JumpBox` injects, threshold and all. Kept identical on purpose:
 *  a test against different settings tests nothing anyone runs. */
function installFuzzyRanker() {
	setFuzzyRanker((needle, haystack) =>
		fuzzysort
			.go(needle, haystack, { key: 'text', limit: 40, threshold: 0.3 })
			.map((hit) => ({ index: hit.obj.index, score: hit.score }))
	);
}

const hrefs = (query: string, opts = {}) =>
	suggest(query, { lang: 'en', ...opts }).map((s) => s.href);
const labels = (query: string, opts = {}) =>
	suggest(query, { lang: 'en', ...opts }).map((s) => s.label);

describe('suggest', () => {
	it('offers nothing for an empty query', () => {
		expect(suggest('')).toEqual([]);
		expect(suggest('   ')).toEqual([]);
	});

	describe('books', () => {
		it('completes a partly-typed book to its first chapter', () => {
			expect(hrefs('gene')).toContain('/scriptura/gen/1');
		});

		it('completes an abbreviation the edition prints', () => {
			// `gn` is Genesis in the Portuguese edition's `abbrevs` and in the
			// English one's; either tier reaches the same book.
			expect(hrefs('gn')).toContain('/scriptura/gen/1');
		});

		it('offers the introduction beside chapter 1 when one book is left standing', () => {
			// Only when the book is unambiguous: a second row per book would be
			// clutter across six of them.
			expect(hrefs('genesis')).toEqual(['/scriptura/gen/1', '/scriptura/gen/0']);
		});

		it('names the book as the reader’s own edition names it', () => {
			expect(labels('gen')[0]).toBe('Genesis 1');
		});

		it('reads a book token nothing answers to as no book at all', () => {
			expect(hrefs('zzzz')).toEqual([]);
		});
	});

	describe('chapters and verses', () => {
		it('takes an exact chapter first', () => {
			expect(hrefs('john 3')).toEqual(['/scriptura/john/3']);
		});

		it('completes a verse in progress, the finished reading first', () => {
			// John 3 carries verses 1-21 in the fixture, so `1` is verse 1 and the
			// start of 10..21. The expansion is capped: a reader who has typed one
			// digit has said almost nothing.
			expect(hrefs('john 3:1')).toEqual([
				'/scriptura/john/3#v1',
				'/scriptura/john/3#v10',
				'/scriptura/john/3#v11',
				'/scriptura/john/3#v12'
			]);
		});

		it('offers no verse the corpus does not carry', () => {
			expect(hrefs('john 3:999')).toEqual([]);
		});

		it('writes the separator this language prints', () => {
			expect(labels('john 3:16')[0]).toBe('John 3:16');
			i18n.lang = 'pt';
			resetSuggestCaches();
			// The Portuguese grammar separates with a comma ("Act 2, 42"), and the
			// label is the citation as the reader would write it.
			expect(suggest('john 3:16', { lang: 'pt' })[0].label).toMatch(/3,16$/);
		});

		it('reads a complete citation as one address', () => {
			expect(hrefs('john 3:16-18')[0]).toBe('/scriptura/john/3?v=16-18#v16');
		});
	});

	// NOT TESTED HERE, and deliberately said so: the divergent-numbering path
	// (`ps 23` offering Psalm 22 and Psalm 23, in that order) needs one of
	// Psalms, Malachi or Joel to exist, and the fixtures carry Genesis and John.
	// The conversion itself is `versification.test.ts`'s, and this module reaches
	// it through the same `resolveVulgate` the reference grammar does.

	describe('the numbered works', () => {
		it('reads a bare number as both works that number it', () => {
			// 27 is a Catechism paragraph and a Compendium question; the fixture
			// carries both.
			expect(hrefs('27')).toContain('/catechismus/27');
		});

		it('takes a keyword and a number', () => {
			expect(hrefs('ccc 27')[0]).toBe('/catechismus/27');
		});

		it('accepts a keyword from a language other than the interface one', () => {
			// The interface language decides what a row is LABELLED, never what
			// the reader is allowed to type.
			expect(hrefs('catecismo 27')[0]).toBe('/catechismus/27');
		});

		// The sigla each edition actually prints beside its references, read
		// from the same fourteen dictionaries the names come from. A reader who
		// is shown a form has to be able to type it back.
		it('accepts the siglum a citation would use, in any language', () => {
			for (const siglum of ['CCC', 'CIC', 'CCE', 'KKK', 'CEC', 'KEK', 'CBC', 'KKC', 'ККЦ']) {
				expect(hrefs(`${siglum} 27`)[0]).toBe('/catechismus/27');
			}
			expect(hrefs('Comp. 1')[0]).toBe('/catechismus/compendium/1');
			expect(hrefs('Komp. 1')[0]).toBe('/catechismus/compendium/1');
			expect(hrefs('Комп. 1')[0]).toBe('/catechismus/compendium/1');
		});

		// A full stop is how an abbreviation is written, not a distinction
		// between two of them: no two section names in fourteen dictionaries
		// are told apart by one. `comp. 1` found nothing until 2026-08-28 while
		// `comp 1` worked, and `ccc. 27` worked only because the reference
		// grammar reads that one and tolerates the stop itself.
		it('ignores the punctuation an abbreviation is written with', () => {
			expect(hrefs('comp. 1')).toEqual(hrefs('comp 1'));
			expect(hrefs('Comp. 1')).toEqual(hrefs('comp 1'));
			expect(hrefs('ccc. 27')).toEqual(hrefs('ccc 27'));
			expect(hrefs('s.th.')).toEqual(['/summa']);
		});

		it('offers the section’s landing page for a bare keyword', () => {
			expect(hrefs('catech')).toEqual(['/catechismus']);
			expect(hrefs('prayers')).toEqual(['/preces']);
		});

		it('skips a number the corpus does not carry', () => {
			// The fixtures are gappy on purpose: 31..43 are absent.
			expect(hrefs('ccc 31')).toEqual([]);
		});

		it('grows a digit-prefix into the numbers that do exist', () => {
			// `4` is not a paragraph in the fixture; 44..49 are.
			expect(hrefs('ccc 4')).toEqual([
				'/catechismus/44',
				'/catechismus/45',
				'/catechismus/46',
				'/catechismus/47',
				'/catechismus/48'
			]);
		});

		it('spells a leading zero the one canonical way', () => {
			// `address.ts` admits `/catechismus/1234` and not `/catechismus/01234`,
			// so a typed `027` may resolve — it just may not mint a second address
			// for the same paragraph.
			expect(hrefs('ccc 027')).toEqual(['/catechismus/27']);
		});

		it('names the paragraph’s chapter beside it', () => {
			expect(suggest('ccc 27', { lang: 'en' })[0].detail).toBe('Man’s Capacity for God');
		});
	});

	describe('the Summa', () => {
		it('reads a part and a question', () => {
			expect(hrefs('sth i 1')[0]).toBe('/summa/i/1');
		});

		it('reads an unambiguous part with no work named', () => {
			expect(hrefs('ii-ii 184')[0]).toBe('/summa/ii-ii/184');
		});

		it('will not read a lone Roman numeral as a part', () => {
			// `i` and `ii` are numerals in every other citation on the site. (It
			// is still a book prefix — `io` is John in the Clementine — which is
			// the point: the Summa producer declines, the others do not have to.)
			expect(suggest('i 1', { lang: 'en' }).some((s) => s.kind === 'summa')).toBe(false);
		});

		it('drops the article count CCEL prints in the title', () => {
			expect(suggest('ii-ii 184', { lang: 'en' })[0].detail).toBe(
				'Of the State of Perfection in General'
			);
		});
	});

	describe('titles', () => {
		it('matches a question by a word inside its title', () => {
			const found = suggest('perfection', { lang: 'en' });
			expect(found.map((s) => s.href)).toContain('/summa/ii-ii/184');
		});

		it('will not match a title on one letter', () => {
			// A section name still answers to one letter — there are six of them
			// and they are the coarsest thing the box can offer. A title does not.
			expect(suggest('p', { lang: 'en' }).every((s) => s.kind === 'section')).toBe(true);
		});

		it('takes three characters before an interior substring counts', () => {
			// Two letters match most of a corpus; the specific rows above would be
			// pushed off the end of a list the reader can only see eight of.
			const two = suggest('rf', { lang: 'en' }).map((s) => s.href);
			expect(two).not.toContain('/summa/ii-ii/184');
			expect(suggest('rfec', { lang: 'en' }).map((s) => s.href)).toContain('/summa/ii-ii/184');
		});
	});

	describe('language', () => {
		it('labels from the call’s language, not the store’s', () => {
			// `suggest` takes its language as an argument; a function that
			// half-follows its argument and half-follows a global is untestable.
			i18n.lang = 'en';
			expect(suggest('ccc 27', { lang: 'pt' })[0].label).toBe('Catecismo 27');
			expect(suggest('ccc 27', { lang: 'la' })[0].badge).toBe(
				// Whatever Latin calls the Catechism — read from the dictionary
				// rather than spelled here, so this asserts the wiring and not a
				// translation somebody may revise.
				dictionaryFor('la')['nav.ccc']
			);
		});

		it('falls back to English for a key a dictionary leaves out', () => {
			// Partial dictionaries are expected (`i18n.svelte.ts`), and a missing
			// key must not surface as the key itself.
			expect(suggest('ccc 27', { lang: 'sv' })[0].label).toMatch(/ 27$/);
		});
	});

	describe('completion', () => {
		/**
		 * The property Tab rests on: a completion is an INPUT, so feeding it back
		 * in must offer the same address again — and offer it FIRST, or Tab would
		 * move the reader's chosen row down the list it just came from.
		 *
		 * Swept over every query shape the fixtures can reach rather than spot-
		 * checked, because the rows whose completion differs from their label
		 * (the Summa's, the book introduction's) are exactly the ones nobody
		 * would think to spot-check.
		 */
		const queries = [
			'gen',
			'genesis',
			'john 3',
			'john 3:1',
			'john 3:16-18',
			'ccc 27',
			'ccc 4',
			'27',
			'sth i 1',
			'ii-ii 184',
			'perfection',
			'catech',
			'prayers',
			// A misspelling completes to the real spelling, which is then read
			// literally — the property that makes the loose tier safe to Tab.
			'jonh',
			'genesus'
		];

		it('re-offers the same address, first', () => {
			for (const query of queries) {
				const rows = suggest(query, { lang: 'en' });
				for (const suggestion of rows) {
					const again = suggest(suggestion.completion, { lang: 'en' });
					// First — unless a HOMOGRAPH exists, which is a fact about the
					// corpus and not about this module: the Compendium reproduces
					// the Catechism's structure headings verbatim, so one title is
					// the complete and honest name of two chapter addresses. Both
					// rows survive the completion and the reader picks between
					// them, so "offered" is the guarantee and "first" is the
					// guarantee everywhere the name is unique.
					const homograph = again.filter((row) => row.completion === suggestion.completion);
					const message = `${query} -> ${suggestion.completion}`;
					if (homograph.length > 1) {
						expect(
							again.map((row) => row.href),
							message
						).toContain(suggestion.href);
					} else {
						expect(again[0]?.href, message).toBe(suggestion.href);
					}
				}
			}
		});

		it('is a fixed point — completing twice changes nothing', () => {
			for (const query of queries) {
				for (const suggestion of suggest(query, { lang: 'en' })) {
					const again = suggest(suggestion.completion, { lang: 'en' })[0];
					expect(again.completion, suggestion.completion).toBe(suggestion.completion);
				}
			}
		});

		it('parts company with the label where the label is not grammar', () => {
			// "Summa II-II, Q 184" reads well and parses as nothing.
			const summa = suggest('ii-ii 184', { lang: 'en' })[0];
			expect(summa.label).not.toBe(summa.completion);
			expect(summa.completion).toBe('summa ii-ii 184');

			// "Genesis · Introduction" is not a chapter number.
			const intro = suggest('genesis', { lang: 'en' }).find((s) => s.href.endsWith('/0'));
			expect(intro?.completion).toBe('Genesis 0');
		});
	});

	describe('misspelled books', () => {
		// Bounded edit distance, and a separate matcher from the one above:
		// fuzzysort reads a subsequence, and a transposition is not one. It is
		// also NOT behind the lazy import — it is twenty lines in this module,
		// so it answers on the first keystroke.

		it('reads a transposition, which fuzzysort structurally cannot', () => {
			expect(suggest('jonh', { lang: 'en' })[0]?.label).toBe('John 1');
			expect(suggest('jhon', { lang: 'en' })[0]?.label).toBe('John 1');
		});

		it('ranks the right letters in the wrong order above a wrong letter', () => {
			// The real corpus is what makes this matter: `jonh` is one edit from
			// Joshua, Jonah AND John, and only John is reached by rearranging the
			// letters that were actually typed. All three are offered; the
			// rearrangement leads.
			expect(suggest('jonh', { lang: 'en' })[0]?.href).toBe('/scriptura/john/1');
		});

		it('reads a substitution and a deletion', () => {
			expect(suggest('genesus', { lang: 'en' })[0]?.label).toBe('Genesis 1');
			expect(suggest('gnesis', { lang: 'en' })[0]?.label).toBe('Genesis 1');
		});

		it('carries the number through', () => {
			expect(suggest('jonh 3', { lang: 'en' })[0]?.label).toBe('John 3');
			expect(suggest('jonh 3:16', { lang: 'en' })[0]?.label).toBe('John 3:16');
		});

		it('does not run below four characters', () => {
			// At three, one edit reaches most of the canon — and `jo` is a
			// LITERAL reading of John, which is the inversion `book-token.ts`
			// warns about.
			expect(suggest('gne', { lang: 'en' }).filter((row) => row.kind === 'bible')).toEqual([]);
		});

		it('does not run when the token spells a real book', () => {
			// A token that reads is never also a near-miss of something else.
			const rows = suggest('joh', { lang: 'en' }).filter((row) => row.kind === 'bible');
			expect(rows.length).toBeGreaterThan(0);
			for (const row of rows) expect(row.href).toMatch(/^\/scriptura\/john\b/);
		});

		it('is refused by the shapes that promise an exact address', () => {
			// `exactReference` sits in the top band and confirms what the reader
			// typed. A guessed book with a verse range attached is a guess wearing
			// a certainty, so it is declined rather than demoted.
			expect(suggest('jonh 3:1-5', { lang: 'en' }).filter((r) => r.kind === 'bible')).toEqual([]);
			expect(suggest('john 3:1-5', { lang: 'en' })[0]?.kind).toBe('bible');
		});
	});

	describe('fuzzy', () => {
		it('is absent until a ranker is injected', () => {
			// The module never imports one: `fuzzysort` is 7.5 KB gzipped and this
			// runs in the boot chunk (see the module docblock). Everything below
			// must therefore also be true of a box whose lazy import has not
			// landed yet — which is to say, nothing extra is offered.
			expect(suggest('capcity', { lang: 'en' })).toEqual([]);
		});

		it('reads through a typo once one is', () => {
			installFuzzyRanker();
			const found = suggest('capcity', { lang: 'en' });
			expect(found.map((s) => s.href)).toContain('/catechismus/caput/27');
		});

		it('gives up on a long title before a short one, which the threshold buys', () => {
			// fuzzysort penalises by target length, so the same class of typo
			// scores differently against different names: `capcity` against "Man's
			// Capacity for God" is 0.327 and `perfecton` against the Summa's "Of
			// the State of Perfection in General (Eight Articles)" is 0.282, just
			// under the 0.3 the threshold sweep settled on. That is the cost side
			// of the number and it is real — 0.25 recovers this one and starts
			// filling the list with noise, which is the trade `JumpBox` records.
			installFuzzyRanker();
			expect(suggest('perfecton', { lang: 'en' })).toEqual([]);
		});

		it('cannot read through a TRANSPOSITION, and that is the algorithm', () => {
			// fuzzysort matches a subsequence, so a dropped or inserted letter is
			// forgiven and two swapped ones are not: `perfecton` reads, `perfectoin`
			// does not, because its `o` precedes its `i` and the target's does not.
			// Stated as a test rather than left as folklore — the next person to
			// see it will otherwise file it as a bug and tune the threshold, which
			// cannot fix it at any value. BOOKS are the exception and have their
			// own matcher for exactly this reason (`misspelled books` below);
			// titles do not, because a distance-2 window over hundreds of long
			// names has not been measured.
			installFuzzyRanker();
			expect(suggest('perfectoin', { lang: 'en' })).toEqual([]);
		});

		it('reads a section name loosely', () => {
			installFuzzyRanker();
			expect(suggest('ctechism', { lang: 'en' })[0]?.href).toBe('/catechismus');
		});

		it('will not mint a unit number from a section it only guessed at', () => {
			// Two guesses stacked — which work was meant, and that the digits are
			// its unit number. The second is not one this module may make.
			installFuzzyRanker();
			expect(suggest('ctechism 27', { lang: 'en' }).map((s) => s.href)).not.toContain(
				'/catechismus/27'
			);
		});

		it('never displaces a literal reading', () => {
			// The whole of why fuzzy sits in its own band: it may add rows below
			// what something actually read, never reorder them.
			for (const [query, first] of [
				['gen', '/scriptura/gen/1'],
				['john 3:16', '/scriptura/john/3#v16'],
				['ccc 27', '/catechismus/27'],
				['catech', '/catechismus'],
				['ii-ii 184', '/summa/ii-ii/184']
			] as const) {
				setFuzzyRanker(undefined);
				const literal = suggest(query, { lang: 'en' });
				installFuzzyRanker();
				const withFuzzy = suggest(query, { lang: 'en' });
				expect(withFuzzy[0]?.href, query).toBe(first);
				// Every row the literal tiers produced is still there, in order.
				expect(
					withFuzzy.slice(0, literal.length).map((s) => s.href),
					query
				).toEqual(literal.map((s) => s.href));
			}
		});

		it('takes three characters before it will guess at all', () => {
			// Two characters read loosely reach most of a corpus. `MIN_FUZZY_LENGTH`
			// is what stops the list turning over on every keystroke of a word.
			installFuzzyRanker();
			const two = suggest('xq', { lang: 'en' });
			expect(two).toEqual([]);
		});

		it('completes what it guessed, and the completion is exact', () => {
			// A fuzzy row's completion is the real title, so Tab converts a guess
			// into something the literal tiers read — the round trip holds even
			// where the first reading did not.
			installFuzzyRanker();
			const row = suggest('capcity', { lang: 'en' })[0];
			expect(suggest(row.completion, { lang: 'en' })[0].href).toBe(row.href);
		});
	});

	it('honours the caller’s limit', () => {
		expect(suggest('john 3:1', { lang: 'en' }).length).toBeGreaterThan(2);
		expect(suggest('john 3:1', { lang: 'en', limit: 2 })).toHaveLength(2);
	});

	it('never offers one address twice', () => {
		// `john 3:16` is read by the exact-citation path AND by the partial
		// matcher; they agree, and one row is the answer.
		const found = hrefs('john 3:16');
		expect(new Set(found).size).toBe(found.length);
	});
});
