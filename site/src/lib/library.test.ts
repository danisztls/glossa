import { describe, expect, it } from 'vitest';
import { formatBytes, heldPaths, libraryRows, libraryTotal } from './library';
import type { ContentEntry, Wave, WaveId } from './sw-policy';

const ORIGIN = 'https://glossacatholica.org';

function asset(path: string, bytes: number): ContentEntry {
	return { workId: 'w', kind: 'k', lang: 'en', bytes, citedBy: 0, url: path, path };
}

function wave(id: WaveId, assets: ContentEntry[]): Wave {
	const bytes = assets.reduce((sum, a) => sum + a.bytes, 0);
	return { id, automatic: false, assets, bytes, autoAssets: [], autoBytes: 0 };
}

describe('libraryRows', () => {
	it('counts what the device already holds, by path', () => {
		const waves = [wave('scripture', [asset('/a.json', 100), asset('/b.json', 400)])];
		const [row] = libraryRows(waves, new Set(['/a.json']));
		expect(row).toMatchObject({
			id: 'scripture',
			count: 2,
			heldCount: 1,
			bytes: 500,
			heldBytes: 100,
			complete: false
		});
	});

	it('is complete only when every file is present', () => {
		const waves = [wave('summa', [asset('/a.json', 1), asset('/b.json', 0)])];
		// Byte totals match with a file missing — a zero-byte asset is enough
		// to make `heldBytes === bytes` a lie, so the flag counts files.
		expect(libraryRows(waves, new Set(['/a.json']))[0].complete).toBe(false);
		expect(libraryRows(waves, new Set(['/a.json', '/b.json']))[0].complete).toBe(true);
	});

	/** The prefetch either side of the open page is not a shelf: it is a
	 *  different set on every navigation, and already automatic. */
	it('never offers the neighbours wave', () => {
		const waves = [wave('neighbours', [asset('/a.json', 10)])];
		expect(libraryRows(waves, new Set())).toEqual([]);
	});

	/** A reader whose language chain has no Summa has no Summa to download,
	 *  and a row saying "0 MB" is a row about a work they cannot have. */
	it('drops a wave with nothing in it', () => {
		const waves = [wave('summa', []), wave('catechism', [asset('/c.json', 5)])];
		expect(libraryRows(waves, new Set()).map((r) => r.id)).toEqual(['catechism']);
	});

	/**
	 * The rows are READ in a different order from the one they download in,
	 * and this is the pair that makes the difference visible: `WAVE_ORDER`
	 * puts `illustrations` last of the real waves because 103 MB of engravings
	 * is the lowest value per byte in the corpus, while a reader looking at
	 * the panel reads Doré's plates as a thing about the Bible.
	 */
	it('reads the shelves in their own order, plates beside the Bible', () => {
		const waves = [
			wave('essentials', [asset('/e.json', 1)]),
			wave('catechism', [asset('/c.json', 1)]),
			wave('scripture', [asset('/s.json', 1)]),
			wave('magisterium', [asset('/m.json', 1)]),
			wave('summa', [asset('/t.json', 1)]),
			wave('illustrations', [asset('/i.avif', 1)])
		];
		expect(libraryRows(waves, new Set()).map((r) => r.id)).toEqual([
			'essentials',
			'catechism',
			'scripture',
			'illustrations',
			'magisterium',
			'summa'
		]);
	});

	/** A wave this list has never heard of still gets a row — at the end,
	 *  which is where `other` belongs anyway. */
	it('sorts an unplaced wave last rather than dropping it', () => {
		const waves = [wave('other', [asset('/o.json', 1)]), wave('summa', [asset('/t.json', 1)])];
		expect(libraryRows(waves, new Set()).map((r) => r.id)).toEqual(['summa', 'other']);
	});
});

describe('heldPaths', () => {
	/**
	 * The mismatch this exists to prevent: a cache key is an absolute href and
	 * a `ContentEntry.path` is a pathname, so comparing them raw matches
	 * nothing, every row reads zero, and nothing errors — the same silent
	 * class `contentPath` is written about one layer down.
	 */
	it('reduces absolute cache keys to the pathnames the plan uses', () => {
		const held = heldPaths([{ url: `${ORIGIN}/_app/immutable/assets/gen.json` }]);
		expect(held.has('/_app/immutable/assets/gen.json')).toBe(true);
	});

	it('ignores a key that is not a URL', () => {
		expect(heldPaths([{ url: 'not a url' }]).size).toBe(0);
	});
});

describe('libraryTotal', () => {
	it('sums the rows', () => {
		const rows = libraryRows(
			[
				wave('essentials', [asset('/a.json', 100)]),
				wave('scripture', [asset('/b.json', 900), asset('/c.json', 1000)])
			],
			new Set(['/a.json', '/b.json'])
		);
		expect(libraryTotal(rows)).toEqual({ bytes: 2000, heldBytes: 1000, complete: false });
	});

	/** Nothing offered is not "everything downloaded" — an empty corpus must
	 *  not report a finished library. */
	it('is not complete with no rows at all', () => {
		expect(libraryTotal([]).complete).toBe(false);
	});

	it('is complete when every row is', () => {
		const rows = libraryRows([wave('essentials', [asset('/a.json', 10)])], new Set(['/a.json']));
		expect(libraryTotal(rows).complete).toBe(true);
	});
});

describe('formatBytes', () => {
	it('reads megabytes to one decimal and kilobytes whole', () => {
		expect(formatBytes(24_100_000, 'en')).toBe('24.1 MB');
		expect(formatBytes(340_000, 'en')).toBe('340 KB');
		expect(formatBytes(512, 'en')).toBe('512 B');
	});

	/** The reader's own number formatting, not the browser's: the panel says
	 *  `24,1` everywhere else for a Portuguese reader. */
	it('formats the number in the interface language', () => {
		expect(formatBytes(24_100_000, 'pt')).toBe('24,1 MB');
		expect(formatBytes(24_100_000, 'de')).toBe('24,1 MB');
	});

	it('still renders under a malformed language tag', () => {
		expect(formatBytes(1_500_000, 'not a tag')).toBe('1.5 MB');
	});
});
