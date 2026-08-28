import { describe, expect, it } from 'vitest';
import {
	RECORD_MAX_DAYS,
	WINDOW_DAYS,
	classifyDevice,
	classifyEntry,
	countDays,
	daysBetween,
	parseDevice,
	refKindFor,
	rollDevice,
	isLocalHost,
	sectionFor,
	shouldCollect,
	type DeviceRecord
} from './usage-device';
import { bucketAge, bucketVisits } from './usage-schema';

describe('rollDevice', () => {
	it('starts a device on its first session', () => {
		expect(rollDevice(undefined, '2026-08-27')).toEqual({
			first: '2026-08-27',
			visits: 1,
			anchor: '2026-08-27',
			mask: 1
		});
	});

	it('counts a second session the same day without a second day', () => {
		const first = rollDevice(undefined, '2026-08-27');
		const second = rollDevice(first, '2026-08-27');
		expect(second.visits).toBe(2);
		expect(countDays(second.mask)).toBe(1);
	});

	it('records consecutive days as consecutive bits', () => {
		let record = rollDevice(undefined, '2026-08-25');
		record = rollDevice(record, '2026-08-26');
		record = rollDevice(record, '2026-08-27');
		expect(record.mask).toBe(0b111);
		expect(countDays(record.mask)).toBe(3);
		expect(record.visits).toBe(3);
	});

	it('leaves a gap where the reader was away', () => {
		let record = rollDevice(undefined, '2026-08-20');
		record = rollDevice(record, '2026-08-24');
		expect(record.mask).toBe(0b10001);
		expect(countDays(record.mask)).toBe(2);
	});

	it('lets days fall off the end of the window', () => {
		let record = rollDevice(undefined, '2026-01-01');
		for (let day = 2; day <= 40; day += 1) {
			const date = `2026-01-${String(day).padStart(2, '0')}`;
			record = rollDevice(
				record,
				day <= 31 ? date : `2026-02-${String(day - 31).padStart(2, '0')}`
			);
		}
		expect(countDays(record.mask)).toBe(WINDOW_DAYS);
		expect(record.visits).toBe(40);
		expect(record.first).toBe('2026-01-01');
	});

	it('clears the window after an absence longer than it', () => {
		// A 28-or-more-day shift is a no-op in 32-bit arithmetic, not a clear.
		// Without the guard a reader returning after two months would inherit a
		// month of activity they did not have.
		let record = rollDevice(undefined, '2026-01-01');
		record = rollDevice(record, '2026-01-02');
		record = rollDevice(record, '2026-06-01');
		expect(countDays(record.mask)).toBe(1);
		expect(record.visits).toBe(3);
	});

	it('treats a backwards clock as today rather than shifting negatively', () => {
		let record = rollDevice(undefined, '2026-08-27');
		record = rollDevice(record, '2026-08-20');
		expect(record.mask & 1).toBe(1);
		expect(record.visits).toBe(2);
		expect(countDays(record.mask)).toBeGreaterThan(0);
	});

	it('keeps the first-seen date across every roll', () => {
		let record = rollDevice(undefined, '2026-03-01');
		record = rollDevice(record, '2026-03-02');
		record = rollDevice(record, '2026-09-09');
		expect(record.first).toBe('2026-03-01');
	});
});

describe('daysBetween', () => {
	it('counts whole UTC days', () => {
		expect(daysBetween('2026-08-27', '2026-08-28')).toBe(1);
		expect(daysBetween('2026-08-27', '2026-08-27')).toBe(0);
		expect(daysBetween('2026-08-28', '2026-08-27')).toBe(-1);
		expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
	});

	it('reads an unparseable date as no distance', () => {
		expect(daysBetween('not-a-date', '2026-08-27')).toBe(0);
	});
});

describe('parseDevice', () => {
	const valid: DeviceRecord = { first: '2026-08-01', visits: 4, anchor: '2026-08-27', mask: 0b101 };

	it('accepts a record it wrote', () => {
		expect(parseDevice({ ...valid })).toEqual(valid);
	});

	it('reads anything else as a new device rather than throwing', () => {
		// Storage is the reader's to clear, corrupt or share between profiles.
		for (const raw of [
			null,
			undefined,
			'{}',
			42,
			{ ...valid, first: 'yesterday' },
			{ ...valid, anchor: 5 },
			{ ...valid, visits: -1 },
			{ ...valid, visits: Number.NaN },
			{ ...valid, mask: 1.5 }
		]) {
			expect(parseDevice(raw)).toBeUndefined();
		}
	});

	it('clamps a mask wider than the window', () => {
		expect(parseDevice({ ...valid, mask: 0xffffffff })?.mask).toBe((1 << WINDOW_DAYS) - 1);
	});
});

