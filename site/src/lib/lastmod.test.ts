import { describe, it, expect } from 'vitest';
import {
	fingerprint,
	resolveLastmod,
	CHANGE_CEILING,
	SITEMAP_LANGS
} from '../../scripts/lastmod.mjs';
import { CONTENT_LANG_FALLBACK } from './corpus';

/**
 * The property under test throughout is the one the sitemap's credibility rests
 * on: a date moves when, and only when, the text AT THAT URL moved — which,
 * since the sitemap advertises one URL per address and a crawler carries no
 * language preference, means the English text (see `SITEMAP_LANGS`). Every
 * other behaviour here (seeding, ordering, the change ceiling) exists to keep
 * that true in a case where it would otherwise quietly stop being true.
 */

type Fingerprints = Map<string, Map<string, { hashes: string[]; seed?: string }>>;

/** `[href, value, seed?, lang?]`; language defaults to the one a crawler is
 *  served, so a test that is not about language reads as if it were absent. */
function build(entries: Array<[string, unknown, string?, string?]>): Fingerprints {
	const map: Fingerprints = new Map();
	for (const [href, value, seed, lang] of entries)
		fingerprint(map, href, value, seed, lang ?? 'en');
	return map;
}

const TODAY = '2026-09-01';

describe('resolveLastmod', () => {
	it('carries an unchanged address forward rather than restamping it', () => {
		const first = resolveLastmod({
			fingerprints: build([['/catechismus/1', { n: 1, text: 'a' }, '2026-08-26']]),
			ledger: {},
			today: TODAY
		});
		const second = resolveLastmod({
			fingerprints: build([['/catechismus/1', { n: 1, text: 'a' }, '2026-08-26']]),
			ledger: first.entries,
			today: TODAY
		});
		expect(second.dates['/catechismus/1']).toBe('2026-08-26');
		expect(second.stats.changed).toBe(0);
		// The whole ledger, not just the date, must be reproducible — a rebuild
		// that changed no corpus data has to produce a byte-identical sitemap.
		expect(second.entries).toEqual(first.entries);
	});

	it('moves the date when the stored text moves, and only then', () => {
		const before = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { n: 1, text: 'a' }, '2026-08-26'],
				['/catechismus/2', { n: 2, text: 'b' }, '2026-08-26']
			]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { n: 1, text: 'CORRECTED' }, '2026-08-26'],
				['/catechismus/2', { n: 2, text: 'b' }, '2026-08-26']
			]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/catechismus/1']).toBe(TODAY);
		expect(after.dates['/catechismus/2']).toBe('2026-08-26');
		expect(after.stats.changed).toBe(1);
	});

	it('ignores an edition no consumer of the sitemap is served', () => {
		// Eight editions answer at /catechismus/330 and the sitemap advertises one
		// URL for it, which a crawler receives in English. A correction to the
		// German edition changes nothing that URL shows such a consumer, and
		// dating it from that correction is the inaccuracy Google discounts the
		// whole file for. This is the case the ledger was narrowed for.
		const before = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { text: 'a' }, '2026-08-26', 'en'],
				['/catechismus/330', { text: 'b' }, '2026-08-26', 'de']
			]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { text: 'a' }, '2026-08-26', 'en'],
				['/catechismus/330', { text: 'CORRECTED' }, '2026-08-26', 'de']
			]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/catechismus/330']).toBe('2026-08-26');
		expect(after.stats.changed).toBe(0);
	});

	it('moves the date when the English edition moves', () => {
		const before = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { text: 'a' }, '2026-08-26', 'en'],
				['/catechismus/330', { text: 'b' }, '2026-08-26', 'de']
			]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { text: 'CORRECTED' }, '2026-08-26', 'en'],
				['/catechismus/330', { text: 'b' }, '2026-08-26', 'de']
			]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/catechismus/330']).toBe(TODAY);
	});

	it('reads Latin where the corpus has no English, as the site does', () => {
		// `summa.la` covers four parts and `summa.en` five, so the fallback
		// resolves per address rather than per work — and an address English does
		// not answer at is still a real page, in Latin.
		const before = resolveLastmod({
			fingerprints: build([['/doctores/summa/i/1', { text: 'a' }, '2026-08-23', 'la']]),
			ledger: {},
			today: TODAY
		});
		expect(before.dates['/doctores/summa/i/1']).toBe('2026-08-23');
		const after = resolveLastmod({
			fingerprints: build([['/doctores/summa/i/1', { text: 'CORRECTED' }, '2026-08-23', 'la']]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/doctores/summa/i/1']).toBe(TODAY);
	});

	it('falls through to whatever answers, for a work in neither language', () => {
		// Seven documents are held only in Italian and Portuguese. `defaultWorkId`
		// ends "else any edition at all" rather than refusing to render, and a
		// page that shows text deserves a date; so does its correction.
		const before = resolveLastmod({
			fingerprints: build([
				['/documenta/orientales', { text: 'a' }, '2026-08-25', 'it'],
				['/documenta/orientales', { text: 'b' }, '2026-08-25', 'pt']
			]),
			ledger: {},
			today: TODAY
		});
		expect(before.dates['/documenta/orientales']).toBe('2026-08-25');
		const after = resolveLastmod({
			fingerprints: build([
				['/documenta/orientales', { text: 'a' }, '2026-08-25', 'it'],
				['/documenta/orientales', { text: 'CORRECTED' }, '2026-08-25', 'pt']
			]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/documenta/orientales']).toBe(TODAY);
	});

	it('reads a regional tag as its language, so en-gb is English', () => {
		// `prayer.common.en-gb` answers beside `prayer.common.en`; both are the
		// English text at that address and neither is a separate URL.
		const before = resolveLastmod({
			fingerprints: build([['/preces/ave-maria', { text: 'a' }, '2026-08-24', 'en-GB']]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([['/preces/ave-maria', { text: 'CORRECTED' }, '2026-08-24', 'en-GB']]),
			ledger: before.entries,
			today: TODAY
		});
		expect(before.dates['/preces/ave-maria']).toBe('2026-08-24');
		expect(after.dates['/preces/ave-maria']).toBe(TODAY);
	});

	it('does not depend on the order editions happen to be read in', () => {
		const one = resolveLastmod({
			fingerprints: build([
				['/scriptura/gen/1', { text: 'cpdv' }],
				['/scriptura/gen/1', { text: 'douay' }]
			]),
			ledger: {},
			today: TODAY
		});
		const other = resolveLastmod({
			fingerprints: build([
				['/scriptura/gen/1', { text: 'douay' }],
				['/scriptura/gen/1', { text: 'cpdv' }]
			]),
			ledger: {},
			today: TODAY
		});
		expect(other.entries).toEqual(one.entries);
	});

	it('seeds a new address from the corpus rather than from the build clock', () => {
		const resolved = resolveLastmod({
			fingerprints: build([['/doctores/summa/i/1', { n: 1 }, '2026-08-23']]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/doctores/summa/i/1']).toBe('2026-08-23');
		expect(resolved.stats.unseeded).toBe(0);
	});

	it('seeds from the edition it reads, not the last one ingested', () => {
		// The Malagasy Catechism landed three days after the English one. It is
		// not evidence about when the English text at /catechismus/1 last moved,
		// and taking the later date would overstate it on 2,865 addresses.
		const resolved = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { text: 'a' }, '2026-08-23', 'en'],
				['/catechismus/1', { text: 'b' }, '2026-08-26', 'mg']
			]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/catechismus/1']).toBe('2026-08-23');
	});

	it('takes the latest English edition where two answer at one address', () => {
		// The CPDV and the Douay-Rheims both answer at /scriptura/gen/1 and the
		// edition menu offers both there, so the address is as new as the newer.
		const resolved = resolveLastmod({
			fingerprints: build([
				['/scriptura/gen/1', { text: 'cpdv' }, '2026-08-23', 'en'],
				['/scriptura/gen/1', { text: 'douay' }, '2026-08-24', 'en']
			]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/scriptura/gen/1']).toBe('2026-08-24');
	});

	it('counts an address it could not seed, so a non-git corpus is visible', () => {
		const resolved = resolveLastmod({
			fingerprints: build([['/preces/ave-maria', { slug: 'ave-maria' }]]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/preces/ave-maria']).toBe(TODAY);
		expect(resolved.stats.unseeded).toBe(1);
	});

	it('drops an address the corpus no longer has, and says so', () => {
		const resolved = resolveLastmod({
			fingerprints: build([['/catechismus/1', { n: 1 }, '2026-08-26']]),
			ledger: { '/catechismus/1': '2026-08-26 aaaaaaaa', '/catechismus/2': '2026-08-26 bbbbbbbb' },
			today: TODAY
		});
		expect(resolved.dates['/catechismus/2']).toBeUndefined();
		expect(resolved.stats.removed).toBe(1);
	});

	it('writes entries in path order, so a one-paragraph fix is a one-line diff', () => {
		const resolved = resolveLastmod({
			fingerprints: build([
				['/catechismus/2', { n: 2 }],
				['/catechismus/1', { n: 1 }],
				['/catechismus/10', { n: 10 }]
			]),
			ledger: {},
			today: TODAY
		});
		expect(Object.keys(resolved.entries)).toEqual([
			'/catechismus/1',
			'/catechismus/10',
			'/catechismus/2'
		]);
	});

	it('reports a share of change the caller can hold to a ceiling', () => {
		// A grammar change that leaked into the fingerprint would look like
		// this: every known address moving at once. The ceiling is what stops
		// it reaching the sitemap; see sync-corpus.mjs.
		const before = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { text: 'a' }],
				['/catechismus/2', { text: 'b' }],
				['/catechismus/3', { text: 'c' }],
				['/catechismus/4', { text: 'd' }]
			]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { text: 'a!' }],
				['/catechismus/2', { text: 'b!' }],
				['/catechismus/3', { text: 'c!' }],
				['/catechismus/4', { text: 'd!' }]
			]),
			ledger: before.entries,
			today: TODAY
		});
		const known = after.stats.total - after.stats.added;
		expect(after.stats.changed / known).toBeGreaterThan(CHANGE_CEILING);
	});
});

describe('SITEMAP_LANGS', () => {
	// lastmod.mjs is plain .mjs run by the sync and cannot import corpus.ts, so
	// the row is copied. A divergence would be silent and corpus-wide: every
	// address dated from an edition the crawler is not served.
	it('is the chain an English reader resolves through', () => {
		expect(SITEMAP_LANGS).toEqual(CONTENT_LANG_FALLBACK.en);
	});
});
