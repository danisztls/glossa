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
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { dictionaryFor, i18n, loadedDictionary } from './i18n.svelte';
import { parseSectionFilter, resetSuggestCaches, setFuzzyRanker, suggest } from './suggest';
import type { TopicIndex } from './types';

/**
 * `suggest` labels a row through `tr`, which reads only the dictionaries that
 * are RESIDENT (see `loadedDictionary` in i18n.svelte.ts) — English always is,
 * and in the app the reader's own has been awaited before anything renders.
 * A test naming any other language has to say so, or it would assert against
 * English and pass for the wrong reason.
 */
beforeAll(async () => {
	await Promise.all([dictionaryFor('la'), dictionaryFor('pt'), dictionaryFor('sv')]);
});

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
			expect(hrefs('gene')).toContain('/scriptura/genesis/1');
		});

		it('completes an abbreviation the edition prints', () => {
			// `gn` is Genesis in the Portuguese edition's `abbrevs` and in the
			// English one's; either tier reaches the same book.
			expect(hrefs('gn')).toContain('/scriptura/genesis/1');
		});

		it('offers the introduction beside chapter 1 when one book is left standing', () => {
			// Only when the book is unambiguous: a second row per book would be
			// clutter across six of them.
			expect(hrefs('genesis')).toEqual(['/scriptura/genesis/1', '/scriptura/genesis/0']);
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
			expect(hrefs('john 3')).toEqual(['/scriptura/ioannes/3']);
		});

		it('completes a verse in progress, the finished reading first', () => {
			// John 3 carries verses 1-21 in the fixture, so `1` is verse 1 and the
			// start of 10..21. The expansion is capped: a reader who has typed one
			// digit has said almost nothing.
			expect(hrefs('john 3:1')).toEqual([
				'/scriptura/ioannes/3#v1',
				'/scriptura/ioannes/3#v10',
				'/scriptura/ioannes/3#v11',
				'/scriptura/ioannes/3#v12'
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
			expect(hrefs('john 3:16-18')[0]).toBe('/scriptura/ioannes/3?v=16-18#v16');
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
			expect(hrefs('s.th.')).toEqual(['/doctores/summa']);
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
			expect(hrefs('sth i 1')[0]).toBe('/doctores/summa/i/1');
		});

		it('reads an unambiguous part with no work named', () => {
			expect(hrefs('ii-ii 184')[0]).toBe('/doctores/summa/ii-ii/184');
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
			expect(found.map((s) => s.href)).toContain('/doctores/summa/ii-ii/184');
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
			expect(two).not.toContain('/doctores/summa/ii-ii/184');
			expect(suggest('rfec', { lang: 'en' }).map((s) => s.href)).toContain(
				'/doctores/summa/ii-ii/184'
			);
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
				loadedDictionary('la')!['nav.ccc']
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
			expect(suggest('jonh', { lang: 'en' })[0]?.href).toBe('/scriptura/ioannes/1');
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
			for (const row of rows) expect(row.href).toMatch(/^\/scriptura\/ioannes\//);
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
				['gen', '/scriptura/genesis/1'],
				['john 3:16', '/scriptura/ioannes/3#v16'],
				['ccc 27', '/catechismus/27'],
				['catech', '/catechismus'],
				['ii-ii 184', '/doctores/summa/ii-ii/184']
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

	/**
	 * The headings printed INSIDE a work, handed in rather than read.
	 *
	 * The table is an argument (`SuggestOpts.headings`), which is what makes
	 * this testable at all: the fixtures carry no documents, no Code and no
	 * Compendium of the Social Doctrine, so a registry read would have left
	 * the whole producer exercised by nothing. What the fixtures still cannot
	 * reach is the DOCUMENT half — a heading is offered only where the
	 * document itself is in the build — so these rows are the two numbered
	 * works, which need no manifest.
	 */
	describe('section headings', () => {
		const headings = {
			documents: {},
			socialDoctrine: [[20, 'The Church and the human person'] as [number, string]],
			canonLaw: [[7, 'ECCLESIASTICAL LAWS (Cann. 7 - 22)'] as [number, string]]
		};

		it('offers a heading of the Compendium of the Social Doctrine', () => {
			const rows = suggest('human person', { lang: 'en', headings });
			expect(rows[0].label).toBe('The Church and the human person');
			expect(rows[0].href).toContain('20');
			expect(rows[0].badge).toBe('Social Doctrine');
		});

		it('drops the canon range the edition prints inside the heading', () => {
			// Five of the seven editions print `(Cann. 7 - 22)` in the title
			// itself. It is neither part of the name nor anything a reader
			// types, and `canonLawHeadingParts` is what the reading pages use.
			const rows = suggest('ecclesiastical laws', { lang: 'en', headings });
			expect(rows[0].label).toBe('Ecclesiastical Laws');
			expect(rows[0].detail).toBe('Can. 7');
		});

		it('offers nothing when the caller passes no table', () => {
			// The state before the shard lands, and the state under a build
			// that has none — the box completes names alone, as it always did.
			expect(suggest('human person', { lang: 'en' })).toEqual([]);
		});

		it('re-offers the same address when its label is fed back', () => {
			// The property Tab rests on, asserted for the one kind of row the
			// sweep above cannot reach.
			const row = suggest('human person', { lang: 'en', headings })[0];
			expect(suggest(row.completion, { lang: 'en', headings })[0].href).toBe(row.href);
		});

		it('ranks a heading below a work that answers to the same words', () => {
			// `genesis` is a book, and a heading called the same thing is one
			// line inside one edition. The name of the work wins.
			const shadowed = {
				...headings,
				socialDoctrine: [[20, 'Genesis'] as [number, string]]
			};
			const rows = suggest('genesis', { lang: 'en', headings: shadowed });
			expect(rows[0].kind).toBe('bible');
			expect(rows.some((row) => row.kind === 'heading')).toBe(true);
		});

		it('caps the headings so they cannot fill the list', () => {
			const many = {
				documents: {},
				socialDoctrine: Array.from(
					{ length: 12 },
					(_, i) => [i + 1, `On charity ${i + 1}`] as [number, string]
				),
				canonLaw: []
			};
			const rows = suggest('charity', { lang: 'en', headings: many });
			expect(rows.filter((row) => row.kind === 'heading')).toHaveLength(4);
		});

		it('takes three characters before it offers a heading at all', () => {
			// Two characters reach half the corpus; the title tiers still
			// answer, and no heading does.
			const rows = suggest('th', { lang: 'en', headings });
			expect(rows.some((row) => row.kind === 'heading')).toBe(false);
		});
	});

	/**
	 * The topics, whose matchable words are in the DICTIONARIES — the title,
	 * the question, and a line of keywords nobody sees (`topic-search.ts`).
	 * The argument carries only which of them this build published.
	 */
	describe('topics', () => {
		const topic = {
			doorway: 'argument',
			cluster: 'credibility',
			ccc: [[27, 43]] as [number, number][]
		};
		const topics: TopicIndex = {
			doorways: ['argument'],
			clusters: { argument: ['credibility'] },
			topics: { 'dei-existentia': topic }
		};

		it('offers a topic by its title', () => {
			const rows = suggest('whether god exists', { lang: 'en', topics });
			expect(rows[0].href).toBe('/quaestiones/dei-existentia');
			expect(rows[0].kind).toBe('topic');
		});

		it('offers it by the question a reader actually arrives with', () => {
			expect(hrefs('anyone there', { topics })).toContain('/quaestiones/dei-existentia');
		});

		it('offers nothing for a build that published none', () => {
			expect(suggest('whether god exists', { lang: 'en' })).toEqual([]);
		});

		it('skips a topic this build published and nobody has written', () => {
			// The strings live in the dictionaries, so a slug with none would
			// otherwise be offered as a row reading `quaestiones.x.title`.
			const unwritten: TopicIndex = { ...topics, topics: { 'nondum-scripta': topic } };
			expect(labels('nondum', { topics: unwritten })).toEqual([]);
		});

		it('offers the page that lists them, which is a section like any other', () => {
			expect(hrefs('questions')).toContain('/quaestiones');
		});
	});

	/**
	 * A SCOPE: `ccc: church` is "church, in the Catechism".
	 *
	 * Two halves, tested apart. `parseSectionFilter` is where the syntax lives
	 * and is a pure function of a string; what `suggest` does with the answer
	 * is a filter over addresses, which needs rows to filter.
	 */
	describe('a scope', () => {
		describe('the syntax', () => {
			it('reads a section word, a colon, and the rest', () => {
				expect(parseSectionFilter('ccc: church')).toEqual({
					paths: ['/catechismus'],
					names: ['Catechism'],
					word: 'ccc',
					rest: 'church'
				});
			});

			it('does not require the space', () => {
				expect(parseSectionFilter('ccc:church')?.rest).toBe('church');
			});

			it('takes every language’s word, which is the whole reason for the colon', () => {
				// `biblia` is an `extra`; `Bibel` is what the German dictionary
				// calls the section, and both reach it from an English interface.
				expect(parseSectionFilter('biblia: genesis')?.paths).toEqual(['/scriptura']);
				expect(parseSectionFilter('bibel: genesis')?.paths).toEqual(['/scriptura']);
			});

			/**
			 * THE COLLISION WITH SCRIPTURE, and it needs no rule about digits:
			 * what stands left of a citation's colon is a CHAPTER, and no
			 * section's name begins with one.
			 */
			it.each(['jn 3:16', 'ps 118:1', 'genesis 1:1'])('is not a filter in %s', (query) => {
				expect(parseSectionFilter(query)).toBeUndefined();
			});

			it('still resolves a citation written with the colon', () => {
				expect(hrefs('john 3:16')).toContain('/scriptura/ioannes/3#v16');
			});

			/**
			 * The literal tiers only. A loose reading is right for a keyword —
			 * `catechsim` reaches the Catechism — and wrong for a scope, which
			 * would then narrow a search to a work the reader never named.
			 */
			it('refuses a misspelled section', () => {
				expect(parseSectionFilter('catechsim: church')).toBeUndefined();
			});

			/**
			 * A COLON WITH NOTHING AFTER IT IS STILL A SCOPE. It was read as a
			 * keyword with a stop on it — `sectionForm` drops the stop, so
			 * `ccc:` reached the Catechism's landing page and looked right —
			 * but the same string went to `titleSuggestions` too, whose loose
			 * tier answered it with two magisterial documents. The one state in
			 * which the reader has said WHERE they are looking was the state
			 * that answered from somewhere else.
			 */
			it('arms on the colon alone', () => {
				expect(parseSectionFilter('ccc:')?.rest).toBe('');
			});

			it('answers an armed scope with the work it armed on, and nothing else', () => {
				installFuzzyRanker();
				expect(hrefs('ccc:')).toEqual(['/catechismus']);
			});

			it('answers an ambiguous one with each work it could mean', () => {
				expect(hrefs('cic:').sort()).toEqual(['/catechismus', '/ius-canonicum']);
			});

			it('keeps an exact word over the prefixes of the same length', () => {
				expect(parseSectionFilter('can: marriage')?.paths).toEqual(['/ius-canonicum']);
			});

			/** The one ambiguity this table admits on purpose: `CIC` is the
			 *  Catechism in Portuguese and the Code everywhere else. */
			it('scopes to both works a genuinely ambiguous siglum names', () => {
				expect(parseSectionFilter('cic: 27')?.paths.sort()).toEqual([
					'/catechismus',
					'/ius-canonicum'
				]);
			});
		});

		describe('what it filters', () => {
			it('keeps only the work the reader named', () => {
				expect(hrefs('ccc: 27')).toEqual(['/catechismus/27']);
				expect(hrefs('compendium: 1')).toEqual(['/catechismus/compendium/1']);
			});

			/** The one pair of nesting paths, and the reason `sectionPathOf`
			 *  takes the LONGEST match: `/catechismus/compendium/1` sits under
			 *  `/catechismus` and is not the Catechism's. */
			it('does not let the Catechism swallow its own Compendium', () => {
				expect(hrefs('ccc: 1')).not.toContain('/catechismus/compendium/1');
			});

			it('drops a row from another work that merely shares the letters', () => {
				// A Summa question's title carries "gene" and is offered beside
				// Genesis; naming the Bible is how a reader says which they meant.
				expect(hrefs('gene')).toContain('/doctores/summa/ii-ii/184');
				expect(hrefs('biblia: gene')).not.toContain('/doctores/summa/ii-ii/184');
				expect(hrefs('biblia: gene')).toContain('/scriptura/genesis/1');
			});

			it('scopes a name as well as a number', () => {
				expect(hrefs('ccc: gene')).toEqual([]);
			});
		});

		/**
		 * The per-kind caps exist to stop one producer filling a list of eight
		 * that six others belong in. Under a scope there are no others.
		 */
		describe('the caps', () => {
			const headings = {
				documents: {},
				socialDoctrine: [],
				canonLaw: [
					[10, 'The Principle of Legality'],
					[20, 'The Principle of Subsidiarity'],
					[30, 'The Principle of Solidarity'],
					[40, 'The Principle of the Common Good'],
					[50, 'The Principle of Equity'],
					[60, 'The Principle of Proportionality']
				] as [number, string][]
			};

			it('holds a heading producer to four rows unscoped', () => {
				expect(hrefs('principle', { headings })).toHaveLength(4);
			});

			it('gives the whole list to the work the reader named', () => {
				expect(hrefs('can: principle', { headings })).toHaveLength(6);
			});
		});

		it('answers nothing where the work holds nothing, rather than answering elsewhere', () => {
			const headings = {
				documents: {},
				socialDoctrine: [],
				canonLaw: [[1055, 'Marriage']] as [number, string][]
			};
			expect(hrefs('marriage', { headings })).toContain('/ius-canonicum/1055');
			expect(hrefs('ccc: marriage', { headings })).toEqual([]);
		});
	});
});
