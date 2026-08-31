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
 * The languages the INTERFACE is available in.
 *
 * Read this list and `ContentLang` in types.ts as two answers to two
 * questions — what the chrome is written in, and what the corpus holds — and
 * never derive one from the other. They have equalized and separated four
 * times since 2026-08-24, each time because one of them moved on its own
 * schedule: a content language arrives when someone ingests a text, an
 * interface language when someone writes a dictionary.
 *
 * MALAGASY IS WHY THAT RULE FINALLY COST SOMETHING, and closing it on
 * 2026-08-31 is what this list records. `ccc.mg` — the whole Catechism, 2,865
 * paragraphs — had been in the corpus since 2026-08-26 with its readers
 * inside English chrome, and it was not alone: ELEVEN other content languages
 * had no dictionary either, several of them larger. Byelorussian had 31
 * editions and no chrome while Swedish had one edition and a complete
 * dictionary, which is the clearest statement of what the old list actually
 * tracked — who happened to write a dictionary, not what the corpus is in.
 *
 * So the rule now runs the other way: THE INTERFACE IS A SUPERSET OF THE
 * CORPUS. A content language is owed a dictionary, and the debt is paid here
 * rather than argued about in a comment. What that does NOT mean is that the
 * two lists may be conflated — this one is deliberately wider, because of:
 *
 * THE REACH TIER: interface languages the corpus has no content in at all.
 * They were already here by accident — the seven that arrived with Magnifica
 * Humanitas are languages the corpus holds exactly one work in — and they are
 * here on purpose now, chosen by Catholic population rather than by what has
 * been ingested. The Philippines is the third-largest Catholic country in the
 * world and Tagalog was the only top-ten language with no interface. A reader
 * in one of these gets their own chrome and English content through
 * `CONTENT_LANG_FALLBACK`, which is the honest state of it: the alternative
 * is not better content, it is the same content behind a language they do not
 * read.
 *
 * Latin sits in neither camp and is the reason the old exclusion was wrong:
 * it was left out on the grounds that nobody wants the chrome in it, which
 * was an assumption about readers rather than a fact about the corpus. The
 * canonical URLs are Latin, the Summa's division names are Latin in every
 * dictionary here, and a reader who came for the Clementine is the last
 * reader who needs `Caput sequens` glossed.
 *
 * A DICTIONARY NEED NOT BE COMPLETE (`t()` falls back to English key by key),
 * so adding a language here is not a promise of 245 translated strings. It is
 * a promise of the chrome — `CHROME_KEYS` in scripts/route-titles.mjs is the
 * part the build actually enforces, because an unnamed chrome page breaks the
 * `hreflang` cluster.
 *
 * Ordered as a reader scanning the language menu would want them, which is
 * not the order they were added: English, Portuguese and Latin first because
 * they are what the corpus is in, then the rest by their own names. */
export const UI_LANGS = [
	'en',
	'pt',
	'la',
	'de',
	'es',
	'fr',
	'it',
	'mg',
	'hu',
	'pl',
	'ro',
	'sl',
	'sv',
	'ru',
	'nl',
	'da',
	'cs',
	'sk',
	'hr',
	'fi',
	'lv',
	'sw',
	'vi',
	'be',
	'tl',
	'id',
	'ig',
	'uk',
	'zh',
	'ko',
	'ml',
	'hi',
	'ar',
	'he'
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
export const RTL_LANGS: readonly UiLang[] = ['ar', 'he'];

export function isRtl(lang: UiLang): boolean {
	return RTL_LANGS.includes(lang);
}
