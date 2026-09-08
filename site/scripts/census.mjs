/**
 * The census: every number this site states about itself, derived in one pass
 * from the objects the sync has already built.
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
 * NOTHING HERE IS A LABEL. Every row is a key and a number, and the words
 * belong to `src/lib/i18n/en.ts`; every ranked entry is an id and a number,
 * and the name belongs to the edition the reader has open. A book is `matt`
 * here and `Matthew`, `Mateus` or `Matthaeus` on the page, out of their own
 * Bible — which is the rule `citation-style.ts` states for a composed
 * citation, for the same reason: the row links into that edition.
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

/** Bumped when the shape changes; `src/lib/census.ts` declares the reader's copy. */
export const CENSUS_VERSION = 1;

/**
 * How many entries a ranking publishes — a ceiling, never a quota.
 *
 * TWENTY IS A SCREEN. A ranking is read down, and a table longer than the
 * viewport stops being a ranking and becomes a list that happens to be
 * sorted; the tail of every one of these is a long flat run where the
 * difference between one row and the next is a single citation.
 */
export const RANK_LIMIT = 20;

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
	if (citer.kind === 'annotation') return false;
	return self === undefined || citerWorkKey(citer) !== self;
}

/**
 * `groups` as a lookup, so a consumer can ask for one number by name.
 *
 * THROWS FOR A ROW THAT IS NOT THERE, which is the whole reason it exists.
 * `llms.txt` interpolates two of these into published prose, and a renamed
 * row would otherwise reach a reader as the word `undefined` in a sentence
 * about how many documents this library holds. `llmsTxt`'s own
 * both-directions check, one layer down.
 *
 * @param {ReturnType<typeof buildCensus>} census
 * @param {string} group
 * @param {string} row
 * @returns {number}
 */
export function censusValue(census, group, row) {
	const found = census.groups.find((g) => g.key === group)?.rows.find((r) => r.key === row);
	if (!found) {
		throw new Error(
			`census: no row \`${group}.${row}\`. A consumer asked for a number this build does not ` +
				`derive — either the row was renamed in scripts/census.mjs and its readers were not, ` +
				`or the ask is a typo. Publishing \`undefined\` is the failure this throw replaces.`
		);
	}
	return found.value;
}

/**
 * Every number, in the order the page reads them.
 *
 * THE GROUPS ARE THE LIBRARY'S OWN SHELVES, in `shelves.ts`'s order, with the
 * whole collection before them and the apparatus after — because that is an
 * order the reader already knows, and a page of numbers is hard enough to
 * enter without a taxonomy of its own. `library` counts what sits on no shelf
 * (every edition, every language, every address); `apparatus` counts what
 * this project derived rather than reproduced, and is the one group whose
 * subject is the site instead of the texts.
 *
 * A GROUP WITH NO ROWS IS DROPPED, and that is not a tidy-up: the vitest
 * fixtures carry three Bible editions, two Catechisms and no Code at all, and
 * a "Canon Law — 0" row would be this page asserting the Church has no code
 * of law when what is missing is a sync. `visibleShelves()` gates the
 * catalogue on the same test for the same reason.
 *
 * @param {object} input
 * @param {Record<string, any>} input.manifests every work manifest, by id
 * @param {import('../src/lib/route-manifest.ts').RouteManifest} input.routeManifest
 * @param {{works: {languages?: string[]}[]}} input.works
 * @param {{descriptions: Record<string, string>}} input.apparatus
 * @param {number} input.addressCount canonical URLs, as the sitemap counts them
 * @param {number} input.uiLangCount interface languages
 * @param {Record<string, Record<string, Record<string, import('../src/lib/types.ts').Citer[]>>>} input.scriptureByBook
 * @param {{documents: any[], ccc: any[], summa: any[]}} input.citationXrefs
 * @param {Map<string, Map<number, Set<number>>>} input.summaArticles part -> question -> articles
 */
