/**
 * The published calendars that have an address of their own: what that address
 * is, what language the page is written in, and what the calendar is called in
 * it.
 *
 * ONE ADDRESS PER CALENDAR — `/calendarium/brazil` — named and described in the
 * language that calendar is published in, and nothing else follows from that.
 * The interface still negotiates for the reader; what has no language to
 * negotiate from is a crawler, and the head it is served is the whole reason
 * these addresses exist. `calendario litúrgico brasileiro` is what a Brazilian
 * searcher types, and a page describing itself in English cannot answer it.
 *
 * ## The segment is a SLUG and not the layer's id
 *
 * `?c=br` is the corpus's vocabulary and stays; the address is `brazil`,
 * because fifteen of the fifty-three ids are also interface language tags and
 * four of them mean something else there. `/calendarium/tl` is Timor-Leste
 * here and Tagalog in `/tl/preces`; `vi` is the United States Virgin Islands
 * and Vietnamese; `ar` is Argentina and Arabic; `be` is Belgium and
 * Belarusian. The site already made this decision once, for the same reason:
 * `BIBLE_BOOK_SLUGS` gave `/scriptura/iosue/1` a Latin slug over the OSIS id
 * the corpus is keyed by, so that the URL says what the page says.
 *
 * THE SLUGS ARE WRITTEN DOWN AND NOT DERIVED, which is the one thing that
 * matters more than their spelling: `Intl.DisplayNames` moves with the
 * platform's CLDR, and an address that changed when a browser updated would
 * break every link ever made to it. They are English, lowercase, ASCII —
 * derivable by eye from the territory and checkable by anyone, where a Latin
 * name for Hong Kong or Northern Arabia would be this project inventing text
 * (`docs/decisions.md` §Scope).
 *
 * ## The name is the calendar's own, in its own language
 *
 * `Calendário Litúrgico Brasileiro`, not `Liturgical Calendar — Brazil`. The
 * whole name is stored rather than composed from an adjective, because the
 * adjective goes AFTER the noun in Portuguese and BEFORE it in German
 * (`Österreichischer Liturgischer Kalender`), declines in both, and does not
 * exist as a word in Chinese or Japanese, where the territory simply modifies
 * the noun. A rule that composed them would need a grammar per language; a
 * finished phrase needs a speaker, once.
 *
 * WHERE NO ADJECTIVE READS NATURALLY THE NAME IS PARENTHETICAL, which is the
 * source's own shape — GCatholic titles every feed `Liturgical Calendar 2026
 * (Brunei)`. That covers a demonym nobody uses (`são-tomense`), one that names
 * two countries (`congolais`, for the calendar of only one of the Congos), and
 * the particular churches below.
 *
 * ## Eight calendars are a particular church's, and two are not a country's
 *
 * The feeds say so in their own titles: `gu` is `(Agaña)`, `li` is `(Vaduz)`,
 * `se` is `(Stockholm)`, `va` is `(Roma)`. Where that church covers exactly
 * one country the country is the honest name — the Diocese of Stockholm IS
 * Sweden, so the page is the Swedish liturgical calendar. Where it spans
 * several, a country name would be false: the Latin Patriarchate of Jerusalem
 * covers Cyprus, Israel, Jordan and Palestine, and the vicariate of Northern
 * Arabia several more, so those two carry the church's name instead. Vatican
 * City keeps the Diocese of Rome's calendar and is named for the state anyway,
 * being one.
 *
 * ## The language is read off the source, not guessed
 *
 * `CALENDARS` in `pipeline/scrapers/liturgical_calendar.py` records the
 * editions GCatholic publishes each calendar in, taken from each calendar's
 * own language switcher, and its FIRST tag is the anchor — the country's own
 * language wherever there is one, since that is the language its conference
 * approved its propers in. Its `zt` is this repo's `zht`, the only rewriting
 * between the two tables.
 *
 * TWENTY-THREE LANGUAGES CAN CARRY A CALENDAR AND EVERY ANCHOR HERE IS ONE OF
 * THEM: `la`, `en` and `pt` in `ROWS`, plus the twenty chunks under
 * `../names/`. That is a condition on this table rather than a coincidence —
 * a page named in a language the celebrations cannot be printed in would be
 * that language in its title and English in every row below it. **Russia is
 * the row that shows the condition doing work.** Its conference works in
 * Russian and `ru` is an interface language, and this table still says `en`:
 * GCatholic publishes that calendar in English only, `ru` is not one of the
 * twenty, and `ru.ts`'s own propers carry English names and nothing else.
 *
 * THE ONE ROW WHERE THE WITNESSES DISAGREE is `vi`, the United States Virgin
 * Islands. The source publishes it in Spanish and its derived propers are US
 * federal observances named in Spanish; CLDR's likely subtags for the
 * territory say English, and the feed titles it `(Saint Thomas)`, its diocese.
 * The measured witness is followed, and the diocese's own ordo would settle it.
 *
 * ## What the keys are
 *
 * EXACTLY `NATIONAL_CALENDAR_LIST` — the layers `held.ts` does not hold back —
 * and `languages.test.ts` asserts that in both directions, so a calendar that
 * earns its way out of `held.ts` cannot ship without a row here and a row here
 * cannot outlive its layer.
 *
 * IMPORTING NO LAYER, for `subdivisions.ts`'s reason at a second remove:
 * `route-manifest.ts` and `shell-head.ts` both read this table, and reaching
 * it through `./index.ts` would pull all eighty-five layers — 184 KB — into
 * the edge worker and into the boot graph.
 */

