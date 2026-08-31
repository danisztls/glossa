import { describe, expect, it } from 'vitest';
import { BOOK_GROUPS, GROUP_KEYS, groupOf, type BookGroupKey } from './bible-groups';
import { dictionaryFor, UI_LANGS } from './i18n.svelte';

/**
 * The canon, transcribed from docs/corpus-schema.md "Canonical book order",
 * NOT read back from `BOOK_GROUPS` — a table checked against itself checks
 * nothing. This is also why it is not `listCanonicalBooks()`: under vitest the
 * corpus is the fixtures (two books), so the real canon has to be written down
 * for the completeness assertions below to mean anything.
 */
const OT = `gen exod lev num deut josh judg ruth 1sam 2sam 1kgs 2kgs 1chr 2chr ezra neh tob jdt
	esth 1macc 2macc job ps prov eccl song wis sir isa jer lam bar ezek dan hos joel amos obad
	jonah mic nah hab zeph hag zech mal`.split(/\s+/);

const NT = `matt mark luke john acts rom 1cor 2cor gal eph phil col 1thess 2thess 1tim 2tim titus
	phlm heb jas 1pet 2pet 1john 2john 3john jude rev`.split(/\s+/);

const KEYS: BookGroupKey[] = [
	'pentateuch',
	'historical',
	'wisdom',
	'prophetic',
	'gospels',
	'acts',
	'pauline',
	'catholicLetters',
	'revelation'
];

describe('BOOK_GROUPS', () => {
	it('partitions the canon: every book once, no book twice, nothing invented', () => {
		const grouped = BOOK_GROUPS.flatMap((g) => g.osis);
		expect(new Set(grouped).size).toBe(grouped.length);
		expect([...grouped].sort()).toEqual([...OT, ...NT].sort());
	});

	it('assigns each group to the testament its books belong to', () => {
		for (const group of BOOK_GROUPS) {
			const expected = group.osis.every((o) => OT.includes(o)) ? 'ot' : 'nt';
			expect(group.testament, group.key).toBe(expected);
		}
	});

	it('lists the books of each group in canonical order', () => {
		const canon = [...OT, ...NT];
		for (const group of BOOK_GROUPS) {
			const positions = group.osis.map((o) => canon.indexOf(o));
			expect(positions, group.key).toEqual([...positions].sort((a, b) => a - b));
		}
	});

	/**
	 * Contiguity is what makes the grouping honest: it inserts headings into
	 * the canonical order and reorders nothing. Losing it would mean the page
	 * silently presents a different sequence from the one every edition prints.
	 * (The component still keys off osis rather than slicing this run — see
	 * `bible-groups.ts` on why the editions disagree about `order`.)
	 */
	it('gives every group a contiguous run of the canonical order', () => {
		const canon = [...OT, ...NT];
		for (const group of BOOK_GROUPS) {
			const first = canon.indexOf(group.osis[0]);
			expect(canon.slice(first, first + group.osis.length), group.key).toEqual([...group.osis]);
		}
	});

	it('runs the groups in canonical order, Old Testament first', () => {
		expect(BOOK_GROUPS.map((g) => g.key)).toEqual(KEYS);
		expect(BOOK_GROUPS.map((g) => g.testament)).toEqual([
			'ot',
			'ot',
			'ot',
			'ot',
			'nt',
			'nt',
			'nt',
			'nt',
			'nt'
		]);
	});

	/**
	 * The four decisions the table encodes, asserted as sizes so that changing
	 * one is a deliberate act with a failing test beside it rather than a
	 * quiet edit to a long list of strings. Each is argued in `bible-groups.ts`.
	 */
	it("encodes CEI 2008's scheme, and the one place it departs from it", () => {
		const size = (key: BookGroupKey) => BOOK_GROUPS.find((g) => g.key === key)?.osis.length;
		expect(size('pentateuch')).toBe(5);
		expect(size('historical')).toBe(16);
		expect(size('wisdom')).toBe(7);
		// Undivided: no major/minor split.
		expect(size('prophetic')).toBe(18);
		expect(size('gospels')).toBe(4);
		// Their own groups, one book each.
		expect(size('acts')).toBe(1);
		expect(size('revelation')).toBe(1);
		// Hebrews closes the Pauline fourteen, and the Catholic Letters are
		// the seven — not because Trent settles the authorship question but
		// because a group of eight has no name in any of the fourteen
		// interface languages. See `bible-groups.ts`.
		expect(size('pauline')).toBe(14);
		expect(size('catholicLetters')).toBe(7);
		expect(groupOf('heb')).toBe('pauline');
		expect(groupOf('jas')).toBe('catholicLetters');
	});

	it('keeps the deuterocanonical books inside their groups, unmarked', () => {
		for (const osis of ['tob', 'jdt', '1macc', '2macc']) expect(groupOf(osis)).toBe('historical');
		for (const osis of ['wis', 'sir']) expect(groupOf(osis)).toBe('wisdom');
		expect(groupOf('bar')).toBe('prophetic');
	});
});

describe('the group names in the dictionaries', () => {
	it('exports one key per group, in render order', () => {
		expect(GROUP_KEYS).toEqual(KEYS);
	});

	/**
	 * The other direction from the test below, and not implied by it: a key
	 * naming a group that does not exist is unreachable, always a typo, and
	 * invisible — `t()` would happily hold it forever and nothing would render
	 * it. Renaming a group without renaming its key in all fourteen is exactly
	 * how one gets there.
	 */
	it('invents no group a dictionary could not render', async () => {
		const known = new Set(GROUP_KEYS.map((k) => `bible.group.${k}`));
		for (const lang of UI_LANGS) {
			for (const key of Object.keys(await dictionaryFor(lang))) {
				if (key.startsWith('bible.group.')) expect(known, `${lang}: ${key}`).toContain(key);
			}
		}
	});

	/**
	 * ALL FOURTEEN ARE COMPLETE, and this asserts it rather than allowing the
	 * partial state `t()` would tolerate. The rule was "all nine or none" while
	 * six languages were unsourced; it is "all nine" now that they are, and
	 * tightening it is the point — a group added later must be named
	 * everywhere before it ships, which is the same standard `chromeNames`
	 * holds the `hreflang` cluster to. Both halves matter: an incomplete
	 * dictionary renders one English heading among eight translated ones,
	 * which reads as a bug rather than as a fallback.
	 */
	it('names every group in every interface language', async () => {
		for (const lang of UI_LANGS) {
			const dict = await dictionaryFor(lang);
			for (const key of GROUP_KEYS)
				expect(dict[`bible.group.${key}`], `${lang}.${key}`).toBeTruthy();
		}
	});
});
