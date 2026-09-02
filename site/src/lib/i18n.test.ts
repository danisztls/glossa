import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
	browserLangs,
	browserUiLangs,
	detectUiLang,
	dictionaryFor,
	isRtl,
	isUiLang,
	UI_LANGS
} from './i18n.svelte';

describe('detectUiLang', () => {
	it('uses the first supported browser preference', () => {
		expect(detectUiLang(['pt-BR', 'en-US'])).toBe('pt');
		expect(detectUiLang(['en-GB', 'pt-PT'])).toBe('en');
	});

	// PICK A LANGUAGE THIS PROJECT HAS NO PLANS FOR. Every earlier choice here
	// was overtaken by the interface list growing into it — `sw-KE` stood here
	// until Swahili became an interface language on 2026-08-31, and `ko` in the
	// test below has the same fate coming. Icelandic and Estonian are neither
	// corpus languages nor on any reach list.
	it('skips unsupported preferences in favour of a later supported one', () => {
		expect(detectUiLang(['is-IS', 'pt-PT', 'en-US'])).toBe('pt');
	});

	it('falls back to English when there is no supported browser language', () => {
		expect(detectUiLang(['is-IS', 'et-EE'])).toBe('en');
		expect(detectUiLang([])).toBe('en');
		expect(detectUiLang(undefined)).toBe('en');
	});

	it('negotiates the languages added with Magnifica Humanitas', () => {
		expect(detectUiLang(['de-AT'])).toBe('de');
		expect(detectUiLang(['ar'])).toBe('ar');
		expect(detectUiLang(['ja-JP', 'ru-RU', 'en-US'])).toBe('ru');
	});

	// The four the Compendium's editions brought in as content languages
	// before they had dictionaries. Regional tags are the realistic form here
	// — `hu-HU`, `sv-SE` — and are what a reader of the Compendium in one of
	// these will actually be sending.
	it('negotiates the languages added with the Compendium', () => {
		expect(detectUiLang(['hu-HU'])).toBe('hu');
		expect(detectUiLang(['ro-RO'])).toBe('ro');
		expect(detectUiLang(['sl-SI'])).toBe('sl');
		expect(detectUiLang(['sv-SE', 'en-US'])).toBe('sv');
	});

	// No operating system offers Latin as a display language, so this branch
	// is unreachable from a real browser — asserted anyway because the
	// function's contract is about `UI_LANGS`, not about what a browser is
	// likely to send, and a `la` that negotiated to English would mean Latin
	// had fallen out of that list.
	it('negotiates Latin like any other interface language', () => {
		expect(detectUiLang(['la'])).toBe('la');
		expect(detectUiLang(['ja-JP', 'la'])).toBe('la');
	});
});

/**
 * `detectUiLang` is this function's head, which is the point: the language the
 * site negotiates and the languages `LanguageMenu` leads with have to be one
 * reading of `navigator.languages`, not two that can drift apart.
 */
describe('browserUiLangs', () => {
	it('keeps every supported language, in the browser’s order', () => {
		expect(browserUiLangs(['ko-KR', 'en-US', 'pt-BR'])).toEqual(['ko', 'en', 'pt']);
	});

	it('walks past what the interface does not have', () => {
		expect(browserUiLangs(['is-IS', 'et-EE', 'de-AT'])).toEqual(['de']);
	});

	// `en-GB, en-US` is an ordinary browser setting, and the menu offers one
	// row per language — listing English twice would push a real language off
	// the tier.
	it('folds regions together rather than repeating a language', () => {
		expect(browserUiLangs(['en-GB', 'en-US', 'en'])).toEqual(['en']);
	});

	it('answers nothing rather than English when the browser names nothing', () => {
		expect(browserUiLangs([])).toEqual([]);
		expect(browserUiLangs(undefined)).toEqual([]);
		expect(browserUiLangs(['is-IS'])).toEqual([]);
	});

	it('agrees with detectUiLang on the head', () => {
		const languages = ['ja-JP', 'ru-RU', 'en-US'];
		expect(browserUiLangs(languages)[0]).toBe(detectUiLang(languages));
	});
});

