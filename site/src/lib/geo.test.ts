import { describe, expect, it } from 'vitest';
import { openingTerritory } from './calendar-pref';
import { geoTerritory } from './geo';

/** A stand-in for `TERRITORY_CALENDARS`: what matters is that some codes name
 *  a published calendar and some do not. */
const PUBLISHED: Record<string, string> = {
	br: 'br',
	pt: 'pt',
	'gb-sct': 'gb-sct',
	il: 'ps'
};

describe('the country the edge resolved', () => {
	it('is the territory id, lowercased', () => {
		expect(geoTerritory('BR')).toBe('br');
		expect(geoTerritory('pt')).toBe('pt');
	});

	it('is nothing at all when Cloudflare had no answer to give', () => {
		expect(geoTerritory(undefined)).toBeUndefined();
		expect(geoTerritory('')).toBeUndefined();
	});

	it('passes through the non-answers rather than special-casing them', () => {
		// `XX` (unknown) and `T1` (a Tor exit) are shaped like country codes
		// and name no territory, so the client's filter is what stops them —
		// the same filter every unlisted country meets.
		expect(geoTerritory('XX')).toBe('xx');
		expect(geoTerritory('T1')).toBeUndefined();
		expect(openingTerritory(undefined, 'xx', PUBLISHED)).toBeUndefined();
	});

	it('refuses anything not shaped like a country code', () => {
		expect(geoTerritory('BRA')).toBeUndefined();
		expect(geoTerritory('b')).toBeUndefined();
	});

	describe('the United Kingdom, where a country code is not the answer', () => {
		it('resolves the three nations from the first-level region', () => {
			expect(geoTerritory('GB', 'SCT')).toBe('gb-sct');
			expect(geoTerritory('GB', 'wls')).toBe('gb-wls');
			expect(geoTerritory('GB', 'ENG')).toBe('gb-eng');
		});

		it('answers nothing without one, rather than picking the biggest', () => {
			// A reader in Glasgow shown England's calendar would be shown a
			// calendar somebody appears to have chosen for them.
			expect(geoTerritory('GB')).toBeUndefined();
			expect(geoTerritory('GB', 'NIR')).toBeUndefined();
		});
	});
});

describe('the calendar a page opens in', () => {
	// A `?c=` outranks both of these and is not tested here: the address
	// belongs to the page that has one, and `/calendarium` returns before it
	// reaches this function.
	it('prefers what the reader chose to where they are', () => {
		expect(openingTerritory('br', 'pt', PUBLISHED)).toBe('br');
	});

	it('treats a stored general calendar as the choice it is', () => {
		// The single most important line here: `??` and not `||`. A reader who
		// went back to the general calendar must not be re-homed by geography.
		expect(openingTerritory('general', 'br', PUBLISHED)).toBeUndefined();
	});

	it('falls to geolocation only where nothing is stored', () => {
		expect(openingTerritory(undefined, 'br', PUBLISHED)).toBe('br');
		expect(openingTerritory(undefined, 'gb-sct', PUBLISHED)).toBe('gb-sct');
	});

	it('stays general where a code names no published calendar', () => {
		// A held or withdrawn calendar and a country with none behave alike,
		// and so does a stored id that has stopped being published.
		expect(openingTerritory(undefined, 'de', PUBLISHED)).toBeUndefined();
		expect(openingTerritory('de', undefined, PUBLISHED)).toBeUndefined();
	});

	it('opens in the calendar a covered territory keeps, under its own id', () => {
		// `il` keeps the Latin Patriarchate's `ps`, and the page resolves that
		// through the map; what is remembered and shown is the territory.
		expect(openingTerritory(undefined, 'il', PUBLISHED)).toBe('il');
	});

	it('stays general with nothing to go on', () => {
		expect(openingTerritory(undefined, undefined, PUBLISHED)).toBeUndefined();
	});
});
