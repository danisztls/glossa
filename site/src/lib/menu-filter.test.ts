import { describe, expect, it } from 'vitest';
import {
	editionSearchText,
	langWeights,
	primaryUiLangs,
	uiLangSearchText,
	UI_LANG_NAMES
} from './menu-filter';
import { matchesQuery } from './highlight';
import { languageDisplayName } from './corpus';
import { UI_LANGS, type UiLang } from './ui-langs';
import type { WorkManifest } from './types';

function work(id: string, language: string): WorkManifest {
	return { id, language } as WorkManifest;
}

describe('UI_LANG_NAMES', () => {
	// The type already forbids a missing key; this is about the value. An
	// empty string compiles, renders as a blank row and is exactly the shape
	// of omission the old `OPTIONS` array shipped.
	it('names every interface language', () => {
		for (const lang of UI_LANGS) expect(UI_LANG_NAMES[lang].trim()).not.toBe('');
	});

	/**
	 * The overlap with `corpus.ts`'s `LANGUAGE_NAMES` is 26 of these 34, and
	 * the two tables have to say the same thing about the same language: they
	 * sit two triggers apart in the same header, and "Latina" in one beside
	 * "Latin" in the other would read as two different languages.
	 *
	 * `languageDisplayName` answers the tag itself for a language it does not
	 * know, which is how the eight reach tags exempt themselves — they are
	 * deliberately absent there, being content-language keys.
	 */
	it('agrees with the edition menu wherever both name a language', () => {
		for (const lang of UI_LANGS) {
			const content = languageDisplayName(lang);
			if (content === lang) continue;
			expect(UI_LANG_NAMES[lang]).toBe(content);
		}
	});
});

describe('langWeights', () => {
	it('counts editions per base language, folding the region away', () => {
		const weights = langWeights([
			work('prayer.common.en', 'en'),
			work('prayer.common.en-gb', 'en-GB'),
			work('ccc.pt', 'pt')
		]);
		expect(weights.get('en')).toBe(2);
		expect(weights.get('pt')).toBe(1);
	});
});

describe('primaryUiLangs', () => {
	const weights = new Map(Object.entries({ en: 264, it: 238, la: 199, pt: 138, be: 31 }));

	it('takes the corpus’s heaviest languages', () => {
		expect(primaryUiLangs(weights, 'en', 4)).toEqual(['en', 'pt', 'la', 'it']);
	});

	it('lists them in UI_LANGS order, not in weight order', () => {
		const shown = primaryUiLangs(weights, 'en');
		const positions = shown.map((lang) => UI_LANGS.indexOf(lang));
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});

	// The one row the panel must never hide is the one carrying the tick.
	it('always shows the current language, however light', () => {
		expect(primaryUiLangs(weights, 'hi', 4)).toContain('hi');
	});

	// A corpus with nothing in it — the fixtures, a build with `CORPUS_DIR`
	// pointing nowhere — must still produce a stable tier rather than whatever
	// `sort` does with an all-zero key.
	it('falls back to UI_LANGS order when nothing is weighted', () => {
		expect(primaryUiLangs(new Map(), 'en', 3)).toEqual(['en', 'pt', 'la']);
	});

	it('never exceeds the count by more than the current language', () => {
		expect(primaryUiLangs(weights, 'en', 12)).toHaveLength(12);
		expect(primaryUiLangs(weights, 'hi', 12)).toHaveLength(13);
	});
});

describe('what the language box finds', () => {
	const find = (lang: UiLang, query: string, inLang = 'en') =>
		matchesQuery(uiLangSearchText(lang, UI_LANG_NAMES[lang], inLang), query);

	it('finds a language by its two-letter code', () => {
		expect(find('de', 'de')).toBe(true);
		expect(find('sw', 'sw')).toBe(true);
	});

	it('finds a language by its own name', () => {
		expect(find('cs', 'Čeština')).toBe(true);
		expect(find('be', 'Беларуская')).toBe(true);
	});

	// The whole reason matching goes through `highlight.ts`'s fold: a reader on
	// a keyboard with no háčeks still has to be able to reach Czech.
	it('finds a diacritic name typed without its diacritics', () => {
		expect(find('cs', 'cestina')).toBe(true);
		expect(find('vi', 'tieng viet')).toBe(true);
		expect(find('ro', 'romana')).toBe(true);
	});

	// `Intl.DisplayNames`, the third surface — and the only one nobody here
	// maintains. A reader in English chrome should not have to know that
	// German calls itself Deutsch.
	it('finds a language by its name in the reader’s own interface language', () => {
		expect(find('de', 'German')).toBe(true);
		expect(find('de', 'alemão', 'pt')).toBe(true);
	});

	it('does not answer a query that names some other language', () => {
		expect(find('de', 'polski')).toBe(false);
	});
});

describe('what the edition box finds', () => {
	const bible = {
		...work('bible.douay-rheims.en', 'en'),
		title: 'The Holy Bible, Douay-Rheims',
		short_title: 'Douay-Rheims'
	} as WorkManifest;
	const find = (query: string) =>
		matchesQuery(editionSearchText(bible, languageDisplayName(bible.language)), query);

	it('finds an edition by its language, which is what nearly every menu is', () => {
		expect(find('English')).toBe(true);
		expect(find('en')).toBe(true);
	});

	// The Bible is the one context where the language does not discriminate:
	// two English editions, told apart only by the title the panel prints.
	it('finds an edition by its title', () => {
		expect(find('douay')).toBe(true);
		expect(find('rheims')).toBe(true);
	});

	it('does not answer a query that names another edition', () => {
		expect(find('Clementina')).toBe(false);
	});
});
