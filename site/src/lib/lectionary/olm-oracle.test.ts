/**
 * The committed lectionary table, checked against the typical edition itself.
 *
 * `table.json` is built from USCCB's daily pages, which print the UNITED
 * STATES' adaptation of the Ordo Lectionum Missae. An adaptation cannot be
 * asked whether it differs from the book it adapts, so something that is not
 * it has to be: `pipeline/scrapers/olm.py` reads the 1981 typical edition off
 * its scan and writes, for each lectionary number, the set of passages that
 * number appoints. This diffs the two.
 *
 * WHAT IT COMPARES AND WHAT IT CANNOT. Book and chapter, not verse ranges.
 * The scan's verse groups survive OCR well enough to read but not well enough
 * to equate — `Ps 129, 1-2. 3-4b. 4c-6` is one dropped character away from a
 * false alarm every run, and a check that cries wolf is a check that gets
 * commented out. Book and chapter are robust, and they catch the failure that
 * matters: a wrong pericope, a wrong chapter, or a psalm left in Hebrew
 * numbering.
 *
 * THE PSALMS ARE THE POINT OF THE EXERCISE. The scan numbers them the
 * Vulgate's way and USCCB numbers them the modern way, so a psalm agrees only
 * after `toVulgateCandidates` has moved it — which is why this check lives in
 * `site/` and not beside the parser in `pipeline/`. `common/versification.py`
 * REFUSES the three wholesale-divergent books rather than reimplementing an
 * algorithm in a second language, and Psalms is one of them.
 *
 * WITHOUT A CORPUS THIS FILE ASSERTS NOTHING AND SAYS SO, on the same terms as
 * `calendar/oracle.test.ts`: it is a development verification run by
 * `npm run verify:lectionary`, not a gate on a build, and the machine without
 * a corpus was never going to run it. What must not happen is a silent pass.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOOK_FORMS } from '../refs-grammar';
import { toVulgateCandidates } from '../versification';
import table from './table.json';

const CORPUS_DIR =
	process.env.CORPUS_DIR ??
	join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'glossa-corpus');
const ORACLE = join(CORPUS_DIR, 'build', 'olm1981', 'lectionary.json');
const HAVE_ORACLE = existsSync(ORACLE);

interface OracleCitation {
	osis: string;
	ch: number;
	v: string;
	raw: string;
}
interface Oracle {
	coverage: { numbers_read: number; numbers_printed: number };
	entries: Record<string, { page: number; citations: OracleCitation[] }>;
}

/** Longest form first, so `Jo` cannot pre-empt `Job` — the same ordering rule
 *  `book_form_pattern` states on the Python side. */
