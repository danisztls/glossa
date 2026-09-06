import { describe, expect, it } from 'vitest';
import { dateLocale, formatPromulgated, relativeDay } from './dates';

/**
 * The regression these guard is a date rendering ONE DAY EARLY west of
 * Greenwich — see `dates.ts` for the mechanism. It is invisible in CI and in
 * any UTC/Europe environment, which is exactly how three copies of the buggy
 * function survived: the bug only appears if you happen to be in the
 * timezone most of this site's Portuguese readers are in.
 *
 * So these assert the DAY OF MONTH survives, and the fixtures below are
 * deliberately chosen as dates whose day would shift under a negative UTC
 * offset. Vitest inherits the host timezone; `vitest.config.ts` does not pin
 * one, so a passing run here means "correct in whatever zone this machine
 * is in", and the explicit-offset cases below cover the rest.
 */
describe('formatPromulgated', () => {
	it('keeps the calendar day regardless of the viewer’s timezone', () => {
		// 1891-05-15 — Rerum Novarum, the corpus's canonical early encyclical.
		expect(formatPromulgated('1891-05-15', 'en')).toBe('May 15, 1891');
		expect(formatPromulgated('1891-05-15', 'pt')).toBe('15 de maio de 1891');
	});

	it('does not shift a date backwards at a negative UTC offset', () => {
		// The specific failure that motivated this module: at UTC-3 the old
		// implementation rendered 2026-05-15 as "May 14, 2026".
		const saved = process.env.TZ;
		try {
			process.env.TZ = 'America/Sao_Paulo';
			expect(formatPromulgated('2026-05-15', 'en')).toContain('15');
			expect(formatPromulgated('2026-05-15', 'en')).not.toContain('14');
		} finally {
			process.env.TZ = saved;
		}
	});

	it('picks the locale from the bare language tag', () => {
		// The REGION is cut off deliberately: the reader chose an interface
		// language and not a country, so `pt-BR` must format as Portuguese and
		// not as Brazil, and `en-GB` as English and not as the United Kingdom
		// (whose `dateStyle: 'long'` is "18 November 1965").
		expect(formatPromulgated('1965-11-18', 'pt-BR')).toBe('18 de novembro de 1965');
		expect(formatPromulgated('1965-11-18', 'en-GB')).toBe('November 18, 1965');
	});

	it('formats in any interface language the platform knows', () => {
		// The regression this guards is the two-language branch this module
		// carried while the interface grew to thirty-odd: every reader who was
		// not Portuguese got English month names, silently.
		expect(formatPromulgated('1965-11-18', 'pl')).toContain('listopada');
		expect(formatPromulgated('1965-11-18', 'de')).toContain('November 1965');
	});

	it('converts the app’s own tags before asking Intl about them', () => {
		// `zht` is this app's slug for Traditional Chinese and not BCP-47, and
		// cutting it to `zh` — which the region-stripping above would do to any
		// other tag — hands Intl the SIMPLIFIED locale. The conversion has to
		// run after the region goes and before the platform is asked.
		expect(dateLocale('zht')).toBe('zh-Hant');
	});

	it('falls back to English for a language Intl cannot resolve', () => {
		// Latin is the standing case — a real interface language of this site
		// with no CLDR data. What must NOT happen is the runtime's own default
		// locale leaking in, which is what an unchecked tag would do.
		expect(dateLocale('la')).toBe('en-US');
		expect(formatPromulgated('1965-11-18', 'la')).toBe('November 18, 1965');
	});

	it('returns the raw string unchanged when it is not a date', () => {
		// A corpus defect should stay visible rather than render "Invalid Date".
		expect(formatPromulgated('', 'en')).toBe('');
		expect(formatPromulgated('not-a-date', 'en')).toBe('not-a-date');
	});
});

describe('relativeDay', () => {
	it('names the three days a reader has a word for', () => {
		expect(relativeDay(0, 'en')).toBe('today');
		expect(relativeDay(-1, 'en')).toBe('yesterday');
		expect(relativeDay(1, 'en')).toBe('tomorrow');
	});

	it('is silent about every other day', () => {
		// The card prints the date for those, which already says it; "in 2
		// days" beside a date is the arithmetic, not a name.
		expect(relativeDay(2, 'en')).toBeUndefined();
		expect(relativeDay(-2, 'en')).toBeUndefined();
		expect(relativeDay(400, 'en')).toBeUndefined();
	});

	it('answers in the reader\u2019s own language', () => {
		// The whole reason this is `Intl` and not three dictionary keys.
		expect(relativeDay(0, 'pt')).toBe('hoje');
		expect(relativeDay(-1, 'pl')).toBe('wczoraj');
	});

	it('converts the app\u2019s own tags, and falls back where Intl cannot answer', () => {
		// `zht` must not be cut to `zh`, and Latin must reach English rather
		// than the runtime's default locale — `dateLocale`'s two cases, asked
		// again of the constructor that actually runs here.
		expect(relativeDay(0, 'zht')).toBe('今天');
		expect(relativeDay(0, 'la')).toBe('today');
	});
});
