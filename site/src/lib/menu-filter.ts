/**
 * The two dropdowns that outgrew being a list, and what they filter on.
 *
 * `LanguageMenu` offers thirty-four interface languages and `EditionMenu`
 * offers up to twenty-four editions of a work; both were written when the
 * numbers were two and three, and both are now panels a reader scrolls
 * looking for something they can already name. A search box is the answer to
 * that, and this module holds the parts of it that are decisions rather than
 * markup — the haystacks, the threshold, and the language menu's fold.
 *
 * MATCHING IS `matchesQuery`, NOT A FRESH IDEA OF IT. `highlight.ts` states
 * the rule and the reason: a matcher written beside a marker drifts within a
 * week, and the drift shows up as a row with no visible reason for being
 * there. These menus do not mark their hits — a language name is one word and
 * a highlight on it says nothing the row does not — but they inherit the fold,
 * which is the part that matters here: the same `foldWithMap` that lets
 * `/documenta` find "Redemptor" from "redemptor" is what lets `Ceština` be
 * found by typing `cestina`, and `Tiếng Việt` by typing `tieng viet`. Every
 * language in this menu whose name a reader cannot type is a language they
 * would otherwise have to scroll for.
 */
import { baseLang } from './corpus';
import { UI_LANGS, type UiLang } from './ui-langs';
import type { WorkManifest } from './types';

/**
 * The interface languages, each named in its OWN language.
 *
 * Not translated into the current one: a reader who has landed on the wrong
 * interface language needs to RECOGNIZE their language in the list, and
 * "Portuguese" is no help to someone who only reads Portuguese. That was worth
 * stating with two entries and is the whole usability of the control at
 * thirty-four.
 *
 * A `Record<UiLang, …>` AND NOT AN ARRAY, and out here rather than inside
 * `LanguageMenu.svelte`, which is the whole of the fix to what that component
 * used to warn about at length: its `OPTIONS` array was the one copy of
 * `UI_LANGS` no test guarded, and a language missing from it stayed reachable
 * by URL and by browser negotiation while being findable by nobody. Keyed on
 * the union, an omission is now a type error; carrying no order of its own, it
 * has nothing left to disagree with `ui-langs.ts` about.
 *
 * It is NOT `corpus.ts`'s `LANGUAGE_NAMES`, which would be the obvious source:
 * that table is keyed on CONTENT language and deliberately does not name the
 * reach tier, which is eight of these thirty-four. Where the two overlap they
 * agree, and the test beside this file is what says so.
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
	tl: 'Tagalog',
	id: 'Bahasa Indonesia',
	ig: 'Igbo',
	uk: 'Українська',
	zh: '中文',
	ko: '한국어',
	ml: 'മലയാളം',
	hi: 'हिन्दी',
	ar: 'العربية',
	he: 'עברית'
};

/**
 * Below this many rows a panel is a list and a search box is furniture.
 *
 * Eight is where the shared `.menu-panel`'s `max-height: min(24rem, 70vh)`
 * stops holding the whole list on a phone, which is the point at which a
 * reader has to scroll to find out what is on offer. It leaves the Bible's
 * three editions and the Summa's two alone, and reaches the Catechism's
 * eight, the Compendium's ten, the `/catechismus` pair's twelve and the
 * prayers' twenty-four.
 */
export const FILTER_MIN_ROWS = 8;

/**
 * How many interface languages the language menu shows before "+ more".
 *
 * Twelve is six rows of the panel's two-column grid — about what fitted
 * before the list tripled on 2026-08-31, and what the two-column layout was
 * introduced to hold.
 */
export const PRIMARY_UI_LANG_COUNT = 12;

/**
 * How much of the corpus is written in each language, by edition count.
 *
 * Keyed by base language, so `en` and `en-gb` are one entry — the menu offers
 * a language, not a region.
 */
export function langWeights(works: readonly WorkManifest[]): Map<string, number> {
	const weights = new Map<string, number>();
	for (const work of works) {
		const lang = baseLang(work.language);
		weights.set(lang, (weights.get(lang) ?? 0) + 1);
	}
	return weights;
}

