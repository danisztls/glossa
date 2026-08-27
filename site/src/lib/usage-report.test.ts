import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs script, no types, imported the way
// `sitemap.test.ts` and `build-xrefs.test.ts` import theirs.
import { render } from '../../scripts/usage.mjs';

/** A report's worth of rows, shaped as `collect()` returns them. */
function data(overrides: Record<string, unknown> = {}) {
	return {
		since: 30,
		totals: {
			sessions: 338,
			installed: 147,
			phone: 201,
			offline: 37,
			libraryFull: 88,
			swFail: 4,
			compared: 21,
			followedRefs: 96,
			usedJump: 140,
			jumpMiss: 19
		},
		daily: [
			{ day: '2026-08-25', n: 100 },
			{ day: '2026-08-26', n: 138 },
			{ day: '2026-08-27', n: 100 }
		],
		days28: [
			{ bucket: '1', n: 111 },
			{ bucket: '15-28', n: 41 }
		],
		visits: [{ bucket: '1', n: 200 }],
		age: [{ bucket: 'new', n: 180 }],
		entry: [{ bucket: 'deep', n: 220 }],
		minutes: [{ bucket: '5-15', n: 150 }],
		behind: [{ bucket: '0', n: 300 }],
		swFail: [{ bucket: 'quota', n: 3 }],
		missKind: [{ bucket: 'unknown-book', n: 11 }],
		missBook: [{ value: 'sir', n: 11 }],
		works: [
			{ value: 'ccc.pt', n: 128, withRefs: 48 },
			{ value: 'summa.la', n: 3, withRefs: 2 }
		],
		sections: [{ value: 'catechismus', n: 128 }],
		refKinds: [{ value: 'scripture', n: 71 }],
		geo: [
			{ country: 'BR', ui: 'pt', content: 'pt', n: 84 },
			{ country: 'PL', ui: 'pl', content: 'en', n: 22 }
		],
		...overrides
	};
}

describe('render', () => {
	it('says plainly when there is nothing yet', () => {
		const out = render(data({ totals: { sessions: 0 } }), { days: 30 });
		expect(out).toContain('No sessions recorded');
	});

	it('reports the retention question it was built to answer', () => {
		const out = render(data(), { days: 30 });
		expect(out).toContain('RETURN — days active of the last 28');
		expect(out).toMatch(/15-28\s+41\s+12%/);
		expect(out).toMatch(/1\s+111\s+33%/);
	});

	it('draws a daily sparkline, which is how a poisoned day becomes visible', () => {
		expect(render(data(), { days: 30 })).toMatch(/peak 138\/day over 3 day\(s\)/);
	});

	it('crosses interface language with content language per country', () => {
		const out = render(data(), { days: 30 });
		// The line this table exists for: chrome in Polish, content in English,
		// which is CONTENT_LANG_FALLBACK doing the work.
		expect(out).toContain('PL  chrome pl 22');
		expect(out).toContain('content en 22');
	});

	it('suppresses cells below the floor unless asked', () => {
		const quiet = render(data(), { days: 30, floor: 5 });
		expect(quiet).not.toContain('summa.la');
		const all = render(data(), { days: 30, floor: 5, all: true });
		expect(all).toContain('summa.la');
	});

	it('reports a jump-box miss against the jumps, not against every session', () => {
		// 19 of 140 is 14%; 19 of 338 would be 6% and would read as a jump box
		// that almost never fails.
		expect(render(data(), { days: 30 })).toMatch(/\.\.\.and it missed\s+19\s+14%/);
	});

	it('names the books readers asked for and did not get', () => {
		expect(render(data(), { days: 30 })).toContain('sir');
	});

	it('surfaces silent service worker failures', () => {
		const out = render(data(), { days: 30 });
		expect(out).toContain('sw install failed');
		expect(out).toContain('quota');
	});
});
