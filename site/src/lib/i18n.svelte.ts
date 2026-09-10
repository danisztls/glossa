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

import { CALENDAR_PAGES } from './calendar/national/languages.ts';
import { parseCalendarPath } from './route-manifest.ts';
import {
	readSessionString,
	readStoredString,
	writeSessionString,
	writeStoredString
} from './storage';

/**
 * The interface languages. See `./ui-langs.ts` for the list itself and for why
 * it is a separate module; re-exported here because this is where the rest of
 * the app already reaches for them, and a second import path would be a second
 * answer to the same question.
 */
import {
	UI_LANGS,
	RTL_LANGS,
	isUiLang,
	isRtl,
	bcp47,
	browserLangs,
	browserUiLangs,
	navigatorLangs,
	navigatorUiLangs,
	type UiLang
} from './ui-langs.ts';

export {
	UI_LANGS,
	RTL_LANGS,
	isUiLang,
	isRtl,
	bcp47,
	browserLangs,
	browserUiLangs,
	navigatorLangs,
	navigatorUiLangs,
	type UiLang
};

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
	// `bcp47`, because this attribute is read by the browser and not by us:
	// `zht` is Vatican News's tag for Traditional Chinese and not a language
	// tag at all, and `lang` is the input to font fallback, hyphenation and
	// quote marks. `direction.css` matches `:lang(zh-Hant)` accordingly.
	document.documentElement.lang = bcp47(lang);
	document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
}

const STORAGE_KEY = 'glossa:ui-lang';
/** Session-scoped, and `storage.ts` says why. Read by `app.html`'s pre-paint
 *  block and by `sw.svelte.ts` too — both by name, so it moves with them. */
const HELD_KEY = 'glossa:ui-lang-session';
const DEFAULT_LANG: UiLang = 'en';

export type Dictionary = Record<string, string>;

/**
 * ENGLISH IS THE ONLY DICTIONARY IN THE BOOT CHUNK, and every other one is a
 * chunk of its own, fetched when a reader actually chooses that language.
 *
 * It was fourteen static imports until 2026-08-31, which compiled to ONE
 * 215 KB (65 KB gzipped) chunk that `nodes/0.js` — the root layout, and so
 * every route — imported synchronously. Every reader downloaded all fourteen
 * to read one. That was tolerable at fourteen and is not at thirty-odd: the
 * list is now a superset of the corpus plus a reach tier, and the cost of a
 * language has to be paid by the reader who picks it, not by everyone. This
 * is the same accounting `JumpBox` does for `fuzzysort` (7.5 KB, lazily
 * imported on open) and the content tier does for the corpus itself.
 *
 * English stays static because `t()` falls back to it key by key and must be
 * able to do so synchronously, on the first render, before any await.
 */
import { en } from './i18n/en';

/**
 * One module per language under `./i18n/`. A dictionary need not be complete
 * — `t()` falls back to English key by key — so a language can ship with the
 * chrome translated and a long colophon still in English, which is better
 * than shipping it with a machine translation of a page about how carefully
 * this site handles other people's words.
 *
 * `import.meta.glob` and not a hand-written map of `() => import(...)`: the
 * glob is the idiom already used for the content tier (`content-urls.ts`,
 * `corpus-assets.ts`), it is statically analyzable so Vite emits one chunk per
 * file, and — the part that matters for maintenance — a new dictionary is
 * picked up by dropping the file in. This module is therefore NOT one of the
 * places a new interface language has to be added, and there is no list here
 * to drift from `UI_LANGS`.
 *
 * A template literal (`import(\`./i18n/${lang}.ts\`)`) would defeat this: Vite
 * cannot analyze it, and would fold every dictionary back into one graph.
 *
 * ENGLISH IS EXCLUDED BY THE SECOND PATTERN, and the exclusion is what makes
 * the first one work. `en.ts` is statically imported above, so a glob that also
 * matched it asked the bundler for two incompatible placements of one module —
 * answered with `[INEFFECTIVE_DYNAMIC_IMPORT] src/lib/i18n/en.ts is dynamically
 * imported ... but also statically imported ... dynamic import will not move
 * module into another chunk`, which is not a warning about `en` alone: with the
 * dynamic edge collapsed into the static one, English stayed in the boot chunk
 * AND kept a dynamic importer, and the chunk it was pinned to is the one every
 * other dictionary's chunk then shares. Excluding it states the arrangement the
 * static import already decided.
 *
 * Nothing reaches `loaderFor('en')` to notice: `loaded` starts `{ en }`, so
 * `ensure('en')` returns at its first line. The throw below is now reachable for
 * English too, which is correct — asking to LOAD the dictionary that is by
 * definition already loaded is a bug in the caller, not a language to fetch.
 */
