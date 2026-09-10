/**
 * Which Father the library is cited for, out of the citation that cites him.
 *
 * ## A series siglum is a locator, not a work
 *
 * `/census` ranked what the apparatus asks for and this library has not got,
 * and its head was `Patrologia latina`, `Patrologia graeca`, `Denzinger`. Every
 * one of those is a critical EDITION — 200-odd volumes of somebody else's
 * shelf — so the ranking was answering "which books are these texts printed
 * in" where the reader had asked "which texts". Nobody ingests Migne.
 *
 * What the reader wants is beside the locator and always has been: the
 * apparatus writes `Sanctus Augustinus, Sermo 241, 2: PL 38, 1134`, and the
 * work is the head of that clause. 86% of the corpus's series citations carry
 * one.
 *
 * ## The name fragments, and the locator is the oracle
 *
 * A head is written in the language of the edition printing it, so Augustine
 * arrives as `St. Augustine`, `Santo Agostinho`, `Sant'Agostino`,
 * `Sanctus Augustinus`, `S. Agostinho`, `S. Agustín` and a dozen more — 1,811
 * spellings over some 600 people. Ranked raw, the most-cited Father in the
 * corpus is whichever one has the fewest translations.
 *
 * THE ORACLE IS THE LOCATOR ITSELF. `PL 38, 1134` is a volume and a column in
 * a book nobody here published, so it is the same string in every language,
 * and every edition that cites it is naming the same man. Two spellings found
 * at one locator are one author — which is `book-forms-oracle.mjs`'s method
 * (align parallel editions on the locus, read the name off) with the locus
 * supplied by the citation instead of by the paragraph number.
 *
 * ## Three rules, each of which cost a wrong answer
 *
 * **A HEAD IS READ PER CLAUSE.** A citation chains works with `;`, and read
 * whole its first name attaches to every locator in it: `Concilium Vaticanum
 * II ... ; cf Sanctus Hieronymus ...: PL 24, 17` taught the clusterer that the
 * council and Jerome were one person, and through that hub Justin merged with
 * Jerome and Clement of Rome with Vatican II. `citationClauses` makes the cut,
 * and it is the grammar's own so the two cannot drift.
 *
 * **A HEAD IS ONLY A NAME WHERE IT LOOKS LIKE ONE.** Where the author sat in
 * the previous footnote the clause opens with the work (`De Trinitate`,
 * `Homiliae in Matthaeum`), and an inline citation opens with running prose.
 * Both entered as authors and bridged clusters. `GENRE_HEAD` refuses the first,
 * a word count the second: this is the under-read-don't-guess rule the rest of
 * the grammar is written to, and a Father dropped for want of a name is a row
 * short, where a Father invented is a row wrong.
 *
 * **AN EDGE NEEDS THREE DISTINCT LOCATORS.** One shared locator is a
 * coincidence a misprint can manufacture and the relation is closed
 * transitively, so a single bad edge chains everything: at one, 4,450 of 6,878
 * heads came out as a single Augustine. At three, Tertullian and Origen part,
 * Jerome stands on his own, and the sixteen leading clusters are each one man.
 *
 * ## What it is not
 *
 * Not a ranking of WORKS. `Sermo` is 300 different sermons and `Adversus
 * haereses` is written `Adv. haeres.` as often as not, so a work-level table
 * would be near-duplicate rows and a judgement per row. The author is the
 * grain somebody acquires a corpus at, and it is the grain the locator can
 * check.
 */

/**
 * The series this reads a locator out of — the ones `ABSENT_WORKS` names, minus
 * the two gazettes. `AAS` and `ASS` are volume-and-page in the Holy See's own
 * record, whose head is a pope and a document rather than a Father, and those
 * are already ranked by the document half of the census.
 */
const SERIES = '(?:PL|PG|PLS|CCL|CCSL|CCG|CSEL|SC|SCh|GCS|PTS|MGH|MHSI|BP|SPM|TPL|AHMA|COD|Funk)';

/** `PL 38, 1134` — volume and column, which together name one text. A volume
 *  alone does not: `PL 38` is Augustine's sermons entire. */
const LOCATOR = new RegExp('\\b(' + SERIES + ')\\s*(\\d+)\\s*[,:]\\s*(\\d+)', 'g');
const FIRST_SERIES = new RegExp('\\b' + SERIES + '\\s*\\d');

/**
 * `Cf.`, `Vgl.`, `Por.` and a leading footnote number, which are apparatus and
 * not part of anybody's name.
 *
 * BOTH HALVES ARE OPTIONAL, and that is not tidiness. The number and the word
 * occur apart as often as together — the Latin Catechism prints `5 Sanctus
 * Augustinus, Contra epistulam …` with no `Cf` at all — and requiring the word
 * left the digit on the front of the name, where it folds to a key of its own
 * and splits the author into two rows.
 */
const LEAD = /^\s*(?:\d+\s+)?(?:(?:Cf|Cfr|cf|Vgl|Por|Ср)\.?\s+)?/i;

