import { describe, expect, it } from 'vitest';
import {
	filterByQuery,
	highlight,
	looselyMatches,
	matchesQuery,
	type HighlightSegment
} from './highlight';
import { fold } from './suggest';

/** The marked runs, in order — what a reader actually sees emphasized. */
function marks(segments: HighlightSegment[]): string[] {
	return segments.filter((segment) => segment.hit).map((segment) => segment.text);
}

/** The property every case below depends on: rendering the segments in order
 *  reproduces the label. A highlighter that drops or duplicates a character is
 *  a highlighter that silently rewrites the corpus's own titles. */
function joined(segments: HighlightSegment[]): string {
	return segments.map((segment) => segment.text).join('');
}

describe('highlight', () => {
	it('marks a prefix of the label', () => {
		const segments = highlight('Lumen Gentium', 'lumen');
		expect(marks(segments)).toEqual(['Lumen']);
		expect(joined(segments)).toBe('Lumen Gentium');
	});

	it('marks each token of the query separately', () => {
		expect(marks(highlight('John 3:16', 'john 3:16'))).toEqual(['John', '3', '16']);
	});

	it('marks the tokens it can and leaves the rest alone', () => {
		// The reader typed the siglum; the row is spelled out. Half an
		// explanation is the honest amount here.
		expect(marks(highlight('Catechism 27', 'ccc 27'))).toEqual(['27']);
	});

	it('marks a word start inside the label', () => {
		expect(marks(highlight('Fides et Ratio', 'rat'))).toEqual(['Rat']);
	});

	it('marks every word the token opens', () => {
		expect(marks(highlight('De Ecclesia in Ecclesiis', 'eccl'))).toEqual(['Eccl', 'Eccl']);
	});

	it('ignores an interior hit below four characters', () => {
		// `ave` inside "Inter Graves" is the measurement `MIN_INTERIOR` records.
		expect(marks(highlight('Inter Graves', 'ave'))).toEqual([]);
	});

	it('marks an interior hit from four characters', () => {
		expect(marks(highlight('Ingravescentibus Malis', 'grav'))).toEqual(['grav']);
	});

	it('prefers word starts over interior hits of the same token', () => {
		// "Graves" opens with the token, so the `grav` buried in
		// "Ingravescentibus" is not also marked — one tier at a time.
		expect(marks(highlight('Ingravescentibus Graves', 'grav'))).toEqual(['Grav']);
	});

	it('marks a one-letter token only where it is the whole word', () => {
		// "Summa I-II, Q 1" is the reader's own query; "In"/"Is"/"Intention"
		// down a column of Summa titles is a list wearing highlights.
		expect(marks(highlight('Summa I-II, Q 1', 'summa i-ii 1'))).toEqual(['Summa', 'I', 'II', '1']);
		expect(marks(highlight('Of the Manner in Which the Will Is Moved', 'i'))).toEqual([]);
	});

	it('marks a one-digit token as a prefix, unlike a letter', () => {
		// A digit is an address, and a typed prefix of a longer number is why
		// the row is on the list at all.
		expect(marks(highlight('Job 30', 'jo 3'))).toEqual(['Jo', '3']);
	});

	it('is accent- and case-insensitive but returns the original characters', () => {
		const segments = highlight('São João', 'sao joao');
		expect(marks(segments)).toEqual(['São', 'João']);
		expect(joined(segments)).toBe('São João');
	});

	it('keeps a combining mark with the base it sits on', () => {
		// Decomposed input: the mark folds to nothing and has no index of its
		// own, so it must fall inside the run rather than just outside it.
		const decomposed = 'São';
		const segments = highlight(decomposed, 'sao');
		expect(joined(segments)).toBe(decomposed);
		expect(marks(segments)).toEqual([decomposed]);
	});

	it('returns one unmarked segment when nothing matches', () => {
		expect(highlight('Lumen Gentium', 'rosary')).toEqual([{ text: 'Lumen Gentium', hit: false }]);
	});

	it('returns nothing for empty text', () => {
		expect(highlight('', 'lumen')).toEqual([]);
	});

	it('returns one unmarked segment for a query with no word characters', () => {
		expect(highlight('Lumen Gentium', '   ,  ')).toEqual([{ text: 'Lumen Gentium', hit: false }]);
	});

	describe('loose', () => {
		it('is off unless asked for', () => {
			expect(marks(highlight("Man's Capacity for God", 'capcity'))).toEqual([]);
		});

		it('marks the subsequence a typo actually walked', () => {
			const segments = highlight("Man's Capacity for God", 'capcity', { loose: true });
			expect(marks(segments)).toEqual(['Cap', 'city']);
			expect(joined(segments)).toBe("Man's Capacity for God");
		});

		it('ignores the query’s own spacing', () => {
			const spaced = marks(highlight('Rerum Novarum', 'rerm nvrum', { loose: true }));
			const run = marks(highlight('Rerum Novarum', 'rermnvrum', { loose: true }));
			expect(spaced.length).toBeGreaterThan(0);
			expect(spaced).toEqual(run);
		});

		it('never runs on a token a literal tier answered', () => {
			// "gentium" is there literally, so the loose pass — which would also
			// pick up the `l`, `u` and `m` of a query like "lumgen" — is not
			// consulted for it.
			expect(marks(highlight('Lumen Gentium', 'gentium', { loose: true }))).toEqual(['Gentium']);
		});

		/** Per token, so the half of a query that was typed correctly is marked
		 *  for the evidence it is and the half that was not is still explained.
		 *  A row whose marks stop at the first word reads as a row that ignored
		 *  the rest of what was typed. */
		it('runs on the tokens a literal tier did not answer, beside those it did', () => {
			const text = 'Leo XIII\nOn the condition of labour';
			expect(marks(highlight(text, 'leo labr', { loose: true }))).toEqual(['Leo', 'lab', 'r']);
		});

		/** The walk is greedy and leftmost, so it is the FIELD it runs in that
		 *  keeps it honest: `labr` starting from the `l` of "Leo" strings four
		 *  letters across thirty and explains nothing, and a haystack that did
		 *  not separate its fields would lose the mark it should have had. */
		it('walks one field at a time', () => {
			expect(marks(highlight('Leo XIII on labour', 'labr', { loose: true }))).toEqual([]);
			expect(marks(highlight('Leo XIII\non labour', 'labr', { loose: true }))).toEqual([
				'lab',
				'r'
			]);
		});

		it('needs four characters, the number an interior literal hit needs', () => {
			expect(marks(highlight('Lumen Gentium', 'lm', { loose: true }))).toEqual([]);
			// `rav` sits contiguously inside the word and `occurrences` refuses
			// it below four characters; a loose pass that walked the same three
			// letters would be the gate removed rather than a fallback.
			expect(marks(highlight('Ingravescentibus', 'rav', { loose: true }))).toEqual([]);
		});

		it('marks the word a transposition was aimed at, whole', () => {
			// A transposition is not a subsequence — the limit `suggest.ts`
			// records for `fuzzysort` itself — and `boundedEdit` is why the row
			// is on the list at all. Marking the word is what stops it from
			// arriving with no explanation on it.
			expect(marks(highlight('Of Perfection', 'perfectoin', { loose: true }))).toEqual([
				'Perfection'
			]);
			expect(marks(highlight('Daniel 1', 'deniel', { loose: true }))).toEqual(['Daniel']);
		});

		it('marks nothing when no word is within one edit either', () => {
			expect(marks(highlight('Of Perfection', 'porcelain', { loose: true }))).toEqual([]);
		});

		it('refuses a subsequence strung across the whole label', () => {
			// The `dani` case: four letters exist somewhere in almost any
			// sentence, and marking them is a row wearing highlights.
			expect(
				marks(highlight("Of Man's Various Duties and States in General", 'dani', { loose: true }))
			).toEqual([]);
		});

		it('refuses a dense subsequence that is nothing but fragments', () => {
			// Tight enough to pass the density gate (4 of 6) and still noise:
			// `Quo`d` An`n`i`versarius`, one row under the `dani` case above.
			expect(marks(highlight('Quod Anniversarius', 'dani', { loose: true }))).toEqual([]);
		});

		it('marks a dropped vowel, which is two pieces of a short word', () => {
			expect(marks(highlight('Psalms 23', 'psms', { loose: true }))).toEqual(['Ps', 'ms']);
		});

		it('still marks the dense subsequence the same query finds elsewhere', () => {
			// The other half of that pair, and the reason the gate is density
			// rather than the query's length: one list, one keystroke, both rows.
			expect(marks(highlight('Daniel 1', 'dani', { loose: true }))).toEqual(['Dani']);
		});

		it('prefers a dense subsequence to a near word', () => {
			// "Rosary" is within one edit of `rosry` AND contains it as a
			// subsequence; the subsequence marks what the reader typed.
			expect(marks(highlight('The Holy Rosary', 'rosry', { loose: true }))).toEqual(['Ros', 'ry']);
		});
	});

	describe('folding agrees with the matcher', () => {
		// `highlight.ts` folds per code point so it can map spans back; `fold`
		// folds the whole string at once. They must agree, or a row matches and
		// then shows no mark. One word each, so the whole string is one token
		// and a match has to cover all of it.
		const battery = [
			'Gentium',
			'S\u00E3o', // precomposed
			'Sa\u0303o', // the same word decomposed
			'\u0130stanbul', // folds to one `i`, not the two JS `toLowerCase` alone gives
			'\u0393\u03A1\u0391\u03A6\u0397',
			'\u041A\u0430\u0442\u0435\u0301\u0445\u0438\u0437\u0438\u0441',
			'\u0627\u0644\u0645\u0642\u062F\u0633'
		];

		for (const [index, text] of battery.entries()) {
			it(`${index}: ${text}`, () => {
				const segments = highlight(text, fold(text));
				expect(joined(segments)).toBe(text);
				expect(marks(segments).join('')).toBe(text);
			});
		}
	});
});

