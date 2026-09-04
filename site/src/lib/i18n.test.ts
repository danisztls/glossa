import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
	bcp47,
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

	/**
	 * The one place a script beats a region, and the failure it prevents.
	 *
	 * `zh-TW` and `zh-HK` fold to `zht` and not to `zh` (`SCRIPT_VARIANTS` in
	 * ui-langs.ts): the two dictionaries are the same language in scripts that
	 * share few characters, so a Taiwanese reader negotiated into `zh` gets an
	 * interface they can read only with effort — the outcome having two
	 * dictionaries exists to prevent. `zh-CN` and a bare `zh` keep the
	 * ordinary primary-subtag rule.
	 */
	it('negotiates Traditional Chinese apart from Simplified', () => {
		expect(detectUiLang(['zh-TW'])).toBe('zht');
		expect(detectUiLang(['zh-HK', 'en-US'])).toBe('zht');
		expect(detectUiLang(['zh-Hant'])).toBe('zht');
		expect(detectUiLang(['zh-CN'])).toBe('zh');
		expect(detectUiLang(['zh'])).toBe('zh');
	});

	// The three that closed the superset gap a second time on 2026-09-04. The
	// corpus had `compendium.lt`, `csdc.sq` and `prayer.common.zht` and the
	// interface had none of them.
	it('negotiates the languages added with the curated prayers', () => {
		expect(detectUiLang(['lt-LT'])).toBe('lt');
		expect(detectUiLang(['sq-AL'])).toBe('sq');
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

	/**
	 * EVERY WORD THE CALENDAR PRINTS AS A TERM OF ART HAS AN EXPLANATION, and
	 * the pairing is what this checks rather than the wording.
	 *
	 * `TermGloss` builds its key by interpolation (`calendar.gloss.colour.` +
	 * the day's colour), so a colour, rank or season named in the dictionary
	 * with no gloss beside it renders the KEY as the tooltip's text — visible
	 * only on the days that carry that term, which for `rose` is twice a year
	 * and for `blue` is once, in two countries. The primer at the foot of
	 * `/calendarium` is total over the three unions by its type; this is the
	 * other half, over the strings themselves, in both directions: a gloss
	 * naming a term the calendar does not have is as wrong as a term with none.
	 */
	it('glosses every calendar term, and glosses nothing that is not one', async () => {
		const en = await dictionaryFor('en');
		const groups = ['season', 'rank', 'colour'];
		const terms = new Set(
			Object.keys(en)
				.map((k) => k.match(/^calendar\.(season|rank|colour)\.(.+)$/))
				.filter((m) => m !== null)
				.map((m) => `${m[1]}.${m[2]}`)
		);
		const glossed = new Set(
			Object.keys(en)
				.map((k) => k.match(/^calendar\.gloss\.(season|rank|colour)\.(.+)$/))
				.filter((m) => m !== null)
				.map((m) => `${m[1]}.${m[2]}`)
		);
		expect(groups.every((g) => [...terms].some((t) => t.startsWith(`${g}.`)))).toBe(true);
		expect(
			[...terms].filter((t) => !glossed.has(t)),
			'named, never explained'
		).toEqual([]);
		expect(
			[...glossed].filter((t) => !terms.has(t)),
			'explained, never named'
		).toEqual([]);
		// The three counters have no union behind them and are named one by one.
		for (const cycle of ['sundayCycle', 'weekdayCycle', 'psalterWeek', 'obligation']) {
			expect(en[`calendar.gloss.${cycle}`], cycle).toBeTruthy();
		}
	});

	// Every placeholder is substituted by the caller with `.replace('{x}', …)`,
	// so a translation that drops or misspells one silently loses the word it
	// stood for — a sentence with no language name in it, or a plate's control
	// labelled "Enlarge" with nothing said about which plate.
	it('keeps each placeholder wherever English has one', async () => {
		// A list per key, not one placeholder: `refs.externalVolume` carries
		// two, and a translation that keeps only the volume drops the host —
		// the half of the sentence that says where the reader is being sent.
		const placeholders: Record<string, string[]> = {
			'summa.titleFromEdition': ['{lang}'],
			'summa.noEditionInYourLanguage': ['{lang}'],
			'plates.enlarge': ['{title}'],
			'refs.externalVolume': ['{volume}', '{host}']
		};
		for (const [key, expected] of Object.entries(placeholders)) {
			for (const placeholder of expected) {
				expect((await dictionaryFor('en'))[key], `en: ${key}`).toContain(placeholder);
				for (const lang of UI_LANGS) {
					const value = (await dictionaryFor(lang))[key];
					if (value !== undefined) expect(value, `${lang}: ${key}`).toContain(placeholder);
				}
			}
		}
	});

	/**
	 * EVERY LOCALE-SENSITIVE API MUST BE HANDED `bcp47(...)`, AND THIS SCANS
	 * THE SOURCE FOR IT, because the failure has no symptom at the call site.
	 *
	 * `zht` is structurally valid BCP-47 — a three-letter primary subtag is
	 * the ISO 639-3 shape — so `Intl` does not reject it. It resolves it to
	 * the browser's default locale and answers cheerfully, which means the
	 * `try`/`catch` every one of these calls already has never fires. Two
	 * call sites were written this way before anyone looked (2026-09-04):
	 * `library.ts` printed `24.1` to a reader whose panel says `24,1`
	 * everywhere else, in the very function whose docblock explains why the
	 * tag is passed at all, and `/calendarium` named fifteen countries in
	 * whatever language the browser preferred.
	 *
	 * A TEST AND NOT A CONVENTION, because the convention is invisible: the
	 * code reads correctly, the types are satisfied, and the output is wrong
	 * only for one of thirty-seven languages. `corpus-derivations.test.ts`
	 * scans source for the same class of reason.
	 *
	 * THE RULE: a `new Intl.*(...)` whose first argument mentions a bare
	 * lang-shaped identifier must also mention `bcp47(`. Property access is
	 * exempt (`lang.startsWith('pt') ? 'pt-PT' : 'en-US'` in `dates.ts`
	 * resolves to a literal on every branch), and so is an argument naming no
	 * tag at all (`Intl.Segmenter(undefined, …)`).
	 */
	it('hands every Intl constructor a tag Intl can resolve', () => {
		const root = path.join(process.cwd(), 'src');
		/** @returns every `.ts`/`.svelte` file under `src`, tests excluded. */
		const walk = (dir: string): string[] =>
			readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) return walk(full);
				if (entry.name.endsWith('.test.ts')) return [];
				return /\.(ts|svelte)$/.test(entry.name) ? [full] : [];
			});

		// The first argument's source text: from the open paren to the comma
		// that ends it, tracking bracket depth so `[a, b]` and `f(x, y)` do
		// not end it early.
		const firstArg = (source: string, from: number): string => {
			let depth = 0;
			for (let i = from; i < source.length; i++) {
				const c = source[i];
				if ('([{'.includes(c)) depth++;
				else if (')]}'.includes(c)) {
					if (depth === 0) return source.slice(from, i);
					depth--;
				} else if (c === ',' && depth === 0) return source.slice(from, i);
			}
			return source.slice(from);
		};

		const offenders: string[] = [];
		for (const file of walk(root)) {
			const source = readFileSync(file, 'utf8');
			for (const match of source.matchAll(/new Intl\.[A-Za-z]+\(/g)) {
				const arg = firstArg(source, match.index + match[0].length);
				// `lang`, `inLang`, `readerLang`, `uiLang` — but not `lang.x`,
				// and not the word `language`.
				if (!/lang\b(?!\s*\.)/i.test(arg)) continue;
				if (arg.includes('bcp47(')) continue;
				// `dateLocale` is the shim reached through a helper rather than
				// inline, and it is STRICTER than `bcp47` alone: it converts the
				// tag and then asks `supportedLocalesOf` whether the platform
				// can answer for it, falling back to `en-US` where it cannot.
				// `dates.test.ts` pins both halves of that chain.
				if (arg.includes('dateLocale(')) continue;
				offenders.push(`${path.relative(root, file)}: ${match[0]}${arg.trim()}`);
			}
		}
		expect(offenders, offenders.join('\n')).toEqual([]);
	});

	/**
	 * `zht` is the app's tag and `zh-Hant` is the tag a machine gets, and the
	 * conversion happens at exactly four points (`bcp47`'s docblock names
	 * them). The pair of assertions is the contract: everything else is
	 * already a language subtag and must pass through untouched, or the
	 * `hreflang` cluster starts declaring tags that are not the URLs' own.
	 */
	it('hands a machine a real language tag, and only where there is one to fix', () => {
		expect(bcp47('zht')).toBe('zh-Hant');
		for (const lang of UI_LANGS) {
			if (lang === 'zht') continue;
			expect(bcp47(lang), lang).toBe(lang);
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

	/**
	 * The same drift, in the two tables that arrived with `zht` — and this
	 * pair fails LOUDER than the list above, which is why it is worth its own
	 * assertion. A stale `UI` costs a flash of the wrong language; a stale
	 * `BCP` writes `lang="zht"` before paint and `lang="zh-Hant"` after it,
	 * so `direction.css`'s `:lang(zh-Hant)` misses on the first paint and the
	 * page changes typeface under the reader, and a stale `VAR` negotiates a
	 * `zh-TW` browser into Simplified and then swaps every glyph at
	 * hydration.
	 */
	it('keeps app.html’s tag conversions equal to ui-langs.ts', () => {
		const html = readFileSync(path.join(process.cwd(), 'src/app.html'), 'utf8');
		const bcpBlock = /var BCP = \{([^}]*)\}/.exec(html)?.[1];
		expect(bcpBlock, 'no `var BCP = {...}` found in src/app.html').toBeDefined();
		const pairs = [...(bcpBlock ?? '').matchAll(/'?([a-zA-Z-]+)'?:\s*'([a-zA-Z-]+)'/g)];
		for (const [, tag, written] of pairs) expect(bcp47(tag), tag).toBe(written);
		// And the other direction: nothing `bcp47` rewrites may be missing here.
		const covered = new Set(pairs.map((m) => m[1]));
		for (const lang of UI_LANGS) {
			if (bcp47(lang) !== lang) expect(covered, lang).toContain(lang);
		}

		const varBlock = /var VAR = \{([^}]*)\}/.exec(html)?.[1];
		expect(varBlock, 'no `var VAR = {...}` found in src/app.html').toBeDefined();
		const variants = [...(varBlock ?? '').matchAll(/'([a-z-]+)':\s*'([a-z-]+)'/g)];
		expect(variants.length).toBeGreaterThan(0);
		for (const [, tag, folded] of variants) expect(detectUiLang([tag]), tag).toBe(folded);
	});
});