const loaders = import.meta.glob<Record<string, Dictionary>>(['./i18n/*.ts', '!./i18n/en.ts']);

function loaderFor(lang: UiLang): () => Promise<Record<string, Dictionary>> {
	const found = loaders[`./i18n/${lang}.ts`];
	if (!found) throw new Error(`no dictionary module for ${lang}`);
	return found;
}

/**
 * The dictionaries resolved so far, English always among them. Never evicted:
 * a reader who switches back and forth is not worth a second request, and the
 * whole set is a few dozen KB even if someone visits every language.
 */
const loaded: Partial<Record<UiLang, Dictionary>> = $state({ en });

async function ensure(lang: UiLang): Promise<void> {
	if (loaded[lang]) return;
	const module = await loaderFor(lang)();
	loaded[lang] = module[lang];
}

/**
 * One language's dictionary, loading it if it is not resident yet.
 *
 * Exported for the tests that check them all, and it POPULATES the cache
 * rather than merely reading past it — so a test (or any caller) that awaits a
 * language has also made it available to the synchronous `loadedDictionary`
 * below. Without that, `suggest.ts` would answer in English for a language a
 * test had just asked about, which is a confusing way to discover that the
 * suggester reads only what is resident.
 */
export async function dictionaryFor(lang: UiLang): Promise<Dictionary> {
	await ensure(lang);
	return loaded[lang]!;
}

/**
 * One language's dictionary IF IT IS ALREADY RESIDENT, without fetching.
 *
 * For the callers that run inside a render and cannot await — `suggest.ts`'s
 * `tr` is the only one — and whose answer is always the reader's own language
 * or English, both of which are resident by the time anything renders. It
 * returns `undefined` rather than fetching on purpose: a synchronous miss that
 * falls back to English is correct, whereas a fetch started from a render
 * would be a request nobody is waiting for.
 */
export function loadedDictionary(lang: UiLang): Dictionary | undefined {
	return loaded[lang];
}

function readHeld(): UiLang | undefined {
	const value = readSessionString(HELD_KEY);
	return value !== undefined && isUiLang(value) ? value : undefined;
}

function readStored(): UiLang | null {
	const value = readStoredString(STORAGE_KEY);
	return value != null && isUiLang(value) ? value : null;
}

/**
 * Pick the first browser-preferred language that the interface supports.
 *
 * THE HEAD OF `browserUiLangs`, which is where the matching itself now lives
 * — browser tags are normally regional (`pt-BR`, `en-US`, `de-AT`) while the
 * interface has one locale per language, so the primary subtag is what
 * matches. This function is the whole of what negotiation needs; the rest of
 * that list is what `LanguageMenu` leads with, and the two must not be two
 * readings. Unknown locales fall back to English, the site's existing
 * no-preference default.
 *
 * Latin is negotiable here like any other — `la` in `navigator.languages`
 * gets a Latin interface — but no operating system offers it as a display
 * language, so in practice it is reached by choosing it in the menu. That is
 * not a gap: nothing about this function needs to know which of its answers
 * a browser will actually ask for.
 */
export function detectUiLang(languages: readonly string[] | undefined): UiLang {
	return browserUiLangs(languages)[0] ?? DEFAULT_LANG;
}

function browserLanguage(): UiLang {
	return navigatorUiLangs()[0] ?? DEFAULT_LANG;
}

/**
 * The language a country calendar's ADDRESS names, where the address is one.
 *
 * `/calendarium/brazil` is published in Portuguese and the edge serves its head in
 * Portuguese (`languages.ts`), so a document that then paints English chrome
 * is a page declaring one language and rendering another — the mismatch
 * `app.html`'s pre-paint block exists to prevent, and the one thing that could
 * make these addresses worth less than the parameter they replaced.
 *
 * Exported for its test alone: `initialLang` runs at module scope, so the one
 * caller cannot be reached from a test without importing the store it builds.
 */
export function calendarPathLang(): UiLang | undefined {
	if (typeof location === 'undefined') return undefined;
	const id = parseCalendarPath(location.pathname);
	const lang = id ? CALENDAR_PAGES[id].lang : undefined;
	return lang && isUiLang(lang) ? lang : undefined;
}