export function buildCensus({
	manifests,
	routeManifest,
	works,
	apparatus,
	addressCount,
	uiLangCount,
	scriptureByBook,
	citationXrefs,
	summaArticles
}) {
	const editionsOfType = (/** @type {string} */ type) =>
		Object.values(manifests).filter((m) => m.type === type).length;

	const languages = [...new Set(works.works.flatMap((w) => w.languages ?? []))].sort();

	// Chapter 0 is a book introduction and not a chapter of the book
	// (docs/corpus-schema.md §Book introductions), so it is counted as what it
	// is on a row of its own rather than inflating the chapter total.
	const bibleChapters = Object.values(routeManifest.bible);
	const chapters = bibleChapters.reduce((n, list) => n + list.filter((c) => c !== 0).length, 0);
	const introductions = bibleChapters.filter((list) => list.includes(0)).length;

	const summaQuestions = Object.values(routeManifest.summa).reduce((n, qs) => n + qs.length, 0);
	let summaArticleCount = 0;
	for (const byQuestion of summaArticles.values()) {
		for (const articles of byQuestion.values()) summaArticleCount += articles.size;
	}

	// --- The tallies, each index walked exactly once ------------------------
	/** @type {Map<string, Set<string>>} */ const byBook = new Map();
	/** @type {Map<string, Set<string>>} */ const byChapter = new Map();
	/** @type {Map<string, number>} */ const byCiterKind = new Map();
	let scriptureRefs = 0;
	let citedVerses = 0;
	for (const [osis, book] of Object.entries(scriptureByBook)) {
		for (const [chapter, verses] of Object.entries(book)) {
			for (const citers of Object.values(verses)) {
				citedVerses++;
				for (const citer of citers) {
					scriptureRefs++;
					byCiterKind.set(citer.kind, (byCiterKind.get(citer.kind) ?? 0) + 1);
					if (!countsTowardsRank(citer)) continue;
					tallyCiter(byBook, osis, citer);
					tallyCiter(byChapter, `${osis} ${chapter}`, citer);
				}
			}
		}
	}

	/** One reverse index, tallied onto whatever key its rows are addressed by. */
	const tallyXrefs = (
		/** @type {any[]} */ rows,
		/** @type {(row: any) => [string, string]} */ at
	) => {
		/** @type {Map<string, Set<string>>} */ const tally = new Map();
		let total = 0;
		for (const row of rows) {
			const [id, self] = at(row);
			for (const citer of row.cited_by) {
				total++;
				byCiterKind.set(citer.kind, (byCiterKind.get(citer.kind) ?? 0) + 1);
				if (countsTowardsRank(citer, self)) tallyCiter(tally, id, citer);
			}
		}
		return { tally, total };
	};

	const documents = tallyXrefs(citationXrefs.documents, (r) => [r.work, `document ${r.work}`]);
	const ccc = tallyXrefs(citationXrefs.ccc, (r) => [String(r.ccc), 'ccc']);
	const summa = tallyXrefs(citationXrefs.summa, (r) => [`${r.part} ${r.question}`, 'summa']);

	const references = scriptureRefs + documents.total + ccc.total + summa.total;

	// --- The ledger ---------------------------------------------------------
	/** @type {{ key: string, rows: { key: string, value: number }[] }[]} */
	const groups = [];
	/** A row is written only where the thing it counts is in this build. */
	const group = (/** @type {string} */ key, /** @type {[string, number][]} */ rows) => {
		const kept = rows.filter(([, value]) => value > 0).map(([k, value]) => ({ key: k, value }));
		if (kept.length) groups.push({ key, rows: kept });
	};

	group('library', [
		['editions', Object.keys(manifests).length],
		['contentLanguages', languages.length],
		['interfaceLanguages', uiLangCount],
		['addresses', addressCount],
		['contentFiles', routeManifest.contentAssetCount]
	]);
	group('bible', [
		['bibleEditions', editionsOfType('bible')],
		['books', Object.keys(routeManifest.bible).length],
		['chapters', chapters],
		['introductions', introductions],
		['annotatedEditions', editionsOfType('commentary')]
	]);
	group('catechism', [
		['cccEditions', editionsOfType('catechism')],
		['cccParagraphs', routeManifest.ccc.length],
		['cccDivisions', routeManifest.cccChapters.length],
		['compendiumEditions', editionsOfType('compendium')],
		['compendiumQuestions', routeManifest.compendium.length],
		['compendiumDivisions', routeManifest.compendiumChapters.length]
	]);
	group('socialDoctrine', [
		['socialDoctrineEditions', editionsOfType('social-doctrine')],
		['socialDoctrineParagraphs', routeManifest.socialDoctrine.length],
		['socialDoctrineChapters', routeManifest.socialDoctrineChapters.length]
	]);
	group('prayer', [
		['prayerEditions', editionsOfType('prayer')],
		['prayers', routeManifest.prayers.length]
	]);
	group('canonLaw', [
		['canonLawEditions', editionsOfType('canon-law')],
		['canons', routeManifest.canonLaw.length],
		['canonLawTitles', routeManifest.canonLawTitles.length]
	]);
	group('magisterium', [
		['documents', routeManifest.documents.length],
		['documentEditions', editionsOfType('document')],
		['documentDescriptions', Object.keys(apparatus.descriptions).length]
	]);
	group('summa', [
		['summaEditions', editionsOfType('summa')],
		['summaParts', Object.keys(routeManifest.summa).length],
		['summaQuestions', summaQuestions],
		['summaArticles', summaArticleCount]
	]);
	group('apparatus', [
		['references', references],
		['referencesFromNotes', byCiterKind.get('annotation') ?? 0],
		['citedVerses', citedVerses],
		['citedDocumentSections', citationXrefs.documents.length],
		['citedCccParagraphs', citationXrefs.ccc.length],
		['citedSummaArticles', citationXrefs.summa.length]
	]);

	const headOf = (/** @type {string} */ id) => id.slice(0, id.lastIndexOf(' '));
	const numberIn = (/** @type {string} */ id) => Number(id.slice(id.lastIndexOf(' ') + 1));

	return {
		version: CENSUS_VERSION,
		groups,
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
		 * Every citer kind and how many references it accounts for, largest
		 * first — the rankings' other direction, and what makes
		 * `referencesFromNotes` legible rather than surprising.
		 */
		citers: [...byCiterKind]
			.map(([kind, value]) => ({ kind, value }))
			.sort((a, b) => b.value - a.value || a.kind.localeCompare(b.kind)),
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
			documents: topOf(documents.tally, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				slug: id,
				value
			})),
			ccc: topOf(ccc.tally, (a, b) => Number(a) - Number(b)).map(({ id, value }) => ({
				n: Number(id),
				value
			})),
			summa: topOf(summa.tally, (a, b) => a.localeCompare(b)).map(({ id, value }) => ({
				part: headOf(id),
				question: numberIn(id),
				value
			}))
		}
	};
}