describe('matchesQuery', () => {
	const row = [
		'Rerum Novarum',
		'Leo XIII',
		'Encyclical',
		'On the condition of labour.',
		'labour'
	].join('\n');

	it('matches every token, not just one', () => {
		expect(matchesQuery(row, 'leo labour')).toBe(true);
		expect(matchesQuery(row, 'leo eucharist')).toBe(false);
	});

	it('is insensitive to case and to diacritics both ways round', () => {
		expect(matchesQuery('Thérèse of Lisieux', 'therese')).toBe(true);
		expect(matchesQuery('Therese of Lisieux', 'Thérèse')).toBe(true);
	});

	it('matches everything on an empty or punctuation-only query', () => {
		expect(matchesQuery(row, '')).toBe(true);
		expect(matchesQuery(row, '   ')).toBe(true);
		expect(matchesQuery(row, '—')).toBe(true);
	});

	// The property the docblock claims: a row is a result exactly when the
	// highlighter has something to draw on it. Asserted rather than assumed,
	// because the two would drift silently and only in the direction a reader
	// notices — a result with nothing marked on it.
	it('agrees with highlight: a match always leaves something to mark', () => {
		for (const query of ['leo', 'labour', 'novarum', 'condition', 'rerum nov']) {
			expect(matchesQuery(row, query), query).toBe(true);
			expect(
				highlight(row, query).some((segment) => segment.hit),
				query
			).toBe(true);
		}
	});

	// A field separator must not let a token run across two fields: the author
	// ends and the kind begins, and "xiiiencyclical" is not a thing anyone typed.
	it('does not match across the newline that separates two fields', () => {
		expect(matchesQuery('Leo XIII\nEncyclical', 'xiiiencyclical')).toBe(false);
	});

	// Below four characters an interior hit is noise — the same gate `highlight`
	// applies, which is the whole reason this lives beside it.
	it('declines a short token that only appears inside a word', () => {
		expect(matchesQuery('Ingravescentibus', 'rav')).toBe(false);
		expect(matchesQuery('Ingravescentibus', 'gravescent')).toBe(true);
	});
});