/**
 * A head opening with one of these is a WORK and the author is in the note
 * before it. Genre words and the prepositions a Latin title opens with, plus
 * the vernacular equivalents the translated apparatus prints.
 */
const GENRE_HEAD = new RegExp(
	'^(?:de|in|ad|contra|adversus|ex|super|pro|per|liber|libri|epistula|epistulae|ep|epist|' +
		'sermo|sermones|serm|homilia|homiliae|hom|tractatus|tract|expositio|enarratio|enarrationes|' +
		'commentarii|commentarium|comm|apologia|apologeticum|dialogus|dialogue|dialogo|dialog|' +
		'regula|regola|regla|rule|regel|moralia|carmina|carmen|poem|poemas|poemi|poematy|acta|' +
		'martyrium|catecheses|catechesis|oratio|orationes|orat|quaestiones|quaest|opusculum|' +
		'confessiones|confessions|enchiridion|didache|pastor|vita|vitae|hymnus|hymni|' +
		'lettera|letter|carta|brief|lettre|list|ed|the|a|an|el|la|le|il|o|os|as|los|las)\\b',
	'i'
);
/** An ibidem word standing where a name would: the antecedent is the previous
 *  note's, which this pass has no chain to follow. */
const IBID_HEAD =
	/^(?:ibidem|ibid|ib|id|ebenda|ebd|derselbe|ders|dies|tam[zż]e|там|idem|eadem|ivi|iv)\b/i;
/** `1 Co 7`, `Mt 5` — a scripture locator, which is not an author. */
const SCRIPTURE_HEAD = /^[1-3IVX]*\s*[A-Za-zÀ-ž]{1,12}\.?\s*\d/;

/** Longest a name runs before it is prose that happens to precede a locator. */
const MAX_NAME_WORDS = 5;

/**
 * The critical-edition locators one clause names — `['PL 38 1134']`.
 *
 * @param {string} clause
 * @returns {string[]}
 */
export function locatorsIn(clause) {
	LOCATOR.lastIndex = 0;
	return [...clause.matchAll(LOCATOR)].map((m) => `${m[1]} ${m[2]} ${m[3]}`);
}

/**
 * The name at the head of a clause, as the edition spells it, or `null` where
 * the clause opens with anything but a name.
 *
 * The head runs to the colon that introduces the locator, which is what the
 * apparatus prints in every language that prints one; where an edition prints
 * none (`Origen, De orat. 29 PG 11, 544CD`) the head runs to the siglum
 * instead. Then the author is what stands before the first comma, the rest
 * being the work and its own locus.
 *
 * @param {string} clause
 * @returns {string | null}
 */
