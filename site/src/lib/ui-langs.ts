/**
 * The interface languages, and the two questions anyone asks about a tag.
 *
 * A PLAIN MODULE, SPLIT OUT OF `i18n.svelte.ts` on 2026-08-28, because three
 * consumers now need `isUiLang` and none of them can import that file: the
 * edge worker (`shell-head.ts`), the route grammar it shares with the client
 * (`route-manifest.ts`), and the build scripts that generate the sitemap and
 * the titles table. `i18n.svelte.ts` constructs its store at module scope, so
 * importing it reads `localStorage` and instantiates `$state` — neither of
 * which exists in a Worker or in Node. It re-exports everything here, so
 * CLAUDE.md's rule stands unchanged: use `isUiLang`/`UI_LANGS`, never a
 * literal list.
 */

/**
 * The languages the INTERFACE is available in — fourteen tags against
 * `ContentLang`'s fifteen in types.ts, and the gap is `mg`. Inequality is
 * the normal state of these two lists, not a defect in either: they held the
 * same ten on 2026-08-24, separated the next day when the Compendium's ten
 * editions brought in four languages with no dictionary, drew level again
 * when those dictionaries were written, and separated once more on
 * 2026-08-26 when the Catechism landed Malagasy. It will keep moving that
 * way, a language at a time. Do not derive one list from the other.
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