describe('looselyMatches', () => {
	const row = [
		'Rerum Novarum',
		'Leo XIII',
		'Encyclical',
		'On the condition of labor.',
		'labour'
	].join('\n');

	it('reads a misspelling the literal tiers cannot', () => {
		expect(matchesQuery(row, 'rermnvrum')).toBe(false);
		expect(looselyMatches(row, 'rermnvrum')).toBe(true);
	});

	/** The ordinary shape of a mistyped query: one word right, one word wrong.
	 *  A token read literally is never re-read loosely — it has answered. */
	it('carries a query on the word that was typed correctly and the one that was not', () => {
		expect(looselyMatches(row, 'rerum novarm')).toBe(true);
		expect(looselyMatches(row, 'leo eucharst')).toBe(false);
	});

	it('reads a transposition, which no subsequence can', () => {
		expect(looselyMatches('John Paul II', 'jonh')).toBe(true);
	});

	/** The seam rule the literal tier gets for free: `indexOf` cannot cross a
	 *  newline, and a subsequence steps over anything, so the walk is confined
	 *  to one field. */
	it('does not walk across the newline that separates two fields', () => {
		expect(looselyMatches('Leo XIII\nEncyclical', 'xiiiencyclical')).toBe(false);
	});

	it('needs four characters, the number an interior literal hit needs', () => {
		expect(looselyMatches('Ingravescentibus', 'rav')).toBe(false);
	});

	// The property `matchesQuery` asserts for the literal tiers, owed by the
	// loose one for the same reason: a row admitted by a guess has to be able
	// to show the guess, or it reads as a result arriving for no reason.
	it('agrees with highlight: a loose match always leaves something to mark', () => {
		for (const query of ['rermnvrum', 'rerum novarm', 'condtion', 'novarum']) {
			expect(looselyMatches(row, query), query).toBe(true);
			expect(
				highlight(row, query, { loose: true }).some((segment) => segment.hit),
				query
			).toBe(true);
		}
	});
});

