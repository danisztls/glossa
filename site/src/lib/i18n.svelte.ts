/**
 * UI string dictionary.
 *
 * UI language now DRIVES content language (reversing the original "the URL
 * carries content choice, setting carries UI language" decision recorded in
 * docs/decisions.md — see the entry this change adds there). Switching this
 * switches both the site's chrome AND, by default, which edition of the
 * Bible/CCC/Compendium is shown (see `$lib/content.svelte.ts`). A reader who
 * wants to read a different edition than their interface language implies
 * still can — the edition/version selector lets them override it — but that
 * override is scoped to the UI language it was made under, so changing the
 * interface language changes the content language too unless the reader
 * re-picks an edition after switching.
 */

import { readStoredString, writeStoredString } from './storage';

/**
 * The languages the INTERFACE is available in — as of 2026-08-25 again the
 * same set as `ContentLang` in types.ts, fourteen tags on both sides. That
 * equality is a fact about today, not an invariant: it held on 2026-08-24,
 * broke the next day when the Compendium's ten editions brought in four
 * languages with no dictionary, and is restored here by writing them. It
 * will break again the same way. Do not derive one list from the other.
 *
 * LATIN WAS THE ONE CONTENT LANGUAGE THIS LIST DELIBERATELY EXCLUDED, on the
 * grounds that it is a language readers want the TEXT in and nobody wants
 * the chrome in. That was an assumption about readers, not a fact about the
 * corpus, and it does not survive contact with what this site is: the
 * canonical URLs are Latin, the Summa's division names are Latin in every
 * dictionary here, and a reader who came for the Clementine and the Corpus
 * Thomisticum is the last reader who needs `Caput sequens` glossed. So the
 * asymmetry is gone, and with it the special case it was holding up in
 * `content.svelte.ts` (see `#stillApplies` there, and docs/decisions.md).
 *
 * The seven added earlier on 2026-08-24 point the other way — they are
 * interface languages the corpus has almost no content in. Magnifica
 * Humanitas is published in all nine and is, so far, the only work that is;
 * a reader who picks Italian gets Italian chrome and, for every other work,
 * the English text through `CONTENT_LANG_FALLBACK`. That is the honest state
 * of it rather than a defect to hide: the alternative is a reader who can
 * read the encyclical in their own language having to navigate to it in
 * someone else's. Latin is the opposite case and the reason it belongs here
 * — the corpus carries two whole works in it.
 *
 * HUNGARIAN, ROMANIAN, SLOVENIAN AND SWEDISH ARE NEITHER CASE. They arrived
 * as content languages with a whole work each — the Compendium, all 598
 * questions — and a reader who came for it was reading it inside English
 * chrome, which is the one combination this list should never leave standing:
 * not a language the corpus barely reaches (the Magnifica Humanitas seven),
 * where English chrome around English content is at least consistent, but a
 * complete work in the reader's own language wrapped in someone else's
 * interface. Russian is the remaining asymmetry and points the other way: a
 * dictionary since Magnifica Humanitas, and a Compendium that exists only as
 * a PDF nothing parses.
 *
 * Ordered as a reader scanning the language menu would want them, which is
 * not the order they were added: English, Portuguese and Latin first because
 * they are what the corpus is in, then the rest by their own names.
 */
export const UI_LANGS = [
	'en',
	'pt',
	'la',
	'de',
	'es',
	'fr',
	'it',
	'hu',
	'pl',
	'ro',
	'sl',
	'sv',
	'ru',
	'ar'
] as const;

export type UiLang = (typeof UI_LANGS)[number];

export function isUiLang(tag: string): tag is UiLang {
	return (UI_LANGS as readonly string[]).includes(tag);
}

/**
 * The interface languages written right to left.
 *
 * A list rather than a lookup against `Intl`, which has no stable API for
 * this: `Intl.Locale.prototype.getTextInfo` is recent, unevenly shipped, and
 * would be an awkward dependency for a question whose answer is one entry
 * long and changes about once a decade.
 */
export const RTL_LANGS: readonly UiLang[] = ['ar'];

export function isRtl(lang: UiLang): boolean {
	return RTL_LANGS.includes(lang);
}

