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
import { baseLang, contentLangChain } from './corpus';
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
 *
 * It is a FLOOR and not a ceiling, because the reader's own languages come
 * first and are never folded away: see `orderUiLangs`.
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
 * The interface languages in the order the menu lists them, cut at the fold.
 *
 * THE READER'S OWN LANGUAGES LEAD, IN THE BROWSER'S OWN ORDER.
 * `navigator.languages` is an ordered preference list the reader configured
 * themselves, and the site has been reading it since before first paint —
 * `app.html` negotiates the chrome out of it — while the menu went on offering
 * a ranking of the corpus. A Korean reader already IN Korean chrome had to
 * open "+ more" to find Korean, because the corpus holds nothing in it. That
 * is the ranking answering a question nobody asked: which languages this site
 * is written in, rather than which languages this reader reads.
 *
 * CORPUS WEIGHT IS NOW THE FILLER, and it is unchanged in what it does — it
 * tops the tier up to `count` from the languages the corpus holds most
 * editions in. A reader who has told their browser about one language still
 * sees eleven more, and they are the eleven most likely to have something in
 * them. What it no longer does is outrank the reader.
 *
 * `count` IS A FLOOR FOR THE PINNED BLOCK, NOT A CEILING. A reader with six
 * browser languages sees all six, because hiding a language the reader has
 * explicitly said they read is the single thing this ordering exists to stop.
 *
 * WHY THIS DOES NOT BREAK THE STABILITY RULE the corpus ranking is subject to.
 * That rule — membership may move, sequence may not, so a reader never has to
 * re-find a language whose position they had learned — is about a value that
 * changes UNDER the reader: corpus weight moves on every deploy, and would
 * shuffle the panel for someone who changed nothing. `navigator.languages` is
 * that reader's own setting. The order it produces is fixed for them and
 * differs only between them, which is the same kind of fact as which language
 * the chrome is already in. Everything below the pinned block is still in
 * `UI_LANGS` order, for exactly the old reason.
 *
 * `current` is pinned beside them even when it is nowhere near the top,
 * because the one row this panel must never hide is the one with the tick on
 * it — a reader who picked a language by hand has said more about it than any
 * ranking can.
 */
export function orderUiLangs(
	browser: readonly UiLang[],
	weights: Map<string, number>,
	current: UiLang,
	count = PRIMARY_UI_LANG_COUNT
): { primary: UiLang[]; rest: UiLang[] } {
	const pinned = [...new Set<UiLang>([...browser, current])];
	const filler = [...UI_LANGS]
		.map((lang, index) => ({ lang, index, weight: weights.get(lang) ?? 0 }))
		.filter((entry) => !pinned.includes(entry.lang))
		// Ties by `UI_LANGS` position, so a corpus that holds nothing at all
		// (the test fixtures, a site built without one) still yields a stable
		// tier rather than whatever `sort` happens to do with equal keys.
		.sort((a, b) => b.weight - a.weight || a.index - b.index)
		.slice(0, Math.max(0, count - pinned.length))
		.map((entry) => entry.lang);
	const shown = new Set<UiLang>(filler);
	const primary = [...pinned, ...UI_LANGS.filter((lang) => shown.has(lang))];
	const inPrimary = new Set<UiLang>(primary);
	return { primary, rest: UI_LANGS.filter((lang) => !inPrimary.has(lang)) };
}

/**
 * The content languages this reader is likeliest to want, in order.
 *
 * THREE SOURCES, AND THE ORDER BETWEEN THEM IS THE WHOLE DECISION:
 *
 * 1. **The interface language.** Either the reader chose it by hand, which is
 *    the strongest statement anyone makes on this site, or it was negotiated
 *    off the head of the browser's own list — so it outranks that list either
 *    way and can never contradict it.
 * 2. **The rest of the browser's languages**, in the reader's own order. This
 *    is the half `contentLangChain` alone could not know: a Hungarian reader
 *    whose browser also names English is asking for English before German,
 *    and the fallback table can only ever answer with German, because it is a
 *    statement about languages rather than about people.
 * 3. **The fallback chain's neighbours** — `CONTENT_LANG_FALLBACK`, which is
 *    what remains when the reader has told us nothing else. `hu → de` is a
 *    good guess about a Hungarian reader and a bad one about the Hungarian
 *    reader who reads English.
 *
 * `browser` IS THE RAW BROWSER LIST, not `browserUiLangs`. Filtering it
 * through `UI_LANGS` first would be filtering the languages someone can READ
 * through the languages we have CHROME in — two lists this repository keeps
 * apart on purpose. It happens to lose nothing today, and that is exactly the
 * kind of coincidence that stops being true without anything failing.
 *
 * WHAT THIS DOES NOT DO IS DECIDE WHAT RENDERS. `editionInLang` still resolves
 * the default edition through `CONTENT_LANG_FALLBACK` alone, so on a work with
 * no edition in the interface language the top row of the menu and the column
 * on the page can name different languages — the tick says which one is
 * showing. Ranking a panel is a suggestion and can be reader-shaped; choosing
 * the text a citation resolves to is not, and is deliberately left keyed to
 * the language alone.
 */
export function readerLangChain(uiLang: string, browser: readonly string[]): string[] {
	const [own, ...neighbours] = contentLangChain(uiLang);
	return [...new Set([own, ...browser.map(baseLang), ...neighbours])];
}

/**
 * Editions in the order the reader in front of them can read: their own
 * content language first, then its neighbours, then everything else.
 *
 * `chain` is `contentLangChain(lang)` — `CONTENT_LANG_FALLBACK`, the same
 * table that decides which edition a page actually RENDERS. That is the whole
 * argument for using it here rather than inventing a second notion of
 * nearness: the top of the menu becomes the editions this reader can read, in
 * the order the site itself would have chosen one of them. The chain is used
 * whole, `en`/`la` tail included, so those float for every reader — which is
 * the site's own answer to what a reader falls through to, printed rather than
 * hidden.
 *
 * `suggest.ts`'s `orderedBibleWorkIds` is this comparator with a Bible-shaped
 * tie-break on top (`PREFERRED_EDITION`), and its docblock is where the
 * reasoning was first written down. It is left where it is: it ranks work IDS
 * for a matcher, this ranks MANIFESTS for a panel, and the one thing they
 * share is the two-line rank below.
 *
 * THE SORT IS STABLE AND THAT IS LOAD-BEARING. Everything reaching this is
 * already sorted — `listEditions` by language, then default region, then id —
 * so ties inside one language keep an answer that was decided deliberately
 * elsewhere. The Bible's two English editions must stay in `PREFERRED_EDITION`
 * order, and re-deciding it here would be a second place for it to be true.
 */
export function orderByLangChain<T extends { language: string }>(
	editions: readonly T[],
	chain: readonly string[]
): T[] {
	const rank = (edition: T) => {
		const position = chain.indexOf(baseLang(edition.language));
		return position === -1 ? chain.length : position;
	};
	return [...editions].sort((a, b) => rank(a) - rank(b));
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