export function authorInClause(clause) {
	const m = FIRST_SERIES.exec(clause);
	if (!m) return null;
	const before = clause.slice(0, m.index);
	const colon = before.lastIndexOf(':');
	const head = (colon === -1 ? before : before.slice(0, colon)).replace(LEAD, '').trim();
	let name = head
		.split(',')[0]
		.replace(/\s*\(.*$/, '')
		.trim();
	name = name.replace(/^[\s([;,.\]»«]+/, '').replace(/[\s([;,.\]»«]+$/, '');
	if (!name || name.split(/\s+/).length > MAX_NAME_WORDS || name.length > 46) return null;
	if (IBID_HEAD.test(name) || GENRE_HEAD.test(name) || SCRIPTURE_HEAD.test(name)) return null;
	if (!/[A-Za-zÀ-ž]{3}/.test(name)) return null;
	return name;
}

/**
 * One spelling reduced to what two languages can agree on: case, diacritics,
 * punctuation and the honorific gone.
 *
 * IT MERGES BEFORE ANY LOCATOR IS CONSULTED, which is most of the work —
 * `Sanctus Augustinus`, `S. AUGUSTINUS` and `Augustinus` are one key already,
 * so the locator evidence is spent on the cross-language links it is the only
 * thing that can make.
 *
 * @param {string} name
 * @returns {string}
 */
export function foldName(name) {
	return name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(
			/\b(?:sanctus|sancti|sanctae|santo|santa|saint|sao|sv|hl|swiety|szent|ss|st|s|h)\.?\s+/g,
			' '
		)
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** How many distinct locators two spellings must share before they are taken
 *  to be one author. See the docblock: at one, everything is Augustine. */
export const MIN_SHARED_LOCATORS = 3;

/**
 * Cluster the observed spellings into authors.
 *
 * EVERY SIGHTING IS EVIDENCE AND ONLY SOME ARE COUNTED, which is the split
 * that makes the table hold together. A spelling is linked to another by the
 * locators they share, so narrowing the input to the citations that rank —
 * those naming a series and reaching nothing else — throws away the very
 * co-occurrences the clustering runs on: it left Cyprian as two rows, one
 * Latin and one Italian, and Chrysostom as three. `counts` says which
 * sightings a row's number is made of; the rest still get a vote.
 *
 * @param {{ name: string, lang: string, locators: string[], citer: string, counts: boolean }[]} seen
 *   one entry per (clause, citing place) that named somebody
 * @param {number} [minShared]
 * @returns {{ name: string, spellings: string[], citers: Set<string> }[]}
 *   most-cited first; `name` is the spelling to print
 */
export function clusterAuthors(seen, minShared = MIN_SHARED_LOCATORS) {
	/** @type {Map<string, Map<string, { count: number, english: boolean }>>} folded -> spelling */
	const spellings = new Map();
	/** @type {Map<string, Set<string>>} folded -> the citing places that COUNT */
	const citers = new Map();
	/** @type {Map<string, Set<string>>} locator -> folded names at it */
	const atLocator = new Map();

	for (const { name, lang, locators, citer, counts } of seen) {
		const key = foldName(name);
		if (key.length < 4) continue;
		let byName = spellings.get(key);
		if (!byName) spellings.set(key, (byName = new Map()));
		const entry = byName.get(name) ?? { count: 0, english: false };
		entry.count += 1;
		entry.english ||= lang.split('-')[0] === 'en';
		byName.set(name, entry);
		if (counts) {
			let places = citers.get(key);
			if (!places) citers.set(key, (places = new Set()));
			places.add(citer);
		}
		for (const loc of locators) {
			let names = atLocator.get(loc);
			if (!names) atLocator.set(loc, (names = new Set()));
			names.add(key);
		}
	}

	// How many DISTINCT locators each pair of spellings shares.
	/** @type {Map<string, number>} */
	const weight = new Map();
	for (const names of atLocator.values()) {
		const list = [...names].sort();
		for (let i = 0; i < list.length; i++) {
			for (let j = i + 1; j < list.length; j++) {
				const edge = `${list[i]} ${list[j]}`;
				weight.set(edge, (weight.get(edge) ?? 0) + 1);
			}
		}
	}

	/** @type {Map<string, string>} */
	const parent = new Map();
	const find = (/** @type {string} */ x) => {
		let node = x;
		let up = parent.get(node) ?? node;
		while (up !== node) {
			// Halve the path on the way up, so a long chain of merges costs
			// the next lookup nothing.
			const grand = parent.get(up) ?? up;
			parent.set(node, grand);
			node = grand;
			up = parent.get(node) ?? node;
		}
		parent.set(node, node);
		return node;
	};
	const union = (/** @type {string} */ a, /** @type {string} */ b) => {
		const ra = find(a);
		const rb = find(b);
		if (ra !== rb) parent.set(ra, rb);
	};
	for (const key of spellings.keys()) find(key);
	for (const [edge, w] of weight) {
		if (w < minShared) continue;
		const [a, b] = edge.split(' ');
		union(a, b);
	}

	/** @type {Map<string, { spellings: Map<string, { count: number, english: boolean }>, citers: Set<string> }>} */
	const groups = new Map();
	for (const key of spellings.keys()) {
		const root = find(key);
		let g = groups.get(root);
		if (!g) groups.set(root, (g = { spellings: new Map(), citers: new Set() }));
		for (const [name, e] of spellings.get(key) ?? []) {
			const into = g.spellings.get(name) ?? { count: 0, english: false };
			into.count += e.count;
			into.english ||= e.english;
			g.spellings.set(name, into);
		}
		for (const c of citers.get(key) ?? []) g.citers.add(c);
	}

	return [...groups.values()]
		.filter((g) => g.citers.size > 0)
		.map((g) => ({
			name: displayName(g.spellings),
			spellings: [...g.spellings.keys()].sort(),
			citers: g.citers
		}))
		.sort((a, b) => b.citers.size - a.citers.size || a.name.localeCompare(b.name));
}

/**
 * Which spelling of a cluster the page prints.
 *
 * THE ENGLISH EDITION'S WHERE THERE IS ONE, because `/census` is written in
 * English and the alternative is what the first run of this table printed:
 * `S. CYPRIANUS` and `Sant'Ireneo di Lione` at the head of a page whose every
 * other word is English. Frequency alone answers whichever edition cites most,
 * and the Latin and Italian apparatus are the sigla-heaviest in the corpus.
 *
 * Falling back to the most frequent, and among equals the alphabetically
 * first, so a rebuild over an unchanged corpus draws the same table. An
 * all-capitals spelling is taken last of all — `S. CYPRIANUS` is a printing
 * convention of one edition's apparatus, not a way to write a man's name.
 *
 * @param {Map<string, { count: number, english: boolean }>} spellings
 * @returns {string}
 */
function displayName(spellings) {
	const ranked = [...spellings].sort(
		(a, b) =>
			Number(b[1].english) - Number(a[1].english) ||
			Number(isShouted(a[0])) - Number(isShouted(b[0])) ||
			b[1].count - a[1].count ||
			a[0].localeCompare(b[0])
	);
	return ranked[0]?.[0] ?? '';
}

/** Set in the capitals one apparatus shouts its authors in. */
function isShouted(/** @type {string} */ name) {
	const letters = name.replace(/[^A-Za-zÀ-ž]/g, '');
	return letters.length > 3 && letters === letters.toUpperCase();
}
