import { describe, expect, it } from 'vitest';
import { availableSpecimens, citationSpecimens, scopeSpecimen } from './specimens';
import { parseSectionFilter, suggest } from './suggest';

/** The fixture Bible carries Genesis and John, which is what lets the
 *  Scripture row be drawn at all — `scriptureSpecimen` reads the book's own
 *  name out of the edition. */
const BIBLE = 'bible.douay-rheims.en';

describe('citationSpecimens', () => {
	it('answers for every work that has a notation, once', () => {
		const rows = citationSpecimens(BIBLE, 'en');
		expect(rows.map((row) => row.key)).toEqual([
			'scripture',
			'catechism',
			'compendium',
			'magisterium',
			'social',
			'law',
			'doctors'
		]);
	});

	// They are cited by name, and an invented shape would teach a form that
	// does not exist — the jump box says so in words instead.
	it('gives prayers no row', () => {
		expect(citationSpecimens(BIBLE, 'en').some((row) => row.type === 'prayer')).toBe(false);
	});

	it('draws the Bible out of the reader’s own edition', () => {
		expect(citationSpecimens(BIBLE, 'en')[0].text).toBe('Jn 3:16');
	});

	// The one row that can be absent: no edition, no book name, no form.
	it('leaves Scripture undefined where no Bible is loaded', () => {
		expect(citationSpecimens(undefined, 'en')[0].text).toBeUndefined();
		expect(citationSpecimens(undefined, 'en')[0].typed).toBeUndefined();
	});

	it('takes the sigla from the dictionary', () => {
		const by = Object.fromEntries(citationSpecimens(BIBLE, 'en').map((r) => [r.key, r.text]));
		expect(by.catechism).toBe('CCC 1234');
		expect(by.law).toBe('Can. 123');
	});
});

describe('the typed form', () => {
	const typed = Object.fromEntries(citationSpecimens(BIBLE, 'en').map((r) => [r.key, r.typed]));

	it('lower-cases and drops the abbreviating stop', () => {
		expect(typed.catechism).toBe('ccc 1234');
		expect(typed.compendium).toBe('comp 123');
		expect(typed.law).toBe('can 123');
		expect(typed.social).toBe('csdc 123');
		expect(typed.magisterium).toBe('dei verbum 12');
	});

	// The Summa's comma separates a part from a question and its grammar reads
	// the form without one; Scripture's IS the chapter/verse mark in half the
	// languages here, so it stays.
	it('drops the Summa’s comma and keeps Scripture’s separator', () => {
		expect(typed.doctors).toBe('sth i 12');
		expect(typed.scripture).toBe('jn 3:16');
	});
});

/**
 * THE LEGEND'S PROMISE, CHECKED AGAINST THE SUGGESTER ITSELF. Every row in
 * the jump box is a string that goes into its field, so a row the box cannot
 * answer is an example that teaches a form and then declines it. Only the
 * four works the fixtures carry can be checked here; the numbers are the
 * representative ones, which do not exist in a two-book corpus, so each is
 * asked with a unit the fixtures really hold.
 */
describe('the box answers what the legend prints', () => {
	const ask = (query: string) =>
		suggest(query, {
			lang: 'en',
			bibleWorkId: BIBLE,
			cccLang: 'en',
			compendiumLang: 'en',
			summaLang: 'en'
		});

	it.each([
		['jn 3:16', '/scriptura/ioannes/3#v16'],
		['ccc 27', '/catechismus/27'],
		['comp 1', '/catechismus/compendium/1'],
		['sth i 1', '/doctores/summa/i/1']
	])('resolves %s', (query, href) => {
		expect(ask(query)[0]?.href).toBe(href);
	});

	// The same queries as the legend used to print them. They must keep
	// working — the reader may still type a stop, and `/schola` teaches them.
	it.each([
		['Jn 3:16', '/scriptura/ioannes/3#v16'],
		['CCC 27', '/catechismus/27'],
		['Comp. 123', '/catechismus/compendium/1'],
		['STh I, 1', '/doctores/summa/i/1']
	])('still resolves the printed form %s', (query, href) => {
		expect(ask(query.replace('123', '1'))[0]?.href).toBe(href);
	});
});

/**
 * The legend's last row, which teaches a SCOPE rather than a citation. The
 * property that matters is the one the rows above have: what it prints is a
 * string that goes into the field and does what it says it does.
 */
describe('scopeSpecimen', () => {
	it('is the first available work’s own siglum, and a colon', () => {
		expect(scopeSpecimen()).toBe('ccc:');
	});

	it('is a prefix the box really reads as a scope', () => {
		const prefix = scopeSpecimen();
		expect(prefix).toBeDefined();
		expect(parseSectionFilter(`${prefix} gene`)?.paths).toEqual(['/catechismus']);
	});
});

describe('availableSpecimens', () => {
	// The fixtures carry the Bible, the Catechism, its Compendium and the
	// Summa, and no document, Code or Social Doctrine — which is exactly the
	// partial build the gate exists for.
	it('drops the works this build does not carry', () => {
		expect(availableSpecimens(BIBLE, 'en').map((row) => row.key)).toEqual([
			'scripture',
			'catechism',
			'compendium',
			'doctors'
		]);
	});

	it('drops Scripture with no edition to name the book', () => {
		expect(availableSpecimens(undefined, 'en').map((row) => row.key)).not.toContain('scripture');
	});

	it('keeps the order of the full table', () => {
		const all = citationSpecimens(BIBLE, 'en').map((row) => row.key);
		const some = availableSpecimens(BIBLE, 'en').map((row) => row.key);
		expect(some).toEqual(all.filter((key) => some.includes(key)));
	});
});
