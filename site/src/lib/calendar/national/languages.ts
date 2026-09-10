/**
 * The published calendars that have an address of their own, and the language
 * each one's head is written in.
 *
 * ONE ADDRESS PER CALENDAR — `/calendarium/br` — and this is the language its
 * `<title>` and `<meta name="description">` are written in, and nothing else.
 * The interface still negotiates (`app.html`'s pre-paint block, then
 * `I18nStore`), so a reader who arrives with a browser of their own keeps it:
 * the path names a fact about the CALENDAR, not about the reader. What has no
 * language to negotiate from is a crawler, and the head it is served is the
 * whole reason these addresses exist — `calendário litúrgico` is what a
 * Brazilian searcher types, and a page describing itself in English cannot
 * answer it.
 *
 * READ OFF THE SOURCE, NOT GUESSED. `CALENDARS` in
 * `pipeline/scrapers/liturgical_calendar.py` records the editions GCatholic
 * publishes each calendar in, taken from each calendar's own language
 * switcher, and its FIRST tag is the anchor — the country's own language
 * wherever there is one, since that is the language its conference approved
 * its propers in. Its `zt` is this repo's `zht`, which is the only rewriting
 * between the two tables.
 *
 * TWENTY-THREE LANGUAGES CAN CARRY A CALENDAR AND EVERY ANCHOR HERE IS ONE OF
 * THEM: `la`, `en` and `pt` in `ROWS`, plus the twenty chunks under
 * `../names/`. That is a condition on this table rather than a coincidence —
 * a head in a language the celebrations cannot be printed in would name a page
 * that is that language in its title and English in every row below it.
 * **Russia is the row that shows the condition doing work.** Its conference
 * works in Russian and `ru` is an interface language, and this table still
 * says `en`: GCatholic publishes that calendar in English only, `ru` is not
 * one of the twenty, and `ru.ts`'s own propers carry English names and nothing
 * else.
 *
 * THE ONE ROW WHERE THE WITNESSES DISAGREE is `vi`, the United States Virgin
 * Islands. The source publishes it in Spanish and its derived propers are US
 * federal observances named in Spanish; CLDR's likely subtags for the
 * territory say English. The measured witness is followed, and what would
 * settle it is the diocese's own ordo.
 *
 * THE KEYS ARE EXACTLY `NATIONAL_CALENDAR_LIST` — the layers `held.ts` does
 * not hold back — and `languages.test.ts` asserts that in both directions, so
 * a calendar that earns its way out of `held.ts` cannot ship without a row
 * here and a row here cannot outlive its layer.
 *
 * IMPORTING NO LAYER, for `subdivisions.ts`'s reason at a second remove:
 * `route-manifest.ts` and `shell-head.ts` both read this table, and reaching
 * it through `./index.ts` would pull all eighty-five layers — 184 KB — into
 * the edge worker and into the boot graph. The two modules it does import are
 * the region names it cannot get from the platform and the tag conversion
 * every `Intl` call on this site owes.
 */
import { bcp47 } from '../../ui-langs.ts';
import { SUBDIVISION_NAMES } from './subdivisions.ts';

/** Calendar id -> the language that calendar's page is named in. */
export const CALENDAR_LANGS: Record<string, string> = {
	ar: 'es',
	at: 'de',
	be: 'nl',
	bn: 'en',
	bo: 'es',
	br: 'pt',
	ca: 'en',
	cd: 'fr',
	ch: 'de',
	cl: 'es',
	co: 'es',
	cr: 'es',
	cz: 'cs',
	de: 'de',
	dz: 'fr',
	es: 'es',
	fr: 'fr',
	gt: 'es',
	gu: 'en',
	hk: 'zht',
	hr: 'hr',
	hu: 'hu',
	in: 'en',
	it: 'it',
	jp: 'ja',
	ke: 'en',
	kr: 'ko',
	kw: 'en',
	li: 'de',
	lt: 'lt',
	lu: 'fr',
	mc: 'fr',
	mx: 'es',
	my: 'en',
	ng: 'en',
	nl: 'nl',
	no: 'no',
	pa: 'es',
	pe: 'es',
	ph: 'en',
	pl: 'pl',
	ps: 'en',
	ru: 'en',
	sd: 'en',
	se: 'sv',
	st: 'pt',
	tl: 'pt',
	ug: 'en',
	us: 'en',
	va: 'it',
	ve: 'es',
	vi: 'es',
	za: 'en'
};

/** The calendars with an address, in the order the sitemap lists them. */
export const CALENDAR_IDS: readonly string[] = Object.keys(CALENDAR_LANGS).sort();

/** `/calendarium/br`. The one place this path is spelled. */
export function calendarPath(id: string): string {
	return `/calendarium/${id}`;
}

/**
 * A territory's name, in one language, from the platform.
 *
 * `Intl.DisplayNames` is what the language menu already uses for language
 * names (`menu-filter.ts`), and it earns its place here for the same reason:
 * fifty territory names in forty interface languages is a table nobody would
 * maintain, and every browser already knows them. A tag it cannot name falls
 * back to `SUBDIVISION_NAMES` and then to the code, which is at least the ISO
 * name of the place.
 *
 * `bcp47`, for the reason `menu-filter.ts`'s own `Intl` call gives: `zht` is
 * structurally valid and unresolvable, so it does not throw into the `catch`
 * below — it answers in the browser's locale, which reads as a bug in the
 * country list rather than in the tag.
 *
 * THREE CALLERS AND ONE DEFINITION: the picker's cells, the `<title>` this
 * page assigns at hydration, and `route-titles.mjs`, which writes the one the
 * edge serves. The last two are the reason it moved out of `CalendarMenu` —
 * an edge title and a hydrated title that name a country two ways is a visible
 * rearrangement on every load.
 */
export function territoryName(code: string, lang: string): string {
	if (SUBDIVISION_NAMES[code]) return SUBDIVISION_NAMES[code];
	const upper = code.toUpperCase();
	try {
		return new Intl.DisplayNames([bcp47(lang)], { type: 'region' }).of(upper) ?? upper;
	} catch {
		return upper;
	}
}
