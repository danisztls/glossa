/**
 * What a language is CALLED, in three tables and one plain module.
 *
 * SPLIT OUT ON 2026-09-04 FOR THE REASON `ui-langs.ts` WAS, and the reason is
 * the whole value of the file. `LANGUAGE_NAMES` lived in `corpus.ts` and
 * `UI_LANG_NAMES` in `menu-filter.ts`; both of those reach `corpus-index.ts`
 * and its `import.meta.glob`, so neither can be imported from Node — which
 * meant the one pass that reads the REAL corpus, `scripts/sync-corpus.mjs`,
 * could not ask whether a corpus language had a name. It could not ask, so
 * nobody asked, and five languages entered the corpus unnamed between
 * 2026-08-31 and 2026-09-04 (`ContentLang` in types.ts tells that story).
 * The check is in the sync now, and this module is what let it exist.
 *
 * `corpus.ts` and `menu-filter.ts` re-export everything here, so no consumer
 * changed and the rule they state is unchanged: a content-language name comes
 * from `LANGUAGE_NAMES`, an interface-language name from `UI_LANG_NAMES`, and
 * the two lists are never derived from each other. They are in one file
 * because they are the same KIND of fact — what a reader would call their own
 * language — not because they are one table.
 *
 * IMPORTS NOTHING, deliberately, exactly as `ui-langs.ts` does: `UiLang` is a
 * type-only import and erases. Anything added here that needs a runtime
 * import from `corpus.ts` belongs back in `corpus.ts`.
 */

import type { UiLang } from './ui-langs';

/** BCP-47 language tag -> bare language subtag, e.g. "pt-PT" -> "pt". */
export function baseLang(tag: string): string {
	return tag.split('-')[0].toLowerCase();
}

/**
 * A content language's own name, written in that language ("Português", not
 * "Portuguese") — same convention LanguageMenu.svelte uses for the UI
 * language switch, and `Latina` is deliberately the same string in both.
 * Keyed on CONTENT language, which is NOT the interface list and must not be
 * derived from it — `mg` has no dictionary and never appears in the language
 * switch (see `ContentLang` in types.ts). An unrecognized tag falls back to
 * the tag itself, which is why a missing entry degrades to "mg" rather than
 * to nothing, and why the Catechism's Malagasy edition named itself in the
 * edition menu as the bare subtag from the day it was ingested: the type
 * union gained the language and this table did not. EVERY TAG IN THAT UNION
 * NEEDS A LINE HERE, and nothing fails when one does not.
 */
const LANGUAGE_NAMES: Record<string, string> = {
	en: 'English',
	pt: 'Português',
	la: 'Latina',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français',
	it: 'Italiano',
	mg: 'Malagasy',
	pl: 'Polski',
	ru: 'Русский',
	ar: 'العربية',
	hu: 'Magyar',
	ro: 'Română',
	sl: 'Slovenščina',
	sv: 'Svenska',
	cs: 'Čeština',
	da: 'Dansk',
	fi: 'Suomi',
	hr: 'Hrvatski',
	lv: 'Latviešu',
	nl: 'Nederlands',
	sk: 'Slovenčina',
	sw: 'Kiswahili',
	vi: 'Tiếng Việt',
	be: 'Беларуская',
	he: 'עברית',
	id: 'Bahasa Indonesia',
	lt: 'Lietuvių',
	sq: 'Shqip',
	uk: 'Українська',
	hi: 'हिन्दी',
	// The two Chinese editions are ONE language in two scripts, and they are
	// named the way the reader of each would name it: Vatican News heads its
	// Simplified section 简体中文 and its Traditional one 繁體中文. Naming both
	// plainly 中文 would be true of each and useless in a menu that prints
	// them one above the other.
	zh: '简体中文',
	zht: '繁體中文'
};

/**
 * A REGIONAL EDITION NAMES ITS REGION; the unmarked one does not.
 * `prayer.common.en-gb` is the UK wording of the five prayers the source
 * prints twice, alongside `prayer.common.en`, which is the collection
 * (docs/decisions.md §Addresses and editions). Only the marked one needs a name here —
 * `en` falls through to `LANGUAGE_NAMES` and stays plain "English", which is
 * what the collection is.
 *
 * Written in the content language's own language, like every other entry
 * here — this one happens to be English already. The region is spelled the
 * way a reader of that edition would name it ("UK"), not by its BCP-47
 * subtag, which is `GB`.
 */
const REGION_NAMES: Record<string, string> = {
	'en-gb': 'English (UK)'
};

export function languageDisplayName(tag: string): string {
	return REGION_NAMES[tag.toLowerCase()] ?? LANGUAGE_NAMES[baseLang(tag)] ?? tag;
}

/**
 * The interface languages, each named in its OWN language.
 *
 * Not translated into the current one: a reader who has landed on the wrong
 * interface language needs to RECOGNIZE their language in the list, and
 * "Portuguese" is no help to someone who only reads Portuguese. That was worth
 * stating with two entries and is the whole usability of the control at the
 * length the list has reached.
 *
 * A `Record<UiLang, …>` AND NOT AN ARRAY, and out here rather than inside
 * `LanguageMenu.svelte`, which is the whole of the fix to what that component
 * used to warn about at length: its `OPTIONS` array was the one copy of
 * `UI_LANGS` no test guarded, and a language missing from it stayed reachable
 * by URL and by browser negotiation while being findable by nobody. Keyed on
 * the union, an omission is now a type error; carrying no order of its own, it
 * has nothing left to disagree with `ui-langs.ts` about.
 *
 * It is NOT `LANGUAGE_NAMES` above — the two sit in one file since
 * 2026-09-04 and that makes the distinction easier to lose, not harder:
 * that table is keyed on CONTENT language and deliberately does not name the
 * reach tier at all. Where the two overlap they agree, and
 * `menu-filter.test.ts` is what says so — it walks `UI_LANGS` and compares
 * every tag `languageDisplayName` has an answer for.
 *
 * `Latina` rather than `Lingua Latina` for the same reason `Deutsch` is not
 * `Deutsche Sprache` — and it is what `LANGUAGE_NAMES` already calls the
 * Clementine's language in the edition menu, which sits two triggers away in
 * the same header.
 */
export const UI_LANG_NAMES: Record<UiLang, string> = {
	en: 'English',
	pt: 'Português',
	la: 'Latina',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français',
	it: 'Italiano',
	mg: 'Malagasy',
	hu: 'Magyar',
	pl: 'Polski',
	ro: 'Română',
	sl: 'Slovenščina',
	sv: 'Svenska',
	ru: 'Русский',
	nl: 'Nederlands',
	da: 'Dansk',
	cs: 'Čeština',
	sk: 'Slovenčina',
	hr: 'Hrvatski',
	fi: 'Suomi',
	lv: 'Latviešu',
	sw: 'Kiswahili',
	vi: 'Tiếng Việt',
	be: 'Беларуская',
	lt: 'Lietuvių',
	sq: 'Shqip',
	tl: 'Tagalog',
	id: 'Bahasa Indonesia',
	ig: 'Igbo',
	uk: 'Українська',
	zh: '简体中文',
	zht: '繁體中文',
	ko: '한국어',
	ml: 'മലയാളം',
	hi: 'हिन्दी',
	ar: 'العربية',
	he: 'עברית'
};
