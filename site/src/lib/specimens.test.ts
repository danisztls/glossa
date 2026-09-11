import { describe, expect, it } from 'vitest';
import { availableSpecimens, citationSpecimens } from './specimens';

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
	});

	it('takes the sigla from the dictionary', () => {
		const by = Object.fromEntries(citationSpecimens(BIBLE, 'en').map((r) => [r.key, r.text]));
		expect(by.catechism).toBe('CCC 1234');
		expect(by.law).toBe('Can. 123');
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
