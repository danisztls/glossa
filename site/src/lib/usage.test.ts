import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT_CACHE, measureLibrary } from './usage';

/** A CacheStorage stand-in holding a given number of entries. */
function fakeCaches(entries: number, opts: { denied?: boolean } = {}): CacheStorage {
	return {
		open: async () => {
			if (opts.denied) throw new DOMException('denied', 'SecurityError');
			return { keys: async () => new Array(entries).fill(undefined) };
		}
	} as unknown as CacheStorage;
}

describe('CONTENT_CACHE', () => {
	it('names the cache the service worker actually writes', () => {
		// `service-worker.ts` cannot be imported by a test — it reads
		// `$service-worker` at module scope and registers listeners as a side
		// effect of loading — so the constant is duplicated and checked here
		// instead. A drift would report every reader's library as `none`, which
		// looks exactly like a feature nobody uses.
		const source = readFileSync('src/service-worker.ts', 'utf8');
		const match = source.match(/const CONTENT_CACHE = '([^']+)'/);
		expect(match?.[1]).toBe(CONTENT_CACHE);
	});
});

describe('measureLibrary', () => {
	it('reports nothing held as none', async () => {
		expect(await measureLibrary(fakeCaches(0), 1000)).toBe('none');
	});

	it('reports a part of the tier as partial', async () => {
		expect(await measureLibrary(fakeCaches(400), 1000)).toBe('partial');
	});

	it('allows a nearly-complete library to count as full', async () => {
		// Not an exact match: a few files may be missing from a fetch the reader
		// never noticed, or added by a deploy since the fill. Calling those
		// readers `partial` would understate the feature this measures.
		expect(await measureLibrary(fakeCaches(950), 1000)).toBe('full');
		expect(await measureLibrary(fakeCaches(1000), 1000)).toBe('full');
		expect(await measureLibrary(fakeCaches(940), 1000)).toBe('partial');
	});

	it('reports none where storage is denied rather than throwing', async () => {
		// Private browsing, or a browser configured to block site data. Reading
		// works; there is simply no library to report.
		expect(await measureLibrary(fakeCaches(500, { denied: true }), 1000)).toBe('none');
	});

	it('reports none where there is no cache API at all', async () => {
		expect(await measureLibrary(undefined, 1000)).toBe('none');
	});

	it('does not call a library full merely because the tier is unknown', async () => {
		expect(await measureLibrary(fakeCaches(5), 0)).toBe('partial');
	});
});
