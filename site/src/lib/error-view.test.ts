import { describe, expect, it } from 'vitest';
import { errorView } from './error-view';

describe('errorView', () => {
	it('answers a missing address with NotFound, offline or not', () => {
		// Turning the switch off would not conjure an address that does not exist.
		expect(errorView(404, false)).toBe('not-found');
		expect(errorView(404, true)).toBe('not-found');
	});

	it('answers a throw in offline mode with the switch', () => {
		expect(errorView(500, true)).toBe('not-downloaded');
	});

	it('answers a throw while ONLINE with the retry, never with NotFound', () => {
		// The regression this file exists for: until 2026-09-03 this case fell
		// through to NotFound, so a dropped fetch told the reader their address
		// does not exist and sent them away from a page one retry from working.
		expect(errorView(500, false)).toBe('load-failed');
	});

	it('treats every non-404 status as a throw', () => {
		for (const status of [400, 403, 408, 429, 500, 502, 503, 504]) {
			expect(errorView(status, false), `status ${status}`).toBe('load-failed');
			expect(errorView(status, true), `status ${status}`).toBe('not-downloaded');
		}
	});
});
