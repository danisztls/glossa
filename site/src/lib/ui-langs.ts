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
 * AND THE DEBT CAME DUE AGAIN ON 2026-09-04, which is what `lt`, `sq` and
 * `zht` record. Three ingestions since the flip each brought a language with
 * no dictionary, and none of them announced itself: `compendium.lt` (the
 * Compendium's four PDF-only editions), `csdc.sq` (the Compendium of the
 * Social Doctrine, 583 paragraphs, Albanian being the one language
 * vatican.va publishes that work in and nothing else), and
 * `prayer.common.zht` (the curated prayers, from Vatican News). The rule the
 * Malagasy case wrote is the rule that caught them; what was missing was
 * anything that CHECKS it, so `sync-corpus.mjs` now refuses a corpus holding
 * a language this list does not (§The interface superset).
 *
 * `zht` IS VATICAN NEWS'S TAG AND NOT A BCP-47 ONE, AND `zh-Hant` WAS WEIGHED
 * AND REJECTED. Traditional Chinese IS `zh-Hant`, the corpus field is typed
 * `Bcp47`, and `en-GB` is standing proof that this pipeline assigns proper
 * tags rather than echoing a source's URL slug. So the correct-looking answer
 * is to rename it, and the reason not to is not the cost of the rename:
 *
 * A TAG IN THIS CODEBASE IS AN IDENTITY, AND A SUBTAG IS A VARIANT. Every
 * table that matters keys on `baseLang`, which folds `zh-Hant` to `zh` — and
 * folding is the POINT of it, because that is how `prayer.common.en` and
 * `prayer.common.en-gb` are one row in the edition menu with `DEFAULT_REGION`
 * quietly choosing between them. `EditionMenu`'s `pairEditions` makes it
 * literal: it keeps the FIRST edition per base language and drops the rest.
 * Under `zh-Hant`, the Traditional prayers would be a regional variant of the
 * Simplified ones — unofferable in that menu, unnegotiable, chosen for the
 * reader by a default nobody wrote.
 *
 * That is right for English spelling and wrong for a script. `en` and `en-GB`
 * differ in five words; `zh` and `zht` differ in nearly every character, and a
 * reader of one may not read the other comfortably. They are two reading
 * identities here — two dictionaries, two editions, both of which must be
 * selectable and negotiable — and this codebase spells a reading identity as a
 * bare subtag. The alternative to `zht` was not `zh-Hant`; it was `zh-Hant`
 * PLUS a script exception inside `baseLang`, the most-called primitive in the
 * corpus layer, to stop it doing the one thing it exists to do.
 *
 * So the tag stays `zht` INSIDE the app, where it means "an identity of its
 * own", and `bcp47()` below converts it wherever it leaves for a machine to
 * read. BCP-47 has no way to say "these two are peers"; `baseLang` does, and
 * this is what saying it looks like.
 *
 * A DICTIONARY NEED NOT BE COMPLETE (`t()` falls back to English key by key),
 * so adding a language here is not a promise of 245 translated strings. It is
 * a promise of the chrome — `CHROME_KEYS` in scripts/route-titles.mjs is the
 * part the build actually enforces, because an unnamed chrome page breaks the
 * `hreflang` cluster.
 *
 * Ordered as a reader scanning the language menu would want them, which is
 * not the order they were added: English, Portuguese and Latin first because
 * they are what the corpus is in, then the rest by their own names. A new
 * language goes beside the ones it belongs with rather than at the end — `lt`
 * and `sq` close the content block, `zht` sits against `zh` — because the
 * menu falls back to this order for every language the reader's browser and
 * the corpus weights say nothing about (`orderUiLangs`). */
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
	'lt',
	'sq',
	'tl',
	'id',
	'ig',
	'uk',
	'zh',
	'zht',
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
 * The tag as a MACHINE should read it, wherever one leaves this app.
 *
 * Every tag in the two lists above is already a language subtag except `zht`,
 * which is Vatican News's spelling of Traditional Chinese and is not BCP-47 at
 * all (the tag is `zh-Hant`). The docblock above says why the app keeps `zht`
 * as the identity; this is the other half of that bargain, and the half that
 * has to be applied without being forgotten.
 *
 * THE TWO KINDS OF CONSUMER FAIL DIFFERENTLY, AND NEITHER FAILS LOUDLY:
 *
 * - MARKUP. `htmlAttrs` and the `hreflang` alternates in `shell-head.ts`,
 *   `applyDocumentLang` in `i18n.svelte.ts`, the pre-paint block in
 *   `app.html`. An invalid `hreflang` is dropped by the consumer, silently
 *   and per-link, taking one member out of the cluster with nothing to show
 *   for it; an invalid `lang` costs font fallback and hyphenation — which is
 *   why `direction.css` matches `:lang(zh-Hant)` and not `:lang(zht)`. It
 *   matches what is WRITTEN, not what was chosen.
 * - `Intl`. Worse, because it looks handled. A three-letter primary subtag is
 *   the ISO 639-3 shape, so `zht` is structurally valid: `Intl` does not
 *   throw, the `try`/`catch` every one of these calls carries never fires,
 *   and the answer comes back in the browser's default locale. Two call sites
 *   shipped that way — see `i18n.test.ts`, which scans the source for a
 *   `new Intl.*` handed a bare lang, because a convention is not enough here.
 *
 * NOT applied to the URL prefix. `/zht/preces` is an address, not a language
 * declaration, and it is what the corpus, the sitemap and `localStorage`
 * already agree on. A path segment carries no BCP-47 obligation.
 */
