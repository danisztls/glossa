import { describe, expect, it } from 'vitest';
import {
	editionSearchText,
	langWeights,
	orderByLangChain,
	orderUiLangs,
	readerLangChain,
	uiLangSearchText,
	UI_LANG_NAMES
} from './menu-filter';
import { matchesQuery } from './highlight';
import { contentLangChain, languageDisplayName } from './corpus';
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
	 * The overlap with `lang-names.ts`'s `LANGUAGE_NAMES` is most of these, and
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

describe('orderUiLangs', () => {
	const weights = new Map(Object.entries({ en: 264, it: 238, la: 199, pt: 138, be: 31 }));
	const none: UiLang[] = [];

	it('takes the corpus’s heaviest languages when the browser names none', () => {
		expect(orderUiLangs(none, weights, 'en', 4).primary).toEqual(['en', 'pt', 'la', 'it']);
	});

	it('lists the filler in UI_LANGS order, not in weight order', () => {
		const shown = orderUiLangs(none, weights, 'en').primary;
		const positions = shown.map((lang) => UI_LANGS.indexOf(lang));
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});

	// The one row the panel must never hide is the one carrying the tick.
	it('always shows the current language, however light', () => {
		expect(orderUiLangs(none, weights, 'hi', 4).primary).toContain('hi');
	});

	// A corpus with nothing in it — the fixtures, a build with `CORPUS_DIR`
	// pointing nowhere — must still produce a stable tier rather than whatever
	// `sort` does with an all-zero key.
	it('falls back to UI_LANGS order when nothing is weighted', () => {
		expect(orderUiLangs(none, new Map(), 'en', 3).primary).toEqual(['en', 'pt', 'la']);
	});

	// The whole point: `ko` and `tl` weigh nothing at all, so the corpus
	// ranking buried them — under the very readers whose chrome is in them.
	it('leads with the browser’s languages, in the browser’s order', () => {
		const { primary } = orderUiLangs(['ko', 'tl'], weights, 'ko', 4);
		expect(primary.slice(0, 2)).toEqual(['ko', 'tl']);
		expect(primary).toHaveLength(4);
	});

	it('puts the current language after the browser’s when it is not one of them', () => {
		const { primary } = orderUiLangs(['ko'], weights, 'pt', 4);
		expect(primary.slice(0, 2)).toEqual(['ko', 'pt']);
	});

	// `count` is a floor for the pinned block. Dropping a language the reader
	// told their browser they read is the one thing this ordering exists to
	// stop, so the tier grows instead.
	it('overflows the count rather than folding a browser language away', () => {
		const browser: UiLang[] = ['ko', 'tl', 'vi', 'id', 'hi'];
		const { primary } = orderUiLangs(browser, weights, 'ko', 3);
		expect(primary).toEqual(browser);
	});

	it('never repeats a language the browser named twice over', () => {
		const { primary } = orderUiLangs(['en', 'en'], weights, 'en', 4);
		expect(primary.filter((lang) => lang === 'en')).toHaveLength(1);
	});

	// The panel concatenates the two, so between them they have to BE the list
	// — a leak here silently drops a language from the menu entirely.
	it('partitions UI_LANGS between primary and rest', () => {
		const { primary, rest } = orderUiLangs(['ko', 'tl'], weights, 'hi');
		expect([...primary, ...rest].toSorted()).toEqual([...UI_LANGS].toSorted());
		expect(new Set([...primary, ...rest]).size).toBe(UI_LANGS.length);
	});

	it('leaves the rest in UI_LANGS order', () => {
		const { rest } = orderUiLangs(['ko'], weights, 'ko');
		const positions = rest.map((lang) => UI_LANGS.indexOf(lang));
		expect(positions).toEqual([...positions].sort((a, b) => a - b));
	});
});

