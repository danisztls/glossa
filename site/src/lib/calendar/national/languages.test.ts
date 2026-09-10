import { describe, expect, it } from 'vitest';
import { isCanonicalPath, parseCalendarPath, type RouteManifest } from '$lib/route-manifest';
import { isUiLang, UI_LANGS } from '$lib/ui-langs';
import { NAMED_LANGS } from '../names.svelte';
import { NATIONAL_CALENDAR_LIST, TERRITORY_CALENDARS } from './index';
import { HELD_CALENDARS } from './held';
import {
	CALENDAR_BY_SLUG,
	CALENDAR_IDS,
	CALENDAR_PAGES,
	calendarPath,
	territoryName
} from './languages';

/**
 * The addresses are decided by a table and the calendars by a list, and this
 * file is what keeps the two from disagreeing.
 *
 * `route-manifest.test.ts` walks `src/routes/` and skips every directory whose
 * name begins with `[`, so the guard that catches a forgotten static page
 * cannot see `calendarium/[calendar]/`. What replaces it is that BOTH ends read
 * `CALENDAR_LANGS` — the route's `load` and `isCanonicalPath` — plus the
 * assertions below, which are the same question asked of the layers.
 */

/** Enough of a manifest for `isCanonicalPath`; none of these paths read it. */
const manifest: RouteManifest = {
	version: 1,
	workCount: 0,
	contentAssetCount: 0,
	bible: {},
	ccc: [],
	cccChapters: [],
	compendium: [],
	compendiumChapters: [],
	socialDoctrine: [],
	socialDoctrineChapters: [],
	canonLaw: [],
	canonLawTitles: [],
	documents: [],
	prayers: [],
	topics: [],
	summa: {}
};

describe('CALENDAR_PAGES', () => {
	/** Both directions, for `held.ts`'s reason: the published set moves in both,
	 *  and a row that outlives its layer names an address to a calendar nobody
	 *  can compute. */
	it('names exactly the published calendars', () => {
		expect(CALENDAR_IDS).toEqual([...NATIONAL_CALENDAR_LIST.map((c) => c.id)].sort());
	});

	it('leaves the held calendars without an address', () => {
		for (const id of Object.keys(HELD_CALENDARS)) {
			expect(CALENDAR_PAGES[id], id).toBeUndefined();
			expect(parseCalendarPath(`/calendarium/${id}`), id).toBeUndefined();
		}
	});

	it('publishes each one in an interface language', () => {
		for (const id of CALENDAR_IDS) expect(UI_LANGS, id).toContain(CALENDAR_PAGES[id].lang);
	});

	/**
	 * THE CONDITION THE TABLE HAS TO PASS, and Russia is the row that shows it
	 * doing work: a page named in a language the celebrations cannot be printed
	 * in is that language in its title and English in every row below it. The
	 * twenty-three are `grc.ts`'s own three and the twenty chunks `NAMED_LANGS`
	 * reads off `../names/`.
	 */
	it('publishes each one in a language the calendar itself can be read in', () => {
		const readable = new Set(['la', 'en', 'pt', ...NAMED_LANGS]);
		for (const id of CALENDAR_IDS) expect([...readable], id).toContain(CALENDAR_PAGES[id].lang);
	});

	it('leaves Russia in English, where GCatholic publishes it', () => {
		expect(CALENDAR_PAGES.ru.lang).toBe('en');
	});

	/**
	 * THE SLUG IS THE POINT OF THE SLUG. Fifteen layer ids are also interface
	 * language tags and four of those name something else there — `tl` is
	 * Timor-Leste and Tagalog, `vi` the Virgin Islands and Vietnamese — so an
	 * address spelled with the id would read as a language to anyone who has
	 * seen `/tl/preces`.
	 */
	it('spells an address with no interface language tag in it', () => {
		for (const id of CALENDAR_IDS) {
			expect(isUiLang(CALENDAR_PAGES[id].slug), id).toBe(false);
		}
	});

	it('gives every calendar a distinct, lowercase, ASCII slug', () => {
		const slugs = CALENDAR_IDS.map((id) => CALENDAR_PAGES[id].slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		for (const slug of slugs) expect(slug, slug).toMatch(/^[a-z][a-z-]*[a-z]$/);
	});

	/** The sibling route, which a slug may not shadow. */
	it('leaves `liturgia` alone', () => {
		expect(CALENDAR_BY_SLUG.liturgia).toBeUndefined();
	});

	/** Each is a phrase in its own language, not a template that was filled in
	 *  — the check is that no placeholder survived and no two are the same. */
	it('names every calendar distinctly', () => {
		const names = CALENDAR_IDS.map((id) => CALENDAR_PAGES[id].name);
		expect(new Set(names).size).toBe(names.length);
		for (const name of names) expect(name).not.toContain('{');
	});
});

describe('territoryName', () => {
	/**
	 * The fallback is the ISO code, which is the right answer in a picker cell
	 * and a build failure in a `<title>` — `route-titles.mjs` throws on it.
	 * Asserting it here says WHICH id would have done it.
	 */
	it('names every published calendar in its own language', () => {
		for (const id of CALENDAR_IDS) {
			expect(territoryName(id, CALENDAR_PAGES[id].lang), id).not.toBe(id.toUpperCase());
		}
	});

	it('names the territory in the language it is asked for', () => {
		expect(territoryName('br', 'pt')).toBe('Brasil');
		expect(territoryName('br', 'en')).toBe('Brazil');
	});

	/** The three ids that are 3166-2 subdivisions and so unnameable by `Intl`. */
	it('falls back to the subdivision table', () => {
		expect(territoryName('gb-sct', 'en')).toBe('Scotland');
	});
});

describe('parseCalendarPath', () => {
	it('reads a published calendar off its address', () => {
		expect(parseCalendarPath('/calendarium/brazil')).toBe('br');
		expect(isCanonicalPath('/calendarium/brazil', manifest)).toBe(true);
	});

	/** The id is the corpus's vocabulary and `?c=`'s, and is not an address. */
	it('refuses the layer id in the path', () => {
		expect(parseCalendarPath('/calendarium/br')).toBeUndefined();
		expect(isCanonicalPath('/calendarium/br', manifest)).toBe(false);
	});

	it('answers for every address the sitemap publishes', () => {
		for (const id of CALENDAR_IDS) {
			expect(isCanonicalPath(calendarPath(id), manifest), id).toBe(true);
		}
	});

	/**
	 * A territory that keeps another's calendar is not an address: ten of them
	 * would be ten pages with one body. `?c=il` still says Israel — that is a
	 * parameter on a page, and this is the page.
	 */
	it('refuses a territory that publishes no calendar of its own', () => {
		expect(TERRITORY_CALENDARS.il).toBe('ps');
		expect(parseCalendarPath('/calendarium/israel')).toBeUndefined();
		expect(isCanonicalPath('/calendarium/israel', manifest)).toBe(false);
	});

	it('leaves the day’s liturgy to its own route', () => {
		expect(parseCalendarPath('/calendarium/liturgia')).toBeUndefined();
		expect(isCanonicalPath('/calendarium/liturgia', manifest)).toBe(true);
	});

	it('refuses a deeper path and the general page', () => {
		expect(parseCalendarPath('/calendarium/brazil/2026')).toBeUndefined();
		expect(parseCalendarPath('/calendarium')).toBeUndefined();
		expect(parseCalendarPath('/calendarium/')).toBeUndefined();
	});
});