describe('classifyEntry', () => {
	it('names a search engine referral', () => {
		expect(
			classifyEntry('/scriptura/gen/1', 'https://www.google.com/', 'glossacatholica.org')
		).toBe('search');
		expect(classifyEntry('/', 'https://duckduckgo.com/?q=x', 'glossacatholica.org')).toBe('search');
	});

	it('reads an unrecognised external referrer as a deep link', () => {
		expect(classifyEntry('/catechismus/1', 'https://example.org/post', 'glossacatholica.org')).toBe(
			'deep'
		);
	});

	it('separates the library from one paragraph', () => {
		expect(classifyEntry('/', '', 'glossacatholica.org')).toBe('home');
		expect(classifyEntry('/catechismus/2357', '', 'glossacatholica.org')).toBe('deep');
	});

	it('ignores a same-origin referrer', () => {
		expect(classifyEntry('/', 'https://glossacatholica.org/preces', 'glossacatholica.org')).toBe(
			'home'
		);
	});

	it('reads an app referrer as the external referral it is', () => {
		// `android-app://com.google.android.gm` parses, with a host that is not
		// ours — someone followed a link out of their mail client, which is a
		// deep entry however unlike a web referrer it looks.
		expect(classifyEntry('/', 'android-app://com.google.android.gm', 'glossacatholica.org')).toBe(
			'deep'
		);
	});

	it('survives a referrer that is not a URL at all', () => {
		expect(classifyEntry('/', 'not a url', 'glossacatholica.org')).toBe('home');
	});
});

describe('classifyDevice', () => {
	it('splits on how much text fits on a line', () => {
		expect(classifyDevice(390)).toBe('phone');
		expect(classifyDevice(599)).toBe('phone');
		expect(classifyDevice(600)).toBe('tablet');
		expect(classifyDevice(1023)).toBe('tablet');
		expect(classifyDevice(1024)).toBe('desktop');
	});
});

describe('refKindFor', () => {
	it('reads the family off the address', () => {
		expect(refKindFor('/scriptura/gen/1')).toBe('scripture');
		expect(refKindFor('/catechismus/2357')).toBe('ccc');
		expect(refKindFor('/catechismus/compendium/12')).toBe('ccc');
		expect(refKindFor('/documenta/lumen-gentium')).toBe('document');
	});

	it('has no answer for a link that is not a citation', () => {
		expect(refKindFor('/colophon')).toBeUndefined();
		expect(refKindFor('/')).toBeUndefined();
	});
});

describe('sectionFor', () => {
	it('names the canonical sections and nothing else', () => {
		expect(sectionFor('/')).toBe('home');
		expect(sectionFor('/scriptura/gen/1')).toBe('scriptura');
		expect(sectionFor('/doctores/summa')).toBe('summa');
		expect(sectionFor('/catechismus/1234')).toBe('catechismus');
		// The Compendium is not its path's first segment; it keeps its own
		// bucket anyway, or the series reads zero instead of erroring.
		expect(sectionFor('/catechismus/compendium')).toBe('compendium');
		expect(sectionFor('/catechismus/compendium/39')).toBe('compendium');
		expect(sectionFor('/catechismus/compendium/caput/1')).toBe('compendium');
		expect(sectionFor('/colophon')).toBe('colophon');
		// The English roots deliberately resolve as invalid addresses; they are
		// not a section, and must not become one by being counted as one.
		expect(sectionFor('/bible/gen/1')).toBe('other');
	});
});

describe('SEARCH_HOSTS, via classifyEntry', () => {
	const from = (host: string) => classifyEntry('/', `https://${host}/`, 'glossacatholica.org');

	it('recognises the search hosts it means to', () => {
		for (const host of [
			'www.google.com',
			'google.com',
			'google.co.uk',
			'google.de',
			'images.google.com',
			'duckduckgo.com',
			'www.bing.com',
			'yandex.ru',
			'search.brave.com'
		]) {
			expect(from(host), host).toBe('search');
		}
	});

	it('does not mistake an app id or a lookalike for one', () => {
		for (const host of [
			'com.google.android.gm',
			'notgoogle.com',
			'google.example.org',
			'mybing.com.evil.net'
		]) {
			expect(from(host), host).toBe('deep');
		}
	});
});

