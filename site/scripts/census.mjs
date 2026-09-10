/**
 * The census: what this library reaches, derived in one pass from the objects
 * the sync has already built.
 *
 * WHY IT IS A MODULE AND NOT A PAGE'S OWN ARITHMETIC. `llms.mjs` derived nine
 * facts here — the Catechism's last paragraph, the document count, the
 * language list — off `routeManifest`, `works` and `apparatus` separately,
 * and it derived them well; what it could not do is answer a second consumer.
 * A page that counted the same things from `corpus.ts` would be a second
 * derivation over a corpus the first one had already read, and the first of
 * the two to fall behind would fall behind silently, because a count is right
 * until somebody knows better. So `llmsFacts` reads this object now, and
 * `/bibliotheca/census` renders it: one derivation, two publications, and no
 * arrangement in which the file for machines and the page for readers can
 * disagree about how many documents there are.
 *
 * EVERY NUMBER IS A FRACTION, OR IT IS ONE OF FOUR. That is the whole of what
 * changed in version 2, and it is the page's own argument: an inventory count
 * says how big, and a fraction says how far. `Canons 1,752` is unanchored —
 * a reader cannot tell whether it is good — where `the Code in 7 of 40
 * languages` is the same shape of fact and is immediately a judgement. So the
 * 37-row ledger became `coverage`, one number per (work, language), and the
 * four scale figures that survive are a single sentence rather than a table.
 *
 * NOTHING HERE IS A LABEL. A shelf's facts are numbers under names the
 * dictionary spells; every ranked entry is an address, and its name belongs
 * to the edition the reader has open. A book is `matt` here and `Matthew`,
 * `Mateus` or `Matthaeus` on the page, out of their own Bible — the rule
 * `citation-style.ts` states for a composed citation, for the same reason:
 * the row links into that edition.
 *
 * WHAT MAY GO IN IS `scripts/apparatus.mjs`'s rule with one addition. A count
 * is nobody's property: how many editions of the Catechism this library holds
 * is a fact about the library and not about the Catechism, and no publisher's
 * text is reproduced by stating it. The addition is that a number must be
 * DERIVED — a number somebody typed is a number that rots, which is the
 * repo's own documentation rule and binds hardest on a page whose entire
 * subject is numbers.
 */

import { citerKey, citerWorkKey } from './build-xrefs.mjs';
import { MIN_CITING_PLACES, clusterAuthors } from './patristic.mjs';

/**
 * Bumped when the shape changes; `src/lib/census.ts` declares the reader's
 * copy. 3 dropped `fromNotes` and narrowed `citers` to the references a
 * ranking counts, which is a change of MEANING rather than of field — the
 * kind a version number exists for, since nothing about the old shape reads
 * as wrong. 4 deepened every ranking from twenty rows to a hundred and added
 * `absent`, which the page pages through and prints beside them. 5 split that
 * list in two: `absentAuthors` is the works the library is cited FOR and
 * `absent` the editions they are printed IN, which is the difference between a
 * list somebody can act on and a list of other people's shelves.
 */
export const CENSUS_VERSION = 5;

/**
 * How many entries a ranking publishes — a ceiling, never a quota.
 *
 * TWENTY IS A SCREEN, AND A SCREEN IS NOW THE PAGE RATHER THAN THE FILE. The
 * argument for cutting at twenty was that a ranking is read down and a table
 * longer than the viewport stops being one; that is an argument about what
 * meets the eye at once, and `RANK_PAGE` is where it belongs. The file's job
 * is to hold enough that turning a page has somewhere to go.
 *
 * A HUNDRED IS WHERE THE TAIL GOES FLAT. Below it the difference between one
 * row and the next is a single citation, and a ranking whose bands are one
 * deep is a list that happens to be sorted. Measured, it takes `census.json`
 * from 5.8 KB to 18.6 KB, in a file one page fetches on demand.
 */
export const RANK_LIMIT = 100;