const BCP47: Readonly<Record<string, string>> = { zht: 'zh-Hant' };

export function bcp47(tag: string): string {
	return BCP47[tag] ?? tag;
}

/**
 * The variants that fold to a tag of their own rather than to their primary
 * subtag, applied by `browserLangs` before the fold below.
 *
 * `zh-TW` is not `zh` here. The primary-subtag rule is right for the regional
 * pairs it was written for — `pt-BR` and `pt-PT` are one entry in both of this
 * site's lists — and wrong for a script: a reader whose browser asks for
 * `zh-Hant` or `zh-TW` reads a script the Simplified chrome does not print,
 * and folding them together would make `zht` reachable only by opening the
 * language menu and recognizing it. Which is to say the interface and the
 * corpus BOTH separate them, so the negotiation has to as well.
 *
 * Keyed on the full lowercased tag, and Hong Kong and Macau are listed
 * because they are Traditional too. `zh-Hans`, `zh-CN` and `zh-SG` are
 * deliberately absent — they fold to `zh` by the ordinary rule, which is the
 * right answer.
 */
const SCRIPT_VARIANTS: Readonly<Record<string, string>> = {
	'zh-hant': 'zht',
	'zh-tw': 'zht',
	'zh-hk': 'zht',
	'zh-mo': 'zht',
	'zh-hant-tw': 'zht',
	'zh-hant-hk': 'zht',
	'zh-hant-mo': 'zht'
};

/**
 * The browser's language preference list, folded to base tags and deduped.
 *
 * `navigator.languages` is an ORDERED preference list, and until 2026-09-01
 * only its head was ever read — `detectUiLang` in `i18n.svelte.ts` was this
 * loop with a `return` where this one pushes, and is written in terms of it
 * now. The rest of the list is what both pickers lead with: a reader who has
 * told their browser they read Korean and English should not have to look for
 * either of them.
 *
 * Browser tags are normally regional (`pt-BR`, `en-US`) while both of this
 * site's language lists hold one entry per language, so the primary subtag is
 * what survives and `en-GB, en-US` collapses to one entry rather than putting
 * English in the answer twice. `SCRIPT_VARIANTS` is the one exception and is
 * checked first: a script is not a region, and `zh-TW` folded to `zh` would
 * answer a Traditional reader in Simplified.
 *
 * NOT FILTERED AGAINST EITHER LIST, because its two callers filter against
 * DIFFERENT ones — `browserUiLangs` wants the languages there is chrome in,
 * and `EditionMenu` wants the languages there is a text in. Filtering here
 * against `UI_LANGS` and calling it done would have leant on the interface
 * being a superset of the corpus, which is true today and is the one thing
 * `ui-langs.ts`'s own docblock says never to derive from.
 *
 * HERE RATHER THAN IN `i18n.svelte.ts` for the reason this module exists: that
 * one constructs its store at module scope, so importing it reads
 * `localStorage` and instantiates `$state`. Everything about a language tag
 * that is not a store belongs on this side of that line — and this module
 * imports nothing at all, which is what lets the edge worker have it.
 */
export function browserLangs(languages: readonly string[] | undefined): string[] {
	const found: string[] = [];
	for (const language of languages ?? []) {
		const tag = language.trim().toLowerCase();
		const primary = SCRIPT_VARIANTS[tag] ?? tag.split('-', 1)[0] ?? '';
		if (primary && !found.includes(primary)) found.push(primary);
	}
	return found;
}

/** Those of them the interface is available in — what `LanguageMenu` leads
 *  with, and whose head is the language the site negotiates. */
export function browserUiLangs(languages: readonly string[] | undefined): UiLang[] {
	return browserLangs(languages).filter(isUiLang);
}

/**
 * The same list, read off the live `navigator`.
 *
 * The guards are the ones `i18n.svelte.ts`'s `browserLanguage` carried: no
 * `navigator` at all in Node and in the Worker, and `navigator.languages`
 * empty in a few older browsers where `navigator.language` is the whole
 * answer. Kept in ONE place so the language the site negotiates, the languages
 * the language menu leads with, and the languages the edition menus rank by
 * can never come from three different readings.
 */
export function navigatorLangs(): string[] {
	if (typeof navigator === 'undefined') return [];
	return browserLangs(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function navigatorUiLangs(): UiLang[] {
	return navigatorLangs().filter(isUiLang);
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
