import { describe, it, expect } from 'vitest';
import { fingerprint, resolveLastmod, CHANGE_CEILING } from '../../scripts/lastmod.mjs';

/**
 * The property under test throughout is the one the sitemap's credibility rests
 * on: a date moves when, and only when, the text at that address moved. Every
 * other behaviour here (seeding, ordering, the change ceiling) exists to keep
 * that true in a case where it would otherwise quietly stop being true.
 */

type Fingerprints = Map<string, { hashes: string[]; seed?: string }>;

function build(entries: Array<[string, unknown, string?]>): Fingerprints {
	const map: Fingerprints = new Map();
	for (const [href, value, seed] of entries) fingerprint(map, href, value, seed);
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

	it('treats a change in ANY edition at an address as a change there', () => {
		// Eight editions answer at /catechismus/330. A correction to the German
		// one is a change at that address even though seven are untouched.
		const before = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { lang: 'en', text: 'a' }, '2026-08-26'],
				['/catechismus/330', { lang: 'de', text: 'b' }, '2026-08-26']
			]),
			ledger: {},
			today: TODAY
		});
		const after = resolveLastmod({
			fingerprints: build([
				['/catechismus/330', { lang: 'en', text: 'a' }, '2026-08-26'],
				['/catechismus/330', { lang: 'de', text: 'CORRECTED' }, '2026-08-26']
			]),
			ledger: before.entries,
			today: TODAY
		});
		expect(after.dates['/catechismus/330']).toBe(TODAY);
	});

	it('does not depend on the order editions happen to be read in', () => {
		const one = resolveLastmod({
			fingerprints: build([
				['/scriptura/gen/1', { lang: 'en' }],
				['/scriptura/gen/1', { lang: 'la' }]
			]),
			ledger: {},
			today: TODAY
		});
		const other = resolveLastmod({
			fingerprints: build([
				['/scriptura/gen/1', { lang: 'la' }],
				['/scriptura/gen/1', { lang: 'en' }]
			]),
			ledger: {},
			today: TODAY
		});
		expect(other.entries).toEqual(one.entries);
	});

	it('seeds a new address from the corpus rather than from the build clock', () => {
		const resolved = resolveLastmod({
			fingerprints: build([['/summa/i/1', { n: 1 }, '2026-08-23']]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/summa/i/1']).toBe('2026-08-23');
		expect(resolved.stats.unseeded).toBe(0);
	});

	it('takes the latest contributing work when editions were ingested apart', () => {
		const resolved = resolveLastmod({
			fingerprints: build([
				['/catechismus/1', { lang: 'en' }, '2026-08-23'],
				['/catechismus/1', { lang: 'mg' }, '2026-08-26']
			]),
			ledger: {},
			today: TODAY
		});
		expect(resolved.dates['/catechismus/1']).toBe('2026-08-26');
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
