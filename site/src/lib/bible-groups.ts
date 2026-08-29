/**
 * The canonical book groups — Pentateuch, historical, wisdom, prophetic, and
 * the five of the New Testament. The partition only; the names are `t()` keys
 * in the interface dictionaries (see `GROUP_KEYS` at the foot of this file).
 *
 * WHY THIS LIVES IN THE SITE AND NOT IN THE CORPUS. A group is a fact about
 * the canon, not about an edition: all nine Bible editions would carry the
 * same answer, so putting it in `build/` would repeat one invariant nine times
 * and let a rebuild contradict itself. Nothing in `raw/` supplies it either —
 * of the nine sources, only Crampon's scanned table of contents prints the
 * headings at all (`raw/crampon/Bible_Crampon_1923.html`), and it prints four
 * where this table has nine.
 *
 * THE SCHEME IS CEI 2008's, followed deliberately rather than assembled.
 * <https://www.bibbiaedu.it/CEI2008/> — the Italian bishops' conference's own
 * Bible portal; the headings are in the book navigator of any reading page,
 * e.g. <https://www.bibbiaedu.it/CEI2008/at/Gen/1/>, not on the landing page.
 * It was chosen because it is the only source found that resolves all four of
 * the disputes below coherently, and because following one named edition is
 * something a reader can check.
 *
 * WHAT MAY NOT BE SAID ABOUT IT. Grouping the canon is ancient — Jerome,
 * Augustine, Cassiodorus, Isidore, Hugh of St Victor and Aquinas all group —
 * but NOT with these groups. The scheme they share is Jerome's threefold Law /
 * Prophets / Hagiographa (`Prologus Galeatus`), which files Joshua through
 * Kings under *Prophets* and Daniel, Chronicles, Ezra and Esther under
 * *Hagiographa*; Aquinas follows it explicitly ("secundum Hieronymum in
 * prologo libri regum"). The four-part Latin tag `libri legales / historici /
 * sapientiales / prophetici` traces no further back than 20th-century Roman
 * seminary manuals. And nothing magisterial groups at all: the Nova Vulgata's
 * index, CCC §120 and Trent's Session IV are each a flat enumeration. So this
 * table follows a modern Catholic edition, which is a defensible thing to do
 * and a different claim from "this is how the Church divides Scripture".
 *
 * The four decisions it encodes, each against the alternative it rejects:
 *
 * - **The prophets are undivided.** Every printed Catholic Bible checked —
 *   Crampon 1923, the Jerusalem Bible's Contents, CEI, USCCB, and the
 *   Hungarian bishops' own list — prints one prophetic block, with
 *   Lamentations and Baruch simply in sequence beside Jeremiah. The
 *   major/minor split is a schoolbook convention: it survives as running
 *   heads and in descriptive prose, and among our own sources only the modern
 *   Spanish and Portuguese *websites* print it as a heading.
 *
 * - **Hebrews closes the Pauline group, which is fourteen**, and the seven
 *   that follow are the Catholic Letters. This is the ONE PLACE THIS TABLE
 *   DEPARTS FROM CEI, which stops "Lettere Paoline" at Filèmone and opens
 *   "Altre Lettere" with Ebrei — and it departs from the Catechism's grammar
 *   too, since §120 closes the Pauline series at Philemon and enumerates
 *   "epistula ad Hebraeos" separately in all five editions we hold.
 *
 *   IT WAS 13/8 UNTIL THE NAMES WERE LOOKED FOR. Trent calls Hebrews Paul's
 *   fourteenth outright; USCCB, the Jerusalem Bible, the Hungarian bishops'
 *   list, the Jesuit Arabic Bible's own book order, and the Polish, Romanian
 *   and Russian conventions all run Paul through Hebrews. But the decisive
 *   fact was linguistic rather than doctrinal: a group of eight HAS NO NAME.
 *   Every attested heading for the letters besides Paul's — `Epistolele
 *   catolice`, `katoliška pisma`, `Соборные послания`, `Katolska breven`,
 *   `الرسائل الجامعة`, `Listy powszechne` — is defined by the sources that
 *   print it as SEVEN, excluding Hebrews. Naming a group of eight with one of
 *   them would be false in each language, and the alternative was a heading
 *   invented in six languages at once. 14/7 is the arrangement whose names
 *   exist.
 *
 *   The Slovenian bishops' Jerusalem Bible is the interesting dissent: it
 *   gives Hebrews an introduction of its own and then a separate one for the
 *   seven `katoliška pisma` — Hebrews alone, a third answer nobody else gives
 *   and one no nine-group scheme can express.
 *
 * - **Acts and Revelation keep headings of their own**, over one book each.
 *   CEI does this and so does the Hungarian list; Cassiodorus's arrangement at
 *   Vivarium gave Acts and the Apocalypse their own section too. They are
 *   their own genres, and showing that is the entire reason for grouping.
 *
 * - **Deuterocanonical books carry no marking of any kind** — in position,
 *   unlabelled, indistinguishable from the rest of their group. There is
 *   ancient precedent for setting them apart (Isidore gives them a fourth
 *   order outside the Hebrew twenty-two; Hugh has them "read but not written
 *   in the canon"), but both wrote while the question was open, and Trent
 *   closed it in 1546. No post-Tridentine Catholic edition segregates them.
 *
 * MEMBERSHIP IS BY OSIS AND MUST NOT BECOME A RANGE OVER `order`. Every group
 * happens to be contiguous in the order the site renders, so slicing would
 * work today — but the editions do not agree on that order (Matos Soares
 * prints Esther before Tobit and Judith, where the other eight print Tobit,
 * Judith, Esther), and `CanonicalBook.order` comes from whichever Bible work
 * id sorts first alphabetically rather than from anything anyone declared.
 * Books move within a group; a slice would follow them across a boundary.
 */