import { bcp47 } from '../../ui-langs.ts';
import { SUBDIVISION_NAMES } from './subdivisions.ts';

export interface CalendarPage {
	/** The address segment. English, lowercase, ASCII, and never derived. */
	slug: string;
	/** The language this page is written in. */
	lang: string;
	/** What the calendar is called in that language. */
	name: string;
}

/** Calendar id -> its page. The id is the layer's and `?c=`'s; everything
 *  else here belongs to the page. */
export const CALENDAR_PAGES: Record<string, CalendarPage> = {
	ar: { slug: 'argentina', lang: 'es', name: 'Calendario litúrgico argentino' },
	at: { slug: 'austria', lang: 'de', name: 'Österreichischer Liturgischer Kalender' },
	be: { slug: 'belgium', lang: 'nl', name: 'Belgische liturgische kalender' },
	bn: { slug: 'brunei', lang: 'en', name: 'Liturgical Calendar (Brunei)' },
	bo: { slug: 'bolivia', lang: 'es', name: 'Calendario litúrgico boliviano' },
	br: { slug: 'brazil', lang: 'pt', name: 'Calendário Litúrgico Brasileiro' },
	ca: { slug: 'canada', lang: 'en', name: 'Canadian Liturgical Calendar' },
	// `congolais` names the calendar of either Congo, and this is one of them.
	cd: {
		slug: 'congo-kinshasa',
		lang: 'fr',
		name: 'Calendrier liturgique (République démocratique du Congo)'
	},
	ch: { slug: 'switzerland', lang: 'de', name: 'Schweizerischer Liturgischer Kalender' },
	cl: { slug: 'chile', lang: 'es', name: 'Calendario litúrgico chileno' },
	co: { slug: 'colombia', lang: 'es', name: 'Calendario litúrgico colombiano' },
	cr: { slug: 'costa-rica', lang: 'es', name: 'Calendario litúrgico costarricense' },
	cz: { slug: 'czechia', lang: 'cs', name: 'Český liturgický kalendář' },
	de: { slug: 'germany', lang: 'de', name: 'Deutscher Liturgischer Kalender' },
	dz: { slug: 'algeria', lang: 'fr', name: 'Calendrier liturgique algérien' },
	es: { slug: 'spain', lang: 'es', name: 'Calendario litúrgico español' },
	fr: { slug: 'france', lang: 'fr', name: 'Calendrier liturgique français' },
	gt: { slug: 'guatemala', lang: 'es', name: 'Calendario litúrgico guatemalteco' },
	gu: { slug: 'guam', lang: 'en', name: 'Liturgical Calendar (Guam)' },
	hk: { slug: 'hong-kong', lang: 'zht', name: '香港禮儀日曆' },
	hr: { slug: 'croatia', lang: 'hr', name: 'Hrvatski liturgijski kalendar' },
	hu: { slug: 'hungary', lang: 'hu', name: 'Magyar liturgikus naptár' },
	in: { slug: 'india', lang: 'en', name: 'Indian Liturgical Calendar' },
	it: { slug: 'italy', lang: 'it', name: 'Calendario liturgico italiano' },
	jp: { slug: 'japan', lang: 'ja', name: '日本の典礼暦' },
	ke: { slug: 'kenya', lang: 'en', name: 'Kenyan Liturgical Calendar' },
	kr: { slug: 'south-korea', lang: 'ko', name: '한국 전례력' },
	// The vicariate, not a country: it covers Kuwait, Bahrain, Qatar and Saudi
	// Arabia between them.
	kw: { slug: 'northern-arabia', lang: 'en', name: 'Liturgical Calendar (Northern Arabia)' },
	li: { slug: 'liechtenstein', lang: 'de', name: 'Liturgischer Kalender (Liechtenstein)' },
	lt: { slug: 'lithuania', lang: 'lt', name: 'Lietuvos liturginis kalendorius' },
	lu: { slug: 'luxembourg', lang: 'fr', name: 'Calendrier liturgique luxembourgeois' },
	mc: { slug: 'monaco', lang: 'fr', name: 'Calendrier liturgique monégasque' },
	mx: { slug: 'mexico', lang: 'es', name: 'Calendario litúrgico mexicano' },
	my: { slug: 'malaysia', lang: 'en', name: 'Malaysian Liturgical Calendar' },
	ng: { slug: 'nigeria', lang: 'en', name: 'Nigerian Liturgical Calendar' },
	nl: { slug: 'netherlands', lang: 'nl', name: 'Nederlandse liturgische kalender' },
	no: { slug: 'norway', lang: 'no', name: 'Norsk liturgisk kalender' },
	pa: { slug: 'panama', lang: 'es', name: 'Calendario litúrgico panameño' },
	pe: { slug: 'peru', lang: 'es', name: 'Calendario litúrgico peruano' },
	ph: { slug: 'philippines', lang: 'en', name: 'Philippine Liturgical Calendar' },
	pl: { slug: 'poland', lang: 'pl', name: 'Polski kalendarz liturgiczny' },
	// The Latin Patriarchate, which covers Cyprus, Israel, Jordan and Palestine.
	ps: { slug: 'jerusalem', lang: 'en', name: 'Liturgical Calendar (Jerusalem)' },
	ru: { slug: 'russia', lang: 'en', name: 'Russian Liturgical Calendar' },
	sd: { slug: 'sudan', lang: 'en', name: 'Sudanese Liturgical Calendar' },
	se: { slug: 'sweden', lang: 'sv', name: 'Svensk liturgisk kalender' },
	st: {
		slug: 'sao-tome-and-principe',
		lang: 'pt',
		name: 'Calendário Litúrgico (São Tomé e Príncipe)'
	},
	tl: { slug: 'timor-leste', lang: 'pt', name: 'Calendário Litúrgico Timorense' },
	ug: { slug: 'uganda', lang: 'en', name: 'Ugandan Liturgical Calendar' },
	us: { slug: 'united-states', lang: 'en', name: 'United States Liturgical Calendar' },
	va: { slug: 'vatican-city', lang: 'it', name: 'Calendario liturgico vaticano' },
	ve: { slug: 'venezuela', lang: 'es', name: 'Calendario litúrgico venezolano' },
	vi: {
		slug: 'us-virgin-islands',
		lang: 'es',
		name: 'Calendario litúrgico (Islas Vírgenes de EE. UU.)'
	},
	za: { slug: 'south-africa', lang: 'en', name: 'South African Liturgical Calendar' }
};

/** The calendars with an address, by id, in the order the sitemap lists them. */
export const CALENDAR_IDS: readonly string[] = Object.keys(CALENDAR_PAGES).sort();

/** Slug -> calendar id, which is the direction an address is read in. */
export const CALENDAR_BY_SLUG: Record<string, string> = Object.fromEntries(
	Object.entries(CALENDAR_PAGES).map(([id, page]) => [page.slug, id])
);

/** `/calendarium/brazil`. The one place this path is spelled. */
export function calendarPath(id: string): string {
	return `/calendarium/${CALENDAR_PAGES[id].slug}`;
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
 * THE CALENDAR PAGES DO NOT TITLE THEMSELVES WITH THIS. A name from the
 * platform is a bare nominative with no article, so it can be a label and
 * never part of a sentence — which is why `CALENDAR_PAGES` carries a written
 * name instead. What this still answers is the picker's cells and the
 * breadcrumb, where a label is exactly what is wanted.
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
