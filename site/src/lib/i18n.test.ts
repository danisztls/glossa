import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { detectUiLang, dictionaryFor, isRtl, UI_LANGS } from './i18n.svelte';

describe('detectUiLang', () => {
	it('uses the first supported browser preference', () => {
		expect(detectUiLang(['pt-BR', 'en-US'])).toBe('pt');
		expect(detectUiLang(['en-GB', 'pt-PT'])).toBe('en');
	});

	it('skips unsupported preferences in favour of a later supported one', () => {
		expect(detectUiLang(['sw-KE', 'pt-PT', 'en-US'])).toBe('pt');
	});

	it('falls back to English when there is no supported browser language', () => {
		expect(detectUiLang(['ja-JP', 'ko-KR'])).toBe('en');
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

describe('UI_LANGS and the dictionaries', () => {
	it('has a dictionary for every interface language', () => {
		for (const lang of UI_LANGS) {
			expect(Object.keys(dictionaryFor(lang)).length).toBeGreaterThan(0);
		}
	});

	// Not "every dictionary is complete" — `t()` falls back to English per key
	// on purpose, so a partial translation is a supported state. What must
	// hold is that no translation invents a key English does not have, since
	// such a key is unreachable and always a typo.
	it('declares no key English does not have', () => {
		const known = new Set(Object.keys(dictionaryFor('en')));
		for (const lang of UI_LANGS) {
			for (const key of Object.keys(dictionaryFor(lang))) {
				expect(known, `${lang}: ${key}`).toContain(key);
			}
		}
	});

	// The placeholder is substituted by the caller with `.replace('{lang}',
	// …)`, so a translation that drops or misspells it silently loses the
	// language name from the sentence.
	it('keeps the {lang} placeholder wherever English has one', () => {
		for (const key of ['summa.titleFromEdition', 'summa.noEditionInYourLanguage']) {
			for (const lang of UI_LANGS) {
				const value = dictionaryFor(lang)[key];
				if (value !== undefined) expect(value, `${lang}: ${key}`).toContain('{lang}');
			}
		}
	});

	it('marks Arabic, and only Arabic, as right to left', () => {
		expect(UI_LANGS.filter(isRtl)).toEqual(['ar']);
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