export type BookGroupKey =
	| 'pentateuch'
	| 'historical'
	| 'wisdom'
	| 'prophetic'
	| 'gospels'
	| 'acts'
	| 'pauline'
	| 'catholicLetters'
	| 'revelation';

export interface BookGroup {
	key: BookGroupKey;
	/** Which testament heading this group sits under, matching the picker's own split. */
	testament: 'ot' | 'nt';
	osis: readonly string[];
}

/** The 73 books partitioned, in canonical order. Asserted complete and
 *  disjoint in `bible-groups.test.ts` against docs/corpus-schema.md's list. */
export const BOOK_GROUPS: readonly BookGroup[] = [
	{ key: 'pentateuch', testament: 'ot', osis: ['gen', 'exod', 'lev', 'num', 'deut'] },
	{
		key: 'historical',
		testament: 'ot',
		osis: [
			'josh',
			'judg',
			'ruth',
			'1sam',
			'2sam',
			'1kgs',
			'2kgs',
			'1chr',
			'2chr',
			'ezra',
			'neh',
			'tob',
			'jdt',
			'esth',
			'1macc',
			'2macc'
		]
	},
	{
		key: 'wisdom',
		testament: 'ot',
		osis: ['job', 'ps', 'prov', 'eccl', 'song', 'wis', 'sir']
	},
	{
		key: 'prophetic',
		testament: 'ot',
		osis: [
			'isa',
			'jer',
			'lam',
			'bar',
			'ezek',
			'dan',
			'hos',
			'joel',
			'amos',
			'obad',
			'jonah',
			'mic',
			'nah',
			'hab',
			'zeph',
			'hag',
			'zech',
			'mal'
		]
	},
	{ key: 'gospels', testament: 'nt', osis: ['matt', 'mark', 'luke', 'john'] },
	{ key: 'acts', testament: 'nt', osis: ['acts'] },
	{
		key: 'pauline',
		testament: 'nt',
		osis: [
			'rom',
			'1cor',
			'2cor',
			'gal',
			'eph',
			'phil',
			'col',
			'1thess',
			'2thess',
			'1tim',
			'2tim',
			'titus',
			'phlm',
			'heb'
		]
	},
	{
		key: 'catholicLetters',
		testament: 'nt',
		osis: ['jas', '1pet', '2pet', '1john', '2john', '3john', 'jude']
	},
	{ key: 'revelation', testament: 'nt', osis: ['rev'] }
];

/** `osis → group key`, built once. */
const groupByOsis: ReadonlyMap<string, BookGroupKey> = new Map(
	BOOK_GROUPS.flatMap((g) => g.osis.map((osis) => [osis, g.key] as const))
);

export function groupOf(osis: string): BookGroupKey | undefined {
	return groupByOsis.get(osis);
}

/**
 * THE NAMES ARE `t()` KEYS, `bible.group.{key}`, in the fourteen UI
 * dictionaries — INTERFACE language, not content language.
 *
 * They were content-language for one revision, on the reasoning that a
 * heading reading "Historical Books" over `Giosuè, Giudici, Rut` is a column
 * speaking two languages. The reasoning was wrong about which thing the
 * heading is. A group name is not part of any edition — no edition here
 * prints one except Crampon, and it prints four where this table has nine —
 * so it is the site talking about the books, exactly like the `Old Testament`
 * / `New Testament` headings it sits under, which have always been `t()`.
 * Splitting the two would have put one language on the testament and another
 * on the group beneath it.
 *
 * A dictionary that has not been given these keys falls back to English per
 * key, which is `t()`'s ordinary behaviour and a supported state — see
 * `i18n.test.ts`, which requires only that no translation invent a key
 * English lacks. That is the reason to leave a gap rather than fill it: a
 * heading nobody can source is worse than an English one, because English is
 * visibly a fallback and a bad translation is not.
 */
export const GROUP_KEYS: readonly BookGroupKey[] = BOOK_GROUPS.map((g) => g.key);
