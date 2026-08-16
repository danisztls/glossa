import { describe, expect, it } from 'vitest';
import { formatPromulgated } from './dates';

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
		// `pt-PT` ordering and month case differ from `en-US`; anything that
		// isn't Portuguese falls through to English (the site has two UI
		// languages, and this mirrors how the rest of the chrome branches).
		expect(formatPromulgated('1965-11-18', 'pt-BR')).toBe('18 de novembro de 1965');
		expect(formatPromulgated('1965-11-18', 'en-GB')).toBe('November 18, 1965');
	});

	it('returns the raw string unchanged when it is not a date', () => {
		// A corpus defect should stay visible rather than render "Invalid Date".
		expect(formatPromulgated('', 'en')).toBe('');
		expect(formatPromulgated('not-a-date', 'en')).toBe('not-a-date');
	});
});