/**
 * The interface languages shown above the fold, in `UI_LANGS` order.
 *
 * THE TIER IS DERIVED FROM THE CORPUS, not from an editorial list, and the
 * criterion is the one this site can actually defend: the first tier is the
 * languages it is WRITTEN IN, most-published first. That answers the question
 * "which of thirty-four is a reader most likely to want" with a fact rather
 * than with a ranking of nations, it needs no maintenance — ingest thirty
 * Byelorussian editions and Byelorussian rises on its own — and it puts the
 * reach tier (`tl`, `zh`, `ko`, `id`, `ig`, `uk`, `ml`, `hi`, which the corpus
 * holds nothing in) below the fold, which is the honest place for a language
 * whose reader will be served English content either way.
 *
 * BURYING THE REACH TIER COSTS LESS THAN IT LOOKS, because the menu is not how
 * those readers arrive. `app.html` negotiates against `navigator.languages`
 * before any module runs, so a Filipino reader opens the site already in
 * Tagalog — and the current language is always in this tier, so they never
 * meet it hidden. The menu is for a reader CHANGING language, and one who is
 * changing to a language the corpus has nothing in has typed its name.
 *
 * ORDER IS `UI_LANGS`'S, NOT THE WEIGHT'S. The same argument the subject cloud
 * makes for staying alphabetical: membership moves with the corpus, so if the
 * sequence moved as well a reader would have to re-find a language they had
 * already learned the position of. Weight decides who is in; the list decides
 * where.
 *
 * `current` is always included even when it is nowhere near the top, because
 * the one row this panel must never hide is the one with the tick on it.
 */
export function primaryUiLangs(
	weights: Map<string, number>,
	current: UiLang,
	count = PRIMARY_UI_LANG_COUNT
): UiLang[] {
	const ranked = [...UI_LANGS]
		.map((lang, index) => ({ lang, index, weight: weights.get(lang) ?? 0 }))
		// Ties by `UI_LANGS` position, so a corpus that holds nothing at all
		// (the test fixtures, a site built without one) still yields a stable
		// tier rather than whatever `sort` happens to do with equal keys.
		.sort((a, b) => b.weight - a.weight || a.index - b.index)
		.slice(0, count)
		.map((entry) => entry.lang);
	const shown = new Set<UiLang>(ranked);
	shown.add(current);
	return UI_LANGS.filter((lang) => shown.has(lang));
}

/**
 * Everything about an interface language the search box reads, newline-joined.
 *
 * Three surfaces, because a reader looking for German may know it as
 * `Deutsch`, as `DE`, or — reading the interface in their own language — as
 * "German"/"alemão". The third comes from `Intl.DisplayNames`, which is the
 * only one of the three nobody here has to maintain: a table of thirty-four
 * language names in thirty-four languages is 1,156 strings for a search box.
 *
 * It is wrapped because it is the one part that can fail. `Intl.DisplayNames`
 * is old enough to rely on, but a runtime missing it, or a tag it declines to
 * name, must cost the reader the third surface and nothing else — the native
 * name and the code are always there.
 */
export function uiLangSearchText(lang: UiLang, nativeName: string, inLang: string): string {
	return [lang, nativeName, displayName(lang, inLang)].filter(Boolean).join('\n');
}

function displayName(lang: UiLang, inLang: string): string {
	try {
		return new Intl.DisplayNames([inLang, 'en'], { type: 'language' }).of(lang) ?? '';
	} catch {
		return '';
	}
}

/**
 * Everything about an edition the search box reads, newline-joined.
 *
 * The language name is what a reader types into this box nine times in ten —
 * every menu but the Bible's is a language switch wearing an edition's clothes
 * — but the titles are here because the Bible's is not: `bible.douay-rheims.en`
 * and `bible.cpdv.en` are both "English", and the only thing that tells them
 * apart is the title the panel is already printing.
 */
export function editionSearchText(edition: WorkManifest, languageName: string): string {
	return [edition.language, languageName, edition.title, edition.short_title]
		.filter(Boolean)
		.join('\n');
}