/**
 * Keep the reader in the language they are reading in, for this tab.
 *
 * CALLED WHEREVER A PAGE WRITES ITS OWN ADDRESS, which today is `mirror` in
 * `routes/calendarium/+page.svelte` and nothing else: the picker, the day, an
 * arriving `?c=` being rewritten as the path that now names it, and the
 * remembered territory `/calendarium` opens in. All four put a country
 * calendar's address in the bar without the reader having asked for a
 * language, and the next load must not read it as though they had — see
 * `initialLang`, which is the only reader of what this writes.
 *
 * It takes no argument on purpose. What is held is whatever the interface is
 * showing at the moment of the write, which is the store's own `lang` and not
 * something a call site should be able to differ about.
 */
export function holdLang(): void {
	writeSessionString(HELD_KEY, i18n.lang);
}

/**
 * Four answers, and the order between them is the whole of the policy:
 *
 * 1. what the reader CHOSE — the language menu, or a `/pt/…` prefix, both
 *    through `set` and both saved for ever;
 * 2. what this page HELD — `hold`, below, for the session only;
 * 3. what the ADDRESS says — a country calendar's own language, for this load
 *    only and written nowhere;
 * 4. what the BROWSER says.
 *
 * ONLY THE READER OUTRANKS THE ADDRESS, AND THE BROWSER IS NOT THE READER,
 * which is the sentence the first three lines exist to make true. The site
 * used to save the negotiated answer at (4) the first time anyone loaded any
 * page — so by the time a reader ever met `/calendarium/brazil` they had a
 * saved value, (1) matched, and (3) could not fire for them or for anyone
 * else, ever. A rule that only applies to a reader's first page view is not a
 * rule. Negotiation is deterministic and costs nothing, so it is recomputed
 * per load instead, exactly as `calendar-pref.ts` recomputes the edge's
 * territory guess and for its reason: an unasked-for answer should be free to
 * be right again tomorrow.
 *
 * WHAT (2) IS FOR is that `/calendarium/brazil` gets into the address bar two
 * ways, and only one of them is somebody saying something. A reader arriving
 * from a search result was handed a Portuguese head by the edge and should be
 * handed a Portuguese page. A reader who pressed Brazil in the picker was
 * already reading in Albanian, and the page rewrote its own URL under them
 * (`routes/calendarium/+page.svelte`, `mirror`) — turning the interface
 * Portuguese on their next reload would be the site answering a question it
 * asked itself. So every write of that address holds the language it was
 * written in, and an address this page wrote never speaks.
 */
function initialLang(): UiLang {
	const stored = readStored();
	if (stored) return stored;

	const held = readHeld();
	if (held) return held;

	return calendarPathLang() ?? browserLanguage();
}

class I18nStore {
	lang: UiLang = $state(initialLang());

	/**
	 * Resolves once the INITIAL language's dictionary is in `loaded`.
	 *
	 * `routes/+layout.ts` awaits this, which is what stops a Portuguese reader
	 * seeing a frame of English chrome on a cold load. It is a property rather
	 * than a call because the negotiation has already happened — `initialLang`
	 * runs at module scope, before the layout's `load` — so this reuses that
	 * answer instead of racing a second one against it.
	 */
	readonly ready: Promise<void>;

	constructor() {
		// app.html already ran the same negotiation before first paint, but
		// only for the two attributes it can set from a script; re-applying
		// here keeps the store the single authority on what the document says
		// it is, including after a language whose script it did not know.
		applyDocumentLang(this.lang);
		this.ready = ensure(this.lang);
	}

	/**
	 * ASYNC SINCE 2026-08-31, and the await is load-bearing in one place that
	 * does not look like it needs one: `routes/[uilang=uilang]/+layout.ts`
	 * calls this from `load` precisely so the first paint is already in the
	 * right language. Assigning `lang` before its dictionary has resolved
	 * would paint English and swap — the exact flash that route exists to
	 * avoid — so the dictionary is fetched FIRST and the language assigned
	 * after, which also means no render ever observes a half-applied switch.
	 */
	async set(lang: UiLang): Promise<void> {
		await ensure(lang);
		this.lang = lang;
		writeStoredString(STORAGE_KEY, lang);
		applyDocumentLang(lang);
	}

	/** Whether the interface is currently reading right to left. */
	get rtl(): boolean {
		return isRtl(this.lang);
	}

	/**
	 * Synchronous, and stays synchronous: it only ever reads what is already
	 * resolved and never triggers a fetch. A language whose dictionary has not
	 * arrived yet therefore degrades to English key by key — the same
	 * behaviour a partial translation already had, which is why this needed no
	 * new fallback. `ready` is what keeps that from being visible on load.
	 */
	t(key: string): string {
		return loaded[this.lang]?.[key] ?? en[key] ?? key;
	}
}

export const i18n = new I18nStore();

/** Convenience helper, reactive when called from within a component. */
export function t(key: string): string {
	return i18n.t(key);
}