const EN = Object.entries(BOOK_FORMS.en ?? {}).flatMap(([osis, forms]) =>
	forms.map((form) => [form, osis] as const)
);
const FORMS = [...EN]
	.sort((a, b) => b[0].length - a[0].length)
	.map(([form]) => form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
	.join('|');
/** A chapter-and-verse address, or -- for a one-chapter book -- a bare verse.
 *  `Jude 17, 20b-25` has no colon in it because Jude has no second chapter. */
const EN_RE = new RegExp(`^(${FORMS})\\s+(?:(\\d{1,3}):|(\\d{1,3})(?:[,\\s]|$))`);
const OSIS_OF = new Map(EN);

/**
 * `See `, `Cf. `, `cf. ` — what USCCB prefixes an acclamation with when the
 * verse is adapted rather than quoted. It is not part of the address, and
 * leaving it in made 45 of the table's citations invisible to this check.
 */
const APPROX = /^(?:see|cf\.?)\s+/i;

/** Books whose one chapter means a citation carries only a verse number. */
const ONE_CHAPTER = new Set(['obad', 'phlm', '2john', '3john', 'jude']);

/** `Ezekiel 33:7-9` -> `{ osis: 'ezek', chapter: 33 }`, or undefined. */
function parseOurs(cite: string): { osis: string; chapter: number } | undefined {
	const match = EN_RE.exec(cite.trim().replace(APPROX, ''));
	if (!match) return undefined;
	const osis = OSIS_OF.get(match[1]);
	if (!osis) return undefined;
	// The second branch matched a bare number: a chapter for a one-chapter
	// book is 1, and for any other book a bare number is not an address this
	// understands.
	if (match[3] !== undefined) return ONE_CHAPTER.has(osis) ? { osis, chapter: 1 } : undefined;
	return { osis, chapter: Number(match[2]) };
}

/**
 * A cite that is not an address at all, and must not be counted as one this
 * failed to parse. `Victimae paschali laudes` is the Easter sequence — the
 * source prints its incipit where a citation would go, because a sequence is
 * not Scripture and has none.
 */
function isAddress(cite: string): boolean {
	return /\d/.test(cite);
}

/** Every Vulgate chapter our address could be, the scan's numbering. */
function vulgateChapters(osis: string, chapter: number): number[] {
	return toVulgateCandidates(osis, chapter).map((c) => c.chapter);
}

/**
 * Numbers where the SCAN's entry is truncated, not where the table is wrong.
 *
 * The parser reads each entry from its number to the next, and on a page whose
 * columns it mis-splits that run keeps only part of what the book prints. Both
 * of these were read by hand against the source before being listed:
 *
 *  - 99 is the Thirteenth Sunday of the Year, and the scan kept only its
 *    alleluia (`1 Sam 3, 9` / `Io 6, 68`) — the three readings are absent.
 *  - 639 is Our Lady of Sorrows, and the scan kept the ALTERNATIVE gospel
 *    (`Lc 2, 33-35`) where the table has the one USCCB printed (`John
 *    19:25-27`), plus a psalm whose verses OCR'd to `2-3a. 93b`.
 *
 * Listed rather than tolerated by a loosened assertion: a threshold would hide
 * the next one, and these two are the evidence for how far the scan can be
 * trusted — which is the whole question this file exists to keep asking.
 */
const SCAN_TRUNCATED = new Set(['99', '639']);

describe.skipIf(!HAVE_ORACLE)('the table against the OLM 1981 scan', () => {
	// READ LAZILY, NOT AT COLLECTION. `describe.skipIf` still RUNS this
	// callback — it only marks the tests inside it skipped — so a `readFileSync`
	// out here throws on the machine the guard exists to spare, which is
	// exactly what it did the first time this file ran.
	let cached: Oracle | undefined;
	const load = () => (cached ??= JSON.parse(readFileSync(ORACLE, 'utf8')) as Oracle);
	const masses = table.masses as Record<string, { readings: { cite: string }[] }>;

	const shared = () => Object.keys(masses).filter((n) => load().entries[n]?.citations.length);

	/** For one number: which of our citations the scan also prints. */
	function compare(n: string) {
		const theirs = load().entries[n].citations;
		const ours = masses[n].readings
			.map((r) => r.cite)
			.filter((c) => c && isAddress(c))
			.map(parseOurs);
		const parsed = ours.filter((o): o is { osis: string; chapter: number } => Boolean(o));
		const found = parsed.filter((o) =>
			vulgateChapters(o.osis, o.chapter).some((ch) =>
				theirs.some((t) => t.osis === o.osis && t.ch === ch)
			)
		);
		return { unparsed: ours.length - parsed.length, parsed, found };
	}

	it('has something to check', () => {
		// A silent pass is the failure this whole file is written against: an
		// empty `shared` would make every assertion below vacuous.
		expect(shared().length).toBeGreaterThan(250);
	});

	it('never disagrees with the scan outright', () => {
		// THE ALIGNMENT INVARIANT, and the strongest thing this check can say.
		// If our number N and the scan's number N were about different days,
		// they would share no passage at all. Every shared number overlapping
		// in at least one book and chapter is what says the numbering itself —
		// the permanent key the whole table hangs on — is sound.
		const orphaned = shared().filter((n) => {
			if (SCAN_TRUNCATED.has(n)) return false;
			const { parsed, found } = compare(n);
			return parsed.length > 0 && found.length === 0;
		});
		expect(orphaned).toEqual([]);
	});

	it('agrees on every citation for most numbers, and reports the rest', () => {
		let whole = 0;
		const partial: string[] = [];
		let unparsed = 0;
		const numbers = shared();
		for (const n of numbers) {
			const result = compare(n);
			unparsed += result.unparsed;
			if (!result.parsed.length) continue;
			if (result.found.length === result.parsed.length) whole += 1;
			else partial.push(n);
		}
		const report =
			`${whole}/${numbers.length} numbers agree on every citation; ` +
			`${partial.length} agree on some; ${unparsed} of our citations did not parse`;
		console.info(`  olm oracle: ${report}`);
		// A FLOOR, NOT AN EQUALITY. The scan is 92% recovered and its entries
		// are read to the next number, so a long entry (the Easter Vigil's
		// seven prophecies) can lose its head to the entry above. Pinning the
		// exact figure would make every parser improvement a failing test; a
		// floor only fires when something got WORSE.
		expect(whole).toBeGreaterThanOrEqual(120);
	});
});
