import { describe, expect, it } from 'vitest';
import { localizeCite } from './cite';
import { parseRefs, type RefSegment } from '$lib/refs-grammar';
import table from './table.json';

/**
 * `localizeCite`'s round trip, checked over the whole shipped table rather
 * than over examples.
 *
 * The module verifies itself at render (see `addressesAgree`), so the first
 * test below can only fail if that guard is removed — which is exactly what it
 * is for, the guard being one line and its absence silent. The second is the
 * one that fails when something DRIFTS: a citation that stops localizing is
 * not an error, it is a reader reading English, so the measure is what share
 * still does. The floors are floors and not measurements — the real numbers
 * are a percent or two higher, and this file is not the place to record them.
 */

type Scripture = Extract<RefSegment, { kind: 'scripture' }>;

const CITES = Object.values(table.masses)
	.flatMap((mass) =>
		mass.readings.flatMap((r) => [r.cite, ...((r as { orElse?: string[] }).orElse ?? [])])
	)
	.filter((cite): cite is string => Boolean(cite));

function addresses(cite: string, lang: string): string[] {
	return parseRefs(cite, { lang })
		.filter((s): s is Scripture => s.kind === 'scripture')
		.map((s) => `${s.osis} ${s.chapter}:${s.verses.join(',')}`);
}

/**
 * The languages with a book table, and the share of the table's citations each
 * is expected to rewrite. The three low ones have derived tables — built from
 * what the Catechism happens to cite — so a book it never cites is simply
 * absent and its citations stay English, which is the documented cost of
 * deriving them.
 *
 * ENGLISH IS NOT IN IT AND CANNOT BE. What is counted is `lang !== 'en'`, the
 * only signal there is that a rewrite happened, and English answers `'en'`
 * whether it rewrote or gave up — the source's language being what "gave up"
 * falls back to. It is covered instead by the invariant below, which is
 * checked for every language including the ones with no table, and by the
 * spot checks above.
 */
const FLOORS: Record<string, number> = {
	pt: 0.95,
	es: 0.95,
	it: 0.95,
	fr: 0.95,
	de: 0.95,
	la: 0.95,
	mg: 0.95,
	zht: 0.9,
	pl: 0.7,
	ru: 0.7,
	ar: 0.7
};

describe('localizeCite', () => {
	it('writes the book and the punctuation the reader’s own language writes', () => {
		expect(localizeCite('Ezekiel 33:7-9', 'pt')).toEqual({ text: 'Ez 33,7-9', lang: 'pt' });
		expect(localizeCite('Ezekiel 33:7-9', 'la').text).toBe('Ez 33,7-9');
		// Traditional Chinese writes the book and keeps the colon, its own
		// table's separator — the two halves are independent.
		expect(localizeCite('Ezekiel 33:7-9', 'zht').text).toBe('則 33:7-9');
	});

	it('abbreviates for an English reader too, the source’s language being no reason to differ', () => {
		// It printed the source's own `Ezekiel 33:7-9` for a day, which put two
		// conventions on one card decided by the reader's language.
		expect(localizeCite('Ezekiel 33:7-9', 'en')).toEqual({ text: 'Ez 33:7-9', lang: 'en' });
		// The chapter mark is English's own, so only the book moves.
		expect(localizeCite('Psalm 95:1-2, 6-7, 8-9', 'en').text).toBe('Ps 95:1-2, 6-7, 8-9');
	});

	it('separates one passage from the next with a mark the chapter is not using', () => {
		// `Sl 95,1-2, 6-7` would spend the comma twice. Every Romance table
		// already chains a verse list on "." — see `parseVerseList`.
		expect(localizeCite('Psalm 95:1-2, 6-7, 8-9', 'pt').text).toBe('Sl 95,1-2. 6-7. 8-9');
	});

	it('keeps the subdivision letters and the continuation clause', () => {
		expect(localizeCite('Isaiah 63:16b-17, 19b; 64:2-7', 'pt').text).toBe(
			'Is 63,16b-17. 19b; 64,2-7'
		);
	});

	it('says "Cf." in the reader’s own word, where the caller gives one', () => {
		expect(localizeCite('See John 1:7', 'pt', 'Cf.').text).toBe('Cf. Jo 1,7');
		expect(localizeCite('See John 1:7', 'pt').text).toBe('See Jo 1,7');
	});

	it('leaves a citation English where the reader’s language has no table', () => {
		// Hungarian: the Káldi Bible's language, and no book table.
		expect(localizeCite('Ezekiel 33:7-9', 'hu')).toEqual({
			text: 'Ezekiel 33:7-9',
			lang: 'en'
		});
	});

	it('leaves a citation English where its book has no form in that language', () => {
		// Jude is one of the books absent from the derived Spanish table — its
		// name is short enough that the Catechism never abbreviates it.
		expect(localizeCite('Jude 17, 20b-25', 'es').lang).toBe('en');
	});

	it('names the same passages after rewriting, for every citation and every language', () => {
		// The whole invariant, and it is asked of the ANSWER rather than of the
		// rewrite: whatever comes back must be read under the language that
		// comes back with it, so a citation left alone is checked as English
		// and a rewritten one in its own grammar. `hu` is in the list because a
		// language with no table has to be checked too — it takes the branch
		// that returns the source, and this is what says the branch is right.
		for (const lang of [...Object.keys(FLOORS), 'en', 'hu']) {
			const wrong: string[] = [];
			for (const cite of CITES) {
				const out = localizeCite(cite, lang, 'Cf.');
				const before = addresses(cite, 'en');
				const after = addresses(out.text, out.lang);
				if (before.join(' | ') !== after.join(' | ')) wrong.push(`${lang}: ${cite} → ${out.text}`);
			}
			expect(wrong).toEqual([]);
		}
	});

	it('rewrites nearly all of them', () => {
		for (const [lang, floor] of Object.entries(FLOORS)) {
			const done = CITES.filter((cite) => localizeCite(cite, lang, 'Cf.').lang !== 'en').length;
			expect({ lang, share: done / CITES.length >= floor }).toEqual({ lang, share: true });
		}
	});
});