describe('filterByQuery', () => {
	const rows = [
		'Rerum Novarum\nLeo XIII\nOn the condition of labor.',
		'Laborem Exercens\nJohn Paul II\nOn human work.',
		'Humanae Vitae\nPaul VI\nOn the regulation of birth.',
		'Quadragesimo Anno\nPius XI\nOn the reconstruction of the social order, and on labour.'
	];
	const kept = (query: string) => filterByQuery(rows, (row) => row, query);

	it('keeps every row for a query the reader has not typed yet', () => {
		expect(kept('')).toHaveLength(rows.length);
		expect(kept('   ')).toHaveLength(rows.length);
	});

	it('answers literally wherever a literal reading answers at all', () => {
		expect(kept('labor')).toEqual([rows[0], rows[1]]);
	});

	/**
	 * THE RULE THE WHOLE LOOSE TIER RESTS ON. `labour` reads two rows
	 * literally, so the third — one edit away through "labor" — stays off the
	 * list: a guess is worth everything to a reader looking at an empty page
	 * and nothing to one already looking at rows. Mixing the bands instead
	 * widened the 400 commonest words of the Magisterium corpus by 35%.
	 */
	it('does not mix a guess into a list that already has rows in it', () => {
		expect(kept('labour')).toEqual([rows[3]]);
		// And the row it withheld is one the loose tier really does reach, so
		// the assertion above is about the band and not about the matcher.
		expect(looselyMatches(rows[0], 'labour')).toBe(true);
	});

	it('falls back for a query no row reads literally', () => {
		expect(kept('humane vite')).toEqual([rows[2]]);
	});

	it('falls back to a loose reading only when the literal one keeps nothing', () => {
		expect(kept('rermnvrum')).toEqual([rows[0]]);
		expect(kept('jonh paul')).toEqual([rows[1]]);
	});

	it('keeps nothing when a query means nothing', () => {
		expect(kept('purgatory')).toEqual([]);
	});

	/** `/quaestiones` matches a bare substring anywhere, which is a decision
	 *  about its own vocabulary, so the LITERAL tier is the caller's to bring.
	 *  The loose one is not — that is what having a second implementation of
	 *  "near enough" would mean. */
	it('takes the caller’s literal tier and keeps its own loose one', () => {
		const one = ['Ingravescentibus'];
		const anywhere = (text: string, query: string) =>
			text.toLowerCase().includes(query.toLowerCase());
		expect(filterByQuery(one, (row) => row, 'rav')).toEqual([]);
		expect(filterByQuery(one, (row) => row, 'rav', anywhere)).toEqual(one);
		// The band rule over an injected tier is pinned where it is used —
		// `topic-search.test.ts`, "withholds the guess from a query that read
		// something literally", which now runs through this function.
	});
});