/**
 * The eight works the coverage matrix has a row for, each with the address
 * space it offers and how to count what one language reaches of it.
 *
 * A ROW PER WORK AND NOT PER SHELF, which is the one place this table departs
 * from `shelves.ts`. The Catechism's shelf holds two works whose language
 * sets differ by five, and a single row over their union would report a
 * coverage neither of them has. Everywhere else a shelf is one work and the
 * two orders agree.
 *
 * THE DENOMINATOR IS THE UNION ACROSS EVERY EDITION, so a cell reads "how
 * much of what this library offers can I reach in my own language". It is the
 * same denominator down a column, which is what makes the eight rows
 * comparable — the property the whole matrix exists for, and the one a
 * per-row scale would destroy.
 */
/** @type {{ key: string, of: (rm: import('../src/lib/route-manifest.ts').RouteManifest) => number }[]} */
const COVERAGE_ROWS = [
	{ key: 'bible', of: (rm) => countChapters(rm.bible) },
	{ key: 'catechism', of: (rm) => rm.ccc.length },
	{ key: 'compendium', of: (rm) => rm.compendium.length },
	{ key: 'socialDoctrine', of: (rm) => rm.socialDoctrine.length },
	{ key: 'prayer', of: (rm) => rm.prayers.length },
	{ key: 'canonLaw', of: (rm) => rm.canonLaw.length },
	{ key: 'magisterium', of: (rm) => rm.documents.length },
	{ key: 'doctores', of: (rm) => countQuestions(rm.summa) }
];

/** Chapters across every book, never counting 0 — that is a book introduction
 *  and not a chapter of the book (docs/corpus-schema.md). */
function countChapters(/** @type {Record<string, number[]>} */ bible) {
	return Object.values(bible).reduce((n, list) => n + list.filter((c) => c !== 0).length, 0);
}

function countQuestions(/** @type {Record<string, number[]>} */ summa) {
	return Object.values(summa).reduce((n, qs) => n + qs.length, 0);
}

/** A work's bare content language — `en-GB` and `en` are one column. */
function baseLanguage(/** @type {string | undefined} */ tag) {
	return String(tag ?? '').split('-')[0];
}

/**
 * The top of a tally, cut on the COUNT and never on the rank.
 *
 * A ranking must not split a tie. Thirteen Catechism paragraphs are cited
 * exactly three times, so a plain `slice(0, 20)` would publish four of them
 * and drop nine cited exactly as often — a claim about those four that
 * nothing in the corpus supports, and the kind of arbitrary line a reader
 * cannot see is arbitrary. So the cut is the smallest count whose whole band
 * still fits: every entry at or above it is published, and the table comes
 * out shorter than the limit rather than dishonest at the bottom.
 *
 * Order within a band is by the id — arbitrary, but stable, which is what
 * lets a rebuild over an unchanged corpus produce the same file.
 *
 * @template T
 * @param {Map<T, Set<string>>} tally cited entry -> the citers of it
 * @param {(a: T, b: T) => number} compare tie-break, applied within one band
 * @param {number} [limit]
 * @returns {{ id: T, value: number }[]}
 */
export function topOf(tally, compare, limit = RANK_LIMIT) {
	const rows = [...tally]
		.map(([id, citers]) => ({ id, value: citers.size }))
		.sort((a, b) => b.value - a.value || compare(a.id, b.id));

	// Take whole bands while the next one still fits.
	let kept = 0;
	for (let i = 0; i < rows.length;) {
		let j = i;
		while (j < rows.length && rows[j].value === rows[i].value) j++;
		if (j > limit) break;
		kept = j;
		i = j;
	}
	return rows.slice(0, kept);
}