describe('shouldCollect', () => {
	it('collects nothing from a developer machine', () => {
		// Three separate contexts, and only the first is caught by `dev`:
		// `npm run preview` and `wrangler dev` both serve production builds from
		// a laptop, where `import.meta.env.DEV` is already false.
		expect(shouldCollect('localhost', true, false)).toBe(false);
		expect(shouldCollect('localhost', false, false)).toBe(false);
		expect(shouldCollect('127.0.0.1', false, false)).toBe(false);
		expect(shouldCollect('[::1]', false, false)).toBe(false);
		expect(shouldCollect('glossa.local', false, false)).toBe(false);
	});

	it('collects from a real deployment', () => {
		expect(shouldCollect('glossacatholica.org', false, false)).toBe(true);
	});

	it('keeps collecting if the site moves to another domain', () => {
		// Deny-local, not allow-canonical. Listing the real hostname would fail
		// silently on a domain change, with a report that reads as "nobody
		// visited" rather than as an error.
		expect(shouldCollect('example.org', false, false)).toBe(true);
		expect(shouldCollect('glossa.pages.dev', false, false)).toBe(true);
	});

	it('can be forced on by hand for testing', () => {
		expect(shouldCollect('localhost', true, true)).toBe(true);
	});

	it('does not mistake a real host for a local one', () => {
		for (const host of ['notlocalhost.com', 'localhost.evil.net', 'my127.0.0.1.example']) {
			expect(isLocalHost(host), host).toBe(false);
		}
	});
});

describe('record expiry', () => {
	it('keeps a record for its whole permitted life', () => {
		let record = rollDevice(undefined, '2026-01-01');
		record = rollDevice(record, '2026-06-01');
		expect(record.first).toBe('2026-01-01');
		expect(record.visits).toBe(2);

		// The day before it expires, it is still the same record.
		const lastDay = new Date(
			Date.parse('2026-01-01T00:00:00Z') + (RECORD_MAX_DAYS - 1) * 86_400_000
		)
			.toISOString()
			.slice(0, 10);
		record = rollDevice(record, lastDay);
		expect(record.first).toBe('2026-01-01');
		expect(record.visits).toBe(3);
	});

	it('discards the whole record once it is a year old', () => {
		let record = rollDevice(undefined, '2026-01-01');
		record = rollDevice(record, '2026-06-01');
		const expiryDay = new Date(Date.parse('2026-01-01T00:00:00Z') + RECORD_MAX_DAYS * 86_400_000)
			.toISOString()
			.slice(0, 10);
		record = rollDevice(record, expiryDay);
		// Started over, not trimmed: half a record is not a shorter-lived one.
		expect(record).toEqual({ first: expiryDay, visits: 1, anchor: expiryDay, mask: 1 });
	});

	it('is an absolute lifetime, never renewed by visiting', () => {
		// A sliding window would keep a record alive forever for the readers who
		// visit most, which is what the lifetime condition exists to prevent.
		let record = rollDevice(undefined, '2026-01-01');
		for (let day = 0; day <= RECORD_MAX_DAYS; day += 1) {
			const date = new Date(Date.parse('2026-01-01T00:00:00Z') + day * 86_400_000)
				.toISOString()
				.slice(0, 10);
			record = rollDevice(record, date);
		}
		// Visited every single day, and it still expires on schedule.
		expect(record.first).not.toBe('2026-01-01');
		expect(record.visits).toBe(1);
	});

	it('costs the age bucket nothing, which is why a year is enough', () => {
		// `age` tops out at `90d+`, so any expiry past three months is invisible
		// to it. This is the argument for not cutting the window further.
		expect(bucketAge(RECORD_MAX_DAYS - 1)).toBe('90d+');
		expect(bucketAge(91)).toBe('90d+');
	});

	it('leaves a daily reader saturating the visits bucket before expiry', () => {
		// The field that actually wants the room. A daily reader reaches `100+`
		// inside four months and stays there.
		expect(bucketVisits(RECORD_MAX_DAYS)).toBe('100+');
	});
});