describe('readerLangChain', () => {
	it('leads with the interface language, then the browser, then the neighbours', () => {
		expect(readerLangChain('pt', ['pt-BR', 'en-US'])).toEqual(['pt', 'en', 'es', 'la']);
	});

	// The half `CONTENT_LANG_FALLBACK` cannot know. `hu → de` is a good guess
	// about a Hungarian reader and a bad one about this Hungarian reader.
	it('puts a browser language ahead of the table’s guess', () => {
		expect(readerLangChain('hu', ['hu', 'en'])).toEqual(['hu', 'en', 'de', 'la']);
		expect(readerLangChain('hu', [])).toEqual(['hu', 'de', 'en', 'la']);
	});

	it('never demotes the interface language, whatever the browser says', () => {
		expect(readerLangChain('la', ['en-GB', 'fr'])[0]).toBe('la');
	});

	it('names no language twice', () => {
		const chain = readerLangChain('es', ['es-MX', 'pt-BR', 'en']);
		expect(new Set(chain).size).toBe(chain.length);
	});

	// A browser language the corpus has nothing in costs a dead entry and no
	// more — `orderByLangChain` simply never matches it.
	it('keeps a browser language the corpus does not have', () => {
		expect(readerLangChain('en', ['ja-JP'])).toEqual(['en', 'ja', 'la']);
	});

	it('folds a region down to its base language', () => {
		expect(readerLangChain('en', ['pt-BR'])).toContain('pt');
		expect(readerLangChain('en', ['pt-BR'])).not.toContain('pt-br');
	});
});

describe('orderByLangChain', () => {
	const editions = [
		work('ccc.de', 'de'),
		work('ccc.en', 'en'),
		work('ccc.es', 'es'),
		work('ccc.fr', 'fr'),
		work('ccc.la', 'la'),
		work('ccc.pt', 'pt')
	];
	const langs = (list: readonly WorkManifest[]) => list.map((w) => w.language);

	// `pt` → `['es', 'en', 'la']`, so this is the reader's own language, its
	// one real neighbour, and the tail every row ends in.
	it('leads with the reader’s language and its fallback chain', () => {
		expect(langs(orderByLangChain(editions, contentLangChain('pt')))).toEqual([
			'pt',
			'es',
			'en',
			'la',
			'de',
			'fr'
		]);
	});

	// Hungarian has no Catechism, and `hu` → `['de', 'en', 'la']`: the panel
	// leads with what this reader would actually be shown.
	it('leads with the neighbours when the reader’s own language has no edition', () => {
		expect(langs(orderByLangChain(editions, contentLangChain('hu')))).toEqual([
			'de',
			'en',
			'la',
			'es',
			'fr',
			'pt'
		]);
	});

	it('leaves everything off the chain in the order it arrived', () => {
		const shuffled = [work('ccc.fr', 'fr'), work('ccc.de', 'de'), work('ccc.en', 'en')];
		expect(langs(orderByLangChain(shuffled, contentLangChain('en')))).toEqual(['en', 'fr', 'de']);
	});

	// The sort has to be stable, because ties inside one language were already
	// decided by `PREFERRED_EDITION` in `listEditions` and must not be redecided.
	it('keeps two editions of one language in the order they arrived', () => {
		const bibles = [
			work('bible.clementina.la', 'la'),
			work('bible.douay-rheims.en', 'en'),
			work('bible.cpdv.en', 'en')
		];
		expect(orderByLangChain(bibles, contentLangChain('en')).map((w) => w.id)).toEqual([
			'bible.douay-rheims.en',
			'bible.cpdv.en',
			'bible.clementina.la'
		]);
	});

	it('ranks a regional tag by its base language', () => {
		const prayers = [work('prayer.common.pt', 'pt'), work('prayer.common.en-gb', 'en-GB')];
		expect(orderByLangChain(prayers, contentLangChain('en')).map((w) => w.id)).toEqual([
			'prayer.common.en-gb',
			'prayer.common.pt'
		]);
	});

	// The pairing is the product: a Hungarian reader whose browser also names
	// English is offered English before the German the table would have picked.
	it('ranks a menu by the reader chain, browser language included', () => {
		const ranked = orderByLangChain(editions, readerLangChain('hu', ['hu', 'en']));
		expect(ranked.map((w) => w.language)).toEqual(['en', 'de', 'la', 'es', 'fr', 'pt']);
	});

	it('returns a new array rather than sorting its argument', () => {
		const input = [work('ccc.pt', 'pt'), work('ccc.en', 'en')];
		orderByLangChain(input, contentLangChain('en'));
		expect(input.map((w) => w.language)).toEqual(['pt', 'en']);
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