/**
 * Add one citer to one cited entry's tally, deduplicated.
 *
 * DEDUPLICATION IS THE MEASUREMENT THIS FILE IS ABOUT. The stored index is
 * one row per (citing address, cited address) pair, so a work citing
 * `Matt 25:31-46` lands on sixteen verses where one citing `Matt 25` lands on
 * one. Counted as stored, the most-cited chapter in the corpus is Matthew 25
 * — which is a fact about how long the passages quoted from it are, not about
 * how often it is cited. Counted as distinct citing places, Matthew 25 is
 * sixteenth and Matthew 5, Romans 8 and John 1 lead, which is the answer to
 * the question the reader is asking. `citerKey` is the identity, unchanged
 * from the one the index was built with.
 *
 * @template T
 * @param {Map<T, Set<string>>} tally
 * @param {T} id
 * @param {import('../src/lib/types.ts').Citer} citer
 */
function tallyCiter(tally, id, citer) {
	let citers = tally.get(id);
	if (!citers) tally.set(id, (citers = new Set()));
	citers.add(citerKey(citer));
}

/**
 * Whether this citer counts towards a ranking of what the library cites.
 *
 * TWO EXCLUSIONS, ONE ARGUMENT: a work's account of itself is not evidence of
 * how the library reads it.
 *
 * An `annotation` is an edition's own footnotes, and there are more of them
 * than of everything else together — so a ranking that counted them would
 * mostly report which verses Haydock glossed. `site/docs/references.md`
 * records the same measurement for the "Cited in" panel, where commentary is
 * the one family that starts switched off; here it is left out rather than
 * offered behind a control, because a ranking has no per-row filter to fall
 * back on and a number that changes when a toggle moves is not a rank.
 *
 * `self` is the same rule one work in. Lumen Gentium §8 citing §22 is the
 * document's internal cross-reference, and counting it puts every long
 * document at the top of a table about how often the REST of the corpus cites
 * it. The Summa is where this decides the outcome — all but a fifteenth of
 * its citers are the Summa — and dropping them turns a ranking of Thomas's
 * own back-references into a ranking of the questions the magisterium reaches
 * for. Scripture passes `undefined` and needs no such rule: no work here is
 * the Bible citing itself once the annotated editions have gone.
 *
 * @param {import('../src/lib/types.ts').Citer} citer
 * @param {string} [self] `citerWorkKey`'s spelling of the cited work
 * @returns {boolean}
 */
export function countsTowardsRank(citer, self) {
	if (!kindCountsTowardsRank(citer.kind)) return false;
	return self === undefined || citerWorkKey(citer) !== self;
}

/**
 * The first of those two rules, asked of a KIND with no citer to hand.
 *
 * The absence pass counts citations by kind rather than keeping a citer per
 * one — 41,696 of them name nothing, and a list of citers for each would be a
 * megabyte to answer a question that is two integers. So it needs the
 * annotation rule without the self-reference rule, which cannot apply: a work
 * outside this corpus is not one inside it citing itself.
 *
 * IT IS THE PREDICATE AND `countsTowardsRank` DELEGATES, rather than the two
 * testing the same string apart. An edition's own footnotes name Migne and
 * Denzinger constantly; a second copy of that test is how the family comes
 * back into one of the two tables through an edit that forgets why it went.
 *
 * @param {string} kind
 * @returns {boolean}
 */
export function kindCountsTowardsRank(kind) {
	return kind !== 'annotation';
}

/**
 * One shelf's fact, by name.
 *
 * THROWS FOR A FACT THAT IS NOT THERE, which is the whole reason it exists.
 * `llms.txt` interpolates two of these into published prose, and a renamed
 * fact would otherwise reach a reader as the word `undefined` in a sentence
 * about how many documents this library holds. `llmsTxt`'s own
 * both-directions check, one layer down.
 *
 * @param {ReturnType<typeof buildCensus>} census
 * @param {string} shelf
 * @param {string} fact
 * @returns {number}
 */
export function censusFact(census, shelf, fact) {
	const found = census.shelves.find((s) => s.key === shelf)?.facts[fact];
	if (found === undefined) {
		throw new Error(
			`census: no fact \`${shelf}.${fact}\`. A consumer asked for a number this build does not ` +
				`derive — either it was renamed in scripts/census.mjs and its readers were not, or the ` +
				`ask is a typo. Publishing \`undefined\` is the failure this throw replaces.`
		);
	}
	return found;
}