/**
 * The unfiltered list under it, which the edition menus rank by: the languages
 * a reader can READ are not the languages there is chrome in, and filtering
 * the one through the other would lean on the interface being a superset of
 * the corpus — true today, and the one relationship this repository refuses to
 * derive from.
 */
describe('browserLangs', () => {
	it('keeps a language the interface does not have', () => {
		expect(browserLangs(['ja-JP', 'en-US'])).toEqual(['ja', 'en']);
	});

	it('is what browserUiLangs filters', () => {
		const languages = ['ja-JP', 'is-IS', 'pt-BR', 'en-US'];
		expect(browserUiLangs(languages)).toEqual(browserLangs(languages).filter(isUiLang));
	});

	it('folds regions and drops repeats', () => {
		expect(browserLangs(['en-GB', 'en-US', 'EN'])).toEqual(['en']);
	});

	it('answers nothing for nothing', () => {
		expect(browserLangs(undefined)).toEqual([]);
		expect(browserLangs([' '])).toEqual([]);
	});
});

describe('UI_LANGS and the dictionaries', () => {
	it('has a dictionary for every interface language', async () => {
		for (const lang of UI_LANGS) {
			expect(Object.keys(await dictionaryFor(lang)).length).toBeGreaterThan(0);
		}
	});

	// Not "every dictionary is complete" — `t()` falls back to English per key
	// on purpose, so a partial translation is a supported state. What must
	// hold is that no translation invents a key English does not have, since
	// such a key is unreachable and always a typo.
	it('declares no key English does not have', async () => {
		const known = new Set(Object.keys(await dictionaryFor('en')));
		for (const lang of UI_LANGS) {
			for (const key of Object.keys(await dictionaryFor(lang))) {
				expect(known, `${lang}: ${key}`).toContain(key);
			}
		}
	});

	// Every placeholder is substituted by the caller with `.replace('{x}', …)`,
	// so a translation that drops or misspells one silently loses the word it
	// stood for — a sentence with no language name in it, or a plate's control
	// labelled "Enlarge" with nothing said about which plate.
	it('keeps each placeholder wherever English has one', async () => {
		const placeholders: Record<string, string> = {
			'summa.titleFromEdition': '{lang}',
			'summa.noEditionInYourLanguage': '{lang}',
			'plates.enlarge': '{title}'
		};
		for (const [key, placeholder] of Object.entries(placeholders)) {
			expect((await dictionaryFor('en'))[key], `en: ${key}`).toContain(placeholder);
			for (const lang of UI_LANGS) {
				const value = (await dictionaryFor(lang))[key];
				if (value !== undefined) expect(value, `${lang}: ${key}`).toContain(placeholder);
			}
		}
	});

	// Hebrew joined Arabic on 2026-08-31. The assertion is deliberately the
	// whole set rather than a membership check: `app.html` carries its own
	// copy of this list for the pre-paint `dir`, and the failure mode of a
	// missed entry there is a page that paints one way and flips at
	// hydration.
	it('marks Arabic and Hebrew, and only those, as right to left', () => {
		expect(UI_LANGS.filter(isRtl)).toEqual(['ar', 'he']);
	});

	// app.html negotiates the language a second time, before hydration and
	// before any module has loaded, so it carries its own copy of this list
	// (see the comment above it there). A copy that has fallen behind shows
	// as a flash of the wrong language on a first paint and nothing worse,
	// which is exactly the kind of drift nobody notices by looking.
	it('keeps the pre-hydration list in app.html equal to UI_LANGS', () => {
		const html = readFileSync(path.join(process.cwd(), 'src/app.html'), 'utf8');
		const declared = /var UI = \[([^\]]*)\]/.exec(html)?.[1];
		expect(declared, 'no `var UI = [...]` found in src/app.html').toBeDefined();
		const tags = [...(declared ?? '').matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
		expect(tags).toEqual([...UI_LANGS]);
	});
});
