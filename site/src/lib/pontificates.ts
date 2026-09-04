/**
 * When each of `/documenta`'s authors held office.
 *
 * The author facet lists the twelve values of `pontiff_or_council` in the
 * corpus, newest document first, and a bare list of regnal names asks the
 * reader to know the nineteenth and twentieth century papacy by heart. The
 * years say where each one sits without their having to click it.
 *
 * ## Why a table here and not a field in the corpus
 *
 * A pontificate is a fact about the world, not about a document, and nothing
 * upstream publishes it: `pontiff_or_council` is a string vatican.va's own
 * index prints, and the scrapers have no more than that. Deriving the span
 * from the documents instead — first and last `promulgated` under a name —
 * would be wrong in a way that looks right: it gives when a pope PUBLISHED
 * what this corpus happens to hold, so Leo XIII would read 1878-1902 and
 * Benedict XV 1914-1921, each short at the end by the years in which they
 * wrote nothing the corpus carries.
 *
 * ## The end year is optional, and that is the reigning pope
 *
 * `to: null` renders as a trailing en dash, the conventional form for an
 * office still held. It is deliberately not the word "present": that would be
 * a chrome string, and that is one per dictionary — whereas
 * `2025-` is the same in all of them, and a table of digits is the one label
 * on this page that needs no translator.
 *
 * A name absent from the table gets no period at all rather than a guess.
 * That is the same posture `documentKindLabel` takes for a kind it does not
 * know: a new pontificate ingested before this file is updated shows the list
 * it always showed.
 */

interface Reign {
	from: number;
	/** `null` while the office is still held. */
	to: number | null;
}

/* Keyed on the raw `pontiff_or_council` string, which is corpus data and
   never translated — the same key the author facet filters on.

   The two councils are in the table for the same reason they are in the
   facet: each is one of the values a reader chooses between, and a single gap
   in a column of years reads as an omission rather than as a distinction.
   Their years are the council's own, not a pontiff's. */
const REIGNS: Record<string, Reign> = {
	// Its own years, first session to suspension — the Council never closed
	// in form: the Italian army entered Rome in September 1870 and Pius IX
	// adjourned it indefinitely, and it was only formally closed in 1960, by
	// John XXIII, so that the Second could be convoked. 1870 is the year it
	// last sat and promulgated, which is what this column is for.
	'First Vatican Council': { from: 1869, to: 1870 },
	'Leo XIII': { from: 1878, to: 1903 },
	'Pius X': { from: 1903, to: 1914 },
	'Benedict XV': { from: 1914, to: 1922 },
	'Pius XI': { from: 1922, to: 1939 },
	'Pius XII': { from: 1939, to: 1958 },
	'John XXIII': { from: 1958, to: 1963 },
	'Second Vatican Council': { from: 1962, to: 1965 },
	'Paul VI': { from: 1963, to: 1978 },
	'John Paul II': { from: 1978, to: 2005 },
	'Benedict XVI': { from: 2005, to: 2013 },
	Francis: { from: 2013, to: 2025 },
	'Leo XIV': { from: 2025, to: null }
};

/** En dash, not a hyphen: this is a range of years, and the corpus's own
 *  titles and the reading routes set ranges the same way. */
const EN_DASH = '–';

/** "1878-1903", or "2025-" for an office still held. `undefined` for a name
 *  the table does not carry, which the caller renders as nothing. */
export function pontificate(author: string): string | undefined {
	/* `Object.hasOwn`, not a bare lookup: the key is corpus data, and an
	   object literal inherits `constructor` and `toString` from its
	   prototype, which a plain `REIGNS[author]` would happily return. */
	if (!Object.hasOwn(REIGNS, author)) return undefined;
	const reign = REIGNS[author];
	return `${reign.from}${EN_DASH}${reign.to ?? ''}`;
}