/**
 * Put the chosen language on the document element, where CSS and the browser
 * can see it.
 *
 * `lang` drives hyphenation, quote marks and font fallback; `dir` flips the
 * whole layout, which the stylesheet is written for in logical properties
 * (`margin-inline-start`, not `margin-left`) so that one attribute is all it
 * takes. app.html sets both before first paint for the reader's stored or
 * negotiated choice; this is what keeps them right when the choice changes,
 * which nothing did while the only two options were both left-to-right.
 */
function applyDocumentLang(lang: UiLang): void {
	if (typeof document === 'undefined') return;
	document.documentElement.lang = lang;
	document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
}

const STORAGE_KEY = 'glossa:ui-lang';
const DEFAULT_LANG: UiLang = 'en';

export type Dictionary = Record<string, string>;

import { ar } from './i18n/ar';
import { de } from './i18n/de';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { fr } from './i18n/fr';
import { hu } from './i18n/hu';
import { it } from './i18n/it';
import { la } from './i18n/la';
import { pl } from './i18n/pl';
import { pt } from './i18n/pt';
import { ro } from './i18n/ro';
import { ru } from './i18n/ru';
import { sl } from './i18n/sl';
import { sv } from './i18n/sv';

/**
 * One module per language under `./i18n/`. A dictionary need not be complete
 * — `t()` falls back to English key by key — so a language can ship with the
 * chrome translated and a long colophon still in English, which is better
 * than shipping it with a machine translation of a page about how carefully
 * this site handles other people's words.
 */
const dictionaries: Record<UiLang, Dictionary> = {
	en,
	pt,
	la,
	de,
	es,
	fr,
	it,
	hu,
	pl,
	ro,
	sl,
	sv,
	ru,
	ar
};

/** One language's dictionary. Exported for the tests that check them all. */
export function dictionaryFor(lang: UiLang): Dictionary {
	return dictionaries[lang];
}

function readStored(): UiLang | null {
	const value = readStoredString(STORAGE_KEY);
	return value != null && isUiLang(value) ? value : null;
}

/**
 * Pick the first browser-preferred language that the interface supports.
 *
 * Browser locale tags are normally regional (`pt-BR`, `en-US`, `de-AT`) while
 * the interface has one locale per language. Matching the primary subtag
 * gives every variant the right UI without pretending that we have separate
 * regional translations. Unknown locales fall back to English, the site's
 * existing no-preference default.
 *
 * Latin is negotiable here like any other — `la` in `navigator.languages`
 * gets a Latin interface — but no operating system offers it as a display
 * language, so in practice it is reached by choosing it in the menu. That is
 * not a gap: nothing about this function needs to know which of its answers
 * a browser will actually ask for.
 */
export function detectUiLang(languages: readonly string[] | undefined): UiLang {
	for (const language of languages ?? []) {
		const primary = language.trim().toLowerCase().split('-', 1)[0] ?? '';
		if (isUiLang(primary)) return primary;
	}
	return DEFAULT_LANG;
}

function browserLanguage(): UiLang {
	if (typeof navigator === 'undefined') return DEFAULT_LANG;
	const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
	return detectUiLang(languages);
}

/**
 * A saved choice is always authoritative. Only a reader with no valid saved
 * choice is language-negotiated, and that initial result is saved so later
 * visits remain stable even if the browser's language list changes.
 */
function initialLang(): UiLang {
	const stored = readStored();
	if (stored) return stored;

	const detected = browserLanguage();
	writeStoredString(STORAGE_KEY, detected);
	return detected;
}

class I18nStore {
	lang: UiLang = $state(initialLang());

	constructor() {
		// app.html already ran the same negotiation before first paint, but
		// only for the two attributes it can set from a script; re-applying
		// here keeps the store the single authority on what the document says
		// it is, including after a language whose script it did not know.
		applyDocumentLang(this.lang);
	}

	set(lang: UiLang) {
		this.lang = lang;
		writeStoredString(STORAGE_KEY, lang);
		applyDocumentLang(lang);
	}

	/** Whether the interface is currently reading right to left. */
	get rtl(): boolean {
		return isRtl(this.lang);
	}

	t(key: string): string {
		return dictionaries[this.lang][key] ?? dictionaries.en[key] ?? key;
	}
}

export const i18n = new I18nStore();

/** Convenience helper, reactive when called from within a component. */
export function t(key: string): string {
	return i18n.t(key);
}