/**
 * Every number, in the order the page reads them.
 *
 * @param {object} input
 * @param {Record<string, any>} input.manifests every work manifest, by id
 * @param {import('../src/lib/route-manifest.ts').RouteManifest} input.routeManifest
 * @param {{works: {languages?: string[]}[]}} input.works
 * @param {{descriptions: Record<string, string>}} input.apparatus
 * @param {number} input.addressCount canonical URLs, as the sitemap counts them
 * @param {readonly string[]} input.uiLangs the interface languages, in their own order
 * @param {Record<string, {books: {osis: string, chapters: {n: number}[]}[]}>} input.bibleIndex workId -> books
 * @param {{lang: string, paragraphs: {n: number}[]}[]} input.cccEditions
 * @param {{lang: string, questions: {n: number}[]}[]} input.compendiumEditions
 * @param {{lang: string, sections: {n: number}[]}[]} input.socialDoctrineEditions
 * @param {{lang: string, sections: {n: number}[]}[]} input.canonLawEditions
 * @param {Record<string, {prayers: unknown[]}>} input.prayerIndex lang -> prayers
 * @param {{slug: string, lang: string}[]} input.documentEditions
 * @param {Record<string, {questions: unknown[]}>} input.summaIndex lang -> questions
 * @param {Record<string, Record<string, Record<string, import('../src/lib/types.ts').Citer[]>>>} input.scriptureByBook
 * @param {{documents: any[], ccc: any[], summa: any[], absent: {work: string, cited_by: import('../src/lib/types.ts').Citer[]}[], unread: {ibidem: Record<string, number>, other: Record<string, number>}, authors?: {name: string, lang: string, locators: string[], slots: string[], citer: string, counts: boolean}[]}} input.citationXrefs
 * @param {Map<string, Map<number, Set<number>>>} input.summaArticles part -> question -> articles
 */
export function buildCensus(input) {
	const {
		manifests,
		routeManifest,
		works,
		apparatus,
		addressCount,
		uiLangs,
		bibleIndex,
		cccEditions,
		compendiumEditions,
		socialDoctrineEditions,
		canonLawEditions,
		prayerIndex,
		documentEditions,
		summaIndex,
		scriptureByBook,
		citationXrefs,
		summaArticles
	} = input;

	const editionsOfType = (/** @type {string} */ type) =>
		Object.values(manifests).filter((m) => m.type === type).length;
	const languages = [...new Set(works.works.flatMap((w) => w.languages ?? []))].sort();

	// --- Coverage: one number per (work, language) --------------------------
	/** @type {Record<string, Map<string, Set<unknown>>>} */
	const reach = {};
	const into = (
		/** @type {string} */ row,
		/** @type {string} */ lang,
		/** @type {unknown[]} */ ids
	) => {
		const l = baseLanguage(lang);
		if (!l) return;
		const byLang = (reach[row] ??= new Map());
		let set = byLang.get(l);
		if (!set) byLang.set(l, (set = new Set()));
		for (const id of ids) set.add(id);
	};

	for (const [workId, work] of Object.entries(bibleIndex)) {
		const lang = manifests[workId]?.language;
		for (const book of work.books) {
			// The union PER LANGUAGE, not per edition: two editions of one
			// language between them offer what either offers, which is what a
			// reader of that language can actually reach.
			into(
				'bible',
				lang,
				book.chapters.filter((c) => c.n !== 0).map((c) => `${book.osis} ${c.n}`)
			);
		}
	}
	for (const { lang, paragraphs } of cccEditions)
		into(
			'catechism',
			lang,
			paragraphs.map((p) => p.n)
		);
	for (const { lang, questions } of compendiumEditions)
		into(
			'compendium',
			lang,
			questions.map((q) => q.n)
		);
	for (const { lang, sections } of socialDoctrineEditions)
		into(
			'socialDoctrine',
			lang,
			sections.map((s) => s.n)
		);
	for (const { lang, sections } of canonLawEditions)
		into(
			'canonLaw',
			lang,
			sections.map((s) => s.n)
		);
	for (const [lang, entry] of Object.entries(prayerIndex))
		into(
			'prayer',
			lang,
			entry.prayers.map((/** @type {any} */ p) => p.slug)
		);
	for (const { slug, lang } of documentEditions) into('magisterium', lang, [slug]);
	for (const [lang, entry] of Object.entries(summaIndex))
		into(
			'doctores',
			lang,
			entry.questions.map((/** @type {any} */ q) => `${q.part} ${q.n}`)
		);

	const coverageRows = COVERAGE_ROWS.map(({ key, of }) => ({
		key,
		of: of(routeManifest),
		byLang: reach[key] ?? new Map()
	}));

	/**
	 * The language order, DERIVED and shared by every row.
	 *
	 * By how much of the whole library the language carries — the sum of its
	 * eight fractions — so the matrix comes out as a staircase and the eye
	 * reads the shape before it reads a cell. Derived rather than chosen
	 * because any hand-made order is an editorial claim about which languages
	 * matter, which is exactly what a page of measurements must not make.
	 * Ties break on the tag, so a rebuild produces the same file.
	 *
	 * ALL FORTY STAY IN, including the seven that carry nothing. The empty
	 * tail is the finding — it is `PLAN.md` gap 15 drawn rather than argued —
	 * and a matrix that listed only the languages with something in them would
	 * be this page flattering the library.
	 */
	const score = (/** @type {string} */ lang) =>
		coverageRows.reduce((sum, r) => sum + (r.of ? (r.byLang.get(lang)?.size ?? 0) / r.of : 0), 0);
	const ordered = [...uiLangs].sort((a, b) => score(b) - score(a) || a.localeCompare(b));

	const coverage = {
		languages: ordered,
		rows: coverageRows
			.filter((r) => r.of > 0)
			.map((r) => ({
				key: r.key,
				of: r.of,
				values: ordered.map((lang) => r.byLang.get(lang)?.size ?? 0)
			}))
	};

	// --- The apparatus, walked once ----------------------------------------
	/** @type {Map<string, Set<string>>} */ const byBook = new Map();
	/** @type {Map<string, Set<string>>} */ const byChapter = new Map();
	/** @type {Map<string, number>} */ const byCiterKind = new Map();
	/**
	 * The same tally over the references a RANKING COUNTS, which is the one
	 * the page publishes.
	 *
	 * Two tallies and not one, because the breakdown sits under the rankings
	 * and has to describe them. Counting every reference put `annotation` at
	 * the head of it — 41,842 against everything else's 61,152 — for a family
	 * no table above it counts, and a row can only be read as bearing on what
	 * it is printed under. `byCiterKind` stays because the total is what
	 * `references` is, and a breakdown that names four fifths of a stated
	 * total without saying so is the arithmetic this file already answered
	 * for once.
	 */
	/** @type {Map<string, number>} */ const byCountedKind = new Map();
	/** Every reference a ranking counts — what `byCountedKind` sums to, and
	 *  the number that makes the difference between the two legible. */
	let counted = 0;
	/** Every distinct place in the corpus that cites anything, and every
	 *  distinct address cited — the two ENDPOINTS of the cross-references,
	 *  which is why neither is a part of their total. */
	const citingPlaces = new Set();
	const citedAddresses = new Set();
	let references = 0;

	for (const [osis, book] of Object.entries(scriptureByBook)) {
		for (const [chapter, verses] of Object.entries(book)) {
			for (const [verse, citers] of Object.entries(verses)) {
				citedAddresses.add(`bible ${osis} ${chapter} ${verse}`);
				for (const citer of citers) {
					references++;
					citingPlaces.add(citerKey(citer));
					byCiterKind.set(citer.kind, (byCiterKind.get(citer.kind) ?? 0) + 1);
					if (!countsTowardsRank(citer)) continue;
					counted++;
					byCountedKind.set(citer.kind, (byCountedKind.get(citer.kind) ?? 0) + 1);
					tallyCiter(byBook, osis, citer);
					tallyCiter(byChapter, `${osis} ${chapter}`, citer);
				}
			}
		}
	}

	/** One reverse index, tallied onto whatever key its rows are addressed by. */
	const tallyXrefs = (
		/** @type {any[]} */ rows,
		/** @type {(row: any) => [string, string, string]} */ at
	) => {
		/** @type {Map<string, Set<string>>} */ const tally = new Map();
		for (const row of rows) {
			const [id, self, address] = at(row);
			citedAddresses.add(address);
			for (const citer of row.cited_by) {
				references++;
				citingPlaces.add(citerKey(citer));
				byCiterKind.set(citer.kind, (byCiterKind.get(citer.kind) ?? 0) + 1);
				if (!countsTowardsRank(citer, self)) continue;
				counted++;
				byCountedKind.set(citer.kind, (byCountedKind.get(citer.kind) ?? 0) + 1);
				tallyCiter(tally, id, citer);
			}
		}
		return tally;
	};

	const documents = tallyXrefs(citationXrefs.documents, (r) => [
		r.work,
		`document ${r.work}`,
		`document ${r.work} ${r.n}`
	]);
	const ccc = tallyXrefs(citationXrefs.ccc, (r) => [String(r.ccc), 'ccc', `ccc ${r.ccc}`]);
	const summa = tallyXrefs(citationXrefs.summa, (r) => [
		`${r.part} ${r.question}`,
		'summa',
		`summa ${r.part} ${r.question} ${r.article}`
	]);

	/**
	 * What the apparatus asks for and this library has not got.
	 *
	 * TALLIED APART FROM THE FOUR ABOVE, and the reason is `tallyXrefs`'s
	 * three other jobs. Those rows are cross-references: each has a cited
	 * ADDRESS, is counted into `references`, and lands in the breakdown under
	 * the ranking. An absence has no address by definition — there is nothing
	 * here for a reader to stand on — so counting it as a reference would put
	 * `references` above the number of edges the corpus actually has and
	 * `citedAddresses` above the number of places that exist. The one rule it
	 * does share is `countsTowardsRank`: an edition's own footnotes name
	 * Migne constantly, and a table of what to ingest next that reported
	 * chiefly what Haydock cited is the defect the annotation rule already
	 * answered for once.
	 *
	 * `self` is `undefined` because there is no work to be citing itself: a
	 * citation to something outside the corpus cannot be internal to it.
	 */
	/** @type {Map<string, Set<string>>} */ const absent = new Map();
	for (const row of citationXrefs.absent) {
		for (const citer of row.cited_by) {
			if (!countsTowardsRank(citer)) continue;
			tallyCiter(absent, row.work, citer);
		}
	}

	/**
	 * The citations that named nothing at all, under the same rule.
	 *
	 * TWO NUMBERS AND NOT A TABLE — see `buildCitationXrefs`, which explains
	 * why the strings themselves may not be ranked. Split because the two
	 * halves are findings about different things: `ibidem` is a citation this
	 * parser could not carry an antecedent into, which is a limit of the
	 * READING, and `other` is a footnote naming something the grammar has no
	 * table for, which is nearer a limit of the CORPUS. Reported as one
	 * number they would read as one defect.
	 */
	const unreadOf = (/** @type {Record<string, number>} */ byKind) =>
		Object.entries(byKind).reduce(
			(n, [kind, count]) => n + (kindCountsTowardsRank(kind) ? count : 0),
			0
		);
	const unread = {
		ibidem: unreadOf(citationXrefs.unread.ibidem),
		other: unreadOf(citationXrefs.unread.other)
	};

	/**
	 * The Fathers the apparatus cites and this library does not hold.
	 *
	 * THE ANSWER `absent` LOOKS LIKE GIVING AND DOES NOT. That list ranks
	 * `Patrologia latina`, which is a shelf in somebody else's library and not
	 * a work anybody ingests; the text the reader is being sent to is named in
	 * the same clause, and this is that name. `scripts/patristic.mjs` carries
	 * the reading and the three rules it costs.
	 *
	 * CLUSTERED HERE AND NOT IN THE BUILDER, because a spelling only resolves
	 * against the other spellings of the same man and that is a fact about the
	 * whole corpus rather than about the citation the builder was looking at.
	 * `countsTowardsRank` filters the SIGHTINGS rather than the clusters, so a
	 * name known only from an edition's own footnotes leaves no row behind.
	 */
	const absentAuthors = clusterAuthors(
		(citationXrefs.authors ?? []).map((sighting) => ({
			...sighting,
			// An edition's own footnotes name the Fathers constantly, so a
			// sighting out of one is a VOTE on how a name is spelled and never
			// a row's number — the annotation rule the rankings already keep,
			// applied to the half of a sighting that is counted.
			counts: sighting.counts && kindCountsTowardsRank(sighting.citer.split(' ')[0] ?? '')
		}))
	);

	let summaArticleCount = 0;
	for (const byQuestion of summaArticles.values()) {
		for (const articles of byQuestion.values()) summaArticleCount += articles.size;
	}

	// --- The shelves, each a bag of numbers for one sentence -----------------
	/** @type {{ key: string, facts: Record<string, number> }[]} */
	const shelves = [];
	/**
	 * A shelf is written only where the thing it counts is in this build.
	 *
	 * The vitest fixtures carry three Bible editions, two Catechisms and no
	 * Code at all, and a sentence reading "the Code of Canon Law in 0
	 * languages" is this page asserting the Church has no law when what is
	 * missing is a sync. `visibleShelves()` gates the catalogue on the same
	 * test for the same reason. `gate` is the fact that must be non-zero for
	 * the sentence to be true of anything.
	 */
	const shelf = (
		/** @type {string} */ key,
		/** @type {number} */ gate,
		/** @type {Record<string, number>} */ facts
	) => {
		if (gate > 0) shelves.push({ key, facts });
	};

	const langsIn = (/** @type {string} */ row) => reach[row]?.size ?? 0;

	shelf('library', Object.keys(manifests).length, {
		interfaceLanguages: uiLangs.length,
		works: works.works.length,
		editions: Object.keys(manifests).length,
		contentLanguages: languages.length,
		addresses: addressCount
	});
	shelf('bible', editionsOfType('bible'), {
		books: Object.keys(routeManifest.bible).length,
		languages: langsIn('bible'),
		editions: editionsOfType('bible'),
		annotated: editionsOfType('commentary')
	});
	shelf('catechism', editionsOfType('catechism'), {
		languages: langsIn('catechism'),
		paragraphs: routeManifest.ccc.length,
		compendiumLanguages: langsIn('compendium'),
		questions: routeManifest.compendium.length
	});
	shelf('socialDoctrine', editionsOfType('social-doctrine'), {
		languages: langsIn('socialDoctrine'),
		paragraphs: routeManifest.socialDoctrine.length
	});
	shelf('prayer', editionsOfType('prayer'), {
		prayers: routeManifest.prayers.length,
		languages: langsIn('prayer')
	});
	shelf('canonLaw', editionsOfType('canon-law'), {
		canons: routeManifest.canonLaw.length,
		languages: langsIn('canonLaw')
	});
	shelf('magisterium', routeManifest.documents.length, {
		documents: routeManifest.documents.length,
		languages: langsIn('magisterium'),
		described: Object.keys(apparatus.descriptions).length
	});
	shelf('doctores', editionsOfType('summa'), {
		questions: countQuestions(routeManifest.summa),
		parts: Object.keys(routeManifest.summa).length,
		articles: summaArticleCount,
		languages: langsIn('doctores')
	});
	/**
	 * THE ONE SENTENCE THAT HAS TO STATE ITS OWN UNITS. A cross-reference is
	 * an EDGE and the two counts beside it are its ENDPOINTS, so they do not
	 * sum to it and were never meant to — 22,170 cited verses plus the three
	 * other indexes' addresses is the cited total, not a quarter of the
	 * references. Set out as a list of counts that was exactly the reading it
	 * invited, and someone did the addition and found it short by four fifths.
	 * The sentence says "from X places to Y addresses", which is self-checking:
	 * the two are visibly the ends of one arrow rather than parts of a sum.
	 */
	shelf('apparatus', references, {
		references,
		citingPlaces: citingPlaces.size,
		citedAddresses: citedAddresses.size
	});

	const headOf = (/** @type {string} */ id) => id.slice(0, id.lastIndexOf(' '));
	const numberIn = (/** @type {string} */ id) => Number(id.slice(id.lastIndexOf(' ') + 1));

	return {
		version: CENSUS_VERSION,
		shelves,
		coverage,
		/**
		 * The three things `llms.txt` needs that are not counts. They are here
		 * rather than derived a second time in `llms.mjs` for this file's whole
		 * reason: the language list and the document total are two halves of one
		 * description of the corpus and must not be read out of two objects.
		 */
		languages,
		summaParts: Object.keys(routeManifest.summa),
		maxima: {
			ccc: Math.max(...routeManifest.ccc),
			compendium: Math.max(...routeManifest.compendium),
			socialDoctrine: Math.max(...routeManifest.socialDoctrine),
			canonLaw: Math.max(...routeManifest.canonLaw)
		},
		/**
		 * Every citer kind and how many of the COUNTED references it accounts
		 * for, largest first — the rankings' other direction, and printed under
		 * them.
		 *
		 * `annotation` cannot appear here, by construction rather than by a
		 * filter: `countsTowardsRank` refuses it, so it is never added. That is
		 * the property worth having — an excluded family cannot come back into
		 * this list through a later edit that forgets why it was dropped.
		 */
		citers: [...byCountedKind]
			.map(([kind, value]) => ({ kind, value }))
			.sort((a, b) => b.value - a.value || a.kind.localeCompare(b.kind)),
		/** What that list sums to, so the page can say so. Without it the
		 *  breakdown is a column of numbers under a stated total it does not
		 *  reach, which is the reading this file exists to have stopped. */
		countedReferences: counted,
		rankings: {
			books: topOf(byBook, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				osis: id,
				value
			})),
			chapters: topOf(byChapter, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				osis: headOf(id),
				chapter: numberIn(id),
				value
			})),
			documents: topOf(documents, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				slug: id,
				value
			})),
			ccc: topOf(ccc, (a, b) => Number(a) - Number(b)).map(({ id, value }) => ({
				n: Number(id),
				value
			})),
			summa: topOf(summa, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				part: headOf(id),
				question: numberIn(id),
				value
			}))
		},
		/**
		 * The works cited here that are held nowhere here, and what the four
		 * rankings above cannot say: they rank what the library HAS.
		 *
		 * Its rows carry a name and no address, which is the whole content of
		 * the section — every other ranking on the page links, and this one
		 * cannot, because the link is the thing that is missing.
		 */
		absent: topOf(absent, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
			work: id,
			value
		})),
		/**
		 * The same question asked of the WORKS rather than of the editions:
		 * whom this library is cited for and has not got, most asked-for first.
		 *
		 * Cut by `topOf` like every other ranking, over a tally of citing
		 * places — so a Father cited once by one footnote is below the band and
		 * the table ends where the evidence thins rather than at a round
		 * number.
		 */
		absentAuthors: topOf(
			new Map(
				absentAuthors
					.filter((a) => a.citers.size >= MIN_CITING_PLACES)
					.map((a) => [a.name, a.citers])
			),
			(a, b) => a.localeCompare(b)
		).map(({ id, value }) => ({ author: id, value })),
		/** What that ranking does NOT account for, so the page can say so —
		 *  the same arithmetic `countedReferences` closes one section up. */
		unread
	};
}
